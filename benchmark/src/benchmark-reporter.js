import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

export default class BenchmarkReporter {
    constructor() {
        this.groups = [];
    }

    onTestCaseBenchmark(testCase, benchmark) {
        this.groups.push({
            fullName: testCase.task.name,
            benchmarks: benchmark.tasks.map((task) => ({
                name: task.name,
                mean: task.latency.mean,
            })),
        });
    }

    onTestRunEnd() {
        writeFileSync(
            resolve(process.cwd(), "results/bench-results.json"),
            JSON.stringify({ files: [{ groups: this.groups }] }, null, 2),
        );
    }
}