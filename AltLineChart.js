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
				xmin : xmin, 
				xmax : xmax, 
				ymin: ymin, 
				ymax: ymax
			}
		},

		initCalculator: function (ease) {

			var easingDecimal = ease || 1,
				range = this.calculateRange(),
				width = this.chart.width,
				height = this.chart.height;

			return {
				calculateX : function(x) {

					return (x - range.xmin) * width / (range.xmax - range.xmin);
				},
				calculateY : function(y) {
					
					return height - ((y - range.ymin) * height / (range.ymax - range.ymin)) * easingDecimal;
				}
			};
		},

		// Used to draw something on the canvas
		draw: function (ease) {



			var calc = this.initCalculator(ease);

			this.clear();

			helpers.each(this.datasets, function (dataset) {

				ctx.lineWidth = 2;//this.options.datasetStrokeWidth;
				ctx.strokeStyle = dataset.strokeColor;
				ctx.beginPath();

				helpers.each(dataset.data, function (point, index) {

					var xpos = calc.calculateX(point.x);
					var ypos = calc.calculateY(point.y);

					if (index === 0) {
						ctx.moveTo(xpos, ypos);
					}
					else {
						ctx.lineTo(xpos, ypos);
					}

				}, this);

				ctx.stroke();

			}, this);

		}
	});

}).call(window);