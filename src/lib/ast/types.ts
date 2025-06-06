export enum ValidationLevel {
    Valid,
    Drop,
    Lenient/* preserve unknown at-rules, declarations and pseudo-classes */
}

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

export const funcLike: EnumToken[] = [
    EnumToken.ParensTokenType,
    EnumToken.FunctionTokenType,
    EnumToken.UrlFunctionTokenType,
    EnumToken.StartParensTokenType,
    EnumToken.ImageFunctionTokenType,
    EnumToken.TimingFunctionTokenType,
    EnumToken.TimingFunctionTokenType,
    EnumToken.PseudoClassFuncTokenType,
    EnumToken.GridTemplateFuncTokenType
];
