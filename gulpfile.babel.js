
import gulp from 'gulp';
import fs from 'fs';
var minimist = require('minimist');
const packConfig = require("./pack-config.json");
const packs = packConfig.packs;
let pack, bookNumber, bookArr, bookTitle, bookFolder;
const options = minimist(process.argv.slice(2), knownOptions);
console.log('packConfig ', packConfig);


var knownOptions = {
    string: 'book',
    default: { env: process.env.NODE_ENV || 'production' }
};



gulp.task('default', () => {
    console.log('options ', Object.keys(options))
    bookNumber = Object.keys(options)[0]
    console.log('bookNumber ', bookNumber);

    if (bookNumber === '_') {
        // Multiple books in argument
        bookArr = Object.keys(options)[1].split(',').map(Number);
        console.log('bookArr ', bookArr);
        if (bookArr.length === 1 && bookArr[0] === 'env') {
            console.error('Default Gulp must be followed by book number. i.e. Gulp --6 ', book);
        }
    } else {
        // Single book
        bookArr = [];
        bookArr.push(+bookNumber);
        console.log('bookArr ', bookArr);
        //bookTitle = pack[0].title;
        //bookFolder = pack[0].folder;

        gulp.start('build-book');
    }

});


gulp.task('build-book', () => {
    console.log('build-book ');

    let jsBundleStreams = [];

    bookArr.map(pack => {
        console.log('pack:', pack);
        // set pack folder name
        let title = pack.title;
        //title = title.replace(/,/g, "");
        //title = title.replace(/\s/g, "-");
        let folder = pack.folder;

        let dir = 'books/' + folder;
        console.log('📁  dir:', dir);

        // Create pack folder and Contents folder
        if (!fs.existsSync(dir))
            fs.mkdirSync(dir), console.log("📁  folder created:", dir);

    })



});

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





