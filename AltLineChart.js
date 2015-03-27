(function () {
	"use strict";

	var chartjs = this,
		helpers = chartjs.helpers;

	var defaultConfig = {


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
		initialize: function () {

			// this.dataRange - минимальные и максимальные значения данных
			// this.display - нужно ли отображать шкалу

			// инициализируем настройки
			// рассчитываем вспомогательные параметры

			this.font = helpers.fontString(this.scaleFontSize, this.scaleFontStyle, this.scaleFontFamily);
		},

		update: function (newProps) {
			helpers.extend(this, newProps);
			this.fit();
		},

		fit: function () {

			this.api = {

				trunc: function (x) {
					return x < 0 ? Math.ceil(x) : Math.floor(x);
				},

				getElementOrDefault: function (array, index, defaultValue) {

					return index >= 0 && index < array.length
						? array[index]
						: defaultValue;
				}
			};

			// рассчитываем параметры отображения
		},

		updateBezierControlPoints: function (dataSetPoints, ease, tension) {

			for (var i = 0; i < dataSetPoints.length; i++) {

				var current = this.api.getElementOrDefault(data, i);
				var prev = this.api.getElementOrDefault(data, i - 1);
				var next = this.api.getElementOrDefault(data, i + 1);

				var obj = api.calculateControlPoints(prev, current, next, tension);

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

			return (x - this.dataRange.xmin) * this.chart.width / (this.dataRange.xmax - this.dataRange.xmin);
		},
		calculateY: function (y, ease) {

			return this.chart.height - ((y - this.dataRange.ymin) * this.chart.height / (this.dataRange.ymax - this.dataRange.ymin)) * (ease || 1);
		},

		draw: function () {

			//var ctx = this.chart.ctx,
			//	yLabelGap = (this.endPoint - this.startPoint) / this.steps,
			//	xStart = Math.round(this.xScalePaddingLeft);
			//if (this.display) {

			//}
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
				beginAtZero: this.options.scaleBeginAtZero
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

						prev = point;
					}
					else {

						ctx.lineTo(point.x, point.y);
					}
				}

			}, this);

			ctx.stroke();
		},

		// Used to draw something on the canvas
		draw: function (ease) {

			//var calc = this.initCalculator(ease, this.options);

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