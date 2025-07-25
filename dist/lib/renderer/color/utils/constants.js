import { EnumToken } from '../../../ast/types.js';
import '../../../ast/minify.js';
import '../../../ast/walk.js';
import '../../../parser/parse.js';
import '../../../parser/tokenize.js';
import '../../../parser/utils/config.js';
import '../../sourcemap/lib/encode.js';

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
// xyz-d65 is an alias for xyz
// display-p3 is an alias for srgb
var ColorKind;
(function (ColorKind) {
    ColorKind[ColorKind["SYS"] = 0] = "SYS";
    ColorKind[ColorKind["DPSYS"] = 1] = "DPSYS";
    ColorKind[ColorKind["LIT"] = 2] = "LIT";
    ColorKind[ColorKind["HEX"] = 3] = "HEX";
    ColorKind[ColorKind["RGB"] = 4] = "RGB";
    ColorKind[ColorKind["RGBA"] = 5] = "RGBA";
    ColorKind[ColorKind["HSL"] = 6] = "HSL";
    ColorKind[ColorKind["HSLA"] = 7] = "HSLA";
    ColorKind[ColorKind["HWB"] = 8] = "HWB";
    ColorKind[ColorKind["DEVICE_CMYK"] = 9] = "DEVICE_CMYK";
    ColorKind[ColorKind["OKLAB"] = 10] = "OKLAB";
    ColorKind[ColorKind["OKLCH"] = 11] = "OKLCH";
    ColorKind[ColorKind["LAB"] = 12] = "LAB";
    ColorKind[ColorKind["LCH"] = 13] = "LCH";
    ColorKind[ColorKind["COLOR"] = 14] = "COLOR";
    ColorKind[ColorKind["SRGB"] = 15] = "SRGB";
    ColorKind[ColorKind["PROPHOTO_RGB"] = 16] = "PROPHOTO_RGB";
    ColorKind[ColorKind["A98_RGB"] = 17] = "A98_RGB";
    ColorKind[ColorKind["REC2020"] = 18] = "REC2020";
    ColorKind[ColorKind["DISPLAY_P3"] = 19] = "DISPLAY_P3";
    ColorKind[ColorKind["SRGB_LINEAR"] = 20] = "SRGB_LINEAR";
    ColorKind[ColorKind["XYZ"] = 21] = "XYZ";
    ColorKind[ColorKind["XYZ_D50"] = 22] = "XYZ_D50";
    ColorKind[ColorKind["XYZ_D65"] = 23] = "XYZ_D65";
    ColorKind[ColorKind["LIGHT_DARK"] = 24] = "LIGHT_DARK";
    ColorKind[ColorKind["COLOR_MIX"] = 25] = "COLOR_MIX";
})(ColorKind || (ColorKind = {}));
const generalEnclosedFunc = ['selector', 'font-tech', 'font-format', 'media', 'supports'];
const funcLike = [
    EnumToken.ParensTokenType,
    EnumToken.FunctionTokenType,
    EnumToken.UrlFunctionTokenType,
    EnumToken.StartParensTokenType,
    EnumToken.ImageFunctionTokenType,
    EnumToken.TimingFunctionTokenType,
    EnumToken.TimingFunctionTokenType,
    EnumToken.PseudoClassFuncTokenType,
    EnumToken.GridTemplateFuncTokenType
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

export { COLORS_NAMES, ColorKind, D50, NAMES_COLORS, colorFuncColorSpace, colorRange, colorsFunc, deprecatedSystemColors, e, funcLike, generalEnclosedFunc, k, systemColors };
