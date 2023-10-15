var NodeType;
(function (NodeType) {
    NodeType[NodeType["CommentNodeType"] = 0] = "CommentNodeType";
    NodeType[NodeType["CDOCOMMNodeType"] = 1] = "CDOCOMMNodeType";
    NodeType[NodeType["StyleSheetNodeType"] = 2] = "StyleSheetNodeType";
    NodeType[NodeType["AtRuleNodeType"] = 3] = "AtRuleNodeType";
    NodeType[NodeType["RuleNodeType"] = 4] = "RuleNodeType";
    NodeType[NodeType["DeclarationNodeType"] = 5] = "DeclarationNodeType";
})(NodeType || (NodeType = {}));
var EnumToken;
(function (EnumToken) {
    EnumToken[EnumToken["CommentTokenType"] = 0] = "CommentTokenType";
    EnumToken[EnumToken["CDOCOMMTokenType"] = 1] = "CDOCOMMTokenType";
    EnumToken[EnumToken["LiteralTokenType"] = 2] = "LiteralTokenType";
    EnumToken[EnumToken["IdenTokenType"] = 3] = "IdenTokenType";
    EnumToken[EnumToken["CommaTokenType"] = 4] = "CommaTokenType";
    EnumToken[EnumToken["ColonTokenType"] = 5] = "ColonTokenType";
    EnumToken[EnumToken["SemiColonTokenType"] = 6] = "SemiColonTokenType";
    EnumToken[EnumToken["NumberTokenType"] = 7] = "NumberTokenType";
    EnumToken[EnumToken["AtRuleTokenType"] = 8] = "AtRuleTokenType";
    EnumToken[EnumToken["PercentageTokenType"] = 9] = "PercentageTokenType";
    EnumToken[EnumToken["FunctionTokenType"] = 10] = "FunctionTokenType";
    EnumToken[EnumToken["UrlFunctionTokenType"] = 11] = "UrlFunctionTokenType";
    EnumToken[EnumToken["StringTokenType"] = 12] = "StringTokenType";
    EnumToken[EnumToken["UnclosedStringTokenType"] = 13] = "UnclosedStringTokenType";
    EnumToken[EnumToken["DimensionTokenType"] = 14] = "DimensionTokenType";
    EnumToken[EnumToken["LengthTokenType"] = 15] = "LengthTokenType";
    EnumToken[EnumToken["AngleTokenType"] = 16] = "AngleTokenType";
    EnumToken[EnumToken["TimeTokenType"] = 17] = "TimeTokenType";
    EnumToken[EnumToken["FrequencyTokenType"] = 18] = "FrequencyTokenType";
    EnumToken[EnumToken["ResolutionTokenType"] = 19] = "ResolutionTokenType";
    EnumToken[EnumToken["HashTokenType"] = 20] = "HashTokenType";
    EnumToken[EnumToken["BlockStartTokenType"] = 21] = "BlockStartTokenType";
    EnumToken[EnumToken["BlockEndTokenType"] = 22] = "BlockEndTokenType";
    EnumToken[EnumToken["AttrStartTokenType"] = 23] = "AttrStartTokenType";
    EnumToken[EnumToken["AttrEndTokenType"] = 24] = "AttrEndTokenType";
    EnumToken[EnumToken["StartParensTokenType"] = 25] = "StartParensTokenType";
    EnumToken[EnumToken["EndParensTokenType"] = 26] = "EndParensTokenType";
    EnumToken[EnumToken["ParensTokenType"] = 27] = "ParensTokenType";
    EnumToken[EnumToken["WhitespaceTokenType"] = 28] = "WhitespaceTokenType";
    EnumToken[EnumToken["IncludeMatchTokenType"] = 29] = "IncludeMatchTokenType";
    EnumToken[EnumToken["DashMatchTokenType"] = 30] = "DashMatchTokenType";
    EnumToken[EnumToken["LtTokenType"] = 31] = "LtTokenType";
    EnumToken[EnumToken["LteTokenType"] = 32] = "LteTokenType";
    EnumToken[EnumToken["GtTokenType"] = 33] = "GtTokenType";
    EnumToken[EnumToken["GteTokenType"] = 34] = "GteTokenType";
    EnumToken[EnumToken["PseudoClassTokenType"] = 35] = "PseudoClassTokenType";
    EnumToken[EnumToken["PseudoClassFuncTokenType"] = 36] = "PseudoClassFuncTokenType";
    EnumToken[EnumToken["DelimTokenType"] = 37] = "DelimTokenType";
    EnumToken[EnumToken["UrlTokenTokenType"] = 38] = "UrlTokenTokenType";
    EnumToken[EnumToken["EOFTokenType"] = 39] = "EOFTokenType";
    EnumToken[EnumToken["ImportantTokenType"] = 40] = "ImportantTokenType";
    EnumToken[EnumToken["ColorTokenType"] = 41] = "ColorTokenType";
    EnumToken[EnumToken["AttrTokenType"] = 42] = "AttrTokenType";
    EnumToken[EnumToken["BadCommentTokenType"] = 43] = "BadCommentTokenType";
    EnumToken[EnumToken["BadCdoTokenType"] = 44] = "BadCdoTokenType";
    EnumToken[EnumToken["BadUrlTokenType"] = 45] = "BadUrlTokenType";
    EnumToken[EnumToken["BadStringTokenType"] = 46] = "BadStringTokenType";
    EnumToken[EnumToken["BinaryExpressionTokenType"] = 47] = "BinaryExpressionTokenType";
    EnumToken[EnumToken["UnaryExpressionTokenType"] = 48] = "UnaryExpressionTokenType";
    /* catch all */
    EnumToken[EnumToken["ListToken"] = 49] = "ListToken";
    /* arithmetic tokens */
    EnumToken[EnumToken["Add"] = 50] = "Add";
    EnumToken[EnumToken["Mul"] = 51] = "Mul";
    EnumToken[EnumToken["Div"] = 52] = "Div";
    EnumToken[EnumToken["Sub"] = 53] = "Sub";
    /* new tokens */
    EnumToken[EnumToken["ColumnCombinatorTokenType"] = 54] = "ColumnCombinatorTokenType";
    EnumToken[EnumToken["ContainMatchTokenType"] = 55] = "ContainMatchTokenType";
    EnumToken[EnumToken["StartMatchTokenType"] = 56] = "StartMatchTokenType";
    EnumToken[EnumToken["EndMatchTokenType"] = 57] = "EndMatchTokenType";
    EnumToken[EnumToken["MatchExpressionTokenType"] = 58] = "MatchExpressionTokenType";
    EnumToken[EnumToken["NameSpaceAttributeTokenType"] = 59] = "NameSpaceAttributeTokenType";
    /* aliases */
    EnumToken[EnumToken["Time"] = 17] = "Time";
    EnumToken[EnumToken["Iden"] = 3] = "Iden";
    EnumToken[EnumToken["Hash"] = 20] = "Hash";
    EnumToken[EnumToken["Angle"] = 16] = "Angle";
    EnumToken[EnumToken["Color"] = 41] = "Color";
    EnumToken[EnumToken["Comma"] = 4] = "Comma";
    EnumToken[EnumToken["String"] = 12] = "String";
    EnumToken[EnumToken["Length"] = 15] = "Length";
    EnumToken[EnumToken["Number"] = 7] = "Number";
    EnumToken[EnumToken["Perc"] = 9] = "Perc";
    EnumToken[EnumToken["Literal"] = 2] = "Literal";
    EnumToken[EnumToken["Comment"] = 0] = "Comment";
    EnumToken[EnumToken["UrlFunc"] = 11] = "UrlFunc";
    EnumToken[EnumToken["Dimension"] = 14] = "Dimension";
    EnumToken[EnumToken["Frequency"] = 18] = "Frequency";
    EnumToken[EnumToken["Resolution"] = 19] = "Resolution";
    EnumToken[EnumToken["Whitespace"] = 28] = "Whitespace";
})(EnumToken || (EnumToken = {}));

export { EnumToken, NodeType };
