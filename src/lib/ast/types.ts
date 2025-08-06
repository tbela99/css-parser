export enum SyntaxValidationResult {
    Valid,
    Drop,
    Lenient/* preserve unknown at-rules, declarations and pseudo-classes */
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

// xyz-d65 is an alias for xyz
export enum ColorType {

    SYS,
    DPSYS,
    LIT,
    HEX,
    RGBA,
    HSLA,
    HWB,
    CMYK,
    OKLAB,
    OKLCH,
    LAB,
    LCH,
    COLOR,
    SRGB,
    PROPHOTO_RGB,
    A98_RGB,
    REC2020,
    DISPLAY_P3,
    SRGB_LINEAR,
    XYZ_D50,
    XYZ_D65,
    LIGHT_DARK,
    COLOR_MIX,
    RGB = RGBA,
    HSL = HSLA,
    XYZ = XYZ_D65,
    DEVICE_CMYK= CMYK
}