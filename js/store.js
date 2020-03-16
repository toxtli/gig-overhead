function storeObject(obj, action) {
	var servers = ["http://18.188.193.237/overhead/",
				   "https://script.google.com/macros/s/AKfycbzTaan3V2v24Oo3Cz3jV1L679gQFXHjW4R0GWnP_PIb7jMnISTZ/exec"]
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
			         return response.json();
				   })
				  .then(function(myJson) {
				     console.log(JSON.stringify(myJson));
				   });
			} catch(e) {
				console.log(e);
			}
		}
	}
}