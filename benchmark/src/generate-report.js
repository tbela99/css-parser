import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { minifiers } from "./minifiers.js";
import { fixtures } from "./fixtures.js";

const resultsDir = fileURLToPath(new URL("../results/", import.meta.url));

const benchRaw = JSON.parse(readFileSync(resultsDir + "bench-results.json", "utf8"));
const sizes = JSON.parse(readFileSync(resultsDir + "sizes.json", "utf8"));

// benchRaw.files[].groups[].benchmarks[] -> { [fixtureName]: { [minifierId]: meanMs } }
const timings = {};
for (const file of benchRaw.files) {
    for (const group of file.groups) {
        // group.fullName looks like "bench/minify.bench.js > <fixtureName>"
        const fixtureName = group.fullName.split(">").pop().trim();
        timings[fixtureName] ??= {};
        for (const b of group.benchmarks) {
            timings[fixtureName][b.name] = b.mean; // milliseconds
        }
    }
}

function fmtBytes(n) {
    return n == null ? "n/a" : n.toLocaleString("en-US") + " bytes";
}
function fmtMs(n) {
    return n == null ? "n/a" : n.toFixed(2) + " ms";
}
function fmtReduction(original, minified) {
    if (minified == null) return "n/a";
    const pct = (1 - minified / original) * 100;
    return (pct >= 0 ? "-" : "+") + Math.abs(pct).toFixed(1) + "%";
}

const totalOriginal = fixtures.reduce((sum, f) => sum + f.size, 0);

let bodyRows = "";
for (const fixture of fixtures) {
    bodyRows += `<tr><td class="file-cell">${fixture.name}<br><span class="orig-size">original: ${fixture.size.toLocaleString("en-US")} bytes</span></td>`;
    for (const m of minifiers) {
        const size = sizes[fixture.name]?.[m.id];
        const ms = timings[fixture.name]?.[m.id];
        bodyRows += `<td>
            <div class="metric"><span class="metric-label">final:</span> ${fmtBytes(size)}</div>
            <div class="metric reduction">${fmtReduction(fixture.size, size)}</div>
            <div class="metric time"><span class="metric-label">time:</span> ${fmtMs(ms)}</div>
        </td>`;
    }
    bodyRows += `</tr>\n`;
}

// totals row
let totalRow = `<tr class="total-row"><td class="file-cell">Total<br><span class="orig-size">original: ${totalOriginal.toLocaleString("en-US")} bytes</span></td>`;
for (const m of minifiers) {
    const totalSize = fixtures.reduce((sum, f) => sum + (sizes[f.name]?.[m.id] ?? 0), 0);
    const anyMissing = fixtures.some((f) => sizes[f.name]?.[m.id] == null);
    const totalMs = fixtures.reduce((sum, f) => sum + (timings[f.name]?.[m.id] ?? 0), 0);
    totalRow += `<td>
        <div class="metric"><span class="metric-label">final:</span> ${anyMissing ? fmtBytes(totalSize) + " (partial)" : fmtBytes(totalSize)}</div>
        <div class="metric reduction">${anyMissing ? "n/a" : fmtReduction(totalOriginal, totalSize)}</div>
        <div class="metric time"><span class="metric-label">time:</span> ${fmtMs(totalMs)}</div>
    </td>`;
}
totalRow += `</tr>\n`;

const headerCells = minifiers.map((m) => `<th>${m.label}</th>`).join("\n");

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>CSS minification benchmark results (local reproduction)</title>
<style>
  :root { color-scheme: dark; }
  body {
    background: #0d1117;
    color: #c9d1d9;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
    margin: 0;
    padding: 2rem;
  }
  h1 { font-size: 1.4rem; margin-bottom: 0.25rem; }
  .subtitle { color: #8b949e; margin-bottom: 1.5rem; font-size: 0.9rem; }
  table {
    border-collapse: collapse;
    width: 100%;
    font-size: 0.82rem;
  }
  th, td {
    border: 1px solid #30363d;
    padding: 0.5rem 0.6rem;
    text-align: left;
    white-space: nowrap;
  }
  th {
    background: #161b22;
    position: sticky;
    top: 0;
    font-weight: 600;
  }
  td.file-cell { font-weight: 600; background: #11161c; }
  .orig-size { color: #8b949e; font-weight: 400; font-size: 0.78rem; }
  .metric { line-height: 1.5; }
  .metric-label { color: #8b949e; font-size: 0.75rem; }
  .metric.reduction { color: #7ee787; font-size: 0.78rem; font-weight: 600; }
  .metric.time { color: #58a6ff; font-size: 0.78rem; }
  tr.total-row td { background: #161b22; font-weight: 700; }
  tr.total-row .metric.time { color: #79c0ff; }
  tr.total-row .metric.reduction { color: #56d364; }
  .meta {
    margin-top: 1.5rem;
    color: #8b949e;
    font-size: 0.8rem;
    white-space: pre-wrap;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  }
  a { color: #58a6ff; }
</style>
</head>
<body>
<h1>CSS Minification Benchmark (local reproduction)</h1>
<p class="subtitle">
  Same library set as
  <a href="https://tbela99.github.io/css-parser/benchmark/index.html" target="_blank">the official @tbela99/css-parser benchmark</a>,
  run locally with Vitest bench (tinybench) for timing + a separate deterministic pass for output size.
  Each row header shows the original (pre-minification) file size; each cell shows the minified size, the size reduction, and the processing time for that library.
</p>
<table>
  <thead>
    <tr><th>File</th>${headerCells}</tr>
  </thead>
  <tbody>
    ${bodyRows}
    ${totalRow}
  </tbody>
</table>
<div class="meta">Generated: ${new Date().toUTCString()}
Node: ${process.version}
Platform: ${process.platform} ${process.arch}
Bench engine: Vitest bench (tinybench) -- time-boxed to 300ms per (file x library) with a 5-iteration floor
</div>
</body>
</html>
`;

writeFileSync(resultsDir + "benchmark.html", html);
console.log("wrote results/benchmark.html");
