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
  addFormatStringFunction();

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
   * @param {string} etag -
   */
  function asyncJsonGET(url, callback, errorCallback, etag) {
    var x = new XMLHttpRequest();
    x.open("GET", url);
    if (etag){
      x.setRequestHeader("If-None-Match", etag)
    }
    x.responseType = 'json';
    x.onload = function() {
      if (x.status === 400 || x.status === 404) {
        console.error(x);
        errorCallback(x);
      } else if (x.status === 304) {
        console.log("No change.");
        callback(x)
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
  }

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

  /**
   * Runs an external script
   *
   * @param {string} script - The filepath to the script to be run
   */
  function addLoader(script) {
    var script_element = document.createElement('script');
    script_element.type = 'text/javascript';
    script_element.src = chrome.extension.getURL(script);
    document.head.appendChild(spinner_script);
  };

  root.AsyncLooper             = AsyncLooper
  root.asyncJsonGET            = asyncJsonGET
  root.testingEtag             = testingEtag
  root.readJsonFile            = readJsonFile
  root.addLoader               = addLoader
})(this);
