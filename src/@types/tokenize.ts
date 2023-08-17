export interface LiteralToken {

    typ: 'Literal';
    val: string;
}

export interface IdentToken {

    typ: 'Iden',
    val: string;
}

export interface CommaToken {

    typ: 'Comma'
}

export interface ColonToken {

    typ: 'Colon'
}

export interface SemiColonToken {

    typ: 'Semi-colon'
}

export interface NumberToken {

    typ: 'Number',
    val: string;
}

export interface AtRuleToken {

    typ: 'At-rule',
    val: string;
}

export interface PercentageToken {

    typ: 'Perc',
    val: string;
}

export interface FunctionToken {

    typ: 'Func',
    val: string;
    chi: Token[];
}

export interface FunctionURLToken {

    typ: 'UrlFunc',
    val: 'url';
    chi: Array<UrlToken | CommentToken>;
}

export interface StringToken {

    typ: 'String';
    val: string;
}

export interface BadStringToken {

    typ: 'Bad-string';
    val: string;
}

export interface UnclosedStringToken {

    typ: 'Unclosed-string';
    val: string;
}

export interface DimensionToken {

    typ: 'Dimension';
    val: string;
    unit: string;
}

export interface LengthToken {

    typ: 'Length';
    val: string;
    unit: string;
}

export interface AngleToken {

    typ: 'Angle';
    val: string;
    unit: string;
}

export interface TimeToken {

    typ: 'Time';
    val: string;
    unit: 'ms' | 's';
}

export interface FrequencyToken {

    typ: 'Frequency';
    val: string;
    unit: 'Hz' | 'Khz';
}

export interface ResolutionToken {

    typ: 'Resolution';
    val: string;
    unit: 'dpi' | 'dpcm' | 'dppx' | 'x';
}

export interface HashToken {

    typ: 'Hash';
    val: string;
}

export interface BlockStartToken {

    typ: 'Block-start'
}

export interface BlockEndToken {

    typ: 'Block-end'
}

export interface AttrStartToken {

    typ: 'Attr-start';
    chi?: Token[];
}

export interface AttrEndToken {

    typ: 'Attr-end'
}

export interface ParensStartToken {

    typ: 'Start-parens';
    chi?: Token[];
}

export interface ParensEndToken {

    typ: 'End-parens'
}

export interface WhitespaceToken {

    typ: 'Whitespace'
}

export interface CommentToken {

    typ: 'Comment';
    val: string;
}

export interface BadCommentToken {

    typ: 'Bad-comment';
    val: string;
}

export interface CDOCommentToken {

    typ: 'CDOCOMM';
    val: string;
}

export interface BadCDOCommentToken {

    typ: 'Bad-cdo';
    val: string;
}

export interface IncludesToken {

    typ: 'Includes';
    val: '~=';
}

export interface DashMatchToken {

    typ: 'Dash-match';
    val: '|=';
}

export interface LessThanToken {

    typ: 'Lt';
}

export interface LessThanOrEqualToken {

    typ: 'Lte';
}

export interface GreaterThanToken {

    typ: 'Gt';
}

export interface GreaterThanOrEqualToken {

    typ: 'Gte';
}
export interface PseudoClassToken {

    typ: 'Pseudo-class';
    val: string;
}

export interface PseudoClassFunctionToken {

    typ: 'Pseudo-class-func';
    val: string;
    chi: Token[];
}

export interface DelimToken {

    typ: 'Delim';
    val: '=';
}

export interface BadUrlToken {

    typ: 'Bad-url-token',
    val: string;
}

export interface UrlToken {

    typ: 'Url-token',
    val: string;
}

export interface EOFToken {

    typ: 'EOF';
}

export interface ImportantToken {

    typ: 'Important';
}

export interface ColorToken {

    typ: 'Color';
    val: string;
    kin: 'lit' | 'hex' | 'rgb' | 'rgba' | 'hsl' | 'hsla' | 'hwb' | 'device-cmyk';
    chi?: Token[];
}

export interface AttrToken {

    typ: 'Attr',
    chi: Token[]
}

export interface TokenStream {
    buffer: string;
    ind: number;
    lin: number;
    col: number;
}

// export declare type BadTokenType = 'Bad-comment' | 'Bad-string' | 'Bad-url-token';
export declare type TokenType = 'Dimension' | 'Number' | 'Perc' | 'Angle' | 'Length' | 'Time' | 'Frequency' |
    'Resolution' | 'Attr' ;

export declare type Token = LiteralToken | IdentToken | CommaToken | ColonToken | SemiColonToken |
    NumberToken | AtRuleToken | PercentageToken | FunctionURLToken | FunctionToken | DimensionToken | LengthToken |
    AngleToken | StringToken | TimeToken | FrequencyToken | ResolutionToken |
    UnclosedStringToken | HashToken | BadStringToken | BlockStartToken | BlockEndToken |
    AttrStartToken | AttrEndToken | ParensStartToken | ParensEndToken | CDOCommentToken |
    BadCDOCommentToken | CommentToken | BadCommentToken | WhitespaceToken | IncludesToken |
    DashMatchToken | LessThanToken | LessThanOrEqualToken | GreaterThanToken | GreaterThanOrEqualToken |
    PseudoClassToken | PseudoClassFunctionToken | DelimToken |
    BadUrlToken | UrlToken | ImportantToken | ColorToken | AttrToken | EOFToken;