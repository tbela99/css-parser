function hwb2hsv(h, w, b, a) {
    // @ts-ignore
    return [h, 1 - w / (1 - b), 1 - b, a];
}

export { hwb2hsv };
