/* 
	CSS parser, minifier and validator for node and the browser

	Author(s): Thierry Bela
<<<<<<< HEAD
	Version: 2.0.0-alpha.1
=======
	Version: 1.6.8
>>>>>>> v.next
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
