/**
 * Literal token
 */
export declare interface LiteralToken extends BaseToken {
    /**
     * literal type
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
     * class selector type
     */
    typ: EnumToken.ClassSelectorTokenType;
    /**
     * class name
     */
    val: string;
}

/**
 * Invalid class selector token
 */
export declare interface InvalidClassSelectorToken extends BaseToken {
    /**
     * invalid class selector type
     */
    typ: EnumToken.InvalidClassSelectorTokenType;
    /**
     * invalid class name
     */
    val: string;
}

/**
 * Universal selector token
 */
export declare interface UniversalSelectorToken extends BaseToken {
    /**
     * universal selector type
     */
    typ: EnumToken.UniversalSelectorTokenType;
}

/**
 * Ident token
 */
export declare interface IdentToken extends BaseToken {
    /**
     * ident type
     */
    typ: EnumToken.IdenTokenType;
    /**
     * ident value
     */
    val: string;
}

/**
 * Ident list token
 */
export declare interface IdentListToken extends BaseToken {
    /**
     * ident list type
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
     * ident type
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
     * comma type
     */
    typ: EnumToken.CommaTokenType;
}

/**
 * Colon token
 */
export declare interface ColonToken extends BaseToken {
    /**
     * colon type ':'
     */
    typ: EnumToken.ColonTokenType;
}

/**
 * Double colon token
 */
export declare interface DoubleColonToken extends BaseToken {
    /**
     * double colon type '::'
     */
    typ: EnumToken.DoubleColonTokenType;
}

/**
 * Semicolon token
 */
export declare interface SemiColonToken extends BaseToken {
    /**
     * semicolon type
     */
    typ: EnumToken.SemiColonTokenType;
}

/**
 * Nesting selector token
 */
export declare interface NestingSelectorToken extends BaseToken {
    /**
     * nesting selector type
     */
    typ: EnumToken.NestingSelectorTokenType;
}

/**
 * Number token
 */
export declare interface NumberToken extends BaseToken {
    /**
     * number type
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

/**
 * At rule token
 */
export declare interface AtRuleToken extends BaseToken {
    /**
     * at rule type
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
     * percentage type
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
     * flex type
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
        | EnumToken.ColorFunctionTokenType
        | EnumToken.MathFunctionTokenType
        | EnumToken.PseudoClassFunctionTokenType
        | EnumToken.TransformFunctionTokenType;
    val: string;
    /**
     * function children
     */
    chi: Token$1[];
}

/**
 * Grid template function token
 */
export declare interface GridTemplateFuncToken extends BaseToken {
    /**
     * function type
     */
    typ: EnumToken.GridTemplateFuncTokenType;
    /**
     * function name
     */
    val: string;
    /**
     * function children
     */
    chi: Token$1[];
}

/**
 * Function URL token
 */
export declare interface FunctionURLToken extends BaseToken {
    /**
     * function type
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
     * function type
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
    typ: EnumToken.TimingFunctionTokenType;
    val: string;
    chi: Token$1[];
}

/**
 * Timeline function token
 */
export declare interface TimelineFunctionToken extends BaseToken {
    typ: EnumToken.TimelineFunctionTokenType;
    val: string;
    chi: Token$1[];
}

/**
 * String token
 */
export declare interface StringToken extends BaseToken {
    typ: EnumToken.StringTokenType;
    val: string;
}

/**
 * Bad string token
 */
export declare interface BadStringToken extends BaseToken {
    typ: EnumToken.BadStringTokenType;
    val: string;
}

/**
 * Unclosed string token
 */
export declare interface UnclosedStringToken extends BaseToken {
    typ: EnumToken.UnclosedStringTokenType;
    val: string;
}

/**
 * Dimension token
 */
export declare interface DimensionToken extends BaseToken {
    typ: EnumToken.DimensionTokenType;
    val: number | FractionToken;
    unit: string;
}

/**
 * Length token
 */
export declare interface LengthToken extends BaseToken {
    typ: EnumToken.LengthTokenType;
    val: number | FractionToken;
    unit: string;
}

/**
 * Angle token
 */
export declare interface AngleToken extends BaseToken {
    typ: EnumToken.AngleTokenType;
    val: number | FractionToken;
    unit: string;
}

/**
 * Time token
 */
export declare interface TimeToken extends BaseToken {
    typ: EnumToken.TimeTokenType;
    val: number | FractionToken;
    unit: "ms" | "s";
}

/**
 * Frequency token
 */
export declare interface FrequencyToken extends BaseToken {
    typ: EnumToken.FrequencyTokenType;
    val: number | FractionToken;
    unit: "Hz" | "Khz";
}

/**
 * Resolution token
 */
export declare interface ResolutionToken extends BaseToken {
    typ: EnumToken.ResolutionTokenType;
    val: number | FractionToken;
    unit: "dpi" | "dpcm" | "dppx" | "x";
}

/**
 * Hash token
 */
export declare interface HashToken extends BaseToken {
    typ: EnumToken.HashTokenType;
    val: string;
}

/**
 * Block start token
 */
export declare interface BlockStartToken extends BaseToken {
    typ: EnumToken.BlockStartTokenType;
}

/**
 * Block end token
 */
export declare interface BlockEndToken extends BaseToken {
    typ: EnumToken.BlockEndTokenType;
}

/**
 * Attribute start token
 */
export declare interface AttrStartToken extends BaseToken {
    typ: EnumToken.AttrStartTokenType;
    chi?: Token$1[];
}

/**
 * Attribute end token
 */
export declare interface AttrEndToken extends BaseToken {
    typ: EnumToken.AttrEndTokenType;
}

/**
 * Parenthesis start token
 */
export declare interface ParensStartToken extends BaseToken {
    typ: EnumToken.StartParensTokenType;
}

/**
 * Parenthesis end token
 */
export declare interface ParensEndToken extends BaseToken {
    typ: EnumToken.EndParensTokenType;
}

/**
 * Parenthesis token
 */
export declare interface ParensToken extends BaseToken {
    typ: EnumToken.ParensTokenType;
    chi: Token$1[];
}

/**
 * Whitespace token
 */
export declare interface WhitespaceToken extends BaseToken {
    typ: EnumToken.WhitespaceTokenType;
    val?: string;
}

/**
 * Comment token
 */
export declare interface CommentToken extends BaseToken {
    typ: EnumToken.CommentTokenType;
    val: string;
}

/**
 * Bad comment token
 */
export declare interface BadCommentToken extends BaseToken {
    typ: EnumToken.BadCommentTokenType;
    val: string;
}

/**
 * CDO comment token
 */
export declare interface CDOCommentToken extends BaseToken {
    typ: EnumToken.CDOCOMMTokenType;
    val: string;
}

/**
 * Bad CDO comment token
 */
export declare interface BadCDOCommentToken extends BaseToken {
    typ: EnumToken.BadCdoTokenType;
    val: string;
}

/**
 * Include match token
 */
export declare interface IncludeMatchToken extends BaseToken {
    typ: EnumToken.IncludeMatchTokenType;
    // val: '~=';
}

/**
 * Dash match token
 */
export declare interface DashMatchToken extends BaseToken {
    typ: EnumToken.DashMatchTokenType;
    // val: '|=';
}

/**
 * Equal match token
 */
export declare interface EqualMatchToken extends BaseToken {
    typ: EnumToken.EqualMatchTokenType;
    // val: '|=';
}

/**
 * Start match token
 */
export declare interface StartMatchToken extends BaseToken {
    typ: EnumToken.StartMatchTokenType;
    // val: '^=';
}

/**
 * End match token
 */
export declare interface EndMatchToken extends BaseToken {
    typ: EnumToken.EndMatchTokenType;
    // val: '|=';
}

/**
 * Contain match token
 */
export declare interface ContainMatchToken extends BaseToken {
    typ: EnumToken.ContainMatchTokenType;
    // val: '|=';
}

/**
 * Less than token
 */
export declare interface LessThanToken extends BaseToken {
    typ: EnumToken.LtTokenType;
}

/**
 * Less than or equal token
 */
export declare interface LessThanOrEqualToken extends BaseToken {
    typ: EnumToken.LteTokenType;
}

/**
 * Greater than token
 */
export declare interface GreaterThanToken extends BaseToken {
    typ: EnumToken.GtTokenType;
}

/**
 * Greater than or equal token
 */
export declare interface GreaterThanOrEqualToken extends BaseToken {
    typ: EnumToken.GteTokenType;
}

/**
 * Column combinator token
 */
export declare interface ColumnCombinatorToken extends BaseToken {
    typ: EnumToken.ColumnCombinatorTokenType;
}

/**
 * Pseudo class token
 */
export declare interface PseudoClassToken extends BaseToken {
    typ: EnumToken.PseudoClassTokenType;
    val: string;
}

/**
 * Pseudo element token
 */
export declare interface PseudoElementToken extends BaseToken {
    /**
     * Pseudo element
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
     * Pseudo page
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
     * Pseudo class function
     */
    typ: EnumToken.PseudoClassFuncTokenType;
    /**
     * Pseudo class function
     */
    val: string;
    /**
     * Pseudo class function
     */
    chi: Token$1[];
}

/**
 * Delim token
 */
export declare interface DelimToken extends BaseToken {
    /**
     * Delimiter token type
     */
    typ: EnumToken.DelimTokenType;
}

/**
 * Bad URL token
 */
export declare interface BadUrlToken extends BaseToken {
    /**
     * Bad URL
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
     * URL
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
     * End of file
     */
    typ: EnumToken.EOFTokenType;
}

/**
 * Important token
 */
export declare interface ImportantToken extends BaseToken {
    /**
     * Important
     */
    typ: EnumToken.ImportantTokenType;
}

/**
 * Color token
 */
export declare interface ColorToken extends BaseToken {
    /**
     * Color type
     */
    typ: EnumToken.ColorTokenType;
    /**
     * Color value or color function name
     */
    val: string;
    /**
     * Color kind
     */
    kin: ColorType$1;
    /**
     * Color components
     */
    chi?: Token$1[];
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
     * Attribute type
     */
    typ: EnumToken.AttrTokenType;
    /**
     * Children
     */
    chi: Token$1[];
}

/**
 * Invalid attribute token
 */
export declare interface InvalidAttrToken extends BaseToken {
    /**
     * Attribute type
     */
    typ: EnumToken.InvalidAttrTokenType;
    /**
     * Children
     */
    chi: Token$1[];
}

/**
 * Child combinator token
 */
export declare interface ChildCombinatorToken extends BaseToken {
    typ: EnumToken.ChildCombinatorTokenType;
}

/**
 * Media feature token
 */
export declare interface MediaFeatureToken extends BaseToken {
    typ: EnumToken.MediaFeatureTokenType;
    val: string;
}

/**
 * Media feature not token
 */
export declare interface NotToken extends BaseToken {
    typ: EnumToken.NotTokenType;
    val: Token$1;
}

/**
 * Media feature only token
 */
export declare interface MediaFeatureOnlyToken extends BaseToken {
    typ: EnumToken.OnlyTokenType;
    val: Token$1;
}

/**
 * Media feature and token
 */
export declare interface AndToken extends BaseToken {
    typ: EnumToken.AndTokenType;
}

/**
 * Media feature or token
 */
export declare interface OrToken extends BaseToken {
    typ: EnumToken.OrTokenType;
}

/**
 * Media query condition token
 */
export declare interface MediaQueryUnaryFeatureToken extends BaseToken {
    typ: EnumToken.MediaQueryUnaryFeatureTokenType;
    l: Token$1;
    r: Token$1[];
}

export declare interface SupportsQueryUnaryConditionToken extends BaseToken {
    typ: EnumToken.SupportsQueryUnaryConditionTokenType;
    l: Token$1;
    r: Token$1[];
}

export declare interface SupportsQueryConditionToken extends BaseToken {
    typ: EnumToken.SupportsQueryConditionTokenType;
    op: AndToken | OrToken;
    l: Token$1[];
    r: Token$1[];
}

export declare interface WhenElseQueryConditionToken extends BaseToken {
    typ: EnumToken.WhenElseQueryConditionTokenType;
    op: AndToken | OrToken;
    l: Token$1[];
    r: Token$1[];
}

export declare interface WhenElseUnaryConditionToken extends BaseToken {
    typ: EnumToken.WhenElseUnaryConditionTokenType;
    l: Token$1;
    r: Token$1[];
}

export declare interface MediaQueryConditionToken extends BaseToken {
    typ: EnumToken.MediaQueryConditionTokenType;
    l: Token$1[];
    op:
        | ColonToken
        | DelimToken
        | GreaterThanToken
        | LessThanToken
        | GreaterThanOrEqualToken
        | LessThanOrEqualToken
        | AndToken
        | OrToken;
    r: Token$1[];
}

export declare interface IfConditionToken extends BaseToken {
    typ: EnumToken.IfConditionTokenType;
    l: Token$1[];
    r: Token$1[];
}

export declare interface IfElseConditionToken extends BaseToken {
    typ: EnumToken.IfElseConditionTokenType;
    l: IfConditionToken;
    r: IfConditionToken;
}

export declare interface ContainerStyleRangeToken extends BaseToken {
    typ: EnumToken.ContainerStyleRangeTokenType;
    l: Token$1[];
    op: Token$1[];
    r: Token$1[];
}

export declare interface MediaRangeQueryToken extends BaseToken {
    typ: EnumToken.MediaRangeQueryTokenType;
    l: Token$1[];
    val: Token$1[];
    op1: LessThanToken | GreaterThanToken | LessThanOrEqualToken | GreaterThanOrEqualToken;
    op2: LessThanToken | GreaterThanToken | LessThanOrEqualToken | GreaterThanOrEqualToken;
    r: Token$1[];
}

export declare interface InvalidMediaQueryToken extends BaseToken {
    typ: EnumToken.InvalidMediaQueryTokenType;
    chi: Token$1[];
}

/**
 * Descendant combinator token
 */
export declare interface DescendantCombinatorToken extends BaseToken {
    typ: EnumToken.DescendantCombinatorTokenType;
}

/**
 * Next sibling combinator token
 */
export declare interface NextSiblingCombinatorToken extends BaseToken {
    typ: EnumToken.NextSiblingCombinatorTokenType;
}

/**
 * Subsequent sibling combinator token
 */
export declare interface SubsequentCombinatorToken extends BaseToken {
    typ: EnumToken.SubsequentSiblingCombinatorTokenType;
}

/**
 * Add token
 */
export declare interface AddToken extends BaseToken {
    typ: EnumToken.Add;
}

/**
 * Sub token
 */
export declare interface SubToken extends BaseToken {
    typ: EnumToken.Sub;
}

/**
 * Div token
 */
export declare interface DivToken extends BaseToken {
    typ: EnumToken.Div;
}

/**
 * Mul token
 */
export declare interface MulToken extends BaseToken {
    typ: EnumToken.Mul;
}

/**
 * Wrapped values token like {Arial, Helvetica, sans-serif}
 */
export declare interface WrappedValuesToken extends BaseToken {
    typ: EnumToken.WrappedValuesTokenType;
    chi: Token$1[];
}

/**
 * Unary expression token
 */
export declare interface UnaryExpression extends BaseToken {
    typ: EnumToken.UnaryExpressionTokenType;
    sign: EnumToken.Add | EnumToken.Sub;
    val: UnaryExpressionNode;
}

/**
 * Fraction token
 */
export declare interface FractionToken extends BaseToken {
    typ: EnumToken.FractionTokenType;
    l: NumberToken;
    r: NumberToken;
}

/**
 * Binary expression token
 */
export declare interface BinaryExpressionToken extends BaseToken {
    typ: EnumToken.BinaryExpressionTokenType;
    op: EnumToken.Add | EnumToken.Sub | EnumToken.Div | EnumToken.Mul;
    l: BinaryExpressionNode | Token$1;
    r: BinaryExpressionNode | Token$1;
}

/**
 * Match expression token
 */
export declare interface MatchExpressionToken extends BaseToken {
    typ: EnumToken.MatchExpressionTokenType;
    op: EqualMatchToken | DashMatchToken | StartMatchToken | ContainMatchToken | EndMatchToken | IncludeMatchToken;
    l: Token$1;
    r: Token$1;
    attr?: "i" | "s";
}

/**
 * Name space attribute token
 */
export declare interface NameSpaceAttributeToken extends BaseToken {
    typ: EnumToken.NameSpaceAttributeTokenType;
    l?: Token$1;
    r: Token$1;
}

/**
 * List token
 */
export declare interface ListToken extends BaseToken {
    typ: EnumToken.ListToken;
    chi: Token$1[];
}

/**
 * Composes selector token
 */
export declare interface ComposesSelectorToken extends BaseToken {
    typ: EnumToken.ComposesSelectorTokenType;
    l: Token$1[];
    r: Token$1 | null;
}

/**
 * Css variable token
 */
export declare interface CssVariableToken$1 extends BaseToken {
    typ: EnumToken.CssVariableTokenType;
    nam: string;
    val: Token$1[];
}

export declare interface CssVariableImportTokenType$1 extends BaseToken {
    typ: EnumToken.CssVariableImportTokenType;
    nam: string;
    val: Token$1[];
}

export declare interface CssVariableMapTokenType extends BaseToken {
    typ: EnumToken.CssVariableDeclarationMapTokenType;
    vars: Token$1[];
    from: Token$1[];
}

/**
 * Function definition token
 */
export declare interface FunctionDefToken extends BaseToken {
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
    nam: string;
    val: string;
}

/**
 * Raw node token
 */
export declare interface RawNodeToken extends BaseToken, EnumAstNodeStatus$1 {
    typ: EnumToken.RawNodeTokenType;
    val: Token$1[];
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
 * Token
 */
export declare type Token$1 =
    | InvalidClassSelectorToken
    | InvalidAttrToken
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
    | AstDeclaration
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
    | CssVariableToken$1
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
    | InvalidMediaQueryToken
    | EOFToken;

/**
 * Syntax validation enum
 */
declare enum SyntaxValidationResult {
    /** valid syntax */
    Valid = 0,
    /** drop invalid syntax */
    Drop = 1,
    /** preserve unknown at-rules, declarations and pseudo-classes */
    Lenient = 2
}
/**
 * Enum of node statuses
 */
declare enum EnumAstNodeStatus$1 {
    /**
     * Node passed validation
     */
    Validated = 0,
    /**
     * Node is invalid
     */
    Invalid = 1,
    /**
     * node is not validated
     */
    Unvalidated = 2,
    /**
     * Node did not pass validation, but is preserved.
     */
    ValidationFailed = 3,
    /**
     * Parsing the node is not supported yet or the node syntax definition does not exist.
     */
    Unknown = 4,
    /**
     * Failed to parse the node.
     */
    Unparsed = 5,
    /**
     * Node is disallowed in the context
     */
    Disallowed = 6,
    /**
     * Node is malformed
     */
    Malformed = 7
}
/**
 * Enum of validation levels
 * @deprecated
 */
declare enum ValidationLevel {
    /**
     * disable validation
     */
    None = 0,
    /**
     * validate selectors
     */
    Selector = 1,
    /**
     * validate at-rules
     */
    AtRule = 2,
    /**
     * validate declarations
     */
    Declaration = 4,
    /**
     * validate selectors and at-rules
     */
    Default = 3,// selectors + at-rules
    /**
     * validate selectors, at-rules and declarations
     */
    All = 7,// selectors + at-rules + declarations
    /**
     * Report only. Apply validation and report nodes that are marked as invalid
     */
    ReportOnly = 8
}
/**
 * Enum of all token types
 */
declare enum EnumToken {
    /**
     * comment token
     */
    CommentTokenType = 0,
    /**
     * cdata section token
     */
    CDOCOMMTokenType = 1,
    /**
     * style sheet node type
     */
    StyleSheetNodeType = 2,
    /**
     * at-rule node type
     */
    AtRuleNodeType = 3,
    /**
     * rule node type
     */
    RuleNodeType = 4,
    /**
     * declaration node type
     */
    DeclarationNodeType = 5,
    /**
     * literal token type
     */
    LiteralTokenType = 6,
    /**
     * identifier token type
     */
    IdenTokenType = 7,
    /**
     * dashed identifier token type
     */
    DashedIdenTokenType = 8,
    /**
     * comma token type
     */
    CommaTokenType = 9,
    /**
     * colon token type
     */
    ColonTokenType = 10,
    /**
     * semicolon token type
     */
    SemiColonTokenType = 11,
    /**
     * number token type
     */
    NumberTokenType = 12,
    /**
     * at-rule token type
     */
    AtRuleTokenType = 13,
    /**
     * percentage token type
     */
    PercentageTokenType = 14,
    /**
     * function token type
     */
    FunctionTokenType = 15,
    /**
     * timeline function token type
     */
    TimelineFunctionTokenType = 16,
    /**
     * timing function token type
     */
    TimingFunctionTokenType = 17,
    /**
     * url function token type
     */
    UrlFunctionTokenType = 18,
    /**
     * image function token type
     */
    ImageFunctionTokenType = 19,
    /**
     * string token type
     */
    StringTokenType = 20,
    /**
     * unclosed string token type
     */
    UnclosedStringTokenType = 21,
    /**
     * dimension token type
     */
    DimensionTokenType = 22,
    /**
     * length token type
     */
    LengthTokenType = 23,
    /**
     * angle token type
     */
    AngleTokenType = 24,
    /**
     * time token type
     */
    TimeTokenType = 25,
    /**
     * frequency token type
     */
    FrequencyTokenType = 26,
    /**
     * resolution token type
     */
    ResolutionTokenType = 27,
    /**
     * hash token type
     */
    HashTokenType = 28,
    /**
     * block start token type
     */
    BlockStartTokenType = 29,
    /**
     * block end token type
     */
    BlockEndTokenType = 30,
    /**
     * attribute start token type
     */
    AttrStartTokenType = 31,
    /**
     * attribute end token type
     */
    AttrEndTokenType = 32,
    /**
     * start parentheses token type
     */
    StartParensTokenType = 33,
    /**
     * end parentheses token type
     */
    EndParensTokenType = 34,
    /**
     * parentheses token type
     */
    ParensTokenType = 35,
    /**
     * whitespace token type
     */
    WhitespaceTokenType = 36,
    /**
     * include match token type
     */
    IncludeMatchTokenType = 37,
    /**
     * dash match token type
     */
    DashMatchTokenType = 38,
    /**
     * equal match token type
     */
    EqualMatchTokenType = 39,
    /**
     * less than token type
     */
    LtTokenType = 40,
    /**
     * less than or equal to token type
     */
    LteTokenType = 41,
    /**
     * greater than token type
     */
    GtTokenType = 42,
    /**
     * greater than or equal to token type
     */
    GteTokenType = 43,
    /**
     * pseudo-class token type
     */
    PseudoClassTokenType = 44,
    /**
     * pseudo-class function token type
     */
    PseudoClassFuncTokenType = 45,
    /**
     * delimiter token type
     */
    DelimTokenType = 46,
    /**
     * URL token type
     */
    UrlTokenTokenType = 47,
    /**
     * end of file token type
     */
    EOFTokenType = 48,
    /**
     * important token type
     */
    ImportantTokenType = 49,
    /**
     * color token type
     */
    ColorTokenType = 50,
    /**
     * attribute token type
     */
    AttrTokenType = 51,
    /**
     * bad comment token type
     */
    BadCommentTokenType = 52,
    /**
     * bad cdo token type
     */
    BadCdoTokenType = 53,
    /**
     * bad URL token type
     */
    BadUrlTokenType = 54,
    /**
     * bad string token type
     */
    BadStringTokenType = 55,
    /**
     * binary expression token type
     */
    BinaryExpressionTokenType = 56,
    /**
     * unary expression token type
     */
    UnaryExpressionTokenType = 57,
    /**
     * flex token type
     */
    FlexTokenType = 58,
    /**
     *  token list token type
     */
    ListToken = 59,
    /**
     * addition token type
     */
    Add = 60,
    /**
     * multiplication token type
     */
    Mul = 61,
    /**
     * division token type
     */
    Div = 62,
    /**
     * subtraction token type
     */
    Sub = 63,
    /**
     * column combinator token type
     */
    ColumnCombinatorTokenType = 64,
    /**
     * contain match token type
     */
    ContainMatchTokenType = 65,
    /**
     * start match token type
     */
    StartMatchTokenType = 66,
    /**
     * end match token type
     */
    EndMatchTokenType = 67,
    /**
     * match expression token type
     */
    MatchExpressionTokenType = 68,
    /**
     * namespace attribute token type
     */
    NameSpaceAttributeTokenType = 69,
    /**
     * fraction token type
     */
    FractionTokenType = 70,
    /**
     * identifier list token type
     */
    IdenListTokenType = 71,
    /**
     * grid template function token type
     */
    GridTemplateFuncTokenType = 72,
    /**
     * keyframe rule node type
     */
    KeyFramesRuleNodeType = 73,
    /**
     * class selector token type
     */
    ClassSelectorTokenType = 74,
    /**
     * universal selector token type
     */
    UniversalSelectorTokenType = 75,
    /**
     * child combinator token type
     */
    ChildCombinatorTokenType = 76,// >
    /**
     * descendant combinator token type
     */
    DescendantCombinatorTokenType = 77,// whitespace
    /**
     * next sibling combinator token type
     */
    NextSiblingCombinatorTokenType = 78,// +
    /**
     * subsequent sibling combinator token type
     */
    SubsequentSiblingCombinatorTokenType = 79,// ~
    /**
     * nesting selector token type
     */
    NestingSelectorTokenType = 80,// &
    /**
     * Invalid rule token type
     * @deprecated
     */
    InvalidRuleNodeType = 81,
    /**
     * invalid class selector token type
     */
    InvalidClassSelectorTokenType = 82,
    /**
     * invalid attribute token type
     */
    InvalidAttrTokenType = 83,
    /**
     * Invalid at rule token type
     * @deprecated
     */
    InvalidAtRuleNodeType = 84,
    /**
     * media query condition token type
     */
    MediaQueryConditionTokenType = 85,
    /**
     * media feature token type
     */
    MediaFeatureTokenType = 86,
    /**
     * media feature only token type
     */
    OnlyTokenType = 87,
    /**
     * media feature not token type
     */
    NotTokenType = 88,
    /**
     * media feature and token type
     */
    AndTokenType = 89,
    /**
     * media feature or token type
     */
    OrTokenType = 90,
    /**
     * pseudo page token type
     */
    PseudoPageTokenType = 91,
    /**
     * pseudo element token type
     */
    PseudoElementTokenType = 92,
    /**
     * keyframe at rule node type
     */
    KeyframesAtRuleNodeType = 93,
    /**
     * invalid declaration node type.
     * @deprecated
     */
    InvalidDeclarationNodeType = 94,
    /**
     * composes token node type
     */
    ComposesSelectorNodeType = 95,
    /**
     * css variable token type
     */
    CssVariableTokenType = 96,
    /**
     * css variable import token type
     */
    CssVariableImportTokenType = 97,
    /**
     * css variable declaration map token type
     */
    CssVariableDeclarationMapTokenType = 98,
    /**
     * media range query token type
     */
    MediaRangeQueryTokenType = 99,
    /**
     * invalid media query token type
     */
    InvalidMediaQueryTokenType = 100,
    /**
     * supports query condition token type
     */
    SupportsQueryConditionTokenType = 101,
    /**
     * supports query unary condition token type
     */
    SupportsQueryUnaryConditionTokenType = 102,
    /**
     * when else query condition token type
     */
    WhenElseQueryConditionTokenType = 103,
    /**
     * when else query unary condition token type
     */
    WhenElseUnaryConditionTokenType = 104,
    /**
     * container style range token type
     */
    ContainerStyleRangeTokenType = 105,
    /**
     * '*'
     */
    Star = 106,
    /**
     * '+'
     */
    Plus = 107,
    /**
     * '~'
     */
    Tilda = 108,
    /**
     * '|'
     */
    Pipe = 109,
    /**
     * '::'
     */
    DoubleColonTokenType = 110,
    /**
     * math function token type  such as'calc(' etc.
     */
    MathFunctionTokenType = 111,
    /**
     * transform function token type such as 'translate(' etc.
     */
    TransformFunctionTokenType = 112,
    /**
     * when function token type such as 'supports(' etc.
     */
    WhenElseFunctionTokenType = 113,
    /**
     * general enclosed function token type 'font-tech(' etc.
     */
    GeneralEnclosedFunctionTokenType = 114,
    /**
     * supports function token type such as 'at-rule('
     */
    SupportsFunctionTokenType = 115,
    /**
     * container function token type such as 'style(' or 'scroll-state('
     */
    ContainerFunctionTokenType = 116,
    /**
     * unrecognized node token type
     */
    RawNodeTokenType = 117,
    /**
     * media query boolean token type
     * at-rule media not ()
     * at-rule media only ()
     */
    MediaQueryUnaryFeatureTokenType = 118,
    /**
     * grid template function token type such as 'minmax('
     */
    GridTemplateFuncTokenDefType = 119,
    /**
     * image function token type such as 'image(' etc.
     */
    ImageFunctionTokenDefType = 120,
    /**
     * function token type such as 'view(' etc.
     */
    TimelineFunctionTokenDefType = 121,
    /**
     * function token type
     */
    FunctionTokenDefType = 122,
    /**
     * timing function token type such as 'linear(' etc.
     */
    TimingFunctionTokenDefType = 123,
    /**
     * color function token type such as 'rgb(' etc.
     */
    ColorFunctionTokenDefType = 124,
    /**
     * math function token type such as 'calc(' etc.
     */
    MathFunctionTokenDefType = 125,
    /**
     * container function token type such as 'style(' or 'scroll-state('
     */
    ContainerFunctionTokenDefType = 126,
    /**
     * url function token type 'url('
     */
    UrlFunctionTokenDefType = 127,
    /**
     * pseudo-class function token type
     */
    PseudoClassFunctionTokenDefType = 128,
    /**
     * transform function token type such as 'translate(' etc.
     */
    TransformFunctionTokenDefType = 129,
    /**
     * when function token type such as 'supports(' or 'media('
     */
    WhenElseFunctionTokenDefType = 130,
    /**
     * general enclosed function token type 'font-tech(' etc.
     */
    GeneralEnclosedFunctionTokenDefType = 131,
    /**
     * supports function token type 'font-tech('
     */
    SupportsFunctionTokenDefType = 132,
    /**
     *  CDOCOMMTokenType not allowed in this context
     */
    InvalidCommentTokenType = 133,
    /**
     * custom function token type '--function-name('
     */
    CustomFunctionTokenDefType = 134,
    /**
     * custom function token type
     */
    CustomFunctionTokenType = 135,
    /**
     * function tokens such as 'var(', 'env(', 'if(')
     */
    WildCardFunctionTokenDefType = 136,
    /**
     * function such as 'var()', 'env()', 'if()'
     */
    WildCardFunctionTokenType = 137,
    /**
     * if condition token
     */
    IfConditionTokenType = 138,
    /**
     * if-Else condition token
     */
    IfElseConditionTokenType = 139,
    /**
     * wrapped values token type like {Arial, sans-serif}
     */
    WrappedValuesTokenType = 140,
    /**
     * alias for time token type
     */
    Time = 25,
    /**
     * alias for identifier token type
     */
    Iden = 7,
    /**
     * alias for end of file token type
     */
    EOF = 48,
    /**
     * alias for hash token type
     */
    Hash = 28,
    /**
     * alias for flex token type
     */
    Flex = 58,
    /**
     * alias for angle token type
     */
    Angle = 24,
    /**
     * alias for color token type
     */
    Color = 50,
    /**
     * alias for comma token type
     */
    Comma = 9,
    /**
     * alias for string token type
     */
    String = 20,
    /**
     * alias for length token type
     */
    Length = 23,
    /**
     * alias for number token type
     */
    Number = 12,
    /**
     * alias for percentage token type
     */
    Perc = 14,
    /**
     * alias for literal token type
     */
    Literal = 6,
    /**
     * alias for comment token type
     */
    Comment = 0,
    /**
     * alias for url function token type
     */
    UrlFunc = 18,
    /**
     * alias for dimension token type
     */
    Dimension = 22,
    /**
     * alias for frequency token type
     */
    Frequency = 26,
    /**
     * alias for resolution token type
     */
    Resolution = 27,
    /**
     * alias for whitespace token type
     */
    Whitespace = 36,
    /**
     * alias for identifier list token type
     */
    IdenList = 71,
    /**
     * alias for dashed identifier token type
     */
    DashedIden = 8,
    /**
     * alias for grid template function token type
     */
    GridTemplateFunc = 72,
    /**
     * alias for image function token type
     */
    ImageFunc = 19,
    /**
     * alias for comment node type
     */
    CommentNodeType = 0,
    /**
     * alias for cdata section node type
     */
    CDOCOMMNodeType = 1,
    /**
     * alias for timing function token type
     */
    TimingFunction = 17,
    /**
     * alias for timeline function token type
     */
    TimelineFunction = 16
}
/**
 * Supported color types enum
 */
declare enum ColorType$1 {
    /**
     * deprecated system colors
     */
    SYS = 0,
    /**
     * deprecated system colors
     */
    DPSYS = 1,
    /**
     * named colors
     */
    LIT = 2,
    /**
     * colors as hex values
     */
    HEX = 3,
    /**
     * colors as rgb values
     */
    RGBA = 4,
    /**
     * colors using rgb
     */
    HSLA = 5,
    /**
     * colors using hwb
     */
    HWB = 6,
    /**
     * colors using cmyk
     */
    CMYK = 7,
    /**
     * colors using oklab
     * */
    OKLAB = 8,
    /**
     * colors using oklch
     * */
    OKLCH = 9,
    /**
     * colors using lab
     */
    LAB = 10,
    /**
     * colors using lch
     */
    LCH = 11,
    /**
     * colors using color() function
     */
    COLOR = 12,
    /**
     * color using srgb
     */
    SRGB = 13,
    /**
     * color using prophoto-rgb
     */
    PROPHOTO_RGB = 14,
    /**
     * color using a98-rgb
     */
    A98_RGB = 15,
    /**
     * color using rec2020
     */
    REC2020 = 16,
    /**
     * color using display-p3
     */
    DISPLAY_P3 = 17,
    /**
     * color using srgb-linear
     */
    SRGB_LINEAR = 18,
    /**
     * color using xyz-d50
     */
    XYZ_D50 = 19,
    /**
     * color using xyz-d65
     */
    XYZ_D65 = 20,
    /**
     * light-dark() color function
     */
    LIGHT_DARK = 21,
    /**
     * color-mix() color function
     */
    COLOR_MIX = 22,
    /**
     * non-standard color
     */
    NON_STD = 23,
    /**
     * custom color
     */
    CUSTOM_COLOR = 24,
    /**
     * alpha() color function
     */
    ALPHA = 25,
    /**
     * alias for rgba
     */
    RGB = 4,
    /**
     * alias for hsl
     */
    HSL = 5,
    /**
     * alias for xyz-d65
     */
    XYZ = 20,
    /**
     * alias for cmyk
     */
    DEVICE_CMYK = 7
}
/**
 * Supported module case transform
 */
declare enum ModuleCaseTransformEnum {
    /**
     * export class names as-is
     */
    IgnoreCase = 1,
    /**
     * transform mapping key name to camel case
     */
    CamelCase = 2,
    /**
     * transform class names and mapping key name to camel case
     */
    CamelCaseOnly = 4,
    /**
     * transform mapping key name to dash case
     */
    DashCase = 8,
    /**
     * transform class names and mapping key name to dash case
     */
    DashCaseOnly = 16
}
/**
 * Supported module scope
 */
declare enum ModuleScopeEnumOptions {
    /**
     * use the global scope
     */
    Global = 32,
    /**
     * use the local scope
     */
    Local = 64,
    /**
     * do not allow selector without an id or class
     */
    Pure = 128,
    /**
     * export using ICSS module format
     */
    ICSS = 256,
    /**
     * use the shortest name possible. pattern is ignored.
     * it will produce names such as
     *
     * ```css
     *  .a {
     *      content: 'a';
     *  }
     *
     *  .b {
     *      content: 'b';
     *  }
     *
     *  .c {
     *      content: 'c';
     *  }
     *  ...
     * ```
     */
    Shortest = 512
}

declare const LOC: unique symbol;
declare const RAW: unique symbol;
declare const STATE: unique symbol;
declare const ROOT: unique symbol;
declare const ERRORS: unique symbol;
declare const TOKENS: unique symbol;
declare const PARENT: unique symbol;
declare const OPTIMIZED: unique symbol;

/**
 * Position
 */
export declare interface Position$1 {
    /**
     * index in the source
     */
    ind: number;
    /**
     * line number
     */
    lin: number;
    /**
     * column number
     */
    col: number;
}

/**
 * token or node location
 */
export declare interface Location {
    /**
     * start position
     */
    sta: Position$1;
    /**
     * end position
     */
    end: Position$1;
    /**
     * source file
     */
    src: string;
}

/**
 * Common token interface
 */
export declare interface BaseToken {
    /**
     * token type
     */
    typ: EnumToken;
    /**
     * location info
     * @private
     */
    [LOC]?: Location;
    /**
     * parent node
     * @private
     */
    [PARENT]?: AstNode$1;
    /**
     * root node
     */
    [ROOT]?: AstStyleSheet;
    /**
     * prelude or selector tokens
     * @private
     */
    [TOKENS]?: Token$1[] | null;
    /**
     * node state
     * @private
     */
    [STATE]?: EnumAstNodeStatus;
    /**
     * node syntax errors
     * @private
     */
    [ERRORS]?: ErrorDescription[];
    /**
     * property name
     * @private
     */
    [PROPERTYNAME]?: string;
    /**
     * raw selector
     * @private
     */
    [RAW]?: string[][] | null;
    /**
     * optimized selector
     * @private
     */
    [OPTIMIZED]?: OptimizedSelector | null;
    /**
     * parent node
     */
    parent?: AstAtRule | astRule | AstKeyframesAtRule | AstKeyFrameRule | AstInvalidRule | AstInvalidAtRule | null;
    /**
     * @private
     */
    validSyntax?: boolean;
}

/**
 * Ast node state
 */
export declare interface AstNodeStatus {
    /**
     * Node state
     */
    state?: EnumAstNodeStatus;
    /**
     * Syntax errors
     */
    errors?: ErrorDescription[];
}

/**
 * comment node
 */
export declare interface AstComment extends BaseToken {
    /**
     * token type
     */
    typ: EnumToken.CommentNodeType | EnumToken.CDOCOMMNodeType;
    /**
     * comment as string
     */
    val: string;
}

/**
 * declaration node
 */
export declare interface AstDeclaration extends BaseToken, AstNodeStatus {
    /**
     * token name
     */
    nam: string;
    /**
     * token value
     */
    val: Token$1[];
    /**
     * token type
     */
    typ: EnumToken.DeclarationNodeType;
}

/**
 * rule node
 */
export declare interface AstRule extends BaseToken, AstNodeStatus {
    /**
     * token type
     */
    typ: EnumToken.RuleNodeType;
    /**
     * selector as string
     */
    sel: string;
    /**
     * child nodes
     */
    chi: Array<
        AstDeclaration | AstComment | AstRule | AstAtRule | AstInvalidRule | AstInvalidDeclaration | AstInvalidAtRule
    >;
    /**
     * optimized` selector
     */
    optimized?: OptimizedSelector | null;
    /**
     * raw selector
     */
    raw?: RawSelectorTokens | null;
}

/**
 * Invalid rule node
 * @deprecated
 */
export declare interface AstInvalidRule extends BaseToken, AstNodeStatus {
    /**
     * token type
     */
    typ: EnumToken.InvalidRuleNodeType;
    /**
     * selector
     */
    sel: string;
    /**
     * child nodes
     */
    chi: Array<AstNode$1>;
}

/**
 * invalid declaration node
 * @deprecated
 */
export declare interface AstInvalidDeclaration extends BaseToken, AstNodeStatus {
    /**
     * token type
     */
    typ: EnumToken.InvalidDeclarationNodeType;
    /**
     * tokens
     */
    tokens?: null;
    /**
     * tokens
     */
    val: Array<Token$1>;
}

/**
 * invalid at rule node
 * @deprecated
 */
export declare interface AstInvalidAtRule extends BaseToken, AstNodeStatus {
    /**
     * token type
     */
    typ: EnumToken.InvalidAtRuleNodeType;
    /**
     * name
     */
    nam: string;
    /**
     * value
     */
    val: string;
    /**
     * child nodes
     */
    chi?: Array<AstNode$1>;
}

/**
 * keyframe rule node
 */
export declare interface AstKeyFrameRule extends BaseToken, AstNodeStatus {
    /**
     * token type
     */
    typ: EnumToken.KeyFramesRuleNodeType;
    /**
     * selector
     */
    sel: string;
    /**
     * child nodes
     */
    chi: Array<AstDeclaration | AstComment | AstInvalidDeclaration>;
    /**
     * optimized selector
     */
    optimized?: OptimizedSelector;
    /**
     * raw selector
     */
    raw?: RawSelectorTokens;
    /**
     * tokens
     */
    tokens?: Token$1[];
}

/**
 * raw selector tokens
 */
export declare type RawSelectorTokens = string[][];

/**
 * optimized selector
 *
 * @private
 */
export declare interface OptimizedSelector {
    /**
     * matched selector
     */
    match: boolean;
    /**
     * optimized selector
     */
    optimized: string[];
    /**
     * selector tokens as string
     */
    selector: string[][];
    /**
     * reducible selector
     */
    reducible: boolean;
}

/**
 * optimized selector token
 *
 * @private
 */
export declare interface OptimizedSelectorToken {
    /**
     * match
     */
    match: boolean;
    /**
     * optimized
     */
    optimized: Token$1[];
    /**
     * selector
     */
    selector: Token$1[][];
    /**
     * reducible
     */
    reducible: boolean;
}

/**
 * at rule node
 */
export declare interface AstAtRule extends BaseToken, AstNodeStatus {
    /**
     * token type
     */
    typ: EnumToken.AtRuleNodeType;
    /**
     * name
     */
    nam: string;
    /**
     * value
     */
    val: string;
    /**
     * child nodes
     */
    chi?: Array<AstNode$1>;
}

/**
 * keyframe rule node
 */
export declare interface AstKeyframesRule extends BaseToken, AstNodeStatus {
    /**
     * token type
     */
    typ: EnumToken.KeyFramesRuleNodeType;
    /**
     * selector
     */
    sel: string;
    /**
     * child nodes
     */
    chi: Array<AstDeclaration | AstInvalidDeclaration | AstComment | AstRuleList>;
    /**
     * optimized selector
     */
    optimized?: OptimizedSelector;
    /**
     * raw selector
     */
    raw?: RawSelectorTokens;
}

/**
 * keyframe at rule node
 */
export declare interface AstKeyframesAtRule extends BaseToken, AstNodeStatus {
    /**
     * token type
     */
    typ: EnumToken.KeyframesAtRuleNodeType;
    /**
     * name
     */
    nam: string;
    /**
     * value
     */
    val: string;
    /**
     * child nodes
     */
    chi: Array<AstKeyframesRule | AstComment>;
}

/**
 * rule list node
 */
export declare type AstRuleList =
    | AstStyleSheet
    | AstAtRule
    | AstRule
    | AstKeyframesAtRule
    | AstKeyFrameRule
    | AstInvalidRule;

/**
 * stylesheet node
 */
export declare interface AstStyleSheet extends BaseToken {
    /**
     * token type
     */
    typ: EnumToken.StyleSheetNodeType;
    /**
     * child nodes
     */
    chi: Array<AstRule | AstAtRule | astKeyframesAtRule | AstComment | AstInvalidAtRule | AstInvalidRule>;
}

/**
 * ast node
 */
export declare type AstNode$1 =
    | AstStyleSheet
    | AstRuleList
    | AstComment
    | AstAtRule
    | AstRule
    | AstDeclaration
    | AstKeyframesAtRule
    | AstKeyFrameRule
    | AstInvalidRule
    | AstInvalidAtRule
    | AstInvalidDeclaration
    | CssVariableToken
    | CssVariableImportTokenType;

/**
 * token search result
 */
interface TokenSearchResult {
    /**
     * node
     */
    node: Token$1 | null;
    /**
     * parent node
     */
    parent: AstNode$1 | Token$1 | null;
    /**
     * root node
     */
    root: AstNode$1 | Token$1 | null;
    /**
     * parent tokens
     */
    parents: Generator<Token$1> | null;
}

/**
 * Ast value matcher
 */
type AstValueMatcher = ((value: Token$1) => boolean) | ((token: Token$1, node: AstNode$1) => boolean);

/**
 * Options for the walk function
 */
declare enum WalkerOptionEnum {
    /**
     * ignore the current node and its children
     */
    Ignore = 1,
    /**
     * stop walking the tree
     */
    Stop = 2,
    /**
     * ignore the current node and process its children
     */
    Children = 4,
    /**
     * ignore the current node children
     */
    IgnoreChildren = 8
}
/**
 * Event types for the walkValues function
 */
declare enum WalkerEvent {
    /**
     * enter node
     */
    Enter = 1,
    /**
     * leave node
     */
    Leave = 2
}
/**
 * Walk ast nodes
 * @param node initial node
 * @param filter control the walk process
 * @param reverse walk in reverse order
 *
 * ```ts
 *
 * import {walk} from '@tbela99/css-parser';
 *
 * const css = `
 * body { color:    color(from var(--base-color) display-p3 r calc(g + 0.24) calc(b + 0.15)); }
 *
 * html,
 * body {
 *     line-height: 1.474;
 * }
 *
 * .ruler {
 *
 *     height: 10px;
 * }
 * `;
 *
 * for (const {node, parent, root} of walk(ast)) {
 *
 *     // do something with node
 * }
 * ```
 *
 * Using a {@link filter} function to control the ast traversal.  the filter function returns a value of type {@link WalkerOption}.
 *
 * ```ts
 * import {EnumToken, transform, walk, WalkerOptionEnum} from '@tbela99/css-parser';
 *
 * const css = `
 * body { color:    color(from var(--base-color) display-p3 r calc(g + 0.24) calc(b + 0.15)); }
 *
 * html,
 * body {
 *     line-height: 1.474;
 * }
 *
 * .ruler {
 *
 *     height: 10px;
 * }
 * `;
 *
 * function filter(node) {
 *
 *     if (node.typ == EnumToken.AstRule && node.sel.includes('html')) {
 *
 *         // skip the children of the current node
 *         return WalkerOptionEnum.IgnoreChildren;
 *     }
 * }
 *
 * const result = await transform(css);
 * for (const {node} of walk(result.ast, filter)) {
 *
 *     console.error([EnumToken[node.typ]]);
 * }
 *
 * // [ "StyleSheetNodeType" ]
 * // [ "RuleNodeType" ]
 * // [ "DeclarationNodeType" ]
 * // [ "RuleNodeType" ]
 * // [ "DeclarationNodeType" ]
 * // [ "RuleNodeType" ]
 * // [ "DeclarationNodeType" ]
 * ```
 */
declare function walk(node: AstNode$1, filter?: WalkerFilter | null, reverse?: boolean): Generator<WalkResult>;
/**
 * Walk ast node value tokens
 * @param values
 * @param root
 * @param filter
 * @param reverse
 *
 * Example:
 *
 * ```ts
 *
 * import {AstDeclaration, EnumToken, transform, walkValues} from '@tbela99/css-parser';
 *
 * const css = `
 * body { color:    color(from var(--base-color) display-p3 r calc(g + 0.24) calc(b + 0.15)); }
 * `;
 *
 * const result = await transform(css);
 * const declaration = result.ast.chi[0].chi[0] as AstDeclaration;
 *
 * // walk the node attribute's tokens in reverse order
 * for (const {value} of walkValues(declaration.val, null, null,true)) {
 *
 *     console.error([EnumToken[value.typ], value.val]);
 * }
 *
 * // [ "Color", "color" ]
 * // [ "FunctionTokenType", "calc" ]
 * // [ "Number", 0.15 ]
 * // [ "Add", undefined ]
 * // [ "Iden", "b" ]
 * // [ "Whitespace", undefined ]
 * // [ "FunctionTokenType", "calc" ]
 * // [ "Number", 0.24 ]
 * // [ "Add", undefined ]
 * // [ "Iden", "g" ]
 * // [ "Whitespace", undefined ]
 * // [ "Iden", "r" ]
 * // [ "Whitespace", undefined ]
 * // [ "Iden", "display-p3" ]
 * // [ "Whitespace", undefined ]
 * // [ "FunctionTokenType", "var" ]
 * // [ "DashedIden", "--base-color" ]
 * // [ "Whitespace", undefined ]
 * // [ "Iden", "from" ]
 * ```
 */
declare function walkValues(values: Token$1[], root?: AstNode$1 | Token$1 | null, filter?: WalkerValueFilter | null | {
    event?: WalkerEvent;
    fn?: WalkerValueFilter;
    type?: EnumToken | EnumToken[] | ((token: Token$1) => boolean);
}, reverse?: boolean): Generator<WalkAttributesResult>;

export declare type GenericVisitorResult<T> = T | T[] | Promise<T> | Promise<T[]> | null | Promise<null>;
export declare type GenericVisitorHandler<T> = (
    node: T,
    parent?: AstNode | Token,
    root?: AstNode | Token,
) => GenericVisitorResult<T>;
export declare type GenericVisitorAstNodeHandlerMap<T> =
    | Record<string, GenericVisitorHandler<T>>
    | GenericVisitorHandler<T>
    | { type: WalkerEvent; handler: GenericVisitorHandler<T> }
    | { type: WalkerEvent; handler: Record<string, GenericVisitorHandler<T>> };

export declare type ValueVisitorHandler = GenericVisitorHandler<Token>;

/**
 * Declaration visitor handler
 */
export declare type DeclarationVisitorHandler = GenericVisitorHandler<AstDeclaration>;
/**
 * Rule visitor handler
 */
export declare type RuleVisitorHandler = GenericVisitorHandler<AstRule>;

/**
 * AtRule visitor handler
 */
export declare type AtRuleVisitorHandler = GenericVisitorHandler<AstAtRule>;

/**
 * node visitor callback map
 *
 */
export declare interface VisitorNodeMap {
    /**
     * at rule visitor
     *
     * Example: change media at-rule prelude
     *
     * ```ts
     *
     * import {transform, AstAtRule, ParserOptions} from "@tbela99/css-parser";
     *
     * const options: ParserOptions = {
     *
     *     visitor: {
     *
     *         AtRule: {
     *
     *             media: (node: AstAtRule): AstAtRule => {
     *
     *                 node.val = 'tv,screen';
     *                 return node
     *             }
     *         }
     *     }
     * };
     *
     * const css = `
     *
     * @media screen {
     *
     *     .foo {
     *
     *             height: calc(100px * 2/ 15);
     *     }
     * }
     * `;
     *
     * const result = await transform(css, options);
     *
     * console.debug(result.code);
     *
     * // @media tv,screen{.foo{height:calc(40px/3)}}
     * ```
     */
    AtRule?: GenericVisitorAstNodeHandlerMap<AstAtRule>;
    /**
     * declaration visitor
     *
     *  Example: add 'width: 3px' everytime a declaration with the name 'height' is found
     *
     * ```ts
     *
     * import {transform, parseDeclarations} from "@tbela99/css-parser";
     *
     * const options: ParserOptions = {
     *
     *     removeEmpty: false,
     *     visitor: {
     *
     *         Declaration: {
     *
     *             // called only for height declaration
     *             height: (node: AstDeclaration): AstDeclaration[] => {
     *
     *
     *                 return [
     *                     node,
     *                     {
     *
     *                         typ: EnumToken.DeclarationNodeType,
     *                         nam: 'width',
     *                         val: [
     *                             <LengthToken>{
     *                                 typ: EnumToken.LengthTokenType,
     *                                 val: 3,
     *                                 unit: 'px'
     *                             }
     *                         ]
     *                     }
     *                 ];
     *             }
     *            }
     *         }
     * };
     *
     * const css = `
     *
     * .foo {
     *     height: calc(100px * 2/ 15);
     * }
     * .selector {
     * color: lch(from peru calc(l * 0.8) calc(c * 0.7) calc(h + 180))
     * }
     * `;
     *
     * console.debug(await transform(css, options));
     *
     * // .foo{height:calc(40px/3);width:3px}.selector{color:#0880b0}
     * ```
     *
     * Example: rename 'margin' to 'padding' and 'height' to 'width'
     *
     * ```ts
     * import {AstDeclaration, ParserOptions, transform} from "../src/node.ts";
     *
     * const options: ParserOptions = {
     *
     *     visitor: {
     *
     *         // called for every declaration
     *         Declaration: (node: AstDeclaration): null => {
     *
     *
     *             if (node.nam == 'height') {
     *
     *                 node.nam = 'width';
     *             }
     *
     *             else if (node.nam == 'margin') {
     *
     *                 node.nam = 'padding'
     *             }
     *
     *             return null;
     *         }
     *     }
     * };
     *
     * const css = `
     *
     * .foo {
     *     height: calc(100px * 2/ 15);
     *     margin: 10px;
     * }
     * .selector {
     *
     * margin: 20px;}
     * `;
     *
     * const result = await transform(css, options);
     *
     * console.debug(result.code);
     *
     * // .foo{width:calc(40px/3);padding:10px}.selector{padding:20px}
     * ```
     */
    Declaration?: GenericVisitorAstNodeHandlerMap<AstDeclaration>;

    /**
     * rule visitor
     *
     *  Example: add 'width: 3px' to every rule with the selector '.foo'
     *
     * ```ts
     *
     * import {transform, parseDeclarations} from "@tbela99/css-parser";
     *
     * const options: ParserOptions = {
     *
     *     removeEmpty: false,
     *     visitor: {
     *
     *         Rule: async (node: AstRule): Promise<AstRule | null> => {
     *
     *             if (node.sel == '.foo') {
     *
     *                 node.chi.push(...await parseDeclarations('width: 3px'));
     *                 return node;
     *             }
     *
     *             return null;
     *         }
     *     }
     * };
     *
     * const css = `
     *
     * .foo {
     *     .foo {
     *     }
     * }
     * `;
     *
     * console.debug(await transform(css, options));
     *
     * // .foo{width:3px;.foo{width:3px}}
     * ```
     */
    Rule?: GenericVisitorAstNodeHandlerMap<AstRule>;

    KeyframesRule?: GenericVisitorAstNodeHandlerMap<AstKeyframesRule>;

    KeyframesAtRule?: GenericVisitorAstNodeHandlerMap<AstKeyframesAtRule>;

    /**
     * value visitor
     */
    Value?: GenericVisitorAstNodeHandlerMap<Token>;

    /**
     * generic token visitor. the key name is of type keyof EnumToken.
     * generic tokens are called for every token of the specified type.
     *
     * ```ts
     *
     * import {transform, parse, parseDeclarations} from "@tbela99/css-parser";
     *
     * const options: ParserOptions = {
     *
     *     inlineCssVariables: true,
     *     visitor: {
     *
     *         // Stylesheet node visitor
     *         StyleSheetNodeType: async (node) => {
     *
     *             // insert a new rule
     *             node.chi.unshift(await parse('html {--base-color: pink}').then(result => result.ast.chi[0]))
     *         },
     *         ColorTokenType:  (node) => {
     *
     *             // dump all color tokens
     *             // console.debug(node);
     *          },
     *          FunctionTokenType:  (node) => {
     *
     *              // dump all function tokens
     *              // console.debug(node);
     *          },
     *          DeclarationNodeType:  (node) => {
     *
     *              // dump all declaration nodes
     *              // console.debug(node);
     *          }
     *     }
     * };
     *
     * const css = `
     *
     * body { color:    color(from var(--base-color) display-p3 r calc(g + 0.24) calc(b + 0.15)); }
     * `;
     *
     * console.debug(await transform(css, options));
     *
     * // body {color:#f3fff0}
     * ```
     */
    [key: keyof typeof EnumToken]: GenericVisitorAstNodeHandlerMap<Token> | GenericVisitorAstNodeHandlerMap<AstNode>;
}

/**
 * Source map class
 * @internal
 */
declare class SourceMap {
    #private;
    /**
     * Last location
     */
    lastLocation: Location | null;
    /**
     * Add a location
     * @param source
     * @param original
     */
    add(source: Location, original: Location): void;
    /**
     * Convert to URL encoded string
     */
    toUrl(): string;
    /**
     * Convert to JSON object
     */
    toJSON(): SourceMapObject;
}

export declare interface PropertyListOptions {

    removeDuplicateDeclarations?: boolean | string | string[];
    computeShorthand?: boolean;
}

/**
 * parse info
 */
export declare interface ParseInfo$1 {

    /**
     * source file or url
     */
    src: string;

    /**
     * read buffer
     */
    buffer: string;
    /**
     * stream
     */
    stream: string;

    /**
     * the accumulated css string
     */
    // acc: string;
    
    /**
     * last token position
     */
    position: Position$1;
    /**
     * current parsing position
     */
    currentPosition: Position$1;

    /**
     * offset
     */
    offset: number;

    /**
     * tokenizing time
     */
    time: number;
}

/**
 * feature walk mode
 *
 * @private
 */
declare enum FeatureWalkMode {
    /**
     * pre process
     */
    Pre = 1,
    /**
     * post process
     */
    Post = 2
}

declare enum ValidationTokenEnum {
    Root = 0,
    Keyword = 1,
    PropertyType = 2,
    DeclarationType = 3,
    AtRule = 4,
    FunctionDefinition = 5,
    OpenBracket = 6,
    CloseBracket = 7,
    OpenParenthesis = 8,
    CloseParenthesis = 9,
    Comma = 10,
    Pipe = 11,
    Column = 12,
    Star = 13,
    OpenCurlyBrace = 14,
    CloseCurlyBrace = 15,
    HashMark = 16,
    QuestionMark = 17,
    Function = 18,
    Number = 19,
    Whitespace = 20,
    Parenthesis = 21,
    Bracket = 22,
    Block = 23,
    Plus = 24,
    Separator = 25,
    Exclamation = 26,
    Ampersand = 27,
    PipeToken = 28,
    ColumnToken = 29,
    AmpersandToken = 30,
    Parens = 31,
    PseudoClassToken = 32,
    PseudoClassFunctionToken = 33,
    StringToken = 34,
    AtRuleDefinition = 35,
    DeclarationNameToken = 36,
    DeclarationDefinitionToken = 37,
    SemiColon = 38,
    Character = 39,
    InfinityToken = 40,
    LessThan = 41,
    GreaterThan = 42,
    /**
     * end of token stream
     */
    EOF = 43,
    /**
     * optional group or tokens, used to group validation tokens
     *
     * ```ts
     * // <bg-layer>#? , <final-bg-layer> -> [<bg-layer>#? ,]? <final-bg-layer>
     * // , <angular-color-stop> ]#? -> [, <angular-color-stop> ]#?]?
     * ```
     */
    OptionalGroupToken = 44,
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
    Dimension = 45,
    DisallowWhitespace = 46,
    Colon = 47
}
/**
 * Keys of the validation config object
 */
declare enum ValidationSyntaxGroupEnum {
    Declarations = "declarations",
    Functions = "functions",
    Syntaxes = "syntaxes",
    Selectors = "selectors",
    AtRules = "atRules",
    Units = "units",
    Languages = "languages",
    mediaFeatures = "mediaFeatures"
}
/**
 * Types of media features
 */
declare enum MediaFeatureType {
    BooleanType = "boolean",
    IntergerType = "integer",
    KeywordType = "keyword",
    LengthType = "length",
    NumberType = "number",
    RatioType = "ratio",
    ResolutionType = "resolution",
    StringType = "string"
}

interface Position {
    ind: number;
    lin: number;
    col: number;
}

interface ValidationValueRangeMatch {
    min: ValidationNumberToken;
    max: ValidationNumberToken | null;
}

interface ValidationDimensionRangeMatch {
    min: ValidationDimensionToken;
    max: ValidationDimensionToken | null;
}

/**
 * Validation token
 */
interface ValidationToken$1 {
    /**
     * token type
     */
    typ: ValidationTokenEnum;
    /**
     * token position
     */
    [LOC]: Position;
    /**
     * match a comma separated list
     */
    isList?: boolean;
    /**
     *
     * @private
     */
    text?: string;
    // https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Values_and_units/Value_definition_syntax
    /**
     * token matches 0 or more times
     */
    isRepeatable?: boolean;
    // https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Values_and_units/Value_definition_syntax
    /**
     * token matches 1 or more times
     */
    isRepeatableAtLeastOnce?: boolean;
    // https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Values_and_units/Value_definition_syntax
    /**
     * token is optional
     */
    isOptional?: boolean;
    // https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Values_and_units/Value_definition_syntax

    /**
     * token is a mandatory group
     */
    isMandatatoryGroup?: boolean;
    /**
     * token matching rules
     */
    match?: {
        /**
         * token matches at least the specified number of times
         */
        min: ValidationNumberToken;
        /**
         * token matches at most the specified number of times.
         */
        max: ValidationNumberToken | null;
    };
    /**
     * tokan's value range
     */
    range?: ValidationValueRangeMatch | ValidationDimensionRangeMatch;
}

/**
 * Number token
 */
interface ValidationNumberToken extends ValidationToken$1 {
    /**
     * token type
     */
    typ: ValidationTokenEnum.Number;
    /**
     * token value
     */
    val: number;
}

interface ValidationDimensionToken extends ValidationToken$1 {
    typ: ValidationTokenEnum.AtRuleName;
    val: number;
    unitText: string;
    unit: keyof EnumToken;
}

interface PropertyType {
    shorthand: string;
}

interface SinglePropertyType {
        typ: keyof EnumToken;
        val: string | number;
}

interface SinglePropertyTypeMapping {
    pattern?: string[][];
    mapping: Record<string, SinglePropertyType>;
}

interface ShorthandPropertyType {
    shorthand: string;
    map?: string;
    properties: string[];
    types: string[];
    multiple: boolean;
    separator: {
        typ: keyof EnumToken;
        val: string;
    };
    valueSeparator?: {
        typ: keyof EnumToken;
        val: string;
    };
    keywords: string[];
}

interface PropertySetType {
    [key: string]: PropertyType | ShorthandPropertyType;
}

interface PropertyMapType {
    default: string[];
    types: string[];
    keywords: string[];
    required?: boolean;
    multiple?: boolean;
    prefix?: {
        typ: keyof EnumToken;
        val: string;
    };
    previous?: string;
    separator?: {
        typ: keyof EnumToken;
    };
    constraints?: {
        [key: string]: {
            [key: string]: any;
        };
    };
    mapping?: Record<string, string>;
}

interface ShorthandMapType {
    shorthand: string;
    pattern: string;
    keywords: string[];
    default: string[];
    mapping?: Record<string, string>;
    multiple?: boolean;
    separator?: { typ: keyof EnumToken; val?: string };
    set?: Record<string, string[]>;
    properties: {
        [property: string]: PropertyMapType;
    };
}

interface ShorthandProperties {
    types: EnumToken[];
    default: string[];
    keywords: string[];
    required?: boolean;
    multiple?: boolean;
    constraints?: Array<any>;
    mapping?: {
        [key: string]: any;
    };
    validation?: {
        [key: string]: any;
    };
    prefix?: string;
}

interface ShorthandDef {
    shorthand: string;
    pattern: string;
    keywords: string;
    defaults: string[];
    multiple?: boolean;
    separator?: string;
}

interface ShorthandType {
    shorthand: string;
    properties: ShorthandProperties;
}

// generated from config.json at https://app.quicktype.io/?l=ts

/**
 * @private
 */
export declare interface PropertiesConfig {
    /**
     * shorthand property minification rules
     */
    properties: PropertiesConfigProperties;
    /**
     * shorthand property minification rules
     */
    map: Map$1;
    /**
     * single property minification rules
     */
    property: Record<string, SinglePropertyTypeMapping>;
}

/**
 * @private
 */
interface Map$1 {
    border: Border;
    "border-color": BackgroundPositionClass;
    "border-style": BackgroundPositionClass;
    "border-width": BackgroundPositionClass;
    outline: Outline;
    "outline-color": BackgroundPositionClass;
    "outline-style": BackgroundPositionClass;
    "outline-width": BackgroundPositionClass;
    font: Font;
    "font-weight": BackgroundPositionClass;
    "font-style": BackgroundPositionClass;
    "font-size": BackgroundPositionClass;
    "line-height": BackgroundPositionClass;
    "font-stretch": BackgroundPositionClass;
    "font-variant": BackgroundPositionClass;
    "font-family": BackgroundPositionClass;
    background: Background;
    "background-repeat": BackgroundPositionClass;
    "background-color": BackgroundPositionClass;
    "background-image": BackgroundPositionClass;
    "background-attachment": BackgroundPositionClass;
    "background-clip": BackgroundPositionClass;
    "background-origin": BackgroundPositionClass;
    "background-position": BackgroundPositionClass;
    "background-size": BackgroundPositionClass;
}

/**
 * @private
 */
interface Background {
    shorthand: string;
    pattern: string;
    keywords: string[];
    default: any[];
    multiple: boolean;
    separator: Separator;
    properties: BackgroundProperties;
}

/**
 * @private
 */
interface BackgroundProperties {
    "background-repeat": BackgroundRepeat;
    "background-color": PurpleBackgroundAttachment;
    "background-image": PurpleBackgroundAttachment;
    "background-attachment": PurpleBackgroundAttachment;
    "background-clip": PurpleBackgroundAttachment;
    "background-origin": PurpleBackgroundAttachment;
    "background-position": BackgroundPosition;
    "background-size": BackgroundSize;
}

/**
 * @private
 */
interface PurpleBackgroundAttachment {
    types: string[];
    default: string[];
    keywords: string[];
    required?: boolean;
    mapping?: BackgroundAttachmentMapping;
}

/**
 * @private
 */
interface BackgroundAttachmentMapping {
    "ultra-condensed": string;
    "extra-condensed": string;
    condensed: string;
    "semi-condensed": string;
    normal: string;
    "semi-expanded": string;
    expanded: string;
    "extra-expanded": string;
    "ultra-expanded": string;
}

/**
 * @private
 */
interface BackgroundPosition {
    multiple: boolean;
    types: string[];
    default: string[];
    keywords: string[];
    mapping: BackgroundPositionMapping;
    constraints: BackgroundPositionConstraints;
}

/**
 * @private
 */
interface BackgroundPositionConstraints {
    mapping: ConstraintsMapping;
}

/**
 * @private
 */
interface ConstraintsMapping {
    max: number;
}

/**
 * @private
 */
interface BackgroundPositionMapping {
    left: string;
    top: string;
    center: string;
    bottom: string;
    right: string;
}

/**
 * @private
 */
interface BackgroundRepeat {
    types: any[];
    default: string[];
    multiple: boolean;
    keywords: string[];
    mapping: BackgroundRepeatMapping;
}

/**
 * @private
 */
interface BackgroundRepeatMapping {
    "repeat no-repeat": string;
    "no-repeat repeat": string;
    "repeat repeat": string;
    "space space": string;
    "round round": string;
    "no-repeat no-repeat": string;
}

/**
 * @private
 */
interface BackgroundSize {
    multiple: boolean;
    previous: string;
    prefix: Prefix;
    types: string[];
    default: string[];
    keywords: string[];
    mapping: BackgroundSizeMapping;
}

/**
 * @private
 */
interface BackgroundSizeMapping {
    "auto auto": string;
}

/**
 * @private
 */
interface Prefix {
    typ: string;
    val: string;
}

/**
 * @private
 */
interface Separator {
    typ: string;
}

/**
 * @private
 */
interface BackgroundPositionClass {
    shorthand: string;
}

/**
 * @private
 */
interface Border {
    shorthand: string;
    pattern: string;
    keywords: string[];
    default: string[];
    properties: BorderProperties;
}

/**
 * @private
 */
interface BorderProperties {
    "border-color": BorderColorClass;
    "border-style": BorderColorClass;
    "border-width": BorderColorClass;
}

/**
 * @private
 */
interface BorderColorClass {}

/**
 * @private
 */
interface Font {
    shorthand: string;
    pattern: string;
    keywords: string[];
    default: any[];
    properties: FontProperties;
}

/**
 * @private
 */
interface FontProperties {
    "font-weight": FontWeight;
    "font-style": PurpleBackgroundAttachment;
    "font-size": PurpleBackgroundAttachment;
    "line-height": LineHeight;
    "font-stretch": PurpleBackgroundAttachment;
    "font-variant": PurpleBackgroundAttachment;
    "font-family": FontFamily;
}

/**
 * @private
 */
interface FontFamily {
    types: string[];
    default: any[];
    keywords: string[];
    required: boolean;
    multiple: boolean;
    separator: Separator;
}

/**
 * @private
 */
interface FontWeight {
    types: string[];
    default: string[];
    keywords: string[];
    constraints: FontWeightConstraints;
    mapping: FontWeightMapping;
}

/**
 * @private
 */
interface FontWeightConstraints {
    value: Value;
}

/**
 * @private
 */
interface Value {
    min: string;
    max: string;
}

/**
 * @private
 */
interface FontWeightMapping {
    thin: string;
    hairline: string;
    "extra light": string;
    "ultra light": string;
    light: string;
    normal: string;
    regular: string;
    medium: string;
    "semi bold": string;
    "demi bold": string;
    bold: string;
    "extra bold": string;
    "ultra bold": string;
    black: string;
    heavy: string;
    "extra black": string;
    "ultra black": string;
}

/**
 * @private
 */
interface LineHeight {
    types: string[];
    default: string[];
    keywords: string[];
    previous: string;
    prefix: Prefix;
}

/**
 * @private
 */
interface Outline {
    shorthand: string;
    pattern: string;
    keywords: string[];
    default: string[];
    properties: OutlineProperties;
}

/**
 * @private
 */
interface OutlineProperties {
    "outline-color": PurpleBackgroundAttachment;
    "outline-style": PurpleBackgroundAttachment;
    "outline-width": PurpleBackgroundAttachment;
}

/**
 * @private
 */
interface PropertiesConfigProperties {
    inset: BorderRadius;
    top: BackgroundPositionClass;
    right: BackgroundPositionClass;
    bottom: BackgroundPositionClass;
    left: BackgroundPositionClass;
    margin: BorderRadius;
    "margin-top": BackgroundPositionClass;
    "margin-right": BackgroundPositionClass;
    "margin-bottom": BackgroundPositionClass;
    "margin-left": BackgroundPositionClass;
    padding: BorderColor;
    "padding-top": BackgroundPositionClass;
    "padding-right": BackgroundPositionClass;
    "padding-bottom": BackgroundPositionClass;
    "padding-left": BackgroundPositionClass;
    "border-radius": BorderRadius;
    "border-top-left-radius": BackgroundPositionClass;
    "border-top-right-radius": BackgroundPositionClass;
    "border-bottom-right-radius": BackgroundPositionClass;
    "border-bottom-left-radius": BackgroundPositionClass;
    "border-width": BorderColor;
    "border-top-width": BackgroundPositionClass;
    "border-right-width": BackgroundPositionClass;
    "border-bottom-width": BackgroundPositionClass;
    "border-left-width": BackgroundPositionClass;
    "border-style": BorderColor;
    "border-top-style": BackgroundPositionClass;
    "border-right-style": BackgroundPositionClass;
    "border-bottom-style": BackgroundPositionClass;
    "border-left-style": BackgroundPositionClass;
    "border-color": BorderColor;
    "border-top-color": BackgroundPositionClass;
    "border-right-color": BackgroundPositionClass;
    "border-bottom-color": BackgroundPositionClass;
    "border-left-color": BackgroundPositionClass;
}

/**
 * @private
 */
interface BorderColor {
    shorthand: string;
    map?: string;
    properties: string[];
    types: string[];
    keywords: string[];
}

/**
 * @private
 */
interface BorderRadius {
    shorthand: string;
    properties: string[];
    types: string[];
    multiple: boolean;
    separator: null | string;
    keywords: string[];
}

/**
 * node walker option
 */
export declare type WalkerOption = WalkerOptionEnum | AstNode$1 | Token$1 | null;
/**
 * returned value:
 * - {@link WalkerOptionEnum.Ignore}: ignore this node and its children
 * - {@link WalkerOptionEnum.Stop}: stop walking the tree
 * - {@link WalkerOptionEnum.Children}: walk the children and ignore the current node
 * - {@link WalkerOptionEnum.IgnoreChildren}: walk the node and ignore children
 * - {@link AstNode}:
 * - {@link Token}:
 */
export declare type WalkerFilter = (node: AstNode$1) => WalkerOption;

/**
 * returned value:
 * - {@link WalkerOptionEnum.Ignore}: ignore this node and its children
 * - {@link WalkerOptionEnum.Stop}: stop walking the tree
 * - {@link WalkerOptionEnum.Children}: walk the children and ignore the current node
 * - {@link WalkerOptionEnum.IgnoreChildren}: walk the node and ignore children
 * - {@link AstNode}:
 * - {@link Token}:
 */
export declare type WalkerValueFilter = (
    node: AstNode$1 | Token$1,
    parent?: AstNode$1 | Token$1 | AstNode$1[] | Token$1[] | null,
    event?: WalkerEvent,
    parents?: Generator<Token$1>,
) => WalkerOption | null;

export declare interface WalkResult {
    node: AstNode$1;
    parent?: AstRuleList;
    root?: AstNode$1;
    parents: Generator<AstNode$1>;
}

export declare interface WalkAttributesResult {
    value: Token$1;
    previousValue: Token$1 | null;
    nextValue: Token$1 | null;
    root?: AstNode$1 | Token$1 | null;
    parent: AstNode$1 | Token$1 | null;
    parents: Generator<Token$1>;
}

/**
 * Error description
 */
export declare interface ErrorDescription$1 {
    /**
     *  Drop rule or declaration
     */

    action: "drop" | "ignore";
    /**
     * Error message
     */
    message: string;
    /**
     * Syntax error description
     */
    syntax?: string | ValidationToken$1 | null;
    /**
     * Error node
     */
    node?: Token$1 | AstNode$1 | null;
    /**
     * Error location
     */
    location?: Location;
    /**
     * Error object
     */
    error?: Error;
    /**
     * Raw tokens
     */
    rawTokens?: TokenizeResult[];
}

/**
 * CSS validation options
 */
interface ValidationOptions {
    /**
     * Nested rule context
     * @private
     */
    nestedRule?: boolean;

    /**
     * Enable CSS validation. Using ValidationLevel as value is deprecated and will be removed
     *
     * see {@link ValidationLevel}
     */
    validation?: boolean | ValidationLevel;

    /**
     * Lenient validation. retain nodes that failed validation
     */
    lenient?: boolean;

    /**
     * Visited tokens
     *
     * @private
     */
    visited?: Map<Token$1, Set<ValidationToken$1>>;

    /**
     * Is optional
     *
     * @private
     */
    isOptional?: boolean | null;

    /**
     * Is repeatable
     *
     * @private
     */
    isRepeatable?: boolean | null;

    /**
     * Is list
     *
     * @private
     */
    isList?: boolean | null;

    /**
     * Occurence
     *
     * @private
     */
    occurrence?: boolean | null;

    /**
     * At least once
     *
     * @private
     */
    atLeastOnce?: boolean | null;
}

/**
 * Minify options
 */
interface MinifyOptions {
    /**
     * Enable minification
     */
    minify?: boolean;
    /**
     * Parse color tokens
     */
    parseColor?: boolean;
    /**
     * Generate nested rules
     */
    nestingRules?: boolean;
    /**
     * Remove duplicate declarations from the same rule. if passed as a string array, duplicated declarations are removed, except for those in the array
     *
     *
     * ```ts
     *
     * import {transform} from '@tbela99/css-parser';
     *
     * const css = `
     *
     * .table {
     *
     *     width: 100%;
     *     width: calc(100% + 40px);
     *     margin-left: 20px;
     *     margin-left: min(100% , 20px)
     * }
     *
     * `;
     * const result = await transform(css, {
     *
     *     beautify: true,
     *     validation: true,
     *     removeDuplicateDeclarations: ['width']
     * }
     * );
     *
     * console.log(result.code);
     *
     * ```
     */
    removeDuplicateDeclarations?: boolean | string | string[];
    /**
     * Compute shorthand properties
     */
    computeShorthand?: boolean;
    /**
     * Compute css transform functions
     */
    computeTransform?: boolean;
    /**
     * Compute css math functions
     */
    computeCalcExpression?: boolean;
    /**
     * Inline css variables
     */
    inlineCssVariables?: boolean;
    /**
     * Remove empty ast nodes
     */
    removeEmpty?: boolean;
    /**
     * Remove css prefix
     */
    removePrefix?: boolean;
    /**
     * Define minification passes.
     */
    pass?: number;
}

/**
 * Result of options.load() function call.
 */
export declare type LoadResult =
    | Promise<ReadableStream<Uint8Array>>
    | ReadableStream<Uint8Array>
    | string
    | Promise<string>;

/**
 * CSS module parser options
 */
export declare interface ModuleOptions {
    /**
     * Use local scope vs global scope
     */
    scoped?: boolean | ModuleScopeEnumOptions;

    /**
     * Module output file path. it is used to generate the scoped name. if not provided, [options.src](../docs/interfaces/node.ParserOptions.html#src) will be used
     */
    filePath?: string;

    /**
     * Generated scope hash length. the default is 5
     */
    hashLength?: number;

    /**
     * The pattern used to generate scoped names. the supported placeholders are:
     * - name: the file base name without the extension
     * - hash: the file path hash
     * - local: the local name
     * - path: the file path
     * - folder: the folder name
     * - ext: the file extension
     *
     * the pattern can optionally have a maximum number of characters:
     * ```
     * pattern: '[local:2]-[hash:5]'
     * ```
     * the hash pattern can take an algorithm, a maximum number of characters or both:
     * ```
     * pattern: '[local]-[hash:base64:5]'
     * ```
     * or
     * ```
     * pattern: '[local]-[hash:5]'
     * ```
     * or
     * ```
     * pattern: '[local]-[hash:sha1]'
     * ```
     *
     * supported hash algorithms are:
     * - base64
     * - hex
     * - base64url
     * - sha1
     * - sha256
     * - sha384
     * - sha512
     *
     * ```typescript
     *
     * import {transform, ModuleCaseTransformEnum} from '@tbela99/css-parser';
     * import type {TransformResult} from '@tbela99/css-parser';
     * css = `
     * :local(.className) {
     *   background: red;
     *   color: yellow;
     * }
     *
     * :local(.subClass) {
     *   composes: className;
     *   background: blue;
     * }
     * `;
     *
     * let result: TransformResult = await transform(css, {
     *
     *     beautify:true,
     *     module: {
     *         pattern: '[local]-[hash:sha256]'
     *     }
     *
     * });
     *
     * console.log(result.code);
     * ```
     * generated css
     *
     * ```css
     * .className-b629f {
     *  background: red;
     *  color: #ff0
     * }
     * .subClass-a0c35 {
     *  background: blue
     * }
     * ```
     */
    pattern?: string;

    /**
     * optional. function change the case of the scoped name and the class mapping
     *
     * - {@link ModuleCaseTransformEnum.IgnoreCase}: do not change case
     * - {@link ModuleCaseTransformEnum.CamelCase}: camelCase {@link ParseResult.mapping} key name
     * - {@link ModuleCaseTransformEnum.CamelCaseOnly}: camelCase {@link ParseResult.mapping} key name and the scoped class name
     * - {@link ModuleCaseTransformEnum.DashCase}: dashCase {@link ParseResult.mapping} key name
     * - {@link ModuleCaseTransformEnum.DashCaseOnly}: dashCase {@link ParseResult.mapping} key name and the scoped class name
     *
     */
    naming?: ModuleCaseTransformEnum;

    /**
     * Function to generate scoped name
     * @param localName
     * @param filePath
     * @param pattern see {@link ModuleOptions.pattern}
     * @param hashLength
     */
    generateScopedName?: (
        localName: string,
        filePath: string,
        pattern: string,
        hashLength?: number,
    ) => string | Promise<string>;
}

/**
 * Input file options
 */
export declare interface ParseInputFileOptions {
    /**
     * File path or url
     */
    file: string;
    /**
     * Load file as stream
     */

    asStream?: boolean;
}

/**
 * Input options for string or stream
 */
export declare interface ParseInputStreamOptions {
    /**
     * Input string or stream
     */
    input: string | ReadableStream<Uint8Array>;
}

/**
 * Parser options
 */
export declare interface ParserOptions
    extends MinifyOptions, MinifyFeatureOptions, ValidationOptions, PropertyListOptions {
    /**
     * Source file to be used for sourcemap
     */
    src?: string;
    /**
     * Include sourcemap in the ast. Sourcemap info is always generated
     */
    sourcemap?: boolean | "inline";
    /**
     * Remove at-rule charset
     */
    removeCharset?: boolean;
    /**
     * Resolve import
     */
    resolveImport?: boolean;
    /**
     * Current working directory
     *
     * @internal
     */
    cwd?: string;
    /**
     * Expand nested rules
     */
    expandNestingRules?: boolean;

    /**
     * Experimental, convert css if() function into legacy syntax.
     */
    expandIfSyntax?: boolean;

    /**
     * Custom URL and file loader.
     * @param url
     * @param currentDirectory
     * @param responseType
     *
     */
    load?: (
        url: string | { absolute: string; relative: string },
        currentDirectory: string,
        responseType?: boolean | ResponseType,
    ) => Promise<string | ArrayBuffer | ReadableStream<Uint8Array<ArrayBufferLike>>>;
    /**
     * Get directory name
     * @param path
     *
     * @private
     */
    dirname?: (path: string) => string;
    /**
     * Resolve urls
     */
    resolveUrls?: boolean;
    /**
     * Url and path resolver
     * @param url
     * @param currentUrl
     * @param currentWorkingDirectory
     *
     */
    resolve?: (
        url: string,
        currentUrl: string,
        currentWorkingDirectory?: string,
    ) => {
        /**
         * Absolute path
         */
        absolute: string;
        /**
         * Relative path
         */
        relative: string;
    };

    /**
     * Node visitor
     * {@link VisitorNodeMap | VisitorNodeMap[]}
     */
    visitor?: VisitorNodeMap | VisitorNodeMap[];
    /**
     * Abort signal
     *
     * Example: abort after 10 seconds
     * ```ts
     *
     * const result = await parse(cssString, {
     *     signal: AbortSignal.timeout(10000)
     * });
     *
     * ```
     */
    signal?: AbortSignal;
    /**
     * Set parent node
     *
     * @private
     */
    setParent?: boolean;
    /**
     * Cache
     *
     * @private
     */
    cache?: WeakMap<AstNode$1, string>;

    /**
     * CSS modules options
     */
    module?: boolean | ModuleCaseTransformEnum | ModuleScopeEnumOptions | ModuleOptions;

    /**
     * Tokenizing info
     * @private
     */
    parseInfo?: ParseInfo;
}

/**
 * Minify feature options
 *
 * @internal
 */
export declare interface MinifyFeatureOptions {
    /**
     * Minify features
     *
     * @private
     */
    features?: MinifyFeature[];
}

/**
 * Minify feature
 *
 * @internal
 */
export declare interface MinifyFeature {
    /**
     * Accepted tokens
     */
    accept?: Set<EnumToken>;

    /**
     * Ordering
     */
    ordering: number;
    /**
     * Process mode
     */
    processMode: FeatureWalkMode;
    /**
     * Register feature
     * @param options
     */
    register: (options: MinifyFeatureOptions | ParserOptions) => void;
    /**
     * Run feature
     * @param ast
     * @param options
     * @param parent
     * @param context
     * @param mode
     */
    run: (
        ast: AstRule | AstAtRule,
        options: ParserOptions,
        parent: AstRule | AstAtRule | AstStyleSheet,
        context: {
            [key: string]: any;
        },
        mode: FeatureWalkMode,
    ) => AstNode$1 | null;
}

/**
 * Resolved path
 * @internal
 */
export declare interface ResolvedPath {
    /**
     * Absolute path
     */
    absolute: string;
    /**
     * Relative path
     */
    relative: string;
}

/**
 * Ast node render options
 */
export declare interface RenderOptions {
    /**
     * Minify css values.
     */
    minify?: boolean;
    /**
     * Pretty print css
     *
     * ```ts
     * const result = await transform(css, {beautify: true});
     * ```
     */
    beautify?: boolean;
    /**
     * Remove empty nodes. Empty nodes are removed by default
     *
     * ```ts
     *
     * const css = `
     * @supports selector(:-ms-input-placeholder) {
     *
     * :-ms-input-placeholder {
     *
     * }
     * }`;
     * const result = await transform(css, {removeEmpty: false});
     * ```
     */
    removeEmpty?: boolean;
    /**
     * Expand nesting rules
     */
    expandNestingRules?: boolean;
    /**
     * Preserve license comments. License comments are comments that start with '/*!'
     */
    preserveLicense?: boolean;
    /**
     * Generate sourcemap object. 'inline' will embed it in the css
     */
    sourcemap?: boolean | "inline";
    /**
     * Indention string
     */
    indent?: string;
    /**
     * New line string
     */
    newLine?: string;
    /**
     * Remove comments
     */
    removeComments?: boolean;
    /**
     * Convert color to the specified color space. 'true' will convert to HEX
     */
    convertColor?: boolean | ColorType;
    /**
     * Render the node along with its parents
     */
    withParents?: boolean;
    /**
     * Output file. Used for url resolution
     * @internal
     */
    output?: string;
    /**
     * Current working directory
     * @internal
     */
    cwd?: string;
    /**
     * Resolve path
     * @internal
     */
    resolve?: (url: string, currentUrl: string, currentWorkingDirectory?: string) => ResolvedPath;
}

/**
 * Transform options
 */
export declare interface TransformOptions extends ParserOptions, RenderOptions {}

/**
 * Parse result stats object
 */
export declare interface ParseResultStats {
    /**
     * Source file
     */
    src: string;
    /**
     * Bytes read
     */
    bytesIn: number;
    /**
     * Bytes read from imported files
     */
    importedBytesIn: number;

    /**
     * Tokenizing processing time
     */

    tokenize: string;
    /**
     * Parsing processing time
     */
    parse: string;
    /**
     * Minification processing time
     */
    minify: string;
    /**
     * Module processing time
     */
    module?: string;
    /**
     * Total time
     */
    total: string;
    /**
     * Imported files stats
     */
    imports: ParseResultStats[];

    /**
     * Nodes count
     */
    nodesCount: number;

    /**
     * Tokens count
     */
    tokensCount: number;
}

/**
 * Parse result object
 */
export declare interface ParseResult {
    /**
     * Parsed ast tree
     */
    ast: AstStyleSheet;
    /**
     * Parse errors
     */
    errors: ErrorDescription$1[];
    /**
     * Parse stats
     */
    stats: ParseResultStats;

    /**
     * CSS module mapping
     */
    mapping?: Record<string, string>;

    /**
     * CSS module variables
     * @private
     */
    cssModuleVariables?: Record<string, CssVariableToken$1>;

    /**
     * css module import mapping
     * @private
     */
    importMapping?: Record<string, Record<string, string>>;

    /**
     * CSS module reverse mapping
     * @private
     */
    revMapping?: Record<string, string>;
}

/**
 * Render result object
 */
export declare interface RenderResult {
    /**
     * Rendered CSS
     */
    code: string;
    /**
     * Render errors
     */
    errors: ErrorDescription$1[];
    /**
     * Render stats
     */
    stats: {
        /**
         * Render time
         */
        total: string;
    };
    /**
     * Source map
     */
    map?: SourceMap;
}

/**
 * Transform result object
 */
export declare interface TransformResult extends ParseResult, RenderResult {
    /**
     * Transform stats
     */
    stats: {
        /**
         * Source file
         */
        src: string;
        /**
         * Bytes read
         */
        bytesIn: number;
        /**
         * Generated CSS size
         */
        bytesOut: number;
        /**
         * Bytes read from imported files
         */
        importedBytesIn: number;
        /**
         * Parse time
         */
        parse: string;
        /**
         * Minify time
         */
        minify: string;
        /**
         * Render time
         */
        render: string;
        /**
         * Total time
         */
        total: string;
        /**
         * Imported files stats
         */
        imports: ParseResultStats[];
    };
}

/**
 * Parse token options
 */
export declare interface ParseTokenOptions extends ParserOptions {}

/**
 * Tokenize result object
 * @internal
 */
export declare interface TokenizeResult {
    /**
     * Token
     */
    token: Token$1;
    /**
     * Bytes in
     */
    bytesIn: number;
}

/**
 * Matched selector object
 * @internal
 */
export declare interface MatchedSelector {
    /**
     * Matched selector
     */
    match: string[][];
    /**
     * Selector 1
     */
    selector1: string[][];
    /**
     * Selector 2
     */
    selector2: string[][];
    /**
     * Selectors partially match
     */
    eq: boolean;
}

/**
 * Variable scope info object
 * @internal
 */
export declare interface VariableScopeInfo {
    /**
     * Global scope
     */
    globalScope: boolean;
    /**
     * Parent nodes
     */
    parent: Set<AstRule | AstAtRule>;
    /**
     * Declaration count
     */
    declarationCount: number;
    /**
     * Replaceable
     */
    replaceable: boolean;
    /**
     * Declaration node
     */
    node: AstDeclaration;
    /**
     * Declaration values
     */
    values: Token$1[];
}

/**
 * Source map object
 * @internal
 */
export declare interface SourceMapObject {
    /**
     * Source map version
     */
    version: number;
    /**
     * Source file
     */
    file?: string;
    /**
     * Source root
     */
    sourceRoot?: string;
    /**
     * Source files
     */
    sources?: string[];
    /**
     * Source files content
     */
    sourcesContent?: Array<string | null>;
    /**
     * Variable names
     */
    names?: string[];
    /**
     * Mappings
     */
    mappings: string;
}

/**
 * return the directory name of a path
 * @param path
 *
 * @private
 */
declare function dirname(path: string): string;
/**
 * resolve path
 * @param url url or path to resolve
 * @param currentDirectory directory used to resolve the path
 * @param cwd current working directory
 *
 * @private
 */
declare const resolve: (url: string, currentDirectory?: string, cwd?: string) => {
    absolute: string;
    relative: string;
};

/**
 * response type
 */
declare enum ResponseType$1 {
    /**
     * return text
     */
    Text = 0,
    /**
     * return a readable stream
     */
    ReadableStream = 1,
    /**
     * return an arraybuffer
     */
    ArrayBuffer = 2
}

export declare interface ValidationSyntaxNode {
    syntax: string;
    ast?: ValidationToken[];
    descriptors?: Record<string, Record<string, string>>;
}

interface ValidationSelectorOptions extends ValidationOptions {
    nestedSelector?: boolean;
}

export declare interface ValidationMediaFeature {
    type: MediaFeatureType;
    status?: string;
    category: string;
    values?: Array<string> | Array<number>;
}

export declare type ValidationConfiguration = Record<
    ValidationSyntaxGroupEnum,
    ValidationSyntaxNode | Record<string, string[]> | Record<string, ValidationMediaFeature>
>;

interface ValidationResult {
    valid: SyntaxValidationResult;
    node: AstNode$1 | Token$1 | null;
    syntax: ValidationToken | string | null;
    error: string;
    cycle?: boolean;
}

interface ValidationSyntaxResult extends ValidationResult {
    syntax: ValidationToken | string | null;
    context: Context<Token$1> | Token$1[];
}

interface Context<Type> {
    index: number;

    /**
     * The length of the context tokens to be consumed
     */

    readonly length: number;

    current<Type>(): Type | null;

    update<Type>(context: Context<Type>): void;

    consume<Type>(token: Type, howMany?: number): boolean;

    peek<Type>(): Type | null;

    // tokens<Type>(): Type[];

    next<Type>(): Type | null;

    consume<Type>(token: Type, howMany?: number): boolean;

    slice<Type>(): Type[];

    clone<Type>(): Context<Type>;

    done(): boolean;
}

/**
 * Apply minification rules to the ast tree
 * @param ast
 * @param options
 * @param recursive
 * @param errors
 * @param nestingContent
 *
 * @private
 */
declare function minify(ast: AstNode$1, options: ParserOptions | MinifyFeatureOptions, recursive: boolean, errors?: ErrorDescription$1[], nestingContent?: boolean): AstNode$1;

/**
 * expand css nesting ast nodes
 * @param ast
 *
 * @private
 */
declare function expand(ast: AstStyleSheet | AstAtRule | AstRule): AstNode$1;

/**
 * Parse a string as an array of declaration nodes
 * @param declaration
 *
 * Example:
 * ````ts
 *
 * const declarations = await parseDeclarations('color: red; background: blue');
 * console.log(declarations);
 * ```
 */
declare function parseDeclarations(declaration: string): Promise<Array<AstDeclaration | AstComment>>;
/**
 * Parse css string and return an array of tokens
 * @param src
 * @param options
 *    - parseColor: parse identifiers as colors
 *    - src: source url used for source map
 * @param errors capture parse errors in the provided array

 *
 * Example:
 *
 * ```ts
 *
 * import {parseString} from '@tbela99/css-parser';
 *
 * let tokens = parseString('body { color: red; }');
 * console.log(tokens);
 *
 * tokens = parseString('#c322c980');
 * console.log(tokens);
 * ```
 */
declare function parseString(src: string, options?: {
    src?: string;
    parseColor?: boolean;
} | null, errors?: ErrorDescription$1[]): Token$1[];

/**
 * render ast token
 * @param token
 * @param options
 * @private
 */
declare function renderValue(token: Token$1, options?: RenderOptions, cache?: {
    [key: string]: any;
}, reducer?: null | ((acc: string, curr: Token$1) => string), errors?: ErrorDescription$1[]): string;

/**
 * Converts a color to another color space
 * @param token
 * @param to
 *
 * ```ts
 *
 *     const token = {typ: EnumToken.ColorTokenType, kin: ColorType.HEX, val: '#F00'}
 *     const result = convertColor(token, ColorType.LCH);
 *
 * ```
 */
declare function convertColor(token: ColorToken, to: ColorType$1): ColorToken | null;

/**
 * Calculate the distance between two okLab colors.
 * @param okLab1
 * @param okLab2
 *
 * @private
 * {@link https://drafts.csswg.org/css-color-4/#comparing-color-values}
 */
declare function okLabDistance(color1: ColorToken, color2: ColorToken): number | null;
/**
 * Check if two colors are close in okLab space.
 * @param color1
 * @param color2
 * @param threshold
 *
 * @private
 */
declare function isOkLabClose(color1: ColorToken, color2: ColorToken, threshold?: number): boolean;

/**
 * Search the ast tree and return the first match
 *
 * ```ts
 *  // find the first ast declaration node which name is 'aspect-ratio'
import { find, EnumToken, transform } from "@tbela99/css-parser";
import type { AstNode } from "@tbela99/css-parser";

 * const css = `

button {
  aspect-ratio: 1;
  width: if(media(any-pointer: fine): 30px; else: 44px);
}
    `;

 // find declaration which contain a '30px'
  const nodeMatcher = (node: AstNode) =>
      return node.typ == EnumToken.DeclarationNodeType && (node as AstDeclaration).nam == 'aspect-ratio';

     const result  = await transform(css);
     const node = find(result.ast, nodeMatcher);

     console.log({node});
 
    ```
 *
 * @param ast
 * @param matcher
 * @returns
 */
declare function find(ast: AstNode$1, matcher: (node: AstNode$1) => boolean): AstNode$1 | null;
/**
 * Search the ast tree by checking each node's value token and return the first match
 *
 * ```ts
 *  // find the first ast node which contains the length token '30px'
import { findByValue, EnumToken, transform } from "@tbela99/css-parser";
import type { AstNode } from "@tbela99/css-parser";

 * const css = `

button {
  aspect-ratio: 1;
  width: if(media(any-pointer: fine): 30px; else: 44px);
}
    `;

 // find declaration which contain the length token '30px'
  const nodeMatcher = (value: Token) =>
      return value.typ == EnumToken.LengthTokenType && (value as LengthToken).val == 30 && (value as LengthToken).unit == 'px' ;

     const result  = await transform(css);
     const { node, value } = findByValue(result.ast, nodeMatcher) ?? {};

     console.log({node, value});
 
    ```
 *
 * @param ast
 * @param matcher
 * @returns
 */
declare function findByValue(ast: AstNode$1, matcher: AstValueMatcher): {
    node: AstNode$1;
    value: TokenSearchResult;
} | null;
/**
 * Search the ast tree and return all matches
 *
 * ```ts
 *  // find the first ast declaration node which name is 'aspect-ratio'
*  import { findAll, EnumToken, transform } from "@tbela99/css-parser";
*  import type { AstNode } from "@tbela99/css-parser";

const css = `

button {
  aspect-ratio: 1;
  width: if(media(any-pointer: fine): 30px; else: 44px);
}
    `;

 // find declaration which contain a '30px'
  const nodeMatcher = (node: AstNode) =>
      return node.typ == EnumToken.DeclarationNodeType && (node as AstDeclaration).nam == 'aspect-ratio';

     const result  = await transform(css);
     const nodes = findAll(result.ast, nodeMatcher);

     console.log({nodes});
 
    ```
 *
 * @param ast
 * @param matcher
 * @returns
 */
declare function findAll(ast: AstNode$1, matcher: (node: AstNode$1) => boolean): AstNode$1[];
/**
 * Search the ast tree and return the last match.
 *
 * ```ts
 *  // find the first ast declaration node which name is 'aspect-ratio'
import { findLast, EnumToken, transform } from "@tbela99/css-parser";
import type { AstNode } from "@tbela99/css-parser";

 * const css = `

button {
  aspect-ratio: 1;
  width: if(media(any-pointer: fine): 30px; else: 44px);
}
    `;

 // find declaration which contain a '30px'
  const nodeMatcher = (node: AstNode) =>
      return node.typ == EnumToken.DeclarationNodeType && (node as AstDeclaration).nam == 'aspect-ratio';

     const result  = await transform(css);
     const node = findLast(result.ast, nodeMatcher);

     console.log({node});
 
    ```
 *
 * @param ast
 * @param matcher
 * @returns
 */
declare function findLast(ast: AstNode$1, matcher: (node: AstNode$1) => boolean): AstNode$1 | null;

/**
 *
 * Clone an ast node or value
 * @param node
 * @param cloneChildren
 * @param cloneMap
 * @returns
 */
declare function cloneNode(node: AstNode$1 | Token$1, cloneChildren?: boolean, cloneMap?: Map<Token$1 | AstNode$1, Token$1 | AstNode$1> | null): AstNode$1 | Token$1;

/**
 * Replace token in its parent node
 * @param parent
 * @param node
 * @param replacement
 * @throws TypeError replacement is null
 * @throws ReferenceError node not found in parent
 */
declare function replaceNodeOrValue(parent: BinaryExpressionToken | (AstNode$1 & ({
    chi: Token$1[];
} | {
    val: Token$1[];
})), node: Token$1, replacement: Token$1 | Token$1[]): boolean;

/**
 * Load file or url
 * @param url
 * @param currentDirectory
 * @param responseType
 * @throws Error file not found
 *
 * ```ts
 * import {load, ResponseType} from '@tbela99/css-parser';
 * const result = await load(file, '.', ResponseType.ArrayBuffer) as ArrayBuffer;
 * ```
 */
declare function load(url: string | {
    absolute: string;
    relative: string;
}, currentDirectory?: string, responseType?: boolean | ResponseType$1): Promise<string | ArrayBuffer | ReadableStream<Uint8Array<ArrayBufferLike>>>;
/**
 * Render the ast tree
 * @param data
 * @param options
 * @param mapping
 *
 * Example:
 *
 * ```ts
 *
 *  import {render, ColorType} from '@tbela99/css-parser';
 *
 *  const css = 'body { color: color(from hsl(0 100% 50%) xyz x y z); }';
 *  const parseResult = await parse(css);
 *
 * let renderResult = render(parseResult.ast);
 * console.log(result.code);
 *
 * // body{color:red}
 *
 *
 * renderResult = render(parseResult.ast, {beautify: true, convertColor: ColorType.SRGB});
 * console.log(renderResult.code);
 *
 * // body {
 * //  color: color(srgb 1 0 0)
 * // }
 * ```
 */
declare function render(data: AstNode$1, options?: RenderOptions, mapping?: {
    mapping: Record<string, string>;
    importMapping: Record<string, Record<string, string>> | null;
} | null): RenderResult;
/**
 * Parse css file
 * @param file url or path
 * @param options
 * @param asStream load file as stream
 *
 * @deprecated
 * @throws Error file not found
 *
 * Example:
 *
 * ```ts
 *
 *  import {parseFile} from '@tbela99/css-parser';
 *
 *  // remote file
 * let result = await parseFile('https://docs.deno.com/styles.css');
 * console.log(result.ast);
 *
 * // local file
 * result = await parseFile('./css/styles.css');
 * console.log(result.ast);
 * ```
 */
declare const parseFile: (file: string, options?: ParserOptions, asStream?: boolean) => Promise<ParseResult>;
declare function parse(stream: string | ReadableStream<Uint8Array>, options?: ParserOptions): Promise<ParseResult>;
declare function parse(options: ParseInputFileOptions & ParserOptions): Promise<ParseResult>;
declare function parse(options: ParseInputStreamOptions & ParserOptions): Promise<ParseResult>;
/**
 * Transform css file
 * @param file url or path
 * @param options
 * @param asStream load file as stream
 *
 * @deprecated Use transform() instead.
 * @throws Error file not found
 *
 * Example:
 *
 * ```ts
 *
 *  import {transform} from '@tbela99/css-parser';
 *
 *  // remote file
 * let result = await transform({file: 'https://docs.deno.com/styles.css'});
 * console.log(result.code);
 *
 * // local file
 * result = await transform({file: './css/styles.css'});
 * console.log(result.code);
 * ```
 */
declare const transformFile: (file: string, options?: TransformOptions, asStream?: boolean) => Promise<TransformResult>;
declare function transform(css: string | ReadableStream<Uint8Array>, options: TransformOptions): Promise<TransformResult>;
declare function transform(options: ParseInputFileOptions & TransformOptions): Promise<TransformResult>;
declare function transform(options: ParseInputStreamOptions & TransformOptions): Promise<TransformResult>;

export { ColorType$1 as ColorType, EnumAstNodeStatus$1 as EnumAstNodeStatus, EnumToken, FeatureWalkMode, ModuleCaseTransformEnum, ModuleScopeEnumOptions, ResponseType$1 as ResponseType, SourceMap, ValidationLevel, WalkerEvent, WalkerOptionEnum, cloneNode, convertColor, dirname, expand, find, findAll, findByValue, findLast, isOkLabClose, load, minify, okLabDistance, parse, parseDeclarations, parseFile, parseString, render, renderValue as renderToken, replaceNodeOrValue, resolve, transform, transformFile, walk, walkValues };
export type { AddToken, AndToken, AngleToken, AstAtRule, AstComment, AstDeclaration, AstInvalidAtRule, AstInvalidDeclaration, AstInvalidRule, AstKeyFrameRule, AstKeyframesAtRule, AstKeyframesRule, AstNode$1 as AstNode, AstNodeStatus, AstRule, AstRuleList, AstStyleSheet, AstValueMatcher, AtRuleToken, AtRuleVisitorHandler, AttrEndToken, AttrStartToken, AttrToken, Background, BackgroundAttachmentMapping, BackgroundPosition, BackgroundPositionClass, BackgroundPositionConstraints, BackgroundPositionMapping, BackgroundProperties, BackgroundRepeat, BackgroundRepeatMapping, BackgroundSize, BackgroundSizeMapping, BadCDOCommentToken, BadCommentToken, BadStringToken, BadUrlToken, BaseToken, BinaryExpressionNode, BinaryExpressionToken, BlockEndToken, BlockStartToken, Border, BorderColor, BorderColorClass, BorderProperties, BorderRadius, CDOCommentToken, ChildCombinatorToken, ClassSelectorToken, ColonToken, ColorToken, ColumnCombinatorToken, CommaToken, CommentToken, ComposesSelectorToken, ConstraintsMapping, ContainMatchToken, ContainerStyleRangeToken, Context, CssVariableImportTokenType$1 as CssVariableImportTokenType, CssVariableMapTokenType, CssVariableToken$1 as CssVariableToken, DashMatchToken, DashedIdentToken, DeclarationVisitorHandler, DelimToken, DescendantCombinatorToken, DimensionToken, DivToken, DoubleColonToken, EOFToken, EndMatchToken, EqualMatchToken, ErrorDescription$1 as ErrorDescription, FlexToken, Font, FontFamily, FontProperties, FontWeight, FontWeightConstraints, FontWeightMapping, FractionToken, FrequencyToken, FunctionDefToken, FunctionImageToken, FunctionToken, FunctionURLToken, GenericVisitorAstNodeHandlerMap, GenericVisitorHandler, GenericVisitorResult, GreaterThanOrEqualToken, GreaterThanToken, GridTemplateFuncToken, HashToken, IdentListToken, IdentToken, IfConditionToken, IfElseConditionToken, ImportantToken, IncludeMatchToken, InvalidAttrToken, InvalidClassSelectorToken, InvalidMediaQueryToken, LengthToken, LessThanOrEqualToken, LessThanToken, LineHeight, ListToken, LiteralToken, LoadResult, Location, Map$1 as Map, MatchExpressionToken, MatchedSelector, MediaFeatureOnlyToken, MediaFeatureToken, MediaQueryConditionToken, MediaQueryUnaryFeatureToken, MediaRangeQueryToken, MinifyFeature, MinifyFeatureOptions, MinifyOptions, ModuleOptions, MulToken, NameSpaceAttributeToken, NestingSelectorToken, NextSiblingCombinatorToken, NotToken, NumberToken, OptimizedSelector, OptimizedSelectorToken, OrToken, Outline, OutlineProperties, ParensEndToken, ParensStartToken, ParensToken, ParseInfo$1 as ParseInfo, ParseInputFileOptions, ParseInputStreamOptions, ParseResult, ParseResultStats, ParseTokenOptions, ParserOptions, PercentageToken, Position$1 as Position, Prefix, PropertiesConfig, PropertiesConfigProperties, PropertyListOptions, PropertyMapType, PropertySetType, PropertyType, PseudoClassFunctionToken, PseudoClassToken, PseudoElementToken, PseudoPageToken, PurpleBackgroundAttachment, RawNodeToken, RawSelectorTokens, RenderOptions, RenderResult, ResolutionToken, ResolvedPath, RuleVisitorHandler, SemiColonToken, Separator, ShorthandDef, ShorthandMapType, ShorthandProperties, ShorthandPropertyType, ShorthandType, SinglePropertyType, SinglePropertyTypeMapping, SourceMapObject, StartMatchToken, StringToken, SubToken, SubsequentCombinatorToken, SupportsQueryConditionToken, SupportsQueryUnaryConditionToken, TimeToken, TimelineFunctionToken, TimingFunctionToken, Token$1 as Token, TokenSearchResult, TokenizeResult, TransformOptions, TransformResult, UnaryExpression, UnaryExpressionNode, UnclosedStringToken, UniversalSelectorToken, UrlToken, ValidationConfiguration, ValidationMediaFeature, ValidationOptions, ValidationResult, ValidationSelectorOptions, ValidationSyntaxNode, ValidationSyntaxResult, ValidationToken$1 as ValidationToken, Value, ValueVisitorHandler, VariableScopeInfo, VisitorNodeMap, WalkAttributesResult, WalkResult, WalkerFilter, WalkerOption, WalkerValueFilter, WhenElseQueryConditionToken, WhenElseUnaryConditionToken, WhitespaceToken, WrappedValuesToken };
