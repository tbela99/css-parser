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
    EnumToken[EnumToken["LtTokenType"] = 39] = "LtTokenType";
    EnumToken[EnumToken["LteTokenType"] = 40] = "LteTokenType";
    EnumToken[EnumToken["GtTokenType"] = 41] = "GtTokenType";
    EnumToken[EnumToken["GteTokenType"] = 42] = "GteTokenType";
    EnumToken[EnumToken["PseudoClassTokenType"] = 43] = "PseudoClassTokenType";
    EnumToken[EnumToken["PseudoClassFuncTokenType"] = 44] = "PseudoClassFuncTokenType";
    EnumToken[EnumToken["DelimTokenType"] = 45] = "DelimTokenType";
    EnumToken[EnumToken["UrlTokenTokenType"] = 46] = "UrlTokenTokenType";
    EnumToken[EnumToken["EOFTokenType"] = 47] = "EOFTokenType";
    EnumToken[EnumToken["ImportantTokenType"] = 48] = "ImportantTokenType";
    EnumToken[EnumToken["ColorTokenType"] = 49] = "ColorTokenType";
    EnumToken[EnumToken["AttrTokenType"] = 50] = "AttrTokenType";
    EnumToken[EnumToken["BadCommentTokenType"] = 51] = "BadCommentTokenType";
    EnumToken[EnumToken["BadCdoTokenType"] = 52] = "BadCdoTokenType";
    EnumToken[EnumToken["BadUrlTokenType"] = 53] = "BadUrlTokenType";
    EnumToken[EnumToken["BadStringTokenType"] = 54] = "BadStringTokenType";
    EnumToken[EnumToken["BinaryExpressionTokenType"] = 55] = "BinaryExpressionTokenType";
    EnumToken[EnumToken["UnaryExpressionTokenType"] = 56] = "UnaryExpressionTokenType";
    EnumToken[EnumToken["FlexTokenType"] = 57] = "FlexTokenType";
    /* catch all */
    EnumToken[EnumToken["ListToken"] = 58] = "ListToken";
    /* arithmetic tokens */
    EnumToken[EnumToken["Add"] = 59] = "Add";
    EnumToken[EnumToken["Mul"] = 60] = "Mul";
    EnumToken[EnumToken["Div"] = 61] = "Div";
    EnumToken[EnumToken["Sub"] = 62] = "Sub";
    /* new tokens */
    EnumToken[EnumToken["ColumnCombinatorTokenType"] = 63] = "ColumnCombinatorTokenType";
    EnumToken[EnumToken["ContainMatchTokenType"] = 64] = "ContainMatchTokenType";
    EnumToken[EnumToken["StartMatchTokenType"] = 65] = "StartMatchTokenType";
    EnumToken[EnumToken["EndMatchTokenType"] = 66] = "EndMatchTokenType";
    EnumToken[EnumToken["MatchExpressionTokenType"] = 67] = "MatchExpressionTokenType";
    EnumToken[EnumToken["NameSpaceAttributeTokenType"] = 68] = "NameSpaceAttributeTokenType";
    EnumToken[EnumToken["FractionTokenType"] = 69] = "FractionTokenType";
    EnumToken[EnumToken["IdenListTokenType"] = 70] = "IdenListTokenType";
    EnumToken[EnumToken["GridTemplateFuncTokenType"] = 71] = "GridTemplateFuncTokenType";
    EnumToken[EnumToken["KeyFrameRuleNodeType"] = 72] = "KeyFrameRuleNodeType";
    /* aliases */
    EnumToken[EnumToken["Time"] = 25] = "Time";
    EnumToken[EnumToken["Iden"] = 7] = "Iden";
    EnumToken[EnumToken["EOF"] = 47] = "EOF";
    EnumToken[EnumToken["Hash"] = 28] = "Hash";
    EnumToken[EnumToken["Flex"] = 57] = "Flex";
    EnumToken[EnumToken["Angle"] = 24] = "Angle";
    EnumToken[EnumToken["Color"] = 49] = "Color";
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
    EnumToken[EnumToken["IdenList"] = 70] = "IdenList";
    EnumToken[EnumToken["DashedIden"] = 8] = "DashedIden";
    EnumToken[EnumToken["GridTemplateFunc"] = 71] = "GridTemplateFunc";
    EnumToken[EnumToken["ImageFunc"] = 19] = "ImageFunc";
    EnumToken[EnumToken["CommentNodeType"] = 0] = "CommentNodeType";
    EnumToken[EnumToken["CDOCOMMNodeType"] = 1] = "CDOCOMMNodeType";
    EnumToken[EnumToken["TimingFunction"] = 17] = "TimingFunction";
    EnumToken[EnumToken["TimelineFunction"] = 16] = "TimelineFunction";
})(EnumToken || (EnumToken = {}));
const funcLike = [
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

export { EnumToken, funcLike };
