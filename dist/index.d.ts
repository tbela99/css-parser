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
    chi: Token[];
}
interface FunctionURLToken {
    typ: 'UrlFunc';
    val: 'url';
    chi: Array<UrlToken | CommentToken>;
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
interface LengthToken {
    typ: 'Length';
    val: string;
    unit: string;
}
interface AngleToken {
    typ: 'Angle';
    val: string;
    unit: string;
}
interface TimeToken {
    typ: 'Time';
    val: string;
    unit: 'ms' | 's';
}
interface FrequencyToken {
    typ: 'Frequency';
    val: string;
    unit: 'Hz' | 'Khz';
}
interface ResolutionToken {
    typ: 'Resolution';
    val: string;
    unit: 'dpi' | 'dpcm' | 'dppx' | 'x';
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
    chi: Token[];
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
    val: string;
    kin: 'lit' | 'hex' | 'rgb' | 'rgba' | 'hsl' | 'hsla' | 'hwb' | 'device-cmyk';
    chi?: Token[];
}
interface AttrToken {
    typ: 'Attr';
    chi: Token[];
}
declare type Token = LiteralToken | IdentToken | CommaToken | ColonToken | SemiColonToken | NumberToken | AtRuleToken | PercentageToken | FunctionURLToken | FunctionToken | DimensionToken | LengthToken | AngleToken | StringToken | TimeToken | FrequencyToken | ResolutionToken | UnclosedStringToken | HashToken | BadStringToken | BlockStartToken | BlockEndToken | AttrStartToken | AttrEndToken | ParensStartToken | ParensEndToken | CDOCommentToken | BadCDOCommentToken | CommentToken | BadCommentToken | WhitespaceToken | IncludesToken | DashMatchToken | LessThanToken | GreaterThanToken | PseudoClassToken | PseudoClassFunctionToken | DelimToken | BadUrlToken | UrlToken | ImportantToken | ColorToken | AttrToken | EOFToken;

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
    sourcemap?: boolean;
    compress?: boolean;
    removeEmpty?: boolean;
    resolveUrls?: boolean;
    resolveImport?: boolean;
    cwd?: string;
    load?: (url: string, currentUrl: string) => Promise<string>;
    resolve?: (url: string, currentUrl: string, currentWorkingDirectory?: string) => { absolute: string, relative: string };
    nodeEventFilter?: NodeType[]
}

interface RenderOptions {

    compress?: boolean;
    preserveLicense?: boolean;
    indent?: string;
    newLine?: string;
    removeComments?: boolean;
    colorConvert?: boolean;
}

interface TransformOptions extends ParserOptions, RenderOptions {

}

interface ParseResult {
    ast: AstRuleStyleSheet;
    errors: ErrorDescription[];
    bytesIn: number;
}

interface RenderResult {
    code: string ;
}

interface TransformResult extends ParseResult, RenderResult {

    stats: {
        bytesIn: number;
        bytesOut: number;
        parse: string;
        render: string;
        total: string;
    }
}

interface Position {

    ind: number;
    lin: number;
    col: number;
}

interface Location {

    sta: Position;
    // end: Position;
    src: string;
}

declare type NodeType = 'StyleSheet' | 'InvalidComment' | 'Comment' | 'Declaration' | 'InvalidAtRule' | 'AtRule' | 'Rule';

interface Node {

    typ: NodeType;
    loc?: Location;
}

interface AstComment extends Node {

    typ: 'Comment',
    val: string;
}
interface AstDeclaration extends Node {

    nam: string,
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

declare function deduplicate(ast: AstNode, options?: ParserOptions, recursive?: boolean): AstNode;
declare function hasDeclaration(node: AstAtRule | AstRule | AstRuleList): boolean;
declare function deduplicateRule(ast: AstNode, options?: ParserOptions): AstNode;

declare function render(data: AstNode, opt?: RenderOptions): RenderResult;
declare function renderToken(token: Token, options?: RenderOptions): string;

declare function walk(node: AstNode): Generator<{
    node: AstNode;
    parent?: AstRuleList;
    root?: AstRuleList;
}>;

declare function load(url: string, currentFile: string): Promise<string>;

declare const matchUrl: RegExp;
declare function dirname(path: string): string;
declare function resolve(url: string, currentDirectory: string, cwd?: string): {
    absolute: string;
    relative: string;
};

declare function parse(iterator: string, opt?: ParserOptions): Promise<ParseResult>;
declare function transform(css: string, options?: TransformOptions): Promise<TransformResult>;

export { deduplicate, deduplicateRule, dirname, hasDeclaration, load, matchUrl, parse, render, renderToken, resolve, transform, walk };
