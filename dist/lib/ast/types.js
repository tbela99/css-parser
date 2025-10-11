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
 * enum of validation levels
 */
var ValidationLevel;
(function (ValidationLevel) {
    /**
     * disable validation
     */
    ValidationLevel[ValidationLevel["None"] = 0] = "None";
    /**
     * validate selectors
     */
    ValidationLevel[ValidationLevel["Selector"] = 1] = "Selector";
    /**
     * validate at-rules
     */
    ValidationLevel[ValidationLevel["AtRule"] = 2] = "AtRule";
    /**
     * validate declarations
     */
    ValidationLevel[ValidationLevel["Declaration"] = 4] = "Declaration";
    /**
     * validate selectors and at-rules
     */
    ValidationLevel[ValidationLevel["Default"] = 3] = "Default";
    /**
     * validate selectors, at-rules and declarations
     */
    ValidationLevel[ValidationLevel["All"] = 7] = "All"; // selectors + at-rules + declarations
})(ValidationLevel || (ValidationLevel = {}));
/**
 * enum of all token types
 */
var EnumToken;
(function (EnumToken) {
    /**
     * comment token
     */
    EnumToken[EnumToken["CommentTokenType"] = 0] = "CommentTokenType";
    /**
     * cdata section token
     */
    EnumToken[EnumToken["CDOCOMMTokenType"] = 1] = "CDOCOMMTokenType";
    /**
     * style sheet node type
     */
    EnumToken[EnumToken["StyleSheetNodeType"] = 2] = "StyleSheetNodeType";
    /**
     * at-rule node type
     */
    EnumToken[EnumToken["AtRuleNodeType"] = 3] = "AtRuleNodeType";
    /**
     * rule node type
     */
    EnumToken[EnumToken["RuleNodeType"] = 4] = "RuleNodeType";
    /**
     * declaration node type
     */
    EnumToken[EnumToken["DeclarationNodeType"] = 5] = "DeclarationNodeType";
    /**
     * literal token type
     */
    EnumToken[EnumToken["LiteralTokenType"] = 6] = "LiteralTokenType";
    /**
     * identifier token type
     */
    EnumToken[EnumToken["IdenTokenType"] = 7] = "IdenTokenType";
    /**
     * dashed identifier token type
     */
    EnumToken[EnumToken["DashedIdenTokenType"] = 8] = "DashedIdenTokenType";
    /**
     * comma token type
     */
    EnumToken[EnumToken["CommaTokenType"] = 9] = "CommaTokenType";
    /**
     * colon token type
     */
    EnumToken[EnumToken["ColonTokenType"] = 10] = "ColonTokenType";
    /**
     * semicolon token type
     */
    EnumToken[EnumToken["SemiColonTokenType"] = 11] = "SemiColonTokenType";
    /**
     * number token type
     */
    EnumToken[EnumToken["NumberTokenType"] = 12] = "NumberTokenType";
    /**
     * at-rule token type
     */
    EnumToken[EnumToken["AtRuleTokenType"] = 13] = "AtRuleTokenType";
    /**
     * percentage token type
     */
    EnumToken[EnumToken["PercentageTokenType"] = 14] = "PercentageTokenType";
    /**
     * function token type
     */
    EnumToken[EnumToken["FunctionTokenType"] = 15] = "FunctionTokenType";
    /**
     * timeline function token type
     */
    EnumToken[EnumToken["TimelineFunctionTokenType"] = 16] = "TimelineFunctionTokenType";
    /**
     * timing function token type
     */
    EnumToken[EnumToken["TimingFunctionTokenType"] = 17] = "TimingFunctionTokenType";
    /**
     * url function token type
     */
    EnumToken[EnumToken["UrlFunctionTokenType"] = 18] = "UrlFunctionTokenType";
    /**
     * image function token type
     */
    EnumToken[EnumToken["ImageFunctionTokenType"] = 19] = "ImageFunctionTokenType";
    /**
     * string token type
     */
    EnumToken[EnumToken["StringTokenType"] = 20] = "StringTokenType";
    /**
     * unclosed string token type
     */
    EnumToken[EnumToken["UnclosedStringTokenType"] = 21] = "UnclosedStringTokenType";
    /**
     * dimension token type
     */
    EnumToken[EnumToken["DimensionTokenType"] = 22] = "DimensionTokenType";
    /**
     * length token type
     */
    EnumToken[EnumToken["LengthTokenType"] = 23] = "LengthTokenType";
    /**
     * angle token type
     */
    EnumToken[EnumToken["AngleTokenType"] = 24] = "AngleTokenType";
    /**
     * time token type
     */
    EnumToken[EnumToken["TimeTokenType"] = 25] = "TimeTokenType";
    /**
     * frequency token type
     */
    EnumToken[EnumToken["FrequencyTokenType"] = 26] = "FrequencyTokenType";
    /**
     * resolution token type
     */
    EnumToken[EnumToken["ResolutionTokenType"] = 27] = "ResolutionTokenType";
    /**
     * hash token type
     */
    EnumToken[EnumToken["HashTokenType"] = 28] = "HashTokenType";
    /**
     * block start token type
     */
    EnumToken[EnumToken["BlockStartTokenType"] = 29] = "BlockStartTokenType";
    /**
     * block end token type
     */
    EnumToken[EnumToken["BlockEndTokenType"] = 30] = "BlockEndTokenType";
    /**
     * attribute start token type
     */
    EnumToken[EnumToken["AttrStartTokenType"] = 31] = "AttrStartTokenType";
    /**
     * attribute end token type
     */
    EnumToken[EnumToken["AttrEndTokenType"] = 32] = "AttrEndTokenType";
    /**
     * start parentheses token type
     */
    EnumToken[EnumToken["StartParensTokenType"] = 33] = "StartParensTokenType";
    /**
     * end parentheses token type
     */
    EnumToken[EnumToken["EndParensTokenType"] = 34] = "EndParensTokenType";
    /**
     * parentheses token type
     */
    EnumToken[EnumToken["ParensTokenType"] = 35] = "ParensTokenType";
    /**
     * whitespace token type
     */
    EnumToken[EnumToken["WhitespaceTokenType"] = 36] = "WhitespaceTokenType";
    /**
     * include match token type
     */
    EnumToken[EnumToken["IncludeMatchTokenType"] = 37] = "IncludeMatchTokenType";
    /**
     * dash match token type
     */
    EnumToken[EnumToken["DashMatchTokenType"] = 38] = "DashMatchTokenType";
    /**
     * equal match token type
     */
    EnumToken[EnumToken["EqualMatchTokenType"] = 39] = "EqualMatchTokenType";
    /**
     * less than token type
     */
    EnumToken[EnumToken["LtTokenType"] = 40] = "LtTokenType";
    /**
     * less than or equal to token type
     */
    EnumToken[EnumToken["LteTokenType"] = 41] = "LteTokenType";
    /**
     * greater than token type
     */
    EnumToken[EnumToken["GtTokenType"] = 42] = "GtTokenType";
    /**
     * greater than or equal to token type
     */
    EnumToken[EnumToken["GteTokenType"] = 43] = "GteTokenType";
    /**
     * pseudo-class token type
     */
    EnumToken[EnumToken["PseudoClassTokenType"] = 44] = "PseudoClassTokenType";
    /**
     * pseudo-class function token type
     */
    EnumToken[EnumToken["PseudoClassFuncTokenType"] = 45] = "PseudoClassFuncTokenType";
    /**
     * delimiter token type
     */
    EnumToken[EnumToken["DelimTokenType"] = 46] = "DelimTokenType";
    /**
     * URL token type
     */
    EnumToken[EnumToken["UrlTokenTokenType"] = 47] = "UrlTokenTokenType";
    /**
     * end of file token type
     */
    EnumToken[EnumToken["EOFTokenType"] = 48] = "EOFTokenType";
    /**
     * important token type
     */
    EnumToken[EnumToken["ImportantTokenType"] = 49] = "ImportantTokenType";
    /**
     * color token type
     */
    EnumToken[EnumToken["ColorTokenType"] = 50] = "ColorTokenType";
    /**
     * attribute token type
     */
    EnumToken[EnumToken["AttrTokenType"] = 51] = "AttrTokenType";
    /**
     * bad comment token type
     */
    EnumToken[EnumToken["BadCommentTokenType"] = 52] = "BadCommentTokenType";
    /**
     * bad cdo token type
     */
    EnumToken[EnumToken["BadCdoTokenType"] = 53] = "BadCdoTokenType";
    /**
     * bad URL token type
     */
    EnumToken[EnumToken["BadUrlTokenType"] = 54] = "BadUrlTokenType";
    /**
     * bad string token type
     */
    EnumToken[EnumToken["BadStringTokenType"] = 55] = "BadStringTokenType";
    /**
     * binary expression token type
     */
    EnumToken[EnumToken["BinaryExpressionTokenType"] = 56] = "BinaryExpressionTokenType";
    /**
     * unary expression token type
     */
    EnumToken[EnumToken["UnaryExpressionTokenType"] = 57] = "UnaryExpressionTokenType";
    /**
     * flex token type
     */
    EnumToken[EnumToken["FlexTokenType"] = 58] = "FlexTokenType";
    /**
     *  token list token type
     */
    EnumToken[EnumToken["ListToken"] = 59] = "ListToken";
    /* arithmetic tokens */
    /**
     * addition token type
     */
    EnumToken[EnumToken["Add"] = 60] = "Add";
    /**
     * multiplication token type
     */
    EnumToken[EnumToken["Mul"] = 61] = "Mul";
    /**
     * division token type
     */
    EnumToken[EnumToken["Div"] = 62] = "Div";
    /**
     * subtraction token type
     */
    EnumToken[EnumToken["Sub"] = 63] = "Sub";
    /* new tokens */
    /**
     * column combinator token type
     */
    EnumToken[EnumToken["ColumnCombinatorTokenType"] = 64] = "ColumnCombinatorTokenType";
    /**
     * contain match token type
     */
    EnumToken[EnumToken["ContainMatchTokenType"] = 65] = "ContainMatchTokenType";
    /**
     * start match token type
     */
    EnumToken[EnumToken["StartMatchTokenType"] = 66] = "StartMatchTokenType";
    /**
     * end match token type
     */
    EnumToken[EnumToken["EndMatchTokenType"] = 67] = "EndMatchTokenType";
    /**
     * match expression token type
     */
    EnumToken[EnumToken["MatchExpressionTokenType"] = 68] = "MatchExpressionTokenType";
    /**
     * namespace attribute token type
     */
    EnumToken[EnumToken["NameSpaceAttributeTokenType"] = 69] = "NameSpaceAttributeTokenType";
    /**
     * fraction token type
     */
    EnumToken[EnumToken["FractionTokenType"] = 70] = "FractionTokenType";
    /**
     * identifier list token type
     */
    EnumToken[EnumToken["IdenListTokenType"] = 71] = "IdenListTokenType";
    /**
     * grid template function token type
     */
    EnumToken[EnumToken["GridTemplateFuncTokenType"] = 72] = "GridTemplateFuncTokenType";
    /**
     * keyframe rule node type
     */
    EnumToken[EnumToken["KeyFramesRuleNodeType"] = 73] = "KeyFramesRuleNodeType";
    /**
     * class selector token type
     */
    EnumToken[EnumToken["ClassSelectorTokenType"] = 74] = "ClassSelectorTokenType";
    /**
     * universal selector token type
     */
    EnumToken[EnumToken["UniversalSelectorTokenType"] = 75] = "UniversalSelectorTokenType";
    /**
     * child combinator token type
     */
    EnumToken[EnumToken["ChildCombinatorTokenType"] = 76] = "ChildCombinatorTokenType";
    /**
     * descendant combinator token type
     */
    EnumToken[EnumToken["DescendantCombinatorTokenType"] = 77] = "DescendantCombinatorTokenType";
    /**
     * next sibling combinator token type
     */
    EnumToken[EnumToken["NextSiblingCombinatorTokenType"] = 78] = "NextSiblingCombinatorTokenType";
    /**
     * subsequent sibling combinator token type
     */
    EnumToken[EnumToken["SubsequentSiblingCombinatorTokenType"] = 79] = "SubsequentSiblingCombinatorTokenType";
    /**
     * nesting selector token type
     */
    EnumToken[EnumToken["NestingSelectorTokenType"] = 80] = "NestingSelectorTokenType";
    /**
     * invalid rule token type
     */
    EnumToken[EnumToken["InvalidRuleTokenType"] = 81] = "InvalidRuleTokenType";
    /**
     * invalid class selector token type
     */
    EnumToken[EnumToken["InvalidClassSelectorTokenType"] = 82] = "InvalidClassSelectorTokenType";
    /**
     * invalid attribute token type
     */
    EnumToken[EnumToken["InvalidAttrTokenType"] = 83] = "InvalidAttrTokenType";
    /**
     * invalid at rule token type
     */
    EnumToken[EnumToken["InvalidAtRuleTokenType"] = 84] = "InvalidAtRuleTokenType";
    /**
     * media query condition token type
     */
    EnumToken[EnumToken["MediaQueryConditionTokenType"] = 85] = "MediaQueryConditionTokenType";
    /**
     * media feature token type
     */
    EnumToken[EnumToken["MediaFeatureTokenType"] = 86] = "MediaFeatureTokenType";
    /**
     * media feature only token type
     */
    EnumToken[EnumToken["MediaFeatureOnlyTokenType"] = 87] = "MediaFeatureOnlyTokenType";
    /**
     * media feature not token type
     */
    EnumToken[EnumToken["MediaFeatureNotTokenType"] = 88] = "MediaFeatureNotTokenType";
    /**
     * media feature and token type
     */
    EnumToken[EnumToken["MediaFeatureAndTokenType"] = 89] = "MediaFeatureAndTokenType";
    /**
     * media feature or token type
     */
    EnumToken[EnumToken["MediaFeatureOrTokenType"] = 90] = "MediaFeatureOrTokenType";
    /**
     * pseudo page token type
     */
    EnumToken[EnumToken["PseudoPageTokenType"] = 91] = "PseudoPageTokenType";
    /**
     * pseudo element token type
     */
    EnumToken[EnumToken["PseudoElementTokenType"] = 92] = "PseudoElementTokenType";
    /**
     * keyframe at rule node type
     */
    EnumToken[EnumToken["KeyframesAtRuleNodeType"] = 93] = "KeyframesAtRuleNodeType";
    /**
     * invalid declaration node type
     */
    EnumToken[EnumToken["InvalidDeclarationNodeType"] = 94] = "InvalidDeclarationNodeType";
    /* css module nodes */
    /**
     * composes token node type
     */
    EnumToken[EnumToken["ComposesSelectorNodeType"] = 95] = "ComposesSelectorNodeType";
    /**
     * css variable token type
     */
    EnumToken[EnumToken["CssVariableTokenType"] = 96] = "CssVariableTokenType";
    /**
     * css variable import token type
     */
    EnumToken[EnumToken["CssVariableImportTokenType"] = 97] = "CssVariableImportTokenType";
    /**
     * css variable declaration map token type
     */
    EnumToken[EnumToken["CssVariableDeclarationMapTokenType"] = 98] = "CssVariableDeclarationMapTokenType";
    /* aliases */
    /**
     * alias for time token type
     */
    EnumToken[EnumToken["Time"] = 25] = "Time";
    /**
     * alias for identifier token type
     */
    EnumToken[EnumToken["Iden"] = 7] = "Iden";
    /**
     * alias for end of file token type
     */
    EnumToken[EnumToken["EOF"] = 48] = "EOF";
    /**
     * alias for hash token type
     */
    EnumToken[EnumToken["Hash"] = 28] = "Hash";
    /**
     * alias for flex token type
     */
    EnumToken[EnumToken["Flex"] = 58] = "Flex";
    /**
     * alias for angle token type
     */
    EnumToken[EnumToken["Angle"] = 24] = "Angle";
    /**
     * alias for color token type
     */
    EnumToken[EnumToken["Color"] = 50] = "Color";
    /**
     * alias for comma token type
     */
    EnumToken[EnumToken["Comma"] = 9] = "Comma";
    /**
     * alias for string token type
     */
    EnumToken[EnumToken["String"] = 20] = "String";
    /**
     * alias for length token type
     */
    EnumToken[EnumToken["Length"] = 23] = "Length";
    /**
     * alias for number token type
     */
    EnumToken[EnumToken["Number"] = 12] = "Number";
    /**
     * alias for percentage token type
     */
    EnumToken[EnumToken["Perc"] = 14] = "Perc";
    /**
     * alias for literal token type
     */
    EnumToken[EnumToken["Literal"] = 6] = "Literal";
    /**
     * alias for comment token type
     */
    EnumToken[EnumToken["Comment"] = 0] = "Comment";
    /**
     * alias for url function token type
     */
    EnumToken[EnumToken["UrlFunc"] = 18] = "UrlFunc";
    /**
     * alias for dimension token type
     */
    EnumToken[EnumToken["Dimension"] = 22] = "Dimension";
    /**
     * alias for frequency token type
     */
    EnumToken[EnumToken["Frequency"] = 26] = "Frequency";
    /**
     * alias for resolution token type
     */
    EnumToken[EnumToken["Resolution"] = 27] = "Resolution";
    /**
     * alias for whitespace token type
     */
    EnumToken[EnumToken["Whitespace"] = 36] = "Whitespace";
    /**
     * alias for identifier list token type
     */
    EnumToken[EnumToken["IdenList"] = 71] = "IdenList";
    /**
     * alias for dashed identifier token type
     */
    EnumToken[EnumToken["DashedIden"] = 8] = "DashedIden";
    /**
     * alias for grid template function token type
     */
    EnumToken[EnumToken["GridTemplateFunc"] = 72] = "GridTemplateFunc";
    /**
     * alias for image function token type
     */
    EnumToken[EnumToken["ImageFunc"] = 19] = "ImageFunc";
    /**
     * alias for comment node type
     */
    EnumToken[EnumToken["CommentNodeType"] = 0] = "CommentNodeType";
    /**
     * alias for cdata section node type
     */
    EnumToken[EnumToken["CDOCOMMNodeType"] = 1] = "CDOCOMMNodeType";
    /**
     * alias for timing function token type
     */
    EnumToken[EnumToken["TimingFunction"] = 17] = "TimingFunction";
    /**
     * alias for timeline function token type
     */
    EnumToken[EnumToken["TimelineFunction"] = 16] = "TimelineFunction";
})(EnumToken || (EnumToken = {}));
/**
 * supported color types enum
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
var ModuleCaseTransformEnum;
(function (ModuleCaseTransformEnum) {
    /**
     * export as-is
     */
    ModuleCaseTransformEnum[ModuleCaseTransformEnum["Ignore"] = 1] = "Ignore";
    /**
     * transform class names and mapping key name
     */
    ModuleCaseTransformEnum[ModuleCaseTransformEnum["CamelCase"] = 2] = "CamelCase";
    /**
     * transform class names and mapping key name
     */
    ModuleCaseTransformEnum[ModuleCaseTransformEnum["CamelCaseOnly"] = 4] = "CamelCaseOnly";
    /**
     * transform class names and mapping key name
     */
    ModuleCaseTransformEnum[ModuleCaseTransformEnum["DashCase"] = 8] = "DashCase";
    /**
     * transform class names and mapping key name
     */
    ModuleCaseTransformEnum[ModuleCaseTransformEnum["DashCaseOnly"] = 16] = "DashCaseOnly";
})(ModuleCaseTransformEnum || (ModuleCaseTransformEnum = {}));
var ModuleScopeEnumOptions;
(function (ModuleScopeEnumOptions) {
    ModuleScopeEnumOptions[ModuleScopeEnumOptions["Global"] = 32] = "Global";
    ModuleScopeEnumOptions[ModuleScopeEnumOptions["Local"] = 64] = "Local";
    ModuleScopeEnumOptions[ModuleScopeEnumOptions["Pure"] = 128] = "Pure";
    ModuleScopeEnumOptions[ModuleScopeEnumOptions["ICSS"] = 256] = "ICSS";
})(ModuleScopeEnumOptions || (ModuleScopeEnumOptions = {}));

export { ColorType, EnumToken, ModuleCaseTransformEnum, ModuleScopeEnumOptions, SyntaxValidationResult, ValidationLevel };
