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

function platformEnable(platform) {
	getChromeLocal('enabled_platforms', {}).then(platforms => {
		if (!platforms.hasOwnProperty(platform)) {
			platforms[platform] = true;
			chrome.storage.local.set({'enabled_platforms': platforms}, ()=>{});
		}
	});
}

function matchATrigger(data) {
	var platform = data[2];
	var event = data[4];
	platformEnable(platform);
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
	console.log('CRON_INSTALATION');
	for (var triggerType in triggersMap) {
		if (triggerType.indexOf('MINUTES_') != -1) {
			console.log(triggerType);
			var minutes = parseInt(triggerType.split('_')[1]);
			console.log(minutes);
			intervals[triggerType] = setInterval(()=>{
				console.log('CRON_EXECUTED');
				getChromeLocal('enabled_platforms',{}).then(platforms => {
					for (var platform in triggersMap[triggerType]) {
						if (platforms.hasOwnProperty(platform) && platforms[platform]) {
							for (var methodName of triggersMap[triggerType][platform]) {
								window[methodName]();
							}
						}
					}
				});
			}, minutes*60*1000);
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