(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.CSSParser = {}));
})(this, (function (exports) { 'use strict';

    /**
     * syntax validation enum
     */
    var SyntaxValidationResult;
    (function (SyntaxValidationResult) {
        /** valid syntax */
        SyntaxValidationResult[SyntaxValidationResult["Valid"] = 0] = "Valid";
        /** drop invalid syntax */
        SyntaxValidationResult[SyntaxValidationResult["Drop"] = 1] = "Drop";
        /** preserve unknown at-rules, declarations and pseudo-classes */
        SyntaxValidationResult[SyntaxValidationResult["Lenient"] = 2] = "Lenient";
    })(SyntaxValidationResult || (SyntaxValidationResult = {}));
    /**
     * enum of validation levels
     */
    exports.ValidationLevel = void 0;
    (function (ValidationLevel) {
        /**
         * disable validation
         */
        ValidationLevel[ValidationLevel["None"] = 0] = "None";
        /**
         * validate selectors
         */
        ValidationLevel[ValidationLevel["Selector"] = 1] = "Selector";
        /**
         * validate at-rules
         */
        ValidationLevel[ValidationLevel["AtRule"] = 2] = "AtRule";
        /**
         * validate declarations
         */
        ValidationLevel[ValidationLevel["Declaration"] = 4] = "Declaration";
        /**
         * validate selectors and at-rules
         */
        ValidationLevel[ValidationLevel["Default"] = 3] = "Default";
        /**
         * validate selectors, at-rules and declarations
         */
        ValidationLevel[ValidationLevel["All"] = 7] = "All"; // selectors + at-rules + declarations
    })(exports.ValidationLevel || (exports.ValidationLevel = {}));
    /**
     * enum of all token types
     */
    exports.EnumToken = void 0;
    (function (EnumToken) {
        /**
         * comment token
         */
        EnumToken[EnumToken["CommentTokenType"] = 0] = "CommentTokenType";
        /**
         * cdata section token
         */
        EnumToken[EnumToken["CDOCOMMTokenType"] = 1] = "CDOCOMMTokenType";
        /**
         * style sheet node type
         */
        EnumToken[EnumToken["StyleSheetNodeType"] = 2] = "StyleSheetNodeType";
        /**
         * at-rule node type
         */
        EnumToken[EnumToken["AtRuleNodeType"] = 3] = "AtRuleNodeType";
        /**
         * rule node type
         */
        EnumToken[EnumToken["RuleNodeType"] = 4] = "RuleNodeType";
        /**
         * declaration node type
         */
        EnumToken[EnumToken["DeclarationNodeType"] = 5] = "DeclarationNodeType";
        /**
         * literal token type
         */
        EnumToken[EnumToken["LiteralTokenType"] = 6] = "LiteralTokenType";
        /**
         * identifier token type
         */
        EnumToken[EnumToken["IdenTokenType"] = 7] = "IdenTokenType";
        /**
         * dashed identifier token type
         */
        EnumToken[EnumToken["DashedIdenTokenType"] = 8] = "DashedIdenTokenType";
        /**
         * comma token type
         */
        EnumToken[EnumToken["CommaTokenType"] = 9] = "CommaTokenType";
        /**
         * colon token type
         */
        EnumToken[EnumToken["ColonTokenType"] = 10] = "ColonTokenType";
        /**
         * semicolon token type
         */
        EnumToken[EnumToken["SemiColonTokenType"] = 11] = "SemiColonTokenType";
        /**
         * number token type
         */
        EnumToken[EnumToken["NumberTokenType"] = 12] = "NumberTokenType";
        /**
         * at-rule token type
         */
        EnumToken[EnumToken["AtRuleTokenType"] = 13] = "AtRuleTokenType";
        /**
         * percentage token type
         */
        EnumToken[EnumToken["PercentageTokenType"] = 14] = "PercentageTokenType";
        /**
         * function token type
         */
        EnumToken[EnumToken["FunctionTokenType"] = 15] = "FunctionTokenType";
        /**
         * timeline function token type
         */
        EnumToken[EnumToken["TimelineFunctionTokenType"] = 16] = "TimelineFunctionTokenType";
        /**
         * timing function token type
         */
        EnumToken[EnumToken["TimingFunctionTokenType"] = 17] = "TimingFunctionTokenType";
        /**
         * url function token type
         */
        EnumToken[EnumToken["UrlFunctionTokenType"] = 18] = "UrlFunctionTokenType";
        /**
         * image function token type
         */
        EnumToken[EnumToken["ImageFunctionTokenType"] = 19] = "ImageFunctionTokenType";
        /**
         * string token type
         */
        EnumToken[EnumToken["StringTokenType"] = 20] = "StringTokenType";
        /**
         * unclosed string token type
         */
        EnumToken[EnumToken["UnclosedStringTokenType"] = 21] = "UnclosedStringTokenType";
        /**
         * dimension token type
         */
        EnumToken[EnumToken["DimensionTokenType"] = 22] = "DimensionTokenType";
        /**
         * length token type
         */
        EnumToken[EnumToken["LengthTokenType"] = 23] = "LengthTokenType";
        /**
         * angle token type
         */
        EnumToken[EnumToken["AngleTokenType"] = 24] = "AngleTokenType";
        /**
         * time token type
         */
        EnumToken[EnumToken["TimeTokenType"] = 25] = "TimeTokenType";
        /**
         * frequency token type
         */
        EnumToken[EnumToken["FrequencyTokenType"] = 26] = "FrequencyTokenType";
        /**
         * resolution token type
         */
        EnumToken[EnumToken["ResolutionTokenType"] = 27] = "ResolutionTokenType";
        /**
         * hash token type
         */
        EnumToken[EnumToken["HashTokenType"] = 28] = "HashTokenType";
        /**
         * block start token type
         */
        EnumToken[EnumToken["BlockStartTokenType"] = 29] = "BlockStartTokenType";
        /**
         * block end token type
         */
        EnumToken[EnumToken["BlockEndTokenType"] = 30] = "BlockEndTokenType";
        /**
         * attribute start token type
         */
        EnumToken[EnumToken["AttrStartTokenType"] = 31] = "AttrStartTokenType";
        /**
         * attribute end token type
         */
        EnumToken[EnumToken["AttrEndTokenType"] = 32] = "AttrEndTokenType";
        /**
         * start parentheses token type
         */
        EnumToken[EnumToken["StartParensTokenType"] = 33] = "StartParensTokenType";
        /**
         * end parentheses token type
         */
        EnumToken[EnumToken["EndParensTokenType"] = 34] = "EndParensTokenType";
        /**
         * parentheses token type
         */
        EnumToken[EnumToken["ParensTokenType"] = 35] = "ParensTokenType";
        /**
         * whitespace token type
         */
        EnumToken[EnumToken["WhitespaceTokenType"] = 36] = "WhitespaceTokenType";
        /**
         * include match token type
         */
        EnumToken[EnumToken["IncludeMatchTokenType"] = 37] = "IncludeMatchTokenType";
        /**
         * dash match token type
         */
        EnumToken[EnumToken["DashMatchTokenType"] = 38] = "DashMatchTokenType";
        /**
         * equal match token type
         */
        EnumToken[EnumToken["EqualMatchTokenType"] = 39] = "EqualMatchTokenType";
        /**
         * less than token type
         */
        EnumToken[EnumToken["LtTokenType"] = 40] = "LtTokenType";
        /**
         * less than or equal to token type
         */
        EnumToken[EnumToken["LteTokenType"] = 41] = "LteTokenType";
        /**
         * greater than token type
         */
        EnumToken[EnumToken["GtTokenType"] = 42] = "GtTokenType";
        /**
         * greater than or equal to token type
         */
        EnumToken[EnumToken["GteTokenType"] = 43] = "GteTokenType";
        /**
         * pseudo-class token type
         */
        EnumToken[EnumToken["PseudoClassTokenType"] = 44] = "PseudoClassTokenType";
        /**
         * pseudo-class function token type
         */
        EnumToken[EnumToken["PseudoClassFuncTokenType"] = 45] = "PseudoClassFuncTokenType";
        /**
         * delimiter token type
         */
        EnumToken[EnumToken["DelimTokenType"] = 46] = "DelimTokenType";
        /**
         * URL token type
         */
        EnumToken[EnumToken["UrlTokenTokenType"] = 47] = "UrlTokenTokenType";
        /**
         * end of file token type
         */
        EnumToken[EnumToken["EOFTokenType"] = 48] = "EOFTokenType";
        /**
         * important token type
         */
        EnumToken[EnumToken["ImportantTokenType"] = 49] = "ImportantTokenType";
        /**
         * color token type
         */
        EnumToken[EnumToken["ColorTokenType"] = 50] = "ColorTokenType";
        /**
         * attribute token type
         */
        EnumToken[EnumToken["AttrTokenType"] = 51] = "AttrTokenType";
        /**
         * bad comment token type
         */
        EnumToken[EnumToken["BadCommentTokenType"] = 52] = "BadCommentTokenType";
        /**
         * bad cdo token type
         */
        EnumToken[EnumToken["BadCdoTokenType"] = 53] = "BadCdoTokenType";
        /**
         * bad URL token type
         */
        EnumToken[EnumToken["BadUrlTokenType"] = 54] = "BadUrlTokenType";
        /**
         * bad string token type
         */
        EnumToken[EnumToken["BadStringTokenType"] = 55] = "BadStringTokenType";
        /**
         * binary expression token type
         */
        EnumToken[EnumToken["BinaryExpressionTokenType"] = 56] = "BinaryExpressionTokenType";
        /**
         * unary expression token type
         */
        EnumToken[EnumToken["UnaryExpressionTokenType"] = 57] = "UnaryExpressionTokenType";
        /**
         * flex token type
         */
        EnumToken[EnumToken["FlexTokenType"] = 58] = "FlexTokenType";
        /**
         *  token list token type
         */
        EnumToken[EnumToken["ListToken"] = 59] = "ListToken";
        /* arithmetic tokens */
        /**
         * addition token type
         */
        EnumToken[EnumToken["Add"] = 60] = "Add";
        /**
         * multiplication token type
         */
        EnumToken[EnumToken["Mul"] = 61] = "Mul";
        /**
         * division token type
         */
        EnumToken[EnumToken["Div"] = 62] = "Div";
        /**
         * subtraction token type
         */
        EnumToken[EnumToken["Sub"] = 63] = "Sub";
        /* new tokens */
        /**
         * column combinator token type
         */
        EnumToken[EnumToken["ColumnCombinatorTokenType"] = 64] = "ColumnCombinatorTokenType";
        /**
         * contain match token type
         */
        EnumToken[EnumToken["ContainMatchTokenType"] = 65] = "ContainMatchTokenType";
        /**
         * start match token type
         */
        EnumToken[EnumToken["StartMatchTokenType"] = 66] = "StartMatchTokenType";
        /**
         * end match token type
         */
        EnumToken[EnumToken["EndMatchTokenType"] = 67] = "EndMatchTokenType";
        /**
         * match expression token type
         */
        EnumToken[EnumToken["MatchExpressionTokenType"] = 68] = "MatchExpressionTokenType";
        /**
         * namespace attribute token type
         */
        EnumToken[EnumToken["NameSpaceAttributeTokenType"] = 69] = "NameSpaceAttributeTokenType";
        /**
         * fraction token type
         */
        EnumToken[EnumToken["FractionTokenType"] = 70] = "FractionTokenType";
        /**
         * identifier list token type
         */
        EnumToken[EnumToken["IdenListTokenType"] = 71] = "IdenListTokenType";
        /**
         * grid template function token type
         */
        EnumToken[EnumToken["GridTemplateFuncTokenType"] = 72] = "GridTemplateFuncTokenType";
        /**
         * keyframe rule node type
         */
        EnumToken[EnumToken["KeyFramesRuleNodeType"] = 73] = "KeyFramesRuleNodeType";
        /**
         * class selector token type
         */
        EnumToken[EnumToken["ClassSelectorTokenType"] = 74] = "ClassSelectorTokenType";
        /**
         * universal selector token type
         */
        EnumToken[EnumToken["UniversalSelectorTokenType"] = 75] = "UniversalSelectorTokenType";
        /**
         * child combinator token type
         */
        EnumToken[EnumToken["ChildCombinatorTokenType"] = 76] = "ChildCombinatorTokenType";
        /**
         * descendant combinator token type
         */
        EnumToken[EnumToken["DescendantCombinatorTokenType"] = 77] = "DescendantCombinatorTokenType";
        /**
         * next sibling combinator token type
         */
        EnumToken[EnumToken["NextSiblingCombinatorTokenType"] = 78] = "NextSiblingCombinatorTokenType";
        /**
         * subsequent sibling combinator token type
         */
        EnumToken[EnumToken["SubsequentSiblingCombinatorTokenType"] = 79] = "SubsequentSiblingCombinatorTokenType";
        /**
         * nesting selector token type
         */
        EnumToken[EnumToken["NestingSelectorTokenType"] = 80] = "NestingSelectorTokenType";
        /**
         * invalid rule token type
         */
        EnumToken[EnumToken["InvalidRuleTokenType"] = 81] = "InvalidRuleTokenType";
        /**
         * invalid class selector token type
         */
        EnumToken[EnumToken["InvalidClassSelectorTokenType"] = 82] = "InvalidClassSelectorTokenType";
        /**
         * invalid attribute token type
         */
        EnumToken[EnumToken["InvalidAttrTokenType"] = 83] = "InvalidAttrTokenType";
        /**
         * invalid at rule token type
         */
        EnumToken[EnumToken["InvalidAtRuleTokenType"] = 84] = "InvalidAtRuleTokenType";
        /**
         * media query condition token type
         */
        EnumToken[EnumToken["MediaQueryConditionTokenType"] = 85] = "MediaQueryConditionTokenType";
        /**
         * media feature token type
         */
        EnumToken[EnumToken["MediaFeatureTokenType"] = 86] = "MediaFeatureTokenType";
        /**
         * media feature only token type
         */
        EnumToken[EnumToken["MediaFeatureOnlyTokenType"] = 87] = "MediaFeatureOnlyTokenType";
        /**
         * media feature not token type
         */
        EnumToken[EnumToken["MediaFeatureNotTokenType"] = 88] = "MediaFeatureNotTokenType";
        /**
         * media feature and token type
         */
        EnumToken[EnumToken["MediaFeatureAndTokenType"] = 89] = "MediaFeatureAndTokenType";
        /**
         * media feature or token type
         */
        EnumToken[EnumToken["MediaFeatureOrTokenType"] = 90] = "MediaFeatureOrTokenType";
        /**
         * pseudo page token type
         */
        EnumToken[EnumToken["PseudoPageTokenType"] = 91] = "PseudoPageTokenType";
        /**
         * pseudo element token type
         */
        EnumToken[EnumToken["PseudoElementTokenType"] = 92] = "PseudoElementTokenType";
        /**
         * keyframe at rule node type
         */
        EnumToken[EnumToken["KeyframesAtRuleNodeType"] = 93] = "KeyframesAtRuleNodeType";
        /**
         * invalid declaration node type
         */
        EnumToken[EnumToken["InvalidDeclarationNodeType"] = 94] = "InvalidDeclarationNodeType";
        /**
         * composes token node type
         */
        EnumToken[EnumToken["ComposesSelectorNodeType"] = 95] = "ComposesSelectorNodeType";
        /* aliases */
        /**
         * alias for time token type
         */
        EnumToken[EnumToken["Time"] = 25] = "Time";
        /**
         * alias for identifier token type
         */
        EnumToken[EnumToken["Iden"] = 7] = "Iden";
        /**
         * alias for end of file token type
         */
        EnumToken[EnumToken["EOF"] = 48] = "EOF";
        /**
         * alias for hash token type
         */
        EnumToken[EnumToken["Hash"] = 28] = "Hash";
        /**
         * alias for flex token type
         */
        EnumToken[EnumToken["Flex"] = 58] = "Flex";
        /**
         * alias for angle token type
         */
        EnumToken[EnumToken["Angle"] = 24] = "Angle";
        /**
         * alias for color token type
         */
        EnumToken[EnumToken["Color"] = 50] = "Color";
        /**
         * alias for comma token type
         */
        EnumToken[EnumToken["Comma"] = 9] = "Comma";
        /**
         * alias for string token type
         */
        EnumToken[EnumToken["String"] = 20] = "String";
        /**
         * alias for length token type
         */
        EnumToken[EnumToken["Length"] = 23] = "Length";
        /**
         * alias for number token type
         */
        EnumToken[EnumToken["Number"] = 12] = "Number";
        /**
         * alias for percentage token type
         */
        EnumToken[EnumToken["Perc"] = 14] = "Perc";
        /**
         * alias for literal token type
         */
        EnumToken[EnumToken["Literal"] = 6] = "Literal";
        /**
         * alias for comment token type
         */
        EnumToken[EnumToken["Comment"] = 0] = "Comment";
        /**
         * alias for url function token type
         */
        EnumToken[EnumToken["UrlFunc"] = 18] = "UrlFunc";
        /**
         * alias for dimension token type
         */
        EnumToken[EnumToken["Dimension"] = 22] = "Dimension";
        /**
         * alias for frequency token type
         */
        EnumToken[EnumToken["Frequency"] = 26] = "Frequency";
        /**
         * alias for resolution token type
         */
        EnumToken[EnumToken["Resolution"] = 27] = "Resolution";
        /**
         * alias for whitespace token type
         */
        EnumToken[EnumToken["Whitespace"] = 36] = "Whitespace";
        /**
         * alias for identifier list token type
         */
        EnumToken[EnumToken["IdenList"] = 71] = "IdenList";
        /**
         * alias for dashed identifier token type
         */
        EnumToken[EnumToken["DashedIden"] = 8] = "DashedIden";
        /**
         * alias for grid template function token type
         */
        EnumToken[EnumToken["GridTemplateFunc"] = 72] = "GridTemplateFunc";
        /**
         * alias for image function token type
         */
        EnumToken[EnumToken["ImageFunc"] = 19] = "ImageFunc";
        /**
         * alias for comment node type
         */
        EnumToken[EnumToken["CommentNodeType"] = 0] = "CommentNodeType";
        /**
         * alias for cdata section node type
         */
        EnumToken[EnumToken["CDOCOMMNodeType"] = 1] = "CDOCOMMNodeType";
        /**
         * alias for timing function token type
         */
        EnumToken[EnumToken["TimingFunction"] = 17] = "TimingFunction";
        /**
         * alias for timeline function token type
         */
        EnumToken[EnumToken["TimelineFunction"] = 16] = "TimelineFunction";
    })(exports.EnumToken || (exports.EnumToken = {}));
    /**
     * supported color types enum
     */
    exports.ColorType = void 0;
    (function (ColorType) {
        /**
         * system colors
         */
        ColorType[ColorType["SYS"] = 0] = "SYS";
        /**
         * deprecated system colors
         */
        ColorType[ColorType["DPSYS"] = 1] = "DPSYS";
        /**
         * colors as literals
         */
        ColorType[ColorType["LIT"] = 2] = "LIT";
        /**
         * colors as hex values
         */
        ColorType[ColorType["HEX"] = 3] = "HEX";
        /**
         * colors as rgb values
         */
        ColorType[ColorType["RGBA"] = 4] = "RGBA";
        /**
         * colors as hsl values
         */
        ColorType[ColorType["HSLA"] = 5] = "HSLA";
        /**
         * colors as hwb values
         */
        ColorType[ColorType["HWB"] = 6] = "HWB";
        /**
         * colors as cmyk values
         */
        ColorType[ColorType["CMYK"] = 7] = "CMYK";
        /**
         * colors as oklab values
         * */
        ColorType[ColorType["OKLAB"] = 8] = "OKLAB";
        /**
         * colors as oklch values
         * */
        ColorType[ColorType["OKLCH"] = 9] = "OKLCH";
        /**
         * colors as lab values
         */
        ColorType[ColorType["LAB"] = 10] = "LAB";
        /**
         * colors as lch values
         */
        ColorType[ColorType["LCH"] = 11] = "LCH";
        /**
         * colors using color() function
         */
        ColorType[ColorType["COLOR"] = 12] = "COLOR";
        /**
         * color using srgb values
         */
        ColorType[ColorType["SRGB"] = 13] = "SRGB";
        /**
         * color using prophoto-rgb values
         */
        ColorType[ColorType["PROPHOTO_RGB"] = 14] = "PROPHOTO_RGB";
        /**
         * color using a98-rgb values
         */
        ColorType[ColorType["A98_RGB"] = 15] = "A98_RGB";
        /**
         * color using rec2020 values
         */
        ColorType[ColorType["REC2020"] = 16] = "REC2020";
        /**
         * color using display-p3 values
         */
        ColorType[ColorType["DISPLAY_P3"] = 17] = "DISPLAY_P3";
        /**
         * color using srgb-linear values
         */
        ColorType[ColorType["SRGB_LINEAR"] = 18] = "SRGB_LINEAR";
        /**
         * color using xyz-d50 values
         */
        ColorType[ColorType["XYZ_D50"] = 19] = "XYZ_D50";
        /**
         * color using xyz-d65 values
         */
        ColorType[ColorType["XYZ_D65"] = 20] = "XYZ_D65";
        /**
         * light-dark() color function
         */
        ColorType[ColorType["LIGHT_DARK"] = 21] = "LIGHT_DARK";
        /**
         * color-mix() color function
         */
        ColorType[ColorType["COLOR_MIX"] = 22] = "COLOR_MIX";
        /**
         * alias for rgba
         */
        ColorType[ColorType["RGB"] = 4] = "RGB";
        /**
         * alias for hsl
         */
        ColorType[ColorType["HSL"] = 5] = "HSL";
        /**
         * alias for xyz-d65
         */
        ColorType[ColorType["XYZ"] = 20] = "XYZ";
        /**
         * alias for cmyk
         */
        ColorType[ColorType["DEVICE_CMYK"] = 7] = "DEVICE_CMYK";
    })(exports.ColorType || (exports.ColorType = {}));
    exports.ModuleCaseTransformEnum = void 0;
    (function (ModuleCaseTransformEnum) {
        /**
         * export as-is
         */
        ModuleCaseTransformEnum[ModuleCaseTransformEnum["Ignore"] = 1] = "Ignore";
        /**
         * transform class names and mapping key name
         */
        ModuleCaseTransformEnum[ModuleCaseTransformEnum["CamelCase"] = 2] = "CamelCase";
        /**
         * transform class names and mapping key name
         */
        ModuleCaseTransformEnum[ModuleCaseTransformEnum["CamelCaseOnly"] = 4] = "CamelCaseOnly";
        /**
         * transform class names and mapping key name
         */
        ModuleCaseTransformEnum[ModuleCaseTransformEnum["DashCase"] = 8] = "DashCase";
        /**
         * transform class names and mapping key name
         */
        ModuleCaseTransformEnum[ModuleCaseTransformEnum["DashCaseOnly"] = 16] = "DashCaseOnly";
    })(exports.ModuleCaseTransformEnum || (exports.ModuleCaseTransformEnum = {}));
    exports.ModuleScopeEnumOptions = void 0;
    (function (ModuleScopeEnumOptions) {
        ModuleScopeEnumOptions[ModuleScopeEnumOptions["Global"] = 32] = "Global";
        ModuleScopeEnumOptions[ModuleScopeEnumOptions["Local"] = 64] = "Local";
        ModuleScopeEnumOptions[ModuleScopeEnumOptions["Pure"] = 128] = "Pure";
        ModuleScopeEnumOptions[ModuleScopeEnumOptions["ICSS"] = 256] = "ICSS";
    })(exports.ModuleScopeEnumOptions || (exports.ModuleScopeEnumOptions = {}));

    // from https://www.w3.org/TR/css-color-4/multiply-matrices.js
    /**
     * Simple matrix (and vector) multiplication
     * Warning: No error handling for incompatible dimensions!
     * @author Lea Verou 2020 MIT License
     */
    // A is m x n. B is n x p. product is m x p.
    function multiplyMatrices(A, B) {
        let m = A.length;
        if (!Array.isArray(A[0])) {
            // A is vector, convert to [[a, b, c, ...]]
            A = [A];
        }
        if (!Array.isArray(B[0])) {
            // B is vector, convert to [[a], [b], [c], ...]]
            B = B.map((x) => [x]);
        }
        let p = B[0].length;
        let B_cols = B[0].map((_, i) => B.map((x) => x[i])); // transpose B
        let product = A.map((row) => B_cols.map((col) => {
            if (!Array.isArray(row)) {
                return col.reduce((a, c) => a + c * row, 0);
            }
            return row.reduce((a, c, i) => a + c * (col[i] || 0), 0);
        }));
        if (m === 1) {
            product = product[0]; // Avoid [[a, b, c, ...]]
        }
        if (p === 1) {
            return product.map((x) => x[0]); // Avoid [[a], [b], [c], ...]]
        }
        return product;
    }

    const colorPrecision = 6;
    const anglePrecision = .001;
    const colorRange = {
        lab: {
            l: [0, 100],
            a: [-125, 125],
            b: [-125, 125]
        },
        lch: {
            l: [0, 100],
            c: [0, 150],
            h: [0, 360]
        },
        oklab: {
            l: [0, 1],
            a: [-0.4, .4],
            b: [-0.4, 0.4]
        },
        oklch: {
            l: [0, 1],
            a: [0, .4],
            b: [0, 0.4]
        }
    };
    const timelineFunc = ['view', 'scroll'];
    const generalEnclosedFunc = ['selector', 'font-tech', 'font-format', 'media', 'supports'];
    const timingFunc = ['ease', 'ease-in', 'ease-out', 'ease-in-out', 'linear', 'step-start', 'step-end', 'steps', 'cubic-bezier'];
    const funcLike = [
        exports.EnumToken.ParensTokenType,
        exports.EnumToken.FunctionTokenType,
        exports.EnumToken.UrlFunctionTokenType,
        exports.EnumToken.StartParensTokenType,
        exports.EnumToken.ImageFunctionTokenType,
        exports.EnumToken.TimingFunctionTokenType,
        exports.EnumToken.TimingFunctionTokenType,
        exports.EnumToken.PseudoClassFuncTokenType,
        exports.EnumToken.GridTemplateFuncTokenType
    ];
    const colorsFunc = ['rgb', 'rgba', 'hsl', 'hsla', 'hwb', 'device-cmyk', 'color-mix', 'color', 'oklab', 'lab', 'oklch', 'lch', 'light-dark'];
    const colorFuncColorSpace = ['srgb', 'srgb-linear', 'display-p3', 'prophoto-rgb', 'a98-rgb', 'rec2020', 'xyz', 'xyz-d65', 'xyz-d50'];
    const D50 = [0.3457 / 0.3585, 1.00000, (1.0 - 0.3457 - 0.3585) / 0.3585];
    const k = Math.pow(29, 3) / Math.pow(3, 3);
    const e = Math.pow(6, 3) / Math.pow(29, 3);
    // color module v4
    const systemColors = new Set(['ActiveText', 'ButtonBorder', 'ButtonFace', 'ButtonText', 'Canvas', 'CanvasText', 'Field', 'FieldText', 'GrayText', 'Highlight', 'HighlightText', 'LinkText', 'Mark', 'MarkText', 'VisitedText', '-webkit-focus-ring-color'].map(m => m.toLowerCase()));
    // deprecated
    const deprecatedSystemColors = new Set(['ActiveBorder', 'ActiveCaption', 'AppWorkspace', 'Background', 'ButtonFace', 'ButtonHighlight', 'ButtonShadow', 'ButtonText', 'CaptionText', 'GrayText', 'Highlight', 'HighlightText', 'InactiveBorder', 'InactiveCaption', 'InactiveCaptionText', 'InfoBackground', 'InfoText', 'Menu', 'MenuText', 'Scrollbar', 'ThreeDDarkShadow', 'ThreeDFace', 'ThreeDHighlight', 'ThreeDLightShadow', 'ThreeDShadow', 'Window', 'WindowFrame', 'WindowText'].map(t => t.toLowerCase()));
    // name to color
    const COLORS_NAMES = Object.seal({
        'aliceblue': '#f0f8ff',
        'antiquewhite': '#faebd7',
        'aqua': '#00ffff',
        'aquamarine': '#7fffd4',
        'azure': '#f0ffff',
        'beige': '#f5f5dc',
        'bisque': '#ffe4c4',
        'black': '#000000',
        'blanchedalmond': '#ffebcd',
        'blue': '#0000ff',
        'blueviolet': '#8a2be2',
        'brown': '#a52a2a',
        'burlywood': '#deb887',
        'cadetblue': '#5f9ea0',
        'chartreuse': '#7fff00',
        'chocolate': '#d2691e',
        'coral': '#ff7f50',
        'cornflowerblue': '#6495ed',
        'cornsilk': '#fff8dc',
        'crimson': '#dc143c',
        'cyan': '#00ffff',
        'darkblue': '#00008b',
        'darkcyan': '#008b8b',
        'darkgoldenrod': '#b8860b',
        'darkgray': '#a9a9a9',
        'darkgrey': '#a9a9a9',
        'darkgreen': '#006400',
        'darkkhaki': '#bdb76b',
        'darkmagenta': '#8b008b',
        'darkolivegreen': '#556b2f',
        'darkorange': '#ff8c00',
        'darkorchid': '#9932cc',
        'darkred': '#8b0000',
        'darksalmon': '#e9967a',
        'darkseagreen': '#8fbc8f',
        'darkslateblue': '#483d8b',
        'darkslategray': '#2f4f4f',
        'darkslategrey': '#2f4f4f',
        'darkturquoise': '#00ced1',
        'darkviolet': '#9400d3',
        'deeppink': '#ff1493',
        'deepskyblue': '#00bfff',
        'dimgray': '#696969',
        'dimgrey': '#696969',
        'dodgerblue': '#1e90ff',
        'firebrick': '#b22222',
        'floralwhite': '#fffaf0',
        'forestgreen': '#228b22',
        'fuchsia': '#ff00ff',
        'gainsboro': '#dcdcdc',
        'ghostwhite': '#f8f8ff',
        'gold': '#ffd700',
        'goldenrod': '#daa520',
        'gray': '#808080',
        'grey': '#808080',
        'green': '#008000',
        'greenyellow': '#adff2f',
        'honeydew': '#f0fff0',
        'hotpink': '#ff69b4',
        'indianred': '#cd5c5c',
        'indigo': '#4b0082',
        'ivory': '#fffff0',
        'khaki': '#f0e68c',
        'lavender': '#e6e6fa',
        'lavenderblush': '#fff0f5',
        'lawngreen': '#7cfc00',
        'lemonchiffon': '#fffacd',
        'lightblue': '#add8e6',
        'lightcoral': '#f08080',
        'lightcyan': '#e0ffff',
        'lightgoldenrodyellow': '#fafad2',
        'lightgray': '#d3d3d3',
        'lightgrey': '#d3d3d3',
        'lightgreen': '#90ee90',
        'lightpink': '#ffb6c1',
        'lightsalmon': '#ffa07a',
        'lightseagreen': '#20b2aa',
        'lightskyblue': '#87cefa',
        'lightslategray': '#778899',
        'lightslategrey': '#778899',
        'lightsteelblue': '#b0c4de',
        'lightyellow': '#ffffe0',
        'lime': '#00ff00',
        'limegreen': '#32cd32',
        'linen': '#faf0e6',
        'magenta': '#ff00ff',
        'maroon': '#800000',
        'mediumaquamarine': '#66cdaa',
        'mediumblue': '#0000cd',
        'mediumorchid': '#ba55d3',
        'mediumpurple': '#9370d8',
        'mediumseagreen': '#3cb371',
        'mediumslateblue': '#7b68ee',
        'mediumspringgreen': '#00fa9a',
        'mediumturquoise': '#48d1cc',
        'mediumvioletred': '#c71585',
        'midnightblue': '#191970',
        'mintcream': '#f5fffa',
        'mistyrose': '#ffe4e1',
        'moccasin': '#ffe4b5',
        'navajowhite': '#ffdead',
        'navy': '#000080',
        'oldlace': '#fdf5e6',
        'olive': '#808000',
        'olivedrab': '#6b8e23',
        'orange': '#ffa500',
        'orangered': '#ff4500',
        'orchid': '#da70d6',
        'palegoldenrod': '#eee8aa',
        'palegreen': '#98fb98',
        'paleturquoise': '#afeeee',
        'palevioletred': '#d87093',
        'papayawhip': '#ffefd5',
        'peachpuff': '#ffdab9',
        'peru': '#cd853f',
        'pink': '#ffc0cb',
        'plum': '#dda0dd',
        'powderblue': '#b0e0e6',
        'purple': '#800080',
        'red': '#ff0000',
        'rosybrown': '#bc8f8f',
        'royalblue': '#4169e1',
        'saddlebrown': '#8b4513',
        'salmon': '#fa8072',
        'sandybrown': '#f4a460',
        'seagreen': '#2e8b57',
        'seashell': '#fff5ee',
        'sienna': '#a0522d',
        'silver': '#c0c0c0',
        'skyblue': '#87ceeb',
        'slateblue': '#6a5acd',
        'slategray': '#708090',
        'slategrey': '#708090',
        'snow': '#fffafa',
        'springgreen': '#00ff7f',
        'steelblue': '#4682b4',
        'tan': '#d2b48c',
        'teal': '#008080',
        'thistle': '#d8bfd8',
        'tomato': '#ff6347',
        'turquoise': '#40e0d0',
        'violet': '#ee82ee',
        'wheat': '#f5deb3',
        'white': '#ffffff',
        'whitesmoke': '#f5f5f5',
        'yellow': '#ffff00',
        'yellowgreen': '#9acd32',
        'rebeccapurple': '#663399',
        'transparent': '#00000000'
    });
    // color to name
    const NAMES_COLORS = Object.seal(Object.entries(COLORS_NAMES).reduce((acc, [key, value]) => {
        acc[value] = key;
        return acc;
    }, Object.create(null)));

    function hex2lchToken(token) {
        const values = hex2lchvalues(token);
        if (values == null) {
            return null;
        }
        return lchToken(values);
    }
    function rgb2lchToken(token) {
        const values = rgb2lchvalues(token);
        if (values == null) {
            return null;
        }
        return lchToken(values);
    }
    function hsl2lchToken(token) {
        const values = hsl2lchvalues(token);
        if (values == null) {
            return null;
        }
        return lchToken(values);
    }
    function hwb2lchToken(token) {
        const values = hwb2lchvalues(token);
        if (values == null) {
            return null;
        }
        return lchToken(values);
    }
    function cmyk2lchToken(token) {
        const values = cmyk2lchvalues(token);
        if (values == null) {
            return null;
        }
        return lchToken(values);
    }
    function lab2lchToken(token) {
        const values = lab2lchvalues(token);
        if (values == null) {
            return null;
        }
        return lchToken(values);
    }
    function oklab2lchToken(token) {
        const values = oklab2lchvalues(token);
        if (values == null) {
            return null;
        }
        return lchToken(values);
    }
    function oklch2lchToken(token) {
        const values = oklch2lchvalues(token);
        if (values == null) {
            return null;
        }
        return lchToken(values);
    }
    function color2lchToken(token) {
        const values = color2lchvalues(token);
        if (values == null) {
            return null;
        }
        return lchToken(values);
    }
    function lchToken(values) {
        values[2] = toPrecisionAngle(values[2]);
        const chi = [
            { typ: exports.EnumToken.NumberTokenType, val: toPrecisionValue(values[0]) },
            { typ: exports.EnumToken.NumberTokenType, val: toPrecisionValue(values[1]) },
            { typ: exports.EnumToken.NumberTokenType, val: values[2] },
        ];
        if (values.length == 4) {
            chi.push({ typ: exports.EnumToken.LiteralTokenType, val: '/' }, {
                typ: exports.EnumToken.PercentageTokenType,
                val: values[3] * 100
            });
        }
        return {
            typ: exports.EnumToken.ColorTokenType,
            val: 'lch',
            chi,
            kin: exports.ColorType.LCH
        };
    }
    function hex2lchvalues(token) {
        const values = hex2labvalues(token);
        // @ts-ignore
        return values == null ? null : labvalues2lchvalues(...values);
    }
    function rgb2lchvalues(token) {
        const values = rgb2labvalues(token);
        // @ts-ignore
        return values == null ? null : labvalues2lchvalues(...values);
    }
    function hsl2lchvalues(token) {
        const values = hsl2labvalues(token);
        // @ts-ignore
        return values == null ? null : labvalues2lchvalues(...values);
    }
    function hwb2lchvalues(token) {
        const values = hwb2labvalues(token);
        // @ts-ignore
        return values == null ? null : labvalues2lchvalues(...values);
    }
    function lab2lchvalues(token) {
        const values = getLABComponents(token);
        // @ts-ignore
        return values == null ? null : labvalues2lchvalues(...values);
    }
    function srgb2lch(r, g, blue, alpha) {
        // @ts-ignore
        return labvalues2lchvalues(...srgb2labvalues(r, g, blue, alpha));
    }
    function oklab2lchvalues(token) {
        const values = oklab2labvalues(token);
        // @ts-ignore
        return values == null ? null : labvalues2lchvalues(...values);
    }
    function cmyk2lchvalues(token) {
        const values = cmyk2srgbvalues(token);
        // @ts-ignore
        return values == null ? null : srgb2lch(...values);
    }
    function oklch2lchvalues(token) {
        const values = oklch2labvalues(token);
        if (values == null) {
            return null;
        }
        // @ts-ignore
        return labvalues2lchvalues(...values);
    }
    function color2lchvalues(token) {
        const values = color2srgbvalues(token);
        if (values == null) {
            return null;
        }
        // @ts-ignore
        return srgb2lch(...values);
    }
    function labvalues2lchvalues(l, a, b, alpha = null) {
        let c = Math.sqrt(a * a + b * b);
        let h = Math.atan2(b, a) * 180 / Math.PI;
        if (h < 0) {
            h += 360;
        }
        if (c < .0001) {
            c = h = 0;
        }
        return alpha == null ? [l, c, h] : [l, c, h, alpha];
    }
    function xyz2lchvalues(x, y, z, alpha) {
        // @ts-ignore(
        const lch = labvalues2lchvalues(...xyz2lab(x, y, z));
        return alpha == null || alpha == 1 ? lch : lch.concat(alpha);
    }
    function getLCHComponents(token) {
        const components = getComponents(token);
        if (components == null) {
            return null;
        }
        for (let i = 0; i < components.length; i++) {
            if (![exports.EnumToken.NumberTokenType, exports.EnumToken.PercentageTokenType, exports.EnumToken.AngleTokenType, exports.EnumToken.IdenTokenType].includes(components[i].typ)) {
                return null;
            }
        }
        // @ts-ignore
        let t = components[0];
        // @ts-ignore
        const l = getNumber(t) * (t.typ == exports.EnumToken.PercentageTokenType ? 100 : 1);
        // @ts-ignore
        t = components[1];
        // @ts-ignore
        const c = getNumber(t) * (t.typ == exports.EnumToken.PercentageTokenType ? 150 : 1);
        // @ts-ignore
        t = components[2];
        // @ts-ignore
        const h = getAngle(t) * 360;
        // @ts-ignore
        t = components[3];
        // @ts-ignore
        const alpha = t == null ? 1 : getNumber(t);
        return alpha == null ? [l, c, h] : [l, c, h, alpha];
    }

    /*
    */
    function xyzd502lch(x, y, z, alpha) {
        // @ts-ignore
        const [l, a, b] = xyz2lab(...XYZ_D50_to_D65(x, y, z));
        // L in range [0,100]. For use in CSS, add a percent
        return labvalues2lchvalues(l, a, b, alpha);
    }
    function XYZ_D65_to_D50(x, y, z, alpha = null) {
        // Bradford chromatic adaptation from D65 to D50
        // The matrix below is the result of three operations:
        // - convert from XYZ to retinal cone domain
        // - scale components from one reference white to another
        // - convert back to XYZ
        // see https://github.com/LeaVerou/color.js/pull/354/files
        let M = [
            [1.0479297925449969, 0.022946870601609652, -0.05019226628920524],
            [0.02962780877005599, 0.9904344267538799, -0.017073799063418826],
            [-0.009243040646204504, 0.015055191490298152, 0.7518742814281371]
        ];
        return multiplyMatrices(M, [x, y, z]).concat(alpha == null || alpha == 1 ? [] : [alpha]);
    }
    function xyzd502srgb(x, y, z, alpha = null) {
        // @ts-ignore
        return lsrgb2srgbvalues(
        /* r: */
        x * 3.1341359569958707 -
            y * 1.6173863321612538 -
            0.4906619460083532 * z, 
        /*  g: */
        x * -0.978795502912089 +
            y * 1.916254567259524 +
            0.03344273116131949 * z, 
        /*    b: */
        x * 0.07195537988411677 -
            y * 0.2289768264158322 +
            1.405386058324125 * z, alpha);
    }

    function XYZ_to_lin_sRGB(x, y, z, alpha = null) {
        // convert XYZ to linear-light sRGB
        const M = [
            [12831 / 3959, -329 / 214, -1974 / 3959],
            [-851781 / 878810, 1648619 / 878810, 36519 / 878810],
            [705 / 12673, -2585 / 12673, 705 / 667],
        ];
        const XYZ = [x, y, z]; // convert to XYZ
        return multiplyMatrices(M, XYZ).map((v) => v).concat(alpha == null || alpha == 1 ? [] : [alpha]);
    }
    function XYZ_D50_to_D65(x, y, z) {
        // Bradford chromatic adaptation from D50 to D65
        const M = [
            [0.9554734527042182, -0.023098536874261423, 0.0632593086610217],
            [-0.028369706963208136, 1.0099954580058226, 0.021041398966943008],
            [0.012314001688319899, -0.020507696433477912, 1.3303659366080753]
        ];
        const XYZ = [x, y, z];
        return multiplyMatrices(M, XYZ); //.map((v: number) => v);
    }
    // xyz d65
    function srgb2xyz(r, g, b, alpha) {
        [r, g, b] = srgb2lsrgbvalues(r, g, b);
        // xyx d65
        let rgb = [
            0.4123907992659595 * r +
                0.35758433938387796 * g +
                0.1804807884018343 * b,
            0.21263900587151036 * r +
                0.7151686787677559 * g +
                0.07219231536073371 * b,
            0.01933081871559185 * r +
                0.11919477979462599 * g +
                0.9505321522496606 * b
        ];
        if (alpha != null && alpha != 1) {
            rgb.push(alpha);
        }
        return rgb;
    }
    // xyz d50
    function srgb2xyz_d50(r, g, b, alpha) {
        // xyx d65
        // @ts-ignore
        let rgb = XYZ_D65_to_D50(...srgb2xyz(r, g, b));
        if (alpha != null && alpha != 1) {
            rgb.push(alpha);
        }
        return rgb;
    }

    function hex2oklchToken(token) {
        const values = hex2oklchvalues(token);
        return oklchToken(values);
    }
    function rgb2oklchToken(token) {
        const values = rgb2oklchvalues(token);
        if (values == null) {
            return null;
        }
        return oklchToken(values);
    }
    function hsl2oklchToken(token) {
        const values = hsl2oklchvalues(token);
        if (values == null) {
            return null;
        }
        return oklchToken(values);
    }
    function hwb2oklchToken(token) {
        const values = hwb2oklchvalues(token);
        if (values == null) {
            return null;
        }
        return oklchToken(values);
    }
    function cmyk2oklchToken(token) {
        const values = cmyk2oklchvalues(token);
        if (values == null) {
            return null;
        }
        return oklchToken(values);
    }
    function lab2oklchToken(token) {
        const values = lab2oklchvalues(token);
        if (values == null) {
            return null;
        }
        return oklchToken(values);
    }
    function oklab2oklchToken(token) {
        const values = oklab2oklchvalues(token);
        if (values == null) {
            return null;
        }
        return oklchToken(values);
    }
    function lch2oklchToken(token) {
        const values = lch2oklchvalues(token);
        if (values == null) {
            return null;
        }
        return oklchToken(values);
    }
    function color2oklchToken(token) {
        const values = color2srgbvalues(token);
        if (values == null) {
            return null;
        }
        // @ts-ignore
        return oklchToken(srgb2oklch(...values));
    }
    function oklchToken(values) {
        values[2] = toPrecisionAngle(values[2]);
        const chi = [
            { typ: exports.EnumToken.NumberTokenType, val: toPrecisionValue(values[0]) },
            { typ: exports.EnumToken.NumberTokenType, val: toPrecisionValue(values[1]) },
            { typ: exports.EnumToken.NumberTokenType, val: values[2] },
        ];
        if (values.length == 4) {
            chi.push({ typ: exports.EnumToken.LiteralTokenType, val: '/' }, {
                typ: exports.EnumToken.PercentageTokenType,
                val: values[3] * 100
            });
        }
        return {
            typ: exports.EnumToken.ColorTokenType,
            val: 'oklch',
            chi,
            kin: exports.ColorType.OKLCH
        };
    }
    function hex2oklchvalues(token) {
        // @ts-ignore
        return labvalues2lchvalues(...hex2oklabvalues(token));
    }
    function rgb2oklchvalues(token) {
        const values = rgb2oklabvalues(token);
        if (values == null) {
            return null;
        }
        // @ts-ignore
        return labvalues2lchvalues(...values);
    }
    function hsl2oklchvalues(token) {
        // @ts-ignore
        return labvalues2lchvalues(...hsl2oklabvalues(token));
    }
    function hwb2oklchvalues(token) {
        // @ts-ignore
        return labvalues2lchvalues(...hwb2oklabvalues(token));
    }
    function cmyk2oklchvalues(token) {
        const values = cmyk2srgbvalues(token);
        // @ts-ignore
        return values == null ? null : srgb2oklch(...values);
    }
    function lab2oklchvalues(token) {
        const values = lab2oklabvalues(token);
        if (values == null) {
            return null;
        }
        // @ts-ignore
        return labvalues2lchvalues(...values);
    }
    function lch2oklchvalues(token) {
        const values = lch2oklabvalues(token);
        if (values == null) {
            return null;
        }
        // @ts-ignore
        return labvalues2lchvalues(...values);
    }
    function oklab2oklchvalues(token) {
        const values = getOKLABComponents(token);
        if (values == null) {
            return null;
        }
        // @ts-ignore
        return labvalues2lchvalues(...values);
    }
    function srgb2oklch(r, g, blue, alpha) {
        // @ts-ignore
        return labvalues2lchvalues(...srgb2oklab(r, g, blue, alpha));
    }
    function getOKLCHComponents(token) {
        const components = getComponents(token);
        if (components == null) {
            return null;
        }
        for (let i = 0; i < components.length; i++) {
            if (![exports.EnumToken.NumberTokenType, exports.EnumToken.PercentageTokenType, exports.EnumToken.AngleTokenType, exports.EnumToken.IdenTokenType].includes(components[i].typ)) {
                return [];
            }
        }
        // @ts-ignore
        let t = components[0];
        // @ts-ignore
        const l = getNumber(t);
        // @ts-ignore
        t = components[1];
        // @ts-ignore
        const c = getNumber(t) * (t.typ == exports.EnumToken.PercentageTokenType ? .4 : 1);
        // @ts-ignore
        t = components[2];
        // @ts-ignore
        const h = getAngle(t) * 360;
        // @ts-ignore
        t = components[3];
        // @ts-ignore
        const alpha = t == null || (t.typ == exports.EnumToken.IdenTokenType && t.val == 'none') ? 1 : getNumber(t);
        return [l, c, h, alpha];
    }

    function hex2oklabToken(token) {
        const values = hex2oklabvalues(token);
        if (values == null) {
            return null;
        }
        return oklabToken(values);
    }
    function rgb2oklabToken(token) {
        const values = rgb2oklabvalues(token);
        if (values == null) {
            return null;
        }
        return oklabToken(values);
    }
    function hsl2oklabToken(token) {
        const values = hsl2oklabvalues(token);
        if (values == null) {
            return null;
        }
        return oklabToken(values);
    }
    function hwb2oklabToken(token) {
        const values = hwb2oklabvalues(token);
        if (values == null) {
            return null;
        }
        return oklabToken(values);
    }
    function cmyk2oklabToken(token) {
        const values = cmyk2oklabvalues(token);
        if (values == null) {
            return null;
        }
        return oklabToken(values);
    }
    function lab2oklabToken(token) {
        const values = lab2oklabvalues(token);
        if (values == null) {
            return null;
        }
        return oklabToken(values);
    }
    function lch2oklabToken(token) {
        const values = lch2oklabvalues(token);
        if (values == null) {
            return null;
        }
        return oklabToken(values);
    }
    function oklch2oklabToken(token) {
        const values = oklch2oklabvalues(token);
        if (values == null) {
            return null;
        }
        return oklabToken(values);
    }
    function color2oklabToken(token) {
        const values = color2oklabvalues(token);
        if (values == null) {
            return null;
        }
        return oklabToken(values);
    }
    function oklabToken(values) {
        const chi = [
            { typ: exports.EnumToken.NumberTokenType, val: toPrecisionValue(values[0]) },
            { typ: exports.EnumToken.NumberTokenType, val: toPrecisionValue(values[1]) },
            { typ: exports.EnumToken.NumberTokenType, val: toPrecisionValue(values[2]) },
        ];
        if (values.length == 4) {
            chi.push({ typ: exports.EnumToken.LiteralTokenType, val: '/' }, {
                typ: exports.EnumToken.PercentageTokenType,
                val: values[3] * 100
            });
        }
        return {
            typ: exports.EnumToken.ColorTokenType,
            val: 'oklab',
            chi,
            kin: exports.ColorType.OKLAB
        };
    }
    function hex2oklabvalues(token) {
        const values = hex2srgbvalues(token);
        if (values == null) {
            return null;
        }
        // @ts-ignore
        return srgb2oklab(...values);
    }
    function rgb2oklabvalues(token) {
        const values = rgb2srgb(token);
        if (values == null) {
            return null;
        }
        // @ts-ignore
        return srgb2oklab(...values);
    }
    function hsl2oklabvalues(token) {
        const values = hsl2srgb(token);
        if (values == null) {
            return null;
        }
        // @ts-ignore
        return srgb2oklab(...values);
    }
    function hwb2oklabvalues(token) {
        // @ts-ignore
        return srgb2oklab(...hwb2srgbvalues(token));
    }
    function cmyk2oklabvalues(token) {
        const values = cmyk2srgbvalues(token);
        // @ts-ignore
        return values == null ? null : srgb2oklab(...values);
    }
    function lab2oklabvalues(token) {
        const values = lab2srgbvalues(token);
        if (values == null) {
            return null;
        }
        // @ts-ignore
        return srgb2oklab(...values);
    }
    function lch2oklabvalues(token) {
        const values = lch2srgbvalues(token);
        // @ts-ignore
        return values == null ? null : srgb2oklab(...values);
    }
    function oklch2oklabvalues(token) {
        const values = getOKLCHComponents(token);
        // @ts-ignore
        return values == null ? null : lchvalues2labvalues(...values);
    }
    function color2oklabvalues(token) {
        const values = color2srgbvalues(token);
        // @ts-ignore
        return values == null ? null : srgb2oklab(...values);
    }
    function srgb2oklab(r, g, blue, alpha) {
        [r, g, blue] = srgb2lsrgbvalues(r, g, blue);
        let L = Math.cbrt(0.41222147079999993 * r + 0.5363325363 * g + 0.0514459929 * blue);
        let M = Math.cbrt(0.2119034981999999 * r + 0.6806995450999999 * g + 0.1073969566 * blue);
        let S = Math.cbrt(0.08830246189999998 * r + 0.2817188376 * g + 0.6299787005000002 * blue);
        const l = 0.2104542553 * L + 0.793617785 * M - 0.0040720468 * S;
        const a = r == g && g == blue ? 0 : 1.9779984951 * L - 2.428592205 * M + 0.4505937099 * S;
        const b = r == g && g == blue ? 0 : 0.0259040371 * L + 0.7827717662 * M - 0.808675766 * S;
        return alpha == null || alpha == 1 ? [l, a, b] : [l, a, b, alpha];
    }
    function getOKLABComponents(token) {
        const components = getComponents(token);
        if (components == null || components.length < 3) {
            return null;
        }
        // @ts-ignore
        let t = components[0];
        // @ts-ignore
        const l = getNumber(t);
        // @ts-ignore
        t = components[1];
        // @ts-ignore
        const a = getNumber(t) * (t.typ == exports.EnumToken.PercentageTokenType ? .4 : 1);
        // @ts-ignore
        t = components[2];
        // @ts-ignore
        const b = getNumber(t) * (t.typ == exports.EnumToken.PercentageTokenType ? .4 : 1);
        // @ts-ignore
        let alpha = null;
        if (components.length > 3) {
            alpha = getNumber(components[3]);
        }
        const rgb = [l, a, b];
        if (alpha != 1 && alpha != null) {
            rgb.push(alpha);
        }
        return rgb;
    }
    function OKLab_to_XYZ(l, a, b, alpha = null) {
        // Given OKLab, convert to XYZ relative to D65
        const LMStoXYZ = [
            [1.2268798758459243, -0.5578149944602171, 0.2813910456659647],
            [-0.0405757452148008, 1.1122868032803170, -0.0717110580655164],
            [-0.0763729366746601, -0.4214933324022432, 1.5869240198367816]
        ];
        const OKLabtoLMS = [
            [1.0000000000000000, 0.3963377773761749, 0.2158037573099136],
            [1.0000000000000000, -0.1055613458156586, -0.0638541728258133],
            [1.0000000000000000, -0.0894841775298119, -1.2914855480194092]
        ];
        const LMSnl = multiplyMatrices(OKLabtoLMS, [l, a, b]);
        const xyz = multiplyMatrices(LMStoXYZ, LMSnl.map((c) => c ** 3));
        if (alpha != null) {
            xyz.push(alpha);
        }
        return xyz;
    }
    // from https://www.w3.org/TR/css-color-4/#color-conversion-code
    function OKLab_to_sRGB(l, a, b) {
        let L = Math.pow(l * 0.99999999845051981432 +
            0.39633779217376785678 * a +
            0.21580375806075880339 * b, 3);
        let M = Math.pow(l * 1.0000000088817607767 -
            0.1055613423236563494 * a -
            0.063854174771705903402 * b, 3);
        let S = Math.pow(l * 1.0000000546724109177 -
            0.089484182094965759684 * a -
            1.2914855378640917399 * b, 3);
        return lsrgb2srgbvalues(
        /* r: */
        4.076741661347994 * L -
            3.307711590408193 * M +
            0.230969928729428 * S, 
        /*  g: */
        -1.2684380040921763 * L +
            2.6097574006633715 * M -
            0.3413193963102197 * S, 
        /*  b: */
        -0.004196086541837188 * L -
            0.7034186144594493 * M +
            1.7076147009309444 * S);
    }

    function hex2labToken(token) {
        const values = hex2labvalues(token);
        return values == null ? null : labToken(values);
    }
    function rgb2labToken(token) {
        const values = rgb2labvalues(token);
        if (values == null) {
            return null;
        }
        return labToken(values);
    }
    function hsl2labToken(token) {
        const values = hsl2labvalues(token);
        if (values == null) {
            return null;
        }
        return labToken(values);
    }
    function hwb2labToken(token) {
        const values = hwb2labvalues(token);
        if (values == null) {
            return null;
        }
        return labToken(values);
    }
    function cmyk2labToken(token) {
        const values = cmyk2labvalues(token);
        if (values == null) {
            return null;
        }
        return labToken(values);
    }
    function lch2labToken(token) {
        const values = lch2labvalues(token);
        if (values == null) {
            return null;
        }
        return labToken(values);
    }
    function oklab2labToken(token) {
        const values = oklab2labvalues(token);
        if (values == null) {
            return null;
        }
        return labToken(values);
    }
    function oklch2labToken(token) {
        const values = oklch2labvalues(token);
        if (values == null) {
            return null;
        }
        return labToken(values);
    }
    function color2labToken(token) {
        const values = color2labvalues(token);
        if (values == null) {
            return null;
        }
        return labToken(values);
    }
    function labToken(values) {
        const chi = [
            { typ: exports.EnumToken.NumberTokenType, val: toPrecisionValue(values[0]) },
            { typ: exports.EnumToken.NumberTokenType, val: toPrecisionValue(values[1]) },
            { typ: exports.EnumToken.NumberTokenType, val: toPrecisionValue(values[2]) },
        ];
        if (values.length == 4) {
            chi.push({ typ: exports.EnumToken.LiteralTokenType, val: '/' }, {
                typ: exports.EnumToken.PercentageTokenType,
                val: values[3] * 100
            });
        }
        return {
            typ: exports.EnumToken.ColorTokenType,
            val: 'lab',
            chi,
            kin: exports.ColorType.LAB
        };
    }
    // L: 0% = 0.0, 100% = 100.0
    // for a and b: -100% = -125, 100% = 125
    function hex2labvalues(token) {
        const values = hex2srgbvalues(token);
        // @ts-ignore
        return values == null ? null : srgb2labvalues(...values);
    }
    function rgb2labvalues(token) {
        const values = rgb2srgb(token);
        // @ts-ignore
        return values == null ? null : srgb2labvalues(...values);
    }
    function cmyk2labvalues(token) {
        const values = cmyk2srgbvalues(token);
        // @ts-ignore
        return values == null ? null : srgb2labvalues(...values);
    }
    function hsl2labvalues(token) {
        const values = hsl2srgb(token);
        if (values == null) {
            return null;
        }
        // @ts-ignore
        return srgb2labvalues(...values);
    }
    function hwb2labvalues(token) {
        const values = hwb2srgbvalues(token);
        if (values == null) {
            return null;
        }
        // @ts-ignore
        return srgb2labvalues(...values);
    }
    function lch2labvalues(token) {
        const values = getLCHComponents(token);
        // @ts-ignore
        return values == null ? null : lchvalues2labvalues(...values);
    }
    function oklab2labvalues(token) {
        const values = getOKLABComponents(token);
        if (values == null) {
            return null;
        }
        // @ts-ignore
        return xyz2lab(...XYZ_D65_to_D50(...OKLab_to_XYZ(...values)));
    }
    function oklch2labvalues(token) {
        const values = oklch2srgbvalues(token);
        if (values == null) {
            return null;
        }
        // @ts-ignore
        return srgb2labvalues(...values);
    }
    function color2labvalues(token) {
        const val = color2srgbvalues(token);
        if (val == null) {
            return null;
        }
        // @ts-ignore
        return srgb2labvalues(...val);
    }
    function srgb2labvalues(r, g, b, a) {
        // @ts-ignore */
        const result = xyz2lab(...srgb2xyz_d50(r, g, b));
        // Fixes achromatic RGB colors having a _slight_ chroma due to floating-point errors
        // and approximated computations in sRGB <-> CIELab.
        // See: https://github.com/d3/d3-color/pull/46
        if (r === b && b === g) {
            result[1] = result[2] = 0;
        }
        if (a != null) {
            result.push(a);
        }
        return result;
    }
    function xyz2lab(x, y, z, a = null) {
        // Assuming XYZ is relative to D50, convert to CIE Lab
        // from CIE standard, which now defines these as a rational fraction
        // var e = 216/24389;  // 6^3/29^3
        // var k = 24389/27;   // 29^3/3^3
        // compute xyz, which is XYZ scaled relative to reference white
        const xyz = [x, y, z].map((value, i) => value / D50[i]);
        // now compute f
        const f = xyz.map((value) => value > e ? Math.cbrt(value) : (k * value + 16) / 116);
        const result = [
            (116 * f[1]) - 16, // L
            500 * (f[0] - f[1]), // a
            200 * (f[1] - f[2]) // b
        ];
        // L in range [0,100]. For use in CSS, add a percent
        if (a != null && a != 1) {
            result.push(a);
        }
        return result;
    }
    function lchvalues2labvalues(l, c, h, a = null) {
        // l, c * Math.cos(360 * h * Math.PI / 180), c * Math.sin(360 * h * Math.PI / 180
        const result = [l, c * Math.cos(h * Math.PI / 180), c * Math.sin(h * Math.PI / 180)];
        if (a != null) {
            result.push(a);
        }
        return result;
    }
    function getLABComponents(token) {
        const components = getComponents(token);
        if (components == null) {
            return null;
        }
        for (let i = 0; i < components.length; i++) {
            if (![exports.EnumToken.NumberTokenType, exports.EnumToken.PercentageTokenType, exports.EnumToken.AngleTokenType, exports.EnumToken.IdenTokenType].includes(components[i].typ)) {
                return null;
            }
        }
        // @ts-ignore
        let t = components[0];
        // @ts-ignore
        const l = getNumber(t) * (t.typ == exports.EnumToken.PercentageTokenType ? 100 : 1);
        // @ts-ignore
        t = components[1];
        // @ts-ignore
        const a = getNumber(t) * (t.typ == exports.EnumToken.PercentageTokenType ? 125 : 1);
        // @ts-ignore
        t = components[2];
        // @ts-ignore
        const b = getNumber(t) * (t.typ == exports.EnumToken.PercentageTokenType ? 125 : 1);
        // @ts-ignore
        t = components[3];
        // @ts-ignore
        const alpha = t == null ? 1 : getNumber(t);
        const result = [l, a, b];
        if (alpha != null && alpha != 1) {
            result.push(alpha);
        }
        return result;
    }
    // from https://www.w3.org/TR/css-color-4/#color-conversion-code
    // D50 LAB
    function Lab_to_sRGB(l, a, b) {
        const xyz_d50 = Lab_to_XYZ(l, a, b);
        // @ts-ignore
        const xyz_d65 = XYZ_D50_to_D65(...xyz_d50);
        // @ts-ignore
        return xyz2srgb(...xyz_d65);
    }
    // from https://www.w3.org/TR/css-color-4/#color-conversion-code
    function Lab_to_XYZ(l, a, b) {
        // Convert Lab to D50-adapted XYZ
        // http://www.brucelindbloom.com/index.html?Eqn_RGB_XYZ_Matrix.html
        const k = 24389 / 27; // 29^3/3^3
        const e = 216 / 24389; // 6^3/29^3
        const f = [];
        // compute f, starting with the luminance-related term
        f[1] = (l + 16) / 116;
        f[0] = a / 500 + f[1];
        f[2] = f[1] - b / 200;
        // compute xyz
        const xyz = [
            Math.pow(f[0], 3) > e ? Math.pow(f[0], 3) : (116 * f[0] - 16) / k,
            l > k * e ? Math.pow((l + 16) / 116, 3) : l / k,
            Math.pow(f[2], 3) > e ? Math.pow(f[2], 3) : (116 * f[2] - 16) / k
        ];
        // Compute XYZ by scaling xyz by reference white
        return xyz.map((value, i) => value * D50[i]);
    }

    // from https://www.w3.org/TR/css-color-4/#color-conversion-code
    // srgb-linear -> srgb
    // 0 <= r, g, b <= 1
    function srgbvalues(token) {
        switch (token.kin) {
            case exports.ColorType.LIT:
            case exports.ColorType.HEX:
                return hex2srgbvalues(token);
            case exports.ColorType.RGB:
            case exports.ColorType.RGBA:
                return rgb2srgb(token);
            case exports.ColorType.HSL:
            case exports.ColorType.HSLA:
                return hsl2srgb(token);
            case exports.ColorType.HWB:
                return hwb2srgbvalues(token);
            case exports.ColorType.LAB:
                return lab2srgbvalues(token);
            case exports.ColorType.LCH:
                return lch2srgbvalues(token);
            case exports.ColorType.OKLAB:
                return oklab2srgbvalues(token);
            case exports.ColorType.OKLCH:
                return oklch2srgbvalues(token);
            case exports.ColorType.COLOR:
                return color2srgbvalues(token);
        }
        return null;
    }
    function rgb2srgb(token) {
        return getComponents(token)?.map?.((t, index) => index == 3 ? ((t.typ == exports.EnumToken.IdenTokenType && t.val == 'none') ? 1 : getNumber(t)) : (t.typ == exports.EnumToken.PercentageTokenType ? 255 : 1) * getNumber(t) / 255) ?? null;
    }
    function rgb2srgbvalues(token) {
        return getComponents(token)?.map?.((t, index) => index == 3 ? getNumber(t) : getNumber(t) / 255) ?? null;
    }
    function hex2srgbvalues(token) {
        const value = expandHexValue(token.kin == exports.ColorType.LIT ? COLORS_NAMES[token.val.toLowerCase()] : token.val);
        const rgb = [];
        for (let i = 1; i < value.length; i += 2) {
            rgb.push(parseInt(value.slice(i, i + 2), 16) / 255);
        }
        if (rgb.length == 4) {
            rgb[3] = +rgb[3].toFixed(2);
        }
        return rgb;
    }
    // xyz d65 input
    function xyz2srgb(x, y, z, alpha = null) {
        // @ts-ignore
        return lsrgb2srgbvalues(...XYZ_to_lin_sRGB(x, y, z, alpha));
    }
    function hwb2srgbvalues(token) {
        const { h: hue, s: white, l: black, a: alpha } = hslvalues(token) ?? {};
        if (hue == null || white == null || black == null) {
            return [];
        }
        const rgb = hslvalues2srgbvalues(hue, 1, .5);
        for (let i = 0; i < 3; i++) {
            rgb[i] *= (1 - white - black);
            rgb[i] = rgb[i] + white;
        }
        if (alpha != null && alpha != 1) {
            rgb.push(alpha);
        }
        return rgb;
    }
    function hsl2srgb(token) {
        let { h, s, l, a } = hslvalues(token) ?? {};
        if (h == null || s == null || l == null) {
            return null;
        }
        return hslvalues2srgbvalues(h, s, l, a);
    }
    function cmyk2srgbvalues(token) {
        const components = getComponents(token);
        if (components == null) {
            return null;
        }
        // @ts-ignore
        let t = components[0];
        // @ts-ignore
        const c = getNumber(t);
        // @ts-ignore
        t = components[1];
        // @ts-ignore
        const m = getNumber(t);
        // @ts-ignore
        t = components[2];
        // @ts-ignore
        const y = getNumber(t);
        // @ts-ignore
        t = components[3];
        // @ts-ignore
        const k = getNumber(t);
        const rgb = [
            1 - Math.min(1, c * (1 - k) + k),
            1 - Math.min(1, m * (1 - k) + k),
            1 - Math.min(1, y * (1 - k) + k)
        ];
        if (components.length == 5) {
            rgb.push(getNumber(components[4]));
        }
        // @ts-ignore
        // if (token.chi.length >= 9) {
        //
        //     // @ts-ignore
        //     t = <NumberToken | PercentageToken>token.chi[8];
        //
        //     // @ts-ignore
        //     rgb.push(getNumber(t));
        // }
        return rgb;
    }
    function oklab2srgbvalues(token) {
        const [l, a, b, alpha] = getOKLABComponents(token) ?? [];
        if (l == null || a == null || b == null) {
            return null;
        }
        const rgb = OKLab_to_sRGB(l, a, b);
        if (alpha != null && alpha != 1) {
            rgb.push(alpha);
        }
        return rgb;
    }
    function oklch2srgbvalues(token) {
        const [l, c, h, alpha] = getOKLCHComponents(token) ?? [];
        if (l == null || c == null || h == null) {
            return null;
        }
        // @ts-ignore
        const rgb = OKLab_to_sRGB(...lchvalues2labvalues(l, c, h));
        if (alpha != 1) {
            rgb.push(alpha);
        }
        return rgb;
    }
    function hslvalues(token) {
        const components = getComponents(token);
        if (components == null) {
            return null;
        }
        let t;
        // @ts-ignore
        let h = getAngle(components[0]);
        // @ts-ignore
        t = components[1];
        // @ts-ignore
        let s = getNumber(t);
        // @ts-ignore
        t = components[2];
        // @ts-ignore
        let l = getNumber(t);
        let a = null;
        if (components.length == 4) {
            // @ts-ignore
            t = components[3];
            // @ts-ignore
            a = getNumber(t);
        }
        return a == null ? { h, s, l } : { h, s, l, a };
    }
    function hslvalues2srgbvalues(h, s, l, a = null) {
        let v = l <= .5 ? l * (1.0 + s) : l + s - l * s;
        let r = l;
        let g = l;
        let b = l;
        if (v > 0) {
            let m = l + l - v;
            let sv = (v - m) / v;
            h *= 6.0;
            let sextant = Math.floor(h);
            let fract = h - sextant;
            let vsf = v * sv * fract;
            let mid1 = m + vsf;
            let mid2 = v - vsf;
            switch (sextant) {
                case 0:
                    r = v;
                    g = mid1;
                    b = m;
                    break;
                case 1:
                    r = mid2;
                    g = v;
                    b = m;
                    break;
                case 2:
                    r = m;
                    g = v;
                    b = mid1;
                    break;
                case 3:
                    r = m;
                    g = mid2;
                    b = v;
                    break;
                case 4:
                    r = mid1;
                    g = m;
                    b = v;
                    break;
                case 5:
                    r = v;
                    g = m;
                    b = mid2;
                    break;
            }
        }
        const values = [r, g, b];
        if (a != null && a != 1) {
            values.push(a);
        }
        return values;
    }
    function lab2srgbvalues(token) {
        const [l, a, b, alpha] = getLABComponents(token) ?? [];
        if (l == null || a == null || b == null) {
            return null;
        }
        const rgb = Lab_to_sRGB(l, a, b);
        if (alpha != null && alpha < 1) {
            rgb.push(alpha);
        }
        return rgb;
    }
    function lch2srgbvalues(token) {
        // @ts-ignore
        const [l, a, b, alpha] = lchvalues2labvalues(...getLCHComponents(token));
        if (l == null || a == null || b == null) {
            return null;
        }
        // https://www.w3.org/TR/css-color-4/#lab-to-lch
        const rgb = Lab_to_sRGB(l, a, b);
        if (alpha != 1) {
            rgb.push(alpha);
        }
        return rgb;
    }
    // sRGB -> lRGB
    function srgb2lsrgbvalues(r, g, b, a = null) {
        // convert an array of linear-light sRGB values in the range 0.0-1.0
        // to gamma corrected form
        // https://en.wikipedia.org/wiki/SRGB
        // Extended transfer function:
        // For negative values, linear portion extends on reflection
        // of axis, then uses reflected pow below that
        const rgb = [r, g, b].map((val) => {
            const abs = Math.abs(val);
            if (abs <= 0.04045) {
                return val / 12.92;
            }
            return (Math.sign(val) || 1) * Math.pow((abs + 0.055) / 1.055, 2.4);
        });
        if (a != 1 && a != null) {
            rgb.push(a);
        }
        return rgb;
    }
    function lsrgb2srgbvalues(r, g, b, alpha = null) {
        // convert an array of linear-light sRGB values in the range 0.0-1.0
        // to gamma corrected form
        // https://en.wikipedia.org/wiki/SRGB
        // Extended transfer function:
        // For negative values, linear portion extends on reflection
        // of axis, then uses reflected pow below that
        const rgb = [r, g, b].map((val) => {
            let abs = Math.abs(val);
            if (Math.abs(val) > 0.0031308) {
                return (Math.sign(val) || 1) * (1.055 * Math.pow(abs, 1 / 2.4) - 0.055);
            }
            return 12.92 * val;
        });
        if (alpha != 1 && alpha != null) {
            rgb.push(alpha);
        }
        return rgb;
    }

    function toHexString(acc, value) {
        return acc + value.toString(16).padStart(2, '0');
    }
    function reduceHexValue(value) {
        if (value[0] != '#') {
            value = COLORS_NAMES[value.toLowerCase()] ?? value;
        }
        const named_color = NAMES_COLORS[expandHexValue(value)];
        if (value.length == 7) {
            if (value[1] == value[2] &&
                value[3] == value[4] &&
                value[5] == value[6]) {
                value = `#${value[1]}${value[3]}${value[5]}`;
            }
        }
        else if (value.length == 9) {
            if (value[1] == value[2] &&
                value[3] == value[4] &&
                value[5] == value[6] &&
                value[7] == value[8]) {
                value = `#${value[1]}${value[3]}${value[5]}${value[7] == 'f' ? '' : value[7]}`;
            }
            if (value.endsWith('ff')) {
                value = value.slice(0, -2);
            }
        }
        return named_color != null && named_color.length <= value.length ? named_color : value;
    }
    function expandHexValue(value) {
        if (value.length == 4) {
            return `#${value[1]}${value[1]}${value[2]}${value[2]}${value[3]}${value[3]}`;
        }
        if (value.length == 5) {
            return `#${value[1]}${value[1]}${value[2]}${value[2]}${value[3]}${value[3]}${value[4]}${value[4]}`;
        }
        return value;
    }
    function rgb2HexToken(token) {
        let value = rgb2hexvalues(token);
        if (value == null) {
            return null;
        }
        return hexToken(value);
    }
    function hsl2HexToken(token) {
        let value = hsl2hexvalues(token);
        if (value == null) {
            return null;
        }
        return hexToken(value);
    }
    function cmyk2HexToken(token) {
        let value = cmyk2hexvalues(token);
        if (value == null) {
            return null;
        }
        return hexToken(value);
    }
    function hwb2HexToken(token) {
        let value = hwb2hexvalues(token);
        if (value == null) {
            return null;
        }
        return hexToken(value);
    }
    function color2HexToken(token) {
        let value = color2srgbvalues(token);
        if (value == null) {
            return null;
        }
        return hexToken(value.reduce((acc, curr) => acc + srgb2rgb(curr).toString(16).padStart(2, '0'), '#'));
    }
    function oklab2HexToken(token) {
        let value = oklab2srgbvalues(token);
        if (value == null) {
            return null;
        }
        return hexToken(value.reduce((acc, curr) => acc + srgb2rgb(curr).toString(16).padStart(2, '0'), '#'));
    }
    function oklch2HexToken(token) {
        let value = oklch2srgbvalues(token);
        if (value == null) {
            return null;
        }
        return hexToken(value.reduce((acc, curr) => acc + srgb2rgb(curr).toString(16).padStart(2, '0'), '#'));
    }
    function lab2HexToken(token) {
        let value = lab2srgbvalues(token);
        if (value == null) {
            return null;
        }
        return hexToken(value.reduce((acc, curr) => acc + srgb2rgb(curr).toString(16).padStart(2, '0'), '#'));
    }
    function lch2HexToken(token) {
        let value = lch2srgbvalues(token);
        if (value == null) {
            return null;
        }
        return hexToken(value.reduce((acc, curr) => acc + srgb2rgb(curr).toString(16).padStart(2, '0'), '#'));
    }
    function hexToken(value) {
        value = reduceHexValue(value);
        return {
            typ: exports.EnumToken.ColorTokenType,
            val: value,
            kin: value[0] == '#' ? exports.ColorType.HEX : exports.ColorType.LIT
        };
    }
    function rgb2hexvalues(token) {
        let value = '#';
        let t;
        // @ts-ignore
        const components = getComponents(token);
        if (components == null || components.length < 3) {
            return null;
        }
        // @ts-ignore
        for (let i = 0; i < 3; i++) {
            // @ts-ignore
            t = components[i];
            // @ts-ignore
            value += (t.typ == exports.EnumToken.Iden && t.val == 'none' ? '0' : Math.round(getNumber(t) * (t.typ == exports.EnumToken.PercentageTokenType ? 255 : 1))).toString(16).padStart(2, '0');
        }
        // @ts-ignore
        if (components.length == 4) {
            // @ts-ignore
            t = components[3];
            // @ts-ignore
            const v = getNumber(t);
            // @ts-ignore
            if (v < 1) {
                // @ts-ignore
                value += Math.round(255 * getNumber(t)).toString(16).padStart(2, '0');
            }
        }
        return value;
    }
    function hsl2hexvalues(token) {
        const t = hsl2rgbvalues(token);
        if (t == null) {
            return null;
        }
        if (t.length == 4) {
            t[3] = srgb2rgb(t[3]);
        }
        return `${t.reduce(toHexString, '#')}`;
    }
    function hwb2hexvalues(token) {
        const t = hwb2rgbvalues(token);
        if (t == null) {
            return null;
        }
        if (t.length == 4) {
            t[3] = srgb2rgb(t[3]);
        }
        return `${t.reduce(toHexString, '#')}`;
    }
    function cmyk2hexvalues(token) {
        const t = cmyk2rgbvalues(token);
        if (t == null) {
            return null;
        }
        if (t.length == 4) {
            t[3] = srgb2rgb(t[3]);
        }
        return `#${t.reduce(toHexString, '')}`;
    }

    function getComponents(token) {
        if (token.kin == exports.ColorType.HEX || token.kin == exports.ColorType.LIT) {
            const value = expandHexValue(token.kin == exports.ColorType.LIT ? COLORS_NAMES[token.val.toLowerCase()] : token.val);
            // @ts-ignore
            return value.slice(1).match(/([a-fA-F0-9]{2})/g).map((t, index) => {
                return { typ: exports.EnumToken.Number, val: index < 3 ? parseInt(t, 16) : parseInt(t, 16) / 255 };
            });
        }
        const result = [];
        for (const child of (token.chi)) {
            if ([
                exports.EnumToken.LiteralTokenType, exports.EnumToken.CommentTokenType, exports.EnumToken.CommaTokenType, exports.EnumToken.WhitespaceTokenType
            ].includes(child.typ)) {
                continue;
            }
            if (child.typ == exports.EnumToken.FunctionTokenType) {
                if ('var' == child.val.toLowerCase()) {
                    return null;
                }
                else {
                    for (const { value } of walkValues(child.chi)) {
                        if (value.typ == exports.EnumToken.FunctionTokenType && 'var' === value.val.toLowerCase()) {
                            return null;
                        }
                    }
                }
            }
            if (child.typ == exports.EnumToken.ColorTokenType && 'currentcolor' === child.val.toLowerCase()) {
                return null;
            }
            result.push(child);
        }
        return result;
    }

    /**
     * Calculate the distance between two okLab colors.
     * @param okLab1
     * @param okLab2
     *
     * @private
     */
    function okLabDistance(okLab1, okLab2) {
        return Math.sqrt(Math.pow(okLab1[0] - okLab2[0], 2) + Math.pow(okLab1[1] - okLab2[1], 2) + Math.pow(okLab1[2] - okLab2[2], 2));
    }
    /**
     * Check if two colors are close in okLab space.
     * @param color1
     * @param color2
     * @param threshold
     *
     * @private
     */
    function isOkLabClose(color1, color2, threshold = .01) {
        color1 = convertColor(color1, exports.ColorType.OKLAB);
        color2 = convertColor(color2, exports.ColorType.OKLAB);
        if (color1 == null || color2 == null) {
            return false;
        }
        const okLab1 = getOKLABComponents(color1);
        const okLab2 = getOKLABComponents(color2);
        if (okLab1 == null || okLab2 == null) {
            return false;
        }
        return okLabDistance(okLab1, okLab2) < threshold;
    }

    function srgb2rgb(value) {
        return minmax(Math.round(value * 255), 0, 255);
    }
    function hex2RgbToken(token) {
        return rgb2RgbToken(hex2rgbvalues(token));
    }
    function hsl2RgbToken(token) {
        const values = hsl2rgbvalues(token);
        if (values == null) {
            return null;
        }
        return rgb2RgbToken(values);
    }
    function hwb2RgbToken(token) {
        const values = hwb2rgbvalues(token);
        if (values == null) {
            return null;
        }
        return rgb2RgbToken(values);
    }
    function cmyk2RgbToken(token) {
        const values = cmyk2rgbvalues(token);
        if (values == null) {
            return null;
        }
        return rgb2RgbToken(values);
    }
    function oklab2RgbToken(token) {
        const values = oklab2rgbvalues(token);
        if (values == null) {
            return null;
        }
        return rgb2RgbToken(values);
    }
    function oklch2RgbToken(token) {
        const values = oklch2rgbvalues(token);
        if (values == null) {
            return null;
        }
        return rgb2RgbToken(values);
    }
    function lab2RgbToken(token) {
        const values = lab2rgbvalues(token);
        if (values == null) {
            return null;
        }
        return rgb2RgbToken(values);
    }
    function lch2RgbToken(token) {
        const values = lch2rgbvalues(token);
        if (values == null) {
            return null;
        }
        return rgb2RgbToken(values);
    }
    function color2RgbToken(token) {
        const values = color2srgbvalues(token);
        if (values == null) {
            return null;
        }
        return rgb2RgbToken(values.map((t, index) => index == 3 ? t : srgb2rgb(t)));
    }
    function rgb2RgbToken(values) {
        const chi = [
            { typ: exports.EnumToken.NumberTokenType, val: values[0] },
            { typ: exports.EnumToken.NumberTokenType, val: values[1] },
            { typ: exports.EnumToken.NumberTokenType, val: values[2] },
        ];
        if (values.length == 4) {
            chi.push({ typ: exports.EnumToken.PercentageTokenType, val: values[3] * 100 });
        }
        return {
            typ: exports.EnumToken.ColorTokenType,
            val: 'rgb',
            chi,
            kin: exports.ColorType.RGB
        };
    }
    function hex2rgbvalues(token) {
        const value = expandHexValue(token.kin == exports.ColorType.LIT ? COLORS_NAMES[token.val.toLowerCase()] : token.val);
        const rgb = [];
        for (let i = 1; i < value.length; i += 2) {
            rgb.push(parseInt(value.slice(i, i + 2), 16));
        }
        if (rgb.length == 4) {
            if (rgb[3] == 255) {
                rgb.pop();
            }
            else {
                rgb[3] = +(rgb[3] / 255).toFixed(2);
            }
        }
        return rgb;
    }
    function hwb2rgbvalues(token) {
        return hwb2srgbvalues(token)?.map?.((t, index) => index == 3 ? t : srgb2rgb(t)) ?? null;
    }
    function hsl2rgbvalues(token) {
        let { h, s, l, a } = hslvalues(token) ?? {};
        if (h == null || s == null || l == null) {
            return null;
        }
        return hslvalues2srgbvalues(h, s, l).map((t) => minmax(Math.round(t * 255), 0, 255)).concat(a == 1 || a == null ? [] : [a]);
    }
    function hsl2srgbvalues(token) {
        let { h, s, l, a } = hslvalues(token) ?? {};
        if (h == null || s == null || l == null) {
            return null;
        }
        return hslvalues2srgbvalues(h, s, l).concat(a == 1 || a == null ? [] : [a]);
    }
    function cmyk2rgbvalues(token) {
        return cmyk2srgbvalues(token)?.map?.((t, index) => index == 3 ? t : srgb2rgb(t)) ?? null;
    }
    function oklab2rgbvalues(token) {
        return oklab2srgbvalues(token)?.map?.((t, index) => index == 3 ? t : srgb2rgb(t)) ?? null;
    }
    function oklch2rgbvalues(token) {
        return oklch2srgbvalues(token)?.map?.((t, index) => index == 3 ? t : srgb2rgb(t)) ?? null;
    }
    function lab2rgbvalues(token) {
        return lab2srgbvalues(token)?.map?.((t, index) => index == 3 ? t : srgb2rgb(t)) ?? null;
    }
    function lch2rgbvalues(token) {
        return lch2srgbvalues(token)?.map?.((t, index) => index == 3 ? t : srgb2rgb(t)) ?? null;
    }

    function hwb2hsv(h, w, b, a) {
        // @ts-ignore
        return [h, 1 - w / (1 - b), 1 - b, a];
    }
    // https://gist.github.com/defims/0ca2ef8832833186ed396a2f8a204117#file-annotated-js
    function hsl2hsv(h, s, l, a = null) {
        s *= l < .5 ? l : 1 - l;
        const result = [
            //Range should be between 0 - 1
            h, //Hue stays the same
            2 * s / (l + s), //Saturation
            l + s //Value
        ];
        if (a != null) {
            result.push(a);
        }
        return result;
    }

    function hex2HslToken(token) {
        // @ts-ignore
        return hslToken(srgb2hslvalues(...hex2srgbvalues(token)));
    }
    function rgb2HslToken(token) {
        const values = rgb2hslvalues(token);
        if (values == null) {
            return null;
        }
        return hslToken(values);
    }
    function hwb2HslToken(token) {
        const values = hwb2hslvalues(token);
        if (values == null) {
            return null;
        }
        return hslToken(values);
    }
    function cmyk2HslToken(token) {
        const values = cmyk2hslvalues(token);
        if (values == null) {
            return null;
        }
        return hslToken(values);
    }
    function oklab2HslToken(token) {
        const values = oklab2hslvalues(token);
        if (values == null) {
            return null;
        }
        return hslToken(values);
    }
    function oklch2HslToken(token) {
        const values = oklch2hslvalues(token);
        if (values == null) {
            return null;
        }
        return hslToken(values);
    }
    function lab2HslToken(token) {
        const values = lab2hslvalues(token);
        if (values == null) {
            return null;
        }
        return hslToken(values);
    }
    function lch2HslToken(token) {
        const values = lch2hslvalues(token);
        if (values == null) {
            return null;
        }
        return hslToken(values);
    }
    function color2HslToken(token) {
        const values = color2srgbvalues(token);
        if (values == null) {
            return null;
        }
        // @ts-ignore
        return hslToken(srgb2hslvalues(...values));
    }
    function hslToken(values) {
        values[0] = toPrecisionAngle(values[0] * 360);
        const chi = [
            { typ: exports.EnumToken.NumberTokenType, val: toPrecisionValue(values[0]) },
            { typ: exports.EnumToken.PercentageTokenType, val: toPrecisionValue(values[1]) * 100 },
            { typ: exports.EnumToken.PercentageTokenType, val: toPrecisionValue(values[2]) * 100 },
        ];
        if (values.length == 4 && values[3] != 1) {
            chi.push({ typ: exports.EnumToken.LiteralTokenType, val: '/' }, {
                typ: exports.EnumToken.PercentageTokenType,
                val: values[3] * 100
            });
        }
        return {
            typ: exports.EnumToken.ColorTokenType,
            val: 'hsl',
            chi,
            kin: exports.ColorType.HSL
        };
    }
    function rgb2hslvalues(token) {
        const chi = getComponents(token);
        if (chi == null || chi.length < 3) {
            return null;
        }
        // @ts-ignore
        let t = chi[0];
        // @ts-ignore
        let r = getNumber(t);
        // @ts-ignore
        t = chi[1];
        // @ts-ignore
        let g = getNumber(t);
        // @ts-ignore
        t = chi[2];
        // @ts-ignore
        let b = getNumber(t);
        // @ts-ignore
        let a = null;
        if (chi.length == 4) {
            a = getNumber(chi[3]);
        }
        const values = [r, g, b];
        if (a != null && a != 1) {
            values.push(a);
        }
        // @ts-ignore
        return rgbvalues2hslvalues(...values);
    }
    // https://gist.github.com/defims/0ca2ef8832833186ed396a2f8a204117#file-annotated-js
    function hsv2hsl(h, s, v, a) {
        const result = [
            //[hue, saturation, lightness]
            //Range should be between 0 - 1
            h, //Hue stays the same
            //Saturation is very different between the two color spaces
            //If (2-sat)*val < 1 set it to sat*val/((2-sat)*val)
            //Otherwise sat*val/(2-(2-sat)*val)
            //Conditional is not operating with hue, it is reassigned!
            s * v / ((h = (2 - s) * v) < 1 ? h : 2 - h),
            h / 2, //Lightness is (2-sat)*val/2
        ];
        if (a != null) {
            result.push(a);
        }
        return result;
    }
    function cmyk2hslvalues(token) {
        const values = cmyk2rgbvalues(token);
        // @ts-ignore
        return values == null ? null : rgbvalues2hslvalues(...values);
    }
    function hwb2hslvalues(token) {
        // @ts-ignore
        return hsv2hsl(...hwb2hsv(...Object.values(hslvalues(token))));
    }
    function lab2hslvalues(token) {
        const values = lab2rgbvalues(token);
        if (values == null) {
            return null;
        }
        // @ts-ignore
        return rgbvalues2hslvalues(...values);
    }
    function lch2hslvalues(token) {
        const values = lch2rgbvalues(token);
        if (values == null) {
            return null;
        }
        // @ts-ignore
        return rgbvalues2hslvalues(...values);
    }
    function oklab2hslvalues(token) {
        const t = oklab2srgbvalues(token);
        // @ts-ignore
        return t == null ? null : srgb2hslvalues(...t);
    }
    function oklch2hslvalues(token) {
        const t = oklch2srgbvalues(token);
        // @ts-ignore
        return t == null ? null : srgb2hslvalues(...t);
    }
    function rgbvalues2hslvalues(r, g, b, a = null) {
        return srgb2hslvalues(r / 255, g / 255, b / 255, a);
    }
    function srgb2hslvalues(r, g, b, a = null) {
        let max = Math.max(r, g, b);
        let min = Math.min(r, g, b);
        let h = 0;
        let s = 0;
        let l = (max + min) / 2;
        if (max != min) {
            let d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r:
                    h = (g - b) / d + (g < b ? 6 : 0);
                    break;
                case g:
                    h = (b - r) / d + 2;
                    break;
                case b:
                    h = (r - g) / d + 4;
                    break;
            }
            h /= 6;
        }
        const hsl = [h, s, l];
        if (a != null && a < 1) {
            // @ts-ignore
            return hsl.concat([a]);
        }
        // @ts-ignore
        return hsl;
    }

    function rgb2hwbToken(token) {
        const values = rgb2hwbvalues(token);
        if (values == null) {
            return null;
        }
        return hwbToken(values);
    }
    function hsl2hwbToken(token) {
        const values = hsl2hwbvalues(token);
        if (values == null) {
            return null;
        }
        return hwbToken(values);
    }
    function cmyk2hwbToken(token) {
        const values = cmyk2hwbvalues(token);
        if (values == null) {
            return null;
        }
        return hwbToken(values);
    }
    function oklab2hwbToken(token) {
        const values = oklab2hwbvalues(token);
        if (values == null) {
            return null;
        }
        return hwbToken(values);
    }
    function oklch2hwbToken(token) {
        const values = oklch2hwbvalues(token);
        if (values == null) {
            return null;
        }
        return hwbToken(values);
    }
    function lab2hwbToken(token) {
        const values = lab2hwbvalues(token);
        if (values == null) {
            return null;
        }
        return hwbToken(values);
    }
    function lch2hwbToken(token) {
        const values = lch2hwbvalues(token);
        if (values == null) {
            return null;
        }
        return hwbToken(values);
    }
    function color2hwbToken(token) {
        const values = color2hwbvalues(token);
        if (values == null) {
            return null;
        }
        return hwbToken(values);
    }
    function hwbToken(values) {
        values[0] = toPrecisionAngle(values[0] * 360);
        const chi = [
            { typ: exports.EnumToken.NumberTokenType, val: values[0] },
            { typ: exports.EnumToken.PercentageTokenType, val: toPrecisionValue(values[1]) * 100 },
            { typ: exports.EnumToken.PercentageTokenType, val: toPrecisionValue(values[2]) * 100 },
        ];
        if (values.length == 4) {
            chi.push({ typ: exports.EnumToken.LiteralTokenType, val: '/' }, {
                typ: exports.EnumToken.PercentageTokenType,
                val: values[3] * 100
            });
        }
        return {
            typ: exports.EnumToken.ColorTokenType,
            val: 'hwb',
            chi,
            kin: exports.ColorType.HWB
        };
    }
    function rgb2hwbvalues(token) {
        // @ts-ignore
        return srgb2hwb(...getComponents(token).map((t, index) => {
            if (index == 3) {
                return getNumber(t);
            }
            return getNumber(t) / 255;
        }));
    }
    function cmyk2hwbvalues(token) {
        // @ts-ignore
        return srgb2hwb(...cmyk2srgbvalues(token));
    }
    function hsl2hwbvalues(token) {
        // @ts-ignore
        return hslvalues2hwbvalues(...getComponents(token).map((t, index) => {
            if (index == 3 && (t.typ == exports.EnumToken.IdenTokenType && t.val == 'none')) {
                return 1;
            }
            if (index == 0) {
                return getAngle(t);
            }
            return getNumber(t);
        }));
    }
    function lab2hwbvalues(token) {
        const values = lab2srgbvalues(token);
        if (values == null) {
            return null;
        }
        // @ts-ignore
        return srgb2hwb(...values);
    }
    function lch2hwbvalues(token) {
        const values = lch2srgbvalues(token);
        if (values == null) {
            return null;
        }
        // @ts-ignore
        return srgb2hwb(...values);
    }
    function oklab2hwbvalues(token) {
        const values = oklab2srgbvalues(token);
        if (values == null) {
            return null;
        }
        // @ts-ignore
        return srgb2hwb(...values);
    }
    function oklch2hwbvalues(token) {
        const values = oklch2srgbvalues(token);
        // @ts-ignore
        return values == null ? null : srgb2hwb(...values);
    }
    function rgb2hue(r, g, b, fallback = 0) {
        let value = rgb2value(r, g, b);
        let whiteness = rgb2whiteness(r, g, b);
        let delta = value - whiteness;
        if (delta > 0) {
            // calculate segment
            let segment = value === r ? (g - b) / delta : (value === g
                ? (b - r) / delta
                : (r - g) / delta);
            // calculate shift
            let shift = value === r ? segment < 0
                ? 360 / 60
                : 0 / 60 : (value === g
                ? 120 / 60
                : 240 / 60);
            // calculate hue
            return (segment + shift) * 60;
        }
        return fallback;
    }
    function rgb2value(r, g, b) {
        return Math.max(r, g, b);
    }
    function rgb2whiteness(r, g, b) {
        return Math.min(r, g, b);
    }
    function color2hwbvalues(token) {
        const values = color2srgbvalues(token);
        if (values == null) {
            return null;
        }
        // @ts-ignore
        return srgb2hwb(...values);
    }
    function srgb2hwb(r, g, b, a = null, fallback = 0) {
        r *= 100;
        g *= 100;
        b *= 100;
        let hue = rgb2hue(r, g, b, fallback);
        let whiteness = rgb2whiteness(r, g, b);
        let value = Math.round(rgb2value(r, g, b));
        let blackness = 100 - value;
        const result = [hue / 360, whiteness / 100, blackness / 100];
        if (a != null) {
            result.push(a);
        }
        return result;
    }
    function hsv2hwb(h, s, v, a = null) {
        const result = [h, (1 - s) * v, 1 - v];
        if (a != null) {
            result.push(a);
        }
        return result;
    }
    function hslvalues2hwbvalues(h, s, l, a = null) {
        // @ts-ignore
        return hsv2hwb(...hsl2hsv(h, s, l, a));
    }

    function prophotorgb2srgbvalues(r, g, b, a = null) {
        // @ts-ignore
        return xyzd502srgb(...prophotorgb2xyz50(r, g, b, a));
    }
    function srgb2prophotorgbvalues(r, g, b, a) {
        // @ts-ignore
        return xyz50_to_prophotorgb(...XYZ_D65_to_D50(...srgb2xyz(r, g, b, a)));
    }
    function prophotorgb2lin_ProPhoto(r, g, b, a = null) {
        return [r, g, b].map(v => {
            let abs = Math.abs(v);
            if (abs >= 16 / 512) {
                return Math.sign(v) * Math.pow(abs, 1.8);
            }
            return v / 16;
        }).concat(a == null || a == 1 ? [] : [a]);
    }
    function prophotorgb2xyz50(r, g, b, a = null) {
        [r, g, b, a] = prophotorgb2lin_ProPhoto(r, g, b, a);
        const xyz = [
            0.7977666449006423 * r +
                0.1351812974005331 * g +
                0.0313477341283922 * b,
            0.2880748288194013 * r +
                0.7118352342418731 * g +
                0.0000899369387256 * b,
            0.8251046025104602 * b
        ];
        return xyz.concat(a == null || a == 1 ? [] : [a]);
    }
    function xyz50_to_prophotorgb(x, y, z, a) {
        // @ts-ignore
        return gam_prophotorgb(...[
            x * 1.3457868816471585 -
                y * 0.2555720873797946 -
                0.0511018649755453 * z,
            x * -0.5446307051249019 +
                y * 1.5082477428451466 +
                0.0205274474364214 * z,
            1.2119675456389452 * z
        ].concat(a == null || a == 1 ? [] : [a]));
    }
    function gam_prophotorgb(r, g, b, a) {
        return [r, g, b].map(v => {
            let abs = Math.abs(v);
            if (abs >= 1 / 512) {
                return Math.sign(v) * Math.pow(abs, 1 / 1.8);
            }
            return 16 * v;
        }).concat(a == null || a == 1 ? [] : [a]);
    }

    function rec20202srgb(r, g, b, a) {
        // @ts-ignore
        return xyz2srgb(...lrec20202xyz(...rec20202lrec2020(r, g, b)), a);
    }
    function srgb2rec2020values(r, g, b, a) {
        // @ts-ignore
        return lrec20202rec2020(...xyz2lrec2020(...srgb2xyz(r, g, b)), a);
    }
    function rec20202lrec2020(r, g, b, a) {
        // convert an array of rec2020 RGB values in the range 0.0 - 1.0
        // to linear light (un-companded) form.
        // ITU-R BT.2020-2 p.4
        const alpha = 1.09929682680944;
        const beta = 0.018053968510807;
        return [r, g, b].map(function (val) {
            let sign = val < 0 ? -1 : 1;
            let abs = Math.abs(val);
            if (abs < beta * 4.5) {
                return val / 4.5;
            }
            return sign * (Math.pow((abs + alpha - 1) / alpha, 1 / 0.45));
        }).concat([] );
    }
    function lrec20202rec2020(r, g, b, a) {
        // convert an array of linear-light rec2020 RGB  in the range 0.0-1.0
        // to gamma corrected form
        // ITU-R BT.2020-2 p.4
        const alpha = 1.09929682680944;
        const beta = 0.018053968510807;
        return [r, g, b].map(function (val) {
            let sign = val < 0 ? -1 : 1;
            let abs = Math.abs(val);
            if (abs > beta) {
                return sign * (alpha * Math.pow(abs, 0.45) - (alpha - 1));
            }
            return 4.5 * val;
        }).concat(a == null || a == 1 ? [] : [a]);
    }
    function lrec20202xyz(r, g, b, a) {
        // convert an array of linear-light rec2020 values to CIE XYZ
        // using  D65 (no chromatic adaptation)
        // http://www.brucelindbloom.com/index.html?Eqn_RGB_XYZ_Matrix.html
        let M = [
            [63426534 / 99577255, 20160776 / 139408157, 47086771 / 278816314],
            [26158966 / 99577255, 472592308 / 697040785, 8267143 / 139408157],
            [0, 19567812 / 697040785, 295819943 / 278816314],
        ];
        // 0 is actually calculated as  4.994106574466076e-17
        return multiplyMatrices(M, [r, g, b]).concat(a == null || a == 1 ? [] : [a]);
    }
    function xyz2lrec2020(x, y, z, a) {
        // convert XYZ to linear-light rec2020
        let M = [
            [30757411 / 17917100, -6372589 / 17917100, -4539589 / 17917100],
            [-19765991 / 29648200, 47925759 / 29648200, 467509 / 29648200],
            [792561 / 44930125, -1921689 / 44930125, 42328811 / 44930125],
        ];
        return multiplyMatrices(M, [x, y, z]).concat(a == null || a == 1 ? [] : [a]);
    }

    function p32srgbvalues(r, g, b, alpha) {
        // @ts-ignore
        return xyz2srgb(...lp32xyz(...p32lp3(r, g, b, alpha)));
    }
    function srgb2p3values(r, g, b, alpha) {
        // @ts-ignore
        return lp32p3(...xyz2lp3(...srgb2xyz(r, g, b, alpha)));
    }
    function p32lp3(r, g, b, alpha) {
        // convert an array of display-p3 RGB values in the range 0.0 - 1.0
        // to linear light (un-companded) form.
        return srgb2lsrgbvalues(r, g, b, alpha); // same as sRGB
    }
    function lp32p3(r, g, b, alpha) {
        // convert an array of linear-light display-p3 RGB  in the range 0.0-1.0
        // to gamma corrected form
        return lsrgb2srgbvalues(r, g, b, alpha); // same as sRGB
    }
    function lp32xyz(r, g, b, alpha) {
        // convert an array of linear-light display-p3 values to CIE XYZ
        // using  D65 (no chromatic adaptation)
        // http://www.brucelindbloom.com/index.html?Eqn_RGB_XYZ_Matrix.html
        const M = [
            [608311 / 1250200, 189793 / 714400, 198249 / 1000160],
            [35783 / 156275, 247089 / 357200, 198249 / 2500400],
            [0, 32229 / 714400, 5220557 / 5000800],
        ];
        const result = multiplyMatrices(M, [r, g, b]);
        if (alpha != null && alpha != 1) {
            result.push(alpha);
        }
        return result;
    }
    function xyz2lp3(x, y, z, alpha) {
        // convert XYZ to linear-light P3
        const M = [
            [446124 / 178915, -333277 / 357830, -72051 / 178915],
            [-14852 / 17905, 63121 / 35810, 423 / 17905],
            [11844 / 330415, -50337 / 660830, 316169 / 330415],
        ];
        const result = multiplyMatrices(M, [x, y, z]);
        if (alpha != null && alpha != 1) {
            result.push(alpha);
        }
        return result;
    }

    function interpolateHue(interpolationMethod, h1, h2) {
        switch (interpolationMethod.val) {
            case 'longer':
                if (h2 - h1 < 180 && h2 - h1 > 0) {
                    h1 += 360;
                }
                else if (h2 - h1 <= 0 && h2 - h1 > -180) {
                    h2 += 360;
                }
                break;
            case 'increasing':
                if (h2 < h1) {
                    h2 += 360;
                }
                break;
            case 'decreasing':
                if (h2 > h1) {
                    h1 += 360;
                }
                break;
            case 'shorter':
            default:
                // shorter
                if (h2 - h1 > 180) {
                    h1 += 360;
                }
                else if (h2 - h1 < -180) {
                    h2 += 360;
                }
                break;
        }
        return [h1, h2];
    }
    function colorMix(colorSpace, hueInterpolationMethod, color1, percentage1, color2, percentage2) {
        if (color1.val.toLowerCase() == 'currentcolor' || color2.val == 'currentcolor'.toLowerCase()) {
            return null;
        }
        if (hueInterpolationMethod != null && isRectangularOrthogonalColorspace(colorSpace)) {
            return null;
        }
        if (isPolarColorspace(colorSpace) && hueInterpolationMethod == null) {
            hueInterpolationMethod = { typ: exports.EnumToken.IdenTokenType, val: 'shorter' };
        }
        if (percentage1 == null) {
            if (percentage2 == null) {
                // @ts-ignore
                percentage1 = { typ: exports.EnumToken.NumberTokenType, val: .5 };
                // @ts-ignore
                percentage2 = { typ: exports.EnumToken.NumberTokenType, val: .5 };
            }
            else {
                if (+percentage2.val <= 0) {
                    return null;
                }
                if (+percentage2.val >= 100) {
                    percentage2 = { typ: exports.EnumToken.NumberTokenType, val: 1 };
                }
                // @ts-ignore
                percentage1 = { typ: exports.EnumToken.NumberTokenType, val: 1 - percentage2.val / 100 };
            }
        }
        else {
            // @ts-ignore
            if (percentage1.val <= 0) {
                return null;
            }
            if (percentage2 == null) {
                // @ts-ignore
                if (percentage1.val >= 100) {
                    // @ts-ignore
                    percentage1 = { typ: exports.EnumToken.NumberTokenType, val: 1 };
                }
                // @ts-ignore
                percentage2 = { typ: exports.EnumToken.NumberTokenType, val: 1 - percentage1.val / 100 };
            }
            else {
                // @ts-ignore
                if (percentage2.val <= 0) {
                    return null;
                }
            }
        }
        let values1 = srgbvalues(color1);
        let values2 = srgbvalues(color2);
        if (values1 == null || values2 == null) {
            return null;
        }
        const components1 = getComponents(color1);
        const components2 = getComponents(color2);
        if (components1 == null || components2 == null) {
            return null;
        }
        if ((components1[3] != null && components1[3].typ == exports.EnumToken.IdenTokenType && components1[3].val == 'none') && values2.length == 4) {
            values1[3] = values2[3];
        }
        if ((components2[3] != null && components2[3].typ == exports.EnumToken.IdenTokenType && components2[3].val == 'none') && values1.length == 4) {
            values2[3] = values1[3];
        }
        const p1 = getNumber(percentage1);
        const p2 = getNumber(percentage2);
        const mul1 = values1.length == 4 ? values1.pop() : 1;
        const mul2 = values2.length == 4 ? values2.pop() : 1;
        const mul = mul1 * p1 + mul2 * p2;
        // @ts-ignore
        const calculate = () => [colorSpace].concat(values1.map((v1, i) => {
            return {
                typ: exports.EnumToken.NumberTokenType, val: (mul1 * v1 * p1 + mul2 * values2[i] * p2) / mul
            };
        }).concat(mul == 1 ? [] : [{
                typ: exports.EnumToken.NumberTokenType, val: mul
            }]));
        switch (colorSpace.val) {
            case 'srgb':
                break;
            case 'display-p3':
                // @ts-ignore
                values1 = srgb2p3values(...values1);
                // @ts-ignore
                values2 = srgb2p3values(...values2);
                break;
            case 'a98-rgb':
                // @ts-ignore
                values1 = srgb2a98values(...values1);
                // @ts-ignore
                values2 = srgb2a98values(...values2);
                break;
            case 'prophoto-rgb':
                // @ts-ignore
                values1 = srgb2prophotorgbvalues(...values1);
                // @ts-ignore
                values2 = srgb2prophotorgbvalues(...values2);
                break;
            case 'srgb-linear':
                // @ts-ignore
                values1 = srgb2lsrgbvalues(...values1);
                // @ts-ignore
                values2 = srgb2lsrgbvalues(...values2);
                break;
            case 'rec2020':
                // @ts-ignore
                values1 = srgb2rec2020values(...values1);
                // @ts-ignore
                values2 = srgb2rec2020values(...values2);
                break;
            case 'xyz':
            case 'xyz-d65':
            case 'xyz-d50':
                // @ts-ignore
                values1 = srgb2xyz_d50(...values1);
                // @ts-ignore
                values2 = srgb2xyz_d50(...values2);
                if (colorSpace.val == 'xyz-d50') {
                    // @ts-ignore
                    values1 = XYZ_D65_to_D50(...values1);
                    // @ts-ignore
                    values2 = XYZ_D65_to_D50(...values2);
                }
                break;
            case 'rgb':
                // @ts-ignore
                values1 = srgb2rgb(...values1);
                // @ts-ignore
                values2 = srgb2rgb(...values2);
                break;
            case 'hsl':
                // @ts-ignore
                values1 = srgb2hslvalues(...values1);
                // @ts-ignore
                values2 = srgb2hslvalues(...values2);
                break;
            case 'hwb':
                // @ts-ignore
                values1 = srgb2hwb(...values1);
                // @ts-ignore
                values2 = srgb2hwb(...values2);
                break;
            case 'lab':
                // @ts-ignore
                values1 = srgb2labvalues(...values1);
                // @ts-ignore
                values2 = srgb2labvalues(...values2);
                break;
            case 'lch':
                // @ts-ignore
                values1 = srgb2lch(...values1);
                // @ts-ignore
                values2 = srgb2lch(...values2);
                break;
            case 'oklab':
                // @ts-ignore
                values1 = srgb2oklab(...values1);
                // @ts-ignore
                values2 = srgb2oklab(...values2);
                break;
            case 'oklch':
                // @ts-ignore
                values1 = srgb2oklch(...values1);
                // @ts-ignore
                values2 = srgb2oklch(...values2);
                break;
            default:
                return null;
        }
        const lchSpaces = ['lch', 'oklch'];
        const colorSpace1 = exports.ColorType[color1.kin].toLowerCase().replaceAll('_', '-');
        const colorSpace2 = exports.ColorType[color2.kin].toLowerCase().replaceAll('_', '-');
        // powerless
        if (lchSpaces.includes(colorSpace1) || lchSpaces.includes(colorSpace.val)) {
            if ((components1[2].typ == exports.EnumToken.IdenTokenType && components1[2].val == 'none') || values1[2] == 0) {
                values1[2] = values2[2];
            }
        }
        // powerless
        if (lchSpaces.includes(colorSpace2) || lchSpaces.includes(colorSpace.val)) {
            if ((components2[2].typ == exports.EnumToken.IdenTokenType && components2[2].val == 'none') || values2[2] == 0) {
                values2[2] = values1[2];
            }
        }
        if (hueInterpolationMethod != null) {
            let hueIndex = 2;
            let multiplier = 1;
            if (['hwb', 'hsl'].includes(colorSpace.val)) {
                hueIndex = 0;
                multiplier = 360;
            }
            const [h1, h2] = interpolateHue(hueInterpolationMethod, values1[hueIndex] * multiplier, values2[hueIndex] * multiplier);
            values1[hueIndex] = h1 / multiplier;
            values2[hueIndex] = h2 / multiplier;
        }
        switch (colorSpace.val) {
            case 'xyz':
            case 'xyz-d65':
            case 'xyz-d50':
                let values = values1.map((v1, i) => (mul1 * v1 * p1 + mul2 * values2[i] * p2) / mul)
                    .concat(mul == 1 ? [] : [mul]);
                if (colorSpace.val == 'xyz-d50') {
                    // @ts-ignore
                    values = xyzd502lch(...values);
                }
                else {
                    // @ts-ignore
                    values = xyz2lchvalues(...values);
                }
                // @ts-ignore
                return {
                    typ: exports.EnumToken.ColorTokenType,
                    val: 'lch',
                    chi: values.map(v => {
                        return {
                            typ: exports.EnumToken.NumberTokenType,
                            val: v
                        };
                    }),
                    kin: exports.ColorType.LCH
                };
            case 'srgb':
            case 'srgb-linear':
            case 'a98-rgb':
            case 'rec2020':
                // @ts-ignore
                return {
                    typ: exports.EnumToken.ColorTokenType,
                    val: 'color',
                    chi: calculate(),
                    kin: exports.ColorType.COLOR,
                    cal: 'col'
                };
            case 'rgb':
            case 'hsl':
            case 'hwb':
            case 'lab':
            case 'lch':
            case 'oklab':
            case 'oklch':
                if (['hsl', 'hwb'].includes(colorSpace.val)) {
                    // @ts-ignore
                    if (values1[2] < 0) {
                        // @ts-ignore
                        values1[2] += 1;
                    }
                    // @ts-ignore
                    if (values2[2] < 0) {
                        // @ts-ignore
                        values2[2] += 1;
                    }
                }
                else if (['lch', 'oklch'].includes(colorSpace.val)) {
                    // @ts-ignore
                    if (values1[2] < 0) {
                        // @ts-ignore
                        values1[2] += 360;
                    }
                    // @ts-ignore
                    if (values2[2] < 0) {
                        // @ts-ignore
                        values2[2] += 360;
                    }
                }
                // @ts-ignore
                const result = {
                    typ: exports.EnumToken.ColorTokenType,
                    val: colorSpace.val,
                    chi: calculate().slice(1),
                    kin: exports.ColorType[colorSpace.val.toUpperCase().replaceAll('-', '_')]
                };
                if (colorSpace.val == 'hsl' || colorSpace.val == 'hwb') {
                    // @ts-ignore
                    result.chi[0] = { typ: exports.EnumToken.AngleTokenType, val: result.chi[0].val * 360 };
                    // @ts-ignore
                    result.chi[1] = { typ: exports.EnumToken.PercentageTokenType, val: result.chi[1].val * 100 };
                    // @ts-ignore
                    result.chi[2] = { typ: exports.EnumToken.PercentageTokenType, val: result.chi[2].val * 100 };
                }
                return result;
        }
        return null;
    }

    function gcd(x, y) {
        x = Math.abs(x);
        y = Math.abs(y);
        if (x == y) {
            return x;
        }
        let t;
        // if (x == 0) {
        //
        //     return y;
        // }
        //
        // if (y == 0) {
        //
        //     return x;
        // }
        if (y > x) {
            [x, y] = [y, x];
        }
        while (y) {
            t = y;
            y = x % y;
            x = t;
        }
        return x;
    }
    function compute$1(a, b, op) {
        if (typeof a == 'number' && typeof b == 'number') {
            switch (op) {
                case exports.EnumToken.Add:
                    return a + b;
                case exports.EnumToken.Sub:
                    return a - b;
                case exports.EnumToken.Mul:
                    return a * b;
                case exports.EnumToken.Div:
                    const r = simplify(a, b);
                    if (r[1] == 1) {
                        return r[0];
                    }
                    const result = a / b;
                    const r2 = minifyNumber(r[0]) + '/' + minifyNumber(r[1]);
                    return minifyNumber(result).length < r2.length ? result : {
                        typ: exports.EnumToken.FractionTokenType,
                        l: { typ: exports.EnumToken.NumberTokenType, val: r[0] },
                        r: { typ: exports.EnumToken.NumberTokenType, val: r[1] }
                    };
            }
        }
        let l1 = typeof a == 'number' ? {
            typ: exports.EnumToken.FractionTokenType,
            l: { typ: exports.EnumToken.NumberTokenType, val: a },
            r: { typ: exports.EnumToken.NumberTokenType, val: 1 }
        } : a;
        let r1 = typeof b == 'number' ? {
            typ: exports.EnumToken.FractionTokenType,
            l: { typ: exports.EnumToken.NumberTokenType, val: b },
            r: { typ: exports.EnumToken.NumberTokenType, val: 1 }
        } : b;
        let l2;
        let r2;
        switch (op) {
            case exports.EnumToken.Add:
                // @ts-ignore
                l2 = l1.l.val * r1.r.val + l1.r.val * r1.l.val;
                // @ts-ignore
                r2 = l1.r.val * r1.r.val;
                break;
            case exports.EnumToken.Sub:
                // @ts-ignore
                l2 = l1.l.val * r1.r.val - l1.r.val * r1.l.val;
                // @ts-ignore
                r2 = l1.r.val * r1.r.val;
                break;
            case exports.EnumToken.Mul:
                // @ts-ignore
                l2 = l1.l.val * r1.l.val;
                // @ts-ignore
                r2 = l1.r.val * r1.r.val;
                break;
            case exports.EnumToken.Div:
                // @ts-ignore
                l2 = l1.l.val * r1.r.val;
                // @ts-ignore
                r2 = l1.r.val * r1.l.val;
                break;
        }
        // @ts-ignore
        const a2 = simplify(l2, r2);
        if (a2[1] == 1) {
            return a2[0];
        }
        const result = a2[0] / a2[1];
        return minifyNumber(result).length <= minifyNumber(a2[0]).length + 1 + minifyNumber(a2[1]).length ? result : {
            typ: exports.EnumToken.FractionTokenType,
            l: { typ: exports.EnumToken.NumberTokenType, val: a2[0] },
            r: { typ: exports.EnumToken.NumberTokenType, val: a2[1] }
        };
    }
    function rem(...a) {
        if (a.some((i) => !Number.isInteger(i))) {
            return a.reduce((a, b) => Math.max(a, String(b).split('.')[1]?.length ?? 0), 0);
        }
        return 0;
    }
    function simplify(a, b) {
        const g = gcd(a, b);
        return g > 1 ? [a / g, b / g] : [a, b];
    }

    /**
     * evaluate an array of tokens
     * @param tokens
     */
    function evaluate(tokens) {
        let nodes;
        if (tokens.length == 1 && tokens[0].typ == exports.EnumToken.FunctionTokenType && tokens[0].val != 'calc' && mathFuncs.includes(tokens[0].val)) {
            const chi = tokens[0].chi.reduce((acc, t) => {
                if (acc.length == 0 || t.typ == exports.EnumToken.CommaTokenType) {
                    acc.push([]);
                }
                if ([exports.EnumToken.WhitespaceTokenType, exports.EnumToken.CommaTokenType, exports.EnumToken.CommaTokenType].includes(t.typ)) {
                    return acc;
                }
                acc.at(-1).push(t);
                return acc;
            }, []);
            for (let i = 0; i < chi.length; i++) {
                chi[i] = evaluate(chi[i]);
            }
            tokens[0].chi = chi.reduce((acc, t) => {
                if (acc.length > 0) {
                    acc.push({ typ: exports.EnumToken.CommaTokenType });
                }
                acc.push(...t);
                return acc;
            });
            return evaluateFunc(tokens[0]);
        }
        nodes = inlineExpression$1(evaluateExpression(buildExpression(tokens)));
        if (nodes.length <= 1) {
            if (nodes.length == 1) {
                if (nodes[0].typ == exports.EnumToken.BinaryExpressionTokenType) {
                    return inlineExpression$1(nodes[0]);
                }
                // @ts-ignore
                if (nodes[0].typ == exports.EnumToken.IdenTokenType && typeof Math[nodes[0].val.toUpperCase()] == 'number') {
                    return [{
                            ...nodes[0],
                            // @ts-ignore
                            val: Math[nodes[0].val.toUpperCase()],
                            typ: exports.EnumToken.NumberTokenType
                        }];
                }
            }
            return nodes;
        }
        const map = new Map;
        let token;
        let i;
        for (i = 0; i < nodes.length; i++) {
            token = nodes[i];
            if (token.typ == exports.EnumToken.Add) {
                continue;
            }
            if (token.typ == exports.EnumToken.Sub) {
                if (!isScalarToken(nodes[i + 1])) {
                    token = { typ: exports.EnumToken.ListToken, chi: [nodes[i], nodes[i + 1]] };
                }
                else {
                    token = doEvaluate(nodes[i + 1], { typ: exports.EnumToken.NumberTokenType, val: -1 }, exports.EnumToken.Mul);
                }
                i++;
            }
            if (!map.has(token.typ)) {
                map.set(token.typ, [token]);
            }
            else {
                map.get(token.typ).push(token);
            }
        }
        return [...map].reduce((acc, curr) => {
            const token = curr[1].reduce((acc, curr) => doEvaluate(acc, curr, exports.EnumToken.Add));
            if (token.typ != exports.EnumToken.BinaryExpressionTokenType) {
                if ('val' in token && +token.val < 0) {
                    acc.push({ typ: exports.EnumToken.Sub }, { ...token, val: -token.val });
                    return acc;
                }
            }
            if (acc.length > 0 && curr[0] != exports.EnumToken.ListToken) {
                acc.push({ typ: exports.EnumToken.Add });
            }
            acc.push(token);
            return acc;
        }, []);
    }
    /**
     * evaluate arithmetic operation
     * @param l
     * @param r
     * @param op
     */
    function doEvaluate(l, r, op) {
        const defaultReturn = {
            typ: exports.EnumToken.BinaryExpressionTokenType,
            op,
            l,
            r
        };
        if (!isScalarToken(l) || !isScalarToken(r) || (l.typ == r.typ && 'unit' in l && 'unit' in r && l.unit != r.unit)) {
            return defaultReturn;
        }
        if (r.typ == exports.EnumToken.FunctionTokenType) {
            const val = evaluateFunc(r);
            if (val.length == 1) {
                r = val[0];
            }
        }
        if ((op == exports.EnumToken.Add || op == exports.EnumToken.Sub)) {
            // @ts-ignore
            if (l.typ != r.typ) {
                return defaultReturn;
            }
        }
        let typ = l.typ == exports.EnumToken.NumberTokenType ? r.typ : (r.typ == exports.EnumToken.NumberTokenType ? l.typ : (l.typ == exports.EnumToken.PercentageTokenType ? r.typ : l.typ));
        // @ts-ignore
        let v1 = l.val?.typ == exports.EnumToken.FractionTokenType ? l.val : getValue$1(l);
        // @ts-ignore
        let v2 = r.val?.typ == exports.EnumToken.FractionTokenType ? r.val : getValue$1(r);
        if (op == exports.EnumToken.Mul) {
            if (l.typ != exports.EnumToken.NumberTokenType && r.typ != exports.EnumToken.NumberTokenType) {
                if (typeof v1 == 'number' && l.typ == exports.EnumToken.PercentageTokenType) {
                    v1 = {
                        typ: exports.EnumToken.FractionTokenType,
                        l: { typ: exports.EnumToken.NumberTokenType, val: v1 },
                        r: { typ: exports.EnumToken.NumberTokenType, val: 100 }
                    };
                }
                else if (typeof v2 == 'number' && r.typ == exports.EnumToken.PercentageTokenType) {
                    v2 = {
                        typ: exports.EnumToken.FractionTokenType,
                        l: { typ: exports.EnumToken.NumberTokenType, val: v2 },
                        r: { typ: exports.EnumToken.NumberTokenType, val: 100 }
                    };
                }
            }
        }
        // @ts-ignore
        const val = compute$1(v1, v2, op);
        const token = {
            ...(l.typ == exports.EnumToken.NumberTokenType ? r : l),
            typ,
            val /* : typeof val == 'number' ? minifyNumber(val) : val */
        };
        if (token.typ == exports.EnumToken.IdenTokenType) {
            // @ts-ignore
            token.typ = exports.EnumToken.NumberTokenType;
        }
        return token;
    }
    function getValue$1(t) {
        if (t.typ == exports.EnumToken.IdenTokenType) {
            // @ts-ignore
            return Math[t.val.toUpperCase()];
        }
        // @ts-ignore
        return t.typ == exports.EnumToken.FractionTokenType ? t.l.val / t.r.val : +t.val;
    }
    function evaluateFunc(token) {
        const values = token.chi.slice();
        switch (token.val) {
            case 'abs':
            case 'sin':
            case 'cos':
            case 'tan':
            case 'asin':
            case 'acos':
            case 'atan':
            case 'sign':
            case 'sqrt':
            case 'exp': {
                const value = evaluate(values);
                // @ts-ignore
                let val = value[0].typ == exports.EnumToken.NumberTokenType ? +value[0].val : value[0].l.val / value[0].r.val;
                return [{
                        typ: exports.EnumToken.NumberTokenType,
                        val: Math[token.val](val)
                    }];
            }
            case 'hypot': {
                const chi = values.filter(t => ![exports.EnumToken.WhitespaceTokenType, exports.EnumToken.CommentTokenType, exports.EnumToken.CommaTokenType].includes(t.typ));
                let all = [];
                let ref = chi[0];
                let value = 0;
                for (let i = 0; i < chi.length; i++) {
                    // @ts-ignore
                    const val = getValue$1(chi[i]);
                    all.push(val);
                    value += val * val;
                }
                return [
                    {
                        ...ref,
                        val: +(Math.sqrt(value).toFixed(rem(...all)))
                    }
                ];
            }
            case 'atan2':
            case 'pow':
            case 'rem':
            case 'mod': {
                const chi = values.filter(t => ![exports.EnumToken.WhitespaceTokenType, exports.EnumToken.CommentTokenType].includes(t.typ));
                // https://developer.mozilla.org/en-US/docs/Web/CSS/mod
                const v1 = evaluate([chi[0]]);
                const v2 = evaluate([chi[2]]);
                // @ts-ignore
                const val1 = getValue$1(v1[0]);
                // @ts-ignore
                const val2 = getValue$1(v2[0]);
                if (token.val == 'rem') {
                    return [
                        {
                            ...v1[0],
                            val: +((val1 % val2).toFixed(rem(val1, val2)))
                        }
                    ];
                }
                if (token.val == 'pow') {
                    return [
                        {
                            ...v1[0],
                            val: Math.pow(val1, val2)
                        }
                    ];
                }
                if (token.val == 'atan2') {
                    return [
                        {
                            ...{}, ...v1[0],
                            val: Math.atan2(val1, val2)
                        }
                    ];
                }
                return [
                    {
                        ...v1[0],
                        val: val2 == 0 ? val1 : val1 - (Math.floor(val1 / val2) * val2)
                    }
                ];
            }
            case 'clamp':
                token.chi = values;
                return [token];
            case 'log':
            case 'round':
            case 'min':
            case 'max': {
                const strategy = token.val == 'round' && values[0]?.typ == exports.EnumToken.IdenTokenType ? values.shift().val : null;
                const valuesMap = new Map;
                for (const curr of values) {
                    if (curr.typ == exports.EnumToken.CommaTokenType || curr.typ == exports.EnumToken.WhitespaceTokenType || curr.typ == exports.EnumToken.CommentTokenType) {
                        continue;
                    }
                    const result = evaluate([curr]);
                    const key = result[0].typ + ('unit' in result[0] ? result[0].unit : '');
                    if (!valuesMap.has(key)) {
                        valuesMap.set(key, []);
                    }
                    valuesMap.get(key).push(result[0]);
                }
                if (valuesMap.size == 1) {
                    const values = valuesMap.values().next().value;
                    if (token.val == 'log') {
                        const val1 = getValue$1(values[0]);
                        const val2 = values.length == 2 ? getValue$1(values[1]) : null;
                        return [
                            {
                                ...values[0],
                                val: Math.log(val1) / Math.log(val2)
                            }
                        ];
                    }
                    if (token.val == 'min' || token.val == 'max') {
                        let val = getValue$1(values[0]);
                        let val2 = val;
                        let ret = values[0];
                        for (const curr of values.slice(1)) {
                            val2 = getValue$1(curr);
                            if (val2 < val && token.val == 'min') {
                                val = val2;
                                ret = curr;
                            }
                            else if (val2 > val && token.val == 'max') {
                                val = val2;
                                ret = curr;
                            }
                        }
                        return [ret];
                    }
                    if (token.val == 'round') {
                        let val = getValue$1(values[0]);
                        let val2 = getValue$1(values[1]);
                        if (strategy == null || strategy == 'down') {
                            val = val - (val % val2);
                        }
                        else {
                            val = strategy == 'to-zero' ? Math.trunc(val / val2) * val2 : (strategy == 'nearest' ? Math.round(val / val2) * val2 : Math.ceil(val / val2) * val2);
                        }
                        // @ts-ignore
                        return [{ ...values[0], val }];
                    }
                }
            }
        }
        return [token];
    }
    /**
     * convert BinaryExpression into an array
     * @param token
     */
    function inlineExpression$1(token) {
        const result = [];
        if (token.typ == exports.EnumToken.BinaryExpressionTokenType) {
            if ([exports.EnumToken.Mul, exports.EnumToken.Div].includes(token.op)) {
                result.push(token);
            }
            else {
                result.push(...inlineExpression$1(token.l), { typ: token.op }, ...inlineExpression$1(token.r));
            }
        }
        else {
            result.push(token);
        }
        return result;
    }
    /**
     * evaluate expression
     * @param token
     */
    function evaluateExpression(token) {
        if (token.typ != exports.EnumToken.BinaryExpressionTokenType) {
            return token;
        }
        if (token.r.typ == exports.EnumToken.BinaryExpressionTokenType) {
            token.r = evaluateExpression(token.r);
        }
        if (token.l.typ == exports.EnumToken.BinaryExpressionTokenType) {
            token.l = evaluateExpression(token.l);
        }
        return doEvaluate(token.l, token.r, token.op);
    }
    function isScalarToken(token) {
        return 'unit' in token ||
            (token.typ == exports.EnumToken.FunctionTokenType && mathFuncs.includes(token.val)) ||
            // @ts-ignore
            (token.typ == exports.EnumToken.IdenTokenType && typeof Math[token.val.toUpperCase()] == 'number') ||
            [exports.EnumToken.NumberTokenType, exports.EnumToken.FractionTokenType, exports.EnumToken.PercentageTokenType].includes(token.typ);
    }
    /**
     *
     * generate a binary expression tree
     * @param tokens
     */
    function buildExpression(tokens) {
        return factor(factor(tokens.filter(t => t.typ != exports.EnumToken.WhitespaceTokenType), ['/', '*']), ['+', '-'])[0];
    }
    function getArithmeticOperation(op) {
        if (op == '+') {
            return exports.EnumToken.Add;
        }
        if (op == '-') {
            return exports.EnumToken.Sub;
        }
        if (op == '/') {
            return exports.EnumToken.Div;
        }
        return exports.EnumToken.Mul;
    }
    /**
     *
     * generate a binary expression tree
     * @param token
     */
    function factorToken(token) {
        if (token.typ == exports.EnumToken.ParensTokenType || (token.typ == exports.EnumToken.FunctionTokenType && token.val == 'calc')) {
            if (token.typ == exports.EnumToken.FunctionTokenType && token.val == 'calc') {
                token = { ...token, typ: exports.EnumToken.ParensTokenType };
                // @ts-ignore
                delete token.val;
            }
            return buildExpression(token.chi);
        }
        return token;
    }
    /**
     * generate a binary expression tree
     * @param tokens
     * @param ops
     */
    function factor(tokens, ops) {
        let isOp;
        const opList = ops.map(x => getArithmeticOperation(x));
        if (tokens.length == 1) {
            return [factorToken(tokens[0])];
        }
        for (let i = 0; i < tokens.length; i++) {
            if (tokens[i].typ == exports.EnumToken.ListToken) {
                // @ts-ignore
                tokens.splice(i, 1, ...tokens[i].chi);
            }
            isOp = opList.includes(tokens[i].typ);
            if (isOp ||
                // @ts-ignore
                (tokens[i].typ == exports.EnumToken.LiteralTokenType && ops.includes(tokens[i].val))) {
                tokens.splice(i - 1, 3, {
                    typ: exports.EnumToken.BinaryExpressionTokenType,
                    op: isOp ? tokens[i].typ : getArithmeticOperation(tokens[i].val),
                    l: factorToken(tokens[i - 1]),
                    r: factorToken(tokens[i + 1])
                });
                i--;
            }
        }
        return tokens;
    }

    function parseRelativeColor(relativeKeys, original, rExp, gExp, bExp, aExp) {
        let r;
        let g;
        let b;
        let alpha = null;
        let keys = {};
        let values = {};
        // colorFuncColorSpace x,y,z or r,g,b
        const names = relativeKeys.startsWith('xyz') ? 'xyz' : ['srgb', 'srgb-linear', 'display-p3', 'a98-rgb', 'prophoto-rgb', 'rec2020', 'rgb'].includes(relativeKeys.toLowerCase()) ? 'rgb' : relativeKeys.slice(-3);
        const converted = convertColor(original, exports.ColorType[relativeKeys.toUpperCase().replaceAll('-', '_')]);
        if (converted == null) {
            return null;
        }
        const children = converted.chi.filter(t => ![exports.EnumToken.WhitespaceTokenType, exports.EnumToken.LiteralTokenType, exports.EnumToken.CommentTokenType].includes(t.typ));
        [r, g, b, alpha] = converted.kin == exports.ColorType.COLOR ? children.slice(1) : children;
        values = {
            [names[0]]: getValue(r, converted, names[0]),
            [names[1]]: getValue(g, converted, names[1]), // string,
            [names[2]]: getValue(b, converted, names[2]),
            // @ts-ignore
            alpha: alpha == null ? {
                typ: exports.EnumToken.NumberTokenType,
                val: 1
            } : (alpha.typ == exports.EnumToken.IdenTokenType && alpha.val == 'none') ? {
                typ: exports.EnumToken.NumberTokenType,
                val: 0
            } : (alpha.typ == exports.EnumToken.PercentageTokenType ? {
                typ: exports.EnumToken.NumberTokenType,
                val: getNumber(alpha)
            } : alpha)
        };
        keys = {
            [names[0]]: getValue(rExp, converted, names[0]),
            [names[1]]: getValue(gExp, converted, names[1]),
            [names[2]]: getValue(bExp, converted, names[2]),
            // @ts-ignore
            alpha: getValue(aExp == null ? {
                typ: exports.EnumToken.NumberTokenType,
                val: 1
            } : (aExp.typ == exports.EnumToken.IdenTokenType && aExp.val == 'none') ? {
                typ: exports.EnumToken.NumberTokenType,
                val: 0
            } : aExp)
        };
        return computeComponentValue(keys, converted, values);
    }
    function getValue(t, converted, component) {
        if (t.typ == exports.EnumToken.PercentageTokenType) {
            let value = getNumber(t);
            let colorSpace = exports.ColorType[converted.kin].toLowerCase().replaceAll('-', '_');
            if (colorSpace in colorRange) {
                // @ts-ignore
                value *= colorRange[colorSpace][component].at(-1);
            }
            return {
                typ: exports.EnumToken.NumberTokenType,
                val: value
            };
        }
        return t;
    }
    function computeComponentValue(expr, converted, values) {
        for (const object of [values, expr]) {
            if ('h' in object) {
                // normalize hue
                for (const k of walkValues([object.h])) {
                    if (k.value.typ == exports.EnumToken.AngleTokenType && k.value.unit == 'deg') {
                        k.value.typ = exports.EnumToken.NumberTokenType;
                    }
                }
            }
        }
        for (const [key, exp] of Object.entries(expr)) {
            if ([exports.EnumToken.NumberTokenType, exports.EnumToken.PercentageTokenType, exports.EnumToken.AngleTokenType, exports.EnumToken.LengthTokenType].includes(exp.typ)) ;
            else if (exp.typ == exports.EnumToken.IdenTokenType && exp.val in values) {
                expr[key] = values[exp.val];
            }
            else if (exp.typ == exports.EnumToken.FunctionTokenType && mathFuncs.includes(exp.val)) {
                for (let { value, parent } of walkValues(exp.chi, exp)) {
                    if (value.typ == exports.EnumToken.IdenTokenType) {
                        // @ts-ignore
                        replaceValue(parent, value, values[value.val] ?? {
                            typ: exports.EnumToken.NumberTokenType,
                            // @ts-ignore
                            val: '' + Math[value.val.toUpperCase()]
                            // @ts-ignore
                        });
                    }
                }
                const result = exp.typ == exports.EnumToken.FunctionTokenType && mathFuncs.includes(exp.val) && exp.val != 'calc' ? evaluateFunc(exp) : evaluate(exp.chi);
                if (result.length == 1 && result[0].typ != exports.EnumToken.BinaryExpressionTokenType) {
                    expr[key] = result[0];
                }
            }
        }
        return expr;
    }
    function replaceValue(parent, value, newValue) {
        for (const { value: val, parent: pr } of walkValues([parent])) {
            if (val.typ == value.typ && val.val == value.val) {
                if (pr.typ == exports.EnumToken.BinaryExpressionTokenType) {
                    if (pr.l == val) {
                        pr.l = newValue;
                        return;
                    }
                    else {
                        pr.r = newValue;
                        return;
                    }
                }
                else {
                    pr.chi.splice(pr.chi.indexOf(val), 1, newValue);
                    return;
                }
            }
        }
    }

    function rgb2cmykToken(token) {
        const components = rgb2srgbvalues(token);
        if (components == null || components.length < 3) {
            return null;
        }
        // @ts-ignore
        return cmyktoken(srgb2cmykvalues(...components));
    }
    function hsl2cmykToken(token) {
        const values = hsl2srgbvalues(token);
        if (values == null) {
            return null;
        }
        // @ts-ignore
        return cmyktoken(srgb2cmykvalues(...values));
    }
    function hwb2cmykToken(token) {
        const values = hwb2srgbvalues(token);
        if (values == null) {
            return null;
        }
        // @ts-ignore
        return cmyktoken(srgb2cmykvalues(...values));
    }
    function lab2cmykToken(token) {
        const components = lab2srgbvalues(token);
        if (components == null || components.length < 3) {
            return null;
        }
        // @ts-ignore
        return cmyktoken(srgb2cmykvalues(...components));
    }
    function lch2cmykToken(token) {
        const components = lch2srgbvalues(token);
        if (components == null || components.length < 3) {
            return null;
        }
        // @ts-ignore
        return cmyktoken(srgb2cmykvalues(...components));
    }
    function oklab2cmyk(token) {
        const components = oklab2srgbvalues(token);
        if (components == null || components.length < 3) {
            return null;
        }
        // @ts-ignore
        return cmyktoken(srgb2cmykvalues(...components));
    }
    function oklch2cmykToken(token) {
        const components = oklch2srgbvalues(token);
        if (components == null || components.length < 3) {
            return null;
        }
        // @ts-ignore
        return cmyktoken(srgb2cmykvalues(...components));
    }
    function color2cmykToken(token) {
        const values = color2srgbvalues(token);
        if (values == null) {
            return null;
        }
        // @ts-ignore
        return cmyktoken(srgb2cmykvalues(...values));
    }
    function srgb2cmykvalues(r, g, b, a = null) {
        const k = 1 - Math.max(r, g, b);
        const c = k == 1 ? 0 : (1 - r - k) / (1 - k);
        const m = k == 1 ? 0 : (1 - g - k) / (1 - k);
        const y = k == 1 ? 0 : (1 - b - k) / (1 - k);
        const result = [c, m, y, k];
        if (a != null && a < 1) {
            result.push(a);
        }
        return result;
    }
    function cmyktoken(values) {
        return {
            typ: exports.EnumToken.ColorTokenType,
            val: 'device-cmyk',
            chi: values.reduce((acc, curr, index) => index < 4 ? [...acc, {
                    typ: exports.EnumToken.PercentageTokenType,
                    // @ts-ignore
                    val: toPrecisionValue(curr) * 100
                }] : [...acc, {
                    typ: exports.EnumToken.LiteralTokenType,
                    val: '/'
                }, {
                    typ: exports.EnumToken.PercentageTokenType,
                    val: toPrecisionValue(curr) * 100
                }], []),
            kin: exports.ColorType.DEVICE_CMYK
        };
    }

    function a98rgb2srgbvalues(r, g, b, a = null) {
        //  @ts-ignore
        return xyz2srgb(...la98rgb2xyz(...a98rgb2la98(r, g, b, a)));
    }
    function srgb2a98values$1(r, g, b, a = null) {
        // @ts-ignore
        return la98rgb2a98rgb(...xyz2la98rgb(...srgb2xyz(r, g, b, a)));
    }
    // a98-rgb functions
    function a98rgb2la98(r, g, b, a = null) {
        // convert an array of a98-rgb values in the range 0.0 - 1.0
        // to linear light (un-companded) form.
        // negative values are also now accepted
        return [r, g, b].map(function (val) {
            let sign = val < 0 ? -1 : 1;
            let abs = Math.abs(val);
            return sign * Math.pow(abs, 563 / 256);
        }).concat(a == null || a == 1 ? [] : [a]);
    }
    function la98rgb2a98rgb(r, g, b, a = null) {
        // convert an array of linear-light a98-rgb  in the range 0.0-1.0
        // to gamma corrected form
        // negative values are also now accepted
        return [r, b, g].map(function (val) {
            let sign = val < 0 ? -1 : 1;
            let abs = Math.abs(val);
            return sign * Math.pow(abs, 256 / 563);
        }).concat(a == null || a == 1 ? [] : [a]);
    }
    function la98rgb2xyz(r, g, b, a = null) {
        // convert an array of linear-light a98-rgb values to CIE XYZ
        // http://www.brucelindbloom.com/index.html?Eqn_RGB_XYZ_Matrix.html
        // has greater numerical precision than section 4.3.5.3 of
        // https://www.adobe.com/digitalimag/pdfs/AdobeRGB1998.pdf
        // but the values below were calculated from first principles
        // from the chromaticity coordinates of R G B W
        // see matrixmaker.html
        var M = [
            [573536 / 994567, 263643 / 1420810, 187206 / 994567],
            [591459 / 1989134, 6239551 / 9945670, 374412 / 4972835],
            [53769 / 1989134, 351524 / 4972835, 4929758 / 4972835],
        ];
        return multiplyMatrices(M, [r, g, b]).concat(a == null || a == 1 ? [] : [a]);
    }
    function xyz2la98rgb(x, y, z, a = null) {
        // convert XYZ to linear-light a98-rgb
        var M = [
            [1829569 / 896150, -506331 / 896150, -308931 / 896150],
            [-851781 / 878810, 1648619 / 878810, 36519 / 878810],
            [16779 / 1248040, -147721 / 1248040, 1266979 / 1248040],
        ];
        return multiplyMatrices(M, [x, y, z]).concat(a == null || a == 1 ? [] : [a]);
    }

    const epsilon = 1e-5;
    function identity() {
        return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
    }
    function normalize(point) {
        const [x, y, z] = point;
        const norm = Math.sqrt(point[0] * point[0] + point[1] * point[1] + point[2] * point[2]);
        return norm === 0 ? [0, 0, 0] : [x / norm, y / norm, z / norm];
    }
    function dot(point1, point2) {
        if (point1.length === 4 && point2.length === 4) {
            return point1[0] * point2[0] + point1[1] * point2[1] + point1[2] * point2[2] + point1[3] * point2[3];
        }
        return point1[0] * point2[0] + point1[1] * point2[1] + point1[2] * point2[2];
    }
    function multiply(matrixA, matrixB) {
        let result = new Array(16).fill(0);
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                for (let k = 0; k < 4; k++) {
                    // Utiliser l'indexation linéaire pour accéder aux éléments
                    // Pour une matrice 4x4, l'index est (row * 4 + col)
                    result[j * 4 + i] += matrixA[k * 4 + i] * matrixB[j * 4 + k];
                }
            }
        }
        return result;
    }
    function inverse(matrix) {
        // Create augmented matrix [matrix | identity]
        let augmented = [
            ...matrix.slice(0, 4),
            1, 0, 0, 0,
            ...matrix.slice(4, 8),
            0, 1, 0, 0,
            ...matrix.slice(8, 12),
            0, 0, 1, 0,
            ...matrix.slice(12, 16),
            0, 0, 0, 1
        ];
        // Gaussian elimination with partial pivoting
        for (let col = 0; col < 4; col++) {
            // Find pivot row with maximum absolute value
            let maxRow = col;
            let maxVal = Math.abs(augmented[col * 4 + col]);
            for (let row = col + 1; row < 4; row++) {
                let val = Math.abs(augmented[row * 4 + col]);
                if (val > maxVal) {
                    maxVal = val;
                    maxRow = row;
                }
            }
            // Check for singularity
            if (maxVal < 1e-5) {
                return null;
            }
            // Swap rows if necessary
            if (maxRow !== col) {
                [augmented[col], augmented[maxRow]] = [augmented[maxRow], augmented[col]];
            }
            // Scale pivot row to make pivot element 1
            let pivot = augmented[col * 4 + col];
            for (let j = 0; j < 8; j++) {
                augmented[col * 4 + j] /= pivot;
            }
            // Eliminate column in other rows
            for (let row = 0; row < 4; row++) {
                if (row !== col) {
                    let factor = augmented[row * 4 + col];
                    for (let j = 0; j < 8; j++) {
                        augmented[row * 4 + j] -= factor * augmented[col * 4 + j];
                    }
                }
            }
        }
        // Extract the inverse from the right side of the augmented matrix
        return augmented.slice(0, 16);
    }
    function round(number) {
        const rounded = Math.round(number);
        return Math.abs(rounded - number) <= epsilon ? rounded : +number.toPrecision(6);
    }
    // translate3d(25.9808px, 0, 15px ) rotateY(60deg) skewX(49.9999deg) scale(1, 1.2)
    // translate → rotate → skew → scale
    function decompose(original) {
        const matrix = original.slice();
        // Normalize last row
        if (matrix[15] === 0) {
            return null;
        }
        for (let i = 0; i < 16; i++)
            matrix[i] /= matrix[15];
        // Perspective extraction
        const perspective = [0, 0, 0, 1];
        if (matrix[3] !== 0 || matrix[7] !== 0 || matrix[11] !== 0) {
            const rightHandSide = [matrix[3], matrix[7], matrix[11], matrix[15]];
            const perspectiveMatrix = matrix.slice();
            perspectiveMatrix[3] = 0;
            perspectiveMatrix[7] = 0;
            perspectiveMatrix[11] = 0;
            perspectiveMatrix[15] = 1;
            // @ts-ignore
            const inverted = inverse(original.slice());
            if (inverted === null) {
                return null;
            }
            const transposedInverse = transposeMatrix4(inverted);
            perspective[0] = dot(rightHandSide, transposedInverse.slice(0, 4));
            perspective[1] = dot(rightHandSide, transposedInverse.slice(4, 8));
            perspective[2] = dot(rightHandSide, transposedInverse.slice(8, 12));
            perspective[3] = dot(rightHandSide, transposedInverse.slice(12, 16));
            // Clear perspective from matrix
            matrix[3] = 0;
            matrix[7] = 0;
            matrix[11] = 0;
            matrix[15] = 1;
        }
        // Translation
        const translate = [matrix[12], matrix[13], matrix[14]];
        matrix[12] = matrix[13] = matrix[14] = 0;
        // Build the 3x3 matrix
        const row0 = [matrix[0], matrix[1], matrix[2]];
        const row1 = [matrix[4], matrix[5], matrix[6]];
        const row2 = [matrix[8], matrix[9], matrix[10]];
        const cross = [
            row1[1] * row2[2] - row1[2] * row2[1],
            row1[2] * row2[0] - row1[0] * row2[2],
            row1[0] * row2[1] - row1[1] * row2[0],
        ];
        // Compute scale
        const scaleX = Math.hypot(...row0);
        const row0Norm = normalize(row0);
        const skewXY = dot(row0Norm, row1);
        const row1Proj = [
            row1[0] - skewXY * row0Norm[0],
            row1[1] - skewXY * row0Norm[1],
            row1[2] - skewXY * row0Norm[2]
        ];
        const scaleY = Math.hypot(...row1Proj);
        const row1Norm = normalize(row1Proj);
        const skewXZ = dot(row0Norm, row2);
        const skewYZ = dot(row1Norm, row2);
        const row2Proj = [
            row2[0] - skewXZ * row0Norm[0] - skewYZ * row1Norm[0],
            row2[1] - skewXZ * row0Norm[1] - skewYZ * row1Norm[1],
            row2[2] - skewXZ * row0Norm[2] - skewYZ * row1Norm[2]
        ];
        const row2Norm = normalize(row2Proj);
        const determinant = row0[0] * cross[0] + row0[1] * cross[1] + row0[2] * cross[2];
        const scaleZ = Math.hypot(...row2Proj) * (determinant < 0 ? -1 : 1);
        // Build rotation matrix from orthonormalized vectors
        const r00 = row0Norm[0], r01 = row1Norm[0], r02 = row2Norm[0];
        const r10 = row0Norm[1], r11 = row1Norm[1], r12 = row2Norm[1];
        const r20 = row0Norm[2], r21 = row1Norm[2], r22 = row2Norm[2];
        // Convert to quaternion
        const trace = r00 + r11 + r22;
        let qw, qx, qy, qz;
        if (trace > 0) {
            const s = 0.5 / Math.sqrt(trace + 1.0);
            qw = 0.25 / s;
            qx = (r21 - r12) * s;
            qy = (r02 - r20) * s;
            qz = (r10 - r01) * s;
        }
        else if (r00 > r11 && r00 > r22) {
            const s = 2.0 * Math.sqrt(1.0 + r00 - r11 - r22);
            qw = (r21 - r12) / s;
            qx = 0.25 * s;
            qy = (r01 + r10) / s;
            qz = (r02 + r20) / s;
        }
        else if (r11 > r22) {
            const s = 2.0 * Math.sqrt(1.0 + r11 - r00 - r22);
            qw = (r02 - r20) / s;
            qx = (r01 + r10) / s;
            qy = 0.25 * s;
            qz = (r12 + r21) / s;
        }
        else {
            const s = 2.0 * Math.sqrt(1.0 + r22 - r00 - r11);
            qw = (r10 - r01) / s;
            qx = (r02 + r20) / s;
            qy = (r12 + r21) / s;
            qz = 0.25 * s;
        }
        [qx, qy, qz] = toZero([qx, qy, qz]);
        let q = [Math.abs(qx), Math.abs(qy), Math.abs(qz)].reduce((acc, curr) => {
            if (acc == 0 || (curr > 0 && curr < acc)) {
                acc = curr;
            }
            return acc;
        }, 0);
        if (q > 0) {
            qx /= q;
            qy /= q;
            qz /= q;
        }
        const rotate = [qx, qy, qz, Object.is(qw, 0) ? 0 : 2 * Math.acos(qw) * 180 / Math.PI];
        const scale = [scaleX, scaleY, scaleZ];
        const skew = [skewXY, skewXZ, skewYZ];
        return {
            translate,
            scale,
            rotate,
            skew,
            perspective
        };
    }
    function transposeMatrix4(m) {
        return [
            m[0], m[4], m[8], m[12],
            m[1], m[5], m[9], m[13],
            m[2], m[6], m[10], m[14],
            m[3], m[7], m[11], m[15],
        ];
    }
    function toZero(v) {
        for (let i = 0; i < v.length; i++) {
            if (Math.abs(v[i]) <= epsilon) {
                v[i] = 0;
            }
            else {
                v[i] = +v[i].toPrecision(6);
            }
        }
        return v;
    }
    // https://drafts.csswg.org/css-transforms-1/#2d-matrix
    function is2DMatrix(matrix) {
        // m13,m14,  m23, m24, m31, m32, m34, m43 are all 0
        return matrix[2] === 0 &&
            matrix[3] === 0 &&
            matrix[6] === 0 &&
            matrix[7] === 0 &&
            matrix[8] === 0 &&
            matrix[9] === 0 &&
            matrix[11] === 0 &&
            matrix[14] === 0 &&
            matrix[10] === 1 &&
            matrix[15] === 1;
    }

    /**
     * Converts a color to another color space
     * @param token
     * @param to
     *
     * @private
     *
     * <code>
     *
     *     const token = {typ: EnumToken.ColorTokenType, kin: ColorType.HEX, val: '#F00'}
     *     const result = convertColor(token, ColorType.LCH);
     *
     * </code>
     */
    function convertColor(token, to) {
        if (token.kin == exports.ColorType.SYS ||
            token.kin == exports.ColorType.DPSYS ||
            (isIdentColor(token) &&
                'currentcolor' == token.val.toLowerCase())) {
            return token;
        }
        if (token.kin == exports.ColorType.COLOR_MIX && to != exports.ColorType.COLOR_MIX) {
            const children = token.chi.reduce((acc, t) => {
                if (t.typ == exports.EnumToken.ColorTokenType) {
                    acc.push([t]);
                }
                else {
                    if (![exports.EnumToken.WhitespaceTokenType, exports.EnumToken.CommentTokenType, exports.EnumToken.CommaTokenType].includes(t.typ)) {
                        acc[acc.length - 1].push(t);
                    }
                }
                return acc;
            }, [[]]);
            token = colorMix(children[0][1], children[0][2], children[1][0], children[1][1], children[2][0], children[2][1]);
            if (token == null) {
                return null;
            }
        }
        if (token.cal == 'rel' && ['rgb', 'hsl', 'hwb', 'lab', 'lch', 'oklab', 'oklch', 'color'].includes(token.val.toLowerCase())) {
            const chi = getComponents(token);
            const offset = token.val == 'color' ? 2 : 1;
            if (chi != null) {
                // @ts-ignore
                const color = chi[1];
                const components = parseRelativeColor(token.val.toLowerCase() == 'color' ? chi[offset].val : token.val, color, chi[offset + 1], chi[offset + 2], chi[offset + 3], chi[offset + 4]);
                if (components != null) {
                    token = {
                        ...token,
                        chi: [...(token.val == 'color' ? [chi[offset]] : []), ...Object.values(components)],
                        kin: exports.ColorType[token.val.toUpperCase().replaceAll('-', '_')]
                    };
                    delete token.cal;
                }
            }
        }
        if (token.kin == to) {
            if (token.kin == exports.ColorType.HEX || token.kin == exports.ColorType.LIT) {
                token.val = reduceHexValue(token.val);
                token.kin = token.val[0] == '#' ? exports.ColorType.HEX : exports.ColorType.LIT;
            }
            return token;
        }
        if (token.kin == exports.ColorType.COLOR) {
            const colorSpace = token.chi.find(t => ![exports.EnumToken.WhitespaceTokenType, exports.EnumToken.CommentTokenType].includes(t.typ));
            if (colorSpace.val == exports.ColorType[to].toLowerCase().replaceAll('_', '-')) {
                for (const chi of token.chi) {
                    if (chi.typ == exports.EnumToken.NumberTokenType && typeof chi.val == 'number') {
                        chi.val = toPrecisionValue(getNumber(chi));
                    }
                }
                return token;
            }
        }
        if (to == exports.ColorType.HSL) {
            switch (token.kin) {
                case exports.ColorType.RGB:
                case exports.ColorType.RGBA:
                    return rgb2HslToken(token);
                case exports.ColorType.HEX:
                case exports.ColorType.LIT:
                    return hex2HslToken(token);
                case exports.ColorType.HWB:
                    return hwb2HslToken(token);
                case exports.ColorType.DEVICE_CMYK:
                    return cmyk2HslToken(token);
                case exports.ColorType.OKLAB:
                    return oklab2HslToken(token);
                case exports.ColorType.OKLCH:
                    return oklch2HslToken(token);
                case exports.ColorType.LAB:
                    return lab2HslToken(token);
                case exports.ColorType.LCH:
                    return lch2HslToken(token);
                case exports.ColorType.COLOR:
                    return color2HslToken(token);
            }
        }
        else if (to == exports.ColorType.HWB) {
            switch (token.kin) {
                case exports.ColorType.RGB:
                case exports.ColorType.RGBA:
                    return rgb2hwbToken(token);
                case exports.ColorType.HEX:
                case exports.ColorType.LIT:
                    return rgb2hwbToken(token);
                case exports.ColorType.HSL:
                case exports.ColorType.HSLA:
                    return hsl2hwbToken(token);
                case exports.ColorType.OKLAB:
                    return oklab2hwbToken(token);
                case exports.ColorType.OKLCH:
                    return oklch2hwbToken(token);
                case exports.ColorType.LAB:
                    return lab2hwbToken(token);
                case exports.ColorType.LCH:
                    return lch2hwbToken(token);
                case exports.ColorType.DEVICE_CMYK:
                    return cmyk2hwbToken(token);
                case exports.ColorType.COLOR:
                    return color2hwbToken(token);
            }
        }
        else if (to == exports.ColorType.DEVICE_CMYK) {
            switch (token.kin) {
                case exports.ColorType.RGB:
                case exports.ColorType.RGBA:
                    return rgb2cmykToken(token);
                case exports.ColorType.HEX:
                case exports.ColorType.LIT:
                    return rgb2cmykToken(token);
                case exports.ColorType.HSL:
                case exports.ColorType.HSLA:
                    return hsl2cmykToken(token);
                case exports.ColorType.HWB:
                    return hwb2cmykToken(token);
                case exports.ColorType.OKLAB:
                    return oklab2cmyk(token);
                case exports.ColorType.OKLCH:
                    return oklch2cmykToken(token);
                case exports.ColorType.LAB:
                    return lab2cmykToken(token);
                //
                case exports.ColorType.LCH:
                    return lch2cmykToken(token);
                case exports.ColorType.COLOR:
                    return color2cmykToken(token);
            }
        }
        else if (to == exports.ColorType.HEX || to == exports.ColorType.LIT) {
            switch (token.kin) {
                case exports.ColorType.HEX:
                case exports.ColorType.LIT: {
                    const val = reduceHexValue(token.val);
                    return {
                        typ: exports.EnumToken.ColorTokenType,
                        val,
                        kin: val[0] == '#' ? exports.ColorType.HEX : exports.ColorType.LIT
                    };
                }
                case exports.ColorType.HSL:
                    return hsl2HexToken(token);
                case exports.ColorType.HWB:
                    return hwb2HexToken(token);
                case exports.ColorType.DEVICE_CMYK:
                    return cmyk2HexToken(token);
                case exports.ColorType.OKLAB:
                    return oklab2HexToken(token);
                case exports.ColorType.OKLCH:
                    return oklch2HexToken(token);
                case exports.ColorType.LAB:
                    return lab2HexToken(token);
                case exports.ColorType.LCH:
                    return lch2HexToken(token);
                case exports.ColorType.COLOR:
                    return color2HexToken(token);
                case exports.ColorType.RGB:
                case exports.ColorType.RGBA:
                    return rgb2HexToken(token);
            }
        }
        else if (to == exports.ColorType.RGB) {
            switch (token.kin) {
                case exports.ColorType.HEX:
                case exports.ColorType.LIT:
                    return hex2RgbToken(token);
                case exports.ColorType.HSL:
                    return hsl2RgbToken(token);
                case exports.ColorType.HWB:
                    return hwb2RgbToken(token);
                case exports.ColorType.DEVICE_CMYK:
                    return cmyk2RgbToken(token);
                case exports.ColorType.OKLAB:
                    return oklab2RgbToken(token);
                case exports.ColorType.OKLCH:
                    return oklch2RgbToken(token);
                case exports.ColorType.LAB:
                    return lab2RgbToken(token);
                case exports.ColorType.LCH:
                    return lch2RgbToken(token);
                case exports.ColorType.COLOR:
                    return color2RgbToken(token);
            }
        }
        else if (to == exports.ColorType.LAB) {
            switch (token.kin) {
                case exports.ColorType.HEX:
                case exports.ColorType.LIT:
                    return hex2labToken(token);
                case exports.ColorType.RGB:
                case exports.ColorType.RGBA:
                    return rgb2labToken(token);
                case exports.ColorType.HSL:
                case exports.ColorType.HSLA:
                    return hsl2labToken(token);
                case exports.ColorType.HWB:
                    return hwb2labToken(token);
                case exports.ColorType.DEVICE_CMYK:
                    return cmyk2labToken(token);
                case exports.ColorType.LCH:
                    return lch2labToken(token);
                case exports.ColorType.OKLAB:
                    return oklab2labToken(token);
                case exports.ColorType.OKLCH:
                    return oklch2labToken(token);
                case exports.ColorType.COLOR:
                    return color2labToken(token);
            }
        }
        else if (to == exports.ColorType.LCH) {
            switch (token.kin) {
                case exports.ColorType.HEX:
                case exports.ColorType.LIT:
                    return hex2lchToken(token);
                case exports.ColorType.RGB:
                case exports.ColorType.RGBA:
                    return rgb2lchToken(token);
                case exports.ColorType.HSL:
                case exports.ColorType.HSLA:
                    return hsl2lchToken(token);
                case exports.ColorType.HWB:
                    return hwb2lchToken(token);
                case exports.ColorType.DEVICE_CMYK:
                    return cmyk2lchToken(token);
                case exports.ColorType.LAB:
                    return lab2lchToken(token);
                case exports.ColorType.OKLAB:
                    return oklab2lchToken(token);
                case exports.ColorType.OKLCH:
                    return oklch2lchToken(token);
                case exports.ColorType.COLOR:
                    return color2lchToken(token);
            }
        }
        else if (to == exports.ColorType.OKLAB) {
            switch (token.kin) {
                case exports.ColorType.HEX:
                case exports.ColorType.LIT:
                    return hex2oklabToken(token);
                case exports.ColorType.RGB:
                case exports.ColorType.RGBA:
                    return rgb2oklabToken(token);
                case exports.ColorType.HSL:
                case exports.ColorType.HSLA:
                    return hsl2oklabToken(token);
                case exports.ColorType.HWB:
                    return hwb2oklabToken(token);
                case exports.ColorType.DEVICE_CMYK:
                    return cmyk2oklabToken(token);
                case exports.ColorType.LAB:
                    return lab2oklabToken(token);
                case exports.ColorType.LCH:
                    return lch2oklabToken(token);
                case exports.ColorType.OKLCH:
                    return oklch2oklabToken(token);
                case exports.ColorType.COLOR:
                    return color2oklabToken(token);
            }
        }
        else if (to == exports.ColorType.OKLCH) {
            switch (token.kin) {
                case exports.ColorType.HEX:
                case exports.ColorType.LIT:
                    return hex2oklchToken(token);
                case exports.ColorType.RGB:
                case exports.ColorType.RGBA:
                    return rgb2oklchToken(token);
                case exports.ColorType.HSL:
                case exports.ColorType.HSLA:
                    return hsl2oklchToken(token);
                case exports.ColorType.HWB:
                    return hwb2oklchToken(token);
                case exports.ColorType.DEVICE_CMYK:
                    return cmyk2oklchToken(token);
                case exports.ColorType.LAB:
                    return lab2oklchToken(token);
                case exports.ColorType.OKLAB:
                    return oklab2oklchToken(token);
                case exports.ColorType.LCH:
                    return lch2oklchToken(token);
                case exports.ColorType.COLOR:
                    return color2oklchToken(token);
            }
        }
        else if (colorFuncColorSpace.includes(exports.ColorType[to].toLowerCase().replaceAll('_', '-').toLowerCase().replaceAll('_', '-'))) {
            switch (token.kin) {
                case exports.ColorType.HEX:
                case exports.ColorType.LIT:
                    return hex2colorToken(token, to);
                case exports.ColorType.RGB:
                case exports.ColorType.RGBA:
                    return rgb2colorToken(token, to);
                case exports.ColorType.HSL:
                case exports.ColorType.HSLA:
                    return hsl2colorToken(token, to);
                case exports.ColorType.HWB:
                    return hwb2colorToken(token, to);
                case exports.ColorType.DEVICE_CMYK:
                    return cmyk2colorToken(token, to);
                case exports.ColorType.LAB:
                    return lab2colorToken(token, to);
                case exports.ColorType.OKLAB:
                    return oklab2colorToken(token, to);
                case exports.ColorType.LCH:
                    return lch2colorToken(token, to);
                case exports.ColorType.OKLCH:
                    return oklch2colorToken(token, to);
                case exports.ColorType.COLOR:
                    return color2colorToken(token, to);
            }
        }
        return null;
    }
    function hex2colorToken(token, to) {
        const values = hex2srgbvalues(token);
        if (values == null) {
            return null;
        }
        return values2colortoken(values, to);
    }
    function rgb2colorToken(token, to) {
        const values = rgb2srgb(token);
        if (values == null) {
            return null;
        }
        return values2colortoken(values, to);
    }
    function hsl2colorToken(token, to) {
        const values = hsl2srgb(token);
        if (values == null) {
            return null;
        }
        return values2colortoken(values, to);
    }
    function hwb2colorToken(token, to) {
        const values = hwb2srgbvalues(token);
        if (values == null) {
            return null;
        }
        return values2colortoken(values, to);
    }
    function cmyk2colorToken(token, to) {
        const values = cmyk2rgbvalues(token);
        if (values == null) {
            return null;
        }
        return values2colortoken(values, to);
    }
    function lab2colorToken(token, to) {
        const values = lab2srgbvalues(token);
        if (values == null) {
            return null;
        }
        return values2colortoken(values, to);
    }
    function oklab2colorToken(token, to) {
        const values = oklab2srgbvalues(token);
        if (values == null) {
            return null;
        }
        return values2colortoken(values, to);
    }
    function lch2colorToken(token, to) {
        const values = lch2srgbvalues(token);
        if (values == null) {
            return null;
        }
        return values2colortoken(values, to);
    }
    function oklch2colorToken(token, to) {
        const values = oklch2srgbvalues(token);
        if (values == null) {
            return null;
        }
        return values2colortoken(values, to);
    }
    function color2colorToken(token, to) {
        const values = color2srgbvalues(token);
        if (values == null) {
            return null;
        }
        return values2colortoken(values, to);
    }
    function srgb2srgbcolorspace(val, to) {
        const values = [];
        switch (to) {
            case exports.ColorType.SRGB:
                values.push(...val);
                break;
            case exports.ColorType.SRGB_LINEAR:
                // @ts-ignore
                values.push(...srgb2lsrgbvalues(...val));
                break;
            case exports.ColorType.DISPLAY_P3:
                // @ts-ignore
                values.push(...srgb2p3values(...val));
                break;
            case exports.ColorType.PROPHOTO_RGB:
                // @ts-ignore
                values.push(...srgb2prophotorgbvalues(...val));
                break;
            case exports.ColorType.A98_RGB:
                // @ts-ignore
                values.push(...srgb2a98values$1(...val));
                break;
            case exports.ColorType.REC2020:
                // @ts-ignore
                values.push(...srgb2rec2020values(...val));
                break;
            case exports.ColorType.XYZ:
            case exports.ColorType.XYZ_D65:
                // @ts-ignore
                values.push(...srgb2xyz(...val));
                break;
            case exports.ColorType.XYZ_D50:
                // @ts-ignore
                values.push(...srgb2xyz_d50(...val));
                break;
        }
        return values;
    }
    function minmax(value, min, max) {
        if (value < min) {
            return min;
        }
        if (value > max) {
            return max;
        }
        return value;
    }
    function color2srgbvalues(token) {
        const components = getComponents(token);
        if (components == null) {
            return null;
        }
        const colorSpace = components.shift();
        let values = components.map((val) => getNumber(val));
        switch (colorSpace.val.toLowerCase()) {
            case 'display-p3':
                // @ts-ignore
                values = p32srgbvalues(...values);
                break;
            case 'srgb-linear':
                // @ts-ignore
                values = lsrgb2srgbvalues(...values);
                break;
            case 'prophoto-rgb':
                // @ts-ignore
                values = prophotorgb2srgbvalues(...values);
                break;
            case 'a98-rgb':
                // @ts-ignore
                values = a98rgb2srgbvalues(...values);
                break;
            case 'rec2020':
                // @ts-ignore
                values = rec20202srgb(...values);
                break;
            case 'xyz':
            case 'xyz-d65':
                // @ts-ignore
                values = xyz2srgb(...values);
                break;
            case 'xyz-d50':
                // @ts-ignore
                values = xyzd502srgb(...values);
                break;
            // case srgb:
        }
        return values;
    }
    function values2colortoken(values, to) {
        values = srgb2srgbcolorspace(values, to);
        const chi = [
            { typ: exports.EnumToken.NumberTokenType, val: toPrecisionValue(values[0]) },
            { typ: exports.EnumToken.NumberTokenType, val: toPrecisionValue(values[1]) },
            { typ: exports.EnumToken.NumberTokenType, val: toPrecisionValue(values[2]) },
        ];
        if (values.length == 4) {
            chi.push({ typ: exports.EnumToken.LiteralTokenType, val: "/" }, {
                typ: exports.EnumToken.PercentageTokenType,
                val: values[3] * 100
            });
        }
        const colorSpace = exports.ColorType[to].toLowerCase().replaceAll('_', '-');
        return colorFuncColorSpace.includes(colorSpace) ? {
            typ: exports.EnumToken.ColorTokenType,
            val: 'color',
            chi: [{ typ: exports.EnumToken.IdenTokenType, val: colorSpace }].concat(chi),
            kin: exports.ColorType.COLOR
        } : {
            typ: exports.EnumToken.ColorTokenType,
            val: colorSpace,
            chi,
            kin: to
        };
    }
    function getNumber(token) {
        if (token.typ == exports.EnumToken.IdenTokenType && token.val == 'none') {
            return 0;
        }
        let val;
        // @ts-ignore
        if (typeof token.val != 'number' && token.val?.typ == exports.EnumToken.FractionTokenType) {
            // @ts-ignore
            val = token.val.l.val / token.val.r.val;
        }
        else {
            val = token.val;
        }
        // @ts-ignore
        return token.typ == exports.EnumToken.PercentageTokenType ? val / 100 : val;
    }
    /**
     * convert angle to turn
     * @param token
     */
    function getAngle(token) {
        if (token.typ == exports.EnumToken.IdenTokenType) {
            if (token.val == 'none') {
                return 0;
            }
        }
        if (token.typ == exports.EnumToken.AngleTokenType) {
            switch (token.unit) {
                case 'deg':
                    // @ts-ignore
                    return token.val / 360;
                case 'rad':
                    // @ts-ignore
                    return token.val / (2 * Math.PI);
                case 'grad':
                    // @ts-ignore
                    return token.val / 400;
                case 'turn':
                    // @ts-ignore
                    return +token.val;
            }
        }
        // @ts-ignore
        return token.val / 360;
    }
    function toPrecisionValue(value) {
        value = +value.toFixed(colorPrecision);
        return Math.abs(value) < epsilon ? 0 : value;
    }
    function toPrecisionAngle(angle) {
        angle = +angle.toPrecision(colorPrecision);
        if (Math.abs(angle) >= 360) {
            angle %= 360;
        }
        if (Math.abs(angle) < anglePrecision) {
            angle = 0;
        }
        if (angle < 0) {
            angle += 360;
        }
        return angle;
    }

    // https://www.w3.org/TR/CSS21/syndata.html#syntax
    // https://www.w3.org/TR/2021/CRD-css-syntax-3-20211224/#typedef-ident-token
    // '\\'
    const REVERSE_SOLIDUS = 0x5c;
    const dimensionUnits = new Set([
        'q', 'cap', 'ch', 'cm', 'cqb', 'cqh', 'cqi', 'cqmax', 'cqmin', 'cqw', 'dvb',
        'dvh', 'dvi', 'dvmax', 'dvmin', 'dvw', 'em', 'ex', 'ic', 'in', 'lh', 'lvb',
        'lvh', 'lvi', 'lvmax', 'lvw', 'mm', 'pc', 'pt', 'px', 'rem', 'rlh', 'svb',
        'svh', 'svi', 'svmin', 'svw', 'vb', 'vh', 'vi', 'vmax', 'vmin', 'vw'
    ]);
    const fontFormat = ['collection', 'embedded-opentype', 'opentype', 'svg', 'truetype', 'woff', 'woff2'];
    const colorFontTech = ['color-colrv0', 'color-colrv1', 'color-svg', 'color-sbix', 'color-cbdt'];
    const fontFeaturesTech = ['features-opentype', 'features-aat', 'features-graphite', 'incremental-patch', 'incremental-range', 'incremental-auto', 'variations', 'palettes'];
    /**
     * supported transform functions
     *
     * @internal
     */
    const transformFunctions = [
        'translate', 'scale', 'rotate', 'skew', 'perspective',
        'translateX', 'translateY', 'translateZ',
        'scaleX', 'scaleY', 'scaleZ',
        'rotateX', 'rotateY', 'rotateZ',
        'skewX', 'skewY',
        'rotate3d', 'translate3d', 'scale3d', 'matrix', 'matrix3d'
    ];
    // https://drafts.csswg.org/mediaqueries/#media-types
    const mediaTypes = ['all', 'print', 'screen',
        /* deprecated */
        'aural', 'braille', 'embossed', 'handheld', 'projection', 'tty', 'tv', 'speech'];
    // https://www.w3.org/TR/css-values-4/#math-function
    /**
     * supported math functions
     *
     * @internal
     */
    const mathFuncs = ['minmax', 'repeat', 'fit-content', 'calc', 'clamp', 'min', 'max', 'round', 'mod', 'rem', 'sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'atan2', 'pow', 'sqrt', 'hypot', 'log', 'exp', 'abs', 'sign'];
    const wildCardFuncs = ['var', 'env'];
    const pseudoElements = [':before', ':after', ':first-line', ':first-letter'];
    // https://developer.mozilla.org/en-US/docs/Web/CSS/WebKit_Extensions
    // https://developer.mozilla.org/en-US/docs/Web/CSS/Mozilla_Extensions
    const pseudoAliasMap = {
        '-moz-center': 'center',
        '-webkit-center': 'center',
        '-ms-grid-columns': 'grid-template-columns',
        '-ms-grid-rows': 'grid-template-rows',
        '-ms-grid-row': 'grid-row-start',
        '-ms-grid-column': 'grid-column-start',
        '-ms-grid-row-align': 'align-self',
        '-ms-grid-row-span': 'grid-row-end',
        '-ms-grid-column-span': 'grid-column-end',
        '-ms-grid-column-align': 'justify-self',
        ':-ms-input-placeholder': '::placeholder',
        '::-ms-input-placeholder': '::placeholder',
        ':-moz-any()': ':is',
        '-moz-user-modify': 'user-modify',
        '-webkit-match-parent': 'match-parent',
        '-moz-background-clip': 'background-clip',
        '-moz-background-origin': 'background-origin',
        '-ms-input-placeholder': 'placeholder',
        ':-webkit-autofill': ':autofill',
        ':-webkit-any()': ':is',
        '::-webkit-input-placeholder': '::placeholder',
        '::-webkit-file-upload-button': '::file-selector-button',
        '::-moz-placeholder': '::placeholder',
        ':-webkit-any-link': ':any-link',
        '-webkit-border-after': 'border-block-end',
        '-webkit-border-after-color': 'border-block-end-color',
        '-webkit-border-after-style': 'border-block-end-style',
        '-webkit-border-after-width': 'border-block-end-width',
        '-webkit-border-before': 'border-block-start',
        '-webkit-border-before-color': 'border-block-start-color',
        '-webkit-border-before-style': 'border-block-start-style',
        '-webkit-border-before-width': 'border-block-start-width',
        '-webkit-border-end': 'border-inline-end',
        '-webkit-border-end-color': 'border-inline-end-color',
        '-webkit-border-end-style': 'border-inline-end-style',
        '-webkit-border-end-width': 'border-inline-end-width',
        '-webkit-border-start': 'border-inline-start',
        '-webkit-border-start-color': 'border-inline-start-color',
        '-webkit-border-start-style': 'border-inline-start-style',
        '-webkit-border-start-width': 'border-inline-start-width',
        '-webkit-box-align': 'align-items',
        '-webkit-box-direction': 'flex-direction',
        '-webkit-box-flex': 'flex-grow',
        '-webkit-box-lines': 'flex-flow',
        '-webkit-box-ordinal-group': 'order',
        '-webkit-box-orient': 'flex-direction',
        '-webkit-box-pack': 'justify-content',
        '-webkit-column-break-after': 'break-after',
        '-webkit-column-break-before': 'break-before',
        '-webkit-column-break-inside': 'break-inside',
        '-webkit-font-feature-settings': 'font-feature-settings',
        '-webkit-hyphenate-character': 'hyphenate-character',
        '-webkit-initial-letter': 'initial-letter',
        '-webkit-margin-end': 'margin-block-end',
        '-webkit-margin-start': 'margin-block-start',
        '-webkit-padding-after': 'padding-block-end',
        '-webkit-padding-before': 'padding-block-start',
        '-webkit-padding-end': 'padding-inline-end',
        '-webkit-padding-start': 'padding-inline-start',
        '-webkit-min-device-pixel-ratio': 'min-resolution',
        '-webkit-max-device-pixel-ratio': 'max-resolution',
        '-webkit-font-smoothing': 'font-smooth',
        '-webkit-line-clamp': 'line-clamp',
        ':-webkit-autofill-strong-password': ':autofill',
        ':-webkit-full-page-media': ':fullscreen',
        ':-webkit-full-screen': ':fullscreen',
        ':-webkit-full-screen-ancestor': ':fullscreen',
        ':-webkit-full-screen-document': ':fullscreen',
        ':-webkit-full-screen-controls-hidden': ':fullscreen',
        '-moz-background-inline-policy': 'box-decoration-break',
        '-moz-background-size': 'background-size',
        '-moz-border-end': 'border-inline-end',
        '-moz-border-end-color': 'border-inline-end-color',
        '-moz-border-end-style': 'border-inline-end-style',
        '-moz-border-end-width': 'border-inline-end-width',
        '-moz-border-image': 'border-inline-end-width',
        '-moz-border-start': 'border-inline-start',
        '-moz-border-start-color': 'border-inline-start-color',
        '-moz-border-start-style': 'border-inline-start-style',
        '-moz-border-start-width': 'border-inline-start-width',
        '-moz-column-count': 'column-count',
        '-moz-column-fill': 'column-fill',
        '-moz-column-gap': 'column-gap',
        '-moz-column-width': 'column-width',
        '-moz-column-rule': 'column-rule',
        '-moz-column-rule-width': 'column-rule-width',
        '-moz-column-rule-style': 'column-rule-style',
        '-moz-column-rule-color': 'column-rule-color',
        '-moz-margin-end': 'margin-inline-end',
        '-moz-margin-start': 'margin-inline-start',
        '-moz-opacity': 'opacity',
        '-moz-outline': 'outline',
        '-moz-outline-color': 'outline-color',
        '-moz-outline-offset': 'outline-offset',
        '-moz-outline-style': 'outline-style',
        '-moz-outline-width': 'outline-width',
        '-moz-padding-end': 'padding-inline-end',
        '-moz-padding-start': 'padding-inline-start',
        '-moz-tab-size': 'tab-size',
        '-moz-text-align-last': 'text-align-last',
        '-moz-text-decoration-color': 'text-decoration-color',
        '-moz-text-decoration-line': 'text-decoration-line',
        '-moz-text-decoration-style': 'text-decoration-style',
        '-moz-transition': 'transition',
        '-moz-transition-delay': 'transition-delay',
        '-moz-transition-duration': 'transition-duration',
        '-moz-transition-property': 'transition-property',
        '-moz-transition-timing-function': 'transition-timing-function',
        '-moz-user-select': 'user-select',
        '-moz-initial': 'initial',
        '-moz-linear-gradient()': 'linear-gradient',
        '-moz-radial-gradient()': 'radial-gradient',
        '-moz-element()': 'element',
        '-moz-crisp-edges': 'crisp-edges',
        '-moz-calc()': 'calc',
        '-moz-min-content': 'min-content',
        '-moz-fit-content': 'fit-content',
        '-moz-max-content': 'max-content',
        '-moz-available': 'stretch',
        ':-moz-any-link': ':any-link',
        ':-moz-full-screen': ':fullscreen',
        ':-moz-full-screen-ancestor': ':fullscreen',
        ':-moz-placeholder': ':placeholder-shown',
        ':-moz-read-only': ':read-only',
        ':-moz-read-write': ':read-write',
        ':-moz-submit-invalid': ':invalid',
        ':-moz-ui-invalid': ':user-invalid',
        ':-moz-ui-valid': ':user-valid',
        '::-moz-selection': '::selection',
    };
    // https://developer.mozilla.org/en-US/docs/Web/CSS/WebKit_Extensions
    // https://developer.mozilla.org/en-US/docs/Web/CSS/::-webkit-scrollbar
    const webkitExtensions = new Set([
        '-webkit-app-region',
        '-webkit-border-horizontal-spacing',
        '-webkit-border-vertical-spacing',
        '-webkit-box-reflect',
        '-webkit-column-axis',
        '-webkit-column-progression',
        '-webkit-cursor-visibility',
        '-webkit-font-smoothing',
        '-webkit-hyphenate-limit-after',
        '-webkit-hyphenate-limit-before',
        '-webkit-hyphenate-limit-lines',
        '-webkit-line-align',
        '-webkit-line-box-contain',
        '-webkit-line-clamp',
        '-webkit-line-grid',
        '-webkit-line-snap',
        '-webkit-locale',
        '-webkit-logical-height',
        '-webkit-logical-width',
        '-webkit-margin-after',
        '-webkit-margin-before',
        '-webkit-mask-box-image-outset',
        '-webkit-mask-box-image-repeat',
        '-webkit-mask-box-image-slice',
        '-webkit-mask-box-image-source',
        '-webkit-mask-box-image-width',
        '-webkit-mask-box-image',
        '-webkit-mask-composite',
        '-webkit-mask-position-x',
        '-webkit-mask-position-y',
        '-webkit-mask-repeat-x',
        '-webkit-mask-repeat-y',
        '-webkit-mask-source-type',
        '-webkit-max-logical-height',
        '-webkit-max-logical-width',
        '-webkit-min-logical-height',
        '-webkit-min-logical-width',
        '-webkit-nbsp-mode',
        '-webkit-match-parent',
        '-webkit-perspective-origin-x',
        '-webkit-perspective-origin-y',
        '-webkit-rtl-ordering',
        '-webkit-tap-highlight-color',
        '-webkit-text-decoration-skip',
        '-webkit-text-decorations-in-effect',
        '-webkit-text-fill-color',
        '-webkit-text-security',
        '-webkit-text-stroke-color',
        '-webkit-text-stroke-width',
        '-webkit-text-stroke',
        '-webkit-text-zoom',
        '-webkit-touch-callout',
        '-webkit-transform-origin-x',
        '-webkit-transform-origin-y',
        '-webkit-transform-origin-z',
        '-webkit-user-drag',
        '-webkit-user-modify',
        '-webkit-border-after',
        '-webkit-border-after-color',
        '-webkit-border-after-style',
        '-webkit-border-after-width',
        '-webkit-border-before',
        '-webkit-border-before-color',
        '-webkit-border-before-style',
        '-webkit-border-before-width',
        '-webkit-border-end',
        '-webkit-border-end-color',
        '-webkit-border-end-style',
        '-webkit-border-end-width',
        '-webkit-border-start',
        '-webkit-border-start-color',
        '-webkit-border-start-style',
        '-webkit-border-start-width',
        '-webkit-box-align',
        '-webkit-box-direction',
        '-webkit-box-flex-group',
        '-webkit-box-flex',
        '-webkit-box-lines',
        '-webkit-box-ordinal-group',
        '-webkit-box-orient',
        '-webkit-box-pack',
        '-webkit-column-break-after',
        '-webkit-column-break-before',
        '-webkit-column-break-inside',
        '-webkit-font-feature-settings',
        '-webkit-hyphenate-character',
        '-webkit-initial-letter',
        '-webkit-margin-end',
        '-webkit-margin-start',
        '-webkit-padding-after',
        '-webkit-padding-before',
        '-webkit-padding-end',
        '-webkit-padding-start',
        '-webkit-fill-available',
        ':-webkit-animating-full-screen-transition',
        ':-webkit-any',
        ':-webkit-any-link',
        ':-webkit-autofill',
        ':-webkit-autofill-strong-password',
        ':-webkit-drag',
        ':-webkit-full-page-media',
        ':-webkit-full-screen*',
        ':-webkit-full-screen-ancestor',
        ':-webkit-full-screen-document',
        ':-webkit-full-screen-controls-hidden',
        '::-webkit-file-upload-button*',
        '::-webkit-inner-spin-button',
        '::-webkit-input-placeholder',
        '::-webkit-meter-bar',
        '::-webkit-meter-even-less-good-value',
        '::-webkit-meter-inner-element',
        '::-webkit-meter-optimum-value',
        '::-webkit-meter-suboptimum-value',
        '::-webkit-progress-bar',
        '::-webkit-progress-inner-element',
        '::-webkit-progress-value',
        '::-webkit-search-cancel-button',
        '::-webkit-search-results-button',
        '::-webkit-slider-runnable-track',
        '::-webkit-slider-thumb',
        '-webkit-animation',
        '-webkit-device-pixel-ratio',
        '-webkit-transform-2d',
        '-webkit-transform-3d',
        '-webkit-transition',
        '::-webkit-scrollbar',
        '::-webkit-scrollbar-button',
        '::-webkit-scrollbar',
        '::-webkit-scrollbar-thumb',
        '::-webkit-scrollbar-track',
        '::-webkit-scrollbar-track-piece',
        '::-webkit-scrollbar:vertical',
        '::-webkit-scrollbar-corner ',
        '::-webkit-resizer',
        ':vertical',
        ':horizontal',
    ]);
    // https://developer.mozilla.org/en-US/docs/Web/CSS/Mozilla_Extensions
    const mozExtensions = new Set([
        '-moz-box-align',
        '-moz-box-direction',
        '-moz-box-flex',
        '-moz-box-ordinal-group',
        '-moz-box-orient',
        '-moz-box-pack',
        '-moz-float-edge',
        '-moz-force-broken-image-icon',
        '-moz-image-region',
        '-moz-orient',
        '-moz-osx-font-smoothing',
        '-moz-user-focus',
        '-moz-user-input',
        '-moz-user-modify',
        '-moz-animation',
        '-moz-animation-delay',
        '-moz-animation-direction',
        '-moz-animation-duration',
        '-moz-animation-fill-mode',
        '-moz-animation-iteration-count',
        '-moz-animation-name',
        '-moz-animation-play-state',
        '-moz-animation-timing-function',
        '-moz-appearance',
        '-moz-backface-visibility',
        '-moz-background-clip',
        '-moz-background-origin',
        '-moz-background-inline-policy',
        '-moz-background-size',
        '-moz-border-end',
        '-moz-border-end-color',
        '-moz-border-end-style',
        '-moz-border-end-width',
        '-moz-border-image',
        '-moz-border-start',
        '-moz-border-start-color',
        '-moz-border-start-style',
        '-moz-border-start-width',
        '-moz-box-sizing',
        'clip-path',
        '-moz-column-count',
        '-moz-column-fill',
        '-moz-column-gap',
        '-moz-column-width',
        '-moz-column-rule',
        '-moz-column-rule-width',
        '-moz-column-rule-style',
        '-moz-column-rule-color',
        'filter',
        '-moz-font-feature-settings',
        '-moz-font-language-override',
        '-moz-hyphens',
        '-moz-margin-end',
        '-moz-margin-start',
        'mask',
        '-moz-opacity',
        '-moz-outline',
        '-moz-outline-color',
        '-moz-outline-offset',
        '-moz-outline-style',
        '-moz-outline-width',
        '-moz-padding-end',
        '-moz-padding-start',
        '-moz-perspective',
        '-moz-perspective-origin',
        'pointer-events',
        '-moz-tab-size',
        '-moz-text-align-last',
        '-moz-text-decoration-color',
        '-moz-text-decoration-line',
        '-moz-text-decoration-style',
        '-moz-text-size-adjust',
        '-moz-transform',
        '-moz-transform-origin',
        '-moz-transform-style',
        '-moz-transition',
        '-moz-transition-delay',
        '-moz-transition-duration',
        '-moz-transition-property',
        '-moz-transition-timing-function',
        '-moz-user-select',
        '-moz-initial',
        '-moz-appearance',
        '-moz-linear-gradient',
        '-moz-radial-gradient',
        '-moz-element',
        '-moz-image-rect',
        '::-moz-anonymous-block',
        '::-moz-anonymous-positioned-block',
        ':-moz-any',
        ':-moz-any-link',
        ':-moz-broken',
        '::-moz-canvas',
        '::-moz-color-swatch',
        '::-moz-cell-content',
        ':-moz-drag-over',
        ':-moz-first-node',
        '::-moz-focus-inner',
        '::-moz-focus-outer',
        ':-moz-full-screen',
        ':-moz-full-screen-ancestor',
        ':-moz-handler-blocked',
        ':-moz-handler-crashed',
        ':-moz-handler-disabled',
        '::-moz-inline-table',
        ':-moz-last-node',
        '::-moz-list-bullet',
        '::-moz-list-number',
        ':-moz-loading',
        ':-moz-locale-dir',
        ':-moz-locale-dir',
        ':-moz-lwtheme',
        ':-moz-lwtheme-brighttext',
        ':-moz-lwtheme-darktext',
        '::-moz-meter-bar',
        ':-moz-native-anonymous',
        ':-moz-only-whitespace',
        '::-moz-pagebreak',
        '::-moz-pagecontent',
        ':-moz-placeholder',
        '::-moz-placeholder',
        '::-moz-progress-bar',
        '::-moz-range-progress',
        '::-moz-range-thumb',
        '::-moz-range-track',
        ':-moz-read-only',
        ':-moz-read-write',
        '::-moz-scrolled-canvas',
        '::-moz-scrolled-content',
        '::-moz-selection',
        ':-moz-submit-invalid',
        ':-moz-suppressed',
        '::-moz-svg-foreign-content',
        '::-moz-table',
        '::-moz-table-cell',
        '::-moz-table-column',
        '::-moz-table-column-group',
        '::-moz-table-outer',
        '::-moz-table-row',
        '::-moz-table-row-group',
        ':-moz-ui-invalid',
        ':-moz-ui-valid',
        ':-moz-user-disabled',
        '::-moz-viewport',
        '::-moz-viewport-scroll',
        ':-moz-window-inactive',
        '-moz-device-pixel-ratio',
        '-moz-os-version',
        '-moz-touch-enabled',
        '-moz-windows-glass',
        '-moz-alt-content'
    ]);
    function isLength(dimension) {
        return 'unit' in dimension && dimensionUnits.has(dimension.unit.toLowerCase());
    }
    function isResolution(dimension) {
        return 'unit' in dimension && ['dpi', 'dpcm', 'dppx', 'x'].includes(dimension.unit.toLowerCase());
    }
    function isAngle(dimension) {
        return 'unit' in dimension && ['rad', 'turn', 'deg', 'grad'].includes(dimension.unit.toLowerCase());
    }
    function isTime(dimension) {
        return 'unit' in dimension && ['ms', 's'].includes(dimension.unit.toLowerCase());
    }
    function isFrequency(dimension) {
        return 'unit' in dimension && ['hz', 'khz'].includes(dimension.unit.toLowerCase());
    }
    function isColorspace(token) {
        if (token.typ != exports.EnumToken.IdenTokenType) {
            return false;
        }
        return ['srgb', 'srgb-linear', 'lab', 'oklab', 'lch', 'oklch', 'xyz', 'xyz-d50', 'xyz-d65', 'display-p3', 'a98-rgb', 'prophoto-rgb', 'rec2020', 'rgb', 'hsl', 'hwb'].includes(token.val.toLowerCase());
    }
    function isRectangularOrthogonalColorspace(token) {
        if (token.typ != exports.EnumToken.IdenTokenType) {
            return false;
        }
        return ['srgb', 'srgb-linear', 'display-p3', 'a98-rgb', 'prophoto-rgb', 'rec2020', 'lab', 'oklab', 'xyz', 'xyz-d50', 'xyz-d65'].includes(token.val.toLowerCase());
    }
    function isPolarColorspace(token) {
        if (token.typ != exports.EnumToken.IdenTokenType) {
            return false;
        }
        return ['hsl', 'hwb', 'lch', 'oklch'].includes(token.val);
    }
    function isHueInterpolationMethod(token) {
        if (!Array.isArray(token)) {
            return token.typ == exports.EnumToken.IdenTokenType && 'hue' === token.val?.toLowerCase?.();
        }
        if (token.length != 2 || token[0].typ != exports.EnumToken.IdenTokenType || token[1].typ != exports.EnumToken.IdenTokenType) {
            return false;
        }
        return ['shorter', 'longer', 'increasing', 'decreasing'].includes(token[0].val?.toLowerCase?.()) && 'hue' === token[1].val?.toLowerCase?.();
    }
    function isIdentColor(token) {
        return token.typ == exports.EnumToken.ColorTokenType && [exports.ColorType.SYS, exports.ColorType.DPSYS, exports.ColorType.LIT].includes(token.kin) && isIdent(token.val);
    }
    function isPercentageToken(token) {
        return token.typ == exports.EnumToken.PercentageTokenType || (token.typ == exports.EnumToken.NumberTokenType && token.val == 0);
    }
    function isColor(token) {
        if (token.typ == exports.EnumToken.ColorTokenType) {
            return true;
        }
        if (token.typ == exports.EnumToken.IdenTokenType) {
            // named color
            return token.val.toLowerCase() in COLORS_NAMES || 'currentcolor' === token.val.toLowerCase() || 'transparent' === token.val.toLowerCase();
        }
        let isLegacySyntax = false;
        if (token.typ == exports.EnumToken.FunctionTokenType) {
            if (!colorsFunc.includes(token.val.toLowerCase())) {
                return false;
            }
            if (token.chi.length > 0) {
                // @ts-ignore
                if (token.val == 'light-dark') {
                    // @ts-ignore
                    const children = token.chi.filter((t) => [exports.EnumToken.IdenTokenType, exports.EnumToken.NumberTokenType, exports.EnumToken.LiteralTokenType, exports.EnumToken.ColorTokenType, exports.EnumToken.FunctionTokenType, exports.EnumToken.PercentageTokenType].includes(t.typ));
                    if (children.length != 2) {
                        return false;
                    }
                    if (isColor(children[0]) && isColor(children[1])) {
                        return true;
                    }
                }
                // adding numbers and percentages is disallowed
                // https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/lch#defining_relative_color_output_channel_components
                // @ts-ignore
                for (const { value } of walkValues(token.chi, null, (node) => funcLike.includes(node.typ) ? exports.WalkerOptionEnum.IgnoreChildren : null)) {
                    if (funcLike.includes(value.typ)) {
                        for (const { value: val } of walkValues([buildExpression(value.chi)])) {
                            if (val.typ == exports.EnumToken.BinaryExpressionTokenType &&
                                (val.l.typ == exports.EnumToken.PercentageTokenType || val.r.typ == exports.EnumToken.PercentageTokenType) &&
                                ((val.r.typ == exports.EnumToken.PercentageTokenType && val.op == exports.EnumToken.Div) ||
                                    ((val.op == exports.EnumToken.Add || val.op == exports.EnumToken.Sub) &&
                                        val.l.typ != val.r.typ))) {
                                return false;
                            }
                        }
                    }
                }
                // @ts-ignore
                if (token.val == 'color') {
                    // @ts-ignore
                    const children = token.chi.filter((t) => [exports.EnumToken.IdenTokenType, exports.EnumToken.NumberTokenType, exports.EnumToken.LiteralTokenType, exports.EnumToken.ColorTokenType, exports.EnumToken.FunctionTokenType, exports.EnumToken.PercentageTokenType].includes(t.typ));
                    const isRelative = children[0].typ == exports.EnumToken.IdenTokenType && children[0].val == 'from';
                    if (children.length < 4 || children.length > 8) {
                        return false;
                    }
                    if (!isRelative && !isColorspace(children[0])) {
                        return false;
                    }
                    for (let i = 1; i < children.length - 2; i++) {
                        if (children[i].typ == exports.EnumToken.IdenTokenType) {
                            if (children[i].val != 'none' &&
                                !(isRelative && ['alpha', 'r', 'g', 'b', 'x', 'y', 'z'].includes(children[i].val) || isColorspace(children[i]))) {
                                return false;
                            }
                        }
                        if (children[i].typ == exports.EnumToken.FunctionTokenType) {
                            if ('var' == children[i].val.toLowerCase()) {
                                continue;
                            }
                            if (!mathFuncs.includes(children[i].val)) {
                                return false;
                            }
                        }
                    }
                    if (children.length == 4 || (isRelative && children.length == 6)) {
                        return true;
                    }
                    if (children.length == 8 || children.length == 6) {
                        const sep = children.at(-2);
                        const alpha = children.at(-1);
                        // @ts-ignore
                        if ((children.length > 6 || !isRelative) && sep.typ != exports.EnumToken.LiteralTokenType || sep.val != '/') {
                            return false;
                        }
                        if (alpha.typ == exports.EnumToken.IdenTokenType && alpha.val != 'none') {
                            return false;
                        }
                        else {
                            // @ts-ignore
                            if (alpha.typ == exports.EnumToken.PercentageTokenType) {
                                if (+alpha.val < 0 || +alpha.val > 100) {
                                    return false;
                                }
                            }
                            else if (alpha.typ == exports.EnumToken.NumberTokenType) {
                                if (+alpha.val < 0 || +alpha.val > 1) {
                                    return false;
                                }
                            }
                        }
                    }
                    return true;
                }
                // @ts-ignore
                else if (token.val == 'color-mix') {
                    // @ts-ignore
                    const children = token.chi.reduce((acc, t) => {
                        if (t.typ == exports.EnumToken.CommaTokenType) {
                            acc.push([]);
                        }
                        else {
                            if (![exports.EnumToken.WhitespaceTokenType, exports.EnumToken.CommentTokenType].includes(t.typ)) {
                                acc[acc.length - 1].push(t);
                            }
                        }
                        return acc;
                    }, [[]]);
                    if (children.length == 3) {
                        if (children[0].length > 4 ||
                            children[0][0].typ != exports.EnumToken.IdenTokenType ||
                            'in' !== children[0][0].val?.toLowerCase?.() ||
                            !isColorspace(children[0][1]) ||
                            (children[0].length >= 3 && !isHueInterpolationMethod(children[0].slice(2))) ||
                            children[1].length > 2 ||
                            !isColor(children[1][0]) ||
                            (children[1].length == 2 && !isPercentageToken(children[1][1])) ||
                            children[2].length > 2 ||
                            (children[2].length == 2 && !isPercentageToken(children[2][1])) ||
                            !isColor(children[2][0])) {
                            return false;
                        }
                        if (children[1].length == 2) {
                            if (!(children[1][1].typ == exports.EnumToken.PercentageTokenType || (children[1][1].typ == exports.EnumToken.NumberTokenType && children[1][1].val == 0))) {
                                return false;
                            }
                        }
                        if (children[2].length == 2) {
                            if (!(children[2][1].typ == exports.EnumToken.PercentageTokenType || (children[2][1].typ == exports.EnumToken.NumberTokenType && children[2][1].val == 0))) {
                                return false;
                            }
                        }
                        return true;
                    }
                    return false;
                }
                else {
                    const keywords = ['from', 'none'];
                    // @ts-ignore
                    if (['rgb', 'hsl', 'hwb', 'lab', 'lch', 'oklab', 'oklch'].includes(token.val)) {
                        // @ts-ignore
                        keywords.push('alpha', ...token.val.slice(-3).split(''));
                    }
                    // @ts-ignore
                    for (const v of token.chi) {
                        if (v.typ == exports.EnumToken.CommaTokenType) {
                            isLegacySyntax = true;
                        }
                        if (v.typ == exports.EnumToken.IdenTokenType) {
                            if (!(keywords.includes(v.val) || v.val.toLowerCase() in COLORS_NAMES)) {
                                return false;
                            }
                            if (keywords.includes(v.val)) {
                                if (isLegacySyntax) {
                                    return false;
                                }
                                // @ts-ignore
                                if (v.val == 'from' && ['rgba', 'hsla'].includes(token.val)) {
                                    return false;
                                }
                            }
                            continue;
                        }
                        if (v.typ == exports.EnumToken.FunctionTokenType && (mathFuncs.includes(v.val) || v.val == 'var' || colorsFunc.includes(v.val))) {
                            continue;
                        }
                        if (![exports.EnumToken.ColorTokenType, exports.EnumToken.IdenTokenType, exports.EnumToken.NumberTokenType, exports.EnumToken.AngleTokenType, exports.EnumToken.PercentageTokenType, exports.EnumToken.CommaTokenType, exports.EnumToken.WhitespaceTokenType, exports.EnumToken.LiteralTokenType].includes(v.typ)) {
                            return false;
                        }
                    }
                }
                return true;
            }
        }
        return false;
    }
    function parseColor(token) {
        // @ts-ignore
        token.typ = exports.EnumToken.ColorTokenType;
        // @ts-ignore
        token.kin = exports.ColorType[token.val.replaceAll('-', '_').toUpperCase()];
        // @ts-ignore
        if (token.chi[0].typ == exports.EnumToken.IdenTokenType) {
            // @ts-ignore
            if (token.chi[0].val == 'from') {
                // @ts-ignore
                token.cal = 'rel';
            }
            // @ts-ignore
            else if (token.val == 'color-mix' && token.chi[0].val == 'in') {
                // @ts-ignore
                token.cal = 'mix';
            }
            else { // @ts-ignore
                if (token.val == 'color') {
                    // @ts-ignore
                    token.cal = 'col';
                }
            }
        }
        return token;
    }
    function isLetter(codepoint) {
        // lowercase
        return (codepoint >= 0x61 && codepoint <= 0x7a) ||
            // uppercase
            (codepoint >= 0x41 && codepoint <= 0x5a);
    }
    function isNonAscii(codepoint) {
        return codepoint >= 0x80;
    }
    function isIdentStart(codepoint) {
        // _
        return codepoint == 0x5f || isLetter(codepoint) || isNonAscii(codepoint) || codepoint == REVERSE_SOLIDUS;
    }
    function isDigit(codepoint) {
        return codepoint >= 0x30 && codepoint <= 0x39;
    }
    function isIdentCodepoint(codepoint) {
        // -
        return codepoint == 0x2d || isDigit(codepoint) || isIdentStart(codepoint);
    }
    function isIdent(name) {
        const j = name.length - 1;
        let i = 0;
        let codepoint = name.charCodeAt(0);
        // -
        if (codepoint == 0x2d) {
            const nextCodepoint = name.charCodeAt(1);
            if (Number.isNaN(nextCodepoint)) {
                return false;
            }
            // -
            if (nextCodepoint == 0x2d) {
                return true;
            }
            if (nextCodepoint == REVERSE_SOLIDUS) {
                return name.length > 2 && !isNewLine(name.charCodeAt(2));
            }
            return true;
        }
        if (!isIdentStart(codepoint)) {
            return false;
        }
        if (codepoint == REVERSE_SOLIDUS) {
            codepoint = name.codePointAt(i + 1);
            if (!isIdentCodepoint(codepoint)) {
                return false;
            }
            i += String.fromCodePoint(codepoint).length;
            if (i < j) {
                codepoint = name.codePointAt(i);
                if (!isIdentCodepoint(codepoint)) {
                    return false;
                }
            }
        }
        while (i < j) {
            i += codepoint < 0x80 ? 1 : String.fromCodePoint(codepoint).length;
            codepoint = name.charCodeAt(i);
            if (codepoint == REVERSE_SOLIDUS) {
                i += codepoint < 0x80 ? 1 : String.fromCodePoint(codepoint).length;
                codepoint = name.charCodeAt(i);
                i += codepoint < 0x80 ? 1 : String.fromCodePoint(codepoint).length;
                continue;
            }
            if (!isIdentCodepoint(codepoint)) {
                return false;
            }
        }
        return true;
    }
    function isPseudo(name) {
        return name.charAt(0) == ':' &&
            ((name.endsWith('(') && isIdent(name.charAt(1) == ':' ? name.slice(2, -1) : name.slice(1, -1))) ||
                isIdent(name.charAt(1) == ':' ? name.slice(2) : name.slice(1)));
    }
    function isHash(name) {
        return name.charAt(0) == '#' && isIdent(name.charAt(1));
    }
    function isNumber(name) {
        if (name.length == 0) {
            return false;
        }
        let codepoint = name.charCodeAt(0);
        let i = 0;
        const j = name.length;
        if (j == 1 && !isDigit(codepoint)) {
            return false;
        }
        // '+' '-'
        if ([0x2b, 0x2d].includes(codepoint)) {
            i++;
        }
        // consume digits
        while (i < j) {
            codepoint = name.charCodeAt(i);
            if (isDigit(codepoint)) {
                i++;
                continue;
            }
            // '.' 'E' 'e'
            if (codepoint == 0x2e || codepoint == 0x45 || codepoint == 0x65) {
                break;
            }
            return false;
        }
        // '.'
        if (codepoint == 0x2e) {
            if (!isDigit(name.charCodeAt(++i))) {
                return false;
            }
        }
        while (i < j) {
            codepoint = name.charCodeAt(i);
            if (isDigit(codepoint)) {
                i++;
                continue;
            }
            // 'E' 'e'
            if (codepoint == 0x45 || codepoint == 0x65) {
                i++;
                break;
            }
            return false;
        }
        // 'E' 'e'
        if (codepoint == 0x45 || codepoint == 0x65) {
            if (i == j) {
                return false;
            }
            codepoint = name.charCodeAt(i + 1);
            // '+' '-'
            if ([0x2b, 0x2d].includes(codepoint)) {
                i++;
            }
            codepoint = name.charCodeAt(i + 1);
            if (!isDigit(codepoint)) {
                return false;
            }
        }
        while (++i < j) {
            codepoint = name.charCodeAt(i);
            if (!isDigit(codepoint)) {
                return false;
            }
        }
        return true;
    }
    // export function isDimension(name: string) {
    //
    //     let index: number = name.length;
    //
    //     while (index--) {
    //
    //         if (isLetter(<number>name.charCodeAt(index))) {
    //
    //             continue
    //         }
    //
    //         index++;
    //         break;
    //     }
    //
    //     const number: string = name.slice(0, index);
    //     return number.length > 0 && isIdentStart(name.charCodeAt(index)) && isNumber(number);
    // }
    function isPercentage(name) {
        return name.endsWith('%') && isNumber(name.slice(0, -1));
    }
    function isFlex(dimension) {
        return 'unit' in dimension && 'fr' == dimension.unit.toLowerCase();
    }
    function parseDimension(name) {
        let index = name.length;
        while (index--) {
            if (isLetter(name.charCodeAt(index))) {
                continue;
            }
            index++;
            break;
        }
        const dimension = {
            typ: exports.EnumToken.DimensionTokenType,
            val: +name.slice(0, index),
            unit: name.slice(index)
        };
        if (index < 0 || Number.isNaN(dimension.val)) {
            return null;
        }
        if (isAngle(dimension)) {
            // @ts-ignore
            dimension.typ = exports.EnumToken.AngleTokenType;
        }
        else if (isLength(dimension)) {
            // @ts-ignore
            dimension.typ = exports.EnumToken.LengthTokenType;
        }
        else if (isTime(dimension)) {
            // @ts-ignore
            dimension.typ = exports.EnumToken.TimeTokenType;
        }
        else if (isResolution(dimension)) {
            // @ts-ignore
            dimension.typ = exports.EnumToken.ResolutionTokenType;
            if (dimension.unit == 'dppx') {
                dimension.unit = 'x';
            }
        }
        else if (isFrequency(dimension)) {
            // @ts-ignore
            dimension.typ = exports.EnumToken.FrequencyTokenType;
        }
        else if (isFlex(dimension)) {
            // @ts-ignore
            dimension.typ = exports.EnumToken.FlexTokenType;
        }
        return dimension;
    }
    function isHexColor(name) {
        if (name.charAt(0) != '#' || ![4, 5, 7, 9].includes(name.length)) {
            return false;
        }
        for (let chr of name.slice(1)) {
            let codepoint = chr.charCodeAt(0);
            if (!isDigit(codepoint) &&
                // A-F
                !(codepoint >= 0x41 && codepoint <= 0x46) &&
                // a-f
                !(codepoint >= 0x61 && codepoint <= 0x66)) {
                return false;
            }
        }
        return true;
    }
    function isFunction(name) {
        return name.endsWith('(') && isIdent(name.slice(0, -1));
    }
    function isAtKeyword(name) {
        return name.charCodeAt(0) == 0x40 && isIdent(name.slice(1));
    }
    function isNewLine(codepoint) {
        // \n \r \f
        return codepoint == 0xa || codepoint == 0xc || codepoint == 0xd;
    }
    function isWhiteSpace(codepoint) {
        return codepoint == 0x9 || codepoint == 0x20 ||
            // isNewLine
            codepoint == 0xa || codepoint == 0xc || codepoint == 0xd;
    }

    function length2Px(value) {
        let result = null;
        if (value.typ == exports.EnumToken.NumberTokenType) {
            result = +value.val;
        }
        else {
            switch (value.unit) {
                case 'cm':
                    // @ts-ignore
                    result = value.val * 37.8;
                    break;
                case 'mm':
                    // @ts-ignore
                    result = value.val * 3.78;
                    break;
                case 'Q':
                    // @ts-ignore
                    result = value.val * 37.8 / 40;
                    break;
                case 'in':
                    // @ts-ignore
                    result = value.val / 96;
                    break;
                case 'pc':
                    // @ts-ignore
                    result = value.val / 16;
                    break;
                case 'pt':
                    // @ts-ignore
                    result = value.val * 4 / 3;
                    break;
                case 'px':
                    result = +value.val;
                    break;
            }
        }
        return isNaN(result) ? null : result;
    }
    /**
     * minify number
     * @param val
     */
    function minifyNumber(val) {
        val = String(val);
        if (val === '0') {
            return '0';
        }
        const chr = val.charAt(0);
        if (chr == '-') {
            const slice = val.slice(0, 2);
            if (slice == '-0') {
                return val.length == 2 ? '0' : '-' + val.slice(2);
            }
        }
        if (chr == '0') {
            return val.slice(1);
        }
        return val;
    }

    var properties = {
    	gap: {
    		shorthand: "gap",
    		properties: [
    			"row-gap",
    			"column-gap"
    		],
    		types: [
    			"Length",
    			"Perc"
    		],
    		multiple: false,
    		separator: null,
    		keywords: [
    			"normal"
    		]
    	},
    	"row-gap": {
    		shorthand: "gap"
    	},
    	"column-gap": {
    		shorthand: "gap"
    	},
    	inset: {
    		shorthand: "inset",
    		properties: [
    			"top",
    			"right",
    			"bottom",
    			"left"
    		],
    		types: [
    			"Length",
    			"Perc"
    		],
    		multiple: false,
    		separator: null,
    		keywords: [
    			"auto"
    		]
    	},
    	top: {
    		shorthand: "inset"
    	},
    	right: {
    		shorthand: "inset"
    	},
    	bottom: {
    		shorthand: "inset"
    	},
    	left: {
    		shorthand: "inset"
    	},
    	margin: {
    		shorthand: "margin",
    		properties: [
    			"margin-top",
    			"margin-right",
    			"margin-bottom",
    			"margin-left"
    		],
    		types: [
    			"Length",
    			"Perc"
    		],
    		multiple: false,
    		separator: null,
    		keywords: [
    			"auto"
    		]
    	},
    	"margin-top": {
    		shorthand: "margin"
    	},
    	"margin-right": {
    		shorthand: "margin"
    	},
    	"margin-bottom": {
    		shorthand: "margin"
    	},
    	"margin-left": {
    		shorthand: "margin"
    	},
    	padding: {
    		shorthand: "padding",
    		properties: [
    			"padding-top",
    			"padding-right",
    			"padding-bottom",
    			"padding-left"
    		],
    		types: [
    			"Length",
    			"Perc"
    		],
    		keywords: [
    		]
    	},
    	"padding-top": {
    		shorthand: "padding"
    	},
    	"padding-right": {
    		shorthand: "padding"
    	},
    	"padding-bottom": {
    		shorthand: "padding"
    	},
    	"padding-left": {
    		shorthand: "padding"
    	},
    	"border-radius": {
    		shorthand: "border-radius",
    		properties: [
    			"border-top-left-radius",
    			"border-top-right-radius",
    			"border-bottom-right-radius",
    			"border-bottom-left-radius"
    		],
    		types: [
    			"Length",
    			"Perc"
    		],
    		multiple: true,
    		separator: "/",
    		keywords: [
    		]
    	},
    	"border-top-left-radius": {
    		shorthand: "border-radius"
    	},
    	"border-top-right-radius": {
    		shorthand: "border-radius"
    	},
    	"border-bottom-right-radius": {
    		shorthand: "border-radius"
    	},
    	"border-bottom-left-radius": {
    		shorthand: "border-radius"
    	},
    	"border-width": {
    		shorthand: "border-width",
    		map: "border",
    		properties: [
    			"border-top-width",
    			"border-right-width",
    			"border-bottom-width",
    			"border-left-width"
    		],
    		types: [
    			"Length",
    			"Perc"
    		],
    		"default": [
    			"medium"
    		],
    		keywords: [
    			"thin",
    			"medium",
    			"thick"
    		]
    	},
    	"border-top-width": {
    		map: "border",
    		shorthand: "border-width"
    	},
    	"border-right-width": {
    		map: "border",
    		shorthand: "border-width"
    	},
    	"border-bottom-width": {
    		map: "border",
    		shorthand: "border-width"
    	},
    	"border-left-width": {
    		map: "border",
    		shorthand: "border-width"
    	},
    	"border-style": {
    		shorthand: "border-style",
    		map: "border",
    		properties: [
    			"border-top-style",
    			"border-right-style",
    			"border-bottom-style",
    			"border-left-style"
    		],
    		types: [
    		],
    		"default": [
    			"none"
    		],
    		keywords: [
    			"none",
    			"hidden",
    			"dotted",
    			"dashed",
    			"solid",
    			"double",
    			"groove",
    			"ridge",
    			"inset",
    			"outset"
    		]
    	},
    	"border-top-style": {
    		map: "border",
    		shorthand: "border-style"
    	},
    	"border-right-style": {
    		map: "border",
    		shorthand: "border-style"
    	},
    	"border-bottom-style": {
    		map: "border",
    		shorthand: "border-style"
    	},
    	"border-left-style": {
    		map: "border",
    		shorthand: "border-style"
    	},
    	"border-color": {
    		shorthand: "border-color",
    		map: "border",
    		properties: [
    			"border-top-color",
    			"border-right-color",
    			"border-bottom-color",
    			"border-left-color"
    		],
    		types: [
    			"Color"
    		],
    		"default": [
    			"currentcolor"
    		],
    		keywords: [
    		]
    	},
    	"border-top-color": {
    		map: "border",
    		shorthand: "border-color"
    	},
    	"border-right-color": {
    		map: "border",
    		shorthand: "border-color"
    	},
    	"border-bottom-color": {
    		map: "border",
    		shorthand: "border-color"
    	},
    	"border-left-color": {
    		map: "border",
    		shorthand: "border-color"
    	}
    };
    var map = {
    	"flex-flow": {
    		shorthand: "flex-flow",
    		pattern: "flex-direction flex-wrap",
    		keywords: [
    		],
    		"default": [
    			"row",
    			"nowrap"
    		],
    		properties: {
    			"flex-direction": {
    				keywords: [
    					"row",
    					"row-reverse",
    					"column",
    					"column-reverse"
    				],
    				"default": [
    					"row"
    				],
    				types: [
    				]
    			},
    			"flex-wrap": {
    				keywords: [
    					"wrap",
    					"nowrap",
    					"wrap-reverse"
    				],
    				"default": [
    					"nowrap"
    				],
    				types: [
    				]
    			}
    		}
    	},
    	"flex-direction": {
    		shorthand: "flex-flow"
    	},
    	"flex-wrap": {
    		shorthand: "flex-flow"
    	},
    	container: {
    		shorthand: "container",
    		pattern: "container-name container-type",
    		keywords: [
    		],
    		"default": [
    		],
    		properties: {
    			"container-name": {
    				required: true,
    				multiple: true,
    				keywords: [
    					"none"
    				],
    				"default": [
    					"none"
    				],
    				types: [
    					"Iden",
    					"DashedIden"
    				]
    			},
    			"container-type": {
    				previous: "container-name",
    				prefix: {
    					typ: "Literal",
    					val: "/"
    				},
    				keywords: [
    					"size",
    					"inline-size",
    					"normal"
    				],
    				"default": [
    					"normal"
    				],
    				types: [
    				]
    			}
    		}
    	},
    	"container-name": {
    		shorthand: "container"
    	},
    	"container-type": {
    		shorthand: "container"
    	},
    	flex: {
    		shorthand: "flex",
    		pattern: "flex-grow flex-shrink flex-basis",
    		keywords: [
    			"auto",
    			"none",
    			"initial"
    		],
    		"default": [
    		],
    		mapping: {
    			"0 1 auto": "initial",
    			"0 0 auto": "none",
    			"1 1 auto": "auto"
    		},
    		properties: {
    			"flex-grow": {
    				required: true,
    				keywords: [
    				],
    				"default": [
    				],
    				types: [
    					"Number"
    				]
    			},
    			"flex-shrink": {
    				keywords: [
    				],
    				"default": [
    				],
    				types: [
    					"Number"
    				]
    			},
    			"flex-basis": {
    				keywords: [
    					"max-content",
    					"min-content",
    					"fit-content",
    					"fit-content",
    					"content",
    					"auto"
    				],
    				"default": [
    				],
    				types: [
    					"Length",
    					"Perc"
    				]
    			}
    		}
    	},
    	"flex-grow": {
    		shorthand: "flex"
    	},
    	"flex-shrink": {
    		shorthand: "flex"
    	},
    	"flex-basis": {
    		shorthand: "flex"
    	},
    	columns: {
    		shorthand: "columns",
    		pattern: "column-count column-width",
    		keywords: [
    			"auto"
    		],
    		"default": [
    			"auto",
    			"auto auto"
    		],
    		properties: {
    			"column-count": {
    				keywords: [
    					"auto"
    				],
    				"default": [
    					"auto"
    				],
    				types: [
    					"Number"
    				]
    			},
    			"column-width": {
    				keywords: [
    					"auto"
    				],
    				"default": [
    					"auto"
    				],
    				types: [
    					"Length"
    				]
    			}
    		}
    	},
    	"column-count": {
    		shorthand: "columns"
    	},
    	"column-width": {
    		shorthand: "columns"
    	},
    	transition: {
    		shorthand: "transition",
    		multiple: true,
    		separator: {
    			typ: "Comma"
    		},
    		pattern: "transition-property transition-duration transition-timing-function transition-delay transition-behavior",
    		keywords: [
    			"none",
    			"all"
    		],
    		"default": [
    			"0s",
    			"0ms",
    			"all",
    			"ease",
    			"none",
    			"normal"
    		],
    		mapping: {
    			"cubic-bezier(.25,.1,.25,1)": "ease",
    			"cubic-bezier(0,0,1,1)": "linear",
    			"cubic-bezier(.42,0,1,1)": "ease-in",
    			"cubic-bezier(0,0,.58,1)": "ease-out",
    			"cubic-bezier(.42,0,.58,.42)": "ease-in-out"
    		},
    		properties: {
    			"transition-property": {
    				keywords: [
    					"none",
    					"all"
    				],
    				"default": [
    					"all"
    				],
    				types: [
    					"Iden"
    				]
    			},
    			"transition-duration": {
    				keywords: [
    				],
    				"default": [
    					"0s",
    					"0ms",
    					"normal"
    				],
    				types: [
    					"Time"
    				]
    			},
    			"transition-timing-function": {
    				keywords: [
    					"ease",
    					"ease-in",
    					"ease-out",
    					"ease-in-out",
    					"linear",
    					"step-start",
    					"step-end"
    				],
    				"default": [
    					"ease"
    				],
    				types: [
    					"TimingFunction"
    				],
    				mapping: {
    					"cubic-bezier(.25,.1,.25,1)": "ease",
    					"cubic-bezier(0,0,1,1)": "linear",
    					"cubic-bezier(.42,0,1,1)": "ease-in",
    					"cubic-bezier(0,0,.58,1)": "ease-out",
    					"cubic-bezier(.42,0,.58,.42)": "ease-in-out"
    				}
    			},
    			"transition-delay": {
    				keywords: [
    				],
    				"default": [
    					"0s"
    				],
    				types: [
    					"Time"
    				]
    			},
    			"transition-behavior": {
    				keywords: [
    					"normal",
    					"allow-discrete"
    				],
    				"default": [
    					"normal"
    				],
    				types: [
    				]
    			}
    		}
    	},
    	"transition-property": {
    		shorthand: "transition"
    	},
    	"transition-duration": {
    		shorthand: "transition"
    	},
    	"transition-timing-function": {
    		shorthand: "transition"
    	},
    	"transition-delay": {
    		shorthand: "transition"
    	},
    	"transition-behavior": {
    		shorthand: "transition"
    	},
    	animation: {
    		shorthand: "animation",
    		separator: {
    			typ: "Comma"
    		},
    		pattern: "animation-name animation-duration animation-timing-function animation-delay animation-iteration-count animation-direction animation-fill-mode animation-play-state animation-timeline",
    		"default": [
    			"1",
    			"0s",
    			"0ms",
    			"none",
    			"ease",
    			"normal",
    			"running",
    			"auto"
    		],
    		properties: {
    			"animation-name": {
    				keywords: [
    					"none"
    				],
    				"default": [
    					"none"
    				],
    				types: [
    					"Iden"
    				]
    			},
    			"animation-duration": {
    				keywords: [
    					"auto"
    				],
    				"default": [
    					"0s",
    					"0ms",
    					"auto"
    				],
    				types: [
    					"Time"
    				],
    				mapping: {
    					auto: "0s"
    				}
    			},
    			"animation-timing-function": {
    				keywords: [
    					"ease",
    					"ease-in",
    					"ease-out",
    					"ease-in-out",
    					"linear",
    					"step-start",
    					"step-end"
    				],
    				"default": [
    					"ease"
    				],
    				types: [
    					"TimingFunction"
    				],
    				mapping: {
    					"cubic-bezier(.25,.1,.25,1)": "ease",
    					"cubic-bezier(0,0,1,1)": "linear",
    					"cubic-bezier(.42,0,1,1)": "ease-in",
    					"cubic-bezier(0,0,.58,1)": "ease-out",
    					"cubic-bezier(.42,0,.58,.42)": "ease-in-out"
    				}
    			},
    			"animation-delay": {
    				keywords: [
    				],
    				"default": [
    					"0s",
    					"0ms"
    				],
    				types: [
    					"Time"
    				]
    			},
    			"animation-iteration-count": {
    				keywords: [
    					"infinite"
    				],
    				"default": [
    					"1"
    				],
    				types: [
    					"Number"
    				]
    			},
    			"animation-direction": {
    				keywords: [
    					"normal",
    					"reverse",
    					"alternate",
    					"alternate-reverse"
    				],
    				"default": [
    					"normal"
    				],
    				types: [
    				]
    			},
    			"animation-fill-mode": {
    				keywords: [
    					"none",
    					"forwards",
    					"backwards",
    					"both"
    				],
    				"default": [
    					"none"
    				],
    				types: [
    				]
    			},
    			"animation-play-state": {
    				keywords: [
    					"running",
    					"paused"
    				],
    				"default": [
    					"running"
    				],
    				types: [
    				]
    			},
    			"animation-timeline": {
    				keywords: [
    					"none",
    					"auto"
    				],
    				"default": [
    					"auto"
    				],
    				types: [
    					"DashedIden",
    					"TimelineFunction"
    				]
    			}
    		}
    	},
    	"animation-name": {
    		shorthand: "animation"
    	},
    	"animation-duration": {
    		shorthand: "animation"
    	},
    	"animation-timing-function": {
    		shorthand: "animation"
    	},
    	"animation-delay": {
    		shorthand: "animation"
    	},
    	"animation-iteration-count": {
    		shorthand: "animation"
    	},
    	"animation-direction": {
    		shorthand: "animation"
    	},
    	"animation-fill-mode": {
    		shorthand: "animation"
    	},
    	"animation-play-state": {
    		shorthand: "animation"
    	},
    	"animation-timeline": {
    		shorthand: "animation"
    	},
    	"text-emphasis": {
    		shorthand: "text-emphasis",
    		pattern: "text-emphasis-color text-emphasis-style",
    		"default": [
    			"none",
    			"currentcolor"
    		],
    		properties: {
    			"text-emphasis-style": {
    				keywords: [
    					"none",
    					"filled",
    					"open",
    					"dot",
    					"circle",
    					"double-circle",
    					"triangle",
    					"sesame"
    				],
    				"default": [
    					"none"
    				],
    				types: [
    					"String"
    				]
    			},
    			"text-emphasis-color": {
    				"default": [
    					"currentcolor"
    				],
    				types: [
    					"Color"
    				]
    			}
    		}
    	},
    	"text-emphasis-style": {
    		shorthand: "text-emphasis"
    	},
    	"text-emphasis-color": {
    		shorthand: "text-emphasis"
    	},
    	border: {
    		shorthand: "border",
    		pattern: "border-color border-style border-width",
    		keywords: [
    			"none"
    		],
    		"default": [
    			"0",
    			"none"
    		],
    		properties: {
    			"border-color": {
    				types: [
    					"Color"
    				],
    				"default": [
    					"currentcolor"
    				],
    				keywords: [
    				]
    			},
    			"border-style": {
    				types: [
    				],
    				"default": [
    					"none"
    				],
    				keywords: [
    					"none",
    					"hidden",
    					"dotted",
    					"dashed",
    					"solid",
    					"double",
    					"groove",
    					"ridge",
    					"inset",
    					"outset"
    				]
    			},
    			"border-width": {
    				types: [
    					"Length",
    					"Perc"
    				],
    				"default": [
    					"medium"
    				],
    				keywords: [
    					"thin",
    					"medium",
    					"thick"
    				]
    			}
    		}
    	},
    	"border-color": {
    		shorthand: "border"
    	},
    	"border-style": {
    		shorthand: "border"
    	},
    	"border-width": {
    		shorthand: "border"
    	},
    	"list-style": {
    		shorthand: "list-style",
    		pattern: "list-style-type list-style-position list-style-image",
    		keywords: [
    			"none",
    			"outside"
    		],
    		"default": [
    			"none",
    			"outside"
    		],
    		properties: {
    			"list-style-position": {
    				types: [
    				],
    				"default": [
    					"outside"
    				],
    				keywords: [
    					"inside",
    					"outside"
    				]
    			},
    			"list-style-image": {
    				"default": [
    					"none"
    				],
    				keywords: [
    					"node"
    				],
    				types: [
    					"UrlFunc",
    					"ImageFunc"
    				]
    			},
    			"list-style-type": {
    				types: [
    					"String",
    					"Iden",
    					"Symbols"
    				],
    				"default": [
    					"disc"
    				],
    				keywords: [
    					"disc",
    					"circle",
    					"square",
    					"decimal",
    					"decimal-leading-zero",
    					"lower-roman",
    					"upper-roman",
    					"lower-greek",
    					"lower-latin",
    					"upper-latin",
    					"none"
    				]
    			}
    		}
    	},
    	"list-style-position": {
    		shorthand: "list-style"
    	},
    	"list-style-image": {
    		shorthand: "list-style"
    	},
    	"list-style-type": {
    		shorthand: "list-style"
    	},
    	overflow: {
    		shorthand: "overflow",
    		pattern: "overflow-x overflow-y",
    		keywords: [
    			"auto",
    			"visible",
    			"hidden",
    			"clip",
    			"scroll"
    		],
    		"default": [
    		],
    		mapping: {
    			"visible visible": "visible",
    			"auto auto": "auto",
    			"hidden hidden": "hidden",
    			"scroll scroll": "scroll"
    		},
    		properties: {
    			"overflow-x": {
    				"default": [
    				],
    				types: [
    				],
    				keywords: [
    					"auto",
    					"visible",
    					"hidden",
    					"clip",
    					"scroll"
    				]
    			},
    			"overflow-y": {
    				"default": [
    				],
    				types: [
    				],
    				keywords: [
    					"auto",
    					"visible",
    					"hidden",
    					"clip",
    					"scroll"
    				]
    			}
    		}
    	},
    	"overflow-x": {
    		shorthand: "overflow"
    	},
    	"overflow-y": {
    		shorthand: "overflow"
    	},
    	outline: {
    		shorthand: "outline",
    		pattern: "outline-color outline-style outline-width",
    		keywords: [
    			"none"
    		],
    		"default": [
    			"0",
    			"none",
    			"currentcolor"
    		],
    		properties: {
    			"outline-color": {
    				types: [
    					"Color"
    				],
    				"default": [
    					"currentcolor"
    				],
    				keywords: [
    					"currentcolor"
    				]
    			},
    			"outline-style": {
    				types: [
    				],
    				"default": [
    					"none"
    				],
    				keywords: [
    					"auto",
    					"none",
    					"dotted",
    					"dashed",
    					"solid",
    					"double",
    					"groove",
    					"ridge",
    					"inset",
    					"outset"
    				]
    			},
    			"outline-width": {
    				types: [
    					"Length",
    					"Perc"
    				],
    				"default": [
    					"medium"
    				],
    				keywords: [
    					"thin",
    					"medium",
    					"thick"
    				]
    			}
    		}
    	},
    	"outline-color": {
    		shorthand: "outline"
    	},
    	"outline-style": {
    		shorthand: "outline"
    	},
    	"outline-width": {
    		shorthand: "outline"
    	},
    	font: {
    		shorthand: "font",
    		pattern: "font-weight font-style font-size line-height font-stretch font-variant font-family",
    		keywords: [
    			"caption",
    			"icon",
    			"menu",
    			"message-box",
    			"small-caption",
    			"status-bar",
    			"-moz-window, ",
    			"-moz-document, ",
    			"-moz-desktop, ",
    			"-moz-info, ",
    			"-moz-dialog",
    			"-moz-button",
    			"-moz-pull-down-menu",
    			"-moz-list",
    			"-moz-field"
    		],
    		"default": [
    		],
    		properties: {
    			"font-weight": {
    				types: [
    					"Number"
    				],
    				"default": [
    					"400",
    					"normal"
    				],
    				keywords: [
    					"normal",
    					"bold",
    					"lighter",
    					"bolder"
    				],
    				constraints: {
    					value: {
    						min: "1",
    						max: "1000"
    					}
    				},
    				mapping: {
    					thin: "100",
    					hairline: "100",
    					"extra light": "200",
    					"ultra light": "200",
    					light: "300",
    					normal: "400",
    					regular: "400",
    					medium: "500",
    					"semi bold": "600",
    					"demi bold": "600",
    					bold: "700",
    					"extra bold": "800",
    					"ultra bold": "800",
    					black: "900",
    					heavy: "900",
    					"extra black": "950",
    					"ultra black": "950"
    				}
    			},
    			"font-style": {
    				types: [
    					"Angle"
    				],
    				"default": [
    					"normal"
    				],
    				keywords: [
    					"normal",
    					"italic",
    					"oblique"
    				]
    			},
    			"font-size": {
    				types: [
    					"Length",
    					"Perc"
    				],
    				"default": [
    				],
    				keywords: [
    					"xx-small",
    					"x-small",
    					"small",
    					"medium",
    					"large",
    					"x-large",
    					"xx-large",
    					"xxx-large",
    					"larger",
    					"smaller"
    				],
    				required: true
    			},
    			"line-height": {
    				types: [
    					"Length",
    					"Perc",
    					"Number"
    				],
    				"default": [
    					"normal"
    				],
    				keywords: [
    					"normal"
    				],
    				previous: "font-size",
    				prefix: {
    					typ: "Literal",
    					val: "/"
    				}
    			},
    			"font-stretch": {
    				types: [
    					"Perc"
    				],
    				"default": [
    					"normal"
    				],
    				keywords: [
    					"ultra-condensed",
    					"extra-condensed",
    					"condensed",
    					"semi-condensed",
    					"normal",
    					"semi-expanded",
    					"expanded",
    					"extra-expanded",
    					"ultra-expanded"
    				],
    				mapping: {
    					"ultra-condensed": "50%",
    					"extra-condensed": "62.5%",
    					condensed: "75%",
    					"semi-condensed": "87.5%",
    					normal: "100%",
    					"semi-expanded": "112.5%",
    					expanded: "125%",
    					"extra-expanded": "150%",
    					"ultra-expanded": "200%"
    				}
    			},
    			"font-variant": {
    				types: [
    				],
    				"default": [
    					"normal"
    				],
    				keywords: [
    					"normal",
    					"none",
    					"common-ligatures",
    					"no-common-ligatures",
    					"discretionary-ligatures",
    					"no-discretionary-ligatures",
    					"historical-ligatures",
    					"no-historical-ligatures",
    					"contextual",
    					"no-contextual",
    					"historical-forms",
    					"small-caps",
    					"all-small-caps",
    					"petite-caps",
    					"all-petite-caps",
    					"unicase",
    					"titling-caps",
    					"ordinal",
    					"slashed-zero",
    					"lining-nums",
    					"oldstyle-nums",
    					"proportional-nums",
    					"tabular-nums",
    					"diagonal-fractions",
    					"stacked-fractions",
    					"ordinal",
    					"slashed-zero",
    					"ruby",
    					"jis78",
    					"jis83",
    					"jis90",
    					"jis04",
    					"simplified",
    					"traditional",
    					"full-width",
    					"proportional-width",
    					"ruby",
    					"sub",
    					"super",
    					"text",
    					"emoji",
    					"unicode"
    				]
    			},
    			"font-family": {
    				types: [
    					"String",
    					"Iden"
    				],
    				"default": [
    				],
    				keywords: [
    					"serif",
    					"sans-serif",
    					"monospace",
    					"cursive",
    					"fantasy",
    					"system-ui",
    					"ui-serif",
    					"ui-sans-serif",
    					"ui-monospace",
    					"ui-rounded",
    					"math",
    					"emoji",
    					"fangsong"
    				],
    				required: true,
    				multiple: true,
    				separator: {
    					typ: "Comma"
    				}
    			}
    		}
    	},
    	"font-weight": {
    		shorthand: "font"
    	},
    	"font-style": {
    		shorthand: "font"
    	},
    	"font-size": {
    		shorthand: "font"
    	},
    	"line-height": {
    		shorthand: "font"
    	},
    	"font-stretch": {
    		shorthand: "font"
    	},
    	"font-variant": {
    		shorthand: "font"
    	},
    	"font-family": {
    		shorthand: "font"
    	},
    	background: {
    		shorthand: "background",
    		pattern: "background-attachment background-origin background-clip background-color background-image background-repeat background-position background-size",
    		keywords: [
    			"none"
    		],
    		"default": [
    			"0 0",
    			"none",
    			"auto",
    			"repeat",
    			"transparent",
    			"#0000",
    			"scroll",
    			"padding-box",
    			"border-box"
    		],
    		multiple: true,
    		set: {
    			"background-origin": [
    				"background-clip"
    			]
    		},
    		separator: {
    			typ: "Comma"
    		},
    		properties: {
    			"background-repeat": {
    				types: [
    				],
    				"default": [
    					"repeat"
    				],
    				multiple: true,
    				keywords: [
    					"repeat-x",
    					"repeat-y",
    					"repeat",
    					"space",
    					"round",
    					"no-repeat"
    				],
    				mapping: {
    					"repeat no-repeat": "repeat-x",
    					"no-repeat repeat": "repeat-y",
    					"repeat repeat": "repeat",
    					"space space": "space",
    					"round round": "round",
    					"no-repeat no-repeat": "no-repeat"
    				}
    			},
    			"background-color": {
    				types: [
    					"Color"
    				],
    				"default": [
    					"#0000",
    					"transparent"
    				],
    				multiple: true,
    				keywords: [
    				]
    			},
    			"background-image": {
    				types: [
    					"UrlFunc",
    					"ImageFunc"
    				],
    				"default": [
    					"none"
    				],
    				keywords: [
    					"none"
    				]
    			},
    			"background-attachment": {
    				types: [
    				],
    				"default": [
    					"scroll"
    				],
    				multiple: true,
    				keywords: [
    					"scroll",
    					"fixed",
    					"local"
    				]
    			},
    			"background-clip": {
    				types: [
    				],
    				"default": [
    					"border-box"
    				],
    				multiple: true,
    				keywords: [
    					"border-box",
    					"padding-box",
    					"content-box",
    					"text"
    				]
    			},
    			"background-origin": {
    				types: [
    				],
    				"default": [
    					"padding-box"
    				],
    				multiple: true,
    				keywords: [
    					"border-box",
    					"padding-box",
    					"content-box"
    				]
    			},
    			"background-position": {
    				multiple: true,
    				types: [
    					"Perc",
    					"Length"
    				],
    				"default": [
    					"0 0",
    					"top left",
    					"left top"
    				],
    				keywords: [
    					"top",
    					"left",
    					"center",
    					"bottom",
    					"right"
    				],
    				mapping: {
    					left: "0",
    					top: "0",
    					center: "50%",
    					"center center": "50%",
    					"50% 50%": "50%",
    					bottom: "100%",
    					right: "100%"
    				},
    				constraints: {
    					mapping: {
    						max: 2
    					}
    				}
    			},
    			"background-size": {
    				multiple: true,
    				previous: "background-position",
    				prefix: {
    					typ: "Literal",
    					val: "/"
    				},
    				types: [
    					"Perc",
    					"Length"
    				],
    				"default": [
    					"auto",
    					"auto auto"
    				],
    				keywords: [
    					"auto",
    					"cover",
    					"contain"
    				],
    				mapping: {
    					"auto auto": "auto"
    				}
    			}
    		}
    	},
    	"background-repeat": {
    		shorthand: "background"
    	},
    	"background-color": {
    		shorthand: "background"
    	},
    	"background-image": {
    		shorthand: "background"
    	},
    	"background-attachment": {
    		shorthand: "background"
    	},
    	"background-clip": {
    		shorthand: "background"
    	},
    	"background-origin": {
    		shorthand: "background"
    	},
    	"background-position": {
    		shorthand: "background"
    	},
    	"background-size": {
    		shorthand: "background"
    	}
    };
    var config$4 = {
    	properties: properties,
    	map: map
    };

    Object.freeze(config$4);
    const getConfig = () => config$4;

    function matchType(val, properties) {
        if (val.typ == exports.EnumToken.IdenTokenType && properties.keywords.includes(val.val) ||
            // @ts-ignore
            (properties.types.some((t) => exports.EnumToken[t] == val.typ))) {
            return true;
        }
        if (val.typ == exports.EnumToken.NumberTokenType && val.val == 0) {
            // @ts-ignore
            return properties.types.some((type) => {
                // @ts-ignore
                const typ = exports.EnumToken[type];
                return typ == exports.EnumToken.LengthTokenType || typ == exports.EnumToken.AngleTokenType;
            });
        }
        if (val.typ == exports.EnumToken.FunctionTokenType) {
            if (mathFuncs.includes(val.val)) {
                return val.chi.every(((t) => [exports.EnumToken.Add, exports.EnumToken.Mul, exports.EnumToken.Div, exports.EnumToken.Sub, exports.EnumToken.LiteralTokenType, exports.EnumToken.CommaTokenType, exports.EnumToken.WhitespaceTokenType, exports.EnumToken.DimensionTokenType, exports.EnumToken.NumberTokenType, exports.EnumToken.LengthTokenType, exports.EnumToken.AngleTokenType, exports.EnumToken.PercentageTokenType, exports.EnumToken.ResolutionTokenType, exports.EnumToken.TimeTokenType, exports.EnumToken.BinaryExpressionTokenType].includes(t.typ) || matchType(t, properties)));
            }
            // match type defined like function 'symbols()', 'url()', 'attr()' etc.
            // return properties.types.includes((<FunctionToken>val).val + '()')
        }
        return false;
    }

    function parseDeclarationNode(node, errors, location) {
        while (node.val[0]?.typ == exports.EnumToken.WhitespaceTokenType) {
            node.val.shift();
        }
        if (!node.nam.startsWith('--') && node.val.filter((t) => ![exports.EnumToken.WhitespaceTokenType, exports.EnumToken.CommentTokenType].includes(t.typ)).length == 0) {
            errors.push({
                action: 'drop',
                message: 'doParse: invalid declaration',
                location
            });
            return null;
        }
        if ('composes' == node.nam.toLowerCase()) {
            let left = [];
            let right = [];
            let current = 0;
            let hasFrom = 0;
            for (; current < node.val.length; current++) {
                if (exports.EnumToken.WhitespaceTokenType == node.val[current].typ || exports.EnumToken.CommentTokenType == node.val[current].typ) {
                    if (!hasFrom) {
                        left.push(node.val[current]);
                    }
                    else {
                        right.push(node.val[current]);
                    }
                    continue;
                }
                if (exports.EnumToken.IdenTokenType == node.val[current].typ || exports.EnumToken.DashedIdenTokenType == node.val[current].typ || exports.EnumToken.StringTokenType == node.val[current].typ) {
                    if (exports.EnumToken.IdenTokenType == node.val[current].typ) {
                        if ('from' == node.val[current].val) {
                            if (hasFrom) {
                                return null;
                            }
                            hasFrom++;
                            continue;
                        }
                    }
                    if (hasFrom) {
                        right.push(node.val[current]);
                    }
                    else {
                        left.push(node.val[current]);
                    }
                    continue;
                }
                break;
            }
            if (hasFrom <= 1 && current > 0) {
                if (hasFrom == 0) {
                    node.val.splice(0, left.length, {
                        typ: exports.EnumToken.ComposesSelectorNodeType,
                        l: left,
                        r: null
                    });
                }
                else {
                    node.val.splice(0, current, {
                        typ: exports.EnumToken.ComposesSelectorNodeType,
                        l: left,
                        r: right.reduce((a, b) => {
                            return a == null ? b : b.typ == exports.EnumToken.WhitespaceTokenType || b.typ == exports.EnumToken.CommentTokenType ? a : b;
                        }, null)
                    });
                }
            }
        }
        for (const { value: val, parent } of walkValues(node.val, node)) {
            if (val.typ == exports.EnumToken.AttrTokenType && val.chi.every((t) => [exports.EnumToken.IdenTokenType, exports.EnumToken.WhitespaceTokenType, exports.EnumToken.CommentTokenType].includes(t.typ))) {
                // @ts-ignore
                val.typ = exports.EnumToken.IdenListTokenType;
            }
            else if (val.typ == exports.EnumToken.StringTokenType && (node.nam == 'grid' || node.nam == 'grid-template-areas' || node.nam == 'grid-template-rows' || node.nam == 'grid-template-columns')) {
                val.val = val.val.at(0) + parseGridTemplate(val.val.slice(1, -1)) + val.val.at(-1);
                // @ts-ignore
                const array = parent?.chi ?? node.val;
                const index = array.indexOf(val);
                if (index > 0 && array[index - 1].typ == exports.EnumToken.WhitespaceTokenType) {
                    array.splice(index - 1, 1);
                }
            }
        }
        return node;
    }
    function parseGridTemplate(template) {
        let result = '';
        let buffer = '';
        for (let i = 0; i < template.length; i++) {
            const char = template[i];
            if (isWhiteSpace(char.codePointAt(0))) {
                while (i + 1 < template.length && isWhiteSpace(template[i + 1].codePointAt(0))) {
                    i++;
                }
                result += buffer + ' ';
                buffer = '';
            }
            else if (char == '.') {
                while (i + 1 < template.length && template[i + 1] == '.') {
                    i++;
                }
                if (isWhiteSpace((result.at(-1)?.codePointAt(0)))) {
                    result = result.slice(0, -1);
                }
                result += buffer + char;
                buffer = '';
            }
            else {
                buffer += char;
            }
        }
        return buffer.length > 0 ? result + buffer : result;
    }

    function dasherize(value) {
        return value.replace(/([A-Z])/g, (all, one) => `-${one.toLowerCase()}`);
    }
    function camelize(value) {
        return value.replace(/-([a-z])/g, (all, one) => one.toUpperCase());
    }

    // from https://github.com/Rich-Harris/vlq/tree/master
    // credit: Rich Harris
    const integer_to_char = {};
    let i = 0;
    for (const char of 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=') {
        integer_to_char[i++] = char;
    }
    function encode(value) {
        if (typeof value === 'number') {
            return encode_integer(value);
        }
        let result = '';
        for (let i = 0; i < value.length; i += 1) {
            result += encode_integer(value[i]);
        }
        return result;
    }
    function encode_integer(num) {
        let result = '';
        if (num < 0) {
            num = (-num << 1) | 1;
        }
        else {
            num <<= 1;
        }
        do {
            let clamped = num & 31;
            num >>>= 5;
            if (num > 0) {
                clamped |= 32;
            }
            result += integer_to_char[clamped];
        } while (num > 0);
        return result;
    }

    /**
     * Source map class
     * @internal
     */
    class SourceMap {
        /**
         * Last location
         */
        lastLocation = null;
        /**
         * Version
         * @private
         */
        #version = 3;
        /**
         * Sources
         * @private
         */
        #sources = [];
        /**
         * Map
         * @private
         */
        #map = new Map;
        /**
         * Line
         * @private
         */
        #line = -1;
        /**
         * Add a location
         * @param source
         * @param original
         */
        add(source, original) {
            if (original.src !== '') {
                if (!this.#sources.includes(original.src)) {
                    this.#sources.push(original.src);
                }
                const line = source.sta.lin - 1;
                let record;
                if (line > this.#line) {
                    this.#line = line;
                }
                if (!this.#map.has(line)) {
                    record = [Math.max(0, source.sta.col - 1), this.#sources.indexOf(original.src), original.sta.lin - 1, original.sta.col - 1];
                    this.#map.set(line, [record]);
                }
                else {
                    const arr = this.#map.get(line);
                    record = [Math.max(0, source.sta.col - 1 - arr[0][0]), this.#sources.indexOf(original.src) - arr[0][1], original.sta.lin - 1, original.sta.col - 1];
                    arr.push(record);
                }
                if (this.lastLocation != null) {
                    record[2] -= this.lastLocation.sta.lin - 1;
                    record[3] -= this.lastLocation.sta.col - 1;
                }
                this.lastLocation = original;
            }
        }
        /**
         * Convert to URL encoded string
         */
        toUrl() {
            // /*# sourceMappingURL = ${url} */
            return `data:application/json,${encodeURIComponent(JSON.stringify(this.toJSON()))}`;
        }
        /**
         * Convert to JSON object
         */
        toJSON() {
            const mappings = [];
            let i = 0;
            for (; i <= this.#line; i++) {
                if (!this.#map.has(i)) {
                    mappings.push('');
                }
                else {
                    mappings.push(this.#map.get(i).reduce((acc, curr) => acc + (acc === '' ? '' : ',') + encode(curr), ''));
                }
            }
            return {
                version: this.#version,
                sources: this.#sources.slice(),
                mappings: mappings.join(';')
            };
        }
    }

    /**
     * Update position
     * @param position
     * @param str
     */
    function update(position, str) {
        let i = 0;
        for (; i < str.length; i++) {
            if (isNewLine(str[i].charCodeAt(0))) {
                position.lin++;
                position.col = 0;
            }
            else {
                position.col++;
            }
        }
    }
    /**
     * render ast
     * @param data
     * @param options
     * @param mapping
     * @private
     */
    function doRender(data, options = {}, mapping) {
        const minify = options.minify ?? true;
        const beautify = options.beautify ?? !minify;
        options = {
            ...(beautify ? {
                indent: ' ',
                newLine: '\n',
            } : {
                indent: '',
                newLine: '',
            }),
            ...(minify ? {
                removeEmpty: true,
                removeComments: true,
                minify: true
            } : {
                removeEmpty: false,
                removeComments: false,
            }), sourcemap: false, convertColor: true, expandNestingRules: false, preserveLicense: false, ...options
        };
        if (options.withParents) {
            // @ts-ignore
            let parent = data.parent;
            // @ts-ignore
            while (data.parent != null) {
                // @ts-ignore
                parent = { ...data.parent, chi: [{ ...data }] };
                // @ts-ignore
                parent.parent = data.parent.parent;
                // @ts-ignore
                data = parent;
            }
        }
        const startTime = performance.now();
        const errors = [];
        const sourcemap = options.sourcemap ? new SourceMap : null;
        const cache = Object.create(null);
        const position = {
            ind: 0,
            lin: 1,
            col: 1
        };
        let code = '';
        if (mapping != null) {
            if (mapping.importMapping != null) {
                for (const [key, value] of Object.entries(mapping.importMapping)) {
                    code += `:import("${key}")${options.indent}{${options.newLine}${Object.entries(value).reduce((acc, [k, v]) => acc + (acc.length > 0 ? options.newLine : '') + `${options.indent}${v}:${options.indent}${k};`, '')}${options.newLine}}${options.newLine}`;
                }
            }
            code += `:export${options.indent}{${options.newLine}${Object.entries(mapping.mapping).reduce((acc, [k, v]) => acc + (acc.length > 0 ? options.newLine : '') + `${options.indent}${k}:${options.indent}${v};`, '')}${options.newLine}}${options.newLine}`;
            update(position, code);
        }
        const result = {
            code: code + renderAstNode(options.expandNestingRules && [exports.EnumToken.StyleSheetNodeType, exports.EnumToken.AtRuleNodeType, exports.EnumToken.RuleNodeType].includes(data.typ) && 'chi' in data ? expand(data) : data, options, sourcemap, position, errors, function reducer(acc, curr) {
                if (curr.typ == exports.EnumToken.CommentTokenType && options.removeComments) {
                    if (!options.preserveLicense || !curr.val.startsWith('/*!')) {
                        return acc;
                    }
                    return acc + curr.val;
                }
                return acc + renderToken(curr, options, cache, reducer, errors);
            }, cache), errors, stats: {
                total: `${(performance.now() - startTime).toFixed(2)}ms`
            }
        };
        if (options.output != null) {
            // @ts-ignore
            options.output = options.resolve(options.output, options.cwd).absolute;
        }
        if (sourcemap != null) {
            result.map = sourcemap;
            if (options.sourcemap === 'inline') {
                result.code += `\n/*# sourceMappingURL=data:application/json,${encodeURIComponent(JSON.stringify(result.map))} */`;
            }
        }
        return result;
    }
    /**
     * Update source map
     * @param node
     * @param options
     * @param cache
     * @param sourcemap
     * @param position
     * @param str
     *
     * @internal
     */
    function updateSourceMap(node, options, cache, sourcemap, position, str) {
        if ([
            exports.EnumToken.RuleNodeType, exports.EnumToken.AtRuleNodeType,
            exports.EnumToken.KeyFramesRuleNodeType, exports.EnumToken.KeyframesAtRuleNodeType
        ].includes(node.typ)) {
            let src = node.loc?.src ?? '';
            let output = options.output ?? '';
            if (!(src in cache)) {
                // @ts-ignore
                cache[src] = options.resolve(src, options.cwd ?? '').relative;
            }
            if (!(output in cache)) {
                // @ts-ignore
                cache[output] = options.resolve(output, options.cwd).relative;
            }
            // @ts-ignore
            sourcemap.add({ src: cache[output], sta: { ...position } }, {
                ...node.loc,
                // @ts-ignore
                src: options.resolve(cache[src], options.cwd).relative
            });
        }
        update(position, str);
    }
    /**
     * render ast node
     * @param data
     * @param options
     * @param sourcemap
     * @param position
     * @param errors
     * @param reducer
     * @param cache
     * @param level
     * @param indents
     *
     * @internal
     */
    function renderAstNode(data, options, sourcemap, position, errors, reducer, cache, level = 0, indents = []) {
        if (indents.length < level + 1) {
            indents.push(options.indent.repeat(level));
        }
        if (indents.length < level + 2) {
            indents.push(options.indent.repeat(level + 1));
        }
        const indent = indents[level];
        const indentSub = indents[level + 1];
        switch (data.typ) {
            case exports.EnumToken.DeclarationNodeType:
                return `${data.nam}:${options.indent}${(options.minify ? filterValues(data.val) : data.val).reduce(reducer, '')}`;
            case exports.EnumToken.CommentNodeType:
            case exports.EnumToken.CDOCOMMNodeType:
                if (data.val.startsWith('/*# sourceMappingURL=')) {
                    // ignore sourcemap
                    return '';
                }
                return !options.removeComments || (options.preserveLicense && data.val.startsWith('/*!')) ? data.val : '';
            case exports.EnumToken.StyleSheetNodeType:
                return data.chi.reduce((css, node) => {
                    const str = renderAstNode(node, options, sourcemap, { ...position }, errors, reducer, cache, level, indents);
                    if (str === '') {
                        return css;
                    }
                    if (css === '') {
                        if (sourcemap != null && node.loc != null) {
                            updateSourceMap(node, options, cache, sourcemap, position, str);
                        }
                        return str;
                    }
                    if (sourcemap != null && node.loc != null) {
                        update(position, options.newLine);
                        updateSourceMap(node, options, cache, sourcemap, position, str);
                    }
                    return `${css}${options.newLine}${str}`;
                }, '');
            case exports.EnumToken.AtRuleNodeType:
            case exports.EnumToken.RuleNodeType:
            case exports.EnumToken.KeyFramesRuleNodeType:
            case exports.EnumToken.KeyframesAtRuleNodeType:
                if ([exports.EnumToken.AtRuleNodeType, exports.EnumToken.KeyframesAtRuleNodeType].includes(data.typ) && !('chi' in data)) {
                    return `${indent}@${data.nam}${data.val === '' ? '' : options.indent || ' '}${data.val};`;
                }
                // @ts-ignore
                let children = data.chi.reduce((css, node) => {
                    let str;
                    if (node.typ == exports.EnumToken.CommentNodeType) {
                        str = options.removeComments && (!options.preserveLicense || !node.val.startsWith('/*!')) ? '' : node.val;
                    }
                    else if (node.typ == exports.EnumToken.DeclarationNodeType) {
                        if (!node.nam.startsWith('--') && node.val.length == 0) {
                            // @ts-ignore
                            errors.push({
                                action: 'ignore',
                                message: `render: invalid declaration ${JSON.stringify(node)}`,
                                location: node.loc
                            });
                            return '';
                        }
                        str = `${node.nam}:${options.indent}${(options.minify ? filterValues(node.val) : node.val).reduce(reducer, '').trimEnd()};`;
                    }
                    else if (node.typ == exports.EnumToken.AtRuleNodeType && !('chi' in node)) {
                        str = `${node.val === '' ? '' : options.indent || ' '}${node.val};`;
                    }
                    else {
                        str = renderAstNode(node, options, sourcemap, { ...position }, errors, reducer, cache, level + 1, indents);
                    }
                    if (css === '') {
                        return str;
                    }
                    if (str === '') {
                        return css;
                    }
                    return `${css}${options.newLine}${indentSub}${str}`;
                }, '');
                if (options.removeEmpty && children === '') {
                    return '';
                }
                if (children.endsWith(';')) {
                    children = children.slice(0, -1);
                }
                if ([exports.EnumToken.AtRuleNodeType, exports.EnumToken.KeyframesAtRuleNodeType].includes(data.typ)) {
                    return `@${data.nam}${data.val === '' ? '' : options.indent || ' '}${data.val}${options.indent}{${options.newLine}` + (children === '' ? '' : indentSub + children + options.newLine) + indent + `}`;
                }
                return data.sel + `${options.indent}{${options.newLine}` + (children === '' ? '' : indentSub + children + options.newLine) + indent + `}`;
            case exports.EnumToken.InvalidDeclarationNodeType:
            case exports.EnumToken.InvalidRuleTokenType:
            case exports.EnumToken.InvalidAtRuleTokenType:
            default:
                return '';
        }
    }
    /**
     * render ast token
     * @param token
     * @param options
     */
    function renderToken(token, options = {}, cache = Object.create(null), reducer, errors) {
        if (reducer == null) {
            reducer = function (acc, curr) {
                if (curr.typ == exports.EnumToken.CommentTokenType && options.removeComments) {
                    if (!options.preserveLicense || !curr.val.startsWith('/*!')) {
                        return acc;
                    }
                    return acc + curr.val;
                }
                return acc + renderToken(curr, options, cache, reducer, errors);
            };
        }
        if (token.typ == exports.EnumToken.FunctionTokenType && colorsFunc.includes(token.val)) {
            if (isColor(token)) {
                // @ts-ignore
                token.typ = exports.EnumToken.ColorTokenType;
                // @ts-ignore
                if (token.chi[0].typ == exports.EnumToken.IdenTokenType && token.chi[0].val == 'from') {
                    // @ts-ignore
                    token.cal = 'rel';
                }
                else { // @ts-ignore
                    if (token.val == 'color-mix' && token.chi[0].typ == exports.EnumToken.IdenTokenType && token.chi[0].val == 'in') {
                        // @ts-ignore
                        token.cal = 'mix';
                    }
                    else {
                        // @ts-ignore
                        if (token.val == 'color') {
                            // @ts-ignore
                            token.cal = 'col';
                        }
                        // @ts-ignore
                        token.chi = token.chi.filter((t) => ![exports.EnumToken.WhitespaceTokenType, exports.EnumToken.CommaTokenType, exports.EnumToken.CommentTokenType].includes(t.typ));
                    }
                }
            }
        }
        switch (token.typ) {
            case exports.EnumToken.ListToken:
                return token.chi.reduce((acc, curr) => acc + renderToken(curr, options, cache), '');
            case exports.EnumToken.BinaryExpressionTokenType:
                if ([exports.EnumToken.Mul, exports.EnumToken.Div].includes(token.op)) {
                    let result = '';
                    if (token.l.typ == exports.EnumToken.BinaryExpressionTokenType &&
                        [exports.EnumToken.Add, exports.EnumToken.Sub].includes(token.l.op)) {
                        result = '(' + renderToken(token.l, options, cache) + ')';
                    }
                    else {
                        result = renderToken(token.l, options, cache);
                    }
                    result += token.op == exports.EnumToken.Mul ? '*' : '/';
                    if (token.r.typ == exports.EnumToken.BinaryExpressionTokenType &&
                        [exports.EnumToken.Add, exports.EnumToken.Sub].includes(token.r.op)) {
                        result += '(' + renderToken(token.r, options, cache) + ')';
                    }
                    else {
                        result += renderToken(token.r, options, cache);
                    }
                    return result;
                }
                return renderToken(token.l, options, cache) + (token.op == exports.EnumToken.Add ? ' + ' : (token.op == exports.EnumToken.Sub ? ' - ' : (token.op == exports.EnumToken.Mul ? '*' : '/'))) + renderToken(token.r, options, cache);
            case exports.EnumToken.FractionTokenType:
                const fraction = renderToken(token.l) + '/' + renderToken(token.r);
                if (+token.r.val != 0) {
                    const value = minifyNumber(+token.l.val / +token.r.val);
                    if (value.length <= fraction.length) {
                        return value;
                    }
                }
                return fraction;
            case exports.EnumToken.Add:
                return ' + ';
            case exports.EnumToken.Sub:
                return ' - ';
            case exports.EnumToken.UniversalSelectorTokenType:
            case exports.EnumToken.Mul:
                return '*';
            case exports.EnumToken.Div:
                return '/';
            case exports.EnumToken.ColorTokenType:
                if (token.kin == exports.ColorType.LIGHT_DARK || ('chi' in token && options.convertColor === false)) {
                    return token.val + '(' + token.chi.reduce((acc, curr) => acc + renderToken(curr, options, cache), '') + ')';
                }
                if (options.convertColor !== false) {
                    const value = convertColor(token, typeof options.convertColor == 'boolean' ? exports.ColorType.HEX : exports.ColorType[exports.ColorType[options.convertColor ?? 'HEX']?.toUpperCase?.().replaceAll?.('-', '_')] ?? exports.ColorType.HEX);
                    //
                    if (value != null) {
                        token = value;
                    }
                }
                if ([exports.ColorType.HEX, exports.ColorType.LIT, exports.ColorType.SYS, exports.ColorType.DPSYS].includes(token.kin)) {
                    return token.val;
                }
                if (Array.isArray(token.chi)) {
                    const isLegacy = ['rgb', 'rgba', 'hsl', 'hsla'].includes(token.val.toLowerCase());
                    const useAlpha = (['rgb', 'rgba', 'hsl', 'hsla', 'hwb', 'oklab', 'oklch', 'lab', 'lch'].includes(token.val.toLowerCase()) && token.chi.length == 4) ||
                        ('color' == token.val.toLowerCase() && token.chi.length == 5);
                    return (token.val.endsWith('a') ? token.val.slice(0, -1) : token.val) + '(' + token.chi.reduce((acc, curr, index, array) => {
                        if (/[,/]\s*$/.test(acc)) {
                            if (curr.typ == exports.EnumToken.WhitespaceTokenType) {
                                return acc.trimEnd();
                            }
                            return acc.trimStart() + renderToken(curr, options, cache);
                        }
                        if (isLegacy && curr.typ == exports.EnumToken.CommaTokenType) {
                            return acc.trimEnd() + ' ';
                        }
                        if (curr.typ == exports.EnumToken.WhitespaceTokenType) {
                            return acc.trimEnd() + ' ';
                        }
                        if (curr.typ == exports.EnumToken.CommaTokenType || (curr.typ == exports.EnumToken.LiteralTokenType && curr.val == '/')) {
                            return acc.trimEnd() + (curr.typ == exports.EnumToken.CommaTokenType ? ',' : '/');
                        }
                        return acc.trimEnd() + (useAlpha && index == array.length - 1 ? '/' : ' ') + renderToken(curr, options, cache);
                    }, '').trimStart() + ')';
                }
            case exports.EnumToken.ParensTokenType:
            case exports.EnumToken.FunctionTokenType:
            case exports.EnumToken.UrlFunctionTokenType:
            case exports.EnumToken.ImageFunctionTokenType:
            case exports.EnumToken.TimingFunctionTokenType:
            case exports.EnumToken.PseudoClassFuncTokenType:
            case exports.EnumToken.TimelineFunctionTokenType:
            case exports.EnumToken.GridTemplateFuncTokenType:
                if (token.typ == exports.EnumToken.FunctionTokenType &&
                    mathFuncs.includes(token.val) &&
                    token.chi.length == 1 &&
                    ![exports.EnumToken.BinaryExpressionTokenType, exports.EnumToken.FractionTokenType, exports.EnumToken.IdenTokenType].includes(token.chi[0].typ) &&
                    // @ts-ignore
                    token.chi[0].val?.typ != exports.EnumToken.FractionTokenType) {
                    return token.val + '(' + token.chi.reduce((acc, curr) => acc + renderToken(curr, options, cache, reducer), '') + ')';
                }
                return ( /* options.minify && 'Pseudo-class-func' == token.typ && token.val.slice(0, 2) == '::' ? token.val.slice(1) :*/token.val ?? '') + '(' + token.chi.reduce(reducer, '') + ')';
            case exports.EnumToken.MatchExpressionTokenType:
                return renderToken(token.l, options, cache, reducer, errors) +
                    renderToken(token.op, options, cache, reducer, errors) +
                    renderToken(token.r, options, cache, reducer, errors) +
                    (token.attr ? ' ' + token.attr : '');
            case exports.EnumToken.NameSpaceAttributeTokenType:
                return (token.l == null ? '' : renderToken(token.l, options, cache, reducer, errors)) + '|' +
                    renderToken(token.r, options, cache, reducer, errors);
            case exports.EnumToken.ComposesSelectorNodeType:
                return token.l.reduce((acc, curr) => acc + renderToken(curr, options, cache), '') + (token.r == null ? '' : ' from ' + renderToken(token.r, options, cache, reducer, errors));
            case exports.EnumToken.BlockStartTokenType:
                return '{';
            case exports.EnumToken.BlockEndTokenType:
                return '}';
            case exports.EnumToken.StartParensTokenType:
                return '(';
            case exports.EnumToken.DelimTokenType:
            case exports.EnumToken.EqualMatchTokenType:
                return '=';
            case exports.EnumToken.IncludeMatchTokenType:
                return '~=';
            case exports.EnumToken.DashMatchTokenType:
                return '|=';
            case exports.EnumToken.StartMatchTokenType:
                return '^=';
            case exports.EnumToken.EndMatchTokenType:
                return '$=';
            case exports.EnumToken.ContainMatchTokenType:
                return '*=';
            case exports.EnumToken.LtTokenType:
                return '<';
            case exports.EnumToken.LteTokenType:
                return '<=';
            case exports.EnumToken.SubsequentSiblingCombinatorTokenType:
                return '~';
            case exports.EnumToken.NextSiblingCombinatorTokenType:
                return '+';
            case exports.EnumToken.GtTokenType:
            case exports.EnumToken.ChildCombinatorTokenType:
                return '>';
            case exports.EnumToken.GteTokenType:
                return '>=';
            case exports.EnumToken.ColumnCombinatorTokenType:
                return '||';
            case exports.EnumToken.EndParensTokenType:
                return ')';
            case exports.EnumToken.AttrStartTokenType:
                return '[';
            case exports.EnumToken.AttrEndTokenType:
                return ']';
            case exports.EnumToken.DescendantCombinatorTokenType:
            case exports.EnumToken.WhitespaceTokenType:
                return ' ';
            case exports.EnumToken.ColonTokenType:
                return ':';
            case exports.EnumToken.SemiColonTokenType:
                return ';';
            case exports.EnumToken.CommaTokenType:
                return ',';
            case exports.EnumToken.ImportantTokenType:
                return '!important';
            case exports.EnumToken.AttrTokenType:
            case exports.EnumToken.IdenListTokenType:
                return '[' + token.chi.reduce(reducer, '') + ']';
            case exports.EnumToken.TimeTokenType:
            case exports.EnumToken.AngleTokenType:
            case exports.EnumToken.LengthTokenType:
            case exports.EnumToken.DimensionTokenType:
            case exports.EnumToken.FrequencyTokenType:
            case exports.EnumToken.ResolutionTokenType:
                let val = token.val.typ == exports.EnumToken.FractionTokenType ? renderToken(token.val, options, cache) : minifyNumber(token.val);
                let unit = token.unit;
                if (token.typ == exports.EnumToken.AngleTokenType && !val.includes('/')) {
                    const angle = getAngle(token);
                    let v;
                    let value = val + unit;
                    for (const u of ['turn', 'deg', 'rad', 'grad']) {
                        if (token.unit == u) {
                            continue;
                        }
                        switch (u) {
                            case 'turn':
                                v = minifyNumber(angle);
                                if (v.length + 4 < value.length) {
                                    val = v;
                                    unit = u;
                                    value = v + u;
                                }
                                break;
                            case 'deg':
                                v = minifyNumber(angle * 360);
                                if (v.length + 3 < value.length) {
                                    val = v;
                                    unit = u;
                                    value = v + u;
                                }
                                break;
                            case 'rad':
                                v = minifyNumber(angle * (2 * Math.PI));
                                if (v.length + 3 < value.length) {
                                    val = v;
                                    unit = u;
                                    value = v + u;
                                }
                                break;
                            case 'grad':
                                v = minifyNumber(angle * 400);
                                if (v.length + 4 < value.length) {
                                    val = v;
                                    unit = u;
                                    value = v + u;
                                }
                                break;
                        }
                    }
                }
                if (val === '0') {
                    if (token.typ == exports.EnumToken.TimeTokenType) {
                        return '0s';
                    }
                    if (token.typ == exports.EnumToken.FrequencyTokenType) {
                        return '0Hz';
                    }
                    // @ts-ignore
                    if (token.typ == exports.EnumToken.ResolutionTokenType) {
                        return '0x';
                    }
                    return '0';
                }
                if (token.typ == exports.EnumToken.TimeTokenType) {
                    if (unit == 'ms') {
                        // @ts-ignore
                        const v = minifyNumber(val / 1000);
                        if (v.length + 1 <= val.length) {
                            return v + 's';
                        }
                        return val + 'ms';
                    }
                    return val + 's';
                }
                if (token.typ == exports.EnumToken.ResolutionTokenType && unit == 'dppx') {
                    unit = 'x';
                }
                return val.includes('/') ? val.replace('/', unit + '/') : val + unit;
            case exports.EnumToken.FlexTokenType:
            case exports.EnumToken.PercentageTokenType:
                const uni = token.typ == exports.EnumToken.PercentageTokenType ? '%' : 'fr';
                const perc = token.val.typ == exports.EnumToken.FractionTokenType ? renderToken(token.val, options, cache) : minifyNumber(token.val);
                return options.minify && perc == '0' ? '0' : (perc.includes('/') ? perc.replace('/', uni + '/') : perc + uni);
            case exports.EnumToken.NumberTokenType:
                return token.val.typ == exports.EnumToken.FractionTokenType ? renderToken(token.val, options, cache) : minifyNumber(token.val);
            case exports.EnumToken.CommentTokenType:
                if (options.removeComments && (!options.preserveLicense || !token.val.startsWith('/*!'))) {
                    return '';
                }
            case exports.EnumToken.PseudoClassTokenType:
            case exports.EnumToken.PseudoElementTokenType:
                // https://www.w3.org/TR/selectors-4/#single-colon-pseudos
                if (token.typ == exports.EnumToken.PseudoElementTokenType && pseudoElements.includes(token.val.slice(1))) {
                    return token.val.slice(1);
                }
            case exports.EnumToken.UrlTokenTokenType:
            // if (token.typ == EnumToken.UrlTokenTokenType) {
            //
            //     if (options.output != null) {
            //
            //         if (!('original' in token)) {
            //
            //             // do not modify original token
            //             token = {...token};
            //             Object.defineProperty(token, 'original', {
            //                 enumerable: false,
            //                 writable: false,
            //                 value: (token as UrlToken).val
            //             })
            //         }
            //
            //         // @ts-ignore
            //         if (!(token.original in cache)) {
            //
            //             let output: string = <string>options.output ?? '';
            //             const key = output + 'abs';
            //
            //             if (!(key in cache)) {
            //
            //                 // @ts-ignore
            //                 cache[key] = options.dirname(options.resolve(output, options.cwd).absolute);
            //             }
            //
            //             // @ts-ignore
            //             cache[token.original] = options.resolve(token.original, cache[key]).relative;
            //         }
            //
            //         // @ts-ignore
            //         token.val = cache[token.original];
            //     }
            // }
            case exports.EnumToken.HashTokenType:
            case exports.EnumToken.IdenTokenType:
            case exports.EnumToken.AtRuleTokenType:
            case exports.EnumToken.StringTokenType:
            case exports.EnumToken.LiteralTokenType:
            case exports.EnumToken.DashedIdenTokenType:
            case exports.EnumToken.PseudoPageTokenType:
            case exports.EnumToken.ClassSelectorTokenType:
                return /* options.minify && 'Pseudo-class' == token.typ && '::' == token.val.slice(0, 2) ? token.val.slice(1) :  */ token.val;
            case exports.EnumToken.NestingSelectorTokenType:
                return '&';
            case exports.EnumToken.InvalidAttrTokenType:
                return '[' + token.chi.reduce((acc, curr) => acc + renderToken(curr, options, cache), '');
            case exports.EnumToken.InvalidClassSelectorTokenType:
                return token.val;
            case exports.EnumToken.DeclarationNodeType:
                return token.nam + ':' + (options.minify ? filterValues(token.val) : token.val).reduce((acc, curr) => acc + renderToken(curr, options, cache), '');
            case exports.EnumToken.MediaQueryConditionTokenType:
                return renderToken(token.l, options, cache, reducer, errors) + renderToken(token.op, options, cache, reducer, errors) + token.r.reduce((acc, curr) => acc + renderToken(curr, options, cache), '');
            case exports.EnumToken.MediaFeatureTokenType:
                return token.val;
            case exports.EnumToken.MediaFeatureNotTokenType:
                return 'not ' + renderToken(token.val, options, cache, reducer, errors);
            case exports.EnumToken.MediaFeatureOnlyTokenType:
                return 'only ' + renderToken(token.val, options, cache, reducer, errors);
            case exports.EnumToken.MediaFeatureAndTokenType:
                return 'and';
            case exports.EnumToken.MediaFeatureOrTokenType:
                return 'or';
        }
        errors?.push({ action: 'ignore', message: `render: unexpected token ${JSON.stringify(token, null, 1)}` });
        return '';
    }
    /**
     * Remove whitespace tokens that are not needed
     * @param values
     *
     * @internal
     */
    function filterValues(values) {
        let i = 0;
        for (; i < values.length; i++) {
            if (values[i].typ == exports.EnumToken.ImportantTokenType && values[i - 1]?.typ == exports.EnumToken.WhitespaceTokenType) {
                values.splice(i - 1, 1);
            }
            else if (funcLike.includes(values[i].typ) && !['var', 'calc'].includes(values[i].val) && values[i + 1]?.typ == exports.EnumToken.WhitespaceTokenType) {
                values.splice(i + 1, 1);
            }
        }
        return values;
    }

    var TokenMap;
    (function (TokenMap) {
        TokenMap[TokenMap["SLASH"] = 47] = "SLASH";
        TokenMap[TokenMap["AMPERSAND"] = 38] = "AMPERSAND";
        TokenMap[TokenMap["LOWERTHAN"] = 60] = "LOWERTHAN";
        TokenMap[TokenMap["HASH"] = 35] = "HASH";
        TokenMap[TokenMap["REVERSE_SOLIDUS"] = 92] = "REVERSE_SOLIDUS";
        TokenMap[TokenMap["DOUBLE_QUOTE"] = 34] = "DOUBLE_QUOTE";
        TokenMap[TokenMap["SINGLE_QUOTE"] = 39] = "SINGLE_QUOTE";
        // ^
        TokenMap[TokenMap["CIRCUMFLEX"] = 94] = "CIRCUMFLEX";
        TokenMap[TokenMap["TILDA"] = 126] = "TILDA";
        TokenMap[TokenMap["PIPE"] = 124] = "PIPE";
        TokenMap[TokenMap["DOLLAR"] = 36] = "DOLLAR";
        TokenMap[TokenMap["GREATER_THAN"] = 62] = "GREATER_THAN";
        TokenMap[TokenMap["DOT"] = 46] = "DOT";
        TokenMap[TokenMap["PLUS"] = 43] = "PLUS";
        TokenMap[TokenMap["STAR"] = 42] = "STAR";
        TokenMap[TokenMap["COLON"] = 58] = "COLON";
        TokenMap[TokenMap["COMMA"] = 44] = "COMMA";
        TokenMap[TokenMap["EQUAL"] = 61] = "EQUAL";
        TokenMap[TokenMap["CLOSE_PAREN"] = 41] = "CLOSE_PAREN";
        TokenMap[TokenMap["OPEN_PAREN"] = 40] = "OPEN_PAREN";
        TokenMap[TokenMap["OPEN_BRACKET"] = 91] = "OPEN_BRACKET";
        TokenMap[TokenMap["CLOSE_BRACKET"] = 93] = "CLOSE_BRACKET";
        TokenMap[TokenMap["OPEN_CURLY_BRACE"] = 123] = "OPEN_CURLY_BRACE";
        TokenMap[TokenMap["CLOSE_CURLY_BRACE"] = 125] = "CLOSE_CURLY_BRACE";
        TokenMap[TokenMap["SEMICOLON"] = 59] = "SEMICOLON";
        TokenMap[TokenMap["EXCLAMATION"] = 33] = "EXCLAMATION";
        TokenMap[TokenMap["AT"] = 64] = "AT";
    })(TokenMap || (TokenMap = {}));
    function consumeWhiteSpace(parseInfo) {
        let count = 0;
        while (isWhiteSpace(parseInfo.stream.charCodeAt(count + parseInfo.currentPosition.ind + 1))) {
            count++;
        }
        next(parseInfo, count);
        return count;
    }
    function pushToken(token, parseInfo, hint) {
        const result = {
            token,
            len: parseInfo.currentPosition.ind - parseInfo.position.ind - 1,
            hint,
            sta: { ...parseInfo.position },
            end: { ...parseInfo.currentPosition },
            bytesIn: parseInfo.currentPosition.ind + 1
        };
        parseInfo.position.ind = parseInfo.currentPosition.ind;
        parseInfo.position.lin = parseInfo.currentPosition.lin;
        parseInfo.position.col = Math.max(parseInfo.currentPosition.col, 1);
        if (result.end.col == 0) {
            result.end.col = 1;
        }
        return result;
    }
    function* consumeString(quoteStr, buffer, parseInfo) {
        const quote = quoteStr;
        let value;
        let hasNewLine = false;
        if (buffer.length > 0) {
            yield pushToken(buffer, parseInfo);
            buffer = '';
        }
        buffer += quoteStr;
        while (value = peek(parseInfo)) {
            if (value == '\\') {
                const sequence = peek(parseInfo, 6);
                let escapeSequence = '';
                let codepoint;
                let i;
                for (i = 1; i < sequence.length; i++) {
                    codepoint = sequence.charCodeAt(i);
                    if (codepoint == 0x20 ||
                        (codepoint >= 0x61 && codepoint <= 0x66) ||
                        (codepoint >= 0x41 && codepoint <= 0x46) ||
                        (codepoint >= 0x30 && codepoint <= 0x39)) {
                        escapeSequence += sequence[i];
                        if (codepoint == 0x20) {
                            break;
                        }
                        continue;
                    }
                    break;
                }
                if (escapeSequence.trimEnd().length > 0) {
                    const codepoint = parseInt(escapeSequence, 16);
                    if (codepoint == 0 ||
                        // leading surrogate
                        (0xD800 <= codepoint && codepoint <= 0xDBFF) ||
                        // trailing surrogate
                        (0xDC00 <= codepoint && codepoint <= 0xDFFF)) {
                        buffer += String.fromCodePoint(0xFFFD);
                    }
                    else {
                        buffer += String.fromCodePoint(codepoint);
                    }
                    next(parseInfo, escapeSequence.length + 1 + (isWhiteSpace(peek(parseInfo)?.charCodeAt(0)) ? 1 : 0));
                    continue;
                }
                buffer += next(parseInfo, 2);
                continue;
            }
            if (value == quote) {
                buffer += value;
                yield pushToken(buffer, parseInfo, hasNewLine ? exports.EnumToken.BadStringTokenType : exports.EnumToken.StringTokenType);
                next(parseInfo);
                buffer = '';
                return;
            }
            if (isNewLine(value.charCodeAt(0))) {
                hasNewLine = true;
            }
            if (hasNewLine && value == ';') {
                yield pushToken(buffer + value, parseInfo, exports.EnumToken.BadStringTokenType);
                buffer = '';
                next(parseInfo);
                break;
            }
            buffer += value;
            next(parseInfo);
        }
        if (hasNewLine) {
            yield pushToken(buffer, parseInfo, exports.EnumToken.BadStringTokenType);
        }
        else {
            // EOF - 'Unclosed-string' fixed
            yield pushToken(buffer + quote, parseInfo, exports.EnumToken.StringTokenType);
        }
    }
    function match$1(parseInfo, input) {
        return parseInfo.stream.slice(parseInfo.currentPosition.ind + 1, parseInfo.currentPosition.ind + input.length + 1) == input;
    }
    function peek(parseInfo, count = 1) {
        if (count == 1) {
            return parseInfo.stream.charAt(parseInfo.currentPosition.ind + 1);
        }
        return parseInfo.stream.slice(parseInfo.currentPosition.ind + 1, parseInfo.currentPosition.ind + count + 1);
    }
    function prev(parseInfo) {
        return parseInfo.stream.charAt(parseInfo.currentPosition.ind - 1);
    }
    function next(parseInfo, count = 1) {
        let char = '';
        let chr = '';
        while (count-- && (chr = parseInfo.stream.charAt(parseInfo.currentPosition.ind + 1))) {
            char += chr;
            const codepoint = parseInfo.stream.charCodeAt(++parseInfo.currentPosition.ind);
            if (isNewLine(codepoint)) {
                parseInfo.currentPosition.lin++;
                parseInfo.currentPosition.col = 0;
            }
            else {
                parseInfo.currentPosition.col++;
            }
        }
        return char;
    }
    /**
     * tokenize css string
     * @param parseInfo
     * @param yieldEOFToken
     */
    function* tokenize$1(parseInfo, yieldEOFToken = true) {
        let value;
        let buffer = parseInfo.buffer;
        let charCode;
        parseInfo.buffer = '';
        while (value = next(parseInfo)) {
            charCode = value.charCodeAt(0);
            if (isWhiteSpace(charCode)) {
                if (buffer.length > 0) {
                    yield pushToken(buffer, parseInfo);
                    buffer = '';
                }
                buffer += value;
                while (value = next(parseInfo)) {
                    charCode = value.charCodeAt(0);
                    if (!isWhiteSpace(charCode)) {
                        break;
                    }
                    buffer += value;
                }
                yield pushToken(buffer, parseInfo, exports.EnumToken.WhitespaceTokenType);
                buffer = '';
            }
            switch (charCode) {
                case 47 /* TokenMap.SLASH */:
                    if (buffer.length > 0) {
                        yield pushToken(buffer, parseInfo);
                        buffer = '';
                        if (!match$1(parseInfo, '*')) {
                            yield pushToken(value, parseInfo);
                            break;
                        }
                    }
                    buffer += value;
                    if (match$1(parseInfo, '*')) {
                        buffer += next(parseInfo);
                        while (value = next(parseInfo)) {
                            if (value == '*') {
                                buffer += value;
                                if (match$1(parseInfo, '/')) {
                                    yield pushToken(buffer + next(parseInfo), parseInfo, exports.EnumToken.CommentTokenType);
                                    buffer = '';
                                    break;
                                }
                            }
                            else {
                                buffer += value;
                            }
                        }
                        if (buffer.length > 0) {
                            yield pushToken(buffer, parseInfo, exports.EnumToken.BadCommentTokenType);
                            buffer = '';
                        }
                    }
                    break;
                case 38 /* TokenMap.AMPERSAND */:
                    if (buffer.length > 0) {
                        yield pushToken(buffer, parseInfo);
                        buffer = '';
                    }
                    yield pushToken(value, parseInfo);
                    break;
                case 60 /* TokenMap.LOWERTHAN */:
                    if (buffer.length > 0) {
                        yield pushToken(buffer, parseInfo);
                        buffer = '';
                    }
                    if (match$1(parseInfo, '=')) {
                        yield pushToken(value + next(parseInfo), parseInfo, exports.EnumToken.LteTokenType);
                        break;
                    }
                    buffer += value;
                    if (match$1(parseInfo, '!--')) {
                        buffer += next(parseInfo, 3);
                        while (value = next(parseInfo)) {
                            buffer += value;
                            if (value == '-' && match$1(parseInfo, '->')) {
                                break;
                            }
                        }
                        if (value === '') {
                            yield pushToken(buffer, parseInfo, exports.EnumToken.BadCdoTokenType);
                        }
                        else {
                            yield pushToken(buffer + next(parseInfo, 2), parseInfo, exports.EnumToken.CDOCOMMTokenType);
                        }
                        buffer = '';
                    }
                    break;
                case 35 /* TokenMap.HASH */:
                    if (buffer.length > 0) {
                        yield pushToken(buffer, parseInfo);
                        buffer = '';
                    }
                    buffer += value;
                    break;
                case 92 /* TokenMap.REVERSE_SOLIDUS */:
                    // EOF
                    if (!(value = next(parseInfo))) {
                        // end of stream ignore \\
                        if (buffer.length > 0) {
                            yield pushToken(buffer, parseInfo);
                            buffer = '';
                        }
                        break;
                    }
                    buffer += prev(parseInfo) + value;
                    break;
                case 39 /* TokenMap.SINGLE_QUOTE */:
                case 34 /* TokenMap.DOUBLE_QUOTE */:
                    yield* consumeString(value, buffer, parseInfo);
                    buffer = '';
                    break;
                case 94 /* TokenMap.CIRCUMFLEX */:
                case 126 /* TokenMap.TILDA */:
                case 124 /* TokenMap.PIPE */:
                case 36 /* TokenMap.DOLLAR */:
                    if (buffer.length > 0) {
                        yield pushToken(buffer, parseInfo);
                        buffer = '';
                    }
                    if (charCode == 124 /* TokenMap.PIPE */) {
                        if (match$1(parseInfo, '|')) {
                            yield pushToken(value + next(parseInfo), parseInfo, exports.EnumToken.ColumnCombinatorTokenType);
                        }
                        else if (match$1(parseInfo, '=')) {
                            buffer += next(parseInfo);
                            yield pushToken(buffer, parseInfo);
                        }
                        else {
                            yield pushToken('|', parseInfo);
                        }
                        buffer = '';
                        continue;
                    }
                    if (buffer.length > 0) {
                        yield pushToken(buffer, parseInfo);
                        buffer = '';
                    }
                    buffer += value;
                    if (!(value = peek(parseInfo))) {
                        yield pushToken(buffer, parseInfo);
                        buffer = '';
                        break;
                    }
                    // ~=
                    // ^=
                    // $=
                    // |=
                    if (match$1(parseInfo, '=')) {
                        next(parseInfo);
                        switch (buffer.charCodeAt(0)) {
                            case 126 /* TokenMap.TILDA */:
                                yield pushToken(buffer, parseInfo, exports.EnumToken.IncludeMatchTokenType);
                                break;
                            case 94 /* TokenMap.CIRCUMFLEX */:
                                yield pushToken(buffer, parseInfo, exports.EnumToken.StartMatchTokenType);
                                break;
                            case 36 /* TokenMap.DOLLAR */:
                                yield pushToken(buffer, parseInfo, exports.EnumToken.EndMatchTokenType);
                                break;
                            case 124 /* TokenMap.PIPE */:
                                yield pushToken(buffer, parseInfo, exports.EnumToken.DashMatchTokenType);
                                break;
                        }
                        buffer = '';
                        break;
                    }
                    yield pushToken(buffer, parseInfo);
                    buffer = '';
                    break;
                case 62 /* TokenMap.GREATER_THAN */:
                    if (buffer !== '') {
                        yield pushToken(buffer, parseInfo);
                        buffer = '';
                    }
                    if (match$1(parseInfo, '=')) {
                        yield pushToken(value + next(parseInfo), parseInfo, exports.EnumToken.GteTokenType);
                    }
                    else {
                        yield pushToken(value, parseInfo, exports.EnumToken.GtTokenType);
                    }
                    consumeWhiteSpace(parseInfo);
                    break;
                case 46 /* TokenMap.DOT */:
                    const codepoint = peek(parseInfo).charCodeAt(0);
                    if (!isDigit(codepoint) && buffer !== '') {
                        yield pushToken(buffer, parseInfo);
                        buffer = value;
                        break;
                    }
                    buffer += value;
                    break;
                case 58 /* TokenMap.COLON */:
                case 43 /* TokenMap.PLUS */:
                case 42 /* TokenMap.STAR */:
                case 44 /* TokenMap.COMMA */:
                case 61 /* TokenMap.EQUAL */:
                    if (buffer.length > 0 && buffer != ':') {
                        yield pushToken(buffer, parseInfo);
                        buffer = '';
                    }
                    const val = peek(parseInfo);
                    if (val == '=') {
                        next(parseInfo);
                        yield pushToken(value + val, parseInfo, exports.EnumToken.ContainMatchTokenType);
                        break;
                    }
                    if (value == ':') {
                        if (isWhiteSpace(val.codePointAt(0))) {
                            yield pushToken(value, parseInfo, exports.EnumToken.ColonTokenType);
                            buffer = '';
                            break;
                        }
                        buffer += value;
                        break;
                    }
                    yield pushToken(value, parseInfo);
                    buffer = '';
                    if (['+', '*', '/'].includes(value) && isWhiteSpace(peek(parseInfo).charCodeAt(0))) {
                        yield pushToken(next(parseInfo), parseInfo);
                    }
                    while (isWhiteSpace(peek(parseInfo).charCodeAt(0))) {
                        next(parseInfo);
                    }
                    break;
                case 41 /* TokenMap.CLOSE_PAREN */:
                    if (buffer.length > 0) {
                        yield pushToken(buffer, parseInfo);
                        buffer = '';
                    }
                    yield pushToken(value, parseInfo, exports.EnumToken.EndParensTokenType);
                    break;
                case 40 /* TokenMap.OPEN_PAREN */:
                    if (buffer.length == 0) {
                        yield pushToken(value, parseInfo);
                        break;
                    }
                    buffer += value;
                    // @ts-ignore
                    if (buffer == 'url(') {
                        yield pushToken(buffer, parseInfo);
                        buffer = '';
                        consumeWhiteSpace(parseInfo);
                        value = peek(parseInfo);
                        // let cp: number;
                        let whitespace = '';
                        if (value == '"' || value == "'") {
                            const quote = value;
                            let inquote = true;
                            let hasNewLine = false;
                            buffer = next(parseInfo);
                            while (value = next(parseInfo)) {
                                charCode = value.charCodeAt(0);
                                // consume an invalid string
                                if (inquote) {
                                    buffer += value;
                                    if (isNewLine(charCode)) {
                                        hasNewLine = true;
                                        while (value = next(parseInfo)) {
                                            buffer += value;
                                            if (value == ';') {
                                                inquote = false;
                                                break;
                                            }
                                        }
                                        charCode = value.charCodeAt(0);
                                    }
                                    // '\\'
                                    if (charCode == 0x5c) {
                                        buffer += next(parseInfo);
                                    }
                                    else if (value == quote) {
                                        inquote = false;
                                    }
                                    continue;
                                }
                                if (!inquote) {
                                    if (isWhiteSpace(charCode)) {
                                        whitespace += value;
                                        while (value = peek(parseInfo)) {
                                            if (isWhiteSpace(value?.charCodeAt(0))) {
                                                whitespace += next(parseInfo);
                                                continue;
                                            }
                                            break;
                                        }
                                        if (!(value = next(parseInfo))) {
                                            yield pushToken(buffer, parseInfo, hasNewLine ? exports.EnumToken.BadUrlTokenType : exports.EnumToken.UrlTokenTokenType);
                                            buffer = '';
                                            break;
                                        }
                                    }
                                    charCode = value.charCodeAt(0);
                                    // ')'
                                    if (charCode == 0x29) {
                                        yield pushToken(buffer, parseInfo, hasNewLine ? exports.EnumToken.BadStringTokenType : exports.EnumToken.StringTokenType);
                                        yield pushToken(value, parseInfo, exports.EnumToken.EndParensTokenType);
                                        buffer = '';
                                        break;
                                    }
                                    while (value = next(parseInfo)) {
                                        charCode = value.charCodeAt(0);
                                        buffer += value;
                                    }
                                    if (hasNewLine) {
                                        yield pushToken(buffer, parseInfo, exports.EnumToken.BadStringTokenType);
                                        buffer = '';
                                    }
                                    break;
                                }
                                buffer += value;
                            }
                            break;
                        }
                        else {
                            buffer = '';
                            while (value = next(parseInfo)) {
                                charCode = value.charCodeAt(0);
                                if (charCode == 0x29) { // ')'
                                    yield pushToken(buffer, parseInfo, exports.EnumToken.UrlTokenTokenType);
                                    yield pushToken(value, parseInfo, exports.EnumToken.EndParensTokenType);
                                    buffer = '';
                                    break;
                                }
                                buffer += value;
                            }
                        }
                        if (buffer !== '') {
                            yield pushToken(buffer, parseInfo, exports.EnumToken.UrlTokenTokenType);
                            buffer = '';
                            break;
                        }
                        break;
                    }
                    yield pushToken(buffer, parseInfo);
                    buffer = '';
                    break;
                case 91 /* TokenMap.OPEN_BRACKET */:
                case 93 /* TokenMap.CLOSE_BRACKET */:
                case 123 /* TokenMap.OPEN_CURLY_BRACE */:
                case 125 /* TokenMap.CLOSE_CURLY_BRACE */:
                case 59 /* TokenMap.SEMICOLON */:
                    if (buffer.length > 0) {
                        yield pushToken(buffer, parseInfo);
                        buffer = '';
                    }
                    yield pushToken(value, parseInfo);
                    break;
                case 33 /* TokenMap.EXCLAMATION */:
                    if (buffer.length > 0) {
                        yield pushToken(buffer, parseInfo);
                        buffer = '';
                    }
                    if (match$1(parseInfo, 'important')) {
                        yield pushToken(value + next(parseInfo, 9), parseInfo, exports.EnumToken.ImportantTokenType);
                        buffer = '';
                        break;
                    }
                    buffer = '!';
                    break;
                case 64 /* TokenMap.AT */:
                    buffer = value;
                    {
                        let val = peek(parseInfo);
                        if (val == '-' || isIdentStart(val.charCodeAt(0))) {
                            buffer = next(parseInfo);
                            val = peek(parseInfo);
                            while (isIdent(val) || val == '-') {
                                buffer += next(parseInfo);
                                val = peek(parseInfo);
                            }
                            yield pushToken(buffer, parseInfo, exports.EnumToken.AtRuleTokenType);
                            buffer = '';
                        }
                    }
                    break;
                default:
                    buffer += value;
                    break;
            }
        }
        if (yieldEOFToken) {
            if (buffer.length > 0) {
                yield pushToken(buffer, parseInfo);
            }
            yield pushToken('', parseInfo, exports.EnumToken.EOFTokenType);
        }
        else {
            parseInfo.buffer = buffer;
        }
    }
    /**
     * tokenize readable stream
     * @param input
     */
    async function* tokenizeStream(input) {
        const parseInfo = {
            stream: '',
            buffer: '',
            position: { ind: 0, lin: 1, col: 1 },
            currentPosition: { ind: -1, lin: 1, col: 0 }
        };
        const decoder = new TextDecoder('utf-8');
        const reader = input.getReader();
        while (true) {
            const { done, value } = await reader.read();
            parseInfo.stream += ArrayBuffer.isView(value) ? decoder.decode(value, { stream: true }) : value;
            yield* tokenize$1(parseInfo, done);
            if (done) {
                break;
            }
        }
    }

    var declarations = {
    	"-ms-accelerator": {
    		syntax: "false | true"
    	},
    	"-ms-block-progression": {
    		syntax: "tb | rl | bt | lr"
    	},
    	"-ms-content-zoom-chaining": {
    		syntax: "none | chained"
    	},
    	"-ms-content-zoom-limit": {
    		syntax: "<'-ms-content-zoom-limit-min'> <'-ms-content-zoom-limit-max'>"
    	},
    	"-ms-content-zoom-limit-max": {
    		syntax: "<percentage>"
    	},
    	"-ms-content-zoom-limit-min": {
    		syntax: "<percentage>"
    	},
    	"-ms-content-zoom-snap": {
    		syntax: "<'-ms-content-zoom-snap-type'> || <'-ms-content-zoom-snap-points'>"
    	},
    	"-ms-content-zoom-snap-points": {
    		syntax: "snapInterval( <percentage>, <percentage> ) | snapList( <percentage># )"
    	},
    	"-ms-content-zoom-snap-type": {
    		syntax: "none | proximity | mandatory"
    	},
    	"-ms-content-zooming": {
    		syntax: "none | zoom"
    	},
    	"-ms-filter": {
    		syntax: "<string>"
    	},
    	"-ms-flow-from": {
    		syntax: "[ none | <custom-ident> ]#"
    	},
    	"-ms-flow-into": {
    		syntax: "[ none | <custom-ident> ]#"
    	},
    	"-ms-grid-columns": {
    		syntax: "none | <track-list> | <auto-track-list>"
    	},
    	"-ms-grid-rows": {
    		syntax: "none | <track-list> | <auto-track-list>"
    	},
    	"-ms-high-contrast-adjust": {
    		syntax: "auto | none"
    	},
    	"-ms-hyphenate-limit-chars": {
    		syntax: "auto | <integer>{1,3}"
    	},
    	"-ms-hyphenate-limit-lines": {
    		syntax: "no-limit | <integer>"
    	},
    	"-ms-hyphenate-limit-zone": {
    		syntax: "<percentage> | <length>"
    	},
    	"-ms-ime-align": {
    		syntax: "auto | after"
    	},
    	"-ms-overflow-style": {
    		syntax: "auto | none | scrollbar | -ms-autohiding-scrollbar auto | none | scrollbar | -ms-autohiding-scrollbar"
    	},
    	"-ms-scroll-chaining": {
    		syntax: "chained | none"
    	},
    	"-ms-scroll-limit": {
    		syntax: "<'-ms-scroll-limit-x-min'> <'-ms-scroll-limit-y-min'> <'-ms-scroll-limit-x-max'> <'-ms-scroll-limit-y-max'>"
    	},
    	"-ms-scroll-limit-x-max": {
    		syntax: "auto | <length>"
    	},
    	"-ms-scroll-limit-x-min": {
    		syntax: "<length>"
    	},
    	"-ms-scroll-limit-y-max": {
    		syntax: "auto | <length>"
    	},
    	"-ms-scroll-limit-y-min": {
    		syntax: "<length>"
    	},
    	"-ms-scroll-rails": {
    		syntax: "none | railed"
    	},
    	"-ms-scroll-snap-points-x": {
    		syntax: "snapInterval( <length-percentage>, <length-percentage> ) | snapList( <length-percentage># )"
    	},
    	"-ms-scroll-snap-points-y": {
    		syntax: "snapInterval( <length-percentage>, <length-percentage> ) | snapList( <length-percentage># )"
    	},
    	"-ms-scroll-snap-type": {
    		syntax: "none | proximity | mandatory"
    	},
    	"-ms-scroll-snap-x": {
    		syntax: "<'-ms-scroll-snap-type'> <'-ms-scroll-snap-points-x'>"
    	},
    	"-ms-scroll-snap-y": {
    		syntax: "<'-ms-scroll-snap-type'> <'-ms-scroll-snap-points-y'>"
    	},
    	"-ms-scroll-translation": {
    		syntax: "none | vertical-to-horizontal"
    	},
    	"-ms-scrollbar-3dlight-color": {
    		syntax: "<color>"
    	},
    	"-ms-scrollbar-arrow-color": {
    		syntax: "<color>"
    	},
    	"-ms-scrollbar-base-color": {
    		syntax: "<color>"
    	},
    	"-ms-scrollbar-darkshadow-color": {
    		syntax: "<color>"
    	},
    	"-ms-scrollbar-face-color": {
    		syntax: "<color>"
    	},
    	"-ms-scrollbar-highlight-color": {
    		syntax: "<color>"
    	},
    	"-ms-scrollbar-shadow-color": {
    		syntax: "<color>"
    	},
    	"-ms-scrollbar-track-color": {
    		syntax: "<color>"
    	},
    	"-ms-text-autospace": {
    		syntax: "none | ideograph-alpha | ideograph-numeric | ideograph-parenthesis | ideograph-space"
    	},
    	"-ms-touch-select": {
    		syntax: "grippers | none"
    	},
    	"-ms-user-select": {
    		syntax: "none | element | text"
    	},
    	"-ms-wrap-flow": {
    		syntax: "auto | both | start | end | maximum | clear"
    	},
    	"-ms-wrap-margin": {
    		syntax: "<length>"
    	},
    	"-ms-wrap-through": {
    		syntax: "wrap | none"
    	},
    	"-moz-appearance": {
    		syntax: "none | button | button-arrow-down | button-arrow-next | button-arrow-previous | button-arrow-up | button-bevel | button-focus | caret | checkbox | checkbox-container | checkbox-label | checkmenuitem | dualbutton | groupbox | listbox | listitem | menuarrow | menubar | menucheckbox | menuimage | menuitem | menuitemtext | menulist | menulist-button | menulist-text | menulist-textfield | menupopup | menuradio | menuseparator | meterbar | meterchunk | progressbar | progressbar-vertical | progresschunk | progresschunk-vertical | radio | radio-container | radio-label | radiomenuitem | range | range-thumb | resizer | resizerpanel | scale-horizontal | scalethumbend | scalethumb-horizontal | scalethumbstart | scalethumbtick | scalethumb-vertical | scale-vertical | scrollbarbutton-down | scrollbarbutton-left | scrollbarbutton-right | scrollbarbutton-up | scrollbarthumb-horizontal | scrollbarthumb-vertical | scrollbartrack-horizontal | scrollbartrack-vertical | searchfield | separator | sheet | spinner | spinner-downbutton | spinner-textfield | spinner-upbutton | splitter | statusbar | statusbarpanel | tab | tabpanel | tabpanels | tab-scroll-arrow-back | tab-scroll-arrow-forward | textfield | textfield-multiline | toolbar | toolbarbutton | toolbarbutton-dropdown | toolbargripper | toolbox | tooltip | treeheader | treeheadercell | treeheadersortarrow | treeitem | treeline | treetwisty | treetwistyopen | treeview | -moz-mac-unified-toolbar | -moz-win-borderless-glass | -moz-win-browsertabbar-toolbox | -moz-win-communicationstext | -moz-win-communications-toolbox | -moz-win-exclude-glass | -moz-win-glass | -moz-win-mediatext | -moz-win-media-toolbox | -moz-window-button-box | -moz-window-button-box-maximized | -moz-window-button-close | -moz-window-button-maximize | -moz-window-button-minimize | -moz-window-button-restore | -moz-window-frame-bottom | -moz-window-frame-left | -moz-window-frame-right | -moz-window-titlebar | -moz-window-titlebar-maximized"
    	},
    	"-moz-binding": {
    		syntax: "<url> | none"
    	},
    	"-moz-border-bottom-colors": {
    		syntax: "<color>+ | none"
    	},
    	"-moz-border-left-colors": {
    		syntax: "<color>+ | none"
    	},
    	"-moz-border-right-colors": {
    		syntax: "<color>+ | none"
    	},
    	"-moz-border-top-colors": {
    		syntax: "<color>+ | none"
    	},
    	"-moz-context-properties": {
    		syntax: "none | [ fill | fill-opacity | stroke | stroke-opacity ]#"
    	},
    	"-moz-float-edge": {
    		syntax: "border-box | content-box | margin-box | padding-box"
    	},
    	"-moz-force-broken-image-icon": {
    		syntax: "0 | 1"
    	},
    	"-moz-orient": {
    		syntax: "inline | block | horizontal | vertical"
    	},
    	"-moz-outline-radius": {
    		syntax: "<outline-radius>{1,4} [ / <outline-radius>{1,4} ]?"
    	},
    	"-moz-outline-radius-bottomleft": {
    		syntax: "<outline-radius>"
    	},
    	"-moz-outline-radius-bottomright": {
    		syntax: "<outline-radius>"
    	},
    	"-moz-outline-radius-topleft": {
    		syntax: "<outline-radius>"
    	},
    	"-moz-outline-radius-topright": {
    		syntax: "<outline-radius>"
    	},
    	"-moz-stack-sizing": {
    		syntax: "ignore | stretch-to-fit"
    	},
    	"-moz-text-blink": {
    		syntax: "none | blink"
    	},
    	"-moz-user-focus": {
    		syntax: "ignore | normal | select-after | select-before | select-menu | select-same | select-all | none"
    	},
    	"-moz-user-input": {
    		syntax: "auto | none | enabled | disabled"
    	},
    	"-moz-user-modify": {
    		syntax: "read-only | read-write | write-only"
    	},
    	"-moz-window-dragging": {
    		syntax: "drag | no-drag"
    	},
    	"-moz-window-shadow": {
    		syntax: "default | menu | tooltip | sheet | none"
    	},
    	"-webkit-appearance": {
    		syntax: "none | button | button-bevel | caret | checkbox | default-button | inner-spin-button | listbox | listitem | media-controls-background | media-controls-fullscreen-background | media-current-time-display | media-enter-fullscreen-button | media-exit-fullscreen-button | media-fullscreen-button | media-mute-button | media-overlay-play-button | media-play-button | media-seek-back-button | media-seek-forward-button | media-slider | media-sliderthumb | media-time-remaining-display | media-toggle-closed-captions-button | media-volume-slider | media-volume-slider-container | media-volume-sliderthumb | menulist | menulist-button | menulist-text | menulist-textfield | meter | progress-bar | progress-bar-value | push-button | radio | searchfield | searchfield-cancel-button | searchfield-decoration | searchfield-results-button | searchfield-results-decoration | slider-horizontal | slider-vertical | sliderthumb-horizontal | sliderthumb-vertical | square-button | textarea | textfield | -apple-pay-button none | button | button-bevel | caps-lock-indicator | caret | checkbox | default-button | inner-spin-button | listbox | listitem | media-controls-background | media-controls-fullscreen-background | media-current-time-display | media-enter-fullscreen-button | media-exit-fullscreen-button | media-fullscreen-button | media-mute-button | media-overlay-play-button | media-play-button | media-seek-back-button | media-seek-forward-button | media-slider | media-sliderthumb | media-time-remaining-display | media-toggle-closed-captions-button | media-volume-slider | media-volume-slider-container | media-volume-sliderthumb | menulist | menulist-button | menulist-text | menulist-textfield | meter | progress-bar | progress-bar-value | push-button | radio | scrollbarbutton-down | scrollbarbutton-left | scrollbarbutton-right | scrollbarbutton-up | scrollbargripper-horizontal | scrollbargripper-vertical | scrollbarthumb-horizontal | scrollbarthumb-vertical | scrollbartrack-horizontal | scrollbartrack-vertical | searchfield | searchfield-cancel-button | searchfield-decoration | searchfield-results-button | searchfield-results-decoration | slider-horizontal | slider-vertical | sliderthumb-horizontal | sliderthumb-vertical | square-button | textarea | textfield | -apple-pay-button"
    	},
    	"-webkit-border-before": {
    		syntax: "<'border-width'> || <'border-style'> || <color>"
    	},
    	"-webkit-border-before-color": {
    		syntax: "<color>"
    	},
    	"-webkit-border-before-style": {
    		syntax: "<'border-style'>"
    	},
    	"-webkit-border-before-width": {
    		syntax: "<'border-width'>"
    	},
    	"-webkit-box-reflect": {
    		syntax: "[ above | below | right | left ]? <length>? <image>?"
    	},
    	"-webkit-line-clamp": {
    		syntax: "none | <integer>"
    	},
    	"-webkit-mask": {
    		syntax: "[ <mask-reference> || <position> [ / <bg-size> ]? || <repeat-style> || [ <visual-box> | border | padding | content | text ] || [ <visual-box> | border | padding | content ] ]#"
    	},
    	"-webkit-mask-attachment": {
    		syntax: "<attachment>#"
    	},
    	"-webkit-mask-clip": {
    		syntax: "[ <coord-box> | no-clip | border | padding | content | text ]#"
    	},
    	"-webkit-mask-composite": {
    		syntax: "<composite-style>#"
    	},
    	"-webkit-mask-image": {
    		syntax: "<mask-reference>#"
    	},
    	"-webkit-mask-origin": {
    		syntax: "[ <coord-box> | border | padding | content ]#"
    	},
    	"-webkit-mask-position": {
    		syntax: "<position>#"
    	},
    	"-webkit-mask-position-x": {
    		syntax: "[ <length-percentage> | left | center | right ]#"
    	},
    	"-webkit-mask-position-y": {
    		syntax: "[ <length-percentage> | top | center | bottom ]#"
    	},
    	"-webkit-mask-repeat": {
    		syntax: "<repeat-style>#"
    	},
    	"-webkit-mask-repeat-x": {
    		syntax: "repeat | no-repeat | space | round"
    	},
    	"-webkit-mask-repeat-y": {
    		syntax: "repeat | no-repeat | space | round"
    	},
    	"-webkit-mask-size": {
    		syntax: "<bg-size>#"
    	},
    	"-webkit-overflow-scrolling": {
    		syntax: "auto | touch"
    	},
    	"-webkit-tap-highlight-color": {
    		syntax: "<color>"
    	},
    	"-webkit-text-fill-color": {
    		syntax: "<color>"
    	},
    	"-webkit-text-stroke": {
    		syntax: "<length> || <color>"
    	},
    	"-webkit-text-stroke-color": {
    		syntax: "<color>"
    	},
    	"-webkit-text-stroke-width": {
    		syntax: "<length>"
    	},
    	"-webkit-touch-callout": {
    		syntax: "default | none"
    	},
    	"-webkit-user-modify": {
    		syntax: "read-only | read-write | read-write-plaintext-only"
    	},
    	"-webkit-user-select": {
    		syntax: "auto | text | none | all auto | none | text | all"
    	},
    	"accent-color": {
    		syntax: "auto | <color>"
    	},
    	"align-content": {
    		syntax: "normal | <baseline-position> | <content-distribution> | <overflow-position>? <content-position>"
    	},
    	"align-items": {
    		syntax: "normal | stretch | <baseline-position> | [ <overflow-position>? <self-position> ] | anchor-center"
    	},
    	"align-self": {
    		syntax: "auto | normal | stretch | <baseline-position> | <overflow-position>? <self-position> | anchor-center"
    	},
    	"align-tracks": {
    		syntax: "[ normal | <baseline-position> | <content-distribution> | <overflow-position>? <content-position> ]#"
    	},
    	"alignment-baseline": {
    		syntax: "baseline | alphabetic | ideographic | middle | central | mathematical | text-before-edge | text-after-edge auto | baseline | before-edge | text-before-edge | middle | central | after-edge | text-after-edge | ideographic | alphabetic | hanging | mathematical"
    	},
    	all: {
    		syntax: "initial | inherit | unset | revert | revert-layer"
    	},
    	"anchor-name": {
    		syntax: "none | <dashed-ident>#"
    	},
    	"anchor-scope": {
    		syntax: "none | all | <dashed-ident>#"
    	},
    	animation: {
    		syntax: "<single-animation>#"
    	},
    	"animation-composition": {
    		syntax: "<single-animation-composition>#"
    	},
    	"animation-delay": {
    		syntax: "<time>#"
    	},
    	"animation-direction": {
    		syntax: "<single-animation-direction>#"
    	},
    	"animation-duration": {
    		syntax: "[ auto | <time [0s,∞]> ]#"
    	},
    	"animation-fill-mode": {
    		syntax: "<single-animation-fill-mode>#"
    	},
    	"animation-iteration-count": {
    		syntax: "<single-animation-iteration-count>#"
    	},
    	"animation-name": {
    		syntax: "[ none | <keyframes-name> ]#"
    	},
    	"animation-play-state": {
    		syntax: "<single-animation-play-state>#"
    	},
    	"animation-range": {
    		syntax: "[ <'animation-range-start'> <'animation-range-end'>? ]#"
    	},
    	"animation-range-end": {
    		syntax: "[ normal | <length-percentage> | <timeline-range-name> <length-percentage>? ]#"
    	},
    	"animation-range-start": {
    		syntax: "[ normal | <length-percentage> | <timeline-range-name> <length-percentage>? ]#"
    	},
    	"animation-timeline": {
    		syntax: "<single-animation-timeline>#"
    	},
    	"animation-timing-function": {
    		syntax: "<easing-function>#"
    	},
    	appearance: {
    		syntax: "none | auto | <compat-auto> | <compat-special>"
    	},
    	"aspect-ratio": {
    		syntax: "auto || <ratio>"
    	},
    	"backdrop-filter": {
    		syntax: "none | <filter-value-list>"
    	},
    	"backface-visibility": {
    		syntax: "visible | hidden"
    	},
    	background: {
    		syntax: "<bg-layer>#? , <final-bg-layer>"
    	},
    	"background-attachment": {
    		syntax: "<attachment>#"
    	},
    	"background-blend-mode": {
    		syntax: "<blend-mode>#"
    	},
    	"background-clip": {
    		syntax: "<bg-clip>#"
    	},
    	"background-color": {
    		syntax: "<color>"
    	},
    	"background-image": {
    		syntax: "<bg-image>#"
    	},
    	"background-origin": {
    		syntax: "<visual-box>#"
    	},
    	"background-position": {
    		syntax: "<bg-position>#"
    	},
    	"background-position-x": {
    		syntax: "[ center | [ [ left | right | x-start | x-end ]? <length-percentage>? ]! ]#"
    	},
    	"background-position-y": {
    		syntax: "[ center | [ [ top | bottom | y-start | y-end ]? <length-percentage>? ]! ]#"
    	},
    	"background-repeat": {
    		syntax: "<repeat-style>#"
    	},
    	"background-size": {
    		syntax: "<bg-size>#"
    	},
    	"baseline-shift": {
    		syntax: "<length-percentage> | sub | super | baseline baseline | sub | super | <svg-length>"
    	},
    	"block-size": {
    		syntax: "<'width'>"
    	},
    	border: {
    		syntax: "<line-width> || <line-style> || <color>"
    	},
    	"border-block": {
    		syntax: "<'border-block-start'>"
    	},
    	"border-block-color": {
    		syntax: "<'border-top-color'>{1,2}"
    	},
    	"border-block-end": {
    		syntax: "<'border-top-width'> || <'border-top-style'> || <color>"
    	},
    	"border-block-end-color": {
    		syntax: "<'border-top-color'>"
    	},
    	"border-block-end-style": {
    		syntax: "<'border-top-style'>"
    	},
    	"border-block-end-width": {
    		syntax: "<'border-top-width'>"
    	},
    	"border-block-start": {
    		syntax: "<'border-top-width'> || <'border-top-style'> || <color>"
    	},
    	"border-block-start-color": {
    		syntax: "<'border-top-color'>"
    	},
    	"border-block-start-style": {
    		syntax: "<'border-top-style'>"
    	},
    	"border-block-start-width": {
    		syntax: "<'border-top-width'>"
    	},
    	"border-block-style": {
    		syntax: "<'border-top-style'>{1,2}"
    	},
    	"border-block-width": {
    		syntax: "<'border-top-width'>{1,2}"
    	},
    	"border-bottom": {
    		syntax: "<line-width> || <line-style> || <color>"
    	},
    	"border-bottom-color": {
    		syntax: "<'border-top-color'>"
    	},
    	"border-bottom-left-radius": {
    		syntax: "<length-percentage [0,∞]>{1,2}"
    	},
    	"border-bottom-right-radius": {
    		syntax: "<length-percentage [0,∞]>{1,2}"
    	},
    	"border-bottom-style": {
    		syntax: "<line-style>"
    	},
    	"border-bottom-width": {
    		syntax: "<line-width>"
    	},
    	"border-collapse": {
    		syntax: "separate | collapse"
    	},
    	"border-color": {
    		syntax: "<color>{1,4}"
    	},
    	"border-end-end-radius": {
    		syntax: "<'border-top-left-radius'>"
    	},
    	"border-end-start-radius": {
    		syntax: "<'border-top-left-radius'>"
    	},
    	"border-image": {
    		syntax: "<'border-image-source'> || <'border-image-slice'> [ / <'border-image-width'> | / <'border-image-width'>? / <'border-image-outset'> ]? || <'border-image-repeat'>"
    	},
    	"border-image-outset": {
    		syntax: "[ <length [0,∞]> | <number [0,∞]> ]{1,4}  "
    	},
    	"border-image-repeat": {
    		syntax: "[ stretch | repeat | round | space ]{1,2}"
    	},
    	"border-image-slice": {
    		syntax: "[ <number [0,∞]> | <percentage [0,∞]> ]{1,4}  && fill?"
    	},
    	"border-image-source": {
    		syntax: "none | <image>"
    	},
    	"border-image-width": {
    		syntax: "[ <length-percentage [0,∞]> | <number [0,∞]> | auto ]{1,4}"
    	},
    	"border-inline": {
    		syntax: "<'border-block-start'>"
    	},
    	"border-inline-color": {
    		syntax: "<'border-top-color'>{1,2}"
    	},
    	"border-inline-end": {
    		syntax: "<'border-top-width'> || <'border-top-style'> || <color>"
    	},
    	"border-inline-end-color": {
    		syntax: "<'border-top-color'>"
    	},
    	"border-inline-end-style": {
    		syntax: "<'border-top-style'>"
    	},
    	"border-inline-end-width": {
    		syntax: "<'border-top-width'>"
    	},
    	"border-inline-start": {
    		syntax: "<'border-top-width'> || <'border-top-style'> || <color>"
    	},
    	"border-inline-start-color": {
    		syntax: "<'border-top-color'>"
    	},
    	"border-inline-start-style": {
    		syntax: "<'border-top-style'>"
    	},
    	"border-inline-start-width": {
    		syntax: "<'border-top-width'>"
    	},
    	"border-inline-style": {
    		syntax: "<'border-top-style'>{1,2}"
    	},
    	"border-inline-width": {
    		syntax: "<'border-top-width'>{1,2}"
    	},
    	"border-left": {
    		syntax: "<line-width> || <line-style> || <color>"
    	},
    	"border-left-color": {
    		syntax: "<color>"
    	},
    	"border-left-style": {
    		syntax: "<line-style>"
    	},
    	"border-left-width": {
    		syntax: "<line-width>"
    	},
    	"border-radius": {
    		syntax: "<length-percentage [0,∞]>{1,4} [ / <length-percentage [0,∞]>{1,4} ]?"
    	},
    	"border-right": {
    		syntax: "<line-width> || <line-style> || <color>"
    	},
    	"border-right-color": {
    		syntax: "<color>"
    	},
    	"border-right-style": {
    		syntax: "<line-style>"
    	},
    	"border-right-width": {
    		syntax: "<line-width>"
    	},
    	"border-spacing": {
    		syntax: "<length>{1,2}"
    	},
    	"border-start-end-radius": {
    		syntax: "<'border-top-left-radius'>"
    	},
    	"border-start-start-radius": {
    		syntax: "<'border-top-left-radius'>"
    	},
    	"border-style": {
    		syntax: "<line-style>{1,4}"
    	},
    	"border-top": {
    		syntax: "<line-width> || <line-style> || <color>"
    	},
    	"border-top-color": {
    		syntax: "<color>"
    	},
    	"border-top-left-radius": {
    		syntax: "<length-percentage [0,∞]>{1,2}"
    	},
    	"border-top-right-radius": {
    		syntax: "<length-percentage [0,∞]>{1,2}"
    	},
    	"border-top-style": {
    		syntax: "<line-style>"
    	},
    	"border-top-width": {
    		syntax: "<line-width>"
    	},
    	"border-width": {
    		syntax: "<line-width>{1,4}"
    	},
    	bottom: {
    		syntax: "auto | <length-percentage> | <anchor()> | <anchor-size()>"
    	},
    	"box-align": {
    		syntax: "start | center | end | baseline | stretch"
    	},
    	"box-decoration-break": {
    		syntax: "slice | clone"
    	},
    	"box-direction": {
    		syntax: "normal | reverse | inherit"
    	},
    	"box-flex": {
    		syntax: "<number>"
    	},
    	"box-flex-group": {
    		syntax: "<integer>"
    	},
    	"box-lines": {
    		syntax: "single | multiple"
    	},
    	"box-ordinal-group": {
    		syntax: "<integer>"
    	},
    	"box-orient": {
    		syntax: "horizontal | vertical | inline-axis | block-axis | inherit"
    	},
    	"box-pack": {
    		syntax: "start | center | end | justify"
    	},
    	"box-shadow": {
    		syntax: "none | <shadow>#"
    	},
    	"box-sizing": {
    		syntax: "content-box | border-box"
    	},
    	"break-after": {
    		syntax: "auto | avoid | always | all | avoid-page | page | left | right | recto | verso | avoid-column | column | avoid-region | region"
    	},
    	"break-before": {
    		syntax: "auto | avoid | always | all | avoid-page | page | left | right | recto | verso | avoid-column | column | avoid-region | region"
    	},
    	"break-inside": {
    		syntax: "auto | avoid | avoid-page | avoid-column | avoid-region"
    	},
    	"caption-side": {
    		syntax: "top | bottom"
    	},
    	caret: {
    		syntax: "<'caret-color'> || <'caret-shape'>"
    	},
    	"caret-color": {
    		syntax: "auto | <color>"
    	},
    	"caret-shape": {
    		syntax: "auto | bar | block | underscore"
    	},
    	clear: {
    		syntax: "none | left | right | both | inline-start | inline-end"
    	},
    	clip: {
    		syntax: "<shape> | auto"
    	},
    	"clip-path": {
    		syntax: "<clip-source> | [ <basic-shape> || <geometry-box> ] | none"
    	},
    	"clip-rule": {
    		syntax: "nonzero | evenodd"
    	},
    	color: {
    		syntax: "<color>"
    	},
    	"color-interpolation-filters": {
    		syntax: "auto | sRGB | linearRGB"
    	},
    	"color-scheme": {
    		syntax: "normal | [ light | dark | <custom-ident> ]+ && only?"
    	},
    	"column-count": {
    		syntax: "<integer> | auto"
    	},
    	"column-fill": {
    		syntax: "auto | balance"
    	},
    	"column-gap": {
    		syntax: "normal | <length-percentage>"
    	},
    	"column-rule": {
    		syntax: "<'column-rule-width'> || <'column-rule-style'> || <'column-rule-color'>"
    	},
    	"column-rule-color": {
    		syntax: "<color>"
    	},
    	"column-rule-style": {
    		syntax: "<'border-style'>"
    	},
    	"column-rule-width": {
    		syntax: "<'border-width'>"
    	},
    	"column-span": {
    		syntax: "none | all"
    	},
    	"column-width": {
    		syntax: "<length> | auto"
    	},
    	columns: {
    		syntax: "<'column-width'> || <'column-count'>"
    	},
    	contain: {
    		syntax: "none | strict | content | [ [ size || inline-size ] || layout || style || paint ]"
    	},
    	"contain-intrinsic-block-size": {
    		syntax: "auto? [ none | <length> ]"
    	},
    	"contain-intrinsic-height": {
    		syntax: "auto? [ none | <length> ]"
    	},
    	"contain-intrinsic-inline-size": {
    		syntax: "auto? [ none | <length> ]"
    	},
    	"contain-intrinsic-size": {
    		syntax: "[ auto? [ none | <length> ] ]{1,2}"
    	},
    	"contain-intrinsic-width": {
    		syntax: "auto? [ none | <length> ]"
    	},
    	container: {
    		syntax: "<'container-name'> [ / <'container-type'> ]?"
    	},
    	"container-name": {
    		syntax: "none | <custom-ident>+"
    	},
    	"container-type": {
    		syntax: "normal | [ [ size | inline-size ] || scroll-state ]"
    	},
    	content: {
    		syntax: "normal | none | [ <content-replacement> | <content-list> ] [ / [ <string> | <counter> | <attr()> ]+ ]?"
    	},
    	"content-visibility": {
    		syntax: "visible | auto | hidden"
    	},
    	"counter-increment": {
    		syntax: "[ <counter-name> <integer>? ]+ | none"
    	},
    	"counter-reset": {
    		syntax: "[ <counter-name> <integer>? | <reversed-counter-name> <integer>? ]+ | none"
    	},
    	"counter-set": {
    		syntax: "[ <counter-name> <integer>? ]+ | none"
    	},
    	cursor: {
    		syntax: "[ [ <url> [ <x> <y> ]? , ]* <cursor-predefined> ] [ [ <url> [ <x> <y> ]? , ]* [ auto | default | none | context-menu | help | pointer | progress | wait | cell | crosshair | text | vertical-text | alias | copy | move | no-drop | not-allowed | e-resize | n-resize | ne-resize | nw-resize | s-resize | se-resize | sw-resize | w-resize | ew-resize | ns-resize | nesw-resize | nwse-resize | col-resize | row-resize | all-scroll | zoom-in | zoom-out | grab | grabbing | hand | -webkit-grab | -webkit-grabbing | -webkit-zoom-in | -webkit-zoom-out | -moz-grab | -moz-grabbing | -moz-zoom-in | -moz-zoom-out ] ]"
    	},
    	cx: {
    		syntax: "<length> | <percentage>"
    	},
    	cy: {
    		syntax: "<length> | <percentage>"
    	},
    	d: {
    		syntax: "none | path(<string>)"
    	},
    	direction: {
    		syntax: "ltr | rtl"
    	},
    	display: {
    		syntax: "[ <display-outside> || <display-inside> ] | <display-listitem> | <display-internal> | <display-box> | <display-legacy> | <-non-standard-display>"
    	},
    	"dominant-baseline": {
    		syntax: "auto | text-bottom | alphabetic | ideographic | middle | central | mathematical | hanging | text-top auto | use-script | no-change | reset-size | ideographic | alphabetic | hanging | mathematical | central | middle | text-after-edge | text-before-edge"
    	},
    	"empty-cells": {
    		syntax: "show | hide"
    	},
    	"field-sizing": {
    		syntax: "content | fixed"
    	},
    	fill: {
    		syntax: "<paint>"
    	},
    	"fill-opacity": {
    		syntax: "<'opacity'> <number-zero-one>"
    	},
    	"fill-rule": {
    		syntax: "nonzero | evenodd"
    	},
    	filter: {
    		syntax: "none | <filter-value-list> | <-ms-filter-function-list>"
    	},
    	flex: {
    		syntax: "none | [ <'flex-grow'> <'flex-shrink'>? || <'flex-basis'> ]"
    	},
    	"flex-basis": {
    		syntax: "content | <'width'>"
    	},
    	"flex-direction": {
    		syntax: "row | row-reverse | column | column-reverse"
    	},
    	"flex-flow": {
    		syntax: "<'flex-direction'> || <'flex-wrap'>"
    	},
    	"flex-grow": {
    		syntax: "<number>"
    	},
    	"flex-shrink": {
    		syntax: "<number>"
    	},
    	"flex-wrap": {
    		syntax: "nowrap | wrap | wrap-reverse"
    	},
    	float: {
    		syntax: "left | right | none | inline-start | inline-end"
    	},
    	"flood-color": {
    		syntax: "<color>"
    	},
    	"flood-opacity": {
    		syntax: "<'opacity'>"
    	},
    	font: {
    		syntax: "[ [ <'font-style'> || <font-variant-css2> || <'font-weight'> || <font-width-css3> ]? <'font-size'> [ / <'line-height'> ]? <'font-family'># ] | <system-family-name> [ [ <'font-style'> || <font-variant-css2> || <'font-weight'> || <font-width-css3> ]? <'font-size'> [ / <'line-height'> ]? <'font-family'># ] | <system-family-name> | <-non-standard-font>"
    	},
    	"font-family": {
    		syntax: "[ <family-name> | <generic-family> ]#"
    	},
    	"font-feature-settings": {
    		syntax: "normal | <feature-tag-value>#"
    	},
    	"font-kerning": {
    		syntax: "auto | normal | none"
    	},
    	"font-language-override": {
    		syntax: "normal | <string>"
    	},
    	"font-optical-sizing": {
    		syntax: "auto | none"
    	},
    	"font-palette": {
    		syntax: "normal | light | dark | <palette-identifier> | <palette-mix()>"
    	},
    	"font-size": {
    		syntax: "<absolute-size> | <relative-size> | <length-percentage [0,∞]> | math"
    	},
    	"font-size-adjust": {
    		syntax: "none | [ ex-height | cap-height | ch-width | ic-width | ic-height ]? [ from-font | <number> ]"
    	},
    	"font-smooth": {
    		syntax: "auto | never | always | <absolute-size> | <length>"
    	},
    	"font-stretch": {
    		syntax: "<font-stretch-absolute>"
    	},
    	"font-style": {
    		syntax: "normal | italic | oblique <angle>?"
    	},
    	"font-synthesis": {
    		syntax: "none | [ weight || style || small-caps || position]"
    	},
    	"font-synthesis-position": {
    		syntax: "auto | none"
    	},
    	"font-synthesis-small-caps": {
    		syntax: "auto | none"
    	},
    	"font-synthesis-style": {
    		syntax: "auto | none"
    	},
    	"font-synthesis-weight": {
    		syntax: "auto | none"
    	},
    	"font-variant": {
    		syntax: "normal | none | [ <common-lig-values> || <discretionary-lig-values> || <historical-lig-values> || <contextual-alt-values> || stylistic( <feature-value-name> ) || historical-forms || styleset( <feature-value-name># ) || character-variant( <feature-value-name># ) || swash( <feature-value-name> ) || ornaments( <feature-value-name> ) || annotation( <feature-value-name> ) || [ small-caps | all-small-caps | petite-caps | all-petite-caps | unicase | titling-caps ] || <numeric-figure-values> || <numeric-spacing-values> || <numeric-fraction-values> || ordinal || slashed-zero || <east-asian-variant-values> || <east-asian-width-values> || ruby ]"
    	},
    	"font-variant-alternates": {
    		syntax: "normal | [ stylistic( <feature-value-name> ) || historical-forms || styleset( <feature-value-name># ) || character-variant( <feature-value-name># ) || swash( <feature-value-name> ) || ornaments( <feature-value-name> ) || annotation( <feature-value-name> ) ]"
    	},
    	"font-variant-caps": {
    		syntax: "normal | small-caps | all-small-caps | petite-caps | all-petite-caps | unicase | titling-caps"
    	},
    	"font-variant-east-asian": {
    		syntax: "normal | [ <east-asian-variant-values> || <east-asian-width-values> || ruby ]"
    	},
    	"font-variant-emoji": {
    		syntax: "normal | text | emoji | unicode"
    	},
    	"font-variant-ligatures": {
    		syntax: "normal | none | [ <common-lig-values> || <discretionary-lig-values> || <historical-lig-values> || <contextual-alt-values> ]"
    	},
    	"font-variant-numeric": {
    		syntax: "normal | [ <numeric-figure-values> || <numeric-spacing-values> || <numeric-fraction-values> || ordinal || slashed-zero ]"
    	},
    	"font-variant-position": {
    		syntax: "normal | sub | super"
    	},
    	"font-variation-settings": {
    		syntax: "normal | [ <string> <number> ]#"
    	},
    	"font-weight": {
    		syntax: "<font-weight-absolute> | bolder | lighter"
    	},
    	"font-width": {
    		syntax: "normal | <percentage [0,∞]> | ultra-condensed | extra-condensed | condensed | semi-condensed | semi-expanded | expanded | extra-expanded | ultra-expanded"
    	},
    	"forced-color-adjust": {
    		syntax: "auto | none | preserve-parent-color"
    	},
    	gap: {
    		syntax: "<'row-gap'> <'column-gap'>?"
    	},
    	grid: {
    		syntax: "<'grid-template'> | <'grid-template-rows'> / [ auto-flow && dense? ] <'grid-auto-columns'>? | [ auto-flow && dense? ] <'grid-auto-rows'>? / <'grid-template-columns'>"
    	},
    	"grid-area": {
    		syntax: "<grid-line> [ / <grid-line> ]{0,3}"
    	},
    	"grid-auto-columns": {
    		syntax: "<track-size>+"
    	},
    	"grid-auto-flow": {
    		syntax: "[ row | column ] || dense"
    	},
    	"grid-auto-rows": {
    		syntax: "<track-size>+"
    	},
    	"grid-column": {
    		syntax: "<grid-line> [ / <grid-line> ]?"
    	},
    	"grid-column-end": {
    		syntax: "<grid-line>"
    	},
    	"grid-column-gap": {
    		syntax: "<length-percentage>"
    	},
    	"grid-column-start": {
    		syntax: "<grid-line>"
    	},
    	"grid-gap": {
    		syntax: "<'grid-row-gap'> <'grid-column-gap'>?"
    	},
    	"grid-row": {
    		syntax: "<grid-line> [ / <grid-line> ]?"
    	},
    	"grid-row-end": {
    		syntax: "<grid-line>"
    	},
    	"grid-row-gap": {
    		syntax: "<length-percentage>"
    	},
    	"grid-row-start": {
    		syntax: "<grid-line>"
    	},
    	"grid-template": {
    		syntax: "none | [ <'grid-template-rows'> / <'grid-template-columns'> ] | [ <line-names>? <string> <track-size>? <line-names>? ]+ [ / <explicit-track-list> ]?"
    	},
    	"grid-template-areas": {
    		syntax: "none | <string>+"
    	},
    	"grid-template-columns": {
    		syntax: "none | <track-list> | <auto-track-list> | subgrid <line-name-list>?"
    	},
    	"grid-template-rows": {
    		syntax: "none | <track-list> | <auto-track-list> | subgrid <line-name-list>?"
    	},
    	"hanging-punctuation": {
    		syntax: "none | [ first || [ force-end | allow-end ] || last ]"
    	},
    	height: {
    		syntax: "auto | <length-percentage [0,∞]> | min-content | max-content | fit-content | fit-content(<length-percentage [0,∞]>) | <calc-size()> | <anchor-size()> | stretch | <-non-standard-size>"
    	},
    	"hyphenate-character": {
    		syntax: "auto | <string>"
    	},
    	"hyphenate-limit-chars": {
    		syntax: "[ auto | <integer> ]{1,3}"
    	},
    	hyphens: {
    		syntax: "none | manual | auto"
    	},
    	"image-orientation": {
    		syntax: "from-image | <angle> | [ <angle>? flip ]"
    	},
    	"image-rendering": {
    		syntax: "auto | crisp-edges | pixelated | smooth | optimizeSpeed | optimizeQuality | <-non-standard-image-rendering>"
    	},
    	"image-resolution": {
    		syntax: "[ from-image || <resolution> ] && snap?"
    	},
    	"ime-mode": {
    		syntax: "auto | normal | active | inactive | disabled"
    	},
    	"initial-letter": {
    		syntax: "normal | [ <number> <integer>? ]"
    	},
    	"initial-letter-align": {
    		syntax: "[ auto | alphabetic | hanging | ideographic ]"
    	},
    	"inline-size": {
    		syntax: "<'width'>"
    	},
    	inset: {
    		syntax: "<'top'>{1,4}"
    	},
    	"inset-block": {
    		syntax: "<'top'>{1,2}"
    	},
    	"inset-block-end": {
    		syntax: "<'top'>"
    	},
    	"inset-block-start": {
    		syntax: "<'top'>"
    	},
    	"inset-inline": {
    		syntax: "<'top'>{1,2}"
    	},
    	"inset-inline-end": {
    		syntax: "<'top'>"
    	},
    	"inset-inline-start": {
    		syntax: "<'top'>"
    	},
    	"interpolate-size": {
    		syntax: "numeric-only | allow-keywords"
    	},
    	isolation: {
    		syntax: "auto | isolate"
    	},
    	"justify-content": {
    		syntax: "normal | <content-distribution> | <overflow-position>? [ <content-position> | left | right ]"
    	},
    	"justify-items": {
    		syntax: "normal | stretch | <baseline-position> | <overflow-position>? [ <self-position> | left | right ] | legacy | legacy && [ left | right | center ] | anchor-center"
    	},
    	"justify-self": {
    		syntax: "auto | normal | stretch | <baseline-position> | <overflow-position>? [ <self-position> | left | right ] | anchor-center"
    	},
    	"justify-tracks": {
    		syntax: "[ normal | <content-distribution> | <overflow-position>? [ <content-position> | left | right ] ]#"
    	},
    	left: {
    		syntax: "auto | <length-percentage> | <anchor()> | <anchor-size()>"
    	},
    	"letter-spacing": {
    		syntax: "normal | <length> normal | <length-percentage>"
    	},
    	"lighting-color": {
    		syntax: "<color>"
    	},
    	"line-break": {
    		syntax: "auto | loose | normal | strict | anywhere"
    	},
    	"line-clamp": {
    		syntax: "none | <integer>"
    	},
    	"line-height": {
    		syntax: "normal | <number> | <length> | <percentage>"
    	},
    	"line-height-step": {
    		syntax: "<length>"
    	},
    	"list-style": {
    		syntax: "<'list-style-type'> || <'list-style-position'> || <'list-style-image'>"
    	},
    	"list-style-image": {
    		syntax: "<image> | none"
    	},
    	"list-style-position": {
    		syntax: "inside | outside"
    	},
    	"list-style-type": {
    		syntax: "<counter-style> | <string> | none"
    	},
    	margin: {
    		syntax: "<'margin-top'>{1,4}"
    	},
    	"margin-block": {
    		syntax: "<'margin-top'>{1,2}"
    	},
    	"margin-block-end": {
    		syntax: "<'margin-top'>"
    	},
    	"margin-block-start": {
    		syntax: "<'margin-top'>"
    	},
    	"margin-bottom": {
    		syntax: "<length-percentage> | auto | <anchor-size()>"
    	},
    	"margin-inline": {
    		syntax: "<'margin-top'>{1,2}"
    	},
    	"margin-inline-end": {
    		syntax: "<'margin-top'>"
    	},
    	"margin-inline-start": {
    		syntax: "<'margin-top'>"
    	},
    	"margin-left": {
    		syntax: "<length-percentage> | auto | <anchor-size()>"
    	},
    	"margin-right": {
    		syntax: "<length-percentage> | auto | <anchor-size()>"
    	},
    	"margin-top": {
    		syntax: "<length-percentage> | auto | <anchor-size()>"
    	},
    	"margin-trim": {
    		syntax: "none | in-flow | all"
    	},
    	marker: {
    		syntax: "none | <url>"
    	},
    	"marker-end": {
    		syntax: "none | <url>"
    	},
    	"marker-mid": {
    		syntax: "none | <url>"
    	},
    	"marker-start": {
    		syntax: "none | <url>"
    	},
    	mask: {
    		syntax: "<mask-layer>#"
    	},
    	"mask-border": {
    		syntax: "<'mask-border-source'> || <'mask-border-slice'> [ / <'mask-border-width'>? [ / <'mask-border-outset'> ]? ]? || <'mask-border-repeat'> || <'mask-border-mode'>"
    	},
    	"mask-border-mode": {
    		syntax: "luminance | alpha"
    	},
    	"mask-border-outset": {
    		syntax: "[ <length> | <number> ]{1,4}"
    	},
    	"mask-border-repeat": {
    		syntax: "[ stretch | repeat | round | space ]{1,2}"
    	},
    	"mask-border-slice": {
    		syntax: "<number-percentage>{1,4} fill?"
    	},
    	"mask-border-source": {
    		syntax: "none | <image>"
    	},
    	"mask-border-width": {
    		syntax: "[ <length-percentage> | <number> | auto ]{1,4}"
    	},
    	"mask-clip": {
    		syntax: "[ <coord-box> | no-clip ]#"
    	},
    	"mask-composite": {
    		syntax: "<compositing-operator>#"
    	},
    	"mask-image": {
    		syntax: "<mask-reference>#"
    	},
    	"mask-mode": {
    		syntax: "<masking-mode>#"
    	},
    	"mask-origin": {
    		syntax: "<coord-box>#"
    	},
    	"mask-position": {
    		syntax: "<position>#"
    	},
    	"mask-repeat": {
    		syntax: "<repeat-style>#"
    	},
    	"mask-size": {
    		syntax: "<bg-size>#"
    	},
    	"mask-type": {
    		syntax: "luminance | alpha"
    	},
    	"masonry-auto-flow": {
    		syntax: "[ pack | next ] || [ definite-first | ordered ]"
    	},
    	"math-depth": {
    		syntax: "auto-add | add(<integer>) | <integer>"
    	},
    	"math-shift": {
    		syntax: "normal | compact"
    	},
    	"math-style": {
    		syntax: "normal | compact"
    	},
    	"max-block-size": {
    		syntax: "<'max-width'>"
    	},
    	"max-height": {
    		syntax: "none | <length-percentage [0,∞]> | min-content | max-content | fit-content | fit-content(<length-percentage [0,∞]>) | <calc-size()> | <anchor-size()> | stretch | <-non-standard-size>"
    	},
    	"max-inline-size": {
    		syntax: "<'max-width'>"
    	},
    	"max-lines": {
    		syntax: "none | <integer>"
    	},
    	"max-width": {
    		syntax: "none | <length-percentage [0,∞]> | min-content | max-content | fit-content | fit-content(<length-percentage [0,∞]>) | <calc-size()> | <anchor-size()> | stretch | <-non-standard-size>"
    	},
    	"min-block-size": {
    		syntax: "<'min-width'>"
    	},
    	"min-height": {
    		syntax: "auto | <length-percentage [0,∞]> | min-content | max-content | fit-content | fit-content(<length-percentage [0,∞]>) | <calc-size()> | <anchor-size()> | stretch | <-non-standard-size>"
    	},
    	"min-inline-size": {
    		syntax: "<'min-width'>"
    	},
    	"min-width": {
    		syntax: "auto | <length-percentage [0,∞]> | min-content | max-content | fit-content | fit-content(<length-percentage [0,∞]>) | <calc-size()> | <anchor-size()> | stretch | <-non-standard-size>"
    	},
    	"mix-blend-mode": {
    		syntax: "<blend-mode> | plus-darker | plus-lighter"
    	},
    	"object-fit": {
    		syntax: "fill | contain | cover | none | scale-down"
    	},
    	"object-position": {
    		syntax: "<position>"
    	},
    	"object-view-box": {
    		syntax: "none | <basic-shape-rect>"
    	},
    	offset: {
    		syntax: "[ <'offset-position'>? [ <'offset-path'> [ <'offset-distance'> || <'offset-rotate'> ]? ]? ]! [ / <'offset-anchor'> ]?"
    	},
    	"offset-anchor": {
    		syntax: "auto | <position>"
    	},
    	"offset-distance": {
    		syntax: "<length-percentage>"
    	},
    	"offset-path": {
    		syntax: "none | <offset-path> || <coord-box>"
    	},
    	"offset-position": {
    		syntax: "normal | auto | <position>"
    	},
    	"offset-rotate": {
    		syntax: "[ auto | reverse ] || <angle>"
    	},
    	opacity: {
    		syntax: "<opacity-value>"
    	},
    	order: {
    		syntax: "<integer>"
    	},
    	orphans: {
    		syntax: "<integer>"
    	},
    	outline: {
    		syntax: "<'outline-width'> || <'outline-style'> || <'outline-color'>"
    	},
    	"outline-color": {
    		syntax: "auto | <color>"
    	},
    	"outline-offset": {
    		syntax: "<length>"
    	},
    	"outline-style": {
    		syntax: "auto | <outline-line-style>"
    	},
    	"outline-width": {
    		syntax: "<line-width>"
    	},
    	overflow: {
    		syntax: "[ visible | hidden | clip | scroll | auto ]{1,2} | <-non-standard-overflow>"
    	},
    	"overflow-anchor": {
    		syntax: "auto | none"
    	},
    	"overflow-block": {
    		syntax: "visible | hidden | clip | scroll | auto"
    	},
    	"overflow-clip-box": {
    		syntax: "padding-box | content-box"
    	},
    	"overflow-clip-margin": {
    		syntax: "<visual-box> || <length [0,∞]>"
    	},
    	"overflow-inline": {
    		syntax: "visible | hidden | clip | scroll | auto"
    	},
    	"overflow-wrap": {
    		syntax: "normal | break-word | anywhere"
    	},
    	"overflow-x": {
    		syntax: "visible | hidden | clip | scroll | auto | <-non-standard-overflow>"
    	},
    	"overflow-y": {
    		syntax: "visible | hidden | clip | scroll | auto | <-non-standard-overflow>"
    	},
    	overlay: {
    		syntax: "none | auto"
    	},
    	"overscroll-behavior": {
    		syntax: "[ contain | none | auto ]{1,2}"
    	},
    	"overscroll-behavior-block": {
    		syntax: "contain | none | auto"
    	},
    	"overscroll-behavior-inline": {
    		syntax: "contain | none | auto"
    	},
    	"overscroll-behavior-x": {
    		syntax: "contain | none | auto"
    	},
    	"overscroll-behavior-y": {
    		syntax: "contain | none | auto"
    	},
    	padding: {
    		syntax: "<'padding-top'>{1,4}"
    	},
    	"padding-block": {
    		syntax: "<'padding-top'>{1,2}"
    	},
    	"padding-block-end": {
    		syntax: "<'padding-top'>"
    	},
    	"padding-block-start": {
    		syntax: "<'padding-top'>"
    	},
    	"padding-bottom": {
    		syntax: "<length-percentage [0,∞]>"
    	},
    	"padding-inline": {
    		syntax: "<'padding-top'>{1,2}"
    	},
    	"padding-inline-end": {
    		syntax: "<'padding-top'>"
    	},
    	"padding-inline-start": {
    		syntax: "<'padding-top'>"
    	},
    	"padding-left": {
    		syntax: "<length-percentage [0,∞]>"
    	},
    	"padding-right": {
    		syntax: "<length-percentage [0,∞]>"
    	},
    	"padding-top": {
    		syntax: "<length-percentage [0,∞]>"
    	},
    	page: {
    		syntax: "auto | <custom-ident>"
    	},
    	"page-break-after": {
    		syntax: "auto | always | avoid | left | right | recto | verso"
    	},
    	"page-break-before": {
    		syntax: "auto | always | avoid | left | right | recto | verso"
    	},
    	"page-break-inside": {
    		syntax: "auto | avoid"
    	},
    	"paint-order": {
    		syntax: "normal | [ fill || stroke || markers ]"
    	},
    	perspective: {
    		syntax: "none | <length>"
    	},
    	"perspective-origin": {
    		syntax: "<position>"
    	},
    	"place-content": {
    		syntax: "<'align-content'> <'justify-content'>?"
    	},
    	"place-items": {
    		syntax: "<'align-items'> <'justify-items'>?"
    	},
    	"place-self": {
    		syntax: "<'align-self'> <'justify-self'>?"
    	},
    	"pointer-events": {
    		syntax: "auto | none | visiblePainted | visibleFill | visibleStroke | visible | painted | fill | stroke | all | inherit"
    	},
    	position: {
    		syntax: "static | relative | absolute | sticky | fixed | -webkit-sticky"
    	},
    	"position-anchor": {
    		syntax: "auto | <anchor-name>"
    	},
    	"position-area": {
    		syntax: "none | <position-area>"
    	},
    	"position-try": {
    		syntax: "<'position-try-order'>? <'position-try-fallbacks'>"
    	},
    	"position-try-fallbacks": {
    		syntax: "none | [ [<dashed-ident> || <try-tactic>] | <'position-area'> ]#"
    	},
    	"position-try-order": {
    		syntax: "normal | <try-size>"
    	},
    	"position-visibility": {
    		syntax: "always | [ anchors-valid || anchors-visible || no-overflow ]"
    	},
    	"print-color-adjust": {
    		syntax: "economy | exact"
    	},
    	quotes: {
    		syntax: "none | auto | [ <string> <string> ]+"
    	},
    	r: {
    		syntax: "<length> | <percentage>"
    	},
    	resize: {
    		syntax: "none | both | horizontal | vertical | block | inline"
    	},
    	right: {
    		syntax: "auto | <length-percentage> | <anchor()> | <anchor-size()>"
    	},
    	rotate: {
    		syntax: "none | <angle> | [ x | y | z | <number>{3} ] && <angle>"
    	},
    	"row-gap": {
    		syntax: "normal | <length-percentage>"
    	},
    	"ruby-align": {
    		syntax: "start | center | space-between | space-around"
    	},
    	"ruby-merge": {
    		syntax: "separate | collapse | auto"
    	},
    	"ruby-overhang": {
    		syntax: "auto | none"
    	},
    	"ruby-position": {
    		syntax: "[ alternate || [ over | under ] ] | inter-character"
    	},
    	rx: {
    		syntax: "<length> | <percentage>"
    	},
    	ry: {
    		syntax: "<length> | <percentage>"
    	},
    	scale: {
    		syntax: "none | [ <number> | <percentage> ]{1,3}"
    	},
    	"scroll-behavior": {
    		syntax: "auto | smooth"
    	},
    	"scroll-initial-target": {
    		syntax: "none | nearest"
    	},
    	"scroll-margin": {
    		syntax: "<length>{1,4}"
    	},
    	"scroll-margin-block": {
    		syntax: "<length>{1,2}"
    	},
    	"scroll-margin-block-end": {
    		syntax: "<length>"
    	},
    	"scroll-margin-block-start": {
    		syntax: "<length>"
    	},
    	"scroll-margin-bottom": {
    		syntax: "<length>"
    	},
    	"scroll-margin-inline": {
    		syntax: "<length>{1,2}"
    	},
    	"scroll-margin-inline-end": {
    		syntax: "<length>"
    	},
    	"scroll-margin-inline-start": {
    		syntax: "<length>"
    	},
    	"scroll-margin-left": {
    		syntax: "<length>"
    	},
    	"scroll-margin-right": {
    		syntax: "<length>"
    	},
    	"scroll-margin-top": {
    		syntax: "<length>"
    	},
    	"scroll-padding": {
    		syntax: "[ auto | <length-percentage> ]{1,4}"
    	},
    	"scroll-padding-block": {
    		syntax: "[ auto | <length-percentage> ]{1,2}"
    	},
    	"scroll-padding-block-end": {
    		syntax: "auto | <length-percentage>"
    	},
    	"scroll-padding-block-start": {
    		syntax: "auto | <length-percentage>"
    	},
    	"scroll-padding-bottom": {
    		syntax: "auto | <length-percentage>"
    	},
    	"scroll-padding-inline": {
    		syntax: "[ auto | <length-percentage> ]{1,2}"
    	},
    	"scroll-padding-inline-end": {
    		syntax: "auto | <length-percentage>"
    	},
    	"scroll-padding-inline-start": {
    		syntax: "auto | <length-percentage>"
    	},
    	"scroll-padding-left": {
    		syntax: "auto | <length-percentage>"
    	},
    	"scroll-padding-right": {
    		syntax: "auto | <length-percentage>"
    	},
    	"scroll-padding-top": {
    		syntax: "auto | <length-percentage>"
    	},
    	"scroll-snap-align": {
    		syntax: "[ none | start | end | center ]{1,2}"
    	},
    	"scroll-snap-coordinate": {
    		syntax: "none | <position>#"
    	},
    	"scroll-snap-destination": {
    		syntax: "<position>"
    	},
    	"scroll-snap-points-x": {
    		syntax: "none | repeat( <length-percentage> )"
    	},
    	"scroll-snap-points-y": {
    		syntax: "none | repeat( <length-percentage> )"
    	},
    	"scroll-snap-stop": {
    		syntax: "normal | always"
    	},
    	"scroll-snap-type": {
    		syntax: "none | [ x | y | block | inline | both ] [ mandatory | proximity ]?"
    	},
    	"scroll-snap-type-x": {
    		syntax: "none | mandatory | proximity"
    	},
    	"scroll-snap-type-y": {
    		syntax: "none | mandatory | proximity"
    	},
    	"scroll-timeline": {
    		syntax: "[ <'scroll-timeline-name'> <'scroll-timeline-axis'>? ]#"
    	},
    	"scroll-timeline-axis": {
    		syntax: "[ block | inline | x | y ]#"
    	},
    	"scroll-timeline-name": {
    		syntax: "[ none | <dashed-ident> ]#"
    	},
    	"scrollbar-color": {
    		syntax: "auto | <color>{2}"
    	},
    	"scrollbar-gutter": {
    		syntax: "auto | stable && both-edges?"
    	},
    	"scrollbar-width": {
    		syntax: "auto | thin | none"
    	},
    	"shape-image-threshold": {
    		syntax: "<opacity-value>"
    	},
    	"shape-margin": {
    		syntax: "<length-percentage>"
    	},
    	"shape-outside": {
    		syntax: "none | [ <shape-box> || <basic-shape> ] | <image>"
    	},
    	"shape-rendering": {
    		syntax: "auto | optimizeSpeed | crispEdges | geometricPrecision"
    	},
    	"speak-as": {
    		syntax: "normal | spell-out || digits || [ literal-punctuation | no-punctuation ]"
    	},
    	"stop-color": {
    		syntax: "<'color'>"
    	},
    	"stop-opacity": {
    		syntax: "<'opacity'>"
    	},
    	stroke: {
    		syntax: "<paint>"
    	},
    	"stroke-color": {
    		syntax: "<color>"
    	},
    	"stroke-dasharray": {
    		syntax: "none | <dasharray> none | [ <svg-length>+ ]#"
    	},
    	"stroke-dashoffset": {
    		syntax: "<length-percentage> | <number> <svg-length>"
    	},
    	"stroke-linecap": {
    		syntax: "butt | round | square"
    	},
    	"stroke-linejoin": {
    		syntax: "miter | miter-clip | round | bevel | arcs miter | round | bevel"
    	},
    	"stroke-miterlimit": {
    		syntax: "<number> <number-one-or-greater>"
    	},
    	"stroke-opacity": {
    		syntax: "<'opacity'>"
    	},
    	"stroke-width": {
    		syntax: "<length-percentage> | <number> <svg-length>"
    	},
    	"tab-size": {
    		syntax: "<integer> | <length>"
    	},
    	"table-layout": {
    		syntax: "auto | fixed"
    	},
    	"text-align": {
    		syntax: "start | end | left | right | center | justify | match-parent | <-non-standard-text-align>"
    	},
    	"text-align-last": {
    		syntax: "auto | start | end | left | right | center | justify"
    	},
    	"text-anchor": {
    		syntax: "start | middle | end"
    	},
    	"text-autospace": {
    		syntax: "normal | <autospace> | auto"
    	},
    	"text-box": {
    		syntax: "normal | <'text-box-trim'> || <'text-box-edge'>"
    	},
    	"text-box-edge": {
    		syntax: "auto | <text-edge>"
    	},
    	"text-box-trim": {
    		syntax: "none | trim-start | trim-end | trim-both"
    	},
    	"text-combine-upright": {
    		syntax: "none | all | [ digits <integer>? ]"
    	},
    	"text-decoration": {
    		syntax: "<'text-decoration-line'> || <'text-decoration-style'> || <'text-decoration-color'> || <'text-decoration-thickness'>"
    	},
    	"text-decoration-color": {
    		syntax: "<color>"
    	},
    	"text-decoration-line": {
    		syntax: "none | [ underline || overline || line-through || blink ] | spelling-error | grammar-error"
    	},
    	"text-decoration-skip": {
    		syntax: "none | [ objects || [ spaces | [ leading-spaces || trailing-spaces ] ] || edges || box-decoration ]"
    	},
    	"text-decoration-skip-ink": {
    		syntax: "auto | all | none"
    	},
    	"text-decoration-style": {
    		syntax: "solid | double | dotted | dashed | wavy"
    	},
    	"text-decoration-thickness": {
    		syntax: "auto | from-font | <length> | <percentage> "
    	},
    	"text-emphasis": {
    		syntax: "<'text-emphasis-style'> || <'text-emphasis-color'>"
    	},
    	"text-emphasis-color": {
    		syntax: "<color>"
    	},
    	"text-emphasis-position": {
    		syntax: "auto | [ over | under ] && [ right | left ]?"
    	},
    	"text-emphasis-style": {
    		syntax: "none | [ [ filled | open ] || [ dot | circle | double-circle | triangle | sesame ] ] | <string>"
    	},
    	"text-indent": {
    		syntax: "<length-percentage> && hanging? && each-line?"
    	},
    	"text-justify": {
    		syntax: "auto | inter-character | inter-word | none"
    	},
    	"text-orientation": {
    		syntax: "mixed | upright | sideways"
    	},
    	"text-overflow": {
    		syntax: "[ clip | ellipsis | <string> ]{1,2}"
    	},
    	"text-rendering": {
    		syntax: "auto | optimizeSpeed | optimizeLegibility | geometricPrecision"
    	},
    	"text-shadow": {
    		syntax: "none | <shadow-t>#"
    	},
    	"text-size-adjust": {
    		syntax: "none | auto | <percentage>"
    	},
    	"text-spacing-trim": {
    		syntax: "space-all | normal | space-first | trim-start"
    	},
    	"text-transform": {
    		syntax: "none | [ capitalize | uppercase | lowercase ] || full-width || full-size-kana | math-auto"
    	},
    	"text-underline-offset": {
    		syntax: "auto | <length> | <percentage> "
    	},
    	"text-underline-position": {
    		syntax: "auto | from-font | [ under || [ left | right ] ]"
    	},
    	"text-wrap": {
    		syntax: "<'text-wrap-mode'> || <'text-wrap-style'>"
    	},
    	"text-wrap-mode": {
    		syntax: "wrap | nowrap"
    	},
    	"text-wrap-style": {
    		syntax: "auto | balance | stable | pretty"
    	},
    	"timeline-scope": {
    		syntax: "none | <dashed-ident>#"
    	},
    	top: {
    		syntax: "auto | <length-percentage> | <anchor()> | <anchor-size()>"
    	},
    	"touch-action": {
    		syntax: "auto | none | [ [ pan-x | pan-left | pan-right ] || [ pan-y | pan-up | pan-down ] || pinch-zoom ] | manipulation"
    	},
    	transform: {
    		syntax: "none | <transform-list>"
    	},
    	"transform-box": {
    		syntax: "content-box | border-box | fill-box | stroke-box | view-box"
    	},
    	"transform-origin": {
    		syntax: "[ <length-percentage> | left | center | right | top | bottom ] | [ [ <length-percentage> | left | center | right ] && [ <length-percentage> | top | center | bottom ] ] <length>?"
    	},
    	"transform-style": {
    		syntax: "flat | preserve-3d"
    	},
    	transition: {
    		syntax: "<single-transition>#"
    	},
    	"transition-behavior": {
    		syntax: "<transition-behavior-value>#"
    	},
    	"transition-delay": {
    		syntax: "<time>#"
    	},
    	"transition-duration": {
    		syntax: "<time>#"
    	},
    	"transition-property": {
    		syntax: "none | <single-transition-property>#"
    	},
    	"transition-timing-function": {
    		syntax: "<easing-function>#"
    	},
    	translate: {
    		syntax: "none | <length-percentage> [ <length-percentage> <length>? ]?"
    	},
    	"unicode-bidi": {
    		syntax: "normal | embed | isolate | bidi-override | isolate-override | plaintext | -moz-isolate | -moz-isolate-override | -moz-plaintext | -webkit-isolate | -webkit-isolate-override | -webkit-plaintext"
    	},
    	"user-select": {
    		syntax: "auto | text | none | all"
    	},
    	"vector-effect": {
    		syntax: "none | non-scaling-stroke | non-scaling-size | non-rotation | fixed-position"
    	},
    	"vertical-align": {
    		syntax: "baseline | sub | super | text-top | text-bottom | middle | top | bottom | <percentage> | <length>"
    	},
    	"view-timeline": {
    		syntax: "[ <'view-timeline-name'> [ <'view-timeline-axis'> || <'view-timeline-inset'> ]? ]#"
    	},
    	"view-timeline-axis": {
    		syntax: "[ block | inline | x | y ]#"
    	},
    	"view-timeline-inset": {
    		syntax: "[ [ auto | <length-percentage> ]{1,2} ]#"
    	},
    	"view-timeline-name": {
    		syntax: "[ none | <dashed-ident> ]#"
    	},
    	"view-transition-class": {
    		syntax: "none | <custom-ident>+"
    	},
    	"view-transition-name": {
    		syntax: "none | <custom-ident> | match-element"
    	},
    	visibility: {
    		syntax: "visible | hidden | collapse"
    	},
    	"white-space": {
    		syntax: "normal | pre | pre-wrap | pre-line | <'white-space-collapse'> || <'text-wrap-mode'>"
    	},
    	"white-space-collapse": {
    		syntax: "collapse | preserve | preserve-breaks | preserve-spaces | break-spaces"
    	},
    	widows: {
    		syntax: "<integer>"
    	},
    	width: {
    		syntax: "auto | <length-percentage [0,∞]> | min-content | max-content | fit-content | fit-content(<length-percentage [0,∞]>) | <calc-size()> | <anchor-size()> | stretch | <-non-standard-size>"
    	},
    	"will-change": {
    		syntax: "auto | <animateable-feature>#"
    	},
    	"word-break": {
    		syntax: "normal | break-all | keep-all | break-word | auto-phrase"
    	},
    	"word-spacing": {
    		syntax: "normal | <length>"
    	},
    	"word-wrap": {
    		syntax: "normal | break-word"
    	},
    	"writing-mode": {
    		syntax: "horizontal-tb | vertical-rl | vertical-lr | sideways-rl | sideways-lr | <svg-writing-mode>"
    	},
    	x: {
    		syntax: "<length> | <percentage>"
    	},
    	y: {
    		syntax: "<length> | <percentage>"
    	},
    	"z-index": {
    		syntax: "auto | <integer>"
    	},
    	zoom: {
    		syntax: "normal | reset | <number [0,∞]> || <percentage [0,∞]>"
    	},
    	"-moz-background-clip": {
    		syntax: "padding | border"
    	},
    	"-moz-border-radius-bottomleft": {
    		syntax: "<'border-bottom-left-radius'>"
    	},
    	"-moz-border-radius-bottomright": {
    		syntax: "<'border-bottom-right-radius'>"
    	},
    	"-moz-border-radius-topleft": {
    		syntax: "<'border-top-left-radius'>"
    	},
    	"-moz-border-radius-topright": {
    		syntax: "<'border-bottom-right-radius'>"
    	},
    	"-moz-control-character-visibility": {
    		syntax: "visible | hidden"
    	},
    	"-moz-osx-font-smoothing": {
    		syntax: "auto | grayscale"
    	},
    	"-moz-user-select": {
    		syntax: "none | text | all | -moz-none | auto"
    	},
    	"-ms-flex-align": {
    		syntax: "start | end | center | baseline | stretch"
    	},
    	"-ms-flex-item-align": {
    		syntax: "auto | start | end | center | baseline | stretch"
    	},
    	"-ms-flex-line-pack": {
    		syntax: "start | end | center | justify | distribute | stretch"
    	},
    	"-ms-flex-negative": {
    		syntax: "<'flex-shrink'>"
    	},
    	"-ms-flex-pack": {
    		syntax: "start | end | center | justify | distribute"
    	},
    	"-ms-flex-order": {
    		syntax: "<integer>"
    	},
    	"-ms-flex-positive": {
    		syntax: "<'flex-grow'>"
    	},
    	"-ms-flex-preferred-size": {
    		syntax: "<'flex-basis'>"
    	},
    	"-ms-interpolation-mode": {
    		syntax: "nearest-neighbor | bicubic"
    	},
    	"-ms-grid-column-align": {
    		syntax: "start | end | center | stretch"
    	},
    	"-ms-grid-row-align": {
    		syntax: "start | end | center | stretch"
    	},
    	"-ms-hyphenate-limit-last": {
    		syntax: "none | always | column | page | spread"
    	},
    	"-webkit-background-clip": {
    		syntax: "[ <visual-box> | border | padding | content | text ]#"
    	},
    	"-webkit-column-break-after": {
    		syntax: "always | auto | avoid"
    	},
    	"-webkit-column-break-before": {
    		syntax: "always | auto | avoid"
    	},
    	"-webkit-column-break-inside": {
    		syntax: "always | auto | avoid"
    	},
    	"-webkit-font-smoothing": {
    		syntax: "auto | none | antialiased | subpixel-antialiased"
    	},
    	"-webkit-mask-box-image": {
    		syntax: "[ <url> | <gradient> | none ] [ <length-percentage>{4} <-webkit-mask-box-repeat>{2} ]?"
    	},
    	"-webkit-print-color-adjust": {
    		syntax: "economy | exact"
    	},
    	"-webkit-text-security": {
    		syntax: "none | circle | disc | square"
    	},
    	"-webkit-user-drag": {
    		syntax: "none | element | auto"
    	},
    	behavior: {
    		syntax: "<url>+"
    	},
    	cue: {
    		syntax: "<'cue-before'> <'cue-after'>?"
    	},
    	"cue-after": {
    		syntax: "<url> <decibel>? | none"
    	},
    	"cue-before": {
    		syntax: "<url> <decibel>? | none"
    	},
    	"glyph-orientation-horizontal": {
    		syntax: "<angle>"
    	},
    	"glyph-orientation-vertical": {
    		syntax: "<angle>"
    	},
    	kerning: {
    		syntax: "auto | <svg-length>"
    	},
    	pause: {
    		syntax: "<'pause-before'> <'pause-after'>?"
    	},
    	"pause-after": {
    		syntax: "<time> | none | x-weak | weak | medium | strong | x-strong"
    	},
    	"pause-before": {
    		syntax: "<time> | none | x-weak | weak | medium | strong | x-strong"
    	},
    	"position-try-options": {
    		syntax: "<'position-try-fallbacks'>"
    	},
    	rest: {
    		syntax: "<'rest-before'> <'rest-after'>?"
    	},
    	"rest-after": {
    		syntax: "<time> | none | x-weak | weak | medium | strong | x-strong"
    	},
    	"rest-before": {
    		syntax: "<time> | none | x-weak | weak | medium | strong | x-strong"
    	},
    	speak: {
    		syntax: "auto | never | always"
    	},
    	"voice-balance": {
    		syntax: "<number> | left | center | right | leftwards | rightwards"
    	},
    	"voice-duration": {
    		syntax: "auto | <time>"
    	},
    	"voice-family": {
    		syntax: "[ [ <family-name> | <generic-voice> ] , ]* [ <family-name> | <generic-voice> ] | preserve"
    	},
    	"voice-pitch": {
    		syntax: "<frequency> && absolute | [ [ x-low | low | medium | high | x-high ] || [ <frequency> | <semitones> | <percentage> ] ]"
    	},
    	"voice-range": {
    		syntax: "<frequency> && absolute | [ [ x-low | low | medium | high | x-high ] || [ <frequency> | <semitones> | <percentage> ] ]"
    	},
    	"voice-rate": {
    		syntax: "[ normal | x-slow | slow | medium | fast | x-fast ] || <percentage>"
    	},
    	"voice-stress": {
    		syntax: "normal | strong | moderate | none | reduced"
    	},
    	"voice-volume": {
    		syntax: "silent | [ [ x-soft | soft | medium | loud | x-loud ] || <decibel> ]"
    	},
    	"white-space-trim": {
    		syntax: "none | discard-before || discard-after || discard-inner"
    	},
    	composes: {
    		syntax: "<composes-selector>"
    	}
    };
    var functions = {
    	abs: {
    		syntax: "abs( <calc-sum> )"
    	},
    	acos: {
    		syntax: "acos( <calc-sum> )"
    	},
    	anchor: {
    		syntax: "anchor( <anchor-name>? && <anchor-side>, <length-percentage>? )"
    	},
    	"anchor-size": {
    		syntax: "anchor-size( [ <anchor-name> || <anchor-size> ]? , <length-percentage>? )"
    	},
    	asin: {
    		syntax: "asin( <calc-sum> )"
    	},
    	atan: {
    		syntax: "atan( <calc-sum> )"
    	},
    	atan2: {
    		syntax: "atan2( <calc-sum>, <calc-sum> )"
    	},
    	attr: {
    		syntax: "attr( <attr-name> <type-or-unit>? [, <attr-fallback> ]? )"
    	},
    	blur: {
    		syntax: "blur( <length>? )"
    	},
    	brightness: {
    		syntax: "brightness( [ <number> | <percentage> ]? )"
    	},
    	calc: {
    		syntax: "calc( <calc-sum> )"
    	},
    	"calc-size": {
    		syntax: "calc-size( <calc-size-basis>, <calc-sum> )"
    	},
    	circle: {
    		syntax: "circle( <radial-size>? [ at <position> ]? )"
    	},
    	clamp: {
    		syntax: "clamp( <calc-sum>#{3} )"
    	},
    	color: {
    		syntax: "color( [ from <color> ]? <colorspace-params> [ / [ <alpha-value> | none ] ]? )"
    	},
    	"color-mix": {
    		syntax: "color-mix( <color-interpolation-method> , [ <color> && <percentage [0,100]>? ]#{2})"
    	},
    	"conic-gradient": {
    		syntax: "conic-gradient( [ <conic-gradient-syntax> ] )"
    	},
    	contrast: {
    		syntax: "contrast( [ <number> | <percentage> ]? )"
    	},
    	cos: {
    		syntax: "cos( <calc-sum> )"
    	},
    	counter: {
    		syntax: "counter( <counter-name>, <counter-style>? )"
    	},
    	counters: {
    		syntax: "counters( <counter-name>, <string>, <counter-style>? )"
    	},
    	"cross-fade": {
    		syntax: "cross-fade( <cf-mixing-image> , <cf-final-image>? )"
    	},
    	"cubic-bezier": {
    		syntax: "cubic-bezier( [ <number [0,1]>, <number> ]#{2} )"
    	},
    	"drop-shadow": {
    		syntax: "drop-shadow( [ <color>? && <length>{2,3} ] )"
    	},
    	element: {
    		syntax: "element( <id-selector> )"
    	},
    	ellipse: {
    		syntax: "ellipse( <radial-size>? [ at <position> ]? )"
    	},
    	env: {
    		syntax: "env( <custom-ident> , <declaration-value>? )"
    	},
    	exp: {
    		syntax: "exp( <calc-sum> )"
    	},
    	"fit-content": {
    		syntax: "fit-content( <length-percentage [0,∞]> )"
    	},
    	grayscale: {
    		syntax: "grayscale( [ <number> | <percentage> ]? )"
    	},
    	hsl: {
    		syntax: "hsl( <hue>, <percentage>, <percentage>, <alpha-value>? ) | hsl( [ <hue> | none ] [ <percentage> | <number> | none ] [ <percentage> | <number> | none ] [ / [ <alpha-value> | none ] ]? )"
    	},
    	hsla: {
    		syntax: "hsla( <hue>, <percentage>, <percentage>, <alpha-value>? ) | hsla( [ <hue> | none ] [ <percentage> | <number> | none ] [ <percentage> | <number> | none ] [ / [ <alpha-value> | none ] ]? )"
    	},
    	"hue-rotate": {
    		syntax: "hue-rotate( [ <angle> | <zero> ]? )"
    	},
    	hwb: {
    		syntax: "hwb( [ <hue> | none ] [ <percentage> | <number> | none ] [ <percentage> | <number> | none ] [ / [ <alpha-value> | none ] ]? )"
    	},
    	hypot: {
    		syntax: "hypot( <calc-sum># )"
    	},
    	image: {
    		syntax: "image( <image-tags>? [ <image-src>? , <color>? ]! )"
    	},
    	"image-set": {
    		syntax: "image-set( <image-set-option># )"
    	},
    	inset: {
    		syntax: "inset( <length-percentage>{1,4} [ round <'border-radius'> ]? )"
    	},
    	invert: {
    		syntax: "invert( [ <number> | <percentage> ]? )"
    	},
    	lab: {
    		syntax: "lab( [<percentage> | <number> | none] [ <percentage> | <number> | none] [ <percentage> | <number> | none] [ / [<alpha-value> | none] ]? )"
    	},
    	layer: {
    		syntax: "layer( <layer-name> )"
    	},
    	lch: {
    		syntax: "lch( [<percentage> | <number> | none] [ <percentage> | <number> | none] [ <hue> | none] [ / [<alpha-value> | none] ]? )"
    	},
    	leader: {
    		syntax: "leader( <leader-type> )"
    	},
    	"light-dark": {
    		syntax: "light-dark( <color>, <color> )"
    	},
    	linear: {
    		syntax: "linear( [ <number> && <percentage>{0,2} ]# )"
    	},
    	"linear-gradient": {
    		syntax: "linear-gradient( [ <linear-gradient-syntax> ] )"
    	},
    	log: {
    		syntax: "log( <calc-sum>, <calc-sum>? )"
    	},
    	matrix: {
    		syntax: "matrix( <number>#{6} )"
    	},
    	matrix3d: {
    		syntax: "matrix3d( <number>#{16} )"
    	},
    	max: {
    		syntax: "max( <calc-sum># )"
    	},
    	min: {
    		syntax: "min( <calc-sum># )"
    	},
    	minmax: {
    		syntax: "minmax( [ <length-percentage> | min-content | max-content | auto ] , [ <length-percentage> | <flex> | min-content | max-content | auto ] )"
    	},
    	mod: {
    		syntax: "mod( <calc-sum>, <calc-sum> )"
    	},
    	oklab: {
    		syntax: "oklab( [ <percentage> | <number> | none] [ <percentage> | <number> | none] [ <percentage> | <number> | none] [ / [<alpha-value> | none] ]? )"
    	},
    	oklch: {
    		syntax: "oklch( [ <percentage> | <number> | none] [ <percentage> | <number> | none] [ <hue> | none] [ / [<alpha-value> | none] ]? )"
    	},
    	opacity: {
    		syntax: "opacity( [ <number> | <percentage> ]? )"
    	},
    	paint: {
    		syntax: "paint( <ident>, <declaration-value>? )"
    	},
    	"palette-mix": {
    		syntax: "palette-mix(<color-interpolation-method> , [ [normal | light | dark | <palette-identifier> | <palette-mix()> ] && <percentage [0,100]>? ]#{2})"
    	},
    	path: {
    		syntax: "path( <'fill-rule'>? , <string> )"
    	},
    	perspective: {
    		syntax: "perspective( [ <length [0,∞]> | none ] )"
    	},
    	polygon: {
    		syntax: "polygon( <'fill-rule'>? , [ <length-percentage> <length-percentage> ]# )"
    	},
    	pow: {
    		syntax: "pow( <calc-sum>, <calc-sum> )"
    	},
    	"radial-gradient": {
    		syntax: "radial-gradient( [ <radial-gradient-syntax> ] )"
    	},
    	ray: {
    		syntax: "ray( <angle> && <ray-size>? && contain? && [at <position>]? )"
    	},
    	rect: {
    		syntax: "rect( [ <length-percentage> | auto ]{4} [ round <'border-radius'> ]? )"
    	},
    	rem: {
    		syntax: "rem( <calc-sum>, <calc-sum> )"
    	},
    	"repeating-conic-gradient": {
    		syntax: "repeating-conic-gradient( [ <conic-gradient-syntax> ] )"
    	},
    	"repeating-linear-gradient": {
    		syntax: "repeating-linear-gradient( [ <linear-gradient-syntax> ] )"
    	},
    	"repeating-radial-gradient": {
    		syntax: "repeating-radial-gradient( [ <radial-gradient-syntax> ] )"
    	},
    	rgb: {
    		syntax: "rgb( <percentage>#{3} , <alpha-value>? ) | rgb( <number>#{3} , <alpha-value>? ) | rgb( [ <number> | <percentage> | none ]{3} [ / [ <alpha-value> | none ] ]? )"
    	},
    	rgba: {
    		syntax: "rgba( <percentage>#{3} , <alpha-value>? ) | rgba( <number>#{3} , <alpha-value>? ) | rgba( [ <number> | <percentage> | none ]{3} [ / [ <alpha-value> | none ] ]? )"
    	},
    	rotate: {
    		syntax: "rotate( [ <angle> | <zero> ] )"
    	},
    	rotate3d: {
    		syntax: "rotate3d( <number> , <number> , <number> , [ <angle> | <zero> ] )"
    	},
    	rotateX: {
    		syntax: "rotateX( [ <angle> | <zero> ] )"
    	},
    	rotateY: {
    		syntax: "rotateY( [ <angle> | <zero> ] )"
    	},
    	rotateZ: {
    		syntax: "rotateZ( [ <angle> | <zero> ] )"
    	},
    	round: {
    		syntax: "round( <rounding-strategy>?, <calc-sum>, <calc-sum> )"
    	},
    	saturate: {
    		syntax: "saturate( [ <number> | <percentage> ]? )"
    	},
    	scale: {
    		syntax: "scale( [ <number> | <percentage> ]#{1,2} )"
    	},
    	scale3d: {
    		syntax: "scale3d( [ <number> | <percentage> ]#{3} )"
    	},
    	scaleX: {
    		syntax: "scaleX( [ <number> | <percentage> ] )"
    	},
    	scaleY: {
    		syntax: "scaleY( [ <number> | <percentage> ] )"
    	},
    	scaleZ: {
    		syntax: "scaleZ( [ <number> | <percentage> ] )"
    	},
    	scroll: {
    		syntax: "scroll( [ <scroller> || <axis> ]? )"
    	},
    	sepia: {
    		syntax: "sepia( [ <number> | <percentage> ]? )"
    	},
    	sign: {
    		syntax: "sign( <calc-sum> )"
    	},
    	sin: {
    		syntax: "sin( <calc-sum> )"
    	},
    	skew: {
    		syntax: "skew( [ <angle> | <zero> ] , [ <angle> | <zero> ]? )"
    	},
    	skewX: {
    		syntax: "skewX( [ <angle> | <zero> ] )"
    	},
    	skewY: {
    		syntax: "skewY( [ <angle> | <zero> ] )"
    	},
    	sqrt: {
    		syntax: "sqrt( <calc-sum> )"
    	},
    	steps: {
    		syntax: "steps( <integer>, <step-position>? )"
    	},
    	symbols: {
    		syntax: "symbols( <symbols-type>? [ <string> | <image> ]+ )"
    	},
    	tan: {
    		syntax: "tan( <calc-sum> )"
    	},
    	"target-counter": {
    		syntax: "target-counter( [ <string> | <url> ] , <custom-ident> , <counter-style>? )"
    	},
    	"target-counters": {
    		syntax: "target-counters( [ <string> | <url> ] , <custom-ident> , <string> , <counter-style>? )"
    	},
    	"target-text": {
    		syntax: "target-text( [ <string> | <url> ] , [ content | before | after | first-letter ]? )"
    	},
    	translate: {
    		syntax: "translate( <length-percentage> , <length-percentage>? )"
    	},
    	translate3d: {
    		syntax: "translate3d( <length-percentage> , <length-percentage> , <length> )"
    	},
    	translateX: {
    		syntax: "translateX( <length-percentage> )"
    	},
    	translateY: {
    		syntax: "translateY( <length-percentage> )"
    	},
    	translateZ: {
    		syntax: "translateZ( <length> )"
    	},
    	"var": {
    		syntax: "var( <custom-property-name> , <declaration-value>? )"
    	},
    	view: {
    		syntax: "view([<axis> || <'view-timeline-inset'>]?)"
    	},
    	xywh: {
    		syntax: "xywh( <length-percentage>{2} <length-percentage [0,∞]>{2} [ round <'border-radius'> ]? )"
    	}
    };
    var syntaxes = {
    	"abs()": {
    		syntax: "abs( <calc-sum> )"
    	},
    	"absolute-size": {
    		syntax: "xx-small | x-small | small | medium | large | x-large | xx-large | xxx-large"
    	},
    	"acos()": {
    		syntax: "acos( <calc-sum> )"
    	},
    	"alpha-value": {
    		syntax: "<number> | <percentage>"
    	},
    	"an+b": {
    		syntax: "odd | even | <integer> | <n-dimension> | '+'?† n | -n | <ndashdigit-dimension> | '+'?† <ndashdigit-ident> | <dashndashdigit-ident> | <n-dimension> <signed-integer> | '+'?† n <signed-integer> | -n <signed-integer> | <ndash-dimension> <signless-integer> | '+'?† n- <signless-integer> | -n- <signless-integer> | <n-dimension> ['+' | '-'] <signless-integer> | '+'?† n ['+' | '-'] <signless-integer> | -n ['+' | '-'] <signless-integer>"
    	},
    	"anchor()": {
    		syntax: "anchor( <anchor-name>? && <anchor-side>, <length-percentage>? )"
    	},
    	"anchor-name": {
    		syntax: "<dashed-ident>"
    	},
    	"anchor-side": {
    		syntax: "inside | outside | top | left | right | bottom | start | end | self-start | self-end | <percentage> | center"
    	},
    	"anchor-size": {
    		syntax: "width | height | block | inline | self-block | self-inline"
    	},
    	"anchor-size()": {
    		syntax: "anchor-size( [ <anchor-name> || <anchor-size> ]? , <length-percentage>? )"
    	},
    	"angle-percentage": {
    		syntax: "<angle> | <percentage>"
    	},
    	"angular-color-hint": {
    		syntax: "<angle-percentage> | <zero>"
    	},
    	"angular-color-stop": {
    		syntax: "<color> <color-stop-angle>?"
    	},
    	"angular-color-stop-list": {
    		syntax: "<angular-color-stop> , [ <angular-color-hint>? , <angular-color-stop> ]#?"
    	},
    	"animateable-feature": {
    		syntax: "scroll-position | contents | <custom-ident>"
    	},
    	"asin()": {
    		syntax: "asin( <calc-sum> )"
    	},
    	"atan()": {
    		syntax: "atan( <calc-sum> )"
    	},
    	"atan2()": {
    		syntax: "atan2( <calc-sum>, <calc-sum> )"
    	},
    	attachment: {
    		syntax: "scroll | fixed | local"
    	},
    	"attr()": {
    		syntax: "attr( <attr-name> <type-or-unit>? [, <attr-fallback> ]? )"
    	},
    	"attr-matcher": {
    		syntax: "[ '~' | '|' | '^' | '$' | '*' ]? '='"
    	},
    	"attr-modifier": {
    		syntax: "i | s"
    	},
    	"attribute-selector": {
    		syntax: "'[' <wq-name> ']' | '[' <wq-name> <attr-matcher> [ <string-token> | <ident-token> ] <attr-modifier>? ']'"
    	},
    	"auto-repeat": {
    		syntax: "repeat( [ auto-fill | auto-fit ] , [ <line-names>? <fixed-size> ]+ <line-names>? )"
    	},
    	"auto-track-list": {
    		syntax: "[ <line-names>? [ <fixed-size> | <fixed-repeat> ] ]* <line-names>? <auto-repeat>\n[ <line-names>? [ <fixed-size> | <fixed-repeat> ] ]* <line-names>?"
    	},
    	axis: {
    		syntax: "block | inline | x | y"
    	},
    	"baseline-position": {
    		syntax: "[ first | last ]? baseline"
    	},
    	"basic-shape": {
    		syntax: "<inset()> | <xywh()> | <rect()> | <circle()> | <ellipse()> | <polygon()> | <path()>"
    	},
    	"basic-shape-rect": {
    		syntax: "<inset()> | <rect()> | <xywh()>"
    	},
    	"bg-clip": {
    		syntax: "<visual-box> | border-area | text"
    	},
    	"bg-image": {
    		syntax: "<image> | none"
    	},
    	"bg-layer": {
    		syntax: "<bg-image> || <bg-position> [ / <bg-size> ]? || <repeat-style> || <attachment> || <visual-box> || <visual-box>"
    	},
    	"bg-position": {
    		syntax: "[ [ left | center | right | top | bottom | <length-percentage> ] | [ left | center | right | <length-percentage> ] [ top | center | bottom | <length-percentage> ] | [ center | [ left | right ] <length-percentage>? ] && [ center | [ top | bottom ] <length-percentage>? ] ]"
    	},
    	"bg-size": {
    		syntax: "[ <length-percentage [0,∞]> | auto ]{1,2} | cover | contain"
    	},
    	"blend-mode": {
    		syntax: "normal | multiply | screen | overlay | darken | lighten | color-dodge | color-burn | hard-light | soft-light | difference | exclusion | hue | saturation | color | luminosity"
    	},
    	"blur()": {
    		syntax: "blur( <length>? )"
    	},
    	"brightness()": {
    		syntax: "brightness( [ <number> | <percentage> ]? )"
    	},
    	"calc()": {
    		syntax: "calc( <calc-sum> )"
    	},
    	"calc-constant": {
    		syntax: "e | pi | infinity | -infinity | NaN"
    	},
    	"calc-product": {
    		syntax: "<calc-value> [ '*' <calc-value> | '/' <number> ]*"
    	},
    	"calc-size()": {
    		syntax: "calc-size( <calc-size-basis>, <calc-sum> )"
    	},
    	"calc-size-basis": {
    		syntax: "<intrinsic-size-keyword> | <calc-size()> | any | <calc-sum>"
    	},
    	"calc-sum": {
    		syntax: "<calc-product> [ [ '+' | '-' ] <calc-product> ]*"
    	},
    	"calc-value": {
    		syntax: "<number> | <dimension> | <percentage> | <calc-constant> | ( <calc-sum> )"
    	},
    	"cf-final-image": {
    		syntax: "<image> | <color>"
    	},
    	"cf-mixing-image": {
    		syntax: "<percentage>? && <image>"
    	},
    	"circle()": {
    		syntax: "circle( <radial-size>? [ at <position> ]? )"
    	},
    	"clamp()": {
    		syntax: "clamp( <calc-sum>#{3} )"
    	},
    	"class-selector": {
    		syntax: "'.' <ident-token>"
    	},
    	"clip-source": {
    		syntax: "<url>"
    	},
    	color: {
    		syntax: "<color-base> | currentColor | <system-color> | <device-cmyk()>  | <light-dark()> | <-non-standard-color>"
    	},
    	"color()": {
    		syntax: "color( <colorspace-params> [ / [ <alpha-value> | none ] ]? )"
    	},
    	"color-base": {
    		syntax: "<hex-color> | <color-function> | <named-color> | <color-mix()> | transparent"
    	},
    	"color-function": {
    		syntax: "<rgb()> | <rgba()> | <hsl()> | <hsla()> | <hwb()> | <lab()> | <lch()> | <oklab()> | <oklch()> | <color()>"
    	},
    	"color-interpolation-method": {
    		syntax: "in [ <rectangular-color-space> | <polar-color-space> <hue-interpolation-method>? | <custom-color-space> ]"
    	},
    	"color-mix()": {
    		syntax: "color-mix( <color-interpolation-method> , [ <color> && <percentage [0,100]>? ]#{2} )"
    	},
    	"color-stop": {
    		syntax: "<color-stop-length> | <color-stop-angle>"
    	},
    	"color-stop-angle": {
    		syntax: "[ <angle-percentage> | <zero> ]{1,2}"
    	},
    	"color-stop-length": {
    		syntax: "<length-percentage>{1,2}"
    	},
    	"color-stop-list": {
    		syntax: "<linear-color-stop> , [ <linear-color-hint>? , <linear-color-stop> ]#?"
    	},
    	"colorspace-params": {
    		syntax: "[ <predefined-rgb-params> | <xyz-params>]"
    	},
    	combinator: {
    		syntax: "'>' | '+' | '~' | [ '|' '|' ]"
    	},
    	"common-lig-values": {
    		syntax: "[ common-ligatures | no-common-ligatures ]"
    	},
    	"compat-auto": {
    		syntax: "searchfield | textarea | checkbox | radio | menulist | listbox | meter | progress-bar | button"
    	},
    	"compat-special": {
    		syntax: "textfield | menulist-button"
    	},
    	"complex-selector": {
    		syntax: "<complex-selector-unit> [ <combinator>? <complex-selector-unit> ]*"
    	},
    	"complex-selector-list": {
    		syntax: "<complex-selector>#"
    	},
    	"composite-style": {
    		syntax: "clear | copy | source-over | source-in | source-out | source-atop | destination-over | destination-in | destination-out | destination-atop | xor"
    	},
    	"compositing-operator": {
    		syntax: "add | subtract | intersect | exclude"
    	},
    	"compound-selector": {
    		syntax: "[ <type-selector>? <subclass-selector>* ]!"
    	},
    	"compound-selector-list": {
    		syntax: "<compound-selector>#"
    	},
    	"conic-gradient()": {
    		syntax: "conic-gradient( [ <conic-gradient-syntax> ] )"
    	},
    	"conic-gradient-syntax": {
    		syntax: "[ [ [ from [ <angle> | <zero> ] ]? [ at <position> ]? ] || <color-interpolation-method> ]? , <angular-color-stop-list>"
    	},
    	"container-condition": {
    		syntax: "not <query-in-parens> | <query-in-parens> [ [ and <query-in-parens> ]* | [ or <query-in-parens> ]* ]"
    	},
    	"container-name": {
    		syntax: "<custom-ident>"
    	},
    	"container-query": {
    		syntax: "not <query-in-parens> | <query-in-parens> [ [ and <query-in-parens> ]* | [ or <query-in-parens> ]* ]"
    	},
    	"content-distribution": {
    		syntax: "space-between | space-around | space-evenly | stretch"
    	},
    	"content-list": {
    		syntax: "[ <string> | contents | <image> | <counter> | <quote> | <target> | <leader()> | <attr()> ]+"
    	},
    	"content-position": {
    		syntax: "center | start | end | flex-start | flex-end"
    	},
    	"content-replacement": {
    		syntax: "<image>"
    	},
    	"contextual-alt-values": {
    		syntax: "[ contextual | no-contextual ]"
    	},
    	"contrast()": {
    		syntax: "contrast( [ <number> | <percentage> ]? )"
    	},
    	"coord-box": {
    		syntax: "content-box | padding-box | border-box | fill-box | stroke-box | view-box"
    	},
    	"cos()": {
    		syntax: "cos( <calc-sum> )"
    	},
    	counter: {
    		syntax: "<counter()> | <counters()>"
    	},
    	"counter()": {
    		syntax: "counter( <counter-name>, <counter-style>? )"
    	},
    	"counter-name": {
    		syntax: "<custom-ident>"
    	},
    	"counter-style": {
    		syntax: "<counter-style-name> | symbols()"
    	},
    	"counter-style-name": {
    		syntax: "<custom-ident>"
    	},
    	"counters()": {
    		syntax: "counters( <counter-name>, <string>, <counter-style>? )"
    	},
    	"cross-fade()": {
    		syntax: "cross-fade( <cf-mixing-image> , <cf-final-image>? )"
    	},
    	"cubic-bezier()": {
    		syntax: "cubic-bezier( [ <number [0,1]>, <number> ]#{2} )"
    	},
    	"cubic-bezier-easing-function": {
    		syntax: "ease | ease-in | ease-out | ease-in-out | cubic-bezier( <number [0,1]> , <number> , <number [0,1]> , <number> )"
    	},
    	"cursor-predefined": {
    		syntax: "auto | default | none | context-menu | help | pointer | progress | wait | cell | crosshair | text | vertical-text | alias | copy | move | no-drop | not-allowed | e-resize | n-resize | ne-resize | nw-resize | s-resize | se-resize | sw-resize | w-resize | ew-resize | ns-resize | nesw-resize | nwse-resize | col-resize | row-resize | all-scroll | zoom-in | zoom-out | grab | grabbing"
    	},
    	"custom-color-space": {
    		syntax: "<dashed-ident>"
    	},
    	"custom-params": {
    		syntax: "<dashed-ident> [ <number> | <percentage> | none ]+"
    	},
    	dasharray: {
    		syntax: "[ [ <length-percentage> | <number> ]+ ]#"
    	},
    	"dashndashdigit-ident": {
    		syntax: "<ident-token>"
    	},
    	"deprecated-system-color": {
    		syntax: "ActiveBorder | ActiveCaption | AppWorkspace | Background | ButtonHighlight | ButtonShadow | CaptionText | InactiveBorder | InactiveCaption | InactiveCaptionText | InfoBackground | InfoText | Menu | MenuText | Scrollbar | ThreeDDarkShadow | ThreeDFace | ThreeDHighlight | ThreeDLightShadow | ThreeDShadow | Window | WindowFrame | WindowText"
    	},
    	"discretionary-lig-values": {
    		syntax: "[ discretionary-ligatures | no-discretionary-ligatures ]"
    	},
    	"display-box": {
    		syntax: "contents | none"
    	},
    	"display-inside": {
    		syntax: "flow | flow-root | table | flex | grid | ruby"
    	},
    	"display-internal": {
    		syntax: "table-row-group | table-header-group | table-footer-group | table-row | table-cell | table-column-group | table-column | table-caption | ruby-base | ruby-text | ruby-base-container | ruby-text-container"
    	},
    	"display-legacy": {
    		syntax: "inline-block | inline-list-item | inline-table | inline-flex | inline-grid"
    	},
    	"display-listitem": {
    		syntax: "<display-outside>? && [ flow | flow-root ]? && list-item"
    	},
    	"display-outside": {
    		syntax: "block | inline | run-in"
    	},
    	"drop-shadow()": {
    		syntax: "drop-shadow( [ <color>? && <length>{2,3} ] )"
    	},
    	"easing-function": {
    		syntax: "<linear-easing-function> | <cubic-bezier-easing-function> | <step-easing-function>"
    	},
    	"east-asian-variant-values": {
    		syntax: "[ jis78 | jis83 | jis90 | jis04 | simplified | traditional ]"
    	},
    	"east-asian-width-values": {
    		syntax: "[ full-width | proportional-width ]"
    	},
    	"element()": {
    		syntax: "element( <custom-ident> , [ first | start | last | first-except ]? ) | element( <id-selector> )"
    	},
    	"ellipse()": {
    		syntax: "ellipse( <radial-size>? [ at <position> ]? )"
    	},
    	"env()": {
    		syntax: "env( <custom-ident> , <declaration-value>? )"
    	},
    	"exp()": {
    		syntax: "exp( <calc-sum> )"
    	},
    	"explicit-track-list": {
    		syntax: "[ <line-names>? <track-size> ]+ <line-names>?"
    	},
    	"family-name": {
    		syntax: "<string> | <custom-ident>+"
    	},
    	"feature-tag-value": {
    		syntax: "<string> [ <integer> | on | off ]?"
    	},
    	"feature-type": {
    		syntax: "@stylistic | @historical-forms | @styleset | @character-variant | @swash | @ornaments | @annotation"
    	},
    	"feature-value-block": {
    		syntax: "<feature-type> '{' <feature-value-declaration-list> '}'"
    	},
    	"feature-value-block-list": {
    		syntax: "<feature-value-block>+"
    	},
    	"feature-value-declaration": {
    		syntax: "<custom-ident>: <integer>+;"
    	},
    	"feature-value-declaration-list": {
    		syntax: "<feature-value-declaration>"
    	},
    	"feature-value-name": {
    		syntax: "<custom-ident>"
    	},
    	"filter-function": {
    		syntax: "<blur()> | <brightness()> | <contrast()> | <drop-shadow()> | <grayscale()> | <hue-rotate()> | <invert()> | <opacity()> | <saturate()> | <sepia()>"
    	},
    	"filter-value-list": {
    		syntax: "[ <filter-function> | <url> ]+"
    	},
    	"final-bg-layer": {
    		syntax: "<bg-image> || <bg-position> [ / <bg-size> ]? || <repeat-style> || <attachment> || <visual-box> || <visual-box> || <'background-color'>"
    	},
    	"fit-content()": {
    		syntax: "fit-content( <length-percentage [0,∞]> )"
    	},
    	"fixed-breadth": {
    		syntax: "<length-percentage>"
    	},
    	"fixed-repeat": {
    		syntax: "repeat( [ <integer [1,∞]> ] , [ <line-names>? <fixed-size> ]+ <line-names>? )"
    	},
    	"fixed-size": {
    		syntax: "<fixed-breadth> | minmax( <fixed-breadth> , <track-breadth> ) | minmax( <inflexible-breadth> , <fixed-breadth> )"
    	},
    	"font-stretch-absolute": {
    		syntax: "normal | ultra-condensed | extra-condensed | condensed | semi-condensed | semi-expanded | expanded | extra-expanded | ultra-expanded | <percentage>"
    	},
    	"font-variant-css2": {
    		syntax: "normal | small-caps"
    	},
    	"font-weight-absolute": {
    		syntax: "normal | bold | <number [1,1000]>"
    	},
    	"font-width-css3": {
    		syntax: "normal | ultra-condensed | extra-condensed | condensed | semi-condensed | semi-expanded | expanded | extra-expanded | ultra-expanded"
    	},
    	"form-control-identifier": {
    		syntax: "select"
    	},
    	"frequency-percentage": {
    		syntax: "<frequency> | <percentage>"
    	},
    	"generic-complete": {
    		syntax: "serif | sans-serif | system-ui | cursive | fantasy | math | monospace"
    	},
    	"general-enclosed": {
    		syntax: "[ <function-token> <any-value>? ) ] | [ ( <any-value>? ) ]"
    	},
    	"generic-family": {
    		syntax: "<generic-script-specific>| <generic-complete> | <generic-incomplete> | <-non-standard-generic-family>"
    	},
    	"generic-incomplete": {
    		syntax: "ui-serif | ui-sans-serif | ui-monospace | ui-rounded"
    	},
    	"geometry-box": {
    		syntax: "<shape-box> | fill-box | stroke-box | view-box"
    	},
    	gradient: {
    		syntax: "| <-legacy-gradient>"
    	},
    	"grayscale()": {
    		syntax: "grayscale( [ <number> | <percentage> ]? )"
    	},
    	"grid-line": {
    		syntax: "auto | <custom-ident> | [ <integer> && <custom-ident>? ] | [ span && [ <integer> || <custom-ident> ] ]"
    	},
    	"historical-lig-values": {
    		syntax: "[ historical-ligatures | no-historical-ligatures ]"
    	},
    	"hsl()": {
    		syntax: "hsl( <hue>, <percentage>, <percentage>, <alpha-value>? ) | hsl( [ <hue> | none ] [ <percentage> | <number> | none ] [ <percentage> | <number> | none ] [ / [ <alpha-value> | none ] ]? )"
    	},
    	"hsla()": {
    		syntax: "hsla( <hue>, <percentage>, <percentage>, <alpha-value>? ) | hsla( [ <hue> | none ] [ <percentage> | <number> | none ] [ <percentage> | <number> | none ] [ / [ <alpha-value> | none ] ]? )"
    	},
    	hue: {
    		syntax: "<number> | <angle>"
    	},
    	"hue-interpolation-method": {
    		syntax: "[ shorter | longer | increasing | decreasing ] hue"
    	},
    	"hue-rotate()": {
    		syntax: "hue-rotate( [ <angle> | <zero> ]? )"
    	},
    	"hwb()": {
    		syntax: "hwb( [ <hue> | none ] [ <percentage> | <number> | none ] [ <percentage> | <number> | none ] [ / [ <alpha-value> | none ] ]? )"
    	},
    	"hypot()": {
    		syntax: "hypot( <calc-sum># )"
    	},
    	"id-selector": {
    		syntax: "<hash-token>"
    	},
    	image: {
    		syntax: "<url> | <image()> | <image-set()> | <element()> | <paint()> | <cross-fade()> | <gradient>"
    	},
    	"image()": {
    		syntax: "image( <image-tags>? [ <image-src>? , <color>? ]! )"
    	},
    	"image-set()": {
    		syntax: "image-set( <image-set-option># )"
    	},
    	"image-set-option": {
    		syntax: "[ <image> | <string> ] [ <resolution> || type(<string>) ]"
    	},
    	"image-src": {
    		syntax: "<url> | <string>"
    	},
    	"image-tags": {
    		syntax: "ltr | rtl"
    	},
    	"inflexible-breadth": {
    		syntax: "<length-percentage> | min-content | max-content | auto"
    	},
    	"inset()": {
    		syntax: "inset( <length-percentage>{1,4} [ round <'border-radius'> ]? )"
    	},
    	integer: {
    		syntax: "<number-token>"
    	},
    	"invert()": {
    		syntax: "invert( [ <number> | <percentage> ]? )"
    	},
    	"keyframe-block": {
    		syntax: "<keyframe-selector># {\n  <declaration-list>\n}"
    	},
    	"keyframe-selector": {
    		syntax: "from | to | <percentage [0,100]> | <timeline-range-name> <percentage>"
    	},
    	"keyframes-name": {
    		syntax: "<custom-ident> | <string>"
    	},
    	"lab()": {
    		syntax: "lab( [<percentage> | <number> | none] [ <percentage> | <number> | none] [ <percentage> | <number> | none] [ / [<alpha-value> | none] ]? )"
    	},
    	"layer()": {
    		syntax: "layer( <layer-name> )"
    	},
    	"layer-name": {
    		syntax: "<ident> [ '.' <ident> ]*"
    	},
    	"lch()": {
    		syntax: "lch( [<percentage> | <number> | none] [ <percentage> | <number> | none] [ <hue> | none] [ / [<alpha-value> | none] ]? )"
    	},
    	"leader()": {
    		syntax: "leader( <leader-type> )"
    	},
    	"leader-type": {
    		syntax: "dotted | solid | space | <string>"
    	},
    	"length-percentage": {
    		syntax: "<length> | <percentage>"
    	},
    	"light-dark()": {
    		syntax: "light-dark( <color>, <color> )"
    	},
    	"line-name-list": {
    		syntax: "[ <line-names> | <name-repeat> ]+"
    	},
    	"line-names": {
    		syntax: "'[' <custom-ident>* ']'"
    	},
    	"line-style": {
    		syntax: "none | hidden | dotted | dashed | solid | double | groove | ridge | inset | outset"
    	},
    	"line-width": {
    		syntax: "<length> | thin | medium | thick"
    	},
    	"linear()": {
    		syntax: "linear( [ <number> && <percentage>{0,2} ]# )"
    	},
    	"linear-color-hint": {
    		syntax: "<length-percentage>"
    	},
    	"linear-color-stop": {
    		syntax: "<color> <color-stop-length>?"
    	},
    	"linear-easing-function": {
    		syntax: "linear | <linear()>"
    	},
    	"linear-gradient()": {
    		syntax: "linear-gradient( [ <linear-gradient-syntax> ] )"
    	},
    	"linear-gradient-syntax": {
    		syntax: "[ [ <angle> | <zero> | to <side-or-corner> ] || <color-interpolation-method> ]? , <color-stop-list>"
    	},
    	"log()": {
    		syntax: "log( <calc-sum>, <calc-sum>? )"
    	},
    	"mask-layer": {
    		syntax: "<mask-reference> || <position> [ / <bg-size> ]? || <repeat-style> || <geometry-box> || [ <geometry-box> | no-clip ] || <compositing-operator> || <masking-mode>"
    	},
    	"mask-position": {
    		syntax: "[ <length-percentage> | left | center | right ] [ <length-percentage> | top | center | bottom ]?"
    	},
    	"mask-reference": {
    		syntax: "none | <image> | <mask-source>"
    	},
    	"mask-source": {
    		syntax: "<url>"
    	},
    	"masking-mode": {
    		syntax: "alpha | luminance | match-source"
    	},
    	"matrix()": {
    		syntax: "matrix( <number>#{6} )"
    	},
    	"matrix3d()": {
    		syntax: "matrix3d( <number>#{16} )"
    	},
    	"max()": {
    		syntax: "max( <calc-sum># )"
    	},
    	"media-and": {
    		syntax: "<media-in-parens> [ and <media-in-parens> ]+"
    	},
    	"media-condition": {
    		syntax: "<media-not> | <media-and> | <media-or> | <media-in-parens>"
    	},
    	"media-condition-without-or": {
    		syntax: "<media-not> | <media-and> | <media-in-parens>"
    	},
    	"media-feature": {
    		syntax: "( [ <mf-plain> | <mf-boolean> | <mf-range> ] )"
    	},
    	"media-in-parens": {
    		syntax: "( <media-condition> ) | <media-feature> | <general-enclosed>"
    	},
    	"media-not": {
    		syntax: "not <media-in-parens>"
    	},
    	"media-or": {
    		syntax: "<media-in-parens> [ or <media-in-parens> ]+"
    	},
    	"media-query": {
    		syntax: "<media-condition> | [ not | only ]? <media-type> [ and <media-condition-without-or> ]?"
    	},
    	"media-query-list": {
    		syntax: "<media-query>#"
    	},
    	"media-type": {
    		syntax: "<ident>"
    	},
    	"mf-boolean": {
    		syntax: "<mf-name>"
    	},
    	"mf-name": {
    		syntax: "<ident>"
    	},
    	"mf-plain": {
    		syntax: "<mf-name> : <mf-value>"
    	},
    	"mf-range": {
    		syntax: "<mf-name> [ '<' | '>' ]? '='? <mf-value>\n| <mf-value> [ '<' | '>' ]? '='? <mf-name>\n| <mf-value> '<' '='? <mf-name> '<' '='? <mf-value>\n| <mf-value> '>' '='? <mf-name> '>' '='? <mf-value>"
    	},
    	"mf-value": {
    		syntax: "<number> | <dimension> | <ident> | <ratio>"
    	},
    	"min()": {
    		syntax: "min( <calc-sum># )"
    	},
    	"minmax()": {
    		syntax: "minmax( [ <length-percentage> | min-content | max-content | auto ] , [ <length-percentage> | <flex> | min-content | max-content | auto ] )"
    	},
    	"mod()": {
    		syntax: "mod( <calc-sum>, <calc-sum> )"
    	},
    	"n-dimension": {
    		syntax: "<dimension-token>"
    	},
    	"name-repeat": {
    		syntax: "repeat( [ <integer [1,∞]> | auto-fill ], <line-names>+ )"
    	},
    	"named-color": {
    		syntax: "aliceblue | antiquewhite | aqua | aquamarine | azure | beige | bisque | black | blanchedalmond | blue | blueviolet | brown | burlywood | cadetblue | chartreuse | chocolate | coral | cornflowerblue | cornsilk | crimson | cyan | darkblue | darkcyan | darkgoldenrod | darkgray | darkgreen | darkgrey | darkkhaki | darkmagenta | darkolivegreen | darkorange | darkorchid | darkred | darksalmon | darkseagreen | darkslateblue | darkslategray | darkslategrey | darkturquoise | darkviolet | deeppink | deepskyblue | dimgray | dimgrey | dodgerblue | firebrick | floralwhite | forestgreen | fuchsia | gainsboro | ghostwhite | gold | goldenrod | gray | green | greenyellow | grey | honeydew | hotpink | indianred | indigo | ivory | khaki | lavender | lavenderblush | lawngreen | lemonchiffon | lightblue | lightcoral | lightcyan | lightgoldenrodyellow | lightgray | lightgreen | lightgrey | lightpink | lightsalmon | lightseagreen | lightskyblue | lightslategray | lightslategrey | lightsteelblue | lightyellow | lime | limegreen | linen | magenta | maroon | mediumaquamarine | mediumblue | mediumorchid | mediumpurple | mediumseagreen | mediumslateblue | mediumspringgreen | mediumturquoise | mediumvioletred | midnightblue | mintcream | mistyrose | moccasin | navajowhite | navy | oldlace | olive | olivedrab | orange | orangered | orchid | palegoldenrod | palegreen | paleturquoise | palevioletred | papayawhip | peachpuff | peru | pink | plum | powderblue | purple | rebeccapurple | red | rosybrown | royalblue | saddlebrown | salmon | sandybrown | seagreen | seashell | sienna | silver | skyblue | slateblue | slategray | slategrey | snow | springgreen | steelblue | tan | teal | thistle | tomato | turquoise | violet | wheat | white | whitesmoke | yellow | yellowgreen"
    	},
    	"namespace-prefix": {
    		syntax: "<ident>"
    	},
    	"ndash-dimension": {
    		syntax: "<dimension-token>"
    	},
    	"ndashdigit-dimension": {
    		syntax: "<dimension-token>"
    	},
    	"ndashdigit-ident": {
    		syntax: "<ident-token>"
    	},
    	"ns-prefix": {
    		syntax: "[ <ident-token> | '*' ]? '|'"
    	},
    	"number-percentage": {
    		syntax: "<number> | <percentage>"
    	},
    	"numeric-figure-values": {
    		syntax: "[ lining-nums | oldstyle-nums ]"
    	},
    	"numeric-fraction-values": {
    		syntax: "[ diagonal-fractions | stacked-fractions ]"
    	},
    	"numeric-spacing-values": {
    		syntax: "[ proportional-nums | tabular-nums ]"
    	},
    	"offset-path": {
    		syntax: "<ray()> | <url> | <basic-shape>"
    	},
    	"oklab()": {
    		syntax: "oklab( [ <percentage> | <number> | none] [ <percentage> | <number> | none] [ <percentage> | <number> | none] [ / [<alpha-value> | none] ]? )"
    	},
    	"oklch()": {
    		syntax: "oklch( [ <percentage> | <number> | none] [ <percentage> | <number> | none] [ <hue> | none] [ / [<alpha-value> | none] ]? )"
    	},
    	"opacity()": {
    		syntax: "opacity( [ <number> | <percentage> ]? )"
    	},
    	"opacity-value": {
    		syntax: "<number> | <percentage>"
    	},
    	"outline-line-style": {
    		syntax: "none | dotted | dashed | solid | double | groove | ridge | inset | outset"
    	},
    	"outline-radius": {
    		syntax: "<length> | <percentage>"
    	},
    	"overflow-position": {
    		syntax: "unsafe | safe"
    	},
    	"page-body": {
    		syntax: "<declaration>? [ ; <page-body> ]? | <page-margin-box> <page-body>"
    	},
    	"page-margin-box": {
    		syntax: "<page-margin-box-type> '{' <declaration-list> '}'"
    	},
    	"page-margin-box-type": {
    		syntax: "@top-left-corner | @top-left | @top-center | @top-right | @top-right-corner | @bottom-left-corner | @bottom-left | @bottom-center | @bottom-right | @bottom-right-corner | @left-top | @left-middle | @left-bottom | @right-top | @right-middle | @right-bottom"
    	},
    	"page-selector": {
    		syntax: "<pseudo-page>+ | <ident> <pseudo-page>*"
    	},
    	"page-selector-list": {
    		syntax: "[ <page-selector># ]?"
    	},
    	"page-size": {
    		syntax: "A5 | A4 | A3 | B5 | B4 | JIS-B5 | JIS-B4 | letter | legal | ledger"
    	},
    	paint: {
    		syntax: "none | <color> | <url> [ none | <color> ]? | context-fill | context-stroke"
    	},
    	"paint()": {
    		syntax: "paint( <ident>, <declaration-value>? )"
    	},
    	"paint-box": {
    		syntax: "<visual-box> | fill-box | stroke-box"
    	},
    	"palette-identifier": {
    		syntax: "<dashed-ident>"
    	},
    	"palette-mix()": {
    		syntax: "palette-mix(<color-interpolation-method> , [ [normal | light | dark | <palette-identifier> | <palette-mix()> ] && <percentage [0,100]>? ]#{2})"
    	},
    	"path()": {
    		syntax: "path( <'fill-rule'>? , <string> )"
    	},
    	"perspective()": {
    		syntax: "perspective( [ <length [0,∞]> | none ] )"
    	},
    	"polar-color-space": {
    		syntax: "hsl | hwb | lch | oklch"
    	},
    	"polygon()": {
    		syntax: "polygon( <'fill-rule'>? , [ <length-percentage> <length-percentage> ]# )"
    	},
    	position: {
    		syntax: "[ [ left | center | right ] || [ top | center | bottom ] | [ left | center | right | <length-percentage> ] [ top | center | bottom | <length-percentage> ]? | [ [ left | right ] <length-percentage> ] && [ [ top | bottom ] <length-percentage> ] ]"
    	},
    	"position-area": {
    		syntax: "[ [ left | center | right | span-left | span-right | x-start | x-end | span-x-start | span-x-end | x-self-start | x-self-end | span-x-self-start | span-x-self-end | span-all ] || [ top | center | bottom | span-top | span-bottom | y-start | y-end | span-y-start | span-y-end | y-self-start | y-self-end | span-y-self-start | span-y-self-end | span-all ] | [ block-start | center | block-end | span-block-start | span-block-end | span-all ] || [ inline-start | center | inline-end | span-inline-start | span-inline-end | span-all ] | [ self-block-start | center | self-block-end | span-self-block-start | span-self-block-end | span-all ] || [ self-inline-start | center | self-inline-end | span-self-inline-start | span-self-inline-end | span-all ] | [ start | center | end | span-start | span-end | span-all ]{1,2} | [ self-start | center | self-end | span-self-start | span-self-end | span-all ]{1,2} ]"
    	},
    	"pow()": {
    		syntax: "pow( <calc-sum>, <calc-sum> )"
    	},
    	"predefined-rgb": {
    		syntax: "srgb | srgb-linear | display-p3 | a98-rgb | prophoto-rgb | rec2020"
    	},
    	"predefined-rgb-params": {
    		syntax: "<predefined-rgb> [ <number> | <percentage> | none ]{3}"
    	},
    	"pseudo-class-selector": {
    		syntax: "':' <ident-token> | ':' <function-token> <any-value> ')'"
    	},
    	"pseudo-element-selector": {
    		syntax: "':' <pseudo-class-selector> | <legacy-pseudo-element-selector>"
    	},
    	"pseudo-page": {
    		syntax: ": [ left | right | first | blank ]"
    	},
    	"query-in-parens": {
    		syntax: "( <container-condition> ) | ( <size-feature> ) | style( <style-query> ) | <general-enclosed>"
    	},
    	quote: {
    		syntax: "open-quote | close-quote | no-open-quote | no-close-quote"
    	},
    	"radial-extent": {
    		syntax: "closest-corner | closest-side | farthest-corner | farthest-side"
    	},
    	"radial-gradient()": {
    		syntax: "radial-gradient( [ <radial-gradient-syntax> ] )"
    	},
    	"radial-gradient-syntax": {
    		syntax: "[ [ [ <radial-shape> || <radial-size> ]? [ at <position> ]? ] || <color-interpolation-method> ]? , <color-stop-list>"
    	},
    	"radial-shape": {
    		syntax: "circle | ellipse"
    	},
    	"radial-size": {
    		syntax: "<radial-extent> | <length [0,∞]> | <length-percentage [0,∞]>{2}"
    	},
    	ratio: {
    		syntax: "<number [0,∞]> [ / <number [0,∞]> ]?"
    	},
    	"ray()": {
    		syntax: "ray( <angle> && <ray-size>? && contain? && [at <position>]? )"
    	},
    	"ray-size": {
    		syntax: "closest-side | closest-corner | farthest-side | farthest-corner | sides"
    	},
    	"rect()": {
    		syntax: "rect( [ <length-percentage> | auto ]{4} [ round <'border-radius'> ]? )"
    	},
    	"rectangular-color-space": {
    		syntax: "srgb | srgb-linear | display-p3 | a98-rgb | prophoto-rgb | rec2020 | lab | oklab | xyz | xyz-d50 | xyz-d65"
    	},
    	"relative-selector": {
    		syntax: "<combinator>? <complex-selector>"
    	},
    	"relative-selector-list": {
    		syntax: "<relative-selector>#"
    	},
    	"relative-size": {
    		syntax: "larger | smaller"
    	},
    	"rem()": {
    		syntax: "rem( <calc-sum>, <calc-sum> )"
    	},
    	"repeat-style": {
    		syntax: "repeat-x | repeat-y | [ repeat | space | round | no-repeat ]{1,2}"
    	},
    	"repeating-conic-gradient()": {
    		syntax: "repeating-conic-gradient( [ <conic-gradient-syntax> ] )"
    	},
    	"repeating-linear-gradient()": {
    		syntax: "repeating-linear-gradient( [ <linear-gradient-syntax> ] )"
    	},
    	"repeating-radial-gradient()": {
    		syntax: "repeating-radial-gradient( [ <radial-gradient-syntax> ] )"
    	},
    	"reversed-counter-name": {
    		syntax: "reversed( <counter-name> )"
    	},
    	"rgb()": {
    		syntax: "rgb( <percentage>#{3} , <alpha-value>? ) | rgb( <number>#{3} , <alpha-value>? ) | rgb( [ <number> | <percentage> | none ]{3} [ / [ <alpha-value> | none ] ]? )"
    	},
    	"rgba()": {
    		syntax: "rgba( <percentage>#{3} , <alpha-value>? ) | rgba( <number>#{3} , <alpha-value>? ) | rgba( [ <number> | <percentage> | none ]{3} [ / [ <alpha-value> | none ] ]? )"
    	},
    	"rotate()": {
    		syntax: "rotate( [ <angle> | <zero> ] )"
    	},
    	"rotate3d()": {
    		syntax: "rotate3d( <number> , <number> , <number> , [ <angle> | <zero> ] )"
    	},
    	"rotateX()": {
    		syntax: "rotateX( [ <angle> | <zero> ] )"
    	},
    	"rotateY()": {
    		syntax: "rotateY( [ <angle> | <zero> ] )"
    	},
    	"rotateZ()": {
    		syntax: "rotateZ( [ <angle> | <zero> ] )"
    	},
    	"round()": {
    		syntax: "round( <rounding-strategy>?, <calc-sum>, <calc-sum> )"
    	},
    	"rounding-strategy": {
    		syntax: "nearest | up | down | to-zero"
    	},
    	"saturate()": {
    		syntax: "saturate( [ <number> | <percentage> ]? )"
    	},
    	"scale()": {
    		syntax: "scale( [ <number> | <percentage> ]#{1,2} )"
    	},
    	"scale3d()": {
    		syntax: "scale3d( [ <number> | <percentage> ]#{3} )"
    	},
    	"scaleX()": {
    		syntax: "scaleX( [ <number> | <percentage> ] )"
    	},
    	"scaleY()": {
    		syntax: "scaleY( [ <number> | <percentage> ] )"
    	},
    	"scaleZ()": {
    		syntax: "scaleZ( [ <number> | <percentage> ] )"
    	},
    	"scope-end": {
    		syntax: "<forgiving-selector-list>"
    	},
    	"scope-start": {
    		syntax: "<forgiving-selector-list>"
    	},
    	"scroll()": {
    		syntax: "scroll( [ <scroller> || <axis> ]? )"
    	},
    	scroller: {
    		syntax: "root | nearest | self"
    	},
    	"scroll-state-feature": {
    		syntax: "<media-query-list>"
    	},
    	"scroll-state-in-parens": {
    		syntax: "( <scroll-state-query> ) | ( <scroll-state-feature> ) | <general-enclosed>"
    	},
    	"scroll-state-query": {
    		syntax: "not <scroll-state-in-parens> | <scroll-state-in-parens> [ [ and <scroll-state-in-parens> ]* | [ or <scroll-state-in-parens> ]* ] | <scroll-state-feature>  "
    	},
    	"selector-list": {
    		syntax: "<complex-selector-list>"
    	},
    	"self-position": {
    		syntax: "center | start | end | self-start | self-end | flex-start | flex-end"
    	},
    	"sepia()": {
    		syntax: "sepia( [ <number> | <percentage> ]? )"
    	},
    	shadow: {
    		syntax: "inset? && <length>{2,4} && <color>?"
    	},
    	"shadow-t": {
    		syntax: "[ <length>{2,3} && <color>? ]"
    	},
    	shape: {
    		syntax: "rect( <top>, <right>, <bottom>, <left> ) | rect( <top> <right> <bottom> <left> )"
    	},
    	"shape-box": {
    		syntax: "<visual-box> | margin-box"
    	},
    	"side-or-corner": {
    		syntax: "[ left | right ] || [ top | bottom ]"
    	},
    	"sign()": {
    		syntax: "sign( <calc-sum> )"
    	},
    	"signed-integer": {
    		syntax: "<number-token>"
    	},
    	"signless-integer": {
    		syntax: "<number-token>"
    	},
    	"sin()": {
    		syntax: "sin( <calc-sum> )"
    	},
    	"single-animation": {
    		syntax: "<'animation-duration'> || <easing-function> || <'animation-delay'> || <single-animation-iteration-count> || <single-animation-direction> || <single-animation-fill-mode> || <single-animation-play-state> || [ none | <keyframes-name> ] || <single-animation-timeline>"
    	},
    	"single-animation-composition": {
    		syntax: "replace | add | accumulate"
    	},
    	"single-animation-direction": {
    		syntax: "normal | reverse | alternate | alternate-reverse"
    	},
    	"single-animation-fill-mode": {
    		syntax: "none | forwards | backwards | both"
    	},
    	"single-animation-iteration-count": {
    		syntax: "infinite | <number>"
    	},
    	"single-animation-play-state": {
    		syntax: "running | paused"
    	},
    	"single-animation-timeline": {
    		syntax: "auto | none | <dashed-ident> | <scroll()> | <view()>"
    	},
    	"single-transition": {
    		syntax: "[ none | <single-transition-property> ] || <time> || <easing-function> || <time> || <transition-behavior-value>"
    	},
    	"single-transition-property": {
    		syntax: "all | <custom-ident>"
    	},
    	size: {
    		syntax: "closest-side | farthest-side | closest-corner | farthest-corner | <length> | <length-percentage>{2}"
    	},
    	"size-feature": {
    		syntax: "<mf-plain> | <mf-boolean> | <mf-range>"
    	},
    	"skew()": {
    		syntax: "skew( [ <angle> | <zero> ] , [ <angle> | <zero> ]? )"
    	},
    	"skewX()": {
    		syntax: "skewX( [ <angle> | <zero> ] )"
    	},
    	"skewY()": {
    		syntax: "skewY( [ <angle> | <zero> ] )"
    	},
    	"sqrt()": {
    		syntax: "sqrt( <calc-sum> )"
    	},
    	"step-position": {
    		syntax: "jump-start | jump-end | jump-none | jump-both | start | end"
    	},
    	"step-easing-function": {
    		syntax: "step-start | step-end | <steps()>"
    	},
    	"steps()": {
    		syntax: "steps( <integer>, <step-position>? )"
    	},
    	"style-feature": {
    		syntax: "<declaration>"
    	},
    	"style-in-parens": {
    		syntax: "( <style-condition> ) | ( <style-feature> ) | <general-enclosed>"
    	},
    	"style-query": {
    		syntax: "<style-condition> | <style-feature>"
    	},
    	"subclass-selector": {
    		syntax: "<id-selector> | <class-selector> | <attribute-selector> | <pseudo-class-selector>"
    	},
    	"supports-condition": {
    		syntax: "not <supports-in-parens> | <supports-in-parens> [ and <supports-in-parens> ]* | <supports-in-parens> [ or <supports-in-parens> ]*"
    	},
    	"supports-decl": {
    		syntax: "( <declaration> )"
    	},
    	"supports-feature": {
    		syntax: "<supports-decl> | <supports-selector-fn>"
    	},
    	"supports-in-parens": {
    		syntax: "( <supports-condition> ) | <supports-feature> | <general-enclosed>"
    	},
    	"supports-selector-fn": {
    		syntax: "selector( <complex-selector> )"
    	},
    	symbol: {
    		syntax: "<string> | <image> | <custom-ident>"
    	},
    	"symbols()": {
    		syntax: "symbols( <symbols-type>? [ <string> | <image> ]+ )"
    	},
    	"symbols-type": {
    		syntax: "cyclic | numeric | alphabetic | symbolic | fixed"
    	},
    	"system-color": {
    		syntax: "AccentColor | AccentColorText | ActiveText | ButtonBorder | ButtonFace | ButtonText | Canvas | CanvasText | Field | FieldText | GrayText | Highlight | HighlightText | LinkText | Mark | MarkText | SelectedItem | SelectedItemText | VisitedText"
    	},
    	"system-family-name": {
    		syntax: "caption | icon | menu | message-box | small-caption | status-bar"
    	},
    	"tan()": {
    		syntax: "tan( <calc-sum> )"
    	},
    	target: {
    		syntax: "<target-counter()> | <target-counters()> | <target-text()>"
    	},
    	"target-counter()": {
    		syntax: "target-counter( [ <string> | <url> ] , <custom-ident> , <counter-style>? )"
    	},
    	"target-counters()": {
    		syntax: "target-counters( [ <string> | <url> ] , <custom-ident> , <string> , <counter-style>? )"
    	},
    	"target-text()": {
    		syntax: "target-text( [ <string> | <url> ] , [ content | before | after | first-letter ]? )"
    	},
    	"text-edge": {
    		syntax: "[ text | cap | ex | ideographic | ideographic-ink ] [ text | alphabetic | ideographic | ideographic-ink ]?"
    	},
    	"time-percentage": {
    		syntax: "<time> | <percentage>"
    	},
    	"timeline-range-name": {
    		syntax: "cover | contain | entry | exit | entry-crossing | exit-crossing"
    	},
    	"track-breadth": {
    		syntax: "<length-percentage> | <flex> | min-content | max-content | auto | <-non-standard-size>"
    	},
    	"track-list": {
    		syntax: "[ <line-names>? [ <track-size> | <track-repeat> ] ]+ <line-names>?"
    	},
    	"track-repeat": {
    		syntax: "repeat( [ <integer [1,∞]> ] , [ <line-names>? <track-size> ]+ <line-names>? )"
    	},
    	"track-size": {
    		syntax: "<track-breadth> | minmax( <inflexible-breadth> , <track-breadth> ) | fit-content( <length-percentage> )"
    	},
    	"transform-function": {
    		syntax: "<matrix()> | <translate()> | <translateX()> | <translateY()> | <scale()> | <scaleX()> | <scaleY()> | <rotate()> | <skew()> | <skewX()> | <skewY()> | <matrix3d()> | <translate3d()> | <translateZ()> | <scale3d()> | <scaleZ()> | <rotate3d()> | <rotateX()> | <rotateY()> | <rotateZ()> | <perspective()>"
    	},
    	"transform-list": {
    		syntax: "<transform-function>+"
    	},
    	"transition-behavior-value": {
    		syntax: "normal | allow-discrete"
    	},
    	"translate()": {
    		syntax: "translate( <length-percentage> , <length-percentage>? )"
    	},
    	"translate3d()": {
    		syntax: "translate3d( <length-percentage> , <length-percentage> , <length> )"
    	},
    	"translateX()": {
    		syntax: "translateX( <length-percentage> )"
    	},
    	"translateY()": {
    		syntax: "translateY( <length-percentage> )"
    	},
    	"translateZ()": {
    		syntax: "translateZ( <length> )"
    	},
    	"try-size": {
    		syntax: "most-width | most-height | most-block-size | most-inline-size"
    	},
    	"try-tactic": {
    		syntax: "flip-block || flip-inline || flip-start"
    	},
    	"type-or-unit": {
    		syntax: "string | color | url | integer | number | length | angle | time | frequency | cap | ch | em | ex | ic | lh | rlh | rem | vb | vi | vw | vh | vmin | vmax | mm | Q | cm | in | pt | pc | px | deg | grad | rad | turn | ms | s | Hz | kHz | %"
    	},
    	"type-selector": {
    		syntax: "<wq-name> | <ns-prefix>? '*'"
    	},
    	"var()": {
    		syntax: "var( <custom-property-name> , <declaration-value>? )"
    	},
    	"view()": {
    		syntax: "view([<axis> || <'view-timeline-inset'>]?)"
    	},
    	"viewport-length": {
    		syntax: "auto | <length-percentage>"
    	},
    	"visual-box": {
    		syntax: "content-box | padding-box | border-box"
    	},
    	"wq-name": {
    		syntax: "<ns-prefix>? <ident-token>"
    	},
    	"xywh()": {
    		syntax: "xywh( <length-percentage>{2} <length-percentage [0,∞]>{2} [ round <'border-radius'> ]? )"
    	},
    	xyz: {
    		syntax: "xyz | xyz-d50 | xyz-d65"
    	},
    	"xyz-params": {
    		syntax: "<xyz-space> [ <number> | <percentage> | none ]{3}"
    	},
    	"-legacy-gradient": {
    		syntax: "<-webkit-gradient()> | <-legacy-linear-gradient> | <-legacy-repeating-linear-gradient> | <-legacy-radial-gradient> | <-legacy-repeating-radial-gradient>"
    	},
    	"-legacy-linear-gradient": {
    		syntax: "-moz-linear-gradient( <-legacy-linear-gradient-arguments> ) | -webkit-linear-gradient( <-legacy-linear-gradient-arguments> ) | -o-linear-gradient( <-legacy-linear-gradient-arguments> )"
    	},
    	"-legacy-repeating-linear-gradient": {
    		syntax: "-moz-repeating-linear-gradient( <-legacy-linear-gradient-arguments> ) | -webkit-repeating-linear-gradient( <-legacy-linear-gradient-arguments> ) | -o-repeating-linear-gradient( <-legacy-linear-gradient-arguments> )"
    	},
    	"-legacy-linear-gradient-arguments": {
    		syntax: "[ <angle> | <side-or-corner> ]? , <color-stop-list>"
    	},
    	"-legacy-radial-gradient": {
    		syntax: "-moz-radial-gradient( <-legacy-radial-gradient-arguments> ) | -webkit-radial-gradient( <-legacy-radial-gradient-arguments> ) | -o-radial-gradient( <-legacy-radial-gradient-arguments> )"
    	},
    	"-legacy-repeating-radial-gradient": {
    		syntax: "-moz-repeating-radial-gradient( <-legacy-radial-gradient-arguments> ) | -webkit-repeating-radial-gradient( <-legacy-radial-gradient-arguments> ) | -o-repeating-radial-gradient( <-legacy-radial-gradient-arguments> )"
    	},
    	"-legacy-radial-gradient-arguments": {
    		syntax: "[ <position> , ]? [ [ [ <-legacy-radial-gradient-shape> || <-legacy-radial-gradient-size> ] | [ <length> | <percentage> ]{2} ] , ]? <color-stop-list>"
    	},
    	"-legacy-radial-gradient-size": {
    		syntax: "closest-side | closest-corner | farthest-side | farthest-corner | contain | cover"
    	},
    	"-legacy-radial-gradient-shape": {
    		syntax: "circle | ellipse"
    	},
    	"-non-standard-font": {
    		syntax: "-apple-system-body | -apple-system-headline | -apple-system-subheadline | -apple-system-caption1 | -apple-system-caption2 | -apple-system-footnote | -apple-system-short-body | -apple-system-short-headline | -apple-system-short-subheadline | -apple-system-short-caption1 | -apple-system-short-footnote | -apple-system-tall-body"
    	},
    	"-non-standard-color": {
    		syntax: "-moz-ButtonDefault | -moz-ButtonHoverFace | -moz-ButtonHoverText | -moz-CellHighlight | -moz-CellHighlightText | -moz-Combobox | -moz-ComboboxText | -moz-Dialog | -moz-DialogText | -moz-dragtargetzone | -moz-EvenTreeRow | -moz-Field | -moz-FieldText | -moz-html-CellHighlight | -moz-html-CellHighlightText | -moz-mac-accentdarkestshadow | -moz-mac-accentdarkshadow | -moz-mac-accentface | -moz-mac-accentlightesthighlight | -moz-mac-accentlightshadow | -moz-mac-accentregularhighlight | -moz-mac-accentregularshadow | -moz-mac-chrome-active | -moz-mac-chrome-inactive | -moz-mac-focusring | -moz-mac-menuselect | -moz-mac-menushadow | -moz-mac-menutextselect | -moz-MenuHover | -moz-MenuHoverText | -moz-MenuBarText | -moz-MenuBarHoverText | -moz-nativehyperlinktext | -moz-OddTreeRow | -moz-win-communicationstext | -moz-win-mediatext | -moz-activehyperlinktext | -moz-default-background-color | -moz-default-color | -moz-hyperlinktext | -moz-visitedhyperlinktext | -webkit-activelink | -webkit-focus-ring-color | -webkit-link | -webkit-text"
    	},
    	"-non-standard-image-rendering": {
    		syntax: "optimize-contrast | -moz-crisp-edges | -o-crisp-edges | -webkit-optimize-contrast"
    	},
    	"-non-standard-overflow": {
    		syntax: "overlay | -moz-scrollbars-none | -moz-scrollbars-horizontal | -moz-scrollbars-vertical | -moz-hidden-unscrollable"
    	},
    	"-non-standard-size": {
    		syntax: "intrinsic | min-intrinsic | -webkit-fill-available | -webkit-fit-content | -webkit-min-content | -webkit-max-content  | -moz-available | -moz-fit-content | -moz-min-content | -moz-max-content"
    	},
    	"-webkit-gradient()": {
    		syntax: "-webkit-gradient( <-webkit-gradient-type>, <-webkit-gradient-point> [, <-webkit-gradient-point> | , <-webkit-gradient-radius>, <-webkit-gradient-point> ] [, <-webkit-gradient-radius>]? [, <-webkit-gradient-color-stop>]* )"
    	},
    	"-webkit-gradient-color-stop": {
    		syntax: "from( <color> ) | color-stop( [ <number-zero-one> | <percentage> ] , <color> ) | to( <color> )"
    	},
    	"-webkit-gradient-point": {
    		syntax: "[ left | center | right | <length-percentage> ] [ top | center | bottom | <length-percentage> ]"
    	},
    	"-webkit-gradient-radius": {
    		syntax: "<length> | <percentage>"
    	},
    	"-webkit-gradient-type": {
    		syntax: "linear | radial"
    	},
    	"-webkit-mask-box-repeat": {
    		syntax: "repeat | stretch | round"
    	},
    	"-ms-filter-function-list": {
    		syntax: "<-ms-filter-function>+"
    	},
    	"-ms-filter-function": {
    		syntax: "<-ms-filter-function-progid> | <-ms-filter-function-legacy>"
    	},
    	"-ms-filter-function-progid": {
    		syntax: "'progid:' [ <ident-token> '.' ]* [ <ident-token> | <function-token> <any-value>? ) ]"
    	},
    	"-ms-filter-function-legacy": {
    		syntax: "<ident-token> | <function-token> <any-value>? )"
    	},
    	age: {
    		syntax: "child | young | old"
    	},
    	"attr-name": {
    		syntax: "<wq-name>"
    	},
    	"attr-fallback": {
    		syntax: "<any-value>"
    	},
    	bottom: {
    		syntax: "<length> | auto"
    	},
    	"generic-voice": {
    		syntax: "[ <age>? <gender> <integer>? ]"
    	},
    	gender: {
    		syntax: "male | female | neutral"
    	},
    	"generic-script-specific": {
    		syntax: "generic(kai) | generic(fangsong) | generic(nastaliq)"
    	},
    	"-non-standard-generic-family": {
    		syntax: "-apple-system | BlinkMacSystemFont"
    	},
    	"intrinsic-size-keyword": {
    		syntax: "min-content | max-content | fit-content"
    	},
    	left: {
    		syntax: "<length> | auto"
    	},
    	"device-cmyk()": {
    		syntax: "<legacy-device-cmyk-syntax> | <modern-device-cmyk-syntax>"
    	},
    	"legacy-device-cmyk-syntax": {
    		syntax: "device-cmyk( <number>#{4} )"
    	},
    	"modern-device-cmyk-syntax": {
    		syntax: "device-cmyk( <cmyk-component>{4} [ / [ <alpha-value> | none ] ]? )"
    	},
    	"cmyk-component": {
    		syntax: "<number> | <percentage> | none"
    	},
    	"color-space": {
    		syntax: "<rectangular-color-space> | <polar-color-space> | <custom-color-space>"
    	},
    	right: {
    		syntax: "<length> | auto"
    	},
    	"forgiving-selector-list": {
    		syntax: "<complex-real-selector-list>"
    	},
    	"forgiving-relative-selector-list": {
    		syntax: "<relative-real-selector-list>"
    	},
    	"complex-real-selector-list": {
    		syntax: "<complex-real-selector>#"
    	},
    	"simple-selector-list": {
    		syntax: "<simple-selector>#"
    	},
    	"relative-real-selector-list": {
    		syntax: "<relative-real-selector>#"
    	},
    	"complex-selector-unit": {
    		syntax: "[ <compound-selector>? <pseudo-compound-selector>* ]!"
    	},
    	"complex-real-selector": {
    		syntax: "<compound-selector> [ <combinator>? <compound-selector> ]*"
    	},
    	"relative-real-selector": {
    		syntax: "<combinator>? <complex-real-selector>"
    	},
    	"pseudo-compound-selector": {
    		syntax: " <pseudo-element-selector> <pseudo-class-selector>*"
    	},
    	"simple-selector": {
    		syntax: "<type-selector> | <subclass-selector>"
    	},
    	"legacy-pseudo-element-selector": {
    		syntax: " ':' [before | after | first-line | first-letter]"
    	},
    	"svg-length": {
    		syntax: "<percentage> | <length> | <number>"
    	},
    	"svg-writing-mode": {
    		syntax: "lr-tb | rl-tb | tb-rl | lr | rl | tb"
    	},
    	top: {
    		syntax: "<length> | auto"
    	},
    	x: {
    		syntax: "<number>"
    	},
    	y: {
    		syntax: "<number>"
    	},
    	declaration: {
    		syntax: "<ident-token> : <declaration-value>? [ '!' important ]?"
    	},
    	"declaration-list": {
    		syntax: "[ <declaration>? ';' ]* <declaration>?"
    	},
    	url: {
    		syntax: "url( <string> <url-modifier>* ) | <url-token>"
    	},
    	"url-modifier": {
    		syntax: "<ident> | <function-token> <any-value> )"
    	},
    	"number-zero-one": {
    		syntax: "<number [0,1]>"
    	},
    	"number-one-or-greater": {
    		syntax: "<number [1,∞]>"
    	},
    	"xyz-space": {
    		syntax: "xyz | xyz-d50 | xyz-d65"
    	},
    	"style-condition": {
    		syntax: "not <style-in-parens> | <style-in-parens> [ [ and <style-in-parens> ]* | [ or <style-in-parens> ]* ]"
    	},
    	"-non-standard-display": {
    		syntax: "-ms-inline-flexbox | -ms-grid | -ms-inline-grid | -webkit-flex | -webkit-inline-flex | -webkit-box | -webkit-inline-box | -moz-inline-stack | -moz-box | -moz-inline-box | -ms-flexbox"
    	},
    	"inset-area": {
    		syntax: "[ [ left | center | right | span-left | span-right | x-start | x-end | span-x-start | span-x-end | x-self-start | x-self-end | span-x-self-start | span-x-self-end | span-all ] || [ top | center | bottom | span-top | span-bottom | y-start | y-end | span-y-start | span-y-end | y-self-start | y-self-end | span-y-self-start | span-y-self-end | span-all ] | [ block-start | center | block-end | span-block-start | span-block-end | span-all ] || [ inline-start | center | inline-end | span-inline-start | span-inline-end | span-all ] | [ self-block-start | self-block-end | span-self-block-start | span-self-block-end | span-all ] || [ self-inline-start | self-inline-end | span-self-inline-start | span-self-inline-end | span-all ] | [ start | center | end | span-start | span-end | span-all ]{1,2} | [ self-start | center | self-end | span-self-start | span-self-end | span-all ]{1,2} ]"
    	},
    	"-non-standard-text-align": {
    		syntax: "| -moz-center | -webkit-center | -webkit-match-parent"
    	}
    };
    var selectors = {
    	":active": {
    		syntax: ":active"
    	},
    	":active-view-transition": {
    		syntax: ":active-view-transition"
    	},
    	":active-view-transition-type()": {
    		syntax: ":active-view-transition-type( <custom-ident># )"
    	},
    	":any-link": {
    		syntax: ":any-link"
    	},
    	":autofill": {
    		syntax: ":autofill"
    	},
    	":blank": {
    		syntax: ":blank"
    	},
    	":buffering": {
    		syntax: ":buffering"
    	},
    	":checked": {
    		syntax: ":checked"
    	},
    	":current": {
    		syntax: ":current"
    	},
    	":default": {
    		syntax: ":default"
    	},
    	":defined": {
    		syntax: ":defined"
    	},
    	":dir()": {
    		syntax: ":dir( [ ltr | rtl ] )"
    	},
    	":disabled": {
    		syntax: ":disabled"
    	},
    	":empty": {
    		syntax: ":empty"
    	},
    	":enabled": {
    		syntax: ":enabled"
    	},
    	":first": {
    		syntax: ":first"
    	},
    	":first-child": {
    		syntax: ":first-child"
    	},
    	":first-of-type": {
    		syntax: ":first-of-type"
    	},
    	":focus": {
    		syntax: ":focus"
    	},
    	":focus-visible": {
    		syntax: ":focus-visible"
    	},
    	":focus-within": {
    		syntax: ":focus-within"
    	},
    	":fullscreen": {
    		syntax: ":fullscreen"
    	},
    	":future": {
    		syntax: ":future"
    	},
    	":has()": {
    		syntax: ":has( <forgiving-relative-selector-list> )"
    	},
    	":has-slotted": {
    		syntax: ":has-slotted"
    	},
    	":host": {
    		syntax: ":host"
    	},
    	":host()": {
    		syntax: ":host( <compound-selector> )"
    	},
    	":host-context()": {
    		syntax: ":host-context( <compound-selector> )"
    	},
    	":hover": {
    		syntax: ":hover"
    	},
    	":in-range": {
    		syntax: ":in-range"
    	},
    	":indeterminate": {
    		syntax: ":indeterminate"
    	},
    	":invalid": {
    		syntax: ":invalid"
    	},
    	":is()": {
    		syntax: ":is( <forgiving-selector-list> )"
    	},
    	":lang()": {
    		syntax: ":lang( <language-code> )"
    	},
    	":last-child": {
    		syntax: ":last-child"
    	},
    	":last-of-type": {
    		syntax: ":last-of-type"
    	},
    	":left": {
    		syntax: ":left"
    	},
    	":link": {
    		syntax: ":link"
    	},
    	":local-link": {
    		syntax: ":local-link"
    	},
    	":modal": {
    		syntax: ":modal"
    	},
    	":muted": {
    		syntax: ":muted"
    	},
    	":not()": {
    		syntax: ":not( <complex-selector-list> )"
    	},
    	":nth-child()": {
    		syntax: ":nth-child( <an+b> [ of <complex-selector-list> ]? )"
    	},
    	":nth-last-child()": {
    		syntax: ":nth-last-child( <an+b> [ of <complex-selector-list> ]? )"
    	},
    	":nth-last-of-type()": {
    		syntax: ":nth-last-of-type( <an+b> )"
    	},
    	":nth-of-type()": {
    		syntax: ":nth-of-type( <an+b> )"
    	},
    	":only-child": {
    		syntax: ":only-child"
    	},
    	":only-of-type": {
    		syntax: ":only-of-type"
    	},
    	":open": {
    		syntax: ":open"
    	},
    	":optional": {
    		syntax: ":optional"
    	},
    	":out-of-range": {
    		syntax: ":out-of-range"
    	},
    	":past": {
    		syntax: ":past"
    	},
    	":paused": {
    		syntax: ":paused"
    	},
    	":picture-in-picture": {
    		syntax: ":picture-in-picture"
    	},
    	":placeholder-shown": {
    		syntax: ":placeholder-shown"
    	},
    	":playing": {
    		syntax: ":playing"
    	},
    	":popover-open": {
    		syntax: ":popover-open"
    	},
    	":read-only": {
    		syntax: ":read-only"
    	},
    	":read-write": {
    		syntax: ":read-write"
    	},
    	":required": {
    		syntax: ":required"
    	},
    	":right": {
    		syntax: ":right"
    	},
    	":root": {
    		syntax: ":root"
    	},
    	":scope": {
    		syntax: ":scope"
    	},
    	":seeking": {
    		syntax: ":seeking"
    	},
    	":stalled": {
    		syntax: ":stalled"
    	},
    	":state()": {
    		syntax: ":state( <custom-ident> )"
    	},
    	":target": {
    		syntax: ":target"
    	},
    	":target-current": {
    		syntax: ":target-current"
    	},
    	":target-within": {
    		syntax: ":target-within"
    	},
    	":user-invalid": {
    		syntax: ":user-invalid"
    	},
    	":user-valid": {
    		syntax: ":user-valid"
    	},
    	":valid": {
    		syntax: ":valid"
    	},
    	":visited": {
    		syntax: ":visited"
    	},
    	":volume-locked": {
    		syntax: ":volume-locked"
    	},
    	":where()": {
    		syntax: ":where( <complex-selector-list> )"
    	},
    	":xr-overlay": {
    		syntax: ":xr-overlay"
    	},
    	"::-ms-browse": {
    		syntax: "::-ms-browse"
    	},
    	"::-ms-check": {
    		syntax: "::-ms-check"
    	},
    	"::-ms-clear": {
    		syntax: "::-ms-clear"
    	},
    	"::-ms-expand": {
    		syntax: "::-ms-expand"
    	},
    	"::-ms-fill": {
    		syntax: "::-ms-fill"
    	},
    	"::-ms-fill-lower": {
    		syntax: "::-ms-fill-lower"
    	},
    	"::-ms-fill-upper": {
    		syntax: "::-ms-fill-upper"
    	},
    	"::-ms-reveal": {
    		syntax: "::-ms-reveal"
    	},
    	"::-ms-thumb": {
    		syntax: "::-ms-thumb"
    	},
    	"::-ms-ticks-after": {
    		syntax: "::-ms-ticks-after"
    	},
    	"::-ms-ticks-before": {
    		syntax: "::-ms-ticks-before"
    	},
    	"::-ms-tooltip": {
    		syntax: "::-ms-tooltip"
    	},
    	"::-ms-track": {
    		syntax: "::-ms-track"
    	},
    	"::-ms-value": {
    		syntax: "::-ms-value"
    	},
    	"::-moz-progress-bar": {
    		syntax: "::-moz-progress-bar"
    	},
    	"::-moz-range-progress": {
    		syntax: "::-moz-range-progress"
    	},
    	"::-moz-range-thumb": {
    		syntax: "::-moz-range-thumb"
    	},
    	"::-moz-range-track": {
    		syntax: "::-moz-range-track"
    	},
    	"::-webkit-progress-bar": {
    		syntax: "::-webkit-progress-bar"
    	},
    	"::-webkit-progress-inner-value": {
    		syntax: "::-webkit-progress-inner-value"
    	},
    	"::-webkit-progress-value": {
    		syntax: "::-webkit-progress-value"
    	},
    	"::-webkit-slider-runnable-track": {
    		syntax: "::-webkit-slider-runnable-track"
    	},
    	"::-webkit-slider-thumb": {
    		syntax: "::-webkit-slider-thumb"
    	},
    	"::after": {
    		syntax: "::after"
    	},
    	"::backdrop": {
    		syntax: "::backdrop"
    	},
    	"::before": {
    		syntax: "::before"
    	},
    	"::checkmark": {
    		syntax: "::checkmark"
    	},
    	"::cue": {
    		syntax: "::cue"
    	},
    	"::cue()": {
    		syntax: "::cue( <selector> )"
    	},
    	"::cue-region": {
    		syntax: "::cue-region"
    	},
    	"::cue-region()": {
    		syntax: "::cue-region( <selector> )"
    	},
    	"::details-content": {
    		syntax: "::details-content"
    	},
    	"::file-selector-button": {
    		syntax: "::file-selector-button"
    	},
    	"::first-letter": {
    		syntax: "::first-letter"
    	},
    	"::first-line": {
    		syntax: "::first-line"
    	},
    	"::grammar-error": {
    		syntax: "::grammar-error"
    	},
    	"::highlight()": {
    		syntax: "::highlight( <custom-ident> )"
    	},
    	"::marker": {
    		syntax: "::marker"
    	},
    	"::part()": {
    		syntax: "::part( <ident>+ )"
    	},
    	"::picker-icon": {
    		syntax: "::picker-icon"
    	},
    	"::picker()": {
    		syntax: "::picker( <form-control-identifier>+ )"
    	},
    	"::placeholder": {
    		syntax: "::placeholder"
    	},
    	"::scroll-marker": {
    		syntax: "::scroll-marker"
    	},
    	"::scroll-marker-group": {
    		syntax: "::scroll-marker-group"
    	},
    	"::selection": {
    		syntax: "::selection"
    	},
    	"::slotted()": {
    		syntax: "::slotted( <compound-selector> )"
    	},
    	"::spelling-error": {
    		syntax: "::spelling-error"
    	},
    	"::target-text": {
    		syntax: "::target-text"
    	},
    	"::view-transition": {
    		syntax: "::view-transition"
    	},
    	"::view-transition-group()": {
    		syntax: "::view-transition-group([ '*' | <custom-ident> ])"
    	},
    	"::view-transition-image-pair()": {
    		syntax: "::view-transition-image-pair([ '*' | <custom-ident> ])"
    	},
    	"::view-transition-new()": {
    		syntax: "::view-transition-new([ '*' | <custom-ident> ])"
    	},
    	"::view-transition-old()": {
    		syntax: "::view-transition-old([ '*' | <custom-ident> ])"
    	},
    	":-webkit-any()": {
    		syntax: ":-webkit-any( <forgiving-selector-list> )"
    	},
    	":-webkit-any-link": {
    		syntax: ":-webkit-any-link"
    	}
    };
    var atRules = {
    	"@charset": {
    		syntax: "@charset \"<charset>\";"
    	},
    	"@counter-style": {
    		syntax: "@counter-style <counter-style-name> {\n  [ system: <counter-system>; ] ||\n  [ symbols: <counter-symbols>; ] ||\n  [ additive-symbols: <additive-symbols>; ] ||\n  [ negative: <negative-symbol>; ] ||\n  [ prefix: <prefix>; ] ||\n  [ suffix: <suffix>; ] ||\n  [ range: <range>; ] ||\n  [ pad: <padding>; ] ||\n  [ speak-as: <speak-as>; ] ||\n  [ fallback: <counter-style-name>; ]\n}",
    		descriptors: {
    			"additive-symbols": {
    				syntax: "[ <integer [0,∞]> && <symbol> ]#"
    			},
    			fallback: {
    				syntax: "<counter-style-name>"
    			},
    			negative: {
    				syntax: "<symbol> <symbol>?"
    			},
    			pad: {
    				syntax: "<integer [0,∞]> && <symbol>"
    			},
    			prefix: {
    				syntax: "<symbol>"
    			},
    			range: {
    				syntax: "[ [ <integer> | infinite ]{2} ]# | auto"
    			},
    			"speak-as": {
    				syntax: "auto | bullets | numbers | words | spell-out | <counter-style-name>"
    			},
    			suffix: {
    				syntax: "<symbol>"
    			},
    			symbols: {
    				syntax: "<symbol>+"
    			},
    			system: {
    				syntax: "cyclic | numeric | alphabetic | symbolic | additive | [ fixed <integer>? ] | [ extends <counter-style-name> ]"
    			}
    		}
    	},
    	"@container": {
    		syntax: "@container <container-condition># {\n  <block-contents>\n}"
    	},
    	"@document": {
    		syntax: "@document [ <url> | url-prefix(<string>) | domain(<string>) | media-document(<string>) | regexp(<string>) ]# {\n  <group-rule-body>\n}"
    	},
    	"@font-face": {
    		syntax: "@font-face {\n  [ font-family: <family-name>; ] ||\n  [ src: <src>; ] ||\n  [ unicode-range: <unicode-range>; ] ||\n  [ font-variant: <font-variant>; ] ||\n  [ font-feature-settings: <font-feature-settings>; ] ||\n  [ font-variation-settings: <font-variation-settings>; ] ||\n  [ font-stretch: <font-stretch>; ] ||\n  [ font-weight: <font-weight>; ] ||\n  [ font-style: <font-style>; ] ||\n  [ size-adjust: <size-adjust>; ] ||\n  [ ascent-override: <ascent-override>; ] ||\n  [ descent-override: <descent-override>; ] ||\n  [ line-gap-override: <line-gap-override>; ]\n}",
    		descriptors: {
    			"ascent-override": {
    				syntax: "normal | <percentage>"
    			},
    			"descent-override": {
    				syntax: "normal | <percentage>"
    			},
    			"font-display": {
    				syntax: "auto | block | swap | fallback | optional"
    			},
    			"font-family": {
    				syntax: "<family-name>"
    			},
    			"font-feature-settings": {
    				syntax: "normal | <feature-tag-value>#"
    			},
    			"font-stretch": {
    				syntax: "<font-stretch-absolute>{1,2}"
    			},
    			"font-style": {
    				syntax: "normal | italic | oblique <angle>{0,2}"
    			},
    			"font-variation-settings": {
    				syntax: "normal | [ <string> <number> ]#"
    			},
    			"font-weight": {
    				syntax: "<font-weight-absolute>{1,2}"
    			},
    			"line-gap-override": {
    				syntax: "normal | <percentage>"
    			},
    			"size-adjust": {
    				syntax: "<percentage>"
    			},
    			src: {
    				syntax: "[ <url> [ format( <string># ) ]? | local( <family-name> ) ]#"
    			},
    			"unicode-range": {
    				syntax: "<unicode-range-token>#"
    			}
    		}
    	},
    	"@font-feature-values": {
    		syntax: "@font-feature-values <family-name># {\n  <feature-value-block-list>\n}"
    	},
    	"@font-palette-values": {
    		syntax: "@font-palette-values <dashed-ident> {\n  <declaration-list>\n}",
    		descriptors: {
    			"base-palette": {
    				syntax: "light | dark | <integer [0,∞]>"
    			},
    			"font-family": {
    				syntax: "<family-name>#"
    			},
    			"override-colors": {
    				syntax: "[ <integer [0,∞]> <color> ]#"
    			}
    		}
    	},
    	"@import": {
    		syntax: "@import [ <string> | <url> ]\n        [ layer | layer(<layer-name>) ]?\n        [ supports( [ <supports-condition> | <declaration> ] ) ]?\n        <media-query-list>? ;"
    	},
    	"@keyframes": {
    		syntax: "@keyframes <keyframes-name> {\n  <qualified-rule-list>\n}"
    	},
    	"@layer": {
    		syntax: "@layer [ <layer-name># | <layer-name>?  {\n  <stylesheet>\n} ]"
    	},
    	"@media": {
    		syntax: "@media <media-query-list> {\n  <group-rule-body>\n}"
    	},
    	"@namespace": {
    		syntax: "@namespace <namespace-prefix>? [ <string> | <url> ];"
    	},
    	"@page": {
    		syntax: "@page <page-selector-list> {\n  <page-body>\n}",
    		descriptors: {
    			bleed: {
    				syntax: "auto | <length>"
    			},
    			marks: {
    				syntax: "none | [ crop || cross ]"
    			},
    			"page-orientation": {
    				syntax: "upright | rotate-left | rotate-right "
    			},
    			size: {
    				syntax: "<length [0,∞]>{1,2} | auto | [ <page-size> || [ portrait | landscape ] ]"
    			}
    		}
    	},
    	"@position-try": {
    		syntax: "@position-try <dashed-ident> {\n  <declaration-list>\n}"
    	},
    	"@property": {
    		syntax: "@property <custom-property-name> {\n  <declaration-list>\n}",
    		descriptors: {
    			inherits: {
    				syntax: "true | false"
    			},
    			"initial-value": {
    				syntax: "<declaration-value>?"
    			},
    			syntax: {
    				syntax: "<string>"
    			}
    		}
    	},
    	"@scope": {
    		syntax: "@scope [(<scope-start>)]? [to (<scope-end>)]? {\n  <rule-list>\n}"
    	},
    	"@starting-style": {
    		syntax: "@starting-style {\n  <declaration-list> | <group-rule-body>\n}"
    	},
    	"@supports": {
    		syntax: "@supports <supports-condition> {\n  <group-rule-body>\n}"
    	},
    	"@view-transition": {
    		syntax: "@view-transition {\n  <declaration-list>\n}",
    		descriptors: {
    			navigation: {
    				syntax: "auto | none"
    			},
    			types: {
    				syntax: "none | <custom-ident>+"
    			}
    		}
    	},
    	"@nest": {
    	},
    	"@stylistic": {
    		syntax: " @stylistic { <feature-value-declaration-list> } "
    	},
    	"@historical-forms": {
    		syntax: " @historical-forms { <feature-value-declaration-list> } "
    	},
    	"@styleset": {
    		syntax: " @styleset { <feature-value-declaration-list> } "
    	},
    	"@character-variant": {
    		syntax: " @character-variant { <feature-value-declaration-list> } "
    	},
    	"@swash": {
    		syntax: " @swash { <feature-value-declaration-list> } "
    	},
    	"@ornaments": {
    		syntax: " @ornaments { <feature-value-declaration-list> } "
    	},
    	"@annotation": {
    		syntax: " @annotation { <feature-value-declaration-list> } "
    	}
    };
    var config$3 = {
    	declarations: declarations,
    	functions: functions,
    	syntaxes: syntaxes,
    	selectors: selectors,
    	atRules: atRules
    };

    var ValidationTokenEnum;
    (function (ValidationTokenEnum) {
        ValidationTokenEnum[ValidationTokenEnum["Root"] = 0] = "Root";
        ValidationTokenEnum[ValidationTokenEnum["Keyword"] = 1] = "Keyword";
        ValidationTokenEnum[ValidationTokenEnum["PropertyType"] = 2] = "PropertyType";
        ValidationTokenEnum[ValidationTokenEnum["DeclarationType"] = 3] = "DeclarationType";
        ValidationTokenEnum[ValidationTokenEnum["AtRule"] = 4] = "AtRule";
        ValidationTokenEnum[ValidationTokenEnum["ValidationFunctionDefinition"] = 5] = "ValidationFunctionDefinition";
        ValidationTokenEnum[ValidationTokenEnum["OpenBracket"] = 6] = "OpenBracket";
        ValidationTokenEnum[ValidationTokenEnum["CloseBracket"] = 7] = "CloseBracket";
        ValidationTokenEnum[ValidationTokenEnum["OpenParenthesis"] = 8] = "OpenParenthesis";
        ValidationTokenEnum[ValidationTokenEnum["CloseParenthesis"] = 9] = "CloseParenthesis";
        ValidationTokenEnum[ValidationTokenEnum["Comma"] = 10] = "Comma";
        ValidationTokenEnum[ValidationTokenEnum["Pipe"] = 11] = "Pipe";
        ValidationTokenEnum[ValidationTokenEnum["Column"] = 12] = "Column";
        ValidationTokenEnum[ValidationTokenEnum["Star"] = 13] = "Star";
        ValidationTokenEnum[ValidationTokenEnum["OpenCurlyBrace"] = 14] = "OpenCurlyBrace";
        ValidationTokenEnum[ValidationTokenEnum["CloseCurlyBrace"] = 15] = "CloseCurlyBrace";
        ValidationTokenEnum[ValidationTokenEnum["HashMark"] = 16] = "HashMark";
        ValidationTokenEnum[ValidationTokenEnum["QuestionMark"] = 17] = "QuestionMark";
        ValidationTokenEnum[ValidationTokenEnum["Function"] = 18] = "Function";
        ValidationTokenEnum[ValidationTokenEnum["Number"] = 19] = "Number";
        ValidationTokenEnum[ValidationTokenEnum["Whitespace"] = 20] = "Whitespace";
        ValidationTokenEnum[ValidationTokenEnum["Parenthesis"] = 21] = "Parenthesis";
        ValidationTokenEnum[ValidationTokenEnum["Bracket"] = 22] = "Bracket";
        ValidationTokenEnum[ValidationTokenEnum["Block"] = 23] = "Block";
        ValidationTokenEnum[ValidationTokenEnum["AtLeastOnce"] = 24] = "AtLeastOnce";
        ValidationTokenEnum[ValidationTokenEnum["Separator"] = 25] = "Separator";
        ValidationTokenEnum[ValidationTokenEnum["Exclamation"] = 26] = "Exclamation";
        ValidationTokenEnum[ValidationTokenEnum["Ampersand"] = 27] = "Ampersand";
        ValidationTokenEnum[ValidationTokenEnum["PipeToken"] = 28] = "PipeToken";
        ValidationTokenEnum[ValidationTokenEnum["ColumnToken"] = 29] = "ColumnToken";
        ValidationTokenEnum[ValidationTokenEnum["AmpersandToken"] = 30] = "AmpersandToken";
        ValidationTokenEnum[ValidationTokenEnum["Parens"] = 31] = "Parens";
        ValidationTokenEnum[ValidationTokenEnum["PseudoClassToken"] = 32] = "PseudoClassToken";
        ValidationTokenEnum[ValidationTokenEnum["PseudoClassFunctionToken"] = 33] = "PseudoClassFunctionToken";
        ValidationTokenEnum[ValidationTokenEnum["StringToken"] = 34] = "StringToken";
        ValidationTokenEnum[ValidationTokenEnum["AtRuleDefinition"] = 35] = "AtRuleDefinition";
        ValidationTokenEnum[ValidationTokenEnum["DeclarationNameToken"] = 36] = "DeclarationNameToken";
        ValidationTokenEnum[ValidationTokenEnum["DeclarationDefinitionToken"] = 37] = "DeclarationDefinitionToken";
        ValidationTokenEnum[ValidationTokenEnum["SemiColon"] = 38] = "SemiColon";
        ValidationTokenEnum[ValidationTokenEnum["Character"] = 39] = "Character";
        ValidationTokenEnum[ValidationTokenEnum["InfinityToken"] = 40] = "InfinityToken";
    })(ValidationTokenEnum || (ValidationTokenEnum = {}));
    var ValidationSyntaxGroupEnum;
    (function (ValidationSyntaxGroupEnum) {
        ValidationSyntaxGroupEnum["Declarations"] = "declarations";
        ValidationSyntaxGroupEnum["Functions"] = "functions";
        ValidationSyntaxGroupEnum["Syntaxes"] = "syntaxes";
        ValidationSyntaxGroupEnum["Selectors"] = "selectors";
        ValidationSyntaxGroupEnum["AtRules"] = "atRules";
    })(ValidationSyntaxGroupEnum || (ValidationSyntaxGroupEnum = {}));
    const skipped = [
        ValidationTokenEnum.Star,
        ValidationTokenEnum.HashMark,
        ValidationTokenEnum.AtLeastOnce,
        ValidationTokenEnum.Exclamation,
        ValidationTokenEnum.QuestionMark,
        ValidationTokenEnum.OpenCurlyBrace
    ];
    const objectProperties = {
        enumerable: false,
        writable: true,
        configurable: true
    };
    function* tokenize(syntax, position = { ind: 0, lin: 1, col: 0 }, currentPosition = {
        ind: -1,
        lin: 1,
        col: 0
    }) {
        let i = -1;
        let buffer = '';
        while (++i < syntax.length) {
            let chr = syntax.charAt(i);
            move(currentPosition, chr);
            switch (chr) {
                case '∞':
                    if (buffer.length > 0) {
                        yield getTokenType$1(buffer, position, currentPosition);
                    }
                    yield getTokenType$1(chr, position, currentPosition);
                    buffer = '';
                    break;
                case '\\':
                    if (buffer.length > 0) {
                        yield getTokenType$1(buffer, position, currentPosition);
                        buffer = '';
                    }
                    buffer += chr;
                    chr = syntax.charAt(++i);
                    buffer += chr;
                    move(currentPosition, chr);
                    break;
                case ';':
                    if (buffer.length > 0) {
                        yield getTokenType$1(buffer, position, currentPosition);
                        buffer = '';
                    }
                    yield getTokenType$1(chr, position, currentPosition);
                    buffer = '';
                    break;
                case ':':
                    if (isIdent(buffer)) {
                        yield Object.defineProperty({
                            typ: ValidationTokenEnum.DeclarationNameToken,
                            val: buffer
                        }, 'pos', { ...objectProperties, value: { ...position } });
                        buffer = '';
                        move(currentPosition, chr);
                        break;
                    }
                    buffer += chr;
                    break;
                case '"':
                case "'":
                    if (buffer.length > 0) {
                        yield getTokenType$1(buffer, position, currentPosition);
                        buffer = '';
                    }
                    buffer += chr;
                    while (i + 1 < syntax.length) {
                        chr = syntax.charAt(++i);
                        buffer += chr;
                        move(currentPosition, chr);
                        if (chr == '\\') {
                            chr = syntax.charAt(++i);
                            buffer += chr;
                            move(currentPosition, chr);
                            continue;
                        }
                        if (chr == buffer.charAt(0)) {
                            break;
                        }
                    }
                    // check for type "<property>" or "<'property'>"
                    if (buffer.at(1) == '<' && buffer.at(-2) == '>') {
                        yield Object.defineProperty({
                            typ: ValidationTokenEnum.Character,
                            val: chr
                        }, 'pos', { ...objectProperties, value: { ...position } });
                        position = { ...currentPosition };
                        move(currentPosition, chr);
                        buffer = buffer.slice(1, -1);
                        yield* tokenize(buffer, position, currentPosition);
                        yield Object.defineProperty({
                            typ: ValidationTokenEnum.Character,
                            val: chr
                        }, 'pos', { ...objectProperties, value: { ...position } });
                        position = { ...currentPosition };
                        move(currentPosition, chr);
                        buffer = '';
                        break;
                    }
                    yield getTokenType$1(buffer, position, currentPosition);
                    buffer = '';
                    break;
                case '<':
                    buffer += chr;
                    while (i + 1 < syntax.length) {
                        chr = syntax.charAt(++i);
                        buffer += chr;
                        move(currentPosition, chr);
                        if (chr == '>') {
                            break;
                        }
                    }
                    yield getTokenType$1(buffer, position, currentPosition);
                    buffer = '';
                    break;
                case ' ':
                case '\t':
                case '\n':
                case '\r':
                case '\f':
                case '|':
                case '#':
                case '+':
                case ',':
                case '[':
                case ']':
                case '(':
                case ')':
                case '*':
                case '{':
                case '}':
                case '?':
                case '!':
                case '&':
                    if (buffer.length > 0) {
                        yield getTokenType$1(buffer, position, currentPosition);
                    }
                    if (chr == '|' || chr == '&') {
                        if (syntax.charAt(i + 1) == chr) {
                            move(currentPosition, chr);
                            yield getTokenType$1(chr + chr, position, currentPosition);
                            i++;
                            buffer = '';
                            continue;
                        }
                    }
                    Object.assign(position, currentPosition);
                    yield getTokenType$1(chr, position, currentPosition);
                    buffer = '';
                    break;
                default:
                    buffer += chr;
                    break;
            }
        }
        if (buffer.length > 0) {
            yield getTokenType$1(buffer, position, currentPosition);
        }
    }
    function parseSyntax(syntax) {
        const root = Object.defineProperty({
            typ: ValidationTokenEnum.Root,
            chi: []
        }, 'pos', { ...objectProperties, value: { ind: 0, lin: 1, col: 0 } });
        return minify$2(doParseSyntax(syntax, tokenize(syntax), root));
    }
    function matchParens(syntax, iterator) {
        let item;
        let func = null;
        let items = [];
        let match = 0;
        while ((item = iterator.next()) && !item.done) {
            switch (item.value.typ) {
                case ValidationTokenEnum.OpenParenthesis:
                    if (match > 0) {
                        func.chi.push(item.value);
                    }
                    else if (match == 0) {
                        func = items.at(-1);
                        if (func == null || func.val == null || func.val === '') {
                            func = Object.defineProperty({
                                typ: ValidationTokenEnum.Parens,
                                val: '',
                                chi: []
                            }, 'pos', { ...objectProperties, value: item.value.pos });
                            items.push(func);
                        }
                        else {
                            // @ts-ignore
                            func.typ = func.typ == ValidationTokenEnum.PseudoClassToken ? ValidationTokenEnum.PseudoClassFunctionToken : ValidationTokenEnum.Function;
                            func.chi = [];
                        }
                    }
                    match++;
                    break;
                case ValidationTokenEnum.CloseParenthesis:
                    match--;
                    if (match > 0) {
                        func.chi.push(item.value);
                    }
                    break;
                default:
                    if (match > 0) {
                        func.chi.push(item.value);
                    }
                    else {
                        items.push(item.value);
                    }
                    break;
            }
        }
        for (const item of items) {
            if ('chi' in item) {
                // @ts-ignore
                item.chi = matchParens(syntax, item.chi[Symbol.iterator]());
            }
        }
        return items;
    }
    function matchBrackets(syntax, iterator) {
        let item;
        let bracket = null;
        let items = [];
        let match = 0;
        while ((item = iterator.next()) && !item.done) {
            switch (item.value.typ) {
                case ValidationTokenEnum.OpenBracket:
                    if (match > 0) {
                        bracket.chi.push(item.value);
                    }
                    else if (match == 0) {
                        bracket = Object.defineProperty({
                            typ: ValidationTokenEnum.Bracket,
                            chi: []
                        }, 'pos', { ...objectProperties, value: item.value.pos });
                        items.push(bracket);
                    }
                    match++;
                    break;
                case ValidationTokenEnum.CloseBracket:
                    match--;
                    if (match > 0) {
                        bracket.chi.push(item.value);
                    }
                    break;
                default:
                    if (match > 0) {
                        bracket.chi.push(item.value);
                    }
                    else {
                        items.push(item.value);
                    }
                    break;
            }
        }
        for (const item of items) {
            if ('chi' in item) {
                // @ts-ignore
                item.chi = matchBrackets(syntax, item.chi[Symbol.iterator]());
            }
        }
        return items;
    }
    function matchCurlBraces(syntax, iterator) {
        let item;
        let block = null;
        let items = [];
        let match = 0;
        while ((item = iterator.next()) && !item.done) {
            switch (item.value.typ) {
                case ValidationTokenEnum.OpenCurlyBrace:
                    if (match > 0) {
                        block.chi.push(item.value);
                    }
                    else if (match == 0) {
                        block = Object.defineProperty({
                            typ: ValidationTokenEnum.Block,
                            chi: []
                        }, 'pos', { ...objectProperties, value: item.value.pos });
                        items.push(block);
                    }
                    match++;
                    break;
                case ValidationTokenEnum.CloseCurlyBrace:
                    match--;
                    if (match > 0) {
                        block.chi.push(item.value);
                    }
                    break;
                default:
                    if (match > 0) {
                        block.chi.push(item.value);
                    }
                    else {
                        items.push(item.value);
                    }
                    if ('chi' in item.value) {
                        // @ts-ignore
                        item.value.chi = matchCurlBraces(syntax, item.value.chi[Symbol.iterator]());
                    }
                    break;
            }
        }
        let it;
        let i = 0;
        for (; i < items.length; i++) {
            it = items[i];
            if (i > 0 && it.typ == ValidationTokenEnum.Block && it.chi[0]?.typ == ValidationTokenEnum.Number) {
                items[i - 1].occurence = {
                    min: +it.chi[0].val,
                    max: it.chi[2]?.typ == ValidationTokenEnum.InfinityToken ? Number.POSITIVE_INFINITY : +(it.chi[2] ?? it.chi[0]).val
                };
                items.splice(i--, 1);
                continue;
            }
            if ('chi' in it) {
                // @ts-ignore
                it.chi = matchBrackets(syntax, it.chi[Symbol.iterator]());
            }
        }
        return items;
    }
    function matchAtRule(syntax, iterator) {
        const children = [];
        let item;
        let token = null;
        while ((item = iterator.next()) && !item.done) {
            if (item.value.typ == ValidationTokenEnum.AtRule || item.value.typ == ValidationTokenEnum.AtRuleDefinition) {
                token = Object.defineProperty({
                    ...item.value,
                    typ: ValidationTokenEnum.AtRuleDefinition
                }, 'pos', { ...objectProperties, value: item.value.pos });
                children.push(token);
                item = iterator.next();
                if (item.done) {
                    // @ts-ignore
                    token.typ = ValidationTokenEnum.AtRule;
                    break;
                }
                item = iterator.next();
                if (item.done) {
                    break;
                }
                if (item.value.typ == ValidationTokenEnum.Pipe) {
                    // @ts-ignore
                    token.typ = ValidationTokenEnum.AtRule;
                    children.push(item.value);
                    continue;
                }
                if (item.value.typ != ValidationTokenEnum.OpenCurlyBrace) {
                    if (!('prelude' in token)) {
                        token.prelude = [];
                    }
                    token.prelude.push(item.value);
                }
                let braces = 0;
                let previousItem = item.value;
                while ((item = iterator.next()) && !item.done) {
                    if (item.value.typ == ValidationTokenEnum.DeclarationNameToken) {
                        iterator.next();
                        const t = Object.defineProperty({
                            typ: ValidationTokenEnum.DeclarationDefinitionToken,
                            nam: item.value.val,
                            val: iterator.next().value
                        }, 'pos', {
                            ...objectProperties,
                            value: item.value.pos
                        });
                        if (braces > 0) {
                            token.chi.push(t);
                        }
                        else {
                            token.prelude.push(t);
                        }
                        previousItem = t;
                        continue;
                    }
                    if (item.value.typ == ValidationTokenEnum.OpenCurlyBrace) {
                        previousItem = item.value;
                        continue;
                    }
                    if (item.value.typ == ValidationTokenEnum.Whitespace && previousItem?.typ == ValidationTokenEnum.OpenCurlyBrace) {
                        braces++;
                        if (braces == 1) {
                            previousItem = item.value;
                            continue;
                        }
                    }
                    if (previousItem?.typ == ValidationTokenEnum.Whitespace && item.value.typ == ValidationTokenEnum.CloseCurlyBrace) {
                        braces--;
                        if (braces == 0) {
                            break;
                        }
                    }
                    if (braces == 0) {
                        if (!('prelude' in token)) {
                            token.prelude = [];
                        }
                        token.prelude.push(item.value);
                    }
                    else {
                        if (!('chi' in token)) {
                            token.chi = [];
                        }
                        token.chi.push(item.value);
                    }
                    previousItem = item.value;
                }
                if ('prelude' in token) {
                    if (token?.prelude?.length == 1 && token.prelude[0].typ == ValidationTokenEnum.Whitespace) {
                        delete token.prelude;
                    }
                    else {
                        const t = { typ: ValidationTokenEnum.Root, chi: token.prelude };
                        doParseSyntax(syntax, t.chi[Symbol.iterator](), t);
                        token.prelude = t.chi;
                        minify$2(token.prelude);
                    }
                }
                // @ts-ignore
                if (token?.chi?.length > 0) {
                    minify$2(doParseSyntax(syntax, token.chi[Symbol.iterator](), token));
                }
            }
            else {
                children.push(item.value);
            }
        }
        return children;
    }
    function matchToken(syntax, iterator, validationToken) {
        if (iterator.length == 0) {
            return [];
        }
        if (Array.isArray(iterator[0])) {
            const result = [];
            for (let i = 0; i < iterator.length; i++) {
                result.push(matchToken(syntax, iterator[i], validationToken));
            }
            return result;
        }
        let children = [];
        let token = null;
        let i;
        if (validationToken == ValidationTokenEnum.Ampersand) {
            // @ts-ignore
            children = [...iterator];
            let offsetL;
            let offsetR;
            for (i = 0; i < children.length; i++) {
                if (children[i].typ == ValidationTokenEnum.Ampersand) {
                    offsetR = i + 1;
                    offsetL = i - 1;
                    while (offsetR < children.length - 1 && children[offsetR].typ == ValidationTokenEnum.Whitespace) {
                        offsetR++;
                    }
                    while (offsetR + 1 < children.length && skipped.includes(children[offsetR + 1].typ)) {
                        offsetR++;
                    }
                    while (offsetL > 0 && (children[offsetL].typ == ValidationTokenEnum.Whitespace || skipped.includes(children[offsetL].typ))) {
                        offsetL--;
                    }
                    token = Object.defineProperty({
                        typ: ValidationTokenEnum.AmpersandToken,
                        l: children.slice(offsetL, i),
                        r: children.slice(i + 1, offsetR + 1)
                    }, 'pos', { ...objectProperties, value: children[i].pos });
                    i = offsetL;
                    children.splice(offsetL, offsetR - offsetL + 1, token);
                }
                else if ('chi' in children[i]) {
                    // @ts-ignore
                    children[i].chi = matchToken(syntax, children[i].chi, validationToken);
                }
                else if ('l' in children[i]) {
                    // @ts-ignore
                    children[i].l = matchToken(syntax, children[i].l, validationToken);
                    // @ts-ignore
                    children[i].r = matchToken(syntax, children[i].r, validationToken);
                }
            }
            return children;
        }
        let item;
        for (i = 0; i < iterator.length; i++) {
            item = iterator[i];
            if (item.typ == validationToken) {
                if (item.typ == ValidationTokenEnum.Pipe) {
                    token = Object.defineProperty({
                        typ: ValidationTokenEnum.PipeToken,
                        chi: [matchToken(syntax, children.slice(), validationToken)], //.concat(matchToken(syntaxes, children.slice()[Symbol.iterator]() as Iterator<ValidationTokenIteratorValue>, validationToken), matchToken(syntaxes, iterator, validationToken)),
                        // @ts-ignore
                        // l: matchToken(syntaxes, children.slice()[Symbol.iterator](), validationToken),
                        // r: matchToken(syntaxes, iterator, validationToken)
                    }, 'pos', {
                        ...objectProperties,
                        value: item.pos
                    });
                    children.length = 0;
                    while ((item = iterator[++i]) != null) {
                        if (item.typ == ValidationTokenEnum.Pipe) {
                            token.chi.push(matchToken(syntax, children.slice(), validationToken));
                            children.length = 0;
                        }
                        else {
                            children.push(item);
                        }
                    }
                    if (children.length > 0) {
                        token.chi.push(matchToken(syntax, children.slice(), validationToken));
                    }
                    token.chi.sort((a, b) => {
                        if (a.some((t) => t.isList)) {
                            return -1;
                        }
                        if (b.some((t) => t.isList)) {
                            return 1;
                        }
                        if (a.some((t) => t.occurence != null)) {
                            return -1;
                        }
                        if (b.some((t) => t.occurence != null)) {
                            return -1;
                        }
                        if (a.some((t) => t.isRepeatableGroup)) {
                            return -1;
                        }
                        if (b.some((t) => t.isRepeatableGroup)) {
                            return 1;
                        }
                        if (a.some((t) => t.isRepeatable)) {
                            return -1;
                        }
                        if (b.some((t) => t.isRepeatable)) {
                            return 1;
                        }
                        if (a.some((t) => t.isOptional)) {
                            return 1;
                        }
                        if (b.some((t) => t.isOptional)) {
                            return -1;
                        }
                        return 0;
                    });
                    children = [token];
                }
                else {
                    token = Object.defineProperty({
                        typ: ValidationTokenEnum.ColumnToken,
                        l: matchToken(syntax, children.slice(), validationToken),
                        r: matchToken(syntax, iterator.slice(i + 1), validationToken)
                    }, 'pos', {
                        ...objectProperties,
                        value: item.pos
                    });
                    i = iterator.length;
                }
                children.length = 0;
                children.push(token);
                while ((item = iterator[++i]) != null) {
                    children.push(item);
                    if ('chi' in item) {
                        // @ts-ignore
                        item.chi = matchToken(syntax, item.chi, validationToken);
                    }
                    else if ('l' in item) {
                        // @ts-ignore
                        item.l = matchToken(syntax, item.l, validationToken);
                        // @ts-ignore
                        item.r = matchToken(syntax, item.r, validationToken);
                    }
                }
                // @ts-ignore
                return children;
            }
            else {
                // @ts-ignore
                children.push(item);
                if ('chi' in item) {
                    // @ts-ignore
                    item.chi = matchToken(syntax, item.chi, validationToken);
                }
                else if ('l' in item) {
                    item.l = matchToken(syntax, item.l, validationToken);
                    // @ts-ignore
                    item.r = matchToken(syntax, item.r, validationToken);
                }
            }
        }
        return children;
    }
    function parseSyntaxTokens(syntax, iterator) {
        const items = [];
        let item;
        let i;
        while ((item = iterator.next()) && !item.done) {
            if (Array.isArray(item.value)) {
                // @ts-ignore
                item.value = parseSyntaxTokens(syntax, item.value[Symbol.iterator]());
            }
            switch (item.value.typ) {
                case ValidationTokenEnum.Star:
                case ValidationTokenEnum.HashMark:
                case ValidationTokenEnum.AtLeastOnce:
                case ValidationTokenEnum.Exclamation:
                case ValidationTokenEnum.QuestionMark:
                case ValidationTokenEnum.OpenCurlyBrace:
                    i = items.length;
                    while (i--) {
                        if (items[i].typ != ValidationTokenEnum.Whitespace) {
                            break;
                        }
                    }
                    if (item.value.typ == ValidationTokenEnum.Exclamation) {
                        items[i].isRepeatableGroup = true;
                    }
                    else if (item.value.typ == ValidationTokenEnum.QuestionMark) {
                        items[i].isOptional = true;
                    }
                    else if (item.value.typ == ValidationTokenEnum.Star) {
                        items[i].isRepeatable = true;
                    }
                    else if (item.value.typ == ValidationTokenEnum.AtLeastOnce) {
                        items[i].atLeastOnce = true;
                    }
                    else if (item.value.typ == ValidationTokenEnum.HashMark) {
                        items[i].isList = true;
                    }
                    else if (item.value.typ == ValidationTokenEnum.OpenCurlyBrace) {
                        items[i].occurence = {
                            min: 0,
                            max: null
                        };
                        while ((item = iterator.next()) && !item.done) {
                            if (item.value.typ == ValidationTokenEnum.Number) {
                                // @ts-ignore
                                if (items[i].occurence.min == 0) {
                                    // @ts-ignore
                                    items[i].occurence.min = items[i].occurence.max = +item.value.val;
                                }
                                else {
                                    // @ts-ignore
                                    items[i].occurence.max = +item.value.val;
                                }
                            }
                            if (item.value.typ == ValidationTokenEnum.CloseCurlyBrace) {
                                break;
                            }
                        }
                    }
                    if ('occurence' in item.value) {
                        // @ts-ignore
                        items[i].occurence = { ...item.value.occurence };
                    }
                    break;
                case ValidationTokenEnum.Pipe:
                    item.value.chi = item.value.chi.map((t) => parseSyntaxTokens(syntax, t[Symbol.iterator]()));
                    items.push(item.value);
                    break;
                default:
                    items.push(item.value);
                    break;
            }
        }
        for (i = 0; i < items.length; i++) {
            if ('chi' in items[i]) {
                // @ts-ignore
                items[i].chi = parseSyntaxTokens(syntax, items[i].chi[Symbol.iterator]());
            }
            else if ('l' in items[i]) {
                // @ts-ignore
                items[i].l = parseSyntaxTokens(syntax, items[i].l[Symbol.iterator]());
                // @ts-ignore
                items[i].r = parseSyntaxTokens(syntax, items[i].r[Symbol.iterator]());
            }
            if (items[i].typ != ValidationTokenEnum.Bracket && (items[i].isOptional || items[i].isRepeatable)) {
                let k = i;
                while (--k > 0) {
                    if (items[k].typ == ValidationTokenEnum.Whitespace) {
                        continue;
                    }
                    if (items[k].typ == ValidationTokenEnum.Comma) {
                        const wrapper = Object.defineProperty({
                            typ: ValidationTokenEnum.Bracket,
                            chi: items.slice(k, i + 1)
                        }, 'pos', { ...objectProperties, value: items[k].pos });
                        if (items[i].isOptional) {
                            wrapper.isOptional = true;
                            delete items[i].isOptional;
                        }
                        if (items[i].isRepeatable) {
                            wrapper.isRepeatable = true;
                            delete items[i].isRepeatable;
                        }
                        items.splice(k, i - k + 1, wrapper);
                        i = k - 1;
                    }
                    break;
                }
                // }
            }
        }
        return items;
    }
    function doParseSyntax(syntax, iterator, context) {
        context.chi = matchParens(syntax, iterator);
        // @ts-ignore
        context.chi = matchAtRule(syntax, context.chi[Symbol.iterator]());
        // @ts-ignore
        context.chi = matchBrackets(syntax, context.chi[Symbol.iterator]());
        // @ts-ignore
        context.chi = matchCurlBraces(syntax, context.chi[Symbol.iterator]());
        // @ts-ignore
        context.chi = matchToken(syntax, context.chi, ValidationTokenEnum.Pipe);
        // @ts-ignore
        context.chi = matchToken(syntax, context.chi, ValidationTokenEnum.Column);
        // @ts-ignore
        context.chi = matchToken(syntax, context.chi, ValidationTokenEnum.Ampersand);
        // @ts-ignore
        context.chi = parseSyntaxTokens(syntax, context.chi[Symbol.iterator]());
        return context;
    }
    function getTokenType$1(token, position, currentPosition) {
        const pos = { ...position };
        Object.assign(position, currentPosition);
        // '∞'
        if (token == '\u221e') {
            return Object.defineProperty({
                typ: ValidationTokenEnum.InfinityToken,
            }, 'pos', { ...objectProperties, value: pos });
        }
        if (token.charAt(0) == '"' || token.charAt(0) == "'") {
            return Object.defineProperty({
                typ: ValidationTokenEnum.StringToken,
                val: token
            }, 'pos', { ...objectProperties, value: pos });
        }
        if (token == ';') {
            return Object.defineProperty({
                typ: ValidationTokenEnum.SemiColon
            }, 'pos', { ...objectProperties, value: pos });
        }
        if (token.match(/^\s+$/)) {
            return Object.defineProperty({
                typ: ValidationTokenEnum.Whitespace,
            }, 'pos', { ...objectProperties, value: pos });
        }
        if (token.match(/^\d+$/)) {
            return Object.defineProperty({
                typ: ValidationTokenEnum.Number,
                val: Number(token)
            }, 'pos', { ...objectProperties, value: pos });
        }
        if (isPseudo(token)) {
            return Object.defineProperty({
                typ: ValidationTokenEnum.PseudoClassToken,
                val: token
            }, 'pos', { ...objectProperties, value: pos });
        }
        if (token == '!') {
            return Object.defineProperty({
                typ: ValidationTokenEnum.Exclamation
            }, 'pos', { ...objectProperties, value: pos });
        }
        if (token == '#') {
            return Object.defineProperty({
                typ: ValidationTokenEnum.HashMark
            }, 'pos', { ...objectProperties, value: pos });
        }
        if (token == '/') {
            return Object.defineProperty({
                typ: ValidationTokenEnum.Separator
            }, 'pos', { ...objectProperties, value: pos });
        }
        if (token == '+') {
            return Object.defineProperty({
                typ: ValidationTokenEnum.AtLeastOnce
            }, 'pos', { ...objectProperties, value: pos });
        }
        if (token == '|') {
            return Object.defineProperty({
                typ: ValidationTokenEnum.Pipe
            }, 'pos', { ...objectProperties, value: pos });
        }
        if (token == '&&') {
            return Object.defineProperty({
                typ: ValidationTokenEnum.Ampersand
            }, 'pos', { ...objectProperties, value: pos });
        }
        if (token == '||') {
            return Object.defineProperty({
                typ: ValidationTokenEnum.Column
            }, 'pos', { ...objectProperties, value: pos });
        }
        if (token == ',') {
            return Object.defineProperty({
                typ: ValidationTokenEnum.Comma
            }, 'pos', { ...objectProperties, value: pos });
        }
        if (token == '[') {
            return Object.defineProperty({
                typ: ValidationTokenEnum.OpenBracket
            }, 'pos', { ...objectProperties, value: pos });
        }
        if (token == ']') {
            return Object.defineProperty({
                typ: ValidationTokenEnum.CloseBracket
            }, 'pos', { ...objectProperties, value: pos });
        }
        if (token == '(') {
            return Object.defineProperty({
                typ: ValidationTokenEnum.OpenParenthesis
            }, 'pos', { ...objectProperties, value: pos });
        }
        if (token == ')') {
            return Object.defineProperty({
                typ: ValidationTokenEnum.CloseParenthesis
            }, 'pos', { ...objectProperties, value: pos });
        }
        if (token == '{') {
            return Object.defineProperty({
                typ: ValidationTokenEnum.OpenCurlyBrace
            }, 'pos', { ...objectProperties, value: pos });
        }
        if (token == '}') {
            return Object.defineProperty({
                typ: ValidationTokenEnum.CloseCurlyBrace
            }, 'pos', { ...objectProperties, value: pos });
        }
        if (token == '*') {
            return Object.defineProperty({
                typ: ValidationTokenEnum.Star
            }, 'pos', { ...objectProperties, value: pos });
        }
        if (token == '?') {
            return Object.defineProperty({
                typ: ValidationTokenEnum.QuestionMark
            }, 'pos', { ...objectProperties, value: pos });
        }
        if (token.startsWith("<'")) {
            return Object.defineProperty({
                typ: ValidationTokenEnum.DeclarationType,
                val: token.slice(2, -2)
            }, 'pos', { ...objectProperties, value: pos });
        }
        if (token.startsWith('<')) {
            // <number [1,1000]>
            // <length [0,∞]>
            let match = token.match(/<([a-z0-9-]+)(\s+\[([0-9]+[a-zA-Z]*),(([0-9]+[a-zA-Z]*)|∞)\])?>/);
            if (match == null) {
                let match = token.match(/<([a-zA-Z0-9-]+)\(\)>/);
                if (match != null) {
                    return Object.defineProperty({
                        typ: ValidationTokenEnum.ValidationFunctionDefinition,
                        val: match[1]
                    }, 'pos', { ...objectProperties, value: pos });
                }
                throw new Error('invalid token at position: ' + position.lin + ':' + position.col + ' ' + token);
            }
            if (match[2] != null) {
                const type = getTokenType(match[3]);
                return Object.defineProperty({
                    typ: ValidationTokenEnum.PropertyType,
                    val: match[1],
                    unit: exports.EnumToken[type.typ],
                    range: [+type.val, match[4] == '\u221e' ? null : +match[4]]
                }, 'pos', { ...objectProperties, value: pos });
            }
            return Object.defineProperty({
                typ: ValidationTokenEnum.PropertyType,
                val: token.slice(1, -1)
            }, 'pos', { ...objectProperties, value: pos });
        }
        if (token.startsWith('@') && isIdent(token.slice(1))) {
            return Object.defineProperty({
                typ: ValidationTokenEnum.AtRule,
                val: token.slice(1)
            }, 'pos', { ...objectProperties, value: pos });
        }
        return Object.defineProperty({
            typ: ValidationTokenEnum.Keyword,
            val: token
        }, 'pos', { ...objectProperties, value: pos });
    }
    function move(position, chr) {
        for (const c of chr) {
            position.col++;
            position.ind += c.length;
        }
        return position;
    }
    function renderSyntax(token, parent) {
        let glue;
        switch (token.typ) {
            case ValidationTokenEnum.InfinityToken:
                // '∞'
                return '\u221e';
            case ValidationTokenEnum.Root:
                return token.chi.reduce((acc, curr) => acc + renderSyntax(curr), '');
            case ValidationTokenEnum.Whitespace:
                return ' ';
            case ValidationTokenEnum.ValidationFunctionDefinition:
                return '<' + token.val + '()>';
            case ValidationTokenEnum.HashMark:
                return '#';
            case ValidationTokenEnum.Pipe:
                return '|';
            case ValidationTokenEnum.Column:
                return '||';
            case ValidationTokenEnum.PipeToken:
                return token.chi.reduce((acc, curr) => acc + (acc.trim().length > 0 ? '|' : '') + curr.reduce((acc, curr) => acc + renderSyntax(curr), ''), '');
            case ValidationTokenEnum.ColumnToken:
            case ValidationTokenEnum.AmpersandToken:
                glue = token.typ == ValidationTokenEnum.ColumnToken ? '||' : '&&';
                return token.l.reduce((acc, curr) => acc + renderSyntax(curr), '') +
                    glue +
                    token.r.reduce((acc, curr) => acc + renderSyntax(curr), '');
            case ValidationTokenEnum.Function:
            case ValidationTokenEnum.PseudoClassFunctionToken:
            case ValidationTokenEnum.Parens:
                return token.val + '(' + token.chi.reduce((acc, curr) => acc + renderSyntax(curr), '') + ')' + renderAttributes(token);
            case ValidationTokenEnum.Comma:
                return ',';
            case ValidationTokenEnum.Keyword:
                return token.val + renderAttributes(token);
            case ValidationTokenEnum.OpenBracket:
                return '[';
            case ValidationTokenEnum.Ampersand:
                return '&&';
            case ValidationTokenEnum.QuestionMark:
                return '?';
            case ValidationTokenEnum.Separator:
                return '/';
            case ValidationTokenEnum.Bracket:
                return '[' + token.chi.reduce((acc, curr) => acc + renderSyntax(curr), '') + ']' + renderAttributes(token);
            case ValidationTokenEnum.PropertyType:
                return '<' + token.val + (Array.isArray(token.range) ? `[${token?.range?.[0]}, ${token?.range?.[1] ?? '\u221e'}]` : '') + '>' + renderAttributes(token);
            case ValidationTokenEnum.DeclarationType:
                return "<'" + token.val + "'>" + renderAttributes(token);
            case ValidationTokenEnum.Number:
            case ValidationTokenEnum.PseudoClassToken:
            case ValidationTokenEnum.StringToken:
                return token.val + '';
            case ValidationTokenEnum.SemiColon:
                return ';';
            case ValidationTokenEnum.AtRule:
                return '@' + token.val;
            case ValidationTokenEnum.AtRuleDefinition:
                return '@' + token.val +
                    (token.prelude == null ? '' : ' ' + token.prelude.reduce((acc, curr) => acc + renderSyntax(curr), '')) +
                    (token.chi == null ? '' : ' {\n' + token.chi.reduce((acc, curr) => acc + renderSyntax(curr), '')).slice(1, -1) + '\n}';
            case ValidationTokenEnum.Block:
                return '{' + token.chi.reduce((acc, t) => acc + renderSyntax(t), '') + '}';
            case ValidationTokenEnum.DeclarationDefinitionToken:
                return token.nam + ': ' + renderSyntax(token.val);
            default:
                throw new Error('Unhandled token: ' + JSON.stringify({ token }, null, 1));
        }
    }
    function renderAttributes(token) {
        let result = '';
        if (token.isList) {
            result += '#';
        }
        if (token.isOptional) {
            result += '?';
        }
        if (token.isRepeatableGroup) {
            result += '!';
        }
        if (token.isRepeatable) {
            result += '*';
        }
        if (token.atLeastOnce) {
            result += '+';
        }
        if (token.occurence != null) {
            if (token.occurence.max == null || token.occurence.max == token.occurence.min || Number.isNaN(token.occurence.max)) {
                result += '{' + token.occurence.min + '}';
            }
            else {
                result += '{' + token.occurence.min + ',' + (Number.isFinite(token.occurence.max) ? token.occurence.max : '\u221e') + '}';
            }
        }
        return result;
    }
    function minify$2(ast) {
        if (Array.isArray(ast)) {
            // @ts-ignore
            while (ast.length > 0 && ast[0].typ == ValidationTokenEnum.Whitespace) {
                // @ts-ignore
                ast.shift();
            }
            while (ast.length > 0 && ast.at(-1).typ == ValidationTokenEnum.Whitespace) {
                ast.pop();
            }
            for (let i = 0; i < ast.length; i++) {
                minify$2(ast[i]);
                if (ast[i].typ == ValidationTokenEnum.Whitespace && ast[i + 1]?.typ == ValidationTokenEnum.Whitespace) {
                    ast.splice(i + 1, 1);
                    i--;
                    continue;
                }
                if (ast[i].typ == ValidationTokenEnum.Separator) {
                    if (ast[i + 1]?.typ == ValidationTokenEnum.Whitespace) {
                        ast.splice(i + 1, 1);
                    }
                    if (ast[i - 1]?.typ == ValidationTokenEnum.Whitespace) {
                        ast.splice(--i, 1);
                    }
                }
            }
            return ast;
        }
        if ('l' in ast) {
            minify$2(ast.l);
        }
        if ('r' in ast) {
            minify$2(ast.r);
        }
        if ('chi' in ast) {
            minify$2(ast.chi);
        }
        if ('prelude' in ast) {
            minify$2(ast.prelude);
        }
        return ast;
    }

    const parsedSyntaxes = new Map();
    Object.freeze(config$3);
    function getSyntaxConfig() {
        // @ts-ignore
        return config$3;
    }
    function getSyntax(group, key) {
        // @ts-ignore
        let obj = config$3[group];
        const keys = Array.isArray(key) ? key : [key];
        for (let i = 0; i < keys.length; i++) {
            key = keys[i];
            if (!(key in obj)) {
                if ((i == 0 && key.charAt(0) == '@') || key.charAt(0) == '-') {
                    const matches = key.match(/^(@?)(-[a-zA-Z]+)-(.*?)$/);
                    if (matches != null) {
                        key = matches[1] + matches[3];
                    }
                }
            }
            // @ts-ignore
            obj = obj[key];
        }
        // @ts-ignore
        return obj?.syntax ?? null;
    }
    function getParsedSyntax(group, key) {
        // @ts-ignore
        let obj = config$3[group];
        const keys = Array.isArray(key) ? key : [key];
        for (let i = 0; i < keys.length; i++) {
            key = keys[i];
            if (!(key in obj)) {
                if ((i == 0 && key.charAt(0) == '@') || key.charAt(0) == '-') {
                    const matches = key.match(/^(@?)(-[a-zA-Z]+)-(.*?)$/);
                    if (matches != null) {
                        key = matches[1] + matches[3];
                    }
                }
                if (!(key in obj)) {
                    return null;
                }
            }
            // @ts-ignore
            obj = obj[key];
        }
        const index = group + '.' + keys.join('.');
        // @ts-ignore
        if (!parsedSyntaxes.has(index)) {
            const syntax = parseSyntax(obj.syntax);
            // @ts-ignore
            parsedSyntaxes.set(index, syntax.chi);
        }
        return parsedSyntaxes.get(index);
    }

    function validateLayerName(tokens) {
        const slice = tokens.reduce((acc, curr) => {
            if (curr.typ == exports.EnumToken.CommaTokenType) {
                acc.push([]);
            }
            else if (curr.typ != exports.EnumToken.CommentTokenType) {
                acc[acc.length - 1].push(curr);
            }
            return acc;
        }, [[]]);
        for (let i = 0; i < slice.length; i++) {
            if (slice[i].length == 0) {
                // @ts-ignore
                return {
                    valid: SyntaxValidationResult.Drop,
                    matches: tokens,
                    node: null,
                    syntax: null,
                    error: 'Invalid ident',
                    tokens
                };
            }
            for (let j = 0; j < slice[i].length; j++) {
                if (slice[i][j].typ != exports.EnumToken.IdenTokenType && slice[i][j].typ != exports.EnumToken.ClassSelectorTokenType) {
                    // @ts-ignore
                    return {
                        valid: SyntaxValidationResult.Drop,
                        matches: tokens,
                        node: slice[i][j],
                        syntax: '<layer-name>',
                        error: 'expecting ident or class selector',
                        tokens
                    };
                }
            }
        }
        // @ts-ignore
        return {
            valid: SyntaxValidationResult.Valid,
            matches: tokens,
            node: null,
            syntax: null,
            error: '',
            tokens
        };
    }

    function consumeWhitespace(tokens) {
        if (tokens.length == 0) {
            return true;
        }
        if (tokens[0].typ != exports.EnumToken.WhitespaceTokenType && tokens[0].typ != exports.EnumToken.DescendantCombinatorTokenType) {
            return false;
        }
        while (tokens.length > 0 && (tokens[0].typ == exports.EnumToken.WhitespaceTokenType || tokens[0].typ == exports.EnumToken.DescendantCombinatorTokenType)) {
            tokens.shift();
        }
        return true;
    }

    function stripCommaToken(tokenList) {
        let result = [];
        for (let i = 0; i < tokenList.length; i++) {
            if (tokenList[i].typ != exports.EnumToken.WhitespaceTokenType) {
                tokenList[i];
            }
            if (tokenList[i].typ == exports.EnumToken.CommentTokenType || tokenList[i].typ == exports.EnumToken.CommaTokenType) {
                continue;
            }
            result.push(tokenList[i]);
        }
        return result;
    }
    function splitTokenList(tokenList, split = [exports.EnumToken.CommaTokenType]) {
        return tokenList.reduce((acc, curr) => {
            if (split.includes(curr.typ)) {
                acc.push([]);
            }
            else {
                acc[acc.length - 1].push(curr);
            }
            return acc;
        }, [[]]);
    }

    function validateFamilyName(tokens, atRule) {
        let node;
        tokens = tokens.slice();
        consumeWhitespace(tokens);
        if (tokens.length == 0 || tokens[0].typ == exports.EnumToken.CommaTokenType) {
            // @ts-ignore
            return {
                valid: SyntaxValidationResult.Drop,
                matches: [],
                node: tokens[0],
                syntax: null,
                error: 'unexpected token',
                tokens
            };
        }
        while (tokens.length > 0) {
            node = tokens[0];
            if (![exports.EnumToken.IdenTokenType, exports.EnumToken.StringTokenType].includes(node.typ)) {
                // @ts-ignore
                return {
                    valid: SyntaxValidationResult.Drop,
                    matches: [],
                    node,
                    syntax: null,
                    error: 'unexpected token',
                    tokens
                };
            }
            tokens.shift();
            consumeWhitespace(tokens);
            // @ts-ignore
            if (tokens.length > 0 && tokens[0].typ == exports.EnumToken.CommaTokenType) {
                tokens.shift();
            }
        }
        // @ts-ignore
        return {
            valid: SyntaxValidationResult.Valid,
            matches: [],
            node: null,
            syntax: null,
            error: '',
            tokens
        };
    }

    function validateCompoundSelector(tokens, root, options) {
        if (tokens.length == 0) {
            // @ts-ignore
            return {
                valid: SyntaxValidationResult.Drop,
                context: [],
                // @ts-ignore
                node: root,
                // @ts-ignore
                syntax: null,
                error: 'expected selector',
                tokens
            };
        }
        tokens = tokens.slice();
        consumeWhitespace(tokens);
        const config = getSyntaxConfig();
        let match = 0;
        let length = tokens.length;
        while (tokens.length > 0) {
            while (tokens.length > 0 && tokens[0].typ == exports.EnumToken.NestingSelectorTokenType) {
                if (!options?.nestedSelector) {
                    // @ts-ignore
                    return {
                        valid: SyntaxValidationResult.Drop,
                        context: [],
                        // @ts-ignore
                        node: tokens[0],
                        syntax: null,
                        error: 'nested selector not allowed'
                    };
                }
                match++;
                tokens.shift();
                consumeWhitespace(tokens);
            }
            // <type-selector>
            while (tokens.length > 0 &&
                [
                    exports.EnumToken.IdenTokenType,
                    exports.EnumToken.NameSpaceAttributeTokenType,
                    exports.EnumToken.ClassSelectorTokenType,
                    exports.EnumToken.HashTokenType,
                    exports.EnumToken.UniversalSelectorTokenType
                ].includes(tokens[0].typ)) {
                match++;
                tokens.shift();
                consumeWhitespace(tokens);
            }
            while (tokens.length > 0 && tokens[0].typ == exports.EnumToken.PseudoClassFuncTokenType) {
                if (!mozExtensions.has(tokens[0].val + '()') &&
                    !webkitExtensions.has(tokens[0].val + '()') &&
                    !((tokens[0].val + '()') in config.selectors)) {
                    if (!options?.lenient || /^(:?)-webkit-/.test(tokens[0].val)) {
                        // @ts-ignore
                        return {
                            valid: SyntaxValidationResult.Drop,
                            context: [],
                            // @ts-ignore
                            node: tokens[0],
                            syntax: null,
                            error: 'unknown pseudo-class: ' + tokens[0].val + '()'
                        };
                    }
                }
                match++;
                tokens.shift();
                consumeWhitespace(tokens);
            }
            while (tokens.length > 0 && (tokens[0].typ == exports.EnumToken.PseudoElementTokenType || tokens[0].typ == exports.EnumToken.PseudoClassTokenType)) {
                const isPseudoElement = tokens[0].typ == exports.EnumToken.PseudoElementTokenType;
                if (
                // https://developer.mozilla.org/en-US/docs/Web/CSS/WebKit_Extensions#pseudo-elements
                !(isPseudoElement && tokens[0].val.startsWith('::-webkit-')) &&
                    !mozExtensions.has(tokens[0].val) &&
                    !webkitExtensions.has(tokens[0].val) &&
                    !(tokens[0].val in config.selectors) &&
                    !(!isPseudoElement &&
                        (':' + tokens[0].val) in config.selectors)) {
                    if (!options?.lenient || /^(:?)-webkit-/.test(tokens[0].val)) {
                        // @ts-ignore
                        return {
                            valid: SyntaxValidationResult.Drop,
                            context: [],
                            // @ts-ignore
                            node: tokens[0],
                            syntax: null,
                            error: 'unknown pseudo-class: ' + tokens[0].val
                        };
                    }
                }
                match++;
                tokens.shift();
                consumeWhitespace(tokens);
            }
            while (tokens.length > 0 && tokens[0].typ == exports.EnumToken.AttrTokenType) {
                const children = tokens[0].chi.slice();
                consumeWhitespace(children);
                if (children.length == 0 || ![
                    exports.EnumToken.IdenTokenType,
                    exports.EnumToken.NameSpaceAttributeTokenType,
                    exports.EnumToken.MatchExpressionTokenType
                ].includes(children[0].typ)) {
                    // @ts-ignore
                    return {
                        valid: SyntaxValidationResult.Drop,
                        context: [],
                        node: tokens[0],
                        syntax: null,
                        error: 'invalid attribute selector'
                    };
                }
                if (children[0].typ == exports.EnumToken.MatchExpressionTokenType) {
                    if (children.length != 1) {
                        return {
                            valid: SyntaxValidationResult.Drop,
                            context: [],
                            node: tokens[0],
                            syntax: null,
                            error: 'invalid <attribute-selector>'
                        };
                    }
                    if (![
                        exports.EnumToken.IdenTokenType,
                        exports.EnumToken.NameSpaceAttributeTokenType
                    ].includes(children[0].l.typ) ||
                        ![
                            exports.EnumToken.EqualMatchTokenType, exports.EnumToken.DashMatchTokenType,
                            exports.EnumToken.StartMatchTokenType, exports.EnumToken.ContainMatchTokenType,
                            exports.EnumToken.EndMatchTokenType, exports.EnumToken.IncludeMatchTokenType
                        ].includes(children[0].op.typ) ||
                        ![
                            exports.EnumToken.StringTokenType,
                            exports.EnumToken.IdenTokenType
                        ].includes(children[0].r.typ) ||
                        (children[0].attr != null && !['i', 's'].includes(children[0].attr))) {
                        // @ts-ignore
                        return {
                            valid: SyntaxValidationResult.Drop,
                            context: [],
                            node: tokens[0],
                            syntax: null,
                            error: 'invalid attribute selector'
                        };
                    }
                }
                match++;
                tokens.shift();
                consumeWhitespace(tokens);
            }
            if (length == tokens.length) {
                return {
                    valid: SyntaxValidationResult.Drop,
                    context: [],
                    // @ts-ignore
                    node: tokens[0],
                    // @ts-ignore
                    syntax: null,
                    error: 'expected compound selector'
                };
            }
            length = tokens.length;
        }
        return match == 0 ? {
            valid: SyntaxValidationResult.Drop,
            context: [],
            // @ts-ignore
            node: root,
            // @ts-ignore
            syntax: null,
            error: 'expected compound selector'
        } :
            // @ts-ignore
            {
                valid: SyntaxValidationResult.Valid,
                context: [],
                // @ts-ignore
                node: root,
                // @ts-ignore
                syntax: null,
                error: null
            };
    }

    const combinatorsTokens = [exports.EnumToken.ChildCombinatorTokenType, exports.EnumToken.ColumnCombinatorTokenType,
        // EnumToken.DescendantCombinatorTokenType,
        exports.EnumToken.NextSiblingCombinatorTokenType, exports.EnumToken.SubsequentSiblingCombinatorTokenType];
    // <compound-selector> [ <combinator>? <compound-selector> ]*
    function validateComplexSelector(tokens, root, options) {
        // [ <type-selector>? <subclass-selector>* [ <pseudo-element-selector> <pseudo-class-selector>* ]* ]!
        tokens = tokens.slice();
        consumeWhitespace(tokens);
        if (tokens.length == 0) {
            return {
                valid: SyntaxValidationResult.Drop,
                context: [],
                // @ts-ignore
                node: root,
                syntax: null,
                error: 'expected selector'
            };
        }
        // const config = getSyntaxConfig();
        //
        // let match: number = 0;
        let result = null;
        // const combinators: EnumToken[] = combinatorsTokens.filter((t: EnumToken) => t != EnumToken.DescendantCombinatorTokenType);
        for (const t of splitTokenList(tokens, combinatorsTokens)) {
            result = validateCompoundSelector(t, root, options);
            if (result.valid == SyntaxValidationResult.Drop) {
                return result;
            }
        }
        // @ts-ignore
        return result ?? {
            valid: SyntaxValidationResult.Drop,
            context: [],
            node: root,
            syntax: null,
            error: 'expecting compound-selector'
        };
    }

    const validateSelector$1 = validateComplexSelector;

    function validateRelativeSelector(tokens, root, options) {
        tokens = tokens.slice();
        consumeWhitespace(tokens);
        // if (tokens.length == 0) {
        //
        //     // @ts-ignore
        //     return {
        //         valid: ValidationLevel.Drop,
        //         matches: [],
        //         // @ts-ignore
        //         node: root,
        //         // @ts-ignore
        //         syntax: null,
        //         error: 'expected selector',
        //         tokens
        //     }
        // }
        // , EnumToken.DescendantCombinatorTokenType
        if (combinatorsTokens.includes(tokens[0].typ)) {
            tokens.shift();
            consumeWhitespace(tokens);
        }
        return validateSelector$1(tokens, root, options);
    }

    function validateRelativeSelectorList(tokens, root, options) {
        tokens = tokens.slice();
        consumeWhitespace(tokens);
        for (const t of splitTokenList(tokens)) {
            const result = validateRelativeSelector(t, root, options);
            if (result.valid == SyntaxValidationResult.Drop) {
                return result;
            }
        }
        return {
            valid: SyntaxValidationResult.Valid,
            matches: [],
            // @ts-ignore
            node: root,
            // @ts-ignore
            syntax: null,
            error: '',
            tokens
        };
    }

    function validateComplexSelectorList(tokens, root, options) {
        tokens = tokens.slice();
        consumeWhitespace(tokens);
        let result = null;
        for (const t of splitTokenList(tokens)) {
            result = validateSelector$1(t, root, options);
            if (result.valid == SyntaxValidationResult.Drop) {
                return result;
            }
        }
        // @ts-ignore
        return result;
    }

    function validateKeyframeSelector(tokens, options) {
        consumeWhitespace(tokens);
        for (const t of splitTokenList(tokens)) {
            if (t.length != 1 || (t[0].typ != exports.EnumToken.PercentageTokenType && !(t[0].typ == exports.EnumToken.IdenTokenType && ['from', 'to', 'cover', 'contain', 'entry', 'exit', 'entry-crossing', 'exit-crossing'].includes(t[0].val)))) {
                return {
                    valid: SyntaxValidationResult.Drop,
                    context: [],
                    node: t[0],
                    syntax: null,
                    error: 'expected keyframe selector'
                };
            }
        }
        // @ts-ignore
        return {
            valid: SyntaxValidationResult.Valid,
            context: [],
            node: null,
            // @ts-ignore
            syntax: null,
            error: ''
        };
    }

    const config$2 = getSyntaxConfig();
    // @ts-ignore
    const allValues = getSyntaxConfig()["declarations" /* ValidationSyntaxGroupEnum.Declarations */].all.syntax.trim().split(/[\s|]+/g);
    /**
     * Check if a node is allowed as child in a given context
     * @param node
     * @param context
     */
    function isNodeAllowedInContext(node, context) {
        if (node.typ == exports.EnumToken.CommentNodeType || context == null) {
            return true;
        }
        switch (context?.typ) {
            case exports.EnumToken.StyleSheetNodeType:
            case exports.EnumToken.RuleNodeType:
                return node.typ == exports.EnumToken.RuleNodeType ||
                    node.typ == exports.EnumToken.AtRuleNodeType ||
                    node.typ == exports.EnumToken.KeyframesAtRuleNodeType ||
                    (node.typ == exports.EnumToken.DeclarationNodeType && context.typ == exports.EnumToken.RuleNodeType) ||
                    (node.typ == exports.EnumToken.CDOCOMMNodeType && context.typ == exports.EnumToken.StyleSheetNodeType);
            case exports.EnumToken.KeyframesAtRuleNodeType:
                return node.typ == exports.EnumToken.KeyFramesRuleNodeType;
            case exports.EnumToken.KeyFramesRuleNodeType:
                return node.typ == exports.EnumToken.DeclarationNodeType;
            case exports.EnumToken.AtRuleNodeType:
                // @ts-ignore
                const syntax = getParsedSyntax("atRules" /* ValidationSyntaxGroupEnum.AtRules */, '@' + context.nam)?.[0].chi ?? null;
                //
                if (syntax == null) {
                    // console.error(`syntax: Not found ${ValidationSyntaxGroupEnum.AtRules}@${(context as AstAtRule).nam}`);
                    return true;
                }
                const stack = syntax.slice();
                for (const child of stack) {
                    if (Array.isArray(child)) {
                        stack.push(...child);
                        continue;
                    }
                    if ('chi' in child && Array.isArray(child.chi)) {
                        stack.push(...child.chi);
                        continue;
                    }
                    // @ts-ignore
                    if (child.l != null) {
                        // @ts-ignore
                        stack.push(child.l);
                        // @ts-ignore
                        if (child.r != null) {
                            // @ts-ignore
                            stack.push(...(Array.isArray(child.r) ? child.r : [child.r]));
                        }
                        continue;
                    }
                    if (node.typ == exports.EnumToken.DeclarationNodeType) {
                        if (child.typ == ValidationTokenEnum.DeclarationDefinitionToken) {
                            if (node.nam == child.nam) {
                                return true;
                            }
                        }
                    }
                    if (child.typ == ValidationTokenEnum.PropertyType) {
                        if (['group-rule-body', 'block-contents', 'rule-list', 'stylesheet'].includes(child.val)) {
                            if ((node.typ == exports.EnumToken.RuleNodeType ||
                                node.typ == exports.EnumToken.AtRuleNodeType ||
                                node.typ == exports.EnumToken.KeyframesAtRuleNodeType)) {
                                return true;
                            }
                            if (node.typ == exports.EnumToken.DeclarationNodeType) {
                                let parent = node.parent;
                                while (parent != null) {
                                    if (parent.parent?.typ == exports.EnumToken.RuleNodeType) {
                                        return true;
                                    }
                                    parent = parent.parent;
                                }
                            }
                        }
                        if (['declaration-list', 'feature-value-declaration'].includes(child.val) && node.typ == exports.EnumToken.DeclarationNodeType) {
                            return true;
                        }
                        if (child.val == 'page-body' && (node.typ == exports.EnumToken.DeclarationNodeType || (node.typ == exports.EnumToken.AtRuleNodeType && [
                            'top-left-corner', 'top-left', 'top-center', 'top-right', 'top-right-corner',
                            'bottom-left-corner', 'bottom-left', 'bottom-center', 'bottom-right', 'bottom-right-corner',
                            'left-top', 'left-middle', 'left-bottom', 'right-top', 'right-middle', 'right-bottom'
                        ].includes(node.nam)))) {
                            return true;
                        }
                        if (child.val == 'feature-value-block-list' &&
                            (node.typ == exports.EnumToken.AtRuleNodeType && ['stylistic', 'historical-forms', 'styleset', 'character-variant', 'swash', 'ornaments', 'annotation'].includes(node.nam))) {
                            return true;
                        }
                        if (['feature-value-declaration-list', 'feature-value-declaration'].includes(child.val) && node.typ == exports.EnumToken.DeclarationNodeType) {
                            return true;
                        }
                        if (child.val == 'page-body') {
                            if (node.typ == exports.EnumToken.DeclarationNodeType) {
                                return true;
                            }
                        }
                        // console.error(`isNodeAllowedInContext: Not found ${(child as ValidationPropertyToken).val}`, {
                        //     child,
                        //     node
                        // });
                    }
                }
                break;
        }
        return false;
    }
    /**
     * Create a syntax validation context from a list of tokens
     * @param input
     */
    function createContext(input) {
        const values = input.slice();
        const result = values.filter(token => token.typ != exports.EnumToken.CommentTokenType).slice();
        return {
            index: -1,
            get length() {
                return this.index < 0 ? result.length : this.index > result.length ? 0 : result.length - this.index;
            },
            peek() {
                let index = this.index + 1;
                if (index >= result.length) {
                    return null;
                }
                if (result[index]?.typ == exports.EnumToken.WhitespaceTokenType) {
                    index++;
                }
                return result[index] ?? null;
            },
            update(context) {
                // @ts-ignore
                const newIndex = result.indexOf(context.current());
                if (newIndex > this.index) {
                    this.index = newIndex;
                }
            },
            consume(token, howMany) {
                let newIndex = result.indexOf(token, this.index + 1);
                howMany ??= 0;
                let splice = 1;
                result.splice(this.index + 1, 0, ...result.splice(newIndex, splice + howMany));
                this.index += howMany + splice;
                return true;
            },
            done() {
                return this.index + 1 >= result.length;
            },
            current() {
                return result[this.index] ?? null;
            },
            next() {
                let index = this.index + 1;
                if (index >= result.length) {
                    return null;
                }
                if (result[index]?.typ == exports.EnumToken.WhitespaceTokenType) {
                    index++;
                }
                this.index = index;
                return result[this.index] ?? null;
            },
            slice() {
                return result.slice(this.index + 1);
            },
            clone() {
                const context = createContext(result.slice());
                context.index = this.index;
                return context;
            }
        };
    }
    /**
     * Evaluate the validity of the syntax of a node
     * @param node
     * @param parent
     * @param options
     */
    function evaluateSyntax(node, parent, options) {
        if (node.validSyntax) {
            return {
                valid: SyntaxValidationResult.Valid,
                node,
                syntax: null,
                error: '',
                context: []
            };
        }
        let ast;
        let result;
        switch (node.typ) {
            case exports.EnumToken.DeclarationNodeType:
                if (node.nam.startsWith('--')) {
                    break;
                }
                let token = null;
                let values = node.val.slice();
                ast = getParsedSyntax("declarations" /* ValidationSyntaxGroupEnum.Declarations */, node.nam);
                while (values.length > 0) {
                    token = values.at(-1);
                    if (token.typ == exports.EnumToken.WhitespaceTokenType || token.typ == exports.EnumToken.CommentTokenType) {
                        values.pop();
                    }
                    else {
                        if (token.typ == exports.EnumToken.ImportantTokenType) {
                            values.pop();
                            if (values.at(-1)?.typ == exports.EnumToken.WhitespaceTokenType) {
                                values.pop();
                            }
                        }
                        break;
                    }
                }
                if (ast == null) {
                    if (parent?.typ == exports.EnumToken.AtRuleNodeType) {
                        ast = (getParsedSyntax("atRules" /* ValidationSyntaxGroupEnum.AtRules */, ['@' + parent.nam, 'descriptors', node.nam]));
                        if (ast == null) {
                            ast = (getParsedSyntax("atRules" /* ValidationSyntaxGroupEnum.AtRules */, ['@' + parent.nam, 'descriptors', node.nam]) ?? getParsedSyntax("atRules" /* ValidationSyntaxGroupEnum.AtRules */, '@' + parent.nam))?.[0]?.chi;
                            values = [{ ...node, val: values }];
                        }
                    }
                }
                if (ast != null) {
                    result = doEvaluateSyntax(ast, createContext(values), { ...options, visited: new WeakMap() });
                    if (result.valid == SyntaxValidationResult.Valid && !result.context.done()) {
                        let token = null;
                        if ((token = result.context.next()) != null) {
                            return {
                                ...result,
                                valid: SyntaxValidationResult.Drop,
                                node: token,
                                syntax: getSyntax("declarations" /* ValidationSyntaxGroupEnum.Declarations */, node.nam),
                                error: `unexpected token: '${renderToken(token)}'`,
                            };
                        }
                    }
                    return {
                        ...result,
                        syntax: getSyntax("declarations" /* ValidationSyntaxGroupEnum.Declarations */, node.nam)
                    };
                }
                break;
        }
        return {
            valid: SyntaxValidationResult.Valid,
            node,
            syntax: null,
            error: ''
        };
    }
    function clearVisited(token, syntax, key, options) {
        options.visited.get(token)?.get?.(key)?.delete(syntax);
    }
    function isVisited(token, syntax, key, options) {
        if (options.visited.get(token)?.get?.(key)?.has(syntax)) {
            return true;
        }
        if (!options.visited.has(token)) {
            options.visited.set(token, new Map());
        }
        if (!options.visited.get(token).has(key)) {
            options.visited.get(token).set(key, new Set());
        }
        options.visited.get(token).get(key).add(syntax);
        return false;
    }
    // https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Values_and_Units/Value_definition_syntax
    function doEvaluateSyntax(syntaxes, context, options) {
        let syntax;
        let i = 0;
        let result;
        let tmpResult;
        let token = null;
        if (context.done()) {
            const success = syntaxes.some(s => s.isOptional || s.isRepeatable || s.isRepeatableGroup);
            return {
                valid: success ? SyntaxValidationResult.Valid : SyntaxValidationResult.Drop,
                node: null,
                syntax: null,
                error: '',
                context
            };
        }
        for (; i < syntaxes.length; i++) {
            syntax = syntaxes[i];
            if (context.done()) {
                if (syntax.typ == ValidationTokenEnum.Whitespace || syntax.isOptional || syntax.isRepeatable) {
                    continue;
                }
                break;
            }
            token = context.peek();
            // if var() is the last token, then match the remaining syntax and return
            if (context.length == 1 && token.typ == exports.EnumToken.FunctionTokenType && 'var' === token.val?.toLowerCase?.()) {
                return doEvaluateSyntax(getParsedSyntax("functions" /* ValidationSyntaxGroupEnum.Functions */, 'var')?.[0]?.chi ?? [], createContext(token.chi), options);
            }
            if (syntax.typ == ValidationTokenEnum.Whitespace) {
                if (context.peek()?.typ == exports.EnumToken.WhitespaceTokenType) {
                    context.next();
                }
                continue;
            }
            else if (options.isList !== false && syntax.isList) {
                result = matchList(syntax, context, options);
            }
            else if (options.isRepeatable !== false && syntax.isRepeatable) {
                tmpResult = matchRepeatable(syntax, context, options);
                if (tmpResult.valid == SyntaxValidationResult.Valid) {
                    result = tmpResult;
                }
                else {
                    continue;
                }
            }
            else if (options.occurrence !== false && syntax.occurence != null) {
                result = matchOccurence(syntax, context, options);
            }
            else if (options.atLeastOnce !== false && syntax.atLeastOnce) {
                result = matchAtLeastOnce(syntax, context, options);
            }
            else {
                if (isVisited(token, syntax, 'doEvaluateSyntax', options)) {
                    return {
                        valid: SyntaxValidationResult.Drop,
                        node: token,
                        syntax,
                        error: `cyclic dependency: ${renderSyntax(syntax)}`,
                        context
                    };
                }
                result = match(syntax, context, options);
                if (result.valid == SyntaxValidationResult.Valid) {
                    clearVisited(token, syntax, 'doEvaluateSyntax', options);
                }
            }
            if (result.valid == SyntaxValidationResult.Drop) {
                if (syntax.isOptional) {
                    continue;
                }
                return result;
            }
            context.update(result.context);
        }
        // @ts-ignore
        return result ?? {
            valid: SyntaxValidationResult.Valid,
            node: null,
            syntax: syntaxes[i - 1],
            error: '',
            context
        };
    }
    function matchAtLeastOnce(syntax, context, options) {
        let success = false;
        let result;
        while (!context.done()) {
            result = match(syntax, context.clone(), { ...options, atLeastOnce: false });
            if (result.valid == SyntaxValidationResult.Valid) {
                success = true;
                context.update(result.context);
                continue;
            }
            break;
        }
        return {
            valid: success ? SyntaxValidationResult.Valid : SyntaxValidationResult.Drop,
            node: context.peek(),
            syntax,
            error: success ? '' : `could not match syntax: ${renderSyntax(syntax)}`,
            context
        };
    }
    function matchRepeatable(syntax, context, options) {
        let result;
        while (!context.done()) {
            result = match(syntax, context.clone(), { ...options, isRepeatable: false });
            if (result.valid == SyntaxValidationResult.Valid) {
                context.update(result.context);
                continue;
            }
            break;
        }
        return {
            valid: SyntaxValidationResult.Valid,
            node: null,
            syntax,
            error: '',
            context
        };
    }
    function matchList(syntax, context, options) {
        let success;
        let result;
        let count = 0;
        let con = context.clone();
        let tokens = [];
        while (!con.done()) {
            while (!con.done() && con.peek()?.typ != exports.EnumToken.CommaTokenType) {
                tokens.push(con.next());
            }
            result = doEvaluateSyntax([syntax], createContext(tokens), {
                ...options,
                isList: false,
                occurrence: false
            });
            if (result.valid == SyntaxValidationResult.Valid) {
                context = con.clone();
                count++;
                // pop comma
                if (con.done() || con.peek()?.typ != exports.EnumToken.CommaTokenType) {
                    break;
                }
                con.next();
                tokens.length = 0;
            }
            else {
                break;
            }
        }
        success = count > 0;
        if (success && syntax.occurence != null) {
            success = count >= syntax.occurence.min;
            if (success && syntax.occurence.max != null) {
                success = count <= syntax.occurence.max;
            }
        }
        return {
            valid: success ? SyntaxValidationResult.Valid : SyntaxValidationResult.Drop,
            node: context.peek(),
            syntax,
            error: '',
            context
        };
    }
    function matchOccurence(syntax, context, options) {
        let counter = 0;
        let result;
        do {
            result = match(syntax, context.clone(), { ...options, occurrence: false });
            if (result.valid == SyntaxValidationResult.Drop) {
                break;
            }
            counter++;
            context.update(result.context);
        } while (result.valid == SyntaxValidationResult.Valid && !context.done());
        let sucesss = counter >= syntax.occurence.min;
        if (sucesss && syntax.occurence.max != null) {
            if (Number.isFinite(syntax.occurence.max)) {
                sucesss = sucesss && counter <= syntax.occurence.max;
            }
        }
        return {
            valid: sucesss ? SyntaxValidationResult.Valid : SyntaxValidationResult.Drop,
            node: context.peek(),
            syntax,
            error: sucesss ? '' : `expected ${renderSyntax(syntax)} ${syntax.occurence.min} to ${syntax.occurence.max} occurences, got ${counter}`,
            context
        };
    }
    function match(syntax, context, options) {
        let success = false;
        let result;
        let token = context.peek();
        switch (syntax.typ) {
            case ValidationTokenEnum.PipeToken:
                return someOf(syntax.chi, context, options);
            case ValidationTokenEnum.Bracket:
                return doEvaluateSyntax(syntax.chi, context, options);
            case ValidationTokenEnum.AmpersandToken:
                return allOf(flatten(syntax), context, options);
            case ValidationTokenEnum.ColumnToken: {
                let result = anyOf(flatten(syntax), context, options);
                if (result.valid == SyntaxValidationResult.Valid) {
                    return result;
                }
                return {
                    valid: SyntaxValidationResult.Drop,
                    node: context.peek(),
                    syntax,
                    error: `expected '${ValidationTokenEnum[syntax.typ].toLowerCase()}', got '${context.done() ? null : renderToken(context.peek())}'`,
                    context
                };
            }
        }
        if (syntax.typ != ValidationTokenEnum.PropertyType && (token?.typ == exports.EnumToken.FunctionTokenType && wildCardFuncs.includes(token.val))) {
            const result = doEvaluateSyntax(getParsedSyntax("functions" /* ValidationSyntaxGroupEnum.Functions */, token.val)?.[0]?.chi ?? [], createContext(token.chi), {
                ...options,
                isRepeatable: null,
                isList: null,
                occurrence: null,
                atLeastOnce: null
            });
            if (result.valid == SyntaxValidationResult.Valid) {
                context.next();
            }
            return { ...result, context };
        }
        switch (syntax.typ) {
            case ValidationTokenEnum.Keyword:
                success = (token.typ == exports.EnumToken.IdenTokenType || token.typ == exports.EnumToken.DashedIdenTokenType || isIdentColor(token)) &&
                    (token.val == syntax.val ||
                        syntax.val.toLowerCase() === token.val?.toLowerCase?.() ||
                        // config.declarations.all
                        allValues.includes(token.val.toLowerCase()));
                if (success) {
                    context.next();
                    return {
                        valid: success ? SyntaxValidationResult.Valid : SyntaxValidationResult.Drop,
                        node: token,
                        syntax,
                        error: success ? '' : `expected keyword: '${syntax.val}', got ${renderToken(token)}`,
                        context
                    };
                }
                break;
            case ValidationTokenEnum.PropertyType:
                return matchPropertyType(syntax, context, options);
            case ValidationTokenEnum.ValidationFunctionDefinition:
                token = context.peek();
                if (token.typ == exports.EnumToken.ParensTokenType || !funcLike.concat(exports.EnumToken.ColorTokenType).includes(token.typ) || (!('chi' in token))) {
                    return {
                        valid: SyntaxValidationResult.Drop,
                        node: context.next(),
                        syntax,
                        error: `expected function or color token, got ${renderToken(token)}`,
                        context
                    };
                }
                result = match(getParsedSyntax("syntaxes" /* ValidationSyntaxGroupEnum.Syntaxes */, syntax.val + '()')?.[0], context, options);
                if (result.valid == SyntaxValidationResult.Valid) {
                    context.next();
                    result.context = context;
                    return result;
                }
                break;
            case ValidationTokenEnum.DeclarationType:
                return doEvaluateSyntax(getParsedSyntax("declarations" /* ValidationSyntaxGroupEnum.Declarations */, syntax.val), context, {
                    ...options,
                    isRepeatable: null,
                    isList: null,
                    occurrence: null,
                    atLeastOnce: null
                });
            case ValidationTokenEnum.Comma:
                success = context.peek()?.typ == exports.EnumToken.CommaTokenType;
                if (success) {
                    context.next();
                }
                break;
            case ValidationTokenEnum.Separator:
                {
                    const token = context.peek();
                    success = token?.typ == exports.EnumToken.LiteralTokenType && token.val == '/';
                    if (success) {
                        context.next();
                    }
                }
                break;
            default:
                token = context.peek();
                if (!wildCardFuncs.includes(syntax.val) && syntax.val != token.val) {
                    break;
                }
                if (syntax.typ == ValidationTokenEnum.Function) {
                    success = funcLike.includes(token.typ) && syntax.val.toLowerCase() === token.val?.toLowerCase?.() && doEvaluateSyntax(syntax.chi, createContext(token.chi), options).valid == SyntaxValidationResult.Valid;
                    if (success) {
                        context.next();
                    }
                    break;
                }
                if (token.typ != exports.EnumToken.ParensTokenType && funcLike.includes(token.typ)) {
                    success = doEvaluateSyntax(syntax.chi, createContext(token.chi), {
                        ...options,
                        isRepeatable: null,
                        isList: null,
                        occurrence: null,
                        atLeastOnce: null
                    }).valid == SyntaxValidationResult.Valid;
                    if (success) {
                        context.next();
                    }
                    break;
                }
        }
        if (!success && token.typ == exports.EnumToken.IdenTokenType && allValues.includes(token.val.toLowerCase())) {
            success = true;
            context.next();
        }
        return {
            valid: success ? SyntaxValidationResult.Valid : SyntaxValidationResult.Drop,
            node: context.peek(),
            syntax,
            error: success ? '' : `expected '${ValidationTokenEnum[syntax.typ].toLowerCase()}', got '${renderToken(context.peek())}'`,
            context
        };
    }
    function matchPropertyType(syntax, context, options) {
        if (![
            'color',
            'integer',
            'bg-position',
            'composes-selector',
            'length-percentage', 'flex', 'calc-sum', 'color',
            'color-base', 'system-color', 'deprecated-system-color',
            'pseudo-class-selector', 'pseudo-element-selector', 'feature-value-declaration'
        ].includes(syntax.val)) {
            if (syntax.val in config$2["syntaxes" /* ValidationSyntaxGroupEnum.Syntaxes */]) {
                return doEvaluateSyntax(getParsedSyntax("syntaxes" /* ValidationSyntaxGroupEnum.Syntaxes */, syntax.val), context, {
                    ...options,
                    isRepeatable: null,
                    isList: null,
                    occurrence: null,
                    atLeastOnce: null
                });
            }
        }
        let success = true;
        let token = context.peek();
        if ((token?.typ == exports.EnumToken.FunctionTokenType && wildCardFuncs.includes(token.val))) {
            const result = doEvaluateSyntax(getParsedSyntax("functions" /* ValidationSyntaxGroupEnum.Functions */, token.val)?.[0]?.chi ?? [], createContext(token.chi), {
                ...options,
                isRepeatable: null,
                isList: null,
                occurrence: null,
                atLeastOnce: null
            });
            if (result.valid == SyntaxValidationResult.Valid) {
                context.next();
            }
            return { ...result, context };
        }
        switch (syntax.val) {
            case 'composes-selector':
                success = token.typ == exports.EnumToken.ComposesSelectorNodeType;
                break;
            case 'bg-position': {
                let val;
                let keyworkMatchCount = 0;
                let lengthMatchCount = 0;
                let functionMatchCount = 0;
                let isBGX = false;
                let isBGY = false;
                while (token != null && keyworkMatchCount + lengthMatchCount + functionMatchCount < 3) {
                    // match one value: keyword or length
                    success = (token.typ == exports.EnumToken.FunctionTokenType && wildCardFuncs.includes(token.val));
                    if (success) {
                        functionMatchCount++;
                        context.next();
                        token = context.peek();
                        continue;
                    }
                    if (token.typ == exports.EnumToken.WhitespaceTokenType) {
                        context.next();
                        token = context.peek();
                        continue;
                    }
                    if (token.typ == exports.EnumToken.IdenTokenType) {
                        val = token.val.toLowerCase();
                        success = ['left', 'center', 'right', 'top', 'center', 'bottom'].includes(val);
                        if (!success) {
                            break;
                        }
                        keyworkMatchCount++;
                        if (keyworkMatchCount > 2) {
                            return {
                                valid: SyntaxValidationResult.Drop,
                                node: token,
                                syntax,
                                error: `expected <length-percentage>`,
                                context
                            };
                        }
                        if (val == 'left' || val == 'right') {
                            if (isBGX) {
                                return {
                                    valid: SyntaxValidationResult.Drop,
                                    node: token,
                                    syntax,
                                    error: `top | bottom | <length-percentage>`,
                                    context
                                };
                            }
                            isBGX = true;
                        }
                        if (val == 'top' || val == 'bottom') {
                            if (isBGY) {
                                return {
                                    valid: SyntaxValidationResult.Drop,
                                    node: token,
                                    syntax,
                                    error: `expected left | right | <length-percentage>`,
                                    context
                                };
                            }
                            isBGY = true;
                        }
                        context.next();
                        token = context.peek();
                        continue;
                    }
                    success = token.typ == exports.EnumToken.LengthTokenType || token.typ == exports.EnumToken.PercentageTokenType || (token.typ == exports.EnumToken.NumberTokenType && token.val == 0);
                    if (!success) {
                        break;
                    }
                    lengthMatchCount++;
                    context.next();
                    token = context.peek();
                }
                if (keyworkMatchCount + lengthMatchCount + functionMatchCount == 0) {
                    return {
                        valid: SyntaxValidationResult.Drop,
                        node: token,
                        syntax,
                        error: `expected <bg-position>`,
                        context
                    };
                }
                return {
                    valid: SyntaxValidationResult.Valid,
                    node: token,
                    syntax,
                    error: '',
                    context
                };
            }
            case 'calc-sum':
                success = (token.typ == exports.EnumToken.FunctionTokenType && mathFuncs.includes(token.val)) ||
                    // @ts-ignore
                    (token.typ == exports.EnumToken.IdenTokenType && typeof Math[token.val.toUpperCase()] == 'number') ||
                    [exports.EnumToken.BinaryExpressionTokenType, exports.EnumToken.NumberTokenType, exports.EnumToken.PercentageTokenType, exports.EnumToken.DimensionTokenType, exports.EnumToken.LengthTokenType, exports.EnumToken.AngleTokenType, exports.EnumToken.TimeTokenType, exports.EnumToken.ResolutionTokenType, exports.EnumToken.FrequencyTokenType].includes(token.typ);
                break;
            case 'declaration':
                {
                    success = token.typ == exports.EnumToken.DeclarationNodeType;
                    if (success) {
                        success = evaluateSyntax(token, null, options).valid == SyntaxValidationResult.Valid;
                    }
                }
                break;
            case 'declaration-value':
                while (!context.done()) {
                    context.next();
                }
                success = true;
                break;
            case 'url-token':
                success = token.typ == exports.EnumToken.UrlTokenTokenType || token.typ == exports.EnumToken.StringTokenType || (token.typ == exports.EnumToken.FunctionTokenType && wildCardFuncs.includes(token.val));
                break;
            case 'ident':
            case 'ident-token':
            case 'custom-ident':
                success = token.typ == exports.EnumToken.IdenTokenType || token.typ == exports.EnumToken.DashedIdenTokenType || isIdentColor(token);
                break;
            case 'dashed-ident':
            case 'custom-property-name':
                success = token.typ == exports.EnumToken.DashedIdenTokenType;
                break;
            case 'system-color':
                success = (token.typ == exports.EnumToken.ColorTokenType && token.kin == exports.ColorType.SYS) || (token.typ == exports.EnumToken.IdenTokenType && 'currentcolor' === token.val.toLowerCase()) || (token.typ == exports.EnumToken.FunctionTokenType && wildCardFuncs.includes(token.val));
                break;
            case 'deprecated-system-color':
                success = (token.typ == exports.EnumToken.ColorTokenType && token.kin == exports.ColorType.DPSYS) || (token.typ == exports.EnumToken.IdenTokenType && 'currentcolor' === token.val.toLowerCase()) || (token.typ == exports.EnumToken.FunctionTokenType && wildCardFuncs.includes(token.val));
                break;
            case 'color':
            case 'color-base':
                success = token.typ == exports.EnumToken.ColorTokenType ||
                    (token.typ == exports.EnumToken.IdenTokenType && 'currentcolor' === token.val.toLowerCase()) ||
                    (token.typ == exports.EnumToken.IdenTokenType && 'transparent' === token.val.toLowerCase()) ||
                    (token.typ == exports.EnumToken.FunctionTokenType && wildCardFuncs.includes(token.val) ||
                        isColor(token));
                if (!success && token.typ == exports.EnumToken.FunctionTokenType && colorsFunc.includes(token.val)) {
                    success = doEvaluateSyntax(getParsedSyntax("functions" /* ValidationSyntaxGroupEnum.Functions */, token.val)?.[0]?.chi, createContext(token.chi), {
                        ...options,
                        isRepeatable: null,
                        isList: null,
                        occurrence: null,
                        atLeastOnce: null
                    }).valid == SyntaxValidationResult.Valid;
                }
                break;
            case 'hex-color':
                success = (token.typ == exports.EnumToken.ColorTokenType && token.kin == exports.ColorType.HEX) || (token.typ == exports.EnumToken.FunctionTokenType && wildCardFuncs.includes(token.val));
                break;
            case 'feature-value-declaration':
                {
                    let hasNumber = false;
                    success = token.typ == exports.EnumToken.DeclarationNodeType && token.val.length > 0 && token.val.every((val) => {
                        if (val.typ == exports.EnumToken.WhitespaceTokenType || val.typ == exports.EnumToken.CommentTokenType) {
                            return true;
                        }
                        const success = (val.typ == exports.EnumToken.NumberTokenType && Number.isInteger(+val.val) && val.val > 0) || (val.typ == exports.EnumToken.FunctionTokenType && mathFuncs.includes(val.val.toLowerCase()) || (val.typ == exports.EnumToken.FunctionTokenType && wildCardFuncs.includes(val.val)));
                        if (success) {
                            hasNumber = true;
                        }
                        if ('range' in syntax) {
                            return success && +val.val >= +syntax.range[0] && +val.val <= +syntax.range[1];
                        }
                        return success;
                    }) && hasNumber;
                }
                break;
            case 'integer':
                success = (token.typ == exports.EnumToken.NumberTokenType && /^[+-]?\d+$/.test(token.val.toString())) || (token.typ == exports.EnumToken.FunctionTokenType && mathFuncs.includes(token.val.toLowerCase()) || (token.typ == exports.EnumToken.FunctionTokenType && wildCardFuncs.includes(token.val)));
                if ('range' in syntax) {
                    success = success && +token.val >= +syntax.range[0] && +token.val <= +syntax.range[1];
                }
                break;
            case 'dimension':
                success = [
                    exports.EnumToken.DimensionTokenType,
                    exports.EnumToken.LengthTokenType,
                    exports.EnumToken.AngleTokenType,
                    exports.EnumToken.TimeTokenType,
                    exports.EnumToken.ResolutionTokenType,
                    exports.EnumToken.FrequencyTokenType
                ].includes(token.typ) || (token.typ == exports.EnumToken.FunctionTokenType && token.val == 'calc');
                break;
            case 'flex':
                success = token.typ == exports.EnumToken.FlexTokenType || (token.typ == exports.EnumToken.FunctionTokenType && token.val == 'calc');
                break;
            case 'number':
            case 'number-token':
                success = token.typ == exports.EnumToken.NumberTokenType;
                if (success && 'range' in syntax) {
                    success = +token.val >= +syntax.range[0] && (syntax.range[1] == null || +token.val <= +syntax.range[1]);
                }
                break;
            case 'angle':
                success = token.typ == exports.EnumToken.AngleTokenType || (token.typ == exports.EnumToken.NumberTokenType && token.val == 0) || (token.typ == exports.EnumToken.FunctionTokenType && token.val == 'calc');
                break;
            case 'length':
                success = token.typ == exports.EnumToken.LengthTokenType || (token.typ == exports.EnumToken.NumberTokenType && token.val == 0) || (token.typ == exports.EnumToken.FunctionTokenType && token.val == 'calc');
                break;
            case 'percentage':
                success = token.typ == exports.EnumToken.PercentageTokenType || (token.typ == exports.EnumToken.NumberTokenType && token.val == 0) || (token.typ == exports.EnumToken.FunctionTokenType && token.val == 'calc');
                break;
            case 'length-percentage':
                success = token.typ == exports.EnumToken.LengthTokenType || token.typ == exports.EnumToken.PercentageTokenType || (token.typ == exports.EnumToken.NumberTokenType && token.val == 0) || (token.typ == exports.EnumToken.FunctionTokenType && token.val == 'calc');
                break;
            case 'resolution':
                success = token.typ == exports.EnumToken.ResolutionTokenType || token.typ == exports.EnumToken.PercentageTokenType || (token.typ == exports.EnumToken.NumberTokenType && token.val == 0) || (token.typ == exports.EnumToken.FunctionTokenType && token.val == 'calc');
                break;
            case 'hash-token':
                success = token.typ == exports.EnumToken.HashTokenType;
                break;
            case 'string':
                success = token.typ == exports.EnumToken.StringTokenType || token.typ == exports.EnumToken.UrlTokenTokenType || token.typ == exports.EnumToken.HashTokenType || token.typ == exports.EnumToken.IdenTokenType || (token.typ == exports.EnumToken.FunctionTokenType && wildCardFuncs.includes(token.val));
                break;
            case 'time':
                success = token.typ == exports.EnumToken.TimeTokenType || (token.typ == exports.EnumToken.FunctionTokenType && token.val == 'calc');
                break;
            case 'zero':
                success = token.val == 0 || (token.typ == exports.EnumToken.FunctionTokenType && token.val == 'calc');
                break;
            case 'pseudo-element-selector':
                success = token.typ == exports.EnumToken.PseudoElementTokenType;
                break;
            case 'pseudo-class-selector':
                success = token.typ == exports.EnumToken.PseudoClassTokenType || token.typ == exports.EnumToken.PseudoClassFuncTokenType;
                if (success) {
                    success = token.val + (token.typ == exports.EnumToken.PseudoClassTokenType ? '' : '()') in config$2["selectors" /* ValidationSyntaxGroupEnum.Selectors */];
                    if (success && token.typ == exports.EnumToken.PseudoClassFuncTokenType) {
                        success = doEvaluateSyntax(getParsedSyntax("selectors" /* ValidationSyntaxGroupEnum.Selectors */, token.val + '()')?.[0]?.chi ?? [], createContext(token.chi), {
                            ...options,
                            isRepeatable: null,
                            isList: null,
                            occurrence: null,
                            atLeastOnce: null
                        }).valid == SyntaxValidationResult.Valid;
                    }
                }
                break;
        }
        if (!success &&
            token.typ == exports.EnumToken.FunctionTokenType &&
            ['length-percentage', 'length', 'number', 'number-token', 'angle', 'percentage', 'dimension'].includes(syntax.val)) {
            if (!success) {
                success = mathFuncs.includes(token.val.toLowerCase()) &&
                    doEvaluateSyntax(getParsedSyntax("syntaxes" /* ValidationSyntaxGroupEnum.Syntaxes */, token.val + '()')?.[0]?.chi ?? [], createContext(token.chi), {
                        ...options,
                        isRepeatable: null,
                        isList: null,
                        occurrence: null,
                        atLeastOnce: null
                    }).valid == SyntaxValidationResult.Valid;
            }
        }
        if (!success && token.typ == exports.EnumToken.IdenTokenType) {
            success = allValues.includes(token.val.toLowerCase());
        }
        if (success) {
            context.next();
        }
        return {
            valid: success ? SyntaxValidationResult.Valid : SyntaxValidationResult.Drop,
            node: token,
            syntax,
            error: success ? '' : `expected '${syntax.val}', got ${renderToken(token)}`,
            context
        };
    }
    function someOf(syntaxes, context, options) {
        let result;
        let i;
        let success = false;
        const matched = [];
        for (i = 0; i < syntaxes.length; i++) {
            result = doEvaluateSyntax(syntaxes[i], context.clone(), options);
            if (result.valid == SyntaxValidationResult.Valid) {
                success = true;
                if (result.context.done()) {
                    return result;
                }
                matched.push(result);
            }
        }
        if (matched.length > 0) {
            // pick the best match
            matched.sort((a, b) => a.context.done() ? -1 : b.context.done() ? 1 : b.context.index - a.context.index);
        }
        return matched[0] ?? {
            valid: SyntaxValidationResult.Drop,
            node: context.peek(),
            syntax: null,
            error: success ? '' : `could not match syntax: ${syntaxes.reduce((acc, curr) => acc + (acc.length > 0 ? ' | ' : '') + curr.reduce((acc, curr) => acc + renderSyntax(curr), ''), '')}`,
            context
        };
    }
    function anyOf(syntaxes, context, options) {
        let result;
        let i;
        let success = false;
        for (i = 0; i < syntaxes.length; i++) {
            result = doEvaluateSyntax(syntaxes[i], context.clone(), options);
            if (result.valid == SyntaxValidationResult.Valid) {
                success = true;
                context.update(result.context);
                if (result.context.done()) {
                    return result;
                }
                syntaxes.splice(i, 1);
                i = -1;
            }
        }
        return {
            valid: success ? SyntaxValidationResult.Valid : SyntaxValidationResult.Drop,
            node: context.peek(),
            syntax: null,
            error: success ? '' : `could not match syntax: ${syntaxes.reduce((acc, curr) => acc + '[' + curr.reduce((acc, curr) => acc + renderSyntax(curr), '') + ']', '')}`,
            context
        };
    }
    function allOf(syntax, context, options) {
        let result;
        let i;
        let slice = context.slice();
        const vars = [];
        const tokens = [];
        const repeatable = [];
        // match optional syntax first
        // <length>{2,3}&&<color>? => <color>?&&<length>{2,3}
        for (i = 0; i < syntax.length; i++) {
            if (syntax[i].length == 1 && syntax[i][0].occurence != null) {
                repeatable.push(syntax[i]);
                syntax.splice(i--, 1);
            }
        }
        if (repeatable.length > 0) {
            syntax.push(...repeatable);
        }
        // sort tokens -> wildCard -> last
        // 1px var(...) 2px => 1px 2px var(...)
        for (i = 0; i < slice.length; i++) {
            if (slice[i].typ == exports.EnumToken.FunctionTokenType && wildCardFuncs.includes(slice[i].val.toLowerCase())) {
                vars.push(slice[i]);
                continue;
            }
            if (slice[i].typ == exports.EnumToken.CommaTokenType || (slice[i].typ == exports.EnumToken.LiteralTokenType && slice[i].val == '/')) {
                tokens.push(...vars);
                vars.length = 0;
            }
            tokens.push(slice[i]);
        }
        if (vars.length > 0) {
            tokens.push(...vars);
        }
        const con = createContext(tokens);
        let cp;
        let j;
        for (i = 0; i < syntax.length; i++) {
            if (syntax[i].length == 1 && syntax[i][0].isOptional) {
                j = 0;
                cp = con.clone();
                slice = cp.slice();
                if (cp.done()) {
                    syntax.splice(i, 1);
                    i = -1;
                    continue;
                }
                while (!cp.done()) {
                    result = doEvaluateSyntax(syntax[i], cp.clone(), { ...options, isOptional: false });
                    if (result.valid == SyntaxValidationResult.Valid) {
                        let end = slice.indexOf(cp.current());
                        if (end == -1) {
                            end = 0;
                        }
                        else {
                            end -= j - 1;
                        }
                        con.consume(slice[j], end < 0 ? 0 : end);
                        break;
                    }
                    cp.next();
                    j++;
                }
                // @ts-ignore
                if (result?.valid == SyntaxValidationResult.Valid || (syntax[i].length == 1 && syntax[i][0].isOptional)) {
                    syntax.splice(i, 1);
                    i = -1;
                }
                continue;
            }
            result = doEvaluateSyntax(syntax[i], con.clone(), options);
            if (result.valid == SyntaxValidationResult.Valid) {
                con.update(result.context);
                syntax.splice(i, 1);
                i = -1;
            }
        }
        const success = syntax.length == 0;
        return {
            valid: success ? SyntaxValidationResult.Valid : SyntaxValidationResult.Drop,
            node: context.peek(),
            syntax: syntax?.[0]?.[0] ?? null,
            error: `could not match syntax: ${syntax.reduce((acc, curr) => acc + '[' + curr.reduce((acc, curr) => acc + renderSyntax(curr), '') + ']', '')}`,
            context: success ? con : context
        };
    }
    function flatten(syntax) {
        const stack = [syntax.l, syntax.r];
        const data = [];
        let s;
        let i = 0;
        for (; i < stack.length; i++) {
            if (stack[i].length == 1 && stack[i][0].typ == syntax.typ) {
                s = stack[i][0];
                stack.splice(i--, 1, s.l, s.r);
            }
            else {
                data.push(stack[i]);
            }
        }
        return data;
    }

    function validateURL(token) {
        const children = token.chi.slice();
        consumeWhitespace(children);
        if (children.length > 0 && [exports.EnumToken.UrlTokenTokenType, exports.EnumToken.StringTokenType, exports.EnumToken.HashTokenType].includes(children[0].typ)) {
            children.shift();
        }
        consumeWhitespace(children);
        if (children.length > 0) {
            // @ts-ignore
            return {
                valid: SyntaxValidationResult.Drop,
                context: [],
                node: children[0] ?? token,
                // @ts-ignore
                syntax: 'url()',
                error: 'unexpected token'
            };
        }
        // @ts-ignore
        return {
            valid: SyntaxValidationResult.Valid,
            context: [],
            node: token,
            // @ts-ignore
            syntax: 'url()',
            error: ''
        };
    }

    const validateSelectorList = validateComplexSelectorList;

    function validateSelector(selector, options, root) {
        let isNested = root.typ == exports.EnumToken.RuleNodeType ? 1 : 0;
        let currentRoot = root.parent;
        while (currentRoot != null && isNested == 0) {
            if (currentRoot.typ == exports.EnumToken.RuleNodeType) {
                isNested++;
                if (isNested > 0) {
                    // @ts-ignore
                    return validateRelativeSelectorList(selector, root, { ...(options ?? {}), nestedSelector: true });
                }
            }
            currentRoot = currentRoot.parent;
        }
        const nestedSelector = isNested > 0;
        // @ts-ignore
        return nestedSelector ? validateRelativeSelectorList(selector, root, {
            ...(options ?? {}),
            nestedSelector
        }) : validateSelectorList(selector, root, { ...(options ?? {}), nestedSelector });
    }

    function validateAtRuleMedia(atRule, options, root) {
        if (!Array.isArray(atRule.chi)) {
            // @ts-ignore
            return {
                valid: SyntaxValidationResult.Drop,
                matches: [],
                node: atRule,
                syntax: '@' + atRule.nam,
                error: 'expected supports body',
                tokens: []
            };
        }
        // media-query-list
        if (!Array.isArray(atRule.tokens) || atRule.tokens.length == 0) {
            // @ts-ignore
            return {
                valid: SyntaxValidationResult.Valid,
                context: [],
                node: null,
                syntax: null,
                error: '',
                tokens: []
            };
        }
        let result = null;
        const slice = atRule.tokens.slice();
        consumeWhitespace(slice);
        if (slice.length == 0) {
            return {
                valid: SyntaxValidationResult.Valid,
                context: [],
                node: atRule,
                syntax: '@media',
                error: ''
            };
        }
        result = validateAtRuleMediaQueryList(atRule.tokens, atRule);
        if (result.valid == SyntaxValidationResult.Drop) {
            return result;
        }
        if (!('chi' in atRule)) {
            // @ts-ignore
            return {
                valid: SyntaxValidationResult.Drop,
                context: [],
                node: atRule,
                syntax: '@media',
                error: 'expected at-rule body'
            };
        }
        // @ts-ignore
        return {
            valid: SyntaxValidationResult.Valid,
            context: [],
            node: atRule,
            syntax: '@media',
            error: ''
        };
    }
    function validateAtRuleMediaQueryList(tokenList, atRule) {
        const split = splitTokenList(tokenList);
        const matched = [];
        let result = null;
        let previousToken;
        let mediaFeatureType;
        for (let i = 0; i < split.length; i++) {
            const tokens = split[i].slice();
            const match = [];
            result = null;
            mediaFeatureType = null;
            previousToken = null;
            if (tokens.length == 0) {
                // @ts-ignore
                result = {
                    valid: SyntaxValidationResult.Drop,
                    context: [],
                    node: tokens[0] ?? atRule,
                    syntax: '@media',
                    error: 'unexpected token'
                };
                continue;
            }
            while (tokens.length > 0) {
                previousToken = tokens[0];
                // media-condition | media-type | custom-media
                if (!(validateMediaCondition(tokens[0], atRule) || validateMediaFeature(tokens[0]) || validateCustomMediaCondition(tokens[0], atRule))) {
                    if (tokens[0].typ == exports.EnumToken.ParensTokenType) {
                        result = validateAtRuleMediaQueryList(tokens[0].chi, atRule);
                    }
                    else {
                        result = {
                            valid: SyntaxValidationResult.Drop,
                            context: [],
                            node: tokens[0] ?? atRule,
                            syntax: '@media',
                            error: 'expecting media feature or media condition'
                        };
                    }
                    if (result.valid == SyntaxValidationResult.Drop) {
                        break;
                    }
                    result = null;
                }
                match.push(tokens.shift());
                if (tokens.length == 0) {
                    break;
                }
                if (!consumeWhitespace(tokens)) {
                    if (previousToken?.typ != exports.EnumToken.ParensTokenType) {
                        // @ts-ignore
                        result = {
                            valid: SyntaxValidationResult.Drop,
                            context: [],
                            node: tokens[0] ?? atRule,
                            syntax: '@media',
                            error: 'expected media query list'
                        };
                        break;
                    }
                }
                else if (![exports.EnumToken.MediaFeatureOrTokenType, exports.EnumToken.MediaFeatureAndTokenType].includes(tokens[0].typ)) {
                    // @ts-ignore
                    result = {
                        valid: SyntaxValidationResult.Drop,
                        context: [],
                        node: tokens[0] ?? atRule,
                        syntax: '@media',
                        error: 'expected and/or'
                    };
                    break;
                }
                if (mediaFeatureType == null) {
                    mediaFeatureType = tokens[0];
                }
                if (mediaFeatureType.typ != tokens[0].typ) {
                    // @ts-ignore
                    result = {
                        valid: SyntaxValidationResult.Drop,
                        context: [],
                        node: tokens[0] ?? atRule,
                        syntax: '@media',
                        error: 'mixing and/or not allowed at the same level'
                    };
                    break;
                }
                match.push({ typ: exports.EnumToken.WhitespaceTokenType }, tokens.shift());
                consumeWhitespace(tokens);
                if (tokens.length == 0) {
                    // @ts-ignore
                    result = {
                        valid: SyntaxValidationResult.Drop,
                        context: [],
                        node: tokens[0] ?? atRule,
                        syntax: '@media',
                        error: 'expected media-condition'
                    };
                    break;
                }
                match.push({ typ: exports.EnumToken.WhitespaceTokenType });
            }
            if (result == null && match.length > 0) {
                matched.push(match);
            }
        }
        if (result != null) {
            return result;
        }
        if (matched.length == 0) {
            return {
                valid: SyntaxValidationResult.Drop,
                context: [],
                node: atRule,
                syntax: '@media',
                error: 'expected media query list'
            };
        }
        tokenList.length = 0;
        let hasAll = false;
        for (let i = 0; i < matched.length; i++) {
            if (tokenList.length > 0) {
                tokenList.push({ typ: exports.EnumToken.CommaTokenType });
            }
            if (matched[i].length == 1 && matched.length > 1 && matched[i][0].typ == exports.EnumToken.MediaFeatureTokenType && matched[i][0].val == 'all') {
                hasAll = true;
                continue;
            }
            tokenList.push(...matched[i]);
        }
        if (hasAll && tokenList.length == 0) {
            tokenList.push({ typ: exports.EnumToken.MediaFeatureTokenType, val: 'all' });
        }
        // @ts-ignore
        return {
            valid: SyntaxValidationResult.Valid,
            context: [],
            node: atRule,
            syntax: '@media',
            error: ''
        };
    }
    function validateCustomMediaCondition(token, atRule) {
        if (token.typ == exports.EnumToken.MediaFeatureNotTokenType) {
            return validateMediaCondition(token.val, atRule);
        }
        if (token.typ != exports.EnumToken.ParensTokenType) {
            return false;
        }
        const chi = token.chi.filter((t) => t.typ != exports.EnumToken.CommentTokenType && t.typ != exports.EnumToken.WhitespaceTokenType);
        if (chi.length != 1) {
            return false;
        }
        return chi[0].typ == exports.EnumToken.DashedIdenTokenType;
    }
    function validateMediaCondition(token, atRule) {
        if (token.typ == exports.EnumToken.MediaFeatureNotTokenType) {
            return validateMediaCondition(token.val, atRule);
        }
        if (token.typ != exports.EnumToken.ParensTokenType && !(['when', 'else', 'import'].includes(atRule.nam) && token.typ == exports.EnumToken.FunctionTokenType && generalEnclosedFunc.includes(token.val))) {
            return false;
        }
        const chi = token.chi.filter((t) => t.typ != exports.EnumToken.CommentTokenType && t.typ != exports.EnumToken.WhitespaceTokenType);
        if (chi.length != 1) {
            return false;
        }
        if (chi[0].typ == exports.EnumToken.IdenTokenType) {
            return true;
        }
        if (chi[0].typ == exports.EnumToken.MediaFeatureNotTokenType) {
            return validateMediaCondition(chi[0].val, atRule);
        }
        if (chi[0].typ == exports.EnumToken.MediaQueryConditionTokenType) {
            return chi[0].l.typ == exports.EnumToken.IdenTokenType;
        }
        return false;
    }
    function validateMediaFeature(token) {
        let val = token;
        if (token.typ == exports.EnumToken.MediaFeatureOnlyTokenType || token.typ == exports.EnumToken.MediaFeatureNotTokenType) {
            val = token.val;
        }
        return val.typ == exports.EnumToken.MediaFeatureTokenType;
    }

    function validateAtRuleCounterStyle(atRule, options, root) {
        if (!Array.isArray(atRule.chi)) {
            // @ts-ignore
            return {
                valid: SyntaxValidationResult.Drop,
                matches: [],
                node: atRule,
                syntax: '@' + atRule.nam,
                error: 'expected supports body',
                tokens: []
            };
        }
        // media-query-list
        if (!Array.isArray(atRule.tokens) || atRule.tokens.length == 0) {
            // @ts-ignore
            return {
                valid: SyntaxValidationResult.Drop,
                matches: [],
                node: atRule,
                syntax: '@counter-style',
                error: 'expected counter style name',
                tokens: []
            };
        }
        const tokens = atRule.tokens.filter((t) => ![exports.EnumToken.WhitespaceTokenType, exports.EnumToken.CommentTokenType].includes(t.typ));
        if (tokens.length == 0) {
            // @ts-ignore
            return {
                valid: SyntaxValidationResult.Drop,
                matches: [],
                node: atRule,
                syntax: '@counter-style',
                error: 'expected counter style name',
                tokens
            };
        }
        if (tokens.length > 1) {
            // @ts-ignore
            return {
                valid: SyntaxValidationResult.Drop,
                matches: [],
                node: tokens[1] ?? atRule,
                syntax: '@counter-style',
                error: 'unexpected token',
                tokens
            };
        }
        if (![exports.EnumToken.IdenTokenType, exports.EnumToken.DashedIdenTokenType].includes(tokens[0].typ)) {
            // @ts-ignore
            return {
                valid: SyntaxValidationResult.Drop,
                matches: [],
                node: tokens[0],
                syntax: '@counter-style',
                error: 'expected counter style name',
                tokens
            };
        }
        if (!('chi' in atRule)) {
            // @ts-ignore
            return {
                valid: SyntaxValidationResult.Drop,
                matches: [],
                node: atRule,
                syntax: '@counter-style',
                error: 'expected counter style body',
                tokens
            };
        }
        // @ts-ignore
        return {
            valid: SyntaxValidationResult.Valid,
            matches: [],
            node: atRule,
            syntax: '@counter-style',
            error: '',
            tokens
        };
    }

    function validateAtRulePage(atRule, options, root) {
        if (!Array.isArray(atRule.chi)) {
            // @ts-ignore
            return {
                valid: SyntaxValidationResult.Drop,
                matches: [],
                node: atRule,
                syntax: '@' + atRule.nam,
                error: 'expected supports body',
                tokens: []
            };
        }
        // media-query-list
        if (!Array.isArray(atRule.tokens) || atRule.tokens.length == 0) {
            // @ts-ignore
            return {
                valid: SyntaxValidationResult.Valid,
                matches: [],
                node: null,
                syntax: '@page',
                error: '',
                tokens: []
            };
        }
        // page-selector-list
        for (const tokens of splitTokenList(atRule.tokens)) {
            if (tokens.length == 0) {
                // @ts-ignore
                return {
                    valid: SyntaxValidationResult.Drop,
                    matches: [],
                    node: tokens[0] ?? atRule,
                    syntax: '@page',
                    error: 'unexpected token',
                    tokens: []
                };
            }
            // <pseudo-page>+ | <ident> <pseudo-page>*
            // ident pseudo-page* | pseudo-page+
            if (tokens[0].typ == exports.EnumToken.IdenTokenType) {
                tokens.shift();
                if (tokens.length == 0) {
                    continue;
                }
                // @ts-ignore
                if (tokens[0].typ != exports.EnumToken.WhitespaceTokenType) {
                    // @ts-ignore
                    return {
                        valid: SyntaxValidationResult.Drop,
                        matches: [],
                        node: tokens[0] ?? atRule,
                        syntax: '@page',
                        error: 'unexpected token',
                        tokens: []
                    };
                }
            }
            while (tokens.length > 0) {
                if (tokens[0].typ == exports.EnumToken.PseudoPageTokenType) {
                    tokens.shift();
                    if (tokens.length == 0) {
                        continue;
                    }
                    // @ts-ignore
                    if (tokens[0].typ != exports.EnumToken.WhitespaceTokenType) {
                        // @ts-ignore
                        return {
                            valid: SyntaxValidationResult.Drop,
                            matches: [],
                            node: tokens[0] ?? atRule,
                            syntax: '@page',
                            error: 'unexpected token',
                            tokens: []
                        };
                    }
                }
            }
        }
        // @ts-ignore
        return {
            valid: SyntaxValidationResult.Valid,
            matches: [],
            node: atRule,
            syntax: '@page',
            error: '',
            tokens: []
        };
    }

    function validateAtRulePageMarginBox(atRule, options, root) {
        if (!Array.isArray(atRule.chi)) {
            // @ts-ignore
            return {
                valid: SyntaxValidationResult.Drop,
                matches: [],
                node: atRule,
                syntax: '@' + atRule.nam,
                error: 'expected supports body',
                tokens: []
            };
        }
        if (Array.isArray(atRule.tokens) && atRule.tokens.length > 0) {
            // @ts-ignore
            return {
                valid: SyntaxValidationResult.Valid,
                context: [],
                node: null,
                syntax: '@' + atRule.nam,
                error: ''
            };
        }
        if (!('chi' in atRule)) {
            // @ts-ignore
            return {
                valid: SyntaxValidationResult.Drop,
                context: [],
                node: atRule,
                syntax: '@' + atRule.nam,
                error: 'expected margin-box body'
            };
        }
        for (const token of atRule.chi) {
            if (![exports.EnumToken.DeclarationNodeType, exports.EnumToken.CommentNodeType, exports.EnumToken.WhitespaceTokenType].includes(token.typ)) {
                // @ts-ignore
                return {
                    valid: SyntaxValidationResult.Drop,
                    context: [],
                    node: token,
                    syntax: 'declaration-list',
                    error: 'expected margin-box body'
                };
            }
        }
        // @ts-ignore
        return {
            valid: SyntaxValidationResult.Valid,
            context: [],
            node: null,
            syntax: '@' + atRule.nam,
            error: ''
        };
    }

    function validateAtRuleSupports(atRule, options, root) {
        // media-query-list
        if (!Array.isArray(atRule.tokens) || atRule.tokens.length == 0) {
            // @ts-ignore
            return {
                valid: SyntaxValidationResult.Drop,
                matches: [],
                node: atRule,
                syntax: '@' + atRule.nam,
                error: 'expected supports query list',
                tokens: []
            };
        }
        if (!Array.isArray(atRule.chi)) {
            // @ts-ignore
            return {
                valid: SyntaxValidationResult.Drop,
                matches: [],
                node: atRule,
                syntax: '@' + atRule.nam,
                error: 'expected supports body',
                tokens: []
            };
        }
        const result = validateAtRuleSupportsConditions(atRule, atRule.tokens);
        if (result) {
            if (result.node == null) {
                result.node = atRule;
            }
            return result;
        }
        if (!('chi' in atRule)) {
            // @ts-ignore
            return {
                valid: SyntaxValidationResult.Drop,
                context: [],
                node: atRule,
                syntax: '@' + atRule.nam,
                error: 'expected at-rule body'
            };
        }
        // @ts-ignore
        return {
            valid: SyntaxValidationResult.Valid,
            context: [],
            node: atRule,
            syntax: '@' + atRule.nam,
            error: ''
        };
    }
    function validateAtRuleSupportsConditions(atRule, tokenList) {
        let result = null;
        for (const tokens of splitTokenList(tokenList)) {
            if (tokens.length == 0) {
                // @ts-ignore
                return {
                    valid: SyntaxValidationResult.Drop,
                    context: [],
                    node: tokens[0] ?? atRule,
                    syntax: '@' + atRule.nam,
                    error: 'unexpected token',
                    tokens: []
                };
            }
            let previousToken = null;
            while (tokens.length > 0) {
                result = validateSupportCondition(atRule, tokens[0]);
                // supports-condition
                if (result.valid == SyntaxValidationResult.Valid) {
                    previousToken = tokens[0];
                    tokens.shift();
                }
                else {
                    result = validateSupportFeature(tokens[0]);
                    if ( /*result == null || */result.valid == SyntaxValidationResult.Valid) {
                        previousToken = tokens[0];
                        tokens.shift();
                    }
                    else {
                        if (tokens[0].typ == exports.EnumToken.ParensTokenType) {
                            result = validateAtRuleSupportsConditions(atRule, tokens[0].chi);
                            if ( /* result == null || */result.valid == SyntaxValidationResult.Valid) {
                                previousToken = tokens[0];
                                tokens.shift();
                                // continue;
                            }
                            else {
                                return result;
                            }
                        }
                        else {
                            return result;
                        }
                        // if (result!= null && result.valid == ValidationLevel.Drop) {
                        //
                        //     return  {
                        //         valid: ValidationLevel.Drop,
                        //         context: [],
                        //         node: tokens[0] ?? atRule,
                        //         syntax: '@' + atRule.nam,
                        //         // @ts-ignore
                        //         error: result.error as string ?? 'unexpected token',
                        //         tokens: []
                        //     };
                        // }
                    }
                }
                if (tokens.length == 0) {
                    break;
                }
                if (!consumeWhitespace(tokens)) {
                    if (previousToken?.typ != exports.EnumToken.ParensTokenType) {
                        // @ts-ignore
                        return {
                            valid: SyntaxValidationResult.Drop,
                            context: [],
                            node: tokens[0] ?? previousToken ?? atRule,
                            syntax: '@' + atRule.nam,
                            error: 'expected whitespace'
                        };
                    }
                }
                if (![exports.EnumToken.MediaFeatureOrTokenType, exports.EnumToken.MediaFeatureAndTokenType].includes(tokens[0].typ)) {
                    // @ts-ignore
                    return {
                        valid: SyntaxValidationResult.Drop,
                        context: [],
                        node: tokens[0] ?? atRule,
                        syntax: '@' + atRule.nam,
                        error: 'expected and/or'
                    };
                }
                if (tokens.length == 1) {
                    // @ts-ignore
                    return {
                        valid: SyntaxValidationResult.Drop,
                        context: [],
                        node: tokens[0] ?? atRule,
                        syntax: '@' + atRule.nam,
                        error: 'expected supports-condition'
                    };
                }
                tokens.shift();
                if (!consumeWhitespace(tokens)) {
                    // @ts-ignore
                    return {
                        valid: SyntaxValidationResult.Drop,
                        context: [],
                        node: tokens[0] ?? atRule,
                        syntax: '@' + atRule.nam,
                        error: 'expected whitespace'
                    };
                }
            }
        }
        return {
            valid: SyntaxValidationResult.Valid,
            context: [],
            node: atRule,
            syntax: '@' + atRule.nam,
            error: ''
        };
    }
    function validateSupportCondition(atRule, token) {
        if (token.typ == exports.EnumToken.MediaFeatureNotTokenType) {
            return validateSupportCondition(atRule, token.val);
        }
        if (token.typ == exports.EnumToken.FunctionTokenType && 'selector' === token.val.toLowerCase()) {
            return {
                valid: SyntaxValidationResult.Valid,
                context: [],
                node: token,
                syntax: '@' + atRule.nam,
                error: ''
            };
        }
        const chi = token.chi.filter((t) => t.typ != exports.EnumToken.CommentTokenType && t.typ != exports.EnumToken.WhitespaceTokenType);
        if (chi.length != 1) {
            return validateAtRuleSupportsConditions(atRule, token.chi);
        }
        if (chi[0].typ == exports.EnumToken.IdenTokenType) {
            // @ts-ignore
            return {
                valid: SyntaxValidationResult.Valid,
                context: [],
                node: null,
                syntax: '@' + atRule.nam,
                error: ''
            };
        }
        if (chi[0].typ == exports.EnumToken.MediaFeatureNotTokenType) {
            return validateSupportCondition(atRule, chi[0].val);
        }
        if (chi[0].typ == exports.EnumToken.MediaQueryConditionTokenType) {
            // @ts-ignore
            return chi[0].l.typ == exports.EnumToken.IdenTokenType && chi[0].op.typ == exports.EnumToken.ColonTokenType ?
                {
                    valid: SyntaxValidationResult.Valid,
                    context: [],
                    node: null,
                    syntax: 'supports-condition',
                    error: ''
                } : {
                valid: SyntaxValidationResult.Drop,
                context: [],
                node: token,
                syntax: 'supports-condition',
                error: 'expected supports condition-in-parens'
            };
        }
        // @ts-ignore
        return {
            valid: SyntaxValidationResult.Drop,
            context: [],
            node: token,
            syntax: 'supports-condition',
            error: 'expected supports condition-in-parens'
        };
    }
    function validateSupportFeature(token) {
        if (token.typ == exports.EnumToken.MediaFeatureNotTokenType) {
            return validateSupportFeature(token.val);
        }
        if (token.typ == exports.EnumToken.FunctionTokenType) {
            if ('selector' === token.val.toLowerCase()) {
                return {
                    valid: SyntaxValidationResult.Valid,
                    context: [],
                    node: token,
                    syntax: 'selector',
                    error: ''
                };
            }
            if ('font-tech' === token.val.toLowerCase()) {
                const chi = token.chi.filter((t) => ![exports.EnumToken.WhitespaceTokenType, exports.EnumToken.CommentTokenType].includes(t.typ));
                // @ts-ignore
                return chi.length == 1 && chi[0].typ == exports.EnumToken.IdenTokenType && colorFontTech.concat(fontFeaturesTech).includes(chi[0].val.toLowerCase()) ?
                    {
                        valid: SyntaxValidationResult.Valid,
                        context: [],
                        node: token,
                        syntax: 'font-tech',
                        error: ''
                    } :
                    {
                        valid: SyntaxValidationResult.Drop,
                        context: [],
                        node: token,
                        syntax: 'font-tech',
                        error: 'expected font-tech'
                    };
            }
            if ('font-format' === token.val.toLowerCase()) {
                const chi = token.chi.filter((t) => ![exports.EnumToken.WhitespaceTokenType, exports.EnumToken.CommentTokenType].includes(t.typ));
                // @ts-ignore
                return chi.length == 1 && chi[0].typ == exports.EnumToken.IdenTokenType && fontFormat.includes(chi[0].val, toLowerCase()) ?
                    {
                        valid: SyntaxValidationResult.Valid,
                        context: [],
                        node: token,
                        syntax: 'font-format',
                        error: ''
                    } :
                    {
                        valid: SyntaxValidationResult.Drop,
                        context: [],
                        node: token,
                        syntax: 'font-format',
                        error: 'expected font-format'
                    };
            }
        }
        // @ts-ignore
        return {
            valid: SyntaxValidationResult.Drop,
            context: [],
            node: token,
            syntax: '@supports',
            error: 'expected feature'
        };
    }

    function validateAtRuleImport(atRule, options, root) {
        if (!Array.isArray(atRule.tokens) || atRule.tokens.length == 0) {
            // @ts-ignore
            return {
                valid: SyntaxValidationResult.Drop,
                context: [],
                node: null,
                syntax: '@' + atRule.nam,
                error: 'expected @import media query list'
            };
        }
        if ('chi' in atRule) {
            // @ts-ignore
            return {
                valid: SyntaxValidationResult.Drop,
                context: [],
                node: null,
                syntax: '@' + atRule.nam,
                error: 'unexpected at-rule body'
            };
        }
        const tokens = atRule.tokens.filter((t) => ![exports.EnumToken.CommentTokenType].includes(t.typ));
        if (tokens.length == 0) {
            // @ts-ignore
            return {
                valid: SyntaxValidationResult.Drop,
                context: [],
                node: null,
                syntax: '@' + atRule.nam,
                error: 'expected @import media query list'
            };
        }
        if (tokens[0].typ == exports.EnumToken.StringTokenType) {
            tokens.shift();
            // @ts-ignore
            consumeWhitespace(tokens);
        }
        else if (tokens[0].typ == exports.EnumToken.UrlFunctionTokenType) {
            const slice = tokens[0].chi.filter((t) => t.typ != exports.EnumToken.CommentTokenType && t.typ != exports.EnumToken.WhitespaceTokenType);
            if (slice.length != 1 || ![exports.EnumToken.StringTokenType, exports.EnumToken.UrlTokenTokenType].includes(slice[0].typ)) {
                // @ts-ignore
                return {
                    valid: SyntaxValidationResult.Drop,
                    context: [],
                    node: tokens[0],
                    syntax: '@' + atRule.nam,
                    error: 'invalid url()'
                };
            }
            else {
                tokens.shift();
                // @ts-ignore
                if (!consumeWhitespace(tokens)) {
                    // @ts-ignore
                    return {
                        valid: SyntaxValidationResult.Drop,
                        context: [],
                        node: tokens[0],
                        syntax: '@' + atRule.nam,
                        error: 'expecting whitespace'
                    };
                }
            }
            tokens.shift();
            // @ts-ignore
            consumeWhitespace(tokens);
        }
        else {
            // @ts-ignore
            return {
                valid: SyntaxValidationResult.Drop,
                context: [],
                node: tokens[0],
                syntax: '@' + atRule.nam,
                error: 'expecting url() or string'
            };
        }
        if (tokens.length > 0) {
            // @ts-ignore
            if (tokens[0].typ == exports.EnumToken.IdenTokenType) {
                if ('layer' === tokens[0].val.toLowerCase()) {
                    tokens.shift();
                    // @ts-ignore
                    if (!consumeWhitespace(tokens)) {
                        // @ts-ignore
                        return {
                            valid: SyntaxValidationResult.Drop,
                            context: [],
                            node: tokens[0],
                            syntax: '@' + atRule.nam,
                            error: 'expecting whitespace'
                        };
                    }
                }
            }
            // @ts-ignore
            else if (tokens[0].typ == exports.EnumToken.FunctionTokenType) {
                // @ts-ignore
                if ('layer' === tokens[0].val.toLowerCase()) {
                    const result = validateLayerName(tokens[0].chi);
                    if (result.valid == SyntaxValidationResult.Drop) {
                        return result;
                    }
                    tokens.shift();
                    // @ts-ignore
                    consumeWhitespace(tokens);
                }
                // tokens[0]?.val
                // @ts-ignore
                if ('supports' === tokens[0]?.val?.toLowerCase?.()) {
                    const result = validateAtRuleSupportsConditions(atRule, tokens[0].chi);
                    if (result.valid == SyntaxValidationResult.Drop) {
                        return result;
                    }
                    tokens.shift();
                    // @ts-ignore
                    consumeWhitespace(tokens);
                }
            }
        }
        if (tokens.length > 0) {
            return validateAtRuleMediaQueryList(tokens, atRule);
        }
        // @ts-ignore
        return {
            valid: SyntaxValidationResult.Valid,
            context: [],
            node: null,
            syntax: '@' + atRule.nam,
            error: ''
        };
    }

    function validateAtRuleLayer(atRule, options, root) {
        if (!Array.isArray(atRule.chi)) {
            // @ts-ignore
            return {
                valid: SyntaxValidationResult.Drop,
                matches: [],
                node: atRule,
                syntax: '@' + atRule.nam,
                error: 'expected supports body',
                tokens: []
            };
        }
        // media-query-list
        if (!Array.isArray(atRule.tokens) || atRule.tokens.length == 0) {
            // @ts-ignore
            return {
                valid: SyntaxValidationResult.Valid,
                matches: [],
                node: atRule,
                syntax: '@layer',
                error: '',
                tokens: []
            };
        }
        return validateLayerName(atRule.tokens);
    }

    function validateAtRuleFontFeatureValues(atRule, options, root) {
        if (!Array.isArray(atRule.chi)) {
            // @ts-ignore
            return {
                valid: SyntaxValidationResult.Drop,
                matches: [],
                node: atRule,
                syntax: '@' + atRule.nam,
                error: 'expected supports body',
                tokens: []
            };
        }
        if (!Array.isArray(atRule.tokens) || atRule.tokens.length == 0) {
            // @ts-ignore
            return {
                valid: SyntaxValidationResult.Drop,
                matches: [],
                node: null,
                syntax: '@' + atRule.nam,
                error: 'expected at-rule prelude',
                tokens: []
            };
        }
        const result = validateFamilyName(atRule.tokens);
        if (result.valid == SyntaxValidationResult.Drop) {
            return result;
        }
        if (!('chi' in atRule)) {
            // @ts-ignore
            return {
                valid: SyntaxValidationResult.Drop,
                matches: [],
                node: atRule,
                syntax: '@' + atRule.nam,
                error: 'expected at-rule body',
                tokens: []
            };
        }
        // @ts-ignore
        return {
            valid: SyntaxValidationResult.Valid,
            matches: [],
            node: atRule,
            syntax: '@' + atRule.nam,
            error: '',
            tokens: []
        };
    }

    function validateAtRuleNamespace(atRule, options, root) {
        if (!Array.isArray(atRule.tokens) || atRule.tokens.length == 0) {
            // @ts-ignore
            return {
                valid: SyntaxValidationResult.Drop,
                context: [],
                node: atRule,
                syntax: '@namespace',
                error: 'expected at-rule prelude'
            };
        }
        if ('chi' in atRule) {
            // @ts-ignore
            return {
                valid: SyntaxValidationResult.Drop,
                context: [],
                node: atRule,
                syntax: '@namespace',
                error: 'unexpected at-rule body'
            };
        }
        const tokens = atRule.tokens.slice();
        consumeWhitespace(tokens);
        if (tokens[0].typ == exports.EnumToken.IdenTokenType) {
            tokens.shift();
            consumeWhitespace(tokens);
        }
        if (tokens.length == 0) {
            // @ts-ignore
            return {
                valid: SyntaxValidationResult.Drop,
                context: [],
                node: atRule,
                syntax: '@namespace',
                error: 'expected string or url()'
            };
        }
        if (tokens[0].typ != exports.EnumToken.StringTokenType) {
            const result = validateURL(tokens[0]);
            if (result.valid != SyntaxValidationResult.Valid) {
                return result;
            }
            tokens.shift();
            consumeWhitespace(tokens);
        }
        else {
            tokens.shift();
            consumeWhitespace(tokens);
        }
        if (tokens.length > 0) {
            // @ts-ignore
            return {
                valid: SyntaxValidationResult.Drop,
                context: [],
                node: tokens[0],
                syntax: '@namespace',
                error: 'unexpected token'
            };
        }
        // @ts-ignore
        return {
            valid: SyntaxValidationResult.Valid,
            context: [],
            node: atRule,
            syntax: '@namespace',
            error: ''
        };
    }

    function validateAtRuleDocument(atRule, options, root) {
        if (!Array.isArray(atRule.tokens) || atRule.tokens.length == 0) {
            // @ts-ignore
            return {
                valid: SyntaxValidationResult.Drop,
                context: [],
                node: atRule,
                syntax: '@document',
                error: 'expecting at-rule prelude'
            };
        }
        const tokens = atRule.tokens.slice();
        let result = null;
        consumeWhitespace(tokens);
        if (tokens.length == 0) {
            // @ts-ignore
            return {
                valid: SyntaxValidationResult.Drop,
                context: [],
                node: atRule,
                syntax: '@document',
                error: 'expecting at-rule prelude'
            };
        }
        for (const t of splitTokenList(tokens)) {
            if (t.length != 1) {
                return {
                    valid: SyntaxValidationResult.Drop,
                    context: [],
                    node: t[0] ?? atRule,
                    syntax: '@document',
                    error: 'unexpected token'
                };
            }
            // @ts-ignore
            if ((t[0].typ != exports.EnumToken.FunctionTokenType && t[0].typ != exports.EnumToken.UrlFunctionTokenType) || !['url', 'url-prefix', 'domain', 'media-document', 'regexp'].includes(t[0].val?.toLowerCase?.())) {
                return {
                    valid: SyntaxValidationResult.Drop,
                    context: [],
                    node: t[0] ?? atRule,
                    syntax: '@document',
                    error: 'expecting any of url-prefix(), domain(), media-document(), regexp() but found ' + t[0].val
                };
            }
            if (t[0].typ == exports.EnumToken.UrlFunctionTokenType) {
                result = validateURL(t[0]);
                if (result?.valid == SyntaxValidationResult.Drop) {
                    return result;
                }
                continue;
            }
            const children = t[0].chi.slice();
            consumeWhitespace(children);
            if (children.length != 1 || (children[0].typ != exports.EnumToken.StringTokenType && children[0].typ != exports.EnumToken.UrlTokenTokenType)) {
                // @ts-ignore
                return {
                    valid: SyntaxValidationResult.Drop,
                    context: [],
                    node: tokens[0],
                    syntax: '@document',
                    error: 'expecting string argument'
                };
            }
            tokens.shift();
            consumeWhitespace(tokens);
        }
        // @ts-ignore
        return {
            valid: SyntaxValidationResult.Valid,
            context: [],
            node: atRule,
            syntax: '@document',
            error: ''
        };
    }

    function validateAtRuleKeyframes(atRule, options, root) {
        if (!Array.isArray(atRule.chi)) {
            // @ts-ignore
            return {
                valid: SyntaxValidationResult.Drop,
                matches: [],
                node: atRule,
                syntax: '@' + atRule.nam,
                error: 'expected supports body',
                tokens: []
            };
        }
        if (!Array.isArray(atRule.tokens) || atRule.tokens.length == 0) {
            // @ts-ignore
            return {
                valid: SyntaxValidationResult.Drop,
                context: [],
                node: atRule,
                syntax: '@keyframes',
                error: 'expecting at-rule prelude'
            };
        }
        const tokens = atRule.tokens.filter((t) => t.typ != exports.EnumToken.CommentTokenType).slice();
        consumeWhitespace(tokens);
        if (tokens.length == 0 || ![exports.EnumToken.StringTokenType, exports.EnumToken.IdenTokenType].includes(tokens[0].typ)) {
            // @ts-ignore
            return {
                valid: SyntaxValidationResult.Drop,
                context: [],
                node: atRule,
                syntax: '@keyframes',
                error: 'expecting ident or string token'
            };
        }
        tokens.shift();
        consumeWhitespace(tokens);
        if (tokens.length > 0) {
            // @ts-ignore
            return {
                valid: SyntaxValidationResult.Drop,
                context: [],
                node: tokens[0],
                syntax: '@keyframes',
                error: 'unexpected token'
            };
        }
        // @ts-ignore
        return {
            valid: SyntaxValidationResult.Valid,
            context: [],
            node: atRule,
            syntax: '@keyframes',
            error: ''
        };
    }

    function validateAtRuleWhen(atRule, options, root) {
        if (!Array.isArray(atRule.chi)) {
            // @ts-ignore
            return {
                valid: SyntaxValidationResult.Drop,
                matches: [],
                node: atRule,
                syntax: '@' + atRule.nam,
                error: 'expected supports body',
                tokens: []
            };
        }
        const slice = Array.isArray(atRule.tokens) ? atRule.tokens.slice() : [];
        consumeWhitespace(slice);
        if (slice.length == 0) {
            // @ts-ignore
            return {
                valid: SyntaxValidationResult.Valid,
                context: [],
                node: atRule,
                syntax: '@when',
                error: '',
                tokens: []
            };
        }
        const result = validateAtRuleWhenQueryList(atRule.tokens, atRule);
        if (result.valid == SyntaxValidationResult.Drop) {
            return result;
        }
        if (!('chi' in atRule)) {
            // @ts-ignore
            return {
                valid: SyntaxValidationResult.Drop,
                context: [],
                node: atRule,
                syntax: '@when',
                error: 'expected at-rule body',
                tokens: []
            };
        }
        return {
            valid: SyntaxValidationResult.Valid,
            context: [],
            node: atRule,
            syntax: '@when',
            error: ''
        };
    }
    // media() = media( [ <mf-plain> | <mf-boolean> | <mf-range> ] )
    // supports() = supports( <declaration> )
    function validateAtRuleWhenQueryList(tokenList, atRule) {
        const matched = [];
        let result = null;
        for (const split of splitTokenList(tokenList)) {
            const match = [];
            result = null;
            consumeWhitespace(split);
            if (split.length == 0) {
                continue;
            }
            while (split.length > 0) {
                if (split[0].typ != exports.EnumToken.FunctionTokenType || !generalEnclosedFunc.includes(split[0].val)) {
                    result = {
                        valid: SyntaxValidationResult.Drop,
                        context: [],
                        node: split[0] ?? atRule,
                        syntax: '@when',
                        error: 'unexpected token',
                        tokens: []
                    };
                    break;
                }
                const chi = split[0].chi.slice();
                consumeWhitespace(chi);
                if (split[0].val == 'media') {
                    // result = valida
                    if (chi.length != 1 || !(validateMediaFeature(chi[0]) || validateMediaCondition(split[0], atRule))) {
                        result = {
                            valid: SyntaxValidationResult.Drop,
                            context: [],
                            node: split[0] ?? atRule,
                            syntax: 'media( [ <mf-plain> | <mf-boolean> | <mf-range> ] )',
                            error: 'unexpected token'
                        };
                        break;
                    }
                }
                else if (generalEnclosedFunc.includes(split[0].val)) {
                    // result = valida
                    if (!validateSupportCondition(atRule, split[0])) {
                        result = {
                            valid: SyntaxValidationResult.Drop,
                            context: [],
                            node: split[0] ?? atRule,
                            syntax: 'media( [ <mf-plain> | <mf-boolean> | <mf-range> ] )',
                            error: 'unexpected token'
                        };
                        break;
                    }
                }
                if (match.length > 0) {
                    match.push({ typ: exports.EnumToken.WhitespaceTokenType });
                }
                match.push(split.shift());
                consumeWhitespace(split);
                if (split.length == 0) {
                    break;
                }
                if (![exports.EnumToken.MediaFeatureAndTokenType, exports.EnumToken.MediaFeatureOrTokenType].includes(split[0].typ)) {
                    result = {
                        valid: SyntaxValidationResult.Drop,
                        context: [],
                        node: split[0] ?? atRule,
                        syntax: '@when',
                        error: 'expecting and/or media-condition',
                        tokens: []
                    };
                    break;
                }
                if (match.length > 0) {
                    match.push({ typ: exports.EnumToken.WhitespaceTokenType });
                }
                match.push(split.shift());
                consumeWhitespace(split);
                if (split.length == 0) {
                    result = {
                        valid: SyntaxValidationResult.Drop,
                        context: [],
                        node: split[0] ?? atRule,
                        syntax: '@when',
                        error: 'expecting media-condition',
                        tokens: []
                    };
                    break;
                }
            }
            if (result == null && match.length > 0) {
                matched.push(match);
            }
        }
        if (result != null) {
            return result;
        }
        if (matched.length == 0) {
            return {
                valid: SyntaxValidationResult.Drop,
                context: [],
                // @ts-ignore
                node: result?.node ?? atRule,
                syntax: '@when',
                error: 'invalid at-rule body'
            };
        }
        tokenList.length = 0;
        for (const match of matched) {
            if (tokenList.length > 0) {
                tokenList.push({
                    typ: exports.EnumToken.CommaTokenType
                });
            }
            tokenList.push(...match);
        }
        return {
            valid: SyntaxValidationResult.Valid,
            context: [],
            node: atRule,
            syntax: '@when',
            error: ''
        };
    }

    const validateAtRuleElse = validateAtRuleWhen;

    const validateContainerScrollStateFeature = validateContainerSizeFeature;
    function validateAtRuleContainer(atRule, options, root) {
        if (!Array.isArray(atRule.chi)) {
            // @ts-ignore
            return {
                valid: SyntaxValidationResult.Drop,
                matches: [],
                node: atRule,
                syntax: '@' + atRule.nam,
                error: 'expected supports body',
                tokens: []
            };
        }
        // media-query-list
        if (!Array.isArray(atRule.tokens) || atRule.tokens.length == 0) {
            // @ts-ignore
            return {
                valid: SyntaxValidationResult.Drop,
                context: [],
                node: atRule,
                syntax: '@' + atRule.nam,
                error: 'expected supports query list'
            };
        }
        const result = validateAtRuleContainerQueryList(atRule.tokens, atRule);
        if (result.valid == SyntaxValidationResult.Drop) {
            return result;
        }
        if (!('chi' in atRule)) {
            // @ts-ignore
            return {
                valid: SyntaxValidationResult.Drop,
                context: [],
                node: atRule,
                syntax: '@' + atRule.nam,
                error: 'expected at-rule body'
            };
        }
        return {
            valid: SyntaxValidationResult.Valid,
            context: [],
            node: atRule,
            syntax: '@' + atRule.nam,
            error: '',
        };
    }
    function validateAtRuleContainerQueryList(tokens, atRule) {
        if (tokens.length == 0) {
            // @ts-ignore
            return {
                valid: SyntaxValidationResult.Drop,
                context: [],
                node: atRule,
                syntax: '@' + atRule.nam,
                error: 'expected container query list'
            };
        }
        let result = null;
        let tokenType = null;
        for (const queries of splitTokenList(tokens)) {
            consumeWhitespace(queries);
            if (queries.length == 0) {
                return {
                    valid: SyntaxValidationResult.Drop,
                    context: [],
                    node: atRule,
                    syntax: '@' + atRule.nam,
                    error: 'expected container query list'
                };
            }
            result = null;
            const match = [];
            let token = null;
            tokenType = null;
            while (queries.length > 0) {
                if (queries.length == 0) {
                    return {
                        valid: SyntaxValidationResult.Drop,
                        context: [],
                        node: atRule,
                        syntax: '@' + atRule.nam,
                        error: 'expected container query list'
                    };
                }
                if (queries[0].typ == exports.EnumToken.IdenTokenType) {
                    match.push(queries.shift());
                    consumeWhitespace(queries);
                }
                if (queries.length == 0) {
                    break;
                }
                token = queries[0];
                if (token?.typ == exports.EnumToken.MediaFeatureNotTokenType) {
                    token = token.val;
                }
                if (token?.typ != exports.EnumToken.ParensTokenType && (token?.typ != exports.EnumToken.FunctionTokenType || !['scroll-state', 'style'].includes(token.val))) {
                    return {
                        valid: SyntaxValidationResult.Drop,
                        context: [],
                        node: queries[0],
                        syntax: '@' + atRule.nam,
                        error: 'expected container query-in-parens'
                    };
                }
                if (token?.typ == exports.EnumToken.ParensTokenType) {
                    result = validateContainerSizeFeature(token.chi, atRule);
                }
                else if (token.val == 'scroll-state') {
                    result = validateContainerScrollStateFeature(token.chi, atRule);
                }
                else {
                    result = validateContainerStyleFeature(token.chi, atRule);
                }
                if (result.valid == SyntaxValidationResult.Drop) {
                    return result;
                }
                queries.shift();
                consumeWhitespace(queries);
                if (queries.length == 0) {
                    break;
                }
                token = queries[0];
                if (token?.typ != exports.EnumToken.MediaFeatureAndTokenType && token?.typ != exports.EnumToken.MediaFeatureOrTokenType) {
                    return {
                        valid: SyntaxValidationResult.Drop,
                        context: [],
                        node: queries[0],
                        syntax: '@' + atRule.nam,
                        error: 'expecting and/or container query token'
                    };
                }
                if (tokenType == null) {
                    tokenType = token?.typ;
                }
                if (tokenType == null || tokenType != token?.typ) {
                    return {
                        valid: SyntaxValidationResult.Drop,
                        context: [],
                        node: queries[0],
                        syntax: '@' + atRule.nam,
                        error: 'mixing and/or not allowed at the same level'
                    };
                }
                queries.shift();
                consumeWhitespace(queries);
                if (queries.length == 0) {
                    return {
                        valid: SyntaxValidationResult.Drop,
                        context: [],
                        node: queries[0],
                        syntax: '@' + atRule.nam,
                        error: 'expected container query-in-parens'
                    };
                }
            }
        }
        return {
            valid: SyntaxValidationResult.Valid,
            context: [],
            node: atRule,
            syntax: '@' + atRule.nam,
            error: ''
        };
    }
    function validateContainerStyleFeature(tokens, atRule) {
        tokens = tokens.slice();
        consumeWhitespace(tokens);
        if (tokens.length == 1) {
            if (tokens[0].typ == exports.EnumToken.ParensTokenType) {
                return validateContainerStyleFeature(tokens[0].chi, atRule);
            }
            if ([exports.EnumToken.DashedIdenTokenType, exports.EnumToken.IdenTokenType].includes(tokens[0].typ) ||
                (tokens[0].typ == exports.EnumToken.MediaQueryConditionTokenType && tokens[0].op.typ == exports.EnumToken.ColonTokenType)) {
                return {
                    valid: SyntaxValidationResult.Valid,
                    context: [],
                    node: atRule,
                    syntax: '@' + atRule.nam,
                    error: ''
                };
            }
        }
        return {
            valid: SyntaxValidationResult.Drop,
            context: [],
            node: atRule,
            syntax: '@' + atRule.nam,
            error: 'expected container query features'
        };
    }
    function validateContainerSizeFeature(tokens, atRule) {
        tokens = tokens.slice();
        consumeWhitespace(tokens);
        if (tokens.length == 0) {
            return {
                valid: SyntaxValidationResult.Drop,
                context: [],
                node: atRule,
                syntax: '@' + atRule.nam,
                error: 'expected container query features'
            };
        }
        if (tokens.length == 1) {
            const token = tokens[0];
            if (token.typ == exports.EnumToken.MediaFeatureNotTokenType) {
                return validateContainerSizeFeature([token.val], atRule);
            }
            if (token.typ == exports.EnumToken.ParensTokenType) {
                return validateAtRuleContainerQueryStyleInParams(token.chi, atRule);
            }
            if (![exports.EnumToken.DashedIdenTokenType, exports.EnumToken.MediaQueryConditionTokenType].includes(tokens[0].typ)) {
                return {
                    valid: SyntaxValidationResult.Drop,
                    context: [],
                    node: atRule,
                    syntax: '@' + atRule.nam,
                    error: 'expected container query features'
                };
            }
            return {
                valid: SyntaxValidationResult.Valid,
                context: [],
                node: atRule,
                syntax: '@' + atRule.nam,
                error: ''
            };
        }
        return validateAtRuleContainerQueryStyleInParams(tokens, atRule);
    }
    function validateAtRuleContainerQueryStyleInParams(tokens, atRule) {
        tokens = tokens.slice();
        consumeWhitespace(tokens);
        if (tokens.length == 0) {
            return {
                valid: SyntaxValidationResult.Drop,
                context: [],
                node: atRule,
                syntax: '@' + atRule.nam,
                error: 'expected container query features'
            };
        }
        let token = tokens[0];
        let tokenType = null;
        let result = null;
        while (tokens.length > 0) {
            token = tokens[0];
            if (token.typ == exports.EnumToken.MediaFeatureNotTokenType) {
                token = token.val;
            }
            if (tokens[0].typ != exports.EnumToken.ParensTokenType) {
                return {
                    valid: SyntaxValidationResult.Drop,
                    context: [],
                    node: atRule,
                    syntax: '@' + atRule.nam,
                    error: 'expected container query-in-parens'
                };
            }
            const slices = tokens[0].chi.slice();
            consumeWhitespace(slices);
            if (slices.length == 1) {
                if ([exports.EnumToken.MediaFeatureNotTokenType, exports.EnumToken.ParensTokenType].includes(slices[0].typ)) {
                    result = validateAtRuleContainerQueryStyleInParams(slices, atRule);
                    if (result.valid == SyntaxValidationResult.Drop) {
                        return result;
                    }
                }
                else if (![exports.EnumToken.DashedIdenTokenType, exports.EnumToken.MediaQueryConditionTokenType].includes(slices[0].typ)) {
                    result = {
                        valid: SyntaxValidationResult.Drop,
                        context: [],
                        node: atRule,
                        syntax: '@' + atRule.nam,
                        error: 'expected container query features'
                    };
                }
            }
            else {
                result = validateAtRuleContainerQueryStyleInParams(slices, atRule);
                if (result.valid == SyntaxValidationResult.Drop) {
                    return result;
                }
            }
            tokens.shift();
            consumeWhitespace(tokens);
            if (tokens.length == 0) {
                break;
            }
            if (![exports.EnumToken.MediaFeatureAndTokenType, exports.EnumToken.MediaFeatureOrTokenType].includes(tokens[0].typ)) {
                return {
                    valid: SyntaxValidationResult.Drop,
                    context: [],
                    node: tokens[0],
                    syntax: '@' + atRule.nam,
                    error: 'expecting and/or container query token'
                };
            }
            if (tokenType == null) {
                tokenType = tokens[0].typ;
            }
            if (tokenType != tokens[0].typ) {
                return {
                    valid: SyntaxValidationResult.Drop,
                    context: [],
                    node: tokens[0],
                    syntax: '@' + atRule.nam,
                    error: 'mixing and/or not allowed at the same level'
                };
            }
            tokens.shift();
            consumeWhitespace(tokens);
            if (tokens.length == 0) {
                return {
                    valid: SyntaxValidationResult.Drop,
                    context: [],
                    node: tokens[0],
                    syntax: '@' + atRule.nam,
                    error: 'expected container query-in-parens'
                };
            }
        }
        return {
            valid: SyntaxValidationResult.Valid,
            context: [],
            node: atRule,
            syntax: '@' + atRule.nam,
            error: ''
        };
    }

    function validateAtRuleCustomMedia(atRule, options, root) {
        // media-query-list
        if (!Array.isArray(atRule.tokens) || atRule.tokens.length == 0) {
            // @ts-ignore
            return {
                valid: SyntaxValidationResult.Valid,
                context: [],
                node: null,
                syntax: null,
                error: ''
            };
        }
        const queries = atRule.tokens.slice();
        consumeWhitespace(queries);
        if (queries.length == 0 || queries[0].typ != exports.EnumToken.DashedIdenTokenType) {
            return {
                valid: SyntaxValidationResult.Drop,
                context: [],
                node: atRule,
                syntax: '@custom-media',
                error: 'expecting dashed identifier'
            };
        }
        queries.shift();
        const result = validateAtRuleMediaQueryList(queries, atRule);
        if (result.valid == SyntaxValidationResult.Drop) {
            atRule.tokens = [];
            return {
                valid: SyntaxValidationResult.Valid,
                context: [],
                node: atRule,
                syntax: '@custom-media',
                error: ''
            };
        }
        return result;
    }

    function validateAtRule(atRule, options, root) {
        if (atRule.nam == 'charset') {
            const valid = atRule.val.match(/^"[a-zA-Z][a-zA-Z0-9_-]+"$/i) != null;
            return {
                valid: valid ? SyntaxValidationResult.Valid : SyntaxValidationResult.Drop,
                node: atRule,
                syntax: null,
                error: ''
            };
        }
        if (['font-face', 'view-transition', 'starting-style'].includes(atRule.nam)) {
            return {
                valid: SyntaxValidationResult.Valid,
                node: atRule,
                syntax: '@' + atRule.nam,
                error: ''
            };
        }
        if (atRule.nam == 'media') {
            return validateAtRuleMedia(atRule);
        }
        if (atRule.nam == 'import') {
            return validateAtRuleImport(atRule);
        }
        if (atRule.nam == 'supports') {
            return validateAtRuleSupports(atRule);
        }
        if (atRule.nam == 'counter-style') {
            return validateAtRuleCounterStyle(atRule);
        }
        if (atRule.nam == 'layer') {
            return validateAtRuleLayer(atRule);
        }
        if (atRule.nam == 'font-feature-values') {
            return validateAtRuleFontFeatureValues(atRule);
        }
        if (atRule.nam == 'namespace') {
            return validateAtRuleNamespace(atRule);
        }
        if (atRule.nam == 'when') {
            return validateAtRuleWhen(atRule);
        }
        if (atRule.nam == 'else') {
            return validateAtRuleElse(atRule);
        }
        if (atRule.nam == 'container') {
            return validateAtRuleContainer(atRule);
        }
        if (atRule.nam == 'document') {
            return validateAtRuleDocument(atRule);
        }
        if (atRule.nam == 'custom-media') {
            return validateAtRuleCustomMedia(atRule);
        }
        if (['position-try', 'property', 'font-palette-values'].includes(atRule.nam)) {
            if (!Array.isArray(atRule.tokens) || atRule.tokens.length == 0) {
                return {
                    valid: SyntaxValidationResult.Drop,
                    node: atRule,
                    syntax: '@' + atRule.nam,
                    error: 'expected prelude'
                };
            }
            if (!('chi' in atRule)) {
                return {
                    valid: SyntaxValidationResult.Drop,
                    node: atRule,
                    syntax: '@' + atRule.nam,
                    error: 'expected body'
                };
            }
            const chi = atRule.tokens.filter((t) => t.typ != exports.EnumToken.WhitespaceTokenType && t.typ != exports.EnumToken.CommentTokenType);
            if (chi.length != 1) {
                return {
                    valid: SyntaxValidationResult.Drop,
                    node: atRule,
                    syntax: '@' + atRule.nam,
                    error: 'expected ' + (atRule.nam == 'property' ? 'custom-property-name' : 'dashed-ident')
                };
            }
            if (chi[0].typ != exports.EnumToken.DashedIdenTokenType) {
                // @ts-ignore
                return {
                    valid: SyntaxValidationResult.Drop,
                    node: atRule,
                    syntax: '@' + atRule.nam,
                    error: 'expected ' + (atRule.nam == 'property' ? 'custom-property-name' : 'dashed-ident')
                };
            }
            // @ts-ignore
            return {
                valid: SyntaxValidationResult.Valid,
                node: atRule,
                syntax: '@' + atRule.nam,
                error: ''
            };
        }
        // scope
        if (atRule.nam == 'page') {
            return validateAtRulePage(atRule);
        }
        if (['top-left-corner', 'top-left', 'top-center', 'top-right', 'top-right-corner', 'bottom-left-corner', 'bottom-left', 'bottom-center', 'bottom-right', 'bottom-right-corner', 'left-top', 'left-middle', 'left-bottom', 'right-top', 'right-middle', 'right-bottom'].includes(atRule.nam)) {
            if (!(root == null || (root.typ == exports.EnumToken.AtRuleNodeType && root.nam == 'page'))) {
                // @ts-ignore
                return {
                    valid: SyntaxValidationResult.Drop,
                    node: atRule,
                    syntax: '@page',
                    error: 'not allowed here'
                };
            }
            return validateAtRulePageMarginBox(atRule);
        }
        // handle keyframe as special case
        // check if the node exists
        const config = getSyntaxConfig();
        let name = '@' + atRule.nam;
        if (!(name in config.atRules)) {
            if (name.charAt(1) == '-') {
                name = name.replace(/@-[a-zA-Z]+-([a-zA-Z][a-zA-Z0-9_-]*)/, '@$1');
            }
        }
        if (!(name in config.atRules)) {
            if (options.lenient) {
                return {
                    valid: SyntaxValidationResult.Lenient,
                    node: atRule,
                    syntax: null,
                    error: ''
                };
            }
            return {
                valid: SyntaxValidationResult.Drop,
                node: atRule,
                syntax: null,
                error: 'unknown at-rule'
            };
        }
        const syntax = getParsedSyntax("atRules" /* ValidationSyntaxGroupEnum.AtRules */, name)?.[0];
        if ('chi' in syntax && !('chi' in atRule)) {
            return {
                valid: SyntaxValidationResult.Drop,
                node: atRule,
                syntax,
                error: 'missing at-rule body'
            };
        }
        // if ('prelude' in syntax) {
        //
        //     return validateSyntax(syntax.prelude as ValidationToken[], atRule.tokens as Token[], root, options);
        // }
        return {
            valid: SyntaxValidationResult.Valid,
            node: null,
            syntax,
            error: ''
        };
    }

    // Alphabet: a-z, A-Z, 0-9, _, -
    const LOWER = "abcdefghijklmnopqrstuvwxyz";
    const DIGITS = "0123456789";
    const FULL_ALPHABET = (LOWER + DIGITS).split(""); // 64 chars
    const FIRST_ALPHABET = (LOWER).split(""); // 54 chars (no digits)
    /**
     * supported hash algorithms
     */
    const hashAlgorithms = ['hex', 'base64', 'base64url', 'sha1', 'sha256', 'sha384', 'sha512'];
    // simple deterministic hash → number
    function hashCode(str) {
        let hash = 0;
        let l = str.length;
        let i = 0;
        while (i < l) {
            hash = (hash * 31 + str.charCodeAt(i++)) >>> 0;
        }
        return hash;
    }
    /**
     * generate a hash id
     * @param input
     * @param length
     */
    function hashId(input, length = 6) {
        let n = hashCode(input);
        const chars = [];
        // First character: must not be a digit
        chars.push(FIRST_ALPHABET[n % FIRST_ALPHABET.length]);
        // Remaining characters
        for (let i = 1; i < length; i++) {
            n = (n + chars.length + i) % FULL_ALPHABET.length;
            chars.push(FULL_ALPHABET[n]);
        }
        return chars.join("");
    }
    /**
     * convert input to hex
     * @param input
     */
    function toHex(input) {
        let result = '';
        if (input instanceof ArrayBuffer || ArrayBuffer.isView(input)) {
            for (const byte of Array.from(new Uint8Array(input))) {
                result += byte.toString(16).padStart(2, '0');
            }
        }
        else {
            for (const char of String(input)) {
                result += char.charCodeAt(0).toString(16).padStart(2, '0');
            }
        }
        return result;
    }
    /**
     * generate a hash
     * @param input
     * @param length
     * @param algo
     */
    async function hash(input, length = 6, algo) {
        let result;
        if (algo != null) {
            switch (algo) {
                case 'hex':
                    return toHex(input).slice(0, length);
                case 'base64':
                case 'base64url':
                    result = btoa(input);
                    if (algo == 'base64url') {
                        result = result.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
                    }
                    return result.slice(0, length);
                case 'sha1':
                case 'sha256':
                case 'sha384':
                case 'sha512':
                    return toHex(await crypto.subtle.digest(algo.replace('sha', 'SHA-'), new TextEncoder().encode(input))).slice(0, length);
                default:
                    throw new Error(`Unsupported hash algorithm: ${algo}`);
            }
        }
        return hashId(input, length);
    }

    const urlTokenMatcher = /^(["']?)[a-zA-Z0-9_/.-][a-zA-Z0-9_/:.#?-]+(\1)$/;
    const trimWhiteSpace = [exports.EnumToken.CommentTokenType, exports.EnumToken.GtTokenType, exports.EnumToken.GteTokenType, exports.EnumToken.LtTokenType, exports.EnumToken.LteTokenType, exports.EnumToken.ColumnCombinatorTokenType];
    const BadTokensTypes = [
        exports.EnumToken.BadCommentTokenType,
        exports.EnumToken.BadCdoTokenType,
        exports.EnumToken.BadUrlTokenType,
        exports.EnumToken.BadStringTokenType
    ];
    const enumTokenHints = new Set([
        exports.EnumToken.WhitespaceTokenType, exports.EnumToken.SemiColonTokenType, exports.EnumToken.ColonTokenType, exports.EnumToken.BlockStartTokenType,
        exports.EnumToken.BlockStartTokenType, exports.EnumToken.AttrStartTokenType, exports.EnumToken.AttrEndTokenType, exports.EnumToken.StartParensTokenType, exports.EnumToken.EndParensTokenType,
        exports.EnumToken.CommaTokenType, exports.EnumToken.GtTokenType, exports.EnumToken.LtTokenType, exports.EnumToken.GteTokenType, exports.EnumToken.LteTokenType, exports.EnumToken.CommaTokenType,
        exports.EnumToken.StartMatchTokenType, exports.EnumToken.EndMatchTokenType, exports.EnumToken.IncludeMatchTokenType, exports.EnumToken.DashMatchTokenType, exports.EnumToken.ContainMatchTokenType,
        exports.EnumToken.EOFTokenType
    ]);
    function reject(reason) {
        throw new Error(reason ?? 'Parsing aborted');
    }
    function normalizeVisitorKeyName(keyName) {
        return keyName.replace(/-([a-z])/g, (all, one) => one.toUpperCase());
    }
    function replaceToken(parent, value, replacement) {
        for (const node of (Array.isArray(replacement) ? replacement : [replacement])) {
            if ('parent' in value && value.parent != node.parent) {
                Object.defineProperty(node, 'parent', {
                    ...definedPropertySettings,
                    value: value.parent
                });
            }
        }
        if (parent.typ == exports.EnumToken.BinaryExpressionTokenType) {
            if (parent.l == value) {
                parent.l = replacement;
            }
            else {
                parent.r = replacement;
            }
        }
        else {
            const target = 'val' in parent && Array.isArray(parent.val) ? parent.val : parent.chi;
            // @ts-ignore
            const index = target.indexOf(value);
            if (index == -1) {
                return;
            }
            target.splice(index, 1, ...(Array.isArray(replacement) ? replacement : [replacement]));
        }
    }
    function getKeyName(key, how) {
        switch (how) {
            case exports.ModuleCaseTransformEnum.CamelCase:
            case exports.ModuleCaseTransformEnum.CamelCaseOnly:
                return camelize(key);
            case exports.ModuleCaseTransformEnum.DashCase:
            case exports.ModuleCaseTransformEnum.DashCaseOnly:
                return dasherize(key);
        }
        return key;
    }
    async function generateScopedName(localName, filePath, pattern, hashLength = 5) {
        if (localName.startsWith('--')) {
            localName = localName.slice(2);
        }
        const matches = /.*?(([^/]+)\/)?([^/\\]*?)(\.([^?]+))?([?].*)?$/.exec(filePath);
        const folder = matches?.[2]?.replace?.(/[^A-Za-z0-9_-]/g, "_") ?? '';
        const fileBase = matches?.[3] ?? '';
        const ext = matches?.[5] ?? '';
        const path = filePath.replace(/[^A-Za-z0-9_-]/g, "_");
        // sanitize localName for safe char set (replace spaces/illegal chars)
        const safeLocal = localName.replace(/[^A-Za-z0-9_-]/g, "_");
        const hashString = `${localName}::${filePath}`;
        let result = '';
        let inParens = 0;
        let key = '';
        let position = 0;
        // Compose final scoped name. Ensure the entire class doesn't start with digit:
        for (const char of pattern) {
            position += char.length;
            if (char == '[') {
                inParens++;
                if (inParens != 1) {
                    throw new Error(`Unexpected character: '${char}:${position - 1}'`);
                }
                continue;
            }
            if (char == ']') {
                inParens--;
                if (inParens != 0) {
                    throw new Error(`Unexpected character: '${char}:${position - 1}'`);
                }
                let hashAlgo = null;
                let length = null;
                if (key.includes(':')) {
                    const parts = key.split(':');
                    if (parts.length == 2) {
                        // @ts-ignore
                        [key, length] = parts;
                        // @ts-ignore
                        if (key == 'hash' && hashAlgorithms.includes(length)) {
                            // @ts-ignore
                            hashAlgo = length;
                            length = null;
                        }
                    }
                    if (parts.length == 3) {
                        // @ts-ignore
                        [key, hashAlgo, length] = parts;
                    }
                    if (length != null && !Number.isInteger(+length)) {
                        throw new Error(`Unsupported hash length: '${length}'. expecting format [hash:length] or [hash:hash-algo:length]`);
                    }
                }
                switch (key) {
                    case 'hash':
                        result += await hash(hashString, length ?? hashLength, hashAlgo);
                        break;
                    case 'name':
                        result += length != null ? fileBase.slice(0, +length) : fileBase;
                        break;
                    case 'local':
                        result += length != null ? safeLocal.slice(0, +length) : localName;
                        break;
                    case 'ext':
                        result += length != null ? ext.slice(0, +length) : ext;
                        break;
                    case 'path':
                        result += length != null ? path.slice(0, +length) : path;
                        break;
                    case 'folder':
                        result += length != null ? folder.slice(0, +length) : folder;
                        break;
                    default:
                        throw new Error(`Unsupported key: '${key}'`);
                }
                key = '';
                continue;
            }
            if (inParens > 0) {
                key += char;
            }
            else {
                result += char;
            }
        }
        // if leading char is digit, prefix underscore (very rare)
        return (/^[0-9]/.test(result) ? '_' : '') + result;
    }
    /**
     * parse css string
     * @param iter
     * @param options
     *
     * @private
     */
    async function doParse(iter, options = {}) {
        if (options.signal != null) {
            options.signal.addEventListener('abort', reject);
        }
        options = {
            src: '',
            sourcemap: false,
            minify: true,
            pass: 1,
            parseColor: true,
            nestingRules: true,
            resolveImport: false,
            resolveUrls: false,
            removeCharset: true,
            removeEmpty: true,
            removeDuplicateDeclarations: true,
            computeTransform: true,
            computeShorthand: true,
            computeCalcExpression: true,
            inlineCssVariables: false,
            setParent: true,
            removePrefix: false,
            validation: exports.ValidationLevel.Default,
            lenient: true,
            ...options
        };
        if (typeof options.validation == 'boolean') {
            options.validation = options.validation ? exports.ValidationLevel.All : exports.ValidationLevel.None;
        }
        if (options.module) {
            options.expandNestingRules = true;
        }
        if (options.expandNestingRules) {
            options.nestingRules = false;
        }
        if (options.resolveImport) {
            options.resolveUrls = true;
        }
        const startTime = performance.now();
        const errors = [];
        const src = options.src;
        const stack = [];
        const stats = {
            src: options.src ?? '',
            bytesIn: 0,
            nodesCount: 0,
            tokensCount: 0,
            importedBytesIn: 0,
            parse: `0ms`,
            minify: `0ms`,
            total: `0ms`,
            imports: []
        };
        let ast = {
            typ: exports.EnumToken.StyleSheetNodeType,
            chi: []
        };
        let tokens = [];
        let map = new Map;
        let context = ast;
        if (options.sourcemap) {
            ast.loc = {
                sta: {
                    ind: 0,
                    lin: 1,
                    col: 1
                },
                end: {
                    ind: 0,
                    lin: 1,
                    col: 1
                },
                src: ''
            };
        }
        let valuesHandlers;
        let preValuesHandlers;
        let postValuesHandlers;
        let preVisitorsHandlersMap;
        let visitorsHandlersMap;
        let postVisitorsHandlersMap;
        const rawTokens = [];
        const imports = [];
        let item;
        let node;
        // @ts-ignore ignore error
        let isAsync = typeof iter[Symbol.asyncIterator] === 'function';
        if (options.visitor != null) {
            valuesHandlers = new Map;
            preValuesHandlers = new Map;
            postValuesHandlers = new Map;
            preVisitorsHandlersMap = new Map;
            visitorsHandlersMap = new Map;
            postVisitorsHandlersMap = new Map;
            const visitors = Object.entries(options.visitor);
            let key;
            let value;
            let i;
            for (i = 0; i < visitors.length; i++) {
                key = visitors[i][0];
                value = visitors[i][1];
                if (Number.isInteger(+key)) {
                    visitors.splice(i + 1, 0, ...Object.entries(value));
                    continue;
                }
                if (Array.isArray(value)) {
                    // @ts-ignore
                    visitors.splice(i + 1, 0, ...value.map((item) => [key, item]));
                    continue;
                }
                if (key in exports.EnumToken) {
                    if (typeof value == 'function') {
                        if (!valuesHandlers.has(exports.EnumToken[key])) {
                            valuesHandlers.set(exports.EnumToken[key], []);
                        }
                        valuesHandlers.get(exports.EnumToken[key]).push(value);
                    }
                    else if (typeof value == 'object' && 'type' in value && 'handler' in value && value.type in exports.WalkerEvent) {
                        if (value.type == exports.WalkerEvent.Enter) {
                            if (!preValuesHandlers.has(exports.EnumToken[key])) {
                                preValuesHandlers.set(exports.EnumToken[key], []);
                            }
                            preValuesHandlers.get(exports.EnumToken[key]).push(value.handler);
                        }
                        else if (value.type == exports.WalkerEvent.Leave) {
                            if (!postValuesHandlers.has(exports.EnumToken[key])) {
                                postValuesHandlers.set(exports.EnumToken[key], []);
                            }
                            postValuesHandlers.get(exports.EnumToken[key]).push(value.handler);
                        }
                    }
                    else {
                        errors.push({ action: 'ignore', message: `doParse: visitor.${key} is not a valid key name` });
                    }
                }
                else if (['Declaration', 'Rule', 'AtRule', 'KeyframesRule', 'KeyframesAtRule'].includes(key)) {
                    if (typeof value == 'function') {
                        if (!visitorsHandlersMap.has(key)) {
                            visitorsHandlersMap.set(key, []);
                        }
                        visitorsHandlersMap.get(key).push(value);
                    }
                    else if (typeof value == 'object') {
                        if ('type' in value && 'handler' in value && value.type in exports.WalkerEvent) {
                            if (value.type == exports.WalkerEvent.Enter) {
                                if (!preVisitorsHandlersMap.has(key)) {
                                    preVisitorsHandlersMap.set(key, []);
                                }
                                preVisitorsHandlersMap.get(key).push(value.handler);
                            }
                            else if (value.type == exports.WalkerEvent.Leave) {
                                if (!postVisitorsHandlersMap.has(key)) {
                                    postVisitorsHandlersMap.set(key, []);
                                }
                                postVisitorsHandlersMap.get(key).push(value.handler);
                            }
                        }
                        else {
                            if (!visitorsHandlersMap.has(key)) {
                                visitorsHandlersMap.set(key, []);
                            }
                            visitorsHandlersMap.get(key).push(value);
                        }
                    }
                    else {
                        errors.push({ action: 'ignore', message: `doParse: visitor.${key} is not a valid key name` });
                    }
                }
                else {
                    errors.push({ action: 'ignore', message: `doParse: visitor.${key} is not a valid key name` });
                }
            }
        }
        while (item = isAsync ? (await iter.next()).value : iter.next().value) {
            stats.bytesIn = item.bytesIn;
            stats.tokensCount++;
            rawTokens.push(item);
            if (item.hint != null && BadTokensTypes.includes(item.hint)) {
                const node = getTokenType(item.token, item.hint);
                errors.push({
                    action: 'drop',
                    message: 'Bad token',
                    syntax: null,
                    node,
                    location: {
                        src,
                        sta: item.sta,
                        end: item.end
                    }
                });
                // bad token
                continue;
            }
            if (item.hint != exports.EnumToken.EOFTokenType) {
                tokens.push(item);
            }
            else if (ast.loc != null) {
                for (let i = stack.length - 1; i >= 0; i--) {
                    stack[i].loc.end = { ...item.end };
                }
                ast.loc.end = item.end;
            }
            if (item.token == ';' || item.token == '{') {
                node = parseNode(tokens, context, options, errors, src, map, rawTokens, stats);
                rawTokens.length = 0;
                if (node != null) {
                    if ('chi' in node) {
                        stack.push(node);
                        context = node;
                    }
                    else if (node.typ == exports.EnumToken.AtRuleNodeType && node.nam == 'import') {
                        imports.push(node);
                    }
                }
                else if (item.token == '{') {
                    let inBlock = 1;
                    tokens = [item];
                    do {
                        item = isAsync ? (await iter.next()).value : iter.next().value;
                        if (item == null) {
                            break;
                        }
                        tokens.push(item);
                        if (item.token == '{') {
                            inBlock++;
                        }
                        else if (item.token == '}') {
                            inBlock--;
                        }
                    } while (inBlock != 0);
                    if (tokens.length > 0) {
                        errors.push({
                            action: 'drop',
                            message: 'invalid block',
                            rawTokens: tokens.slice(),
                            location: {
                                src,
                                sta: tokens[0].sta,
                                end: tokens[tokens.length - 1].end
                            }
                        });
                    }
                }
                tokens = [];
                map = new Map;
            }
            else if (item.token == '}') {
                parseNode(tokens, context, options, errors, src, map, rawTokens, stats);
                rawTokens.length = 0;
                if (context.loc != null) {
                    context.loc.end = item.end;
                }
                const previousNode = stack.pop();
                context = (stack[stack.length - 1] ?? ast);
                if (previousNode != null && previousNode.typ == exports.EnumToken.InvalidRuleTokenType) {
                    const index = context.chi.findIndex(node => node == previousNode);
                    if (index > -1) {
                        context.chi.splice(index, 1);
                    }
                }
                if (options.removeEmpty && previousNode != null && previousNode.chi.length == 0 && context.chi[context.chi.length - 1] == previousNode) {
                    context.chi.pop();
                }
                tokens = [];
                map = new Map;
            }
        }
        if (tokens.length > 0) {
            node = parseNode(tokens, context, options, errors, src, map, rawTokens, stats);
            rawTokens.length = 0;
            if (node != null) {
                if (node.typ == exports.EnumToken.AtRuleNodeType && node.nam == 'import') {
                    imports.push(node);
                }
                else if ('chi' in node && node.typ != exports.EnumToken.InvalidRuleTokenType) {
                    stack.push(node);
                    context = node;
                }
            }
            if (context != null && context.typ == exports.EnumToken.InvalidRuleTokenType) {
                // @ts-ignore ignore error
                const index = context.chi.findIndex((node) => node === context);
                if (index > -1) {
                    context.chi.splice(index, 1);
                }
            }
        }
        if (imports.length > 0 && options.resolveImport) {
            await Promise.all(imports.map(async (node) => {
                const token = node.tokens[0];
                const url = token.typ == exports.EnumToken.StringTokenType ? token.val.slice(1, -1) : token.val;
                try {
                    const result = options.load(url, options.src);
                    const stream = result instanceof Promise || Object.getPrototypeOf(result).constructor.name == 'AsyncFunction' ? await result : result;
                    const root = await doParse(stream instanceof ReadableStream ? tokenizeStream(stream) : tokenize$1({
                        stream,
                        buffer: '',
                        position: { ind: 0, lin: 1, col: 1 },
                        currentPosition: { ind: -1, lin: 1, col: 0 }
                    }), Object.assign({}, options, {
                        minify: false,
                        setParent: false,
                        src: options.resolve(url, options.src).absolute
                    }));
                    stats.importedBytesIn += root.stats.bytesIn;
                    stats.imports.push(root.stats);
                    node.parent.chi.splice(node.parent.chi.indexOf(node), 1, ...root.ast.chi);
                    if (root.errors.length > 0) {
                        errors.push(...root.errors);
                    }
                }
                catch (error) {
                    // @ts-ignore ignore error
                    errors.push({ action: 'ignore', message: 'doParse: ' + error.message, error });
                }
            }));
        }
        while (stack.length > 0 && context != ast) {
            const previousNode = stack.pop();
            context = (stack[stack.length - 1] ?? ast);
            // remove empty nodes
            if (options.removeEmpty && previousNode != null && previousNode.chi.length == 0 && context.chi[context.chi.length - 1] == previousNode) {
                context.chi.pop();
                continue;
            }
            break;
        }
        const endParseTime = performance.now();
        if (options.expandNestingRules) {
            ast = expand(ast);
        }
        let replacement;
        let callable;
        if (options.visitor != null) {
            for (const result of walk(ast)) {
                if (valuesHandlers.size > 0 || preVisitorsHandlersMap.size > 0 || visitorsHandlersMap.size > 0 || postVisitorsHandlersMap.size > 0) {
                    if ((result.node.typ == exports.EnumToken.DeclarationNodeType &&
                        (preVisitorsHandlersMap.has('Declaration') || visitorsHandlersMap.has('Declaration') || postVisitorsHandlersMap.has('Declaration'))) ||
                        (result.node.typ == exports.EnumToken.AtRuleNodeType && (preVisitorsHandlersMap.has('AtRule') || visitorsHandlersMap.has('AtRule') || postVisitorsHandlersMap.has('AtRule'))) ||
                        (result.node.typ == exports.EnumToken.KeyframesAtRuleNodeType && (preVisitorsHandlersMap.has('KeyframesAtRule') || visitorsHandlersMap.has('KeyframesAtRule') || postVisitorsHandlersMap.has('KeyframesAtRule')))) {
                        const handlers = [];
                        const key = result.node.typ == exports.EnumToken.DeclarationNodeType ? 'Declaration' : result.node.typ == exports.EnumToken.AtRuleNodeType ? 'AtRule' : 'KeyframesAtRule';
                        if (preVisitorsHandlersMap.has(key)) {
                            // @ts-ignore
                            handlers.push(...preVisitorsHandlersMap.get(key));
                        }
                        if (visitorsHandlersMap.has(key)) {
                            // @ts-ignore
                            handlers.push(...visitorsHandlersMap.get(key));
                        }
                        if (postVisitorsHandlersMap.has(key)) {
                            // @ts-ignore
                            handlers.push(...postVisitorsHandlersMap.get(key));
                        }
                        let node = result.node;
                        for (const handler of handlers) {
                            callable = typeof handler == 'function' ? handler : handler[normalizeVisitorKeyName(node.typ == exports.EnumToken.DeclarationNodeType || node.typ == exports.EnumToken.AtRuleNodeType ? node.nam : node.val)];
                            if (callable == null) {
                                continue;
                            }
                            replacement = callable(node, result.parent);
                            if (replacement == null) {
                                continue;
                            }
                            isAsync = replacement instanceof Promise || Object.getPrototypeOf(replacement).constructor.name == 'AsyncFunction';
                            if (replacement) {
                                replacement = await replacement;
                            }
                            if (replacement == null || replacement == node) {
                                continue;
                            }
                            // @ts-ignore
                            node = replacement;
                            //
                            if (Array.isArray(node)) {
                                break;
                            }
                        }
                        if (node != result.node) {
                            // @ts-ignore
                            replaceToken(result.parent, result.node, node);
                        }
                    }
                    else if ((result.node.typ == exports.EnumToken.RuleNodeType && (preVisitorsHandlersMap.has('Rule') || visitorsHandlersMap.has('Rule') || postVisitorsHandlersMap.has('Rule'))) ||
                        (result.node.typ == exports.EnumToken.KeyFramesRuleNodeType && (preVisitorsHandlersMap.has('KeyframesRule') || visitorsHandlersMap.has('KeyframesRule') || postVisitorsHandlersMap.has('KeyframesRule')))) {
                        const handlers = [];
                        const key = result.node.typ == exports.EnumToken.RuleNodeType ? 'Rule' : 'KeyframesRule';
                        if (preVisitorsHandlersMap.has(key)) {
                            handlers.push(...preVisitorsHandlersMap.get(key));
                        }
                        if (visitorsHandlersMap.has(key)) {
                            handlers.push(...visitorsHandlersMap.get(key));
                        }
                        if (postVisitorsHandlersMap.has(key)) {
                            handlers.push(...postVisitorsHandlersMap.get(key));
                        }
                        let node = result.node;
                        for (const callable of handlers) {
                            replacement = callable(node, result.parent);
                            if (replacement == null) {
                                continue;
                            }
                            isAsync = replacement instanceof Promise || Object.getPrototypeOf(replacement).constructor.name == 'AsyncFunction';
                            if (replacement) {
                                replacement = await replacement;
                            }
                            if (replacement == null || replacement == node) {
                                continue;
                            }
                            // @ts-ignore
                            node = replacement;
                            //
                            if (Array.isArray(node)) {
                                break;
                            }
                        }
                        // @ts-ignore
                        if (node != result.node) {
                            // @ts-ignore
                            replaceToken(result.parent, result.node, node);
                        }
                    }
                    else if (valuesHandlers.size > 0) {
                        let node = null;
                        node = result.node;
                        if (valuesHandlers.has(node.typ)) {
                            for (const valueHandler of valuesHandlers.get(node.typ)) {
                                callable = valueHandler;
                                replacement = callable(node, result.parent);
                                if (replacement == null) {
                                    continue;
                                }
                                isAsync = replacement instanceof Promise || Object.getPrototypeOf(replacement).constructor.name == 'AsyncFunction';
                                if (isAsync) {
                                    replacement = await replacement;
                                }
                                if (replacement != null && replacement != node) {
                                    node = replacement;
                                }
                            }
                        }
                        if (node != result.node) {
                            // @ts-ignore
                            replaceToken(result.parent, value, node);
                        }
                        const tokens = 'tokens' in result.node ? result.node.tokens : [];
                        if ('val' in result.node && Array.isArray(result.node.val)) {
                            tokens.push(...result.node.val);
                        }
                        if (tokens.length == 0) {
                            continue;
                        }
                        for (const { value, parent, root } of walkValues(tokens, result.node)) {
                            node = value;
                            if (valuesHandlers.has(node.typ)) {
                                for (const valueHandler of valuesHandlers.get(node.typ)) {
                                    callable = valueHandler;
                                    let result = callable(node, parent, root);
                                    if (result == null) {
                                        continue;
                                    }
                                    isAsync = result instanceof Promise || Object.getPrototypeOf(result).constructor.name == 'AsyncFunction';
                                    if (isAsync) {
                                        result = await result;
                                    }
                                    if (result != null && result != node) {
                                        node = result;
                                    }
                                    //
                                    if (Array.isArray(node)) {
                                        break;
                                    }
                                }
                            }
                            if (node != value) {
                                // @ts-ignore
                                replaceToken(parent, value, node);
                            }
                        }
                    }
                }
            }
        }
        if (options.minify) {
            if (ast.chi.length > 0) {
                let passes = options.pass ?? 1;
                while (passes--) {
                    minify(ast, options, true, errors, false);
                }
            }
        }
        stats.bytesIn += stats.importedBytesIn;
        let endTime = performance.now();
        const result = {
            ast,
            errors,
            stats: {
                ...stats,
                parse: `${(endParseTime - startTime).toFixed(2)}ms`,
                minify: `${(endTime - endParseTime).toFixed(2)}ms`,
                total: `${(endTime - startTime).toFixed(2)}ms`
            }
        };
        if (options.signal != null) {
            options.signal.removeEventListener('abort', reject);
        }
        if (options.module) {
            const moduleSettings = {
                hashLength: 5,
                filePath: '',
                scoped: exports.ModuleScopeEnumOptions.Local,
                naming: exports.ModuleCaseTransformEnum.Ignore,
                pattern: '',
                generateScopedName,
                ...(typeof options.module != 'object' ? {} : options.module)
            };
            const parseModuleTime = performance.now();
            const namesMapping = {};
            const global = new Set;
            const processed = new Set;
            const pattern = typeof options.module == 'boolean' ? null : moduleSettings.pattern;
            const importMapping = {};
            let mapping = {};
            let revMapping = {};
            let filePath = typeof options.module == 'boolean' ? options.src : (moduleSettings.filePath ?? options.src);
            if (filePath.startsWith(options.cwd + '/')) {
                filePath = filePath.slice(options.cwd.length + 1);
            }
            if (typeof options.module == 'number') {
                if (options.module & exports.ModuleCaseTransformEnum.CamelCase) {
                    moduleSettings.naming = exports.ModuleCaseTransformEnum.CamelCase;
                }
                else if (options.module & exports.ModuleCaseTransformEnum.CamelCaseOnly) {
                    moduleSettings.naming = exports.ModuleCaseTransformEnum.CamelCaseOnly;
                }
                else if (options.module & exports.ModuleCaseTransformEnum.DashCase) {
                    moduleSettings.naming = exports.ModuleCaseTransformEnum.DashCase;
                }
                else if (options.module & exports.ModuleCaseTransformEnum.DashCaseOnly) {
                    moduleSettings.naming = exports.ModuleCaseTransformEnum.DashCaseOnly;
                }
                if (options.module & exports.ModuleScopeEnumOptions.Global) {
                    moduleSettings.scoped = exports.ModuleScopeEnumOptions.Global;
                }
                if (options.module & exports.ModuleScopeEnumOptions.Pure) {
                    // @ts-ignore
                    moduleSettings.scoped |= exports.ModuleScopeEnumOptions.Pure;
                }
                if (options.module & exports.ModuleScopeEnumOptions.ICSS) {
                    // @ts-ignore
                    moduleSettings.scoped |= exports.ModuleScopeEnumOptions.ICSS;
                }
            }
            if (typeof moduleSettings.scoped == 'boolean') {
                moduleSettings.scoped = moduleSettings.scoped ? exports.ModuleScopeEnumOptions.Local : exports.ModuleScopeEnumOptions.Global;
            }
            moduleSettings.filePath = filePath;
            moduleSettings.pattern = pattern != null && pattern !== '' ? pattern : (filePath === '' ? `[hash]_[local]` : `[name]_[hash]_[local]`);
            for (const { node } of walk(ast)) {
                if (node.typ == exports.EnumToken.DeclarationNodeType) {
                    if (node.nam.startsWith('--')) {
                        if (!(node.nam in namesMapping)) {
                            let result = (moduleSettings.scoped & exports.ModuleScopeEnumOptions.Global) ? node.nam : moduleSettings.generateScopedName(node.nam, moduleSettings.filePath, moduleSettings.pattern, moduleSettings.hashLength);
                            let value = result instanceof Promise ? await result : result;
                            mapping[node.nam] = '--' + (moduleSettings.naming & exports.ModuleCaseTransformEnum.DashCaseOnly || moduleSettings.naming & exports.ModuleCaseTransformEnum.CamelCaseOnly ? getKeyName(value, moduleSettings.naming) : value);
                            revMapping[node.nam] = node.nam;
                        }
                        node.nam = mapping[node.nam];
                    }
                    if ('composes' == node.nam.toLowerCase()) {
                        const tokens = [];
                        let isValid = true;
                        for (const token of node.val) {
                            if (token.typ == exports.EnumToken.ComposesSelectorNodeType) {
                                if (!(token.r == null || token.r.typ == exports.EnumToken.StringTokenType || token.r.typ == exports.EnumToken.IdenTokenType)) {
                                    errors.push({
                                        action: 'drop',
                                        message: `composes '${exports.EnumToken[token.r.typ]}' is not supported`,
                                        node
                                    });
                                    isValid = false;
                                    break;
                                }
                                tokens.push(token);
                            }
                        }
                        // find parent rule
                        let parentRule = node.parent;
                        while (parentRule != null && parentRule.typ != exports.EnumToken.RuleNodeType) {
                            parentRule = parentRule.parent;
                        }
                        if (!isValid) {
                            parentRule.chi.splice(parentRule.chi.indexOf(node), 1);
                            continue;
                        }
                        for (const token of tokens) {
                            // composes: a b c;
                            if (token.r == null) {
                                for (const rule of token.l) {
                                    if (rule.typ == exports.EnumToken.WhitespaceTokenType || rule.typ == exports.EnumToken.CommentTokenType) {
                                        continue;
                                    }
                                    if (!(rule.val in mapping)) {
                                        let result = (moduleSettings.scoped & exports.ModuleScopeEnumOptions.Global) ? rule.val : moduleSettings.generateScopedName(rule.val, moduleSettings.filePath, moduleSettings.pattern, moduleSettings.hashLength);
                                        let value = result instanceof Promise ? await result : result;
                                        mapping[rule.val] = (rule.typ == exports.EnumToken.DashedIdenTokenType ? '--' : '') + (moduleSettings.naming & exports.ModuleCaseTransformEnum.DashCaseOnly || moduleSettings.naming & exports.ModuleCaseTransformEnum.CamelCaseOnly ? getKeyName(value, moduleSettings.naming) : value);
                                        revMapping[mapping[rule.val]] = rule.val;
                                    }
                                    if (parentRule != null) {
                                        for (const tk of parentRule.tokens) {
                                            if (tk.typ == exports.EnumToken.ClassSelectorTokenType) {
                                                const val = tk.val.slice(1);
                                                if (val in revMapping) {
                                                    const key = revMapping[val];
                                                    mapping[key] = [...new Set([...mapping[key].split(' '), mapping[rule.val]])].join(' ');
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                            // composes: a b c from 'file.css';
                            else if (token.r.typ == exports.EnumToken.String) {
                                const url = token.r.val.slice(1, -1);
                                const src = options.resolve(url, options.dirname(options.src), options.cwd);
                                const result = options.load(url, options.src);
                                const stream = result instanceof Promise || Object.getPrototypeOf(result).constructor.name == 'AsyncFunction' ? await result : result;
                                const root = await doParse(stream instanceof ReadableStream ? tokenizeStream(stream) : tokenize$1({
                                    stream,
                                    buffer: '',
                                    position: { ind: 0, lin: 1, col: 1 },
                                    currentPosition: { ind: -1, lin: 1, col: 0 }
                                }), Object.assign({}, options, {
                                    minify: false,
                                    setParent: false,
                                    src: src.absolute
                                }));
                                const srcIndex = (src.relative.startsWith('/') ? '' : './') + src.relative;
                                if (Object.keys(root.mapping).length > 0) {
                                    importMapping[srcIndex] = {};
                                }
                                if (parentRule != null) {
                                    for (const tk of parentRule.tokens) {
                                        if (tk.typ == exports.EnumToken.ClassSelectorTokenType) {
                                            const val = tk.val.slice(1);
                                            if (val in revMapping) {
                                                const key = revMapping[val];
                                                const values = [];
                                                for (const iden of token.l) {
                                                    if (iden.typ != exports.EnumToken.IdenTokenType && iden.typ != exports.EnumToken.DashedIdenTokenType) {
                                                        continue;
                                                    }
                                                    if (!(iden.val in root.mapping)) {
                                                        const result = (moduleSettings.scoped & exports.ModuleScopeEnumOptions.Global) ? iden.val : moduleSettings.generateScopedName(iden.val, url, moduleSettings.pattern, moduleSettings.hashLength);
                                                        let value = result instanceof Promise ? await result : result;
                                                        root.mapping[iden.val] = (moduleSettings.naming & exports.ModuleCaseTransformEnum.DashCaseOnly || moduleSettings.naming & exports.ModuleCaseTransformEnum.CamelCaseOnly ? getKeyName(value, moduleSettings.naming) : value);
                                                        root.revMapping[root.mapping[iden.val]] = iden.val;
                                                    }
                                                    importMapping[srcIndex][iden.val] = root.mapping[iden.val];
                                                    values.push(root.mapping[iden.val]);
                                                }
                                                mapping[key] = [...new Set([...mapping[key].split(' '), ...values])].join(' ');
                                            }
                                        }
                                    }
                                }
                            }
                            // composes: a b c from global;
                            else if (token.r.typ == exports.EnumToken.IdenTokenType) {
                                // global
                                if (parentRule != null) {
                                    if ('global' == token.r.val.toLowerCase()) {
                                        for (const tk of parentRule.tokens) {
                                            if (tk.typ == exports.EnumToken.ClassSelectorTokenType) {
                                                const val = tk.val.slice(1);
                                                if (val in revMapping) {
                                                    const key = revMapping[val];
                                                    mapping[key] = [...new Set([...mapping[key].split(' '), ...(token.l.reduce((acc, curr) => {
                                                                if (curr.typ == exports.EnumToken.IdenTokenType) {
                                                                    acc.push(curr.val);
                                                                }
                                                                return acc;
                                                            }, []))])].join(' ');
                                                }
                                            }
                                        }
                                    }
                                    else {
                                        errors.push({
                                            action: 'drop',
                                            message: `composes '${token.r.val}' is not supported`,
                                            node
                                        });
                                    }
                                }
                            }
                        }
                        parentRule.chi.splice(parentRule.chi.indexOf(node), 1);
                    }
                    if (node.nam == 'grid-template-areas') {
                        for (let i = 0; i < node.val.length; i++) {
                            if (node.val[i].typ == exports.EnumToken.String) {
                                const tokens = parseString(node.val[i].val.slice(1, -1), { location: true });
                                for (const { value } of walkValues(tokens)) {
                                    if (value.typ == exports.EnumToken.IdenTokenType || value.typ == exports.EnumToken.DashedIdenTokenType) {
                                        if (value.val in mapping) {
                                            value.val = mapping[value.val];
                                        }
                                        else {
                                            let result = (moduleSettings.scoped & exports.ModuleScopeEnumOptions.Global) ? value.val : moduleSettings.generateScopedName(value.val, moduleSettings.filePath, moduleSettings.pattern, moduleSettings.hashLength);
                                            if (result instanceof Promise) {
                                                result = await result;
                                            }
                                            mapping[value.val] = result;
                                            revMapping[result] = value.val;
                                            value.val = result;
                                        }
                                    }
                                }
                                node.val[i].val = node.val[i].val.charAt(0) + tokens.reduce((acc, curr) => acc + renderToken(curr), '') + node.val[i].val.charAt(node.val[i].val.length - 1);
                            }
                        }
                    }
                    else if (node.nam == 'animation' || node.nam == 'animation-name') {
                        for (const { value } of walkValues(node.val, node)) {
                            if (value.typ == exports.EnumToken.IdenTokenType && ![
                                'none', 'infinite', 'normal', 'reverse', 'alternate',
                                'alternate-reverse', 'forwards', 'backwards', 'both',
                                'running', 'paused', 'linear', 'ease', 'ease-in', 'ease-out', 'ease-in-out',
                                'step-start', 'step-end', 'jump-start', 'jump-end',
                                'jump-none', 'jump-both', 'start', 'end',
                                'inherit', 'initial', 'unset'
                            ].includes(value.val)) {
                                if (!(value.val in mapping)) {
                                    const result = (moduleSettings.scoped & exports.ModuleScopeEnumOptions.Global) ? value.val : moduleSettings.generateScopedName(value.val, moduleSettings.filePath, moduleSettings.pattern, moduleSettings.hashLength);
                                    mapping[value.val] = result instanceof Promise ? await result : result;
                                    revMapping[mapping[value.val]] = value.val;
                                }
                                value.val = mapping[value.val];
                            }
                        }
                    }
                    for (const { value } of walkValues(node.val, node)) {
                        if (value.typ == exports.EnumToken.DashedIdenTokenType) {
                            if (!(value.val in mapping)) {
                                const result = (moduleSettings.scoped & exports.ModuleScopeEnumOptions.Global) ? value.val : moduleSettings.generateScopedName(value.val, moduleSettings.filePath, moduleSettings.pattern, moduleSettings.hashLength);
                                let val = result instanceof Promise ? await result : result;
                                mapping[value.val] = '--' + (moduleSettings.naming & exports.ModuleCaseTransformEnum.DashCaseOnly || moduleSettings.naming & exports.ModuleCaseTransformEnum.CamelCaseOnly ? getKeyName(val, moduleSettings.naming) : val);
                                revMapping[mapping[value.val]] = value.val;
                            }
                            value.val = mapping[value.val];
                        }
                    }
                }
                else if (node.typ == exports.EnumToken.RuleNodeType) {
                    if (node.tokens == null) {
                        Object.defineProperty(node, 'tokens', {
                            ...definedPropertySettings,
                            value: parseSelector(parseString(node.sel, { location: true }))
                        });
                    }
                    let hasIdOrClass = false;
                    for (const { value } of walkValues(node.tokens, node, 
                    // @ts-ignore
                    (value, parent) => {
                        if (value.typ == exports.EnumToken.PseudoClassTokenType) {
                            const val = value.val.toLowerCase();
                            switch (val) {
                                case ':local':
                                case ':global':
                                    {
                                        let index = parent.tokens.indexOf(value);
                                        parent.tokens.splice(index, 1);
                                        if (parent.tokens[index]?.typ == exports.EnumToken.WhitespaceTokenType || parent.tokens[index]?.typ == exports.EnumToken.DescendantCombinatorTokenType) {
                                            parent.tokens.splice(index, 1);
                                        }
                                        if (val == ':global') {
                                            for (; index < parent.tokens.length; index++) {
                                                if (parent.tokens[index].typ == exports.EnumToken.CommaTokenType ||
                                                    ([exports.EnumToken.PseudoClassFuncTokenType, exports.EnumToken.PseudoClassTokenType].includes(parent.tokens[index].typ) &&
                                                        [':global', ':local'].includes(parent.tokens[index].val.toLowerCase()))) {
                                                    break;
                                                }
                                                global.add(parent.tokens[index]);
                                            }
                                        }
                                    }
                                    break;
                            }
                        }
                        else if (value.typ == exports.EnumToken.PseudoClassFuncTokenType) {
                            switch (value.val.toLowerCase()) {
                                case ':global':
                                    for (const token of value.chi) {
                                        global.add(token);
                                    }
                                    parent.tokens.splice(parent.tokens.indexOf(value), 1, ...value.chi);
                                    break;
                                case ':local':
                                    parent.tokens.splice(parent.tokens.indexOf(value), 1, ...value.chi);
                                    break;
                            }
                        }
                    })) {
                        if (value.typ == exports.EnumToken.HashTokenType || value.typ == exports.EnumToken.ClassSelectorTokenType) {
                            hasIdOrClass = true;
                        }
                        if (processed.has(value)) {
                            continue;
                        }
                        processed.add(value);
                        if (value.typ == exports.EnumToken.PseudoClassTokenType) ;
                        else if (value.typ == exports.EnumToken.PseudoClassFuncTokenType) ;
                        else {
                            if (global.has(value)) {
                                continue;
                            }
                            if (value.typ == exports.EnumToken.ClassSelectorTokenType) {
                                const val = value.val.slice(1);
                                if (!(val in mapping)) {
                                    const result = (moduleSettings.scoped & exports.ModuleScopeEnumOptions.Global) ? val : moduleSettings.generateScopedName(val, moduleSettings.filePath, moduleSettings.pattern, moduleSettings.hashLength);
                                    let value = result instanceof Promise ? await result : result;
                                    mapping[val] = (moduleSettings.naming & exports.ModuleCaseTransformEnum.DashCaseOnly || moduleSettings.naming & exports.ModuleCaseTransformEnum.CamelCaseOnly ? getKeyName(value, moduleSettings.naming) : value);
                                    revMapping[mapping[val]] = val;
                                }
                                value.val = '.' + mapping[val];
                            }
                        }
                    }
                    if (moduleSettings.scoped & exports.ModuleScopeEnumOptions.Pure) {
                        if (!hasIdOrClass) {
                            throw new Error(`pure module: No id or class found in selector '${node.sel}' at '${node.loc?.src ?? ''}':${node.loc?.sta?.lin ?? ''}:${node.loc?.sta?.col ?? ''}`);
                        }
                    }
                    node.sel = '';
                    for (const token of node.tokens) {
                        node.sel += renderToken(token);
                    }
                }
                else if (node.typ == exports.EnumToken.AtRuleNodeType || node.typ == exports.EnumToken.KeyframesAtRuleNodeType) {
                    const val = node.nam.toLowerCase();
                    if (val == 'property' || val == 'keyframes') {
                        if (node.tokens == null) {
                            Object.defineProperty(node, 'tokens', {
                                ...definedPropertySettings,
                                // @ts-ignore
                                value: parseAtRulePrelude(parseString(node.val), node)
                            });
                        }
                        const prefix = val == 'property' ? '--' : '';
                        for (const value of node.tokens) {
                            if ((prefix == '--' && value.typ == exports.EnumToken.DashedIdenTokenType) || (prefix == '' && value.typ == exports.EnumToken.IdenTokenType)) {
                                if (!(value.val in mapping)) {
                                    const result = (moduleSettings.scoped & exports.ModuleScopeEnumOptions.Global) ? value.val : moduleSettings.generateScopedName(value.val, moduleSettings.filePath, moduleSettings.pattern, moduleSettings.hashLength);
                                    let val = result instanceof Promise ? await result : result;
                                    mapping[value.val] = prefix + (moduleSettings.naming & exports.ModuleCaseTransformEnum.DashCaseOnly || moduleSettings.naming & exports.ModuleCaseTransformEnum.CamelCaseOnly ? getKeyName(val, moduleSettings.naming) : val);
                                    revMapping[mapping[value.val]] = value.val;
                                }
                                value.val = mapping[value.val];
                            }
                        }
                        node.val = node.tokens.reduce((a, b) => a + renderToken(b), '');
                    }
                }
            }
            if (moduleSettings.naming != exports.ModuleCaseTransformEnum.Ignore) {
                revMapping = {};
                mapping = Object.entries(mapping).reduce((acc, [key, value]) => {
                    const keyName = getKeyName(key, moduleSettings.naming);
                    acc[keyName] = value;
                    revMapping[value] = keyName;
                    return acc;
                }, {});
            }
            result.mapping = mapping;
            result.revMapping = revMapping;
            if ((moduleSettings.scoped & exports.ModuleScopeEnumOptions.ICSS) && Object.keys(importMapping).length > 0) {
                result.importMapping = importMapping;
            }
            endTime = performance.now();
            result.stats.module = `${(endTime - parseModuleTime).toFixed(2)}ms`;
            result.stats.total = `${(endTime - startTime).toFixed(2)}ms`;
        }
        return result;
    }
    function getLastNode(context) {
        let i = context.chi.length;
        while (i--) {
            if ([exports.EnumToken.CommentTokenType, exports.EnumToken.CDOCOMMTokenType, exports.EnumToken.WhitespaceTokenType].includes(context.chi[i].typ)) {
                continue;
            }
            return context.chi[i];
        }
        return null;
    }
    function parseNode(results, context, options, errors, src, map, rawTokens, stats) {
        let tokens = [];
        for (const t of results) {
            const node = getTokenType(t.token, t.hint);
            map.set(node, { sta: t.sta, end: t.end, src });
            tokens.push(node);
        }
        let i;
        let loc;
        for (i = 0; i < tokens.length; i++) {
            if (tokens[i].typ == exports.EnumToken.CommentTokenType || tokens[i].typ == exports.EnumToken.CDOCOMMTokenType) {
                const location = map.get(tokens[i]);
                if (tokens[i].typ == exports.EnumToken.CDOCOMMTokenType && context.typ != exports.EnumToken.StyleSheetNodeType) {
                    errors.push({
                        action: 'drop',
                        message: `CDOCOMM not allowed here ${JSON.stringify(tokens[i], null, 1)}`,
                        node: tokens[i],
                        location
                    });
                    continue;
                }
                loc = location;
                context.chi.push(tokens[i]);
                stats.nodesCount++;
                Object.defineProperty(tokens[i], 'loc', {
                    ...definedPropertySettings,
                    value: loc,
                    enumerable: options.sourcemap !== false
                });
            }
            else if (tokens[i].typ != exports.EnumToken.WhitespaceTokenType) {
                break;
            }
        }
        tokens = tokens.slice(i);
        if (tokens.length == 0) {
            return null;
        }
        let delim = tokens.at(-1);
        if (delim.typ == exports.EnumToken.SemiColonTokenType || delim.typ == exports.EnumToken.BlockStartTokenType || delim.typ == exports.EnumToken.BlockEndTokenType) {
            tokens.pop();
        }
        while ([exports.EnumToken.WhitespaceTokenType, exports.EnumToken.BadStringTokenType, exports.EnumToken.BadCommentTokenType].includes(tokens.at(-1)?.typ)) {
            tokens.pop();
        }
        if (tokens.length == 0) {
            return null;
        }
        if (tokens[0]?.typ == exports.EnumToken.AtRuleTokenType) {
            const atRule = tokens.shift();
            const location = map.get(atRule);
            // @ts-ignore
            while ([exports.EnumToken.WhitespaceTokenType].includes(tokens[0]?.typ)) {
                tokens.shift();
            }
            rawTokens.shift();
            if (atRule.val == 'import') {
                // only @charset and @layer are accepted before @import
                if (context.chi.length > 0) {
                    let i = context.chi.length;
                    while (i--) {
                        // @ts-ignore
                        const type = context.chi[i].typ;
                        if (type == exports.EnumToken.CommentNodeType) {
                            continue;
                        }
                        if (type != exports.EnumToken.AtRuleNodeType) {
                            if (!(type == exports.EnumToken.InvalidAtRuleTokenType &&
                                ['charset', 'layer', 'import'].includes(context.chi[i].nam))) {
                                errors.push({
                                    action: 'drop',
                                    message: 'invalid @import',
                                    location,
                                    // @ts-ignore
                                    rawTokens: [atRule, ...tokens]
                                });
                                return null;
                            }
                        }
                        const name = context.chi[i].nam;
                        if (name != 'charset' && name != 'import' && name != 'layer') {
                            errors.push({ action: 'drop', message: 'invalid @import', location });
                            return null;
                        }
                        break;
                    }
                }
                // @ts-ignore
                if (tokens[0]?.typ != exports.EnumToken.StringTokenType && tokens[0]?.typ != exports.EnumToken.UrlFunctionTokenType) {
                    errors.push({
                        action: 'drop',
                        message: 'doParse: invalid @import',
                        location
                    });
                    return null;
                }
                // @ts-ignore
                if (tokens[0].typ == exports.EnumToken.UrlFunctionTokenType && tokens[1]?.typ != exports.EnumToken.UrlTokenTokenType && tokens[1]?.typ != exports.EnumToken.StringTokenType) {
                    errors.push({
                        action: 'drop',
                        message: 'doParse: invalid @import',
                        location
                    });
                    return null;
                }
            }
            if (atRule.val == 'import') {
                // @ts-ignore
                if (tokens[0].typ == exports.EnumToken.UrlFunctionTokenType) {
                    if (tokens[1].typ == exports.EnumToken.UrlTokenTokenType || tokens[1].typ == exports.EnumToken.StringTokenType) {
                        tokens.shift();
                        if (tokens[0]?.typ == exports.EnumToken.UrlTokenTokenType) {
                            // @ts-ignore
                            tokens[0].typ = exports.EnumToken.StringTokenType;
                            // @ts-ignore
                            tokens[0].val = `"${tokens[0].val}"`;
                        }
                        // @ts-ignore
                        while (tokens[1]?.typ == exports.EnumToken.WhitespaceTokenType || tokens[1]?.typ == exports.EnumToken.CommentTokenType) {
                            tokens.splice(1, 1);
                        }
                        // @ts-ignore
                        if (tokens[1]?.typ == exports.EnumToken.EndParensTokenType) {
                            tokens.splice(1, 1);
                        }
                    }
                }
            }
            // https://www.w3.org/TR/css-nesting-1/#conditionals
            // allowed nesting at-rules
            // there must be a top level rule in the stack
            if (atRule.val == 'charset') {
                let spaces = 0;
                // https://developer.mozilla.org/en-US/docs/Web/CSS/@charset
                for (let k = 0; k < rawTokens.length; k++) {
                    if (rawTokens[k].hint == exports.EnumToken.WhitespaceTokenType) {
                        spaces += rawTokens[k].len;
                        continue;
                    }
                    if (rawTokens[k].hint == exports.EnumToken.CommentTokenType) {
                        continue;
                    }
                    if (rawTokens[k].hint == exports.EnumToken.CDOCOMMTokenType) {
                        continue;
                    }
                    if (spaces > 1) {
                        errors.push({
                            action: 'drop',
                            message: '@charset must have only one space',
                            // @ts-ignore
                            location, rawTokens: [atRule, ...tokens]
                        });
                        return null;
                    }
                    if (rawTokens[k].hint != exports.EnumToken.StringTokenType || rawTokens[k].token[0] != '"') {
                        errors.push({
                            action: 'drop',
                            message: '@charset expects a "<charset>"',
                            location
                        });
                        return null;
                    }
                    break;
                }
                if (options.removeCharset) {
                    return null;
                }
            }
            const t = parseAtRulePrelude(parseTokens(tokens, { minify: options.minify }), atRule);
            const raw = [];
            for (const curr of t) {
                raw.push(renderToken(curr, { removeComments: true, convertColor: false }));
            }
            const nam = renderToken(atRule, { removeComments: true });
            // @ts-ignore
            const node = {
                typ: /^(-[a-z]+-)?keyframes$/.test(nam) ? exports.EnumToken.KeyframesAtRuleNodeType : exports.EnumToken.AtRuleNodeType,
                nam,
                val: raw.join('')
            };
            Object.defineProperties(node, {
                tokens: { ...definedPropertySettings, enumerable: false, value: t.slice() },
                raw: { ...definedPropertySettings, value: raw }
            });
            if (delim.typ == exports.EnumToken.BlockStartTokenType) {
                node.chi = [];
            }
            loc = map.get(atRule);
            Object.defineProperty(node, 'loc', {
                ...definedPropertySettings,
                value: loc,
                enumerable: options.sourcemap !== false
            });
            node.loc.end = { ...map.get(delim).end };
            let isValid = true;
            if (node.nam == 'else') {
                const prev = getLastNode(context);
                if (prev != null && prev.typ == exports.EnumToken.AtRuleNodeType && ['when', 'else'].includes(prev.nam)) {
                    if (prev.nam == 'else') {
                        isValid = Array.isArray(prev.tokens) && prev.tokens.length > 0;
                    }
                }
                else {
                    isValid = false;
                }
            }
            // @ts-ignore
            const skipValidate = (options.validation & exports.ValidationLevel.AtRule) == 0;
            const isAllowed = skipValidate || isNodeAllowedInContext(node, context);
            // @ts-ignore
            const valid = skipValidate ? {
                valid: SyntaxValidationResult.Valid,
                error: '',
                node,
                syntax: '@' + node.nam
            } : !isAllowed ? {
                valid: SyntaxValidationResult.Drop,
                node,
                syntax: '@' + node.nam,
                error: `${exports.EnumToken[context.typ]}: child ${exports.EnumToken[node.typ]} not allowed in context${context.typ == exports.EnumToken.AtRuleNodeType ? ` '@${context.nam}'` : context.typ == exports.EnumToken.StyleSheetNodeType ? ` 'stylesheet'` : ''}`} : isValid ? (node.typ == exports.EnumToken.KeyframesAtRuleNodeType ? validateAtRuleKeyframes(node) : validateAtRule(node, options, context)) : {
                valid: SyntaxValidationResult.Drop,
                node,
                syntax: '@' + node.nam,
                error: '@' + node.nam + ' not allowed here'};
            if (valid.valid == SyntaxValidationResult.Drop) {
                let message = '';
                for (const token of tokens) {
                    message += renderToken(token, { minify: false });
                }
                errors.push({
                    action: 'drop',
                    message: valid.error + ' - "' + message + '"',
                    node,
                    // @ts-ignore
                    location: { src, ...(map.get(valid.node) ?? location) }
                });
                // @ts-ignore
                node.typ = exports.EnumToken.InvalidAtRuleTokenType;
            }
            else {
                node.val = '';
                for (const token of node.tokens) {
                    node.val += renderToken(token, {
                        minify: false,
                        convertColor: false,
                        removeComments: true
                    });
                }
            }
            context.chi.push(node);
            stats.nodesCount++;
            Object.defineProperties(node, {
                parent: { ...definedPropertySettings, value: context },
                validSyntax: { ...definedPropertySettings, value: valid.valid == SyntaxValidationResult.Valid }
            });
            return node;
        }
        else {
            // rule
            if (delim.typ == exports.EnumToken.BlockStartTokenType) {
                const location = map.get(tokens[0]);
                const uniq = new Map;
                parseTokens(tokens, { minify: true });
                const ruleType = context.typ == exports.EnumToken.KeyframesAtRuleNodeType ? exports.EnumToken.KeyFramesRuleNodeType : exports.EnumToken.RuleNodeType;
                if (ruleType == exports.EnumToken.RuleNodeType) {
                    parseSelector(tokens);
                }
                const node = {
                    typ: ruleType,
                    sel: [...tokens.reduce((acc, curr, index, array) => {
                            if (curr.typ == exports.EnumToken.CommentTokenType) {
                                return acc;
                            }
                            if (options.minify) {
                                if (curr.typ == exports.EnumToken.PseudoClassFuncTokenType && curr.val == ':nth-child') {
                                    let i = 0;
                                    for (; i < curr.chi.length; i++) {
                                        if (curr.chi[i].typ == exports.EnumToken.IdenTokenType && curr.chi[i].val == 'even') {
                                            Object.assign(curr.chi[i], {
                                                typ: exports.EnumToken.Dimension,
                                                val: 2,
                                                unit: 'n'
                                            });
                                        }
                                        else if (curr.chi[i].typ == exports.EnumToken.Dimension &&
                                            curr.chi[i].val == 2 &&
                                            curr.chi[i].unit == 'n' &&
                                            curr.chi[i + 1]?.typ == exports.EnumToken.WhitespaceTokenType &&
                                            curr.chi[i + 2]?.typ == exports.EnumToken.LiteralTokenType &&
                                            curr.chi[i + 2].val == '+' &&
                                            curr.chi[i + 3]?.typ == exports.EnumToken.WhitespaceTokenType &&
                                            curr.chi[i + 4]?.typ == exports.EnumToken.NumberTokenType &&
                                            curr.chi[i + 4].val == 1) {
                                            curr.chi.splice(i, 5, Object.assign(curr.chi[i], {
                                                typ: exports.EnumToken.IdenTokenType,
                                                val: 'odd'
                                            }));
                                        }
                                    }
                                }
                            }
                            if (curr.typ == exports.EnumToken.WhitespaceTokenType) {
                                if (trimWhiteSpace.includes(array[index - 1]?.typ) ||
                                    trimWhiteSpace.includes(array[index + 1]?.typ) ||
                                    combinators.includes(array[index - 1]?.val) ||
                                    combinators.includes(array[index + 1]?.val)) {
                                    return acc;
                                }
                            }
                            if (ruleType == exports.EnumToken.KeyFramesRuleNodeType && options.minify) {
                                if (curr.typ == exports.EnumToken.IdenTokenType && curr.val == 'from') {
                                    Object.assign(curr, { typ: exports.EnumToken.PercentageTokenType, val: '0' });
                                }
                                else if (curr.typ == exports.EnumToken.PercentageTokenType && curr.val == 100) {
                                    Object.assign(curr, { typ: exports.EnumToken.IdenTokenType, val: 'to' });
                                }
                            }
                            let t = renderToken(curr, { minify: false });
                            if (t == ',') {
                                acc.push([]);
                            }
                            else {
                                acc[acc.length - 1].push(t);
                            }
                            return acc;
                        }, [[]]).reduce((acc, curr) => {
                            let i = 0;
                            for (; i < curr.length; i++) {
                                if (i + 1 < curr.length && curr[i] == '*') {
                                    if (curr[i] == '*') {
                                        let index = curr[i + 1] == ' ' ? 2 : 1;
                                        if (!['>', '~', '+'].includes(curr[index])) {
                                            curr.splice(i, index);
                                        }
                                    }
                                }
                            }
                            acc.set(curr.join(''), curr);
                            return acc;
                        }, uniq).keys()].join(','),
                    chi: []
                };
                Object.defineProperty(node, 'tokens', {
                    ...definedPropertySettings,
                    enumerable: false,
                    value: tokens.slice()
                });
                loc = location;
                Object.defineProperty(node, 'loc', {
                    ...definedPropertySettings,
                    value: loc,
                    enumerable: options.sourcemap !== false
                });
                context.chi.push(node);
                Object.defineProperty(node, 'parent', { ...definedPropertySettings, value: context });
                // @ts-ignore
                const skipValidate = (options.validation & exports.ValidationLevel.Selector) == 0;
                const isAllowed = skipValidate || isNodeAllowedInContext(node, context);
                // @ts-ignore
                const valid = skipValidate ? {
                    valid: SyntaxValidationResult.Valid,
                    error: null
                } : !isAllowed ? {
                    valid: SyntaxValidationResult.Drop,
                    error: `${exports.EnumToken[context.typ]}: child ${exports.EnumToken[node.typ]} not allowed in context${context.typ == exports.EnumToken.AtRuleNodeType ? ` '@${context.nam}'` : context.typ == exports.EnumToken.StyleSheetNodeType ? ` 'stylesheet'` : ''}`
                } : ruleType == exports.EnumToken.KeyFramesRuleNodeType ? validateKeyframeSelector(tokens) : validateSelector(tokens, options, context);
                if (valid.valid != SyntaxValidationResult.Valid) {
                    // @ts-ignore
                    node.typ = exports.EnumToken.InvalidRuleTokenType;
                    node.sel = tokens.reduce((acc, curr) => acc + renderToken(curr, { minify: false }), '');
                    errors.push({
                        action: 'drop',
                        message: valid.error + ' - "' + tokens.reduce((acc, curr) => acc + renderToken(curr, { minify: false }), '') + '"',
                        node,
                        // @ts-ignore
                        location
                    });
                }
                Object.defineProperty(node, 'validSyntax', {
                    ...definedPropertySettings,
                    value: valid.valid == SyntaxValidationResult.Valid
                });
                return node;
            }
            else {
                let name = null;
                let value = null;
                let i = 0;
                for (; i < tokens.length; i++) {
                    if (tokens[i].typ == exports.EnumToken.LiteralTokenType && tokens[i].val.length > 1) {
                        const start = tokens[i].val.charAt(0);
                        const val = tokens[i].val.slice(1);
                        if (['/', '*'].includes(start) && isNumber(val)) {
                            tokens.splice(i, 1, {
                                typ: exports.EnumToken.LiteralTokenType,
                                val: tokens[i].val.charAt(0)
                            }, {
                                typ: exports.EnumToken.NumberTokenType,
                                val: +tokens[i].val.slice(1)
                            });
                        }
                        else if (start == '/' && isFunction(val)) {
                            tokens.splice(i, 1, { typ: exports.EnumToken.LiteralTokenType, val: '/' }, getTokenType(val));
                        }
                    }
                }
                parseTokens(tokens, { ...options, parseColor: true });
                for (i = 0; i < tokens.length; i++) {
                    if (tokens[i].typ == exports.EnumToken.CommentTokenType) {
                        continue;
                    }
                    if (name == null && [exports.EnumToken.IdenTokenType, exports.EnumToken.DashedIdenTokenType].includes(tokens[i].typ)) {
                        name = tokens.slice(0, i + 1);
                    }
                    else if (name == null && tokens[i].typ == exports.EnumToken.ColorTokenType && [exports.ColorType.SYS, exports.ColorType.DPSYS].includes(tokens[i].kin)) {
                        name = tokens.slice(0, i + 1);
                        tokens[i].typ = exports.EnumToken.IdenTokenType;
                    }
                    else if (name != null && funcLike.concat([
                        exports.EnumToken.LiteralTokenType,
                        exports.EnumToken.IdenTokenType, exports.EnumToken.DashedIdenTokenType,
                        exports.EnumToken.PseudoClassTokenType, exports.EnumToken.PseudoClassFuncTokenType
                    ]).includes(tokens[i].typ)) {
                        if (tokens[i].val?.charAt?.(0) == ':') {
                            Object.assign(tokens[i], getTokenType(tokens[i].val.slice(1)));
                            if ('chi' in tokens[i]) {
                                tokens[i].typ = exports.EnumToken.FunctionTokenType;
                                if (colorsFunc.includes(tokens[i].val) && isColor(tokens[i])) {
                                    parseColor(tokens[i]);
                                }
                            }
                            tokens.splice(i--, 0, { typ: exports.EnumToken.ColonTokenType });
                            continue;
                        }
                        if ('chi' in tokens[i]) {
                            tokens[i].typ = exports.EnumToken.FunctionTokenType;
                        }
                        value = tokens.slice(i);
                    }
                    if (tokens[i].typ == exports.EnumToken.ColonTokenType) {
                        name = tokens.slice(0, i);
                        value = tokens.slice(i + 1);
                        break;
                    }
                }
                if (name == null) {
                    name = tokens;
                }
                const location = map.get(name[0]);
                if (name.length > 0) {
                    for (let i = 1; i < name.length; i++) {
                        if (name[i].typ != exports.EnumToken.WhitespaceTokenType && name[i].typ != exports.EnumToken.CommentTokenType) {
                            errors.push({
                                action: 'drop',
                                message: 'doParse: invalid declaration',
                                location
                            });
                            return null;
                        }
                    }
                }
                const nam = renderToken(name.shift(), { removeComments: true });
                if (value == null || (!nam.startsWith('--') && value.length == 0)) {
                    errors.push({
                        action: 'drop',
                        message: 'doParse: invalid declaration',
                        location
                    });
                    if (options.lenient) {
                        const node = {
                            typ: exports.EnumToken.InvalidDeclarationNodeType,
                            nam,
                            val: []
                        };
                        Object.defineProperty(node, 'loc', {
                            ...definedPropertySettings,
                            value: location,
                            enumerable: options.sourcemap !== false
                        });
                        context.chi.push(node);
                        stats.nodesCount++;
                    }
                    return null;
                }
                for (const { value: token } of walkValues(value, null, {
                    fn: (node) => node.typ == exports.EnumToken.FunctionTokenType && node.val == 'calc' ? exports.WalkerOptionEnum.IgnoreChildren : null,
                    type: exports.EnumToken.FunctionTokenType
                })) {
                    if (token.typ == exports.EnumToken.FunctionTokenType && token.val == 'calc') {
                        for (const { value: node, parent } of walkValues(token.chi, token)) {
                            // fix expressions starting with '/' or '*' such as '/4' in (1 + 1)/4
                            if (node.typ == exports.EnumToken.LiteralTokenType && node.val.length > 0) {
                                if (node.val[0] == '/' || node.val[0] == '*') {
                                    parent.chi.splice(parent.chi.indexOf(node), 1, { typ: node.val[0] == '/' ? exports.EnumToken.Div : exports.EnumToken.Mul }, ...parseString(node.val.slice(1)));
                                }
                            }
                        }
                    }
                }
                const node = {
                    typ: exports.EnumToken.DeclarationNodeType,
                    nam,
                    val: value
                };
                Object.defineProperty(node, 'loc', {
                    ...definedPropertySettings,
                    value: location,
                    enumerable: options.sourcemap !== false
                });
                node.loc.end = { ...map.get(delim).end };
                // do not allow declarations in style sheets
                if (context.typ == exports.EnumToken.StyleSheetNodeType && options.lenient) {
                    Object.assign(node, { typ: exports.EnumToken.InvalidDeclarationNodeType });
                    context.chi.push(node);
                    stats.nodesCount++;
                    return null;
                }
                const result = parseDeclarationNode(node, errors, location);
                Object.defineProperty(result, 'parent', { ...definedPropertySettings, value: context });
                if (result != null) {
                    if (options.validation & exports.ValidationLevel.Declaration) {
                        const isAllowed = isNodeAllowedInContext(node, context);
                        // @ts-ignore
                        const valid = !isAllowed ? {
                            valid: SyntaxValidationResult.Drop,
                            error: `${exports.EnumToken[node.typ]} not allowed in context${context.typ == exports.EnumToken.AtRuleNodeType ? ` '@${context.nam}'` : context.typ == exports.EnumToken.StyleSheetNodeType ? ` 'stylesheet'` : ''}`,
                            node,
                            syntax: null
                        } : evaluateSyntax(result, context, options);
                        Object.defineProperty(result, 'validSyntax', {
                            ...definedPropertySettings,
                            value: valid.valid == SyntaxValidationResult.Valid
                        });
                        if (valid.valid == SyntaxValidationResult.Drop) {
                            errors.push({
                                action: 'drop',
                                message: valid.error,
                                syntax: valid.syntax,
                                node: valid.node,
                                location: map.get(valid.node) ?? valid.node?.loc ?? result.loc ?? location
                            });
                            if (!options.lenient) {
                                return null;
                            }
                            Object.assign(node, { typ: exports.EnumToken.InvalidDeclarationNodeType });
                        }
                    }
                    context.chi.push(result);
                    stats.nodesCount++;
                }
                return null;
            }
        }
    }
    /**
     * parse at-rule prelude
     * @param tokens
     * @param atRule
     */
    function parseAtRulePrelude(tokens, atRule) {
        for (const { value, parent } of walkValues(tokens, null, null, true)) {
            if (value.typ == exports.EnumToken.CommentTokenType ||
                value.typ == exports.EnumToken.WhitespaceTokenType ||
                value.typ == exports.EnumToken.CommaTokenType) {
                continue;
            }
            if (value.typ == exports.EnumToken.PseudoClassFuncTokenType || value.typ == exports.EnumToken.PseudoClassTokenType) {
                if (parent?.typ == exports.EnumToken.ParensTokenType) {
                    const index = parent.chi.indexOf(value);
                    let i = index;
                    while (i--) {
                        if (parent.chi[i].typ == exports.EnumToken.IdenTokenType || parent.chi[i].typ == exports.EnumToken.DashedIdenTokenType) {
                            break;
                        }
                    }
                    if (i >= 0) {
                        const token = getTokenType(parent.chi[index].val.slice(1) + (funcLike.includes(parent.chi[index].typ) ? '(' : ''));
                        parent.chi[index].val = token.val;
                        parent.chi[index].typ = token.typ;
                        if (parent.chi[index].typ == exports.EnumToken.FunctionTokenType && isColor(parent.chi[index])) {
                            parseColor(parent.chi[index]);
                        }
                        parent.chi.splice(i, index - i + 1, {
                            typ: exports.EnumToken.MediaQueryConditionTokenType,
                            l: parent.chi[i],
                            r: parent.chi.slice(index),
                            op: {
                                typ: exports.EnumToken.ColonTokenType
                            }
                        });
                    }
                }
            }
            if (atRule.val == 'page' && value.typ == exports.EnumToken.PseudoClassTokenType) {
                if ([':left', ':right', ':first', ':blank'].includes(value.val)) {
                    Object.assign(value, { typ: exports.EnumToken.PseudoPageTokenType });
                }
            }
            if (atRule.val == 'layer') {
                if (parent == null && value.typ == exports.EnumToken.LiteralTokenType) {
                    if (value.val.charAt(0) == '.') {
                        if (isIdent(value.val.slice(1))) {
                            Object.assign(value, { typ: exports.EnumToken.ClassSelectorTokenType });
                        }
                    }
                }
            }
            const val = value.typ == exports.EnumToken.IdenTokenType ? value.val.toLowerCase() : null;
            if (value.typ == exports.EnumToken.IdenTokenType) {
                if (parent == null && mediaTypes.some((t) => {
                    if (val === t) {
                        Object.assign(value, { typ: exports.EnumToken.MediaFeatureTokenType });
                        return true;
                    }
                    return false;
                })) {
                    continue;
                }
                if (value.typ == exports.EnumToken.IdenTokenType && 'and' === val) {
                    Object.assign(value, { typ: exports.EnumToken.MediaFeatureAndTokenType });
                    continue;
                }
                if (value.typ == exports.EnumToken.IdenTokenType && 'or' === val) {
                    Object.assign(value, { typ: exports.EnumToken.MediaFeatureOrTokenType });
                    continue;
                }
                if (value.typ == exports.EnumToken.IdenTokenType &&
                    ['not', 'only'].some((t) => val === t)) {
                    const array = parent?.chi ?? tokens;
                    const startIndex = array.indexOf(value);
                    let index = startIndex + 1;
                    if (index == 0) {
                        continue;
                    }
                    while (index < array.length && [exports.EnumToken.CommentTokenType, exports.EnumToken.WhitespaceTokenType].includes(array[index].typ)) {
                        index++;
                    }
                    if (array[index] == null || array[index].typ == exports.EnumToken.CommaTokenType) {
                        continue;
                    }
                    Object.assign(array[startIndex], {
                        typ: value.val.toLowerCase() == 'not' ? exports.EnumToken.MediaFeatureNotTokenType : exports.EnumToken.MediaFeatureOnlyTokenType,
                        val: array[index]
                    });
                    array.splice(startIndex + 1, index - startIndex);
                    continue;
                }
            }
            if (value.typ == exports.EnumToken.FunctionTokenType && value.val == 'selector') {
                parseSelector(value.chi);
            }
            if (value.typ == exports.EnumToken.ParensTokenType || (value.typ == exports.EnumToken.FunctionTokenType && ['media', 'supports', 'style', 'scroll-state'].includes(value.val))) {
                let i;
                let nameIndex = -1;
                let valueIndex = -1;
                const dashedIdent = value.typ == exports.EnumToken.FunctionTokenType && value.val == 'style';
                for (let i = 0; i < value.chi.length; i++) {
                    if (value.chi[i].typ == exports.EnumToken.CommentTokenType || value.chi[i].typ == exports.EnumToken.WhitespaceTokenType) {
                        continue;
                    }
                    if ((dashedIdent && value.chi[i].typ == exports.EnumToken.DashedIdenTokenType) || value.chi[i].typ == exports.EnumToken.IdenTokenType || value.chi[i].typ == exports.EnumToken.FunctionTokenType || value.chi[i].typ == exports.EnumToken.ColorTokenType) {
                        nameIndex = i;
                    }
                    break;
                }
                if (nameIndex == -1) {
                    continue;
                }
                for (let i = nameIndex + 1; i < value.chi.length; i++) {
                    if (value.chi[i].typ == exports.EnumToken.CommentTokenType || value.chi[i].typ == exports.EnumToken.WhitespaceTokenType) {
                        continue;
                    }
                    if (value.chi[i].typ == exports.EnumToken.LiteralTokenType && value.chi[i].val.startsWith(':')) {
                        const dimension = parseDimension(value.chi[i].val.slice(1));
                        if (dimension != null) {
                            value.chi.splice(i, 1, {
                                typ: exports.EnumToken.ColonTokenType,
                            }, Object.assign(value.chi[i], dimension));
                            i--;
                            continue;
                        }
                    }
                    if (nameIndex != -1 && value.chi[i].typ == exports.EnumToken.PseudoClassTokenType) {
                        value.chi.splice(i, 1, {
                            typ: exports.EnumToken.ColonTokenType,
                        }, Object.assign(value.chi[i], {
                            typ: exports.EnumToken.IdenTokenType,
                            val: value.chi[i].val.slice(1)
                        }));
                        i--;
                        continue;
                    }
                    valueIndex = i;
                    break;
                }
                if (valueIndex == -1) {
                    continue;
                }
                for (i = nameIndex + 1; i < value.chi.length; i++) {
                    if ([
                        exports.EnumToken.GtTokenType, exports.EnumToken.LtTokenType,
                        exports.EnumToken.GteTokenType, exports.EnumToken.LteTokenType,
                        exports.EnumToken.ColonTokenType
                    ].includes(value.chi[valueIndex].typ)) {
                        const val = value.chi.splice(valueIndex, 1)[0];
                        const node = value.chi.splice(nameIndex, 1)[0];
                        // 'background'
                        if (node.typ == exports.EnumToken.ColorTokenType && node.kin == exports.ColorType.DPSYS) {
                            Object.assign(node, { typ: exports.EnumToken.IdenTokenType });
                            // @ts-ignore
                            delete node.kin;
                        }
                        while (value.chi[0]?.typ == exports.EnumToken.WhitespaceTokenType) {
                            value.chi.shift();
                        }
                        const t = [{
                                typ: exports.EnumToken.MediaQueryConditionTokenType,
                                l: node,
                                op: { typ: val.typ },
                                r: value.chi.slice()
                            }];
                        value.chi.length = 0;
                        value.chi.push(...t);
                    }
                }
            }
        }
        return tokens;
    }
    /**
     * parse a string as an array of declaration nodes
     * @param declaration
     *
     * Example:
     * ````ts
     *
     * const declarations = await parseDeclarations('color: red; background: blue');
     * console.log(declarations);
     * ```
     */
    async function parseDeclarations(declaration) {
        return doParse(tokenize$1({
            stream: `.x{${declaration}}`,
            buffer: '',
            position: { ind: 0, lin: 1, col: 1 },
            currentPosition: { ind: -1, lin: 1, col: 0 }
        }), { setParent: false, minify: false, validation: false }).then(result => {
            return result.ast.chi[0].chi.filter(t => t.typ == exports.EnumToken.DeclarationNodeType || t.typ == exports.EnumToken.CommentNodeType);
        });
    }
    /**
     * parse selector
     * @param tokens
     */
    function parseSelector(tokens) {
        for (const { value, parent } of walkValues(tokens)) {
            if (value.typ == exports.EnumToken.CommentTokenType ||
                value.typ == exports.EnumToken.WhitespaceTokenType ||
                value.typ == exports.EnumToken.CommaTokenType ||
                value.typ == exports.EnumToken.IdenTokenType ||
                value.typ == exports.EnumToken.HashTokenType) {
                continue;
            }
            if (parent == null) {
                if (value.typ == exports.EnumToken.GtTokenType) {
                    Object.assign(value, { typ: exports.EnumToken.ChildCombinatorTokenType });
                }
                else if (value.typ == exports.EnumToken.LiteralTokenType) {
                    if (value.val.charAt(0) == '&') {
                        Object.assign(value, { typ: exports.EnumToken.NestingSelectorTokenType });
                        // @ts-ignore
                        delete value.val;
                    }
                    else if (value.val.charAt(0) == '.') {
                        if (!isIdent(value.val.slice(1))) {
                            Object.assign(value, { typ: exports.EnumToken.InvalidClassSelectorTokenType });
                        }
                        else {
                            Object.assign(value, { typ: exports.EnumToken.ClassSelectorTokenType });
                        }
                    }
                    if (['*', '>', '+', '~'].includes(value.val)) {
                        switch (value.val) {
                            case '*':
                                Object.assign(value, { typ: exports.EnumToken.UniversalSelectorTokenType });
                                break;
                            case '>':
                                Object.assign(value, { typ: exports.EnumToken.ChildCombinatorTokenType });
                                break;
                            case '+':
                                Object.assign(value, { typ: exports.EnumToken.NextSiblingCombinatorTokenType });
                                break;
                            case '~':
                                Object.assign(value, { typ: exports.EnumToken.SubsequentSiblingCombinatorTokenType });
                                break;
                        }
                        // @ts-ignore
                        delete value.val;
                    }
                }
                else if (value.typ == exports.EnumToken.ColorTokenType) {
                    if (value.kin == exports.ColorType.LIT || value.kin == exports.ColorType.HEX || value.kin == exports.ColorType.SYS || value.kin == exports.ColorType.DPSYS) {
                        if (value.kin == exports.ColorType.HEX) {
                            if (!isIdent(value.val.slice(1))) {
                                continue;
                            }
                            Object.assign(value, { typ: exports.EnumToken.HashTokenType });
                        }
                        else {
                            Object.assign(value, { typ: exports.EnumToken.IdenTokenType });
                        }
                        // @ts-ignore
                        delete value.kin;
                    }
                }
            }
        }
        let i = 0;
        const combinators = [
            exports.EnumToken.ChildCombinatorTokenType,
            exports.EnumToken.NextSiblingCombinatorTokenType,
            exports.EnumToken.SubsequentSiblingCombinatorTokenType
        ];
        for (; i < tokens.length; i++) {
            if (combinators.includes(tokens[i].typ)) {
                if (i + 1 < tokens.length && [exports.EnumToken.WhitespaceTokenType, exports.EnumToken.DescendantCombinatorTokenType].includes(tokens[i + 1].typ)) {
                    tokens.splice(i + 1, 1);
                }
                if (i > 0 && [exports.EnumToken.WhitespaceTokenType, exports.EnumToken.DescendantCombinatorTokenType].includes(tokens[i - 1].typ)) {
                    tokens.splice(i - 1, 1);
                    i--;
                    continue;
                }
            }
            if (tokens[i].typ == exports.EnumToken.WhitespaceTokenType) {
                tokens[i].typ = exports.EnumToken.DescendantCombinatorTokenType;
            }
        }
        return tokens;
    }
    /**
     * parse css string and return an array of tokens
     * @param src
     * @param options
     *
     * @private
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
     *  tokens = parseString('#c322c980');
     * console.log(tokens);
     * ```
     */
    function parseString(src, options = { location: false }) {
        const parseInfo = {
            stream: src,
            buffer: '',
            position: { ind: 0, lin: 1, col: 1 },
            currentPosition: { ind: -1, lin: 1, col: 0 }
        };
        return parseTokens([...tokenize$1(parseInfo)].reduce((acc, t) => {
            if (t.hint == exports.EnumToken.EOFTokenType) {
                return acc;
            }
            const token = getTokenType(t.token, t.hint);
            Object.defineProperty(token, 'loc', {
                ...definedPropertySettings,
                value: { sta: t.sta },
                enumerable: options.location !== false
            });
            acc.push(token);
            return acc;
        }, []));
    }
    /**
     * get the token type from a string
     * @param val
     * @param hint
     */
    function getTokenType(val, hint) {
        if (hint != null) {
            return enumTokenHints.has(hint) ? { typ: hint } : { typ: hint, val };
        }
        switch (val) {
            case ' ':
                return { typ: exports.EnumToken.WhitespaceTokenType };
            case ';':
                return { typ: exports.EnumToken.SemiColonTokenType };
            case '{':
                return { typ: exports.EnumToken.BlockStartTokenType };
            case '}':
                return { typ: exports.EnumToken.BlockEndTokenType };
            case '[':
                return { typ: exports.EnumToken.AttrStartTokenType };
            case ']':
                return { typ: exports.EnumToken.AttrEndTokenType };
            case ':':
                return { typ: exports.EnumToken.ColonTokenType };
            case ')':
                return { typ: exports.EnumToken.EndParensTokenType };
            case '(':
                return { typ: exports.EnumToken.StartParensTokenType };
            case '=':
                return { typ: exports.EnumToken.DelimTokenType };
            case ',':
                return { typ: exports.EnumToken.CommaTokenType };
            case '<':
                return { typ: exports.EnumToken.LtTokenType };
            case '>':
                return { typ: exports.EnumToken.GtTokenType };
        }
        if (val.charAt(0) == ':' && isPseudo(val)) {
            return val.endsWith('(') ? {
                typ: exports.EnumToken.PseudoClassFuncTokenType,
                val: val.slice(0, -1),
                chi: []
            }
                : (
                // https://www.w3.org/TR/selectors-4/#single-colon-pseudos
                val.startsWith('::') || pseudoElements.includes(val) ? {
                    typ: exports.EnumToken.PseudoElementTokenType,
                    val
                } :
                    {
                        typ: exports.EnumToken.PseudoClassTokenType,
                        val
                    });
        }
        if (val.charAt(0) == '@' && isAtKeyword(val)) {
            return {
                typ: exports.EnumToken.AtRuleTokenType,
                val: val.slice(1)
            };
        }
        if (val.endsWith('(') && isFunction(val)) {
            val = val.slice(0, -1);
            if (val == 'url') {
                return {
                    typ: exports.EnumToken.UrlFunctionTokenType,
                    val,
                    chi: []
                };
            }
            if (['linear-gradient', 'radial-gradient', 'repeating-linear-gradient', 'repeating-radial-gradient', 'conic-gradient', 'image', 'image-set', 'element', 'cross-fade', 'paint'].includes(val)) {
                return {
                    typ: exports.EnumToken.ImageFunctionTokenType,
                    val,
                    chi: []
                };
            }
            if (timingFunc.includes(val.toLowerCase())) {
                return {
                    typ: exports.EnumToken.TimingFunctionTokenType,
                    val,
                    chi: []
                };
            }
            if (timelineFunc.includes(val)) {
                return {
                    typ: exports.EnumToken.TimelineFunctionTokenType,
                    val,
                    chi: []
                };
            }
            return {
                typ: exports.EnumToken.FunctionTokenType,
                val,
                chi: []
            };
        }
        if (isNumber(val)) {
            return {
                typ: exports.EnumToken.NumberTokenType,
                val: +val
            };
        }
        if (isPercentage(val)) {
            return {
                typ: exports.EnumToken.PercentageTokenType,
                val: +val.slice(0, -1)
            };
        }
        const dimension = parseDimension(val);
        if (dimension != null) {
            return dimension;
        }
        const v = val.toLowerCase();
        if (v == 'currentcolor' || v == 'transparent' || v in COLORS_NAMES) {
            return {
                typ: exports.EnumToken.ColorTokenType,
                val: v,
                kin: exports.ColorType.LIT
            };
        }
        if (isIdent(val)) {
            if (systemColors.has(v)) {
                return {
                    typ: exports.EnumToken.ColorTokenType,
                    val,
                    kin: exports.ColorType.SYS
                };
            }
            if (deprecatedSystemColors.has(v)) {
                return {
                    typ: exports.EnumToken.ColorTokenType,
                    val,
                    kin: exports.ColorType.DPSYS
                };
            }
            return {
                typ: val.startsWith('--') ? exports.EnumToken.DashedIdenTokenType : exports.EnumToken.IdenTokenType,
                val
            };
        }
        if (val.charAt(0) == '.' && isIdent(val.slice(1))) {
            return {
                typ: exports.EnumToken.ClassSelectorTokenType,
                val
            };
        }
        if (val.charAt(0) == '#' && isHexColor(val)) {
            return {
                typ: exports.EnumToken.ColorTokenType,
                val,
                kin: exports.ColorType.HEX
            };
        }
        if (val.charAt(0) == '#' && isHash(val)) {
            return {
                typ: exports.EnumToken.HashTokenType,
                val
            };
        }
        if ('"\''.includes(val.charAt(0))) {
            return {
                typ: exports.EnumToken.UnclosedStringTokenType,
                val
            };
        }
        return {
            typ: exports.EnumToken.LiteralTokenType,
            val
        };
    }
    /**
     * parse function tokens in a token array
     * @param tokens
     * @param options
     *
     * Example:
     *
     * ```ts
     *
     * import {parseString, parseTokens} from '@tbela99/css-parser';
     *
     * let tokens = parseString('body { color: red; }');
     * console.log(parseTokens(tokens));
     *
     *  tokens = parseString('#c322c980');
     * console.log(parseTokens(tokens));
     * ```
     *
     * @private
     */
    function parseTokens(tokens, options = {}) {
        for (let i = 0; i < tokens.length; i++) {
            const t = tokens[i];
            if (t.typ == exports.EnumToken.IdenTokenType && t.val == 'from' && i > 0) {
                const left = [];
                const right = [];
                let foundLeft = 0;
                let foundRight = 0;
                let k = i;
                let l = i;
                while (k > 0) {
                    if (tokens[k - 1].typ == exports.EnumToken.CommentTokenType || tokens[k - 1].typ == exports.EnumToken.WhitespaceTokenType) {
                        left.push(tokens[--k]);
                        continue;
                    }
                    if (tokens[k - 1].typ == exports.EnumToken.IdenTokenType || tokens[k - 1].typ == exports.EnumToken.DashedIdenTokenType) {
                        foundLeft++;
                        left.push(tokens[--k]);
                        continue;
                    }
                    break;
                }
                while (++l < tokens.length) {
                    if (tokens[l].typ == exports.EnumToken.CommentTokenType || tokens[l].typ == exports.EnumToken.WhitespaceTokenType) {
                        right.push(tokens[l]);
                        continue;
                    }
                    if (tokens[l].typ == exports.EnumToken.IdenTokenType || tokens[l].typ == exports.EnumToken.StringTokenType) {
                        foundRight++;
                        right.push(tokens[l]);
                        continue;
                    }
                    break;
                }
                if (foundLeft > 0 && foundRight == 1) {
                    while (left?.[0].typ == exports.EnumToken.WhitespaceTokenType) {
                        left.shift();
                    }
                    while (left.at(-1)?.typ == exports.EnumToken.WhitespaceTokenType) {
                        left.pop();
                    }
                    tokens.splice(k, l - k + 1, {
                        typ: exports.EnumToken.ComposesSelectorNodeType,
                        l: left,
                        r: right.reduce((a, b) => {
                            return a == null ? b : b.typ == exports.EnumToken.IdenTokenType || b.typ == exports.EnumToken.StringTokenType ? b : a;
                        }, null)
                    });
                    i = k;
                    continue;
                }
            }
            if (t.typ == exports.EnumToken.WhitespaceTokenType && ((i == 0 ||
                i + 1 == tokens.length ||
                [exports.EnumToken.CommaTokenType, exports.EnumToken.GteTokenType, exports.EnumToken.LteTokenType, exports.EnumToken.ColumnCombinatorTokenType].includes(tokens[i + 1].typ)) ||
                (i > 0 && trimWhiteSpace.includes(tokens[i - 1].typ)))) {
                tokens.splice(i--, 1);
                continue;
            }
            if (t.typ == exports.EnumToken.ColonTokenType) {
                const typ = tokens[i + 1]?.typ;
                if (typ != null) {
                    if (typ == exports.EnumToken.FunctionTokenType) {
                        tokens[i + 1].typ = exports.EnumToken.PseudoClassFuncTokenType;
                    }
                    else if (typ == exports.EnumToken.IdenTokenType) {
                        tokens[i + 1].val = ':' + tokens[i + 1].val;
                        tokens[i + 1].typ = exports.EnumToken.PseudoClassTokenType;
                    }
                    if (typ == exports.EnumToken.FunctionTokenType || typ == exports.EnumToken.IdenTokenType) {
                        tokens.splice(i, 1);
                        i--;
                    }
                }
                continue;
            }
            if (t.typ == exports.EnumToken.AttrStartTokenType) {
                let k = i;
                let inAttr = 1;
                while (++k < tokens.length) {
                    if (tokens[k].typ == exports.EnumToken.AttrEndTokenType) {
                        inAttr--;
                    }
                    else if (tokens[k].typ == exports.EnumToken.AttrStartTokenType) {
                        inAttr++;
                    }
                    if (inAttr == 0) {
                        break;
                    }
                }
                const attr = Object.assign(t, {
                    typ: inAttr == 0 ? exports.EnumToken.AttrTokenType : exports.EnumToken.InvalidAttrTokenType,
                    chi: tokens.splice(i + 1, k - i)
                });
                // @ts-ignore
                if (attr.chi.at(-1).typ == exports.EnumToken.AttrEndTokenType) {
                    // @ts-ignore
                    attr.chi.pop();
                }
                // @ts-ignore
                if (attr.chi.length > 1) {
                    // @ts-ignore
                    parseTokens(attr.chi, t.typ);
                }
                let m = attr.chi.length;
                let val;
                for (m = 0; m < attr.chi.length; m++) {
                    val = attr.chi[m];
                    if (val.typ == exports.EnumToken.StringTokenType) {
                        const slice = val.val.slice(1, -1);
                        if ((slice.charAt(0) != '-' || (slice.charAt(0) == '-' && isIdentStart(slice.charCodeAt(1)))) && isIdent(slice)) {
                            Object.assign(val, { typ: exports.EnumToken.IdenTokenType, val: slice });
                        }
                    }
                    else if (val.typ == exports.EnumToken.LiteralTokenType && val.val == '|') {
                        let upper = m;
                        let lower = m;
                        while (++upper < attr.chi.length) {
                            if (attr.chi[upper].typ == exports.EnumToken.CommentTokenType) {
                                continue;
                            }
                            break;
                        }
                        while (lower-- > 0) {
                            if (attr.chi[lower].typ == exports.EnumToken.CommentTokenType) {
                                continue;
                            }
                            break;
                        }
                        // @ts-ignore
                        attr.chi[m] = {
                            typ: exports.EnumToken.NameSpaceAttributeTokenType,
                            l: attr.chi[lower],
                            r: attr.chi[upper]
                        };
                        attr.chi.splice(upper, 1);
                        if (lower >= 0) {
                            attr.chi.splice(lower, 1);
                            m--;
                        }
                    }
                    else if ([
                        exports.EnumToken.DashMatchTokenType, exports.EnumToken.StartMatchTokenType, exports.EnumToken.ContainMatchTokenType, exports.EnumToken.EndMatchTokenType, exports.EnumToken.IncludeMatchTokenType, exports.EnumToken.DelimTokenType
                    ].includes(attr.chi[m].typ)) {
                        let upper = m;
                        let lower = m;
                        while (++upper < attr.chi.length) {
                            if (attr.chi[upper].typ == exports.EnumToken.CommentTokenType) {
                                continue;
                            }
                            break;
                        }
                        while (lower-- > 0) {
                            if (attr.chi[lower].typ == exports.EnumToken.CommentTokenType) {
                                continue;
                            }
                            break;
                        }
                        val = attr.chi[lower];
                        if (val.typ == exports.EnumToken.StringTokenType) {
                            const slice = val.val.slice(1, -1);
                            if ((slice.charAt(0) != '-' || (slice.charAt(0) == '-' && isIdentStart(slice.charCodeAt(1)))) && isIdent(slice)) {
                                Object.assign(val, { typ: exports.EnumToken.IdenTokenType, val: slice });
                            }
                        }
                        val = attr.chi[upper];
                        if (val.typ == exports.EnumToken.StringTokenType) {
                            const slice = val.val.slice(1, -1);
                            if ((slice.charAt(0) != '-' || (slice.charAt(0) == '-' && isIdentStart(slice.charCodeAt(1)))) && isIdent(slice)) {
                                Object.assign(val, { typ: exports.EnumToken.IdenTokenType, val: slice });
                            }
                        }
                        // @ts-ignore
                        const typ = t.chi[m].typ;
                        // @ts-ignore
                        t.chi[m] = {
                            typ: exports.EnumToken.MatchExpressionTokenType,
                            op: {
                                // @ts-ignore
                                typ: typ == exports.EnumToken.DelimTokenType ? exports.EnumToken.EqualMatchTokenType : typ
                            },
                            l: t.chi[lower],
                            r: t.chi[upper]
                        };
                        if (isIdentColor(t.chi[m].l)) {
                            t.chi[m].l.typ = exports.EnumToken.IdenTokenType;
                        }
                        if (isIdentColor(t.chi[m].r)) {
                            t.chi[m].r.typ = exports.EnumToken.IdenTokenType;
                        }
                        t.chi.splice(upper, 1);
                        t.chi.splice(lower, 1);
                        upper = m;
                        m--;
                        while (upper < t.chi.length && t.chi[upper].typ == exports.EnumToken.WhitespaceTokenType) {
                            upper++;
                        }
                        if (upper < t.chi.length &&
                            t.chi[upper].typ == exports.EnumToken.IdenTokenType &&
                            ['i', 's'].includes(t.chi[upper].val.toLowerCase())) {
                            t.chi[m].attr = t.chi[upper].val;
                            t.chi.splice(upper, 1);
                        }
                    }
                }
                m = t.chi.length;
                while (t.chi.at(-1)?.typ == exports.EnumToken.WhitespaceTokenType) {
                    t.chi.pop();
                }
                continue;
            }
            if (funcLike.includes(t.typ)) {
                let parens = 1;
                let k = i;
                while (++k < tokens.length) {
                    if (tokens[k].typ == exports.EnumToken.ColonTokenType) {
                        const typ = tokens[k + 1]?.typ;
                        if (typ != null) {
                            if (typ == exports.EnumToken.IdenTokenType) {
                                tokens[k + 1].typ = exports.EnumToken.PseudoClassTokenType;
                                tokens[k + 1].val = ':' + tokens[k + 1].val;
                            }
                            else if (typ == exports.EnumToken.FunctionTokenType) {
                                tokens[k + 1].typ = exports.EnumToken.PseudoClassFuncTokenType;
                                tokens[k + 1].val = ':' + tokens[k + 1].val;
                            }
                            if (typ == exports.EnumToken.FunctionTokenType || typ == exports.EnumToken.IdenTokenType) {
                                tokens.splice(k, 1);
                                k--;
                                continue;
                            }
                        }
                    }
                    if (funcLike.includes(tokens[k].typ)) {
                        parens++;
                    }
                    else if (tokens[k].typ == exports.EnumToken.EndParensTokenType) {
                        parens--;
                    }
                    if (parens == 0) {
                        break;
                    }
                }
                // @ts-ignore
                t.chi = tokens.splice(i + 1, k - i);
                // @ts-ignore
                if (t.chi.at(-1)?.typ == exports.EnumToken.EndParensTokenType) {
                    // @ts-ignore
                    t.chi.pop();
                }
                // @ts-ignore
                if (t.chi.length > 0) {
                    // @ts-ignore
                    parseTokens(t.chi, options);
                }
                if (t.typ == exports.EnumToken.FunctionTokenType && mathFuncs.includes(t.val)) {
                    for (const { value, parent } of walkValues(t.chi)) {
                        if (value.typ == exports.EnumToken.WhitespaceTokenType) {
                            const p = (parent ?? t);
                            for (let i = 0; i < (p).chi.length; i++) {
                                // @ts-ignore
                                if (p.chi[i] == value) {
                                    // @ts-ignore
                                    (p).chi.splice(i, 1);
                                    i--;
                                    break;
                                }
                            }
                        }
                        else if (value.typ == exports.EnumToken.LiteralTokenType && ['+', '-', '/', '*'].includes(value.val)) {
                            // @ts-ignore
                            value.typ = value.val == '+' ? exports.EnumToken.Add : (value.val == '-' ? exports.EnumToken.Sub : (value.val == '*' ? exports.EnumToken.Mul : exports.EnumToken.Div));
                            // @ts-ignore
                            delete value.val;
                        }
                    }
                    t.chi = splitTokenList(t.chi).reduce((acc, t) => {
                        if (acc.length > 0) {
                            acc.push({ typ: exports.EnumToken.CommaTokenType });
                        }
                        acc.push(buildExpression(t));
                        return acc;
                    }, []);
                }
                else if (t.typ == exports.EnumToken.FunctionTokenType && ['minmax', 'fit-content', 'repeat'].includes(t.val)) {
                    // @ts-ignore
                    t.typ = exports.EnumToken.GridTemplateFuncTokenType;
                }
                else if (t.typ == exports.EnumToken.StartParensTokenType) {
                    // @ts-ignore
                    t.typ = exports.EnumToken.ParensTokenType;
                }
                // @ts-ignore
                if (options.parseColor && t.typ == exports.EnumToken.FunctionTokenType && isColor(t)) {
                    parseColor(t);
                    continue;
                }
                if (t.typ == exports.EnumToken.UrlFunctionTokenType) {
                    // @ts-ignore
                    if (t.chi[0]?.typ == exports.EnumToken.StringTokenType) {
                        // @ts-ignore
                        const value = t.chi[0].val.slice(1, -1);
                        // @ts-ignore
                        if (t.chi[0].val.slice(1, 5) != 'data:' && urlTokenMatcher.test(value)) {
                            // @ts-ignore
                            t.chi[0].typ = exports.EnumToken.UrlTokenTokenType;
                            // @ts-ignore
                            t.chi[0].val = options.src !== '' && options.resolveUrls ? options.resolve(value, options.src).absolute : value;
                        }
                    }
                    if (t.chi[0]?.typ == exports.EnumToken.UrlTokenTokenType) {
                        if (options.src !== '' && options.resolveUrls) {
                            // @ts-ignore
                            t.chi[0].val = options.resolve(t.chi[0].val, options.src, options.cwd).relative;
                        }
                    }
                }
                // @ts-ignore
                if (t.chi.length > 0) {
                    if (t.typ == exports.EnumToken.PseudoClassFuncTokenType && t.val == ':is' && options.minify) {
                        const count = t.chi.filter((t) => t.typ != exports.EnumToken.CommentTokenType).length;
                        if (count == 1 ||
                            (i == 0 &&
                                (tokens[i + 1]?.typ == exports.EnumToken.CommaTokenType || tokens.length == i + 1)) ||
                            (tokens[i - 1]?.typ == exports.EnumToken.CommaTokenType && (tokens[i + 1]?.typ == exports.EnumToken.CommaTokenType || tokens.length == i + 1))) {
                            tokens.splice(i, 1, ...t.chi);
                            i = Math.max(0, i - t.chi.length);
                        }
                    }
                }
            }
        }
        return tokens;
    }

    function eq(a, b) {
        if (a == null || b == null) {
            return a == b;
        }
        if (typeof a != 'object' || typeof b != 'object') {
            return a === b;
        }
        if (a.constructor != b.constructor) {
            return false;
        }
        if (Array.isArray(a)) {
            if (a.length != b.length) {
                return false;
            }
            let i = 0;
            for (; i < a.length; i++) {
                if (!eq(a[i], b[i])) {
                    return false;
                }
            }
            return true;
        }
        const k1 = Object.keys(a);
        const k2 = Object.keys(b);
        if (k1.length != k2.length) {
            return false;
        }
        let key;
        for (key of k1) {
            if (!(key in b) || !eq(a[key], b[key])) {
                return false;
            }
        }
        return true;
    }

    /**
     * options for the walk function
     */
    exports.WalkerOptionEnum = void 0;
    (function (WalkerOptionEnum) {
        /**
         * ignore the current node and its children
         */
        WalkerOptionEnum[WalkerOptionEnum["Ignore"] = 1] = "Ignore";
        /**
         * stop walking the tree
         */
        WalkerOptionEnum[WalkerOptionEnum["Stop"] = 2] = "Stop";
        /**
         * ignore the current node and process its children
         */
        WalkerOptionEnum[WalkerOptionEnum["Children"] = 4] = "Children";
        /**
         * ignore the current node children
         */
        WalkerOptionEnum[WalkerOptionEnum["IgnoreChildren"] = 8] = "IgnoreChildren";
    })(exports.WalkerOptionEnum || (exports.WalkerOptionEnum = {}));
    /**
     * event types for the walkValues function
     */
    exports.WalkerEvent = void 0;
    (function (WalkerEvent) {
        /**
         * enter node
         */
        WalkerEvent[WalkerEvent["Enter"] = 1] = "Enter";
        /**
         * leave node
         */
        WalkerEvent[WalkerEvent["Leave"] = 2] = "Leave";
    })(exports.WalkerEvent || (exports.WalkerEvent = {}));
    /**
     * walk ast nodes
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
    function* walk(node, filter, reverse) {
        const parents = [node];
        const root = node;
        const map = new Map;
        let isNumeric = false;
        let i = 0;
        while ((node = parents[i++])) {
            let option = null;
            if (filter != null) {
                option = filter(node);
                isNumeric = typeof option == 'number';
                if (isNumeric) {
                    if ((option & exports.WalkerOptionEnum.Ignore)) {
                        continue;
                    }
                    if ((option & exports.WalkerOptionEnum.Stop)) {
                        break;
                    }
                }
            }
            if (!isNumeric || (option & exports.WalkerOptionEnum.Children) === 0) {
                // @ts-ignore
                yield { node, parent: map.get(node), root };
            }
            if ('chi' in node && (!isNumeric || ((option & exports.WalkerOptionEnum.IgnoreChildren) === 0))) {
                parents.splice(i, 0, ...node.chi[reverse ? 'reverse' : 'slice']());
                for (const child of node.chi) {
                    map.set(child, node);
                }
            }
        }
    }
    /**
     * walk ast node value tokens
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
    function* walkValues(values, root = null, filter, reverse) {
        // const set = new Set<Token>();
        const stack = values.slice();
        const map = new Map;
        let previous = null;
        if (filter != null && typeof filter == 'function') {
            filter = {
                event: exports.WalkerEvent.Enter,
                fn: filter
            };
        }
        else if (filter == null) {
            filter = {
                event: exports.WalkerEvent.Enter
            };
        }
        let isNumeric = false;
        const eventType = filter.event ?? exports.WalkerEvent.Enter;
        while (stack.length > 0) {
            let value = reverse ? stack.pop() : stack.shift();
            let option = null;
            if (filter.fn != null && (eventType & exports.WalkerEvent.Enter)) {
                const isValid = filter.type == null || value.typ == filter.type ||
                    (Array.isArray(filter.type) && filter.type.includes(value.typ)) ||
                    (typeof filter.type == 'function' && filter.type(value));
                if (isValid) {
                    option = filter.fn(value, map.get(value) ?? root, exports.WalkerEvent.Enter);
                    isNumeric = typeof option == 'number';
                    if (isNumeric && (option & exports.WalkerOptionEnum.Stop)) {
                        return;
                    }
                    if (isNumeric && (option & exports.WalkerOptionEnum.Ignore)) {
                        continue;
                    }
                    // @ts-ignore
                    if (option != null && typeof option == 'object' && ('typ' in option || Array.isArray(option))) {
                        const op = Array.isArray(option) ? option : [option];
                        for (const o of op) {
                            map.set(o, map.get(value) ?? root);
                        }
                        stack[reverse ? 'push' : 'unshift'](...op);
                        console.error({ op, s: stack[0] });
                    }
                }
            }
            yield {
                value,
                parent: map.get(value) ?? root,
                previousValue: previous,
                nextValue: stack[0] ?? null,
                // @ts-ignore
                root: root ?? null
            };
            if ('chi' in value && (!isNumeric || (option & exports.WalkerOptionEnum.IgnoreChildren) === 0)) {
                const sliced = value.chi.slice();
                for (const child of sliced) {
                    map.set(child, value);
                }
                stack[reverse ? 'push' : 'unshift'](...sliced);
            }
            else {
                const values = [];
                if ('l' in value && value.l != null) {
                    // @ts-ignore
                    values[reverse ? 'push' : 'unshift'](value.l);
                    // @ts-ignore
                    map.set(value.l, value);
                }
                if ('op' in value && typeof value.op == 'object') {
                    values[reverse ? 'push' : 'unshift'](value.op);
                    // @ts-ignore
                    map.set(value.op, value);
                }
                if ('r' in value && value.r != null) {
                    if (Array.isArray(value.r)) {
                        for (const r of value.r) {
                            // @ts-ignore
                            values[reverse ? 'push' : 'unshift'](r);
                            // @ts-ignore
                            map.set(r, value);
                        }
                    }
                    else {
                        // @ts-ignore
                        values[reverse ? 'push' : 'unshift'](value.r);
                        // @ts-ignore
                        map.set(value.r, value);
                    }
                }
                if (values.length > 0) {
                    stack[reverse ? 'push' : 'unshift'](...values);
                }
            }
            if ((eventType & exports.WalkerEvent.Leave) && filter.fn != null) {
                const isValid = filter.type == null || value.typ == filter.type ||
                    (Array.isArray(filter.type) && filter.type.includes(value.typ)) ||
                    (typeof filter.type == 'function' && filter.type(value));
                if (isValid) {
                    option = filter.fn(value, map.get(value), exports.WalkerEvent.Leave);
                    // @ts-ignore
                    if (option != null && ('typ' in option || Array.isArray(option))) {
                        const op = Array.isArray(option) ? option : [option];
                        for (const o of op) {
                            map.set(o, map.get(value) ?? root);
                        }
                        stack[reverse ? 'push' : 'unshift'](...op);
                    }
                }
            }
            previous = value;
        }
    }

    /**
     * feature walk mode
     *
     * @internal
     */
    exports.FeatureWalkMode = void 0;
    (function (FeatureWalkMode) {
        /**
         * pre process
         */
        FeatureWalkMode[FeatureWalkMode["Pre"] = 1] = "Pre";
        /**
         * post process
         */
        FeatureWalkMode[FeatureWalkMode["Post"] = 2] = "Post";
    })(exports.FeatureWalkMode || (exports.FeatureWalkMode = {}));

    const config$1 = getSyntaxConfig();
    function replacePseudo(tokens) {
        return tokens.map((raw) => raw.map(r => {
            if (r.includes('(')) {
                const index = r.indexOf('(');
                const name = r.slice(0, index) + '()';
                if (name in pseudoAliasMap) {
                    return pseudoAliasMap[name] + r.slice(index);
                }
                return r;
            }
            return r in pseudoAliasMap && pseudoAliasMap[r] in config$1["selectors" /* ValidationSyntaxGroupEnum.Selectors */] ? pseudoAliasMap[r] : r;
        }));
    }
    function replaceAstNodes(tokens, root) {
        let result = false;
        for (const { value, parent } of walkValues(tokens, root)) {
            if (value.typ == exports.EnumToken.IdenTokenType || value.typ == exports.EnumToken.PseudoClassFuncTokenType || value.typ == exports.EnumToken.PseudoClassTokenType || value.typ == exports.EnumToken.PseudoElementTokenType) {
                let key = value.val + (value.typ == exports.EnumToken.PseudoClassFuncTokenType ? '()' : '');
                if (key in pseudoAliasMap) {
                    const isPseudClass = pseudoAliasMap[key].startsWith('::');
                    value.val = pseudoAliasMap[key];
                    if (value.typ == exports.EnumToken.IdenTokenType &&
                        ['min-resolution', 'max-resolution'].includes(value.val) &&
                        parent?.typ == exports.EnumToken.MediaQueryConditionTokenType &&
                        parent.r?.[0]?.typ == exports.EnumToken.NumberTokenType) {
                        Object.assign(parent.r?.[0], {
                            typ: exports.EnumToken.ResolutionTokenType,
                            unit: 'x',
                        });
                    }
                    else if (isPseudClass && value.typ == exports.EnumToken.PseudoElementTokenType) {
                        // @ts-ignore
                        value.typ = exports.EnumToken.PseudoClassTokenType;
                    }
                    result = true;
                }
            }
        }
        return result;
    }
    class ComputePrefixFeature {
        get ordering() {
            return 2;
        }
        get processMode() {
            return exports.FeatureWalkMode.Pre;
        }
        static register(options) {
            if (options.removePrefix) {
                // @ts-ignore
                options.features.push(new ComputePrefixFeature(options));
            }
        }
        run(node) {
            if (node.typ == exports.EnumToken.RuleNodeType) {
                node.sel = replacePseudo(splitRule(node.sel)).reduce((acc, curr, index) => acc + (index > 0 ? ',' : '') + curr.join(''), '');
                // if ((node as AstRule).raw != null) {
                //
                //     (node as AstRule).raw = replacePseudo((node as AstRule).raw as string[][]);
                // }
                //
                // if ((node as AstRule).optimized != null) {
                //
                //     (node as AstRule).optimized!.selector = replacePseudo((node as AstRule).optimized!.selector as string[][]);
                // }
                if (node.tokens != null) {
                    replaceAstNodes(node.tokens);
                }
            }
            else if (node.typ == exports.EnumToken.DeclarationNodeType) {
                if (node.nam.charAt(0) == '-') {
                    const match = node.nam.match(/^-([^-]+)-(.+)$/);
                    if (match != null) {
                        let nam = match[2];
                        if (!(nam in config$1.declarations)) {
                            if (node.nam in pseudoAliasMap) {
                                nam = pseudoAliasMap[node.nam];
                            }
                        }
                        if (nam in config$1.declarations) {
                            node.nam = nam;
                        }
                    }
                }
                let hasPrefix = false;
                for (const { value } of walkValues(node.val)) {
                    if ((value.typ == exports.EnumToken.IdenTokenType || (value.typ != exports.EnumToken.ParensTokenType && funcLike.includes(value.typ))) && value.val.match(/^-([^-]+)-(.+)$/) != null) {
                        if (value.val.endsWith('-gradient')) {
                            // not supported yet
                            break;
                        }
                        hasPrefix = true;
                        break;
                    }
                }
                if (hasPrefix) {
                    const nodes = structuredClone(node.val);
                    for (const { value } of walkValues(nodes)) {
                        if ((value.typ == exports.EnumToken.IdenTokenType || funcLike.includes(value.typ))) {
                            const match = value.val.match(/^-([^-]+)-(.+)$/);
                            if (match != null) {
                                value.val = match[2];
                            }
                        }
                    }
                    // @ts-ignore
                    if (SyntaxValidationResult.Valid == evaluateSyntax({ ...node, val: nodes }, {}).valid) {
                        node.val = nodes;
                    }
                }
            }
            else if (node.typ == exports.EnumToken.AtRuleNodeType || node.typ == exports.EnumToken.KeyframesAtRuleNodeType) {
                if (node.nam.startsWith('-')) {
                    const match = node.nam.match(/^-([^-]+)-(.+)$/);
                    if (match != null && '@' + match[2] in config$1.atRules) {
                        node.nam = match[2];
                    }
                }
                if (node.typ == exports.EnumToken.AtRuleNodeType && node.val !== '') {
                    if (replaceAstNodes(node.tokens)) {
                        node.val = node.tokens.reduce((acc, curr) => acc + renderToken(curr), '');
                    }
                }
            }
            return node;
        }
    }

    function inlineExpression(token) {
        const result = [];
        if (token.typ == exports.EnumToken.BinaryExpressionTokenType) {
            result.push({
                typ: exports.EnumToken.ParensTokenType,
                chi: [...inlineExpression(token.l), { typ: token.op }, ...inlineExpression(token.r)]
            });
        }
        else {
            result.push(token);
        }
        return result;
    }
    function replace(node, variableScope) {
        for (const { value, parent: parentValue } of walkValues(node.val)) {
            if (value.typ == exports.EnumToken.BinaryExpressionTokenType && parentValue != null && 'chi' in parentValue) {
                // @ts-ignore
                parentValue.chi.splice(parentValue.chi.indexOf(value), 1, ...inlineExpression(value));
            }
        }
        for (const { value, parent: parentValue } of walkValues(node.val)) {
            if (value.typ == exports.EnumToken.FunctionTokenType && value.val == 'var') {
                if (value.chi.length == 1 && value.chi[0].typ == exports.EnumToken.DashedIdenTokenType) {
                    const info = variableScope.get(value.chi[0].val);
                    if (info?.replaceable) {
                        if (parentValue != null) {
                            let i = 0;
                            for (; i < parentValue.chi.length; i++) {
                                if (parentValue.chi[i] == value) {
                                    parentValue.chi.splice(i, 1, ...info.node.val);
                                    break;
                                }
                            }
                        }
                        else {
                            node.val = info.node.val.slice();
                        }
                    }
                }
            }
        }
    }
    class InlineCssVariablesFeature {
        accept = new Set([exports.EnumToken.RuleNodeType, exports.EnumToken.AtRuleNodeType]);
        get ordering() {
            return 0;
        }
        get processMode() {
            return exports.FeatureWalkMode.Pre;
        }
        static register(options) {
            if (options.inlineCssVariables) {
                // @ts-ignore
                options.features.push(new InlineCssVariablesFeature());
            }
        }
        run(ast, options = {}, parent, context) {
            // if (!('chi' in ast)) {
            //
            //     return null;
            // }
            if (!('variableScope' in context)) {
                context.variableScope = new Map;
            }
            // [':root', 'html']
            const isRoot = parent.typ == exports.EnumToken.StyleSheetNodeType && ast.typ == exports.EnumToken.RuleNodeType && (ast.raw ?? splitRule(ast.sel)).some(segment => segment.some(s => s == ':root' || s == 'html'));
            const variableScope = context.variableScope;
            // @ts-ignore
            for (const node of ast.chi) {
                if (node.typ != exports.EnumToken.DeclarationNodeType) {
                    continue;
                }
                // css variable
                if (node.nam.startsWith('--')) {
                    if (!variableScope.has(node.nam)) {
                        const info = {
                            globalScope: isRoot,
                            // @ts-ignore
                            parent: new Set(),
                            declarationCount: 1,
                            replaceable: isRoot,
                            node: node,
                            values: structuredClone(node.val)
                        };
                        info.parent.add(ast);
                        variableScope.set(node.nam, info);
                        let recursive = false;
                        for (const { value } of walkValues(node.val)) {
                            if (value?.typ == exports.EnumToken.FunctionTokenType && (mathFuncs.includes(value.val) || value.val == 'var')) {
                                recursive = true;
                                break;
                            }
                        }
                        if (recursive) {
                            replace(node, variableScope);
                        }
                    }
                }
                else {
                    replace(node, variableScope);
                }
            }
            return null;
        }
        cleanup(ast, options = {}, context) {
            const variableScope = context.variableScope;
            // if (variableScope == null) {
            //
            //     return;
            // }
            for (const info of variableScope.values()) {
                if (info.replaceable) {
                    let i;
                    // drop declarations from :root{}
                    for (const parent of info.parent) {
                        i = parent.chi?.length ?? 0;
                        while (i--) {
                            if (parent.chi[i] == info.node) {
                                // @ts-ignore
                                parent.chi.splice(i, 1, {
                                    typ: exports.EnumToken.CommentTokenType,
                                    val: `/* ${info.node.nam}: ${info.values.reduce((acc, curr) => acc + renderToken(curr, { convertColor: false }), '')} */`
                                });
                                break;
                            }
                        }
                    }
                }
            }
        }
    }

    function dedup(values) {
        for (const value of values) {
            let i = value.length;
            while (i-- > 1) {
                const t = value[i];
                const k = value[i == 1 ? 0 : i % 2];
                if (t.val == k.val && t.val == 0) {
                    if ((t.typ == exports.EnumToken.NumberTokenType && isLength(k)) ||
                        (k.typ == exports.EnumToken.NumberTokenType && isLength(t)) ||
                        (isLength(k) || isLength(t))) {
                        value.splice(i, 1);
                        continue;
                    }
                }
                if (eq(t, k)) {
                    value.splice(i, 1);
                    continue;
                }
                break;
            }
        }
        return values;
    }
    class PropertySet {
        config;
        declarations;
        constructor(config) {
            this.config = config;
            this.declarations = new Map;
        }
        add(declaration) {
            if (declaration.nam == this.config.shorthand) {
                this.declarations = new Map;
            }
            else {
                // expand shorthand
                if (declaration.nam != this.config.shorthand && this.declarations.has(this.config.shorthand)) {
                    let isValid = true;
                    let current = -1;
                    const tokens = [];
                    // @ts-ignore
                    for (let token of this.declarations.get(this.config.shorthand).val) {
                        // @ts-ignore
                        if (this.config.types.some(t => token.typ == exports.EnumToken[t]) || (token.typ == exports.EnumToken.NumberTokenType && token.val == 0 &&
                            (this.config.types.includes('Length') ||
                                this.config.types.includes('Angle') ||
                                this.config.types.includes('Dimension')))) {
                            if (tokens.length == 0) {
                                tokens.push([]);
                                current++;
                            }
                            tokens[current].push(token);
                            continue;
                        }
                        if (token.typ != exports.EnumToken.WhitespaceTokenType && token.typ != exports.EnumToken.CommentTokenType) {
                            if (token.typ == exports.EnumToken.IdenTokenType && this.config.keywords.includes(token.val)) {
                                if (tokens.length == 0) {
                                    tokens.push([]);
                                    current++;
                                }
                                tokens[current].push(token);
                            }
                            // @ts-ignore
                            if (token.typ == exports.EnumToken.LiteralTokenType && token.val == this.config.separator) {
                                tokens.push([]);
                                current++;
                                continue;
                            }
                            isValid = false;
                            break;
                        }
                    }
                    if (isValid && tokens.length > 0) {
                        this.declarations.delete(this.config.shorthand);
                        for (const values of tokens) {
                            this.config.properties.forEach((property, index) => {
                                if (!this.declarations.has(property)) {
                                    this.declarations.set(property, {
                                        typ: exports.EnumToken.DeclarationNodeType,
                                        nam: property,
                                        val: []
                                    });
                                }
                                while (index > 0 && index >= values.length) {
                                    if (index > 1) {
                                        index %= 2;
                                    }
                                    else {
                                        index = 0;
                                        break;
                                    }
                                }
                                // @ts-ignore
                                const val = this.declarations.get(property).val;
                                if (val.length > 0) {
                                    val.push({ typ: exports.EnumToken.WhitespaceTokenType });
                                }
                                val.push({ ...values[index] });
                            });
                        }
                    }
                    this.declarations.set(declaration.nam, declaration);
                    return this;
                }
            }
            this.declarations.set(declaration.nam, declaration);
            return this;
        }
        isShortHand() {
            if (this.declarations.has(this.config.shorthand)) {
                return this.declarations.size == 1;
            }
            return this.config.properties.length == this.declarations.size;
        }
        [Symbol.iterator]() {
            let iterator;
            const declarations = this.declarations;
            if (declarations.size < this.config.properties.length) {
                const values = [...declarations.values()];
                if (this.isShortHand()) {
                    const val = values[0].val.reduce((acc, curr) => {
                        if (![exports.EnumToken.WhitespaceTokenType, exports.EnumToken.CommentTokenType].includes(curr.typ)) {
                            acc.push(curr);
                        }
                        return acc;
                    }, []);
                    values[0].val = val.reduce((acc, curr) => {
                        if (acc.length > 0) {
                            acc.push({ typ: exports.EnumToken.WhitespaceTokenType });
                        }
                        acc.push(curr);
                        return acc;
                    }, []);
                }
                return values[Symbol.iterator]();
            }
            else {
                const values = [];
                this.config.properties.forEach((property) => {
                    let index = 0;
                    // @ts-ignore
                    for (const token of this.declarations.get(property).val) {
                        if (token.typ == exports.EnumToken.WhitespaceTokenType) {
                            continue;
                        }
                        if (values.length == index) {
                            values.push([]);
                        }
                        values[index].push(token);
                        index++;
                    }
                });
                dedup(values);
                iterator = [{
                        typ: exports.EnumToken.DeclarationNodeType,
                        nam: this.config.shorthand,
                        val: values.reduce((acc, curr) => {
                            if (curr.length > 1) {
                                const k = curr.length * 2 - 1;
                                let i = 1;
                                while (i < k) {
                                    curr.splice(i, 0, { typ: exports.EnumToken.WhitespaceTokenType });
                                    i += 2;
                                }
                            }
                            if (acc.length > 0) {
                                // @ts-ignore
                                acc.push({ typ: exports.EnumToken.LiteralTokenType, val: this.config.separator });
                            }
                            acc.push(...curr);
                            return acc;
                        }, [])
                    }][Symbol.iterator]();
            }
            return iterator;
        }
    }

    const propertiesConfig = getConfig();
    class PropertyMap {
        config;
        declarations;
        requiredCount;
        pattern;
        constructor(config) {
            const values = Object.values(config.properties);
            this.requiredCount = values.reduce((acc, curr) => curr.required ? ++acc : acc, 0) || values.length;
            this.config = config;
            this.declarations = new Map;
            this.pattern = config.pattern.split(/\s/);
        }
        add(declaration) {
            if (declaration.nam == this.config.shorthand) {
                this.declarations = new Map;
                this.declarations.set(declaration.nam, declaration);
                this.matchTypes(declaration);
            }
            else {
                const separator = this.config.separator != null ? {
                    ...this.config.separator,
                    // @ts-ignore
                    typ: exports.EnumToken[this.config.separator.typ]
                } : null;
                // expand shorthand
                if (declaration.nam != this.config.shorthand && this.declarations.has(this.config.shorthand)) {
                    const tokens = {};
                    const values = [];
                    // @ts-ignore
                    this.declarations.get(this.config.shorthand).val.slice().reduce((acc, curr) => {
                        // @ts-ignore
                        if (separator != null && separator.typ == curr.typ && separator.val == curr.val) {
                            acc.push([]);
                            return acc;
                        }
                        // @ts-ignore
                        acc.at(-1).push(curr);
                        return acc;
                    }, [[]]).
                        // @ts-ignore
                        reduce((acc, list, current) => {
                        values.push(...this.pattern.reduce((acc, property) => {
                            // let current: number = 0;
                            const props = this.config.properties[property];
                            for (let i = 0; i < acc.length; i++) {
                                if (acc[i].typ == exports.EnumToken.CommentTokenType || acc[i].typ == exports.EnumToken.WhitespaceTokenType) {
                                    acc.splice(i, 1);
                                    i--;
                                    continue;
                                }
                                // @ts-ignore
                                if (('propertyName' in acc[i] && acc[i].propertyName == property) || matchType(acc[i], props)) {
                                    if ('prefix' in props && props.previous != null && !(props.previous in tokens)) {
                                        return acc;
                                    }
                                    if (!(property in tokens)) {
                                        tokens[property] = [[acc[i]]];
                                    }
                                    else {
                                        if (current == tokens[property].length) {
                                            tokens[property].push([acc[i]]);
                                        }
                                        else {
                                            tokens[property][current].push({ typ: exports.EnumToken.WhitespaceTokenType }, acc[i]);
                                        }
                                    }
                                    acc.splice(i, 1);
                                    i--;
                                    // @ts-ignore
                                    if ('prefix' in props && acc[i]?.typ == exports.EnumToken[props.prefix.typ]) {
                                        // @ts-ignore
                                        if (acc[i].typ == exports.EnumToken[props.prefix.typ] && acc[i].val == this.config.properties[property].prefix.val) {
                                            acc.splice(i, 1);
                                            i--;
                                        }
                                    }
                                    if (props.multiple) {
                                        continue;
                                    }
                                    return acc;
                                }
                                else {
                                    if (property in tokens && tokens[property].length > current) {
                                        return acc;
                                    }
                                }
                            }
                            if (property in tokens && tokens[property].length > current) {
                                return acc;
                            }
                            // default
                            if (props.default.length > 0) {
                                const defaults = parseString(props.default[0]);
                                if (!(property in tokens)) {
                                    tokens[property] = [
                                        [...defaults]
                                    ];
                                }
                                else {
                                    if (current == tokens[property].length) {
                                        tokens[property].push([]);
                                        tokens[property][current].push(...defaults);
                                    }
                                    else {
                                        tokens[property][current].push({ typ: exports.EnumToken.WhitespaceTokenType }, ...defaults);
                                    }
                                }
                            }
                            return acc;
                        }, list));
                        return values;
                    }, []);
                    if (values.length == 0) {
                        this.declarations = Object.entries(tokens).reduce((acc, curr) => {
                            acc.set(curr[0], {
                                typ: exports.EnumToken.DeclarationNodeType,
                                nam: curr[0],
                                val: curr[1].reduce((acc, curr) => {
                                    if (acc.length > 0) {
                                        acc.push({ ...separator });
                                    }
                                    acc.push(...curr);
                                    return acc;
                                }, [])
                            });
                            return acc;
                        }, new Map);
                    }
                }
                // @ts-ignore
                const config = propertiesConfig.properties[declaration.nam];
                let property = declaration.nam;
                if (config != null) {
                    property = config.shorthand;
                    let value = this.declarations.get(property);
                    if (!(value instanceof PropertySet)) {
                        // @ts-ignore
                        this.declarations.set(property, new PropertySet(propertiesConfig.properties[config.shorthand]));
                        // Token[]
                        if (value != null) {
                            // @ts-ignore
                            this.declarations.get(property).add(value);
                        }
                    }
                    this.declarations.get(property).add(declaration);
                }
                else {
                    this.declarations.set(declaration.nam, declaration);
                }
            }
            return this;
        }
        [Symbol.iterator]() {
            let iterable;
            let requiredCount = 0;
            let property;
            let isShorthand = true;
            for (property of Object.keys(this.config.properties)) {
                if (this.config.properties[property].required) {
                    if (!this.declarations.has(property)) {
                        isShorthand = false;
                        break;
                    }
                    else {
                        const val = this.declarations.get(property);
                        if (val instanceof PropertySet && !val.isShortHand()) {
                            isShorthand = false;
                            break;
                        }
                        else {
                            requiredCount++;
                        }
                    }
                }
            }
            if (requiredCount == 0) {
                requiredCount = this.declarations.size;
            }
            if (!isShorthand || requiredCount < this.requiredCount) {
                if (isShorthand && this.declarations.has(this.config.shorthand)) {
                    const cache = new Map();
                    const removeDefaults = (declaration) => {
                        let i;
                        let t;
                        let map = new Map();
                        let value = [];
                        let values = [];
                        // @ts-ignore
                        let typ = (exports.EnumToken[this.config.separator?.typ] ?? exports.EnumToken.CommaTokenType);
                        // @ts-ignore
                        const sep = this.config.separator == null ? null : {
                            ...this.config.separator,
                            typ: exports.EnumToken[this.config.separator.typ]
                        };
                        // @ts-ignore
                        const separator = this.config.separator ? renderToken({
                            ...this.config.separator,
                            typ: exports.EnumToken[this.config.separator.typ]
                        }) : ',';
                        this.matchTypes(declaration);
                        values.push(value);
                        for (i = 0; i < declaration.val.length; i++) {
                            t = declaration.val[i];
                            if (!cache.has(t)) {
                                cache.set(t, renderToken(t, { minify: true }));
                            }
                            if (t.typ == typ && separator == cache.get(t)) {
                                this.removeDefaults(map, value);
                                value = [];
                                values.push(value);
                                map.clear();
                                continue;
                            }
                            value.push(t);
                            // @ts-ignore
                            if ('propertyName' in t) {
                                // @ts-ignore
                                if (!map.has(t.propertyName)) {
                                    // @ts-ignore
                                    map.set(t.propertyName, { t: [t], value: [cache.get(t)] });
                                }
                                else {
                                    // @ts-ignore
                                    const v = map.get(t.propertyName);
                                    v.t.push(t);
                                    v.value.push(cache.get(t));
                                }
                            }
                        }
                        this.removeDefaults(map, value);
                        declaration.val = values.reduce((acc, curr) => {
                            if (sep != null && acc.length > 0) {
                                acc.push({ ...sep });
                            }
                            for (const cr of curr) {
                                if (cr.typ == exports.EnumToken.WhitespaceTokenType && acc.at(-1)?.typ == cr.typ) {
                                    continue;
                                }
                                acc.push(cr);
                            }
                            return acc;
                        }, []);
                        while (declaration.val.at(-1)?.typ == exports.EnumToken.WhitespaceTokenType) {
                            declaration.val.pop();
                        }
                        while (declaration.val.at(0)?.typ == exports.EnumToken.WhitespaceTokenType) {
                            declaration.val.shift();
                        }
                        return declaration;
                    };
                    const values = [...this.declarations.values()].reduce((acc, curr) => {
                        if (curr instanceof PropertySet) {
                            acc.push(...curr);
                        }
                        else {
                            acc.push(curr);
                        }
                        return acc;
                    }, []);
                    let isImportant = false;
                    const filtered = values.map(removeDefaults).filter((x) => x.val.filter((t) => {
                        if (t.typ == exports.EnumToken.ImportantTokenType) {
                            isImportant = true;
                        }
                        return ![exports.EnumToken.WhitespaceTokenType, exports.EnumToken.ImportantTokenType].includes(t.typ);
                    }).length > 0);
                    if (filtered.length == 0 && this.config.default.length > 0) {
                        filtered.push({
                            typ: exports.EnumToken.DeclarationNodeType,
                            nam: this.config.shorthand,
                            val: parseString(this.config.default[0])
                        });
                        if (isImportant) {
                            filtered[0].val.push({
                                typ: exports.EnumToken.ImportantTokenType
                            });
                        }
                    }
                    return (filtered.length > 0 ? filtered : values)[Symbol.iterator]();
                }
                for (const declaration of this.declarations.values()) {
                    if (declaration instanceof PropertySet) {
                        continue;
                    }
                    const config = declaration.nam == this.config.shorthand ? this.config : this.config.properties[declaration.nam] ?? this.config;
                    if (!('mapping' in config)) {
                        continue;
                    }
                    // @ts-ignore
                    for (const [key, val] of Object.entries(config.mapping)) {
                        const keys = parseString(key);
                        if (keys.length != declaration.val.length) {
                            continue;
                        }
                        if (eq(declaration.val, keys)) {
                            declaration.val = parseString(val);
                            break;
                        }
                    }
                }
                // @ts-ignore
                iterable = this.declarations.values();
            }
            else {
                let count = 0;
                let match;
                const separator = this.config.separator != null ? {
                    ...this.config.separator,
                    // @ts-ignore
                    typ: exports.EnumToken[this.config.separator.typ]
                } : null;
                const tokens = {};
                // @ts-ignore
                Object.entries(this.config.properties).reduce((acc, curr) => {
                    if (!this.declarations.has(curr[0])) {
                        if (curr[1].required) {
                            acc.push(curr[0]);
                        }
                        return acc;
                    }
                    let current = 0;
                    const props = this.config.properties[curr[0]];
                    const properties = this.declarations.get(curr[0]);
                    for (const declaration of [(properties instanceof PropertySet ? [...properties][0] : properties)]) {
                        // @ts-ignore
                        for (const val of declaration.val) {
                            // @ts-ignore
                            if (separator != null && separator.typ == val.typ && separator.val == val.val) {
                                current++;
                                if (tokens[curr[0]].length == current) {
                                    tokens[curr[0]].push([]);
                                }
                                continue;
                            }
                            if (val.typ == exports.EnumToken.WhitespaceTokenType || val.typ == exports.EnumToken.CommentTokenType) {
                                continue;
                            }
                            // @ts-ignore
                            if (props.multiple && props.separator != null &&
                                // @ts-ignore
                                exports.EnumToken[props.separator.typ] == val.typ &&
                                // @ts-ignore
                                props.separator.val == val.val) {
                                continue;
                            }
                            // @ts-ignore
                            match = val.typ == exports.EnumToken.CommentTokenType || matchType(val, curr[1]);
                            if (isShorthand) {
                                isShorthand = match;
                            }
                            // @ts-ignore
                            if (('propertyName' in val && val.propertyName == property) || match) {
                                if (!(curr[0] in tokens)) {
                                    tokens[curr[0]] = [[]];
                                }
                                // is default value
                                tokens[curr[0]][current].push(val);
                            }
                            else {
                                acc.push(curr[0]);
                                break;
                            }
                        }
                    }
                    if (count == 0) {
                        count = current;
                    }
                    return acc;
                }, []);
                count++;
                if (!isShorthand || Object.entries(this.config.properties).some((entry) => {
                    // missing required property
                    return entry[1].required && !(entry[0] in tokens);
                }) ||
                    // @ts-ignore
                    !Object.values(tokens).every((v) => v.filter((t) => t.typ != exports.EnumToken.CommentTokenType).length == count)) {
                    // @ts-ignore
                    iterable = this.declarations.values();
                }
                else {
                    let values = Object.entries(tokens).reduce((acc, curr) => {
                        const props = this.config.properties[curr[0]];
                        for (let i = 0; i < curr[1].length; i++) {
                            if (acc.length == i) {
                                acc.push([]);
                            }
                            let values = curr[1][i].reduce((acc, curr) => {
                                if (acc.length > 0) {
                                    acc.push({ typ: exports.EnumToken.WhitespaceTokenType });
                                }
                                acc.push(curr);
                                return acc;
                            }, []);
                            if (props.default.includes(curr[1][i].reduce((acc, curr) => acc + renderToken(curr) + ' ', '').trimEnd())) {
                                if (!this.config.properties[curr[0]].required) {
                                    continue;
                                }
                            }
                            // remove default values
                            let doFilterDefault = true;
                            if (curr[0] in propertiesConfig.properties) {
                                for (let v of values) {
                                    if (![exports.EnumToken.WhitespaceTokenType, exports.EnumToken.CommentTokenType, exports.EnumToken.IdenTokenType].includes(v.typ)
                                        || (v.typ == exports.EnumToken.IdenTokenType && !this.config.properties[curr[0]].default.includes(v.val))) {
                                        doFilterDefault = false;
                                        break;
                                    }
                                }
                            }
                            // remove default values
                            const filtered = values.filter((val) => {
                                if (val.typ == exports.EnumToken.WhitespaceTokenType || val.typ == exports.EnumToken.CommentTokenType) {
                                    return false;
                                }
                                return !doFilterDefault || !(val.typ == exports.EnumToken.IdenTokenType && props.default.includes(val.val));
                            });
                            if (filtered.length > 0 || !(this.requiredCount == requiredCount && this.config.properties[curr[0]].required)) {
                                values = filtered;
                            }
                            if (values.length > 0) {
                                if ('mapping' in props) {
                                    // @ts-ignore
                                    if (!('constraints' in props) || !('max' in props.constraints) || values.length <= props.constraints.mapping.max) {
                                        let i = values.length;
                                        while (i--) {
                                            // @ts-ignore
                                            if (values[i].typ == exports.EnumToken.IdenTokenType && values[i].val in props.mapping) {
                                                // @ts-ignore
                                                values.splice(i, 1, ...parseString(props.mapping[values[i].val]));
                                            }
                                        }
                                    }
                                }
                                if ('prefix' in props) {
                                    // @ts-ignore
                                    acc[i].push({ ...props.prefix, typ: exports.EnumToken[props.prefix.typ] });
                                }
                                else if (acc[i].length > 0) {
                                    acc[i].push({ typ: exports.EnumToken.WhitespaceTokenType });
                                }
                                acc[i].push(...values.reduce((acc, curr) => {
                                    if (acc.length > 0) {
                                        // @ts-ignore
                                        acc.push({
                                            ...((props.separator && {
                                                ...props.separator,
                                                // @ts-ignore
                                                typ: exports.EnumToken[props.separator.typ]
                                            }) ?? { typ: exports.EnumToken.WhitespaceTokenType })
                                        });
                                    }
                                    // @ts-ignore
                                    acc.push(curr);
                                    return acc;
                                }, []));
                            }
                        }
                        return acc;
                    }, []).reduce((acc, curr) => {
                        if (acc.length > 0) {
                            acc.push({ ...separator });
                        }
                        if (curr.length == 0 && this.config.default.length > 0) {
                            curr.push(...parseString(this.config.default[0]).reduce((acc, curr) => {
                                if (acc.length > 0) {
                                    acc.push({ typ: exports.EnumToken.WhitespaceTokenType });
                                }
                                acc.push(curr);
                                return acc;
                            }, []));
                        }
                        acc.push(...curr);
                        return acc;
                    }, []);
                    if (this.config.mapping != null) {
                        const val = values.reduce((acc, curr) => acc + renderToken(curr, {
                            removeComments: true,
                            minify: true
                        }), '');
                        if (val in this.config.mapping) {
                            values.length = 0;
                            values.push({
                                typ: ['"', "'"].includes(val.charAt(0)) ? exports.EnumToken.StringTokenType : exports.EnumToken.IdenTokenType,
                                // @ts-ignore
                                val: this.config.mapping[val]
                            });
                        }
                    }
                    // @ts-ignore
                    if (values.length == 1 &&
                        // @ts-ignore
                        typeof values[0].val == 'string' &&
                        this.config.default.includes(values[0].val.toLowerCase()) &&
                        this.config.default[0] != values[0].val.toLowerCase()) {
                        // @ts-ignore/
                        values = parseString(this.config.default[0]);
                    }
                    iterable = [{
                            typ: exports.EnumToken.DeclarationNodeType,
                            nam: this.config.shorthand,
                            val: values
                        }][Symbol.iterator]();
                }
            }
            const iterators = [];
            return {
                // @ts-ignore
                next() {
                    let v = iterable.next();
                    // @ts-ignore
                    while (v.done || v.value instanceof PropertySet) {
                        if (v.value instanceof PropertySet) {
                            // @ts-ignore
                            iterators.push(iterable);
                            iterable = v.value[Symbol.iterator]();
                            v = iterable.next();
                        }
                        if (v.done) {
                            if (iterators.length > 0) {
                                // @ts-ignore
                                iterable = iterators.pop();
                                v = iterable.next();
                            }
                            if (v.done && iterators.length == 0) {
                                break;
                            }
                        }
                    }
                    return v;
                }
            };
        }
        matchTypes(declaration) {
            const patterns = this.pattern.slice();
            const values = [...declaration.val];
            let i;
            let j;
            const map = new Map;
            for (i = 0; i < patterns.length; i++) {
                for (j = 0; j < values.length; j++) {
                    if (!map.has(patterns[i])) {
                        // @ts-ignore
                        map.set(patterns[i], this.config.properties?.[patterns[i]]?.constraints?.mapping?.max ?? 1);
                    }
                    let count = map.get(patterns[i]);
                    if (count > 0 && matchType(values[j], this.config.properties[patterns[i]])) {
                        Object.defineProperty(values[j], 'propertyName', {
                            enumerable: false,
                            writable: true,
                            value: patterns[i]
                        });
                        map.set(patterns[i], --count);
                        values.splice(j--, 1);
                    }
                }
            }
            if (this.config.set != null) {
                for (const [key, val] of Object.entries(this.config.set)) {
                    if (map.has(key)) {
                        for (const v of val) {
                            // missing
                            if (map.get(v) == 1) {
                                let i = declaration.val.length;
                                while (i--) {
                                    // @ts-ignore
                                    if (declaration.val[i].propertyName == key) {
                                        const val = { ...declaration.val[i] };
                                        Object.defineProperty(val, 'propertyName', {
                                            enumerable: false,
                                            writable: true,
                                            value: v
                                        });
                                        declaration.val.splice(i, 0, val, { typ: exports.EnumToken.WhitespaceTokenType });
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        removeDefaults(map, value) {
            for (const [key, val] of map) {
                const config = this.config.properties[key];
                if (config == null) {
                    continue;
                }
                const v = val.value.join(' ');
                if (config.default.includes(v) || (value.length == 1 && this.config.default.includes(v))) {
                    for (const token of value) {
                        if (val.t.includes(token)) {
                            let index = value.indexOf(token);
                            value.splice(index, 1);
                            if (config.prefix != null) {
                                while (index-- > 0) {
                                    if (value[index].typ == exports.EnumToken.WhitespaceTokenType) {
                                        continue;
                                    }
                                    // @ts-ignore@
                                    if (value[index].typ == exports.EnumToken[config.prefix.typ] &&
                                        // @ts-ignore
                                        value[index].val == config.prefix.val) {
                                        value.splice(index, 1);
                                        break;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    const config = getConfig();
    class PropertyList {
        options = { removeDuplicateDeclarations: true, computeShorthand: true };
        declarations;
        constructor(options = {}) {
            this.options = options;
            this.declarations = new Map;
        }
        set(nam, value) {
            return this.add({
                typ: exports.EnumToken.DeclarationNodeType,
                nam,
                val: Array.isArray(value) ? value : parseString(String(value))
            });
        }
        add(...declarations) {
            let name;
            for (const declaration of declarations) {
                name = declaration.typ != exports.EnumToken.DeclarationNodeType ? null : declaration.nam.toLowerCase();
                if (declaration.typ != exports.EnumToken.DeclarationNodeType ||
                    'composes' === name ||
                    (typeof this.options.removeDuplicateDeclarations === 'string' && this.options.removeDuplicateDeclarations === name) ||
                    (Array.isArray(this.options.removeDuplicateDeclarations) ? this.options.removeDuplicateDeclarations.includes(declaration.nam) : !this.options.removeDuplicateDeclarations)) {
                    this.declarations.set(Number(Math.random().toString().slice(2)).toString(36), declaration);
                    continue;
                }
                if (!this.options.computeShorthand) {
                    this.declarations.set(declaration.nam, declaration);
                    continue;
                }
                let propertyName = declaration.nam;
                let shortHandType;
                let shorthand;
                if (propertyName in config.properties) {
                    // @ts-ignore
                    if ('map' in config.properties[propertyName]) {
                        shortHandType = 'map';
                        // @ts-ignore
                        shorthand = config.properties[propertyName].map;
                    }
                    else {
                        shortHandType = 'set';
                        // @ts-ignore
                        shorthand = config.properties[propertyName].shorthand;
                    }
                }
                else if (propertyName in config.map) {
                    shortHandType = 'map';
                    // @ts-ignore
                    shorthand = config.map[propertyName].shorthand;
                }
                // @ts-ignore
                if (shortHandType == 'map') {
                    // @ts-ignore
                    if (!this.declarations.has(shorthand)) {
                        // @ts-ignore
                        this.declarations.set(shorthand, new PropertyMap(config.map[shorthand]));
                    }
                    // @ts-ignore
                    this.declarations.get(shorthand).add(declaration);
                    // return this;
                }
                // @ts-ignore
                else if (shortHandType == 'set') {
                    // @ts-ignore
                    // const shorthand: string = <string>config.properties[propertyName].shorthand;
                    if (!this.declarations.has(shorthand)) {
                        // @ts-ignore
                        this.declarations.set(shorthand, new PropertySet(config.properties[shorthand]));
                    }
                    // @ts-ignore
                    this.declarations.get(shorthand).add(declaration);
                    // return this;
                }
                else {
                    this.declarations.set(propertyName, declaration);
                }
            }
            return this;
        }
        [Symbol.iterator]() {
            let iterator = this.declarations.values();
            const iterators = [];
            return {
                next() {
                    let value = iterator.next();
                    while ((value.done && iterators.length > 0) ||
                        value.value instanceof PropertySet ||
                        value.value instanceof PropertyMap) {
                        if (value.value instanceof PropertySet || value.value instanceof PropertyMap) {
                            iterators.unshift(iterator);
                            // @ts-ignore
                            iterator = value.value[Symbol.iterator]();
                            value = iterator.next();
                        }
                        if (value.done && iterators.length > 0) {
                            iterator = iterators.shift();
                            value = iterator.next();
                        }
                    }
                    return value;
                }
            };
        }
    }

    class ComputeShorthandFeature {
        accept = new Set([exports.EnumToken.RuleNodeType, exports.EnumToken.AtRuleNodeType, exports.EnumToken.KeyFramesRuleNodeType]);
        get ordering() {
            return 3;
        }
        get processMode() {
            return exports.FeatureWalkMode.Post;
        }
        static register(options) {
            if (options.computeShorthand) {
                // @ts-ignore
                options.features.push(new ComputeShorthandFeature(options));
            }
        }
        run(ast, options = {}, parent, context) {
            if (!('chi' in ast)) {
                return null;
            }
            // @ts-ignore
            const j = ast.chi.length;
            let k = 0;
            let l;
            let properties = new PropertyList(options);
            const rules = [];
            // @ts-ignore
            for (; k < j; k++) {
                l = k;
                // capture comments with the next token
                while (l + 1 < j) {
                    // @ts-ignore
                    const node = ast.chi[l];
                    if (node.typ == exports.EnumToken.CommentNodeType) {
                        l++;
                        continue;
                    }
                    break;
                }
                // @ts-ignore
                const node = ast.chi[l];
                if (node.typ == exports.EnumToken.DeclarationNodeType) {
                    properties.add(...ast.chi.slice(k, l + 1));
                }
                else {
                    rules.push(...ast.chi.slice(k, l + 1));
                }
                k = l;
            }
            // @ts-ignore
            ast.chi = [...properties, ...rules];
            return ast;
        }
    }

    class ComputeCalcExpressionFeature {
        accept = new Set([exports.EnumToken.RuleNodeType, exports.EnumToken.AtRuleNodeType]);
        get ordering() {
            return 1;
        }
        get processMode() {
            return exports.FeatureWalkMode.Post;
        }
        static register(options) {
            if (options.computeCalcExpression) {
                // @ts-ignore
                options.features.push(new ComputeCalcExpressionFeature());
            }
        }
        run(ast) {
            if (!('chi' in ast)) {
                return null;
            }
            for (const node of ast.chi) {
                if (node.typ != exports.EnumToken.DeclarationNodeType) {
                    continue;
                }
                const set = new Set;
                for (const { value, parent } of walkValues(node.val, node, {
                    event: exports.WalkerEvent.Enter,
                    // @ts-ignore
                    fn(node, parent) {
                        if (parent != null &&
                            // @ts-ignore
                            parent.typ == exports.EnumToken.DeclarationNodeType &&
                            // @ts-ignore
                            parent.val.length == 1 &&
                            node.typ == exports.EnumToken.FunctionTokenType &&
                            mathFuncs.includes(node.val) &&
                            node.chi.length == 1 &&
                            node.chi[0].typ == exports.EnumToken.IdenTokenType) {
                            return exports.WalkerOptionEnum.Ignore;
                        }
                        if ((node.typ == exports.EnumToken.FunctionTokenType && node.val == 'var') || (!mathFuncs.includes(parent.val) && [exports.EnumToken.ColorTokenType, exports.EnumToken.DeclarationNodeType, exports.EnumToken.RuleNodeType, exports.EnumToken.AtRuleNodeType, exports.EnumToken.StyleSheetNodeType].includes(parent?.typ))) {
                            return null;
                        }
                        // @ts-ignore
                        const slice = (node.typ == exports.EnumToken.FunctionTokenType ? node.chi : (node.typ == exports.EnumToken.DeclarationNodeType ? node.val : node.chi))?.slice();
                        if (slice != null && node.typ == exports.EnumToken.FunctionTokenType && mathFuncs.includes(node.val)) {
                            // @ts-ignore
                            const key = 'chi' in node ? 'chi' : 'val';
                            const str1 = renderToken({ ...node, [key]: slice });
                            const str2 = renderToken(node); // values.reduce((acc: string, curr: Token): string => acc + renderToken(curr), '');
                            if (str1.length <= str2.length) {
                                // @ts-ignore
                                node[key] = slice;
                            }
                            return exports.WalkerOptionEnum.Ignore;
                        }
                        return null;
                    }
                })) {
                    if (value != null && value.typ == exports.EnumToken.FunctionTokenType && mathFuncs.includes(value.val)) {
                        if (!set.has(value)) {
                            set.add(value);
                            if (parent != null) {
                                // @ts-ignore
                                const cp = value.typ == exports.EnumToken.FunctionTokenType && mathFuncs.includes(value.val) && value.val != 'calc' ? [value] : (value.typ == exports.EnumToken.DeclarationNodeType ? value.val : value.chi);
                                const values = evaluate(cp);
                                // @ts-ignore
                                const children = parent.typ == exports.EnumToken.DeclarationNodeType ? parent.val : parent.chi;
                                if (values.length == 1 && values[0].typ != exports.EnumToken.BinaryExpressionTokenType) {
                                    for (let i = 0; i < children.length; i++) {
                                        if (children[i] == value) {
                                            children.splice(i, 1, !(parent.typ == exports.EnumToken.FunctionTokenType && parent.val == 'calc') && (typeof values[0].val != 'number' && !(values[0].typ == exports.EnumToken.FunctionTokenType && mathFuncs.includes(values[0].val))) ? {
                                                typ: exports.EnumToken.FunctionTokenType,
                                                val: 'calc',
                                                chi: values
                                            } : values[0]);
                                            break;
                                        }
                                    }
                                }
                                else {
                                    for (let i = 0; i < children.length; i++) {
                                        if (children[i] == value) {
                                            children.splice(i, 1, {
                                                typ: exports.EnumToken.FunctionTokenType,
                                                val: 'calc',
                                                chi: values
                                            });
                                            break;
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
            return null;
        }
    }

    function translateX(x, from) {
        const matrix = identity();
        matrix[3 * 4] = x;
        return multiply(from, matrix);
    }
    function translateY(y, from) {
        const matrix = identity();
        matrix[3 * 4 + 1] = y;
        return multiply(from, matrix);
    }
    function translateZ(z, from) {
        const matrix = identity();
        matrix[3 * 4 + 2] = z;
        return multiply(from, matrix);
    }
    function translate(translate, from) {
        const matrix = identity();
        matrix[3 * 4] = translate[0];
        matrix[3 * 4 + 1] = translate[1] ?? 0;
        return multiply(from, matrix);
    }
    function translate3d(translate, from) {
        const matrix = identity();
        matrix[3 * 4] = translate[0];
        matrix[3 * 4 + 1] = translate[1];
        matrix[3 * 4 + 2] = translate[2];
        return multiply(from, matrix);
    }

    /**
     * angle in radian
     * @param angle
     * @param x
     * @param y
     * @param z
     * @param from
     */
    function rotate3D(angle, x, y, z, from) {
        const matrix = identity();
        const sc = Math.sin(angle / 2) * Math.cos(angle / 2);
        const sq = Math.sin(angle / 2) * Math.sin(angle / 2);
        const norm = Math.sqrt(x * x + y * y + z * z);
        const unit = norm === 0 ? 0 : 1 / norm;
        x *= unit;
        y *= unit;
        z *= unit;
        matrix[0] = 1 - 2 * (y * y + z * z) * sq;
        matrix[1] = 2 * (x * y * sq + z * sc);
        matrix[2] = 2 * (x * z * sq - y * sc);
        matrix[4] = 2 * (x * y * sq - z * sc);
        matrix[4 + 1] = 1 - 2 * (x * x + z * z) * sq;
        matrix[4 + 2] = 2 * (y * z * sq + x * sc);
        matrix[2 * 4] = 2 * (x * z * sq + y * sc);
        matrix[2 * 4 + 1] = 2 * (y * z * sq - x * sc);
        matrix[2 * 4 + 2] = 1 - 2 * (x * x + y * y) * sq;
        return multiply(from, matrix);
    }
    function rotate(angle, from) {
        const matrix = identity();
        matrix[0] = Math.cos(angle);
        matrix[1] = Math.sin(angle);
        matrix[4] = -Math.sin(angle);
        matrix[4 + 1] = Math.cos(angle);
        return multiply(from, matrix);
    }

    function scaleX(x, from) {
        const matrix = identity();
        matrix[0] = x;
        return multiply(from, matrix);
    }
    function scaleY(y, from) {
        const matrix = identity();
        matrix[4 + 1] = y;
        return multiply(from, matrix);
    }
    function scaleZ(z, from) {
        const matrix = identity();
        matrix[2 * 4 + 2] = z;
        return multiply(from, matrix);
    }
    function scale(x, y, from) {
        const matrix = identity();
        matrix[0] = x;
        matrix[4 + 1] = y;
        return multiply(from, matrix);
    }
    function scale3d(x, y, z, from) {
        const matrix = identity();
        matrix[0] = x;
        matrix[4 + 1] = y;
        matrix[2 * 4 + 2] = z;
        return multiply(from, matrix);
    }

    function parseMatrix(mat) {
        if (mat.typ == exports.EnumToken.IdenTokenType) {
            return mat.val == 'none' ? identity() : null;
        }
        const children = mat.chi.filter((t) => t.typ == exports.EnumToken.NumberTokenType || t.typ == exports.EnumToken.IdenTokenType);
        const values = [];
        for (const child of children) {
            if (child.typ != exports.EnumToken.NumberTokenType) {
                return null;
            }
            // @ts-ignore
            values.push(getNumber(child));
        }
        // @ts-ignore
        return matrix(values);
    }
    // use column-major order
    function matrix(values) {
        const matrix = identity();
        if (values.length === 6) {
            matrix[0] = values[0];
            matrix[1] = values[1];
            matrix[4] = values[2];
            matrix[4 + 1] = values[3];
            matrix[3 * 4] = values[4];
            matrix[3 * 4 + 1] = values[5];
        }
        else if (values.length === 16) {
            matrix[0] = values[0];
            matrix[1] = values[1];
            matrix[2] = values[2];
            matrix[3] = values[3];
            matrix[4] = values[4];
            matrix[4 + 1] = values[5];
            matrix[4 + 2] = values[6];
            matrix[4 + 3] = values[7];
            matrix[2 * 4] = values[8];
            matrix[2 * 4 + 1] = values[9];
            matrix[2 * 4 + 2] = values[10];
            matrix[2 * 4 + 3] = values[11];
            matrix[3 * 4] = values[12];
            matrix[3 * 4 + 1] = values[13];
            matrix[3 * 4 + 2] = values[14];
            matrix[3 * 4 + 3] = values[15];
        }
        else {
            return null;
        }
        return matrix;
    }
    function serialize(matrix) {
        matrix = matrix.slice();
        // @ts-ignore
        if (eq(matrix, identity())) {
            return {
                typ: exports.EnumToken.IdenTokenType,
                val: 'none'
            };
        }
        if (is2DMatrix(matrix)) {
            // https://drafts.csswg.org/css-transforms-2/#two-dimensional-subset
            return {
                typ: exports.EnumToken.FunctionTokenType,
                val: 'matrix',
                chi: [
                    matrix[0],
                    matrix[1],
                    matrix[4],
                    matrix[4 + 1],
                    matrix[3 * 4],
                    matrix[3 * 4 + 1]
                ].reduce((acc, t) => {
                    if (acc.length > 0) {
                        acc.push({ typ: exports.EnumToken.CommaTokenType });
                    }
                    acc.push({
                        typ: exports.EnumToken.NumberTokenType,
                        val: t
                    });
                    return acc;
                }, [])
            };
        }
        return {
            typ: exports.EnumToken.FunctionTokenType,
            val: 'matrix3d',
            chi: matrix.reduce((acc, curr) => {
                if (acc.length > 0) {
                    acc.push({ typ: exports.EnumToken.CommaTokenType });
                }
                acc.push({
                    typ: exports.EnumToken.NumberTokenType,
                    val: curr
                });
                return acc;
            }, [])
        };
    }

    // translate → rotate → skew → scale
    function minify$1(matrix) {
        const decomposed = decompose(matrix);
        if (decomposed == null) {
            return null;
        }
        const transforms = new Set(['translate', 'scale', 'skew', 'perspective', 'rotate']);
        const scales = new Set(['x', 'y', 'z']);
        const skew = new Set(['x', 'y']);
        let result = [];
        // check identity
        if (round(decomposed.translate[0]) == 0 && round(decomposed.translate[1]) == 0 && round(decomposed.translate[2]) == 0) {
            transforms.delete('translate');
        }
        if (round(decomposed.scale[0]) == 1 && round(decomposed.scale[1]) == 1 && round(decomposed.scale[2]) == 1) {
            transforms.delete('scale');
        }
        if (round(decomposed.skew[0]) == 0 && round(decomposed.skew[1]) == 0) {
            transforms.delete('skew');
        }
        if (round(decomposed.perspective[2]) == 0) {
            transforms.delete('perspective');
        }
        if (round(decomposed.rotate[3]) == 0) {
            transforms.delete('rotate');
        }
        if (transforms.has('translate')) {
            let coordinates = new Set(['x', 'y', 'z']);
            for (let i = 0; i < 3; i++) {
                if (round(decomposed.translate[i]) == 0) {
                    coordinates.delete(i == 0 ? 'x' : i == 1 ? 'y' : 'z');
                }
            }
            if (coordinates.size == 1) {
                if (coordinates.has('x')) {
                    result.push({
                        typ: exports.EnumToken.FunctionTokenType,
                        val: 'translate',
                        chi: [{ typ: exports.EnumToken.LengthTokenType, val: round(decomposed.translate[0]), unit: 'px' }]
                    });
                }
                else {
                    let axis = coordinates.has('y') ? 'y' : 'z';
                    let index = axis == 'y' ? 1 : 2;
                    result.push({
                        typ: exports.EnumToken.FunctionTokenType,
                        val: 'translate' + axis.toUpperCase(),
                        chi: [{ typ: exports.EnumToken.LengthTokenType, val: round(decomposed.translate[index]), unit: 'px' }]
                    });
                }
            }
            else if (coordinates.has('z')) {
                result.push({
                    typ: exports.EnumToken.FunctionTokenType,
                    val: 'translate3d',
                    chi: [
                        decomposed.translate[0] == 0 ? {
                            typ: exports.EnumToken.NumberTokenType,
                            val: 0
                        } : { typ: exports.EnumToken.LengthTokenType, val: round(decomposed.translate[0]), unit: 'px' },
                        { typ: exports.EnumToken.CommaTokenType },
                        decomposed.translate[1] == 0 ? {
                            typ: exports.EnumToken.NumberTokenType,
                            val: 0
                        } : { typ: exports.EnumToken.LengthTokenType, val: round(decomposed.translate[1]), unit: 'px' },
                        { typ: exports.EnumToken.CommaTokenType },
                        { typ: exports.EnumToken.LengthTokenType, val: round(decomposed.translate[2]), unit: 'px' }
                    ]
                });
            }
            else {
                result.push({
                    typ: exports.EnumToken.FunctionTokenType,
                    val: 'translate',
                    chi: [
                        { typ: exports.EnumToken.LengthTokenType, val: round(decomposed.translate[0]), unit: 'px' },
                        { typ: exports.EnumToken.CommaTokenType },
                        { typ: exports.EnumToken.LengthTokenType, val: round(decomposed.translate[1]), unit: 'px' }
                    ]
                });
            }
        }
        if (transforms.has('rotate')) {
            const [x, y, z, angle] = decomposed.rotate;
            if (y == 0 && z == 0) {
                result.push({
                    typ: exports.EnumToken.FunctionTokenType,
                    val: 'rotateX',
                    chi: [
                        {
                            typ: exports.EnumToken.AngleTokenType,
                            val: round(angle),
                            unit: 'deg'
                        }
                    ]
                });
            }
            else if (x == 0 && z == 0) {
                result.push({
                    typ: exports.EnumToken.FunctionTokenType,
                    val: 'rotateY',
                    chi: [
                        {
                            typ: exports.EnumToken.AngleTokenType,
                            val: round(angle),
                            unit: 'deg'
                        }
                    ]
                });
            }
            else if (x == 0 && y == 0) {
                result.push({
                    typ: exports.EnumToken.FunctionTokenType,
                    val: 'rotate',
                    chi: [
                        {
                            typ: exports.EnumToken.AngleTokenType,
                            val: round(angle),
                            unit: 'deg'
                        }
                    ]
                });
            }
            else {
                result.push({
                    typ: exports.EnumToken.FunctionTokenType,
                    val: 'rotate3d',
                    chi: [
                        {
                            typ: exports.EnumToken.NumberTokenType,
                            val: round(x)
                        },
                        { typ: exports.EnumToken.CommaTokenType },
                        {
                            typ: exports.EnumToken.NumberTokenType,
                            val: round(y)
                        },
                        { typ: exports.EnumToken.CommaTokenType },
                        {
                            typ: exports.EnumToken.NumberTokenType,
                            val: round(z)
                        },
                        { typ: exports.EnumToken.CommaTokenType },
                        {
                            typ: exports.EnumToken.AngleTokenType,
                            val: round(angle),
                            unit: 'deg'
                        }
                    ]
                });
            }
        }
        if (transforms.has('skew')) {
            if (round(decomposed.skew[1]) == 0) {
                skew.delete('y');
            }
            for (let i = 0; i < 2; i++) {
                decomposed.skew[i] = round(Math.atan(decomposed.skew[i]) * 180 / Math.PI);
            }
            if (skew.size == 1) {
                result.push({
                    typ: exports.EnumToken.FunctionTokenType,
                    val: 'skew' + (skew.has('x') ? '' : 'Y'),
                    chi: [
                        { typ: exports.EnumToken.AngleTokenType, val: round(decomposed.skew[0]), unit: 'deg' }
                    ]
                });
            }
            else {
                result.push({
                    typ: exports.EnumToken.FunctionTokenType,
                    val: 'skew',
                    chi: [
                        { typ: exports.EnumToken.AngleTokenType, val: round(decomposed.skew[0]), unit: 'deg' },
                        { typ: exports.EnumToken.CommaTokenType },
                        { typ: exports.EnumToken.AngleTokenType, val: round(decomposed.skew[1]), unit: 'deg' }
                    ]
                });
            }
        }
        if (transforms.has('scale')) {
            const [sx, sy, sz] = toZero(decomposed.scale);
            if (sz == 1) {
                scales.delete('z');
            }
            if (sy == 1) {
                scales.delete('y');
            }
            if (sx == 1) {
                scales.delete('x');
            }
            if (scales.size == 1) {
                let prefix = scales.has('x') ? 'X' : scales.has('y') ? 'Y' : 'Z';
                result.push({
                    typ: exports.EnumToken.FunctionTokenType,
                    val: 'scale' + prefix,
                    chi: [
                        { typ: exports.EnumToken.NumberTokenType, val: round(prefix == 'Z' ? sz : prefix == 'Y' ? sy : sx) }
                    ]
                });
            }
            else if (!scales.has('z')) {
                result.push({
                    typ: exports.EnumToken.FunctionTokenType,
                    val: 'scale',
                    chi: [
                        { typ: exports.EnumToken.NumberTokenType, val: round(sx) },
                        { typ: exports.EnumToken.CommaTokenType },
                        { typ: exports.EnumToken.NumberTokenType, val: round(sy) },
                    ]
                });
            }
            else {
                result.push({
                    typ: exports.EnumToken.FunctionTokenType,
                    val: 'scale3d',
                    chi: [
                        { typ: exports.EnumToken.NumberTokenType, val: round(sx) },
                        { typ: exports.EnumToken.CommaTokenType },
                        { typ: exports.EnumToken.NumberTokenType, val: round(sy) },
                        { typ: exports.EnumToken.CommaTokenType },
                        { typ: exports.EnumToken.NumberTokenType, val: round(sz) }
                    ]
                });
            }
        }
        // identity
        return result.length == 0 || (result.length == 1 && eqMatrix(identity(), result)) ? [
            {
                typ: exports.EnumToken.IdenTokenType,
                val: 'none'
            }
        ] : result;
    }
    function eqMatrix(a, b) {
        let mat = identity();
        let tmp = identity();
        const data = (Array.isArray(a) ? a : parseMatrix(a));
        for (const transform of b) {
            tmp = computeMatrix([transform], identity());
            if (tmp == null) {
                return false;
            }
            mat = multiply(mat, tmp);
        }
        if (mat == null) {
            return false;
        }
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                if (Math.abs(mat[i * 4 + j] - data[i * 4 + j]) > epsilon) {
                    return false;
                }
            }
        }
        return true;
    }
    function minifyTransformFunctions(transform) {
        const name = transform.val.toLowerCase();
        if ('skewx' == name) {
            transform.val = 'skew';
            return transform;
        }
        if (!['translate', 'translate3d', 'scale', 'scale3d'].includes(name)) {
            return transform;
        }
        const values = [];
        for (const token of transform.chi) {
            if (token.typ == exports.EnumToken.CommentTokenType || token.typ == exports.EnumToken.WhitespaceTokenType || token.typ == exports.EnumToken.CommaTokenType) {
                continue;
            }
            if (![exports.EnumToken.NumberTokenType, exports.EnumToken.LengthTokenType, exports.EnumToken.AngleTokenType, exports.EnumToken.PercentageTokenType].includes(token.typ)) {
                return transform;
            }
            if (token.typ == exports.EnumToken.PercentageTokenType && typeof token.val == 'number' && name.startsWith('scale')) {
                Object.assign(token, { typ: exports.EnumToken.NumberTokenType, val: token.val / 100 });
            }
            values.push(token);
        }
        if ((name == 'translate' || name == 'scale') && values.length > 2) {
            return transform;
        }
        const ignoredValue = name.startsWith('scale') ? 1 : 0;
        const t = new Set(['x', 'y', 'z']);
        let i = 3;
        while (i--) {
            if (values.length <= i || values[i].val == ignoredValue) {
                t.delete(i == 0 ? 'x' : i == 1 ? 'y' : 'z');
            }
        }
        if (name == 'translate3d' || name == 'translate') {
            if (t.size == 0) {
                return {
                    typ: exports.EnumToken.FunctionTokenType,
                    val: 'translate',
                    chi: [
                        { typ: exports.EnumToken.NumberTokenType, val: 0 }
                    ]
                };
            }
            if (t.size == 1) {
                return {
                    typ: exports.EnumToken.FunctionTokenType,
                    val: 'translate' + (t.has('x') ? '' : t.has('y') ? 'Y' : 'Z'),
                    chi: [
                        values[t.has('x') ? 0 : t.has('y') ? 1 : 2]
                    ]
                };
            }
            if (t.size == 2) {
                if (t.has('z')) {
                    return transform;
                }
                return {
                    typ: exports.EnumToken.FunctionTokenType,
                    val: 'translate',
                    chi: [
                        values[0],
                        { typ: exports.EnumToken.CommaTokenType },
                        values[1]
                    ]
                };
            }
        }
        if (name == 'scale3d' || name == 'scale') {
            if (t.size == 0) {
                return {
                    typ: exports.EnumToken.FunctionTokenType,
                    val: 'scale',
                    chi: [
                        { typ: exports.EnumToken.NumberTokenType, val: 1 }
                    ]
                };
            }
            if (t.size == 1) {
                return {
                    typ: exports.EnumToken.FunctionTokenType,
                    val: 'scale' + (t.has('x') ? 'X' : t.has('y') ? 'Y' : 'Z'),
                    chi: [
                        values[t.has('x') ? 0 : t.has('y') ? 1 : 2]
                    ]
                };
            }
            if (t.size == 2) {
                if (t.has('z')) {
                    return transform;
                }
                return {
                    typ: exports.EnumToken.FunctionTokenType,
                    val: 'scale',
                    chi: [
                        values[0],
                        { typ: exports.EnumToken.CommaTokenType },
                        values[1]
                    ]
                };
            }
        }
        return transform;
    }

    function skewX(x, from) {
        const matrix = identity();
        matrix[4] = Math.tan(x);
        return multiply(from, matrix);
    }
    function skewY(y, from) {
        const matrix = identity();
        matrix[1] = Math.tan(y);
        return multiply(from, matrix);
    }
    // convert angle to radian
    function skew(values, from) {
        const matrix = identity();
        matrix[4] = Math.tan(values[0]);
        if (values.length > 1) {
            matrix[1] = Math.tan(values[1]);
        }
        return multiply(from, matrix);
    }

    function perspective(x, from) {
        const matrix = identity();
        // @ts-ignore
        matrix[2 * 4 + 3] = typeof x == 'object' && x.val == 'none' ? 0 : x == 0 ? Number.NEGATIVE_INFINITY : -1 / x;
        return multiply(from, matrix);
    }

    function compute(transformLists) {
        transformLists = transformLists.slice();
        stripCommaToken(transformLists);
        let matrix = identity();
        let mat;
        const cumulative = [];
        for (const transformList of splitTransformList(transformLists)) {
            mat = computeMatrix(transformList, identity());
            if (mat == null) {
                return null;
            }
            matrix = multiply(matrix, mat);
            cumulative.push(...(minify$1(mat) ?? transformList));
        }
        const serialized = serialize(matrix);
        if (cumulative.length > 0) {
            for (let i = 0; i < cumulative.length; i++) {
                if (cumulative[i].typ == exports.EnumToken.IdenTokenType && cumulative[i].val == 'none') {
                    cumulative.splice(i--, 1);
                }
            }
            if (cumulative.length == 0) {
                cumulative.push({
                    typ: exports.EnumToken.IdenTokenType, val: 'none'
                });
            }
        }
        return {
            matrix: serialize(toZero(matrix)),
            cumulative,
            minified: minify$1(matrix) ?? [serialized]
        };
    }
    function computeMatrix(transformList, matrixVar) {
        let values = [];
        let val;
        let i = 0;
        for (; i < transformList.length; i++) {
            if (transformList[i].typ != exports.EnumToken.FunctionTokenType || !transformFunctions.includes(transformList[i].val)) {
                return null;
            }
            switch (transformList[i].val) {
                case 'translate':
                case 'translateX':
                case 'translateY':
                case 'translateZ':
                case 'translate3d':
                    {
                        values.length = 0;
                        const children = stripCommaToken(transformList[i].chi.slice());
                        const valCount = transformList[i].val == 'translate3d' ? 3 : transformList[i].val == 'translate' ? 2 : 1;
                        for (let j = 0; j < children.length; j++) {
                            if (children[j].typ == exports.EnumToken.WhitespaceTokenType) {
                                continue;
                            }
                            val = length2Px(children[j]);
                            if (val == null) {
                                return null;
                            }
                            values.push(val);
                        }
                        if (values.length == 0 || values.length > valCount) {
                            return null;
                        }
                        if (transformList[i].val == 'translateX') {
                            matrixVar = translateX(values[0], matrixVar);
                        }
                        else if (transformList[i].val == 'translateY') {
                            matrixVar = translateY(values[0], matrixVar);
                        }
                        else if (transformList[i].val == 'translateZ') {
                            matrixVar = translateZ(values[0], matrixVar);
                        }
                        else if (transformList[i].val == 'translate') {
                            matrixVar = translate(values, matrixVar);
                        }
                        else {
                            // @ts-ignore
                            matrixVar = translate3d(values, matrixVar);
                        }
                    }
                    break;
                case 'rotate':
                case 'rotateX':
                case 'rotateY':
                case 'rotateZ':
                case 'rotate3d':
                    {
                        let x = 0;
                        let y = 0;
                        let z = 0;
                        let angle;
                        let values = [];
                        let valuesCount = transformList[i].val == 'rotate3d' ? 4 : 1;
                        for (const child of stripCommaToken(transformList[i].chi.slice())) {
                            values.push(child);
                            if (transformList[i].val == 'rotateX') {
                                x = 1;
                            }
                            else if (transformList[i].val == 'rotateY') {
                                y = 1;
                            }
                            else if (transformList[i].val == 'rotate' || transformList[i].val == 'rotateZ') {
                                z = 1;
                            }
                        }
                        if (values.length != valuesCount) {
                            return null;
                        }
                        if (transformList[i].val == 'rotate3d') {
                            x = getNumber(values[0]);
                            y = getNumber(values[1]);
                            z = getNumber(values[2]);
                        }
                        angle = getAngle(values.at(-1));
                        if ([x, y, z, angle].some(t => typeof t != 'number' || Number.isNaN(+t))) {
                            return null;
                        }
                        if (transformList[i].val == 'rotate' || transformList[i].val == 'rotateZ') {
                            matrixVar = rotate(angle * 2 * Math.PI, matrixVar);
                        }
                        else {
                            matrixVar = rotate3D(angle * 2 * Math.PI, x, y, z, matrixVar);
                        }
                    }
                    break;
                case 'scale':
                case 'scaleX':
                case 'scaleY':
                case 'scaleZ':
                case 'scale3d':
                    {
                        values.length = 0;
                        let child;
                        const children = stripCommaToken(transformList[i].chi.slice());
                        for (let k = 0; k < children.length; k++) {
                            child = children[k];
                            if (child.typ != exports.EnumToken.NumberTokenType && child.typ != exports.EnumToken.PercentageTokenType) {
                                return null;
                            }
                            values.push(getNumber(child));
                        }
                        if (transformList[i].val == 'scale3d') {
                            if (values.length != 3) {
                                return null;
                            }
                            matrixVar = scale3d(...values, matrixVar);
                            break;
                        }
                        if (transformList[i].val == 'scale') {
                            if (values.length != 1 && values.length != 2) {
                                return null;
                            }
                            matrixVar = scale(values[0], values[1] ?? values[0], matrixVar);
                            break;
                        }
                        if (values.length != 1) {
                            return null;
                        }
                        else if (transformList[i].val == 'scaleX') {
                            matrixVar = scaleX(values[0], matrixVar);
                        }
                        else if (transformList[i].val == 'scaleY') {
                            matrixVar = scaleY(values[0], matrixVar);
                        }
                        else if (transformList[i].val == 'scaleZ') {
                            matrixVar = scaleZ(values[0], matrixVar);
                        }
                    }
                    break;
                case 'skew':
                case 'skewX':
                case 'skewY':
                    {
                        values.length = 0;
                        let child;
                        let value;
                        for (let k = 0; k < transformList[i].chi.length; k++) {
                            child = transformList[i].chi[k];
                            if (child.typ == exports.EnumToken.CommentTokenType ||
                                child.typ == exports.EnumToken.CommaTokenType ||
                                child.typ == exports.EnumToken.WhitespaceTokenType) {
                                continue;
                            }
                            value = getAngle(child);
                            values.push(value * 2 * Math.PI);
                        }
                        if (values.length == 0 || (values.length > (transformList[i].val == 'skew' ? 2 : 1))) {
                            return null;
                        }
                        if (transformList[i].val == 'skew') {
                            matrixVar = skew(values, matrixVar);
                        }
                        else {
                            matrixVar = transformList[i].val == 'skewX' ? skewX(values[0], matrixVar) : skewY(values[0], matrixVar);
                        }
                    }
                    break;
                case 'perspective':
                    {
                        const values = [];
                        let child;
                        let value;
                        for (let k = 0; k < transformList[i].chi.length; k++) {
                            child = transformList[i].chi[k];
                            if (child.typ == exports.EnumToken.CommentTokenType || child.typ == exports.EnumToken.WhitespaceTokenType) {
                                continue;
                            }
                            if (child.typ == exports.EnumToken.IdenTokenType && child.val == 'none') {
                                values.push(child);
                                continue;
                            }
                            value = length2Px(child);
                            if (value == null) {
                                return null;
                            }
                            values.push(value);
                        }
                        if (values.length != 1) {
                            return null;
                        }
                        matrixVar = perspective(values[0], matrixVar);
                    }
                    break;
                case 'matrix3d':
                case 'matrix':
                    {
                        const values = [];
                        let value;
                        for (const token of transformList[i].chi) {
                            if ([exports.EnumToken.WhitespaceTokenType, exports.EnumToken.CommentTokenType, exports.EnumToken.CommaTokenType].includes(token.typ)) {
                                continue;
                            }
                            value = getNumber(token);
                            if (value == null) {
                                return null;
                            }
                            values.push(value);
                        }
                        if (transformList[i].val == 'matrix') {
                            if (values.length != 6) {
                                return null;
                            }
                        }
                        else if (values.length != 16) {
                            return null;
                        }
                        matrixVar = multiply(matrixVar, matrix(values));
                    }
                    break;
                default:
                    return null;
            }
        }
        return matrixVar;
    }
    function splitTransformList(transformList) {
        let pattern = null;
        const tokens = [];
        for (let i = 0; i < transformList.length; i++) {
            if (transformList[i].typ == exports.EnumToken.CommentTokenType || transformList[i].typ == exports.EnumToken.WhitespaceTokenType) {
                continue;
            }
            if (pattern == null || (transformList[i].typ == exports.EnumToken.FunctionTokenType && !transformList[i].val.startsWith(pattern))) {
                if (transformList[i].typ == exports.EnumToken.FunctionTokenType) {
                    if (transformList[i].val.startsWith('scale')) {
                        pattern = 'scale';
                    }
                    else if (transformList[i].val.startsWith('rotate')) {
                        pattern = 'rotate';
                    }
                    else if (transformList[i].val.startsWith('translate')) {
                        pattern = 'translate';
                    }
                    else {
                        pattern = null;
                    }
                    tokens.push([transformList[i]]);
                    continue;
                }
            }
            if (pattern != null && transformList[i].typ == exports.EnumToken.FunctionTokenType && transformList[i].val.startsWith(pattern)) {
                tokens[tokens.length - 1].push(transformList[i]);
                continue;
            }
            tokens.push([transformList[i]]);
        }
        return tokens;
    }

    class TransformCssFeature {
        accept = new Set([exports.EnumToken.RuleNodeType, exports.EnumToken.KeyFramesRuleNodeType]);
        get ordering() {
            return 4;
        }
        get processMode() {
            return exports.FeatureWalkMode.Post;
        }
        static register(options) {
            // @ts-ignore
            if (options.computeTransform) {
                // @ts-ignore
                options.features.push(new TransformCssFeature());
            }
        }
        run(ast) {
            if (!('chi' in ast)) {
                return null;
            }
            let i = 0;
            let node;
            // @ts-ignore
            for (; i < ast.chi.length; i++) {
                // @ts-ignore
                node = ast.chi[i];
                if (node.typ != exports.EnumToken.DeclarationNodeType || !node.nam.match(/^(-[a-z]+-)?transform$/)) {
                    continue;
                }
                const children = [];
                for (const child of node.val) {
                    children.push(child.typ == exports.EnumToken.FunctionTokenType ? minifyTransformFunctions(child) : child);
                }
                consumeWhitespace(children);
                let { matrix, cumulative, minified } = compute(children) ?? {
                    matrix: null,
                    cumulative: null,
                    minified: null
                };
                if (matrix == null || cumulative == null || minified == null) {
                    node.val = children;
                    continue;
                }
                let r = [filterValues(children)];
                if (eqMatrix(matrix, cumulative)) {
                    r.push(cumulative);
                }
                if (eqMatrix(matrix, minified)) {
                    r.push(minified);
                }
                const l = renderToken(matrix).length;
                node.val = r.reduce((acc, curr) => {
                    if (curr.reduce((acc, t) => acc + renderToken(t), '').length < l) {
                        return curr;
                    }
                    return acc;
                }, [matrix]);
            }
            return null;
        }
    }

    var allFeatures = /*#__PURE__*/Object.freeze({
        __proto__: null,
        ComputeCalcExpressionFeature: ComputeCalcExpressionFeature,
        ComputePrefixFeature: ComputePrefixFeature,
        ComputeShorthandFeature: ComputeShorthandFeature,
        InlineCssVariablesFeature: InlineCssVariablesFeature,
        TransformCssFeature: TransformCssFeature
    });

    const combinators = ['+', '>', '~', '||', '|'];
    const definedPropertySettings = { configurable: true, enumerable: false, writable: true };
    const notEndingWith = ['(', '['].concat(combinators);
    // @ts-ignore
    const features = Object.values(allFeatures).sort((a, b) => a.ordering - b.ordering);
    /**
     * apply minification rules to the ast tree
     * @param ast
     * @param options
     * @param recursive
     * @param errors
     * @param nestingContent
     *
     * @private
     */
    function minify(ast, options = {}, recursive = false, errors, nestingContent, context = {}) {
        let preprocess = false;
        let postprocess = false;
        let parents;
        let replacement;
        if (!('features' in options)) {
            // @ts-ignore
            options = {
                removeDuplicateDeclarations: true,
                computeShorthand: true,
                computeCalcExpression: true,
                removePrefix: false,
                features: [], ...options
            };
            for (const feature of features) {
                feature.register(options);
            }
            options.features.sort((a, b) => a.ordering - b.ordering);
        }
        for (const feature of options.features) {
            if (feature.processMode & exports.FeatureWalkMode.Pre) {
                preprocess = true;
            }
            if (feature.processMode & exports.FeatureWalkMode.Post) {
                postprocess = true;
            }
        }
        if (preprocess) {
            parents = new Set([ast]);
            for (const parent of parents) {
                if (parent.typ == exports.EnumToken.CommentTokenType ||
                    parent.typ == exports.EnumToken.CDOCOMMTokenType) {
                    continue;
                }
                replacement = parent;
                for (const feature of options.features) {
                    if ((feature.processMode & exports.FeatureWalkMode.Pre) === 0 || (feature.accept != null && !feature.accept.has(parent.typ))) {
                        continue;
                    }
                    const result = feature.run(replacement, options, parent.parent ?? ast, context, exports.FeatureWalkMode.Pre);
                    if (result != null) {
                        replacement = result;
                    }
                }
                if (replacement != parent && parent.parent != null) {
                    // @ts-ignore
                    replaceToken(parent.parent, parent, replacement);
                }
                if (('chi' in replacement)) {
                    // @ts-ignore
                    for (const node of replacement.chi) {
                        parents.add(Object.defineProperty(node, 'parent', {
                            ...definedPropertySettings,
                            value: replacement
                        }));
                    }
                }
            }
            for (const feature of options.features) {
                if ((feature.processMode & exports.FeatureWalkMode.Pre) && 'cleanup' in feature) {
                    // @ts-ignore
                    feature.cleanup(ast, options, context, exports.FeatureWalkMode.Pre);
                }
            }
        }
        doMinify(ast, options, recursive, errors, nestingContent, context);
        parents = new Set([ast]);
        for (const parent of parents) {
            if (parent.typ == exports.EnumToken.CommentTokenType ||
                parent.typ == exports.EnumToken.CDOCOMMTokenType) {
                continue;
            }
            replacement = parent;
            if (postprocess) {
                for (const feature of options.features) {
                    if ((feature.processMode & exports.FeatureWalkMode.Post) === 0 || (feature.accept != null && !feature.accept.has(parent.typ))) {
                        continue;
                    }
                    const result = feature.run(replacement, options, parent.parent ?? ast, context, exports.FeatureWalkMode.Post);
                    if (result != null) {
                        replacement = result;
                    }
                }
            }
            if (replacement != null && replacement != parent && parent.parent != null) {
                // @ts-ignore
                replaceToken(parent.parent, parent, replacement);
            }
            if (('chi' in replacement)) {
                for (const node of replacement.chi) {
                    parents.add(Object.defineProperty(node, 'parent', {
                        ...definedPropertySettings,
                        value: replacement
                    }));
                }
            }
        }
        if (postprocess) {
            for (const feature of options.features) {
                if (feature.processMode & exports.FeatureWalkMode.Post && 'cleanup' in feature) {
                    // @ts-ignore
                    feature.cleanup(ast, options, context, exports.FeatureWalkMode.Post);
                }
            }
        }
        return ast;
    }
    /**
     * reduce selectors
     * @param acc
     * @param curr
     *
     * @private
     */
    function reduce(acc, curr) {
        // trim :is()
        // if (array.length == 1 && array[0][0] == ':is(' && array[0].at(-1) == ')') {
        //
        //     curr = curr.slice(1, -1);
        // }
        if (curr[0] == '&') {
            if (curr[1] == ' ' && !isIdent(curr[2]) && !isFunction(curr[2])) {
                curr.splice(0, 2);
            }
        }
        acc.push(curr.join(''));
        return acc;
    }
    /**
     * apply minification rules to the ast tree
     * @param ast
     * @param options
     * @param recursive
     * @param errors
     * @param nestingContent
     * @param context
     *
     * @private
     */
    function doMinify(ast, options = {}, recursive = false, errors, nestingContent, context = {}) {
        if (!('nodes' in context)) {
            context.nodes = new Set;
        }
        if (context.nodes.has(ast)) {
            return ast;
        }
        context.nodes.add(ast);
        // @ts-ignore
        if ('chi' in ast && ast.chi.length > 0) {
            const reducer = reduce.bind(ast);
            if (!nestingContent) {
                nestingContent = options.nestingRules && ast.typ == exports.EnumToken.RuleNodeType;
            }
            let i = 0;
            let previous = null;
            let node = null;
            let nodeIndex = -1;
            for (; i < ast.chi.length; i++) {
                if (ast.chi[i].typ == exports.EnumToken.CommentNodeType) {
                    continue;
                }
                node = ast.chi[i];
                if (node.typ == exports.EnumToken.AtRuleNodeType && node.nam == 'font-face') {
                    continue;
                }
                if (node.typ == exports.EnumToken.KeyframesAtRuleNodeType) {
                    if (previous?.typ == exports.EnumToken.KeyframesAtRuleNodeType &&
                        node.nam == previous.nam &&
                        node.val == previous.val) {
                        ast.chi?.splice(nodeIndex--, 1);
                        previous = ast?.chi?.[nodeIndex] ?? null;
                        i = nodeIndex;
                        continue;
                    }
                }
                else if (node.typ == exports.EnumToken.KeyFramesRuleNodeType) {
                    if (previous?.typ == exports.EnumToken.KeyFramesRuleNodeType &&
                        node.sel == previous.sel) {
                        previous.chi.push(...node.chi);
                        ast.chi.splice(i--, 1);
                        continue;
                    }
                    let k;
                    for (k = 0; k < node.chi.length; k++) {
                        if (node.chi[k].typ == exports.EnumToken.DeclarationNodeType) {
                            let l = node.chi[k].val.length;
                            while (l--) {
                                if (node.chi[k].val[l].typ == exports.EnumToken.ImportantTokenType) {
                                    node.chi.splice(k--, 1);
                                    break;
                                }
                                if ([exports.EnumToken.WhitespaceTokenType, exports.EnumToken.CommentTokenType].includes(node.chi[k].val[l].typ)) {
                                    continue;
                                }
                                break;
                            }
                        }
                    }
                }
                else if (node.typ == exports.EnumToken.AtRuleNodeType) {
                    if (node.nam == 'media' && ['all', '', null].includes(node.val)) {
                        ast.chi?.splice(i, 1, ...node.chi);
                        i--;
                        continue;
                    }
                    if (previous?.typ == exports.EnumToken.AtRuleNodeType &&
                        node.nam != 'font-face' &&
                        previous.nam == node.nam &&
                        previous.val == node.val) {
                        if ('chi' in node) {
                            // @ts-ignore
                            previous.chi.push(...node.chi);
                            if (!hasDeclaration(previous)) {
                                context.nodes.delete(previous);
                                doMinify(previous, options, recursive, errors, nestingContent, context);
                            }
                        }
                        ast?.chi?.splice(i--, 1);
                        continue;
                    }
                    if (!hasDeclaration(node)) {
                        doMinify(node, options, recursive, errors, nestingContent, context);
                    }
                    previous = node;
                    nodeIndex = i;
                    continue;
                }
                // @ts-ignore
                else if (node.typ == exports.EnumToken.RuleNodeType) {
                    reduceRuleSelector(node);
                    let wrapper = null;
                    let match;
                    if (options.nestingRules) {
                        if (previous?.typ == exports.EnumToken.RuleNodeType) {
                            reduceRuleSelector(previous);
                            // @ts-ignore
                            match = matchSelectors(previous.raw, node.raw, ast.typ);
                            if (match != null) {
                                wrapper = wrapNodes(previous, node, match, ast, reducer, i, nodeIndex);
                                nodeIndex = i - 1;
                                previous = ast.chi[nodeIndex];
                            }
                        }
                        if (wrapper != null) {
                            while (i < ast.chi.length) {
                                const nextNode = ast.chi[i];
                                if (nextNode.typ != exports.EnumToken.RuleNodeType) {
                                    break;
                                }
                                reduceRuleSelector(nextNode);
                                match = matchSelectors(wrapper.raw, nextNode.raw);
                                if (match == null) {
                                    break;
                                }
                                wrapper = wrapNodes(wrapper, nextNode, match, ast, reducer, i, nodeIndex);
                            }
                            nodeIndex = --i;
                            previous = ast.chi[nodeIndex];
                            doMinify(wrapper, options, recursive, errors, nestingContent, context);
                            continue;
                        }
                        // @ts-ignore
                        else if (node.optimized != null &&
                            // @ts-ignore
                            node.optimized.match &&
                            // @ts-ignore
                            node.optimized.selector.length > 1) {
                            // @ts-ignore
                            wrapper = { ...node, chi: [], sel: node.optimized.optimized[0] };
                            // @ts-ignore
                            Object.defineProperty(wrapper, 'raw', {
                                ...definedPropertySettings,
                                // @ts-ignore
                                value: [[node.optimized.optimized[0]]]
                            });
                            // @ts-ignore
                            node.sel = node.optimized.selector.reduce(reducer, []).join(',');
                            // @ts-ignore
                            node.raw = node.optimized.selector.slice();
                            // @ts-ignore
                            wrapper.chi.push(node);
                            // @ts-ignore
                            ast.chi.splice(i, 1, wrapper);
                            node = wrapper;
                        }
                    }
                    // @ts-ignore
                    else if (node.optimized?.match) {
                        let wrap = true;
                        // @ts-ignore
                        const selector = node.optimized.selector.reduce((acc, curr) => {
                            if (curr[0] == '&' && curr.length > 1) {
                                if (curr[1] == ' ') {
                                    curr.splice(0, 2);
                                }
                                else {
                                    curr.splice(0, 1);
                                }
                            }
                            else if (combinators.includes(curr[0])) {
                                curr.unshift('&');
                                wrap = false;
                            }
                            acc.push(curr);
                            return acc;
                        }, []);
                        if (!wrap) {
                            wrap = selector.some((s) => s[0] != '&');
                        }
                        let rule = null;
                        const optimized = node.optimized.optimized.slice();
                        if (optimized.length > 1) {
                            const check = optimized.at(-2);
                            if (!combinators.includes(check)) {
                                let last = optimized.pop();
                                wrap = false;
                                rule = optimized.join('') + `:is(${selector.map(s => {
                                if (s[0] == '&') {
                                    s.splice(0, 1, last);
                                }
                                else {
                                    s.unshift(last);
                                }
                                return s.join('');
                            }).join(',')})`;
                            }
                        }
                        if (rule == null) {
                            rule = selector.map((s) => {
                                if (s[0] == '&') {
                                    s.splice(0, 1, ...node.optimized.optimized);
                                }
                                return s.join('');
                            }).join(',');
                        }
                        let sel = wrap ? node.optimized.optimized.join('') + `:is(${rule})` : rule;
                        if (sel.length < node.sel.length) {
                            node.sel = sel;
                        }
                    }
                    doMinify(node, options, recursive, errors, nestingContent, context);
                }
                if (previous != null) {
                    if ('chi' in previous && ('chi' in node)) {
                        if (previous.typ == node.typ) {
                            let shouldMerge = true;
                            let k = previous.chi.length;
                            while (k-- > 0) {
                                if (previous.chi[k].typ == exports.EnumToken.CommentNodeType) {
                                    continue;
                                }
                                shouldMerge = previous.chi[k].typ == exports.EnumToken.DeclarationNodeType;
                                break;
                            }
                            if (shouldMerge) {
                                // @ts-ignore
                                if (((node.typ == exports.EnumToken.RuleNodeType || node.typ == exports.EnumToken.KeyFramesRuleNodeType) && node.sel == previous.sel) ||
                                    // @ts-ignore
                                    (node.typ == exports.EnumToken.AtRuleNodeType) && node.val != 'font-face' && node.val == previous.val) {
                                    // @ts-ignore
                                    node.chi.unshift(...previous.chi);
                                    doMinify(node, options, recursive, errors, nestingContent, context);
                                    ast.chi.splice(nodeIndex, 1);
                                    previous = ast.chi[--i];
                                    nodeIndex = i;
                                    continue;
                                }
                                else if (node.typ == previous?.typ && [exports.EnumToken.KeyFramesRuleNodeType, exports.EnumToken.RuleNodeType].includes(node.typ)) {
                                    const intersect = diff(previous, node, reducer, options);
                                    if (intersect != null) {
                                        if (intersect.node1.chi.length == 0) {
                                            ast.chi.splice(i--, 1);
                                        }
                                        else {
                                            ast.chi.splice(i--, 1, intersect.node1);
                                        }
                                        if (intersect.node2.chi.length == 0) {
                                            ast.chi.splice(nodeIndex, 1, intersect.result);
                                            i--;
                                            if (nodeIndex == i) {
                                                nodeIndex = i;
                                            }
                                        }
                                        else {
                                            ast.chi.splice(nodeIndex, 1, intersect.result, intersect.node2);
                                            i = (nodeIndex ?? 0) + 1;
                                        }
                                        reduceRuleSelector(intersect.result);
                                        if (node != ast.chi[i]) {
                                            node = ast.chi[i];
                                        }
                                        previous = intersect.result;
                                        nodeIndex = i;
                                    }
                                }
                            }
                        }
                        if (recursive && previous != node) {
                            if (!hasDeclaration(previous)) {
                                doMinify(previous, options, recursive, errors, nestingContent, context);
                            }
                        }
                    }
                }
                if (!nestingContent &&
                    previous != null &&
                    previous.typ == exports.EnumToken.RuleNodeType &&
                    previous.sel.includes('&')) {
                    fixSelector(previous);
                }
                previous = node;
                nodeIndex = i;
            }
            if (recursive && node != null && ('chi' in node)) {
                if (node.typ == exports.EnumToken.KeyframesAtRuleNodeType || !node.chi.some(n => n.typ == exports.EnumToken.DeclarationNodeType)) {
                    if (!(node.typ == exports.EnumToken.AtRuleNodeType && node.nam != 'font-face')) {
                        doMinify(node, options, recursive, errors, nestingContent, context);
                    }
                }
            }
            if (!nestingContent &&
                node != null &&
                node.typ == exports.EnumToken.RuleNodeType &&
                node.sel.includes('&')) {
                fixSelector(node);
            }
        }
        return ast;
    }
    /**
     * check if a rule has a declaration
     * @param node
     *
     * @private
     */
    function hasDeclaration(node) {
        // @ts-ignore
        for (let i = 0; i < node.chi?.length; i++) {
            // @ts-ignore
            if (node.chi[i].typ == exports.EnumToken.CommentNodeType) {
                continue;
            }
            // @ts-ignore
            return node.chi[i].typ == exports.EnumToken.DeclarationNodeType;
        }
        return true;
    }
    /**
     * optimize selector
     * @param selector
     *
     * @private
     */
    function optimizeSelector(selector) {
        selector = selector.reduce((acc, curr) => {
            // @ts-ignore
            if (curr.length > 0 && curr.at(-1).startsWith(':is(')) {
                // @ts-ignore
                const rules = splitRule(curr.at(-1).slice(4, -1)).map(x => {
                    if (x[0] == '&' && x.length > 1) {
                        return x.slice(x[1] == ' ' ? 2 : 1);
                    }
                    return x;
                });
                const part = curr.slice(0, -1);
                for (const rule of rules) {
                    acc.push(part.concat(rule));
                }
                return acc;
            }
            acc.push(curr);
            return acc;
        }, []);
        const optimized = [];
        const k = selector.reduce((acc, curr) => acc == 0 ? curr.length : (curr.length == 0 ? acc : Math.min(acc, curr.length)), 0);
        let i = 0;
        let j;
        let match;
        for (; i < k; i++) {
            const item = selector[0][i];
            match = true;
            for (j = 1; j < selector.length; j++) {
                if (item != selector[j][i]) {
                    match = false;
                    break;
                }
            }
            if (!match) {
                break;
            }
            optimized.push(item);
        }
        while (optimized.length > 0) {
            const last = optimized.at(-1);
            if ((last == ' ' || combinators.includes(last))) {
                optimized.pop();
                continue;
            }
            break;
        }
        selector.forEach((selector) => selector.splice(0, optimized.length));
        let reducible = optimized.length == 1;
        if (optimized[0] == '&') {
            if (optimized[1] == ' ') {
                optimized.splice(0, 2);
            }
        }
        if (optimized.length == 0 ||
            (optimized[0].charAt(0) == '&' ||
                selector.length == 1)) {
            return {
                match: false,
                optimized,
                selector: selector.map((selector) => selector[0] == '&' && selector[1] == ' ' ? selector.slice(2) : (selector)),
                reducible: selector.length > 1 && selector.every((selector) => !combinators.includes(selector[0]))
            };
        }
        return {
            match: true,
            optimized,
            selector: selector.reduce((acc, curr) => {
                let hasCompound = true;
                if (hasCompound && curr.length > 0) {
                    hasCompound = !['&'].concat(combinators).includes(curr[0].charAt(0));
                }
                // @ts-ignore
                if (hasCompound && curr[0] == ' ') {
                    hasCompound = false;
                    curr.unshift('&');
                }
                if (curr.length == 0) {
                    curr.push('&');
                    hasCompound = false;
                }
                if (reducible) {
                    const chr = curr[0].charAt(0);
                    // @ts-ignore
                    reducible = chr == '.' || chr == ':' || isIdentStart(chr.codePointAt(0));
                }
                acc.push(hasCompound ? ['&'].concat(curr) : curr);
                return acc;
            }, []),
            reducible: selector.every((selector) => !['>', '+', '~', '&'].includes(selector[0]))
        };
    }
    /**
     * split selector string
     * @param buffer
     *
     * @internal
     */
    function splitRule(buffer) {
        const result = [[]];
        let str = '';
        for (let i = 0; i < buffer.length; i++) {
            let chr = buffer.charAt(i);
            if (isWhiteSpace(chr.charCodeAt(0))) {
                if (str !== '') {
                    // @ts-ignore
                    result.at(-1).push(str);
                    str = '';
                }
                // @ts-ignore
                if (result.at(-1).length > 0) {
                    // @ts-ignore
                    result.at(-1).push(' ');
                }
                // i = k;
                continue;
            }
            if (chr == ',') {
                if (str !== '') {
                    result.at(-1).push(str);
                    str = '';
                }
                result.push([]);
                continue;
            }
            if (chr == '.') {
                if (str !== '') {
                    result.at(-1).push(str);
                    str = '';
                }
                str += chr;
                continue;
            }
            if (combinators.includes(chr)) {
                if (str !== '') {
                    result.at(-1).push(str);
                    str = '';
                }
                if (chr == '|' && buffer.charAt(i + 1) == '|') {
                    chr += buffer.charAt(++i);
                }
                result.at(-1).push(chr);
                continue;
            }
            if (chr == ':') {
                if (str !== '') {
                    result.at(-1).push(str);
                    str = '';
                }
                if (buffer.charAt(i + 1) == ':') {
                    chr += buffer.charAt(++i);
                }
                str += chr;
                continue;
            }
            str += chr;
            if (chr == '\\') {
                str += buffer.charAt(++i);
                continue;
            }
            if (chr == '(' || chr == '[') {
                const open = chr;
                const close = chr == '(' ? ')' : ']';
                let inParens = 1;
                let k = i;
                while (++k < buffer.length) {
                    chr = buffer.charAt(k);
                    if (chr == '\\') {
                        str += buffer.slice(k, k + 2);
                        k++;
                        continue;
                    }
                    str += chr;
                    if (chr == open) {
                        inParens++;
                    }
                    else if (chr == close) {
                        inParens--;
                    }
                    if (inParens == 0) {
                        break;
                    }
                }
                i = k;
            }
        }
        if (str !== '') {
            result.at(-1).push(str);
        }
        return result;
    }
    /**
     * reduce selector
     * @param acc
     * @param curr
     *
     * @private
     */
    function reduceSelector(acc, curr) {
        let hasCompoundSelector = true;
        // @ts-ignore
        curr = curr.slice(this.match[0].length);
        while (curr.length > 0) {
            if (curr[0] == ' ') {
                hasCompoundSelector = false;
                curr.unshift('&');
                continue;
            }
            break;
        }
        if (hasCompoundSelector && curr.length > 0) {
            hasCompoundSelector = !['&'].concat(combinators).includes(curr[0].charAt(0));
        }
        if (curr[0] == ':is(') {
            let canReduce = true;
            const isCompound = curr.reduce((acc, token, index) => {
                if (index == 0) {
                    canReduce = curr[1] == '&';
                }
                else if (token == ')') ;
                else if (token == ',') {
                    if (!canReduce) {
                        canReduce = curr[index + 1] == '&';
                    }
                    acc.push([]);
                }
                else
                    acc.at(-1)?.push(token);
                return acc;
            }, [[]]);
            if (canReduce) {
                curr = isCompound.reduce((acc, curr) => {
                    if (acc.length > 0) {
                        acc.push(',');
                    }
                    acc.push(...curr);
                    return acc;
                }, []);
            }
        }
        // @ts-ignore
        acc.push(this.match.length == 0 ? ['&'] : (hasCompoundSelector && curr[0] != '&' && (curr.length == 0 || !combinators.includes(curr[0].charAt(0))) ? ['&'].concat(curr) : curr));
        return acc;
    }
    /**
     * match selectors
     * @param selector1
     * @param selector2
     *
     * @private
     */
    function matchSelectors(selector1, selector2) {
        let match = [[]];
        const j = Math.min(selector1.reduce((acc, curr) => Math.min(acc, curr.length), selector1.length > 0 ? selector1[0].length : 0), selector2.reduce((acc, curr) => Math.min(acc, curr.length), selector2.length > 0 ? selector2[0].length : 0));
        let i = 0;
        let k;
        let l;
        let token;
        let matching = true;
        let matchFunction = 0;
        let inAttr = 0;
        for (; i < j; i++) {
            k = 0;
            token = selector1[0][i];
            for (; k < selector1.length; k++) {
                if (selector1[k][i] != token) {
                    matching = false;
                    break;
                }
            }
            if (matching) {
                l = 0;
                for (; l < selector2.length; l++) {
                    if (selector2[l][i] != token) {
                        matching = false;
                        break;
                    }
                }
            }
            if (!matching) {
                break;
            }
            if (token.endsWith('(')) {
                matchFunction++;
            }
            match.at(-1).push(token);
        }
        // invalid function
        if (matchFunction != 0 || inAttr != 0) {
            return null;
        }
        for (const part of match) {
            while (part.length > 0) {
                const token = part.at(-1);
                if (token == ' ' || combinators.includes(token) || notEndingWith.includes(token.at(-1))) {
                    part.pop();
                    continue;
                }
                break;
            }
        }
        if (match.every(t => t.length == 0)) {
            return null;
        }
        if (eq([['&']], match)) {
            return null;
        }
        const reducer = reduceSelector.bind({ match });
        // @ts-ignore
        selector1 = selector1.reduce(reducer, []);
        // @ts-ignore
        selector2 = selector2.reduce(reducer, []);
        return selector1 == null || selector2 == null ? null : {
            eq: eq(selector1, selector2),
            match,
            selector1,
            selector2
        };
    }
    /**
     * fix selector
     * @param node
     *
     * @private
     */
    function fixSelector(node) {
        if (node.sel.includes('&')) {
            const attributes = parseString(node.sel);
            for (const attr of walkValues(attributes)) {
                if (attr.value.typ == exports.EnumToken.PseudoClassFuncTokenType && attr.value.val == ':is') {
                    let i = attr.value.chi.length;
                    while (i--) {
                        if (attr.value.chi[i].typ == exports.EnumToken.LiteralTokenType && attr.value.chi[i].val == '&') {
                            attr.value.chi.splice(i, 1);
                        }
                    }
                }
            }
            node.sel = attributes.reduce((acc, curr) => acc + renderToken(curr), '');
        }
    }
    /**
     * wrap nodes
     * @param previous
     * @param node
     * @param match
     * @param ast
     * @param reducer
     * @param i
     * @param nodeIndex
     *
     * @private
     */
    function wrapNodes(previous, node, match, ast, reducer, i, nodeIndex) {
        // @ts-ignore
        let pSel = match.selector1.reduce(reducer, []).join(',');
        // @ts-ignore
        let nSel = match.selector2.reduce(reducer, []).join(',');
        // @ts-ignore
        const wrapper = { ...previous, chi: [], sel: match.match.reduce(reducer, []).join(',') };
        Object.defineProperty(wrapper, 'raw', {
            ...definedPropertySettings,
            value: match.match.map(t => t.slice())
        });
        if (pSel == '&' || pSel === '') {
            wrapper.chi.push(...previous.chi);
            if ((nSel == '&' || nSel === '')) {
                wrapper.chi.push(...node.chi);
            }
            else {
                wrapper.chi.push(node);
            }
        }
        else {
            wrapper.chi.push(previous, node);
        }
        ast.chi.splice(i, 1, wrapper);
        ast.chi.splice(nodeIndex, 1);
        previous.sel = pSel;
        previous.raw = match.selector1;
        node.sel = nSel;
        node.raw = match.selector2;
        reduceRuleSelector(wrapper);
        return wrapper;
    }
    /**
     * diff nodes
     * @param n1
     * @param n2
     * @param reducer
     * @param options
     *
     * @private
     */
    function diff(n1, n2, reducer, options = {}) {
        if (!('cache' in options)) {
            options.cache = new WeakMap();
        }
        let node1 = n1;
        let node2 = n2;
        let exchanged = false;
        if (node1.chi.length > node2.chi.length) {
            const t = node1;
            node1 = node2;
            node2 = t;
            exchanged = true;
        }
        let i = node1.chi.length;
        let j = node2.chi.length;
        const raw1 = node1.raw;
        const raw2 = node2.raw;
        if (raw1 != null && raw2 != null) {
            const prefixes1 = new Set;
            const prefixes2 = new Set;
            for (const token1 of raw1) {
                for (const t of token1) {
                    if (t[0] == ':') {
                        const matches = t.match(/::?-([a-z]+)-/);
                        if (matches == null) {
                            continue;
                        }
                        prefixes1.add(matches[1]);
                        if (prefixes1.size > 1) {
                            break;
                        }
                    }
                }
                if (prefixes1.size > 1) {
                    break;
                }
            }
            for (const token2 of raw2) {
                for (const t of token2) {
                    if (t[0] == ':') {
                        const matches = t.match(/::?-([a-z]+)-/);
                        if (matches == null) {
                            continue;
                        }
                        prefixes2.add(matches[1]);
                        if (prefixes2.size > 1) {
                            break;
                        }
                    }
                }
                if (prefixes2.size > 1) {
                    break;
                }
            }
            if (prefixes1.size != prefixes2.size) {
                return null;
            }
            for (const prefix of prefixes1) {
                if (!prefixes2.has(prefix)) {
                    return null;
                }
            }
        }
        const css1 = options.cache.get(node1);
        const css2 = options.cache.get(node2);
        node1 = { ...node1, chi: node1.chi.slice() };
        node2 = { ...node2, chi: node2.chi.slice() };
        if (css1 != null) {
            options.cache.set(node1, css1);
        }
        if (css2 != null) {
            options.cache.set(node2, css2);
        }
        if (raw1 != null) {
            Object.defineProperty(node1, 'raw', { ...definedPropertySettings, value: raw1 });
        }
        if (raw2 != null) {
            Object.defineProperty(node2, 'raw', { ...definedPropertySettings, value: raw2 });
        }
        const intersect = [];
        while (i--) {
            if (node1.chi[i].typ == exports.EnumToken.CommentNodeType) {
                continue;
            }
            j = node2.chi.length;
            while (j--) {
                if (node2.chi[j].typ == exports.EnumToken.CommentNodeType) {
                    continue;
                }
                if (node1.chi[i].nam == node2.chi[j].nam) {
                    if (node1.chi[i].typ == node2.chi[j].typ && eq(node1.chi[i], node2.chi[j])) {
                        intersect.push(node1.chi[i]);
                        node1.chi.splice(i, 1);
                        node2.chi.splice(j, 1);
                        options.cache.delete(node1);
                        options.cache.delete(node2);
                        break;
                    }
                }
            }
        }
        const result = (intersect.length == 0 ? null : {
            ...node1,
            // @ts-ignore
            sel: [...new Set([...(n1?.raw?.reduce(reducer, []) ?? splitRule(n1.sel)).concat(n2?.raw?.reduce(reducer, []) ?? splitRule(n2.sel))])].join(','),
            chi: intersect.reverse()
        });
        if (result == null || [n1, n2].reduce((acc, curr) => {
            let css = options.cache.get(curr);
            if (css == null) {
                css = doRender(curr, options).code;
                options.cache.set(curr, css);
            }
            return curr.chi.length == 0 ? acc : acc + css.length;
        }, 0) <= [node1, node2, result].reduce((acc, curr) => {
            const css = doRender(curr, options).code;
            return curr.chi.length == 0 ? acc : acc + css.length;
        }, 0)) {
            return null;
        }
        return { result, node1: exchanged ? node2 : node1, node2: exchanged ? node1 : node2 };
    }
    /**
     * reduce rule selector
     * @param node
     *
     * @private
     */
    function reduceRuleSelector(node) {
        if (node.raw == null) {
            Object.defineProperty(node, 'raw', { ...definedPropertySettings, value: splitRule(node.sel) });
        }
        let optimized = optimizeSelector(node.raw.reduce((acc, curr) => {
            acc.push(curr.slice());
            return acc;
        }, []));
        if (optimized != null) {
            Object.defineProperty(node, 'optimized', { ...definedPropertySettings, value: optimized });
        }
        if (optimized != null && optimized.match && optimized.reducible && optimized.selector.length > 1) {
            for (const selector of optimized.selector) {
                if (selector.length > 1 && selector[0] == '&' &&
                    (combinators.includes(selector[1]) || !/^[a-zA-Z:]/.test(selector[1]))) {
                    selector.shift();
                }
            }
            const unique = new Set;
            const raw = [
                [
                    optimized.optimized[0], ':is('
                ].concat(optimized.selector.reduce((acc, curr) => {
                    const sig = curr.join('');
                    if (!unique.has(sig)) {
                        if (acc.length > 0) {
                            acc.push(',');
                        }
                        unique.add(sig);
                        acc.push(...curr);
                    }
                    return acc;
                }, [])).concat(')')
            ];
            const sel = raw[0].join('');
            if (sel.length < node.sel.length) {
                node.sel = sel;
                Object.defineProperty(node, 'raw', { ...definedPropertySettings, value: raw });
            }
        }
    }

    /**
     * expand css nesting ast nodes
     * @param ast
     *
     * @private
     */
    function expand(ast) {
        const result = { ...ast, chi: [] };
        for (let i = 0; i < ast.chi.length; i++) {
            const node = ast.chi[i];
            if (node.typ == exports.EnumToken.RuleNodeType) {
                // @ts-ignore
                result.chi.push(...expandRule(node));
            }
            else if (node.typ == exports.EnumToken.AtRuleNodeType && 'chi' in node) {
                let hasRule = false;
                let j = node.chi.length;
                while (j--) {
                    // @ts-ignore
                    if (node.chi[j].typ == exports.EnumToken.RuleNodeType || node.chi[j].typ == exports.EnumToken.AtRuleNodeType) {
                        hasRule = true;
                        break;
                    }
                }
                // @ts-ignore
                result.chi.push({ ...(hasRule ? expand(node) : node) });
            }
            else {
                // @ts-ignore
                result.chi.push(node);
            }
        }
        return result;
    }
    function expandRule(node) {
        const ast = { ...node, chi: node.chi.slice() };
        const result = [];
        if (ast.typ == exports.EnumToken.RuleNodeType) {
            let i = 0;
            for (; i < ast.chi.length; i++) {
                if (ast.chi[i].typ == exports.EnumToken.RuleNodeType) {
                    const rule = ast.chi[i];
                    if (!rule.sel.includes('&')) {
                        const selRule = splitRule(rule.sel);
                        const arSelf = splitRule(ast.sel).filter((r) => r.every((t) => t != ':before' && t != ':after' && !t.startsWith('::'))).reduce((acc, curr) => acc.concat([curr.join('')]), []).join(',');
                        if (arSelf.length == 0) {
                            ast.chi.splice(i--, 1);
                            continue;
                        }
                        //
                        selRule.forEach(arr => combinators.includes(arr[0].charAt(0)) ? arr.unshift(arSelf) : arr.unshift(arSelf, ' '));
                        rule.sel = selRule.reduce((acc, curr) => {
                            acc.push(curr.join(''));
                            return acc;
                        }, []).join(',');
                        // }
                    }
                    else {
                        let childSelectorCompound = [];
                        let withCompound = [];
                        let withoutCompound = [];
                        // pseudo elements cannot be used with '&'
                        // https://www.w3.org/TR/css-nesting-1/#example-7145ff1e
                        const rules = splitRule(ast.sel).filter((r) => r.every((t) => t != ':before' && t != ':after' && !t.startsWith('::')));
                        const parentSelector = !node.sel.includes('&');
                        if (rules.length == 0) {
                            ast.chi.splice(i--, 1);
                            continue;
                        }
                        for (const sel of (rule.raw ?? splitRule(rule.sel))) {
                            const s = sel.join('');
                            if (s.includes('&') || parentSelector) {
                                if (s.indexOf('&', 1) == -1) {
                                    if (s.at(0) == '&') {
                                        if (s.at(1) == ' ') {
                                            childSelectorCompound.push(s.slice(2));
                                        }
                                        else {
                                            if (s == '&' || parentSelector) {
                                                withCompound.push(s);
                                            }
                                        }
                                    }
                                    else {
                                        withoutCompound.push(s);
                                    }
                                }
                                else {
                                    withCompound.push(s);
                                }
                            }
                        }
                        const selectors = [];
                        const selector = rules.length > 1 ? ':is(' + rules.map(a => a.join('')).join(',') + ')' : rules[0].join('');
                        if (childSelectorCompound.length > 0) {
                            if (childSelectorCompound.length == 1) {
                                selectors.push(replaceCompound('& ' + childSelectorCompound[0].trim(), selector));
                            }
                            else {
                                selectors.push(replaceCompound('& :is(' + childSelectorCompound.reduce((acc, curr) => acc + (acc.length > 0 ? ',' : '') + curr.trim(), '') + ')', selector));
                            }
                        }
                        if (withCompound.length > 0) {
                            if (withCompound.every((t) => t[0] == '&' && t.indexOf('&', 1) == -1)) {
                                withoutCompound.push(...withCompound.map(t => t.slice(1)));
                                withCompound.length = 0;
                            }
                        }
                        if (withoutCompound.length > 0) {
                            if (withoutCompound.length == 1) {
                                const useIs = rules.length == 1 && selector.match(/^[a-zA-Z.:]/) != null && selector.includes(' ') && withoutCompound.length == 1 && withoutCompound[0].match(/^[a-zA-Z]+$/) != null;
                                const compound = useIs ? ':is(&)' : '&';
                                selectors.push(replaceCompound(rules.length == 1 ? (useIs ? withoutCompound[0] + ':is(&)' : (selector.match(/^[.:]/) && withoutCompound[0].match(/^[a-zA-Z]+$/) ? withoutCompound[0] + compound : compound + withoutCompound[0])) : (withoutCompound[0].match(/^[a-zA-Z:]+$/) ? withoutCompound[0].trim() + compound : '&' + (withoutCompound[0].match(/^\S+$/) ? withoutCompound[0].trim() : ':is(' + withoutCompound[0].trim() + ')')), selector));
                            }
                            else {
                                selectors.push(replaceCompound('&:is(' + withoutCompound.reduce((acc, curr) => acc + (acc.length > 0 ? ',' : '') + curr.trim(), '') + ')', selector));
                            }
                        }
                        if (withCompound.length > 0) {
                            if (withCompound.length == 1) {
                                selectors.push(replaceCompound(withCompound[0], selector));
                            }
                        }
                        rule.sel = selectors.reduce((acc, curr) => curr.length == 0 ? acc : acc + (acc.length > 0 ? ',' : '') + curr, '');
                    }
                    ast.chi.splice(i--, 1);
                    result.push(...expandRule(rule));
                }
                else if (ast.chi[i].typ == exports.EnumToken.AtRuleNodeType) {
                    let astAtRule = ast.chi[i];
                    const values = [];
                    if (astAtRule.nam == 'scope') {
                        if (astAtRule.val.includes('&')) {
                            astAtRule.val = replaceCompound(astAtRule.val, ast.sel);
                        }
                        const slice = astAtRule.chi.slice().filter(t => t.typ == exports.EnumToken.RuleNodeType && t.sel.includes('&'));
                        if (slice.length > 0) {
                            expandRule({ ...node, chi: astAtRule.chi.slice() });
                        }
                    }
                    else {
                        // @ts-ignore
                        const clone = { ...ast, chi: astAtRule.chi.slice() };
                        // @ts-ignore
                        astAtRule.chi.length = 0;
                        for (const r of expandRule(clone)) {
                            if (r.typ == exports.EnumToken.AtRuleNodeType && 'chi' in r) {
                                if (astAtRule.val !== '' && r.val !== '') {
                                    if (astAtRule.nam == 'media' && r.nam == 'media') {
                                        r.val = astAtRule.val + ' and ' + r.val;
                                    }
                                    else if (astAtRule.nam == 'layer' && r.nam == 'layer') {
                                        r.val = astAtRule.val + '.' + r.val;
                                    }
                                }
                                // @ts-ignore
                                values.push(r);
                            }
                            else if (r.typ == exports.EnumToken.RuleNodeType) {
                                // @ts-ignore
                                astAtRule.chi.push(...expandRule(r));
                            }
                        }
                    }
                    // @ts-ignore
                    result.push(...(astAtRule.chi.length > 0 ? [astAtRule].concat(values) : values));
                    ast.chi.splice(i--, 1);
                }
            }
        }
        // @ts-ignore
        return ast.chi.length > 0 ? [ast].concat(result) : result;
    }
    /**
     * replace compound selector
     * @param input
     * @param replace
     */
    function replaceCompound(input, replace) {
        const tokens = parseString(input);
        let replacement = null;
        for (const t of walkValues(tokens)) {
            if (t.value.typ == exports.EnumToken.LiteralTokenType) {
                if (t.value.val == '&') {
                    if (tokens.length == 2) {
                        if (replacement == null) {
                            replacement = parseString(replace);
                        }
                        t.value.val = replaceCompoundLiteral(t.value.val, replace);
                        // }
                        continue;
                    }
                    const rule = splitRule(replace);
                    t.value.val = rule.length > 1 ? ':is(' + replace + ')' : replace;
                }
            }
        }
        return tokens.reduce((acc, curr) => acc + renderToken(curr), '');
    }
    function replaceCompoundLiteral(selector, replace) {
        const tokens = [''];
        let i = 0;
        for (; i < selector.length; i++) {
            if (selector.charAt(i) == '&') {
                tokens.push('&');
                tokens.push('');
            }
        }
        return tokens.sort((a, b) => {
            if (a == '&') {
                return 1;
            }
            return b == '&' ? -1 : 0;
        }).reduce((acc, curr) => acc + (curr == '&' ? replace : curr), '');
    }

    const matchUrl = /^(https?:)?\/\//;
    /**
     * return the directory name of a path
     * @param path
     *
     * @private
     */
    function dirname(path) {
        // if (path == '/' || path === '') {
        //
        //     return path;
        // }
        let i = 0;
        let parts = [''];
        for (; i < path.length; i++) {
            const chr = path.charAt(i);
            if (chr == '/') {
                parts.push('');
            }
            // else if (chr == '?' || chr == '#') {
            //
            //     break;
            // }
            else {
                parts[parts.length - 1] += chr;
            }
        }
        parts.pop();
        return parts.length == 0 ? '/' : parts.join('/');
    }
    /**
     * split path
     * @param result
     * @private
     */
    function splitPath(result) {
        const parts = [''];
        let i = 0;
        for (; i < result.length; i++) {
            const chr = result.charAt(i);
            if (chr == '/') {
                parts.push('');
            }
            else if (chr == '?' || chr == '#') {
                break;
            }
            else {
                parts[parts.length - 1] += chr;
            }
        }
        let k = -1;
        while (++k < parts.length) {
            if (parts[k] == '.') {
                parts.splice(k--, 1);
            }
            else if (parts[k] == '..') {
                parts.splice(k - 1, 2);
                k -= 2;
            }
        }
        return { parts, i };
    }
    /**
     * resolve path
     * @param url url or path to resolve
     * @param currentDirectory directory used to resolve the path
     * @param cwd current working directory
     *
     * @private
     */
    function resolve(url, currentDirectory, cwd) {
        if (matchUrl.test(url)) {
            return {
                absolute: url,
                relative: url
            };
        }
        cwd ??= '';
        currentDirectory ??= '';
        if (currentDirectory !== '' && url.startsWith(currentDirectory + '/')) {
            return {
                absolute: url,
                relative: url.slice(currentDirectory.length + 1)
            };
        }
        if (currentDirectory === '' && cwd !== '' && url.startsWith(cwd + '/')) {
            return {
                absolute: url,
                relative: url.slice(cwd.length + 1)
            };
        }
        if (matchUrl.test(currentDirectory)) {
            const path = new URL(url, currentDirectory).href;
            return {
                absolute: path,
                relative: path
            };
        }
        let result = '';
        if (url.charAt(0) == '/') {
            result = url;
        }
        else if (currentDirectory.charAt(0) == '/') {
            result = dirname(currentDirectory) + '/' + url;
        }
        let { parts, i } = splitPath(result);
        const absolute = parts.join('/');
        const { parts: dirs } = splitPath(cwd ?? currentDirectory);
        for (const p of dirs) {
            if (parts[0] == p) {
                parts.shift();
            }
            else {
                parts.unshift('..');
            }
        }
        return {
            absolute,
            relative: parts.join('/') + (i < result.length ? result.slice(i) : '')
        };
    }

    /**
     * default file or url loader
     * @param url
     * @param currentFile
     *
     * @param asStream
     * @private
     */
    async function load(url, currentFile = '.', asStream = false) {
        let t;
        if (matchUrl.test(url)) {
            t = new URL(url);
        }
        else if (currentFile != null && matchUrl.test(currentFile)) {
            t = new URL(url, currentFile);
        }
        else {
            const path = resolve(url, currentFile).absolute;
            t = new URL(path, self.origin);
        }
        return fetch(t, t.origin != self.origin ? { mode: 'cors' } : {}).then(async (response) => {
            if (!response.ok) {
                throw new Error(`${response.status} ${response.statusText} ${response.url}`);
            }
            return asStream ? response.body : await response.text();
        });
    }
    /**
     * render the ast tree
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
    function render(data, options = {}, mapping) {
        return doRender(data, Object.assign(options, {
            resolve,
            dirname,
            cwd: options.cwd ?? self.location.pathname.endsWith('/') ? self.location.pathname : dirname(self.location.pathname)
        }), mapping);
    }
    /**
     * parse css file
     * @param file url or path
     * @param options
     * @param asStream load file as stream
     *
     * @throws Error file not found
     *
     * Example:
     *
     * ```ts
     *
     *  import {parseFile} from '@tbela99/css-parser/web';
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
    async function parseFile(file, options = {}, asStream = false) {
        return Promise.resolve((options.load ?? load)(file, '.', asStream)).then(stream => parse(stream, { src: file, ...options }));
    }
    /**
     * parse css
     * @param stream
     * @param options
     *
     * Example:
     *
     * ```ts
     *
     * import {parse} from '@tbela99/css-parser/web';
     *
     *  // css string
     *  const result = await parse(css);
     *  console.log(result.ast);
     * ```
     *
     * Example using fetch and readable stream
     *
     * ```ts
     *
     *  import {parse} from '@tbela99/css-parser/web';
     *
     *  const response = await fetch('https://docs.deno.com/styles.css');
     *  const result = await parse(response.body, {beautify: true});
     *
     *  console.log(result.ast);
     * ```
     */
    async function parse(stream, options = {}) {
        return doParse(stream instanceof ReadableStream ? tokenizeStream(stream) : tokenize$1({
            stream,
            buffer: '',
            position: { ind: 0, lin: 1, col: 1 },
            currentPosition: { ind: -1, lin: 1, col: 0 }
        }), Object.assign(options, {
            load,
            resolve,
            dirname,
            cwd: options.cwd ?? self.location.pathname.endsWith('/') ? self.location.pathname : dirname(self.location.pathname)
        })).then(result => {
            const { revMapping, ...res } = result;
            return res;
        });
    }
    /**
     * transform css file
     * @param file url or path
     * @param options
     * @param asStream load file as stream
     *
     * Example:
     *
     * ```ts
     *
     * import {transformFile} from '@tbela99/css-parser/web';
     *
     * // remote file
     * let result = await transformFile('https://docs.deno.com/styles.css');
     * console.log(result.code);
     *
     * // local file
     * result = await transformFile('./css/styles.css');
     * console.log(result.code);
     * ```
     */
    async function transformFile(file, options = {}, asStream = false) {
        return Promise.resolve((options.load ?? load)(file, '.', asStream)).then(stream => transform(stream, { src: file, ...options }));
    }
    /**
     * transform css
     * @param css
     * @param options
     *
     * Example:
     *
     * ```ts
     *
     *  import {transform} from '@tbela99/css-parser/web';
     *
     *  // css string
     *  let result = await transform(css);
     *  console.log(result.code);
     *
     *  // using readable stream
     *  const response = await fetch('https://docs.deno.com/styles.css');
     *  result = await transform(response.body, {beautify: true});
     *
     *  console.log(result.code);
     * ```
     */
    async function transform(css, options = {}) {
        options = { minify: true, removeEmpty: true, removeCharset: true, ...options };
        const startTime = performance.now();
        return parse(css, options).then((parseResult) => {
            let mapping = null;
            let importMapping = null;
            if (typeof options.module == 'number' && options.module & exports.ModuleScopeEnumOptions.ICSS) {
                mapping = parseResult.mapping;
                importMapping = parseResult.importMapping;
            }
            else if (typeof options.module == 'object' && typeof options.module.scoped == 'number' && options.module.scoped & exports.ModuleScopeEnumOptions.ICSS) {
                mapping = parseResult.mapping;
                importMapping = parseResult.importMapping;
            }
            // ast already expanded by parse
            const rendered = render(parseResult.ast, { ...options, expandNestingRules: false }, mapping != null ? { mapping, importMapping } : null);
            return {
                ...parseResult,
                ...rendered,
                errors: parseResult.errors.concat(rendered.errors),
                stats: {
                    bytesOut: rendered.code.length,
                    ...parseResult.stats,
                    render: rendered.stats.total,
                    total: `${(performance.now() - startTime).toFixed(2)}ms`
                }
            };
        });
    }

    exports.SourceMap = SourceMap;
    exports.convertColor = convertColor;
    exports.dirname = dirname;
    exports.expand = expand;
    exports.isOkLabClose = isOkLabClose;
    exports.load = load;
    exports.minify = minify;
    exports.okLabDistance = okLabDistance;
    exports.parse = parse;
    exports.parseDeclarations = parseDeclarations;
    exports.parseFile = parseFile;
    exports.parseString = parseString;
    exports.parseTokens = parseTokens;
    exports.render = render;
    exports.renderToken = renderToken;
    exports.resolve = resolve;
    exports.transform = transform;
    exports.transformFile = transformFile;
    exports.walk = walk;
    exports.walkValues = walkValues;

}));
