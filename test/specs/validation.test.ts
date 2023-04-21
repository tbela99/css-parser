import {expect} from "@esm-bundle/chai";
import {parse} from "../../tools/syntax";


describe('test validation parsing rules', function () {

    it('type with quotes', function () {

        expect(parse("<'length'>{1,2}")).deep.equals([
            {
                type: "length",
                occurrence: {
                    min: 1,
                    max: 2
                }
            }
        ])
    });

    it('type with range', function () {

        expect(parse('<length>{1,2}')).deep.equals([
            {
                type: "length",
                occurrence: {
                    min: 1,
                    max: 2
                }
            }
        ])
    });

    it('property descriptor', function () {

        expect(parse('[ <integer> && <symbol> ]#')).deep.equals(
            [
                [
                    {
                        "type": "integer"
                    },
                    {
                        "type": "symbol"
                    }
                ]
            ]
        )
    });

    it('parse declaration', function () {

        expect(parse('[ system: <counter-system>; ]')).deep.equals(
            [
                {
                    "type": "counter-system",
                    "name": "system"
                }
            ]
        )
    });

    it('optional symbol', function () {

        expect(parse('<symbol> <symbol>?')).deep.equals(
            [
                {
                    "type": "symbol"
                },
                {
                    "type": "symbol",
                    "optional": true
                }
            ]
        );

        expect(parse('[ <url> [ format( <string># ) ]? | local( <family-name> ) ]#')).deep.equals(
            [
                {
                    type: "any",
                    value: [
                        {
                            type: "url"
                        }, {
                            type: "function",
                            name: "format",
                            arguments: [
                                {
                                    type: "string"
                                }
                            ],
                            optional: true
                        }, {
                            type: "function",
                            name: "local",
                            arguments: [
                                {
                                    type: "family-name"
                                }
                            ]
                        }
                    ]
                }
            ]
        );
    });

    it('parse @document', function () {

        expect(parse('@document [ <url> | url-prefix(<string>) | domain(<string>) | media-document(<string>) | regexp(<string>) ]# {\n  <group-rule-body>\n}')).deep.equals(
            [
                {
                    type: "literal",
                    value: "@document"
                }, {
                type: "any",
                value: [
                    {
                        type: "url"
                    }, {
                        type: "function",
                        name: "url-prefix",
                        arguments: [
                            {
                                type: "string"
                            }
                        ]
                    }, {
                        type: "function",
                        name: "domain",
                        arguments: [
                            {
                                type: "string"
                            }
                        ]
                    }, {
                        type: "function",
                        name: "media-document",
                        arguments: [
                            {
                                type: "string"
                            }
                        ]
                    }, {
                        type: "function",
                        name: "regexp",
                        arguments: [
                            {
                                type: "string"
                            }
                        ]
                    }
                ]
            }, {
                type: "children",
                value:
                    {
                        type: "group-rule-body"
                    }
                }
            ]
        )
    });

    it('speak-as syntax', function () {

        expect(parse('auto | bullets | numbers | words | spell-out | <counter-style-name>')).deep.equals(
            [
                {
                    "type": "any",
                    "value": [
                        {
                            "type": "literal",
                            "value": "auto"
                        },
                        {
                            "type": "literal",
                            "value": "bullets"
                        },
                        {
                            "type": "literal",
                            "value": "numbers"
                        },
                        {
                            "type": "literal",
                            "value": "words"
                        },
                        {
                            "type": "literal",
                            "value": "spell-out"
                        },
                        {
                            "type": "counter-style-name"
                        }
                    ]
                }
            ]
        )
    });

    it('system syntax', function () {

        expect(parse('cyclic | numeric | alphabetic | symbolic | additive | [ fixed <integer>? ] | [ extends <counter-style-name> ]')).deep.equals(
            [
                {
                    type: "any",
                    value: [
                        {
                            type: "literal",
                            value: "cyclic"
                        }, {
                            type: "literal",
                            value: "numeric"
                        }, {
                            type: "literal",
                            value: "alphabetic"
                        }, {
                            type: "literal",
                            value: "symbolic"
                        }, {
                            type: "literal",
                            value: "additive"
                        }, {
                            type: "any",
                            value: [
                                {
                                    type: "literal",
                                    value: "fixed"
                                }, {
                                    type: "integer",
                                    optional: true
                                }
                            ]
                        }, {
                            type: "any",
                            value: [
                                {
                                    type: "literal",
                                    value: "extends"
                                }, {
                                    type: "counter-style-name"
                                }
                            ]
                        }
                    ]
                }
            ]
        )
    });

    it('required symbol', function () {

        expect(parse('<integer> && <symbol>')).deep.equals(
            [
                {
                    "type": "integer"
                },
                {
                    "type": "symbol"
                }
            ]
        )
    });

    it('type with range #2', function () {

        expect(parse('<integer [0,∞]>')).deep.equals(
            [
                {
                    type: "integer",
                    range: {
                        min: 0
                    }
                }
            ]
        );

        expect(parse('[ <integer [0,∞]> <absolute-color-base> ]#')).deep.equals(
            [
                {
                    type: "any",
                    value: [
                        {
                            type: "integer",
                            range: {
                                min: 0
                            }
                        }, {
                            type: "absolute-color-base"
                        }
                    ]
                }
            ]
        );
    });

    it('type with range and values', function () {

        expect(parse('<light | dark | <integer [0,∞]>')).deep.equals([
                {
                    "type": "any",
                    "value": [
                        {
                            "type": "literal",
                            "value": "light"
                        },
                        {
                            "type": "literal",
                            "value": "dark"
                        },
                        {
                            "type": "integer",
                            "range": {
                                "min": 0
                            }
                        }
                    ]
                }
            ]
        )
    });

    it('counter-style at-rule', function () {

        expect(parse('@counter-style <counter-style-name> {\n  [ system: <counter-system>; ] ||\n  [ symbols: <counter-symbols>; ] ||\n  [ additive-symbols: <additive-symbols>; ] ||\n  [ negative: <negative-symbol>; ] ||\n  [ prefix: <prefix>; ] ||\n  [ suffix: <suffix>; ] ||\n  [ range: <range>; ] ||\n  [ pad: <padding>; ] ||\n  [ speak-as: <speak-as>; ] ||\n  [ fallback: <counter-style-name>; ]\n}')).deep.equals(
            [
                {
                    "type": "literal",
                    "value": "@counter-style"
                },
                {
                    "type": "counter-style-name"
                },
                {
                    "type": "children",
                    "value": {
                        "type": "any",
                        "value": [
                            {
                                "type": "counter-system",
                                "name": "system"
                            },
                            {
                                "type": "counter-symbols",
                                "name": "symbols"
                            },
                            {
                                "type": "additive-symbols",
                                "name": "additive-symbols"
                            },
                            {
                                "type": "negative-symbol",
                                "name": "negative"
                            },
                            {
                                "type": "prefix",
                                "name": "prefix"
                            },
                            {
                                "type": "suffix",
                                "name": "suffix"
                            },
                            {
                                "type": "range",
                                "name": "range"
                            },
                            {
                                "type": "padding",
                                "name": "pad"
                            },
                            {
                                "type": "speak-as",
                                "name": "speak-as"
                            },
                            {
                                "type": "counter-style-name",
                                "name": "fallback"
                            }
                        ]
                    }
                }
            ]
        )
    });
});
