"use strict";

const gulp = require("gulp");
const pug = require("gulp-pug");
const sass = require("gulp-sass");
const fs = require("fs");
const imagemin = require("gulp-imagemin");

const sourcemaps = require("gulp-sourcemaps");


const path = {
    pugPath: "src/renderer/pug/**/**/*.pug",
    imageminPath: "./src/renderer/img/**/*",
    sassPath: "src/renderer/scss/**/*.scss"
};

const pugTask = () => {
    return gulp.src(path.pugPath)
        .pipe(pug())
        .on("error", error => console.error(error))
        .pipe(gulp.dest("./src/renderer/html"))
        .on("finish", () => {
            console.log("done");
        });
};


const imageminTask = () => {
    return gulp.src(path.imageminPath)
        .pipe(imagemin([
            imagemin.svgo({plugins: [{removeViewBox: true}]})
        ]))
        .pipe(gulp.dest("./src/renderer/img/"));
};


const sassTask = () => {
    return gulp.src(path.sassPath)
        .pipe(sourcemaps.init())
        .pipe(sass({outputStyle: "extended"}).on("error", sass.logError))
        .pipe(sourcemaps.write("./maps"))
        .pipe(gulp.dest("./src/renderer/css/"))
        .on("finish", () => {
            console.log("done");
        });
};

const watch = () => {
    gulp.watch(path.sassPath, sassTask);
    gulp.watch(path.pugPath, pugTask);
    gulp.watch(path.imageminPath, imageminTask);
};

exports.sassTask = sassTask;
exports.pugTask = pugTask;
exports.imageminTask = imageminTask;
exports.watch = watch;

exports.default = gulp.parallel(sassTask, pugTask, imageminTask, watch);
