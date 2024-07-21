import {EnumToken} from "./types";
import type {AstNode} from "../../@types/index.d.ts";

export function validateNode(node: AstNode, expected?: EnumToken): boolean {

    if (expected != null && node.typ != expected) {

        return false;
    }

    else if (!(node.typ in EnumToken)) {

        return false;
    }

    // @ts-ignore
    // return validateNodeImpl(node);

    return true
}