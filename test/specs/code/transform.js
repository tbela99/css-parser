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
 transform: rotate3d(-2,1,1,72deg)
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

        it('rotate3d #13', function () {
            const nesting1 = `

  .now {
    transform: rotate(-10deg)
}
`;
            return transform(nesting1, {
                beautify: true,
                computeTransform: true
            }).then((result) => expect(result.code).equals(`.now {
 transform: rotate(-10deg)
}`));
        });

    });

    describe('CSS scale', function () {

        it('scale3d #14', function () {
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

        it('scale #15', function () {
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


        it('scale #16', function () {
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

        it('scale #17', function () {
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

        it('scale #18', function () {
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

        it('rotate3d #19', function () {
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

        it('scale #20', function () {
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

        it('scale #21', function () {
            const nesting1 = `

  .now {
    transform:scaleX(0) scaleY( 0) scaleZ(0);
}
`;
            return transform(nesting1, {
                beautify: true,
                computeTransform: true
            }).then((result) => expect(result.code).equals(`.now {
 transform: scale3d(0,0,0)
}`));
        });

    });

    describe('CSS skew', function () {

        it('skew #22', function () {
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

        it('skew #23', function () {
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

    describe('CSS matrix', function () {

        it('matrix #24', function () {
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

        it('matrix #25', function () {
            const nesting1 = `

  .now {
    transform: matrix3d(
  0.5,
  0,
  -0.866025,
  0,
  0.595877,
  1.2,
  -1.03209,
  0,
  0.866025,
  0,
  0.5,
  0,
  25.9808,
  0,
  15,
  1
)
}
`;
            return transform(nesting1, {
                beautify: true,
                computeTransform: true
            }).then((result) => expect(result.code).equals(`.now {
 transform: matrix3d(.5,0,-.866025,0,.595877,1.2,-1.03209,0,.866025,0,.5,0,25.9808,0,15,1)
}`));
        });

        it('matrix #26', function () {
            const nesting1 = `

  .now {
    transform:matrix3d(
  -0.6,
  1.34788,
  0,
  0,
  -2.34788,
  -0.6,
  0,
  0,
  0,
  0,
  1,
  0,
  0,
  0,
  10,
  1
)
}
`;
            return transform(nesting1, {
                beautify: true,
                computeTransform: true
            }).then((result) => expect(result.code).equals(`.now {
 transform: matrix3d(-.6,1.34788,0,0,-2.34788,-.6,0,0,0,0,1,0,0,0,10,1)
}`));
        });

        it('matrix #27', function () {
            const nesting1 = `

  .now {
  
  transform: scale()   
}
`;
            return transform(nesting1, {
                beautify: true,
                computeTransform: true,
                validation: true
            }).then((result) => expect(result.code).equals(``));
        });

        it('matrix #28', function () {
            const nesting1 = `

  .now {
  
  transform: rotate3d(0,0,1,-10deg)   
}
`;
            return transform(nesting1, {
                beautify: true,
                computeTransform: true
            }).then((result) => expect(result.code).equals(`.now {
 transform: rotate3d(0,0,1,-10deg)
}`));
        });

        it('matrix #29', function () {
            const nesting1 = `

.foo-bar {
    transform: matrix(2, 0, 0, 1, 0, 0, 5);
`;
            return transform(nesting1, {
                beautify: true,
                computeTransform: true,
                validation: true
            }).then((result) => expect(result.code).equals(``));
        });

        it('matrix #30', function () {
            const nesting1 = `

.foo-bar {
transform: translateY(20px) translateZ(20px) translateX(0);
`;
            return transform(nesting1, {
                beautify: true,
                computeTransform: true,
                validation: true
            }).then((result) => expect(result.code).equals(`.foo-bar {
 transform: translate3d(0,20px,20px)
}`));
        });

        it('matrix #31', function () {
            const nesting1 = `

.foo-bar {
transform: translateY(20px) translateZ(0) translateX(0);
`;
            return transform(nesting1, {
                beautify: true,
                computeTransform: true,
                validation: true
            }).then((result) => expect(result.code).equals(`.foo-bar {
 transform: translateY(20px)
}`));
        });

        it('matrix #32', function () {
            const nesting1 = `

.foo-bar {
transform: translateY(0) translateZ(20px) translateX(0);
`;
            return transform(nesting1, {
                beautify: true,
                computeTransform: true,
                validation: true
            }).then((result) => expect(result.code).equals(`.foo-bar {
 transform: translateZ(20px)
}`));
        });

        it('matrix #33', function () {
            const nesting1 = `

.foo-bar {
transform: translateY(0) translateZ(0) translateX(20px);
`;
            return transform(nesting1, {
                beautify: true,
                computeTransform: true,
                validation: true
            }).then((result) => expect(result.code).equals(`.foo-bar {
 transform: translate(20px)
}`));
        });

        it('matrix #34', function () {
            const nesting1 = `

.foo-bar {
transform: translateY(0) translateZ(20px) translateX(5px);
`;
            return transform(nesting1, {
                beautify: true,
                computeTransform: true,
                validation: true
            }).then((result) => expect(result.code).equals(`.foo-bar {
 transform: translate3d(5px,0,20px)
}`));
        });

        it('matrix #35', function () {
            const nesting1 = `

.foo-bar {
transform: skewY(10deg) translateX(10px) translateY(10px);
`;
            return transform(nesting1, {
                beautify: true,
                computeTransform: true,
                validation: true
            }).then((result) => expect(result.code).equals(`.foo-bar {
 transform: matrix(1,.176327,0,1,10,11.7633)
}`));
        });

        it('matrix #36', function () {
            const nesting1 = `

.foo-bar {
transform: skewX(10deg);
`;
            return transform(nesting1, {
                beautify: true,
                computeTransform: true,
                validation: true
            }).then((result) => expect(result.code).equals(`.foo-bar {
 transform: skew(10deg)
}`));
        });

        it('matrix #37', function () {
            const nesting1 = `

.foo-bar {
transform: perspective(500px) translate3d(10px, 0, 20px) rotateY(30deg);
`;
            return transform(nesting1, {
                beautify: true,
                computeTransform: true,
                validation: true
            }).then((result) => expect(result.code).equals(`.foo-bar {
 transform: perspective(500px)translate3d(10px,0,20px)rotateY(30deg)
}`));
        });

        it('matrix #38', function () {
            const nesting1 = `

.foo-bar {
transform: perspective(500px) translate3d(10px, 0, 20px) rotateY(30deg) scaleX(2) scaleY(2) scaleZ(4);
`;
            return transform(nesting1, {
                beautify: true,
                computeTransform: true,
                validation: true
            }).then((result) => expect(result.code).equals(`.foo-bar {
 transform: matrix3d(1.73205,0,-1,.002,0,2,0,0,2,0,3.4641,-.0069282,10,0,20,.96)
}`));
        });
    });
}