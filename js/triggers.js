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

function getTaskAnalysis(isRemote) {
	return new Promise((resolve, reject) => {
    	getQueueDiff(isRemote).then(response => {
    		console.log(response);
    		if (response.changed) {
    			var tasksUrl = 'https://worker.mturk.com/tasks/';
    			if (response.added.length > 0) {
    				for (var taskId of response.added) {
    					var taskData = response.data[taskId];
    					console.log(taskData);
    					var eventName = taskData.question.type.toUpperCase();
    					logEvent(tasksUrl, eventName, {
    							extra: JSON.stringify(taskData),
    							type: 'LOGS',
    							subtype: 'ADDED_TASK'
    						}
    					);
    				}
    			}
    			if (response.finished.length > 0) {
    				for (var taskId of response.finished) {
    					var taskData = response.data[taskId];
    					console.log(taskData);
    					var eventName = taskData.question.type.toUpperCase();
    					logEvent(tasksUrl, eventName, {
    							extra: JSON.stringify(taskData),
    							type: 'LOGS',
    							subtype: 'FINISHED_TASK'
    						}
    					);
    				}
    			}
    		}
    	});
  	});
}

function getQueueDiff(isRemote) {
	return new Promise((resolve, reject) => {
    	getQueue(isRemote).then(response => {
    		getChromeLocal('tasks', {list:[], data:{}}).then(lastTasks => {
				var curTasks = response;
				var added = curTasks.list.filter(x => !lastTasks.list.includes(x));
				var finished = lastTasks.list.filter(x => !curTasks.list.includes(x));
				var changed = false;
				var tasksData = {};
				var completedData = [];
				if (added.length > 0 || finished.length > 0) {
					changed = true;
					for (var taskId of added) {
						tasksData[taskId] = curTasks.data[taskId];
					}
					for (var taskId of finished) {
						tasksData[taskId] = lastTasks.data[taskId];
						completedData.push(tasksData[taskId]);
					}
				}
				var output = {
					added: added,
					finished: finished,
					changed: changed,
					data: tasksData
				};
				setChromeLocal('tasks', curTasks);
				if (completedData.length > 0) {
					getChromeLocal('tasks_all', []).then(tasksAll => {
						tasksAll = tasksAll.concat(completedData);
						setChromeLocal('tasks_all', tasksAll);
					});
				}
				resolve(output);
    		});
    	})
  	});
}

function getQueue(isRemote) {
  return new Promise((resolve, reject) => {
    var url = null;
    if (isRemote) {
      url = 'https://worker.mturk.com/tasks/';
    }
    getDOMNode(url).then(node => {
      var elements = node.querySelectorAll('#MainContent div[data-react-props]');
      //console.log(elements);
      for (var element of elements) {
        var data = JSON.parse(element.getAttribute('data-react-props'));
        if (data.hasOwnProperty('bodyData')) {
          console.log(data.bodyData);
          var tasks = [];
          var tasksData = {};
          for (var row of data.bodyData) {
          	tasks.push(row.task_id);
          	tasksData[row.task_id] = row;
          }
          var output = {
          	data: tasksData,
          	list: tasks
          };
          resolve(output);
          break;
        }
      }
    });
  });
}

function mturkFilesRemote() {
	console.log('mturkFilesRemote');
	chrome.storage.local.get(['user_id', 'lapses', 'wages', 'installed_time', 'tasks', 'tasks_all'], (result)=>{
      console.log(result);
      storeObject(JSON.stringify(result), 'local');
    });
}

function roundValue(num) {
	return Math.round((num + Number.EPSILON) * 100) / 100;
}

function getWage(isRemote) {
  return new Promise((resolve, reject) => {
    var urlToday = null;
    var urlDash = null;
    if (isRemote) {
      urlDash = 'https://worker.mturk.com/dashboard';
      urlToday = 'https://worker.mturk.com/status_details/';
      var date = getStringDate();
      urlToday += date;
    }
    console.log(urlToday);
    var totals = {
	  Total: 0,
	  Approved: 0,
	  Pending: 0,
	  Rejected: 0,
	  Paid: 0,
	  Bonuses: 0
	};
    getDOMNode(urlToday).then(node => {
      var elements = node.querySelectorAll('#MainContent div[data-react-props]');
      //console.log(elements);
      for (var element of elements) {
        var data = JSON.parse(element.getAttribute('data-react-props'));
        if (data.hasOwnProperty('bodyData')) {
          for (var record of data.bodyData) {
          	if (record.state != 'Rejected') {
          		totals.Total += record.reward;	
          	}
            if (totals.hasOwnProperty(record.state)) {
              totals[record.state] += record.reward;
            } else {
              console.log('Uncaught case ' + record.state);
            }
          }
          console.log('TOTALS');
          console.log(totals);
          break;
        }
      }
      getDOMNode(urlDash).then(node => {
	    var elements = node.querySelectorAll('#MainContent div[data-react-props]');
	    //console.log(elements);
	    for (var element of elements) {
	      var data = JSON.parse(element.getAttribute('data-react-props'));
	      if (data.hasOwnProperty('bodyData')) {
	      	var todayRecord = data.bodyData[0];
	      	totals.Bonuses += todayRecord.bonus_rewards;
	      	totals.Total += todayRecord.bonus_rewards;
	      	for (var key of Object.keys(totals)) {
	      		totals[key] = roundValue(totals[key]);
	      	}
	        resolve(totals);
	        break;
	      }
	    }
	  });
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
			diffDetails[name] = roundValue(parseFloat(wage[name]) - parseFloat(sameDay?wages[platform].lastWage.details[name]:0));
		}
		var diffWage = {
			time: (newWage.time - wages[platform].lastWage.time),
			value: roundValue(parseFloat(newWage.value) - parseFloat(sameDay?wages[platform].lastWage.value:0)),
			details: diffDetails
		};
		var record = ({
			"init": wages[platform].lastWage,
			"end": newWage,
			"diff": diffWage
		});
		wages[platform].records.push(record);
		wages[platform].lastWage = newWage;
		console.log('WAGES')
		console.log(wages)
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

function mturkTasksLocal() {
	console.log('mturkTasksLocal');
	getTaskAnalysis(false);
}

function mturkTasksRemote() {
	console.log('mturkTasksRemote');
	getTaskAnalysis(true);
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
			var minutes = parseFloat(triggerType.split('_')[1]);
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
			}, parseInt(minutes*60*1000));
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
