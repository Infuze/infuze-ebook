
import gulp from 'gulp';
import fs from 'fs';
import plumber from "gulp-plumber";
import browserSync from 'browser-sync';
import browserify from 'browserify';
const babel = require('gulp-babel');
import babelify from 'babelify';
import source from 'vinyl-source-stream';
import buffer from 'vinyl-buffer';
import plugins from 'gulp-load-plugins';
const sass = require('gulp-sass');
const concat = require('gulp-concat');
import autoprefixer from 'gulp-autoprefixer';
const newer = require("gulp-newer");
const merge = require("merge-stream");
import replace from 'gulp-replace';
const htmlmin = require('gulp-htmlmin');
const cleanCSS = require('gulp-clean-css');
const uglify = require("gulp-uglify");
var runSequence = require('run-sequence');
var rename = require("gulp-rename");
var gzip = require('gulp-gzip');
var minimist = require('minimist');
const packConfig = require("./pack-config.json");
const del = require('del');

const packs = packConfig.packs;
let filteredPack;

/**
 * Default task commands
 * gulp --book 1 (builds book 1 into deploy folder)
 * gulp --book 1,2,4 (builds books 1, 2 & 4 into deploy folder)
 * gulp --book all (builds all books into deploy folder)
 */
gulp.task('default', () => {
    const args = process.argv.slice(2);
    const options = minimist(args, {
        string: 'book',
        default: { env: process.env.NODE_ENV || 'production' }
    });

    // ERROR with gulp command
    if (!options.book) {
        console.log('Gulp must contain --book arg. For example, Gulp --book 1,2');
        return;
    }

    const bookNumbers = options.book.split(',');

    if (bookNumbers.length === 1 && bookNumbers[0] === 'all') {
        // ALL packs
        filteredPack = packs;
    } else {
        // Filtered packs
        filteredPack = packs.filter(
            function (pack) {
                return this.indexOf(String(pack.number)) >= 0;
            },
            bookNumbers
        );
    }

    if (filteredPack.length) {
        gulp.start('deploy-seq');
    }
});

gulp.task('deploy-seq', function (callback) {
    //runSequence('clean-book', callback);
    runSequence('clean-book', 'copy-book-folder', 'copy-common-folder', 'update-html', callback);
});

gulp.task('dev', ['scripts', 'sass', 'fonts', 'ebook-css-images', 'images', 'html', 'folders', 'iquiz'], () => {
    //browserSync({
    browserSync({
        'server': './',
        startPath: "books/0-example/index.html#/task1/slides/0",
        'snippetOptions': {
            'rule': {
                'match': /<\/body>/i,
                'fn': (snippet) => snippet
            }
        }
    });
    gulp.watch('./src/ebook/scss/**/*.scss', ['sass', browserSync.reload]);
    gulp.watch('./src/ebook/js/**/*.js', ['scripts', browserSync.reload]);
    gulp.watch('./src/iquiz/scss/**/*.scss', ['sass', browserSync.reload]);
    gulp.watch('./src/iquiz/js/**/*.js', ['scripts', browserSync.reload]);
    gulp.watch('./src/example/js/**/*.js', ['scripts', browserSync.reload]);
    gulp.watch('./src/example/css/**/*.scss', ['sass', browserSync.reload]);
    gulp.watch('./src/example/*.html', ['html', browserSync.reload]);
});
/* ----------------- */
/* Scripts
/* ----------------- */
gulp.task('scripts', () => {
    return browserify({
        'entries': ['./src/example/js/index.js'],
        'debug': true,
        'sourceMaps': true,
        'transform': [
            babelify.configure({
                'presets': ['es2015']
            })
        ]
    })
        .bundle()
        .on('error', function () {
            var args = Array.prototype.slice.call(arguments);
            plugins().notify.onError({
                'title': 'Compile Error',
                'message': '<%= error.message %>'
            }).apply(this, args);
            this.emit('end');
        })
        .pipe(plumber({ errorHandler: onError }))
        .pipe(source('bundle.min.js'))
        .pipe(buffer())
        .pipe(plugins().sourcemaps.init({ 'loadMaps': true }))
        .pipe(uglify().on('error', function (e) {
            console.log(e);
        }))
        .pipe(plugins().sourcemaps.write('.'))
        .pipe(gulp.dest('./books/_common/js/'))
        .pipe(browserSync.stream());
});
/* ----------------- */
/* SASS
/* ----------------- */
gulp.task('sass', () => {
    return gulp.src('./src/example/css/styles.scss')
        .pipe(plumber({ errorHandler: onError }))
        .pipe(plugins().sourcemaps.init())
        .pipe(sass({ // Compile Sass using LibSass.
            errLogToConsole: true,
            outputStyle: "expanded" // Options: nested, expanded, compact, compressed
        }).on('error', sass.logError))
        .pipe(plugins().sourcemaps.write())
        .pipe(gulp.dest('./books/_common/css/'))
        .pipe(sass({ // Compile Sass using LibSass.
            errLogToConsole: true,
            outputStyle: "compressed" // Options: nested, expanded, compact, compressed
        }))
        .pipe(rename({ suffix: '.min' })) // Append our suffix to the name
        //.pipe(concat('styles.css'))
        .pipe(autoprefixer({
            browsers: 'last 2 versions'
        }))
        .pipe(cleanCSS())
        .pipe(gzip())
        .pipe(gulp.dest('./books/_common/css/'))
        .pipe(browserSync.stream());
});
/* ----------------- * /
/* Fonts
/* ----------------- */
gulp.task("fonts", () => {
    let dest = "books/_common/css/fonts";
    let path1 = gulp.src("src/example/css/fonts/**/*")
        .pipe(newer(dest))
        .pipe(gulp.dest(dest));
    let path2 = gulp.src("src/ebook/scss/fonts/**/*")
        .pipe(newer(dest))
        .pipe(gulp.dest(dest));
    let path3 = gulp.src("src/iquiz/scss/fonts/**/*")
        .pipe(newer(dest))
        .pipe(gulp.dest(dest));
    return merge(path1, path2, path3);
});
/* ----------------- * /
/* CSS images
/* ----------------- */
gulp.task("ebook-css-images", () => {
    gulp
        .src(["src/ebook/scss/images/**/*"])
        .pipe(
            plumber({
                errorHandler: onError
            })
        )
        .pipe(gulp.dest("books/_common/css/images"));
});
/* ----------------- */
/* Images
/* ----------------- */
gulp.task("images", () => {
    var imgSrc = ["./src/example/images/**/*"],
        imgDst = "./books/0-example/images";
    return (
        gulp
            .src(imgSrc)
            .pipe(newer(imgDst))
            .pipe(
                plumber({
                    errorHandler: onError
                })
            )
            .pipe(gulp.dest(imgDst))
    );
});
/* ----------------- */
/* HTML
/* ----------------- */
gulp.task("html", () => {
    return gulp
        .src("src/example/*.html")
        .pipe(newer("books/0-example"))
        .pipe(gulp.dest("books/0-example"))
        .pipe(browserSync.stream());
});
/* ----------------- * /
/* Other root folders
/* ----------------- */
gulp.task("folders", () => {
    gulp
        .src(["src/example/libs/**/*"])
        .pipe(
            plumber({
                errorHandler: onError
            })
        )
        .pipe(gulp.dest("books/_common/libs"));
});
/* ----------------- */
/* IQuiz assets
/* ----------------- */
gulp.task("iquiz", () => {
    var imgSrc = ["./src/example/iquiz_assets/**/*"],
        imgDst = "./books/0-example/iquiz_assets";
    return (
        gulp
            .src(imgSrc)
            .pipe(newer(imgDst))
            .pipe(
                plumber({
                    errorHandler: onError
                })
            )
            .pipe(gulp.dest(imgDst))
    );
});
// Gulp plumber error handler
var onError = function (err) {
    console.log(err);
};






gulp.task('clean-book', function () {

    filteredPack.map(pack => {
        console.log('pack >>>>>>>>>>>>>>>>>>', pack);
        // set pack folder name

        let delDest = 'deploy/' + pack.folder + '/**';
        console.log('delDest >>>>>>>>>>>>>>>>>>', delDest);
        del.sync([delDest, '!deploy'])
    })
});
gulp.task('copy-book-folder', () => {
    console.log('build-book ');

    let jsBundleStreams = [];

    filteredPack.map(pack => {
        console.log('pack:', pack);
        // set pack folder name

        jsBundleStreams.push(
            gulp
                .src('books/' + pack.folder + '/**')
                .pipe(newer('deploy/' + pack.folder))
                .pipe(plumber({ errorHandler: onError }))
                .pipe(gulp.dest('deploy/' + pack.folder))
        );
    })
    return merge(jsBundleStreams);
});
gulp.task('copy-common-folder', () => {
    console.log('build-book ');

    let jsBundleStreams = [];

    filteredPack.map(pack => {
        console.log('pack:', pack);
        // set pack folder name

        jsBundleStreams.push(
            gulp
                .src(['books/_common/**', '!books/_common/js/bundle.min.js.map', '!books/_common/css/styles.min.css.gz', '!books/_common/css/styles.css'])
                .pipe(newer('deploy/' + pack.folder + '/assets'))
                .pipe(plumber({ errorHandler: onError }))
                .pipe(gulp.dest('deploy/' + pack.folder + '/assets'))
        );
    })
    return merge(jsBundleStreams);
});
gulp.task('update-html', () => {
    console.log('build-book ');

    let jsBundleStreams = [];

    filteredPack.map(pack => {
        console.log('pack:', pack);
        // set pack folder name

        jsBundleStreams.push(
            gulp
                .src('deploy/' + pack.folder + '/index.html', { base: "./" })
                .pipe(replace('../_common', './assets'))
                .pipe(replace('./assets/css/styles.css', './assets/css/styles.min.css'))
                .pipe(htmlmin({ collapseWhitespace: false, removeComments: true }))
                .pipe(plumber({ errorHandler: onError }))
                .pipe(gulp.dest('./'))
        );
    })
    return merge(jsBundleStreams);
});




/* ----------------- */
/* Build Pack
/* ----------------- */
gulp.task('pack', function (callback) {
    runSequence('clean', 'copy-pack', 'copy-content', 'create-zip', callback);
});
gulp.task('clean', function () {
    del.sync(['pack/**', '!pack'])
});

gulp.task("copy-pack", () => {

    if (!fs.existsSync('pack'))
        fs.mkdirSync('pack'), console.log("📁  folder created:", 'pack');

    let jsBundleStreams = [];
    // Create pack folder and Contents folder
    if (!fs.existsSync(packDir))
        fs.mkdirSync(packDir), console.log("📁  folder created:", packDir);

    // Add content pack files
    let packSrc = `src/imsmanifest/**`,
        packDest = `${packDir}`;
    jsBundleStreams.push(
        gulp
            .src(packSrc)
            .pipe(newer(packDest))
            .pipe(plumber({ errorHandler: onError }))
            .pipe(gulp.dest(packDest))
    );
    return merge(jsBundleStreams);
})





gulp.task("build-pack", () => {

    packConfig.packs.map(pack => {
        // set pack folder name
        let title = pack.title.toLowerCase();
        title = title.replace(/,/g, "");
        title = title.replace(/\s/g, "-");
        let folder = title;
        let dir = "pack/" + folder;
        //console.log('📁  dir:', dir);

        // Create pack folder and Contents folder
        if (!fs.existsSync(dir))
            fs.mkdirSync(dir), console.log("📁  folder created:", dir);

        // Add content pack files
        let packSrc = `src/imsmanifest/**`,
            packDest = `${dir}`;
        jsBundleStreams.push(
            gulp
                .src(packSrc)
                .pipe(newer(packDest))
                .pipe(plumber({ errorHandler: onError }))
                .pipe(gulp.dest(packDest))
        );

        // Add imsmanifest
        /* let manifestSrc = `src/imsmanifest.xml`,
            manifestDest = `${dir}`;
        jsBundleStreams.push(
            gulp
                .src(manifestSrc)
                .pipe(newer(manifestDest))
                .pipe(plumber({ errorHandler: onError }))
                .pipe(gulp.dest(manifestDest))
        ); */

        let contentDir = dir + "/contents";
        if (!fs.existsSync(contentDir))
            fs.mkdirSync(contentDir), console.log("📁  folder created:", contentDir);

        // Add dest files to Content folder
        let filesSrc = `deploy/**`,
            filesDist = `${contentDir}`;
        jsBundleStreams.push(
            gulp
                .src(filesSrc)
                .pipe(newer(filesDist))
                .pipe(plumber({ errorHandler: onError }))
                .pipe(gulp.dest(filesDist))
        );


        jsBundleStreams.push(
            gulp.src(`${dir}/*`)
                .pipe(zip(`${folder}.zip`))
                .pipe(gulp.dest('pack'))
        )
    });

    return merge(jsBundleStreams);
});





