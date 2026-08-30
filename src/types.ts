/**
 * response type
 */
export enum ResponseType {
    /**
     * return text
     */
    Text,
    /**
     * return a readable stream
     */
    ReadableStream,
    /**
     * return an arraybuffer
     */
    ArrayBuffer,
    /**
     * return a json object
     */
    JSON,
}
