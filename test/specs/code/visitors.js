import { ColorType, EnumToken } from "../../../dist/src/lib/ast/types.js";
import { WalkerEvent } from "../../../dist/src/lib/ast/types.js";

export function run(
    describe,
    expect,
    it,
    transform,
    parse,
    render,
    dirname,
    readFile,
    resolve,
    ColorType,
    EnumToken,
    ModuleCaseTransformEnum,
    ModuleScopeEnumOptions,
    transformSync,
    parseSync,
) {
    describe("node visitor", function () {
        it("visitor #1", function () {
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
                        media: (arena, node) => {
                            arena.setValueString(node, "all");
                            return node;
                        },
                    },

                    Rule(arena, node) {
                        arena.setSelector(node, ".foo,.bar,.fubar");
                        return node;
                    },
                    Declaration: {
                        height: (arena, node) => {
                            return [
                                node,
                                arena.createDeclaration(
                                    EnumToken.DeclarationNodeType,
                                    "width",
                                    [arena.createToken(EnumToken.Length, 3, "px")],
                                    null,
                                    null,
                                ),
                            ];
                        },
                    },
                },
            };

            return transform(css, options).then((result) =>
                expect(result.code).equals(".foo,.bar,.fubar{height:calc(40px/3);width:3px}"),
            );
        });

        it("visitor #2", function () {
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
                    DeclarationNodeType: (arena, declaration) => {
                        if (arena.getName(declaration) == "height") {
                            arena.setNameString(declaration, "width");
                        }
                    },
                    ColorTokenType: (arena, color) => {
                        return {
                            typ: EnumToken.Color,
                            val: "red",
                            kin: ColorType.HEX,
                        };
                    },
                },
            };

            return transform(css, options).then((result) =>
                expect(result.code).equals(`body {
 color: red
}
html,body {
 line-height: 1.474
}
.ruler {
 width: 10px;
 background-color: red
}`),
            );
        });

        it("visitor #3", function () {
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
                    StyleSheetNodeType: async (arena, node) => {
                        // insert a new rule
                        const result = await parse("html {--base-color: pink}");

                        arena.prependChildren(node, arena.import(result.arena, result.arena.firstChild[result.ast]));
                    },

                    ColorTokenType: (arena, node) => {
                        // dump all color tokens
                        // console.debug(node);
                    },
                    FunctionTokenType: (arena, node) => {
                        // dump all function tokens
                        // console.debug(node);
                    },
                    DeclarationNodeType: (arena, node) => {
                        // dump all declaration nodes
                        // console.debug(node);
                    },
                },
            };

            return transform(css, options).then((result) =>
                expect(result.code).equals(`@media screen {
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
}`),
            );
        });

        it("visitor #4", function () {
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
                        slideIn(arena, node) {
                            arena.setValueString(node, "slide-in-out");
                            return node;
                        },
                    },
                },
            };

            return transform(css, options).then((result) =>
                expect(result.code).equals(`@keyframes slide-in-out {
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
}`),
            );
        });

        it("visitor #5", function () {
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
                    DeclarationNodeType: {
                        type: WalkerEvent.Enter,
                        handler: (arena, declaration) => {
                            if (arena.getName(declaration) == "height") {
                                arena.setNameString(declaration, "width");
                            }
                        },
                    },
                    ColorTokenType: (arena, color) => {
                        return {
                            typ: EnumToken.Color,
                            val: "red",
                            kin: ColorType.HEX,
                        };
                    },
                },
            };

            const result = transformSync(css, options);

            expect(result.code).equals(`body {
 color: red
}
html,body {
 line-height: 1.474
}
.ruler {
 width: 10px;
 background-color: red
}`);
        });

        it("visitor #6", function () {
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
                    DeclarationNodeType: (arena, declaration) => {
                        if (arena.getName(declaration) == "height") {
                            arena.setNameString(declaration, "width");
                        }
                    },
                    ColorTokenType: (arena, color) => {
                        return {
                            typ: EnumToken.Color,
                            val: "red",
                            kin: ColorType.HEX,
                        };
                    },
                },
            };

            const result = transformSync(css, options);

            expect(result.code).equals(`body {
 color: red
}
html,body {
 line-height: 1.474
}
.ruler {
 width: 10px;
 background-color: red
}`);
        });

        it("visitor #7", function () {
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
                    StyleSheetNodeType: {
                        type: WalkerEvent.Leave,

                        handler: (arena, node) => {
                            // insert a new rule
                            const result = parseSync("html {--base-color: pink}");

                            arena.prependChildren(
                                node,
                                arena.import(result.arena, result.arena.firstChild[result.ast]),
                            );
                        },
                    },
                    ColorTokenType: (arena, node) => {
                        // dump all color tokens
                        // console.debug(node);
                    },
                    FunctionTokenType: (arena, node) => {
                        // dump all function tokens
                        // console.debug(node);
                    },
                    DeclarationNodeType: (arena, node) => {
                        // dump all declaration nodes
                        // console.debug(node);
                    },
                },
            };

            const result = transformSync(css, options);

            expect(result.code).equals(`@media screen {
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
}`);
        });

        it("visitor #8", function () {
            const css = `

            .ruler {
            
                height: 10px;
            }

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
                    Rule: {
                        type: WalkerEvent.Enter,
                        handler(arena, node) {
                            arena.setSelector(node, ".ruled");
                            // node.val = "slide-in-out";
                            // return node;
                        },
                    },
                    Declaration: {
                        type: WalkerEvent.Leave,
                        handler(arena, node) {
                            // node.sel = ".ruled";
                            // node.val = "slide-in-out";
                            // return node;
                        },
                    },
                    KeyframesAtRule: {
                        slideIn(arena, node) {
                            arena.setValueString(node, "slide-in-out");
                            return node;
                        },
                    },
                },
            };

            const result = transformSync(css, options);

            expect(result.code).equals(`.ruled {
 height: 10px
}
@keyframes slide-in-out {
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
}`);
        });

        it("visitor #9", function () {
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
                visitor: [
                    function DeclarationNodeType(arena, declaration) {
                        if (arena.getName(declaration) == "height") {
                            arena.setNameString(declaration, "width");
                        }
                    },
                    {
                        ColorTokenType: {
                            type: WalkerEvent.Enter,
                            handler: function (arena, color) {
                                return {
                                    typ: EnumToken.Color,
                                    val: "red",
                                    kin: ColorType.HEX,
                                };
                            },
                        },
                    },
                ],
            };

            return transform(css, options).then((result) =>
                expect(result.code).equals(`body {
 color: red
}
html,body {
 line-height: 1.474
}
.ruler {
 width: 10px;
 background-color: red
}`),
            );
        });

        it("visitor #10", function () {
            const css = `

            .ruler {
            
                height: 10px;
            }

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
                visitor: [
                    {
                        Rule: {
                            type: WalkerEvent.Enter,
                            handler(arena, node) {
                                arena.setSelector(node, ".ruled");
                                // node.val = "slide-in-out";
                                // return node;
                            },
                        },
                    },
                    {
                        KeyframesAtRule: {
                            slideIn(arena, node) {
                                arena.setValueString(node, "slide-in-out");
                                return node;
                            },
                        },
                    },
                ],
            };

            const result = transformSync(css, options);

            expect(result.code).equals(`.ruled {
 height: 10px
}
@keyframes slide-in-out {
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
}`);
        });

        it("visitor #11", function () {
            const css = `

            .ruler {
            
                height: 10px;
            }
`;
            const options = {
                removePrefix: true,
                beautify: true,
                visitor: function Rule(arena, node) {
                    arena.setSelector(node, ".ruled");
                    // node.val = "slide-in-out";
                    // return node;
                },
            };

            const result = transformSync(css, options);

            expect(result.code).equals(`.ruled {
 height: 10px
}`);
        });

        it("visitor #12", function () {
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
                visitor: [
                    function DeclarationNodeType(arena, declaration) {
                        if (arena.getName(declaration) == "height") {
                            arena.setNameString(declaration, "width");
                        }
                    },
                    {
                        ColorTokenType: {
                            type: WalkerEvent.Enter,
                            handler: function (arena, color) {
                                return {
                                    typ: EnumToken.Color,
                                    val: "red",
                                    kin: ColorType.HEX,
                                };
                            },
                        },
                    },
                ],
            };

            return expect(transformSync(css, options).code).equals(`body {
 color: red
}
html,body {
 line-height: 1.474
}
.ruler {
 width: 10px;
 background-color: red
}`);
        });

        it("visitor #13", function () {
            const visitor = [];

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
                visitor(arena, node) {
                    // nodes and tokens are arena ids
                    visitor.push(
                        `${EnumToken[arena.dataTypes[node]]} -> ${arena.getName(node) || arena.getValue(node) || (arena.isNumeric(node) ? arena.numericValue[node] : "")}`,
                    );
                },
            };

            transformSync(css, options);
            return expect(visitor).deep.equals([
                "StyleSheetNodeType -> ",
                "RuleNodeType -> body",
                "DeclarationNodeType -> color",
                "Color -> color",
                "Iden -> from",
                "Whitespace -> ",
                "WildCardFunctionTokenType -> var",
                "DashedIden -> --base-color",
                "Whitespace -> ",
                "Iden -> display-p3",
                "Whitespace -> ",
                "Iden -> r",
                "Whitespace -> ",
                "MathFunctionTokenType -> calc",
                "BinaryExpressionTokenType -> ",
                "Iden -> g",
                "Number -> 0.24",
                "Whitespace -> ",
                "MathFunctionTokenType -> calc",
                "BinaryExpressionTokenType -> ",
                "Iden -> b",
                "Number -> 0.15",
                "RuleNodeType -> html,body",
                "DeclarationNodeType -> line-height",
                "Number -> 1.474",
                "RuleNodeType -> .ruler",
                "DeclarationNodeType -> height",
                "Length -> 10",
                "DeclarationNodeType -> background-color",
                "Color -> orange",
            ]);
        });
    });
}
