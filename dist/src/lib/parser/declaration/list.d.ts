import { AstNode, PropertyListOptions, Token } from "../../../@types";
import { PropertySet } from "./set";
import { PropertyMap } from "./map";
export declare class PropertyList {
    protected options: PropertyListOptions;
    protected declarations: Map<string, AstNode | PropertySet | PropertyMap>;
    constructor(options?: PropertyListOptions);
    set(nam: string, value: string | Token[]): this;
    add(declaration: AstNode): this;
    [Symbol.iterator](): {
        next(): {
            value: AstNode;
            done: boolean;
        };
    };
}
