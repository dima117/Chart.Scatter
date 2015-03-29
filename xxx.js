			// axis
			ctx.strokeStyle = 'gray';
			ctx.fillStyle = 'gray';
			ctx.lineWidth = 0.3;

			var scaleX = calc.calculateXScaleParameters();
			for (var i = 0; i <= scaleX.length; i++) {

				var xValue = scaleX[i];
				var xpos1 = calc.calculateX(xValue);
				//ctx.beginPath();
				//ctx.moveTo(xpos1, 0);
				//ctx.lineTo(xpos1, this.chart.height);
				//ctx.stroke();

				ctx.textAlign = "center";
				ctx.textBaseline = "top";
				ctx.fillText(xValue, xpos1, 0);
			}

			var scaleY = calc.calculateXScaleParameters();
			for (var j = 0; j <= scaleY.length; j++) {

				var yValue = scaleY[j];
				var ypos1 = calc.calculateY(yValue);

				//ctx.beginPath();
				//ctx.moveTo(0, ypos1);
				//ctx.lineTo(this.chart.width, ypos1);
				//ctx.stroke();

				ctx.textAlign = "right";
				ctx.textBaseline = "middle";
				ctx.fillText(yValue, this.chart.width, ypos1);
			}





			helpers.longestText = function(ctx,font,arrayOfStrings){