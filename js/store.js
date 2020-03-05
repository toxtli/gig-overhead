function storeObject(obj) {
	//var serverUrl = 'https://script.google.com/macros/s/AKfycbzTaan3V2v24Oo3Cz3jV1L679gQFXHjW4R0GWnP_PIb7jMnISTZ/exec'	 
	var servers = ['https://gig-overhead.herokuapp.com/',
				   'https://script.google.com/macros/s/AKfycbzTaan3V2v24Oo3Cz3jV1L679gQFXHjW4R0GWnP_PIb7jMnISTZ/exec'];
	for (var serverUrl of servers) {
		var server = serverUrl + '?q=' + encodeURIComponent(obj);
		//console.log(server);
		fetch(server)
		  .then(function(response) {
	         //console.log('SEND TO SERVER');
	         return response.json();
		   })
		  .then(function(myJson) {
		     console.log(JSON.stringify(myJson));
		   });
	}
}