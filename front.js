console.log('YEIII');

chrome.storage.local.get(['stored_worker_id','worker_record_id','test_data'], function (result) {
	console.log(result);
	chrome.storage.local.set({'test_data': 'test2'}, function(){}); 
});

var defaultSite = {
  "url": "",
  "type": "OTHER",        
  "subtype": "OTHER",
  "platform": "OTHER",
  "time": null
}

var globalUrl = window.location.href;
console.log(globalUrl);

RegExp.escape = function(string) {
  return string.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')
};

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

function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function urlToRegex(url) {
  url = url.replace(/\(\.\*\)/g, "___");
  url = RegExp.escape(url);
  url = url.replace(/___/g, "(.*)") + '$';
  return new RegExp(url);
}

function logSite(obj) {
  chrome.storage.local.get(['working_status','user_id'], (result) => {
    obj.current = globalUrl;
    obj.time = (new Date()).getTime();
    obj.status = result['working_status'];
    obj.user = result['user_id'];
    console.log(obj);
  });
}

var configFile = 'platforms/index.json';
var platformsData = {};
var platformCount = 0;
loadConfiguration(configFile).then(configData => {
  console.log('Loading complete');
  var hostname = (new URL(globalUrl)).hostname;
  console.log(hostname);
  var hostFound = false;
  Object.keys(configData).forEach(key => {
    if (key == hostname) {
      hostFound = true;
      console.log('Hostname found');
      var urlFound = false;
      var lastSite = null;
      for (var configObj of configData[key]) {
        var regex = urlToRegex(configObj.url);
        var matches = globalUrl.match(regex);
        lastSite = configObj;
        if (matches) {
          var urlFound = true;
          console.log('URL matched');
          logSite(configObj);
          break;
        }
      }
      if (!urlFound) {
        var obj = clone(lastSite);
        obj.type = 'UNKNOWN';
        obj.subtype = 'UNKNOWN';
        logSite(obj);
      }
    }
  });
  if (!hostFound) {
    var obj = clone(defaultSite);
    logSite(obj);
  }
});
