function match_pair(css, index, open, close) {
    const str = Array.isArray(css) ? css : [...css];
    let count = 1;
    let currentIndex = index;
    let j = str.length;
    while (currentIndex++ < j) {
        if (str[currentIndex] == '\\') {
            currentIndex++;
            continue;
        }
        if (open != str[currentIndex] && close != str[currentIndex] && '"\''.includes(str[currentIndex])) {
            let end = currentIndex;
            while (end++ < j) {
                if (str[end] == '\\') ;
                else if (str[end] == str[currentIndex]) {
                    break;
                }
            }
            currentIndex = end;
            continue;
        }
        if (str[currentIndex] == close) {
            count--;
            if (count == 0) {
                return currentIndex;
            }
        }
        else if (str[currentIndex] == open) {
            count++;
        }
    }
    return null;
}

/**
 * find the position of chr
 * @param css
 * @param start
 * @param chr
 */
function find(css, start, chr) {
    let char;
    let position = start - 1;
    let k;
    const j = css.length - 1;
    while (position++ < j) {
        char = css.charAt(position);
        if (char === '') {
            return null;
        }
        if (char == '\\') {
            position++;
        }
        else if (char == '"' || char == "'") {
            // match quoted string
            const match = char;
            k = position;
            while (k++ < j) {
                char = css.charAt(k);
                if (char === '') {
                    return null;
                }
                if (char == '\\') {
                    k++;
                }
                else if (char == match) {
                    break;
                }
            }
            position = k;
        }
        else if (css.charAt(position) == '/' && css.charAt(position + 1) == '*') {
            k = position + 1;
            while (k++ < j) {
                char = css.charAt(k);
                if (char === '') {
                    return null;
                }
                if (char == '\\') {
                    k++;
                }
                else if (char == '*' && css.charAt(k + 1) == '/') {
                    k++;
                    break;
                }
            }
            position = k;
        }
        else if (chr.includes(char)) {
            return position;
        }
    }
    return null;
}

function parseBlock(str, startIndex, matchIndex = null) {
    let endPos = Number.isInteger(matchIndex) ? matchIndex : find(str, startIndex, ';}{');
    let endBody = null;
    if (endPos != null) {
        if (str.charAt(endPos) == '{') {
            endBody = match_pair(str, endPos, '{', '}');
        }
        else {
            const match = str.slice(startIndex, endPos);
            const type = match[0] == '@' ? 'AtRule' : 'Declaration';
            // @ts-ignore
            const [name, value] = type == 'AtRule' ? parseAtRule(match) : parseDeclaration(match);
            return {
                type,
                name,
                value,
                body: match,
                block: match + str.charAt(endPos)
            };
        }
    }
    // @ts-ignore
    const selector = str.slice(startIndex, matchIndex == null ? endPos : matchIndex);
    return {
        type: selector[0] == '@' ? 'AtRule' : 'Rule',
        selector,
        body: endBody == null ? str.slice(startIndex + selector.length + 1) : str.slice(startIndex + selector.length + 1, endBody),
        block: endPos == null || endBody == null ? str.slice(startIndex) : str.slice(startIndex, endBody + 1)
    };
}
function parseAtRule(block) {
    const match = block.trimStart().match(/^@(\S+)(\s*(.*?))?\s*([;{}]|$)/sm);
    if (match) {
        return [match[1].trim(), match[3].trim()];
    }
    return [];
}
function parseDeclaration(str) {
    const index = find(str, 0, ':');
    if (index == null) {
        return [];
    }
    return [
        str.slice(0, index).trim(),
        str.slice(index + 1).trim()
    ];
}

function parse_comment(str, index) {
    let currentIndex = index;
    if (str[currentIndex] != '/' || str[++currentIndex] != '*') {
        return null;
    }
    while (currentIndex++ < str.length) {
        if (str.charAt(currentIndex) == '*' && str.charAt(currentIndex + 1) == '/') {
            return currentIndex + 1;
        }
    }
    return null;
}

// https://www.w3.org/TR/CSS21/syndata.html#syntax
// https://www.w3.org/TR/2021/CRD-css-syntax-3-20211224/#typedef-ident-token
const nonascii = `[^\u{0}-\u{0ed}]`;
const unicode = `\\[0-9a-f]{1,6}(\r\n|[ \n\r\t\f])?`;
const escape = `${unicode}|\\[^\n\r\f0-9a-f]`;
const nmstart = `[_a-z]|${nonascii}|${escape}`;
const nmchar = `[_a-z0-9-]|${nonascii}|${escape}`;
const ident = `[-]{0,2}${nmstart}${nmchar}*`;
function isIdent(name) {
    if (Array.isArray(name)) {
        name = name.join('');
    }
    return name != null && new RegExp(`^${ident}$`).test(name);
}
function isNewLine(str) {
    return str == '\n' || str == '\r\n' || str == '\r' || str == '\f';
}
function isWhiteSpace(str) {
    return /^\s$/sm.test(str);
}

function update(location, css) {
    if (css.length == 0) {
        return location;
    }
    let chr;
    let i = -1;
    const j = css.length - 1;
    while (++i <= j) {
        chr = css.charAt(i);
        if (chr === '') {
            break;
        }
        if (isNewLine(chr)) {
            location.line++;
            location.column = 0;
            if (chr == '\r' && css.charAt(i + 1) == '\n') {
                i++;
                location.index++;
            }
        }
        else {
            location.column++;
        }
        location.index++;
    }
    return location;
}

class Tokenizer {
    #root;
    constructor(root) {
        this.#root = root;
    }
    *parse(str) {
        if (str === '') {
            return;
        }
        let value;
        let node;
        let index;
        let info;
        this.#root.location.src || '';
        let i = 0;
        let chr;
        // const css: string[] = Array.isArray(str) ? <string[]>str : [...str];
        const j = str.length - 1;
        const position = this.#root.location.end;
        while (i <= j) {
            chr = str.charAt(i);
            if (chr === '') {
                break;
            }
            if (isWhiteSpace(chr)) {
                let whitespace = '';
                do {
                    whitespace += chr;
                    chr = str.charAt(++i);
                } while (i <= j && isWhiteSpace(chr));
                update(position, whitespace);
            }
            if (i > j) {
                break;
            }
            // parse comment
            if (chr == '/' && str.charAt(i + 1) == '*') {
                index = parse_comment(str, i);
                if (index == null) {
                    value = str.slice(i);
                    node = {
                        location: {
                            start: update({ ...position }, value.charAt(0)),
                            end: { ...update(position, value) }
                        },
                        type: 'InvalidComment',
                        value: value
                    };
                    Object.assign(position, node.location.end);
                    yield { node, direction: 'enter' };
                    break;
                }
                value = str.slice(i, index + 1);
                node = {
                    location: {
                        start: update({ ...position }, value.charAt(0)),
                        end: { ...update({ ...position }, value) }
                    },
                    type: 'Comment',
                    value: value
                };
                Object.assign(position, node.location.end);
                yield { node, direction: 'enter' };
                i += value.length;
                continue;
            }
            else {
                index = find(str, i + 1, ';{}');
                // console.log({index})
                if (index == null) {
                    console.debug({ 'i+1': i + 1, index, str: str.slice(i, i + 15) });
                    value = str.slice(i);
                    console.log(`Declaration or AtRule block? - "${value}`);
                    update(position, value);
                    break;
                }
                else if (str.charAt(index) == '{') {
                    // parse block
                    info = parseBlock(str, i, index);
                    // console.log({info: Object.entries(info).reduce((acc, entry) => {
                    //
                    //         acc[entry[0]] = Array.isArray(entry[1]) ? entry[1].join('') : entry[1];
                    //
                    //         return acc;
                    //     }, {})});
                    if (info.type == 'AtRule') {
                        yield* this.#parseAtRule(position, info);
                    }
                    else {
                        yield* this.#parseRule(position, info);
                    }
                }
                else {
                    const match = str.slice(i, index + 1);
                    info = parseBlock(str, i, index);
                    if (match[0] == '@') {
                        yield* this.#parseAtRule(position, info);
                    }
                    else {
                        yield* this.#parseDeclaration(position, info);
                    }
                }
                i += info.block.length;
                if (j <= info.block.length) {
                    break;
                }
            }
        }
        //
        if (this.#root.type == 'StyleSheet' && position.column == 0) {
            position.column = 1;
        }
    }
    *#parseAtRule(position, info) {
        let node;
        // @ts-ignore
        const { body, selector, block, type } = info;
        if (!('selector' in info)) {
            const { name, value } = info;
            node = {
                location: {
                    start: update({ ...position }, name[0]),
                    end: update({ ...position }, block)
                },
                type,
                value,
                name
            };
            if (node.location.end.column == 0) {
                node.location.end.column = 1;
            }
            yield { node, direction: 'enter' };
            return;
        }
        else {
            const [name, value] = parseAtRule(selector);
            if (!isIdent(name)) {
                node = (body == null ? {
                    location: {
                        start: update({ ...position }, name[0]),
                        end: update({ ...position }, block)
                    },
                    type: 'InvalidAtRule',
                    value,
                    name
                } : {
                    location: {
                        start: update({ ...position }, name[0]),
                        end: update({ ...position }, block)
                    },
                    type: 'InvalidAtRule',
                    value: value,
                    name,
                    body
                });
                Object.assign(position, node.location.end);
                if (node.location.end.column == 0) {
                    node.location.end.column = 1;
                }
                yield { node, direction: 'enter' };
                return;
            }
            else {
                // @ts-ignore
                const { type } = info;
                node = body == null ? {
                    location: {
                        start: update({ ...position }, name[0]),
                        end: update({ ...position }, block)
                    },
                    type,
                    value: value,
                    name
                } : {
                    location: {
                        start: update({ ...position }, name[0]),
                        end: update({ ...position }, selector.concat('{'))
                    },
                    type,
                    value,
                    name,
                    children: []
                };
                yield { node, direction: 'enter' };
                // node.location.end = pos;
                if (body.length > 0) {
                    // @ts-ignore
                    const tokenizer = new Tokenizer(node);
                    // @ts-ignore
                    yield* tokenizer.parse(body);
                }
            }
        }
        const str = block.slice(selector.length + 1 + (body != null ? body.length : 0));
        if (str.length > 0) {
            update(node.location.end, str);
        }
        Object.assign(position, node.location.end);
        if (node.location.end.column == 0) {
            node.location.end.column = 1;
        }
        if ('children' in node) {
            yield { node, direction: 'exit' };
        }
    }
    *#parseRule(position, info) {
        let node;
        // @ts-ignore
        const { body, selector, block } = info;
        // @ts-ignore
        node = {
            location: {
                start: update({ ...position }, selector[0]),
                end: update({ ...position }, selector.concat('{'))
            },
            type: 'Rule',
            selector: selector.trimEnd(),
            children: []
        };
        // @ts-ignore
        yield { node, direction: 'enter' };
        if (body != null) {
            // @ts-ignore
            const tokenizer = new Tokenizer(node);
            // @ts-ignore
            yield* tokenizer.parse(body);
        }
        const str = block.slice(selector.length + 1 + (body != null ? body.length : 0));
        if (str.length > 0) {
            update(node.location.end, str);
        }
        Object.assign(position, node.location.end);
        if (node.location.end.column == 0) {
            node.location.end.column = 1;
        }
        if ('children' in node) {
            yield { node, direction: 'exit' };
        }
    }
    *#parseDeclaration(position, info) {
        // @ts-ignore
        // const [name, value] = parseDeclaration(info.body);
        // console.debug({info, name, value});
        const { name, value } = info;
        const node = {
            type: 'Declaration',
            location: {
                start: update({ ...position }, name.charAt(0)),
                end: update({ ...position }, info.body),
                // src
            },
            name,
            value
        };
        Object.assign(position, node.location.end);
        const str = info.block.slice(info.body.length);
        if (str.length > 0) {
            update(position, str);
        }
        yield { node, direction: 'enter' };
    }
}

/**
 * a handler that is executed only once
 * <code>
 *     const observer = new Observer;
 *
 *    observer.on('click:once', () => console.log('click'));
 *    observer.trigger('click'); // 'click'
 *    observer.trigger('click'); // nothing ...
 *
 */
function once(name, handler, params, observer) {
    return function (...args) {
        handler(...args);
        observer.off(name, handler);
    };
}

/**
 * a handler that is executed a given number of times
 * <code>
 *     const observer = new Observer;
 *
 *    observer.on('click:times(3)', () => console.log('click'));
 *    observer.trigger('click'); // 'click'
 *    observer.trigger('click'); // 'click'
 *    observer.trigger('click'); // 'click'
 *    observer.trigger('click'); // nothing ...
 *
 */
function times(name, handler, params, observer) {
    let counter = +params - 1;
    if (!Number.isInteger(counter)) {
        throw new Error(`Invalid argument :times(int). expecting number, found ${params}`);
    }
    if (counter < 0) {
        throw new Error(`Invalid argument :times(arg). counter must be greater than 0, found ${params}`);
    }
    return (...args) => {
        if (counter-- === 0) {
            observer.off(name, handler);
        }
        handler(...args);
    };
}

/**
 * a handler that is executed a given number of times
 * <code>
 *     const observer = new Observer;
 *
 *    observer.on('click:debounce(250)', () => console.log('click'));
 *    observer.trigger('click'); //  nothing ...
 *    observer.trigger('click'); //  nothing ...
 *    observer.trigger('click'); //  nothing ...
 *    observer.trigger('click'); // 'click' after at least 250ms since the last call
 *
 */
function debounce(name, handler, params) {
    let duration = +params;
    if (!Number.isInteger(duration)) {
        throw new Error(`Invalid argument :debounce(int). expecting number, found ${params}`);
    }
    if (duration < 0) {
        throw new Error(`Invalid argument :debounce(arg). counter must be greater or equal to 0, found ${params}`);
    }
    // @ts-ignore
    let timer = null;
    return (...args) => {
        if (timer != null) {
            clearTimeout(timer);
        }
        timer = setTimeout(() => handler(...args), duration);
    };
}

/**
 * a handler that is executed a given number of times
 * <code>
 *     const observer = new Observer;
 *
 *    observer.on('click:debounce(250)', () => console.log('click'));
 *    observer.trigger('click'); //  nothing ...
 *    observer.trigger('click'); //  nothing ...
 *    observer.trigger('click'); //  nothing ...
 *    observer.trigger('click'); // 'click' after at least 250ms since the last call
 *
 */
function throttle(name, handler, params) {
    let duration = +params;
    if (!Number.isInteger(duration)) {
        throw new Error(`Invalid argument :throttle(int). expecting number, found ${params}`);
    }
    if (duration < 0) {
        throw new Error(`Invalid argument :throttle(arg). counter must be greater or equal to 0, found ${params}`);
    }
    // @ts-ignore
    let timer = null;
    return (...args) => {
        if (timer != null) {
            return;
        }
        timer = setTimeout(() => {
            timer = null;
            handler(...args);
        }, duration);
    };
}

var pseudos = /*#__PURE__*/Object.freeze({
    __proto__: null,
    debounce: debounce,
    once: once,
    throttle: throttle,
    times: times
});

class Observer {
    #handlers = new Map;
    #pseudo = new Map;
    constructor() {
        for (const entry of Object.entries(pseudos)) {
            // @ts-ignore
            this.definePseudo(entry[0], entry[1]);
        }
    }
    on(name, handler, signal) {
        const match = name.match(/(.*):([^:()]+)(\((.*?)\))?$/);
        let callback = handler;
        if (match != null && this.#pseudo.has(match[2])) {
            name = match[1];
            // @ts-ignore
            callback = this.#pseudo.get(match[2])(name, handler, match[4], this);
        }
        if (!this.#handlers.has(name)) {
            this.#handlers.set(name, new Map);
        }
        signal?.addEventListener('abort', () => this.off(name, handler));
        // @ts-ignore
        this.#handlers.get(name).set(handler, callback);
        return this;
    }
    off(name, handler) {
        if (handler == null) {
            this.#handlers.delete(name);
        }
        else if (this.#handlers.has(name)) {
            // @ts-ignore
            this.#handlers.get(name).delete(handler);
            // @ts-ignore
            if (this.#handlers.get(name).size === 0) {
                this.#handlers.delete(name);
            }
        }
        return this;
    }
    trigger(name, ...args) {
        if (this.#handlers.has(name)) {
            // @ts-ignore
            for (const handler of this.#handlers.get(name).values()) {
                handler(...args);
            }
        }
    }
    definePseudo(pseudo, parser) {
        this.#pseudo.set(pseudo, parser);
    }
    hasListeners(name) {
        if (arguments.length > 0) {
            // @ts-ignore
            return this.#handlers.has(name);
        }
        return this.#handlers.size > 0;
    }
    getListeners(...args) {
        if (args.length == 0 || args.length > 1) {
            return [...(args.length > 1 ? args : this.#handlers.keys())].reduce((acc, curr) => {
                if (this.#handlers.has(curr)) {
                    // @ts-ignore
                    acc[curr] = [...this.#handlers.get(curr).keys()];
                }
                return acc;
            }, Object.create(null));
        }
        if (this.#handlers.has(args[0])) {
            // @ts-ignore
            return [...this.#handlers.get(args[0]).keys()];
        }
        return [];
    }
}

class Parser {
    #options;
    #observer;
    #tokenizer;
    #root;
    #errors = [];
    constructor(options = {
        strict: false
    }) {
        this.#options = { strict: false, ...options };
        this.#observer = new Observer();
        this.#root = this.#createRoot();
        this.#tokenizer = new Tokenizer(this.#root);
    }
    parse(css) {
        this.#errors = [];
        const stack = [];
        const hasListeners = this.#observer.hasListeners('traverse');
        let context = this.#root;
        for (const { node, direction, error } of this.#tokenizer.parse(css)) {
            if (error) {
                if (this.#options.strict) {
                    throw error;
                }
                this.#observer.trigger('error', error, node);
                this.#errors.push(error);
                continue;
            }
            if (direction == 'enter') {
                // @ts-ignore
                if (node.type == 'StyleSheet') {
                    // @ts-ignore
                    context.children.push(...node.children);
                }
                else {
                    // @ts-ignore
                    context.children.push(node);
                }
                // @ts-ignore
                if ('children' in node) {
                    // @ts-ignore
                    stack.push(node);
                    // @ts-ignore
                    context = node;
                }
            }
            else if (direction == 'exit') {
                stack.pop();
                // @ts-ignore
                context = stack[stack.length - 1] || this.#root;
            }
            if (hasListeners) {
                this.#observer.trigger('traverse', node, direction, context);
            }
        }
        return this;
    }
    on(name, handler, signal) {
        this.#observer.on(name, handler, signal);
        return this;
    }
    off(name, handler) {
        this.#observer.off(name, handler);
        return this;
    }
    #compactRuleList(node) {
    }
    compact() {
        let i = this.#root.children.length;
        let previous = null;
        while (i--) {
            const node = this.#root.children[i];
            // if
            // @ts-ignore
            if (previous?.type == node.type && node.type == 'Rule' && "selector" in previous && previous.selector == node.selector) {
                console.log({ previous });
                if (!('children' in node)) {
                    // @ts-ignore
                    node.children = [];
                }
                if ('children' in previous) {
                    // @ts-ignore
                    node.children.push(...previous.children);
                }
                this.#root.children.splice(i, 1);
            }
            // @ts-ignore
            else if (node.type == 'AtRule' && node.name == 'media' && node.value == 'all') {
                // @ts-ignore
                this.#root.children.splice(i, 1, ...node.children);
                i += node.children.length;
            }
            // @ts-ignore
            previous = node;
        }
        return this;
    }
    #compactRule(node) {
    }
    getAst() {
        return this.#root;
    }
    getErrors() {
        return this.#errors;
    }
    #createRoot() {
        return {
            type: "StyleSheet",
            location: {
                start: {
                    index: 0,
                    line: 1,
                    column: 1
                },
                end: {
                    index: -1,
                    line: 1,
                    column: 0
                }
            },
            children: []
        };
    }
}

export { Parser };
