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

chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
  console.log('LOADED');
  lastTabId = tabs[0].id;
  chrome.pageAction.show(lastTabId);
  getStatus((statusId)=>{
    chrome.pageAction.setIcon({path: "icon"+statusId+".png", tabId: lastTabId});
  });
});

chrome.tabs.onSelectionChanged.addListener(function(tabId) {
  console.log('CHANGED');
  lastTabId = tabId;
  chrome.pageAction.show(lastTabId);
  getStatus((statusId)=>{
    chrome.pageAction.setIcon({path: "icon"+statusId+".png", tabId: lastTabId});
  });
});

chrome.pageAction.onClicked.addListener(function(tab) {
  console.log('CLICKED');
  lastTabId = tab.id;
  toogleStatus((statusId)=>{
    chrome.pageAction.setIcon({path: "icon"+statusId+".png", tabId: lastTabId});
  });
});


// var lastTabId = 0;
// var tab_clicks = {};

// chrome.tabs.onSelectionChanged.addListener(function(tabId) {
//   lastTabId = tabId;
//   chrome.pageAction.show(lastTabId);
// });

// chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
//   lastTabId = tabs[0].id;
//   chrome.pageAction.show(lastTabId);
// });

// // Called when the user clicks on the page action.
// chrome.pageAction.onClicked.addListener(function(tab) {
//   var clicks = tab_clicks[tab.id] || 0;
//   chrome.pageAction.setIcon({path: "icon" + (clicks + 1) + ".png",
//                              tabId: tab.id});
//   if (clicks % 2) {
//     chrome.pageAction.show(tab.id);
//   } else {
//     chrome.pageAction.hide(tab.id);
//     setTimeout(function() { chrome.pageAction.show(tab.id); }, 200);
//   }
//   chrome.pageAction.setTitle({title: "click:" + clicks, tabId: tab.id});

//   // We only have 2 icons, but cycle through 3 icons to test the
//   // out-of-bounds index bug.
//   clicks++;
//   if (clicks > 3)
//     clicks = 0;
//   tab_clicks[tab.id] = clicks;
// });

