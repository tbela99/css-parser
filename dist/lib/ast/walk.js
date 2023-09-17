function* walk(node, parent, root) {
    yield { node, parent, root };
    if ('chi' in node) {
        for (const child of node.chi.slice()) {
            yield* walk(child, node, (root ?? node));
        }
    }
}
function* walkValues(values, parent) {
    for (const value of values.slice()) {
        // @ts-ignore
        yield { value, parent };
        if ('chi' in value) {
            yield* walkValues(value.chi.slice(), value);
        }
    }
}

export { walk, walkValues };
