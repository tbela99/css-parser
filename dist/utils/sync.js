import { EnumToken } from '../lib/ast/types.js';

/**
 * parse result. process input sourcemap
 * @param result
 * @param options
 * @returns
 * @private
 */
function parseResult(result, options) {
    if (options.sourcemap != null && options.source.getInputSourceMap() == null) {
        if (options.inputSourceMap != null) {
            options.source.setInputSourceMap(options.inputSourceMap);
        }
        else {
            // extract inline source map from the input CSS
            const token = result.ast.chi.at(-1);
            if (token?.typ == EnumToken.CommentTokenType &&
                token.val.startsWith("/*# sourceMappingURL=")) {
                options.source.setInputSourceMap(token.val.slice(21, -2).trim());
            }
        }
    }
    if (options.module) {
        const { revMapping, ...res } = result;
        return res;
    }
    return result;
}
/**
 *
 * @param options
 * @param prefix
 * @private
 */
function validateSyncArguments(options, prefix = "options.") {
    const args = Object.entries(options);
    let i;
    for (i = 0; i < args.length; i++) {
        const [key, value] = args[i];
        if (typeof value == "function") {
            if (value instanceof Promise || Object.getPrototypeOf(value).constructor.name == "AsyncFunction") {
                throw new Error(`[${prefix + key}]: Async functions are not supported in sync mode. Use parse() or transform() instead.`);
            }
        }
        else if (value != null && typeof value == "object") {
            validateSyncArguments(value, prefix + key + ".");
        }
    }
}

export { parseResult, validateSyncArguments };
