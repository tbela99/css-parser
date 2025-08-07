import {ColorType, EnumToken} from "../../../dist/lib/ast/types.js";
import {isOkLabClose} from "../../../dist/lib/syntax/color/utils/distance.js";

export function run(describe, expect, it, transform, parse, render) {

    describe('convert to xyz-d50', function () {

        it('rgb(a) to xyz-d50 #1', function () {
            return transform(`.hsl { color: rgb(179 34 34/50%); }`, {
                beautify: true,
                convertColor: ColorType.SRGB_LINEAR
            }).then(result => expect(isOkLabClose(result.ast.chi[0].chi[0].val[0], {
                    typ: EnumToken.ColorTokenType,
                    val: "color",
                    chi: [
                        {
                            typ: EnumToken.IdenTokenType,
                            val: "xyz-d50"
                        },
                        {
                            typ: EnumToken.NumberTokenType,
                            val: "0.2050219599912612"
                        }, {
                            typ: EnumToken.NumberTokenType,
                            val: "0.11273398825257439"
                        }, {
                            typ: EnumToken.NumberTokenType,
                            val: ".019252589983419124"
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

        it('hsl(a) to xyz-d50 #2', function () {
            return transform(`.hsl { color: hsl(0 68.07511737089203% 41.764705882352935%/50%); }`, {
                beautify: true,
                convertColor: ColorType.SRGB_LINEAR
            }).then(result => expect(isOkLabClose(result.ast.chi[0].chi[0].val[0], {
                    typ: EnumToken.ColorTokenType,
                    val: "color",
                    chi: [
                        {
                            typ: EnumToken.IdenTokenType,
                            val: "xyz-d50"
                        },
                        {
                            typ: EnumToken.NumberTokenType,
                            val: "0.2050219599912612"
                        }, {
                            typ: EnumToken.NumberTokenType,
                            val: "0.11273398825257439"
                        }, {
                            typ: EnumToken.NumberTokenType,
                            val: ".019252589983419124"
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

        it('device-cmyk() to xyz-d50 #3', function () {
            return transform(`.hsl { color: device-cmyk(0 81.00558659217877% 81.00558659217877% 29.803921568627455%/50%); }`, {
                beautify: true,
                convertColor: ColorType.SRGB_LINEAR
            }).then(result => expect(isOkLabClose(result.ast.chi[0].chi[0].val[0], {
                    typ: EnumToken.ColorTokenType,
                    val: "color",
                    chi: [
                        {
                            typ: EnumToken.IdenTokenType,
                            val: "xyz-d50"
                        },
                        {
                            typ: EnumToken.NumberTokenType,
                            val: "0.2050219599912612"
                        }, {
                            typ: EnumToken.NumberTokenType,
                            val: "0.11273398825257439"
                        }, {
                            typ: EnumToken.NumberTokenType,
                            val: ".019252589983419124"
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

        it('hwb() to xyz-d50 #4', function () {
            return transform(`.hsl { color: hwb(0 13.333333333333334% 30%/50%); }`, {
                beautify: true,
                convertColor: ColorType.SRGB_LINEAR
            }).then(result => expect(isOkLabClose(result.ast.chi[0].chi[0].val[0], {
                    typ: EnumToken.ColorTokenType,
                    val: "color",
                    chi: [
                        {
                            typ: EnumToken.IdenTokenType,
                            val: "xyz-d50"
                        },
                        {
                            typ: EnumToken.NumberTokenType,
                            val: "0.2050219599912612"
                        }, {
                            typ: EnumToken.NumberTokenType,
                            val: "0.11273398825257439"
                        }, {
                            typ: EnumToken.NumberTokenType,
                            val: ".019252589983419124"
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

        it('hex to xyz-d50 #5', function () {
            return transform(`.hsl { color: #b3222280; }`, {
                beautify: true,
                convertColor: ColorType.SRGB_LINEAR
            }).then(result => expect(isOkLabClose(result.ast.chi[0].chi[0].val[0], {
                    typ: EnumToken.ColorTokenType,
                    val: "color",
                    chi: [
                        {
                            typ: EnumToken.IdenTokenType,
                            val: "xyz-d50"
                        },
                        {
                            typ: EnumToken.NumberTokenType,
                            val: "0.2050219599912612"
                        }, {
                            typ: EnumToken.NumberTokenType,
                            val: "0.11273398825257439"
                        }, {
                            typ: EnumToken.NumberTokenType,
                            val: ".019252589983419124"
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

        it('srgb-linear to xyz-d50 #6', function () {
            return transform(`.hsl { color: color(srgb-linear .45078578283822346 .01599629336550963 .01599629336550963/50%); }`, {
                beautify: true,
                convertColor: ColorType.SRGB_LINEAR
            }).then(result => expect(isOkLabClose(result.ast.chi[0].chi[0].val[0], {
                    typ: EnumToken.ColorTokenType,
                    val: "color",
                    chi: [
                        {
                            typ: EnumToken.IdenTokenType,
                            val: "xyz-d50"
                        },
                        {
                            typ: EnumToken.NumberTokenType,
                            val: "0.2050219599912612"
                        }, {
                            typ: EnumToken.NumberTokenType,
                            val: "0.11273398825257439"
                        }, {
                            typ: EnumToken.NumberTokenType,
                            val: ".019252589983419124"
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

        it('display-p3 to xyz-d50 #7', function () {
            return transform(`.hsl { color: color(display-p3 0.644980276448 0.191199800941 0.165770885403 / 0.501960784314); }`, {
                beautify: true,
                convertColor: ColorType.SRGB_LINEAR
            }).then(result => expect(isOkLabClose(result.ast.chi[0].chi[0].val[0], {
                    typ: EnumToken.ColorTokenType,
                    val: "color",
                    chi: [
                        {
                            typ: EnumToken.IdenTokenType,
                            val: "xyz-d50"
                        },
                        {
                            typ: EnumToken.NumberTokenType,
                            val: "0.2050219599912612"
                        }, {
                            typ: EnumToken.NumberTokenType,
                            val: "0.11273398825257439"
                        }, {
                            typ: EnumToken.NumberTokenType,
                            val: ".019252589983419124"
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

        it('a98-rgb to xyz-d50 #8', function () {
            return transform(`.hsl { color: color(a98-rgb 0.6015 0.1525 0.1525 / 0.50); }`, {
                beautify: true,
                convertColor: ColorType.SRGB_LINEAR
            }).then(result => expect(isOkLabClose(result.ast.chi[0].chi[0].val[0], {
                    typ: EnumToken.ColorTokenType,
                    val: "color",
                    chi: [
                        {
                            typ: EnumToken.IdenTokenType,
                            val: "xyz-d50"
                        },
                        {
                            typ: EnumToken.NumberTokenType,
                            val: "0.2050219599912612"
                        }, {
                            typ: EnumToken.NumberTokenType,
                            val: "0.11273398825257439"
                        }, {
                            typ: EnumToken.NumberTokenType,
                            val: ".019252589983419124"
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

        it('photo-rgb to xyz-d50 #9', function () {
            return transform(`.hsl { color: color(prophoto-rgb 0.4589 0.2071 0.124 / 0.50); }`, {
                beautify: true,
                convertColor: ColorType.SRGB_LINEAR
            }).then(result => expect(isOkLabClose(result.ast.chi[0].chi[0].val[0], {
                    typ: EnumToken.ColorTokenType,
                    val: "color",
                    chi: [
                        {
                            typ: EnumToken.IdenTokenType,
                            val: "xyz-d50"
                        },
                        {
                            typ: EnumToken.NumberTokenType,
                            val: "0.2050219599912612"
                        }, {
                            typ: EnumToken.NumberTokenType,
                            val: "0.11273398825257439"
                        }, {
                            typ: EnumToken.NumberTokenType,
                            val: ".019252589983419124"
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

        it('xyz to xyz-d50 #11', function () {
            return transform(`.hsl { color: color(xyz-d65 0.1945 0.1084 0.0258 / 0.50); }`, {
                beautify: true,
                convertColor: ColorType.SRGB_LINEAR
            }).then(result => expect(isOkLabClose(result.ast.chi[0].chi[0].val[0], {
                    typ: EnumToken.ColorTokenType,
                    val: "color",
                    chi: [
                        {
                            typ: EnumToken.IdenTokenType,
                            val: "xyz-d50"
                        },
                        {
                            typ: EnumToken.NumberTokenType,
                            val: "0.2050219599912612"
                        }, {
                            typ: EnumToken.NumberTokenType,
                            val: "0.11273398825257439"
                        }, {
                            typ: EnumToken.NumberTokenType,
                            val: ".019252589983419124"
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

        it('srgb to xyz-d50 #12', function () {
            return transform(`.hsl { color: color(srgb .7019607843137254 .13333333333333333 .13333333333333333/50%); }`, {
                beautify: true,
                convertColor: ColorType.SRGB_LINEAR
            }).then(result => expect(isOkLabClose(result.ast.chi[0].chi[0].val[0], {
                    typ: EnumToken.ColorTokenType,
                    val: "color",
                    chi: [
                        {
                            typ: EnumToken.IdenTokenType,
                            val: "xyz-d50"
                        },
                        {
                            typ: EnumToken.NumberTokenType,
                            val: "0.2050219599912612"
                        }, {
                            typ: EnumToken.NumberTokenType,
                            val: "0.11273398825257439"
                        }, {
                            typ: EnumToken.NumberTokenType,
                            val: ".019252589983419124"
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

        it('xyz-d65 to xyz-d50 #13', function () {
            return transform(`.hsl { color: color(xyz-d65 0.1945 0.1084 0.0258 / 0.50); }`, {
                beautify: true,
                convertColor: ColorType.SRGB_LINEAR
            }).then(result => expect(isOkLabClose(result.ast.chi[0].chi[0].val[0], {
                    typ: EnumToken.ColorTokenType,
                    val: "color",
                    chi: [
                        {
                            typ: EnumToken.IdenTokenType,
                            val: "xyz-d50"
                        },
                        {
                            typ: EnumToken.NumberTokenType,
                            val: "0.2050219599912612"
                        }, {
                            typ: EnumToken.NumberTokenType,
                            val: "0.11273398825257439"
                        }, {
                            typ: EnumToken.NumberTokenType,
                            val: ".019252589983419124"
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

        it('oklab to xyz-d50 #14', function () {
            return transform(`.hsl { color: oklab(.49863253097209403 .16117650019451524 .08155524287358212/50%); }`, {
                beautify: true,
                convertColor: ColorType.SRGB_LINEAR
            }).then(result => expect(isOkLabClose(result.ast.chi[0].chi[0].val[0], {
                    typ: EnumToken.ColorTokenType,
                    val: "color",
                    chi: [
                        {
                            typ: EnumToken.IdenTokenType,
                            val: "xyz-d50"
                        },
                        {
                            typ: EnumToken.NumberTokenType,
                            val: "0.2050219599912612"
                        }, {
                            typ: EnumToken.NumberTokenType,
                            val: "0.11273398825257439"
                        }, {
                            typ: EnumToken.NumberTokenType,
                            val: ".019252589983419124"
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

        it('oklch to xyz-d50 #15', function () {
            return transform(`.hsl { color: oklch(.49863253097209403 .1806353283694016 26.839391611662446/50%); }`, {
                beautify: true,
                convertColor: ColorType.SRGB_LINEAR
            }).then(result => expect(isOkLabClose(result.ast.chi[0].chi[0].val[0], {
                    typ: EnumToken.ColorTokenType,
                    val: "color",
                    chi: [
                        {
                            typ: EnumToken.IdenTokenType,
                            val: "xyz-d50"
                        },
                        {
                            typ: EnumToken.NumberTokenType,
                            val: "0.2050219599912612"
                        }, {
                            typ: EnumToken.NumberTokenType,
                            val: "0.11273398825257439"
                        }, {
                            typ: EnumToken.NumberTokenType,
                            val: ".019252589983419124"
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

        it('lab to xyz-d50 #16', function () {
            return transform(`.hsl { color: lab(40.03718216996103 56.88417629340889 39.4648992397212/50%); }`, {
                beautify: true,
                convertColor: ColorType.SRGB_LINEAR
            }).then(result => expect(isOkLabClose(result.ast.chi[0].chi[0].val[0], {
                    typ: EnumToken.ColorTokenType,
                    val: "color",
                    chi: [
                        {
                            typ: EnumToken.IdenTokenType,
                            val: "xyz-d50"
                        },
                        {
                            typ: EnumToken.NumberTokenType,
                            val: "0.2050219599912612"
                        }, {
                            typ: EnumToken.NumberTokenType,
                            val: "0.11273398825257439"
                        }, {
                            typ: EnumToken.NumberTokenType,
                            val: ".019252589983419124"
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

        it('lch to xyz-d50 #17', function () {
            return transform(`.hsl { color: lch(40.03718216996103 69.23357411387173 34.75200047889167/50%); }`, {
                beautify: true,
                convertColor: ColorType.SRGB_LINEAR
            }).then(result => expect(isOkLabClose(result.ast.chi[0].chi[0].val[0], {
                    typ: EnumToken.ColorTokenType,
                    val: "color",
                    chi: [
                        {
                            typ: EnumToken.IdenTokenType,
                            val: "xyz-d50"
                        },
                        {
                            typ: EnumToken.NumberTokenType,
                            val: "0.2050219599912612"
                        }, {
                            typ: EnumToken.NumberTokenType,
                            val: "0.11273398825257439"
                        }, {
                            typ: EnumToken.NumberTokenType,
                            val: ".019252589983419124"
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
