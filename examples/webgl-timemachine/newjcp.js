$( window ).load(function() {
var introview= {center:{"lat":25.343,"lng":38.48112},"zoom":2.837}
timelapse.setNewView(introview,true)



// testing out the right sidebar with hamburger
var sidebardiv='<div id="sidebar" style="position: fixed; display: inline-block; top: 0px; height: 100%; width: 200px; right: -200px; background-color:#ff0; transition: all 0.2s ease-in-out; z-index:98;"></div>'
$("#timeMachine").append(sidebardiv);
/////

var introdiv1=""
introdiv1+='<div class="explainborder" id="popupdiv">'
introdiv1+=     '<div class="explain blender">'
introdiv1+=         '<div class="initial">'
introdiv1+=             'EARTH </br> Timelapse </br>'
introdiv1+=             '<button class="gbutton" id="explorebutton" style="margin-top:50px;" onclick="exploreclicked()"> Explore &nbsp &#10095</button></a>'
introdiv1+=         '</div>'
introdiv1+=     '</div>'
introdiv1+='</div>'

$("#timeMachine").append(introdiv1);

var test="<div class='explaincontainer'>z</div>"
$("#timeMachine").append(test);




});

