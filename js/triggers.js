var triggersFile = 'config/triggers.json';
var triggersMap = {};
var intervals = {};
var triggerEvents = {};

function getCurrentDateTime() {
  var tzoffset = (new Date()).getTimezoneOffset() * 60000; //offset in milliseconds
  return (new Date(Date.now() - tzoffset)).toISOString().slice(0, 19);
}

function triggersReset() {
	chrome.storage.local.set({wages:{}}, ()=>{});
}

function allStarted(obj) {
	//console.log('ENABLE');
	chrome.runtime.sendMessage({ msg: "enableButton" });
	chrome.storage.local.set({is_working: true, working_on: obj.platform}, ()=>{});
}

function allSubmited(obj) {
	//console.log('DISABLE');
	//console.log(obj);
	chrome.runtime.sendMessage({ msg: "disableButton" });
	chrome.storage.local.set({is_working: false}, ()=>{});
}

function rejectedTask() {
  //console.log('REJECTED_TASK');
  chrome.runtime.sendMessage({ msg: "disableButton" });
	chrome.storage.local.set({is_working: false}, ()=>{});
}

function refreshWage() {
	mturkEarningsRemote();
}

function getStringDate(timestamp) {
	if (timestamp == null)
		return getCurrentDateTime().split('T')[0];
	return (new Date(timestamp)).toISOString().split('T')[0];
}

function getWage(isRemote) {
  return new Promise((resolve, reject) => {
    var url = null;
    if (isRemote) {
      url = 'https://worker.mturk.com/status_details/';
      var date = getStringDate();
      url += date;
    }
    getDOMNode(url).then(node => {
      var elements = node.querySelectorAll('#MainContent div[data-react-props]');
      //console.log(elements);
      for (var element of elements) {
        var data = JSON.parse(element.getAttribute('data-react-props'));
        if (data.hasOwnProperty('bodyData')) {
          var totals = {
            Total: 0,
            Approved: 0,
            Pending: 0,
            Paid: 0
          };
          for (var record of data.bodyData) {
            totals.Total += record.reward;
            if (totals.hasOwnProperty(record.state)) {
              totals[record.state] += record.reward;
            } else {
              //console.log('Uncaught case ' + record.state);
            }
          }
          resolve(totals);
          break;
        }
      }
    });
  });
}

function saveWage(platform, wage) {
	getChromeLocal('wages', {}).then(wages => {
		if (!wages.hasOwnProperty(platform))
			wages[platform] = {};
		if (!wages[platform].hasOwnProperty('records'))
			wages[platform].records = [];
		var curTime = (new Date()).getTime();
		if (!wages[platform].hasOwnProperty('lastWage')) {
			wages[platform].lastWage = {time: curTime, value: 0, details: wage};
		}
		var newWage = {
			time: curTime,
			value: wage.Total,
			details: wage
		};
		var sameDay = (getStringDate(newWage.time) == getStringDate(wages[platform].lastWage.time));
		var diffDetails = {};
		for (var name in wage) {
			diffDetails[name] = parseFloat(wage[name]) - parseFloat(sameDay?wages[platform].lastWage.details[name]:0);
		}
		var diffWage = {
			time: (newWage.time - wages[platform].lastWage.time),
			value: (parseFloat(newWage.value) - parseFloat(sameDay?wages[platform].lastWage.value:0)),
			details: diffDetails
		};
		var record = ({
			"init": wages[platform].lastWage,
			"end": newWage,
			"diff": diffWage
		});
		wages[platform].records.push(record);
		wages[platform].lastWage = newWage;
		setChromeLocal('wages', wages);
		//console.log(wages);
	});
}

function mturkEarningsLocal() {
	console.log('mturkEarningsLocal');
	getWage(false).then(totals => saveWage('MTURK', totals));
}

function mturkEarningsRemote() {
	console.log('mturkEarningsRemote');
	getWage(true).then(totals => saveWage('MTURK', totals));
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
	platformEnable(data.platform);
	if (triggersMap.hasOwnProperty(data.activityType) && triggersMap[data.activityType].hasOwnProperty(data.platform)) {
		for (var func of triggersMap[data.activityType][data.platform]) {
			if (data.event == func.value) {
				window[func.method](data);
			}
		}
	}
}

function loadCrons() {
	//#console.log('CRON_INSTALATION');
	for (var triggerType in triggersMap) {
		if (triggerType.indexOf('MINUTES_') != -1) {
			var triggerBase = triggersMap[triggerType];
			//console.log(triggerType);
			var minutes = parseInt(triggerType.split('_')[1]);
			//console.log(minutes);
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
