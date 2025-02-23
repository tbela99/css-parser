const specialValues = ['inherit', 'initial', 'unset', 'revert', 'revert-layer'];
var ValidationTokenEnum;
(function (ValidationTokenEnum) {
    ValidationTokenEnum[ValidationTokenEnum["Root"] = 0] = "Root";
    ValidationTokenEnum[ValidationTokenEnum["Keyword"] = 1] = "Keyword";
    ValidationTokenEnum[ValidationTokenEnum["PropertyType"] = 2] = "PropertyType";
    ValidationTokenEnum[ValidationTokenEnum["DeclarationType"] = 3] = "DeclarationType";
    ValidationTokenEnum[ValidationTokenEnum["AtRule"] = 4] = "AtRule";
    ValidationTokenEnum[ValidationTokenEnum["ValidationFunctionDefinition"] = 5] = "ValidationFunctionDefinition";
    ValidationTokenEnum[ValidationTokenEnum["OpenBracket"] = 6] = "OpenBracket";
    ValidationTokenEnum[ValidationTokenEnum["CloseBracket"] = 7] = "CloseBracket";
    ValidationTokenEnum[ValidationTokenEnum["OpenParenthesis"] = 8] = "OpenParenthesis";
    ValidationTokenEnum[ValidationTokenEnum["CloseParenthesis"] = 9] = "CloseParenthesis";
    ValidationTokenEnum[ValidationTokenEnum["Comma"] = 10] = "Comma";
    ValidationTokenEnum[ValidationTokenEnum["Pipe"] = 11] = "Pipe";
    ValidationTokenEnum[ValidationTokenEnum["Column"] = 12] = "Column";
    ValidationTokenEnum[ValidationTokenEnum["Star"] = 13] = "Star";
    ValidationTokenEnum[ValidationTokenEnum["OpenCurlyBrace"] = 14] = "OpenCurlyBrace";
    ValidationTokenEnum[ValidationTokenEnum["CloseCurlyBrace"] = 15] = "CloseCurlyBrace";
    ValidationTokenEnum[ValidationTokenEnum["HashMark"] = 16] = "HashMark";
    ValidationTokenEnum[ValidationTokenEnum["QuestionMark"] = 17] = "QuestionMark";
    ValidationTokenEnum[ValidationTokenEnum["Function"] = 18] = "Function";
    ValidationTokenEnum[ValidationTokenEnum["Number"] = 19] = "Number";
    ValidationTokenEnum[ValidationTokenEnum["Whitespace"] = 20] = "Whitespace";
    ValidationTokenEnum[ValidationTokenEnum["Parenthesis"] = 21] = "Parenthesis";
    ValidationTokenEnum[ValidationTokenEnum["Bracket"] = 22] = "Bracket";
    ValidationTokenEnum[ValidationTokenEnum["Block"] = 23] = "Block";
    ValidationTokenEnum[ValidationTokenEnum["AtLeastOnce"] = 24] = "AtLeastOnce";
    ValidationTokenEnum[ValidationTokenEnum["Separator"] = 25] = "Separator";
    ValidationTokenEnum[ValidationTokenEnum["Exclamation"] = 26] = "Exclamation";
    ValidationTokenEnum[ValidationTokenEnum["Ampersand"] = 27] = "Ampersand";
    ValidationTokenEnum[ValidationTokenEnum["PipeToken"] = 28] = "PipeToken";
    ValidationTokenEnum[ValidationTokenEnum["ColumnToken"] = 29] = "ColumnToken";
    ValidationTokenEnum[ValidationTokenEnum["AmpersandToken"] = 30] = "AmpersandToken";
    ValidationTokenEnum[ValidationTokenEnum["Parens"] = 31] = "Parens";
    ValidationTokenEnum[ValidationTokenEnum["PseudoClassToken"] = 32] = "PseudoClassToken";
    ValidationTokenEnum[ValidationTokenEnum["PseudoClassFunctionToken"] = 33] = "PseudoClassFunctionToken";
    ValidationTokenEnum[ValidationTokenEnum["StringToken"] = 34] = "StringToken";
    ValidationTokenEnum[ValidationTokenEnum["AtRuleDefinition"] = 35] = "AtRuleDefinition";
    ValidationTokenEnum[ValidationTokenEnum["DeclarationNameToken"] = 36] = "DeclarationNameToken";
    ValidationTokenEnum[ValidationTokenEnum["DeclarationDefinitionToken"] = 37] = "DeclarationDefinitionToken";
    ValidationTokenEnum[ValidationTokenEnum["SemiColon"] = 38] = "SemiColon";
    ValidationTokenEnum[ValidationTokenEnum["Character"] = 39] = "Character";
    ValidationTokenEnum[ValidationTokenEnum["ColumnArrayToken"] = 40] = "ColumnArrayToken";
})(ValidationTokenEnum || (ValidationTokenEnum = {}));
var ValidationSyntaxGroupEnum;
(function (ValidationSyntaxGroupEnum) {
    ValidationSyntaxGroupEnum["Declarations"] = "declarations";
    ValidationSyntaxGroupEnum["Functions"] = "functions";
    ValidationSyntaxGroupEnum["Syntaxes"] = "syntaxes";
    ValidationSyntaxGroupEnum["Selectors"] = "selectors";
    ValidationSyntaxGroupEnum["AtRules"] = "atRules";
})(ValidationSyntaxGroupEnum || (ValidationSyntaxGroupEnum = {}));

export { ValidationSyntaxGroupEnum, ValidationTokenEnum, specialValues };
