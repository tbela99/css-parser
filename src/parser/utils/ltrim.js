import { isWhiteSpace } from "./syntax";
import { update } from "./location";
export function ltrim(position, buffer) {
    let l = -1;
    const k = buffer.length - 1;
    while (l++ < k) {
        if (!isWhiteSpace(buffer[l])) {
            break;
        }
    }
    // console.log({l, k, b: buffer.substring(l)})
    if (l > 0) {
        update(position, buffer.slice(0, l));
        return buffer.substring(l);
    }
    return buffer;
}
