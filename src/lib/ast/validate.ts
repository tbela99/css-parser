import {NodeType} from "./types";
import {AstNode} from "../../@types";

export function validateNode(node: AstNode, expected?: NodeType): boolean {

    if (expected != null && node.typ != expected) {

        return false;
    }

    else if (!(node.typ in NodeType)) {

        return false;
    }

    // @ts-ignore
    // return validateNodeImpl(node);

    return true
}