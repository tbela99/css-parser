import { EnumToken } from "../ast/types";
export declare class AstNode {
    typ: EnumToken;
    value: string;
    children?: AstNode[] | undefined;
    constructor(typ: EnumToken, value: string, children?: AstNode[] | undefined);
}
