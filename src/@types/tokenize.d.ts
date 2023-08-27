import {Location} from "./index";
import {EnumToken} from "../lib";

interface BaseToken {

    type: EnumToken;
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
    val: string;
    unit: string;
}

export interface LengthToken extends BaseToken {

    typ: EnumToken.LengthTokenType;
    val: string;
    unit: string;
}

export interface AngleToken extends BaseToken {

    typ: EnumToken.AngleTokenType;
    val: string;
    unit: string;
}

export interface TimeToken extends BaseToken {

    typ: EnumToken.TimeTokenType;
    val: string;
    unit: 'ms' | 's';
}

export interface FrequencyToken extends BaseToken {

    typ: EnumToken.FrequencyTokenType;
    val: string;
    unit: 'Hz' | 'Khz';
}

export interface ResolutionToken extends BaseToken {

    typ: EnumToken.ResolutionTokenType;
    val: string;
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
    chi?: Token[];
}

export interface ParensEndToken extends BaseToken {

    typ: EnumToken.EndParensTokenType
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

export interface IncludesToken extends BaseToken {

    typ: EnumToken.IncludesTokenType;
    val: '~=';
}

export interface DashMatchToken extends BaseToken {

    typ: EnumToken.DashMatchTokenType;
    val: '|=';
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

export declare type TokenType = EnumToken;
export declare type Token = LiteralToken | IdentToken | CommaToken | ColonToken | SemiColonToken |
    NumberToken | AtRuleToken | PercentageToken | FunctionURLToken | FunctionToken | DimensionToken | LengthToken |
    AngleToken | StringToken | TimeToken | FrequencyToken | ResolutionToken |
    UnclosedStringToken | HashToken | BadStringToken | BlockStartToken | BlockEndToken |
    AttrStartToken | AttrEndToken | ParensStartToken | ParensEndToken | CDOCommentToken |
    BadCDOCommentToken | CommentToken | BadCommentToken | WhitespaceToken | IncludesToken |
    DashMatchToken | LessThanToken | LessThanOrEqualToken | GreaterThanToken | GreaterThanOrEqualToken |
    PseudoClassToken | PseudoClassFunctionToken | DelimToken |
    BadUrlToken | UrlToken | ImportantToken | ColorToken | AttrToken | EOFToken;