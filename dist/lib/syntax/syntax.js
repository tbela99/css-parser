import { colorsFunc } from '../renderer/render.js';
import { EnumToken } from '../ast/types.js';
import '../ast/minify.js';
import '../ast/walk.js';
import '../parser/parse.js';
import '../parser/utils/config.js';
import { COLORS_NAMES } from '../renderer/color/utils/constants.js';

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
const mathFuncs = ['calc', 'clamp', 'min', 'max', 'round', 'mod', 'rem', 'sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'atan2', 'pow', 'sqrt', 'hypot', 'log', 'exp', 'abs', 'sign'];
const pseudoElements = [':before', ':after', ':first-line', ':first-letter'];
const webkitPseudoAliasMap = {
    '-webkit-autofill': 'autofill',
    '-webkit-any': 'is',
    '-moz-any': 'is',
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
    '-webkit-max-device-pixel-ratio': 'max-resolution'
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
    if (token.typ != EnumToken.IdenTokenType) {
        return false;
    }
    return ['srgb', 'srgb-linear', 'lab', 'oklab', 'lch', 'oklch', 'xyz', 'xyz-d50', 'xyz-d65', 'display-p3', 'a98-rgb', 'prophoto-rgb', 'rec2020', 'rgb', 'hsl', 'hwb'].includes(token.val.toLowerCase());
}
function isRectangularOrthogonalColorspace(token) {
    if (token.typ != EnumToken.IdenTokenType) {
        return false;
    }
    return ['srgb', 'srgb-linear', 'display-p3', 'a98-rgb', 'prophoto-rgb', 'rec2020', 'lab', 'oklab', 'xyz', 'xyz-d50', 'xyz-d65'].includes(token.val.toLowerCase());
}
function isPolarColorspace(token) {
    if (token.typ != EnumToken.IdenTokenType) {
        return false;
    }
    return ['hsl', 'hwb', 'lch', 'oklch'].includes(token.val);
}
function isHueInterpolationMethod(token) {
    if (token.typ != EnumToken.IdenTokenType) {
        return false;
    }
    return ['shorter', 'longer', 'increasing', 'decreasing'].includes(token.val);
}
function isColor(token) {
    if (token.typ == EnumToken.ColorTokenType) {
        return true;
    }
    if (token.typ == EnumToken.IdenTokenType) {
        // named color
        return token.val.toLowerCase() in COLORS_NAMES;
    }
    let isLegacySyntax = false;
    if (token.typ == EnumToken.FunctionTokenType && token.chi.length > 0 && colorsFunc.includes(token.val)) {
        // @ts-ignore
        if (token.val == 'light-dark') {
            // @ts-ignore
            const children = token.chi.filter((t) => [EnumToken.IdenTokenType, EnumToken.NumberTokenType, EnumToken.LiteralTokenType, EnumToken.ColorTokenType, EnumToken.FunctionTokenType, EnumToken.PercentageTokenType].includes(t.typ));
            if (children.length != 2) {
                return false;
            }
            if (isColor(children[0]) && isColor(children[1])) {
                return true;
            }
        }
        // @ts-ignore
        if (token.val == 'color') {
            // @ts-ignore
            const children = token.chi.filter((t) => [EnumToken.IdenTokenType, EnumToken.NumberTokenType, EnumToken.LiteralTokenType, EnumToken.ColorTokenType, EnumToken.FunctionTokenType, EnumToken.PercentageTokenType].includes(t.typ));
            const isRelative = children[0].typ == EnumToken.IdenTokenType && children[0].val == 'from';
            if (children.length < 4 || children.length > 8) {
                return false;
            }
            if (!isRelative && !isColorspace(children[0])) {
                return false;
            }
            for (let i = 1; i < children.length - 2; i++) {
                if (children[i].typ == EnumToken.IdenTokenType) {
                    if (children[i].val != 'none' &&
                        !(isRelative && ['alpha', 'r', 'g', 'b', 'x', 'y', 'z'].includes(children[i].val) || isColorspace(children[i]))) {
                        return false;
                    }
                }
                if (children[i].typ == EnumToken.FunctionTokenType && !mathFuncs.includes(children[i].val)) {
                    return false;
                }
            }
            if (children.length == 4 || (isRelative && children.length == 6)) {
                return true;
            }
            if (children.length == 8 || children.length == 6) {
                const sep = children.at(-2);
                const alpha = children.at(-1);
                // @ts-ignore
                if ((children.length > 6 || !isRelative) && sep.typ != EnumToken.LiteralTokenType || sep.val != '/') {
                    return false;
                }
                if (alpha.typ == EnumToken.IdenTokenType && alpha.val != 'none') {
                    return false;
                }
                else {
                    // @ts-ignore
                    if (alpha.typ == EnumToken.PercentageTokenType) {
                        if (+alpha.val < 0 || +alpha.val > 100) {
                            return false;
                        }
                    }
                    else if (alpha.typ == EnumToken.NumberTokenType) {
                        if (+alpha.val < 0 || +alpha.val > 1) {
                            return false;
                        }
                    }
                }
            }
            return true;
        }
        else { // @ts-ignore
            if (token.val == 'color-mix') {
                // @ts-ignore
                const children = token.chi.reduce((acc, t) => {
                    if (t.typ == EnumToken.CommaTokenType) {
                        acc.push([]);
                    }
                    else {
                        if (![EnumToken.WhitespaceTokenType, EnumToken.CommentTokenType].includes(t.typ)) {
                            acc[acc.length - 1].push(t);
                        }
                    }
                    return acc;
                }, [[]]);
                if (children.length == 3) {
                    if (children[0].length > 3 ||
                        children[0][0].typ != EnumToken.IdenTokenType ||
                        children[0][0].val != 'in' ||
                        !isColorspace(children[0][1]) ||
                        (children[0].length == 3 && !isHueInterpolationMethod(children[0][2])) ||
                        children[1].length > 2 ||
                        children[1][0].typ != EnumToken.ColorTokenType ||
                        children[2].length > 2 ||
                        children[2][0].typ != EnumToken.ColorTokenType) {
                        return false;
                    }
                    if (children[1].length == 2) {
                        if (!(children[1][1].typ == EnumToken.PercentageTokenType || (children[1][1].typ == EnumToken.NumberTokenType && children[1][1].val == '0'))) {
                            return false;
                        }
                    }
                    if (children[2].length == 2) {
                        if (!(children[2][1].typ == EnumToken.PercentageTokenType || (children[2][1].typ == EnumToken.NumberTokenType && children[2][1].val == '0'))) {
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
                    if (v.typ == EnumToken.CommaTokenType) {
                        isLegacySyntax = true;
                    }
                    if (v.typ == EnumToken.IdenTokenType) {
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
                    if (v.typ == EnumToken.FunctionTokenType && (mathFuncs.includes(v.val) || v.val == 'var' || colorsFunc.includes(v.val))) {
                        continue;
                    }
                    if (![EnumToken.ColorTokenType, EnumToken.IdenTokenType, EnumToken.NumberTokenType, EnumToken.AngleTokenType, EnumToken.PercentageTokenType, EnumToken.CommaTokenType, EnumToken.WhitespaceTokenType, EnumToken.LiteralTokenType].includes(v.typ)) {
                        return false;
                    }
                }
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
    const dimension = {
        typ: EnumToken.DimensionTokenType,
        val: name.slice(0, index),
        unit: name.slice(index)
    };
    if (isAngle(dimension)) {
        // @ts-ignore
        dimension.typ = EnumToken.AngleTokenType;
    }
    else if (isLength(dimension)) {
        // @ts-ignore
        dimension.typ = EnumToken.LengthTokenType;
    }
    else if (isTime(dimension)) {
        // @ts-ignore
        dimension.typ = EnumToken.TimeTokenType;
    }
    else if (isResolution(dimension)) {
        // @ts-ignore
        dimension.typ = EnumToken.ResolutionTokenType;
        if (dimension.unit == 'dppx') {
            dimension.unit = 'x';
        }
    }
    else if (isFrequency(dimension)) {
        // @ts-ignore
        dimension.typ = EnumToken.FrequencyTokenType;
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
/*
export function isHexDigit(name: string): boolean {

    if (name.length || name.length > 6) {

        return false;
    }

    for (let chr of name) {

        let codepoint = <number>chr.charCodeAt(0);

        if (!isDigit(codepoint) &&
            // A F
            !(codepoint >= 0x41 && codepoint <= 0x46) &&
            // a f
            !(codepoint >= 0x61 && codepoint <= 0x66)) {

            return false;
        }
    }

    return true;
}
*/
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

export { colorFontTech, fontFeaturesTech, fontFormat, isAngle, isAtKeyword, isColor, isColorspace, isDigit, isDimension, isFlex, isFrequency, isFunction, isHash, isHexColor, isHueInterpolationMethod, isIdent, isIdentCodepoint, isIdentStart, isLength, isNewLine, isNonPrintable, isNumber, isPercentage, isPolarColorspace, isPseudo, isRectangularOrthogonalColorspace, isResolution, isTime, isWhiteSpace, mathFuncs, mediaTypes, mozExtensions, parseDimension, pseudoElements, transformFunctions, webkitExtensions, webkitPseudoAliasMap };
