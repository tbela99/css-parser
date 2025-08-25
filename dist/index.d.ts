/**
 * syntax validation enum
 */
declare enum SyntaxValidationResult {
    /** valid syntax */
    Valid = 0,
    /** drop invalid syntax */
    Drop = 1,
    /** preserve unknown at-rules, declarations and pseudo-classes */
    Lenient = 2
}
/**
 * enum of validation levels
 */
declare enum ValidationLevel {
    /**
     * disable validation
     */
    None = 0,
    /**
     * validate selectors and at-rules
     */
    Default = 1,// selectors + at-rules
    /**
     * validate selectors, at-rules and declarations
     */
    All = 2
}
/**
 * enum of all token types
 */
declare enum EnumToken {
    /**
     * comment token
     */
    CommentTokenType = 0,
    /**
     * cdata section token
     */
    CDOCOMMTokenType = 1,
    /**
     * style sheet node type
     */
    StyleSheetNodeType = 2,
    /**
     * at-rule node type
     */
    AtRuleNodeType = 3,
    /**
     * rule node type
     */
    RuleNodeType = 4,
    /**
     * declaration node type
     */
    DeclarationNodeType = 5,
    /**
     * literal token type
     */
    LiteralTokenType = 6,
    /**
     * identifier token type
     */
    IdenTokenType = 7,
    /**
     * dashed identifier token type
     */
    DashedIdenTokenType = 8,
    /**
     * comma token type
     */
    CommaTokenType = 9,
    /**
     * colon token type
     */
    ColonTokenType = 10,
    /**
     * semicolon token type
     */
    SemiColonTokenType = 11,
    /**
     * number token type
     */
    NumberTokenType = 12,
    /**
     * at-rule token type
     */
    AtRuleTokenType = 13,
    /**
     * percentage token type
     */
    PercentageTokenType = 14,
    /**
     * function token type
     */
    FunctionTokenType = 15,
    /**
     * timeline function token type
     */
    TimelineFunctionTokenType = 16,
    /**
     * timing function token type
     */
    TimingFunctionTokenType = 17,
    /**
     * url function token type
     */
    UrlFunctionTokenType = 18,
    /**
     * image function token type
     */
    ImageFunctionTokenType = 19,
    /**
     * string token type
     */
    StringTokenType = 20,
    /**
     * unclosed string token type
     */
    UnclosedStringTokenType = 21,
    /**
     * dimension token type
     */
    DimensionTokenType = 22,
    /**
     * length token type
     */
    LengthTokenType = 23,
    /**
     * angle token type
     */
    AngleTokenType = 24,
    /**
     * time token type
     */
    TimeTokenType = 25,
    /**
     * frequency token type
     */
    FrequencyTokenType = 26,
    /**
     * resolution token type
     */
    ResolutionTokenType = 27,
    /**
     * hash token type
     */
    HashTokenType = 28,
    /**
     * block start token type
     */
    BlockStartTokenType = 29,
    /**
     * block end token type
     */
    BlockEndTokenType = 30,
    /**
     * attribute start token type
     */
    AttrStartTokenType = 31,
    /**
     * attribute end token type
     */
    AttrEndTokenType = 32,
    /**
     * start parentheses token type
     */
    StartParensTokenType = 33,
    /**
     * end parentheses token type
     */
    EndParensTokenType = 34,
    /**
     * parentheses token type
     */
    ParensTokenType = 35,
    /**
     * whitespace token type
     */
    WhitespaceTokenType = 36,
    /**
     * include match token type
     */
    IncludeMatchTokenType = 37,
    /**
     * dash match token type
     */
    DashMatchTokenType = 38,
    /**
     * equal match token type
     */
    EqualMatchTokenType = 39,
    /**
     * less than token type
     */
    LtTokenType = 40,
    /**
     * less than or equal to token type
     */
    LteTokenType = 41,
    /**
     * greater than token type
     */
    GtTokenType = 42,
    /**
     * greater than or equal to token type
     */
    GteTokenType = 43,
    /**
     * pseudo-class token type
     */
    PseudoClassTokenType = 44,
    /**
     * pseudo-class function token type
     */
    PseudoClassFuncTokenType = 45,
    /**
     * delimiter token type
     */
    DelimTokenType = 46,
    /**
     * URL token type
     */
    UrlTokenTokenType = 47,
    /**
     * end of file token type
     */
    EOFTokenType = 48,
    /**
     * important token type
     */
    ImportantTokenType = 49,
    /**
     * color token type
     */
    ColorTokenType = 50,
    /**
     * attribute token type
     */
    AttrTokenType = 51,
    /**
     * bad comment token type
     */
    BadCommentTokenType = 52,
    /**
     * bad cdo token type
     */
    BadCdoTokenType = 53,
    /**
     * bad URL token type
     */
    BadUrlTokenType = 54,
    /**
     * bad string token type
     */
    BadStringTokenType = 55,
    /**
     * binary expression token type
     */
    BinaryExpressionTokenType = 56,
    /**
     * unary expression token type
     */
    UnaryExpressionTokenType = 57,
    /**
     * flex token type
     */
    FlexTokenType = 58,
    /**
     *  token list token type
     */
    ListToken = 59,
    /**
     * addition token type
     */
    Add = 60,
    /**
     * multiplication token type
     */
    Mul = 61,
    /**
     * division token type
     */
    Div = 62,
    /**
     * subtraction token type
     */
    Sub = 63,
    /**
     * column combinator token type
     */
    ColumnCombinatorTokenType = 64,
    /**
     * contain match token type
     */
    ContainMatchTokenType = 65,
    /**
     * start match token type
     */
    StartMatchTokenType = 66,
    /**
     * end match token type
     */
    EndMatchTokenType = 67,
    /**
     * match expression token type
     */
    MatchExpressionTokenType = 68,
    /**
     * namespace attribute token type
     */
    NameSpaceAttributeTokenType = 69,
    /**
     * fraction token type
     */
    FractionTokenType = 70,
    /**
     * identifier list token type
     */
    IdenListTokenType = 71,
    /**
     * grid template function token type
     */
    GridTemplateFuncTokenType = 72,
    /**
     * keyframe rule node type
     */
    KeyFrameRuleNodeType = 73,
    /**
     * class selector token type
     */
    ClassSelectorTokenType = 74,
    /**
     * universal selector token type
     */
    UniversalSelectorTokenType = 75,
    /**
     * child combinator token type
     */
    ChildCombinatorTokenType = 76,// >
    /**
     * descendant combinator token type
     */
    DescendantCombinatorTokenType = 77,// whitespace
    /**
     * next sibling combinator token type
     */
    NextSiblingCombinatorTokenType = 78,// +
    /**
     * subsequent sibling combinator token type
     */
    SubsequentSiblingCombinatorTokenType = 79,// ~
    /**
     * nesting selector token type
     */
    NestingSelectorTokenType = 80,// &
    /**
     * invalid rule token type
     */
    InvalidRuleTokenType = 81,
    /**
     * invalid class selector token type
     */
    InvalidClassSelectorTokenType = 82,
    /**
     * invalid attribute token type
     */
    InvalidAttrTokenType = 83,
    /**
     * invalid at rule token type
     */
    InvalidAtRuleTokenType = 84,
    /**
     * media query condition token type
     */
    MediaQueryConditionTokenType = 85,
    /**
     * media feature token type
     */
    MediaFeatureTokenType = 86,
    /**
     * media feature only token type
     */
    MediaFeatureOnlyTokenType = 87,
    /**
     * media feature not token type
     */
    MediaFeatureNotTokenType = 88,
    /**
     * media feature and token type
     */
    MediaFeatureAndTokenType = 89,
    /**
     * media feature or token type
     */
    MediaFeatureOrTokenType = 90,
    /**
     * pseudo page token type
     */
    PseudoPageTokenType = 91,
    /**
     * pseudo element token type
     */
    PseudoElementTokenType = 92,
    /**
     * keyframe at rule node type
     */
    KeyframeAtRuleNodeType = 93,
    /**
     * invalid declaration node type
     */
    InvalidDeclarationNodeType = 94,
    /**
     * alias for time token type
     */
    Time = 25,
    /**
     * alias for identifier token type
     */
    Iden = 7,
    /**
     * alias for end of file token type
     */
    EOF = 48,
    /**
     * alias for hash token type
     */
    Hash = 28,
    /**
     * alias for flex token type
     */
    Flex = 58,
    /**
     * alias for angle token type
     */
    Angle = 24,
    /**
     * alias for color token type
     */
    Color = 50,
    /**
     * alias for comma token type
     */
    Comma = 9,
    /**
     * alias for string token type
     */
    String = 20,
    /**
     * alias for length token type
     */
    Length = 23,
    /**
     * alias for number token type
     */
    Number = 12,
    /**
     * alias for percentage token type
     */
    Perc = 14,
    /**
     * alias for literal token type
     */
    Literal = 6,
    /**
     * alias for comment token type
     */
    Comment = 0,
    /**
     * alias for url function token type
     */
    UrlFunc = 18,
    /**
     * alias for dimension token type
     */
    Dimension = 22,
    /**
     * alias for frequency token type
     */
    Frequency = 26,
    /**
     * alias for resolution token type
     */
    Resolution = 27,
    /**
     * alias for whitespace token type
     */
    Whitespace = 36,
    /**
     * alias for identifier list token type
     */
    IdenList = 71,
    /**
     * alias for dashed identifier token type
     */
    DashedIden = 8,
    /**
     * alias for grid template function token type
     */
    GridTemplateFunc = 72,
    /**
     * alias for image function token type
     */
    ImageFunc = 19,
    /**
     * alias for comment node type
     */
    CommentNodeType = 0,
    /**
     * alias for cdata section node type
     */
    CDOCOMMNodeType = 1,
    /**
     * alias for timing function token type
     */
    TimingFunction = 17,
    /**
     * alias for timeline function token type
     */
    TimelineFunction = 16
}
/**
 * supported color types enum
 */
declare enum ColorType {
    /**
     * system colors
     */
    SYS = 0,
    /**
     * deprecated system colors
     */
    DPSYS = 1,
    /**
     * colors as literals
     */
    LIT = 2,
    /**
     * colors as hex values
     */
    HEX = 3,
    /**
     * colors as rgb values
     */
    RGBA = 4,
    /**
     * colors as hsl values
     */
    HSLA = 5,
    /**
     * colors as hwb values
     */
    HWB = 6,
    /**
     * colors as cmyk values
     */
    CMYK = 7,
    /**
     * colors as oklab values
     * */
    OKLAB = 8,
    /**
     * colors as oklch values
     * */
    OKLCH = 9,
    /**
     * colors as lab values
     */
    LAB = 10,
    /**
     * colors as lch values
     */
    LCH = 11,
    /**
     * colors using color() function
     */
    COLOR = 12,
    /**
     * color using srgb values
     */
    SRGB = 13,
    /**
     * color using prophoto-rgb values
     */
    PROPHOTO_RGB = 14,
    /**
     * color using a98-rgb values
     */
    A98_RGB = 15,
    /**
     * color using rec2020 values
     */
    REC2020 = 16,
    /**
     * color using display-p3 values
     */
    DISPLAY_P3 = 17,
    /**
     * color using srgb-linear values
     */
    SRGB_LINEAR = 18,
    /**
     * color using xyz-d50 values
     */
    XYZ_D50 = 19,
    /**
     * color using xyz-d65 values
     */
    XYZ_D65 = 20,
    /**
     * light-dark() color function
     */
    LIGHT_DARK = 21,
    /**
     * color-mix() color function
     */
    COLOR_MIX = 22,
    /**
     * alias for rgba
     */
    RGB = 4,
    /**
     * alias for hsl
     */
    HSL = 5,
    /**
     * alias for xyz-d65
     */
    XYZ = 20,
    /**
     * alias for cmyk
     */
    DEVICE_CMYK = 7
}

/**
 * apply minification rules to the ast tree
 * @param ast
 * @param options
 * @param recursive
 * @param errors
 * @param nestingContent
 *
 * @private
 */
declare function minify(ast: AstNode, options: ParserOptions | MinifyFeatureOptions, recursive: boolean, errors?: ErrorDescription[], nestingContent?: boolean): AstNode;

declare enum WalkerOptionEnum {
    /**
     * ignore the current node and its children
     */
    Ignore = 0,
    /**
     * stop walking the tree
     */
    Stop = 1,
    /**
     * ignore node and process children
     */
    Children = 2,
    /**
     * ignore children
     */
    IgnoreChildren = 3
}
declare enum WalkerValueEvent {
    /**
     * enter node
     */
    Enter = 0,
    /**
     * leave node
     */
    Leave = 1
}
/**
 * walk ast nodes
 * @param node
 * @param filter
 */
declare function walk(node: AstNode, filter?: WalkerFilter): Generator<WalkResult>;
/**
 * walk ast node value tokens
 * @param values
 * @param root
 * @param filter
 * @param reverse
 */
declare function walkValues(values: Token[], root?: AstNode | Token | null, filter?: WalkerValueFilter | {
    event?: WalkerValueEvent;
    fn?: WalkerValueFilter;
    type?: EnumToken | EnumToken[] | ((token: Token) => boolean);
}, reverse?: boolean): Generator<WalkAttributesResult>;

/**
 * expand css nesting ast nodes
 * @param ast
 *
 * @private
 */
declare function expand(ast: AstNode): AstNode;

/**
 *
 * @param token
 * @param options
 *
 * @private
 */
declare function renderToken(token: Token, options?: RenderOptions, cache?: {
    [key: string]: any;
}, reducer?: (acc: string, curr: Token) => string, errors?: ErrorDescription[]): string;

/**
 * Source map class
 * @internal
 */
declare class SourceMap {
    #private;
    /**
     * Last location
     */
    lastLocation: Location | null;
    /**
     * Add a location
     * @param source
     * @param original
     */
    add(source: Location, original: Location): void;
    /**
     * Convert to URL encoded string
     */
    toUrl(): string;
    /**
     * Convert to JSON object
     */
    toJSON(): SourceMapObject;
}

/**
 * parse a string as an array of declaration nodes
 * @param declaration
 *
 * Example:
 * ````ts
 *
 * const declarations = await parseDeclarations('color: red; background: blue');
 * console.log(declarations);
 * ```
 */
declare function parseDeclarations(declaration: string): Promise<AstDeclaration[]>;
/**
 * parse css string and return an array of tokens
 * @param src
 * @param options
 *
 * @private
 *
 * Example:
 *
 * ```ts
 *
 * import {parseString} from '@tbela99/css-parser';
 *
 * let tokens = parseString('body { color: red; }');
 * console.log(tokens);
 *
 *  tokens = parseString('#c322c980');
 * console.log(tokens);
 * ```
 */
declare function parseString(src: string, options?: {
    location: boolean;
}): Token[];
/**
 * parse function tokens in a token array
 * @param tokens
 * @param options
 *
 * Example:
 *
 * ```ts
 *
 * import {parseString, parseTokens} from '@tbela99/css-parser';
 *
 * let tokens = parseString('body { color: red; }');
 * console.log(parseTokens(tokens));
 *
 *  tokens = parseString('#c322c980');
 * console.log(parseTokens(tokens));
 * ```
 *
 * @private
 */
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
    val: number | FractionToken;
}

export declare interface AtRuleToken extends BaseToken {

    typ: EnumToken.AtRuleTokenType,
    val: string;
    pre: string;
}

export declare interface PercentageToken extends BaseToken {

    typ: EnumToken.PercentageTokenType,
    val: number | FractionToken;
}

export declare interface FlexToken extends BaseToken {

    typ: EnumToken.FlexTokenType,
    val: number | FractionToken;
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
    val: number | FractionToken;
    unit: string;
}

export declare interface LengthToken extends BaseToken {

    typ: EnumToken.LengthTokenType;
    val: number | FractionToken;
    unit: string;
}

export declare interface AngleToken extends BaseToken {

    typ: EnumToken.AngleTokenType;
    val: number | FractionToken;
    unit: string;
}

export declare interface TimeToken extends BaseToken {

    typ: EnumToken.TimeTokenType;
    val: number | FractionToken;
    unit: 'ms' | 's';
}

export declare interface FrequencyToken extends BaseToken {

    typ: EnumToken.FrequencyTokenType;
    val: number | FractionToken;
    unit: 'Hz' | 'Khz';
}

export declare interface ResolutionToken extends BaseToken {

    typ: EnumToken.ResolutionTokenType;
    val: number | FractionToken;
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

export declare interface PseudoElementToken extends BaseToken {

    typ: EnumToken.PseudoElementTokenType;
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

export declare interface ColorToken extends BaseToken {

    typ: EnumToken.ColorTokenType;
    val: string;
    kin: ColorType;
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

export declare interface MediaFeatureNotToken extends BaseToken {

    typ: EnumToken.MediaFeatureNotTokenType,
    val: Token;
}

export declare interface MediaFeatureOnlyToken extends BaseToken {

    typ: EnumToken.MediaFeatureOnlyTokenType,
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
    | PseudoElementToken
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

declare enum ValidationTokenEnum {
    Root = 0,
    Keyword = 1,
    PropertyType = 2,
    DeclarationType = 3,
    AtRule = 4,
    ValidationFunctionDefinition = 5,
    OpenBracket = 6,
    CloseBracket = 7,
    OpenParenthesis = 8,
    CloseParenthesis = 9,
    Comma = 10,
    Pipe = 11,
    Column = 12,
    Star = 13,
    OpenCurlyBrace = 14,
    CloseCurlyBrace = 15,
    HashMark = 16,
    QuestionMark = 17,
    Function = 18,
    Number = 19,
    Whitespace = 20,
    Parenthesis = 21,
    Bracket = 22,
    Block = 23,
    AtLeastOnce = 24,
    Separator = 25,
    Exclamation = 26,
    Ampersand = 27,
    PipeToken = 28,
    ColumnToken = 29,
    AmpersandToken = 30,
    Parens = 31,
    PseudoClassToken = 32,
    PseudoClassFunctionToken = 33,
    StringToken = 34,
    AtRuleDefinition = 35,
    DeclarationNameToken = 36,
    DeclarationDefinitionToken = 37,
    SemiColon = 38,
    Character = 39,
    InfinityToken = 40
}
declare const enum ValidationSyntaxGroupEnum {
    Declarations = "declarations",
    Functions = "functions",
    Syntaxes = "syntaxes",
    Selectors = "selectors",
    AtRules = "atRules"
}
interface Position$1 {
    ind: number;
    lin: number;
    col: number;
}
interface ValidationToken {
    typ: ValidationTokenEnum;
    pos: Position$1;
    isList?: boolean;
    text?: string;
    isRepeatable?: boolean;
    atLeastOnce?: boolean;
    isOptional?: boolean;
    isRepeatableGroup?: boolean;
    occurence?: {
        min: number;
        max: number | null;
    };
}

export declare interface ValidationSyntaxNode {

    syntax: string;
    ast?: ValidationToken[];
}

interface ValidationSelectorOptions extends ValidationOptions {

    nestedSelector?: boolean;
}

export declare interface ValidationConfiguration {

    [ValidationSyntaxGroupEnum.Declarations]: ValidationSyntaxNode;
    [ValidationSyntaxGroupEnum.Functions]: ValidationSyntaxNode;
    [ValidationSyntaxGroupEnum.Syntaxes]: ValidationSyntaxNode;
    [ValidationSyntaxGroupEnum.Selectors]: ValidationSyntaxNode;
    [ValidationSyntaxGroupEnum.AtRules]: ValidationSyntaxNode;
}

//= Record<keyof ValidationSyntaxGroupEnum, ValidationSyntaxNode>;

interface ValidationResult {

    valid: SyntaxValidationResult;
    node: AstNode | Token | null;
    syntax: ValidationToken | string | null;
    error: string;
    cycle?: boolean;
}

interface ValidationSyntaxResult extends ValidationResult {

    syntax: ValidationToken | string | null;
    context: Context<Token> | Token[];
}

interface Context<Type> {

    index: number;

    /**
     * The length of the context tokens to be consumed
     */

    readonly length: number;

    current<Type>(): Type | null;

    update<Type>(context: Context<Type>): void;

    consume<Type>(token: Type, howMany?: number): boolean;

    peek<Type>(): Type | null;

    // tokens<Type>(): Type[];

    next<Type>(): Type | null;

    consume<Type>(token: Type, howMany?: number): boolean;

    slice<Type>(): Type[];

    clone<Type>(): Context<Type>;

    done(): boolean;
}

/**
 * Converts a color to another color space
 * @param token
 * @param to
 *
 * <code>
 *
 *     const token = {typ: EnumToken.ColorTokenType, kin: ColorType.HEX, val: '#F00'}
 *     const result = convertColor(token, ColorType.LCH);
 *
 * </code>
 */
declare function convertColor(token: ColorToken, to: ColorType): ColorToken | null;

/**
 * Calculate the distance between two okLab colors.
 * @param okLab1
 * @param okLab2
 *
 * @private
 */
declare function okLabDistance(okLab1: [number, number, number], okLab2: [number, number, number]): number;
/**
 * Check if two colors are close in okLab space.
 * @param color1
 * @param color2
 * @param threshold
 *
 * @private
 */
declare function isOkLabClose(color1: ColorToken, color2: ColorToken, threshold?: number): boolean;

/**
 * Position
 */
export declare interface Position {

    /**
     * index in the source
     */
    ind: number;
    /**
     * line number
     */
    lin: number;
    /**
     * column number
     */
    col: number;
}

/**
 * token or node location
 */
export declare interface Location {

    /**
     * start position
     */
    sta: Position;
    /**
     * end position
     */
    end: Position;
    /**
     * source file
     */
    src: string;
}

export declare interface BaseToken {

    typ: EnumToken;
    loc?: Location;
    tokens?: Token[];
    parent?: AstRuleList;
    validSyntax?: boolean;
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
    optimized?: OptimizedSelector | null;
    raw?: RawSelectorTokens | null;
}

export declare interface AstInvalidRule extends BaseToken {

    typ: EnumToken.InvalidRuleTokenType;
    sel: string;
    chi: Array<AstNode>;
}

export declare interface AstInvalidDeclaration extends BaseToken {

    typ: EnumToken.InvalidDeclarationNodeType;
    val: Array<AstNode>;
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
    tokens?: Token[]
}

export declare type RawSelectorTokens = string[][];

export declare interface OptimizedSelector {
    match: boolean;
    optimized: string[];
    selector: string[][],
    reducible: boolean;
}

export declare interface OptimizedSelectorToken {
    match: boolean;
    optimized: Token[];
    selector: Token[][],
    reducible: boolean;
}

export declare interface AstAtRule extends BaseToken {

    typ: EnumToken.AtRuleNodeType,
    nam: string;
    val: string;
    chi?: Array<AstDeclaration | AstInvalidDeclaration | AstComment> | Array<AstRule | AstComment>
}

export declare interface AstKeyframeRule extends BaseToken {

    typ: EnumToken.KeyFrameRuleNodeType;
    sel: string;
    chi: Array<AstDeclaration | AstInvalidDeclaration | AstComment | AstRuleList>;
    optimized?: OptimizedSelector;
    raw?: RawSelectorTokens;
}

export declare interface AstKeyframAtRule extends BaseToken {

    typ: EnumToken.KeyframeAtRuleNodeType,
    nam: string;
    val: string;
    chi: Array<AstKeyframeRule | AstComment>;
}

export declare interface AstRuleList extends BaseToken {

    typ: EnumToken.StyleSheetNodeType | EnumToken.RuleNodeType | EnumToken.AtRuleNodeType | EnumToken.KeyframeAtRuleNodeType | EnumToken.KeyFrameRuleNodeType | EnumToken.InvalidRuleTokenType | EnumToken.InvalidAtRuleTokenType,
    chi: Array<BaseToken | AstComment>;
}

export declare interface AstRuleStyleSheet extends AstRuleList {
    typ: EnumToken.StyleSheetNodeType,
    chi: Array<AstRuleList | AstComment>
}

export declare type AstNode =
    AstRuleStyleSheet
    | AstRuleList
    | AstComment
    | AstAtRule
    | AstRule
    | AstDeclaration
    | AstKeyframAtRule
    | AstKeyFrameRule
    | AstInvalidRule
    | AstInvalidDeclaration;

/**
 * Declaration visitor handler
 */
export declare type DeclarationVisitorHandler = (node: AstDeclaration) => (AstDeclaration | AstDeclaration[] | null | Promise<AstDeclaration> | Promise<AstDeclaration[]> | Promise<null>);
/**
 * Rule visitor handler
 */
export declare type RuleVisitorHandler = (node: AstRule) => (AstRule | AstRule[] | null | Promise<AstRule> | Promise<AstRule[]> | Promise<null>);

/**
 * AtRule visitor handler
 */
export declare type AtRuleVisitorHandler = (node: AstAtRule) => (AstAtRule | AstAtRule[] | null | Promise<AstAtRule> | Promise<AstAtRule[]> | Promise<null>);

/**
 * node visitor callback map
 *
 */
export declare interface VisitorNodeMap {

    /**
     * at rule visitor
     *
     * Example: change media at-rule prelude
     *
     * ```ts
     *
     * import {transform, AstAtRule, ParserOptions} from "@tbela99/css-parser";
     *
     * const options: ParserOptions = {
     *
     *     visitor: {
     *
     *         AtRule: {
     *
     *             media: (node: AstAtRule): AstAtRule => {
     *
     *                 node.val = 'tv,screen';
     *                 return node
     *             }
     *         }
     *     }
     * };
     *
     * const css = `
     *
     * @media screen {
     *
     *     .foo {
     *
     *             height: calc(100px * 2/ 15);
     *     }
     * }
     * `;
     *
     * const result = await transform(css, options);
     *
     * console.debug(result.code);
     *
     * // @media tv,screen{.foo{height:calc(40px/3)}}
     * ```
     */
    AtRule?: Record<string, AtRuleVisitorHandler> | AtRuleVisitorHandler;
    /**
     * declaration visitor
     *
     *  Example: add 'width: 3px' everytime a declaration with the name 'height' is found
     *
     * ```ts
     *
     * import {transform, parseDeclarations} from "@tbela99/css-parser";
     *
     * const options: ParserOptions = {
     *
     *     removeEmpty: false,
     *     visitor: {
     *
     *         Declaration: {
     *
     *             // called only for height declaration
     *             height: (node: AstDeclaration): AstDeclaration[] => {
     *
     *
     *                 return [
     *                     node,
     *                     {
     *
     *                         typ: EnumToken.DeclarationNodeType,
     *                         nam: 'width',
     *                         val: [
     *                             <LengthToken>{
     *                                 typ: EnumToken.LengthTokenType,
     *                                 val: 3,
     *                                 unit: 'px'
     *                             }
     *                         ]
     *                     }
     *                 ];
     *             }
     *            }
     *         }
     * };
     *
     * const css = `
     *
     * .foo {
     *     height: calc(100px * 2/ 15);
     * }
     * .selector {
     * color: lch(from peru calc(l * 0.8) calc(c * 0.7) calc(h + 180))
     * }
     * `;
     *
     * console.debug(await transform(css, options));
     *
     * // .foo{height:calc(40px/3);width:3px}.selector{color:#0880b0}
     * ```
     *
     * Example: rename 'margin' to 'padding' and 'height' to 'width'
     *
     * ```ts
     * import {AstDeclaration, ParserOptions, transform} from "../src/node.ts";
     *
     * const options: ParserOptions = {
     *
     *     visitor: {
     *
     *         // called for every declaration
     *         Declaration: (node: AstDeclaration): null => {
     *
     *
     *             if (node.nam == 'height') {
     *
     *                 node.nam = 'width';
     *             }
     *
     *             else if (node.nam == 'margin') {
     *
     *                 node.nam = 'padding'
     *             }
     *
     *             return null;
     *         }
     *     }
     * };
     *
     * const css = `
     *
     * .foo {
     *     height: calc(100px * 2/ 15);
     *     margin: 10px;
     * }
     * .selector {
     *
     * margin: 20px;}
     * `;
     *
     * const result = await transform(css, options);
     *
     * console.debug(result.code);
     *
     * // .foo{width:calc(40px/3);padding:10px}.selector{padding:20px}
     * ```
     */
    Declaration?: Record<string, DeclarationVisitorHandler> | DeclarationVisitorHandler;

    /**
     * rule visitor
     *
     *  Example: add 'width: 3px' to every rule with the selector '.foo'
     *
     * ```ts
     *
     * import {transform, parseDeclarations} from "@tbela99/css-parser";
     *
     * const options: ParserOptions = {
     *
     *     removeEmpty: false,
     *     visitor: {
     *
     *         Rule: async (node: AstRule): Promise<AstRule | null> => {
     *
     *             if (node.sel == '.foo') {
     *
     *                 node.chi.push(...await parseDeclarations('width: 3px'));
     *                 return node;
     *             }
     *
     *             return null;
     *         }
     *     }
     * };
     *
     * const css = `
     *
     * .foo {
     *     .foo {
     *     }
     * }
     * `;
     *
     * console.debug(await transform(css, options));
     *
     * // .foo{width:3px;.foo{width:3px}}
     * ```
     */
    Rule?: RuleVisitorHandler;
}

export declare interface PropertyListOptions {

    removeDuplicateDeclarations?: boolean;
    computeShorthand?: boolean;
}

export declare interface ParseInfo {

    buffer: string;
    stream: string;
    position: Position;
    currentPosition: Position;
}

/**
 * feature walk mode
 */
declare enum FeatureWalkMode {
    /**
     * pre process
     */
    Pre = 0,
    /**
     * post process
     */
    Post = 1
}

/**
 * supported transform functions
 *
 * @internal
 */
declare const transformFunctions: string[];
/**
 * supported math functions
 *
 * @internal
 */
declare const mathFuncs: string[];

interface PropertyType {

    shorthand: string;
}

interface ShorthandPropertyType {

    shorthand: string;
    map?: string;
    properties: string[];
    types: string[];
    multiple: boolean;
    separator: {
        typ: keyof EnumToken;
        val: string
    };
    keywords: string[];
}

interface PropertySetType {

    [key: string]: PropertyType | ShorthandPropertyType;
}

interface PropertyMapType {

    default: string[];
    types: string[];
    keywords: string[];
    required?: boolean;
    multiple?: boolean;
    prefix?: {
        typ: keyof EnumToken;
        val: string
    };
    previous?: string;
    separator?: {

        typ: keyof EnumToken;
    };
    constraints?: {
        [key: string]: {
            [key: string]: any;
        }
    };
    mapping?: Record<string, string>
}

interface ShorthandMapType {

    shorthand: string;
    pattern: string;
    keywords: string[];
    default: string[];
    mapping?: Record<string, string>;
    multiple?: boolean;
    separator?: { typ: keyof EnumToken; val?: string };
    set?: Record<string, string[]>
    properties: {
        [property: string]: PropertyMapType;
    }
}

interface ShorthandProperties {
    types: EnumToken[];
    default: string[];
    keywords: string[];
    required?: boolean;
    multiple?: boolean;
    constraints?: Array<any>;
    mapping?: {
        [key: string]: any;
    };
    validation?: {
        [key: string]: any;
    };
    prefix?: string;
}

interface ShorthandDef {
    shorthand: string;
    pattern: string;
    keywords: string;
    defaults: string[];
    multiple?: boolean;
    separator?: string;
}

interface ShorthandType {
    shorthand: string;
    properties: ShorthandProperties;
}

// generated from config.json at https://app.quicktype.io/?l=ts

export declare interface PropertiesConfig {
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

export declare type WalkerOption = WalkerOptionEnum | Token | null;
/**
 * returned value:
 * - WalkerOptionEnum.Ignore: ignore this node and its children
 * - WalkerOptionEnum.Stop: stop walking the tree
 * - WalkerOptionEnum.Children: walk the children and ignore the node itself
 * - WalkerOptionEnum.IgnoreChildren: walk the node and ignore children
 */
export declare type WalkerFilter = (node: AstNode) => WalkerOption;

/**
 * returned value:
 * - 'ignore': ignore this node and its children
 * - 'stop': stop walking the tree
 * - 'children': walk the children and ignore the node itself
 * - 'ignore-children': walk the node and ignore children
 */
export declare type WalkerValueFilter = (node: AstNode | Token, parent?: FunctionToken | ParensToken | BinaryExpressionToken, event?: WalkerValueEvent) => WalkerOption | null;

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
    parent: AstNode | Token | null;
    list: Token[] | null;
}

/**
 * error description
 */
export declare interface ErrorDescription {

    /**
     *  drop rule or declaration
     */

    action: 'drop' | 'ignore';
    /**
     * error message
     */
    message: string;
    /**
     * syntax error description
     */
    syntax?: string | null;
    /**
     * error node
     */
    node?: Token | AstNode | null;
    /**
     * error location
     */
    location?: Location;
    /**
     * error object
     */
    error?: Error;
    /**
     * raw tokens
     */
    rawTokens?: TokenizeResult[];
}

/**
 * css validation options
 */
interface ValidationOptions {

    /**
     * enable css validation
     *
     * see {@link ValidationLevel}
     */
    validation?: boolean | ValidationLevel;
    /**
     * lenient validation. retain nodes that failed validation
     */
    lenient?: boolean;
    /**
     * visited tokens
     *
     * @private
     */
    visited?: WeakMap<Token, Map<string, Set<ValidationToken>>>;
    /**
     * is optional
     *
     * @private
     */
    isOptional?: boolean | null;
    /**
     * is repeatable
     *
     * @private
     */
    isRepeatable?: boolean | null;
    /**
     * is list
     *
     * @private
     */
    isList?: boolean | null;
    /**
     * occurence
     *
     * @private
     */
    occurence?: boolean | null;
    /**
     * at least once
     *
     * @private
     */
    atLeastOnce?: boolean | null;
}

/**
 * minify options
 */
interface MinifyOptions {

    /**
     * enable minification
     */
    minify?: boolean;
    /**
     * parse color tokens
     */
    parseColor?: boolean;
    /**
     * generate nested rules
     */
    nestingRules?: boolean;
    /**
     * expand nested rules
     */
    expandNestingRules?: boolean;
    /**
     * remove duplicate declarations from the same rule
     */
    removeDuplicateDeclarations?: boolean;
    /**
     * compute shorthand properties
     */
    computeShorthand?: boolean;
    /**
     * compute transform functions
     * see supported functions {@link transformFunctions}
     */
    computeTransform?: boolean;
    /**
     * compute math functions
     * see supported functions {@link mathFuncs}
     */
    computeCalcExpression?: boolean;
    /**
     * inline css variables
     */
    inlineCssVariables?: boolean;
    /**
     * remove empty ast nodes
     */
    removeEmpty?: boolean;
    /**
     * define minification passes.
     */
    pass?: number;
}

/**
 * parser options
 */
export declare interface ParserOptions extends MinifyOptions, MinifyFeatureOptions, ValidationOptions, PropertyListOptions {

    /**
     * source file to be used for sourcemap
     */
    src?: string;
    /**
     * include sourcemap in the ast. sourcemap info is always generated
     */
    sourcemap?: boolean | 'inline';
    /**
     * remove @charset at-rule
     */
    removeCharset?: boolean;
    /**
     * resolve urls
     */
    resolveUrls?: boolean;
    /**
     * resolve import
     */
    resolveImport?: boolean;
    /**
     * current working directory
     * @ignore
     */
    cwd?: string;
    /**
     * remove css prefix
     */
    removePrefix?: boolean;
    /**
     * get file or url as stream
     * @param url
     * @param currentUrl
     *
     * @private
     */
    getStream?: (url: string, currentUrl: string) => Promise<ReadableStream<string>>;
    /**
     * get directory name
     * @param path
     *
     * @private
     */
    dirname?: (path: string) => string;
    /**
     * resolve path
     * @param url
     * @param currentUrl
     * @param currentWorkingDirectory
     *
     * @private
     */
    resolve?: (url: string, currentUrl: string, currentWorkingDirectory?: string) => {
        absolute: string;
        relative: string;
    };
    /**
     * node visitor
     * {@link VisitorNodeMap}
     */
    visitor?: VisitorNodeMap;
    /**
     * abort signal
     *
     * Example: abort after 10 seconds
     * ```ts
     *
     * const result = await parse(cssString, {
     *     signal: AbortSignal.timeout(10000)
     * });
     *
     * ```
     */
    signal?: AbortSignal;
    /**
     * set parent node
     */
    setParent?: boolean;
    /**
     * cache
     *
     * @private
     */
    cache?: WeakMap<AstNode, string>;
}

/**
 * minify feature options
 *
 * @internal
 */
export declare interface MinifyFeatureOptions {

    /**
     * minify features
     *
     * @internal
     */
    features?: MinifyFeature[];
}

/**
 * minify feature
 *
 * @internal
 */
export declare interface MinifyFeature {

    /**
     * ordering
     */
    ordering: number;
    /**
     * use in pre process
     */
    preProcess: boolean;
    /**
     * use in post process
     */
    postProcess: boolean;
    /**
     * register feature
     * @param options
     */
    register: (options: MinifyFeatureOptions | ParserOptions) => void;
    /**
     * run feature
     * @param ast
     * @param options
     * @param parent
     * @param context
     * @param mode
     */
    run: (ast: AstRule | AstAtRule, options: ParserOptions, parent: AstRule | AstAtRule | AstRuleStyleSheet, context: {
        [key: string]: any
    }, mode: FeatureWalkMode) => void;
}

/**
 * resolved path
 * @internal
 */
export declare interface ResolvedPath {
    /**
     * absolute path
     */
    absolute: string;
    /**
     * relative path
     */
    relative: string;
}

/**
 * ast node render options
 */
export declare interface RenderOptions {

    /**
     * minify ast node.
     */
    minify?: boolean;
    /**
     * pretty print css
     */
    beautify?: boolean;
    /**
     * remove empty rule lists from the ast
     */
    removeEmpty?: boolean;
    /**
     * expand nesting rules
     */
    expandNestingRules?: boolean;
    /**
     * preserve license comments. license comments are comments that start with /*!
     */
    preserveLicense?: boolean;
    /**
     * generate sourcemap object. 'inline' will embed it in the css
     */
    sourcemap?: boolean | 'inline';
    /**
     * indent string
     */
    indent?: string;
    /**
     * new line string
     */
    newLine?: string;
    /**
     * remove comments
     */
    removeComments?: boolean;
    /**
     * convert color to the specified color space. 'true' will convert to HEX
     */
    convertColor?: boolean | ColorType;
    /**
     * ernder the node along with its parents
     */
    withParents?: boolean;
    /**
     * output file. used for url resolution
     * @internal
     */
    output?: string;
    /**
     * current working directory
     * @internal
     */
    cwd?: string;
    /**
     * resolve path
     * @internal
     */
    resolve?: (url: string, currentUrl: string, currentWorkingDirectory?: string) => ResolvedPath;
}

/**
 * transform options
 */
export declare interface TransformOptions extends ParserOptions, RenderOptions {

}

/**
 * parse result stats object
 */
export declare interface ParseResultStats {
    /**
     * source file
     */
    src: string;
    /**
     * bytes read
     */
    bytesIn: number;
    /**
     * bytes read from imported files
     */
    importedBytesIn: number;
    /**
     * parse time
     */
    parse: string;
    /**
     * minify time
     */
    minify: string;
    /**
     * total time
     */
    total: string;
    /**
     * imported files stats
     */
    imports: ParseResultStats[]
}

/**
 * parse result object
 */
export declare interface ParseResult {
    /**
     * parsed ast tree
     */
    ast: AstRuleStyleSheet;
    /**
     * parse errors
     */
    errors: ErrorDescription[];
    /**
     * parse stats
     */
    stats: ParseResultStats
}

/**
 * render result object
 */
export declare interface RenderResult {
    /**
     * rendered css
     */
    code: string;
    /**
     * render errors
     */
    errors: ErrorDescription[];
    /**
     * render stats
     */
    stats: {
        /**
         * render time
         */
        total: string;
    },
    /**
     * source map
     */
    map?: SourceMap
}

/**
 * transform result object
 */
export declare interface TransformResult extends ParseResult, RenderResult {

    /**
     * transform stats
     */
    stats: {
        /**
         * source file
         */
        src: string;
        /**
         * bytes read
         */
        bytesIn: number;
        /**
         * generated css size
         */
        bytesOut: number;
        /**
         * bytes read from imported files
         */
        importedBytesIn: number;
        /**
         * parse time
         */
        parse: string;
        /**
         * minify time
         */
        minify: string;
        /**
         * render time
         */
        render: string;
        /**
         * total time
         */
        total: string;
        /**
         * imported files stats
         */
        imports: ParseResultStats[];
    }
}

/**
 * parse token options
 */
export declare interface ParseTokenOptions extends ParserOptions {
}

/**
 * tokenize result object
 * @internal
 */
export declare interface TokenizeResult {
    /**
     * token
     */
    token: string;
    /**
     * token length
     */
    len: number;
    /**
     * token type hint
     */
    hint?: EnumToken;
    /**
     * token start position
     */
    sta: Position;
    /**
     * token end position
     */
    end: Position;
    /**
     * bytes in
     */
    bytesIn: number;
}

/**
 * matched selector object
 * @internal
 */
export declare interface MatchedSelector {
    /**
     * matched selector
     */
    match: string[][];
    /**
     * selector 1
     */
    selector1: string[][];
    /**
     * selector 2
     */
    selector2: string[][];
    /**
     * selectors partially match
     */
    eq: boolean
}

/**
 * variable scope info object
 * @internal
 */
export declare interface VariableScopeInfo {
    /**
     * global scope
     */
    globalScope: boolean;
    /**
     * parent nodes
     */
    parent: Set<AstRule | AstAtRule>;
    /**
     * declaration count
     */
    declarationCount: number;
    /**
     * replaceable
     */
    replaceable: boolean;
    /**
     * declaration node
     */
    node: AstDeclaration;
    /**
     * declaration values
     */
    values: Token[];
}

/**
 * source map object
 * @internal
 */
export declare interface SourceMapObject {
    version: number;
    file?: string;
    sourceRoot?: string;
    sources?: string[];
    sourcesContent?: Array<string | null>;
    names?: string[];
    mappings: string;
}

/**
 * return the directory name of a path
 * @param path
 * @internal
 */
declare function dirname(path: string): string;
/**
 * resolve path
 * @param url url or path to resolve
 * @param currentDirectory directory used to resolve the path
 * @param cwd current working directory
 *
 * @private
 */
declare function resolve(url: string, currentDirectory: string, cwd?: string): {
    absolute: string;
    relative: string;
};

/**
 * node module entry point
 * @module node
 */

/**
 * load file or url as stream
 * @param url
 * @param currentFile
 *
 * @private
 */
declare function getStream(url: string, currentFile?: string): Promise<ReadableStream<string>>;
/**
 * render ast tree
 * @param data
 * @param options
 *
 * Example:
 *
 * ```ts
 *
 *  import {render, ColorType} from '@tbela99/css-parser';
 *
 *  // remote file
 * let result = render(ast);
 * console.log(result.code);
 *
 * // local file
 * result = await parseFile(ast, {beatify: true, convertColor: ColorType.SRGB});
 * console.log(result.code);
 * ```
 */
declare function render(data: AstNode, options?: RenderOptions): RenderResult;
/**
 * parse css file
 * @param file url or path
 * @param options
 *
 * Example:
 *
 * ```ts
 *
 *  import {parseFile} from '@tbela99/css-parser';
 *
 *  // remote file
 * let result = await parseFile('https://docs.deno.com/styles.css');
 * console.log(result.ast);
 *
 * // local file
 * result = await parseFile('./css/styles.css');
 * console.log(result.ast);
 * ```
 */
declare function parseFile(file: string, options?: ParserOptions): Promise<ParseResult>;
/**
 * parse css
 * @param stream
 * @param opt
 *
 * Example:
 *
 * ```ts
 *
 * import {transform} from '@tbela99/css-parser';
 *
 *  // css string
 *  let result = await transform(css);
 *  console.log(result.code);
 * ```
 *
 * Example using stream
 *
 * ```ts
 *
 * import {parse} from '@tbela99/css-parser';
 * import {Readable} from "node:stream";
 *
 * // usage: node index.ts < styles.css or cat styles.css | node index.ts
 *
 *  const readableStream = Readable.toWeb(process.stdin);
 *  const result = await parse(readableStream, {beautify: true});
 *
 *  console.log(result.ast);
 * ```
 *
 * Example using fetch
 *
 * ```ts
 *
 *  import {parse} from '@tbela99/css-parser';
 *
 *  const response = await fetch('https://docs.deno.com/styles.css');
 *  result = await parse(response.body, {beautify: true});
 *
 *  console.log(result.ast);
 * ```
 */
declare function parse(stream: string | ReadableStream<string>, opt?: ParserOptions): Promise<ParseResult>;
/**
 * transform css file
 * @param file url or path
 * @param options
 *
 * Example:
 *
 * ```ts
 *
 *  import {transformFile} from '@tbela99/css-parser';
 *
 *  // remote file
 * let result = await transformFile('https://docs.deno.com/styles.css');
 * console.log(result.code);
 *
 * // local file
 * result = await transformFile('./css/styles.css');
 * console.log(result.code);
 * ```
 */
declare function transformFile(file: string, options?: TransformOptions): Promise<TransformResult>;
/**
 * transform css
 * @param css
 * @param options
 *
 * Example:
 *
 * ```ts
 *
 * import {transform} from '@tbela99/css-parser';
 *
 *  // css string
 *  let result = await transform(css);
 *  console.log(result.code);
 * ```
 *
 * Example using stream
 *
 * ```ts
 *
 * import {transform} from '@tbela99/css-parser';
 * import {Readable} from "node:stream";
 *
 * // usage: node index.ts < styles.css or cat styles.css | node index.ts
 *
 *  const readableStream = Readable.toWeb(process.stdin);
 *  const result = await transform(readableStream, {beautify: true});
 *
 *  console.log(result.code);
 * ```
 *
 * Example using fetch
 *
 * ```ts
 *
 *  import {transform} from '@tbela99/css-parser';
 *
 *  const response = await fetch('https://docs.deno.com/styles.css');
 *  result = await transform(response.body, {beautify: true});
 *
 *  console.log(result.code);
 * ```
 */
declare function transform(css: string | ReadableStream<string>, options?: TransformOptions): Promise<TransformResult>;

export { ColorType, EnumToken, FeatureWalkMode, SourceMap, ValidationLevel, WalkerOptionEnum, WalkerValueEvent, convertColor, dirname, expand, getStream, isOkLabClose, mathFuncs, minify, okLabDistance, parse, parseDeclarations, parseFile, parseString, parseTokens, render, renderToken, resolve, transform, transformFile, transformFunctions, walk, walkValues };
export type { AddToken, AngleToken, AstAtRule, AstComment, AstDeclaration, AstInvalidAtRule, AstInvalidDeclaration, AstInvalidRule, AstKeyFrameRule, AstKeyframAtRule, AstKeyframeRule, AstNode, AstRule, AstRuleList, AstRuleStyleSheet, AtRuleToken, AtRuleVisitorHandler, AttrEndToken, AttrStartToken, AttrToken, Background, BackgroundAttachmentMapping, BackgroundPosition, BackgroundPositionClass, BackgroundPositionConstraints, BackgroundPositionMapping, BackgroundProperties, BackgroundRepeat, BackgroundRepeatMapping, BackgroundSize, BackgroundSizeMapping, BadCDOCommentToken, BadCommentToken, BadStringToken, BadUrlToken, BaseToken, BinaryExpressionNode, BinaryExpressionToken, BlockEndToken, BlockStartToken, Border, BorderColor, BorderColorClass, BorderProperties, BorderRadius, CDOCommentToken, ChildCombinatorToken, ClassSelectorToken, ColonToken, ColorToken, ColumnCombinatorToken, CommaToken, CommentToken, ConstraintsMapping, ContainMatchToken, Context, DashMatchToken, DashedIdentToken, DeclarationVisitorHandler, DelimToken, DescendantCombinatorToken, DimensionToken, DivToken, EOFToken, EndMatchToken, EqualMatchToken, ErrorDescription, FlexToken, Font, FontFamily, FontProperties, FontWeight, FontWeightConstraints, FontWeightMapping, FractionToken, FrequencyToken, FunctionImageToken, FunctionToken, FunctionURLToken, GreaterThanOrEqualToken, GreaterThanToken, GridTemplateFuncToken, HashToken, IdentListToken, IdentToken, ImportantToken, IncludeMatchToken, InvalidAttrToken, InvalidClassSelectorToken, LengthToken, LessThanOrEqualToken, LessThanToken, LineHeight, ListToken, LiteralToken, Location, Map$1 as Map, MatchExpressionToken, MatchedSelector, MediaFeatureAndToken, MediaFeatureNotToken, MediaFeatureOnlyToken, MediaFeatureOrToken, MediaFeatureToken, MediaQueryConditionToken, MinifyFeature, MinifyFeatureOptions, MinifyOptions, MulToken, NameSpaceAttributeToken, NestingSelectorToken, NextSiblingCombinatorToken, NumberToken, OptimizedSelector, OptimizedSelectorToken, Outline, OutlineProperties, ParensEndToken, ParensStartToken, ParensToken, ParseInfo, ParseResult, ParseResultStats, ParseTokenOptions, ParserOptions, PercentageToken, Position, Prefix, PropertiesConfig, PropertiesConfigProperties, PropertyListOptions, PropertyMapType, PropertySetType, PropertyType, PseudoClassFunctionToken, PseudoClassToken, PseudoElementToken, PseudoPageToken, PurpleBackgroundAttachment, RawSelectorTokens, RenderOptions, RenderResult, ResolutionToken, ResolvedPath, RuleVisitorHandler, SemiColonToken, Separator, ShorthandDef, ShorthandMapType, ShorthandProperties, ShorthandPropertyType, ShorthandType, SourceMapObject, StartMatchToken, StringToken, SubToken, SubsequentCombinatorToken, TimeToken, TimelineFunctionToken, TimingFunctionToken, Token, TokenizeResult, TransformOptions, TransformResult, UnaryExpression, UnaryExpressionNode, UnclosedStringToken, UniversalSelectorToken, UrlToken, ValidationConfiguration, ValidationOptions, ValidationResult, ValidationSelectorOptions, ValidationSyntaxNode, ValidationSyntaxResult, Value, VariableScopeInfo, VisitorNodeMap, WalkAttributesResult, WalkResult, WalkerFilter, WalkerOption, WalkerValueFilter, WhitespaceToken };
