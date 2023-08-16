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
    chi?: Token[];
}
interface AttrEndToken {
    typ: 'Attr-end';
}
interface ParensStartToken {
    typ: 'Start-parens';
    chi?: Token[];
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
interface LessThanOrEqualToken {
    typ: 'Lte';
}
interface GreaterThanToken {
    typ: 'Gt';
}
interface GreaterThanOrEqualToken {
    typ: 'Gte';
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
declare type Token = LiteralToken | IdentToken | CommaToken | ColonToken | SemiColonToken | NumberToken | AtRuleToken | PercentageToken | FunctionURLToken | FunctionToken | DimensionToken | LengthToken | AngleToken | StringToken | TimeToken | FrequencyToken | ResolutionToken | UnclosedStringToken | HashToken | BadStringToken | BlockStartToken | BlockEndToken | AttrStartToken | AttrEndToken | ParensStartToken | ParensEndToken | CDOCommentToken | BadCDOCommentToken | CommentToken | BadCommentToken | WhitespaceToken | IncludesToken | DashMatchToken | LessThanToken | LessThanOrEqualToken | GreaterThanToken | GreaterThanOrEqualToken | PseudoClassToken | PseudoClassFunctionToken | DelimToken | BadUrlToken | UrlToken | ImportantToken | ColorToken | AttrToken | EOFToken;

interface PropertyMapType {
    default: string[];
    types: string[];
    keywords: string[];
    required?: boolean;
    multiple?: boolean;
    prefix?: {
        typ: 'Literal';
        val: string;
    };
    previous?: string;
    separator?: {
        typ: 'Comma';
    };
    constraints?: {
        [key: string]: {
            [key: string]: any;
        };
    };
    mapping?: {
        [key: string]: any;
    };
}

interface PropertiesConfig {
    properties: PropertiesConfigProperties;
    map: Map;
}
interface Map {
    border: Border;
    "border-color": BackgroundPositionClass;
    "border-style": BackgroundPositionClass;
    "border-width": BackgroundPositionClass;
    outline: Outline;
    "outline-color": BackgroundPositionClass;
    "outline-style": BackgroundPositionClass;
    "outline-width": BackgroundPositionClass;
    font: Font;
    "font-weight": BackgroundPositionClass;
    "font-style": BackgroundPositionClass;
    "font-size": BackgroundPositionClass;
    "line-height": BackgroundPositionClass;
    "font-stretch": BackgroundPositionClass;
    "font-variant": BackgroundPositionClass;
    "font-family": BackgroundPositionClass;
    background: Background;
    "background-repeat": BackgroundPositionClass;
    "background-color": BackgroundPositionClass;
    "background-image": BackgroundPositionClass;
    "background-attachment": BackgroundPositionClass;
    "background-clip": BackgroundPositionClass;
    "background-origin": BackgroundPositionClass;
    "background-position": BackgroundPositionClass;
    "background-size": BackgroundPositionClass;
}
interface Background {
    shorthand: string;
    pattern: string;
    keywords: string[];
    default: any[];
    multiple: boolean;
    separator: Separator;
    properties: BackgroundProperties;
}
interface BackgroundProperties {
    "background-repeat": BackgroundRepeat;
    "background-color": PurpleBackgroundAttachment;
    "background-image": PurpleBackgroundAttachment;
    "background-attachment": PurpleBackgroundAttachment;
    "background-clip": PurpleBackgroundAttachment;
    "background-origin": PurpleBackgroundAttachment;
    "background-position": BackgroundPosition;
    "background-size": BackgroundSize;
}
interface PurpleBackgroundAttachment {
    types: string[];
    default: string[];
    keywords: string[];
    required?: boolean;
    mapping?: BackgroundAttachmentMapping;
}
interface BackgroundAttachmentMapping {
    "ultra-condensed": string;
    "extra-condensed": string;
    condensed: string;
    "semi-condensed": string;
    normal: string;
    "semi-expanded": string;
    expanded: string;
    "extra-expanded": string;
    "ultra-expanded": string;
}
interface BackgroundPosition {
    multiple: boolean;
    types: string[];
    default: string[];
    keywords: string[];
    mapping: BackgroundPositionMapping;
    constraints: BackgroundPositionConstraints;
}
interface BackgroundPositionConstraints {
    mapping: ConstraintsMapping;
}
interface ConstraintsMapping {
    max: number;
}
interface BackgroundPositionMapping {
    left: string;
    top: string;
    center: string;
    bottom: string;
    right: string;
}
interface BackgroundRepeat {
    types: any[];
    default: string[];
    multiple: boolean;
    keywords: string[];
    mapping: BackgroundRepeatMapping;
}
interface BackgroundRepeatMapping {
    "repeat no-repeat": string;
    "no-repeat repeat": string;
    "repeat repeat": string;
    "space space": string;
    "round round": string;
    "no-repeat no-repeat": string;
}
interface BackgroundSize {
    multiple: boolean;
    previous: string;
    prefix: Prefix;
    types: string[];
    default: string[];
    keywords: string[];
    mapping: BackgroundSizeMapping;
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
    shorthand: string;
    pattern: string;
    keywords: string[];
    default: string[];
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
    shorthand: string;
    pattern: string;
    keywords: string[];
    default: any[];
    properties: FontProperties;
}
interface FontProperties {
    "font-weight": FontWeight;
    "font-style": PurpleBackgroundAttachment;
    "font-size": PurpleBackgroundAttachment;
    "line-height": LineHeight;
    "font-stretch": PurpleBackgroundAttachment;
    "font-variant": PurpleBackgroundAttachment;
    "font-family": FontFamily;
}
interface FontFamily {
    types: string[];
    default: any[];
    keywords: string[];
    required: boolean;
    multiple: boolean;
    separator: Separator;
}
interface FontWeight {
    types: string[];
    default: string[];
    keywords: string[];
    constraints: FontWeightConstraints;
    mapping: FontWeightMapping;
}
interface FontWeightConstraints {
    value: Value;
}
interface Value {
    min: string;
    max: string;
}
interface FontWeightMapping {
    thin: string;
    hairline: string;
    "extra light": string;
    "ultra light": string;
    light: string;
    normal: string;
    regular: string;
    medium: string;
    "semi bold": string;
    "demi bold": string;
    bold: string;
    "extra bold": string;
    "ultra bold": string;
    black: string;
    heavy: string;
    "extra black": string;
    "ultra black": string;
}
interface LineHeight {
    types: string[];
    default: string[];
    keywords: string[];
    previous: string;
    prefix: Prefix;
}
interface Outline {
    shorthand: string;
    pattern: string;
    keywords: string[];
    default: string[];
    properties: OutlineProperties;
}
interface OutlineProperties {
    "outline-color": PurpleBackgroundAttachment;
    "outline-style": PurpleBackgroundAttachment;
    "outline-width": PurpleBackgroundAttachment;
}
interface PropertiesConfigProperties {
    inset: BorderRadius;
    top: BackgroundPositionClass;
    right: BackgroundPositionClass;
    bottom: BackgroundPositionClass;
    left: BackgroundPositionClass;
    margin: BorderRadius;
    "margin-top": BackgroundPositionClass;
    "margin-right": BackgroundPositionClass;
    "margin-bottom": BackgroundPositionClass;
    "margin-left": BackgroundPositionClass;
    padding: BorderColor;
    "padding-top": BackgroundPositionClass;
    "padding-right": BackgroundPositionClass;
    "padding-bottom": BackgroundPositionClass;
    "padding-left": BackgroundPositionClass;
    "border-radius": BorderRadius;
    "border-top-left-radius": BackgroundPositionClass;
    "border-top-right-radius": BackgroundPositionClass;
    "border-bottom-right-radius": BackgroundPositionClass;
    "border-bottom-left-radius": BackgroundPositionClass;
    "border-width": BorderColor;
    "border-top-width": BackgroundPositionClass;
    "border-right-width": BackgroundPositionClass;
    "border-bottom-width": BackgroundPositionClass;
    "border-left-width": BackgroundPositionClass;
    "border-style": BorderColor;
    "border-top-style": BackgroundPositionClass;
    "border-right-style": BackgroundPositionClass;
    "border-bottom-style": BackgroundPositionClass;
    "border-left-style": BackgroundPositionClass;
    "border-color": BorderColor;
    "border-top-color": BackgroundPositionClass;
    "border-right-color": BackgroundPositionClass;
    "border-bottom-color": BackgroundPositionClass;
    "border-left-color": BackgroundPositionClass;
}
interface BorderColor {
    shorthand: string;
    map?: string;
    properties: string[];
    types: string[];
    keywords: string[];
}
interface BorderRadius {
    shorthand: string;
    properties: string[];
    types: string[];
    multiple: boolean;
    separator: null | string;
    keywords: string[];
}

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
    minify?: boolean;
    nestingRules?: boolean;
    removeEmpty?: boolean;
    resolveUrls?: boolean;
    resolveImport?: boolean;
    cwd?: string;
    load?: (url: string, currentUrl: string) => Promise<string>;
    resolve?: (url: string, currentUrl: string, currentWorkingDirectory?: string) => { absolute: string, relative: string };
    nodeEventFilter?: NodeType[]
}

interface RenderOptions {

    minify?: boolean;
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
    hint?: string;
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

    typ: 'Rule';
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
declare function isIdentStart(codepoint: number): boolean;
declare function isDigit(codepoint: number): boolean;
declare function isIdentCodepoint(codepoint: number): boolean;
declare function isIdent(name: string): boolean;
declare function isPseudo(name: string): boolean;
declare function isHash(name: string): boolean;
declare function isNumber(name: string): boolean;
declare function isDimension(name: string): boolean;
declare function isPercentage(name: string): boolean;
declare function parseDimension(name: string): DimensionToken | LengthToken | AngleToken;
declare function isHexColor(name: string): boolean;
declare function isHexDigit(name: string): boolean;
declare function isFunction(name: string): boolean;
declare function isAtKeyword(name: string): boolean;
declare function isNewLine(codepoint: number): boolean;
declare function isWhiteSpace(codepoint: number): boolean;

declare const getConfig: () => PropertiesConfig;

declare function matchType(val: Token, properties: PropertyMapType): boolean;

declare function render(data: AstNode, opt?: RenderOptions): RenderResult;
declare function renderToken(token: Token, options?: RenderOptions, reducer?: (acc: string, curr: Token) => string): string;

declare const combinators: string[];
declare function minify(ast: AstNode, options?: ParserOptions, recursive?: boolean): AstNode;
declare function reduceSelector(selector: string[][]): {
    match: boolean;
    optimized: string[];
    selector: string[][];
    reducible: boolean;
} | null;
declare function hasDeclaration(node: AstRule): boolean;
declare function minifyRule(ast: AstRule | AstAtRule): AstRule | AstAtRule;

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

export { combinators, dirname, getConfig, hasDeclaration, isAngle, isAtKeyword, isDigit, isDimension, isFrequency, isFunction, isHash, isHexColor, isHexDigit, isIdent, isIdentCodepoint, isIdentStart, isLength, isNewLine, isNumber, isPercentage, isPseudo, isResolution, isTime, isWhiteSpace, load, matchType, matchUrl, minify, minifyRule, parse, parseDimension, parseString, reduceSelector, render, renderToken, resolve, tokenize, transform, urlTokenMatcher, walk };
