function roundWithPrecision(value, original) {
    const length = original.toString().split('.')[1]?.length ?? 0;
    if (length == 0) {
        return value;
    }
    return +value.toFixed(length);
}

export { roundWithPrecision };
