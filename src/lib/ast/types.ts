import type { LengthToken, NumberToken } from "../../@types/token.d.ts";

/**
 * Syntax validation enum
 */
export enum SyntaxValidationResult {
    /** valid syntax */
    Valid,
    /** drop invalid syntax */
    Drop,
    /** preserve unknown at-rules, declarations and pseudo-classes */
    Lenient,
}

/**
 * Enum of node statuses
 */
export enum EnumAstNodeStatus {
    /**
     * Node passed validation
     */
    Validated,
    /**
     * Node is invalid
     */
    Invalid,
    /**
     * node is not validated
     */
    Unvalidated,
    /**
     * Node did not pass validation, but is preserved.
     */
    ValidationFailed,
    /**
     * Parsing the node is not supported yet or the node syntax definition does not exist.
     */
    Unknown,
    /**
     * Failed to parse the node.
     */
    Unparsed,
    /**
     * Node is disallowed in the context
     */
    Disallowed,
    /**
     * Node is malformed
     */
    Malformed,
}

/**
 * Enum of validation levels
 * @deprecated
 */
export enum ValidationLevel {
    /**
     * disable validation
     */
    None,
    /**
     * validate selectors
     */
    Selector = 0x1,
    /**
     * validate at-rules
     */
    AtRule = 0x2,

    /**
     * validate declarations
     */
    Declaration = 0x4,
    /**
     * validate selectors and at-rules
     */
    Default = Selector | AtRule, // selectors + at-rules
    /**
     * validate selectors, at-rules and declarations
     */
    All = Selector | AtRule | Declaration, // selectors + at-rules + declarations

    /**
     * Report only. Apply validation and report nodes that are marked as invalid
     */
    ReportOnly = 0x8,
}

/**
 * Enum of all token types
 */
export enum EnumToken {
    /**
     * comment token
     */
    CommentTokenType,
    /**
     * cdata section token
     */
    CDOCOMMTokenType,
    /**
     * style sheet node type
     */
    StyleSheetNodeType,
    /**
     * at-rule node type
     */
    AtRuleNodeType,
    /**
     * rule node type
     */
    RuleNodeType,
    /**
     * declaration node type
     */
    DeclarationNodeType,
    /**
     * literal token type
     */
    LiteralTokenType,
    /**
     * identifier token type
     */
    IdenTokenType,
    /**
     * dashed identifier token type
     */
    DashedIdenTokenType,
    /**
     * comma token type
     */
    CommaTokenType,
    /**
     * colon token type
     */
    ColonTokenType,
    /**
     * semicolon token type
     */
    SemiColonTokenType,
    /**
     * number token type
     */
    NumberTokenType,
    /**
     * at-rule token type
     */
    AtRuleTokenType,
    /**
     * percentage token type
     */
    PercentageTokenType,
    /**
     * function token type
     */
    FunctionTokenType,
    /**
     * timeline function token type
     */
    TimelineFunctionTokenType,
    /**
     * timing function token type
     */
    TimingFunctionTokenType,
    /**
     * url function token type
     */
    UrlFunctionTokenType,
    /**
     * image function token type
     */
    ImageFunctionTokenType,
    /**
     * string token type
     */
    StringTokenType,
    /**
     * unclosed string token type
     */
    UnclosedStringTokenType,
    /**
     * dimension token type
     */
    DimensionTokenType,
    /**
     * length token type
     */
    LengthTokenType,
    /**
     * angle token type
     */
    AngleTokenType,
    /**
     * time token type
     */
    TimeTokenType,
    /**
     * frequency token type
     */
    FrequencyTokenType,
    /**
     * resolution token type
     */
    ResolutionTokenType,
    /**
     * hash token type
     */
    HashTokenType,
    /**
     * block start token type
     */
    BlockStartTokenType,
    /**
     * block end token type
     */
    BlockEndTokenType,
    /**
     * attribute start token type
     */
    AttrStartTokenType,
    /**
     * attribute end token type
     */
    AttrEndTokenType,
    /**
     * start parentheses token type
     */
    StartParensTokenType,
    /**
     * end parentheses token type
     */
    EndParensTokenType,
    /**
     * parentheses token type
     */
    ParensTokenType,
    /**
     * whitespace token type
     */
    WhitespaceTokenType,
    /**
     * include match token type
     */
    IncludeMatchTokenType,
    /**
     * dash match token type
     */
    DashMatchTokenType,
    /**
     * equal match token type
     */
    EqualMatchTokenType,
    /**
     * less than token type
     */
    LtTokenType,
    /**
     * less than or equal to token type
     */
    LteTokenType,
    /**
     * greater than token type
     */
    GtTokenType,
    /**
     * greater than or equal to token type
     */
    GteTokenType,
    /**
     * pseudo-class token type
     */
    PseudoClassTokenType,
    /**
     * pseudo-class function token type
     */
    PseudoClassFuncTokenType,
    /**
     * delimiter token type
     */
    DelimTokenType,
    /**
     * URL token type
     */
    UrlTokenTokenType,
    /**
     * end of file token type
     */
    EOFTokenType,
    /**
     * important token type
     */
    ImportantTokenType,
    /**
     * color token type
     */
    ColorTokenType,
    /**
     * attribute token type
     */
    AttrTokenType,
    /**
     * bad comment token type
     */
    BadCommentTokenType,
    /**
     * bad cdo token type
     */
    BadCdoTokenType,
    /**
     * bad URL token type
     */
    BadUrlTokenType,
    /**
     * bad string token type
     */
    BadStringTokenType,
    /**
     * binary expression token type
     */
    BinaryExpressionTokenType,
    /**
     * unary expression token type
     */
    UnaryExpressionTokenType,
    /**
     * flex token type
     */
    FlexTokenType,
    /**
     *  token list token type
     */
    ListToken,
    /* arithmetic tokens */
    /**
     * addition token type
     */
    Add,
    /**
     * multiplication token type
     */
    Mul,
    /**
     * division token type
     */
    Div,
    /**
     * subtraction token type
     */
    Sub,
    /* new tokens */
    /**
     * column combinator token type
     */
    ColumnCombinatorTokenType,
    /**
     * contain match token type
     */
    ContainMatchTokenType,
    /**
     * start match token type
     */
    StartMatchTokenType,
    /**
     * end match token type
     */
    EndMatchTokenType,
    /**
     * match expression token type
     */
    MatchExpressionTokenType,
    /**
     * namespace attribute token type
     */
    NameSpaceAttributeTokenType,
    /**
     * fraction token type
     */
    FractionTokenType,
    /**
     * identifier list token type
     */
    IdenListTokenType,
    /**
     * grid template function token type
     */
    GridTemplateFuncTokenType,
    /**
     * keyframe rule node type
     */
    KeyFramesRuleNodeType,
    /**
     * class selector token type
     */
    ClassSelectorTokenType,
    /**
     * universal selector token type
     */
    UniversalSelectorTokenType,
    /**
     * child combinator token type
     */
    ChildCombinatorTokenType, // >
    /**
     * descendant combinator token type
     */
    DescendantCombinatorTokenType, // whitespace
    /**
     * next sibling combinator token type
     */
    NextSiblingCombinatorTokenType, // +
    /**
     * subsequent sibling combinator token type
     */
    SubsequentSiblingCombinatorTokenType, // ~
    /**
     * nesting selector token type
     */
    NestingSelectorTokenType, // &
    /**
     * Invalid rule token type
     * @deprecated
     */
    InvalidRuleNodeType,
    /**
     * invalid class selector token type
     */
    InvalidClassSelectorTokenType,
    /**
     * invalid attribute token type
     */
    InvalidAttrTokenType,
    /**
     * Invalid at rule token type
     * @deprecated
     */
    InvalidAtRuleNodeType,
    /**
     * media query condition token type
     */
    MediaQueryConditionTokenType,
    /**
     * media feature token type
     */
    MediaFeatureTokenType,
    /**
     * media feature only token type
     */
    OnlyTokenType,
    /**
     * media feature not token type
     */
    NotTokenType,

    /**
     * media feature and token type
     */
    AndTokenType,
    /**
     * media feature or token type
     */
    OrTokenType,
    /**
     * pseudo page token type
     */
    PseudoPageTokenType,
    /**
     * pseudo element token type
     */
    PseudoElementTokenType,
    /**
     * keyframe at rule node type
     */
    KeyframesAtRuleNodeType,
    /**
     * invalid declaration node type.
     * @deprecated
     */
    InvalidDeclarationNodeType,

    /* css module nodes */

    /**
     * composes token node type
     */
    ComposesSelectorNodeType,

    /**
     * css variable token type
     */
    CssVariableTokenType,

    /**
     * css variable import token type
     */
    CssVariableImportTokenType,

    /**
     * css variable declaration map token type
     */
    CssVariableDeclarationMapTokenType,

    /**
     * media range query token type
     */
    MediaRangeQueryTokenType,

    /**
     * invalid media query token type
     */
    InvalidMediaQueryTokenType,

    /**
     * supports query condition token type
     */
    SupportsQueryConditionTokenType,

    /**
     * supports query unary condition token type
     */
    SupportsQueryUnaryConditionTokenType,

    /**
     * when else query condition token type
     */
    WhenElseQueryConditionTokenType,

    /**
     * when else query unary condition token type
     */
    WhenElseUnaryConditionTokenType,
    /**
     * container style range token type
     */

    ContainerStyleRangeTokenType,

    /**
     * '*'
     */
    Star,
    /**
     * '+'
     */
    Plus,
    /**
     * '~'
     */
    Tilda,
    /**
     * '|'
     */
    Pipe,
    /**
     * '::'
     */
    DoubleColonTokenType,

    /**
     * math function token type  such as'calc(' etc.
     */
    MathFunctionTokenType,

    /**
     * transform function token type such as 'translate(' etc.
     */
    TransformFunctionTokenType,

    /**
     * when function token type such as 'supports(' etc.
     */

    WhenElseFunctionTokenType,

    /**
     * general enclosed function token type 'font-tech(' etc.
     */
    GeneralEnclosedFunctionTokenType,

    /**
     * supports function token type such as 'at-rule('
     */
    SupportsFunctionTokenType,

    /**
     * container function token type such as 'style(' or 'scroll-state('
     */
    ContainerFunctionTokenType,

    /**
     * unrecognized node token type
     */
    RawNodeTokenType,
    /**
     * media query boolean token type
     * at-rule media not ()
     * at-rule media only ()
     */
    MediaQueryUnaryFeatureTokenType,

    /**
     * grid template function token type such as 'minmax('
     */
    GridTemplateFuncTokenDefType,
    /**
     * image function token type such as 'image(' etc.
     */
    ImageFunctionTokenDefType,
    /**
     * function token type such as 'view(' etc.
     */
    TimelineFunctionTokenDefType,
    /**
     * function token type
     */
    FunctionTokenDefType,
    /**
     * timing function token type such as 'linear(' etc.
     */
    TimingFunctionTokenDefType,
    /**
     * color function token type such as 'rgb(' etc.
     */
    ColorFunctionTokenDefType,
    /**
     * math function token type such as 'calc(' etc.
     */
    MathFunctionTokenDefType,
    /**
     * container function token type such as 'style(' or 'scroll-state('
     */
    ContainerFunctionTokenDefType,
    /**
     * url function token type 'url('
     */
    UrlFunctionTokenDefType,

    /**
     * pseudo-class function token type
     */
    PseudoClassFunctionTokenDefType,

    /**
     * transform function token type such as 'translate(' etc.
     */
    TransformFunctionTokenDefType,

    /**
     * when function token type such as 'supports(' or 'media('
     */

    WhenElseFunctionTokenDefType,

    /**
     * general enclosed function token type 'font-tech(' etc.
     */
    GeneralEnclosedFunctionTokenDefType,

    /**
     * supports function token type 'font-tech('
     */
    SupportsFunctionTokenDefType,

    /**
     *  CDOCOMMTokenType not allowed in this context
     */
    InvalidCommentTokenType,

    /**
     * custom function token type '--function-name('
     */
    CustomFunctionTokenDefType,

    /**
     * custom function token type
     */
    CustomFunctionTokenType,

    /**
     * function tokens such as 'var(', 'env(', 'if(')
     */
    WildCardFunctionTokenDefType,

    /**
     * function such as 'var()', 'env()', 'if()'
     */
    WildCardFunctionTokenType,

    /**
     * if condition token
     */
    IfConditionTokenType,

    /**
     * if-Else condition token
     */
    IfElseConditionTokenType,

    /**
     * wrapped values token type like {Arial, sans-serif}
     */
    WrappedValuesTokenType,

    /* aliases */

    /**
     * alias for time token type
     */
    Time = TimeTokenType,
    /**
     * alias for identifier token type
     */
    Iden = IdenTokenType,
    /**
     * alias for end of file token type
     */
    EOF = EOFTokenType,
    /**
     * alias for hash token type
     */
    Hash = HashTokenType,
    /**
     * alias for flex token type
     */
    Flex = FlexTokenType,
    /**
     * alias for angle token type
     */
    Angle = AngleTokenType,
    /**
     * alias for color token type
     */
    Color = ColorTokenType,
    /**
     * alias for comma token type
     */
    Comma = CommaTokenType,
    /**
     * alias for string token type
     */
    String = StringTokenType,
    /**
     * alias for length token type
     */
    Length = LengthTokenType,
    /**
     * alias for number token type
     */
    Number = NumberTokenType,
    /**
     * alias for percentage token type
     */
    Perc = PercentageTokenType,
    /**
     * alias for literal token type
     */
    Literal = LiteralTokenType,
    /**
     * alias for comment token type
     */
    Comment = CommentTokenType,
    /**
     * alias for url function token type
     */
    UrlFunc = UrlFunctionTokenType,
    /**
     * alias for dimension token type
     */
    Dimension = DimensionTokenType,
    /**
     * alias for frequency token type
     */
    Frequency = FrequencyTokenType,
    /**
     * alias for resolution token type
     */
    Resolution = ResolutionTokenType,
    /**
     * alias for whitespace token type
     */
    Whitespace = WhitespaceTokenType,
    /**
     * alias for identifier list token type
     */
    IdenList = IdenListTokenType,
    /**
     * alias for dashed identifier token type
     */
    DashedIden = DashedIdenTokenType,
    /**
     * alias for grid template function token type
     */
    GridTemplateFunc = GridTemplateFuncTokenType,
    /**
     * alias for image function token type
     */
    ImageFunc = ImageFunctionTokenType,
    /**
     * alias for comment node type
     */
    CommentNodeType = CommentTokenType,
    /**
     * alias for cdata section node type
     */
    CDOCOMMNodeType = CDOCOMMTokenType,
    /**
     * alias for timing function token type
     */
    TimingFunction = TimingFunctionTokenType,
    /**
     * alias for timeline function token type
     */
    TimelineFunction = TimelineFunctionTokenType,
}

/**
 * Supported color types enum
 */
export enum ColorType {
    /**
     * deprecated system colors
     */
    SYS,
    /**
     * deprecated system colors
     */
    DPSYS,
    /**
     * named colors
     */
    LIT,
    /**
     * colors as hex values
     */
    HEX,
    /**
     * colors as rgb values
     */
    RGBA,
    /**
     * colors using rgb
     */
    HSLA,
    /**
     * colors using hwb
     */
    HWB,
    /**
     * colors using cmyk
     */
    CMYK,
    /**
     * colors using oklab
     * */
    OKLAB,
    /**
     * colors using oklch
     * */
    OKLCH,
    /**
     * colors using lab
     */
    LAB,
    /**
     * colors using lch
     */
    LCH,
    /**
     * colors using color() function
     */
    COLOR,
    /**
     * color using srgb
     */
    SRGB,
    /**
     * color using prophoto-rgb
     */
    PROPHOTO_RGB,
    /**
     * color using a98-rgb
     */
    A98_RGB,
    /**
     * color using rec2020
     */
    REC2020,
    /**
     * color using display-p3
     */
    DISPLAY_P3,
    /**
     * color using srgb-linear
     */
    SRGB_LINEAR,
    /**
     * color using xyz-d50
     */
    XYZ_D50,
    /**
     * color using xyz-d65
     */
    XYZ_D65,
    /**
     * light-dark() color function
     */
    LIGHT_DARK,
    /**
     * color-mix() color function
     */
    COLOR_MIX,
    /**
     * non-standard color
     */
    NON_STD,
    /**
     * custom color
     */
    CUSTOM_COLOR,
    /**
     * alpha() color function
     */
    ALPHA,

    /**
     * color using display-p3-linear
     */
    DISPLAY_P3_LINEAR,
    /**
     * alias for rgba
     */
    RGB = RGBA,
    /**
     * alias for hsl
     */
    HSL = HSLA,
    /**
     * alias for xyz-d65
     */
    XYZ = XYZ_D65,
    /**
     * alias for cmyk
     */
    DEVICE_CMYK = CMYK,
}

/**
 * Supported module case transform
 */
export enum ModuleCaseTransformEnum {
    /**
     * export class names as-is
     */
    IgnoreCase = 0x1,
    /**
     * transform mapping key name to camel case
     */
    CamelCase = 0x2,
    /**
     * transform class names and mapping key name to camel case
     */
    CamelCaseOnly = 0x4,
    /**
     * transform mapping key name to dash case
     */
    DashCase = 0x8,
    /**
     * transform class names and mapping key name to dash case
     */
    DashCaseOnly = 0x10,
}

/**
 * Supported module scope
 */
export enum ModuleScopeEnumOptions {
    /**
     * use the global scope
     */
    Global = 0x20,
    /**
     * use the local scope
     */
    Local = 0x40,
    /**
     * do not allow selector without an id or class
     */
    Pure = 0x80,
    /**
     * export using ICSS module format
     */
    ICSS = 0x100,

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
    Shortest = 0x200,
}

// https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Styling_basics/Values_and_units#absolute_length_units
/**
 * Convert length to px
 * @param value
 * @returns
 */
export function length2Px(value: LengthToken | NumberToken): number | null {
    let result: number | null = null;
    if (value.typ == EnumToken.NumberTokenType) {
        result = +value.val;
    } else {
        switch ((value as LengthToken).unit) {
            case "cm":
                // @ts-ignore
                result = (value as LengthToken).val * 37.8;
                break;
            case "mm":
                // @ts-ignore
                result = (value as LengthToken).val * 3.78;
                break;
            case "Q":
                // @ts-ignore
                result = ((value as LengthToken).val * 37.8) / 40;
                break;
            case "in":
                // @ts-ignore
                result = (value as LengthToken).val / 96;
                break;
            case "pc":
                // @ts-ignore
                result = (value as LengthToken).val / 16;
                break;
            case "pt":
                // @ts-ignore
                result = ((value as LengthToken).val * 4) / 3;
                break;
            case "px":
                result = +(value as LengthToken).val;
                break;
        }
    }

    return isNaN(result as number) ? null : result;
}

/**
 * minify number
 * @param val
 */

export function minifyNumber(val: string | number): string {
    val = String(val);

    if (val === "0") {
        return "0";
    }

    const chr: string = val.charAt(0);

    if (chr == "-") {
        const slice: string = val.slice(0, 2);

        if (slice == "-0") {
            return val.length == 2 ? "0" : "-" + val.slice(2);
        }
    }

    if (chr == "0") {
        return val.slice(1);
    }

    return val;
}
