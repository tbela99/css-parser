import type { LengthToken, NumberToken } from "../../@types";
/**
 * syntax validation enum
 */
export declare enum SyntaxValidationResult {
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
export declare enum ValidationLevel {
    /**
     * disable validation
     */
    None = 0,
    /**
     * validate selectors
     */
    Selector = 1,
    /**
     * validate at-rules
     */
    AtRule = 2,
    /**
     * validate declarations
     */
    Declaration = 4,
    /**
     * validate selectors and at-rules
     */
    Default = 3,// selectors + at-rules
    /**
     * validate selectors, at-rules and declarations
     */
    All = 7
}
/**
 * enum of all token types
 */
export declare enum EnumToken {
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
    KeyFramesRuleNodeType = 73,
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
    InvalidRuleNodeType = 81,
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
    InvalidAtRuleNodeType = 84,
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
    OnlyTokenType = 87,
    /**
     * media feature not token type
     */
    NotTokenType = 88,
    /**
     * media feature and token type
     */
    AndTokenType = 89,
    /**
     * media feature or token type
     */
    OrTokenType = 90,
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
    KeyframesAtRuleNodeType = 93,
    /**
     * invalid declaration node type
     */
    InvalidDeclarationNodeType = 94,
    /**
     * composes token node type
     */
    ComposesSelectorNodeType = 95,
    /**
     * css variable token type
     */
    CssVariableTokenType = 96,
    /**
     * css variable import token type
     */
    CssVariableImportTokenType = 97,
    /**
     * css variable declaration map token type
     */
    CssVariableDeclarationMapTokenType = 98,
    MediaRangeQueryTokenType = 99,
    InvalidMediaQueryTokenType = 100,
    SupportsQueryConditionTokenType = 101,
    SupportsQueryUnaryConditionTokenType = 102,
    WhenElseQueryConditionTokenType = 103,
    WhenElseUnaryConditionTokenType = 104,
    ContainerStyleRangeTokenType = 105,
    /**
     * '*'
     */
    Star = 106,
    /**
     * '+'
     */
    Plus = 107,
    /**
     * '~'
     */
    Tilda = 108,
    /**
     * '|'
     */
    Pipe = 109,
    /**
     * '::'
     */
    DoubleColonTokenType = 110,
    /**
     * math function token type 'calc(' etc.
     */
    MathFunctionTokenType = 111,
    /**
     * transform function token type 'translate(' etc.
     */
    TransformFunctionTokenType = 112,
    /**
     * when function token type 'supports(' etc.
     */
    WhenElseFunctionTokenType = 113,
    /**
     * general enclosed function token type 'font-tech(' etc.
     */
    GeneralEnclosedFunctionTokenType = 114,
    /**
     * supports function token type 'at-rule('
     */
    SupportsFunctionTokenType = 115,
    /**
     * container function token type 'style(' or 'scroll-state('
     */
    ContainerFunctionTokenType = 116,
    /**
     * unrecognized node token type
     */
    RawNodeTokenType = 117,
    /**
     * media query boolean token type
     * @media not ()
     * @media only ()
     */
    MediaQueryUnaryFeatureTokenType = 118,
    /**
     * grid template function token type 'minmax('
     */
    GridTemplateFuncTokenDefType = 119,
    /**
     * image function token type 'image(' etc.
     */
    ImageFunctionTokenDefType = 120,
    /**
     * function token type 'view(' etc.
     */
    TimelineFunctionTokenDefType = 121,
    /**
     * function token type 'var(' etc.
     */
    FunctionTokenDefType = 122,
    /**
     * timing function token type 'linear(' etc.
     */
    TimingFunctionTokenDefType = 123,
    /**
     * color function token type 'rgb(' etc.
     */
    ColorFunctionTokenDefType = 124,
    /**
     * math function token type 'calc(' etc.
     */
    MathFunctionTokenDefType = 125,
    /**
     * container function token type 'style(' or 'scroll-state('
     */
    ContainerFunctionTokenDefType = 126,
    /**
     * url function token type 'url('
     */
    UrlFunctionTokenDefType = 127,
    /**
     * pseudo-class function token type
     */
    PseudoClassFunctionTokenDefType = 128,
    /**
     * transform function token type 'translate(' etc.
     */
    TransformFunctionTokenDefType = 129,
    /**
     * when function token type 'supports(' or 'media('
     */
    WhenElseFunctionTokenDefType = 130,
    /**
     * general enclosed function token type 'font-tech(' etc.
     */
    GeneralEnclosedFunctionTokenDefType = 131,
    /**
     * supports function token type 'font-tech('
     */
    SupportsFunctionTokenDefType = 132,
    /**
     *  CDOCOMMTokenType not allowed in this context
     */
    InvalidCommentTokenType = 133,
    /**
     * custom function token type '--function-name('
     */
    CustomFunctionTokenDefType = 134,
    /**
     * custom function token type
     */
    CustomFunctionTokenType = 135,
    /**
     * function tokens such as 'var(', 'env(', 'if(')
     */
    WildCardFunctionTokenDefType = 136,
    /**
     * function such as 'var()', 'env()', 'if()'
     */
    WildCardFunctionTokenType = 137,
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
export declare enum ColorType {
    /**
     * deprecated system colors
     */
    SYS = 0,
    /**
     * deprecated system colors
     */
    DPSYS = 1,
    /**
     * named colors
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
     * non-standard color
     */
    NON_STD = 23,
    /**
     * custom color
     */
    CUSTOM_COLOR = 24,
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
export declare enum ModuleCaseTransformEnum {
    /**
     * export class names as-is
     */
    IgnoreCase = 1,
    /**
     * transform mapping key name to camel case
     */
    CamelCase = 2,
    /**
     * transform class names and mapping key name to camel case
     */
    CamelCaseOnly = 4,
    /**
     * transform mapping key name to dash case
     */
    DashCase = 8,
    /**
     * transform class names and mapping key name to dash case
     */
    DashCaseOnly = 16
}
export declare enum ModuleScopeEnumOptions {
    /**
     * use the global scope
     */
    Global = 32,
    /**
     * use the local scope
     */
    Local = 64,
    /**
     * do not allow selector without an id or class
     */
    Pure = 128,
    /**
     * export using ICSS module format
     */
    ICSS = 256,
    /**
     * use the shortest name possible. pattern is ignored.
     * it will produce names such as
     *
     * ```css
     *  .a {
     *      content: 'a';
     *  }
     *
     *  .b {
     *      content: 'b';
     *  }
     *
     *  .c {
     *      content: 'c';
     *  }
     *  ...
     * ```
     */
    Shortest = 512
}
export declare function length2Px(value: LengthToken | NumberToken): number | null;
/**
 * minify number
 * @param val
 */
export declare function minifyNumber(val: string | number): string;
