interface LiteralToken {
    typ: 'Literal';
    val: string;
}
interface IdentToken {
    typ: 'Iden';
    val: string;
}
interface CommaToken {
    typ: 'Comma';
}
interface ColonToken {
    typ: 'Colon';
}
interface SemiColonToken {
    typ: 'Semi-colon';
}
interface NumberToken {
    typ: 'Number';
    val: string;
}
interface AtRuleToken {
    typ: 'At-rule';
    val: string;
}
interface PercentageToken {
    typ: 'Perc';
    val: string;
}
interface FunctionToken {
    typ: 'Func';
    val: string;
}
interface StringToken {
    typ: 'String';
    val: string;
}
interface BadStringToken {
    typ: 'Bad-string';
    val: string;
}
interface UnclosedStringToken {
    typ: 'Unclosed-string';
    val: string;
}
interface DimensionToken {
    typ: 'Dimension';
    val: string;
    unit: string;
}
interface HashToken {
    typ: 'Hash';
    val: string;
}
interface BlockStartToken {
    typ: 'Block-start';
}
interface BlockEndToken {
    typ: 'Block-end';
}
interface AttrStartToken {
    typ: 'Attr-start';
}
interface AttrEndToken {
    typ: 'Attr-end';
}
interface ParensStartToken {
    typ: 'Start-parens';
}
interface ParensEndToken {
    typ: 'End-parens';
}
interface WhitespaceToken {
    typ: 'Whitespace';
}
interface CommentToken {
    typ: 'Comment';
    val: string;
}
interface BadCommentToken {
    typ: 'Bad-comment';
    val: string;
}
interface CDOCommentToken {
    typ: 'CDOCOMM';
    val: string;
}
interface BadCDOCommentToken {
    typ: 'BADCDO';
    val: string;
}
interface IncludesToken {
    typ: 'Includes';
    val: '~=';
}
interface DashMatchToken {
    typ: 'Dash-match';
    val: '|=';
}
interface LessThanToken {
    typ: 'Lt';
}
interface GreaterThanToken {
    typ: 'Gt';
}
interface PseudoClassToken {
    typ: 'Pseudo-class';
    val: string;
}
interface PseudoClassFunctionToken {
    typ: 'Pseudo-class-func';
    val: string;
}
interface DelimToken {
    typ: 'Delim';
    val: '=';
}
interface BadUrlToken {
    typ: 'Bad-url-token';
    val: string;
}
interface UrlToken {
    typ: 'Url-token';
    val: string;
}
interface EOFToken {
    typ: 'EOF';
}
interface ImportantToken {
    typ: 'Important';
}
interface ColorToken {
    typ: 'Color';
    value: string;
}
declare type Token = LiteralToken | IdentToken | CommaToken | ColonToken | SemiColonToken | NumberToken | AtRuleToken | PercentageToken | FunctionToken | DimensionToken | StringToken | UnclosedStringToken | HashToken | BadStringToken | BlockStartToken | BlockEndToken | AttrStartToken | AttrEndToken | ParensStartToken | ParensEndToken | CDOCommentToken | BadCDOCommentToken | CommentToken | BadCommentToken | WhitespaceToken | IncludesToken | DashMatchToken | LessThanToken | GreaterThanToken | PseudoClassToken | PseudoClassFunctionToken | DelimToken | BadUrlToken | UrlToken | ImportantToken | ColorToken | EOFToken;

interface ErrorDescription {

    // drop rule or declaration | fix rule or declaration
    action: 'drop';
    message: string;
    location: {
        src: string,
        lin: number,
        col: number;
    };
    error?: Error;
}

interface ParserOptions {

    src?: string;
    location?: boolean;
    processImport?: boolean;
    deduplicate?: boolean;
    removeEmpty?: boolean;
    nodeEventFilter?: NodeType[]
}

interface RenderOptions {

    compress?: boolean;
    indent?: string;
    newLine?: string;
    removeComments?: boolean;
}

interface Position {

    ind: number;
    lin: number;
    col: number;
}

interface Location {

    sta: Position;
    end: Position;
    src: string;
}

type NodeType = 'StyleSheet' | 'InvalidComment' | 'Comment' | 'Declaration' | 'InvalidAtRule' | 'AtRule' | 'Rule';

interface Node {

    typ: NodeType;
    loc?: Location;
}

interface AstComment extends Node {

    typ: 'Comment',
    val: string;
}

interface AstDeclaration extends Node {

    nam: Token[],
    val: Token[];
    typ: 'Declaration'
}

interface AstRule extends Node {

    typ: 'Rule',
    sel: string,
    chi: Array<AstDeclaration | AstComment | AstRuleList>
}

interface AstAtRule extends Node {

    nam: string;
    val: string;
    chi?: Array<AstDeclaration | AstComment> | Array<AstRule | AstComment>
}

interface AstRuleList extends Node {

    chi: Array<Node | AstComment>
}

interface AstRuleStyleSheet extends AstRuleList {
    typ: 'StyleSheet',
    chi: Array<AstRuleList | AstComment>
}

type AstNode =
    AstRuleStyleSheet
    | AstRuleList
    | AstComment
    | AstAtRule
    | AstRule
    | AstDeclaration;

declare function parse(css: string, opt?: ParserOptions): {
    ast: AstRuleStyleSheet;
    errors: ErrorDescription[];
};
declare function deduplicate(ast: AstNode): AstNode;
declare function deduplicateRule(ast: AstNode): AstNode;

declare function render(data: AstNode, options?: RenderOptions): string;
declare function renderToken(token: Token, options?: RenderOptions): string;

export { deduplicate, deduplicateRule, parse, render, renderToken };