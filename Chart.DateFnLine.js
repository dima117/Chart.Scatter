(function () {
	"use strict";

	var chartjs = this,
		helpers = chartjs.helpers;

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

			var mul = 2;

			var minSteps = 2;
			var maxSteps = drawingSize / (fontSize * mul);

			var valueRange = +valueMax - valueMin,
				offset = new Date(+valueMin).getTimezoneOffset() * 60000,
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


				labelsArray[index] = new Date(value).toLocaleTimeString();
			});

			this.xLabels = labelsArray;
		}
	});

	chartjs.types.FnLine.extend({
		// Passing in a name registers this chart in the Chart namespace in the same way
		name: "DateFnLine",
		//,		initialize: function (data) {
		//	console.log('My Line chart extension');
		//	Chart.types.Line.prototype.initialize.apply(this, arguments);
		//}

		scaleClass: chartjs.DateFnScale
	});


}).call(window.Chart);