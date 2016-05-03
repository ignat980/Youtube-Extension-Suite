(function(root,undefined){
  /**
   * Gets the element for displaying the length
   *
   * @returns: {Node} - a <li> element for displaying the length
   */
  var length_detail_element
  function getLengthDetail() {
    return (
      length_detail_element ? length_detail_element :
        length_detail_element = document.getElementById('pl-detail-length') || createLengthDetail()
    );
  };

  /**
   * Creates the element for displaying the length
   *
   * @returns: {Node} - a <li> element for displaying the length
   */
  function createLengthDetail() {
    var li = document.createElement('li');
    li.setAttribute('id','pl-detail-length');
    return li
  }

  /**
   * Finds the element for the playlist details
   *
   * @returns: {Node} - a <ul> element on the page that displays details for a playlist
   */
  var playlist_details_element //Keep track of the details element for optimzation
  function getPlaylistDetails() {
    if (playlist_details_element) {
      return playlist_details_element;
    } else {
      var playlist_details = document.getElementsByClassName('pl-header-details'); //youtube.com/playlist
      if (playlist_details.length === 0) {
        playlist_details = document.getElementsByClassName('playlist-details'); //youtube.com/watch*&list*
      };
      console.assert(playlist_details.length !== 0, 'Playlist not found in DOM');
      return playlist_details_element = playlist_details[0];
    };
  };

  /**
   * Resets the length element with the element passed into it
   *
   * @param: {Node} element - The element to be setAttribute
   * @param: {int} index - An index for which child to set, out of bounds index appends to the end
   */
  function setLengthInDOMWith(element, index) {
    var length_li = getLengthDetail();
    console.log("Setting", element, "into details at Index", index);
    if (index < length_li.childNodes.length) {
      length_li.replaceChild(element, length_li.childNodes[index]);
    } else {
      length_li.appendChild(element);
    };
    var playlist_details = getPlaylistDetails();
    if (!playlist_details.contains(length_li)) {
      playlist_details.appendChild(length_li);
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
      console.log("Don't need to add loader since length is processed");
      document.removeEventListener('DOMContentLoaded', addLoader);
      document.addEventListener('DOMContentLoaded', DOMLoadedHandler);
    };
  };

  root.getLengthDetail    = getLengthDetail
  root.createLengthDetail = createLengthDetail
  root.getPlaylistDetails = getPlaylistDetails
  root.setLengthInDOMWith = setLengthInDOMWith
  root.removeLoader       = removeLoader
  root.renderLengthToDOM  = renderLengthToDOM
})(this);
