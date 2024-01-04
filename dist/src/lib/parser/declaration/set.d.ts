import { AstDeclaration, ShorthandPropertyType } from "../../../@types";
export declare class PropertySet {
    protected config: ShorthandPropertyType;
    protected declarations: Map<string, AstDeclaration>;
    constructor(config: ShorthandPropertyType);
    add(declaration: AstDeclaration): this;
    isShortHand(): boolean;
    [Symbol.iterator](): IterableIterator<AstDeclaration>;
}
