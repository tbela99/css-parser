import type { AstDeclaration, ShorthandPropertyType } from "../../../@types/index.d.ts";
import type { AstArena } from "../../ast/arena.ts";
/**
 * set of declarations that can be merged into a single shorthand declaration.
 * declarations are arena node ids
 */
export declare class PropertySet {
    protected config: ShorthandPropertyType;
    protected arena: AstArena;
    declarations: Map<string, AstDeclaration>;
    constructor(arena: AstArena, config: ShorthandPropertyType);
    add(declaration: AstDeclaration): this;
    isShortHand(): boolean;
    [Symbol.iterator](): IterableIterator<AstDeclaration>;
}
