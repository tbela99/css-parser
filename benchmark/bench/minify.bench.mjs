import { bench, describe } from "vitest";
import { minifiers } from "../src/minifiers.js";
import { fixtures } from "../src/fixtures.js";

// Time budget per (file x library) benchmark. Keeps the whole suite
// (6 files x 7 libraries = 42 benchmarks) finishing in a reasonable time
// while still giving Vitest/tinybench enough samples for a stable mean.
const BENCH_OPTIONS = { time: 300, iterations: 5 };

for (const fixture of fixtures) {
    describe(fixture.name, () => {
        for (const minifier of minifiers) {
            bench(
                minifier.id,
                async () => {
                    await minifier.minify(fixture.css);
                },
                BENCH_OPTIONS,
            );
        }
    });
}
