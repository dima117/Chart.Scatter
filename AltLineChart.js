(function () {
	"use strict";

	var chartjs = this,
		helpers = chartjs.helpers;

	var defaultConfig = {

		
		// LINES

		datasetStroke: true,			// Boolean - Whether to show a stroke for datasets
		datasetStrokeWidth: 2,			// Number - Pixel width of dataset stroke

		bezierCurve: true,				// Boolean - Whether the line is curved between points
		bezierCurveTension: 0.4,		// Number - Tension of the bezier curve between points



		// POINTS
		pointDot: true,					// Boolean - Whether to show a dot for each point
		pointDotStrokeWidth: 1,			// Number - Pixel width of point dot stroke
		pointDotRadius: 4,				// Number - Radius of each point dot in pixels
		pointHitDetectionRadius: 5,		// Number - amount extra to add to the radius to cater for hit detection outside the drawn point


		
		tooltipTemplate: "<%if (datasetLabel){%><%=datasetLabel%>: <%}%><%= value.y %>",
		
		x: 1
		
	};

	chartjs.Type.extend({
		name: "AltLineChart",
		defaults: defaultConfig,

		initialize: function (datasets) {

			//this.chart.ctx // The drawing context for this chart
			//this.chart.canvas // the canvas node for this chart

			this.AltPointClass = chartjs.Point.extend({
				radius: this.options.pointDotRadius,
				hitDetectionRadius: this.options.pointHitDetectionRadius,
				strokeWidth: this.options.pointDotStrokeWidth,
				display: this.options.pointDot,
				ctx: this.chart.ctx,
				view: null
			});

			this.datasets = [];

			//Iterate through each of the datasets, and build this into a property of the chart
			helpers.each(datasets, function (dataset) {

				var datasetObject = {
					label: dataset.label || null,
					strokeColor: dataset.strokeColor,
					points: []
				};

				this.datasets.push(datasetObject);
				
				helpers.each(dataset.data, function (dataPoint) {

					//Add a new point for each piece of data, passing any required data to draw.
					datasetObject.points.push(new this.AltPointClass({
						value: dataPoint,
						label: dataPoint.y,
						datasetLabel: dataset.label,
						strokeColor: 'white',
						fillColor: dataset.strokeColor,
						highlightStroke: dataset.strokeColor,
						highlightFill: 'white'
					}));
				}, this);

			}, this);

			//Set up tooltip events on the chart
			if (this.options.showTooltips) {

				helpers.bindEvents(this, this.options.tooltipEvents, function (evt) {

					var activePoints = (evt.type !== 'mouseout') ? this.getPointsAtEvent(evt) : [];

					helpers.each(this.datasets, function (dataset) {

						helpers.each(dataset.points, function (point) {

							point.restore(['fillColor', 'strokeColor']);
						});
					});

					helpers.each(activePoints, function (activePoint) {
						activePoint.fillColor = activePoint.highlightFill;
						activePoint.strokeColor = activePoint.highlightStroke;
					});

					this.showTooltip(activePoints);
				});
			}

			this.render();
		},

		// helpers
		getPointsAtEvent: function (e) {
			var pointsArray = [],
				eventPosition = helpers.getRelativePosition(e);
			helpers.each(this.datasets, function (dataset) {
				helpers.each(dataset.points, function (point) {
					if (point.inRange(eventPosition.x, eventPosition.y)) pointsArray.push(point);
				});
			}, this);
			return pointsArray;
		},

		showTooltip: function(elements) {

			this.draw();

			if (elements.length > 0) {

				helpers.each(elements, function (element) {

					var tooltipPosition = element.tooltipPosition();

					new chartjs.Tooltip({
						x: Math.round(tooltipPosition.x),
						y: Math.round(tooltipPosition.y),
						xPadding: this.options.tooltipXPadding,
						yPadding: this.options.tooltipYPadding,
						fillColor: this.options.tooltipFillColor,
						textColor: this.options.tooltipFontColor,
						fontFamily: this.options.tooltipFontFamily,
						fontStyle: this.options.tooltipFontStyle,
						fontSize: this.options.tooltipFontSize,
						caretHeight: this.options.tooltipCaretSize,
						cornerRadius: this.options.tooltipCornerRadius,
						text: helpers.template(this.options.tooltipTemplate, element),
						chart: this.chart,
						custom: this.options.customTooltips
					}).draw();
				}, this);
	
			}
			return this;
		},

		calculateRange: function () {

			var xmin = undefined,
				xmax = undefined,
				ymin = undefined,
				ymax = undefined;

			helpers.each(this.datasets, function(dataset) {

				helpers.each(dataset.points, function (point) {

					var value = point.value;

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
				});
			});

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
				trunc: function(x) {
					return x < 0 ? Math.ceil(x) : Math.floor(x);
				},
				getElementOrDefault: function (array, index, defaultValue) {

					return index >= 0 && index < array.length
						? array[index]
						: defaultValue;
				},
				calculateControlPoints: function (prev, current, next, tension) {

					var tensionBefore = !!prev ? tension : 0;
					var tensionAfter = !!next ? tension : 0;

					var innerCurrent = current.value;
					var innerPrev = prev ? prev.value : current.value;
					var innerNext = next ? next.value : current.value;

					var a = { xx: innerCurrent.x - innerPrev.x, yy: innerCurrent.y - innerPrev.y }
					var b = { xx: innerNext.x - innerPrev.x, yy: innerNext.y - innerPrev.y }

					var mul = a.xx * b.xx + a.yy * b.yy;
					var mod = Math.sqrt(b.xx * b.xx + b.yy * b.yy);

					var k = Math.min(Math.max(mul / (mod * mod), 0.3), 0.7);

					var result = {
						before: { x: innerCurrent.x - b.xx * k * tensionBefore, y: innerCurrent.y - b.yy * k * tensionBefore },
						after: { x: innerCurrent.x + b.xx * (1 - k) * tensionAfter, y: innerCurrent.y + b.yy * (1 - k) * tensionAfter }
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

					var range = max - min;
					var step = 0.0000001;
					while (range / step > 20) {

						step *= 10;
					}

					var pos = (api.trunc(min / step) + 1) * step;
					var end = api.trunc(max / step) * step;

					var a = [];
					while (pos <= end) {

						a.push(pos);
						pos += step;
					}

					return a;
				}
			};

			return {
				calculateX: function (x) {

					return (x - range.xmin) * width / (range.xmax - range.xmin);
				},
				calculateY: function (y) {

					return height - ((y - range.ymin) * height / (range.ymax - range.ymin)) * easingDecimal;
				},

				updatePointPositions: function (data) {

					for (var i = 0; i < data.length; i++) {

						var current = api.getElementOrDefault(data, i);

						current.x = this.calculateX(current.value.x);
						current.y = this.calculateY(current.value.y);

						if (options.bezierCurve) {

							var view = {};

							var prev = api.getElementOrDefault(data, i - 1);
							var next = api.getElementOrDefault(data, i + 1);

							var obj = api.calculateControlPoints(prev, current, next, options.bezierCurveTension);

							view.x1 = this.calculateX(obj.before.x);
							view.y1 = this.calculateY(obj.before.y);

							view.x2 = this.calculateX(obj.after.x);
							view.y2 = this.calculateY(obj.after.y);

							current.view = view;
						}
					}
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
			ctx.strokeStyle = 'gray';
			ctx.fillStyle = 'gray';
			ctx.lineWidth = 0.3;

			var scaleX = calc.calculateXScaleParameters();
			for (var i = 0; i <= scaleX.length; i++) {

				var xValue = scaleX[i];
				var xpos1 = calc.calculateX(xValue);
				ctx.beginPath();
				ctx.moveTo(xpos1, 0);
				ctx.lineTo(xpos1, this.chart.height);
				ctx.stroke();

				ctx.textAlign = "center";
				ctx.textBaseline = "top";
				ctx.fillText(xValue, xpos1, 0);
			}

			var scaleY = calc.calculateXScaleParameters();
			for (var j = 0; j <= scaleY.length; j++) {

				var yValue = scaleY[j];
				var ypos1 = calc.calculateY(yValue);

				ctx.beginPath();
				ctx.moveTo(0, ypos1);
				ctx.lineTo(this.chart.width, ypos1);
				ctx.stroke();

				ctx.textAlign = "right";
				ctx.textBaseline = "middle";
				ctx.fillText(yValue, this.chart.width, ypos1);
			}


			helpers.each(this.datasets, function (dataset) {

				// update points view params
				calc.updatePointPositions(dataset.points);

				ctx.lineWidth = this.options.datasetStrokeWidth;
				ctx.strokeStyle = dataset.strokeColor;
				ctx.beginPath();

				var prev = dataset.points[0];

				helpers.each(dataset.points, function (point, index) {

					if (index === 0) {

						ctx.moveTo(point.x, point.y);
					}
					else {

						if (this.options.bezierCurve) {

							ctx.bezierCurveTo(prev.view.x2, prev.view.y2, point.view.x1, point.view.y1, point.x, point.y);
							prev = point;
						}
						else {

							ctx.lineTo(point.x, point.y);
						}
					}

				}, this);

				ctx.stroke();

				// debug
				//ctx.lineWidth = 0.3;

				//if (this.options.bezierCurve) {

				//	helpers.each(dataset.points, function (point) {

				//		ctx.beginPath();
				//		ctx.moveTo(point.view.x1, point.view.y1);
				//		ctx.lineTo(point.view.x2, point.view.y2);
				//		ctx.stroke();
				//	});
				//}

				// draw points
				helpers.each(dataset.points, function (point) {
					point.draw();
				});

			}, this);

		}
	});

}).call(window.Chart);