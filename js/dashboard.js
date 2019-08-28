chrome.storage.local.get(['lapses'], (result)=>{
	var output = '';
	console.log(result);
	if (result.hasOwnProperty('lapses') && result.lapses.hasOwnProperty('overheads')) {
		var overheads = result.lapses.overheads;
		for (var platform in overheads) {
			if (platform != 'OTHER') {
				output += '<br>' + platform + '<br>';
				for (var activity in overheads[platform]) {
					var totalTime = 0;
					var headers = [];
					output += '<br>' + activity + '<br>';
					output += '<table border="1">';
					for (var event in overheads[platform][activity]) {
						var records = overheads[platform][activity][event];
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
					output += '</table>';;
				}
			}
		}
	} else {
		output += 'NO DATA FOUND';
	}
	document.getElementById('timeTable').innerHTML = output;
});