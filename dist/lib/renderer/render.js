import { getAngle, convertColor } from '../syntax/color/color.js';
import { colorsFunc, funcLike } from '../syntax/color/utils/constants.js';
import { EnumToken, ColorType } from '../ast/types.js';
import '../ast/minify.js';
import '../ast/walk.js';
import { expand } from '../ast/expand.js';
import { isColor, pseudoElements, mathFuncs, isNewLine } from '../syntax/syntax.js';
import { minifyNumber } from '../syntax/utils.js';
import { SourceMap } from './sourcemap/sourcemap.js';

/**
 * Update position
 * @param position
 * @param str
 */
function update(position, str) {
    let i = 0;
    for (; i < str.length; i++) {
        if (isNewLine(str[i].charCodeAt(0))) {
            position.lin++;
            position.col = 0;
        }
        else {
            position.col++;
        }
    }
}
/**
 * render ast
 * @param data
 * @param options
 * @param mapping
 * @private
 */
function doRender(data, options = {}, mapping) {
    const minify = options.minify ?? true;
    const beautify = options.beautify ?? !minify;
    options = {
        ...(beautify ? {
            indent: ' ',
            newLine: '\n',
        } : {
            indent: '',
            newLine: '',
        }),
        ...(minify ? {
            removeEmpty: true,
            removeComments: true,
            minify: true
        } : {
            removeEmpty: false,
            removeComments: false,
        }), sourcemap: false, convertColor: true, expandNestingRules: false, preserveLicense: false, ...options
    };
    if (options.withParents) {
        // @ts-ignore
        let parent = data.parent;
        // @ts-ignore
        while (data.parent != null) {
            // @ts-ignore
            parent = { ...data.parent, chi: [{ ...data }] };
            // @ts-ignore
            parent.parent = data.parent.parent;
            // @ts-ignore
            data = parent;
        }
    }
    const startTime = performance.now();
    const errors = [];
    const sourcemap = options.sourcemap ? new SourceMap : null;
    const cache = Object.create(null);
    const position = {
        ind: 0,
        lin: 1,
        col: 1
    };
    let code = '';
    if (mapping != null) {
        if (mapping.importMapping != null) {
            for (const [key, value] of Object.entries(mapping.importMapping)) {
                code += `:import("${key}")${options.indent}{${options.newLine}${Object.entries(value).reduce((acc, [k, v]) => acc + (acc.length > 0 ? options.newLine : '') + `${options.indent}${v}:${options.indent}${k};`, '')}${options.newLine}}${options.newLine}`;
            }
        }
        code += `:export${options.indent}{${options.newLine}${Object.entries(mapping.mapping).reduce((acc, [k, v]) => acc + (acc.length > 0 ? options.newLine : '') + `${options.indent}${k}:${options.indent}${v};`, '')}${options.newLine}}${options.newLine}`;
        update(position, code);
    }
    const result = {
        code: code + renderAstNode(options.expandNestingRules && [EnumToken.StyleSheetNodeType, EnumToken.AtRuleNodeType, EnumToken.RuleNodeType].includes(data.typ) && 'chi' in data ? expand(data) : data, options, sourcemap, position, errors, function reducer(acc, curr) {
            if (curr.typ == EnumToken.CommentTokenType && options.removeComments) {
                if (!options.preserveLicense || !curr.val.startsWith('/*!')) {
                    return acc;
                }
                return acc + curr.val;
            }
            return acc + renderToken(curr, options, cache, reducer, errors);
        }, cache), errors, stats: {
            total: `${(performance.now() - startTime).toFixed(2)}ms`
        }
    };
    if (options.output != null) {
        // @ts-ignore
        options.output = options.resolve(options.output, options.cwd).absolute;
    }
    if (sourcemap != null) {
        result.map = sourcemap;
        if (options.sourcemap === 'inline') {
            result.code += `\n/*# sourceMappingURL=data:application/json,${encodeURIComponent(JSON.stringify(result.map))} */`;
        }
    }
    return result;
}
/**
 * Update source map
 * @param node
 * @param options
 * @param cache
 * @param sourcemap
 * @param position
 * @param str
 *
 * @internal
 */
function updateSourceMap(node, options, cache, sourcemap, position, str) {
    if ([
        EnumToken.RuleNodeType, EnumToken.AtRuleNodeType,
        EnumToken.KeyFramesRuleNodeType, EnumToken.KeyframesAtRuleNodeType
    ].includes(node.typ)) {
        let src = node.loc?.src ?? '';
        let output = options.output ?? '';
        if (!(src in cache)) {
            // @ts-ignore
            cache[src] = options.resolve(src, options.cwd ?? '').relative;
        }
        if (!(output in cache)) {
            // @ts-ignore
            cache[output] = options.resolve(output, options.cwd).relative;
        }
        // @ts-ignore
        sourcemap.add({ src: cache[output], sta: { ...position } }, {
            ...node.loc,
            // @ts-ignore
            src: options.resolve(cache[src], options.cwd).relative
        });
    }
    update(position, str);
}
/**
 * render ast node
 * @param data
 * @param options
 * @param sourcemap
 * @param position
 * @param errors
 * @param reducer
 * @param cache
 * @param level
 * @param indents
 *
 * @internal
 */
function renderAstNode(data, options, sourcemap, position, errors, reducer, cache, level = 0, indents = []) {
    if (indents.length < level + 1) {
        indents.push(options.indent.repeat(level));
    }
    if (indents.length < level + 2) {
        indents.push(options.indent.repeat(level + 1));
    }
    const indent = indents[level];
    const indentSub = indents[level + 1];
    switch (data.typ) {
        case EnumToken.DeclarationNodeType:
            return `${data.nam}:${options.indent}${(options.minify ? filterValues(data.val) : data.val).reduce(reducer, '')}`;
        case EnumToken.CommentNodeType:
        case EnumToken.CDOCOMMNodeType:
            if (data.val.startsWith('/*# sourceMappingURL=')) {
                // ignore sourcemap
                return '';
            }
            return !options.removeComments || (options.preserveLicense && data.val.startsWith('/*!')) ? data.val : '';
        case EnumToken.StyleSheetNodeType:
            return data.chi.reduce((css, node) => {
                const str = renderAstNode(node, options, sourcemap, { ...position }, errors, reducer, cache, level, indents);
                if (str === '') {
                    return css;
                }
                if (css === '') {
                    if (sourcemap != null && node.loc != null) {
                        updateSourceMap(node, options, cache, sourcemap, position, str);
                    }
                    return str;
                }
                if (sourcemap != null && node.loc != null) {
                    update(position, options.newLine);
                    updateSourceMap(node, options, cache, sourcemap, position, str);
                }
                return `${css}${options.newLine}${str}`;
            }, '');
        case EnumToken.AtRuleNodeType:
        case EnumToken.RuleNodeType:
        case EnumToken.KeyFramesRuleNodeType:
        case EnumToken.KeyframesAtRuleNodeType:
            if ([EnumToken.AtRuleNodeType, EnumToken.KeyframesAtRuleNodeType].includes(data.typ) && !('chi' in data)) {
                return `${indent}@${data.nam}${data.val === '' ? '' : options.indent || ' '}${data.val};`;
            }
            // @ts-ignore
            let children = data.chi.reduce((css, node) => {
                let str;
                if (node.typ == EnumToken.CommentNodeType) {
                    str = options.removeComments && (!options.preserveLicense || !node.val.startsWith('/*!')) ? '' : node.val;
                }
                else if (node.typ == EnumToken.DeclarationNodeType) {
                    if (!node.nam.startsWith('--') && node.val.length == 0) {
                        // @ts-ignore
                        errors.push({
                            action: 'ignore',
                            message: `render: invalid declaration ${JSON.stringify(node)}`,
                            location: node.loc
                        });
                        return '';
                    }
                    str = `${node.nam}:${options.indent}${(options.minify ? filterValues(node.val) : node.val).reduce(reducer, '').trimEnd()};`;
                }
                else if (node.typ == EnumToken.AtRuleNodeType && !('chi' in node)) {
                    str = `${node.val === '' ? '' : options.indent || ' '}${node.val};`;
                }
                else {
                    str = renderAstNode(node, options, sourcemap, { ...position }, errors, reducer, cache, level + 1, indents);
                }
                if (css === '') {
                    return str;
                }
                if (str === '') {
                    return css;
                }
                return `${css}${options.newLine}${indentSub}${str}`;
            }, '');
            if (options.removeEmpty && children === '') {
                return '';
            }
            if (children.endsWith(';')) {
                children = children.slice(0, -1);
            }
            if ([EnumToken.AtRuleNodeType, EnumToken.KeyframesAtRuleNodeType].includes(data.typ)) {
                return `@${data.nam}${data.val === '' ? '' : options.indent || ' '}${data.val}${options.indent}{${options.newLine}` + (children === '' ? '' : indentSub + children + options.newLine) + indent + `}`;
            }
            return data.sel + `${options.indent}{${options.newLine}` + (children === '' ? '' : indentSub + children + options.newLine) + indent + `}`;
        case EnumToken.CssVariableTokenType:
        case EnumToken.CssVariableImportTokenType:
            return `@value ${data.nam}:${options.indent}${filterValues((options.minify ? data.val : data.val)).reduce(reducer, '').trim()};`;
        case EnumToken.CssVariableDeclarationMapTokenType:
            return `@value ${filterValues(data.vars).reduce((acc, curr) => acc + renderToken(curr), '').trim()} from ${filterValues(data.from).reduce((acc, curr) => acc + renderToken(curr), '').trim()};`;
        case EnumToken.InvalidDeclarationNodeType:
        case EnumToken.InvalidRuleTokenType:
        case EnumToken.InvalidAtRuleTokenType:
        default:
            return '';
    }
}
/**
 * render ast token
 * @param token
 * @param options
 */
function renderToken(token, options = {}, cache = Object.create(null), reducer, errors) {
    if (reducer == null) {
        reducer = function (acc, curr) {
            if (curr.typ == EnumToken.CommentTokenType && options.removeComments) {
                if (!options.preserveLicense || !curr.val.startsWith('/*!')) {
                    return acc;
                }
                return acc + curr.val;
            }
            return acc + renderToken(curr, options, cache, reducer, errors);
        };
    }
    if (token.typ == EnumToken.FunctionTokenType && colorsFunc.includes(token.val)) {
        if (isColor(token)) {
            // @ts-ignore
            token.typ = EnumToken.ColorTokenType;
            // @ts-ignore
            if (token.chi[0].typ == EnumToken.IdenTokenType && token.chi[0].val == 'from') {
                // @ts-ignore
                token.cal = 'rel';
            }
            else { // @ts-ignore
                if (token.val == 'color-mix' && token.chi[0].typ == EnumToken.IdenTokenType && token.chi[0].val == 'in') {
                    // @ts-ignore
                    token.cal = 'mix';
                }
                else {
                    // @ts-ignore
                    if (token.val == 'color') {
                        // @ts-ignore
                        token.cal = 'col';
                    }
                    // @ts-ignore
                    token.chi = token.chi.filter((t) => ![EnumToken.WhitespaceTokenType, EnumToken.CommaTokenType, EnumToken.CommentTokenType].includes(t.typ));
                }
            }
        }
    }
    switch (token.typ) {
        case EnumToken.ListToken:
            return token.chi.reduce((acc, curr) => acc + renderToken(curr, options, cache), '');
        case EnumToken.BinaryExpressionTokenType:
            if ([EnumToken.Mul, EnumToken.Div].includes(token.op)) {
                let result = '';
                if (token.l.typ == EnumToken.BinaryExpressionTokenType &&
                    [EnumToken.Add, EnumToken.Sub].includes(token.l.op)) {
                    result = '(' + renderToken(token.l, options, cache) + ')';
                }
                else {
                    result = renderToken(token.l, options, cache);
                }
                result += token.op == EnumToken.Mul ? '*' : '/';
                if (token.r.typ == EnumToken.BinaryExpressionTokenType &&
                    [EnumToken.Add, EnumToken.Sub].includes(token.r.op)) {
                    result += '(' + renderToken(token.r, options, cache) + ')';
                }
                else {
                    result += renderToken(token.r, options, cache);
                }
                return result;
            }
            return renderToken(token.l, options, cache) + (token.op == EnumToken.Add ? ' + ' : (token.op == EnumToken.Sub ? ' - ' : (token.op == EnumToken.Mul ? '*' : '/'))) + renderToken(token.r, options, cache);
        case EnumToken.FractionTokenType:
            const fraction = renderToken(token.l) + '/' + renderToken(token.r);
            if (+token.r.val != 0) {
                const value = minifyNumber(+token.l.val / +token.r.val);
                if (value.length <= fraction.length) {
                    return value;
                }
            }
            return fraction;
        case EnumToken.Add:
            return ' + ';
        case EnumToken.Sub:
            return ' - ';
        case EnumToken.UniversalSelectorTokenType:
        case EnumToken.Mul:
            return '*';
        case EnumToken.Div:
            return '/';
        case EnumToken.ColorTokenType:
            if (token.kin == ColorType.LIGHT_DARK || ('chi' in token && options.convertColor === false)) {
                return token.val + '(' + token.chi.reduce((acc, curr) => acc + renderToken(curr, options, cache), '') + ')';
            }
            if (options.convertColor !== false) {
                const value = convertColor(token, typeof options.convertColor == 'boolean' ? ColorType.HEX : ColorType[ColorType[options.convertColor ?? 'HEX']?.toUpperCase?.().replaceAll?.('-', '_')] ?? ColorType.HEX);
                //
                if (value != null) {
                    token = value;
                }
            }
            if ([ColorType.HEX, ColorType.LIT, ColorType.SYS, ColorType.DPSYS].includes(token.kin)) {
                return token.val;
            }
            if (Array.isArray(token.chi)) {
                const isLegacy = ['rgb', 'rgba', 'hsl', 'hsla'].includes(token.val.toLowerCase());
                const useAlpha = (['rgb', 'rgba', 'hsl', 'hsla', 'hwb', 'oklab', 'oklch', 'lab', 'lch'].includes(token.val.toLowerCase()) && token.chi.length == 4) ||
                    ('color' == token.val.toLowerCase() && token.chi.length == 5);
                return (token.val.endsWith('a') ? token.val.slice(0, -1) : token.val) + '(' + token.chi.reduce((acc, curr, index, array) => {
                    if (/[,/]\s*$/.test(acc)) {
                        if (curr.typ == EnumToken.WhitespaceTokenType) {
                            return acc.trimEnd();
                        }
                        return acc.trimStart() + renderToken(curr, options, cache);
                    }
                    if (isLegacy && curr.typ == EnumToken.CommaTokenType) {
                        return acc.trimEnd() + ' ';
                    }
                    if (curr.typ == EnumToken.WhitespaceTokenType) {
                        return acc.trimEnd() + ' ';
                    }
                    if (curr.typ == EnumToken.CommaTokenType || (curr.typ == EnumToken.LiteralTokenType && curr.val == '/')) {
                        return acc.trimEnd() + (curr.typ == EnumToken.CommaTokenType ? ',' : '/');
                    }
                    return acc.trimEnd() + (useAlpha && index == array.length - 1 ? '/' : ' ') + renderToken(curr, options, cache);
                }, '').trimStart() + ')';
            }
        case EnumToken.ParensTokenType:
        case EnumToken.FunctionTokenType:
        case EnumToken.UrlFunctionTokenType:
        case EnumToken.ImageFunctionTokenType:
        case EnumToken.TimingFunctionTokenType:
        case EnumToken.PseudoClassFuncTokenType:
        case EnumToken.TimelineFunctionTokenType:
        case EnumToken.GridTemplateFuncTokenType:
            if (token.typ == EnumToken.FunctionTokenType &&
                mathFuncs.includes(token.val) &&
                token.chi.length == 1 &&
                ![EnumToken.BinaryExpressionTokenType, EnumToken.FractionTokenType, EnumToken.IdenTokenType].includes(token.chi[0].typ) &&
                // @ts-ignore
                token.chi[0].val?.typ != EnumToken.FractionTokenType) {
                return token.val + '(' + token.chi.reduce((acc, curr) => acc + renderToken(curr, options, cache, reducer), '') + ')';
            }
            return ( /* options.minify && 'Pseudo-class-func' == token.typ && token.val.slice(0, 2) == '::' ? token.val.slice(1) :*/token.val ?? '') + '(' + token.chi.reduce(reducer, '') + ')';
        case EnumToken.MatchExpressionTokenType:
            return renderToken(token.l, options, cache, reducer, errors) +
                renderToken(token.op, options, cache, reducer, errors) +
                renderToken(token.r, options, cache, reducer, errors) +
                (token.attr ? ' ' + token.attr : '');
        case EnumToken.NameSpaceAttributeTokenType:
            return (token.l == null ? '' : renderToken(token.l, options, cache, reducer, errors)) + '|' +
                renderToken(token.r, options, cache, reducer, errors);
        case EnumToken.ComposesSelectorNodeType:
            return token.l.reduce((acc, curr) => acc + renderToken(curr, options, cache), '') + (token.r == null ? '' : ' from ' + renderToken(token.r, options, cache, reducer, errors));
        case EnumToken.BlockStartTokenType:
            return '{';
        case EnumToken.BlockEndTokenType:
            return '}';
        case EnumToken.StartParensTokenType:
            return '(';
        case EnumToken.DelimTokenType:
        case EnumToken.EqualMatchTokenType:
            return '=';
        case EnumToken.IncludeMatchTokenType:
            return '~=';
        case EnumToken.DashMatchTokenType:
            return '|=';
        case EnumToken.StartMatchTokenType:
            return '^=';
        case EnumToken.EndMatchTokenType:
            return '$=';
        case EnumToken.ContainMatchTokenType:
            return '*=';
        case EnumToken.LtTokenType:
            return '<';
        case EnumToken.LteTokenType:
            return '<=';
        case EnumToken.SubsequentSiblingCombinatorTokenType:
            return '~';
        case EnumToken.NextSiblingCombinatorTokenType:
            return '+';
        case EnumToken.GtTokenType:
        case EnumToken.ChildCombinatorTokenType:
            return '>';
        case EnumToken.GteTokenType:
            return '>=';
        case EnumToken.ColumnCombinatorTokenType:
            return '||';
        case EnumToken.EndParensTokenType:
            return ')';
        case EnumToken.AttrStartTokenType:
            return '[';
        case EnumToken.AttrEndTokenType:
            return ']';
        case EnumToken.DescendantCombinatorTokenType:
        case EnumToken.WhitespaceTokenType:
            return ' ';
        case EnumToken.ColonTokenType:
            return ':';
        case EnumToken.SemiColonTokenType:
            return ';';
        case EnumToken.CommaTokenType:
            return ',';
        case EnumToken.ImportantTokenType:
            return '!important';
        case EnumToken.AttrTokenType:
        case EnumToken.IdenListTokenType:
            return '[' + token.chi.reduce(reducer, '') + ']';
        case EnumToken.TimeTokenType:
        case EnumToken.AngleTokenType:
        case EnumToken.LengthTokenType:
        case EnumToken.DimensionTokenType:
        case EnumToken.FrequencyTokenType:
        case EnumToken.ResolutionTokenType:
            let val = token.val.typ == EnumToken.FractionTokenType ? renderToken(token.val, options, cache) : minifyNumber(token.val);
            let unit = token.unit;
            if (token.typ == EnumToken.AngleTokenType && !val.includes('/')) {
                const angle = getAngle(token);
                let v;
                let value = val + unit;
                for (const u of ['turn', 'deg', 'rad', 'grad']) {
                    if (token.unit == u) {
                        continue;
                    }
                    switch (u) {
                        case 'turn':
                            v = minifyNumber(angle);
                            if (v.length + 4 < value.length) {
                                val = v;
                                unit = u;
                                value = v + u;
                            }
                            break;
                        case 'deg':
                            v = minifyNumber(angle * 360);
                            if (v.length + 3 < value.length) {
                                val = v;
                                unit = u;
                                value = v + u;
                            }
                            break;
                        case 'rad':
                            v = minifyNumber(angle * (2 * Math.PI));
                            if (v.length + 3 < value.length) {
                                val = v;
                                unit = u;
                                value = v + u;
                            }
                            break;
                        case 'grad':
                            v = minifyNumber(angle * 400);
                            if (v.length + 4 < value.length) {
                                val = v;
                                unit = u;
                                value = v + u;
                            }
                            break;
                    }
                }
            }
            if (val === '0') {
                if (token.typ == EnumToken.TimeTokenType) {
                    return '0s';
                }
                if (token.typ == EnumToken.FrequencyTokenType) {
                    return '0Hz';
                }
                // @ts-ignore
                if (token.typ == EnumToken.ResolutionTokenType) {
                    return '0x';
                }
                return '0';
            }
            if (token.typ == EnumToken.TimeTokenType) {
                if (unit == 'ms') {
                    // @ts-ignore
                    const v = minifyNumber(val / 1000);
                    if (v.length + 1 <= val.length) {
                        return v + 's';
                    }
                    return val + 'ms';
                }
                return val + 's';
            }
            if (token.typ == EnumToken.ResolutionTokenType && unit == 'dppx') {
                unit = 'x';
            }
            return val.includes('/') ? val.replace('/', unit + '/') : val + unit;
        case EnumToken.FlexTokenType:
        case EnumToken.PercentageTokenType:
            const uni = token.typ == EnumToken.PercentageTokenType ? '%' : 'fr';
            const perc = token.val.typ == EnumToken.FractionTokenType ? renderToken(token.val, options, cache) : minifyNumber(token.val);
            return options.minify && perc == '0' ? '0' : (perc.includes('/') ? perc.replace('/', uni + '/') : perc + uni);
        case EnumToken.NumberTokenType:
            return token.val.typ == EnumToken.FractionTokenType ? renderToken(token.val, options, cache) : minifyNumber(token.val);
        case EnumToken.CommentTokenType:
            if (options.removeComments && (!options.preserveLicense || !token.val.startsWith('/*!'))) {
                return '';
            }
        case EnumToken.PseudoClassTokenType:
        case EnumToken.PseudoElementTokenType:
            // https://www.w3.org/TR/selectors-4/#single-colon-pseudos
            if (token.typ == EnumToken.PseudoElementTokenType && pseudoElements.includes(token.val.slice(1))) {
                return token.val.slice(1);
            }
        case EnumToken.UrlTokenTokenType:
        // if (token.typ == EnumToken.UrlTokenTokenType) {
        //
        //     if (options.output != null) {
        //
        //         if (!('original' in token)) {
        //
        //             // do not modify original token
        //             token = {...token};
        //             Object.defineProperty(token, 'original', {
        //                 enumerable: false,
        //                 writable: false,
        //                 value: (token as UrlToken).val
        //             })
        //         }
        //
        //         // @ts-ignore
        //         if (!(token.original in cache)) {
        //
        //             let output: string = <string>options.output ?? '';
        //             const key = output + 'abs';
        //
        //             if (!(key in cache)) {
        //
        //                 // @ts-ignore
        //                 cache[key] = options.dirname(options.resolve(output, options.cwd).absolute);
        //             }
        //
        //             // @ts-ignore
        //             cache[token.original] = options.resolve(token.original, cache[key]).relative;
        //         }
        //
        //         // @ts-ignore
        //         token.val = cache[token.original];
        //     }
        // }
        case EnumToken.HashTokenType:
        case EnumToken.IdenTokenType:
        case EnumToken.AtRuleTokenType:
        case EnumToken.StringTokenType:
        case EnumToken.LiteralTokenType:
        case EnumToken.DashedIdenTokenType:
        case EnumToken.PseudoPageTokenType:
        case EnumToken.ClassSelectorTokenType:
            return /* options.minify && 'Pseudo-class' == token.typ && '::' == token.val.slice(0, 2) ? token.val.slice(1) :  */ token.val;
        case EnumToken.NestingSelectorTokenType:
            return '&';
        case EnumToken.InvalidAttrTokenType:
            return '[' + token.chi.reduce((acc, curr) => acc + renderToken(curr, options, cache), '');
        case EnumToken.InvalidClassSelectorTokenType:
            return token.val;
        case EnumToken.DeclarationNodeType:
            return token.nam + ':' + (options.minify ? filterValues(token.val) : token.val).reduce((acc, curr) => acc + renderToken(curr, options, cache), '');
        case EnumToken.MediaQueryConditionTokenType:
            return renderToken(token.l, options, cache, reducer, errors) + renderToken(token.op, options, cache, reducer, errors) + token.r.reduce((acc, curr) => acc + renderToken(curr, options, cache), '');
        case EnumToken.MediaFeatureTokenType:
            return token.val;
        case EnumToken.MediaFeatureNotTokenType:
            return 'not ' + renderToken(token.val, options, cache, reducer, errors);
        case EnumToken.MediaFeatureOnlyTokenType:
            return 'only ' + renderToken(token.val, options, cache, reducer, errors);
        case EnumToken.MediaFeatureAndTokenType:
            return 'and';
        case EnumToken.MediaFeatureOrTokenType:
            return 'or';
    }
    errors?.push({ action: 'ignore', message: `render: unexpected token ${JSON.stringify(token, null, 1)}` });
    return '';
}
/**
 * Remove whitespace tokens that are not needed
 * @param values
 *
 * @internal
 */
function filterValues(values) {
    let i = 0;
    for (; i < values.length; i++) {
        if (values[i].typ == EnumToken.ImportantTokenType && values[i - 1]?.typ == EnumToken.WhitespaceTokenType) {
            values.splice(i - 1, 1);
        }
        else if (funcLike.includes(values[i].typ) && !['var', 'calc'].includes(values[i].val) && values[i + 1]?.typ == EnumToken.WhitespaceTokenType) {
            values.splice(i + 1, 1);
        }
    }
    return values;
}

export { doRender, filterValues, renderToken };
