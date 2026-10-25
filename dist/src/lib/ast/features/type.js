/* 
	CSS parser, minifier and validator for node and the browser

	Author(s): Thierry Bela
	Version: 1.7.0
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
