var states = {
	"overheads": {
		"group": ["platform", "activityType"],
		"filter": {"activity": ["WORKING", "UNKNOWN"]},
		"init": {"event": ["PAGE_LOAD", "PAGE_FOCUS"]},
		"end": {"event": ["PAGE_CLOSE", "PAGE_BLUR"]}
	},
	"working": {
		"group": ["platform"],
		"init": {"activityType": ["TASK_STARTED"], "event": ["PAGE_LOAD"]},
		"end": {"activityType": ["TASK_SUBMITED"], "event": ["PAGE_LOAD"]}
		//"init": {"activityType": ["WORKER_QUALIFICATIONS"], "event": ["PAGE_LOAD"]},
		//"end": {"activityType": ["WORKER_QUALIFICATIONS_PENDING"], "event": ["PAGE_LOAD"]}
	}
}

function fsmInput(obj) {
	console.log('fsmInput');
	processState('overheads', obj);
	processState('working', obj);
}

function evaluateState(stage, state, obj) {
	var result = false;
	var count = 0;
	var params = Object.keys(states[state][stage]);
	if (states[state].hasOwnProperty("filter")) {
		for (var filter in states[state].filter) {
			if (states[state].filter[filter].indexOf(obj[filter]) != -1) {
				return false;
			}
		}
	}
	for (var param of params) {
		if (states[state][stage][param].indexOf(obj[param]) != -1) {
			count++;
		}
	}
	return (count == params.length);
}

function processState(state, obj) {
	console.log('processState');
	console.log(obj[states[state].param]);
	//return new Promise((resolve, reject) => {
		getChromeLocal(state, {}).then(queue => {
			//console.log(clone(queue));
			if (evaluateState('init', state, obj)) {
				console.log('INIT');
				setElementToQueue(state, queue, obj, updatedQueue => {
					//console.log(clone(updatedQueue));
					setChromeLocal(state, updatedQueue);
					//reject();
				});			
			} else if (evaluateState('end', state, obj)) {
				console.log('END');
				getElementToQueue(state, queue, obj, (lastObj, updatedQueue) => {
					//console.log(clone(updatedQueue));
					if (lastObj != null) {
						//console.log('lastObj');
						//console.log(lastObj);
						setChromeLocal(state, updatedQueue);
						saveLapse(state, lastObj, obj);
						//resolve(lastObj);
					}
				});	
			} else {
				//reject();
			}
		});
	//});
}

function setElementToQueue(state, queue, obj, callback, traverse, objToAdd) {
	if (traverse == null) {
		traverse = {
			items: clone(states[state].group),
			trav: queue
		};
		return setElementToQueue(state, queue, obj, callback, traverse, objToAdd);
	} else if (traverse.items.length > 0) {
		var index = traverse.items.shift();
		if (obj.hasOwnProperty(index))
			index = obj[index];
		if (!traverse.trav.hasOwnProperty(index)) {
			if (traverse.items.length > 0) {
				traverse.trav[index] = {};
				traverse.trav = traverse.trav[index];
				return setElementToQueue(state, queue, obj, callback, traverse, objToAdd);
			} else {
				traverse.trav[index] = [objToAdd==null?obj:objToAdd];
				callback(queue);
			}
		} else {
			if (traverse.items.length > 0) {
				traverse.trav = traverse.trav[index];
				return setElementToQueue(state, queue, obj, callback, traverse, objToAdd);				
			} else {
				traverse.trav[index].push(objToAdd==null?obj:objToAdd);
				callback(queue);
			}
		}
	}
}

function getElementToQueue(state, queue, obj, callback, traverse) {
	if (traverse == null) {
		traverse = {
			items: clone(states[state].group),
			trav: queue
		};
		return getElementToQueue(state, queue, obj, callback, traverse);
	} else if (traverse.items.length > 0) {
		var index = traverse.items.shift();
		if (obj.hasOwnProperty(index))
			index = obj[index];
		if (!traverse.trav.hasOwnProperty(index)) {
			callback(null,queue)
		} else {
			if (traverse.items.length > 0) {
				traverse.trav = traverse.trav[index];
				return getElementToQueue(state, queue, obj, callback, traverse);
			} else {
				if (traverse.trav[index].length > 0) {
					var lastObj = traverse.trav[index].shift();
					callback(lastObj, queue)
				} else {
					callback(null,queue)
				}
			}
		}
	}
}

function fsmReset() {
	chrome.storage.local.set({lapses:{}, overheads:{}, working:{}}, ()=>{});
}

function saveLapse(state, lastObj, obj) {
	getChromeLocal('lapses', {}).then(lapses => {
		console.log('saveLapse');
		//console.log(clone(lapses));
		var lapse = ({
			"init": lastObj.time,
			"end": obj.time,
			"diff": (obj.time - lastObj.time)
		});
		var traverse = {
			"items": [state, "platform", "activity", "activityType"],
			"trav": lapses
		};
		console.log(clone(traverse));
		setElementToQueue(state, lapses, obj, (lapsesUpdated) => {
			console.log(clone(lapsesUpdated));
			setChromeLocal('lapses', lapsesUpdated);
		}, traverse, lapse);
	});
}