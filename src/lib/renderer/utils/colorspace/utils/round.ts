

export function roundWithPrecision(value: number, original: number): number {

    return +value.toFixed(original.toString().split('.')[1]?.length ?? 0);
}