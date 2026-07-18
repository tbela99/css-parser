// Unified adapter over every CSS minifier shown on the official
// @tbela99/css-parser benchmark page (https://tbela99.github.io/css-parser/benchmark/index.html),
// so the same list can drive both the Vitest bench file and the
// size-computation pass that feeds the HTML report.

import { readFileSync } from "node:fs";
import CleanCSS from "clean-css";
import postcss from "postcss";
import cssnano from "cssnano";
import * as csso from "csso";
import * as csstree from "css-tree";
import * as esbuild from "esbuild";
import { transform as lightningTransform } from "lightningcss";
import { transform as tbelaTransform } from "@tbela99/css-parser";

function pkgVersion(name, pathToPkgJson) {
    return JSON.parse(readFileSync(new URL(`../node_modules/${pathToPkgJson}`, import.meta.url))).version;
}

const versions = {
    "clean-css": pkgVersion("clean-css", "clean-css/package.json"),
    cssnano: pkgVersion("cssnano", "cssnano/package.json"),
    csso: pkgVersion("csso", "csso/package.json"),
    "css-tree": pkgVersion("css-tree", "css-tree/package.json"),
    esbuild: pkgVersion("esbuild", "esbuild/package.json"),
    lightningcss: pkgVersion("lightningcss", "lightningcss/package.json"),
    "css-parser": pkgVersion("css-parser", "@tbela99/css-parser/package.json"),
};

const cleanCssInstance = new CleanCSS();
const cssnanoProcessor = postcss([cssnano]);

/**
 * Every entry: { id, label, minify(css: string): Promise<string> | string }
 * `id` is used as the bench()/report column key; `label` mirrors the
 * official table's "name - version" formatting.
 */
export const minifiers = [
    {
        id: "clean-css",
        label: `clean-css - ${versions["clean-css"]}`,
        minify: (css) => cleanCssInstance.minify(css).styles,
    },
    {
        id: "cssnano",
        label: `cssnano - ${versions.cssnano}`,
        minify: async (css) => (await cssnanoProcessor.process(css, { from: undefined })).css,
    },
    {
        id: "csso",
        label: `csso - ${versions.csso}`,
        minify: (css) => csso.minify(css).css,
    },
    {
        id: "css-tree",
        label: `css-tree - ${versions["css-tree"]}`,
        // css-tree has no dedicated minifier API; parse+generate already
        // drops whitespace/comments, which is how the official benchmark
        // treats it too (no property-level optimization, just compact output).
        minify: (css) => csstree.generate(csstree.parse(css)),
    },
    {
        id: "esbuild",
        label: `esbuild - ${versions.esbuild}`,
        minify: async (css) => (await esbuild.transform(css, { loader: "css", minify: true })).code,
    },
    {
        id: "lightningcss",
        label: `lightningcss - ${versions.lightningcss}`,
        minify: (css) => lightningTransform({ filename: "style.css", code: Buffer.from(css), minify: true }).code.toString(),
    },
    {
        id: "css-parser",
        label: `@tbela99/css-parser - ${versions["css-parser"]}`,
        minify: async (css) => (await tbelaTransform(css, { minify: true })).code,
    },
];
