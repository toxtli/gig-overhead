//console.log('YEIII');

var configFile = 'platforms/index.json';
var blakclistFile = 'platforms/blacklist.json';

var defaultSite = {
  "url": "",
  "type": "OTHER",        
  "subtype": "OTHER",
  "platform": "OTHER",
  "time": null
}

RegExp.escape = function(string) {
  return string.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')
};

function isNotBlacklisted(localUrl) {
  return new Promise((resolve, reject) => {
    fetch(chrome.extension.getURL(blakclistFile)).then(r => r.json())
      .then(urls => {
        var found = false;
        for (url of urls) {
          //console.log(localUrl);
          if (localUrl.indexOf(url) != -1) {
            found = true;
            reject();
            break;
          }
        }
        if (!found) {
          resolve();
        }
      })
  });
}

function loadConfiguration(configFile) {
  return new Promise((resolve, reject) => {
    var platformCount = 0;
    var platformsData = {};
    fetch(chrome.extension.getURL(configFile)).then(r => r.json())
    .then(platforms => {
      //console.log(platforms);
      platforms.forEach(platform => {
        fetch(chrome.extension.getURL(platform)).then(r => r.json())
        .then(platformData => {
          //console.log(platformData);
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

function logSite(obj, globalUrl) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(['working_status','user_id'], (result) => {
      obj.current = globalUrl;
      obj.time = (new Date()).getTime();
      obj.status = result['working_status'];
      obj.user = result['user_id'];
      var data = [obj.time, obj.user, obj.platform, obj.type, obj.subtype, obj.status, obj.current];
      resolve(data);
      //runCode("storeObject('" + JSON.stringify(data) + "')");
      //storeObject(obj).then(docRef => resolve(docRef)).catch(error => reject(error));
    });
  });
}

function logURL(globalUrl, event) {
  return new Promise((resolve, reject) => {
    //console.log('logURL');
    isNotBlacklisted(globalUrl)
      .then(() => {
        //console.log('NOT BLACKLISTED');
        loadConfiguration(configFile).then(configData => {
          //console.log('Loading complete');
          var hostname = (new URL(globalUrl)).hostname;
          //console.log(hostname);
          var hostFound = false;
          Object.keys(configData).forEach(key => {
            if (key == hostname) {
              hostFound = true;
              //console.log('Hostname found');
              var urlFound = false;
              var lastSite = null;
              for (var configObj of configData[key]) {
                var regex = urlToRegex(configObj.url);
                var matches = globalUrl.match(regex);
                lastSite = configObj;
                if (matches) {
                  var urlFound = true;
                  //console.log('URL matched');
                  logSite(configObj, globalUrl).
                    then(data => {
                      data.push(event);
                      console.log(data)
                      resolve(data)
                    });
                  break;
                }
              }
              if (!urlFound) {
                //console.log('!urlFound');
                var obj = clone(lastSite);
                obj.type = 'UNKNOWN';
                obj.subtype = 'UNKNOWN';
                logSite(obj, globalUrl).
                  then(data => {
                    data.push(event);
                    resolve(data)
                  });
                //logSite(obj, globalUrl);
              }
            }
          });
          if (!hostFound) {
            //console.log('!hostFound');
            var obj = clone(defaultSite);
            logSite(obj, globalUrl).
              then(data => {
                data.push(event);
                resolve(data);
              });
            //logSite(obj, globalUrl);
          }
      });  
    })
    .catch(() => {
      //console.log('BLACKLISTED');
      //console.log(globalUrl);
    });
  });
}