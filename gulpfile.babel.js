
import gulp from 'gulp';
var minimist = require('minimist');

var knownOptions = {
    string: 'bppk',
    default: { env: process.env.NODE_ENV || 'production' }
};

var options = minimist(process.argv.slice(2), knownOptions);
var book, books;

gulp.task('default', () => {
    console.log('options ', Object.keys(options))
    book = Object.keys(options)[0]
    console.log('book ', book);
    if (book === '_') {
        books = Object.keys(options)[1].split(',')
    }
    console.log('books ', books);
});


