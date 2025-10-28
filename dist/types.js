/**
 * response type
 */
var ResponseType;
(function (ResponseType) {
    /**
     * return text
     */
    ResponseType[ResponseType["Text"] = 0] = "Text";
    /**
     * return a readable stream
     */
    ResponseType[ResponseType["ReadableStream"] = 1] = "ReadableStream";
    /**
     * return an arraybuffer
     */
    ResponseType[ResponseType["ArrayBuffer"] = 2] = "ArrayBuffer";
})(ResponseType || (ResponseType = {}));

export { ResponseType };
