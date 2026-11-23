/* 
	CSS parser, minifier and validator for node, deno, bun and the browser

	Author(s): Thierry Bela
	Version: 2.2.1
	License: MIT
 */
/**
 * feature walk mode
 *
 * @private
 */
var FeatureWalkMode;
(function (FeatureWalkMode) {
    /**
     * pre process
     */
    FeatureWalkMode[FeatureWalkMode["Pre"] = 1] = "Pre";
    /**
     * post process
     */
    FeatureWalkMode[FeatureWalkMode["Post"] = 2] = "Post";
})(FeatureWalkMode || (FeatureWalkMode = {}));

export { FeatureWalkMode };
