import { AstDeclaration, ShorthandMapType } from "../../../@types";
import { PropertySet } from "./set";
export declare class PropertyMap {
    protected config: ShorthandMapType;
    protected declarations: Map<string, AstDeclaration | PropertySet>;
    protected requiredCount: any;
    protected pattern: string[];
    constructor(config: ShorthandMapType);
    add(declaration: AstDeclaration): this;
    [Symbol.iterator](): IterableIterator<AstDeclaration> | {
        next(): IteratorResult<AstDeclaration, any>;
    };
}
