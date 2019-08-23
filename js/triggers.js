var triggersFile = 'config/triggers.json';
var triggersMap = {};
var intervals = {};
var triggerEvents = {};

function mturkEarnings() {
	console.log('mturkEarnings');
}

function fiverrEarnings() {
	console.log('fiverrEarnings');
}

function freelancerEarnings() {
	console.log('fiverrEarnings');	
}

function upworkEarnings() {
	console.log('fiverrEarnings');	
}

function matchATrigger(platform, event) {
	if (triggersMap.hasOwnProperty(platform) && triggersMap[platform].hasOwnProperty(event)) {
		for (var func of triggersMap[platform][event]) {
			eval(func)();
		}
	}
}

function getChromeLocal(varName, defaultValue) {
	return new Promise((resolve, reject) => {
		chrome.storage.local.get([varName], (result)=>{
			if (result.hasOwnProperty(varName)) {
				resolve(result[varName]);
			} else {
				var value = {};
				value[varName] = defaultValue;
				chrome.storage.local.set(value, ()=>{
					resolve(defaultValue);
				});
			}
		});
	});
}

function loadCrons() {
	for (var triggerType in triggersMap) {
		if (triggerType.indexOf('MINUTES_')) {
			var minutes = parseInt(triggerType.split('_')[1]);
			intervals[triggerType] = setInterval(()=>{
				getChromeLocal('enabled_platforms',[]).then(platforms => {
					for (var platform in triggersMap[triggerType]) {
						if (platforms.indexOf(platform) != -1) {
							for (var methodName of triggersMap[triggerType][platforms]) {
								eval(methodName)();
							}
						}
					}
				});
			}, minutes*1000);
		}
	}
}

function startTriggers(data, mode) {
	for (var trigger of data.triggers) {
		for (var event of trigger.events) {
			if (!triggersMap.hasOwnProperty(event)) 
				triggersMap[event] = {};
			if (!triggersMap[event].hasOwnProperty(trigger.platform))
				triggersMap[event][trigger.platform] = [];
			triggersMap[event][trigger.platform].push(trigger.method);
		}
	}
	if (mode == 'back') {
		loadCrons();
	}
}

function init_triggers(mode) {
  fetch(chrome.extension.getURL(triggersFile)).then(r => r.json())
    .then(data => startTriggers(data, mode));
}