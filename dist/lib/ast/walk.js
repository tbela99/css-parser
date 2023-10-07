function* walk(node) {
    const parents = [node];
    const root = node;
    const weakMap = new WeakMap;
    while (parents.length > 0) {
        node = parents.shift();
        // @ts-ignore
        yield { node, parent: weakMap.get(node), root };
        if ('chi' in node) {
            for (const child of node.chi) {
                weakMap.set(child, node);
            }
            parents.unshift(...node.chi);
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
