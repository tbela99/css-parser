export function run(describe, expect, transform, parse, render, dirname, readFile) {

    describe('CSS translate', function () {
        it('translateY #1', function () {
            const nesting1 = `

  .now {
    transform:   translate(0,-100px)
}
`;
            return transform(nesting1, {
                beautify:  true
            }).then((result) => expect(result.code).equals(`.now {
 transform: translateY(-100px)
}`));
        });

        it('translateX #2', function () {
            const nesting1 = `

  .now {
    transform:   translate(-100px, 0)
}
`;
            return transform(nesting1, {
                beautify:  true
            }).then((result) => expect(result.code).equals(`.now {
 transform: translate(-100px)
}`));
        });

        it('translateX #2', function () {
            const nesting1 = `

  .now {
    transform:   translate3d(-100px, 0, 0)
}
`;
            return transform(nesting1, {
                beautify:  true
            }).then((result) => expect(result.code).equals(`.now {
 transform: translate(-100px)
}`));
        });

        it('translateY #4', function () {
            const nesting1 = `

  .now {
    transform:   translate3d(0, 0, -100px)
}
`;
            return transform(nesting1, {
                beautify:  true
            }).then((result) => expect(result.code).equals(`.now {
 transform: translateZ(-100px)
}`));
        });

        it('translate(0) #5', function () {
            const nesting1 = `

  .now {
    transform:   translateX(0) translateY(0)
}
`;
            return transform(nesting1, {
                beautify:  true
            }).then((result) => expect(result.code).equals(`.now {
 transform: scale(1)
}`));
        });

        it('translate(0) #5', function () {
            const nesting1 = `

  .now {
    transform:   translateX(0) translateY(0) translateZ(0)
}
`;
            return transform(nesting1, {
                beautify:  true
            }).then((result) => expect(result.code).equals(`.now {
 transform: scale(1)
}`));
        });

        it('translateZ #6', function () {
            const nesting1 = `

  .now {
    transform:   translateX(0) translateY(0) translateZ(14px)
}
`;
            return transform(nesting1, {
                beautify:  true
            }).then((result) => expect(result.code).equals(`.now {
 transform: translateZ(14px)
}`));
        });

        it('translateZ #7', function () {
            const nesting1 = `

  .now {
    transform:  translateX(14px) translateY(0) translateZ(14px)
}
`;
            return transform(nesting1, {
                beautify:  true
            }).then((result) => expect(result.code).equals(`.now {
 transform: translate(14px,0,14px)
}`));
        });

    });

}