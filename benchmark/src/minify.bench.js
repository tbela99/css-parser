import { describe, test } from "vitest";
import { minifiers } from "./minifiers.js";
import { fixtures } from "./fixtures.js";

// Time budget per (file x library) benchmark. Keeps the whole suite
// (6 files x 7 libraries = 42 benchmarks) finishing in a reasonable time
// while still giving Vitest/tinybench enough samples for a stable mean.
const BENCH_OPTIONS = { time: 300, iterations: 5 };

for (const fixture of fixtures) {
    describe(fixture.name, () => {
        test(fixture.name, async ({ bench }) => {
            for (const minifier of minifiers) {
                 bench(
                    minifier.id,
                    BENCH_OPTIONS,
                    async () => {
                        await minifier.minify(fixture.css);
                    },
                );
            }
        });
    });
}
