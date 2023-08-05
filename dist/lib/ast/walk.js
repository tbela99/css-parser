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

export { walk };
