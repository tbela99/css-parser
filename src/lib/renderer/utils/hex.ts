import {ColorToken, DimensionToken, NumberToken, PercentageToken} from "../../../@types";
import {EnumToken} from "../../ast";
import {getAngle, getNumber, NAMES_COLORS} from "./color";
import {hsl2rgb} from "./rgb";

export function reduceHexValue(value: string): string {

    const named_color: string = NAMES_COLORS[expandHexValue(value)];

    if (value.length == 7) {

        if (value[1] == value[2] &&
            value[3] == value[4] &&
            value[5] == value[6]) {

            value = `#${value[1]}${value[3]}${value[5]}`;
        }
    } else if (value.length == 9) {

        if (value[1] == value[2] &&
            value[3] == value[4] &&
            value[5] == value[6] &&
            value[7] == value[8]) {

            value = `#${value[1]}${value[3]}${value[5]}${value[7]}`;
        }
    }

    return named_color != null && named_color.length <= value.length ? named_color : value;
}

export function expandHexValue(value: string): string {

    if (value.length == 4) {

        return `#${value[1]}${value[1]}${value[2]}${value[2]}${value[3]}${value[3]}`;
    }

    if (value.length == 5) {

        return `#${value[1]}${value[1]}${value[2]}${value[2]}${value[3]}${value[3]}${value[4]}${value[4]}`;
    }

    return value;
}


export function rgb2Hex(token: ColorToken) {

    let value: string = '#';
    let t: NumberToken | PercentageToken;

    // @ts-ignore
    for (let i = 0; i < 3; i++) {

        // @ts-ignore
        t = token.chi[i];

        // @ts-ignore
        value += (t.val == 'none' ? '0' : Math.round(t.typ == EnumToken.PercentageTokenType ? 255 * t.val / 100 : t.val)).toString(16).padStart(2, '0')
    }

    // @ts-ignore
    if (token.chi.length == 4) {

        // @ts-ignore
        t = token.chi[3];

        // @ts-ignore
        if ((t.typ == EnumToken.IdenTokenType && t.val == 'none') ||
            (t.typ == EnumToken.NumberTokenType && +t.val < 1) ||
            (t.typ == EnumToken.PercentageTokenType && +t.val < 100)) {

            // @ts-ignore
            value += Math.round(255 * getNumber(t)).toString(16).padStart(2, '0')
        }
    }

    return value;
}

export function hsl2Hex(token: ColorToken) {

    let t: PercentageToken | NumberToken;

    // @ts-ignore
    let h: number = getAngle(<NumberToken | DimensionToken>token.chi[0]);

    // @ts-ignore
    t = <NumberToken | DimensionToken>token.chi[1];
    // @ts-ignore
    let s: number = getNumber(t);
    // @ts-ignore
    t = <NumberToken | DimensionToken>token.chi[2];
    // @ts-ignore
    let l: number = getNumber(t);

    let a = null;

    if (token.chi?.length == 4) {

        // @ts-ignore
        t = token.chi[3];

        // @ts-ignore
        if ((t.typ == EnumToken.IdenTokenType && t.val == 'none') ||(
                t.typ == EnumToken.PercentageTokenType && +t.val < 100) ||
            // @ts-ignore
            (t.typ == EnumToken.NumberTokenType && t.val < 1)) {

            // @ts-ignore
            a = getNumber(t);
        }
    }

    return `#${hsl2rgb(h, s, l, a).reduce((acc: string, curr: number) => acc + curr.toString(16).padStart(2, '0'), '')}`;
}

export function hwb2hex(token: ColorToken) {

    let t: PercentageToken | NumberToken;

    // @ts-ignore
    let h: number = getAngle(<NumberToken | DimensionToken>token.chi[0]);

    // @ts-ignore
    t = <NumberToken | DimensionToken>token.chi[1];
    // @ts-ignore
    let white: number = getNumber(t);
    // @ts-ignore
    t = <NumberToken | DimensionToken>token.chi[2];
    // @ts-ignore
    let black: number = getNumber(t);

    let a = null;

    if (token.chi?.length == 4) {

        // @ts-ignore
        t = token.chi[3];

        // @ts-ignore
        if ((t.typ == EnumToken.IdenTokenType && t.val  == 'none') ||
            (t.typ == EnumToken.PercentageTokenType && +t.val < 100) ||
            (t.typ == EnumToken.NumberTokenType && +t.val < 1)) {

            // @ts-ignore
            a = getNumber(t);
        }
    }

    const rgb: number[] = hsl2rgb(h, 1, .5, a);

    let value: number;

    for (let i = 0; i < 3; i++) {

        value = rgb[i] / 255;
        value *= (1 - white - black);
        value += white;

        rgb[i] = Math.round(value * 255);
    }

    return `#${rgb.reduce((acc: string, curr: number) => acc + curr.toString(16).padStart(2, '0'), '')}`;
}

export function cmyk2hex(token: ColorToken) {

    // @ts-ignore
    let t: NumberToken | PercentageToken = <NumberToken | PercentageToken>token.chi[0];

    // @ts-ignore
    const c: number = getNumber(t);

    // @ts-ignore
    t = <NumberToken | PercentageToken>token.chi[1];

    // @ts-ignore
    const m: number = getNumber(t);

    // @ts-ignore
    t = <NumberToken | PercentageToken>token.chi[2];

    // @ts-ignore
    const y: number = getNumber(t);

    // @ts-ignore
    t = <NumberToken | PercentageToken>token.chi[3];

    // @ts-ignore
    const k: number = getNumber(t);

    const rgb: number[] = [
        Math.round(255 * (1 - Math.min(1, c * (1 - k) + k))),
        Math.round(255 * (1 - Math.min(1, m * (1 - k) + k))),
        Math.round(255 * (1 - Math.min(1, y * (1 - k) + k)))
    ];

    // @ts-ignore
    if (token.chi.length >= 9) {

        // @ts-ignore
        t = <NumberToken | PercentageToken>token.chi[8];

        // @ts-ignore
        rgb.push(Math.round(255 * getNumber(t)));
    }

    return `#${rgb.reduce((acc: string, curr: number) => acc + curr.toString(16).padStart(2, '0'), '')}`;
}
