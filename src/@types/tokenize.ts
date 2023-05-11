
export interface LiteralToken {

    typ: 'Literal';
    val: string;
}

export interface IdentToken {

    typ: 'Ident',
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

    typ: 'Percentage',
    val: string;
}

export interface FunctionToken {

    typ: 'Function',
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

    typ: 'Cdo-comment';
    val: string;
}

export interface BadCDOCommentToken {

    typ: 'Bad-cdo-comment';
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

    typ: 'Less-than';
}

export interface GreaterThanToken {

    typ: 'Greater-than';
}

export interface PseudoSelectorToken {

    typ: 'Pseudo-selector';
    val: string;
}

export interface DelimToken {

    typ: 'Delim';
    val: '=';
}

export interface EOFToken {

    typ: 'EOF';
}

export declare type Token = LiteralToken | IdentToken | CommaToken | ColonToken | SemiColonToken |
    NumberToken | AtRuleToken | PercentageToken | FunctionToken | DimensionToken | StringToken |
    UnclosedStringToken | HashToken | BadStringToken | BlockStartToken | BlockEndToken |
    AttrStartToken | AttrEndToken | ParensStartToken | ParensEndToken | CDOCommentToken |
    BadCDOCommentToken | CommentToken | BadCommentToken | WhitespaceToken | IncludesToken |
    DashMatchToken | LessThanToken | GreaterThanToken | PseudoSelectorToken | DelimToken |
    EOFToken;