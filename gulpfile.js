/**
 *
 *  Web Starter Kit
 *  Copyright 2014 Google Inc. All rights reserved.
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License
 *
 */

'use strict';

// Include Gulp & Tools We'll Use
var gulp = require('gulp');
var $ = require('gulp-load-plugins')();
var rimraf = require('rimraf');
var runSequence = require('run-sequence');
var browserSync = require('browser-sync');
var reload = browserSync.reload;

// Automatically Prefix CSS
gulp.task('styles:css', function () {
    return gulp.src('app/assets/css/**/*.css')
        .pipe($.autoprefixer('last 1 version'))
        .pipe(gulp.dest('app/assets/css'))
        .pipe(reload({stream: true}))
        .pipe($.size({title: 'styles:css'}));
});

// Compile Any Other Sass Files You Added (app/assets/css)
gulp.task('styles:scss', function () {
    return gulp.src(['app/assets/css/**/*.scss'])
        .pipe($.rubySass({
            style: 'expanded',
            precision: 10,
            loadPath: ['app/assets/css']
        }))
        .pipe($.autoprefixer('last 1 version'))
        .pipe(gulp.dest('app/assets/css'))
        .pipe($.size({title: 'styles:scss'}));
});

// Output Final CSS Styles
gulp.task('styles', ['styles:scss', 'styles:css']);


// Watch Files For Changes & Reload
gulp.task('default', function () {
    browserSync.init(null, {
        server: {
            baseDir: ['app']
        },
        notify: false
    });

    gulp.watch(['app/**/*.html'], reload);
    gulp.watch(['app/assets/css/**/*.scss'], ['styles',reload]);
    gulp.watch(['app/assets/css/**/*.css'], reload);
    gulp.watch(['app/assets/js/**/*.js'], reload);
});
