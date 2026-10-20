/* 
	CSS parser, minifier and validator for node and the browser

	Author(s): Thierry Bela
	Version: 2.0.0-alpha.1
	License: MIT
 */
import { EnumToken, EnumAstNodeStatus, ColorType } from '../ast/types.js';
import { toDegrees } from '../parser/utils/angle.js';
import { equalsIgnoreCase } from '../parser/utils/text.js';
import { getAngle, convertColor } from '../syntax/color/color.js';
import { reduceHexValue } from '../syntax/color/hex.js';
import { pseudoElements, anglePrecision, urlTokenMatcher, tokensfuncSet } from '../syntax/constants.js';
import { minifyNumber, toPrecisionAngle, reducegradientBackgroundPosition, reduceConicColorStops, reduceColorStops, parseColor, toPrecisionValue } from '../syntax/syntax.js';

/**
 * render ast token
 * @param token
 * @param options
 * @param cache
 * @param reducer
 * @param errors
 * @private
 */
function printValue(token, arena, options, cache = Object.create(null), reducer, errors) {
    const typ = arena.getType(token);
    // console.error(EnumToken[typ]);
    if (typ === EnumToken.WhenElseFunctionTokenType && arena.equalsIgnoreCase(token, "val", "supports")) {
        options = { ...options, minifyValues: false, minify: false, convertColor: false };
        reducer = null;
    }
    options.minifyValues ??= options.minify;
    if (reducer == null) {
        reducer = function (acc, curr) {
            if (arena.getType(curr) == EnumToken.CommentTokenType && options.removeComments) {
                if (!options.preserveLicense || !arena.startsWith(curr, "val", "/*!")) {
                    return acc;
                }
                return acc + arena.getValue(curr);
            }
            return acc + printValue(curr, arena, options, cache, reducer, errors);
        };
    }
    switch (typ) {
        case EnumToken.UrlFunctionTokenDefType:
        case EnumToken.FunctionTokenDefType:
        case EnumToken.MathFunctionTokenDefType:
        case EnumToken.ImageFunctionTokenDefType:
        case EnumToken.ColorFunctionTokenDefType:
        case EnumToken.TimingFunctionTokenDefType:
        case EnumToken.WhenElseFunctionTokenDefType:
        case EnumToken.SupportsFunctionTokenDefType:
        case EnumToken.TimelineFunctionTokenDefType:
        case EnumToken.GridTemplateFuncTokenDefType:
        case EnumToken.TransformFunctionTokenDefType:
        case EnumToken.ContainerFunctionTokenDefType:
        case EnumToken.PseudoClassFunctionTokenDefType:
        case EnumToken.GeneralEnclosedFunctionTokenDefType:
        case EnumToken.CustomFunctionTokenDefType:
        case EnumToken.WildCardFunctionTokenDefType:
            return arena.getValue(token) + "(";
        case EnumToken.ListTokenType:
            return arena
                .children(token)
                .reduce((acc, curr) => acc + printValue(curr, arena, options, cache), "");
        case EnumToken.BinaryExpressionTokenType:
            if (EnumToken.Mul === token.op ||
                EnumToken.Div === token.op) {
                let result = "";
                if (token.l.typ == EnumToken.BinaryExpressionTokenType &&
                    [EnumToken.Add, EnumToken.Sub].includes(token.l.op)) {
                    result = "(" + printValue(token.l, arena, options, cache) + ")";
                }
                else {
                    result = printValue(token.l, options, cache);
                }
                result += token.op == EnumToken.Mul ? "*" : "/";
                if (token.r.typ == EnumToken.BinaryExpressionTokenType &&
                    [EnumToken.Add, EnumToken.Sub].includes(token.r.op)) {
                    result += "(" + printValue(token.r, options, cache) + ")";
                }
                else {
                    result += printValue(token.r, options, cache);
                }
                return result;
            }
            return (printValue(token.l, options, cache) +
                (token.op == EnumToken.Add ? " + " : " - ") +
                printValue(token.r, options, cache));
        case EnumToken.FractionTokenType:
            const fraction = printValue(token.l) + "/" + printValue(token.r);
            if (+token.r.val != 0) {
                const value = minifyNumber(+token.l.val / +token.r.val);
                if (value.length <= fraction.length) {
                    return value;
                }
            }
            return fraction;
        case EnumToken.Add:
            return " + ";
        case EnumToken.Sub:
            return " - ";
        case EnumToken.UniversalSelectorTokenType:
        case EnumToken.Star:
        case EnumToken.Mul:
            return "*";
        case EnumToken.Div:
            return "/";
        case EnumToken.WrappedValuesTokenType:
            return ("{" +
                token.chi.reduce((acc, curr) => acc + printValue(curr, options, cache), "") +
                "}");
        case EnumToken.ColorTokenType:
            if (token.kin == ColorType.LIGHT_DARK ||
                ("chi" in token && options.convertColor === false && token.chi.length == 2)) {
                return (token.val +
                    "(" +
                    token.chi.reduce((acc, curr) => {
                        if (curr.typ === EnumToken.IdenTokenType) {
                            parseColor(curr);
                        }
                        return acc + printValue(curr, options, cache);
                    }, "") +
                    ")");
            }
            if (options.convertColor !== false) {
                const value = convertColor(token, typeof options.convertColor === "boolean"
                    ? ColorType.HEX
                    : (ColorType[ColorType[options.convertColor ?? "HEX"]
                        ?.toUpperCase?.()
                        .replaceAll?.("-", "_")] ?? ColorType.HEX));
                if (value != null) {
                    token = value;
                }
                if (token.kin == ColorType.HEX || token.kin == ColorType.LIT) {
                    return reduceHexValue(token.val);
                }
            }
            if (token.kin === ColorType.SYS ||
                token.kin === ColorType.DPSYS ||
                token.kin === ColorType.NON_STD) {
                return token.val;
            }
            if (token.kin == ColorType.HEX || token.kin == ColorType.LIT) {
                return token.val;
            }
            if (Array.isArray(token.chi)) {
                const fnName = token.val;
                const isLegacy = ["rgb", "rgba", "hsl", "hsla"].includes(token.val);
                const hasAlpha = [
                    "rgb",
                    "rgba",
                    "hsl",
                    "hsla",
                    "hwb",
                    "oklab",
                    "oklch",
                    "lab",
                    "lch",
                ].includes(fnName);
                const useAlpha = (hasAlpha && token.chi.length == (isLegacy ? 7 : 4)) ||
                    ("color" == token.val && token.chi.length == 5);
                return ((hasAlpha && token.val.endsWith("a") ? fnName.slice(0, -1) : fnName) +
                    "(" +
                    token
                        .chi.reduce((acc, curr, index, array) => {
                        if (/[,/]\s*$/.test(acc)) {
                            if (curr.typ == EnumToken.WhitespaceTokenType) {
                                return acc.trimEnd();
                            }
                            return acc.trimStart() + printValue(curr, options, cache);
                        }
                        if (isLegacy && curr.typ == EnumToken.CommaTokenType) {
                            return acc.trimEnd() + " ";
                        }
                        if (curr.typ == EnumToken.WhitespaceTokenType) {
                            return acc.trimEnd() + " ";
                        }
                        if (curr.typ == EnumToken.CommaTokenType ||
                            (curr.typ == EnumToken.LiteralTokenType && curr.val == "/")) {
                            return acc.trimEnd() + (curr.typ == EnumToken.CommaTokenType ? "," : "/");
                        }
                        return (acc.trimEnd() +
                            (useAlpha && index == array.length - 1 ? "/" : " ") +
                            printValue(curr, options, cache));
                    }, "")
                        .trimStart() +
                    ")");
            }
        case EnumToken.UrlFunctionTokenType:
            if (options.minifyValues && token.typ === EnumToken.UrlFunctionTokenType) {
                if (token.chi[0]?.typ === EnumToken.BadUrlTokenType) {
                    return "url()";
                }
                for (const child of token.chi) {
                    if (child.typ === EnumToken.StringTokenType) {
                        if (child.val.slice(1, 5) !== "data:" &&
                            urlTokenMatcher.test(child.val)) {
                            Object.assign(child, {
                                typ: EnumToken.UrlTokenTokenType,
                                val: child.val.slice(1, -1),
                            });
                        }
                        break;
                    }
                }
            }
        case EnumToken.ParensTokenType:
        case EnumToken.FunctionTokenType:
        case EnumToken.MathFunctionTokenType:
        case EnumToken.ImageFunctionTokenType:
            if (options.minifyValues && token.typ === EnumToken.ImageFunctionTokenType) {
                const slice = token.chi.slice();
                switch (token.val) {
                    case "linear-gradient":
                    case "repeating-linear-gradient":
                        {
                            let i;
                            let k;
                            let j;
                            let key;
                            for (i = 0; i < slice.length; i++) {
                                if (slice[i].typ == EnumToken.ColorTokenType ||
                                    slice[i].typ === EnumToken.CommaTokenType) {
                                    break;
                                }
                                if (slice[i].typ == EnumToken.IdenTokenType &&
                                    equalsIgnoreCase(slice[i].val, "to")) {
                                    k = i + 1;
                                    while (k < slice.length &&
                                        (slice[k].typ === EnumToken.WhitespaceTokenType ||
                                            slice[k].typ === EnumToken.CommentTokenType)) {
                                        k++;
                                    }
                                    if (k < slice.length && slice[k].typ === EnumToken.IdenTokenType) {
                                        // convert keyword to angle
                                        key = slice[k].val.toLowerCase();
                                        switch (key) {
                                            case "right":
                                                slice.splice(i, k - i + 1, {
                                                    typ: EnumToken.AngleTokenType,
                                                    val: 90,
                                                });
                                                break;
                                            case "left":
                                                slice.splice(i, k - i + 1, {
                                                    typ: EnumToken.AngleTokenType,
                                                    val: 270,
                                                });
                                                break;
                                            case "top":
                                            case "bottom":
                                                j = k + 1;
                                                while (j < slice.length &&
                                                    (slice[j].typ === EnumToken.WhitespaceTokenType ||
                                                        slice[j].typ === EnumToken.CommentTokenType)) {
                                                    j++;
                                                }
                                                if (j < slice.length && slice[j].typ !== EnumToken.CommaTokenType) {
                                                    i = j - 1;
                                                    break;
                                                }
                                                // https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/gradient/linear-gradient#:~:text=If%20unspecified%2C%20it%20defaults%20to%20to%20bottom
                                                if (key === "bottom") {
                                                    // to bottom -> 180deg is the default angle and will be removed
                                                    while (k < slice.length &&
                                                        slice[k].typ != EnumToken.CommaTokenType) {
                                                        k++;
                                                    }
                                                    slice.splice(i, k - i + 1);
                                                    i--;
                                                    continue;
                                                }
                                                slice.splice(i, k - i + 1, {
                                                    typ: EnumToken.AngleTokenType,
                                                    val: key === "top" ? 0 : 180,
                                                });
                                                i--;
                                                break;
                                        }
                                    }
                                }
                                else if (slice[i].typ == EnumToken.AngleTokenType) {
                                    if ((180 - toDegrees(slice[i]).val) % 360 === 0) {
                                        k = i + 1;
                                        // while (k < slice.length && slice[k].typ !== EnumToken.CommaTokenType) {
                                        //     k++;
                                        // }
                                        slice.splice(i, k - i + 1);
                                    }
                                }
                            }
                            if (slice[i]?.typ === EnumToken.CommaTokenType) {
                                i++;
                                // while (
                                //     i < slice.length &&
                                //     (slice[i].typ === EnumToken.WhitespaceTokenType ||
                                //         slice[i].typ === EnumToken.CommentTokenType)
                                // ) {
                                //     i++;
                                // }
                            }
                            if (slice[i]?.typ === EnumToken.ColorTokenType) {
                                for (const token of reduceColorStops(slice.splice(i, slice.length - i))) {
                                    slice.push(token);
                                }
                            }
                        }
                        break;
                    case "radial-gradient":
                    case "repeating-radial-gradient":
                        {
                            let i = 0;
                            // while (
                            //     i < slice.length &&
                            //     (slice[i].typ === EnumToken.WhitespaceTokenType ||
                            //         slice[i].typ === EnumToken.CommentTokenType)
                            // ) {
                            //     i++;
                            // }
                            const positions = [];
                            const form = [];
                            const size = [];
                            const colorSpaceDef = [];
                            if (slice[i]?.typ === EnumToken.IdenTokenType) {
                                if (equalsIgnoreCase(slice[i].val, "farthest-corner") ||
                                    equalsIgnoreCase(slice[i].val, "ellipse")) {
                                    i++;
                                }
                                else if (equalsIgnoreCase(slice[i].val, "closest-side") ||
                                    equalsIgnoreCase(slice[i].val, "closest-corner") ||
                                    equalsIgnoreCase(slice[i].val, "farthest-side")) {
                                    size.push(slice[i++]);
                                }
                                else if (equalsIgnoreCase(slice[i].val, "circle")) {
                                    form.push(slice[i++]);
                                }
                                while (slice[i]?.typ === EnumToken.WhitespaceTokenType ||
                                    slice[i]?.typ === EnumToken.CommentTokenType) {
                                    i++;
                                }
                            }
                            if (slice[i]?.typ === EnumToken.IdenTokenType) {
                                if (equalsIgnoreCase(slice[i].val, "farthest-corner") ||
                                    equalsIgnoreCase(slice[i].val, "ellipse")) {
                                    i++;
                                }
                                else if (equalsIgnoreCase(slice[i].val, "closest-side") ||
                                    equalsIgnoreCase(slice[i].val, "closest-corner") ||
                                    equalsIgnoreCase(slice[i].val, "farthest-side")) {
                                    size.push(slice[i++]);
                                }
                                else if (equalsIgnoreCase(slice[i].val, "circle")) {
                                    form.push(slice[i++]);
                                }
                                while (slice[i]?.typ === EnumToken.WhitespaceTokenType ||
                                    slice[i]?.typ === EnumToken.CommentTokenType) {
                                    i++;
                                }
                            }
                            if (slice[i]?.typ === EnumToken.IdenTokenType &&
                                equalsIgnoreCase(slice[i].val, "at")) {
                                i++;
                            }
                            while (slice[i]?.typ === EnumToken.WhitespaceTokenType ||
                                slice[i]?.typ === EnumToken.CommentTokenType) {
                                i++;
                            }
                            if (slice[i]?.typ === EnumToken.PercentageTokenType ||
                                (slice[i]?.typ === EnumToken.NumberTokenType && 0 === slice[i].val) ||
                                (slice[i]?.typ === EnumToken.IdenTokenType &&
                                    (equalsIgnoreCase(slice[i].val, "center") ||
                                        equalsIgnoreCase(slice[i].val, "top") ||
                                        equalsIgnoreCase(slice[i].val, "bottom") ||
                                        equalsIgnoreCase(slice[i].val, "left") ||
                                        equalsIgnoreCase(slice[i].val, "right")))) {
                                do {
                                    if (slice[i]?.typ === EnumToken.IdenTokenType &&
                                        "in" === slice[i].val) {
                                        break;
                                    }
                                    positions.push(slice[i]);
                                    i++;
                                } while (slice[i]?.typ !== EnumToken.CommaTokenType);
                            }
                            while (slice[i]?.typ !== EnumToken.CommaTokenType) {
                                colorSpaceDef.push(slice[i++]);
                            }
                            if (slice[i]?.typ === EnumToken.CommaTokenType) {
                                i++;
                            }
                            if (positions.length > 0) {
                                let k;
                                let position1 = "";
                                let position2 = "";
                                for (k = 0; k < positions.length; k++) {
                                    if (positions[k].typ === EnumToken.IdenTokenType) {
                                        if (position1.length === 0) {
                                            position1 = positions[k].val;
                                        }
                                        else {
                                            position2 = positions[k].val;
                                        }
                                    }
                                    else if (positions[k].typ === EnumToken.PercentageTokenType ||
                                        positions[k].typ === EnumToken.NumberTokenType) {
                                        if (position1.length === 0) {
                                            position1 = positions[k].val + "%";
                                        }
                                        else {
                                            position2 = positions[k].val + "%";
                                        }
                                    }
                                    if (position2.length > 0) {
                                        break;
                                    }
                                }
                                if (position1.length > 0) {
                                    let key = `${position1} ${position2}`.trim();
                                    if (key === "50% 50%" ||
                                        key === "center center" ||
                                        key === "50%" ||
                                        key === "center") {
                                        positions.length = 0;
                                    }
                                    else if (key === "0% 0%" ||
                                        key === "0 0" ||
                                        key === "top left" ||
                                        key === "left top") {
                                        positions.splice(0, positions.length, {
                                            typ: EnumToken.PercentageTokenType,
                                            val: 0,
                                        });
                                    }
                                    else if (key === "50% 0%" ||
                                        key === "50% 0" ||
                                        key === "center top" ||
                                        key === "top center") {
                                        positions.splice(0, positions.length, {
                                            typ: EnumToken.IdenTokenType,
                                            val: "top",
                                        });
                                    }
                                    else if (key === "top right" || key === "right top") {
                                        positions.splice(0, positions.length, {
                                            typ: EnumToken.PercentageTokenType,
                                            val: 100,
                                        }, { typ: EnumToken.WhitespaceTokenType }, { typ: EnumToken.PercentageTokenType, val: 0 });
                                    }
                                    else if (key === "0 50%" ||
                                        key === "0% 50%" ||
                                        key === "left center" ||
                                        key === "center left") {
                                        positions.splice(0, positions.length, {
                                            typ: EnumToken.IdenTokenType,
                                            val: "left",
                                        });
                                    }
                                    else if (key === "100% 50%" || key === "right center" || key === "center right") {
                                        positions.splice(0, positions.length, {
                                            typ: EnumToken.IdenTokenType,
                                            val: "right",
                                        });
                                    }
                                    else if (key === "0 100%" ||
                                        key === "0% 100%" ||
                                        key === "left bottom" ||
                                        key === "bottom left") {
                                        positions.splice(0, positions.length, {
                                            typ: EnumToken.IdenTokenType,
                                            val: "bottom",
                                        });
                                    }
                                    else if (key === "50% 100%" ||
                                        key === "center bottom" ||
                                        key === "bottom center") {
                                        positions.splice(0, positions.length, {
                                            typ: EnumToken.IdenTokenType,
                                            val: "bottom",
                                        });
                                    }
                                    else if (key === "100% 100%" ||
                                        key === "right bottom" ||
                                        key === "bottom right") {
                                        positions.splice(0, positions.length, {
                                            typ: EnumToken.PercentageTokenType,
                                            val: 100,
                                        });
                                    }
                                    else if (position1 === position2) {
                                        positions.splice(0, positions.length, positions[k]);
                                    }
                                }
                            }
                            const result = [];
                            if (form.length > 0) {
                                for (const token of form) {
                                    result.push(token);
                                }
                            }
                            if (size.length > 0) {
                                if (result.length > 0) {
                                    result.push({ typ: EnumToken.WhitespaceTokenType });
                                }
                                for (const token of size) {
                                    result.push(token);
                                }
                            }
                            if (positions.length > 0) {
                                if (result.length > 0) {
                                    result.push({ typ: EnumToken.WhitespaceTokenType });
                                }
                                result.push({ typ: EnumToken.IdenTokenType, val: "at" }, { typ: EnumToken.WhitespaceTokenType });
                                for (const token of positions) {
                                    result.push(token);
                                }
                            }
                            if (colorSpaceDef.length > 0) {
                                if (result.length > 0) {
                                    result.push({ typ: EnumToken.WhitespaceTokenType });
                                }
                                for (const token of colorSpaceDef) {
                                    result.push(token);
                                }
                            }
                            if (result.length > 0) {
                                result.push({ typ: EnumToken.CommaTokenType });
                            }
                            for (const token of reduceColorStops(slice.slice(i))) {
                                result.push(token);
                            }
                            slice.length = 0;
                            for (const token of result) {
                                slice.push(token);
                            }
                        }
                        break;
                    case "conic-gradient":
                    case "repeating-conic-gradient":
                        {
                            let i = 0;
                            const angles = [];
                            const positions = [];
                            const colorSpaceDef = [];
                            // while (
                            //     i < slice.length &&
                            //     (slice[i].typ === EnumToken.WhitespaceTokenType ||
                            //         slice[i].typ === EnumToken.CommentTokenType)
                            // ) {
                            //     i++;
                            // }
                            if (slice[i]?.typ === EnumToken.IdenTokenType &&
                                equalsIgnoreCase(slice[i].val, "from")) {
                                angles.push(slice[i++]);
                                while (i < slice.length &&
                                    (slice[i].typ === EnumToken.WhitespaceTokenType ||
                                        slice[i].typ === EnumToken.CommentTokenType)) {
                                    angles.push(slice[i++]);
                                }
                                if ((slice[i]?.typ === EnumToken.NumberTokenType ||
                                    slice[i]?.typ === EnumToken.AngleTokenType) &&
                                    0 === toDegrees(slice[i]).val) {
                                    angles.length = 0;
                                    i++;
                                }
                                else if (slice[i]?.typ !== EnumToken.CommaTokenType &&
                                    slice[i].typ != EnumToken.IdenTokenType) {
                                    angles.push(slice[i++]);
                                }
                                while (i < slice.length &&
                                    (slice[i].typ === EnumToken.WhitespaceTokenType ||
                                        slice[i].typ === EnumToken.CommentTokenType)) {
                                    i++;
                                }
                            }
                            if (slice[i]?.typ === EnumToken.IdenTokenType &&
                                equalsIgnoreCase(slice[i].val, "at")) {
                                i++;
                                while (i < slice.length &&
                                    (slice[i].typ === EnumToken.WhitespaceTokenType ||
                                        slice[i].typ === EnumToken.CommentTokenType)) {
                                    i++;
                                }
                                let position1 = "";
                                let position2 = "";
                                if (slice[i]?.typ === EnumToken.IdenTokenType &&
                                    !equalsIgnoreCase("in", slice[i].val)) {
                                    position1 = slice[i].val;
                                    positions.push(slice[i++]);
                                }
                                else if (slice[i]?.typ === EnumToken.PercentageTokenType ||
                                    slice[i]?.typ === EnumToken.NumberTokenType) {
                                    position1 = slice[i].val + "%";
                                    positions.push(slice[i++]);
                                }
                                while (i < slice.length &&
                                    (slice[i].typ === EnumToken.WhitespaceTokenType ||
                                        slice[i].typ === EnumToken.CommentTokenType)) {
                                    positions.push(slice[i++]);
                                }
                                if (slice[i]?.typ === EnumToken.IdenTokenType &&
                                    !equalsIgnoreCase("in", slice[i].val)) {
                                    position2 = slice[i].val;
                                    positions.push(slice[i++]);
                                }
                                else if (slice[i]?.typ === EnumToken.PercentageTokenType ||
                                    slice[i]?.typ === EnumToken.NumberTokenType) {
                                    position2 = slice[i].val + "%";
                                    positions.push(slice[i++]);
                                }
                                while (i < slice.length &&
                                    (slice[i].typ === EnumToken.WhitespaceTokenType ||
                                        slice[i].typ === EnumToken.CommentTokenType)) {
                                    i++;
                                }
                                if (position1.length > 0) {
                                    reducegradientBackgroundPosition(positions, `${position1} ${position2}`.trim());
                                }
                            }
                            while (i < slice.length &&
                                (slice[i].typ === EnumToken.WhitespaceTokenType ||
                                    slice[i].typ === EnumToken.CommentTokenType)) {
                                i++;
                            }
                            if (slice[i]?.typ === EnumToken.IdenTokenType &&
                                equalsIgnoreCase("in", slice[i].val)) {
                                while (i < slice.length && slice[i].typ !== EnumToken.CommaTokenType) {
                                    colorSpaceDef.push(slice[i++]);
                                }
                            }
                            if (slice[i]?.typ === EnumToken.CommaTokenType) {
                                i++;
                            }
                            const result = [];
                            if (positions.length > 0) {
                                if (positions.length > 0) {
                                    if (angles.length > 0) {
                                        angles.push({ typ: EnumToken.WhitespaceTokenType });
                                    }
                                    angles.push({ typ: EnumToken.IdenTokenType, val: "at" }, { typ: EnumToken.WhitespaceTokenType });
                                    for (const position of positions) {
                                        angles.push(position);
                                    }
                                }
                            }
                            if (angles.length > 0) {
                                for (const angle of angles) {
                                    result.push(angle);
                                }
                                result.push({ typ: EnumToken.CommaTokenType });
                            }
                            if (colorSpaceDef.length > 0) {
                                if (colorSpaceDef.length > 0) {
                                    if (result.length > 0) {
                                        result.push({ typ: EnumToken.WhitespaceTokenType });
                                    }
                                    for (const token of colorSpaceDef) {
                                        result.push(token);
                                    }
                                }
                                result.push({ typ: EnumToken.CommaTokenType });
                            }
                            for (const token of reduceConicColorStops(slice.slice(i))) {
                                result.push(token);
                            }
                            slice.length = 0;
                            for (let j = 0; j < result.length; j++) {
                                slice.push(result[j]);
                            }
                        }
                        break;
                }
                return token.val + "(" + slice.reduce(reducer, "") + ")";
            }
        case EnumToken.TimingFunctionTokenType:
        case EnumToken.PseudoClassFuncTokenType:
        case EnumToken.WhenElseFunctionTokenType:
        case EnumToken.TimelineFunctionTokenType:
        case EnumToken.GridTemplateFuncTokenType:
        case EnumToken.SupportsFunctionTokenType:
        case EnumToken.ContainerFunctionTokenType:
        case EnumToken.TransformFunctionTokenType:
        case EnumToken.GeneralEnclosedFunctionTokenType:
        case EnumToken.CustomFunctionTokenType:
        case EnumToken.WildCardFunctionTokenType:
            if (token.typ == EnumToken.MathFunctionTokenType &&
                token.chi.length == 1 &&
                ![EnumToken.BinaryExpressionTokenType, EnumToken.FractionTokenType, EnumToken.IdenTokenType].includes(token.chi[0].typ) &&
                // @ts-ignore
                token.chi[0].val
                    ?.typ != EnumToken.FractionTokenType) {
                return (token.val +
                    "(" +
                    token.chi.reduce((acc, curr) => acc +
                        printValue(curr, token.typ == EnumToken.FunctionTokenType ? { minify: false } : options, cache, reducer), "") +
                    ")");
            }
            return (arena.getValue(token) ?? "") + "(" + arena.children(token).reduce(reducer, "") + ")";
        case EnumToken.BlockStartTokenType:
            return "{";
        case EnumToken.BlockEndTokenType:
            return "}";
        case EnumToken.StartParensTokenType:
            return "(";
        case EnumToken.DelimTokenType:
        case EnumToken.EqualMatchTokenType:
            return "=";
        case EnumToken.IncludeMatchTokenType:
            return "~=";
        case EnumToken.DashMatchTokenType:
            return "|=";
        case EnumToken.StartMatchTokenType:
            return "^=";
        case EnumToken.EndMatchTokenType:
            return "$=";
        case EnumToken.ContainMatchTokenType:
            return "*=";
        case EnumToken.LtTokenType:
            return "<";
        case EnumToken.LteTokenType:
            return "<=";
        case EnumToken.Tilda:
        case EnumToken.SubsequentSiblingCombinatorTokenType:
            return "~";
        case EnumToken.Plus:
        case EnumToken.NextSiblingCombinatorTokenType:
            return "+";
        case EnumToken.GtTokenType:
        case EnumToken.ChildCombinatorTokenType:
            return ">";
        case EnumToken.GteTokenType:
            return ">=";
        case EnumToken.ColumnCombinatorTokenType:
            return "||";
        case EnumToken.EndParensTokenType:
            return ")";
        case EnumToken.AttrStartTokenType:
            return "[";
        case EnumToken.AttrEndTokenType:
            return "]";
        case EnumToken.DescendantCombinatorTokenType:
        case EnumToken.WhitespaceTokenType:
            return " ";
        case EnumToken.ColonTokenType:
            return ":";
        case EnumToken.DoubleColonTokenType:
            return "::";
        case EnumToken.SemiColonTokenType:
            return ";";
        case EnumToken.CommaTokenType:
            return ",";
        case EnumToken.ImportantTokenType:
            return "!important";
        case EnumToken.Pipe:
            return "|";
        case EnumToken.AttrTokenType:
        case EnumToken.IdenListTokenType:
            return "[" + arena.children(token).reduce(reducer, "") + "]";
        case EnumToken.TimeTokenType:
        case EnumToken.AngleTokenType:
        case EnumToken.LengthTokenType:
        case EnumToken.DimensionTokenType:
        case EnumToken.FrequencyTokenType:
        case EnumToken.ResolutionTokenType:
            let val = arena.hasFlags(token, EnumAstNodeStatus.HasFractionValue) ?
                printValue(arena.getNumericValue(token), arena, options, cache)
                : minifyNumber(arena.getNumericValue(token));
            let unit = arena.getUnit(token);
            if (typ == EnumToken.AngleTokenType && !val.includes("/")) {
                const angle = getAngle(token, arena);
                let v;
                let value = val + unit;
                for (const u of ["deg", "turn", "rad", "grad"]) {
                    if (unit == u) {
                        continue;
                    }
                    switch (u) {
                        case "deg":
                            v = minifyNumber(toPrecisionAngle(angle * 360, anglePrecision, false).toFixed(anglePrecision));
                            if (v.length + 3 < value.length) {
                                val = v;
                                unit = u;
                                value = v + u;
                            }
                            break;
                        case "turn":
                            v = minifyNumber(toPrecisionAngle(angle, anglePrecision, false).toFixed(anglePrecision));
                            if (v.length + 4 < value.length) {
                                val = v;
                                unit = u;
                                value = v + u;
                            }
                            break;
                        case "rad":
                            v = minifyNumber(toPrecisionAngle(angle * (2 * Math.PI), anglePrecision, false).toFixed(anglePrecision));
                            if (v.length + 3 < value.length) {
                                val = v;
                                unit = u;
                                value = v + u;
                            }
                            break;
                        case "grad":
                            v = minifyNumber(toPrecisionAngle(angle * 400, anglePrecision, false).toFixed(anglePrecision));
                            if (v.length + 4 < value.length) {
                                val = v;
                                unit = u;
                                value = v + u;
                            }
                            break;
                    }
                }
            }
            if (val === "0") {
                if (typ == EnumToken.TimeTokenType) {
                    return "0s";
                }
                if (typ == EnumToken.FrequencyTokenType) {
                    return "0Hz";
                }
                // @ts-ignore
                if (typ == EnumToken.ResolutionTokenType) {
                    return "0x";
                }
                return "0";
            }
            if (typ == EnumToken.TimeTokenType) {
                if (unit == "ms") {
                    // @ts-ignore
                    const v = minifyNumber(val / 1000);
                    if (v.length + 1 <= val.length) {
                        return v + "s";
                    }
                    return val + "ms";
                }
                return val + "s";
            }
            if (typ == EnumToken.ResolutionTokenType && unit == "dppx") {
                unit = "x";
            }
            return val.includes("/") ? val.replace("/", unit + "/") : minifyNumber(toPrecisionValue(val)) + unit;
        case EnumToken.FlexTokenType:
        case EnumToken.PercentageTokenType:
            const uni = typ == EnumToken.PercentageTokenType ? "%" : "fr";
            const perc = arena.hasFlags(token, EnumAstNodeStatus.HasFractionValue)
                ? printValue(arena.getNumericValue(token), arena, options, cache)
                : minifyNumber(arena.getNumericValue(token));
            return options.minifyValues && perc == "0"
                ? "0"
                : perc.includes("/")
                    ? perc.replace("/", uni + "/")
                    : perc + uni;
        case EnumToken.NumberTokenType:
            return arena.hasFlags(token, EnumAstNodeStatus.HasFractionValue)
                ? printValue(arena.getNumericValue(token), arena, options, cache)
                : minifyNumber(arena.getNumericValue(token));
        case EnumToken.InfinityTokenType:
            return "1/0";
        case EnumToken.NegativeInfinityTokenType:
            return "-1/0";
        case EnumToken.NaNTokenType:
            return "NaN";
        case EnumToken.AtRuleTokenType:
            return "@" + arena.getName(token);
        case EnumToken.CommentTokenType:
        case EnumToken.CDOCOMMNodeType:
            if (options.removeComments && (!options.preserveLicense || !arena.startsWith(token, "val", "/*!"))) {
                return "";
            }
        case EnumToken.PseudoClassTokenType:
        case EnumToken.PseudoElementTokenType:
            // https://www.w3.org/TR/selectors-4/#single-colon-pseudos
            if (typ == EnumToken.PseudoElementTokenType) {
                let val = arena.getValue(token);
                let slice = val.slice(1);
                if (pseudoElements.includes(slice)) {
                    return slice;
                }
            }
        case EnumToken.UrlTokenTokenType:
        case EnumToken.HashTokenType:
        case EnumToken.IdenTokenType:
        case EnumToken.StringTokenType:
        case EnumToken.LiteralTokenType:
        case EnumToken.DashedIdenTokenType:
        case EnumToken.PseudoPageTokenType:
        case EnumToken.ClassSelectorTokenType:
            return arena.getValue(token);
        case EnumToken.NestingSelectorTokenType:
            return "&";
        case EnumToken.InvalidAttrTokenType:
            return ("[" +
                arena.children(token).reduce((acc, curr) => acc + printValue(curr, arena, options, cache), ""));
        case EnumToken.InvalidClassSelectorTokenType:
            return arena.getValue(token);
        case EnumToken.SupportsQueryUnaryConditionTokenType:
        case EnumToken.WhenElseUnaryConditionTokenType:
            return (printValue(arena.getLeft(token), arena, options, cache, reducer, errors) +
                " " +
                printValue(arena.getRight(token), arena, options, cache, reducer, errors));
        case EnumToken.SupportsQueryConditionTokenType:
        case EnumToken.WhenElseQueryConditionTokenType:
            return (printValue(arena.getLeft(token), arena, options, cache, reducer, errors) +
                " " +
                printValue(arena.getOp(token), arena, options, cache, reducer, errors) +
                " " +
                printValue(arena.getRight(token), arena, options, cache, reducer, errors));
        case EnumToken.IfConditionTokenType:
            return token.l.length == 0
                ? ""
                : token.l.reduce((acc, curr) => acc + printValue(curr, options, cache, reducer, errors), "") +
                    ":" +
                    (options.indent ?? "") +
                    token.r.reduce((acc, curr) => acc + printValue(curr, options, cache, reducer, errors), "");
        case EnumToken.IfElseConditionTokenType:
            return (printValue(token.l, options, cache, reducer, errors) +
                (options.indent ?? "") +
                printValue(token.r, options, cache, reducer, errors));
        case EnumToken.DeclarationNodeType:
            return (arena.getName(token) +
                ":" +
                (options.minifyValues ? filterValues(arena.children(token), arena) : arena.children(token)).reduce((acc, curr) => acc + printValue(curr, arena, options, cache, reducer, errors), ""));
        case EnumToken.MediaQueryUnaryFeatureTokenType:
            return (printValue(arena.getLeft(token), arena, options, cache, reducer, errors) +
                " " +
                printValue(arena.getRight(token), arena, options, cache, reducer, errors));
        case EnumToken.MediaQueryConditionTokenType: {
            const indent = token.op.typ == EnumToken.LtTokenType ||
                token.op.typ == EnumToken.GtTokenType ||
                token.op.typ == EnumToken.ColonTokenType ||
                token.op.typ == EnumToken.DelimTokenType ||
                token.op.typ == EnumToken.LteTokenType ||
                token.op.typ == EnumToken.GteTokenType
                ? ""
                : " ";
            return (token.l.reduce((acc, curr) => acc + printValue(curr, options, cache, reducer, errors), "") +
                indent +
                printValue(token.op, options, cache, reducer, errors) +
                indent +
                token.r.reduce((acc, curr) => acc + printValue(curr, options, cache, reducer, errors), ""));
        }
        case EnumToken.MediaRangeQueryTokenType:
            return (token.l.reduce((acc, curr) => acc + printValue(curr, options, cache, reducer, errors), "") +
                printValue(token.op1, options, cache, reducer, errors) +
                token.val.reduce((acc, curr) => acc + printValue(curr, options, cache, reducer, errors), "") +
                printValue(token.op2, options, cache, reducer, errors) +
                token.r.reduce((acc, curr) => acc + printValue(curr, options, cache, reducer, errors), ""));
        case EnumToken.MediaFeatureTokenType:
            return arena.getValue(token);
        case EnumToken.NotTokenType:
            return "not";
        case EnumToken.OnlyTokenType:
            return "only";
        case EnumToken.AndTokenType:
            return "and";
        case EnumToken.OrTokenType:
            return "or";
        case EnumToken.InvalidMediaQueryTokenType:
        case EnumToken.InvalidCommentTokenType:
        case EnumToken.BadCommentTokenType:
        case EnumToken.BadCdoTokenType:
        case EnumToken.BadStringTokenType:
        case EnumToken.BadUrlTokenType:
        case EnumToken.EOFTokenType:
            return "";
        default:
            console.debug({ token });
            throw new Error(`Unsupported token type for ${EnumToken[typ]}`);
    }
    // errors?.push({ action: "ignore", message: `render: unexpected token ${JSON.stringify(token, null, 1)}` });
    // return "";
}
/**
 * Remove whitespace tokens that are not needed
 * @param values
 *
 * @internal
 */
function filterValues(values, arena) {
    let i = 0;
    let typ;
    for (; i < values.length; i++) {
        typ = arena.getType(values[i]);
        if (typ == EnumToken.ImportantTokenType && arena.getType(values[i - 1]) === EnumToken.WhitespaceTokenType) {
            values.splice(i - 1, 1);
        }
        else if (tokensfuncSet.has(typ) &&
            arena.hasFlags(values[i], EnumAstNodeStatus.HasChildren) &&
            typ != EnumToken.WildCardFunctionTokenType &&
            arena.getType(values[i + 1]) == EnumToken.WhitespaceTokenType) {
            values.splice(i + 1, 1);
        }
    }
    return values;
}

export { filterValues, printValue };
