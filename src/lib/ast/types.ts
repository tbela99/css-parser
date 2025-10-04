/**
 * syntax validation enum
 */
export enum SyntaxValidationResult {
    /** valid syntax */
    Valid,
    /** drop invalid syntax */
    Drop,
    /** preserve unknown at-rules, declarations and pseudo-classes */
    Lenient
}

/**
 * enum of validation levels
 */
export enum ValidationLevel {

    /**
     * disable validation
     */
    None,
    /**
     * validate selectors
     */
    Selector = 0x1,
    /**
     * validate at-rules
     */
    AtRule = 0x2,

    /**
     * validate declarations
     */
    Declaration = 0x4,
    /**
     * validate selectors and at-rules
     */
    Default = Selector | AtRule, // selectors + at-rules
    /**
     * validate selectors, at-rules and declarations
     */
    All = Selector | AtRule | Declaration // selectors + at-rules + declarations
}

/**
 * enum of all token types
 */
export enum EnumToken {
    /**
     * comment token
     */
    CommentTokenType,
    /**
     * cdata section token
     */
    CDOCOMMTokenType,
    /**
     * style sheet node type
     */
    StyleSheetNodeType,
    /**
     * at-rule node type
     */
    AtRuleNodeType,
    /**
     * rule node type
     */
    RuleNodeType,
    /**
     * declaration node type
     */
    DeclarationNodeType,
    /**
     * literal token type
     */
    LiteralTokenType,
    /**
     * identifier token type
     */
    IdenTokenType,
    /**
     * dashed identifier token type
     */
    DashedIdenTokenType,
    /**
     * comma token type
     */
    CommaTokenType,
    /**
     * colon token type
     */
    ColonTokenType,
    /**
     * semicolon token type
     */
    SemiColonTokenType,
    /**
     * number token type
     */
    NumberTokenType,
    /**
     * at-rule token type
     */
    AtRuleTokenType,
    /**
     * percentage token type
     */
    PercentageTokenType,
    /**
     * function token type
     */
    FunctionTokenType,
    /**
     * timeline function token type
     */
    TimelineFunctionTokenType,
    /**
     * timing function token type
     */
    TimingFunctionTokenType,
    /**
     * url function token type
     */
    UrlFunctionTokenType,
    /**
     * image function token type
     */
    ImageFunctionTokenType,
    /**
     * string token type
     */
    StringTokenType,
    /**
     * unclosed string token type
     */
    UnclosedStringTokenType,
    /**
     * dimension token type
     */
    DimensionTokenType,
    /**
     * length token type
     */
    LengthTokenType,
    /**
     * angle token type
     */
    AngleTokenType,
    /**
     * time token type
     */
    TimeTokenType,
    /**
     * frequency token type
     */
    FrequencyTokenType,
    /**
     * resolution token type
     */
    ResolutionTokenType,
    /**
     * hash token type
     */
    HashTokenType,
    /**
     * block start token type
     */
    BlockStartTokenType,
    /**
     * block end token type
     */
    BlockEndTokenType,
    /**
     * attribute start token type
     */
    AttrStartTokenType,
    /**
     * attribute end token type
     */
    AttrEndTokenType,
    /**
     * start parentheses token type
     */
    StartParensTokenType,
    /**
     * end parentheses token type
     */
    EndParensTokenType,
    /**
     * parentheses token type
     */
    ParensTokenType,
    /**
     * whitespace token type
     */
    WhitespaceTokenType,
    /**
     * include match token type
     */
    IncludeMatchTokenType,
    /**
     * dash match token type
     */
    DashMatchTokenType,
    /**
     * equal match token type
     */
    EqualMatchTokenType,
    /**
     * less than token type
     */
    LtTokenType,
    /**
     * less than or equal to token type
     */
    LteTokenType,
    /**
     * greater than token type
     */
    GtTokenType,
    /**
     * greater than or equal to token type
     */
    GteTokenType,
    /**
     * pseudo-class token type
     */
    PseudoClassTokenType,
    /**
     * pseudo-class function token type
     */
    PseudoClassFuncTokenType,
    /**
     * delimiter token type
     */
    DelimTokenType,
    /**
     * URL token type
     */
    UrlTokenTokenType,
    /**
     * end of file token type
     */
    EOFTokenType,
    /**
     * important token type
     */
    ImportantTokenType,
    /**
     * color token type
     */
    ColorTokenType,
    /**
     * attribute token type
     */
    AttrTokenType,
    /**
     * bad comment token type
     */
    BadCommentTokenType,
    /**
     * bad cdo token type
     */
    BadCdoTokenType,
    /**
     * bad URL token type
     */
    BadUrlTokenType,
    /**
     * bad string token type
     */
    BadStringTokenType,
    /**
     * binary expression token type
     */
    BinaryExpressionTokenType,
    /**
     * unary expression token type
     */
    UnaryExpressionTokenType,
    /**
     * flex token type
     */
    FlexTokenType,
    /**
     *  token list token type
     */
    ListToken,
    /* arithmetic tokens */
    /**
     * addition token type
     */
    Add,
    /**
     * multiplication token type
     */
    Mul,
    /**
     * division token type
     */
    Div,
    /**
     * subtraction token type
     */
    Sub,
    /* new tokens */
    /**
     * column combinator token type
     */
    ColumnCombinatorTokenType,
    /**
     * contain match token type
     */
    ContainMatchTokenType,
    /**
     * start match token type
     */
    StartMatchTokenType,
    /**
     * end match token type
     */
    EndMatchTokenType,
    /**
     * match expression token type
     */
    MatchExpressionTokenType,
    /**
     * namespace attribute token type
     */
    NameSpaceAttributeTokenType,
    /**
     * fraction token type
     */
    FractionTokenType,
    /**
     * identifier list token type
     */
    IdenListTokenType,
    /**
     * grid template function token type
     */
    GridTemplateFuncTokenType,
    /**
     * keyframe rule node type
     */
    KeyFramesRuleNodeType,
    /**
     * class selector token type
     */
    ClassSelectorTokenType,
    /**
     * universal selector token type
     */
    UniversalSelectorTokenType,
    /**
     * child combinator token type
     */
    ChildCombinatorTokenType, // >
    /**
     * descendant combinator token type
     */
    DescendantCombinatorTokenType, // whitespace
    /**
     * next sibling combinator token type
     */
    NextSiblingCombinatorTokenType, // +
    /**
     * subsequent sibling combinator token type
     */
    SubsequentSiblingCombinatorTokenType, // ~
    /**
     * nesting selector token type
     */
    NestingSelectorTokenType, // &
    /**
     * invalid rule token type
     */
    InvalidRuleTokenType,
    /**
     * invalid class selector token type
     */
    InvalidClassSelectorTokenType,
    /**
     * invalid attribute token type
     */
    InvalidAttrTokenType,
    /**
     * invalid at rule token type
     */
    InvalidAtRuleTokenType,
    /**
     * media query condition token type
     */
    MediaQueryConditionTokenType,
    /**
     * media feature token type
     */
    MediaFeatureTokenType,
    /**
     * media feature only token type
     */
    MediaFeatureOnlyTokenType,
    /**
     * media feature not token type
     */
    MediaFeatureNotTokenType,
    /**
     * media feature and token type
     */
    MediaFeatureAndTokenType,
    /**
     * media feature or token type
     */
    MediaFeatureOrTokenType,
    /**
     * pseudo page token type
     */
    PseudoPageTokenType,
    /**
     * pseudo element token type
     */
    PseudoElementTokenType,
    /**
     * keyframe at rule node type
     */
    KeyframesAtRuleNodeType,
    /**
     * invalid declaration node type
     */
    InvalidDeclarationNodeType,

    /**
     * composes token node type
     */
    ComposesSelectorNodeType,

    /**
     * css variable token type
     */
    CssVariableTokenType,

    /* aliases */

    /**
     * alias for time token type
     */
    Time = TimeTokenType,
    /**
     * alias for identifier token type
     */
    Iden = IdenTokenType,
    /**
     * alias for end of file token type
     */
    EOF = EOFTokenType,
    /**
     * alias for hash token type
     */
    Hash = HashTokenType,
    /**
     * alias for flex token type
     */
    Flex = FlexTokenType,
    /**
     * alias for angle token type
     */
    Angle = AngleTokenType,
    /**
     * alias for color token type
     */
    Color = ColorTokenType,
    /**
     * alias for comma token type
     */
    Comma = CommaTokenType,
    /**
     * alias for string token type
     */
    String = StringTokenType,
    /**
     * alias for length token type
     */
    Length = LengthTokenType,
    /**
     * alias for number token type
     */
    Number = NumberTokenType,
    /**
     * alias for percentage token type
     */
    Perc = PercentageTokenType,
    /**
     * alias for literal token type
     */
    Literal = LiteralTokenType,
    /**
     * alias for comment token type
     */
    Comment = CommentTokenType,
    /**
     * alias for url function token type
     */
    UrlFunc = UrlFunctionTokenType,
    /**
     * alias for dimension token type
     */
    Dimension = DimensionTokenType,
    /**
     * alias for frequency token type
     */
    Frequency = FrequencyTokenType,
    /**
     * alias for resolution token type
     */
    Resolution = ResolutionTokenType,
    /**
     * alias for whitespace token type
     */
    Whitespace = WhitespaceTokenType,
    /**
     * alias for identifier list token type
     */
    IdenList = IdenListTokenType,
    /**
     * alias for dashed identifier token type
     */
    DashedIden = DashedIdenTokenType,
    /**
     * alias for grid template function token type
     */
    GridTemplateFunc = GridTemplateFuncTokenType,
    /**
     * alias for image function token type
     */
    ImageFunc = ImageFunctionTokenType,
    /**
     * alias for comment node type
     */
    CommentNodeType = CommentTokenType,
    /**
     * alias for cdata section node type
     */
    CDOCOMMNodeType = CDOCOMMTokenType,
    /**
     * alias for timing function token type
     */
    TimingFunction = TimingFunctionTokenType,
    /**
     * alias for timeline function token type
     */
    TimelineFunction = TimelineFunctionTokenType,
}

/**
 * supported color types enum
 */
export enum ColorType {

    /**
     * system colors
     */
    SYS,
    /**
     * deprecated system colors
     */
    DPSYS,
    /**
     * colors as literals
     */
    LIT,
    /**
     * colors as hex values
     */
    HEX,
    /**
     * colors as rgb values
     */
    RGBA,
    /**
     * colors as hsl values
     */
    HSLA,
    /**
     * colors as hwb values
     */
    HWB,
    /**
     * colors as cmyk values
     */
    CMYK,
    /**
     * colors as oklab values
     * */
    OKLAB,
    /**
     * colors as oklch values
     * */
    OKLCH,
    /**
     * colors as lab values
     */
    LAB,
    /**
     * colors as lch values
     */
    LCH,
    /**
     * colors using color() function
     */
    COLOR,
    /**
     * color using srgb values
     */
    SRGB,
    /**
     * color using prophoto-rgb values
     */
    PROPHOTO_RGB,
    /**
     * color using a98-rgb values
     */
    A98_RGB,
    /**
     * color using rec2020 values
     */
    REC2020,
    /**
     * color using display-p3 values
     */
    DISPLAY_P3,
    /**
     * color using srgb-linear values
     */
    SRGB_LINEAR,
    /**
     * color using xyz-d50 values
     */
    XYZ_D50,
    /**
     * color using xyz-d65 values
     */
    XYZ_D65,
    /**
     * light-dark() color function
     */
    LIGHT_DARK,
    /**
     * color-mix() color function
     */
    COLOR_MIX,
    /**
     * alias for rgba
     */
    RGB = RGBA,
    /**
     * alias for hsl
     */
    HSL = HSLA,
    /**
     * alias for xyz-d65
     */
    XYZ = XYZ_D65,
    /**
     * alias for cmyk
     */
    DEVICE_CMYK = CMYK
}

export enum ModuleCaseTransformEnum {

    /**
     * export as-is
     */
    Ignore = 0x1,
    /**
     * transform class names and mapping key name
     */
    CamelCase = 0x2,
    /**
     * transform class names and mapping key name
     */
    CamelCaseOnly = 0x4,
    /**
     * transform class names and mapping key name
     */
    DashCase = 0x8,
    /**
     * transform class names and mapping key name
     */
    DashCaseOnly = 0x10
}

export enum ModuleScopeEnumOptions {
    Global = 0x20,
    Local = 0x40,
    Pure = 0x80,
    ICSS = 0x100
}