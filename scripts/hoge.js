var text = getTextFromHTML();

var anchorURLs = getAllAnchorHrefs();
var textURLs = extractURLsFromText(text);

var extURLs = anchorURLs.concat(textURLs);
var imgURLs = getAllImgSrcs();
var audioURLs = getAllAudioSrcs();
var videoURLs = getAllVideoSrcs();

var getAllAnchorHrefs = function(){
    var urlList = [];
    $("a").each(function() {
        var a = document.createElement("a");
        a.href = $(this).attr("href");
        if($.inArray(a.href, urlList) === -1) urlList.push(a.href);
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
        var a = document.createElement("a");
        a.href = $(this).attr("href");
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
        var a = document.createElement("a");
        a.href = $(this).attr("href");
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
        var a = document.createElement("a");
        a.href = $(this).attr("href");
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


var getQualification = function(){
    var qualNum = $("li.qualifications-table-row>div>span:nth-child(1)>span").length;
    var qualList = [];
    for(var i=0; i<qualNum; i++) {
        var qualification = $("li.qualifications-table-row>div>span:nth-child(1)>span").eq(i).text();
        var value = $("li.qualifications-table-row>div>span:nth-child(2)>span").eq(i).text();
        var author = $("li.qualifications-table-row>div>span:nth-child(3)").eq(i).text();
        qualList.push({"qualification": qualification, "value": value, "author": author});
    }

    return qualList;
};
