import fs from "fs";
import gulp from "gulp";
import path from "path";
import { Readable } from "stream";
import Vinyl from "vinyl";

import fileinclude from "gulp-file-include";
import htmlmin from "gulp-htmlmin";
import typograf from "gulp-typograf";
import importCss from "gulp-import-css";

import rename from "gulp-rename";
import concat from "gulp-concat";
import watch from "gulp-watch";

import { chapters } from "./src/chapters.js";

const NON_BREAKING_HYPHEN = "‑";
const WATCHERS = {
  html: ["./src/**/*.html"],
  styles: ["./src/**/*.css"],
  js: ["./src/**/*.js"],
};

const typografRules = [
  {
    name: "common/other/nonBreakingHyphen",
    handler: (text) => text.replace(/\-/g, NON_BREAKING_HYPHEN),
  },
];

function chapterUrl(slug) {
  return slug === "index" ? "index.html" : `${slug}.html`;
}

function buildTocHtml(currentSlug) {
  return chapters
    .map((ch) => {
      const cls = ch.slug === currentSlug ? " class='toc-current'" : "";
      return `<li${cls}><a href='${chapterUrl(ch.slug)}'>${ch.title}</a></li>`;
    })
    .join("\n");
}

function buildNavHtml(chapterIndex) {
  const prev = chapters[chapterIndex - 1];
  const next = chapters[chapterIndex + 1];
  const num = chapterIndex + 1;
  const total = chapters.length;

  let links = "<div class='nav-links'>";
  if (prev) {
    links += `<a href='${chapterUrl(prev.slug)}' class='nav-prev'>${prev.title}</a>`;
  } else {
    links += "<span></span>";
  }
  links += `<span class='nav-current'>${num}\u2009/\u2009${total}</span>`;
  if (next) {
    links += `<a href='${chapterUrl(next.slug)}' class='nav-next'>${next.title}</a>`;
  } else {
    links += "<span></span>";
  }
  links += "<button class='theme-toggle' type='button'></button>";
  links += "</div>";

  const toc =
    "<details class='toc'>" +
    "<summary>Содержание</summary>" +
    `<ol class='toc-list'>${buildTocHtml(chapters[chapterIndex].slug)}</ol>` +
    "</details>";

  return `<nav class='chapter-nav'>${links}${toc}</nav>`;
}

gulp.task("html", function () {
  const template = fs.readFileSync("./src/page-template.html", "utf8");
  const srcBase = path.resolve("./src");

  const files = chapters.map((chapter, i) => {
    const sectionsIncludes = chapter.sections
      .map((num) => `    @@include('./sections/${num}.html')`)
      .join("\n");

    const navHtml = buildNavHtml(i);

    let pageContent = template
      .replace("<!-- SECTIONS_PLACEHOLDER -->", sectionsIncludes)
      .replace(/<!-- NAV_PLACEHOLDER -->/g, navHtml);

    const filename = chapterUrl(chapter.slug);

    return new Vinyl({
      base: srcBase,
      path: path.join(srcBase, filename),
      contents: Buffer.from(pageContent),
    });
  });

  return Readable.from(files)
    .pipe(
      fileinclude({
        prefix: "@@",
        basepath: srcBase,
      })
    )
    .pipe(
      typograf({
        locale: ["ru", "en-US"],
        enableRule: ["ru/optalign/*"],
        disableRule: ["ru/nbsp/afterNumberSign"],
        rules: typografRules,
      })
    )
    .pipe(htmlmin({ collapseWhitespace: true }))
    .pipe(gulp.dest("./dist/"));
});

gulp.task("css", function () {
  return gulp
    .src("./src/css/style.css")
    .pipe(importCss())
    .pipe(gulp.dest("./dist/css/"));
});

gulp.task("js", function () {
  return gulp
    .src([
      "./node_modules/prismjs/prism.js",
      "./node_modules/prismjs/components/prism-diff.min.js",
      "./node_modules/prismjs/components/prism-json.min.js",
      "./node_modules/prismjs/plugins/line-numbers/prism-line-numbers.min.js",
      "./node_modules/ilyabirman-likely/release/likely.min.js",
      "./src/js/theme-toggle.js",
    ])
    .pipe(concat("libs.js"))
    .pipe(gulp.dest("./dist/js/"));
});

gulp.task("minify", async function () {
  const imagemin = (await import("gulp-imagemin")).default;
  return gulp
    .src("./src/img/**/*.{jpg,png}")
    .pipe(imagemin())
    .pipe(gulp.dest("./dist/img/"));
});

gulp.task("webp", async function () {
  const webp = (await import("gulp-webp")).default;
  return gulp
    .src("./src/img/**/*.{jpg,png}")
    .pipe(webp())
    .pipe(gulp.dest("./dist/img/"));
});

gulp.task("avif", async function () {
  const avif = (await import("gulp-avif")).default;
  return gulp
    .src("./src/img/**/*.{jpg,png}")
    .pipe(avif())
    .pipe(gulp.dest("./dist/img/"));
});

gulp.task("images", gulp.series("minify", "webp", "avif"));

gulp.task("meta", function () {
  return gulp.src("./src/meta/**/*").pipe(gulp.dest("./dist/meta/"));
});

gulp.task("watch", function () {
  gulp.watch(WATCHERS.html, gulp.series("html"));
  gulp.watch(WATCHERS.styles, gulp.series("css"));
  gulp.watch(WATCHERS.js, gulp.series("js"));
});

gulp.task(
  "default",
  gulp.series("html", "css", "js", "images", "meta", "watch")
);

gulp.task("build", gulp.series("html", "css", "js", "images", "meta"));
