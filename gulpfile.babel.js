import gulp from "gulp";
import plugins from "gulp-load-plugins";
import browserify from "browserify";
import browserSync from "browser-sync";
import buffer from "vinyl-buffer";
import source from "vinyl-source-stream";
import notify from "gulp-notify";

/* ----------------- */
/* Scripts
/* ----------------- */
gulp.task("scripts", () => {
    return browserify({
        entries: ["./src/js/app.js"],
        debug: true,
        transform: [
            babelify.configure({
                presets: ["env", "react"]
            })
        ]
    })
        .bundle()
        .on("error", function () {
            var args = Array.prototype.slice.call(arguments);

            plugins()
                .notify.onError({
                    title: "Compile Error",
                    message: "<%= error.message %>"
                })
                .apply(this, args);

            this.emit("end");
        })
        .pipe(source("bundle.js"))
        .pipe(buffer())
        .pipe(plugins().sourcemaps.init({ loadMaps: true }))
        .pipe(plugins().sourcemaps.write("."))
        .pipe(gulp.dest("./build/js/"))
        .pipe(browserSync.stream());
});

gulp.task(
    "development",
    ["scripts", "styles", "images", "html", "json", "combine", "libs"],
    () => {
        browserSync({
            server: {
                baseDir: "build/"
            },
            port: 3032,
            //startPath: "/t3-u2/index.html",
            startPath: "/t10-u1/index.html",
            snippetOptions: {
                rule: {
                    match: /<\/body>/i,
                    fn: snippet => snippet
                }
            }
        });

        gulp
            .watch("src/scss/**/*.scss", ["styles"])
            .on("change", browserSync.reload);
        gulp.watch("src/js/**/*.js", ["scripts"]);
        gulp.watch("src/quiz/**/*.js", ["quiz", browserSync.reload]);
        gulp.watch(["src/images/**/*", "!src/images/_supplied/*"], ["images"]);
        gulp.watch("src/**/*.html", ["combine", browserSync.reload]);
        gulp.watch("src/**/*.json", ["json", browserSync.reload]);
    }
);

gulp.task("default", ["development"]);