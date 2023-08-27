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
    WhitespaceTokenType = 27,
    IncludesTokenType = 28,
    DashMatchTokenType = 29,
    LtTokenType = 30,
    LteTokenType = 31,
    GtTokenType = 32,
    GteTokenType = 33,
    PseudoClassTokenType = 34,
    PseudoClassFuncTokenType = 35,
    DelimTokenType = 36,
    UrlTokenTokenType = 37,
    EOFTokenType = 38,
    ImportantTokenType = 39,
    ColorTokenType = 40,
    AttrTokenType = 41,
    BadCommentTokenType = 42,
    BadCdoTokenType = 43,
    BadUrlTokenType = 44,
    BadStringTokenType = 45,
    Time = 17,
    Iden = 3,
    Hash = 20,
    Angle = 16,
    Color = 40,
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
    Whitespace = 27
}

declare const combinators: string[];
declare function minify(ast: AstNode, options?: ParserOptions, recursive?: boolean, errors?: ErrorDescription[], nestingContent?: boolean, variableScope?: Map<string, VariableScopeInfo>): AstNode;
declare function reduceSelector(selector: string[][]): {
    match: boolean;
    optimized: string[];
    selector: string[][];
    reducible: boolean;
} | null;
declare function hasDeclaration(node: AstRule): boolean;
declare function minifyRule(ast: AstRule | AstAtRule, parent: AstRule | AstAtRule | AstRuleStyleSheet, options?: ParserOptions, variableScope?: Map<string, VariableScopeInfo>): AstRule | AstAtRule;
declare function splitRule(buffer: string): string[][];

declare function walk(node: AstNode, parent?: AstRuleList, root?: AstRuleList): Generator<WalkResult>;
declare function walkValues(values: Token[], parent?: FunctionToken): Generator<WalkAttributesResult>;

declare function expand(ast: AstNode): AstNode;
declare function replaceCompound(input: string, replace: string): string;

declare const colorsFunc: string[];
declare function render(data: AstNode, opt?: RenderOptions): RenderResult;
declare function renderToken(token: Token, options?: RenderOptions, reducer?: (acc: string, curr: Token) => string, errors?: ErrorDescription[]): string;

declare const urlTokenMatcher: RegExp;
declare function parseString(src: string, options?: {
    location: boolean;
}): Token[];

declare function tokenize(iterator: string): Generator<TokenizeResult>;

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

    type: EnumToken$1;
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
    val: string;
    unit: string;
}

interface LengthToken extends BaseToken {

    typ: EnumToken$1.LengthTokenType;
    val: string;
    unit: string;
}

interface AngleToken extends BaseToken {

    typ: EnumToken$1.AngleTokenType;
    val: string;
    unit: string;
}

interface TimeToken extends BaseToken {

    typ: EnumToken$1.TimeTokenType;
    val: string;
    unit: 'ms' | 's';
}

interface FrequencyToken extends BaseToken {

    typ: EnumToken$1.FrequencyTokenType;
    val: string;
    unit: 'Hz' | 'Khz';
}

interface ResolutionToken extends BaseToken {

    typ: EnumToken$1.ResolutionTokenType;
    val: string;
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
    chi?: Token[];
}

interface ParensEndToken extends BaseToken {

    typ: EnumToken$1.EndParensTokenType
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
declare type Token = LiteralToken | IdentToken | CommaToken | ColonToken | SemiColonToken |
    NumberToken | AtRuleToken | PercentageToken | FunctionURLToken | FunctionToken | DimensionToken | LengthToken |
    AngleToken | StringToken | TimeToken | FrequencyToken | ResolutionToken |
    UnclosedStringToken | HashToken | BadStringToken | BlockStartToken | BlockEndToken |
    AttrStartToken | AttrEndToken | ParensStartToken | ParensEndToken | CDOCommentToken |
    BadCDOCommentToken | CommentToken | BadCommentToken | WhitespaceToken | IncludesToken |
    DashMatchToken | LessThanToken | LessThanOrEqualToken | GreaterThanToken | GreaterThanOrEqualToken |
    PseudoClassToken | PseudoClassFunctionToken | DelimToken |
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
    map:        Map$1;
}

interface Map$1 {
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

interface ParserOptions {

    src?: string;
    sourcemap?: boolean;
    minify?: boolean;
    nestingRules?: boolean;
    removeCharset?: boolean;
    removeEmpty?: boolean;
    resolveUrls?: boolean;
    resolveImport?: boolean;
    cwd?: string;
    inlineCssVariable?: boolean;
    load?: (url: string, currentUrl: string) => Promise<string>;
    resolve?: (url: string, currentUrl: string, currentWorkingDirectory?: string) => { absolute: string, relative: string };
    nodeEventFilter?: NodeType[]
}

interface RenderOptions {

    minify?: boolean;
    expandNestingRules?: boolean;
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
    }
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

interface VariableScopeInfo {
    globalScope: boolean;
    parent: Set<AstRule | AstAtRule>;
    declarationCount: number;
    replaceable: boolean;
    val: Token[];
}

declare function load(url: string, currentFile: string): Promise<string>;

declare const matchUrl: RegExp;
declare function dirname(path: string): string;
declare function resolve(url: string, currentDirectory: string, cwd?: string): {
    absolute: string;
    relative: string;
};

declare function parse(iterator: string, opt?: ParserOptions): Promise<ParseResult>;
declare function transform(css: string, options?: TransformOptions): Promise<TransformResult>;

export { EnumToken$1 as EnumToken, NodeType, colorsFunc, combinators, dirname, expand, funcList, getConfig, hasDeclaration, isAngle, isAtKeyword, isColor, isDigit, isDimension, isFrequency, isFunction, isHash, isHexColor, isIdent, isIdentCodepoint, isIdentStart, isLength, isNewLine, isNonPrintable, isNumber, isPercentage, isPseudo, isResolution, isTime, isWhiteSpace, load, matchType, matchUrl, minify, minifyRule, parse, parseDimension, parseString, reduceSelector, render, renderToken, replaceCompound, resolve, splitRule, tokenize, transform, urlTokenMatcher, walk, walkValues };
