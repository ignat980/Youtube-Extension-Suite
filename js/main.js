// Copyright (c) 2016 Ignat Remizov. All rights reserved.
;(function(root, undefined) {

/**
 * Adds formatting to strings, used like "Hello {0}!".format("World")
 *
 * @source https://stackoverflow.com/a/4673436/3923022 and https://stackoverflow.com/a/18234317/3923022
 */
function addFormatStringFunction() {
  if (!String.prototype.format) {
    String.prototype.format = function() {
      var args = typeof arguments[0] === 'object' ? arguments[0] : arguments;
      return this.replace(/{(\d?[A-Za-z]?)}/gi, (match, arg) =>
        typeof args[arg] != 'undefined' ? args[arg] : match)
    };
  }
}

/**
 * Runs a for loop asynchronously, call the funtion passed to your loop when you want the loop to run again
 *
 * @param: {object} o - a loop object that contains a length property for how many times to iterate,
 *                      a loop property which is the iteration body,
 *                      a callback property that gets called at the end of the for loop
 * @source https://stackoverflow.com/a/7654602/3923022
 */
var AsyncLooper = function(o) {
  this.i = -1;
  this.length = o.i
  this.o = o
  this.loop();//start iterating
}

AsyncLooper.prototype.loop = function() {
  this.i++;
  if(this.i === this.length) {
    if (this.o.callback) {
      this.o.callback();
    };
    return;
  };
  this.o.loop(this.i);
};

/**
 * @param {string} url - The URL to get from
 * @param {function(Response)} callback - Called when the GET json request finishes
 * @param {function(Error)} errorCallback - Called when the request fails or returns an error
 */
function asyncJsonGET(url, callback, errorCallback) {
  var x = new XMLHttpRequest();
  x.open("GET", url);
  // x.setRequestHeader("If-None-Match","etag")
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
  // I could map all the strings into duration objects then reduce, but that's O(2N) :p
  // return data.map(item => moment.duration(item)).reduce((prev, next) => {prev.add(current); return prev;});
  // Maybe I could use generators...
  return data.reduce((previous, current) => {
    duration = previous.contentDetails ? moment.duration(previous.contentDetails.duration) : previous;
    duration.add(moment.duration(current.contentDetails.duration));
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
function getPlaylistLength(playlist_id, key, callback) {
  console.log("Getting playlist length");
  // TODO: cache etag to quickly return playlist length !important
  // Api url to get video id's from playlistItems
  var playlist_api_url = "https://www.googleapis.com/youtube/v3/playlistItems" +
  "?part=contentDetails&maxResults=50&playlistId={0}" +
  "&fields=etag%2Citems%2FcontentDetails%2CnextPageToken%2CprevPageToken{1}&key=" + key;
  // Api url to get video durations given a bunch of video id's
  var videos_api_url = "https://www.googleapis.com/youtube/v3/videos" +
  "?part=contentDetails&id={0}&key=" + key;
  var length;     // Rendered length
  var total = 0;  // Current videos processed
  var totalResults;
  var token;      // Next page token
  var video_ids;  // Array of video id's

  // Keep calling /playlistItems until you get to the end page
  var looper = new AsyncLooper({
    // i changes after the first request because no idea about total videos before
    'i': 1,
    'loop': (i) => {
      // Call /playlistItems for the first 50 items
      var first_time = (i === 0);
      asyncJsonGET(playlist_api_url.format(playlist_id, (first_time ? "%2CpageInfo%2FtotalResults" : "")) + (token ? "&pageToken=" + token : ""), res => {
        console.log("Next 50 Playlist Items:", res);
        token = res.nextPageToken;
        // If this is the first pass, set the total results and total index to iterate over
        if (first_time) {
          totalResults = res.pageInfo.totalResults;
          looper.length = (totalResults < 250 ? Math.ceil(totalResults/50) : 5);
          console.log("Looping " + looper.length + " times");
        };
        // Convert response into video ids
        video_ids = res.items.map(item => item.contentDetails.videoId);
        total += video_ids.length;
        // Call /videos with the video id's
        asyncJsonGET(videos_api_url.format(video_ids.join(',')), videos => {
          console.log("Videos response:", videos);
          setLengthInDOMWith(document.createTextNode(total + "/" + totalResults), (first_time ? -1 : 1));
          if (length) {videos.items.push({contentDetails:{duration:length}})};
          length = formatDuration(sumLengthsIntoDuration(videos.items),
                   document.location.pathname === "/playlist" ? "long" : "short");
          looper.loop();
        }, err => {
          console.error(err);
        }); //Close Videos call
      }, err => {
        console.error(err);
      }); //Close Playlist items call
    },
    'callback': () => {
      console.log("Finished requesting");
      callback(length);
    }
  }); //Close Async loop
};

/**
 * Finds or creates the element for displaying the length
 *
 * @returns: {Node} - a <li> element for displaying the length
 */
function getLengthDetail() {
  var length_li = document.getElementById('pl-detail-length');
  if (!length_li) {
    length_li = document.createElement('li');
    length_li.setAttribute('id','pl-detail-length');
  };
  return length_li;
};

/**
 * Finds the element for the playlist details
 *
 * @returns: {Node} - a <ul> element on the page that displays details for a playlist
 */
function getPlaylistDetails() {
  var playlist_details = document.getElementsByClassName('pl-header-details'); //youtube.com/playlist
  if (playlist_details.length === 0) {
    playlist_details = document.getElementsByClassName('playlist-details'); //youtube.com/watch*&list*
  };
  console.assert(playlist_details.length !== 0, 'Playlist not found in DOM');
  return playlist_details[0];
};

/**
 * Resets the length element with the element passed into it
 *
 * @param: {Node} element - The element to be setAttribute
 * @param: {int} index - An index for which child to set, set to -1 to append
 */
function setLengthInDOMWith(element, index) {
  length_li = getLengthDetail();
  console.log("Length Detail:", length_li);
  if (index === -1) {
    length_li.appendChild(element)
  } else {
    length_li.replaceChild(element, length_li.childNodes[index]);
  }
  var playlistDetails = getPlaylistDetails();
  if (!playlistDetails.contains(length_li)) {
    playlistDetails.appendChild(length_li);
  };
}

function removeLoader() {
  var loader = document.getElementById('pl-loader-gif');
  if (loader) {
    console.log("Removing loader");
    loader.remove();
  };
}

/**
 * Adds a playlist length to the DOM
 *
 * @param {string} length - A readable length of the playlist
 */
function addLengthToDOM(length) {
  function DOMLoadedHandler(){
    removeLoader();
    setLengthInDOMWith(document.createTextNode("Total time: " + length), 0);
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

function testingEtag(url, etag, callback) {
  var x = new XMLHttpRequest();
  x.open("GET", url);
  x.setRequestHeader("If-None-Match", etag)
  x.responseType = 'json';
  x.onload = function() {
    if (x.status === 400 || x.status === 404) {
      console.error(x);
    } else if (!x.response) {
      console.error("No response.");
    } else if (x.response.error) {
      console.error(x.response.error);
    } else {
      callback(x);
    };
  };
  x.onerror = function() {
    errorCallback('Network error.');
  };
  x.send(null);
}

/**
 * Main function, run once the page has loaded
 */
function main() {
  console.log("Dom loaded");
  document.removeEventListener('DOMContentLoaded', main);
  var spinner = document.createElement('span');
  spinner.setAttribute('class', 'yt-spinner-img  yt-sprite');
  spinner.setAttribute('id', 'pl-loader-gif');
  setLengthInDOMWith(spinner, -1);
  console.log("Main ran, loader added");
};
document.addEventListener('DOMContentLoaded', main);

/**
 * Run before anything else
 */
addFormatStringFunction()
var keys_URL = chrome.extension.getURL("keys.json");
readTextFile(keys_URL, json => {
  var keys = JSON.parse(json);
  var list_regex = /(?:https?:\/\/)www\.youtube\.com\/(?:(?:playlist)|(?:watch))\?.*?(?:list=([A-z\d]+)).*/;
  var url = document.location.href;
  var list_id = url.match(list_regex)[1];
  console.log("list id:",list_id);
  getPlaylistLength(list_id, keys["YTDataAPIKey"], addLengthToDOM);
});
})(this);
