declare enum NodeType {
    CommentNodeType = 0,
    CDOCOMMNodeType = 1,
    StyleSheetNodeType = 2,
    AtRuleNodeType = 3,
    RuleNodeType = 4,
    DeclarationNodeType = 5
}
declare enum EnumToken {
    CommentTokenType = 0,
    CDOCOMMTokenType = 1,
    LiteralTokenType = 2,
    IdenTokenType = 3,
    CommaTokenType = 4,
    ColonTokenType = 5,
    SemiColonTokenType = 6,
    NumberTokenType = 7,
    AtRuleTokenType = 8,
    PercentageTokenType = 9,
    FunctionTokenType = 10,
    UrlFunctionTokenType = 11,
    StringTokenType = 12,
    UnclosedStringTokenType = 13,
    DimensionTokenType = 14,
    LengthTokenType = 15,
    AngleTokenType = 16,
    TimeTokenType = 17,
    FrequencyTokenType = 18,
    ResolutionTokenType = 19,
    HashTokenType = 20,
    BlockStartTokenType = 21,
    BlockEndTokenType = 22,
    AttrStartTokenType = 23,
    AttrEndTokenType = 24,
    StartParensTokenType = 25,
    EndParensTokenType = 26,
    ParensTokenType = 27,
    WhitespaceTokenType = 28,
    IncludeMatchTokenType = 29,
    DashMatchTokenType = 30,
    LtTokenType = 31,
    LteTokenType = 32,
    GtTokenType = 33,
    GteTokenType = 34,
    PseudoClassTokenType = 35,
    PseudoClassFuncTokenType = 36,
    DelimTokenType = 37,
    UrlTokenTokenType = 38,
    EOFTokenType = 39,
    ImportantTokenType = 40,
    ColorTokenType = 41,
    AttrTokenType = 42,
    BadCommentTokenType = 43,
    BadCdoTokenType = 44,
    BadUrlTokenType = 45,
    BadStringTokenType = 46,
    BinaryExpressionTokenType = 47,
    UnaryExpressionTokenType = 48,
    ListToken = 49,
    Add = 50,
    Mul = 51,
    Div = 52,
    Sub = 53,
    ColumnCombinatorTokenType = 54,
    ContainMatchTokenType = 55,
    StartMatchTokenType = 56,
    EndMatchTokenType = 57,
    MatchExpressionTokenType = 58,
    NameSpaceAttributeTokenType = 59,
    FractionTokenType = 60,
    Time = 17,
    Iden = 3,
    Hash = 20,
    Angle = 16,
    Color = 41,
    Comma = 4,
    String = 12,
    Length = 15,
    Number = 7,
    Perc = 9,
    Literal = 2,
    Comment = 0,
    UrlFunc = 11,
    Dimension = 14,
    Frequency = 18,
    Resolution = 19,
    Whitespace = 28
}

declare function minify(ast: AstNode, options?: ParserOptions | MinifyOptions, recursive?: boolean, errors?: ErrorDescription[], nestingContent?: boolean, context?: {
    [key: string]: any;
}): AstNode;

declare function walk(node: AstNode): Generator<WalkResult>;
declare function walkValues(values: Token[]): Generator<WalkAttributesResult>;

declare function expand(ast: AstNode): AstNode;

declare function renderToken(token: Token, options?: RenderOptions, cache?: {
    [key: string]: any;
}, reducer?: (acc: string, curr: Token) => string, errors?: ErrorDescription[]): string;

declare function parseString(src: string, options?: {
    location: boolean;
}): Token[];
declare function parseTokens(tokens: Token[], options?: ParseTokenOptions): Token[];

interface BaseToken {

    typ: EnumToken;
    loc?: Location;
}

interface LiteralToken extends BaseToken {

    typ: EnumToken.LiteralTokenType;
    val: string;
}

interface IdentToken extends BaseToken {

    typ: EnumToken.IdenTokenType,
    val: string;
}

interface CommaToken extends BaseToken {

    typ: EnumToken.CommaTokenType
}

interface ColonToken extends BaseToken {

    typ: EnumToken.ColonTokenType
}

interface SemiColonToken extends BaseToken {

    typ: EnumToken.SemiColonTokenType
}

interface NumberToken extends BaseToken {

    typ: EnumToken.NumberTokenType,
    val: string | FractionToken;
}

interface AtRuleToken extends BaseToken {

    typ: EnumToken.AtRuleTokenType,
    val: string;
}

interface PercentageToken extends BaseToken {

    typ: EnumToken.PercentageTokenType,
    val: string | FractionToken;
}

interface FunctionToken extends BaseToken {

    typ: EnumToken.FunctionTokenType,
    val: string;
    chi: Token[];
}

interface FunctionURLToken extends BaseToken {

    typ: EnumToken.UrlFunctionTokenType,
    val: 'url';
    chi: Array<UrlToken | CommentToken>;
}

interface StringToken extends BaseToken {

    typ: EnumToken.StringTokenType;
    val: string;
}

interface BadStringToken extends BaseToken {

    typ: EnumToken.BadStringTokenType;
    val: string;
}

interface UnclosedStringToken extends BaseToken {

    typ: EnumToken.UnclosedStringTokenType;
    val: string;
}

interface DimensionToken extends BaseToken {

    typ: EnumToken.DimensionTokenType;
    val: string | FractionToken;
    unit: string;
}

interface LengthToken extends BaseToken {

    typ: EnumToken.LengthTokenType;
    val: string | FractionToken;
    unit: string;
}

interface AngleToken extends BaseToken {

    typ: EnumToken.AngleTokenType;
    val: string | FractionToken;
    unit: string;
}

interface TimeToken extends BaseToken {

    typ: EnumToken.TimeTokenType;
    val: string | FractionToken;
    unit: 'ms' | 's';
}

interface FrequencyToken extends BaseToken {

    typ: EnumToken.FrequencyTokenType;
    val: string | FractionToken;
    unit: 'Hz' | 'Khz';
}

interface ResolutionToken extends BaseToken {

    typ: EnumToken.ResolutionTokenType;
    val: string | FractionToken;
    unit: 'dpi' | 'dpcm' | 'dppx' | 'x';
}

interface HashToken extends BaseToken {

    typ: EnumToken.HashTokenType;
    val: string;
}

interface BlockStartToken extends BaseToken {

    typ: EnumToken.BlockStartTokenType
}

interface BlockEndToken extends BaseToken {

    typ: EnumToken.BlockEndTokenType
}

interface AttrStartToken extends BaseToken {

    typ: EnumToken.AttrStartTokenType;
    chi?: Token[];
}

interface AttrEndToken extends BaseToken {

    typ: EnumToken.AttrEndTokenType
}

interface ParensStartToken extends BaseToken {

    typ: EnumToken.StartParensTokenType;
}

interface ParensEndToken extends BaseToken {

    typ: EnumToken.EndParensTokenType
}

interface ParensToken extends BaseToken {

    typ: EnumToken.ParensTokenType;
    chi: Token[];
}

interface WhitespaceToken extends BaseToken {

    typ: EnumToken.WhitespaceTokenType
}

interface CommentToken extends BaseToken {

    typ: EnumToken.CommentTokenType;
    val: string;
}

interface BadCommentToken extends BaseToken {

    typ: EnumToken.BadCommentTokenType;
    val: string;
}

interface CDOCommentToken extends BaseToken {

    typ: EnumToken.CDOCOMMTokenType;
    val: string;
}

interface BadCDOCommentToken extends BaseToken {

    typ: EnumToken.BadCdoTokenType;
    val: string;
}

interface IncludeMatchToken extends BaseToken {

    typ: EnumToken.IncludeMatchTokenType;
    // val: '~=';
}

interface DashMatchToken extends BaseToken {

    typ: EnumToken.DashMatchTokenType;
    // val: '|=';
}

interface StartMatchToken extends BaseToken {

    typ: EnumToken.StartMatchTokenType;
    // val: '^=';
}

interface EndMatchToken extends BaseToken {

    typ: EnumToken.EndMatchTokenType;
    // val: '|=';
}

interface ContainMatchToken extends BaseToken {

    typ: EnumToken.ContainMatchTokenType;
    // val: '|=';
}

interface LessThanToken extends BaseToken {

    typ: EnumToken.LtTokenType;
}

interface LessThanOrEqualToken extends BaseToken {

    typ: EnumToken.LteTokenType;
}

interface GreaterThanToken extends BaseToken {

    typ: EnumToken.GtTokenType;
}

interface GreaterThanOrEqualToken extends BaseToken {

    typ: EnumToken.GteTokenType;
}

interface ColumnCombinatorToken extends BaseToken {

    typ: EnumToken.ColumnCombinatorTokenType;
}

interface PseudoClassToken extends BaseToken {

    typ: EnumToken.PseudoClassTokenType;
    val: string;
}

interface PseudoClassFunctionToken extends BaseToken {

    typ: EnumToken.PseudoClassFuncTokenType;
    val: string;
    chi: Token[];
}

interface DelimToken extends BaseToken {

    typ: EnumToken.DelimTokenType;
    val: '=';
}

interface BadUrlToken extends BaseToken {

    typ: EnumToken.BadUrlTokenType,
    val: string;
}

interface UrlToken extends BaseToken {

    typ: EnumToken.UrlTokenTokenType,
    val: string;
}

interface EOFToken extends BaseToken {

    typ: EnumToken.EOFTokenType;
}

interface ImportantToken extends BaseToken {

    typ: EnumToken.ImportantTokenType;
}

interface ColorToken extends BaseToken {

    typ: EnumToken.ColorTokenType;
    val: string;
    kin: 'lit' | 'hex' | 'rgb' | 'rgba' | 'hsl' | 'hsla' | 'hwb' | 'device-cmyk';
    chi?: Token[];
}

interface AttrToken extends BaseToken {

    typ: EnumToken.AttrTokenType,
    chi: Token[]
}

interface AddToken extends BaseToken {

    typ: EnumToken.Add;
}

interface SubToken extends BaseToken {

    typ: EnumToken.Sub;
}

interface DivToken extends BaseToken {

    typ: EnumToken.Div;
}

interface MulToken extends BaseToken {

    typ: EnumToken.Mul;
}

interface UnaryExpression extends BaseToken {

    typ: EnumToken.UnaryExpressionTokenType
    sign: EnumToken.Add | EnumToken.Sub;
    val: UnaryExpressionNode;
}

interface FractionToken extends BaseToken {

    typ: EnumToken.FractionTokenType;
    l: NumberToken;
    r: NumberToken;
}
interface BinaryExpressionToken extends BaseToken {

    typ: EnumToken.BinaryExpressionTokenType
    op: EnumToken.Add | EnumToken.Sub | EnumToken.Div | EnumToken.Mul;
    l: BinaryExpressionNode | Token;
    r: BinaryExpressionNode | Token;
}

interface MatchExpressionToken extends BaseToken {

    typ: EnumToken.MatchExpressionTokenType
    op: EnumToken.DashMatchTokenType | EnumToken.StartMatchTokenType | EnumToken.ContainMatchTokenType | EnumToken.EndMatchTokenType | EnumToken.IncludeMatchTokenType;
    l: Token;
    r: Token;
    attr?: 'i' | 's';
}

interface NameSpaceAttributeToken extends BaseToken {

    typ: EnumToken.NameSpaceAttributeTokenType
   l?: Token;
    r: Token;
}

interface ListToken extends BaseToken {

    typ: EnumToken.ListToken
    chi: Token[];
}

declare type UnaryExpressionNode =
    BinaryExpressionNode
    | NumberToken
    | DimensionToken
    | TimeToken
    | LengthToken
    | AngleToken
    | FrequencyToken;

declare type BinaryExpressionNode = NumberToken | DimensionToken | PercentageToken | FractionToken |
    AngleToken | LengthToken | FrequencyToken | BinaryExpressionToken | FunctionToken | ParensToken;
declare type Token =
    LiteralToken
    | IdentToken
    | CommaToken
    | ColonToken
    | SemiColonToken
    |
    NumberToken
    | AtRuleToken
    | PercentageToken
    | FunctionURLToken
    | FunctionToken
    | DimensionToken
    | LengthToken
    |
    AngleToken
    | StringToken
    | TimeToken
    | FrequencyToken
    | ResolutionToken
    |
    UnclosedStringToken
    | HashToken
    | BadStringToken
    | BlockStartToken
    | BlockEndToken
    |
    AttrStartToken
    | AttrEndToken
    | ParensStartToken
    | ParensEndToken
    | ParensToken
    | CDOCommentToken
    |
    BadCDOCommentToken
    | CommentToken
    | BadCommentToken
    | WhitespaceToken
    | IncludeMatchToken
    | StartMatchToken
    | EndMatchToken
    | ContainMatchToken | MatchExpressionToken | NameSpaceAttributeToken
    |
    DashMatchToken
    | LessThanToken
    | LessThanOrEqualToken
    | GreaterThanToken
    | GreaterThanOrEqualToken
    | ColumnCombinatorToken
    |
    ListToken
    | PseudoClassToken
    | PseudoClassFunctionToken
    | DelimToken
    | BinaryExpressionToken
    | UnaryExpression
    | FractionToken
    |
    AddToken
    | SubToken
    | DivToken
    | MulToken
    |
    BadUrlToken
    | UrlToken
    | ImportantToken
    | ColorToken
    | AttrToken
    | EOFToken;

interface ErrorDescription {

    // drop rule or declaration | fix rule or declaration
    action: 'drop' | 'ignore';
    message: string;
    location?: {
        src: string,
        lin: number,
        col: number;
    };
    error?: Error;
}

interface PropertyListOptions {

    removeDuplicateDeclarations?: boolean;
    computeShorthand?: boolean;
}

interface MinifyFeature {

    ordering: number;

    register: (options: MinifyOptions | ParserOptions) => void;
    run: (ast: AstRule | AstAtRule, options: ParserOptions = {}, parent: AstRule | AstAtRule | AstRuleStyleSheet, context: {
        [key: string]: any
    }) => void;
    cleanup?: (ast: AstRuleStyleSheet, options: ParserOptions = {}, context: { [key: string]: any }) => void;
}

interface ParserOptions extends PropertyListOptions {

    minify?: boolean;
    src?: string;
    sourcemap?: boolean;
    nestingRules?: boolean;
    expandNestingRules?: boolean;
    removeCharset?: boolean;
    removeEmpty?: boolean;
    resolveUrls?: boolean;
    resolveImport?: boolean;
    cwd?: string;
    removeDuplicateDeclarations?: boolean;
    computeShorthand?: boolean;
    inlineCssVariables?: boolean;
    computeCalcExpression?: boolean;
    load?: (url: string, currentUrl: string) => Promise<string>;
    dirname?: (path: string) => string;
    resolve?: (url: string, currentUrl: string, currentWorkingDirectory?: string) => {
        absolute: string,
        relative: string
    };
    nodeEventFilter?: NodeType[]
}

interface MinifyOptions extends ParserOptions {

    features: MinifyFeature[];
}

interface ResoledPath {
    absolute: string;
    relative: string;
}

interface RenderOptions {

    minify?: boolean;
    expandNestingRules?: boolean;
    preserveLicense?: boolean;
    sourcemap?: boolean;
    indent?: string;
    newLine?: string;
    removeComments?: boolean;
    colorConvert?: boolean;
    output?: string;
    cwd?: string;
    load?: (url: string, currentUrl: string) => Promise<string>;
    resolve?: (url: string, currentUrl: string, currentWorkingDirectory?: string) => ResoledPath;

}

interface TransformOptions extends ParserOptions, RenderOptions {

}

interface ParseResult {
    ast: AstRuleStyleSheet;
    errors: ErrorDescription[];
    stats: {
        bytesIn: number;
        parse: string;
        minify: string;
        total: string;
    }
}

interface RenderResult {
    code: string;
    errors: ErrorDescription[];
    stats: {
        total: string;
    },
    map?: SourceMapObject
}

interface TransformResult extends ParseResult, RenderResult {

    stats: {
        bytesIn: number;
        bytesOut: number;
        parse: string;
        minify: string;
        render: string;
        total: string;
    }
}

interface ParseTokenOptions extends ParserOptions {
    parseColor?: boolean;
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

interface Node {

    typ: NodeType;
    loc?: Location;
}

interface AstComment extends Node {

    typ: NodeType.CommentNodeType | NodeType.CDOCOMMNodeType,
    val: string;
}

interface AstDeclaration extends Node {

    nam: string,
    val: Token[];
    typ: NodeType.DeclarationNodeType
}

interface AstRule extends Node {

    typ: NodeType.RuleNodeType;
    sel: string;
    chi: Array<AstDeclaration | AstComment | AstRuleList>;
    optimized?: OptimizedSelector;
    raw?: RawSelectorTokens;
}

declare type RawSelectorTokens = string[][];

interface OptimizedSelector {
    match: boolean;
    optimized: string[];
    selector: string[][],
    reducible: boolean;
}

interface AstAtRule extends Node {

    typ: AtRuleNodeType,
    nam: string;
    val: string;
    chi?: Array<AstDeclaration | AstComment> | Array<AstRule | AstComment>
}

interface AstRuleList extends Node {

    typ: StyleSheetNodeType | RuleNodeType | AtRuleNodeType,
    chi: Array<Node | AstComment>
}

interface AstRuleStyleSheet extends AstRuleList {
    typ: StyleSheetNodeType,
    chi: Array<AstRuleList | AstComment>
}

type AstNode =
    AstRuleStyleSheet
    | AstRuleList
    | AstComment
    | AstAtRule
    | AstRule
    | AstDeclaration;

interface WalkResult {
    node: AstNode;
    parent?: AstRuleList;
    root?: AstRuleList;
}

interface WalkAttributesResult {
    value: Token;
    parent: FunctionToken | ParensToken | null;
}

interface SourceMapObject {
    version: number;
    file?: string;
    sourceRoot?: string;
    sources?: string[];
    sourcesContent?: Array<string | null>;
    names?: string[];
    mappings: string;
}

declare function dirname(path: string): string;
declare function resolve(url: string, currentDirectory: string, cwd?: string): {
    absolute: string;
    relative: string;
};

declare function load(url: string, currentFile: string): Promise<string>;

declare function render(data: AstNode, options?: RenderOptions): RenderResult;
declare function parse(iterator: string, opt?: ParserOptions): Promise<ParseResult>;
declare function transform(css: string, options?: TransformOptions): Promise<TransformResult>;

export { EnumToken, NodeType, dirname, expand, load, minify, parse, parseString, parseTokens, render, renderToken, resolve, transform, walk, walkValues };
