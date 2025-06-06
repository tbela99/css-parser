var properties = {
	gap: {
		shorthand: "gap",
		properties: [
			"row-gap",
			"column-gap"
		],
		types: [
			"Length",
			"Perc"
		],
		multiple: false,
		separator: null,
		keywords: [
			"normal"
		]
	},
	"row-gap": {
		shorthand: "gap"
	},
	"column-gap": {
		shorthand: "gap"
	},
	inset: {
		shorthand: "inset",
		properties: [
			"top",
			"right",
			"bottom",
			"left"
		],
		types: [
			"Length",
			"Perc"
		],
		multiple: false,
		separator: null,
		keywords: [
			"auto"
		]
	},
	top: {
		shorthand: "inset"
	},
	right: {
		shorthand: "inset"
	},
	bottom: {
		shorthand: "inset"
	},
	left: {
		shorthand: "inset"
	},
	margin: {
		shorthand: "margin",
		properties: [
			"margin-top",
			"margin-right",
			"margin-bottom",
			"margin-left"
		],
		types: [
			"Length",
			"Perc"
		],
		multiple: false,
		separator: null,
		keywords: [
			"auto"
		]
	},
	"margin-top": {
		shorthand: "margin"
	},
	"margin-right": {
		shorthand: "margin"
	},
	"margin-bottom": {
		shorthand: "margin"
	},
	"margin-left": {
		shorthand: "margin"
	},
	padding: {
		shorthand: "padding",
		properties: [
			"padding-top",
			"padding-right",
			"padding-bottom",
			"padding-left"
		],
		types: [
			"Length",
			"Perc"
		],
		keywords: [
		]
	},
	"padding-top": {
		shorthand: "padding"
	},
	"padding-right": {
		shorthand: "padding"
	},
	"padding-bottom": {
		shorthand: "padding"
	},
	"padding-left": {
		shorthand: "padding"
	},
	"border-radius": {
		shorthand: "border-radius",
		properties: [
			"border-top-left-radius",
			"border-top-right-radius",
			"border-bottom-right-radius",
			"border-bottom-left-radius"
		],
		types: [
			"Length",
			"Perc"
		],
		multiple: true,
		separator: "/",
		keywords: [
		]
	},
	"border-top-left-radius": {
		shorthand: "border-radius"
	},
	"border-top-right-radius": {
		shorthand: "border-radius"
	},
	"border-bottom-right-radius": {
		shorthand: "border-radius"
	},
	"border-bottom-left-radius": {
		shorthand: "border-radius"
	},
	"border-width": {
		shorthand: "border-width",
		map: "border",
		properties: [
			"border-top-width",
			"border-right-width",
			"border-bottom-width",
			"border-left-width"
		],
		types: [
			"Length",
			"Perc"
		],
		"default": [
			"medium"
		],
		keywords: [
			"thin",
			"medium",
			"thick"
		]
	},
	"border-top-width": {
		map: "border",
		shorthand: "border-width"
	},
	"border-right-width": {
		map: "border",
		shorthand: "border-width"
	},
	"border-bottom-width": {
		map: "border",
		shorthand: "border-width"
	},
	"border-left-width": {
		map: "border",
		shorthand: "border-width"
	},
	"border-style": {
		shorthand: "border-style",
		map: "border",
		properties: [
			"border-top-style",
			"border-right-style",
			"border-bottom-style",
			"border-left-style"
		],
		types: [
		],
		"default": [
			"none"
		],
		keywords: [
			"none",
			"hidden",
			"dotted",
			"dashed",
			"solid",
			"double",
			"groove",
			"ridge",
			"inset",
			"outset"
		]
	},
	"border-top-style": {
		map: "border",
		shorthand: "border-style"
	},
	"border-right-style": {
		map: "border",
		shorthand: "border-style"
	},
	"border-bottom-style": {
		map: "border",
		shorthand: "border-style"
	},
	"border-left-style": {
		map: "border",
		shorthand: "border-style"
	},
	"border-color": {
		shorthand: "border-color",
		map: "border",
		properties: [
			"border-top-color",
			"border-right-color",
			"border-bottom-color",
			"border-left-color"
		],
		types: [
			"Color"
		],
		"default": [
			"currentcolor"
		],
		keywords: [
		]
	},
	"border-top-color": {
		map: "border",
		shorthand: "border-color"
	},
	"border-right-color": {
		map: "border",
		shorthand: "border-color"
	},
	"border-bottom-color": {
		map: "border",
		shorthand: "border-color"
	},
	"border-left-color": {
		map: "border",
		shorthand: "border-color"
	}
};
var map = {
	"flex-flow": {
		shorthand: "flex-flow",
		pattern: "flex-direction flex-wrap",
		keywords: [
		],
		"default": [
			"row",
			"nowrap"
		],
		properties: {
			"flex-direction": {
				keywords: [
					"row",
					"row-reverse",
					"column",
					"column-reverse"
				],
				"default": [
					"row"
				],
				types: [
				]
			},
			"flex-wrap": {
				keywords: [
					"wrap",
					"nowrap",
					"wrap-reverse"
				],
				"default": [
					"nowrap"
				],
				types: [
				]
			}
		}
	},
	"flex-direction": {
		shorthand: "flex-flow"
	},
	"flex-wrap": {
		shorthand: "flex-flow"
	},
	container: {
		shorthand: "container",
		pattern: "container-name container-type",
		keywords: [
		],
		"default": [
		],
		properties: {
			"container-name": {
				required: true,
				multiple: true,
				keywords: [
					"none"
				],
				"default": [
					"none"
				],
				types: [
					"Iden",
					"DashedIden"
				]
			},
			"container-type": {
				previous: "container-name",
				prefix: {
					typ: "Literal",
					val: "/"
				},
				keywords: [
					"size",
					"inline-size",
					"normal"
				],
				"default": [
					"normal"
				],
				types: [
				]
			}
		}
	},
	"container-name": {
		shorthand: "container"
	},
	"container-type": {
		shorthand: "container"
	},
	flex: {
		shorthand: "flex",
		pattern: "flex-grow flex-shrink flex-basis",
		keywords: [
			"auto",
			"none",
			"initial"
		],
		"default": [
		],
		mapping: {
			"0 1 auto": "initial",
			"0 0 auto": "none",
			"1 1 auto": "auto"
		},
		properties: {
			"flex-grow": {
				required: true,
				keywords: [
				],
				"default": [
				],
				types: [
					"Number"
				]
			},
			"flex-shrink": {
				keywords: [
				],
				"default": [
				],
				types: [
					"Number"
				]
			},
			"flex-basis": {
				keywords: [
					"max-content",
					"min-content",
					"fit-content",
					"fit-content",
					"content",
					"auto"
				],
				"default": [
				],
				types: [
					"Length",
					"Perc"
				]
			}
		}
	},
	"flex-grow": {
		shorthand: "flex"
	},
	"flex-shrink": {
		shorthand: "flex"
	},
	"flex-basis": {
		shorthand: "flex"
	},
	columns: {
		shorthand: "columns",
		pattern: "column-count column-width",
		keywords: [
			"auto"
		],
		"default": [
			"auto",
			"auto auto"
		],
		properties: {
			"column-count": {
				keywords: [
					"auto"
				],
				"default": [
					"auto"
				],
				types: [
					"Number"
				]
			},
			"column-width": {
				keywords: [
					"auto"
				],
				"default": [
					"auto"
				],
				types: [
					"Length"
				]
			}
		}
	},
	"column-count": {
		shorthand: "columns"
	},
	"column-width": {
		shorthand: "columns"
	},
	transition: {
		shorthand: "transition",
		multiple: true,
		separator: {
			typ: "Comma"
		},
		pattern: "transition-property transition-duration transition-timing-function transition-delay transition-behavior",
		keywords: [
			"none",
			"all"
		],
		"default": [
			"0s",
			"0ms",
			"all",
			"ease",
			"none",
			"normal"
		],
		mapping: {
			"cubic-bezier(.25,.1,.25,1)": "ease",
			"cubic-bezier(0,0,1,1)": "linear",
			"cubic-bezier(.42,0,1,1)": "ease-in",
			"cubic-bezier(0,0,.58,1)": "ease-out",
			"cubic-bezier(.42,0,.58,.42)": "ease-in-out"
		},
		properties: {
			"transition-property": {
				keywords: [
					"none",
					"all"
				],
				"default": [
					"all"
				],
				types: [
					"Iden"
				]
			},
			"transition-duration": {
				keywords: [
				],
				"default": [
					"0s",
					"0ms",
					"normal"
				],
				types: [
					"Time"
				]
			},
			"transition-timing-function": {
				keywords: [
					"ease",
					"ease-in",
					"ease-out",
					"ease-in-out",
					"linear",
					"step-start",
					"step-end"
				],
				"default": [
					"ease"
				],
				types: [
					"TimingFunction"
				],
				mapping: {
					"cubic-bezier(.25,.1,.25,1)": "ease",
					"cubic-bezier(0,0,1,1)": "linear",
					"cubic-bezier(.42,0,1,1)": "ease-in",
					"cubic-bezier(0,0,.58,1)": "ease-out",
					"cubic-bezier(.42,0,.58,.42)": "ease-in-out"
				}
			},
			"transition-delay": {
				keywords: [
				],
				"default": [
					"0s"
				],
				types: [
					"Time"
				]
			},
			"transition-behavior": {
				keywords: [
					"normal",
					"allow-discrete"
				],
				"default": [
					"normal"
				],
				types: [
				]
			}
		}
	},
	"transition-property": {
		shorthand: "transition"
	},
	"transition-duration": {
		shorthand: "transition"
	},
	"transition-timing-function": {
		shorthand: "transition"
	},
	"transition-delay": {
		shorthand: "transition"
	},
	"transition-behavior": {
		shorthand: "transition"
	},
	animation: {
		shorthand: "animation",
		pattern: "animation-name animation-duration animation-timing-function animation-delay animation-iteration-count animation-direction animation-fill-mode animation-play-state animation-timeline",
		"default": [
			"1",
			"0s",
			"0ms",
			"none",
			"ease",
			"normal",
			"running",
			"auto"
		],
		properties: {
			"animation-name": {
				keywords: [
					"none"
				],
				"default": [
					"none"
				],
				types: [
					"Iden"
				]
			},
			"animation-duration": {
				keywords: [
					"auto"
				],
				"default": [
					"0s",
					"0ms",
					"auto"
				],
				types: [
					"Time"
				],
				mapping: {
					auto: "0s"
				}
			},
			"animation-timing-function": {
				keywords: [
					"ease",
					"ease-in",
					"ease-out",
					"ease-in-out",
					"linear",
					"step-start",
					"step-end"
				],
				"default": [
					"ease"
				],
				types: [
					"TimingFunction"
				],
				mapping: {
					"cubic-bezier(.25,.1,.25,1)": "ease",
					"cubic-bezier(0,0,1,1)": "linear",
					"cubic-bezier(.42,0,1,1)": "ease-in",
					"cubic-bezier(0,0,.58,1)": "ease-out",
					"cubic-bezier(.42,0,.58,.42)": "ease-in-out"
				}
			},
			"animation-delay": {
				keywords: [
				],
				"default": [
					"0s",
					"0ms"
				],
				types: [
					"Time"
				]
			},
			"animation-iteration-count": {
				keywords: [
					"infinite"
				],
				"default": [
					"1"
				],
				types: [
					"Number"
				]
			},
			"animation-direction": {
				keywords: [
					"normal",
					"reverse",
					"alternate",
					"alternate-reverse"
				],
				"default": [
					"normal"
				],
				types: [
				]
			},
			"animation-fill-mode": {
				keywords: [
					"none",
					"forwards",
					"backwards",
					"both"
				],
				"default": [
					"none"
				],
				types: [
				]
			},
			"animation-play-state": {
				keywords: [
					"running",
					"paused"
				],
				"default": [
					"running"
				],
				types: [
				]
			},
			"animation-timeline": {
				keywords: [
					"none",
					"auto"
				],
				"default": [
					"auto"
				],
				types: [
					"DashedIden",
					"TimelineFunction"
				]
			}
		}
	},
	"animation-name": {
		shorthand: "animation"
	},
	"animation-duration": {
		shorthand: "animation"
	},
	"animation-timing-function": {
		shorthand: "animation"
	},
	"animation-delay": {
		shorthand: "animation"
	},
	"animation-iteration-count": {
		shorthand: "animation"
	},
	"animation-direction": {
		shorthand: "animation"
	},
	"animation-fill-mode": {
		shorthand: "animation"
	},
	"animation-play-state": {
		shorthand: "animation"
	},
	"animation-timeline": {
		shorthand: "animation"
	},
	"text-emphasis": {
		shorthand: "text-emphasis",
		pattern: "text-emphasis-color text-emphasis-style",
		"default": [
			"none",
			"currentcolor"
		],
		properties: {
			"text-emphasis-style": {
				keywords: [
					"none",
					"filled",
					"open",
					"dot",
					"circle",
					"double-circle",
					"triangle",
					"sesame"
				],
				"default": [
					"none"
				],
				types: [
					"String"
				]
			},
			"text-emphasis-color": {
				"default": [
					"currentcolor"
				],
				types: [
					"Color"
				]
			}
		}
	},
	"text-emphasis-style": {
		shorthand: "text-emphasis"
	},
	"text-emphasis-color": {
		shorthand: "text-emphasis"
	},
	border: {
		shorthand: "border",
		pattern: "border-color border-style border-width",
		keywords: [
			"none"
		],
		"default": [
			"0",
			"none"
		],
		properties: {
			"border-color": {
				types: [
					"Color"
				],
				"default": [
					"currentcolor"
				],
				keywords: [
				]
			},
			"border-style": {
				types: [
				],
				"default": [
					"none"
				],
				keywords: [
					"none",
					"hidden",
					"dotted",
					"dashed",
					"solid",
					"double",
					"groove",
					"ridge",
					"inset",
					"outset"
				]
			},
			"border-width": {
				types: [
					"Length",
					"Perc"
				],
				"default": [
					"medium"
				],
				keywords: [
					"thin",
					"medium",
					"thick"
				]
			}
		}
	},
	"border-color": {
		shorthand: "border"
	},
	"border-style": {
		shorthand: "border"
	},
	"border-width": {
		shorthand: "border"
	},
	"list-style": {
		shorthand: "list-style",
		pattern: "list-style-type list-style-position list-style-image",
		keywords: [
			"none",
			"outside"
		],
		"default": [
			"none",
			"outside"
		],
		properties: {
			"list-style-position": {
				types: [
				],
				"default": [
					"outside"
				],
				keywords: [
					"inside",
					"outside"
				]
			},
			"list-style-image": {
				"default": [
					"none"
				],
				keywords: [
					"node"
				],
				types: [
					"UrlFunc",
					"ImageFunc"
				]
			},
			"list-style-type": {
				types: [
					"String",
					"Iden",
					"Symbols"
				],
				"default": [
					"disc"
				],
				keywords: [
					"disc",
					"circle",
					"square",
					"decimal",
					"decimal-leading-zero",
					"lower-roman",
					"upper-roman",
					"lower-greek",
					"lower-latin",
					"upper-latin",
					"none"
				]
			}
		}
	},
	"list-style-position": {
		shorthand: "list-style"
	},
	"list-style-image": {
		shorthand: "list-style"
	},
	"list-style-type": {
		shorthand: "list-style"
	},
	overflow: {
		shorthand: "overflow",
		pattern: "overflow-x overflow-y",
		keywords: [
			"auto",
			"visible",
			"hidden",
			"clip",
			"scroll"
		],
		"default": [
		],
		mapping: {
			"visible visible": "visible",
			"auto auto": "auto",
			"hidden hidden": "hidden",
			"scroll scroll": "scroll"
		},
		properties: {
			"overflow-x": {
				"default": [
				],
				types: [
				],
				keywords: [
					"auto",
					"visible",
					"hidden",
					"clip",
					"scroll"
				]
			},
			"overflow-y": {
				"default": [
				],
				types: [
				],
				keywords: [
					"auto",
					"visible",
					"hidden",
					"clip",
					"scroll"
				]
			}
		}
	},
	"overflow-x": {
		shorthand: "overflow"
	},
	"overflow-y": {
		shorthand: "overflow"
	},
	outline: {
		shorthand: "outline",
		pattern: "outline-color outline-style outline-width",
		keywords: [
			"none"
		],
		"default": [
			"0",
			"none",
			"currentcolor"
		],
		properties: {
			"outline-color": {
				types: [
					"Color"
				],
				"default": [
					"currentcolor"
				],
				keywords: [
					"currentcolor"
				]
			},
			"outline-style": {
				types: [
				],
				"default": [
					"none"
				],
				keywords: [
					"auto",
					"none",
					"dotted",
					"dashed",
					"solid",
					"double",
					"groove",
					"ridge",
					"inset",
					"outset"
				]
			},
			"outline-width": {
				types: [
					"Length",
					"Perc"
				],
				"default": [
					"medium"
				],
				keywords: [
					"thin",
					"medium",
					"thick"
				]
			}
		}
	},
	"outline-color": {
		shorthand: "outline"
	},
	"outline-style": {
		shorthand: "outline"
	},
	"outline-width": {
		shorthand: "outline"
	},
	font: {
		shorthand: "font",
		pattern: "font-weight font-style font-size line-height font-stretch font-variant font-family",
		keywords: [
			"caption",
			"icon",
			"menu",
			"message-box",
			"small-caption",
			"status-bar",
			"-moz-window, ",
			"-moz-document, ",
			"-moz-desktop, ",
			"-moz-info, ",
			"-moz-dialog",
			"-moz-button",
			"-moz-pull-down-menu",
			"-moz-list",
			"-moz-field"
		],
		"default": [
		],
		properties: {
			"font-weight": {
				types: [
					"Number"
				],
				"default": [
					"400",
					"normal"
				],
				keywords: [
					"normal",
					"bold",
					"lighter",
					"bolder"
				],
				constraints: {
					value: {
						min: "1",
						max: "1000"
					}
				},
				mapping: {
					thin: "100",
					hairline: "100",
					"extra light": "200",
					"ultra light": "200",
					light: "300",
					normal: "400",
					regular: "400",
					medium: "500",
					"semi bold": "600",
					"demi bold": "600",
					bold: "700",
					"extra bold": "800",
					"ultra bold": "800",
					black: "900",
					heavy: "900",
					"extra black": "950",
					"ultra black": "950"
				}
			},
			"font-style": {
				types: [
					"Angle"
				],
				"default": [
					"normal"
				],
				keywords: [
					"normal",
					"italic",
					"oblique"
				]
			},
			"font-size": {
				types: [
					"Length",
					"Perc"
				],
				"default": [
				],
				keywords: [
					"xx-small",
					"x-small",
					"small",
					"medium",
					"large",
					"x-large",
					"xx-large",
					"xxx-large",
					"larger",
					"smaller"
				],
				required: true
			},
			"line-height": {
				types: [
					"Length",
					"Perc",
					"Number"
				],
				"default": [
					"normal"
				],
				keywords: [
					"normal"
				],
				previous: "font-size",
				prefix: {
					typ: "Literal",
					val: "/"
				}
			},
			"font-stretch": {
				types: [
					"Perc"
				],
				"default": [
					"normal"
				],
				keywords: [
					"ultra-condensed",
					"extra-condensed",
					"condensed",
					"semi-condensed",
					"normal",
					"semi-expanded",
					"expanded",
					"extra-expanded",
					"ultra-expanded"
				],
				mapping: {
					"ultra-condensed": "50%",
					"extra-condensed": "62.5%",
					condensed: "75%",
					"semi-condensed": "87.5%",
					normal: "100%",
					"semi-expanded": "112.5%",
					expanded: "125%",
					"extra-expanded": "150%",
					"ultra-expanded": "200%"
				}
			},
			"font-variant": {
				types: [
				],
				"default": [
					"normal"
				],
				keywords: [
					"normal",
					"none",
					"common-ligatures",
					"no-common-ligatures",
					"discretionary-ligatures",
					"no-discretionary-ligatures",
					"historical-ligatures",
					"no-historical-ligatures",
					"contextual",
					"no-contextual",
					"historical-forms",
					"small-caps",
					"all-small-caps",
					"petite-caps",
					"all-petite-caps",
					"unicase",
					"titling-caps",
					"ordinal",
					"slashed-zero",
					"lining-nums",
					"oldstyle-nums",
					"proportional-nums",
					"tabular-nums",
					"diagonal-fractions",
					"stacked-fractions",
					"ordinal",
					"slashed-zero",
					"ruby",
					"jis78",
					"jis83",
					"jis90",
					"jis04",
					"simplified",
					"traditional",
					"full-width",
					"proportional-width",
					"ruby",
					"sub",
					"super",
					"text",
					"emoji",
					"unicode"
				]
			},
			"font-family": {
				types: [
					"String",
					"Iden"
				],
				"default": [
				],
				keywords: [
					"serif",
					"sans-serif",
					"monospace",
					"cursive",
					"fantasy",
					"system-ui",
					"ui-serif",
					"ui-sans-serif",
					"ui-monospace",
					"ui-rounded",
					"math",
					"emoji",
					"fangsong"
				],
				required: true,
				multiple: true,
				separator: {
					typ: "Comma"
				}
			}
		}
	},
	"font-weight": {
		shorthand: "font"
	},
	"font-style": {
		shorthand: "font"
	},
	"font-size": {
		shorthand: "font"
	},
	"line-height": {
		shorthand: "font"
	},
	"font-stretch": {
		shorthand: "font"
	},
	"font-variant": {
		shorthand: "font"
	},
	"font-family": {
		shorthand: "font"
	},
	background: {
		shorthand: "background",
		pattern: "background-attachment background-origin background-clip background-color background-image background-repeat background-position background-size",
		keywords: [
			"none"
		],
		"default": [
			"0 0",
			"none",
			"auto",
			"repeat",
			"transparent",
			"#0000",
			"scroll",
			"padding-box",
			"border-box"
		],
		multiple: true,
		set: {
			"background-origin": [
				"background-clip"
			]
		},
		separator: {
			typ: "Comma"
		},
		properties: {
			"background-repeat": {
				types: [
				],
				"default": [
					"repeat"
				],
				multiple: true,
				keywords: [
					"repeat-x",
					"repeat-y",
					"repeat",
					"space",
					"round",
					"no-repeat"
				],
				mapping: {
					"repeat no-repeat": "repeat-x",
					"no-repeat repeat": "repeat-y",
					"repeat repeat": "repeat",
					"space space": "space",
					"round round": "round",
					"no-repeat no-repeat": "no-repeat"
				}
			},
			"background-color": {
				types: [
					"Color"
				],
				"default": [
					"#0000",
					"transparent"
				],
				multiple: true,
				keywords: [
				]
			},
			"background-image": {
				types: [
					"UrlFunc",
					"ImageFunc"
				],
				"default": [
					"none"
				],
				keywords: [
					"none"
				]
			},
			"background-attachment": {
				types: [
				],
				"default": [
					"scroll"
				],
				multiple: true,
				keywords: [
					"scroll",
					"fixed",
					"local"
				]
			},
			"background-clip": {
				types: [
				],
				"default": [
					"border-box"
				],
				multiple: true,
				keywords: [
					"border-box",
					"padding-box",
					"content-box",
					"text"
				]
			},
			"background-origin": {
				types: [
				],
				"default": [
					"padding-box"
				],
				multiple: true,
				keywords: [
					"border-box",
					"padding-box",
					"content-box"
				]
			},
			"background-position": {
				multiple: true,
				types: [
					"Perc",
					"Length"
				],
				"default": [
					"0 0",
					"top left",
					"left top"
				],
				keywords: [
					"top",
					"left",
					"center",
					"bottom",
					"right"
				],
				mapping: {
					left: "0",
					top: "0",
					center: "50%",
					"center center": "50%",
					"50% 50%": "50%",
					bottom: "100%",
					right: "100%"
				},
				constraints: {
					mapping: {
						max: 2
					}
				}
			},
			"background-size": {
				multiple: true,
				previous: "background-position",
				prefix: {
					typ: "Literal",
					val: "/"
				},
				types: [
					"Perc",
					"Length"
				],
				"default": [
					"auto",
					"auto auto"
				],
				keywords: [
					"auto",
					"cover",
					"contain"
				],
				mapping: {
					"auto auto": "auto"
				}
			}
		}
	},
	"background-repeat": {
		shorthand: "background"
	},
	"background-color": {
		shorthand: "background"
	},
	"background-image": {
		shorthand: "background"
	},
	"background-attachment": {
		shorthand: "background"
	},
	"background-clip": {
		shorthand: "background"
	},
	"background-origin": {
		shorthand: "background"
	},
	"background-position": {
		shorthand: "background"
	},
	"background-size": {
		shorthand: "background"
	}
};
var config = {
	properties: properties,
	map: map
};

export { config as default, map, properties };
