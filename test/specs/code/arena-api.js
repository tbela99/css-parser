import { EnumToken, EnumAstNodeStatus, ColorType } from "../../../dist/ast/types.js";
import { AstArena, TokenField } from "../../../dist/ast/arena.js";
import { ARENAID } from "../../../dist/ast/arena-node.js";
import { renderValue as renderToken } from "../../../dist/printer/render.js";

export function run(describe, expect, it, transform, parse, render) {
    describe("arena api", function () {
        it("node and token setters #1", function () {
            const arena = new AstArena();
            const token = arena.createToken(EnumToken.IdenTokenType, "red");

            expect(arena.typeOf(token)).equals(EnumToken.IdenTokenType);
            expect(arena.typeOf(null)).equals(null);
            expect(arena.typeOf(undefined)).equals(null);

            arena.setType(token, EnumToken.LengthTokenType);
            arena.setNumericValue(token, 12);
            arena.setUnit(token, arena.internString("px"));
            expect(arena.typeOf(token)).equals(EnumToken.LengthTokenType);
            expect(arena.getNumericValue(token)).equals(12);
            expect(arena.getUnit(token)).equals("px");
            expect(renderToken(arena, token)).equals("12px");

            const ident = arena.createToken(EnumToken.IdenTokenType, "a");

            arena.setValue(ident, arena.internString("blue"));
            expect(arena.str(ident)).equals("blue");
            arena.setStr(ident, "green");
            expect(arena.str(ident)).equals("green");
            expect(renderToken(arena, ident)).equals("green");

            const declaration = arena.createDeclaration(EnumToken.DeclarationNodeType, "color", [ident], null, null);

            arena.setName(declaration, arena.internString("background-color"));
            expect(arena.getName(declaration)).equals("background-color");
            expect(render(arena, declaration).code).equals("background-color:green");
        });

        it("color type and flags #2", function () {
            const arena = new AstArena();
            const color = arena.createColor("#ff0000", ColorType.HEX);

            expect(arena.getColorType(color)).equals(ColorType.HEX);
            arena.setColorType(color, ColorType.LIT);
            expect(arena.getColorType(color)).equals(ColorType.LIT);

            const rule = arena.createRule(".a", []);

            arena.setFlags(rule, EnumAstNodeStatus.Invalid | EnumAstNodeStatus.HasChildren);
            expect(arena.getFlags(rule)).equals(EnumAstNodeStatus.Invalid | EnumAstNodeStatus.HasChildren);
            expect(arena.hasFlags(rule, EnumAstNodeStatus.Invalid)).equals(true);
            expect(arena.hasFlags(rule, EnumAstNodeStatus.Invalid | EnumAstNodeStatus.HasChildren)).equals(true);
            expect(arena.isInvalid(rule)).equals(true);
            expect(arena.hasChildren(rule)).equals(true);

            arena.setFlags(rule, 0);
            expect(arena.hasFlags(rule, EnumAstNodeStatus.Invalid)).equals(false);
            expect(arena.isInvalid(rule)).equals(false);
            expect(arena.hasChildren(rule)).equals(false);
        });

        it("structured token fields #3", function () {
            const arena = new AstArena();
            const one = arena.createToken(EnumToken.NumberTokenType, 1);
            const two = arena.createToken(EnumToken.NumberTokenType, 2);
            const expression = arena.createBinaryExpression(EnumToken.Add, one, two);

            expect(arena.getLeft(expression)).deep.equals([one]);
            expect(arena.getRight(expression)).deep.equals([two]);

            const three = arena.createToken(EnumToken.NumberTokenType, 3);
            const four = arena.createToken(EnumToken.NumberTokenType, 4);

            arena.setLeft(expression, three);
            arena.setRight(expression, four);
            expect(arena.getLeft(expression)).deep.equals([three]);
            expect(arena.getRight(expression)).deep.equals([four]);
            expect(renderToken(arena, expression)).equals("3 + 4");

            // null removes the right hand side
            arena.setRight(expression, null);
            expect(arena.fieldTokens(expression, TokenField.R)).deep.equals([]);

            arena.setField(expression, TokenField.R, arena.createToken(EnumToken.NumberTokenType, 5));
            arena.appendField(expression, TokenField.R, arena.createToken(EnumToken.NumberTokenType, 6));
            expect(arena.fieldTokens(expression, TokenField.R).map((id) => arena.getNumericValue(id))).deep.equals([5, 6]);

            // a token without fields
            const empty = arena.createToken(EnumToken.MediaRangeQueryTokenType);

            expect(arena.getLeft(empty)).equals(null);
            expect(arena.getRight(empty)).equals(null);

            const lt = arena.createToken(EnumToken.LtTokenType);
            const lte = arena.createToken(EnumToken.LteTokenType);

            arena.setOp(empty, lt);
            arena.setOp2(empty, lte);
            expect(arena.getOp(empty)).equals(lt);
            expect(arena.getOp2(empty)).equals(lte);
        });

        it("fractions #4", function () {
            const arena = new AstArena();
            const l = arena.createToken(EnumToken.NumberTokenType, 1);
            const r = arena.createToken(EnumToken.NumberTokenType, 3);
            const fraction = arena.createFraction(l, r);

            expect(arena.numerator(fraction)).equals(l);
            expect(arena.denominator(fraction)).equals(r);
        });

        it("spans and locations #5", function () {
            const arena = new AstArena();
            const token = arena.createToken(EnumToken.IdenTokenType, "a");

            expect(arena.hasLocation(token)).equals(false);
            expect(arena.getLocation(token)).equals(null);

            arena.setLocation(token, 0, 4, 10);
            expect(arena.hasLocation(token)).equals(true);
            expect(arena.getLocation(token)).deep.equals({ sta: 4, end: 10, srcId: 0 });

            arena.setSpandStart(token, 6);
            arena.setSpanEnd(token, 20);
            expect(arena.getSpanStart(token)).equals(6);
            expect(arena.getSpanEnd(token)).equals(20);

            // large offsets
            arena.setSpanEnd(token, 0xfffffff);
            arena.setSpandStart(token, 0xffffff0);
            expect(arena.getSpanStart(token)).equals(0xffffff0);
            expect(arena.getSpanEnd(token)).equals(0xfffffff);

            arena.setLocation(token, null, null, null);
            expect(arena.hasLocation(token)).equals(false);
        });

        it("children and tokens #6", async function () {
            const result = await parse(".a{color:red}.b{color:blue}.c{color:green}", { minify: false });
            const arena = result.arena;
            const [a, b, c] = arena.children(result.ast);

            expect(arena.findChild(result.ast, (id) => arena.getSelector(id) === ".b")).equals(b);
            expect(arena.findChild(result.ast, () => false)).equals(null);
            expect(arena.siblings(b)).deep.equals([a, b, c]);
            expect(arena.siblings(b, (arena, id) => id !== b)).deep.equals([a, c]);

            arena.setChildren(result.ast, c, a);
            expect(arena.children(result.ast)).deep.equals([c, a]);
            expect(render(arena, result.ast).code).equals(".c{color:green}.a{color:red}");

            arena.setFirstChild(result.ast, b);
            expect(arena.firstChild[result.ast]).equals(b);

            const declaration = arena.children(a)[0];
            const blue = arena.createToken(EnumToken.IdenTokenType, "blue");
            const space = arena.createToken(EnumToken.WhitespaceTokenType);
            const important = arena.createToken(EnumToken.IdenTokenType, "black");

            arena.setTokens(declaration, blue);
            expect(arena.tokens(declaration)).deep.equals([blue]);
            arena.prependTokens(declaration, important, space);
            expect(arena.tokens(declaration)).deep.equals([important, space, blue]);
            expect(render(arena, declaration).code).equals("color:black blue");

            arena.setFirstToken(declaration, blue);
            expect(arena.firstToken[declaration]).equals(blue);

            const rule = arena.createRule(".d", []);

            arena.setParent(rule, result.ast);
            expect(arena.getParent(rule)).equals(result.ast);
        });

        it("compactStrings() drops the unused strings #7", function () {
            const arena = new AstArena();
            const token = arena.createToken(EnumToken.IdenTokenType, "used");

            arena.internString("unused-string");

            const count = arena.getStringCount();

            arena.compactStrings();
            expect(arena.str(token)).equals("used");
            expect(arena.getStringCount()).to.be.below(count);
        });

        it("AstArenaNode accessors #8", function () {
            const arena = new AstArena();

            // typ
            const ident = arena.toObject(arena.createToken(EnumToken.IdenTokenType, "a"));

            ident.typ = EnumToken.DashedIdenTokenType;
            expect(ident.typ).equals(EnumToken.DashedIdenTokenType);

            // tokens
            const declaration = arena.toObject(
                arena.createDeclaration(EnumToken.DeclarationNodeType, "color", [arena.createToken(EnumToken.IdenTokenType, "red")], null, null),
            );

            expect(declaration.tokens).equals(null);

            const fn = arena.toObject(arena.createFunction(EnumToken.FunctionTokenType, "foo", [arena.createToken(EnumToken.IdenTokenType, "x")]));

            expect(fn.tokens.map((token) => token.val)).deep.equals(["x"]);

            const rule = arena.toObject(arena.createRule(".a", []));

            rule.tokens = [arena.createToken(EnumToken.IdenTokenType, "b")];
            expect(rule.tokens.map((token) => token.val)).deep.equals(["b"]);
            rule.tokens = null;
            expect(rule.tokens).equals(null);

            // cal: color tokens only
            const color = arena.toObject(arena.createColor("#ff0000", ColorType.HEX));

            expect(color.cal).equals(undefined);
            color.cal = "rgb";
            expect(color.cal).equals("rgb");
            color.cal = null;
            expect(color.cal).equals(undefined);
            expect(ident.cal).equals(undefined);

            // attr: match expressions only
            const match = arena.toObject(arena.createToken(EnumToken.MatchExpressionTokenType));

            expect(match.attr).equals(undefined);
            match.attr = "i";
            expect(match.attr).equals("i");
            match.attr = undefined;
            expect(match.attr).equals(undefined);
            ident.attr = "s";
            expect(ident.attr).equals(undefined);

            // sign: unary expressions only
            const unary = arena.toObject(arena.createToken(EnumToken.UnaryExpressionTokenType));

            unary.sign = EnumToken.Sub;
            expect(unary.sign).equals(EnumToken.Sub);
            expect(ident.sign).equals(undefined);

            // op1 / op2: media range queries
            const range = arena.toObject(arena.createToken(EnumToken.MediaRangeQueryTokenType));

            range.op1 = arena.createToken(EnumToken.LteTokenType);
            range.op2 = arena.createToken(EnumToken.LtTokenType);
            expect(range.op1.typ).equals(EnumToken.LteTokenType);
            expect(range.op2.typ).equals(EnumToken.LtTokenType);
            range.op2 = null;
            expect(range.op2).equals(null);
            expect(ident.op1).equals(undefined);
            expect(ident.op2).equals(undefined);

            // l: fractions and structured tokens
            const fraction = arena.toObject(
                arena.createFraction(arena.createToken(EnumToken.NumberTokenType, 1), arena.createToken(EnumToken.NumberTokenType, 3)),
            );

            fraction.l = arena.createToken(EnumToken.NumberTokenType, 2);
            expect(fraction.l.val).equals(2);
            expect(fraction.r.val).equals(3);

            const expression = arena.toObject(
                arena.createBinaryExpression(EnumToken.Add, arena.createToken(EnumToken.NumberTokenType, 1), arena.createToken(EnumToken.NumberTokenType, 2)),
            );

            expression.l = arena.createToken(EnumToken.NumberTokenType, 5);
            expect(renderToken(arena, expression[ARENAID])).equals("5 + 2");

            // loc
            ident.loc = { sta: 1, end: 3, srcId: 0 };
            expect(ident.loc).deep.equals({ sta: 1, end: 3, srcId: 0 });
            expect(Object.isFrozen(ident.loc)).equals(true);
            ident.loc = null;
            expect(ident.loc).equals(null);
        });
    });
}
