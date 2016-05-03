// Copyright (c) 2016 Ignat Remizov. All rights reserved.
;(function(root, undefined) {

/**
 * Calls the Youtube API to read the length of the current playlist
 *
 * @param {string} pl_id - The ID for the playlist to get
 * @param {string} key - The Youtube data v3 api key
 * @param {function(string)} callback - called when the length of a Youtube Playlist is parsed
 */
function getPlaylistLength(pl_id, key, callback, oauth_token) {
  console.log("Getting playlist length");
  // TODO: cache etag to quickly return playlist length !important
  // Api url to get video id's from playlistItems
  var pl_api_url = "https://www.googleapis.com/youtube/v3/playlistItems"
  var pl_api_query = "?part=contentDetails&maxResults=50"
  var pl_api_params = "&fields=items%2FcontentDetails%2CnextPageToken%2CprevPageToken";
  var pl_api_key = "&key=" + key + (oauth_token ? "&access_token=" + oauth_token : "");
  // Api url to get video durations given a bunch of video id's
  var videos_api_url = "https://www.googleapis.com/youtube/v3/videos" +
  "?part=contentDetails&id={0}&fields=items%2FcontentDetails%2Fduration&key=" + key;
  var length;     // Rendered length
  var total = 0;  // Current videos processed
  // var page_token; // Next page token
  var video_ids;  // Array of video id's
  var durations = [];

  // Get the number of items in the playlist
  asyncJsonGET(pl_api_url + pl_api_query + "&playlistId=" + pl_id + "&fields=pageInfo%2FtotalResults" + pl_api_key, res => {
    // Do all the calls to the entire playlist, paginated to 50 items.
    // page tokens are always the same for different playlists when requesting 50 playlist items at a time
    var pages = Math.ceil(res.pageInfo.totalResults/50) //How many requests to make
    console.log("There are", pages, "pages to request");
    if (document.readyState === "interactive" || document.readyState === "complete") {
      setLengthInDOMWith(document.createTextNode(0 + "/" + res.pageInfo.totalResults), 1);
    }
    var async_i = 0 //Track the amount of async calls
    for (var i = 0; i < pages; i++) {
      asyncJsonGET(pl_api_url + pl_api_query + "&playlistId=" + pl_id + pl_api_params + pl_api_key + "&pageToken=" + pageTokens[i], pl_res => {
        console.log("Next 50 Playlist Items:", pl_res);
        // Convert response into a list of video id's
        video_ids = pl_res.items.map(item => item.contentDetails.videoId);
        // Keep track of videos processed
        // Call to /videos
        asyncJsonGET(videos_api_url.format(video_ids.join(',')), videos => {
          console.log("Video repsonse:", videos);
          // Render videos processed so far
          total += video_ids.length;
          if (document.readyState === "interactive" || document.readyState === "complete") {
            setLengthInDOMWith(document.createTextNode(total + "/" + res.pageInfo.totalResults), 1);
          }
          durations = durations.concat(videos.items);
          // If this is the last page, sum all durations together and return to the callback
          console.log("Page", async_i, "and total pages is", pages);
          if (async_i === pages - 1) {
            console.log("Finished Requesting on page", async_i);
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
    // 403 shouldn't happen, since token is generated per page
  }); //Close get to playlist total video count
};
/**
 * Run on script load
 */
console.log('Script running');
var token;
chrome.runtime.sendMessage({name: 'getAuthToken'}, function(res) {
  token = res;
  console.log("Assigning token on init:", token);
  //Read the private keys file, the key is used in the request to get playlist length data
  readJsonFile(keys_URL, json => {
    var keys = JSON.parse(json);
    //This regex gets the playlist id
    var list_regex = /(?:https?:\/\/)www\.youtube\.com\/(?:(?:playlist)|(?:watch))\?.*?(?:list=([A-z\d-]+)).*/;
    var url = document.location.href;
    var list_id = url.match(list_regex)[1];
    console.log("Playlist id:",list_id);
    getPlaylistLength(list_id, keys["YTDataAPIKey"],
      renderLengthToDOM
    , token);
  });
});
var spinner = document.createElement('span'); //An animated gif used to show the user that something is loading
spinner.setAttribute('class', 'yt-spinner-img  yt-sprite');
spinner.setAttribute('id', 'pl-loader-gif');
var length_detail_element; //The element that contains the text for displaying info about the playlist length
var playlist_details_element; //The element that contains the details about a playlist
//Watch for changes to the DOM while it is loading
var observer = new MutationObserver(function(mutations) {
  mutations.forEach(mutation => {
    //If the playlist details node is loaded, add the loader gif
    if (mutation.target.className === 'pl-header-details' || mutation.target.className === 'playlist-details' || mutation.target.id === 'pl-detail-length') {
      console.log(mutation);
      if (!mutation.target.contains(spinner)) {
        playlist_details_element = mutation.target
        length_li = createLengthDetail()
        length_li.appendChild(spinner)
        playlist_details_element.appendChild(length_li);
        console.log("Added loader");
        observer.disconnect()
      }
    }
  });
});
//Start the observer
var config = {childList: true, subtree: true};
observer.observe(document, config);

var keys_URL = chrome.extension.getURL("keys.json");
var tokens_URL = chrome.extension.getURL("pageTokens.json")
//Parse page tokens, used to optimize getting requests
readJsonFile(tokens_URL, json => {
  console.log("Page Tokens read");
  pageTokens = JSON.parse(json)["pageTokens"];
});

})(this);
