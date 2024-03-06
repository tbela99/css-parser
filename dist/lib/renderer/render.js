import { getAngle, getNumber, clamp } from './color/color.js';
import { COLORS_NAMES } from './color/utils/constants.js';
import { getComponents } from './color/utils/components.js';
import { srgb2hexvalues, reduceHexValue, rgb2hex, hsl2hex, hwb2hex, cmyk2hex, oklab2hex, oklch2hex, lab2hex, lch2hex } from './color/hex.js';
import { xyz2srgb, lsrgb2srgb } from './color/srgb.js';
import { EnumToken } from '../ast/types.js';
import '../ast/minify.js';
import { expand } from '../ast/expand.js';
import { colorMix } from './color/colormix.js';
import { xyzd502srgb } from './color/xyz.js';
import { parseRelativeColor } from './color/relativecolor.js';
import { prophotoRgb2srgbvalues } from './color/prophotorgb.js';
import { a98rgb2srgbvalues } from './color/a98rgb.js';
import { rec20202srgb } from './color/rec2020.js';
import { SourceMap } from './sourcemap/sourcemap.js';
import '../parser/parse.js';
import { isColor, isNewLine } from '../parser/utils/syntax.js';
import { p32srgb } from './color/displayp3.js';

const colorsFunc = ['rgb', 'rgba', 'hsl', 'hsla', 'hwb', 'device-cmyk', 'color-mix', 'color', 'oklab', 'lab', 'oklch', 'lch'];
function reduceNumber(val) {
    val = String(+val);
    if (val === '0') {
        return '0';
    }
    const chr = val.charAt(0);
    if (chr == '-') {
        const slice = val.slice(0, 2);
        if (slice == '-0') {
            return val.length == 2 ? '0' : '-' + val.slice(2);
        }
    }
    if (chr == '0') {
        return val.slice(1);
    }
    return val;
}
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
function doRender(data, options = {}) {
    options = {
        ...(options.minify ?? true ? {
            indent: '',
            newLine: '',
            removeComments: true
        } : {
            indent: ' ',
            newLine: '\n',
            compress: false,
            removeComments: false,
        }), sourcemap: false, convertColor: true, expandNestingRules: false, preserveLicense: false, ...options
    };
    const startTime = performance.now();
    const errors = [];
    const sourcemap = options.sourcemap ? new SourceMap : null;
    const cache = Object.create(null);
    const result = {
        code: renderAstNode(options.expandNestingRules ? expand(data) : data, options, sourcemap, {
            ind: 0,
            lin: 1,
            col: 1
        }, errors, function reducer(acc, curr) {
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
        result.map = sourcemap.toJSON();
    }
    return result;
}
function updateSourceMap(node, options, cache, sourcemap, position, str) {
    if ([EnumToken.RuleNodeType, EnumToken.AtRuleNodeType].includes(node.typ)) {
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
// @ts-ignore
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
            return `${data.nam}:${options.indent}${data.val.reduce(reducer, '')}`;
        case EnumToken.CommentNodeType:
        case EnumToken.CDOCOMMNodeType:
            if (data.val.startsWith('# sourceMappingURL=')) {
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
                    if (sourcemap != null) {
                        updateSourceMap(node, options, cache, sourcemap, position, str);
                    }
                    return str;
                }
                if (sourcemap != null) {
                    update(position, options.newLine);
                    updateSourceMap(node, options, cache, sourcemap, position, str);
                }
                return `${css}${options.newLine}${str}`;
            }, '');
        case EnumToken.AtRuleNodeType:
        case EnumToken.RuleNodeType:
            if (data.typ == EnumToken.AtRuleNodeType && !('chi' in data)) {
                return `${indent}@${data.nam}${data.val === '' ? '' : options.indent || ' '}${data.val};`;
            }
            // @ts-ignore
            let children = data.chi.reduce((css, node) => {
                let str;
                if (node.typ == EnumToken.CommentNodeType) {
                    str = options.removeComments && (!options.preserveLicense || !node.val.startsWith('/*!')) ? '' : node.val;
                }
                else if (node.typ == EnumToken.DeclarationNodeType) {
                    if (node.val.length == 0) {
                        // @ts-ignore
                        errors.push({
                            action: 'ignore',
                            message: `render: invalid declaration ${JSON.stringify(node)}`,
                            location: node.loc
                        });
                        return '';
                    }
                    str = `${node.nam}:${options.indent}${node.val.reduce(reducer, '').trimEnd()};`;
                }
                else if (node.typ == EnumToken.AtRuleNodeType && !('chi' in node)) {
                    str = `${data.val === '' ? '' : options.indent || ' '}${data.val};`;
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
            if (children.endsWith(';')) {
                children = children.slice(0, -1);
            }
            if (data.typ == EnumToken.AtRuleNodeType) {
                return `@${data.nam}${data.val === '' ? '' : options.indent || ' '}${data.val}${options.indent}{${options.newLine}` + (children === '' ? '' : indentSub + children + options.newLine) + indent + `}`;
            }
            return data.sel + `${options.indent}{${options.newLine}` + (children === '' ? '' : indentSub + children + options.newLine) + indent + `}`;
    }
    return '';
}
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
            if (token.chi[0].typ == EnumToken.IdenTokenType && token.chi[0].val == 'from') {
                // @ts-ignore
                token.cal = 'rel';
            }
            else if (token.val == 'color-mix' && token.chi[0].typ == EnumToken.IdenTokenType && token.chi[0].val == 'in') {
                // @ts-ignore
                token.cal = 'mix';
            }
            else {
                if (token.val == 'color') {
                    // @ts-ignore
                    token.cal = 'col';
                }
                token.chi = token.chi.filter((t) => ![EnumToken.WhitespaceTokenType, EnumToken.CommaTokenType, EnumToken.CommentTokenType].includes(t.typ));
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
                const value = reduceNumber(+token.l.val / +token.r.val);
                if (value.length <= fraction.length) {
                    return value;
                }
            }
            return fraction;
        case EnumToken.Add:
            return ' + ';
        case EnumToken.Sub:
            return ' - ';
        case EnumToken.Mul:
            return '*';
        case EnumToken.Div:
            return '/';
        case EnumToken.ColorTokenType:
            if (options.convertColor) {
                if (token.cal == 'mix' && token.val == 'color-mix') {
                    const children = token.chi.reduce((acc, t) => {
                        if (t.typ == EnumToken.ColorTokenType) {
                            acc.push([t]);
                        }
                        else {
                            if (![EnumToken.WhitespaceTokenType, EnumToken.CommentTokenType].includes(t.typ)) {
                                acc[acc.length - 1].push(t);
                            }
                        }
                        return acc;
                    }, [[]]);
                    const value = colorMix(children[0][1], children[0][2], children[1][0], children[1][1], children[2][0], children[2][1]);
                    if (value != null) {
                        token = value;
                    }
                }
                if (token.val == 'color') {
                    const supportedColorSpaces = ['srgb', 'srgb-linear', 'display-p3', 'prophoto-rgb', 'a98-rgb', 'rec2020', 'xyz', 'xyz-d65', 'xyz-d50'];
                    if (token.chi[0].typ == EnumToken.IdenTokenType && supportedColorSpaces.includes(token.chi[0].val.toLowerCase())) {
                        let values = getComponents(token).slice(1).map((t) => {
                            if (t.typ == EnumToken.IdenTokenType && t.val == 'none') {
                                return 0;
                            }
                            return getNumber(t);
                        });
                        const colorSpace = token.chi[0].val.toLowerCase();
                        switch (colorSpace) {
                            case 'display-p3':
                                // @ts-ignore
                                values = p32srgb(...values);
                                break;
                            case 'srgb-linear':
                                // @ts-ignore
                                values = lsrgb2srgb(...values);
                                break;
                            case 'prophoto-rgb':
                                // @ts-ignore
                                values = prophotoRgb2srgbvalues(...values);
                                break;
                            case 'a98-rgb':
                                // @ts-ignore
                                values = a98rgb2srgbvalues(...values);
                                break;
                            case 'rec2020':
                                // @ts-ignore
                                values = rec20202srgb(...values);
                                break;
                            case 'xyz':
                            case 'xyz-d65':
                                // @ts-ignore
                                values = xyz2srgb(...values);
                                break;
                            case 'xyz-d50':
                                // @ts-ignore
                                values = xyzd502srgb(...values);
                                break;
                        }
                        // clampValues(values, colorSpace);
                        // if (values.length == 4 && values[3] == 1) {
                        //
                        //     values.pop();
                        // }
                        // @ts-ignore
                        let value = srgb2hexvalues(...values);
                        // if ((<Token[]>token.chi).length == 6) {
                        //
                        //     if ((<Token[]>token.chi)[5].typ == EnumToken.NumberTokenType || (<Token[]>token.chi)[5].typ == EnumToken.PercentageTokenType) {
                        //
                        //         let c: number = 255 * +(<NumberToken>(<Token[]>token.chi)[5]).val;
                        //
                        //         if ((<Token[]>token.chi)[5].typ == EnumToken.PercentageTokenType) {
                        //
                        //             c /= 100;
                        //         }
                        //
                        //         value += Math.round(c).toString(16).padStart(2, '0');
                        //     }
                        // }
                        return reduceHexValue(value);
                    }
                }
                else if (token.cal == 'rel' && ['rgb', 'hsl', 'hwb', 'lab', 'lch', 'oklab', 'oklch'].includes(token.val)) {
                    const chi = getComponents(token);
                    const components = parseRelativeColor(token.val, chi[1], chi[2], chi[3], chi[4], chi[5]);
                    if (components != null) {
                        token.chi = Object.values(components);
                        delete token.cal;
                    }
                }
                if (token.cal != null) {
                    let slice = false;
                    if (token.cal == 'rel') {
                        const last = token.chi.at(-1);
                        if ((last.typ == EnumToken.NumberTokenType && last.val == '1') || (last.typ == EnumToken.IdenTokenType && last.val == 'none')) {
                            const prev = token.chi.at(-2);
                            if (prev.typ == EnumToken.LiteralTokenType && prev.val == '/') {
                                slice = true;
                            }
                        }
                    }
                    return clamp(token).val + '(' + (slice ? token.chi.slice(0, -2) : token.chi).reduce((acc, curr) => {
                        const val = renderToken(curr, options, cache);
                        if ([EnumToken.LiteralTokenType, EnumToken.CommaTokenType].includes(curr.typ)) {
                            return acc + val;
                        }
                        if (acc.length > 0) {
                            return acc + (['/', ','].includes(acc.at(-1)) ? '' : ' ') + val;
                        }
                        return val;
                    }, '') + ')';
                }
                if (token.kin == 'lit' && token.val.localeCompare('currentcolor', undefined, { sensitivity: 'base' }) == 0) {
                    return 'currentcolor';
                }
                clamp(token);
                if (Array.isArray(token.chi) && token.chi.some((t) => t.typ == EnumToken.FunctionTokenType || (t.typ == EnumToken.ColorTokenType && Array.isArray(t.chi)))) {
                    return (token.val.endsWith('a') ? token.val.slice(0, -1) : token.val) + '(' + token.chi.reduce((acc, curr) => acc + (acc.length > 0 && !(acc.endsWith('/') || curr.typ == EnumToken.LiteralTokenType) ? ' ' : '') + renderToken(curr, options, cache), '') + ')';
                }
                let value = token.kin == 'hex' ? token.val.toLowerCase() : (token.kin == 'lit' ? COLORS_NAMES[token.val.toLowerCase()] : '');
                if (token.val == 'rgb' || token.val == 'rgba') {
                    value = rgb2hex(token);
                }
                else if (token.val == 'hsl' || token.val == 'hsla') {
                    value = hsl2hex(token);
                }
                else if (token.val == 'hwb') {
                    value = hwb2hex(token);
                }
                else if (token.val == 'device-cmyk') {
                    value = cmyk2hex(token);
                }
                else if (token.val == 'oklab') {
                    value = oklab2hex(token);
                }
                else if (token.val == 'oklch') {
                    value = oklch2hex(token);
                }
                else if (token.val == 'lab') {
                    value = lab2hex(token);
                }
                else if (token.val == 'lch') {
                    value = lch2hex(token);
                }
                if (value !== '') {
                    return reduceHexValue(value);
                }
            }
            if (token.kin == 'hex' || token.kin == 'lit') {
                return token.val;
            }
            if (Array.isArray(token.chi)) {
                return (token.val.endsWith('a') ? token.val.slice(0, -1) : token.val) + '(' + token.chi.reduce((acc, curr) => acc + (acc.length > 0 && !(acc.endsWith('/') || curr.typ == EnumToken.LiteralTokenType) ? ' ' : '') + renderToken(curr, options, cache), '') + ')';
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
                token.val == 'calc' &&
                token.chi.length == 1 &&
                token.chi[0].typ != EnumToken.BinaryExpressionTokenType &&
                token.chi[0].typ != EnumToken.FractionTokenType &&
                token.chi[0].val?.typ != EnumToken.FractionTokenType) {
                // calc(200px) => 200px
                return token.chi.reduce((acc, curr) => acc + renderToken(curr, options, cache, reducer), '');
            }
            // @ts-ignore
            return ( /* options.minify && 'Pseudo-class-func' == token.typ && token.val.slice(0, 2) == '::' ? token.val.slice(1) :*/token.val ?? '') + '(' + token.chi.reduce(reducer, '') + ')';
        case EnumToken.MatchExpressionTokenType:
            return renderToken(token.l, options, cache, reducer, errors) +
                renderToken({ typ: token.op }, options, cache, reducer, errors) +
                renderToken(token.r, options, cache, reducer, errors) +
                (token.attr ? ' ' + token.attr : '');
        case EnumToken.NameSpaceAttributeTokenType:
            return (token.l == null ? '' : renderToken(token.l, options, cache, reducer, errors) + '|') +
                renderToken(token.r, options, cache, reducer, errors);
        case EnumToken.BlockStartTokenType:
            return '{';
        case EnumToken.BlockEndTokenType:
            return '}';
        case EnumToken.StartParensTokenType:
            return '(';
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
        case EnumToken.GtTokenType:
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
            let val = token.val.typ == EnumToken.FractionTokenType ? renderToken(token.val, options, cache) : reduceNumber(token.val);
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
                            v = reduceNumber(angle);
                            if (v.length + 4 < value.length) {
                                val = v;
                                unit = u;
                                value = v + u;
                            }
                            break;
                        case 'deg':
                            v = reduceNumber(angle * 360);
                            if (v.length + 3 < value.length) {
                                val = v;
                                unit = u;
                                value = v + u;
                            }
                            break;
                        case 'rad':
                            v = reduceNumber(angle * (2 * Math.PI));
                            if (v.length + 3 < value.length) {
                                val = v;
                                unit = u;
                                value = v + u;
                            }
                            break;
                        case 'grad':
                            v = reduceNumber(angle * 400);
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
                    const v = reduceNumber(val / 1000);
                    if (v.length + 1 <= val.length) {
                        return v + 's';
                    }
                    return val + 'ms';
                }
                return val + 's';
            }
            return val.includes('/') ? val.replace('/', unit + '/') : val + unit;
        case EnumToken.FlexTokenType:
        case EnumToken.PercentageTokenType:
            const uni = token.typ == EnumToken.PercentageTokenType ? '%' : 'fr';
            const perc = token.val.typ == EnumToken.FractionTokenType ? renderToken(token.val, options, cache) : reduceNumber(token.val);
            return options.minify && perc == '0' ? '0' : (perc.includes('/') ? perc.replace('/', uni + '/') : perc + uni);
        case EnumToken.NumberTokenType:
            return token.val.typ == EnumToken.FractionTokenType ? renderToken(token.val, options, cache) : reduceNumber(token.val);
        case EnumToken.CommentTokenType:
            if (options.removeComments && (!options.preserveLicense || !token.val.startsWith('/*!'))) {
                return '';
            }
        case EnumToken.PseudoClassTokenType:
            // https://www.w3.org/TR/selectors-4/#single-colon-pseudos
            if (token.typ == EnumToken.PseudoClassTokenType && ['::before', '::after', '::first-line', '::first-letter'].includes(token.val)) {
                return token.val.slice(1);
            }
        case EnumToken.UrlTokenTokenType:
            if (token.typ == EnumToken.UrlTokenTokenType) {
                if (options.output != null) {
                    if (!('original' in token)) {
                        // do not modify original token
                        token = { ...token };
                        Object.defineProperty(token, 'original', { enumerable: false, writable: false, value: token.val });
                    }
                    // @ts-ignore
                    if (!(token.original in cache)) {
                        let output = options.output ?? '';
                        const key = output + 'abs';
                        if (!(key in cache)) {
                            // @ts-ignore
                            cache[key] = options.dirname(options.resolve(output, options.cwd).absolute);
                        }
                        // @ts-ignore
                        cache[token.original] = options.resolve(token.original, cache[key]).relative;
                    }
                    // @ts-ignore
                    token.val = cache[token.original];
                }
            }
        case EnumToken.HashTokenType:
        case EnumToken.IdenTokenType:
        case EnumToken.DelimTokenType:
        case EnumToken.AtRuleTokenType:
        case EnumToken.StringTokenType:
        case EnumToken.LiteralTokenType:
        case EnumToken.DashedIdenTokenType:
            return /* options.minify && 'Pseudo-class' == token.typ && '::' == token.val.slice(0, 2) ? token.val.slice(1) :  */ token.val;
    }
    errors?.push({ action: 'ignore', message: `render: unexpected token ${JSON.stringify(token, null, 1)}` });
    return '';
}

export { colorsFunc, doRender, reduceNumber, renderToken };
