import { ColorType, EnumToken, ModuleCaseTransformEnum, ModuleScopeEnumOptions } from "../../../dist/lib/ast/types.js";

export function run(describe, expect, it, transform, parse, render, dirname, readFile, resolve) {

    describe('sourcemap', function () {
    

        const url = new URL(dirname(import.meta.url) + '/../../css-modules/mixins.css');        // const file = `@import '${dir}/files/css/line-awesome.css`;
        const options = {
            input: `

              .goal .bg-indigo {
                background: indigo;
              }
              
            
            .indigo-white {
              composes: bg-indigo;
              composes: title block ruler from global;
              color: white;
            }
              
              .indigo-white {
                composes: bg-indigo;
              composes: button cell title from "${url.pathname}";  color: white;
              }
    `,
    beautify: true,
        sourcemap: 'inline',
                    module: ModuleScopeEnumOptions.ICSS,
    output: 'test/sourcemap.html'
        };
    
        it('sourcemap file #1', async () => {
    
            return transform(options).then(async result => {
    
                result.map.computePositions();
                const positions = result.map.find(11, 1);
                return expect(positions.length == 1 && positions[0].slice(0, 3)).deep.equals([null, 3, 15])
            });
        });
    });
}