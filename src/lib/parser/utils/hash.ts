// Alphabet: a-z, A-Z, 0-9, _, -
export const LOWER = "abcdefghijklmnopqrstuvwxyz";
export const DIGITS = "0123456789";

export const FULL_ALPHABET: string[] = (LOWER + DIGITS).split(""); // 64 chars
export const FIRST_ALPHABET: string[] = LOWER.split(""); // 54 chars (no digits)

/**
 * supported hash algorithms
 */
export const hashAlgorithms: string[] = ["hex", "base64", "base64url", "sha1", "sha256", "sha384", "sha512"];

// simple deterministic hash → number
function hashCode(str: string) {
    let hash: number = 0;
    let l: number = str.length;
    let i: number = 0;

    while (i < l) {
        hash = (hash * 31 + str.charCodeAt(i++)) >>> 0;
    }

    return hash;
}

/**
 * generate a hash id
 * @param input
 * @param length
 */
export function hashId(input: string, length: number = 6): string {
    let n: number = hashCode(input);
    const chars: string[] = [];

    // First character: must not be a digit
    chars.push(FIRST_ALPHABET[n % FIRST_ALPHABET.length]);

    // Remaining characters
    for (let i = 1; i < length; i++) {
        n = (n + chars.length * i) % FULL_ALPHABET.length;
        chars.push(FULL_ALPHABET[n]);
    }

    return chars.join("");
}

/**
 * Object to string
 * @param input
 * @returns
 */
export function toSortedString(input: any): string {
    if (input == null) {
        return "null";
    }

    if (typeof input !== "object") {
        return String(input);
    }
    if (Array.isArray(input)) {
        return JSON.stringify(input.map(toSortedString));
    }

    return `{${Object.keys(input)
        .sort()
        .map((k) => `${k}:${toSortedString(input[k])}`)
        .join(",")}}`;
}

/**
 * Object hash
 * @param object
 * @returns
 */
export function objectHash(object: any): string {
    return hashCode(toSortedString(object)).toString(16);
}

/**
 * convert input to hex
 * @param input
 */
function toHex(input: ArrayBuffer | string, length?: number): string {
    let result = "";

    if (input instanceof ArrayBuffer || ArrayBuffer.isView(input)) {
        for (const byte of Array.from(new Uint8Array(input as ArrayBuffer))) {
            result += byte.toString(16).padStart(2, "0");

            if (length != null && result.length >= length) {
                return result;
            }
        }
    } else {
        for (const char of String(input)) {
            result += char.charCodeAt(0).toString(16).padStart(2, "0");
            if (length != null && result.length >= length) {
                return result;
            }
        }
    }

    return result;
}

/**
 * generate a hash
 * @param input
 * @param length
 * @param algo
 */
export async function hash(input: string, length: number = 6, algo?: string): Promise<string> {
    let result: string;

    if (algo != null) {
        switch (algo) {
            case "hex":
                return toHex(input).slice(0, length);

            case "base64url":
            case "base64":
                result = btoa(input);

                if (algo == "base64url") {
                    result = result.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
                }

                return result.slice(0, length);

            case "sha256":
            case "sha384":
            case "sha512":
            case "sha1":
                return toHex(
                    await crypto.subtle.digest(algo.replace("sha", "SHA-"), new TextEncoder().encode(input)),
                ).slice(0, length);

            default:
                throw new Error(`Unsupported hash algorithm: ${algo}`);
        }
    }

    return hashId(input, length);
}

/**
 * generate a hash
 * @param input
 * @param length
 * @param algo
 */
export function syncHash(input: string, length: number = 6, algo?: string): string {
    let result: string;

    if (algo != null) {
        switch (algo) {
            case "hex":
                return toHex(input).slice(0, length);

            case "base64url":
            case "base64":
                result = btoa(input);

                if (algo == "base64url") {
                    result = result.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
                }

                return result.slice(0, length);

            default:
                throw new Error(`Unsupported hash algorithm: ${algo}`);
        }
    }

    return hashId(input, length);
}
