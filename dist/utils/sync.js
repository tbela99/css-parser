import { EnumToken } from '../lib/ast/types.js';
import { dirname } from '../lib/fs/resolve.js';
import { ResponseType } from '../types.js';

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
                let data = token.val.slice(21, -2).trim();
                if (data.endsWith(".map")) {
                    if (options.load == null) {
                        data = "";
                    }
                    else {
                        options
                            .load(options.resolve(data, dirname(options.src)).absolute, ".", ResponseType.JSON)
                            .catch((error) => console.error({ error }))
                            .then((res) => {
                            if (res != null) {
                                // @ts-expect-error
                                options.source.setInputSourceMap(res);
                            }
                        });
                    }
                }
                else {
                    options.source.setInputSourceMap(data);
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
