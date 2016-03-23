// Copyright (c) 2016 Ignat Remizov. All rights reserved.

/**
 * Calls the Youtube API to read the length of the current playlist
 *
 * {function(string)} callback - called when the length of a Youtube Playlist is found
 */
function getPlaylistLength(callback) {
  // TODO: Youtube api to get playlist length
  console.log("Getting playlist length");
  var data = ["P1DT32H10M33S", "PT2M01S"];
  var parsed = moment.duration(data[0]);
  var parsed2 = moment.duration(data[1]);
  console.log("Parsed 1: " + parsed + "; Parsed 2: " + parsed2);
  parsed.add(parsed2)
  console.log("Length.format(): " + parsed.format());
  console.log("Length.toISOString(): " + parsed.toISOString());
  console.log("Length.toString(): " + parsed.toString());
  callback("12:34");
};

/**
 * Get the current URL.
 *
 * @param {function(string)} callback - called when the URL of the current tab
 *   is found.
 */
function getCurrentTabUrl(callback) {
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    var url = tabs[0].url;
    console.assert(typeof url == 'string', 'tab.url should be a string');
    callback(url);
  });
};

/**
 * @param {string} searchTerm - Search term for Google Image search.
 * @param {function(string,number,number)} callback - Called when an image has
 *   been found. The callback gets the URL, width and height of the image.
 * @param {function(string)} errorCallback - Called when the image is not found.
 *   The callback gets a string that describes the failure reason.
 */

// function getImageUrl(searchTerm, callback, errorCallback) {
//   // Google image search - 100 searches per day.
//   // https://developers.google.com/image-search/
//   var searchUrl = 'https://ajax.googleapis.com/ajax/services/search/images' +
//     '?v=1.0&q=' + encodeURIComponent(searchTerm);
//   var x = new XMLHttpRequest();
//   x.open('GET', searchUrl);
//   // The Google image search API responds with JSON, so let Chrome parse it.
//   x.responseType = 'json';
//   x.onload = function() {
//     // Parse and process the response from Google Image Search.
//     var response = x.response;
//     if (!response || !response.responseData || !response.responseData.results ||
//         response.responseData.results.length === 0) {
//       errorCallback('No response from Google Image search!');
//       return;
//     }
//     var firstResult = response.responseData.results[0];
//     // Take the thumbnail instead of the full image to get an approximately
//     // consistent image size.
//     var imageUrl = firstResult.tbUrl;
//     var width = parseInt(firstResult.tbWidth);
//     var height = parseInt(firstResult.tbHeight);
//     console.assert(
//         typeof imageUrl == 'string' && !isNaN(width) && !isNaN(height),
//         'Unexpected respose from the Google Image Search API!');
//     callback(imageUrl, width, height);
//   };
//   x.onerror = function() {
//     errorCallback('Network error.');
//   };
//   x.send();
// }

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

var iso8601DurationRegex = /(-)?P(?:([\.,\d]+)Y)?(?:([\.,\d]+)M)?(?:([\.,\d]+)W)?(?:([\.,\d]+)D)?T(?:([\.,\d]+)H)?(?:([\.,\d]+)M)?(?:([\.,\d]+)S)?/;

function parseISO8601Duration(iso8601Duration) {
  var matches = iso8601Duration.match(iso8601DurationRegex);

  var duration = {
    sign: matches[1] === undefined ? '+' : '-',
    years: matches[2] === undefined ? 0 : matches[2],
    months: matches[3] === undefined ? 0 : matches[3],
    weeks: matches[4] === undefined ? 0 : matches[4],
    days: matches[5] === undefined ? 0 : matches[5],
    hours: matches[6] === undefined ? 0 : matches[6],
    minutes: matches[7] === undefined ? 0 : matches[7],
    seconds: matches[8] === undefined ? 0 : matches[8]
  };
  return fixISO8601DurationOverflow(duration);
};

function fixISO8601DurationOverflow(duration) {

  while (duration["seconds"] >= 60) {
    duration["minutes"] += 1;
    duration["seconds"] -= 60;
  };
  while (duration["minutes"] >= 60) {
    duration["hours"] += 1;
    duration["minutes"] -= 60;
  };
  while (duration["hours"] >= 24) {
    duration["days"] += 1;
    duration["hours"] -= 24;
  };
  if (duration["weeks"]) {
    console.error("Week duration overflow in ISO 8601 formats not implemented");
  };
  var daysinmonth = daysInMonth(2016, new Date().getMonth() + duration["months"]);
  while (duration["days"] >= daysinmonth) {
    duration["months"] += 1;
    duration["days"] -= daysinmonth;
    daysinmonth = daysInMonth(2016, new Date().getMonth() + duration["months"]);
  };

  while (duration["months"] >= 12) {
    duration["years"] += 1;
    duration["months"] -= 12;
  };

  return duration;
};

function addParsedISO8601Durations(left, right) {
  var add = {
    sign: '+',
    years: left["years"] + right["years"],
    months: left["months"] + right["months"],
    weeks: 0, // It is unecessary to add weeks, since days + months define the weeks. I think.
    days: left["days"] + right["days"],
    hours: left["hours"] + right["hours"],
    minutes: left["minutes"] + right["minutes"],
    seconds: left["seconds"] + right["seconds"]
  };

  return fixISO8601DurationOverflow(add);
};

function daysInMonth(year, month) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
};
/**
 * Adds a playlist length to the DOM
 *
 * @param {string} length - The length of the playlist
 */

function renderLength(length) {
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
  getPlaylistLength(function (length) {
    console.log("Calculated length:" + length);
    renderLength(length);
  });
});
console.log("Script ran");
