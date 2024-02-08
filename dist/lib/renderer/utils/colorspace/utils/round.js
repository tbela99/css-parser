function roundWithPrecision(value, original) {
    return +value.toFixed(original.toString().split('.')[1]?.length ?? 0);
}

export { roundWithPrecision };
