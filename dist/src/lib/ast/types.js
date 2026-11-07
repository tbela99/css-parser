/* 
	CSS parser, minifier and validator for node and the browser

	Author(s): Thierry Bela
	Version: 2.0.0
	License: MIT
 */
/**
 * Syntax validation enum
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
 * Enum of node statuses
 */
var EnumAstNodeStatus;
(function (EnumAstNodeStatus) {
    /**
     * Node passed validation
     */
    EnumAstNodeStatus[EnumAstNodeStatus["Validated"] = 1] = "Validated";
    /**
     * Node is invalid
     */
    EnumAstNodeStatus[EnumAstNodeStatus["Invalid"] = 2] = "Invalid";
    /**
     * node is not validated
     */
    EnumAstNodeStatus[EnumAstNodeStatus["Unvalidated"] = 4] = "Unvalidated";
    /**
     * Node did not pass validation, but is preserved.
     */
    EnumAstNodeStatus[EnumAstNodeStatus["ValidationFailed"] = 8] = "ValidationFailed";
    /**
     * Parsing the node is not supported yet or the node syntax definition does not exist.
     */
    EnumAstNodeStatus[EnumAstNodeStatus["Unknown"] = 16] = "Unknown";
    /**
     * Failed to parse the node.
     */
    EnumAstNodeStatus[EnumAstNodeStatus["Unparsed"] = 32] = "Unparsed";
    /**
     * Node is disallowed in the context
     */
    EnumAstNodeStatus[EnumAstNodeStatus["Disallowed"] = 64] = "Disallowed";
    /**
     * Node is malformed
     */
    EnumAstNodeStatus[EnumAstNodeStatus["Malformed"] = 128] = "Malformed";
    /**
     * Important declaration
     */
    EnumAstNodeStatus[EnumAstNodeStatus["ImportantDeclaration"] = 256] = "ImportantDeclaration";
    /**
     * Color component without unit
     */
    EnumAstNodeStatus[EnumAstNodeStatus["PowerlessColorComponent"] = 512] = "PowerlessColorComponent";
    /* node flags stored in the arena `flags` column next to the validation state */
    /**
     * mask of the validation state bits
     */
    EnumAstNodeStatus[EnumAstNodeStatus["StateMask"] = 65535] = "StateMask";
    /**
     * the node has a children list (stylesheet, rule, at-rule with a block)
     */
    EnumAstNodeStatus[EnumAstNodeStatus["HasChildren"] = 65536] = "HasChildren";
    /**
     * the node has value tokens (declaration)
     */
    EnumAstNodeStatus[EnumAstNodeStatus["HasValues"] = 131072] = "HasValues";
    /**
     * the node has a source location
     */
    EnumAstNodeStatus[EnumAstNodeStatus["HasLocation"] = 262144] = "HasLocation";
    /**
     * the node is marked to be released or trimmed. see `arena.mark()`, `arena.release()` and `arena.trim()`
     */
    EnumAstNodeStatus[EnumAstNodeStatus["Marked"] = 524288] = "Marked";
    /**
     * transient flag used while comparing the declarations of two rules
     * @private
     */
    EnumAstNodeStatus[EnumAstNodeStatus["Matched"] = 1048576] = "Matched";
})(EnumAstNodeStatus || (EnumAstNodeStatus = {}));
/**
 * Enum of all token types
 */
var EnumToken;
(function (EnumToken) {
    /**
     * comment token. the value 0 is reserved: it is the type of the null node (id 0) and of unset nodes,
     * so that reading the type of a missing node never matches a real token type
     */
    EnumToken[EnumToken["CommentTokenType"] = 1] = "CommentTokenType";
    /**
     * cdata section token
     */
    EnumToken[EnumToken["CDOCOMMTokenType"] = 2] = "CDOCOMMTokenType";
    /**
     * style sheet node type
     */
    EnumToken[EnumToken["StyleSheetNodeType"] = 3] = "StyleSheetNodeType";
    /**
     * at-rule node type
     */
    EnumToken[EnumToken["AtRuleNodeType"] = 4] = "AtRuleNodeType";
    /**
     * rule node type
     */
    EnumToken[EnumToken["RuleNodeType"] = 5] = "RuleNodeType";
    /**
     * declaration node type
     */
    EnumToken[EnumToken["DeclarationNodeType"] = 6] = "DeclarationNodeType";
    /**
     * literal token type
     */
    EnumToken[EnumToken["LiteralTokenType"] = 7] = "LiteralTokenType";
    /**
     * identifier token type
     */
    EnumToken[EnumToken["IdenTokenType"] = 8] = "IdenTokenType";
    /**
     * dashed identifier token type
     */
    EnumToken[EnumToken["DashedIdenTokenType"] = 9] = "DashedIdenTokenType";
    /**
     * comma token type
     */
    EnumToken[EnumToken["CommaTokenType"] = 10] = "CommaTokenType";
    /**
     * colon token type
     */
    EnumToken[EnumToken["ColonTokenType"] = 11] = "ColonTokenType";
    /**
     * semicolon token type
     */
    EnumToken[EnumToken["SemiColonTokenType"] = 12] = "SemiColonTokenType";
    /**
     * number token type
     */
    EnumToken[EnumToken["NumberTokenType"] = 13] = "NumberTokenType";
    /**
     * at-rule token type
     */
    EnumToken[EnumToken["AtRuleTokenType"] = 14] = "AtRuleTokenType";
    /**
     * percentage token type
     */
    EnumToken[EnumToken["PercentageTokenType"] = 15] = "PercentageTokenType";
    /**
     * function token type
     */
    EnumToken[EnumToken["FunctionTokenType"] = 16] = "FunctionTokenType";
    /**
     * timeline function token type
     */
    EnumToken[EnumToken["TimelineFunctionTokenType"] = 17] = "TimelineFunctionTokenType";
    /**
     * timing function token type
     */
    EnumToken[EnumToken["TimingFunctionTokenType"] = 18] = "TimingFunctionTokenType";
    /**
     * url function token type
     */
    EnumToken[EnumToken["UrlFunctionTokenType"] = 19] = "UrlFunctionTokenType";
    /**
     * image function token type
     */
    EnumToken[EnumToken["ImageFunctionTokenType"] = 20] = "ImageFunctionTokenType";
    /**
     * string token type
     */
    EnumToken[EnumToken["StringTokenType"] = 21] = "StringTokenType";
    /**
     * unclosed string token type
     */
    EnumToken[EnumToken["UnclosedStringTokenType"] = 22] = "UnclosedStringTokenType";
    /**
     * dimension token type
     */
    EnumToken[EnumToken["DimensionTokenType"] = 23] = "DimensionTokenType";
    /**
     * length token type
     */
    EnumToken[EnumToken["LengthTokenType"] = 24] = "LengthTokenType";
    /**
     * angle token type
     */
    EnumToken[EnumToken["AngleTokenType"] = 25] = "AngleTokenType";
    /**
     * time token type
     */
    EnumToken[EnumToken["TimeTokenType"] = 26] = "TimeTokenType";
    /**
     * frequency token type
     */
    EnumToken[EnumToken["FrequencyTokenType"] = 27] = "FrequencyTokenType";
    /**
     * resolution token type
     */
    EnumToken[EnumToken["ResolutionTokenType"] = 28] = "ResolutionTokenType";
    /**
     * hash token type
     */
    EnumToken[EnumToken["HashTokenType"] = 29] = "HashTokenType";
    /**
     * block start token type
     */
    EnumToken[EnumToken["BlockStartTokenType"] = 30] = "BlockStartTokenType";
    /**
     * block end token type
     */
    EnumToken[EnumToken["BlockEndTokenType"] = 31] = "BlockEndTokenType";
    /**
     * attribute start token type
     */
    EnumToken[EnumToken["AttrStartTokenType"] = 32] = "AttrStartTokenType";
    /**
     * attribute end token type
     */
    EnumToken[EnumToken["AttrEndTokenType"] = 33] = "AttrEndTokenType";
    /**
     * start parentheses token type
     */
    EnumToken[EnumToken["StartParensTokenType"] = 34] = "StartParensTokenType";
    /**
     * end parentheses token type
     */
    EnumToken[EnumToken["EndParensTokenType"] = 35] = "EndParensTokenType";
    /**
     * parentheses token type
     */
    EnumToken[EnumToken["ParensTokenType"] = 36] = "ParensTokenType";
    /**
     * whitespace token type
     */
    EnumToken[EnumToken["WhitespaceTokenType"] = 37] = "WhitespaceTokenType";
    /**
     * include match token type
     */
    EnumToken[EnumToken["IncludeMatchTokenType"] = 38] = "IncludeMatchTokenType";
    /**
     * dash match token type
     */
    EnumToken[EnumToken["DashMatchTokenType"] = 39] = "DashMatchTokenType";
    /**
     * equal match token type
     */
    EnumToken[EnumToken["EqualMatchTokenType"] = 40] = "EqualMatchTokenType";
    /**
     * less than token type
     */
    EnumToken[EnumToken["LtTokenType"] = 41] = "LtTokenType";
    /**
     * less than or equal to token type
     */
    EnumToken[EnumToken["LteTokenType"] = 42] = "LteTokenType";
    /**
     * greater than token type
     */
    EnumToken[EnumToken["GtTokenType"] = 43] = "GtTokenType";
    /**
     * greater than or equal to token type
     */
    EnumToken[EnumToken["GteTokenType"] = 44] = "GteTokenType";
    /**
     * pseudo-class token type
     */
    EnumToken[EnumToken["PseudoClassTokenType"] = 45] = "PseudoClassTokenType";
    /**
     * pseudo-class function token type
     */
    EnumToken[EnumToken["PseudoClassFuncTokenType"] = 46] = "PseudoClassFuncTokenType";
    /**
     * delimiter token type
     */
    EnumToken[EnumToken["DelimTokenType"] = 47] = "DelimTokenType";
    /**
     * URL token type
     */
    EnumToken[EnumToken["UrlTokenTokenType"] = 48] = "UrlTokenTokenType";
    /**
     * end of file token type
     */
    EnumToken[EnumToken["EOFTokenType"] = 49] = "EOFTokenType";
    /**
     * important token type
     */
    EnumToken[EnumToken["ImportantTokenType"] = 50] = "ImportantTokenType";
    /**
     * color token type
     */
    EnumToken[EnumToken["ColorTokenType"] = 51] = "ColorTokenType";
    /**
     * attribute token type
     */
    EnumToken[EnumToken["AttrTokenType"] = 52] = "AttrTokenType";
    /**
     * bad comment token type
     */
    EnumToken[EnumToken["BadCommentTokenType"] = 53] = "BadCommentTokenType";
    /**
     * bad cdo token type
     */
    EnumToken[EnumToken["BadCdoTokenType"] = 54] = "BadCdoTokenType";
    /**
     * bad URL token type
     */
    EnumToken[EnumToken["BadUrlTokenType"] = 55] = "BadUrlTokenType";
    /**
     * bad string token type
     */
    EnumToken[EnumToken["BadStringTokenType"] = 56] = "BadStringTokenType";
    /**
     * binary expression token type
     */
    EnumToken[EnumToken["BinaryExpressionTokenType"] = 57] = "BinaryExpressionTokenType";
    /**
     * unary expression token type
     */
    EnumToken[EnumToken["UnaryExpressionTokenType"] = 58] = "UnaryExpressionTokenType";
    /**
     * flex token type
     */
    EnumToken[EnumToken["FlexTokenType"] = 59] = "FlexTokenType";
    /**
     *  token list token type
     */
    EnumToken[EnumToken["ListToken"] = 60] = "ListToken";
    /* arithmetic tokens */
    /**
     * addition token type
     */
    EnumToken[EnumToken["Add"] = 61] = "Add";
    /**
     * multiplication token type
     */
    EnumToken[EnumToken["Mul"] = 62] = "Mul";
    /**
     * division token type
     */
    EnumToken[EnumToken["Div"] = 63] = "Div";
    /**
     * subtraction token type
     */
    EnumToken[EnumToken["Sub"] = 64] = "Sub";
    /* new tokens */
    /**
     * column combinator token type
     */
    EnumToken[EnumToken["ColumnCombinatorTokenType"] = 65] = "ColumnCombinatorTokenType";
    /**
     * contain match token type
     */
    EnumToken[EnumToken["ContainMatchTokenType"] = 66] = "ContainMatchTokenType";
    /**
     * start match token type
     */
    EnumToken[EnumToken["StartMatchTokenType"] = 67] = "StartMatchTokenType";
    /**
     * end match token type
     */
    EnumToken[EnumToken["EndMatchTokenType"] = 68] = "EndMatchTokenType";
    /**
     * match expression token type
     */
    EnumToken[EnumToken["MatchExpressionTokenType"] = 69] = "MatchExpressionTokenType";
    /**
     * namespace attribute token type
     */
    EnumToken[EnumToken["NameSpaceAttributeTokenType"] = 70] = "NameSpaceAttributeTokenType";
    /**
     * fraction token type
     */
    EnumToken[EnumToken["FractionTokenType"] = 71] = "FractionTokenType";
    /**
     * identifier list token type
     */
    EnumToken[EnumToken["IdenListTokenType"] = 72] = "IdenListTokenType";
    /**
     * grid template function token type
     */
    EnumToken[EnumToken["GridTemplateFuncTokenType"] = 73] = "GridTemplateFuncTokenType";
    /**
     * keyframe rule node type
     */
    EnumToken[EnumToken["KeyframesRuleNodeType"] = 74] = "KeyframesRuleNodeType";
    /**
     * class selector token type
     */
    EnumToken[EnumToken["ClassSelectorTokenType"] = 75] = "ClassSelectorTokenType";
    /**
     * universal selector token type
     */
    EnumToken[EnumToken["UniversalSelectorTokenType"] = 76] = "UniversalSelectorTokenType";
    /**
     * child combinator token type
     */
    EnumToken[EnumToken["ChildCombinatorTokenType"] = 77] = "ChildCombinatorTokenType";
    /**
     * descendant combinator token type
     */
    EnumToken[EnumToken["DescendantCombinatorTokenType"] = 78] = "DescendantCombinatorTokenType";
    /**
     * next sibling combinator token type
     */
    EnumToken[EnumToken["NextSiblingCombinatorTokenType"] = 79] = "NextSiblingCombinatorTokenType";
    /**
     * subsequent sibling combinator token type
     */
    EnumToken[EnumToken["SubsequentSiblingCombinatorTokenType"] = 80] = "SubsequentSiblingCombinatorTokenType";
    /**
     * nesting selector token type
     */
    EnumToken[EnumToken["NestingSelectorTokenType"] = 81] = "NestingSelectorTokenType";
    /**
     * media query condition token type
     */
    EnumToken[EnumToken["MediaQueryConditionTokenType"] = 82] = "MediaQueryConditionTokenType";
    /**
     * media feature token type
     */
    EnumToken[EnumToken["MediaFeatureTokenType"] = 83] = "MediaFeatureTokenType";
    /**
     * media feature only token type
     */
    EnumToken[EnumToken["OnlyTokenType"] = 84] = "OnlyTokenType";
    /**
     * media feature not token type
     */
    EnumToken[EnumToken["NotTokenType"] = 85] = "NotTokenType";
    /**
     * media feature and token type
     */
    EnumToken[EnumToken["AndTokenType"] = 86] = "AndTokenType";
    /**
     * media feature or token type
     */
    EnumToken[EnumToken["OrTokenType"] = 87] = "OrTokenType";
    /**
     * pseudo page token type
     */
    EnumToken[EnumToken["PseudoPageTokenType"] = 88] = "PseudoPageTokenType";
    /**
     * pseudo element token type
     */
    EnumToken[EnumToken["PseudoElementTokenType"] = 89] = "PseudoElementTokenType";
    /**
     * keyframe at rule node type
     */
    EnumToken[EnumToken["KeyframesAtRuleNodeType"] = 90] = "KeyframesAtRuleNodeType";
    /* css module nodes */
    /**
     * composes token node type
     */
    EnumToken[EnumToken["ComposesSelectorNodeType"] = 91] = "ComposesSelectorNodeType";
    /**
     * css variable token type
     */
    EnumToken[EnumToken["CssVariableTokenType"] = 92] = "CssVariableTokenType";
    /**
     * css variable import token type
     */
    EnumToken[EnumToken["CssVariableImportTokenType"] = 93] = "CssVariableImportTokenType";
    /**
     * css variable declaration map token type
     */
    EnumToken[EnumToken["CssVariableDeclarationMapTokenType"] = 94] = "CssVariableDeclarationMapTokenType";
    /**
     * media range query token type
     */
    EnumToken[EnumToken["MediaRangeQueryTokenType"] = 95] = "MediaRangeQueryTokenType";
    /**
     * supports query condition token type
     */
    EnumToken[EnumToken["SupportsQueryConditionTokenType"] = 96] = "SupportsQueryConditionTokenType";
    /**
     * supports query unary condition token type
     */
    EnumToken[EnumToken["SupportsQueryUnaryConditionTokenType"] = 97] = "SupportsQueryUnaryConditionTokenType";
    /**
     * when else query condition token type
     */
    EnumToken[EnumToken["WhenElseQueryConditionTokenType"] = 98] = "WhenElseQueryConditionTokenType";
    /**
     * when else query unary condition token type
     */
    EnumToken[EnumToken["WhenElseUnaryConditionTokenType"] = 99] = "WhenElseUnaryConditionTokenType";
    /**
     * container style range token type
     */
    EnumToken[EnumToken["ContainerStyleRangeTokenType"] = 100] = "ContainerStyleRangeTokenType";
    /**
     * '*'
     */
    EnumToken[EnumToken["Star"] = 101] = "Star";
    /**
     * '+'
     */
    EnumToken[EnumToken["Plus"] = 102] = "Plus";
    /**
     * '~'
     */
    EnumToken[EnumToken["Tilda"] = 103] = "Tilda";
    /**
     * '|'
     */
    EnumToken[EnumToken["PipeTokenType"] = 104] = "PipeTokenType";
    /**
     * '::'
     */
    EnumToken[EnumToken["DoubleColonTokenType"] = 105] = "DoubleColonTokenType";
    /**
     * math function token type  such as'calc(' etc.
     */
    EnumToken[EnumToken["MathFunctionTokenType"] = 106] = "MathFunctionTokenType";
    /**
     * transform function token type such as 'translate(' etc.
     */
    EnumToken[EnumToken["TransformFunctionTokenType"] = 107] = "TransformFunctionTokenType";
    /**
     * when function token type such as 'supports(' etc.
     */
    EnumToken[EnumToken["WhenElseFunctionTokenType"] = 108] = "WhenElseFunctionTokenType";
    /**
     * general enclosed function token type 'font-tech(' etc.
     */
    EnumToken[EnumToken["GeneralEnclosedFunctionTokenType"] = 109] = "GeneralEnclosedFunctionTokenType";
    /**
     * supports function token type such as 'at-rule('
     */
    EnumToken[EnumToken["SupportsFunctionTokenType"] = 110] = "SupportsFunctionTokenType";
    /**
     * container function token type such as 'style(' or 'scroll-state('
     */
    EnumToken[EnumToken["ContainerFunctionTokenType"] = 111] = "ContainerFunctionTokenType";
    /**
     * unrecognized node token type
     */
    EnumToken[EnumToken["RawNodeTokenType"] = 112] = "RawNodeTokenType";
    /**
     * media query boolean token type
     * at-rule media not ()
     * at-rule media only ()
     */
    EnumToken[EnumToken["MediaQueryUnaryFeatureTokenType"] = 113] = "MediaQueryUnaryFeatureTokenType";
    /**
     * grid template function token type such as 'minmax('
     */
    EnumToken[EnumToken["GridTemplateFuncTokenDefType"] = 114] = "GridTemplateFuncTokenDefType";
    /**
     * image function token type such as 'image(' etc.
     */
    EnumToken[EnumToken["ImageFunctionTokenDefType"] = 115] = "ImageFunctionTokenDefType";
    /**
     * function token type such as 'view(' etc.
     */
    EnumToken[EnumToken["TimelineFunctionTokenDefType"] = 116] = "TimelineFunctionTokenDefType";
    /**
     * function token type
     */
    EnumToken[EnumToken["FunctionTokenDefType"] = 117] = "FunctionTokenDefType";
    /**
     * timing function token type such as 'linear(' etc.
     */
    EnumToken[EnumToken["TimingFunctionTokenDefType"] = 118] = "TimingFunctionTokenDefType";
    /**
     * color function token type such as 'rgb(' etc.
     */
    EnumToken[EnumToken["ColorFunctionTokenDefType"] = 119] = "ColorFunctionTokenDefType";
    /**
     * math function token type such as 'calc(' etc.
     */
    EnumToken[EnumToken["MathFunctionTokenDefType"] = 120] = "MathFunctionTokenDefType";
    /**
     * container function token type such as 'style(' or 'scroll-state('
     */
    EnumToken[EnumToken["ContainerFunctionTokenDefType"] = 121] = "ContainerFunctionTokenDefType";
    /**
     * url function token type 'url('
     */
    EnumToken[EnumToken["UrlFunctionTokenDefType"] = 122] = "UrlFunctionTokenDefType";
    /**
     * pseudo-class function token type
     */
    EnumToken[EnumToken["PseudoClassFunctionTokenDefType"] = 123] = "PseudoClassFunctionTokenDefType";
    /**
     * transform function token type such as 'translate(' etc.
     */
    EnumToken[EnumToken["TransformFunctionTokenDefType"] = 124] = "TransformFunctionTokenDefType";
    /**
     * when function token type such as 'supports(' or 'media('
     */
    EnumToken[EnumToken["WhenElseFunctionTokenDefType"] = 125] = "WhenElseFunctionTokenDefType";
    /**
     * general enclosed function token type 'font-tech(' etc.
     */
    EnumToken[EnumToken["GeneralEnclosedFunctionTokenDefType"] = 126] = "GeneralEnclosedFunctionTokenDefType";
    /**
     * supports function token type 'font-tech('
     */
    EnumToken[EnumToken["SupportsFunctionTokenDefType"] = 127] = "SupportsFunctionTokenDefType";
    /**
     * custom function token type '--function-name('
     */
    EnumToken[EnumToken["CustomFunctionTokenDefType"] = 128] = "CustomFunctionTokenDefType";
    /**
     * custom function token type
     */
    EnumToken[EnumToken["CustomFunctionTokenType"] = 129] = "CustomFunctionTokenType";
    /**
     * function tokens such as 'var(', 'env(', 'if(')
     */
    EnumToken[EnumToken["WildCardFunctionTokenDefType"] = 130] = "WildCardFunctionTokenDefType";
    /**
     * function such as 'var()', 'env()', 'if()'
     */
    EnumToken[EnumToken["WildCardFunctionTokenType"] = 131] = "WildCardFunctionTokenType";
    /**
     * if condition token
     */
    EnumToken[EnumToken["IfConditionTokenType"] = 132] = "IfConditionTokenType";
    /**
     * if-Else condition token
     */
    EnumToken[EnumToken["IfElseConditionTokenType"] = 133] = "IfElseConditionTokenType";
    /**
     * wrapped values token type like {Arial, sans-serif}
     */
    EnumToken[EnumToken["WrappedValuesTokenType"] = 134] = "WrappedValuesTokenType";
    /**
     * list of arena tokens (binary expression operands)
     */
    EnumToken[EnumToken["ListTokenType"] = 135] = "ListTokenType";
    /**
     * infinity token
     */
    EnumToken[EnumToken["NaNTokenType"] = 136] = "NaNTokenType";
    /**
     * infinity token
     */
    EnumToken[EnumToken["InfinityTokenType"] = 137] = "InfinityTokenType";
    /**
     * negative infinity token
     */
    EnumToken[EnumToken["NegativeInfinityTokenType"] = 138] = "NegativeInfinityTokenType";
    /**
     * CSS type token
     */
    EnumToken[EnumToken["CssTypeTokenType"] = 139] = "CssTypeTokenType";
    /**
     * user defined dimension token type
     */
    EnumToken[EnumToken["UserDefinedDimensionTokenType"] = 140] = "UserDefinedDimensionTokenType";
    /* aliases */
    /**
     * alias for time token type
     */
    EnumToken[EnumToken["Time"] = 26] = "Time";
    /**
     * alias for identifier token type
     */
    EnumToken[EnumToken["Iden"] = 8] = "Iden";
    /**
     * alias for end of file token type
     */
    EnumToken[EnumToken["EOF"] = 49] = "EOF";
    /**
     * alias for hash token type
     */
    EnumToken[EnumToken["Hash"] = 29] = "Hash";
    /**
     * alias for flex token type
     */
    EnumToken[EnumToken["Flex"] = 59] = "Flex";
    /**
     * alias for angle token type
     */
    EnumToken[EnumToken["Angle"] = 25] = "Angle";
    /**
     * alias for color token type
     */
    EnumToken[EnumToken["Color"] = 51] = "Color";
    /**
     * alias for comma token type
     */
    EnumToken[EnumToken["Comma"] = 10] = "Comma";
    /**
     * alias for string token type
     */
    EnumToken[EnumToken["String"] = 21] = "String";
    /**
     * alias for length token type
     */
    EnumToken[EnumToken["Length"] = 24] = "Length";
    /**
     * alias for number token type
     */
    EnumToken[EnumToken["Number"] = 13] = "Number";
    /**
     * alias for percentage token type
     */
    EnumToken[EnumToken["Perc"] = 15] = "Perc";
    /**
     * alias for literal token type
     */
    EnumToken[EnumToken["Literal"] = 7] = "Literal";
    /**
     * alias for comment token type
     */
    EnumToken[EnumToken["Comment"] = 1] = "Comment";
    /**
     * alias for url function token type
     */
    EnumToken[EnumToken["UrlFunc"] = 19] = "UrlFunc";
    /**
     * alias for dimension token type
     */
    EnumToken[EnumToken["Dimension"] = 23] = "Dimension";
    /**
     * alias for frequency token type
     */
    EnumToken[EnumToken["Frequency"] = 27] = "Frequency";
    /**
     * alias for resolution token type
     */
    EnumToken[EnumToken["Resolution"] = 28] = "Resolution";
    /**
     * alias for whitespace token type
     */
    EnumToken[EnumToken["Whitespace"] = 37] = "Whitespace";
    /**
     * alias for identifier list token type
     */
    EnumToken[EnumToken["IdenList"] = 72] = "IdenList";
    /**
     * alias for dashed identifier token type
     */
    EnumToken[EnumToken["DashedIden"] = 9] = "DashedIden";
    /**
     * alias for grid template function token type
     */
    EnumToken[EnumToken["GridTemplateFunc"] = 73] = "GridTemplateFunc";
    /**
     * alias for image function token type
     */
    EnumToken[EnumToken["ImageFunc"] = 20] = "ImageFunc";
    /**
     * alias for comment node type
     */
    EnumToken[EnumToken["CommentNodeType"] = 1] = "CommentNodeType";
    /**
     * alias for cdata section node type
     */
    EnumToken[EnumToken["CDOCOMMNodeType"] = 2] = "CDOCOMMNodeType";
    /**
     * alias for timing function token type
     */
    EnumToken[EnumToken["TimingFunction"] = 18] = "TimingFunction";
    /**
     * alias for timeline function token type
     */
    EnumToken[EnumToken["TimelineFunction"] = 17] = "TimelineFunction";
})(EnumToken || (EnumToken = {}));
/**
 * Supported color types enum
 */
var ColorType;
(function (ColorType) {
    /**
     * the color type is not known yet (the color function has not been parsed)
     */
    ColorType[ColorType["NONE"] = 0] = "NONE";
    /**
     * system colors
     */
    ColorType[ColorType["SYS"] = 1] = "SYS";
    /**
     * deprecated system colors
     */
    ColorType[ColorType["DPSYS"] = 2] = "DPSYS";
    /**
     * named colors
     */
    ColorType[ColorType["LIT"] = 3] = "LIT";
    /**
     * colors as hex values
     */
    ColorType[ColorType["HEX"] = 4] = "HEX";
    /**
     * colors as rgb values
     */
    ColorType[ColorType["RGBA"] = 5] = "RGBA";
    /**
     * colors using rgb
     */
    ColorType[ColorType["HSLA"] = 6] = "HSLA";
    /**
     * colors using hwb
     */
    ColorType[ColorType["HWB"] = 7] = "HWB";
    /**
     * colors using cmyk
     */
    ColorType[ColorType["CMYK"] = 8] = "CMYK";
    /**
     * colors using oklab
     * */
    ColorType[ColorType["OKLAB"] = 9] = "OKLAB";
    /**
     * colors using oklch
     * */
    ColorType[ColorType["OKLCH"] = 10] = "OKLCH";
    /**
     * colors using lab
     */
    ColorType[ColorType["LAB"] = 11] = "LAB";
    /**
     * colors using lch
     */
    ColorType[ColorType["LCH"] = 12] = "LCH";
    /**
     * colors using color() function
     */
    ColorType[ColorType["COLOR"] = 13] = "COLOR";
    /**
     * color using srgb
     */
    ColorType[ColorType["SRGB"] = 14] = "SRGB";
    /**
     * color using prophoto-rgb
     */
    ColorType[ColorType["PROPHOTO_RGB"] = 15] = "PROPHOTO_RGB";
    /**
     * color using a98-rgb
     */
    ColorType[ColorType["A98_RGB"] = 16] = "A98_RGB";
    /**
     * color using rec2020
     */
    ColorType[ColorType["REC2020"] = 17] = "REC2020";
    /**
     * color using display-p3
     */
    ColorType[ColorType["DISPLAY_P3"] = 18] = "DISPLAY_P3";
    /**
     * color using srgb-linear
     */
    ColorType[ColorType["SRGB_LINEAR"] = 19] = "SRGB_LINEAR";
    /**
     * color using xyz-d50
     */
    ColorType[ColorType["XYZ_D50"] = 20] = "XYZ_D50";
    /**
     * color using xyz-d65
     */
    ColorType[ColorType["XYZ_D65"] = 21] = "XYZ_D65";
    /**
     * light-dark() color function
     */
    ColorType[ColorType["LIGHT_DARK"] = 22] = "LIGHT_DARK";
    /**
     * color-mix() color function
     */
    ColorType[ColorType["COLOR_MIX"] = 23] = "COLOR_MIX";
    /**
     * non-standard color
     */
    ColorType[ColorType["NON_STD"] = 24] = "NON_STD";
    /**
     * custom color
     */
    ColorType[ColorType["CUSTOM_COLOR"] = 25] = "CUSTOM_COLOR";
    /**
     * alpha() color function
     */
    ColorType[ColorType["ALPHA"] = 26] = "ALPHA";
    /**
     * color using display-p3-linear
     */
    ColorType[ColorType["DISPLAY_P3_LINEAR"] = 27] = "DISPLAY_P3_LINEAR";
    /**
     * Contrast color
     */
    ColorType[ColorType["CONTRAST_COLOR"] = 28] = "CONTRAST_COLOR";
    /**
     * color layers
     */
    ColorType[ColorType["COLOR_LAYERS"] = 29] = "COLOR_LAYERS";
    /**
     * alias for rgba
     */
    ColorType[ColorType["RGB"] = 5] = "RGB";
    /**
     * alias for hsl
     */
    ColorType[ColorType["HSL"] = 6] = "HSL";
    /**
     * alias for xyz-d65
     */
    ColorType[ColorType["XYZ"] = 21] = "XYZ";
    /**
     * alias for cmyk
     */
    ColorType[ColorType["DEVICE_CMYK"] = 8] = "DEVICE_CMYK";
})(ColorType || (ColorType = {}));
/**
 * Supported module case transform
 */
var ModuleCaseTransformEnum;
(function (ModuleCaseTransformEnum) {
    /**
     * export class names as-is
     */
    ModuleCaseTransformEnum[ModuleCaseTransformEnum["IgnoreCase"] = 1] = "IgnoreCase";
    /**
     * transform mapping key name to camel case
     */
    ModuleCaseTransformEnum[ModuleCaseTransformEnum["CamelCase"] = 2] = "CamelCase";
    /**
     * transform class names and mapping key name to camel case
     */
    ModuleCaseTransformEnum[ModuleCaseTransformEnum["CamelCaseOnly"] = 4] = "CamelCaseOnly";
    /**
     * transform mapping key name to dash case
     */
    ModuleCaseTransformEnum[ModuleCaseTransformEnum["DashCase"] = 8] = "DashCase";
    /**
     * transform class names and mapping key name to dash case
     */
    ModuleCaseTransformEnum[ModuleCaseTransformEnum["DashCaseOnly"] = 16] = "DashCaseOnly";
})(ModuleCaseTransformEnum || (ModuleCaseTransformEnum = {}));
/**
 * Supported module scope
 */
var ModuleScopeEnumOptions;
(function (ModuleScopeEnumOptions) {
    /**
     * use the global scope
     */
    ModuleScopeEnumOptions[ModuleScopeEnumOptions["Global"] = 32] = "Global";
    /**
     * use the local scope
     */
    ModuleScopeEnumOptions[ModuleScopeEnumOptions["Local"] = 64] = "Local";
    /**
     * do not allow selector without an id or class
     */
    ModuleScopeEnumOptions[ModuleScopeEnumOptions["Pure"] = 128] = "Pure";
    /**
     * export using ICSS module format
     */
    ModuleScopeEnumOptions[ModuleScopeEnumOptions["ICSS"] = 256] = "ICSS";
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
    ModuleScopeEnumOptions[ModuleScopeEnumOptions["Shortest"] = 512] = "Shortest";
})(ModuleScopeEnumOptions || (ModuleScopeEnumOptions = {}));
/**
 * Options returned by the filters of {@link AstArena.walk} and {@link AstArena.walkValues}
 */
var WalkerOptionEnum;
(function (WalkerOptionEnum) {
    /**
     * ignore the current node and its children
     */
    WalkerOptionEnum[WalkerOptionEnum["Ignore"] = 1] = "Ignore";
    /**
     * stop walking the tree
     */
    WalkerOptionEnum[WalkerOptionEnum["Stop"] = 2] = "Stop";
    /**
     * ignore the current node and process its children
     */
    WalkerOptionEnum[WalkerOptionEnum["Children"] = 4] = "Children";
    /**
     * ignore the current node children
     */
    WalkerOptionEnum[WalkerOptionEnum["IgnoreChildren"] = 8] = "IgnoreChildren";
})(WalkerOptionEnum || (WalkerOptionEnum = {}));
/**
 * Event types of the {@link AstArena.walkValues} filter
 */
var WalkerEvent;
(function (WalkerEvent) {
    /**
     * enter node
     */
    WalkerEvent[WalkerEvent["Enter"] = 1] = "Enter";
    /**
     * leave node
     */
    WalkerEvent[WalkerEvent["Leave"] = 2] = "Leave";
})(WalkerEvent || (WalkerEvent = {}));

export { ColorType, EnumAstNodeStatus, EnumToken, ModuleCaseTransformEnum, ModuleScopeEnumOptions, SyntaxValidationResult, WalkerEvent, WalkerOptionEnum };
