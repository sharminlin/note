# 利用gulp实现小程序的编译和环境配置

## 实现功能

1. sass编译为wxss
2. 开发、生产环境的参数配置

## 相关代码

### gulp.js

``` JS
const config = require('./config')
const path = require('path');
const gulp = require('gulp')
const rename = require('gulp-rename')
const emptyFolder = require('empty-folder')

const through = require('through2')
const colors = require('ansi-colors')
const log = require('fancy-log')
const argv = require('minimist')(process.argv.slice(2))

const jsonminify = require('gulp-jsonminify')
const gulpSass = require('gulp-sass')
const tap = require('gulp-tap');
const gulpReplace = require('gulp-replace');
const gulpUglify = require('gulp-uglify-es').default
const cleanCSS = require('gulp-clean-css')
const preprocess = require('gulp-preprocess')

const src = './src'
const dist = './dist'
const isProd = argv.type === 'prod'
const format = isProd ? false : 'beautify' 

const paths = {
  json: `${src}/**/*.json`,
  wxml: `${src}/**/*.wxml`,
  images: `${src}/images/**`,
  js: `${src}/**/*.js`,
  wxss: `${src}/**/*.wxss`,
  sass: `${src}/**/*.scss`,
  wxs: `${src}/**/*.wxs`
}

const hasRmCssFiles = new Set()

/**
 * 测试
 */
gulp.task('test', gulp.series(
  clean,
  gulp.parallel(json, images, wxml, wxss, js, sass, wxs)
))


/**
 * 开发
 */
gulp.task('dev', gulp.series(
  clean,
  gulp.parallel(json, images, wxml, wxss, js, sass, wxs),
  watch
))

/**
 * 打包
 */
gulp.task('build', gulp.series(
  clean,
  gulp.parallel(json, images, wxml, wxss, js, sass, wxs)
))

/**
 * 差错提示
 */
const handleError = (err) => {
  console.log('\n')
  log(colors.red('Error!'))
  log('fileName: ' + colors.red(err.fileName))
  log('lineNumber: ' + colors.red(err.lineNumber))
  log('message: ' + err.message)
  log('plugin: ' + colors.yellow(err.plugin))
}

/**
 * 监听
 */
function watch () {
  ;
  ['wxml', 'wxss', 'js', 'json', 'sass', 'images', 'wxs'].forEach((v) => {
    gulp.watch(paths[v], eval(v))
  })
}

function clean () {
  return new Promise((resolve, reject) => {
    emptyFolder('./dist', false, (o)=>{
      if(o.error) {
        console.error(o.error);
        reject()
      } else {
        resolve()
      }
    })
  })
}

function json () {
  return gulp.src(paths.json)
    .pipe(isProd ? jsonminify() : through.obj())
    .pipe(gulp.dest(dist))
}

function wxml () {
  return gulp.src(paths.wxml)
    .pipe(gulp.dest(dist))
}

function images () {
  return gulp.src(paths.images).pipe(gulp.dest(`${dist}/images`))
}

function js () {
  if (isProd) {
    return gulp.src(paths.js)
      .pipe(preprocess({
        context: {
          NODE_ENV: argv.type || 'dev'
        }
      }))
      .pipe(
        gulpUglify({ output: { beautify: false } })
      )
      .pipe(gulp.dest(dist))
  } else {
    return gulp.src(paths.js)
      .pipe(preprocess({
        context: {
          NODE_ENV: argv.type || 'dev'
        }
      }))
      .pipe(gulp.dest(dist))
  }
}

function wxss () {
  return gulp.src(paths.wxss)
    .pipe(gulp.dest(dist))
}

function wxs () {
  return gulp.src(paths.wxs)
    .pipe(gulp.dest(dist))
}

function sass () {
  return gulp.src(paths.sass)
    .pipe(tap((file) => {
      // 当前处理文件的路径
      const filePath = path.dirname(file.path);
      // 当前处理内容
      const content = file.contents.toString();
      // 找到filter的scss，并匹配是否在配置文件中
      content.replace(/@import\s+['|"](.+)['|"];/g, ($1, $2) => {
        const hasFilter = config.cssFilterFiles.filter(item => $2.indexOf(item) > -1);
        if (hasFilter.length > 0) {
          const rmPath = path.join(filePath, $2);
          const filea = rmPath.replace(/src/, 'dist').replace(/\.scss/, '.wxss');
          hasRmCssFiles.add(filea);
        }
      });
    }))
    .pipe(gulpReplace(/(@import.+;)/g, ($1, $2) => {
      const hasFilter = config.cssFilterFiles.filter(item => $1.indexOf(item) > -1);
      if (hasFilter.length > 0) {
        return $2;
      }
      return `/** ${$2} **/`;
    }))
    .pipe(gulpSass({ errLogToConsole: true, outputStyle: 'expanded' }).on('error', gulpSass.logError))
    .pipe(gulpReplace(/(\/\*\*\s{0,})(@.+)(\s{0,}\*\*\/)/g, ($1, $2, $3) => $3.replace(/\.scss/g, '.wxss')))
    // .pipe(cleanCSS({ format }))
    .pipe(rename((path) => (path.extname = '.wxss')))
    .pipe(gulp.dest(dist))
}

function cleanWxss () {
  const arr = [];
  hasRmCssFiles.forEach((item) => {
    arr.push(item);
  });
  return gulp.src(arr, { read: false })
    .pipe(clean({ force: true }));
}
```

### ./src/config.js

``` JS
module.exports = {
  dev: {
    HOST: '',
    URL_FORMER: '',
    ALD_KEY: '',
    BAIDU_KEY: ''
  },

  prod: {
    HOST: '',
    URL_FORMER: '',
    ALD_KEY: '',
    BAIDU_KEY: ''
  }
}
```

### package.json

``` JSon
{
  "name": "mvp",
  "version": "1.2.0",
  "description": "",
  "main": "app.js",
  "scripts": {
    "dev": "gulp dev",
    "test": "gulp test --type test",
    "build": "gulp build --type prod"
  },
  "author": "",
  "license": "ISC",
  "devDependencies": {
    "ansi-colors": "^3.2.4",
    "empty-folder": "^2.0.3",
    "fancy-log": "^1.3.3",
    "gulp": "^4.0.0",
    "gulp-clean-css": "^4.2.0",
    "gulp-jsonminify": "^1.1.0",
    "gulp-preprocess": "^3.0.2",
    "gulp-rename": "^1.4.0",
    "gulp-replace": "^1.0.0",
    "gulp-sass": "^4.0.2",
    "gulp-tap": "^2.0.0",
    "gulp-uglify-es": "^2.0.0",
    "minimist": "^1.2.0",
    "through2": "^3.0.1"
  }
}
```