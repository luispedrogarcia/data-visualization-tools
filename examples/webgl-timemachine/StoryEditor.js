// This is the story editor for the EarthTime project
// [https://github.com/CMU-CREATE-Lab/data-visualization-tools]
// Files:
// - StoryEditor.js
// - StoryEditor.html
// - StoryEditor.css
// Dependencies:
// - jQuery [https://jquery.com/]
// - Papa Parse [https://www.papaparse.com/]
// - time machine [https://github.com/CMU-CREATE-Lab/timemachine-viewer]
// - the wizard template [wizard.css]
// TODO: need to prevent the keyboard from firing events that control the viewer
// TODO: download() function does not work for Firefox
// TODO: load the themes for the story tab and make the switching theme function work

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
    settings = safeGet(settings, {});
    var util = timelapse.getUtil();
    var container_id = settings["container_id"];
    var on_show_callback = settings["on_show_callback"];
    var on_hide_callback = settings["on_hide_callback"];
    var $this;
    var $intro;
    var $current_thumbnail_preview;
    var set_view_tool;

    // For creating new stories
    var $theme, $theme_title, $theme_description;
    var $story, $story_title, $story_description, $story_author, $story_view, $story_thumbnail_preview;
    var $waypoints, waypoints_accordion;
    var $save;

    // For editing stories
    var $edit_load, $sheet_url;
    var $edit_theme, edit_theme_accordion;
    var $edit_story, edit_story_accordion, $edit_story_select_theme;
    var $edit_waypoints, edit_waypoints_accordion;
    var $edit_save;

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
      $("#" + container_id).append($(html_template));
      $this = $("#" + container_id + " .story-editor");
      createSetViewTool();
      createIntroductionUI();

      // For creating new stories
      createNewThemeUI();
      createNewStoryUI();
      createNewWaypointUI();
      createNewSaveUI();

      // For editing stories
      createEditLoadUI();
      createEditThemeUI();
      creatEditStoryUI();
      createEditWaypointUI();
      createEditSaveUI();
    }

    // For setting a view from the timelapse viewer
    function createSetViewTool() {
      set_view_tool = new SetViewTool(timelapse, {
        container_id: container_id,
        on_view_set_callback: function (urls) {
          setThumbnailPreview(urls, $current_thumbnail_preview);
          $this.show();
          set_view_tool.hide();
        },
        on_cancel_callback: function () {
          $this.show();
          set_view_tool.hide();
        },
        on_hide_callback: function () {
          $current_thumbnail_preview = null;
        }
      });
    }

    // The introduction page
    function createIntroductionUI() {
      $intro = $this.find(".story-editor-intro");
      $intro.find(".story-editor-create-button").on("click", function () {
        transition($intro, $theme);
      });
      $intro.find(".story-editor-edit-button").on("click", function () {
        transition($intro, $edit_load);
      });
    }

    // For creating a new theme
    function createNewThemeUI() {
      $theme = $this.find(".story-editor-theme");
      $theme.find(".back-button").on("click", function () {
        transition($theme, $intro);
      });
      $theme.find(".next-button").on("click", function () {
        transition($theme, $story);
      });
      $theme_title = $theme.find(".story-editor-theme-title-textbox");
      $theme_description = $theme.find(".story-editor-theme-description-textbox");
    }

    // For creating a new story
    function createNewStoryUI() {
      $story = $this.find(".story-editor-story");
      $story.find(".back-button").on("click", function () {
        transition($story, $theme);
      });
      $story.find(".next-button").on("click", function () {
        transition($story, $waypoints);
      });
      $story.find(".story-editor-set-cover-view-button").on("click", function () {
        $current_thumbnail_preview = $story.find(".story-editor-thumbnail-preview");
        set_view_tool.show();
        $this.hide();
      });
      $story_thumbnail_preview = $story.find(".story-editor-thumbnail-preview").hide();
      $story_title = $story.find(".story-editor-story-title-textbox");
      $story_description = $story.find(".story-editor-story-description-textbox");
      $story_author = $story.find(".story-editor-story-author-textbox");
      $story_view = $story.find(".story-editor-thumbnail-preview-landscape");
    }

    // For creating new waypoints
    function createNewWaypointUI() {
      $waypoints = $this.find(".story-editor-waypoints");
      $waypoints.find(".back-button").on("click", function () {
        transition($waypoints, $story);
      });
      $waypoints.find(".next-button").on("click", function () {
        transition($waypoints, $save);
      });
      waypoints_accordion = createAccordion({
        accordion: "#" + container_id + " .story-editor-waypoints .custom-accordion",
        delete_confirm_dialog: "#" + container_id + " .story-editor-waypoints .delete-confirm-dialog"
      });
    }

    // For saving a newly created story
    function createNewSaveUI() {
      var $next_confirm_dialog;
      $save = $this.find(".story-editor-save");
      $save.find(".back-button").on("click", function () {
        transition($save, $waypoints);
      });
      $save.find(".next-button").on("click", function () {
        $next_confirm_dialog.dialog("open"); // check if the user truely wants to finish
      });
      $save.find(".story-editor-download-button").on("click", function () {
        download(dataToTsv(collectNewStoryData()));
      });
      $next_confirm_dialog = createConfirmDialog({
        selector: "#" + container_id + " .story-editor-save .next-confirm-dialog",
        action_callback: function () {
          resetNewStoryUI();
          transition($save, $intro);
        }
      });
    }

    // Reset the user interface for creating new stories
    function resetNewStoryUI() {
      $theme_title.val("");
      $theme_description.val("");
      $story_title.val("");
      $story_description.val("");
      $story_author.val("");
      $story_thumbnail_preview.find("a").prop("href", "javascript:void(0)");
      $story_thumbnail_preview.find("img").prop("src", "");
      $story_thumbnail_preview.hide();
      waypoints_accordion.reset();
    }

    // Collect newly created story data from the user interface
    function collectNewStoryData() {
      // For waypoints
      var waypoints = [];
      waypoints_accordion.getTabs().each(function () {
        var $ui = $(this);
        var d = {
          waypoint_title: $ui.find(".story-editor-title-textbox").val().trim(),
          waypoint_long_title: $ui.find(".story-editor-long-title-textbox").val().trim(),
          waypoint_description: $ui.find(".story-editor-description-textbox").val().trim(),
          waypoint_view: safeGet($ui.find(".story-editor-thumbnail-preview-landscape").data("view"))
        };
        if (hasContent(d)) waypoints.push(d);
      });

      // For stories
      var stories = [];
      var d = {
        story_title: $story_title.val().trim(),
        story_description: $story_description.val().trim(),
        story_author: $story_author.val().trim(),
        story_view: safeGet($story_view.data("view")),
        waypoints: waypoints
      };
      if (hasContent(d)) stories.push(d);

      // For theme
      var data = [];
      var d = {
        theme_title: $theme_title.val().trim(),
        theme_description: $theme_description.val().trim(),
        stories: stories
      };
      if (hasContent(d)) data.push(d);
      return data;
    }

    // For loading a Google spreadsheet
    function createEditLoadUI() {
      $edit_load = $this.find(".story-editor-load");
      $edit_load.find(".back-button").on("click", function () {
        transition($edit_load, $intro);
      });
      $edit_load.find(".next-button").on("click", function () {
        $edit_load.find(".next-button").prop("disabled", true);
        // This util function name is misleading, it converts spreadsheet into csv, not json
        util.gdocToJSON($sheet_url.val(), function (tsv) {
          var data = tsvToData(tsv);
          updateEditThemeUI(data); // forward update UI
          transition($edit_load, $edit_theme);
          $edit_load.find(".next-button").prop("disabled", false);
        });
      });
      $sheet_url = $edit_load.find(".sheet-url-textbox");
      $sheet_url.val("https://docs.google.com/spreadsheets/d/1dn6nDMFevqPBdibzGvo9qC7CxwxdfZkDyd_ys6r-ODE/edit#gid=145707723");
    }

    // For editing themes loaded from a spreadsheet
    function createEditThemeUI() {
      var $back_confirm_dialog, $next_confirm_dialog;
      $edit_theme = $this.find(".story-editor-edit-theme");
      $edit_theme.find(".back-button").on("click", function () {
        // We do not have to update data backward here, since all unsaved data will be lost
        $back_confirm_dialog.dialog("open"); // check if the user truely wants to load another sheet
      });
      $edit_theme.find(".next-button").on("click", function () {
        // Check if the user selects a tab
        if (edit_theme_accordion.getActiveTab().length > 0) {
          updateEditStoryUI(); // forward update UI
          transition($edit_theme, $edit_story);
        } else {
          $next_confirm_dialog.dialog("open");
        }
      });
      edit_theme_accordion = createAccordion({
        accordion: "#" + container_id + " .story-editor-edit-theme .custom-accordion",
        delete_confirm_dialog: "#" + container_id + " .story-editor-edit-theme .delete-confirm-dialog"
      });
      $back_confirm_dialog = createConfirmDialog({
        selector: "#" + container_id + " .story-editor-edit-theme .back-confirm-dialog",
        action_callback: function () {
          transition($edit_theme, $edit_load);
        }
      });
      $next_confirm_dialog = createConfirmDialog({
        selector: "#" + container_id + " .story-editor-edit-theme .next-confirm-dialog"
      });
    }

    // For editing a story in a selected theme
    function creatEditStoryUI() {
      var $next_confirm_dialog;
      $edit_story = $this.find(".story-editor-edit-story");
      $edit_story.find(".back-button").on("click", function () {
        updateEditStoryData(); // backward update data
        transition($edit_story, $edit_theme);
      });
      $edit_story.find(".next-button").on("click", function () {
        // Check if the user selec ts a tab
        if (edit_story_accordion.getActiveTab().length > 0) {
          updateEditWaypointUI(); // forward update UI
          transition($edit_story, $edit_waypoints);
        } else {
          $next_confirm_dialog.dialog("open");
        }
      });
      $edit_story_select_theme = $edit_story.find(".story-editor-selected-theme");
      edit_story_accordion = createAccordion({
        accordion: "#" + container_id + " .story-editor-edit-story .custom-accordion",
        delete_confirm_dialog: "#" + container_id + " .story-editor-edit-story .delete-confirm-dialog"
      });
      $next_confirm_dialog = createConfirmDialog({
        selector: "#" + container_id + " .story-editor-edit-story .next-confirm-dialog"
      });
    }

    // For editing waypoints in a story
    function createEditWaypointUI() {
      $edit_waypoints = $this.find(".story-editor-edit-waypoints");
      $edit_waypoints.find(".back-button").on("click", function () {
        updateEditWaypointData(); // backward update data
        transition($edit_waypoints, $edit_story);
      });
      $edit_waypoints.find(".next-button").on("click", function () {
        transition($edit_waypoints, $edit_save);
      });
      edit_waypoints_accordion = createAccordion({
        accordion: "#" + container_id + " .story-editor-edit-waypoints .custom-accordion",
        delete_confirm_dialog: "#" + container_id + " .story-editor-edit-waypoints .delete-confirm-dialog"
      });
    }

    // For saving edited stories
    function createEditSaveUI() {
      var $next_confirm_dialog;
      $edit_save = $this.find(".story-editor-edit-save");
      $edit_save.find(".back-button").on("click", function () {
        transition($edit_save, $edit_waypoints);
      });
      $edit_save.find(".next-button").on("click", function () {
        $next_confirm_dialog.dialog("open");
      });
      $edit_save.find(".story-editor-download-button").on("click", function () {
        download(dataToTsv(collectEditStoryData()));
      });
      $next_confirm_dialog = createConfirmDialog({
        selector: "#" + container_id + " .story-editor-edit-save .next-confirm-dialog",
        action_callback: function () {
          resetEditStoryUI();
          transition($edit_save, $intro);
        }
      });
    }

    // Forward update the user interface of edting themes by using the loaded data
    function updateEditThemeUI(data) {
      edit_theme_accordion.reset();
      if (typeof data === "undefined") return;
      for (var i = 0; i < data.length; i++) {
        var $t = (i == 0) ? edit_theme_accordion.getActiveTab() : edit_theme_accordion.addEmptyTab();
        var d = data[i];
        $t.find(".custom-accordion-tab-header-text").text(d["theme_title"]);
        $t.find(".story-editor-title-textbox").val(d["theme_title"]);
        $t.find(".story-editor-description-textbox").val(d["theme_description"]);
        $t.data("stories", d["stories"]);
      }
    }

    // Backward update the loaded data by using the user interface of editing themes
    function updateEditThemeData() {
      var data = [];
      edit_theme_accordion.getTabs().each(function () {
        var $ui = $(this);
        var d = {
          theme_title: $ui.find(".story-editor-title-textbox").val().trim(),
          theme_description: $ui.find(".story-editor-description-textbox").val().trim(),
          stories: safeGet($ui.data("stories"), [])
        };
        if (hasContent(d)) data.push(d);
      });
      return data;
    }

    // Forward update the user interface of edting stories by using the loaded data
    function updateEditStoryUI() {
      edit_story_accordion.reset();
      var $theme_active_tab = edit_theme_accordion.getActiveTab();
      var stories = $theme_active_tab.data("stories");
      if (typeof stories === "undefined") return;
      for (var i = 0; i < stories.length; i++) {
        var $t = (i == 0) ? edit_story_accordion.getActiveTab() : edit_story_accordion.addEmptyTab();
        var d = stories[i];
        $t.find(".custom-accordion-tab-header-text").text(d["story_title"]);
        $t.find(".story-editor-title-textbox").val(d["story_title"]);
        $t.find(".story-editor-description-textbox").val(d["story_description"]);
        $t.find(".story-editor-author-textbox").val(d["story_author"]);
        $t.data("waypoints", d["waypoints"]);
        var urls = set_view_tool.extractView(d["story_view"]);
        setThumbnailPreview(urls, $t.find(".story-editor-thumbnail-preview"));
      }
      $theme_active_tab.removeData("stories"); // remove stored data
    }

    // Backward update the loaded data by using the user interface of editing stories
    function updateEditStoryData() {
      var stories = [];
      edit_story_accordion.getTabs().each(function () {
        var $ui = $(this);
        var d = {
          story_title: $ui.find(".story-editor-title-textbox").val().trim(),
          story_description: $ui.find(".story-editor-description-textbox").val().trim(),
          story_author: $ui.find(".story-editor-author-textbox").val().trim(),
          story_view: safeGet($ui.find(".story-editor-thumbnail-preview-landscape").data("view")),
          waypoints: safeGet($ui.data("waypoints"), [])
        };
        if (hasContent(d)) stories.push(d);
      });
      edit_theme_accordion.getActiveTab().data("stories", stories); // save data back
    }

    // Forward update the user interface of edting waypoints by using the loaded data
    function updateEditWaypointUI() {
      edit_waypoints_accordion.reset();
      var $story_active_tab = edit_story_accordion.getActiveTab();
      var waypoints = $story_active_tab.data("waypoints");
      if (typeof waypoints === "undefined") return;
      for (var i = 0; i < waypoints.length; i++) {
        var $t = (i == 0) ? edit_waypoints_accordion.getActiveTab() : edit_waypoints_accordion.addEmptyTab();
        var d = waypoints[i];
        $t.find(".custom-accordion-tab-header-text").text(d["waypoint_title"]);
        $t.find(".story-editor-title-textbox").val(d["waypoint_title"]);
        $t.find(".story-editor-long-title-textbox").val(d["waypoint_long_title"]);
        $t.find(".story-editor-description-textbox").val(d["waypoint_description"]);
        var urls = set_view_tool.extractView(d["waypoint_view"]);
        setThumbnailPreview(urls, $t.find(".story-editor-thumbnail-preview"));
      }
      $story_active_tab.removeData("waypoints"); // remove stored data
    }

    // Backward update the loaded data by using the user interface of editing waypoints
    function updateEditWaypointData() {
      var waypoints = [];
      edit_waypoints_accordion.getTabs().each(function () {
        var $ui = $(this);
        var d = {
          waypoint_title: $ui.find(".story-editor-title-textbox").val().trim(),
          waypoint_long_title: $ui.find(".story-editor-long-title-textbox").val().trim(),
          waypoint_description: $ui.find(".story-editor-description-textbox").val().trim(),
          waypoint_view: safeGet($ui.find(".story-editor-thumbnail-preview-landscape").data("view"))
        };
        if (hasContent(d)) waypoints.push(d);
      });
      edit_story_accordion.getActiveTab().data("waypoints", waypoints); // save data back
    }

    // Collect edited story data from the user interface
    function collectEditStoryData() {
      // Perform three backward data updates
      updateEditWaypointData();
      updateEditStoryData();
      return updateEditThemeData();
    }

    // Reset the user interface for editing stories
    function resetEditStoryUI() {
    }

    // Set thumbnail preview images (also put the video or image url inside href)
    function setThumbnailPreview(urls, $thumbnail_preview) {
      if (typeof urls === "undefined") return;
      $thumbnail_preview.show();
      var $l = $thumbnail_preview.find(".story-editor-thumbnail-preview-landscape");
      var $p = $thumbnail_preview.find(".story-editor-thumbnail-preview-portrait");
      $l.prop("href", urls["landscape"]["render"]["url"]);
      $l.data("view", urls["landscape"]["render"]["args"]["root"]);
      $l.find("img").prop("src", urls["landscape"]["preview"]["url"]);
      $p.prop("href", urls["portrait"]["render"]["url"]);
      $p.data("view", urls["portrait"]["render"]["args"]["root"]);
      $p.find("img").prop("src", urls["portrait"]["preview"]["url"]);
    }

    // Create a confirmation dialog
    function createConfirmDialog(settings) {
      settings = safeGet(settings, {});
      var has_action = (typeof settings["action_callback"] === "function");
      var action_text = safeGet(settings["action_text"], "Confirm");
      var cancel_text = has_action ? "Cancel" : "Ok";
      cancel_text = safeGet(settings["cancel_text"], cancel_text);
      var buttons = {
        "Cancel": {
          class: "ui-cancel-button",
          text: cancel_text,
          click: function () {
            $(this).dialog("close");
          }
        }
      };
      if (has_action) {
        buttons["Action"] = {
          class: "ui-action-button",
          text: action_text,
          click: function () {
            $(this).dialog("close");
            settings["action_callback"]();
          }
        }
      }
      var $dialog = $(settings["selector"]).dialog({
        appendTo: $this,
        autoOpen: false,
        resizable: false,
        height: "auto",
        draggable: false,
        width: 245,
        modal: true,
        position: {my: "center", at: "center", of: $this},
        classes: {"ui-dialog": "custom-dialog"}, // this is for jquery 1.12 and after
        dialogClass: "custom-dialog", // this is for before jquery 1.12
        buttons: buttons
      });
      return $dialog;
    }

    // Create a generalizable jQuery accordion for different editing purposes
    // Also a dialog for deleting tabs in the accordion
    function createAccordion(selector) {
      var $delete_confirm_dialog;
      var accordion = new CustomAccordion(selector["accordion"], {
        on_reset_callback: function () {
          accordion.getTabs().find(".story-editor-delete-button").prop("disabled", true);
        },
        on_tab_add_callback: function ($old_tab) {
          if (typeof $old_tab === "undefined") return;
          // Enable the delete button of the old tab if it was the only one tab in the accordion
          if (accordion.getTabs().length == 2) $old_tab.find(".story-editor-delete-button").prop("disabled", false);
        },
        on_tab_delete_callback: function () {
          // Disable the delete button of the active tab if there is only one tab left
          var $tabs = accordion.getTabs();
          if ($tabs.length == 1) $tabs.find(".story-editor-delete-button").prop("disabled", true);
        },
        before_tab_clone_callback: function ($tab_template) {
          $tab_template.find(".story-editor-set-view-button").on("click", function () {
            $current_thumbnail_preview = accordion.getActiveTab().find(".story-editor-thumbnail-preview");
            set_view_tool.show();
            $this.hide();
          });
          $tab_template.find(".story-editor-add-button").on("click", function () {
            accordion.addEmptyTab();
          });
          $tab_template.find(".story-editor-delete-button").on("click", function () {
            $delete_confirm_dialog.dialog("open");
          });
          $tab_template.find(".story-editor-title-textbox").on("input", function () {
            accordion.setActiveTabHeaderText($(this).val());
          });
          $tab_template.find(".story-editor-thumbnail-preview").hide();
        }
      });
      accordion.getUI().find(".story-editor-delete-button").prop("disabled", true);

      // The confirm dialog when deleting a tab
      $delete_confirm_dialog = createConfirmDialog({
        selector: selector["delete_confirm_dialog"],
        action_callback: function () {
          accordion.deleteActiveTab();
        }
      });
      return accordion;
    }

    // Download tsv as spreadsheet
    function download(tsv) {
      var a = document.createElement("a");
      a.href = "data:attachment/text," + encodeURI(tsv);
      a.target = "_blank";
      a.download = "story.tsv";
      a.click();
    }

    // Format the story data from the UI into a tsv spreadsheet
    function dataToTsv(data) {
      var tsv = "Waypoint Title\tAnnotation Title\tAnnotation Text\tShare View\tAuthor\n";
      data = safeGet(data, []);
      for (var i = 0; i < data.length; i++) {
        var t = data[i]; // theme
        tsv += "#" + t.theme_title + "\t" + t.theme_title + "\t" + t.theme_description + "\t\t\n";
        for (var j = 0; j < t["stories"].length; j++) {
          var s = t["stories"][j]; // story
          tsv += "##" + s.story_title + "\t" + s.story_title + "\t" + s.story_description + "\t" + s.story_view + "\t" + s.story_author + "\n";
          for (var k = 0; k < s["waypoints"].length; k++) {
            var w = s["waypoints"][k]; // waypoints
            tsv += w.waypoint_title + "\t" + w.waypoint_long_title + "\t" + w.waypoint_description + "\t" + w.waypoint_view + "\t\n";
          }
        }
      }
      return tsv;
    }

    // Recover the story data from a tsv spreadsheet
    function tsvToData(tsv) {
      var parsed = Papa.parse(tsv, {delimiter: '\t', header: true});
      var data = [];
      var current_theme;
      var current_story;
      var current_waypoint;
      parsed["data"].forEach(function (row) {
        var title = row["Waypoint Title"];
        var long_title = row["Annotation Title"];
        var description = row["Annotation Text"];
        var view = row["Share View"];
        var author = row["Author"];
        if (title.charAt(0) == "#" && title.charAt(1) != "#") {
          // This row indicates a theme
          current_theme = {
            theme_title: title.replace("#", ""),
            theme_description: description,
            stories: []
          };
          data.push(current_theme);
        } else if (title.substring(0, 2) == "##") {
          // This row indicates a story
          current_story = {
            story_title: title.replace("##", ""),
            story_description: description,
            story_view: view,
            story_author: author,
            waypoints: []
          };
          current_theme["stories"].push(current_story);
        } else {
          // This row indicates a waypoint
          current_waypoint = {
            waypoint_title: title,
            waypoint_long_title: long_title,
            waypoint_description: description,
            waypoint_view: view
          };
          current_story["waypoints"].push(current_waypoint);
        }
      });
      return data;
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

    // Safely get the value from a variable, return a default value if undefined
    function safeGet(v, default_val) {
      if (typeof default_val === "undefined") default_val = "";
      return (typeof v === "undefined") ? default_val : v;
    }

    // Check if there are things inside every key of a dictionary
    function hasContent(dict) {
      for (var key in dict) {
        if (!$.isEmptyObject(dict[key])) return true;
      }
      return false;
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
  // Create the class
  //
  var CustomAccordion = function (selector, settings) {
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //
    // Variables
    //
    settings = safeGet(settings, {});
    var $ui = $(selector);
    var before_tab_clone_callback = settings["before_tab_clone_callback"];
    var on_tab_add_callback = settings["on_tab_add_callback"];
    var on_tab_delete_callback = settings["on_tab_delete_callback"];
    var on_reset_callback = settings["on_reset_callback"];
    var $tab_template;

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //
    // Private methods
    //
    function init() {
      $ui.accordion({
        header: "> div > h3",
        heightStyle: "content",
        animate: false,
        collapsible: true,
        activate: function (event, ui) {
          /*
          if (ui.newHeader.length == 0 && ui.newPanel.length == 0) {
            // This means that the tab is collapsed
            $(ui.oldHeader[0]).addClass("custom-accordion-header-active");
          }
          if (ui.oldHeader.length == 0 && ui.oldPanel.length == 0) {
            // This means that a tab is activated from the collapsed state
            $(this).find(".custom-accordion-header-active").removeClass("custom-accordion-header-active");
          }
          */
        }
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

      // Clone the tab template
      $tab_template = $ui.find(".custom-accordion-tab");
      if (typeof before_tab_clone_callback === "function") {
        before_tab_clone_callback($tab_template);
      }
      $tab_template = $tab_template.clone(true, true);
    }

    // Safely get the value from a variable, return a default value if undefined
    function safeGet(v, default_val) {
      if (typeof default_val === "undefined") default_val = "";
      return (typeof v === "undefined") ? default_val : v;
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //
    // Privileged methods
    //
    var reset = function () {
      // Reset the user interface
      getTabs().remove();
      $ui.append($tab_template.clone(true, true));
      $ui.accordion("refresh");
      $ui.accordion("option", "active", 0); // expand the new tab

      // Call back
      if (typeof on_reset_callback === "function") {
        on_reset_callback();
      }
    };
    this.reset = reset;

    var addEmptyTab = function () {
      var $new_tab = $tab_template.clone(true, true);
      var $old_tab;
      var $tabs = getTabs();

      // Check if there are tabs
      var active_index = -1;
      if ($tabs.length == 0) {
        // No tabs, append one tab
        $ui.append($tab_template.clone(true, true));
      } else {
        // Has tab, check if has active tab
        active_index = getActiveIndex();
        // If no active tab, add the tab to the end
        if (active_index == false) active_index = $tabs.length - 1;
        $old_tab = $($tabs[active_index]);
        $old_tab.after($new_tab);
      }
      $ui.accordion("refresh");
      $ui.accordion("option", "active", active_index + 1); // expand the new tab

      // Call back
      if (typeof on_tab_add_callback === "function") {
        on_tab_add_callback($old_tab);
      }
      return $new_tab;
    };
    this.addEmptyTab = addEmptyTab;

    var deleteActiveTab = function () {
      // Delete active tab
      getActiveTab().remove();

      // Collapse all tabs
      $ui.accordion("option", "active", false);
      $ui.accordion("refresh");

      // Call back
      if (typeof on_tab_delete_callback === "function") {
        on_tab_delete_callback();
      }
    };
    this.deleteActiveTab = deleteActiveTab;

    var getActiveTab = function () {
      return $(getTabs()[getActiveIndex()]);
    };
    this.getActiveTab = getActiveTab;

    var getActiveIndex = function () {
      return $ui.accordion("option", "active");
    };
    this.getActiveIndex = getActiveIndex;

    var setActiveTabHeaderText = function (txt) {
      getActiveTab().find(".custom-accordion-tab-header-text").text(txt);
    };
    this.setActiveTabHeaderText = setActiveTabHeaderText;

    var getNumOfTabs = function () {
      return getTabs().length;
    };
    this.getNumOfTabs = getNumOfTabs;

    var getUI = function () {
      return $ui;
    };
    this.getUI = getUI;

    var getTabs = function () {
      return $ui.find(".custom-accordion-tab");
    };
    this.getTabs = getTabs;

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