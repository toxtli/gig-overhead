var triggersFile = 'config/triggers.json';
var triggersMap = {};
var intervals = {};
var triggerEvents = {};

function getWage(isRemote) {
  return new Promise((resolve, reject) => {
    var url = null;
    if (isRemote) {
      url = 'https://worker.mturk.com/status_details/';
      var date = (new Date()).toISOString().split('T')[0];
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
            Pending: 0
          };
          for (var record of data.bodyData) {
            totals.Total += record.reward;
            if (totals.hasOwnProperty(record.state)) {
              totals[record.state] += record.reward;  
            } else {
              console.log('Uncaught case ' + record.state);
            }
          }
          resolve(totals);
          break;
        }
      }
    });
  });
}

function mturkEarningsLocal() {
	console.log('mturkEarningsLocal');
	getWage(false).then(totals => console.log(totals));
}

function mturkEarningsRemote() {
	console.log('mturkEarningsRemote');
	getWage(true).then(totals => console.log(totals));
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