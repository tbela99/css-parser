
export const specialValues: string[] = ['inherit', 'initial', 'unset',  'revert', 'revert-layer'];
export enum ValidationTokenEnum {

    Root,
    Keyword,
    PropertyType,
    DeclarationType,
    AtRule,
    ValidationFunction,
    ValidationFunctionDefinition,
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
    AtLeastOnce,
    Separator,
    Exclamation,
    Ampersand, // not used in the parser, but used in the data
    PipeToken,
    ColumnToken,
    AmpersandToken,
    Parens
}

export interface Position {

    ind: number;
    lin: number;
    col: number;
}

export interface ValidationToken {

    typ: ValidationTokenEnum;
    pos: Position;
    isList?: boolean;
    isRepeatable?: boolean;
    atLeastOnce?: boolean;
    isOptional?: boolean;
    isRepeatableGroup?: boolean;
    occurence?: {
        min: number;
        max: number;
    }
}

export interface AtLeastOneToken extends ValidationToken {

    typ: ValidationTokenEnum.AtLeastOnce;
}

export interface ParenthesisToken extends ValidationToken {

    typ: ValidationTokenEnum.Parenthesis;
    chi: ValidationToken[];
}

export interface ValidationRootToken extends ValidationToken {

    typ: ValidationTokenEnum.Root;
    chi: ValidationToken[];
}

export interface NumberToken extends ValidationToken {

    typ: ValidationTokenEnum.Number;
    val: number;
}

export interface ValidationKeywordToken extends ValidationToken {

    typ: ValidationTokenEnum.Keyword;
    val: string;
}

export interface ValidationWhitespaceToken extends ValidationToken {

    typ: ValidationTokenEnum.Whitespace;
}

export interface ValidationFunctionToken extends ValidationToken {

    typ: ValidationTokenEnum.Function;
    val: string;
    chi: ValidationToken[]
}

export interface ValidationCommaToken extends ValidationToken {

    typ: ValidationTokenEnum.Comma
}

export interface PipeToken extends ValidationToken {

    typ: ValidationTokenEnum.Pipe
}

export interface ValidationPipeToken extends ValidationToken {

    typ: ValidationTokenEnum.PipeToken;
    l: ValidationToken[];
    r: ValidationToken[];
}

export interface ValidationBracketToken extends ValidationToken {

    typ: ValidationTokenEnum.Bracket,
    chi: ValidationToken[];
}

export interface ValidationParensToken extends ValidationToken {

    typ: ValidationTokenEnum.Parens,
    val: '',
    chi: ValidationToken[];
}

export interface ColumnToken extends ValidationToken {

    typ: ValidationTokenEnum.Column;
}

export interface ValidationAmpersandToken extends ValidationToken {

    typ: ValidationTokenEnum.AmpersandToken
    l: ValidationToken[];
    r: ValidationToken[];
}

export interface ValidationColumnToken extends ValidationToken {

    typ: ValidationTokenEnum.ColumnToken,
    l: ValidationToken[];
    r: ValidationToken[];
}


export interface ValidationDeclarationToken extends ValidationToken {

    typ: ValidationTokenEnum.DeclarationType,
    val: string;
}

export interface ValidationPropertyToken extends ValidationToken {

    typ: ValidationTokenEnum.PropertyType;
    range?: [number, number];
    val: string;
}

export interface KeywordToken extends ValidationToken {

    val: string;
}

export interface OpenBracketToken extends ValidationToken {

    typ: ValidationTokenEnum.OpenBracket
}

export interface CloseBracketToken extends ValidationToken {

    typ: ValidationTokenEnum.CloseBracket
}

export interface OpenParenthesisToken extends ValidationToken {

    typ: ValidationTokenEnum.OpenParenthesis
}

export interface CloseParenthesisToken extends ValidationToken {

    typ: ValidationTokenEnum.CloseParenthesis
}

export interface AmpersandToken extends ValidationToken {

    typ: ValidationTokenEnum.Ampersand
}

export interface ExclamationToken extends ValidationToken {

    typ: ValidationTokenEnum.Exclamation
}

export interface FinalToken extends ValidationToken {

    typ: ValidationTokenEnum.HashMark
}

export interface SeparatorToken extends ValidationToken {

    typ: ValidationTokenEnum.Separator
}

export interface OpenCurlyBraceToken extends ValidationToken {

    typ: ValidationTokenEnum.OpenCurlyBrace
}

export interface CloseCurlyBraceToken extends ValidationToken {

    typ: ValidationTokenEnum.CloseCurlyBrace
}

export interface StarToken extends ValidationToken {

    typ: ValidationTokenEnum.Star
}

export interface OptionalToken extends ValidationToken {

    typ: ValidationTokenEnum.QuestionMark
}

export interface ValidationFunctionToken extends ValidationToken {

    typ: ValidationTokenEnum.Function
    val: string;
    chi: ValidationToken[]
}

export interface ValidationFunctionDefinitionToken extends ValidationToken {

    typ: ValidationTokenEnum.ValidationFunctionDefinition
    val: string;
}