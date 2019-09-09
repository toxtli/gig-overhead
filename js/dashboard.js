var automaticRefresh = true;
var resetExtension = false;

function init() {
	showWages();
	showLapses();
}

function resetData() {
	chrome.storage.local.set({
		lapses:{},
		overheads:{},
		working:{},
		wages:{}
	}, ()=>{});
	document.getElementById('wageTable').innerHTML = '';
	document.getElementById('timeTable').innerHTML = '';
}

function clone(obj) {
	return JSON.parse(JSON.stringify(obj));
}

function toDateTimeString(timestamp) {
	var datetime = (new Date(timestamp)).toISOString().split('T').join(' ').split('.')[0];
	return datetime;
}

function showWages() {
	chrome.storage.local.get(['wages', 'lapses'], (result)=>{
		// document.getElementById('wageTable').innerHTML += JSON.stringify(wages);
		if (result.hasOwnProperty('wages') && result.hasOwnProperty('lapses')) {
			var wages = result.wages;
			var lapses = result.lapses;
			var output = '';
			for (var platform in wages) {
				var buckets = {};
				output += '<br>' + platform + '<br>';
				for (var state in lapses) {
					if (lapses[state].hasOwnProperty(platform)) {
						for (var activity in lapses[state][platform]) {
							for (var event in lapses[state][platform][activity]) {
								var fromIndex = 0;
								var lapseObjs = lapses[state][platform][activity][event];
								for (var lapseObj of lapseObjs) {
									for (var i = fromIndex; i < wages[platform].records.length; i++) {
										if ((lapseObj.init >= wages[platform].records[i].init.time &&
											lapseObj.init <= wages[platform].records[i].end.time)) {
											if (!buckets.hasOwnProperty(i))
												buckets[i] = [];
											var obj = {
												state: state,
												event: event,
												activity: activity,
												init: lapseObj.init
											};
											if (lapseObj.end <= wages[platform].records[i].end.time) {
												obj.end = lapseObj.end;
												obj.diff = lapseObj.diff;
												buckets[i].push(obj);
											} else {
												obj.end = wages[platform].records[i].end.time;
												obj.diff = parseFloat(wages[platform].records[i].end.time) - parseFloat(lapseObj.init);
												buckets[i].push(clone(obj));
												if ((i + 1) < wages[platform].records.length) {
													if (!buckets.hasOwnProperty(i + 1))
														buckets[i + 1] = [];
													obj.init = wages[platform].records[i].end.time;
													obj.end = lapseObj.end;
													obj.diff = parseFloat(lapseObj.end) - parseFloat(wages[platform].records[i].end.time);
													buckets[i + 1].push(obj);	
												}
											}
											fromIndex = i;
											break;
										}
									}
								}
							}
						}
					}
				}
				output += '<table border="1">';
				//console.log(buckets);
				var sumTotals = {};
				var valFinal = 0;
				var earnings = 0;
				for (var i in buckets) {
					wage = wages[platform].records[i];
					earnings += wage.diff.value;
					output += '<tr><td colspan="4">';
					output += ' Earnings: <span class="tableValue">$ ' + wage.diff.value.toFixed(2) + '</span>';
					output += ' From: <span class="tableValue">' + toDateTimeString(wage.init.time) + '</span>';
					output += ' To: <span class="tableValue">' + toDateTimeString(wage.end.time) + '</span>';
					output += '</td></tr>';
					var sumVals = {};
					var valTotal = 0;
					for (var bucket of buckets[i]) {
						if (!sumTotals.hasOwnProperty(bucket.activity))
							sumTotals[bucket.activity] = 0;
						if (!sumVals.hasOwnProperty(bucket.activity))
							sumVals[bucket.activity] = 0;
						sumVals[bucket.activity] += bucket.diff;
						sumTotals[bucket.activity] += bucket.diff;
						valTotal += bucket.diff;
						valFinal += bucket.diff;
					}
					for (var activity in sumVals) {
						output += '<tr>';
						output += '<td>' + activity + '</td>';
						output += '<td>' + sumVals[activity] + '</td>';
						var perValue = (sumVals[activity] / valTotal);
						output += '<td>' + (perValue * 100).toFixed(2) + '%</td>';
						output += '<td>$' + (perValue * wage.diff.value).toFixed(3) + '</td>';
						output += '</tr>';
					}
				}
				output += '</table>';
				output += '<br> TOTAL <br>';
				output += '<table border="1">';
				output += '<tr><td colspan="4">';
				output += ' Total earnings: <span class="tableValue">$ ' + earnings.toFixed(2) + '</span>';
				output += '</td></tr>';
				for (var activity in sumTotals) {
					output += '<tr>';
					output += '<td>' + activity + '</td>';
					output += '<td>' + sumTotals[activity] + '</td>';
					var perValue = (sumTotals[activity] / valFinal);
					output += '<td>' + (perValue * 100).toFixed(2) + '%</td>';
					output += '<td>$' + (perValue * earnings).toFixed(3) + '</td>';
					output += '</tr>';
				}
				output += '</table>';
			}
			document.getElementById('wageTable').innerHTML = output;
		}
	});
}

function showLapses() {
	chrome.storage.local.get(['lapses'], (result)=>{
		var count = 0;
		var output = '';
		var totals = {};
		//console.log(result);
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
		//console.log(table.id);
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
			animationEnabled: false,
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
document.getElementById('resetButton').addEventListener('click', () => resetData())

if (automaticRefresh)
	setInterval(init, 2000);

if (resetExtension)
	resetData()