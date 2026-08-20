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
import { nonStandardColors, systemColors, deprecatedSystemColors, COLORS_NAMES, colorsFunc, colorFuncColorSpace, colorPrecision, epsilon, anglePrecision } from './constants.js';
import { getSyntaxConfig } from '../validation/config.js';

// https://www.w3.org/TR/CSS21/syndata.html#syntax
// https://www.w3.org/TR/2021/CRD-css-syntax-3-20211224/#typedef-ident-token
// '\\'
const REVERSE_SOLIDUS = 0x5c;
const dimensionUnits = new Set([
    "q",
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
]);
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
// renamed standard properties
const renamedStandardProperties = new Map([["color-adjust", "print-color-adjust"]]);
function isLength(dimension) {
    return "unit" in dimension && dimensionUnits.has(dimension.unit.toLowerCase());
}
function isResolution(dimension) {
    return "unit" in dimension && ["dpi", "dpcm", "dppx", "x"].includes(dimension.unit.toLowerCase());
}
function isAngle(dimension) {
    return "unit" in dimension && ["rad", "turn", "deg", "grad"].includes(dimension.unit.toLowerCase());
}
function isTime(dimension) {
    return "unit" in dimension && ["ms", "s"].includes(dimension.unit.toLowerCase());
}
function isFrequency(dimension) {
    return "unit" in dimension && ["hz", "khz"].includes(dimension.unit.toLowerCase());
}
/**
 * Reduce color stops
 * @param stops
 * @returns
 */
function reduceColorStops(stops) {
    const parts = splitTokenList(stops);
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
        if (i > 0 && isOkLabClose(parts[i - 1][0], parts[i][0])) {
            if (parts[i - 1].length == 1) {
                parts[i - 1].push({ typ: EnumToken.WhitespaceTokenType }, { typ: EnumToken.PercentageTokenType, val: ((k - 1) * 100) / n });
            }
            parts[i - 1].push(...parts[i].slice(1));
            parts.splice(i--, 1);
            updated = true;
            continue;
        }
        for (j = 0; j < parts[i].length; j++) {
            if ((parts[i][j].typ == EnumToken.LengthTokenType && 0 == parts[i][j].val) ||
                parts[i][j].typ == EnumToken.NumberTokenType ||
                parts[i][j].typ == EnumToken.PercentageTokenType) {
                if (parts[i][j].val === (k * 100) / n) {
                    parts[i].length = j;
                    trimArray(parts[i]);
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
                stops.push({ typ: EnumToken.CommaTokenType });
            }
            stops.push(...parts[j]);
        }
    }
    return stops;
}
/**
 * Reduce background-position values.
 * @param positions
 * @param position
 */
function reducegradientBackgroundPosition(positions, position) {
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
            positions.push({ typ: EnumToken.PercentageTokenType, val: 0 });
            break;
        case "50% 0%":
        case "50% 0":
        case "top center":
        case "center top":
            positions.length = 0;
            positions.push({ typ: EnumToken.IdenTokenType, val: "top" });
            break;
        case "bottom center":
        case "center bottom":
        case "bottom":
        case "50% 100%":
            positions.length = 0;
            positions.push({ typ: EnumToken.IdenTokenType, val: "bottom" });
            break;
        // case "left":
        // case "0 50%":
        // case "0% 50%":
        // case "left center":
        // case "center left":
        //     positions.length = 0;
        //     positions.push({ typ: EnumToken.PercentageTokenType, val: 0 });
        //     break;
        case "right center":
        case "center right":
        case "100% 50%":
        case "right":
            positions.length = 0;
            positions.push({ typ: EnumToken.PercentageTokenType, val: 100 });
            break;
        case "bottom left":
        case "left bottom":
            positions.length = 0;
            positions.push({ typ: EnumToken.PercentageTokenType, val: 0 }, { typ: EnumToken.WhitespaceTokenType }, { typ: EnumToken.PercentageTokenType, val: 100 });
            break;
        case "bottom right":
        case "right bottom":
            positions.length = 0;
            positions.push({ typ: EnumToken.PercentageTokenType, val: 100 }, { typ: EnumToken.WhitespaceTokenType }, { typ: EnumToken.PercentageTokenType, val: 100 });
            break;
        case "top left":
        case "left top":
            positions.length = 0;
            positions.push({ typ: EnumToken.PercentageTokenType, val: 0 }, { typ: EnumToken.WhitespaceTokenType }, { typ: EnumToken.PercentageTokenType, val: 0 });
            break;
        case "top right":
        case "right top":
            positions.length = 0;
            positions.push({ typ: EnumToken.PercentageTokenType, val: 100 }, { typ: EnumToken.WhitespaceTokenType }, { typ: EnumToken.PercentageTokenType, val: 0 });
            break;
    }
}
/**
 * Reduce conic-gradient color stops
 * @param stops
 * @returns
 */
function reduceConicColorStops(stops) {
    const parts = splitTokenList(stops);
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
        if (i > 0 && isOkLabClose(parts[i - 1][0], parts[i][0])) {
            if (parts[i - 1].length == 1) {
                parts[i - 1].push({ typ: EnumToken.WhitespaceTokenType }, { typ: EnumToken.AngleTokenType, val: ((k - 1) * 100) / n, unit: "deg" });
            }
            parts[i - 1].push(...parts[i].slice(1));
            parts.splice(i--, 1);
            updated = true;
            continue;
        }
        for (j = 0; j < parts[i].length; j++) {
            if ((parts[i][j].typ == EnumToken.NumberTokenType && 0 == parts[i][j].val) ||
                parts[i][j].typ == EnumToken.AngleTokenType) {
                if (toDegrees(parts[i][j]).val === (k * 360) / n) {
                    parts[i].length = j;
                    trimArray(parts[i]);
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
                stops.push({ typ: EnumToken.CommaTokenType });
            }
            stops.push(...parts[j]);
        }
    }
    return stops;
}
/**
 * is rectangular orthogonal colorspace
 * @param token
 * @returns
 */
function isRectangularOrthogonalColorspace(token) {
    return (token.typ === EnumToken.IdenTokenType &&
        colorFuncColorSpace.some((t) => equalsIgnoreCase(t, token.val)));
}
/**
 * Is polar colorspace
 * @param token
 * @returns
 */
function isPolarColorspace(token) {
    return (token.typ === EnumToken.IdenTokenType &&
        ["hsl", "hwb", "lch", "oklch"].some((t) => equalsIgnoreCase(t, token.val)));
}
/**
 * Is ident color
 * @param token
 * @returns
 */
function isIdentColor(token) {
    return (token.typ == EnumToken.ColorTokenType &&
        [ColorType.SYS, ColorType.DPSYS, ColorType.LIT].includes(token.kin) &&
        isIdent(token.val));
}
function isColor(token, errors) {
    if (token.typ == EnumToken.WildCardFunctionTokenType) {
        return true;
    }
    if (token.typ == EnumToken.ColorTokenType) {
        if ("kin" in token && !("chi" in token)) {
            return true;
        }
    }
    if (token.typ == EnumToken.IdenTokenType) {
        const val = token.val.toLowerCase();
        if (systemColors.has(val) || deprecatedSystemColors.has(val) || nonStandardColors.has(val)) {
            return true;
        }
        // named color
        return val in COLORS_NAMES || "currentcolor" === val || "transparent" === val;
    }
    if (token.typ === EnumToken.FunctionTokenType || token.typ === EnumToken.ColorTokenType) {
        // if (!colorsFunc.includes((token as FunctionToken).val.toLowerCase())) {
        //     return false;
        // }
        if (token.chi.length > 0) {
            // @ts-ignore
            if (token.val === "light-dark") {
                // @ts-ignore
                const children = token.chi.filter((t) => [
                    EnumToken.IdenTokenType,
                    EnumToken.NumberTokenType,
                    EnumToken.LiteralTokenType,
                    EnumToken.ColorTokenType,
                    EnumToken.FunctionTokenType,
                    EnumToken.PercentageTokenType,
                    EnumToken.WildCardFunctionTokenType,
                ].includes(t.typ));
                if (children.length != 2) {
                    errors?.push({
                        message: "light-dark function must have 2 arguments",
                        node: token,
                        action: "drop",
                    });
                    return false;
                }
                if (isColor(children[0]) && isColor(children[1])) {
                    return true;
                }
            }
            // adding numbers and percentages is disallowed
            // https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/color_value/lch#defining_relative_color_output_channel_components:~:text=Adding%20a%20%3Cpercentage%3E%20to%20a%20%3Cnumber%3E%2C%20for%20example%2C%20doesn%27t%20work
            const components = getColorComponents(token);
            if (components !== null) {
                const colorSpace = getColorSpace(token)?.split?.("");
                if (colorSpace != null) {
                    for (const value of components) {
                        if (value.typ === EnumToken.IdenTokenType) {
                            const val = value.val.toLowerCase();
                            if (
                            // @ts-expect-error
                            typeof Math[val.toUpperCase()] !== "number" &&
                                val != "in" &&
                                val != "hue" &&
                                val != "from" &&
                                val != "alpha" &&
                                val != "none" &&
                                val != "shorter" &&
                                val != "longer" &&
                                val != "increasing" &&
                                val != "decreasing" &&
                                !colorsFunc.includes(val) &&
                                !colorSpace.includes(val) &&
                                !colorFuncColorSpace.includes(val)) {
                                errors?.push({
                                    action: "drop",
                                    message: `Unexpected constant '${val}'`,
                                    node: value,
                                    // location: options.source!.getSourLocation(value[LOC]!.sta),
                                });
                                return false;
                            }
                        }
                        else if (value.typ === EnumToken.MathFunctionTokenType &&
                            equalsIgnoreCase("calc", value.val)) {
                            let val;
                            for (const v of walkValues(value.chi)) {
                                if (v.value.typ === EnumToken.IdenTokenType) {
                                    val = v.value.val.toLowerCase();
                                    if (
                                    // @ts-expect-error
                                    typeof Math[val.toUpperCase()] !== "number" &&
                                        val != "in" &&
                                        val != "hue" &&
                                        val != "from" &&
                                        val != "alpha" &&
                                        val != "none" &&
                                        val != "shorter" &&
                                        val != "longer" &&
                                        val != "increasing" &&
                                        val != "decreasing" &&
                                        !colorsFunc.includes(val) &&
                                        !colorSpace.includes(val) &&
                                        !colorFuncColorSpace.includes(val)) {
                                        errors?.push({
                                            action: "drop",
                                            message: `Unexpected constant '${val}'`,
                                            node: v.value,
                                            // location: options.source!.getSourLocation(v.value[LOC]!.sta),
                                        });
                                        return false;
                                    }
                                }
                            }
                        }
                    }
                }
            }
            // @ts-ignore
            for (const { value, parent } of walkValues(token.chi, token, (value) => value.typ === EnumToken.WildCardFunctionTokenType
                ? WalkerOptionEnum.Ignore | WalkerOptionEnum.IgnoreChildren
                : null)) {
                let k = 0;
                let l;
                let tk = null;
                let tl = null;
                if (value.typ === EnumToken.BinaryExpressionTokenType) {
                    tk = value.l;
                    tl = value.r;
                }
                else if (parent?.typ === EnumToken.MathFunctionTokenType &&
                    parent.val === "calc") {
                    l = k + 1;
                    while (l + 1 < parent.chi.length) {
                        const tk = parent.chi[l];
                        if (tk.typ === EnumToken.WhitespaceTokenType ||
                            tk.typ === EnumToken.CommentTokenType ||
                            tk.typ === EnumToken.Add ||
                            tk.typ === EnumToken.Sub ||
                            tk.typ === EnumToken.Div ||
                            tk.typ === EnumToken.Mul) {
                            l++;
                            continue;
                        }
                        break;
                    }
                    tk = parent.chi[k];
                    tl = parent.chi[l];
                }
                if (tk != null && tl != null) {
                    if ((tk.typ === EnumToken.PercentageTokenType || tl.typ === EnumToken.PercentageTokenType) &&
                        tk.typ !== tl.typ) {
                        errors?.push({
                            action: "drop",
                            message: "adding percentage and number is not allowed",
                            node: token,
                            // location: options.source!.getSourLocation(token[LOC]!.sta),
                        });
                        return false;
                    }
                }
            }
            // @ts-ignore
            if (token.val == "color") {
                // @ts-ignore
                const children = token.chi.filter((t) => [
                    EnumToken.DashedIdenTokenType,
                    EnumToken.IdenTokenType,
                    EnumToken.NumberTokenType,
                    EnumToken.LiteralTokenType,
                    EnumToken.ColorTokenType,
                    EnumToken.FunctionTokenType,
                    EnumToken.MathFunctionTokenType,
                    EnumToken.PercentageTokenType,
                ].includes(t.typ));
                const isRelative = children[0].typ == EnumToken.IdenTokenType && children[0].val == "from";
                let offset = 0;
                if (isRelative) {
                    offset = 2;
                }
                if (children[offset]?.typ == EnumToken.DashedIdenTokenType) {
                    if (children.length <= offset + 1) {
                        errors?.push({
                            action: "drop",
                            message: `Invalid color`,
                            node: token,
                        });
                        return false;
                    }
                    for (let i = offset + 1; i < children.length; i++) {
                        if (children[i].typ == EnumToken.NumberTokenType ||
                            children[i].typ == EnumToken.LiteralTokenType ||
                            children[i].typ == EnumToken.ColorTokenType ||
                            children[i].typ == EnumToken.FunctionTokenType ||
                            children[i].typ == EnumToken.MathFunctionTokenType ||
                            children[i].typ == EnumToken.PercentageTokenType ||
                            isColor(children[i]) ||
                            (children[i].typ == EnumToken.IdenTokenType &&
                                equalsIgnoreCase("none", children[i].val))) {
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
            // @ts-ignore
            else if (token.val == "color-mix") {
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
                let j = 0;
                let k = 0;
                if (children[j][0].typ === EnumToken.IdenTokenType &&
                    equalsIgnoreCase("in", children[j][k].val)) {
                    k++;
                    if (children[j][k]?.typ === EnumToken.IdenTokenType) {
                        if (!isRectangularOrthogonalColorspace(children[j][k])) {
                            if (isPolarColorspace(children[j][k++])) {
                                if (k == children[j].length) ;
                                else if (children[j][k].typ !== EnumToken.IdenTokenType) {
                                    return false;
                                }
                                else if (equalsIgnoreCase("hue", children[j][k].val)) {
                                    k++;
                                }
                                else {
                                    switch (children[j][k].val) {
                                        case "increasing":
                                        case "decreasing":
                                        case "longer":
                                        case "shorter":
                                            k++;
                                            break;
                                        default:
                                            return false;
                                    }
                                    if (children[j][k]?.typ !== EnumToken.IdenTokenType ||
                                        !equalsIgnoreCase("hue", children[j][k].val)) {
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
            else {
                const keywords = ["from", "none"];
                // @ts-ignore
                if (["rgb", "hsl", "hwb", "lab", "lch", "oklab", "oklch"].some((t) => equalsIgnoreCase(t, token.val))) {
                    // @ts-ignore
                    keywords.push("alpha", ...token.val.slice(-3).split(""));
                }
                // @ts-ignore
                for (const v of token.chi) {
                    if (v.typ == EnumToken.IdenTokenType) {
                        continue;
                    }
                    if (v.typ === EnumToken.MathFunctionTokenType ||
                        v.typ === EnumToken.WildCardFunctionTokenType ||
                        colorsFunc.includes(v.val)) {
                        continue;
                    }
                }
            }
            return true;
        }
    }
    return false;
}
function parseColor(token) {
    if (token.typ === EnumToken.IdenTokenType) {
        const val = token.val.toLowerCase();
        if (nonStandardColors.has(val)) {
            Object.assign(token, {
                typ: EnumToken.ColorTokenType,
                kin: ColorType.NON_STD,
            });
            return token;
        }
        if (systemColors.has(val)) {
            Object.assign(token, {
                typ: EnumToken.ColorTokenType,
                kin: ColorType.SYS,
            });
            return token;
        }
        if (deprecatedSystemColors.has(val)) {
            Object.assign(token, {
                typ: EnumToken.ColorTokenType,
                kin: ColorType.DPSYS,
            });
            return token;
        }
        if (val in COLORS_NAMES || val === "currentcolor") {
            Object.assign(token, {
                typ: EnumToken.ColorTokenType,
                val,
                kin: ColorType.LIT,
            });
            return token;
        }
    }
    if (token.typ === EnumToken.ColorTokenType) {
        if (!("kin" in token) && "val" in token) {
            // @ts-expect-error
            token.kin = ColorType[token.val.replaceAll("-", "_").toUpperCase()];
        }
        if ("chi" in token) {
            const tk = token.chi?.find((t) => t.typ !== EnumToken.WhitespaceTokenType && t.typ !== EnumToken.CommentTokenType);
            if (tk?.typ === EnumToken.IdenTokenType && tk.val === "from") {
                token.cal = "rel";
            }
            else if (token.val == "color-mix" && tk.val == "in") {
                token.cal = "mix";
            }
            if (token.val == "color") {
                let index = token.chi.indexOf(tk);
                if (EnumToken.DashedIdenTokenType == token?.chi?.[index]?.typ) {
                    token.kin = ColorType.CUSTOM_COLOR;
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
function isPseudo(name) {
    return (name.charAt(0) == ":" &&
        ((name.endsWith("(") && isIdent(name.charAt(1) == ":" ? name.slice(2, -1) : name.slice(1, -1))) ||
            isIdent(name.charAt(1) == ":" ? name.slice(2) : name.slice(1))));
}
function isHash(name) {
    return name.charAt(0) == "#" && isIdentStart(name.charCodeAt(1));
}
const isNumber = memoize(function (name) {
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
        // if (i == j) {
        //     return false;
        // }
        codepoint = name.charCodeAt(i + 1);
        // '+' '-'
        // if ([0x2b, 0x2d].includes(codepoint)) {
        //     i++;
        // }
        codepoint = name.charCodeAt(i + 1);
        if (!isDigit(codepoint)) {
            return false;
        }
    }
    // while (++i < j) {
    //     codepoint = name.charCodeAt(i) as number;
    //     if (!isDigit(codepoint)) {
    //         return false;
    //     }
    // }
    return true;
});
function isPercentage(name) {
    return name.endsWith("%") && isNumber(name.slice(0, -1));
}
function isFlex(dimension) {
    return "unit" in dimension && "fr" == dimension.unit.toLowerCase();
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
        if (dimension.unit == "dppx") {
            dimension.unit = "x";
        }
    }
    else if (isFrequency(dimension)) {
        // @ts-ignore
        dimension.typ = EnumToken.FrequencyTokenType;
    }
    else if (isFlex(dimension)) {
        // @ts-ignore
        dimension.typ = EnumToken.FlexTokenType;
    }
    return dimension;
}
function isHexColor(name) {
    if (name.charAt(0) != "#" || ![4, 5, 7, 9].includes(name.length)) {
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
    return name.endsWith("(") && isIdent(name.slice(0, -1));
}
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
// https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Styling_basics/Values_and_units#absolute_length_units
/**
 * Convert length to px
 * @param value
 * @returns
 */
function length2Px(value) {
    let result = null;
    if (value.typ == EnumToken.NumberTokenType) {
        result = +value.val;
    }
    else {
        switch (value.unit) {
            case "cm":
                // @ts-ignore
                result = value.val * 37.8;
                break;
            case "mm":
                // @ts-ignore
                result = value.val * 3.78;
                break;
            case "Q":
                // @ts-ignore
                result = (value.val * 37.8) / 40;
                break;
            case "in":
                // @ts-ignore
                result = value.val / 96;
                break;
            case "pc":
                // @ts-ignore
                result = value.val / 16;
                break;
            case "pt":
                // @ts-ignore
                result = (value.val * 4) / 3;
                break;
            case "px":
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
function toPrecisionAngle(angle, precision = colorPrecision, correctValue = true) {
    angle = toPrecisionValue(angle, precision);
    if (correctValue && Math.abs(angle) >= 360) {
        angle %= 360;
    }
    if (Math.abs(angle) < anglePrecision) {
        angle = 0;
    }
    if (correctValue && angle < 0) {
        angle += 360;
    }
    return angle;
}

export { dimensionUnits, isAngle, isColor, isDigit, isFlex, isFrequency, isFunction, isHash, isHexColor, isIdent, isIdentCodepoint, isIdentColor, isIdentStart, isLength, isLetter, isNewLine, isNonPrintable, isNumber, isPercentage, isPolarColorspace, isPseudo, isRectangularOrthogonalColorspace, isResolution, isTime, isWhiteSpace, length2Px, minifyNumber, parseColor, parseDimension, pseudoAliasMap, reduceColorStops, reduceConicColorStops, reducegradientBackgroundPosition, renamedStandardProperties, toPrecisionAngle, toPrecisionValue };
