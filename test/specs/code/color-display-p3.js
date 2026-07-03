import {ColorType, EnumToken} from "../../../dist/lib/ast/types.js";
import {isOkLabClose} from "../../../dist/lib/syntax/color/utils/distance.js";

export function run(describe, expect, transform, parse, render) {

    describe('convert to display-p3', function () {

        it('rgb(a) to display-p3 #1', function () {
            return transform(`.hsl { color: rgb(179 34 34/50%); }`, {
                beautify: true,
                convertColor: ColorType.SRGB_LINEAR
            }).then(result => expect(isOkLabClose(result.ast.chi[0].chi[0].val[0], {
                    typ: EnumToken.ColorTokenType,
                    val: "color",
                    chi: [
                        {
                            typ: EnumToken.IdenTokenType,
                            val: "display-p3"
                        },
                        {
                            typ: EnumToken.NumberTokenType,
                            val: "0.6449802764484531"
                        }, {
                            typ: EnumToken.NumberTokenType,
                            val: "0.19119980094061145"
                        }, {
                            typ: EnumToken.NumberTokenType,
                            val: "0.16577088540310694"
                        },
                        {
                            typ: EnumToken.LiteralTokenType,
                            val: "/"
                        },
                        {
                            typ: EnumToken.PercentageTokenType,
                            val: "50"
                        }
                    ],
                    kin: ColorType.COLOR
                }
            )).equals(true));
        });

        it('hsl(a) to display-p3 #2', function () {
            return transform(`.hsl { color: hsl(0 68.07511737089203% 41.764705882352935%/50%); }`, {
                beautify: true,
                convertColor: ColorType.SRGB_LINEAR
            }).then(result => expect(isOkLabClose(result.ast.chi[0].chi[0].val[0], {
                    typ: EnumToken.ColorTokenType,
                    val: "color",
                    chi: [
                        {
                            typ: EnumToken.IdenTokenType,
                            val: "display-p3"
                        },
                        {
                            typ: EnumToken.NumberTokenType,
                            val: "0.6449802764484531"
                        }, {
                            typ: EnumToken.NumberTokenType,
                            val: "0.19119980094061145"
                        }, {
                            typ: EnumToken.NumberTokenType,
                            val: "0.16577088540310694"
                        },
                        {
                            typ: EnumToken.LiteralTokenType,
                            val: "/"
                        },
                        {
                            typ: EnumToken.PercentageTokenType,
                            val: "50"
                        }
                    ],
                    kin: ColorType.COLOR
                }
            )).equals(true));
        });

        it('device-cmyk() to display-p3 #3', function () {
            return transform(`.hsl { color: device-cmyk(0 81.00558659217877% 81.00558659217877% 29.803921568627455%/50%); }`, {
                beautify: true,
                convertColor: ColorType.SRGB_LINEAR
            }).then(result => expect(isOkLabClose(result.ast.chi[0].chi[0].val[0], {
                    typ: EnumToken.ColorTokenType,
                    val: "color",
                    chi: [
                        {
                            typ: EnumToken.IdenTokenType,
                            val: "display-p3"
                        },
                        {
                            typ: EnumToken.NumberTokenType,
                            val: "0.6449802764484531"
                        }, {
                            typ: EnumToken.NumberTokenType,
                            val: "0.19119980094061145"
                        }, {
                            typ: EnumToken.NumberTokenType,
                            val: "0.16577088540310694"
                        },
                        {
                            typ: EnumToken.LiteralTokenType,
                            val: "/"
                        },
                        {
                            typ: EnumToken.PercentageTokenType,
                            val: "50"
                        }
                    ],
                    kin: ColorType.COLOR
                }
            )).equals(true));
        });

        it('hwb() to display-p3 #4', function () {
            return transform(`.hsl { color: hwb(0 13.333333333333334% 30%/50%); }`, {
                beautify: true,
                convertColor: ColorType.SRGB_LINEAR
            }).then(result => expect(isOkLabClose(result.ast.chi[0].chi[0].val[0], {
                    typ: EnumToken.ColorTokenType,
                    val: "color",
                    chi: [
                        {
                            typ: EnumToken.IdenTokenType,
                            val: "display-p3"
                        },
                        {
                            typ: EnumToken.NumberTokenType,
                            val: "0.6449802764484531"
                        }, {
                            typ: EnumToken.NumberTokenType,
                            val: "0.19119980094061145"
                        }, {
                            typ: EnumToken.NumberTokenType,
                            val: "0.16577088540310694"
                        },
                        {
                            typ: EnumToken.LiteralTokenType,
                            val: "/"
                        },
                        {
                            typ: EnumToken.PercentageTokenType,
                            val: "50"
                        }
                    ],
                    kin: ColorType.COLOR
                }
            )).equals(true));
        });

        it('srgb-linear to display-p3 #6', function () {
            return transform(`.hsl { color: color(srgb-linear .45078578283822346 .01599629336550963 .01599629336550963/50%); }`, {
                beautify: true,
                convertColor: ColorType.SRGB_LINEAR
            }).then(result => expect(isOkLabClose(result.ast.chi[0].chi[0].val[0], {
                    typ: EnumToken.ColorTokenType,
                    val: "color",
                    chi: [
                        {
                            typ: EnumToken.IdenTokenType,
                            val: "display-p3"
                        },
                        {
                            typ: EnumToken.NumberTokenType,
                            val: "0.6449802764484531"
                        }, {
                            typ: EnumToken.NumberTokenType,
                            val: "0.19119980094061145"
                        }, {
                            typ: EnumToken.NumberTokenType,
                            val: "0.16577088540310694"
                        },
                        {
                            typ: EnumToken.LiteralTokenType,
                            val: "/"
                        },
                        {
                            typ: EnumToken.PercentageTokenType,
                            val: "50"
                        }
                    ],
                    kin: ColorType.COLOR
                }
            )).equals(true));
        });

        it('display-p3 to display-p3 #7', function () {
            return transform(`.hsl { color: color(display-p3 0.644980276448 0.191199800941 0.165770885403 / 0.501960784314); }`, {
                beautify: true,
                convertColor: ColorType.SRGB_LINEAR
            }).then(result => expect(isOkLabClose(result.ast.chi[0].chi[0].val[0], {
                    typ: EnumToken.ColorTokenType,
                    val: "color",
                    chi: [
                        {
                            typ: EnumToken.IdenTokenType,
                            val: "display-p3"
                        },
                        {
                            typ: EnumToken.NumberTokenType,
                            val: "0.6449802764484531"
                        }, {
                            typ: EnumToken.NumberTokenType,
                            val: "0.19119980094061145"
                        }, {
                            typ: EnumToken.NumberTokenType,
                            val: "0.16577088540310694"
                        },
                        {
                            typ: EnumToken.LiteralTokenType,
                            val: "/"
                        },
                        {
                            typ: EnumToken.PercentageTokenType,
                            val: "50"
                        }
                    ],
                    kin: ColorType.COLOR
                }
            )).equals(true));
        });

        it('a98-rgb to display-p3 #8', function () {
            return transform(`.hsl { color: color(a98-rgb 0.6015 0.1525 0.1525 / 0.50); }`, {
                beautify: true,
                convertColor: ColorType.SRGB_LINEAR
            }).then(result => expect(isOkLabClose(result.ast.chi[0].chi[0].val[0], {
                    typ: EnumToken.ColorTokenType,
                    val: "color",
                    chi: [
                        {
                            typ: EnumToken.IdenTokenType,
                            val: "display-p3"
                        },
                        {
                            typ: EnumToken.NumberTokenType,
                            val: "0.6449802764484531"
                        }, {
                            typ: EnumToken.NumberTokenType,
                            val: "0.19119980094061145"
                        }, {
                            typ: EnumToken.NumberTokenType,
                            val: "0.16577088540310694"
                        },
                        {
                            typ: EnumToken.LiteralTokenType,
                            val: "/"
                        },
                        {
                            typ: EnumToken.PercentageTokenType,
                            val: "50"
                        }
                    ],
                    kin: ColorType.COLOR
                }
            )).equals(true));
        });

        it('photo-rgb to display-p3 #9', function () {
            return transform(`.hsl { color: color(prophoto-rgb 0.4589 0.2071 0.124 / 0.50); }`, {
                beautify: true,
                convertColor: ColorType.SRGB_LINEAR
            }).then(result => expect(isOkLabClose(result.ast.chi[0].chi[0].val[0], {
                    typ: EnumToken.ColorTokenType,
                    val: "color",
                    chi: [
                        {
                            typ: EnumToken.IdenTokenType,
                            val: "display-p3"
                        },
                        {
                            typ: EnumToken.NumberTokenType,
                            val: "0.6449802764484531"
                        }, {
                            typ: EnumToken.NumberTokenType,
                            val: "0.19119980094061145"
                        }, {
                            typ: EnumToken.NumberTokenType,
                            val: "0.16577088540310694"
                        },
                        {
                            typ: EnumToken.LiteralTokenType,
                            val: "/"
                        },
                        {
                            typ: EnumToken.PercentageTokenType,
                            val: "50"
                        }
                    ],
                    kin: ColorType.COLOR
                }
            )).equals(true));
        });

        it('xyz to display-p3 #11', function () {
            return transform(`.hsl { color: color(xyz-d65 0.1945 0.1084 0.0258 / 0.50); }`, {
                beautify: true,
                convertColor: ColorType.SRGB_LINEAR
            }).then(result => expect(isOkLabClose(result.ast.chi[0].chi[0].val[0], {
                    typ: EnumToken.ColorTokenType,
                    val: "color",
                    chi: [
                        {
                            typ: EnumToken.IdenTokenType,
                            val: "display-p3"
                        },
                        {
                            typ: EnumToken.NumberTokenType,
                            val: "0.6449802764484531"
                        }, {
                            typ: EnumToken.NumberTokenType,
                            val: "0.19119980094061145"
                        }, {
                            typ: EnumToken.NumberTokenType,
                            val: "0.16577088540310694"
                        },
                        {
                            typ: EnumToken.LiteralTokenType,
                            val: "/"
                        },
                        {
                            typ: EnumToken.PercentageTokenType,
                            val: "50"
                        }
                    ],
                    kin: ColorType.COLOR
                }
            )).equals(true));
        });

        it('xyz-d50 to display-p3 #12', function () {
            return transform(`.hsl { color: color(xyz-d50 0.205 0.1127 0.0193 / 0.50); }`, {
                beautify: true,
                convertColor: ColorType.SRGB_LINEAR
            }).then(result => expect(isOkLabClose(result.ast.chi[0].chi[0].val[0], {
                    typ: EnumToken.ColorTokenType,
                    val: "color",
                    chi: [
                        {
                            typ: EnumToken.IdenTokenType,
                            val: "display-p3"
                        },
                        {
                            typ: EnumToken.NumberTokenType,
                            val: "0.6449802764484531"
                        }, {
                            typ: EnumToken.NumberTokenType,
                            val: "0.19119980094061145"
                        }, {
                            typ: EnumToken.NumberTokenType,
                            val: "0.16577088540310694"
                        },
                        {
                            typ: EnumToken.LiteralTokenType,
                            val: "/"
                        },
                        {
                            typ: EnumToken.PercentageTokenType,
                            val: "50"
                        }
                    ],
                    kin: ColorType.COLOR
                }
            )).equals(true));
        });

        it('xyz-d65 to display-p3 #13', function () {
            return transform(`.hsl { color: color(xyz-d65 0.1945 0.1084 0.0258 / 0.50); }`, {
                beautify: true,
                convertColor: ColorType.SRGB_LINEAR
            }).then(result => expect(isOkLabClose(result.ast.chi[0].chi[0].val[0], {
                    typ: EnumToken.ColorTokenType,
                    val: "color",
                    chi: [
                        {
                            typ: EnumToken.IdenTokenType,
                            val: "display-p3"
                        },
                        {
                            typ: EnumToken.NumberTokenType,
                            val: "0.6449802764484531"
                        }, {
                            typ: EnumToken.NumberTokenType,
                            val: "0.19119980094061145"
                        }, {
                            typ: EnumToken.NumberTokenType,
                            val: "0.16577088540310694"
                        },
                        {
                            typ: EnumToken.LiteralTokenType,
                            val: "/"
                        },
                        {
                            typ: EnumToken.PercentageTokenType,
                            val: "50"
                        }
                    ],
                    kin: ColorType.COLOR
                }
            )).equals(true));
        });

        it('oklab to display-p3 #14', function () {
            return transform(`.hsl { color: oklab(.49863253097209403 .16117650019451524 .08155524287358212/50%); }`, {
                beautify: true,
                convertColor: ColorType.SRGB_LINEAR
            }).then(result => expect(isOkLabClose(result.ast.chi[0].chi[0].val[0], {
                    typ: EnumToken.ColorTokenType,
                    val: "color",
                    chi: [
                        {
                            typ: EnumToken.IdenTokenType,
                            val: "display-p3"
                        },
                        {
                            typ: EnumToken.NumberTokenType,
                            val: "0.6449802764484531"
                        }, {
                            typ: EnumToken.NumberTokenType,
                            val: "0.19119980094061145"
                        }, {
                            typ: EnumToken.NumberTokenType,
                            val: "0.16577088540310694"
                        },
                        {
                            typ: EnumToken.LiteralTokenType,
                            val: "/"
                        },
                        {
                            typ: EnumToken.PercentageTokenType,
                            val: "50"
                        }
                    ],
                    kin: ColorType.COLOR
                }
            )).equals(true));
        });

        it('oklch to display-p3 #15', function () {
            return transform(`.hsl { color: oklch(.49863253097209403 .1806353283694016 26.839391611662446/50%); }`, {
                beautify: true,
                convertColor: ColorType.SRGB_LINEAR
            }).then(result => expect(isOkLabClose(result.ast.chi[0].chi[0].val[0], {
                    typ: EnumToken.ColorTokenType,
                    val: "color",
                    chi: [
                        {
                            typ: EnumToken.IdenTokenType,
                            val: "display-p3"
                        },
                        {
                            typ: EnumToken.NumberTokenType,
                            val: "0.6449802764484531"
                        }, {
                            typ: EnumToken.NumberTokenType,
                            val: "0.19119980094061145"
                        }, {
                            typ: EnumToken.NumberTokenType,
                            val: "0.16577088540310694"
                        },
                        {
                            typ: EnumToken.LiteralTokenType,
                            val: "/"
                        },
                        {
                            typ: EnumToken.PercentageTokenType,
                            val: "50"
                        }
                    ],
                    kin: ColorType.COLOR
                }
            )).equals(true));
        });

        it('lab to display-p3 #16', function () {
            return transform(`.hsl { color: lab(40.03718216996103 56.88417629340889 39.4648992397212/50%); }`, {
                beautify: true,
                convertColor: ColorType.SRGB_LINEAR
            }).then(result => expect(isOkLabClose(result.ast.chi[0].chi[0].val[0], {
                    typ: EnumToken.ColorTokenType,
                    val: "color",
                    chi: [
                        {
                            typ: EnumToken.IdenTokenType,
                            val: "display-p3"
                        },
                        {
                            typ: EnumToken.NumberTokenType,
                            val: "0.6449802764484531"
                        }, {
                            typ: EnumToken.NumberTokenType,
                            val: "0.19119980094061145"
                        }, {
                            typ: EnumToken.NumberTokenType,
                            val: "0.16577088540310694"
                        },
                        {
                            typ: EnumToken.LiteralTokenType,
                            val: "/"
                        },
                        {
                            typ: EnumToken.PercentageTokenType,
                            val: "50"
                        }
                    ],
                    kin: ColorType.COLOR
                }
            )).equals(true));
        });

        it('lch to display-p3 #17', function () {
            return transform(`.hsl { color: lch(40.03718216996103 69.23357411387173 34.75200047889167/50%); }`, {
                beautify: true,
                convertColor: ColorType.SRGB_LINEAR
            }).then(result => expect(isOkLabClose(result.ast.chi[0].chi[0].val[0], {
                    typ: EnumToken.ColorTokenType,
                    val: "color",
                    chi: [
                        {
                            typ: EnumToken.IdenTokenType,
                            val: "display-p3"
                        },
                        {
                            typ: EnumToken.NumberTokenType,
                            val: "0.6449802764484531"
                        }, {
                            typ: EnumToken.NumberTokenType,
                            val: "0.19119980094061145"
                        }, {
                            typ: EnumToken.NumberTokenType,
                            val: "0.16577088540310694"
                        },
                        {
                            typ: EnumToken.LiteralTokenType,
                            val: "/"
                        },
                        {
                            typ: EnumToken.PercentageTokenType,
                            val: "50"
                        }
                    ],
                    kin: ColorType.COLOR
                }
            )).equals(true));
        });
    });
}
