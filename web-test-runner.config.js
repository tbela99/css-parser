// the mocha options of the browser tests: the same timeout as the node tests (`mocha --timeout=10000`). the
// `--timeout` argument of web-test-runner is the timeout of the test files, not of the tests
export default {
    testFramework: {
        config: {
            timeout: 10000,
        },
    },
};
