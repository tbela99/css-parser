import exp from "constants";
import {Token} from "./tokenize";

export * from './validation';
export * from './tokenize';
export * from './stringiterator';

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

    ind: number;
    lin: number;
    col: number;
}

export interface Location {

    sta: Position;
    end: Position;
    src: string;
}

type NodeType = 'StyleSheet' | 'InvalidComment' | 'Comment' | 'Declaration' | 'InvalidAtRule' | 'AtRule' | 'Rule';

interface Node {

    typ: NodeType;
    loc?: Location;
}

export interface AstComment extends Node {

    typ: 'Comment',
    val: string;
}

export interface AstInvalidComment extends Node {

    typ: 'InvalidComment',
    val: string;
}

export interface AstDeclaration extends Node {

    nam: Token[],
    val: Token[];
    typ: 'Declaration'
}

export interface AstInvalidDeclaration extends Node {

    nam: string,
    val: string;
    typ: 'InvalidDeclaration'
}

export interface AstInvalidRule extends Node {

    typ: 'Rule',
    sel: string,
    bod: string
}


export interface AstRule extends Node {

    typ: 'Rule',
    sel: Array<Token>,
    chi: Array<AstDeclaration | AstComment | AstRuleList>
}

export interface AstAtRule extends Node {

    nam: Token[];
    val: Token[];
    chi?: Array<AstDeclaration | AstComment> | Array<AstRule | AstComment>
}

export interface AstInvalidAtRule extends Node {

    typ: 'InvalidAtRule';
    nam?: string,
    val?: string;
    bod?: string;
    chi?: Array<AstDeclaration | AstComment> | Array<AstRule | AstComment>
}

export interface AstRuleList extends Node {

    chi: Array<Node | AstComment>
}

export interface AstRuleStyleSheet extends AstRuleList {
    typ: 'StyleSheet',
    chi: Array<AstRuleList | AstComment>
}

export type AstNode = AstRuleStyleSheet  | AstRuleList | AstComment | AstInvalidComment | AstInvalidAtRule | AstAtRule | AstRule | AstDeclaration | AstInvalidDeclaration;

export type AstTraverserHandler = (node: AstNode, direction: 'enter' | 'exit') => void;
