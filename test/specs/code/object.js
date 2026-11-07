import { ColorType, EnumAstNodeStatus, EnumToken, ModuleScopeEnumOptions } from "../../../dist/src/lib/ast/types.js";
import { AstArena, TokenField } from "../../../dist/src/lib/ast/arena.js";
import { ARENA, ARENAID, AstArenaNode } from "../../../dist/src/lib/ast/arena-node.js";
import { renderValue as renderToken } from "../../../dist/src/lib/printer/render.js";

export function run(describe, expect, it, transform, parse, render, dirname, readFile) {
    describe("object views of the arena nodes", function () {
        const css = `/* comment */
@media screen {
    .foo, .bar {
        color: red;
        width: calc(1px + 2px);
    }
}
h1 { font-size: 2em }
`;

        it("toObject() returns a view of the node #1", async function () {
            const result = await parse(css, { minify: false });
            const arena = result.arena;
            const [comment, media, h1] = arena.children(result.ast);
            const rule = arena.getFirstChild(media);
            const [color, width] = arena.children(rule);
            const view = arena.toObject(rule);

            expect(view).to.be.instanceOf(AstArenaNode);
            expect(view[ARENAID]).equals(rule);
            expect(view[ARENA]).equals(arena);
            // keyed symbols
            expect(ARENAID).equals(Symbol.for("@tbela99/css-parser/ARENAID"));
            expect(Object.keys(view)).deep.equals([]);

            expect(arena.toObject(comment).typ).equals(EnumToken.CommentNodeType);
            expect(arena.toObject(comment).val).equals("/* comment */");
            expect(arena.toObject(media).nam).equals("media");
            expect(arena.toObject(media).val).equals("screen");
            expect(arena.toObject(media).chi.map((node) => node[ARENAID])).deep.equals([rule]);
            expect(view.typ).equals(EnumToken.RuleNodeType);
            expect(view.sel).equals(".foo,.bar");
            expect(view.nam).equals(undefined);
            expect(view.chi.map((node) => node.nam)).deep.equals(["color", "width"]);
            expect(view.parent[ARENAID]).equals(media);
            expect(view.loc).deep.equals(arena.getLocation(rule));

            const declaration = arena.toObject(color);

            expect(declaration.val.length).equals(1);
            expect(declaration.val[0].typ).equals(EnumToken.ColorTokenType);
            expect(declaration.val[0].val).equals("red");
            expect(declaration.val[0].kin).equals(ColorType.LIT);
            expect(declaration.val[0].parent[ARENAID]).equals(color);
            expect(declaration.chi).equals(undefined);
            expect(declaration.state).equals(arena.getState(color));
            expect(arena.toObject(h1).chi[0].val[0].val).equals(2);
            expect(arena.toObject(h1).chi[0].val[0].unit).equals("em");

            // structured tokens
            const calc = arena.toObject(width).val[0];
            const expression = calc.chi[0];

            expect(calc.typ).equals(EnumToken.MathFunctionTokenType);
            expect(calc.val).equals("calc");
            expect(expression.typ).equals(EnumToken.BinaryExpressionTokenType);
            expect(expression.op).equals(EnumToken.Add);
            expect(expression.l.val).equals(1);
            expect(expression.r.unit).equals("px");
            // the parent of a field token is the structured token
            expect(expression.l.parent[ARENAID]).equals(expression[ARENAID]);

            // the returned arrays, locations and error lists are frozen: assign the property instead
            expect(Object.isFrozen(view.chi)).equals(true);
            expect(Object.isFrozen(declaration.val)).equals(true);
            expect(Object.isFrozen(view.loc)).equals(true);
            expect(() => view.chi.push(arena.toObject(color))).to.throw(TypeError);
            expect(() => {
                view.chi[0] = null;
            }).to.throw(TypeError);
            expect(() => {
                view.loc.sta = 0;
            }).to.throw(TypeError);
            expect(arena.childCount(rule)).equals(2);

            // two views of the same node are different objects
            expect(arena.toObject(rule)).not.equals(view);
            expect(arena.toObject(rule)[ARENAID]).equals(view[ARENAID]);
        });

        it("the setters write the arena #2", async function () {
            const result = await parse(css, { minify: false });
            const arena = result.arena;
            const [, media, h1] = arena.children(result.ast);
            const rule = arena.toObject(arena.getFirstChild(media));
            const [color, width] = rule.chi;

            rule.sel = ".baz";
            color.nam = "background-color";
            color.val = [{ typ: EnumToken.ColorTokenType, val: "#00f", kin: ColorType.HEX }];
            width.val[0].chi[0].l.val = 3;
            arena.toObject(media).val = "print";

            expect(arena.getSelector(rule[ARENAID])).equals(".baz");
            expect(arena.getName(color[ARENAID])).equals("background-color");
            expect(render(arena, result.ast).code).equals(
                "@media print{.baz{background-color:blue;width:calc(3px + 2px)}}h1{font-size:2em}",
            );

            // the views of the arena are not copied: the node is moved
            const h1View = arena.toObject(h1);
            const fontSize = h1View.chi[0];

            rule.chi = [...rule.chi, fontSize];
            expect(arena.getParent(fontSize[ARENAID])).equals(rule[ARENAID]);
            expect(arena.childCount(h1)).equals(0);

            // numeric tokens, units, state, errors
            const value = fontSize.val[0];

            value.val = 10;
            value.unit = "px";
            fontSize.state = EnumAstNodeStatus.ValidationFailed;
            fontSize.errors = [{ action: "ignore", message: "test" }];
            expect(Object.isFrozen(fontSize.errors)).equals(true);
            expect(() => fontSize.errors.push({ action: "ignore", message: "other" })).to.throw(TypeError);

            expect(arena.getNumericValue(value[ARENAID])).equals(10);
            expect(arena.getUnit(value[ARENAID])).equals("px");
            expect(arena.getState(fontSize[ARENAID])).equals(EnumAstNodeStatus.ValidationFailed);
            expect(arena.getErrors(fontSize[ARENAID])).deep.equals([{ action: "ignore", message: "test" }]);

            fontSize.errors = null;
            expect(arena.getErrors(fontSize[ARENAID])).equals(null);

            // token lists
            const expression = width.val[0].chi[0];

            expression.op = EnumToken.Mul;
            expression.r = { typ: EnumToken.NumberTokenType, val: 2 };
            expect(renderToken(arena, width.val[0][ARENAID])).equals("calc(3px*2)");
        });

        it("fromObject() imports the views #3", async function () {
            const result = await parse(css, { minify: false });
            const other = await parse(".other { color: pink }", { minify: false });
            const arena = result.arena;
            const h1 = arena.toObject(arena.getLastChild(result.ast));

            // importing a view of the arena is a noop
            expect(arena.fromObject(h1)).equals(h1[ARENAID]);
            expect(arena.import(arena, h1[ARENAID])).equals(h1[ARENAID]);

            // the views of another arena are copied
            const rule = other.arena.toObject(other.arena.getFirstChild(other.ast));
            const copy = arena.fromObject(rule);

            expect(copy).not.equals(rule[ARENAID]);
            expect(arena.getSelector(copy)).equals(".other");
            expect(arena.getParent(copy)).equals(0);

            // plain objects and views are imported by the setters
            h1.chi = [...h1.chi, rule.chi[0], { typ: EnumToken.DeclarationNodeType, nam: "width", val: [{ typ: EnumToken.LengthTokenType, val: 1, unit: "px" }] }];
            expect(render(arena, h1[ARENAID]).code).equals("h1{font-size:2em;color:pink;width:1px}");
            // the other arena is not modified
            expect(render(other.arena, other.ast).code).equals(".other{color:pink}");

            // JSON
            expect(JSON.parse(JSON.stringify(h1))).deep.equals(JSON.parse(JSON.stringify(arena.toPlainObject(h1[ARENAID]))));
            expect(h1.toJSON()).deep.equals(arena.toPlainObject(h1[ARENAID]));
        });

        it("tokens views #4", function () {
            const arena = new AstArena();
            const fraction = arena.toObject(
                arena.fromObject({
                    typ: EnumToken.NumberTokenType,
                    val: {
                        typ: EnumToken.FractionTokenType,
                        l: { typ: EnumToken.NumberTokenType, val: 1 },
                        r: { typ: EnumToken.NumberTokenType, val: 3 },
                    },
                }),
            );

            expect(fraction.val).to.be.instanceOf(AstArenaNode);
            expect(fraction.val.l.val).equals(1);
            expect(fraction.val.r.val).equals(3);

            fraction.val.r = { typ: EnumToken.NumberTokenType, val: 4 };
            expect(fraction.val.r.val).equals(4);
            // 1/4 is rendered as the shorter .25
            expect(renderToken(arena, fraction[ARENAID])).equals(".25");

            fraction.val = 2;
            expect(arena.hasFraction(fraction[ARENAID])).equals(false);
            expect(renderToken(arena, fraction[ARENAID])).equals("2");

            const color = arena.toObject(arena.createColor("#ff0000", ColorType.HEX));

            expect(color.kin).equals(ColorType.HEX);
            color.kin = ColorType.LIT;
            color.val = "blue";
            expect(renderToken(arena, color[ARENAID])).equals("blue");

            const expression = arena.toObject(
                arena.createBinaryExpression(
                    EnumToken.Add,
                    arena.createToken(EnumToken.LengthTokenType, 1, "px"),
                    arena.createToken(EnumToken.LengthTokenType, 2, "px"),
                ),
            );

            expect(expression.l[ARENAID]).equals(arena.field(expression[ARENAID], TokenField.L));
            expect(expression.val).equals(undefined);
            expect(expression.chi).equals(undefined);
        });

        it("visitors return node ids or objects #5", async function () {
            const result = await transform(css, {
                minify: false,
                removeComments: true,
                visitor: {
                    // the view of the node: the node is kept
                    Rule: (arena, id) => {
                        const node = arena.toObject(id);

                        node.sel = ".baz";
                        return node;
                    },
                    Declaration: {
                        // a plain object
                        color: (arena, id) => ({
                            typ: EnumToken.DeclarationNodeType,
                            nam: "color",
                            val: [{ typ: EnumToken.ColorTokenType, val: "blue", kin: ColorType.LIT }],
                        }),
                        // an array of node ids and views
                        fontSize: (arena, id) => [
                            id,
                            arena.toObject(arena.createDeclaration(EnumToken.DeclarationNodeType, "line-height", [arena.createToken(EnumToken.NumberTokenType, 1)], null, null)),
                        ],
                    },
                    // value tokens
                    LengthTokenType: (arena, id) => {
                        const node = arena.toObject(id);

                        if (node.val == 2 && node.unit == "px") {
                            node.val = 4;
                        }
                    },
                },
            });

            expect(result.code).equals(
                "@media screen {\n .baz {\n  color: blue;\n  width: calc(1px + 4px)\n }\n}\n.baz {\n font-size: 2em;\n line-height: 1\n}",
            );
        });

        it("css module variables are views #6", async function () {
            const result = await transform(`@value blue: #0c77f8;\n@value red: #ff0000;`, {
                module: ModuleScopeEnumOptions.ICSS,
            });

            const blue = result.cssModuleVariables.blue;

            expect(blue).to.be.instanceOf(AstArenaNode);
            expect(blue[ARENA]).equals(result.arena);
            expect(blue.typ).equals(EnumToken.CssVariableTokenType);
            expect(blue.nam).equals("blue");
            expect(blue.val.map((token) => token.val)).deep.equals(["#0c77f8"]);
            expect(JSON.parse(JSON.stringify(result.cssModuleVariables.red))).deep.include({
                typ: EnumToken.CssVariableTokenType,
                nam: "red",
            });
        });
    });
}
