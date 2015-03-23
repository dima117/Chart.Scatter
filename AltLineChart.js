(function () {
	"use strict";

	var root = this,
		chartjs = root.Chart,
		helpers = Chart.helpers;

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

		initialize: function(datasets) {

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

		calculateRange: function() {

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

		initCalculator: function(ease, options) {

			var easingDecimal = ease || 1,
				range = this.calculateRange(),
				width = this.chart.width,
				height = this.chart.height;

			var api = {
				getElementOrDefault: function(array, index, defaultValue) {

					return index >= 0 && index < array.length
						? array[index]
						: defaultValue;
				},
				calculateDisplayPoint: function(prev, current, next, tension) {
					
					return {
						inner: { x: current.x - 5, y: current.y },
						outer: { x: current.x + 5, y: current.y }
					}
				}
			};

			return {
				calculateX: function(x) {

					return (x - range.xmin) * width / (range.xmax - range.xmin);
				},
				calculateY: function(y) {

					return height - ((y - range.ymin) * height / (range.ymax - range.ymin)) * easingDecimal;
				},

				calculatePointPositions: function(data) {

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

							var obj = api.calculateDisplayPoint(prev, current, next, options.bezierCurveTension);

							point.x1 = this.calculateX(obj.inner.x);
							point.y1 = this.calculateY(obj.inner.y);

							point.x2 = this.calculateX(obj.outer.x);
							point.y2 = this.calculateY(obj.outer.y);
						}

						result.push(point);
					}

					return result;
				},

				calculateControlPoints: function (prev, current, next, bezierCurveTension) {

					var tension = (!!prev && !!next) ? bezierCurveTension : 0;
					var innerPrev = prev || current;
					var innerNext = next || current;


					var a = { xx: current.x - innerPrev.x, yy: current.x - innerPrev.x }
					var b = { xx: innerNext.x - innerPrev.x, yy: innerNext.x - innerPrev.x }

					var mul = a.xx * b.xx + a.yy * b.yy;
					var mod = Math.sqrt(b.xx * b.xx + b.yy * b.yy);

					var k = mul / (mod * mod);

					var controlPoints = helpers.splineCurve(prev || current, current, next || current, tension);

					// Prevent the bezier going outside of the bounds of the graph

					// Cap puter bezier handles to the upper/lower scale bounds
					if (controlPoints.outer.y > range.ymax) {

						controlPoints.outer.y = range.ymax;
					} else {

						if (controlPoints.outer.y < range.ymin) {

							controlPoints.outer.y = range.ymin;
						}
					}

					// Cap inner bezier handles to the upper/lower scale bounds
					if (controlPoints.inner.y > range.ymax) {

						controlPoints.inner.y = range.ymax;
					} else {

						if (controlPoints.inner.y < range.ymin) {

							controlPoints.inner.y = range.ymin;
						}
					}

					return controlPoints;
				}
			};
		},

		// Used to draw something on the canvas
		draw: function (ease) {

			var calc = this.initCalculator(ease, this.options);

			this.clear();

			helpers.each(this.datasets, function (dataset) {

				ctx.lineWidth = 2;//this.options.datasetStrokeWidth;
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

			}, this);

		}
	});

}).call(window);
