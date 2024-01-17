import dts from 'rollup-plugin-dts';
import typescript from "@rollup/plugin-typescript";
import nodeResolve from "@rollup/plugin-node-resolve";
import json from "@rollup/plugin-json";
import commonjs from "@rollup/plugin-commonjs";

export default [
    {
        input: ['src/node/index.ts', 'src/web/index.ts'],
        plugins: [nodeResolve(), commonjs({transformMixedEsModules: true}), json(), typescript()],
        output: [
            {
                dir: './dist',
                format: 'es',
                preserveModules: true
            }
        ]
    },
    {
        input: 'src/node/index.ts',
        plugins: [nodeResolve(), commonjs({transformMixedEsModules: true}), json(), typescript()],
        output: [            
            {
                file: './dist/index.cjs',
                format: 'cjs',
                name: 'CSSParser'
            }
        ]
    },
    {
        input: 'src/web/index.ts',
        plugins: [nodeResolve(), commonjs({transformMixedEsModules: true}), json(), typescript()],
        output: [ 
            {
                file: './dist/index-umd-web.js',
                format: 'umd',
                name: 'CSSParser'
            }
        ]
    },
    {
        input: 'src/node/index.ts',
        plugins: [dts()],
        output: {

            file: './dist/index.d.ts',
            // format: 'es'
        }
    }
];