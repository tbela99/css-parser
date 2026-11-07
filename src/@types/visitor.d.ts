import type { PlainToken, Token } from "./token.d.ts";
import type { AstArena } from "../lib/ast/arena.ts";
import type { AstArenaNode } from "../lib/ast/arena-node.ts";
import type {
    AstAtRule,
    AstDeclaration,
    AstKeyframesAtRule,
    AstKeyframesRule,
    AstNode,
    AstRule,
    PlainAstNode,
} from "./ast.d.ts";
import { WalkerEvent } from "../lib/ast/types.ts";
import { EnumToken } from "../lib/ast/types.ts";

/**
 * Generic visitor result: a node id, an object or an array of node ids and objects. the object views of the arena
 * (`arena.toObject()`) are not copied, the other objects are imported into the arena with `arena.fromObject()`.
 * null (or nothing) keeps the node
 */
export declare type GenericVisitorSyncResult<T> =
    | T
    | T[]
    | AstArenaNode
    | PlainAstNode
    | PlainToken
    | Array<T | AstArenaNode | PlainAstNode | PlainToken>
    | null
    | void;
/**
 * Generic visitor result
 */
export declare type GenericVisitorAsyncResult<T> = Promise<GenericVisitorSyncResult<T>>;
/**
 * Generic visitor result
 */
export declare type GenericVisitorResult<T> = GenericVisitorSyncResult<T> | GenericVisitorAsyncResult<T>;

/**
 * Generic visitor handler. it is called with the arena and the node id. the other properties of the node are read
 * from the arena: `arena.getParent(node)`, `arena.toObject(node)`, ...
 */
export declare type GenericVisitorSyncHandler<T> = (arena: AstArena, node: T) => GenericVisitorSyncResult<T>;

/**
 * Generic visitor handler
 */
export declare type GenericVisitorAstNodeSyncHandlerMap<T> =
    | Record<string, GenericVisitorSyncHandler<T>>
    | GenericVisitorSyncHandler<T>
    | Function<T>
    | { type: WalkerEvent; handler: GenericVisitorSyncHandler<T> }
    | { type: WalkerEvent; handler: Record<string, GenericVisitorSyncHandler<T>> };

/**
 * Generic visitor handler
 */
export declare type ValueVisitorSyncHandler = GenericVisitorSyncHandler<Token>;

/**
 * Declaration visitor handler
 */
export declare type DeclarationVisitorHandler = GenericVisitorHandler<AstDeclaration>;
/**
 * Rule visitor handler
 */
export declare type RuleVisitorHandler = GenericVisitorHandler<AstRule>;

/**
 * AtRule visitor handler
 */
export declare type AtRuleVisitorHandler = GenericVisitorHandler<AstAtRule>;

/**
 * node visitor callback map
 *
 */
export declare interface VisitorSyncNodeMap {
    /**
     * at rule visitor
     *
     * Example: change media at-rule prelude
     *
     * ```ts
     *
     * import {transform, AstArena, AstAtRule, ParserOptions} from "@tbela99/css-parser";
     *
     * const options: ParserOptions = {
     *
     *     visitor: {
     *
     *         AtRule: {
     *
     *             media: (arena: AstArena, node: AstAtRule): AstAtRule => {
     *
     *                 arena.setValueString(node, 'tv,screen');
     *                 return node
     *             }
     *         }
     *     }
     * };
     *
     * const css = `
     *
     * @media screen {
     *
     *     .foo {
     *
     *             height: calc(100px * 2/ 15);
     *     }
     * }
     * `;
     *
     * const result = await transform(css, options);
     *
     * console.debug(result.code);
     *
     * // @media tv,screen{.foo{height:calc(40px/3)}}
     * ```
     */
    AtRule?: GenericVisitorAstNodeSyncHandlerMap<AstAtRule>;
    /**
     * declaration visitor
     *
     *  Example: add 'width: 3px' everytime a declaration with the name 'height' is found
     *
     * ```ts
     *
     * import {transform, AstArena, AstDeclaration, EnumToken, LengthToken, ParserOptions} from "@tbela99/css-parser";
     *
     * const options: ParserOptions = {
     *
     *     removeEmpty: false,
     *     visitor: {
     *
     *         Declaration: {
     *
     *             // called only for height declaration
     *             height: (arena: AstArena, node: AstDeclaration): AstDeclaration[] => {
     *
     *
     *                 return [
     *                     node,
     *                     // new nodes are allocated in the arena
     *                     arena.createDeclaration(EnumToken.DeclarationNodeType, 'width', [
     *                         <LengthToken>{
     *                             typ: EnumToken.LengthTokenType,
     *                             val: 3,
     *                             unit: 'px'
     *                         }
     *                     ], null, null)
     *                 ];
     *             }
     *            }
     *         }
     * };
     *
     * const css = `
     *
     * .foo {
     *     height: calc(100px * 2/ 15);
     * }
     * .selector {
     * color: lch(from peru calc(l * 0.8) calc(c * 0.7) calc(h + 180))
     * }
     * `;
     *
     * console.debug(await transform(css, options));
     *
     * // .foo{height:calc(40px/3);width:3px}.selector{color:#0880b0}
     * ```
     *
     * Example: rename 'margin' to 'padding' and 'height' to 'width'
     *
     * ```ts
     * import {AstArena, AstDeclaration, ParserOptions, transform} from "@tbela99/css-parser";
     *
     * const options: ParserOptions = {
     *
     *     visitor: {
     *
     *         // called for every declaration
     *         Declaration: (arena: AstArena, id: AstDeclaration): null => {
     *
     *             // object view of the declaration: the properties read and write the arena
     *             const node = arena.toObject(id);
     *
     *             if (node.nam == 'height') {
     *
     *                 node.nam = 'width';
     *             }
     *
     *             else if (node.nam == 'margin') {
     *
     *                 node.nam = 'padding';
     *             }
     *
     *             return null;
     *         }
     *     }
     * };
     *
     * const css = `
     *
     * .foo {
     *     height: calc(100px * 2/ 15);
     *     margin: 10px;
     * }
     * .selector {
     *
     * margin: 20px;}
     * `;
     *
     * const result = await transform(css, options);
     *
     * console.debug(result.code);
     *
     * // .foo{width:calc(40px/3);padding:10px}.selector{padding:20px}
     * ```
     */
    Declaration?: GenericVisitorAstNodeSyncHandlerMap<AstDeclaration>;

    /**
     * rule visitor
     *
     *  Example: add 'width: 3px' to every rule with the selector '.foo'
     *
     * ```ts
     *
     * import {transform, parseDeclarations, AstArena, AstRule, ParserOptions} from "@tbela99/css-parser";
     *
     * const options: ParserOptions = {
     *
     *     removeEmpty: false,
     *     visitor: {
     *
     *         Rule: (arena: AstArena, node: AstRule): AstRule | null => {
     *
     *             if (arena.getSelector(node) == '.foo') {
     *
     *                 // the declarations are parsed in the same arena
     *                 arena.appendChildren(node, ...parseDeclarations('width: 3px', arena).nodes);
     *                 return node;
     *             }
     *
     *             return null;
     *         }
     *     }
     * };
     *
     * const css = `
     *
     * .foo {
     *     .foo {
     *     }
     * }
     * `;
     *
     * console.debug(await transform(css, options));
     *
     * // .foo{width:3px;.foo{width:3px}}
     * ```
     */
    Rule?: GenericVisitorAstNodeSyncHandlerMap<AstRule>;

    /**
     * keyframes rule visitor
     */
    KeyframesRule?: GenericVisitorAstNodeSyncHandlerMap<AstKeyframesRule>;

    /**
     * keyframes at-rule visitor
     */
    KeyframesAtRule?: GenericVisitorAstNodeSyncHandlerMap<AstKeyframesAtRule>;

    /**
     * value visitor
     */
    Value?: GenericVisitorAstNodeSyncHandlerMap<Token>;

    /**
     * generic token visitor. the key name is of type keyof EnumToken.
     * generic tokens are called for every token of the specified type.
     *
     * ```ts
     *
     * import {transform, parse, parseDeclarations} from "@tbela99/css-parser";
     *
     * const options: ParserOptions = {
     *
     *     inlineCssVariables: true,
     *     visitor: {
     *
     *         // Stylesheet node visitor
     *         StyleSheetNodeType: async (arena, node) => {
     *
     *             // insert a new rule. nodes of another arena are imported
     *             const result = await parse('html {--base-color: pink}');
     *             arena.prependChildren(node, arena.import(result.arena, result.arena.getFirstChild(result.ast)));
     *         },
     *         ColorTokenType:  (arena, node) => {
     *
     *             // dump all color tokens
     *             // console.debug(arena.toObject(node));
     *          },
     *          FunctionTokenType:  (arena, node) => {
     *
     *              // dump all function tokens
     *              // console.debug(arena.toObject(node));
     *          },
     *          DeclarationNodeType:  (arena, node) => {
     *
     *              // dump all declaration nodes
     *              // console.debug(arena.toObject(node));
     *          }
     *     }
     * };
     *
     * const css = `
     *
     * body { color:    color(from var(--base-color) display-p3 r calc(g + 0.24) calc(b + 0.15)); }
     * `;
     *
     * console.debug(await transform(css, options));
     *
     * // body {color:#f3fff0}
     * ```
     */
    [key: keyof typeof EnumToken]:
        | GenericVisitorAstNodeSyncHandlerMap<Token>
        | GenericVisitorAstNodeSyncHandlerMap<AstNode>;
}

/**
 * Generic visitor handler
 */
export declare type GenericVisitorHandler<T> = (
    arena: AstArena,
    node: T,
) => GenericVisitorSyncResult<T> | GenericVisitorAsyncResult<T>;

/**
 * Generic visitor handler
 */
export declare type GenericVisitorAstNodeHandlerMap<T> =
    | Record<string, GenericVisitorHandler<T>>
    | GenericVisitorHandler<T>
    | { type: WalkerEvent; handler: GenericVisitorHandler<T> }
    | { type: WalkerEvent; handler: Record<string, GenericVisitorHandler<T>> };

/**
 * Generic visitor handler
 */
export declare type ValueVisitorHandler = GenericVisitorHandler<Token>;

/**
 * Declaration visitor handler
 */
export declare type DeclarationVisitorHandler = GenericVisitorHandler<AstDeclaration>;
/**
 * Rule visitor handler
 */
export declare type RuleVisitorHandler = GenericVisitorHandler<AstRule>;

/**
 * AtRule visitor handler
 */
export declare type AtRuleVisitorHandler = GenericVisitorHandler<AstAtRule>;

/**
 * node visitor callback map
 *
 */
export declare interface VisitorNodeMap {
    /**
     * at rule visitor
     *
     * Example: change media at-rule prelude
     *
     * ```ts
     *
     * import {transform, AstArena, AstAtRule, ParserOptions} from "@tbela99/css-parser";
     *
     * const options: ParserOptions = {
     *
     *     visitor: {
     *
     *         AtRule: {
     *
     *             media: (arena: AstArena, node: AstAtRule): AstAtRule => {
     *
     *                 arena.setValueString(node, 'tv,screen');
     *                 return node
     *             }
     *         }
     *     }
     * };
     *
     * const css = `
     *
     * @media screen {
     *
     *     .foo {
     *
     *             height: calc(100px * 2/ 15);
     *     }
     * }
     * `;
     *
     * const result = await transform(css, options);
     *
     * console.debug(result.code);
     *
     * // @media tv,screen{.foo{height:calc(40px/3)}}
     * ```
     */
    AtRule?: GenericVisitorAstNodeHandlerMap<AstAtRule>;
    /**
     * declaration visitor
     *
     *  Example: add 'width: 3px' everytime a declaration with the name 'height' is found
     *
     * ```ts
     *
     * import {transform, AstArena, AstDeclaration, EnumToken, LengthToken, ParserOptions} from "@tbela99/css-parser";
     *
     * const options: ParserOptions = {
     *
     *     removeEmpty: false,
     *     visitor: {
     *
     *         Declaration: {
     *
     *             // called only for height declaration
     *             height: (arena: AstArena, node: AstDeclaration): AstDeclaration[] => {
     *
     *
     *                 return [
     *                     node,
     *                     // new nodes are allocated in the arena
     *                     arena.createDeclaration(EnumToken.DeclarationNodeType, 'width', [
     *                         <LengthToken>{
     *                             typ: EnumToken.LengthTokenType,
     *                             val: 3,
     *                             unit: 'px'
     *                         }
     *                     ], null, null)
     *                 ];
     *             }
     *            }
     *         }
     * };
     *
     * const css = `
     *
     * .foo {
     *     height: calc(100px * 2/ 15);
     * }
     * .selector {
     * color: lch(from peru calc(l * 0.8) calc(c * 0.7) calc(h + 180))
     * }
     * `;
     *
     * console.debug(await transform(css, options));
     *
     * // .foo{height:calc(40px/3);width:3px}.selector{color:#0880b0}
     * ```
     *
     * Example: rename 'margin' to 'padding' and 'height' to 'width'
     *
     * ```ts
     * import {AstArena, AstDeclaration, ParserOptions, transform} from "@tbela99/css-parser";
     *
     * const options: ParserOptions = {
     *
     *     visitor: {
     *
     *         // called for every declaration
     *         Declaration: (arena: AstArena, id: AstDeclaration): null => {
     *
     *             // object view of the declaration: the properties read and write the arena
     *             const node = arena.toObject(id);
     *
     *             if (node.nam == 'height') {
     *
     *                 node.nam = 'width';
     *             }
     *
     *             else if (node.nam == 'margin') {
     *
     *                 node.nam = 'padding';
     *             }
     *
     *             return null;
     *         }
     *     }
     * };
     *
     * const css = `
     *
     * .foo {
     *     height: calc(100px * 2/ 15);
     *     margin: 10px;
     * }
     * .selector {
     *
     * margin: 20px;}
     * `;
     *
     * const result = await transform(css, options);
     *
     * console.debug(result.code);
     *
     * // .foo{width:calc(40px/3);padding:10px}.selector{padding:20px}
     * ```
     */
    Declaration?: GenericVisitorAstNodeHandlerMap<AstDeclaration>;

    /**
     * rule visitor
     *
     *  Example: add 'width: 3px' to every rule with the selector '.foo'
     *
     * ```ts
     *
     * import {transform, parseDeclarations, AstArena, AstRule, ParserOptions} from "@tbela99/css-parser";
     *
     * const options: ParserOptions = {
     *
     *     removeEmpty: false,
     *     visitor: {
     *
     *         Rule: (arena: AstArena, node: AstRule): AstRule | null => {
     *
     *             if (arena.getSelector(node) == '.foo') {
     *
     *                 // the declarations are parsed in the same arena
     *                 arena.appendChildren(node, ...parseDeclarations('width: 3px', arena).nodes);
     *                 return node;
     *             }
     *
     *             return null;
     *         }
     *     }
     * };
     *
     * const css = `
     *
     * .foo {
     *     .foo {
     *     }
     * }
     * `;
     *
     * console.debug(await transform(css, options));
     *
     * // .foo{width:3px;.foo{width:3px}}
     * ```
     */
    Rule?: GenericVisitorAstNodeHandlerMap<AstRule>;

    /**
     * keyframes rule visitor
     */
    KeyframesRule?: GenericVisitorAstNodeHandlerMap<AstKeyframesRule>;

    /**
     * keyframes at-rule visitor
     */
    KeyframesAtRule?: GenericVisitorAstNodeHandlerMap<AstKeyframesAtRule>;

    /**
     * value visitor
     */
    Value?: GenericVisitorAstNodeHandlerMap<Token>;

    /**
     * generic token visitor. the key name is of type keyof EnumToken.
     * generic tokens are called for every token of the specified type.
     *
     * ```ts
     *
     * import {transform, parse, parseDeclarations} from "@tbela99/css-parser";
     *
     * const options: ParserOptions = {
     *
     *     inlineCssVariables: true,
     *     visitor: {
     *
     *         // Stylesheet node visitor
     *         StyleSheetNodeType: async (arena, node) => {
     *
     *             // insert a new rule. nodes of another arena are imported
     *             const result = await parse('html {--base-color: pink}');
     *             arena.prependChildren(node, arena.import(result.arena, result.arena.getFirstChild(result.ast)));
     *         },
     *         ColorTokenType:  (arena, node) => {
     *
     *             // dump all color tokens
     *             // console.debug(arena.toObject(node));
     *          },
     *          FunctionTokenType:  (arena, node) => {
     *
     *              // dump all function tokens
     *              // console.debug(arena.toObject(node));
     *          },
     *          DeclarationNodeType:  (arena, node) => {
     *
     *              // dump all declaration nodes
     *              // console.debug(arena.toObject(node));
     *          }
     *     }
     * };
     *
     * const css = `
     *
     * body { color:    color(from var(--base-color) display-p3 r calc(g + 0.24) calc(b + 0.15)); }
     * `;
     *
     * console.debug(await transform(css, options));
     *
     * // body {color:#f3fff0}
     * ```
     */
    [key: keyof typeof EnumToken]: GenericVisitorAstNodeHandlerMap<Token> | GenericVisitorAstNodeHandlerMap<AstNode>;
}

/**
 * Parsed visitor handlers
 */
export interface ParsedVisitorHandlers {
    /**
     * include tokens
     */
    includeTokens: boolean;
    /**
     * all handlers
     */
    allHandlers: Array<GenericVisitorAstNodeHandlerMap | Record<string, GenericVisitorAstNodeHandlerMap>>;
    /**
     * all visitors
     */
    allVisitorsHandlers?: Set<GenericVisitorHandler<Token>> | Set<GenericVisitorHandler<AstNode>>;
    /**
     * pre all visitors
     */
    preAllVisitorsHandlers?: Set<GenericVisitorHandler<Token>> | Set<GenericVisitorHandler<AstNode>>;
    /**
     * post all visitors
     */
    postAllVisitorsHandlers?: Set<GenericVisitorHandler<Token>> | Set<GenericVisitorHandler<AstNode>>;
}
