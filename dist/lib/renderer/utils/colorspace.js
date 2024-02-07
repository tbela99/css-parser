function roundWithPrecision(value, original) {
    return +value.toFixed(original.toString().split('.')[1]?.length ?? 0);
}
// from https://www.w3.org/TR/css-color-4/#color-conversion-code
// srgb-linear -> srgb
// 0 <= r, g, b <= 1
function gam_sRGB(r, g, b) {
    // convert an array of linear-light sRGB values in the range 0.0-1.0
    // to gamma corrected form
    // https://en.wikipedia.org/wiki/SRGB
    // Extended transfer function:
    // For negative values, linear portion extends on reflection
    // of axis, then uses reflected pow below that
    return [r, g, b].map(function (val) {
        let sign = val < 0 ? -1 : 1;
        let abs = Math.abs(val);
        if (abs > 0.0031308) {
            return roundWithPrecision(sign * (1.055 * Math.pow(abs, 1 / 2.4) - 0.055), val);
        }
        return roundWithPrecision(12.92 * val, val);
    });
}
function gam_ProPhoto(r, g, b) {
    // convert an array of linear-light prophoto-rgb  in the range 0.0-1.0
    // to gamma corrected form
    // Transfer curve is gamma 1.8 with a small linear portion
    // TODO for negative values, extend linear portion on reflection of axis, then add pow below that
    const Et = 1 / 512;
    return [r, g, b].map(function (val) {
        let sign = val < 0 ? -1 : 1;
        let abs = Math.abs(val);
        if (abs >= Et) {
            return roundWithPrecision(sign * Math.pow(abs, 1 / 1.8), val);
        }
        return roundWithPrecision(16 * val, val);
    });
}

export { gam_ProPhoto, gam_sRGB };
