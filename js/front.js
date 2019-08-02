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

loadLibraries(libraries, ()=>{
  //console.log('LOADED!');
  logURL(globalUrl)
    .then(data => {
      data.push('PAGE_LOAD');
      runCode("storeObject('" + JSON.stringify(data) + "')");
    });
});