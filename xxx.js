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





initCalculator: function (ease, options) {

	var easingDecimal = ease || 1,
		range = this._calculateRange(),
		width = this.chart.width,
		height = this.chart.height;

	var api = {
		trunc: function (x) {
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

		calculateXScaleParameters: function () {

			return api.calculateScaleParameters(range.xmin, range.xmax);
		},
		calculateYScaleParameters: function () {

			return api.calculateScaleParameters(range.ymin, range.ymax);
		}
	};
},