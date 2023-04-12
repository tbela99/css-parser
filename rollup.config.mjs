import dts from 'rollup-plugin-dts';
import typescript from "@rollup/plugin-typescript";
import nodeResolve from "@rollup/plugin-node-resolve";
import {folderInput} from "rollup-plugin-folder-input";

export default [
    {
        input: 'src/index.ts',
        plugins: [nodeResolve(), typescript()],
        output: [
            {
                file: './dist/index.mjs',
                format: 'es',
            },
            {
                file: './dist/index.js',
                format: 'umd',
                name: 'CSSParser'
            }
        ]
    },
    {
        input: './test/specs/*.ts',
        plugins: [nodeResolve(), folderInput(), typescript()],
        output:
            {
                dir: './test/js',
                format: 'es',
            }
    },
    {
        input: 'src/index.ts',
        plugins: [dts()],
        output: {

            file: './dist/index.d.ts',
            format: 'es'
        }
    }
]