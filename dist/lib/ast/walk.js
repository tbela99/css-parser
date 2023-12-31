function* walk(node, filter) {
    const parents = [node];
    const root = node;
    const weakMap = new WeakMap;
    while (parents.length > 0) {
        node = parents.shift();
        let option = null;
        if (filter != null) {
            option = filter(node);
            if (option === 'ignore') {
                continue;
            }
            if (option === 'stop') {
                break;
            }
        }
        // @ts-ignore
        if (option !== 'children') {
            // @ts-ignore
            yield { node, parent: weakMap.get(node), root };
        }
        if (option !== 'ignore-children' && 'chi' in node) {
            parents.unshift(...node.chi);
            for (const child of node.chi.slice()) {
                weakMap.set(child, node);
            }
        }
    }
}
function* walkValues(values) {
    const stack = values.slice();
    const weakMap = new WeakMap;
    let value;
    while (stack.length > 0) {
        value = stack.shift();
        // @ts-ignore
        yield { value, parent: weakMap.get(value) };
        if ('chi' in value) {
            for (const child of value.chi) {
                weakMap.set(child, value);
            }
            stack.unshift(...value.chi);
        }
    }
}

export { walk, walkValues };
