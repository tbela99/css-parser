interface ParserOptions {

    strict?: boolean
}

interface Position {

    index: number;
    line: number;
    column: number;
}

interface Location {

    start: Position;
    end: Position;

    src?: string;
}

type NodeType = 'StyleSheet' | 'InvalidComment' | 'Comment' | 'Declaration' | 'InvalidAtRule' | 'AtRule' | 'Rule';

interface Node {

    location: Location,
    type: NodeType
}

interface AstComment extends Node {

    type: 'Comment',
    value: string;
}

interface AstInvalidComment extends Node {

    type: 'InvalidComment',
    value: string;
}

interface AstDeclaration extends Node {

    name: string,
    value: string;
    type: 'Declaration'
}

interface AstInvalidDeclaration extends Node {

    name: string,
    value: string;
    type: 'InvalidDeclaration'
}


interface AstRule extends Node {

    type: 'Rule',
    selector: string,
    children?: Array<AstDeclaration | AstComment>
}

interface AstAtRule extends Node {

    name: string;
    value: string;
    children?: Array<AstDeclaration | AstComment> | Array<AstRule | AstComment>
}

interface AstInvalidAtRule extends Node {

    type: 'InvalidAtRule';
    name?: string,
    value?: string;
    body?: string;
    children?: Array<AstDeclaration | AstComment> | Array<AstRule | AstComment>
}

interface AstRuleList extends Node {

    children: Array<Node | AstComment>
}

interface AstRuleStyleSheet extends AstRuleList {
    type: 'StyleSheet',

    children: Array<AstRuleList | AstComment>
}

type AstNode = AstComment | AstInvalidComment | AstInvalidAtRule | AstAtRule | AstRule | AstDeclaration | AstInvalidDeclaration;

type AstTraverserHandler = (node: AstNode, direction: 'enter' | 'exit') => void;

declare class Parser {
    #private;
    constructor(options?: ParserOptions);
    parse(css: string): this;
    on(name: string, handler: AstTraverserHandler, signal?: AbortSignal): this;
    off(name: string, handler?: AstTraverserHandler): this;
    compact(): this;
    getAst(): AstRuleStyleSheet;
    getErrors(): Error[];
}

export { Parser };
