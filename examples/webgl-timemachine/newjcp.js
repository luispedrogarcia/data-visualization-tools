
//Todo for Paul and John: EXPERT MODE must load expert presentation bar on the bottom of the screen.
$( window ).load(function() {
    

var introview= {center:{"lat":25.343,"lng":38.48112},"zoom":2.837}  // this is what I found to be most aesthetically pleasing
timelapse.setNewView(introview,true)

var introdiv1=""
introdiv1+='<div class="explainborder" id="popupdiv">' 
////////////////////////////////////   #initial is set as 300% to have 3 different screens

introdiv1+='<div class="explainborderleft" onclick="goback()">'
introdiv1+='&#10094'
introdiv1+='</div>'

introdiv1+=     '<div class="explain blender" id="initial">'
introdiv1+=         '<div class="row">'

introdiv1+=             '<div class="colz-4" id="firstinitial">'
introdiv1+=                 'EARTH </br> Timelapse </br>'
introdiv1+=                 '<button class="gbutton" id="explorebutton" style="margin-top:50px;" onclick="exploreclicked()"> Explore &nbsp &#10095</button></a>'
introdiv1+=             '</div>'

introdiv1+=             '<div class="colz-4" style="overflow:scroll">'
introdiv1+=                 '<div class="colz-12 storieshead">Explore</div>'
introdiv1+=                 '<div id="video_div_here"></div>'
introdiv1+=             '</div>'

introdiv1+=             '<div class="colz-4" id="secondinitial">'
introdiv1+=             '</div>'
introdiv1+=         '</div>'
introdiv1+=     '</div>'

introdiv1+='</div>'


var directionnav=""
directionnav+='<div class="bottomDirectionNav ">'
directionnav+='<div style="text-align:center;">'
// The bottom 3 code is a 3 navigational button that I created for my purpose 
// directionnav+=             '<button class="jcpnavbutton" id="backbutton" onclick="goback()" style="margin-top:-100px"> &#10094 </button>' 
// directionnav+=             '<button class="jcpnavbutton" id="introopenclosebutton" onclick="hide_intro()" style="margin-top:-100px">- </button>'
// directionnav+=             '<button class="jcpnavbutton" id="forwardbutton" onclick="goforward()" style="margin-top:-100px"> &#10095 </button>'
directionnav+=             '<button class="jcpnavbutton" onclick="show_intro()" > Show Intro </button>'
directionnav+='</div>'
directionnav+='</div>'

$("#timeMachine").append(introdiv1)
$(".explainborderleft").hide(); //initially we must hide the left back button
$("#timeMachine").append(directionnav) 
$(".bottomDirectionNav").hide()


///////////////////////////////

var expertButton = "<button class='expertmodeButton' onclick='startExpert()'>Expert</button>"
$("#timeMachine").append(expertButton)

function createStoryDiv(){
    var col=STORIES_CONFIG.column_numbers;
    var stories=STORIES_CONFIG.story_lists;
    for (key in stories){
        var s=key+"_video_div"
        window[s]="";
        window[s]+='<div class="colz-'+String(12/col)+'">'
        window[s]+='<div class="vidContainer" id="'+key+'_vid_button" >'
        window[s]+=    '<div class="videotext blender">'+STORIES_CONFIG.story_lists[key].heading_text +'</div>'
        window[s]+=    '<video id="'+key+'video" poster="jcpassets/pandemics.jpg" onclick=storyclicked("'+String(key) +'") loop >'
        window[s]+=        '<source src="'+STORIES_CONFIG.story_lists[key].vid_url+'" type="video/ogg"/>'
        window[s]+=    '</video>'
        window[s]+='</div>'
        window[s]+='</div>'

        $("#video_div_here").append(window[s]);
        // document.getElementById(key+"video").playbackRate=10;
        document.getElementById(key+"video").play();
        // document.getElementById(key+"video")=10;
        var vidbutton=key+"_vid_button"
    }
}
createStoryDiv();

//// Expert Mode Stuff
$(".toggleLayerPanelBtn").click(); 
$(".toggleLayerPanelBtn").click(function(){
  
    if ($("#layers-list").hasClass("hide-layers-list")){
        $(".expertmodeButton").show();
         $(".relatableContent").remove();
    }
    else{
         $(".relatableContent").remove();
    }    
})
////////





}); // Dont delete this bracket 








function exploreclicked(){
    // hide_presentationSlider();
    $( "#initial" ).animate({
                    opacity: 1,
                    left: "-=100%",
    }, 500);
    $(".explainborderleft").show();
    $(".explainborder").css("overflow-y","scroll");
}

function populatestory(category){
    window[category+"_story_div"]=""
    window[category+"_story_div"]+='<div class="colz-12">'
    window[category+"_story_div"]+=STORIES_CONFIG.story_lists[category].heading_text
    window[category+"_story_div"]+='</div>'
    window[category+"_story_div"]+='<div class="colz-6">'
    window[category+"_story_div"]+='<img src="'+STORIES_CONFIG.story_lists[category].img_url +'"style="width:90%;height:auto;"/>'
    window[category+"_story_div"]+='</div>'
    window[category+"_story_div"]+='<div class="colz-6">'
    window[category+"_story_div"]+='<div style="font-size:2vh;height:40vh;text-align:left; overflow-y: scroll;margin-right:10%;">'
    for (var i=0;i<STORIES_CONFIG.story_lists[category].img_descript.length;i++){ // this is in paragraph form. It uses array of "img_descript"
        window[category+"_story_div"]+=STORIES_CONFIG.story_lists[category].img_descript[i];
        if (i==STORIES_CONFIG.story_lists[category].img_descript.length-1){
            window[category+"_story_div"]+='</br>'
        }
    }
    window[category+"_story_div"]+='A pandemic (from Greek πᾶν pan "all" and δῆμος demos "people") is an epidemic of infectious disease that has spread through human populations across a large region; for instance multiple continents, or even worldwide. A widespread endemic disease that is stable in terms of how many people are getting sick from it is not a pandemic. Further, flu pandemics generally exclude recurrences of seasonal flu. Throughout history, there have been a number of pandemics, such as smallpox and tuberculosis. One of the most devastating pandemics was the Black Death, killing over 75 million people in 1350. The most recent pandemics include the HIV pandemic as well as the 1918 and 2009 H1N1 pandemics.'
    window[category+"_story_div"]+='</div>'
    window[category+"_story_div"]+='</div>'
    window[category+"_story_div"]+='<button class="tourButton" onClick="startTour('+"'"+category+"'" +')">Open '+ category+'</button>'
    $("#secondinitial").html(window[category+"_story_div"])
}

function storyclicked(category){ // this uses storiesjcp.js configuration file
    $(".explainborder").scrollTop(0);
    $(".explainborder").css("overflow-y","hidden")
    populatestory(category);
    $( "#initial" ).animate({
        opacity: 1,
        left: "-=100%",
        }, 500);
        deploySlide(String(category));
}

function goback(){
    $(".explainborder").scrollTop(0);
    $(".explainborder").css("overflow-y","hidden")
    if ($("#initial").css("left")!="0px"){
        $( "#initial" ).animate({
                        opacity: 1,
                        left: "+=100%",
            }, 500,function(){

                if ($("#initial").css("left") == "0px"){
                    $(".explainborderleft").hide();
                    $(".explainborder").css("overflow-y","hidden")
                }
                else{
                    $(".explainborder").css("overflow-y","scroll")
                }
        });
    }
}
function goforward(){
    $( "#initial" ).animate({
        opacity: 1,
        left: "-=100%",
    }, 500);
    $(".explainborderleft").show();
}
function hide_intro(){
   $(".explainborder").hide("slide", {direction: "up" }, "slow");
   $(".bottomDirectionNav").show("slide", {direction: "down" }, "slow") // this is show intro button
}
function show_intro(){
     $(".bottomDirectionNav").hide()
    $(".relatableContent").remove();
    $(".explainborder").show();
    if (!$("#layers-list").hasClass("hide-layers-list")){
        $(".toggleLayerPanelBtn").click(); 

    }
}

function deploySlide(gurl){
    gurl=STORIES_CONFIG.story_lists[gurl]
    gurl=gurl.slide_url;
    currentSlideUrl=gurl
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

function expertSlide(url){ // expert url is in storiesjcp ocnfig file under JCP_EXPERT_WAYPOINT_URL
    currentSlideUrl=url;
    var snaplapseForPresentationSlider = timelapse.getSnaplapseForPresentationSlider();
    if (snaplapseForPresentationSlider) {
        snaplapseViewerForPresentationSlider = snaplapseForPresentationSlider.getSnaplapseViewer();
    }
    var waypointSliderContentPath=url;
    org.gigapan.Util.gdocToJSON(waypointSliderContentPath, function(csvdata) {
        var waypointJSON = JSON.parse(snaplapseForPresentationSlider.CSVToJSON(csvdata));
        var waypointSliderContent = "#presentation=" + snaplapseForPresentationSlider.getAsUrlString(waypointJSON.snaplapse.keyframes);
        timelapse.loadSharedDataFromUnsafeURL(waypointSliderContent);
    });
}



function startTour(category){  // initialized after user clicks start timelapse button
     hide_intro();
     $(".snaplapse_keyframe_list_item_thumbnail_overlay_presentation")[0].click();
     var relatableContent="";
     relatableContent+='<div class="relatableContent">'
     relatableContent+='<div class="relatableContentHead">How does '+category+' relate to... </div>'
     r_categories=CONNECTION_CONFIG[String(category)]
     for (var i=0;i<r_categories.length;i++){
         relatableContent+=     '<button class="contentButton"  onclick="getintroagain('+"'"+r_categories[i]+"'"+')">'+r_categories[i]+'</button></br>'
     }
     relatableContent+='</div>'
     $("#timeMachine").append(relatableContent);
    var curheight=$(".relatableContent").css("height")
     $(".relatableContentHead").click(function(){
         if ($(".relatableContent").css("height")!="40px"){
            $(".relatableContent").animate({height:"40px"},500);
         }
         else{
             $(".relatableContent").animate({height:curheight},500);
         }
     })
}


function getintroagain(category){ // this uses storiesjcp.js configuration file
     $(".relatableContent").remove();
    populatestory(category);
    show_intro();
    deploySlide(String(category));
}


var currentSlideUrl="" //string cache that tracks current slide's Google Doc URL. 

function startExpert(){
    hide_intro();
    if (currentSlideUrl != JCP_EXPERT_WAYPOINT_URL)
    {
        expertSlide(JCP_EXPERT_WAYPOINT_URL)
    }
    $(".toggleLayerPanelBtn").click(); 
    $(".expertmodeButton").hide();
}
