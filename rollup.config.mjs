import dts from 'rollup-plugin-dts';
import typescript from "@rollup/plugin-typescript";
import nodeResolve from "@rollup/plugin-node-resolve";
import {glob} from "glob";
import terser from "@rollup/plugin-terser";
import json from "@rollup/plugin-json";
import commonjs from "@rollup/plugin-commonjs";

export default [...await glob(['./test/specs/**/*.test.ts', './test/specs/**/*.web.ts']).then(files => files.map(input => {
    return {
        input,
        plugins: [nodeResolve(), commonjs({transformMixedEsModules:true}), json(), typescript()],
        output:
            {
                banner: `/* generate from ${input} */`,
                file: `${input.replace(/\.ts$/, '.js')}`,
                // entryFileNames: '[name].mjs',
                // chunkFileNames: '[name].[hash].mjs',
                format: 'es'
            }
    }
}))
].concat([
    {
        input: 'src/index.ts',
        plugins: [nodeResolve(), commonjs({transformMixedEsModules:true}), json(), typescript()],
        output: [
            {
                // file: './dist/index.mjs',
                dir: './dist',
                format: 'es',
                preserveModules: true
            },
            {
                file: './dist/index-umd.js',
                format: 'umd',
                name: 'CSSParser'
            }
        ]
    },
    {
        input: 'src/index.ts',
        plugins: [nodeResolve(), commonjs({transformMixedEsModules:true}), typescript(), terser(), json()],
        output: [

            {
                file: './dist/index-umd.min.js',
                format: 'umd',
                name: 'CSSParser'
            }
        ]
    },
    {
        input: 'src/index.ts',
        plugins: [dts()],
        output: {

            file: './dist/index.d.ts',
            format: 'es'
        }
    }
])