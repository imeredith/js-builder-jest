var gulp = require('gulp');
var jest = require('gulp-jest').default;
var minimist = require('minimist');
var del = require('del');


var testMatch = ['**/?(*-)(spec|test).js?(x)'];
var coveragePath = 'target/jest-coverage';
var reportsPath = 'target/jest-reports/junit.xml';


function install(builder) {
    var logInfo = builder.logger.logInfo;
    var logError = builder.logger.logError;

    logInfo('installing js-builder-jest into js-builder');

    function runJest(jestOptions) {
        var options = jestOptions;
        var argv = minimist(process.argv.slice(2));
        options.testPathPattern = argv.test || null;

        logInfo('cleaning coverage and reports');
        del(coveragePath);
        del(reportsPath);

        return gulp.src('.')
            .pipe(jest(options))
            .on('end', function () {
                logInfo('tests completed successfully!');
            })
            .on('error', function () {
                logError('tests failed or errored!');
                process.exit(1);
            });
    }

    builder.defineTask('test', function () {
        var collectCoverageFrom;

        logInfo('running js-builder-jest:test');

        if (!process.env.JEST_JUNIT_OUTPUT) {
            process.env.JEST_JUNIT_OUTPUT = reportsPath;
        }

        // measure coverage from all js/x files in source paths
        collectCoverageFrom = builder.paths.srcPaths.map(function (path) {
            return path + '/**/*.{js,jsx}';
        });

        logInfo('collectCoverageFrom: ' + collectCoverageFrom.join(', '));

        return runJest({
            config: {
                collectCoverage: true,
                collectCoverageFrom: collectCoverageFrom,
                coverageDirectory: coveragePath,
                testMatch: testMatch,
                testResultsProcessor: 'jest-junit'
            }
        });
    });

    builder.defineTask('test:fast', function () {
        logInfo('running js-builder-jest:test:fast');

        return runJest({
            notify: true,
            config: {
                testMatch: testMatch
            }
        });
    });

    builder.defineTask('test:debug', function () {
        logInfo('running js-builder-jest:test:debug');

        return runJest({
            runInBand: true,
            config: {
                testMatch: testMatch
            }
        });
    });

    builder.defineTask('test:watch', function (done) {
        logInfo('running js-builder-jest:test:watch');
        logInfo('watch is not supported. maybe later.');
        done();
    });
}

exports.install = install;
