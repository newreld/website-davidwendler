// Gulp.js configuration
var
  // modules
  gulp = require('gulp'),
  sass = require('gulp-sass'),
  connect = require('gulp-connect'),
  nunjucksRender = require('gulp-nunjucks-render'),
  data = require('gulp-data'),
  useref = require('gulp-useref'),
  fs = require('fs'),

  // development mode?
  devBuild = (process.env.NODE_ENV !== 'production'),

  // folders
  folder = {
    src: 'src/',
    build: 'dist/'
  }
;

gulp.task('default', ['nunjucks','styles','serve'], function() {
  // place code for your default task here
});

gulp.task('styles', function() {
  return gulp.src(folder.src + 'scss/main.scss')
  .pipe(sass({
    outputStyle: 'nested',
    imagePath: 'images/',
    precision: 3,
    errLogToConsole: true
  }))
  .pipe(gulp.dest(folder.build + 'css/'))
  .pipe(connect.reload());
});

gulp.task('serve', function() {
  connect.server({
    root: 'dist/',
    port: 1337,
    livereload: {
      port: 35729
    }
  });
  gulp.watch(folder.src + 'scss/**/*', ['styles']);
  gulp.watch([folder.src + 'templates/**/*', folder.src + 'pages/**/*', folder.src + 'data/**/*'], ['nunjucks']);
});

gulp.task('html', function() {
  return gulp.src(folder.src + 'index.html')
  .pipe(gulp.dest(folder.build))
  .pipe(connect.reload());
});

gulp.task('nunjucks', function() {
  // Gets .html and .nunjucks files in pages
  return gulp.src(folder.src + 'pages/**/*.+(html|nunjucks)')
  .pipe(data(function(file) {
      var data = JSON.parse(fs.readFileSync('./src/data/data.json'));

      // data.projects = data.projects.sort(function(a,b) {
      //   return new Date(b.date) - new Date(a.date);
      // });
      return data;
  }))
  // Renders template with nunjucks
  .pipe(nunjucksRender({
      path: [folder.src + 'templates']
    }))
  // output files in app folder
  .pipe(gulp.dest(folder.build))
  .pipe(connect.reload());
});

gulp.task('useref', function(){
  return gulp.src('templates/**/*')
    .pipe(useref())
    .pipe(gulp.dest('dist'))
});
