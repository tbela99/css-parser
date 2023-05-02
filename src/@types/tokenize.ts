
export interface LiteralToken {

    type: 'literal';
    value: string;
}

export interface IdentToken {

    type: 'ident',
    value: string;
}

export interface CommaToken {

    type: 'comma'
}

export interface ColonToken {

    type: 'colon'
}

export interface SemiColonToken {

    type: 'semi-colon'
}

export interface NumberToken {

    type: 'number',
    value: string;
}

export interface AtRuleToken {

    type: 'at-rule',
    value: string;
}

export interface PercentageToken {

    type: 'percentage',
    value: string;
}

export interface FunctionToken {

    type: 'function',
    value: string;
}

export interface StringToken {

    type: 'string';
    value: string;
}

export interface BadStringToken {

    type: 'bad-string',
    value: string;
}

export interface UnclosedStringToken {

    type: 'unclosed-string',
    value: string;
}

export interface DimensonToken {

    type: 'dimension',
    value: string;
    unit: string;
}

export interface HashToken {

    type: 'hash',
    value: string;
}

export interface BlockStartToken {

    type: 'block-start'
}

export interface BlockEndToken {

    type: 'block-end'
}

export interface AttrStartToken {

    type: 'attr-start'
}

export interface AttrEndToken {

    type: 'attr-end'
}

export interface ParensStartToken {

    type: 'start-parens'
}

export interface ParensEndToken {

    type: 'end-parens'
}

export interface WhitespaceToken {

    type: 'whitespace'
}

export interface CommentToken {

    type: 'comment';
    value: string;
}

export interface BadCommentToken {

    type: 'bad-comment';
    value: string;
}

export interface CDOCommentToken {

    type: 'cdo-comment';
    value: string;
}

export interface BadCDOCommentToken {

    type: 'bad-cdo-comment';
    value: string;
}

export interface IncludesToken {

    type: 'includes';
    value: '~=';
}

export interface DashMatchToken {

    type: 'dash-match';
    value: '|=';
}

export interface LessThanToken {

    type: 'less-than';
}

export interface GreaterThanToken {

    type: 'greater-than';
}

export declare type Token = LiteralToken | IdentToken | CommaToken | ColonToken | SemiColonToken |
    NumberToken | AtRuleToken | PercentageToken | FunctionToken | DimensonToken | StringToken |
    UnclosedStringToken | HashToken | BadStringToken | BlockStartToken | BlockEndToken |
    AttrStartToken | AttrEndToken | ParensStartToken | ParensEndToken | CDOCommentToken |
    BadCDOCommentToken | CommentToken | BadCommentToken | WhitespaceToken | IncludesToken |
    DashMatchToken | LessThanToken | GreaterThanToken;