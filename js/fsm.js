var states = {
	"overheads": {
		"group": ["platform", "activityType"],
		"param": "event",
		"init": ["PAGE_LOAD", "PAGE_FOCUS"],
		"end": ["PAGE_CLOSE", "PAGE_BLUR"]
	},
	"working": {
		"group": ["platform"],
		"param": "activityType",
		"init": ["TASK_STARTED"],
		"end": ["TASK_SUBMITED", "TASK_REJECTED"]
	}
}

function fsmInput(obj) {
	processState('overheads', obj);
	processState('working', obj);
}

function processState(state, obj) {
	getChromeLocal(state, {}).then(queue => {
		if (states[state].init.indexOf(obj[states[state].param]) != -1) {
			setElementToQueue(state, queue, obj, updatedQueue => {
				setChromeLocal(state, updatedQueue);
			});			
		} else if (states[state].init.indexOf(obj[states[state].param]) != -1) {
			getElementToQueue(state, queue, obj, (lastObj, updatedQueue) => {
				if (retrieved != null) {
					setChromeLocal(state, updatedQueue);
					saveLapse(state, lastObj, obj);
				}
			});	
		}
	});
}

function setElementToQueue(state, queue, obj, callback, traverse) {
	if (traverse == null) {
		traverse = {
			items: states[state].group,
			trav: queue
		};
		return setElementToQueue(state, queue, obj, callback, traverse);
	} else if (traverse.items.length > 0) {
		var index = traverse.items.shift();
		if (!traverse.trav.hasOwnProperty(index)) {
			if (traverse.items.length > 0) {
				traverse.trav[index] = {};
				traverse.trav = traverse.trav[index];
				return setElementToQueue(state, queue, obj, callback, traverse);
			} else {
				traverse.trav[index] = [];
				callback(queue);
			}
		} else {
			traverse.trav = traverse.trav[index];
			return setElementToQueue(state, queue, obj, callback, traverse);
		}
	}
}

function getElementToQueue(state, queue, obj, callback, traverse) {
	if (traverse == null) {
		traverse = {
			items: states[state].group,
			trav: queue
		};
		return setElementToQueue(state, queue, obj, callback, traverse);
	} else if (traverse.items.length > 0) {
		var index = traverse.items.shift();
		if (!traverse.trav.hasOwnProperty(index)) {
			callback(null,queue)
		} else {
			if (traverse.items.length > 0) {
				traverse.trav = traverse.trav[index];
				return setElementToQueue(state, queue, obj, callback, traverse);
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

function saveLapse(state, lastObj, obj) {
	getChromeLocal('lapses', {}).then(lapses => {
		var lapse = ({
			"init": lastObj.time,
			"end": obj.time,
			"diff": timeLapse
		});
		var traverse = {
			"items": [state, "platform", "activity", "activityType"],
			"trav": lapses
		};
		setElementToQueue(state, lapses, lapse, (lapsesUpdated) => {
			setChromeLocal('lapses', lapsesUpdated);
		}, traverse);
	});
}