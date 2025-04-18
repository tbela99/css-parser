export function run(describe, expect, transform, parse, render, dirname, readFile) {

    describe('CSS translate', function () {
        it('translateY #1', function () {
            const nesting1 = `

  .now {
    transform:   translate(0,-100px)
}
`;
            return transform(nesting1, {
                beautify: true,
                computeTransform: true
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
                beautify: true,
                computeTransform: true
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
                beautify: true,
                computeTransform: true
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
                beautify: true,
                computeTransform: true
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
                beautify: true,
                computeTransform: true
            }).then((result) => expect(result.code).equals(`.now {
 transform: none
}`));
        });

        it('translate(0) #5', function () {
            const nesting1 = `

  .now {
    transform:   translateX(0) translateY(0) translateZ(0)
}
`;
            return transform(nesting1, {
                beautify: true,
                computeTransform: true
            }).then((result) => expect(result.code).equals(`.now {
 transform: none
}`));
        });

        it('translateZ #6', function () {
            const nesting1 = `

  .now {
    transform:   translateX(0) translateY(0) translateZ(14px)
}
`;
            return transform(nesting1, {
                beautify: true,
                computeTransform: true
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
                beautify: true,
                computeTransform: true
            }).then((result) => expect(result.code).equals(`.now {
 transform: translate3d(14px,0,14px)
}`));
        });

    });

    describe('CSS rotate', function () {

        it('rotate3d #8', function () {
            const nesting1 = `

  .now {
    transform: rotate3d(1, 0, 0, 45deg);
}
`;
            return transform(nesting1, {
                beautify: true,
                computeTransform: true
            }).then((result) => expect(result.code).equals(`.now {
 transform: rotateX(45deg)
}`));
        });

        it('rotateZ #9', function () {
            const nesting1 = `

  .now {
    transform: rotateZ(45deg);
}
`;
            return transform(nesting1, {
                beautify: true,
                computeTransform: true
            }).then((result) => expect(result.code).equals(`.now {
 transform: rotate(45deg)
}`));
        });


        it('rotateZ #9', function () {
            const nesting1 = `

  .now {
    transform: rotate3d(2, -1, -1, -0.2turn);
}
`;
            return transform(nesting1, {
                beautify: true,
                computeTransform: true
            }).then((result) => expect(result.code).equals(`.now {
 transform: rotate3d(2,-1,-1,-72deg)
}`));
        });

        it('rotateZ #10', function () {
            const nesting1 = `

  .now {
    transform: scaleX(0.5) scaleY( 1) scaleZ(1.7) rotate3d(1, 1, 1,  67deg)
}
`;
            return transform(nesting1, {
                beautify: true,
                computeTransform: true
            }).then((result) => expect(result.code).equals(`.now {
 transform: scale3d(.5,1,1.7)rotate3d(1,1,1,67deg)
}`));
        });

        it('rotateY #11', function () {
            const nesting1 = `

  .now {
    transform: rotateY(180deg)
}
`;
            return transform(nesting1, {
                beautify: true,
                computeTransform: true
            }).then((result) => expect(result.code).equals(`.now {
 transform: rotateY(180deg)
}`));
        });

        it('rotate3d #12', function () {
            const nesting1 = `

  .now {
    transform: rotate3d(1, 1, 1, 180deg)
}
`;
            return transform(nesting1, {
                beautify: true,
                computeTransform: true
            }).then((result) => expect(result.code).equals(`.now {
 transform: rotate3d(1,1,1,180deg)
}`));
        });

    });

    describe('CSS scale', function () {

        it('scale3d #13', function () {
            const nesting1 = `

  .now {
    transform: scaleX(0.5) scaleY(0.5) scaleZ(0.5);
}
`;
            return transform(nesting1, {
                beautify: true,
                computeTransform: true
            }).then((result) => expect(result.code).equals(`.now {
 transform: scale3d(.5,.5,.5)
}`));
        });

        it('scale #14', function () {
            const nesting1 = `

  .now {
    transform: scaleX(1) scaleY(1) scaleZ(1);
}
`;
            return transform(nesting1, {
                beautify: true,
                computeTransform: true
            }).then((result) => expect(result.code).equals(`.now {
 transform: none
}`));
        });


        it('scale #15', function () {
            const nesting1 = `

  .now {
    transform: scaleX(1) scaleY(1) ;
}
`;
            return transform(nesting1, {
                beautify: true,
                computeTransform: true
            }).then((result) => expect(result.code).equals(`.now {
 transform: none
}`));
        });

        it('scale #16', function () {
            const nesting1 = `

  .now {
    transform: scaleX(1)  scaleZ(1);
}
`;
            return transform(nesting1, {
                beautify: true,
                computeTransform: true
            }).then((result) => expect(result.code).equals(`.now {
 transform: none
}`));
        });

        it('scale #17', function () {
            const nesting1 = `

  .now {
    transform:  scaleY(1) scaleZ(1);
}
`;
            return transform(nesting1, {
                beautify: true,
                computeTransform: true
            }).then((result) => expect(result.code).equals(`.now {
 transform: none
}`));
        });

        it('rotate3d #18', function () {
            const nesting1 = `

  .now {
    transform: scaleX(1);
}
`;
            return transform(nesting1, {
                beautify: true,
                computeTransform: true
            }).then((result) => expect(result.code).equals(`.now {
 transform: none
}`));
        });

        it('scale #19', function () {
            const nesting1 = `

  .now {
    transform: scaleX(1.5)  scaleY(2);
}
`;
            return transform(nesting1, {
                beautify: true,
                computeTransform: true
            }).then((result) => expect(result.code).equals(`.now {
 transform: scale(1.5,2)
}`));
        });

        it('scale #20', function () {
            const nesting1 = `

  .now {
    transform:scaleX(0) scaleY( 0) scaleZ(0);
}
`;
            return transform(nesting1, {
                beautify: true,
                computeTransform: true
            }).then((result) => expect(result.code).equals(`.now {
 transform: scaleX(0)scaleY(0)scaleZ(0)
}`));
        });

    });

    describe('CSS skew', function () {

        it('skew #21', function () {
            const nesting1 = `

  .now {
    transform: translate(100px, 100px) rotate(1215deg) skewX(10deg);
}
`;
            return transform(nesting1, {
                beautify: true,
                computeTransform: true
            }).then((result) => expect(result.code).equals(`.now {
 transform: translate(100px,100px)rotate(135deg)skew(10deg)
}`));
        });

    });

    describe('CSS perspective', function () {

        it('skew #22', function () {
            const nesting1 = `

  .now {
    transform: perspective(50px) translateZ(100px)
}
`;
            return transform(nesting1, {
                beautify: true,
                computeTransform: true
            }).then((result) => expect(result.code).equals(`.now {
 transform: perspective(50px)translateZ(100px)
}`));
        });

    });

    describe('CSS perspective', function () {

        it('matrix #23', function () {
            const nesting1 = `

  .now {
    transform: matrix(1, 0, 0, 1, 0, 20)
}
`;
            return transform(nesting1, {
                beautify: true,
                computeTransform: true
            }).then((result) => expect(result.code).equals(`.now {
 transform: translateY(20px)
}`));
        });

    });
}