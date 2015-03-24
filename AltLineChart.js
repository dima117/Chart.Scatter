(function () {
	"use strict";

	var chartjs = this,
		helpers = chartjs.helpers;

	var defaultConfig = {

		//Boolean - Whether the line is curved between points
		bezierCurve: true,

		//Number - Tension of the bezier curve between points
		bezierCurveTension: 0.4,

		//Boolean - Whether to show a dot for each point
		pointDot: true,

		//Number - Radius of each point dot in pixels
		pointDotRadius: 4,

		//Number - Pixel width of point dot stroke
		pointDotStrokeWidth: 1,

		//Number - amount extra to add to the radius to cater for hit detection outside the drawn point
		pointHitDetectionRadius: 20,

		//Boolean - Whether to show a stroke for datasets
		datasetStroke: true,

		//Number - Pixel width of dataset stroke
		datasetStrokeWidth: 2
	};

	chartjs.Type.extend({
		name: "AltLineChart",
		defaults: defaultConfig,

		initialize: function (datasets) {

			//this.chart.ctx // The drawing context for this chart
			//this.chart.canvas // the canvas node for this chart

			this.datasets = datasets;

			this.render();
			//this.scale = this.buildScale(options.data)
		},

		//buildScale: function (data) {

		//	var scaleOptions = {
		//		min: helpers.min(data, function (obj) { return obj.x; }),
		//		max: helpers.max(data, function (obj) { return obj.x; }),
		//		height: this.chart.height,
		//		width: this.chart.width,
		//		ctx: this.chart.ctx
		//	}; 

		//	var scale = new chartjs.AltScale(scaleOptions);

		//},

		calculateRange: function () {

			var xmin = undefined,
				xmax = undefined,
				ymin = undefined,
				ymax = undefined;

			for (var i = 0; i < this.datasets.length; i++) {

				var ds = this.datasets[i];

				for (var j = 0; j < ds.data.length; j++) {

					var value = ds.data[j];

					// min x
					if (xmin === undefined || value.x < xmin) {
						xmin = value.x;
					}

					// max x
					if (xmax === undefined || value.x > xmax) {
						xmax = value.x;
					}

					// min y
					if (ymin === undefined || value.y < ymin) {
						ymin = value.y;
					}

					// max y
					if (ymax === undefined || value.y > ymax) {
						ymax = value.y;
					}
				}
			}

			return {
				xmin: xmin,
				xmax: xmax,
				ymin: ymin,
				ymax: ymax
			}
		},

		initCalculator: function (ease, options) {

			var easingDecimal = ease || 1,
				range = this.calculateRange(),
				width = this.chart.width,
				height = this.chart.height;

			var api = {
				getElementOrDefault: function (array, index, defaultValue) {

					return index >= 0 && index < array.length
						? array[index]
						: defaultValue;
				},
				calculateControlPoints: function (prev, current, next, tension) {

					var tensionBefore = !!prev ? tension : 0;
					var tensionAfter = !!next ? tension : 0;

					var innerPrev = prev || current;
					var innerNext = next || current;

					var a = { xx: current.x - innerPrev.x, yy: current.y - innerPrev.y }
					var b = { xx: innerNext.x - innerPrev.x, yy: innerNext.y - innerPrev.y }

					var mul = a.xx * b.xx + a.yy * b.yy;
					var mod = Math.sqrt(b.xx * b.xx + b.yy * b.yy);

					var k = Math.min(Math.max(mul / (mod * mod), 0.3), 0.7);

					var result = {
						before: { x: current.x - b.xx * k * tensionBefore, y: current.y - b.yy * k * tensionBefore },
						after: { x: current.x + b.xx * (1 - k) * tensionAfter, y: current.y + b.yy * (1 - k) * tensionAfter }
					};

					if (result.after.y > range.ymax) {

						result.after.y = range.ymax;
					} else {

						if (result.after.y < range.ymin) {

							result.after.y = range.ymin;
						}
					}

					// Cap inner bezier handles to the upper/lower scale bounds
					if (result.before.y > range.ymax) {

						result.before.y = range.ymax;
					} else {

						if (result.before.y < range.ymin) {

							result.before.y = range.ymin;
						}
					}

					return result;
				},
				calculateScaleParameters: function (min, max) {

					var x = [0.01, 0.1, 1, 10, 100, 1000, 10000];

					var range = max - min;
					var mul = 0.0001;
					while (range / mul > 14) {

						mul *= 10;
					}

					var start = (Math.trunc(min / mul) + 1) * mul;
					var end = Math.trunc(max / mul) * mul;

					return {
						start: start,
						end: end,
						step: mul
					};
				}
			};

			return {
				calculateX: function (x) {

					return (x - range.xmin) * width / (range.xmax - range.xmin);
				},
				calculateY: function (y) {

					return height - ((y - range.ymin) * height / (range.ymax - range.ymin)) * easingDecimal;
				},

				calculatePointPositions: function (data) {

					var result = [];

					for (var i = 0; i < data.length; i++) {

						var current = api.getElementOrDefault(data, i);

						var point = {
							x: this.calculateX(current.x),
							y: this.calculateY(current.y)
						};

						if (options.bezierCurve) {

							var prev = api.getElementOrDefault(data, i - 1);
							var next = api.getElementOrDefault(data, i + 1);

							var obj = api.calculateControlPoints(prev, current, next, options.bezierCurveTension);

							point.x1 = this.calculateX(obj.before.x);
							point.y1 = this.calculateY(obj.before.y);

							point.x2 = this.calculateX(obj.after.x);
							point.y2 = this.calculateY(obj.after.y);
						}

						result.push(point);
					}

					return result;
				},

				calculateXScaleParameters: function() {

					return api.calculateScaleParameters(range.xmin, range.xmax);
				},
				calculateYScaleParameters: function() {

					return api.calculateScaleParameters(range.ymin, range.ymax);
				}
			};
		},

		// Used to draw something on the canvas
		draw: function (ease) {

			var calc = this.initCalculator(ease, this.options);

			this.clear();

			// axis
			ctx.strokeStyle = '#eeeeee';

			//var scaleX = calc.calculateXScaleParameters();
			//for (var i = scaleX.start; i <= scaleX.end; i += scaleX.step) {

			//	var xpos1 = calc.calculateX(i);
			//	ctx.beginPath();
			//	ctx.moveTo(xpos1, 0);
			//	ctx.lineTo(xpos1, this.chart.height);
			//	ctx.stroke();
			//}

			var scaleY = calc.calculateXScaleParameters();
			for (var j = scaleY.start; j <= scaleY.end; j += scaleY.step) {

				var ypos1 = calc.calculateY(j);
				ctx.beginPath();
				ctx.moveTo(0, ypos1);
				ctx.lineTo(this.chart.width, ypos1);
				ctx.stroke();
			}


			helpers.each(this.datasets, function (dataset) {

				ctx.lineWidth = this.options.datasetStrokeWidth;
				ctx.strokeStyle = dataset.strokeColor;
				ctx.beginPath();

				var points = calc.calculatePointPositions(dataset.data);
				var prev = points[0];

				helpers.each(points, function (point, index) {

					if (index === 0) {

						ctx.moveTo(point.x, point.y);
					}
					else {

						if (this.options.bezierCurve) {

							ctx.bezierCurveTo(prev.x2, prev.y2, point.x1, point.y1, point.x, point.y);
							prev = point;
						}
						else {

							ctx.lineTo(point.x, point.y);
						}
					}

				}, this);

				ctx.stroke();

				// debug
				ctx.lineWidth = 1;
				ctx.strokeStyle = '#C5D6E0';

				if (this.options.bezierCurve) {

					helpers.each(points, function (point, index) {

						ctx.beginPath();
						ctx.moveTo(point.x1, point.y1);
						ctx.lineTo(point.x2, point.y2);
						ctx.stroke();
					});
				}

				// points
				ctx.lineWidth = 1;
				ctx.strokeStyle = 'white';
				ctx.fillStyle = dataset.strokeColor;

				helpers.each(points, function (point) {

					ctx.beginPath();
					ctx.arc(point.x, point.y, 4, 0, 2 * Math.PI, false);
					ctx.fill();
					ctx.stroke();
				});



			}, this);

		}
	});

}).call(window.Chart);