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

		initialize: function (datasets) {

			//this.chart.ctx // The drawing context for this chart
			//this.chart.canvas // the canvas node for this chart

			this.datasets = datasets;

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

		// Used to draw something on the canvas
		draw: function (ease) {

			var easingDecimal = ease || 1;
			this.clear();

			helpers.each(this.datasets, function (dataset) {

				ctx.lineWidth = 2;//this.options.datasetStrokeWidth;
				ctx.strokeStyle = dataset.strokeColor;
				ctx.beginPath();

				helpers.each(dataset.data, function (point, index) {

					if (index === 0) {
						ctx.moveTo(point.x, point.y * easingDecimal);
					}
					else {
						ctx.lineTo(point.x, point.y * easingDecimal);
					}

				}, this);

				ctx.stroke();

			}, this);

		}
	});

}).call(window);