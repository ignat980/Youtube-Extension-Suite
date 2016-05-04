;(function(root, undefined) {
  /**
   * Reduces a bunch of ISO 8601 durations into a moment.Duration object
   *
   * @param {[string]} data - An array of ISO 8601 formatted strings
   * @returns {Duration} - The sum of the ISO 8601 strings as a moment.Duration object
   */
  function sumLengthsIntoDuration(data) {
    // console.log("Summing together strings");
    return data.reduce((previous, current) => {
      var duration = previous.contentDetails ? moment.duration(previous.contentDetails.duration) : previous;
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
    // console.log("Formatting", duration);
    var length;
    if (format_string === "long") {
      format = [
        duration.years() === 1 ? "Year" : "Years",
        duration.months() === 1 ? "Month" : "Months",
        duration.days() === 1 ? "Day" : "Days",
        duration.hours() === 1 ? "Hour" : "Hours",
        duration.minutes() === 1 ? "Minute" : "Minutes",
        duration.seconds() === 1 ? "Second" : "Seconds"
      ];
      length = duration.format("y [" + format[0] + "] M [" + format[1] + "] d [" + format[2] +
      "] h [" + format[3] + "] m [" + format[4] + " and] s [" + format[5] + "]");
    } else if (format_string === "short") {
      length = duration.format("y[y] M[m] d[d] h:mm:ss");
    } else {
      length = duration.format(format_string);
    };
    return length;
  }

  root.sumLengthsIntoDuration = sumLengthsIntoDuration
  root.formatDuration         = formatDuration
})(this);
