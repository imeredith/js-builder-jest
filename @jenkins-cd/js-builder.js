// node imports
var fs = require('fs');
var path = require('path');
// npm imports
var gulp = require('gulp');
var jest = require('gulp-jest').default;
var minimist = require('minimist');
var del = require('del');
// basic config
var testMatch = ['**/?(*-)(spec|test).js?(x)'];
var coveragePath = 'target/jest-coverage';
var reportsPath = 'target/jest-reports/junit.xml';
// logging functions, defaulted to console's
var logInfo = console.log;
var logError = console.error;


function filterKeys(originalObj, excludedKeys) {
    // early out
    if (!excludedKeys.length) {
        return Object.assign({}, originalObj);
    }

    var filteredObj = {};

    for (var keyName in originalObj) {
        if (excludedKeys.indexOf(keyName) === -1) {
            filteredObj[keyName] = originalObj[keyName];
        } else {
            logInfo('ignoring Jest custom config key "'+keyName+'"');
        }
    }

    return filteredObj;
}

function getMergedConfig(defaultConfig, excludedKeys = []) {
    var packageFile = fs.readFileSync(
        path.resolve(process.cwd(), './package.json'),
        'UTF-8'
    );

    if (!packageFile) {
        console.warn('no package.json was found; using default js-builder-jest config');
        return defaultConfig;
    }

    var packageObj = JSON.parse(packageFile);
    var customConfig = {};

    if (packageObj.jest) {
        customConfig = filterKeys(packageObj.jest, excludedKeys);
    }

    // merge any custom config properties from package.json's "jest" object with the defaultConfig's
    defaultConfig = Object.assign({}, defaultConfig, customConfig);
    return defaultConfig;
}

function getMergedCliOptions(defaultCliOptions) {
    var customCliOptions = minimist(process.argv.slice(2));
    // delete special underscore value from minimust
    delete customCliOptions._;
    // special short for defining testPathPattern with --test
    if (customCliOptions.test) {
        customCliOptions.testPathPattern = customCliOptions.test;
        delete customCliOptions.test;
    }
    var mergedCliOptions = Object.assign({}, defaultCliOptions, customCliOptions);
    // force any keys with value of string "false" to boolean false
    for (var cliOpt in mergedCliOptions) {
        if (mergedCliOptions[cliOpt] === 'false') {
            mergedCliOptions[cliOpt] = false;
        }
    }
    return mergedCliOptions;
}

function runJest(jestConfig, cliOptions = {}, excludedConfigKeys = []) {
    logInfo('cleaning coverage and reports');
    del(coveragePath);
    del(reportsPath);

    // build combined CLI options. see: https://facebook.github.io/jest/docs/cli.html#options
    // includes default 'cliOptions' plus anything passed via command line, e.g. -- -u
    var cliOptions = getMergedCliOptions(cliOptions);

    // build combined Jest config. see: https://facebook.github.io/jest/docs/configuration.html#options
    // includes default 'jestConfig', plus anything from package.json "jest" property (except any excluded keys)
    var mergedConfig = getMergedConfig(jestConfig, excludedConfigKeys);

    logInfo('using jest CLI options = \n' + JSON.stringify(cliOptions, null, '\t'));
   
    // combine the config to the format that gulp-jest expects
    var jestRunnerOptions = Object.assign({}, cliOptions);
    jestRunnerOptions.config = Object.assign({}, mergedConfig);
  
    logInfo('using jest config = \n' + JSON.stringify(jestRunnerOptions.config, null, '\t'));

    return gulp.src('.')
        .pipe(jest(jestRunnerOptions.config))
        .on('end', function () {
            logInfo('tests completed successfully!');
        })
        .on('error', function () {
            logError('tests failed or errored!');
            process.exit(1);
        });
}

function taskTest(builder) {
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

    return runJest(
        {
            collectCoverage: true,
            collectCoverageFrom: collectCoverageFrom,
            coverageDirectory: coveragePath,
            testMatch: testMatch,
            testResultsProcessor: 'jest-junit'
        }
    );
}

function taskTestFast() {
    logInfo('running js-builder-jest:test:fast');

    return runJest(
        {
            testMatch: testMatch,
        },
        {},
        // don't allow these to be overriden
        ['collectCoverage', 'testResultsProcessor']
    );
}

function taskTestDebug() {
    logInfo('running js-builder-jest:test:debug');

    return runJest(
        {
            testMatch: testMatch
        },
        {
            runInBand: true,
        },
        // don't allow these to be overriden
        ['collectCoverage']
    );
}

exports.install = function(builder) {
    logInfo = builder.logger.logInfo;
    logError = builder.logger.logError;

    builder.defineTask('test', () => taskTest(builder));
    builder.defineTask('test:fast', () => taskTestFast(builder));
    builder.defineTask('test:debug', () => taskTestDebug(builder));
    builder.defineTask('test:watch', (done) => {
        logInfo('running js-builder-jest:test:watch');
        logInfo('watch is not supported. maybe later.');
        done();
    });
}
