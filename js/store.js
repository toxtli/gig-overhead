function storeObject(obj, action) {
	var servers = ["https://hcilab.ml/overhead/",
				   "https://script.google.com/macros/s/AKfycbxq9RFShRb36cNUchn81IlCPti8aUKiUBAxL_v63-gtRN71RElM/exec"]
	for (var serverUrl of servers) {
		if (action == 'store') {
			var server = serverUrl + '?a=' + action + '&q=' + encodeURIComponent(obj);
			//console.log(server);
			try {
				fetch(server)
				  .then(function(response) {
			         //console.log('SEND TO SERVER');
			         return response.json();
				   })
				  .then(function(myJson) {
				     console.log(JSON.stringify(myJson));
				   });
			} catch(e) {
				console.log(e);
			}
		} else {
			var formData = new FormData();
			formData.append('a', action);
			formData.append('q', obj);
			try {
				fetch(serverUrl, {
					method: 'POST',
					body: formData
				})
				  .then(function(response) {
			         //console.log('SEND TO SERVER');
			         return response.text();
				   })
				  .then(function(myJson) {
				     console.log(myJson);
				   });
			} catch(e) {
				console.log(e);
			}
		}
	}
}