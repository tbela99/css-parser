export enum SyntaxValidationResult {
    Valid,
    Drop,
    Lenient/* preserve unknown at-rules, declarations and pseudo-classes */
}

/**
 * color types enum
 */
export enum ColorType {
    /**
     * convert color to hex
     */
    HEX,
    /**
     * convert color to rgb
     */
    RGBA,
    /**
     * convert color to hwb
     */
    HWB,
    /**
     * convert color to hsl
     */
    HSLA,
    /**
     * convert color to cmyk
     */
    DEVICE_CMYK,
    /**
     * convert color to lch
     */
    LCH,
    /**
     * convert color to oklch
     */
    OKLCH,
    /**
     * convert color to lab
     */
    LAB,
    /**
     * convert color to oklab
     */
    OKLAB,
    /**
     * convert color to xyz
     */
    XYZ_D65,
    /**
     * convert color to xyz-d50
     */
    XYZ_D50,
    /**
     * convert color to srgb
     */
    SRGB,
    /**
     * convert color to srgb-linear
     */
    SRGB_LINEAR,
    /**
     * convert color to display-p3
     */
    DISPLAY_P3,
    /**
     * convert color to a98-rgb
     */
    A98_RGB,
    /**
     * convert color to prophoto-rgb
     */
    PROPHOTO_RGB,
    /**
     * convert color to rec2020
     */
    REC2020,
    /**
     * alias for hsl
     */
    HSL = HSLA,
    /**
     * alias for rgba
     */
    RGB = RGBA,
    /**
     * alias for xyz-d65
     */
    XYZ = XYZ_D65
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

