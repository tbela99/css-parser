/* 
	CSS parser, minifier and validator for node and the browser

	Author(s): Thierry Bela
	Version: 2.0.1
	License: MIT
 */
var atRules = {
	"@annotation": {
		syntax: "@annotation { <declaration-list> }"
	},
	"@apply": {
		syntax: "@apply [ <dashed-ident> | <dashed-function> ] [ { <declaration-list> } ]?;"
	},
	"@bottom-left": {
		syntax: " @bottom-left { <declaration-list> }"
	},
	"@bottom-left-corner": {
		syntax: " @bottom-left-corner { <declaration-list> }"
	},
	"@bottom-right": {
		syntax: " @bottom-right { <declaration-list> }"
	},
	"@bottom-right-corner": {
		syntax: " @bottom-right-corner { <declaration-list> }"
	},
	"@character-variant": {
		syntax: "@character-variant { <declaration-list> }"
	},
	"@charset": {
		syntax: "@charset \"<charset>\";"
	},
	"@color-profile": {
		syntax: "@color-profile [<dashed-ident> | device-cmyk] { <declaration-list> }",
		descriptors: {
			components: "<ident>#",
			"rendering-intent": "relative-colorimetric | absolute-colorimetric | perceptual | saturation",
			src: "<url>"
		}
	},
	"@container": {
		syntax: "@container <container-query-list> { <rule-list> }",
		descriptors: {
			"aspect-ratio": "<ratio>",
			"block-size": "<length>",
			height: "<length>",
			"inline-size": "<length>",
			orientation: "portrait | landscape",
			scrollable: "none | top | right | bottom | left | block-start | inline-start | block-end | inline-end | x | y | block | inline",
			scrolled: "none | top | right | bottom | left | block-start | inline-start | block-end | inline-end | x | y | block | inline",
			snapped: "none | x | y | block | inline | both",
			stuck: "none | top | right | bottom | left | block-start | inline-start | block-end | inline-end",
			width: "<length>"
		}
	},
	"@contents": {
		syntax: "@contents [ { <declaration-list> } ]?"
	},
	"@counter-style": {
		syntax: "@counter-style <counter-style-name> { <declaration-list> }",
		descriptors: {
			"additive-symbols": "[ <integer [0,∞]> && <symbol> ]#",
			fallback: "<counter-style-name>",
			negative: "<symbol> <symbol>?",
			pad: "<integer [0,∞]> && <symbol>",
			prefix: "<symbol>",
			range: "[ [ <integer> | infinite ]{2} ]# | auto",
			"speak-as": "auto | bullets | numbers | words | spell-out | <counter-style-name>",
			suffix: "<symbol>",
			symbols: "<symbol>+",
			system: "cyclic | numeric | alphabetic | symbolic | additive | [fixed <integer>?] | [ extends <counter-style-name> ]"
		}
	},
	"@custom-media": {
		syntax: " @custom-media <extension-name> [<media-query-list> | true | false ];"
	},
	"@else": {
		syntax: "@else <boolean-condition>? { <rule-list> }"
	},
	"@font-face": {
		syntax: "@font-face { <declaration-list> }",
		descriptors: {
			"ascent-override": "normal | <percentage [0,∞]>",
			"descent-override": "normal | <percentage [0,∞]>",
			"font-display": "auto | block | swap | fallback | optional",
			"font-family": "<font-family-name>",
			"font-feature-settings": "normal | <feature-tag-value>#",
			"font-language-override": "normal | <string>",
			"font-named-instance": "auto | <string>",
			"font-style": "auto | normal | italic | left | right | oblique [ <angle [-90deg,90deg]>{1,2} ]?",
			"font-variation-settings": "normal | [ <string> <number>]#",
			"font-weight": "auto | <font-weight-absolute>{1,2}",
			"font-width": "auto | <'font-width'>{1,2}",
			"line-gap-override": "normal | <percentage [0,∞]>",
			src: "<font-src-list>",
			"unicode-range": "<unicode-range-token>#"
		}
	},
	"@font-feature-values": {
		syntax: " @font-feature-values <family-name># { <@historical-forms> | <@styleset> | <@character-variant> | <@swash> | <@ornaments> | <@annotation> } ",
		descriptors: {
			"font-display": {
				syntax: "auto | block | swap | fallback | optional"
			}
		}
	},
	"@font-features-values": {
		descriptors: {
			"font-display": "auto | block | swap | fallback | optional"
		}
	},
	"@font-palette-values": {
		syntax: "@font-palette-values <dashed-ident> { <declaration-list> }",
		descriptors: {
			"base-palette": "light | dark | <integer [0,∞]>",
			"font-family": "<font-family-name>#",
			"override-colors": "[ <integer [0,∞]> <color> ]#"
		}
	},
	"@function": {
		syntax: "@function <function-token> <function-parameter>#? ,? ) [ returns <css-type> ]? { <declaration-rule-list> } <function-parameter>Info about the '<function-parameter>' reference.#typedef-function-parameterReferenced in:2.1. The @function Rule (2) 2.1.1. The Function Prelude 5.1. The @mixin rule 5.1.1. The Mixin Prelude Possible linking",
		descriptors: {
			result: "<declaration-value>?"
		}
	},
	"@historical-forms": {
		syntax: " @historical-forms { <declaration-list> }"
	},
	"@import": {
		syntax: "@import [ <url> | <string> ] [[ layer | layer( <layer-name> ) ] || [ scope | scope( <scope-start> | <scope-boundaries> ) ] || <supports-import-condition>]? <media-import-condition> ; <supports-import-condition>Info about the '<supports-import-condition>' reference.#typedef-supports-import-conditionReferenced in:2. Importing Style Sheets: the @import rule (2) Possible linking"
	},
	"@keyframes": {
		syntax: "@keyframes <keyframes-name> { <qualified-rule-list> }"
	},
	"@layer": {
		syntax: "@layer <layer-name>? { <rule-list> } | @layer <layer-name>#;"
	},
	"@left-bottom": {
		syntax: " @left-bottom { <declaration-list> }"
	},
	"@left-middle": {
		syntax: " @left-middle { <declaration-list> }"
	},
	"@left-top": {
		syntax: " @left-top { <declaration-list> }"
	},
	"@media": {
		syntax: "@media <media-query-list> { <rule-list> }"
	},
	"@mixin": {
		syntax: "@mixin [<function-token> <function-parameter>#? ,? ) | <ident-token> ] { <block-contents> }"
	},
	"@namespace": {
		syntax: "@namespace <namespace-prefix>? [ <string> | <url> ] ; <namespace-prefix>Info about the '<namespace-prefix>' reference.#typedef-namespace-prefixReferenced in:2.1. Syntax Possible linking"
	},
	"@navigation": {
		syntax: "@navigation <navigation-condition> { <rule-list> }"
	},
	"@ornaments": {
		syntax: "@ornaments { <declaration-list> }"
	},
	"@page": {
		syntax: "@page <page-selector-list>? { <declaration-rule-list> } <page-selector-list>Info about the '<page-selector-list>' reference.#typedef-page-selector-listReferenced in:4.3. @page rule grammar (2) Possible linking",
		descriptors: {
			bleed: "auto | <length>",
			marks: "none | [ crop || cross ]",
			"page-margin-safety": "none | clamp | add",
			"page-orientation": "upright | rotate-left | rotate-right",
			size: "<length [0,∞]>{1,2} | auto | [ <page-size> || [ portrait | landscape ] ]"
		}
	},
	"@position-try": {
		syntax: " @position-try <dashed-ident> { <declaration-list> } ",
		descriptors: {
			"align-self": "<'align-self'> | anchor-center",
			"block-size": "<'block-size'>",
			bottom: "<'bottom'>",
			height: "<'height'>",
			"inline-size": "<'inline-size'>",
			inset: "<'inset'>",
			"inset-block": "<'inset-block'>",
			"inset-block-end": "<'inset-block-end'>",
			"inset-block-start": "<'inset-block-start'>",
			"inset-inline": "<'inset-inline'>",
			"inset-inline-end": "<'inset-inline-end'>",
			"inset-inline-start": "<'inset-inline-start'>",
			"justify-self": "<'justify-self'> | anchor-center",
			left: "<'left'>",
			margin: "<'margin'>",
			"margin-block": "<'margin-block'>",
			"margin-block-end": "<'margin-block-end'>",
			"margin-block-start": "<'margin-block-start'>",
			"margin-bottom": "<'margin-bottom'>",
			"margin-inline": "<'margin-inline'>",
			"margin-inline-end": "<'margin-inline-end'>",
			"margin-inline-start": "<'margin-inline-start'>",
			"margin-left": "<'margin-left'>",
			"margin-right": "<'margin-right'>",
			"margin-top": "<'margin-top'>",
			"max-block-size": "<'max-block-size'>",
			"max-height": "<'max-height'>",
			"max-inline-size": "<'max-inline-size'>",
			"max-width": "<'max-width'>",
			"min-block-size": "<'min-block-size'>",
			"min-height": "<'min-height'>",
			"min-inline-size": "<'min-inline-size'>",
			"min-width": "<'min-width'>",
			right: "<'right'>",
			top: "<'top'>",
			width: "<'width'>"
		}
	},
	"@private": {
		syntax: "@private { <declaration-rule-list> }"
	},
	"@property": {
		syntax: "@property <custom-property-name># { <declaration-list> } | @property <custom-property-name> <css-type>? [: <declaration-value>? ]? ;",
		descriptors: {
			syntax: "<string>",
			inherits: "true | false",
			"initial-value": "<declaration-value>?"
		}
	},
	"@right-bottom": {
		syntax: " @right-bottom { <declaration-list> }"
	},
	"@right-middle": {
		syntax: " @right-middle { <declaration-list> }"
	},
	"@right-top": {
		syntax: " @right-top { <declaration-list> }"
	},
	"@scope": {
		syntax: "@scope <scope-boundaries>? { <block-contents> }"
	},
	"@styleset": {
		syntax: "@styleset { <declaration-list> }"
	},
	"@supports": {
		syntax: "@supports <supports-condition> { <rule-list> }"
	},
	"@supports-condition": {
		syntax: "@supports-condition <supports-condition-name> { <block-contents> }"
	},
	"@swash": {
		syntax: "@swash { <declaration-list> }"
	},
	"@top-center": {
		syntax: " @top-center { <declaration-list> }"
	},
	"@top-left": {
		syntax: " @top-left { <declaration-list> }"
	},
	"@top-left-corner": {
		syntax: " @top-left-corner { <declaration-list> }"
	},
	"@top-right": {
		syntax: " @top-right { <declaration-list> }"
	},
	"@top-right-corner": {
		syntax: " @top-right-corner { <declaration-list> }"
	},
	"@value": {
		syntax: "@value [<declaration> && [ <ident># from <ident> ]]"
	},
	"@view-transition": {
		syntax: "@view-transition { <declaration-list> }",
		descriptors: {
			navigation: "auto | none",
			types: "none | <view-transition-type>+"
		}
	},
	"@when": {
		syntax: "@when <boolean-condition> { <rule-list> }"
	}
};
var declarations = {
	"-moz-background-clip": {
		syntax: "padding | border"
	},
	"-moz-border-radius-bottomleft": {
		syntax: "<'border-bottom-left-radius'>"
	},
	"-moz-border-radius-bottomright": {
		syntax: "<'border-bottom-right-radius'>"
	},
	"-moz-border-radius-topleft": {
		syntax: "<'border-top-left-radius'>"
	},
	"-moz-border-radius-topright": {
		syntax: "<'border-bottom-right-radius'>"
	},
	"-moz-control-character-visibility": {
		syntax: "visible | hidden"
	},
	"-moz-osx-font-smoothing": {
		syntax: "auto | grayscale"
	},
	"-moz-padding-start": {
		syntax: "<'padding-top'>"
	},
	"-moz-user-select": {
		syntax: "none | text | all | -moz-none | auto"
	},
	"-ms-flex-align": {
		syntax: "start | end | center | baseline | stretch"
	},
	"-ms-flex-item-align": {
		syntax: "auto | start | end | center | baseline | stretch"
	},
	"-ms-flex-line-pack": {
		syntax: "start | end | center | justify | distribute | stretch"
	},
	"-ms-flex-negative": {
		syntax: "<'flex-shrink'>"
	},
	"-ms-flex-order": {
		syntax: "<integer>"
	},
	"-ms-flex-pack": {
		syntax: "start | end | center | justify | distribute"
	},
	"-ms-flex-positive": {
		syntax: "<'flex-grow'>"
	},
	"-ms-flex-preferred-size": {
		syntax: "<'flex-basis'>"
	},
	"-ms-grid-column-align": {
		syntax: "start | end | center | stretch"
	},
	"-ms-grid-row-align": {
		syntax: "start | end | center | stretch"
	},
	"-ms-hyphenate-limit-last": {
		syntax: "none | always | column | page | spread"
	},
	"-ms-interpolation-mode": {
		syntax: "nearest-neighbor | bicubic"
	},
	"-ms-overflow-style": {
		syntax: "auto | none | scrollbar | -ms-autohiding-scrollbar"
	},
	"-webkit-appearance": {
		syntax: "none | button | button-bevel | caps-lock-indicator | caret | checkbox | default-button | inner-spin-button | listbox | listitem | media-controls-background | media-controls-fullscreen-background | media-current-time-display | media-enter-fullscreen-button | media-exit-fullscreen-button | media-fullscreen-button | media-mute-button | media-overlay-play-button | media-play-button | media-seek-back-button | media-seek-forward-button | media-slider | media-sliderthumb | media-time-remaining-display | media-toggle-closed-captions-button | media-volume-slider | media-volume-slider-container | media-volume-sliderthumb | menulist | menulist-button | menulist-text | menulist-textfield | meter | progress-bar | progress-bar-value | push-button | radio | scrollbarbutton-down | scrollbarbutton-left | scrollbarbutton-right | scrollbarbutton-up | scrollbargripper-horizontal | scrollbargripper-vertical | scrollbarthumb-horizontal | scrollbarthumb-vertical | scrollbartrack-horizontal | scrollbartrack-vertical | searchfield | searchfield-cancel-button | searchfield-decoration | searchfield-results-button | searchfield-results-decoration | slider-horizontal | slider-vertical | sliderthumb-horizontal | sliderthumb-vertical | square-button | textarea | textfield | -apple-pay-button"
	},
	"-webkit-background-clip": {
		syntax: "[ <visual-box> | border | padding | content | text ]#"
	},
	"-webkit-column-break-after": {
		syntax: "always | auto | avoid"
	},
	"-webkit-column-break-before": {
		syntax: "always | auto | avoid"
	},
	"-webkit-column-break-inside": {
		syntax: "always | auto | avoid"
	},
	"-webkit-font-smoothing": {
		syntax: "auto | none | antialiased | subpixel-antialiased"
	},
	"-webkit-line-clamp": {
		syntax: "none | <integer [1,∞]>"
	},
	"-webkit-margin-end": {
		syntax: "<'margin-block-end'>"
	},
	"-webkit-mask-box-image": {
		syntax: "[ <url> | <gradient> | none ] [ <length-percentage>{4} <-webkit-mask-box-repeat>{2} ]?"
	},
	"-webkit-print-color-adjust": {
		syntax: "economy | exact"
	},
	"-webkit-text-fill-color": {
		syntax: "<color>"
	},
	"-webkit-text-security": {
		syntax: "none | circle | disc | square"
	},
	"-webkit-text-stroke": {
		syntax: "<line-width> || <color>"
	},
	"-webkit-text-stroke-color": {
		syntax: "<color>"
	},
	"-webkit-text-stroke-width": {
		syntax: "<line-width>"
	},
	"-webkit-user-drag": {
		syntax: "none | element | auto"
	},
	"-webkit-user-select": {
		syntax: "auto | none | text | all"
	},
	"accent-color": {
		syntax: "auto | <color>"
	},
	"align-content": {
		syntax: "normal | <baseline-position> | <content-distribution> | <overflow-position>? <content-position>"
	},
	"align-items": {
		syntax: "normal | stretch | <baseline-position> | <overflow-position>? <self-position>"
	},
	"align-self": {
		syntax: "auto | <overflow-position>? [ normal | <self-position> ]| stretch | <baseline-position>"
	},
	"alignment-baseline": {
		syntax: " auto | baseline | before-edge | text-before-edge | middle | central | after-edge | text-after-edge | ideographic | alphabetic | hanging | mathematical"
	},
	all: {
		syntax: "initial | inherit | unset | revert | revert-layer | revert-rule"
	},
	"anchor-name": {
		syntax: "none | <anchor-name>#"
	},
	"anchor-scope": {
		syntax: "none | all | <anchor-name>#"
	},
	animation: {
		syntax: "<single-animation>#"
	},
	"animation-composition": {
		syntax: "<single-animation-composition>#"
	},
	"animation-delay": {
		syntax: "[ <'animation-delay-start'> <'animation-delay-end'>? ]#"
	},
	"animation-delay-end": {
		syntax: "<time [0s,∞]>#"
	},
	"animation-delay-start": {
		syntax: "<time>#"
	},
	"animation-direction": {
		syntax: "<single-animation-direction>#"
	},
	"animation-duration": {
		syntax: "[ auto | <time [0s,∞]> ]#"
	},
	"animation-fill-mode": {
		syntax: "<single-animation-fill-mode>#"
	},
	"animation-iteration-count": {
		syntax: "<single-animation-iteration-count>#"
	},
	"animation-name": {
		syntax: "[ none | <keyframes-name> ]#"
	},
	"animation-play-state": {
		syntax: "<single-animation-play-state>#"
	},
	"animation-range": {
		syntax: "[ <'animation-range-start'> <'animation-range-end'>? ]#"
	},
	"animation-range-center": {
		syntax: "[ normal | [ <length-percentage> | <timeline-range-center-subject> <length-percentage>? ] ]#"
	},
	"animation-range-end": {
		syntax: "[ normal | <length-percentage> | <timeline-range-name> <length-percentage>? ]#"
	},
	"animation-range-start": {
		syntax: "[ normal | <length-percentage> | <timeline-range-name> <length-percentage>? ]#"
	},
	"animation-timeline": {
		syntax: "<single-animation-timeline>#"
	},
	"animation-timing-function": {
		syntax: "<easing-function>#"
	},
	"animation-trigger": {
		syntax: "[ none | [ <dashed-ident> <animation-action>+ ]+ ]#"
	},
	appearance: {
		syntax: "none | auto | base | base-select | <compat-auto> | <compat-special>"
	},
	"aspect-ratio": {
		syntax: "auto || <ratio>"
	},
	"backdrop-filter": {
		syntax: "none | <filter-value-list>"
	},
	"backface-visibility": {
		syntax: "visible | hidden"
	},
	background: {
		syntax: "[<'background-color'> || <'background-image'> || <'background-repeat'> || <'background-attachment'> || <'background-position'>] | inherit"
	},
	"background-attachment": {
		syntax: "scroll | fixed | inherit"
	},
	"background-blend-mode": {
		syntax: "<'mix-blend-mode'>#"
	},
	"background-clip": {
		syntax: "<bg-clip>#"
	},
	"background-color": {
		syntax: "<color> | transparent | inherit"
	},
	"background-image": {
		syntax: "<uri> | none | inherit"
	},
	"background-origin": {
		syntax: "<visual-box>#"
	},
	"background-position": {
		syntax: "[ [ <percentage> | <length> | left | center | right ] [ <percentage> | <length> | top | center | bottom ]? ] | [ [ left | center | right ] || [ top | center | bottom ] ] | inherit"
	},
	"background-position-block": {
		syntax: "[ center | [ [ start | end ]? <length-percentage>? ]! ]#"
	},
	"background-position-inline": {
		syntax: "[ center | [ [ start | end ]? <length-percentage>? ]! ]#"
	},
	"background-position-x": {
		syntax: "[ center | [ [ left | right | x-start | x-end ]? <length-percentage>? ]! ]#"
	},
	"background-position-y": {
		syntax: "[ center | [ [ top | bottom | y-start | y-end ]? <length-percentage>? ]! ]#"
	},
	"background-repeat": {
		syntax: "repeat | repeat-x | repeat-y | no-repeat | inherit"
	},
	"background-repeat-block": {
		syntax: "<repetition>#"
	},
	"background-repeat-inline": {
		syntax: "<repetition>#"
	},
	"background-repeat-x": {
		syntax: "<repetition>#"
	},
	"background-repeat-y": {
		syntax: "<repetition>#"
	},
	"background-size": {
		syntax: "<bg-size>#"
	},
	"background-tbd": {
		syntax: "<bg-layer>#"
	},
	"baseline-shift": {
		syntax: " baseline | sub | super | <svg-length>"
	},
	"baseline-source": {
		syntax: "auto | first | last"
	},
	behavior: {
		syntax: "<url>+"
	},
	"block-ellipsis": {
		syntax: "no-ellipsis | ellipsis | <string>"
	},
	"block-size": {
		syntax: "auto | <box-size>"
	},
	"block-step": {
		syntax: "<'block-step-size'> || <'block-step-insert'> || <'block-step-align'> || <'block-step-round'>"
	},
	"block-step-align": {
		syntax: "auto | center | start | end"
	},
	"block-step-insert": {
		syntax: "margin-box | padding-box | content-box"
	},
	"block-step-round": {
		syntax: "up | down | nearest"
	},
	"block-step-size": {
		syntax: "none | <length [0,∞]>"
	},
	"bookmark-label": {
		syntax: "<content-list>"
	},
	"bookmark-level": {
		syntax: "none | <integer [1,∞]>"
	},
	"bookmark-state": {
		syntax: "open | closed"
	},
	border: {
		syntax: "[ <border-width> || <border-style> || <'border-top-color'> ] | inherit"
	},
	"border-block": {
		syntax: "<'border-block-start'>"
	},
	"border-block-clip": {
		syntax: "<'border-top-clip'>"
	},
	"border-block-color": {
		syntax: "<'border-top-color'>{1,2}"
	},
	"border-block-end": {
		syntax: "<'border-top-width'> || <'border-top-style'> || <color>"
	},
	"border-block-end-clip": {
		syntax: "none | [ <length-percentage [0,∞]> | <flex> ]+"
	},
	"border-block-end-color": {
		syntax: "<'border-top-color'>"
	},
	"border-block-end-radius": {
		syntax: "<length-percentage [0,∞]>{1,2} [ / <length-percentage [0,∞]>{1,2} ]?"
	},
	"border-block-end-style": {
		syntax: "<'border-top-style'>"
	},
	"border-block-end-width": {
		syntax: "<'border-top-width'>"
	},
	"border-block-start": {
		syntax: "<'border-top-width'> || <'border-top-style'> || <color>"
	},
	"border-block-start-clip": {
		syntax: "none | [ <length-percentage [0,∞]> | <flex> ]+"
	},
	"border-block-start-color": {
		syntax: "<'border-top-color'>"
	},
	"border-block-start-radius": {
		syntax: "<length-percentage [0,∞]>{1,2} [ / <length-percentage [0,∞]>{1,2} ]?"
	},
	"border-block-start-style": {
		syntax: "<'border-top-style'>"
	},
	"border-block-start-width": {
		syntax: "<'border-top-width'>"
	},
	"border-block-style": {
		syntax: "<'border-top-style'>{1,2}"
	},
	"border-block-width": {
		syntax: "<'border-top-width'>{1,2}"
	},
	"border-bottom": {
		syntax: "[ <border-width> || <border-style> || <'border-top-color'> ] | inherit"
	},
	"border-bottom-clip": {
		syntax: "none | [ <length-percentage [0,∞]> | <flex> ]+"
	},
	"border-bottom-color": {
		syntax: "<color> | transparent | inherit"
	},
	"border-bottom-left-radius": {
		syntax: "<border-radius>"
	},
	"border-bottom-radius": {
		syntax: "<length-percentage [0,∞]>{1,2} [ / <length-percentage [0,∞]>{1,2} ]?"
	},
	"border-bottom-right-radius": {
		syntax: "<border-radius>"
	},
	"border-bottom-style": {
		syntax: "<border-style> | inherit"
	},
	"border-bottom-width": {
		syntax: "<border-width> | inherit"
	},
	"border-boundary": {
		syntax: "none | parent | display"
	},
	"border-clip": {
		syntax: "<'border-top-clip'>"
	},
	"border-collapse": {
		syntax: "collapse | separate | inherit"
	},
	"border-color": {
		syntax: "[ <color> | transparent ]{1,4} | inherit"
	},
	"border-end-end-radius": {
		syntax: "<'border-top-left-radius'>"
	},
	"border-end-start-radius": {
		syntax: "<'border-top-left-radius'>"
	},
	"border-image": {
		syntax: "<'border-image-source'> || <'border-image-slice'> [ / <'border-image-width'> | / <'border-image-width'>? / <'border-image-outset'> ]? || <'border-image-repeat'>"
	},
	"border-image-outset": {
		syntax: "[ <length [0,∞]> | <number [0,∞]> ]{1,4}"
	},
	"border-image-repeat": {
		syntax: "[ stretch | repeat | round | space ]{1,2}"
	},
	"border-image-slice": {
		syntax: "[<number [0,∞]> | <percentage [0,∞]>]{1,4} && fill?"
	},
	"border-image-source": {
		syntax: "none | <image>"
	},
	"border-image-width": {
		syntax: "[ <length-percentage [0,∞]> | <number [0,∞]> | auto ]{1,4}"
	},
	"border-inline": {
		syntax: "<'border-block-start'>"
	},
	"border-inline-clip": {
		syntax: "<'border-top-clip'>"
	},
	"border-inline-color": {
		syntax: "<'border-top-color'>{1,2}"
	},
	"border-inline-end": {
		syntax: "<'border-top-width'> || <'border-top-style'> || <color>"
	},
	"border-inline-end-clip": {
		syntax: "none | [ <length-percentage [0,∞]> | <flex> ]+"
	},
	"border-inline-end-color": {
		syntax: "<'border-top-color'>"
	},
	"border-inline-end-radius": {
		syntax: "<length-percentage [0,∞]>{1,2} [ / <length-percentage [0,∞]>{1,2} ]?"
	},
	"border-inline-end-style": {
		syntax: "<'border-top-style'>"
	},
	"border-inline-end-width": {
		syntax: "<'border-top-width'>"
	},
	"border-inline-start": {
		syntax: "<'border-top-width'> || <'border-top-style'> || <color>"
	},
	"border-inline-start-clip": {
		syntax: "none | [ <length-percentage [0,∞]> | <flex> ]+"
	},
	"border-inline-start-color": {
		syntax: "<'border-top-color'>"
	},
	"border-inline-start-radius": {
		syntax: "<length-percentage [0,∞]>{1,2} [ / <length-percentage [0,∞]>{1,2} ]?"
	},
	"border-inline-start-style": {
		syntax: "<'border-top-style'>"
	},
	"border-inline-start-width": {
		syntax: "<'border-top-width'>"
	},
	"border-inline-style": {
		syntax: "<'border-top-style'>{1,2}"
	},
	"border-inline-width": {
		syntax: "<'border-top-width'>{1,2}"
	},
	"border-left": {
		syntax: "[ <border-width> || <border-style> || <'border-top-color'> ] | inherit"
	},
	"border-left-clip": {
		syntax: "none | [ <length-percentage [0,∞]> | <flex> ]+"
	},
	"border-left-color": {
		syntax: "<color> | transparent | inherit"
	},
	"border-left-radius": {
		syntax: "<length-percentage [0,∞]>{1,2} [ / <length-percentage [0,∞]>{1,2} ]?"
	},
	"border-left-style": {
		syntax: "<border-style> | inherit"
	},
	"border-left-width": {
		syntax: "<border-width> | inherit"
	},
	"border-limit": {
		syntax: "all | [ sides | corners ] <length-percentage [0,∞]>? | [ top | right | bottom | left ] <length-percentage [0,∞]>"
	},
	"border-radius": {
		syntax: "<length-percentage [0,∞]>{1,4} [ / <length-percentage [0,∞]>{1,4} ]?"
	},
	"border-right": {
		syntax: "[ <border-width> || <border-style> || <'border-top-color'> ] | inherit"
	},
	"border-right-clip": {
		syntax: "none | [ <length-percentage [0,∞]> | <flex> ]+"
	},
	"border-right-color": {
		syntax: "<color> | transparent | inherit"
	},
	"border-right-radius": {
		syntax: "<length-percentage [0,∞]>{1,2} [ / <length-percentage [0,∞]>{1,2} ]?"
	},
	"border-right-style": {
		syntax: "<border-style> | inherit"
	},
	"border-right-width": {
		syntax: "<border-width> | inherit"
	},
	"border-shape": {
		syntax: "none | [ <basic-shape> <geometry-box>?]{1,2}"
	},
	"border-spacing": {
		syntax: "<length> <length>? | inherit"
	},
	"border-start-end-radius": {
		syntax: "<'border-top-left-radius'>"
	},
	"border-start-start-radius": {
		syntax: "<'border-top-left-radius'>"
	},
	"border-style": {
		syntax: "<border-style>{1,4} | inherit"
	},
	"border-top": {
		syntax: "[ <border-width> || <border-style> || <'border-top-color'> ] | inherit"
	},
	"border-top-clip": {
		syntax: "none | [ <length-percentage [0,∞]> | <flex> ]+"
	},
	"border-top-color": {
		syntax: "<color> | transparent | inherit"
	},
	"border-top-left-radius": {
		syntax: "<border-radius>"
	},
	"border-top-radius": {
		syntax: "<length-percentage [0,∞]>{1,2} [ / <length-percentage [0,∞]>{1,2} ]?"
	},
	"border-top-right-radius": {
		syntax: "<border-radius>"
	},
	"border-top-style": {
		syntax: "<border-style> | inherit"
	},
	"border-top-width": {
		syntax: "<border-width> | inherit"
	},
	"border-width": {
		syntax: "<border-width>{1,4} | inherit"
	},
	bottom: {
		syntax: "<length> | <percentage> | auto | inherit"
	},
	"box-decoration-break": {
		syntax: "slice | clone"
	},
	"box-shadow": {
		syntax: "<spread-shadow>#"
	},
	"box-shadow-blur": {
		syntax: "<length [0,∞]>#"
	},
	"box-shadow-color": {
		syntax: "<color>#"
	},
	"box-shadow-offset": {
		syntax: "[ none | <length>{1,2} ]#"
	},
	"box-shadow-position": {
		syntax: "[ outset | inset ]#"
	},
	"box-shadow-spread": {
		syntax: "<length>#"
	},
	"box-sizing": {
		syntax: "content-box | border-box"
	},
	"box-snap": {
		syntax: "none | block-start | block-end | center | baseline | last-baseline"
	},
	"break-after": {
		syntax: "auto | avoid | always | all | avoid-page | page | left | right | recto | verso | avoid-column | column | avoid-region | region"
	},
	"break-before": {
		syntax: "auto | avoid | always | all | avoid-page | page | left | right | recto | verso | avoid-column | column | avoid-region | region"
	},
	"break-inside": {
		syntax: "auto | avoid | avoid-page | avoid-column | avoid-region"
	},
	"caption-side": {
		syntax: "top | bottom | inherit"
	},
	caret: {
		syntax: "<'caret-color'> || <'caret-animation'> || <'caret-shape'>"
	},
	"caret-animation": {
		syntax: "auto | manual"
	},
	"caret-color": {
		syntax: "auto | <color> [auto | <color>]?"
	},
	"caret-shape": {
		syntax: "auto | bar | block | underscore"
	},
	clear: {
		syntax: "none | left | right | both | inherit"
	},
	clip: {
		syntax: "<shape> | auto | inherit"
	},
	"clip-path": {
		syntax: "<clip-source> | [ <basic-shape> || <geometry-box> ] | none"
	},
	"clip-rule": {
		syntax: "nonzero | evenodd"
	},
	color: {
		syntax: "<color> | inherit"
	},
	"color-adjust": {
		syntax: "<'print-color-adjust'>"
	},
	"color-interpolation": {
		syntax: "auto | sRGB | linearRGB"
	},
	"color-interpolation-filters": {
		syntax: "auto | sRGB | linearRGB"
	},
	"color-scheme": {
		syntax: "normal | [ light | dark | <custom-ident> ]+ && only?"
	},
	"column-count": {
		syntax: "auto | <integer [1,∞]>"
	},
	"column-fill": {
		syntax: "auto | balance | balance-all"
	},
	"column-gap": {
		syntax: "normal | <length-percentage [0,∞]> | <line-width>"
	},
	"column-height": {
		syntax: "auto | <length [0,∞]>"
	},
	"column-rule": {
		syntax: "<gap-rule-list> | <gap-auto-rule-list>"
	},
	"column-rule-break": {
		syntax: "none | normal | intersection"
	},
	"column-rule-color": {
		syntax: "<line-color-list> | <auto-line-color-list>"
	},
	"column-rule-inset": {
		syntax: "<'column-rule-inset-cap'> [ / <'column-rule-inset-junction'> ]?"
	},
	"column-rule-inset-cap": {
		syntax: "<inset-value> <inset-value>?"
	},
	"column-rule-inset-cap-end": {
		syntax: "<inset-value>"
	},
	"column-rule-inset-cap-start": {
		syntax: "<inset-value>"
	},
	"column-rule-inset-end": {
		syntax: "<inset-value>"
	},
	"column-rule-inset-junction": {
		syntax: "<inset-value> <inset-value>?"
	},
	"column-rule-inset-junction-end": {
		syntax: "<inset-value>"
	},
	"column-rule-inset-junction-start": {
		syntax: "<inset-value>"
	},
	"column-rule-inset-start": {
		syntax: "<inset-value>"
	},
	"column-rule-style": {
		syntax: "<line-style-list> | <auto-line-style-list>"
	},
	"column-rule-visibility-items": {
		syntax: "all | around | between | normal"
	},
	"column-rule-width": {
		syntax: "<line-width-list> | <auto-line-width-list>"
	},
	"column-span": {
		syntax: "none | <integer [1,∞]> | all | auto"
	},
	"column-width": {
		syntax: "auto | <box-size>"
	},
	"column-wrap": {
		syntax: "auto | nowrap | wrap"
	},
	columns: {
		syntax: "[ <'column-width'> || <'column-count'> ] [ / <'column-height'> ]?"
	},
	composes: {
		syntax: "<composes-selector>#"
	},
	contain: {
		syntax: "none | strict | content | [ [size | inline-size] || layout || style || paint ]"
	},
	"contain-intrinsic-block-size": {
		syntax: "auto? [ none | <length [0,∞]> ]"
	},
	"contain-intrinsic-height": {
		syntax: "auto? [ none | <length [0,∞]> ]"
	},
	"contain-intrinsic-inline-size": {
		syntax: "auto? [ none | <length [0,∞]> ]"
	},
	"contain-intrinsic-size": {
		syntax: "[ auto? [ none | <length [0,∞]> ] ]{1,2}"
	},
	"contain-intrinsic-width": {
		syntax: "auto? [ none | <length [0,∞]> ]"
	},
	container: {
		syntax: "<'container-name'> [ / <'container-type'> ]?"
	},
	"container-name": {
		syntax: "none | <custom-ident>+"
	},
	"container-type": {
		syntax: "normal | [ [ size | inline-size ] || scroll-state ]"
	},
	content: {
		syntax: "normal | none | [ <string> | <uri> | <counter> | attr(<identifier>) | open-quote | close-quote | no-open-quote | no-close-quote ]+ | inherit"
	},
	"content-visibility": {
		syntax: "visible | auto | hidden"
	},
	"continue": {
		syntax: "normal | discard | collapse | -webkit-legacy"
	},
	"copy-into": {
		syntax: "none | [ [ <custom-ident> <content-level>] [, <custom-ident> <content-level>]* ]?"
	},
	corner: {
		syntax: "<'corner-shape'> || <'border-radius'>"
	},
	"corner-block-end": {
		syntax: "<'corner-top-shape'> || <'border-top-radius'>"
	},
	"corner-block-end-shape": {
		syntax: "<'corner-top-left-shape'>{1,2}"
	},
	"corner-block-start": {
		syntax: "<'corner-top-shape'> || <'border-top-radius'>"
	},
	"corner-block-start-shape": {
		syntax: "<'corner-top-left-shape'>{1,2}"
	},
	"corner-bottom": {
		syntax: "<'corner-top-shape'> || <'border-top-radius'>"
	},
	"corner-bottom-left": {
		syntax: "<'corner-top-left-shape'> || <'border-top-left-radius'>"
	},
	"corner-bottom-left-shape": {
		syntax: "<corner-shape-value>"
	},
	"corner-bottom-right": {
		syntax: "<'corner-top-left-shape'> || <'border-top-left-radius'>"
	},
	"corner-bottom-right-shape": {
		syntax: "<corner-shape-value>"
	},
	"corner-bottom-shape": {
		syntax: "<'corner-top-left-shape'>{1,2}"
	},
	"corner-end-end": {
		syntax: "<'corner-top-left-shape'> || <'border-top-left-radius'>"
	},
	"corner-end-end-shape": {
		syntax: "<corner-shape-value>"
	},
	"corner-end-start": {
		syntax: "<'corner-top-left-shape'> || <'border-top-left-radius'>"
	},
	"corner-end-start-shape": {
		syntax: "<corner-shape-value>"
	},
	"corner-inline-end": {
		syntax: "<'corner-top-shape'> || <'border-top-radius'>"
	},
	"corner-inline-end-shape": {
		syntax: "<'corner-top-left-shape'>{1,2}"
	},
	"corner-inline-start": {
		syntax: "<'corner-top-shape'> || <'border-top-radius'>"
	},
	"corner-inline-start-shape": {
		syntax: "<'corner-top-left-shape'>{1,2}"
	},
	"corner-left": {
		syntax: "<'corner-top-shape'> || <'border-top-radius'>"
	},
	"corner-left-shape": {
		syntax: "<'corner-top-left-shape'>{1,2}"
	},
	"corner-right": {
		syntax: "<'corner-top-shape'> || <'border-top-radius'>"
	},
	"corner-right-shape": {
		syntax: "<'corner-top-left-shape'>{1,2}"
	},
	"corner-shape": {
		syntax: "<'corner-top-left-shape'>{1,4}"
	},
	"corner-start-end": {
		syntax: "<'corner-top-left-shape'> || <'border-top-left-radius'>"
	},
	"corner-start-end-shape": {
		syntax: "<corner-shape-value>"
	},
	"corner-start-start": {
		syntax: "<'corner-top-left-shape'> || <'border-top-left-radius'>"
	},
	"corner-start-start-shape": {
		syntax: "<corner-shape-value>"
	},
	"corner-top": {
		syntax: "<'corner-top-shape'> || <'border-top-radius'>"
	},
	"corner-top-left": {
		syntax: "<'corner-top-left-shape'> || <'border-top-left-radius'>"
	},
	"corner-top-left-shape": {
		syntax: "<corner-shape-value>"
	},
	"corner-top-right": {
		syntax: "<'corner-top-left-shape'> || <'border-top-left-radius'>"
	},
	"corner-top-right-shape": {
		syntax: "<corner-shape-value>"
	},
	"corner-top-shape": {
		syntax: "<'corner-top-left-shape'>{1,2}"
	},
	"counter-increment": {
		syntax: "[ <identifier> <integer>? ]+ | none | inherit"
	},
	"counter-reset": {
		syntax: "[ <identifier> <integer>? ]+ | none | inherit"
	},
	"counter-set": {
		syntax: "[ <counter-name> <integer>? ]+ | none"
	},
	cue: {
		syntax: " <'cue-before'> <'cue-after'>?"
	},
	"cue-after": {
		syntax: " <url> <decibel>? | none"
	},
	"cue-before": {
		syntax: " <url> <decibel>? | none"
	},
	cursor: {
		syntax: " [ [ <url> [ <x> <y> ]? , ]* [ auto | default | none | context-menu | help | pointer | progress | wait | cell | crosshair | text | vertical-text | alias | copy | move | no-drop | not-allowed | e-resize | n-resize | ne-resize | nw-resize | s-resize | se-resize | sw-resize | w-resize | ew-resize | ns-resize | nesw-resize | nwse-resize | col-resize | row-resize | all-scroll | zoom-in | zoom-out | grab | grabbing | hand | -webkit-grab | -webkit-grabbing | -webkit-zoom-in | -webkit-zoom-out | -moz-grab | -moz-grabbing | -moz-zoom-in | -moz-zoom-out ] ]"
	},
	cx: {
		syntax: "<length-percentage>"
	},
	cy: {
		syntax: "<length-percentage>"
	},
	d: {
		syntax: "none | <string>"
	},
	direction: {
		syntax: "ltr | rtl | inherit"
	},
	display: {
		syntax: "inline | block | list-item | inline-block | table | inline-table | table-row-group | table-header-group | table-footer-group | table-row | table-column-group | table-column | table-cell | table-caption | none | inherit | <-non-standard-display>"
	},
	"dominant-baseline": {
		syntax: " auto | use-script | no-change | reset-size | ideographic | alphabetic | hanging | mathematical | central | middle | text-after-edge | text-before-edge"
	},
	"dynamic-range-limit": {
		syntax: "standard | no-limit | constrained | <dynamic-range-limit-mix()>"
	},
	"empty-cells": {
		syntax: "show | hide | inherit"
	},
	"event-trigger": {
		syntax: "none | [ <'event-trigger-name'> <'event-trigger-source'> ]#"
	},
	"event-trigger-name": {
		syntax: "none | <dashed-ident>#"
	},
	"event-trigger-source": {
		syntax: "[ none | <event-function>+ [ / <event-function>+ ]? ]#"
	},
	"field-sizing": {
		syntax: "fixed | content"
	},
	fill: {
		syntax: "<paint>"
	},
	"fill-break": {
		syntax: "bounding-box | slice | clone"
	},
	"fill-color": {
		syntax: "<color>"
	},
	"fill-image": {
		syntax: "<paint>#"
	},
	"fill-opacity": {
		syntax: " <number-zero-one> | <percentage>"
	},
	"fill-origin": {
		syntax: "match-parent | fill-box | stroke-box | content-box | padding-box | border-box"
	},
	"fill-position": {
		syntax: "<position>#"
	},
	"fill-repeat": {
		syntax: "<repeat-style>#"
	},
	"fill-rule": {
		syntax: "nonzero | evenodd"
	},
	"fill-size": {
		syntax: "<bg-size>#"
	},
	filter: {
		syntax: "none | <filter-value-list> | <-ms-filter-function-list>"
	},
	"fit-tolerance": {
		syntax: "normal | <length-percentage [0,∞]> | infinite"
	},
	flex: {
		syntax: "none | [ <'flex-grow'> <'flex-shrink'>? || <'flex-basis'> ]"
	},
	"flex-basis": {
		syntax: "content | <'width'>"
	},
	"flex-direction": {
		syntax: "row | row-reverse | column | column-reverse"
	},
	"flex-flow": {
		syntax: "<'flex-direction'> || <'flex-wrap'>"
	},
	"flex-grow": {
		syntax: "<number [0,∞]>"
	},
	"flex-line-count": {
		syntax: "<integer [1,∞]>"
	},
	"flex-shrink": {
		syntax: "<number [0,∞]>"
	},
	"flex-wrap": {
		syntax: "nowrap | [ wrap | wrap-reverse ] || balance"
	},
	float: {
		syntax: "left | right | none | inherit"
	},
	"float-defer": {
		syntax: "<integer> | last | none"
	},
	"float-offset": {
		syntax: "<length-percentage>"
	},
	"float-reference": {
		syntax: "inline | column | region | page"
	},
	"flood-color": {
		syntax: "<color>"
	},
	"flood-opacity": {
		syntax: "<'opacity'>"
	},
	"flow-from": {
		syntax: "<custom-ident> | none"
	},
	"flow-into": {
		syntax: "none | <custom-ident> [element | content]?"
	},
	font: {
		syntax: " [ [ <'font-style'> || <font-variant-css2> || <'font-weight'> || <font-width-css3> ]? <'font-size'> [ / <'line-height'> ]? <'font-family'># ] | <system-family-name> | <-non-standard-font> | [ <'font-size'> [ / <'line-height'> ]? <'font-family'># ]"
	},
	"font-family": {
		syntax: "[ [ <family-name> | <generic-family> ] [, <family-name> | <generic-family>]* ] | inherit"
	},
	"font-feature-settings": {
		syntax: "normal | <feature-tag-value>#"
	},
	"font-kerning": {
		syntax: "auto | normal | none"
	},
	"font-language-override": {
		syntax: "normal | <string>"
	},
	"font-optical-sizing": {
		syntax: "auto | none"
	},
	"font-palette": {
		syntax: "normal | light | dark | <palette-identifier> | <palette-mix()>"
	},
	"font-size": {
		syntax: "<absolute-size> | <relative-size> | <length> | <percentage> | inherit"
	},
	"font-size-adjust": {
		syntax: "none | [ ex-height | cap-height | ch-width | ic-width | ic-height ]? [ from-font | <number [0,∞]> ]"
	},
	"font-style": {
		syntax: "normal | italic | oblique | inherit"
	},
	"font-synthesis": {
		syntax: "none | [ weight || style || small-caps || position]"
	},
	"font-synthesis-position": {
		syntax: "auto | none"
	},
	"font-synthesis-small-caps": {
		syntax: "auto | none"
	},
	"font-synthesis-style": {
		syntax: "auto | none | oblique-only"
	},
	"font-synthesis-weight": {
		syntax: "auto | none"
	},
	"font-variant": {
		syntax: "normal | small-caps | inherit"
	},
	"font-variant-alternates": {
		syntax: "normal | [ stylistic(<font-feature-value-name>) || historical-forms || styleset(<font-feature-value-name>#) || character-variant(<font-feature-value-name>#) || swash(<font-feature-value-name>) || ornaments(<font-feature-value-name>) || annotation(<font-feature-value-name>) ]"
	},
	"font-variant-caps": {
		syntax: "normal | small-caps | all-small-caps | petite-caps | all-petite-caps | unicase | titling-caps"
	},
	"font-variant-east-asian": {
		syntax: "normal | [ <east-asian-variant-values> || <east-asian-width-values> || ruby ]"
	},
	"font-variant-emoji": {
		syntax: "normal | text | emoji | unicode"
	},
	"font-variant-ligatures": {
		syntax: "normal | none | [ <common-lig-values> || <discretionary-lig-values> || <historical-lig-values> || <contextual-alt-values> ]"
	},
	"font-variant-numeric": {
		syntax: "normal | [ <numeric-figure-values> || <numeric-spacing-values> || <numeric-fraction-values> || ordinal || slashed-zero ]"
	},
	"font-variant-position": {
		syntax: "normal | sub | super"
	},
	"font-variation-settings": {
		syntax: "normal | [ <opentype-tag> <number> ]#"
	},
	"font-weight": {
		syntax: "normal | bold | bolder | lighter | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | inherit"
	},
	"font-width": {
		syntax: "normal | <percentage [0,∞]> | ultra-condensed | extra-condensed | condensed | semi-condensed | semi-expanded | expanded | extra-expanded | ultra-expanded"
	},
	"footnote-display": {
		syntax: "block | inline | compact"
	},
	"footnote-policy": {
		syntax: "auto | line | block"
	},
	"forced-color-adjust": {
		syntax: "auto | none | preserve-parent-color"
	},
	"frame-sizing": {
		syntax: "auto | content-width | content-height | content-block-size | content-inline-size"
	},
	gap: {
		syntax: "<'row-gap'> <'column-gap'>?"
	},
	"glyph-orientation-horizontal": {
		syntax: "<angle>"
	},
	"glyph-orientation-vertical": {
		syntax: " <angle>"
	},
	grid: {
		syntax: "<'grid-template'> | <'grid-template-rows'> / [ auto-flow && dense? ] <'grid-auto-columns'>? | [ auto-flow && dense? ] <'grid-auto-rows'>? / <'grid-template-columns'>"
	},
	"grid-area": {
		syntax: "<grid-line> [ / <grid-line> ]{0,3}"
	},
	"grid-auto-columns": {
		syntax: "<track-size>+"
	},
	"grid-auto-flow": {
		syntax: "[ row | column ] || dense"
	},
	"grid-auto-rows": {
		syntax: "<track-size>+"
	},
	"grid-column": {
		syntax: "<grid-line> [ / <grid-line> ]?"
	},
	"grid-column-end": {
		syntax: "<grid-line>"
	},
	"grid-column-start": {
		syntax: "<grid-line>"
	},
	"grid-row": {
		syntax: "<grid-line> [ / <grid-line> ]?"
	},
	"grid-row-end": {
		syntax: "<grid-line>"
	},
	"grid-row-start": {
		syntax: "<grid-line>"
	},
	"grid-template": {
		syntax: "none | [ <'grid-template-rows'> / <'grid-template-columns'> ] | [ <line-names>? <string> <track-size>? <line-names>? ]+ [ / <explicit-track-list> ]?"
	},
	"grid-template-areas": {
		syntax: "none | <string>+"
	},
	"grid-template-columns": {
		syntax: "none | <track-list> | <auto-track-list> | subgrid <line-name-list>?"
	},
	"grid-template-rows": {
		syntax: "none | <track-list> | <auto-track-list> | subgrid <line-name-list>?"
	},
	"hanging-punctuation": {
		syntax: "none | [ first || [ force-end | allow-end ] || last ]"
	},
	height: {
		syntax: "<length> | <percentage> | auto | inherit | stretch | <-non-standard-size>"
	},
	"hyphenate-character": {
		syntax: "auto | <string>"
	},
	"hyphenate-limit-chars": {
		syntax: "[ auto | <integer [0,∞]> ]{1,3}"
	},
	"hyphenate-limit-last": {
		syntax: "none | always | column | page | spread"
	},
	"hyphenate-limit-lines": {
		syntax: "no-limit | <integer [0,∞]>"
	},
	"hyphenate-limit-zone": {
		syntax: "<length-percentage>"
	},
	hyphens: {
		syntax: "none | manual | auto"
	},
	"image-animation": {
		syntax: "normal | paused | stopped | running"
	},
	"image-orientation": {
		syntax: "from-image | none | [ <angle> || flip ]"
	},
	"image-rendering": {
		syntax: "auto | optimizeQuality | optimizeSpeed | optimizeSpeed | optimizeQuality | <-non-standard-image-rendering>"
	},
	"image-resolution": {
		syntax: "[ from-image || <resolution> ] && snap?"
	},
	"initial-letter": {
		syntax: "normal | <number [1,∞]> <integer [1,∞]> | <number [1,∞]> && [ drop | raise ]?"
	},
	"initial-letter-align": {
		syntax: "[ border-box? [ alphabetic | ideographic | hanging | leading ]? ]!"
	},
	"initial-letter-wrap": {
		syntax: "none | first | all | grid | <length-percentage>"
	},
	"inline-size": {
		syntax: "auto | <length-percentage>"
	},
	"inline-sizing": {
		syntax: "normal | stretch"
	},
	"input-security": {
		syntax: "auto | none"
	},
	inset: {
		syntax: "<'top'>{1,4}"
	},
	"inset-block": {
		syntax: "<'top'>{1,2}"
	},
	"inset-block-end": {
		syntax: "auto | <length-percentage>"
	},
	"inset-block-start": {
		syntax: "auto | <length-percentage>"
	},
	"inset-inline": {
		syntax: "<'top'>{1,2}"
	},
	"inset-inline-end": {
		syntax: "auto | <length-percentage>"
	},
	"inset-inline-start": {
		syntax: "auto | <length-percentage>"
	},
	interactivity: {
		syntax: "auto | inert"
	},
	"interest-delay": {
		syntax: "<'interest-delay-start'>{1,2}"
	},
	"interest-delay-end": {
		syntax: "normal | <time>"
	},
	"interest-delay-start": {
		syntax: "normal | <time>"
	},
	"interpolate-size": {
		syntax: "numeric-only | allow-keywords"
	},
	isolation: {
		syntax: "<isolation-mode>"
	},
	"justify-content": {
		syntax: "normal | <content-distribution> | <overflow-position>? [ <content-position> | left | right ]"
	},
	"justify-items": {
		syntax: "normal | stretch | <baseline-position> | <overflow-position>? [ <self-position> | left | right ] | legacy | legacy && [ left | right | center ]"
	},
	"justify-self": {
		syntax: "auto | <overflow-position>? [ normal | <self-position> | left | right ] | stretch | <baseline-position>"
	},
	kerning: {
		syntax: "auto | <svg-length>"
	},
	left: {
		syntax: "<length> | <percentage> | auto | inherit"
	},
	"letter-spacing": {
		syntax: " normal | <length-percentage>"
	},
	"lighting-color": {
		syntax: "<color>"
	},
	"line-break": {
		syntax: "auto | loose | normal | strict | anywhere"
	},
	"line-clamp": {
		syntax: "none | [<'max-lines'> || <'block-ellipsis'>] -webkit-legacy?"
	},
	"line-fit-edge": {
		syntax: "leading | <text-edge>"
	},
	"line-grid": {
		syntax: "match-parent | create"
	},
	"line-height": {
		syntax: "normal | <number> | <length> | <percentage> | inherit"
	},
	"line-height-step": {
		syntax: "<length [0,∞]>"
	},
	"line-padding": {
		syntax: "<length>"
	},
	"line-snap": {
		syntax: "none | baseline | contain"
	},
	"link-parameters": {
		syntax: "none | <param()>#"
	},
	"list-style": {
		syntax: "[ <'list-style-type'> || <'list-style-position'> || <'list-style-image'> ] | inherit"
	},
	"list-style-image": {
		syntax: "<uri> | none | inherit"
	},
	"list-style-position": {
		syntax: "inside | outside | inherit"
	},
	"list-style-type": {
		syntax: "disc | circle | square | decimal | decimal-leading-zero | lower-roman | upper-roman | lower-greek | lower-latin | upper-latin | armenian | georgian | lower-alpha | upper-alpha | none | inherit"
	},
	margin: {
		syntax: "<margin-width>{1,4} | inherit"
	},
	"margin-block": {
		syntax: "<'margin-top'>{1,2}"
	},
	"margin-block-end": {
		syntax: "<'margin-top'>"
	},
	"margin-block-start": {
		syntax: "<'margin-top'>"
	},
	"margin-bottom": {
		syntax: "<margin-width> | inherit"
	},
	"margin-break": {
		syntax: "auto | keep | discard"
	},
	"margin-inline": {
		syntax: "<'margin-top'>{1,2}"
	},
	"margin-inline-end": {
		syntax: "<'margin-top'>"
	},
	"margin-inline-start": {
		syntax: "<'margin-top'>"
	},
	"margin-left": {
		syntax: "<margin-width> | inherit"
	},
	"margin-right": {
		syntax: "<margin-width> | inherit"
	},
	"margin-top": {
		syntax: "<margin-width> | inherit"
	},
	"margin-trim": {
		syntax: "none | block | [ block-start || block-end ]"
	},
	marker: {
		syntax: "none | <marker-ref>"
	},
	"marker-end": {
		syntax: "none | <marker-ref>"
	},
	"marker-mid": {
		syntax: "none | <marker-ref>"
	},
	"marker-side": {
		syntax: "match-self | match-parent"
	},
	"marker-start": {
		syntax: "none | <marker-ref>"
	},
	mask: {
		syntax: "<mask-layer>#"
	},
	"mask-border": {
		syntax: "<'mask-border-source'> || <'mask-border-slice'> [ / <'mask-border-width'>? [ / <'mask-border-outset'> ]? ]? || <'mask-border-repeat'> || <'mask-border-mode'>"
	},
	"mask-border-mode": {
		syntax: "luminance | alpha"
	},
	"mask-border-outset": {
		syntax: "<'border-image-outset'>"
	},
	"mask-border-repeat": {
		syntax: "<'border-image-repeat'>"
	},
	"mask-border-slice": {
		syntax: "<'border-image-slice'>"
	},
	"mask-border-source": {
		syntax: "<'border-image-source'>"
	},
	"mask-border-width": {
		syntax: "<'border-image-width'>"
	},
	"mask-clip": {
		syntax: "[ <coord-box> | no-clip ]#"
	},
	"mask-composite": {
		syntax: "<compositing-operator>#"
	},
	"mask-image": {
		syntax: "<mask-reference>#"
	},
	"mask-mode": {
		syntax: "<masking-mode>#"
	},
	"mask-origin": {
		syntax: "<coord-box>#"
	},
	"mask-position": {
		syntax: "<position>#"
	},
	"mask-repeat": {
		syntax: "<repeat-style>#"
	},
	"mask-size": {
		syntax: "<bg-size>#"
	},
	"mask-type": {
		syntax: "luminance | alpha"
	},
	"math-depth": {
		syntax: "auto-add | add(<integer>) | <integer>"
	},
	"math-shift": {
		syntax: "normal | compact"
	},
	"math-style": {
		syntax: "normal | compact"
	},
	"max-block-size": {
		syntax: "none | <box-size>"
	},
	"max-height": {
		syntax: "<length> | <percentage> | none | inherit | stretch | <-non-standard-size>"
	},
	"max-inline-size": {
		syntax: "none | <box-size>"
	},
	"max-lines": {
		syntax: "auto || <integer [1,∞]>"
	},
	"max-size": {
		syntax: "<'max-width'> <'max-height'>?"
	},
	"max-width": {
		syntax: "<length> | <percentage> | none | inherit | stretch | <-non-standard-size>"
	},
	"min-block-size": {
		syntax: "auto | <box-size>"
	},
	"min-height": {
		syntax: "<length> | <percentage> | inherit | stretch | <-non-standard-size>"
	},
	"min-inline-size": {
		syntax: "auto | <box-size>"
	},
	"min-intrinsic-sizing": {
		syntax: "legacy | zero-if-scroll || zero-if-extrinsic"
	},
	"min-size": {
		syntax: "<'min-width'> <'min-height'>?"
	},
	"min-width": {
		syntax: "<length> | <percentage> | inherit | stretch | <-non-standard-size>"
	},
	"mix-blend-mode": {
		syntax: "<blend-mode> | plus-lighter"
	},
	"nav-down": {
		syntax: "auto | <id> [ current | root | <target-name> ]?"
	},
	"nav-left": {
		syntax: "auto | <id> [ current | root | <target-name> ]?"
	},
	"nav-right": {
		syntax: "auto | <id> [ current | root | <target-name> ]?"
	},
	"nav-up": {
		syntax: "auto | <id> [ current | root | <target-name> ]?"
	},
	"object-fit": {
		syntax: "fill | none | [contain | cover] || scale-down"
	},
	"object-position": {
		syntax: "<position>"
	},
	"object-view-box": {
		syntax: "none | <basic-shape-rect>"
	},
	offset: {
		syntax: "[ <'offset-position'>? [ <'offset-path'> [ <'offset-distance'> || <'offset-rotate'> ]? ]? ]! [ / <'offset-anchor'> ]?"
	},
	"offset-anchor": {
		syntax: "auto | <position>"
	},
	"offset-distance": {
		syntax: "<length-percentage>"
	},
	"offset-path": {
		syntax: "none | <offset-path> || <coord-box>"
	},
	"offset-position": {
		syntax: "normal | auto | <position>"
	},
	"offset-rotate": {
		syntax: "[ auto | reverse ] || <angle>"
	},
	opacity: {
		syntax: "<opacity-value>"
	},
	order: {
		syntax: "<integer>"
	},
	orphans: {
		syntax: "<integer> | inherit"
	},
	outline: {
		syntax: "[ <'outline-color'> || <'outline-style'> || <'outline-width'> ] | inherit"
	},
	"outline-color": {
		syntax: "<color> | invert | inherit"
	},
	"outline-offset": {
		syntax: "<length>"
	},
	"outline-style": {
		syntax: "<border-style> | inherit"
	},
	"outline-width": {
		syntax: "<border-width> | inherit"
	},
	overflow: {
		syntax: "visible | hidden | scroll | auto | inherit | <-non-standard-overflow>"
	},
	"overflow-anchor": {
		syntax: "auto | none"
	},
	"overflow-block": {
		syntax: "visible | hidden | clip | scroll | auto | <-non-standard-overflow>"
	},
	"overflow-clip-margin": {
		syntax: "<visual-box> || <length>"
	},
	"overflow-clip-margin-block": {
		syntax: "<visual-box> || <length>"
	},
	"overflow-clip-margin-block-end": {
		syntax: "<visual-box> || <length>"
	},
	"overflow-clip-margin-block-start": {
		syntax: "<visual-box> || <length>"
	},
	"overflow-clip-margin-bottom": {
		syntax: "<visual-box> || <length>"
	},
	"overflow-clip-margin-inline": {
		syntax: "<visual-box> || <length>"
	},
	"overflow-clip-margin-inline-end": {
		syntax: "<visual-box> || <length>"
	},
	"overflow-clip-margin-inline-start": {
		syntax: "<visual-box> || <length>"
	},
	"overflow-clip-margin-left": {
		syntax: "<visual-box> || <length>"
	},
	"overflow-clip-margin-right": {
		syntax: "<visual-box> || <length>"
	},
	"overflow-clip-margin-top": {
		syntax: "<visual-box> || <length>"
	},
	"overflow-inline": {
		syntax: "visible | hidden | clip | scroll | auto | <-non-standard-overflow>"
	},
	"overflow-wrap": {
		syntax: "normal | break-word | anywhere"
	},
	"overflow-x": {
		syntax: "visible | hidden | clip | scroll | auto | <-non-standard-overflow>"
	},
	"overflow-y": {
		syntax: "visible | hidden | clip | scroll | auto | <-non-standard-overflow>"
	},
	overlay: {
		syntax: "none | auto"
	},
	"overscroll-behavior": {
		syntax: "[ contain | none | auto | chain ]{1,2}"
	},
	"overscroll-behavior-block": {
		syntax: "contain | none | auto | chain"
	},
	"overscroll-behavior-inline": {
		syntax: "contain | none | auto | chain"
	},
	"overscroll-behavior-x": {
		syntax: "contain | none | auto | chain"
	},
	"overscroll-behavior-y": {
		syntax: "contain | none | auto | chain"
	},
	padding: {
		syntax: "<padding-width>{1,4} | inherit"
	},
	"padding-block": {
		syntax: "<'padding-top'>{1,2}"
	},
	"padding-block-end": {
		syntax: "<'padding-top'>"
	},
	"padding-block-start": {
		syntax: "<'padding-top'>"
	},
	"padding-bottom": {
		syntax: "<padding-width> | inherit"
	},
	"padding-inline": {
		syntax: "<'padding-top'>{1,2}"
	},
	"padding-inline-end": {
		syntax: "<'padding-top'>"
	},
	"padding-inline-start": {
		syntax: "<'padding-top'>"
	},
	"padding-left": {
		syntax: "<padding-width> | inherit"
	},
	"padding-right": {
		syntax: "<padding-width> | inherit"
	},
	"padding-top": {
		syntax: "<padding-width> | inherit"
	},
	page: {
		syntax: "auto | <custom-ident>"
	},
	"page-break-after": {
		syntax: "auto | always | avoid | left | right | inherit"
	},
	"page-break-before": {
		syntax: "auto | always | avoid | left | right | inherit"
	},
	"page-break-inside": {
		syntax: "avoid | auto | inherit"
	},
	"paint-order": {
		syntax: "normal | [ fill || stroke || markers ]"
	},
	"path-length": {
		syntax: "none | <length [0,∞]>"
	},
	pause: {
		syntax: " <'pause-before'> <'pause-after'>?"
	},
	"pause-after": {
		syntax: " <time> | none | x-weak | weak | medium | strong | x-strong"
	},
	"pause-before": {
		syntax: " <time> | none | x-weak | weak | medium | strong | x-strong"
	},
	perspective: {
		syntax: "none | <length [0,∞]>"
	},
	"perspective-origin": {
		syntax: "<position>"
	},
	"place-content": {
		syntax: "<'align-content'> <'justify-content'>?"
	},
	"place-items": {
		syntax: "<'align-items'> <'justify-items'>?"
	},
	"place-self": {
		syntax: "<'align-self'> <'justify-self'>?"
	},
	"pointer-events": {
		syntax: "auto | bounding-box | visiblePainted | visibleFill | visibleStroke | visible | painted | fill | stroke | all | none"
	},
	"pointer-timeline": {
		syntax: "[ <'pointer-timeline-name'> <'pointer-timeline-axis'>? ]#"
	},
	"pointer-timeline-axis": {
		syntax: "[ block | inline | x | y ]#"
	},
	"pointer-timeline-name": {
		syntax: "[ none | <dashed-ident> ]#"
	},
	position: {
		syntax: "static | relative | absolute | fixed | inherit | -webkit-sticky"
	},
	"position-anchor": {
		syntax: "normal | none | auto | <anchor-name> | match-parent"
	},
	"position-area": {
		syntax: "none | <position-area>"
	},
	"position-try": {
		syntax: "<'position-try-order'>? <'position-try-fallbacks'>"
	},
	"position-try-fallbacks": {
		syntax: "none | [ [<dashed-ident> || <try-tactic>] | <position-area> ]#"
	},
	"position-try-options": {
		syntax: "<'position-try-fallbacks'>"
	},
	"position-try-order": {
		syntax: "normal | <try-size>"
	},
	"position-visibility": {
		syntax: "always | [ anchor-valid || anchor-visible || no-overflow ]"
	},
	"print-color-adjust": {
		syntax: "economy | exact"
	},
	quotes: {
		syntax: "[<string> <string>]+ | none | inherit"
	},
	r: {
		syntax: "<length-percentage>"
	},
	"reading-flow": {
		syntax: "normal | source-order | flex-visual | flex-flow | grid-rows | grid-columns | grid-order"
	},
	"reading-order": {
		syntax: "<integer>"
	},
	"region-fragment": {
		syntax: "auto | break"
	},
	resize: {
		syntax: "none | both | horizontal | vertical | block | inline"
	},
	rest: {
		syntax: " <'rest-before'> <'rest-after'>?"
	},
	"rest-after": {
		syntax: " <time> | none | x-weak | weak | medium | strong | x-strong"
	},
	"rest-before": {
		syntax: " <time> | none | x-weak | weak | medium | strong | x-strong"
	},
	right: {
		syntax: "<length> | <percentage> | auto | inherit"
	},
	rotate: {
		syntax: "none | <angle> | [ x | y | z | <number>{3} ] && <angle>"
	},
	"row-gap": {
		syntax: "normal | <length-percentage [0,∞]> | <line-width>"
	},
	"row-rule": {
		syntax: "<gap-rule-list> | <gap-auto-rule-list>"
	},
	"row-rule-break": {
		syntax: "none | normal | intersection"
	},
	"row-rule-color": {
		syntax: "<line-color-list> | <auto-line-color-list>"
	},
	"row-rule-inset": {
		syntax: "<'column-rule-inset-cap'> [ / <'column-rule-inset-junction'> ]?"
	},
	"row-rule-inset-cap": {
		syntax: "<inset-value> <inset-value>?"
	},
	"row-rule-inset-cap-end": {
		syntax: "<inset-value>"
	},
	"row-rule-inset-cap-start": {
		syntax: "<inset-value>"
	},
	"row-rule-inset-end": {
		syntax: "<inset-value>"
	},
	"row-rule-inset-junction": {
		syntax: "<inset-value> <inset-value>?"
	},
	"row-rule-inset-junction-end": {
		syntax: "<inset-value>"
	},
	"row-rule-inset-junction-start": {
		syntax: "<inset-value>"
	},
	"row-rule-inset-start": {
		syntax: "<inset-value>"
	},
	"row-rule-style": {
		syntax: "<line-style-list> | <auto-line-style-list>"
	},
	"row-rule-visibility-items": {
		syntax: "all | around | between | normal"
	},
	"row-rule-width": {
		syntax: "<line-width-list> | <auto-line-width-list>"
	},
	"ruby-align": {
		syntax: "start | center | space-between | space-around"
	},
	"ruby-merge": {
		syntax: "separate | merge | auto"
	},
	"ruby-overhang": {
		syntax: "auto | spaces"
	},
	"ruby-position": {
		syntax: "[ alternate || [ over | under ] ] | inter-character"
	},
	rule: {
		syntax: "<'column-rule'>"
	},
	"rule-break": {
		syntax: "<'column-rule-break'>"
	},
	"rule-color": {
		syntax: "<'column-rule-color'>"
	},
	"rule-inset": {
		syntax: "<'column-rule-inset'>"
	},
	"rule-inset-cap": {
		syntax: "<'column-rule-inset-cap'>"
	},
	"rule-inset-end": {
		syntax: "<'column-rule-inset-end'>"
	},
	"rule-inset-junction": {
		syntax: "<'column-rule-inset-junction'>"
	},
	"rule-inset-start": {
		syntax: "<'column-rule-inset-start'>"
	},
	"rule-overlap": {
		syntax: "row-over-column | column-over-row"
	},
	"rule-style": {
		syntax: "<'column-rule-style'>"
	},
	"rule-visibility-items": {
		syntax: "<'column-rule-visibility-items'>"
	},
	"rule-width": {
		syntax: "<'column-rule-width'>"
	},
	rx: {
		syntax: "<length-percentage> | auto"
	},
	ry: {
		syntax: "<length-percentage> | auto"
	},
	scale: {
		syntax: "none | [ <number> | <percentage> ]{1,3}"
	},
	"scroll-axis-lock": {
		syntax: "auto | none"
	},
	"scroll-behavior": {
		syntax: "auto | smooth"
	},
	"scroll-initial-target": {
		syntax: "none | nearest"
	},
	"scroll-margin": {
		syntax: " <length>{1,4}"
	},
	"scroll-margin-block": {
		syntax: "<length>{1,2}"
	},
	"scroll-margin-block-end": {
		syntax: "<length>"
	},
	"scroll-margin-block-start": {
		syntax: "<length>"
	},
	"scroll-margin-bottom": {
		syntax: " auto | <length-percentage [0,∞]>"
	},
	"scroll-margin-inline": {
		syntax: "<length>{1,2}"
	},
	"scroll-margin-inline-end": {
		syntax: "<length>"
	},
	"scroll-margin-inline-start": {
		syntax: "<length>"
	},
	"scroll-margin-left": {
		syntax: " auto | <length-percentage [0,∞]>"
	},
	"scroll-margin-right": {
		syntax: " auto | <length-percentage [0,∞]>"
	},
	"scroll-margin-top": {
		syntax: " auto | <length-percentage [0,∞]>"
	},
	"scroll-marker-group": {
		syntax: "none | [ [ before | after ] || [ links | tabs ] ]"
	},
	"scroll-padding": {
		syntax: "[ auto | <length-percentage [0,∞]> ]{1,4}"
	},
	"scroll-padding-block": {
		syntax: "[ auto | <length-percentage [0,∞]> ]{1,2}"
	},
	"scroll-padding-block-end": {
		syntax: "auto | <length-percentage [0,∞]>"
	},
	"scroll-padding-block-start": {
		syntax: "auto | <length-percentage [0,∞]>"
	},
	"scroll-padding-bottom": {
		syntax: "auto | <length-percentage [0,∞]>"
	},
	"scroll-padding-inline": {
		syntax: "[ auto | <length-percentage [0,∞]> ]{1,2}"
	},
	"scroll-padding-inline-end": {
		syntax: "auto | <length-percentage [0,∞]>"
	},
	"scroll-padding-inline-start": {
		syntax: "auto | <length-percentage [0,∞]>"
	},
	"scroll-padding-left": {
		syntax: "auto | <length-percentage [0,∞]>"
	},
	"scroll-padding-right": {
		syntax: "auto | <length-percentage [0,∞]>"
	},
	"scroll-padding-top": {
		syntax: "auto | <length-percentage [0,∞]>"
	},
	"scroll-snap-align": {
		syntax: "[ none | start | end | center ]{1,2}"
	},
	"scroll-snap-stop": {
		syntax: "normal | always"
	},
	"scroll-snap-type": {
		syntax: "none | [ x | y | block | inline | both | pair ] [ mandatory | proximity ]?"
	},
	"scroll-target-group": {
		syntax: "none | auto"
	},
	"scroll-timeline": {
		syntax: " [ <'scroll-timeline-name'> <'scroll-timeline-axis'>? ]#"
	},
	"scroll-timeline-axis": {
		syntax: " [ block | inline | x | y ]#"
	},
	"scroll-timeline-name": {
		syntax: " [ none | <dashed-ident> ]#"
	},
	"scrollbar-color": {
		syntax: "auto | <color>{2}"
	},
	"scrollbar-gutter": {
		syntax: "auto | stable && both-edges?"
	},
	"scrollbar-width": {
		syntax: "auto | thin | none"
	},
	"shape-image-threshold": {
		syntax: "<opacity-value>"
	},
	"shape-inside": {
		syntax: "auto | outside-shape | [ <basic-shape> || shape-box ] | <image> | display"
	},
	"shape-margin": {
		syntax: "<length-percentage [0,∞]>"
	},
	"shape-outside": {
		syntax: "none | [ <basic-shape> || <shape-box> ] | <image>"
	},
	"shape-padding": {
		syntax: "<length-percentage [0,∞]>"
	},
	"shape-rendering": {
		syntax: "auto | optimizeSpeed | crispEdges | geometricPrecision"
	},
	size: {
		syntax: "<'width'> <'height'>?"
	},
	"slider-orientation": {
		syntax: "auto | left-to-right | right-to-left | top-to-bottom | bottom-to-top"
	},
	"spatial-navigation-action": {
		syntax: "auto | focus | scroll"
	},
	"spatial-navigation-contain": {
		syntax: "auto | contain"
	},
	"spatial-navigation-function": {
		syntax: "normal | grid"
	},
	speak: {
		syntax: " auto | never | always"
	},
	"speak-as": {
		syntax: "normal | spell-out || digits || [ literal-punctuation | no-punctuation ]"
	},
	"string-set": {
		syntax: "[ <custom-ident> <content-list> ]# | none"
	},
	stroke: {
		syntax: "<paint>"
	},
	"stroke-align": {
		syntax: "center | inset | outset"
	},
	"stroke-alignment": {
		syntax: "center | inner | outer"
	},
	"stroke-break": {
		syntax: "bounding-box | slice | clone"
	},
	"stroke-color": {
		syntax: "<color>#"
	},
	"stroke-dash-corner": {
		syntax: "none | <length>"
	},
	"stroke-dash-justify": {
		syntax: "none | [ stretch | compress ] || [ dashes || gaps ]"
	},
	"stroke-dashadjust": {
		syntax: "none | [stretch | compress] [dashes | gaps]?"
	},
	"stroke-dasharray": {
		syntax: " none | [ <svg-length>+ ]#"
	},
	"stroke-dashcorner": {
		syntax: "none | <length>"
	},
	"stroke-dashoffset": {
		syntax: " <svg-length>"
	},
	"stroke-image": {
		syntax: "<paint>#"
	},
	"stroke-linecap": {
		syntax: "butt | round | square"
	},
	"stroke-linejoin": {
		syntax: " miter | round | bevel | arcs | crop | fallback | miter-clip"
	},
	"stroke-miterlimit": {
		syntax: " <number-one-or-greater>"
	},
	"stroke-opacity": {
		syntax: "<'opacity'>"
	},
	"stroke-origin": {
		syntax: "match-parent | fill-box | stroke-box | content-box | padding-box | border-box"
	},
	"stroke-position": {
		syntax: "<position>#"
	},
	"stroke-repeat": {
		syntax: "<repeat-style>#"
	},
	"stroke-size": {
		syntax: "<bg-size>#"
	},
	"stroke-width": {
		syntax: " [ <length-percentage> | <line-width> | <number> ]# "
	},
	"tab-size": {
		syntax: "<number [0,∞]> | <length [0,∞]>"
	},
	"table-layout": {
		syntax: "auto | fixed | inherit"
	},
	"text-align": {
		syntax: "left | right | center | justify | inherit | <-non-standard-text-align>"
	},
	"text-align-all": {
		syntax: "start | end | left | right | center | <string> | justify | match-parent"
	},
	"text-align-last": {
		syntax: "auto | start | end | left | right | center | justify | match-parent"
	},
	"text-anchor": {
		syntax: "start | middle | end"
	},
	"text-autospace": {
		syntax: "normal | <autospace> | auto"
	},
	"text-box": {
		syntax: "normal | <'text-box-trim'> || <'text-box-edge'>"
	},
	"text-box-edge": {
		syntax: "auto | <text-edge>"
	},
	"text-box-trim": {
		syntax: "none | trim-start | trim-end | trim-both"
	},
	"text-combine-upright": {
		syntax: "none | all | [ digits <integer [2,4]>? ]"
	},
	"text-decoration": {
		syntax: "none | [ underline || overline || line-through || blink ] | inherit"
	},
	"text-decoration-color": {
		syntax: "<color>"
	},
	"text-decoration-inset": {
		syntax: "<length-percentage>{1,2} | auto"
	},
	"text-decoration-line": {
		syntax: "none | [ underline || overline || line-through || blink ] | spelling-error | grammar-error"
	},
	"text-decoration-skip": {
		syntax: "none | auto"
	},
	"text-decoration-skip-box": {
		syntax: "none | all"
	},
	"text-decoration-skip-ink": {
		syntax: "auto | none | all"
	},
	"text-decoration-skip-self": {
		syntax: "auto | skip-all | [ skip-underline || skip-overline || skip-line-through ] | no-skip"
	},
	"text-decoration-skip-spaces": {
		syntax: "none | all | [ start || end ]"
	},
	"text-decoration-style": {
		syntax: "solid | double | dotted | dashed | wavy"
	},
	"text-decoration-thickness": {
		syntax: "auto | from-font | <length-percentage> | <line-width>"
	},
	"text-emphasis": {
		syntax: "<'text-emphasis-style'> || <'text-emphasis-color'>"
	},
	"text-emphasis-color": {
		syntax: "<color>"
	},
	"text-emphasis-position": {
		syntax: "[ over | under ] && [ right | left ]?"
	},
	"text-emphasis-skip": {
		syntax: "spaces || punctuation || symbols || narrow"
	},
	"text-emphasis-style": {
		syntax: "none | [ [ filled | open ] || [ dot | circle | double-circle | triangle | sesame ] ] | <string>"
	},
	"text-fit": {
		syntax: "[ none | grow | shrink ] [consistent | per-line | per-line-all]? <percentage>?"
	},
	"text-group-align": {
		syntax: "none | start | end | left | right | center"
	},
	"text-indent": {
		syntax: "<length> | <percentage> | inherit"
	},
	"text-justify": {
		syntax: "[ auto | none | inter-word | inter-character | ruby ] || no-compress"
	},
	"text-orientation": {
		syntax: "mixed | upright | sideways"
	},
	"text-overflow": {
		syntax: "[ clip | ellipsis | <string> | fade | <fade()> ]{1,2}"
	},
	"text-rendering": {
		syntax: "auto | optimizeSpeed | optimizeLegibility | geometricPrecision"
	},
	"text-shadow": {
		syntax: "none | <shadow>#"
	},
	"text-size-adjust": {
		syntax: "auto | none | <percentage [0,∞]>"
	},
	"text-spacing": {
		syntax: "none | auto | <spacing-trim> || <autospace>"
	},
	"text-spacing-trim": {
		syntax: "<spacing-trim> | auto"
	},
	"text-transform": {
		syntax: "capitalize | uppercase | lowercase | none | inherit"
	},
	"text-underline-offset": {
		syntax: "auto | <length-percentage>"
	},
	"text-underline-position": {
		syntax: "auto | [ from-font | under ] || [ left | right ]"
	},
	"text-wrap": {
		syntax: "<'text-wrap-mode'> || <'text-wrap-style'>"
	},
	"text-wrap-mode": {
		syntax: "wrap | nowrap"
	},
	"text-wrap-style": {
		syntax: "auto | balance | stable | pretty | avoid-short-last-line"
	},
	"timeline-scope": {
		syntax: "none | all | <dashed-ident>#"
	},
	"timeline-trigger": {
		syntax: "none | [ <'timeline-trigger-name'> <'timeline-trigger-source'> [ <'timeline-trigger-range'> ]? ]#"
	},
	"timeline-trigger-activation-range": {
		syntax: "[ <'timeline-trigger-activation-range-start'> <'timeline-trigger-activation-range-end'>? ]#"
	},
	"timeline-trigger-activation-range-end": {
		syntax: "[ normal | <length-percentage> | <timeline-range-name> <length-percentage>? ]#"
	},
	"timeline-trigger-activation-range-start": {
		syntax: "[ normal | <length-percentage> | <timeline-range-name> <length-percentage>? ]#"
	},
	"timeline-trigger-active-range": {
		syntax: "[ <'timeline-trigger-active-range-start'> <'timeline-trigger-active-range-end'>? ]#"
	},
	"timeline-trigger-active-range-end": {
		syntax: "[ auto | normal | <length-percentage> | <timeline-range-name> <length-percentage>? ]#"
	},
	"timeline-trigger-active-range-start": {
		syntax: "[ auto | normal | <length-percentage> | <timeline-range-name> <length-percentage>? ]#"
	},
	"timeline-trigger-name": {
		syntax: "none | <dashed-ident>#"
	},
	"timeline-trigger-range": {
		syntax: "[ <'timeline-trigger-activation-range'> [ / <'timeline-trigger-active-range'> ]? ]#"
	},
	"timeline-trigger-source": {
		syntax: "[ none | auto | [ <dashed-ident> | <scroll()> | <view()> ]+ ]#"
	},
	top: {
		syntax: "<length> | <percentage> | auto | inherit"
	},
	"touch-action": {
		syntax: "auto | none | [ [ pan-x | pan-left | pan-right ] || [ pan-y | pan-up | pan-down ] || pinch-zoom ] | manipulation"
	},
	transform: {
		syntax: "none | <transform-list>"
	},
	"transform-box": {
		syntax: "content-box | border-box | fill-box | stroke-box | view-box"
	},
	"transform-origin": {
		syntax: " [ left | center | right | top | bottom | <length-percentage> ] | [ left | center | right | <length-percentage> ] [ top | center | bottom | <length-percentage> ] <length>? | [ [ center | left | right ] && [ center | top | bottom ] ] <length>?"
	},
	"transform-style": {
		syntax: "flat | preserve-3d"
	},
	transition: {
		syntax: "<single-transition>#"
	},
	"transition-behavior": {
		syntax: "<transition-behavior-value>#"
	},
	"transition-delay": {
		syntax: "<time>#"
	},
	"transition-duration": {
		syntax: "<time [0s,∞]>#"
	},
	"transition-property": {
		syntax: "none | <single-transition-property>#"
	},
	"transition-timing-function": {
		syntax: "<easing-function>#"
	},
	translate: {
		syntax: "none | <length-percentage> [ <length-percentage> <length>? ]?"
	},
	"trigger-scope": {
		syntax: "none | all | <dashed-ident>#"
	},
	"unicode-bidi": {
		syntax: "normal | embed | bidi-override | inherit | -moz-isolate | -moz-isolate-override | -moz-plaintext | -webkit-isolate | -webkit-isolate-override | -webkit-plaintext"
	},
	"user-select": {
		syntax: "auto | text | none | contain | all"
	},
	"vector-effect": {
		syntax: "none | non-scaling-stroke | non-scaling-size | non-rotation | fixed-position"
	},
	"vertical-align": {
		syntax: "baseline | sub | super | top | text-top | middle | bottom | text-bottom | <percentage> | <length> | inherit"
	},
	"view-timeline": {
		syntax: "[ <'view-timeline-name'> [ <'view-timeline-axis'> || <'view-timeline-inset'> ]? ]#"
	},
	"view-timeline-axis": {
		syntax: "[ block | inline | x | y ]#"
	},
	"view-timeline-inset": {
		syntax: "[ [ auto | <length-percentage> ]{1,2} ]#"
	},
	"view-timeline-name": {
		syntax: "[ none | <dashed-ident> ]#"
	},
	"view-transition-class": {
		syntax: "none | <custom-ident>+"
	},
	"view-transition-group": {
		syntax: "normal | contain | nearest | <custom-ident>"
	},
	"view-transition-name": {
		syntax: "none | <custom-ident>"
	},
	"view-transition-scope": {
		syntax: "none | all"
	},
	visibility: {
		syntax: "visible | hidden | collapse | inherit"
	},
	"voice-balance": {
		syntax: " <number> | left | center | right | leftwards | rightwards"
	},
	"voice-duration": {
		syntax: " auto | <time>"
	},
	"voice-family": {
		syntax: " [ [ <family-name> | <generic-voice> ] , ]* [ <family-name> | <generic-voice> ] | preserve"
	},
	"voice-pitch": {
		syntax: " <frequency> && absolute | [ [ x-low | low | medium | high | x-high ] || [ <frequency> | <semitones> | <percentage> ] ]"
	},
	"voice-range": {
		syntax: " <frequency> && absolute | [ [ x-low | low | medium | high | x-high ] || [ <frequency> | <semitones> | <percentage> ] ]"
	},
	"voice-rate": {
		syntax: " [ normal | x-slow | slow | medium | fast | x-fast ] || <percentage>"
	},
	"voice-stress": {
		syntax: " normal | strong | moderate | none | reduced"
	},
	"voice-volume": {
		syntax: " silent | [ [ x-soft | soft | medium | loud | x-loud ] || <decibel> ]"
	},
	"white-space": {
		syntax: "normal | pre | nowrap | pre-wrap | pre-line | inherit"
	},
	"white-space-collapse": {
		syntax: "collapse | discard | preserve | preserve-breaks | preserve-spaces | break-spaces"
	},
	"white-space-trim": {
		syntax: " none | discard-before || discard-after || discard-inner"
	},
	widows: {
		syntax: "<integer> | inherit"
	},
	width: {
		syntax: "<length> | <percentage> | auto | inherit | stretch | <-non-standard-size>"
	},
	"will-change": {
		syntax: "auto | <animateable-feature>#"
	},
	"window-drag": {
		syntax: "none | move"
	},
	"word-break": {
		syntax: "normal | break-all | keep-all | manual | auto-phrase | break-word"
	},
	"word-space-transform": {
		syntax: "none | [ space | ideographic-space ] && auto-phrase?"
	},
	"word-spacing": {
		syntax: "normal | <length> | inherit"
	},
	"wrap-after": {
		syntax: "auto | avoid | avoid-line | avoid-flex | line | flex"
	},
	"wrap-before": {
		syntax: "auto | avoid | avoid-line | avoid-flex | line | flex"
	},
	"wrap-flow": {
		syntax: "auto | both | start | end | minimum | maximum | clear"
	},
	"wrap-inside": {
		syntax: "auto | avoid"
	},
	"wrap-through": {
		syntax: "wrap | none"
	},
	"writing-mode": {
		syntax: "horizontal-tb | vertical-rl | vertical-lr | sideways-rl | sideways-lr | <svg-writing-mode>"
	},
	x: {
		syntax: "<length-percentage>"
	},
	y: {
		syntax: "<length-percentage>"
	},
	"z-index": {
		syntax: "auto | <integer> | inherit"
	},
	zoom: {
		syntax: "<number [0,∞]> | <percentage [0,∞]>"
	}
};
var languages = [
	"aa",
	"ab",
	"af",
	"ak",
	"sq",
	"am",
	"ar",
	"an",
	"hy",
	"as",
	"av",
	"ae",
	"ay",
	"az",
	"ba",
	"bm",
	"eu",
	"be",
	"bn",
	"bh",
	"bi",
	"bo",
	"bs",
	"br",
	"bg",
	"my",
	"ca",
	"cs",
	"ch",
	"ce",
	"zh",
	"cu",
	"cv",
	"kw",
	"co",
	"cr",
	"cy",
	"da",
	"de",
	"dv",
	"nl",
	"dz",
	"el",
	"en",
	"eo",
	"et",
	"ee",
	"fo",
	"fa",
	"fj",
	"fi",
	"fr",
	"fy",
	"ff",
	"ka",
	"gd",
	"ga",
	"gl",
	"gv",
	"gn",
	"gu",
	"ht",
	"ha",
	"he",
	"hz",
	"hi",
	"ho",
	"hr",
	"hu",
	"ig",
	"is",
	"io",
	"ii",
	"iu",
	"ie",
	"ia",
	"id",
	"ik",
	"it",
	"jv",
	"ja",
	"kl",
	"kn",
	"ks",
	"kr",
	"kk",
	"km",
	"ki",
	"rw",
	"ky",
	"kv",
	"kg",
	"ko",
	"kj",
	"ku",
	"lo",
	"la",
	"lv",
	"li",
	"ln",
	"lt",
	"lb",
	"lu",
	"lg",
	"mk",
	"mh",
	"ml",
	"mi",
	"mr",
	"ms",
	"mg",
	"mt",
	"mo",
	"mn",
	"na",
	"nv",
	"nr",
	"nd",
	"ng",
	"ne",
	"nn",
	"nb",
	"no",
	"ny",
	"oc",
	"oj",
	"or",
	"om",
	"os",
	"pa",
	"pi",
	"pl",
	"pt",
	"ps",
	"qu",
	"rm",
	"ro",
	"rn",
	"ru",
	"sg",
	"sa",
	"sr",
	"si",
	"sk",
	"sl",
	"se",
	"sm",
	"sn",
	"sd",
	"so",
	"st",
	"es",
	"sc",
	"ss",
	"su",
	"sw",
	"sv",
	"ty",
	"ta",
	"tt",
	"te",
	"tg",
	"tl",
	"th",
	"ti",
	"to",
	"tn",
	"ts",
	"tk",
	"tr",
	"tw",
	"ug",
	"uk",
	"ur",
	"uz",
	"ve",
	"vi",
	"vo",
	"wa",
	"wo",
	"xh",
	"yi",
	"yo",
	"za",
	"zu"
];
var mediaFeatures = {
	"-moz-device-pixel-ratio": {
		category: "-moz-",
		status: "deprecated",
		type: "number"
	},
	"-moz-os-version": {
		category: "-moz-",
		status: "internal",
		type: "string"
	},
	"-moz-touch-enabled": {
		category: "-moz-",
		status: "non-standard",
		type: "boolean",
		values: [
			0,
			1
		]
	},
	"-ms-high-contrast": {
		category: "-ms-",
		equivalent: "forced-colors",
		status: "deprecated",
		type: "keyword",
		values: [
			"none",
			"active",
			"black-on-white",
			"white-on-black"
		]
	},
	"-ms-view-state": {
		category: "-ms-",
		status: "obsolete",
		type: "keyword",
		values: [
			"snapped",
			"fullscreen-portrait",
			"fullscreen-landscape",
			"filled"
		]
	},
	"-o-device-pixel-ratio": {
		category: "-o-",
		status: "obsolete",
		type: "number"
	},
	"-webkit-device-pixel-ratio": {
		category: "-webkit-",
		equivalent: "resolution",
		status: "deprecated",
		type: "number"
	},
	"-webkit-max-device-pixel-ratio": {
		category: "-webkit-",
		status: "deprecated",
		type: "number"
	},
	"-webkit-min-device-pixel-ratio": {
		category: "-webkit-",
		status: "deprecated",
		type: "number"
	},
	"-webkit-touch-enabled": {
		category: "-webkit-",
		status: "non-standard",
		type: "boolean",
		values: [
			0,
			1
		]
	},
	"-webkit-transform-3d": {
		category: "-webkit-",
		status: "non-standard",
		type: "boolean",
		values: [
			0,
			1
		]
	},
	"any-hover": {
		category: "input",
		type: "keyword",
		values: [
			"none",
			"hover"
		]
	},
	"any-pointer": {
		category: "input",
		type: "keyword",
		values: [
			"none",
			"coarse",
			"fine"
		]
	},
	"aspect-ratio": {
		category: "viewport",
		type: "ratio"
	},
	color: {
		category: "color",
		type: "integer"
	},
	"color-gamut": {
		category: "color",
		type: "keyword",
		values: [
			"srgb",
			"p3",
			"rec2020"
		]
	},
	"color-index": {
		category: "color",
		type: "integer"
	},
	"device-aspect-ratio": {
		category: "device-viewport",
		status: "deprecated",
		type: "ratio"
	},
	"device-height": {
		category: "device-viewport",
		status: "deprecated",
		type: "length"
	},
	"device-width": {
		category: "device-viewport",
		status: "deprecated",
		type: "length"
	},
	"display-mode": {
		category: "display",
		type: "keyword",
		values: [
			"fullscreen",
			"standalone",
			"minimal-ui",
			"browser"
		]
	},
	"dynamic-range": {
		category: "color",
		type: "keyword",
		values: [
			"standard",
			"high"
		]
	},
	"environment-blending": {
		category: "environment",
		type: "keyword",
		values: [
			"opaque",
			"additive",
			"subtractive"
		]
	},
	"forced-colors": {
		category: "accessibility",
		type: "keyword",
		values: [
			"none",
			"active"
		]
	},
	grid: {
		category: "legacy",
		type: "boolean",
		values: [
			0,
			1
		]
	},
	height: {
		category: "viewport",
		type: "length"
	},
	hover: {
		category: "input",
		type: "keyword",
		values: [
			"none",
			"hover"
		]
	},
	"inverted-colors": {
		category: "color",
		type: "keyword",
		values: [
			"none",
			"inverted"
		]
	},
	"light-level": {
		category: "legacy",
		status: "deprecated",
		type: "keyword",
		values: [
			"dim",
			"normal",
			"washed"
		]
	},
	"max-aspect-ratio": {
		category: "viewport",
		type: "ratio"
	},
	"max-color": {
		category: "color",
		type: "integer"
	},
	"max-color-index": {
		category: "color",
		type: "integer"
	},
	"max-height": {
		category: "viewport",
		type: "length"
	},
	"max-monochrome": {
		category: "color",
		type: "integer"
	},
	"max-resolution": {
		category: "display",
		type: "resolution"
	},
	"max-width": {
		category: "viewport",
		type: "length"
	},
	"min-aspect-ratio": {
		category: "viewport",
		type: "ratio"
	},
	"min-color": {
		category: "color",
		type: "integer"
	},
	"min-color-index": {
		category: "color",
		type: "integer"
	},
	"min-height": {
		category: "viewport",
		type: "length"
	},
	"min-monochrome": {
		category: "color",
		type: "integer"
	},
	"min-resolution": {
		category: "display",
		type: "resolution"
	},
	"min-width": {
		category: "viewport",
		type: "length"
	},
	monochrome: {
		category: "color",
		type: "integer"
	},
	"nav-controls": {
		category: "navigation",
		type: "keyword",
		values: [
			"none",
			"back"
		]
	},
	orientation: {
		category: "viewport",
		type: "keyword",
		values: [
			"portrait",
			"landscape"
		]
	},
	"overflow-block": {
		category: "display",
		type: "keyword",
		values: [
			"none",
			"scroll",
			"paged"
		]
	},
	"overflow-inline": {
		category: "display",
		type: "keyword",
		values: [
			"none",
			"scroll"
		]
	},
	pointer: {
		category: "input",
		type: "keyword",
		values: [
			"none",
			"coarse",
			"fine"
		]
	},
	"prefers-color-scheme": {
		category: "user-preferences",
		type: "keyword",
		values: [
			"light",
			"dark"
		]
	},
	"prefers-contrast": {
		category: "user-preferences",
		type: "keyword",
		values: [
			"no-preference",
			"less",
			"more",
			"custom"
		]
	},
	"prefers-reduced-data": {
		category: "user-preferences",
		type: "keyword",
		values: [
			"no-preference",
			"reduce"
		]
	},
	"prefers-reduced-motion": {
		category: "user-preferences",
		type: "keyword",
		values: [
			"no-preference",
			"reduce"
		]
	},
	"prefers-reduced-transparency": {
		category: "user-preferences",
		type: "keyword",
		values: [
			"no-preference",
			"reduce"
		]
	},
	resolution: {
		category: "display",
		type: "resolution",
		units: [
			"dpi",
			"dpcm",
			"dppx"
		]
	},
	scan: {
		category: "display",
		status: "deprecated",
		type: "keyword",
		values: [
			"interlace",
			"progressive"
		]
	},
	scripting: {
		category: "accessibility",
		type: "keyword",
		values: [
			"none",
			"initial-only",
			"enabled"
		]
	},
	update: {
		category: "display",
		type: "keyword",
		values: [
			"none",
			"slow",
			"fast"
		]
	},
	"video-color-gamut": {
		category: "video",
		type: "keyword",
		values: [
			"srgb",
			"p3",
			"rec2020"
		]
	},
	"video-dynamic-range": {
		category: "video",
		type: "keyword",
		values: [
			"standard",
			"high"
		]
	},
	width: {
		category: "viewport",
		type: "length"
	}
};
var selectors = {
	":-webkit-any-link": {
		syntax: ":-webkit-any-link"
	},
	":-webkit-any()": {
		syntax: ":-webkit-any( <forgiving-selector-list> )"
	},
	"::-webkit-input-placeholder": {
		syntax: "::-webkit-input-placeholder"
	},
	"::after": {
		syntax: "::after"
	},
	"::attr()": {
		syntax: "::attr()"
	},
	"::backdrop": {
		syntax: "::backdrop"
	},
	"::before": {
		syntax: "::before"
	},
	"::checkmark": {
		syntax: "::checkmark"
	},
	"::clear-icon": {
		syntax: "::clear-icon"
	},
	"::color-swatch": {
		syntax: "::color-swatch"
	},
	"::column": {
		syntax: "::column"
	},
	"::cue": {
		syntax: "::cue"
	},
	"::cue-region": {
		syntax: "::cue-region"
	},
	"::cue-region()": {
		syntax: "::cue-region(selector)"
	},
	"::cue()": {
		syntax: "::cue(selector)"
	},
	"::details-content": {
		syntax: "::details-content"
	},
	"::field-component": {
		syntax: "::field-component"
	},
	"::field-content": {
		syntax: "::field-content"
	},
	"::field-separator": {
		syntax: "::field-separator"
	},
	"::file-selector-button": {
		syntax: "::file-selector-button"
	},
	"::first-letter": {
		syntax: "::first-letter"
	},
	"::first-line": {
		syntax: "::first-line"
	},
	"::grammar-error": {
		syntax: "::grammar-error"
	},
	"::highlight()": {
		syntax: "::highlight(<highlight-name-selector>)"
	},
	"::interest-button": {
		syntax: "::interest-button"
	},
	"::marker": {
		syntax: "::marker"
	},
	"::part()": {
		syntax: "::part( <ident>+ )"
	},
	"::picker-icon": {
		syntax: "::picker-icon"
	},
	"::picker()": {
		syntax: "::picker( <form-control-identifier>+ ) <form-control-identifier>Info about the '<form-control-identifier>' reference.#typedef-picker-form-control-identifierReferenced in:3.1. The ::picker() pseudo-element (2) (3) Possible linking"
	},
	"::placeholder": {
		syntax: "::placeholder"
	},
	"::reveal-icon": {
		syntax: "::reveal-icon"
	},
	"::scroll-button()": {
		syntax: "::scroll-button( '*' | <scroll-button-direction> )"
	},
	"::scroll-marker": {
		syntax: "::scroll-marker"
	},
	"::scroll-marker-group": {
		syntax: "::scroll-marker-group"
	},
	"::search-text": {
		syntax: "::search-text"
	},
	"::selection": {
		syntax: "::selection"
	},
	"::slider-fill": {
		syntax: "::slider-fill"
	},
	"::slider-thumb": {
		syntax: "::slider-thumb"
	},
	"::slider-track": {
		syntax: "::slider-track"
	},
	"::spelling-error": {
		syntax: "::spelling-error"
	},
	"::step-control": {
		syntax: "::step-control"
	},
	"::step-down": {
		syntax: "::step-down"
	},
	"::step-up": {
		syntax: "::step-up"
	},
	"::target-text": {
		syntax: "::target-text"
	},
	"::view-transition": {
		syntax: "::view-transition"
	},
	":active": {
		syntax: ":active"
	},
	":active-view-transition": {
		syntax: ":active-view-transition"
	},
	":after": {
		syntax: ":after"
	},
	":animated-image": {
		syntax: ":animated-image"
	},
	":any-link": {
		syntax: ":any-link"
	},
	":autofill": {
		syntax: ":autofill"
	},
	":before": {
		syntax: ":before"
	},
	":blank": {
		syntax: ":blank"
	},
	":buffering": {
		syntax: ":buffering"
	},
	":checked": {
		syntax: ":checked"
	},
	":current": {
		syntax: ":current"
	},
	":default": {
		syntax: ":default"
	},
	":defined": {
		syntax: ":defined"
	},
	":disabled": {
		syntax: ":disabled"
	},
	":empty": {
		syntax: ":empty"
	},
	":enabled": {
		syntax: ":enabled"
	},
	":first": {
		syntax: ":first"
	},
	":first-child": {
		syntax: ":first-child"
	},
	":first-letter": {
		syntax: ":first-letter"
	},
	":first-line": {
		syntax: ":first-line"
	},
	":first-of-page": {
		syntax: ":first-of-page"
	},
	":first-of-type": {
		syntax: ":first-of-type"
	},
	":focus": {
		syntax: ":focus"
	},
	":focus-visible": {
		syntax: ":focus-visible"
	},
	":focus-within": {
		syntax: ":focus-within"
	},
	":fullscreen": {
		syntax: ":fullscreen"
	},
	":future": {
		syntax: ":future"
	},
	":global": {
		syntax: ":global"
	},
	":global()": {
		syntax: ":global( <forgiving-selector-list> )"
	},
	":has-slotted": {
		syntax: ":has-slotted"
	},
	":heading": {
		syntax: ":heading"
	},
	":heading()": {
		syntax: ":heading( <level># )"
	},
	":high-value": {
		syntax: ":high-value"
	},
	":host": {
		syntax: ":host"
	},
	":hover": {
		syntax: ":hover"
	},
	":in-range": {
		syntax: ":in-range"
	},
	":indeterminate": {
		syntax: ":indeterminate"
	},
	":interest-source": {
		syntax: ":interest-source"
	},
	":interest-target": {
		syntax: ":interest-target"
	},
	":invalid": {
		syntax: ":invalid"
	},
	":last-child": {
		syntax: ":last-child"
	},
	":last-of-page": {
		syntax: ":last-of-page"
	},
	":last-of-type": {
		syntax: ":last-of-type"
	},
	":left": {
		syntax: ":left"
	},
	":link": {
		syntax: ":link"
	},
	":local": {
		syntax: ":local"
	},
	":local-link": {
		syntax: ":local-link"
	},
	":local()": {
		syntax: ":local( <forgiving-selector-list> )"
	},
	":low-value": {
		syntax: ":low-value"
	},
	":modal": {
		syntax: ":modal"
	},
	":muted": {
		syntax: ":muted"
	},
	":navigation-source": {
		syntax: ":navigation-source"
	},
	":nth-child()": {
		syntax: ":nth-child(An+B [of S]? )"
	},
	":nth-col()": {
		syntax: ":nth-col(An+B)"
	},
	":nth-last-child()": {
		syntax: ":nth-last-child(An+B [of S]? )"
	},
	":nth-last-col()": {
		syntax: ":nth-last-col(An+B)"
	},
	":nth-last-of-type()": {
		syntax: ":nth-last-of-type(An+B)"
	},
	":nth-of-page()": {
		syntax: ":nth-of-page(n)"
	},
	":nth-of-type()": {
		syntax: ":nth-of-type(An+B)"
	},
	":nth()": {
		syntax: ":nth()"
	},
	":only-child": {
		syntax: ":only-child"
	},
	":only-of-type": {
		syntax: ":only-of-type"
	},
	":open": {
		syntax: ":open"
	},
	":optimal-value": {
		syntax: ":optimal-value"
	},
	":optional": {
		syntax: ":optional"
	},
	":out-of-range": {
		syntax: ":out-of-range"
	},
	":past": {
		syntax: ":past"
	},
	":paused": {
		syntax: ":paused"
	},
	":picture-in-picture": {
		syntax: ":picture-in-picture"
	},
	":placeholder-shown": {
		syntax: ":placeholder-shown"
	},
	":playing": {
		syntax: ":playing"
	},
	":popover-open": {
		syntax: ":popover-open"
	},
	":read-only": {
		syntax: ":read-only"
	},
	":read-write": {
		syntax: ":read-write"
	},
	":required": {
		syntax: ":required"
	},
	":right": {
		syntax: ":right"
	},
	":root": {
		syntax: ":root"
	},
	":scope": {
		syntax: ":scope"
	},
	":seeking": {
		syntax: ":seeking"
	},
	":snapped": {
		syntax: ":snapped"
	},
	":snapped-block": {
		syntax: ":snapped-block"
	},
	":snapped-inline": {
		syntax: ":snapped-inline"
	},
	":snapped-x": {
		syntax: ":snapped-x"
	},
	":snapped-y": {
		syntax: ":snapped-y"
	},
	":stalled": {
		syntax: ":stalled"
	},
	":start-of-page": {
		syntax: ":start-of-page"
	},
	":state()": {
		syntax: ":state( <ident> )"
	},
	":target": {
		syntax: ":target"
	},
	":target-after": {
		syntax: ":target-after"
	},
	":target-before": {
		syntax: ":target-before"
	},
	":target-current": {
		syntax: ":target-current"
	},
	":unchecked": {
		syntax: ":unchecked"
	},
	":user-invalid": {
		syntax: ":user-invalid"
	},
	":user-valid": {
		syntax: ":user-valid"
	},
	":valid": {
		syntax: ":valid"
	},
	":visited": {
		syntax: ":visited"
	},
	":volume-locked": {
		syntax: ":volume-locked"
	},
	":xr-overlay": {
		syntax: ":xr-overlay"
	},
	"&": {
		syntax: "'&'"
	},
	"+": {
		syntax: "'+'"
	},
	">": {
		syntax: "'>'"
	},
	"||": {
		syntax: "'|' '|'"
	},
	"~": {
		syntax: "'~'"
	}
};
var syntaxes = {
	syntax: {
		syntax: "'*' | <syntax-component> [ <syntax-combinator> <syntax-component> ]* | <syntax-string>"
	},
	"-legacy-gradient": {
		syntax: "<-webkit-gradient()> | <-legacy-linear-gradient> | <-legacy-repeating-linear-gradient> | <-legacy-radial-gradient> | <-legacy-repeating-radial-gradient>"
	},
	"-legacy-linear-gradient": {
		syntax: "-moz-linear-gradient( <-legacy-linear-gradient-arguments> ) | -webkit-linear-gradient( <-legacy-linear-gradient-arguments> ) | -o-linear-gradient( <-legacy-linear-gradient-arguments> )"
	},
	"-legacy-linear-gradient-arguments": {
		syntax: "[ <angle> | <side-or-corner> ]? , <color-stop-list>"
	},
	"-legacy-radial-gradient": {
		syntax: "-moz-radial-gradient( <-legacy-radial-gradient-arguments> ) | -webkit-radial-gradient( <-legacy-radial-gradient-arguments> ) | -o-radial-gradient( <-legacy-radial-gradient-arguments> )"
	},
	"-legacy-radial-gradient-arguments": {
		syntax: " <position>? , [ [ <-legacy-radial-gradient-shape> || <-legacy-radial-gradient-size> ] | [ <length> | <percentage> ]{2} ]? , <color-stop-list>"
	},
	"-legacy-radial-gradient-shape": {
		syntax: "circle | ellipse"
	},
	"-legacy-radial-gradient-size": {
		syntax: "closest-side | closest-corner | farthest-side | farthest-corner | contain | cover"
	},
	"-legacy-repeating-linear-gradient": {
		syntax: "-moz-repeating-linear-gradient( <-legacy-linear-gradient-arguments> ) | -webkit-repeating-linear-gradient( <-legacy-linear-gradient-arguments> ) | -o-repeating-linear-gradient( <-legacy-linear-gradient-arguments> )"
	},
	"-legacy-repeating-radial-gradient": {
		syntax: "-moz-repeating-radial-gradient( <-legacy-radial-gradient-arguments> ) | -webkit-repeating-radial-gradient( <-legacy-radial-gradient-arguments> ) | -o-repeating-radial-gradient( <-legacy-radial-gradient-arguments> )"
	},
	"-ms-filter-function": {
		syntax: "<-ms-filter-function-progid> | <-ms-filter-function-legacy>"
	},
	"-ms-filter-function-legacy": {
		syntax: "<ident-token> | <function-token> <any-value>? )"
	},
	"-ms-filter-function-list": {
		syntax: "<-ms-filter-function>+"
	},
	"-ms-filter-function-progid": {
		syntax: "'progid:' [ <ident-token> '.' ]* [ <ident-token> | <function-token> <any-value>? ) ]"
	},
	"-non-standard-color": {
		syntax: "-moz-ButtonDefault | -moz-ButtonHoverFace | -moz-ButtonHoverText | -moz-CellHighlight | -moz-CellHighlightText | -moz-Combobox | -moz-ComboboxText | -moz-Dialog | -moz-DialogText | -moz-dragtargetzone | -moz-EvenTreeRow | -moz-Field | -moz-FieldText | -moz-html-CellHighlight | -moz-html-CellHighlightText | -moz-mac-accentdarkestshadow | -moz-mac-accentdarkshadow | -moz-mac-accentface | -moz-mac-accentlightesthighlight | -moz-mac-accentlightshadow | -moz-mac-accentregularhighlight | -moz-mac-accentregularshadow | -moz-mac-chrome-active | -moz-mac-chrome-inactive | -moz-mac-focusring | -moz-mac-menuselect | -moz-mac-menushadow | -moz-mac-menutextselect | -moz-MenuHover | -moz-MenuHoverText | -moz-MenuBarText | -moz-MenuBarHoverText | -moz-nativehyperlinktext | -moz-OddTreeRow | -moz-win-communicationstext | -moz-win-mediatext | -moz-activehyperlinktext | -moz-default-background-color | -moz-default-color | -moz-hyperlinktext | -moz-visitedhyperlinktext | -webkit-activelink | -webkit-focus-ring-color | -webkit-link | -webkit-text"
	},
	"-non-standard-display": {
		syntax: "-ms-inline-flexbox | -ms-grid | -ms-inline-grid | -webkit-flex | -webkit-inline-flex | -webkit-box | -webkit-inline-box | -moz-inline-stack | -moz-box | -moz-inline-box | -ms-flexbox"
	},
	"-non-standard-font": {
		syntax: "-apple-system-body | -apple-system-headline | -apple-system-subheadline | -apple-system-caption1 | -apple-system-caption2 | -apple-system-footnote | -apple-system-short-body | -apple-system-short-headline | -apple-system-short-subheadline | -apple-system-short-caption1 | -apple-system-short-footnote | -apple-system-tall-body"
	},
	"-non-standard-generic-family": {
		syntax: "-apple-system | BlinkMacSystemFont"
	},
	"-non-standard-image-rendering": {
		syntax: "optimize-contrast | -moz-crisp-edges | -o-crisp-edges | -webkit-optimize-contrast"
	},
	"-non-standard-overflow": {
		syntax: "overlay | -moz-scrollbars-none | -moz-scrollbars-horizontal | -moz-scrollbars-vertical | -moz-hidden-unscrollable"
	},
	"-non-standard-size": {
		syntax: "intrinsic | min-intrinsic | -webkit-fill-available | -webkit-fit-content | -webkit-min-content | -webkit-max-content  | -moz-available | -moz-fit-content | -moz-min-content | -moz-max-content"
	},
	"-non-standard-text-align": {
		syntax: "| -moz-center | -webkit-center | -webkit-match-parent"
	},
	"-webkit-gradient-color-stop": {
		syntax: "from( <color> ) | color-stop( [ <number-zero-one> | <percentage> ] , <color> ) | to( <color> )"
	},
	"-webkit-gradient-point": {
		syntax: "[ left | center | right | <length-percentage> ] [ top | center | bottom | <length-percentage> ]"
	},
	"-webkit-gradient-radius": {
		syntax: "<length> | <percentage>"
	},
	"-webkit-gradient-type": {
		syntax: "linear | radial"
	},
	"-webkit-gradient()": {
		syntax: "-webkit-gradient( <-webkit-gradient-type>, <-webkit-gradient-point> [, <-webkit-gradient-point> | , <-webkit-gradient-radius>, <-webkit-gradient-point> ] [, <-webkit-gradient-radius>]? [, <-webkit-gradient-color-stop>]* )"
	},
	"-webkit-mask-box-repeat": {
		syntax: "repeat | stretch | round"
	},
	"abs()": {
		syntax: "abs( <calc-sum> )"
	},
	"acos()": {
		syntax: "acos( <calc-sum> )"
	},
	age: {
		syntax: "child | young | old"
	},
	"alpha-value": {
		syntax: "<number> | <percentage> | none"
	},
	"alpha()": {
		syntax: " alpha([from <color>] [ / [<alpha-value> | none] ]? )"
	},
	"anchor-size()": {
		syntax: "anchor-size( [ <anchor-name> || <anchor-size> ]? , <length-percentage>? ) <anchor-size>Info about the '<anchor-size>' reference.#typedef-anchor-sizeReferenced in:5.1. The anchor-size() Function (2) (3) (4) (5) (6) Possible linking"
	},
	"anchor()": {
		syntax: "anchor( <anchor-name>? && <anchor-side>, <length-percentage>? ) <anchor-side>Info about the '<anchor-side>' reference.#typedef-anchor-sideReferenced in:3.2. Anchor-relative Insets: the anchor() function (2) (3) 3.2.1. Resolution of anchor() 5.1. The anchor-size() Function Possible linking"
	},
	"asin()": {
		syntax: "asin( <calc-sum> )"
	},
	"at-rule()": {
		syntax: "at-rule(<at-keyword-token>)"
	},
	"atan()": {
		syntax: "atan( <calc-sum> )"
	},
	"atan2()": {
		syntax: "atan2( <calc-sum>, <calc-sum> )"
	},
	"attr-fallback": {
		syntax: "<any-value>"
	},
	"attr-name": {
		syntax: "<wq-name>"
	},
	"attr()": {
		syntax: "attr( <attr-name> <attr-type>? , <declaration-value>?)"
	},
	autospace: {
		syntax: "no-autospace | [ ideograph-alpha || ideograph-numeric || punctuation ] || [ insert | replace ]"
	},
	"bg-position": {
		syntax: "<position> | <position-three>"
	},
	bottom: {
		syntax: "<length> | auto"
	},
	"calc-interpolate()": {
		syntax: "calc-interpolate( [ <progress-source> && [ by <easing-function> ]? && <easing-function>? ] , <input-position>{1,2} : <calc-sum> , [ <easing-function>? , <input-position>{1,2} : <calc-sum> ]#? )"
	},
	"calc-mix()": {
		syntax: "calc-mix( [ <calc-sum> <percentage [0,100]>? ]# )"
	},
	"calc-size()": {
		syntax: "calc-size( <calc-size-basis>, <calc-sum> ) <calc-size-basis>Info about the '<calc-size-basis>' reference.#typedef-calc-size-basisReferenced in:7. Calculating With Intrinsic Sizes: the calc-size() function (2) Possible linking"
	},
	"calc()": {
		syntax: "calc( <calc-sum> )"
	},
	"change()": {
		syntax: "change()"
	},
	"clamp()": {
		syntax: "clamp( [ <calc-sum> | none ], <calc-sum>, [ <calc-sum> | none ] )"
	},
	"click()": {
		syntax: "click()"
	},
	"cmyk-component": {
		syntax: "<number> | <percentage> | none"
	},
	color: {
		syntax: "<color-base> | currentColor | <system-color> | <device-cmyk()>  | <light-dark()> | <-non-standard-color>"
	},
	"color-font-tech": {
		syntax: "color-colrv0 | color-colrv1 | color-svg | color-sbix | color-cbdt"
	},
	"color-interpolate()": {
		syntax: "color-interpolate( [ <progress-source> && [ by <easing-function> ]? && <easing-function>? && <color-interpolation-method>? ] , <input-position>{1,2} : <color>, [ [ <easing-function> || <color-interpolation-method> ]?, <input-position>{1,2} : <color> ]#? )"
	},
	"color-layers()": {
		syntax: "color-layers([ <blend-mode>, ]? <color># )"
	},
	"color-mix()": {
		syntax: "color-mix( <color-interpolation-method> ,? [ <color> && <percentage [0,100]>? ]#)"
	},
	"color-space": {
		syntax: "<rectangular-color-space> | <polar-color-space> | <custom-color-space>"
	},
	"color()": {
		syntax: "color( [from <color>]? <colorspace-params> [ / [ <alpha-value> | none ] ]? )"
	},
	"colorspace-params": {
		syntax: "[<custom-params> | <predefined-rgb-params> | <xyz-params>]"
	},
	combinator: {
		syntax: "'>' | '+' | '~' | [ '|' '|' ]"
	},
	"complex-real-selector": {
		syntax: "<compound-selector> [ <combinator>? <compound-selector> ]*"
	},
	"complex-real-selector-list": {
		syntax: "<complex-real-selector>#"
	},
	"complex-selector": {
		syntax: "<complex-selector-unit> [ <combinator>? <complex-selector-unit> ]*"
	},
	"complex-selector-unit": {
		syntax: "[ <compound-selector>? <pseudo-compound-selector>* ]!"
	},
	"composes-selector": {
		syntax: "<ident>+ [from [global&&<string>]]?"
	},
	"compound-selector": {
		syntax: "[ <type-selector>? <subclass-selector>* ]!"
	},
	"conic-gradient()": {
		syntax: "conic-gradient()"
	},
	"content-list": {
		syntax: "[ <string> | contents | <image> | <counter> | <quote> | <target> | <leader()> | <attr()> ]+"
	},
	"content()": {
		syntax: "content()"
	},
	"contrast-color()": {
		syntax: "contrast-color( [ [ <color> && [ tbd-fg | tbd-bg ] && <target-contrast>? ] | [ <color> && [ tbd-fg | tbd-bg ] && <target-contrast>, <color># ] ] )"
	},
	"control-value()": {
		syntax: "control-value( <type>? ) <type>Info about the '<type>' reference.#typedef-typeReferenced in:6. The control-value() function (2) Possible linking"
	},
	"coord-box": {
		syntax: "content-box | padding-box | border-box | fill-box | stroke-box | view-box"
	},
	"cos()": {
		syntax: "cos( <calc-sum> )"
	},
	"counter()": {
		syntax: "counter(<identifier>)"
	},
	"counters()": {
		syntax: "counters(<identifier>, <string>)"
	},
	"cross-fade()": {
		syntax: "cross-fade()"
	},
	"cubic-bezier-easing-function": {
		syntax: "ease | ease-in | ease-out | ease-in-out | cubic-bezier( <number [0,1]> , <number> , <number [0,1]> , <number> )"
	},
	"cubic-bezier()": {
		syntax: "cubic-bezier()"
	},
	"custom-params": {
		syntax: "<dashed-ident> [ <number> | <percentage> | none ]+"
	},
	"cycle()": {
		syntax: "cycle( <whole-value># )"
	},
	"dblclick()": {
		syntax: "dblclick()"
	},
	declaration: {
		syntax: "<ident-token> : <declaration-value>? [ '!' important ]?"
	},
	"declaration-list": {
		syntax: "[ <declaration>? ';' ]* <declaration>?"
	},
	"device-cmyk()": {
		syntax: "<legacy-device-cmyk-syntax> | <modern-device-cmyk-syntax>"
	},
	"dynamic-range-limit-mix()": {
		syntax: "dynamic-range-limit-mix()"
	},
	"element()": {
		syntax: "element( <custom-ident> , [ first | start | last | first-except ]? ) | element( <id-selector> )"
	},
	"env()": {
		syntax: "env( <custom-ident> <integer [0,∞]>* , <declaration-value>? )"
	},
	"exp()": {
		syntax: "exp( <calc-sum> )"
	},
	"filter()": {
		syntax: "filter( [ <image> | <string> ], <filter-value-list> )"
	},
	"first-valid()": {
		syntax: "first-valid( <declaration-value># )"
	},
	"focusin()": {
		syntax: "focusin()"
	},
	"focusout()": {
		syntax: "focusout()"
	},
	"font-feature-custom-ident": {
		syntax: "<integer>"
	},
	"font-feature-custom-ident-character-variant": {
		syntax: "<integer> <integer>?"
	},
	"font-feature-custom-ident-list": {
		syntax: "<integer>+"
	},
	"font-features-tech": {
		syntax: "features-opentype | features-aat | features-graphite"
	},
	"font-format-values": {
		syntax: "collection | embedded-opentype | opentype | truetype | svg | woff | woff2"
	},
	"font-format()": {
		syntax: "font-format(<font-format-values>)"
	},
	"font-tech-patch-values": {
		syntax: "incremental-patch | incremental-range | incremental-auto | variations | palettes"
	},
	"font-tech()": {
		syntax: "font-tech( <color-font-tech> | <font-features-tech> | <font-tech-patch-values> )"
	},
	"forgiving-relative-selector-list": {
		syntax: "<relative-real-selector-list>"
	},
	"forgiving-selector-list": {
		syntax: "<complex-real-selector-list>"
	},
	"function-name": {
		syntax: "<dashed-ident>("
	},
	"function-parameter": {
		syntax: "<dashed-ident> <css-type>? [ : <default-value> ]?"
	},
	gender: {
		syntax: "male | female | neutral"
	},
	"general-enclosed": {
		syntax: "[ <function-token> <any-value>? ) ] | [ ( <any-value>? ) ]"
	},
	"generic-family": {
		syntax: "<generic-script-specific>| <generic-complete> | <generic-incomplete> | <-non-standard-generic-family>"
	},
	"generic-script-specific": {
		syntax: "generic(kai) | generic(fangsong) | generic(nastaliq)"
	},
	"generic-voice": {
		syntax: "[ <age>? <gender> <integer>? ]"
	},
	gradient: {
		syntax: "| <-legacy-gradient>"
	},
	"hdr-color()": {
		syntax: "hdr-color()"
	},
	"hsl()": {
		syntax: "hsl() | hsl(from <color> [ <hue> | none | h | s | l ] <relative-hsl-component>{2} [ / [ <alpha-value> | none] ]? )"
	},
	"hsla()": {
		syntax: "hsla() | hsla(from <color> < [ <hue> | none | h | s | l ] <relative-hsl-component>{2} [ / [ <alpha-value> | none ] ]? )"
	},
	"hwb()": {
		syntax: "hwb() | hwb(from <color> [ <hue> | none | h | w | b ] <relative-hwb-component>{2} [ / [ <alpha-value> | none] ]? )"
	},
	"hypot()": {
		syntax: "hypot( <calc-sum># )"
	},
	"ictcp()": {
		syntax: "ictcp()"
	},
	"ident()": {
		syntax: "ident( <ident-arg>+ )"
	},
	"if-branch": {
		syntax: "<if-condition> : <declaration-value>?"
	},
	"if-condition": {
		syntax: "<if-test> | else"
	},
	"if-test": {
		syntax: "supports( [ <ident> : <declaration-value> ] | <supports-condition> ) | media( <media-feature> | <media-condition> ) | style( <style-query> )"
	},
	"if()": {
		syntax: "if( [ <if-branch> ; ]* )"
	},
	"image-set()": {
		syntax: "image-set( <image-set-option># ) <image-set-option>Info about the '<image-set-option>' reference.#typedef-image-set-optionReferenced in:2.4. Resolution/Type Negotiation: the image-set() notation (2) (3) (4) (5) (6) (7) (8) (9) (10) (11) (12) (13) (14) Possible linking"
	},
	"image()": {
		syntax: "image()"
	},
	"inherit()": {
		syntax: "inherit( <custom-property-name>, <declaration-value>? )"
	},
	"input()": {
		syntax: "input()"
	},
	"inset-area": {
		syntax: "[ [ left | center | right | span-left | span-right | x-start | x-end | span-x-start | span-x-end | x-self-start | x-self-end | span-x-self-start | span-x-self-end | span-all ] || [ top | center | bottom | span-top | span-bottom | y-start | y-end | span-y-start | span-y-end | y-self-start | y-self-end | span-y-self-start | span-y-self-end | span-all ] | [ block-start | center | block-end | span-block-start | span-block-end | span-all ] || [ inline-start | center | inline-end | span-inline-start | span-inline-end | span-all ] | [ self-block-start | self-block-end | span-self-block-start | span-self-block-end | span-all ] || [ self-inline-start | self-inline-end | span-self-inline-start | span-self-inline-end | span-all ] | [ start | center | end | span-start | span-end | span-all ]{1,2} | [ self-start | center | self-end | span-self-start | span-self-end | span-all ]{1,2} ]"
	},
	"interpolate()": {
		syntax: "interpolate( [ <progress-source> && [ by <easing-function> ]? && <easing-function>? ] , <input-position>{1,2} : <whole-value>, [ <easing-function>?, <input-position>{1,2} : <whole-value> ]#? ) | interpolate( <progress-source> && [ by <easing-function> ]? && <easing-function>? of <keyframes-name> )"
	},
	"intrinsic-size-keyword": {
		syntax: "min-content | max-content | fit-content"
	},
	"jzazbz()": {
		syntax: "jzazbz()"
	},
	"jzczhz()": {
		syntax: "jzczhz()"
	},
	"keyframe-selectors": {
		syntax: "<keyframe-selector>#"
	},
	"lab()": {
		syntax: "lab() | lab(from <color> <relative-lab-component>{3} [ / [ <alpha-value> | none ] ]? )"
	},
	"lch()": {
		syntax: "lch() | lch(from <color> <relative-lch-component>{2} [ <hue> | none | l | c | h ] [ / [ <alpha-value> | none ] ]? )"
	},
	"leader()": {
		syntax: "leader()"
	},
	left: {
		syntax: "<length> | auto"
	},
	"legacy-device-cmyk-syntax": {
		syntax: "device-cmyk( <number>#{4} )"
	},
	"legacy-pseudo-element-selector": {
		syntax: " ':' [before | after | first-line | first-letter]"
	},
	"light-dark()": {
		syntax: "light-dark()"
	},
	"linear-gradient()": {
		syntax: "linear-gradient( [ <linear-gradient-syntax> ] ) <linear-gradient-syntax>Info about the '<linear-gradient-syntax>' reference.#typedef-linear-gradient-syntaxReferenced in:3.1.1. linear-gradient() syntax 3.3. Repeating Gradients: the repeating-linear-gradient() and repeating-radial-gradient() notations Possible linking"
	},
	"linear()": {
		syntax: "linear()"
	},
	"log()": {
		syntax: "log( <calc-sum>, <calc-sum>? )"
	},
	"matrix3d()": {
		syntax: "matrix3d( <number>#{16} )"
	},
	"max()": {
		syntax: "max( <calc-sum># )"
	},
	"media()": {
		syntax: "media( [ <mf-plain> | <mf-boolean> | <mf-range> ] )"
	},
	"min()": {
		syntax: "min( <calc-sum># )"
	},
	"mod()": {
		syntax: "mod( <calc-sum>, <calc-sum> )"
	},
	"modern-device-cmyk-syntax": {
		syntax: "device-cmyk( <cmyk-component>{4} [ / [ <alpha-value> | none ] ]? )"
	},
	"named-feature()": {
		syntax: "named-feature( <ident> )"
	},
	"number-one-or-greater": {
		syntax: "<number [1,∞]>"
	},
	"number-zero-one": {
		syntax: "<number [0,1]>"
	},
	"oklab()": {
		syntax: "oklab() | oklab(from <color> <relative-lab-component>{3} [ / [ <alpha-value> | none ] ]? )"
	},
	"oklch()": {
		syntax: "oklch() | oklch(from <color> <relative-lch-component>{2} [ <hue> | none | l | c | h ] [ / [ <alpha-value> | none ] ]? )"
	},
	paint: {
		syntax: "none | <color> | <url> [ none | <color> ]? | context-fill | context-stroke"
	},
	"paint()": {
		syntax: "paint()"
	},
	"palette-mix()": {
		syntax: "palette-mix( <color-interpolation-method>? , [ <'font-palette'> && <percentage [0,100]>? ]# )"
	},
	"param()": {
		syntax: "param( <param-spec> [ ':' <declaration-value>? ]? ) <param-spec>Info about the '<param-spec>' reference.#typedef-param-specReferenced in:2.1. The param() Function (2) (3) Possible linking"
	},
	"perspective()": {
		syntax: "perspective( [ <length [0,∞]> | none ] )"
	},
	"pointer()": {
		syntax: "pointer( [ <source> || <axis> ]? ) <axis>Info about the '<axis>' reference.#typedef-axisReferenced in:2.3.1. The pointer() notation (2) 2.3.2. The PointerTimeline Interface Possible linking"
	},
	"pointerdown()": {
		syntax: "pointerdown()"
	},
	"pointerenter()": {
		syntax: "pointerenter()"
	},
	"pointerleave()": {
		syntax: "pointerleave()"
	},
	"pointerup()": {
		syntax: "pointerup()"
	},
	position: {
		syntax: "<position-one> | <position-two> | <position-four>"
	},
	"position-area": {
		syntax: "[ [ left | center | right | span-left | span-right | x-start | x-end | span-x-start | span-x-end | x-self-start | x-self-end | span-x-self-start | span-x-self-end | span-all ] || [ top | center | bottom | span-top | span-bottom | y-start | y-end | span-y-start | span-y-end | y-self-start | y-self-end | span-y-self-start | span-y-self-end | span-all ] | [ block-start | center | block-end | span-block-start | span-block-end | span-all ] || [ inline-start | center | inline-end | span-inline-start | span-inline-end | span-all ] | [ self-block-start | center | self-block-end | span-self-block-start | span-self-block-end | span-all ] || [ self-inline-start | center | self-inline-end | span-self-inline-start | span-self-inline-end | span-all ] | [ start | center | end | span-start | span-end | span-all ]{1,2} | [ self-start | center | self-end | span-self-start | span-self-end | span-all ]{1,2} ]"
	},
	"position-four": {
		syntax: "[ [ left | right | x-start | x-end ] <length-percentage> ] && [ [ top | bottom | y-start | y-end ] <length-percentage> ] | [ [ block-start | block-end ] <length-percentage> ] && [ [ inline-start | inline-end ] <length-percentage> ] | [ [ start | end ] <length-percentage> ]{2} "
	},
	"position-one": {
		syntax: "left | center | right | top | bottom | x-start | x-end | y-start | y-end | block-start | block-end | inline-start | inline-end | <length-percentage> "
	},
	"position-three": {
		syntax: "[ left | center | right ] && [ [ top | bottom ] <length-percentage> ] | [ [ left | right ] <length-percentage> ] && [ top | center | bottom ] "
	},
	"position-two": {
		syntax: "[ left | center | right | x-start | x-end ] && [ top | center | bottom | y-start | y-end ] | [ left | center | right | x-start | x-end | <length-percentage> ] [ top | center | bottom | y-start | y-end | <length-percentage> ] | [ block-start | center | block-end ] && [ inline-start | center | inline-end ] | [ start | center | end ]{2} "
	},
	"pow()": {
		syntax: "pow( <calc-sum>, <calc-sum> )"
	},
	"predefined-rgb-params": {
		syntax: "<predefined-rgb> [ <number> | <percentage> | none ]{3}"
	},
	"progress()": {
		syntax: "progress(no-clamp? <calc-sum>, <calc-sum>, <calc-sum>)"
	},
	"pseudo-compound-selector": {
		syntax: " <pseudo-element-selector> <pseudo-class-selector>*"
	},
	"pseudo-element-selector": {
		syntax: "':' <pseudo-class-selector> | <legacy-pseudo-element-selector>"
	},
	"query-in-parens": {
		syntax: "( <container-query> ) | ( <size-feature> ) | style( <style-query> ) | scroll-state( <scroll-state-query> ) | <general-enclosed>"
	},
	"radial-gradient()": {
		syntax: "radial-gradient( [ <radial-gradient-syntax> ] ) <radial-gradient-syntax>Info about the '<radial-gradient-syntax>' reference.#typedef-radial-gradient-syntaxReferenced in:3.2.1. radial-gradient() Syntax 3.3. Repeating Gradients: the repeating-linear-gradient() and repeating-radial-gradient() notations Possible linking"
	},
	"random-item()": {
		syntax: "random-item( <random-key> , [ <declaration-value>? ]# )"
	},
	"random()": {
		syntax: "random( <random-key>? , <calc-sum>, <calc-sum>, <calc-sum>? )"
	},
	"ray()": {
		syntax: "ray()"
	},
	"relative-hsl-component": {
		syntax: "<number> | <percentage> | none | h | s | l | alpha"
	},
	"relative-hwb-component": {
		syntax: "<number> | <percentage> | none | h | w | b | alpha"
	},
	"relative-lab-component": {
		syntax: "<number> | <percentage> | none | l | a | b | alpha"
	},
	"relative-lch-component": {
		syntax: "<number> | <percentage> | none | l | c | h | alpha"
	},
	"relative-real-selector": {
		syntax: "<combinator>? <complex-real-selector>"
	},
	"relative-real-selector-list": {
		syntax: "<relative-real-selector>#"
	},
	"relative-rgb-component": {
		syntax: "<number> | <percentage> | none | r | g | b | alpha"
	},
	"rem()": {
		syntax: "rem( <calc-sum>, <calc-sum> )"
	},
	"repeating-conic-gradient()": {
		syntax: "repeating-conic-gradient( [ <conic-gradient-syntax> ] )"
	},
	"repeating-linear-gradient()": {
		syntax: "repeating-linear-gradient( [ <linear-gradient-syntax> ] )"
	},
	"repeating-radial-gradient()": {
		syntax: "repeating-radial-gradient( [ <radial-gradient-syntax> ] )"
	},
	"rgb()": {
		syntax: "rgb() | rgb(from <color> <relative-rgb-component>{3} [ / [ <alpha-value> | none] ]? )"
	},
	"rgba()": {
		syntax: "rgba() | rgba(from <color> <relative-rgb-component>{3} [ / [ <alpha-value> | none ] ]? )"
	},
	right: {
		syntax: "<length> | auto"
	},
	"rotate3d()": {
		syntax: "rotate3d( <number> , <number> , <number> , [ <angle> | <zero> ] )"
	},
	"rotateX()": {
		syntax: "rotateX( [ <angle> | <zero> ] )"
	},
	"rotateY()": {
		syntax: "rotateY( [ <angle> | <zero> ] )"
	},
	"rotateZ()": {
		syntax: "rotateZ( [ <angle> | <zero> ] )"
	},
	"round()": {
		syntax: "round( <rounding-strategy>?, <calc-sum>, <calc-sum>? )"
	},
	"running()": {
		syntax: "running()"
	},
	"scale()": {
		syntax: "scale( [ <number> | <percentage> ]#{1,2} )"
	},
	"scale3d()": {
		syntax: "scale3d( [ <number> | <percentage> ]#{3} )"
	},
	"scaleX()": {
		syntax: "scaleX( [ <number> | <percentage> ] )"
	},
	"scaleY()": {
		syntax: "scaleY( [ <number> | <percentage> ] )"
	},
	"scaleZ()": {
		syntax: "scaleZ( [ <number> | <percentage> ] )"
	},
	"scope-end": {
		syntax: "<forgiving-selector-list>"
	},
	"scope-start": {
		syntax: "<forgiving-selector-list>"
	},
	"scroll-state-feature": {
		syntax: "<scroll-state-feature-plain> | <scroll-state-feature-boolean>"
	},
	"scroll-state-feature-boolean": {
		syntax: "stuck | snapped | scrollable | scrolled"
	},
	"scroll-state-feature-plain": {
		syntax: "<scroll-state-feature-stuck> | <scroll-state-feature-snapped> | <scroll-state-feature-scrollable> | <scroll-state-feature-scrolled>"
	},
	"scroll-state-feature-scrollable": {
		syntax: "scrollable : [ none | top | right | bottom | left | block-start | inline-start | block-end | inline-end | x | y | block | inline ]"
	},
	"scroll-state-feature-scrolled": {
		syntax: "scrolled : [ none | top | right | bottom | left | block-start | inline-start | block-end | inline-end | x | y | block | inline ]"
	},
	"scroll-state-feature-snapped": {
		syntax: "snapped : [ none | x | y | block | inline | both ]"
	},
	"scroll-state-feature-stuck": {
		syntax: "stuck : [ none | top | right | bottom | left | block-start | inline-start | block-end | inline-end ]"
	},
	"scroll-state-in-parens": {
		syntax: "( <scroll-state-query> ) | ( <scroll-state-feature> ) | <general-enclosed>"
	},
	"scroll-state-query": {
		syntax: " not <scroll-state-in-parens> | <scroll-state-in-parens> [ [ and <scroll-state-in-parens> ]* | [ or <scroll-state-in-parens> ]* ] | <scroll-state-feature>"
	},
	"scroll-state()": {
		syntax: "scroll-state( <scroll-state-query> )"
	},
	"scroll()": {
		syntax: "scroll( [ <scroller> || <axis> ]? ) <axis>Info about the '<axis>' reference.#typedef-axisReferenced in:2.2.1. The scroll() notation (2) (3) (4) 2.2.2. The ScrollTimeline Interface 3.3.1. The view() notation (2) (3) 3.3.2. The ViewTimeline Interface Possible linking"
	},
	"selector()": {
		syntax: "selector( <complex-selector> )"
	},
	shape: {
		syntax: "rect( <top>, <right>, <bottom>, <left> ) | rect( <top> <right> <bottom> <left> )"
	},
	"sign()": {
		syntax: "sign( <calc-sum> ) <calc-sum>Info about the '<calc-sum>' reference.#typedef-calc-sumReferenced in:10.1. Basic Arithmetic: calc() 10.8. Syntax (2) (3) (4) (5) (6) (7) (8) (9) (10) (11) (12) (13) (14) (15) (16) (17) (18) (19) (20) (21) (22) (23) (24) (25) (26) (27) (28) (29) (30) (31) Possible linking"
	},
	"simple-selector": {
		syntax: "<type-selector> | <subclass-selector>"
	},
	"simple-selector-list": {
		syntax: "<simple-selector>#"
	},
	"sin()": {
		syntax: "sin( <calc-sum> )"
	},
	"size-feature": {
		syntax: "<mf-plain> | <mf-boolean> | <mf-range>"
	},
	"sqrt()": {
		syntax: "sqrt( <calc-sum> )"
	},
	"src()": {
		syntax: "src( <string> <url-modifier>* )"
	},
	"steps()": {
		syntax: "steps()"
	},
	"string()": {
		syntax: "string()"
	},
	"stripes()": {
		syntax: "stripes( <color-stripe># )"
	},
	"style-condition": {
		syntax: "not <style-in-parens> | <style-in-parens> [ [ and <style-in-parens> ]* | [ or <style-in-parens> ]* ]"
	},
	"style-feature": {
		syntax: "<style-feature-plain> | <style-feature-boolean> | <style-range>"
	},
	"style-feature-boolean": {
		syntax: "<style-feature-name>"
	},
	"style-feature-name": {
		syntax: "<ident> |<custom-property-name>"
	},
	"style-feature-plain": {
		syntax: "<style-feature-name> : <style-feature-value>"
	},
	"style-in-parens": {
		syntax: "( <style-query> ) | ( <style-feature> ) | <general-enclosed>"
	},
	"style-query": {
		syntax: "not <style-in-parens> | <style-in-parens> [ [ and <style-in-parens> ]* | [ or <style-in-parens> ]* ] | <style-feature>"
	},
	"style-range": {
		syntax: "<style-range-value> <mf-comparison> <style-range-value> | <style-range-value> <mf-lt> <style-range-value> <mf-lt> <style-range-value> | <style-range-value> <mf-gt> <style-range-value> <mf-gt> <style-range-value>"
	},
	"style-range-value": {
		syntax: "<custom-property-name> | <style-feature-value>"
	},
	"superellipse()": {
		syntax: "superellipse()"
	},
	"supports()": {
		syntax: "supports( <declaration> )"
	},
	"svg-length": {
		syntax: "<percentage> | <length> | <number>"
	},
	"svg-writing-mode": {
		syntax: "lr-tb | rl-tb | tb-rl | lr | rl | tb"
	},
	"symbols()": {
		syntax: "symbols()"
	},
	"syntax-combinator": {
		syntax: "'|'"
	},
	"syntax-component": {
		syntax: "<syntax-single-component> <syntax-multiplier>? | '<' transform-list '>'"
	},
	"syntax-multiplier": {
		syntax: "'#' | '+'"
	},
	"syntax-single-component": {
		syntax: "'<' <syntax-type-name> '>' | <ident>"
	},
	"syntax-string": {
		syntax: "<string>"
	},
	"syntax-type-name": {
		syntax: "angle | color | custom-ident | image | integer | length | length-percentage | number | percentage | resolution | string | time | url | transform-function"
	},
	"tan()": {
		syntax: "tan( <calc-sum> )"
	},
	"target-contrast": {
		syntax: "<wcag2>"
	},
	"target-counter()": {
		syntax: "target-counter()"
	},
	"target-counters()": {
		syntax: "target-counters()"
	},
	"target-text()": {
		syntax: "target-text()"
	},
	top: {
		syntax: "<length> | auto"
	},
	"track-breadth": {
		syntax: "| <-non-standard-size>"
	},
	"transform-interpolate()": {
		syntax: "transform-interpolate( [ <progress-source> && [ by <easing-function> ]? && <easing-function>? ], <input-position>{1,2} : <transform-list>, [ <easing-function>?, <input-position>{1,2} : <transform-list> ]#? )"
	},
	"transform-mix()": {
		syntax: "transform-mix( [ <transform-list> && <percentage [0,100]> ]# )"
	},
	"translate3d()": {
		syntax: "translate3d( <length-percentage> , <length-percentage> , <length> )"
	},
	"translateZ()": {
		syntax: "translateZ( <length> )"
	},
	url: {
		syntax: "url( <string> <url-modifier>* ) | <url-token>"
	},
	"url-modifier": {
		syntax: "<ident> | <function-token> <any-value> )"
	},
	"url-pattern()": {
		syntax: "url-pattern( <string> )"
	},
	"url()": {
		syntax: "url( <string> <url-modifier>* ) | <url-token>"
	},
	"var()": {
		syntax: "var()"
	},
	"view()": {
		syntax: "view( [ <axis> || <'view-timeline-inset'> ]? )"
	},
	wcag2: {
		syntax: "wcag2 | wcag2([<number> | [ aa | aaa ] && large? ])"
	},
	x: {
		syntax: "<number>"
	},
	"xyz-params": {
		syntax: "<xyz-space> [ <number> | <percentage> | none ]{3}"
	},
	"xyz-space": {
		syntax: "xyz | xyz-d50 | xyz-d65"
	},
	y: {
		syntax: "<number>"
	}
};
var types = {
	"<absolute-size>": {
		syntax: "[ xx-small | x-small | small | medium | large | x-large | xx-large | xxx-large ]"
	},
	"<angle-percentage>": {
		syntax: "[ <angle> | <percentage> ]"
	},
	"<antecedent>": {
		syntax: "<declaration-value>"
	},
	"<attr-args>": {
		syntax: "attr( <declaration-value>, <declaration-value>? )"
	},
	"<attr-name>": {
		syntax: "[ <ident-token>? '|' ]? <ident-token>"
	},
	"<attr-type>": {
		syntax: "type( <syntax> ) | raw-string | number | <attr-unit>"
	},
	"<attr-unit>": {
		syntax: "<custom-ident>"
	},
	"<baseline-metric>": {
		syntax: "text-bottom | alphabetic | ideographic | middle | central | mathematical | hanging | text-top"
	},
	"<basic-shape-rect>": {
		syntax: "<inset()> | <rect()> | <xywh()>"
	},
	"<basic-shape>": {
		syntax: "<basic-shape-rect> | <circle()> | <ellipse()> | <polygon()> | <path()> | <shape()>"
	},
	"<bg-position>": {
		syntax: "<position> | <position-three> <position-three>Info about the '<position-three>' reference.#typedef-position-threeReferenced in:2.7. Background Positioning Shorthand: the background-position shorthand property (2) (3) Possible linking"
	},
	"<boolean-expr>": {
		syntax: "not <boolean-expr-group> | <boolean-expr-group> [ [ and <boolean-expr-group> ]* | [ or <boolean-expr-group> ]* ]"
	},
	"<clip-source>": {
		syntax: "<url>"
	},
	"<color-stripe>": {
		syntax: "<color> && [ <length-percentage> | <flex> ]?"
	},
	"<color>": {
		syntax: "<color-base> | currentColor | <system-color> | <contrast-color()> | <device-cmyk()> | <light-dark-color> <color-base>Info about the '<color-base>' reference.#typedef-color-baseReferenced in:2. The <color> syntax Possible linking"
	},
	"<compositing-operator>": {
		syntax: "add | subtract | intersect | exclude"
	},
	"<consequent>": {
		syntax: "<declaration-value>"
	},
	"<dasharray>": {
		syntax: "[ [ <length-percentage> | <number> ]+ ]#"
	},
	"<filter-function>": {
		syntax: "<blur()> | <brightness()> | <contrast()> | <drop-shadow()> | <grayscale()> | <hue-rotate()> | <invert()> | <opacity()> | <sepia()> | <saturate()>"
	},
	"<filter-value-list>": {
		syntax: "[ <filter-function> | <url> ]+"
	},
	"<font-family-name>": {
		syntax: "<string> | <custom-ident>+"
	},
	"<frequency-percentage>": {
		syntax: "[ <frequency> | <percentage> ]"
	},
	"<generic-voice>": {
		syntax: "<age>? <gender> <integer [1,∞]>?"
	},
	"<geometry-box>": {
		syntax: "<shape-box> | fill-box | stroke-box | view-box"
	},
	"<ident-arg>": {
		syntax: "<string> | <integer> | <ident>"
	},
	"<ident-args>": {
		syntax: "ident( <declaration-value> )"
	},
	"<if-args-branch>": {
		syntax: "<declaration-value> : <declaration-value>?"
	},
	"<if-args>": {
		syntax: "if( [ <if-args-branch> ; ]* <if-args-branch> ;? )"
	},
	"<if-branch>": {
		syntax: "<if-condition> : <declaration-value>?"
	},
	"<if-condition>": {
		syntax: "<boolean-expr[ <if-test> ]> | else"
	},
	"<if-test>": {
		syntax: "supports( [ <ident> : <declaration-value> ] | <supports-condition> ) | media( <media-feature> | <media-condition> ) | style( <style-query> )"
	},
	"<image-1D>": {
		syntax: "<stripes()>"
	},
	"<inherit-args>": {
		syntax: "inherit( <declaration-value>, <declaration-value>? )"
	},
	"<keyframe-block>": {
		syntax: "<keyframe-selector># { <declaration-list> }"
	},
	"<keyframe-selector>": {
		syntax: "from | to | <percentage [0,100]>"
	},
	"<keyframes-name>": {
		syntax: "<custom-ident> | <string>"
	},
	"<length-percentage>": {
		syntax: "[ <length> | <percentage> ]"
	},
	"<marker-ref>": {
		syntax: "<url>"
	},
	"<mask-layer>": {
		syntax: "<mask-reference> || <position> [ / <bg-size> ]? || <repeat-style> || <geometry-box> || [ <geometry-box> | no-clip ] || <compositing-operator> || <masking-mode>"
	},
	"<mask-reference>": {
		syntax: "none | <image> | <mask-source>"
	},
	"<mask-source>": {
		syntax: "<url>"
	},
	"<masking-mode>": {
		syntax: "alpha | luminance | match-source"
	},
	"<number-optional-number>": {
		syntax: "<number> <number>?"
	},
	"<paint>": {
		syntax: "none | <color> | <url> [none | <color>]? | context-fill | context-stroke"
	},
	"<points>": {
		syntax: "[ <number>+ ]#"
	},
	"<position-four>": {
		syntax: "[ [ [ left | right | x-start | x-end ] <length-percentage> ] && [ [ top | bottom | y-start | y-end ] <length-percentage> ] | [ [ block-start | block-end ] <length-percentage> ] && [ [ inline-start | inline-end ] <length-percentage> ] | [ [ start | end ] <length-percentage> ]{2} ]"
	},
	"<position-one>": {
		syntax: "[ left | center | right | top | bottom | x-start | x-end | y-start | y-end | block-start | block-end | inline-start | inline-end | <length-percentage> ]"
	},
	"<position-two>": {
		syntax: "[ [ left | center | right | x-start | x-end ] && [ top | center | bottom | y-start | y-end ] | [ left | center | right | x-start | x-end | <length-percentage> ] [ top | center | bottom | y-start | y-end | <length-percentage> ] | [ block-start | center | block-end ] && [ inline-start | center | inline-end ] | [ start | center | end ]{2} ]"
	},
	"<position>": {
		syntax: "<position-one> | <position-two> | <position-four>"
	},
	"<progress-source>": {
		syntax: "<percentage> | <number> | <dimension> | <'animation-timeline'>"
	},
	"<random-cache-key>": {
		syntax: "<dashed-ident> || element-scoped || [ property-scoped | property-index-scoped | <random-ua-ident> ]"
	},
	"<random-item-args>": {
		syntax: "random-item( <declaration-value>, [ <declaration-value>? ]# )"
	},
	"<random-key>": {
		syntax: "auto | <random-cache-key> | fixed <number [0,1]>"
	},
	"<random-ua-ident>": {
		syntax: "<custom-ident>"
	},
	"<ratio>": {
		syntax: "<number [0,∞]> [ / <number [0,∞]> ]?"
	},
	"<relative-size>": {
		syntax: "[ larger | smaller ]"
	},
	"<request-url-modifier>": {
		syntax: "<cross-origin-modifier> | <integrity-modifier> | <referrer-policy-modifier>"
	},
	"<rounding-strategy>": {
		syntax: "nearest | up | down | to-zero | line-width"
	},
	"<shape-box>": {
		syntax: "<visual-box> | margin-box | half-border-box"
	},
	"<shape-command>": {
		syntax: "<move-command> | <line-command> | close | <horizontal-line-command> | <vertical-line-command> | <curve-command> | <smooth-command> | <arc-command>"
	},
	"<single-animation-composition>": {
		syntax: "replace | add | accumulate"
	},
	"<single-animation-direction>": {
		syntax: "normal | reverse | alternate | alternate-reverse"
	},
	"<single-animation-fill-mode>": {
		syntax: "none | forwards | backwards | both"
	},
	"<single-animation-iteration-count>": {
		syntax: "infinite | <number [0,∞]>"
	},
	"<single-animation-play-state>": {
		syntax: "running | paused"
	},
	"<single-animation-timeline>": {
		syntax: "auto | none | <dashed-ident> | <scroll()> | <view()>"
	},
	"<single-animation>": {
		syntax: "<'animation-duration'> || <easing-function> || <'animation-delay-start'> || <single-animation-iteration-count> || <single-animation-direction> || <single-animation-fill-mode> || <single-animation-play-state> || [ none | <keyframes-name> ] || <single-animation-timeline>"
	},
	"<single-transition-property>": {
		syntax: "all | <custom-ident>"
	},
	"<single-transition>": {
		syntax: "[ none | <single-transition-property> ] || <time> || <easing-function> || <time> || <transition-behavior-value>"
	},
	"<source-size-list>": {
		syntax: "<source-size>#? , <source-size-value>"
	},
	"<source-size-value>": {
		syntax: "<length> | auto"
	},
	"<source-size>": {
		syntax: "<media-condition> <source-size-value> | auto"
	},
	"<syntax-combinator>": {
		syntax: "'|'"
	},
	"<syntax-component>": {
		syntax: "<syntax-single-component> <syntax-multiplier>? | '<' transform-list '>'"
	},
	"<syntax-multiplier>": {
		syntax: "[ '#' | '+' ]"
	},
	"<syntax-single-component>": {
		syntax: "'<' <syntax-type-name> '>' | <ident>"
	},
	"<syntax-string>": {
		syntax: "<string>"
	},
	"<syntax-type-name>": {
		syntax: "angle | color | custom-ident | image | integer | length | length-percentage | number | percentage | resolution | string | time | url | transform-function"
	},
	"<syntax>": {
		syntax: "'*' | <syntax-component> [ <syntax-combinator> <syntax-component> ]* | <syntax-string>"
	},
	"<system-font-family-name>": {
		syntax: "caption | icon | menu | message-box | small-caption | status-bar"
	},
	"<target-contrast>": {
		syntax: "<wcag2>"
	},
	"<text-edge>": {
		syntax: "[ text | ideographic | ideographic-ink ] | [ text | ideographic | ideographic-ink | cap | ex ] [ text | ideographic | ideographic-ink | alphabetic ]"
	},
	"<time-percentage>": {
		syntax: "[ <time> | <percentage> ]"
	},
	"<transform-list>": {
		syntax: "<transform-function>+"
	},
	"<transition-behavior-value>": {
		syntax: "normal | allow-discrete"
	}
};
var units = [
	"cap",
	"ch",
	"cm",
	"deg",
	"dpcm",
	"dpi",
	"dppx",
	"em",
	"ex",
	"fr",
	"grad",
	"Hz",
	"ic",
	"in",
	"kHz",
	"mm",
	"ms",
	"pc",
	"pt",
	"px",
	"Q",
	"rad",
	"rem",
	"s",
	"turn",
	"vh",
	"vmax",
	"vmin",
	"vw",
	"x"
];
var config = {
	atRules: atRules,
	declarations: declarations,
	languages: languages,
	mediaFeatures: mediaFeatures,
	selectors: selectors,
	syntaxes: syntaxes,
	types: types,
	units: units
};

export { atRules, declarations, config as default, languages, mediaFeatures, selectors, syntaxes, types, units };
