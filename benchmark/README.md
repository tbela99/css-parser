# CSS minification benchmark (Vitest)

using [Vitest's built-in `bench()`](https://vitest.dev/guide/features.html#benchmarking)
(powered by tinybench) for timing, plus a separate deterministic pass for
output size, merged into a self-contained dark-themed HTML report.

Same library set as the official page: `clean-css`, `cssnano`, `csso`,
`css-tree`, `esbuild`, `lightningcss`, `@tbela99/css-parser`.

## Layout

```
fixtures/               real-world CSS files used as benchmark input
src/minifiers.js        adapter: unifies each library's API + reads its installed version
src/fixtures.js         loads the fixture files
src/compute-sizes.js    one deterministic pass -> results/sizes.json (byte size per file x library)
src/generate-report.js  merges sizes.json + bench-results.json -> results/benchmark.html
bench/minify.bench.js   the actual Vitest bench file (one describe per file, one bench per library)
```

## Run it

```bash
npm install
npm run all       # sizes -> bench -> report
open results/benchmark.html
```

Or step by step:

```bash
npm run sizes      # writes results/sizes.json
npm run bench       # writes results/bench-results.json (vitest bench --outputJson)
npm run report      # writes results/benchmark.html
```

## Notes

- Each (file x library) benchmark is time-boxed to 300ms with a 5-iteration
  floor (`bench/minify.bench.js`'s `BENCH_OPTIONS`) to keep the full 6-file
  x 7-library suite finishing in a reasonable time. Raise `time`/`iterations`
  for tighter confidence intervals if you have a few more minutes to spare.
- Size and timing are computed in separate passes on purpose: byte size is
  deterministic per input and doesn't benefit from repeated sampling, so
  bundling it inside the timed `bench()` function would just add noise to
  the timing without adding any information.
- If a library throws on a given file (this happened with `lightningcss` on
  `foundation.css` in testing -- "Invalid media query"), both passes catch
  it and render `n/a` for that cell rather than crashing the whole run.
- To add more fixture files: drop a `.css` file in `fixtures/` and add its
  name to the `files` array in `src/fixtures.js`.
- To add another library: add an entry to the `minifiers` array in
  `src/minifiers.js` with an `id`, a `label`, and a `minify(css)` function
  (sync or async).
