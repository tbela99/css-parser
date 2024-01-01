
// generated from config.json at https://app.quicktype.io/?l=ts

export declare interface PropertiesConfig {
    properties: PropertiesConfigProperties;
    map:        Map;
}

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

export interface Background {
    shorthand:  string;
    pattern:    string;
    keywords:   string[];
    default:    any[];
    multiple:   boolean;
    separator:  Separator;
    properties: BackgroundProperties;
}

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

export interface PurpleBackgroundAttachment {
    types:     string[];
    default:   string[];
    keywords:  string[];
    required?: boolean;
    mapping?:  BackgroundAttachmentMapping;
}

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

export interface BackgroundPosition {
    multiple:    boolean;
    types:       string[];
    default:     string[];
    keywords:    string[];
    mapping:     BackgroundPositionMapping;
    constraints: BackgroundPositionConstraints;
}

export interface BackgroundPositionConstraints {
    mapping: ConstraintsMapping;
}

export interface ConstraintsMapping {
    max: number;
}

export interface BackgroundPositionMapping {
    left:   string;
    top:    string;
    center: string;
    bottom: string;
    right:  string;
}

export interface BackgroundRepeat {
    types:    any[];
    default:  string[];
    multiple: boolean;
    keywords: string[];
    mapping:  BackgroundRepeatMapping;
}

export interface BackgroundRepeatMapping {
    "repeat no-repeat":    string;
    "no-repeat repeat":    string;
    "repeat repeat":       string;
    "space space":         string;
    "round round":         string;
    "no-repeat no-repeat": string;
}

export interface BackgroundSize {
    multiple: boolean;
    previous: string;
    prefix:   Prefix;
    types:    string[];
    default:  string[];
    keywords: string[];
    mapping:  BackgroundSizeMapping;
}

export interface BackgroundSizeMapping {
    "auto auto": string;
}

export interface Prefix {
    typ: string;
    val: string;
}

export interface Separator {
    typ: string;
}

export interface BackgroundPositionClass {
    shorthand: string;
}

export interface Border {
    shorthand:  string;
    pattern:    string;
    keywords:   string[];
    default:    string[];
    properties: BorderProperties;
}

export interface BorderProperties {
    "border-color": BorderColorClass;
    "border-style": BorderColorClass;
    "border-width": BorderColorClass;
}

export interface BorderColorClass {
}

export interface Font {
    shorthand:  string;
    pattern:    string;
    keywords:   string[];
    default:    any[];
    properties: FontProperties;
}

export interface FontProperties {
    "font-weight":  FontWeight;
    "font-style":   PurpleBackgroundAttachment;
    "font-size":    PurpleBackgroundAttachment;
    "line-height":  LineHeight;
    "font-stretch": PurpleBackgroundAttachment;
    "font-variant": PurpleBackgroundAttachment;
    "font-family":  FontFamily;
}

export interface FontFamily {
    types:     string[];
    default:   any[];
    keywords:  string[];
    required:  boolean;
    multiple:  boolean;
    separator: Separator;
}

export interface FontWeight {
    types:       string[];
    default:     string[];
    keywords:    string[];
    constraints: FontWeightConstraints;
    mapping:     FontWeightMapping;
}

export interface FontWeightConstraints {
    value: Value;
}

export interface Value {
    min: string;
    max: string;
}

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

export interface LineHeight {
    types:    string[];
    default:  string[];
    keywords: string[];
    previous: string;
    prefix:   Prefix;
}

export interface Outline {
    shorthand:  string;
    pattern:    string;
    keywords:   string[];
    default:    string[];
    properties: OutlineProperties;
}

export interface OutlineProperties {
    "outline-color": PurpleBackgroundAttachment;
    "outline-style": PurpleBackgroundAttachment;
    "outline-width": PurpleBackgroundAttachment;
}

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

export interface BorderColor {
    shorthand:  string;
    map?:       string;
    properties: string[];
    types:      string[];
    keywords:   string[];
}

export interface BorderRadius {
    shorthand:  string;
    properties: string[];
    types:      string[];
    multiple:   boolean;
    separator:  null | string;
    keywords:   string[];
}
