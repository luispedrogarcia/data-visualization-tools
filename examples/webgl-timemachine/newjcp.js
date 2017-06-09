////// THIS IS WHERE ALL THE WINDOW LOAD STARTS
$( window ).load(function() {

var introview= {center:{"lat":25.343,"lng":38.48112},"zoom":2.837}
timelapse.setNewView(introview,true)


////////DELETE THIS ONE
// testing out the right sidebar with hamburger. THIS IS ONE NEEDS TO BE DELETED
function createSidebar(w,color){
    var sidebar='<div id="sidebar" style="position: fixed; display: inline-block; top: 0px; height: 100%; width: 500px; right: -500px; background-color:#ff0; transition: all 0.2s ease-in-out; z-index:98;"></div>'
}
var sidebardiv='<div id="sidebar" style="position: fixed; display: inline-block; top: 0px; height: 100%; width: 500px; right: -500px; background-color:#ff0; transition: all 0.2s ease-in-out; z-index:98;"></div>'
$("#timeMachine").append(sidebardiv);

//// delete above stuff
var yeardiv="<div id='jcpYearDiv'></div>"
$("#timeMachine").append(yeardiv);
//// this is a bigger date field
///////////////////////////////////

var introdiv1=""
introdiv1+='<div class="explainborder" id="popupdiv">'
////////////////////////////////////   #initial is set as 300% to have 3 different screens
introdiv1+='<div class="explainborderhead"><button onclick="hide_intro()">✖</button>'
introdiv1+='</div>'
introdiv1+=     '<div class="explain blender" id="initial">'
introdiv1+=         '<div class="row">'
introdiv1+=             '<div class="colz-4" id="firstinitial">'
introdiv1+=                 'EARTH </br> Timelapse </br>'
introdiv1+=                 '<button class="gbutton" id="explorebutton" style="margin-top:50px;" onclick="exploreclicked()"> Explore &nbsp &#10095</button></a>'
introdiv1+=             '</div>'
introdiv1+=             '<div class="colz-4" id="video_div_here">'
// introdiv1+=                 storydiv;
introdiv1+=             '</div>'
introdiv1+=                 '<div class="colz-4" id="secondinitial">'
introdiv1+=             '</div>'
introdiv1+=         '</div>'
introdiv1+=     '</div>'
//////////////////////////////////////
introdiv1+=     '<div class="explainborderbottom">'
introdiv1+=         '<div style="text-align:center;">'
introdiv1+=             '<button class="jcpnavbutton" onclick="goback()" style="margin-top:-100px"> &#10094 </button>'
introdiv1+=             '<button class="jcpnavbutton" onclick="hide_intro()" style="margin-top:-100px">close intro </button>'
introdiv1+=             '<button class="jcpnavbutton" onclick="goforward()" style="margin-top:-100px"> &#10095 </button>'
introdiv1+=         '</div>'
introdiv1+=     '</div>'
introdiv1+='</div>'


$("#timeMachine").append(introdiv1);





function createStoryDiv(){
    var col=STORIES_CONFIG.column_numbers;
    var stories=STORIES_CONFIG.story_lists;
   
    $("#video_div_here").append( '<div class="colz-12">CATEGORIES</div>');
    for (key in stories){
        console.log(key);
        var s=key+"_video_div"
        window[s]="";
        window[s]+='<div class="colz-'+String(12/col)+'">'
        window[s]+='<div class="vidContainer" id="'+key+'_vid_button" style="z-index:0;width:100%;height:100%;"onclick=storyclicked("'+String(key) +'")>'
        window[s]+=    '<div class="videotext blender">'+STORIES_CONFIG.story_lists[key].heading_text +'</div>'
        window[s]+=    '<video id="'+key+'video" poster="/static/img/earth.png" style="height:100%;position:relative;z-index:1;width:100%;" loop >'
        window[s]+=        '<source src="'+STORIES_CONFIG.story_lists[key].vid_url+'" type="video/ogg"/>'
        window[s]+=    '</video>'
        window[s]+='</div>'
        window[s]+='</div>'
        // console.log(window[s])
        $("#video_div_here").append(window[s]);
        document.getElementById(key+"video").play();
        var vidbutton=key+"_vid_button"
       
    }
}
createStoryDiv();


// $( "#explorebutton" ).click(); //for debugging, skips the explore button click part

$(".toggleLayerPanelBtn").click(); //another debugging. closes down button


// show intro button next to the share button
var intro_show_button=""
intro_show_button+="<button class='show_intro_button'onclick='show_intro()'>Show Intro</button>";
$("#timeMachine").append(intro_show_button);

// Full Screen button next to show intro button
var full_screen_button=""
full_screen_button+="<button class='full_screen_button'onclick='fullScreenMode()'>Full Screen</button>";
$("#timeMachine").append(full_screen_button);



hide_presentationSlider();    
});





/////////////////////////////////
function hide_presentationSlider(){
    $(".presentationSlider").hide();
    // $(".player").css("bottom","0px")
    // $("#timeMachine_timelapse").css("bottom")
}
function show_presentationSlider(){
    $(".presentationSlider").show();
}
function hide_customControl(){
    $(".customControl").hide();
    // $(".player").css("bottom","0px")
    // $("#timeMachine_timelapse").css("bottom")
}
function show_customControl(){
    $(".customControl").show();
}
var fullscreenstat=0;
function fullScreenMode(){
    if (fullscreenstat==0){
         $(".full_screen_button").html("Exit Full Screen");
         fullscreenstat=1;
         enter_fullScreenMode();

    }
    else {
         $(".full_screen_button").html("Full Screen")
         exit_fullScreenMode();
         fullscreenstat=0;
    }
}
function enter_fullScreenMode(){
    hide_presentationSlider();
    hide_customControl();
    hide_intro();

}
function exit_fullScreenMode(){
    show_presentationSlider();
    show_customControl();
}
function detectTimeChange(){

    $('.timeText').bind("DOMSubtreeModified",function(){
    // console.log($('.timeText').html());
    $("#jcpYearDiv").html($('.timeText').html())
    });
}
/////////////////








function exploreclicked(){
    $( "#initial" ).animate({
                    opacity: 1,
                    left: "-=100%",
                    // height: "toggle"
    }, 500,function(){
        console.log("complete");

    });

}


var refugee_story_div=""
refugee_story_div+='<div class="colz-12">'
refugee_story_div+="Refugee Crisis"
refugee_story_div+='</div>'
refugee_story_div+='<div class="colz-6">'
refugee_story_div+='<img src="jcpassets/refugee.jpg" style="width:90%;height:auto;"/>'
refugee_story_div+='</div>'
refugee_story_div+='<div class="colz-6">'
refugee_story_div+='<div style="font-size:1vw;text-align:left;">'
refugee_story_div+='Refugee crisis can refer to movements of large groups of displaced persons, who could be either internally displaced persons, refugees or other migrants. It can also refer to incidents in the country of origin or departure, to large problems whilst on the move or even after arrival in a safe country that involve large groups of displaced persons.'
refugee_story_div+="Back in 2006, there were 8.4 million UNHCR registered refugees worldwide, which was the lowest number since 1980. At the end of 2015, there were 16.1 million refugees worldwide. When adding the 5.2 million Palestinian refugees who are under UNRWA's mandate there are 21.3 million refugees worldwide. The overall forced displacement worldwide has reached to a total of 65.3 million displaced persons in the end of 2015, while it was 59.5 million 12 months earlier. One in every 113 people globally is an asylum seeker or a refugee. In 2015, the total number of displaced people worldwide, including refugees, asylum seekers and internally displaced persons, was at its highest level on record."
refugee_story_div+='</div>'
refugee_story_div+='</div>'

var pandemics_story_div=""
pandemics_story_div+='<div class="colz-12">'
pandemics_story_div+="Pandemics"
pandemics_story_div+='</div>'
pandemics_story_div+='<div class="colz-6">'
pandemics_story_div+='<img src="jcpassets/pandemics.jpg" style="width:90%;height:auto;"/>'
pandemics_story_div+='</div>'
pandemics_story_div+='<div class="colz-6">'
pandemics_story_div+='<div style="font-size:1vw;text-align:left;">'
pandemics_story_div+='A pandemic (from Greek πᾶν pan "all" and δῆμος demos "people") is an epidemic of infectious disease that has spread through human populations across a large region; for instance multiple continents, or even worldwide. A widespread endemic disease that is stable in terms of how many people are getting sick from it is not a pandemic. Further, flu pandemics generally exclude recurrences of seasonal flu. Throughout history, there have been a number of pandemics, such as smallpox and tuberculosis. One of the most devastating pandemics was the Black Death, killing over 75 million people in 1350. The most recent pandemics include the HIV pandemic as well as the 1918 and 2009 H1N1 pandemics.'
pandemics_story_div+='</div>'
pandemics_story_div+='</div>'

function storyclicked(category){
    // alert(category)
    $( "#initial" ).animate({
        opacity: 1,
        left: "-=100%",
        }, 500);
        $("#secondinitial").html(window[category+"_story_div"])
        deploySlide(window[category+"_url"])
}

function goback(){
    $( "#initial" ).animate({
                    opacity: 1,
                    left: "+=100%",
                    // height: "toggle"
        }, 500,function(){
            console.log("complete");
            
        });
}
function goforward(){
    $( "#initial" ).animate({
                    opacity: 1,
                    left: "-=100%",
                    // height: "toggle"
        }, 500,function(){
            console.log("complete");
            
        });
}
function hide_intro(){
    $(".explainborder").hide();
}
function show_intro(){
    $(".explainborder").show();
}

//hiding .presentationSlider


////

// implement fullscreen mode?



//////// bottom presentation slider deployment with different google doc urls
var refugee_url="https://docs.google.com/spreadsheets/d/1JLY9J4XYsWaz-lD8tzAIF1oBjaxIQbqe0AISt5Q48ro/edit#gid=1769400286";
var pandemics_url="https://docs.google.com/spreadsheets/d/1JLY9J4XYsWaz-lD8tzAIF1oBjaxIQbqe0AISt5Q48ro/edit#gid=0";

function deploySlide(gurl){
    var snaplapseForPresentationSlider = timelapse.getSnaplapseForPresentationSlider();
    if (snaplapseForPresentationSlider) {
        snaplapseViewerForPresentationSlider = snaplapseForPresentationSlider.getSnaplapseViewer();
    }
    var waypointSliderContentPath=gurl;
    org.gigapan.Util.gdocToJSON(waypointSliderContentPath, function(csvdata) {
        var waypointJSON = JSON.parse(snaplapseForPresentationSlider.CSVToJSON(csvdata));
        var waypointSliderContent = "#presentation=" + snaplapseForPresentationSlider.getAsUrlString(waypointJSON.snaplapse.keyframes);
        timelapse.loadSharedDataFromUnsafeURL(waypointSliderContent);
    });
}

function toggle_sidebar()
{
    var sidebar = document.getElementById("sidebar");        
    console.log(sidebar.style.left);
    if(sidebar.style.right == "-200px"){
        sidebar.style.right = "0px";
    }
    else{
        sidebar.style.right = "-200px";
    }
}