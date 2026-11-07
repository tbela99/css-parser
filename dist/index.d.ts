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
declare enum EnumAstNodeStatus {
    /**
     * Node passed validation
     */
    Validated = 1,
    /**
     * Node is invalid
     */
    Invalid = 2,
    /**
     * node is not validated
     */
    Unvalidated = 4,
    /**
     * Node did not pass validation, but is preserved.
     */
    ValidationFailed = 8,
    /**
     * Parsing the node is not supported yet or the node syntax definition does not exist.
     */
    Unknown = 16,
    /**
     * Failed to parse the node.
     */
    Unparsed = 32,
    /**
     * Node is disallowed in the context
     */
    Disallowed = 64,
    /**
     * Node is malformed
     */
    Malformed = 128,
    /**
     * Important declaration
     */
    ImportantDeclaration = 256,
    /**
     * Color component without unit
     */
    PowerlessColorComponent = 512,
    /**
     * mask of the validation state bits
     */
    StateMask = 65535,
    /**
     * the node has a children list (stylesheet, rule, at-rule with a block)
     */
    HasChildren = 65536,
    /**
     * the node has value tokens (declaration)
     */
    HasValues = 131072,
    /**
     * the node has a source location
     */
    HasLocation = 262144,
    /**
     * the node is marked to be released or trimmed. see `arena.mark()`, `arena.release()` and `arena.trim()`
     */
    Marked = 524288,
    /**
     * transient flag used while comparing the declarations of two rules
     * @private
     */
    Matched = 1048576
}
/**
 * Enum of all token types
 */
declare enum EnumToken {
    /**
     * comment token. the value 0 is reserved: it is the type of the null node (id 0) and of unset nodes,
     * so that reading the type of a missing node never matches a real token type
     */
    CommentTokenType = 1,
    /**
     * cdata section token
     */
    CDOCOMMTokenType = 2,
    /**
     * style sheet node type
     */
    StyleSheetNodeType = 3,
    /**
     * at-rule node type
     */
    AtRuleNodeType = 4,
    /**
     * rule node type
     */
    RuleNodeType = 5,
    /**
     * declaration node type
     */
    DeclarationNodeType = 6,
    /**
     * literal token type
     */
    LiteralTokenType = 7,
    /**
     * identifier token type
     */
    IdenTokenType = 8,
    /**
     * dashed identifier token type
     */
    DashedIdenTokenType = 9,
    /**
     * comma token type
     */
    CommaTokenType = 10,
    /**
     * colon token type
     */
    ColonTokenType = 11,
    /**
     * semicolon token type
     */
    SemiColonTokenType = 12,
    /**
     * number token type
     */
    NumberTokenType = 13,
    /**
     * at-rule token type
     */
    AtRuleTokenType = 14,
    /**
     * percentage token type
     */
    PercentageTokenType = 15,
    /**
     * function token type
     */
    FunctionTokenType = 16,
    /**
     * timeline function token type
     */
    TimelineFunctionTokenType = 17,
    /**
     * timing function token type
     */
    TimingFunctionTokenType = 18,
    /**
     * url function token type
     */
    UrlFunctionTokenType = 19,
    /**
     * image function token type
     */
    ImageFunctionTokenType = 20,
    /**
     * string token type
     */
    StringTokenType = 21,
    /**
     * unclosed string token type
     */
    UnclosedStringTokenType = 22,
    /**
     * dimension token type
     */
    DimensionTokenType = 23,
    /**
     * length token type
     */
    LengthTokenType = 24,
    /**
     * angle token type
     */
    AngleTokenType = 25,
    /**
     * time token type
     */
    TimeTokenType = 26,
    /**
     * frequency token type
     */
    FrequencyTokenType = 27,
    /**
     * resolution token type
     */
    ResolutionTokenType = 28,
    /**
     * hash token type
     */
    HashTokenType = 29,
    /**
     * block start token type
     */
    BlockStartTokenType = 30,
    /**
     * block end token type
     */
    BlockEndTokenType = 31,
    /**
     * attribute start token type
     */
    AttrStartTokenType = 32,
    /**
     * attribute end token type
     */
    AttrEndTokenType = 33,
    /**
     * start parentheses token type
     */
    StartParensTokenType = 34,
    /**
     * end parentheses token type
     */
    EndParensTokenType = 35,
    /**
     * parentheses token type
     */
    ParensTokenType = 36,
    /**
     * whitespace token type
     */
    WhitespaceTokenType = 37,
    /**
     * include match token type
     */
    IncludeMatchTokenType = 38,
    /**
     * dash match token type
     */
    DashMatchTokenType = 39,
    /**
     * equal match token type
     */
    EqualMatchTokenType = 40,
    /**
     * less than token type
     */
    LtTokenType = 41,
    /**
     * less than or equal to token type
     */
    LteTokenType = 42,
    /**
     * greater than token type
     */
    GtTokenType = 43,
    /**
     * greater than or equal to token type
     */
    GteTokenType = 44,
    /**
     * pseudo-class token type
     */
    PseudoClassTokenType = 45,
    /**
     * pseudo-class function token type
     */
    PseudoClassFuncTokenType = 46,
    /**
     * delimiter token type
     */
    DelimTokenType = 47,
    /**
     * URL token type
     */
    UrlTokenTokenType = 48,
    /**
     * end of file token type
     */
    EOFTokenType = 49,
    /**
     * important token type
     */
    ImportantTokenType = 50,
    /**
     * color token type
     */
    ColorTokenType = 51,
    /**
     * attribute token type
     */
    AttrTokenType = 52,
    /**
     * bad comment token type
     */
    BadCommentTokenType = 53,
    /**
     * bad cdo token type
     */
    BadCdoTokenType = 54,
    /**
     * bad URL token type
     */
    BadUrlTokenType = 55,
    /**
     * bad string token type
     */
    BadStringTokenType = 56,
    /**
     * binary expression token type
     */
    BinaryExpressionTokenType = 57,
    /**
     * unary expression token type
     */
    UnaryExpressionTokenType = 58,
    /**
     * flex token type
     */
    FlexTokenType = 59,
    /**
     *  token list token type
     */
    ListToken = 60,
    /**
     * addition token type
     */
    Add = 61,
    /**
     * multiplication token type
     */
    Mul = 62,
    /**
     * division token type
     */
    Div = 63,
    /**
     * subtraction token type
     */
    Sub = 64,
    /**
     * column combinator token type
     */
    ColumnCombinatorTokenType = 65,
    /**
     * contain match token type
     */
    ContainMatchTokenType = 66,
    /**
     * start match token type
     */
    StartMatchTokenType = 67,
    /**
     * end match token type
     */
    EndMatchTokenType = 68,
    /**
     * match expression token type
     */
    MatchExpressionTokenType = 69,
    /**
     * namespace attribute token type
     */
    NameSpaceAttributeTokenType = 70,
    /**
     * fraction token type
     */
    FractionTokenType = 71,
    /**
     * identifier list token type
     */
    IdenListTokenType = 72,
    /**
     * grid template function token type
     */
    GridTemplateFuncTokenType = 73,
    /**
     * keyframe rule node type
     */
    KeyframesRuleNodeType = 74,
    /**
     * class selector token type
     */
    ClassSelectorTokenType = 75,
    /**
     * universal selector token type
     */
    UniversalSelectorTokenType = 76,
    /**
     * child combinator token type
     */
    ChildCombinatorTokenType = 77,// >
    /**
     * descendant combinator token type
     */
    DescendantCombinatorTokenType = 78,// whitespace
    /**
     * next sibling combinator token type
     */
    NextSiblingCombinatorTokenType = 79,// +
    /**
     * subsequent sibling combinator token type
     */
    SubsequentSiblingCombinatorTokenType = 80,// ~
    /**
     * nesting selector token type
     */
    NestingSelectorTokenType = 81,// &
    /**
     * media query condition token type
     */
    MediaQueryConditionTokenType = 82,
    /**
     * media feature token type
     */
    MediaFeatureTokenType = 83,
    /**
     * media feature only token type
     */
    OnlyTokenType = 84,
    /**
     * media feature not token type
     */
    NotTokenType = 85,
    /**
     * media feature and token type
     */
    AndTokenType = 86,
    /**
     * media feature or token type
     */
    OrTokenType = 87,
    /**
     * pseudo page token type
     */
    PseudoPageTokenType = 88,
    /**
     * pseudo element token type
     */
    PseudoElementTokenType = 89,
    /**
     * keyframe at rule node type
     */
    KeyframesAtRuleNodeType = 90,
    /**
     * composes token node type
     */
    ComposesSelectorNodeType = 91,
    /**
     * css variable token type
     */
    CssVariableTokenType = 92,
    /**
     * css variable import token type
     */
    CssVariableImportTokenType = 93,
    /**
     * css variable declaration map token type
     */
    CssVariableDeclarationMapTokenType = 94,
    /**
     * media range query token type
     */
    MediaRangeQueryTokenType = 95,
    /**
     * supports query condition token type
     */
    SupportsQueryConditionTokenType = 96,
    /**
     * supports query unary condition token type
     */
    SupportsQueryUnaryConditionTokenType = 97,
    /**
     * when else query condition token type
     */
    WhenElseQueryConditionTokenType = 98,
    /**
     * when else query unary condition token type
     */
    WhenElseUnaryConditionTokenType = 99,
    /**
     * container style range token type
     */
    ContainerStyleRangeTokenType = 100,
    /**
     * '*'
     */
    Star = 101,
    /**
     * '+'
     */
    Plus = 102,
    /**
     * '~'
     */
    Tilda = 103,
    /**
     * '|'
     */
    PipeTokenType = 104,
    /**
     * '::'
     */
    DoubleColonTokenType = 105,
    /**
     * math function token type  such as'calc(' etc.
     */
    MathFunctionTokenType = 106,
    /**
     * transform function token type such as 'translate(' etc.
     */
    TransformFunctionTokenType = 107,
    /**
     * when function token type such as 'supports(' etc.
     */
    WhenElseFunctionTokenType = 108,
    /**
     * general enclosed function token type 'font-tech(' etc.
     */
    GeneralEnclosedFunctionTokenType = 109,
    /**
     * supports function token type such as 'at-rule('
     */
    SupportsFunctionTokenType = 110,
    /**
     * container function token type such as 'style(' or 'scroll-state('
     */
    ContainerFunctionTokenType = 111,
    /**
     * unrecognized node token type
     */
    RawNodeTokenType = 112,
    /**
     * media query boolean token type
     * at-rule media not ()
     * at-rule media only ()
     */
    MediaQueryUnaryFeatureTokenType = 113,
    /**
     * grid template function token type such as 'minmax('
     */
    GridTemplateFuncTokenDefType = 114,
    /**
     * image function token type such as 'image(' etc.
     */
    ImageFunctionTokenDefType = 115,
    /**
     * function token type such as 'view(' etc.
     */
    TimelineFunctionTokenDefType = 116,
    /**
     * function token type
     */
    FunctionTokenDefType = 117,
    /**
     * timing function token type such as 'linear(' etc.
     */
    TimingFunctionTokenDefType = 118,
    /**
     * color function token type such as 'rgb(' etc.
     */
    ColorFunctionTokenDefType = 119,
    /**
     * math function token type such as 'calc(' etc.
     */
    MathFunctionTokenDefType = 120,
    /**
     * container function token type such as 'style(' or 'scroll-state('
     */
    ContainerFunctionTokenDefType = 121,
    /**
     * url function token type 'url('
     */
    UrlFunctionTokenDefType = 122,
    /**
     * pseudo-class function token type
     */
    PseudoClassFunctionTokenDefType = 123,
    /**
     * transform function token type such as 'translate(' etc.
     */
    TransformFunctionTokenDefType = 124,
    /**
     * when function token type such as 'supports(' or 'media('
     */
    WhenElseFunctionTokenDefType = 125,
    /**
     * general enclosed function token type 'font-tech(' etc.
     */
    GeneralEnclosedFunctionTokenDefType = 126,
    /**
     * supports function token type 'font-tech('
     */
    SupportsFunctionTokenDefType = 127,
    /**
     * custom function token type '--function-name('
     */
    CustomFunctionTokenDefType = 128,
    /**
     * custom function token type
     */
    CustomFunctionTokenType = 129,
    /**
     * function tokens such as 'var(', 'env(', 'if(')
     */
    WildCardFunctionTokenDefType = 130,
    /**
     * function such as 'var()', 'env()', 'if()'
     */
    WildCardFunctionTokenType = 131,
    /**
     * if condition token
     */
    IfConditionTokenType = 132,
    /**
     * if-Else condition token
     */
    IfElseConditionTokenType = 133,
    /**
     * wrapped values token type like {Arial, sans-serif}
     */
    WrappedValuesTokenType = 134,
    /**
     * list of arena tokens (binary expression operands)
     */
    ListTokenType = 135,
    /**
     * infinity token
     */
    NaNTokenType = 136,
    /**
     * infinity token
     */
    InfinityTokenType = 137,
    /**
     * negative infinity token
     */
    NegativeInfinityTokenType = 138,
    /**
     * CSS type token
     */
    CssTypeTokenType = 139,
    /**
     * user defined dimension token type
     */
    UserDefinedDimensionTokenType = 140,
    /**
     * alias for time token type
     */
    Time = 26,
    /**
     * alias for identifier token type
     */
    Iden = 8,
    /**
     * alias for end of file token type
     */
    EOF = 49,
    /**
     * alias for hash token type
     */
    Hash = 29,
    /**
     * alias for flex token type
     */
    Flex = 59,
    /**
     * alias for angle token type
     */
    Angle = 25,
    /**
     * alias for color token type
     */
    Color = 51,
    /**
     * alias for comma token type
     */
    Comma = 10,
    /**
     * alias for string token type
     */
    String = 21,
    /**
     * alias for length token type
     */
    Length = 24,
    /**
     * alias for number token type
     */
    Number = 13,
    /**
     * alias for percentage token type
     */
    Perc = 15,
    /**
     * alias for literal token type
     */
    Literal = 7,
    /**
     * alias for comment token type
     */
    Comment = 1,
    /**
     * alias for url function token type
     */
    UrlFunc = 19,
    /**
     * alias for dimension token type
     */
    Dimension = 23,
    /**
     * alias for frequency token type
     */
    Frequency = 27,
    /**
     * alias for resolution token type
     */
    Resolution = 28,
    /**
     * alias for whitespace token type
     */
    Whitespace = 37,
    /**
     * alias for identifier list token type
     */
    IdenList = 72,
    /**
     * alias for dashed identifier token type
     */
    DashedIden = 9,
    /**
     * alias for grid template function token type
     */
    GridTemplateFunc = 73,
    /**
     * alias for image function token type
     */
    ImageFunc = 20,
    /**
     * alias for comment node type
     */
    CommentNodeType = 1,
    /**
     * alias for cdata section node type
     */
    CDOCOMMNodeType = 2,
    /**
     * alias for timing function token type
     */
    TimingFunction = 18,
    /**
     * alias for timeline function token type
     */
    TimelineFunction = 17
}
/**
 * Supported color types enum
 */
declare enum ColorType$1 {
    /**
     * the color type is not known yet (the color function has not been parsed)
     */
    NONE = 0,
    /**
     * system colors
     */
    SYS = 1,
    /**
     * deprecated system colors
     */
    DPSYS = 2,
    /**
     * named colors
     */
    LIT = 3,
    /**
     * colors as hex values
     */
    HEX = 4,
    /**
     * colors as rgb values
     */
    RGBA = 5,
    /**
     * colors using rgb
     */
    HSLA = 6,
    /**
     * colors using hwb
     */
    HWB = 7,
    /**
     * colors using cmyk
     */
    CMYK = 8,
    /**
     * colors using oklab
     * */
    OKLAB = 9,
    /**
     * colors using oklch
     * */
    OKLCH = 10,
    /**
     * colors using lab
     */
    LAB = 11,
    /**
     * colors using lch
     */
    LCH = 12,
    /**
     * colors using color() function
     */
    COLOR = 13,
    /**
     * color using srgb
     */
    SRGB = 14,
    /**
     * color using prophoto-rgb
     */
    PROPHOTO_RGB = 15,
    /**
     * color using a98-rgb
     */
    A98_RGB = 16,
    /**
     * color using rec2020
     */
    REC2020 = 17,
    /**
     * color using display-p3
     */
    DISPLAY_P3 = 18,
    /**
     * color using srgb-linear
     */
    SRGB_LINEAR = 19,
    /**
     * color using xyz-d50
     */
    XYZ_D50 = 20,
    /**
     * color using xyz-d65
     */
    XYZ_D65 = 21,
    /**
     * light-dark() color function
     */
    LIGHT_DARK = 22,
    /**
     * color-mix() color function
     */
    COLOR_MIX = 23,
    /**
     * non-standard color
     */
    NON_STD = 24,
    /**
     * custom color
     */
    CUSTOM_COLOR = 25,
    /**
     * alpha() color function
     */
    ALPHA = 26,
    /**
     * color using display-p3-linear
     */
    DISPLAY_P3_LINEAR = 27,
    /**
     * Contrast color
     */
    CONTRAST_COLOR = 28,
    /**
     * color layers
     */
    COLOR_LAYERS = 29,
    /**
     * alias for rgba
     */
    RGB = 5,
    /**
     * alias for hsl
     */
    HSL = 6,
    /**
     * alias for xyz-d65
     */
    XYZ = 21,
    /**
     * alias for cmyk
     */
    DEVICE_CMYK = 8
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
/**
 * Options returned by the filters of {@link AstArena.walk} and {@link AstArena.walkValues}
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
 * Event types of the {@link AstArena.walkValues} filter
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
 * Object view of the arena nodes and tokens: {@link AstArenaNode}
 *
 * @module
 */

/**
 * keyed symbol (`Symbol.for()`) of the arena node id of an {@link AstArenaNode}. the symbol is shared by every copy of
 * the library loaded in the same realm
 *
 * ```ts
 * const node = arena.toObject(id);
 *
 * console.log(node[ARENAID] === id); // true
 * ```
 */
declare const ARENAID: unique symbol;
/**
 * keyed symbol (`Symbol.for()`) of the arena of an {@link AstArenaNode}
 */
declare const ARENA: unique symbol;
/**
 * value accepted by the setters of {@link AstArenaNode}: a node id of the arena, an {@link AstArenaNode} (of any
 * arena) or a plain object
 */
export declare type AstArenaNodeInput = number | AstArenaNode | PlainAstNode | PlainToken;
/**
 * Object view of an arena node or token, returned by {@link AstArena.toObject}. The view does not copy the data: its
 * properties are getters and setters that read and write the arena columns. A view only holds the arena and the node
 * id ({@link ARENAID}).
 *
 * - the properties are the properties of the plain objects ({@link PlainAstNode}, {@link PlainToken}): `typ`, `nam`,
 *   `sel`, `val`, `chi`, `tokens`, `unit`, `kin`, `l`, `r`, `op`, ... and `loc`, `state`, `errors`, `parent`,
 * - the nodes and tokens (children, value tokens, fields) are returned as new views in a frozen array. the arrays,
 *   the locations (`loc`) and the error lists (`errors`) cannot be modified (modifying them throws in strict mode):
 *   assign the property to modify the arena (`node.chi = [...node.chi, rule]`),
 * - the values assigned can be node ids, views or plain objects. importing a view of the same arena is a noop: the
 *   node is used as is, the views of another arena are copied,
 * - two views of the same node are different objects: compare their {@link ARENAID},
 * - `JSON.stringify()` and `toJSON()` return a deep plain copy ({@link AstArena.toPlainObject}).
 *
 * ```ts
 * function visitor(arena: AstArena, id: number) {
 *
 *     const node = arena.toObject(id);
 *
 *     if (node.nam == 'width') {
 *
 *         node.nam = 'height';
 *         node.val = [{typ: EnumToken.LengthTokenType, val: 3, unit: 'px'}];
 *     }
 * }
 * ```
 */
declare class AstArenaNode {
    /**
     * arena of the node
     */
    readonly [ARENA]: AstArena;
    /**
     * node id in the arena
     */
    readonly [ARENAID]: number;
    /**
     * @param arena
     * @param id
     */
    constructor(arena: AstArena, id: number);
    /**
     * node or token type
     */
    get typ(): EnumToken;
    set typ(typ: EnumToken);
    /**
     * at-rule / declaration name, token name. undefined for the other nodes
     */
    get nam(): string | undefined;
    set nam(nam: string);
    /**
     * rule selector. undefined for the other nodes
     */
    get sel(): string | undefined;
    set sel(sel: string);
    /**
     * value:
     * - at-rule prelude, comment: string,
     * - declaration: value tokens,
     * - number, dimension, percentage: number (or the fraction token),
     * - identifier, string, function name, ...: string,
     * - unary expression: the operand,
     * - structured tokens with a value field: the field tokens
     */
    get val(): string | number | AstArenaNode | readonly AstArenaNode[] | null | undefined;
    set val(val: string | number | AstArenaNodeInput | readonly AstArenaNodeInput[] | null | undefined);
    /**
     * children: the child nodes of a stylesheet, a rule or an at-rule with a block, the tokens of a function token
     * (arguments), a parentheses token, ... undefined when the node has no children
     */
    get chi(): readonly AstArenaNode[] | undefined;
    set chi(chi: readonly AstArenaNodeInput[] | null | undefined);
    /**
     * prelude tokens of an at-rule, selector tokens of a rule. null when the node has no prelude tokens
     */
    get tokens(): readonly AstArenaNode[] | null;
    set tokens(tokens: readonly AstArenaNodeInput[] | null | undefined);
    /**
     * unit of a dimension, calendar (`cal`) of a color, attribute (`attr`) of a match expression
     */
    get unit(): string | undefined;
    set unit(unit: string | null | undefined);
    /**
     * color space of a color
     */
    get cal(): string | undefined;
    set cal(cal: string | null | undefined);
    /**
     * attribute of a match expression
     */
    get attr(): string | undefined;
    set attr(attr: string | null | undefined);
    /**
     * color type of a color token
     */
    get kin(): ColorType$1 | undefined;
    set kin(kin: ColorType$1 | null | undefined);
    /**
     * sign of a unary expression
     */
    get sign(): EnumToken | undefined;
    set sign(sign: EnumToken);
    /**
     * operator: the operator of a binary expression, the operator tokens of a structured token
     */
    get op(): EnumToken | AstArenaNode | readonly AstArenaNode[] | null | undefined;
    set op(op: EnumToken | AstArenaNodeInput | readonly AstArenaNodeInput[] | null);
    /**
     * first operator of a media range query
     */
    get op1(): AstArenaNode | readonly AstArenaNode[] | null | undefined;
    set op1(op: AstArenaNodeInput | readonly AstArenaNodeInput[] | null);
    /**
     * second operator of a media range query
     */
    get op2(): AstArenaNode | readonly AstArenaNode[] | null | undefined;
    set op2(op: AstArenaNodeInput | readonly AstArenaNodeInput[] | null);
    /**
     * left hand side of a structured token, numerator of a fraction
     */
    get l(): AstArenaNode | readonly AstArenaNode[] | null | undefined;
    set l(l: AstArenaNodeInput | readonly AstArenaNodeInput[] | null);
    /**
     * right hand side of a structured token, denominator of a fraction
     */
    get r(): AstArenaNode | readonly AstArenaNode[] | null | undefined;
    set r(r: AstArenaNodeInput | readonly AstArenaNodeInput[] | null);
    /**
     * source location. null when the node has no location
     */
    get loc(): Readonly<SourceLocation> | null;
    set loc(loc: SourceLocation | null | undefined);
    /**
     * validation state
     */
    get state(): EnumAstNodeStatus;
    set state(state: EnumAstNodeStatus | null | undefined);
    /**
     * validation errors. null when the node has no errors
     */
    get errors(): readonly ErrorDescription[] | null;
    set errors(errors: readonly ErrorDescription[] | null | undefined);
    /**
     * parent node, or the token that owns the token (see {@link AstArena.getValueParent}). null when the node is
     * detached
     */
    get parent(): AstArenaNode | null;
    /**
     * value of a structured token field. undefined when the token has no such field
     * @param key
     */
    private getField;
    /**
     * set the value of a structured token field. false when the token has no such field
     * @param key
     * @param value
     */
    private setField;
    /**
     * deep plain copy of the node, see {@link AstArena.toPlainObject}
     */
    toJSON(): PlainAstNode | PlainToken;
}

/**
 * Arena memory manager: ast nodes and value tokens are integer ids, their data is stored column-wise
 * in typed arrays (structure of arrays), lists are doubly linked lists stored in the `firstChild` /
 * `lastChild` / `firstToken` / `lastToken` / `nextSibling` / `previousSibling` columns and strings are interned.
 *
 * Every node owns two lists that share the sibling columns:
 *
 * - the children list (`firstChild` / `lastChild`): the child nodes of a stylesheet, a rule or an at-rule, or the
 *   structured fields of a token (see {@link TokenField}),
 * - the token list (`firstToken` / `lastToken`): the value tokens of a declaration, the prelude tokens of a rule / at-rule
 *   or the arguments of a function token (`chi`).
 *
 * Token columns:
 *
 * - `dataTypes`: token type ({@link EnumToken}),
 * - `stringValue`: interned string value (`val`) of identifiers, strings, literals, function names, colors, ...
 * - `numericValue`: numeric value (`val`) of numbers, dimensions and percentages. operator of binary expressions, sign of unary expressions,
 * - `unit`: interned unit of dimensions,
 * - `name`: interned name (`nam`) of at-rule / declaration tokens,
 * - `colorType`: color kind (`kin`) of color tokens,
 * - `spans`: packed source location.
 *
 * Structured tokens (binary expressions, media queries conditions, ...) store their fields (`l`, `r`, `op`, ...) as
 * {@link EnumToken.ListTokenType} children at fixed positions ({@link TokenField}). Fraction tokens store their
 * numerator and denominator as children, numeric tokens with a fraction value store the fraction token as their child.
 *
 * @module
 */

/**
 * position of the structured token fields in the children list
 */
declare enum TokenField {
    /**
     * left hand side (`l`)
     */
    L = 0,
    /**
     * right hand side (`r`)
     */
    R = 1,
    /**
     * operator (`op`, `op1`)
     */
    Op = 2,
    /**
     * second operator (`op2`)
     */
    Op2 = 3,
    /**
     * value (`val`)
     */
    Val = 4
}
/**
 * Plain (structured-cloneable) properties of an arena. See {@link Arena.toTransferableArenaObject}
 */
interface ArenaProperties {
    /**
     * arena class name: `Arena` or `AstArena`
     */
    kind: string;
    /**
     * last allocated id
     */
    current: number;
    /**
     * interned strings
     */
    strings: string[];
    /**
     * validation errors by node id
     */
    errors: Array<[number, ErrorDescription[]]>;
    /**
     * source ids ({@link AstArena})
     */
    sources?: number[];
    /**
     * raw selectors cache ({@link AstArena})
     */
    raw?: Array<RawSelectorTokens | null | undefined>;
    /**
     * optimized selectors cache ({@link AstArena})
     */
    optimized?: Array<OptimizedSelector | null | undefined>;
}
/**
 * Column buffers of an arena, in the order of {@link arenaColumns}. See {@link Arena.toTransferableArenaObject}
 */
type ArenaTransferables = ArrayBuffer[];
/**
 * arena columns stored as typed arrays, in the order of the transferable buffers
 */
declare const arenaColumns: readonly ["dataTypes", "parents", "nextSibling", "previousSibling", "firstToken", "lastToken", "firstChild", "lastChild", "name", "stringValue", "numericValue", "unit", "flags", "colorType", "spans"];
/**
 * Arena memory manager.
 *
 * The node data is stored column-wise in typed arrays allocated for the capacity of the arena ({@link getCapacity},
 * 62 bytes per node). The arena grows by doubling its capacity and never frees memory by itself: detached nodes keep
 * their memory and their ids stay valid. {@link release}, {@link compact}, {@link trim} and {@link compactStrings}
 * reclaim the memory, `compact()` and `trim()` renumber the nodes. See the Arena Memory guide (files/arena.md).
 */
declare class Arena {
    #private;
    /**
     * string interner identifiers
     */
    stringIds: Map<string, number>;
    /**
     * string interner values
     */
    strings: string[];
    /**
     * root node
     */
    readonly root: number;
    /**
     * last allocated node id. the next node is allocated with the id current + 1 (unless a recycled id is available).
     * 0 is never allocated: it means "no node"
     */
    current: number;
    /**
     * head of the list of recycled node ids. the list is linked through the `nextSibling` column, see {@link recycle}
     */
    protected freeList: number;
    /**
     * node EnumToken type array
     */
    dataTypes: Uint8Array;
    /**
     * parent node id array
     */
    parents: Uint32Array;
    /**
     * next sibling node id array
     */
    nextSibling: Uint32Array;
    /**
     * previous sibling node id array
     */
    previousSibling: Uint32Array;
    /**
     * first token node id array
     */
    firstToken: Uint32Array;
    /**
     * last token node id array
     */
    lastToken: Uint32Array;
    /**
     * first child node id array
     */
    firstChild: Uint32Array;
    /**
     * last child node id array
     */
    lastChild: Uint32Array;
    /**
     * node name string interner id array. used to store (node as AstRule | AstDeclaration | AstKeyframesAtRule).nam and (node as AstRule | AstKeyframesRule).sel
     */
    name: Uint32Array;
    /**
     * node string value index array.
     */
    stringValue: Uint32Array;
    /**
     * node numeric value array. previously used as (node as NumberToken | DimensionToken).val
     */
    numericValue: Float64Array;
    /**
     * node unit string interner id array. previously used as (node as DimensionToken).unit
     */
    unit: Uint32Array;
    /**
     * node flags
     */
    flags: Uint32Array;
    /**
     * color type. previously use as (node as ColorToken).kin
     */
    colorType: Uint8Array;
    /**
     * token spans. 8 bits for source type. 28 bits for start position, 28 bits for end position. This allows us to store the start and end positions of tokens in a single 64-bit integer, which is more efficient than storing them separately.
     */
    spans: BigUint64Array;
    /**
     * 32 bits view of the spans: the low word holds the end position and the 4 low bits of the start position,
     * the high word holds the 24 high bits of the start position and the source
     */
    protected spans32: Uint32Array;
    /**
     * error cache
     */
    errors: Map<number, ErrorDescription[]>;
    constructor(size?: number);
    /**
     * Export the arena as a structured-cloneable object and the list of its column buffers, to send an arena
     * to a worker (or back to the main thread) without copying the node data.
     *
     * The properties (strings, errors, ...) are cloned by `postMessage()`, the column buffers are moved when they are
     * passed as the transfer list: the source arena must not be used afterwards (its columns are detached).
     * The buffers are copied instead when the transfer list is omitted.
     *
     * ```ts
     * // main thread
     * const [properties, transferables] = AstArena.toTransferableArenaObject(result.arena);
     *
     * worker.postMessage({ ast: result.ast, properties, transferables }, transferables);
     *
     * // worker
     * const { ast, properties, transferables } = event.data;
     * const arena = AstArena.fromTransferableArenaObjects(properties, transferables);
     * ```
     *
     * @param arena
     * @returns the arena properties and the column buffers, see {@link ArenaProperties} and {@link ArenaTransferables}
     */
    static toTransferableArenaObject(arena: Arena): [ArenaProperties, ArenaTransferables];
    /**
     * Create an arena from the objects produced by {@link Arena.toTransferableArenaObject}. The column buffers are
     * used as is (zero copy): the typed arrays are views on the given buffers.
     *
     * @param properties arena properties
     * @param transferables column buffers
     * @returns an `Arena` or an `AstArena` depending on the class the method is called on
     */
    static fromTransferableArenaObjects<T extends Arena>(this: new (size?: number) => T, properties: ArenaProperties, transferables: ArenaTransferables): T;
    /**
     * true when the column buffers have been transferred to another thread: the arena can no longer be used
     */
    get transferred(): boolean;
    /**
     * structured-cloneable properties of the arena
     */
    protected exportProperties(): ArenaProperties;
    /**
     * column buffers, in the order of {@link arenaColumns}. the `spans` buffer is shared with the `spans32` view
     */
    protected exportTransferables(): ArenaTransferables;
    /**
     * initialize the arena from exported properties and column buffers
     * @param properties
     * @param transferables
     */
    protected importProperties(properties: ArenaProperties, transferables: ArenaTransferables): void;
    allocate(): number;
    /**
     * recycle a detached leaf node (no parent, no children, no tokens) that is no longer referenced:
     * its id is reused by the next allocation. the record is zeroed, so a stale reference reads an empty node
     * @param id
     */
    recycle(id: number): void;
    /**
     * Interns a string and returns its unique ID. If the string has already been interned, it returns the existing ID.
     * @param str
     * @returns
     */
    internString(str: string): number;
    /**
     * set node data for a given id. The first argument is the id, the second is the type, the third is the string value, the fourth is the numeric value, and the fifth is the unit.
     * @param id
     * @param type
     * @param stringValue
     */
    set(id: number, type: EnumToken): void;
    /**
     * set node data for a given id. The first argument is the id, the second is the type, the third is the string value, the fourth is the numeric value, and the fifth is the unit.
     * @param id
     * @param type
     * @param stringValue
     */
    set(id: number, type: EnumToken, stringValue: number): void;
    /**
     * set node data for a given id. The first argument is the id, the second is the type, the third is the string value, and the fourth is the numeric value.
     * @param id
     * @param type
     * @param stringValue
     * @param numericValue
     */
    set(id: number, type: EnumToken, stringValue: number, numericValue: number): void;
    /**
     * set node data for a given id. The first argument is the id, the second is the type, the third is the string value, the fourth is the numeric value, and the fifth is the unit.
     * @param id
     * @param type
     * @param stringValue
     * @param numericValue
     * @param unit
     */
    set(id: number, type: EnumToken, stringValue: number, numericValue: number, unit: number): void;
    getType(id: number): EnumToken;
    /**
     * type of a node or a token. null when the id is null
     * @param id
     */
    typeOf(id: number | null | undefined): EnumToken | null;
    setType(id: number, type: EnumToken): void;
    setName(id: number, nameId: number): void;
    getName(id: number): string;
    setValue(id: number, valueId: number): void;
    getValue(id: number): string;
    setNumericValue(id: number, numericValue: number): void;
    setUnit(id: number, unit: number): void;
    getUnit(id: number): string;
    getNumericValue(id: number): number;
    setParent(id: number, parentId: number): void;
    /**
     * first child of a node. 0 when the node has no children
     * @param id
     */
    getFirstChild(id: number): number;
    /**
     * next sibling of a node or of a token. 0 for the last node / token of the list
     * @param id
     */
    getNextSibling(id: number): number;
    /**
     * previous sibling of a node or of a token. 0 for the first node / token of the list
     * @param id
     */
    getPreviousSibling(id: number): number;
    /**
     * first token of the token list of a node or of a token (declaration value, selector / prelude tokens, function
     * arguments). 0 when the list is empty
     * @param id
     */
    getFirstToken(id: number): number;
    /**
     * last token of the token list of a node or of a token. 0 when the list is empty
     * @param id
     */
    getLastToken(id: number): number;
    /**
     * number of nodes the columns can hold before the arena grows. see {@link getLastId} for the last allocated id
     */
    getCapacity(): number;
    /**
     * last allocated node id. the ids of the arena are in the range 1 ... getLastId(), the detached nodes included
     */
    getLastId(): number;
    /**
     * number of interned strings
     */
    getStringCount(): number;
    /**
     * replace the first child
     * @param id
     * @param firstChildId
     */
    setFirstChild(id: number, firstChildId: number): void;
    getLastChild(id: number): number;
    /**
     * replace the last child
     * @param id
     * @param lastChildId
     */
    setLastChild(id: number, lastChildId: number): void;
    /**
     * insert a node after another one
     * @param id
     * @param nextSiblingId
     */
    setNextSibling(id: number, nextSiblingId: number): void;
    /**
     * insert a node before another one
     * @param id
     * @param previousSiblingId
     */
    setPreviousSibling(id: number, previousSiblingId: number): void;
    /**
     * replace the first token
     * @param id
     * @param firstTokenId
     */
    setFirstToken(id: number, firstTokenId: number): void;
    setColorType(id: number, colorType: number): void;
    getColorType(id: number): number;
    setFlags(id: number, flags: number): void;
    getFlags(id: number): number;
    hasFlags(id: number, flag: number): boolean;
    getChildAt(id: number, index: number): number | null;
    /**
     * token at the given position of the token list
     * @param id
     * @param index
     */
    getTokenAt(id: number, index: number): number | null;
    /**
     * replace the child at the given index. the node is appended when the index is out of range
     * @param id
     * @param index
     * @param child
     */
    setChildAt(id: number, index: number, child: number): void;
    /**
     * list node holding the tokens of a structured token field. created when missing
     * @param id
     * @param field
     */
    fieldList(id: number, field: TokenField): number;
    /**
     * true if the field exists and is not empty
     * @param id
     * @param field
     */
    hasField(id: number, field: TokenField): boolean;
    /**
     * first token of a structured token field (single token fields: `l` and `r` of binary expressions, `op`, ...)
     * @param id
     * @param field
     */
    field(id: number, field: TokenField): number;
    /**
     * tokens of a structured token field
     * @param id
     * @param field
     */
    fieldTokens(id: number, field: TokenField): number[];
    /**
     * set the tokens of a structured token field
     * @param id
     * @param field
     * @param tokens
     */
    setField(id: number, field: TokenField, ...tokens: number[]): void;
    /**
     * append tokens to a structured token field
     * @param id
     * @param field
     * @param tokens
     */
    appendField(id: number, field: TokenField, ...tokens: number[]): void;
    setLeft(id: number, ...children: number[]): void;
    getLeft(id: number): number[] | null;
    setRight(id: number, rightId: null): void;
    setRight(id: number, ...rightId: number[]): void;
    getRight(id: number): number[] | null;
    setOp(id: number, opId: number): void;
    getOp(id: number): number;
    setOp2(id: number, op2Id: number): void;
    getOp2(id: number): number;
    setSpan(id: number, sourceId: number, start: number, end: number): void;
    /**
     * copy the packed location of a node
     * @param target
     * @param source
     */
    copySpan(target: number, source: number): void;
    getSourceId(id: number): number;
    getSpanStart(id: number): number;
    setSpandStart(id: number, start: number): void;
    getSpanEnd(id: number): number;
    setSpanEnd(id: number, end: number): void;
    getParent(id: number): number;
    resolveString(id: number): string;
    /**
     * detach a node from its parent
     * @param id
     */
    detach(id: number): void;
    /**
     * Walk the ast nodes: the node and its descendants, in document order. The iterator returns node ids (and value
     * tokens when `attributes` is set). The children of a node are read when the next node is requested: the current
     * node can be modified or detached by the caller.
     *
     * ```ts
     * import {EnumToken, transform, WalkerOptionEnum} from '@tbela99/css-parser';
     *
     * const result = await transform(css);
     * const arena = result.arena;
     *
     * for (const node of arena.walk(result.ast)) {
     *
     *     console.log(EnumToken[arena.getType(node)], arena.getParent(node));
     * }
     *
     * // the filter controls the walk, see WalkerOptionEnum
     * function filter(arena: AstArena, node: number) {
     *
     *     if (arena.getType(node) == EnumToken.RuleNodeType && arena.getSelector(node).includes('html')) {
     *
     *         // skip the children of the current node
     *         return WalkerOptionEnum.IgnoreChildren;
     *     }
     * }
     *
     * for (const node of arena.walk(result.ast, filter)) {
     *
     *     console.log(EnumToken[arena.getType(node)]);
     * }
     * ```
     *
     * @param node initial node id (or value token)
     * @param filter filter function or walker options
     * @param reverse walk in reverse order
     */
    walk(node: number, filter?: WalkerFilter | WalkerOptions | null, reverse?: boolean): IterableIterator<number>;
    /**
     * Walk value tokens and their descendants (function arguments, structured token fields, ...), in document
     * order. The iterator returns token ids. The children of a token are read when the next token is requested: the
     * current token can be modified or replaced by the caller.
     *
     * ```ts
     * import {EnumToken, transform} from '@tbela99/css-parser';
     *
     * const css = `
     * body { color:    color(from var(--base-color) display-p3 r calc(g + 0.24) calc(b + 0.15)); }
     * `;
     *
     * const result = await transform(css);
     * const arena = result.arena;
     * const declaration = arena.getFirstChild(arena.getFirstChild(result.ast));
     *
     * // walk the value tokens of the declaration in reverse order
     * for (const value of arena.walkValues(declaration, null, true)) {
     *
     *     console.error([EnumToken[arena.getType(value)], arena.getValue(value)]);
     * }
     * ```
     *
     * @param tokens token ids, or a node / token id: its value tokens are walked
     * @param filter filter function, called with the arena, the token id and the event, or filter options
     * @param reverse walk in reverse order
     */
    walkValues(tokens: number | number[], filter?: WalkerValueFilter | WalkerValueOptions | null, reverse?: boolean): IterableIterator<number>;
    /**
     * call the visitor for the tokens and their children, in the order of {@link walkValues} (the children of a
     * token are read after the visitor returns). no iterator or stack is created: use it when the visitor is not a
     * closure
     * @param tokens
     * @param visitor
     * @internal
     */
    visitValues(tokens: number[], visitor: (arena: this, token: number) => void): void;
    /**
     * parent of a value token: the node or the token that owns the token list, or the structured token that owns the
     * field (the field list token is skipped). 0 when the token is detached
     * @param id
     */
    getValueParent(id: number): number;
    /**
     * node that owns a value token: the declaration, the rule or the at-rule. 0 when the token is detached
     * @param id
     */
    getValueOwner(id: number): number;
    /**
     * Search the ast subtree and return the first match, in document order
     *
     * ```ts
     * // find the first declaration which name is 'aspect-ratio'
     * import { EnumToken, transform } from "@tbela99/css-parser";
     *
     * const result = await transform(css);
     * const arena = result.arena;
     *
     * const node = arena.find(result.ast, (arena, node) =>
     *     arena.getType(node) == EnumToken.DeclarationNodeType && arena.getName(node) == 'aspect-ratio');
     *
     * console.log(node == null ? null : arena.toObject(node));
     * ```
     *
     * @param node node id
     * @param matcher called with the arena and the node id
     * @returns the node id or null
     */
    find(node: number, matcher: AstNodeMatcher): number | null;
    /**
     * Search the ast subtree and return all matches, in document order
     *
     * @param node node id
     * @param matcher called with the arena and the node id
     */
    findAll(node: number, matcher: AstNodeMatcher): number[];
    /**
     * Search the ast subtree in reverse order and return the first match (the last node in document order)
     *
     * @param node node id
     * @param matcher called with the arena and the node id
     */
    findLast(node: number, matcher: AstNodeMatcher): number | null;
    /**
     * Search the value tokens of the ast subtree and return the first match: the node that owns the token and the
     * token
     *
     * ```ts
     * // find the first node which contains the length token '30px'
     * import { EnumToken, transform } from "@tbela99/css-parser";
     *
     * const result = await transform(css);
     * const {node, value} = result.arena.findByValue(result.ast, (arena, value) =>
     *     arena.getType(value) == EnumToken.LengthTokenType && arena.getNumericValue(value) == 30 && arena.getUnit(value) == 'px') ?? {};
     * ```
     *
     * @param node node id
     * @param matcher called with the arena and the token id
     */
    findByValue(node: number, matcher: AstValueMatcher): {
        node: number;
        value: number;
    } | null;
    /**
     * Search a token and its descendants, or the value tokens of a node and their descendants, and return the first
     * match
     *
     * @param node node or token id
     * @param matcher called with the arena and the token id
     * @returns the token id or null
     */
    findValue(node: number, matcher: AstValueMatcher): number | null;
    /**
     * direct value tokens of a node or a token: the token list, then the tokens of the structured fields
     * and the child tokens (fractions, unary expressions)
     * @param id
     */
    subTokens(id: number): number[];
    findChild(id: number, predicate: (id: number) => boolean): number | null;
    /**
     * find a token in the token list
     * @param id
     * @param predicate called with the arena and the token id
     */
    findToken(id: number, predicate: (arena: this, id: number) => boolean): number | null;
    /**
     * the children of the parent of a node, the node included
     * @param id
     * @param filter called with the arena and the node id
     */
    siblings(id: number, filter?: (arena: this, id: number) => boolean): number[];
    /**
     * child node ids
     * @param id
     * @param filter called with the arena and the node id
     */
    children(id: number, filter?: (arena: this, id: number) => boolean): number[];
    /**
     * token ids of the token list: the declaration values, the selector / prelude tokens, the function arguments
     * @param id
     * @param filter called with the arena and the token id
     */
    tokens(id: number, filter?: (arena: this, id: number) => boolean): number[];
    /**
     * number of tokens in the token list
     * @param id
     */
    tokenCount(id: number): number;
    setChildren(id: number, ...children: number[]): void;
    /**
     * replace the children. same as {@link setChildren} with an array
     * @param id
     * @param children
     */
    setChildList(id: number, children: number[]): void;
    setTokens(id: number, ...children: number[]): void;
    /**
     * replace the token list. same as {@link setTokens} with an array
     * @param id
     * @param tokens
     */
    setTokenList(id: number, tokens: number[]): void;
    /**
     * move the children of a node into another node, in order
     * @param from
     * @param to
     * @param before the children are inserted before this child of `to`. they are appended when 0
     */
    moveChildren(from: number, to: number, before?: number): void;
    appendChildren(id: number, ...children: number[]): void;
    /**
     * append children. same as {@link appendChildren} with an array
     * @param id
     * @param children
     */
    appendChildList(id: number, children: number[]): void;
    appendTokens(id: number, ...children: number[]): void;
    /**
     * append tokens. same as {@link appendTokens} with an array
     * @param id
     * @param children
     */
    appendTokenList(id: number, children: number[]): void;
    /**
     * append a single child node. faster than appendChildren()
     * @param id
     * @param child
     */
    appendChild(id: number, child: number): void;
    /**
     * append a single token. faster than appendTokens()
     * @param id
     * @param token
     */
    appendToken(id: number, token: number): void;
    /**
     * prepend tokens to the token list
     * @param id
     * @param tokens
     */
    prependTokens(id: number, ...tokens: number[]): void;
    equalsIgnoreCase(node: number, key: "nam" | "val", string: string): boolean;
    startsWith(node: number, key: "nam" | "val", string: string): boolean;
    resize(newSize: number): void;
    /**
     * drop the interned strings that are no longer referenced by any node
     */
    compactStrings(): void;
    /**
     * drop the nodes that are not reachable from the root and renumber the remaining nodes in document order.
     * the node ids change: ids obtained before the call (from visitors for instance) are no longer valid.
     * the unused strings are dropped too
     * @param errors error descriptions whose `node` is remapped
     * @returns mapping of the old ids to the new ids (0 when the node was dropped)
     */
    compact(errors?: ErrorDescription[] | null): Uint32Array;
    /**
     * mark nodes to be released or trimmed later, see {@link release} and {@link trim}.
     * the library never releases nor trims the arena by itself
     * @param ids
     */
    mark(...ids: number[]): void;
    /**
     * true if the node is marked, see {@link mark}
     * @param id
     */
    isMarked(id: number): boolean;
    /**
     * release nodes: detach them and drop their data (interned strings, errors). node ids are never reused:
     * the memory is reclaimed by {@link trim}
     * @param id the node to release. every marked node (and its descendants) is released when omitted
     * @param deep release the children and the tokens too
     */
    release(id?: number, deep?: boolean): void;
    /**
     * reclaim the memory: release the marked nodes, then drop the nodes that are not reachable from the root and
     * renumber the remaining ones, see {@link compact}. the ids obtained before the call are no longer valid
     * @param errors error descriptions whose `node` is remapped
     * @returns mapping of the old ids to the new ids (0 when the node was dropped)
     */
    trim(errors?: ErrorDescription[] | null): Uint32Array;
    setErrors(id: number, errors: ErrorDescription[] | null): void;
    getErrors(id: number): ErrorDescription[] | null;
    /**
     * number of children
     * @param id
     */
    childCount(id: number): number;
}
/**
 * Css ast arena: ast nodes and value tokens.
 *
 * The node data is read and written with the methods of the arena ({@link getType}, {@link getName},
 * {@link getFirstChild}, {@link tokens}, ...). See {@link Arena} and the Arena Memory guide for the memory usage.
 */
declare class AstArena extends Arena {
    /**
     * raw selector (minification cache). sparse: only rules have an entry
     */
    raw: Array<RawSelectorTokens | null | undefined>;
    /**
     * optimized selector (minification cache). sparse: only rules have an entry
     */
    optimized: Array<OptimizedSelector | null | undefined>;
    /**
     * source ids. `spans` store the index in this table (8 bits)
     */
    sources: number[];
    constructor(size?: number);
    /**
     * @inheritDoc
     */
    protected exportProperties(): ArenaProperties;
    /**
     * @inheritDoc
     */
    protected importProperties(properties: ArenaProperties, transferables: ArenaTransferables): void;
    /**
     * @inheritDoc
     */
    release(id?: number, deep?: boolean): void;
    /**
     * @inheritDoc
     */
    compact(errors?: ErrorDescription[] | null): Uint32Array;
    /**
     * validation state bits
     * @param id
     */
    getState(id: number): EnumAstNodeStatus;
    /**
     * set the validation state bits
     * @param id
     * @param state
     */
    setState(id: number, state: EnumAstNodeStatus | null | undefined): void;
    /**
     * true if the node is invalid
     * @param id
     */
    isInvalid(id: number): boolean;
    /**
     * index of a source id in the sources table
     * @param srcId
     */
    sourceIndex(srcId: number): number;
    /**
     * set the source location
     * @param id
     * @param srcId source id
     * @param sta start offset
     * @param end end offset
     */
    setLocation(id: number, srcId: number | null | undefined, sta: number | null | undefined, end: number | null | undefined): void;
    /**
     * set the location of a token from the tokenizer values. the source index is the index of the source id in the sources table
     * @param id
     * @param sourceIndex
     * @param sta
     * @param end
     */
    setTokenLocation(id: number, sourceIndex: number, sta: number, end: number): void;
    /**
     * copy the source location of another node
     * @param id
     * @param source node id
     */
    copyLocation(id: number, source: number): void;
    /**
     * set the location from the start of a node to the end of another one
     * @param id
     * @param start
     * @param end
     */
    spanLocation(id: number, start: number, end: number): void;
    /**
     * true if the node has a source location
     * @param id
     */
    hasLocation(id: number): boolean;
    /**
     * source location
     * @param id
     */
    getLocation(id: number): SourceLocation | null;
    /**
     * source id of the node location
     * @param id
     */
    getSource(id: number): number;
    /**
     * allocate a stylesheet node
     */
    createStyleSheet(): number;
    /**
     * allocate a rule node
     * @param typ
     * @param sel
     * @param tokens prelude tokens
     * @param state
     * @param errors
     */
    createRule(typ: EnumToken, sel: string, tokens: number[] | null | undefined, state: EnumAstNodeStatus | null | undefined, errors: ErrorDescription[] | null | undefined): number;
    /**
     * allocate an at-rule node
     * @param typ
     * @param nam
     * @param val
     * @param block true if the at-rule has a block
     * @param tokens prelude tokens
     * @param state
     * @param errors
     */
    createAtRule(typ: EnumToken, nam: string, val: string, block: boolean, tokens: number[] | null | undefined, state: EnumAstNodeStatus | null | undefined, errors: ErrorDescription[] | null | undefined): number;
    /**
     * allocate a declaration node
     * @param typ
     * @param nam
     * @param val value tokens
     * @param state
     * @param errors
     */
    createDeclaration(typ: EnumToken, nam: string, val: number[] | null | undefined, state: EnumAstNodeStatus | null | undefined, errors: ErrorDescription[] | null | undefined): number;
    /**
     * allocate a comment node
     * @param typ
     * @param val
     */
    createComment(typ: EnumToken, val: string): number;
    /**
     * allocate a token. string values are interned, numeric values are stored in the `numericValue` column
     * @param typ
     * @param val
     * @param unit
     */
    createToken(typ: EnumToken, val?: string | number | null, unit?: string | null): number;
    /**
     * allocate a color token
     * @param val color name, hex value or color function name
     * @param kin
     * @param tokens color function arguments
     */
    createColor(val: string, kin: ColorType$1, tokens?: number[] | null): number;
    /**
     * allocate a function token
     * @param typ function token type
     * @param name function name
     * @param tokens arguments
     */
    createFunction(typ: EnumToken, name: string, tokens?: number[] | null): number;
    /**
     * allocate a list token (parens, attribute, wrapped values, ...)
     * @param typ
     * @param tokens
     */
    createList(typ: EnumToken, tokens?: number[] | null): number;
    /**
     * allocate a binary expression token. the operator is stored in the `numericValue` column
     * @param op
     * @param l
     * @param r
     */
    createBinaryExpression(op: EnumToken, l: number, r: number): number;
    /**
     * allocate a fraction token
     * @param l numerator
     * @param r denominator
     */
    createFraction(l: number, r: number): number;
    /**
     * true if the numeric token value is a fraction
     * @param id
     */
    hasFraction(id: number): boolean;
    /**
     * fraction token of a numeric token
     * @param id
     */
    getFraction(id: number): number;
    /**
     * set the fraction value of a numeric token. the numeric value is set to the fraction value
     * @param id
     * @param fraction fraction token id or null
     */
    setFraction(id: number, fraction: number | null): void;
    /**
     * numerator of a fraction token
     * @param id
     */
    numerator(id: number): number;
    /**
     * denominator of a fraction token
     * @param id
     */
    denominator(id: number): number;
    /**
     * string value of a token (`val`)
     * @param id
     */
    str(id: number): string;
    /**
     * set the string value of a token (`val`)
     * @param id
     * @param value
     */
    setStr(id: number, value: string): void;
    /**
     * set the unit of a token
     * @param id
     * @param unit
     */
    setUnitString(id: number, unit: string | null): void;
    /**
     * true if the token is a numeric token (number, dimension, percentage, ...)
     * @param id
     */
    isNumeric(id: number): boolean;
    /**
     * replace a token by other tokens in its parent token list
     * @param id
     * @param tokens
     */
    replaceToken(id: number, ...tokens: number[]): void;
    /**
     * get a token that can be attached to a new parent: the token itself when it is detached, a deep clone otherwise.
     * a token can only belong to one token list
     * @param token
     */
    take(token: number): number;
    /**
     * copy the data columns of a token (type, values, unit, color type, location)
     * @param target
     * @param source
     */
    copyToken(target: number, source: number): void;
    /**
     * reset a token to a new type. the values, the token list and the fields are dropped
     * @param id
     * @param typ
     * @param val
     * @param unit
     */
    resetToken(id: number, typ: EnumToken, val?: string | number | null, unit?: string | null): void;
    /**
     * Import an object: an {@link AstArenaNode} or a plain object ({@link PlainAstNode}, {@link PlainToken}).
     *
     * - importing a view of this arena is a noop: its node id is returned, the node is not copied,
     * - a view of another arena is copied with its descendants (see {@link import}),
     * - a plain object is allocated in the arena. `chi`, `val`, `l`, `r`, ... are created recursively, they can be
     *   node ids, views or plain objects.
     *
     * @param node
     * @returns the node id
     */
    fromObject(node: AstArenaNode | PlainAstNode | PlainToken): number;
    /**
     * create an ast node from a plain object
     * @param node
     */
    protected nodeFromObject(node: PlainAstNode): number;
    /**
     * create a token from a plain object
     * @param token
     */
    protected tokenFromObject(token: PlainToken): number;
    /**
     * Object view of a node or a token: an {@link AstArenaNode}. The view does not copy the node: its properties read
     * and write the arena. Importing the view in this arena ({@link fromObject}, visitor results, setters of the
     * views) is a noop
     *
     * ```ts
     * function visitor(arena: AstArena, id: number) {
     *
     *     const node = arena.toObject(id);
     *
     *     console.log(node.typ, node.nam, node.val);
     * }
     * ```
     *
     * @param id node or token id
     */
    toObject(id: number): AstArenaNode;
    /**
     * export a node or a token as a plain object (deep copy). `JSON.stringify()` of an {@link AstArenaNode} returns
     * the plain object
     * @param id
     */
    toPlainObject(id: number): PlainAstNode | PlainToken;
    /**
     * export a token as a plain object (deep copy)
     * @param id
     */
    tokenToObject(id: number): PlainToken;
    /**
     * clone a node or a token. tokens are always cloned deeply
     * @param id
     * @param deep also clone the children (rules) or the value tokens (declarations)
     * @param cloneMap map of the source ids to their clones
     */
    clone(id: number, deep?: boolean, cloneMap?: Map<number, number> | null): number;
    /**
     * copy a node or a token of another arena into this arena
     * @param source
     * @param id
     * @param deep copy the children. defaults to true
     */
    import(source: AstArena, id: number, deep?: boolean): number;
    /**
     * index of a child in its parent's children (or tokens) list
     * @param id
     */
    indexOf(id: number): number;
    /**
     * insert nodes before a child
     * @param reference
     * @param nodes
     */
    insertBefore(reference: number, ...nodes: number[]): void;
    /**
     * insert nodes after a child
     * @param reference
     * @param nodes
     */
    insertAfter(reference: number, ...nodes: number[]): void;
    /**
     * prepend children
     * @param id
     * @param nodes
     */
    prependChildren(id: number, ...nodes: number[]): void;
    /**
     * replace a child with other nodes. the node itself may be part of the replacement
     * @param id
     * @param nodes
     */
    replaceChild(id: number, ...nodes: number[]): void;
    /**
     * true if the node has a block (at-rules) or a children list
     * @param id
     */
    hasChildren(id: number): boolean;
    /**
     * rule selector
     * @param id
     */
    getSelector(id: number): string;
    /**
     * set the rule selector
     * @param id
     * @param sel
     */
    setSelector(id: number, sel: string): void;
    /**
     * set the at-rule / declaration name
     * @param id
     * @param nam
     */
    setNameString(id: number, nam: string): void;
    /**
     * set the at-rule prelude / comment string value
     * @param id
     * @param val
     */
    setValueString(id: number, val: string): void;
    /**
     * Expand the css nesting rules of a stylesheet, a rule or an at-rule. The tree is expanded in place: the nested rules
     * are moved into the parent of their rule and their selectors are resolved
     *
     * ```ts
     * const result = await parse(`.foo { color: red; .bar & { color: blue } }`);
     *
     * result.arena.expand(result.ast);
     * console.log(render(result.arena, result.ast).code);
     * ```
     *
     * @param ast node id
     * @returns the node id
     */
    expand(ast: AstStyleSheet | AstAtRule | AstRule): AstNode;
    /**
     * expand a rule: the nested rules and at-rules are moved out of the rule, into `parent` before `before`.
     * the rule is detached when it has no children left
     * @param node
     * @param parent
     * @param before the expanded nodes are inserted before this child of parent. they are appended when 0
     */
    protected expandRule(node: AstRule, parent: AstNode, before: AstNode): void;
    /**
     * replace the nesting selector '&' of a selector
     * @internal
     * @param input
     * @param replace
     */
    replaceCompound(input: string, replace: string): string;
    protected replaceCompoundLiteral(selector: string, replace: string): string;
}

/**
 * token or node location
 */
export declare interface SourceLocation {
    /**
     * start position
     */
    sta: number;
    /**
     * end position
     */
    end: number;
    /**
     * source file
     */
    srcId: number;
}

/**
 * Common plain token interface. Plain tokens are the object representation of the arena tokens
 * returned by `arena.toPlainObject()`. `arena.toObject()` returns an {@link AstArenaNode} view with the same properties
 */
export declare interface BaseToken {
    /**
     * token type
     */
    typ: EnumToken;
    /**
     * source location
     */
    loc?: SourceLocation | null;
}

/**
 * plain object representation of an ast node (`arena.toPlainObject()` / `arena.fromObject()`). `arena.toObject()`
 * returns an {@link AstArenaNode} view with the same properties. The library only deals with node ids internally
 */
export declare interface PlainAstNode {
    /**
     * node type
     */
    typ: EnumToken;
    /**
     * rule selector
     */
    sel?: string;
    /**
     * at-rule / declaration name
     */
    nam?: string;
    /**
     * at-rule prelude, comment or declaration value tokens
     */
    val?: string | Array<PlainToken | Token>;
    /**
     * children
     */
    chi?: Array<PlainAstNode | AstNode>;
    /**
     * prelude / selector tokens
     */
    tokens?: Array<PlainToken | Token> | null;
    /**
     * source location
     */
    loc?: SourceLocation | null;
    /**
     * validation state
     */
    state?: EnumAstNodeStatus | null;
    /**
     * validation errors
     */
    errors?: ErrorDescription[] | null;
    /**
     * raw selector
     */
    raw?: RawSelectorTokens | null;
    /**
     * optimized selector
     */
    optimized?: OptimizedSelector | null;
}

/**
 * Ast nodes are integer ids of records stored in an {@link AstArena}.
 *
 * - `arena.getType(node)` is the node type ({@link EnumToken}),
 * - `arena.getName(node)` is the name of declarations / at-rules and the selector of rules,
 * - `arena.getValue(node)` is the string value of at-rules and comments,
 * - `arena.tokens(node)` (`arena.getFirstToken(node)` ... `arena.getLastToken(node)`) are the declaration value tokens
 *   or the rule selector / at-rule prelude tokens,
 * - `arena.getFlags(node)` holds the validation state ({@link EnumAstNodeStatus}) and the node flags,
 * - `arena.getFirstChild(node)`, `arena.getLastChild(node)`, `arena.getNextSibling(node)`,
 *   `arena.getPreviousSibling(node)` and `arena.getParent(node)` link the tree.
 */
export declare type AstNode = number;

/**
 * comment node id
 */
export declare type AstComment = number;
/**
 * declaration node id
 */
export declare type AstDeclaration = number;
/**
 * rule node id
 */
export declare type AstRule = number;
/**
 * keyframes rule node id
 */
export declare type AstKeyframesRule = number;
/**
 * at rule node id
 */
export declare type AstAtRule = number;
/**
 * keyframes at rule node id
 */
export declare type AstKeyframesAtRule = number;
/**
 * rule list node id
 */
export declare type AstRuleList = number;
/**
 * stylesheet node id
 */
export declare type AstStyleSheet = number;

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
    optimized: Token[];
    /**
     * selector
     */
    selector: Token[][];
    /**
     * reducible
     */
    reducible: boolean;
}

/**
 * value token matcher of {@link AstArena.findByValue} and {@link AstArena.findValue}. the node that owns the token is
 * `arena.getValueOwner(token)`
 */
type AstValueMatcher = (arena: AstArena, token: Token) => boolean;

/**
 * node matcher of {@link AstArena.find}, {@link AstArena.findAll} and {@link AstArena.findLast}. the parent of the node
 * is `arena.getParent(node)`
 */
type AstNodeMatcher = (arena: AstArena, node: AstNode) => boolean;

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
    kin: ColorType$1;
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

/**
 * Generic visitor result: a node id, an object or an array of node ids and objects. the object views of the arena
 * (`arena.toObject()`) are not copied, the other objects are imported into the arena with `arena.fromObject()`.
 * null (or nothing) keeps the node
 */
export declare type GenericVisitorSyncResult<T> =
    | T
    | T[]
    | AstArenaNode
    | PlainAstNode
    | PlainToken
    | Array<T | AstArenaNode | PlainAstNode | PlainToken>
    | null
    | void;
/**
 * Generic visitor result
 */
export declare type GenericVisitorAsyncResult<T> = Promise<GenericVisitorSyncResult<T>>;
/**
 * Generic visitor result
 */
export declare type GenericVisitorResult<T> = GenericVisitorSyncResult<T> | GenericVisitorAsyncResult<T>;

/**
 * Generic visitor handler. it is called with the arena and the node id. the other properties of the node are read
 * from the arena: `arena.getParent(node)`, `arena.toObject(node)`, ...
 */
export declare type GenericVisitorSyncHandler<T> = (arena: AstArena, node: T) => GenericVisitorSyncResult<T>;

/**
 * Generic visitor handler
 */
export declare type GenericVisitorAstNodeSyncHandlerMap<T> =
    | Record<string, GenericVisitorSyncHandler<T>>
    | GenericVisitorSyncHandler<T>
    | Function<T>
    | { type: WalkerEvent; handler: GenericVisitorSyncHandler<T> }
    | { type: WalkerEvent; handler: Record<string, GenericVisitorSyncHandler<T>> };

/**
 * Generic visitor handler
 */
export declare type ValueVisitorSyncHandler = GenericVisitorSyncHandler<Token>;

/**
 * node visitor callback map
 *
 */
export declare interface VisitorSyncNodeMap {
    /**
     * at rule visitor
     *
     * Example: change media at-rule prelude
     *
     * ```ts
     *
     * import {transform, AstArena, AstAtRule, ParserOptions} from "@tbela99/css-parser";
     *
     * const options: ParserOptions = {
     *
     *     visitor: {
     *
     *         AtRule: {
     *
     *             media: (arena: AstArena, node: AstAtRule): AstAtRule => {
     *
     *                 arena.setValueString(node, 'tv,screen');
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
    AtRule?: GenericVisitorAstNodeSyncHandlerMap<AstAtRule>;
    /**
     * declaration visitor
     *
     *  Example: add 'width: 3px' everytime a declaration with the name 'height' is found
     *
     * ```ts
     *
     * import {transform, AstArena, AstDeclaration, EnumToken, LengthToken, ParserOptions} from "@tbela99/css-parser";
     *
     * const options: ParserOptions = {
     *
     *     removeEmpty: false,
     *     visitor: {
     *
     *         Declaration: {
     *
     *             // called only for height declaration
     *             height: (arena: AstArena, node: AstDeclaration): AstDeclaration[] => {
     *
     *
     *                 return [
     *                     node,
     *                     // new nodes are allocated in the arena
     *                     arena.createDeclaration(EnumToken.DeclarationNodeType, 'width', [
     *                         <LengthToken>{
     *                             typ: EnumToken.LengthTokenType,
     *                             val: 3,
     *                             unit: 'px'
     *                         }
     *                     ], null, null)
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
     * import {AstArena, AstDeclaration, ParserOptions, transform} from "@tbela99/css-parser";
     *
     * const options: ParserOptions = {
     *
     *     visitor: {
     *
     *         // called for every declaration
     *         Declaration: (arena: AstArena, id: AstDeclaration): null => {
     *
     *             // object view of the declaration: the properties read and write the arena
     *             const node = arena.toObject(id);
     *
     *             if (node.nam == 'height') {
     *
     *                 node.nam = 'width';
     *             }
     *
     *             else if (node.nam == 'margin') {
     *
     *                 node.nam = 'padding';
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
    Declaration?: GenericVisitorAstNodeSyncHandlerMap<AstDeclaration>;

    /**
     * rule visitor
     *
     *  Example: add 'width: 3px' to every rule with the selector '.foo'
     *
     * ```ts
     *
     * import {transform, parseDeclarations, AstArena, AstRule, ParserOptions} from "@tbela99/css-parser";
     *
     * const options: ParserOptions = {
     *
     *     removeEmpty: false,
     *     visitor: {
     *
     *         Rule: (arena: AstArena, node: AstRule): AstRule | null => {
     *
     *             if (arena.getSelector(node) == '.foo') {
     *
     *                 // the declarations are parsed in the same arena
     *                 arena.appendChildren(node, ...parseDeclarations('width: 3px', arena).nodes);
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
    Rule?: GenericVisitorAstNodeSyncHandlerMap<AstRule>;

    /**
     * keyframes rule visitor
     */
    KeyframesRule?: GenericVisitorAstNodeSyncHandlerMap<AstKeyframesRule>;

    /**
     * keyframes at-rule visitor
     */
    KeyframesAtRule?: GenericVisitorAstNodeSyncHandlerMap<AstKeyframesAtRule>;

    /**
     * value visitor
     */
    Value?: GenericVisitorAstNodeSyncHandlerMap<Token>;

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
     *         StyleSheetNodeType: async (arena, node) => {
     *
     *             // insert a new rule. nodes of another arena are imported
     *             const result = await parse('html {--base-color: pink}');
     *             arena.prependChildren(node, arena.import(result.arena, result.arena.getFirstChild(result.ast)));
     *         },
     *         ColorTokenType:  (arena, node) => {
     *
     *             // dump all color tokens
     *             // console.debug(arena.toObject(node));
     *          },
     *          FunctionTokenType:  (arena, node) => {
     *
     *              // dump all function tokens
     *              // console.debug(arena.toObject(node));
     *          },
     *          DeclarationNodeType:  (arena, node) => {
     *
     *              // dump all declaration nodes
     *              // console.debug(arena.toObject(node));
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
    [key: keyof typeof EnumToken]:
        | GenericVisitorAstNodeSyncHandlerMap<Token>
        | GenericVisitorAstNodeSyncHandlerMap<AstNode>;
}

/**
 * Generic visitor handler
 */
export declare type GenericVisitorHandler<T> = (
    arena: AstArena,
    node: T,
) => GenericVisitorSyncResult<T> | GenericVisitorAsyncResult<T>;

/**
 * Generic visitor handler
 */
export declare type GenericVisitorAstNodeHandlerMap<T> =
    | Record<string, GenericVisitorHandler<T>>
    | GenericVisitorHandler<T>
    | { type: WalkerEvent; handler: GenericVisitorHandler<T> }
    | { type: WalkerEvent; handler: Record<string, GenericVisitorHandler<T>> };

/**
 * Generic visitor handler
 */
export declare type ValueVisitorHandler = GenericVisitorHandler<Token>;

/**
 * Declaration visitor handler
 */
export declare type DeclarationVisitorHandler = GenericVisitorHandler<AstDeclaration>;

/**
 * Declaration visitor handler
 */
export declare type DeclarationVisitorHandler = GenericVisitorHandler<AstDeclaration>;
/**
 * Rule visitor handler
 */
export declare type RuleVisitorHandler = GenericVisitorHandler<AstRule>;
/**
 * Rule visitor handler
 */
export declare type RuleVisitorHandler = GenericVisitorHandler<AstRule>;

/**
 * AtRule visitor handler
 */
export declare type AtRuleVisitorHandler = GenericVisitorHandler<AstAtRule>;

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
     * import {transform, AstArena, AstAtRule, ParserOptions} from "@tbela99/css-parser";
     *
     * const options: ParserOptions = {
     *
     *     visitor: {
     *
     *         AtRule: {
     *
     *             media: (arena: AstArena, node: AstAtRule): AstAtRule => {
     *
     *                 arena.setValueString(node, 'tv,screen');
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
     * import {transform, AstArena, AstDeclaration, EnumToken, LengthToken, ParserOptions} from "@tbela99/css-parser";
     *
     * const options: ParserOptions = {
     *
     *     removeEmpty: false,
     *     visitor: {
     *
     *         Declaration: {
     *
     *             // called only for height declaration
     *             height: (arena: AstArena, node: AstDeclaration): AstDeclaration[] => {
     *
     *
     *                 return [
     *                     node,
     *                     // new nodes are allocated in the arena
     *                     arena.createDeclaration(EnumToken.DeclarationNodeType, 'width', [
     *                         <LengthToken>{
     *                             typ: EnumToken.LengthTokenType,
     *                             val: 3,
     *                             unit: 'px'
     *                         }
     *                     ], null, null)
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
     * import {AstArena, AstDeclaration, ParserOptions, transform} from "@tbela99/css-parser";
     *
     * const options: ParserOptions = {
     *
     *     visitor: {
     *
     *         // called for every declaration
     *         Declaration: (arena: AstArena, id: AstDeclaration): null => {
     *
     *             // object view of the declaration: the properties read and write the arena
     *             const node = arena.toObject(id);
     *
     *             if (node.nam == 'height') {
     *
     *                 node.nam = 'width';
     *             }
     *
     *             else if (node.nam == 'margin') {
     *
     *                 node.nam = 'padding';
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
     * import {transform, parseDeclarations, AstArena, AstRule, ParserOptions} from "@tbela99/css-parser";
     *
     * const options: ParserOptions = {
     *
     *     removeEmpty: false,
     *     visitor: {
     *
     *         Rule: (arena: AstArena, node: AstRule): AstRule | null => {
     *
     *             if (arena.getSelector(node) == '.foo') {
     *
     *                 // the declarations are parsed in the same arena
     *                 arena.appendChildren(node, ...parseDeclarations('width: 3px', arena).nodes);
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

    /**
     * keyframes rule visitor
     */
    KeyframesRule?: GenericVisitorAstNodeHandlerMap<AstKeyframesRule>;

    /**
     * keyframes at-rule visitor
     */
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
     *         StyleSheetNodeType: async (arena, node) => {
     *
     *             // insert a new rule. nodes of another arena are imported
     *             const result = await parse('html {--base-color: pink}');
     *             arena.prependChildren(node, arena.import(result.arena, result.arena.getFirstChild(result.ast)));
     *         },
     *         ColorTokenType:  (arena, node) => {
     *
     *             // dump all color tokens
     *             // console.debug(arena.toObject(node));
     *          },
     *          FunctionTokenType:  (arena, node) => {
     *
     *              // dump all function tokens
     *              // console.debug(arena.toObject(node));
     *          },
     *          DeclarationNodeType:  (arena, node) => {
     *
     *              // dump all declaration nodes
     *              // console.debug(arena.toObject(node));
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
 * Parsed visitor handlers
 */
interface ParsedVisitorHandlers {
    /**
     * include tokens
     */
    includeTokens: boolean;
    /**
     * all handlers
     */
    allHandlers: Array<GenericVisitorAstNodeHandlerMap | Record<string, GenericVisitorAstNodeHandlerMap>>;
    /**
     * all visitors
     */
    allVisitorsHandlers?: Set<GenericVisitorHandler<Token>> | Set<GenericVisitorHandler<AstNode>>;
    /**
     * pre all visitors
     */
    preAllVisitorsHandlers?: Set<GenericVisitorHandler<Token>> | Set<GenericVisitorHandler<AstNode>>;
    /**
     * post all visitors
     */
    postAllVisitorsHandlers?: Set<GenericVisitorHandler<Token>> | Set<GenericVisitorHandler<AstNode>>;
}

/**
 * Generate and parse source map
 *
 * ```ts
 * const sourcemap = new SourceMap();
 *
 * // you can also pass an input sourcemap
 * // const sourcemap = new SourceMap(sourcemapObjectOrJSONString);
 *
 * sourcemap.addSourceContent(0, '/css/styles.css', null);
 * sourcemap.addSourceContent(1, '/css/typography.css', null);
 *
 * const maps = [];
 *
 * maps.add([
     1, 1, 0, 1, 1]);
 * maps.add([
     2, 1, 1, 1, 1
 ]);

    sourcemap.add(maps);

    // convert to inline sourcemap
    sourcemap.toUrl();

    // convert to JSON
    sourcemap.toJSON();

    // find the original file, line and column
    sourcemap.find(2, 1);
    ```
 */
declare class SourceMap {
    /**
     *
     * @private
     */
    private keys;
    /**
     * Last location
     */
    private lastLocation;
    /**
     * Version
     * @private
     */
    private version;
    /**
     * Sources map
     * @private
     */
    private sourcesMap;
    /**
     * Sources content
     * @private
     */
    private readonly sourcesContent;
    /**
     * Sources
     * @private
     */
    private readonly sources;
    /**
     * Map
     * @private
     *
     */
    private map;
    /**
     * Map
     * @private
     *
     */
    private reverseMap;
    /**
     * Line
     * @private
     */
    private line;
    /**
     * Constructor
     */
    constructor();
    /**
     * Constructor
     * @param sourcemaps
     */
    constructor(sourcemaps: string | SourceMapObject);
    /**
     * add source
     * @param id source id
     * @param fileName source file
     * @param content source content
     * @returns
     */
    addSourceContent(id: number, fileName: string | null, content: string | null): void;
    /**
     * Add multiple sourcemaps
     * @param maps
     * @throws
     */
    add(maps: Array<[newLine: number, newColumn: number, srcId: number, ln: number, col: number]>): void;
    /**
     * compute original positions
     */
    computePositions(): void;
    /**
     * retrieve original sources, lines and columns
     * @param line generated line
     * @param column generated column
     */
    find(line: number, column: number): Array<[string | null, number, number, string | null]> | null;
    /**
     * Convert to URL encoded string
     */
    toUrl(): string;
    /**
     * Convert to JSON object
     */
    toJSON(): SourceMapObject;
}

/**
 * Compute line and column of the offset
 */
declare class LineMap {
    /**
     * line starts
     */
    readonly lineStarts: number[];
    /**
     * Constructor
     * @param lines
     */
    constructor(lines?: number[]);
    /**
     * Compute line and column of the offset
     * @param offset
     * @returns
     */
    getOffsets(offset: number): [number, number];
    /**
     * search the greatest index of the value less than or equal to offset
     * @param offset
     * @returns
     */
    search(offset: number): number;
    /**
     * get line starts
     * @returns
     */
    getLineStarts(): number[];
    /**
     * add line start
     */
    addLineStart(lineStart: number): void;
}

/**
 * Source file helper class
 */
declare class SourceFile {
    /**
     * Source file ID
     */
    readonly id: number;
    /**
     * Source file path
     */
    readonly file: string | null;
    /**
     * Line map
     */
    readonly lineStarts: LineMap;
    /**
     * Source file content
     */
    content: string;
    private inputSourceMap;
    /**
     * Constructor
     * @param content
     * @param lines
     * @param file
     */
    constructor(content: string, lines: number[], file?: string | null);
    /**
     * Update source content
     * @param content
     */
    append(content: string): void;
    /**
     * get file name
     * @returns
     */
    getFileName(): string | null;
    /**
     * get content
     * @returns
     */
    getContent(): string;
    /**
     * get text
     * @param start
     * @param length
     * @returns
     */
    getText(start: number, length: number): string;
    /**
     * Compute line and column of the offset
     * @param offset
     * @returns
     */
    getOffsets(offset: number): [number, number];
    /**
     * get source location
     * @param offset
     * @returns
     */
    getSourceLocation(offset: number): [string | null, number, number];
    /**
     * get line starts
     * @returns
     */
    getLineStarts(): number[];
    /**
     * add line start
     * @param lineStart
     */
    addLineStart(lineStart: number): void;
    /**
     * set input source map
     * @param inputSourceMap
     */
    setInputSourceMap(inputSourceMap: SourceMapObject | string | null): void;
    /**
     * return input source map
     * @returns
     */
    getInputSourceMap(): SourceMap | null;
}

/**
 * property list options
 */
export declare interface PropertyListOptions {
    /**
     * remove duplicate declarations
     */
    removeDuplicateDeclarations?: boolean | string | string[];
    /**
     * compute shorthand
     */
    computeShorthand?: boolean;
}

/**
 * parse info
 */
export declare interface ParseInfo$1 {
    /**
     * stream
     */
    stream: string;

    /**
     * Source file
     */
    source: SourceFile;

    /**
     * last token position
     */
    position: number;

    /**
     * current parsing position
     */
    currentPosition: number;

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

/**
 * Used by the validation parser
 */
declare const LOC: unique symbol;

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

/**
 * response type
 */
declare enum ResponseType {
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
    ArrayBuffer = 2,
    /**
     * return a json object
     */
    JSON = 3
}

/**
 * shorthand property type
 */
interface PropertyType {
    /**
     * shorthand name
     */
    shorthand: string;
}

/**
 * single property
 */
interface SinglePropertyType {
    /**
     * keyof shorthand property type
     */
    typ: keyof EnumToken;
    /**
     * value
     */
    val: string | number;
}

/**
 * shorthand property map
 */
interface SinglePropertyTypeMapping {
    /**
     * shorthand pattern
     */
    pattern?: string[][];
    /**
     * shorthand mappings
     */
    mapping: Record<string, SinglePropertyType>;
}
/**
 * shorthand configuration
 */
interface ShorthandPropertyType {
    /**
     * shorthand name
     */
    shorthand: string;
    /**
     * mapped shorthand property
     */
    map?: string;
    /**
     * property names
     */
    properties: string[];
    /**
     * property types
     */
    types: string[];
    /**
     * allow multiple values
     */
    multiple: boolean;
    /**
     * values separator
     */
    separator: {
        /**
         * token type
         */
        typ: keyof EnumToken;
        /**
         * token value
         */
        val: string;
    };
    /**
     * value separator
     */
    valueSeparator?: {
        /**
         * token type
         */
        typ: keyof EnumToken;
        /**
         * token value
         */
        val: string;
    };
    /**
     * keywords
     */
    keywords: string[];
}

/**
 * shorthand property set. a set of identical properties such as `margin`
 */
interface PropertySetType {
    /**
     * shorthand property definition
     */
    [key: string]: PropertyType | ShorthandPropertyType;
}

/**
 * mapped shorthand property. a set of different properties such as `font`
 */
interface PropertyMapType {
    /**
     * default values
     */
    default: string[];
    /**
     * property types
     */
    types: string[];
    /**
     * keywords
     */
    keywords: string[];
    /**
     * required
     */
    required?: boolean;
    /**
     * allow multiple values
     */
    multiple?: boolean;
    /**
     * property has a prefix
     */
    prefix?: {
        /**
         * token type
         */
        typ: keyof EnumToken;
        /**
         * token value
         */
        val: string;
    };
    /**
     * previous property
     */
    previous?: string;
    /**
     * separator
     */
    separator?: {
        /**
         * token type
         */
        typ: keyof EnumToken;
    };
    /**
     * property constraints
     */
    constraints?: {
        /**
         * property constraints
         */
        [key: string]: {
            /**
             * property constraints
             */
            [key: string]: any;
        };
    };
    /**
     * values mapping
     */
    mapping?: Record<string, string>;
}

/**
 * mapped shorthand definition
 */
interface ShorthandMapType {
    /**
     * shorthand name
     */
    shorthand: string;
    /**
     * shorthand pattern
     */
    pattern: string;
    /**
     * shorthand keywords
     */
    keywords: string[];
    /**
     * default values
     */
    default: string[];
    /**
     * values mapping
     */
    mapping?: Record<string, string>;
    /**
     * allow multiple values
     */
    multiple?: boolean;
    /**
     * shorthand values separator
     */
    separator?: {
        /**
         * token type
         */
        typ: keyof EnumToken;
        /**
         * token value
         */
        val?: string;
    };
    /**
     * shorthand property sets
     */
    set?: Record<string, string[]>;
    /**
     * shorthand properties
     */
    properties: {
        /**
         * shorthand properties
         */
        [property: string]: PropertyMapType;
    };
}

/**
 * shorthand properties
 */
interface ShorthandProperties {
    /**
     * property types
     */
    types: EnumToken[];
    /**
     * default values
     */
    default: string[];
    /**
     * keywords
     */
    keywords: string[];
    /**
     * required
     */
    required?: boolean;
    /**
     * allow multiple values
     */
    multiple?: boolean;
    /**
     * propery constraints
     */
    constraints?: Array<any>;
    /**
     * values mapping
     */
    mapping?: {
        /**
         * values mapping
         */
        [key: string]: any;
    };
    /**
     * property validation
     */
    validation?: {
        /**
         * property validation
         */
        [key: string]: any;
    };
    /**
     * property has a prefix
     */
    prefix?: string;
}

/**
 * shorthand definition
 */
interface ShorthandDef {
    /**
     * shorthand name
     */
    shorthand: string;
    /**
     * shorthand pattern
     */
    pattern: string;
    /**
     * shorthand keywords
     */
    keywords: string;
    /**
     * default values
     */
    defaults: string[];
    /**
     * allow multiple values
     */
    multiple?: boolean;
    /**
     * values separator
     */
    separator?: string;
}

/**
 * shorthand type
 */
interface ShorthandType {
    /**
     * shorthand name
     */
    shorthand: string;
    /**
     * shorthand properties
     */
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
 * node walker options of {@link AstArena.walk}
 */
export declare interface WalkerOptions {
    /**
     * walk in reverse
     */
    reverse?: boolean;

    /**
     * traverse node children
     */
    children?: boolean;

    /**
     * Traverse node value tokens. If false, only traverse node children
     */
    attributes?: boolean;
    /**
     * filter function to control the walk
     */
    filter?: WalkerFilter | null;
}

/**
 * node walker option, see {@link WalkerOptionEnum}
 */
export declare type WalkerOption = WalkerOptionEnum | null | undefined | void;

/**
 * filter of {@link AstArena.walk}, called for every node. the parent of the node is `arena.getParent(node)`.
 *
 * returned value:
 * - {@link WalkerOptionEnum.Ignore}: ignore this node and its children
 * - {@link WalkerOptionEnum.Stop}: stop walking the tree
 * - {@link WalkerOptionEnum.Children}: walk the children and ignore the current node
 * - {@link WalkerOptionEnum.IgnoreChildren}: walk the node and ignore children
 */
export declare type WalkerFilter = (arena: AstArena, node: AstNode | Token) => WalkerOption;

/**
 * filter of {@link AstArena.walkValues}, called for every token. the parent of the token is
 * `arena.getValueParent(token)`.
 *
 * returned value:
 * - {@link WalkerOptionEnum.Ignore}: ignore this token and its children
 * - {@link WalkerOptionEnum.Stop}: stop walking the tokens
 * - {@link WalkerOptionEnum.IgnoreChildren}: walk the token and ignore its children
 * - an array of token ids: the tokens are walked next
 */
export declare type WalkerValueFilter = (
    arena: AstArena,
    token: Token,
    event: WalkerEvent,
) => WalkerOption | Token[];

/**
 * options of {@link AstArena.walkValues}
 */
export declare interface WalkerValueOptions {
    /**
     * events the filter is called for. defaults to {@link WalkerEvent.Enter}
     */
    event?: WalkerEvent;
    /**
     * filter function
     */
    fn?: WalkerValueFilter | null;
    /**
     * the filter is only called for the tokens of this type, these types, or the tokens accepted by this function
     */
    type?: EnumToken | EnumToken[] | ((arena: AstArena, token: Token) => boolean) | null;
}

/**
 * Error description
 */
export declare interface ErrorDescription {
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
    node?: Token | AstNode | null;
    /**
     * Error location
     */
    location?: [string | null, number, number];
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
     * Enable CSS validation
     */
    validation?: boolean;

    /**
     * Lenient validation. retain nodes that failed validation
     */
    lenient?: boolean;

    /**
     * Visited tokens
     *
     * @private
     */
    visited?: Map<Token, Set<ValidationToken$1>>;

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
     * enable ast minification
     */
    minifyAST?: boolean;
    
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
    | Promise<string>
    | object;

/**
 * CSS module parser options
 */
export declare interface ModuleSyncOptions {
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
     * @param pattern see {@link ModuleSyncOptions.pattern}
     * @param hashLength
     */
    generateScopedName?: (localName: string, filePath: string, pattern: string, hashLength?: number) => string;
}

export declare interface ModuleAsyncOptions extends ModuleSyncOptions {
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
     * Function to generate scoped name
     * @param localName
     * @param filePath
     * @param pattern see {@link ModuleSyncOptions.pattern}
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
export declare interface ParseInputOptions {
    /**
     * Input string or stream
     */
    input: string;
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
 * Input options for string or stream
 * @internal
 */
export declare interface ParseSourceOptions {
    /**
     * Source file to be used for sourcemap
     * @internal
     */
    sourcesMap?: Map<number, SourceFile>;
    /**
     * Source file to be used for sourcemap
     * @internal
     */
    source?: SourceFile | null;
    /**
     * Arena the ast nodes are allocated in. Created by the parser when omitted.
     * Nested parses (`@import`) allocate their nodes in the parent arena.
     */
    arena?: AstArena;
}

/**
 * Parser sourcemap options
 */
export declare interface ParserSourceMapOptions {
    /**
     * Include sourcemap in the ast. Sourcemap info is always generated
     */
    sourcemap?: boolean | "inline";
    /**
     * Input source map
     */
    inputSourceMap?: SourceMapObject | string;
}

/**
 * Sync parseroptions
 */
export declare interface ParserSyncOptions
    extends
        MinifyOptions,
        ParserSourceMapOptions,
        MinifyFeatureOptions,
        ValidationOptions,
        PropertyListOptions,
        ParseSourceOptions {
    /**
     * Source file to be used for sourcemap
     */
    src?: string;
    /**
     * Remove at-rule charset
     */
    removeCharset?: boolean;
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
     * {@link VisitorSyncNodeMap | VisitorSyncNodeMap[]}
     */
    visitor?: GenericVisitorAstNodeSyncHandlerMap<T> | VisitorSyncNodeMap | VisitorSyncNodeMap[];
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
    cache?: Map<AstNode, string>;

    /**
     * CSS modules options
     */
    module?: boolean | ModuleCaseTransformEnum | ModuleScopeEnumOptions | ModuleSyncOptions;

    /**
     * Tokenizing info
     * @private
     */
    parseInfo?: ParseInfo;
}

/**
 * Parser options
 */
export declare interface ParserOptions extends ParserSyncOptions, ModuleAsyncOptions {
    /**
     * Resolve import
     */
    resolveImport?: boolean;

    /**
     * Custom URL and file loader.
     * @param url
     * @param currentDirectory
     * @param responseType
     *
     */
    load?: (
        url: string | { absolute: string; relative: string },
        currentDirectory?: string,
        responseType?: boolean | ResponseType,
    ) => Promise<string | ArrayBuffer | ReadableStream<Uint8Array<ArrayBufferLike>>>;

    /**
     * Node visitor
     * {@link VisitorNodeMap | VisitorNodeMap[]}
     */
    visitor?:
        | GenericVisitorAstNodeSyncHandlerMap<T>
        | GenericVisitorAstNodeHandlerMap<T>
        | VisitorNodeMap
        | VisitorNodeMap[];
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
        arena: AstArena,
        ast: AstRule | AstAtRule,
        options: ParserOptions,
        parent: AstRule | AstAtRule | AstStyleSheet,
        context: {
            [key: string]: any;
        },
        mode: FeatureWalkMode,
    ) => AstNode | AstNode[] | null;
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
     * Source file to be used as CSS input file for sourcemap resolution
     */
    src?: string;

    /**
     * strip comments and whitespace.
     */
    minify?: boolean;

    /**
     * Minify values
     */
    minifyValues?: boolean;

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

    /**
     * Source map
     * @internal
     */
    sourcesMap?: Map<number, SourceFile>;
}

/**
 * Transform options
 */
export declare interface TransformSyncOptions extends ParserSyncOptions, RenderOptions {}

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
     * Parsed ast tree: the id of the stylesheet node in {@link ParseResult.arena}
     */
    ast: AstStyleSheet;
    /**
     * arena the ast nodes are stored in
     */
    arena: AstArena;
    /**
     * Parse errors
     */
    errors: ErrorDescription[];
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
    cssModuleVariables?: Record<string, AstArenaNode>;

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
    errors: ErrorDescription[];
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
    token: Token;
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
    values: Token[];
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
    sources?: Array<string | null>;
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
 * Validation syntax
 * @internal
 */
export declare interface ValidationSyntaxNode {
    /**
     * mdn data syntax
     */
    syntax: string;
    /**
     * validation tokens
     */
    ast?: ValidationToken[];
    /**
     * descriptors
     */
    descriptors?: Record<string, Record<string, string>>;
}

/**
 * Validation selector options
 * @internal
 */
interface ValidationSelectorOptions extends ValidationOptions {
    /**
     * nested selector
     */
    nestedSelector?: boolean;
}

/**
 * Validation media feature
 * @internal
 */
export declare interface ValidationMediaFeature {
    /**
     * media feature type
     */
    type: MediaFeatureType;
    /**
     * media feature status
     */
    status?: string;
    /**
     * media feature category
     */
    category: string;
    /**
     * media feature values
     */
    values?: Array<string> | Array<number>;
}

/**
 * Validation configuration
 * @internal
 */
export declare type ValidationConfiguration = Record<
    ValidationSyntaxGroupEnum,
    ValidationSyntaxNode | Record<string, string[]> | Record<string, ValidationMediaFeature>
>;

/**
 * Validation result
 * @internal
 */
interface ValidationResult {
    /**
     * validation result
     */
    valid: SyntaxValidationResult;
    /**
     * node
     */
    node: AstNode | Token | null;
    /**
     * syntax
     */
    syntax: ValidationToken | string | null;
    /**
     * error
     */
    error: string;
    /**
     * cycle
     */
    cycle?: boolean;
}

/**
 * Validation syntax result
 * @internal
 */
interface ValidationSyntaxResult extends ValidationResult {
    /**
     * syntax
     */
    syntax: ValidationToken | string | null;
    /**
     * context
     */
    context: ValidationContext<Token> | Token[];
}

/**
 * Apply minification rules to the ast tree
 * @param arena
 * @param ast
 * @param options
 * @param recursive
 * @param errors
 * @param nestingContent
 *
 * @private
 */
declare function minify(arena: AstArena, ast: AstNode, options: ParserOptions | MinifyFeatureOptions, recursive: boolean, errors?: ErrorDescription[], nestingContent?: boolean): AstNode;

/**
 * Parse a string as an array of declaration nodes.
 * The nodes are allocated in the given arena, or in a new arena when none is provided
 * @param declaration
 * @param arena
 *
 * Example:
 * ````ts
 *
 * const {arena, nodes} = parseDeclarations('color: red; background: blue');
 * console.log(nodes.map((node) => arena.toObject(node)));
 * ```
 */
declare function parseDeclarations(declaration: string, arena?: AstArena): {
    arena: AstArena;
    nodes: Array<AstDeclaration | AstComment>;
};
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
 * const arena = new AstArena();
 * let tokens = parseString(arena, 'body { color: red; }');
 * console.log(tokens.map((token) => arena.toObject(token)));
 *
 * tokens = parseString(arena, '#c322c980');
 * console.log(tokens.map((token) => arena.toObject(token)));
 * ```
 */
declare function parseString(arena: AstArena, src: string, options?: {
    src?: string;
    parseColor?: boolean;
} | null, errors?: ErrorDescription[]): Token[];

/**
 * render ast token. identical constructs (colors and tokens with sub tokens: functions, parentheses, binary
 * expressions, ...) are rendered once per render, see {@link RenderMemo}
 * @param token
 * @param options
 * @param cache
 * @param reducer
 * @param errors
 * @private
 */
declare function renderValue(arena: AstArena, token: Token, options?: RenderOptions, cache?: {
    [key: string]: any;
}, reducer?: null | ((acc: string, curr: Token) => string), errors?: ErrorDescription[]): string;

/**
 * Converts a color to another color space
 * @param token
 * @param to
 *
 * ```ts
 *
 *     const token = arena.createColor('#F00', ColorType.HEX)
 *     const result = convertColor(arena, token, ColorType.LCH);
 *
 * ```
 */
declare function convertColor(arena: AstArena, token: Token, to: ColorType$1): Token | null;

/**
 * Calculate the distance between two okLab colors.
 *
 * @private
 * {@link https://drafts.csswg.org/css-color-4/#comparing-color-values}
 * @param arena
 * @param color1
 * @param color2
 */
declare function okLabDistance(arena: AstArena, color1: Token, color2: Token): number | null;
/**
 * Check if two colors are close in okLab space.
 * @param arena
 * @param color1
 * @param color2
 * @param threshold
 *
 * @private
 */
declare function isOkLabClose(arena: AstArena, color1: Token, color2: Token, threshold?: number): boolean;

/**
 * parse mdn data syntax
 * @param syntax
 * @returns
 */
declare function parseSyntax(syntax: string): ValidationToken$1[];

declare let version: string;

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
}, currentDirectory?: string, responseType?: boolean | ResponseType): Promise<string | ArrayBuffer | ReadableStream<Uint8Array<ArrayBufferLike>>>;
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
 * let renderResult = render(parseResult.arena, parseResult.ast);
 * console.log(result.code);
 *
 * // body{color:red}
 *
 *
 * renderResult = render(parseResult.arena, parseResult.ast, {beautify: true, convertColor: ColorType.SRGB});
 * console.log(renderResult.code);
 *
 * // body {
 * //  color: color(srgb 1 0 0)
 * // }
 * ```
 */
declare function render(arena: AstArena, data: AstNode, options?: RenderOptions, mapping?: {
    mapping: Record<string, string>;
    importMapping: Record<string, Record<string, string>> | null;
} | null): RenderResult;
/**
 * Parse CSS string
 * @param stream
 * @param options
 *
 * Example:
 *
 * ```ts
 *
 * import {parseSync} from '@tbela99/css-parser';
 *
 *  // css string
 *  let result = parseSync(css, {nestingRules: true});
 *  console.log(result.ast);
 * ```
 *
 */
declare function parseSync(stream: string, options?: ParserSyncOptions): ParseResult;
/**
 * Parse CSS string
 * @param options
 *
 * Parsing a string
 *
 * ```ts
 *
 * import {parseSync} from '@tbela99/css-parser';
 *
 *  // css string
 *  let result = parseSync({input: css, nestingRules: true});
 *  console.log(result.ast);
 * ```
 *
 */
declare function parseSync(options: ParseInputOptions & ParserSyncOptions): ParseResult;
/**
 * Transform CSS
 * @param css
 * @param options
 *
 *
 * ```ts
 *
 * import {transformSync} from '@tbela99/css-parser';
 *
 *  // css string
 *  const result = transformSync(css, {beautify: true});
 *  console.log(result.code);
 * ```
 *
 */
declare function transformSync(css: string, options?: TransformSyncOptions): TransformResult;
/**
 * Transform CSS
 * @param options
 *
 * ```ts
 *
 * import {transformSync} from '@tbela99/css-parser';
 *
 *  // css string
 *  const result = transformSync({input: css, beautify: true});
 *  console.log(result.code);
 * ```
 *
 */
declare function transformSync(options: ParseInputOptions & TransformSyncOptions): TransformResult;
/**
 * Parse CSS
 * @param stream
 * @param options
 *
 * Example:
 *
 * ```ts
 *
 * import {parse} from '@tbela99/css-parser';
 *
 *  // css string
 *  let result = await parse(css);
 *  console.log(result.ast);
 * ```
 *
 * parsing a ReadableStream
 *
 * ```ts
 *
 * import {parse} from '@tbela99/css-parser';
 * import {Readable} from "node:stream";
 *
 * // usage: node index.ts < styles.css or cat styles.css | node index.ts
 *
 *  const readableStream = Readable.toWeb(process.stdin);
 *  let result = await parse(readableStream, {beautify: true});
 *
 *  console.log(result.ast);
 * ```
 *
 * Parsing a file as a ReadableStream
 *
 * ```ts
 *
 *  import {parse} from '@tbela99/css-parser';
 *
 *  const response = await fetch('https://docs.deno.com/styles.css');
 *  const result = await parse(response.body, {beautify: true});
 *
 *  console.log(result.ast);
 * ```
 */
declare function parse(stream: string | ReadableStream<Uint8Array>, options?: ParserOptions): Promise<ParseResult>;
/**
 * Parse CSS
 * @param options
 *
 * @throws Error file not found
 *
 * Parsing a file
 *
 * ```ts
 *
 * import {parse} from '@tbela99/css-parser';
 *
 * const file = 'https://docs.deno.com/styles.css';
 *  // css file or url
 *  let result = await parse({file});
 *  console.log(result.ast);
 * ```
 *
 * Parsing a file as stream
 *
 * ```ts
 *
 * import {parse} from '@tbela99/css-parser';
 *
 *  const file = 'https://docs.deno.com/styles.css';
 *  let result = await parse({file, asStream: true, beautify: true});
 *
 *  console.log(result.ast);
 * ```
 *
 */
declare function parse(options: ParseInputFileOptions & ParserOptions): Promise<ParseResult>;
/**
 * Parse CSS
 * @param options
 *
 * Parsing a string
 *
 * ```ts
 *
 * import {parse} from '@tbela99/css-parser';
 *
 *  // css string
 *  let result = await parse({input:css});
 *  console.log(result.ast);
 * ```
 *
 * Parsing a Readable stream
 *
 * ```ts
 *
 * import {parse} from '@tbela99/css-parser';
 * import {Readable} from "node:stream";
 * *
 *  const readableStream = Readable.toWeb(process.stdin);
 *  let result = await parse({input: readableStream, beautify: true});
 *
 *  console.log(result.ast);
 * ```
 *
 * Parsing a file as a ReadableStream
 *
 * ```ts
 *
 *  import {parse} from '@tbela99/css-parser';
 *
 *  const response = await fetch('https://docs.deno.com/styles.css');
 *  const result = await parse({input: response.body, beautify: true});
 *
 *  console.log(result.ast);
 * ```
 */
declare function parse(options: ParseInputStreamOptions & ParserOptions): Promise<ParseResult>;
/**
 * Transform CSS
 * @param css
 * @param options
 *
 * Parsing a string
 *
 * ```ts
 *
 * import {transform} from '@tbela99/css-parser';
 *
 *  // css string
 *  const result = await transform(css);
 *  console.log(result.code);
 * ```
 *
 * Parsing a Readable stream
 *
 * ```ts
 *
 * import {transform} from '@tbela99/css-parser';
 * import {Readable} from "node:stream";
 *
 * // usage: node index.ts < styles.css or cat styles.css | node index.ts
 *
 *  const readableStream = Readable.toWeb(process.stdin);
 *  const result = await transform(readableStream, {beautify: true});
 *
 *  console.log(result.code);
 * ```
 *
 * Example using fetch
 *
 * ```ts
 *
 *  import {transform} from '@tbela99/css-parser';
 *
 *  const response = await fetch('https://docs.deno.com/styles.css');
 *  result = await transform(response.body, {beautify: true});
 *
 *  console.log(result.code);
 * ```
 */
declare function transform(css: string | ReadableStream<Uint8Array>, options?: TransformOptions): Promise<TransformResult>;
/**
 * Transform CSS
 * @param options
 *
 * Parsing a string
 *
 * ```ts
 *
 * import {transform} from '@tbela99/css-parser';
 *
 *  // css string
 *  const result = await transform({input: css});
 *  console.log(result.code);
 * ```
 *
 * Parsing a Readable stream
 *
 * ```ts
 *
 * import {transform} from '@tbela99/css-parser';
 * import {Readable} from "node:stream";
 *
 * // usage: node index.ts < styles.css or cat styles.css | node index.ts
 *
 *  const readableStream = Readable.toWeb(process.stdin);
 *  const result = await transform( {input: readableStream, beautify: true});
 *
 *  console.log(result.code);
 * ```
 *
 * Parse a file as a ReadableStream
 *
 * ```ts
 *
 *  import {transform} from '@tbela99/css-parser';
 *
 *  const response = await fetch('https://docs.deno.com/styles.css');
 *  result = await transform({input: response.body, beautify: true});
 *
 *  console.log(result.code);
 * ```
 */
declare function transform(options: ParseInputStreamOptions & TransformOptions): Promise<TransformResult>;
/**
 * Transform CSS
 * @param options
 *
 * Parsing a file
 *
 * ```ts
 *
 * import {transform} from '@tbela99/css-parser';
 *
 *  const result = await transform( {file: 'https://docs.deno.com/styles.css', beautify: true});
 *  console.log(result.code);
 * ```
 */
declare function transform(options: ParseInputFileOptions & TransformOptions): Promise<TransformResult>;

export { ARENA, ARENAID, Arena, AstArena, AstArenaNode, ColorType$1 as ColorType, EnumAstNodeStatus, EnumToken, FeatureWalkMode, ModuleCaseTransformEnum, ModuleScopeEnumOptions, ResponseType, SourceMap, TokenField, WalkerEvent, WalkerOptionEnum, arenaColumns, convertColor, dirname, isOkLabClose, load, minify, okLabDistance, parse, parseDeclarations, parseString, parseSync, parseSyntax, render, renderValue as renderToken, resolve, transform, transformSync, version };
export type { AddToken, AndToken, AngleToken, ArenaProperties, ArenaTransferables, AstArenaNodeInput, AstAtRule, AstComment, AstDeclaration, AstKeyframesAtRule, AstKeyframesRule, AstNode, AstNodeMatcher, AstRule, AstRuleList, AstStyleSheet, AstValueMatcher, AtRuleToken, AtRuleVisitorHandler, AttrEndToken, AttrStartToken, AttrToken, Background, BackgroundAttachmentMapping, BackgroundPosition, BackgroundPositionClass, BackgroundPositionConstraints, BackgroundPositionMapping, BackgroundProperties, BackgroundRepeat, BackgroundRepeatMapping, BackgroundSize, BackgroundSizeMapping, BadCDOCommentToken, BadCommentToken, BadStringToken, BadUrlToken, BaseToken, BinaryExpressionNode, BinaryExpressionToken, BlockEndToken, BlockStartToken, Border, BorderColor, BorderColorClass, BorderProperties, BorderRadius, CDOCommentToken, ChildCombinatorToken, ClassSelectorToken, ColonToken, ColorToken, ColumnCombinatorToken, CommaToken, CommentToken, ComposesSelectorToken, ConstraintsMapping, ContainMatchToken, ContainerStyleRangeToken, CssTypeTokenType, CssVariableImportTokenType, CssVariableMapTokenType, CssVariableToken, DashMatchToken, DashedIdentToken, DeclarationToken, DeclarationVisitorHandler, DelimToken, DescendantCombinatorToken, DimensionToken, DivToken, DoubleColonToken, EOFToken, EndMatchToken, EqualMatchToken, ErrorDescription, FlexToken, Font, FontFamily, FontProperties, FontWeight, FontWeightConstraints, FontWeightMapping, FractionToken, FrequencyToken, FunctionDefToken, FunctionImageToken, FunctionToken, FunctionURLToken, GenericVisitorAstNodeHandlerMap, GenericVisitorAstNodeSyncHandlerMap, GenericVisitorAsyncResult, GenericVisitorHandler, GenericVisitorResult, GenericVisitorSyncHandler, GenericVisitorSyncResult, GreaterThanOrEqualToken, GreaterThanToken, GridTemplateFuncToken, HashToken, IdentListToken, IdentToken, IfConditionToken, IfElseConditionToken, ImportantToken, IncludeMatchToken, InfinityToken, LengthToken, LessThanOrEqualToken, LessThanToken, LineHeight, ListToken, LiteralToken, LoadResult, Map$1 as Map, MatchExpressionToken, MatchedSelector, MediaFeatureOnlyToken, MediaFeatureToken, MediaQueryConditionToken, MediaQueryUnaryFeatureToken, MediaRangeQueryToken, MinifyFeature, MinifyFeatureOptions, MinifyOptions, ModuleAsyncOptions, ModuleSyncOptions, MulToken, NaNToken, NameSpaceAttributeToken, NegativeInfinityToken, NestingSelectorToken, NextSiblingCombinatorToken, NotToken, NumberToken, OptimizedSelector, OptimizedSelectorToken, OrToken, Outline, OutlineProperties, ParensEndToken, ParensStartToken, ParensToken, ParseInfo$1 as ParseInfo, ParseInputFileOptions, ParseInputOptions, ParseInputStreamOptions, ParseResult, ParseResultStats, ParseSourceOptions, ParseTokenOptions, ParsedVisitorHandlers, ParserOptions, ParserSourceMapOptions, ParserSyncOptions, PercentageToken, PlainAstNode, PlainToken, Prefix, PropertiesConfig, PropertiesConfigProperties, PropertyListOptions, PropertyMapType, PropertySetType, PropertyType, PseudoClassFunctionToken, PseudoClassToken, PseudoElementToken, PseudoPageToken, PurpleBackgroundAttachment, RawNodeToken, RawSelectorTokens, RenderOptions, RenderResult, ResolutionToken, ResolvedPath, RuleVisitorHandler, SemiColonToken, Separator, ShorthandDef, ShorthandMapType, ShorthandProperties, ShorthandPropertyType, ShorthandType, SinglePropertyType, SinglePropertyTypeMapping, SourceLocation, SourceMapObject, StartMatchToken, StringToken, SubToken, SubsequentCombinatorToken, SupportsQueryConditionToken, SupportsQueryUnaryConditionToken, TimeToken, TimelineFunctionToken, TimingFunctionToken, Token, TokenizeResult, TransformOptions, TransformResult, TransformSyncOptions, UnaryExpression, UnaryExpressionNode, UnclosedStringToken, UniversalSelectorToken, UrlToken, ValidationConfiguration, ValidationMediaFeature, ValidationOptions, ValidationResult, ValidationSelectorOptions, ValidationSyntaxNode, ValidationSyntaxResult, ValidationToken$1 as ValidationToken, Value, ValueVisitorHandler, ValueVisitorSyncHandler, VariableScopeInfo, VisitorNodeMap, VisitorSyncNodeMap, WalkerFilter, WalkerOption, WalkerOptions, WalkerValueFilter, WalkerValueOptions, WhenElseQueryConditionToken, WhenElseUnaryConditionToken, WhitespaceToken, WrappedValuesToken };
