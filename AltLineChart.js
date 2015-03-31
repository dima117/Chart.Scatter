(function () {
	"use strict";

	var chartjs = this,
		helpers = chartjs.helpers;

	var defaultConfig = {

		// INHERIT
		// showScale: true,						// Boolean - If we should show the scale at all
		// scaleOverride: false,				// Boolean - If we want to override with a hard coded scale
		// ** Required if scaleOverride is true **
		// *** scaleSteps: null,				// Number - The number of steps in a hard coded scale
		// *** scaleStepWidth: null,			// Number - The value jump in the hard coded scale
		// *** scaleStartValue: null,			// Number - The scale starting value

		// scaleLineColor: "rgba(0,0,0,.1)",		// String - Colour of the scale line
		// scaleLineWidth: 1,						// Number - Pixel width of the scale line
		// scaleShowLabels: true,					// Boolean - Whether to show labels on the scale
		// scaleLabel: "<%=value%>",				// Interpolated JS string - can access value
		scaleArgLabel: "<%=value%>",				// Interpolated JS string - can access value


		// SCALE
		scaleShowGridLines: true,				//Boolean - Whether grid lines are shown across the chart
		scaleGridLineWidth: 1,					//Number - Width of the grid lines
		scaleGridLineColor: "rgba(0,0,0,.05)",	//String - Colour of the grid lines
		scaleShowHorizontalLines: true,			//Boolean - Whether to show horizontal lines (except X axis)
		scaleShowVerticalLines: true,			//Boolean - Whether to show vertical lines (except Y axis)



		// LINES
		datasetStroke: true,			// Boolean - Whether to show a stroke for datasets
		datasetStrokeWidth: 2,			// Number - Pixel width of dataset stroke
		datasetStrokeColor: '#007ACC',	// String - Color of dataset stroke

		bezierCurve: true,				// Boolean - Whether the line is curved between points
		bezierCurveTension: 0.4,		// Number - Tension of the bezier curve between points



		// POINTS
		pointDot: true,					// Boolean - Whether to show a dot for each point
		pointDotStrokeWidth: 1,			// Number - Pixel width of point dot stroke
		pointDotRadius: 4,				// Number - Radius of each point dot in pixels
		pointHitDetectionRadius: 4,		// Number - amount extra to add to the radius to cater for hit detection outside the drawn point


		multiTooltipTemplate: "<%= label %>",
		tooltipTemplate: "<%if (datasetLabel){%><%=datasetLabel%>: <%}%><%= value.y %>"
	};

	chartjs.AltScale = chartjs.Element.extend({

		padding: 10,

		initialize: function () {

			// this.dataRange - минимальные и максимальные значения данных

			// инициализируем настройки
			// рассчитываем вспомогательные параметры

			this.font = helpers.fontString(this.scaleFontSize, this.scaleFontStyle, this.scaleFontFamily);
		},

		api: {

			getElementOrDefault: function (array, index, defaultValue) {

				return index >= 0 && index < array.length
					? array[index]
					: defaultValue;
			},

			applyRange: function (value, min, max) {

				return value > max ? max
					: value < min ? min
					: value;
			},

			calculateControlPoints: function (prev, current, next, range, tension) {

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
					before: {
						x: innerCurrent.x - b.xx * k * tensionBefore,
						y: innerCurrent.y - b.yy * k * tensionBefore
					},
					after: {
						x: innerCurrent.x + b.xx * (1 - k) * tensionAfter,
						y: innerCurrent.y + b.yy * (1 - k) * tensionAfter
					}
				};

				// Cap inner bezier handles to the upper/lower scale bounds
				result.before.y = this.applyRange(result.before.y, range.ymin, range.ymax);
				result.after.y = this.applyRange(result.after.y, range.ymin, range.ymax);

				return result;
			}
		},

		fit: function () {

			// рассчитываем параметры отображения
			this.xScaleRange = helpers.calculateScaleRange(
				[this.dataRange.xmin, this.dataRange.xmax],
				this.chart.width,
				this.fontSize,
				this.beginAtZero,
				this.integersOnly);

			this.xLabels = helpers.generateLabels(
				this.argLabelTemplate,
				this.xScaleRange.steps,
				this.xScaleRange.min,
				this.xScaleRange.stepValue);

			this.yPadding = this.showLabels
				? this.fontSize * 1.25 + this.padding
				: 0;


			this.yScaleRange = helpers.calculateScaleRange(
				[this.dataRange.ymin, this.dataRange.ymax],
				this.chart.height,
				this.fontSize,
				this.beginAtZero,
				this.integersOnly);

			this.yLabels = helpers.generateLabels(
				this.labelTemplate,
				this.yScaleRange.steps,
				this.yScaleRange.min,
				this.yScaleRange.stepValue);

			this.xPadding = this.showLabels
				? helpers.longestText(this.chart.ctx, this.font, this.yLabels) + this.padding : 0;
		},

		updateBezierControlPoints: function (dataSetPoints, ease, tension) {

			for (var i = 0; i < dataSetPoints.length; i++) {

				var current = this.api.getElementOrDefault(dataSetPoints, i);
				var prev = this.api.getElementOrDefault(dataSetPoints, i - 1);
				var next = this.api.getElementOrDefault(dataSetPoints, i + 1);

				var obj = this.api.calculateControlPoints(prev, current, next, this.dataRange, tension);

				current.controlPoints = {

					x1: this.calculateX(obj.before.x),
					y1: this.calculateY(obj.before.y, ease),

					x2: this.calculateX(obj.after.x),
					y2: this.calculateY(obj.after.y, ease)
				};
			}
		},

		updatePoints: function (dataSetPoints, ease) {

			for (var i = 0; i < dataSetPoints.length; i++) {

				var current = dataSetPoints[i];

				current.x = this.calculateX(current.value.x);
				current.y = this.calculateY(current.value.y, ease);
			}
		},

		calculateX: function (x) {

			return this.xPadding + ((x - this.xScaleRange.min) * (this.chart.width - this.xPadding) / (this.xScaleRange.max - this.xScaleRange.min));
		},
		calculateY: function (y, ease) {

			return this.chart.height - this.yPadding - ((y - this.yScaleRange.min) * (this.chart.height - this.yPadding) / (this.yScaleRange.max - this.yScaleRange.min)) * (ease || 1);
		},

		draw: function () {

			var ctx = this.chart.ctx, value, index;

			if (this.display) {

				var xpos1 = this.calculateX(this.xScaleRange.min);
				var xpos2 = this.calculateX(this.xScaleRange.max);
				var ypos1 = this.calculateY(this.yScaleRange.min);
				var ypos2 = this.calculateY(this.yScaleRange.max);

				// y axis
				for (index = 0, value = this.yScaleRange.min;
					 index < this.yScaleRange.steps;
					 index++, value += this.yScaleRange.stepValue) {

					var ypos = this.calculateY(value);

					if (this.showHorizontalLines) {

						ctx.lineWidth = this.gridLineWidth;
						ctx.strokeStyle = this.gridLineColor;

						ctx.beginPath();
						ctx.moveTo(xpos1, ypos);
						ctx.lineTo(xpos2, ypos);
						ctx.stroke();
					}

					// labels
					if (this.showLabels) {

						ctx.lineWidth = this.lineWidth;
						ctx.strokeStyle = this.lineColor;

						// черточки
						ctx.beginPath();
						ctx.moveTo(xpos1, ypos);
						ctx.lineTo(xpos1 - 5, ypos);
						ctx.stroke();

						// text
						ctx.fillStyle = this.textColor;
						ctx.font = this.font;
						ctx.textAlign = "right";
						ctx.textBaseline = "middle";
						ctx.fillText(this.yLabels[index], xpos1 - 7, ypos);
					}
				}

				// x axis
				for (index = 0, value = this.xScaleRange.min;
					 index < this.xScaleRange.steps;
					 index++, value += this.xScaleRange.stepValue) {

					var xpos = this.calculateX(value);

					if (this.showVerticalLines) {

						ctx.lineWidth = this.gridLineWidth;
						ctx.strokeStyle = this.gridLineColor;

						ctx.beginPath();
						ctx.moveTo(xpos, ypos1);
						ctx.lineTo(xpos, ypos2);
						ctx.stroke();
					}

					// labels
					if (this.showLabels) {

						ctx.lineWidth = this.lineWidth;
						ctx.strokeStyle = this.lineColor;

						// черточки
						ctx.beginPath();
						ctx.moveTo(xpos, ypos1);
						ctx.lineTo(xpos, ypos1 + 5);
						ctx.stroke();

						// text
						ctx.fillStyle = this.textColor;
						ctx.font = this.font;
						ctx.textAlign = "center";
						ctx.textBaseline = "top";
						ctx.fillText(this.xLabels[index], xpos, ypos1 + 7);
					}
				}
				
				// axis
				ctx.lineWidth = this.lineWidth;
				ctx.strokeStyle = this.lineColor;

				ctx.beginPath();
				ctx.moveTo(xpos1, 0);
				ctx.lineTo(xpos1, ypos1);
				ctx.stroke();

				ctx.beginPath();
				ctx.moveTo(xpos1, ypos1);
				ctx.lineTo(xpos2, ypos1);
				ctx.stroke();
			}
		}
	});

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
				ctx: this.chart.ctx
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

			this.buildScale();

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

		buildScale: function () {

			var dataRange = this._calculateRange();

			var scaleOptions = {
				dataRange: dataRange,
				chart: this.chart,

				textColor: this.options.scaleFontColor,
				fontSize: this.options.scaleFontSize,
				fontStyle: this.options.scaleFontStyle,
				fontFamily: this.options.scaleFontFamily,

				labelTemplate: this.options.scaleLabel,
				argLabelTemplate: this.options.scaleArgLabel,
				showLabels: this.options.scaleShowLabels,
				beginAtZero : this.options.scaleBeginAtZero,
				integersOnly : this.options.scaleIntegersOnly,

				gridLineWidth: (this.options.scaleShowGridLines) ? this.options.scaleGridLineWidth : 0,
				gridLineColor: (this.options.scaleShowGridLines) ? this.options.scaleGridLineColor : "rgba(0,0,0,0)",
				showHorizontalLines: this.options.scaleShowHorizontalLines,
				showVerticalLines: this.options.scaleShowVerticalLines,
				lineWidth: this.options.scaleLineWidth,
				lineColor: this.options.scaleLineColor,
				display: this.options.showScale
			};

			this.scale = new chartjs.AltScale(scaleOptions);
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

		showTooltip: function (elements) {

			this.draw();

			if (elements.length > 0) {

				var firstElement = elements[0];
				var tooltipPosition = firstElement.tooltipPosition();

				if (elements.length == 1) {



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
						text: helpers.template(this.options.tooltipTemplate, firstElement),
						chart: this.chart,
						custom: this.options.customTooltips
					}).draw();
				} else {

					var tooltipLabels = [],
						tooltipColors = [];

					helpers.each(elements, function (point) {

						tooltipLabels.push(helpers.template(this.options.multiTooltipTemplate, point));

						tooltipColors.push({
							fill: point._saved.fillColor || point.fillColor,
							stroke: point._saved.strokeColor || point.strokeColor
						});

					}, this);

					new Chart.MultiTooltip({
						x: Math.round(tooltipPosition.x),
						y: Math.round(tooltipPosition.y),
						xPadding: this.options.tooltipXPadding,
						yPadding: this.options.tooltipYPadding,
						xOffset: this.options.tooltipXOffset,
						fillColor: this.options.tooltipFillColor,
						textColor: this.options.tooltipFontColor,
						fontFamily: this.options.tooltipFontFamily,
						fontStyle: this.options.tooltipFontStyle,
						fontSize: this.options.tooltipFontSize,
						titleTextColor: this.options.tooltipTitleFontColor,
						titleFontFamily: this.options.tooltipTitleFontFamily,
						titleFontStyle: this.options.tooltipTitleFontStyle,
						titleFontSize: this.options.tooltipTitleFontSize,
						cornerRadius: this.options.tooltipCornerRadius,
						labels: tooltipLabels,
						legendColors: tooltipColors,
						legendColorBackground: this.options.multiTooltipKeyBackground,
						title: '',
						chart: this.chart,
						ctx: this.chart.ctx,
						custom: this.options.customTooltips
					}).draw();
				}
			}
			return this;
		},

		_forEachPoint: function (callback) {

			helpers.each(this.datasets, function (dataset) {

				helpers.each(dataset.points, callback, this);
			}, this);
		},

		_forEachDataset: function (callback) {

			helpers.each(this.datasets, callback, this);
		},

		_calculateRange: function () {

			var xmin = undefined,
				xmax = undefined,
				ymin = undefined,
				ymax = undefined;

			this._forEachPoint(function (point) {

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

			return {
				xmin: xmin,
				xmax: xmax,
				ymin: ymin,
				ymax: ymax
			}
		},

		_drawLine: function (dataset) {

			var ctx = this.chart.ctx,
				prev = undefined;

			ctx.lineJoin = "round";
			ctx.lineWidth = this.options.datasetStrokeWidth;
			ctx.strokeStyle = dataset.strokeColor || this.options.datasetStrokeColor;

			ctx.beginPath();

			helpers.each(dataset.points, function (point, index) {

				if (index === 0) {

					ctx.moveTo(point.x, point.y);
				}
				else {

					if (this.options.bezierCurve) {

						ctx.bezierCurveTo(
							prev.controlPoints.x2,
							prev.controlPoints.y2,
							point.controlPoints.x1,
							point.controlPoints.y1,
							point.x, point.y);
					}
					else {

						ctx.lineTo(point.x, point.y);
					}
				}

				prev = point;

			}, this);

			ctx.stroke();

			// debug
			//if (this.options.bezierCurve) {

			//	ctx.lineWidth = 0.3;

			//	helpers.each(dataset.points, function(point) {

			//		ctx.beginPath();
			//		ctx.moveTo(point.controlPoints.x1, point.controlPoints.y1);
			//		ctx.lineTo(point.x, point.y);
			//		ctx.lineTo(point.controlPoints.x2, point.controlPoints.y2);
			//		ctx.stroke();
			//	});
			//}
		},

		// Used to draw something on the canvas
		draw: function (ease) {

			// update view params
			this.scale.fit();

			this._forEachDataset(function (dataset) {

				this.scale.updatePoints(dataset.points, ease);

				if (this.options.bezierCurve) {

					this.scale.updateBezierControlPoints(dataset.points, ease, this.options.bezierCurveTension);
				}
			});

			// draw
			this.clear();
			this.scale.draw();

			// draw lines
			if (this.options.datasetStroke) {

				helpers.each(this.datasets, this._drawLine, this);
			}

			// draw points
			if (this.options.pointDot) {

				this._forEachPoint(function (point) { point.draw(); });
			}
		}
	});

}).call(window.Chart);