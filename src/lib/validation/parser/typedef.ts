export enum ValidationTokenEnum {
    Root,
    Keyword,
    PropertyType,
    DeclarationType,
    AtRule,
    FunctionDefinition,
    OpenBracket,
    CloseBracket,
    OpenParenthesis,
    CloseParenthesis,
    Comma,
    Pipe,
    Column,
    Star,
    OpenCurlyBrace,
    CloseCurlyBrace,
    HashMark,
    QuestionMark,
    Function,
    Number,
    Whitespace,
    Parenthesis,
    Bracket,
    Block,
    Plus,
    Separator,
    Exclamation,
    Ampersand,
    PipeToken,
    ColumnToken,
    AmpersandToken,
    Parens,
    PseudoClassToken,
    PseudoClassFunctionToken,
    StringToken,
    AtRuleDefinition,
    DeclarationNameToken,
    DeclarationDefinitionToken,
    SemiColon,
    Character,
    InfinityToken,
    LessThan,
    GreaterThan,
    /**
     * end of token stream
     */
    EOF,
    /**
     * optional group or tokens, used to group validation tokens
     *
     * ```ts
     * // <bg-layer>#? , <final-bg-layer> -> [<bg-layer>#? ,]? <final-bg-layer>
     * // , <angular-color-stop> ]#? -> [, <angular-color-stop> ]#?]?
     * ```
     */
    OptionalGroupToken,
    /**
     * dimension token
     *
     * ```ts
     * // <time [0s,∞]> -> {
     * //     typ: ValidationTokenEnum.PropertyType
     * //     val: 'time',
     * //     range: {
     * //         min: ValidationNumberToken,
     * //         max: null | ValidationNumberToken | ValidationInfinityToken
     * //     }
     * // }
     * ```
     */
    Dimension,
    DisallowWhitespace,
    Colon,
}

export enum ValidationSyntaxGroupEnum {
    Declarations = "declarations",
    Functions = "functions",
    Syntaxes = "syntaxes",
    Selectors = "selectors",
    AtRules = "atRules",
    Units = "units",
    Languages = "languages",
    mediaFeatures = "mediaFeatures",
}

export enum MediaFeatureType {
    BooleanType = "boolean",
    IntergerType = "integer",
    KeywordType = "keyword",
    LengthType = "length",
    NumberType = "number",
    RatioType = "ratio",
    ResolutionType = "resolution",
    StringType = "string",
}
