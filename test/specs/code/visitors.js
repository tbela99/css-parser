import {EnumToken} from "../../../dist/lib/ast/types.js";

export function run(describe, expect, transform, parse, render, dirname, readFile) {

    describe('node visitor', function () {

        it('visitor #1', function () {

            const css = `

@media screen {
        
    .foo:-webkit-autofill {
            height: calc(100px * 2/ 15);
    }
}
`;
            const options = {

                visitor: {

                    AtRule: {

                        media: (node) => {

                            return {...node, val: 'all'}
                        }
                    },

                    Rule(node) {

                        return {...node, sel: '.foo,.bar,.fubar'};
                    },
                    Declaration: {

                        height: (node) => {

                            return [
                                node,
                                {

                                    typ: EnumToken.DeclarationNodeType,
                                    nam: 'width',
                                    val: [
                                        {
                                            typ: EnumToken.Length,
                                            val: '3',
                                            unit: 'px'
                                        }
                                    ]
                                }
                            ]
                        }
                    }
                }
            }

            return transform(css, options).then(result => expect(result.code).equals('.foo,.bar,.fubar{height:calc(40px/3);width:3px}'));
        });
    });

}