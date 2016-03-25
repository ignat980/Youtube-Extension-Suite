// Copyright (c) 2016 Ignat Remizov. All rights reserved.
;(function(root, undefined) {
/**
 * Calls the Youtube API to read the length of the current playlist
 *
 * @param {string} format_string - used by duration.format to format the length
 * @param {function(string)} callback - called when the length of a Youtube Playlist is found
 */
function getPlaylistLength(format_string, callback) {
  // TODO: Youtube api to get playlist length
  console.log("Getting playlist length");
  var data = ["PT32H10M33S", "PT2M01S", "PT32M10S", "PT11M5S","PT22M10S"];
  var apiUrl = "https://www.googleapis.com/youtube/v3/playlists"
  var length = data.reduce(function(previous, current) {
    var dur = moment.duration(previous);
    dur.add(moment.duration(current));
    return dur;
  });
  callback(formatDuration(length, format_string));
};

/**
 * Formats a moment duration from milliseconds into a readable format
 *
 * @param {Duration} duration - a duration that will be used to formatDuration
 * @param {string} format_string - the string that will be used by .format() or you can use the two default values
 */
function formatDuration(duration, format_string) {
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
  var xmlHttp = new XMLHttpRequest();
  xmlHttp.open("GET", url);
  xmlHttp.responseType = 'json'
  x.onload = function() {
    if (!x.response) {
      errorCallback("No response.")
    } else if (x.response.error) {
      errorCallback(x.response.error)
    } else {
      callback(x.response);
    }
  };
  x.onerror = function() {
    errorCallback('Network error.');
  };
  xmlHttp.send(null);
};

/**
 * Read a local json text file.
 *
 * @param {string} file - The filepath to the json resourse
 * @param {function(string)} callback - called when the json file has been read.
 * @source - http://stackoverflow.com/a/34579496/3923022
 */

function readTextFile(file, callback) {
    var rawFile = new XMLHttpRequest();
    rawFile.overrideMimeType("application/json");
    rawFile.open("GET", file, true);
    rawFile.onreadystatechange = function() {
        if (rawFile.readyState === 4 && rawFile.status == "200") {
            callback(rawFile.responseText);
        };
    };
    rawFile.send(null);
};


/**
 * Adds a playlist length to the DOM
 *
 * @param {string} length - The length of the playlist
 */
function renderLengthInDOM(length) {
  var lengthLi = document.getElementById('pl-detail-length')
  if (lengthLi === null) {
    lengthLi = document.createElement('li');
    lengthLi.setAttribute('id','pl-detail-length');
  };
  lengthLi.innerText = "Total time: " + length;
  var playlistDetails = document.getElementsByClassName('pl-header-details'); //youtube.com/playlist
  if (playlistDetails.length === 0) {
    playlistDetails = document.getElementsByClassName('playlist-details'); //youtube.com/watch*&list*
  };
  console.assert(playlistDetails.length !== 0, 'Playlist not found in DOM');
  playlistDetails[0].appendChild(lengthLi);
};


var keysURL = chrome.extension.getURL("keys.json");
readTextFile(keysURL, function(json) {
  var data = JSON.parse(json);
  console.log(data);
  var url = document.location
  getPlaylistLength(document.location.pathname === "/playlist" ? "long" : "short", function (length) {
    console.log("Calculated length:" + length);
    renderLengthInDOM(length);
  });
});
console.log("Script ran");
})(this);
