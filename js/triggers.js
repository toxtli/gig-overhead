var triggersFile = 'config/triggers.json';
var triggersMap = {};
var intervals = {};
var triggerEvents = {};

function mturkEarningsLocal() {
	console.log('mturkEarningsLocal');
	console.log(document.querySelectorAll('.desktop-row.hidden-sm-down').forEach((el)=>{
		console.log(el)}
	));
}

function mturkEarningsRemote() {
	console.log('mturkEarningsRemote');
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
		('https://worker.mturk.com/status_details/2019-08-26')
		if (!platforms.hasOwnProperty(platform)) {
			platforms[platform] = true;
			chrome.storage.local.set({'enabled_platforms': platforms}, ()=>{});
		}
	});
}

function matchATrigger(data) {
	platformEnable(data.platform);
	if (triggersMap.hasOwnProperty(data.activityType) && triggersMap[data.activityType].hasOwnProperty(data.platform)) {
		for (var func of triggersMap[data.activityType][data.platform]) {
			if (data.event == func.value) {
				window[func.method]();
			}
		}
	}
}

function loadCrons() {
	//#console.log('CRON_INSTALATION');
	for (var triggerType in triggersMap) {
		if (triggerType.indexOf('MINUTES_') != -1) {
			var triggerBase = triggersMap[triggerType];
			console.log(triggerType);
			var minutes = parseInt(triggerType.split('_')[1]);
			console.log(minutes);
			intervals[triggerType] = setInterval(()=>{
				//console.log('CRON_EXECUTED');
				getChromeLocal('enabled_platforms',{}).then(platforms => {
					for (var platform in triggerBase) {
						if (platforms.hasOwnProperty(platform) && platforms[platform]) {
							for (var func of triggerBase[platform]) {
								window[func.method]();
							}
						}
					}
				});
			}, minutes*60*100);
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