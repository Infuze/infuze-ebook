
import gulp from 'gulp';
import fs from 'fs';
import plumber from "gulp-plumber";
import replace from 'gulp-replace';

const newer = require("gulp-newer");
const merge = require("merge-stream");
const zip = require('gulp-zip');
const del = require('del');
const packConfig = require("./pack-config.json");
const sass = require('gulp-sass');
sass.compiler = require('node-sass');
const uglify = require("gulp-uglify");
const concat = require('gulp-concat');
import autoprefixer from 'gulp-autoprefixer';
const imagemin = require('gulp-imagemin');
const changed = require('gulp-changed');

import critical from 'critical';
import babelify from 'babelify';
import browserSync from 'browser-sync';
import browserify from 'browserify';
import buffer from 'vinyl-buffer';
import plugins from 'gulp-load-plugins';
import source from 'vinyl-source-stream';
import rename from 'gulp-rename';
var runSequence = require('run-sequence');
const htmlmin = require('gulp-htmlmin');

let title = packConfig.packs[0].title;
console.log('title ', title)
title = title.replace(/,/g, "");
title = title.replace(/\s/g, "-");
let packDir = "pack/" + title;



/* ----------------- */
/* Scripts
/* ----------------- */
gulp.task('scripts', () => {
    return browserify({
        'entries': ['./src/example/js/index.js'],
        'debug': true,
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
        .pipe(source('bundle.js'))
        .pipe(buffer())
        .pipe(plugins().sourcemaps.init({ 'loadMaps': true }))
        .pipe(plugins().sourcemaps.write('.'))
        .pipe(gulp.dest('./build/js/'))
        .pipe(browserSync.stream());
});
gulp.task('scripts-min', () => {
    return browserify({
        'entries': ['./src/example/js/index.js'],
        'debug': false,
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
        .pipe(source('bundle.js'))
        .pipe(buffer())
        .pipe(uglify())
        .pipe(gulp.dest('./deploy/js/'))
});


/* ----------------- */
/* SASS
/* ----------------- */
gulp.task('sass', () => {
    return gulp.src('./src/example/css/styles.scss')
        .pipe(plugins().sourcemaps.init())
        .pipe(sass().on('error', sass.logError))
        .pipe(concat('styles.css'))
        .pipe(autoprefixer())
        .pipe(plugins().sourcemaps.write())
        .pipe(gulp.dest('./build/css/'))
        .pipe(browserSync.stream());
});
gulp.task('sass-min', () => {
    return gulp.src('./src/example/css/styles.scss')
        .pipe(sass({ outputStyle: 'compressed' }).on('error', sass.logError))
        .pipe(concat('styles.css'))
        .pipe(autoprefixer())
        .pipe(gulp.dest('./deploy/css/'))
});



/* ----------------- */
/* HTML
/* ----------------- */
gulp.task("html", () => {
    return gulp
        .src("src/example/*.html")
        .pipe(newer("build"))
        .pipe(gulp.dest("build"))
        .pipe(browserSync.stream());
});
gulp.task("html-min", () => {
    return gulp
        .src("src/example/*.html")
        .pipe(htmlmin({ collapseWhitespace: true, removeComments: true }))
        .pipe(gulp.dest("deploy"))
        .pipe(browserSync.stream())
});

/* ----------------- * /
/* Fonts
/* ----------------- */
gulp.task("fonts", () => {
    gulp
        .src(["src/example/css/fonts/**/*"])
        .pipe(
            plumber({
                errorHandler: onError
            })
        )
        .pipe(changed("build/css/fonts"))
        .pipe(gulp.dest("build/css/fonts"));
});
gulp.task("fonts-min", () => {
    gulp
        .src(["src/example/css/fonts/**/*"])
        .pipe(
            plumber({
                errorHandler: onError
            })
        )
        .pipe(changed("deploy/css/fonts"))
        .pipe(gulp.dest("deploy/css/fonts"));
});

/* ----------------- * /
/* CSS images
/* ----------------- */
gulp.task("css-images", () => {
    gulp
        .src(["src/example/css/images/**/*"])
        .pipe(
            plumber({
                errorHandler: onError
            })
        )
        .pipe(gulp.dest("build/css/images"));
});
gulp.task("css-images-min", () => {
    gulp
        .src(["src/example/css/images/**/*"])
        .pipe(
            plumber({
                errorHandler: onError
            })
        )
        .pipe(gulp.dest("deploy/css/images"));
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
        .pipe(gulp.dest("build/libs"));
});
gulp.task("folders-min", () => {
    gulp
        .src(["src/example/libs/**/*"])
        .pipe(
            plumber({
                errorHandler: onError
            })
        )
        .pipe(gulp.dest("deploy/libs"));
});

/* ----------------- */
/* IQuiz assets
/* ----------------- */
gulp.task("iquiz", () => {
    var imgSrc = ["./src/example/iquiz_assets/**/*"],
        imgDst = "./build/iquiz_assets";
    return (
        gulp
            .src(imgSrc)
            .pipe(newer(imgDst))
            .pipe(
                plumber({
                    errorHandler: onError
                })
            )
            .pipe(changed(imgDst))
            .pipe(gulp.dest(imgDst))
    );
});
gulp.task("iquiz-min", () => {
    var imgSrc = ["./src/example/iquiz_assets/**/*"],
        imgDst = "./deploy/iquiz_assets";
    return (
        gulp
            .src(imgSrc)
            .pipe(newer(imgDst))
            .pipe(
                plumber({
                    errorHandler: onError
                })
            )
            .pipe(changed(imgDst))
            .pipe(imagemin())
            .pipe(gulp.dest(imgDst))
        //.pipe(notify({ message: "Images task complete" }))
    );
});


/* ----------------- */
/* Images
/* ----------------- */
gulp.task("images", () => {
    var imgSrc = ["./src/example/images/**/*"],
        imgDst = "./build/images";
    return (
        gulp
            .src(imgSrc)
            .pipe(newer(imgDst))
            .pipe(
                plumber({
                    errorHandler: onError
                })
            )
            .pipe(changed(imgDst))
            .pipe(gulp.dest(imgDst))
    );
});
gulp.task("images-min", () => {
    var imgSrc = ["./src/example/images/**/*"],
        imgDst = "./deploy/images";
    return (
        gulp
            .src(imgSrc)
            .pipe(newer(imgDst))
            .pipe(
                plumber({
                    errorHandler: onError
                })
            )
            .pipe(changed(imgDst))
            .pipe(imagemin())
            .pipe(gulp.dest(imgDst))
        //.pipe(notify({ message: "Images task complete" }))
    );
});


/* ----------------- */
/* Build Pack
/* ----------------- */
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
gulp.task("copy-content", () => {
    let jsBundleStreams = [];
    let contentDir = packDir + "/contents";
    if (!fs.existsSync(contentDir))
        fs.mkdirSync(contentDir), console.log("📁  folder created:", contentDir);

    // Add dest files to Content folder
    let filesSrc = `deploy/**`,
        filesDist = `${contentDir}`;
    jsBundleStreams.push(
        gulp
            .src(filesSrc)
            //.pipe(newer(filesDist))
            .pipe(plumber({ errorHandler: onError }))
            .pipe(gulp.dest(filesDist))
    );
    return merge(jsBundleStreams);
})
gulp.task("create-zip", () => {
    let jsBundleStreams = [];
    jsBundleStreams.push(
        gulp.src(`${packDir}/**`)
            .pipe(zip(`${packDir}.zip`))
            .pipe(gulp.dest('./'))
    )
    return merge(jsBundleStreams);
})

gulp.task("build-pack", () => {

    if (!fs.existsSync("pack"))
        fs.mkdirSync("pack"), console.log("📁  folder created:", "pack");

    let jsBundleStreams = [];

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

// Gulp plumber error handler
var onError = function (err) {
    console.log(err);
};

gulp.task('clean', function () {
    del.sync(['pack/**', '!pack'])
});



/* ----------------- */
/* Taks
/* ----------------- */
gulp.task('development', ['scripts', 'sass', 'fonts', 'css-images', 'images', 'html', 'folders', 'iquiz'], () => {
    browserSync({
        'server': './',
        startPath: "build/index.html#/task1/slides/0",
        'snippetOptions': {
            'rule': {
                'match': /<\/body>/i,
                'fn': (snippet) => snippet
            }
        }
    });
    gulp.watch('./src/ebook/scss/**/*.scss', ['styles', browserSync.reload]);
    gulp.watch('./src/iquiz/scss/**/*.scss', ['styles', browserSync.reload]);
    gulp.watch('./src/ebook/js/**/*.js', ['scripts', browserSync.reload]);
    gulp.watch('./src/iquiz/js/**/*.js', ['scripts', browserSync.reload]);
    gulp.watch('./src/example/js/**/*.js', ['scripts', browserSync.reload]);
    gulp.watch('./src/example/css/**/*.scss', ['styles', browserSync.reload]);
    gulp.watch('./src/example/*.html', ['html', browserSync.reload]);
});

gulp.task('default', ['development']);
gulp.task('deploy', ['scripts-min', 'sass-min', 'fonts-min', 'css-images-min', 'images-min', 'html-min', 'folders-min', 'iquiz-min']);
//gulp.task("pack", ["clean", "build-pack"]);

gulp.task('pack', function (callback) {
    runSequence('clean', 'copy-pack', 'copy-content', 'create-zip', callback);
});
