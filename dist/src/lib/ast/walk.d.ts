import { AstNode, Token, WalkAttributesResult, WalkResult, WalkerFilter } from "../../@types";
export declare function walk(node: AstNode, filter?: WalkerFilter): Generator<WalkResult>;
export declare function walkValues(values: Token[]): Generator<WalkAttributesResult>;
