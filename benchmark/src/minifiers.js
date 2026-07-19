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
import { type } from "node:os";

function pkgVersion(name, pathToPkgJson) {
    const { version, repository } = JSON.parse(
        readFileSync(new URL(`../node_modules/${pathToPkgJson}`, import.meta.url)),
    );

    const response = {};

    if (version) {
        response.version = version;
    }

    if (repository != null) {
        let url = null;

        if (typeof repository === "string") {
            url = repository;
        } else if (repository.url != null) {
            url = repository.url;
        }

        if (url != null) {
            // github:user/repo
            const githubShorthand = url.match(/^github:([^/]+\/[^/]+)$/);
            if (githubShorthand) {
                url = `https://github.com/${githubShorthand[1]}`;
            }

            //   else if (!url.match(/[a-zA-Z]+:/)) {

            //   }
            else {
                url = url
                    .replace(/^git\+/, "")
                    .replace(/^git@github\.com:/, "https://github.com/")
                    .replace(/^ssh:\/\/git@github\.com\//, "https://github.com/")
                    .replace(/\.git$/, "");
            }
            if (!url.match(/[a-zA-Z]+:/)) {
                url = "https://github.com/" + url;
            }

            response.url = url;
        }
    }

    return response;
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
        url: versions["clean-css"].url,
        label: `clean-css - ${versions["clean-css"].version}`,
        minify: (css) => cleanCssInstance.minify(css).styles,
    },
    {
        id: "cssnano",
        url: versions.cssnano.url,
        label: `cssnano - ${versions.cssnano.version}`,
        minify: async (css) => (await cssnanoProcessor.process(css, { from: undefined })).css,
    },
    {
        id: "csso",
        url: versions.csso.url,
        label: `csso - ${versions.csso.version}`,
        minify: (css) => csso.minify(css).css,
    },
    {
        id: "css-tree",
        url: versions["css-tree"].url,
        label: `css-tree - ${versions["css-tree"].version}`,
        // css-tree has no dedicated minifier API; parse+generate already
        // drops whitespace/comments, which is how the official benchmark
        // treats it too (no property-level optimization, just compact output).
        minify: (css) => csstree.generate(csstree.parse(css)),
    },
    {
        id: "esbuild",
        url: versions.esbuild.url,
        label: `esbuild - ${versions.esbuild.version}`,
        minify: async (css) => (await esbuild.transform(css, { loader: "css", minify: true })).code,
    },
    {
        id: "lightningcss",
        url: versions.lightningcss.url,
        label: `lightningcss - ${versions.lightningcss.version}`,
        minify: (css) =>
            lightningTransform({ filename: "style.css", code: Buffer.from(css), minify: true }).code.toString(),
    },
    {
        id: "css-parser",
        url: versions["css-parser"].url,
        label: `@tbela99/css-parser - ${versions["css-parser"].version}`,
        minify: async (css) => (await tbelaTransform(css, { minify: true })).code,
    },
];
