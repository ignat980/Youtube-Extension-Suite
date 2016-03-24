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

/**
 * Gives the number of days in a particular month
 *
 * @param {int} year - The year the month is in
 * @param {int} month - The specific month you want the days in
 */
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
  var url = document.location
  getPlaylistLength(document.location.pathname === "/playlist" ? "long" : "short", function (length) {
    console.log("Calculated length:" + length);
    renderLength(length);
  });
});
console.log("Script ran");
})(this)
