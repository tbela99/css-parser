declare const enum NodeType {
    CommentNodeType = 0,
    CDOCOMMNodeType = 1,
    StyleSheetNodeType = 2,
    AtRuleNodeType = 3,
    RuleNodeType = 4,
    DeclarationNodeType = 5
}
declare enum EnumToken$1 {
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
    IncludesTokenType = 29,
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

declare const combinators: string[];
declare function minify(ast: AstNode, options?: ParserOptions | MinifyOptions, recursive?: boolean, errors?: ErrorDescription[], nestingContent?: boolean, context?: {
    [key: string]: any;
}): AstNode;
declare function reduceSelector(selector: string[][]): {
    match: boolean;
    optimized: string[];
    selector: string[][];
    reducible: boolean;
} | null;
declare function hasDeclaration(node: AstRule): boolean;
declare function splitRule(buffer: string): string[][];

declare function walk(node: AstNode, parent?: AstRuleList, root?: AstRuleList): Generator<WalkResult>;
declare function walkValues(values: Token[], parent?: FunctionToken | ParensToken): Generator<WalkAttributesResult>;

declare function expand(ast: AstNode): AstNode;
declare function replaceCompound(input: string, replace: string): string;

declare const colorsFunc: string[];
declare function reduceNumber(val: string | number): string;
declare function doRender(data: AstNode, options?: RenderOptions): RenderResult;
declare function renderToken(token: Token, options?: RenderOptions, cache?: {
    [key: string]: any;
}, reducer?: (acc: string, curr: Token) => string, errors?: ErrorDescription[]): string;

declare const urlTokenMatcher: RegExp;
declare function doParse(iterator: string, options?: ParserOptions): Promise<ParseResult>;
declare function parseString(src: string, options?: {
    location: boolean;
}): Token[];

declare function tokenize(stream: string): Generator<TokenizeResult>;

declare function isLength(dimension: DimensionToken): boolean;
declare function isResolution(dimension: DimensionToken): boolean;
declare function isAngle(dimension: DimensionToken): boolean;
declare function isTime(dimension: DimensionToken): boolean;
declare function isFrequency(dimension: DimensionToken): boolean;
declare function isColor(token: Token): boolean;
declare function isIdentStart(codepoint: number): boolean;
declare function isDigit(codepoint: number): boolean;
declare function isIdentCodepoint(codepoint: number): boolean;
declare function isIdent(name: string): boolean;
declare function isNonPrintable(codepoint: number): boolean;
declare function isPseudo(name: string): boolean;
declare function isHash(name: string): boolean;
declare function isNumber(name: string): boolean;
declare function isDimension(name: string): boolean;
declare function isPercentage(name: string): boolean;
declare function parseDimension(name: string): DimensionToken | LengthToken | AngleToken;
declare function isHexColor(name: string): boolean;
declare function isFunction(name: string): boolean;
declare function isAtKeyword(name: string): boolean;
declare function isNewLine(codepoint: number): boolean;
declare function isWhiteSpace(codepoint: number): boolean;

declare const getConfig: () => PropertiesConfig;

declare const funcList: string[];
declare function matchType(val: Token, properties: PropertyMapType): boolean;

interface BaseToken {

    typ: EnumToken$1;
    loc?: Location;
}

interface LiteralToken extends BaseToken {

    typ: EnumToken$1.LiteralTokenType;
    val: string;
}

interface IdentToken extends BaseToken {

    typ: EnumToken$1.IdenTokenType,
    val: string;
}

interface CommaToken extends BaseToken {

    typ: EnumToken$1.CommaTokenType
}

interface ColonToken extends BaseToken {

    typ: EnumToken$1.ColonTokenType
}

interface SemiColonToken extends BaseToken {

    typ: EnumToken$1.SemiColonTokenType
}

interface NumberToken extends BaseToken {

    typ: EnumToken$1.NumberTokenType,
    val: string;
}

interface AtRuleToken extends BaseToken {

    typ: EnumToken$1.AtRuleTokenType,
    val: string;
}

interface PercentageToken extends BaseToken {

    typ: EnumToken$1.PercentageTokenType,
    val: string;
}

interface FunctionToken extends BaseToken {

    typ: EnumToken$1.FunctionTokenType,
    val: string;
    chi: Token[];
}

interface FunctionURLToken extends BaseToken {

    typ: EnumToken$1.UrlFunctionTokenType,
    val: 'url';
    chi: Array<UrlToken | CommentToken>;
}

interface StringToken extends BaseToken {

    typ: EnumToken$1.StringTokenType;
    val: string;
}

interface BadStringToken extends BaseToken {

    typ: EnumToken$1.BadStringTokenType;
    val: string;
}

interface UnclosedStringToken extends BaseToken {

    typ: EnumToken$1.UnclosedStringTokenType;
    val: string;
}

interface DimensionToken extends BaseToken {

    typ: EnumToken$1.DimensionTokenType;
    val: string | BinaryExpressionToken;
    unit: string;
}

interface LengthToken extends BaseToken {

    typ: EnumToken$1.LengthTokenType;
    val: string | BinaryExpressionToken;
    unit: string;
}

interface AngleToken extends BaseToken {

    typ: EnumToken$1.AngleTokenType;
    val: string | BinaryExpressionToken;
    unit: string;
}

interface TimeToken extends BaseToken {

    typ: EnumToken$1.TimeTokenType;
    val: string | BinaryExpressionToken;
    unit: 'ms' | 's';
}

interface FrequencyToken extends BaseToken {

    typ: EnumToken$1.FrequencyTokenType;
    val: string | BinaryExpressionToken;
    unit: 'Hz' | 'Khz';
}

interface ResolutionToken extends BaseToken {

    typ: EnumToken$1.ResolutionTokenType;
    val: string | BinaryExpressionToken;
    unit: 'dpi' | 'dpcm' | 'dppx' | 'x';
}

interface HashToken extends BaseToken {

    typ: EnumToken$1.HashTokenType;
    val: string;
}

interface BlockStartToken extends BaseToken {

    typ: EnumToken$1.BlockStartTokenType
}

interface BlockEndToken extends BaseToken {

    typ: EnumToken$1.BlockEndTokenType
}

interface AttrStartToken extends BaseToken {

    typ: EnumToken$1.AttrStartTokenType;
    chi?: Token[];
}

interface AttrEndToken extends BaseToken {

    typ: EnumToken$1.AttrEndTokenType
}

interface ParensStartToken extends BaseToken {

    typ: EnumToken$1.StartParensTokenType;
}

interface ParensEndToken extends BaseToken {

    typ: EnumToken$1.EndParensTokenType
}

interface ParensToken extends BaseToken {

    typ: EnumToken$1.ParensTokenType;
    chi: Token[];
}

interface WhitespaceToken extends BaseToken {

    typ: EnumToken$1.WhitespaceTokenType
}

interface CommentToken extends BaseToken {

    typ: EnumToken$1.CommentTokenType;
    val: string;
}

interface BadCommentToken extends BaseToken {

    typ: EnumToken$1.BadCommentTokenType;
    val: string;
}

interface CDOCommentToken extends BaseToken {

    typ: EnumToken$1.CDOCOMMTokenType;
    val: string;
}

interface BadCDOCommentToken extends BaseToken {

    typ: EnumToken$1.BadCdoTokenType;
    val: string;
}

interface IncludesToken extends BaseToken {

    typ: EnumToken$1.IncludesTokenType;
    val: '~=';
}

interface DashMatchToken extends BaseToken {

    typ: EnumToken$1.DashMatchTokenType;
    val: '|=';
}

interface LessThanToken extends BaseToken {

    typ: EnumToken$1.LtTokenType;
}

interface LessThanOrEqualToken extends BaseToken {

    typ: EnumToken$1.LteTokenType;
}

interface GreaterThanToken extends BaseToken {

    typ: EnumToken$1.GtTokenType;
}

interface GreaterThanOrEqualToken extends BaseToken {

    typ: EnumToken$1.GteTokenType;
}

interface PseudoClassToken extends BaseToken {

    typ: EnumToken$1.PseudoClassTokenType;
    val: string;
}

interface PseudoClassFunctionToken extends BaseToken {

    typ: EnumToken$1.PseudoClassFuncTokenType;
    val: string;
    chi: Token[];
}

interface DelimToken extends BaseToken {

    typ: EnumToken$1.DelimTokenType;
    val: '=';
}

interface BadUrlToken extends BaseToken {

    typ: EnumToken$1.BadUrlTokenType,
    val: string;
}

interface UrlToken extends BaseToken {

    typ: EnumToken$1.UrlTokenTokenType,
    val: string;
}

interface EOFToken extends BaseToken {

    typ: EnumToken$1.EOFTokenType;
}

interface ImportantToken extends BaseToken {

    typ: EnumToken$1.ImportantTokenType;
}

interface ColorToken extends BaseToken {

    typ: EnumToken$1.ColorTokenType;
    val: string;
    kin: 'lit' | 'hex' | 'rgb' | 'rgba' | 'hsl' | 'hsla' | 'hwb' | 'device-cmyk';
    chi?: Token[];
}

interface AttrToken extends BaseToken {

    typ: EnumToken$1.AttrTokenType,
    chi: Token[]
}

interface AddToken extends BaseToken {

    typ: EnumToken$1.Add;
}

interface SubToken extends BaseToken {

    typ: EnumToken$1.Sub;
}

interface DivToken extends BaseToken {

    typ: EnumToken$1.Div;
}

interface MulToken extends BaseToken {

    typ: EnumToken$1.Mul;
}

interface UnaryExpression extends BaseToken {

    typ: EnumToken$1.UnaryExpressionTokenType
    sign: EnumToken$1.Add | EnumToken$1.Sub ;
    val: UnaryExpressionNode;
}

interface BinaryExpressionToken extends BaseToken {

    typ: EnumToken$1.BinaryExpressionTokenType
    op: EnumToken$1.Add | EnumToken$1.Sub | EnumToken$1.Div | EnumToken$1.Mul;
    l: BinaryExpressionNode;
    r: BinaryExpressionNode;
}

interface ListToken extends BaseToken {

    typ: EnumToken$1.ListToken
    chi: Token[];
}

declare type UnaryExpressionNode = BinaryExpressionNode | NumberToken | DimensionToken | TimeToken | LengthToken | AngleToken | FrequencyToken;

declare type BinaryExpressionNode = NumberToken | DimensionToken | PercentageToken |
    AngleToken | LengthToken | FrequencyToken | BinaryExpressionToken | FunctionToken | ParensToken;
declare type Token = LiteralToken | IdentToken | CommaToken | ColonToken | SemiColonToken |
    NumberToken | AtRuleToken | PercentageToken | FunctionURLToken | FunctionToken | DimensionToken | LengthToken |
    AngleToken | StringToken | TimeToken | FrequencyToken | ResolutionToken |
    UnclosedStringToken | HashToken | BadStringToken | BlockStartToken | BlockEndToken |
    AttrStartToken | AttrEndToken | ParensStartToken | ParensEndToken | ParensToken | CDOCommentToken |
    BadCDOCommentToken | CommentToken | BadCommentToken | WhitespaceToken | IncludesToken |
    DashMatchToken | LessThanToken | LessThanOrEqualToken | GreaterThanToken | GreaterThanOrEqualToken |
    ListToken | PseudoClassToken | PseudoClassFunctionToken | DelimToken | BinaryExpressionToken | UnaryExpression |
    AddToken | SubToken | DivToken | MulToken |
    BadUrlToken | UrlToken | ImportantToken | ColorToken | AttrToken | EOFToken;

interface PropertyMapType {

    default: string[];
    types: string[];
    keywords: string[];
    required?: boolean;
    multiple?: boolean;
    prefix?: {
        typ: 'Literal',
        val: string
    };
    previous?: string;
    separator?: {

        typ: 'Comma'
    };
    constraints?: {
        [key: string]: {
            [key: string]: any;
        }
    };
    mapping?: {
        [key: string]: any
    }
}

// generated from config.json at https://app.quicktype.io/?l=ts

interface PropertiesConfig {
    properties: PropertiesConfigProperties;
    map:        Map;
}

interface Map {
    border:                  Border;
    "border-color":          BackgroundPositionClass;
    "border-style":          BackgroundPositionClass;
    "border-width":          BackgroundPositionClass;
    outline:                 Outline;
    "outline-color":         BackgroundPositionClass;
    "outline-style":         BackgroundPositionClass;
    "outline-width":         BackgroundPositionClass;
    font:                    Font;
    "font-weight":           BackgroundPositionClass;
    "font-style":            BackgroundPositionClass;
    "font-size":             BackgroundPositionClass;
    "line-height":           BackgroundPositionClass;
    "font-stretch":          BackgroundPositionClass;
    "font-variant":          BackgroundPositionClass;
    "font-family":           BackgroundPositionClass;
    background:              Background;
    "background-repeat":     BackgroundPositionClass;
    "background-color":      BackgroundPositionClass;
    "background-image":      BackgroundPositionClass;
    "background-attachment": BackgroundPositionClass;
    "background-clip":       BackgroundPositionClass;
    "background-origin":     BackgroundPositionClass;
    "background-position":   BackgroundPositionClass;
    "background-size":       BackgroundPositionClass;
}

interface Background {
    shorthand:  string;
    pattern:    string;
    keywords:   string[];
    default:    any[];
    multiple:   boolean;
    separator:  Separator;
    properties: BackgroundProperties;
}

interface BackgroundProperties {
    "background-repeat":     BackgroundRepeat;
    "background-color":      PurpleBackgroundAttachment;
    "background-image":      PurpleBackgroundAttachment;
    "background-attachment": PurpleBackgroundAttachment;
    "background-clip":       PurpleBackgroundAttachment;
    "background-origin":     PurpleBackgroundAttachment;
    "background-position":   BackgroundPosition;
    "background-size":       BackgroundSize;
}

interface PurpleBackgroundAttachment {
    types:     string[];
    default:   string[];
    keywords:  string[];
    required?: boolean;
    mapping?:  BackgroundAttachmentMapping;
}

interface BackgroundAttachmentMapping {
    "ultra-condensed": string;
    "extra-condensed": string;
    condensed:         string;
    "semi-condensed":  string;
    normal:            string;
    "semi-expanded":   string;
    expanded:          string;
    "extra-expanded":  string;
    "ultra-expanded":  string;
}

interface BackgroundPosition {
    multiple:    boolean;
    types:       string[];
    default:     string[];
    keywords:    string[];
    mapping:     BackgroundPositionMapping;
    constraints: BackgroundPositionConstraints;
}

interface BackgroundPositionConstraints {
    mapping: ConstraintsMapping;
}

interface ConstraintsMapping {
    max: number;
}

interface BackgroundPositionMapping {
    left:   string;
    top:    string;
    center: string;
    bottom: string;
    right:  string;
}

interface BackgroundRepeat {
    types:    any[];
    default:  string[];
    multiple: boolean;
    keywords: string[];
    mapping:  BackgroundRepeatMapping;
}

interface BackgroundRepeatMapping {
    "repeat no-repeat":    string;
    "no-repeat repeat":    string;
    "repeat repeat":       string;
    "space space":         string;
    "round round":         string;
    "no-repeat no-repeat": string;
}

interface BackgroundSize {
    multiple: boolean;
    previous: string;
    prefix:   Prefix;
    types:    string[];
    default:  string[];
    keywords: string[];
    mapping:  BackgroundSizeMapping;
}

interface BackgroundSizeMapping {
    "auto auto": string;
}

interface Prefix {
    typ: string;
    val: string;
}

interface Separator {
    typ: string;
}

interface BackgroundPositionClass {
    shorthand: string;
}

interface Border {
    shorthand:  string;
    pattern:    string;
    keywords:   string[];
    default:    string[];
    properties: BorderProperties;
}

interface BorderProperties {
    "border-color": BorderColorClass;
    "border-style": BorderColorClass;
    "border-width": BorderColorClass;
}

interface BorderColorClass {
}

interface Font {
    shorthand:  string;
    pattern:    string;
    keywords:   string[];
    default:    any[];
    properties: FontProperties;
}

interface FontProperties {
    "font-weight":  FontWeight;
    "font-style":   PurpleBackgroundAttachment;
    "font-size":    PurpleBackgroundAttachment;
    "line-height":  LineHeight;
    "font-stretch": PurpleBackgroundAttachment;
    "font-variant": PurpleBackgroundAttachment;
    "font-family":  FontFamily;
}

interface FontFamily {
    types:     string[];
    default:   any[];
    keywords:  string[];
    required:  boolean;
    multiple:  boolean;
    separator: Separator;
}

interface FontWeight {
    types:       string[];
    default:     string[];
    keywords:    string[];
    constraints: FontWeightConstraints;
    mapping:     FontWeightMapping;
}

interface FontWeightConstraints {
    value: Value;
}

interface Value {
    min: string;
    max: string;
}

interface FontWeightMapping {
    thin:          string;
    hairline:      string;
    "extra light": string;
    "ultra light": string;
    light:         string;
    normal:        string;
    regular:       string;
    medium:        string;
    "semi bold":   string;
    "demi bold":   string;
    bold:          string;
    "extra bold":  string;
    "ultra bold":  string;
    black:         string;
    heavy:         string;
    "extra black": string;
    "ultra black": string;
}

interface LineHeight {
    types:    string[];
    default:  string[];
    keywords: string[];
    previous: string;
    prefix:   Prefix;
}

interface Outline {
    shorthand:  string;
    pattern:    string;
    keywords:   string[];
    default:    string[];
    properties: OutlineProperties;
}

interface OutlineProperties {
    "outline-color": PurpleBackgroundAttachment;
    "outline-style": PurpleBackgroundAttachment;
    "outline-width": PurpleBackgroundAttachment;
}

interface PropertiesConfigProperties {
    inset:                        BorderRadius;
    top:                          BackgroundPositionClass;
    right:                        BackgroundPositionClass;
    bottom:                       BackgroundPositionClass;
    left:                         BackgroundPositionClass;
    margin:                       BorderRadius;
    "margin-top":                 BackgroundPositionClass;
    "margin-right":               BackgroundPositionClass;
    "margin-bottom":              BackgroundPositionClass;
    "margin-left":                BackgroundPositionClass;
    padding:                      BorderColor;
    "padding-top":                BackgroundPositionClass;
    "padding-right":              BackgroundPositionClass;
    "padding-bottom":             BackgroundPositionClass;
    "padding-left":               BackgroundPositionClass;
    "border-radius":              BorderRadius;
    "border-top-left-radius":     BackgroundPositionClass;
    "border-top-right-radius":    BackgroundPositionClass;
    "border-bottom-right-radius": BackgroundPositionClass;
    "border-bottom-left-radius":  BackgroundPositionClass;
    "border-width":               BorderColor;
    "border-top-width":           BackgroundPositionClass;
    "border-right-width":         BackgroundPositionClass;
    "border-bottom-width":        BackgroundPositionClass;
    "border-left-width":          BackgroundPositionClass;
    "border-style":               BorderColor;
    "border-top-style":           BackgroundPositionClass;
    "border-right-style":         BackgroundPositionClass;
    "border-bottom-style":        BackgroundPositionClass;
    "border-left-style":          BackgroundPositionClass;
    "border-color":               BorderColor;
    "border-top-color":           BackgroundPositionClass;
    "border-right-color":         BackgroundPositionClass;
    "border-bottom-color":        BackgroundPositionClass;
    "border-left-color":          BackgroundPositionClass;
}

interface BorderColor {
    shorthand:  string;
    map?:       string;
    properties: string[];
    types:      string[];
    keywords:   string[];
}

interface BorderRadius {
    shorthand:  string;
    properties: string[];
    types:      string[];
    multiple:   boolean;
    separator:  null | string;
    keywords:   string[];
}

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

    run: (ast: AstRule | AstAtRule, options: ParserOptions = {}, parent: AstRule | AstAtRule | AstRuleStyleSheet, context: {[key: string]: any}) => void;
    cleanup?: (ast: AstRuleStyleSheet, options: ParserOptions = {}, context: {[key: string]: any}) => void;
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
    resolve?: (url: string, currentUrl: string, currentWorkingDirectory?: string) => { absolute: string, relative: string };
    nodeEventFilter?: NodeType[]
}

interface MinifyOptions extends ParserOptions {

    features: MinifyFeature[];
}

interface ResoledPath  {
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
    code: string ;
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

interface TokenizeResult {
    token: string;
    hint?: EnumToken;
    position: Position;
    bytesIn: number;
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

declare type RawSelectorTokens  = string[][];

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
    parent?: FunctionToken;
}

interface SourceMapObject {
    version : number;
    file?: string;
    sourceRoot?: string;
    sources?: string[];
    sourcesContent?: Array<string | null>;
    names?: string[];
    mappings: string;
}

declare function load(url: string, currentFile: string): Promise<string>;

declare const matchUrl: RegExp;
declare function dirname(path: string): string;
declare function resolve(url: string, currentDirectory: string, cwd?: string): {
    absolute: string;
    relative: string;
};

declare function render(data: AstNode, options?: RenderOptions): RenderResult;
declare function parse(iterator: string, opt?: ParserOptions): Promise<ParseResult>;
declare function transform(css: string, options?: TransformOptions): Promise<TransformResult>;

export { EnumToken$1 as EnumToken, NodeType, colorsFunc, combinators, dirname, doParse, doRender, expand, funcList, getConfig, hasDeclaration, isAngle, isAtKeyword, isColor, isDigit, isDimension, isFrequency, isFunction, isHash, isHexColor, isIdent, isIdentCodepoint, isIdentStart, isLength, isNewLine, isNonPrintable, isNumber, isPercentage, isPseudo, isResolution, isTime, isWhiteSpace, load, matchType, matchUrl, minify, parse, parseDimension, parseString, reduceNumber, reduceSelector, render, renderToken, replaceCompound, resolve, splitRule, tokenize, transform, urlTokenMatcher, walk, walkValues };
