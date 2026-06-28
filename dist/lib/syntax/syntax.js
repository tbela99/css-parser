import { EnumToken, ColorType } from '../ast/types.js';
import { walkValues, WalkerOptionEnum } from '../ast/walk.js';
import { toDegrees } from '../parser/utils/angle.js';
import { equalsIgnoreCase } from '../parser/utils/text.js';
import { trimArray } from '../validation/match.js';
import { splitTokenList } from '../validation/utils/list.js';
import { colorsFunc, systemColors, deprecatedSystemColors, nonStandardColors, COLORS_NAMES, mathFuncs } from './constants.js';
import { isOkLabClose } from './color/utils/distance.js';

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
// https://www.w3.org/TR/css-values-4/#math-function
const pseudoElements = [":before", ":after", ":first-line", ":first-letter"];
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
function isColorspace(token) {
    if (token.typ === EnumToken.WildCardFunctionTokenType && token.val === "var") {
        return true;
    }
    if (token.typ != EnumToken.IdenTokenType) {
        return false;
    }
    return [
        "srgb",
        "srgb-linear",
        "lab",
        "oklab",
        "lch",
        "oklch",
        "xyz",
        "xyz-d50",
        "xyz-d65",
        "display-p3",
        "a98-rgb",
        "prophoto-rgb",
        "rec2020",
        "rgb",
        "hsl",
        "hwb",
    ].includes(token.val.toLowerCase());
}
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
                parts[i - 1].push({ typ: EnumToken.WhitespaceTokenType }, { typ: EnumToken.PercentageTokenType, val: (k - 1) * 100 / n });
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
        case "0 50%":
        case "0% 50%":
        case "left":
        case "left center":
        case "center left":
            positions.length = 2;
            positions.push({ typ: EnumToken.PercentageTokenType, val: 0 });
            break;
        case "50% 0":
        case "50% 0%":
        case "top center":
        case "center top":
            positions.length = 2;
            positions.push({ typ: EnumToken.IdenTokenType, val: "top" });
            break;
        case "bottom":
        case "50% 100%":
        case "bottom center":
        case "center bottom":
            positions.length = 2;
            positions.push({ typ: EnumToken.IdenTokenType, val: "bottom" });
            break;
        case "left":
        case "0 50%":
        case "0% 50%":
        case "left center":
        case "center left":
            positions.length = 2;
            positions.push({ typ: EnumToken.PercentageTokenType, val: 0 });
            break;
        case "100% 50%":
        case "right":
        case "right center":
        case "center right":
            positions.length = 2;
            positions.push({ typ: EnumToken.PercentageTokenType, val: 100 });
            break;
        case "bottom left":
        case "left bottom":
            positions.length = 2;
            positions.push({ typ: EnumToken.PercentageTokenType, val: 0 }, { typ: EnumToken.WhitespaceTokenType }, { typ: EnumToken.PercentageTokenType, val: 100 });
            break;
        case "bottom right":
        case "right bottom":
            positions.length = 2;
            positions.push({ typ: EnumToken.PercentageTokenType, val: 100 }, { typ: EnumToken.WhitespaceTokenType }, { typ: EnumToken.PercentageTokenType, val: 100 });
            break;
        case "top left":
        case "left top":
            positions.length = 2;
            positions.push({ typ: EnumToken.PercentageTokenType, val: 0 }, { typ: EnumToken.WhitespaceTokenType }, { typ: EnumToken.PercentageTokenType, val: 0 });
            break;
        case "top right":
        case "right top":
            positions.length = 2;
            positions.push({ typ: EnumToken.PercentageTokenType, val: 100 }, { typ: EnumToken.WhitespaceTokenType }, { typ: EnumToken.PercentageTokenType, val: 0 });
            break;
    }
}
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
                parts[i - 1].push({ typ: EnumToken.WhitespaceTokenType }, { typ: EnumToken.AngleTokenType, val: (k - 1) * 100 / n, unit: 'deg' });
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
function isRectangularOrthogonalColorspace(token) {
    if (token.typ != EnumToken.IdenTokenType) {
        return false;
    }
    return [
        "srgb",
        "srgb-linear",
        "display-p3",
        "a98-rgb",
        "prophoto-rgb",
        "rec2020",
        "lab",
        "oklab",
        "xyz",
        "xyz-d50",
        "xyz-d65",
    ].includes(token.val.toLowerCase());
}
function isPolarColorspace(token) {
    if (token.typ != EnumToken.IdenTokenType) {
        return false;
    }
    return ["hsl", "hwb", "lch", "oklch"].includes(token.val);
}
function isHueInterpolationMethod(token) {
    if (!Array.isArray(token)) {
        return token.typ == EnumToken.IdenTokenType && "hue" === token.val?.toLowerCase?.();
    }
    if (token.length != 2 || token[0].typ != EnumToken.IdenTokenType || token[1].typ != EnumToken.IdenTokenType) {
        return false;
    }
    return (["shorter", "longer", "increasing", "decreasing"].includes(token[0].val?.toLowerCase?.()) &&
        "hue" === token[1].val?.toLowerCase?.());
}
function isIdentColor(token) {
    return (token.typ == EnumToken.ColorTokenType &&
        [ColorType.SYS, ColorType.DPSYS, ColorType.LIT].includes(token.kin) &&
        isIdent(token.val));
}
function isPercentageToken(token) {
    return (token.typ == EnumToken.PercentageTokenType ||
        (token.typ == EnumToken.NumberTokenType && token.val == 0));
}
function isColor(token, errors) {
    if (token.typ == EnumToken.WildCardFunctionTokenType) {
        return true;
    }
    if (token.typ == EnumToken.FunctionTokenType) {
        if (!colorsFunc.includes(token.val.toLowerCase())) {
            return false;
        }
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
    let isLegacySyntax = false;
    if (token.typ === EnumToken.FunctionTokenType || token.typ === EnumToken.ColorTokenType) {
        if (!colorsFunc.includes(token.val.toLowerCase())) {
            return false;
        }
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
                            location: token.loc,
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
                    if (children.length < offset + 1) {
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
                if (children.length < 4 || children.length > 8) {
                    return false;
                }
                if (!isRelative && !isColorspace(children[0])) {
                    return false;
                }
                for (let i = 1; i < children.length - 2; i++) {
                    if (children[i].typ == EnumToken.IdenTokenType) {
                        if (isColor(children[i])) {
                            continue;
                        }
                        if (children[i].val != "none" &&
                            !((isRelative &&
                                ["alpha", "r", "g", "b", "x", "y", "z"].includes(children[i].val)) ||
                                isColorspace(children[i]))) {
                            return false;
                        }
                    }
                    if (children[i].typ === EnumToken.WildCardFunctionTokenType) {
                        continue;
                    }
                    if (children[i].typ === EnumToken.FunctionTokenType ||
                        children[i].typ === EnumToken.MathFunctionTokenType) {
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
                    if (((children.length > 6 || !isRelative) && sep.typ != EnumToken.LiteralTokenType) ||
                        sep.val != "/") {
                        return false;
                    }
                    if (alpha.typ == EnumToken.IdenTokenType && alpha.val != "none") {
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
                if (children.length == 3) {
                    if (children[0].length > 4 ||
                        children[0][0].typ != EnumToken.IdenTokenType ||
                        "in" !== children[0][0].val?.toLowerCase?.() ||
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
                        if (!(children[1][1].typ == EnumToken.PercentageTokenType ||
                            (children[1][1].typ == EnumToken.NumberTokenType &&
                                children[1][1].val == 0))) {
                            return false;
                        }
                    }
                    if (children[2].length == 2) {
                        if (!(children[2][1].typ == EnumToken.PercentageTokenType ||
                            (children[2][1].typ == EnumToken.NumberTokenType &&
                                children[2][1].val == 0))) {
                            return false;
                        }
                    }
                    return true;
                }
                return false;
            }
            else {
                const keywords = ["from", "none"];
                // @ts-ignore
                if (["rgb", "hsl", "hwb", "lab", "lch", "oklab", "oklch"].includes(token.val)) {
                    // @ts-ignore
                    keywords.push("alpha", ...token.val.slice(-3).split(""));
                }
                // @ts-ignore
                for (const v of token.chi) {
                    if (v.typ == EnumToken.CommaTokenType) {
                        isLegacySyntax = true;
                    }
                    if (v.typ == EnumToken.IdenTokenType) {
                        if (isColor(v)) {
                            continue;
                        }
                        if (!(keywords.includes(v.val) || v.val.toLowerCase() in COLORS_NAMES)) {
                            return false;
                        }
                        if (keywords.includes(v.val)) {
                            if (isLegacySyntax) {
                                return false;
                            }
                            // @ts-ignore
                            if (v.val == "from" && ["rgba", "hsla"].includes(token.val)) {
                                return false;
                            }
                        }
                        continue;
                    }
                    if (v.typ === EnumToken.MathFunctionTokenType ||
                        v.typ === EnumToken.WildCardFunctionTokenType ||
                        colorsFunc.includes(v.val)) {
                        continue;
                    }
                    if (![
                        EnumToken.ColorTokenType,
                        EnumToken.IdenTokenType,
                        EnumToken.NumberTokenType,
                        EnumToken.AngleTokenType,
                        EnumToken.PercentageTokenType,
                        EnumToken.CommaTokenType,
                        EnumToken.WhitespaceTokenType,
                        EnumToken.LiteralTokenType,
                    ].includes(v.typ)) {
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
                if (token.cal == "rel") {
                    for (let k = 0; k < token.chi.length; k++) {
                        if (EnumToken.DashedIdenTokenType == token.chi[k].typ) {
                            index = k;
                            break;
                        }
                    }
                }
                if (EnumToken.DashedIdenTokenType == token?.chi?.[index]?.typ) {
                    token.kin = ColorType.CUSTOM_COLOR;
                }
            }
        }
        return token;
    }
    // @ts-ignore
    token.typ = EnumToken.ColorTokenType;
    // @ts-ignore
    token.kin = ColorType[token.val.replaceAll("-", "_").toUpperCase()];
    if (!("chi" in token)) {
        const val = token.val.toLowerCase();
        if (val == "currentcolor" || val == "transparent" || val in COLORS_NAMES) {
            token.kin = ColorType.LIT;
        }
        else if (isHexColor(val)) {
            token.kin = ColorType.HEX;
        }
        const tk = token.chi?.find((t) => t.typ !== EnumToken.WhitespaceTokenType && t.typ !== EnumToken.CommentTokenType);
        if (tk?.typ === EnumToken.IdenTokenType && tk.val === "from") {
            token.cal = "rel";
        }
        else if (token.val == "color-mix" && tk.val == "in") {
            token.cal = "mix";
        }
        else if (token.val == "color") {
            token.cal = "col";
        }
        return token;
    }
    // @ts-ignore
    if (token.chi[0].typ == EnumToken.IdenTokenType) {
        // @ts-ignore
        if (token.chi[0].val == "from") {
            // @ts-ignore
            token.cal = "rel";
        }
        // @ts-ignore
        else if (token.val == "color-mix" && token.chi[0].val == "in") {
            // @ts-ignore
            token.cal = "mix";
        }
        else {
            // @ts-ignore
            if (token.val == "color") {
                // @ts-ignore
                token.cal = "col";
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
        if (nextCodepoint == REVERSE_SOLIDUS) {
            return name.length > 2 && !isNewLine(name.charCodeAt(2));
        }
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
        codepoint = name.charCodeAt(i + 1);
        if (!isIdentCodepoint(codepoint)) {
            return false;
        }
        i += String.fromCodePoint(codepoint).length;
        if (i < j) {
            codepoint = name.charCodeAt(i);
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
        if (codepoint !== 0x2d && !isIdentCodepoint(codepoint)) {
            return false;
        }
    }
    return true;
}
function isPseudo(name) {
    return (name.charAt(0) == ":" &&
        ((name.endsWith("(") && isIdent(name.charAt(1) == ":" ? name.slice(2, -1) : name.slice(1, -1))) ||
            isIdent(name.charAt(1) == ":" ? name.slice(2) : name.slice(1))));
}
function isHash(name) {
    return name.charAt(0) == "#" && isIdent(name.charAt(1));
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
    const dimension = {
        typ: EnumToken.DimensionTokenType,
        val: +name.slice(0, index),
        unit: name.slice(index),
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
function isValue(token) {
    if (token == null) {
        return false;
    }
    return (token.typ === EnumToken.IdenTokenType ||
        token.typ === EnumToken.DimensionTokenType ||
        token.typ === EnumToken.LengthTokenType ||
        token.typ === EnumToken.AngleTokenType ||
        token.typ === EnumToken.FlexTokenType ||
        token.typ === EnumToken.TimeTokenType ||
        token.typ === EnumToken.ResolutionTokenType ||
        token.typ === EnumToken.FrequencyTokenType ||
        token.typ === EnumToken.NumberTokenType ||
        token.typ === EnumToken.ColorTokenType ||
        token.typ === EnumToken.FunctionTokenType ||
        token.typ === EnumToken.UrlFunctionTokenType ||
        token.typ === EnumToken.GridTemplateFuncTokenType ||
        token.typ === EnumToken.ImageFunctionTokenType ||
        token.typ === EnumToken.TimelineFunctionTokenType ||
        token.typ === EnumToken.TimingFunctionTokenType ||
        token.typ === EnumToken.MathFunctionTokenType ||
        token.typ === EnumToken.TransformFunctionTokenType);
}

export { dimensionUnits, isAngle, isColor, isColorspace, isDigit, isFlex, isFrequency, isFunction, isHash, isHexColor, isHueInterpolationMethod, isIdent, isIdentCodepoint, isIdentColor, isIdentStart, isLength, isLetter, isNewLine, isNumber, isPercentage, isPercentageToken, isPolarColorspace, isPseudo, isRectangularOrthogonalColorspace, isResolution, isTime, isValue, isWhiteSpace, parseColor, parseDimension, pseudoAliasMap, pseudoElements, reduceColorStops, reduceConicColorStops, reducegradientBackgroundPosition, renamedStandardProperties };
