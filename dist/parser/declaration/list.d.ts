import type { AstDeclaration, AstNode, PropertyListOptions, SinglePropertyTypeMapping, Token } from "../../../@types/index.d.ts";
import { PropertySet } from "./set.ts";
import { PropertyMap } from "./map.ts";
import type { ValidationToken } from "../../validation/parser/types.d.ts";
import type { AstArena } from "../../ast/arena.ts";
/**
 * Results shared by the property lists of a minification, valid for the arena they were computed for:
 * - the keys of the declarations that are not merged by name (invalid declarations, custom properties, comments, ...):
 *   identical declarations have the same key
 * - the tokens of the default values of the shorthand properties: each value is parsed once, the tokens are cloned
 *
 * @internal
 */
export declare class DeclarationMemo {
    /**
     * An instance is kept alive: the hidden class of the instances would otherwise be collected by a full garbage
     * collection when no instance is alive, and the optimized code that depends on it discarded (deoptimized)
     */
    static readonly shape: DeclarationMemo;
    /**
     * key by structure. same equality as the structural signature: 0 and -0 are equal
     */
    private readonly keys;
    /**
     * parsed values: detached tokens that are cloned, never attached to the tree
     */
    private readonly parsed;
    /**
     * tokens of a value, see {@link parseString}. the value is parsed once, the tokens are cloned
     * @param arena
     * @param value
     */
    parse(arena: AstArena, value: string): Token[];
    /**
     * unique key of the structure of a node (type, name, values, tokens and children). identical nodes have the same key
     * @param arena
     * @param node
     */
    key(arena: AstArena, node: AstNode): string;
}
/**
 * Represents a list of property declarations, compute shorthand and remove duplicate declarations.
 */
export declare class PropertyList {
    /**
     * options
     */
    protected options: PropertyListOptions;
    /**
     * declarations
     */
    protected declarations: Map<string, AstNode | PropertySet | PropertyMap>;
    /**
     * arena the declarations are stored in
     */
    protected arena: AstArena;
    /**
     * keys shared by the lists that use the same arena
     */
    protected memo: DeclarationMemo;
    /**
     * syntaxes of the descriptors of the at-rule that contains the declarations: `result` in `@function`. the
     * declarations that are not validated are validated with them
     */
    protected descriptors: Record<string, ValidationToken[]> | null;
    /**
     *
     * @param arena
     * @param options
     * @param memo keys shared by the lists that use the same arena
     * @param descriptors syntaxes of the descriptors of the at-rule that contains the declarations
     */
    constructor(arena: AstArena, options?: PropertyListOptions, memo?: DeclarationMemo | null, descriptors?: Record<string, ValidationToken[]> | null);
    /**
     * add a declaration
     * @param declaration node id
     */
    addDeclaration(declaration: AstNode): this;
    /**
     *
     * @param declaration
     * @param mapping
     */
    mapValues(declaration: AstDeclaration, mapping: SinglePropertyTypeMapping): void;
    /**
     *
     * @returns
     */
    [Symbol.iterator](): IterableIterator<AstNode>;
}
