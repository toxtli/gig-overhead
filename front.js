console.log('YEIII');

chrome.storage.local.get(['stored_worker_id','worker_record_id','test_data'], function (result) {
	console.log(result);
	chrome.storage.local.set({'test_data': 'test2'}, function(){}); 
});

var platformDomains = [/^https\:\/\/worker(sandbox)?\.mturk\.com.*/];
console.log(platformDomains);
var globalUrl = window.location.href;
console.log(globalUrl);
console.log('isInWebsite');
console.log(isInWebsite(globalUrl));

function loadConfiguration(configFile) {
  return new Promise((resolve, reject) => {
    fetch(chrome.extension.getURL(configFile)).then(r => r.json())
    .then(platforms => {
      platforms.forEach(platform => {
        fetch(chrome.extension.getURL(platform)).then(r => r.json())
        .then(platformData => {
          platformData.urls.forEach(urlObj => {
            var hostname = (new URL(urlObj.url)).hostname;
            if (!platformsData.hasOwnProperty(hostname)) {
              platformsData[hostname] = [];
            }
            urlObj.platform = platformData.name;
            platformsData[hostname].push(urlObj);
          });
          platformCount++;
          if (platformCount == platforms.length) {
            resolve(platformsData);
          }
        });
      });
    });
  });
}

function isInWebsite(url){ //check if page is mTurk
  for (var re of platformDomains) {
    if(url.match(re)) return true;  
  }
    return false;
}

var configFile = 'platforms/index.json';
var platformsData = {};
var platformCount = 0;
loadConfiguration(configFile).then(configData => {
  console.log('Loading complete');
  var hostname = (new URL(globalUrl)).hostname;
  console.log(hostname);
  Object.keys(configData).forEach(key => {
    if (key == hostname) {
      console.log('Hostname found');
      console.log(configData[key]);
    }
  })
});


