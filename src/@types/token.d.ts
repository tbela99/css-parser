import type { BaseToken } from "./ast.d.ts";
import type { AstArena } from "../lib/ast/arena.ts";
import { ColorType, EnumToken, EnumAstNodeStatus } from "../lib/ast/types.ts";

/**
 * Literal token
 */
export declare interface LiteralToken extends BaseToken {
    /**
     * @inheritdoc
     */
    typ: EnumToken.LiteralTokenType;
    /**
     * literal value
     */
    val: string;
}

/**
 * Class selector token
 */
export declare interface ClassSelectorToken extends BaseToken {
    /**
     * @inheritdoc
     */
    typ: EnumToken.ClassSelectorTokenType;
    /**
     * class name
     */
    val: string;
}

/**
 * Universal selector token
 */
export declare interface UniversalSelectorToken extends BaseToken {
    /**
     * @inheritdoc
     */
    typ: EnumToken.UniversalSelectorTokenType;
}

/**
 * Ident token
 */
export declare interface IdentToken extends BaseToken {
    /**
     * @inheritdoc
     */
    typ: EnumToken.IdenTokenType;
    /**
     * ident value
     */
    val: string;
}

/**
 * Css type token
 */
export declare interface CssTypeTokenType extends BaseToken {
 /**
     * @inheritdoc
     */
    typ: EnumToken.CssTypeTokenType;
    /**
     * css type value
     */
    val: string;
}

/**
 * Ident list token
 */
export declare interface IdentListToken extends BaseToken {
    /**
     * @inheritdoc
     */
    typ: EnumToken.IdenListTokenType;
    /**
     * ident list value
     */
    val: string;
}

/**
 * Dashed ident token
 */
export declare interface DashedIdentToken extends BaseToken {
    /**
     * @inheritdoc
     */
    typ: EnumToken.DashedIdenTokenType;
    /**
     * ident value
     */
    val: string;
}

/**
 * Comma token
 */
export declare interface CommaToken extends BaseToken {
    /**
     * @inheritdoc
     */
    typ: EnumToken.CommaTokenType;
}

/**
 * Colon token
 */
export declare interface ColonToken extends BaseToken {
    /**
     * @inheritdoc
     */
    typ: EnumToken.ColonTokenType;
}

/**
 * Double colon token
 */
export declare interface DoubleColonToken extends BaseToken {
    /**
     * @inheritdoc
     */
    typ: EnumToken.DoubleColonTokenType;
}

/**
 * Semicolon token
 */
export declare interface SemiColonToken extends BaseToken {
    /**
     * @inheritdoc
     */
    typ: EnumToken.SemiColonTokenType;
}

/**
 * Nesting selector token
 */
export declare interface NestingSelectorToken extends BaseToken {
    /**
     * @inheritdoc
     */
    typ: EnumToken.NestingSelectorTokenType;
}

/**
 * Number token
 */
export declare interface NumberToken extends BaseToken {
    /**
     * @inheritdoc
     */
    typ: EnumToken.NumberTokenType;
    /**
     * number sign
     */
    sign?: "-" | "+";
    /**
     * number value
     */
    val: number | FractionToken;
}

export declare interface NaNToken extends BaseToken {
    /**
     * @inheritdoc
     */
    typ: EnumToken.NaNTokenType;
}

export declare interface InfinityToken extends BaseToken {
    /**
     * @inheritdoc
     */
    typ: EnumToken.InfinityTokenType;
}

export declare interface NegativeInfinityToken extends BaseToken {
    /**
     * @inheritdoc
     */
    typ: EnumToken.NegativeInfinityTokenType;
}

/**
 * At rule token
 */
export declare interface AtRuleToken extends BaseToken {
    /**
     * @inheritdoc
     */
    typ: EnumToken.AtRuleTokenType;
    /**
     * at rule name
     */
    nam: string;
    /**
     * at rule value
     */
    val?: string;
}

/**
 * Percentage token
 */
export declare interface PercentageToken extends BaseToken {
    /**
     * @inheritdoc
     */
    typ: EnumToken.PercentageTokenType;
    /**
     * percentage value
     */
    val: number | FractionToken;
}

/**
 * Flex token
 */
export declare interface FlexToken extends BaseToken {
    /**
     * @inheritdoc
     */
    typ: EnumToken.FlexTokenType;
    /**
     * flex value
     */
    val: number | FractionToken;
}

/**
 * Function token
 */
export declare interface FunctionToken extends BaseToken {
    /**
     * function type
     */
    typ:
        | EnumToken.FunctionTokenType
        | EnumToken.UrlFunctionTokenType
        | EnumToken.GridTemplateFuncTokenType
        | EnumToken.ImageFunctionTokenType
        | EnumToken.TimelineFunctionTokenType
        | EnumToken.TimingFunctionTokenType
        | EnumToken.ColorTokenType
        | EnumToken.MathFunctionTokenType
        | EnumToken.PseudoClassFuncTokenType
        | EnumToken.TransformFunctionTokenType
        | EnumToken.GeneralEnclosedFunctionTokenType
        | EnumToken.WildCardFunctionTokenType;
    /**
     * function name
     */
    val: string;
    /**
     * function children
     */
    chi: PlainToken[];
}

/**
 * Grid template function token
 */
export declare interface GridTemplateFuncToken extends BaseToken {
    /**
     * @inheritdoc
     */
    typ: EnumToken.GridTemplateFuncTokenType;
    /**
     * function name
     */
    val: string;
    /**
     * function children
     */
    chi: PlainToken[];
}

/**
 * Function URL token
 */
export declare interface FunctionURLToken extends BaseToken {
    /**
     * @inheritdoc
     */
    typ: EnumToken.UrlFunctionTokenType;
    /**
     * function name
     */
    val: "url";
    /**
     * function children
     */
    chi: Array<UrlToken | StringToken | CommentToken>;
}

/**
 * Function image token
 */
export declare interface FunctionImageToken extends BaseToken {
    /**
     * @inheritdoc
     */
    typ: EnumToken.ImageFunctionTokenType;
    /**
     * function name
     */
    val:
        | "linear-gradient"
        | "radial-gradient"
        | "repeating-linear-gradient"
        | "repeating-radial-gradient"
        | "conic-gradient"
        | "image"
        | "image-set"
        | "element"
        | "cross-fade";
    /**
     * function children
     */
    chi: Array<UrlToken | CommentToken>;
}

/**
 * Timing function token
 */
export declare interface TimingFunctionToken extends BaseToken {
    /**
     * @inheritdoc
     */
    typ: EnumToken.TimingFunctionTokenType;
    /**
     * timing function value
     */
    val: string;
    /**
     * timing function children
     */
    chi: PlainToken[];
}

/**
 * Timeline function token
 */
export declare interface TimelineFunctionToken extends BaseToken {
    /**
     * @inheritdoc
     */
    typ: EnumToken.TimelineFunctionTokenType;
    /**
     * timeline function value
     */
    val: string;
    /**
     * timeline function children
     */
    chi: PlainToken[];
}

/**
 * String token
 */
export declare interface StringToken extends BaseToken {
    /**
     * @inheritdoc
     */
    typ: EnumToken.StringTokenType;
    /**
     * string value
     */
    val: string;
}

/**
 * Bad string token
 */
export declare interface BadStringToken extends BaseToken {
    /**
     * @inheritdoc
     */
    typ: EnumToken.BadStringTokenType;
    /**
     * bad string value
     */
    val: string;
}

/**
 * Unclosed string token
 */
export declare interface UnclosedStringToken extends BaseToken {
    /**
     * @inheritdoc
     */
    typ: EnumToken.UnclosedStringTokenType;
    /**
     * unclosed string value
     */
    val: string;
}

/**
 * Dimension token
 */
export declare interface DimensionToken extends BaseToken {
    /**
     * @inheritdoc
     */
    typ: EnumToken.DimensionTokenType;
    /**
     * dimension value
     */
    val: number | FractionToken;
    /**
     * dimension unit
     */
    unit: string;
}

/**
 * Length token
 */
export declare interface LengthToken extends BaseToken {
    /**
     * @inheritdoc
     */
    typ: EnumToken.LengthTokenType;
    /**
     * length value
     */
    val: number | FractionToken;
    /**
     * length unit
     */
    unit: string;
}

/**
 * Angle token
 */
export declare interface AngleToken extends BaseToken {
    /**
     * @inheritdoc
     */
    typ: EnumToken.AngleTokenType;
    /**
     * angle value
     */
    val: number | FractionToken;
    /**
     * angle unit
     */
    unit: string;
}

/**
 * Time token
 */
export declare interface TimeToken extends BaseToken {
    /**
     * @inheritdoc
     */
    typ: EnumToken.TimeTokenType;
    /**
     * time value
     */
    val: number | FractionToken;
    /**
     * time unit
     */
    unit: "ms" | "s";
}

/**
 * Frequency token
 */
export declare interface FrequencyToken extends BaseToken {
    /**
     * @inheritdoc
     */
    typ: EnumToken.FrequencyTokenType;
    /**
     * frequency value
     */
    val: number | FractionToken;
    /**
     * frequency unit
     */
    unit: "Hz" | "Khz";
}

/**
 * Resolution token
 */
export declare interface ResolutionToken extends BaseToken {
    /**
     * @inheritdoc
     */
    typ: EnumToken.ResolutionTokenType;
    /**
     * resolution value
     */
    val: number | FractionToken;
    /**
     * resolution unit
     */
    unit: "dpi" | "dpcm" | "dppx" | "x";
}

/**
 * Hash token
 */
export declare interface HashToken extends BaseToken {
    /**
     * @inheritdoc
     */
    typ: EnumToken.HashTokenType;
    /**
     * hash value
     */
    val: string;
}

/**
 * Block start token
 */
export declare interface BlockStartToken extends BaseToken {
    /**
     * @inheritdoc
     */
    typ: EnumToken.BlockStartTokenType;
}

/**
 * Block end token
 */
export declare interface BlockEndToken extends BaseToken {
    /**
     * @inheritdoc
     */
    typ: EnumToken.BlockEndTokenType;
}

/**
 * Attribute start token
 */
export declare interface AttrStartToken extends BaseToken {
    /**
     * @inheritdoc
     */
    typ: EnumToken.AttrStartTokenType;
    /**
     * attribute start children
     */
    chi?: PlainToken[];
}

/**
 * Attribute end token
 */
export declare interface AttrEndToken extends BaseToken {
    /**
     * @inheritdoc
     */
    typ: EnumToken.AttrEndTokenType;
}

/**
 * Parenthesis start token
 */
export declare interface ParensStartToken extends BaseToken {
    /**
     * @inheritdoc
     */
    typ: EnumToken.StartParensTokenType;
}

/**
 * Parenthesis end token
 */
export declare interface ParensEndToken extends BaseToken {
    /**
     * @inheritdoc
     */
    typ: EnumToken.EndParensTokenType;
}

/**
 * Parenthesis token
 */
export declare interface ParensToken extends BaseToken {
    /**
     * @inheritdoc
     */
    typ: EnumToken.ParensTokenType;
    /**
     * parenthesis children
     */
    chi: PlainToken[];
}

/**
 * Whitespace token
 */
export declare interface WhitespaceToken extends BaseToken {
    /**
     * @inheritdoc
     */
    typ: EnumToken.WhitespaceTokenType;
    /**
     * whitespace value
     */
    val?: string;
}

/**
 * Comment token
 */
export declare interface CommentToken extends BaseToken {
    /**
     * @inheritdoc
     */
    typ: EnumToken.CommentTokenType;
    /**
     * comment value
     */
    val: string;
}

/**
 * Bad comment token
 */
export declare interface BadCommentToken extends BaseToken {
    /**
     * @inheritdoc
     */
    typ: EnumToken.BadCommentTokenType;
    /**
     * bad comment value
     */
    val: string;
}

/**
 * CDO comment token
 */
export declare interface CDOCommentToken extends BaseToken {
    /**
     * @inheritdoc
     */
    typ: EnumToken.CDOCOMMTokenType;
    /**
     * CDO comment value
     */
    val: string;
}

/**
 * Bad CDO comment token
 */
export declare interface BadCDOCommentToken extends BaseToken {
    /**
     * @inheritdoc
     */
    typ: EnumToken.BadCdoTokenType;
    /**
     * bad CDO comment value
     */
    val: string;
}

/**
 * Include match token
 */
export declare interface IncludeMatchToken extends BaseToken {
    /**
     * @inheritdoc
     */
    typ: EnumToken.IncludeMatchTokenType;
    // val: '~=';
}

/**
 * Dash match token
 */
export declare interface DashMatchToken extends BaseToken {
    /**
     * @inheritdoc
     */
    typ: EnumToken.DashMatchTokenType;
    // val: '|=';
}

/**
 * Equal match token
 */
export declare interface EqualMatchToken extends BaseToken {
    /**
     * @inheritdoc
     */
    typ: EnumToken.EqualMatchTokenType;
    // val: '|=';
}

/**
 * Start match token
 */
export declare interface StartMatchToken extends BaseToken {
    /**
     * @inheritdoc
     */
    typ: EnumToken.StartMatchTokenType;
    // val: '^=';
}

/**
 * End match token
 */
export declare interface EndMatchToken extends BaseToken {
    /**
     * @inheritdoc
     */
    typ: EnumToken.EndMatchTokenType;
    // val: '|=';
}

/**
 * Contain match token
 */
export declare interface ContainMatchToken extends BaseToken {
    /**
     * @inheritdoc
     */
    typ: EnumToken.ContainMatchTokenType;
    // val: '|=';
}

/**
 * Less than token
 */
export declare interface LessThanToken extends BaseToken {
    /**
     * @inheritdoc
     */
    typ: EnumToken.LtTokenType;
}

/**
 * Less than or equal token
 */
export declare interface LessThanOrEqualToken extends BaseToken {
    /**
     * @inheritdoc
     */
    typ: EnumToken.LteTokenType;
}

/**
 * Greater than token
 */
export declare interface GreaterThanToken extends BaseToken {
    /**
     * @inheritdoc
     */
    typ: EnumToken.GtTokenType;
}

/**
 * Greater than or equal token
 */
export declare interface GreaterThanOrEqualToken extends BaseToken {
    /**
     * @inheritdoc
     */
    typ: EnumToken.GteTokenType;
}

/**
 * Column combinator token
 */
export declare interface ColumnCombinatorToken extends BaseToken {
    /**
     * @inheritdoc
     */
    typ: EnumToken.ColumnCombinatorTokenType;
}

/**
 * Pseudo class token
 */
export declare interface PseudoClassToken extends BaseToken {
    /**
     * @inheritdoc
     */
    typ: EnumToken.PseudoClassTokenType;
    /**
     * Pseudo class
     */
    val: string;
}

/**
 * Pseudo element token
 */
export declare interface PseudoElementToken extends BaseToken {
    /**
     * @inheritdoc
     */
    typ: EnumToken.PseudoElementTokenType;
    /**
     * Pseudo element
     */
    val: string;
}

/**
 * Pseudo page token
 */
export declare interface PseudoPageToken extends BaseToken {
    /**
     * @inheritdoc
     */
    typ: EnumToken.PseudoPageTokenType;
    /**
     * Pseudo page
     */
    val: string;
}

/**
 * Pseudo class function token
 */
export declare interface PseudoClassFunctionToken extends BaseToken {
    /**
     * @inheritdoc
     */
    typ: EnumToken.PseudoClassFuncTokenType;
    /**
     * Pseudo class function
     */
    val: string;
    /**
     * Pseudo class function
     */
    chi: PlainToken[];
}

/**
 * Delim token
 */
export declare interface DelimToken extends BaseToken {
    /**
     * @inheritdoc
     */
    typ: EnumToken.DelimTokenType;
}

/**
 * Bad URL token
 */
export declare interface BadUrlToken extends BaseToken {
    /**
     * @inheritdoc
     */
    typ: EnumToken.BadUrlTokenType;
    /**
     * Bad URL
     */
    val: string;
}

/**
 * URL token
 */
export declare interface UrlToken extends BaseToken {
    /**
     * @inheritdoc
     */
    typ: EnumToken.UrlTokenTokenType;
    /**
     * URL token
     */
    val: string;
}

/**
 * EOF token
 */
export declare interface EOFToken extends BaseToken {
    /**
     * @inheritdoc
     */
    typ: EnumToken.EOFTokenType;
}

/**
 * Important token
 */
export declare interface ImportantToken extends BaseToken {
    /**
     * @inheritdoc
     */
    typ: EnumToken.ImportantTokenType;
}

/**
 * Color token
 */
export declare interface ColorToken extends BaseToken {
    /**
     * @inheritdoc
     */
    typ: EnumToken.ColorTokenType;
    /**
     * Color value or color function name
     */
    val: string;
    /**
     * Color kind
     */
    kin: ColorType;
    /**
     * Color components
     */
    chi?: PlainToken[];
    /**
     * Whether the color is relative, color-mix or color
     * */
    cal?: "rel" | "mix" | "col";
}

/**
 * Attribute token
 */
export declare interface AttrToken extends BaseToken {
    /**
     * @inheritdoc
     */
    typ: EnumToken.AttrTokenType;
    /**
     * Children
     */
    chi: PlainToken[];
}

/**
 * Child combinator token
 */
export declare interface ChildCombinatorToken extends BaseToken {
    /**
     * @inheritdoc
     */
    typ: EnumToken.ChildCombinatorTokenType;
}

/**
 * Media feature token
 */
export declare interface MediaFeatureToken extends BaseToken {
    /**
     * @inheritdoc
     */
    typ: EnumToken.MediaFeatureTokenType;
    /**
     * Media feature
     */
    val: string;
}

/**
 * Media feature not token
 */
export declare interface NotToken extends BaseToken {
    /**
     * @inheritdoc
     */
    typ: EnumToken.NotTokenType;
    /**
     * Media feature
     */
    val: PlainToken;
}

/**
 * Media feature only token
 */
export declare interface MediaFeatureOnlyToken extends BaseToken {
    /**
     * @inheritdoc
     */
    typ: EnumToken.OnlyTokenType;
    /**
     * Media feature
     */
    val: PlainToken;
}

/**
 * Media feature and token
 */
export declare interface AndToken extends BaseToken {
    /**
     * @inheritdoc
     */
    typ: EnumToken.AndTokenType;
}

/**
 * Media feature or token
 */
export declare interface OrToken extends BaseToken {
    /**
     * @inheritdoc
     */
    typ: EnumToken.OrTokenType;
}

/**
 * Media query condition token
 */
export declare interface MediaQueryUnaryFeatureToken extends BaseToken {
    /**
     * @inheritdoc
     */
    typ: EnumToken.MediaQueryUnaryFeatureTokenType;
    /**
     * Media feature
     */
    l: PlainToken;
    /**
     * Media feature
     */
    r: PlainToken[];
}

export declare interface SupportsQueryUnaryConditionToken extends BaseToken {
    /**
     * @inheritdoc
     */
    typ: EnumToken.SupportsQueryUnaryConditionTokenType;
    /**
     * Media feature
     */
    l: PlainToken;
    /**
     * Media feature
     */
    r: PlainToken[];
}

export declare interface SupportsQueryConditionToken extends BaseToken {
    /**
     * @inheritdoc
     */
    typ: EnumToken.SupportsQueryConditionTokenType;
    /**
     * Media feature
     */
    op: AndToken | OrToken;
    /**
     * Media feature
     */
    l: PlainToken[];
    /**
     * Media feature
     */
    r: PlainToken[];
}

export declare interface WhenElseQueryConditionToken extends BaseToken {
    /**
     * @inheritdoc
     */
    typ: EnumToken.WhenElseQueryConditionTokenType;
    /**
     * Media feature
     */
    op: AndToken | OrToken;
    /**
     * Media feature
     */
    l: PlainToken[];
    /**
     * Media feature
     */
    r: PlainToken[];
}

export declare interface WhenElseUnaryConditionToken extends BaseToken {
    /**
     * @inheritdoc
     */
    typ: EnumToken.WhenElseUnaryConditionTokenType;
    /**
     * Media feature
     */
    l: PlainToken;
    /**
     * Media feature
     */
    r: PlainToken[];
}

export declare interface MediaQueryConditionToken extends BaseToken {
    /**
     * @inheritdoc
     */
    typ: EnumToken.MediaQueryConditionTokenType;
    /**
     * Media feature
     */
    l: PlainToken[];
    /**
     * Media feature
     */
    op:
        | ColonToken
        | DelimToken
        | GreaterThanToken
        | LessThanToken
        | GreaterThanOrEqualToken
        | LessThanOrEqualToken
        | AndToken
        | OrToken;
    /**
     * Media feature
     */
    r: PlainToken[];
}

export declare interface IfConditionToken extends BaseToken {
    /**
     * @inheritdoc
     */
    typ: EnumToken.IfConditionTokenType;
    /**
     * condition left handle
     */
    l: PlainToken[];
    /**
     * condition value
     */
    r: PlainToken[];
}

export declare interface IfElseConditionToken extends BaseToken {
    /**
     * @inheritdoc
     */
    typ: EnumToken.IfElseConditionTokenType;
    /**
     * condition left handle
     */
    l: IfConditionToken;
    /**
     * condition value
     */
    r: IfConditionToken;
}

export declare interface ContainerStyleRangeToken extends BaseToken {
    /**
     * @inheritdoc
     */
    typ: EnumToken.ContainerStyleRangeTokenType;
    /**
     * condition left handle
     */
    l: PlainToken[];
    /**
     * condition operator
     */
    op: PlainToken[];
    /**
     * condition value
     */
    r: PlainToken[];
}

// (20px <= width < 30px)
/**
 * @inheritdoc
 */
export declare interface MediaRangeQueryToken extends BaseToken {
    /**
     * @inheritdoc
     */
    typ: EnumToken.MediaRangeQueryTokenType;
    /**
     * left hanle
     * */
    l: PlainToken[];
    /**
     * media feature name
     */
    val: PlainToken[];
    /**
     * first comparator
     */
    op1: LessThanToken | GreaterThanToken | LessThanOrEqualToken | GreaterThanOrEqualToken;
    /**
     * second comparator
     */
    op2: LessThanToken | GreaterThanToken | LessThanOrEqualToken | GreaterThanOrEqualToken;
    /**
     * right handle
     */
    r: PlainToken[];
}

/**
 * Descendant combinator token
 */
export declare interface DescendantCombinatorToken extends BaseToken {
    /**
     * @inheritdoc
     */
    typ: EnumToken.DescendantCombinatorTokenType;
}

/**
 * Next sibling combinator token
 */
export declare interface NextSiblingCombinatorToken extends BaseToken {
    /**
     * @inheritdoc
     */
    typ: EnumToken.NextSiblingCombinatorTokenType;
}

/**
 * Subsequent sibling combinator token
 */
export declare interface SubsequentCombinatorToken extends BaseToken {
    /**
     * @inheritdoc
     */
    typ: EnumToken.SubsequentSiblingCombinatorTokenType;
}

/**
 * Add token
 */
export declare interface AddToken extends BaseToken {
    /**
     * @inheritdoc
     */
    typ: EnumToken.Add;
}

/**
 * Sub token
 */
export declare interface SubToken extends BaseToken {
    /**
     * @inheritdoc
     */
    typ: EnumToken.Sub;
}

/**
 * Div token
 */
export declare interface DivToken extends BaseToken {
    /**
     * @inheritdoc
     */
    typ: EnumToken.Div;
}

/**
 * Mul token
 */
export declare interface MulToken extends BaseToken {
    /**
     * @inheritdoc
     */
    typ: EnumToken.Mul;
}

/**
 * Wrapped values token like {Arial, Helvetica, sans-serif}
 */
export declare interface WrappedValuesToken extends BaseToken {
    /**
     * @inheritdoc
     */
    typ: EnumToken.WrappedValuesTokenType;
    /**
     * Children
     */
    chi: PlainToken[];
}

/**
 * Unary expression token
 */
export declare interface UnaryExpression extends BaseToken {
    /**
     * @inheritdoc
     */
    typ: EnumToken.UnaryExpressionTokenType;
    /**
     * Sign
     */
    sign: EnumToken.Add | EnumToken.Sub;
    /**
     * Value
     */
    val: UnaryExpressionNode;
}

/**
 * Fraction token
 */
export declare interface FractionToken extends BaseToken {
    /**
     * @inheritdoc
     */
    typ: EnumToken.FractionTokenType;
    /**
     * Left handle
     */
    l: NumberToken;
    /**
     * Right handle
     */
    r: NumberToken;
}

/**
 * Binary expression token
 */
export declare interface BinaryExpressionToken extends BaseToken {
    /**
     * @inheritdoc
     */
    typ: EnumToken.BinaryExpressionTokenType;
    /**
     * Operator
     */
    op: EnumToken.Add | EnumToken.Sub | EnumToken.Div | EnumToken.Mul;
    /**
     * Left handle
     */
    l: BinaryExpressionNode | PlainToken;
    /**
     * Right handle
     */
    r: BinaryExpressionNode | PlainToken;
}

/**
 * Match expression token
 */
export declare interface MatchExpressionToken extends BaseToken {
    /**
     * @inheritdoc
     */
    typ: EnumToken.MatchExpressionTokenType;
    /**
     * Operator
     */
    op: EqualMatchToken | DashMatchToken | StartMatchToken | ContainMatchToken | EndMatchToken | IncludeMatchToken;
    /**
     * Left handle
     */
    l: PlainToken;
    /**
     * Right handle
     */
    r: PlainToken;
    /**
     * Flags
     */
    attr?: "i" | "s";
}

/**
 * Name space attribute token
 */
export declare interface NameSpaceAttributeToken extends BaseToken {
    /**
     * @inheritdoc
     */
    typ: EnumToken.NameSpaceAttributeTokenType;
    /**
     * Left handle
     */
    l?: PlainToken;
    /**
     * Right handle
     */
    r: PlainToken;
}

/**
 * List token
 */
export declare interface ListToken extends BaseToken {
    /**
     * @inheritdoc
     */
    typ: EnumToken.ListToken;
    /**
     * Children
     */
    chi: PlainToken[];
}

/**
 * Composes selector token
 */
export declare interface ComposesSelectorToken extends BaseToken {
    /**
     * @inheritdoc
     */
    typ: EnumToken.ComposesSelectorTokenType;

    /**
     * Left handle
     */
    l: PlainToken[];
    /**
     * Right handle
     */
    r: PlainToken | null;
}

/**
 * Css variable token
 */
export declare interface CssVariableToken extends BaseToken {
    /**
     * @inheritdoc
     */
    typ: EnumToken.CssVariableTokenType;
    /**
     * Name
     */
    nam: string;
    /**
     * Value tokens allocated in the arena of the parse result
     */
    val: Token[];
}

/**
 * Css variable import token
 */
export declare interface CssVariableImportTokenType extends BaseToken {
    /**
     * @inheritdoc
     */
    typ: EnumToken.CssVariableImportTokenType;
    /**
     * Name
     */
    nam: string;
    /**
     * Value
     */
    val: PlainToken[];
}

/**
 * Css variable map token
 */
export declare interface CssVariableMapTokenType extends BaseToken {
    /**
     * @inheritdoc
     */
    typ: EnumToken.CssVariableDeclarationMapTokenType;
    /**
     * CSS Variables
     */
    vars: PlainToken[];
    /**
     * From clause
     */
    from: PlainToken[];
}

/**
 * Function definition token
 */
export declare interface FunctionDefToken extends BaseToken {
    /**
     * @inheritdoc
     */
    typ:
        | EnumToken.FunctionDefTokenType
        | EnumToken.UrlFunctionTokenDefType
        | EnumToken.GridTemplateFuncTokenDefType
        | EnumToken.ImageFunctionTokenDefType
        | EnumToken.TimelineFunctionTokenDefType
        | EnumToken.TimingFunctionTokenDefType
        | EnumToken.ColorFunctionTokenDefType
        | EnumToken.MathFunctionTokenDefType
        | EnumToken.PseudoClassFunctionTokenDefType
        | EnumToken.TransformFunctionTokenDefType;
    /**
     * Name
     */
    nam: string;
    /**
     * Value
     */
    val: string;
}

/**
 * Raw node token
 */
export declare interface RawNodeToken extends BaseToken, EnumAstNodeStatus {
    /**
     * @inheritdoc
     */
    typ: EnumToken.RawNodeTokenType;
    /**
     * Value
     */
    val: PlainToken[];
}

/**
 * Unary expression node
 */
export declare type UnaryExpressionNode =
    | BinaryExpressionNode
    | NumberToken
    | DimensionToken
    | TimeToken
    | LengthToken
    | AngleToken
    | FrequencyToken;

/**
 * Binary expression node
 */
export declare type BinaryExpressionNode =
    | NumberToken
    | DimensionToken
    | PercentageToken
    | FlexToken
    | FractionToken
    | AngleToken
    | LengthToken
    | FrequencyToken
    | BinaryExpressionToken
    | FunctionToken
    | ParensToken;

/**
 * declaration token. a declaration used as a token, ie in an at-rule prelude: `@supports (color: red)`
 */
export declare interface DeclarationToken extends BaseToken {
    /**
     * token type
     */
    typ: EnumToken.DeclarationNodeType;
    /**
     * declaration name
     */
    nam: string;
    /**
     * declaration value
     */
    val: PlainToken[];
}

/**
 * Value tokens are integer ids of records stored in an {@link AstArena}.
 *
 * - `arena.getType(token)` is the token type ({@link EnumToken}),
 * - `arena.getValue(token)` is the string value (`val`),
 * - `arena.getNumericValue(token)` is the numeric value (`val`) of numbers, dimensions and percentages,
 * - `arena.getUnit(token)` is the unit,
 * - `arena.getColorType(token)` is the color kind (`kin`),
 * - `arena.tokens(token)` are the children (`chi`),
 * - `arena.fieldTokens(token, TokenField.L)` ... are the structured fields (`l`, `r`, `op`, ...).
 */
export declare type Token = number;

/**
 * Plain object representation of a token (`arena.toPlainObject()` / `arena.fromObject()`). `arena.toObject()` returns
 * an {@link AstArenaNode} view with the same properties
 */
export declare type PlainToken =
    | LiteralToken
    | IdentToken
    | IdentListToken
    | DashedIdentToken
    | WrappedValuesToken
    | CommaToken
    | ColonToken
    | DoubleColonToken
    | SemiColonToken
    | ClassSelectorToken
    | UniversalSelectorToken
    | ChildCombinatorToken
    | DescendantCombinatorToken
    | NextSiblingCombinatorToken
    | SubsequentCombinatorToken
    | ColumnCombinatorToken
    | NestingSelectorToken
    | WhenElseUnaryConditionToken
    | WhenElseQueryConditionToken
    | SupportsQueryUnaryConditionToken
    | SupportsQueryConditionToken
    | MediaQueryConditionToken
    | MediaFeatureToken
    | MediaQueryUnaryFeatureToken
    | IfConditionToken
    | IfElseConditionToken
    | NotToken
    | MediaFeatureOnlyToken
    | AndToken
    | OrToken
    | MediaRangeQueryToken
    | ContainerStyleRangeToken
    | DeclarationToken
    | NumberToken
    | AtRuleToken
    | PercentageToken
    | FlexToken
    | FunctionURLToken
    | FunctionImageToken
    | TimingFunctionToken
    | TimelineFunctionToken
    | FunctionToken
    | GridTemplateFuncToken
    | DimensionToken
    | LengthToken
    | AngleToken
    | StringToken
    | TimeToken
    | FrequencyToken
    | ResolutionToken
    | UnclosedStringToken
    | HashToken
    | BadStringToken
    | BlockStartToken
    | BlockEndToken
    | AttrStartToken
    | AttrEndToken
    | ParensStartToken
    | ParensEndToken
    | ParensToken
    | CDOCommentToken
    | BadCDOCommentToken
    | CommentToken
    | BadCommentToken
    | WhitespaceToken
    | IncludeMatchToken
    | StartMatchToken
    | EndMatchToken
    | ContainMatchToken
    | MatchExpressionToken
    | NameSpaceAttributeToken
    | ComposesSelectorToken
    | CssVariableToken
    | DashMatchToken
    | EqualMatchToken
    | LessThanToken
    | LessThanOrEqualToken
    | GreaterThanToken
    | GreaterThanOrEqualToken
    | ListToken
    | PseudoClassToken
    | PseudoPageToken
    | PseudoElementToken
    | PseudoClassFunctionToken
    | DelimToken
    | BinaryExpressionToken
    | UnaryExpression
    | FractionToken
    | AddToken
    | SubToken
    | DivToken
    | MulToken
    | BadUrlToken
    | UrlToken
    | ImportantToken
    | ColorToken
    | AttrToken
    | FunctionDefToken
    | RawNodeToken
    | NaNToken
    | InfinityToken
    | NegativeInfinityToken
    | CssTypeTokenType
    | EOFToken;
