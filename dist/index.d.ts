declare enum EnumToken {
    CommentTokenType = 0,
    CDOCOMMTokenType = 1,
    StyleSheetNodeType = 2,
    AtRuleNodeType = 3,
    RuleNodeType = 4,
    DeclarationNodeType = 5,
    LiteralTokenType = 6,
    IdenTokenType = 7,
    DashedIdenTokenType = 8,
    CommaTokenType = 9,
    ColonTokenType = 10,
    SemiColonTokenType = 11,
    NumberTokenType = 12,
    AtRuleTokenType = 13,
    PercentageTokenType = 14,
    FunctionTokenType = 15,
    TimelineFunctionTokenType = 16,
    TimingFunctionTokenType = 17,
    UrlFunctionTokenType = 18,
    ImageFunctionTokenType = 19,
    StringTokenType = 20,
    UnclosedStringTokenType = 21,
    DimensionTokenType = 22,
    LengthTokenType = 23,
    AngleTokenType = 24,
    TimeTokenType = 25,
    FrequencyTokenType = 26,
    ResolutionTokenType = 27,
    HashTokenType = 28,
    BlockStartTokenType = 29,
    BlockEndTokenType = 30,
    AttrStartTokenType = 31,
    AttrEndTokenType = 32,
    StartParensTokenType = 33,
    EndParensTokenType = 34,
    ParensTokenType = 35,
    WhitespaceTokenType = 36,
    IncludeMatchTokenType = 37,
    DashMatchTokenType = 38,
    EqualMatchTokenType = 39,
    LtTokenType = 40,
    LteTokenType = 41,
    GtTokenType = 42,
    GteTokenType = 43,
    PseudoClassTokenType = 44,
    PseudoClassFuncTokenType = 45,
    DelimTokenType = 46,
    UrlTokenTokenType = 47,
    EOFTokenType = 48,
    ImportantTokenType = 49,
    ColorTokenType = 50,
    AttrTokenType = 51,
    BadCommentTokenType = 52,
    BadCdoTokenType = 53,
    BadUrlTokenType = 54,
    BadStringTokenType = 55,
    BinaryExpressionTokenType = 56,
    UnaryExpressionTokenType = 57,
    FlexTokenType = 58,
    ListToken = 59,
    Add = 60,
    Mul = 61,
    Div = 62,
    Sub = 63,
    ColumnCombinatorTokenType = 64,
    ContainMatchTokenType = 65,
    StartMatchTokenType = 66,
    EndMatchTokenType = 67,
    MatchExpressionTokenType = 68,
    NameSpaceAttributeTokenType = 69,
    FractionTokenType = 70,
    IdenListTokenType = 71,
    GridTemplateFuncTokenType = 72,
    KeyFrameRuleNodeType = 73,
    ClassSelectorTokenType = 74,
    UniversalSelectorTokenType = 75,
    ChildCombinatorTokenType = 76,// >
    DescendantCombinatorTokenType = 77,// whitespace
    NextSiblingCombinatorTokenType = 78,// +
    SubsequentSiblingCombinatorTokenType = 79,// ~
    NestingSelectorTokenType = 80,// &
    InvalidRuleTokenType = 81,
    InvalidClassSelectorTokenType = 82,
    InvalidAttrTokenType = 83,
    InvalidAtRuleTokenType = 84,
    MediaQueryConditionTokenType = 85,
    MediaFeatureTokenType = 86,
    MediaFeatureOnlyTokenType = 87,
    MediaFeatureNotTokenType = 88,
    MediaFeatureAndTokenType = 89,
    MediaFeatureOrTokenType = 90,
    PseudoPageTokenType = 91,
    Time = 25,
    Iden = 7,
    EOF = 48,
    Hash = 28,
    Flex = 58,
    Angle = 24,
    Color = 50,
    Comma = 9,
    String = 20,
    Length = 23,
    Number = 12,
    Perc = 14,
    Literal = 6,
    Comment = 0,
    UrlFunc = 18,
    Dimension = 22,
    Frequency = 26,
    Resolution = 27,
    Whitespace = 36,
    IdenList = 71,
    DashedIden = 8,
    GridTemplateFunc = 72,
    ImageFunc = 19,
    CommentNodeType = 0,
    CDOCOMMNodeType = 1,
    TimingFunction = 17,
    TimelineFunction = 16
}

declare function minify(ast: AstNode, options?: ParserOptions | MinifyOptions, recursive?: boolean, errors?: ErrorDescription[], nestingContent?: boolean, context?: {
    [key: string]: any;
}): AstNode;

declare enum WalkerValueEvent$1 {
    Enter = 0,
    Leave = 1
}
declare function walk(node: AstNode, filter?: WalkerFilter): Generator<WalkResult>;
declare function walkValues(values: Token[], root?: AstNode | Token | null, filter?: WalkerValueFilter | {
    event: WalkerValueEvent$1;
    fn?: WalkerValueFilter;
    type?: EnumToken | EnumToken[] | ((token: Token) => boolean);
}, reverse?: boolean): Generator<WalkAttributesResult>;

declare function expand(ast: AstNode): AstNode;

declare function renderToken(token: Token, options?: RenderOptions, cache?: {
    [key: string]: any;
}, reducer?: (acc: string, curr: Token) => string, errors?: ErrorDescription[]): string;

declare function parseString(src: string, options?: {
    location: boolean;
}): Token[];
declare function parseTokens(tokens: Token[], options?: ParseTokenOptions): Token[];

export declare interface LiteralToken extends BaseToken {

    typ: EnumToken.LiteralTokenType;
    val: string;
}

export declare interface ClassSelectorToken extends BaseToken {

    typ: EnumToken.ClassSelectorTokenType;
    val: string;
}

export declare interface InvalidClassSelectorToken extends BaseToken {

    typ: EnumToken.InvalidClassSelectorTokenType;
    val: string;
}

export declare interface UniversalSelectorToken extends BaseToken {

    typ: EnumToken.UniversalSelectorTokenType;
}


export declare interface IdentToken extends BaseToken {

    typ: EnumToken.IdenTokenType,
    val: string;
}

export declare interface IdentListToken extends BaseToken {

    typ: EnumToken.IdenListTokenType,
    val: string;
}

export declare interface DashedIdentToken extends BaseToken {

    typ: EnumToken.DashedIdenTokenType,
    val: string;
}

export declare interface CommaToken extends BaseToken {

    typ: EnumToken.CommaTokenType
}

export declare interface ColonToken extends BaseToken {

    typ: EnumToken.ColonTokenType
}

export declare interface SemiColonToken extends BaseToken {

    typ: EnumToken.SemiColonTokenType
}

export declare interface NestingSelectorToken extends BaseToken {

    typ: EnumToken.NestingSelectorTokenType
}

export declare interface NumberToken extends BaseToken {

    typ: EnumToken.NumberTokenType,
    val: string | FractionToken;
}

export declare interface AtRuleToken extends BaseToken {

    typ: EnumToken.AtRuleTokenType,
    val: string;
    pre: string;
}

export declare interface PercentageToken extends BaseToken {

    typ: EnumToken.PercentageTokenType,
    val: string | FractionToken;
}

export declare interface FlexToken extends BaseToken {

    typ: EnumToken.FlexTokenType,
    val: string | FractionToken;
}

export declare interface FunctionToken extends BaseToken {

    typ: EnumToken.FunctionTokenType,
    val: string;
    chi: Token[];
}

export declare interface GridTemplateFuncToken extends BaseToken {

    typ: EnumToken.GridTemplateFuncTokenType,
    val: string;
    chi: Token[];
}

export declare interface FunctionURLToken extends BaseToken {

    typ: EnumToken.UrlFunctionTokenType,
    val: 'url';
    chi: Array<UrlToken | CommentToken>;
}

export declare interface FunctionImageToken extends BaseToken {

    typ: EnumToken.ImageFunctionTokenType,
    val: 'linear-gradient' | 'radial-gradient' | 'repeating-linear-gradient' | 'repeating-radial-gradient' | 'conic-gradient' | 'image' | 'image-set' | 'element' | 'cross-fade';
    chi: Array<UrlToken | CommentToken>;
}

export declare interface TimingFunctionToken extends BaseToken {

    typ: EnumToken.TimingFunctionTokenType;
    val: string;
    chi: Token[];
}

export declare interface TimelineFunctionToken extends BaseToken {

    typ: EnumToken.TimelineFunctionTokenType;
    val: string;
    chi: Token[];
}

export declare interface StringToken extends BaseToken {

    typ: EnumToken.StringTokenType;
    val: string;
}

export declare interface BadStringToken extends BaseToken {

    typ: EnumToken.BadStringTokenType;
    val: string;
}

export declare interface UnclosedStringToken extends BaseToken {

    typ: EnumToken.UnclosedStringTokenType;
    val: string;
}

export declare interface DimensionToken extends BaseToken {

    typ: EnumToken.DimensionTokenType;
    val: string | FractionToken;
    unit: string;
}

export declare interface LengthToken extends BaseToken {

    typ: EnumToken.LengthTokenType;
    val: string | FractionToken;
    unit: string;
}

export declare interface AngleToken extends BaseToken {

    typ: EnumToken.AngleTokenType;
    val: string | FractionToken;
    unit: string;
}

export declare interface TimeToken extends BaseToken {

    typ: EnumToken.TimeTokenType;
    val: string | FractionToken;
    unit: 'ms' | 's';
}

export declare interface FrequencyToken extends BaseToken {

    typ: EnumToken.FrequencyTokenType;
    val: string | FractionToken;
    unit: 'Hz' | 'Khz';
}

export declare interface ResolutionToken extends BaseToken {

    typ: EnumToken.ResolutionTokenType;
    val: string | FractionToken;
    unit: 'dpi' | 'dpcm' | 'dppx' | 'x';
}

export declare interface HashToken extends BaseToken {

    typ: EnumToken.HashTokenType;
    val: string;
}

export declare interface BlockStartToken extends BaseToken {

    typ: EnumToken.BlockStartTokenType
}

export declare interface BlockEndToken extends BaseToken {

    typ: EnumToken.BlockEndTokenType
}

export declare interface AttrStartToken extends BaseToken {

    typ: EnumToken.AttrStartTokenType;
    chi?: Token[];
}

export declare interface AttrEndToken extends BaseToken {

    typ: EnumToken.AttrEndTokenType
}

export declare interface ParensStartToken extends BaseToken {

    typ: EnumToken.StartParensTokenType;
}

export declare interface ParensEndToken extends BaseToken {

    typ: EnumToken.EndParensTokenType
}

export declare interface ParensToken extends BaseToken {

    typ: EnumToken.ParensTokenType;
    chi: Token[];
}

export declare interface WhitespaceToken extends BaseToken {

    typ: EnumToken.WhitespaceTokenType
}

export declare interface CommentToken extends BaseToken {

    typ: EnumToken.CommentTokenType;
    val: string;
}

export declare interface BadCommentToken extends BaseToken {

    typ: EnumToken.BadCommentTokenType;
    val: string;
}

export declare interface CDOCommentToken extends BaseToken {

    typ: EnumToken.CDOCOMMTokenType;
    val: string;
}

export declare interface BadCDOCommentToken extends BaseToken {

    typ: EnumToken.BadCdoTokenType;
    val: string;
}

export declare interface IncludeMatchToken extends BaseToken {

    typ: EnumToken.IncludeMatchTokenType;
    // val: '~=';
}

export declare interface DashMatchToken extends BaseToken {

    typ: EnumToken.DashMatchTokenType;
    // val: '|=';
}

export declare interface EqualMatchToken extends BaseToken {

    typ: EnumToken.EqualMatchTokenType;
    // val: '|=';
}

export declare interface StartMatchToken extends BaseToken {

    typ: EnumToken.StartMatchTokenType;
    // val: '^=';
}

export declare interface EndMatchToken extends BaseToken {

    typ: EnumToken.EndMatchTokenType;
    // val: '|=';
}

export declare interface ContainMatchToken extends BaseToken {

    typ: EnumToken.ContainMatchTokenType;
    // val: '|=';
}

export declare interface LessThanToken extends BaseToken {

    typ: EnumToken.LtTokenType;
}

export declare interface LessThanOrEqualToken extends BaseToken {

    typ: EnumToken.LteTokenType;
}

export declare interface GreaterThanToken extends BaseToken {

    typ: EnumToken.GtTokenType;
}

export declare interface GreaterThanOrEqualToken extends BaseToken {

    typ: EnumToken.GteTokenType;
}

export declare interface ColumnCombinatorToken extends BaseToken {

    typ: EnumToken.ColumnCombinatorTokenType;
}

export declare interface PseudoClassToken extends BaseToken {

    typ: EnumToken.PseudoClassTokenType;
    val: string;
}

export declare interface PseudoPageToken extends BaseToken {

    typ: EnumToken.PseudoPageTokenType;
    val: string;
}

export declare interface PseudoClassFunctionToken extends BaseToken {

    typ: EnumToken.PseudoClassFuncTokenType;
    val: string;
    chi: Token[];
}

export declare interface DelimToken extends BaseToken {

    typ: EnumToken.DelimTokenType;
}

export declare interface BadUrlToken extends BaseToken {

    typ: EnumToken.BadUrlTokenType,
    val: string;
}

export declare interface UrlToken extends BaseToken {

    typ: EnumToken.UrlTokenTokenType,
    val: string;
}

export declare interface EOFToken extends BaseToken {

    typ: EnumToken.EOFTokenType;
}

export declare interface ImportantToken extends BaseToken {

    typ: EnumToken.ImportantTokenType;
}

export declare type ColorKind =
    'sys'
    | 'dpsys'
    | 'lit'
    | 'hex'
    | 'rgb'
    | 'rgba'
    | 'hsl'
    | 'hsla'
    | 'hwb'
    | 'device-cmyk'
    | 'oklab'
    | 'oklch'
    | 'lab'
    | 'lch'
    | 'color'
    | 'light-dark';

// export declare type HueInterpolationMethod = 'shorter' | 'longer' | 'increasing' | 'decreasing';

export declare interface ColorToken extends BaseToken {

    typ: EnumToken.ColorTokenType;
    val: string;
    kin: ColorKind;
    chi?: Token[];
    /* calculated */
    cal?: 'rel' | 'mix';
}

export declare interface AttrToken extends BaseToken {

    typ: EnumToken.AttrTokenType,
    chi: Token[]
}

export declare interface InvalidAttrToken extends BaseToken {

    typ: EnumToken.InvalidAttrTokenType,
    chi: Token[]
}

export declare interface ChildCombinatorToken extends BaseToken {

    typ: EnumToken.ChildCombinatorTokenType
}

export declare interface MediaFeatureToken extends BaseToken {

    typ: EnumToken.MediaFeatureTokenType,
    val: string;
}

export declare interface MediaFeatureOnlyToken extends BaseToken {

    typ: EnumToken.MediaFeatureOnlyTokenType,
    val: Token;
}

export declare interface MediaFeatureNotToken extends BaseToken {

    typ: EnumToken.MediaFeatureNotTokenType,
    val: Token;
}

export declare interface MediaFeatureNotToken extends BaseToken {

    typ: EnumToken.MediaFeatureNotTokenType,
    val: Token;
}

export declare interface MediaFeatureAndToken extends BaseToken {

    typ: EnumToken.MediaFeatureAndTokenType;
}

export declare interface MediaFeatureOrToken extends BaseToken {

    typ: EnumToken.MediaFeatureOrTokenType;
}

export declare interface MediaQueryConditionToken extends BaseToken {

    typ: EnumToken.MediaQueryConditionTokenType,
    l: Token,
    op: ColonToken | GreaterThanToken | LessThanToken | GreaterThanOrEqualToken | LessThanOrEqualToken,
    r: Token[]
}

export declare interface DescendantCombinatorToken extends BaseToken {

    typ: EnumToken.DescendantCombinatorTokenType
}

export declare interface NextSiblingCombinatorToken extends BaseToken {

    typ: EnumToken.NextSiblingCombinatorTokenType
}

export declare interface SubsequentCombinatorToken extends BaseToken {

    typ: EnumToken.SubsequentSiblingCombinatorTokenType
}

export declare interface AddToken extends BaseToken {

    typ: EnumToken.Add;
}

export declare interface SubToken extends BaseToken {

    typ: EnumToken.Sub;
}

export declare interface DivToken extends BaseToken {

    typ: EnumToken.Div;
}

export declare interface MulToken extends BaseToken {

    typ: EnumToken.Mul;
}

export declare interface UnaryExpression extends BaseToken {

    typ: EnumToken.UnaryExpressionTokenType
    sign: EnumToken.Add | EnumToken.Sub;
    val: UnaryExpressionNode;
}

export declare interface FractionToken extends BaseToken {

    typ: EnumToken.FractionTokenType;
    l: NumberToken;
    r: NumberToken;
}

export declare interface BinaryExpressionToken extends BaseToken {

    typ: EnumToken.BinaryExpressionTokenType
    op: EnumToken.Add | EnumToken.Sub | EnumToken.Div | EnumToken.Mul;
    l: BinaryExpressionNode | Token;
    r: BinaryExpressionNode | Token;
}

export declare interface MatchExpressionToken extends BaseToken {

    typ: EnumToken.MatchExpressionTokenType
    op: EqualMatchToken | DashMatchToken | StartMatchToken | ContainMatchToken | EndMatchToken | IncludeMatchToken;
    l: Token;
    r: Token;
    attr?: 'i' | 's';
}

export declare interface NameSpaceAttributeToken extends BaseToken {

    typ: EnumToken.NameSpaceAttributeTokenType
    l?: Token;
    r: Token;
}

export declare interface ListToken extends BaseToken {

    typ: EnumToken.ListToken
    chi: Token[];
}

export declare type UnaryExpressionNode =
    BinaryExpressionNode
    | NumberToken
    | DimensionToken
    | TimeToken
    | LengthToken
    | AngleToken
    | FrequencyToken;

export declare type BinaryExpressionNode = NumberToken | DimensionToken | PercentageToken | FlexToken | FractionToken |
    AngleToken | LengthToken | FrequencyToken | BinaryExpressionToken | FunctionToken | ParensToken;

export declare type Token =
    InvalidClassSelectorToken
    | InvalidAttrToken
    |
    LiteralToken
    | IdentToken
    | IdentListToken
    | DashedIdentToken
    | CommaToken
    | ColonToken
    | SemiColonToken
    | ClassSelectorToken
    | UniversalSelectorToken
    | ChildCombinatorToken
    | DescendantCombinatorToken
    | NextSiblingCombinatorToken
    | SubsequentCombinatorToken
    | ColumnCombinatorToken
    | NestingSelectorToken
    |
    MediaQueryConditionToken
    | MediaFeatureToken
    | MediaFeatureNotToken
    | MediaFeatureOnlyToken
    | MediaFeatureAndToken
    | MediaFeatureOrToken
    | AstDeclaration
    |
    NumberToken
    | AtRuleToken
    | PercentageToken
    | FlexToken
    | FunctionURLToken
    | FunctionImageToken
    | TimingFunctionToken
    | TimelineFunctionToken
    | FunctionToken
    | GridTemplateFuncToken
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
    | ContainMatchToken
    | MatchExpressionToken
    | NameSpaceAttributeToken
    |
    DashMatchToken
    | EqualMatchToken
    | LessThanToken
    | LessThanOrEqualToken
    | GreaterThanToken
    | GreaterThanOrEqualToken
    |
    ListToken
    | PseudoClassToken
    | PseudoPageToken
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

export declare interface Position {

    ind: number;
    lin: number;
    col: number;
}

export declare interface Location {

    sta: Position;
    // end: Position;
    src: string;
}

export declare interface BaseToken {

    typ: EnumToken;
    loc?: Location;
    tokens?: Token[];
    parent?: AstRuleList;
}

export declare interface AstComment extends BaseToken {

    typ: EnumToken.CommentNodeType | EnumToken.CDOCOMMNodeType,
    val: string;
}

export declare interface AstDeclaration extends BaseToken {

    nam: string,
    val: Token[];
    typ: EnumToken.DeclarationNodeType
}


export declare interface AstRule extends BaseToken {

    typ: EnumToken.RuleNodeType;
    sel: string;
    chi: Array<AstDeclaration | AstComment | AstRuleList>;
    optimized?: OptimizedSelector;
    raw?: RawSelectorTokens;
}

export declare interface AstInvalidRule extends BaseToken {

    typ: EnumToken.InvalidRuleTokenType;
    sel: string;
    chi: Array<AstDeclaration | AstComment | AstRuleList>;
}

export declare interface AstInvalidAtRule extends BaseToken {

    typ: EnumToken.InvalidAtRuleTokenType;
    val: string;
    chi?: Array<AstNode>;
}



export declare interface AstKeyFrameRule extends BaseToken {

    typ: EnumToken.KeyFrameRuleNodeType;
    sel: string;
    chi: Array<AstDeclaration | AstComment>;
    optimized?: OptimizedSelector;
    raw?: RawSelectorTokens;
}

export declare type RawSelectorTokens = string[][];

export declare interface OptimizedSelector {
    match: boolean;
    optimized: string[];
    selector: string[][],
    reducible: boolean;
}

export declare interface AstAtRule extends BaseToken {

    typ: EnumToken.AtRuleNodeType,
    nam: string;
    val: string;
    chi?: Array<AstDeclaration | AstComment> | Array<AstRule | AstComment>
}

export declare interface AstRuleList extends BaseToken {

    typ:  EnumToken.StyleSheetNodeType |  EnumToken.RuleNodeType |  EnumToken.AtRuleNodeType,
    chi: Array<BaseToken | AstComment>;
}

export declare interface AstRuleStyleSheet extends AstRuleList {
    typ:  EnumToken.StyleSheetNodeType,
    chi: Array<AstRuleList | AstComment>
}

export declare type AstNode =
    AstRuleStyleSheet
    | AstRuleList
    | AstComment
    | AstAtRule
    | AstRule
    | AstDeclaration
    | AstKeyFrameRule
    | AstInvalidRule
    | AstInvalidAtRule;

/**
 * Declaration visitor handler
 */
export declare type DeclarationVisitorHandler = (node: AstDeclaration) => AstDeclaration | AstDeclaration[] | null | Promise<AstDeclaration | AstDeclaration[] | null>;
/**
 * Rule visitor handler
 */
export declare type RuleVisitorHandler = (node: AstRule) => AstRule | AstRule[] | null | Promise<AstRule | AstRule[] | null>;

/**
 * AtRule visitor handler
 */
export declare type AtRuleVisitorHandler = (node: AstAtRule) => AstAtRule | AstAtRule[] | null | Promise<AstAtRule | AstAtRule[] | null>;

/**
 * Value visitor handler
 */
export declare type ValueVisitorHandler = (node: Token) => Token | Token[] | null | Promise<Token | Token[] | null>;


export declare interface VisitorNodeMap {

    AtRule?: Record<string, AtRuleVisitorHandler> | AtRuleVisitorHandler;
    Declaration?: Record<string, DeclarationVisitorHandler> | DeclarationVisitorHandler;
    Rule?: RuleVisitorHandler;
    Value?: Record<EnumToken, ValueVisitorHandler> | ValueVisitorHandler;
}

declare class SourceMap {
    #private;
    lastLocation: Location | null;
    add(source: Location, original: Location): void;
    toUrl(): string;
    toJSON(): SourceMapObject;
}

export declare interface PropertyListOptions {

    removeDuplicateDeclarations?: boolean;
    computeShorthand?: boolean;
}

export declare type WalkerOption = 'ignore' | 'stop' | 'children' | 'ignore-children' | Token | null;
/**
 * returned value:
 * - 'ignore': ignore this node and its children
 * - 'stop': stop walking the tree
 * - 'children': walk the children and ignore the node itself
 * - 'ignore-children': walk the node and ignore children
 */
export declare type WalkerFilter = (node: AstNode) => WalkerOption;

/**
 * returned value:
 * - 'ignore': ignore this node and its children
 * - 'stop': stop walking the tree
 * - 'children': walk the children and ignore the node itself
 * - 'ignore-children': walk the node and ignore children
 */
export declare type WalkerValueFilter = (node: AstNode | Token, parent: FunctionToken | ParensToken | BinaryExpressionToken, event?: WalkerValueEvent) => WalkerOption | null;

export declare interface WalkResult {
    node: AstNode;
    parent?: AstRuleList;
    root?: AstNode;
}

export declare interface WalkAttributesResult {
    value: Token;
    previousValue: Token | null;
    nextValue: Token | null;
    root?: AstNode;
    parent: FunctionToken | ParensToken | BinaryExpressionToken | null;
    list: Token[] | null;
}

export declare interface ErrorDescription {

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

interface ValidationOptions {

    validation?: boolean;
}

export declare interface ParserOptions extends ValidationOptions, PropertyListOptions {

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
    parseColor?: boolean;
    removeDuplicateDeclarations?: boolean;
    computeShorthand?: boolean;
    removePrefix?: boolean;
    inlineCssVariables?: boolean;
    computeCalcExpression?: boolean;
    load?: (url: string, currentUrl: string) => Promise<string>;
    dirname?: (path: string) => string;
    resolve?: (url: string, currentUrl: string, currentWorkingDirectory?: string) => {
        absolute: string;
        relative: string;
    };
    visitor?: VisitorNodeMap;
    signal?: AbortSignal;
    setParent?: boolean;
}

export declare interface MinifyOptions extends ParserOptions {

    features: MinifyFeature[];
}

export declare interface MinifyFeature {

    ordering: number;

    register(options: MinifyOptions | ParserOptions): void;

    // run(ast: AstRule | AstAtRule, options: ParserOptions = {}, parent: AstRule | AstAtRule | AstRuleStyleSheet, context: { [key: string]: any }): void;

    // cleanup?(ast: AstRuleStyleSheet, options: ParserOptions = {}, context: { [key: string]: any }): void;
}

export declare interface MinifyFeature {

    ordering: number;

    register: (options: MinifyOptions | ParserOptions) => void;

    run: (ast: AstRule | AstAtRule, options: ParserOptions, parent: AstRule | AstAtRule | AstRuleStyleSheet, context: {
        [key: string]: any
    }) => void;
}

export declare interface ResolvedPath {
    absolute: string;
    relative: string;
}

export declare interface RenderOptions {

    minify?: boolean;
    removeEmpty?: boolean;
    expandNestingRules?: boolean;
    preserveLicense?: boolean;
    sourcemap?: boolean;
    indent?: string;
    newLine?: string;
    removeComments?: boolean;
    convertColor?: boolean;
    withParents?: boolean;
    output?: string;
    cwd?: string;
    load?: (url: string, currentUrl: string) => Promise<string>;
    resolve?: (url: string, currentUrl: string, currentWorkingDirectory?: string) => ResolvedPath;

}

export declare interface TransformOptions extends ParserOptions, RenderOptions {

}

export declare interface ParseResult {
    ast: AstRuleStyleSheet;
    errors: ErrorDescription[];
    stats: {
        bytesIn: number;
        parse: string;
        minify: string;
        total: string;
    }
}

export declare interface RenderResult {
    code: string;
    errors: ErrorDescription[];
    stats: {
        total: string;
    },
    map?: SourceMap
}

export declare interface TransformResult extends ParseResult, RenderResult {

    stats: {
        bytesIn: number;
        bytesOut: number;
        parse: string;
        minify: string;
        render: string;
        total: string;
    }
}

export declare interface ParseTokenOptions extends ParserOptions {
}

export declare interface SourceMapObject {
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

/**
 * render ast node
 */
declare function render(data: AstNode, options?: RenderOptions): RenderResult;
/**
 * parse css
 */
declare function parse(iterator: string, opt?: ParserOptions): Promise<ParseResult>;
/**
 * parse and render css
 */
declare function transform(css: string, options?: TransformOptions): Promise<TransformResult>;

export { EnumToken, dirname, expand, load, minify, parse, parseString, parseTokens, render, renderToken, resolve, transform, walk, walkValues };
