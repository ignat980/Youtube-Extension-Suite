// Copyright (c) 2016 Ignat Remizov. All rights reserved.

/**
 * Calls the Youtube API to read the length of the current playlist
 *
 * {function(string)} callback - called when the length of a Youtube Playlist is found
 */
function getPlaylistLength(callback) {
  // TODO: Youtube api to get playlist length
  callback("12:34");
}

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
        }
    }
    rawFile.send(null);
}


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
  }
  lengthLi.innerText = "Total time: " + length;
  var playlistDetails = document.getElementsByClassName('pl-header-details') //youtube.com/playlist
  if (playlistDetails.length === 0) {
    playlistDetails = document.getElementsByClassName('playlist-details') //youtube.com/watch*&list*
  }
  console.assert(playlistDetails.length !== 0, 'Playlist not found in DOM');
  playlistDetails[0].appendChild(lengthLi);
}
var keysURL = chrome.extension.getURL("keys.json");
readTextFile(keysURL, function(json){
  var data = JSON.parse(json);
  console.log(data);
  getPlaylistLength(function (length) {
    console.log("Calculated length:" + length)
    renderLength(length)
  });
});
console.log("Script ran");
