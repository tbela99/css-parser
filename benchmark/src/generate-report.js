import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { minifiers } from "./minifiers.js";
import { fixtures } from "./fixtures.js";

const resultsDir = fileURLToPath(new URL("../results/", import.meta.url));

const benchRaw = JSON.parse(readFileSync(resultsDir + "bench-results.json", "utf8"));
const sizes = JSON.parse(readFileSync(resultsDir + "sizes.json", "utf8"));

// benchRaw.files[].groups[].benchmarks[] -> { [fixtureName]: { [minifierId]: meanMs } }
const timings = {};
for (const assertionResult of benchRaw.testResults[0]?.assertionResults ?? []) {
    // for (const group of file.groups) {
    // group.fullName looks like "bench/minify.bench.js > <fixtureName>"
    // const fixtureName = assertionResult.title;
    // timings[fixtureName] ??= {};
    for (const b of assertionResult.benchmarks) {
        timings[b.name] ??= {};

        for (const task of b.tasks) {

            const fixtureName = task.name;
            timings[b.name][fixtureName] ??= {};
            timings[b.name][fixtureName] = task.period; // milliseconds
        }
    }
    // }
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

// the files, from the largest to the smallest
const files = [...fixtures].sort((a, b) => b.size - a.size);

// one cell of the table: the final size, the reduction and the time
function cell(original, size, ms, partial = false) {
    return `<td>
            <div class="metric"><span class="metric-label">final:</span> ${partial ? fmtBytes(size) + " (partial)" : fmtBytes(size)}</div>
            <div class="metric reduction${size == null || partial ? " missing" : ""}">${partial ? "n/a" : fmtReduction(original, size)}</div>
            <div class="metric time"><span class="metric-label">time:</span> ${fmtMs(ms)}</div>
        </td>`;
}

// the files in the header, the total first
const headerCells = [
    `<th class="total-col">Total<br><span class="orig-size">original: ${totalOriginal.toLocaleString("en-US")} bytes</span></th>`,
    ...files.map((fixture) => `<th>${fixture.name}<br><span class="orig-size">original: ${fixture.size.toLocaleString("en-US")} bytes</span></th>`),
].join("\n");

// the total time of a minifier, null when it has no timing
function totalTime(m) {
    const times = fixtures.map((f) => timings[f.name]?.[m.id]).filter((ms) => ms != null);
    return times.length === 0 ? null : times.reduce((sum, ms) => sum + ms, 0);
}

// the minifiers, from the fastest to the slowest (the minifiers without timing last)
const ranked = [...minifiers].sort((a, b) => (totalTime(a) ?? Infinity) - (totalTime(b) ?? Infinity));

// one row per minifier: more minifiers can be added without scrolling right
let bodyRows = "";
for (const m of ranked) {
    const label = m.url != null ? `<a href="${m.url}" target="_top"${m.title != null ? ` title="${m.title}"` : ""}>${m.label}</a>` : m.label;
    const totalSize = fixtures.reduce((sum, f) => sum + (sizes[f.name]?.[m.id] ?? 0), 0);
    const anyMissing = fixtures.some((f) => sizes[f.name]?.[m.id] == null);
    const totalMs = fixtures.reduce((sum, f) => sum + (timings[f.name]?.[m.id] ?? 0), 0);

    bodyRows += `<tr><th class="minifier-cell" scope="row">${label}</th>`;
    bodyRows += cell(totalOriginal, totalSize, totalMs, anyMissing).replace("<td>", '<td class="total-col">');

    for (const fixture of files) {
        bodyRows += cell(fixture.size, sizes[fixture.name]?.[m.id], timings[fixture.name]?.[m.id]);
    }

    bodyRows += `</tr>\n`;
}

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>CSS minification benchmark results</title>
<meta name="description" content="CSS minification benchmark results">
<meta name="keywords" content="@tbela99/css-parser, css, minifier, benchmark">
<style>
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
  .table-wrapper { overflow-x: auto; max-height: calc(100vh - 8rem); }
  thead th {
    background: #161b22;
    position: sticky;
    top: 0;
    z-index: 1;
    font-weight: 600;
    vertical-align: top;
  }
  /* the minifiers stay visible when the files scroll */
  .minifier-cell {
    position: sticky;
    left: 0;
    z-index: 2;
    background: #11161c;
    font-weight: 600;
  }
  thead th.minifier-cell { z-index: 3; background: #161b22; }
  .orig-size { color: #8b949e; font-weight: 400; font-size: 0.78rem; }
  .metric { line-height: 1.5; }
  .metric-label { color: #8b949e; font-size: 0.75rem; }
  .metric.reduction { color: #7ee787; font-size: 0.78rem; font-weight: 600; }
  .metric.reduction.missing { color: #8c241a; }
  .metric.time { color: #58a6ff; font-size: 0.78rem; }
  td.total-col { background: #161b22; font-weight: 700; }
  td.total-col .metric.time { color: #79c0ff; }
  td.total-col .metric.reduction { color: #56d364; }
  td.total-col .metric.reduction.missing { color: #8c241a; }

  .meta {
    margin-top: 1.5rem;
    color: #8b949e;
    font-size: 0.8rem;
    white-space: pre-wrap;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  }
  a { color: #58a6ff; }

  /* the rows: hovered, pressed, and highlighted by a click to ease reading */
  tbody tr { cursor: pointer; }
  tbody tr:hover td, tbody tr:hover .minifier-cell { background: #1c2430; }
  tbody tr:active td, tbody tr:active .minifier-cell { background: #243042; }
  tbody tr.selected td, tbody tr.selected .minifier-cell {
    background: #1f3a5f;
    box-shadow: inset 0 1px 0 #388bfd, inset 0 -1px 0 #388bfd;
  }
  tbody tr.selected:hover td, tbody tr.selected:hover .minifier-cell { background: #24456f; }
</style>
</head>
<body>
<h1>CSS Minification Benchmark</h1>
<div class="table-wrapper">
<table>
  <thead>
    <tr><th class="minifier-cell">Minifier</th>${headerCells}</tr>
  </thead>
  <tbody>
    ${bodyRows}
  </tbody>
</table>
</div>
<script>
  // a click highlights the row (a second click removes the highlight). the links keep their behavior
  document.querySelector("tbody").addEventListener("click", (event) => {
    if (event.target.closest("a") == null) {
      event.target.closest("tr")?.classList.toggle("selected");
    }
  });
</script>
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