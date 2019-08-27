var lastTabId = 0;
var status = 0;
var tabToUrl = {};

function init_process() {
  init_triggers('back');
  fsmReset();
}

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
  chrome.storage.local.setchrome.storage.local.get(['working_status'], (result)=>{
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

function eventFired(data) {
  storeObject(JSON.stringify(data));
  trackEvent(data);
}

function logEvent(url, event) {
  logURL(url, event)
   .then(data => {
     for (record of data) {
       if (record.extra == null) {
         console.log(record.data);
         eventFired(record.data);
       }
     }
   });
}

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  // Note: this event is fired twice:
  // Once with `changeInfo.status` = "loading" and another time with "complete"
  tabToUrl[tabId] = tab.url;
  getStatus((statusId)=>{
    chrome.pageAction.setIcon({path: "icon"+statusId+".png", tabId: lastTabId});
  });
});

chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
  //console.log('LOADED');
  lastTabId = tabs[0].id;
  chrome.pageAction.show(lastTabId);
  getStatus((statusId)=>{
    chrome.pageAction.setIcon({path: "icon"+statusId+".png", tabId: lastTabId});
  });
});

chrome.pageAction.onClicked.addListener(function(tab) {
  //console.log('CLICKED');
  lastTabId = tab.id;
  toogleStatus((statusId)=>{
    chrome.pageAction.setIcon({path: "icon"+statusId+".png", tabId: lastTabId});
    logEvent(tab.url, statusId==1?'SYSTEM_ENABLED':'SYSTEM_DISABLED');
  });
});

chrome.storage.local.get(['user_id'], (result) => {
  if (!result.hasOwnProperty('user_id')) {
    var userId = getRandomToken();
    chrome.storage.local.set({'user_id': userId}, () => {});
  }
});

chrome.tabs.onSelectionChanged.addListener(function(tabId, tabObj) {
  //console.log('CHANGED');
  lastTabId = tabId;
  chrome.pageAction.show(lastTabId);
  getStatus((statusId)=>{
    chrome.pageAction.setIcon({path: "icon"+statusId+".png", tabId: lastTabId});
  });
  chrome.tabs.getSelected(null, (tab) => logEvent(tab.url, 'TAB_CHANGE'));
});

chrome.tabs.onRemoved.addListener(function(tabId, info) {
  logEvent(tabToUrl[tabId], 'TAB_CLOSED');
  delete tabToUrl[tabId];
});

function genericOnClick(info, tab) {
  console.log("item " + info.menuItemId + " was clicked");
  console.log("info: " + JSON.stringify(info));
  console.log("tab: " + JSON.stringify(tab));
}

var contexts = ["page","selection","link","editable","image","video","audio"];
for (var i = 0; i < contexts.length; i++) {
  var context = contexts[i];
  var title = "Test '" + context + "' menu item";
  var id = chrome.contextMenus.create({"title": title, "contexts":[context],
                                       "onclick": genericOnClick});
  console.log("'" + context + "' item:" + id);
}

/*
chrome.windows.onFocusChanged.addListener((window) => {
  chrome.windows.getCurrent({populate:true}, (windowObj) => {
    for (var tab of windowObj.tabs)
      if (tab.active)
        logEvent(tab.url, windowObj.focused?'WINDOW_FOCUS':'WINDOW_BLUR');
  });
});
*/

init_process();