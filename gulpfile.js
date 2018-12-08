// Gulp.js configuration
var
  // modules
  gulp = require('gulp'),
  sass = require('gulp-sass'),
  connect = require('gulp-connect'),
  nunjucksRender = require('gulp-nunjucks-render'),
  data = require('gulp-data'),
  clean = require('gulp-clean'),
  fs = require('fs'),
  mergeStream = require('merge-stream'),
  rename = require('gulp-rename'),
  svgo = require('gulp-svgo'),
  svgSprite = require('gulp-svg-sprite'),

  // development mode?
  // devBuild = (process.env.NODE_ENV !== 'production'),

  // folders
  folder = {
    src: 'src/',
    tmp: 'tmp/',
    dist: 'dist/'
  },

  devMode = true,
  setProductionMode = function(done) { devMode = false; done(); },

  svgSpriteConfig = {
    mode: {
      symbol: {
        dest: '',
        sprite: 'sprite.svg'
      }
    }
  }
  
;

// gulp.task('a', function (done) {
//   console.log(devMode);
//   done();
// });

// gulp.task('b', function (done) {
//   console.log(devMode);
//   done();
// });

// gulp.task('builder', gulp.series('a', function (done) {
//   setProductionMode();
//   console.log("success");
//   done();
// },'b'));


gulp.task('clean', function () {
  var out = folder.tmp;
  if(!devMode) { out = folder.dist };
  return gulp.src(out + '*', {read: false})
      .pipe(clean());
});

gulp.task('clean:prod', gulp.series(setProductionMode,'clean'));


gulp.task('styles', function() {
  return gulp.src(folder.src + 'scss/styles.scss')
  .pipe(sass({
    outputStyle: 'nested',
    imagePath: 'images/',
    precision: 3,
    errLogToConsole: true
  }))
  .pipe(gulp.dest(folder.tmp + 'css'))
  .pipe(connect.reload());
});


gulp.task('serve', function(done) {
  var out = folder.tmp;
  if(!devMode) { out = folder.dist };
  connect.server({
    root: out,
    port: 8080,
    livereload: {
      port: 35729
    }
  });
  gulp.watch(folder.src + 'scss/**/*', gulp.series('styles'));
  gulp.watch([folder.src + 'templates/**/*', folder.src + 'pages/**/*', folder.src + 'data/**/*'], gulp.series('portfolio','nunjucks'));
  gulp.watch(folder.src + 'assets/images/svg-sprite/src/*', gulp.series('svgsprite'));
  done();
});


gulp.task('serve:prod', gulp.series(setProductionMode, 'serve'));


gulp.task('portfolio', function () {
  
  // get portfolio.json
  var portfolio = JSON.parse(fs.readFileSync('./src/data/portfolio.json'));
  portfolio.numberOfEntries = Object.keys(portfolio.entries).length;
  

  var tasks = portfolio.entries.map(function(entry,index) {
        
    return gulp.src(folder.src + 'templates/portfolio.nunjucks')
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
              index: index,
              current: entry, 
              next: nextEntry,
              previous: previousEntry
            }
            // console.log(data);
            return data;
          }))
          // Renders template with nunjucks
          .pipe(nunjucksRender({
              path: [folder.src]
            }))
          .pipe(rename('portfolio_' + index + '.html'))
          // output files in app folder
          .pipe(gulp.dest(folder.tmp))
  });
  return mergeStream(tasks);
});


gulp.task('nunjucks', function() {
  // Gets .html and .nunjucks files in pages
  return gulp.src(folder.src + 'pages/**/*.+(html|nunjucks)')
  .pipe(data(function(file) {
      var data = JSON.parse(fs.readFileSync('./src/data/portfolio.json'));
      return data;
  }))
  // Renders template with nunjucks
  .pipe(nunjucksRender({
      path: [folder.src]
    }))
  // output files in app folder
  .pipe(gulp.dest(folder.tmp))
  .pipe(connect.reload());
});


gulp.task('svgsprite', function(){
  return gulp.src(folder.src + 'assets/images/svg-sprite/src/*.svg')
  .pipe(svgSprite(svgSpriteConfig))
  .on('error', function(error) {
    console.log(error);
  })
  .pipe(gulp.dest(folder.tmp + 'assets/images/'))
  .pipe(connect.reload());
});


gulp.task('svgsprite:minify', function(){
   return gulp.src(folder.src + 'assets/images/svg-sprite/src/*')
      .pipe(svgo())
      .pipe(gulp.dest(folder.src + 'assets/images/svg-sprite/src/'));
});


// gulp.task('svgsprite', gulp.series('svgsprite:minify', 'svgsprite:create'));


gulp.task('default', gulp.series('clean','nunjucks','portfolio','styles', 'svgsprite','serve'));