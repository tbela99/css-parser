import type {AstAtRule, AstDeclaration, AstKeyframesAtRule, AstKeyframesRule, AstRule} from "./ast.d.ts";

export declare type VisitorEventType = 'Enter' | 'Leave' ;
export declare type GenericVisitorResult<T> = T | T[] | Promise<T> | Promise<T[]> | null | Promise<null>;
export declare type GenericVisitorHandler<T> = ((node: T, parent?: AstNode | Token, root?: AstNode | Token) => GenericVisitorResult<T>);
export declare type GenericVisitorAstNodeHandlerMap<T> =
    Record<string, GenericVisitorHandler<T>>
    | GenericVisitorHandler<T>
    | { type: VisitorEventType, handler: Record<string, GenericVisitorHandler<T>> | GenericVisitorHandler<T> };

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
     * import {transform, AstAtRule, ParserOptions} from "@tbela99/css-parser";
     *
     * const options: ParserOptions = {
     *
     *     visitor: {
     *
     *         AtRule: {
     *
     *             media: (node: AstAtRule): AstAtRule => {
     *
     *                 node.val = 'tv,screen';
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
     * import {transform, parseDeclarations} from "@tbela99/css-parser";
     *
     * const options: ParserOptions = {
     *
     *     removeEmpty: false,
     *     visitor: {
     *
     *         Declaration: {
     *
     *             // called only for height declaration
     *             height: (node: AstDeclaration): AstDeclaration[] => {
     *
     *
     *                 return [
     *                     node,
     *                     {
     *
     *                         typ: EnumToken.DeclarationNodeType,
     *                         nam: 'width',
     *                         val: [
     *                             <LengthToken>{
     *                                 typ: EnumToken.LengthTokenType,
     *                                 val: 3,
     *                                 unit: 'px'
     *                             }
     *                         ]
     *                     }
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
     * import {AstDeclaration, ParserOptions, transform} from "../src/node.ts";
     *
     * const options: ParserOptions = {
     *
     *     visitor: {
     *
     *         // called for every declaration
     *         Declaration: (node: AstDeclaration): null => {
     *
     *
     *             if (node.nam == 'height') {
     *
     *                 node.nam = 'width';
     *             }
     *
     *             else if (node.nam == 'margin') {
     *
     *                 node.nam = 'padding'
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
     * import {transform, parseDeclarations} from "@tbela99/css-parser";
     *
     * const options: ParserOptions = {
     *
     *     removeEmpty: false,
     *     visitor: {
     *
     *         Rule: async (node: AstRule): Promise<AstRule | null> => {
     *
     *             if (node.sel == '.foo') {
     *
     *                 node.chi.push(...await parseDeclarations('width: 3px'));
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

    KeyframesRule?: GenericVisitorAstNodeHandlerMap<AstKeyframesRule>;

    KeyframesAtRule?: GenericVisitorAstNodeHandlerMap<AstKeyframesAtRule>;

    /**
     * value visitor
     */
    Value?: GenericVisitorHandler<Token> | Record<keyof EnumToken, GenericVisitorHandler<Token>> | {
        type: VisitorEventType,
        handler: GenericVisitorHandler<Token> | Record<keyof EnumToken, GenericVisitorHandler<Token>>
    };

    /**
     * generic token visitor. the key name is of type keyof EnumToken.
     * generic tokens are called for every token of the specified type.
     *
     * ```ts
     *
     * import {transform, parseDeclarations} from "@tbela99/css-parser";
     *
     * const options: ParserOptions = {
     *
     *     inlineCssVariables: true,
     *     visitor: {
     *
     *         // Stylesheet node visitor
     *         StyleSheetNodeType: async (node) => {
     *
     *             // insert a new rule
     *             node.chi.unshift(await parse('html {--base-color: pink}').then(result => result.ast.chi[0]))
     *         },
     *         ColorTokenType:  (node) => {
     *
     *             // dump all color tokens
     *             // console.debug(node);
     *          },
     *          FunctionTokenType:  (node) => {
     *
     *              // dump all function tokens
     *              // console.debug(node);
     *          },
     *          DeclarationNodeType:  (node) => {
     *
     *              // dump all declaration nodes
     *              // console.debug(node);
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
    [key: keyof EnumToken]: GenericVisitorHandler<Token> | {
        type: VisitorEventType,
        handler: GenericVisitorHandler<Token>
    };
}
