import { EnumToken } from '../../ast/types.js';
import '../../ast/minify.js';
import '../../parser/parse.js';
import { lch2rgb, lab2rgb, oklch2rgb, oklab2rgb, hwb2rgb, hsl2rgb, hex2rgb } from './rgb.js';
import { lch2hsl, lab2hsl, oklch2hsl, oklab2hsl, hwb2hsl, hex2hsl, rgb2hsl } from './hsl.js';
import { lch2hwb, lab2hwb, oklch2hwb, oklab2hwb, hsl2hwb, rgb2hwb } from './hwb.js';
import './utils/constants.js';
import '../sourcemap/lib/encode.js';

function convert(token, to) {
    if (token.kin == to) {
        return token;
    }
    // console.error({token, to});
    let values = [];
    let chi;
    if (to == 'hsl') {
        switch (token.kin) {
            case 'rgb':
            case 'rgba':
                values.push(...rgb2hsl(token));
                break;
            case 'hex':
            case 'lit':
                values.push(...hex2hsl(token));
                break;
            case 'hwb':
                values.push(...hwb2hsl(token));
                break;
            case 'oklab':
                values.push(...oklab2hsl(token));
                break;
            case 'oklch':
                values.push(...oklch2hsl(token));
                break;
            case 'lab':
                values.push(...lab2hsl(token));
                break;
            case 'lch':
                values.push(...lch2hsl(token));
                break;
        }
        if (values.length > 0) {
            chi = [
                { typ: EnumToken.AngleTokenType, val: String(values[0] * 360), unit: 'deg' },
                { typ: EnumToken.PercentageTokenType, val: String(values[1] * 100) },
                { typ: EnumToken.PercentageTokenType, val: String(values[2] * 100) },
            ];
            if (values.length == 4) {
                chi.push({ typ: EnumToken.PercentageTokenType, val: String(values[3] * 100) });
            }
            return {
                typ: EnumToken.ColorTokenType,
                val: 'hsl',
                chi,
                kin: 'hsl'
            };
        }
    }
    else if (to == 'hwb') {
        switch (token.kin) {
            case 'rgb':
            case 'rgba':
                values.push(...rgb2hwb(token));
                break;
            case 'hex':
            case 'lit':
                values.push(...hex2hsl(token));
                break;
            case 'hsl':
            case 'hsla':
                values.push(...hsl2hwb(token));
                break;
            case 'oklab':
                values.push(...oklab2hwb(token));
                break;
            case 'oklch':
                values.push(...oklch2hwb(token));
                break;
            case 'lab':
                values.push(...lab2hwb(token));
                break;
            case 'lch':
                values.push(...lch2hwb(token));
                break;
        }
        if (values.length > 0) {
            chi = [
                { typ: EnumToken.AngleTokenType, val: String(values[0] * 360), unit: 'deg' },
                { typ: EnumToken.PercentageTokenType, val: String(values[1] * 100) },
                { typ: EnumToken.PercentageTokenType, val: String(values[2] * 100) },
            ];
            if (values.length == 4) {
                chi.push({ typ: EnumToken.PercentageTokenType, val: String(values[3] * 100) });
            }
            return {
                typ: EnumToken.ColorTokenType,
                val: 'hsl',
                chi,
                kin: 'hsl'
            };
        }
    }
    else if (to == 'rgb') {
        switch (token.kin) {
            case 'hex':
            case 'lit':
                values.push(...hex2rgb(token));
                break;
            case 'hsl':
                values.push(...hsl2rgb(token));
                break;
            case 'hwb':
                values.push(...hwb2rgb(token));
                break;
            case 'oklab':
                values.push(...oklab2rgb(token));
                break;
            case 'oklch':
                values.push(...oklch2rgb(token));
                break;
            case 'lab':
                values.push(...lab2rgb(token));
                break;
            case 'lch':
                values.push(...lch2rgb(token));
                break;
        }
        if (values.length > 0) {
            chi = [
                { typ: EnumToken.NumberTokenType, val: String(values[0]) },
                { typ: EnumToken.NumberTokenType, val: String(values[1]) },
                { typ: EnumToken.NumberTokenType, val: String(values[2]) },
            ];
            if (values.length == 4) {
                chi.push({ typ: EnumToken.PercentageTokenType, val: String(values[3] * 100) });
            }
            return {
                typ: EnumToken.ColorTokenType,
                val: 'rgb',
                chi,
                kin: 'rgb'
            };
        }
    }
    return null;
}
function minmax(value, min, max) {
    return Math.min(Math.max(value, min), max);
}
/**
 * clamp color values
 * @param token
 */
function clamp(token) {
    if (token.kin == 'rgb' || token.kin == 'rgba') {
        token.chi.filter((token) => ![EnumToken.LiteralTokenType, EnumToken.CommaTokenType, EnumToken.WhitespaceTokenType].includes(token.typ)).forEach((token, index) => {
            if (index <= 2) {
                if (token.typ == EnumToken.NumberTokenType) {
                    token.val = String(minmax(+token.val, 0, 255)); // String(Math.min(255, Math.max(0, +token.val)));
                }
                else if (token.typ == EnumToken.PercentageTokenType) {
                    token.val = String(minmax(+token.val, 0, 100)); // String(Math.min(100, Math.max(0, +token.val)));
                }
            }
            else {
                if (token.typ == EnumToken.NumberTokenType) {
                    token.val = String(minmax(+token.val, 0, 1)); // String(Math.min(1, Math.max(0, +token.val)));
                }
                else if (token.typ == EnumToken.PercentageTokenType) {
                    token.val = String(minmax(+token.val, 0, 100)); // String(Math.min(100, Math.max(0, +token.val)));
                }
            }
        });
    }
    return token;
}
function clampValues(values, colorSpace) {
    switch (colorSpace) {
        case 'srgb':
        // case 'oklab':
        case 'display-p3':
        case 'srgb-linear':
            // case 'prophoto-rgb':
            // case 'a98-rgb':
            // case 'rec2020':
            for (let i = 0; i < values.length; i++) {
                values[i] = Math.min(1, Math.max(0, values[i]));
            }
    }
    return values;
}
function getNumber(token) {
    if (token.typ == EnumToken.IdenTokenType && token.val == 'none') {
        return 0;
    }
    // @ts-ignore
    return token.typ == EnumToken.PercentageTokenType ? token.val / 100 : +token.val;
}
function getAngle(token) {
    if (token.typ == EnumToken.IdenTokenType) {
        if (token.val == 'none') {
            return 0;
        }
    }
    if (token.typ == EnumToken.AngleTokenType) {
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

export { clamp, clampValues, convert, getAngle, getNumber, minmax };
