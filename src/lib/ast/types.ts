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
 * validation level enum
 */
export enum ValidationLevel {

    /**
     * disable validation
     */
    None,
    /**
     * validate selectors and at-rules
     */
    Default, // selectors + at-rules
    /**
     * validate selectors, at-rules and declarations
     */
    All // selectors + at-rules + declarations
}


/**
 * token types enum
 */
export enum EnumToken {
    CommentTokenType,
    CDOCOMMTokenType,
    StyleSheetNodeType,
    AtRuleNodeType,
    RuleNodeType,
    DeclarationNodeType,
    LiteralTokenType,
    IdenTokenType,
    DashedIdenTokenType,
    CommaTokenType,
    ColonTokenType,
    SemiColonTokenType,
    NumberTokenType,
    AtRuleTokenType,
    PercentageTokenType,
    FunctionTokenType,
    TimelineFunctionTokenType,
    TimingFunctionTokenType,
    UrlFunctionTokenType,
    ImageFunctionTokenType,
    StringTokenType,
    UnclosedStringTokenType,
    DimensionTokenType,
    LengthTokenType,
    AngleTokenType,
    TimeTokenType,
    FrequencyTokenType,
    ResolutionTokenType,
    HashTokenType,
    BlockStartTokenType,
    BlockEndTokenType,
    AttrStartTokenType,
    AttrEndTokenType,
    StartParensTokenType,
    EndParensTokenType,
    ParensTokenType,
    WhitespaceTokenType,
    IncludeMatchTokenType,
    DashMatchTokenType,
    EqualMatchTokenType,
    LtTokenType,
    LteTokenType,
    GtTokenType,
    GteTokenType,
    PseudoClassTokenType,
    PseudoClassFuncTokenType,
    DelimTokenType,
    UrlTokenTokenType,
    EOFTokenType,
    ImportantTokenType,
    ColorTokenType,
    AttrTokenType,
    BadCommentTokenType,
    BadCdoTokenType,
    BadUrlTokenType,
    BadStringTokenType,
    BinaryExpressionTokenType,
    UnaryExpressionTokenType,
    FlexTokenType,
    /* catch all */
    ListToken,
    /* arithmetic tokens */
    Add,
    Mul,
    Div,
    Sub,
    /* new tokens */
    ColumnCombinatorTokenType,
    ContainMatchTokenType,
    StartMatchTokenType,
    EndMatchTokenType,
    MatchExpressionTokenType,
    NameSpaceAttributeTokenType,
    FractionTokenType,
    IdenListTokenType,
    GridTemplateFuncTokenType,
    KeyFrameRuleNodeType,
    ClassSelectorTokenType,
    UniversalSelectorTokenType,
    ChildCombinatorTokenType, // >
    DescendantCombinatorTokenType, // whitespace
    NextSiblingCombinatorTokenType, // +
    SubsequentSiblingCombinatorTokenType, // ~
    NestingSelectorTokenType, // &
    InvalidRuleTokenType,
    InvalidClassSelectorTokenType,
    InvalidAttrTokenType,
    InvalidAtRuleTokenType,
    MediaQueryConditionTokenType,
    MediaFeatureTokenType,
    MediaFeatureOnlyTokenType,
    MediaFeatureNotTokenType,
    MediaFeatureAndTokenType,
    MediaFeatureOrTokenType,
    PseudoPageTokenType,
    PseudoElementTokenType,
    KeyframeAtRuleNodeType,
    InvalidDeclarationNodeType,
    /* aliases */
    Time = TimeTokenType,
    Iden = IdenTokenType,
    EOF = EOFTokenType,
    Hash = HashTokenType,
    Flex = FlexTokenType,
    Angle = AngleTokenType,
    Color = ColorTokenType,
    Comma = CommaTokenType,
    String = StringTokenType,
    Length = LengthTokenType,
    Number = NumberTokenType,
    Perc = PercentageTokenType,
    Literal = LiteralTokenType,
    Comment = CommentTokenType,
    UrlFunc = UrlFunctionTokenType,
    Dimension = DimensionTokenType,
    Frequency = FrequencyTokenType,
    Resolution = ResolutionTokenType,
    Whitespace = WhitespaceTokenType,
    IdenList = IdenListTokenType,
    DashedIden = DashedIdenTokenType,
    GridTemplateFunc = GridTemplateFuncTokenType,
    ImageFunc = ImageFunctionTokenType,
    CommentNodeType = CommentTokenType,
    CDOCOMMNodeType = CDOCOMMTokenType,
    TimingFunction = TimingFunctionTokenType,
    TimelineFunction = TimelineFunctionTokenType,
}

/**
 * color types enum
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
    DEVICE_CMYK= CMYK
}