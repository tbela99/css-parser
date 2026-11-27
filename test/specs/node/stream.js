// node only: tailwind.css and bootstrap-5.css read as streams ({file, asStream: true}) and as files. the output, the
// errors and the memory retained by the result are compared
import v8 from "node:v8";
import vm from "node:vm";

export function run(describe, expect, it, transform, dirname) {
    describe("stream large files", function () {
        this.timeout(60000);

        // a garbage collection between the measures
        v8.setFlagsFromString("--expose-gc");
        const gc = vm.runInNewContext("gc");
        const dir = dirname(new URL(import.meta.url).pathname) + "/../../files/css/";
        const used = () => {
            const usage = process.memoryUsage();

            return usage.heapUsed + usage.external;
        };

        // the objects referenced by a WeakRef are kept until the end of the job: the event loop turns before the
        // garbage collection
        const collect = async () => {
            for (let i = 0; i < 2; i++) {
                await new Promise((resolve) => setTimeout(resolve, 0));
                gc();
            }
        };

        // the result and the memory it retains: the garbage of the transformation is collected
        const measure = async (options) => {
            await collect();

            const before = used();
            const result = await transform(options);

            await collect();

            return { result, retained: used() - before };
        };

        for (const file of ["tailwind.css", "bootstrap-5.css"]) {
            it(`${file} as a stream #1`, async function () {
                const regular = await measure({ file: dir + file });
                const streamed = await measure({ file: dir + file, asStream: true });

                expect(streamed.result.code).equals(regular.result.code);
                expect(streamed.result.errors.map((error) => [error.message, error.location])).deep.equals(
                    regular.result.errors.map((error) => [error.message, error.location]),
                );
                expect(streamed.result.stats.bytesIn).equals(regular.result.stats.bytesIn);
                // the stream does not retain more memory than the file: the text, the code units and the ast are the
                // same, the arena is sized as the css is read
                expect(streamed.retained, "retained memory").lessThan(regular.retained * 1.1 + 2e6);
            });
        }
    });
}
