function init() {
	chrome.storage.local.get(['lapses'], (result)=>{
		var count = 0;
		var output = '';
		var totals = {};
		console.log(result);
		if (result.hasOwnProperty('lapses')) {
			output += '<div id="piechart" class="plot"></div>';
			for (var state in result.lapses) {
				output += '<br>' + state + '<br>';
				var stateObj = result.lapses[state];
				for (var platform in stateObj) {
					if (platform != 'OTHER') {
						output += '<br>' + platform + '<br>';
						for (var activity in stateObj[platform]) {
							var totalTime = 0;
							var headers = [];
							output += '<br>' + activity + '<br>';
							output += '<table id="table' + count++ + '" class="dynTable" border="1">';
							for (var event in stateObj[platform][activity]) {
								var records = stateObj[platform][activity][event];
								if (headers.length == 0) {
									output += '<thead><tr><th>type</th>';
									headers = Object.keys(records[0]);
									for (var header in records[0]) {
										output += '<th>' + header + '</th>';
									}
									output += '</tr></thead><tbody>';
								}
								for (var index in records) {
									output += '<tr><td>' + event + '</td>';
									for (var header in records[index]) {
										var value = records[index][header];
										if (header == 'diff') {
											var seconds = value/(1000);
											totalTime += seconds;
											if (!totals.hasOwnProperty(activity))
												totals[activity] = 0;
											totals[activity] += seconds;
											output += '<td>' + seconds + '</td>';
										} else {
											output += '<td>' + (new Date(value)).toLocaleString() + '</td>';
										}
									}
									output += '</tr>';
								}
							}
							output += '</tbody>';
							output += '<tfoot><tr><td colspan="' +  (headers.length + 1) + '">' + totalTime + '</td></tr></tfoot>';
							output += '</table>';
						}
					}
				}
			}
		} else {
			output += 'NO DATA FOUND';
		}
		document.getElementById('timeTable').innerHTML = output;
		styleTables();
		plotResults(totals);
	});
}

function styleTables() {
	var tables = document.querySelectorAll(".dynTable")
	for (var table of tables) {
		console.log(table.id);
		var table = new Tabulator('#' + table.id);
	}
}

function plotResults(totals) {
	if (Object.keys(totals).length > 0) {
		var dataPoints = [];
		for (var label in totals) {
			dataPoints.push({
				label: label,
				y: totals[label]
			});
		}
		var chart = new CanvasJS.Chart("piechart", {
			animationEnabled: true,
			data: [{
				type: "pie",
				toolTipContent: "<b>{label}</b> {y} (#percent%)",
				indexLabel: "{label} - #percent%",
				dataPoints: dataPoints
			}]
		});
		chart.render();
	}
}

window.addEventListener('load', () => init());
window.addEventListener('focus', () => init());