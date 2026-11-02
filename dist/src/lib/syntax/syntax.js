/* 
	CSS parser, minifier and validator for node and the browser

	Author(s): Thierry Bela
	Version: 2.0.0-alpha.1
	License: MIT
 */
import { TokenField } from '../ast/arena.js';
import { isOkLabClose } from './color/utils/distance.js';
import { EnumToken, ColorType } from '../ast/types.js';
import { walkValues, WalkerOptionEnum } from '../ast/walk.js';
import { toDegrees } from '../parser/utils/angle.js';
import { memoize } from '../parser/utils/cache.js';
import { equalsIgnoreCase } from '../parser/utils/text.js';
import { trimArray } from '../validation/match.js';
import { splitTokenList } from '../validation/utils/list.js';
import { getColorSpace } from './color/utils/colorspace.js';
import { getColorComponents } from './color/utils/components.js';
import { anglePrecision, nonStandardColors, systemColors, deprecatedSystemColors, COLORS_NAMES, colorsFunc, colorFuncColorSpace, colorPrecision, epsilon } from './constants.js';
import { getSyntaxConfig } from '../validation/config.js';

// https://www.w3.org/TR/CSS21/syndata.html#syntax
// https://www.w3.org/TR/2021/CRD-css-syntax-3-20211224/#typedef-ident-token
// '\\'
const REVERSE_SOLIDUS = 0x5c;
const flexUnits = ["fr"];
const frequencyUnits = ["Hz", "kHz"];
const timeUnits = ["ms", "s"];
const angleUnits = ["rad", "turn", "deg", "grad"];
const resolutionUnits = ["dpi", "dpcm", "dppx", "x"];
const dimensionUnits = [
    "Q",
    "cap",
    "ch",
    "cm",
    "cqb",
    "cqh",
    "cqi",
    "cqmax",
    "cqmin",
    "cqw",
    "dvb",
    "dvh",
    "dvi",
    "dvmax",
    "dvmin",
    "dvw",
    "em",
    "ex",
    "ic",
    "in",
    "lh",
    "lvb",
    "lvh",
    "lvi",
    "lvmax",
    "lvw",
    "mm",
    "pc",
    "pt",
    "px",
    "rem",
    "rlh",
    "svb",
    "svh",
    "svi",
    "svmin",
    "svw",
    "vb",
    "vh",
    "vi",
    "vmax",
    "vmin",
    "vw",
];
// https://developer.mozilla.org/en-US/docs/Web/CSS/WebKit_Extensions
// https://developer.mozilla.org/en-US/docs/Web/CSS/Mozilla_Extensions
const pseudoAliasMap = {
    "-moz-center": "center",
    "-webkit-center": "center",
    "-ms-grid-columns": "grid-template-columns",
    "-ms-grid-rows": "grid-template-rows",
    "-ms-grid-row": "grid-row-start",
    "-ms-grid-column": "grid-column-start",
    "-ms-grid-row-align": "align-self",
    "-ms-grid-row-span": "grid-row-end",
    "-ms-grid-column-span": "grid-column-end",
    "-ms-grid-column-align": "justify-self",
    ":-ms-input-placeholder": "::placeholder",
    "::-ms-input-placeholder": "::placeholder",
    ":-moz-any()": ":is",
    "-moz-user-modify": "user-modify",
    "-webkit-match-parent": "match-parent",
    "-moz-background-clip": "background-clip",
    "-moz-background-origin": "background-origin",
    "-ms-input-placeholder": "placeholder",
    ":-webkit-autofill": ":autofill",
    ":-webkit-any()": ":is",
    "::-webkit-input-placeholder": "::placeholder",
    "::-webkit-file-upload-button": "::file-selector-button",
    "::-moz-placeholder": "::placeholder",
    ":-webkit-any-link": ":any-link",
    "-webkit-border-after": "border-block-end",
    "-webkit-border-after-color": "border-block-end-color",
    "-webkit-border-after-style": "border-block-end-style",
    "-webkit-border-after-width": "border-block-end-width",
    "-webkit-border-before": "border-block-start",
    "-webkit-border-before-color": "border-block-start-color",
    "-webkit-border-before-style": "border-block-start-style",
    "-webkit-border-before-width": "border-block-start-width",
    "-webkit-border-end": "border-inline-end",
    "-webkit-border-end-color": "border-inline-end-color",
    "-webkit-border-end-style": "border-inline-end-style",
    "-webkit-border-end-width": "border-inline-end-width",
    "-webkit-border-start": "border-inline-start",
    "-webkit-border-start-color": "border-inline-start-color",
    "-webkit-border-start-style": "border-inline-start-style",
    "-webkit-border-start-width": "border-inline-start-width",
    "-webkit-box-align": "align-items",
    "-webkit-box-direction": "flex-direction",
    "-webkit-box-flex": "flex-grow",
    "-webkit-box-lines": "flex-flow",
    "-webkit-box-ordinal-group": "order",
    "-webkit-box-orient": "flex-direction",
    "-webkit-box-pack": "justify-content",
    "-webkit-column-break-after": "break-after",
    "-webkit-column-break-before": "break-before",
    "-webkit-column-break-inside": "break-inside",
    "-webkit-font-feature-settings": "font-feature-settings",
    "-webkit-hyphenate-character": "hyphenate-character",
    "-webkit-initial-letter": "initial-letter",
    "-webkit-margin-end": "margin-block-end",
    "-webkit-margin-start": "margin-block-start",
    "-webkit-padding-after": "padding-block-end",
    "-webkit-padding-before": "padding-block-start",
    "-webkit-padding-end": "padding-inline-end",
    "-webkit-padding-start": "padding-inline-start",
    "-webkit-min-device-pixel-ratio": "min-resolution",
    "-webkit-max-device-pixel-ratio": "max-resolution",
    "-webkit-font-smoothing": "font-smooth",
    "-webkit-line-clamp": "line-clamp",
    ":-webkit-autofill-strong-password": ":autofill",
    ":-webkit-full-page-media": ":fullscreen",
    ":-webkit-full-screen": ":fullscreen",
    ":-webkit-full-screen-ancestor": ":fullscreen",
    ":-webkit-full-screen-document": ":fullscreen",
    ":-webkit-full-screen-controls-hidden": ":fullscreen",
    "-moz-background-inline-policy": "box-decoration-break",
    "-moz-background-size": "background-size",
    "-moz-border-end": "border-inline-end",
    "-moz-border-end-color": "border-inline-end-color",
    "-moz-border-end-style": "border-inline-end-style",
    "-moz-border-end-width": "border-inline-end-width",
    "-moz-border-image": "border-inline-end-width",
    "-moz-border-start": "border-inline-start",
    "-moz-border-start-color": "border-inline-start-color",
    "-moz-border-start-style": "border-inline-start-style",
    "-moz-border-start-width": "border-inline-start-width",
    "-moz-column-count": "column-count",
    "-moz-column-fill": "column-fill",
    "-moz-column-gap": "column-gap",
    "-moz-column-width": "column-width",
    "-moz-column-rule": "column-rule",
    "-moz-column-rule-width": "column-rule-width",
    "-moz-column-rule-style": "column-rule-style",
    "-moz-column-rule-color": "column-rule-color",
    "-moz-margin-end": "margin-inline-end",
    "-moz-margin-start": "margin-inline-start",
    "-moz-opacity": "opacity",
    "-moz-outline": "outline",
    "-moz-outline-color": "outline-color",
    "-moz-outline-offset": "outline-offset",
    "-moz-outline-style": "outline-style",
    "-moz-outline-width": "outline-width",
    "-moz-padding-end": "padding-inline-end",
    "-moz-padding-start": "padding-inline-start",
    "-moz-tab-size": "tab-size",
    "-moz-text-align-last": "text-align-last",
    "-moz-text-decoration-color": "text-decoration-color",
    "-moz-text-decoration-line": "text-decoration-line",
    "-moz-text-decoration-style": "text-decoration-style",
    "-moz-transition": "transition",
    "-moz-transition-delay": "transition-delay",
    "-moz-transition-duration": "transition-duration",
    "-moz-transition-property": "transition-property",
    "-moz-transition-timing-function": "transition-timing-function",
    "-moz-user-select": "user-select",
    "-moz-initial": "initial",
    "-moz-linear-gradient()": "linear-gradient",
    "-moz-radial-gradient()": "radial-gradient",
    "-moz-element()": "element",
    "-moz-crisp-edges": "crisp-edges",
    "-moz-calc()": "calc",
    "-moz-min-content": "min-content",
    "-moz-fit-content": "fit-content",
    "-moz-max-content": "max-content",
    "-moz-available": "stretch",
    ":-moz-any-link": ":any-link",
    ":-moz-full-screen": ":fullscreen",
    ":-moz-full-screen-ancestor": ":fullscreen",
    ":-moz-placeholder": ":placeholder-shown",
    ":-moz-read-only": ":read-only",
    ":-moz-read-write": ":read-write",
    ":-moz-submit-invalid": ":invalid",
    ":-moz-ui-invalid": ":user-invalid",
    ":-moz-ui-valid": ":user-valid",
    "::-moz-selection": "::selection",
};
// https://developer.mozilla.org/en-US/docs/Web/CSS/WebKit_Extensions
// https://developer.mozilla.org/en-US/docs/Web/CSS/::-webkit-scrollbar
// export const webkitExtensions = new Set([
//     "-webkit-app-region",
//     "-webkit-border-horizontal-spacing",
//     "-webkit-border-vertical-spacing",
//     "-webkit-box-reflect",
//     "-webkit-column-axis",
//     "-webkit-column-progression",
//     "-webkit-cursor-visibility",
//     "-webkit-font-smoothing",
//     "-webkit-hyphenate-limit-after",
//     "-webkit-hyphenate-limit-before",
//     "-webkit-hyphenate-limit-lines",
//     "-webkit-line-align",
//     "-webkit-line-box-contain",
//     "-webkit-line-clamp",
//     "-webkit-line-grid",
//     "-webkit-line-snap",
//     "-webkit-locale",
//     "-webkit-logical-height",
//     "-webkit-logical-width",
//     "-webkit-margin-after",
//     "-webkit-margin-before",
//     "-webkit-mask-box-image-outset",
//     "-webkit-mask-box-image-repeat",
//     "-webkit-mask-box-image-slice",
//     "-webkit-mask-box-image-source",
//     "-webkit-mask-box-image-width",
//     "-webkit-mask-box-image",
//     "-webkit-mask-composite",
//     "-webkit-mask-position-x",
//     "-webkit-mask-position-y",
//     "-webkit-mask-repeat-x",
//     "-webkit-mask-repeat-y",
//     "-webkit-mask-source-type",
//     "-webkit-max-logical-height",
//     "-webkit-max-logical-width",
//     "-webkit-min-logical-height",
//     "-webkit-min-logical-width",
//     "-webkit-nbsp-mode",
//     "-webkit-match-parent",
//     "-webkit-perspective-origin-x",
//     "-webkit-perspective-origin-y",
//     "-webkit-rtl-ordering",
//     "-webkit-tap-highlight-color",
//     "-webkit-text-decoration-skip",
//     "-webkit-text-decorations-in-effect",
//     "-webkit-text-fill-color",
//     "-webkit-text-security",
//     "-webkit-text-stroke-color",
//     "-webkit-text-stroke-width",
//     "-webkit-text-stroke",
//     "-webkit-text-zoom",
//     "-webkit-touch-callout",
//     "-webkit-transform-origin-x",
//     "-webkit-transform-origin-y",
//     "-webkit-transform-origin-z",
//     "-webkit-user-drag",
//     "-webkit-user-modify",
//     "-webkit-border-after",
//     "-webkit-border-after-color",
//     "-webkit-border-after-style",
//     "-webkit-border-after-width",
//     "-webkit-border-before",
//     "-webkit-border-before-color",
//     "-webkit-border-before-style",
//     "-webkit-border-before-width",
//     "-webkit-border-end",
//     "-webkit-border-end-color",
//     "-webkit-border-end-style",
//     "-webkit-border-end-width",
//     "-webkit-border-start",
//     "-webkit-border-start-color",
//     "-webkit-border-start-style",
//     "-webkit-border-start-width",
//     "-webkit-box-align",
//     "-webkit-box-direction",
//     "-webkit-box-flex-group",
//     "-webkit-box-flex",
//     "-webkit-box-lines",
//     "-webkit-box-ordinal-group",
//     "-webkit-box-orient",
//     "-webkit-box-pack",
//     "-webkit-column-break-after",
//     "-webkit-column-break-before",
//     "-webkit-column-break-inside",
//     "-webkit-font-feature-settings",
//     "-webkit-hyphenate-character",
//     "-webkit-initial-letter",
//     "-webkit-margin-end",
//     "-webkit-margin-start",
//     "-webkit-padding-after",
//     "-webkit-padding-before",
//     "-webkit-padding-end",
//     "-webkit-padding-start",
//     "-webkit-fill-available",
//     ":-webkit-animating-full-screen-transition",
//     ":-webkit-any",
//     ":-webkit-any-link",
//     ":-webkit-autofill",
//     ":-webkit-autofill-strong-password",
//     ":-webkit-drag",
//     ":-webkit-full-page-media",
//     ":-webkit-full-screen*",
//     ":-webkit-full-screen-ancestor",
//     ":-webkit-full-screen-document",
//     ":-webkit-full-screen-controls-hidden",
//     "::-webkit-file-upload-button*",
//     "::-webkit-inner-spin-button",
//     "::-webkit-input-placeholder",
//     "::-webkit-meter-bar",
//     "::-webkit-meter-even-less-good-value",
//     "::-webkit-meter-inner-element",
//     "::-webkit-meter-optimum-value",
//     "::-webkit-meter-suboptimum-value",
//     "::-webkit-progress-bar",
//     "::-webkit-progress-inner-element",
//     "::-webkit-progress-value",
//     "::-webkit-search-cancel-button",
//     "::-webkit-search-results-button",
//     "::-webkit-slider-runnable-track",
//     "::-webkit-slider-thumb",
//     "-webkit-animation",
//     "-webkit-device-pixel-ratio",
//     "-webkit-transform-2d",
//     "-webkit-transform-3d",
//     "-webkit-transition",
//     "::-webkit-scrollbar",
//     "::-webkit-scrollbar-button",
//     "::-webkit-scrollbar",
//     "::-webkit-scrollbar-thumb",
//     "::-webkit-scrollbar-track",
//     "::-webkit-scrollbar-track-piece",
//     "::-webkit-scrollbar:vertical",
//     "::-webkit-scrollbar-corner ",
//     "::-webkit-resizer",
//     ":vertical",
//     ":horizontal",
// ]);
// https://developer.mozilla.org/en-US/docs/Web/CSS/Mozilla_Extensions
// export const mozExtensions = new Set([
//     "-moz-box-align",
//     "-moz-box-direction",
//     "-moz-box-flex",
//     "-moz-box-ordinal-group",
//     "-moz-box-orient",
//     "-moz-box-pack",
//     "-moz-float-edge",
//     "-moz-force-broken-image-icon",
//     "-moz-image-region",
//     "-moz-orient",
//     "-moz-osx-font-smoothing",
//     "-moz-user-focus",
//     "-moz-user-input",
//     "-moz-user-modify",
//     "-moz-animation",
//     "-moz-animation-delay",
//     "-moz-animation-direction",
//     "-moz-animation-duration",
//     "-moz-animation-fill-mode",
//     "-moz-animation-iteration-count",
//     "-moz-animation-name",
//     "-moz-animation-play-state",
//     "-moz-animation-timing-function",
//     "-moz-appearance",
//     "-moz-backface-visibility",
//     "-moz-background-clip",
//     "-moz-background-origin",
//     "-moz-background-inline-policy",
//     "-moz-background-size",
//     "-moz-border-end",
//     "-moz-border-end-color",
//     "-moz-border-end-style",
//     "-moz-border-end-width",
//     "-moz-border-image",
//     "-moz-border-start",
//     "-moz-border-start-color",
//     "-moz-border-start-style",
//     "-moz-border-start-width",
//     "-moz-box-sizing",
//     "clip-path",
//     "-moz-column-count",
//     "-moz-column-fill",
//     "-moz-column-gap",
//     "-moz-column-width",
//     "-moz-column-rule",
//     "-moz-column-rule-width",
//     "-moz-column-rule-style",
//     "-moz-column-rule-color",
//     "filter",
//     "-moz-font-feature-settings",
//     "-moz-font-language-override",
//     "-moz-hyphens",
//     "-moz-margin-end",
//     "-moz-margin-start",
//     "mask",
//     "-moz-opacity",
//     "-moz-outline",
//     "-moz-outline-color",
//     "-moz-outline-offset",
//     "-moz-outline-style",
//     "-moz-outline-width",
//     "-moz-padding-end",
//     "-moz-padding-start",
//     "-moz-perspective",
//     "-moz-perspective-origin",
//     "pointer-events",
//     "-moz-tab-size",
//     "-moz-text-align-last",
//     "-moz-text-decoration-color",
//     "-moz-text-decoration-line",
//     "-moz-text-decoration-style",
//     "-moz-text-size-adjust",
//     "-moz-transform",
//     "-moz-transform-origin",
//     "-moz-transform-style",
//     "-moz-transition",
//     "-moz-transition-delay",
//     "-moz-transition-duration",
//     "-moz-transition-property",
//     "-moz-transition-timing-function",
//     "-moz-user-select",
//     "-moz-initial",
//     "-moz-appearance",
//     "-moz-linear-gradient",
//     "-moz-radial-gradient",
//     "-moz-element",
//     "-moz-image-rect",
//     "::-moz-anonymous-block",
//     "::-moz-anonymous-positioned-block",
//     ":-moz-any",
//     ":-moz-any-link",
//     ":-moz-broken",
//     "::-moz-canvas",
//     "::-moz-color-swatch",
//     "::-moz-cell-content",
//     ":-moz-drag-over",
//     ":-moz-first-node",
//     "::-moz-focus-inner",
//     "::-moz-focus-outer",
//     ":-moz-full-screen",
//     ":-moz-full-screen-ancestor",
//     ":-moz-handler-blocked",
//     ":-moz-handler-crashed",
//     ":-moz-handler-disabled",
//     "::-moz-inline-table",
//     ":-moz-last-node",
//     "::-moz-list-bullet",
//     "::-moz-list-number",
//     ":-moz-loading",
//     ":-moz-locale-dir",
//     ":-moz-locale-dir",
//     ":-moz-lwtheme",
//     ":-moz-lwtheme-brighttext",
//     ":-moz-lwtheme-darktext",
//     "::-moz-meter-bar",
//     ":-moz-native-anonymous",
//     ":-moz-only-whitespace",
//     "::-moz-pagebreak",
//     "::-moz-pagecontent",
//     ":-moz-placeholder",
//     "::-moz-placeholder",
//     "::-moz-progress-bar",
//     "::-moz-range-progress",
//     "::-moz-range-thumb",
//     "::-moz-range-track",
//     ":-moz-read-only",
//     ":-moz-read-write",
//     "::-moz-scrolled-canvas",
//     "::-moz-scrolled-content",
//     "::-moz-selection",
//     ":-moz-submit-invalid",
//     ":-moz-suppressed",
//     "::-moz-svg-foreign-content",
//     "::-moz-table",
//     "::-moz-table-cell",
//     "::-moz-table-column",
//     "::-moz-table-column-group",
//     "::-moz-table-outer",
//     "::-moz-table-row",
//     "::-moz-table-row-group",
//     ":-moz-ui-invalid",
//     ":-moz-ui-valid",
//     ":-moz-user-disabled",
//     "::-moz-viewport",
//     "::-moz-viewport-scroll",
//     ":-moz-window-inactive",
//     "-moz-device-pixel-ratio",
//     "-moz-os-version",
//     "-moz-touch-enabled",
//     "-moz-windows-glass",
//     "-moz-alt-content",
// ]);
// renamed standard properties
const renamedStandardProperties = new Map([["color-adjust", "print-color-adjust"]]);
/**
 * true if the unit is a length unit
 * @param unit
 */
function isLengthUnit(unit) {
    return dimensionUnits.includes(unit.toLowerCase());
}
/**
 * true if the unit is a resolution unit
 * @param unit
 */
function isResolutionUnit(unit) {
    return resolutionUnits.includes(unit.toLowerCase());
}
/**
 * true if the unit is an angle unit
 * @param unit
 */
function isAngleUnit(unit) {
    return angleUnits.includes(unit.toLowerCase());
}
/**
 * true if the unit is a time unit
 * @param unit
 */
function isTimeUnit(unit) {
    return timeUnits.includes(unit.toLowerCase());
}
/**
 * true if the unit is a frequency unit
 * @param unit
 */
function isFrequencyUnit(unit) {
    return frequencyUnits.includes(unit.toLowerCase());
}
/**
 * true if the unit is a flex unit
 * @param unit
 */
function isFlexUnit(unit) {
    return "fr" == unit.toLowerCase();
}
function isLength(arena, dimension) {
    return arena.unit[dimension] != 0 && isLengthUnit(arena.strings[arena.unit[dimension]]);
}
/**
 * Reduce color stops
 * @param arena
 * @param stops
 * @returns
 */
function reduceColorStops(arena, stops) {
    const parts = splitTokenList(arena, stops);
    const n = parts.length == 1 ? 1 : parts.length - 1;
    let j;
    let i;
    let k = -1;
    let updated = false;
    for (i = 0; i < parts.length; i++) {
        k++;
        if (parts[i].length != 3) {
            continue;
        }
        if (i > 0 && isOkLabClose(arena, parts[i - 1][0], parts[i][0])) {
            if (parts[i - 1].length == 1) {
                parts[i - 1].push(arena.createToken(EnumToken.WhitespaceTokenType), arena.createToken(EnumToken.PercentageTokenType, ((k - 1) * 100) / n));
            }
            for (let m = 1; m < parts[i].length; m++) {
                parts[i - 1].push(parts[i][m]);
            }
            parts.splice(i--, 1);
            updated = true;
            continue;
        }
        for (j = 0; j < parts[i].length; j++) {
            const typ = arena.dataTypes[parts[i][j]];
            if ((typ == EnumToken.LengthTokenType && 0 == arena.numericValue[parts[i][j]]) ||
                typ == EnumToken.NumberTokenType ||
                typ == EnumToken.PercentageTokenType) {
                if (arena.numericValue[parts[i][j]] === (k * 100) / n) {
                    parts[i].length = j;
                    trimArray(arena, parts[i]);
                    updated = true;
                    break;
                }
            }
        }
    }
    if (updated) {
        stops.length = 0;
        for (j = 0; j < parts.length; j++) {
            if (stops.length > 0) {
                stops.push(arena.createToken(EnumToken.CommaTokenType));
            }
            for (let m = 0; m < parts[j].length; m++) {
                stops.push(parts[j][m]);
            }
        }
    }
    return stops;
}
/**
 * Reduce background-position values.
 * @param arena
 * @param positions
 * @param position
 */
function reducegradientBackgroundPosition(arena, positions, position) {
    switch (position) {
        case "50%":
        case "50% 50%":
        case "center":
        case "center center":
            positions.length = 0;
            break;
        case "0% 50%":
        case "0 50%":
        case "left":
        case "left center":
        case "center left":
            positions.length = 0;
            positions.push(arena.createToken(EnumToken.PercentageTokenType, 0));
            break;
        case "50% 0%":
        case "50% 0":
        case "top center":
        case "center top":
            positions.length = 0;
            positions.push(arena.createToken(EnumToken.IdenTokenType, "top"));
            break;
        case "bottom center":
        case "center bottom":
        case "bottom":
        case "50% 100%":
            positions.length = 0;
            positions.push(arena.createToken(EnumToken.IdenTokenType, "bottom"));
            break;
        case "right center":
        case "center right":
        case "100% 50%":
        case "right":
            positions.length = 0;
            positions.push(arena.createToken(EnumToken.PercentageTokenType, 100));
            break;
        case "bottom left":
        case "left bottom":
            positions.length = 0;
            positions.push(arena.createToken(EnumToken.PercentageTokenType, 0), arena.createToken(EnumToken.WhitespaceTokenType), arena.createToken(EnumToken.PercentageTokenType, 100));
            break;
        case "bottom right":
        case "right bottom":
            positions.length = 0;
            positions.push(arena.createToken(EnumToken.PercentageTokenType, 100), arena.createToken(EnumToken.WhitespaceTokenType), arena.createToken(EnumToken.PercentageTokenType, 100));
            break;
        case "top left":
        case "left top":
            positions.length = 0;
            positions.push(arena.createToken(EnumToken.PercentageTokenType, 0), arena.createToken(EnumToken.WhitespaceTokenType), arena.createToken(EnumToken.PercentageTokenType, 0));
            break;
        case "top right":
        case "right top":
            positions.length = 0;
            positions.push(arena.createToken(EnumToken.PercentageTokenType, 100), arena.createToken(EnumToken.WhitespaceTokenType), arena.createToken(EnumToken.PercentageTokenType, 0));
            break;
    }
}
/**
 * Reduce conic-gradient color stops
 * @param arena
 * @param stops
 * @returns
 */
function reduceConicColorStops(arena, stops) {
    const parts = splitTokenList(arena, stops);
    const n = parts.length == 1 ? 1 : parts.length - 1;
    let j;
    let i;
    let k = -1;
    let updated = false;
    for (i = 0; i < parts.length; i++) {
        k++;
        if (parts[i].length != 3) {
            continue;
        }
        if (i > 0 && isOkLabClose(arena, parts[i - 1][0], parts[i][0])) {
            if (parts[i - 1].length == 1) {
                parts[i - 1].push(arena.createToken(EnumToken.WhitespaceTokenType), arena.createToken(EnumToken.AngleTokenType, ((k - 1) * 100) / n, "deg"));
            }
            for (let m = 1; m < parts[i].length; m++) {
                parts[i - 1].push(parts[i][m]);
            }
            parts.splice(i--, 1);
            updated = true;
            continue;
        }
        for (j = 0; j < parts[i].length; j++) {
            const typ = arena.dataTypes[parts[i][j]];
            if ((typ == EnumToken.NumberTokenType && 0 == arena.numericValue[parts[i][j]]) ||
                typ == EnumToken.AngleTokenType) {
                if (arena.numericValue[toDegrees(arena, parts[i][j])] === (k * 360) / n) {
                    parts[i].length = j;
                    trimArray(arena, parts[i]);
                    updated = true;
                    break;
                }
            }
        }
    }
    if (updated) {
        stops.length = 0;
        for (j = 0; j < parts.length; j++) {
            if (stops.length > 0) {
                stops.push(arena.createToken(EnumToken.CommaTokenType));
            }
            for (const token of parts[j]) {
                stops.push(token);
            }
        }
    }
    return stops;
}
/**
 * is rectangular orthogonal colorspace
 * @param arena
 * @param token
 * @returns
 */
function isRectangularOrthogonalColorspace(arena, token) {
    return (arena.dataTypes[token] === EnumToken.IdenTokenType &&
        colorFuncColorSpace.some((t) => equalsIgnoreCase(t, arena.strings[arena.stringValue[token]])));
}
/**
 * Is polar colorspace
 * @param arena
 * @param token
 * @returns
 */
function isPolarColorspace(arena, token) {
    return (arena.dataTypes[token] === EnumToken.IdenTokenType &&
        ["hsl", "hwb", "lch", "oklch"].some((t) => equalsIgnoreCase(t, arena.strings[arena.stringValue[token]])));
}
/**
 * Is ident color
 * @param arena
 * @param token
 * @returns
 */
function isIdentColor(arena, token) {
    return (arena.dataTypes[token] == EnumToken.ColorTokenType &&
        arena.colorType[token] != ColorType.NONE &&
        [ColorType.SYS, ColorType.DPSYS, ColorType.LIT].includes(arena.colorType[token]) &&
        isIdent(arena.strings[arena.stringValue[token]]));
}
/**
 * color function arguments without whitespace and comments
 * @param arena
 * @param token
 * @param types accepted token types
 */
function filterChildren(arena, token, types) {
    const children = [];
    for (let t = arena.firstToken[token]; t != 0; t = arena.nextSibling[t]) {
        if (types.includes(arena.dataTypes[t])) {
            children.push(t);
        }
    }
    return children;
}
const colorKeywords = [
    "in",
    "hue",
    "from",
    "alpha",
    "none",
    "shorter",
    "longer",
    "increasing",
    "decreasing",
];
function isColor(arena, token, errors) {
    const typ = arena.dataTypes[token];
    if (typ == EnumToken.WildCardFunctionTokenType) {
        return true;
    }
    if (typ == EnumToken.ColorTokenType) {
        if (arena.colorType[token] != ColorType.NONE && arena.firstToken[token] == 0) {
            return true;
        }
    }
    if (typ == EnumToken.IdenTokenType) {
        const val = arena.strings[arena.stringValue[token]].toLowerCase();
        if (systemColors.has(val) || deprecatedSystemColors.has(val) || nonStandardColors.has(val)) {
            return true;
        }
        // named color
        return val in COLORS_NAMES || "currentcolor" === val || "transparent" === val;
    }
    if (typ === EnumToken.FunctionTokenType || typ === EnumToken.ColorTokenType) {
        if (arena.firstToken[token] != 0) {
            const name = arena.strings[arena.stringValue[token]];
            if (name === "light-dark") {
                const children = filterChildren(arena, token, [
                    EnumToken.IdenTokenType,
                    EnumToken.NumberTokenType,
                    EnumToken.LiteralTokenType,
                    EnumToken.ColorTokenType,
                    EnumToken.FunctionTokenType,
                    EnumToken.PercentageTokenType,
                    EnumToken.WildCardFunctionTokenType,
                ]);
                if (children.length != 2) {
                    errors?.push({
                        message: "light-dark function must have 2 arguments",
                        node: token,
                        action: "drop",
                    });
                    return false;
                }
                if (isColor(arena, children[0]) && isColor(arena, children[1])) {
                    return true;
                }
            }
            // adding numbers and percentages is disallowed
            // https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/color_value/lch#defining_relative_color_output_channel_components:~:text=Adding%20a%20%3Cpercentage%3E%20to%20a%20%3Cnumber%3E%2C%20for%20example%2C%20doesn%27t%20work
            const components = getColorComponents(arena, token);
            if (components !== null) {
                const colorSpace = getColorSpace(arena, token)?.split?.("");
                if (colorSpace != null) {
                    for (const value of components) {
                        if (arena.dataTypes[value] === EnumToken.IdenTokenType) {
                            const val = arena.strings[arena.stringValue[value]].toLowerCase();
                            if (
                            // @ts-expect-error
                            typeof Math[val.toUpperCase()] !== "number" &&
                                !colorKeywords.includes(val) &&
                                !colorsFunc.includes(val) &&
                                !colorSpace.includes(val) &&
                                !colorFuncColorSpace.includes(val)) {
                                errors?.push({
                                    action: "drop",
                                    message: `Unexpected constant '${val}'`,
                                    node: value,
                                });
                                return false;
                            }
                        }
                        else if (arena.dataTypes[value] === EnumToken.MathFunctionTokenType &&
                            equalsIgnoreCase("calc", arena.strings[arena.stringValue[value]])) {
                            let val;
                            for (const v of walkValues(arena, arena.tokens(value))) {
                                if (arena.dataTypes[v.value] === EnumToken.IdenTokenType) {
                                    val = arena.strings[arena.stringValue[v.value]].toLowerCase();
                                    if (
                                    // @ts-expect-error
                                    typeof Math[val.toUpperCase()] !== "number" &&
                                        !colorKeywords.includes(val) &&
                                        !colorsFunc.includes(val) &&
                                        !colorSpace.includes(val) &&
                                        !colorFuncColorSpace.includes(val)) {
                                        errors?.push({
                                            action: "drop",
                                            message: `Unexpected constant '${val}'`,
                                            node: v.value,
                                        });
                                        return false;
                                    }
                                }
                            }
                        }
                    }
                }
            }
            for (const { value, parent } of walkValues(arena, arena.tokens(token), token, (value) => arena.dataTypes[value] === EnumToken.WildCardFunctionTokenType
                ? WalkerOptionEnum.Ignore | WalkerOptionEnum.IgnoreChildren
                : null)) {
                let k = 0;
                let l;
                let tk = 0;
                let tl = 0;
                if (arena.dataTypes[value] === EnumToken.BinaryExpressionTokenType) {
                    tk = arena.field(value, TokenField.L);
                    tl = arena.field(value, TokenField.R);
                }
                else if (parent != null &&
                    parent != token &&
                    arena.dataTypes[parent] === EnumToken.MathFunctionTokenType &&
                    arena.strings[arena.stringValue[parent]] === "calc") {
                    const children = arena.tokens(parent);
                    l = k + 1;
                    while (l + 1 < children.length) {
                        const tk = arena.dataTypes[children[l]];
                        if (tk === EnumToken.WhitespaceTokenType ||
                            tk === EnumToken.CommentTokenType ||
                            tk === EnumToken.Add ||
                            tk === EnumToken.Sub ||
                            tk === EnumToken.Div ||
                            tk === EnumToken.Mul) {
                            l++;
                            continue;
                        }
                        break;
                    }
                    tk = children[k];
                    tl = children[l];
                }
                if (tk != 0 && tl != 0 && tk != null && tl != null) {
                    if ((arena.dataTypes[tk] === EnumToken.PercentageTokenType ||
                        arena.dataTypes[tl] === EnumToken.PercentageTokenType) &&
                        arena.dataTypes[tk] !== arena.dataTypes[tl]) {
                        errors?.push({
                            action: "drop",
                            message: "adding percentage and number is not allowed",
                            node: token,
                        });
                        return false;
                    }
                }
            }
            if (name == "color") {
                const children = filterChildren(arena, token, [
                    EnumToken.DashedIdenTokenType,
                    EnumToken.IdenTokenType,
                    EnumToken.NumberTokenType,
                    EnumToken.LiteralTokenType,
                    EnumToken.ColorTokenType,
                    EnumToken.FunctionTokenType,
                    EnumToken.MathFunctionTokenType,
                    EnumToken.PercentageTokenType,
                ]);
                const isRelative = arena.dataTypes[children[0]] == EnumToken.IdenTokenType &&
                    arena.strings[arena.stringValue[children[0]]] == "from";
                let offset = 0;
                if (isRelative) {
                    offset = 2;
                }
                if (offset < children.length && arena.dataTypes[children[offset]] == EnumToken.DashedIdenTokenType) {
                    if (children.length <= offset + 1) {
                        errors?.push({
                            action: "drop",
                            message: `Invalid color`,
                            node: token,
                        });
                        return false;
                    }
                    for (let i = offset + 1; i < children.length; i++) {
                        const childType = arena.dataTypes[children[i]];
                        if (childType == EnumToken.NumberTokenType ||
                            childType == EnumToken.LiteralTokenType ||
                            childType == EnumToken.ColorTokenType ||
                            childType == EnumToken.FunctionTokenType ||
                            childType == EnumToken.MathFunctionTokenType ||
                            childType == EnumToken.PercentageTokenType ||
                            isColor(arena, children[i]) ||
                            (childType == EnumToken.IdenTokenType &&
                                equalsIgnoreCase("none", arena.strings[arena.stringValue[children[i]]]))) {
                            continue;
                        }
                        return false;
                    }
                    return true;
                }
                if (children.length == 4 || (isRelative && children.length == 6)) {
                    return true;
                }
                return true;
            }
            else if (name == "color-mix") {
                const children = [[]];
                for (let t = arena.firstToken[token]; t != 0; t = arena.nextSibling[t]) {
                    if (arena.dataTypes[t] == EnumToken.CommaTokenType) {
                        children.push([]);
                    }
                    else if (![EnumToken.WhitespaceTokenType, EnumToken.CommentTokenType].includes(arena.dataTypes[t])) {
                        children[children.length - 1].push(t);
                    }
                }
                let j = 0;
                let k = 0;
                if (children[j].length > 0 &&
                    arena.dataTypes[children[j][0]] === EnumToken.IdenTokenType &&
                    equalsIgnoreCase("in", arena.strings[arena.stringValue[children[j][k]]])) {
                    k++;
                    if (k < children[j].length && arena.dataTypes[children[j][k]] === EnumToken.IdenTokenType) {
                        if (!isRectangularOrthogonalColorspace(arena, children[j][k])) {
                            if (isPolarColorspace(arena, children[j][k++])) {
                                if (k == children[j].length) ;
                                else if (arena.dataTypes[children[j][k]] !== EnumToken.IdenTokenType) {
                                    return false;
                                }
                                else if (equalsIgnoreCase("hue", arena.strings[arena.stringValue[children[j][k]]])) {
                                    k++;
                                }
                                else {
                                    switch (arena.strings[arena.stringValue[children[j][k]]]) {
                                        case "increasing":
                                        case "decreasing":
                                        case "longer":
                                        case "shorter":
                                            k++;
                                            break;
                                        default:
                                            return false;
                                    }
                                    if (k >= children[j].length ||
                                        arena.dataTypes[children[j][k]] !== EnumToken.IdenTokenType ||
                                        !equalsIgnoreCase("hue", arena.strings[arena.stringValue[children[j][k]]])) {
                                        return false;
                                    }
                                    k++;
                                }
                            }
                        }
                        else {
                            k++;
                        }
                    }
                    j++;
                }
                return true;
            }
            return true;
        }
    }
    return false;
}
/**
 * parse a color token: set the color type of identifiers and color functions
 * @param arena
 * @param token
 */
function parseColor(arena, token) {
    const typ = arena.dataTypes[token];
    if (typ === EnumToken.IdenTokenType) {
        const val = arena.strings[arena.stringValue[token]].toLowerCase();
        if (nonStandardColors.has(val)) {
            arena.dataTypes[token] = EnumToken.ColorTokenType;
            arena.setColorType(token, ColorType.NON_STD);
            return token;
        }
        if (systemColors.has(val)) {
            arena.dataTypes[token] = EnumToken.ColorTokenType;
            arena.setColorType(token, ColorType.SYS);
            return token;
        }
        if (deprecatedSystemColors.has(val)) {
            arena.dataTypes[token] = EnumToken.ColorTokenType;
            arena.setColorType(token, ColorType.DPSYS);
            return token;
        }
        if (val in COLORS_NAMES || val === "currentcolor") {
            arena.dataTypes[token] = EnumToken.ColorTokenType;
            arena.setStr(token, val);
            arena.setColorType(token, ColorType.LIT);
            return token;
        }
    }
    if (typ === EnumToken.ColorTokenType) {
        const val = arena.strings[arena.stringValue[token]];
        if (arena.colorType[token] == ColorType.NONE && arena.stringValue[token] != 0) {
            // @ts-expect-error
            arena.setColorType(token, ColorType[val.replaceAll("-", "_").toUpperCase()] ?? 0);
        }
        if (arena.firstToken[token] != 0) {
            const tk = arena.findToken(token, (t) => arena.dataTypes[t] !== EnumToken.WhitespaceTokenType &&
                arena.dataTypes[t] !== EnumToken.CommentTokenType);
            if (tk != null &&
                arena.dataTypes[tk] === EnumToken.IdenTokenType &&
                arena.strings[arena.stringValue[tk]] === "from") {
                arena.setUnitString(token, "rel");
            }
            else if (val == "color-mix" && tk != null && arena.strings[arena.stringValue[tk]] == "in") {
                arena.setUnitString(token, "mix");
            }
            if (val == "color") {
                if (tk != null && EnumToken.DashedIdenTokenType == arena.dataTypes[tk]) {
                    arena.setColorType(token, ColorType.CUSTOM_COLOR);
                }
            }
        }
    }
    return token;
}
function isLetter(codepoint) {
    // lowercase
    return ((codepoint >= 0x61 && codepoint <= 0x7a) ||
        // uppercase
        (codepoint >= 0x41 && codepoint <= 0x5a));
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
const isIdent = memoize(function (name) {
    const j = name.length - 1;
    let i = 0;
    let codepoint = name.charCodeAt(0);
    // -
    if (codepoint == 0x2d) {
        const nextCodepoint = name.charCodeAt(1);
        if (Number.isNaN(nextCodepoint)) {
            return false;
        }
        // if (nextCodepoint == REVERSE_SOLIDUS) {
        //     return name.length > 2 && !isNewLine(name.charCodeAt(2) as number);
        // }
        if (isDigit(nextCodepoint)) {
            return false;
        }
        codepoint = nextCodepoint;
        i = 1;
    }
    if (codepoint !== 0x2d && !isIdentStart(codepoint)) {
        return false;
    }
    if (codepoint == REVERSE_SOLIDUS) {
        if (i + 1 > j) {
            return false;
        }
        codepoint = name.charCodeAt(i + 1);
        // if (!isIdentCodepoint(codepoint)) {
        //     return false;
        // }
        i += String.fromCodePoint(codepoint).length;
        // if (i < j) {
        //     codepoint = name.charCodeAt(i) as number;
        //     if (!isIdentCodepoint(codepoint)) {
        //         return false;
        //     }
        // }
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
        if (codepoint !== 0x2d && !isIdentCodepoint(codepoint)) {
            return false;
        }
    }
    return true;
});
function isNonPrintable(codepoint) {
    // null -> backspace
    return ((codepoint >= 0 && codepoint <= 0x8) ||
        // tab
        codepoint == 0xb ||
        // delete
        codepoint == 0x7f ||
        (codepoint >= 0xe && codepoint <= 0x1f));
}
// export function isURLToken(str: string): boolean {
//     let i: number = -1;
//     let c: number;
//
//     while (++i < str.length) {
//         c = str.charCodeAt(i) as number;
//
//         // single quote or double quote or start parenthesis or close parenthesis
//         if (isNonPrintable(c) || c == 0x27 || c == 0x22 || c == 0x28 || c == 0x29) {
//             return false;
//         }
//
//         // valid escape
//         if (c == REVERSE_SOLIDUS) {
//             i++;
//
//             if (i >= str.length) {
//                 return false;
//             }
//
//             c = str.charCodeAt(i) as number;
//
//             // c is not '\n' or '\r' or '\f'
//             if (c == 0x6e || c == 0x72 || c == 0x66) {
//                 return false;
//             }
//
//             continue;
//         }
//
//         // is white space
//         if (c == 0x20 || c == 0x09) {
//             break;
//         }
//     }
//
//     return i == str.length;
// }
function isPseudo(name) {
    return (name.charAt(0) == ":" &&
        ((name.endsWith("(") && isIdent(name.charAt(1) == ":" ? name.slice(2, -1) : name.slice(1, -1))) ||
            isIdent(name.charAt(1) == ":" ? name.slice(2) : name.slice(1))));
}
function isHash(name) {
    return name.charAt(0) == "#" && isIdentStart(name.charCodeAt(1));
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
    if (index < 0) {
        return null;
    }
    const unit = name.slice(index);
    const dimension = {
        typ: EnumToken.DimensionTokenType,
        val: +name.slice(0, index),
        // @ts-ignore
        unit: getSyntaxConfig().units.find((u) => equalsIgnoreCase(u, unit)) || unit.toLowerCase(),
    };
    if (Number.isNaN(dimension.val)) {
        return null;
    }
    if (isAngleUnit(dimension.unit)) {
        dimension.typ = EnumToken.AngleTokenType;
    }
    else if (isLengthUnit(dimension.unit)) {
        dimension.typ = EnumToken.LengthTokenType;
    }
    else if (isTimeUnit(dimension.unit)) {
        dimension.typ = EnumToken.TimeTokenType;
    }
    else if (isResolutionUnit(dimension.unit)) {
        dimension.typ = EnumToken.ResolutionTokenType;
    }
    else if (isFrequencyUnit(dimension.unit)) {
        dimension.typ = EnumToken.FrequencyTokenType;
    }
    else if (isFlexUnit(dimension.unit)) {
        dimension.typ = EnumToken.FlexTokenType;
    }
    return dimension;
}
// export function isHexColor(name: string): boolean {
//     if (name.charAt(0) != "#" || ![4, 5, 7, 9].includes(name.length)) {
//         return false;
//     }
//
//     for (let chr of name.slice(1)) {
//         let codepoint: number = chr.charCodeAt(0) as number;
//
//         if (
//             !isDigit(codepoint) &&
//             // A-F
//             !(codepoint >= 0x41 && codepoint <= 0x46) &&
//             // a-f
//             !(codepoint >= 0x61 && codepoint <= 0x66)
//         ) {
//             return false;
//         }
//     }
//
//     return true;
// }
function isFunction(name) {
    return name.endsWith("(") && isIdent(name.slice(0, -1));
}
// export function isAtKeyword(name: string): boolean {
//     return name.charCodeAt(0) == 0x40 && isIdent(name.slice(1));
// }
function isNewLine(codepoint) {
    // \n \r \f \v
    return (codepoint == 0xa ||
        codepoint == 0xb ||
        codepoint == 0xc ||
        codepoint == 0xd ||
        codepoint == 0x2028 ||
        codepoint == 0x2029);
}
function isWhiteSpace(codepoint) {
    return (codepoint == 0x9 ||
        codepoint == 0x20 ||
        // isNewLine
        codepoint == 0xa ||
        codepoint == 0xb ||
        codepoint == 0xc ||
        codepoint == 0xd ||
        codepoint == 0x2028 ||
        codepoint == 0x2029);
}
// export function isValue(token: Token) {
//     if (token == null) {
//         return false;
//     }
//
//     return (
//         token.typ === EnumToken.IdenTokenType ||
//         token.typ === EnumToken.DimensionTokenType ||
//         token.typ === EnumToken.LengthTokenType ||
//         token.typ === EnumToken.AngleTokenType ||
//         token.typ === EnumToken.FlexTokenType ||
//         token.typ === EnumToken.TimeTokenType ||
//         token.typ === EnumToken.ResolutionTokenType ||
//         token.typ === EnumToken.FrequencyTokenType ||
//         token.typ === EnumToken.NumberTokenType ||
//         token.typ === EnumToken.ColorTokenType ||
//         token.typ === EnumToken.FunctionTokenType ||
//         token.typ === EnumToken.UrlFunctionTokenType ||
//         token.typ === EnumToken.GridTemplateFuncTokenType ||
//         token.typ === EnumToken.ImageFunctionTokenType ||
//         token.typ === EnumToken.TimelineFunctionTokenType ||
//         token.typ === EnumToken.TimingFunctionTokenType ||
//         token.typ === EnumToken.MathFunctionTokenType ||
//         token.typ === EnumToken.TransformFunctionTokenType
//     );
// }
// https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Styling_basics/Values_and_units#absolute_length_units
/**
 * Convert length to px
 * @param value
 * @returns
 */
function length2Px(arena, value) {
    let result = null;
    const val = arena.numericValue[value];
    if (arena.dataTypes[value] == EnumToken.NumberTokenType) {
        result = val;
    }
    else {
        switch (arena.strings[arena.unit[value]]) {
            case "cm":
                result = val * 37.8;
                break;
            case "mm":
                result = val * 3.78;
                break;
            case "Q":
                result = (val * 37.8) / 40;
                break;
            case "in":
                result = val / 96;
                break;
            case "pc":
                result = val / 16;
                break;
            case "pt":
                result = (val * 4) / 3;
                break;
            case "px":
                result = val;
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
    val = String(toPrecisionValue(val));
    if (val === "0") {
        return "0";
    }
    const chr = val.charAt(0);
    if (chr == "-") {
        const slice = val.slice(0, 2);
        if (slice == "-0") {
            return val.length == 2 ? "0" : "-" + val.slice(2);
        }
    }
    if (chr == "0") {
        return val.slice(1);
    }
    return val;
}
function toPrecisionValue(value, precision = colorPrecision) {
    const div = Math.pow(10, precision);
    // @ts-ignore
    value = Math.round(value * div) / div;
    return Math.abs(value) < epsilon ? 0 : value;
}
function toPrecisionAngle(angle, precision = anglePrecision, correctValue = true) {
    angle = toPrecisionValue(angle, precision);
    if (correctValue && Math.abs(angle) >= 360) {
        angle %= 360;
    }
    if (correctValue && angle < 0) {
        angle += 360;
    }
    return angle;
}

export { angleUnits, dimensionUnits, flexUnits, frequencyUnits, isAngleUnit, isColor, isDigit, isFlexUnit, isFrequencyUnit, isFunction, isHash, isIdent, isIdentCodepoint, isIdentColor, isIdentStart, isLength, isLengthUnit, isLetter, isNewLine, isNonPrintable, isPolarColorspace, isPseudo, isRectangularOrthogonalColorspace, isResolutionUnit, isTimeUnit, isWhiteSpace, length2Px, minifyNumber, parseColor, parseDimension, pseudoAliasMap, reduceColorStops, reduceConicColorStops, reducegradientBackgroundPosition, renamedStandardProperties, resolutionUnits, timeUnits, toPrecisionAngle, toPrecisionValue };
