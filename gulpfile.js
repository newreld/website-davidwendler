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
  image = require('gulp-image'),
  imageResize = require('gulp-image-resize'),
  concat = require('gulp-concat'),

  // development mode?
  // devBuild = (process.env.NODE_ENV !== 'production'),

  // folders
  folder = {
    src: 'src/',
    out: 'tmp/'
  },
  
  devMode = true,
  setProductionMode = function(done) { 
    devMode = false;
    folder.out = 'dist/';
    done();
  },
  
  urlString = function(str) {
    return encodeURIComponent(str.replace(/[^a-z0-9_]+/gi, '-').replace(/^-|-$/g, ''));
  }

  svgSpriteConfig = {
    mode: {
      symbol: {
        dest: '',
        sprite: 'sprite.svg'
      }
    }
  }
;

// CLEAN
gulp.task('clean', function () {
  return gulp.src(folder.out + '*', {read: false})
      .pipe(clean());
});
gulp.task('clean:prod', gulp.series(setProductionMode,'clean'));

// STYLES
gulp.task('styles', function() {
  return gulp.src(folder.src + 'scss/styles.scss')
  .pipe(sass({
    outputStyle: 'nested',
    imagePath: 'images/',
    precision: 3,
    errLogToConsole: true
  }))
  .pipe(gulp.dest(folder.out + 'css'))
  .pipe(connect.reload());
});

// SERVER
gulp.task('serve', function(done) {
  connect.server({
    root: folder.out,
    port: 8080,
    livereload: {
      port: 35729
    }
  });
  gulp.watch(folder.src + 'scss/**/*', gulp.series('styles'));
  gulp.watch([folder.src + 'templates/**/*', folder.src + 'pages/**/*', folder.src + 'data/**/*'], gulp.series('portfolio','nunjucks'));
  gulp.watch(folder.src +  'js/*', gulp.series('js'));
  gulp.watch(folder.src + 'assets/images/svg-sprite/src/*', gulp.series('svgsprite'));
  gulp.watch(folder.src +  'assets/images/**/*', gulp.series('images'));
  done();
});
gulp.task('serve:prod', gulp.series(setProductionMode, 'serve'));

// PORTFOLIO
gulp.task('portfolio', function () {
  
  // get portfolio.json
  var portfolio = JSON.parse(fs.readFileSync('./src/data/portfolio.json'));
  portfolio.numberOfEntries = Object.keys(portfolio.featured).length;

  var tasks = portfolio.featured.map(function(entry,index) {
    return gulp.src(folder.src + 'templates/portfolio-item.nunjucks')
      .pipe(data(function(file) {
        var nextEntry, previousEntry;
        // check wether its first or last entry
        if (index < (portfolio.numberOfEntries-1)) {
          nextEntry = portfolio.featured[index+1];
        } else {
          nextEntry = false;
        }
        if (index > 0) {
          previousEntry = portfolio.featured[index-1];
        } else {
          previousEntry = false;
        }
        // create data obj with current, next and previous object
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
      .pipe(rename('portfolio_' + urlString(entry.handle) + '.html'))
      // output files in app folder
      .pipe(gulp.dest(folder.out))
  });
  return mergeStream(tasks);
});

// NUNJUCKS
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
  .pipe(gulp.dest(folder.out))
  .pipe(connect.reload());
});

// JAVASCRIPT
gulp.task('js', function() {
  return gulp.src([folder.src + 'js/vendor/intersection-observer.js', folder.src + 'js/main.js'])
  .pipe(concat('main.js'))
  .pipe(gulp.dest(folder.out + 'js'));
});

// IMAGES
gulp.task('resize-images-thumbnail', function() {
  return gulp.src(folder.src + 'assets/images/portfolio/*.+(jpg|png)')
    .pipe(imageResize({ width : 800, imageMagick: true }))
    .pipe(rename(function (path) { path.basename += "-thumbnail"; }))
    .pipe(gulp.dest(folder.src + 'assets/images/portfolio/thumbnail'));
});
gulp.task('resize-images-color', function() {
  return gulp.src(folder.src + 'assets/images/portfolio/*.+(jpg|png)')
    .pipe(imageResize({ width: 1, height: 1, imageMagick: true }))
    .pipe(rename(function (path) { path.basename += "-color"; }))
    .pipe(gulp.dest(folder.src + 'assets/images/portfolio/color'));
});

gulp.task('resize-images', gulp.series('resize-images-thumbnail', 'resize-images-color'));

gulp.task('minify-images', function() {
  return gulp.src(folder.src + 'assets/images/portfolio/**/*.+(jpg|png)')
    .pipe(image())
    .pipe(gulp.dest(folder.src + 'assets/images/portfolio'));
});

gulp.task('images', function() {
  return gulp.src(folder.src + 'assets/images/**/*.+(jpg|png)')
  .pipe(gulp.dest(folder.out + 'assets/images/'));
});

gulp.task('svgsprite', function(){
  return gulp.src(folder.src + 'assets/images/svg-sprite/src/*.svg')
  .pipe(svgSprite(svgSpriteConfig))
  .on('error', function(error) {
    console.log(error);
  })
  .pipe(gulp.dest(folder.out + 'assets/images/'))
  .pipe(connect.reload());
});

gulp.task('minify-svgsprite', function(){
   return gulp.src(folder.src + 'assets/images/svg-sprite/src/*')
      .pipe(svgo())
      .pipe(gulp.dest(folder.src + 'assets/images/svg-sprite/src/'));
});

// COMBO
gulp.task('default', gulp.series('clean','nunjucks','js','styles', 'svgsprite','images','serve'));

gulp.task('build', gulp.series(setProductionMode,'clean','nunjucks','js','styles','svgsprite','images'));