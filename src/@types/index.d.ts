import exp from "constants";
import {Token} from "./tokenize";

export * from './validation';
export * from './tokenize';

export type NodeTraversalDirection = 'enter' | 'exit';

export interface ParserOptions {

    strict?: boolean;
    location?: boolean;
}

export interface RenderOptions {

    compress?: boolean;
    indent?: string;
    newLine?: string;
    removeComments?: boolean;
}

export interface Position {

    index: number;
    line: number;
    column: number;
}

export interface Location {

    start: Position;
    end: Position;
    src: string;
}

type NodeType = 'StyleSheet' | 'InvalidComment' | 'Comment' | 'Declaration' | 'InvalidAtRule' | 'AtRule' | 'Rule';

interface Node {

    type: NodeType;
    location?: Location;
}

export interface AstComment extends Node {

    type: 'Comment',
    value: string;
}

export interface AstInvalidComment extends Node {

    type: 'InvalidComment',
    value: string;
}

export interface AstDeclaration extends Node {

    name: Token[],
    value: Token[];
    type: 'Declaration'
}

export interface AstInvalidDeclaration extends Node {

    name: string,
    value: string;
    type: 'InvalidDeclaration'
}

export interface AstInvalidRule extends Node {

    type: 'Rule',
    selector: string,
    body: string
}


export interface AstRule extends Node {

    type: 'Rule',
    selector: Array<Token>,
    children: Array<AstDeclaration | AstComment | AstRuleList>
}

export interface AstAtRule extends Node {

    name: Token[];
    value: Token[];
    children?: Array<AstDeclaration | AstComment> | Array<AstRule | AstComment>
}

export interface AstInvalidAtRule extends Node {

    type: 'InvalidAtRule';
    name?: string,
    value?: string;
    body?: string;
    children?: Array<AstDeclaration | AstComment> | Array<AstRule | AstComment>
}

export interface AstRuleList extends Node {

    children: Array<Node | AstComment>
}

export interface AstRuleStyleSheet extends AstRuleList {
    type: 'StyleSheet',

    children: Array<AstRuleList | AstComment>
}

export type AstNode = AstRuleStyleSheet  | AstRuleList | AstComment | AstInvalidComment | AstInvalidAtRule | AstAtRule | AstRule | AstDeclaration | AstInvalidDeclaration;

export type AstTraverserHandler = (node: AstNode, direction: 'enter' | 'exit') => void;

export type ParsedBlock = {
    type: 'Rule' | 'AtRule',
    selector: string[],
    body: string[];
    block: string[];
} | {

    type: 'AtRule' | 'Declaration',
    name: string;
    value: string;
    body: string[];
    block: string[];
}