import type { AstDeclaration, ShorthandMapType, Token } from "../../../@types/index.d.ts";
import type { DeclarationMemo } from "./list.ts";
import { PropertySet } from "./set.ts";
import type { AstArena } from "../../ast/arena.ts";
/**
 * map of declarations that can be merged into a single shorthand declaration.
 * declarations are arena node ids
 */
export declare class PropertyMap {
    declarations: Map<string, AstDeclaration | PropertySet | PropertyMap>;
    protected config: ShorthandMapType;
    protected arena: AstArena;
    protected requiredCount: any;
    protected pattern: string[];
    /**
     * longhand property name of the matched tokens
     */
    protected propertyNames: Map<Token, string>;
    /**
     * results shared by the lists of a minification: the default values are parsed once
     */
    protected memo: DeclarationMemo | null;
    /**
     * @param arena
     * @param config
     * @param memo results shared by the lists of a minification
     */
    constructor(arena: AstArena, config: ShorthandMapType, memo?: DeclarationMemo | null);
    /**
     *
     * @param declaration
     */
    add(declaration: AstDeclaration): this;
    [Symbol.iterator](): IterableIterator<AstDeclaration>;
    /**
     * detach a token from its declaration: tokens are cloned when they are still attached to a declaration
     * @param token
     */
    protected take(token: Token): Token;
    private matchTypes;
    private removeDefaults;
}
