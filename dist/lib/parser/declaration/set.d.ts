import type { AstDeclaration, ShorthandPropertyType } from "../../../@types/index.d.ts";
export declare class PropertySet {
    protected config: ShorthandPropertyType;
    protected declarations: Map<string, AstDeclaration>;
    constructor(config: ShorthandPropertyType);
    add(declaration: AstDeclaration): this;
    isShortHand(): boolean;
    [Symbol.iterator](): IterableIterator<AstDeclaration>;
}
