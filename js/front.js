//console.log('YEIII');

var libraries = [
  chrome.extension.getURL("js/store.js")
];

var globalUrl = window.location.href;

function init_process() {
  init_triggers('front');
}

function runCode(code) {
    var script = document.createElement( "script" );
    script.text = code;
    document.head.appendChild( script ).parentNode.removeChild( script );
}

function loadLibraries(libraries, callback) {
  if (libraries.length > 0) {
    var library = libraries.shift();
    //console.log(library);
    var script = document.createElement('script');
    script.src = library;
    script.onload = function(){
      loadLibraries(libraries, callback);
    } 
    document.getElementsByTagName('head')[0].appendChild(script);
  } else {
    callback();
  }
}

function eventFired(data) {
  storeObjectLocal(data);
  var obj = mapObject(data);
  fsmInput(obj);
  matchATrigger(obj);
}

function storeObjectLocal(data) {
  runCode("storeObject('" + JSON.stringify(data) + "')");
}

var validated = false;
function conditionExecution(e) {
  if (e == null) {
    return document;      
  } else {
    for (var event of e) {
      for (var node of event.addedNodes) {
        if (node.tagName == "SCRIPT" || node.nodeName == "#text")
          return null;
        return node;
      }
    }
  }
  return null;
}

var observers = [];
function executeValidation(settings, data) {
  var func = null;
  if (settings.hasOwnProperty('action')) {
    if (settings.action == 'equal') {
      func = function(e){
        var target = conditionExecution(e);
        if (target != null && settings.selector) {
          var elements = target.querySelectorAll(settings.selector);
          for (var element of elements) {
            if (element.innerText == settings.value) {            
              validated = true;
              console.log('EVENT');
              eventFired(data);
              return true;
            }
          }
        }
        return false;
      };
    }
  } else {
    func = function(e){
      var target = conditionExecution(e);
      if (target != null) {
        var elements = target.querySelectorAll(settings.selector);
        if (elements.length > 0) {        
          validated = true;
          eventFired(data);
          return true;
        }
      }
      return false;
    };
  }
  if (settings.hasOwnProperty('wait') && settings.wait) {
    if (func && !func(null)) {
      observers.push(new MutationObserver(func));
      var observer = observers.slice(-1)[0];
      observer.observe(document, {attributes: false, childList: true, subtree: true});
    }
  } else {
    if (func) {
      func(null);
    }
  }
}

var stats = {}
function logEvent(event, action) {
  var log = true;
  if (action) {
    if (action == 'OUT') {
      for (var i in stats) {
        stats[i] = false;
      }
    } else if (action == 'ONCE') {
      //console.log(stats);
      if (!stats.hasOwnProperty(event)) {
        stats[event] = false;
      }
      if (!stats[event]) {
        stats[event] = true;
      } else {
        log = false;
      }
    }
  }
  if (log) {
    logURL(globalUrl, event)
      .then(data => {
        console.log(data);
        for (record of data) {
          if (record.extra == null) {
            console.log(record.data);
            eventFired(record.data);
          } else {
            executeValidation(record.extra, record.data);
          }
        }
      });
  }
}

loadLibraries(libraries, () => logEvent('PAGE_LOAD'));

window.addEventListener('blur', () => logEvent('PAGE_BLUR', 'OUT'));

window.addEventListener('focus', () => logEvent('PAGE_FOCUS'));

window.addEventListener("beforeunload", () => logEvent('PAGE_BEFORE_CLOSE'));

//window.addEventListener("unload", () => logEvent('PAGE_CLOSE'));

window.addEventListener("keypress", () => logEvent('PAGE_KEY', 'ONCE'));

window.addEventListener("click", () => logEvent('PAGE_CLICK', 'ONCE'));

init_process();