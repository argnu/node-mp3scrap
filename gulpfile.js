// jshint esversion:6

const gulp = require('gulp');
const db = require('./db');

gulp.task('init', function(done) {
  db.init()
    .then(r => {
      let user = db.User.build({
        email: 'admin@admin.com',
        password: 'admin123',
        password_confirmation: 'admin123',
        admin: true
      });
      user.validate()
        .then(err => {
          if (!err) {
            user.save()
              .then(new_user => done());
          }
        });
    })
    .catch(e => {
      console.log(e);
      done();
    });
});
