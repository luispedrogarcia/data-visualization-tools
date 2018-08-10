(function () {
  "use strict";

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////
  //
  // Create the class
  //
  var StoryEditor = function (timelapse, settings) {
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //
    // Variables
    //
    var container_id = settings["container_id"];
    var on_show_callback = settings["on_show_callback"];
    var on_hide_callback = settings["on_hide_callback"];
    var set_view_tool;
    var $container = $("#" + container_id);
    var $this;
    var $intro, $theme_metadata, $story_metadata, $waypoints, $load;

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //
    // Private methods
    //
    function init() {
      $.ajax({
        dataType: "html",
        url: "StoryEditor.html",
        success: function (html_template) {
          creatUI(html_template);
          show();
          timelapse.pause();
        },
        error: function () {
          console.log("Error loading the story editor html template.");
        }
      });
    }

    function creatUI(html_template) {
      $container.append($(html_template));
      $this = $("#" + container_id + " .story-editor");

      // For setting a view from the timelapse viewer
      set_view_tool = new SetViewTool(timelapse, {
        container_id: container_id,
        on_view_set_callback: function() {
          $this.show();
          set_view_tool.hide();
        }
      });

      // The introduction page
      $intro = $("#" + container_id + " .story-editor-intro");
      $intro.find(".story-editor-create-button").on("click", function () {
        transition($intro, $theme_metadata);
      });
      $intro.find(".story-editor-edit-button").on("click", function () {
        transition($intro, $load);
      });

      // For creating a theme
      $theme_metadata = $("#" + container_id + " .story-editor-theme-metadata");
      $theme_metadata.find(".back-button").on("click", function () {
        transition($theme_metadata, $intro);
      });
      $theme_metadata.find(".next-button").on("click", function () {
        transition($theme_metadata, $story_metadata);
      });

      // For creating a story
      $story_metadata = $("#" + container_id + " .story-editor-story-metadata");
      $story_metadata.find(".back-button").on("click", function () {
        transition($story_metadata, $theme_metadata);
      });
      $story_metadata.find(".next-button").on("click", function () {
        transition($story_metadata, $waypoints);
      });
      $story_metadata.find(".story-editor-set-cover-view-button").on("click", function () {
        set_view_tool.show();
        $this.hide();
      });

      // For adding waypoints
      $waypoints = $("#" + container_id + " .story-editor-waypoints");
      $waypoints.find(".back-button").on("click", function () {
        transition($waypoints, $story_metadata);
      });
      $waypoints.find(".next-button").on("click", function () {
        // download the story as a spreadsheet
      });
      $waypoints.find(".story-editor-accordion").accordion({
        header: "> div > h3",
        heightStyle: "content",
        animate: false
      }).sortable({
        axis: "y",
        handle: "h3",
        stop: function (event, ui) {
          // IE doesn't register the blur when sorting
          // so trigger focusout handlers to remove .ui-state-focus
          ui.item.children("h3").triggerHandler("focusout");
          // Refresh accordion to handle new order
          $(this).accordion("refresh");
        }
      });
      $waypoints.find("[role=tab]").off("keydown"); // needed for typing space in the title textbox
      $waypoints.find(".story-editor-set-waypoint-view").on("click", function(){
        set_view_tool.show();
        $this.hide();
      });

      // For loading a Google spreadsheet
      $load = $("#" + container_id + " .story-editor-load");
      $load.find(".back-button").on("click", function () {
        transition($load, $intro);
      });
      $load.find(".next-button").on("click", function () {
        //transition($load, );
      });
    }

    // Make a transition from one DOM element to another
    function transition($from, $to) {
      var d = 0;
      if (typeof $from !== "undefined") {
        $from.fadeOut(d, function () {
          if (typeof $to !== "undefined") {
            $to.fadeIn(d);
          }
        });
      } else {
        if (typeof $to !== "undefined") {
          $to.fadeIn(d);
        }
      }
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //
    // Privileged methods
    //
    var show = function () {
      if ($this.is(":visible")) return;
      $this.show();
      if (typeof on_show_callback === "function") {
        on_show_callback();
      }
    };
    this.show = show;

    var hide = function () {
      if (!$this.is(":visible")) return;
      $this.hide();
      if (typeof on_hide_callback === "function") {
        on_hide_callback();
      }
    };
    this.hide = hide;

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //
    // Constructor
    //
    init();
  };

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////
  //
  // Register to window
  //
  if (!window.StoryEditor) {
    window.StoryEditor = StoryEditor;
  }
})();
