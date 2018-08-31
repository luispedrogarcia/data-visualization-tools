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
    var enable_testing = true;

    // For creating new stories
    var $theme;
    var $story;
    var $waypoints, waypoints_accordion;
    var $save;

    // For editing stories
    var $edit_load;
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

      // for testing the function of the user interface
      if(enable_testing) test();
    }

    // For setting a view from the timelapse viewer
    function createSetViewTool() {
      set_view_tool = new SetViewTool(timelapse, {
        container_id: container_id,
        on_view_set_callback: function (urls) {
          setThumbnailPreviewUI($current_thumbnail_preview, urls);
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
          resetTabUI($theme);
          resetTabUI($story);
          waypoints_accordion.reset();
          transition($save, $intro);
        }
      });
    }

    // Collect newly created story data from the user interface
    function collectNewStoryData() {
      var story = collectTabData($story);
      story["data"] = collectAccordionData(waypoints_accordion);
      var theme = collectTabData($theme);
      theme["data"] = [story];
      return [theme];
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
        util.gdocToJSON($edit_load.find(".sheet-url-textbox").val(), function (tsv) {
          setAccordionUI(edit_theme_accordion, tsvToData(tsv));
          transition($edit_load, $edit_theme);
          $edit_load.find(".next-button").prop("disabled", false);
        });
      });
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
          forward(edit_story_accordion, edit_theme_accordion);
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
        backward(edit_story_accordion, edit_theme_accordion); // backward propagate data
        transition($edit_story, $edit_theme);
      });
      $edit_story.find(".next-button").on("click", function () {
        // Check if the user selects a tab
        if (edit_story_accordion.getActiveTab().length > 0) {
          forward(edit_waypoints_accordion, edit_story_accordion);
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
        backward(edit_waypoints_accordion, edit_story_accordion); // backward propagate data
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
          transition($edit_save, $intro);
        }
      });
    }

    // Set the user interface of a tab (one row in the tsv file)
    function setTabUI($ui, d) {
      if (typeof $ui === "undefined" || d === "undefined") return;
      if (typeof d["title"] !== "undefined") {
        $ui.find(".story-editor-title-text").text(d["title"]);
        $ui.find(".story-editor-title-textbox").val(d["title"]);
      }
      if (typeof d["long_title"] !== "undefined") {
        $ui.find(".story-editor-long-title-textbox").val(d["long_title"]);
      }
      if (typeof d["description"] !== "undefined") {
        $ui.find(".story-editor-description-textbox").val(d["description"]);
      }
      if (typeof d["author"] !== "undefined") {
        $ui.find(".story-editor-author-textbox").val(d["author"]);
      }
      if (typeof d["view"] !== "undefined") {
        setThumbnailPreviewUI($ui.find(".story-editor-thumbnail-preview"), set_view_tool.extractView(d["view"]));
      }
      if (typeof d["data"] !== "undefined") {
        $ui.data("data", d["data"]);
      }
    }

    // Reset the user interface of a tab (one row in the tsv file)
    function resetTabUI($ui) {
      if (typeof $ui === "undefined") return;
      $ui.find(".story-editor-title-text").text(d["title"]);
      $ui.find(".story-editor-title-textbox").val(d["title"]);
      $ui.find(".story-editor-long-title-textbox").val(d["long_title"]);
      $ui.find(".story-editor-description-textbox").val(d["description"]);
      $ui.find(".story-editor-author-textbox").val(d["author"]);
      $ui.removeData("data");
      resetThumbnailPreviewUI($ui.find(".story-editor-thumbnail-preview"));
    }

    // Set the user interface of an accordion (theme, story, waypoints)
    function setAccordionUI(accordion, data) {
      if (typeof accordion === "undefined" || data === "undefined") return;
      accordion.reset();
      for (var i = 0; i < data.length; i++) {
        var $t = (i == 0) ? accordion.getActiveTab() : accordion.addEmptyTab();
        setTabUI($t, data[i]);
      }
    }

    // Propagate data forward from an accordion to another accordion
    function forward(to_accordion, from_accordion) {
      if (typeof from_accordion === "undefined") return;
      var $active_tab = from_accordion.getActiveTab();
      if ($active_tab.length > 0) {
        setAccordionUI(to_accordion, $active_tab.data("data"));
        $active_tab.removeData("data"); // remove stored data
      }
    }

    // Collect data from the user interface of a tab (one row in the tsv file)
    function collectTabData($ui) {
      if (typeof $ui === "undefined") return;
      var d = {};
      var $title = $ui.find(".story-editor-title-textbox");
      if ($title.length > 0) {
        d["title"] = safeGet($title.val().trim());
      }
      var $long_title = $ui.find(".story-editor-long-title-textbox");
      if ($long_title.length > 0) {
        d["long_title"] = safeGet($long_title.val().trim());
      }
      var $description = $ui.find(".story-editor-description-textbox");
      if ($description.length > 0) {
        d["description"] = safeGet($description.val().trim());
      }
      var $author = $ui.find(".story-editor-author-textbox");
      if ($author.length > 0) {
        d["author"] = safeGet($author.val().trim());
      }
      var $view = $ui.find(".story-editor-thumbnail-preview-landscape");
      if ($view.length > 0) {
        d["view"] = safeGet($view.data("view"));
      }
      var data = $ui.data("data");
      if (typeof data !== "undefined") {
        d["data"] = safeGet(data, []);
      }
      return d;
    }

    // Collect data from the user interface of an accordion (theme, story, waypoints)
    function collectAccordionData(accordion) {
      var data = [];
      accordion.getTabs().each(function () {
        var d = collectTabData($(this));
        if (hasContent(d)) data.push(d);
      });
      return data;
    }

    // Propagate data backward from an accordion to another one
    function backward(from_accordion, to_accordion) {
      var data = collectAccordionData(from_accordion);
      if (typeof to_accordion !== "undefined") {
        to_accordion.getActiveTab().data("data", data);
      }
      return data;
    }

    // Collect edited story data from the user interface
    function collectEditStoryData() {
      // Propagate data backward three times
      backward(edit_waypoints_accordion, edit_story_accordion);
      backward(edit_story_accordion, edit_theme_accordion);
      return backward(edit_theme_accordion);
    }

    // Set thumbnail preview images (also put the video or image url inside href)
    function setThumbnailPreviewUI($ui, urls) {
      if (typeof $ui === "undefined" || typeof urls === "undefined") return;
      $ui.show();
      var $l = $ui.find(".story-editor-thumbnail-preview-landscape");
      var $p = $ui.find(".story-editor-thumbnail-preview-portrait");
      $l.prop("href", urls["landscape"]["render"]["url"]);
      $l.data("view", urls["landscape"]["render"]["args"]["root"]);
      $l.find("img").prop("src", urls["landscape"]["preview"]["url"]);
      $p.prop("href", urls["portrait"]["render"]["url"]);
      $p.data("view", urls["portrait"]["render"]["args"]["root"]);
      $p.find("img").prop("src", urls["portrait"]["preview"]["url"]);
    }

    // Reset thumbnail preview images (also put the video or image url inside href)
    function resetThumbnailPreviewUI($ui) {
      if (typeof $ui === "undefined") return;
      $ui.find("a").prop("href", "javascript:void(0)");
      $ui.find("img").prop("src", "");
      $ui.removeData("view");
      $ui.hide();
    }

    // Set the custom dropdown
    //var themes = getValues(edit_theme_accordion.getTabs().find(".story-editor-title-textbox"));
    //var active_theme_index = edit_theme_accordion.getActiveIndex();
    function setCustomDropdown($ui, options, active_index) {
      var $button_text = $ui.find("button > span");
      var $menu = $ui.find("div");
      options.forEach(function (x) {
        $menu.append($("<a href=\"javascript:void(0)\">" + x + "</a>"));
      });
      $button_text.text(options[active_index]);
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
        var theme = data[i];
        tsv += "#" + theme.title + "\t" + theme.title + "\t" + theme.description + "\t\t\n";
        for (var j = 0; j < theme["data"].length; j++) {
          var story = theme["data"][j];
          tsv += "##" + story.title + "\t" + story.title + "\t" + story.description + "\t" + story.view + "\t" + story.author + "\n";
          for (var k = 0; k < story["data"].length; k++) {
            var waypoint = story["data"][k];
            tsv += waypoint.title + "\t" + waypoint.long_title + "\t" + waypoint.description + "\t" + waypoint.view + "\t\n";
          }
        }
      }
      return tsv;
    }

    // Recover the story data from a tsv spreadsheet
    function tsvToData(tsv) {
      var parsed = Papa.parse(tsv, {delimiter: '\t', header: true});
      var data = [];
      var theme, story, waypoint;
      parsed["data"].forEach(function (row) {
        var title = row["Waypoint Title"];
        var long_title = row["Annotation Title"];
        var description = row["Annotation Text"];
        var view = row["Share View"];
        var author = row["Author"];
        if (title.charAt(0) == "#" && title.charAt(1) != "#") {
          theme = {
            title: title.replace("#", ""),
            description: description,
            data: [] // for storing stories
          };
          data.push(theme);
        } else if (title.substring(0, 2) == "##") {
          story = {
            title: title.replace("##", ""),
            description: description,
            view: view,
            author: author,
            data: [] // for storing waypoints
          };
          theme["data"].push(story);
        } else {
          waypoint = {
            title: title,
            long_title: long_title,
            description: description,
            view: view
          };
          story["data"].push(waypoint);
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

    // Get all values of the found dom elements and return an array
    function getValues($elements) {
      return $elements.map(function () {
        return $(this).val();
      }).get();
    }

    // For testing the function of the user interface
    function test() {
      // For creating a new story
      setTabUI($theme, {
        title: "City",
        description: "Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec quam felis"
      });
      setTabUI($story, {
        title: "Las Vegas",
        description: "Las Vegas is growing",
        view: "https://headless.earthtime.org/#v=376619,739989,381095,742507,pts&t=0&ps=0&l=blsat&bt=19840101&et=19840101&startDwell=0&endDwell=0&fps=30",
        author: "Yen-Chia Hsu"
      });
      setAccordionUI(waypoints_accordion, [{
        title: "City blocks 1984",
        long_title: "City blocks 1984 Las Vegas",
        description: "Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec quam felis",
        view: "https://headless.earthtime.org/#v=376528,740349,379214,741860,pts&t=0&ps=0&l=blsat&bt=19840101&et=19840101&startDwell=0&endDwell=0&fps=30"
      }, {
        title: "City blocks 2016",
        long_title: "City blocks 2016 Las Vegas",
        description: "Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt",
        view: "https://headless.earthtime.org/#v=376528,740349,379214,741860,pts&t=0&ps=0&l=blsat&bt=20160101&et=20160101&startDwell=0&endDwell=0&fps=30"
      }, {
        title: "City blocks animate",
        long_title: "City blocks animate Las Vegas",
        description: "Li Europan lingues es membres del sam familie. Lor separat existentie es un myth. Por scientie, musica, sport etc, litot Europa usa li sam vocabular. Li lingues differe solmen in",
        view: "https://headless.earthtime.org/#v=375724,739821,379748,742085,pts&t=0&ps=50&l=blsat&bt=19840101&et=20161231&startDwell=0&endDwell=1&fps=30"
      }, {
        title: "City blocks fast",
        long_title: "City blocks fast Las Vegas",
        description: "abc def ghi jkl mno pqrs tuv wxyz ABC DEF GHI JKL MNO PQRS TUV WXYZ !\"§ $%& /() =?* '<> #|; ²³~ @`´ ©«» ¤¼× {}abc def ghi",
        view: "https://headless.earthtime.org/#v=375528,739686,381435,743009,pts&t=0&ps=100&l=blsat&bt=19930101&et=20041231&startDwell=0&endDwell=1&fps=30"
      }]);
      // For editing a story
      $edit_load.find(".sheet-url-textbox").val("https://docs.google.com/spreadsheets/d/1dn6nDMFevqPBdibzGvo9qC7CxwxdfZkDyd_ys6r-ODE/edit#gid=145707723");
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