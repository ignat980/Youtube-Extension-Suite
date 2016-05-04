chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    console.log("Recieved a message from", sender.tab ?
                "a content script: " + sender.tab.url :
                "the extension");
    // console.log(request);
    if (request.name === 'getAuthToken') {
      chrome.identity.getAuthToken({'interactive': false}, token => {
        // console.log("Token set");
        sendResponse(token)
      })
      return true
    }
});
