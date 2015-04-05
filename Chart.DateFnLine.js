(function () {
	"use strict";

	var chartjs = this,
		helpers = chartjs.helpers;

	chartjs.DateFnScale = chartjs.FnScale.extend({
		
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