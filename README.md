# Jest support for Jenkins JS Builder

Run your tests with Jenkins JS Builder using the "Jest" test runner.

The default location for tests is the `test` folder.
The file names need to match the pattern "*-spec.js" or "*-test.js"; the "jsx" extension is also supported.
The default location can be overridden by calling `builder.tests(<new-path>)`.

## 'test' Task

```
jjsbuilder --tasks test
```

Run the tests and produces test and coverage reports.

You can limit the tests that are run via the `test` parameter. This is a pattern that is passed to Jest's [testMatch](https://facebook.github.io/jest/docs/configuration.html#testmatch-array-string) parameter.

```
jjsbuilder --tasks test -- --test calculator # runs any test with 'calculator' in the name
jjsbuilder --tasks test -- --test /math/ # run any test inside of a 'math' folder
jjsbuilder --tasks test -- --test test/src/js/foo/bar/foobar-spec # run a single test
```

JUnit test reports are stored in `reports/` and coverage reports in `coverage/`.
Note that coverage is only measured for .js and .jsx files in the source directories (default: `src`).

## 'test:fast" Task

```
jjsbuilder --tasks test:fast
```

Runs the tests but skips generation of reports and coverage. 
It also displays an OS notification when tests complete.
This is good for local development.

## 'test:debug' Task

Coming soon.

## 'test:watch' Task

Coming later.
