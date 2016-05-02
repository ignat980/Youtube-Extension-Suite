var saved_token
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    console.log("Recieved a message from", sender.tab ?
                "a content script: " + sender.tab.url :
                "the extension");
    console.log(request);
    console.log("The token is", saved_token);
    if (request.name === 'getAuthToken'){
      sendResponse(saved_token)
    } else if (request.name === 'setupToken') {
      chrome.identity.getAuthToken({'interactive': false}, token => {
        saved_token = token
        console.log("Token set");
      })
    }
});
