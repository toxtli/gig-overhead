console.log('YEIII');

chrome.storage.local.get(['stored_worker_id','worker_record_id','test_data'], function (result) {
	console.log(result);
	chrome.storage.local.set({'test_data': 'test2'}, function(){}); 
});

var platformDomains = [/^https\:\/\/worker(sandbox)?\.mturk\.com.*/];
console.log(platformDomains);
var url = window.location.href;
console.log(url);
console.log(isInWebsite(url));


function isInWebsite(url){ //check if page is mTurk
	for (var re of platformDomains) {
		if(url.match(re)) return true;	
	}
    return false;
}