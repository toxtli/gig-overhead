chrome.storage.local.get(['lapses'], (result)=>{
	document.getElementById('timeTable').innerHTML = JSON.stringify(result);
});