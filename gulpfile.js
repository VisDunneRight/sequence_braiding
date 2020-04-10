var gulp          = require('gulp');
var concat        = require('gulp-concat');
var browserSync   = require("browser-sync").create();

// concatenate all the files
gulp.task('concat', function() {
  return gulp.src(['./js/*.js', './lib/*.js'])
    .pipe(concat('sequence_braiding.js'))
    .pipe(gulp.dest('./dist/'));
});

// serve page from root folder, go directly to docs
gulp.task('serve', function() {
  browserSync.init({
      server: {
          baseDir: "./",
          middleware: [{
          route: "/",
          handle: (req, res, next) => {
            res.writeHead(302,  { 'Location': '/docs/' })
            res.end()
            next()
          }
        }]
      }
  });
});

// watch js and html files, reload when something changes
gulp.task('watch', function() {
  gulp.watch(
    ['./js/*.js', './lib/*.js', './docs/*.html'],
    gulp.parallel('concat')
  );
  browserSync.reload();
});

// default task
gulp.task('default', gulp.parallel('concat', 'serve', 'watch'));
