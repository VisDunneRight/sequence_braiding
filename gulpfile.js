var gulp = require('gulp');
var concat = require('gulp-concat');

gulp.task('concat', function() {
  return gulp.src(['./js/*.js', './lib/*.js'])
    .pipe(concat('sequence_braiding.js'))
    .pipe(gulp.dest('./dist/'));
});

gulp.task('watch', function() { //'default'
  gulp.watch(
    ['./js/*.js', './lib/*.js'], gulp.parallel('concat'));
});

gulp.task('default', gulp.parallel('concat', 'watch'));
