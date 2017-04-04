// jshint esversion:6

const gulp = require('gulp');
const db = require('./db');

gulp.task('init', function(done) {
  db.init()
    .then(r => done())
    .catch(e => {
      console.log(e);
      done();
    });
});
