import {Location} from "./index";
import {EnumToken} from "../lib";

interface BaseToken {

    typ: EnumToken;
    loc?: Location;
}

export interface LiteralToken extends BaseToken {

    typ: EnumToken.LiteralTokenType;
    val: string;
}

export interface IdentToken extends BaseToken {

    typ: EnumToken.IdenTokenType,
    val: string;
}

export interface CommaToken extends BaseToken {

    typ: EnumToken.CommaTokenType
}

export interface ColonToken extends BaseToken {

    typ: EnumToken.ColonTokenType
}

export interface SemiColonToken extends BaseToken {

    typ: EnumToken.SemiColonTokenType
}

export interface NumberToken extends BaseToken {

    typ: EnumToken.NumberTokenType,
    val: string;
}

export interface AtRuleToken extends BaseToken {

    typ: EnumToken.AtRuleTokenType,
    val: string;
}

export interface PercentageToken extends BaseToken {

    typ: EnumToken.PercentageTokenType,
    val: string;
}

export interface FunctionToken extends BaseToken {

    typ: EnumToken.FunctionTokenType,
    val: string;
    chi: Token[];
}

export interface FunctionURLToken extends BaseToken {

    typ: EnumToken.UrlFunctionTokenType,
    val: 'url';
    chi: Array<UrlToken | CommentToken>;
}

export interface StringToken extends BaseToken {

    typ: EnumToken.StringTokenType;
    val: string;
}

export interface BadStringToken extends BaseToken {

    typ: EnumToken.BadStringTokenType;
    val: string;
}

export interface UnclosedStringToken extends BaseToken {

    typ: EnumToken.UnclosedStringTokenType;
    val: string;
}

export interface DimensionToken extends BaseToken {

    typ: EnumToken.DimensionTokenType;
    val: string | BinaryExpressionToken;
    unit: string;
}

export interface LengthToken extends BaseToken {

    typ: EnumToken.LengthTokenType;
    val: string | BinaryExpressionToken;
    unit: string;
}

export interface AngleToken extends BaseToken {

    typ: EnumToken.AngleTokenType;
    val: string | BinaryExpressionToken;
    unit: string;
}

export interface TimeToken extends BaseToken {

    typ: EnumToken.TimeTokenType;
    val: string | BinaryExpressionToken;
    unit: 'ms' | 's';
}

export interface FrequencyToken extends BaseToken {

    typ: EnumToken.FrequencyTokenType;
    val: string | BinaryExpressionToken;
    unit: 'Hz' | 'Khz';
}

export interface ResolutionToken extends BaseToken {

    typ: EnumToken.ResolutionTokenType;
    val: string | BinaryExpressionToken;
    unit: 'dpi' | 'dpcm' | 'dppx' | 'x';
}

export interface HashToken extends BaseToken {

    typ: EnumToken.HashTokenType;
    val: string;
}

export interface BlockStartToken extends BaseToken {

    typ: EnumToken.BlockStartTokenType
}

export interface BlockEndToken extends BaseToken {

    typ: EnumToken.BlockEndTokenType
}

export interface AttrStartToken extends BaseToken {

    typ: EnumToken.AttrStartTokenType;
    chi?: Token[];
}

export interface AttrEndToken extends BaseToken {

    typ: EnumToken.AttrEndTokenType
}

export interface ParensStartToken extends BaseToken {

    typ: EnumToken.StartParensTokenType;
}

export interface ParensEndToken extends BaseToken {

    typ: EnumToken.EndParensTokenType
}

export interface ParensToken extends BaseToken {

    typ: EnumToken.ParensTokenType;
    chi: Token[];
}

export interface WhitespaceToken extends BaseToken {

    typ: EnumToken.WhitespaceTokenType
}

export interface CommentToken extends BaseToken {

    typ: EnumToken.CommentTokenType;
    val: string;
}

export interface BadCommentToken extends BaseToken {

    typ: EnumToken.BadCommentTokenType;
    val: string;
}

export interface CDOCommentToken extends BaseToken {

    typ: EnumToken.CDOCOMMTokenType;
    val: string;
}

export interface BadCDOCommentToken extends BaseToken {

    typ: EnumToken.BadCdoTokenType;
    val: string;
}

export interface IncludeMatchToken extends BaseToken {

    typ: EnumToken.IncludeMatchTokenType;
    // val: '~=';
}

export interface DashMatchToken extends BaseToken {

    typ: EnumToken.DashMatchTokenType;
    // val: '|=';
}

export interface StartMatchToken extends BaseToken {

    typ: EnumToken.StartMatchTokenType;
    // val: '^=';
}

export interface EndMatchToken extends BaseToken {

    typ: EnumToken.EndMatchTokenType;
    // val: '|=';
}

export interface ContainMatchToken extends BaseToken {

    typ: EnumToken.ContainMatchTokenType;
    // val: '|=';
}

export interface LessThanToken extends BaseToken {

    typ: EnumToken.LtTokenType;
}

export interface LessThanOrEqualToken extends BaseToken {

    typ: EnumToken.LteTokenType;
}

export interface GreaterThanToken extends BaseToken {

    typ: EnumToken.GtTokenType;
}

export interface GreaterThanOrEqualToken extends BaseToken {

    typ: EnumToken.GteTokenType;
}

export interface ColumnCombinatorToken extends BaseToken {

    typ: EnumToken.ColumnCombinatorTokenType;
}

export interface PseudoClassToken extends BaseToken {

    typ: EnumToken.PseudoClassTokenType;
    val: string;
}

export interface PseudoClassFunctionToken extends BaseToken {

    typ: EnumToken.PseudoClassFuncTokenType;
    val: string;
    chi: Token[];
}

export interface DelimToken extends BaseToken {

    typ: EnumToken.DelimTokenType;
    val: '=';
}

export interface BadUrlToken extends BaseToken {

    typ: EnumToken.BadUrlTokenType,
    val: string;
}

export interface UrlToken extends BaseToken {

    typ: EnumToken.UrlTokenTokenType,
    val: string;
}

export interface EOFToken extends BaseToken {

    typ: EnumToken.EOFTokenType;
}

export interface ImportantToken extends BaseToken {

    typ: EnumToken.ImportantTokenType;
}

export interface ColorToken extends BaseToken {

    typ: EnumToken.ColorTokenType;
    val: string;
    kin: 'lit' | 'hex' | 'rgb' | 'rgba' | 'hsl' | 'hsla' | 'hwb' | 'device-cmyk';
    chi?: Token[];
}

export interface AttrToken extends BaseToken {

    typ: EnumToken.AttrTokenType,
    chi: Token[]
}

export interface AddToken extends BaseToken {

    typ: EnumToken.Add;
}

export interface SubToken extends BaseToken {

    typ: EnumToken.Sub;
}

export interface DivToken extends BaseToken {

    typ: EnumToken.Div;
}

export interface MulToken extends BaseToken {

    typ: EnumToken.Mul;
}

export interface UnaryExpression extends BaseToken {

    typ: EnumToken.UnaryExpressionTokenType
    sign: EnumToken.Add | EnumToken.Sub;
    val: UnaryExpressionNode;
}

export interface BinaryExpressionToken extends BaseToken {

    typ: EnumToken.BinaryExpressionTokenType
    op: EnumToken.Add | EnumToken.Sub | EnumToken.Div | EnumToken.Mul | EnumToken.DashMatchTokenType | EnumToken.StartMatchTokenType | EnumToken.ContainMatchTokenType |
        EnumToken.EndMatchTokenType | EnumToken.IncludeMatchTokenType;
    l: BinaryExpressionNode | Token;
    r: BinaryExpressionNode | Token;
}

export interface MatchExpressionToken extends BaseToken {

    typ: EnumToken.MatchExpressionTokenType
    op: EnumToken.DashMatchTokenType | EnumToken.StartMatchTokenType | EnumToken.ContainMatchTokenType | EnumToken.EndMatchTokenType | EnumToken.IncludeMatchTokenType;
    l: Token;
    r: Token;
    attr?: 'i' | 's';
}

export interface NameSpaceAttributeToken extends BaseToken {

    typ: EnumToken.NameSpaceAttributeTokenType
   l?: Token;
    r: Token;
}

export interface ListToken extends BaseToken {

    typ: EnumToken.ListToken
    chi: Token[];
}

export declare type UnaryExpressionNode =
    BinaryExpressionNode
    | NumberToken
    | DimensionToken
    | TimeToken
    | LengthToken
    | AngleToken
    | FrequencyToken;

export declare type BinaryExpressionNode = NumberToken | DimensionToken | PercentageToken |
    AngleToken | LengthToken | FrequencyToken | BinaryExpressionToken | FunctionToken | ParensToken;

export declare type TokenType = EnumToken;
export declare type Token =
    LiteralToken
    | IdentToken
    | CommaToken
    | ColonToken
    | SemiColonToken
    |
    NumberToken
    | AtRuleToken
    | PercentageToken
    | FunctionURLToken
    | FunctionToken
    | DimensionToken
    | LengthToken
    |
    AngleToken
    | StringToken
    | TimeToken
    | FrequencyToken
    | ResolutionToken
    |
    UnclosedStringToken
    | HashToken
    | BadStringToken
    | BlockStartToken
    | BlockEndToken
    |
    AttrStartToken
    | AttrEndToken
    | ParensStartToken
    | ParensEndToken
    | ParensToken
    | CDOCommentToken
    |
    BadCDOCommentToken
    | CommentToken
    | BadCommentToken
    | WhitespaceToken
    | IncludeMatchToken
    | StartMatchToken
    | EndMatchToken
    | ContainMatchToken | MatchExpressionToken | NameSpaceAttributeToken
    |
    DashMatchToken
    | LessThanToken
    | LessThanOrEqualToken
    | GreaterThanToken
    | GreaterThanOrEqualToken
    | ColumnCombinatorToken
    |
    ListToken
    | PseudoClassToken
    | PseudoClassFunctionToken
    | DelimToken
    | BinaryExpressionToken
    | UnaryExpression
    |
    AddToken
    | SubToken
    | DivToken
    | MulToken
    |
    BadUrlToken
    | UrlToken
    | ImportantToken
    | ColorToken
    | AttrToken
    | EOFToken;