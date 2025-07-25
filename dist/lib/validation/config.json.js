var declarations = {
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
		syntax: "<string>"
	},
	"-ms-flow-from": {
		syntax: "[ none | <custom-ident> ]#"
	},
	"-ms-flow-into": {
		syntax: "[ none | <custom-ident> ]#"
	},
	"-ms-grid-columns": {
		syntax: "none | <track-list> | <auto-track-list>"
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
	"-ms-hyphenate-limit-lines": {
		syntax: "no-limit | <integer>"
	},
	"-ms-hyphenate-limit-zone": {
		syntax: "<percentage> | <length>"
	},
	"-ms-ime-align": {
		syntax: "auto | after"
	},
	"-ms-overflow-style": {
		syntax: "auto | none | scrollbar | -ms-autohiding-scrollbar auto | none | scrollbar | -ms-autohiding-scrollbar"
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
	"-moz-appearance": {
		syntax: "none | button | button-arrow-down | button-arrow-next | button-arrow-previous | button-arrow-up | button-bevel | button-focus | caret | checkbox | checkbox-container | checkbox-label | checkmenuitem | dualbutton | groupbox | listbox | listitem | menuarrow | menubar | menucheckbox | menuimage | menuitem | menuitemtext | menulist | menulist-button | menulist-text | menulist-textfield | menupopup | menuradio | menuseparator | meterbar | meterchunk | progressbar | progressbar-vertical | progresschunk | progresschunk-vertical | radio | radio-container | radio-label | radiomenuitem | range | range-thumb | resizer | resizerpanel | scale-horizontal | scalethumbend | scalethumb-horizontal | scalethumbstart | scalethumbtick | scalethumb-vertical | scale-vertical | scrollbarbutton-down | scrollbarbutton-left | scrollbarbutton-right | scrollbarbutton-up | scrollbarthumb-horizontal | scrollbarthumb-vertical | scrollbartrack-horizontal | scrollbartrack-vertical | searchfield | separator | sheet | spinner | spinner-downbutton | spinner-textfield | spinner-upbutton | splitter | statusbar | statusbarpanel | tab | tabpanel | tabpanels | tab-scroll-arrow-back | tab-scroll-arrow-forward | textfield | textfield-multiline | toolbar | toolbarbutton | toolbarbutton-dropdown | toolbargripper | toolbox | tooltip | treeheader | treeheadercell | treeheadersortarrow | treeitem | treeline | treetwisty | treetwistyopen | treeview | -moz-mac-unified-toolbar | -moz-win-borderless-glass | -moz-win-browsertabbar-toolbox | -moz-win-communicationstext | -moz-win-communications-toolbox | -moz-win-exclude-glass | -moz-win-glass | -moz-win-mediatext | -moz-win-media-toolbox | -moz-window-button-box | -moz-window-button-box-maximized | -moz-window-button-close | -moz-window-button-maximize | -moz-window-button-minimize | -moz-window-button-restore | -moz-window-frame-bottom | -moz-window-frame-left | -moz-window-frame-right | -moz-window-titlebar | -moz-window-titlebar-maximized"
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
	"-moz-border-right-colors": {
		syntax: "<color>+ | none"
	},
	"-moz-border-top-colors": {
		syntax: "<color>+ | none"
	},
	"-moz-context-properties": {
		syntax: "none | [ fill | fill-opacity | stroke | stroke-opacity ]#"
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
	"-moz-window-dragging": {
		syntax: "drag | no-drag"
	},
	"-moz-window-shadow": {
		syntax: "default | menu | tooltip | sheet | none"
	},
	"-webkit-appearance": {
		syntax: "none | button | button-bevel | caret | checkbox | default-button | inner-spin-button | listbox | listitem | media-controls-background | media-controls-fullscreen-background | media-current-time-display | media-enter-fullscreen-button | media-exit-fullscreen-button | media-fullscreen-button | media-mute-button | media-overlay-play-button | media-play-button | media-seek-back-button | media-seek-forward-button | media-slider | media-sliderthumb | media-time-remaining-display | media-toggle-closed-captions-button | media-volume-slider | media-volume-slider-container | media-volume-sliderthumb | menulist | menulist-button | menulist-text | menulist-textfield | meter | progress-bar | progress-bar-value | push-button | radio | searchfield | searchfield-cancel-button | searchfield-decoration | searchfield-results-button | searchfield-results-decoration | slider-horizontal | slider-vertical | sliderthumb-horizontal | sliderthumb-vertical | square-button | textarea | textfield | -apple-pay-button none | button | button-bevel | caps-lock-indicator | caret | checkbox | default-button | inner-spin-button | listbox | listitem | media-controls-background | media-controls-fullscreen-background | media-current-time-display | media-enter-fullscreen-button | media-exit-fullscreen-button | media-fullscreen-button | media-mute-button | media-overlay-play-button | media-play-button | media-seek-back-button | media-seek-forward-button | media-slider | media-sliderthumb | media-time-remaining-display | media-toggle-closed-captions-button | media-volume-slider | media-volume-slider-container | media-volume-sliderthumb | menulist | menulist-button | menulist-text | menulist-textfield | meter | progress-bar | progress-bar-value | push-button | radio | scrollbarbutton-down | scrollbarbutton-left | scrollbarbutton-right | scrollbarbutton-up | scrollbargripper-horizontal | scrollbargripper-vertical | scrollbarthumb-horizontal | scrollbarthumb-vertical | scrollbartrack-horizontal | scrollbartrack-vertical | searchfield | searchfield-cancel-button | searchfield-decoration | searchfield-results-button | searchfield-results-decoration | slider-horizontal | slider-vertical | sliderthumb-horizontal | sliderthumb-vertical | square-button | textarea | textfield | -apple-pay-button"
	},
	"-webkit-border-before": {
		syntax: "<'border-width'> || <'border-style'> || <color>"
	},
	"-webkit-border-before-color": {
		syntax: "<color>"
	},
	"-webkit-border-before-style": {
		syntax: "<'border-style'>"
	},
	"-webkit-border-before-width": {
		syntax: "<'border-width'>"
	},
	"-webkit-box-reflect": {
		syntax: "[ above | below | right | left ]? <length>? <image>?"
	},
	"-webkit-line-clamp": {
		syntax: "none | <integer>"
	},
	"-webkit-mask": {
		syntax: "[ <mask-reference> || <position> [ / <bg-size> ]? || <repeat-style> || [ <visual-box> | border | padding | content | text ] || [ <visual-box> | border | padding | content ] ]#"
	},
	"-webkit-mask-attachment": {
		syntax: "<attachment>#"
	},
	"-webkit-mask-clip": {
		syntax: "[ <coord-box> | no-clip | border | padding | content | text ]#"
	},
	"-webkit-mask-composite": {
		syntax: "<composite-style>#"
	},
	"-webkit-mask-image": {
		syntax: "<mask-reference>#"
	},
	"-webkit-mask-origin": {
		syntax: "[ <coord-box> | border | padding | content ]#"
	},
	"-webkit-mask-position": {
		syntax: "<position>#"
	},
	"-webkit-mask-position-x": {
		syntax: "[ <length-percentage> | left | center | right ]#"
	},
	"-webkit-mask-position-y": {
		syntax: "[ <length-percentage> | top | center | bottom ]#"
	},
	"-webkit-mask-repeat": {
		syntax: "<repeat-style>#"
	},
	"-webkit-mask-repeat-x": {
		syntax: "repeat | no-repeat | space | round"
	},
	"-webkit-mask-repeat-y": {
		syntax: "repeat | no-repeat | space | round"
	},
	"-webkit-mask-size": {
		syntax: "<bg-size>#"
	},
	"-webkit-overflow-scrolling": {
		syntax: "auto | touch"
	},
	"-webkit-tap-highlight-color": {
		syntax: "<color>"
	},
	"-webkit-text-fill-color": {
		syntax: "<color>"
	},
	"-webkit-text-stroke": {
		syntax: "<length> || <color>"
	},
	"-webkit-text-stroke-color": {
		syntax: "<color>"
	},
	"-webkit-text-stroke-width": {
		syntax: "<length>"
	},
	"-webkit-touch-callout": {
		syntax: "default | none"
	},
	"-webkit-user-modify": {
		syntax: "read-only | read-write | read-write-plaintext-only"
	},
	"-webkit-user-select": {
		syntax: "auto | text | none | all auto | none | text | all"
	},
	"accent-color": {
		syntax: "auto | <color>"
	},
	"align-content": {
		syntax: "normal | <baseline-position> | <content-distribution> | <overflow-position>? <content-position>"
	},
	"align-items": {
		syntax: "normal | stretch | <baseline-position> | [ <overflow-position>? <self-position> ]"
	},
	"align-self": {
		syntax: "auto | normal | stretch | <baseline-position> | <overflow-position>? <self-position>"
	},
	"align-tracks": {
		syntax: "[ normal | <baseline-position> | <content-distribution> | <overflow-position>? <content-position> ]#"
	},
	"alignment-baseline": {
		syntax: "baseline | alphabetic | ideographic | middle | central | mathematical | text-before-edge | text-after-edge auto | baseline | before-edge | text-before-edge | middle | central | after-edge | text-after-edge | ideographic | alphabetic | hanging | mathematical"
	},
	all: {
		syntax: "initial | inherit | unset | revert | revert-layer"
	},
	"anchor-name": {
		syntax: "none | <dashed-ident>#"
	},
	"anchor-scope": {
		syntax: "none | all | <dashed-ident>#"
	},
	animation: {
		syntax: "<single-animation>#"
	},
	"animation-composition": {
		syntax: "<single-animation-composition>#"
	},
	"animation-delay": {
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
	appearance: {
		syntax: "none | auto | textfield | menulist-button | <compat-auto>"
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
		syntax: "[ <bg-layer> , ]* <final-bg-layer>"
	},
	"background-attachment": {
		syntax: "<attachment>#"
	},
	"background-blend-mode": {
		syntax: "<blend-mode>#"
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
	"background-position-x": {
		syntax: "[ center | [ [ left | right | x-start | x-end ]? <length-percentage>? ]! ]#"
	},
	"background-position-y": {
		syntax: "[ center | [ [ top | bottom | y-start | y-end ]? <length-percentage>? ]! ]#"
	},
	"background-repeat": {
		syntax: "<repeat-style>#"
	},
	"background-size": {
		syntax: "<bg-size>#"
	},
	"baseline-shift": {
		syntax: "<length-percentage> | sub | super | baseline baseline | sub | super | <svg-length>"
	},
	"block-size": {
		syntax: "<'width'>"
	},
	border: {
		syntax: "<line-width> || <line-style> || <color>"
	},
	"border-block": {
		syntax: "<'border-block-start'>"
	},
	"border-block-color": {
		syntax: "<'border-top-color'>{1,2}"
	},
	"border-block-end": {
		syntax: "<'border-top-width'> || <'border-top-style'> || <color>"
	},
	"border-block-end-color": {
		syntax: "<'border-top-color'>"
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
	"border-block-start-color": {
		syntax: "<'border-top-color'>"
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
		syntax: "<line-width> || <line-style> || <color>"
	},
	"border-bottom-color": {
		syntax: "<'border-top-color'>"
	},
	"border-bottom-left-radius": {
		syntax: "<length-percentage>{1,2}"
	},
	"border-bottom-right-radius": {
		syntax: "<length-percentage>{1,2}"
	},
	"border-bottom-style": {
		syntax: "<line-style>"
	},
	"border-bottom-width": {
		syntax: "<line-width>"
	},
	"border-collapse": {
		syntax: "collapse | separate"
	},
	"border-color": {
		syntax: "<color>{1,4}"
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
		syntax: "[ <length> | <number> ]{1,4}"
	},
	"border-image-repeat": {
		syntax: "[ stretch | repeat | round | space ]{1,2}"
	},
	"border-image-slice": {
		syntax: "<number-percentage>{1,4} && fill?"
	},
	"border-image-source": {
		syntax: "none | <image>"
	},
	"border-image-width": {
		syntax: "[ <length-percentage> | <number> | auto ]{1,4}"
	},
	"border-inline": {
		syntax: "<'border-block-start'>"
	},
	"border-inline-color": {
		syntax: "<'border-top-color'>{1,2}"
	},
	"border-inline-end": {
		syntax: "<'border-top-width'> || <'border-top-style'> || <color>"
	},
	"border-inline-end-color": {
		syntax: "<'border-top-color'>"
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
	"border-inline-start-color": {
		syntax: "<'border-top-color'>"
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
		syntax: "<line-width> || <line-style> || <color>"
	},
	"border-left-color": {
		syntax: "<color>"
	},
	"border-left-style": {
		syntax: "<line-style>"
	},
	"border-left-width": {
		syntax: "<line-width>"
	},
	"border-radius": {
		syntax: "<length-percentage>{1,4} [ / <length-percentage>{1,4} ]?"
	},
	"border-right": {
		syntax: "<line-width> || <line-style> || <color>"
	},
	"border-right-color": {
		syntax: "<color>"
	},
	"border-right-style": {
		syntax: "<line-style>"
	},
	"border-right-width": {
		syntax: "<line-width>"
	},
	"border-spacing": {
		syntax: "<length> <length>?"
	},
	"border-start-end-radius": {
		syntax: "<'border-top-left-radius'>"
	},
	"border-start-start-radius": {
		syntax: "<'border-top-left-radius'>"
	},
	"border-style": {
		syntax: "<line-style>{1,4}"
	},
	"border-top": {
		syntax: "<line-width> || <line-style> || <color>"
	},
	"border-top-color": {
		syntax: "<color>"
	},
	"border-top-left-radius": {
		syntax: "<length-percentage>{1,2}"
	},
	"border-top-right-radius": {
		syntax: "<length-percentage>{1,2}"
	},
	"border-top-style": {
		syntax: "<line-style>"
	},
	"border-top-width": {
		syntax: "<line-width>"
	},
	"border-width": {
		syntax: "<line-width>{1,4}"
	},
	bottom: {
		syntax: "<length> | <percentage> | auto"
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
		syntax: "none | <shadow>#"
	},
	"box-sizing": {
		syntax: "content-box | border-box"
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
		syntax: "<'caret-color'> || <'caret-shape'>"
	},
	"caret-color": {
		syntax: "auto | <color>"
	},
	"caret-shape": {
		syntax: "auto | bar | block | underscore"
	},
	clear: {
		syntax: "none | left | right | both | inline-start | inline-end"
	},
	clip: {
		syntax: "<shape> | auto"
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
	"color-interpolation-filters": {
		syntax: "auto | sRGB | linearRGB"
	},
	"color-scheme": {
		syntax: "normal | [ light | dark | <custom-ident> ]+ && only?"
	},
	"column-count": {
		syntax: "<integer> | auto"
	},
	"column-fill": {
		syntax: "auto | balance"
	},
	"column-gap": {
		syntax: "normal | <length-percentage>"
	},
	"column-rule": {
		syntax: "<'column-rule-width'> || <'column-rule-style'> || <'column-rule-color'>"
	},
	"column-rule-color": {
		syntax: "<color>"
	},
	"column-rule-style": {
		syntax: "<'border-style'>"
	},
	"column-rule-width": {
		syntax: "<'border-width'>"
	},
	"column-span": {
		syntax: "none | all"
	},
	"column-width": {
		syntax: "<length> | auto"
	},
	columns: {
		syntax: "<'column-width'> || <'column-count'>"
	},
	contain: {
		syntax: "none | strict | content | [ [ size || inline-size ] || layout || style || paint ]"
	},
	"contain-intrinsic-block-size": {
		syntax: "auto? [ none | <length> ]"
	},
	"contain-intrinsic-height": {
		syntax: "auto? [ none | <length> ]"
	},
	"contain-intrinsic-inline-size": {
		syntax: "auto? [ none | <length> ]"
	},
	"contain-intrinsic-size": {
		syntax: "[ auto? [ none | <length> ] ]{1,2}"
	},
	"contain-intrinsic-width": {
		syntax: "auto? [ none | <length> ]"
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
		syntax: "normal | none | [ <content-replacement> | <content-list> ] [/ [ <string> | <counter> ]+ ]?"
	},
	"content-visibility": {
		syntax: "visible | auto | hidden"
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
	cursor: {
		syntax: "[ [ <url> [ <x> <y> ]? , ]* [ auto | default | none | context-menu | help | pointer | progress | wait | cell | crosshair | text | vertical-text | alias | copy | move | no-drop | not-allowed | e-resize | n-resize | ne-resize | nw-resize | s-resize | se-resize | sw-resize | w-resize | ew-resize | ns-resize | nesw-resize | nwse-resize | col-resize | row-resize | all-scroll | zoom-in | zoom-out | grab | grabbing ] ] [ [ <url> [ <x> <y> ]? , ]* [ auto | default | none | context-menu | help | pointer | progress | wait | cell | crosshair | text | vertical-text | alias | copy | move | no-drop | not-allowed | e-resize | n-resize | ne-resize | nw-resize | s-resize | se-resize | sw-resize | w-resize | ew-resize | ns-resize | nesw-resize | nwse-resize | col-resize | row-resize | all-scroll | zoom-in | zoom-out | grab | grabbing | hand | -webkit-grab | -webkit-grabbing | -webkit-zoom-in | -webkit-zoom-out | -moz-grab | -moz-grabbing | -moz-zoom-in | -moz-zoom-out ] ]"
	},
	cx: {
		syntax: "<length> | <percentage>"
	},
	cy: {
		syntax: "<length> | <percentage>"
	},
	d: {
		syntax: "none | path(<string>)"
	},
	direction: {
		syntax: "ltr | rtl"
	},
	display: {
		syntax: "[ <display-outside> || <display-inside> ] | <display-listitem> | <display-internal> | <display-box> | <display-legacy> | <-non-standard-display>"
	},
	"dominant-baseline": {
		syntax: "auto | text-bottom | alphabetic | ideographic | middle | central | mathematical | hanging | text-top auto | use-script | no-change | reset-size | ideographic | alphabetic | hanging | mathematical | central | middle | text-after-edge | text-before-edge"
	},
	"empty-cells": {
		syntax: "show | hide"
	},
	"field-sizing": {
		syntax: "content | fixed"
	},
	fill: {
		syntax: "<paint>"
	},
	"fill-opacity": {
		syntax: "<'opacity'> <number-zero-one>"
	},
	"fill-rule": {
		syntax: "nonzero | evenodd"
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
		syntax: "<number>"
	},
	"flex-shrink": {
		syntax: "<number>"
	},
	"flex-wrap": {
		syntax: "nowrap | wrap | wrap-reverse"
	},
	float: {
		syntax: "left | right | none | inline-start | inline-end"
	},
	"flood-color": {
		syntax: "<color>"
	},
	"flood-opacity": {
		syntax: "<'opacity'>"
	},
	font: {
		syntax: "[ [ <'font-style'> || <font-variant-css2> || <'font-weight'> || <font-width-css3> ]? <'font-size'> [ / <'line-height'> ]? <'font-family'># ] | <system-family-name> [ [ <'font-style'> || <font-variant-css2> || <'font-weight'> || <font-width-css3> ]? <'font-size'> [ / <'line-height'> ]? <'font-family'># ] | <system-family-name> | <-non-standard-font>"
	},
	"font-family": {
		syntax: "[ <family-name> | <generic-family> ]#"
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
		syntax: "none | [ ex-height | cap-height | ch-width | ic-width | ic-height ]? [ from-font | <number> ]"
	},
	"font-smooth": {
		syntax: "auto | never | always | <absolute-size> | <length>"
	},
	"font-stretch": {
		syntax: "<font-stretch-absolute>"
	},
	"font-style": {
		syntax: "normal | italic | oblique <angle>?"
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
		syntax: "auto | none"
	},
	"font-synthesis-weight": {
		syntax: "auto | none"
	},
	"font-variant": {
		syntax: "normal | none | [ <common-lig-values> || <discretionary-lig-values> || <historical-lig-values> || <contextual-alt-values> || stylistic( <feature-value-name> ) || historical-forms || styleset( <feature-value-name># ) || character-variant( <feature-value-name># ) || swash( <feature-value-name> ) || ornaments( <feature-value-name> ) || annotation( <feature-value-name> ) || [ small-caps | all-small-caps | petite-caps | all-petite-caps | unicase | titling-caps ] || <numeric-figure-values> || <numeric-spacing-values> || <numeric-fraction-values> || ordinal || slashed-zero || <east-asian-variant-values> || <east-asian-width-values> || ruby ]"
	},
	"font-variant-alternates": {
		syntax: "normal | [ stylistic( <feature-value-name> ) || historical-forms || styleset( <feature-value-name># ) || character-variant( <feature-value-name># ) || swash( <feature-value-name> ) || ornaments( <feature-value-name> ) || annotation( <feature-value-name> ) ]"
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
		syntax: "normal | [ <string> <number> ]#"
	},
	"font-weight": {
		syntax: "<font-weight-absolute> | bolder | lighter"
	},
	"font-width": {
		syntax: "normal | <percentage [0,∞]> | ultra-condensed | extra-condensed | condensed | semi-condensed | semi-expanded | expanded | extra-expanded | ultra-expanded"
	},
	"forced-color-adjust": {
		syntax: "auto | none | preserve-parent-color"
	},
	gap: {
		syntax: "<'row-gap'> <'column-gap'>?"
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
	"grid-column-gap": {
		syntax: "<length-percentage>"
	},
	"grid-column-start": {
		syntax: "<grid-line>"
	},
	"grid-gap": {
		syntax: "<'grid-row-gap'> <'grid-column-gap'>?"
	},
	"grid-row": {
		syntax: "<grid-line> [ / <grid-line> ]?"
	},
	"grid-row-end": {
		syntax: "<grid-line>"
	},
	"grid-row-gap": {
		syntax: "<length-percentage>"
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
		syntax: "auto | <length-percentage [0,∞]> | min-content | max-content | fit-content | fit-content(<length-percentage [0,∞]>) | <calc-size()> | <anchor-size()> | stretch | <-non-standard-size>"
	},
	"hyphenate-character": {
		syntax: "auto | <string>"
	},
	"hyphenate-limit-chars": {
		syntax: "[ auto | <integer> ]{1,3}"
	},
	hyphens: {
		syntax: "none | manual | auto"
	},
	"image-orientation": {
		syntax: "from-image | <angle> | [ <angle>? flip ]"
	},
	"image-rendering": {
		syntax: "auto | crisp-edges | pixelated | smooth | optimizeSpeed | optimizeQuality | <-non-standard-image-rendering>"
	},
	"image-resolution": {
		syntax: "[ from-image || <resolution> ] && snap?"
	},
	"ime-mode": {
		syntax: "auto | normal | active | inactive | disabled"
	},
	"initial-letter": {
		syntax: "normal | [ <number> <integer>? ]"
	},
	"initial-letter-align": {
		syntax: "[ auto | alphabetic | hanging | ideographic ]"
	},
	"inline-size": {
		syntax: "<'width'>"
	},
	inset: {
		syntax: "<'top'>{1,4}"
	},
	"inset-block": {
		syntax: "<'top'>{1,2}"
	},
	"inset-block-end": {
		syntax: "<'top'>"
	},
	"inset-block-start": {
		syntax: "<'top'>"
	},
	"inset-inline": {
		syntax: "<'top'>{1,2}"
	},
	"inset-inline-end": {
		syntax: "<'top'>"
	},
	"inset-inline-start": {
		syntax: "<'top'>"
	},
	"interpolate-size": {
		syntax: "numeric-only | allow-keywords"
	},
	isolation: {
		syntax: "auto | isolate"
	},
	"justify-content": {
		syntax: "normal | <content-distribution> | <overflow-position>? [ <content-position> | left | right ]"
	},
	"justify-items": {
		syntax: "normal | stretch | <baseline-position> | <overflow-position>? [ <self-position> | left | right ] | legacy | legacy && [ left | right | center ]"
	},
	"justify-self": {
		syntax: "auto | normal | stretch | <baseline-position> | <overflow-position>? [ <self-position> | left | right ]"
	},
	"justify-tracks": {
		syntax: "[ normal | <content-distribution> | <overflow-position>? [ <content-position> | left | right ] ]#"
	},
	left: {
		syntax: "<length> | <percentage> | auto"
	},
	"letter-spacing": {
		syntax: "normal | <length> normal | <length-percentage>"
	},
	"lighting-color": {
		syntax: "<color>"
	},
	"line-break": {
		syntax: "auto | loose | normal | strict | anywhere"
	},
	"line-clamp": {
		syntax: "none | <integer>"
	},
	"line-height": {
		syntax: "normal | <number> | <length> | <percentage>"
	},
	"line-height-step": {
		syntax: "<length>"
	},
	"list-style": {
		syntax: "<'list-style-type'> || <'list-style-position'> || <'list-style-image'>"
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
		syntax: "<length-percentage> | auto"
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
		syntax: "<length-percentage> | auto"
	},
	"margin-right": {
		syntax: "<length-percentage> | auto"
	},
	"margin-top": {
		syntax: "<length-percentage> | auto"
	},
	"margin-trim": {
		syntax: "none | in-flow | all"
	},
	marker: {
		syntax: "none | <url>"
	},
	"marker-end": {
		syntax: "none | <url>"
	},
	"marker-mid": {
		syntax: "none | <url>"
	},
	"marker-start": {
		syntax: "none | <url>"
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
		syntax: "[ <length> | <number> ]{1,4}"
	},
	"mask-border-repeat": {
		syntax: "[ stretch | repeat | round | space ]{1,2}"
	},
	"mask-border-slice": {
		syntax: "<number-percentage>{1,4} fill?"
	},
	"mask-border-source": {
		syntax: "none | <image>"
	},
	"mask-border-width": {
		syntax: "[ <length-percentage> | <number> | auto ]{1,4}"
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
		syntax: "<'max-width'>"
	},
	"max-height": {
		syntax: "none | <length-percentage [0,∞]> | min-content | max-content | fit-content | fit-content(<length-percentage [0,∞]>) | <calc-size()> | <anchor-size()> | stretch | <-non-standard-size>"
	},
	"max-inline-size": {
		syntax: "<'max-width'>"
	},
	"max-lines": {
		syntax: "none | <integer>"
	},
	"max-width": {
		syntax: "none | <length-percentage [0,∞]> | min-content | max-content | fit-content | fit-content(<length-percentage [0,∞]>) | <calc-size()> | <anchor-size()> | stretch | <-non-standard-size>"
	},
	"min-block-size": {
		syntax: "<'min-width'>"
	},
	"min-height": {
		syntax: "auto | <length-percentage [0,∞]> | min-content | max-content | fit-content | fit-content(<length-percentage [0,∞]>) | <calc-size()> | <anchor-size()> | stretch | <-non-standard-size>"
	},
	"min-inline-size": {
		syntax: "<'min-width'>"
	},
	"min-width": {
		syntax: "auto | <length-percentage [0,∞]> | min-content | max-content | fit-content | fit-content(<length-percentage [0,∞]>) | <calc-size()> | <anchor-size()> | stretch | <-non-standard-size>"
	},
	"mix-blend-mode": {
		syntax: "<blend-mode> | plus-lighter"
	},
	"object-fit": {
		syntax: "fill | contain | cover | none | scale-down"
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
		syntax: "<integer>"
	},
	outline: {
		syntax: "<'outline-width'> || <'outline-style'> || <'outline-color'>"
	},
	"outline-color": {
		syntax: "auto | <color>"
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
		syntax: "[ visible | hidden | clip | scroll | auto ]{1,2} | <-non-standard-overflow>"
	},
	"overflow-anchor": {
		syntax: "auto | none"
	},
	"overflow-block": {
		syntax: "visible | hidden | clip | scroll | auto"
	},
	"overflow-clip-box": {
		syntax: "padding-box | content-box"
	},
	"overflow-clip-margin": {
		syntax: "<visual-box> || <length [0,∞]>"
	},
	"overflow-inline": {
		syntax: "visible | hidden | clip | scroll | auto"
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
		syntax: "[ contain | none | auto ]{1,2}"
	},
	"overscroll-behavior-block": {
		syntax: "contain | none | auto"
	},
	"overscroll-behavior-inline": {
		syntax: "contain | none | auto"
	},
	"overscroll-behavior-x": {
		syntax: "contain | none | auto"
	},
	"overscroll-behavior-y": {
		syntax: "contain | none | auto"
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
		syntax: "auto | always | avoid | left | right | recto | verso"
	},
	"page-break-before": {
		syntax: "auto | always | avoid | left | right | recto | verso"
	},
	"page-break-inside": {
		syntax: "auto | avoid"
	},
	"paint-order": {
		syntax: "normal | [ fill || stroke || markers ]"
	},
	perspective: {
		syntax: "none | <length>"
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
		syntax: "auto | none | visiblePainted | visibleFill | visibleStroke | visible | painted | fill | stroke | all | inherit"
	},
	position: {
		syntax: "static | relative | absolute | sticky | fixed | -webkit-sticky"
	},
	"position-anchor": {
		syntax: "auto | <anchor-name>"
	},
	"position-area": {
		syntax: "none | <position-area>"
	},
	"position-try": {
		syntax: "<'position-try-order'>? <'position-try-fallbacks'>"
	},
	"position-try-fallbacks": {
		syntax: "none | [ [<dashed-ident> || <try-tactic>] | <'position-area'> ]#"
	},
	"position-try-order": {
		syntax: "normal | <try-size>"
	},
	"position-visibility": {
		syntax: "always | [ anchors-valid || anchors-visible || no-overflow ]"
	},
	"print-color-adjust": {
		syntax: "economy | exact"
	},
	quotes: {
		syntax: "none | auto | [ <string> <string> ]+"
	},
	r: {
		syntax: "<length> | <percentage>"
	},
	resize: {
		syntax: "none | both | horizontal | vertical | block | inline"
	},
	right: {
		syntax: "<length> | <percentage> | auto"
	},
	rotate: {
		syntax: "none | <angle> | [ x | y | z | <number>{3} ] && <angle>"
	},
	"row-gap": {
		syntax: "normal | <length-percentage>"
	},
	"ruby-align": {
		syntax: "start | center | space-between | space-around"
	},
	"ruby-merge": {
		syntax: "separate | collapse | auto"
	},
	"ruby-overhang": {
		syntax: "auto | none"
	},
	"ruby-position": {
		syntax: "[ alternate || [ over | under ] ] | inter-character"
	},
	rx: {
		syntax: "<length> | <percentage>"
	},
	ry: {
		syntax: "<length> | <percentage>"
	},
	scale: {
		syntax: "none | [ <number> | <percentage> ]{1,3}"
	},
	"scroll-behavior": {
		syntax: "auto | smooth"
	},
	"scroll-initial-target": {
		syntax: "none | nearest"
	},
	"scroll-margin": {
		syntax: "<length>{1,4}"
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
		syntax: "<length>"
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
		syntax: "<length>"
	},
	"scroll-margin-right": {
		syntax: "<length>"
	},
	"scroll-margin-top": {
		syntax: "<length>"
	},
	"scroll-padding": {
		syntax: "[ auto | <length-percentage> ]{1,4}"
	},
	"scroll-padding-block": {
		syntax: "[ auto | <length-percentage> ]{1,2}"
	},
	"scroll-padding-block-end": {
		syntax: "auto | <length-percentage>"
	},
	"scroll-padding-block-start": {
		syntax: "auto | <length-percentage>"
	},
	"scroll-padding-bottom": {
		syntax: "auto | <length-percentage>"
	},
	"scroll-padding-inline": {
		syntax: "[ auto | <length-percentage> ]{1,2}"
	},
	"scroll-padding-inline-end": {
		syntax: "auto | <length-percentage>"
	},
	"scroll-padding-inline-start": {
		syntax: "auto | <length-percentage>"
	},
	"scroll-padding-left": {
		syntax: "auto | <length-percentage>"
	},
	"scroll-padding-right": {
		syntax: "auto | <length-percentage>"
	},
	"scroll-padding-top": {
		syntax: "auto | <length-percentage>"
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
		syntax: "none | [ x | y | block | inline | both ] [ mandatory | proximity ]?"
	},
	"scroll-snap-type-x": {
		syntax: "none | mandatory | proximity"
	},
	"scroll-snap-type-y": {
		syntax: "none | mandatory | proximity"
	},
	"scroll-timeline": {
		syntax: "[ <'scroll-timeline-name'> <'scroll-timeline-axis'>? ]#"
	},
	"scroll-timeline-axis": {
		syntax: "[ block | inline | x | y ]#"
	},
	"scroll-timeline-name": {
		syntax: "[ none | <dashed-ident> ]#"
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
	"shape-margin": {
		syntax: "<length-percentage>"
	},
	"shape-outside": {
		syntax: "none | [ <shape-box> || <basic-shape> ] | <image>"
	},
	"shape-rendering": {
		syntax: "auto | optimizeSpeed | crispEdges | geometricPrecision"
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
	stroke: {
		syntax: "<paint>"
	},
	"stroke-color": {
		syntax: "<color>"
	},
	"stroke-dasharray": {
		syntax: "none | <dasharray> none | [ <svg-length>+ ]#"
	},
	"stroke-dashoffset": {
		syntax: "<length-percentage> | <number> <svg-length>"
	},
	"stroke-linecap": {
		syntax: "butt | round | square"
	},
	"stroke-linejoin": {
		syntax: "miter | miter-clip | round | bevel | arcs miter | round | bevel"
	},
	"stroke-miterlimit": {
		syntax: "<number> <number-one-or-greater>"
	},
	"stroke-opacity": {
		syntax: "<'opacity'>"
	},
	"stroke-width": {
		syntax: "<length-percentage> | <number> <svg-length>"
	},
	"tab-size": {
		syntax: "<integer> | <length>"
	},
	"table-layout": {
		syntax: "auto | fixed"
	},
	"text-align": {
		syntax: "start | end | left | right | center | justify | match-parent | <-non-standard-text-align>"
	},
	"text-align-last": {
		syntax: "auto | start | end | left | right | center | justify"
	},
	"text-anchor": {
		syntax: "start | middle | end"
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
		syntax: "none | all | [ digits <integer>? ]"
	},
	"text-decoration": {
		syntax: "<'text-decoration-line'> || <'text-decoration-style'> || <'text-decoration-color'> || <'text-decoration-thickness'>"
	},
	"text-decoration-color": {
		syntax: "<color>"
	},
	"text-decoration-line": {
		syntax: "none | [ underline || overline || line-through || blink ] | spelling-error | grammar-error"
	},
	"text-decoration-skip": {
		syntax: "none | [ objects || [ spaces | [ leading-spaces || trailing-spaces ] ] || edges || box-decoration ]"
	},
	"text-decoration-skip-ink": {
		syntax: "auto | all | none"
	},
	"text-decoration-style": {
		syntax: "solid | double | dotted | dashed | wavy"
	},
	"text-decoration-thickness": {
		syntax: "auto | from-font | <length> | <percentage> "
	},
	"text-emphasis": {
		syntax: "<'text-emphasis-style'> || <'text-emphasis-color'>"
	},
	"text-emphasis-color": {
		syntax: "<color>"
	},
	"text-emphasis-position": {
		syntax: "auto | [ over | under ] && [ right | left ]?"
	},
	"text-emphasis-style": {
		syntax: "none | [ [ filled | open ] || [ dot | circle | double-circle | triangle | sesame ] ] | <string>"
	},
	"text-indent": {
		syntax: "<length-percentage> && hanging? && each-line?"
	},
	"text-justify": {
		syntax: "auto | inter-character | inter-word | none"
	},
	"text-orientation": {
		syntax: "mixed | upright | sideways"
	},
	"text-overflow": {
		syntax: "[ clip | ellipsis | <string> ]{1,2}"
	},
	"text-rendering": {
		syntax: "auto | optimizeSpeed | optimizeLegibility | geometricPrecision"
	},
	"text-shadow": {
		syntax: "none | <shadow-t>#"
	},
	"text-size-adjust": {
		syntax: "none | auto | <percentage>"
	},
	"text-spacing-trim": {
		syntax: "space-all | normal | space-first | trim-start"
	},
	"text-transform": {
		syntax: "none | [ capitalize | uppercase | lowercase ] || full-width || full-size-kana | math-auto"
	},
	"text-underline-offset": {
		syntax: "auto | <length> | <percentage> "
	},
	"text-underline-position": {
		syntax: "auto | from-font | [ under || [ left | right ] ]"
	},
	"text-wrap": {
		syntax: "<'text-wrap-mode'> || <'text-wrap-style'>"
	},
	"text-wrap-mode": {
		syntax: "wrap | nowrap"
	},
	"text-wrap-style": {
		syntax: "auto | balance | stable | pretty"
	},
	"timeline-scope": {
		syntax: "none | <dashed-ident>#"
	},
	top: {
		syntax: "<length> | <percentage> | auto"
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
		syntax: "[ <length-percentage> | left | center | right | top | bottom ] | [ [ <length-percentage> | left | center | right ] && [ <length-percentage> | top | center | bottom ] ] <length>?"
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
		syntax: "<time>#"
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
	"unicode-bidi": {
		syntax: "normal | embed | isolate | bidi-override | isolate-override | plaintext | -moz-isolate | -moz-isolate-override | -moz-plaintext | -webkit-isolate | -webkit-isolate-override | -webkit-plaintext"
	},
	"user-select": {
		syntax: "auto | text | none | all"
	},
	"vector-effect": {
		syntax: "none | non-scaling-stroke | non-scaling-size | non-rotation | fixed-position"
	},
	"vertical-align": {
		syntax: "baseline | sub | super | text-top | text-bottom | middle | top | bottom | <percentage> | <length>"
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
	"view-transition-name": {
		syntax: "none | <custom-ident> | match-element"
	},
	visibility: {
		syntax: "visible | hidden | collapse"
	},
	"white-space": {
		syntax: "normal | pre | pre-wrap | pre-line | <'white-space-collapse'> || <'text-wrap-mode'>"
	},
	"white-space-collapse": {
		syntax: "collapse | preserve | preserve-breaks | preserve-spaces | break-spaces"
	},
	widows: {
		syntax: "<integer>"
	},
	width: {
		syntax: "auto | <length-percentage [0,∞]> | min-content | max-content | fit-content | fit-content(<length-percentage [0,∞]>) | <calc-size()> | <anchor-size()> | stretch | <-non-standard-size>"
	},
	"will-change": {
		syntax: "auto | <animateable-feature>#"
	},
	"word-break": {
		syntax: "normal | break-all | keep-all | break-word | auto-phrase"
	},
	"word-spacing": {
		syntax: "normal | <length>"
	},
	"word-wrap": {
		syntax: "normal | break-word"
	},
	"writing-mode": {
		syntax: "horizontal-tb | vertical-rl | vertical-lr | sideways-rl | sideways-lr | <svg-writing-mode>"
	},
	x: {
		syntax: "<length> | <percentage>"
	},
	y: {
		syntax: "<length> | <percentage>"
	},
	"z-index": {
		syntax: "auto | <integer>"
	},
	zoom: {
		syntax: "normal | reset | <number [0,∞]> || <percentage [0,∞]>"
	},
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
	"-ms-flex-pack": {
		syntax: "start | end | center | justify | distribute"
	},
	"-ms-flex-order": {
		syntax: "<integer>"
	},
	"-ms-flex-positive": {
		syntax: "<'flex-grow'>"
	},
	"-ms-flex-preferred-size": {
		syntax: "<'flex-basis'>"
	},
	"-ms-interpolation-mode": {
		syntax: "nearest-neighbor | bicubic"
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
	"-webkit-mask-box-image": {
		syntax: "[ <url> | <gradient> | none ] [ <length-percentage>{4} <-webkit-mask-box-repeat>{2} ]?"
	},
	"-webkit-print-color-adjust": {
		syntax: "economy | exact"
	},
	"-webkit-text-security": {
		syntax: "none | circle | disc | square"
	},
	"-webkit-user-drag": {
		syntax: "none | element | auto"
	},
	behavior: {
		syntax: "<url>+"
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
	"glyph-orientation-horizontal": {
		syntax: "<angle>"
	},
	"glyph-orientation-vertical": {
		syntax: "<angle>"
	},
	kerning: {
		syntax: "auto | <svg-length>"
	},
	pause: {
		syntax: "<'pause-before'> <'pause-after'>?"
	},
	"pause-after": {
		syntax: "<time> | none | x-weak | weak | medium | strong | x-strong"
	},
	"pause-before": {
		syntax: "<time> | none | x-weak | weak | medium | strong | x-strong"
	},
	"position-try-options": {
		syntax: "<'position-try-fallbacks'>"
	},
	rest: {
		syntax: "<'rest-before'> <'rest-after'>?"
	},
	"rest-after": {
		syntax: "<time> | none | x-weak | weak | medium | strong | x-strong"
	},
	"rest-before": {
		syntax: "<time> | none | x-weak | weak | medium | strong | x-strong"
	},
	speak: {
		syntax: "auto | never | always"
	},
	"voice-balance": {
		syntax: "<number> | left | center | right | leftwards | rightwards"
	},
	"voice-duration": {
		syntax: "auto | <time>"
	},
	"voice-family": {
		syntax: "[ [ <family-name> | <generic-voice> ] , ]* [ <family-name> | <generic-voice> ] | preserve"
	},
	"voice-pitch": {
		syntax: "<frequency> && absolute | [ [ x-low | low | medium | high | x-high ] || [ <frequency> | <semitones> | <percentage> ] ]"
	},
	"voice-range": {
		syntax: "<frequency> && absolute | [ [ x-low | low | medium | high | x-high ] || [ <frequency> | <semitones> | <percentage> ] ]"
	},
	"voice-rate": {
		syntax: "[ normal | x-slow | slow | medium | fast | x-fast ] || <percentage>"
	},
	"voice-stress": {
		syntax: "normal | strong | moderate | none | reduced"
	},
	"voice-volume": {
		syntax: "silent | [ [ x-soft | soft | medium | loud | x-loud ] || <decibel> ]"
	},
	"white-space-trim": {
		syntax: "none | discard-before || discard-after || discard-inner"
	}
};
var functions = {
	abs: {
		syntax: "abs( <calc-sum> )"
	},
	acos: {
		syntax: "acos( <calc-sum> )"
	},
	anchor: {
		syntax: "anchor( <anchor-name>? && <anchor-side>, <length-percentage>? )"
	},
	"anchor-size": {
		syntax: "anchor-size( [ <anchor-name> || <anchor-size> ]? , <length-percentage>? )"
	},
	asin: {
		syntax: "asin( <calc-sum> )"
	},
	atan: {
		syntax: "atan( <calc-sum> )"
	},
	atan2: {
		syntax: "atan2( <calc-sum>, <calc-sum> )"
	},
	attr: {
		syntax: "attr( <attr-name> <type-or-unit>? [, <attr-fallback> ]? )"
	},
	blur: {
		syntax: "blur( <length>? )"
	},
	brightness: {
		syntax: "brightness( [ <number> | <percentage> ]? )"
	},
	calc: {
		syntax: "calc( <calc-sum> )"
	},
	"calc-size": {
		syntax: "calc-size( <calc-size-basis>, <calc-sum> )"
	},
	circle: {
		syntax: "circle( <radial-size>? [ at <position> ]? )"
	},
	clamp: {
		syntax: "clamp( <calc-sum>#{3} )"
	},
	color: {
		syntax: "color( [ from <color> ]? <colorspace-params> [ / [ <alpha-value> | none ] ]? )"
	},
	"color-mix": {
		syntax: "color-mix( <color-interpolation-method> , [ <color> && <percentage [0,100]>? ]#{2})"
	},
	"conic-gradient": {
		syntax: "conic-gradient( [ <conic-gradient-syntax> ] )"
	},
	contrast: {
		syntax: "contrast( [ <number> | <percentage> ]? )"
	},
	cos: {
		syntax: "cos( <calc-sum> )"
	},
	counter: {
		syntax: "counter( <counter-name>, <counter-style>? )"
	},
	counters: {
		syntax: "counters( <counter-name>, <string>, <counter-style>? )"
	},
	"cross-fade": {
		syntax: "cross-fade( <cf-mixing-image> , <cf-final-image>? )"
	},
	"cubic-bezier": {
		syntax: "cubic-bezier( [ <number [0,1]>, <number> ]#{2} )"
	},
	"drop-shadow": {
		syntax: "drop-shadow( [ <color>? && <length>{2,3} ] )"
	},
	element: {
		syntax: "element( <id-selector> )"
	},
	ellipse: {
		syntax: "ellipse( <radial-size>? [ at <position> ]? )"
	},
	env: {
		syntax: "env( <custom-ident> , <declaration-value>? )"
	},
	exp: {
		syntax: "exp( <calc-sum> )"
	},
	"fit-content": {
		syntax: "fit-content( <length-percentage [0,∞]> )"
	},
	grayscale: {
		syntax: "grayscale( [ <number> | <percentage> ]? )"
	},
	hsl: {
		syntax: "hsl( <hue>, <percentage>, <percentage>, <alpha-value>? ) | hsl( [ <hue> | none ] [ <percentage> | <number> | none ] [ <percentage> | <number> | none ] [ / [ <alpha-value> | none ] ]? )"
	},
	hsla: {
		syntax: "hsla( <hue>, <percentage>, <percentage>, <alpha-value>? ) | hsla( [ <hue> | none ] [ <percentage> | <number> | none ] [ <percentage> | <number> | none ] [ / [ <alpha-value> | none ] ]? )"
	},
	"hue-rotate": {
		syntax: "hue-rotate( [ <angle> | <zero> ]? )"
	},
	hwb: {
		syntax: "hwb( [ <hue> | none ] [ <percentage> | <number> | none ] [ <percentage> | <number> | none ] [ / [ <alpha-value> | none ] ]? )"
	},
	hypot: {
		syntax: "hypot( <calc-sum># )"
	},
	image: {
		syntax: "image( <image-tags>? [ <image-src>? , <color>? ]! )"
	},
	"image-set": {
		syntax: "image-set( <image-set-option># )"
	},
	inset: {
		syntax: "inset( <length-percentage>{1,4} [ round <'border-radius'> ]? )"
	},
	invert: {
		syntax: "invert( [ <number> | <percentage> ]? )"
	},
	lab: {
		syntax: "lab( [<percentage> | <number> | none] [ <percentage> | <number> | none] [ <percentage> | <number> | none] [ / [<alpha-value> | none] ]? )"
	},
	layer: {
		syntax: "layer( <layer-name> )"
	},
	lch: {
		syntax: "lch( [<percentage> | <number> | none] [ <percentage> | <number> | none] [ <hue> | none] [ / [<alpha-value> | none] ]? )"
	},
	leader: {
		syntax: "leader( <leader-type> )"
	},
	"light-dark": {
		syntax: "light-dark( <color>, <color> )"
	},
	linear: {
		syntax: "linear( [ <number> && <percentage>{0,2} ]# )"
	},
	"linear-gradient": {
		syntax: "linear-gradient( [ <linear-gradient-syntax> ] )"
	},
	log: {
		syntax: "log( <calc-sum>, <calc-sum>? )"
	},
	matrix: {
		syntax: "matrix( <number>#{6} )"
	},
	matrix3d: {
		syntax: "matrix3d( <number>#{16} )"
	},
	max: {
		syntax: "max( <calc-sum># )"
	},
	min: {
		syntax: "min( <calc-sum># )"
	},
	minmax: {
		syntax: "minmax( [ <length-percentage> | min-content | max-content | auto ] , [ <length-percentage> | <flex> | min-content | max-content | auto ] )"
	},
	mod: {
		syntax: "mod( <calc-sum>, <calc-sum> )"
	},
	oklab: {
		syntax: "oklab( [ <percentage> | <number> | none] [ <percentage> | <number> | none] [ <percentage> | <number> | none] [ / [<alpha-value> | none] ]? )"
	},
	oklch: {
		syntax: "oklch( [ <percentage> | <number> | none] [ <percentage> | <number> | none] [ <hue> | none] [ / [<alpha-value> | none] ]? )"
	},
	opacity: {
		syntax: "opacity( [ <number> | <percentage> ]? )"
	},
	paint: {
		syntax: "paint( <ident>, <declaration-value>? )"
	},
	"palette-mix": {
		syntax: "palette-mix(<color-interpolation-method> , [ [normal | light | dark | <palette-identifier> | <palette-mix()> ] && <percentage [0,100]>? ]#{2})"
	},
	path: {
		syntax: "path( <'fill-rule'>? , <string> )"
	},
	perspective: {
		syntax: "perspective( [ <length [0,∞]> | none ] )"
	},
	polygon: {
		syntax: "polygon( <'fill-rule'>? , [ <length-percentage> <length-percentage> ]# )"
	},
	pow: {
		syntax: "pow( <calc-sum>, <calc-sum> )"
	},
	"radial-gradient": {
		syntax: "radial-gradient( [ <radial-gradient-syntax> ] )"
	},
	ray: {
		syntax: "ray( <angle> && <ray-size>? && contain? && [at <position>]? )"
	},
	rect: {
		syntax: "rect( [ <length-percentage> | auto ]{4} [ round <'border-radius'> ]? )"
	},
	rem: {
		syntax: "rem( <calc-sum>, <calc-sum> )"
	},
	"repeating-conic-gradient": {
		syntax: "repeating-conic-gradient( [ <conic-gradient-syntax> ] )"
	},
	"repeating-linear-gradient": {
		syntax: "repeating-linear-gradient( [ <linear-gradient-syntax> ] )"
	},
	"repeating-radial-gradient": {
		syntax: "repeating-radial-gradient( [ <radial-gradient-syntax> ] )"
	},
	rgb: {
		syntax: "rgb( <percentage>#{3} , <alpha-value>? ) | rgb( <number>#{3} , <alpha-value>? ) | rgb( [ <number> | <percentage> | none ]{3} [ / [ <alpha-value> | none ] ]? )"
	},
	rgba: {
		syntax: "rgba( <percentage>#{3} , <alpha-value>? ) | rgba( <number>#{3} , <alpha-value>? ) | rgba( [ <number> | <percentage> | none ]{3} [ / [ <alpha-value> | none ] ]? )"
	},
	rotate: {
		syntax: "rotate( [ <angle> | <zero> ] )"
	},
	rotate3d: {
		syntax: "rotate3d( <number> , <number> , <number> , [ <angle> | <zero> ] )"
	},
	rotateX: {
		syntax: "rotateX( [ <angle> | <zero> ] )"
	},
	rotateY: {
		syntax: "rotateY( [ <angle> | <zero> ] )"
	},
	rotateZ: {
		syntax: "rotateZ( [ <angle> | <zero> ] )"
	},
	round: {
		syntax: "round( <rounding-strategy>?, <calc-sum>, <calc-sum> )"
	},
	saturate: {
		syntax: "saturate( [ <number> | <percentage> ]? )"
	},
	scale: {
		syntax: "scale( [ <number> | <percentage> ]#{1,2} )"
	},
	scale3d: {
		syntax: "scale3d( [ <number> | <percentage> ]#{3} )"
	},
	scaleX: {
		syntax: "scaleX( [ <number> | <percentage> ] )"
	},
	scaleY: {
		syntax: "scaleY( [ <number> | <percentage> ] )"
	},
	scaleZ: {
		syntax: "scaleZ( [ <number> | <percentage> ] )"
	},
	scroll: {
		syntax: "scroll( [ <scroller> || <axis> ]? )"
	},
	sepia: {
		syntax: "sepia( [ <number> | <percentage> ]? )"
	},
	sign: {
		syntax: "sign( <calc-sum> )"
	},
	sin: {
		syntax: "sin( <calc-sum> )"
	},
	skew: {
		syntax: "skew( [ <angle> | <zero> ] , [ <angle> | <zero> ]? )"
	},
	skewX: {
		syntax: "skewX( [ <angle> | <zero> ] )"
	},
	skewY: {
		syntax: "skewY( [ <angle> | <zero> ] )"
	},
	sqrt: {
		syntax: "sqrt( <calc-sum> )"
	},
	steps: {
		syntax: "steps( <integer>, <step-position>? )"
	},
	symbols: {
		syntax: "symbols( <symbols-type>? [ <string> | <image> ]+ )"
	},
	tan: {
		syntax: "tan( <calc-sum> )"
	},
	"target-counter": {
		syntax: "target-counter( [ <string> | <url> ] , <custom-ident> , <counter-style>? )"
	},
	"target-counters": {
		syntax: "target-counters( [ <string> | <url> ] , <custom-ident> , <string> , <counter-style>? )"
	},
	"target-text": {
		syntax: "target-text( [ <string> | <url> ] , [ content | before | after | first-letter ]? )"
	},
	translate: {
		syntax: "translate( <length-percentage> , <length-percentage>? )"
	},
	translate3d: {
		syntax: "translate3d( <length-percentage> , <length-percentage> , <length> )"
	},
	translateX: {
		syntax: "translateX( <length-percentage> )"
	},
	translateY: {
		syntax: "translateY( <length-percentage> )"
	},
	translateZ: {
		syntax: "translateZ( <length> )"
	},
	"var": {
		syntax: "var( <custom-property-name> , <declaration-value>? )"
	},
	view: {
		syntax: "view([<axis> || <'view-timeline-inset'>]?)"
	},
	xywh: {
		syntax: "xywh( <length-percentage>{2} <length-percentage [0,∞]>{2} [ round <'border-radius'> ]? )"
	}
};
var syntaxes = {
	"abs()": {
		syntax: "abs( <calc-sum> )"
	},
	"absolute-size": {
		syntax: "xx-small | x-small | small | medium | large | x-large | xx-large | xxx-large"
	},
	"acos()": {
		syntax: "acos( <calc-sum> )"
	},
	"alpha-value": {
		syntax: "<number> | <percentage>"
	},
	"an+b": {
		syntax: "odd | even | <integer> | <n-dimension> | '+'?† n | -n | <ndashdigit-dimension> | '+'?† <ndashdigit-ident> | <dashndashdigit-ident> | <n-dimension> <signed-integer> | '+'?† n <signed-integer> | -n <signed-integer> | <ndash-dimension> <signless-integer> | '+'?† n- <signless-integer> | -n- <signless-integer> | <n-dimension> ['+' | '-'] <signless-integer> | '+'?† n ['+' | '-'] <signless-integer> | -n ['+' | '-'] <signless-integer>"
	},
	"anchor()": {
		syntax: "anchor( <anchor-name>? && <anchor-side>, <length-percentage>? )"
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
	"anchor-size()": {
		syntax: "anchor-size( [ <anchor-name> || <anchor-size> ]? , <length-percentage>? )"
	},
	"angle-percentage": {
		syntax: "<angle> | <percentage>"
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
	"asin()": {
		syntax: "asin( <calc-sum> )"
	},
	"atan()": {
		syntax: "atan( <calc-sum> )"
	},
	"atan2()": {
		syntax: "atan2( <calc-sum>, <calc-sum> )"
	},
	attachment: {
		syntax: "scroll | fixed | local"
	},
	"attr()": {
		syntax: "attr( <attr-name> <type-or-unit>? [, <attr-fallback> ]? )"
	},
	"attr-matcher": {
		syntax: "[ '~' | '|' | '^' | '$' | '*' ]? '='"
	},
	"attr-modifier": {
		syntax: "i | s"
	},
	"attribute-selector": {
		syntax: "'[' <wq-name> ']' | '[' <wq-name> <attr-matcher> [ <string-token> | <ident-token> ] <attr-modifier>? ']'"
	},
	"auto-repeat": {
		syntax: "repeat( [ auto-fill | auto-fit ] , [ <line-names>? <fixed-size> ]+ <line-names>? )"
	},
	"auto-track-list": {
		syntax: "[ <line-names>? [ <fixed-size> | <fixed-repeat> ] ]* <line-names>? <auto-repeat>\n[ <line-names>? [ <fixed-size> | <fixed-repeat> ] ]* <line-names>?"
	},
	axis: {
		syntax: "block | inline | x | y"
	},
	"baseline-position": {
		syntax: "[ first | last ]? baseline"
	},
	"basic-shape": {
		syntax: "<inset()> | <xywh()> | <rect()> | <circle()> | <ellipse()> | <polygon()> | <path()>"
	},
	"basic-shape-rect": {
		syntax: "<inset()> | <rect()> | <xywh()>"
	},
	"bg-clip": {
		syntax: "<visual-box> | border-area | text"
	},
	"bg-image": {
		syntax: "none | <image>"
	},
	"bg-layer": {
		syntax: "<bg-image> || <bg-position> [ / <bg-size> ]? || <repeat-style> || <attachment> || <visual-box> || <visual-box>"
	},
	"bg-position": {
		syntax: "[ [ left | center | right | top | bottom | <length-percentage> ] | [ left | center | right | <length-percentage> ] [ top | center | bottom | <length-percentage> ] | [ center | [ left | right ] <length-percentage>? ] && [ center | [ top | bottom ] <length-percentage>? ] ]"
	},
	"bg-size": {
		syntax: "[ <length-percentage> | auto ]{1,2} | cover | contain"
	},
	"blend-mode": {
		syntax: "normal | multiply | screen | overlay | darken | lighten | color-dodge | color-burn | hard-light | soft-light | difference | exclusion | hue | saturation | color | luminosity"
	},
	"blur()": {
		syntax: "blur( <length>? )"
	},
	"brightness()": {
		syntax: "brightness( [ <number> | <percentage> ]? )"
	},
	"calc()": {
		syntax: "calc( <calc-sum> )"
	},
	"calc-constant": {
		syntax: "e | pi | infinity | -infinity | NaN"
	},
	"calc-product": {
		syntax: "<calc-value> [ '*' <calc-value> | '/' <number> ]*"
	},
	"calc-size()": {
		syntax: "calc-size( <calc-size-basis>, <calc-sum> )"
	},
	"calc-size-basis": {
		syntax: "<intrinsic-size-keyword> | <calc-size()> | any | <calc-sum>"
	},
	"calc-sum": {
		syntax: "<calc-product> [ [ '+' | '-' ] <calc-product> ]*"
	},
	"calc-value": {
		syntax: "<number> | <dimension> | <percentage> | <calc-constant> | ( <calc-sum> )"
	},
	"cf-final-image": {
		syntax: "<image> | <color>"
	},
	"cf-mixing-image": {
		syntax: "<percentage>? && <image>"
	},
	"circle()": {
		syntax: "circle( <radial-size>? [ at <position> ]? )"
	},
	"clamp()": {
		syntax: "clamp( <calc-sum>#{3} )"
	},
	"class-selector": {
		syntax: "'.' <ident-token>"
	},
	"clip-source": {
		syntax: "<url>"
	},
	color: {
		syntax: "<color-base> | currentColor | <system-color> | <device-cmyk()>  | <light-dark()> | <-non-standard-color>"
	},
	"color()": {
		syntax: "color( <colorspace-params> [ / [ <alpha-value> | none ] ]? )"
	},
	"color-base": {
		syntax: "<hex-color> | <color-function> | <named-color> | <color-mix()> | transparent"
	},
	"color-function": {
		syntax: "<rgb()> | <rgba()> | <hsl()> | <hsla()> | <hwb()> | <lab()> | <lch()> | <oklab()> | <oklch()> | <color()>"
	},
	"color-interpolation-method": {
		syntax: "in [ <rectangular-color-space> | <polar-color-space> <hue-interpolation-method>? | <custom-color-space> ]"
	},
	"color-mix()": {
		syntax: "color-mix( <color-interpolation-method> , [ <color> && <percentage [0,100]>? ]#{2} )"
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
	"colorspace-params": {
		syntax: "[ <predefined-rgb-params> | <xyz-params>]"
	},
	combinator: {
		syntax: "'>' | '+' | '~' | [ '|' '|' ]"
	},
	"common-lig-values": {
		syntax: "[ common-ligatures | no-common-ligatures ]"
	},
	"compat-auto": {
		syntax: "searchfield | textarea | push-button | slider-horizontal | checkbox | radio | square-button | menulist | listbox | meter | progress-bar | button"
	},
	"complex-selector": {
		syntax: "<complex-selector-unit> [ <combinator>? <complex-selector-unit> ]*"
	},
	"complex-selector-list": {
		syntax: "<complex-selector>#"
	},
	"composite-style": {
		syntax: "clear | copy | source-over | source-in | source-out | source-atop | destination-over | destination-in | destination-out | destination-atop | xor"
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
	"conic-gradient()": {
		syntax: "conic-gradient( [ <conic-gradient-syntax> ] )"
	},
	"conic-gradient-syntax": {
		syntax: "[ [ [ from [ <angle> | <zero> ] ]? [ at <position> ]? ] || <color-interpolation-method> ]? , <angular-color-stop-list>"
	},
	"container-condition": {
		syntax: "not <query-in-parens> | <query-in-parens> [ [ and <query-in-parens> ]* | [ or <query-in-parens> ]* ]"
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
	"content-list": {
		syntax: "[ <string> | contents | <image> | <counter> | <quote> | <target> | <leader()> | <attr()> ]+"
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
	"contrast()": {
		syntax: "contrast( [ <number> | <percentage> ]? )"
	},
	"coord-box": {
		syntax: "content-box | padding-box | border-box | fill-box | stroke-box | view-box"
	},
	"cos()": {
		syntax: "cos( <calc-sum> )"
	},
	counter: {
		syntax: "<counter()> | <counters()>"
	},
	"counter()": {
		syntax: "counter( <counter-name>, <counter-style>? )"
	},
	"counter-name": {
		syntax: "<custom-ident>"
	},
	"counter-style": {
		syntax: "<counter-style-name> | symbols()"
	},
	"counter-style-name": {
		syntax: "<custom-ident>"
	},
	"counters()": {
		syntax: "counters( <counter-name>, <string>, <counter-style>? )"
	},
	"cross-fade()": {
		syntax: "cross-fade( <cf-mixing-image> , <cf-final-image>? )"
	},
	"cubic-bezier()": {
		syntax: "cubic-bezier( [ <number [0,1]>, <number> ]#{2} )"
	},
	"cubic-bezier-easing-function": {
		syntax: "ease | ease-in | ease-out | ease-in-out | cubic-bezier( <number [0,1]> , <number> , <number [0,1]> , <number> )"
	},
	"custom-color-space": {
		syntax: "<dashed-ident>"
	},
	"custom-params": {
		syntax: "<dashed-ident> [ <number> | <percentage> | none ]+"
	},
	dasharray: {
		syntax: "[ [ <length-percentage> | <number> ]+ ]#"
	},
	"dashndashdigit-ident": {
		syntax: "<ident-token>"
	},
	"deprecated-system-color": {
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
		syntax: "inline-block | inline-list-item | inline-table | inline-flex | inline-grid"
	},
	"display-listitem": {
		syntax: "<display-outside>? && [ flow | flow-root ]? && list-item"
	},
	"display-outside": {
		syntax: "block | inline | run-in"
	},
	"drop-shadow()": {
		syntax: "drop-shadow( [ <color>? && <length>{2,3} ] )"
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
	"element()": {
		syntax: "element( <custom-ident> , [ first | start | last | first-except ]? ) | element( <id-selector> )"
	},
	"ellipse()": {
		syntax: "ellipse( <radial-size>? [ at <position> ]? )"
	},
	"env()": {
		syntax: "env( <custom-ident> , <declaration-value>? )"
	},
	"exp()": {
		syntax: "exp( <calc-sum> )"
	},
	"explicit-track-list": {
		syntax: "[ <line-names>? <track-size> ]+ <line-names>?"
	},
	"family-name": {
		syntax: "<string> | <custom-ident>+"
	},
	"feature-tag-value": {
		syntax: "<string> [ <integer> | on | off ]?"
	},
	"feature-type": {
		syntax: "@stylistic | @historical-forms | @styleset | @character-variant | @swash | @ornaments | @annotation"
	},
	"feature-value-block": {
		syntax: "<feature-type> '{' <feature-value-declaration-list> '}'"
	},
	"feature-value-block-list": {
		syntax: "<feature-value-block>+"
	},
	"feature-value-declaration": {
		syntax: "<custom-ident>: <integer>+;"
	},
	"feature-value-declaration-list": {
		syntax: "<feature-value-declaration>"
	},
	"feature-value-name": {
		syntax: "<custom-ident>"
	},
	"filter-function": {
		syntax: "<blur()> | <brightness()> | <contrast()> | <drop-shadow()> | <grayscale()> | <hue-rotate()> | <invert()> | <opacity()> | <saturate()> | <sepia()>"
	},
	"filter-value-list": {
		syntax: "[ <filter-function> | <url> ]+"
	},
	"final-bg-layer": {
		syntax: "<'background-color'> || <bg-image> || <bg-position> [ / <bg-size> ]? || <repeat-style> || <attachment> || <visual-box> || <visual-box>"
	},
	"fit-content()": {
		syntax: "fit-content( <length-percentage [0,∞]> )"
	},
	"fixed-breadth": {
		syntax: "<length-percentage>"
	},
	"fixed-repeat": {
		syntax: "repeat( [ <integer [1,∞]> ] , [ <line-names>? <fixed-size> ]+ <line-names>? )"
	},
	"fixed-size": {
		syntax: "<fixed-breadth> | minmax( <fixed-breadth> , <track-breadth> ) | minmax( <inflexible-breadth> , <fixed-breadth> )"
	},
	"font-stretch-absolute": {
		syntax: "normal | ultra-condensed | extra-condensed | condensed | semi-condensed | semi-expanded | expanded | extra-expanded | ultra-expanded | <percentage>"
	},
	"font-variant-css2": {
		syntax: "normal | small-caps"
	},
	"font-weight-absolute": {
		syntax: "normal | bold | <number [1,1000]>"
	},
	"font-width-css3": {
		syntax: "normal | ultra-condensed | extra-condensed | condensed | semi-condensed | semi-expanded | expanded | extra-expanded | ultra-expanded"
	},
	"form-control-identifier": {
		syntax: "select"
	},
	"frequency-percentage": {
		syntax: "<frequency> | <percentage>"
	},
	"generic-complete": {
		syntax: "serif | sans-serif | system-ui | cursive | fantasy | math | monospace"
	},
	"general-enclosed": {
		syntax: "[ <function-token> <any-value>? ) ] | [ ( <any-value>? ) ]"
	},
	"generic-family": {
		syntax: "<generic-script-specific>| <generic-complete> | <generic-incomplete> | <-non-standard-generic-family>"
	},
	"generic-incomplete": {
		syntax: "ui-serif | ui-sans-serif | ui-monospace | ui-rounded"
	},
	"geometry-box": {
		syntax: "<shape-box> | fill-box | stroke-box | view-box"
	},
	gradient: {
		syntax: "| <-legacy-gradient>"
	},
	"grayscale()": {
		syntax: "grayscale( [ <number> | <percentage> ]? )"
	},
	"grid-line": {
		syntax: "auto | <custom-ident> | [ <integer> && <custom-ident>? ] | [ span && [ <integer> || <custom-ident> ] ]"
	},
	"historical-lig-values": {
		syntax: "[ historical-ligatures | no-historical-ligatures ]"
	},
	"hsl()": {
		syntax: "hsl( <hue>, <percentage>, <percentage>, <alpha-value>? ) | hsl( [ <hue> | none ] [ <percentage> | <number> | none ] [ <percentage> | <number> | none ] [ / [ <alpha-value> | none ] ]? )"
	},
	"hsla()": {
		syntax: "hsla( <hue>, <percentage>, <percentage>, <alpha-value>? ) | hsla( [ <hue> | none ] [ <percentage> | <number> | none ] [ <percentage> | <number> | none ] [ / [ <alpha-value> | none ] ]? )"
	},
	hue: {
		syntax: "<number> | <angle>"
	},
	"hue-interpolation-method": {
		syntax: "[ shorter | longer | increasing | decreasing ] hue"
	},
	"hue-rotate()": {
		syntax: "hue-rotate( [ <angle> | <zero> ]? )"
	},
	"hwb()": {
		syntax: "hwb( [ <hue> | none ] [ <percentage> | <number> | none ] [ <percentage> | <number> | none ] [ / [ <alpha-value> | none ] ]? )"
	},
	"hypot()": {
		syntax: "hypot( <calc-sum># )"
	},
	"id-selector": {
		syntax: "<hash-token>"
	},
	image: {
		syntax: "<url> | <image()> | <image-set()> | <element()> | <paint()> | <cross-fade()> | <gradient>"
	},
	"image()": {
		syntax: "image( <image-tags>? [ <image-src>? , <color>? ]! )"
	},
	"image-set()": {
		syntax: "image-set( <image-set-option># )"
	},
	"image-set-option": {
		syntax: "[ <image> | <string> ] [ <resolution> || type(<string>) ]"
	},
	"image-src": {
		syntax: "<url> | <string>"
	},
	"image-tags": {
		syntax: "ltr | rtl"
	},
	"inflexible-breadth": {
		syntax: "<length-percentage> | min-content | max-content | auto"
	},
	"inset()": {
		syntax: "inset( <length-percentage>{1,4} [ round <'border-radius'> ]? )"
	},
	integer: {
		syntax: "<number-token>"
	},
	"invert()": {
		syntax: "invert( [ <number> | <percentage> ]? )"
	},
	"keyframe-block": {
		syntax: "<keyframe-selector># {\n  <declaration-list>\n}"
	},
	"keyframe-selector": {
		syntax: "from | to | <percentage [0,100]> | <timeline-range-name> <percentage>"
	},
	"keyframes-name": {
		syntax: "<custom-ident> | <string>"
	},
	"lab()": {
		syntax: "lab( [<percentage> | <number> | none] [ <percentage> | <number> | none] [ <percentage> | <number> | none] [ / [<alpha-value> | none] ]? )"
	},
	"layer()": {
		syntax: "layer( <layer-name> )"
	},
	"layer-name": {
		syntax: "<ident> [ '.' <ident> ]*"
	},
	"lch()": {
		syntax: "lch( [<percentage> | <number> | none] [ <percentage> | <number> | none] [ <hue> | none] [ / [<alpha-value> | none] ]? )"
	},
	"leader()": {
		syntax: "leader( <leader-type> )"
	},
	"leader-type": {
		syntax: "dotted | solid | space | <string>"
	},
	"length-percentage": {
		syntax: "<length> | <percentage>"
	},
	"light-dark()": {
		syntax: "light-dark( <color>, <color> )"
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
	"line-width": {
		syntax: "<length> | thin | medium | thick"
	},
	"linear()": {
		syntax: "linear( [ <number> && <percentage>{0,2} ]# )"
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
	"linear-gradient()": {
		syntax: "linear-gradient( [ <linear-gradient-syntax> ] )"
	},
	"linear-gradient-syntax": {
		syntax: "[ [ <angle> | <zero> | to <side-or-corner> ] || <color-interpolation-method> ]? , <color-stop-list>"
	},
	"log()": {
		syntax: "log( <calc-sum>, <calc-sum>? )"
	},
	"mask-layer": {
		syntax: "<mask-reference> || <position> [ / <bg-size> ]? || <repeat-style> || <geometry-box> || [ <geometry-box> | no-clip ] || <compositing-operator> || <masking-mode>"
	},
	"mask-position": {
		syntax: "[ <length-percentage> | left | center | right ] [ <length-percentage> | top | center | bottom ]?"
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
	"matrix()": {
		syntax: "matrix( <number>#{6} )"
	},
	"matrix3d()": {
		syntax: "matrix3d( <number>#{16} )"
	},
	"max()": {
		syntax: "max( <calc-sum># )"
	},
	"media-and": {
		syntax: "<media-in-parens> [ and <media-in-parens> ]+"
	},
	"media-condition": {
		syntax: "<media-not> | <media-and> | <media-or> | <media-in-parens>"
	},
	"media-condition-without-or": {
		syntax: "<media-not> | <media-and> | <media-in-parens>"
	},
	"media-feature": {
		syntax: "( [ <mf-plain> | <mf-boolean> | <mf-range> ] )"
	},
	"media-in-parens": {
		syntax: "( <media-condition> ) | <media-feature> | <general-enclosed>"
	},
	"media-not": {
		syntax: "not <media-in-parens>"
	},
	"media-or": {
		syntax: "<media-in-parens> [ or <media-in-parens> ]+"
	},
	"media-query": {
		syntax: "<media-condition> | [ not | only ]? <media-type> [ and <media-condition-without-or> ]?"
	},
	"media-query-list": {
		syntax: "<media-query>#"
	},
	"media-type": {
		syntax: "<ident>"
	},
	"mf-boolean": {
		syntax: "<mf-name>"
	},
	"mf-name": {
		syntax: "<ident>"
	},
	"mf-plain": {
		syntax: "<mf-name> : <mf-value>"
	},
	"mf-range": {
		syntax: "<mf-name> [ '<' | '>' ]? '='? <mf-value>\n| <mf-value> [ '<' | '>' ]? '='? <mf-name>\n| <mf-value> '<' '='? <mf-name> '<' '='? <mf-value>\n| <mf-value> '>' '='? <mf-name> '>' '='? <mf-value>"
	},
	"mf-value": {
		syntax: "<number> | <dimension> | <ident> | <ratio>"
	},
	"min()": {
		syntax: "min( <calc-sum># )"
	},
	"minmax()": {
		syntax: "minmax( [ <length-percentage> | min-content | max-content | auto ] , [ <length-percentage> | <flex> | min-content | max-content | auto ] )"
	},
	"mod()": {
		syntax: "mod( <calc-sum>, <calc-sum> )"
	},
	"n-dimension": {
		syntax: "<dimension-token>"
	},
	"name-repeat": {
		syntax: "repeat( [ <integer [1,∞]> | auto-fill ], <line-names>+ )"
	},
	"named-color": {
		syntax: "aliceblue | antiquewhite | aqua | aquamarine | azure | beige | bisque | black | blanchedalmond | blue | blueviolet | brown | burlywood | cadetblue | chartreuse | chocolate | coral | cornflowerblue | cornsilk | crimson | cyan | darkblue | darkcyan | darkgoldenrod | darkgray | darkgreen | darkgrey | darkkhaki | darkmagenta | darkolivegreen | darkorange | darkorchid | darkred | darksalmon | darkseagreen | darkslateblue | darkslategray | darkslategrey | darkturquoise | darkviolet | deeppink | deepskyblue | dimgray | dimgrey | dodgerblue | firebrick | floralwhite | forestgreen | fuchsia | gainsboro | ghostwhite | gold | goldenrod | gray | green | greenyellow | grey | honeydew | hotpink | indianred | indigo | ivory | khaki | lavender | lavenderblush | lawngreen | lemonchiffon | lightblue | lightcoral | lightcyan | lightgoldenrodyellow | lightgray | lightgreen | lightgrey | lightpink | lightsalmon | lightseagreen | lightskyblue | lightslategray | lightslategrey | lightsteelblue | lightyellow | lime | limegreen | linen | magenta | maroon | mediumaquamarine | mediumblue | mediumorchid | mediumpurple | mediumseagreen | mediumslateblue | mediumspringgreen | mediumturquoise | mediumvioletred | midnightblue | mintcream | mistyrose | moccasin | navajowhite | navy | oldlace | olive | olivedrab | orange | orangered | orchid | palegoldenrod | palegreen | paleturquoise | palevioletred | papayawhip | peachpuff | peru | pink | plum | powderblue | purple | rebeccapurple | red | rosybrown | royalblue | saddlebrown | salmon | sandybrown | seagreen | seashell | sienna | silver | skyblue | slateblue | slategray | slategrey | snow | springgreen | steelblue | tan | teal | thistle | tomato | turquoise | violet | wheat | white | whitesmoke | yellow | yellowgreen"
	},
	"namespace-prefix": {
		syntax: "<ident>"
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
	"number-percentage": {
		syntax: "<number> | <percentage>"
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
	"oklab()": {
		syntax: "oklab( [ <percentage> | <number> | none] [ <percentage> | <number> | none] [ <percentage> | <number> | none] [ / [<alpha-value> | none] ]? )"
	},
	"oklch()": {
		syntax: "oklch( [ <percentage> | <number> | none] [ <percentage> | <number> | none] [ <hue> | none] [ / [<alpha-value> | none] ]? )"
	},
	"opacity()": {
		syntax: "opacity( [ <number> | <percentage> ]? )"
	},
	"opacity-value": {
		syntax: "<number> | <percentage>"
	},
	"outline-line-style": {
		syntax: "none | dotted | dashed | solid | double | groove | ridge | inset | outset"
	},
	"outline-radius": {
		syntax: "<length> | <percentage>"
	},
	"overflow-position": {
		syntax: "unsafe | safe"
	},
	"page-body": {
		syntax: "<declaration>? [ ; <page-body> ]? | <page-margin-box> <page-body>"
	},
	"page-margin-box": {
		syntax: "<page-margin-box-type> '{' <declaration-list> '}'"
	},
	"page-margin-box-type": {
		syntax: "@top-left-corner | @top-left | @top-center | @top-right | @top-right-corner | @bottom-left-corner | @bottom-left | @bottom-center | @bottom-right | @bottom-right-corner | @left-top | @left-middle | @left-bottom | @right-top | @right-middle | @right-bottom"
	},
	"page-selector": {
		syntax: "<pseudo-page>+ | <ident> <pseudo-page>*"
	},
	"page-selector-list": {
		syntax: "[ <page-selector># ]?"
	},
	"page-size": {
		syntax: "A5 | A4 | A3 | B5 | B4 | JIS-B5 | JIS-B4 | letter | legal | ledger"
	},
	paint: {
		syntax: "none | <color> | <url> [ none | <color> ]? | context-fill | context-stroke"
	},
	"paint()": {
		syntax: "paint( <ident>, <declaration-value>? )"
	},
	"paint-box": {
		syntax: "<visual-box> | fill-box | stroke-box"
	},
	"palette-identifier": {
		syntax: "<dashed-ident>"
	},
	"palette-mix()": {
		syntax: "palette-mix(<color-interpolation-method> , [ [normal | light | dark | <palette-identifier> | <palette-mix()> ] && <percentage [0,100]>? ]#{2})"
	},
	"path()": {
		syntax: "path( <'fill-rule'>? , <string> )"
	},
	"perspective()": {
		syntax: "perspective( [ <length [0,∞]> | none ] )"
	},
	"polar-color-space": {
		syntax: "hsl | hwb | lch | oklch"
	},
	"polygon()": {
		syntax: "polygon( <'fill-rule'>? , [ <length-percentage> <length-percentage> ]# )"
	},
	position: {
		syntax: "[ [ left | center | right ] || [ top | center | bottom ] | [ left | center | right | <length-percentage> ] [ top | center | bottom | <length-percentage> ]? | [ [ left | right ] <length-percentage> ] && [ [ top | bottom ] <length-percentage> ] ]"
	},
	"position-area": {
		syntax: "[ [ left | center | right | span-left | span-right | x-start | x-end | span-x-start | span-x-end | x-self-start | x-self-end | span-x-self-start | span-x-self-end | span-all ] || [ top | center | bottom | span-top | span-bottom | y-start | y-end | span-y-start | span-y-end | y-self-start | y-self-end | span-y-self-start | span-y-self-end | span-all ] | [ block-start | center | block-end | span-block-start | span-block-end | span-all ] || [ inline-start | center | inline-end | span-inline-start | span-inline-end | span-all ] | [ self-block-start | center | self-block-end | span-self-block-start | span-self-block-end | span-all ] || [ self-inline-start | center | self-inline-end | span-self-inline-start | span-self-inline-end | span-all ] | [ start | center | end | span-start | span-end | span-all ]{1,2} | [ self-start | center | self-end | span-self-start | span-self-end | span-all ]{1,2} ]"
	},
	"pow()": {
		syntax: "pow( <calc-sum>, <calc-sum> )"
	},
	"predefined-rgb": {
		syntax: "srgb | srgb-linear | display-p3 | a98-rgb | prophoto-rgb | rec2020"
	},
	"predefined-rgb-params": {
		syntax: "<predefined-rgb> [ <number> | <percentage> | none ]{3}"
	},
	"pseudo-class-selector": {
		syntax: "':' <ident-token> | ':' <function-token> <any-value> ')'"
	},
	"pseudo-element-selector": {
		syntax: "':' <pseudo-class-selector> | <legacy-pseudo-element-selector>"
	},
	"pseudo-page": {
		syntax: ": [ left | right | first | blank ]"
	},
	"query-in-parens": {
		syntax: "( <container-condition> ) | ( <size-feature> ) | style( <style-query> ) | <general-enclosed>"
	},
	quote: {
		syntax: "open-quote | close-quote | no-open-quote | no-close-quote"
	},
	"radial-extent": {
		syntax: "closest-corner | closest-side | farthest-corner | farthest-side"
	},
	"radial-gradient()": {
		syntax: "radial-gradient( [ <radial-gradient-syntax> ] )"
	},
	"radial-gradient-syntax": {
		syntax: "[ [ [ <radial-shape> || <radial-size> ]? [ at <position> ]? ] || <color-interpolation-method> ]? , <color-stop-list>"
	},
	"radial-shape": {
		syntax: "circle | ellipse"
	},
	"radial-size": {
		syntax: "<radial-extent> | <length [0,∞]> | <length-percentage [0,∞]>{2}"
	},
	ratio: {
		syntax: "<number [0,∞]> [ / <number [0,∞]> ]?"
	},
	"ray()": {
		syntax: "ray( <angle> && <ray-size>? && contain? && [at <position>]? )"
	},
	"ray-size": {
		syntax: "closest-side | closest-corner | farthest-side | farthest-corner | sides"
	},
	"rect()": {
		syntax: "rect( [ <length-percentage> | auto ]{4} [ round <'border-radius'> ]? )"
	},
	"rectangular-color-space": {
		syntax: "srgb | srgb-linear | display-p3 | a98-rgb | prophoto-rgb | rec2020 | lab | oklab | xyz | xyz-d50 | xyz-d65"
	},
	"relative-selector": {
		syntax: "<combinator>? <complex-selector>"
	},
	"relative-selector-list": {
		syntax: "<relative-selector>#"
	},
	"relative-size": {
		syntax: "larger | smaller"
	},
	"rem()": {
		syntax: "rem( <calc-sum>, <calc-sum> )"
	},
	"repeat-style": {
		syntax: "repeat-x | repeat-y | [ repeat | space | round | no-repeat ]{1,2}"
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
	"reversed-counter-name": {
		syntax: "reversed( <counter-name> )"
	},
	"rgb()": {
		syntax: "rgb( <percentage>#{3} , <alpha-value>? ) | rgb( <number>#{3} , <alpha-value>? ) | rgb( [ <number> | <percentage> | none ]{3} [ / [ <alpha-value> | none ] ]? )"
	},
	"rgba()": {
		syntax: "rgba( <percentage>#{3} , <alpha-value>? ) | rgba( <number>#{3} , <alpha-value>? ) | rgba( [ <number> | <percentage> | none ]{3} [ / [ <alpha-value> | none ] ]? )"
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
		syntax: "round( <rounding-strategy>?, <calc-sum>, <calc-sum> )"
	},
	"rounding-strategy": {
		syntax: "nearest | up | down | to-zero"
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
	"scope-end": {
		syntax: "<forgiving-selector-list>"
	},
	"scope-start": {
		syntax: "<forgiving-selector-list>"
	},
	"scroll()": {
		syntax: "scroll( [ <scroller> || <axis> ]? )"
	},
	scroller: {
		syntax: "root | nearest | self"
	},
	"scroll-state-feature": {
		syntax: "<media-query-list>"
	},
	"scroll-state-in-parens": {
		syntax: "( <scroll-state-query> ) | ( <scroll-state-feature> ) | <general-enclosed>"
	},
	"scroll-state-query": {
		syntax: "not <scroll-state-in-parens> | <scroll-state-in-parens> [ [ and <scroll-state-in-parens> ]* | [ or <scroll-state-in-parens> ]* ] | <scroll-state-feature>  "
	},
	"selector-list": {
		syntax: "<complex-selector-list>"
	},
	"self-position": {
		syntax: "center | start | end | self-start | self-end | flex-start | flex-end"
	},
	"sepia()": {
		syntax: "sepia( [ <number> | <percentage> ]? )"
	},
	shadow: {
		syntax: "inset? && <length>{2,4} && <color>?"
	},
	"shadow-t": {
		syntax: "[ <length>{2,3} && <color>? ]"
	},
	shape: {
		syntax: "rect( <top>, <right>, <bottom>, <left> ) | rect( <top> <right> <bottom> <left> )"
	},
	"shape-box": {
		syntax: "<visual-box> | margin-box"
	},
	"side-or-corner": {
		syntax: "[ left | right ] || [ top | bottom ]"
	},
	"sign()": {
		syntax: "sign( <calc-sum> )"
	},
	"signed-integer": {
		syntax: "<number-token>"
	},
	"signless-integer": {
		syntax: "<number-token>"
	},
	"sin()": {
		syntax: "sin( <calc-sum> )"
	},
	"single-animation": {
		syntax: "<'animation-duration'> || <easing-function> || <'animation-delay'> || <single-animation-iteration-count> || <single-animation-direction> || <single-animation-fill-mode> || <single-animation-play-state> || [ none | <keyframes-name> ] || <single-animation-timeline>"
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
		syntax: "infinite | <number>"
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
	size: {
		syntax: "closest-side | farthest-side | closest-corner | farthest-corner | <length> | <length-percentage>{2}"
	},
	"size-feature": {
		syntax: "<mf-plain> | <mf-boolean> | <mf-range>"
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
	"sqrt()": {
		syntax: "sqrt( <calc-sum> )"
	},
	"step-position": {
		syntax: "jump-start | jump-end | jump-none | jump-both | start | end"
	},
	"step-easing-function": {
		syntax: "step-start | step-end | <steps()>"
	},
	"steps()": {
		syntax: "steps( <integer>, <step-position>? )"
	},
	"style-feature": {
		syntax: "<declaration>"
	},
	"style-in-parens": {
		syntax: "( <style-condition> ) | ( <style-feature> ) | <general-enclosed>"
	},
	"style-query": {
		syntax: "<style-condition> | <style-feature>"
	},
	"subclass-selector": {
		syntax: "<id-selector> | <class-selector> | <attribute-selector> | <pseudo-class-selector>"
	},
	"supports-condition": {
		syntax: "not <supports-in-parens> | <supports-in-parens> [ and <supports-in-parens> ]* | <supports-in-parens> [ or <supports-in-parens> ]*"
	},
	"supports-decl": {
		syntax: "( <declaration> )"
	},
	"supports-feature": {
		syntax: "<supports-decl> | <supports-selector-fn>"
	},
	"supports-in-parens": {
		syntax: "( <supports-condition> ) | <supports-feature> | <general-enclosed>"
	},
	"supports-selector-fn": {
		syntax: "selector( <complex-selector> )"
	},
	symbol: {
		syntax: "<string> | <image> | <custom-ident>"
	},
	"symbols()": {
		syntax: "symbols( <symbols-type>? [ <string> | <image> ]+ )"
	},
	"symbols-type": {
		syntax: "cyclic | numeric | alphabetic | symbolic | fixed"
	},
	"system-color": {
		syntax: "AccentColor | AccentColorText | ActiveText | ButtonBorder | ButtonFace | ButtonText | Canvas | CanvasText | Field | FieldText | GrayText | Highlight | HighlightText | LinkText | Mark | MarkText | SelectedItem | SelectedItemText | VisitedText"
	},
	"system-family-name": {
		syntax: "caption | icon | menu | message-box | small-caption | status-bar"
	},
	"tan()": {
		syntax: "tan( <calc-sum> )"
	},
	target: {
		syntax: "<target-counter()> | <target-counters()> | <target-text()>"
	},
	"target-counter()": {
		syntax: "target-counter( [ <string> | <url> ] , <custom-ident> , <counter-style>? )"
	},
	"target-counters()": {
		syntax: "target-counters( [ <string> | <url> ] , <custom-ident> , <string> , <counter-style>? )"
	},
	"target-text()": {
		syntax: "target-text( [ <string> | <url> ] , [ content | before | after | first-letter ]? )"
	},
	"text-edge": {
		syntax: "[ text | cap | ex | ideographic | ideographic-ink ] [ text | alphabetic | ideographic | ideographic-ink ]?"
	},
	"time-percentage": {
		syntax: "<time> | <percentage>"
	},
	"timeline-range-name": {
		syntax: "cover | contain | entry | exit | entry-crossing | exit-crossing"
	},
	"track-breadth": {
		syntax: "<length-percentage> | <flex> | min-content | max-content | auto"
	},
	"track-list": {
		syntax: "[ <line-names>? [ <track-size> | <track-repeat> ] ]+ <line-names>?"
	},
	"track-repeat": {
		syntax: "repeat( [ <integer [1,∞]> ] , [ <line-names>? <track-size> ]+ <line-names>? )"
	},
	"track-size": {
		syntax: "<track-breadth> | minmax( <inflexible-breadth> , <track-breadth> ) | fit-content( <length-percentage> )"
	},
	"transform-function": {
		syntax: "<matrix()> | <translate()> | <translateX()> | <translateY()> | <scale()> | <scaleX()> | <scaleY()> | <rotate()> | <skew()> | <skewX()> | <skewY()> | <matrix3d()> | <translate3d()> | <translateZ()> | <scale3d()> | <scaleZ()> | <rotate3d()> | <rotateX()> | <rotateY()> | <rotateZ()> | <perspective()>"
	},
	"transform-list": {
		syntax: "<transform-function>+"
	},
	"transition-behavior-value": {
		syntax: "normal | allow-discrete"
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
	"try-size": {
		syntax: "most-width | most-height | most-block-size | most-inline-size"
	},
	"try-tactic": {
		syntax: "flip-block || flip-inline || flip-start"
	},
	"type-or-unit": {
		syntax: "string | color | url | integer | number | length | angle | time | frequency | cap | ch | em | ex | ic | lh | rlh | rem | vb | vi | vw | vh | vmin | vmax | mm | Q | cm | in | pt | pc | px | deg | grad | rad | turn | ms | s | Hz | kHz | %"
	},
	"type-selector": {
		syntax: "<wq-name> | <ns-prefix>? '*'"
	},
	"var()": {
		syntax: "var( <custom-property-name> , <declaration-value>? )"
	},
	"view()": {
		syntax: "view([<axis> || <'view-timeline-inset'>]?)"
	},
	"viewport-length": {
		syntax: "auto | <length-percentage>"
	},
	"visual-box": {
		syntax: "content-box | padding-box | border-box"
	},
	"wq-name": {
		syntax: "<ns-prefix>? <ident-token>"
	},
	"xywh()": {
		syntax: "xywh( <length-percentage>{2} <length-percentage [0,∞]>{2} [ round <'border-radius'> ]? )"
	},
	xyz: {
		syntax: "xyz | xyz-d50 | xyz-d65"
	},
	"xyz-params": {
		syntax: "<xyz-space> [ <number> | <percentage> | none ]{3}"
	},
	"-legacy-gradient": {
		syntax: "<-webkit-gradient()> | <-legacy-linear-gradient> | <-legacy-repeating-linear-gradient> | <-legacy-radial-gradient> | <-legacy-repeating-radial-gradient>"
	},
	"-legacy-linear-gradient": {
		syntax: "-moz-linear-gradient( <-legacy-linear-gradient-arguments> ) | -webkit-linear-gradient( <-legacy-linear-gradient-arguments> ) | -o-linear-gradient( <-legacy-linear-gradient-arguments> )"
	},
	"-legacy-repeating-linear-gradient": {
		syntax: "-moz-repeating-linear-gradient( <-legacy-linear-gradient-arguments> ) | -webkit-repeating-linear-gradient( <-legacy-linear-gradient-arguments> ) | -o-repeating-linear-gradient( <-legacy-linear-gradient-arguments> )"
	},
	"-legacy-linear-gradient-arguments": {
		syntax: "[ <angle> | <side-or-corner> ]? , <color-stop-list>"
	},
	"-legacy-radial-gradient": {
		syntax: "-moz-radial-gradient( <-legacy-radial-gradient-arguments> ) | -webkit-radial-gradient( <-legacy-radial-gradient-arguments> ) | -o-radial-gradient( <-legacy-radial-gradient-arguments> )"
	},
	"-legacy-repeating-radial-gradient": {
		syntax: "-moz-repeating-radial-gradient( <-legacy-radial-gradient-arguments> ) | -webkit-repeating-radial-gradient( <-legacy-radial-gradient-arguments> ) | -o-repeating-radial-gradient( <-legacy-radial-gradient-arguments> )"
	},
	"-legacy-radial-gradient-arguments": {
		syntax: "[ <position> , ]? [ [ [ <-legacy-radial-gradient-shape> || <-legacy-radial-gradient-size> ] | [ <length> | <percentage> ]{2} ] , ]? <color-stop-list>"
	},
	"-legacy-radial-gradient-size": {
		syntax: "closest-side | closest-corner | farthest-side | farthest-corner | contain | cover"
	},
	"-legacy-radial-gradient-shape": {
		syntax: "circle | ellipse"
	},
	"-non-standard-font": {
		syntax: "-apple-system-body | -apple-system-headline | -apple-system-subheadline | -apple-system-caption1 | -apple-system-caption2 | -apple-system-footnote | -apple-system-short-body | -apple-system-short-headline | -apple-system-short-subheadline | -apple-system-short-caption1 | -apple-system-short-footnote | -apple-system-tall-body"
	},
	"-non-standard-color": {
		syntax: "-moz-ButtonDefault | -moz-ButtonHoverFace | -moz-ButtonHoverText | -moz-CellHighlight | -moz-CellHighlightText | -moz-Combobox | -moz-ComboboxText | -moz-Dialog | -moz-DialogText | -moz-dragtargetzone | -moz-EvenTreeRow | -moz-Field | -moz-FieldText | -moz-html-CellHighlight | -moz-html-CellHighlightText | -moz-mac-accentdarkestshadow | -moz-mac-accentdarkshadow | -moz-mac-accentface | -moz-mac-accentlightesthighlight | -moz-mac-accentlightshadow | -moz-mac-accentregularhighlight | -moz-mac-accentregularshadow | -moz-mac-chrome-active | -moz-mac-chrome-inactive | -moz-mac-focusring | -moz-mac-menuselect | -moz-mac-menushadow | -moz-mac-menutextselect | -moz-MenuHover | -moz-MenuHoverText | -moz-MenuBarText | -moz-MenuBarHoverText | -moz-nativehyperlinktext | -moz-OddTreeRow | -moz-win-communicationstext | -moz-win-mediatext | -moz-activehyperlinktext | -moz-default-background-color | -moz-default-color | -moz-hyperlinktext | -moz-visitedhyperlinktext | -webkit-activelink | -webkit-focus-ring-color | -webkit-link | -webkit-text"
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
	"-webkit-gradient()": {
		syntax: "-webkit-gradient( <-webkit-gradient-type>, <-webkit-gradient-point> [, <-webkit-gradient-point> | , <-webkit-gradient-radius>, <-webkit-gradient-point> ] [, <-webkit-gradient-radius>]? [, <-webkit-gradient-color-stop>]* )"
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
	"-webkit-mask-box-repeat": {
		syntax: "repeat | stretch | round"
	},
	"-ms-filter-function-list": {
		syntax: "<-ms-filter-function>+"
	},
	"-ms-filter-function": {
		syntax: "<-ms-filter-function-progid> | <-ms-filter-function-legacy>"
	},
	"-ms-filter-function-progid": {
		syntax: "'progid:' [ <ident-token> '.' ]* [ <ident-token> | <function-token> <any-value>? ) ]"
	},
	"-ms-filter-function-legacy": {
		syntax: "<ident-token> | <function-token> <any-value>? )"
	},
	age: {
		syntax: "child | young | old"
	},
	"attr-name": {
		syntax: "<wq-name>"
	},
	"attr-fallback": {
		syntax: "<any-value>"
	},
	bottom: {
		syntax: "<length> | auto"
	},
	"generic-voice": {
		syntax: "[ <age>? <gender> <integer>? ]"
	},
	gender: {
		syntax: "male | female | neutral"
	},
	"generic-script-specific": {
		syntax: "generic(kai) | generic(fangsong) | generic(nastaliq)"
	},
	"-non-standard-generic-family": {
		syntax: "-apple-system | BlinkMacSystemFont"
	},
	"intrinsic-size-keyword": {
		syntax: "min-content | max-content | fit-content"
	},
	left: {
		syntax: "<length> | auto"
	},
	"device-cmyk()": {
		syntax: "<legacy-device-cmyk-syntax> | <modern-device-cmyk-syntax>"
	},
	"legacy-device-cmyk-syntax": {
		syntax: "device-cmyk( <number>#{4} )"
	},
	"modern-device-cmyk-syntax": {
		syntax: "device-cmyk( <cmyk-component>{4} [ / [ <alpha-value> | none ] ]? )"
	},
	"cmyk-component": {
		syntax: "<number> | <percentage> | none"
	},
	"color-space": {
		syntax: "<rectangular-color-space> | <polar-color-space> | <custom-color-space>"
	},
	right: {
		syntax: "<length> | auto"
	},
	"forgiving-selector-list": {
		syntax: "<complex-real-selector-list>"
	},
	"forgiving-relative-selector-list": {
		syntax: "<relative-real-selector-list>"
	},
	"complex-real-selector-list": {
		syntax: "<complex-real-selector>#"
	},
	"simple-selector-list": {
		syntax: "<simple-selector>#"
	},
	"relative-real-selector-list": {
		syntax: "<relative-real-selector>#"
	},
	"complex-selector-unit": {
		syntax: "[ <compound-selector>? <pseudo-compound-selector>* ]!"
	},
	"complex-real-selector": {
		syntax: "<compound-selector> [ <combinator>? <compound-selector> ]*"
	},
	"relative-real-selector": {
		syntax: "<combinator>? <complex-real-selector>"
	},
	"pseudo-compound-selector": {
		syntax: " <pseudo-element-selector> <pseudo-class-selector>*"
	},
	"simple-selector": {
		syntax: "<type-selector> | <subclass-selector>"
	},
	"legacy-pseudo-element-selector": {
		syntax: " ':' [before | after | first-line | first-letter]"
	},
	"svg-length": {
		syntax: "<percentage> | <length> | <number>"
	},
	"svg-writing-mode": {
		syntax: "lr-tb | rl-tb | tb-rl | lr | rl | tb"
	},
	top: {
		syntax: "<length> | auto"
	},
	x: {
		syntax: "<number>"
	},
	y: {
		syntax: "<number>"
	},
	declaration: {
		syntax: "<ident-token> : <declaration-value>? [ '!' important ]?"
	},
	"declaration-list": {
		syntax: "[ <declaration>? ';' ]* <declaration>?"
	},
	url: {
		syntax: "url( <string> <url-modifier>* ) | <url-token>"
	},
	"url-modifier": {
		syntax: "<ident> | <function-token> <any-value> )"
	},
	"number-zero-one": {
		syntax: "<number [0,1]>"
	},
	"number-one-or-greater": {
		syntax: "<number [1,∞]>"
	},
	"xyz-space": {
		syntax: "xyz | xyz-d50 | xyz-d65"
	},
	"style-condition": {
		syntax: "not <style-in-parens> | <style-in-parens> [ [ and <style-in-parens> ]* | [ or <style-in-parens> ]* ]"
	},
	"-non-standard-display": {
		syntax: "-ms-inline-flexbox | -ms-grid | -ms-inline-grid | -webkit-flex | -webkit-inline-flex | -webkit-box | -webkit-inline-box | -moz-inline-stack | -moz-box | -moz-inline-box | -ms-flexbox"
	},
	"inset-area": {
		syntax: "[ [ left | center | right | span-left | span-right | x-start | x-end | span-x-start | span-x-end | x-self-start | x-self-end | span-x-self-start | span-x-self-end | span-all ] || [ top | center | bottom | span-top | span-bottom | y-start | y-end | span-y-start | span-y-end | y-self-start | y-self-end | span-y-self-start | span-y-self-end | span-all ] | [ block-start | center | block-end | span-block-start | span-block-end | span-all ] || [ inline-start | center | inline-end | span-inline-start | span-inline-end | span-all ] | [ self-block-start | self-block-end | span-self-block-start | span-self-block-end | span-all ] || [ self-inline-start | self-inline-end | span-self-inline-start | span-self-inline-end | span-all ] | [ start | center | end | span-start | span-end | span-all ]{1,2} | [ self-start | center | self-end | span-self-start | span-self-end | span-all ]{1,2} ]"
	},
	"-non-standard-text-align": {
		syntax: "| -moz-center | -webkit-center | -webkit-match-parent"
	}
};
var selectors = {
	":active": {
		syntax: ":active"
	},
	":active-view-transition": {
		syntax: ":active-view-transition"
	},
	":active-view-transition-type()": {
		syntax: ":active-view-transition-type( <custom-ident># )"
	},
	":any-link": {
		syntax: ":any-link"
	},
	":autofill": {
		syntax: ":autofill"
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
	":has()": {
		syntax: ":has( <forgiving-relative-selector-list> )"
	},
	":has-slotted": {
		syntax: ":has-slotted"
	},
	":host": {
		syntax: ":host"
	},
	":host()": {
		syntax: ":host( <compound-selector> )"
	},
	":host-context()": {
		syntax: ":host-context( <compound-selector> )"
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
	":last-of-type": {
		syntax: ":last-of-type"
	},
	":left": {
		syntax: ":left"
	},
	":link": {
		syntax: ":link"
	},
	":local-link": {
		syntax: ":local-link"
	},
	":modal": {
		syntax: ":modal"
	},
	":muted": {
		syntax: ":muted"
	},
	":not()": {
		syntax: ":not( <complex-selector-list> )"
	},
	":nth-child()": {
		syntax: ":nth-child( <an+b> [ of <complex-selector-list> ]? )"
	},
	":nth-last-child()": {
		syntax: ":nth-last-child( <an+b> [ of <complex-selector-list> ]? )"
	},
	":nth-last-of-type()": {
		syntax: ":nth-last-of-type( <an+b> )"
	},
	":nth-of-type()": {
		syntax: ":nth-of-type( <an+b> )"
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
	":stalled": {
		syntax: ":stalled"
	},
	":state()": {
		syntax: ":state( <custom-ident> )"
	},
	":target": {
		syntax: ":target"
	},
	":target-current": {
		syntax: ":target-current"
	},
	":target-within": {
		syntax: ":target-within"
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
	"::cue": {
		syntax: "::cue"
	},
	"::cue()": {
		syntax: "::cue( <selector> )"
	},
	"::cue-region": {
		syntax: "::cue-region"
	},
	"::cue-region()": {
		syntax: "::cue-region( <selector> )"
	},
	"::details-content": {
		syntax: "::details-content"
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
		syntax: "::highlight( <custom-ident> )"
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
	"::scroll-marker": {
		syntax: "::scroll-marker"
	},
	"::scroll-marker-group": {
		syntax: "::scroll-marker-group"
	},
	"::selection": {
		syntax: "::selection"
	},
	"::slotted()": {
		syntax: "::slotted( <compound-selector> )"
	},
	"::spelling-error": {
		syntax: "::spelling-error"
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
	":-webkit-any()": {
		syntax: ":-webkit-any( <forgiving-selector-list> )"
	},
	":-webkit-any-link": {
		syntax: ":-webkit-any-link"
	}
};
var atRules = {
	"@charset": {
		syntax: "@charset \"<charset>\";"
	},
	"@counter-style": {
		syntax: "@counter-style <counter-style-name> {\n  [ system: <counter-system>; ] ||\n  [ symbols: <counter-symbols>; ] ||\n  [ additive-symbols: <additive-symbols>; ] ||\n  [ negative: <negative-symbol>; ] ||\n  [ prefix: <prefix>; ] ||\n  [ suffix: <suffix>; ] ||\n  [ range: <range>; ] ||\n  [ pad: <padding>; ] ||\n  [ speak-as: <speak-as>; ] ||\n  [ fallback: <counter-style-name>; ]\n}",
		descriptors: {
			"additive-symbols": {
				syntax: "[ <integer [0,∞]> && <symbol> ]#"
			},
			fallback: {
				syntax: "<counter-style-name>"
			},
			negative: {
				syntax: "<symbol> <symbol>?"
			},
			pad: {
				syntax: "<integer [0,∞]> && <symbol>"
			},
			prefix: {
				syntax: "<symbol>"
			},
			range: {
				syntax: "[ [ <integer> | infinite ]{2} ]# | auto"
			},
			"speak-as": {
				syntax: "auto | bullets | numbers | words | spell-out | <counter-style-name>"
			},
			suffix: {
				syntax: "<symbol>"
			},
			symbols: {
				syntax: "<symbol>+"
			},
			system: {
				syntax: "cyclic | numeric | alphabetic | symbolic | additive | [ fixed <integer>? ] | [ extends <counter-style-name> ]"
			}
		}
	},
	"@container": {
		syntax: "@container <container-condition># {\n  <block-contents>\n}"
	},
	"@document": {
		syntax: "@document [ <url> | url-prefix(<string>) | domain(<string>) | media-document(<string>) | regexp(<string>) ]# {\n  <group-rule-body>\n}"
	},
	"@font-face": {
		syntax: "@font-face {\n  [ font-family: <family-name>; ] ||\n  [ src: <src>; ] ||\n  [ unicode-range: <unicode-range>; ] ||\n  [ font-variant: <font-variant>; ] ||\n  [ font-feature-settings: <font-feature-settings>; ] ||\n  [ font-variation-settings: <font-variation-settings>; ] ||\n  [ font-stretch: <font-stretch>; ] ||\n  [ font-weight: <font-weight>; ] ||\n  [ font-style: <font-style>; ] ||\n  [ size-adjust: <size-adjust>; ] ||\n  [ ascent-override: <ascent-override>; ] ||\n  [ descent-override: <descent-override>; ] ||\n  [ line-gap-override: <line-gap-override>; ]\n}",
		descriptors: {
			"ascent-override": {
				syntax: "normal | <percentage>"
			},
			"descent-override": {
				syntax: "normal | <percentage>"
			},
			"font-display": {
				syntax: "auto | block | swap | fallback | optional"
			},
			"font-family": {
				syntax: "<family-name>"
			},
			"font-feature-settings": {
				syntax: "normal | <feature-tag-value>#"
			},
			"font-stretch": {
				syntax: "<font-stretch-absolute>{1,2}"
			},
			"font-style": {
				syntax: "normal | italic | oblique <angle>{0,2}"
			},
			"font-variation-settings": {
				syntax: "normal | [ <string> <number> ]#"
			},
			"font-weight": {
				syntax: "<font-weight-absolute>{1,2}"
			},
			"line-gap-override": {
				syntax: "normal | <percentage>"
			},
			"size-adjust": {
				syntax: "<percentage>"
			},
			src: {
				syntax: "[ <url> [ format( <string># ) ]? | local( <family-name> ) ]#"
			},
			"unicode-range": {
				syntax: "<unicode-range-token>#"
			}
		}
	},
	"@font-feature-values": {
		syntax: "@font-feature-values <family-name># {\n  <feature-value-block-list>\n}"
	},
	"@font-palette-values": {
		syntax: "@font-palette-values <dashed-ident> {\n  <declaration-list>\n}",
		descriptors: {
			"base-palette": {
				syntax: "light | dark | <integer [0,∞]>"
			},
			"font-family": {
				syntax: "<family-name>#"
			},
			"override-colors": {
				syntax: "[ <integer [0,∞]> <color> ]#"
			}
		}
	},
	"@import": {
		syntax: "@import [ <string> | <url> ]\n        [ layer | layer(<layer-name>) ]?\n        [ supports( [ <supports-condition> | <declaration> ] ) ]?\n        <media-query-list>? ;"
	},
	"@keyframes": {
		syntax: "@keyframes <keyframes-name> {\n  <qualified-rule-list>\n}"
	},
	"@layer": {
		syntax: "@layer [ <layer-name># | <layer-name>?  {\n  <stylesheet>\n} ]"
	},
	"@media": {
		syntax: "@media <media-query-list> {\n  <group-rule-body>\n}"
	},
	"@namespace": {
		syntax: "@namespace <namespace-prefix>? [ <string> | <url> ];"
	},
	"@page": {
		syntax: "@page <page-selector-list> {\n  <page-body>\n}",
		descriptors: {
			bleed: {
				syntax: "auto | <length>"
			},
			marks: {
				syntax: "none | [ crop || cross ]"
			},
			"page-orientation": {
				syntax: "upright | rotate-left | rotate-right "
			},
			size: {
				syntax: "<length [0,∞]>{1,2} | auto | [ <page-size> || [ portrait | landscape ] ]"
			}
		}
	},
	"@position-try": {
		syntax: "@position-try <dashed-ident> {\n  <declaration-list>\n}"
	},
	"@property": {
		syntax: "@property <custom-property-name> {\n  <declaration-list>\n}",
		descriptors: {
			inherits: {
				syntax: "true | false"
			},
			"initial-value": {
				syntax: "<declaration-value>?"
			},
			syntax: {
				syntax: "<string>"
			}
		}
	},
	"@scope": {
		syntax: "@scope [(<scope-start>)]? [to (<scope-end>)]? {\n  <rule-list>\n}"
	},
	"@starting-style": {
		syntax: "@starting-style {\n  <declaration-list> | <group-rule-body>\n}"
	},
	"@supports": {
		syntax: "@supports <supports-condition> {\n  <group-rule-body>\n}"
	},
	"@view-transition": {
		syntax: "@view-transition {\n  <declaration-list>\n}",
		descriptors: {
			navigation: {
				syntax: "auto | none"
			},
			types: {
				syntax: "none | <custom-ident>+"
			}
		}
	},
	charset: {
		syntax: "<string>"
	},
	container: {
		syntax: "[ <container-name> ]? <container-condition>"
	},
	nest: {
		syntax: "<complex-selector-list>"
	},
	scope: {
		syntax: "[ ( <scope-start> ) ]? [ to ( <scope-end> ) ]?"
	},
	"position-try": {
	}
};
var config = {
	declarations: declarations,
	functions: functions,
	syntaxes: syntaxes,
	selectors: selectors,
	atRules: atRules
};

export { atRules, declarations, config as default, functions, selectors, syntaxes };
