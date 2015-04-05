(function () {
	"use strict";

	var chartjs = this,
		helpers = chartjs.helpers;


	chartjs.types.FnLine.extend({
		// Passing in a name registers this chart in the Chart namespace in the same way
		name: "DateFnLine"
		//,		initialize: function (data) {
		//	console.log('My Line chart extension');
		//	Chart.types.Line.prototype.initialize.apply(this, arguments);
		//}
	});


}).call(window.Chart);