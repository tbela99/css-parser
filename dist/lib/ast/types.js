/**
 * syntax validation enum
 */
var SyntaxValidationResult;
(function (SyntaxValidationResult) {
    /** valid syntax */
    SyntaxValidationResult[SyntaxValidationResult["Valid"] = 0] = "Valid";
    /** drop invalid syntax */
    SyntaxValidationResult[SyntaxValidationResult["Drop"] = 1] = "Drop";
    /** preserve unknown at-rules, declarations and pseudo-classes */
    SyntaxValidationResult[SyntaxValidationResult["Lenient"] = 2] = "Lenient";
})(SyntaxValidationResult || (SyntaxValidationResult = {}));
/**
 * validation level enum
 */
var ValidationLevel;
(function (ValidationLevel) {
    /**
     * disable validation
     */
    ValidationLevel[ValidationLevel["None"] = 0] = "None";
    /**
     * validate selectors and at-rules
     */
    ValidationLevel[ValidationLevel["Default"] = 1] = "Default";
    /**
     * validate selectors, at-rules and declarations
     */
    ValidationLevel[ValidationLevel["All"] = 2] = "All"; // selectors + at-rules + declarations
})(ValidationLevel || (ValidationLevel = {}));
/**
 * token types enum
 */
var EnumToken;
(function (EnumToken) {
    EnumToken[EnumToken["CommentTokenType"] = 0] = "CommentTokenType";
    EnumToken[EnumToken["CDOCOMMTokenType"] = 1] = "CDOCOMMTokenType";
    EnumToken[EnumToken["StyleSheetNodeType"] = 2] = "StyleSheetNodeType";
    EnumToken[EnumToken["AtRuleNodeType"] = 3] = "AtRuleNodeType";
    EnumToken[EnumToken["RuleNodeType"] = 4] = "RuleNodeType";
    EnumToken[EnumToken["DeclarationNodeType"] = 5] = "DeclarationNodeType";
    EnumToken[EnumToken["LiteralTokenType"] = 6] = "LiteralTokenType";
    EnumToken[EnumToken["IdenTokenType"] = 7] = "IdenTokenType";
    EnumToken[EnumToken["DashedIdenTokenType"] = 8] = "DashedIdenTokenType";
    EnumToken[EnumToken["CommaTokenType"] = 9] = "CommaTokenType";
    EnumToken[EnumToken["ColonTokenType"] = 10] = "ColonTokenType";
    EnumToken[EnumToken["SemiColonTokenType"] = 11] = "SemiColonTokenType";
    EnumToken[EnumToken["NumberTokenType"] = 12] = "NumberTokenType";
    EnumToken[EnumToken["AtRuleTokenType"] = 13] = "AtRuleTokenType";
    EnumToken[EnumToken["PercentageTokenType"] = 14] = "PercentageTokenType";
    EnumToken[EnumToken["FunctionTokenType"] = 15] = "FunctionTokenType";
    EnumToken[EnumToken["TimelineFunctionTokenType"] = 16] = "TimelineFunctionTokenType";
    EnumToken[EnumToken["TimingFunctionTokenType"] = 17] = "TimingFunctionTokenType";
    EnumToken[EnumToken["UrlFunctionTokenType"] = 18] = "UrlFunctionTokenType";
    EnumToken[EnumToken["ImageFunctionTokenType"] = 19] = "ImageFunctionTokenType";
    EnumToken[EnumToken["StringTokenType"] = 20] = "StringTokenType";
    EnumToken[EnumToken["UnclosedStringTokenType"] = 21] = "UnclosedStringTokenType";
    EnumToken[EnumToken["DimensionTokenType"] = 22] = "DimensionTokenType";
    EnumToken[EnumToken["LengthTokenType"] = 23] = "LengthTokenType";
    EnumToken[EnumToken["AngleTokenType"] = 24] = "AngleTokenType";
    EnumToken[EnumToken["TimeTokenType"] = 25] = "TimeTokenType";
    EnumToken[EnumToken["FrequencyTokenType"] = 26] = "FrequencyTokenType";
    EnumToken[EnumToken["ResolutionTokenType"] = 27] = "ResolutionTokenType";
    EnumToken[EnumToken["HashTokenType"] = 28] = "HashTokenType";
    EnumToken[EnumToken["BlockStartTokenType"] = 29] = "BlockStartTokenType";
    EnumToken[EnumToken["BlockEndTokenType"] = 30] = "BlockEndTokenType";
    EnumToken[EnumToken["AttrStartTokenType"] = 31] = "AttrStartTokenType";
    EnumToken[EnumToken["AttrEndTokenType"] = 32] = "AttrEndTokenType";
    EnumToken[EnumToken["StartParensTokenType"] = 33] = "StartParensTokenType";
    EnumToken[EnumToken["EndParensTokenType"] = 34] = "EndParensTokenType";
    EnumToken[EnumToken["ParensTokenType"] = 35] = "ParensTokenType";
    EnumToken[EnumToken["WhitespaceTokenType"] = 36] = "WhitespaceTokenType";
    EnumToken[EnumToken["IncludeMatchTokenType"] = 37] = "IncludeMatchTokenType";
    EnumToken[EnumToken["DashMatchTokenType"] = 38] = "DashMatchTokenType";
    EnumToken[EnumToken["EqualMatchTokenType"] = 39] = "EqualMatchTokenType";
    EnumToken[EnumToken["LtTokenType"] = 40] = "LtTokenType";
    EnumToken[EnumToken["LteTokenType"] = 41] = "LteTokenType";
    EnumToken[EnumToken["GtTokenType"] = 42] = "GtTokenType";
    EnumToken[EnumToken["GteTokenType"] = 43] = "GteTokenType";
    EnumToken[EnumToken["PseudoClassTokenType"] = 44] = "PseudoClassTokenType";
    EnumToken[EnumToken["PseudoClassFuncTokenType"] = 45] = "PseudoClassFuncTokenType";
    EnumToken[EnumToken["DelimTokenType"] = 46] = "DelimTokenType";
    EnumToken[EnumToken["UrlTokenTokenType"] = 47] = "UrlTokenTokenType";
    EnumToken[EnumToken["EOFTokenType"] = 48] = "EOFTokenType";
    EnumToken[EnumToken["ImportantTokenType"] = 49] = "ImportantTokenType";
    EnumToken[EnumToken["ColorTokenType"] = 50] = "ColorTokenType";
    EnumToken[EnumToken["AttrTokenType"] = 51] = "AttrTokenType";
    EnumToken[EnumToken["BadCommentTokenType"] = 52] = "BadCommentTokenType";
    EnumToken[EnumToken["BadCdoTokenType"] = 53] = "BadCdoTokenType";
    EnumToken[EnumToken["BadUrlTokenType"] = 54] = "BadUrlTokenType";
    EnumToken[EnumToken["BadStringTokenType"] = 55] = "BadStringTokenType";
    EnumToken[EnumToken["BinaryExpressionTokenType"] = 56] = "BinaryExpressionTokenType";
    EnumToken[EnumToken["UnaryExpressionTokenType"] = 57] = "UnaryExpressionTokenType";
    EnumToken[EnumToken["FlexTokenType"] = 58] = "FlexTokenType";
    /* catch all */
    EnumToken[EnumToken["ListToken"] = 59] = "ListToken";
    /* arithmetic tokens */
    EnumToken[EnumToken["Add"] = 60] = "Add";
    EnumToken[EnumToken["Mul"] = 61] = "Mul";
    EnumToken[EnumToken["Div"] = 62] = "Div";
    EnumToken[EnumToken["Sub"] = 63] = "Sub";
    /* new tokens */
    EnumToken[EnumToken["ColumnCombinatorTokenType"] = 64] = "ColumnCombinatorTokenType";
    EnumToken[EnumToken["ContainMatchTokenType"] = 65] = "ContainMatchTokenType";
    EnumToken[EnumToken["StartMatchTokenType"] = 66] = "StartMatchTokenType";
    EnumToken[EnumToken["EndMatchTokenType"] = 67] = "EndMatchTokenType";
    EnumToken[EnumToken["MatchExpressionTokenType"] = 68] = "MatchExpressionTokenType";
    EnumToken[EnumToken["NameSpaceAttributeTokenType"] = 69] = "NameSpaceAttributeTokenType";
    EnumToken[EnumToken["FractionTokenType"] = 70] = "FractionTokenType";
    EnumToken[EnumToken["IdenListTokenType"] = 71] = "IdenListTokenType";
    EnumToken[EnumToken["GridTemplateFuncTokenType"] = 72] = "GridTemplateFuncTokenType";
    EnumToken[EnumToken["KeyFrameRuleNodeType"] = 73] = "KeyFrameRuleNodeType";
    EnumToken[EnumToken["ClassSelectorTokenType"] = 74] = "ClassSelectorTokenType";
    EnumToken[EnumToken["UniversalSelectorTokenType"] = 75] = "UniversalSelectorTokenType";
    EnumToken[EnumToken["ChildCombinatorTokenType"] = 76] = "ChildCombinatorTokenType";
    EnumToken[EnumToken["DescendantCombinatorTokenType"] = 77] = "DescendantCombinatorTokenType";
    EnumToken[EnumToken["NextSiblingCombinatorTokenType"] = 78] = "NextSiblingCombinatorTokenType";
    EnumToken[EnumToken["SubsequentSiblingCombinatorTokenType"] = 79] = "SubsequentSiblingCombinatorTokenType";
    EnumToken[EnumToken["NestingSelectorTokenType"] = 80] = "NestingSelectorTokenType";
    EnumToken[EnumToken["InvalidRuleTokenType"] = 81] = "InvalidRuleTokenType";
    EnumToken[EnumToken["InvalidClassSelectorTokenType"] = 82] = "InvalidClassSelectorTokenType";
    EnumToken[EnumToken["InvalidAttrTokenType"] = 83] = "InvalidAttrTokenType";
    EnumToken[EnumToken["InvalidAtRuleTokenType"] = 84] = "InvalidAtRuleTokenType";
    EnumToken[EnumToken["MediaQueryConditionTokenType"] = 85] = "MediaQueryConditionTokenType";
    EnumToken[EnumToken["MediaFeatureTokenType"] = 86] = "MediaFeatureTokenType";
    EnumToken[EnumToken["MediaFeatureOnlyTokenType"] = 87] = "MediaFeatureOnlyTokenType";
    EnumToken[EnumToken["MediaFeatureNotTokenType"] = 88] = "MediaFeatureNotTokenType";
    EnumToken[EnumToken["MediaFeatureAndTokenType"] = 89] = "MediaFeatureAndTokenType";
    EnumToken[EnumToken["MediaFeatureOrTokenType"] = 90] = "MediaFeatureOrTokenType";
    EnumToken[EnumToken["PseudoPageTokenType"] = 91] = "PseudoPageTokenType";
    EnumToken[EnumToken["PseudoElementTokenType"] = 92] = "PseudoElementTokenType";
    EnumToken[EnumToken["KeyframeAtRuleNodeType"] = 93] = "KeyframeAtRuleNodeType";
    EnumToken[EnumToken["InvalidDeclarationNodeType"] = 94] = "InvalidDeclarationNodeType";
    /* aliases */
    EnumToken[EnumToken["Time"] = 25] = "Time";
    EnumToken[EnumToken["Iden"] = 7] = "Iden";
    EnumToken[EnumToken["EOF"] = 48] = "EOF";
    EnumToken[EnumToken["Hash"] = 28] = "Hash";
    EnumToken[EnumToken["Flex"] = 58] = "Flex";
    EnumToken[EnumToken["Angle"] = 24] = "Angle";
    EnumToken[EnumToken["Color"] = 50] = "Color";
    EnumToken[EnumToken["Comma"] = 9] = "Comma";
    EnumToken[EnumToken["String"] = 20] = "String";
    EnumToken[EnumToken["Length"] = 23] = "Length";
    EnumToken[EnumToken["Number"] = 12] = "Number";
    EnumToken[EnumToken["Perc"] = 14] = "Perc";
    EnumToken[EnumToken["Literal"] = 6] = "Literal";
    EnumToken[EnumToken["Comment"] = 0] = "Comment";
    EnumToken[EnumToken["UrlFunc"] = 18] = "UrlFunc";
    EnumToken[EnumToken["Dimension"] = 22] = "Dimension";
    EnumToken[EnumToken["Frequency"] = 26] = "Frequency";
    EnumToken[EnumToken["Resolution"] = 27] = "Resolution";
    EnumToken[EnumToken["Whitespace"] = 36] = "Whitespace";
    EnumToken[EnumToken["IdenList"] = 71] = "IdenList";
    EnumToken[EnumToken["DashedIden"] = 8] = "DashedIden";
    EnumToken[EnumToken["GridTemplateFunc"] = 72] = "GridTemplateFunc";
    EnumToken[EnumToken["ImageFunc"] = 19] = "ImageFunc";
    EnumToken[EnumToken["CommentNodeType"] = 0] = "CommentNodeType";
    EnumToken[EnumToken["CDOCOMMNodeType"] = 1] = "CDOCOMMNodeType";
    EnumToken[EnumToken["TimingFunction"] = 17] = "TimingFunction";
    EnumToken[EnumToken["TimelineFunction"] = 16] = "TimelineFunction";
})(EnumToken || (EnumToken = {}));
/**
 * color types enum
 */
var ColorType;
(function (ColorType) {
    /**
     * system colors
     */
    ColorType[ColorType["SYS"] = 0] = "SYS";
    /**
     * deprecated system colors
     */
    ColorType[ColorType["DPSYS"] = 1] = "DPSYS";
    /**
     * colors as literals
     */
    ColorType[ColorType["LIT"] = 2] = "LIT";
    /**
     * colors as hex values
     */
    ColorType[ColorType["HEX"] = 3] = "HEX";
    /**
     * colors as rgb values
     */
    ColorType[ColorType["RGBA"] = 4] = "RGBA";
    /**
     * colors as hsl values
     */
    ColorType[ColorType["HSLA"] = 5] = "HSLA";
    /**
     * colors as hwb values
     */
    ColorType[ColorType["HWB"] = 6] = "HWB";
    /**
     * colors as cmyk values
     */
    ColorType[ColorType["CMYK"] = 7] = "CMYK";
    /**
     * colors as oklab values
     * */
    ColorType[ColorType["OKLAB"] = 8] = "OKLAB";
    /**
     * colors as oklch values
     * */
    ColorType[ColorType["OKLCH"] = 9] = "OKLCH";
    /**
     * colors as lab values
     */
    ColorType[ColorType["LAB"] = 10] = "LAB";
    /**
     * colors as lch values
     */
    ColorType[ColorType["LCH"] = 11] = "LCH";
    /**
     * colors using color() function
     */
    ColorType[ColorType["COLOR"] = 12] = "COLOR";
    /**
     * color using srgb values
     */
    ColorType[ColorType["SRGB"] = 13] = "SRGB";
    /**
     * color using prophoto-rgb values
     */
    ColorType[ColorType["PROPHOTO_RGB"] = 14] = "PROPHOTO_RGB";
    /**
     * color using a98-rgb values
     */
    ColorType[ColorType["A98_RGB"] = 15] = "A98_RGB";
    /**
     * color using rec2020 values
     */
    ColorType[ColorType["REC2020"] = 16] = "REC2020";
    /**
     * color using display-p3 values
     */
    ColorType[ColorType["DISPLAY_P3"] = 17] = "DISPLAY_P3";
    /**
     * color using srgb-linear values
     */
    ColorType[ColorType["SRGB_LINEAR"] = 18] = "SRGB_LINEAR";
    /**
     * color using xyz-d50 values
     */
    ColorType[ColorType["XYZ_D50"] = 19] = "XYZ_D50";
    /**
     * color using xyz-d65 values
     */
    ColorType[ColorType["XYZ_D65"] = 20] = "XYZ_D65";
    /**
     * light-dark() color function
     */
    ColorType[ColorType["LIGHT_DARK"] = 21] = "LIGHT_DARK";
    /**
     * color-mix() color function
     */
    ColorType[ColorType["COLOR_MIX"] = 22] = "COLOR_MIX";
    /**
     * alias for rgba
     */
    ColorType[ColorType["RGB"] = 4] = "RGB";
    /**
     * alias for hsl
     */
    ColorType[ColorType["HSL"] = 5] = "HSL";
    /**
     * alias for xyz-d65
     */
    ColorType[ColorType["XYZ"] = 20] = "XYZ";
    /**
     * alias for cmyk
     */
    ColorType[ColorType["DEVICE_CMYK"] = 7] = "DEVICE_CMYK";
})(ColorType || (ColorType = {}));

export { ColorType, EnumToken, SyntaxValidationResult, ValidationLevel };
