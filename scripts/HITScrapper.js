var idleTime = 0;
var idle = false;
var expired = false;
var sendingParent = 0;

var send_interaction_loop = null;

mturk_info = [];

chrome.runtime.onMessage.addListener(function(request,sender,sendResponse) {
    if(request.operation=="clear_send_interaction_loop") clearInterval(send_interaction_loop);
    if(request.operation=="pauseTimeRecord") pauseTimeRecord();
});

$(function(){
    console.log('START');
    if (isAfterSubmitPage(window.location.href)) {
        sendToBackground("nextAction", "submit_iframe");
    }
    else if (isMTurkPage(window.location.href)) {
        setWorkerID(function(workerID,workerRecordID,isNew){
            getWorkerFromDB(workerID, function(banned){
                getExpDates(banned, function(active){
                    if(active){
                        // shown only when the script is installed
                        if(isMTurkTopPage(window.location.href) && isNew){
                            var url = chrome.extension.getURL("html/install.html");
                            $.get({
                                "url": url,
                                "success": function(data){
                                    var w = window.open();
                                    w.document.write(data);
                                    $(w.document).find("#code").text(workerID.substr(workerID.length-8).split("").reverse().join(""));
                                    w.document.close();       
                                }
                            });
                        }

                        var sendData = {};
                        if(window==top && isMTurkParentPage(window.location.href)){
                            /* =============== PARENT PAGE ================ */
                            //console.log("SuperTurker: Getting parent page");
                            sendToBackground("dashboard");

                            if(!isPreviewPage(window.location.href)){
                                $("head").append(LINK_TAG_FONTAWESOME);
                                $("body").append('<div id="border_recording" style="display:none;"></div>');
                                $(BTN_TIME_RECORDING).insertAfter("div.project-detail-bar>div.row");
                                window.scrollBy(0,-18);
                                //startTimeRecord();
                                //pauseTimeRecord();
                                initTimeRecord();
                                $(".btn_timerecord").on("click",function(e){
                                    e.preventDefault();
                                    $btn = $(".btn_timerecord");
                                    if($btn.hasClass("btn_timerecord_clicked")){
                                        pauseTimeRecord();
                                    } else {
                                        startTimeRecord();
                                    }
                                });
                            }

                            var HITIFrame = $('iframe.embed-responsive-item')[0];
                            if(HITIFrame != null && !sendingParent){
    
                                var parentData = {};
                                initMTurkInfo();
                                
                                parentData["worker_id"] = mturk_info["worker_id"] = workerID;
                                parentData["HIT"] = getHITInfo();
                                var instText = parentData["HIT"]["title"]+" "+parentData["HIT"]["description"];
                                //parentData["HITKeywords"] = getKeywordCounts(instText);
    
                                sendToBackground("parent", parentData);
                                //postSurvey(false);
    
                                profileData = {};
                                profileData["worker_id"] = mturk_info["worker_id"];
                                profileData["requester_id"] = mturk_info["requester_id"];
                                profileData["requester_name"] = mturk_info["requester_name"];
                                sendToBackground("workerProfile", profileData);

                                setNextPageListener(sendData);
                                
                                $(window).on("beforeunload", function(){
                                    //if(!savedPostSurvey) {
                                    //    var answers = getSelectedPostSurveyAnswers();
                                    //    sendToBackground("postSurvey", answers);
                                    //}
                                    sendToBackground("parentUnload");
                                });
                            }
                        }
                        else if (isIFrame(window.location.href)) {
                            /* ================== IFRAME =================== */
                            //console.log("SuperTurker: Getting IFrame");
    
                            iframeData = {};
                            iframeData["Interaction"] = getInitialActionCounts();
                            setInteractionHandlers(iframeData["Interaction"]);

                            var sendingIFrame = 0;

                            //parsed = parseHTML(getHTML());

                            chrome.storage.local.get(['stored_worker_id'/*,"hit_id"*/], function (result) {
                                
                                var text = getTextFromHTML();
                                
                                var anchorURLs = getAllAnchorHrefs();
                                var textURLs = extractURLsFromText(text);

                                var extURLs = anchorURLs.concat(textURLs);
                                var imgURLs = getAllImgSrcs();
                                var audioURLs = getAllAudioSrcs();
                                var videoURLs = getAllVideoSrcs();
                                    
                                iframeData["HITElementURLs"] = {}
                                iframeData["HITElementURLs"]["text"] = text
                                iframeData["HITElementURLs"]["a_href_urls"] = JSON.stringify(anchorURLs)
                                iframeData["HITElementURLs"]["url_texts"] = JSON.stringify(textURLs)
                                iframeData["HITElementURLs"]["img_urls"] = JSON.stringify(imgURLs)
                                iframeData["HITElementURLs"]["audio_urls"] = JSON.stringify(audioURLs)
                                iframeData["HITElementURLs"]["video_urls"] = JSON.stringify(videoURLs)
                                //console.log(iframeData["HITElementURLs"]);

                                iframeData["worker_id"] = result["stored_worker_id"];
                                //iframeData["HITKeywords"] = getKeywordCounts();
                                //iframeData["HITElements"] = getElementCounts();
                                //iframeData["ext_links"] = getExternalLinks();
                                //iframeData["ext_links"] = extURLs;
                                //iframeData["a_links"] = [];
                                //for(i=0; i<$("a").length; i++) {
                                //    var url = $("a").eq(i).attr("href");
                                //    if(typeof(url)==="undefined") continue;
                                //    if(url[0]=="/") iframeData["a_links"].push(window.location.origin+url);
                                //    else iframeData["a_links"].push(url);
                                //}
                                iframeData["InputFieldsCount"] = getInputFields();
                                //iframeData["HITElements"]["html"] = getHTML();
                                iframeData["HITHTML"] = {};
                                iframeData["HITHTML"]["html"] = getHTML();
                                iframeData["template"] = getTemplate();
                                iframeData["iframe_url"] = window.location.href;

                                //iframeData["HITElements"]["duration_audio"] = 0;
                                //iframeData["HITElements"]["duration_video"] = 0;
                                //iframeData["HITElements"]["num_audio"] = $("video").length;
                                //iframeData["HITElements"]["num_video"] = $("audio").length;

                                sendToBackground("iframe", iframeData);
                                send_interaction_loop = setInterval(function(){
                                    sendToBackground("interaction", iframeData["Interaction"]);
                                },1000);
                            });
                            $(window).on("submit", function(){
                                sendToBackground("nextAction", "submit_iframe");
                            });
                        }
                    }
                });
            }, showDebugWindow);
        });
    }
});

// === communication with chrome storage =================

function sendToBackground(operation, data, callback){
    chrome.runtime.sendMessage({ "operation": operation, "data": data }, callback);
}

// === communication with server =========================

function getWorkerFromDB(workerID,success,error){
    var url = "https://" + serverDomain + "/scraper/worker/"+workerID+"/";
    var success_base = function(data){
        var banned = data["banned"];
        chrome.storage.local.set({ "worker_record_id": data["worker_record_id"], "worker_id_md5": data["worker_id_md5"] }, function(){ success(banned); });
    };

    $.ajax({
        type: "GET",
        dataType: "json",
        url: url,
        success: success_base,
        error: error
    });
}

function updateWorker(workerID,data,success,error){
    $.ajax({
        type: "POST",
        dataType: "json",
        data: {
            "group_id": data["group_id"],
            "reward": data["reward"],
            "search_sec": data["search_sec"]
        },
        url: "https://" + serverDomain + "/scraper/worker/"+workerID+"/",
        success: success,
        error: error
    });
}

// === functions =========================================

function showDebugWindow(e){
    if(DEBUG){
        var w = window.open();
        w.document.write(e.responseText);
        console.log(e.responseText);
    }
}


function getCurrentPage(){
    return getParameterByName("assignment_id",window.location.href) ? "accept" : "preview";
}


function initMTurkInfo(){
    // just temporarily setting mturk_info by sendData["task_info"]
    mturk_info = getHITInfo();
}


function getHITInfo(){
    var data = {};

    var taskInfo= JSON.parse($($(document).xpathEvaluate('//*[contains(@data-react-class,"ShowModal")]')[0]).attr("data-react-props"))
    
    if($(".embed-responsive-item").length)
        data["hit_id"] = $("iframe")[0].src.match(/hitId=([A-Z|0-9]*)/ig)[0].split("=")[1]
    else
        data["hit_id"] = "";

    data["assignment_id"] = getParameterByName("assignment_id",window.location.href);
    data["group_id"] = taskInfo["modalOptions"]["contactRequesterUrl"].match(/hit_type_message%5Bsubject%5D=(.*)/)[1].split("+")[7];
    data["requester_id"] = taskInfo["modalOptions"]["contactRequesterUrl"].match(/hit_type_message%5Brequester_id%5D=([A-Z|0-9]*)/)[1];
    data["requester_name"] = taskInfo["modalOptions"]["requesterName"];
    data["current_page"] = getCurrentPage();
    data["title"] = taskInfo["modalOptions"]["projectTitle"];
    data["description"] = taskInfo["modalOptions"]["description"];
    data["duration_sec"] = taskInfo["modalOptions"]["assignmentDurationInSeconds"];

    data["expiration_time"] = taskInfo["modalOptions"]["expirationTime"];
    data["creation_time"] = taskInfo["modalOptions"]["creationTime"];

    data["reward"] = taskInfo["modalOptions"]["monetaryReward"]["amountInDollars"];
    data["reward_currency"] = taskInfo["modalOptions"]["monetaryReward"]["currencyCode"];
    data["hits_available"] = taskInfo["modalOptions"]["assignableHitsCount"];
    data["current_page"] = getCurrentPage();
    data["qualifications"] = null;
    data["user_agent"] = window.navigator.userAgent;
    return data;
}


function getInitialSurveyResponses(){
    return {
        "Q1Select": 0,
        "Q2Select": 0,
        "Q3Select": 0
    }
}
function getInitialMediaDurations(){
    return {
        "Video": 0,
        "Audio": 0
    }
}

function getInitialActionCounts() {
    return {
        "num_keypress": 0,
        "num_click": 0,
        "len_scroll": 0,
        "len_mousemove": 0
    }
}
function getInitialTimerCounts() {
    return {
        "keypress": 0,
        "click": 0,
        "scroll": 0,
        "mousemove": 0
    }
}

var getAllAnchorHrefs = function(){
    var urlList = [];
    $("a").each(function() {
        var a = document.createElement("a");
        a.href = $(this).attr("href");
        if($.inArray(a.href, urlList) === -1 && a.href.startsWith("http")) urlList.push(a.href);
    });
    return urlList;
};

var getAllImgSrcs = function(){
    var imgURLList = [];
    $('*').each(function(){
        if ($(this).is('img')) {
            if($.inArray($(this).attr('src'), imgURLList) === -1) imgURLList.push($(this).attr('src'));
        } else {
            var backImg = $(this).css('background-image');
            var matches = backImg.match(/url\(['"]?([^'"]+)['"]?\)/);
            if (matches) if($.inArray(matches[1], imgURLList) === -1) imgURLList.push(matches[1]);
            else {
                var backImg = $(this).css('background');
                var matches = backImg.match(/url\(['"]?([^'"]+)['"]?\)/);
                if (matches) if($.inArray(matches[1], imgURLList) === -1) imgURLList.push(matches[1]);
            }
        }
    });
    for(var i in imgURLList){
        if(typeof(imgURLList[i])==="undefined") continue;
        var a = document.createElement("a");
        a.href = imgURLList[i];
        imgURLList[i] = a.href;
    }
    return imgURLList;

};

var getAllAudioSrcs = function(){
    var audioURLList = [];
    $('audio').each(function(){
        if($.inArray($(this).attr('src'), audioURLList) === -1) audioURLList.push($(this).attr('src'));
    });
    for(var i in audioURLList){
        if(typeof(audioURLList[i])==="undefined") continue;
        var a = document.createElement("a");
        a.href = audioURLList[i];
        audioURLList[i] = a.href;
    }
    return audioURLList;
};

var getAllVideoSrcs = function(){
    var videoURLList = [];
    $('video').each(function(){
        if($.inArray($(this).attr('src'), videoURLList) === -1) videoURLList.push($(this).attr('src'));
    });
    for(var i in videoURLList){
        if(typeof(videoURLList[i])==="undefined") continue;
        var a = document.createElement("a");
        a.href = videoURLList[i];
        videoURLList[i] = a.href;
    }
    return videoURLList;
};

var getTextFromHTML = function(){
    function extractContent(html) {
        var retval =  (new DOMParser).parseFromString(html, "text/html") .  documentElement . textContent;
        if(retval!="undefined") return retval;
        else return "";
    }
    $body = $("body").clone();
    $body.find("script").remove();
    $body.find("style").remove();
    return extractContent($body.wrap("<div>").parent().html().replace(/>/g, "> ")).replace(/\s\s+/g, '   ');
};

var extractURLsFromText = function(text) {
    var getAbsoluteURL = (function() {
        var a;

        return function(url) {
            if(!a) a = document.createElement('a');
            a.href = url;

            return a.href;
        };
    })();
    var possibleURLs = text.match(/(((http|https):\/\/)?(([A-Za-z0-9\-]+\.)+(com|net|org|gov|edu|mil|int|be|cl|fi|in|jp|nu|pt|pw|py|gl|ly|io|re|sa|se|su|tn|tr|io|de|cn|uk|info|nl|eu|ru)|((?<!.)[0-9]{1,3}\.){3}[0-9]{1,3})([?:/][A-Za-z0-9-._~:/?#@!$&()+;=%]*)?)(?=[\s'"<>])/gi);
    var urlList = possibleURLs;
    if(urlList===null) urlList = [];
    var urlListAbs = [];
    for(i in urlList) {
        if(typeof(urlList[i])==="undefined") continue;
        urlList[i] = removeLastExtraChar(urlList[i]);
        if(urlList[i].endsWith("&quot;")) urlList[i].slice(0,-6);
        urlListAbs.push(removeLastExtraChar(getAbsoluteURL(urlList[i])));
    }
    //console.log(urlList);
    //console.log(urlListAbs);
    urlList = urlList.concat(urlListAbs);
    var urlListAll = [];
    $.each(urlList, function(i, el){
            if($.inArray(el, urlListAll) === -1 && !el.includes("externalSubmit")) urlListAll.push(el);
    });

    return urlListAll;
}

function getTemplate() {
    var html = $("body").html();

    var templateArray = ["Survey Link Layout -->",
                         "Survey Layout -->",
                         "Image Tagging Layout -->",
                         "Image Moderation Layout --",
                         "Image A/B Layout -->",
                         "Writing Layout -->",
                         "Data Collection Layout -->",
                         "<!-- Layout -->",
                         "Video transcription layout -->",
                         "Image Tagging Layout -->",
                         "Image Transcription Layout -->",
                         "STARTSCALE -->",
                         "Categorization Layout -->",
                         "<!-- Content Body -->"];

    var templateArrayValues = ["Survey Link",
                         "Survey",
                         "Image Tagging",
                         "Image Moderation",
                         "Image A/B",
                         "Writing",
                         "Data Collection",
                         "Data Collect From Website",
                         "Video Transcription",
                         "Image Tagging",
                         "Image Transcription",
                         "Sentiment",
                         "Categorization",
                         "Other"];

    var thisTemplate = "No template";

    for(var i=0; i<templateArray.length; i++){
        if(html.includes(templateArray[i])){
            thisTemplate = templateArrayValues[i];
            break;
        }
    }
    return thisTemplate;
}

function setMediaNum(mediaData) {

}

function setMedia(mediaData,callback) {
    var html = document.documentElement.outerHTML;

    mediaData["duration_audio"] = 0;
    mediaData["duration_video"] = 0;

    var videoMatchTest = html.match(/(src).*?((\.webm|\.mkv|\.flv|\.avi|\.wmv|\.mp4|\.mov|\.mpg|\.mpeg|\.mpv|\.m4v|\.flv|youtube|vimeo|dailymotion|video-embed|video-placeholder))/ig);
    var audioMatchTest = html.match(/(src).*?((\.mp3|\.wav|\.flac|\.ogg|\.wma|\.alac|\.aiff|\.m4a|\.acc))/ig);

    mediaData["num_video"] = $("video").length;
    mediaData["num_audio"] = $("audio").length;

    if(videoMatchTest != null){
        if(mediaData["num_video"] == 0) mediaData["num_video"] +=videoMatchTest.length;
        var youtubeMatches = html.match(/^https?:\/\/www\.youtube\.com\/.*[?&]v=([^&]+)/i) || html.match(/(https?:\/\/www\.youtube\.com\/embed\/([^&]+))/ig) || html.match(/^https?:\/\/youtu\.be\/([^?]+)/i || /(https?:\/\/www\.youtube-nocookie\.com\/embed\/([^&]+))/ig);

        if(youtubeMatches){
            youtubeMatchesFunction(youtubeMatches, function(duration) {
                mediaData["duration_video"] = duration;
                for(var i=0; i<$("video").length; i++){ mediaData["duration_video"] += $("video")[i].duration; }
                for(var i=0; i<$("audio").length; i++){ mediaData["duration_audio"] += $("audio")[i].duration; }

                // returning -1 for NaN
                if(isNaN(mediaData["duration_video"])) mediaData["duration_video"] = -1;
                if(isNaN(mediaData["duration_audio"])) mediaData["duration_audio"] = -1;
                callback();
            });
        } else callback();
    } else {
        for(var i=0; i<$("video").length; i++){ mediaData["duration_video"] += $("video")[i].duration; }

        for(var i=0; i<$("audio").length; i++){ mediaData["duration_audio"] += $("audio")[i].duration; }
            // console.log("t4 "+ mediaData["duration_video"]);
        // returning -1 for NaN
        if(isNaN(mediaData["duration_video"])) mediaData["duration_video"] = -1;
        if(isNaN(mediaData["duration_audio"])) mediaData["duration_audio"] = -1;

        callback();
    }
}

function youtubeMatchesFunction(youtubeMatches, callback){
    var duration = 0;
    for(var i = 0; i<youtubeMatches.length; i++){
        youtubeMatchesLink = youtubeMatches[i].split("\"")[0];

        getYoutubeDuration(youtubeMatchesLink,
            function(data) {
                if(data.items[0]) duration += convert_time(data.items[0].contentDetails.duration);
                if(i==youtubeMatches.length){ callback(duration); }
            }, function() {
                // mediaData["duration_video"] = 0;
                if(i==youtubeMatches.length-1){ callback(duration); }
            }
        );
    }
}

function getInputFields($parentElem) {
    if (typeof($parentElem) === "undefined") { $parentElem = $("body"); }

    var inputList = [];
    
    var $inputFields = $parentElem.find("input");
    for (var i = 0; i < $inputFields.length; i++) {
        var entry = {};
        entry.type = $inputFields[i].getAttribute("type");
        if(!entry.type) entry.type = "text";
        entry.name = $inputFields[i].getAttribute("name");
        if(!entry.name) entry.name = "";
        entry.value = $inputFields[i].value;
        if(!entry.value) entry.value = "";
        inputList.push(entry);
    }

    var $textAreas = $parentElem.find("textarea");
    for(var i = 0; i < $textAreas.length; i++){
        var entry = {};
        entry.type = "textarea";
        entry.name = $textAreas.eq(i).attr("name");
        if(!entry.name) entry.name = "";

        entry.value = $textAreas[i].value;
        if(!entry.value) entry.value = "";
        inputList.push(entry);
    }

    var $selectFields = $parentElem.find("select");
    for(var i = 0; i < $selectFields.length; i++){
        $options = $($selectFields[i]).children("option");
        for(var j = 0; j < $options.length; j++){
            var entry = {};
            entry.type = "select_option";
            entry.name = $selectFields.eq(i).attr("name");
            entry.value = $options.eq(j).val();
            inputList.push(entry);
        }
    }

    return inputList;
}


function getElementCounts() {
    function getImageCount() {
        return $("img").length;
    }

    function getCanvasCount() {
        return $("canvas").length;
    }

    function getNoAltImageCount() {
        return $("img").length-$("img[alt]").length;
    }

    // --- getElementCounts() main

    var countData = {};
    countData["num_image"] = getImageCount();
    countData["num_canvas"] = getCanvasCount();
    countData["num_image_no_alt"] = getNoAltImageCount();

    return countData;
}

function getExternalLinks() {
    var getAbsoluteUrl = (function() {
        var a;

        return function(url) {
            if(!a) a = document.createElement('a');
            a.href = url;

            return a.href;
        };
    })();
    var possibleUrls = $("body").html().match(/(((http|https):\/\/)?(([A-Za-z0-9\-]+\.)+(com|net|org|gov|edu|mil|int|be|cl|fi|in|jp|nu|pt|pw|py|gl|ly|io|re|sa|se|su|tn|tr|io|de|cn|uk|info|nl|eu|ru)|((?<!.)[0-9]{1,3}\.){3}[0-9]{1,3})([?:/][A-Za-z0-9-._~:/?#@!$&()+;=%]*)?)(?=[\s'"<>])/gi);
    var urlList = possibleUrls;
    if(urlList===null) urlList = [];
    var urlListAbs = [];
    for(i in urlList) {
        urlList[i] = removeLastExtraChar(urlList[i]);
        if(urlList[i].endsWith("&quot;")) urlList[i].slice(0,-6);
        urlListAbs.push(removeLastExtraChar(getAbsoluteUrl(urlList[i])));
    }
    //console.log(urlList);
    //console.log(urlListAbs);
    urlList = urlList.concat(urlListAbs);
    var urlListAll = [];
    $.each(urlList, function(i, el){
            if($.inArray(el, urlListAll) === -1 && !el.includes("externalSubmit")) urlListAll.push(el);
    });

    return urlListAll;
}
 

function setInteractionHandlers(sendData) {
    document.addEventListener('click', function(){
        ++sendData["num_click"];
    });
    document.addEventListener('scroll', function(){
        ++sendData["len_scroll"];
    });
    $(document).keypress(function() {
        ++sendData["num_keypress"];
    });
    $(document).on("mousemove",function() {
        ++sendData["len_mousemove"];
    });
}

// PARENT
//function getWorkerID(){
//    workerID = $('[data-reactid=".0.1.0"]').text();
//    return workerID;
//}

function setWorkerID(callback){
    chrome.storage.local.get(['stored_worker_id','worker_record_id'], function (result) {
        console.log(result);
        var workerID = result.stored_worker_id;
        var workerRecordID = result.worker_record_id;
        if(workerID){
            // console.log("workerID loaded from storage: " + workerID);
            callback(workerID,workerRecordID);
        } else {
            workerID = $('[data-reactid=".0.1.0"]').text();
            chrome.storage.local.set({'stored_worker_id': workerID}, function() {
                // console.log(workerID+" stored");

                callback(workerID,workerRecordID,true);
            }); 
        }
    });
}


function getHTML(text)    {
    var all = document.documentElement.outerHTML;
    return all;
}

//function getKeywordCounts(text) {
//    if(!text) text = $("body").html();
//
//    var keywords = ["click", "drag", "draw", "transcribe", "copy", "search", "label", "watch", "listen", "play", "audio", "video", "record", "classify", "tag", "tagging", "survey", "find", "qualify", "qualifier", "qualifier", "transcription", "image", "sentiment"];
//    var counts = (new Array(keywords.length)).fill(0)
//    var re = /\w+(?:'\w{1,2})?/g
//    var word;
//    while((word = re.exec(text)) != null) {
//        var idx = keywords.indexOf(word[0]);
//        if(idx >= 0) counts[idx]++;
//    }
//    var ret = {};
//    for(var i in keywords) ret[keywords[i]] = counts[i];
//    return ret
//}

//function getInstructions(text)    {
//    var $childNodes = $("body").children();
//  var visibleText = text ? text : $childNodes.filter(':visible').text();
//  
//    var inst_counts = {
//        "click_and_drag": 0,
//        "draw": 0,
//        "transcribe": 0,
//        "copy": 0,
//        "search": 0,
//        "label": 0,
//        "watch": 0,
//        "listen": 0,
//        "play": 0,
//        "audio": 0,
//        "video": 0,
//        "record": 0,
//        "classify": 0,
//        "tag": 0,
//        "tagging": 0,
//        "survey": 0,
//        "find": 0,
//        "qualify": 0,
//        "qualifier": 0,
//        "qualifier": 0,
//        "transcription":0,
//        "image": 0,
//        "sentiment": 0
//    }
//    for(key_ in inst_counts){
//        key = key_.replace(/_/g, ' ');
//        var key_blank = " " + key + " ";
//        var key_period = " " + key + ".";
//        if(visibleText.toLowerCase().includes(key_blank) || visibleText.toLowerCase().includes(key_period)) inst_counts[key_]++;
//    }
//    return inst_counts;
//}

function setNextPageListener(sendData){
    var $skipBtn = $("a:regex(href, .*/mturk/preview.*)");
    var $skipBtnNew = $($(document).xpathEvaluate("//button[contains(text(),'Skip')]"));
    var $acceptBtn = $("input[name='/accept']");
    var $acceptBtnNew = $($(document).xpathEvaluate("//span[contains(@data-react-class,'SubmitAcceptTaskForm')]"));
    var $returnBtn = $("a:regex(href, .*/mturk/return.*)");
    var $returnBtnNew = $($(document).xpathEvaluate("//button[contains(text(),'Return')]"));
    var $submitBtn = $("input[name='/submit']");

    var handler = function(e, action, callback){
        sendToBackground("nextAction", action, callback);
    };

    $skipBtn.on("click", function(e){ handler(e, "skip"); });
    $skipBtnNew.on("click", function(e){ handler(e, "skip"); });
    $acceptBtn.on("click", function(e){ handler(e, "accept"); });
    $acceptBtnNew.on("click", function(e){ handler(e, "accept"); });
    $returnBtn.on("click", function(e){ handler(e, "return"); });
    $returnBtnNew.on("click", function(e){ handler(e, "return"); });
    $submitBtn.on("click", function(e){ handler(e, "submit"); });
}

function getExpDates(banned, callback){
    // console.log("getexpdates");
    var today = new Date();
    var output = {
        "startDate": 0,
        "endDate": 0,
        "active": true
    };

    chrome.storage.local.get('stored_start_date', function (result) {
        var endDate;
        var startDate = result.stored_start_date;
        var today = new Date().getTime();
        
        // if(!startDate || startDate < new Date().getTime()){  // for test
        if(!startDate){
            chrome.storage.local.set({'stored_start_date': today}, function() {
                startDate = today;
                output["startDate"] = startDate;
            });
        }
        
        else{
            endDate = startDate+STUDY_DURATION;
            output["endDate"] = endDate;
            

            if(today >= endDate || banned==1){
                output["active"] = false;
                endPopUp();
            }
        }
        callback(output["active"]);
    });
    // return output["active"];
}


function endPopUp(){
    if(expired == false){
        expired == true;
        if(window==top && isMTurkParentPage(window.location.href)){
            var HITIFrame = document.getElementsByTagName('iframe')[0];
            if(HITIFrame != null && !sendingParent){
                console.log("SuperTurkers is has expired.");
                postSurveyText = "Thank you for participating! This study is now complete. The SuperTurkers extension will <b>no longer collect data.<u>You are now free to <a href='https://support.google.com/chrome_webstore/answer/2664769?hl=en'>uninstall this extension.</a></b></u> <i>Want to give us constructive feedback? Email superturker.test@gmail.com </i>";
                postSurvey(true);
            }
        }
    }
}


/*
 * YouTube: Retrieve Title, Description and Thumbnail
 * http://salman-w.blogspot.com/2010/01/retrieve-youtube-video-title.html
 */

function getYoutubeDuration(input_url,success,error) {
    var url = input_url;
    if(url.includes("?")){
        url = input_url.split("?")[0];
    }
    var duration = 0;
    var videoid = url;

    var matches = 
         videoid.match(/^https?:\/\/www\.youtube\.com\/.*[?&]v=([^&]+)/i) || 
         videoid.match(/^https?:\/\/www\.youtube\.com\/embed\/([^&]+)/i) ||
         videoid.match(/^https?:\/\/youtu\.be\/([^?]+)/i) || 
         videoid.match(/(https?:\/\/www\.youtube-nocookie\.com\/embed\/([^&]+))/ig);

    var duration = 0;

    if (matches) { 
        var videoid = matches[1];
        if(videoid){
        $.ajax({
            url: "https://www.googleapis.com/youtube/v3/videos",
            data: {
                key: "AIzaSyDZGzgya2UTYJNGDd3S3r5BofyetrHB_eM",
                part: "contentDetails",
                id: videoid
            },
            success: success,
            error: error
        });
        }
    }
};

var initTimeRecord = function(){
    $("body").prepend(INIT_TIMERECORD_ALERT);
    $btn = $(".btn_timerecord");
    $btn.addClass("btn_timerecord_init");
    $btn.focus();
    $btn.html('<i class="far fa-dot-circle"></i>&nbsp;&nbsp;<b>Click to start recording</b>');
    intervalBlink = setInterval(function() {
        $(".btn_timerecord i, .btn_timerecord b").animate({ opacity: 1 }, 500).animate({ opacity: 0 }, 500);
    }, 1000);
    //sendToBackground("startTimeRecord");
};

var pauseTimeRecord = function(){
    $btn = $(".btn_timerecord");
    $btn.removeClass("btn_timerecord_clicked");
    $btn.html('<i class="fas fa-pause"></i>&nbsp;&nbsp;Paused (Click to resume)');
    $("#border_recording").fadeOut({speed:"normal"});
    sendToBackground("pauseTimeRecord");
};

var startTimeRecord = function(){
    clearInterval(intervalBlink);
    $(".init_timerecord_alert").remove();
    $btn = $(".btn_timerecord");
    $btn.addClass("btn_timerecord_clicked");
    $btn.removeClass("btn_timerecord_init");
    $btn.html('<i class="fas fa-spinner fa-spin fa-3x fa-fw"></i>&nbsp;&nbsp;<b>Recording work time...</b> (Click to pause)');
    $("#border_recording").fadeIn({speed:"normal"});
    sendToBackground("startTimeRecord");
};

// --- tool functions

function convert_time(duration) {
    var a = duration.match(/\d+/g);
    
    if (duration.indexOf('M') >= 0 && duration.indexOf('H') == -1 && duration.indexOf('S') == -1) { a = [0, a[0], 0]; } 
    if (duration.indexOf('H') >= 0 && duration.indexOf('M') == -1) { a = [a[0], 0, a[1]]; }
    if (duration.indexOf('H') >= 0 && duration.indexOf('M') == -1 && duration.indexOf('S') == -1) { a = [a[0], 0, 0]; }
    
    duration = 0;
    if (a.length == 3) {
        duration += parseInt(a[0]) * 3600;
        duration += parseInt(a[1]) * 60;
        duration += parseInt(a[2]);
    }
    if (a.length == 2) {
        duration += parseInt(a[0]) * 60;
        duration += parseInt(a[1]);
    }
    if (a.length == 1) {
        duration += parseInt(a[0]);
    }
    
    return duration
}

jQuery.expr[':'].regex = function(elem, index, match) {
    var matchParams = match[3].split(','),
        validLabels = /^(data|css):/,
        attr = {
            method: matchParams[0].match(validLabels) ? 
            matchParams[0].split(':')[0] : 'attr',
            property: matchParams.shift().replace(validLabels,'')
        },
        regexFlags = 'ig',
        regex = new RegExp(matchParams.join('').replace(/^\s+|\s+$/g,''), regexFlags);
    return regex.test(jQuery(elem)[attr.method](attr.property));
}

$.fn.xpathEvaluate = function (xpathExpression) {
    // NOTE: vars not declared local for debug purposes
    $this = this.first(); // Don't make me deal with multiples before coffee
    
    // Evaluate xpath and retrieve matching nodes
    xpathResult = this[0].evaluate(xpathExpression, this[0], null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
    
    result = [];
    while (elem = xpathResult.iterateNext()) {
        result.push(elem);
    }
    
    $result = jQuery([]).pushStack( result );
    return $result;
}

function getLocation(href) {
    var l = document.createElement("a");
    l.href = href;
    return l;
}


function getParameterByName(name, url) {
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return "";
    if (!results[2]) return "";
    var val = decodeURIComponent(results[2].replace(/\+/g, " "));
    return val;
}
