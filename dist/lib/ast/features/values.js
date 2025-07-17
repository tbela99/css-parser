import { EnumToken } from '../types.js';
import { renderToken } from '../../renderer/render.js';
import { colorsFunc, colorFuncColorSpace, ColorKind, COLORS_NAMES } from '../../renderer/color/utils/constants.js';
import { getComponents } from '../../renderer/color/utils/components.js';
import { isColor, parseColor } from '../../syntax/syntax.js';
import { walkValues } from '../walk.js';
import { clamp, reduceNumber, filterValues } from '../utils/utils.js';
import { color2srgbvalues } from '../../renderer/color/color.js';
import { reduceHexValue, srgb2hexvalues, rgb2hex, hsl2hex, hwb2hex, cmyk2hex, oklab2hex, oklch2hex, lab2hex, lch2hex } from '../../renderer/color/hex.js';
import '../minify.js';
import '../../parser/parse.js';
import '../../parser/tokenize.js';
import '../../parser/utils/config.js';
import { colorMix } from '../../renderer/color/color-mix.js';
import { parseRelativeColor } from '../../renderer/color/relativecolor.js';

function replaceNode(node, replacement, parent) {
    if ('chi' in parent || 'val' in parent) {
        // @ts-ignore
        const chi = parent.chi ?? parent.val;
        for (let i = 0; i < chi.length; i++) {
            // @ts-ignore
            if (chi[i] == node) {
                // @ts-ignore
                chi.splice(i, 1, replacement);
                break;
            }
        }
    }
    else if ('l' in parent && node == parent.l) {
        // @ts-ignore
        parent.l = replacement;
    }
    else if ('r' in parent) {
        if (node == parent.r) {
            // @ts-ignore
            parent.r = replacement;
        }
        else if (Array.isArray(parent.r)) {
            for (let i = 0; i < parent.r.length; i++) {
                if (parent.r[i] == node) {
                    // @ts-ignore
                    parent.r.splice(i, 1, replacement);
                    break;
                }
            }
        }
    }
}
class ValuesFeature {
    get ordering() {
        return 6;
    }
    get preProcess() {
        return false;
    }
    get postProcess() {
        return true;
    }
    static register(options) {
        if (options.minify) {
            // @ts-ignore
            options.features.push(new ValuesFeature());
        }
    }
    run(ast, options = {}, parent, context) {
        if (ast.typ != EnumToken.DeclarationNodeType) {
            return;
        }
        for (const { value: token, parent } of walkValues(ast.val, ast)) {
            if (options.parseColor) {
                if (token.typ == EnumToken.FunctionTokenType && colorsFunc.includes(token.val)) {
                    if (isColor(token)) {
                        parseColor(token);
                        // // @ts-ignore
                        // token.typ = EnumToken.ColorTokenType;
                        //
                        // // @ts-ignore
                        // if ((token as ColorToken)!.chi[0]!.typ == EnumToken.IdenTokenType && ((token as ColorToken)!.chi[0] as IdentToken).val == 'from') {
                        //
                        //     // @ts-ignore
                        //     (<ColorToken>token).cal = 'rel';
                        // } else { // @ts-ignore
                        //     if ((token as ColorToken).val == 'color-mix' && (token as ColorToken).chi[0].typ == EnumToken.IdenTokenType && ((token as ColorToken).chi[0] as IdentToken).val == 'in') {
                        //
                        //         // @ts-ignore
                        //         (<ColorToken>token).cal = 'mix';
                        //     } else {
                        //
                        //         // @ts-ignore
                        //         if ((token as ColorToken).val == 'color') {
                        //             // @ts-ignore
                        //             token.cal = 'col';
                        //         }
                        //
                        //         // @ts-ignore
                        //         (token as ColorToken).chi = (token as ColorToken).chi!.filter((t: Token) => ![EnumToken.WhitespaceTokenType, EnumToken.CommaTokenType, EnumToken.CommentTokenType].includes(t.typ));
                        //     }
                        // }
                    }
                }
            }
            switch (token.typ) {
                case EnumToken.FractionTokenType:
                    const fraction = renderToken(token.l) + '/' + renderToken(token.r);
                    if (+token.r.val != 0) {
                        const value = reduceNumber(+token.l.val / +token.r.val);
                        if (value.length <= fraction.length) {
                            replaceNode(token, {
                                typ: EnumToken.NumberTokenType,
                                val: value
                            }, parent);
                        }
                    }
                    break;
                case EnumToken.ColorTokenType:
                    if (!options.convertColor) {
                        break;
                    }
                    if ('light-dark'.localeCompare(token.val, undefined, { sensitivity: 'base' }) == 0) {
                        break;
                    }
                    if (token.cal == 'mix' && token.val == 'color-mix') {
                        const children = token.chi.reduce((acc, t) => {
                            if (t.typ == EnumToken.ColorTokenType) {
                                acc.push([t]);
                            }
                            else {
                                if (![EnumToken.WhitespaceTokenType, EnumToken.CommentTokenType, EnumToken.CommaTokenType].includes(t.typ)) {
                                    acc[acc.length - 1].push(t);
                                }
                            }
                            return acc;
                        }, [[]]);
                        const value = colorMix(children[0][1], children[0][2], children[1][0], children[1][1], children[2][0], children[2][1]);
                        if (value != null) {
                            Object.assign(token, value);
                            delete token.cal;
                        }
                        else if (!token.chi.some(t => t.typ == EnumToken.CommaTokenType)) {
                            token.chi = children.reduce((acc, curr, index) => {
                                if (acc.length > 0) {
                                    acc.push({ typ: EnumToken.CommaTokenType });
                                }
                                acc.push(...curr);
                                return acc;
                            }, []);
                        }
                    }
                    if (token.cal == 'rel' && ['rgb', 'hsl', 'hwb', 'lab', 'lch', 'oklab', 'oklch', 'color'].includes(token.val.toLowerCase())) {
                        const chi = getComponents(token);
                        const offset = token.val == 'color' ? 2 : 1;
                        if (chi != null) {
                            // @ts-ignore
                            const color = chi[1];
                            const components = parseRelativeColor(token.val == 'color' ? chi[offset].val : token.val, color, chi[offset + 1], chi[offset + 2], chi[offset + 3], chi[offset + 4]);
                            if (components != null) {
                                token.chi = [...(token.val == 'color' ? [chi[offset]] : []), ...Object.values(components)];
                                delete token.cal;
                            }
                        }
                    }
                    if ('color'.localeCompare(token.val, undefined, { sensitivity: 'base' }) == 0) {
                        if (token.chi[0].typ == EnumToken.IdenTokenType && colorFuncColorSpace.includes(token.chi[0].val.toLowerCase())) {
                            const values = color2srgbvalues(token);
                            if (Array.isArray(values) && values.every(t => !Number.isNaN(t))) {
                                const replacement = {
                                    typ: EnumToken.ColorTokenType,
                                    // @ts-ignore
                                    val: reduceHexValue(srgb2hexvalues(...values)),
                                    kin: ColorKind.HEX
                                };
                                if (replacement.val.at(0) != '#') {
                                    replacement.kin = ColorKind.LIT;
                                }
                                replaceNode(token, replacement, parent);
                            }
                        }
                    }
                    if (token.cal != null) {
                        let slice = false;
                        if (token.cal == 'rel') {
                            const last = token.chi.at(-1);
                            if ((last.typ == EnumToken.NumberTokenType && last.val == '1') || (last.typ == EnumToken.IdenTokenType && last.val == 'none')) {
                                const prev = token.chi.at(-2);
                                if (prev.typ == EnumToken.LiteralTokenType && prev.val == '/') {
                                    slice = true;
                                }
                            }
                        }
                        clamp(token);
                        token.chi = (slice ? token.chi.slice(0, -2) : token.chi).reduce((acc, curr) => {
                            if (curr.typ == EnumToken.LiteralTokenType || curr.typ == EnumToken.CommaTokenType || curr.typ == EnumToken.WhitespaceTokenType) {
                                if (acc.at(-1)?.typ == EnumToken.WhitespaceTokenType) {
                                    acc.pop();
                                }
                                if (curr.typ == EnumToken.WhitespaceTokenType && [EnumToken.LiteralTokenType, EnumToken.CommaTokenType, EnumToken.WhitespaceTokenType].includes(acc.at(-1)?.typ)) {
                                    return acc;
                                }
                                return acc.concat([curr]);
                            }
                            if (acc.length > 0 && ![EnumToken.LiteralTokenType, EnumToken.CommaTokenType, EnumToken.WhitespaceTokenType].includes(acc.at(-1)?.typ)) {
                                acc.push({ typ: EnumToken.WhitespaceTokenType });
                            }
                            return acc.concat([curr]);
                        }, []);
                    }
                    if (token.kin == ColorKind.LIT && token.val.localeCompare('currentcolor', undefined, { sensitivity: 'base' }) == 0) {
                        break;
                    }
                    clamp(token);
                    if (Array.isArray(token.chi) && token.chi.some((t) => t.typ == EnumToken.FunctionTokenType || (t.typ == EnumToken.ColorTokenType && Array.isArray(t.chi)))) {
                        const replaceSemiColon = /^((rgba?)|(hsla?)|(hwb)|((ok)?lab)|((ok)?lch))$/i.test(token.val);
                        if (/a$/i.test(token.val)) {
                            token.val = token.val.slice(0, -1);
                        }
                        token.chi = token.chi.reduce((acc, curr, index, array) => {
                            if (curr.typ == EnumToken.LiteralTokenType || curr.typ == EnumToken.CommaTokenType || curr.typ == EnumToken.WhitespaceTokenType) {
                                if (acc.at(-1)?.typ == EnumToken.WhitespaceTokenType) {
                                    acc.pop();
                                }
                                if (curr.typ == EnumToken.WhitespaceTokenType && [EnumToken.LiteralTokenType, EnumToken.CommaTokenType, EnumToken.WhitespaceTokenType].includes(acc.at(-1)?.typ)) {
                                    return acc;
                                }
                                return acc.concat([curr.typ == EnumToken.CommaTokenType && replaceSemiColon ? { typ: EnumToken.WhitespaceTokenType } : curr]);
                            }
                            if (acc.length > 0 && ![EnumToken.LiteralTokenType, EnumToken.CommaTokenType, EnumToken.WhitespaceTokenType].includes(acc.at(-1)?.typ)) {
                                acc.push({ typ: EnumToken.WhitespaceTokenType });
                            }
                            return acc.concat([curr]);
                        }, []);
                        // break;
                    }
                    let value = token.kin == ColorKind.HEX ? token.val.toLowerCase() : (token.kin == ColorKind.LIT ? COLORS_NAMES[token.val.toLowerCase()] : '');
                    const val = token.val.toLowerCase();
                    if (/rgba?/i.test(val)) {
                        value = rgb2hex(token);
                    }
                    else if (/hsla?/i.test(val)) {
                        value = hsl2hex(token);
                    }
                    else if (val == 'hwb') {
                        value = hwb2hex(token);
                    }
                    else if (val == 'device-cmyk') {
                        value = cmyk2hex(token);
                    }
                    else if (val == 'oklab') {
                        value = oklab2hex(token);
                    }
                    else if (val == 'oklch') {
                        value = oklch2hex(token);
                    }
                    else if (val == 'lab') {
                        value = lab2hex(token);
                    }
                    else if (val == 'lch') {
                        value = lch2hex(token);
                    }
                    if (value !== '' && value != null) {
                        const replacement = {
                            typ: EnumToken.ColorTokenType,
                            kin: ColorKind.HEX,
                            val: value
                        };
                        if (replacement.val.at(0) != '#') {
                            replacement.kin = ColorKind.LIT;
                        }
                        else {
                            replacement.val = reduceHexValue(replacement.val);
                        }
                        replaceNode(token, replacement, parent);
                        break;
                    }
                    if (Array.isArray(token.chi)) {
                        if (/a$/.test(token.val)) {
                            token.val = token.val.slice(0, -1);
                        }
                    }
                    break;
            }
        }
        filterValues(ast.val);
    }
}

export { ValuesFeature };
