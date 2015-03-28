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





initCalculator: function (ease, options) {

	var easingDecimal = ease || 1,
		range = this._calculateRange(),
		width = this.chart.width,
		height = this.chart.height;

	var api = {

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
		calculateXScaleParameters: function () {

			return api.calculateScaleParameters(range.xmin, range.xmax);
		},
		calculateYScaleParameters: function () {

			return api.calculateScaleParameters(range.ymin, range.ymax);
		}
	};
},