import gulp from 'gulp';
import plumber from 'gulp-plumber'; // plumber требуется, чтобы выполнение скрипта не прерывалось при ошибке
import sass from 'gulp-dart-sass';
import postcss from 'gulp-postcss';
import csso from 'postcss-csso';
import htmlmin from 'gulp-htmlmin';
import rename from 'gulp-rename';
import autoprefixer from 'autoprefixer';
import terser from 'gulp-terser'; // используется для уменьшения размера HTML файла (удаляет пробелы и т.п.)
import sourcemaps from 'gulp-sourcemaps';
import imagemin from 'gulp-imagemin';
import squooshCreate from 'gulp-squoosh';
import svgo from 'gulp-svgmin';
import svgstore from 'gulp-svgstore'; // используется для создания SVG спрайтов
import del from 'del';
import browser from 'browser-sync';

export const styles = () => {
  return gulp.src('source/sass/style.scss', { sourcemaps: true })
    // не дает js упасть при ошибке в стилях (нет нужды запускать каждый раз npm start)
    .pipe(plumber())
    .pipe(sass().on('error', sass.logError))
    .pipe(postcss([
      autoprefixer(),
      csso()
    ]))
    .pipe(rename('style.min.css'))
    .pipe(gulp.dest('build/css', { sourcemaps: '.' }))
    .pipe(browser.stream());
}

const html = () => {
  return gulp.src('source/*.html')
    .pipe(htmlmin({ collapseWhitespace: true }))
    .pipe(gulp.dest('build'));
}

export const scripts = () => {
  return gulp.src('source/js/*.js')
    .pipe(sourcemaps.init())
    .pipe(terser())
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest('build/js'))
    .pipe(browser.stream())
}

const optimizeImages = () => {
  return gulp.src('source/img/**/*.{jpg,png}')
    // .pipe(squoosh())
    .pipe(imagemin())
    .pipe(gulp.dest('build/img'))
}

const createImages = () => {
  return gulp.src('source/img/**/*.{jpg,png}')
    .pipe(squooshCreate({
      encodeOptions: {
        webp: {},
        avif: {},
      }
    }))
    .pipe(gulp.dest('build/img'))
}

const copyImages = () => {
  return gulp.src('source/img/**/*.{jpg,png}')
    .pipe(gulp.dest('build/img'))
}

const svg = () => {
  return gulp.src(['source/img/**/*.svg', '!source/img/sprite-icons/*'])
    .pipe(svgo())
    .pipe(gulp.dest('build/img'));
}

// Create SVG Sprite

const sprite = () => {
  return gulp.src('source/img/sprite-icons/**/*.svg')
    .pipe(svgo())
    .pipe(svgstore({
      inlineSvg: true
    }))
    .pipe(rename('sprite.svg'))
    .pipe(gulp.dest('build/img'))
}

const copy = (done) => {
  gulp.src([
    'source/fonts/*.{woff2,woff}',
    'source/*.ico',
    'source/manifest.webmanifest'
  ], {
    base: 'source'
  })
    .pipe(gulp.dest('build'))
  done();
}

const clean = () => {
  return del('build');
}

const server = (done) => {
  browser.init({
    server: {
      baseDir: 'build'
    },
    cors: true,
    notify: false,
    ui: false,
  });
  done();
}

const reload = (done) => {
  browser.reload();
  done();
}

const watcher = () => {
  gulp.watch('source/sass/**/*.scss', gulp.series(styles));
  gulp.watch('source/js/**/*.js', gulp.series(scripts));
  gulp.watch('source/*.html', gulp.series(html, reload));
}

export const build = gulp.series(
  clean,
  gulp.parallel(
    copy,
    optimizeImages,
    createImages,
    styles,
    html,
    scripts,
    svg,
    sprite
  )
);

export default gulp.series(
  clean,
  gulp.parallel(
    copy,
    copyImages,
    createImages,
    styles,
    html,
    scripts,
    svg,
    sprite
  ),
  gulp.series(
    server,
    watcher
  )
);
