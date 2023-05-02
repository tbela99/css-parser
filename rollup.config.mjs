import dts from 'rollup-plugin-dts';
import typescript from "@rollup/plugin-typescript";
import nodeResolve from "@rollup/plugin-node-resolve";
import glob from "glob";

export default [...await new Promise((resolve, reject) => {

    glob('./test/specs/**/*.test.ts', (err, files) => {

        if (err) {

            reject(err);
        }

        resolve(files.map(input => {
            return {
                input,
                plugins: [nodeResolve(), typescript()],
                output:
                {
                    banner: `/* generate from ${input} */`,
                    file: `./test/js/${input.replace(/^\.\/test\/specs/, '').replace(/\.ts$/, '.mjs')}`,
                        // entryFileNames: '[name].mjs',
                        // chunkFileNames: '[name].[hash].mjs',
                        format: 'es'
                }
            }
        }));
    })

})].concat([
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
        input: 'src/index.ts',
        plugins: [dts()],
        output: {

            file: './dist/index.d.ts',
            format: 'es'
        }
    }
])