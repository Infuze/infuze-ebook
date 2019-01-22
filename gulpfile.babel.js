
import critical from 'critical';
import babelify from 'babelify';
import browserSync from 'browser-sync';
import browserify from 'browserify';
import buffer from 'vinyl-buffer';
import gulp from 'gulp';
import plugins from 'gulp-load-plugins';
import source from 'vinyl-source-stream';
import rename from 'gulp-rename';


/* ----------------- */
/* Development
/* ----------------- */

gulp.task('development', ['scripts', 'styles', 'html', 'fonts', 'images'], () => {
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
/* html
/* ----------------- */
gulp.task("html", () => {
    return gulp
        .src("src/example/*.html")
        //.pipe(newer("build"))
        .pipe(gulp.dest("build"))
        .pipe(browserSync.stream());
});
/* ----------------- */
/* fonts
/* ----------------- */
gulp.task("fonts", () => {
    return gulp
        .src("src/iquiz/scss/fonts/**/*.*")
        //.pipe(newer("build"))
        .pipe(gulp.dest("build/css/fonts"))
        .pipe(browserSync.stream());
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
            //.pipe(newer(imgDst))
            /* .pipe(
                plumber({
                    errorHandler: onError
                })
            ) */
            //.pipe(changed(imgDst))
            //.pipe(imagemin())
            .pipe(gulp.dest(imgDst))
        //.pipe(notify({ message: "Images task complete" }))
    );
});
/* ----------------- */
/* HTML
/* ----------------- */
gulp.task('htmlx', ['cssmin'], () => {
    return gulp.src('./src/example/*.html')
        .pipe(critical.stream({
            'base': 'build/',
            'inline': true,
            'extract': true,
            'minify': true,
            'css': ['./build/css/style.css']
        }))
        .pipe(gulp.dest('build'));
});


/* ----------------- */
/* Cssmin
/* ----------------- */

gulp.task('cssmin', () => {
    return gulp.src('./client/scss/**/*.scss')
        .pipe(plugins().sass({
            'outputStyle': 'compressed'
        }).on('error', plugins().sass.logError))
        .pipe(gulp.dest('./build/css/'));
});


/* ----------------- */
/* Jsmin
/* ----------------- */

gulp.task('jsmin', () => {
    var envs = plugins().env.set({
        'NODE_ENV': 'production'
    });

    return browserify({
        'entries': ['./client/scripts/main.js'],
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
        .pipe(gulp.dest('./build/js/'));
});

/* ----------------- */
/* Taks
/* ----------------- */

gulp.task('default', ['development']);
gulp.task('deploy', ['html', 'jsmin']); gulp
