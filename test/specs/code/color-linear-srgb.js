import {ColorType, EnumToken} from "../../../dist/lib/ast/types.js";
import {isOkLabClose} from "../../../dist/lib/syntax/color/utils/distance.js";

export function run(describe, expect, it, transform, parse, render) {

    describe('convert to srgb-linear', function () {

        it('rgb(a) to srgb-linear #1', function () {
            return transform(`.hsl { color: rgb(179 34 34/50%); }`, {
                beautify: true,
                convertColor: ColorType.SRGB_LINEAR
            }).then(result => expect(isOkLabClose(result.ast.chi[0].chi[0].val[0], {
                    typ: EnumToken.ColorTokenType,
                    val: "color",
                    chi: [
                        {
                            typ: EnumToken.IdenTokenType,
                            val: "srgb-linear"
                        },
                        {
                            typ: EnumToken.NumberTokenType,
                            val: "0.45078578283822346"
                        }, {
                            typ: EnumToken.NumberTokenType,
                            val: "0.01599629336550963"
                        }, {
                            typ: EnumToken.NumberTokenType,
                            val: "0.01599629336550963"
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

        it('hsl(a) to srgb-linear #2', function () {
            return transform(`.hsl { color: hsl(0 68.07511737089203% 41.764705882352935%/50%); }`, {
                beautify: true,
                convertColor: ColorType.SRGB_LINEAR
            }).then(result => expect(isOkLabClose(result.ast.chi[0].chi[0].val[0], {
                    typ: EnumToken.ColorTokenType,
                    val: "color",
                    chi: [
                        {
                            typ: EnumToken.IdenTokenType,
                            val: "srgb-linear"
                        },
                        {
                            typ: EnumToken.NumberTokenType,
                            val: "0.45078578283822346"
                        }, {
                            typ: EnumToken.NumberTokenType,
                            val: "0.01599629336550963"
                        }, {
                            typ: EnumToken.NumberTokenType,
                            val: "0.01599629336550963"
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

        it('device-cmyk() to srgb-linear #3', function () {
            return transform(`.hsl { color: device-cmyk(0 81.00558659217877% 81.00558659217877% 29.803921568627455%/50%); }`, {
                beautify: true,
                convertColor: ColorType.SRGB_LINEAR
            }).then(result => expect(isOkLabClose(result.ast.chi[0].chi[0].val[0], {
                    typ: EnumToken.ColorTokenType,
                    val: "color",
                    chi: [
                        {
                            typ: EnumToken.IdenTokenType,
                            val: "srgb-linear"
                        },
                        {
                            typ: EnumToken.NumberTokenType,
                            val: "0.45078578283822346"
                        }, {
                            typ: EnumToken.NumberTokenType,
                            val: "0.01599629336550963"
                        }, {
                            typ: EnumToken.NumberTokenType,
                            val: "0.01599629336550963"
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

        it('hwb() to srgb-linear #4', function () {
            return transform(`.hsl { color: hwb(0 13.333333333333334% 30%/50%); }`, {
                beautify: true,
                convertColor: ColorType.SRGB_LINEAR
            }).then(result => expect(isOkLabClose(result.ast.chi[0].chi[0].val[0], {
                    typ: EnumToken.ColorTokenType,
                    val: "color",
                    chi: [
                        {
                            typ: EnumToken.IdenTokenType,
                            val: "srgb-linear"
                        },
                        {
                            typ: EnumToken.NumberTokenType,
                            val: "0.45078578283822346"
                        }, {
                            typ: EnumToken.NumberTokenType,
                            val: "0.01599629336550963"
                        }, {
                            typ: EnumToken.NumberTokenType,
                            val: "0.01599629336550963"
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

        it('srgb to srgb-linear #5', function () {
            return transform(`.hsl { color: color(srgb .7019607843137254 .13333333333333333 .13333333333333333/50%); }`, {
                beautify: true,
                convertColor: ColorType.SRGB_LINEAR
            }).then(result => expect(isOkLabClose(result.ast.chi[0].chi[0].val[0], {
                    typ: EnumToken.ColorTokenType,
                    val: "color",
                    chi: [
                        {
                            typ: EnumToken.IdenTokenType,
                            val: "srgb-linear"
                        },
                        {
                            typ: EnumToken.NumberTokenType,
                            val: "0.45078578283822346"
                        }, {
                            typ: EnumToken.NumberTokenType,
                            val: "0.01599629336550963"
                        }, {
                            typ: EnumToken.NumberTokenType,
                            val: "0.01599629336550963"
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

        it('srgb to srgb-linear #6', function () {
            return transform(`.hsl { color: color(srgb .7019607843137254 .13333333333333333 .13333333333333333/50%); }`, {
                beautify: true,
                convertColor: ColorType.SRGB_LINEAR
            }).then(result => expect(isOkLabClose(result.ast.chi[0].chi[0].val[0], {
                    typ: EnumToken.ColorTokenType,
                    val: "color",
                    chi: [
                        {
                            typ: EnumToken.IdenTokenType,
                            val: "srgb-linear"
                        },
                        {
                            typ: EnumToken.NumberTokenType,
                            val: "0.45078578283822346"
                        }, {
                            typ: EnumToken.NumberTokenType,
                            val: "0.01599629336550963"
                        }, {
                            typ: EnumToken.NumberTokenType,
                            val: "0.01599629336550963"
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

        it('display-p3 to srgb-linear #7', function () {
            return transform(`.hsl { color: color(display-p3 0.644980276448 0.191199800941 0.165770885403 / 0.501960784314); }`, {
                beautify: true,
                convertColor: ColorType.SRGB_LINEAR
            }).then(result => expect(isOkLabClose(result.ast.chi[0].chi[0].val[0], {
                    typ: EnumToken.ColorTokenType,
                    val: "color",
                    chi: [
                        {
                            typ: EnumToken.IdenTokenType,
                            val: "srgb-linear"
                        },
                        {
                            typ: EnumToken.NumberTokenType,
                            val: "0.45078578283822346"
                        }, {
                            typ: EnumToken.NumberTokenType,
                            val: "0.01599629336550963"
                        }, {
                            typ: EnumToken.NumberTokenType,
                            val: "0.01599629336550963"
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

        it('a98-rgb to srgb-linear #8', function () {
            return transform(`.hsl { color: color(a98-rgb 0.6015 0.1525 0.1525 / 0.50); }`, {
                beautify: true,
                convertColor: ColorType.SRGB_LINEAR
            }).then(result => expect(isOkLabClose(result.ast.chi[0].chi[0].val[0], {
                    typ: EnumToken.ColorTokenType,
                    val: "color",
                    chi: [
                        {
                            typ: EnumToken.IdenTokenType,
                            val: "srgb-linear"
                        },
                        {
                            typ: EnumToken.NumberTokenType,
                            val: "0.45078578283822346"
                        }, {
                            typ: EnumToken.NumberTokenType,
                            val: "0.01599629336550963"
                        }, {
                            typ: EnumToken.NumberTokenType,
                            val: "0.01599629336550963"
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

        it('photo-rgb to srgb-linear #9', function () {
            return transform(`.hsl { color: color(prophoto-rgb 0.4589 0.2071 0.124 / 0.50); }`, {
                beautify: true,
                convertColor: ColorType.SRGB_LINEAR
            }).then(result => expect(isOkLabClose(result.ast.chi[0].chi[0].val[0], {
                    typ: EnumToken.ColorTokenType,
                    val: "color",
                    chi: [
                        {
                            typ: EnumToken.IdenTokenType,
                            val: "srgb-linear"
                        },
                        {
                            typ: EnumToken.NumberTokenType,
                            val: "0.45078578283822346"
                        }, {
                            typ: EnumToken.NumberTokenType,
                            val: "0.01599629336550963"
                        }, {
                            typ: EnumToken.NumberTokenType,
                            val: "0.01599629336550963"
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

        it('rec2020 to srgb-linear #10', function () {
            return transform(`.hsl { color: color(prophoto-rgb 0.4589 0.2071 0.124 / 0.50); }`, {
                beautify: true,
                convertColor: ColorType.SRGB_LINEAR
            }).then(result => expect(isOkLabClose(result.ast.chi[0].chi[0].val[0], {
                    typ: EnumToken.ColorTokenType,
                    val: "color",
                    chi: [
                        {
                            typ: EnumToken.IdenTokenType,
                            val: "srgb-linear"
                        },
                        {
                            typ: EnumToken.NumberTokenType,
                            val: "0.45078578283822346"
                        }, {
                            typ: EnumToken.NumberTokenType,
                            val: "0.01599629336550963"
                        }, {
                            typ: EnumToken.NumberTokenType,
                            val: "0.01599629336550963"
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

        it('xyz to srgb-linear #11', function () {
            return transform(`.hsl { color: color(xyz-d65 0.1945 0.1084 0.0258 / 0.50); }`, {
                beautify: true,
                convertColor: ColorType.SRGB_LINEAR
            }).then(result => expect(isOkLabClose(result.ast.chi[0].chi[0].val[0], {
                    typ: EnumToken.ColorTokenType,
                    val: "color",
                    chi: [
                        {
                            typ: EnumToken.IdenTokenType,
                            val: "srgb-linear"
                        },
                        {
                            typ: EnumToken.NumberTokenType,
                            val: "0.45078578283822346"
                        }, {
                            typ: EnumToken.NumberTokenType,
                            val: "0.01599629336550963"
                        }, {
                            typ: EnumToken.NumberTokenType,
                            val: "0.01599629336550963"
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

        it('xyz-d50 to srgb-linear #12', function () {
            return transform(`.hsl { color: color(xyz-d50 0.205 0.1127 0.0193 / 0.50); }`, {
                beautify: true,
                convertColor: ColorType.SRGB_LINEAR
            }).then(result => expect(isOkLabClose(result.ast.chi[0].chi[0].val[0], {
                    typ: EnumToken.ColorTokenType,
                    val: "color",
                    chi: [
                        {
                            typ: EnumToken.IdenTokenType,
                            val: "srgb-linear"
                        },
                        {
                            typ: EnumToken.NumberTokenType,
                            val: "0.45078578283822346"
                        }, {
                            typ: EnumToken.NumberTokenType,
                            val: "0.01599629336550963"
                        }, {
                            typ: EnumToken.NumberTokenType,
                            val: "0.01599629336550963"
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

        it('xyz-d65 to srgb-linear #13', function () {
            return transform(`.hsl { color: color(xyz-d65 0.1945 0.1084 0.0258 / 0.50); }`, {
                beautify: true,
                convertColor: ColorType.SRGB_LINEAR
            }).then(result => expect(isOkLabClose(result.ast.chi[0].chi[0].val[0], {
                    typ: EnumToken.ColorTokenType,
                    val: "color",
                    chi: [
                        {
                            typ: EnumToken.IdenTokenType,
                            val: "srgb-linear"
                        },
                        {
                            typ: EnumToken.NumberTokenType,
                            val: "0.45078578283822346"
                        }, {
                            typ: EnumToken.NumberTokenType,
                            val: "0.01599629336550963"
                        }, {
                            typ: EnumToken.NumberTokenType,
                            val: "0.01599629336550963"
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

        it('oklab to srgb-linear #14', function () {
            return transform(`.hsl { color: oklab(.49863253097209403 .16117650019451524 .08155524287358212/50%); }`, {
                beautify: true,
                convertColor: ColorType.SRGB_LINEAR
            }).then(result => expect(isOkLabClose(result.ast.chi[0].chi[0].val[0], {
                    typ: EnumToken.ColorTokenType,
                    val: "color",
                    chi: [
                        {
                            typ: EnumToken.IdenTokenType,
                            val: "srgb-linear"
                        },
                        {
                            typ: EnumToken.NumberTokenType,
                            val: "0.45078578283822346"
                        }, {
                            typ: EnumToken.NumberTokenType,
                            val: "0.01599629336550963"
                        }, {
                            typ: EnumToken.NumberTokenType,
                            val: "0.01599629336550963"
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

        it('oklch to srgb-linear #15', function () {
            return transform(`.hsl { color: oklch(.49863253097209403 .1806353283694016 26.839391611662446/50%); }`, {
                beautify: true,
                convertColor: ColorType.SRGB_LINEAR
            }).then(result => expect(isOkLabClose(result.ast.chi[0].chi[0].val[0], {
                    typ: EnumToken.ColorTokenType,
                    val: "color",
                    chi: [
                        {
                            typ: EnumToken.IdenTokenType,
                            val: "srgb-linear"
                        },
                        {
                            typ: EnumToken.NumberTokenType,
                            val: "0.45078578283822346"
                        }, {
                            typ: EnumToken.NumberTokenType,
                            val: "0.01599629336550963"
                        }, {
                            typ: EnumToken.NumberTokenType,
                            val: "0.01599629336550963"
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

        it('lab to srgb-linear #16', function () {
            return transform(`.hsl { color: lab(40.03718216996103 56.88417629340889 39.4648992397212/50%); }`, {
                beautify: true,
                convertColor: ColorType.SRGB_LINEAR
            }).then(result => expect(isOkLabClose(result.ast.chi[0].chi[0].val[0], {
                    typ: EnumToken.ColorTokenType,
                    val: "color",
                    chi: [
                        {
                            typ: EnumToken.IdenTokenType,
                            val: "srgb-linear"
                        },
                        {
                            typ: EnumToken.NumberTokenType,
                            val: "0.45078578283822346"
                        }, {
                            typ: EnumToken.NumberTokenType,
                            val: "0.01599629336550963"
                        }, {
                            typ: EnumToken.NumberTokenType,
                            val: "0.01599629336550963"
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

        it('lch to srgb-linear #17', function () {
            return transform(`.hsl { color: lch(40.03718216996103 69.23357411387173 34.75200047889167/50%); }`, {
                beautify: true,
                convertColor: ColorType.SRGB_LINEAR
            }).then(result => expect(isOkLabClose(result.ast.chi[0].chi[0].val[0], {
                    typ: EnumToken.ColorTokenType,
                    val: "color",
                    chi: [
                        {
                            typ: EnumToken.IdenTokenType,
                            val: "srgb-linear"
                        },
                        {
                            typ: EnumToken.NumberTokenType,
                            val: "0.45078578283822346"
                        }, {
                            typ: EnumToken.NumberTokenType,
                            val: "0.01599629336550963"
                        }, {
                            typ: EnumToken.NumberTokenType,
                            val: "0.01599629336550963"
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
