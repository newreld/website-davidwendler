// Gulp.js configuration
var
  // modules
  gulp = require('gulp'),
  sass = require('gulp-sass'),
  connect = require('gulp-connect'),
  nunjucksRender = require('gulp-nunjucks-render'),
  data = require('gulp-data'),
  clean = require('gulp-clean');
   // useref = require('gulp-useref'),
  fs = require('fs'),
  mergeStream = require('merge-stream');
  rename = require('gulp-rename');

  // development mode?
  devBuild = (process.env.NODE_ENV !== 'production'),

  // folders
  folder = {
    src: 'src/',
    build: 'dist/'
  }
;

gulp.task('portfolio', function () {
  
  // get portfolio.json
  var portfolio = JSON.parse(fs.readFileSync('./src/data/portfolio.json'));
  portfolio.numberOfEntries = Object.keys(portfolio.entries).length;
  

  var tasks = portfolio.entries.map(function(entry,index) {
        
    return gulp.src(folder.src + 'pages/portfolio.nunjucks')
          .pipe(data(function(file) {

              var nextEntry, previousEntry;

              // check wether its first or last entry
              if (index < (portfolio.numberOfEntries-1)) {
                nextEntry = portfolio.entries[index+1];
              } else {
                nextEntry = false;
              }

              if (index > 0) {
                previousEntry = portfolio.entries[index-1];
              } else {
                previousEntry = false;
              }

            // create data obj with current, next and previos object
            var data  = {
              current: entry, 
              next: nextEntry,
              previous: previousEntry
            }
            // console.log(data);
            return data;
          }))
          // Renders template with nunjucks
          .pipe(nunjucksRender({
              path: [folder.src + 'templates']
            }))
          .pipe(rename('portfolio_' + index + '.html'))
          // output files in app folder
          .pipe(gulp.dest(folder.build))
  });
  return mergeStream(tasks);
});


gulp.task('default', ['clean-dist','nunjucks','styles','serve'], function() {
  // place code for your default task here
});

gulp.task('clean-dist', function () {
  return gulp.src('dist/*', {read: false})
      .pipe(clean());
});

gulp.task('styles', function() {
  return gulp.src(folder.src + 'scss/styles.scss')
  .pipe(sass({
    outputStyle: 'nested',
    imagePath: 'images/',
    precision: 3,
    errLogToConsole: true
  }))
  .pipe(gulp.dest(folder.build + 'css'))
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

// gulp.task('useref', function(){
//   return gulp.src('templates/**/*')
//     .pipe(useref())
//     .pipe(gulp.dest('dist'))
// });
