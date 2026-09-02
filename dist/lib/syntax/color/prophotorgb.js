import { XYZ_D65_to_D50, xyzd502srgb } from './xyzd50.js';
import { srgb2xyz } from './xyz.js';

function prophotorgb2srgbvalues(r, g, b, a = null) {
    let values = prophotorgb2xyz50(r, g, b);
    // @ts-ignore
    return xyzd502srgb(values[0], values[1], values[2], a);
}
function srgb2prophotorgbvalues(r, g, b, a) {
    let values = srgb2xyz(r, g, b);
    values = XYZ_D65_to_D50(values[0], values[1], values[2]);
    values = xyz50_to_prophotorgb(values[0], values[1], values[2]);
    if (a != null && a < 1) {
        values.push(a);
    }
    return values;
}
function prophotorgb2lin_ProPhoto(r, g, b, a = null) {
    return [r, g, b]
        .map((v) => {
        let abs = Math.abs(v);
        if (abs >= 16 / 512) {
            return Math.sign(v) * Math.pow(abs, 1.8);
        }
        return v / 16;
    })
        .concat(a == null || a == 1 ? [] : [a]);
}
function prophotorgb2xyz50(r, g, b, a = null) {
    [r, g, b, a] = prophotorgb2lin_ProPhoto(r, g, b, a);
    const xyz = [
        0.7977666449006423 * r + 0.1351812974005331 * g + 0.0313477341283922 * b,
        0.2880748288194013 * r + 0.7118352342418731 * g + 0.0000899369387256 * b,
        0.8251046025104602 * b,
    ];
    return xyz.concat(a == null || a == 1 ? [] : [a]);
}
function xyz50_to_prophotorgb(x, y, z, a) {
    // @ts-ignore
    return gam_prophotorgb(x * 1.3457868816471585 - y * 0.2555720873797946 - 0.0511018649755453 * z, x * -0.5446307051249019 + y * 1.5082477428451466 + 0.0205274474364214 * z, 1.2119675456389452 * z);
}
function gam_prophotorgbvalue(v) {
    let abs = Math.abs(v);
    if (abs >= 1 / 512) {
        return Math.sign(v) * Math.pow(abs, 1 / 1.8);
    }
    return 16 * v;
}
function gam_prophotorgb(r, g, b, a) {
    const values = [gam_prophotorgbvalue(r), gam_prophotorgbvalue(g), gam_prophotorgbvalue(b)];
    return values;
}

export { prophotorgb2srgbvalues, srgb2prophotorgbvalues };
