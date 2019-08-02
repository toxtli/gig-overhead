var lastTabId = 0;
var status = 0;

function getStatus(callback) {
  chrome.storage.local.get(['working_status'], function (result) {
    if (result.hasOwnProperty('working_status')) {
      status = result['working_status'];
    } else {
      chrome.storage.local.set({'working_status': status}, function(){}); 
    }
    callback(status);
  });
}

function toogleStatus(callback) {
  chrome.storage.local.get(['working_status'], (result)=>{
    if (result.hasOwnProperty('working_status')) {
      status = result['working_status'];
    }
    if (status == 1) {
      status = 0;
    } else {
      status = 1;
    }
    chrome.storage.local.set({'working_status': status}, ()=>{});
    callback(status);
  });
}

function getRandomToken() {
    // E.g. 8 * 32 = 256 bits token
    var randomPool = new Uint8Array(16);
    crypto.getRandomValues(randomPool);
    var hex = '';
    for (var i = 0; i < randomPool.length; ++i) {
        hex += randomPool[i].toString(16);
    }
    // E.g. db18458e2782b2b77e36769c569e263a53885a9944dd0a861e5064eac16f1a
    return hex;
}

chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
  console.log('LOADED');
  lastTabId = tabs[0].id;
  chrome.pageAction.show(lastTabId);
  getStatus((statusId)=>{
    chrome.pageAction.setIcon({path: "icon"+statusId+".png", tabId: lastTabId});
  });
});

chrome.tabs.onSelectionChanged.addListener(function(tabId, tabObj) {
  console.log('CHANGED');
  lastTabId = tabId;
  chrome.pageAction.show(lastTabId);
  getStatus((statusId)=>{
    chrome.pageAction.setIcon({path: "icon"+statusId+".png", tabId: lastTabId});
  });
  chrome.tabs.getSelected(null, function(tab) { 
    logURL(tab.url)
     .then(data => {
       data.push('TAB_CHANGE');
       console.log(data);
       storeObject(JSON.stringify(data));
     });
  });
});

chrome.tabs.onRemoved.addListener(function(tabId, info) {
    chrome.tabs.getSelected(null, function(tab) {
      console.log(tab);
      logURL(tab.url)
        .then(data => {
           data.push('TAB_CLOSED');
           console.log(data);
           storeObject(JSON.stringify(data));
        });
    });
});

chrome.pageAction.onClicked.addListener(function(tab) {
  console.log('CLICKED');
  lastTabId = tab.id;
  toogleStatus((statusId)=>{
    chrome.pageAction.setIcon({path: "icon"+statusId+".png", tabId: lastTabId});
  });
});

chrome.storage.local.get(['user_id'], (result) => {
  if (!result.hasOwnProperty('user_id')) {
    var userId = getRandomToken();
    chrome.storage.local.set({'user_id': userId}, () => {});
  }
});