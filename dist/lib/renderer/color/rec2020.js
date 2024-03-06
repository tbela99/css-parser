import { lsrgb2srgb, rec20202lsrgb } from './srgb.js';

function rec20202srgb(r, g, b, a = null) {
    // @ts-ignore
    return lsrgb2srgb(...rec20202lsrgb(r, g, b));
}

export { rec20202srgb };
