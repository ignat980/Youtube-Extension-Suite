// Copyright (c) 2016 Ignat Remizov. All rights reserved.
;(function(root, undefined) {

/*#### HELPER METHODS ####*/
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

function readJsonFile(file, callback) {
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




/*#### DURATION METHODS ####*/




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
  // Maybe I could use generators... does javascript have generators?
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




/*#### DOM Manipulation methods####*/




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
 * @param: {int} index - An index for which child to set, out of bounds index appends to the end
 */
function setLengthInDOMWith(element, index) {
  length_li = getLengthDetail();
  console.log("Length Detail:", length_li, "Index:", index);
  if (index < length_li.childNodes.length) {
    length_li.replaceChild(element, length_li.childNodes[index]);
  } else {
    length_li.appendChild(element);
  };
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
 * Renders a playlist length to the DOM
 *
 * @param {string} length - A readable length of the playlist
 */
function renderLengthToDOM(length) {
  function DOMLoadedHandler(){
    console.log("Adding length:", length);
    removeLoader();
    setLengthInDOMWith(document.createTextNode("Total time: " + length), 0);
    document.removeEventListener('DOMContentLoaded', DOMLoadedHandler);
  };
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
  // Format of etag should be exactly like
  // "q5k97EMVGxODeKcDgp8gnMu79wM/yuXnADNEaHjLlGZ9sRsVjutAOEM"
  // So the etag in a js string would look like
  // "\"q5k97EMVGxODeKcDgp8gnMu79wM/yuXnADNEaHjLlGZ9sRsVjutAOEM\""
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
      console.log("Response headers:", x.getAllResponseHeaders());
      callback(x);
    };
  };
  x.onerror = function() {
    errorCallback('Network error.');
  };
  x.send(null);
}




/*#### MAIN METHODS ####*/




/**
 * Calls the Youtube API to read the length of the current playlist
 *
 * @param {string} pl_id - The ID for the playlist to get
 * @param {string} key - The Youtube data v3 api key
 * @param {function(string)} callback - called when the length of a Youtube Playlist is parsed
 */
function getPlaylistLength(pl_id, key, callback) {
  console.log("Getting playlist length");
  // TODO: cache etag to quickly return playlist length !important
  // Api url to get video id's from playlistItems
  var pl_api_url = "https://www.googleapis.com/youtube/v3/playlistItems"
  var pl_api_query = "?part=contentDetails&maxResults=50"
  var pl_api_params = "&fields=etag%2Citems%2FcontentDetails%2CnextPageToken%2CprevPageToken";
  var pl_api_key = "&key=" + key;
  // Api url to get video durations given a bunch of video id's
  var videos_api_url = "https://www.googleapis.com/youtube/v3/videos" +
  "?part=contentDetails&id={0}&fields=etag%2Citems%2FcontentDetails%2Fduration&key=" + key;
  var length;     // Rendered length
  var total = 0;  // Current videos processed
  var totalResults;
  var token;      // Next page token
  var video_ids;  // Array of video id's
  var durations = [];

  // Get the number of items in the playlist
  asyncJsonGET(pl_api_url + pl_api_query + "&playlistId=" + pl_id + "&fields=pageInfo%2FtotalResults" + pl_api_key, res => {
    // Do all the calls to the entire playlist, paginated to 50 items.
    // page tokens are always the same for different playlists when requesting 50 playlist items at a time
    var pages = Math.ceil(res.pageInfo.totalResults/50) //How many requests to make
    var async_i = 0 //Track the amount of async calls
    for (var i = 0; i < pages; i++) {
      asyncJsonGET(pl_api_url + pl_api_query + "&playlistId=" + pl_id + pl_api_params + pl_api_key + "&pageToken=" + pageTokens[i], pl_res => {
        console.log("Next 50 Playlist Items:", res);
        // Convert response into a list of video id's
        video_ids = pl_res.items.map(item => item.contentDetails.videoId);
        // Keep track of videos processed
        total += video_ids.length;
        // Call to /videos
        asyncJsonGET(videos_api_url.format(video_ids.join(',')), videos => {
          console.log("Video repsonse:", videos);
          // Render videos processed so far
          setLengthInDOMWith(document.createTextNode(total + "/" + res.pageInfo.totalResults), 1);
          durations = durations.concat(videos.items);
          // If this is the last page, sum all durations together and return to the callback
          console.log("Page", async_i, "and total pages is", pages);
          if (async_i === pages - 1) {
            console.log("Finished Requesting on page", i);
            length = formatDuration(sumLengthsIntoDuration(durations),
                     document.location.pathname === "/playlist" ? "long" : "short");
            callback(length);
          }
          async_i++;
        }, err => {
          console.error(err);
        }); //Close call to videos
      }, err => {
        console.error(err);
      }); //Close get to playlist Items
    } //Close for loop
  }, err => {
    console.error(err);
  }); //Close get to playlist total video count
};

/**
 * Run on script load
 */
var spinner = document.createElement('span');
spinner.setAttribute('class', 'yt-spinner-img  yt-sprite');
spinner.setAttribute('id', 'pl-loader-gif');

// Main function, run on DOM load
function main() {
  console.log("Dom loaded");
  document.removeEventListener('DOMContentLoaded', main);
  setLengthInDOMWith(spinner, 0);
  console.log("Main ran, loader added");
};
document.addEventListener('DOMContentLoaded', main);

addFormatStringFunction()
var keys_URL = chrome.extension.getURL("keys.json");
var tokens_URL = chrome.extension.getURL("pageTokens.json")
readJsonFile(tokens_URL, json => {
  console.log("Page Tokens read");
  pageTokens = JSON.parse(json)["pageTokens"];
});
readJsonFile(keys_URL, json => {
  var keys = JSON.parse(json);
  var list_regex = /(?:https?:\/\/)www\.youtube\.com\/(?:(?:playlist)|(?:watch))\?.*?(?:list=([A-z\d-]+)).*/;
  var url = document.location.href;
  var list_id = url.match(list_regex)[1];
  console.log("list id:",list_id);
  getPlaylistLength(list_id, keys["YTDataAPIKey"],
    renderLengthToDOM
  );
});

})(this);
