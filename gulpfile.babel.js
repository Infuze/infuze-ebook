
import gulp from 'gulp';
import fs from 'fs';
import plumber from "gulp-plumber";
const newer = require("gulp-newer");
const merge = require("merge-stream");
const zip = require('gulp-zip');
const del = require('del');
const packConfig = require("./pack-config.json");
const sass = require('gulp-sass');
sass.compiler = require('node-sass');
const uglify = require("gulp-uglify");

import critical from 'critical';
import babelify from 'babelify';
import browserSync from 'browser-sync';
import browserify from 'browserify';
import buffer from 'vinyl-buffer';
import plugins from 'gulp-load-plugins';
import source from 'vinyl-source-stream';
import rename from 'gulp-rename';



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
    //.pipe(browserSync.stream());
});

/* ----------------- */
/* Jsmin
/* ----------------- */
gulp.task('jsmin', () => {
    var envs = plugins().env.set({
        'NODE_ENV': 'production'
    });

    return browserify({
        'entries': ['./src/example/js/index.js'],
        'debug': false,
        'transform': [
            babelify.configure({
                'presets': ['es2015', 'react']
            })
        ]
    })
        .bundle()
        .pipe(source('bundle.js'))
        .pipe(envs)
        .pipe(buffer())
        .pipe(plugins().uglify())
        .pipe(envs.reset)
        .pipe(gulp.dest('./deploy/js/'));
});


/* ----------------- */
/* SASS
/* ----------------- */

gulp.task('sass', () => {
    return gulp.src('./src/example/css/**/*.scss')
        .pipe(plugins().sourcemaps.init())
        .pipe(sass().on('error', sass.logError))
        .pipe(plugins().sourcemaps.write())
        .pipe(gulp.dest('./build/css/'))
        .pipe(browserSync.stream());
});
gulp.task('sass-min', () => {
    return gulp.src('./src/example/css/**/*.scss')
        .pipe(sass({ outputStyle: 'compressed' }).on('error', sass.logError))
        .pipe(gulp.dest('./deploy/css/'))
    //.pipe(browserSync.stream());
});


/* ----------------- */
/* Styles
/* ----------------- */
gulp.task('styles', () => {
    return gulp.src('./src/example/css/**/*.scss')
        .pipe(plugins().sourcemaps.init())
        .pipe(plugins().sass().on('error', plugins().sass.logError))
        .pipe(plugins().sourcemaps.write())
        .pipe(gulp.dest('./build/css/'))
        .pipe(browserSync.stream());
});


/* ----------------- */
/* HTML
/* ----------------- */
gulp.task('html', ['cssmin'], () => {
    return gulp.src('src/example/index.html')
        .pipe(critical.stream({
            'base': 'build/',
            'inline': true,
            'extract': true,
            'minify': true,
            'css': ['./build/css/style.css']
        }))
        .pipe(gulp.dest('build'));
});

/* ----------------- * /
/* Fonts
/* ----------------- */
gulp.task("fonts", () => {
    gulp
        .src(["src/example/css/fonts", "src/example/css/images"])
        .pipe(
            plumber({
                errorHandler: onError
            })
        )
        .pipe(gulp.dest("build/css"));
});
gulp.task("fonts-min", () => {
    gulp
        .src(["src/example/css/fonts", "src/example/css/images"])
        .pipe(
            plumber({
                errorHandler: onError
            })
        )
        .pipe(gulp.dest("deploy/css"));
});

/* ----------------- */
/* Images
/* ----------------- */
gulp.task("images", () => {
    var imgSrc = "./src/example/images/**/*",
        imgDst = "./build/images/";

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
gulp.task("images-min", () => {
    var imgSrc = "./src/example/images/**/*",
        imgDst = "./deploy/images/";

    return (
        gulp
            .src(imgSrc)
            .pipe(newer(imgDst))
            .pipe(
                plumber({
                    errorHandler: onError
                })
            )
            //.pipe(changed(imgDst))
            //.pipe(imagemin())
            .pipe(gulp.dest(imgDst))
        //.pipe(notify({ message: "Images task complete" }))
    );
});

/* ----------------- */
/* Cssmin
/* ----------------- */
gulp.task('default', function () {
    gulp.src('src/**/*.css')
        .pipe(cssmin())
        .pipe(rename({ suffix: '.min' }))
        .pipe(gulp.dest('dist'));
});


gulp.task('cssmin', () => {
    return gulp.src('./client/scss/**/*.scss')
        .pipe(plugins().sass({
            'outputStyle': 'compressed'
        }).on('error', plugins().sass.logError))
        .pipe(gulp.dest('./build/css/'));
});




/* ----------------- */
/* Taks
/* ----------------- */



/* ----------------- */
/* Build Pack
/* ----------------- */
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
gulp.task('development', ['scripts', 'sass', 'fonts', 'images'], () => {
    browserSync({
        'server': './',
        startPath: "build/index.html#/task1/slides",
        'snippetOptions': {
            'rule': {
                'match': /<\/body>/i,
                'fn': (snippet) => snippet
            }
        }
    });
    gulp.watch('./src/ebook/scss/**/*.scss', ['sass', browserSync.reload]);
    gulp.watch('./src/ebook/js/**/*.js', ['scripts', browserSync.reload]);
    gulp.watch('./src/iquiz/js/**/*.js', ['scripts', browserSync.reload]);
    gulp.watch('./src/example/js/**/*.js', ['scripts', browserSync.reload]);
    gulp.watch('./build/*.html', browserSync.reload);
});

gulp.task('default', ['development']);
gulp.task('deploy', ['scripts-min', 'sass-min', 'fonts-min', 'images-min']);
gulp.task("pack", ["clean", "build-pack"]);