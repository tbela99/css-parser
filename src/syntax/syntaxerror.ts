
export function createSyntaxError(message: string, file: string, line: number, column: number) {

        return new SyntaxError(`${message} at ${file}:${line}:${Math.max(column, 1)}`);
}