(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
/*
 * color-blind
 * https://github.com/skratchdot/color-blind
 *
 * This source was copied from http://mudcu.be/sphere/js/Color.Blind.js
 *
 * It contains modifications for use in node.js.
 *
 * The original copyright is included below.
 *
 * Here is a license note copied/edited from (http://colorlab.wickline.org/colorblind/colorlab/engine.js)
 *
 *  20221013 UPDATE
 *      HCIRN appears to no longer exist. This makes it impractical
 *      for users to obtain permission from HCIRN in order to use
 *      this file for commercial works. Instead:
 *
 *      This work is licensed under a
 *      Creative Commons Attribution-ShareAlike 4.0 International License.
 *      http://creativecommons.org/licenses/by-sa/4.0/
 */
/*

    The Color Blindness Simulation function is
    copyright (c) 2000-2001 by Matthew Wickline and the
    Human-Computer Interaction Resource Network ( http://hcirn.com/ ).
    
    It is used with the permission of Matthew Wickline and HCIRN,
    and is freely available for non-commercial use. For commercial use, please
    contact the Human-Computer Interaction Resource Network ( http://hcirn.com/ ).

	------------------------
	blind.protan =
		cpu = 0.735; // confusion point, u coord
		cpv = 0.265; // confusion point, v coord
		abu = 0.115807; // color axis begining point (473nm), u coord
		abv = 0.073581; // color axis begining point (473nm), v coord
		aeu = 0.471899; // color axis ending point (574nm), u coord
		aev = 0.527051; // color axis ending point (574nm), v coord
	blind.deutan =
		cpu =  1.14; // confusion point, u coord
		cpv = -0.14; // confusion point, v coord
		abu = 0.102776; // color axis begining point (477nm), u coord
		abv = 0.102864; // color axis begining point (477nm), v coord
		aeu = 0.505845; // color axis ending point (579nm), u coord
		aev = 0.493211; // color axis ending point (579nm), v coord
	blind.tritan =
		cpu =  0.171; // confusion point, u coord
		cpv = -0.003; // confusion point, v coord
		abu = 0.045391; // color axis begining point (490nm), u coord
		abv = 0.294976; // color axis begining point (490nm), v coord
		aeu = 0.665764; // color axis ending point (610nm), u coord
		aev = 0.334011; // color axis ending point (610nm), v coord
			
	m = (aev - abv) / (aeu - abu); // slope of color axis
	yi = blind[t].abv - blind[t].abu * blind[t].m; // "y-intercept" of axis (on the "v" axis at u=0)

*/
'use strict';

var colorProfile = 'sRGB';
var gammaCorrection = 2.2;
var matrixXyzRgb = [
	3.240712470389558, -0.969259258688888, 0.05563600315398933,
	-1.5372626602963142, 1.875996969313966, -0.2039948802843549,
	-0.49857440415943116, 0.041556132211625726, 1.0570636917433989
];
var matrixRgbXyz = [
	0.41242371206635076, 0.21265606784927693, 0.019331987577444885,
	0.3575793401363035, 0.715157818248362, 0.11919267420354762,
	0.1804662232369621, 0.0721864539171564, 0.9504491124870351
];
// xy: coordinates, m: slope, yi: y-intercept
var blinder = {
	protan: {
		x: 0.7465,
		y: 0.2535,
		m: 1.273463,
		yi: -0.073894
	},
	deutan: {
		x: 1.4,
		y: -0.4,
		m: 0.968437,
		yi: 0.003331
	},
	tritan: {
		x: 0.1748,
		y: 0,
		m: 0.062921,
		yi: 0.292119
	},
	custom: {
		x: 0.735,
		y: 0.265,
		m: -1.059259,
		yi: 1.026914
	}
};

var convertRgbToXyz = function (o) {
	var M = matrixRgbXyz;
	var z = {};
	var R = o.R / 255;
	var G = o.G / 255;
	var B = o.B / 255;
	if (colorProfile === 'sRGB') {
		R = (R > 0.04045) ? Math.pow(((R + 0.055) / 1.055), 2.4) : R / 12.92;
		G = (G > 0.04045) ? Math.pow(((G + 0.055) / 1.055), 2.4) : G / 12.92;
		B = (B > 0.04045) ? Math.pow(((B + 0.055) / 1.055), 2.4) : B / 12.92;
	} else {
		R = Math.pow(R, gammaCorrection);
		G = Math.pow(G, gammaCorrection);
		B = Math.pow(B, gammaCorrection);
	}
	z.X = R * M[0] + G * M[3] + B * M[6];
	z.Y = R * M[1] + G * M[4] + B * M[7];
	z.Z = R * M[2] + G * M[5] + B * M[8];
	return z;
};

var convertXyzToXyy = function (o) {
	var n = o.X + o.Y + o.Z;
	if (n === 0) {
		return {x: 0, y: 0, Y: o.Y};
	}
	return {x: o.X / n, y: o.Y / n, Y: o.Y};
};

exports.Blind = function (rgb, type, anomalize) {
	var z, v, n,
		line, c, slope,
		yi, dx, dy,
		dX, dY, dZ,
		dR, dG, dB,
		_r, _g, _b,
		ngx, ngz, M,
		adjust;
	if (type === "achroma") { // D65 in sRGB
		z = rgb.R * 0.212656 + rgb.G * 0.715158 + rgb.B * 0.072186;
		z = {R: z, G: z, B: z};
		if (anomalize) {
			v = 1.75;
			n = v + 1;
			z.R = (v * z.R + rgb.R) / n;
			z.G = (v * z.G + rgb.G) / n;
			z.B = (v * z.B + rgb.B) / n;
		}
		return z;
	}
	line = blinder[type];
	c = convertXyzToXyy(convertRgbToXyz(rgb));
	// The confusion line is between the source color and the confusion point
	slope = (c.y - line.y) / (c.x - line.x);
	yi = c.y - c.x * slope; // slope, and y-intercept (at x=0)
	// Find the change in the x and y dimensions (no Y change)
	dx = (line.yi - yi) / (slope - line.m);
	dy = (slope * dx) + yi;
	dY = 0;
	// Find the simulated colors XYZ coords
	z = {};
	z.X = dx * c.Y / dy;
	z.Y = c.Y;
	z.Z = (1 - (dx + dy)) * c.Y / dy;
	// Calculate difference between sim color and neutral color
	ngx = 0.312713 * c.Y / 0.329016; // find neutral grey using D65 white-point
	ngz = 0.358271 * c.Y / 0.329016;
	dX = ngx - z.X;
	dZ = ngz - z.Z;
	// find out how much to shift sim color toward neutral to fit in RGB space
	M = matrixXyzRgb;
	dR = dX * M[0] + dY * M[3] + dZ * M[6]; // convert d to linear RGB
	dG = dX * M[1] + dY * M[4] + dZ * M[7];
	dB = dX * M[2] + dY * M[5] + dZ * M[8];
	z.R = z.X * M[0] + z.Y * M[3] + z.Z * M[6]; // convert z to linear RGB
	z.G = z.X * M[1] + z.Y * M[4] + z.Z * M[7];
	z.B = z.X * M[2] + z.Y * M[5] + z.Z * M[8];
	_r = ((z.R < 0 ? 0 : 1) - z.R) / dR;
	_g = ((z.G < 0 ? 0 : 1) - z.G) / dG;
	_b = ((z.B < 0 ? 0 : 1) - z.B) / dB;
	_r = (_r > 1 || _r < 0) ? 0 : _r;
	_g = (_g > 1 || _g < 0) ? 0 : _g;
	_b = (_b > 1 || _b < 0) ? 0 : _b;
	adjust = _r > _g ? _r : _g;
	if (_b > adjust) {
		adjust = _b;
	}
	// shift proportionally...
	z.R += adjust * dR;
	z.G += adjust * dG;
	z.B += adjust * dB;
	// apply gamma and clamp simulated color...
	z.R = 255 * (z.R <= 0 ? 0 : z.R >= 1 ? 1 : Math.pow(z.R, 1 / gammaCorrection));
	z.G = 255 * (z.G <= 0 ? 0 : z.G >= 1 ? 1 : Math.pow(z.G, 1 / gammaCorrection));
	z.B = 255 * (z.B <= 0 ? 0 : z.B >= 1 ? 1 : Math.pow(z.B, 1 / gammaCorrection));
	//
	if (anomalize) {
		v = 1.75;
		n = v + 1;
		z.R = (v * z.R + rgb.R) / n;
		z.G = (v * z.G + rgb.G) / n;
		z.B = (v * z.B + rgb.B) / n;
	}
	//
	return z;
};

},{}],2:[function(require,module,exports){
/*
 * color-blind
 * https://github.com/skratchdot/color-blind
 *
 * see blind.js for more information about the original source.
 *
 * Copyright (c) 2014 skratchdot
 * Licensed under the MIT license.
 */
'use strict';

var onecolor = require('onecolor');
var Blind = require('./blind.js').Blind;
var colorVisionData = {
	protanomaly: {type: "protan", anomalize: true},
	protanopia: {type: "protan"},
	deuteranomaly: {type: "deutan", anomalize: true},
	deuteranopia: {type: "deutan"},
	tritanomaly: {type: "tritan", anomalize: true},
	tritanopia: {type: "tritan"},
	achromatomaly: {type: "achroma", anomalize: true},
	achromatopsia: {type: "achroma"}
};
var denorm = function (ratio) {
	return Math.round(ratio * 255);
};
var createBlinder = function (key) {
	return function (colorString, returnRgb) {
		var color = onecolor(colorString);
		if (!color) {
			return returnRgb ? {R:0,G:0,B:0} : '#000000';
		}
		var rgb = new Blind({
			R: denorm(color.red() || 0),
			G: denorm(color.green() || 0),
			B: denorm(color.blue() || 0)
		}, colorVisionData[key].type, colorVisionData[key].anomalize);
		// blinder.tritanomaly('#000000') causes NaN / null
		rgb.R = rgb.R || 0;
		rgb.G = rgb.G || 0;
		rgb.B = rgb.B || 0;
		if (returnRgb) {
			delete rgb.X;
			delete rgb.Y;
			delete rgb.Z;
			return rgb;
		}
		return new onecolor.RGB(
			(rgb.R % 256) / 255,
			(rgb.G % 256) / 255,
			(rgb.B % 256) / 255,
			1
		).hex();
	};
};

// add our exported functions
for (var key in colorVisionData) {
	exports[key] = createBlinder(key);
}

},{"./blind.js":1,"onecolor":3}],3:[function(require,module,exports){
module.exports = require('./lib/color')
    .use(require('./lib/XYZ'))
    .use(require('./lib/LAB'))
    .use(require('./lib/HSV'))
    .use(require('./lib/HSL'))
    .use(require('./lib/CMYK'))

    // Convenience functions
    .use(require('./lib/plugins/namedColors'))
    .use(require('./lib/plugins/clearer.js'))
    .use(require('./lib/plugins/contrast.js'))
    .use(require('./lib/plugins/darken.js'))
    .use(require('./lib/plugins/desaturate.js'))
    .use(require('./lib/plugins/grayscale.js'))
    .use(require('./lib/plugins/isDark.js'))
    .use(require('./lib/plugins/isLight.js'))
    .use(require('./lib/plugins/lighten.js'))
    .use(require('./lib/plugins/luminance.js'))
    .use(require('./lib/plugins/mix.js'))
    .use(require('./lib/plugins/negate.js'))
    .use(require('./lib/plugins/opaquer.js'))
    .use(require('./lib/plugins/rotate.js'))
    .use(require('./lib/plugins/saturate.js'))
    .use(require('./lib/plugins/toAlpha.js'));

},{"./lib/CMYK":4,"./lib/HSL":5,"./lib/HSV":6,"./lib/LAB":7,"./lib/XYZ":8,"./lib/color":9,"./lib/plugins/clearer.js":10,"./lib/plugins/contrast.js":11,"./lib/plugins/darken.js":12,"./lib/plugins/desaturate.js":13,"./lib/plugins/grayscale.js":14,"./lib/plugins/isDark.js":15,"./lib/plugins/isLight.js":16,"./lib/plugins/lighten.js":17,"./lib/plugins/luminance.js":18,"./lib/plugins/mix.js":19,"./lib/plugins/namedColors":20,"./lib/plugins/negate.js":21,"./lib/plugins/opaquer.js":22,"./lib/plugins/rotate.js":23,"./lib/plugins/saturate.js":24,"./lib/plugins/toAlpha.js":25}],4:[function(require,module,exports){
module.exports = function CMYK(color) {
    color.installColorSpace('CMYK', ['cyan', 'magenta', 'yellow', 'black', 'alpha'], {
        rgb: function () {
            return new color.RGB((1 - this._cyan * (1 - this._black) - this._black),
                                     (1 - this._magenta * (1 - this._black) - this._black),
                                     (1 - this._yellow * (1 - this._black) - this._black),
                                     this._alpha);
        },

        fromRgb: function () { // Becomes one.color.RGB.prototype.cmyk
            // Adapted from http://www.javascripter.net/faq/rgb2cmyk.htm
            var red = this._red,
                green = this._green,
                blue = this._blue,
                cyan = 1 - red,
                magenta = 1 - green,
                yellow = 1 - blue,
                black = 1;
            if (red || green || blue) {
                black = Math.min(cyan, Math.min(magenta, yellow));
                cyan = (cyan - black) / (1 - black);
                magenta = (magenta - black) / (1 - black);
                yellow = (yellow - black) / (1 - black);
            } else {
                black = 1;
            }
            return new color.CMYK(cyan, magenta, yellow, black, this._alpha);
        }
    });
};

},{}],5:[function(require,module,exports){
module.exports = function HSL(color) {
    color.use(require('./HSV'));

    color.installColorSpace('HSL', ['hue', 'saturation', 'lightness', 'alpha'], {
        hsv: function () {
            // Algorithm adapted from http://wiki.secondlife.com/wiki/Color_conversion_scripts
            var l = this._lightness * 2,
                s = this._saturation * ((l <= 1) ? l : 2 - l),
                saturation;

            // Avoid division by zero when l + s is very small (approaching black):
            if (l + s < 1e-9) {
                saturation = 0;
            } else {
                saturation = (2 * s) / (l + s);
            }

            return new color.HSV(this._hue, saturation, (l + s) / 2, this._alpha);
        },

        rgb: function () {
            return this.hsv().rgb();
        },

        fromRgb: function () { // Becomes one.color.RGB.prototype.hsv
            return this.hsv().hsl();
        }
    });
};

},{"./HSV":6}],6:[function(require,module,exports){
module.exports = function HSV(color) {
    color.installColorSpace('HSV', ['hue', 'saturation', 'value', 'alpha'], {
        rgb: function () {
            var hue = this._hue,
                saturation = this._saturation,
                value = this._value,
                i = Math.min(5, Math.floor(hue * 6)),
                f = hue * 6 - i,
                p = value * (1 - saturation),
                q = value * (1 - f * saturation),
                t = value * (1 - (1 - f) * saturation),
                red,
                green,
                blue;
            switch (i) {
            case 0:
                red = value;
                green = t;
                blue = p;
                break;
            case 1:
                red = q;
                green = value;
                blue = p;
                break;
            case 2:
                red = p;
                green = value;
                blue = t;
                break;
            case 3:
                red = p;
                green = q;
                blue = value;
                break;
            case 4:
                red = t;
                green = p;
                blue = value;
                break;
            case 5:
                red = value;
                green = p;
                blue = q;
                break;
            }
            return new color.RGB(red, green, blue, this._alpha);
        },

        hsl: function () {
            var l = (2 - this._saturation) * this._value,
                sv = this._saturation * this._value,
                svDivisor = l <= 1 ? l : (2 - l),
                saturation;

            // Avoid division by zero when lightness approaches zero:
            if (svDivisor < 1e-9) {
                saturation = 0;
            } else {
                saturation = sv / svDivisor;
            }
            return new color.HSL(this._hue, saturation, l / 2, this._alpha);
        },

        fromRgb: function () { // Becomes one.color.RGB.prototype.hsv
            var red = this._red,
                green = this._green,
                blue = this._blue,
                max = Math.max(red, green, blue),
                min = Math.min(red, green, blue),
                delta = max - min,
                hue,
                saturation = (max === 0) ? 0 : (delta / max),
                value = max;
            if (delta === 0) {
                hue = 0;
            } else {
                switch (max) {
                case red:
                    hue = (green - blue) / delta / 6 + (green < blue ? 1 : 0);
                    break;
                case green:
                    hue = (blue - red) / delta / 6 + 1 / 3;
                    break;
                case blue:
                    hue = (red - green) / delta / 6 + 2 / 3;
                    break;
                }
            }
            return new color.HSV(hue, saturation, value, this._alpha);
        }
    });
};

},{}],7:[function(require,module,exports){
module.exports = function LAB(color) {
    color.use(require('./XYZ.js'));

    color.installColorSpace('LAB', ['l', 'a', 'b', 'alpha'], {
        fromRgb: function () {
            return this.xyz().lab();
        },

        rgb: function () {
            return this.xyz().rgb();
        },

        xyz: function () {
            // http://www.easyrgb.com/index.php?X=MATH&H=08#text8
            var convert = function (channel) {
                    var pow = Math.pow(channel, 3);
                    return pow > 0.008856 ?
                        pow :
                        (channel - 16 / 116) / 7.87;
                },
                y = (this._l + 16) / 116,
                x = this._a / 500 + y,
                z = y - this._b / 200;

            return new color.XYZ(
                convert(x) *  95.047,
                convert(y) * 100.000,
                convert(z) * 108.883,
                this._alpha
            );
        }
    });
};

},{"./XYZ.js":8}],8:[function(require,module,exports){
module.exports = function XYZ(color) {
    color.installColorSpace('XYZ', ['x', 'y', 'z', 'alpha'], {
        fromRgb: function () {
            // http://www.easyrgb.com/index.php?X=MATH&H=02#text2
            var convert = function (channel) {
                    return channel > 0.04045 ?
                        Math.pow((channel + 0.055) / 1.055, 2.4) :
                        channel / 12.92;
                },
                r = convert(this._red),
                g = convert(this._green),
                b = convert(this._blue);

            // Reference white point sRGB D65:
            // http://www.brucelindbloom.com/index.html?Eqn_RGB_XYZ_Matrix.html
            return new color.XYZ(
                r * 0.4124564 + g * 0.3575761 + b * 0.1804375,
                r * 0.2126729 + g * 0.7151522 + b * 0.0721750,
                r * 0.0193339 + g * 0.1191920 + b * 0.9503041,
                this._alpha
            );
        },

        rgb: function () {
            // http://www.easyrgb.com/index.php?X=MATH&H=01#text1
            var x = this._x,
                y = this._y,
                z = this._z,
                convert = function (channel) {
                    return channel > 0.0031308 ?
                        1.055 * Math.pow(channel, 1 / 2.4) - 0.055 :
                        12.92 * channel;
                };

            // Reference white point sRGB D65:
            // http://www.brucelindbloom.com/index.html?Eqn_RGB_XYZ_Matrix.html
            return new color.RGB(
                convert(x *  3.2404542 + y * -1.5371385 + z * -0.4985314),
                convert(x * -0.9692660 + y *  1.8760108 + z *  0.0415560),
                convert(x *  0.0556434 + y * -0.2040259 + z *  1.0572252),
                this._alpha
            );
        },

        lab: function () {
            // http://www.easyrgb.com/index.php?X=MATH&H=07#text7
            var convert = function (channel) {
                    return channel > 0.008856 ?
                        Math.pow(channel, 1 / 3) :
                        7.787037 * channel + 4 / 29;
                },
                x = convert(this._x /  95.047),
                y = convert(this._y / 100.000),
                z = convert(this._z / 108.883);

            return new color.LAB(
                (116 * y) - 16,
                500 * (x - y),
                200 * (y - z),
                this._alpha
            );
        }
    });
};

},{}],9:[function(require,module,exports){
var installedColorSpaces = [],
    undef = function (obj) {
        return typeof obj === 'undefined';
    },
    channelRegExp = /\s*(\.\d+|\d+(?:\.\d+)?)(%)?\s*/,
    percentageChannelRegExp = /\s*(\.\d+|100|\d?\d(?:\.\d+)?)%\s*/,
    alphaChannelRegExp = /\s*(\.\d+|\d+(?:\.\d+)?)\s*/,
    cssColorRegExp = new RegExp(
                         '^(rgb|hsl|hsv)a?' +
                         '\\(' +
                             channelRegExp.source + ',' +
                             channelRegExp.source + ',' +
                             channelRegExp.source +
                             '(?:,' + alphaChannelRegExp.source + ')?' +
                         '\\)$', 'i');

function color(obj) {
    if (Array.isArray(obj)) {
        if (typeof obj[0] === 'string' && typeof color[obj[0]] === 'function') {
            // Assumed array from .toJSON()
            return new color[obj[0]](obj.slice(1, obj.length));
        } else if (obj.length === 4) {
            // Assumed 4 element int RGB array from canvas with all channels [0;255]
            return new color.RGB(obj[0] / 255, obj[1] / 255, obj[2] / 255, obj[3] / 255);
        }
    } else if (typeof obj === 'string') {
        var lowerCased = obj.toLowerCase();
        if (color.namedColors[lowerCased]) {
            obj = '#' + color.namedColors[lowerCased];
        }
        if (lowerCased === 'transparent') {
            obj = 'rgba(0,0,0,0)';
        }
        // Test for CSS rgb(....) string
        var matchCssSyntax = obj.match(cssColorRegExp);
        if (matchCssSyntax) {
            var colorSpaceName = matchCssSyntax[1].toUpperCase(),
                alpha = undef(matchCssSyntax[8]) ? matchCssSyntax[8] : parseFloat(matchCssSyntax[8]),
                hasHue = colorSpaceName[0] === 'H',
                firstChannelDivisor = matchCssSyntax[3] ? 100 : (hasHue ? 360 : 255),
                secondChannelDivisor = (matchCssSyntax[5] || hasHue) ? 100 : 255,
                thirdChannelDivisor = (matchCssSyntax[7] || hasHue) ? 100 : 255;
            if (undef(color[colorSpaceName])) {
                throw new Error('color.' + colorSpaceName + ' is not installed.');
            }
            return new color[colorSpaceName](
                parseFloat(matchCssSyntax[2]) / firstChannelDivisor,
                parseFloat(matchCssSyntax[4]) / secondChannelDivisor,
                parseFloat(matchCssSyntax[6]) / thirdChannelDivisor,
                alpha
            );
        }
        // Assume hex syntax
        if (obj.length < 6) {
            // Allow CSS shorthand
            obj = obj.replace(/^#?([0-9a-f])([0-9a-f])([0-9a-f])$/i, '$1$1$2$2$3$3');
        }
        // Split obj into red, green, and blue components
        var hexMatch = obj.match(/^#?([0-9a-f][0-9a-f])([0-9a-f][0-9a-f])([0-9a-f][0-9a-f])$/i);
        if (hexMatch) {
            return new color.RGB(
                parseInt(hexMatch[1], 16) / 255,
                parseInt(hexMatch[2], 16) / 255,
                parseInt(hexMatch[3], 16) / 255
            );
        }

        // No match so far. Lets try the less likely ones
        if (color.CMYK) {
            var cmykMatch = obj.match(new RegExp(
                             '^cmyk' +
                             '\\(' +
                                 percentageChannelRegExp.source + ',' +
                                 percentageChannelRegExp.source + ',' +
                                 percentageChannelRegExp.source + ',' +
                                 percentageChannelRegExp.source +
                             '\\)$', 'i'));
            if (cmykMatch) {
                return new color.CMYK(
                    parseFloat(cmykMatch[1]) / 100,
                    parseFloat(cmykMatch[2]) / 100,
                    parseFloat(cmykMatch[3]) / 100,
                    parseFloat(cmykMatch[4]) / 100
                );
            }
        }
    } else if (typeof obj === 'object' && obj.isColor) {
        return obj;
    }
    return false;
}

color.namedColors = {};

color.installColorSpace = function (colorSpaceName, propertyNames, config) {
    color[colorSpaceName] = function (a1) { // ...
        var args = Array.isArray(a1) ? a1 : arguments;
        propertyNames.forEach(function (propertyName, i) {
            var propertyValue = args[i];
            if (propertyName === 'alpha') {
                this._alpha = (isNaN(propertyValue) || propertyValue > 1) ? 1 : (propertyValue < 0 ? 0 : propertyValue);
            } else {
                if (isNaN(propertyValue)) {
                    throw new Error('[' + colorSpaceName + ']: Invalid color: (' + propertyNames.join(',') + ')');
                }
                if (propertyName === 'hue') {
                    this._hue = propertyValue < 0 ? propertyValue - Math.floor(propertyValue) : propertyValue % 1;
                } else {
                    this['_' + propertyName] = propertyValue < 0 ? 0 : (propertyValue > 1 ? 1 : propertyValue);
                }
            }
        }, this);
    };
    color[colorSpaceName].propertyNames = propertyNames;

    var prototype = color[colorSpaceName].prototype;

    ['valueOf', 'hex', 'hexa', 'css', 'cssa'].forEach(function (methodName) {
        prototype[methodName] = prototype[methodName] || (colorSpaceName === 'RGB' ? prototype.hex : function () {
            return this.rgb()[methodName]();
        });
    });

    prototype.isColor = true;

    prototype.equals = function (otherColor, epsilon) {
        if (undef(epsilon)) {
            epsilon = 1e-10;
        }

        otherColor = otherColor[colorSpaceName.toLowerCase()]();

        for (var i = 0; i < propertyNames.length; i = i + 1) {
            if (Math.abs(this['_' + propertyNames[i]] - otherColor['_' + propertyNames[i]]) > epsilon) {
                return false;
            }
        }

        return true;
    };

    prototype.toJSON = function () {
        return [colorSpaceName].concat(propertyNames.map(function (propertyName) {
            return this['_' + propertyName];
        }, this));
    };

    for (var propertyName in config) {
        if (config.hasOwnProperty(propertyName)) {
            var matchFromColorSpace = propertyName.match(/^from(.*)$/);
            if (matchFromColorSpace) {
                color[matchFromColorSpace[1].toUpperCase()].prototype[colorSpaceName.toLowerCase()] = config[propertyName];
            } else {
                prototype[propertyName] = config[propertyName];
            }
        }
    }

    // It is pretty easy to implement the conversion to the same color space:
    prototype[colorSpaceName.toLowerCase()] = function () {
        return this;
    };
    prototype.toString = function () {
        return '[' + colorSpaceName + ' ' + propertyNames.map(function (propertyName) {
            return this['_' + propertyName];
        }, this).join(', ') + ']';
    };

    // Generate getters and setters
    propertyNames.forEach(function (propertyName) {
        var shortName = propertyName === 'black' ? 'k' : propertyName.charAt(0);
        prototype[propertyName] = prototype[shortName] = function (value, isDelta) {
            // Simple getter mode: color.red()
            if (typeof value === 'undefined') {
                return this['_' + propertyName];
            } else if (isDelta) {
                // Adjuster: color.red(+.2, true)
                return new this.constructor(propertyNames.map(function (otherPropertyName) {
                    return this['_' + otherPropertyName] + (propertyName === otherPropertyName ? value : 0);
                }, this));
            } else {
                // Setter: color.red(.2);
                return new this.constructor(propertyNames.map(function (otherPropertyName) {
                    return (propertyName === otherPropertyName) ? value : this['_' + otherPropertyName];
                }, this));
            }
        };
    });

    function installForeignMethods(targetColorSpaceName, sourceColorSpaceName) {
        var obj = {};
        obj[sourceColorSpaceName.toLowerCase()] = function () {
            return this.rgb()[sourceColorSpaceName.toLowerCase()]();
        };
        color[sourceColorSpaceName].propertyNames.forEach(function (propertyName) {
            var shortName = propertyName === 'black' ? 'k' : propertyName.charAt(0);
            obj[propertyName] = obj[shortName] = function (value, isDelta) {
                return this[sourceColorSpaceName.toLowerCase()]()[propertyName](value, isDelta);
            };
        });
        for (var prop in obj) {
            if (obj.hasOwnProperty(prop) && color[targetColorSpaceName].prototype[prop] === undefined) {
                color[targetColorSpaceName].prototype[prop] = obj[prop];
            }
        }
    }

    installedColorSpaces.forEach(function (otherColorSpaceName) {
        installForeignMethods(colorSpaceName, otherColorSpaceName);
        installForeignMethods(otherColorSpaceName, colorSpaceName);
    });

    installedColorSpaces.push(colorSpaceName);
    return color;
};

color.pluginList = [];

color.use = function (plugin) {
    if (color.pluginList.indexOf(plugin) === -1) {
        this.pluginList.push(plugin);
        plugin(color);
    }
    return color;
};

color.installMethod = function (name, fn) {
    installedColorSpaces.forEach(function (colorSpace) {
        color[colorSpace].prototype[name] = fn;
    });
    return this;
};

color.installColorSpace('RGB', ['red', 'green', 'blue', 'alpha'], {
    hex: function () {
        var hexString = (Math.round(255 * this._red) * 0x10000 + Math.round(255 * this._green) * 0x100 + Math.round(255 * this._blue)).toString(16);
        return '#' + ('00000'.substr(0, 6 - hexString.length)) + hexString;
    },

    hexa: function () {
        var alphaString = Math.round(this._alpha * 255).toString(16);
        return '#' + '00'.substr(0, 2 - alphaString.length) + alphaString + this.hex().substr(1, 6);
    },

    css: function () {
        return 'rgb(' + Math.round(255 * this._red) + ',' + Math.round(255 * this._green) + ',' + Math.round(255 * this._blue) + ')';
    },

    cssa: function () {
        return 'rgba(' + Math.round(255 * this._red) + ',' + Math.round(255 * this._green) + ',' + Math.round(255 * this._blue) + ',' + this._alpha + ')';
    }
});

module.exports = color;

},{}],10:[function(require,module,exports){
module.exports = function clearer(color) {
    color.installMethod('clearer', function (amount) {
        return this.alpha(isNaN(amount) ? -0.1 : -amount, true);
    });
};

},{}],11:[function(require,module,exports){
module.exports = function contrast(color) {
  // http://www.w3.org/TR/WCAG20/#contrast-ratiodef

  color.use(require('./luminance'));

  color.installMethod('contrast', function (color2) {
    var lum1 = this.luminance();
    var lum2 = color2.luminance();
    if (lum1 > lum2) {
      return (lum1 + 0.05) / (lum2 + 0.05);
    }

    return (lum2 + 0.05) / (lum1 + 0.05);
  });
};

},{"./luminance":18}],12:[function(require,module,exports){
module.exports = function darken(color) {
    color.use(require('../HSL'));

    color.installMethod('darken', function (amount) {
        return this.lightness(isNaN(amount) ? -0.1 : -amount, true);
    });
};

},{"../HSL":5}],13:[function(require,module,exports){
module.exports = function desaturate(color) {
    color.use(require('../HSL'));

    color.installMethod('desaturate', function (amount) {
        return this.saturation(isNaN(amount) ? -0.1 : -amount, true);
    });
};

},{"../HSL":5}],14:[function(require,module,exports){
module.exports = function grayscale(color) {
    function gs () {
        /*jslint strict:false*/
        var rgb = this.rgb(),
            val = rgb._red * 0.3 + rgb._green * 0.59 + rgb._blue * 0.11;

        return new color.RGB(val, val, val, rgb._alpha);
    }

    color.installMethod('greyscale', gs).installMethod('grayscale', gs);
};

},{}],15:[function(require,module,exports){
module.exports = function isDark(color) {

  color.installMethod('isDark', function () {
    var rgb = this.rgb();

    // YIQ equation from http://24ways.org/2010/calculating-color-contrast
    var yiq = (rgb._red * 255 * 299 + rgb._green * 255 * 587 + rgb._blue * 255 * 114) / 1000;
    return yiq < 128;
  });
};

},{}],16:[function(require,module,exports){
module.exports = function isLight(color) {

  color.use(require('./isDark'));

  color.installMethod('isLight', function () {
    return !this.isDark();
  });
};

},{"./isDark":15}],17:[function(require,module,exports){
module.exports = function lighten(color) {
    color.use(require('../HSL'));

    color.installMethod('lighten', function (amount) {
        return this.lightness(isNaN(amount) ? 0.1 : amount, true);
    });
};

},{"../HSL":5}],18:[function(require,module,exports){
module.exports = function luminance(color) {
  // http://www.w3.org/TR/WCAG20/#relativeluminancedef

  function channelLuminance(value) {
    return (value <= 0.03928) ? value / 12.92 : Math.pow(((value + 0.055) / 1.055), 2.4);
  }

  color.installMethod('luminance', function () {
    var rgb = this.rgb();
    return 0.2126 * channelLuminance(rgb._red) + 0.7152 * channelLuminance(rgb._green) + 0.0722 * channelLuminance(rgb._blue);
  });
};

},{}],19:[function(require,module,exports){
module.exports = function mix(color) {
    color.installMethod('mix', function (otherColor, weight) {
        otherColor = color(otherColor).rgb();
        weight = 1 - (isNaN(weight) ? 0.5 : weight);

        var w = weight * 2 - 1,
            a = this._alpha - otherColor._alpha,
            weight1 = (((w * a === -1) ? w : (w + a) / (1 + w * a)) + 1) / 2,
            weight2 = 1 - weight1,
            rgb = this.rgb();

        return new color.RGB(
            rgb._red * weight1 + otherColor._red * weight2,
            rgb._green * weight1 + otherColor._green * weight2,
            rgb._blue * weight1 + otherColor._blue * weight2,
            rgb._alpha * weight + otherColor._alpha * (1 - weight)
        );
    });
};

},{}],20:[function(require,module,exports){
module.exports = function namedColors(color) {
    color.namedColors = {
        aliceblue: 'f0f8ff',
        antiquewhite: 'faebd7',
        aqua: '0ff',
        aquamarine: '7fffd4',
        azure: 'f0ffff',
        beige: 'f5f5dc',
        bisque: 'ffe4c4',
        black: '000',
        blanchedalmond: 'ffebcd',
        blue: '00f',
        blueviolet: '8a2be2',
        brown: 'a52a2a',
        burlywood: 'deb887',
        cadetblue: '5f9ea0',
        chartreuse: '7fff00',
        chocolate: 'd2691e',
        coral: 'ff7f50',
        cornflowerblue: '6495ed',
        cornsilk: 'fff8dc',
        crimson: 'dc143c',
        cyan: '0ff',
        darkblue: '00008b',
        darkcyan: '008b8b',
        darkgoldenrod: 'b8860b',
        darkgray: 'a9a9a9',
        darkgrey: 'a9a9a9',
        darkgreen: '006400',
        darkkhaki: 'bdb76b',
        darkmagenta: '8b008b',
        darkolivegreen: '556b2f',
        darkorange: 'ff8c00',
        darkorchid: '9932cc',
        darkred: '8b0000',
        darksalmon: 'e9967a',
        darkseagreen: '8fbc8f',
        darkslateblue: '483d8b',
        darkslategray: '2f4f4f',
        darkslategrey: '2f4f4f',
        darkturquoise: '00ced1',
        darkviolet: '9400d3',
        deeppink: 'ff1493',
        deepskyblue: '00bfff',
        dimgray: '696969',
        dimgrey: '696969',
        dodgerblue: '1e90ff',
        firebrick: 'b22222',
        floralwhite: 'fffaf0',
        forestgreen: '228b22',
        fuchsia: 'f0f',
        gainsboro: 'dcdcdc',
        ghostwhite: 'f8f8ff',
        gold: 'ffd700',
        goldenrod: 'daa520',
        gray: '808080',
        grey: '808080',
        green: '008000',
        greenyellow: 'adff2f',
        honeydew: 'f0fff0',
        hotpink: 'ff69b4',
        indianred: 'cd5c5c',
        indigo: '4b0082',
        ivory: 'fffff0',
        khaki: 'f0e68c',
        lavender: 'e6e6fa',
        lavenderblush: 'fff0f5',
        lawngreen: '7cfc00',
        lemonchiffon: 'fffacd',
        lightblue: 'add8e6',
        lightcoral: 'f08080',
        lightcyan: 'e0ffff',
        lightgoldenrodyellow: 'fafad2',
        lightgray: 'd3d3d3',
        lightgrey: 'd3d3d3',
        lightgreen: '90ee90',
        lightpink: 'ffb6c1',
        lightsalmon: 'ffa07a',
        lightseagreen: '20b2aa',
        lightskyblue: '87cefa',
        lightslategray: '789',
        lightslategrey: '789',
        lightsteelblue: 'b0c4de',
        lightyellow: 'ffffe0',
        lime: '0f0',
        limegreen: '32cd32',
        linen: 'faf0e6',
        magenta: 'f0f',
        maroon: '800000',
        mediumaquamarine: '66cdaa',
        mediumblue: '0000cd',
        mediumorchid: 'ba55d3',
        mediumpurple: '9370d8',
        mediumseagreen: '3cb371',
        mediumslateblue: '7b68ee',
        mediumspringgreen: '00fa9a',
        mediumturquoise: '48d1cc',
        mediumvioletred: 'c71585',
        midnightblue: '191970',
        mintcream: 'f5fffa',
        mistyrose: 'ffe4e1',
        moccasin: 'ffe4b5',
        navajowhite: 'ffdead',
        navy: '000080',
        oldlace: 'fdf5e6',
        olive: '808000',
        olivedrab: '6b8e23',
        orange: 'ffa500',
        orangered: 'ff4500',
        orchid: 'da70d6',
        palegoldenrod: 'eee8aa',
        palegreen: '98fb98',
        paleturquoise: 'afeeee',
        palevioletred: 'd87093',
        papayawhip: 'ffefd5',
        peachpuff: 'ffdab9',
        peru: 'cd853f',
        pink: 'ffc0cb',
        plum: 'dda0dd',
        powderblue: 'b0e0e6',
        purple: '800080',
        rebeccapurple: '639',
        red: 'f00',
        rosybrown: 'bc8f8f',
        royalblue: '4169e1',
        saddlebrown: '8b4513',
        salmon: 'fa8072',
        sandybrown: 'f4a460',
        seagreen: '2e8b57',
        seashell: 'fff5ee',
        sienna: 'a0522d',
        silver: 'c0c0c0',
        skyblue: '87ceeb',
        slateblue: '6a5acd',
        slategray: '708090',
        slategrey: '708090',
        snow: 'fffafa',
        springgreen: '00ff7f',
        steelblue: '4682b4',
        tan: 'd2b48c',
        teal: '008080',
        thistle: 'd8bfd8',
        tomato: 'ff6347',
        turquoise: '40e0d0',
        violet: 'ee82ee',
        wheat: 'f5deb3',
        white: 'fff',
        whitesmoke: 'f5f5f5',
        yellow: 'ff0',
        yellowgreen: '9acd32'
    };
};

},{}],21:[function(require,module,exports){
module.exports = function negate(color) {
    color.installMethod('negate', function () {
        var rgb = this.rgb();
        return new color.RGB(1 - rgb._red, 1 - rgb._green, 1 - rgb._blue, this._alpha);
    });
};

},{}],22:[function(require,module,exports){
module.exports = function opaquer(color) {
    color.installMethod('opaquer', function (amount) {
        return this.alpha(isNaN(amount) ? 0.1 : amount, true);
    });
};

},{}],23:[function(require,module,exports){
module.exports = function rotate(color) {
    color.use(require('../HSL'));

    color.installMethod('rotate', function (degrees) {
        return this.hue((degrees || 0) / 360, true);
    });
};

},{"../HSL":5}],24:[function(require,module,exports){
module.exports = function saturate(color) {
    color.use(require('../HSL'));

    color.installMethod('saturate', function (amount) {
        return this.saturation(isNaN(amount) ? 0.1 : amount, true);
    });
};

},{"../HSL":5}],25:[function(require,module,exports){
// Adapted from http://gimp.sourcearchive.com/documentation/2.6.6-1ubuntu1/color-to-alpha_8c-source.html
// toAlpha returns a color where the values of the argument have been converted to alpha
module.exports = function toAlpha(color) {
    color.installMethod('toAlpha', function (color) {
        var me = this.rgb(),
            other = color(color).rgb(),
            epsilon = 1e-10,
            a = new color.RGB(0, 0, 0, me._alpha),
            channels = ['_red', '_green', '_blue'];

        channels.forEach(function (channel) {
            if (me[channel] < epsilon) {
                a[channel] = me[channel];
            } else if (me[channel] > other[channel]) {
                a[channel] = (me[channel] - other[channel]) / (1 - other[channel]);
            } else if (me[channel] > other[channel]) {
                a[channel] = (other[channel] - me[channel]) / other[channel];
            } else {
                a[channel] = 0;
            }
        });

        if (a._red > a._green) {
            if (a._red > a._blue) {
                me._alpha = a._red;
            } else {
                me._alpha = a._blue;
            }
        } else if (a._green > a._blue) {
            me._alpha = a._green;
        } else {
            me._alpha = a._blue;
        }

        if (me._alpha < epsilon) {
            return me;
        }

        channels.forEach(function (channel) {
            me[channel] = (me[channel] - other[channel]) / me._alpha + other[channel];
        });
        me._alpha *= a._alpha;

        return me;
    });
};

},{}],26:[function(require,module,exports){
const colorBlind = require("color-blind");

// робимо доступним глобально у браузері
window.colorBlind = colorBlind;

},{"color-blind":2}]},{},[26]);
