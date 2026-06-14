import { EnumToken } from "../ast/types";


export class AstNode {

    constructor(public typ: EnumToken, public value: string, public children?: AstNode[]) {
    }
}