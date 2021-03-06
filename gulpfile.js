let project_folder = require("path").basename(__dirname);
let source_folder = "source";

let fs = require("fs");

let path = {
  build: {
    html: project_folder + "/",
    css: project_folder + "/css/",
    js: project_folder + "/js/",
    img: project_folder + "/img/",
    fonts: project_folder + "/fonts/",
  },
  source: {
    html: [source_folder + "/*.html", "!" + source_folder + "/_*.html"],
    css: source_folder + "/scss/style.scss",
    js: source_folder + "/js/script.js",
    img: source_folder + "/img/**/*.{jpg,png,svg,gif,ico,webp}",
    fonts: source_folder + "/fonts/*.ttf",
  },
  watch: {
    html: source_folder + "/**/*.html",
    css: source_folder + "/scss/**/*.scss",
    js: source_folder + "/js/**/*.js",
    img: source_folder + "/img/**/*.{jpg,png,svg,gif,ico,webp}",
  },
  clean: "./" + project_folder + "/",
};

let { src, dest } = require("gulp"),
  gulp = require("gulp"),
  browsersync = require("browser-sync").create();
fileinclude = require("gulp-file-include");
del = require("del");
scss = require("gulp-sass");
autoprefixer = require("gulp-autoprefixer");
group_media = require("gulp-group-css-media-queries");
clean_css = require("gulp-clean-css");
rename = require("gulp-rename");
uglify = require("gulp-uglify-es").default;
imagemin = require("gulp-imagemin");
webp = require("gulp-webp");
postcss = require("gulp-postcss");
webpcss1 = require("webpcss");
autoprefixerCore = require("autoprefixer-core");
webpHTML = require("gulp-webp-html");
webpcss = require("gulp-webp-css");
svgSprite = require("gulp-svg-sprite");
ttf2woff = require("gulp-ttf2woff");
ttf2woff2 = require("gulp-ttf2woff2");
fonter = require("gulp-fonter");
htmlhint = require("htmlhint");
csscomb = require("csscomb");
GulpWebpHtml2 = require("gulp-webp-html2");
webp_in_css = require("webp-in-css/plugin");
svgmin = require("gulp-svgmin");
cheerio = require("gulp-cheerio");
replace = require("gulp-replace");

function browserSync(params) {
  browsersync.init({
    server: {
      baseDir: "./" + project_folder + "/",
      // index: "index-mob.html",
    },
    port: 3000,
    notify: false,
  });
}

function html() {
  return src(path.source.html)
    .pipe(fileinclude())

    .pipe(GulpWebpHtml2())
    .pipe(dest(path.build.html))
    .pipe(browsersync.stream());
}

function css(param) {
  var processors = [webp_in_css];
  return (
    src(path.source.css)
      .pipe(
        scss({
          outputStyle: "expanded",
          includePaths: require("node-normalize-scss").with(
            "other/path",
            "another/path"
          ),
        })
      )
      .pipe(group_media())
      .pipe(
        autoprefixer({
          overrideBrowserslist: ["last 5 versions"],
          cascade: true,
        })
      )
      .pipe(postcss(processors))
      .pipe(dest(path.build.css))
      .pipe(clean_css())
      .pipe(
        rename({
          extname: ".min.css",
        })
      )

      .pipe(dest(path.build.css))
      .pipe(browsersync.stream())
  );
}

function js() {
  return src(path.source.js)
    .pipe(fileinclude())
    .pipe(dest(path.build.js))
    .pipe(uglify())
    .pipe(
      rename({
        extname: ".min.js",
      })
    )
    .pipe(dest(path.build.js))
    .pipe(browsersync.stream());
}

function images() {
  return src(path.source.img)
    .pipe(
      webp({
        quality: 70,
      })
    )
    .pipe(dest(path.build.img))
    .pipe(src(path.source.img))
    .pipe(
      imagemin({
        progressive: true,
        svgoPlugins: [{ removeVieBox: false }],
        interlaced: true,
        optimizationLevel: 3, //0-7
      })
    )
    .pipe(dest(path.build.img))
    .pipe(browsersync.stream());
}

function fonts(param) {
  src(path.source.fonts).pipe(ttf2woff()).pipe(dest(path.build.fonts));
  return src(path.source.fonts).pipe(ttf2woff2()).pipe(dest(path.build.fonts));
}

gulp.task("otf2ttf", function () {
  return src([source_folder + "/fonts/*.otf"])
    .pipe(
      fonter({
        formats: ["ttf"],
      })
    )
    .pipe(dest(source_folder + "/fonts/"));
});

gulp.task("svgSprite", function () {
  return (
    gulp
      .src([source_folder + "/img/**/_*.svg"])
      .pipe(
        svgmin({
          js2svg: {
            pretty: true,
          },
        })
      )
      // remove all fill, style and stroke declarations in out shapes
      .pipe(
        cheerio({
          run: function ($) {
            $("[fill]").removeAttr("fill");
            $("[stroke]").removeAttr("stroke");
            $("[style]").removeAttr("style");
          },
          parserOptions: { xmlMode: true },
        })
      )
      // cheerio plugin create unnecessary string '&gt;', so replace it.
      .pipe(replace("&gt;", ">"))
      .pipe(
        svgSprite({
          mode: {
            stack: {
              sprite: "../icons/sprite.svg", // sprite file name
              // example: true
            },
          },
        })
      )
      .pipe(dest(source_folder + "/img/"))
  );
});

function fontsStyle(param) {
  let file_content = fs.readFileSync(source_folder + "/scss/fonts.scss");
  if (file_content == "") {
    fs.writeFile(source_folder + "/scss/fonts.scss", "", cb);
    return fs.readdir(path.build.fonts, function (err, items) {
      if (items) {
        let c_fontname;
        for (var i = 0; i < items.length; i++) {
          let fontname = items[i].split(".");
          fontname = fontname[0];
          if (c_fontname != fontname) {
            fs.appendFile(
              source_folder + "/scss/fonts.scss",
              '@include font("' +
                fontname +
                '", "' +
                fontname +
                '", "400", "normal");\r\n',
              cb
            );
          }
          c_fontname = fontname;
        }
      }
    });
  }
}

function cb() {}

function watchFiles(param) {
  gulp.watch([path.watch.html], html);
  gulp.watch([path.watch.css], css);
  gulp.watch([path.watch.js], js);
  gulp.watch([path.watch.img], images);
}

function clean(param) {
  return del(path.clean);
}

let build = gulp.series(
  clean,
  gulp.parallel(js, css, html, images, fonts),
  fontsStyle
);
let watch = gulp.parallel(build, watchFiles, browserSync);

exports.fontsStyle = fontsStyle;
exports.fonts = fonts;
exports.images = images;
exports.js = js;
exports.css = css;
exports.html = html;
exports.build = build;
exports.watch = watch;
exports.default = watch;
