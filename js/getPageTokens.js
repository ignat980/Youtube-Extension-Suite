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
 * @param: {object} o - an object that has
 *                        a 'length' property for how many times to iterate,
 *                        a 'loop' property which is the iteration body,
 *                        a 'callback' property that gets called at the end of the for loop
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


/*#### MAIN METHODS ####*/


/**
 * Calls the Youtube API to read the length of the current playlist
 *
 * @param {string} pl_id - The ID for the playlist to get
 * @param {string} key - The Youtube data v3 api key
 * @param {function(string)} callback - called when the length of a Youtube Playlist is parsed
 */
function getPageTokens(pl_id, key, callback) {
  console.log("Getting tokens for playlist");
  var playlist_api_url = "https://www.googleapis.com/youtube/v3/playlistItems" +
  "?part=contentDetails&maxResults=50&playlistId={0}" +
  "&fields=nextPageToken%2CprevPageToken{1}&key=" + key;
  var token; // Next page token
  var pageTokens = []; // Used to store all page tokens
  var looper = new AsyncLooper({
    // i changes after the first request because no idea about total videos before
    'i': 1,
    'loop': (i) => {
      // Call /playlistItems for the first 50 items
      var first_time = (i === 0);
      asyncJsonGET(playlist_api_url.format(pl_id, (first_time ? "%2CpageInfo%2FtotalResults" : "")) + (token ? "&pageToken=" + token : ""), res => {
        console.log("Next 50 Playlist Items:", res);
        token = res.nextPageToken;
        pageTokens.push(token);
        // If this is the first pass, set the total results and total index to iterate over
        if (first_time) {
          totalResults = res.pageInfo.totalResults;
          looper.length = Math.ceil(totalResults/50);//(totalResults < 250 ? Math.ceil(totalResults/50) : 5); //Number of requests to make
          console.log("Looping " + looper.length + " times");
        };
        looper.loop();
      }, err => {
        console.error(err);
      }); //Close Playlist items call
    },
    'callback': () => {
      console.log("Finished requesting");
      console.log(pageTokens);
    }
  }); //Close Async loop
};

/**
 * Run on script load
 */
// console.log('Script running');

addFormatStringFunction() //Add .format() method to strings
var keys_URL = chrome.extension.getURL("keys.json");
//Read the private keys file, the key is used in the request to get playlist length data
readJsonFile(keys_URL, json => {
  var keys = JSON.parse(json);
  //This regex gets the playlist id
  var list_regex = /(?:https?:\/\/)www\.youtube\.com\/(?:(?:playlist)|(?:watch))\?.*?(?:list=([A-z\d-]+)).*/;
  var url = document.location.href;
  var list_id = url.match(list_regex)[1];
  // console.log("Playlist id:",list_id);
  getPageTokens(list_id, keys["YTDataAPIKey"]);
});
})(this);
