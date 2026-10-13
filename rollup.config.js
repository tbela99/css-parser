import dts from "rollup-plugin-dts";
import typescript from "@rollup/plugin-typescript";
import nodeResolve from "@rollup/plugin-node-resolve";
import json from "@rollup/plugin-json";
import commonjs from "@rollup/plugin-commonjs";
import versionInjector from "rollup-plugin-version-injector";

export default [
    {
        input: ["src/node.ts", "src/web.ts"],
        treeshake: "smallest",
        plugins: [versionInjector(), nodeResolve(), commonjs({ transformMixedEsModules: true }), json(), typescript()],
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
        plugins: [versionInjector(), nodeResolve(), commonjs({ transformMixedEsModules: true }), json(), typescript()],
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
        plugins: [versionInjector(), nodeResolve(), commonjs({ transformMixedEsModules: true }), json(), typescript()],
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
        plugins: [versionInjector(), dts()],
        output: {
            file: "./dist/index.d.ts",
            format: "es",
        },
    },
];
