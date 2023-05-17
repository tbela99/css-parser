
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
}

export interface StringToken {

    typ: 'String';
    val: string;
}

export interface BadStringToken {

    typ: 'Bad-string',
    val: string;
}

export interface UnclosedStringToken {

    typ: 'Unclosed-string',
    val: string;
}

export interface DimensionToken {

    typ: 'Dimension',
    val: string;
    unit: string;
}

export interface HashToken {

    typ: 'Hash',
    val: string;
}

export interface BlockStartToken {

    typ: 'Block-start'
}

export interface BlockEndToken {

    typ: 'Block-end'
}

export interface AttrStartToken {

    typ: 'Attr-start'
}

export interface AttrEndToken {

    typ: 'Attr-end'
}

export interface ParensStartToken {

    typ: 'Start-parens'
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

    typ: 'BADCDO';
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

export interface GreaterThanToken {

    typ: 'Gt';
}

export interface PseudoClassToken {

    typ: 'Pseudo-class';
    val: string;
}

export interface PseudoClassFunctionToken {

    typ: 'Pseudo-class-func';
    val: string;
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

export declare type Token = LiteralToken | IdentToken | CommaToken | ColonToken | SemiColonToken |
    NumberToken | AtRuleToken | PercentageToken | FunctionToken | DimensionToken | StringToken |
    UnclosedStringToken | HashToken | BadStringToken | BlockStartToken | BlockEndToken |
    AttrStartToken | AttrEndToken | ParensStartToken | ParensEndToken | CDOCommentToken |
    BadCDOCommentToken | CommentToken | BadCommentToken | WhitespaceToken | IncludesToken |
    DashMatchToken | LessThanToken | GreaterThanToken | PseudoClassToken | PseudoClassFunctionToken | DelimToken |
    BadUrlToken | UrlToken | EOFToken;