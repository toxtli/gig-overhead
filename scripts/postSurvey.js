var savedPostSurvey = false;
var postSurveyText = "SuperTurkers Post-HIT Survey&nbsp;<span class='answered' style='color:#c78a1b'>(*You already evaluated this HIT type*)</span>&nbsp;&nbsp;<a href='javascript:void(0);' id='toggle-link' style='text-decoration:underline;'>Show to modify</a>";
var postSurveyAnswered = false;


function postSurvey(has_expired) {
	// console.log("hoge "+has_expired);
	var w = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
	var h = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
	var popup = document.createElement("div");
	var popupText = document.createElement("div");
	var popupSkip = document.createElement("button");
	var popupSubmit = document.createElement("button");
	var popupToggle = document.createElement("div");
	
	popup.id = "endingPopUp";
	
	popup.style.width = "100%";
	popup.style.position = "fixed";
	popup.style.bottom = "0px";
	popup.style.left = "0%";
	popup.style.backgroundColor = "hsla(205, 67%, 90%, 1.0)";
	popup.style.padding = ".5em 1em";
	popup.style.boxShadow = "0px 0px 15px grey";
	popup.style.fontSize = "1em";
	
	popupText.innerHTML = postSurveyText;
	popupText.style.backgroundColor = "rgb(249, 245, 133)";
	popupText.style.fontWeight = "bold";
	popupText.style.width = "80%";
	popupText.style.textAlign = "center";
	popupText.style.margin = "0 auto";

	popup.style.borderTop = ".5em solid white";
	
	popupSubmit.style.width = "25%";
	popupSubmit.style.float = "right";
	popupSubmit.style.margin= "0 auto";
	popupSubmit.style.boxShadow = "0px 0px 15px grey";
	popupSubmit.style.fontSize = "1.2em";
	
	if(has_expired == false){
	$(popupSubmit).click(function(){ 
		$(this).off("click");
		$(this).html("Submitting...");
	
		var results = getSelectedPostSurveyAnswers();
	
		sendToBackground("postSurvey", results, function(){ 
			savedPostSurvey = true;
			$(popup).fadeOut();
			$(popupSubmit).html("Submitted!");
			$(popupSubmit).css("background-color","#f7d4b7");
		});
	});
	
	popupSubmit.innerHTML = "Submit and dismiss";
	popup.appendChild(popupText);
	
	popupToggle.id = "popup-toggle";
	popupToggle.style.margin = "10px 0px";
	popupToggle.style.display = "none";
	popup.appendChild(popupToggle);
	popupToggle.appendChild(makeQuestion("Q1","1. Would you recommend this HIT?"));
	popupToggle.appendChild(makeQuestion("Q2","2. Why would you (not) recommend this HIT?"));
	popupToggle.appendChild(makeQuestion("Q3","3. What was this HIT mostly about (time-consuming)?"));
	popupToggle.appendChild(makeQuestion("Q4",""));
	popupToggle.appendChild(popupSubmit);
	}
	else{
		popup.appendChild(popupText);
	}
	document.body.appendChild(popup);
	$("#toggle-link").click(function(){
		if($("#popup-toggle").is(":visible")){
			$("#popup-toggle").hide();
			$(this).text("Show");
		} else {
			$("#popup-toggle").show();
			$(this).text("Hide");
		}
	});
	
	//setTimeout(reminder, 1000*60*.1); // FOR TESTING - start flashing after 6 seconds
	//setTimeout(reminder, 1000*60*2); // ACTUAL - start flashing after 2 minutes
	
	retrieveSurveyDatabaseData();
}

function togglePopUp(){
	$(".popup-toggle").toggle();
}

function getSelectedPostSurveyAnswers(){
	var ret = {};
	var answers = [];
	for(var i=1; i<=$(".question").length; i++){
		var ans = $("#Q"+i+"Select option:selected").val();
		if(ans!="0") answers.push(ans);
	}
	if(answers.length) {
		ret["group_id"] = mturk_info["group_id"];
		ret["answers"] = JSON.stringify(answers);
	}
	else if(postSurveyAnswered){
		ret["ignore"] = true;
	}
	return ret;
}

function makeQuestion(qNumber, qText){
	var questionDiv = document.createElement("div");
	questionDiv.id = qNumber+"Div";
	questionDiv.className = "question";
	questionDiv.style.float = "left";
	
	var question = document.createElement("span");
	question.style.float = "left";
	question.style.marginRight = "2em";
	question.innerHTML = qText;
	question.style.fontWeight = "900";
	questionDiv.appendChild(question);
	
	var form = document.createElement("form");
	form.style.float = "left";
	form.id=qNumber;
	form.style.margin = "0em 4em 1em 0em";
	var select = document.createElement("select");
	select.id = qNumber+"Select";
	
	var textArr = ["---","Did not work on this HIT","< 5 Minutes","5-10 Minutes","10-15 Minutes","15-20 Minutes","> 20 Minutes"];
	if(qNumber == "Q2"){ textArr = ["---","Audio/Video Transcription","External Information Gathering","Video/Image Tagging/Classification","Image Transcription","Survey","Writing","Other"];}
	if(qNumber == "Q3"){ textArr = ["---","No, HIT was Impossible","Definitely Not","Probably Not","Maybe / Maybe Not","Probably","Definitely"];}
	if(qNumber == "Q4"){ textArr = ["---","Audio","Video","Images","Audio & Video","Images & Video","Audio & Images","All of the Above","None of the Above"];}

	for(i=0;i<textArr.length;i++){
		var addition = "";
		var option = document.createElement("option");
		option.name = i;
		option.value = i;
		option.text = textArr[i];
		form.appendChild(select);
		select.appendChild(option);
		questionDiv.appendChild(form);
	}
	
	return questionDiv;
}


function questionResults(qNumber){
var results;

     var form = document.getElementById(qNumber);
      for (var i = 0, length = form.length; i < length; i++){
        if(form.elements[i].checked){
          results = 1;
        }
      }

  return results;
}

function retrieveSurveyDatabaseData(){//get data from database
	$.ajax({
		type: "GET",
		url: "https://" + serverDomain + "/scraper/post_survey/last/"+mturk_info["worker_id"]+"/"+mturk_info["group_id"],
		dataType: "json",
		success: function(data){
			data = JSON.parse(data);
			if(data!==null){
				for(var i=0; i<data.length; i++){
					var value = data[i];
					var $select = $("#Q"+(i+1)+"Select");
					var $options = $select.children();
					for (var j = 0; j < $options.length; j++){
						if($options[j].value == value){
							$options[j].selected = true;
							if($options[j].value!=0) $select.css("background", "rgb(255, 214, 166)");
							else {
								$("#popup-toggle").show();
								$(".answered").text("");
								$("#toggle-link").text("Show");
							}
						}
					}
				}
			} else {
				$("#popup-toggle").show();
				$(".answered").text("");
				$("#toggle-link").text("Hide");
			}
		}
	});
}

// function reminder() {
//     blinkBorder("red","white","endingPopUp", 800);
// }

// function blinkBorder(colorA, colorB, elementId, time){
//   document.getElementById(elementId).style.borderTop = "5px solid "+colorB ;
//   setTimeout( function(){
//     blinkBorder(colorB, colorA, elementId, time);
//     colorB = null;
//     colorA = null;
//     elementId = null;
//     time = null;
//   } , time) ;
// }

