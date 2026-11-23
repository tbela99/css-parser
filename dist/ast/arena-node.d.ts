/**
 * Object view of the arena nodes and tokens: {@link AstArenaNode}
 *
 * @module
 */
import type { ErrorDescription, PlainAstNode, PlainToken, SourceLocation } from "../@types/index.d.ts";
import { ColorType, EnumAstNodeStatus, EnumToken } from "./types.ts";
import type { AstArena } from "./arena.ts";
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
export declare const ARENAID: unique symbol;
/**
 * keyed symbol (`Symbol.for()`) of the arena of an {@link AstArenaNode}
 */
export declare const ARENA: unique symbol;
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
export declare function isNodeObjectType(typ: EnumToken): boolean;
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
export declare class AstArenaNode {
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
    constructor(arena: AstArena, id: number);
    /**
     * node or token type
     */
    get typ(): EnumToken;
    set typ(typ: EnumToken);
    /**
     * at-rule / declaration name, token name. undefined for the other nodes
     */
    get nam(): string | undefined;
    /**
     *
     * @param nam
     */
    set nam(nam: string);
    /**
     * rule selector. undefined for the other nodes
     */
    get sel(): string | undefined;
    /**
     *
     * @param sel
     */
    set sel(sel: string);
    /**
     * value:
     * - at-rule prelude, comment: string,
     * - declaration: value tokens,
     * - number, dimension, percentage: number (or the fraction token),
     * - identifier, string, function name, ...: string,
     * - unary expression: the operand,
     * - structured tokens with a value field: the field tokens
     */
    get val(): string | number | AstArenaNode | readonly AstArenaNode[] | null | undefined;
    /**
     *
     * @param val
     */
    set val(val: string | number | AstArenaNodeInput | readonly AstArenaNodeInput[] | null | undefined);
    /**
     * children: the child nodes of a stylesheet, a rule or an at-rule with a block, the tokens of a function token
     * (arguments), a parentheses token, ... undefined when the node has no children
     */
    get chi(): readonly AstArenaNode[] | undefined;
    /**
     *
     * @param chi
     */
    set chi(chi: readonly AstArenaNodeInput[] | null | undefined);
    /**
     * prelude tokens of an at-rule, selector tokens of a rule. null when the node has no prelude tokens
     */
    get tokens(): readonly AstArenaNode[] | null;
    /**
     *
     * @param tokens
     */
    set tokens(tokens: readonly AstArenaNodeInput[] | null | undefined);
    /**
     * unit of a dimension, calendar (`cal`) of a color, attribute (`attr`) of a match expression
     */
    get unit(): string | undefined;
    /**
     *
     * @param unit
     */
    set unit(unit: string | null | undefined);
    /**
     * color space of a color
     */
    get cal(): string | undefined;
    set cal(cal: string | null | undefined);
    /**
     * attribute of a match expression
     */
    get attr(): string | undefined;
    set attr(attr: string | null | undefined);
    /**
     * color type of a color token
     */
    get kin(): ColorType | undefined;
    set kin(kin: ColorType | null | undefined);
    /**
     * sign of a unary expression
     */
    get sign(): EnumToken | undefined;
    /**
     *
     * @param sign
     */
    set sign(sign: EnumToken);
    /**
     * operator: the operator of a binary expression, the operator tokens of a structured token
     */
    get op(): EnumToken | AstArenaNode | readonly AstArenaNode[] | null | undefined;
    /**
     *
     * @param op
     */
    set op(op: EnumToken | AstArenaNodeInput | readonly AstArenaNodeInput[] | null);
    /**
     * first operator of a media range query
     */
    get op1(): AstArenaNode | readonly AstArenaNode[] | null | undefined;
    /**
     *
     * @param op
     */
    set op1(op: AstArenaNodeInput | readonly AstArenaNodeInput[] | null);
    /**
     * second operator of a media range query
     */
    get op2(): AstArenaNode | readonly AstArenaNode[] | null | undefined;
    /**
     *
     * @param op
     */
    set op2(op: AstArenaNodeInput | readonly AstArenaNodeInput[] | null);
    /**
     * left hand side of a structured token, numerator of a fraction
     */
    get l(): AstArenaNode | readonly AstArenaNode[] | null | undefined;
    /**
     *
     * @param l
     */
    set l(l: AstArenaNodeInput | readonly AstArenaNodeInput[] | null);
    /**
     * right hand side of a structured token, denominator of a fraction
     */
    get r(): AstArenaNode | readonly AstArenaNode[] | null | undefined;
    /**
     *
     * @param r
     */
    set r(r: AstArenaNodeInput | readonly AstArenaNodeInput[] | null);
    /**
     * source location. null when the node has no location
     */
    get loc(): Readonly<SourceLocation> | null;
    /**
     *
     * @param loc
     */
    set loc(loc: SourceLocation | null | undefined);
    /**
     * validation state
     */
    get state(): EnumAstNodeStatus;
    /**
     *
     * @param state
     */
    set state(state: EnumAstNodeStatus | null | undefined);
    /**
     * validation errors. null when the node has no errors
     */
    get errors(): readonly ErrorDescription[] | null;
    /**
     *
     * @param errors
     */
    set errors(errors: readonly ErrorDescription[] | null | undefined);
    /**
     * parent node, or the token that owns the token (see {@link AstArena.getValueParent}). null when the node is
     * detached
     */
    get parent(): AstArenaNode | null;
    /**
     * value of a structured token field. undefined when the token has no such field
     * @param key
     */
    private getField;
    /**
     * set the value of a structured token field. false when the token has no such field
     * @param key
     * @param value
     */
    private setField;
    /**
     * deep plain copy of the node, see {@link AstArena.toPlainObject}
     */
    toJSON(): PlainAstNode | PlainToken;
}
