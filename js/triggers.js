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
	var platformEvent = data[4];
	var event = data[7];
	platformEnable(platform);
	console.log('matchATrigger');
	if (triggersMap.hasOwnProperty(platformEvent) && triggersMap[platformEvent].hasOwnProperty(platform)) {
		console.log(platformEvent, platform);
		for (var func of triggersMap[platformEvent][platform]) {
			if (event == func.value) {
				window[func.method]();
			}
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
							for (var func of triggersMap[triggerType][platform]) {
								window[func.method]();
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
			if (!triggersMap.hasOwnProperty(event.type)) 
				triggersMap[event.type] = {};
			if (!triggersMap[event.type].hasOwnProperty(trigger.platform))
				triggersMap[event.type][trigger.platform] = [];
			var value = event.hasOwnProperty('value')?event.value:null;
			triggersMap[event.type][trigger.platform].push({method: trigger.method, value: value});
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