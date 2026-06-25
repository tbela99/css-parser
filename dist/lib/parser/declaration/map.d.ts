import type { AstDeclaration, ShorthandMapType } from "../../../@types/index.d.ts";
import { PropertySet } from "./set.ts";
export declare class PropertyMap {
    protected config: ShorthandMapType;
    protected declarations: Map<string, AstDeclaration | PropertySet>;
    protected requiredCount: any;
    protected pattern: string[];
    constructor(config: ShorthandMapType);
    add(declaration: AstDeclaration): this;
    [Symbol.iterator](): ArrayIterator<AstDeclaration> | {
        next(): IteratorResult<AstDeclaration>;
    };
    private matchTypes;
    private removeDefaults;
}
