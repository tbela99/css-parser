import type { AstNode, PropertyListOptions, Token } from "../../../@types/index.d.ts";
import { PropertySet } from "./set.ts";
import { PropertyMap } from "./map.ts";
export declare class PropertyList {
    protected options: PropertyListOptions;
    protected declarations: Map<string, AstNode | PropertySet | PropertyMap>;
    constructor(options?: PropertyListOptions);
    set(nam: string, value: string | Token[]): this;
    add(...declarations: AstNode[]): this;
    [Symbol.iterator](): {
        next(): {
            value: AstNode;
            done: boolean;
        };
    };
}
