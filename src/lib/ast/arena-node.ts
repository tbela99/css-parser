/**
 * Object view of the arena nodes and tokens: {@link AstArenaNode}
 *
 * @module
 */
import type {
    AstNode,
    ErrorDescription,
    PlainAstNode,
    PlainToken,
    SourceLocation,
    Token,
} from "../../@types/index.d.ts";
import { ColorType, EnumAstNodeStatus, EnumToken } from "./types.ts";
import type { AstArena } from "./arena.ts";
import { numericTokenTypes, structuredFields, TokenField } from "./arena.ts";

/**
 * keyed symbol (`Symbol.for()`) of the arena node id of an {@link AstArenaNode}. the symbol is shared by every copy of
 * the library loaded in the same realm
 *
 * ```ts
 * const node = arena.toObject(id);
 *
 * console.log(node[ARENAID] === id); // true
 * ```
 */
export const ARENAID: unique symbol = Symbol.for("@tbela99/css-parser/ARENAID") as typeof ARENAID;

/**
 * keyed symbol (`Symbol.for()`) of the arena of an {@link AstArenaNode}
 */
export const ARENA: unique symbol = Symbol.for("@tbela99/css-parser/ARENA") as typeof ARENA;

/**
 * value accepted by the setters of {@link AstArenaNode}: a node id of the arena, an {@link AstArenaNode} (of any
 * arena) or a plain object
 */
export declare type AstArenaNodeInput = number | AstArenaNode | PlainAstNode | PlainToken;

/**
 * true if the node type is an ast node type (stylesheet, rule, at-rule, declaration, comment, css module nodes). the
 * other types are value tokens
 * @param typ
 */
export function isNodeObjectType(typ: EnumToken): boolean {
    switch (typ) {
        case EnumToken.StyleSheetNodeType:
        case EnumToken.RuleNodeType:
        case EnumToken.KeyframesRuleNodeType:
        case EnumToken.AtRuleNodeType:
        case EnumToken.KeyframesAtRuleNodeType:
        case EnumToken.CommentNodeType:
        case EnumToken.CDOCOMMNodeType:
        case EnumToken.DeclarationNodeType:
        case EnumToken.CssVariableTokenType:
        case EnumToken.CssVariableImportTokenType:
        case EnumToken.CssVariableDeclarationMapTokenType:
            return true;
    }

    return false;
}

/**
 * node types whose value (`val`) is the token list: declarations and css module variables
 * @param typ
 */
function hasValueTokens(typ: EnumToken): boolean {
    return (
        typ == EnumToken.DeclarationNodeType ||
        typ == EnumToken.CssVariableTokenType ||
        typ == EnumToken.CssVariableImportTokenType ||
        typ == EnumToken.CssVariableDeclarationMapTokenType
    );
}

/**
 * convert setter values to node ids of the arena. {@link AstArenaNode} of the arena are used as is (no copy), the nodes
 * of another arena are imported, plain objects are allocated
 * @param arena
 * @param values
 */
function toIds(arena: AstArena, values: AstArenaNodeInput | readonly AstArenaNodeInput[] | null | undefined): number[] {
    const result: number[] = [];

    if (values == null) {
        return result;
    }

    if (!Array.isArray(values)) {
        const value: AstArenaNodeInput = values as AstArenaNodeInput;

        result.push(typeof value == "number" ? value : arena.fromObject(value));
        return result;
    }

    const list: readonly AstArenaNodeInput[] = values as readonly AstArenaNodeInput[];

    for (let i = 0; i < list.length; i++) {
        const value: AstArenaNodeInput = list[i];

        result.push(typeof value == "number" ? value : arena.fromObject(value));
    }

    return result;
}

/**
 * object views of a linked list, in a frozen array: the array cannot be modified, assign the property instead
 * @param arena
 * @param first first id of the list
 */
function listViews(arena: AstArena, first: number): readonly AstArenaNode[] {
    const result: AstArenaNode[] = [];

    for (let id = first; id != 0; id = arena.nextSibling[id]) {
        result.push(new AstArenaNode(arena, id));
    }

    return Object.freeze(result);
}

/**
 * Object view of an arena node or token, returned by {@link AstArena.toObject}. The view does not copy the data: its
 * properties are getters and setters that read and write the arena columns. A view only holds the arena and the node
 * id ({@link ARENAID}).
 *
 * - the properties are the properties of the plain objects ({@link PlainAstNode}, {@link PlainToken}): `typ`, `nam`,
 *   `sel`, `val`, `chi`, `tokens`, `unit`, `kin`, `l`, `r`, `op`, ... and `loc`, `state`, `errors`, `parent`,
 * - the nodes and tokens (children, value tokens, fields) are returned as new views in a frozen array. the arrays,
 *   the locations (`loc`) and the error lists (`errors`) cannot be modified (modifying them throws in strict mode):
 *   assign the property to modify the arena (`node.chi = [...node.chi, rule]`),
 * - the values assigned can be node ids, views or plain objects. importing a view of the same arena is a noop: the
 *   node is used as is, the views of another arena are copied,
 * - two views of the same node are different objects: compare their {@link ARENAID},
 * - `JSON.stringify()` and `toJSON()` return a deep plain copy ({@link AstArena.toPlainObject}).
 *
 * ```ts
 * function visitor(arena: AstArena, id: number) {
 *
 *     const node = arena.toObject(id);
 *
 *     if (node.nam == 'width') {
 *
 *         node.nam = 'height';
 *         node.val = [{typ: EnumToken.LengthTokenType, val: 3, unit: 'px'}];
 *     }
 * }
 * ```
 */
export class AstArenaNode {
    /**
     * arena of the node
     */
    readonly [ARENA]: AstArena;
    /**
     * node id in the arena
     */
    readonly [ARENAID]: number;

    /**
     * @param arena
     * @param id
     */
    constructor(arena: AstArena, id: number) {
        this[ARENA] = arena;
        this[ARENAID] = id;
    }

    /**
     * node or token type
     */
    get typ(): EnumToken {
        return this[ARENA].dataTypes[this[ARENAID]];
    }

    set typ(typ: EnumToken) {
        this[ARENA].dataTypes[this[ARENAID]] = typ;
    }

    /**
     * at-rule / declaration name, token name. undefined for the other nodes
     */
    get nam(): string | undefined {
        const arena: AstArena = this[ARENA];
        const id: number = this[ARENAID];
        const typ: EnumToken = arena.dataTypes[id];

        if (isNodeObjectType(typ)) {
            return typ == EnumToken.AtRuleNodeType || typ == EnumToken.KeyframesAtRuleNodeType || hasValueTokens(typ)
                ? arena.strings[arena.name[id]]
                : undefined;
        }

        return arena.name[id] == 0 ? undefined : arena.strings[arena.name[id]];
    }

    set nam(nam: string) {
        this[ARENA].name[this[ARENAID]] = this[ARENA].internString(nam);
    }

    /**
     * rule selector. undefined for the other nodes
     */
    get sel(): string | undefined {
        const arena: AstArena = this[ARENA];
        const id: number = this[ARENAID];
        const typ: EnumToken = arena.dataTypes[id];

        return typ == EnumToken.RuleNodeType || typ == EnumToken.KeyframesRuleNodeType
            ? arena.strings[arena.name[id]]
            : undefined;
    }

    set sel(sel: string) {
        this[ARENA].name[this[ARENAID]] = this[ARENA].internString(sel);
    }

    /**
     * value:
     * - at-rule prelude, comment: string,
     * - declaration: value tokens,
     * - number, dimension, percentage: number (or the fraction token),
     * - identifier, string, function name, ...: string,
     * - unary expression: the operand,
     * - structured tokens with a value field: the field tokens
     */
    get val(): string | number | AstArenaNode | readonly AstArenaNode[] | null | undefined {
        const arena: AstArena = this[ARENA];
        const id: number = this[ARENAID];
        const typ: EnumToken = arena.dataTypes[id];

        if (isNodeObjectType(typ)) {
            if (hasValueTokens(typ)) {
                return listViews(arena, arena.firstToken[id]);
            }

            return typ == EnumToken.StyleSheetNodeType ||
                typ == EnumToken.RuleNodeType ||
                typ == EnumToken.KeyframesRuleNodeType
                ? undefined
                : arena.strings[arena.stringValue[id]];
        }

        if (typ == EnumToken.BinaryExpressionTokenType || typ == EnumToken.FractionTokenType) {
            return undefined;
        }

        if (typ == EnumToken.UnaryExpressionTokenType) {
            return arena.firstChild[id] == 0 ? null : new AstArenaNode(arena, arena.firstChild[id]);
        }

        if (numericTokenTypes.has(typ)) {
            const fraction: number = arena.getFraction(id);

            return fraction == 0 ? arena.numericValue[id] : new AstArenaNode(arena, fraction);
        }

        const field: AstArenaNode | readonly AstArenaNode[] | null | undefined = this.getField("val");

        if (field !== undefined) {
            return field;
        }

        return arena.stringValue[id] != 0 || typ == EnumToken.IdenTokenType || typ == EnumToken.StringTokenType
            ? arena.strings[arena.stringValue[id]]
            : undefined;
    }

    set val(val: string | number | AstArenaNodeInput | readonly AstArenaNodeInput[] | null | undefined) {
        const arena: AstArena = this[ARENA];
        const id: number = this[ARENAID];
        const typ: EnumToken = arena.dataTypes[id];

        if (isNodeObjectType(typ) && hasValueTokens(typ)) {
            arena.setTokenList(id, toIds(arena, val as AstArenaNodeInput[]));
            return;
        }

        if (typeof val == "string") {
            if (numericTokenTypes.has(typ)) {
                arena.numericValue[id] = +val;
                arena.setFraction(id, null);
            } else {
                arena.stringValue[id] = arena.internString(val);
            }

            return;
        }

        if (typeof val == "number") {
            arena.numericValue[id] = val;

            if (numericTokenTypes.has(typ)) {
                arena.setFraction(id, null);
            }

            return;
        }

        if (typ == EnumToken.UnaryExpressionTokenType) {
            arena.setChildList(id, toIds(arena, val));
        } else if (numericTokenTypes.has(typ)) {
            arena.setFraction(id, val == null ? null : toIds(arena, val)[0]);
        } else if (!this.setField("val", val)) {
            arena.stringValue[id] = 0;
        }
    }

    /**
     * children: the child nodes of a stylesheet, a rule or an at-rule with a block, the tokens of a function token
     * (arguments), a parentheses token, ... undefined when the node has no children
     */
    get chi(): readonly AstArenaNode[] | undefined {
        const arena: AstArena = this[ARENA];
        const id: number = this[ARENAID];

        if (arena.flags[id] & EnumAstNodeStatus.HasChildren) {
            return listViews(arena, arena.firstChild[id]);
        }

        if (isNodeObjectType(arena.dataTypes[id]) || arena.firstToken[id] == 0) {
            return undefined;
        }

        return listViews(arena, arena.firstToken[id]);
    }

    set chi(chi: readonly AstArenaNodeInput[] | null | undefined) {
        const arena: AstArena = this[ARENA];
        const id: number = this[ARENAID];
        const typ: EnumToken = arena.dataTypes[id];

        if (
            typ == EnumToken.StyleSheetNodeType ||
            typ == EnumToken.RuleNodeType ||
            typ == EnumToken.KeyframesRuleNodeType ||
            typ == EnumToken.AtRuleNodeType ||
            typ == EnumToken.KeyframesAtRuleNodeType
        ) {
            if (chi == null) {
                // an at-rule without a block
                arena.setChildList(id, []);

                if (typ == EnumToken.AtRuleNodeType || typ == EnumToken.KeyframesAtRuleNodeType) {
                    arena.flags[id] &= ~EnumAstNodeStatus.HasChildren;
                }

                return;
            }

            arena.flags[id] |= EnumAstNodeStatus.HasChildren;
            arena.setChildList(id, toIds(arena, chi));
            return;
        }

        arena.setTokenList(id, toIds(arena, chi));
    }

    /**
     * prelude tokens of an at-rule, selector tokens of a rule. null when the node has no prelude tokens
     */
    get tokens(): readonly AstArenaNode[] | null {
        const arena: AstArena = this[ARENA];
        const id: number = this[ARENAID];

        return (arena.flags[id] & EnumAstNodeStatus.HasValues) != 0 || arena.firstToken[id] == 0
            ? null
            : listViews(arena, arena.firstToken[id]);
    }

    set tokens(tokens: readonly AstArenaNodeInput[] | null | undefined) {
        this[ARENA].setTokenList(this[ARENAID], toIds(this[ARENA], tokens));
    }

    /**
     * unit of a dimension, calendar (`cal`) of a color, attribute (`attr`) of a match expression
     */
    get unit(): string | undefined {
        const arena: AstArena = this[ARENA];
        const id: number = this[ARENAID];
        const typ: EnumToken = arena.dataTypes[id];

        return arena.unit[id] == 0 || typ == EnumToken.ColorTokenType || typ == EnumToken.MatchExpressionTokenType
            ? undefined
            : arena.strings[arena.unit[id]];
    }

    set unit(unit: string | null | undefined) {
        this[ARENA].setUnitString(this[ARENAID], unit ?? null);
    }

    /**
     * color space of a color
     */
    get cal(): string | undefined {
        const arena: AstArena = this[ARENA];
        const id: number = this[ARENAID];

        return arena.unit[id] == 0 || arena.dataTypes[id] != EnumToken.ColorTokenType
            ? undefined
            : arena.strings[arena.unit[id]];
    }

    set cal(cal: string | null | undefined) {
        this[ARENA].setUnitString(this[ARENAID], cal ?? null);
    }

    /**
     * attribute of a match expression
     */
    get attr(): string | undefined {
        const arena: AstArena = this[ARENA];
        const id: number = this[ARENAID];

        return arena.unit[id] == 0 || arena.dataTypes[id] != EnumToken.MatchExpressionTokenType
            ? undefined
            : arena.strings[arena.unit[id]];
    }

    set attr(attr: string | null | undefined) {
        this[ARENA].setUnitString(this[ARENAID], attr ?? null);
    }

    /**
     * color type of a color token
     */
    get kin(): ColorType | undefined {
        const arena: AstArena = this[ARENA];
        const id: number = this[ARENAID];

        return arena.dataTypes[id] != EnumToken.ColorTokenType || arena.colorType[id] == ColorType.NONE
            ? undefined
            : arena.colorType[id];
    }

    set kin(kin: ColorType | null | undefined) {
        this[ARENA].colorType[this[ARENAID]] = kin ?? ColorType.NONE;
    }

    /**
     * sign of a unary expression
     */
    get sign(): EnumToken | undefined {
        const arena: AstArena = this[ARENA];
        const id: number = this[ARENAID];

        return arena.dataTypes[id] == EnumToken.UnaryExpressionTokenType ? arena.numericValue[id] : undefined;
    }

    set sign(sign: EnumToken) {
        this[ARENA].numericValue[this[ARENAID]] = sign;
    }

    /**
     * operator: the operator of a binary expression, the operator tokens of a structured token
     */
    get op(): EnumToken | AstArenaNode | readonly AstArenaNode[] | null | undefined {
        const arena: AstArena = this[ARENA];
        const id: number = this[ARENAID];

        return arena.dataTypes[id] == EnumToken.BinaryExpressionTokenType ? arena.numericValue[id] : this.getField("op");
    }

    set op(op: EnumToken | AstArenaNodeInput | readonly AstArenaNodeInput[] | null) {
        const arena: AstArena = this[ARENA];
        const id: number = this[ARENAID];

        if (arena.dataTypes[id] == EnumToken.BinaryExpressionTokenType) {
            arena.numericValue[id] = op as EnumToken;
        } else {
            this.setField("op", op as AstArenaNodeInput);
        }
    }

    /**
     * first operator of a media range query
     */
    get op1(): AstArenaNode | readonly AstArenaNode[] | null | undefined {
        return this.getField("op1");
    }

    set op1(op: AstArenaNodeInput | readonly AstArenaNodeInput[] | null) {
        this.setField("op1", op);
    }

    /**
     * second operator of a media range query
     */
    get op2(): AstArenaNode | readonly AstArenaNode[] | null | undefined {
        return this.getField("op2");
    }

    set op2(op: AstArenaNodeInput | readonly AstArenaNodeInput[] | null) {
        this.setField("op2", op);
    }

    /**
     * left hand side of a structured token, numerator of a fraction
     */
    get l(): AstArenaNode | readonly AstArenaNode[] | null | undefined {
        const arena: AstArena = this[ARENA];
        const id: number = this[ARENAID];

        if (arena.dataTypes[id] == EnumToken.FractionTokenType) {
            return arena.firstChild[id] == 0 ? null : new AstArenaNode(arena, arena.firstChild[id]);
        }

        return this.getField("l");
    }

    set l(l: AstArenaNodeInput | readonly AstArenaNodeInput[] | null) {
        const arena: AstArena = this[ARENA];
        const id: number = this[ARENAID];

        if (arena.dataTypes[id] == EnumToken.FractionTokenType) {
            const r: number = arena.lastChild[id];
            const values: number[] = toIds(arena, l);

            if (r != 0 && r != arena.firstChild[id]) {
                values.push(r);
            }

            arena.setChildList(id, values);
            return;
        }

        this.setField("l", l);
    }

    /**
     * right hand side of a structured token, denominator of a fraction
     */
    get r(): AstArenaNode | readonly AstArenaNode[] | null | undefined {
        const arena: AstArena = this[ARENA];
        const id: number = this[ARENAID];

        if (arena.dataTypes[id] == EnumToken.FractionTokenType) {
            return arena.lastChild[id] == 0 ? null : new AstArenaNode(arena, arena.lastChild[id]);
        }

        return this.getField("r");
    }

    set r(r: AstArenaNodeInput | readonly AstArenaNodeInput[] | null) {
        const arena: AstArena = this[ARENA];
        const id: number = this[ARENAID];

        if (arena.dataTypes[id] == EnumToken.FractionTokenType) {
            const l: number = arena.firstChild[id];
            const values: number[] = toIds(arena, r);

            if (l != 0) {
                values.unshift(l);
            }

            arena.setChildList(id, values);
            return;
        }

        this.setField("r", r);
    }

    /**
     * source location. null when the node has no location
     */
    get loc(): Readonly<SourceLocation> | null {
        const loc: SourceLocation | null = this[ARENA].getLocation(this[ARENAID]);

        // a copy of the location: it cannot be modified, assign the property instead
        return loc == null ? null : Object.freeze(loc);
    }

    set loc(loc: SourceLocation | null | undefined) {
        this[ARENA].setLocation(this[ARENAID], loc?.srcId, loc?.sta, loc?.end);
    }

    /**
     * validation state
     */
    get state(): EnumAstNodeStatus {
        return this[ARENA].flags[this[ARENAID]] & EnumAstNodeStatus.StateMask;
    }

    set state(state: EnumAstNodeStatus | null | undefined) {
        this[ARENA].setState(this[ARENAID], state);
    }

    /**
     * validation errors. null when the node has no errors
     */
    get errors(): readonly ErrorDescription[] | null {
        const errors: ErrorDescription[] | undefined = this[ARENA].errors.get(this[ARENAID]);

        // the error list may be shared by the clones of the node: a frozen copy, assign the property instead
        return errors == null ? null : Object.freeze(errors.slice());
    }

    set errors(errors: readonly ErrorDescription[] | null | undefined) {
        this[ARENA].setErrors(this[ARENAID], errors == null ? null : errors.slice());
    }

    /**
     * parent node, or the token that owns the token (see {@link AstArena.getValueParent}). null when the node is
     * detached
     */
    get parent(): AstArenaNode | null {
        const parent: AstNode | Token = this[ARENA].getValueParent(this[ARENAID]);

        return parent == 0 ? null : new AstArenaNode(this[ARENA], parent);
    }

    /**
     * value of a structured token field. undefined when the token has no such field
     * @param key
     */
    private getField(key: string): AstArenaNode | readonly AstArenaNode[] | null | undefined {
        const arena: AstArena = this[ARENA];
        const id: number = this[ARENAID];
        const fields = structuredFields(arena.dataTypes[id]);

        for (let i = 0; i < fields.length; i++) {
            if (fields[i][0] != key) {
                continue;
            }

            const list: number | null = arena.getChildAt(id, fields[i][1]);

            if (list == null) {
                return undefined;
            }

            if (fields[i][2]) {
                return arena.firstToken[list] == 0 ? null : new AstArenaNode(arena, arena.firstToken[list]);
            }

            return listViews(arena, arena.firstToken[list]);
        }

        return undefined;
    }

    /**
     * set the value of a structured token field. false when the token has no such field
     * @param key
     * @param value
     */
    private setField(key: string, value: AstArenaNodeInput | readonly AstArenaNodeInput[] | null | undefined): boolean {
        const arena: AstArena = this[ARENA];
        const id: number = this[ARENAID];
        const fields = structuredFields(arena.dataTypes[id]);

        for (let i = 0; i < fields.length; i++) {
            if (fields[i][0] == key) {
                arena.setTokenList(arena.fieldList(id, fields[i][1] as TokenField), toIds(arena, value));
                return true;
            }
        }

        return false;
    }

    /**
     * deep plain copy of the node, see {@link AstArena.toPlainObject}
     */
    toJSON(): PlainAstNode | PlainToken {
        return this[ARENA].toPlainObject(this[ARENAID]);
    }

    /**
     * node.js `util.inspect()` / `console.log()`: the plain copy of the node
     */
    [Symbol.for("nodejs.util.inspect.custom")](): PlainAstNode | PlainToken {
        return this.toJSON();
    }
}
