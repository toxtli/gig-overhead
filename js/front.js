//console.log('YEIII');

var libraries = [
  chrome.extension.getURL("js/store.js")
];

var globalUrl = window.location.href;

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

function logEvent(event) {
  logURL(globalUrl, event)
    .then(data => {
      runCode("storeObject('" + JSON.stringify(data) + "')");
    });
}

loadLibraries(libraries, () => logEvent('PAGE_LOAD'));

window.addEventListener('blur', () => logEvent('PAGE_BLUR'));

window.addEventListener('focus', () => logEvent('PAGE_FOCUS'));

window.addEventListener("beforeunload", () => logEvent('PAGE_BEFORE_CLOSE'));

window.addEventListener("unload", () => logEvent('PAGE_CLOSE'));