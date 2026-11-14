# Contributing

Thanks for your interest in contributing to CSS Parser. This guide explains how to get the project running locally, update its generated configuration data, run the checks, and submit a change. It is intended to help new contributors get started and make contributions easier to review.

## Get the source

1. Fork the repository on GitHub.
2. Clone your fork and enter the project directory:

	```sh
	git clone https://github.com/<your-user-name>/css-parser.git
	cd css-parser
	```

3. Add the upstream repository and install the root project dependencies:

	```sh
	git remote add upstream https://github.com/tbela99/css-parser.git
	npm install
	```

4. Create a branch for your change:

	```sh
	git switch -c descriptive-branch-name
	```

Use a current Node.js release compatible with the project dependencies.

## Update generated configuration

The repository includes scripts for refreshing generated CSS shorthand properties and syntax data. Run them from the project root:

```sh
npm run config-update
npm run syntax-update
```

`config-update` regenerates `src/data/properties.json`. `syntax-update` regenerates `src/data/validation.json` from the consolidated [W3C webref](https://github.com/w3c/webref) CSS definitions (`https://cdn.jsdelivr.net/npm/@webref/css@8.7.8/css.json`, `@webref/css` is not a dependency: update the version in `scripts/webref.ts` to use a newer version. mdn-data and the csstree patch are also pulled from versioned urls) and therefore requires an internet connection. It prints a summary of the syntax changes and appends it to `SYNTAX-CHANGES.md` (ignored by git): port the relevant changes to `CHANGELOG.md`. The removed definitions are grouped by origin (legacy mdn-data, mdn-data patch, `scripts/local-patch.json` or removed from webref), using the origins saved in `src/data/validation.origins.json`: commit it with `src/data/validation.json`. The properties and the selectors that webref does not define keep their mdn-data definition, with the types they reference (the non standard properties `box-orient`, `font-smooth`, `-ms-user-select`, `-webkit-tap-highlight-color`, the pseudo elements `::-webkit-slider-thumb`): the results are the same as with the syntax files generated from mdn-data. The other definitions that webref does not provide (prose syntaxes, units) are added to `scripts/local-patch.json`. The renamed properties (the legacy name aliases of webref that are not vendor prefixed) are reported as renamed: add them to `renamedStandardProperties` (`src/lib/syntax/syntax.ts`). The vendor prefixed legacy name aliases are stored as aliases of the standard property, with no other key (`"-webkit-align-content": { "alias": "align-content" }`): they are validated with its syntax and they are not renamed. When mdn-data, the csstree patch or `scripts/local-patch.json` provide a legacy syntax for a vendor prefixed alias, the syntax of the standard property is extended with it (`-webkit-mask-clip: <'mask-clip'> | [ <coord-box> | no-clip | border | padding | content | text ]#`): add the legacy syntax of a vendor prefixed alias to `scripts/local-patch.json`, the script adds the syntax of the standard property. The sources are applied in this order: mdn-data, the csstree patch, `scripts/local-patch.json`. A patch replaces the legacy syntax of the previous sources, or extends it when its syntax starts with `|`. Review the generated changes and include them when they are relevant to your contribution.

## Building

Run the build command:

```sh
npm run build
```

Validate your changes before committing using deno:

```sh
deno publish --dry-run
```

## Run tests

Run the complete Node.js and browser test suites before submitting a change:

```sh
npm test
```

For a quicker, focused check, run either suite:

```sh
npm run test:node
npm run test:web
```

The browser tests use Playwright with Chromium, Firefox, and WebKit. Install the required browsers if Playwright reports that they are missing.

For debugging, run either suite:

```sh
npm run debug:node
npm run debug:web
```
## Check code coverage

Generate Node.js coverage reports with:

```sh
npm run test:cov
```

The command prints a text summary and writes an HTML report under `coverage/`. Browser coverage can be collected separately with:

```sh
npm run test:web-cov
```

When changing behavior, add or update tests that exercise it and use the coverage reports to spot untested paths.

## Run the benchmark

The benchmark has its own dependencies and must be run from the `benchmark/` directory:

```sh
cd benchmark
npm install
npm run all
```

This computes output sizes, runs the timing benchmarks, and generates `benchmark/results/benchmark.html`. Open that report to inspect the results. To run individual stages, use `npm run sizes`, `npm run bench`, or `npm run report` from `benchmark/`.

## Open a pull request

1. Review your changes and make sure no unrelated generated files or benchmark results are included.
2. Run the relevant tests; include coverage or benchmark results when they help explain the change.
3. Push your branch to your fork:

	```sh
	git push -u origin descriptive-branch-name
	```

4. Open a pull request on GitHub against `tbela99/css-parser`'s `master` branch.
5. In the pull request description, explain the problem and the proposed change, link any related issue, and list the checks you ran. Include before-and-after benchmark results for performance-related changes.

Keep each pull request focused, and be ready to discuss or revise the change during review.
