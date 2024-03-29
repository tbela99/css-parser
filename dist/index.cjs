'use strict';

var promises = require('fs/promises');

exports.EnumToken = void 0;
(function (EnumToken) {
    EnumToken[EnumToken["CommentTokenType"] = 0] = "CommentTokenType";
    EnumToken[EnumToken["CDOCOMMTokenType"] = 1] = "CDOCOMMTokenType";
    EnumToken[EnumToken["StyleSheetNodeType"] = 2] = "StyleSheetNodeType";
    EnumToken[EnumToken["AtRuleNodeType"] = 3] = "AtRuleNodeType";
    EnumToken[EnumToken["RuleNodeType"] = 4] = "RuleNodeType";
    EnumToken[EnumToken["DeclarationNodeType"] = 5] = "DeclarationNodeType";
    EnumToken[EnumToken["LiteralTokenType"] = 6] = "LiteralTokenType";
    EnumToken[EnumToken["IdenTokenType"] = 7] = "IdenTokenType";
    EnumToken[EnumToken["DashedIdenTokenType"] = 8] = "DashedIdenTokenType";
    EnumToken[EnumToken["CommaTokenType"] = 9] = "CommaTokenType";
    EnumToken[EnumToken["ColonTokenType"] = 10] = "ColonTokenType";
    EnumToken[EnumToken["SemiColonTokenType"] = 11] = "SemiColonTokenType";
    EnumToken[EnumToken["NumberTokenType"] = 12] = "NumberTokenType";
    EnumToken[EnumToken["AtRuleTokenType"] = 13] = "AtRuleTokenType";
    EnumToken[EnumToken["PercentageTokenType"] = 14] = "PercentageTokenType";
    EnumToken[EnumToken["FunctionTokenType"] = 15] = "FunctionTokenType";
    EnumToken[EnumToken["TimelineFunctionTokenType"] = 16] = "TimelineFunctionTokenType";
    EnumToken[EnumToken["TimingFunctionTokenType"] = 17] = "TimingFunctionTokenType";
    EnumToken[EnumToken["UrlFunctionTokenType"] = 18] = "UrlFunctionTokenType";
    EnumToken[EnumToken["ImageFunctionTokenType"] = 19] = "ImageFunctionTokenType";
    EnumToken[EnumToken["StringTokenType"] = 20] = "StringTokenType";
    EnumToken[EnumToken["UnclosedStringTokenType"] = 21] = "UnclosedStringTokenType";
    EnumToken[EnumToken["DimensionTokenType"] = 22] = "DimensionTokenType";
    EnumToken[EnumToken["LengthTokenType"] = 23] = "LengthTokenType";
    EnumToken[EnumToken["AngleTokenType"] = 24] = "AngleTokenType";
    EnumToken[EnumToken["TimeTokenType"] = 25] = "TimeTokenType";
    EnumToken[EnumToken["FrequencyTokenType"] = 26] = "FrequencyTokenType";
    EnumToken[EnumToken["ResolutionTokenType"] = 27] = "ResolutionTokenType";
    EnumToken[EnumToken["HashTokenType"] = 28] = "HashTokenType";
    EnumToken[EnumToken["BlockStartTokenType"] = 29] = "BlockStartTokenType";
    EnumToken[EnumToken["BlockEndTokenType"] = 30] = "BlockEndTokenType";
    EnumToken[EnumToken["AttrStartTokenType"] = 31] = "AttrStartTokenType";
    EnumToken[EnumToken["AttrEndTokenType"] = 32] = "AttrEndTokenType";
    EnumToken[EnumToken["StartParensTokenType"] = 33] = "StartParensTokenType";
    EnumToken[EnumToken["EndParensTokenType"] = 34] = "EndParensTokenType";
    EnumToken[EnumToken["ParensTokenType"] = 35] = "ParensTokenType";
    EnumToken[EnumToken["WhitespaceTokenType"] = 36] = "WhitespaceTokenType";
    EnumToken[EnumToken["IncludeMatchTokenType"] = 37] = "IncludeMatchTokenType";
    EnumToken[EnumToken["DashMatchTokenType"] = 38] = "DashMatchTokenType";
    EnumToken[EnumToken["LtTokenType"] = 39] = "LtTokenType";
    EnumToken[EnumToken["LteTokenType"] = 40] = "LteTokenType";
    EnumToken[EnumToken["GtTokenType"] = 41] = "GtTokenType";
    EnumToken[EnumToken["GteTokenType"] = 42] = "GteTokenType";
    EnumToken[EnumToken["PseudoClassTokenType"] = 43] = "PseudoClassTokenType";
    EnumToken[EnumToken["PseudoClassFuncTokenType"] = 44] = "PseudoClassFuncTokenType";
    EnumToken[EnumToken["DelimTokenType"] = 45] = "DelimTokenType";
    EnumToken[EnumToken["UrlTokenTokenType"] = 46] = "UrlTokenTokenType";
    EnumToken[EnumToken["EOFTokenType"] = 47] = "EOFTokenType";
    EnumToken[EnumToken["ImportantTokenType"] = 48] = "ImportantTokenType";
    EnumToken[EnumToken["ColorTokenType"] = 49] = "ColorTokenType";
    EnumToken[EnumToken["AttrTokenType"] = 50] = "AttrTokenType";
    EnumToken[EnumToken["BadCommentTokenType"] = 51] = "BadCommentTokenType";
    EnumToken[EnumToken["BadCdoTokenType"] = 52] = "BadCdoTokenType";
    EnumToken[EnumToken["BadUrlTokenType"] = 53] = "BadUrlTokenType";
    EnumToken[EnumToken["BadStringTokenType"] = 54] = "BadStringTokenType";
    EnumToken[EnumToken["BinaryExpressionTokenType"] = 55] = "BinaryExpressionTokenType";
    EnumToken[EnumToken["UnaryExpressionTokenType"] = 56] = "UnaryExpressionTokenType";
    EnumToken[EnumToken["FlexTokenType"] = 57] = "FlexTokenType";
    /* catch all */
    EnumToken[EnumToken["ListToken"] = 58] = "ListToken";
    /* arithmetic tokens */
    EnumToken[EnumToken["Add"] = 59] = "Add";
    EnumToken[EnumToken["Mul"] = 60] = "Mul";
    EnumToken[EnumToken["Div"] = 61] = "Div";
    EnumToken[EnumToken["Sub"] = 62] = "Sub";
    /* new tokens */
    EnumToken[EnumToken["ColumnCombinatorTokenType"] = 63] = "ColumnCombinatorTokenType";
    EnumToken[EnumToken["ContainMatchTokenType"] = 64] = "ContainMatchTokenType";
    EnumToken[EnumToken["StartMatchTokenType"] = 65] = "StartMatchTokenType";
    EnumToken[EnumToken["EndMatchTokenType"] = 66] = "EndMatchTokenType";
    EnumToken[EnumToken["MatchExpressionTokenType"] = 67] = "MatchExpressionTokenType";
    EnumToken[EnumToken["NameSpaceAttributeTokenType"] = 68] = "NameSpaceAttributeTokenType";
    EnumToken[EnumToken["FractionTokenType"] = 69] = "FractionTokenType";
    EnumToken[EnumToken["IdenListTokenType"] = 70] = "IdenListTokenType";
    EnumToken[EnumToken["GridTemplateFuncTokenType"] = 71] = "GridTemplateFuncTokenType";
    /* aliases */
    EnumToken[EnumToken["Time"] = 25] = "Time";
    EnumToken[EnumToken["Iden"] = 7] = "Iden";
    EnumToken[EnumToken["Hash"] = 28] = "Hash";
    EnumToken[EnumToken["Flex"] = 57] = "Flex";
    EnumToken[EnumToken["Angle"] = 24] = "Angle";
    EnumToken[EnumToken["Color"] = 49] = "Color";
    EnumToken[EnumToken["Comma"] = 9] = "Comma";
    EnumToken[EnumToken["String"] = 20] = "String";
    EnumToken[EnumToken["Length"] = 23] = "Length";
    EnumToken[EnumToken["Number"] = 12] = "Number";
    EnumToken[EnumToken["Perc"] = 14] = "Perc";
    EnumToken[EnumToken["Literal"] = 6] = "Literal";
    EnumToken[EnumToken["Comment"] = 0] = "Comment";
    EnumToken[EnumToken["UrlFunc"] = 18] = "UrlFunc";
    EnumToken[EnumToken["Dimension"] = 22] = "Dimension";
    EnumToken[EnumToken["Frequency"] = 26] = "Frequency";
    EnumToken[EnumToken["Resolution"] = 27] = "Resolution";
    EnumToken[EnumToken["Whitespace"] = 36] = "Whitespace";
    EnumToken[EnumToken["IdenList"] = 70] = "IdenList";
    EnumToken[EnumToken["DashedIden"] = 8] = "DashedIden";
    EnumToken[EnumToken["GridTemplateFunc"] = 71] = "GridTemplateFunc";
    EnumToken[EnumToken["ImageFunc"] = 19] = "ImageFunc";
    EnumToken[EnumToken["CommentNodeType"] = 0] = "CommentNodeType";
    EnumToken[EnumToken["CDOCOMMNodeType"] = 1] = "CDOCOMMNodeType";
    EnumToken[EnumToken["TimingFunction"] = 17] = "TimingFunction";
    EnumToken[EnumToken["TimelineFunction"] = 16] = "TimelineFunction";
})(exports.EnumToken || (exports.EnumToken = {}));
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
const NAMES_COLORS = Object.seal({
    '#f0f8ff': 'aliceblue',
    '#faebd7': 'antiquewhite',
    // '#00ffff': 'aqua',
    '#7fffd4': 'aquamarine',
    '#f0ffff': 'azure',
    '#f5f5dc': 'beige',
    '#ffe4c4': 'bisque',
    '#000000': 'black',
    '#ffebcd': 'blanchedalmond',
    '#0000ff': 'blue',
    '#8a2be2': 'blueviolet',
    '#a52a2a': 'brown',
    '#deb887': 'burlywood',
    '#5f9ea0': 'cadetblue',
    '#7fff00': 'chartreuse',
    '#d2691e': 'chocolate',
    '#ff7f50': 'coral',
    '#6495ed': 'cornflowerblue',
    '#fff8dc': 'cornsilk',
    '#dc143c': 'crimson',
    '#00ffff': 'cyan',
    '#00008b': 'darkblue',
    '#008b8b': 'darkcyan',
    '#b8860b': 'darkgoldenrod',
    // '#a9a9a9': 'darkgray',
    '#a9a9a9': 'darkgrey',
    '#006400': 'darkgreen',
    '#bdb76b': 'darkkhaki',
    '#8b008b': 'darkmagenta',
    '#556b2f': 'darkolivegreen',
    '#ff8c00': 'darkorange',
    '#9932cc': 'darkorchid',
    '#8b0000': 'darkred',
    '#e9967a': 'darksalmon',
    '#8fbc8f': 'darkseagreen',
    '#483d8b': 'darkslateblue',
    // '#2f4f4f': 'darkslategray',
    '#2f4f4f': 'darkslategrey',
    '#00ced1': 'darkturquoise',
    '#9400d3': 'darkviolet',
    '#ff1493': 'deeppink',
    '#00bfff': 'deepskyblue',
    // '#696969': 'dimgray',
    '#696969': 'dimgrey',
    '#1e90ff': 'dodgerblue',
    '#b22222': 'firebrick',
    '#fffaf0': 'floralwhite',
    '#228b22': 'forestgreen',
    // '#ff00ff': 'fuchsia',
    '#dcdcdc': 'gainsboro',
    '#f8f8ff': 'ghostwhite',
    '#ffd700': 'gold',
    '#daa520': 'goldenrod',
    //    '#808080': 'gray',
    '#808080': 'grey',
    '#008000': 'green',
    '#adff2f': 'greenyellow',
    '#f0fff0': 'honeydew',
    '#ff69b4': 'hotpink',
    '#cd5c5c': 'indianred',
    '#4b0082': 'indigo',
    '#fffff0': 'ivory',
    '#f0e68c': 'khaki',
    '#e6e6fa': 'lavender',
    '#fff0f5': 'lavenderblush',
    '#7cfc00': 'lawngreen',
    '#fffacd': 'lemonchiffon',
    '#add8e6': 'lightblue',
    '#f08080': 'lightcoral',
    '#e0ffff': 'lightcyan',
    '#fafad2': 'lightgoldenrodyellow',
    // '#d3d3d3': 'lightgray',
    '#d3d3d3': 'lightgrey',
    '#90ee90': 'lightgreen',
    '#ffb6c1': 'lightpink',
    '#ffa07a': 'lightsalmon',
    '#20b2aa': 'lightseagreen',
    '#87cefa': 'lightskyblue',
    // '#778899': 'lightslategray',
    '#778899': 'lightslategrey',
    '#b0c4de': 'lightsteelblue',
    '#ffffe0': 'lightyellow',
    '#00ff00': 'lime',
    '#32cd32': 'limegreen',
    '#faf0e6': 'linen',
    '#ff00ff': 'magenta',
    '#800000': 'maroon',
    '#66cdaa': 'mediumaquamarine',
    '#0000cd': 'mediumblue',
    '#ba55d3': 'mediumorchid',
    '#9370d8': 'mediumpurple',
    '#3cb371': 'mediumseagreen',
    '#7b68ee': 'mediumslateblue',
    '#00fa9a': 'mediumspringgreen',
    '#48d1cc': 'mediumturquoise',
    '#c71585': 'mediumvioletred',
    '#191970': 'midnightblue',
    '#f5fffa': 'mintcream',
    '#ffe4e1': 'mistyrose',
    '#ffe4b5': 'moccasin',
    '#ffdead': 'navajowhite',
    '#000080': 'navy',
    '#fdf5e6': 'oldlace',
    '#808000': 'olive',
    '#6b8e23': 'olivedrab',
    '#ffa500': 'orange',
    '#ff4500': 'orangered',
    '#da70d6': 'orchid',
    '#eee8aa': 'palegoldenrod',
    '#98fb98': 'palegreen',
    '#afeeee': 'paleturquoise',
    '#d87093': 'palevioletred',
    '#ffefd5': 'papayawhip',
    '#ffdab9': 'peachpuff',
    '#cd853f': 'peru',
    '#ffc0cb': 'pink',
    '#dda0dd': 'plum',
    '#b0e0e6': 'powderblue',
    '#800080': 'purple',
    '#ff0000': 'red',
    '#bc8f8f': 'rosybrown',
    '#4169e1': 'royalblue',
    '#8b4513': 'saddlebrown',
    '#fa8072': 'salmon',
    '#f4a460': 'sandybrown',
    '#2e8b57': 'seagreen',
    '#fff5ee': 'seashell',
    '#a0522d': 'sienna',
    '#c0c0c0': 'silver',
    '#87ceeb': 'skyblue',
    '#6a5acd': 'slateblue',
    // '#708090': 'slategray',
    '#708090': 'slategrey',
    '#fffafa': 'snow',
    '#00ff7f': 'springgreen',
    '#4682b4': 'steelblue',
    '#d2b48c': 'tan',
    '#008080': 'teal',
    '#d8bfd8': 'thistle',
    '#ff6347': 'tomato',
    '#40e0d0': 'turquoise',
    '#ee82ee': 'violet',
    '#f5deb3': 'wheat',
    '#ffffff': 'white',
    '#f5f5f5': 'whitesmoke',
    '#ffff00': 'yellow',
    '#9acd32': 'yellowgreen',
    '#663399': 'rebeccapurple',
    '#00000000': 'transparent'
});
/**
 * clamp color values
 * @param token
 */
function clamp(token) {
    if (token.kin == 'rgb' || token.kin == 'rgba') {
        token.chi.filter((token) => ![exports.EnumToken.LiteralTokenType, exports.EnumToken.CommaTokenType, exports.EnumToken.WhitespaceTokenType].includes(token.typ)).
            forEach((token, index) => {
            if (index <= 2) {
                if (token.typ == exports.EnumToken.NumberTokenType) {
                    token.val = String(Math.min(255, Math.max(0, +token.val)));
                }
                else if (token.typ == exports.EnumToken.PercentageTokenType) {
                    token.val = String(Math.min(100, Math.max(0, +token.val)));
                }
            }
            else {
                if (token.typ == exports.EnumToken.NumberTokenType) {
                    token.val = String(Math.min(1, Math.max(0, +token.val)));
                }
                else if (token.typ == exports.EnumToken.PercentageTokenType) {
                    token.val = String(Math.min(100, Math.max(0, +token.val)));
                }
            }
        });
    }
    return token;
}
function getNumber(token) {
    if (token.typ == exports.EnumToken.IdenTokenType && token.val == 'none') {
        return 0;
    }
    // @ts-ignore
    return token.typ == exports.EnumToken.PercentageTokenType ? token.val / 100 : +token.val;
}
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

function hwb2rgb(hue, white, black, alpha = null) {
    const rgb = hsl2rgb(hue, 1, .5);
    for (let i = 0; i < 3; i++) {
        rgb[i] *= (1 - white - black);
        rgb[i] = Math.round(rgb[i] + white);
    }
    if (alpha != null && alpha != 1) {
        rgb.push(alpha);
    }
    return rgb;
}
function hsl2rgb(h, s, l, a = null) {
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
    const values = [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
    if (a != null && a != 1) {
        values.push(Math.round(a * 255));
    }
    return values;
}

function rgb2Hex(token) {
    let value = '#';
    let t;
    // @ts-ignore
    for (let i = 0; i < 3; i++) {
        // @ts-ignore
        t = token.chi[i];
        // @ts-ignore
        value += (t.val == 'none' ? '0' : Math.round(t.typ == exports.EnumToken.PercentageTokenType ? 255 * t.val / 100 : t.val)).toString(16).padStart(2, '0');
    }
    // @ts-ignore
    if (token.chi.length == 4) {
        // @ts-ignore
        t = token.chi[3];
        // @ts-ignore
        if ((t.typ == exports.EnumToken.IdenTokenType && t.val == 'none') ||
            (t.typ == exports.EnumToken.NumberTokenType && +t.val < 1) ||
            (t.typ == exports.EnumToken.PercentageTokenType && +t.val < 100)) {
            // @ts-ignore
            value += Math.round(255 * getNumber(t)).toString(16).padStart(2, '0');
        }
    }
    return value;
}
function hsl2Hex(token) {
    let t;
    // @ts-ignore
    let h = getAngle(token.chi[0]);
    // @ts-ignore
    t = token.chi[1];
    // @ts-ignore
    let s = getNumber(t);
    // @ts-ignore
    t = token.chi[2];
    // @ts-ignore
    let l = getNumber(t);
    let a = null;
    if (token.chi?.length == 4) {
        // @ts-ignore
        t = token.chi[3];
        // @ts-ignore
        if ((t.typ == exports.EnumToken.IdenTokenType && t.val == 'none') || (t.typ == exports.EnumToken.PercentageTokenType && +t.val < 100) ||
            // @ts-ignore
            (t.typ == exports.EnumToken.NumberTokenType && t.val < 1)) {
            // @ts-ignore
            a = getNumber(t);
        }
    }
    return `#${hsl2rgb(h, s, l, a).reduce((acc, curr) => acc + curr.toString(16).padStart(2, '0'), '')}`;
}
function hwb2hex(token) {
    let t;
    // @ts-ignore
    let h = getAngle(token.chi[0]);
    // @ts-ignore
    t = token.chi[1];
    // @ts-ignore
    let white = getNumber(t);
    // @ts-ignore
    t = token.chi[2];
    // @ts-ignore
    let black = getNumber(t);
    let a = null;
    if (token.chi?.length == 4) {
        // @ts-ignore
        t = token.chi[3];
        // @ts-ignore
        if ((t.typ == exports.EnumToken.IdenTokenType && t.val == 'none') ||
            (t.typ == exports.EnumToken.PercentageTokenType && +t.val < 100) ||
            (t.typ == exports.EnumToken.NumberTokenType && +t.val < 1)) {
            // @ts-ignore
            a = getNumber(t);
        }
    }
    const rgb = hsl2rgb(h, 1, .5, a);
    let value;
    for (let i = 0; i < 3; i++) {
        value = rgb[i] / 255;
        value *= (1 - white - black);
        value += white;
        rgb[i] = Math.round(value * 255);
    }
    return `#${rgb.reduce((acc, curr) => acc + curr.toString(16).padStart(2, '0'), '')}`;
}
function cmyk2hex(token) {
    // @ts-ignore
    let t = token.chi[0];
    // @ts-ignore
    const c = getNumber(t);
    // @ts-ignore
    t = token.chi[1];
    // @ts-ignore
    const m = getNumber(t);
    // @ts-ignore
    t = token.chi[2];
    // @ts-ignore
    const y = getNumber(t);
    // @ts-ignore
    t = token.chi[3];
    // @ts-ignore
    const k = getNumber(t);
    const rgb = [
        Math.round(255 * (1 - Math.min(1, c * (1 - k) + k))),
        Math.round(255 * (1 - Math.min(1, m * (1 - k) + k))),
        Math.round(255 * (1 - Math.min(1, y * (1 - k) + k)))
    ];
    // @ts-ignore
    if (token.chi.length >= 9) {
        // @ts-ignore
        t = token.chi[8];
        // @ts-ignore
        rgb.push(Math.round(255 * getNumber(t)));
    }
    return `#${rgb.reduce((acc, curr) => acc + curr.toString(16).padStart(2, '0'), '')}`;
}

function hwb2hsv(h, w, b) {
    return [h, 1 - w / (1 - b), 1 - b];
}
// https://gist.github.com/defims/0ca2ef8832833186ed396a2f8a204117#file-annotated-js
function hsl2hsv(h, s, l) {
    s *= l < .5 ? l : 1 - l;
    return [
        //Range should be between 0 - 1
        h,
        2 * s / (l + s),
        l + s //Value
    ];
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
function rgb2hwb(r, g, b, a = null, fallback = 0) {
    r *= 100 / 255;
    g *= 100 / 255;
    b *= 100 / 255;
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
function hsv2hwb(h, s, v) {
    return [h, (1 - s) * v, 1 - v];
}
function hsl2hwb(h, s, l) {
    return hsv2hwb(...hsl2hsv(h, s, l));
}

function rgb2hsl(r, g, b, a) {
    r /= 255;
    g /= 255;
    b /= 255;
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
    return [h, s, l, a == 1 ? null : a ?? null];
}
// https://gist.github.com/defims/0ca2ef8832833186ed396a2f8a204117#file-annotated-js
function hsv2hsl(h, s, v) {
    return [
        //[hue, saturation, lightness]
        //Range should be between 0 - 1
        h,
        //Saturation is very different between the two color spaces
        //If (2-sat)*val < 1 set it to sat*val/((2-sat)*val)
        //Otherwise sat*val/(2-(2-sat)*val)
        //Conditional is not operating with hue, it is reassigned!
        s * v / ((h = (2 - s) * v) < 1 ? h : 2 - h),
        h / 2 //Lightness is (2-sat)*val/2
        //See reassignment of hue above
    ];
}
function hwb2hsl(h, w, b) {
    return hsv2hsl(...hwb2hsv(h, w, b));
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

class SourceMap {
    #version = 3;
    #sources = [];
    #map = new Map;
    #line = -1;
    lastLocation = null;
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
    toUrl() {
        // /*# sourceMappingURL = ${url} */
        return `data:application/json,${encodeURIComponent(JSON.stringify(this.toJSON()))}`;
    }
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

const gcd = (x, y) => {
    x = Math.abs(x);
    y = Math.abs(y);
    let t;
    if (x == 0 || y == 0) {
        return 1;
    }
    while (y) {
        t = y;
        y = x % y;
        x = t;
    }
    return x;
};
function compute(a, b, op) {
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
                const r2 = reduceNumber(r[0]) + '/' + reduceNumber(r[1]);
                return reduceNumber(result).length <= r2.length ? result : {
                    typ: exports.EnumToken.FractionTokenType,
                    l: { typ: exports.EnumToken.NumberTokenType, val: reduceNumber(r[0]) },
                    r: { typ: exports.EnumToken.NumberTokenType, val: reduceNumber(r[1]) }
                };
        }
    }
    let l1 = typeof a == 'number' ? {
        typ: exports.EnumToken.FractionTokenType,
        l: { typ: exports.EnumToken.NumberTokenType, val: reduceNumber(a) },
        r: { typ: exports.EnumToken.NumberTokenType, val: '1' }
    } : a;
    let r1 = typeof b == 'number' ? {
        typ: exports.EnumToken.FractionTokenType,
        l: { typ: exports.EnumToken.NumberTokenType, val: reduceNumber(b) },
        r: { typ: exports.EnumToken.NumberTokenType, val: '1' }
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
    const a2 = simplify(l2, r2);
    if (a2[1] == 1) {
        return a2[0];
    }
    const result = a2[0] / a2[1];
    return reduceNumber(result).length <= reduceNumber(a2[0]).length + 1 + reduceNumber(a2[1]).length ? result : {
        typ: exports.EnumToken.FractionTokenType,
        l: { typ: exports.EnumToken.NumberTokenType, val: reduceNumber(a2[0]) },
        r: { typ: exports.EnumToken.NumberTokenType, val: reduceNumber(a2[1]) }
    };
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
    const nodes = inlineExpression(evaluateExpression(buildExpression(tokens)));
    if (nodes.length <= 1) {
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
                token = doEvaluate(nodes[i + 1], { typ: exports.EnumToken.NumberTokenType, val: '-1' }, exports.EnumToken.Mul);
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
                acc.push({ typ: exports.EnumToken.Sub }, { ...token, val: String(-token.val) });
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
    if (!isScalarToken(l) || !isScalarToken(r)) {
        return defaultReturn;
    }
    if ((op == exports.EnumToken.Add || op == exports.EnumToken.Sub)) {
        // @ts-ignore
        if (l.typ != r.typ) {
            return defaultReturn;
        }
    }
    const typ = l.typ == exports.EnumToken.NumberTokenType ? r.typ : l.typ;
    // @ts-ignore
    const val = compute(typeof l.val == 'string' ? +l.val : l.val, typeof r.val == 'string' ? +r.val : r.val, op);
    return { ...(l.typ == exports.EnumToken.NumberTokenType ? r : l), typ, val: typeof val == 'number' ? reduceNumber(val) : val };
}
/**
 * convert BinaryExpression into an array
 * @param token
 */
function inlineExpression(token) {
    const result = [];
    if (token.typ == exports.EnumToken.ParensTokenType && token.chi.length == 1) {
        result.push(token.chi[0]);
    }
    else if (token.typ == exports.EnumToken.BinaryExpressionTokenType) {
        if ([exports.EnumToken.Mul, exports.EnumToken.Div].includes(token.op)) {
            result.push(token);
        }
        else {
            result.push(...inlineExpression(token.l), { typ: token.op }, ...inlineExpression(token.r));
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
    return 'unit' in token || [exports.EnumToken.NumberTokenType, exports.EnumToken.FractionTokenType, exports.EnumToken.PercentageTokenType].includes(token.typ);
}
/**
 *
 * generate binary expression tree
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
 * generate binary expression tree
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
 * generate binary expression tree
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
    const type = relativeKeys.join('');
    let r;
    let g;
    let b;
    let alpha = null;
    let keys = {};
    let values = {};
    let children;
    switch (original.kin) {
        case 'lit':
        case 'hex':
            let value = original.val.toLowerCase();
            if (original.kin == 'lit') {
                if (original.val.toLowerCase() in COLORS_NAMES) {
                    value = COLORS_NAMES[original.val.toLowerCase()];
                }
                else {
                    return null;
                }
            }
            if (value.length == 4) {
                value = '#' + value[1] + value[1] + value[2] + value[2] + value[3] + value[3];
            }
            else if (value.length == 5) {
                value = '#' + value[1] + value[1] + value[2] + value[2] + value[3] + value[3] + value[4] + value[4];
            }
            r = parseInt(value.slice(1, 3), 16);
            g = parseInt(value.slice(3, 5), 16);
            b = parseInt(value.slice(5, 7), 16);
            alpha = value.length == 9 ? parseInt(value.slice(7, 9), 16) : null;
            break;
        case 'rgb':
        case 'rgba':
            children = original.chi.filter((t) => t.typ == exports.EnumToken.NumberTokenType || t.typ == exports.EnumToken.IdenTokenType || t.typ == exports.EnumToken.PercentageTokenType);
            if (children.every((t) => (t.typ == exports.EnumToken.IdenTokenType && t.val == 'none') || t.typ == exports.EnumToken.NumberTokenType)) {
                r = children[0].typ == exports.EnumToken.IdenTokenType && children[0].val == 'none' ? 0 : +children[0].val;
                g = children[1].typ == exports.EnumToken.IdenTokenType && children[1].val == 'none' ? 0 : +children[1].val;
                b = children[2].typ == exports.EnumToken.IdenTokenType && children[2].val == 'none' ? 0 : +children[2].val;
                alpha = children.length < 4 ? null : children[3].typ == exports.EnumToken.IdenTokenType && children[3].val == 'none' ? 0 : +children[3].val;
            }
            else if (children.every((t) => t.typ == exports.EnumToken.PercentageTokenType || (t.typ == exports.EnumToken.IdenTokenType && t.val == 'none') || (t.typ == exports.EnumToken.NumberTokenType && t.val == '0'))) {
                // @ts-ignore
                r = children[0].typ == exports.EnumToken.IdenTokenType && children[0].val == 'none' ? 0 : children[0].val * 255 / 100;
                // @ts-ignore
                g = children[1].typ == exports.EnumToken.IdenTokenType && children[1].val == 'none' ? 0 : children[1].val * 255 / 100;
                // @ts-ignore
                b = children[2].typ == exports.EnumToken.IdenTokenType && children[2].val == 'none' ? 0 : children[2].val * 255 / 100;
                alpha = children.length < 4 ? null : children[3].typ == exports.EnumToken.IdenTokenType && children[3].val == 'none' ? 0 : +children[3].val / 100;
            }
            else {
                return null;
            }
            break;
        case 'hsl':
        case 'hsla':
        case 'hwb':
            children = original.chi.filter((t) => t.typ == exports.EnumToken.AngleTokenType || t.typ == exports.EnumToken.NumberTokenType || t.typ == exports.EnumToken.IdenTokenType || t.typ == exports.EnumToken.PercentageTokenType);
            if (children.length == 3 || children.length == 4) {
                [r, g, b, alpha] = children;
            }
            else {
                return null;
            }
            break;
        default:
            return null;
    }
    const from = ['rgb', 'rgba', 'hex', 'lit'].includes(original.kin) ? 'rgb' : original.kin;
    if (from != type) {
        if (type == 'hsl' || type == 'hwb') {
            if (from == 'rgb') {
                [r, g, b] = (type == 'hwb' ? rgb2hwb : rgb2hsl)(r, g, b);
                // @ts-ignore
                r *= 360;
                // @ts-ignore
                g *= 100;
                // @ts-ignore
                b *= 100;
                values = {
                    [relativeKeys[0]]: { typ: exports.EnumToken.AngleTokenType, val: r, unit: 'deg' },
                    [relativeKeys[1]]: { typ: exports.EnumToken.PercentageTokenType, val: g },
                    [relativeKeys[2]]: { typ: exports.EnumToken.PercentageTokenType, val: b }
                };
            }
            else if (from == 'hwb' || from == 'hsl') {
                if (type == 'hsl') {
                    if (from == 'hwb') {
                        [r, g, b] = hwb2hsl(getAngle(r), getNumber(g), getNumber(b));
                        // @ts-ignore
                        r *= 360;
                        // @ts-ignore
                        g *= 100;
                        // @ts-ignore
                        b *= 100;
                        // @ts-ignore
                        values = {
                            [relativeKeys[0]]: { typ: exports.EnumToken.AngleTokenType, val: r, unit: 'deg' },
                            [relativeKeys[1]]: { typ: exports.EnumToken.PercentageTokenType, val: g },
                            [relativeKeys[2]]: { typ: exports.EnumToken.PercentageTokenType, val: b }
                        };
                    }
                }
                else if (type == 'hwb') {
                    if (from == 'hsl') {
                        [r, g, b] = hsl2hwb(getAngle(r), getNumber(g), getNumber(b));
                        // @ts-ignore
                        r *= 360;
                        // @ts-ignore
                        g *= 100;
                        // @ts-ignore
                        b *= 100;
                        // @ts-ignore
                        values = {
                            [relativeKeys[0]]: { typ: exports.EnumToken.AngleTokenType, val: r, unit: 'deg' },
                            [relativeKeys[1]]: { typ: exports.EnumToken.PercentageTokenType, val: g },
                            [relativeKeys[2]]: { typ: exports.EnumToken.PercentageTokenType, val: b }
                        };
                    }
                }
            }
            else {
                return null;
            }
        }
        else if (type == 'rgb') {
            if (from == 'hsl' || from == 'hwb') {
                [r, g, b] = (from == 'hwb' ? hwb2rgb : hsl2rgb)(getAngle(r), getNumber(g), getNumber(b));
                // @ts-ignore
                values = {
                    [relativeKeys[0]]: { typ: exports.EnumToken.NumberTokenType, val: r },
                    [relativeKeys[1]]: { typ: exports.EnumToken.NumberTokenType, val: g },
                    [relativeKeys[2]]: { typ: exports.EnumToken.NumberTokenType, val: b }
                };
            }
            else {
                return null;
            }
        }
    }
    else {
        values = {
            [relativeKeys[0]]: r,
            [relativeKeys[1]]: g,
            [relativeKeys[2]]: b
        };
    }
    if (aExp != null && aExp.typ == exports.EnumToken.IdenTokenType && aExp.val == 'none') {
        aExp = null;
    }
    keys = {
        [relativeKeys[0]]: rExp,
        [relativeKeys[1]]: gExp,
        [relativeKeys[2]]: bExp,
        alpha: aExp ?? { typ: exports.EnumToken.IdenTokenType, val: 'alpha' }
    };
    // @ts-ignore
    values.alpha = alpha != null && typeof alpha == 'object' ? alpha : b.typ == exports.EnumToken.PercentageTokenType ? { typ: exports.EnumToken.PercentageTokenType, val: String(alpha ?? 100) } : { typ: exports.EnumToken.NumberTokenType, val: String(alpha ?? 1) };
    return computeComponentValue(keys, values);
}
function computeComponentValue(expr, values) {
    for (const [key, exp] of Object.entries(expr)) {
        if (exp == null) {
            if (key in values) {
                if (typeof values[key] == 'number') {
                    expr[key] = {
                        typ: exports.EnumToken.NumberTokenType,
                        val: reduceNumber(values[key])
                    };
                }
                else {
                    expr[key] = values[key];
                }
            }
        }
        else if ([exports.EnumToken.NumberTokenType, exports.EnumToken.PercentageTokenType, exports.EnumToken.AngleTokenType, exports.EnumToken.LengthTokenType].includes(exp.typ)) ;
        else if (exp.typ == exports.EnumToken.IdenTokenType && exp.val in values) {
            if (typeof values[exp.val] == 'number') {
                expr[key] = {
                    typ: exports.EnumToken.NumberTokenType,
                    val: reduceNumber(values[exp.val])
                };
            }
            else {
                expr[key] = values[exp.val];
            }
        }
        else if (exp.typ == exports.EnumToken.FunctionTokenType && exp.val == 'calc') {
            for (let { value, parent } of walkValues(exp.chi)) {
                if (value.typ == exports.EnumToken.IdenTokenType) {
                    if (!(value.val in values)) {
                        return null;
                    }
                    if (parent == null) {
                        parent = exp;
                    }
                    if (parent.typ == exports.EnumToken.BinaryExpressionTokenType) {
                        if (parent.l == value) {
                            parent.l = values[value.val];
                        }
                        else {
                            parent.r = values[value.val];
                        }
                    }
                    else {
                        for (let i = 0; i < parent.chi.length; i++) {
                            if (parent.chi[i] == value) {
                                parent.chi.splice(i, 1, values[value.val]);
                                break;
                            }
                        }
                    }
                }
            }
            const result = evaluate(exp.chi);
            if (result.length == 1 && result[0].typ != exports.EnumToken.BinaryExpressionTokenType) {
                expr[key] = result[0];
            }
            else {
                return null;
            }
        }
    }
    return expr;
}

const colorsFunc = ['rgb', 'rgba', 'hsl', 'hsla', 'hwb', 'device-cmyk'];
function reduceNumber(val) {
    val = String(+val);
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
function doRender(data, options = {}) {
    options = {
        ...(options.minify ?? true ? {
            indent: '',
            newLine: '',
            removeComments: true
        } : {
            indent: ' ',
            newLine: '\n',
            compress: false,
            removeComments: false,
        }), sourcemap: false, convertColor: true, expandNestingRules: false, preserveLicense: false, ...options
    };
    const startTime = performance.now();
    const errors = [];
    const sourcemap = options.sourcemap ? new SourceMap : null;
    const cache = Object.create(null);
    const result = {
        code: renderAstNode(options.expandNestingRules ? expand(data) : data, options, sourcemap, {
            ind: 0,
            lin: 1,
            col: 1
        }, errors, function reducer(acc, curr) {
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
        result.map = sourcemap.toJSON();
    }
    return result;
}
function updateSourceMap(node, options, cache, sourcemap, position, str) {
    if ([exports.EnumToken.RuleNodeType, exports.EnumToken.AtRuleNodeType].includes(node.typ)) {
        let src = node.loc?.src ?? '';
        let output = options.output ?? '';
        // if (src !== '') {
        if (!(src in cache)) {
            // @ts-ignore
            cache[src] = options.resolve(src, options.cwd ?? '').relative;
        }
        // }
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
// @ts-ignore
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
            return `${data.nam}:${options.indent}${data.val.reduce(reducer, '')}`;
        case exports.EnumToken.CommentNodeType:
        case exports.EnumToken.CDOCOMMNodeType:
            if (data.val.startsWith('# sourceMappingURL=')) {
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
                    if (sourcemap != null) {
                        updateSourceMap(node, options, cache, sourcemap, position, str);
                    }
                    return str;
                }
                if (sourcemap != null) {
                    update(position, options.newLine);
                    updateSourceMap(node, options, cache, sourcemap, position, str);
                }
                return `${css}${options.newLine}${str}`;
            }, '');
        case exports.EnumToken.AtRuleNodeType:
        case exports.EnumToken.RuleNodeType:
            if (data.typ == exports.EnumToken.AtRuleNodeType && !('chi' in data)) {
                return `${indent}@${data.nam}${data.val === '' ? '' : options.indent || ' '}${data.val};`;
            }
            // @ts-ignore
            let children = data.chi.reduce((css, node) => {
                let str;
                if (node.typ == exports.EnumToken.CommentNodeType) {
                    str = options.removeComments && (!options.preserveLicense || !node.val.startsWith('/*!')) ? '' : node.val;
                }
                else if (node.typ == exports.EnumToken.DeclarationNodeType) {
                    if (node.val.length == 0) {
                        // @ts-ignore
                        errors.push({
                            action: 'ignore',
                            message: `render: invalid declaration ${JSON.stringify(node)}`,
                            location: node.loc
                        });
                        return '';
                    }
                    str = `${node.nam}:${options.indent}${node.val.reduce(reducer, '').trimEnd()};`;
                }
                else if (node.typ == exports.EnumToken.AtRuleNodeType && !('chi' in node)) {
                    str = `${data.val === '' ? '' : options.indent || ' '}${data.val};`;
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
            if (children.endsWith(';')) {
                children = children.slice(0, -1);
            }
            if (data.typ == exports.EnumToken.AtRuleNodeType) {
                return `@${data.nam}${data.val === '' ? '' : options.indent || ' '}${data.val}${options.indent}{${options.newLine}` + (children === '' ? '' : indentSub + children + options.newLine) + indent + `}`;
            }
            return data.sel + `${options.indent}{${options.newLine}` + (children === '' ? '' : indentSub + children + options.newLine) + indent + `}`;
    }
    return '';
}
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
            if (token.chi[0].typ == exports.EnumToken.IdenTokenType && token.chi[0].val == 'from') {
                // @ts-ignore
                token.cal = 'rel';
            }
            else {
                token.chi = token.chi.filter((t) => ![exports.EnumToken.WhitespaceTokenType, exports.EnumToken.CommaTokenType, exports.EnumToken.CommentTokenType].includes(t.typ));
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
                const value = reduceNumber(+token.l.val / +token.r.val);
                if (value.length <= fraction.length) {
                    return value;
                }
            }
            return fraction;
        case exports.EnumToken.Add:
            return ' + ';
        case exports.EnumToken.Sub:
            return ' - ';
        case exports.EnumToken.Mul:
            return '*';
        case exports.EnumToken.Div:
            return '/';
        case exports.EnumToken.ColorTokenType:
            if (options.convertColor) {
                if (token.cal == 'rel' && ['rgb', 'hsl', 'hwb'].includes(token.val)) {
                    const chi = token.chi.filter(x => ![
                        exports.EnumToken.LiteralTokenType, exports.EnumToken.CommaTokenType, exports.EnumToken.WhitespaceTokenType, exports.EnumToken.CommentTokenType
                    ].includes(x.typ));
                    const components = parseRelativeColor(token.val.split(''), chi[1], chi[2], chi[3], chi[4], chi[5]);
                    if (components != null) {
                        token.chi = Object.values(components);
                        delete token.cal;
                    }
                }
                if (token.cal) {
                    let slice = false;
                    if (token.cal == 'rel') {
                        const last = token.chi.at(-1);
                        if ((last.typ == exports.EnumToken.NumberTokenType && last.val == '1') || (last.typ == exports.EnumToken.IdenTokenType && last.val == 'none')) {
                            const prev = token.chi.at(-2);
                            if (prev.typ == exports.EnumToken.LiteralTokenType && prev.val == '/') {
                                slice = true;
                            }
                        }
                    }
                    return clamp(token).val + '(' + (slice ? token.chi.slice(0, -2) : token.chi).reduce((acc, curr) => {
                        const val = renderToken(curr, options, cache);
                        if ([exports.EnumToken.LiteralTokenType, exports.EnumToken.CommaTokenType].includes(curr.typ)) {
                            return acc + val;
                        }
                        if (acc.length > 0) {
                            return acc + (['/', ','].includes(acc.at(-1)) ? '' : ' ') + val;
                        }
                        return val;
                    }, '') + ')';
                }
                if (token.kin == 'lit' && token.val.localeCompare('currentcolor', undefined, { sensitivity: 'base' }) == 0) {
                    return 'currentcolor';
                }
                clamp(token);
                if (Array.isArray(token.chi) && token.chi.some((t) => t.typ == exports.EnumToken.FunctionTokenType || (t.typ == exports.EnumToken.ColorTokenType && Array.isArray(t.chi)))) {
                    return (token.val.endsWith('a') ? token.val.slice(0, -1) : token.val) + '(' + token.chi.reduce((acc, curr) => acc + (acc.length > 0 && !(acc.endsWith('/') || curr.typ == exports.EnumToken.LiteralTokenType) ? ' ' : '') + renderToken(curr, options, cache), '') + ')';
                }
                let value = token.kin == 'hex' ? token.val.toLowerCase() : (token.kin == 'lit' ? COLORS_NAMES[token.val.toLowerCase()] : '');
                if (token.val == 'rgb' || token.val == 'rgba') {
                    value = rgb2Hex(token);
                }
                else if (token.val == 'hsl' || token.val == 'hsla') {
                    value = hsl2Hex(token);
                }
                else if (token.val == 'hwb') {
                    value = hwb2hex(token);
                }
                else if (token.val == 'device-cmyk') {
                    value = cmyk2hex(token);
                }
                const named_color = NAMES_COLORS[value];
                if (value !== '') {
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
                            value = `#${value[1]}${value[3]}${value[5]}${value[7]}`;
                        }
                    }
                    return named_color != null && named_color.length <= value.length ? named_color : value;
                }
            }
            if (token.kin == 'hex' || token.kin == 'lit') {
                return token.val;
            }
            if (Array.isArray(token.chi)) {
                return (token.val.endsWith('a') ? token.val.slice(0, -1) : token.val) + '(' + token.chi.reduce((acc, curr) => acc + (acc.length > 0 && !(acc.endsWith('/') || curr.typ == exports.EnumToken.LiteralTokenType) ? ' ' : '') + renderToken(curr, options, cache), '') + ')';
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
                token.val == 'calc' &&
                token.chi.length == 1 &&
                token.chi[0].typ != exports.EnumToken.BinaryExpressionTokenType &&
                token.chi[0].typ != exports.EnumToken.FractionTokenType &&
                token.chi[0].val?.typ != exports.EnumToken.FractionTokenType) {
                // calc(200px) => 200px
                return token.chi.reduce((acc, curr) => acc + renderToken(curr, options, cache, reducer), '');
            }
            // @ts-ignore
            return ( /* options.minify && 'Pseudo-class-func' == token.typ && token.val.slice(0, 2) == '::' ? token.val.slice(1) :*/token.val ?? '') + '(' + token.chi.reduce(reducer, '') + ')';
        case exports.EnumToken.MatchExpressionTokenType:
            return renderToken(token.l, options, cache, reducer, errors) +
                renderToken({ typ: token.op }, options, cache, reducer, errors) +
                renderToken(token.r, options, cache, reducer, errors) +
                (token.attr ? ' ' + token.attr : '');
        case exports.EnumToken.NameSpaceAttributeTokenType:
            return (token.l == null ? '' : renderToken(token.l, options, cache, reducer, errors) + '|') +
                renderToken(token.r, options, cache, reducer, errors);
        case exports.EnumToken.BlockStartTokenType:
            return '{';
        case exports.EnumToken.BlockEndTokenType:
            return '}';
        case exports.EnumToken.StartParensTokenType:
            return '(';
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
        case exports.EnumToken.GtTokenType:
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
            let val = token.val.typ == exports.EnumToken.FractionTokenType ? renderToken(token.val, options, cache) : reduceNumber(token.val);
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
                            v = reduceNumber(angle);
                            if (v.length + 4 < value.length) {
                                val = v;
                                unit = u;
                                value = v + u;
                            }
                            break;
                        case 'deg':
                            v = reduceNumber(angle * 360);
                            if (v.length + 3 < value.length) {
                                val = v;
                                unit = u;
                                value = v + u;
                            }
                            break;
                        case 'rad':
                            v = reduceNumber(angle * (2 * Math.PI));
                            if (v.length + 3 < value.length) {
                                val = v;
                                unit = u;
                                value = v + u;
                            }
                            break;
                        case 'grad':
                            v = reduceNumber(angle * 400);
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
                    const v = reduceNumber(val / 1000);
                    if (v.length + 1 <= val.length) {
                        return v + 's';
                    }
                    return val + 'ms';
                }
                return val + 's';
            }
            return val.includes('/') ? val.replace('/', unit + '/') : val + unit;
        case exports.EnumToken.FlexTokenType:
        case exports.EnumToken.PercentageTokenType:
            const uni = token.typ == exports.EnumToken.PercentageTokenType ? '%' : 'fr';
            const perc = token.val.typ == exports.EnumToken.FractionTokenType ? renderToken(token.val, options, cache) : reduceNumber(token.val);
            return options.minify && perc == '0' ? '0' : (perc.includes('/') ? perc.replace('/', uni + '/') : perc + uni);
        case exports.EnumToken.NumberTokenType:
            return token.val.typ == exports.EnumToken.FractionTokenType ? renderToken(token.val, options, cache) : reduceNumber(token.val);
        case exports.EnumToken.CommentTokenType:
            if (options.removeComments && (!options.preserveLicense || !token.val.startsWith('/*!'))) {
                return '';
            }
        case exports.EnumToken.PseudoClassTokenType:
            // https://www.w3.org/TR/selectors-4/#single-colon-pseudos
            if (token.typ == exports.EnumToken.PseudoClassTokenType && ['::before', '::after', '::first-line', '::first-letter'].includes(token.val)) {
                return token.val.slice(1);
            }
        case exports.EnumToken.UrlTokenTokenType:
            if (token.typ == exports.EnumToken.UrlTokenTokenType) {
                if (options.output != null) {
                    if (!('original' in token)) {
                        // do not modify original token
                        token = { ...token };
                        Object.defineProperty(token, 'original', { enumerable: false, writable: false, value: token.val });
                    }
                    // @ts-ignore
                    if (!(token.original in cache)) {
                        let output = options.output ?? '';
                        const key = output + 'abs';
                        if (!(key in cache)) {
                            // @ts-ignore
                            cache[key] = options.dirname(options.resolve(output, options.cwd).absolute);
                        }
                        // @ts-ignore
                        cache[token.original] = options.resolve(token.original, cache[key]).relative;
                    }
                    // @ts-ignore
                    token.val = cache[token.original];
                }
            }
        case exports.EnumToken.HashTokenType:
        case exports.EnumToken.IdenTokenType:
        case exports.EnumToken.DelimTokenType:
        case exports.EnumToken.AtRuleTokenType:
        case exports.EnumToken.StringTokenType:
        case exports.EnumToken.LiteralTokenType:
        case exports.EnumToken.DashedIdenTokenType:
            return /* options.minify && 'Pseudo-class' == token.typ && '::' == token.val.slice(0, 2) ? token.val.slice(1) :  */ token.val;
    }
    errors?.push({ action: 'ignore', message: `render: unexpected token ${JSON.stringify(token, null, 1)}` });
    return '';
}

// https://www.w3.org/TR/CSS21/syndata.html#syntax
// https://www.w3.org/TR/2021/CRD-css-syntax-3-20211224/#typedef-ident-token
// '\\'
const REVERSE_SOLIDUS = 0x5c;
const dimensionUnits = [
    'q', 'cap', 'ch', 'cm', 'cqb', 'cqh', 'cqi', 'cqmax', 'cqmin', 'cqw', 'dvb',
    'dvh', 'dvi', 'dvmax', 'dvmin', 'dvw', 'em', 'ex', 'ic', 'in', 'lh', 'lvb',
    'lvh', 'lvi', 'lvmax', 'lvw', 'mm', 'pc', 'pt', 'px', 'rem', 'rlh', 'svb',
    'svh', 'svi', 'svmin', 'svw', 'vb', 'vh', 'vi', 'vmax', 'vmin', 'vw'
];
function isLength(dimension) {
    return 'unit' in dimension && dimensionUnits.includes(dimension.unit.toLowerCase());
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
function isColor(token) {
    if (token.typ == exports.EnumToken.ColorTokenType) {
        return true;
    }
    if (token.typ == exports.EnumToken.IdenTokenType) {
        // named color
        return token.val.toLowerCase() in COLORS_NAMES;
    }
    let isLegacySyntax = false;
    if (token.typ == exports.EnumToken.FunctionTokenType && token.chi.length > 0 && colorsFunc.includes(token.val)) {
        const keywords = ['from', 'none'];
        if (['rgb', 'hsl', 'hwb'].includes(token.val)) {
            keywords.push('a', ...token.val.split(''));
        }
        // console.debug(JSON.stringify({token}, null, 1));
        // @ts-ignore
        for (const v of token.chi) {
            // console.debug(JSON.stringify({v}, null, 1));
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
                    if (v.val == 'from' && ['rgba', 'hsla'].includes(token.val)) {
                        return false;
                    }
                }
                continue;
            }
            if (v.typ == exports.EnumToken.FunctionTokenType && (v.val == 'calc' || colorsFunc.includes(v.val))) {
                continue;
            }
            if (![exports.EnumToken.ColorTokenType, exports.EnumToken.IdenTokenType, exports.EnumToken.NumberTokenType, exports.EnumToken.AngleTokenType, exports.EnumToken.PercentageTokenType, exports.EnumToken.CommaTokenType, exports.EnumToken.WhitespaceTokenType, exports.EnumToken.LiteralTokenType].includes(v.typ)) {
                return false;
            }
        }
        return true;
    }
    return false;
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
    return codepoint == 0x5f || isLetter(codepoint) || isNonAscii(codepoint);
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
    while (i < j) {
        i += codepoint < 0x80 ? 1 : String.fromCodePoint(codepoint).length;
        codepoint = name.charCodeAt(i);
        if (!isIdentCodepoint(codepoint)) {
            return false;
        }
    }
    return true;
}
function isNonPrintable(codepoint) {
    // null -> backspace
    return (codepoint >= 0 && codepoint <= 0x8) ||
        // tab
        codepoint == 0xb ||
        // delete
        codepoint == 0x7f ||
        (codepoint >= 0xe && codepoint <= 0x1f);
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
function isDimension(name) {
    let index = name.length;
    while (index--) {
        if (isLetter(name.charCodeAt(index))) {
            continue;
        }
        index++;
        break;
    }
    const number = name.slice(0, index);
    return number.length > 0 && isIdentStart(name.charCodeAt(index)) && isNumber(number);
}
function isPercentage(name) {
    return name.endsWith('%') && isNumber(name.slice(0, -1));
}
function isFlex(name) {
    return name.endsWith('fr') && isNumber(name.slice(0, -2));
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
    const dimension = { typ: exports.EnumToken.DimensionTokenType, val: name.slice(0, index), unit: name.slice(index) };
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
			"0",
			"0 1",
			"0 auto",
			"0 1 auto"
		],
		properties: {
			"flex-grow": {
				required: true,
				keywords: [
				],
				"default": [
					"0"
				],
				types: [
					"Number"
				]
			},
			"flex-shrink": {
				keywords: [
				],
				"default": [
					"1"
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
					"auto"
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
		separator: ",",
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
					"normal",
					"400"
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
		pattern: "background-repeat background-color background-image background-attachment background-clip background-origin background-position background-size",
		keywords: [
			"none"
		],
		"default": [
		],
		multiple: true,
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
var config$1 = {
	properties: properties,
	map: map
};

const getConfig = () => config$1;

// https://www.w3.org/TR/css-values-4/#math-function
const funcList = ['clamp', 'calc'];
function matchType(val, properties) {
    if (val.typ == exports.EnumToken.IdenTokenType && properties.keywords.includes(val.val) ||
        // @ts-ignore
        (properties.types.some((t) => exports.EnumToken[t] == val.typ))) {
        return true;
    }
    if (val.typ == exports.EnumToken.NumberTokenType && val.val == '0') {
        // @ts-ignore
        return properties.types.some((type) => {
            // @ts-ignore
            const typ = exports.EnumToken[type];
            return typ == exports.EnumToken.LengthTokenType || typ == exports.EnumToken.AngleTokenType;
        });
    }
    if (val.typ == exports.EnumToken.FunctionTokenType) {
        if (funcList.includes(val.val)) {
            return val.chi.every((t => [exports.EnumToken.LiteralTokenType, exports.EnumToken.CommaTokenType, exports.EnumToken.WhitespaceTokenType, exports.EnumToken.StartParensTokenType, exports.EnumToken.EndParensTokenType].includes(t.typ) || matchType(t, properties)));
        }
        // match type defined like function 'symbols()', 'url()', 'attr()' etc.
        // return properties.types.includes((<FunctionToken>val).val + '()')
    }
    return false;
}

function parseDeclaration(node, errors, src, position) {
    while (node.val[0]?.typ == exports.EnumToken.WhitespaceTokenType) {
        node.val.shift();
    }
    if (node.val.filter((t) => ![exports.EnumToken.WhitespaceTokenType, exports.EnumToken.CommentTokenType].includes(t.typ)).length == 0) {
        errors.push({
            action: 'drop',
            message: 'doParse: invalid declaration',
            location: { src, ...position }
        });
        return null;
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

function* tokenize(stream) {
    let ind = -1;
    let lin = 1;
    let col = 0;
    const position = {
        ind: Math.max(ind, 0),
        lin: lin,
        col: Math.max(col, 1)
    };
    let value;
    let buffer = '';
    function consumeWhiteSpace() {
        let count = 0;
        while (isWhiteSpace(stream.charAt(count + ind + 1).charCodeAt(0))) {
            count++;
        }
        next(count);
        return count;
    }
    function pushToken(token, hint) {
        const result = { token, hint, position: { ...position }, bytesIn: ind + 1 };
        position.ind = ind;
        position.lin = lin;
        position.col = col == 0 ? 1 : col;
        return result;
    }
    function* consumeString(quoteStr) {
        const quote = quoteStr;
        let value;
        let hasNewLine = false;
        if (buffer.length > 0) {
            yield pushToken(buffer);
            buffer = '';
        }
        buffer += quoteStr;
        while (value = peek()) {
            if (value == '\\') {
                const sequence = peek(6);
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
                if (i == 1) {
                    buffer += value + sequence[i];
                    next(2);
                    continue;
                }
                if (escapeSequence.trimEnd().length > 0) {
                    const codepoint = Number(`0x${escapeSequence.trimEnd()}`);
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
                    next(escapeSequence.length + 1 + (isWhiteSpace(peek()?.charCodeAt(0)) ? 1 : 0));
                    continue;
                }
                buffer += next(2);
                continue;
            }
            if (value == quote) {
                buffer += value;
                yield pushToken(buffer, hasNewLine ? exports.EnumToken.BadStringTokenType : exports.EnumToken.StringTokenType);
                next();
                // i += value.length;
                buffer = '';
                return;
            }
            if (isNewLine(value.charCodeAt(0))) {
                hasNewLine = true;
            }
            if (hasNewLine && value == ';') {
                yield pushToken(buffer + value, exports.EnumToken.BadStringTokenType);
                buffer = '';
                next();
                break;
            }
            buffer += value;
            next();
        }
        if (hasNewLine) {
            yield pushToken(buffer, exports.EnumToken.BadStringTokenType);
        }
        else {
            // EOF - 'Unclosed-string' fixed
            yield pushToken(buffer + quote, exports.EnumToken.StringTokenType);
        }
        buffer = '';
    }
    function peek(count = 1) {
        if (count == 1) {
            return stream.charAt(ind + 1);
        }
        return stream.slice(ind + 1, ind + count + 1);
    }
    function prev(count = 1) {
        if (count == 1) {
            return ind == 0 ? '' : stream.charAt(ind - 1);
        }
        return stream.slice(ind - 1 - count, ind - 1);
    }
    function next(count = 1) {
        let char = '';
        let chr = '';
        if (count < 0) {
            return '';
        }
        while (count-- && (chr = stream.charAt(ind + 1))) {
            char += chr;
            const codepoint = stream.charCodeAt(++ind);
            if (isNaN(codepoint)) {
                return char;
            }
            if (isNewLine(codepoint)) {
                lin++;
                col = 0;
            }
            else {
                col++;
            }
        }
        return char;
    }
    while (value = next()) {
        if (isWhiteSpace(value.charCodeAt(0))) {
            if (buffer.length > 0) {
                yield pushToken(buffer);
                buffer = '';
            }
            while (value = next()) {
                if (!isWhiteSpace(value.charCodeAt(0))) {
                    break;
                }
            }
            yield pushToken('', exports.EnumToken.WhitespaceTokenType);
            buffer = '';
        }
        switch (value) {
            case '/':
                if (buffer.length > 0) {
                    yield pushToken(buffer);
                    buffer = '';
                    if (peek() != '*') {
                        yield pushToken(value);
                        break;
                    }
                }
                buffer += value;
                if (peek() == '*') {
                    buffer += next();
                    while (value = next()) {
                        if (value == '*') {
                            buffer += value;
                            if (peek() == '/') {
                                yield pushToken(buffer + next(), exports.EnumToken.CommentTokenType);
                                buffer = '';
                                break;
                            }
                        }
                        else {
                            buffer += value;
                        }
                    }
                    yield pushToken(buffer, exports.EnumToken.BadCommentTokenType);
                    buffer = '';
                }
                break;
            case '<':
                if (buffer.length > 0) {
                    yield pushToken(buffer);
                    buffer = '';
                }
                if (peek() == '=') {
                    yield pushToken('', exports.EnumToken.LteTokenType);
                    next();
                    break;
                }
                buffer += value;
                if (peek(3) == '!--') {
                    buffer += next(3);
                    while (value = next()) {
                        buffer += value;
                        if (value == '-' && peek(2) == '->') {
                            break;
                        }
                    }
                    if (value === '') {
                        yield pushToken(buffer, exports.EnumToken.BadCdoTokenType);
                    }
                    else {
                        yield pushToken(buffer + next(2), exports.EnumToken.CDOCOMMTokenType);
                    }
                    buffer = '';
                }
                break;
            case '\\':
                // EOF
                if (!(value = next())) {
                    // end of stream ignore \\
                    if (buffer.length > 0) {
                        yield pushToken(buffer);
                        buffer = '';
                    }
                    break;
                }
                buffer += prev() + value;
                break;
            case '"':
            case "'":
                yield* consumeString(value);
                break;
            case '^':
            case '~':
            case '|':
            case '$':
                if (value == '|' && peek() == '|') {
                    next();
                    yield pushToken('', exports.EnumToken.ColumnCombinatorTokenType);
                    buffer = '';
                    break;
                }
                if (buffer.length > 0) {
                    yield pushToken(buffer);
                    buffer = '';
                }
                buffer += value;
                if (!(value = peek())) {
                    yield pushToken(buffer);
                    buffer = '';
                    break;
                }
                // ~=
                // ^=
                // $=
                // |=
                if (peek() == '=') {
                    next();
                    switch (buffer.charAt(0)) {
                        case '~':
                            yield pushToken(buffer, exports.EnumToken.IncludeMatchTokenType);
                            break;
                        case '^':
                            yield pushToken(buffer, exports.EnumToken.StartMatchTokenType);
                            break;
                        case '$':
                            yield pushToken(buffer, exports.EnumToken.EndMatchTokenType);
                            break;
                        case '|':
                            yield pushToken(buffer, exports.EnumToken.DashMatchTokenType);
                            break;
                    }
                    buffer = '';
                    break;
                }
                yield pushToken(buffer);
                buffer = '';
                break;
            case '>':
                if (buffer !== '') {
                    yield pushToken(buffer);
                    buffer = '';
                }
                if (peek() == '=') {
                    yield pushToken('', exports.EnumToken.GteTokenType);
                    next();
                }
                else {
                    yield pushToken('', exports.EnumToken.GtTokenType);
                }
                consumeWhiteSpace();
                break;
            case '.':
                const codepoint = peek().charCodeAt(0);
                if (!isDigit(codepoint) && buffer !== '') {
                    yield pushToken(buffer);
                    buffer = value;
                    break;
                }
                buffer += value;
                break;
            case '+':
            case '*':
            case ':':
            case ',':
            case '=':
                if (buffer.length > 0) {
                    yield pushToken(buffer);
                    buffer = '';
                }
                const val = peek();
                if (val == '=') {
                    next();
                    yield pushToken(value + val, exports.EnumToken.ContainMatchTokenType);
                    break;
                }
                if (value == ':' && ':' == val) {
                    buffer += value + next();
                    break;
                }
                yield pushToken(value);
                buffer = '';
                if (['+', '*', '/'].includes(value) && isWhiteSpace(peek().charCodeAt(0))) {
                    yield pushToken(next());
                }
                while (isWhiteSpace(peek().charCodeAt(0))) {
                    next();
                }
                break;
            case ')':
                if (buffer.length > 0) {
                    yield pushToken(buffer);
                    buffer = '';
                }
                yield pushToken('', exports.EnumToken.EndParensTokenType);
                break;
            case '(':
                if (buffer.length == 0) {
                    yield pushToken(value);
                    break;
                }
                buffer += value;
                // @ts-ignore
                if (buffer == 'url(') {
                    yield pushToken(buffer);
                    buffer = '';
                    consumeWhiteSpace();
                    value = peek();
                    let cp;
                    let whitespace = '';
                    let hasWhiteSpace = false;
                    let errorState = false;
                    if (value == '"' || value == "'") {
                        const quote = value;
                        let inquote = true;
                        let hasNewLine = false;
                        buffer = next();
                        while (value = next()) {
                            cp = value.charCodeAt(0);
                            // consume an invalid string
                            if (inquote) {
                                buffer += value;
                                if (isNewLine(cp)) {
                                    hasNewLine = true;
                                    while (value = next()) {
                                        buffer += value;
                                        if (value == ';') {
                                            inquote = false;
                                            break;
                                        }
                                    }
                                    if (value === '') {
                                        yield pushToken(buffer, exports.EnumToken.BadUrlTokenType);
                                        buffer = '';
                                        break;
                                    }
                                    cp = value.charCodeAt(0);
                                }
                                // '\\'
                                if (cp == 0x5c) {
                                    buffer += next();
                                }
                                else if (value == quote) {
                                    inquote = false;
                                }
                                continue;
                            }
                            if (!inquote) {
                                if (isWhiteSpace(cp)) {
                                    whitespace += value;
                                    while (value = peek()) {
                                        hasWhiteSpace = true;
                                        if (isWhiteSpace(value?.charCodeAt(0))) {
                                            whitespace += next();
                                            continue;
                                        }
                                        break;
                                    }
                                    if (!(value = next())) {
                                        yield pushToken(buffer, hasNewLine ? exports.EnumToken.BadUrlTokenType : exports.EnumToken.UrlTokenTokenType);
                                        buffer = '';
                                        break;
                                    }
                                }
                                cp = value.charCodeAt(0);
                                // ')'
                                if (cp == 0x29) {
                                    yield pushToken(buffer, hasNewLine ? exports.EnumToken.BadStringTokenType : exports.EnumToken.StringTokenType);
                                    yield pushToken('', exports.EnumToken.EndParensTokenType);
                                    buffer = '';
                                    break;
                                }
                                while (value = next()) {
                                    cp = value.charCodeAt(0);
                                    if (cp == 0x5c) {
                                        buffer += value + next();
                                        continue;
                                    }
                                    if (cp == 0x29) {
                                        yield pushToken(buffer, exports.EnumToken.BadStringTokenType);
                                        yield pushToken('', exports.EnumToken.EndParensTokenType);
                                        buffer = '';
                                        break;
                                    }
                                    buffer += value;
                                }
                                if (hasNewLine) {
                                    yield pushToken(buffer, exports.EnumToken.BadStringTokenType);
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
                        while (value = next()) {
                            cp = value.charCodeAt(0);
                            // ')'
                            if (cp == 0x29) {
                                yield pushToken(buffer, exports.EnumToken.UrlTokenTokenType);
                                yield pushToken('', exports.EnumToken.EndParensTokenType);
                                buffer = '';
                                break;
                            }
                            if (isWhiteSpace(cp)) {
                                hasWhiteSpace = true;
                                whitespace = value;
                                while (isWhiteSpace(peek()?.charCodeAt(0))) {
                                    whitespace += next();
                                }
                                continue;
                            }
                            if (isNonPrintable(cp) ||
                                // '"'
                                cp == 0x22 ||
                                // "'"
                                cp == 0x27 ||
                                // \('
                                cp == 0x28 ||
                                hasWhiteSpace) {
                                errorState = true;
                            }
                            if (errorState) {
                                buffer += whitespace + value;
                                while (value = peek()) {
                                    cp = value.charCodeAt(0);
                                    if (cp == 0x5c) {
                                        buffer += next(2);
                                        continue;
                                    }
                                    // ')'
                                    if (cp == 0x29) {
                                        break;
                                    }
                                    buffer += next();
                                }
                                yield pushToken(buffer, exports.EnumToken.BadUrlTokenType);
                                buffer = '';
                                break;
                            }
                            buffer += value;
                        }
                    }
                    if (buffer !== '') {
                        yield pushToken(buffer, exports.EnumToken.UrlTokenTokenType);
                        buffer = '';
                        break;
                    }
                    break;
                }
                yield pushToken(buffer);
                buffer = '';
                break;
            case '[':
            case ']':
            case '{':
            case '}':
            case ';':
                if (buffer.length > 0) {
                    yield pushToken(buffer);
                    buffer = '';
                }
                yield pushToken(value);
                break;
            case '!':
                if (buffer.length > 0) {
                    yield pushToken(buffer);
                    buffer = '';
                }
                if (peek(9) == 'important') {
                    yield pushToken('', exports.EnumToken.ImportantTokenType);
                    next(9);
                    buffer = '';
                    break;
                }
                buffer = '!';
                break;
            default:
                buffer += value;
                break;
        }
    }
    if (buffer.length > 0) {
        yield pushToken(buffer);
    }
    // yield pushToken('', 'EOF');
}

const urlTokenMatcher = /^(["']?)[a-zA-Z0-9_/.-][a-zA-Z0-9_/:.#?-]+(\1)$/;
const trimWhiteSpace = [exports.EnumToken.CommentTokenType, exports.EnumToken.GtTokenType, exports.EnumToken.GteTokenType, exports.EnumToken.LtTokenType, exports.EnumToken.LteTokenType, exports.EnumToken.ColumnCombinatorTokenType];
const BadTokensTypes = [
    exports.EnumToken.BadCommentTokenType,
    exports.EnumToken.BadCdoTokenType,
    exports.EnumToken.BadUrlTokenType,
    exports.EnumToken.BadStringTokenType
];
const webkitPseudoAliasMap = {
    '-webkit-autofill': 'autofill'
};
async function doParse(iterator, options = {}) {
    return new Promise(async (resolve, reject) => {
        if (options.signal != null) {
            options.signal.addEventListener('abort', reject);
        }
        options = {
            src: '',
            sourcemap: false,
            minify: true,
            parseColor: true,
            nestingRules: false,
            resolveImport: false,
            resolveUrls: false,
            removeCharset: false,
            removeEmpty: true,
            removeDuplicateDeclarations: true,
            computeShorthand: true,
            computeCalcExpression: true,
            inlineCssVariables: false,
            ...options
        };
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
        let ast = {
            typ: exports.EnumToken.StyleSheetNodeType,
            chi: []
        };
        let tokens = [];
        let map = new Map;
        let bytesIn = 0;
        let context = ast;
        if (options.sourcemap) {
            ast.loc = {
                sta: {
                    ind: 0,
                    lin: 1,
                    col: 1
                },
                src: ''
            };
        }
        async function parseNode(results) {
            let tokens = results.map(mapToken);
            let i;
            let loc;
            for (i = 0; i < tokens.length; i++) {
                if (tokens[i].typ == exports.EnumToken.CommentTokenType || tokens[i].typ == exports.EnumToken.CDOCOMMTokenType) {
                    const position = map.get(tokens[i]);
                    if (tokens[i].typ == exports.EnumToken.CDOCOMMTokenType && context.typ != exports.EnumToken.StyleSheetNodeType) {
                        errors.push({
                            action: 'drop',
                            message: `CDOCOMM not allowed here ${JSON.stringify(tokens[i], null, 1)}`,
                            location: { src, ...position }
                        });
                        continue;
                    }
                    loc = {
                        sta: position,
                        src
                    };
                    // @ts-ignore
                    context.chi.push(tokens[i]);
                    if (options.sourcemap) {
                        tokens[i].loc = loc;
                    }
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
            else {
                delim = { typ: exports.EnumToken.SemiColonTokenType };
            }
            // @ts-ignore
            while ([exports.EnumToken.WhitespaceTokenType, exports.EnumToken.BadStringTokenType, exports.EnumToken.BadCommentTokenType].includes(tokens.at(-1)?.typ)) {
                tokens.pop();
            }
            if (tokens.length == 0) {
                return null;
            }
            if (tokens[0]?.typ == exports.EnumToken.AtRuleTokenType) {
                const atRule = tokens.shift();
                const position = map.get(atRule);
                if (atRule.val == 'charset') {
                    if (position.ind > 0) {
                        errors.push({
                            action: 'drop',
                            message: 'doParse: invalid @charset',
                            location: { src, ...position }
                        });
                        return null;
                    }
                    if (options.removeCharset) {
                        return null;
                    }
                }
                // @ts-ignore
                while ([exports.EnumToken.WhitespaceTokenType].includes(tokens[0]?.typ)) {
                    tokens.shift();
                }
                if (atRule.val == 'import') {
                    // only @charset and @layer are accepted before @import
                    if (context.chi.length > 0) {
                        let i = context.chi.length;
                        while (i--) {
                            const type = context.chi[i].typ;
                            if (type == exports.EnumToken.CommentNodeType) {
                                continue;
                            }
                            if (type != exports.EnumToken.AtRuleNodeType) {
                                errors.push({ action: 'drop', message: 'invalid @import', location: { src, ...position } });
                                return null;
                            }
                            const name = context.chi[i].nam;
                            if (name != 'charset' && name != 'import' && name != 'layer') {
                                errors.push({ action: 'drop', message: 'invalid @import', location: { src, ...position } });
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
                            location: { src, ...position }
                        });
                        return null;
                    }
                    // @ts-ignore
                    if (tokens[0].typ == exports.EnumToken.UrlFunctionTokenType && tokens[1]?.typ != exports.EnumToken.UrlTokenTokenType && tokens[1]?.typ != exports.EnumToken.StringTokenType) {
                        errors.push({
                            action: 'drop',
                            message: 'doParse: invalid @import',
                            location: { src, ...position }
                        });
                        return null;
                    }
                }
                if (atRule.val == 'import') {
                    // @ts-ignore
                    if (tokens[0].typ == exports.EnumToken.UrlFunctionTokenType && tokens[1].typ == exports.EnumToken.UrlTokenTokenType) {
                        tokens.shift();
                        // @ts-ignore
                        tokens[0].typ = exports.EnumToken.StringTokenType;
                        // @ts-ignore
                        tokens[0].val = `"${tokens[0].val}"`;
                    }
                    // @ts-ignore
                    if (tokens[0].typ == exports.EnumToken.StringTokenType) {
                        if (options.resolveImport) {
                            const url = tokens[0].val.slice(1, -1);
                            try {
                                // @ts-ignore
                                const root = await options.load(url, options.src).then((src) => {
                                    return doParse(src, Object.assign({}, options, {
                                        minify: false,
                                        // @ts-ignore
                                        src: options.resolve(url, options.src).absolute
                                    }));
                                });
                                bytesIn += root.stats.bytesIn;
                                if (root.ast.chi.length > 0) {
                                    // @todo - filter charset, layer and scope
                                    context.chi.push(...root.ast.chi);
                                }
                                if (root.errors.length > 0) {
                                    errors.push(...root.errors);
                                }
                                return null;
                            }
                            catch (error) {
                                // @ts-ignore
                                errors.push({ action: 'ignore', message: 'doParse: ' + error.message, error });
                            }
                        }
                    }
                }
                // https://www.w3.org/TR/css-nesting-1/#conditionals
                // allowed nesting at-rules
                // there must be a top level rule in the stack
                const raw = parseTokens(tokens, { minify: options.minify }).reduce((acc, curr) => {
                    acc.push(renderToken(curr, { removeComments: true }));
                    return acc;
                }, []);
                const node = {
                    typ: exports.EnumToken.AtRuleNodeType,
                    nam: renderToken(atRule, { removeComments: true }),
                    val: raw.join('')
                };
                Object.defineProperty(node, 'raw', { enumerable: false, configurable: true, writable: true, value: raw });
                if (delim.typ == exports.EnumToken.BlockStartTokenType) {
                    node.chi = [];
                }
                loc = {
                    sta: position,
                    src
                };
                if (options.sourcemap) {
                    node.loc = loc;
                }
                // @ts-ignore
                context.chi.push(node);
                return delim.typ == exports.EnumToken.BlockStartTokenType ? node : null;
            }
            else {
                // rule
                if (delim.typ == exports.EnumToken.BlockStartTokenType) {
                    const position = map.get(tokens[0]);
                    const uniq = new Map;
                    parseTokens(tokens, { minify: true }).reduce((acc, curr, index, array) => {
                        if (curr.typ == exports.EnumToken.WhitespaceTokenType) {
                            if (trimWhiteSpace.includes(array[index - 1]?.typ) ||
                                trimWhiteSpace.includes(array[index + 1]?.typ) ||
                                combinators.includes(array[index - 1]?.val) ||
                                combinators.includes(array[index + 1]?.val)) {
                                return acc;
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
                        acc.set(curr.join(''), curr);
                        return acc;
                    }, uniq);
                    const node = {
                        typ: exports.EnumToken.RuleNodeType,
                        // @ts-ignore
                        sel: [...uniq.keys()].join(','),
                        chi: []
                    };
                    let raw = [...uniq.values()];
                    Object.defineProperty(node, 'raw', {
                        enumerable: false,
                        configurable: true,
                        writable: true,
                        value: raw
                    });
                    loc = {
                        sta: position,
                        src
                    };
                    if (options.sourcemap) {
                        node.loc = loc;
                    }
                    // @ts-ignore
                    context.chi.push(node);
                    return node;
                }
                else {
                    // declaration
                    // @ts-ignore
                    let name = null;
                    // @ts-ignore
                    let value = null;
                    for (let i = 0; i < tokens.length; i++) {
                        if (tokens[i].typ == exports.EnumToken.CommentTokenType) {
                            continue;
                        }
                        if (tokens[i].typ == exports.EnumToken.ColonTokenType) {
                            name = tokens.slice(0, i);
                            value = parseTokens(tokens.slice(i + 1), {
                                parseColor: options.parseColor,
                                src: options.src,
                                resolveUrls: options.resolveUrls,
                                resolve: options.resolve,
                                cwd: options.cwd
                            });
                        }
                    }
                    if (name == null) {
                        name = tokens;
                    }
                    const position = map.get(name[0]);
                    if (name.length > 0) {
                        for (let i = 1; i < name.length; i++) {
                            if (name[i].typ != exports.EnumToken.WhitespaceTokenType && name[i].typ != exports.EnumToken.CommentTokenType) {
                                errors.push({
                                    action: 'drop',
                                    message: 'doParse: invalid declaration',
                                    location: { src, ...position }
                                });
                                return null;
                            }
                        }
                    }
                    if (value == null || value.length == 0) {
                        errors.push({
                            action: 'drop',
                            message: 'doParse: invalid declaration',
                            location: { src, ...position }
                        });
                        return null;
                    }
                    const node = {
                        typ: exports.EnumToken.DeclarationNodeType,
                        // @ts-ignore
                        nam: renderToken(name.shift(), { removeComments: true }),
                        // @ts-ignore
                        val: value
                    };
                    const result = parseDeclaration(node, errors, src, position);
                    if (result != null) {
                        // @ts-ignore
                        context.chi.push(node);
                    }
                    return null;
                }
            }
        }
        function mapToken(token) {
            const node = getTokenType(token.token, token.hint);
            map.set(node, token.position);
            return node;
        }
        const iter = tokenize(iterator);
        let item;
        while (item = iter.next().value) {
            bytesIn = item.bytesIn;
            // doParse error
            if (item.hint != null && BadTokensTypes.includes(item.hint)) {
                // bad token
                continue;
            }
            tokens.push(item);
            if (item.token == ';' || item.token == '{') {
                let node = await parseNode(tokens);
                if (node != null) {
                    stack.push(node);
                    // @ts-ignore
                    context = node;
                }
                else if (item.token == '{') {
                    // node == null
                    // consume and throw away until the closing '}' or EOF
                    let inBlock = 1;
                    do {
                        item = iter.next().value;
                        if (item == null) {
                            break;
                        }
                        if (item.token == '{') {
                            inBlock++;
                        }
                        else if (item.token == '}') {
                            inBlock--;
                        }
                    } while (inBlock != 0);
                }
                tokens = [];
                map = new Map;
            }
            else if (item.token == '}') {
                await parseNode(tokens);
                const previousNode = stack.pop();
                // @ts-ignore
                context = stack[stack.length - 1] || ast;
                // @ts-ignore
                if (options.removeEmpty && previousNode != null && previousNode.chi.length == 0 && context.chi[context.chi.length - 1] == previousNode) {
                    context.chi.pop();
                }
                tokens = [];
                map = new Map;
            }
        }
        if (tokens.length > 0) {
            await parseNode(tokens);
        }
        while (stack.length > 0 && context != ast) {
            const previousNode = stack.pop();
            // @ts-ignore
            context = stack[stack.length - 1] || ast;
            // @ts-ignore
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
        if (options.visitor != null) {
            for (const result of walk(ast)) {
                if (result.node.typ == exports.EnumToken.DeclarationNodeType &&
                    // @ts-ignore
                    (typeof options.visitor.Declaration == 'function' || options.visitor.Declaration?.[result.node.nam] != null)) {
                    const callable = typeof options.visitor.Declaration == 'function' ? options.visitor.Declaration : options.visitor.Declaration[result.node.nam];
                    const results = callable(result.node);
                    if (results == null || (Array.isArray(results) && results.length == 0)) {
                        continue;
                    }
                    // @ts-ignore
                    result.parent.chi.splice(result.parent.chi.indexOf(result.node), 1, ...(Array.isArray(results) ? results : [results]));
                }
                else if (options.visitor.Rule != null && result.node.typ == exports.EnumToken.RuleNodeType) {
                    const results = options.visitor.Rule(result.node);
                    if (results == null || (Array.isArray(results) && results.length == 0)) {
                        continue;
                    }
                    // @ts-ignore
                    result.parent.chi.splice(result.parent.chi.indexOf(result.node), 1, ...(Array.isArray(results) ? results : [results]));
                }
                else if (options.visitor.AtRule != null &&
                    result.node.typ == exports.EnumToken.AtRuleNodeType &&
                    // @ts-ignore
                    (typeof options.visitor.AtRule == 'function' || options.visitor.AtRule?.[result.node.nam] != null)) {
                    const callable = typeof options.visitor.AtRule == 'function' ? options.visitor.AtRule : options.visitor.AtRule[result.node.nam];
                    const results = callable(result.node);
                    if (results == null || (Array.isArray(results) && results.length == 0)) {
                        continue;
                    }
                    // @ts-ignore
                    result.parent.chi.splice(result.parent.chi.indexOf(result.node), 1, ...(Array.isArray(results) ? results : [results]));
                }
            }
        }
        if (options.minify) {
            if (ast.chi.length > 0) {
                minify(ast, options, true, errors, false);
            }
        }
        const endTime = performance.now();
        if (options.signal != null) {
            options.signal.removeEventListener('abort', reject);
        }
        resolve({
            ast,
            errors,
            stats: {
                bytesIn,
                parse: `${(endParseTime - startTime).toFixed(2)}ms`,
                minify: `${(endTime - endParseTime).toFixed(2)}ms`,
                total: `${(endTime - startTime).toFixed(2)}ms`
            }
        });
    });
}
function parseString(src, options = { location: false }) {
    return parseTokens([...tokenize(src)].map(t => {
        const token = getTokenType(t.token, t.hint);
        if (options.location) {
            Object.assign(token, { loc: t.position });
        }
        return token;
    }));
}
function getTokenType(val, hint) {
    if (val === '' && hint == null) {
        throw new Error('empty string?');
    }
    if (hint != null) {
        return ([
            exports.EnumToken.WhitespaceTokenType, exports.EnumToken.SemiColonTokenType, exports.EnumToken.ColonTokenType, exports.EnumToken.BlockStartTokenType,
            exports.EnumToken.BlockStartTokenType, exports.EnumToken.AttrStartTokenType, exports.EnumToken.AttrEndTokenType, exports.EnumToken.StartParensTokenType, exports.EnumToken.EndParensTokenType,
            exports.EnumToken.CommaTokenType, exports.EnumToken.GtTokenType, exports.EnumToken.LtTokenType, exports.EnumToken.GteTokenType, exports.EnumToken.LteTokenType, exports.EnumToken.CommaTokenType,
            exports.EnumToken.StartMatchTokenType, exports.EnumToken.EndMatchTokenType, exports.EnumToken.IncludeMatchTokenType, exports.EnumToken.DashMatchTokenType, exports.EnumToken.ContainMatchTokenType,
            exports.EnumToken.EOFTokenType
        ].includes(hint) ? { typ: hint } : { typ: hint, val });
    }
    if (val == ' ') {
        return { typ: exports.EnumToken.WhitespaceTokenType };
    }
    if (val == ';') {
        return { typ: exports.EnumToken.SemiColonTokenType };
    }
    if (val == '{') {
        return { typ: exports.EnumToken.BlockStartTokenType };
    }
    if (val == '}') {
        return { typ: exports.EnumToken.BlockEndTokenType };
    }
    if (val == '[') {
        return { typ: exports.EnumToken.AttrStartTokenType };
    }
    if (val == ']') {
        return { typ: exports.EnumToken.AttrEndTokenType };
    }
    if (val == ':') {
        return { typ: exports.EnumToken.ColonTokenType };
    }
    if (val == ')') {
        return { typ: exports.EnumToken.EndParensTokenType };
    }
    if (val == '(') {
        return { typ: exports.EnumToken.StartParensTokenType };
    }
    if (val == '=') {
        return { typ: exports.EnumToken.DelimTokenType, val };
    }
    if (val == ';') {
        return { typ: exports.EnumToken.SemiColonTokenType };
    }
    if (val == ',') {
        return { typ: exports.EnumToken.CommaTokenType };
    }
    if (val == '<') {
        return { typ: exports.EnumToken.LtTokenType };
    }
    if (val == '>') {
        return { typ: exports.EnumToken.GtTokenType };
    }
    if (isPseudo(val)) {
        return val.endsWith('(') ? {
            typ: exports.EnumToken.PseudoClassFuncTokenType,
            val: val.slice(0, -1),
            chi: []
        }
            : {
                typ: exports.EnumToken.PseudoClassTokenType,
                val
            };
    }
    if (isAtKeyword(val)) {
        return {
            typ: exports.EnumToken.AtRuleTokenType,
            val: val.slice(1)
        };
    }
    if (isFunction(val)) {
        val = val.slice(0, -1);
        if (val == 'url') {
            return {
                typ: exports.EnumToken.UrlFunctionTokenType,
                val,
                chi: []
            };
        }
        if (['linear-gradient', 'radial-gradient', 'repeating-linear-gradient', 'repeating-radial-gradient', 'conic-gradient', 'image', 'image-set', 'element', 'cross-fade'].includes(val)) {
            return {
                typ: exports.EnumToken.ImageFunctionTokenType,
                val,
                chi: []
            };
        }
        if (['ease', 'ease-in', 'ease-out', 'ease-in-out', 'linear', 'step-start', 'step-end', 'steps', 'cubic-bezier'].includes(val)) {
            return {
                typ: exports.EnumToken.TimingFunctionTokenType,
                val,
                chi: []
            };
        }
        if (['view', 'scroll'].includes(val)) {
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
            val
        };
    }
    if (isPercentage(val)) {
        return {
            typ: exports.EnumToken.PercentageTokenType,
            val: val.slice(0, -1)
        };
    }
    if (isFlex(val)) {
        return {
            typ: exports.EnumToken.FlexTokenType,
            val: val.slice(0, -2)
        };
    }
    if (isDimension(val)) {
        return parseDimension(val);
    }
    const v = val.toLowerCase();
    if (v == 'currentcolor' || val == 'transparent' || v in COLORS_NAMES) {
        return {
            typ: exports.EnumToken.ColorTokenType,
            val,
            kin: 'lit'
        };
    }
    if (isIdent(val)) {
        return {
            typ: val.startsWith('--') ? exports.EnumToken.DashedIdenTokenType : exports.EnumToken.IdenTokenType,
            val
        };
    }
    if (val.charAt(0) == '#' && isHexColor(val)) {
        return {
            typ: exports.EnumToken.ColorTokenType,
            val,
            kin: 'hex'
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
function parseTokens(tokens, options = {}) {
    for (let i = 0; i < tokens.length; i++) {
        const t = tokens[i];
        if (t.typ == exports.EnumToken.WhitespaceTokenType && ((i == 0 ||
            i + 1 == tokens.length ||
            [exports.EnumToken.CommaTokenType, exports.EnumToken.GteTokenType, exports.EnumToken.LteTokenType, exports.EnumToken.ColumnCombinatorTokenType].includes(tokens[i + 1].typ)) ||
            (i > 0 &&
                // tokens[i + 1]?.typ != Literal ||
                // funcLike.includes(tokens[i - 1].typ) &&
                // !['var', 'calc'].includes((<FunctionToken>tokens[i - 1]).val)))) &&
                trimWhiteSpace.includes(tokens[i - 1].typ)))) {
            tokens.splice(i--, 1);
            continue;
        }
        if (t.typ == exports.EnumToken.ColonTokenType) {
            const typ = tokens[i + 1]?.typ;
            if (typ != null) {
                if (typ == exports.EnumToken.FunctionTokenType) {
                    tokens[i + 1].val = ':' + tokens[i + 1].val;
                    tokens[i + 1].typ = exports.EnumToken.PseudoClassFuncTokenType;
                }
                else if (typ == exports.EnumToken.IdenTokenType) {
                    if (tokens[i + 1].val in webkitPseudoAliasMap) {
                        tokens[i + 1].val = webkitPseudoAliasMap[tokens[i + 1].val];
                    }
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
            Object.assign(t, { typ: exports.EnumToken.AttrTokenType, chi: tokens.splice(i + 1, k - i) });
            // @ts-ignore
            if (t.chi.at(-1).typ == exports.EnumToken.AttrEndTokenType) {
                // @ts-ignore
                t.chi.pop();
            }
            // @ts-ignore
            if (t.chi.length > 1) {
                /*(<AttrToken>t).chi =*/
                // @ts-ignore
                parseTokens(t.chi, t.typ);
            }
            let m = t.chi.length;
            let val;
            for (m = 0; m < t.chi.length; m++) {
                val = t.chi[m];
                if (val.typ == exports.EnumToken.StringTokenType) {
                    const slice = val.val.slice(1, -1);
                    if ((slice.charAt(0) != '-' || (slice.charAt(0) == '-' && isIdentStart(slice.charCodeAt(1)))) && isIdent(slice)) {
                        Object.assign(val, { typ: exports.EnumToken.IdenTokenType, val: slice });
                    }
                }
                else if (val.typ == exports.EnumToken.LiteralTokenType && val.val == '|') {
                    let upper = m;
                    let lower = m;
                    while (++upper < t.chi.length) {
                        if (t.chi[upper].typ == exports.EnumToken.CommentTokenType) {
                            continue;
                        }
                        break;
                    }
                    while (lower-- > 0) {
                        if (t.chi[lower].typ == exports.EnumToken.CommentTokenType) {
                            continue;
                        }
                        break;
                    }
                    // @ts-ignore
                    t.chi[m] = {
                        typ: exports.EnumToken.NameSpaceAttributeTokenType,
                        l: t.chi[lower],
                        r: t.chi[upper]
                    };
                    t.chi.splice(upper, 1);
                    if (lower >= 0) {
                        t.chi.splice(lower, 1);
                        m--;
                    }
                }
                else if ([
                    exports.EnumToken.DashMatchTokenType, exports.EnumToken.StartMatchTokenType, exports.EnumToken.ContainMatchTokenType, exports.EnumToken.EndMatchTokenType, exports.EnumToken.IncludeMatchTokenType
                ].includes(t.chi[m].typ)) {
                    let upper = m;
                    let lower = m;
                    while (++upper < t.chi.length) {
                        if (t.chi[upper].typ == exports.EnumToken.CommentTokenType) {
                            continue;
                        }
                        break;
                    }
                    while (lower-- > 0) {
                        if (t.chi[lower].typ == exports.EnumToken.CommentTokenType) {
                            continue;
                        }
                        break;
                    }
                    val = t.chi[lower];
                    if (val.typ == exports.EnumToken.StringTokenType) {
                        const slice = val.val.slice(1, -1);
                        if ((slice.charAt(0) != '-' || (slice.charAt(0) == '-' && isIdentStart(slice.charCodeAt(1)))) && isIdent(slice)) {
                            Object.assign(val, { typ: exports.EnumToken.IdenTokenType, val: slice });
                        }
                    }
                    val = t.chi[upper];
                    if (val.typ == exports.EnumToken.StringTokenType) {
                        const slice = val.val.slice(1, -1);
                        if ((slice.charAt(0) != '-' || (slice.charAt(0) == '-' && isIdentStart(slice.charCodeAt(1)))) && isIdent(slice)) {
                            Object.assign(val, { typ: exports.EnumToken.IdenTokenType, val: slice });
                        }
                    }
                    t.chi[m] = {
                        typ: exports.EnumToken.MatchExpressionTokenType,
                        op: t.chi[m].typ,
                        l: t.chi[lower],
                        r: t.chi[upper]
                    };
                    t.chi.splice(upper, 1);
                    t.chi.splice(lower, 1);
                    upper = m;
                    m--;
                    while (upper < t.chi.length && t.chi[upper].typ == exports.EnumToken.WhitespaceTokenType) {
                        upper++;
                    }
                    if (upper < t.chi.length &&
                        t.chi[upper].typ == exports.EnumToken.Iden &&
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
            if (t.typ == exports.EnumToken.FunctionTokenType && t.val == 'calc') {
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
                // @ts-ignore
                t.typ = exports.EnumToken.ColorTokenType;
                // @ts-ignore
                t.kin = t.val;
                if (t.chi[0].typ == exports.EnumToken.IdenTokenType && t.chi[0].val == 'from') {
                    // @ts-ignore
                    t.cal = 'rel';
                }
                t.chi = t.chi.filter((t) => ![exports.EnumToken.WhitespaceTokenType, exports.EnumToken.CommaTokenType, exports.EnumToken.CommentTokenType].includes(t.typ));
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
                    //
                    const count = t.chi.filter(t => t.typ != exports.EnumToken.CommentTokenType).length;
                    if (count == 1 ||
                        (i == 0 &&
                            (tokens[i + 1]?.typ == exports.EnumToken.CommaTokenType || tokens.length == i + 1)) ||
                        (tokens[i - 1]?.typ == exports.EnumToken.CommaTokenType && (tokens[i + 1]?.typ == exports.EnumToken.CommaTokenType || tokens.length == i + 1))) {
                        tokens.splice(i, 1, ...t.chi);
                        i = Math.max(0, i - t.chi.length);
                    }
                }
            }
            continue;
        }
        if (options.parseColor) {
            if (t.typ == exports.EnumToken.IdenTokenType) {
                // named color
                const value = t.val.toLowerCase();
                if (value in COLORS_NAMES) {
                    Object.assign(t, {
                        typ: exports.EnumToken.ColorTokenType,
                        val: COLORS_NAMES[value].length < value.length ? COLORS_NAMES[value] : value,
                        kin: 'hex'
                    });
                }
                continue;
            }
            if (t.typ == exports.EnumToken.HashTokenType && isHexColor(t.val)) {
                // hex color
                // @ts-ignore
                t.typ = exports.EnumToken.ColorTokenType;
                // @ts-ignore
                t.kin = 'hex';
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
    if (Object.getPrototypeOf(a) !== Object.getPrototypeOf(b)) {
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

function* walk(node, filter) {
    const parents = [node];
    const root = node;
    const weakMap = new WeakMap;
    while (parents.length > 0) {
        node = parents.shift();
        let option = null;
        if (filter != null) {
            option = filter(node);
            if (option === 'ignore') {
                continue;
            }
            if (option === 'stop') {
                break;
            }
        }
        // @ts-ignore
        if (option !== 'children') {
            // @ts-ignore
            yield { node, parent: weakMap.get(node), root };
        }
        if (option !== 'ignore-children' && 'chi' in node) {
            parents.unshift(...node.chi);
            for (const child of node.chi.slice()) {
                weakMap.set(child, node);
            }
        }
    }
}
function* walkValues(values, root = null, filter) {
    const stack = values.slice();
    const weakMap = new WeakMap;
    let value;
    while (stack.length > 0) {
        value = stack.shift();
        let option = null;
        if (filter != null) {
            option = filter(value);
            if (option === 'ignore') {
                continue;
            }
            if (option === 'stop') {
                break;
            }
        }
        // @ts-ignore
        if (option !== 'children') {
            // @ts-ignore
            yield { value, parent: weakMap.get(value), root };
        }
        if (option !== 'ignore-children' && 'chi' in value) {
            for (const child of value.chi.slice()) {
                weakMap.set(child, value);
            }
            stack.unshift(...value.chi);
        }
        else if (value.typ == exports.EnumToken.BinaryExpressionTokenType) {
            weakMap.set(value.l, value);
            weakMap.set(value.r, value);
            stack.unshift(value.l, value.r);
        }
    }
}

function expand(ast) {
    //
    if (![exports.EnumToken.RuleNodeType, exports.EnumToken.StyleSheetNodeType, exports.EnumToken.AtRuleNodeType].includes(ast.typ)) {
        return ast;
    }
    if (exports.EnumToken.RuleNodeType == ast.typ) {
        return {
            typ: exports.EnumToken.StyleSheetNodeType,
            chi: expandRule(ast)
        };
    }
    if (!('chi' in ast)) {
        return ast;
    }
    const result = { ...ast, chi: [] };
    // @ts-ignore
    for (let i = 0; i < ast.chi.length; i++) {
        // @ts-ignore
        const node = ast.chi[i];
        if (node.typ == exports.EnumToken.RuleNodeType) {
            // @ts-ignore
            result.chi.push(...expandRule(node));
            // i += expanded.length - 1;
        }
        else if (node.typ == exports.EnumToken.AtRuleNodeType && 'chi' in node) {
            let hasRule = false;
            let j = node.chi.length;
            while (j--) {
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
                    selRule.forEach(arr => combinators.includes(arr[0].charAt(0)) ? arr.unshift(ast.sel) : arr.unshift(ast.sel, ' '));
                    rule.sel = selRule.reduce((acc, curr) => {
                        acc.push(curr.join(''));
                        return acc;
                    }, []).join(',');
                }
                else {
                    rule.sel = replaceCompound(rule.sel, ast.sel);
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
                    astAtRule = expand(astAtRule);
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
                        else {
                            // @ts-ignore
                            astAtRule.chi.push(r);
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
function replaceCompound(input, replace) {
    const tokens = parseString(input);
    for (const t of walkValues(tokens)) {
        if (t.value.typ == exports.EnumToken.LiteralTokenType) {
            if (t.value.val == '&') {
                t.value.val = replace;
            }
            else if (t.value.val.length > 1 && t.value.val.charAt(0) == '&') {
                t.value.val = replaceCompoundLiteral(t.value.val, replace);
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
        else {
            tokens[tokens.length - 1] += selector.charAt(i);
        }
    }
    return tokens.sort((a, b) => {
        if (a == '&') {
            return 1;
        }
        return b == '&' ? -1 : 0;
    }).reduce((acc, curr) => acc + (curr == '&' ? replace : curr), '');
}

class MinifyFeature {
    static get ordering() { return 10000; }
    register(options) { }
    run(ast, options = {}, parent, context) {
    }
}

class IterableWeakSet {
    #weakset = new WeakSet;
    #set = new Set;
    constructor(iterable) {
        if (iterable) {
            for (const value of iterable) {
                const ref = new WeakRef(value);
                this.#weakset.add(value);
                this.#set.add(ref);
            }
        }
    }
    has(value) {
        return this.#weakset.has(value);
    }
    delete(value) {
        if (this.#weakset.has(value)) {
            for (const ref of this.#set) {
                if (ref.deref() === value) {
                    this.#set.delete(ref);
                    break;
                }
            }
            return this.#weakset.delete(value);
        }
        return false;
    }
    add(value) {
        if (!this.#weakset.has(value)) {
            this.#weakset.add(value);
            this.#set.add(new WeakRef(value));
        }
        return this;
    }
    *[Symbol.iterator]() {
        for (const ref of new Set(this.#set)) {
            const key = ref.deref();
            if (key != null) {
                yield key;
            }
            else {
                this.#set.delete(ref);
            }
        }
    }
}

function replace(node, variableScope) {
    for (const { value, parent: parentValue } of walkValues(node.val)) {
        if (value?.typ == exports.EnumToken.FunctionTokenType && value.val == 'var') {
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
class InlineCssVariablesFeature extends MinifyFeature {
    static get ordering() {
        return 0;
    }
    static register(options) {
        if (options.inlineCssVariables) {
            for (const feature of options.features) {
                if (feature instanceof InlineCssVariablesFeature) {
                    return;
                }
            }
            // @ts-ignore
            options.features.push(new InlineCssVariablesFeature());
        }
    }
    run(ast, options = {}, parent, context) {
        if (!('variableScope' in context)) {
            context.variableScope = new Map;
        }
        const isRoot = parent.typ == exports.EnumToken.StyleSheetNodeType && ast.typ == exports.EnumToken.RuleNodeType && ast.sel == ':root';
        const variableScope = context.variableScope;
        // @ts-ignore
        for (const node of ast.chi) {
            if (node.typ == exports.EnumToken.CDOCOMMNodeType || node.typ == exports.EnumToken.CommentNodeType) {
                continue;
            }
            if (node.typ != exports.EnumToken.DeclarationNodeType) {
                break;
            }
            // css variable
            if (node.nam.startsWith('--')) {
                if (!variableScope.has(node.nam)) {
                    const info = {
                        globalScope: isRoot,
                        // @ts-ignore
                        parent: new IterableWeakSet(),
                        declarationCount: 1,
                        replaceable: isRoot,
                        node: node
                    };
                    info.parent.add(ast);
                    variableScope.set(node.nam, info);
                    let recursive = false;
                    for (const { value, parent: parentValue } of walkValues(node.val)) {
                        if (value?.typ == exports.EnumToken.FunctionTokenType && value.val == 'var') {
                            recursive = true;
                            break;
                        }
                    }
                    if (recursive) {
                        replace(node, variableScope);
                    }
                }
                else {
                    const info = variableScope.get(node.nam);
                    info.globalScope = isRoot;
                    if (!isRoot) {
                        ++info.declarationCount;
                    }
                    if (info.replaceable) {
                        info.replaceable = isRoot && info.declarationCount == 1;
                    }
                    info.parent.add(ast);
                    info.node = node;
                }
            }
            else {
                replace(node, variableScope);
            }
        }
    }
    cleanup(ast, options = {}, context) {
        const variableScope = context.variableScope;
        for (const info of variableScope.values()) {
            if (info.replaceable) {
                let i;
                // drop declarations from :root{}
                for (const parent of info.parent) {
                    i = parent.chi?.length ?? 0;
                    while (i--) {
                        if (parent.chi[i].typ == exports.EnumToken.DeclarationNodeType && parent.chi[i].nam == info.node.nam) {
                            parent.chi.splice(i, 1);
                        }
                    }
                    if (parent.chi?.length == 0 && 'parent' in parent) {
                        // @ts-ignore
                        for (i = 0; i < parent.parent.chi?.length; i++) {
                            // @ts-ignore
                            if (parent.parent.chi[i] == parent) {
                                // @ts-ignore
                                parent.parent.chi.splice(i, 1);
                                break;
                            }
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
            if (t.val == k.val && t.val == '0') {
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
                    if (this.config.types.some(t => token.typ == exports.EnumToken[t]) || (token.typ == exports.EnumToken.NumberTokenType && token.val == '0' &&
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
                            acc.push({ typ: exports.EnumToken.LiteralTokenType, val: this.config.separator });
                        }
                        acc.push(...curr);
                        return acc;
                    }, [])
                }][Symbol.iterator]();
            // return {
            //     next() {
            //
            //         return iterator.next();
            //     }
            // }
        }
        return iterator;
        // return {
        //     next() {
        //
        //         return iterator.next();
        //     }
        // }
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
        for (const val of declaration.val) {
            Object.defineProperty(val, 'propertyName', { enumerable: false, writable: true, value: declaration.nam });
        }
        if (declaration.nam == this.config.shorthand) {
            this.declarations = new Map;
            this.declarations.set(declaration.nam, declaration);
        }
        else {
            const separator = this.config.separator != null ? {
                ...this.config.separator,
                typ: exports.EnumToken[this.config.separator.typ]
            } : null;
            // expand shorthand
            if (declaration.nam != this.config.shorthand && this.declarations.has(this.config.shorthand)) {
                const tokens = {};
                const values = [];
                // @ts-ignore
                this.declarations.get(this.config.shorthand).val.slice().reduce((acc, curr) => {
                    // @ts-ignore
                    if (separator != null && separator.typ == curr.typ && eq(separator, curr)) {
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
                                    if (eq(acc[i], {
                                        ...this.config.properties[property].prefix,
                                        // @ts-ignore
                                        typ: exports.EnumToken[props.prefix.typ]
                                    })) {
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
                    let config = this.config.shorthand == declaration.nam ? this.config : this.config.properties[declaration.nam];
                    if (config == null && declaration.nam in propertiesConfig.properties) {
                        // @ts-ignore
                        const shorthand = propertiesConfig.properties[declaration.nam].shorthand;
                        // @ts-ignore
                        config = propertiesConfig.properties[shorthand];
                    }
                    declaration.val = declaration.val.map((t) => {
                        if (!cache.has(t)) {
                            cache.set(t, renderToken(t, { minify: true }));
                        }
                        const value = cache.get(t);
                        // @ts-ignore
                        if (config?.mapping?.[value] != null) {
                            // @ts-ignore
                            t = parseString(config.mapping[value])[0];
                            cache.set(t, renderToken(t, { minify: true }));
                        }
                        return t;
                    }).filter((val) => {
                        return !config?.default?.includes(cache.get(val));
                    })
                        .filter((val, index, array) => !(index > 0 &&
                        val.typ == exports.EnumToken.WhitespaceTokenType &&
                        array[index - 1].typ == exports.EnumToken.WhitespaceTokenType));
                    if (declaration.val.at(-1)?.typ == exports.EnumToken.WhitespaceTokenType) {
                        declaration.val.pop();
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
            // @ts-ignore
            iterable = this.declarations.values();
        }
        else {
            let count = 0;
            let match;
            const separator = this.config.separator != null ? {
                ...this.config.separator,
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
                        if (separator != null && separator.typ == val.typ && eq(separator, val)) {
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
                        if (props.multiple && props.separator != null && exports.EnumToken[props.separator.typ] == val.typ && eq({
                            ...props.separator,
                            typ: exports.EnumToken[props.separator.typ]
                        }, val)) {
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
            if (!isShorthand || Object.entries(this.config.properties).some(entry => {
                // missing required property
                return entry[1].required && !(entry[0] in tokens);
            }) ||
                // @ts-ignore
                !Object.values(tokens).every(v => v.filter(t => t.typ != exports.EnumToken.CommentTokenType).length == count)) {
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
                        // @todo remove renderToken call
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
}

const config = getConfig();
class PropertyList {
    options = { removeDuplicateDeclarations: true, computeShorthand: true };
    declarations;
    constructor(options = {}) {
        for (const key of Object.keys(this.options)) {
            if (key in options) {
                // @ts-ignore
                this.options[key] = options[key];
            }
        }
        this.declarations = new Map;
    }
    set(nam, value) {
        return this.add({
            typ: exports.EnumToken.DeclarationNodeType,
            nam,
            val: Array.isArray(value) ? value : parseString(String(value))
        });
    }
    add(declaration) {
        if (declaration.typ != exports.EnumToken.DeclarationNodeType || !this.options.removeDuplicateDeclarations) {
            this.declarations.set(Number(Math.random().toString().slice(2)).toString(36), declaration);
            return this;
        }
        if (!this.options.computeShorthand) {
            this.declarations.set(declaration.nam, declaration);
            return this;
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

class ComputeShorthandFeature extends MinifyFeature {
    static get ordering() {
        return 2;
    }
    static register(options) {
        if (options.computeShorthand) {
            for (const feature of options.features) {
                if (feature instanceof ComputeShorthandFeature) {
                    return;
                }
            }
            // @ts-ignore
            options.features.push(new ComputeShorthandFeature());
        }
    }
    run(ast, options = {}, parent, context) {
        // @ts-ignore
        const j = ast.chi.length;
        let k = 0;
        let properties = new PropertyList(options);
        // @ts-ignore
        for (; k < j; k++) {
            // @ts-ignore
            const node = ast.chi[k];
            if (node.typ == exports.EnumToken.CommentNodeType || node.typ == exports.EnumToken.DeclarationNodeType) {
                properties.add(node);
                continue;
            }
            break;
        }
        // @ts-ignore
        ast.chi = [...properties].concat(ast.chi.slice(k));
        return ast;
    }
}

class ComputeCalcExpressionFeature extends MinifyFeature {
    static get ordering() {
        return 1;
    }
    static register(options) {
        if (options.computeCalcExpression) {
            for (const feature of options.features) {
                if (feature instanceof ComputeCalcExpressionFeature) {
                    return;
                }
            }
            // @ts-ignore
            options.features.push(new ComputeCalcExpressionFeature());
        }
    }
    run(ast) {
        if (!('chi' in ast)) {
            return ast;
        }
        // @ts-ignore
        for (const node of ast.chi) {
            if (node.typ != exports.EnumToken.DeclarationNodeType) {
                continue;
            }
            const set = new IterableWeakSet;
            for (const { value, parent } of walkValues(node.val)) {
                if (value != null && value.typ == exports.EnumToken.FunctionTokenType && value.val == 'calc') {
                    if (!set.has(parent)) {
                        set.add(value);
                        value.chi = evaluate(value.chi);
                        if (value.chi.length == 1 && value.chi[0].typ != exports.EnumToken.BinaryExpressionTokenType) {
                            if (parent != null) {
                                if (parent.typ == exports.EnumToken.BinaryExpressionTokenType) {
                                    if (parent.l == value) {
                                        parent.l = value.chi[0];
                                    }
                                    else {
                                        parent.r = value.chi[0];
                                    }
                                }
                                else {
                                    for (let i = 0; i < parent.chi.length; i++) {
                                        if (parent.chi[i] == value) {
                                            parent.chi.splice(i, 1, value.chi[0]);
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
        return ast;
    }
}

var allFeatures = /*#__PURE__*/Object.freeze({
    __proto__: null,
    ComputeCalcExpressionFeature: ComputeCalcExpressionFeature,
    ComputeShorthandFeature: ComputeShorthandFeature,
    InlineCssVariablesFeature: InlineCssVariablesFeature
});

const combinators = ['+', '>', '~', '||'];
const notEndingWith = ['(', '['].concat(combinators);
const definedPropertySettings = { configurable: true, enumerable: false, writable: true };
// @ts-ignore
const features = Object.values(allFeatures).sort((a, b) => a.ordering - b.ordering);
function minify(ast, options = {}, recursive = false, errors, nestingContent, context = {}) {
    if (!('nodes' in context)) {
        context.nodes = new WeakSet;
    }
    if (context.nodes.has(ast)) {
        // console.error('skipped', ast.typ);
        return ast;
    }
    context.nodes.add(ast);
    if (!('features' in options)) {
        // @ts-ignore
        options = {
            removeDuplicateDeclarations: true,
            computeShorthand: true,
            computeCalcExpression: true,
            features: [], ...options
        };
        // @ts-ignore
        for (const feature of features) {
            feature.register(options);
        }
    }
    function reducer(acc, curr, index, array) {
        // trim :is()
        if (array.length == 1 && array[0][0] == ':is(' && array[0].at(-1) == ')') {
            curr = curr.slice(1, -1);
        }
        if (curr[0] == '&') {
            if (curr[1] == ' ' && !isIdent(curr[2]) && !isFunction(curr[2])) {
                curr.splice(0, 2);
            }
            else if (combinators.includes(curr[1])) {
                curr.splice(0, 1);
            }
        }
        else if (ast.typ == exports.EnumToken.RuleNodeType && (isIdent(curr[0]) || isFunction(curr[0]))) {
            curr.unshift('&', ' ');
        }
        acc.push(curr.join(''));
        return acc;
    }
    // @ts-ignore
    if ('chi' in ast && ast.chi.length > 0) {
        if (!nestingContent) {
            nestingContent = options.nestingRules && ast.typ == exports.EnumToken.RuleNodeType;
        }
        let i = 0;
        let previous;
        let node;
        let nodeIndex;
        // @ts-ignore
        for (; i < ast.chi.length; i++) {
            // @ts-ignore
            if (ast.chi[i].typ == exports.EnumToken.CommentNodeType) {
                continue;
            }
            // @ts-ignore
            node = ast.chi[i];
            // @ts-ignore
            if (previous == node) {
                // @ts-ignore
                ast.chi.splice(i, 1);
                i--;
                continue;
            }
            if (node.typ == exports.EnumToken.AtRuleNodeType && node.nam == 'font-face') {
                continue;
            }
            if (node.typ == exports.EnumToken.AtRuleNodeType) {
                if (node.nam == 'media' && node.val == 'all') {
                    // @ts-ignore
                    ast.chi?.splice(i, 1, ...node.chi);
                    i--;
                    continue;
                }
                // @ts-ignore
                if (previous?.typ == exports.EnumToken.AtRuleNodeType &&
                    previous.nam == node.nam &&
                    previous.val == node.val) {
                    if ('chi' in node) {
                        // @ts-ignore
                        previous.chi.push(...node.chi);
                    }
                    ast?.chi?.splice(i--, 1);
                    continue;
                }
                // @ts-ignore
                if (!hasDeclaration(node)) {
                    minify(node, options, recursive, errors, nestingContent, context);
                }
                previous = node;
                nodeIndex = i;
                continue;
            }
            // @ts-ignore
            if (node.typ == exports.EnumToken.RuleNodeType) {
                reduceRuleSelector(node);
                let wrapper;
                let match;
                // @ts-ignore
                if (options.nestingRules) {
                    // @ts-ignore
                    if (previous?.typ == exports.EnumToken.RuleNodeType) {
                        // @ts-ignore
                        reduceRuleSelector(previous);
                        // @ts-ignore
                        match = matchSelectors(previous.raw, node.raw, ast.typ, errors);
                        // @ts-ignore
                        if (match != null) {
                            // @ts-ignore
                            wrapper = wrapNodes(previous, node, match, ast, reducer, i, nodeIndex);
                            nodeIndex = i - 1;
                            // @ts-ignore
                            previous = ast.chi[nodeIndex];
                        }
                    }
                    // @ts-ignore
                    if (wrapper != null) {
                        // @ts-ignore
                        while (i < ast.chi.length) {
                            // @ts-ignore
                            const nextNode = ast.chi[i];
                            // @ts-ignore
                            if (nextNode.typ != exports.EnumToken.RuleNodeType) {
                                break;
                            }
                            reduceRuleSelector(nextNode);
                            // @ts-ignore
                            match = matchSelectors(wrapper.raw, nextNode.raw, ast.typ, errors);
                            // @ts-ignore
                            if (match == null) {
                                break;
                            }
                            // @ts-ignore
                            wrapper = wrapNodes(wrapper, nextNode, match, ast, reducer, i, nodeIndex);
                        }
                        nodeIndex = --i;
                        // @ts-ignore
                        previous = ast.chi[nodeIndex];
                        minify(wrapper, options, recursive, errors, nestingContent, context);
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
                                if (ast.typ != exports.EnumToken.RuleNodeType && combinators.includes(curr[1])) {
                                    wrap = false;
                                }
                                else {
                                    curr.splice(0, 1);
                                }
                            }
                        }
                        else if (combinators.includes(curr[0])) {
                            curr.unshift('&');
                            wrap = false;
                        }
                        // @ts-ignore
                        acc.push(curr);
                        return acc;
                    }, []);
                    if (!wrap) {
                        wrap = selector.some((s) => s[0] != '&');
                    }
                    let rule = selector.map(s => {
                        if (s[0] == '&') {
                            // @ts-ignore
                            s[0] = node.optimized.optimized[0];
                        }
                        return s.join('');
                    }).join(',');
                    // @ts-ignore
                    let sel = wrap ? node.optimized.optimized[0] + `:is(${rule})` : rule;
                    if (rule.includes('&')) {
                        // @ts-ignore
                        rule = replaceCompound(rule, node.optimized.optimized[0]);
                    }
                    if (sel.length < node.sel.length) {
                        node.sel = sel;
                    }
                }
            }
            // @ts-ignore
            if (previous != null) {
                // @ts-ignore
                if ('chi' in previous && ('chi' in node)) {
                    // @ts-ignore
                    if (previous.typ == node.typ) {
                        let shouldMerge = true;
                        // @ts-ignore
                        let k = previous.chi.length;
                        while (k-- > 0) {
                            // @ts-ignore
                            if (previous.chi[k].typ == exports.EnumToken.CommentNodeType) {
                                continue;
                            }
                            // @ts-ignore
                            shouldMerge = previous.chi[k].typ == exports.EnumToken.DeclarationNodeType;
                            break;
                        }
                        if (shouldMerge) {
                            // @ts-ignore
                            if ((node.typ == exports.EnumToken.RuleNodeType && node.sel == previous.sel) ||
                                // @ts-ignore
                                (node.typ == exports.EnumToken.AtRuleNodeType) && node.val != 'font-face' && node.val == previous.val) {
                                // @ts-ignore
                                node.chi.unshift(...previous.chi);
                                // @ts-ignore
                                ast.chi.splice(nodeIndex, 1);
                                // @ts-ignore
                                if (!hasDeclaration(node)) {
                                    // @ts-ignore
                                    // minifyRule(node, <MinifyOptions>options, ast, context);
                                    // } else {
                                    minify(node, options, recursive, errors, nestingContent, context);
                                }
                                i--;
                                previous = node;
                                nodeIndex = i;
                                continue;
                            }
                            else if (node.typ == exports.EnumToken.RuleNodeType && previous?.typ == exports.EnumToken.RuleNodeType) {
                                const intersect = diff(previous, node, reducer, options);
                                if (intersect != null) {
                                    if (intersect.node1.chi.length == 0) {
                                        // @ts-ignore
                                        ast.chi.splice(i--, 1);
                                        // @ts-ignore
                                        node = ast.chi[i];
                                    }
                                    else {
                                        // @ts-ignore
                                        ast.chi.splice(i, 1, intersect.node1);
                                        node = intersect.node1;
                                    }
                                    if (intersect.node2.chi.length == 0) {
                                        // @ts-ignore
                                        ast.chi.splice(nodeIndex, 1, intersect.result);
                                        previous = intersect.result;
                                    }
                                    else {
                                        // @ts-ignore
                                        ast.chi.splice(nodeIndex, 1, intersect.result, intersect.node2);
                                        previous = intersect.result;
                                        // @ts-ignore
                                        i = nodeIndex;
                                    }
                                }
                            }
                        }
                    }
                    // @ts-ignore
                    if (recursive && previous != node) {
                        // @ts-ignore
                        if (!hasDeclaration(previous)) {
                            // @ts-ignore
                            // minifyRule(previous, <MinifyOptions>options, ast, context);
                            // } else {
                            minify(previous, options, recursive, errors, nestingContent, context);
                        }
                    }
                }
                else {
                    if ('chi' in previous) {
                        // @ts-ignore
                        if (!hasDeclaration(previous)) {
                            // @ts-ignore
                            // minifyRule(previous, <MinifyOptions>options, ast, context);
                            // } else {
                            minify(previous, options, recursive, errors, nestingContent, context);
                        }
                    }
                }
            }
            if (!nestingContent &&
                // @ts-ignore
                previous != null &&
                // previous.optimized != null &&
                previous.typ == exports.EnumToken.RuleNodeType &&
                previous.sel.includes('&')) {
                fixSelector(previous);
            }
            previous = node;
            nodeIndex = i;
        }
        // @ts-ignore
        if (recursive && node != null && ('chi' in node)) {
            // @ts-ignore
            if (!node.chi.some(n => n.typ == exports.EnumToken.DeclarationNodeType)) {
                // @ts-ignore
                if (!(node.typ == exports.EnumToken.AtRuleNodeType && node.nam != 'font-face')) {
                    minify(node, options, recursive, errors, nestingContent, context);
                }
            }
        }
        if (!nestingContent &&
            // @ts-ignore
            node != null &&
            // previous.optimized != null &&
            node.typ == exports.EnumToken.RuleNodeType &&
            node.sel.includes('&')) {
            fixSelector(node);
        }
    }
    if (ast.typ == exports.EnumToken.StyleSheetNodeType) {
        let parent;
        let parents = [ast];
        while (parents.length > 0) {
            parent = parents.shift();
            // @ts-ignore
            for (let k = 0; k < parent.chi.length; k++) {
                // @ts-ignore
                const node = parent.chi[k];
                if (!('chi' in node) || node.typ == exports.EnumToken.StyleSheetNodeType || (node.typ == exports.EnumToken.AtRuleNodeType && node.nam == 'font-face')) {
                    continue;
                }
                // @ts-ignore
                if (node.chi.length > 0) {
                    parents.push(node);
                    Object.defineProperty(node, 'parent', { ...definedPropertySettings, value: parent });
                    for (const feature of options.features) {
                        feature.run(node, options, parent, context);
                    }
                }
                // @ts-ignore
                if (options.removeEmpty && node.chi.length == 0) {
                    // @ts-ignore
                    parent.chi.splice(k, 1);
                    k--;
                }
            }
        }
        for (const feature of options.features) {
            if ('cleanup' in feature) {
                // @ts-ignore
                feature.cleanup(ast, options, context);
            }
        }
    }
    return ast;
}
function reduceSelector(selector) {
    if (selector.length == 0) {
        return null;
    }
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
    // combinator
    if (combinators.includes(optimized.at(-1))) {
        const combinator = optimized.pop();
        selector.forEach(selector => selector.unshift(combinator));
    }
    let reducible = optimized.length == 1;
    if (optimized[0] == '&' && optimized[1] == ' ') {
        optimized.splice(0, 2);
    }
    if (optimized.length == 0 ||
        (optimized[0].charAt(0) == '&' ||
            selector.length == 1)) {
        return {
            match: false,
            optimized,
            selector: selector.map(selector => selector[0] == '&' && selector[1] == ' ' ? selector.slice(2) : selector),
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
function splitRule(buffer) {
    const result = [[]];
    let str = '';
    for (let i = 0; i < buffer.length; i++) {
        let chr = buffer.charAt(i);
        if (isWhiteSpace(chr.charCodeAt(0))) {
            let k = i;
            while (k + 1 < buffer.length) {
                if (isWhiteSpace(buffer[k + 1].charCodeAt(0))) {
                    k++;
                    continue;
                }
                break;
            }
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
            i = k;
            continue;
        }
        if (chr == ',') {
            if (str !== '') {
                // @ts-ignore
                result.at(-1).push(str);
                str = '';
            }
            result.push([]);
            continue;
        }
        str += chr;
        if (chr == '\\') {
            str += buffer.charAt(++i);
            continue;
        }
        if (chr == '"' || chr == "'") {
            let k = i;
            while (++k < buffer.length) {
                chr = buffer.charAt(k);
                str += chr;
                if (chr == '//') {
                    str += buffer.charAt(++k);
                    continue;
                }
                if (chr == buffer.charAt(i)) {
                    break;
                }
            }
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
        // @ts-ignore
        result.at(-1).push(str);
    }
    return result;
}
function matchSelectors(selector1, selector2, parentType, errors) {
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
        if (token == ',') {
            match.push([]);
        }
        else {
            if (token.endsWith('(')) {
                matchFunction++;
            }
            if (token.endsWith('[')) {
                inAttr++;
            }
            else if (token == ')') {
                matchFunction--;
            }
            else if (token == ']') {
                inAttr--;
            }
            match.at(-1).push(token);
        }
    }
    // invalid function
    if (matchFunction != 0 || inAttr != 0) {
        return null;
    }
    if (parentType != exports.EnumToken.RuleNodeType) {
        for (const part of match) {
            if (part.length > 0 && combinators.includes(part[0].charAt(0))) {
                return null;
            }
        }
    }
    if (match.length > 1) {
        errors?.push({
            action: 'ignore',
            message: `minify: unsupported multilevel matching\n${JSON.stringify({
                match,
                selector1,
                selector2
            }, null, 1)}`
        });
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
    function reduce(acc, curr) {
        if (acc === null) {
            return null;
        }
        let hasCompoundSelector = true;
        curr = curr.slice(match[0].length);
        while (curr.length > 0) {
            if (curr[0] == ' ') {
                hasCompoundSelector = false;
                curr.unshift('&');
                continue;
            }
            break;
        }
        // invalid function match
        if (curr.length > 0 && curr[0].endsWith('(') && curr.at(-1) != ')') {
            return null;
        }
        if (curr.length == 1 && combinators.includes(curr[0].charAt(0))) {
            return null;
        }
        if (hasCompoundSelector && curr.length > 0) {
            hasCompoundSelector = !['&'].concat(combinators).includes(curr[0].charAt(0));
        }
        if (curr[0] == ':is(') {
            let inFunction = 0;
            let canReduce = true;
            const isCompound = curr.reduce((acc, token, index) => {
                if (index == 0) {
                    inFunction++;
                    canReduce = curr[1] == '&';
                }
                else if (token.endsWith('(')) {
                    if (inFunction == 0) {
                        canReduce = false;
                    }
                    inFunction++;
                }
                else if (token == ')') {
                    inFunction--;
                }
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
            if (inFunction > 0) {
                canReduce = false;
            }
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
        // @todo: check hasCompoundSelector && curr[0] == '&' && curr[1] == ' '
        acc.push(match.length == 0 ? ['&'] : (hasCompoundSelector && curr[0] != '&' && (curr.length == 0 || !combinators.includes(curr[0].charAt(0))) ? ['&'].concat(curr) : curr));
        return acc;
    }
    // @ts-ignore
    selector1 = selector1.reduce(reduce, []);
    // @ts-ignore
    selector2 = selector2.reduce(reduce, []);
    return selector1 == null || selector2 == null ? null : {
        eq: eq(selector1, selector2),
        match,
        selector1,
        selector2
    };
}
function fixSelector(node) {
    // @ts-ignore
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
function wrapNodes(previous, node, match, ast, reducer, i, nodeIndex) {
    // @ts-ignore
    let pSel = match.selector1.reduce(reducer, []).join(',');
    // @ts-ignore
    let nSel = match.selector2.reduce(reducer, []).join(',');
    // @ts-ignore
    const wrapper = { ...previous, chi: [], sel: match.match.reduce(reducer, []).join(',') };
    // @ts-ignore
    Object.defineProperty(wrapper, 'raw', {
        ...definedPropertySettings,
        // @ts-ignore
        value: match.match.map(t => t.slice())
    });
    if (pSel == '&' || pSel === '') {
        // @ts-ignore
        wrapper.chi.push(...previous.chi);
        // @ts-ignore
        if ((nSel == '&' || nSel === '')) {
            // @ts-ignore
            wrapper.chi.push(...node.chi);
        }
        else {
            // @ts-ignore
            wrapper.chi.push(node);
        }
    }
    else {
        // @ts-ignore
        wrapper.chi.push(previous, node);
    }
    // @ts-ignore
    ast.chi.splice(i, 1, wrapper);
    // @ts-ignore
    ast.chi.splice(nodeIndex, 1);
    // @ts-ignore
    previous.sel = pSel;
    // @ts-ignore
    previous.raw = match.selector1;
    // @ts-ignore
    node.sel = nSel;
    // @ts-ignore
    node.raw = match.selector2;
    reduceRuleSelector(wrapper);
    return wrapper;
}
function diff(n1, n2, reducer, options = {}) {
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
    if (i == 0 || j == 0) {
        // @ts-ignore
        return null;
    }
    // @ts-ignore
    const raw1 = node1.raw;
    // @ts-ignore
    const raw2 = node2.raw;
    // @ts-ignore
    node1 = { ...node1, chi: node1.chi.slice() };
    node2 = { ...node2, chi: node2.chi.slice() };
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
        if (j == 0) {
            break;
        }
        while (j--) {
            if (node2.chi[j].typ == exports.EnumToken.CommentNodeType) {
                continue;
            }
            if (node1.chi[i].nam == node2.chi[j].nam) {
                if (eq(node1.chi[i], node2.chi[j])) {
                    intersect.push(node1.chi[i]);
                    node1.chi.splice(i, 1);
                    node2.chi.splice(j, 1);
                    break;
                }
            }
        }
    }
    // @ts-ignore
    const result = (intersect.length == 0 ? null : {
        ...node1,
        // @ts-ignore
        sel: [...new Set([...(n1?.raw?.reduce(reducer, []) || splitRule(n1.sel)).concat(n2?.raw?.reduce(reducer, []) || splitRule(n2.sel))])].join(','),
        chi: intersect.reverse()
    });
    if (result == null || [n1, n2].reduce((acc, curr) => curr.chi.length == 0 ? acc : acc + doRender(curr, options).code.length, 0) <= [node1, node2, result].reduce((acc, curr) => curr.chi.length == 0 ? acc : acc + doRender(curr, options).code.length, 0)) {
        // @ts-ignore
        return null;
    }
    return { result, node1: exchanged ? node2 : node1, node2: exchanged ? node1 : node2 };
}
function reduceRuleSelector(node) {
    if (node.raw == null) {
        Object.defineProperty(node, 'raw', { ...definedPropertySettings, value: splitRule(node.sel) });
    }
    // @ts-ignore
    // if (node.raw != null) {
    // @ts-ignore
    let optimized = reduceSelector(node.raw.reduce((acc, curr) => {
        acc.push(curr.slice());
        return acc;
    }, []));
    if (optimized != null) {
        Object.defineProperty(node, 'optimized', { ...definedPropertySettings, value: optimized });
    }
    if (optimized != null && optimized.match && optimized.reducible && optimized.selector.length > 1) {
        const raw = [
            [
                optimized.optimized[0], ':is('
            ].concat(optimized.selector.reduce((acc, curr) => {
                if (acc.length > 0) {
                    acc.push(',');
                }
                acc.push(...curr);
                return acc;
            }, [])).concat(')')
        ];
        const sel = raw[0].join('');
        if (sel.length < node.sel.length) {
            node.sel = sel;
            // node.raw = raw;
            Object.defineProperty(node, 'raw', { ...definedPropertySettings, value: raw });
        }
    }
}

const matchUrl = /^(https?:)?\/\//;
function dirname(path) {
    if (path == '/' || path === '') {
        return path;
    }
    let i = 0;
    let parts = [''];
    for (; i < path.length; i++) {
        const chr = path.charAt(i);
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
    parts.pop();
    return parts.length == 0 ? '/' : parts.join('/');
}
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
function resolve(url, currentDirectory, cwd) {
    if (matchUrl.test(url)) {
        return {
            absolute: url,
            relative: url
        };
    }
    if (matchUrl.test(currentDirectory)) {
        const path = new URL(url, currentDirectory).href;
        return {
            absolute: path,
            relative: path
        };
    }
    let result;
    if (url.charAt(0) == '/') {
        result = url;
    }
    else if (currentDirectory.charAt(0) == '/') {
        result = dirname(currentDirectory) + '/' + url;
    }
    else if (currentDirectory === '' || dirname(currentDirectory) === '') {
        result = url;
    }
    else {
        result = dirname(currentDirectory) + '/' + url;
    }
    let { parts, i } = splitPath(result);
    if (parts.length == 0) {
        const path = result.charAt(0) == '/' ? '/' : '';
        return {
            absolute: path,
            relative: path
        };
    }
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

function parseResponse(response) {
    if (!response.ok) {
        throw new Error(`${response.status} ${response.statusText} ${response.url}`);
    }
    return response.text();
}
async function load(url, currentFile) {
    const resolved = resolve(url, currentFile);
    return matchUrl.test(resolved.absolute) ? fetch(resolved.absolute).then(parseResponse) : promises.readFile(resolved.absolute, { encoding: 'utf-8' });
}

function render(data, options = {}) {
    return doRender(data, Object.assign(options, { load, resolve, dirname, cwd: options.cwd ?? process.cwd() }));
}
async function parse(iterator, opt = {}) {
    return doParse(iterator, Object.assign(opt, { load, resolve, dirname, cwd: opt.cwd ?? process.cwd() }));
}
async function transform(css, options = {}) {
    options = { minify: true, removeEmpty: true, removeCharset: true, ...options };
    const startTime = performance.now();
    return parse(css, options).then((parseResult) => {
        const rendered = render(parseResult.ast, options);
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

exports.dirname = dirname;
exports.expand = expand;
exports.load = load;
exports.minify = minify;
exports.parse = parse;
exports.parseString = parseString;
exports.parseTokens = parseTokens;
exports.render = render;
exports.renderToken = renderToken;
exports.resolve = resolve;
exports.transform = transform;
exports.walk = walk;
exports.walkValues = walkValues;
