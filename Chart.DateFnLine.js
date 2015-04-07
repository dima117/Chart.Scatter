(function () {
	"use strict";

	var dateFormat = function () {

		var token = /d{1,4}|m{1,4}|yy(?:yy)?|([HhMsTt])\1?|[LloSZ]|"[^"]*"|'[^']*'/g,
			timezone = /\b(?:[PMCEA][SDP]T|(?:Pacific|Mountain|Central|Eastern|Atlantic) (?:Standard|Daylight|Prevailing) Time|(?:GMT|UTC)(?:[-+]\d{4})?)\b/g,
			timezoneClip = /[^-+\dA-Z]/g,
			pad = function (val, len) {
				val = String(val);
				len = len || 2;
				while (val.length < len) val = "0" + val;
				return val;
			},
			masks = {
				"default": "ddd mmm dd yyyy HH:MM:ss"
			},
			i18n = {
				dayNames: [
					"Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat",
					"Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
				],
				monthNames: [
					"Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
					"January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"
				]
			};



		// Regexes and supporting functions are cached through closure
		return function (date, mask, utc) {

			// You can't provide utc if you skip other args (use the "UTC:" mask prefix)
			if (arguments.length == 1 && Object.prototype.toString.call(date) == "[object String]" && !/\d/.test(date)) {
				mask = date;
				date = undefined;
			}

			// Passing date through Date applies Date.parse, if necessary
			date = date ? new Date(date) : new Date;
			if (isNaN(date)) throw SyntaxError("invalid date");

			mask = String(masks[mask] || mask || masks["default"]);

			// Allow setting the utc argument via the mask
			if (mask.slice(0, 4) == "UTC:") {
				mask = mask.slice(4);
				utc = true;
			}

			var _ = utc ? "getUTC" : "get",
				d = date[_ + "Date"](),
				D = date[_ + "Day"](),
				m = date[_ + "Month"](),
				y = date[_ + "FullYear"](),
				H = date[_ + "Hours"](),
				M = date[_ + "Minutes"](),
				s = date[_ + "Seconds"](),
				L = date[_ + "Milliseconds"](),
				o = utc ? 0 : date.getTimezoneOffset(),
				flags = {
					d: d,
					dd: pad(d),
					ddd: i18n.dayNames[D],
					dddd: i18n.dayNames[D + 7],
					m: m + 1,
					mm: pad(m + 1),
					mmm: i18n.monthNames[m],
					mmmm: i18n.monthNames[m + 12],
					yy: String(y).slice(2),
					yyyy: y,
					h: H % 12 || 12,
					hh: pad(H % 12 || 12),
					H: H,
					HH: pad(H),
					M: M,
					MM: pad(M),
					s: s,
					ss: pad(s),
					l: pad(L, 3),
					L: pad(L > 99 ? Math.round(L / 10) : L),
					t: H < 12 ? "a" : "p",
					tt: H < 12 ? "am" : "pm",
					T: H < 12 ? "A" : "P",
					TT: H < 12 ? "AM" : "PM",
					Z: utc ? "UTC" : (String(date).match(timezone) || [""]).pop().replace(timezoneClip, ""),
					o: (o > 0 ? "-" : "+") + pad(Math.floor(Math.abs(o) / 60) * 100 + Math.abs(o) % 60, 4),
					S: ["th", "st", "nd", "rd"][d % 10 > 3 ? 0 : (d % 100 - d % 10 != 10) * d % 10]
				};

			return mask.replace(token, function ($0) {
				return $0 in flags ? flags[$0] : $0.slice(1, $0.length - 1);
			});
		};
	}();

	var chartjs = this,
		helpers = chartjs.helpers,
		hlp = {

			formatDateValue: function (date) {

				date = new Date(+date);

				var ms = date.getUTCMilliseconds();

				if (ms) {

					return ('000' + ms).slice(-3);
				}

				var hasTime = date.getUTCHours() +
					date.getUTCMinutes() +
					date.getUTCSeconds();

				if (hasTime) {

					return dateFormat(date, "h:MM", true);
				} else {

					return dateFormat(date, "mmm d", true);
				}
			}
		};

	chartjs.DateFnScale = chartjs.FnScale.extend({

		_calculateDateScaleRange: function (valueMin, valueMax, drawingSize, fontSize) {

			var units = [
				{ u: 1, c: 1, t: 1, n: 'ms' },
				{ u: 1, c: 2, t: 2, n: 'ms' },
				{ u: 1, c: 5, t: 5, n: 'ms' },
				{ u: 1, c: 10, t: 10, n: 'ms' },
				{ u: 1, c: 20, t: 20, n: 'ms' },
				{ u: 1, c: 50, t: 50, n: 'ms' },
				{ u: 1, c: 100, t: 100, n: 'ms' },
				{ u: 1, c: 200, t: 200, n: 'ms' },
				{ u: 1, c: 500, t: 500, n: 'ms' },
				{ u: 1000, c: 1, t: 1000, n: 's' },
				{ u: 1000, c: 2, t: 2000, n: 's' },
				{ u: 1000, c: 5, t: 5000, n: 's' },
				{ u: 1000, c: 10, t: 10000, n: 's' },
				{ u: 1000, c: 15, t: 15000, n: 's' },
				{ u: 1000, c: 20, t: 20000, n: 's' },
				{ u: 1000, c: 30, t: 30000, n: 's' },
				{ u: 60000, c: 1, t: 60000, n: 'm' },
				{ u: 60000, c: 2, t: 120000, n: 'm' },
				{ u: 60000, c: 5, t: 300000, n: 'm' },
				{ u: 60000, c: 10, t: 600000, n: 'm' },
				{ u: 60000, c: 15, t: 900000, n: 'm' },
				{ u: 60000, c: 20, t: 1200000, n: 'm' },
				{ u: 60000, c: 30, t: 1800000, n: 'm' },
				{ u: 3600000, c: 1, t: 3600000, n: 'h' },
				{ u: 3600000, c: 2, t: 7200000, n: 'h' },
				{ u: 3600000, c: 3, t: 10800000, n: 'h' },
				{ u: 3600000, c: 4, t: 14400000, n: 'h' },
				{ u: 3600000, c: 6, t: 21600000, n: 'h' },
				{ u: 3600000, c: 8, t: 28800000, n: 'h' },
				{ u: 3600000, c: 12, t: 43200000, n: 'h' },
				{ u: 86400000, c: 1, t: 86400000, n: 'd' },
				{ u: 86400000, c: 2, t: 172800000, n: 'd' },
				{ u: 86400000, c: 4, t: 345600000, n: 'd' },
				{ u: 86400000, c: 5, t: 432000000, n: 'd' },
				{ u: 604800000, c: 1, t: 604800000, n: 'w' }];

			var maxSteps = drawingSize / (fontSize * 2);

			var valueRange = +valueMax - valueMin,
				offset = 0,// new Date(+valueMin).getTimezoneOffset() * 60000,
				min = +valueMin + offset,
				max = +valueMax + offset;

			var xp = 0;

			while (xp < units.length && (valueRange / units[xp].t > maxSteps)) {
				xp++;
			}

			var stepValue = units[xp].t,
				start = Math.floor(min / stepValue) * stepValue,
				stepCount = Math.ceil((max - start) / stepValue),
				end = start + stepValue * stepCount;

			return {
				min: start - offset,
				max: end - offset,
				steps: stepCount,
				stepValue: stepValue
			};
		},

		calculateXscaleRange: function () {

			this.xScaleRange = this._calculateDateScaleRange(
				this.dataRange.xmin,
				this.dataRange.xmax,
				this.chart.width,
				this.fontSize
			);
		},

		generateXLabels: function () {

			var graphMin = this.xScaleRange.min,
				stepValue = this.xScaleRange.stepValue,
				labelsArray = new Array(this.xScaleRange.steps);

			helpers.each(labelsArray, function (val, index) {

				var value = graphMin + stepValue * index;


				labelsArray[index] = hlp.formatDateValue(value);
			});

			this.xLabels = labelsArray;
		}
	});

	chartjs.types.FnLine.extend({

		name: "DateFnLine",
		defaults: {

			scaleArgLabel: "mmm d, yyyy, hh:MM",
		},
		scaleClass: chartjs.DateFnScale,
		formatLabelX: function (arg) {

			return dateFormat(arg, this.options.scaleArgLabel, true);
		}
	});


}).call(window.Chart);