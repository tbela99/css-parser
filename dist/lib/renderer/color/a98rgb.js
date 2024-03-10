import { lsrgb2srgb, a982lrgb } from './srgb.js';

function a98rgb2srgbvalues(r, g, b, a = null) {
    //  @ts-ignore
    return lsrgb2srgb(...a982lrgb(r, g, b, a));
}

export { a98rgb2srgbvalues };
