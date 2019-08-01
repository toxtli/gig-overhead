function storeObject(obj) {
	var server = 'https://script.google.com/macros/s/AKfycbzTaan3V2v24Oo3Cz3jV1L679gQFXHjW4R0GWnP_PIb7jMnISTZ/exec?q=' + encodeURI(obj);
	//console.log(server);
	fetch(server)
	  .then(function(response) {
         //console.log('SEND TO SERVER');
         return response.json();
	   })
	  .then(function(myJson) {
	     //console.log(JSON.stringify(myJson));
	   });
}