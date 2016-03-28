// Copyright (c) 2016 Ignat Remizov. All rights reserved.
;(function(root, undefined) {
/**
 * Calls the Youtube API to read the length of the current playlist
 *
 * @param {string} playlistID - The ID for the playlist to get
 * @param {string} key - The Youtube data v3 api key
 * @param {function(string)} callback - called when the length of a Youtube Playlist is found
 */
function getPlaylistLength(playlist_ID, key, callback) {
  // TODO: Youtube api to get playlist length
  console.log("Getting playlist length");
  var data = ["PT32H10M33S", "PT2M01S", "PT32M10S", "PT11M5S","PT22M10S"];
  var api_url = "https://www.googleapis.com/youtube/v3/playlists" + "?part=snippet" + "&id=" + playlist_ID + "&fields=items(contentDetails%2Csnippet)%2CnextPageToken%2CpageInfo&key=" + key;
  var j = asyncJsonGET(api_url, function(res) {
    console.log(res)
  }, console.log);
  var length = data.reduce(function(previous, current) {
    var duration = moment.duration(previous);
    duration.add(moment.duration(current));
    return duration;
  });
  callback(length);
};

/**
 * Formats a moment duration from milliseconds into a readable format
 *
 * @param {Duration} duration - a duration that will be used to formatDuration
 * @param {string} format_string - the string that will be used by .format() or you can use the two default values
 */
function formatDuration(duration, format_string) {
  console.log(duration)
  var length;
  if (format_string === "long") {
    format = [
      duration.months() === 1 ? "Month" : "Months",
      duration.days() === 1 ? "Day" : "Days",
      duration.hours() === 1 ? "Hour" : "Hours",
      duration.minutes() === 1 ? "Minute" : "Minutes",
      duration.seconds() === 1 ? "Second" : "Seconds"
    ];
    length = duration.format("M [" + format[0] + "] d [" + format[1] +
    "] h [" + format[2] + "] m [" + format[3] + " and] s [" + format[4] + "]");
  } else if (format_string === "short") {
    length = duration.format("M[m] d[d] h:mm:ss");
  } else {
    length = duration.format(format_string);
  };
  return length;
}

/**
 * @param {string} url - The URL to get from
 * @param {function(Response)} callback - Called when the GET request finishes
 * @param {function(error)} errorCallback - Called when the request returns an error
 */

function asyncJsonGET(url, callback, errorCallback) {
  var x = new XMLHttpRequest();
  x.open("GET", url);
  x.responseType = 'json';
  x.onload = function() {
    if (x.status === 400 || x.status === 404) {
      errorCallback(x.status);
    } else if (!x.response) {
      errorCallback("No response.");
    } else if (x.response.error) {
      errorCallback(x.response.error);
    } else {
      callback(x.response);
    };
  };
  x.onerror = function() {
    errorCallback('Network error.');
  };
  x.send(null);
};

/**
 * Read a local json text file.
 *
 * @param {string} file - The filepath to the json resourse
 * @param {function(string)} callback - called when the json file has been read.
 * @source - http://stackoverflow.com/a/34579496/3923022
 */

function readTextFile(file, callback) {
  var raw_file = new XMLHttpRequest();
  raw_file.overrideMimeType("application/json");
  raw_file.open("GET", file, true);
  raw_file.onreadystatechange = function() {
      if (raw_file.readyState === 4 && raw_file.status == "200") {
          callback(raw_file.responseText);
      };
  };
  raw_file.send(null);
};


/**
 * Adds a playlist length to the DOM
 *
 * @param {string} format_string - used by duration.format to format the length
 * @param {string} length - The length of the playlist as a moment.Duration
 */
function renderLengthInDOM(length, format_string) {
  var length = formatDuration(length, format_string)
  var length_li = document.getElementById('pl-detail-length');
  if (length_li === null) {
    length_li = document.createElement('li');
    length_li.setAttribute('id','pl-detail-length');
  };
  length_li.innerText = "Total time: " + length;
  var playlist_details = document.getElementsByClassName('pl-header-details'); //youtube.com/playlist
  if (playlist_details.length === 0) {
    playlist_details = document.getElementsByClassName('playlist-details'); //youtube.com/watch*&list*
  };
  console.assert(playlist_details.length !== 0, 'Playlist not found in DOM');
  playlist_details[0].appendChild(length_li);
};

// Main
var keys_URL = chrome.extension.getURL("keys.json");
readTextFile(keys_URL, function(json) {
  var data = JSON.parse(json);
  console.log(data);
  var url = document.location;
  getPlaylistLength("PLmKbqjSZR8TZa7wyVoVq2XMHxxWREyiFc", data["YTDataAPIKey"], function (response) {
    var length = moment.duration("PT32H10M33S")
    console.log("Calculated length:" + length);
    renderLengthInDOM(length, document.location.pathname === "/playlist" ? "long" : "short");
  });
});
console.log("Script ran");
})(this);
