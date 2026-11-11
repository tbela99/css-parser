/* 
	CSS parser, minifier and validator for node and the browser

	Author(s): Thierry Bela
	Version: 2.0.1
	License: MIT
 */
import { getAngle, convertColor } from '../syntax/color/color.js';
import { reduceHexValue } from '../syntax/color/hex.js';
import { EnumToken, ColorType, EnumAstNodeStatus } from '../ast/types.js';
import { SourceMap } from './sourcemap/sourcemap.js';
import { pseudoElements, anglePrecision, urlTokenMatcher, tokensfuncSet } from '../syntax/constants.js';
import { minifyNumber, toPrecisionAngle, toPrecisionValue, reducegradientBackgroundPosition, reduceConicColorStops, reduceColorStops, parseColor, isWhiteSpace } from '../syntax/syntax.js';
import { equalsIgnoreCase } from '../parser/utils/text.js';
import { toDegrees } from '../parser/utils/angle.js';
import { LineMap } from '../parser/linesmap.js';
import { dirname } from '../fs/resolve.js';
import { SourceFile } from '../parser/source.js';
import { TokenField } from '../ast/arena.js';
import { StructuralMemo } from '../ast/cache.js';

/**
 * Rendered strings shared by the renderer.
 *
 * Identical declarations are very common (`display: block`, `color: #fff`, `width: 10px`, ...): a declaration that has
 * the same name and the same value tokens as a declaration that has already been rendered reuses the rendered string.
 * The same applies to the constructs of the values: colors, functions, parentheses, binary expressions, ... The
 * individual tokens (identifiers, numbers, dimensions, ...) are not memoized: they are rendered when the declaration
 * or the construct that contains them is rendered for the first time.
 *
 * Rendering only depends on the token structure and on the render options: a memo must only be shared by renders that
 * use the same options.
 *
 * The source map locations are not memoized: they are computed for every node from the rendered string and the location
 * of the node.
 *
 * @internal
 */
class RenderMemo {
    /**
     * An instance is kept alive: the hidden class of the instances would otherwise be collected by a full garbage
     * collection when no instance is alive, and the optimized code that depends on it discarded (deoptimized)
     */
    static shape = new RenderMemo();
    /**
     * rendered declarations (`name:value`), by name and value tokens
     */
    declarations = new StructuralMemo();
    /**
     * rendered constructs: colors and tokens with sub tokens (functions, parentheses, binary expressions, ...)
     */
    constructs = new StructuralMemo();
    /**
     * cleared memos, reused by the next renders: their buffers are not allocated again. read by the library
     * (see {@link acquire})
     *
     * @internal
     */
    static free = [];
    /**
     * a cleared memo
     */
    static acquire() {
        return RenderMemo.free.pop() ?? new RenderMemo();
    }
    /**
     * clear a memo that is no longer used and keep it for the next renders. the large memos (more than 4 MB) are not
     * kept: they are reclaimed by the garbage collector
     * @param memo
     */
    static release(memo) {
        if (RenderMemo.free.length < 4 && memo.declarations.footprint + memo.constructs.footprint <= 1 << 20) {
            memo.declarations.clear();
            memo.constructs.clear();
            RenderMemo.free.push(memo);
        }
    }
}
/**
 * Render state shared by the nodes and the tokens of a render
 *
 * @internal
 */
class RenderCache {
    memo;
    options;
    /**
     * An instance is kept alive: the hidden class of the instances would otherwise be collected by a full garbage
     * collection when no instance is alive, and the optimized code that depends on it discarded (deoptimized)
     */
    static shape = new RenderCache(new RenderMemo(), {});
    /**
     * resolved source file names (source maps)
     */
    paths = Object.create(null);
    /**
     * @param memo rendered values
     * @param options options the memo is valid for
     */
    constructor(memo, options) {
        this.memo = memo;
        this.options = options;
    }
}
/**
 * render memo of the cache, if the tokens are rendered with the options the memo was created for. the memo is not used
 * when a token is rendered with other options (a copy of the options, the default options, ...)
 * @param cache
 * @param options
 */
function getRenderMemo(cache, options) {
    return cache instanceof RenderCache && cache.options === options ? cache.memo : null;
}
/**
 * legacy color functions: comma separated values and an alias with the `a` suffix
 */
const legacyColorFunctions = new Set(["rgb", "rgba", "hsl", "hsla"]);
/**
 * color functions that accept an alpha component
 */
const alphaColorFunctions = new Set(["rgb", "rgba", "hsl", "hsla", "hwb", "oklab", "oklch", "lab", "lch"]);
/**
 * color function value ending with a separator
 */
const trailingSeparator = /[,/]\s*$/;
/**
 * candidate angle units, in the order they are tested
 */
const angleUnits = ["deg", "turn", "rad", "grad"];
/**
 * record a source id
 * @param sourcemaps
 * @param srcId
 */
function addSource(sourcemaps, srcId) {
    if (!sourcemaps.sourceIds.has(srcId)) {
        sourcemaps.sourceIds.add(srcId);
        sourcemaps.sources.push(srcId);
    }
}
/**
 * copy of the options with the defaults of the missing options
 * @param options
 *
 * @internal
 */
function resolveRenderOptions(options) {
    const minify = options.minify ?? true;
    const beautify = options.beautify ?? !minify;
    // a copy of the options (a spread into an empty object is a fast clone), then the defaults of the missing
    // options. a spread after other properties copies the properties one by one: it is much slower
    options = { ...options };
    if (!("indent" in options)) {
        options.indent = beautify ? " " : "";
    }
    if (!("newLine" in options)) {
        options.newLine = beautify ? "\n" : "";
    }
    if (!("removeEmpty" in options)) {
        options.removeEmpty = minify;
    }
    if (!("removeComments" in options)) {
        options.removeComments = minify;
    }
    if (minify && !("minify" in options)) {
        options.minify = true;
    }
    if (!("minifyValues" in options)) {
        options.minifyValues = true;
    }
    if (!("sourcemap" in options)) {
        options.sourcemap = false;
    }
    if (!("convertColor" in options)) {
        options.convertColor = true;
    }
    if (!("expandNestingRules" in options)) {
        options.expandNestingRules = false;
    }
    if (!("preserveLicense" in options)) {
        options.preserveLicense = false;
    }
    return options;
}
/**
 * Render nodes with the same options: the options are resolved once and identical values are rendered once.
 * Same output as {@link doRender}, used by the minifier to compare the size of the nodes
 *
 * @internal
 */
class NodeRenderer {
    /**
     * An instance is kept alive: the hidden class of the instances would otherwise be collected by a full garbage
     * collection when no instance is alive, and the optimized code that depends on it discarded (deoptimized)
     */
    static shape = new NodeRenderer({});
    /**
     * options
     */
    options;
    /**
     * resolved options
     */
    resolved;
    /**
     * render state. the memo keys contain interned string ids: the memo is valid for one arena
     */
    cache;
    /**
     * errors
     */
    errors = [];
    /**
     * token reducer, bound to an arena
     */
    reducer = null;
    /**
     * arena of the reducer
     */
    arena = null;
    /**
     * indentation by level
     */
    indents = [];
    /**
     * output location, not used: there is no source map
     */
    location = { srcId: 0, sta: 0, end: 0 };
    /**
     * the nodes are rendered without doRender(): no nesting expansion, no parents, no source map
     */
    direct;
    /**
     * @param options render options
     */
    constructor(options) {
        this.options = options;
        this.resolved = resolveRenderOptions(options);
        this.cache = new RenderCache(new RenderMemo(), this.resolved);
        this.direct =
            !this.resolved.expandNestingRules &&
                !this.resolved.withParents &&
                !this.resolved.sourcemap &&
                this.resolved.output == null;
    }
    /**
     * render a node
     * @param arena
     * @param node
     */
    render(arena, node) {
        if (this.arena !== arena) {
            if (this.arena != null) {
                this.cache = new RenderCache(new RenderMemo(), this.resolved);
            }
            this.arena = arena;
            this.reducer = createReducer(arena, this.resolved, this.cache);
        }
        if (!this.direct) {
            return doRender(arena, node, this.options, null, this.cache.memo).code;
        }
        return renderAstNode(arena, node, this.resolved, null, this.location, null, this.errors, this.reducer, this.cache, 0, this.indents);
    }
}
/**
 * render ast
 * @param arena
 * @param data node id
 * @param options
 * @param mapping
 * @param memo rendered values shared with other renders that use the same options (see {@link NodeRenderer})
 * @private
 */
function doRender(arena, data, options = {}, mapping, memo) {
    options = resolveRenderOptions(options);
    const expandNesting = options.expandNestingRules &&
        [EnumToken.StyleSheetNodeType, EnumToken.AtRuleNodeType, EnumToken.RuleNodeType].includes(arena.dataTypes[data]) &&
        (arena.flags[data] & EnumAstNodeStatus.HasChildren) != 0;
    // temporary stylesheet holding the rendered copy
    let sheet = 0;
    if (options.withParents || expandNesting) {
        // render a copy: the original tree is not modified. the copy is allocated in the same arena,
        // under a temporary stylesheet node that is not attached to the tree
        let parent = arena.parents[data];
        sheet = arena.createStyleSheet();
        data = arena.clone(data, true);
        if (options.withParents) {
            // wrap the node into shallow copies of its ancestors
            while (parent != 0) {
                const clone = arena.clone(parent, false);
                arena.appendChild(clone, data);
                data = clone;
                parent = arena.parents[parent];
            }
        }
        arena.appendChild(sheet, data);
        if (expandNesting) {
            data = arena.expand(data);
        }
    }
    const startTime = performance.now();
    const errors = [];
    const sourcemap = options.sourcemap ? new SourceMap() : null;
    const sourcemaps = options.sourcemap
        ? { sources: [], sourceIds: new Set(), maps: [] }
        : null;
    // identical values are rendered once. the memo is valid for these options only. a memo that is not provided is
    // reused by the next renders
    const ownMemo = memo == null;
    // inlined: RenderMemo.acquire()
    const cache = new RenderCache(memo ?? (RenderMemo.free.pop() ?? new RenderMemo()), options);
    const sourceLocation = {
        end: 0,
    };
    const linesMap = options.sourcemap ? new LineMap() : null;
    let code = "";
    if (mapping != null) {
        if (mapping.importMapping != null) {
            const absolutePath = options.resolve(options.output != null ? dirname(options.output) : dirname(options.src), options.cwd).absolute;
            for (let [key, value] of Object.entries(mapping.importMapping)) {
                key = options.resolve(options.resolve(key, options.cwd).absolute, absolutePath).relative;
                if (!key.startsWith("/") && !key.startsWith(".")) {
                    key = "./" + key;
                }
                code += `:import("${key}")${options.indent}{${options.newLine}${Object.entries(value).reduce((acc, [k, v]) => acc + (acc.length > 0 ? options.newLine : "") + `${options.indent}${v}:${options.indent}${k};`, "")}${options.newLine}}${options.newLine}`;
            }
        }
        code += `:export${options.indent}{${options.newLine}${Object.entries(mapping.mapping).reduce((acc, [k, v]) => acc + (acc.length > 0 ? options.newLine : "") + `${options.indent}${k}:${options.indent}${v};`, "")}${options.newLine}}${options.newLine}`;
        if (sourcemap != null) {
            move(sourceLocation, linesMap, code);
        }
    }
    if (options.output != null) {
        // @ts-ignore
        options.output = options.resolve(options.output, options.cwd).absolute;
    }
    const result = {
        code: code +
            renderAstNode(arena, data, options, sourcemaps, sourceLocation, linesMap, errors, createReducer(arena, options, cache), cache),
        errors,
        stats: {
            total: `${(performance.now() - startTime).toFixed(2)}ms`,
        },
    };
    if (ownMemo) {
        RenderMemo.release(cache.memo);
    }
    if (sheet != 0) {
        // drop the temporary stylesheet. the tokens allocated while rendering (color conversion, gradients, ...)
        // are not attached to the tree either: the memory is not reclaimed, the ids are never reused
        arena.detach(data);
    }
    if (sourcemap != null) {
        let source;
        for (const sourceId of sourcemaps.sources) {
            source = options.sourcesMap.get(sourceId);
            // inlined: source.getFileName(), source.getContent()
            sourcemap.addSourceContent(source.id, source.file, source.content);
        }
        sourcemap.add(sourcemaps.maps);
        result.map = sourcemap;
        if (options.sourcemap === "inline") {
            result.code += `\n/*# sourceMappingURL=${result.map.toUrl()} */`;
        }
    }
    return result;
}
/**
 * Update source map
 * @param arena
 * @param node
 * @param options
 * @param cache
 * @param sourcemaps
 * @param sourceLocation
 * @param linesMap
 * @param str
 *
 * @internal
 */
function updateSourceMap(arena, node, options, cache, sourcemaps, sourceLocation, linesMap, str) {
    let offset = 0;
    // eat leanding whitespace
    while (offset < str.length && isWhiteSpace(str.charCodeAt(offset))) {
        offset++;
    }
    if (offset > 0) {
        move(sourceLocation, linesMap, str, 0, offset + 1);
    }
    if (arena.flags[node] & EnumAstNodeStatus.HasLocation) {
        // inlined: arena.getSource(node)
        let srcId = arena.sources[arena.getSourceId(node)] ?? 0;
        const source = options.sourcesMap.get(srcId);
        const inputSourceMap = source.getInputSourceMap();
        // inlined: source.getOffsets(arena.getSpanStart(node))
        const offsets = source.lineStarts.getOffsets(arena.getSpanStart(node));
        // generated position, see LineMap.getOffsets()
        const line = linesMap.search(sourceLocation.end);
        const newLine = line + 1;
        const newColumn = sourceLocation.end - linesMap.lineStarts[line] + (line == 0 ? 1 : 0);
        let records = null;
        // inlined: source.getFileName()
        let sourceFileName = source.file || null;
        let sourceContent; // = (source.getContent() as string) || null;
        if (inputSourceMap != null && (records = inputSourceMap.find(offsets[0], offsets[1])) != null) {
            let newId = null;
            for (const record of records) {
                newId = null;
                // @ts-ignore
                sourceFileName = record[0] || null;
                // @ts-ignore
                offsets[0] = record[1];
                // @ts-ignore
                offsets[1] = record[2];
                sourceContent = record[3] || null;
                if (sourceFileName != null && options.output != null && !sourceFileName.startsWith("data:")) {
                    if (cache.paths[sourceFileName] == null) {
                        const absolute = options.resolve(dirname(options.output), options.cwd)
                            .absolute;
                        const absoluteSourcePath = options.resolve(dirname(options.src || ""), options.cwd).absolute;
                        // resolution is relative to the source file
                        const absoluteSourceFileName = options.resolve(sourceFileName, absoluteSourcePath)
                            .absolute;
                        cache.paths[sourceFileName] = options.resolve(absoluteSourceFileName, absolute).relative;
                    }
                    sourceFileName = cache.paths[sourceFileName];
                }
                for (const [id, file] of options.sourcesMap.entries()) {
                    // inlined: file.getFileName()
                    if (file.file === sourceFileName) {
                        newId = id;
                        break;
                    }
                    // inlined: file.getContent()
                    if (sourceFileName == null && file.content === sourceContent) {
                        newId = id;
                        break;
                    }
                }
                if (newId == null) {
                    const source = new SourceFile(sourceContent, [], sourceFileName);
                    options.sourcesMap.set(source.id, source);
                    newId = source.id;
                }
                srcId = newId;
                addSource(sourcemaps, srcId);
                sourcemaps.maps.push([newLine, newColumn, srcId, offsets[0], offsets[1]]);
            }
        }
        else {
            // if (sourceFileName != null && options.output != null && !sourceFileName.startsWith("data:")) {
            //     if (cache[sourceFileName] == null) {
            //         const absolute = options.resolve!(dirname(options.output as string), options.cwd as string)
            //             .absolute as string;
            //         const absoluteSourceFileName = options.resolve!(sourceFileName, options.cwd as string)
            //             .absolute as string;
            //         cache[sourceFileName] = options.resolve!(absoluteSourceFileName, absolute).relative as string;
            //     }
            //     sourceFileName = cache[sourceFileName] as string;
            // }
            addSource(sourcemaps, srcId);
            sourcemaps.maps.push([newLine, newColumn, srcId, offsets[0], offsets[1]]);
        }
    }
    move(sourceLocation, linesMap, str, offset);
}
/**
 * Update position
 * @param sourceLocation
 * @param linesMap
 * @param str
 * @param start
 * @param end
 */
function move(sourceLocation, linesMap, str, start, end) {
    const j = end ?? str.length;
    let i = start ?? 0;
    let codepoint;
    for (; i < j; i++) {
        codepoint = str.charCodeAt(i);
        sourceLocation.end++;
        if (codepoint == 0xa || // \n
            codepoint == 0xb || // \v
            codepoint == 0xc || // \f
            codepoint == 0xd || // \r
            codepoint == 0x2028 || // \u2028
            codepoint == 0x2029 // \u2029
        ) {
            if (codepoint == 0xd && i + 1 < str.length && str.charCodeAt(i + 1) == 0xa) ;
            else if (codepoint == 0xa && i > 0 && str.charCodeAt(i - 1) == 0xd) ;
            else {
                // inlined: linesMap.addLineStart(sourceLocation.end)
                linesMap.lineStarts.push(sourceLocation.end);
            }
        }
    }
}
/**
 * render ast node
 * @param arena
 * @param data node id
 * @param options
 * @param sourcemaps
 * @param sourceLocation
 * @param linesMap
 * @param errors
 * @param reducer
 * @param cache
 * @param level
 * @param indents
 *
 * @internal
 */
function renderAstNode(arena, data, options, sourcemaps, sourceLocation, linesMap, errors, reducer, cache, level = 0, indents = []) {
    if (indents.length < level + 1) {
        indents.push(options.indent.repeat(level));
    }
    if (indents.length < level + 2) {
        indents.push(options.indent.repeat(level + 1));
    }
    // @ts-ignore
    let children = "";
    let str = "";
    const indent = indents[level];
    const indentSub = indents[level + 1];
    const typ = arena.dataTypes[data];
    switch (typ) {
        case EnumToken.DeclarationNodeType:
            return `${arena.strings[arena.name[data]]}:${options.indent}${renderDeclarationValue(arena, data, options.minifyValues, reducer)}`;
        case EnumToken.CommentNodeType:
        case EnumToken.CDOCOMMNodeType: {
            const val = arena.strings[arena.stringValue[data]];
            if (val.startsWith("/*# sourceMappingURL=")) {
                // ignore sourcemap comment
                return "";
            }
            return !options.removeComments || (options.preserveLicense && val.startsWith("/*!")) ? val : "";
        }
        case EnumToken.StyleSheetNodeType:
            for (let node = arena.firstChild[data]; node != 0; node = arena.nextSibling[node]) {
                str = renderAstNode(arena, node, options, sourcemaps, sourceLocation, linesMap, errors, reducer, cache, level, indents);
                if (str === "") {
                    continue;
                }
                if (children.length > 0) {
                    str = options.newLine + str;
                }
                children += str;
                if (sourcemaps != null && str !== "" && options.newLine) {
                    move(sourceLocation, linesMap, options.newLine);
                }
            }
            return children;
        case EnumToken.AtRuleNodeType:
        case EnumToken.RuleNodeType:
        case EnumToken.KeyframesRuleNodeType:
        case EnumToken.KeyframesAtRuleNodeType: {
            const isAtRule = typ == EnumToken.AtRuleNodeType || typ == EnumToken.KeyframesAtRuleNodeType;
            const nam = arena.strings[arena.name[data]];
            const val = arena.strings[arena.stringValue[data]];
            if (isAtRule && !(arena.flags[data] & EnumAstNodeStatus.HasChildren)) {
                return `${(indent.length > 0 ? options.newLine : "") + indent}@${nam}${val === "" ? "" : options.indent || " "}${val};`;
            }
            // inlined: linesMap.getLineStarts()
            const lineMapLength = linesMap ? linesMap.lineStarts.length : 0;
            const prelude = (indent.length > 0 ? options.newLine : "") +
                indent +
                (isAtRule
                    ? `@${nam}${val === "" ? "" : options.indent || " "}${val}${options.indent}{`
                    : nam + `${options.indent}{`);
            if (sourcemaps != null) {
                updateSourceMap(arena, data, options, cache, sourcemaps, sourceLocation, linesMap, prelude);
            }
            let node;
            let nodeType;
            let recordDeclarationSourceMap = typ == EnumToken.AtRuleNodeType;
            // rendering of the last child, without its trailing semicolon, appended to the children when the next child
            // is rendered. the trailing semicolon of the last child is dropped: it is known from the type of the child,
            // the rendered strings are not read (reading a concatenated string flattens it)
            let last = "";
            let semicolon = false;
            for (node = arena.firstChild[data]; node != 0; node = arena.nextSibling[node]) {
                nodeType = arena.dataTypes[node];
                if (nodeType == EnumToken.CommentNodeType) {
                    const comment = arena.strings[arena.stringValue[node]];
                    str =
                        options.removeComments && (!options.preserveLicense || !comment.startsWith("/*!"))
                            ? ""
                            : comment;
                }
                else if (nodeType == EnumToken.DeclarationNodeType) {
                    // the semicolon is not part of the rendered declaration
                    str = renderDeclaration(arena, node, options, cache, reducer);
                }
                else {
                    str = renderAstNode(arena, node, options, sourcemaps, sourceLocation, linesMap, errors, reducer, cache, level + 1, indents);
                    if (str === "") {
                        continue;
                    }
                    children += semicolon ? last + ";" : last;
                    // at-rules without a block ('@layer name;') end with a semicolon
                    semicolon = endsWithSemicolon(arena, node, str);
                    last = semicolon ? str.slice(0, -1) : str;
                    str = "";
                    continue;
                }
                if (str === "") {
                    continue;
                }
                str = options.newLine + indentSub + str;
                children += semicolon ? last + ";" : last;
                if (nodeType == EnumToken.DeclarationNodeType) {
                    last = str;
                    semicolon = true;
                }
                else {
                    // comments are flat strings
                    semicolon = str.charCodeAt(str.length - 1) == 0x3b;
                    last = semicolon ? str.slice(0, -1) : str;
                }
                if (sourcemaps != null) {
                    if (nodeType == EnumToken.DeclarationNodeType && recordDeclarationSourceMap) {
                        // if declaration is child of at-rule, then record it
                        // .rule {
                        //     @media screen {
                        //         color: red;
                        //     }
                        // }
                        updateSourceMap(arena, node, options, cache, sourcemaps, sourceLocation, linesMap, str);
                    }
                    else {
                        move(sourceLocation, linesMap, str);
                    }
                    if (nodeType == EnumToken.DeclarationNodeType) {
                        // the semicolon
                        sourceLocation.end++;
                    }
                }
            }
            // the semicolon that ends the last child is removed
            if (semicolon) {
                sourceLocation.end--;
            }
            children += last;
            if (options.removeEmpty && children === "") {
                if (sourcemaps != null) {
                    sourceLocation.end -= prelude.length;
                    // inlined: linesMap!.getLineStarts()
                    linesMap.lineStarts.length = lineMapLength;
                }
                return "";
            }
            const end = options.newLine + indent + `}`;
            if (sourcemaps != null) {
                move(sourceLocation, linesMap, end);
            }
            return prelude + children + end;
        }
        default:
            return "";
    }
}
/**
 * true if a rendered child node ends with a semicolon
 * @param arena
 * @param node child node
 * @param rendered rendered child node, not empty
 */
function endsWithSemicolon(arena, node, rendered) {
    switch (arena.dataTypes[node]) {
        case EnumToken.AtRuleNodeType:
        case EnumToken.KeyframesAtRuleNodeType:
            // '@rule prelude;' or '@rule prelude { ... }'
            return !(arena.flags[node] & EnumAstNodeStatus.HasChildren);
        case EnumToken.RuleNodeType:
        case EnumToken.KeyframesRuleNodeType:
            // '... }'
            return false;
        default:
            // comments: flat strings
            return rendered.charCodeAt(rendered.length - 1) == 0x3b;
    }
}
function renderTokenList(tokens, reducer) {
    let result = "";
    for (const token of tokens) {
        result = reducer(result, token);
    }
    return result;
}
/**
 * render a declaration of a block: `name:value`, without the semicolon. identical declarations (same name, same value
 * tokens) are rendered once per render
 * @param arena
 * @param node declaration
 * @param options
 * @param cache
 * @param reducer
 */
function renderDeclaration(arena, node, options, cache, reducer) {
    const memo = getRenderMemo(cache, options);
    if (memo == null) {
        return `${arena.strings[arena.name[node]]}:${options.indent}${renderDeclarationValue(arena, node, options.minifyValues, reducer).trimEnd()}`;
    }
    // the name is part of the key
    const slot = memo.declarations.list(arena, arena.firstToken[node], arena.name[node]);
    // inlined: memo.declarations.get(slot)
    let rendered = memo.declarations.values[slot];
    if (rendered === undefined) {
        rendered = `${arena.strings[arena.name[node]]}:${options.indent}${renderDeclarationValue(arena, node, options.minifyValues, reducer).trimEnd()}`;
        // inlined: memo.declarations.set(slot, rendered)
        memo.declarations.values[slot] = rendered;
    }
    return rendered;
}
/**
 * render the value tokens of a declaration with the reducer. with minifyValues, the whitespace that is not needed is
 * skipped like {@link filterValues} does, without copying the tokens into an array: the whitespace before
 * `!important` (the token that follows `!important` is not checked) and the whitespace after a function
 * @param arena
 * @param node declaration
 * @param minifyValues
 * @param reducer
 */
function renderDeclarationValue(arena, node, minifyValues, reducer) {
    let rendered = "";
    let token = arena.firstToken[node];
    if (!minifyValues) {
        for (; token != 0; token = arena.nextSibling[token]) {
            rendered = reducer(rendered, token);
        }
        return rendered;
    }
    const dataTypes = arena.dataTypes;
    // last kept token, rendered when the next token is kept: a whitespace before !important is dropped
    let pending = 0;
    let check = true;
    let dropWhitespace = false;
    for (; token != 0; token = arena.nextSibling[token]) {
        const type = dataTypes[token];
        if (dropWhitespace) {
            dropWhitespace = false;
            if (type == EnumToken.WhitespaceTokenType) {
                continue;
            }
        }
        if (!check) {
            check = true;
        }
        else if (type == EnumToken.ImportantTokenType &&
            pending != 0 &&
            dataTypes[pending] === EnumToken.WhitespaceTokenType) {
            pending = 0;
            check = false;
        }
        else if (tokensfuncSet.has(type) &&
            // color keywords and hex colors are not functions
            (type != EnumToken.ColorTokenType || arena.firstToken[token] != 0) &&
            type != EnumToken.WildCardFunctionTokenType &&
            arena.nextSibling[token] != 0 &&
            dataTypes[arena.nextSibling[token]] == EnumToken.WhitespaceTokenType) {
            dropWhitespace = true;
        }
        if (pending != 0) {
            rendered = reducer(rendered, pending);
        }
        pending = token;
    }
    return pending == 0 ? rendered : reducer(rendered, pending);
}
/**
 * shared default arguments of {@link renderValue}: no object is created per call. the cache is only written when
 * a source map is generated, with the cache of {@link doRender}
 */
const defaultRenderOptions = {};
const defaultCache = Object.create(null);
/**
 * reducer of the rendered tokens: comments are removed according to the options
 * @param arena
 * @param options
 * @param cache
 * @param errors
 */
function createReducer(arena, options, cache, errors) {
    const reducer = (acc, curr) => {
        if (arena.dataTypes[curr] == EnumToken.CommentTokenType && options.removeComments) {
            if (!options.preserveLicense || !arena.strings[arena.stringValue[curr]].startsWith("/*!")) {
                return acc;
            }
            return acc + arena.strings[arena.stringValue[curr]];
        }
        return acc + renderValue(arena, curr, options, cache, reducer);
    };
    return reducer;
}
/**
 * render the tokens of a linked token list, starting at the first token, with the reducer. without a reducer, the
 * comments are handled like {@link createReducer} does: no closure is created
 * @param arena
 * @param first first token of the list
 * @param options
 * @param cache
 * @param reducer
 * @param errors
 */
function renderReduced(arena, first, options, cache, reducer, errors) {
    let result = "";
    for (let token = first; token != 0; token = arena.nextSibling[token]) {
        if (reducer != null) {
            result = reducer(result, token);
        }
        else if (arena.dataTypes[token] == EnumToken.CommentTokenType && options.removeComments) {
            if (options.preserveLicense && arena.strings[arena.stringValue[token]].startsWith("/*!")) {
                result += arena.strings[arena.stringValue[token]];
            }
        }
        else {
            result += renderValue(arena, token, options, cache, null);
        }
    }
    return result;
}
/**
 * render the tokens of a linked token list, starting at the first token (no array, no closure)
 * @param arena
 * @param first first token of the list
 * @param options
 * @param cache
 * @param reducer
 * @param errors
 */
function renderList(arena, first, options, cache, reducer, errors) {
    let result = "";
    for (let token = first; token != 0; token = arena.nextSibling[token]) {
        result += renderValue(arena, token, options, cache, reducer);
    }
    return result;
}
/**
 * render the tokens of a field of a structured token, see {@link renderList}
 * @param arena
 * @param token
 * @param field
 * @param options
 * @param cache
 * @param reducer
 * @param errors
 */
function renderField(arena, token, field, options, cache, reducer, errors) {
    const list = arena.getChildAt(token, field);
    return list == null ? "" : renderList(arena, arena.firstToken[list], options, cache, reducer);
}
/**
 * render a color token
 * @param arena
 * @param token
 * @param options
 * @param cache
 * @param reducer
 * @param errors
 */
function renderColor(arena, token, options, cache, reducer, errors) {
    if (options.convertColor !== false) {
        const value = convertColor(arena, token, typeof options.convertColor === "boolean"
            ? ColorType.HEX
            : (ColorType[ColorType[options.convertColor ?? "HEX"]
                ?.toUpperCase?.()
                .replaceAll?.("-", "_")] ?? ColorType.HEX));
        if (value != null) {
            token = value;
        }
        if (arena.colorType[token] == ColorType.HEX || arena.colorType[token] == ColorType.LIT) {
            return reduceHexValue(arena.strings[arena.stringValue[token]]);
        }
    }
    if (arena.colorType[token] === ColorType.SYS ||
        arena.colorType[token] === ColorType.DPSYS ||
        arena.colorType[token] === ColorType.NON_STD) {
        return arena.strings[arena.stringValue[token]];
    }
    if (arena.colorType[token] == ColorType.HEX || arena.colorType[token] == ColorType.LIT) {
        return arena.strings[arena.stringValue[token]];
    }
    if (arena.firstToken[token] == 0) {
        // rendered like a function (no argument)
        return ((arena.strings[arena.stringValue[token]] ?? "") +
            "(" +
            renderReduced(arena, arena.firstToken[token], options, cache, reducer) +
            ")");
    }
    const fnName = arena.strings[arena.stringValue[token]];
    const count = arena.tokenCount(token);
    const isLegacy = legacyColorFunctions.has(fnName);
    const hasAlpha = alphaColorFunctions.has(fnName);
    const useAlpha = (hasAlpha && count == (isLegacy ? 7 : 4)) || ("color" == fnName && count == 5);
    let result = "";
    let index = 0;
    for (let curr = arena.firstToken[token]; curr != 0; curr = arena.nextSibling[curr], index++) {
        if (trailingSeparator.test(result)) {
            if (arena.dataTypes[curr] == EnumToken.WhitespaceTokenType) {
                result = result.trimEnd();
                continue;
            }
            result = result.trimStart() + renderValue(arena, curr, options, cache);
            continue;
        }
        if (isLegacy && arena.dataTypes[curr] == EnumToken.CommaTokenType) {
            result = result.trimEnd() + " ";
        }
        else if (arena.dataTypes[curr] == EnumToken.WhitespaceTokenType) {
            result = result.trimEnd() + " ";
        }
        else if (arena.dataTypes[curr] == EnumToken.CommaTokenType ||
            (arena.dataTypes[curr] == EnumToken.LiteralTokenType && arena.strings[arena.stringValue[curr]] == "/")) {
            result = result.trimEnd() + (arena.dataTypes[curr] == EnumToken.CommaTokenType ? "," : "/");
        }
        else {
            result =
                result.trimEnd() + (useAlpha && index == count - 1 ? "/" : " ") + renderValue(arena, curr, options, cache);
        }
    }
    return (hasAlpha && fnName.endsWith("a") ? fnName.slice(0, -1) : fnName) + "(" + result.trimStart() + ")";
}
/**
 * render ast token. identical constructs (colors and tokens with sub tokens: functions, parentheses, binary
 * expressions, ...) are rendered once per render, see {@link RenderMemo}
 * @param token
 * @param options
 * @param cache
 * @param reducer
 * @param errors
 * @private
 */
function renderValue(arena, token, options = defaultRenderOptions, cache = defaultCache, reducer, errors) {
    if (arena.dataTypes[token] == EnumToken.ColorTokenType ||
        arena.firstToken[token] != 0 ||
        arena.firstChild[token] != 0) {
        const memo = getRenderMemo(cache, options);
        if (memo != null) {
            const slot = memo.constructs.token(arena, token);
            // inlined: memo.constructs.get(slot)
            let rendered = memo.constructs.values[slot];
            if (rendered === undefined) {
                rendered = renderToken(arena, token, options, cache, reducer);
                // inlined: memo.constructs.set(slot, rendered)
                memo.constructs.values[slot] = rendered;
            }
            return rendered;
        }
    }
    return renderToken(arena, token, options, cache, reducer);
}
/**
 * render ast token, see {@link renderValue}
 * @param arena
 * @param token
 * @param options
 * @param cache
 * @param reducer
 * @param errors
 */
function renderToken(arena, token, options, cache, reducer, errors) {
    if (arena.dataTypes[token] === EnumToken.WhenElseFunctionTokenType &&
        equalsIgnoreCase(arena.strings[arena.stringValue[token]], "supports")) {
        options = { ...options, minifyValues: false, minify: false, convertColor: false };
        reducer = null;
    }
    options.minifyValues ??= options.minify;
    // without a reducer, the default reducer (see createReducer()) is used: it is created only when the rendering of
    // a child requires it with other options. the children rendered with the same options create their own
    switch (arena.dataTypes[token]) {
        case EnumToken.UrlFunctionTokenDefType:
        case EnumToken.FunctionTokenDefType:
        case EnumToken.MathFunctionTokenDefType:
        case EnumToken.ImageFunctionTokenDefType:
        case EnumToken.ColorFunctionTokenDefType:
        case EnumToken.TimingFunctionTokenDefType:
        case EnumToken.WhenElseFunctionTokenDefType:
        case EnumToken.SupportsFunctionTokenDefType:
        case EnumToken.TimelineFunctionTokenDefType:
        case EnumToken.GridTemplateFuncTokenDefType:
        case EnumToken.TransformFunctionTokenDefType:
        case EnumToken.ContainerFunctionTokenDefType:
        case EnumToken.PseudoClassFunctionTokenDefType:
        case EnumToken.GeneralEnclosedFunctionTokenDefType:
        case EnumToken.CustomFunctionTokenDefType:
        case EnumToken.WildCardFunctionTokenDefType:
            return arena.strings[arena.stringValue[token]] + "(";
        case EnumToken.ListToken:
            return renderList(arena, arena.firstToken[token], options, cache);
        case EnumToken.BinaryExpressionTokenType: {
            const op = arena.numericValue[token];
            // inlined: arena.getLeft(token)
            const l = (arena.getChildAt(token, TokenField.L) == null ? null : arena.fieldTokens(token, TokenField.L))[0];
            // inlined: arena.getRight(token)
            const r = (arena.getChildAt(token, TokenField.R) == null ? null : arena.fieldTokens(token, TokenField.R))[0];
            if (EnumToken.Mul === op || EnumToken.Div === op) {
                let result = "";
                if (arena.dataTypes[l] == EnumToken.BinaryExpressionTokenType &&
                    (arena.numericValue[l] == EnumToken.Add || arena.numericValue[l] == EnumToken.Sub)) {
                    result = "(" + renderValue(arena, l, options, cache) + ")";
                }
                else {
                    result = renderValue(arena, l, options, cache);
                }
                result += op == EnumToken.Mul ? "*" : "/";
                if (arena.dataTypes[r] == EnumToken.BinaryExpressionTokenType &&
                    (arena.numericValue[r] == EnumToken.Add || arena.numericValue[r] == EnumToken.Sub)) {
                    result += "(" + renderValue(arena, r, options, cache) + ")";
                }
                else {
                    result += renderValue(arena, r, options, cache);
                }
                return result;
            }
            return (renderValue(arena, l, options, cache) +
                (op == EnumToken.Add ? " + " : " - ") +
                renderValue(arena, r, options, cache));
        }
        case EnumToken.FractionTokenType: {
            // inlined: arena.numerator(token)
            const numerator = arena.firstChild[token];
            // inlined: arena.denominator(token)
            const denominator = arena.lastChild[token];
            const fraction = renderValue(arena, numerator) + "/" + renderValue(arena, denominator);
            if (arena.numericValue[denominator] != 0) {
                const value = minifyNumber(arena.numericValue[numerator] / arena.numericValue[denominator]);
                if (value.length <= fraction.length) {
                    return value;
                }
            }
            return fraction;
        }
        case EnumToken.Add:
            return " + ";
        case EnumToken.Sub:
            return " - ";
        case EnumToken.UniversalSelectorTokenType:
        case EnumToken.Star:
        case EnumToken.Mul:
            return "*";
        case EnumToken.Div:
            return "/";
        case EnumToken.WrappedValuesTokenType:
            return "{" + renderList(arena, arena.firstToken[token], options, cache) + "}";
        case EnumToken.ColorTokenType: {
            if (arena.colorType[token] == ColorType.LIGHT_DARK ||
                (arena.firstToken[token] != 0 && options.convertColor === false && arena.tokenCount(token) == 2)) {
                let result = "";
                for (let curr = arena.firstToken[token]; curr != 0; curr = arena.nextSibling[curr]) {
                    if (arena.dataTypes[curr] === EnumToken.IdenTokenType) {
                        // the token is updated in place
                        parseColor(arena, curr);
                    }
                    result += renderValue(arena, curr, options, cache);
                }
                return arena.strings[arena.stringValue[token]] + "(" + result + ")";
            }
            return renderColor(arena, token, options, cache, reducer);
        }
        case EnumToken.UrlFunctionTokenType:
            if (options.minifyValues && arena.dataTypes[token] === EnumToken.UrlFunctionTokenType) {
                // inlined: arena.typeOf(arena.firstToken[token])
                if (arena.dataTypes[arena.firstToken[token]] === EnumToken.BadUrlTokenType) {
                    return "url()";
                }
                for (let child = arena.firstToken[token]; child != 0; child = arena.nextSibling[child]) {
                    if (arena.dataTypes[child] === EnumToken.StringTokenType) {
                        const val = arena.strings[arena.stringValue[child]];
                        if (val.slice(1, 5) !== "data:" && urlTokenMatcher.test(val)) {
                            arena.dataTypes[child] = EnumToken.UrlTokenTokenType;
                            // inlined: arena.setStr(child, val.slice(1, -1))
                            arena.stringValue[child] = arena.internString(val.slice(1, -1));
                        }
                        break;
                    }
                }
            }
        case EnumToken.ParensTokenType:
        case EnumToken.FunctionTokenType:
        case EnumToken.MathFunctionTokenType:
        case EnumToken.ImageFunctionTokenType:
            if (options.minifyValues && arena.dataTypes[token] === EnumToken.ImageFunctionTokenType) {
                const slice = arena.tokens(token);
                switch (arena.strings[arena.stringValue[token]]) {
                    case "linear-gradient":
                    case "repeating-linear-gradient":
                        {
                            let i;
                            let k;
                            let j;
                            let key;
                            for (i = 0; i < slice.length; i++) {
                                if (arena.dataTypes[slice[i]] == EnumToken.ColorTokenType ||
                                    arena.dataTypes[slice[i]] === EnumToken.CommaTokenType) {
                                    break;
                                }
                                if (arena.dataTypes[slice[i]] == EnumToken.IdenTokenType &&
                                    equalsIgnoreCase(arena.strings[arena.stringValue[slice[i]]], "to")) {
                                    k = i + 1;
                                    while (k < slice.length &&
                                        (arena.dataTypes[slice[k]] === EnumToken.WhitespaceTokenType ||
                                            arena.dataTypes[slice[k]] === EnumToken.CommentTokenType)) {
                                        k++;
                                    }
                                    if (k < slice.length && arena.dataTypes[slice[k]] === EnumToken.IdenTokenType) {
                                        // convert keyword to angle
                                        key = arena.strings[arena.stringValue[slice[k]]].toLowerCase();
                                        switch (key) {
                                            case "right":
                                                slice.splice(i, k - i + 1, arena.createToken(EnumToken.AngleTokenType, 90, "deg"));
                                                break;
                                            case "left":
                                                slice.splice(i, k - i + 1, arena.createToken(EnumToken.AngleTokenType, 270, "deg"));
                                                break;
                                            case "top":
                                            case "bottom":
                                                j = k + 1;
                                                while (j < slice.length &&
                                                    (arena.dataTypes[slice[j]] === EnumToken.WhitespaceTokenType ||
                                                        arena.dataTypes[slice[j]] === EnumToken.CommentTokenType)) {
                                                    j++;
                                                }
                                                if (j < slice.length && arena.dataTypes[slice[j]] !== EnumToken.CommaTokenType) {
                                                    i = j - 1;
                                                    break;
                                                }
                                                // https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/gradient/linear-gradient#:~:text=If%20unspecified%2C%20it%20defaults%20to%20to%20bottom
                                                if (key === "bottom") {
                                                    // to bottom -> 180deg is the default angle and will be removed
                                                    while (k < slice.length &&
                                                        arena.dataTypes[slice[k]] != EnumToken.CommaTokenType) {
                                                        k++;
                                                    }
                                                    slice.splice(i, k - i + 1);
                                                    i--;
                                                    continue;
                                                }
                                                slice.splice(i, k - i + 1, arena.createToken(EnumToken.AngleTokenType, key === "top" ? 0 : 180, "deg"));
                                                i--;
                                                break;
                                        }
                                    }
                                }
                                else if (arena.dataTypes[slice[i]] == EnumToken.AngleTokenType) {
                                    if ((180 - arena.numericValue[toDegrees(arena, slice[i])]) % 360 === 0) {
                                        k = i + 1;
                                        // while (k < slice.length && arena.dataTypes[slice[k]] !== EnumToken.CommaTokenType) {
                                        //     k++;
                                        // }
                                        slice.splice(i, k - i + 1);
                                    }
                                }
                            }
                            if (arena.dataTypes[slice[i]] === EnumToken.CommaTokenType) {
                                i++;
                                // while (
                                //     i < slice.length &&
                                //     (arena.dataTypes[slice[i]] === EnumToken.WhitespaceTokenType ||
                                //         arena.dataTypes[slice[i]] === EnumToken.CommentTokenType)
                                //) {
                                //     i++;
                                // }
                            }
                            if (arena.dataTypes[slice[i]] === EnumToken.ColorTokenType) {
                                for (const token of reduceColorStops(arena, slice.splice(i, slice.length - i))) {
                                    slice.push(token);
                                }
                            }
                        }
                        break;
                    case "radial-gradient":
                    case "repeating-radial-gradient":
                        {
                            let i = 0;
                            // while (
                            //     i < slice.length &&
                            //     (arena.dataTypes[slice[i]] === EnumToken.WhitespaceTokenType ||
                            //         arena.dataTypes[slice[i]] === EnumToken.CommentTokenType)
                            //) {
                            //     i++;
                            // }
                            const positions = [];
                            const form = [];
                            const size = [];
                            const colorSpaceDef = [];
                            if (arena.dataTypes[slice[i]] === EnumToken.IdenTokenType) {
                                if (equalsIgnoreCase(arena.strings[arena.stringValue[slice[i]]], "farthest-corner") ||
                                    equalsIgnoreCase(arena.strings[arena.stringValue[slice[i]]], "ellipse")) {
                                    i++;
                                }
                                else if (equalsIgnoreCase(arena.strings[arena.stringValue[slice[i]]], "closest-side") ||
                                    equalsIgnoreCase(arena.strings[arena.stringValue[slice[i]]], "closest-corner") ||
                                    equalsIgnoreCase(arena.strings[arena.stringValue[slice[i]]], "farthest-side")) {
                                    size.push(slice[i++]);
                                }
                                else if (equalsIgnoreCase(arena.strings[arena.stringValue[slice[i]]], "circle")) {
                                    form.push(slice[i++]);
                                }
                                while (arena.dataTypes[slice[i]] === EnumToken.WhitespaceTokenType ||
                                    arena.dataTypes[slice[i]] === EnumToken.CommentTokenType) {
                                    i++;
                                }
                            }
                            if (arena.dataTypes[slice[i]] === EnumToken.IdenTokenType) {
                                if (equalsIgnoreCase(arena.strings[arena.stringValue[slice[i]]], "farthest-corner") ||
                                    equalsIgnoreCase(arena.strings[arena.stringValue[slice[i]]], "ellipse")) {
                                    i++;
                                }
                                else if (equalsIgnoreCase(arena.strings[arena.stringValue[slice[i]]], "closest-side") ||
                                    equalsIgnoreCase(arena.strings[arena.stringValue[slice[i]]], "closest-corner") ||
                                    equalsIgnoreCase(arena.strings[arena.stringValue[slice[i]]], "farthest-side")) {
                                    size.push(slice[i++]);
                                }
                                else if (equalsIgnoreCase(arena.strings[arena.stringValue[slice[i]]], "circle")) {
                                    form.push(slice[i++]);
                                }
                                while (arena.dataTypes[slice[i]] === EnumToken.WhitespaceTokenType ||
                                    arena.dataTypes[slice[i]] === EnumToken.CommentTokenType) {
                                    i++;
                                }
                            }
                            if (arena.dataTypes[slice[i]] === EnumToken.IdenTokenType &&
                                equalsIgnoreCase(arena.strings[arena.stringValue[slice[i]]], "at")) {
                                i++;
                            }
                            while (arena.dataTypes[slice[i]] === EnumToken.WhitespaceTokenType ||
                                arena.dataTypes[slice[i]] === EnumToken.CommentTokenType) {
                                i++;
                            }
                            if (arena.dataTypes[slice[i]] === EnumToken.PercentageTokenType ||
                                (arena.dataTypes[slice[i]] === EnumToken.NumberTokenType && 0 === arena.numericValue[slice[i]]) ||
                                (arena.dataTypes[slice[i]] === EnumToken.IdenTokenType &&
                                    (equalsIgnoreCase(arena.strings[arena.stringValue[slice[i]]], "center") ||
                                        equalsIgnoreCase(arena.strings[arena.stringValue[slice[i]]], "top") ||
                                        equalsIgnoreCase(arena.strings[arena.stringValue[slice[i]]], "bottom") ||
                                        equalsIgnoreCase(arena.strings[arena.stringValue[slice[i]]], "left") ||
                                        equalsIgnoreCase(arena.strings[arena.stringValue[slice[i]]], "right")))) {
                                do {
                                    if (arena.dataTypes[slice[i]] === EnumToken.IdenTokenType &&
                                        "in" === arena.strings[arena.stringValue[slice[i]]]) {
                                        break;
                                    }
                                    positions.push(slice[i]);
                                    i++;
                                } while (i < slice.length && arena.dataTypes[slice[i]] !== EnumToken.CommaTokenType);
                            }
                            while (i < slice.length && arena.dataTypes[slice[i]] !== EnumToken.CommaTokenType) {
                                colorSpaceDef.push(slice[i++]);
                            }
                            if (arena.dataTypes[slice[i]] === EnumToken.CommaTokenType) {
                                i++;
                            }
                            if (positions.length > 0) {
                                let k;
                                let position1 = "";
                                let position2 = "";
                                for (k = 0; k < positions.length; k++) {
                                    if (arena.dataTypes[positions[k]] === EnumToken.IdenTokenType) {
                                        if (position1.length === 0) {
                                            position1 = arena.strings[arena.stringValue[positions[k]]];
                                        }
                                        else {
                                            position2 = arena.strings[arena.stringValue[positions[k]]];
                                        }
                                    }
                                    else if (arena.dataTypes[positions[k]] === EnumToken.PercentageTokenType ||
                                        arena.dataTypes[positions[k]] === EnumToken.NumberTokenType) {
                                        if (position1.length === 0) {
                                            position1 = arena.numericValue[positions[k]] + "%";
                                        }
                                        else {
                                            position2 = arena.numericValue[positions[k]] + "%";
                                        }
                                    }
                                    if (position2.length > 0) {
                                        break;
                                    }
                                }
                                if (position1.length > 0) {
                                    let key = `${position1} ${position2}`.trim();
                                    if (key === "50% 50%" ||
                                        key === "center center" ||
                                        key === "50%" ||
                                        key === "center") {
                                        positions.length = 0;
                                    }
                                    else if (key === "0% 0%" ||
                                        key === "0 0" ||
                                        key === "top left" ||
                                        key === "left top") {
                                        positions.splice(0, positions.length, arena.createToken(EnumToken.PercentageTokenType, 0));
                                    }
                                    else if (key === "50% 0%" ||
                                        key === "50% 0" ||
                                        key === "center top" ||
                                        key === "top center") {
                                        positions.splice(0, positions.length, arena.createToken(EnumToken.IdenTokenType, "top"));
                                    }
                                    else if (key === "top right" || key === "right top") {
                                        positions.splice(0, positions.length, arena.createToken(EnumToken.PercentageTokenType, 100), arena.createToken(EnumToken.WhitespaceTokenType), arena.createToken(EnumToken.PercentageTokenType, 0));
                                    }
                                    else if (key === "0 50%" ||
                                        key === "0% 50%" ||
                                        key === "left center" ||
                                        key === "center left") {
                                        positions.splice(0, positions.length, arena.createToken(EnumToken.IdenTokenType, "left"));
                                    }
                                    else if (key === "100% 50%" || key === "right center" || key === "center right") {
                                        positions.splice(0, positions.length, arena.createToken(EnumToken.IdenTokenType, "right"));
                                    }
                                    else if (key === "0 100%" ||
                                        key === "0% 100%" ||
                                        key === "left bottom" ||
                                        key === "bottom left") {
                                        positions.splice(0, positions.length, arena.createToken(EnumToken.IdenTokenType, "bottom"));
                                    }
                                    else if (key === "50% 100%" ||
                                        key === "center bottom" ||
                                        key === "bottom center") {
                                        positions.splice(0, positions.length, arena.createToken(EnumToken.IdenTokenType, "bottom"));
                                    }
                                    else if (key === "100% 100%" ||
                                        key === "right bottom" ||
                                        key === "bottom right") {
                                        positions.splice(0, positions.length, arena.createToken(EnumToken.PercentageTokenType, 100));
                                    }
                                    else if (position1 === position2) {
                                        positions.splice(0, positions.length, positions[k]);
                                    }
                                }
                            }
                            const result = [];
                            if (form.length > 0) {
                                for (const token of form) {
                                    result.push(token);
                                }
                            }
                            if (size.length > 0) {
                                if (result.length > 0) {
                                    result.push(arena.createToken(EnumToken.WhitespaceTokenType));
                                }
                                for (const token of size) {
                                    result.push(token);
                                }
                            }
                            if (positions.length > 0) {
                                if (result.length > 0) {
                                    result.push(arena.createToken(EnumToken.WhitespaceTokenType));
                                }
                                result.push(arena.createToken(EnumToken.IdenTokenType, "at"), arena.createToken(EnumToken.WhitespaceTokenType));
                                for (const token of positions) {
                                    result.push(token);
                                }
                            }
                            if (colorSpaceDef.length > 0) {
                                if (result.length > 0) {
                                    result.push(arena.createToken(EnumToken.WhitespaceTokenType));
                                }
                                for (const token of colorSpaceDef) {
                                    result.push(token);
                                }
                            }
                            if (result.length > 0) {
                                result.push(arena.createToken(EnumToken.CommaTokenType));
                            }
                            for (const token of reduceColorStops(arena, slice.slice(i))) {
                                result.push(token);
                            }
                            slice.length = 0;
                            for (const token of result) {
                                slice.push(token);
                            }
                        }
                        break;
                    case "conic-gradient":
                    case "repeating-conic-gradient":
                        {
                            let i = 0;
                            const angles = [];
                            const positions = [];
                            const colorSpaceDef = [];
                            // while (
                            //     i < slice.length &&
                            //     (arena.dataTypes[slice[i]] === EnumToken.WhitespaceTokenType ||
                            //         arena.dataTypes[slice[i]] === EnumToken.CommentTokenType)
                            //) {
                            //     i++;
                            // }
                            if (arena.dataTypes[slice[i]] === EnumToken.IdenTokenType &&
                                equalsIgnoreCase(arena.strings[arena.stringValue[slice[i]]], "from")) {
                                angles.push(slice[i++]);
                                while (i < slice.length &&
                                    (arena.dataTypes[slice[i]] === EnumToken.WhitespaceTokenType ||
                                        arena.dataTypes[slice[i]] === EnumToken.CommentTokenType)) {
                                    angles.push(slice[i++]);
                                }
                                if ((arena.dataTypes[slice[i]] === EnumToken.NumberTokenType ||
                                    arena.dataTypes[slice[i]] === EnumToken.AngleTokenType) &&
                                    0 === arena.numericValue[toDegrees(arena, slice[i])]) {
                                    angles.length = 0;
                                    i++;
                                }
                                else if (arena.dataTypes[slice[i]] !== EnumToken.CommaTokenType &&
                                    arena.dataTypes[slice[i]] != EnumToken.IdenTokenType) {
                                    angles.push(slice[i++]);
                                }
                                while (i < slice.length &&
                                    (arena.dataTypes[slice[i]] === EnumToken.WhitespaceTokenType ||
                                        arena.dataTypes[slice[i]] === EnumToken.CommentTokenType)) {
                                    i++;
                                }
                            }
                            if (arena.dataTypes[slice[i]] === EnumToken.IdenTokenType &&
                                equalsIgnoreCase(arena.strings[arena.stringValue[slice[i]]], "at")) {
                                i++;
                                while (i < slice.length &&
                                    (arena.dataTypes[slice[i]] === EnumToken.WhitespaceTokenType ||
                                        arena.dataTypes[slice[i]] === EnumToken.CommentTokenType)) {
                                    i++;
                                }
                                let position1 = "";
                                let position2 = "";
                                if (arena.dataTypes[slice[i]] === EnumToken.IdenTokenType &&
                                    !equalsIgnoreCase("in", arena.strings[arena.stringValue[slice[i]]])) {
                                    position1 = arena.strings[arena.stringValue[slice[i]]];
                                    positions.push(slice[i++]);
                                }
                                else if (arena.dataTypes[slice[i]] === EnumToken.PercentageTokenType ||
                                    arena.dataTypes[slice[i]] === EnumToken.NumberTokenType) {
                                    position1 = arena.numericValue[slice[i]] + "%";
                                    positions.push(slice[i++]);
                                }
                                while (i < slice.length &&
                                    (arena.dataTypes[slice[i]] === EnumToken.WhitespaceTokenType ||
                                        arena.dataTypes[slice[i]] === EnumToken.CommentTokenType)) {
                                    positions.push(slice[i++]);
                                }
                                if (arena.dataTypes[slice[i]] === EnumToken.IdenTokenType &&
                                    !equalsIgnoreCase("in", arena.strings[arena.stringValue[slice[i]]])) {
                                    position2 = arena.strings[arena.stringValue[slice[i]]];
                                    positions.push(slice[i++]);
                                }
                                else if (arena.dataTypes[slice[i]] === EnumToken.PercentageTokenType ||
                                    arena.dataTypes[slice[i]] === EnumToken.NumberTokenType) {
                                    position2 = arena.numericValue[slice[i]] + "%";
                                    positions.push(slice[i++]);
                                }
                                while (i < slice.length &&
                                    (arena.dataTypes[slice[i]] === EnumToken.WhitespaceTokenType ||
                                        arena.dataTypes[slice[i]] === EnumToken.CommentTokenType)) {
                                    i++;
                                }
                                if (position1.length > 0) {
                                    reducegradientBackgroundPosition(arena, positions, `${position1} ${position2}`.trim());
                                }
                            }
                            while (i < slice.length &&
                                (arena.dataTypes[slice[i]] === EnumToken.WhitespaceTokenType ||
                                    arena.dataTypes[slice[i]] === EnumToken.CommentTokenType)) {
                                i++;
                            }
                            if (arena.dataTypes[slice[i]] === EnumToken.IdenTokenType &&
                                equalsIgnoreCase("in", arena.strings[arena.stringValue[slice[i]]])) {
                                while (i < slice.length && arena.dataTypes[slice[i]] !== EnumToken.CommaTokenType) {
                                    colorSpaceDef.push(slice[i++]);
                                }
                            }
                            if (arena.dataTypes[slice[i]] === EnumToken.CommaTokenType) {
                                i++;
                            }
                            const result = [];
                            if (positions.length > 0) {
                                if (positions.length > 0) {
                                    if (angles.length > 0) {
                                        angles.push(arena.createToken(EnumToken.WhitespaceTokenType));
                                    }
                                    angles.push(arena.createToken(EnumToken.IdenTokenType, "at"), arena.createToken(EnumToken.WhitespaceTokenType));
                                    for (const position of positions) {
                                        angles.push(position);
                                    }
                                }
                            }
                            if (angles.length > 0) {
                                for (const angle of angles) {
                                    result.push(angle);
                                }
                                result.push(arena.createToken(EnumToken.CommaTokenType));
                            }
                            if (colorSpaceDef.length > 0) {
                                if (colorSpaceDef.length > 0) {
                                    if (result.length > 0) {
                                        result.push(arena.createToken(EnumToken.WhitespaceTokenType));
                                    }
                                    for (const token of colorSpaceDef) {
                                        result.push(token);
                                    }
                                }
                                result.push(arena.createToken(EnumToken.CommaTokenType));
                            }
                            for (const token of reduceConicColorStops(arena, slice.slice(i))) {
                                result.push(token);
                            }
                            slice.length = 0;
                            for (let j = 0; j < result.length; j++) {
                                slice.push(result[j]);
                            }
                        }
                        break;
                }
                return arena.strings[arena.stringValue[token]] + "(" + renderTokenList(slice, reducer ?? createReducer(arena, options, cache)) + ")";
            }
        case EnumToken.TimingFunctionTokenType:
        case EnumToken.PseudoClassFuncTokenType:
        case EnumToken.WhenElseFunctionTokenType:
        case EnumToken.TimelineFunctionTokenType:
        case EnumToken.GridTemplateFuncTokenType:
        case EnumToken.SupportsFunctionTokenType:
        case EnumToken.ContainerFunctionTokenType:
        case EnumToken.TransformFunctionTokenType:
        case EnumToken.GeneralEnclosedFunctionTokenType:
        case EnumToken.CustomFunctionTokenType:
        case EnumToken.WildCardFunctionTokenType:
            if (arena.dataTypes[token] == EnumToken.MathFunctionTokenType && arena.tokenCount(token) == 1) {
                // a single argument
                const first = arena.firstToken[token];
                const firstType = arena.dataTypes[first];
                if (firstType != EnumToken.BinaryExpressionTokenType &&
                    firstType != EnumToken.FractionTokenType &&
                    firstType != EnumToken.IdenTokenType &&
                    !arena.hasFraction(first)) {
                    return (arena.strings[arena.stringValue[token]] +
                        "(" +
                        renderValue(arena, first, options, cache, 
                        // the reducer renders with the options of this token
                        (reducer ??= createReducer(arena, options, cache))) +
                        ")");
                }
            }
            return (arena.strings[arena.stringValue[token]] ?? "") + "(" + renderReduced(arena, arena.firstToken[token], options, cache, reducer) + ")";
        case EnumToken.BlockStartTokenType:
            return "{";
        case EnumToken.BlockEndTokenType:
            return "}";
        case EnumToken.StartParensTokenType:
            return "(";
        case EnumToken.DelimTokenType:
        case EnumToken.EqualMatchTokenType:
            return "=";
        case EnumToken.IncludeMatchTokenType:
            return "~=";
        case EnumToken.DashMatchTokenType:
            return "|=";
        case EnumToken.StartMatchTokenType:
            return "^=";
        case EnumToken.EndMatchTokenType:
            return "$=";
        case EnumToken.ContainMatchTokenType:
            return "*=";
        case EnumToken.LtTokenType:
            return "<";
        case EnumToken.LteTokenType:
            return "<=";
        case EnumToken.Tilda:
        case EnumToken.SubsequentSiblingCombinatorTokenType:
            return "~";
        case EnumToken.Plus:
        case EnumToken.NextSiblingCombinatorTokenType:
            return "+";
        case EnumToken.GtTokenType:
        case EnumToken.ChildCombinatorTokenType:
            return ">";
        case EnumToken.GteTokenType:
            return ">=";
        case EnumToken.ColumnCombinatorTokenType:
            return "||";
        case EnumToken.EndParensTokenType:
            return ")";
        case EnumToken.AttrStartTokenType:
            return "[";
        case EnumToken.AttrEndTokenType:
            return "]";
        case EnumToken.DescendantCombinatorTokenType:
        case EnumToken.WhitespaceTokenType:
            return " ";
        case EnumToken.ColonTokenType:
            return ":";
        case EnumToken.DoubleColonTokenType:
            return "::";
        case EnumToken.SemiColonTokenType:
            return ";";
        case EnumToken.CommaTokenType:
            return ",";
        case EnumToken.ImportantTokenType:
            return "!important";
        case EnumToken.PipeTokenType:
            return "|";
        case EnumToken.AttrTokenType:
        case EnumToken.IdenListTokenType:
            return "[" + renderReduced(arena, arena.firstToken[token], options, cache, reducer) + "]";
        case EnumToken.TimeTokenType:
        case EnumToken.AngleTokenType:
        case EnumToken.LengthTokenType:
        case EnumToken.DimensionTokenType:
        case EnumToken.FrequencyTokenType:
        case EnumToken.ResolutionTokenType:
        case EnumToken.UserDefinedDimensionTokenType:
            let val = arena.hasFraction(token)
                ? renderValue(arena, arena.getFraction(token), options, cache)
                : minifyNumber(arena.numericValue[token]);
            let unit = arena.strings[arena.unit[token]];
            if (arena.dataTypes[token] == EnumToken.AngleTokenType && !val.includes("/")) {
                const angle = getAngle(arena, token);
                let v;
                let value = val + unit;
                for (const u of angleUnits) {
                    if (arena.strings[arena.unit[token]] == u) {
                        continue;
                    }
                    switch (u) {
                        case "deg":
                            v = minifyNumber(toPrecisionAngle(angle * 360, anglePrecision, false).toFixed(anglePrecision));
                            if (v.length + 3 < value.length) {
                                val = v;
                                unit = u;
                                value = v + u;
                            }
                            break;
                        case "turn":
                            v = minifyNumber(toPrecisionAngle(angle, anglePrecision, false).toFixed(anglePrecision));
                            if (v.length + 4 < value.length) {
                                val = v;
                                unit = u;
                                value = v + u;
                            }
                            break;
                        case "rad":
                            v = minifyNumber(toPrecisionAngle(angle * (2 * Math.PI), anglePrecision, false).toFixed(anglePrecision));
                            if (v.length + 3 < value.length) {
                                val = v;
                                unit = u;
                                value = v + u;
                            }
                            break;
                        case "grad":
                            v = minifyNumber(toPrecisionAngle(angle * 400, anglePrecision, false).toFixed(anglePrecision));
                            if (v.length + 4 < value.length) {
                                val = v;
                                unit = u;
                                value = v + u;
                            }
                            break;
                    }
                }
            }
            if (val === "0") {
                if (arena.dataTypes[token] == EnumToken.TimeTokenType) {
                    return "0s";
                }
                if (arena.dataTypes[token] == EnumToken.FrequencyTokenType) {
                    return "0Hz";
                }
                // @ts-ignore
                if (arena.dataTypes[token] == EnumToken.ResolutionTokenType) {
                    return "0x";
                }
                return "0";
            }
            if (arena.dataTypes[token] == EnumToken.TimeTokenType) {
                if (unit == "ms") {
                    // @ts-ignore
                    const v = minifyNumber(val / 1000);
                    if (v.length + 1 <= val.length) {
                        return v + "s";
                    }
                    return val + "ms";
                }
                return val + "s";
            }
            if (arena.dataTypes[token] == EnumToken.ResolutionTokenType && unit == "dppx") {
                unit = "x";
            }
            return val.includes("/") ? val.replace("/", unit + "/") : minifyNumber(toPrecisionValue(val)) + unit;
        case EnumToken.FlexTokenType:
        case EnumToken.PercentageTokenType:
            const uni = arena.dataTypes[token] == EnumToken.PercentageTokenType ? "%" : "fr";
            const perc = arena.hasFraction(token)
                ? renderValue(arena, arena.getFraction(token), options, cache)
                : minifyNumber(arena.numericValue[token]);
            return options.minifyValues && perc == "0"
                ? "0"
                : perc.includes("/")
                    ? perc.replace("/", uni + "/")
                    : perc + uni;
        case EnumToken.NumberTokenType:
            return arena.hasFraction(token)
                ? renderValue(arena, arena.getFraction(token), options, cache)
                : minifyNumber(arena.numericValue[token]);
        case EnumToken.InfinityTokenType:
            return "1/0";
        case EnumToken.NegativeInfinityTokenType:
            return "-1/0";
        case EnumToken.NaNTokenType:
            return "NaN";
        case EnumToken.AtRuleTokenType:
            return "@" + arena.strings[arena.name[token]];
        case EnumToken.CommentTokenType:
        case EnumToken.CDOCOMMNodeType:
            if (options.removeComments &&
                (!options.preserveLicense || !arena.strings[arena.stringValue[token]].startsWith("/*!"))) {
                return "";
            }
        case EnumToken.PseudoClassTokenType:
        case EnumToken.PseudoElementTokenType:
            // https://www.w3.org/TR/selectors-4/#single-colon-pseudos
            if (arena.dataTypes[token] == EnumToken.PseudoElementTokenType &&
                pseudoElements.includes(arena.strings[arena.stringValue[token]].slice(1))) {
                return arena.strings[arena.stringValue[token]].slice(1);
            }
        case EnumToken.CssTypeTokenType:
        case EnumToken.UrlTokenTokenType:
        case EnumToken.HashTokenType:
        case EnumToken.IdenTokenType:
        case EnumToken.StringTokenType:
        case EnumToken.LiteralTokenType:
        case EnumToken.UniCodeRange:
        case EnumToken.DashedIdenTokenType:
        case EnumToken.PseudoPageTokenType:
        case EnumToken.ClassSelectorTokenType:
            return arena.strings[arena.stringValue[token]];
        case EnumToken.NestingSelectorTokenType:
            return "&";
        case EnumToken.SupportsQueryUnaryConditionTokenType:
        case EnumToken.WhenElseUnaryConditionTokenType:
            return (renderValue(arena, arena.field(token, TokenField.L), options, cache, reducer) +
                " " +
                renderField(arena, token, TokenField.R, options, cache, reducer));
        case EnumToken.SupportsQueryConditionTokenType:
        case EnumToken.WhenElseQueryConditionTokenType:
            return (renderField(arena, token, TokenField.L, options, cache, reducer) +
                " " +
                renderValue(arena, arena.field(token, TokenField.Op), options, cache, reducer) +
                " " +
                renderField(arena, token, TokenField.R, options, cache, reducer));
        case EnumToken.IfConditionTokenType: {
            return !arena.hasField(token, TokenField.L)
                ? ""
                : renderField(arena, token, TokenField.L, options, cache, reducer) +
                    ":" +
                    (options.indent ?? "") +
                    renderField(arena, token, TokenField.R, options, cache, reducer);
        }
        case EnumToken.IfElseConditionTokenType:
            return (renderValue(arena, arena.field(token, TokenField.L), options, cache, reducer) +
                (options.indent ?? "") +
                renderValue(arena, arena.field(token, TokenField.R), options, cache, reducer));
        case EnumToken.DeclarationNodeType:
            return (arena.strings[arena.name[token]] +
                ":" +
                renderTokenList(options.minifyValues ? filterValues(arena, arena.tokens(token)) : arena.tokens(token), (acc, curr) => acc + renderValue(arena, curr, options, cache, reducer)));
        case EnumToken.MediaQueryUnaryFeatureTokenType:
            return (renderValue(arena, arena.field(token, TokenField.L), options, cache, reducer) +
                " " +
                renderField(arena, token, TokenField.R, options, cache, reducer));
        case EnumToken.MediaQueryConditionTokenType: {
            const op = arena.field(token, TokenField.Op);
            const opType = arena.dataTypes[op];
            const indent = opType == EnumToken.LtTokenType ||
                opType == EnumToken.GtTokenType ||
                opType == EnumToken.ColonTokenType ||
                opType == EnumToken.DelimTokenType ||
                opType == EnumToken.LteTokenType ||
                opType == EnumToken.GteTokenType
                ? ""
                : " ";
            return (renderField(arena, token, TokenField.L, options, cache, reducer) +
                indent +
                renderValue(arena, op, options, cache, reducer) +
                indent +
                renderField(arena, token, TokenField.R, options, cache, reducer));
        }
        case EnumToken.MediaRangeQueryTokenType:
            return (renderField(arena, token, TokenField.L, options, cache, reducer) +
                renderValue(arena, arena.field(token, TokenField.Op), options, cache, reducer) +
                renderField(arena, token, TokenField.Val, options, cache, reducer) +
                renderValue(arena, arena.field(token, TokenField.Op2), options, cache, reducer) +
                renderField(arena, token, TokenField.R, options, cache, reducer));
        case EnumToken.MediaFeatureTokenType:
            return arena.strings[arena.stringValue[token]];
        case EnumToken.NotTokenType:
            return "not";
        case EnumToken.OnlyTokenType:
            return "only";
        case EnumToken.AndTokenType:
            return "and";
        case EnumToken.OrTokenType:
            return "or";
        case EnumToken.BadCommentTokenType:
        case EnumToken.BadCdoTokenType:
        case EnumToken.BadStringTokenType:
        case EnumToken.BadUrlTokenType:
        case EnumToken.EOFTokenType:
            return "";
        case EnumToken.ComposesSelectorNodeType:
            return `${renderField(arena, token, TokenField.L, options, cache, reducer)}${!arena.hasField(token, TokenField.R) ? "" : " from " + renderValue(arena, arena.field(token, TokenField.R), options, cache, reducer)}`;
        default:
            throw new Error(`Unsupported token type for ${EnumToken[arena.dataTypes[token]]}`);
    }
    // errors?.push({ action: "ignore", message: `render: unexpected token ${JSON.stringify(token, null, 1)}` });
    // return "";
}
/**
 * Remove whitespace tokens that are not needed
 * @param values
 *
 * @internal
 */
function filterValues(arena, values) {
    let i = 0;
    for (; i < values.length; i++) {
        if (arena.dataTypes[values[i]] == EnumToken.ImportantTokenType && arena.dataTypes[values[i - 1]] === EnumToken.WhitespaceTokenType) {
            values.splice(i - 1, 1);
        }
        else if (tokensfuncSet.has(arena.dataTypes[values[i]]) &&
            // color keywords and hex colors are not functions
            (arena.dataTypes[values[i]] != EnumToken.ColorTokenType || arena.firstToken[values[i]] != 0) &&
            arena.dataTypes[values[i]] != EnumToken.WildCardFunctionTokenType &&
            arena.dataTypes[values[i + 1]] == EnumToken.WhitespaceTokenType) {
            values.splice(i + 1, 1);
        }
    }
    return values;
}

export { NodeRenderer, RenderMemo, doRender, filterValues, move, renderValue };
