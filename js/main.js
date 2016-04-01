// Copyright (c) 2016 Ignat Remizov. All rights reserved.
;(function(root, undefined) {

/**
 * Adds formatting to strings, used like "Hello {0}!".format("World")
 *
 * @source https://stackoverflow.com/a/4673436/3923022
 */
function addFormatString(){
  if (!String.prototype.format) {
    String.prototype.format = function() {
      var args = arguments;
      return this.replace(/{(\d+)}/g, function(match, number) {
        return typeof args[number] != 'undefined'
          ? args[number]
          : match
        ;
      });
    };
  }
}

/**
 * @param {string} url - The URL to get from
 * @param {function(Response)} callback - Called when the GET json request finishes
 * @param {function(Error)} errorCallback - Called when the request fails or returns an error
 */
function asyncJsonGET(url, callback, errorCallback) {
  var x = new XMLHttpRequest();
  x.open("GET", url);
  x.responseType = 'json';
  x.onload = function() {
    if (x.status === 400 || x.status === 404) {
      errorCallback(x);
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
 * Reduces a bunch of ISO 8601 durations into a moment.Duration object
 *
 * @param {[string]} data - An array of ISO 8601 formatted strings
 * @returns {Duration} - The sum of the ISO 8601 strings as a moment.Duration object
 */
function sumLengthsIntoDuration(data) {
  console.log("Summing together strings");
  return data.reduce(function(previous, current) {
    if(typeof previous === 'string') {
      var duration = moment.duration(previous);
    } else {
      var duration = previous;
    };
    if (current) {
      duration.add(moment.duration(current));
    };
    return duration;
  });
};

/**
 * Formats a moment.Duration object into a readable string
 *
 * @param {Duration} duration - a moment.Duration object that will be formatted
 * @param {string} format_string - the string that will be used by .format() or you can use the two default values "long" or "short"
 * @returns {string} - a formatted string from a Duration object using the moment-duration-format plugin
 */
function formatDuration(duration, format_string) {
  console.log("Formatting", duration);
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
 * Calls the Youtube API to read the length of the current playlist
 *
 * @param {string} playlistID - The ID for the playlist to get
 * @param {string} key - The Youtube data v3 api key
 * @param {function(string)} callback - called when the length of a Youtube Playlist is parsed
 */
function getPlaylistLength(playlist_ID, key, callback) {
  console.log("Getting playlist length");
  var playlist_api_url = "https://www.googleapis.com/youtube/v3/playlistItems" +
  "?part=contentDetails&maxResults=50&playlistId={0}" +
  "&fields=etag%2Citems%2FcontentDetails%2CnextPageToken%2CprevPageToken&key=" + key;
  // So after reading a lot, there are a lot of hoops to go through to get all of the items' durations.
  // I have to call /v3/playlistItems to get videoId's, and I can only do 50 items at a time, so I have to keep track of a pageToken
  // I then have to call /v3/videos with all video id's, and sum all the durations together
  // Obviously this is a lot of time to process, so I guess I would have a load indicator or something, I wonder if I can use youtube's
  var videos_api_url = "https://www.googleapis.com/youtube/v3/videos" +
  "?part=contentDetails&id={0}&fields=items%2FcontentDetails%2Fduration&key=" + key;
  asyncJsonGET(playlist_api_url.format(playlistId), function(res) {
    console.log("Playlist response:", res);
    // TODO: Call GET /v3/videos to get video information
    // TODO: Convert video objects to what the data variable looks like
    // TODO: Render length :D
    var data = ["PT32H10M33S", "PT2M01S", "PT32M10S", "PT11M5S","PT22M10S"];
    var length = formatDuration(sumLengthsIntoDuration(data), document.location.pathname === "/playlist" ? "long" : "short");
    callback(length);
  }, function(err) {
    console.error(err);
  });
};

function getLengthDetail() {
  var length_li = document.getElementById('pl-detail-length');
  if (!length_li) {
    length_li = document.createElement('li');
    length_li.setAttribute('id','pl-detail-length');
  };
  return length_li;
};


function getPlaylistDetails() {
  var playlist_details = document.getElementsByClassName('pl-header-details'); //youtube.com/playlist
  if (playlist_details.length === 0) {
    playlist_details = document.getElementsByClassName('playlist-details'); //youtube.com/watch*&list*
  };
  console.assert(playlist_details.length !== 0, 'Playlist not found in DOM');
  return playlist_details[0];
};


function resetLengthInDOMWith(element) {
  console.log();
  length_li = getLengthDetail();
  console.log("Resetting Length Detail");
  length_li.innerText = "";
  var loader = document.getElementById('pl-loader-gif');
  if (loader) {
    console.log("Removing loader");
    length_li.removeChild(loader);
  };
  length_li.appendChild(element);

  var playlistDetails = getPlaylistDetails();
  if (!playlistDetails.contains(length_li)) {
    playlistDetails.appendChild(length_li);
  };
}

/**
 * Adds a playlist length to the DOM
 *
 * @param {string} length - A readable length of the playlist
 */
function addLengthToDOM(length) {
  function DOMLoadedHandler(){
    resetLengthInDOMWith(document.createTextNode("Total time: " + length));
    document.removeEventListener('DOMContentLoaded', DOMLoadedHandler);
  };
  console.log("Adding length:", length);
  if (document.readyState === "interactive" || document.readyState === "complete") {
    DOMLoadedHandler();
  } else {
    console.log("Removing main, adding length");
    document.removeEventListener('DOMContentLoaded', main);
    document.addEventListener('DOMContentLoaded', DOMLoadedHandler);
  };
};


/**
 * Main function, run once the page has loaded
 */
function main() {
  console.log("Dom loaded");
  document.removeEventListener('DOMContentLoaded', main);
  var spinner = document.createElement('span');
  spinner.setAttribute('class', 'yt-spinner-img  yt-sprite');
  spinner.setAttribute('id', 'pl-loader-gif');
  resetLengthInDOMWith(spinner);
  console.log("Main ran, loader added");
};
document.addEventListener('DOMContentLoaded', main);

/**
 * Run before anything else
 */
var keys_URL = chrome.extension.getURL("keys.json");
readTextFile(keys_URL, function(json) {
  var keys = JSON.parse(json);
  var list_regex = /(?:https?:\/\/)www\.youtube\.com\/(?:(?:playlist)|(?:watch))\?.*?(?:list=([A-z\d]+)).*/;
  var url = document.location.href;
  var list_id = url.match(list_regex)[1];
  console.log("list id:",list_id);
  getPlaylistLength(list_id, keys["YTDataAPIKey"], addLengthToDOM);

});
})(this);
