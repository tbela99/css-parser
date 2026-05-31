export declare const LOWER = "abcdefghijklmnopqrstuvwxyz";
export declare const DIGITS = "0123456789";
export declare const FULL_ALPHABET: string[];
export declare const FIRST_ALPHABET: string[];
/**
 * supported hash algorithms
 */
export declare const hashAlgorithms: string[];
/**
 * generate a hash id
 * @param input
 * @param length
 */
export declare function hashId(input: string, length?: number): string;
/**
 * generate a hash
 * @param input
 * @param length
 * @param algo
 */
export declare function hash(input: string, length?: number, algo?: string): Promise<string>;
