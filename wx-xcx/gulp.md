# 利用gulp实现小程序的编译和环境配置

## 实现功能

1. sass编译为wxss
2. 开发、生产环境的参数配置

## 相关代码

### gulp.js

```
const gulp = require('gulp')
const rename = require('gulp-rename')
const del = require('del')

const through = require('through2')
const colors = require('ansi-colors')
const log = require('fancy-log')
const argv = require('minimist')(process.argv.slice(2))

const jsonminify = require('gulp-jsonminify')
const gulpSass = require('gulp-sass')
const combiner = require('stream-combiner2')
const preprocess = require('gulp-preprocess')

const src = './src'
const dist = './dist'
const isProd = argv.type === 'prod'

const paths = {
  json: `${src}/**/*.json`,
  wxml: `${src}/**/*.wxml`,
  images: `${src}/images/**`,
  js: `${src}/**/*.js`,
  wxss: `${src}/**/*.wxss`,
  sass: `${src}/**/*.scss`
}

/**
 * 测试
 */
gulp.task('test', gulp.series(
  clean,
  gulp.parallel(json, images, wxml, wxss, js, sass)
))


/**
 * 开发
 */
gulp.task('dev', gulp.series(
  clean,
  gulp.parallel(json, images, wxml, wxss, js, sass),
  watch
))

/**
 * 打包
 */
gulp.task('build', gulp.series(
  clean,
  gulp.parallel(json, images, wxml, wxss, js, sass)
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
  ['wxml', 'wxss', 'js', 'json', 'sass', 'images'].forEach((v) => {
    gulp.watch(paths[v], eval(v))
  })
}

function clean () {
  return del(['./dist/**'])
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
  return gulp.src(paths.js)
    .pipe(preprocess({
      context: {
        NODE_ENV: argv.type || 'dev'
      }
    }))
    .pipe(gulp.dest(dist))
}

function wxss () {
  return gulp.src(paths.wxss)
    .pipe(gulp.dest(dist))
}

function sass () {
  const combined = combiner.obj([
    gulp.src(paths.sass),
    gulpSass({outputStyle: 'expanded'}).on('error', gulpSass.logError),
    rename((path) => (path.extname = '.wxss')),
    gulp.dest(dist)
  ])

  combined.on('error', handleError)
  return combined
}

```

### ./src/config.js

```
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

```
{
  "name": "",
  "version": "1.2.0",
  "description": "",
  "main": "app.js",
  "scripts": {
    "test": "gulp test",
    "dev": "gulp dev",
    "build": "gulp build --type prod"
  },
  "author": "",
  "license": "ISC",
  "devDependencies": {
    "ansi-colors": "^3.2.4",
    "del": "^4.0.0",
    "fancy-log": "^1.3.3",
    "gulp": "^4.0.0",
    "gulp-jsonminify": "^1.1.0",
    "gulp-preprocess": "^3.0.2",
    "gulp-rename": "^1.4.0",
    "gulp-sass": "^4.0.2",
    "minimist": "^1.2.0",
    "stream-combiner2": "^1.1.1",
    "through2": "^3.0.1"
  }
}
```