
// generated from config.json at https://app.quicktype.io/?l=ts

/**
 * @private
 */
export declare interface PropertiesConfig {
    properties: PropertiesConfigProperties;
    map:        Map;
}

/**
 * @private
 */
export interface Map {
    border:                  Border;
    "border-color":          BackgroundPositionClass;
    "border-style":          BackgroundPositionClass;
    "border-width":          BackgroundPositionClass;
    outline:                 Outline;
    "outline-color":         BackgroundPositionClass;
    "outline-style":         BackgroundPositionClass;
    "outline-width":         BackgroundPositionClass;
    font:                    Font;
    "font-weight":           BackgroundPositionClass;
    "font-style":            BackgroundPositionClass;
    "font-size":             BackgroundPositionClass;
    "line-height":           BackgroundPositionClass;
    "font-stretch":          BackgroundPositionClass;
    "font-variant":          BackgroundPositionClass;
    "font-family":           BackgroundPositionClass;
    background:              Background;
    "background-repeat":     BackgroundPositionClass;
    "background-color":      BackgroundPositionClass;
    "background-image":      BackgroundPositionClass;
    "background-attachment": BackgroundPositionClass;
    "background-clip":       BackgroundPositionClass;
    "background-origin":     BackgroundPositionClass;
    "background-position":   BackgroundPositionClass;
    "background-size":       BackgroundPositionClass;
}

/**
 * @private
 */
export interface Background {
    shorthand:  string;
    pattern:    string;
    keywords:   string[];
    default:    any[];
    multiple:   boolean;
    separator:  Separator;
    properties: BackgroundProperties;
}

/**
 * @private
 */
export interface BackgroundProperties {
    "background-repeat":     BackgroundRepeat;
    "background-color":      PurpleBackgroundAttachment;
    "background-image":      PurpleBackgroundAttachment;
    "background-attachment": PurpleBackgroundAttachment;
    "background-clip":       PurpleBackgroundAttachment;
    "background-origin":     PurpleBackgroundAttachment;
    "background-position":   BackgroundPosition;
    "background-size":       BackgroundSize;
}

/**
 * @private
 */
export interface PurpleBackgroundAttachment {
    types:     string[];
    default:   string[];
    keywords:  string[];
    required?: boolean;
    mapping?:  BackgroundAttachmentMapping;
}

/**
 * @private
 */
export interface BackgroundAttachmentMapping {
    "ultra-condensed": string;
    "extra-condensed": string;
    condensed:         string;
    "semi-condensed":  string;
    normal:            string;
    "semi-expanded":   string;
    expanded:          string;
    "extra-expanded":  string;
    "ultra-expanded":  string;
}

/**
 * @private
 */
export interface BackgroundPosition {
    multiple:    boolean;
    types:       string[];
    default:     string[];
    keywords:    string[];
    mapping:     BackgroundPositionMapping;
    constraints: BackgroundPositionConstraints;
}

/**
 * @private
 */
export interface BackgroundPositionConstraints {
    mapping: ConstraintsMapping;
}

/**
 * @private
 */
export interface ConstraintsMapping {
    max: number;
}

/**
 * @private
 */
export interface BackgroundPositionMapping {
    left:   string;
    top:    string;
    center: string;
    bottom: string;
    right:  string;
}

/**
 * @private
 */
export interface BackgroundRepeat {
    types:    any[];
    default:  string[];
    multiple: boolean;
    keywords: string[];
    mapping:  BackgroundRepeatMapping;
}

/**
 * @private
 */
export interface BackgroundRepeatMapping {
    "repeat no-repeat":    string;
    "no-repeat repeat":    string;
    "repeat repeat":       string;
    "space space":         string;
    "round round":         string;
    "no-repeat no-repeat": string;
}

/**
 * @private
 */
export interface BackgroundSize {
    multiple: boolean;
    previous: string;
    prefix:   Prefix;
    types:    string[];
    default:  string[];
    keywords: string[];
    mapping:  BackgroundSizeMapping;
}

/**
 * @private
 */
export interface BackgroundSizeMapping {
    "auto auto": string;
}

/**
 * @private
 */
export interface Prefix {
    typ: string;
    val: string;
}

/**
 * @private
 */
export interface Separator {
    typ: string;
}

/**
 * @private
 */
export interface BackgroundPositionClass {
    shorthand: string;
}

/**
 * @private
 */
export interface Border {
    shorthand:  string;
    pattern:    string;
    keywords:   string[];
    default:    string[];
    properties: BorderProperties;
}

/**
 * @private
 */
export interface BorderProperties {
    "border-color": BorderColorClass;
    "border-style": BorderColorClass;
    "border-width": BorderColorClass;
}

/**
 * @private
 */
export interface BorderColorClass {
}

/**
 * @private
 */
export interface Font {
    shorthand:  string;
    pattern:    string;
    keywords:   string[];
    default:    any[];
    properties: FontProperties;
}

/**
 * @private
 */
export interface FontProperties {
    "font-weight":  FontWeight;
    "font-style":   PurpleBackgroundAttachment;
    "font-size":    PurpleBackgroundAttachment;
    "line-height":  LineHeight;
    "font-stretch": PurpleBackgroundAttachment;
    "font-variant": PurpleBackgroundAttachment;
    "font-family":  FontFamily;
}

/**
 * @private
 */
export interface FontFamily {
    types:     string[];
    default:   any[];
    keywords:  string[];
    required:  boolean;
    multiple:  boolean;
    separator: Separator;
}

/**
 * @private
 */
export interface FontWeight {
    types:       string[];
    default:     string[];
    keywords:    string[];
    constraints: FontWeightConstraints;
    mapping:     FontWeightMapping;
}

/**
 * @private
 */
export interface FontWeightConstraints {
    value: Value;
}

/**
 * @private
 */
export interface Value {
    min: string;
    max: string;
}

/**
 * @private
 */
export interface FontWeightMapping {
    thin:          string;
    hairline:      string;
    "extra light": string;
    "ultra light": string;
    light:         string;
    normal:        string;
    regular:       string;
    medium:        string;
    "semi bold":   string;
    "demi bold":   string;
    bold:          string;
    "extra bold":  string;
    "ultra bold":  string;
    black:         string;
    heavy:         string;
    "extra black": string;
    "ultra black": string;
}

/**
 * @private
 */
export interface LineHeight {
    types:    string[];
    default:  string[];
    keywords: string[];
    previous: string;
    prefix:   Prefix;
}

/**
 * @private
 */
export interface Outline {
    shorthand:  string;
    pattern:    string;
    keywords:   string[];
    default:    string[];
    properties: OutlineProperties;
}

/**
 * @private
 */
export interface OutlineProperties {
    "outline-color": PurpleBackgroundAttachment;
    "outline-style": PurpleBackgroundAttachment;
    "outline-width": PurpleBackgroundAttachment;
}

/**
 * @private
 */
export interface PropertiesConfigProperties {
    inset:                        BorderRadius;
    top:                          BackgroundPositionClass;
    right:                        BackgroundPositionClass;
    bottom:                       BackgroundPositionClass;
    left:                         BackgroundPositionClass;
    margin:                       BorderRadius;
    "margin-top":                 BackgroundPositionClass;
    "margin-right":               BackgroundPositionClass;
    "margin-bottom":              BackgroundPositionClass;
    "margin-left":                BackgroundPositionClass;
    padding:                      BorderColor;
    "padding-top":                BackgroundPositionClass;
    "padding-right":              BackgroundPositionClass;
    "padding-bottom":             BackgroundPositionClass;
    "padding-left":               BackgroundPositionClass;
    "border-radius":              BorderRadius;
    "border-top-left-radius":     BackgroundPositionClass;
    "border-top-right-radius":    BackgroundPositionClass;
    "border-bottom-right-radius": BackgroundPositionClass;
    "border-bottom-left-radius":  BackgroundPositionClass;
    "border-width":               BorderColor;
    "border-top-width":           BackgroundPositionClass;
    "border-right-width":         BackgroundPositionClass;
    "border-bottom-width":        BackgroundPositionClass;
    "border-left-width":          BackgroundPositionClass;
    "border-style":               BorderColor;
    "border-top-style":           BackgroundPositionClass;
    "border-right-style":         BackgroundPositionClass;
    "border-bottom-style":        BackgroundPositionClass;
    "border-left-style":          BackgroundPositionClass;
    "border-color":               BorderColor;
    "border-top-color":           BackgroundPositionClass;
    "border-right-color":         BackgroundPositionClass;
    "border-bottom-color":        BackgroundPositionClass;
    "border-left-color":          BackgroundPositionClass;
}

/**
 * @private
 */
export interface BorderColor {
    shorthand:  string;
    map?:       string;
    properties: string[];
    types:      string[];
    keywords:   string[];
}

/**
 * @private
 */
export interface BorderRadius {
    shorthand:  string;
    properties: string[];
    types:      string[];
    multiple:   boolean;
    separator:  null | string;
    keywords:   string[];
}
