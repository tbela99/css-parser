/* 
	CSS parser, minifier and validator for node and the browser

	Author(s): Thierry Bela
	Version: 2.1.0
	License: MIT
 */
var atRules = {
	"@annotation": {
		syntax: "@annotation { <declaration-list> }"
	},
	"@apply": {
		syntax: " @apply [ <dashed-ident> | <dashed-function> ] [ { <declaration-list> } ]?;"
	},
	"@bottom-center": {
		syntax: "@bottom-center { <declaration-list> };"
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
		syntax: "@container <container-condition># { <rule-list> }",
		descriptors: {
			"aspect-ratio": "<ratio>",
			"block-size": "<length>",
			fallback: "none | [ [<dashed-ident> || <try-tactic>] | <position-area-query> ]",
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
		syntax: " @contents [ { <declaration-list> } ]?;"
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
	"@custom-selector": {
		syntax: "@custom-selector <custom-selector> <selector-list> ;"
	},
	"@document": {
		syntax: "@document [ <url> | url-prefix(<string>) | domain(<string>) | media-document(<string>) | regexp(<string>) ]# {\n  <group-rule-body>\n}"
	},
	"@else": {
		syntax: " @else <when-condition>? {\n <group-rule-body>\n}"
	},
	"@font-face": {
		syntax: "@font-face { <declaration-list> }",
		descriptors: {
			"ascent-override": "[ normal | <percentage [0,∞]> ]{1,2}",
			"descent-override": "[ normal | <percentage [0,∞]> ]{1,2}",
			"font-display": "auto | block | swap | fallback | optional",
			"font-family": "<font-family-name>",
			"font-feature-settings": "normal | <feature-tag-value>#",
			"font-language-override": "normal | <string>",
			"font-named-instance": "auto | <string>",
			"font-size": "auto | [<number>]{1,2}",
			"font-style": "auto | normal | italic | left | right | oblique [ <angle [-90deg,90deg]>{1,2} ]?",
			"font-variation-settings": "normal | [ <string> <number>]#",
			"font-weight": "auto | <font-weight-absolute>{1,2}",
			"font-width": "auto | <'font-width'>{1,2}",
			"line-gap-override": "[ normal | <percentage [0,∞]> ]{1,2}",
			"size-adjust": "<percentage [0,∞]>",
			src: "<font-src-list>",
			"subscript-position-override": "[ normal | from-font | <percentage> ]{1,2}",
			"subscript-size-override": "[ normal | from-font | <percentage [0,∞]> ]{1,2}",
			"superscript-position-override": "[ normal | from-font | <percentage> ]{1,2}",
			"superscript-size-override": "[ normal | from-font | <percentage [0,∞]> ]{1,2}",
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
		syntax: "@function <function-token> <function-parameter>#? ) [ returns <css-type> ]? { <declaration-rule-list> }",
		descriptors: {
			result: "<declaration-value>?"
		}
	},
	"@historical-forms": {
		syntax: " @historical-forms { <declaration-list> }"
	},
	"@import": {
		syntax: "@import [ <url> | <string> ] [[ layer | layer( <layer-name> ) ] || [ scope | scope( <scope-start> | <scope-boundaries> ) ] || <supports-import-condition>]? <media-import-condition> ;"
	},
	"@keyframes": {
		syntax: "@keyframes <keyframes-name> { <qualified-rule-list> }"
	},
	"@layer": {
		syntax: "@layer [ <layer-name># | <layer-name>?  {\n  <stylesheet>\n} ]"
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
	"@location": {
		syntax: "<location-rule>"
	},
	"@media": {
		syntax: "@media <media-query-list> { <rule-list> }"
	},
	"@mixin": {
		syntax: "@mixin [ <function-token> <function-parameter>#? ) | <dashed-ident> ] { <block-contents> }"
	},
	"@namespace": {
		syntax: "@namespace <namespace-prefix>? [ <string> | <url> ] ;"
	},
	"@navigation": {
		syntax: "@navigation <navigation-condition> { <rule-list> }"
	},
	"@ornaments": {
		syntax: "@ornaments { <declaration-list> }"
	},
	"@page": {
		syntax: "@page <page-selector-list>? { <declaration-rule-list> }",
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
		syntax: "@property <custom-property-name># { <declaration-list> }",
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
	"@starting-style": {
		syntax: "@starting-style {\n  <declaration-list> | <group-rule-body>\n}"
	},
	"@styleset": {
		syntax: "@styleset { <declaration-list> }"
	},
	"@stylistic": {
		syntax: "@stylistic { <declaration-list> }"
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
		syntax: "@value [ <declaration> | [ <ident># from <ident> ] ]"
	},
	"@view-transition": {
		syntax: "@view-transition { <declaration-list> }",
		descriptors: {
			navigation: "auto | none",
			types: "none | <view-transition-type>+"
		}
	},
	"@when": {
		syntax: " @when <when-condition> {\n <group-rule-body>\n}"
	}
};
var declarations = {
	"-moz-appearance": {
		syntax: "none | button | button-arrow-down | button-arrow-next | button-arrow-previous | button-arrow-up | button-bevel | button-focus | caret | checkbox | checkbox-container | checkbox-label | checkmenuitem | dualbutton | groupbox | listbox | listitem | menuarrow | menubar | menucheckbox | menuimage | menuitem | menuitemtext | menulist | menulist-button | menulist-text | menulist-textfield | menupopup | menuradio | menuseparator | meterbar | meterchunk | progressbar | progressbar-vertical | progresschunk | progresschunk-vertical | radio | radio-container | radio-label | radiomenuitem | range | range-thumb | resizer | resizerpanel | scale-horizontal | scalethumbend | scalethumb-horizontal | scalethumbstart | scalethumbtick | scalethumb-vertical | scale-vertical | scrollbarbutton-down | scrollbarbutton-left | scrollbarbutton-right | scrollbarbutton-up | scrollbarthumb-horizontal | scrollbarthumb-vertical | scrollbartrack-horizontal | scrollbartrack-vertical | searchfield | separator | sheet | spinner | spinner-downbutton | spinner-textfield | spinner-upbutton | splitter | statusbar | statusbarpanel | tab | tabpanel | tabpanels | tab-scroll-arrow-back | tab-scroll-arrow-forward | textfield | textfield-multiline | toolbar | toolbarbutton | toolbarbutton-dropdown | toolbargripper | toolbox | tooltip | treeheader | treeheadercell | treeheadersortarrow | treeitem | treeline | treetwisty | treetwistyopen | treeview | -moz-mac-unified-toolbar | -moz-win-borderless-glass | -moz-win-browsertabbar-toolbox | -moz-win-communicationstext | -moz-win-communications-toolbox | -moz-win-exclude-glass | -moz-win-glass | -moz-win-mediatext | -moz-win-media-toolbox | -moz-window-button-box | -moz-window-button-box-maximized | -moz-window-button-close | -moz-window-button-maximize | -moz-window-button-minimize | -moz-window-button-restore | -moz-window-frame-bottom | -moz-window-frame-left | -moz-window-frame-right | -moz-window-titlebar | -moz-window-titlebar-maximized"
	},
	"-moz-background-clip": {
		syntax: "padding | border"
	},
	"-moz-binding": {
		syntax: "<url> | none"
	},
	"-moz-border-bottom-colors": {
		syntax: "<color>+ | none"
	},
	"-moz-border-left-colors": {
		syntax: "<color>+ | none"
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
	"-moz-border-right-colors": {
		syntax: "<color>+ | none"
	},
	"-moz-border-top-colors": {
		syntax: "<color>+ | none"
	},
	"-moz-context-properties": {
		syntax: "none | [ fill | fill-opacity | stroke | stroke-opacity ]#"
	},
	"-moz-control-character-visibility": {
		syntax: "visible | hidden"
	},
	"-moz-float-edge": {
		syntax: "border-box | content-box | margin-box | padding-box"
	},
	"-moz-force-broken-image-icon": {
		syntax: "0 | 1"
	},
	"-moz-orient": {
		syntax: "inline | block | horizontal | vertical"
	},
	"-moz-osx-font-smoothing": {
		syntax: "auto | grayscale"
	},
	"-moz-outline-radius": {
		syntax: "<outline-radius>{1,4} [ / <outline-radius>{1,4} ]?"
	},
	"-moz-outline-radius-bottomleft": {
		syntax: "<outline-radius>"
	},
	"-moz-outline-radius-bottomright": {
		syntax: "<outline-radius>"
	},
	"-moz-outline-radius-topleft": {
		syntax: "<outline-radius>"
	},
	"-moz-outline-radius-topright": {
		syntax: "<outline-radius>"
	},
	"-moz-padding-start": {
		syntax: "<'padding-top'>"
	},
	"-moz-stack-sizing": {
		syntax: "ignore | stretch-to-fit"
	},
	"-moz-text-blink": {
		syntax: "none | blink"
	},
	"-moz-user-focus": {
		syntax: "ignore | normal | select-after | select-before | select-menu | select-same | select-all | none"
	},
	"-moz-user-input": {
		syntax: "auto | none | enabled | disabled"
	},
	"-moz-user-modify": {
		syntax: "read-only | read-write | write-only"
	},
	"-moz-user-select": {
		syntax: "none | text | all | -moz-none | auto"
	},
	"-moz-window-dragging": {
		syntax: "drag | no-drag"
	},
	"-moz-window-shadow": {
		syntax: "default | menu | tooltip | sheet | none"
	},
	"-ms-accelerator": {
		syntax: "false | true"
	},
	"-ms-block-progression": {
		syntax: "tb | rl | bt | lr"
	},
	"-ms-content-zoom-chaining": {
		syntax: "none | chained"
	},
	"-ms-content-zoom-limit": {
		syntax: "<'-ms-content-zoom-limit-min'> <'-ms-content-zoom-limit-max'>"
	},
	"-ms-content-zoom-limit-max": {
		syntax: "<percentage>"
	},
	"-ms-content-zoom-limit-min": {
		syntax: "<percentage>"
	},
	"-ms-content-zoom-snap": {
		syntax: "<'-ms-content-zoom-snap-type'> || <'-ms-content-zoom-snap-points'>"
	},
	"-ms-content-zoom-snap-points": {
		syntax: "snapInterval( <percentage>, <percentage> ) | snapList( <percentage># )"
	},
	"-ms-content-zoom-snap-type": {
		syntax: "none | proximity | mandatory"
	},
	"-ms-content-zooming": {
		syntax: "none | zoom"
	},
	"-ms-filter": {
		syntax: " <string>"
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
	"-ms-flow-from": {
		syntax: "[ none | <custom-ident> ]#"
	},
	"-ms-flow-into": {
		syntax: "[ none | <custom-ident> ]#"
	},
	"-ms-grid-column-align": {
		syntax: "start | end | center | stretch"
	},
	"-ms-grid-columns": {
		syntax: "none | <track-list> | <auto-track-list>"
	},
	"-ms-grid-row-align": {
		syntax: "start | end | center | stretch"
	},
	"-ms-grid-rows": {
		syntax: "none | <track-list> | <auto-track-list>"
	},
	"-ms-high-contrast-adjust": {
		syntax: "auto | none"
	},
	"-ms-hyphenate-limit-chars": {
		syntax: "auto | <integer>{1,3}"
	},
	"-ms-hyphenate-limit-last": {
		syntax: "none | always | column | page | spread"
	},
	"-ms-hyphenate-limit-lines": {
		syntax: "no-limit | <integer>"
	},
	"-ms-hyphenate-limit-zone": {
		syntax: "<percentage> | <length>"
	},
	"-ms-ime-align": {
		syntax: "auto | after"
	},
	"-ms-interpolation-mode": {
		syntax: "nearest-neighbor | bicubic"
	},
	"-ms-overflow-style": {
		syntax: " auto | none | scrollbar | -ms-autohiding-scrollbar"
	},
	"-ms-scroll-chaining": {
		syntax: "chained | none"
	},
	"-ms-scroll-limit": {
		syntax: "<'-ms-scroll-limit-x-min'> <'-ms-scroll-limit-y-min'> <'-ms-scroll-limit-x-max'> <'-ms-scroll-limit-y-max'>"
	},
	"-ms-scroll-limit-x-max": {
		syntax: "auto | <length>"
	},
	"-ms-scroll-limit-x-min": {
		syntax: "<length>"
	},
	"-ms-scroll-limit-y-max": {
		syntax: "auto | <length>"
	},
	"-ms-scroll-limit-y-min": {
		syntax: "<length>"
	},
	"-ms-scroll-rails": {
		syntax: "none | railed"
	},
	"-ms-scroll-snap-points-x": {
		syntax: "snapInterval( <length-percentage>, <length-percentage> ) | snapList( <length-percentage># )"
	},
	"-ms-scroll-snap-points-y": {
		syntax: "snapInterval( <length-percentage>, <length-percentage> ) | snapList( <length-percentage># )"
	},
	"-ms-scroll-snap-type": {
		syntax: "none | proximity | mandatory"
	},
	"-ms-scroll-snap-x": {
		syntax: "<'-ms-scroll-snap-type'> <'-ms-scroll-snap-points-x'>"
	},
	"-ms-scroll-snap-y": {
		syntax: "<'-ms-scroll-snap-type'> <'-ms-scroll-snap-points-y'>"
	},
	"-ms-scroll-translation": {
		syntax: "none | vertical-to-horizontal"
	},
	"-ms-scrollbar-3dlight-color": {
		syntax: "<color>"
	},
	"-ms-scrollbar-arrow-color": {
		syntax: "<color>"
	},
	"-ms-scrollbar-base-color": {
		syntax: "<color>"
	},
	"-ms-scrollbar-darkshadow-color": {
		syntax: "<color>"
	},
	"-ms-scrollbar-face-color": {
		syntax: "<color>"
	},
	"-ms-scrollbar-highlight-color": {
		syntax: "<color>"
	},
	"-ms-scrollbar-shadow-color": {
		syntax: "<color>"
	},
	"-ms-scrollbar-track-color": {
		syntax: "<color>"
	},
	"-ms-text-autospace": {
		syntax: "none | ideograph-alpha | ideograph-numeric | ideograph-parenthesis | ideograph-space"
	},
	"-ms-touch-select": {
		syntax: "grippers | none"
	},
	"-ms-user-select": {
		syntax: "none | element | text"
	},
	"-ms-wrap-flow": {
		syntax: "auto | both | start | end | maximum | clear"
	},
	"-ms-wrap-margin": {
		syntax: "<length>"
	},
	"-ms-wrap-through": {
		syntax: "wrap | none"
	},
	"-webkit-align-content": {
		alias: "align-content"
	},
	"-webkit-align-items": {
		alias: "align-items"
	},
	"-webkit-align-self": {
		alias: "align-self"
	},
	"-webkit-animation": {
		alias: "animation"
	},
	"-webkit-animation-delay": {
		alias: "animation-delay"
	},
	"-webkit-animation-direction": {
		alias: "animation-direction"
	},
	"-webkit-animation-duration": {
		alias: "animation-duration"
	},
	"-webkit-animation-fill-mode": {
		alias: "animation-fill-mode"
	},
	"-webkit-animation-iteration-count": {
		alias: "animation-iteration-count"
	},
	"-webkit-animation-name": {
		alias: "animation-name"
	},
	"-webkit-animation-play-state": {
		alias: "animation-play-state"
	},
	"-webkit-animation-timing-function": {
		alias: "animation-timing-function"
	},
	"-webkit-appearance": {
		syntax: "<'appearance'> | none | button | button-bevel | caps-lock-indicator | caret | checkbox | default-button | inner-spin-button | listbox | listitem | media-controls-background | media-controls-fullscreen-background | media-current-time-display | media-enter-fullscreen-button | media-exit-fullscreen-button | media-fullscreen-button | media-mute-button | media-overlay-play-button | media-play-button | media-seek-back-button | media-seek-forward-button | media-slider | media-sliderthumb | media-time-remaining-display | media-toggle-closed-captions-button | media-volume-slider | media-volume-slider-container | media-volume-sliderthumb | menulist | menulist-button | menulist-text | menulist-textfield | meter | progress-bar | progress-bar-value | push-button | radio | scrollbarbutton-down | scrollbarbutton-left | scrollbarbutton-right | scrollbarbutton-up | scrollbargripper-horizontal | scrollbargripper-vertical | scrollbarthumb-horizontal | scrollbarthumb-vertical | scrollbartrack-horizontal | scrollbartrack-vertical | searchfield | searchfield-cancel-button | searchfield-decoration | searchfield-results-button | searchfield-results-decoration | slider-horizontal | slider-vertical | sliderthumb-horizontal | sliderthumb-vertical | square-button | textarea | textfield | -apple-pay-button"
	},
	"-webkit-backface-visibility": {
		alias: "backface-visibility"
	},
	"-webkit-background-clip": {
		syntax: "<'background-clip'> | [ <bg-clip> | border | padding | content | text ]#"
	},
	"-webkit-background-origin": {
		alias: "background-origin"
	},
	"-webkit-background-size": {
		alias: "background-size"
	},
	"-webkit-border-after": {
		syntax: "<'border-top'>"
	},
	"-webkit-border-after-color": {
		syntax: "<'border-top-color'>"
	},
	"-webkit-border-after-style": {
		syntax: "<'border-top-style'>"
	},
	"-webkit-border-after-width": {
		syntax: "<'border-top-width'>"
	},
	"-webkit-border-before": {
		syntax: "<'border-top'>"
	},
	"-webkit-border-before-color": {
		syntax: "<'border-top-color'>"
	},
	"-webkit-border-before-style": {
		syntax: "<'border-top-style'>"
	},
	"-webkit-border-before-width": {
		syntax: "<'border-top-width'>"
	},
	"-webkit-border-bottom-left-radius": {
		alias: "border-bottom-left-radius"
	},
	"-webkit-border-bottom-right-radius": {
		alias: "border-bottom-right-radius"
	},
	"-webkit-border-end": {
		syntax: "<'border-top'>"
	},
	"-webkit-border-end-color": {
		syntax: "<'border-top-color'>"
	},
	"-webkit-border-end-style": {
		syntax: "<'border-top-style'>"
	},
	"-webkit-border-end-width": {
		syntax: "<'border-top-width'>"
	},
	"-webkit-border-radius": {
		alias: "border-radius"
	},
	"-webkit-border-start": {
		syntax: "<'border-top'>"
	},
	"-webkit-border-start-color": {
		syntax: "<'border-top-color'>"
	},
	"-webkit-border-start-style": {
		syntax: "<'border-top-style'>"
	},
	"-webkit-border-start-width": {
		syntax: "<'border-top-width'>"
	},
	"-webkit-border-top-left-radius": {
		alias: "border-top-left-radius"
	},
	"-webkit-border-top-right-radius": {
		alias: "border-top-right-radius"
	},
	"-webkit-box-reflect": {
		syntax: "[ above | below | right | left ]? <length>? <image>?"
	},
	"-webkit-box-shadow": {
		alias: "box-shadow"
	},
	"-webkit-box-sizing": {
		alias: "box-sizing"
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
	"-webkit-filter": {
		alias: "filter"
	},
	"-webkit-flex": {
		alias: "flex"
	},
	"-webkit-flex-basis": {
		alias: "flex-basis"
	},
	"-webkit-flex-direction": {
		alias: "flex-direction"
	},
	"-webkit-flex-flow": {
		alias: "flex-flow"
	},
	"-webkit-flex-grow": {
		alias: "flex-grow"
	},
	"-webkit-flex-shrink": {
		alias: "flex-shrink"
	},
	"-webkit-flex-wrap": {
		alias: "flex-wrap"
	},
	"-webkit-font-smoothing": {
		syntax: "auto | none | antialiased | subpixel-antialiased"
	},
	"-webkit-justify-content": {
		alias: "justify-content"
	},
	"-webkit-line-clamp": {
		syntax: "none | <integer [1,∞]>"
	},
	"-webkit-margin-end": {
		syntax: "<'margin-block-end'>"
	},
	"-webkit-mask": {
		syntax: "<'mask'> | [ <mask-reference> || <position> [ / <bg-size> ]? || <repeat-style> || [ <geometry-box> | border | padding | content | text ] || [ <geometry-box> | no-clip | border | padding | content | text ] || [ <compositing-operator> | <composite-style> ] || <masking-mode> ]#"
	},
	"-webkit-mask-attachment": {
		syntax: "<attachment>#"
	},
	"-webkit-mask-box-image": {
		syntax: "<'mask-border'> | [ <url> | <gradient> | none ] [ <length-percentage>{4} <-webkit-mask-box-repeat>{2} ]?"
	},
	"-webkit-mask-box-image-outset": {
		alias: "mask-border-outset"
	},
	"-webkit-mask-box-image-repeat": {
		alias: "mask-border-repeat"
	},
	"-webkit-mask-box-image-slice": {
		alias: "mask-border-slice"
	},
	"-webkit-mask-box-image-source": {
		alias: "mask-border-source"
	},
	"-webkit-mask-box-image-width": {
		alias: "mask-border-width"
	},
	"-webkit-mask-clip": {
		syntax: "<'mask-clip'> | [ <coord-box> | no-clip | border | padding | content | text ]#"
	},
	"-webkit-mask-composite": {
		syntax: "<'mask-composite'> | [ <compositing-operator> | <composite-style> ]#"
	},
	"-webkit-mask-image": {
		alias: "mask-image"
	},
	"-webkit-mask-origin": {
		syntax: "<'mask-origin'> | [ <coord-box> | border | padding | content ]#"
	},
	"-webkit-mask-position": {
		alias: "mask-position"
	},
	"-webkit-mask-position-x": {
		syntax: "[ <length-percentage> | left | center | right ]#"
	},
	"-webkit-mask-position-y": {
		syntax: "[ <length-percentage> | top | center | bottom ]#"
	},
	"-webkit-mask-repeat": {
		alias: "mask-repeat"
	},
	"-webkit-mask-repeat-x": {
		syntax: "repeat | no-repeat | space | round"
	},
	"-webkit-mask-repeat-y": {
		syntax: "repeat | no-repeat | space | round"
	},
	"-webkit-mask-size": {
		alias: "mask-size"
	},
	"-webkit-order": {
		alias: "order"
	},
	"-webkit-overflow-scrolling": {
		syntax: "auto | touch"
	},
	"-webkit-perspective": {
		alias: "perspective"
	},
	"-webkit-perspective-origin": {
		alias: "perspective-origin"
	},
	"-webkit-print-color-adjust": {
		syntax: "economy | exact"
	},
	"-webkit-tap-highlight-color": {
		syntax: "<color>"
	},
	"-webkit-text-fill-color": {
		syntax: "<color>"
	},
	"-webkit-text-security": {
		syntax: "none | circle | disc | square"
	},
	"-webkit-text-size-adjust": {
		alias: "text-size-adjust"
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
	"-webkit-touch-callout": {
		syntax: "default | none"
	},
	"-webkit-transform": {
		alias: "transform"
	},
	"-webkit-transform-origin": {
		alias: "transform-origin"
	},
	"-webkit-transform-style": {
		alias: "transform-style"
	},
	"-webkit-transition": {
		alias: "transition"
	},
	"-webkit-transition-delay": {
		alias: "transition-delay"
	},
	"-webkit-transition-duration": {
		alias: "transition-duration"
	},
	"-webkit-transition-property": {
		alias: "transition-property"
	},
	"-webkit-transition-timing-function": {
		alias: "transition-timing-function"
	},
	"-webkit-user-drag": {
		syntax: "none | element | auto"
	},
	"-webkit-user-modify": {
		syntax: "read-only | read-write | read-write-plaintext-only"
	},
	"-webkit-user-select": {
		syntax: "auto | text | none | contain | all"
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
		syntax: "auto | <overflow-position>? [ normal | <self-position> ]| stretch | <baseline-position> | anchor-center"
	},
	"align-tracks": {
		syntax: "[ normal | <baseline-position> | <content-distribution> | <overflow-position>? <content-position> ]#"
	},
	"alignment-baseline": {
		syntax: "baseline | <baseline-metric>"
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
		syntax: "<bg-layer>#? , <final-bg-layer>"
	},
	"background-attachment": {
		syntax: "<attachment>#"
	},
	"background-blend-mode": {
		syntax: "<'mix-blend-mode'>#"
	},
	"background-clip": {
		syntax: "<bg-clip>#"
	},
	"background-color": {
		syntax: "<color>"
	},
	"background-image": {
		syntax: "<bg-image>#"
	},
	"background-origin": {
		syntax: "<visual-box>#"
	},
	"background-position": {
		syntax: "<bg-position>#"
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
		syntax: "<repeat-style>#"
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
		syntax: "<length-percentage> | sub | super | top | center | bottom"
	},
	"baseline-source": {
		syntax: "auto | first | last"
	},
	behavior: {
		syntax: "<url>+"
	},
	"block-ellipsis": {
		syntax: "no-ellipsis | auto | <string>"
	},
	"block-size": {
		syntax: "auto | <box-size> | <anchor-size()>"
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
		syntax: "<line-width> || <line-style> || <color>"
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
		syntax: "<line-width> || <line-style> || <color>"
	},
	"border-block-end-clip": {
		syntax: "none | [ <length-percentage [0,∞]> | <flex> ]+"
	},
	"border-block-end-color": {
		syntax: "<color> | <image-1D>"
	},
	"border-block-end-radius": {
		syntax: "<length-percentage [0,∞]>{1,2} [ / <length-percentage [0,∞]>{1,2} ]?"
	},
	"border-block-end-style": {
		syntax: "<line-style>"
	},
	"border-block-end-width": {
		syntax: "<line-width>"
	},
	"border-block-start": {
		syntax: "<line-width> || <line-style> || <color>"
	},
	"border-block-start-clip": {
		syntax: "none | [ <length-percentage [0,∞]> | <flex> ]+"
	},
	"border-block-start-color": {
		syntax: "<color> | <image-1D>"
	},
	"border-block-start-radius": {
		syntax: "<length-percentage [0,∞]>{1,2} [ / <length-percentage [0,∞]>{1,2} ]?"
	},
	"border-block-start-style": {
		syntax: "<line-style>"
	},
	"border-block-start-width": {
		syntax: "<line-width>"
	},
	"border-block-style": {
		syntax: "<'border-top-style'>{1,2}"
	},
	"border-block-width": {
		syntax: "<'border-top-width'>{1,2}"
	},
	"border-bottom": {
		syntax: "<line-width> || <line-style> || <color>"
	},
	"border-bottom-clip": {
		syntax: "none | [ <length-percentage [0,∞]> | <flex> ]+"
	},
	"border-bottom-color": {
		syntax: "<color> | <image-1D>"
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
		syntax: "<line-style>"
	},
	"border-bottom-width": {
		syntax: "<line-width>"
	},
	"border-boundary": {
		syntax: "none | parent | display"
	},
	"border-clip": {
		syntax: "<'border-top-clip'>"
	},
	"border-collapse": {
		syntax: "separate | collapse"
	},
	"border-color": {
		syntax: "[ <color> | <image-1D> ]{1,4}"
	},
	"border-end-end-radius": {
		syntax: "<border-radius>"
	},
	"border-end-start-radius": {
		syntax: "<border-radius>"
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
		syntax: "<line-width> || <line-style> || <color>"
	},
	"border-inline-end-clip": {
		syntax: "none | [ <length-percentage [0,∞]> | <flex> ]+"
	},
	"border-inline-end-color": {
		syntax: "<color> | <image-1D>"
	},
	"border-inline-end-radius": {
		syntax: "<length-percentage [0,∞]>{1,2} [ / <length-percentage [0,∞]>{1,2} ]?"
	},
	"border-inline-end-style": {
		syntax: "<line-style>"
	},
	"border-inline-end-width": {
		syntax: "<line-width>"
	},
	"border-inline-start": {
		syntax: "<line-width> || <line-style> || <color>"
	},
	"border-inline-start-clip": {
		syntax: "none | [ <length-percentage [0,∞]> | <flex> ]+"
	},
	"border-inline-start-color": {
		syntax: "<color> | <image-1D>"
	},
	"border-inline-start-radius": {
		syntax: "<length-percentage [0,∞]>{1,2} [ / <length-percentage [0,∞]>{1,2} ]?"
	},
	"border-inline-start-style": {
		syntax: "<line-style>"
	},
	"border-inline-start-width": {
		syntax: "<line-width>"
	},
	"border-inline-style": {
		syntax: "<'border-top-style'>{1,2}"
	},
	"border-inline-width": {
		syntax: "<'border-top-width'>{1,2}"
	},
	"border-left": {
		syntax: "<line-width> || <line-style> || <color>"
	},
	"border-left-clip": {
		syntax: "none | [ <length-percentage [0,∞]> | <flex> ]+"
	},
	"border-left-color": {
		syntax: "<color> | <image-1D>"
	},
	"border-left-radius": {
		syntax: "<length-percentage [0,∞]>{1,2} [ / <length-percentage [0,∞]>{1,2} ]?"
	},
	"border-left-style": {
		syntax: "<line-style>"
	},
	"border-left-width": {
		syntax: "<line-width>"
	},
	"border-limit": {
		syntax: "all | [ sides | corners ] <length-percentage [0,∞]>? | [ top | right | bottom | left ] <length-percentage [0,∞]>"
	},
	"border-radius": {
		syntax: "<length-percentage [0,∞]>{1,4} [ / <length-percentage [0,∞]>{1,4} ]?"
	},
	"border-right": {
		syntax: "<line-width> || <line-style> || <color>"
	},
	"border-right-clip": {
		syntax: "none | [ <length-percentage [0,∞]> | <flex> ]+"
	},
	"border-right-color": {
		syntax: "<color> | <image-1D>"
	},
	"border-right-radius": {
		syntax: "<length-percentage [0,∞]>{1,2} [ / <length-percentage [0,∞]>{1,2} ]?"
	},
	"border-right-style": {
		syntax: "<line-style>"
	},
	"border-right-width": {
		syntax: "<line-width>"
	},
	"border-shape": {
		syntax: "none | [ <basic-shape> <geometry-box>?]{1,2}"
	},
	"border-spacing": {
		syntax: "<length [0,∞]>{1,2}"
	},
	"border-start-end-radius": {
		syntax: "<border-radius>"
	},
	"border-start-start-radius": {
		syntax: "<border-radius>"
	},
	"border-style": {
		syntax: "<'border-top-style'>{1,4}"
	},
	"border-top": {
		syntax: "<line-width> || <line-style> || <color>"
	},
	"border-top-clip": {
		syntax: "none | [ <length-percentage [0,∞]> | <flex> ]+"
	},
	"border-top-color": {
		syntax: "<color> | <image-1D>"
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
		syntax: "<line-style>"
	},
	"border-top-width": {
		syntax: "<line-width>"
	},
	"border-width": {
		syntax: "<'border-top-width'>{1,4}"
	},
	bottom: {
		syntax: "auto | <length-percentage> | <anchor()> | <anchor-size()>"
	},
	"box-align": {
		syntax: "start | center | end | baseline | stretch"
	},
	"box-decoration-break": {
		syntax: "slice | clone"
	},
	"box-direction": {
		syntax: "normal | reverse | inherit"
	},
	"box-flex": {
		syntax: "<number>"
	},
	"box-flex-group": {
		syntax: "<integer>"
	},
	"box-lines": {
		syntax: "single | multiple"
	},
	"box-ordinal-group": {
		syntax: "<integer>"
	},
	"box-orient": {
		syntax: "horizontal | vertical | inline-axis | block-axis | inherit"
	},
	"box-pack": {
		syntax: "start | center | end | justify"
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
		syntax: "top | bottom"
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
		syntax: "inline-start | inline-end | block-start | block-end | left | right | top | bottom | both-inline | both-block | both | none"
	},
	clip: {
		syntax: "rect( <top>, <right>, <bottom>, <left> ) | auto | rect( <top> <right> <bottom> <left> )"
	},
	"clip-path": {
		syntax: "<clip-source> | [ <basic-shape> || <geometry-box> ] | none"
	},
	"clip-rule": {
		syntax: "nonzero | evenodd"
	},
	color: {
		syntax: "<color>"
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
		syntax: "normal | none | [ <content-replacement> | [ [ <string> | <image> | <attr()> | contents | <quote> | <leader()> | <target> | <string()> | <content()> | <counter> | <symbolic-counter-style> ]+ ] ] [/ [ <string> | <counter> | <attr()> ]+ ]? | <element()>"
	},
	"content-visibility": {
		syntax: "visible | auto | hidden"
	},
	"continue": {
		syntax: "auto | discard | collapse | -webkit-legacy | overflow | paginate | fragments"
	},
	"copy-into": {
		syntax: "none | [ [ <custom-ident> <content-level>] [, <custom-ident> <content-level>]* ]?"
	},
	corner: {
		syntax: "<'border-radius'> || <'corner-shape'>"
	},
	"corner-block-end": {
		syntax: "<'border-top-radius'> || <'corner-top-shape'>"
	},
	"corner-block-end-shape": {
		syntax: "<'corner-top-left-shape'>{1,2}"
	},
	"corner-block-start": {
		syntax: "<'border-top-radius'> || <'corner-top-shape'>"
	},
	"corner-block-start-shape": {
		syntax: "<'corner-top-left-shape'>{1,2}"
	},
	"corner-bottom": {
		syntax: "<'border-top-radius'> || <'corner-top-shape'>"
	},
	"corner-bottom-left": {
		syntax: "<'border-top-left-radius'> || <'corner-top-left-shape'>"
	},
	"corner-bottom-left-shape": {
		syntax: "<corner-shape-value>"
	},
	"corner-bottom-right": {
		syntax: "<'border-top-left-radius'> || <'corner-top-left-shape'>"
	},
	"corner-bottom-right-shape": {
		syntax: "<corner-shape-value>"
	},
	"corner-bottom-shape": {
		syntax: "<'corner-top-left-shape'>{1,2}"
	},
	"corner-end-end": {
		syntax: "<'border-top-left-radius'> || <'corner-top-left-shape'>"
	},
	"corner-end-end-shape": {
		syntax: "<corner-shape-value>"
	},
	"corner-end-start": {
		syntax: "<'border-top-left-radius'> || <'corner-top-left-shape'>"
	},
	"corner-end-start-shape": {
		syntax: "<corner-shape-value>"
	},
	"corner-inline-end": {
		syntax: "<'border-top-radius'> || <'corner-top-shape'>"
	},
	"corner-inline-end-shape": {
		syntax: "<'corner-top-left-shape'>{1,2}"
	},
	"corner-inline-start": {
		syntax: "<'border-top-radius'> || <'corner-top-shape'>"
	},
	"corner-inline-start-shape": {
		syntax: "<'corner-top-left-shape'>{1,2}"
	},
	"corner-left": {
		syntax: "<'border-top-radius'> || <'corner-top-shape'>"
	},
	"corner-left-shape": {
		syntax: "<'corner-top-left-shape'>{1,2}"
	},
	"corner-right": {
		syntax: "<'border-top-radius'> || <'corner-top-shape'>"
	},
	"corner-right-shape": {
		syntax: "<'corner-top-left-shape'>{1,2}"
	},
	"corner-shape": {
		syntax: "<'corner-top-left-shape'>{1,4}"
	},
	"corner-start-end": {
		syntax: "<'border-top-left-radius'> || <'corner-top-left-shape'>"
	},
	"corner-start-end-shape": {
		syntax: "<corner-shape-value>"
	},
	"corner-start-start": {
		syntax: "<'border-top-left-radius'> || <'corner-top-left-shape'>"
	},
	"corner-start-start-shape": {
		syntax: "<corner-shape-value>"
	},
	"corner-top": {
		syntax: "<'border-top-radius'> || <'corner-top-shape'>"
	},
	"corner-top-left": {
		syntax: "<'border-top-left-radius'> || <'corner-top-left-shape'>"
	},
	"corner-top-left-shape": {
		syntax: "<corner-shape-value>"
	},
	"corner-top-right": {
		syntax: "<'border-top-left-radius'> || <'corner-top-left-shape'>"
	},
	"corner-top-right-shape": {
		syntax: "<corner-shape-value>"
	},
	"corner-top-shape": {
		syntax: "<'corner-top-left-shape'>{1,2}"
	},
	"counter-increment": {
		syntax: "[ <counter-name> <integer>? ]+ | none"
	},
	"counter-reset": {
		syntax: "[ <counter-name> <integer>? | <reversed-counter-name> <integer>? ]+ | none"
	},
	"counter-set": {
		syntax: "[ <counter-name> <integer>? ]+ | none"
	},
	cue: {
		syntax: "<'cue-before'> <'cue-after'>?"
	},
	"cue-after": {
		syntax: "<url> <decibel>? | none"
	},
	"cue-before": {
		syntax: "<url> <decibel>? | none"
	},
	cursor: {
		syntax: "[<cursor-image>,]* <cursor-predefined>"
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
		syntax: "ltr | rtl"
	},
	display: {
		syntax: "[ <display-outside> || <display-inside> ] | <display-listitem> | <display-internal> | <display-box> | <display-legacy> | grid-lanes | inline-grid-lanes | <display-outside> || [ <display-inside> | math ] | <-non-standard-display>"
	},
	"dominant-baseline": {
		syntax: "auto | <baseline-metric>"
	},
	"dynamic-range-limit": {
		syntax: "standard | no-limit | constrained | <dynamic-range-limit-mix()>"
	},
	"empty-cells": {
		syntax: "show | hide"
	},
	"event-trigger": {
		syntax: "none | [ <'event-trigger-name'> <'event-trigger-source'> ]#"
	},
	"event-trigger-name": {
		syntax: "none | <dashed-ident>#"
	},
	"event-trigger-source": {
		syntax: "[ none | <event-trigger-event>+ [ / <event-trigger-event>+ ]? ]#"
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
		syntax: "<'opacity'>"
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
		syntax: "block-start | block-end | inline-start | inline-end | snap-block | <snap-block()> | snap-inline | <snap-inline()> | left | right | top | bottom | none | footnote"
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
	"flow-tolerance": {
		syntax: "normal | <length-percentage [0,∞]> | infinite"
	},
	font: {
		syntax: "[ [ <'font-style'> || <font-variant-css2> || <'font-weight'> || <font-width-css3> ]? <'font-size'> [ / <'line-height'> ]? <'font-family'># ] | <system-font-family-name> | [ <'font-size'> [ / <'line-height'> ]? <'font-family'># ]"
	},
	"font-family": {
		syntax: "[ <font-family-name> | <generic-font-family> ]#"
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
		syntax: "<absolute-size> | <relative-size> | <length-percentage [0,∞]> | math"
	},
	"font-size-adjust": {
		syntax: "none | [ ex-height | cap-height | ch-width | ic-width | ic-height ]? [ from-font | <number [0,∞]> ]"
	},
	"font-smooth": {
		syntax: "auto | never | always | <absolute-size> | <length>"
	},
	"font-style": {
		syntax: "normal | italic | left | right | oblique <angle [-90deg,90deg]>?"
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
		syntax: "normal | none | [ [ <common-lig-values> || <discretionary-lig-values> || <historical-lig-values> || <contextual-alt-values> ] || [ small-caps | all-small-caps | petite-caps | all-petite-caps | unicase | titling-caps ] || [ stylistic(<font-feature-value-name>) || historical-forms || styleset(<font-feature-value-name>#) || character-variant(<font-feature-value-name>#) || swash(<font-feature-value-name>) || ornaments(<font-feature-value-name>) || annotation(<font-feature-value-name>) ] || [ <numeric-figure-values> || <numeric-spacing-values> || <numeric-fraction-values> || ordinal || slashed-zero ] || [ <east-asian-variant-values> || <east-asian-width-values> || ruby ] || [ sub | super ] || [ text | emoji | unicode ] ]"
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
		syntax: "<font-weight-absolute> | bolder | lighter"
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
		syntax: "auto | 0deg | 90deg | 0 | 90"
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
		syntax: "auto | <box-size> | <anchor-size()> | stretch | <-non-standard-size>"
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
		syntax: "auto | smooth | high-quality | pixelated | crisp-edges | optimizeSpeed | optimizeQuality | <-non-standard-image-rendering>"
	},
	"image-resolution": {
		syntax: "[ from-image || <resolution> ] && snap?"
	},
	"ime-mode": {
		syntax: "auto | normal | active | inactive | disabled"
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
		syntax: "auto | <box-size> | <anchor-size()>"
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
		syntax: "auto | <overflow-position>? [ normal | <self-position> | left | right ] | stretch | <baseline-position> | anchor-center"
	},
	"justify-tracks": {
		syntax: "[ normal | <content-distribution> | <overflow-position>? [ <content-position> | left | right ] ]#"
	},
	kerning: {
		syntax: "auto | <svg-length>"
	},
	left: {
		syntax: "auto | <length-percentage> | <anchor()> | <anchor-size()>"
	},
	"letter-spacing": {
		syntax: "normal | <length-percentage>"
	},
	"lighting-color": {
		syntax: "<color>"
	},
	"line-break": {
		syntax: "auto | loose | normal | strict | anywhere"
	},
	"line-clamp": {
		syntax: "none | [<integer [1,∞]> || <'block-ellipsis'>] -webkit-legacy?"
	},
	"line-fit-edge": {
		syntax: "leading | <text-edge>"
	},
	"line-grid": {
		syntax: "match-parent | create"
	},
	"line-height": {
		syntax: "normal | <number [0,∞]> | <length-percentage [0,∞]>"
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
		syntax: "<'list-style-position'> || <'list-style-image'> || <'list-style-type'>"
	},
	"list-style-image": {
		syntax: "<image> | none"
	},
	"list-style-position": {
		syntax: "inside | outside"
	},
	"list-style-type": {
		syntax: "<counter-style> | <string> | none"
	},
	margin: {
		syntax: "<'margin-top'>{1,4}"
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
		syntax: "<length-percentage> | auto | <anchor-size()>"
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
		syntax: "<length-percentage> | auto | <anchor-size()>"
	},
	"margin-right": {
		syntax: "<length-percentage> | auto | <anchor-size()>"
	},
	"margin-top": {
		syntax: "<length-percentage> | auto | <anchor-size()>"
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
	"masonry-auto-flow": {
		syntax: "[ pack | next ] || [ definite-first | ordered ]"
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
		syntax: "none | <box-size> | <anchor-size()>"
	},
	"max-height": {
		syntax: "none | <box-size> | <anchor-size()> | stretch | <-non-standard-size>"
	},
	"max-inline-size": {
		syntax: "none | <box-size> | <anchor-size()>"
	},
	"max-lines": {
		syntax: "none | <integer [1,∞]>"
	},
	"max-size": {
		syntax: "<'max-width'> <'max-height'>?"
	},
	"max-width": {
		syntax: "none | <box-size> | <anchor-size()> | stretch | <-non-standard-size>"
	},
	"min-block-size": {
		syntax: "auto | <box-size> | <anchor-size()>"
	},
	"min-height": {
		syntax: "auto | <box-size> | <anchor-size()> | stretch | <-non-standard-size>"
	},
	"min-inline-size": {
		syntax: "auto | <box-size> | <anchor-size()>"
	},
	"min-intrinsic-sizing": {
		syntax: "legacy | zero-if-scroll || zero-if-extrinsic"
	},
	"min-size": {
		syntax: "<'min-width'> <'min-height'>?"
	},
	"min-width": {
		syntax: "auto | <box-size> | <anchor-size()> | stretch | <-non-standard-size>"
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
		syntax: "<integer [1,∞]>"
	},
	outline: {
		syntax: "<'outline-width'> || <'outline-style'> || <'outline-color'>"
	},
	"outline-color": {
		syntax: "auto | <'border-top-color'>"
	},
	"outline-offset": {
		syntax: "<length>"
	},
	"outline-style": {
		syntax: "auto | <outline-line-style>"
	},
	"outline-width": {
		syntax: "<line-width>"
	},
	overflow: {
		syntax: "<'overflow-block'>{1,2} | <-non-standard-overflow>"
	},
	"overflow-anchor": {
		syntax: "auto | none"
	},
	"overflow-block": {
		syntax: "visible | hidden | clip | scroll | auto | <-non-standard-overflow>"
	},
	"overflow-clip-box": {
		syntax: "padding-box | content-box"
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
		syntax: "<'padding-top'>{1,4}"
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
		syntax: "<length-percentage [0,∞]>"
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
		syntax: "<length-percentage [0,∞]>"
	},
	"padding-right": {
		syntax: "<length-percentage [0,∞]>"
	},
	"padding-top": {
		syntax: "<length-percentage [0,∞]>"
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
		syntax: "none | <length> [0,∞]"
	},
	pause: {
		syntax: "<'pause-before'> <'pause-after'>?"
	},
	"pause-after": {
		syntax: "<time [0s,∞]> | none | x-weak | weak | medium | strong | x-strong"
	},
	"pause-before": {
		syntax: "<time [0s,∞]> | none | x-weak | weak | medium | strong | x-strong"
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
		syntax: "static | relative | absolute | sticky | fixed | <running()> | -webkit-sticky"
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
		syntax: "auto | none | match-parent | [ <string> <string> ]+"
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
		syntax: "<'rest-before'> <'rest-after'>?"
	},
	"rest-after": {
		syntax: "<time [0s,∞]> | none | x-weak | weak | medium | strong | x-strong"
	},
	"rest-before": {
		syntax: "<time [0s,∞]> | none | x-weak | weak | medium | strong | x-strong"
	},
	right: {
		syntax: "auto | <length-percentage> | <anchor()> | <anchor-size()>"
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
	"scroll-snap-coordinate": {
		syntax: "none | <position>#"
	},
	"scroll-snap-destination": {
		syntax: "<position>"
	},
	"scroll-snap-points-x": {
		syntax: "none | repeat( <length-percentage> )"
	},
	"scroll-snap-points-y": {
		syntax: "none | repeat( <length-percentage> )"
	},
	"scroll-snap-stop": {
		syntax: "normal | always"
	},
	"scroll-snap-type": {
		syntax: "none | [ x | y | block | inline | both | pair ] [ mandatory | proximity ]?"
	},
	"scroll-snap-type-x": {
		syntax: "none | mandatory | proximity"
	},
	"scroll-snap-type-y": {
		syntax: "none | mandatory | proximity"
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
		syntax: "auto | never | always"
	},
	"speak-as": {
		syntax: "normal | spell-out || digits || [ literal-punctuation | no-punctuation ]"
	},
	"stop-color": {
		syntax: "<'color'>"
	},
	"stop-opacity": {
		syntax: "<'opacity'>"
	},
	"string-set": {
		syntax: "none | [ <custom-ident> <string>+ ]#"
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
		syntax: "none | [<length-percentage> | <number>]+#"
	},
	"stroke-dashcorner": {
		syntax: "none | <length>"
	},
	"stroke-dashoffset": {
		syntax: "<length-percentage> | <number>"
	},
	"stroke-image": {
		syntax: "<paint>#"
	},
	"stroke-linecap": {
		syntax: "butt | round | square"
	},
	"stroke-linejoin": {
		syntax: "[ crop | arcs | miter ] || [ bevel | round | fallback ] | arcs | crop | fallback | miter-clip"
	},
	"stroke-miterlimit": {
		syntax: "<number>"
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
		syntax: "auto | fixed"
	},
	"text-align": {
		syntax: "start | end | left | right | center | <string> | justify | match-parent | justify-all | <-non-standard-text-align>"
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
		syntax: "<'text-decoration-line'> || <'text-decoration-thickness'> || <'text-decoration-style'> || <'text-decoration-color'>"
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
		syntax: "[ <length-percentage> ] && hanging? && each-line?"
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
		syntax: "none | [capitalize | uppercase | lowercase ] || full-width || full-size-kana | math-auto"
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
		syntax: "none | [ <'timeline-trigger-name'> <'timeline-trigger-source'> <'timeline-trigger-activation-range'> [ / <'timeline-trigger-active-range'> ]? ]#"
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
	"timeline-trigger-source": {
		syntax: "[ none | auto | [ <dashed-ident> | <scroll()> | <view()> ]+ ]#"
	},
	top: {
		syntax: "auto | <length-percentage> | <anchor()> | <anchor-size()>"
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
		syntax: "normal | embed | isolate | bidi-override | isolate-override | plaintext | -moz-isolate | -moz-isolate-override | -moz-plaintext | -webkit-isolate | -webkit-isolate-override | -webkit-plaintext"
	},
	"user-select": {
		syntax: "auto | text | none | contain | all"
	},
	"vector-effect": {
		syntax: "none | non-scaling-stroke | non-scaling-size | non-rotation | fixed-position"
	},
	"vertical-align": {
		syntax: "[ first | last] || <'alignment-baseline'> || <'baseline-shift'>"
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
		syntax: "visible | hidden | force-hidden | collapse"
	},
	"voice-balance": {
		syntax: "<number> | left | center | right | leftwards | rightwards"
	},
	"voice-duration": {
		syntax: "auto | <time [0s,∞]>"
	},
	"voice-family": {
		syntax: "[ <voice-family-name> | <generic-voice> ]# | preserve"
	},
	"voice-pitch": {
		syntax: "<frequency [0Hz,∞]> && absolute | [ [ x-low | low | medium | high | x-high ] || [ <frequency [0Hz,∞]> | <semitones> | <percentage> ] ]"
	},
	"voice-range": {
		syntax: "<frequency [0Hz,∞]> && absolute | [ [ x-low | low | medium | high | x-high ] || [ <frequency [0Hz,∞]> | <semitones> | <percentage> ] ]"
	},
	"voice-rate": {
		syntax: "[ normal | x-slow | slow | medium | fast | x-fast ] || <percentage [0,∞]>"
	},
	"voice-stress": {
		syntax: "normal | strong | moderate | none | reduced"
	},
	"voice-volume": {
		syntax: "silent | [ [ x-soft | soft | medium | loud | x-loud ] || <decibel> ]"
	},
	"white-space": {
		syntax: "normal | pre | pre-wrap | pre-line | <'white-space-collapse'> || <'text-wrap-mode'> || <'white-space-trim'>"
	},
	"white-space-collapse": {
		syntax: "collapse | discard | preserve | preserve-breaks | preserve-spaces | break-spaces"
	},
	"white-space-trim": {
		syntax: "none | discard-before || discard-after || discard-inner"
	},
	widows: {
		syntax: "<integer [1,∞]>"
	},
	width: {
		syntax: "auto | <box-size> | <anchor-size()> | stretch | <-non-standard-size>"
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
		syntax: "normal | <length-percentage>"
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
	"::-moz-progress-bar": {
		syntax: "::-moz-progress-bar"
	},
	"::-moz-range-progress": {
		syntax: "::-moz-range-progress"
	},
	"::-moz-range-thumb": {
		syntax: "::-moz-range-thumb"
	},
	"::-moz-range-track": {
		syntax: "::-moz-range-track"
	},
	"::-ms-browse": {
		syntax: "::-ms-browse"
	},
	"::-ms-check": {
		syntax: "::-ms-check"
	},
	"::-ms-clear": {
		syntax: "::-ms-clear"
	},
	"::-ms-expand": {
		syntax: "::-ms-expand"
	},
	"::-ms-fill": {
		syntax: "::-ms-fill"
	},
	"::-ms-fill-lower": {
		syntax: "::-ms-fill-lower"
	},
	"::-ms-fill-upper": {
		syntax: "::-ms-fill-upper"
	},
	"::-ms-reveal": {
		syntax: "::-ms-reveal"
	},
	"::-ms-thumb": {
		syntax: "::-ms-thumb"
	},
	"::-ms-ticks-after": {
		syntax: "::-ms-ticks-after"
	},
	"::-ms-ticks-before": {
		syntax: "::-ms-ticks-before"
	},
	"::-ms-tooltip": {
		syntax: "::-ms-tooltip"
	},
	"::-ms-track": {
		syntax: "::-ms-track"
	},
	"::-ms-value": {
		syntax: "::-ms-value"
	},
	"::-webkit-progress-bar": {
		syntax: "::-webkit-progress-bar"
	},
	"::-webkit-progress-inner-value": {
		syntax: "::-webkit-progress-inner-value"
	},
	"::-webkit-progress-value": {
		syntax: "::-webkit-progress-value"
	},
	"::-webkit-slider-runnable-track": {
		syntax: "::-webkit-slider-runnable-track"
	},
	"::-webkit-slider-thumb": {
		syntax: "::-webkit-slider-thumb"
	},
	"::after": {
		syntax: "::after"
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
		syntax: "::highlight(<custom-ident>)"
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
		syntax: "::picker( <form-control-identifier>+ )"
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
	"::slotted()": {
		syntax: "::slotted( <compound-selector> )"
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
	"::view-transition-group()": {
		syntax: "::view-transition-group([ '*' | <custom-ident> ])"
	},
	"::view-transition-image-pair()": {
		syntax: "::view-transition-image-pair([ '*' | <custom-ident> ])"
	},
	"::view-transition-new()": {
		syntax: "::view-transition-new([ '*' | <custom-ident> ])"
	},
	"::view-transition-old()": {
		syntax: "::view-transition-old([ '*' | <custom-ident> ])"
	},
	":active": {
		syntax: ":active"
	},
	":active-view-transition": {
		syntax: ":active-view-transition"
	},
	":active-view-transition-type()": {
		syntax: ":active-view-transition-type( <custom-ident># )"
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
	":dir()": {
		syntax: ":dir( [ ltr | rtl ] )"
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
	":has()": {
		syntax: ":has( <forgiving-relative-selector-list> )"
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
	":host-context()": {
		syntax: ":host-context( <compound-selector> )"
	},
	":host()": {
		syntax: ":host( <compound-selector> )"
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
	":is()": {
		syntax: ":is( <forgiving-selector-list> )"
	},
	":lang()": {
		syntax: ":lang( <language-code> )"
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
	":not()": {
		syntax: ":not( <complex-selector-list> )"
	},
	":nth-child()": {
		syntax: ":nth-child( <an+b> [ of <complex-selector-list> ]? )"
	},
	":nth-col()": {
		syntax: ":nth-col(An+B)"
	},
	":nth-last-child()": {
		syntax: ":nth-last-child( <an+b> [ of <complex-selector-list> ]? )"
	},
	":nth-last-col()": {
		syntax: ":nth-last-col(An+B)"
	},
	":nth-last-of-type()": {
		syntax: ":nth-last-of-type( <an+b> )"
	},
	":nth-of-page()": {
		syntax: ":nth-of-page(n)"
	},
	":nth-of-type()": {
		syntax: ":nth-of-type( <an+b> )"
	},
	":nth()": {
		syntax: ":nth( <a-n-plus-b> [of <custom-ident>]? )"
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
	":target-within": {
		syntax: ":target-within"
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
	":where()": {
		syntax: ":where( <complex-selector-list> )"
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
	"alpha()": {
		syntax: " alpha([from <color>] [ / [<alpha-value> | none] ]? )"
	},
	"anchor-size()": {
		syntax: "anchor-size( [ <anchor-name> || <anchor-size> ]? , <length-percentage>? )"
	},
	"anchor()": {
		syntax: "anchor( <anchor-name>? && <anchor-side>, <length-percentage>? )"
	},
	"animation-action": {
		syntax: "none | play | play-once | play-forwards | play-backwards | pause | reset | replay"
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
	"attr()": {
		syntax: "attr( <attr-name> <attr-type>? , <declaration-value>?)"
	},
	"blur()": {
		syntax: "blur( <length>? )"
	},
	bottom: {
		syntax: "<length> | auto"
	},
	"brightness()": {
		syntax: "brightness( [ <number> | <percentage> ]? )"
	},
	"calc-interpolate()": {
		syntax: "calc-interpolate( [ <progress-source> && [ by <easing-function> ]? && <easing-function>? ] , <input-position>{1,2} : <calc-sum> , [ <easing-function>? , <input-position>{1,2} : <calc-sum> ]#? )"
	},
	"calc-mix()": {
		syntax: "calc-mix( [ <calc-sum> <percentage [0,100]>? ]# )"
	},
	"calc-size()": {
		syntax: "calc-size( <calc-size-basis>, <calc-sum> )"
	},
	"calc()": {
		syntax: "calc( <calc-sum> )"
	},
	"circle()": {
		syntax: "circle( <radial-size>? [ at <position> ]? )"
	},
	"clamp()": {
		syntax: "clamp( [ <calc-sum> | none ], <calc-sum>, [ <calc-sum> | none ] )"
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
	"color()": {
		syntax: "color( [from <color>]? <colorspace-params> [ / [ <alpha-value> | none ] ]? )"
	},
	"composes-selector": {
		syntax: "<ident>+ [from [global&&<string>]]?"
	},
	"composite-style": {
		syntax: "clear | copy | source-over | source-in | source-out | source-atop | destination-over | destination-in | destination-out | destination-atop | xor"
	},
	"conic-gradient()": {
		syntax: "conic-gradient( [ <conic-gradient-syntax> ] )"
	},
	"content()": {
		syntax: "content( [ text | before | after | first-letter | marker ]? )"
	},
	"contrast-color()": {
		syntax: "contrast-color( [ [ <color> && [ tbd-fg | tbd-bg ] && <target-contrast>? ] | [ <color> && [ tbd-fg | tbd-bg ] && <target-contrast>, <color># ] ] )"
	},
	"contrast()": {
		syntax: "contrast( [ <number> | <percentage> ]? )"
	},
	"control-value()": {
		syntax: "control-value( <type>? )"
	},
	"cos()": {
		syntax: "cos( <calc-sum> )"
	},
	"counter()": {
		syntax: "counter( <counter-name>, <counter-style>? )"
	},
	"counters()": {
		syntax: "counters( <counter-name>, <string>, <counter-style>? )"
	},
	"cross-fade()": {
		syntax: "cross-fade( <cf-image># )"
	},
	"cubic-bezier()": {
		syntax: "cubic-bezier( [ <number [0,1]>, <number> ]#{2} )"
	},
	"cycle()": {
		syntax: "cycle( <whole-value># )"
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
	"drop-shadow()": {
		syntax: "drop-shadow( [ <color>? && <length>{2,3} ] )"
	},
	"dynamic-range-limit-mix()": {
		syntax: "dynamic-range-limit-mix( [ <'dynamic-range-limit'> && <percentage [0,100]> ]# )"
	},
	"element()": {
		syntax: "element( <id-selector> )"
	},
	"ellipse()": {
		syntax: "ellipse( <radial-size>? [ at <position> ]? )"
	},
	"env()": {
		syntax: "env( <custom-ident> <integer [0,∞]>* , <declaration-value>? )"
	},
	"exp()": {
		syntax: "exp( <calc-sum> )"
	},
	"fade()": {
		syntax: "fade( [ <length-percentage> ] )"
	},
	"family-name": {
		syntax: "<string> | <custom-ident>+"
	},
	"filter()": {
		syntax: "filter( [ <image> | <string> ], <filter-value-list> )"
	},
	"first-valid()": {
		syntax: "first-valid( <declaration-value># )"
	},
	"fit-content()": {
		syntax: "fit-content( <length-percentage> )"
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
	"font-format-values": {
		syntax: "collection | embedded-opentype | opentype | truetype | svg | woff | woff2"
	},
	"font-format()": {
		syntax: "font-format(<font-format-values>)"
	},
	"font-src-list": {
		syntax: "<font-src>#"
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
	gender: {
		syntax: "male | female | neutral"
	},
	"generic-complete": {
		syntax: "serif | sans-serif | system-ui | cursive | fantasy | math | monospace"
	},
	"generic-family": {
		syntax: "<generic-script-specific>| <generic-complete> | <generic-incomplete> | <-non-standard-generic-family>"
	},
	"generic-incomplete": {
		syntax: "ui-serif | ui-sans-serif | ui-monospace | ui-rounded"
	},
	"generic-script-specific": {
		syntax: "generic(kai) | generic(fangsong) | generic(nastaliq)"
	},
	"grayscale()": {
		syntax: "grayscale( [ <number> | <percentage> ]? )"
	},
	"hdr-color()": {
		syntax: "color-hdr([ <color> && <number [0,∞]>? ]#{2})"
	},
	"hsl()": {
		syntax: "[ <legacy-hsl-syntax> | <modern-hsl-syntax> ] | hsl(from <color> [ <hue> | none | h | s | l ] <relative-hsl-component>{2} [ / [ <alpha-value> | none] ]? )"
	},
	"hsla()": {
		syntax: "[ <legacy-hsla-syntax> | <modern-hsla-syntax> ] | hsla(from <color> < [ <hue> | none | h | s | l ] <relative-hsl-component>{2} [ / [ <alpha-value> | none ] ]? )"
	},
	"hue-rotate()": {
		syntax: "hue-rotate( [ <angle> | <zero> ]? )"
	},
	"hwb()": {
		syntax: "hwb([from <color>]? [<hue> | none] [<percentage> | <number> | none] [<percentage> | <number> | none] [ / [<alpha-value> | none] ]? ) | hwb(from <color> [ <hue> | none | h | w | b ] <relative-hwb-component>{2} [ / [ <alpha-value> | none] ]? )"
	},
	"hypot()": {
		syntax: "hypot( <calc-sum># )"
	},
	"ictcp()": {
		syntax: "ictcp([from <color>]? [<percentage> | <number> | none] [<percentage> | <number> | none] [<percentage> | <number> | none] [ / [<alpha-value> | none] ]? )"
	},
	id: {
		syntax: "<id-selector>"
	},
	"ident()": {
		syntax: "ident( <ident-arg>+ )"
	},
	"if()": {
		syntax: "if( [ <if-branch> ; ]* )"
	},
	"image-set()": {
		syntax: "image-set( <image-set-option># )"
	},
	"image()": {
		syntax: "image( <image-tags>? [ <image-src>? , <color>? ]! )"
	},
	"inherit()": {
		syntax: "inherit( <custom-property-name>, <declaration-value>? )"
	},
	"inset-area": {
		syntax: "[ [ left | center | right | span-left | span-right | x-start | x-end | span-x-start | span-x-end | x-self-start | x-self-end | span-x-self-start | span-x-self-end | span-all ] || [ top | center | bottom | span-top | span-bottom | y-start | y-end | span-y-start | span-y-end | y-self-start | y-self-end | span-y-self-start | span-y-self-end | span-all ] | [ block-start | center | block-end | span-block-start | span-block-end | span-all ] || [ inline-start | center | inline-end | span-inline-start | span-inline-end | span-all ] | [ self-block-start | self-block-end | span-self-block-start | span-self-block-end | span-all ] || [ self-inline-start | self-inline-end | span-self-inline-start | span-self-inline-end | span-all ] | [ start | center | end | span-start | span-end | span-all ]{1,2} | [ self-start | center | self-end | span-self-start | span-self-end | span-all ]{1,2} ]"
	},
	"inset()": {
		syntax: "inset( <length-percentage>{1,4} [ round <'border-radius'> ]? )"
	},
	"interpolate()": {
		syntax: "interpolate( [ <progress-source> && [ by <easing-function> ]? && <easing-function>? ] , <input-position>{1,2} : <whole-value>, [ <easing-function>?, <input-position>{1,2} : <whole-value> ]#? ) | interpolate( <progress-source> && [ by <easing-function> ]? && <easing-function>? of <keyframes-name> )"
	},
	"intrinsic-size-keyword": {
		syntax: "min-content | max-content | fit-content"
	},
	"invert()": {
		syntax: "invert( [ <number> | <percentage> ]? )"
	},
	"jzazbz()": {
		syntax: "jzazbz([from <color>]? [<percentage> | <number> | none] [<percentage> | <number> | none] [<percentage> | <number> | none] [ / [<alpha-value> | none] ]? )"
	},
	"jzczhz()": {
		syntax: "jzczhz([from <color>]? [<percentage> | <number> | none] [<percentage> | <number> | none] [<hue> | none] [ / [<alpha-value> | none] ]? )"
	},
	"keyframe-selectors": {
		syntax: "<keyframe-selector>#"
	},
	"lab()": {
		syntax: "lab([from <color>]? [<percentage> | <number> | none] [<percentage> | <number> | none] [<percentage> | <number> | none] [ / [<alpha-value> | none] ]? ) | lab(from <color> <relative-lab-component>{3} [ / [ <alpha-value> | none ] ]? )"
	},
	"lch()": {
		syntax: "lch([from <color>]? [<percentage> | <number> | none] [<percentage> | <number> | none] [<hue> | none] [ / [<alpha-value> | none] ]? ) | lch(from <color> <relative-lch-component>{2} [ <hue> | none | l | c | h ] [ / [ <alpha-value> | none ] ]? )"
	},
	"leader()": {
		syntax: "leader( <leader-type> )"
	},
	left: {
		syntax: "<length> | auto"
	},
	level: {
		syntax: "<integer>"
	},
	"light-dark()": {
		syntax: "<light-dark-color> | <light-dark-image>"
	},
	"linear-gradient()": {
		syntax: "linear-gradient( [ <linear-gradient-syntax> ] )"
	},
	"linear()": {
		syntax: "linear( [ <number> && <percentage>{0,2} ]# )"
	},
	"log()": {
		syntax: "log( <calc-sum>, <calc-sum>? )"
	},
	"matrix()": {
		syntax: "matrix( <number>#{6} )"
	},
	"matrix3d()": {
		syntax: "matrix3d( <number>#{16} )"
	},
	"max()": {
		syntax: "max( <calc-sum># )"
	},
	"media-query-list": {
		syntax: "<media-query>#"
	},
	"media()": {
		syntax: "media( [ <mf-plain> | <mf-boolean> | <mf-range> ] )"
	},
	"min()": {
		syntax: "min( <calc-sum># )"
	},
	"minmax()": {
		syntax: "minmax(min, max)"
	},
	"mod()": {
		syntax: "mod( <calc-sum>, <calc-sum> )"
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
		syntax: "oklab([from <color>]? [<percentage> | <number> | none] [<percentage> | <number> | none] [<percentage> | <number> | none] [ / [<alpha-value> | none] ]? ) | oklab(from <color> <relative-lab-component>{3} [ / [ <alpha-value> | none ] ]? )"
	},
	"oklch()": {
		syntax: "oklch([from <color>]? [<percentage> | <number> | none] [<percentage> | <number> | none] [<hue> | none] [ / [<alpha-value> | none] ]? ) | oklch(from <color> <relative-lch-component>{2} [ <hue> | none | l | c | h ] [ / [ <alpha-value> | none ] ]? )"
	},
	"opacity()": {
		syntax: "opacity( [ <number> | <percentage> ]? )"
	},
	"outline-radius": {
		syntax: "<length> | <percentage>"
	},
	"paint()": {
		syntax: "paint( <ident>, <declaration-value>? )"
	},
	"palette-mix()": {
		syntax: "palette-mix( <color-interpolation-method>? , [ <'font-palette'> && <percentage [0,100]>? ]# )"
	},
	"param()": {
		syntax: "param( <param-spec> , <declaration-value>? )"
	},
	"path()": {
		syntax: "path( <'fill-rule'>? , <string> )"
	},
	"perspective()": {
		syntax: "perspective( [ <length [0,∞]> | none ] )"
	},
	"pointer()": {
		syntax: "pointer( [ <pointer-source> || <pointer-axis> ]? )"
	},
	"polygon()": {
		syntax: "polygon( <'fill-rule'>? [ round <length> ]? , [<length-percentage> <length-percentage>]# )"
	},
	"pow()": {
		syntax: "pow( <calc-sum>, <calc-sum> )"
	},
	"progress()": {
		syntax: "progress(no-clamp? <calc-sum>, <calc-sum>, <calc-sum>)"
	},
	"radial-gradient()": {
		syntax: "radial-gradient( [ <radial-gradient-syntax> ] )"
	},
	"random-item()": {
		syntax: "random-item( <random-key> , [ <declaration-value>? ]# )"
	},
	"random()": {
		syntax: "random( <random-key>? , <calc-sum>, <calc-sum>, <calc-sum>? )"
	},
	"ray()": {
		syntax: "ray( <angle> && <ray-size>? && contain? && [at <position>]? )"
	},
	"rect()": {
		syntax: "rect( [ <length-percentage> | auto ]{4} [ round <'border-radius'> ]? )"
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
		syntax: "[ <legacy-rgb-syntax> | <modern-rgb-syntax> ] | rgb(from <color> <relative-rgb-component>{3} [ / [ <alpha-value> | none] ]? )"
	},
	"rgba()": {
		syntax: "[ <legacy-rgba-syntax> | <modern-rgba-syntax> ] | rgba(from <color> <relative-rgb-component>{3} [ / [ <alpha-value> | none ] ]? )"
	},
	right: {
		syntax: "<length> | auto"
	},
	"rotate()": {
		syntax: "rotate( [ <angle> | <zero> ] )"
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
		syntax: "running( <custom-ident> )"
	},
	"saturate()": {
		syntax: "saturate( [ <number> | <percentage> ]? )"
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
	"scroll-state()": {
		syntax: "scroll-state( <scroll-state-query> )"
	},
	"scroll()": {
		syntax: "scroll( [ <scroller> || <axis> ]? )"
	},
	"selector()": {
		syntax: "selector( <complex-selector> )"
	},
	"sepia()": {
		syntax: "sepia( [ <number> | <percentage> ]? )"
	},
	"shape()": {
		syntax: "shape( <'fill-rule'>? from <position> , <shape-command># )"
	},
	"sibling-count()": {
		syntax: "sibling-count()"
	},
	"sibling-index()": {
		syntax: "sibling-index()"
	},
	"sign()": {
		syntax: "sign( <calc-sum> )"
	},
	"sin()": {
		syntax: "sin( <calc-sum> )"
	},
	"size-feature": {
		syntax: "<mf-plain> | <mf-boolean> | <mf-range>"
	},
	"size-keyword": {
		syntax: "auto | <intrinsic-size-keyword> | stretch"
	},
	"skew()": {
		syntax: "skew( [ <angle> | <zero> ] , [ <angle> | <zero> ]? )"
	},
	"skewX()": {
		syntax: "skewX( [ <angle> | <zero> ] )"
	},
	"skewY()": {
		syntax: "skewY( [ <angle> | <zero> ] )"
	},
	"snap-block()": {
		syntax: "snap-block( <length> , [ start | end | near ]? )"
	},
	"snap-inline()": {
		syntax: "snap-inline( <length> , [ left | right | near ]? )"
	},
	"sqrt()": {
		syntax: "sqrt( <calc-sum> )"
	},
	"src()": {
		syntax: "src( <string> <url-modifier>* )"
	},
	"steps()": {
		syntax: "steps( <integer>, <step-position>?)"
	},
	"string()": {
		syntax: "string( <custom-ident> , [ first | start | last | first-except ]? )"
	},
	"stripes()": {
		syntax: "stripes( <color-stripe># )"
	},
	"style-condition": {
		syntax: "not <style-in-parens> | <style-in-parens> [ [ and <style-in-parens> ]* | [ or <style-in-parens> ]* ]"
	},
	"style-feature-name": {
		syntax: "<ident> |<custom-property-name>"
	},
	"superellipse()": {
		syntax: "superellipse(<number> | infinity | -infinity)"
	},
	"supports-condition-name": {
		syntax: "<extension-name>"
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
		syntax: "symbols( <symbols-type>? [ <string> | <image> ]+ )"
	},
	"tan()": {
		syntax: "tan( <calc-sum> )"
	},
	"target-counter()": {
		syntax: "target-counter( [ <string> | <url> ] , <custom-ident> , <counter-style>? )"
	},
	"target-counters()": {
		syntax: "target-counters( [ <string> | <url> ] , <custom-ident> , <string> , <counter-style>? )"
	},
	"target-name": {
		syntax: "<string>"
	},
	"target-text()": {
		syntax: "target-text( [ <string> | <url> ] , [ content | before | after | first-letter ]? )"
	},
	"timeline-range-center-subject": {
		syntax: "source | target"
	},
	"timeline-range-name": {
		syntax: "cover | contain | entry | exit | entry-crossing | exit-crossing"
	},
	top: {
		syntax: "<length> | auto"
	},
	"transform-interpolate()": {
		syntax: "transform-interpolate( [ <progress-source> && [ by <easing-function> ]? && <easing-function>? ], <input-position>{1,2} : <transform-list>, [ <easing-function>?, <input-position>{1,2} : <transform-list> ]#? )"
	},
	"transform-mix()": {
		syntax: "transform-mix( [ <transform-list> && <percentage [0,100]> ]# )"
	},
	"translate()": {
		syntax: "translate( <length-percentage> , <length-percentage>? )"
	},
	"translate3d()": {
		syntax: "translate3d( <length-percentage> , <length-percentage> , <length> )"
	},
	"translateX()": {
		syntax: "translateX( <length-percentage> )"
	},
	"translateY()": {
		syntax: "translateY( <length-percentage> )"
	},
	"translateZ()": {
		syntax: "translateZ( <length> )"
	},
	"type()": {
		syntax: "type( <syntax> )"
	},
	"url-modifier": {
		syntax: "<ident> | <function-token> <any-value> )"
	},
	"url-pattern()": {
		syntax: "url-pattern( <string> )"
	},
	"url-set": {
		syntax: "<image-set()>"
	},
	"url()": {
		syntax: "url( <string> <url-modifier>* ) | <url-token>"
	},
	"var()": {
		syntax: "var( <custom-property-name> , <declaration-value>? )"
	},
	"view()": {
		syntax: "view( [ <axis> || <'view-timeline-inset'> ]? )"
	},
	"voice-family-name": {
		syntax: "<string> | <custom-ident>+"
	},
	"whole-value": {
		syntax: "<declaration-value>"
	},
	x: {
		syntax: "<number>"
	},
	"xywh()": {
		syntax: "xywh( <length-percentage>{2} <length-percentage [0,∞]>{2} [ round <'border-radius'> ]? )"
	},
	y: {
		syntax: "<number>"
	}
};
var types = {
	syntax: {
		syntax: "'*' | <syntax-component> [ <syntax-combinator> <syntax-component> ]* | <syntax-string>"
	},
	"a-n-plus-b": {
		syntax: "odd | even | <integer> | <n-dimension> | '+'? n | -n | <ndashdigit-dimension> | '+'? <ndashdigit-ident> | <dashndashdigit-ident> | <n-dimension> <signed-integer> | '+'? n <signed-integer> | -n <signed-integer> | <ndash-dimension> <signless-integer> | '+'? n- <signless-integer> | -n- <signless-integer> | <n-dimension> ['+' | '-'] <signless-integer> | '+'? n ['+' | '-'] <signless-integer> | -n ['+' | '-'] <signless-integer>"
	},
	"absolute-size": {
		syntax: "[ xx-small | x-small | small | medium | large | x-large | xx-large | xxx-large ]"
	},
	"alpha-value": {
		syntax: "<number> | <percentage> | none"
	},
	"anchor-name": {
		syntax: "<dashed-ident>"
	},
	"anchor-side": {
		syntax: "inside | outside | top | left | right | bottom | start | end | self-start | self-end | <percentage> | center"
	},
	"anchor-size": {
		syntax: "width | height | block | inline | self-block | self-inline"
	},
	"anchored-in-parens": {
		syntax: "( <anchored-query> ) | ( <anchored-feature> ) | <general-enclosed>"
	},
	"anchored-query": {
		syntax: "not <anchored-in-parens> | <anchored-in-parens> [ [ and <anchored-in-parens> ]* | [ or <anchored-in-parens> ]* ] | <anchored-feature>"
	},
	"angle-percentage": {
		syntax: "[ <angle> | <percentage> ]"
	},
	"angular-color-hint": {
		syntax: "<angle-percentage> | <zero>"
	},
	"angular-color-stop": {
		syntax: "<color> <color-stop-angle>?"
	},
	"angular-color-stop-list": {
		syntax: "<angular-color-stop> , [ <angular-color-hint>? , <angular-color-stop> ]#?"
	},
	"animateable-feature": {
		syntax: "scroll-position | contents | <custom-ident>"
	},
	"arc-command": {
		syntax: "arc <command-end-point> [ [ of <length-percentage>{1,2} ] && <arc-sweep>? && <arc-size>? && [rotate <angle>]? ]"
	},
	"arc-size": {
		syntax: "large | small"
	},
	"arc-sweep": {
		syntax: "cw | ccw"
	},
	attachment: {
		syntax: "scroll | fixed | local"
	},
	"attr-args": {
		syntax: "attr( <declaration-value>, <declaration-value>? )"
	},
	"attr-matcher": {
		syntax: "[ '~' | '|' | '^' | '$' | '*' ]? '='"
	},
	"attr-modifier": {
		syntax: "i | s"
	},
	"attr-name": {
		syntax: "[ <ident-token>? '|' ]? <ident-token>"
	},
	"attr-type": {
		syntax: "type( <syntax> ) | raw-string | number | <attr-unit>"
	},
	"attr-unit": {
		syntax: "<custom-ident>"
	},
	"attribute-selector": {
		syntax: "'[' <wq-name> ']' | '[' <wq-name> <attr-matcher> [ <string-token> | <ident-token> ] <attr-modifier>? ']'"
	},
	"auto-line-color-list": {
		syntax: "<line-color-or-repeat>#? , <auto-repeat-line-color> , <line-color-or-repeat>#?"
	},
	"auto-line-style-list": {
		syntax: "<line-style-or-repeat>#? , <auto-repeat-line-style> , <line-style-or-repeat>#?"
	},
	"auto-line-width-list": {
		syntax: "<line-width-or-repeat>#? , <auto-repeat-line-width> , <line-width-or-repeat>#?"
	},
	"auto-repeat": {
		syntax: "repeat( [ auto-fill | auto-fit ] , [ <line-names>? <track-size> ]+ <line-names>? )"
	},
	"auto-repeat-line-color": {
		syntax: "repeat( auto , [ <color> ]# )"
	},
	"auto-repeat-line-style": {
		syntax: "repeat( auto , [ <line-style> ]# )"
	},
	"auto-repeat-line-width": {
		syntax: "repeat( auto , [ <line-width> ]# )"
	},
	"auto-track-list": {
		syntax: "[ <line-names>? [ <fixed-size> | <fixed-repeat> ] ]* <line-names>? <auto-repeat> [ <line-names>? [ <fixed-size> | <fixed-repeat> ] ]* <line-names>?"
	},
	autospace: {
		syntax: "no-autospace | [ ideograph-alpha || ideograph-numeric || punctuation ] || [ insert | replace ]"
	},
	axis: {
		syntax: "block | inline | x | y"
	},
	"base-descriptor": {
		syntax: "base-url : stylesheet | document | <url>"
	},
	"baseline-metric": {
		syntax: "text-bottom | alphabetic | ideographic | middle | central | mathematical | hanging | text-top"
	},
	"baseline-position": {
		syntax: "[ first | last ]? && baseline"
	},
	"basic-shape": {
		syntax: "<basic-shape-rect> | <circle()> | <ellipse()> | <polygon()> | <path()> | <shape()>"
	},
	"basic-shape-rect": {
		syntax: "<inset()> | <rect()> | <xywh()>"
	},
	"bg-clip": {
		syntax: "<visual-box> | [ border-area || text ]"
	},
	"bg-image": {
		syntax: "<image> | none"
	},
	"bg-layer": {
		syntax: "<bg-image> || <bg-position> [ / <bg-size> ]? || <repeat-style> || <attachment> || <visual-box> || <bg-clip>"
	},
	"bg-position": {
		syntax: "<position> | <position-three>"
	},
	"bg-size": {
		syntax: "[ <length-percentage [0,∞]> | auto ]{1,2} | cover | contain"
	},
	"blend-mode": {
		syntax: "normal | darken | multiply | color-burn | lighten | screen | color-dodge | overlay | soft-light | hard-light | difference | exclusion | hue | saturation | color | luminosity"
	},
	"boolean-expr": {
		syntax: "not <boolean-expr-group> | <boolean-expr-group> [ [ and <boolean-expr-group> ]* | [ or <boolean-expr-group> ]* ]"
	},
	"border-radius": {
		syntax: "<slash-separated-border-radius-syntax> | <legacy-border-radius-syntax>"
	},
	"box-size": {
		syntax: "<length-percentage [0,∞]> | stretch | contain | min-content | max-content | fit-content | fit-content(<length-percentage [0,∞]>) | <calc-size()>"
	},
	"calc-keyword": {
		syntax: "e | pi | infinity | -infinity | NaN"
	},
	"calc-product": {
		syntax: "<calc-value> [ [ '*' | / ] <calc-value> ]*"
	},
	"calc-size-basis": {
		syntax: "[ <size-keyword> | <calc-sum> | <calc-size()> | any ]"
	},
	"calc-sum": {
		syntax: "<calc-product> [ [ '+' | '-' ] <calc-product> ]*"
	},
	"calc-value": {
		syntax: "<number> | <dimension> | <percentage> | <calc-keyword> | ( <calc-sum> )"
	},
	"cf-image": {
		syntax: "[ <image> | <color> ] && <percentage [0,100]>?"
	},
	"class-selector": {
		syntax: "'.' <ident-token>"
	},
	"clip-source": {
		syntax: "<url>"
	},
	"cmyk-component": {
		syntax: "<number> | <percentage> | none"
	},
	color: {
		syntax: "<color-base> | currentColor | <system-color> | <contrast-color()> | <device-cmyk()> | <light-dark-color>"
	},
	"color-base": {
		syntax: "<hex-color> | <color-function> | <named-color> | <color-mix()> | transparent"
	},
	"color-font-tech": {
		syntax: "color-colrv0 | color-colrv1 | color-svg | color-sbix | color-cbdt"
	},
	"color-function": {
		syntax: "<rgb()> | <rgba()> | <hsl()> | <hsla()> | <hwb()> | <lab()> | <lch()> | <oklab()> | <oklch()> | <ictcp()> | <jzazbz()> | <jzczhz()> | <alpha()> | <color()> | <hdr-color()>"
	},
	"color-interpolation-method": {
		syntax: "in [ <rectangular-color-space> | <polar-color-space> <hue-interpolation-method>? | <custom-color-space> ]"
	},
	"color-space": {
		syntax: "<rectangular-color-space> | <polar-color-space> | <custom-color-space>"
	},
	"color-stop": {
		syntax: "<color-stop-length> | <color-stop-angle>"
	},
	"color-stop-angle": {
		syntax: "[ <angle-percentage> | <zero> ]{1,2}"
	},
	"color-stop-length": {
		syntax: "<length-percentage>{1,2}"
	},
	"color-stop-list": {
		syntax: "<linear-color-stop> , [ <linear-color-hint>? , <linear-color-stop> ]#?"
	},
	"color-stripe": {
		syntax: "<color> && [ <length-percentage> | <flex> ]?"
	},
	"colorspace-params": {
		syntax: "[<custom-params> | <predefined-rgb-params> | <xyz-params>]"
	},
	combinator: {
		syntax: "'>' | '+' | '~' | [ '|' '|' ] | [ / <wq-name> / ]"
	},
	"command-end-point": {
		syntax: "[ to <position> | by <coordinate-pair> ]"
	},
	"common-lig-values": {
		syntax: "[ common-ligatures | no-common-ligatures ]"
	},
	"compat-auto": {
		syntax: "searchfield | textarea | checkbox | radio | menulist | listbox | meter | progress-bar | button"
	},
	"compat-special": {
		syntax: "textfield | menulist-button"
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
	"complex-selector-list": {
		syntax: "<complex-selector>#"
	},
	"complex-selector-unit": {
		syntax: "[ <compound-selector>? <pseudo-compound-selector>* ]!"
	},
	"composite-mode": {
		syntax: "clear | copy | source-over | destination-over | source-in | destination-in | source-out | destination-out | source-atop | destination-atop | xor | lighter | plus-darker | plus-lighter"
	},
	"compositing-operator": {
		syntax: "add | subtract | intersect | exclude"
	},
	"compound-selector": {
		syntax: "[ <type-selector>? <subclass-selector>* ]!"
	},
	"compound-selector-list": {
		syntax: "<compound-selector>#"
	},
	"conic-gradient-syntax": {
		syntax: "[ [ [ from [ <angle> | <zero> ] ]? [ at <position> ]? ] || <color-interpolation-method> ]? , <angular-color-stop-list>"
	},
	"container-condition": {
		syntax: "[ <container-name>? <container-query>? ]!"
	},
	"container-name": {
		syntax: "<custom-ident>"
	},
	"container-query": {
		syntax: "not <query-in-parens> | <query-in-parens> [ [ and <query-in-parens> ]* | [ or <query-in-parens> ]* ]"
	},
	"content-distribution": {
		syntax: "space-between | space-around | space-evenly | stretch"
	},
	"content-level": {
		syntax: "element | content | text | <attr()> | <counter>"
	},
	"content-list": {
		syntax: "[ <string> | <counter()> | <counters()> | <content()> | <attr()> ]+"
	},
	"content-position": {
		syntax: "center | start | end | flex-start | flex-end"
	},
	"content-replacement": {
		syntax: "<image>"
	},
	"contextual-alt-values": {
		syntax: "[ contextual | no-contextual ]"
	},
	"control-point": {
		syntax: "[ <position> | <relative-control-point> ]"
	},
	"coord-box": {
		syntax: "<paint-box> | view-box"
	},
	"coordinate-pair": {
		syntax: "<length-percentage>{2}"
	},
	"corner-shape-value": {
		syntax: "round | scoop | bevel | notch | square | squircle | <superellipse()>"
	},
	counter: {
		syntax: "<counter()> | <counters()>"
	},
	"counter-name": {
		syntax: "<custom-ident>"
	},
	"counter-style": {
		syntax: "<counter-style-name> | <symbols()>"
	},
	"counter-style-name": {
		syntax: "<custom-ident>"
	},
	"cross-origin-modifier": {
		syntax: "cross-origin(anonymous | use-credentials)"
	},
	"css-type": {
		syntax: "<syntax-component> | <type()>"
	},
	"cubic-bezier-easing-function": {
		syntax: "ease | ease-in | ease-out | ease-in-out | <cubic-bezier()>"
	},
	"cursor-image": {
		syntax: "[ <url> | <url-set> ] <number>{2}?"
	},
	"cursor-predefined": {
		syntax: "auto | default | none | context-menu | help | pointer | progress | wait | cell | crosshair | text | vertical-text | alias | copy | move | no-drop | not-allowed | grab | grabbing | e-resize | n-resize | ne-resize | nw-resize | s-resize | se-resize | sw-resize | w-resize | ew-resize | ns-resize | nesw-resize | nwse-resize | col-resize | row-resize | all-scroll | zoom-in | zoom-out | hand | -webkit-grab | -webkit-grabbing | -webkit-zoom-in | -webkit-zoom-out | -moz-grab | -moz-grabbing | -moz-zoom-in | -moz-zoom-out"
	},
	"curve-command": {
		syntax: "curve [ [ to <position> with <control-point> [ / <control-point> ]? ] | [ by <coordinate-pair> with <relative-control-point> [ / <relative-control-point> ]? ] ]"
	},
	"custom-arg": {
		syntax: "'$' <ident-token>"
	},
	"custom-color-space": {
		syntax: "<dashed-ident>"
	},
	"custom-params": {
		syntax: "<dashed-ident> [ <number> | <percentage> | none ]+"
	},
	"custom-selector": {
		syntax: "<custom-arg>? : <extension-name> [ ( <custom-arg>+#? ) ]?"
	},
	dasharray: {
		syntax: "[ [ <length-percentage> | <number> ]+ ]#"
	},
	"dashndashdigit-ident": {
		syntax: "<ident-token>"
	},
	"default-value": {
		syntax: "<declaration-value>"
	},
	"deprecated-color": {
		syntax: "ActiveBorder | ActiveCaption | AppWorkspace | Background | ButtonHighlight | ButtonShadow | CaptionText | InactiveBorder | InactiveCaption | InactiveCaptionText | InfoBackground | InfoText | Menu | MenuText | Scrollbar | ThreeDDarkShadow | ThreeDFace | ThreeDHighlight | ThreeDLightShadow | ThreeDShadow | Window | WindowFrame | WindowText"
	},
	"discretionary-lig-values": {
		syntax: "[ discretionary-ligatures | no-discretionary-ligatures ]"
	},
	"display-box": {
		syntax: "contents | none"
	},
	"display-inside": {
		syntax: "flow | flow-root | table | flex | grid | ruby"
	},
	"display-internal": {
		syntax: "table-row-group | table-header-group | table-footer-group | table-row | table-cell | table-column-group | table-column | table-caption | ruby-base | ruby-text | ruby-base-container | ruby-text-container"
	},
	"display-legacy": {
		syntax: "inline-block | inline-table | inline-flex | inline-grid"
	},
	"display-listitem": {
		syntax: "<display-outside>? && [ flow | flow-root ]? && list-item"
	},
	"display-outside": {
		syntax: "block | inline | run-in"
	},
	"easing-function": {
		syntax: "<linear-easing-function> | <cubic-bezier-easing-function> | <step-easing-function>"
	},
	"east-asian-variant-values": {
		syntax: "[ jis78 | jis83 | jis90 | jis04 | simplified | traditional ]"
	},
	"east-asian-width-values": {
		syntax: "[ full-width | proportional-width ]"
	},
	"env-args": {
		syntax: "env( <declaration-value>, <declaration-value>? )"
	},
	"event-trigger-event": {
		syntax: "activate | interest | click | touch | dblclick | keypress(<string>) | ..."
	},
	"explicit-track-list": {
		syntax: "[ <line-names>? <track-size> ]+ <line-names>?"
	},
	"feature-tag-value": {
		syntax: "<opentype-tag> [ <integer [0,∞]> | on | off ]?"
	},
	"filter-function": {
		syntax: "<blur()> | <brightness()> | <contrast()> | <drop-shadow()> | <grayscale()> | <hue-rotate()> | <invert()> | <opacity()> | <sepia()> | <saturate()>"
	},
	"filter-value-list": {
		syntax: "[ <filter-function> | <url> ]+"
	},
	"final-bg-layer": {
		syntax: "<bg-image> || <bg-position> [ / <bg-size> ]? || <repeat-style> || <attachment> || <visual-box> || <bg-clip> || <'background-color'>"
	},
	"fixed-breadth": {
		syntax: "<length-percentage [0,∞]>"
	},
	"fixed-repeat": {
		syntax: "repeat( [ <integer [1,∞]> ] , [ <line-names>? <fixed-size> ]+ <line-names>? )"
	},
	"fixed-size": {
		syntax: "<fixed-breadth> | minmax( <fixed-breadth> , <track-breadth> ) | minmax( <inflexible-breadth> , <fixed-breadth> )"
	},
	"font-family-name": {
		syntax: "<string> | <custom-ident>+"
	},
	"font-feature-index": {
		syntax: "<integer>"
	},
	"font-feature-value-name": {
		syntax: "<ident>"
	},
	"font-features-tech": {
		syntax: "features-opentype | features-aat | features-graphite"
	},
	"font-format": {
		syntax: "[<string> | collection | embedded-opentype | opentype | svg | truetype | woff | woff2 ]"
	},
	"font-src": {
		syntax: "<url> [ format( <font-format> ) ]? [ tech( <font-tech># ) ]? | local( <font-family-name> )"
	},
	"font-tech": {
		syntax: "[<font-features-tech> | <color-font-tech> | variations | palettes | incremental ]"
	},
	"font-variant-css2": {
		syntax: "normal | small-caps"
	},
	"font-weight-absolute": {
		syntax: "[ normal | bold | <number [1,1000]> ]"
	},
	"font-width-css3": {
		syntax: "normal | ultra-condensed | extra-condensed | condensed | semi-condensed | semi-expanded | expanded | extra-expanded | ultra-expanded"
	},
	"form-control-identifier": {
		syntax: "select"
	},
	"frequency-percentage": {
		syntax: "[ <frequency> | <percentage> ]"
	},
	"function-parameter": {
		syntax: "<dashed-ident> <css-type>? [ : <default-value> ]?"
	},
	"gap-auto-repeat-rule": {
		syntax: "repeat( auto , <gap-rule># )"
	},
	"gap-auto-rule-list": {
		syntax: "<gap-rule-or-repeat>#? , <gap-auto-repeat-rule> , <gap-rule-or-repeat>#?"
	},
	"gap-repeat-rule": {
		syntax: "repeat( <integer [1,∞]> , <gap-rule># )"
	},
	"gap-rule": {
		syntax: "<line-width> || <line-style> || <color>"
	},
	"gap-rule-list": {
		syntax: "<gap-rule-or-repeat>#"
	},
	"gap-rule-or-repeat": {
		syntax: "<gap-rule> | <gap-repeat-rule>"
	},
	"general-enclosed": {
		syntax: "[ <function-token> <any-value>? ) ] | [ ( <any-value>? ) ]"
	},
	"generic-font-complete": {
		syntax: "serif | sans-serif | system-ui | cursive | fantasy | math | monospace"
	},
	"generic-font-family": {
		syntax: "<generic-font-script-specific>| <generic-font-complete> | <generic-font-incomplete>"
	},
	"generic-font-incomplete": {
		syntax: "ui-serif | ui-sans-serif | ui-monospace | ui-rounded"
	},
	"generic-font-script-specific": {
		syntax: "generic(fangsong) | generic(kai) | generic(khmer-mul) | generic(nastaliq)"
	},
	"generic-voice": {
		syntax: "<age>? <gender> <integer [1,∞]>?"
	},
	"geometry-box": {
		syntax: "<shape-box> | fill-box | stroke-box | view-box"
	},
	gradient: {
		syntax: "[ <linear-gradient()> | <repeating-linear-gradient()> | <radial-gradient()> | <repeating-radial-gradient()> | <conic-gradient()> | <repeating-conic-gradient()> ] | <-legacy-gradient>"
	},
	"grid-line": {
		syntax: "auto | <custom-ident> | [ [ <integer [-∞,-1]> | <integer [1,∞]> ] && <custom-ident>? ] | [ span && [ <integer [1,∞]> || <custom-ident> ] ]"
	},
	"historical-lig-values": {
		syntax: "[ historical-ligatures | no-historical-ligatures ]"
	},
	"horizontal-line-command": {
		syntax: "hline [ to [ <length-percentage> | left | center | right | x-start | x-end ] | by <length-percentage> ]"
	},
	hue: {
		syntax: "<number> | <angle>"
	},
	"hue-interpolation-method": {
		syntax: "[ shorter | longer | increasing | decreasing ] hue"
	},
	"id-selector": {
		syntax: "<hash-token>"
	},
	"ident-arg": {
		syntax: "<string> | <integer> | <ident>"
	},
	"ident-args": {
		syntax: "ident( <declaration-value> )"
	},
	"if-args": {
		syntax: "if( [ <if-args-branch> ; ]* <if-args-branch> ;? )"
	},
	"if-args-branch": {
		syntax: "<declaration-value> : <declaration-value>?"
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
	image: {
		syntax: "<url> | <image()> | <image-set()> | <cross-fade()> | <element()> | <gradient>"
	},
	"image-1D": {
		syntax: "<stripes()>"
	},
	"image-set-option": {
		syntax: "[ <image> | <string> ] [ <resolution> || type(<string>) ]?"
	},
	"image-src": {
		syntax: "[ <url> | <string> ]"
	},
	"image-tags": {
		syntax: "[ ltr | rtl ]"
	},
	"import-conditions": {
		syntax: "[ supports( [ <supports-condition> | <declaration> ] ) ]? <media-query-list>?"
	},
	"inflexible-breadth": {
		syntax: "<length-percentage [0,∞]> | min-content | max-content | auto"
	},
	"inherit-args": {
		syntax: "inherit( <declaration-value>, <declaration-value>? )"
	},
	"init-descriptor": {
		syntax: "<init-descriptor-name> : <string>"
	},
	"init-descriptor-name": {
		syntax: "protocol | hostname | port | pathname | search | hash"
	},
	"input-position": {
		syntax: "<percentage> | <number> | <dimension>"
	},
	"inset-value": {
		syntax: "<length-percentage> | overlap-join"
	},
	integer: {
		syntax: "<number-token>"
	},
	"integrity-modifier": {
		syntax: "integrity(<string>)"
	},
	"isolation-mode": {
		syntax: "auto | isolate"
	},
	"keyframe-block": {
		syntax: "<keyframe-selector># { <declaration-list> }"
	},
	"keyframe-selector": {
		syntax: "from | to | <percentage [0,100]>"
	},
	"keyframes-name": {
		syntax: "<custom-ident> | <string>"
	},
	"layer-name": {
		syntax: "<ident> [ '.' <ident> ]*"
	},
	"layout-box": {
		syntax: "<visual-box> | margin-box"
	},
	"leader-type": {
		syntax: "dotted | solid | space | <string>"
	},
	"legacy-border-radius-syntax": {
		syntax: "<length-percentage [0,∞]>{1,2}"
	},
	"legacy-device-cmyk-syntax": {
		syntax: "device-cmyk( <number>#{4} )"
	},
	"legacy-hsl-syntax": {
		syntax: "hsl( <hue>, <percentage>, <percentage>, <alpha-value>? )"
	},
	"legacy-hsla-syntax": {
		syntax: "hsla( <hue>, <percentage>, <percentage>, <alpha-value>? )"
	},
	"legacy-pseudo-element-selector": {
		syntax: ": [before | after | first-line | first-letter]"
	},
	"legacy-rgb-syntax": {
		syntax: "rgb( <percentage>#{3} , <alpha-value>? ) | rgb( <number>#{3} , <alpha-value>? )"
	},
	"legacy-rgba-syntax": {
		syntax: "rgba( <percentage>#{3} , <alpha-value>? ) | rgba( <number>#{3} , <alpha-value>? )"
	},
	"length-percentage": {
		syntax: "[ <length> | <percentage> ]"
	},
	"light-dark-color": {
		syntax: "light-dark(<color>, <color>)"
	},
	"light-dark-image": {
		syntax: "light-dark( [ <image> | none ] , [ <image> | none ] )"
	},
	"line-color-list": {
		syntax: "<line-color-or-repeat>#"
	},
	"line-color-or-repeat": {
		syntax: "[ <color> | <repeat-line-color> ]"
	},
	"line-command": {
		syntax: "line <command-end-point>"
	},
	"line-name-list": {
		syntax: "[ <line-names> | <name-repeat> ]+"
	},
	"line-names": {
		syntax: "'[' <custom-ident>* ']'"
	},
	"line-style": {
		syntax: "none | hidden | dotted | dashed | solid | double | groove | ridge | inset | outset"
	},
	"line-style-list": {
		syntax: "<line-style-or-repeat>#"
	},
	"line-style-or-repeat": {
		syntax: "[ <line-style> | <repeat-line-style> ]"
	},
	"line-width": {
		syntax: "<length [0,∞]> | hairline | thin | medium | thick"
	},
	"line-width-list": {
		syntax: "<line-width-or-repeat>#"
	},
	"line-width-or-repeat": {
		syntax: "[ <line-width> | <repeat-line-width> ]"
	},
	"linear-color-hint": {
		syntax: "<length-percentage>"
	},
	"linear-color-stop": {
		syntax: "<color> <color-stop-length>?"
	},
	"linear-easing-function": {
		syntax: "linear | <linear()>"
	},
	"linear-gradient-syntax": {
		syntax: "[ [ <angle> | <zero> | to <side-or-corner> ] || <color-interpolation-method> ]? , <color-stop-list>"
	},
	"location-descriptor": {
		syntax: "<pattern-descriptor> | <init-descriptor> | <base-descriptor>"
	},
	"location-name": {
		syntax: "<dashed-ident>"
	},
	"location-rule": {
		syntax: "@location <dashed-ident> { <declaration-list> }"
	},
	"marker-ref": {
		syntax: "<url>"
	},
	"mask-layer": {
		syntax: "<mask-reference> || <position> [ / <bg-size> ]? || <repeat-style> || <geometry-box> || [ <geometry-box> | no-clip ] || <compositing-operator> || <masking-mode>"
	},
	"mask-reference": {
		syntax: "none | <image> | <mask-source>"
	},
	"mask-source": {
		syntax: "<url>"
	},
	"masking-mode": {
		syntax: "alpha | luminance | match-source"
	},
	"media-and": {
		syntax: "and <media-in-parens>"
	},
	"media-condition": {
		syntax: "<media-not> | <media-in-parens> [ <media-and>* | <media-or>* ]"
	},
	"media-condition-without-or": {
		syntax: "<media-not> | <media-in-parens> <media-and>*"
	},
	"media-feature": {
		syntax: "[ <mf-plain> | <mf-boolean> | <mf-range> ]"
	},
	"media-import-condition": {
		syntax: "<media-query-list>"
	},
	"media-in-parens": {
		syntax: "( <media-condition> ) | ( <media-feature> ) | <general-enclosed>"
	},
	"media-not": {
		syntax: "not <media-in-parens>"
	},
	"media-or": {
		syntax: "or <media-in-parens>"
	},
	"media-query": {
		syntax: "<media-condition> | [ not | only ]? <media-type> [ and <media-condition-without-or> ]?"
	},
	"media-type": {
		syntax: "<ident>"
	},
	"mf-boolean": {
		syntax: "<mf-name>"
	},
	"mf-comparison": {
		syntax: "<mf-lt> | <mf-gt> | <mf-eq>"
	},
	"mf-eq": {
		syntax: "'='"
	},
	"mf-gt": {
		syntax: "'>' '='?"
	},
	"mf-lt": {
		syntax: "'<' '='?"
	},
	"mf-name": {
		syntax: "<ident>"
	},
	"mf-plain": {
		syntax: "<mf-name> : <mf-value>"
	},
	"mf-range": {
		syntax: "<mf-name> <mf-comparison> <mf-value> | <mf-value> <mf-comparison> <mf-name> | <mf-value> <mf-lt> <mf-name> <mf-lt> <mf-value> | <mf-value> <mf-gt> <mf-name> <mf-gt> <mf-value>"
	},
	"mf-value": {
		syntax: "<number> | <dimension> | <ident> | <ratio>"
	},
	"modern-device-cmyk-syntax": {
		syntax: "device-cmyk( <cmyk-component>{4} [ / [ <alpha-value> | none ] ]? )"
	},
	"modern-hsl-syntax": {
		syntax: "hsl([from <color>]? [<hue> | none] [<percentage> | <number> | none] [<percentage> | <number> | none] [ / [<alpha-value> | none] ]? )"
	},
	"modern-hsla-syntax": {
		syntax: "hsla([from <color>]? [<hue> | none] [<percentage> | <number> | none] [<percentage> | <number> | none] [ / [<alpha-value> | none] ]? )"
	},
	"modern-rgb-syntax": {
		syntax: "rgb( [ from <color> ]? [ <number> | <percentage> | none]{3} [ / [<alpha-value> | none] ]? )"
	},
	"modern-rgba-syntax": {
		syntax: "rgba( [ from <color> ]? [ <number> | <percentage> | none]{3} [ / [<alpha-value> | none] ]? )"
	},
	"move-command": {
		syntax: "move <command-end-point>"
	},
	"mq-boolean": {
		syntax: "<integer [0,1]>"
	},
	"n-dimension": {
		syntax: "<dimension-token>"
	},
	"name-repeat": {
		syntax: "repeat( [ <integer [1,∞]> | auto-fill ], <line-names>+)"
	},
	"named-color": {
		syntax: "aliceblue | antiquewhite | aqua | aquamarine | azure | beige | bisque | black | blanchedalmond | blue | blueviolet | brown | burlywood | cadetblue | chartreuse | chocolate | coral | cornflowerblue | cornsilk | crimson | cyan | darkblue | darkcyan | darkgoldenrod | darkgray | darkgreen | darkgrey | darkkhaki | darkmagenta | darkolivegreen | darkorange | darkorchid | darkred | darksalmon | darkseagreen | darkslateblue | darkslategray | darkslategrey | darkturquoise | darkviolet | deeppink | deepskyblue | dimgray | dimgrey | dodgerblue | firebrick | floralwhite | forestgreen | fuchsia | gainsboro | ghostwhite | gold | goldenrod | gray | green | greenyellow | grey | honeydew | hotpink | indianred | indigo | ivory | khaki | lavender | lavenderblush | lawngreen | lemonchiffon | lightblue | lightcoral | lightcyan | lightgoldenrodyellow | lightgray | lightgreen | lightgrey | lightpink | lightsalmon | lightseagreen | lightskyblue | lightslategray | lightslategrey | lightsteelblue | lightyellow | lime | limegreen | linen | magenta | maroon | mediumaquamarine | mediumblue | mediumorchid | mediumpurple | mediumseagreen | mediumslateblue | mediumspringgreen | mediumturquoise | mediumvioletred | midnightblue | mintcream | mistyrose | moccasin | navajowhite | navy | oldlace | olive | olivedrab | orange | orangered | orchid | palegoldenrod | palegreen | paleturquoise | palevioletred | papayawhip | peachpuff | peru | pink | plum | powderblue | purple | rebeccapurple | red | rosybrown | royalblue | saddlebrown | salmon | sandybrown | seagreen | seashell | sienna | silver | skyblue | slateblue | slategray | slategrey | snow | springgreen | steelblue | tan | teal | thistle | tomato | turquoise | violet | wheat | white | whitesmoke | yellow | yellowgreen | transparent"
	},
	"namespace-prefix": {
		syntax: "<ident>"
	},
	"navigation-condition": {
		syntax: "not <navigation-in-parens> | <navigation-in-parens> [ and <navigation-in-parens> ]* | <navigation-in-parens> [ or <navigation-in-parens> ]*"
	},
	"navigation-in-parens": {
		syntax: "( <navigation-condition> ) | ( <navigation-test> ) | <general-enclosed>"
	},
	"navigation-location": {
		syntax: "<url> | [ <location-name> | <url-pattern()> ]"
	},
	"navigation-location-between-test": {
		syntax: "between : <navigation-location> and <navigation-location>"
	},
	"navigation-location-test": {
		syntax: "<navigation-relation> : <navigation-location>"
	},
	"navigation-phase-keyword": {
		syntax: "loading | ready | committed"
	},
	"navigation-phase-test": {
		syntax: "phase : <navigation-phase-keyword>"
	},
	"navigation-relation": {
		syntax: "at | from | to"
	},
	"navigation-test": {
		syntax: "<navigation-location-test> | <navigation-location-between-test> | <navigation-type-test> | <navigation-phase-test>"
	},
	"navigation-type-keyword": {
		syntax: "traverse | back | forward | reload"
	},
	"navigation-type-test": {
		syntax: "history : <navigation-type-keyword>"
	},
	"ndash-dimension": {
		syntax: "<dimension-token>"
	},
	"ndashdigit-dimension": {
		syntax: "<dimension-token>"
	},
	"ndashdigit-ident": {
		syntax: "<ident-token>"
	},
	"ns-prefix": {
		syntax: "[ <ident-token> | '*' ]? '|'"
	},
	"number-optional-number": {
		syntax: "<number> <number>?"
	},
	"numeric-figure-values": {
		syntax: "[ lining-nums | oldstyle-nums ]"
	},
	"numeric-fraction-values": {
		syntax: "[ diagonal-fractions | stacked-fractions ]"
	},
	"numeric-spacing-values": {
		syntax: "[ proportional-nums | tabular-nums ]"
	},
	"offset-path": {
		syntax: "<ray()> | <url> | <basic-shape>"
	},
	"opacity-value": {
		syntax: "<number> | <percentage>"
	},
	"opentype-tag": {
		syntax: "<string>"
	},
	"outline-line-style": {
		syntax: "none | auto | dotted | dashed | solid | double | groove | ridge | inset | outset"
	},
	"overflow-position": {
		syntax: "unsafe | safe"
	},
	"page-selector": {
		syntax: "[ <ident-token>? <pseudo-page>* ]!"
	},
	"page-selector-list": {
		syntax: "<page-selector>#"
	},
	"page-size": {
		syntax: "A5 | A4 | A3 | B5 | B4 | JIS-B5 | JIS-B4 | letter | legal | ledger"
	},
	paint: {
		syntax: "none | <color> | <url> [ none | <color> ]? | context-fill | context-stroke"
	},
	"paint-box": {
		syntax: "<visual-box> | fill-box | stroke-box"
	},
	"palette-identifier": {
		syntax: "<dashed-ident>"
	},
	"param-spec": {
		syntax: "color | accent-color | [ <dashed-ident> <css-type>? ]"
	},
	"pattern-descriptor": {
		syntax: "pattern : <url-pattern()>"
	},
	"pointer-axis": {
		syntax: "block | inline | x | y"
	},
	"pointer-source": {
		syntax: "root | nearest | self"
	},
	points: {
		syntax: "[ <number>+ ]#"
	},
	"polar-color-space": {
		syntax: "hsl | hwb | lch | oklch"
	},
	position: {
		syntax: "<position-one> | <position-two> | <position-four>"
	},
	"position-area": {
		syntax: "[ [ left | center | right | span-left | span-right | x-start | x-end | span-x-start | span-x-end | self-x-start | self-x-end | span-self-x-start | span-self-x-end | span-all ] || [ top | center | bottom | span-top | span-bottom | y-start | y-end | span-y-start | span-y-end | self-y-start | self-y-end | span-self-y-start | span-self-y-end | span-all ] | [ block-start | center | block-end | span-block-start | span-block-end | span-all ] || [ inline-start | center | inline-end | span-inline-start | span-inline-end | span-all ] | [ self-block-start | center | self-block-end | span-self-block-start | span-self-block-end | span-all ] || [ self-inline-start | center | self-inline-end | span-self-inline-start | span-self-inline-end | span-all ] | [ start | center | end | span-start | span-end | span-all ]{1,2} | [ self-start | center | self-end | span-self-start | span-self-end | span-all ]{1,2} ]"
	},
	"position-area-query": {
		syntax: "[ [ left | center | right | span-left | span-right | x-start | x-end | span-x-start | span-x-end | self-x-start | self-x-end | span-self-x-start | span-self-x-end | span-all | any ] || [ top | center | bottom | span-top | span-bottom | y-start | y-end | span-y-start | span-y-end | self-y-start | self-y-end | span-self-y-start | span-self-y-end | span-all | any ] | [ block-start | center | block-end | span-block-start | span-block-end | span-all | any ] || [ inline-start | center | inline-end | span-inline-start | span-inline-end | span-all | any ] | [ self-block-start | center | self-block-end | span-self-block-start | span-self-block-end | span-all | any ] || [ self-inline-start | center | self-inline-end | span-self-inline-start | span-self-inline-end | span-all | any ] | [ start | center | end | span-start | span-end | span-all | any ]{1,2} | [ self-start | center | self-end | span-self-start | span-self-end | span-all | any ]{1,2} ]"
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
	"predefined-rgb": {
		syntax: "srgb | srgb-linear | display-p3 | display-p3-linear | a98-rgb | prophoto-rgb | rec2020 | rec2100-pq | rec2100-hlg | rec2100-linear"
	},
	"predefined-rgb-params": {
		syntax: "<predefined-rgb> [ <number> | <percentage> | none ]{3}"
	},
	"progress-source": {
		syntax: "<percentage> | <number> | <dimension> | <'animation-timeline'>"
	},
	"pseudo-class-selector": {
		syntax: ": <ident-token> | : <function-token> <any-value> )"
	},
	"pseudo-compound-selector": {
		syntax: "<pseudo-element-selector> <pseudo-class-selector>*"
	},
	"pseudo-element-selector": {
		syntax: ": <pseudo-class-selector> | <legacy-pseudo-element-selector>"
	},
	"pseudo-page": {
		syntax: ": [ left | right | first | blank ]"
	},
	"pt-class-selector": {
		syntax: "['.' <custom-ident>]+"
	},
	"pt-name-and-class-selector": {
		syntax: "<pt-name-selector> <pt-class-selector>? | <pt-class-selector>"
	},
	"pt-name-selector": {
		syntax: "'*' | <custom-ident>"
	},
	"query-in-parens": {
		syntax: "( <container-query> ) | ( <size-feature> ) | style( <style-query> ) | scroll-state( <scroll-state-query> ) | <general-enclosed>"
	},
	quote: {
		syntax: "open-quote | close-quote | no-open-quote | no-close-quote"
	},
	"radial-extent": {
		syntax: "closest-corner | closest-side | farthest-corner | farthest-side"
	},
	"radial-gradient-syntax": {
		syntax: "[ [ [ <radial-shape> || <radial-size> ]? [ at <position> ]? ] || <color-interpolation-method>]? , <color-stop-list>"
	},
	"radial-shape": {
		syntax: "circle | ellipse"
	},
	"radial-size": {
		syntax: "<radial-extent> | <length [0,∞]> | <length-percentage [0,∞]>{2}"
	},
	"random-cache-key": {
		syntax: "<dashed-ident> || element-scoped || [ property-scoped | property-index-scoped | <random-ua-ident> ]"
	},
	"random-item-args": {
		syntax: "random-item( <declaration-value>, [ <declaration-value>? ]# )"
	},
	"random-key": {
		syntax: "auto | <random-cache-key> | fixed <number [0,1]>"
	},
	"random-ua-ident": {
		syntax: "<custom-ident>"
	},
	ratio: {
		syntax: "<number [0,∞]> [ / <number [0,∞]> ]?"
	},
	"ray-size": {
		syntax: "<radial-extent> | sides"
	},
	"rectangular-color-space": {
		syntax: "srgb | srgb-linear | display-p3 | display-p3-linear | a98-rgb | prophoto-rgb | rec2020 | lab | oklab | <xyz-space>"
	},
	"referrer-policy-modifier": {
		syntax: "referrer-policy(no-referrer | no-referrer-when-downgrade | same-origin | origin | strict-origin | origin-when-cross-origin | strict-origin-when-cross-origin | unsafe-url)"
	},
	"relative-control-point": {
		syntax: "<coordinate-pair> [ from [ start | end | origin ] ]?"
	},
	"relative-real-selector": {
		syntax: "<combinator>? <complex-real-selector>"
	},
	"relative-real-selector-list": {
		syntax: "<relative-real-selector>#"
	},
	"relative-selector": {
		syntax: "<combinator>? <complex-selector>"
	},
	"relative-selector-list": {
		syntax: "<relative-selector>#"
	},
	"relative-size": {
		syntax: "[ larger | smaller ]"
	},
	"repeat-line-color": {
		syntax: "repeat( [ <integer [1,∞]> ] , [ <color> ]# )"
	},
	"repeat-line-style": {
		syntax: "repeat( [ <integer [1,∞]> ] , [ <line-style> ]# )"
	},
	"repeat-line-width": {
		syntax: "repeat( [ <integer [1,∞]> ] , [ <line-width> ]# )"
	},
	"repeat-style": {
		syntax: "repeat-x | repeat-y | repeat-block | repeat-inline | <repetition>{1,2}"
	},
	repetition: {
		syntax: "repeat | space | round | no-repeat"
	},
	"request-url-modifier": {
		syntax: "<cross-origin-modifier> | <integrity-modifier> | <referrer-policy-modifier>"
	},
	"reversed-counter-name": {
		syntax: "reversed( <counter-name> )"
	},
	"rounding-strategy": {
		syntax: "nearest | up | down | to-zero | line-width"
	},
	"scope-boundaries": {
		syntax: "[ [ ( <scope-start> ) ]? [ to ( <scope-end> ) ]? ]!"
	},
	"scope-end": {
		syntax: "<selector-list>"
	},
	"scope-start": {
		syntax: "<selector-list>"
	},
	"scroll-button-direction": {
		syntax: "up | down | left | right | block-start | block-end | inline-start | inline-end | prev | next"
	},
	"scroll-state-in-parens": {
		syntax: "( <scroll-state-query> ) | ( <scroll-state-feature> ) | <general-enclosed>"
	},
	"scroll-state-query": {
		syntax: " not <scroll-state-in-parens> | <scroll-state-in-parens> [ [ and <scroll-state-in-parens> ]* | [ or <scroll-state-in-parens> ]* ] | <scroll-state-feature>"
	},
	scroller: {
		syntax: "root | nearest | self"
	},
	"selector-list": {
		syntax: "<complex-selector-list>"
	},
	"self-position": {
		syntax: "center | start | end | self-start | self-end | flex-start | flex-end"
	},
	shadow: {
		syntax: "<color>? && [ <length>{2} [ <length [0,∞]> <length>? ]? ] && inset?"
	},
	shape: {
		syntax: "rect(<top>, <right>, <bottom>, <left>)"
	},
	"shape-box": {
		syntax: "<visual-box> | margin-box | half-border-box"
	},
	"shape-command": {
		syntax: "<move-command> | <line-command> | close | <horizontal-line-command> | <vertical-line-command> | <curve-command> | <smooth-command> | <arc-command>"
	},
	"side-or-corner": {
		syntax: "[left | right] || [top | bottom]"
	},
	"signed-integer": {
		syntax: "<number-token>"
	},
	"signless-integer": {
		syntax: "<number-token>"
	},
	"simple-selector": {
		syntax: "<type-selector> | <subclass-selector>"
	},
	"simple-selector-list": {
		syntax: "<simple-selector>#"
	},
	"single-animation": {
		syntax: "<'animation-duration'> || <easing-function> || <'animation-delay-start'> || <single-animation-iteration-count> || <single-animation-direction> || <single-animation-fill-mode> || <single-animation-play-state> || [ none | <keyframes-name> ] || <single-animation-timeline>"
	},
	"single-animation-composition": {
		syntax: "replace | add | accumulate"
	},
	"single-animation-direction": {
		syntax: "normal | reverse | alternate | alternate-reverse"
	},
	"single-animation-fill-mode": {
		syntax: "none | forwards | backwards | both"
	},
	"single-animation-iteration-count": {
		syntax: "infinite | <number [0,∞]>"
	},
	"single-animation-play-state": {
		syntax: "running | paused"
	},
	"single-animation-timeline": {
		syntax: "auto | none | <dashed-ident> | <scroll()> | <view()>"
	},
	"single-transition": {
		syntax: "[ none | <single-transition-property> ] || <time> || <easing-function> || <time> || <transition-behavior-value>"
	},
	"single-transition-property": {
		syntax: "all | <custom-ident>"
	},
	"slash-separated-border-radius-syntax": {
		syntax: "<length-percentage [0,∞]> [ / <length-percentage [0,∞]> ]?"
	},
	"smooth-command": {
		syntax: "smooth [ [ to <position> [ with <control-point> ]? ] | [ by <coordinate-pair> [ with <relative-control-point> ]? ] ]"
	},
	"source-size": {
		syntax: "<media-condition> <source-size-value> | auto"
	},
	"source-size-list": {
		syntax: "<source-size>#? , <source-size-value>"
	},
	"source-size-value": {
		syntax: "<length> | auto"
	},
	"spacing-trim": {
		syntax: "space-all | normal | space-first | trim-start | trim-both | trim-all"
	},
	"spread-shadow": {
		syntax: "<'box-shadow-color'>? && [ [ none | <length>{2} ] [ <'box-shadow-blur'> <'box-shadow-spread'>? ]? ] && <'box-shadow-position'>?"
	},
	"step-easing-function": {
		syntax: "step-start | step-end | <steps()>"
	},
	"step-position": {
		syntax: "jump-start | jump-end | jump-none | jump-both | start | end"
	},
	"style-feature": {
		syntax: "<style-feature-plain> | <style-feature-boolean> | <style-range>"
	},
	"style-feature-boolean": {
		syntax: "<style-feature-name>"
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
	"subclass-selector": {
		syntax: "<id-selector> | <class-selector> | <attribute-selector> | <pseudo-class-selector>"
	},
	"supports-at-rule-fn": {
		syntax: "at-rule( <at-keyword-token> )"
	},
	"supports-condition": {
		syntax: "not <supports-in-parens> | <supports-in-parens> [ and <supports-in-parens> ]* | <supports-in-parens> [ or <supports-in-parens> ]*"
	},
	"supports-decl": {
		syntax: "( [ <declaration> | <supports-condition-name> ] )"
	},
	"supports-env-fn": {
		syntax: "env( <ident> )"
	},
	"supports-feature": {
		syntax: "<supports-selector-fn> | <supports-font-tech-fn> | <supports-font-format-fn> | <supports-at-rule-fn> | <supports-named-feature-fn> | <supports-env-fn> | <supports-decl>"
	},
	"supports-font-format-fn": {
		syntax: "font-format( <font-format> )"
	},
	"supports-font-tech-fn": {
		syntax: "font-tech( <font-tech> )"
	},
	"supports-import-condition": {
		syntax: "supports( [ <supports-condition> | <declaration> ] )"
	},
	"supports-in-parens": {
		syntax: "( <supports-condition> ) | <supports-feature> | <general-enclosed>"
	},
	"supports-named-feature-fn": {
		syntax: "named-feature( <ident> )"
	},
	"supports-selector-fn": {
		syntax: "selector( <complex-selector> )"
	},
	"svg-paint": {
		syntax: "child | child( <integer> )"
	},
	symbol: {
		syntax: "<string> | <image> | <custom-ident>"
	},
	"symbolic-counter-style": {
		syntax: "disc | circle | square | disclosure-open | disclosure-closed"
	},
	"symbols-type": {
		syntax: "cyclic | numeric | alphabetic | symbolic | fixed"
	},
	"syntax-combinator": {
		syntax: "'|'"
	},
	"syntax-component": {
		syntax: "<syntax-single-component> <syntax-multiplier>? | '<' transform-list '>'"
	},
	"syntax-multiplier": {
		syntax: "[ '#' | '+' ]"
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
	"system-color": {
		syntax: "AccentColor | AccentColorText | ActiveText | ButtonBorder | ButtonFace | ButtonText | Canvas | CanvasText | Field | FieldText | GrayText | Highlight | HighlightText | LinkText | Mark | MarkText | SelectedItem | SelectedItemText | VisitedText | <deprecated-color>"
	},
	"system-font-family-name": {
		syntax: "caption | icon | menu | message-box | small-caption | status-bar"
	},
	target: {
		syntax: "<target-counter()> | <target-counters()> | <target-text()>"
	},
	"target-contrast": {
		syntax: "<wcag2>"
	},
	"text-edge": {
		syntax: "[ text | ideographic | ideographic-ink ] | [ text | ideographic | ideographic-ink | cap | ex ] [ text | ideographic | ideographic-ink | alphabetic ]"
	},
	"time-percentage": {
		syntax: "[ <time> | <percentage> ]"
	},
	"track-breadth": {
		syntax: "<length-percentage [0,∞]> | <flex [0,∞]> | min-content | max-content | auto | <-non-standard-size>"
	},
	"track-list": {
		syntax: "[ <line-names>? [ <track-size> | <track-repeat> ] ]+ <line-names>?"
	},
	"track-repeat": {
		syntax: "repeat( [ <integer [1,∞]> ] , [ <line-names>? <track-size> ]+ <line-names>? )"
	},
	"track-size": {
		syntax: "<track-breadth> | minmax( <inflexible-breadth> , <track-breadth> ) | fit-content( <length-percentage [0,∞]> )"
	},
	"transform-function": {
		syntax: "<scale3d()> | <scale()> | <scaleX()> | <scaleY()> | <scaleZ()> | <translate3d()> | <translate()> | <translateX()> | <translateY()> | <translateZ()> | <rotate3d()> | <rotate()> | <rotateX()> | <rotateY()> | <rotateZ()> | <skew()> | <skewX()> | <skewY()> | <matrix3d()> | <matrix()> | <perspective()>"
	},
	"transform-list": {
		syntax: "<transform-function>+"
	},
	"transition-behavior-value": {
		syntax: "normal | allow-discrete"
	},
	"try-size": {
		syntax: "most-width | most-height | most-block-size | most-inline-size"
	},
	"try-tactic": {
		syntax: "flip-block || flip-inline || flip-start || flip-x || flip-y"
	},
	type: {
		syntax: "'<' [ number | string ] '>'"
	},
	"type-selector": {
		syntax: "<wq-name> | <ns-prefix>? '*'"
	},
	url: {
		syntax: "<url()> | <src()>"
	},
	"var-args": {
		syntax: "var( <declaration-value> , <declaration-value>? )"
	},
	"vertical-line-command": {
		syntax: "vline [ to [ <length-percentage> | top | center | bottom | y-start | y-end ] | by <length-percentage> ]"
	},
	"view-transition-type": {
		syntax: "<custom-ident>"
	},
	"visual-box": {
		syntax: "content-box | padding-box | border-box"
	},
	wcag2: {
		syntax: "wcag2 | wcag2([<number> | [ aa | aaa ] && large? ])"
	},
	"wq-name": {
		syntax: "<ns-prefix>? <ident-token>"
	},
	"xyz-params": {
		syntax: "<xyz-space> [ <number> | <percentage> | none ]{3}"
	},
	"xyz-space": {
		syntax: "xyz | xyz-d50 | xyz-d65"
	}
};
var units = [
	"Hz",
	"Q",
	"cap",
	"ch",
	"cm",
	"dB",
	"deg",
	"dpcm",
	"dpi",
	"dppx",
	"dvb",
	"dvh",
	"dvi",
	"dvmax",
	"dvmin",
	"dvw",
	"em",
	"ex",
	"fr",
	"grad",
	"ic",
	"in",
	"kHz",
	"lh",
	"lvb",
	"lvh",
	"lvi",
	"lvmax",
	"lvmin",
	"lvw",
	"mm",
	"ms",
	"pc",
	"pt",
	"px",
	"rad",
	"rcap",
	"rch",
	"rem",
	"rex",
	"ric",
	"rlh",
	"s",
	"st",
	"svb",
	"svh",
	"svi",
	"svmax",
	"svmin",
	"svw",
	"turn",
	"vb",
	"vh",
	"vi",
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
