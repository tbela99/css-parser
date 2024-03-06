import { lsrgb2srgb, prophotoRgb2lsrgb } from './srgb.js';

function prophotoRgb2srgbvalues(r, g, b, a = null) {
    // @ts-ignore
    return lsrgb2srgb(...prophotoRgb2lsrgb(r, g, b));
}

export { prophotoRgb2srgbvalues };
