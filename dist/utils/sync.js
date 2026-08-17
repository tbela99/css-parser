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
                const data = token.val.slice(21, -2).trim();
                let sourcemap;
                let encoding = "";
                if (data.startsWith("data:")) {
                    let offset = data.indexOf(",") + 1;
                    if (offset == 0) {
                        offset = data.lastIndexOf(";") + 1;
                    }
                    else {
                        encoding = data.slice(data.lastIndexOf(";") + 1, offset - 1);
                    }
                    if (encoding == "base64") {
                        sourcemap = atob(data.slice(offset));
                    }
                    else {
                        sourcemap = decodeURIComponent(data.slice(offset));
                    }
                    options.source.setInputSourceMap(sourcemap);
                }
            }
        }
    }
    if (options.module) {
        const { revMapping, ...res } = result;
        return res;
    }
    return result;
}
function validateSyncArguments(options, prefix = "options.") {
    const args = Object.entries(options);
    let i;
    for (i = 0; i < args.length; i++) {
        const [key, value] = args[i];
        if (typeof value == 'function') {
            if (value instanceof Promise || Object.getPrototypeOf(value).constructor.name == "AsyncFunction") {
                throw new Error(`[${prefix + key}]: Async functions are not supported in sync mode. Use parse() or transform() instead.`);
            }
        }
        else if (value != null && typeof value == 'object') {
            validateSyncArguments(value, prefix + key + ".");
        }
    }
}

export { parseResult, validateSyncArguments };
