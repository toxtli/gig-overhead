var hitList = {};

var historyList = {};
var extUrlList = {};
var onFocusList = {};
var onLoadList = {};
var extTabIds = [];

var recording = false;
var timeRecordList = {};
//var autorecord = true;
var HITsSubmitted;

var lastTabId = null;

var gbInterval = 1000*60*10;  // 10 minutes

var setUninstallPage = false;

chrome.runtime.onInstalled.addListener(function(details){
    if(details.reason == "install"){
        chrome.tabs.create({ url: "https://worker.mturk.com" });
    }
    //else if(details.reason == "update"){ }
});


// when page loaded
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab){
    //log(changeInfo);
    //if(changeInfo.status=="loading" && "url" in changeInfo){
    //if(changeInfo.status=="complete"){
    if(changeInfo.title){
        if(tab.active){
            log("=====onloaded")
            var url = removeLastExtraChar(tab.url);
            var tabId = tab.id;
            var tabIdStr = tabId.toString();
            var now = new Date();
            //log(url);
            if(isMTurkParentPage(url)&&!isAfterSubmitPage(url)) initHistory(tab,now);
            else {
                if(!(tabIdStr in onFocusList) && !(tabIdStr in onLoadList)){  // ||?
                    //for(tidStr in extUrlList){ 
                    //    if(extUrlList[tidStr].indexOf(url)>-1) {
                    //        onLoadList[tabIdStr] = true;
                    //        extTabIds.push(tidStr);
                    //        updateHistory(tidStr, "begin", now);
                    //    }
                    //}
                } else {
                    log("=====onload not updated");
                }
            }

            lastTabId = tabId;
        }
    }
});
    


// when page got focus.
// this will be handled when 
chrome.tabs.onActivated.addListener(function(activeInfo){
    chrome.tabs.query({'active': true, 'currentWindow': true}, function (tabs) {
        log("=====onfocus")
        var tab = tabs[0];
        var url = removeLastExtraChar(tab.url);
        var tabId = tab.id;
        var tabIdStr = tabId.toString();
        var now = new Date();
        // if the last tab ID remains in the list, go save the end datetime of the last tab
        if(lastTabId && (lastTabId.toString() in historyList)) updateHistory(lastTabId.toString(), "end", now, false);
        //for(i in extTabIds){
        //    var tidStr = extTabIds[i];
        //    updateHistory(tidStr, "end", now, true);
        //}
        //extTabIds = [];

        // if current tab is another HIT
        if(isMTurkParentPage(url)&&!isAfterSubmitPage(url)){
            if(!(tabIdStr in historyList)) initHistory(tab,now);
            else updateHistory(tab.id.toString(), "begin", now, false);  // if historyList already exists for the tab, go save the begin datetime of the current tab
        }
        else {
            //log(url);
            //for(tidStr in extUrlList){ 
            //    if(extUrlList[tidStr].indexOf(url)>-1) {
            //        onFocusList[tabIdStr] = true;
            //        extTabIds.push(tidStr);
            //        updateHistory(tidStr, "begin", now, true);
            //    }
            //}
        }

        lastTabId = tabId;
    });
})

//chrome.tabs.onRemoved.addListener(function(tabId, info) {
//    if(tabId.toString() in onFocusList) delete onFocusList[tabId.toString()];
//    if(tabId.toString() in onLoadList) delete onLoadList[tabId.toString()];
//    log("onFocusList and onLoadList delete "+tabId);
//});




function initHistory(tab,now){
    historyList[tab.id.toString()] = { "url": tab.url, "begin": [now], "end": [] };

    timeRecordList[tab.id.toString()] = { "begin": [], "end": [] };

    //log(tab.id.toString()+" INIT "+now.getHours()+":"+now.getMinutes()+":"+now.getSeconds(), "orange");
    //log(historyList[tab.id.toString()]);
}

function updateHistory(tidStr, operation, now, ext){
    historyList[tidStr][operation].push(now);
    //log(tidStr+" "+operation+" "+now.getHours()+":"+now.getMinutes()+":"+now.getSeconds(), "orange");

    if(historyList[tidStr]["begin"].length-historyList[tidStr]["end"].length>=2 || historyList[tidStr]["begin"].length-historyList[tidStr]["end"].length<0){
        log("historyList IS NOT CONSISTENT", "red");
        log(historyList[tidStr]);
    }
    //log(historyList[tidStr]);
}

function initHitList(tabIdStr,url){
    hitList[tabIdStr] = {};
    hitList[tabIdStr].url = url;
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    var tabId = sender.tab.id;
    var tabIdStr = sender.tab.id.toString();

    if (request.operation) {
        if(request.operation!="interaction") log("-------> "+request.operation+": tabId="+tabIdStr, "blue");
        chrome.storage.local.get(["stored_worker_id", "worker_record_id"],function(storageData){
            var workerID = storageData["stored_worker_id"];
            var workerRecordID = storageData["worker_record_id"];

            if(!setUninstallPage){
                setUninstallPage = true;
                var uninstallUrl = "https://"+serverDomain+"/scraper/sites/uninstall/"+CybozuLabs.MD5.calc(workerID);
                chrome.runtime.setUninstallURL(uninstallUrl,function(){
                    //log("set uninstall url: "+uninstallUrl);
                });
            }

            if(!(tabIdStr in hitList) || hitList[tabIdStr].url!=sender.tab.url) {
                initHitList(tabIdStr, sender.tab.url);
            }

            if (request.operation=="dashboard"){
                var now = new Date();
                getDashboardHITStatus(function(dashboardData){
                    getWorkerQualifications(function(qualList){
                        log(qualList);
                        chrome.storage.local.get(["dashboard_last_updated","dashboard_last_daily"],function(storageData){
                            HITsSubmitted = dashboardData["daily_submitted"];
                            var onedaymsec = 86400000;
                            if("dashboard_last_updated" in storageData){
                                var lastUpdated = storageData["dashboard_last_updated"];
                                if(now-lastUpdated > onedaymsec){ var getDashboard = true; } 
                                else { var getDashboard = false; }
                            } else {
                                var getDashboard = true;
                            }
                            if(getDashboard){
                                dashboardData["worker_id"] = workerRecordID;
                                for(var qi in qualList)
                                    qualList[qi]["worker_id"] = workerRecordID;
                                if(storageData["dashboard_last_daily"]!=dashboardData["daily_date"]){
                                    saveToDB("dashboard",dashboardData,function(){
                                        saveToDB("qualifications",qualList,function(){
                                            chrome.storage.local.set({"dashboard_last_updated": now.getTime(), "dashboard_last_daily": dashboardData["daily_date"]});
                                        });
                                    });
                                }
                            }
                        });
                    });
                });
            }

            if (request.operation=="timerecord_get"){
                sendResponse({recording: recording, timerecord: timerecord});
            }
            if (request.operation=="startTimeRecord"){
                chrome.tabs.query({}, function(tabs) {
                    for (var i=0; i<tabs.length; ++i) {
                        if(tabs[i].id!=tabId) sendToTab(tabs[i].id, "pauseTimeRecord");
                    }
                });
                recording = true;
                if((tabIdStr in timeRecordList) && timeRecordList[tabIdStr]["begin"].length-timeRecordList[tabIdStr]["end"].length==0)
                    timeRecordList[tabIdStr]["begin"].push(new Date());
                log(timeRecordList);
            }
            if (request.operation=="pauseTimeRecord"){
                recording = false;
                if(tabIdStr in timeRecordList && timeRecordList[tabIdStr]["begin"].length-timeRecordList[tabIdStr]["end"].length==1) timeRecordList[tabIdStr]["end"].push(new Date());
                log(timeRecordList);
            }

            if (request.operation=="parent"){ 
                var parentData = request.data;
                parentData["HIT"]["manifest_version"] = chrome.runtime.getManifest().version;
                checkForDashboardUpdate(function(updateFlag){
                    getDashboardRejectDates(function(rejection_dates){
                        if(!updateFlag) rejection_dates = [];
                        var requests = [];
                        for(var i=0; i<rejection_dates.length;i++){
                            var date = rejection_dates[i];
                            var url = "https://worker.mturk.com/status_details/"+date+"?utf8=✓&assignment_state=Rejected";
                            requests.push($.ajax({type:"GET",url:url}));
                        }
                        $.when.apply(null, requests).done(function(){
                            var rejectedAssignmentIDs = [];
                            for(var i=0; i<requests.length; i++) {
                                var data = arguments[i][0];
                                var rejectInfo = $(data).find("div[data-react-class*=HitStatusDetailsTable]");
                                var bodyData = JSON.parse(rejectInfo.attr("data-react-props"))["bodyData"];
                                for(var j=0; j<bodyData.length; j++) rejectedAssignmentIDs.push(bodyData[j]["assignment_id"]);
                            }
                            parentData["rejectedAssignmentIDs"] = rejectedAssignmentIDs;

                            saveToDB("parent", parentData,
                                function(response){
                                    hitList[tabIdStr].parentId = response["parent_id"];
                                    hitList[tabIdStr].parentData = parentData;
                                },
                                showDebugWindow
                            );
                        });
                    });
                });
            }
            else if (request.operation=="iframe"){
                //if(hitList[tabIdStr].nextAction != null) hitList[tabIdStr].nextAction = null;
                hitList[tabIdStr].iframeData = request.data;
                extUrlList[tabIdStr] = request.data["ext_links"];
                //log(extUrlList[tabIdStr]);
            }
            else if (request.operation=="interaction" && hitList[tabIdStr].iframeData){ hitList[tabIdStr].iframeData["Interaction"] = request.data; }
            else if (request.operation=="nextAction"){
                if(hitList[tabIdStr].parentId == null) initHitList(tabIdStr, sender.tab.url);
                else hitList[tabIdStr].nextAction = request.data;
            }
            else if (request.operation=="postSurvey"){ hitList[tabIdStr].postSurvey = request.data; }
            else if (request.operation=="ping"){ }
            else if (request.operation=="parentUnload"){ 
                if(hitList[tabIdStr].parentId == null) initHitList(tabIdStr, sender.tab.url);
                else if(hitList[tabIdStr].nextAction == null){ hitList[tabIdStr].nextAction = "other"; }
                hitList[tabIdStr].unloadTime = new Date();
            }

            else if (request.operation=="workerProfile"){ 
                var profileData = request.data;
                getExtensions(function(data){
                    profileData["Extension"] = data;
                    getTurkopticon1Data(profileData,function(toData){
                        profileData["RequesterRatings"]["requester_id"] = profileData["requester_id"];
                        profileData["RequesterRatings"]["requester_name"] = profileData["requester_name"];
                        saveToDB("worker_profile", profileData, function(){
                            //log(profileData);
                        }, showDebugWindow);
                    });
                });
            }

            if (request.operation=="iframe"
                || request.operation=="nextAction"
                /*|| request.operation=="postSurvey"*/
                || (request.operation=="parentUnload" && hitList[tabIdStr])){

                var parentId = hitList[tabIdStr].parentId;
                var iframeData = hitList[tabIdStr].iframeData;
                var nextAction = hitList[tabIdStr].nextAction;
                var unLoaded = ("unloadTime" in hitList[tabIdStr]);
                /*var postSurvey = hitList[tabIdStr].postSurvey;*/

                log(parentId+" "+iframeData?true:false+" "+nextAction);

                if (parentId && iframeData && unLoaded/* && postSurvey */){
                    log("attempting to send data", "green");

                    var now = new Date();
                    var parentData = hitList[tabIdStr].parentData;
                    var historyInfo = jQuery.extend(true, {}, historyList[tabIdStr]);
                    var timeRecordInfo = jQuery.extend(true, {}, timeRecordList[tabIdStr]);

                    delete hitList[tabIdStr];
                    delete historyList[tabIdStr];
                    delete timeRecordList[tabIdStr];
                    sendToTab(tabId, "clear_send_interaction_loop");
                    var time_all = (now - historyInfo["begin"][0])/1000;
                    historyInfo["end"].push(now);
                    if(timeRecordInfo["begin"].length-1==timeRecordInfo["end"].length)
                        timeRecordInfo["end"].push(now);
                    var time_focus = 0;
                    var time_user = 0;
                    for(var i in historyInfo["begin"]) {
                        time_focus += (historyInfo["end"][i] - historyInfo["begin"][i])/1000;
                        log(historyInfo["end"][i]);
                    }
                    for(var i in timeRecordInfo["begin"]) time_user += (timeRecordInfo["end"][i] - timeRecordInfo["begin"][i])/1000;
                    sendData = iframeData
                    sendData["parent_id"] = parentId;
                    sendData["group_id"] = parentData["HIT"]["group_id"];
                    sendData["template"] = iframeData["template"];
                    sendData["Interaction"]["next_action"] = nextAction;

                    sendData["Interaction"]["time_all"] = time_all;
                    sendData["Interaction"]["time_focus"] = time_focus;
                    sendData["Interaction"]["time_user"] = time_user;
                    sendData["Interaction"]["time_record_info"] = JSON.stringify(timeRecordInfo);

                    sendData["Interaction"]["hits_submitted_daily"] = HITsSubmitted;

                    //sendData["HITElements"]["num_link_total"] = sendData["a_links"].length;
                    //sendData["HITElements"]["num_link_survey"] = getSurveyLinks(sendData["a_links"]).length;
                    //sendData["HITElements"]["ext_link_list"] = iframeData["ext_links"];
                    var hitInfo = jQuery.extend(true, {}, sendData);
                    //delete hitInfo["HITElements"]["html"];
                    sendData["Interaction"]["hit_info"] = JSON.stringify(hitInfo);
                    historyInfoAll = {
                        "historyInfo": historyInfo
                    };
                    sendData["Interaction"]["history_info"] = JSON.stringify(historyInfoAll);
                    /*sendData["PostHITSurveyAnswer"] = postSurvey;*/
                    saveToDB("iframe", sendData,
                        function(retInfo){
                            log("saveIFrameDataToDB successfully executed", "green");
                            delete extUrlList[tabIdStr];
                            var nextActions = retInfo["next_actions"];
                            var nextActionsCount = {"submit": 0, "leave": 0};
                            for(var ni in nextActions){
                                if(nextActions[ni]=="submit_iframe") nextActionsCount["submit"] += 1;
                                else nextActionsCount["leave"] += 1;
                            }

                            /* pop-up window starts here */
                            var nextActionExp = {
                                "submit_iframe": "submitted",
                                "return": "returned",
                                "other": "left"
                            };

                            var time_all_t = parseInt(time_all/60) + " mins " + parseInt(time_all)%60 + " secs";
                            var time_focus_t = parseInt(time_focus/60) + " mins " + parseInt(time_focus)%60 + " secs";
                            var time_user_t = parseInt(time_user/60) + " mins " + parseInt(time_user)%60 + " secs";

                            var postHITObj = {
                                "val": {
                                    "hit_id": retInfo["hit_id"], 
                                    "worker_id": retInfo["worker_id"],
                                    "group_id": retInfo["group_id"],
                                    "timerecord_all": time_all,
                                    "timerecord_focus": time_focus,
                                    "timerecord_user": time_user
                                },
                                "html": {
                                    "info_hit_id": parentData["HIT"]["hit_id"],
                                    "info_requester": parentData["HIT"]["requester_name"],
                                    "info_title": parentData["HIT"]["title"],
                                    "info_reward": parentData["HIT"]["reward"].toFixed(2),
                                    "next_action": nextActionExp[nextAction],
                                    "time_all_t": time_all_t,
                                    "time_focus_t": time_focus_t,
                                    "time_user_t": time_user_t
                                },
                                "other": {
                                    "pace": retInfo["pace"],
                                    "next_action": nextAction,
                                    "phs_latest_answer": retInfo["phs_latest_answer"]
                                }
                            };
                            localStorage.postHIT = JSON.stringify(postHITObj);

                            // Decides which page to show
                            if(
                                ( nextActionsCount["submit"]<2 || nextActionsCount["leave"]==0 ) &&
                                (
                                    (
                                        nextAction=="submit_iframe" &&
                                        ( nextActionsCount["submit"]==0 || (nextActionsCount["submit"]==1 && retInfo["pace"]!="") )
                                    ) ||
                                    ( ["return","other"].indexOf(nextAction)>-1 && nextActionsCount["leave"]==0 )
                                )
                            ){
                                if(nextAction=="submit_iframe") var url = "html/postHITSurveyWindow.html";
                                else var url = "html/postHITSurveyWindow_return.html";
                                chrome.tabs.create({url: url});
                            } else if(["submit_iframe","return"].indexOf(nextAction)>-1) {
                                var url = "html/timeSurveyWindow.html";
                                chrome.tabs.create({url: url});
                            }
                        },
                        showDebugWindow
                    );
                }
            }
            return true;
        });
    }
});

var likert_click = function(){ $(this).animate({"background":"rgba(255,160,160,1.0)"}); };

setInterval(function(){
    for(tabIdStr in hitList){
        var currentTime = new Date();
        var unloadTime = hitList[tabIdStr].unloadTime;
        if(unloadTime && (currentTime-unloadTime > gbInterval)) {
            delete hitList[tabIdStr];
            delete historyList[tabIdStr];
            delete timeRecordList[tabIdStr];
        }
    }
}, gbInterval);

function sendToTab(tabId, operation, data, callback){
    chrome.tabs.sendMessage(tabId, { "operation": operation, "data": data }, callback);
}

function getSurveyLinks(urlList){
    function isSurveyLinkUrl(url){
        var survey_links = [ "survey", "google.com/forms", "qualtrics", "surveymonkey", "study" ];
        for(i in survey_links){ if(url.indexOf(survey_links[i]) > -1) return true; }
        return false;
    }

    var links = [];
    for(i in urlList){
        var link = urlList[i];
        if( isSurveyLinkUrl(link) ) links.push(link);
    }
    return links;
}

function saveToDB(path, data, success, error){
    $.ajax({
        type: "POST",
        dataType: "json",
        url: "https://" + serverDomain + "/scraper/" + path + "/",
        data: JSON.stringify(data),
        success: success,
        error: error
    });
}

function getTurkopticon1Data(sendData, callback) {
    var requesterID = sendData["requester_id"];
    if (requesterID != null) {
        $.get( "https://turkopticon.ucsd.edu/api/multi-attrs.php?ids=" + requesterID, function(data1) {
            var parsed = JSON.parse(data1);
            to1 = parsed[requesterID];
            if(to1 != "") {
                to1Data = {
                    "to1_comm": to1["attrs"]["comm"],
                    "to1_pay": to1["attrs"]["pay"],
                    "to1_fair": to1["attrs"]["fair"],
                    "to1_fast": to1["attrs"]["fast"],
                    "to1_reviews": to1["reviews"],
                    "to1_tos": to1["tos_flags"]
                };
            }
            else { 
                to1Data = {
                    "to1_comm": null,
                    "to1_pay": null,
                    "to1_fair": null,
                    "to1_fast": null,
                    "to1_reviews": null,
                    "to1_tos": null
                };
            }
            sendData["RequesterRatings"] = to1Data;
            getTurkopticon2Data(sendData,callback)
            // callback();
        });
    }
}

function getTurkopticon2Data(sendData, callback) {
    var requesterID = sendData["requester_id"]; 
    if (requesterID != null) {
        $.ajax({
            "url":  "https://api.turkopticon.info/requesters/" + requesterID,
            "success": function(data2, status) {
                    if(data2["data"]!= "") {
                        to2 = data2["data"]["attributes"]["aggregates"];
                        to2Data = {
                            "to2_all_reward": to2["all"]["reward"],
                            "to2_all_pending": to2["all"]["pending"],
                            "to2_all_comm": to2["all"]["comm"],
                            "to2_all_recommend": to2["all"]["recommend"],
                            "to2_all_rejected": to2["all"]["rejected"],
                            "to2_all_tos": to2["all"]["tos"],
                            "to2_all_broken": to2["all"]["broken"],
                            "to2_recent_reward": to2["recent"]["reward"],
                            "to2_recent_pending": to2["recent"]["pending"],
                            "to2_recent_comm": to2["recent"]["comm"],
                            "to2_recent_recommend": to2["recent"]["recommend"],
                            "to2_recent_rejected": to2["recent"]["rejected"],
                            "to2_recent_tos": to2["recent"]["tos"],
                            "to2_recent_broken": to2["recent"]["broken"]
                        };
                        sendData["RequesterRatings"] = $.extend(sendData["RequesterRatings"], to2Data);
                        getTurkerViewData(sendData, callback);
                    }
                    else{
                        getTurkerViewData(sendData, callback);
                    }
                },
            "error": function(data2, status) {
                to2Data = {
                    "to2_all_reward": null,
                    "to2_all_pending": null,
                    "to2_all_comm": null,
                    "to2_all_recommend": null,
                    "to2_all_rejected": null,
                    "to2_all_tos": null,
                    "to2_all_broken": null,
                    "to2_recent_reward": null,
                    "to2_recent_pending": null,
                    "to2_recent_comm": null,
                    "to2_recent_recommend": null,
                    "to2_recent_rejected": null,
                    "to2_recent_tos": null,
                    "to2_recent_broken": null
                };
                sendData["RequesterRatings"] = $.extend(sendData["RequesterRatings"], to2Data);
                getTurkerViewData(sendData, callback);
            }
        });       
    }
}


function getTurkerViewData(sendData, callback){
    var requesterID = sendData["requester_id"]; 
    $.ajax({
        method: 'GET',
        url: 'https://turkerview.com/api/v1/requesters/?ids='+requesterID,
        dataType: 'json',
        success: function(data){
            if(data[requesterID]){
                tvData = {
                    "tv_reviews": data[requesterID]["reviews"],
                    "tv_hourly": data[requesterID]["ratings"]["hourly"],
                    "tv_pay": data[requesterID]["ratings"]["pay"],
                    "tv_comm": data[requesterID]["ratings"]["comm"],
                    "tv_fast": data[requesterID]["ratings"]["fast"],
                    "tv_rejections": data[requesterID]["rejections"],
                    "tv_blocks": data[requesterID]["blocks"],
                    "tv_tos": data[requesterID]["tos"],
                    "tv_thid": data[requesterID]["thid"]
                };
            } else {
                tvData = {
                    "tv_reviews": null,
                    "tv_hourly": null,
                    "tv_pay": null,
                    "tv_comm": null,
                    "tv_fast": null,
                    "tv_rejections": null,
                    "tv_blocks": null,
                    "tv_tos": null,
                    "tv_thid": null
                };
            }
            sendData["RequesterRatings"] = $.extend(sendData["RequesterRatings"], tvData);
            callback();
        }
    });
}

function getWorkerQualifications(callback){
    var parseQualification = function(data){
        var qualList = JSON.parse($(data).find("div[data-react-class*=QualificationsTable]").attr("data-react-props"))["bodyData"];
        return qualList;
    };
    var ajaxToPage = function(page, lastPage, qualListAll, callback){
        $.ajax({
            type: "GET",
            url: "https://worker.mturk.com/qualifications/assigned/?page_number="+page,
            success: function(data){
                if(page==1) lastPage = JSON.parse($(data).find("div[data-react-class*=Pagination]").attr("data-react-props"))["lastPage"];
                var qualList = parseQualification(data);
                qualListAll = qualListAll.concat(qualList);
                if(page<lastPage) ajaxToPage(page+1, lastPage, qualListAll, callback);
                else callback(qualListAll);
            }
        });
    };

    ajaxToPage(1, 1, [], callback);
}

function getDashboardHITStatus(callback){
    function myParseInt(str){ return parseInt(str.replace(/,/g, '')); };
    function myParseFloat(str){ return parseFloat(str.replace(/,/g, '')); };
    $.ajax({
        type: "GET",
        url: "https://worker.mturk.com/dashboard",
        success: function(data){
            // "Available Earnings"
            var retData = {};
            retData["available_for_transfer"] = myParseFloat($(data).find("#dashboard-available-earnings>div>div>div").eq(0).children().eq(1).text().slice(1));
            // "HITs Overview"
            retData["approved"] = myParseInt($(data).find("#dashboard-hits-overview>div>div>div").eq(0).children().eq(1).text());
            retData["approval_rate"] = myParseFloat($(data).find("#dashboard-hits-overview>div>div>div").eq(1).children().eq(1).text().slice(0,-1));
            retData["pending"] = myParseInt($(data).find("#dashboard-hits-overview>div>div>div").eq(2).children().eq(1).text());
            retData["rejected"] = myParseInt($(data).find("#dashboard-hits-overview>div>div>div").eq(3).children().eq(1).text());
            retData["rejection_rate"] = myParseFloat($(data).find("#dashboard-hits-overview>div>div>div").eq(4).children().eq(1).text().slice(0,-1));
            // "Earnings to Date"
            retData["approved_hits"] = myParseFloat($(data).find("#dashboard-earnings-to-date>div>table .text-xs-right").eq(1).text().slice(1));
            retData["bonuses"] = myParseFloat($(data).find("#dashboard-earnings-to-date>div>table .text-xs-right").eq(2).text().slice(1));
            retData["total_earnings"] = myParseFloat($(data).find("#dashboard-earnings-to-date>div>table .text-xs-right").eq(3).text().slice(1));
            // "Total Earnings by Period"
            retData["earnings_period"] = myParseFloat($(data).find("#dashboard-total-earnings-by-period>div>table .text-xs-right").eq(1).text().slice(1));
            retData["earnings_period_last"] = myParseFloat($(data).find("#dashboard-total-earnings-by-period>div>table .text-xs-right").eq(2).text().slice(1));

            var HITStatus = [];
            var HITStatusScraped = $(data).find("table.hits-statuses tr.daily_hit_statuses");
            var $st = HITStatusScraped.eq(0);
            var dailyDate = $(data).find("table.hits-statuses tr.daily_hit_statuses").eq(0).children().eq(0).find("a").attr("href").split("/")[2];
            retData["daily_date"] = dailyDate;
            retData["daily_submitted"] = myParseInt($st.children().eq(1).text());
            retData["daily_approved"] = myParseInt($st.children().eq(2).text());
            retData["daily_rejected"] = myParseInt($st.children().eq(3).text());
            retData["daily_pending"] = myParseInt($st.children().eq(4).text());
            retData["daily_earnings"] = myParseFloat($st.children().eq(5).text().slice(1));
            
            if(callback) callback(retData);
        },
        error: function(a,b,c){
             }
    });
}


function checkForDashboardUpdate(callback){
        chrome.storage.local.get(['stored_dashboard_date'], function (result) {
        var dashboardDate = result.stored_dashboard_date;
        var currentDate = new Date();

            if(!dashboardDate || dashboardDate != currentDate.getMinutes()){
                dashboardDate = currentDate;
                chrome.storage.local.set({'stored_dashboard_date': dashboardDate.getMinutes()}, function() { //for testing
                    callback(1);
                }); 
            } else callback(0);
    });
}

function getDashboardRejectDates(callback){
    $.get({
        url: "https://worker.mturk.com/dashboard",
        success: function(data){
            var rejectDates = [];
            var tableRow = data.match(/text-xs-right col-xs-2 col-sm-2 col-md-2'>[0-9]{1,3}/g);
            var dates = data.match(/status_details\/[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]/g);
            for(var j =0;j<tableRow.length/3;j++){ //row
                var num = tableRow[1+(j*3)].split(">")[1];
                if(num == 0){ //should be != 0, this is for testing
                    rejectDates.push(dates[j*2].split("/")[1]);
                }
            }   
            callback(rejectDates);
        }
    });
}

function getExtensions(callback){
    names = [
        "Turkopticon",
        "MTurk Suite",
        "Tampermonkey",
        "Tools for Amazon's Mechanical Turk",
        "Task Archive",
        "AMT Tools",
        "Openturk",
        "CrowdWorkers",
        "Auto Refresh Plus",
        "Visualping",
        "Distill Web Monitor",
        "Page Monitor"
    ]
    columns = [
        "turkopticon",
        "mturk_suite",
        "tampermonkey",
        "tools_for_amt",
        "task_archive",
        "amt_tools",
        "openturk",
        "crowdworkers",
        "auto_refresh",
        "visualping",
        "distill",
        "page_monitor"
    ]
    data = {};
    for(i in columns) data[columns[i]] = 0;
    
    chrome.management.getAll(function(extInfos) {
        apps = extInfos;
        for(i in apps) if(names.indexOf(apps[i].name) > -1) data[columns[names.indexOf(apps[i].name)]] = 1;
        callback(data);
    });
}

function showDebugWindow(e){
    if(DEBUG){
        var w = window.open();
        w.document.write(e.responseText);
        log(e.responseText);
    }
}

function log(text, color){
    if(DEBUG){
        if(color) console.log("%c"+text, "color:"+color);
        else console.log(text);
    }
}
