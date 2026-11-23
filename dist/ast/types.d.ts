/**
 * Enum of node statuses
 */
export declare enum EnumAstNodeStatus {
    /**
     * Node passed validation
     */
    Validated = 1,
    /**
     * Node is invalid
     */
    Invalid = 2,
    /**
     * node is not validated
     */
    Unvalidated = 4,
    /**
     * Node did not pass validation, but is preserved.
     */
    ValidationFailed = 8,
    /**
     * Parsing the node is not supported yet or the node syntax definition does not exist.
     */
    Unknown = 16,
    /**
     * Failed to parse the node.
     */
    Unparsed = 32,
    /**
     * Node is disallowed in the context
     */
    Disallowed = 64,
    /**
     * Node is malformed
     */
    Malformed = 128,
    /**
     * Important declaration
     */
    ImportantDeclaration = 256,
    /**
     * Color component without unit
     */
    PowerlessColorComponent = 512,
    /**
     * mask of the validation state bits
     */
    StateMask = 65535,
    /**
     * the node has a children list (stylesheet, rule, at-rule with a block)
     */
    HasChildren = 65536,
    /**
     * the node has value tokens (declaration)
     */
    HasValues = 131072,
    /**
     * the node has a source location
     */
    HasLocation = 262144,
    /**
     * the node is marked to be released or trimmed. see `arena.mark()`, `arena.release()` and `arena.trim()`
     */
    Marked = 524288,
    /**
     * transient flag used while comparing the declarations of two rules
     * @private
     */
    Matched = 1048576
}
/**
 * Enum of all token types
 */
export declare enum EnumToken {
    /**
     * comment token. the value 0 is reserved: it is the type of the null node (id 0) and of unset nodes,
     * so that reading the type of a missing node never matches a real token type
     */
    CommentTokenType = 1,
    /**
     * cdata section token
     */
    CDOCOMMTokenType = 2,
    /**
     * style sheet node type
     */
    StyleSheetNodeType = 3,
    /**
     * at-rule node type
     */
    AtRuleNodeType = 4,
    /**
     * rule node type
     */
    RuleNodeType = 5,
    /**
     * declaration node type
     */
    DeclarationNodeType = 6,
    /**
     * literal token type
     */
    LiteralTokenType = 7,
    /**
     * identifier token type
     */
    IdenTokenType = 8,
    /**
     * dashed identifier token type
     */
    DashedIdenTokenType = 9,
    /**
     * comma token type
     */
    CommaTokenType = 10,
    /**
     * colon token type
     */
    ColonTokenType = 11,
    /**
     * semicolon token type
     */
    SemiColonTokenType = 12,
    /**
     * number token type
     */
    NumberTokenType = 13,
    /**
     * at-rule token type
     */
    AtRuleTokenType = 14,
    /**
     * percentage token type
     */
    PercentageTokenType = 15,
    /**
     * function token type
     */
    FunctionTokenType = 16,
    /**
     * timeline function token type
     */
    TimelineFunctionTokenType = 17,
    /**
     * timing function token type
     */
    TimingFunctionTokenType = 18,
    /**
     * url function token type
     */
    UrlFunctionTokenType = 19,
    /**
     * image function token type
     */
    ImageFunctionTokenType = 20,
    /**
     * string token type
     */
    StringTokenType = 21,
    /**
     * unclosed string token type
     */
    UnclosedStringTokenType = 22,
    /**
     * dimension token type
     */
    DimensionTokenType = 23,
    /**
     * length token type
     */
    LengthTokenType = 24,
    /**
     * angle token type
     */
    AngleTokenType = 25,
    /**
     * time token type
     */
    TimeTokenType = 26,
    /**
     * frequency token type
     */
    FrequencyTokenType = 27,
    /**
     * resolution token type
     */
    ResolutionTokenType = 28,
    /**
     * hash token type
     */
    HashTokenType = 29,
    /**
     * block start token type
     */
    BlockStartTokenType = 30,
    /**
     * block end token type
     */
    BlockEndTokenType = 31,
    /**
     * attribute start token type
     */
    AttrStartTokenType = 32,
    /**
     * attribute end token type
     */
    AttrEndTokenType = 33,
    /**
     * start parentheses token type
     */
    StartParensTokenType = 34,
    /**
     * end parentheses token type
     */
    EndParensTokenType = 35,
    /**
     * parentheses token type
     */
    ParensTokenType = 36,
    /**
     * whitespace token type
     */
    WhitespaceTokenType = 37,
    /**
     * include match token type
     */
    IncludeMatchTokenType = 38,
    /**
     * dash match token type
     */
    DashMatchTokenType = 39,
    /**
     * equal match token type
     */
    EqualMatchTokenType = 40,
    /**
     * less than token type
     */
    LtTokenType = 41,
    /**
     * less than or equal to token type
     */
    LteTokenType = 42,
    /**
     * greater than token type
     */
    GtTokenType = 43,
    /**
     * greater than or equal to token type
     */
    GteTokenType = 44,
    /**
     * pseudo-class token type
     */
    PseudoClassTokenType = 45,
    /**
     * pseudo-class function token type
     */
    PseudoClassFuncTokenType = 46,
    /**
     * delimiter token type
     */
    DelimTokenType = 47,
    /**
     * URL token type
     */
    UrlTokenTokenType = 48,
    /**
     * end of file token type
     */
    EOFTokenType = 49,
    /**
     * important token type
     */
    ImportantTokenType = 50,
    /**
     * color token type
     */
    ColorTokenType = 51,
    /**
     * attribute token type
     */
    AttrTokenType = 52,
    /**
     * bad comment token type
     */
    BadCommentTokenType = 53,
    /**
     * bad cdo token type
     */
    BadCdoTokenType = 54,
    /**
     * bad URL token type
     */
    BadUrlTokenType = 55,
    /**
     * bad string token type
     */
    BadStringTokenType = 56,
    /**
     * binary expression token type
     */
    BinaryExpressionTokenType = 57,
    /**
     * unary expression token type
     */
    UnaryExpressionTokenType = 58,
    /**
     * flex token type
     */
    FlexTokenType = 59,
    /**
     *  token list token type
     */
    ListToken = 60,
    /**
     * addition token type
     */
    Add = 61,
    /**
     * multiplication token type
     */
    Mul = 62,
    /**
     * division token type
     */
    Div = 63,
    /**
     * subtraction token type
     */
    Sub = 64,
    /**
     * column combinator token type
     */
    ColumnCombinatorTokenType = 65,
    /**
     * contain match token type
     */
    ContainMatchTokenType = 66,
    /**
     * start match token type
     */
    StartMatchTokenType = 67,
    /**
     * end match token type
     */
    EndMatchTokenType = 68,
    /**
     * match expression token type
     */
    MatchExpressionTokenType = 69,
    /**
     * namespace attribute token type
     */
    NameSpaceAttributeTokenType = 70,
    /**
     * fraction token type
     */
    FractionTokenType = 71,
    /**
     * identifier list token type
     */
    IdenListTokenType = 72,
    /**
     * grid template function token type
     */
    GridTemplateFuncTokenType = 73,
    /**
     * keyframe rule node type
     */
    KeyframesRuleNodeType = 74,
    /**
     * class selector token type
     */
    ClassSelectorTokenType = 75,
    /**
     * universal selector token type
     */
    UniversalSelectorTokenType = 76,
    /**
     * child combinator token type
     */
    ChildCombinatorTokenType = 77,// >
    /**
     * descendant combinator token type
     */
    DescendantCombinatorTokenType = 78,// whitespace
    /**
     * next sibling combinator token type
     */
    NextSiblingCombinatorTokenType = 79,// +
    /**
     * subsequent sibling combinator token type
     */
    SubsequentSiblingCombinatorTokenType = 80,// ~
    /**
     * nesting selector token type
     */
    NestingSelectorTokenType = 81,// &
    /**
     * media query condition token type
     */
    MediaQueryConditionTokenType = 82,
    /**
     * media feature token type
     */
    MediaFeatureTokenType = 83,
    /**
     * media feature only token type
     */
    OnlyTokenType = 84,
    /**
     * media feature not token type
     */
    NotTokenType = 85,
    /**
     * media feature and token type
     */
    AndTokenType = 86,
    /**
     * media feature or token type
     */
    OrTokenType = 87,
    /**
     * pseudo page token type
     */
    PseudoPageTokenType = 88,
    /**
     * pseudo element token type
     */
    PseudoElementTokenType = 89,
    /**
     * keyframe at rule node type
     */
    KeyframesAtRuleNodeType = 90,
    /**
     * composes token node type
     */
    ComposesSelectorNodeType = 91,
    /**
     * css variable token type
     */
    CssVariableTokenType = 92,
    /**
     * css variable import token type
     */
    CssVariableImportTokenType = 93,
    /**
     * css variable declaration map token type
     */
    CssVariableDeclarationMapTokenType = 94,
    /**
     * media range query token type
     */
    MediaRangeQueryTokenType = 95,
    /**
     * supports query condition token type
     */
    SupportsQueryConditionTokenType = 96,
    /**
     * supports query unary condition token type
     */
    SupportsQueryUnaryConditionTokenType = 97,
    /**
     * when else query condition token type
     */
    WhenElseQueryConditionTokenType = 98,
    /**
     * when else query unary condition token type
     */
    WhenElseUnaryConditionTokenType = 99,
    /**
     * container style range token type
     */
    ContainerStyleRangeTokenType = 100,
    /**
     * '*'
     */
    Star = 101,
    /**
     * '+'
     */
    Plus = 102,
    /**
     * '~'
     */
    Tilda = 103,
    /**
     * '|'
     */
    PipeTokenType = 104,
    /**
     * '::'
     */
    DoubleColonTokenType = 105,
    /**
     * math function token type  such as'calc(' etc.
     */
    MathFunctionTokenType = 106,
    /**
     * transform function token type such as 'translate(' etc.
     */
    TransformFunctionTokenType = 107,
    /**
     * when function token type such as 'supports(' etc.
     */
    WhenElseFunctionTokenType = 108,
    /**
     * general enclosed function token type 'font-tech(' etc.
     */
    GeneralEnclosedFunctionTokenType = 109,
    /**
     * supports function token type such as 'at-rule('
     */
    SupportsFunctionTokenType = 110,
    /**
     * container function token type such as 'style(' or 'scroll-state('
     */
    ContainerFunctionTokenType = 111,
    /**
     * unrecognized node token type
     */
    RawNodeTokenType = 112,
    /**
     * media query boolean token type
     * at-rule media not ()
     * at-rule media only ()
     */
    MediaQueryUnaryFeatureTokenType = 113,
    /**
     * grid template function token type such as 'minmax('
     */
    GridTemplateFuncTokenDefType = 114,
    /**
     * image function token type such as 'image(' etc.
     */
    ImageFunctionTokenDefType = 115,
    /**
     * function token type such as 'view(' etc.
     */
    TimelineFunctionTokenDefType = 116,
    /**
     * function token type
     */
    FunctionTokenDefType = 117,
    /**
     * timing function token type such as 'linear(' etc.
     */
    TimingFunctionTokenDefType = 118,
    /**
     * color function token type such as 'rgb(' etc.
     */
    ColorFunctionTokenDefType = 119,
    /**
     * math function token type such as 'calc(' etc.
     */
    MathFunctionTokenDefType = 120,
    /**
     * container function token type such as 'style(' or 'scroll-state('
     */
    ContainerFunctionTokenDefType = 121,
    /**
     * url function token type 'url('
     */
    UrlFunctionTokenDefType = 122,
    /**
     * pseudo-class function token type
     */
    PseudoClassFunctionTokenDefType = 123,
    /**
     * transform function token type such as 'translate(' etc.
     */
    TransformFunctionTokenDefType = 124,
    /**
     * when function token type such as 'supports(' or 'media('
     */
    WhenElseFunctionTokenDefType = 125,
    /**
     * general enclosed function token type 'font-tech(' etc.
     */
    GeneralEnclosedFunctionTokenDefType = 126,
    /**
     * supports function token type 'font-tech('
     */
    SupportsFunctionTokenDefType = 127,
    /**
     * custom function token type '--function-name('
     */
    CustomFunctionTokenDefType = 128,
    /**
     * custom function token type
     */
    CustomFunctionTokenType = 129,
    /**
     * function tokens such as 'var(', 'env(', 'if(')
     */
    WildCardFunctionTokenDefType = 130,
    /**
     * function such as 'var()', 'env()', 'if()'
     */
    WildCardFunctionTokenType = 131,
    /**
     * if condition token
     */
    IfConditionTokenType = 132,
    /**
     * if-Else condition token
     */
    IfElseConditionTokenType = 133,
    /**
     * wrapped values token type like {Arial, sans-serif}
     */
    WrappedValuesTokenType = 134,
    /**
     * list of arena tokens (binary expression operands)
     */
    ListTokenType = 135,
    /**
     * infinity token
     */
    NaNTokenType = 136,
    /**
     * infinity token
     */
    InfinityTokenType = 137,
    /**
     * negative infinity token
     */
    NegativeInfinityTokenType = 138,
    /**
     * CSS type token
     */
    CssTypeTokenType = 139,
    /**
     * user defined dimension token type
     */
    UserDefinedDimensionTokenType = 140,
    /**
     * unicode range token type: `U+0025-00FF`, `U+4??`. the token is rendered as it is
     */
    UniCodeRange = 141,
    /**
     * alias for time token type
     */
    Time = 26,
    /**
     * alias for identifier token type
     */
    Iden = 8,
    /**
     * alias for end of file token type
     */
    EOF = 49,
    /**
     * alias for hash token type
     */
    Hash = 29,
    /**
     * alias for flex token type
     */
    Flex = 59,
    /**
     * alias for angle token type
     */
    Angle = 25,
    /**
     * alias for color token type
     */
    Color = 51,
    /**
     * alias for comma token type
     */
    Comma = 10,
    /**
     * alias for string token type
     */
    String = 21,
    /**
     * alias for length token type
     */
    Length = 24,
    /**
     * alias for number token type
     */
    Number = 13,
    /**
     * alias for percentage token type
     */
    Perc = 15,
    /**
     * alias for literal token type
     */
    Literal = 7,
    /**
     * alias for comment token type
     */
    Comment = 1,
    /**
     * alias for url function token type
     */
    UrlFunc = 19,
    /**
     * alias for dimension token type
     */
    Dimension = 23,
    /**
     * alias for frequency token type
     */
    Frequency = 27,
    /**
     * alias for resolution token type
     */
    Resolution = 28,
    /**
     * alias for whitespace token type
     */
    Whitespace = 37,
    /**
     * alias for identifier list token type
     */
    IdenList = 72,
    /**
     * alias for dashed identifier token type
     */
    DashedIden = 9,
    /**
     * alias for grid template function token type
     */
    GridTemplateFunc = 73,
    /**
     * alias for image function token type
     */
    ImageFunc = 20,
    /**
     * alias for comment node type
     */
    CommentNodeType = 1,
    /**
     * alias for cdata section node type
     */
    CDOCOMMNodeType = 2,
    /**
     * alias for timing function token type
     */
    TimingFunction = 18,
    /**
     * alias for timeline function token type
     */
    TimelineFunction = 17
}
/**
 * Supported color types enum
 */
export declare enum ColorType {
    /**
     * the color type is not known yet (the color function has not been parsed)
     */
    NONE = 0,
    /**
     * system colors
     */
    SYS = 1,
    /**
     * deprecated system colors
     */
    DPSYS = 2,
    /**
     * named colors
     */
    LIT = 3,
    /**
     * colors as hex values
     */
    HEX = 4,
    /**
     * colors as rgb values
     */
    RGBA = 5,
    /**
     * colors using rgb
     */
    HSLA = 6,
    /**
     * colors using hwb
     */
    HWB = 7,
    /**
     * colors using cmyk
     */
    CMYK = 8,
    /**
     * colors using oklab
     * */
    OKLAB = 9,
    /**
     * colors using oklch
     * */
    OKLCH = 10,
    /**
     * colors using lab
     */
    LAB = 11,
    /**
     * colors using lch
     */
    LCH = 12,
    /**
     * colors using color() function
     */
    COLOR = 13,
    /**
     * color using srgb
     */
    SRGB = 14,
    /**
     * color using prophoto-rgb
     */
    PROPHOTO_RGB = 15,
    /**
     * color using a98-rgb
     */
    A98_RGB = 16,
    /**
     * color using rec2020
     */
    REC2020 = 17,
    /**
     * color using display-p3
     */
    DISPLAY_P3 = 18,
    /**
     * color using srgb-linear
     */
    SRGB_LINEAR = 19,
    /**
     * color using xyz-d50
     */
    XYZ_D50 = 20,
    /**
     * color using xyz-d65
     */
    XYZ_D65 = 21,
    /**
     * light-dark() color function
     */
    LIGHT_DARK = 22,
    /**
     * color-mix() color function
     */
    COLOR_MIX = 23,
    /**
     * non-standard color
     */
    NON_STD = 24,
    /**
     * custom color
     */
    CUSTOM_COLOR = 25,
    /**
     * alpha() color function
     */
    ALPHA = 26,
    /**
     * color using display-p3-linear
     */
    DISPLAY_P3_LINEAR = 27,
    /**
     * Contrast color
     */
    CONTRAST_COLOR = 28,
    /**
     * color layers
     */
    COLOR_LAYERS = 29,
    /**
     * alias for rgba
     */
    RGB = 5,
    /**
     * alias for hsl
     */
    HSL = 6,
    /**
     * alias for xyz-d65
     */
    XYZ = 21,
    /**
     * alias for cmyk
     */
    DEVICE_CMYK = 8
}
/**
 * Supported module case transform
 */
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
/**
 * Supported module scope
 */
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
/**
 * Options returned by the filters of {@link AstArena.walk} and {@link AstArena.walkValues}
 */
export declare enum WalkerOptionEnum {
    /**
     * ignore the current node and its children
     */
    Ignore = 1,
    /**
     * stop walking the tree
     */
    Stop = 2,
    /**
     * ignore the current node and process its children
     */
    Children = 4,
    /**
     * ignore the current node children
     */
    IgnoreChildren = 8
}
/**
 * Event types of the {@link AstArena.walkValues} filter
 */
export declare enum WalkerEvent {
    /**
     * enter node
     */
    Enter = 1,
    /**
     * leave node
     */
    Leave = 2
}
