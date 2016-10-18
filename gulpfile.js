/* jslint node:true, esnext:true */
'use strict';
/*
    Copyright 2016 Enigma Marketing Services Limited

    Licensed under the Apache License, Version 2.0 (the "License");
    you may not use this file except in compliance with the License.
    You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing, software
    distributed under the License is distributed on an "AS IS" BASIS,
    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    See the License for the specific language governing permissions and
    limitations under the License.
*/
const
    gulp = require('gulp'),
    istanbul = require('gulp-istanbul'),
    mocha = require('gulp-mocha'),
    eslint = require('gulp-eslint'),
    path = require('path'),
    coveralls = require('gulp-coveralls');

gulp.task('lint', () => {
    return gulp
        .src('lib/**/*.js')
        .pipe(eslint({
            extends: 'eslint:recommended',
            ecmaFeatures: {
                'modules': true
            },
            rules: {},
            globals: [],
            envs: [
            'node'
        ]
        }))
        .pipe(eslint.format());
});

gulp.task('pre-test', ['pre-test:clean'], function () {
    return gulp
        .src('lib/**/*.js')
        .pipe(istanbul({
            includeUntested: true
        }))
        .pipe(istanbul.hookRequire());
});

gulp.task('test', ['istanbul'], () => {
    if (!process.env.CI) {
        process.exit(0);
    }
    process.exit(0); // until coveralls fixed
    return gulp
        .src(path.join(__dirname, 'coverage/lcov.info'))
        .pipe(coveralls())
        .on('end', () => {
            process.exit(0);
        });
});

gulp.task('istanbul', ['pre-test'], function () {
    return gulp.src('test/**/*.js')
        .pipe(mocha({
            bail: true,
            timeout: 50000
        }))
        .pipe(istanbul.writeReports({
            reporters: ['lcov', 'json', 'text', 'text-summary', 'html']
        }))
        .pipe(istanbul.enforceThresholds({
            thresholds: {
                global: 1
            }
        }));
});

gulp.task('mocha', ['pre-test:clean'], function () {
    return gulp.src('test/**/*.js')
        .pipe(mocha({
            bail: true,
            timeout: 50000
        }));
});
