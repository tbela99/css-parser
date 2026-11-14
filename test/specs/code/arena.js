import { EnumToken, EnumAstNodeStatus, ColorType } from "../../../dist/src/lib/ast/types.js";
import { Arena, AstArena, TokenField, arenaColumns } from "../../../dist/src/lib/ast/arena.js";
import { ARENA, ARENAID, AstArenaNode } from "../../../dist/src/lib/ast/arena-node.js";
import { parseDeclarations, parseString } from "../../../dist/src/lib/parser/parse.js";
import { renderValue as renderToken } from "../../../dist/src/lib/printer/render.js";

export function run(describe, expect, it, transform, parse, render, dirname, readFile) {
    describe("ast arena", function () {
        const css = `
/* comment */
@import 'foo.css';
@media screen {
    .foo, .bar {
        color: red;
        width: calc(1px + 2px);
    }
}
h1 { font-size: 2em }
`;

        it("allocates every parsed node in the arena #1", async function () {
            const result = await parse(css, { minify: false });
            const arena = result.arena;

            expect(arena).to.be.instanceOf(AstArena);
            expect(arena).to.be.instanceOf(Arena);
            expect(result.ast).equals(arena.root);
            expect(arena.dataTypes[result.ast]).equals(EnumToken.StyleSheetNodeType);
            expect(arena.current).to.be.at.least(result.stats.nodesCount);

            let count = 0;

            for (const node of arena.walk(result.ast)) {
                count++;
                expect(node).to.be.above(0);
                expect(node).to.be.at.most(arena.current);

                if (node != result.ast) {
                    // parent links are stored in the arena
                    expect(arena.children(arena.getParent(node))).to.include(node);
                }
            }

            expect(count).to.be.at.least(7);
        });

        it("node data is stored column-wise #2", async function () {
            const result = await parse(css, { minify: false });
            const arena = result.arena;
            const [comment, imp, media, h1] = arena.children(result.ast);
            const rule = arena.firstChild[media];
            const declaration = arena.firstChild[rule];

            expect(arena.dataTypes[comment]).equals(EnumToken.CommentNodeType);
            expect(arena.strings[arena.stringValue[comment]]).equals("/* comment */");

            expect(arena.dataTypes[imp]).equals(EnumToken.AtRuleNodeType);
            expect(arena.strings[arena.name[imp]]).equals("import");
            expect(arena.strings[arena.stringValue[imp]]).equals("'foo.css'");
            // at-rules without a block have no children list
            expect(arena.flags[imp] & EnumAstNodeStatus.HasChildren).equals(0);
            expect(arena.flags[media] & EnumAstNodeStatus.HasChildren).not.equals(0);

            expect(arena.dataTypes[rule]).equals(EnumToken.RuleNodeType);
            expect(arena.strings[arena.name[rule]]).equals(".foo,.bar");
            expect(arena.getSelector(rule)).equals(".foo,.bar");
            // the selector tokens are stored in the rule token list
            expect(arena.tokenCount(rule)).equals(3);
            expect(arena.tokens(rule).map((token) => arena.dataTypes[token])).deep.equals([
                EnumToken.ClassSelectorTokenType,
                EnumToken.CommaTokenType,
                EnumToken.ClassSelectorTokenType,
            ]);

            expect(arena.dataTypes[declaration]).equals(EnumToken.DeclarationNodeType);
            expect(arena.getName(declaration)).equals("color");
            // tokens are arena ids too
            expect(arena.dataTypes[arena.firstToken[declaration]]).equals(EnumToken.ColorTokenType);
            expect(arena.str(arena.firstToken[declaration])).equals("red");
            expect(arena.parents[arena.firstToken[declaration]]).equals(declaration);
            expect(arena.tokens(declaration)).deep.equals([arena.firstToken[declaration]]);
            expect(arena.flags[declaration] & EnumAstNodeStatus.HasValues).not.equals(0);

            // calc(1px + 2px): the function arguments are stored in the token list of the function token
            const width = arena.lastChild[rule];
            const calc = arena.firstToken[width];

            expect(arena.dataTypes[calc]).equals(EnumToken.MathFunctionTokenType);
            expect(arena.str(calc)).equals("calc");
            // the expression is parsed: 1px + 2px is a binary expression token
            const expression = arena.firstToken[calc];

            expect(arena.tokenCount(calc)).equals(1);
            expect(arena.dataTypes[expression]).equals(EnumToken.BinaryExpressionTokenType);
            // the operator is stored in the numeric value column
            expect(arena.numericValue[expression]).equals(EnumToken.Add);
            // structured fields (l, r, op, ...) are stored as list children
            const left = arena.field(expression, TokenField.L);
            const right = arena.field(expression, TokenField.R);

            expect(arena.dataTypes[left]).equals(EnumToken.LengthTokenType);
            expect(arena.numericValue[left]).equals(1);
            expect(arena.strings[arena.unit[left]]).equals("px");
            expect(arena.numericValue[right]).equals(2);
            expect(arena.getUnit(right)).equals("px");
            expect(arena.getSpanStart(calc)).to.be.below(arena.getSpanStart(left));
            expect(arena.toPlainObject(expression)).deep.equals({
                typ: EnumToken.BinaryExpressionTokenType,
                op: EnumToken.Add,
                l: { typ: EnumToken.LengthTokenType, val: 1, unit: "px", loc: arena.getLocation(left) },
                r: { typ: EnumToken.LengthTokenType, val: 2, unit: "px", loc: arena.getLocation(right) },
                loc: arena.getLocation(expression),
            });

            // sibling links
            expect(arena.nextSibling[declaration]).equals(arena.lastChild[rule]);
            expect(arena.previousSibling[arena.lastChild[rule]]).equals(declaration);
            expect(arena.nextSibling[arena.lastChild[rule]]).equals(0);
            expect(arena.getChildAt(result.ast, 3)).equals(h1);
            expect(arena.childCount(rule)).equals(2);
            expect(arena.indexOf(h1)).equals(3);

            // state and location
            expect(arena.getState(declaration)).equals(EnumAstNodeStatus.Unvalidated);
            expect(arena.getLocation(declaration).srcId).equals(arena.getLocation(result.ast).srcId);
            expect(arena.getSpanStart(declaration)).to.be.below(arena.getSpanEnd(declaration));
            expect(arena.getLocation(declaration).sta).equals(arena.getSpanStart(declaration));

            // strings are interned
            expect(arena.name[declaration]).equals(arena.internString("color"));
            expect(arena.equalsIgnoreCase(declaration, "nam", "COLOR")).equals(true);
            expect(arena.startsWith(rule, "nam", ".foo")).equals(true);
        });

        it("columns are writable #3", async function () {
            const result = await parse(css, { minify: false });
            const arena = result.arena;
            const rule = arena.firstChild[arena.getChildAt(result.ast, 2)];

            arena.setSelector(rule, ".baz");
            arena.name[arena.firstChild[rule]] = arena.internString("background");
            arena.setLocation(rule, 0, 1, 2);
            arena.setState(rule, EnumAstNodeStatus.Invalid);

            expect(arena.getSelector(rule)).equals(".baz");
            expect(arena.getName(arena.firstChild[rule])).equals("background");
            expect(arena.getLocation(rule)).deep.equals({ sta: 1, end: 2, srcId: 0 });
            expect(arena.getState(rule)).equals(EnumAstNodeStatus.Invalid);
            expect(render(arena, result.ast).code).equals(
                "@import 'foo.css';@media screen{.baz{background:red;width:calc(1px + 2px)}}h1{font-size:2em}",
            );
        });

        it("arena.clone() allocates the clone in the arena #4", async function () {
            const result = await parse(css, { minify: false });
            const arena = result.arena;
            const rule = arena.firstChild[arena.getChildAt(result.ast, 2)];

            const shallow = arena.clone(rule);
            const deep = arena.clone(rule, true);

            expect(shallow).not.equals(rule);
            expect(arena.getSelector(shallow)).equals(arena.getSelector(rule));
            expect(arena.firstChild[shallow]).equals(0);
            expect(arena.parents[shallow]).equals(0);
            expect(arena.getLocation(shallow)).deep.equals(arena.getLocation(rule));
            expect(arena.childCount(deep)).equals(arena.childCount(rule));
            expect(arena.firstChild[deep]).not.equals(arena.firstChild[rule]);
            expect(arena.getName(arena.firstChild[deep])).equals(arena.getName(arena.firstChild[rule]));
            expect(arena.parents[arena.firstChild[deep]]).equals(deep);
            // the tree is untouched
            expect(arena.parents[arena.firstChild[rule]]).equals(rule);
            expect(arena.childCount(arena.getChildAt(result.ast, 2))).equals(1);
        });

        it("visitors replace nodes with node ids #5", async function () {
            const result = await parse(css, {
                minify: false,
                visitor: {
                    Declaration: {
                        color: (arena, node) => [
                            node,
                            arena.createDeclaration(
                                EnumToken.DeclarationNodeType,
                                "height",
                                [arena.createToken(EnumToken.LengthTokenType, 3, "px")],
                                null,
                                null,
                            ),
                        ],
                    },
                    AtRule: {
                        media: (arena, node) => {
                            const clone = arena.clone(node, true);

                            arena.setValueString(clone, "print");
                            return clone;
                        },
                    },
                },
            });

            const arena = result.arena;
            const media = arena.getChildAt(result.ast, 2);
            const rule = arena.firstChild[media];

            expect(arena.getValue(media)).equals("print");
            expect(arena.parents[rule]).equals(media);
            expect(arena.children(rule).map((node) => arena.getName(node))).deep.equals(["color", "height", "width"]);

            for (const node of arena.children(rule)) {
                expect(arena.parents[node]).equals(rule);
            }

            expect(render(arena, result.ast).code).equals(
                "@import 'foo.css';@media print{.foo,.bar{color:red;height:3px;width:calc(1px + 2px)}}h1{font-size:2em}",
            );
        });

        it("nodes of another arena are imported by copy #6", async function () {
            const result = await parse(css, { minify: false });
            const other = await parse("html { --base-color: pink }", { minify: false });
            const rule = other.arena.firstChild[other.ast];
            const arena = result.arena;

            const copy = arena.import(other.arena, rule);

            expect(copy).not.equals(rule);
            expect(arena.getSelector(copy)).equals(other.arena.getSelector(rule));
            expect(arena.getName(arena.firstChild[copy])).equals("--base-color");
            expect(arena.toPlainObject(arena.firstChild[copy]).val).deep.equals(
                other.arena.toPlainObject(other.arena.firstChild[rule]).val,
            );
            expect(arena.parents[arena.firstToken[arena.firstChild[copy]]]).equals(arena.firstChild[copy]);
            expect(arena.parents[arena.firstChild[copy]]).equals(copy);
            expect(arena.parents[copy]).equals(0);

            arena.prependChildren(result.ast, copy);
            expect(arena.parents[copy]).equals(result.ast);
            expect(render(arena, result.ast).code).equals(
                "html{--base-color:pink}@import 'foo.css';@media screen{.foo,.bar{color:red;width:calc(1px + 2px)}}h1{font-size:2em}",
            );
        });

        it("imported stylesheets are allocated in the importing arena #7", async function () {
            const root = new URL(dirname(import.meta.url) + "/../../../");
            const result = await parse(
                `@import '${new URL(dirname(import.meta.url) + "/../../files/css/nested.css").pathname.replace(root.pathname, "")}';\nh1 { color: red }`,
                {
                    minify: false,
                    resolveImport: true,
                },
            );

            const arena = result.arena;

            for (const node of arena.walk(result.ast)) {
                if (node != result.ast) {
                    expect(arena.children(arena.getParent(node))).to.include(node);
                }
            }

            // imported nodes keep the location of the imported file
            expect(arena.dataTypes[arena.firstChild[result.ast]]).equals(EnumToken.RuleNodeType);
            expect(arena.getSource(arena.firstChild[result.ast])).not.equals(
                arena.getSource(arena.lastChild[result.ast]),
            );
            expect(arena.getSource(arena.lastChild[result.ast])).equals(arena.getSource(result.ast));
        });

        it("toPlainObject() / fromObject() round trip #8", async function () {
            const result = await parse(css, { minify: false });
            const arena = result.arena;
            const rule = arena.firstChild[arena.getChildAt(result.ast, 2)];
            const plain = arena.toPlainObject(rule);

            expect(plain.typ).equals(EnumToken.RuleNodeType);
            expect(plain.sel).equals(".foo,.bar");
            expect(plain.chi.length).equals(2);
            expect(plain.chi[0].val).deep.equals([
                { typ: EnumToken.ColorTokenType, val: "red", kin: ColorType.LIT, loc: plain.chi[0].val[0].loc },
            ]);
            expect(plain.chi[0].val[0].loc).deep.equals(arena.getLocation(arena.firstToken[arena.firstChild[rule]]));
            expect(plain.loc).deep.equals(arena.getLocation(rule));

            const copy = arena.fromObject(plain);

            expect(copy).not.equals(rule);
            expect(arena.getSelector(copy)).equals(".foo,.bar");
            expect(arena.childCount(copy)).equals(2);
            expect(arena.getLocation(copy)).deep.equals(arena.getLocation(rule));
            expect(render(arena, copy).code).equals(render(arena, rule).code);
        });

        it("tree operations #9", async function () {
            const result = await parse(".a{color:red}.b{color:blue}.c{color:green}", { minify: false });
            const arena = result.arena;
            const [a, b, c] = arena.children(result.ast);

            arena.detach(b);
            expect(arena.children(result.ast)).deep.equals([a, c]);
            expect(arena.parents[b]).equals(0);
            expect(arena.nextSibling[a]).equals(c);
            expect(arena.previousSibling[c]).equals(a);

            arena.insertBefore(a, b);
            expect(arena.children(result.ast)).deep.equals([b, a, c]);
            expect(arena.firstChild[result.ast]).equals(b);

            arena.setLastChild(result.ast, b);
            expect(arena.children(result.ast)).deep.equals([a, b]);
            expect(arena.parents[c]).equals(0);

            arena.setChildAt(result.ast, 0, c);
            expect(arena.children(result.ast)).deep.equals([c, b]);

            arena.replaceChild(c, a, c);
            expect(arena.children(result.ast)).deep.equals([a, c, b]);
            expect(arena.lastChild[result.ast]).equals(b);

            expect(render(arena, result.ast).code).equals(".a{color:red}.c{color:green}.b{color:blue}");
        });

        it("grows #10", async function () {
            let css = "";

            for (let i = 0; i < 5000; i++) {
                css += `.c${i}{color:red;width:${i}px}`;
            }

            const result = await parse(css, { minify: false });

            expect(result.arena.current).to.be.above(4096);
            expect(result.arena.dataTypes.length).to.be.at.least(result.arena.current);
            expect(result.arena.numericValue.length).equals(result.arena.dataTypes.length);
            expect(result.arena.childCount(result.ast)).equals(5000);
        });

        it("minified output is unchanged #11", async function () {
            const result = await transform(css);
            expect(result.code).equals(
                "@import 'foo.css';@media screen{.foo,.bar{color:red;width:3px}}h1{font-size:2em}",
            );
        });

        it("parseDeclarations() allocates the nodes in the given arena #12", async function () {
            const result = await parse(css, { minify: false });
            const arena = result.arena;
            const rule = arena.firstChild[arena.getChildAt(result.ast, 2)];
            const { arena: target, nodes } = parseDeclarations("height: 3px; /* comment */ margin: 0", arena);

            expect(target).equals(arena);
            expect(nodes.length).equals(3);
            expect(nodes.map((node) => arena.dataTypes[node])).deep.equals([
                EnumToken.DeclarationNodeType,
                EnumToken.CommentNodeType,
                EnumToken.DeclarationNodeType,
            ]);

            // the nodes are detached
            expect(nodes.every((node) => arena.parents[node] == 0)).equals(true);

            arena.appendChildren(rule, ...nodes);
            expect(render(arena, rule).code).equals(".foo,.bar{color:red;width:calc(1px + 2px);height:3px;margin:0}");

            // a new arena is created when none is provided
            const other = parseDeclarations("color: red");

            expect(other.arena).not.equals(arena);
            expect(other.nodes.length).equals(1);
            expect(other.arena.getName(other.nodes[0])).equals("color");
        });

        it("replaceChild() and release() #13", async function () {
            const result = await parse(".a{color:red}.b{color:blue}", { minify: false });
            const arena = result.arena;
            const [a, b] = arena.children(result.ast);
            const clone = arena.clone(b, true);

            arena.replaceChild(a, clone);
            expect(arena.children(result.ast)).deep.equals([clone, b]);
            expect(arena.parents[a]).equals(0);

            // detached nodes keep their data: the memory is not reclaimed and ids are never reused
            const declaration = arena.firstChild[b];

            const token = arena.firstToken[declaration];

            arena.detach(b);
            expect(arena.children(result.ast)).deep.equals([clone]);
            expect(arena.parents[b]).equals(0);
            expect(arena.firstToken[declaration]).equals(token);
            expect(arena.parents[declaration]).equals(b);
            expect(arena.allocate()).to.be.above(b);
            expect(render(arena, result.ast).code).equals(".b{color:blue}");
        });

        it("tokens are allocated in the arena #15", async function () {
            const arena = new AstArena();
            const before = arena.current;
            const tokens = parseString(arena, "linear-gradient(to bottom, white, black) 1px/3");

            // every token is an id allocated in the arena
            expect(tokens.every((token) => typeof token == "number" && token > before)).equals(true);
            expect(tokens.map((token) => arena.dataTypes[token])).deep.equals([
                EnumToken.ImageFunctionTokenType,
                EnumToken.WhitespaceTokenType,
                EnumToken.LengthTokenType,
                EnumToken.LiteralTokenType,
                EnumToken.NumberTokenType,
            ]);

            // the function arguments are the function token list
            const gradient = tokens[0];

            expect(arena.str(gradient)).equals("linear-gradient");
            expect(arena.tokens(gradient).map((token) => arena.str(token))).deep.equals([
                "to",
                "",
                "bottom",
                "",
                "white",
                "",
                "black",
            ]);
            expect(arena.parents[arena.firstToken[gradient]]).equals(gradient);
            expect(arena.colorType[arena.lastToken[gradient]]).equals(ColorType.LIT);

            // numeric tokens
            expect(arena.numericValue[tokens[2]]).equals(1);
            expect(arena.getUnit(tokens[2])).equals("px");
            expect(arena.isNumeric(tokens[2])).equals(true);
            expect(arena.isNumeric(tokens[3])).equals(false);

            expect(renderToken(arena, gradient, { minify: true })).equals("linear-gradient(#fff,#000)");
            expect(renderToken(arena, gradient, { minify: false })).equals("linear-gradient(to bottom,#fff,#000)");
            expect(arena.toPlainObject(tokens[2])).deep.equals({ typ: EnumToken.LengthTokenType, val: 1, unit: "px" });
        });

        it("tokens are created in the arena #16", async function () {
            const arena = new AstArena();
            const px = arena.createToken(EnumToken.LengthTokenType, 3, "px");
            const expression = arena.createBinaryExpression(
                EnumToken.Add,
                arena.createToken(EnumToken.LengthTokenType, 1, "px"),
                arena.createToken(EnumToken.LengthTokenType, 2, "px"),
            );
            const calc = arena.createFunction(EnumToken.MathFunctionTokenType, "calc", [expression]);
            const color = arena.createColor("#ff0000", ColorType.HEX);

            expect(arena.numericValue[expression]).equals(EnumToken.Add);
            expect(arena.numericValue[arena.field(expression, TokenField.L)]).equals(1);
            expect(arena.fieldTokens(expression, TokenField.R).length).equals(1);
            expect(arena.parents[expression]).equals(calc);
            expect(renderToken(arena, calc)).equals("calc(1px + 2px)");
            expect(renderToken(arena, color)).equals("red");
            expect(renderToken(arena, px)).equals("3px");

            // a token belongs to one token list: take() clones attached tokens
            expect(arena.take(px)).equals(px);
            expect(arena.take(expression)).not.equals(expression);
            expect(arena.parents[expression]).equals(calc);

            // fromObject() / toPlainObject()
            const fraction = arena.fromObject({ typ: EnumToken.NumberTokenType, val: { typ: EnumToken.FractionTokenType, l: { typ: EnumToken.NumberTokenType, val: 1 }, r: { typ: EnumToken.NumberTokenType, val: 3 } } });

            expect(arena.hasFraction(fraction)).equals(true);
            expect(arena.numericValue[fraction]).to.be.closeTo(1 / 3, 1e-9);
            expect(renderToken(arena, fraction)).equals("1/3");
            expect(arena.toPlainObject(fraction)).deep.equals({
                typ: EnumToken.NumberTokenType,
                val: { typ: EnumToken.FractionTokenType, l: { typ: EnumToken.NumberTokenType, val: 1 }, r: { typ: EnumToken.NumberTokenType, val: 3 } },
            });
            expect(arena.toPlainObject(calc)).deep.equals({
                typ: EnumToken.MathFunctionTokenType,
                val: "calc",
                chi: [
                    {
                        typ: EnumToken.BinaryExpressionTokenType,
                        op: EnumToken.Add,
                        l: { typ: EnumToken.LengthTokenType, val: 1, unit: "px" },
                        r: { typ: EnumToken.LengthTokenType, val: 2, unit: "px" },
                    },
                ],
            });
            expect(renderToken(arena, arena.fromObject(arena.toPlainObject(calc)))).equals("calc(1px + 2px)");
            // importing the object view of a node of the arena is a noop
            expect(arena.fromObject(arena.toObject(calc))).equals(calc);

            // token lists
            const declaration = arena.createDeclaration(EnumToken.DeclarationNodeType, "width", [calc], null, null);

            arena.appendTokens(declaration, arena.createToken(EnumToken.WhitespaceTokenType), px);
            expect(arena.tokens(declaration)).deep.equals([calc, arena.nextSibling[calc], px]);
            expect(arena.tokenCount(declaration)).equals(3);
            const replacement = arena.createToken(EnumToken.IdenTokenType, "auto");

            arena.replaceToken(calc, replacement);
            expect(arena.parents[calc]).equals(0);
            expect(render(arena, declaration).code).equals("width:auto 3px");
        });

        it("rendering does not modify the arena tree #17", async function () {
            const result = await parse(
                ".a{color:rgb(255 0 0 / 50%);background:linear-gradient(to right, red 0%, blue 100%);width:calc(1px + 2px);.b{color:red}}",
                { minify: false, expandNestingRules: false },
            );
            const arena = result.arena;
            const children = arena.children(result.ast);
            const rule = children[0];
            const nested = arena.lastChild[rule];
            const expected = ".a{color:#ff000080;background:linear-gradient(90deg,red,blue);width:calc(1px + 2px);.b{color:red}}";

            expect(render(arena, result.ast).code).equals(expected);

            // the tokens allocated while rendering are not released: the memory is not trimmed
            const current = arena.current;

            expect(render(arena, result.ast).code).equals(expected);
            expect(arena.current).to.be.at.least(current);

            // copies (expandNestingRules, withParents) are rendered from a temporary stylesheet that is not attached to the tree
            expect(render(arena, result.ast, { expandNestingRules: true }).code).equals(
                ".a{color:#ff000080;background:linear-gradient(90deg,red,blue);width:calc(1px + 2px)}.a .b{color:red}",
            );
            expect(render(arena, nested, { withParents: true }).code).equals(".a{.b{color:red}}");
            expect(arena.children(result.ast)).deep.equals(children);
            expect(arena.lastChild[rule]).equals(nested);
            expect(arena.parents[nested]).equals(rule);

            // the next rendering of the same arena is not affected
            expect(render(arena, result.ast).code).equals(expected);
            expect(render(arena, result.ast, { minify: false, beautify: true }).code).equals(`.a {
 color: #ff000080;
 background: linear-gradient(90deg,red,blue);
 width: calc(1px + 2px);
 .b {
  color: red
 }
}`);
        });

        it("the arena is compacted on demand #18", async function () {
            const result = await parse(".a{color:red;color:red}.b{color:blue}", { minify: true });
            const arena = result.arena;

            // parsing does not compact the arena: the released nodes are still allocated
            let count = 0;

            for (const node of arena.walk(result.ast, { attributes: true })) {
                count++;
                expect(node).to.be.at.most(arena.current);
            }

            expect(arena.current).to.be.above(count);

            // the dropped duplicate declaration, the structural tokens (';', '{', ...) are released
            arena.compact();
            expect(arena.current).equals(count);
            // the ids are renumbered in document order: rule, selector tokens, declaration, value tokens
            expect(arena.children(result.ast)).deep.equals([2, 6]);
            expect(arena.firstToken[2]).equals(3);
            expect(arena.firstChild[2]).equals(4);
            expect(arena.firstToken[4]).equals(5);
            expect(render(arena, result.ast).code).equals(".a{color:red}.b{color:blue}");

            // compact() drops the detached nodes
            const other = await parse(".a{color:red}.b{color:blue}", { minify: false });

            other.arena.detach(other.arena.lastChild[other.ast]);
            other.arena.createRule(EnumToken.RuleNodeType, ".c", null, null, null);

            const before = other.arena.current;
            const mapping = other.arena.compact();

            expect(other.arena.current).to.be.below(before);
            expect(mapping.length).equals(before + 1);
            expect(mapping[other.ast]).equals(other.ast);
            expect(render(other.arena, other.ast).code).equals(".a{color:red}");
        });

        it("marked nodes are released or trimmed on demand #20", async function () {
            const result = await parse(".a{color:red}.b{color:blue}.c{color:green}", { minify: false });
            const arena = result.arena;
            const [a, b, c] = arena.children(result.ast);
            const declaration = arena.firstChild[b];

            // mark() only flags the nodes
            arena.mark(a, c);
            expect(arena.isMarked(a)).equals(true);
            expect(arena.isMarked(b)).equals(false);
            expect(arena.children(result.ast)).deep.equals([a, b, c]);

            // release() detaches the marked nodes and drops their data. the ids are not reused
            arena.release();
            expect(arena.children(result.ast)).deep.equals([b]);
            expect(arena.isMarked(a)).equals(false);
            expect(arena.name[a]).equals(0);
            expect(render(arena, result.ast).code).equals(".b{color:blue}");

            // release(id, deep) releases a single node
            arena.release(declaration, true);
            expect(arena.firstChild[b]).equals(0);

            // trim() releases the marked nodes and reclaims the memory: the ids are renumbered
            const other = await parse(".a{color:red}.b{color:blue}.c{color:green}", { minify: false });
            const before = other.arena.current;
            const [, second] = other.arena.children(other.ast);

            other.arena.mark(second);

            const mapping = other.arena.trim();

            expect(mapping[second]).equals(0);
            expect(other.arena.current).to.be.below(before);
            expect(render(other.arena, other.ast).code).equals(".a{color:red}.c{color:green}");
        });

        it("the arena is transferable #19", async function () {
            const result = await parse(css, { minify: false });
            const arena = result.arena;
            const expected = render(arena, result.ast).code;
            const location = arena.getLocation(arena.firstChild[arena.getChildAt(result.ast, 2)]);
            const [properties, transferables] = AstArena.toTransferableArenaObject(arena);

            expect(properties.kind).equals("AstArena");
            expect(properties.current).equals(arena.current);
            expect(transferables.length).equals(arenaColumns.length);
            expect(transferables[0]).equals(arena.dataTypes.buffer);
            expect(transferables.every((buffer) => buffer instanceof ArrayBuffer)).equals(true);

            // the properties are cloned, the buffers are moved (zero copy)
            const message = structuredClone({ ast: result.ast, properties, transferables }, { transfer: transferables });

            expect(arena.transferred).equals(true);
            expect(arena.dataTypes.length).equals(0);
            expect(message.transferables[0].byteLength).to.be.above(0);

            const copy = AstArena.fromTransferableArenaObjects(message.properties, message.transferables);

            expect(copy).to.be.instanceOf(AstArena);
            expect(copy.transferred).equals(false);
            expect(copy.current).equals(properties.current);
            // the columns are views on the transferred buffers
            expect(copy.dataTypes.buffer).equals(message.transferables[0]);
            expect(copy.strings).deep.equals(properties.strings);
            expect(copy.internString("color")).equals(copy.name[copy.firstChild[copy.firstChild[copy.getChildAt(message.ast, 2)]]]);
            expect(render(copy, message.ast).code).equals(expected);

            // the arena is fully functional
            const rule = copy.firstChild[copy.getChildAt(message.ast, 2)];

            copy.setSelector(rule, ".baz");
            copy.appendChildren(
                rule,
                copy.createDeclaration(EnumToken.DeclarationNodeType, "margin", [copy.createToken(EnumToken.NumberTokenType, 0)], null, null),
            );
            expect(render(copy, message.ast).code).equals(
                "@import 'foo.css';@media screen{.baz{color:red;width:calc(1px + 2px);margin:0}}h1{font-size:2em}",
            );
            // the packed locations are preserved
            expect(copy.getLocation(rule)).deep.equals(location);

            // without a transfer list the buffers are copied
            const cloned = structuredClone({ properties: AstArena.toTransferableArenaObject(copy)[0], transferables: AstArena.toTransferableArenaObject(copy)[1] });

            expect(copy.transferred).equals(false);
            expect(render(AstArena.fromTransferableArenaObjects(cloned.properties, cloned.transferables), message.ast).code).equals(
                render(copy, message.ast).code,
            );

            // the base arena class can be transferred too
            const base = new Arena(16);

            base.dataTypes[base.allocate()] = EnumToken.CommentTokenType;

            const [baseProperties, baseTransferables] = Arena.toTransferableArenaObject(base);
            const baseCopy = Arena.fromTransferableArenaObjects(baseProperties, baseTransferables);

            expect(baseProperties.kind).equals("Arena");
            expect(baseCopy).to.be.instanceOf(Arena);
            expect(baseCopy).not.to.be.instanceOf(AstArena);
            expect(baseCopy.dataTypes[2]).equals(EnumToken.CommentTokenType);
            expect(baseCopy.current).equals(2);
        });

        it("the arena is trimmed by compact() #14", async function () {
            const result = await parse(css, { minify: false });
            const arena = result.arena;
            const before = arena.current;

            // parsing does not compact the arena
            expect(arena.dataTypes.length).to.be.above(arena.current);
            arena.compact();
            expect(arena.current).to.be.below(before);

            // the columns are shrunk to the allocated nodes (plus a small headroom for rendering)
            expect(arena.dataTypes.length).to.be.above(arena.current);
            expect(arena.dataTypes.length).to.be.at.most(arena.current + 1 + Math.max(64, arena.current >> 5));
            expect(arena.numericValue.length).equals(arena.dataTypes.length);

            // no empty error list is stored
            expect(arena.errors.size).equals(0);

            // the arena grows again
            const rule = arena.createRule(EnumToken.RuleNodeType, ".baz", null, null, null);

            expect(arena.dataTypes.length).to.be.above(rule);
        });

        it("the columns are read with the accessor methods #21", async function () {
            const result = await parse(css, { minify: false });
            const arena = result.arena;

            expect(arena.getCapacity()).equals(arena.dataTypes.length);
            expect(arena.getLastId()).equals(arena.current);
            expect(arena.getStringCount()).equals(arena.strings.length);

            for (let id = 1; id <= arena.getLastId(); id++) {
                expect(arena.getType(id)).equals(arena.dataTypes[id]);
                expect(arena.getParent(id)).equals(arena.parents[id]);
                expect(arena.getFirstChild(id)).equals(arena.firstChild[id]);
                expect(arena.getLastChild(id)).equals(arena.lastChild[id]);
                expect(arena.getNextSibling(id)).equals(arena.nextSibling[id]);
                expect(arena.getPreviousSibling(id)).equals(arena.previousSibling[id]);
                expect(arena.getFirstToken(id)).equals(arena.firstToken[id]);
                expect(arena.getLastToken(id)).equals(arena.lastToken[id]);
            }

            // the children and the tokens are linked lists
            const children = [];

            for (let child = arena.getFirstChild(result.ast); child != 0; child = arena.getNextSibling(child)) {
                expect(arena.getParent(child)).equals(result.ast);
                children.push(child);
            }

            expect(children).deep.equals(arena.children(result.ast));
            expect(arena.getLastChild(result.ast)).equals(children[children.length - 1]);
            expect(arena.getPreviousSibling(children[1])).equals(children[0]);

            const rule = children.find((id) => arena.getType(id) == EnumToken.RuleNodeType);
            const declaration = arena.getFirstChild(rule);
            const tokens = [];

            for (let token = arena.getFirstToken(declaration); token != 0; token = arena.getNextSibling(token)) {
                tokens.push(token);
            }

            expect(arena.getName(rule)).equals("h1");
            expect(arena.getName(declaration)).equals("font-size");
            expect(tokens).deep.equals(arena.tokens(declaration));
            expect(arena.getLastToken(declaration)).equals(tokens[tokens.length - 1]);
            expect(arena.getNumericValue(tokens[0])).equals(2);

            const capacity = arena.getCapacity();

            arena.compact();
            expect(arena.getCapacity()).to.be.at.most(capacity);
            expect(arena.getLastId()).equals(arena.current);
        });
    });
}
