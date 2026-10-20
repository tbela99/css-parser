import dts from "rollup-plugin-dts";
import typescript from "@rollup/plugin-typescript";
import nodeResolve from "@rollup/plugin-node-resolve";
import json from "@rollup/plugin-json";
import commonjs from "@rollup/plugin-commonjs";
import versionInjector from "rollup-plugin-version-injector";
import config from "./package.json" with { type: "json" };

const versionInjectoroptions = {
    injectInComments: {
        tag: `\n\t${config.description}\n\n\tAuthor(s): ${config.author}\n\tVersion: {version}\n\tLicense: ${config.license}\n`,
    },
};

export default [
    {
        input: ["src/node.ts", "src/web.ts"],
        treeshake: "smallest",
        plugins: [
            versionInjector(versionInjectoroptions),
            nodeResolve(),
            commonjs({ transformMixedEsModules: true }),
            json(),
            typescript(),
        ],
        output: [
            {
                dir: "./dist",
                format: "es",
                preserveModules: true,
            },
        ],
    },
    {
        input: "src/node.ts",
        treeshake: "smallest",
        plugins: [
            versionInjector(versionInjectoroptions),
            nodeResolve(),
            commonjs({ transformMixedEsModules: true }),
            json(),
            typescript(),
        ],
        output: [
            {
                file: "./dist/index.cjs",
                format: "cjs",
                name: "CSSParser",
            },
        ],
    },
    {
        input: "src/web.ts",
        treeshake: "smallest",
        plugins: [
            versionInjector(versionInjectoroptions),
            nodeResolve(),
            commonjs({ transformMixedEsModules: true }),
            json(),
            typescript(),
        ],
        output: [
            {
                file: "./dist/index-umd-web.js",
                format: "umd",
                name: "CSSParser",
            },
        ],
    },
    {
        input: "src/node.ts",
        plugins: [versionInjector(versionInjectoroptions), dts()],
        output: {
            file: "./dist/index.d.ts",
            format: "es",
        },
    },
];
