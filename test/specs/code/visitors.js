import {ColorType, EnumToken} from "../../../dist/lib/ast/types.js";

export function run(describe, expect, it, transform, parse, render, dirname, readFile) {

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

        it('visitor #2', function () {

            const css = `

body { color:    color(from var(--base-color) display-p3 r calc(g + 0.24) calc(b + 0.15)); }

html,
body {
    line-height: 1.474;
}

.ruler {

    height: 10px;
    background-color: orange
}
`;
            const options = {

                beautify: true,
                visitor: {

                    DeclarationNodeType: (declaration) => {

                        if (declaration.nam == 'height') {

                            declaration.nam = 'width';
                        }
                    },
                    ColorTokenType: (color) => {

                        return {
                            typ: EnumToken.Color,
                            val: 'red',
                            kin: ColorType.HEX
                        }
                    }
                }
            }

            return transform(css, options).then(result => expect(result.code).equals(`body {
 color: red
}
html,body {
 line-height: 1.474
}
.ruler {
 width: 10px;
 background-color: red
}`));
        });

        it('visitor #3', function () {

            const css = `

@media screen {
        
    .foo:-webkit-autofill {
            height: calc(100px * 2/ 15);
    }
}


body { color:    color(from var(--base-color) display-p3 r calc(g + 0.24) calc(b + 0.15)); }

html,
body {
    line-height: 1.474;
}

.ruler {

    height: 10px;
    background-color: orange
}
`;
            const options = {

                beautify: true,
                inlineCssVariables: true,
                resolveImport: true,
                visitor: {

                    StyleSheetNodeType: async (node) => {

                        // insert a new rule
                        node.chi.unshift(await parse('html {--base-color: pink}').then(result => result.ast.chi[0]))
                    },

                    ColorTokenType:  (node) => {

                        // dump all color tokens
                        // console.debug(node);
                    },
                    FunctionTokenType:  (node) => {

                        // dump all function tokens
                        // console.debug(node);
                    },
                    DeclarationNodeType:  (node) => {

                        // dump all declaration nodes
                        // console.debug(node);
                    }
                }
            };

            return transform(css, options).then(result => expect(result.code).equals(`@media screen {
 .foo:-webkit-autofill {
  height: calc(40px/3)
 }
}
body {
 color: #f3fff0
}
html,body {
 line-height: 1.474
}
.ruler {
 height: 10px;
 background-color: orange
}`));
        });

        it('visitor #4', function () {

            const css = `

@keyframes slide-in {
  from {
    transform: translateX(0%);
  }

  to {
    transform: translateX(100%);
  }
}
@keyframes identifier {
  0% {
    top: 0;
    left: 0;
  }
  30% {
    top: 50px;
  }
  68%,
  72% {
    left: 50px;
  }
  100% {
    top: 100px;
    left: 100%;
  }
}
`;
            const options = {

                removePrefix: true,
                beautify: true,
                visitor: {
                    KeyframesAtRule: {
                        slideIn(node) {

                            node.val = 'slide-in-out';
                            return node;
                        }
                    }
                }
            }

            return transform(css, options).then(result => expect(result.code).equals(`@keyframes slide-in-out {
 0% {
  transform: translateX(0)
 }
 to {
  transform: translateX(100%)
 }
}
@keyframes identifier {
 0% {
  top: 0;
  left: 0
 }
 30% {
  top: 50px
 }
 68%,72% {
  left: 50px
 }
 to {
  top: 100px;
  left: 100%
 }
}`));
        });

    });

}