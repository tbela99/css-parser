function* walk(node) {
    // @ts-ignore
    yield* doWalk(node, null, null);
}
function* doWalk(node, parent, root) {
    yield { node, parent, root };
    if ('chi' in node) {
        for (const child of node.chi) {
            yield* doWalk(child, node, (root ?? node));
        }
    }
}
function* walkValues(values, parent) {
    for (const value of values) {
        // @ts-ignore
        yield { value, parent };
        if ('chi' in value) {
            yield* walkValues(value.chi, value);
        }
    }
}

export { walk, walkValues };
