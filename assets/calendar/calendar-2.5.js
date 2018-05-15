//
// JavaScript Event Calendar
//
// Version: 2.5
// Date: July 16, 2013
//
// Copyright (c) 1998 - 2013 Kevin Ilsen
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
// 
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
// 
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.
// 
//
// Basic usage:
//  - (optional but recommended) define CSS settings to customize the look of the calendar
//  - put a <div> element somewhere on your page, with a unique id
//  - create a new JEC object, indicating the id of the div
//  - define one or more events (the .defineEvents() function can be invoked
//    multiple times, and each invocation can define multiple events)
//  - show the calendar 
//
// Example:
//
// <head>
//   <script type="text/javascript" src="{path-to-local-js-files}/calendar-2.5.js"></script>
//   <script type="text/javascript">
//     var myCalendar = new JEC('myCalendarContainer');
//     myCalendar.defineEvents([
//       { 
//         eventDate: 20100407, 
//         eventDescription: 'JEC 2.0 Released', 
//         eventLink: 'http://calendar.ilsen.net',
//         eventLinkTitle: 'A JavaScript Event Calendar'
//       },
//       { eventDate: 20100401, eventDescription: 'April Fools Day' }
//     ]);
//     myCalendar.showCalendar();
//   </script>
//   <link rel="stylesheet" href="{path-to-local-css-files/mycalendar.css" type="text/css" />
// </head>
// <body>
//   .
//   .
//   <div id='myCalendarContainer'></div>
//   .
//   .
// </body>
//
// The constructor JEC( ) can also accept a second argument: an object where you
// can specify options, such as the name of the CSS class that wraps the calendar.
//     
// For more information and examples, see: http://calendar.ilsen.net
//
// Contact: kevin@ilsen.net
//

(function() {

  // Utility to get a DOM element
  var _Dom = {
    get: function(el) {
      if (typeof el == 'string') {
        return document.getElementById(el);
      } else {
        return el;
      }
    }
  };

  // Utility to add an Event handler
  var _Event = {
    add: function() {
      if (typeof window.addEventListener != 'undefined') {
        return function(el, type, fn) {
          _Dom.get(el).addEventListener(type, fn, false);
        };
      } else if (typeof window.attachEvent != 'undefined') {
        return function(el, type, fn) {
          // For IE window onload events, need to manually
          // "chain" the functions together to preserve
          // the proper order.
          if (el == window && type == 'load') {
            var oldOnload = window.onload;
            if (typeof oldOnload != 'function') {
              window.onload = fn;
            } else {
              window.onload = function() {
                if (oldOnload) {
                  oldOnload();
                }
                fn();
              };
            }
          } else {
            var f = function() {
              fn.call(_Dom.get(el), window.event);
            };
            _Dom.get(el).attachEvent('on' + type, f);
          }
        };
      }
    }()
  };

  // Utility function that fixes a Netscape 2 and 3 bug
  var _getFullYear = function(d) { // d is a date object
    var yr = d.getYear();
    if (yr < 1000)
      yr += 1900;
    return yr;
  };

  // Various internal utility functions for date manipulation
  var _numDaysIn = function(mo,yr) {
    if (mo==4 || mo==6 || mo==9 || mo==11) return 30;
    else if ((mo==2) && _leapYear(yr)) return 29;
    else if (mo==2) return 28;
    else return 31;
  };
  var _leapYear = function(yr) {
    if (((yr % 4 == 0) && yr % 100 != 0) || yr % 400 == 0) return true;
    else return false;
  };
  var _prevMonth = function(mth) {
    if (mth == 1) return 12;
    else return (mth-1);
  };
  var _nextMonth = function(mth) {
    if (mth == 12) return 1;
    else return (mth+1);
  };
  var _prevYearMonth = function(yrmth) {
    if ((yrmth % 100) == 1) return ((yrmth-100)+11);
    else return (yrmth-1);
  };
  var _nextYearMonth = function(yrmth) {
    if ((yrmth % 100) == 12) return ((yrmth-11)+100);
    else return (yrmth+1);
  };

  // The calendar "class"
  JEC = function(container, options) {

    // After the page finishes loading, get the container element
    var _container = null;
    _Event.add(window, 'load', function() {
      _container = _Dom.get(container);
    });    

    // Get the options
    options = options || {};
    // The CSS class for the calendar table
    var _tableClass = options.tableClass || 'JEC';
    // 1=Sunday, 2=Monday, . . . 7=Saturday; default=1
    var _firstDayOfWeek = (options.firstDayOfWeek === 1 ? 1 : options.firstDayOfWeek ? options.firstDayOfWeek : 1);     
    // 1=Sunday, 2=Monday, . . . 7=Saturday; 0=none; default = none
    var _specialDay = (options.specialDay === 0 ? 0 : options.specialDay ? options.specialDay : 0); 
    var _specialDays = options.specialDays || [ _specialDay ];
    // Open event links in a new window?  (default = true)
    var _linkNewWindow = options.linkNewWindow === false ? false : true;
    // Open date links in a new window?  (default = false)
    var _dateLinkNewWindow = options.datelinkNewWindow === true ? true : false;
    // The arrays of month names and weekday names (these can be overridden before displaying the calendar)
    var _months = options.months || [ 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December' ];
    var _weekdays = options.weekdays || [ 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat' ];
    // Map that allows week to start on a different day
    var _weekdayMap = new Array(7);
    var _reverseWeekdayMap = new Array(7);
    for (var i=0; i<7; i++) {    	
      var j = (_firstDayOfWeek + i - 1) % 7;
      _weekdayMap[i] = j + 1;
      _reverseWeekdayMap[j] = i;
    }
    // Initialize the range of the calendar to Jan - Dec of the current year, or use options.firstMonth and
    // options.lastMonth if they are supplied. Defined events will change the first and last month dynamically. 
    var _today = new Date();
    var _firstMonth = options.firstMonth || _getFullYear(_today) * 100 + 1;
    var _lastMonth = options.lastMonth || _firstMonth + 11;
  
    // _events[] is a 'sparse' array -- aka a JavaScript associative array;
    // each element's index is a numeric date (YYYYMMDD)
    // and the value is an an array of objects defining the events/images/links for that date
    var _events = [];  

    // _dateLinks[] is a 'sparse' array -- aka a JavaScript associative array;
    // each element's index is a numeric date (YYYYMMDD)
    // and the value is an object containing the link target and link title
    var _dateLinks = [];

    // _dateClasses[] is a 'sparse' array -- aka a JavaScript associative array;
    // each element's index is a numeric date (YYYYMMDD)
    // and the value is the name of one or more classes (space-separated)
    var _dateClasses = [];

    // Private function used by _buildMonth() to build the table cell for a single date
    var _buildDate = function(yr, mo, dy, dayofweek, currentyear, currentmonth, currentday) {
      var elTd = document.createElement('td');
      var classes = '';
      for (var i=0; i<_specialDays.length; i++)
        if (dayofweek == _specialDays[i]) classes += ' daySpecial';
      if ((yr == currentyear) && (mo == currentmonth) && (dy == currentday)) classes += ' dayToday';
      var elDate = document.createElement('div');
      elDate.setAttribute('class', 'date');
      elDate.className = 'date';
      var ind = (((yr * 100) + mo) * 100) + dy;
      if (_dateClasses[ind])
      	classes += ' ' + _dateClasses[ind];
      if (_dateLinks[ind]) {
        var elA = document.createElement('a');
        elA.setAttribute('href', _dateLinks[ind].link);
        if (_dateLinkNewWindow)
          elA.setAttribute('target', '_blank');
        if (_dateLinks[ind].title)
          elA.setAttribute('title', _dateLinks[ind].title);
        elA.innerHTML = dy;
        elDate.appendChild(elA);        
      } else {
        elDate.innerHTML = dy;
      }
      elTd.appendChild(elDate);    
      if (_events[ind]) {
    	  var eventListForDate = _events[ind];
    	  eventListForDate.sort(function(a,b) { 
    	    if (typeof a.eventTime === 'undefined') {
    	      if (typeof b.eventTime === 'undefined') {
    	        return 0;
    	      } else {
    	        return -1;
    	      }
    	    } else if (typeof b.eventTime === 'undefined') {
    	      return 1;
    	    } else {
    	      return parseFloat(a.eventTime) - parseFloat(b.eventTime);
    	    }
    	  });
        classes += ' dayHasEvent';
        for (var i=0; i<eventListForDate.length; i++) {
          var currentEvent = eventListForDate[i];
          var elEventBlock = document.createElement('div');
          elEventBlock.setAttribute('class', 'events');
          elEventBlock.className = 'event';
          if (currentEvent.image && currentEvent.image != '') {
            var elImg = document.createElement('img');
            elImg.setAttribute('src', currentEvent.image);
            if (currentEvent.width && currentEvent.height) {
              elImg.setAttribute('width', currentEvent.width);
              elImg.setAttribute('height', currentEvent.height);
            }
            elEventBlock.appendChild(elImg);
          }
          var eventDescription = currentEvent.eventDescription;
          if (currentEvent.eventTime && currentEvent.eventTime != '') {
            var ampm = 'am';
            var hrs = Math.floor(currentEvent.eventTime / 100);
            if (hrs == 0) {
              hrs = 12;
            } else if (hrs > 12) {
              hrs -= 12;
              ampm = 'pm';              
            } else if (hrs == 12) {
              ampm = 'pm';
            }
            var mins = currentEvent.eventTime % 100;
            if (mins < 10) {
              mins = '0' + mins;
            }
            eventDescription = hrs + ':' + mins + ' ' + ampm + ': '+ eventDescription;
          }
          if (currentEvent.eventLink && currentEvent.eventLink != '') {
            var elA = document.createElement('a');
            elA.setAttribute('href', currentEvent.eventLink);
            if (_linkNewWindow)
              elA.setAttribute('target', '_blank');
            elA.innerHTML = eventDescription;
            if (currentEvent.eventLinkTitle && currentEvent.eventLinkTitle != '')
          	  elA.setAttribute('title', currentEvent.eventLinkTitle);
            if (currentEvent.eventLinkClass && currentEvent.eventLinkClass != '')
              elA.setAttribute('class', currentEvent.eventLinkClass);
            elEventBlock.appendChild(elA);
          } else {
            var elSpan = document.createElement('span');
            elSpan.innerHTML = eventDescription;
            elEventBlock.appendChild(elSpan);
          }        	
          elTd.appendChild(elEventBlock);
        }        
      }
      elTd.setAttribute('class', classes);
      elTd.className = classes;
      return elTd;
    };

    // Private function that builds the calendar for a particular year/month.
    var _buildMonth = function(yearmonth) {
      var curdy, curmo, curyr, yr, mo, dy, dayofweek, bgn, lastday;

      // Get the year and month
      if (typeof yearmonth == 'string') yearmonth = parseInt(yearmonth);
      mo = yearmonth % 100;
      yr = (yearmonth - mo) / 100;
  
      // Save the current day, month, and year for comparison
      curdy = _today.getDate();
      curmo = _today.getMonth()+1;
      curyr = _getFullYear(_today);
      
      // Constrain to the range of months with events
      if (yearmonth < _firstMonth) {
        mo = _firstMonth % 100;
        yr = (_firstMonth - mo) / 100;
        yearmonth = _firstMonth;
      }
      if (yearmonth > _lastMonth) {
        mo = _lastMonth % 100;
        yr = (_lastMonth - mo) / 100;
        yearmonth = _lastMonth;
      }
  
      // Create a date object for the first day of the desired month
      bgn = new Date(yr, mo-1, 1);
      
      // Get the day-of-week of the first day, and the # days in the month
      dayofweek = bgn.getDay();
      lastday = _numDaysIn(mo,yr);
      
      // Build the calendar as an HTML table
      
      // The table head contains the month/year label
      var elThead = document.createElement('thead');
      var elTr = document.createElement('tr');
      var elTh = document.createElement('th');
      elTh.setAttribute('colspan', 7);
      elTh.setAttribute('colSpan', 7);
      elTh.innerHTML = _months[mo-1] + '&nbsp;' + yr;
      elTr.appendChild(elTh);
      elThead.appendChild(elTr);
  
      // The table body contains the week day names, and the days and events
      var elTbody = document.createElement('tbody');
      elTr = document.createElement('tr');
      for (var i=0;i<7;i++){
        elTh = document.createElement('th');
        elTh.innerHTML = _weekdays[[_weekdayMap[i]]-1];
        elTr.appendChild(elTh);
      }
      elTbody.appendChild(elTr);
      elTr = document.createElement('tr');
      var elTd = document.createElement('td');
      dy = 1;
      // Special handling for the first week of the month
      for (var i=0;i<7;i++) {
    	if (i >= _reverseWeekdayMap[dayofweek]) {
    	  elTd = _buildDate(yr,mo,dy,_weekdayMap[i],curyr,curmo,curdy);
          dy++;
        } else {
          elTd = document.createElement('td');
          elTd.setAttribute('class', 'dayBlank');
          elTd.className = 'dayBlank';
        }
        elTr.appendChild(elTd);
      }
      elTbody.appendChild(elTr);
      // Rest of the weeks . . .
      while (dy <= lastday) {
        elTr = document.createElement('tr');
        for (var i=0;i<7;i++) {
          if (dy <= lastday) {
            elTd = _buildDate(yr,mo,dy,_weekdayMap[i],curyr,curmo,curdy);
            dy++;
          } else {
            elTd = document.createElement('td');
            elTd.setAttribute('class', 'dayBlank');
            elTd.className = 'dayBlank';
          }
          elTr.appendChild(elTd);
        }
        elTbody.appendChild(elTr);
      }
  
      // The table foot contains the links to other months
      var elTfoot = document.createElement('tfoot');
      elTr = document.createElement('tr');
      elTh = document.createElement('th');
      elTh.setAttribute('colspan', 2);
      elTh.setAttribute('colSpan', 2);
      if (yearmonth > _firstMonth) {
        var elA = document.createElement('a');
        elA.setAttribute('href', 'javascript:;');
        _Event.add(elA, 'click', function() {
          showCalendar(_prevYearMonth(yearmonth));
        });
        elA.innerHTML = '&larr;&nbsp;' + _months[_prevMonth(mo)-1];
        elTh.appendChild(elA);
      }
      elTr.appendChild(elTh);
      elTh = document.createElement('th');
      elTh.setAttribute('colspan', 3);
      elTh.setAttribute('colSpan', 3);
      var elSelect = document.createElement('select');
      elSelect.setAttribute('size', 1);
      _Event.add(elSelect, 'change', function() {
        showCalendar(this.options[this.selectedIndex].value);
      });
      for (var ym = _firstMonth; ym <= _lastMonth; ym = _nextYearMonth(ym)) {
        var selMo = ym % 100;
        var selYr = (ym - selMo) / 100;
        var elOption = document.createElement('option');
        elOption.setAttribute('value', ym);
        if (ym == yearmonth) elOption.setAttribute('selected', 'selected');
        elOption.innerHTML = _months[selMo-1] + ' ' + selYr;
        elSelect.appendChild(elOption);
      }
      elTh.appendChild(elSelect);
      elTr.appendChild(elTh);
      elTh = document.createElement('th');
      elTh.setAttribute('colspan', 2);      
      elTh.setAttribute('colSpan', 2);      
      if (yearmonth < _lastMonth) {
        var elA = document.createElement('a');
        elA.setAttribute('href', 'javascript:;');
        _Event.add(elA, 'click', function() {
          showCalendar(_nextYearMonth(yearmonth));
        });
        elA.innerHTML = _months[_nextMonth(mo)-1] + '&nbsp;&rarr;';
        elTh.appendChild(elA);
      }
      elTr.appendChild(elTh);
      elTfoot.appendChild(elTr);
      // Put it all together into a table
      var elTable = document.createElement('table');
      elTable.setAttribute('class', _tableClass);
      elTable.className = _tableClass;
      elTable.appendChild(elThead);
      elTable.appendChild(elTbody);
      elTable.appendChild(elTfoot);

      return elTable;
    };

    // This private function actually displays the calendar.
    // It accepts a previously built element (the table that
    // contains the calendar) and appends it to the container
    // (after removing all existing children from the container).
    var _displayCalendar = function(elTable) {
      // Empty the container of any previous contents (e.g., previous calendar month)
      if (_container.hasChildNodes()) {
        while (_container.childNodes.length >= 1) {
          _container.removeChild(_container.firstChild);       
        } 
      }
      _container.appendChild(elTable);
    };
    
    // Private utility function used by the public functions that define events.
    var _defineEvent = function(eventObject) {
      // If this is the first event for this date, create a sparse array for that date
	    if (!_events[eventObject.eventDate]) {
	  	  _events[eventObject.eventDate] = new Array();
	    }
	    // Add the event to the sparse array
	    var eventListForDate = _events[eventObject.eventDate];
	    eventListForDate.push(eventObject);
	    _events[eventObject.eventDate] = eventListForDate;
	    // Adjust the minimum and maximum month & year to include this date
	    var tmp = Math.floor(eventObject.eventDate / 100);
	    if (tmp < _firstMonth) _firstMonth = tmp;
	    if (tmp > _lastMonth) _lastMonth = tmp;
	  };

    // PUBLIC FUNCTIONS
    
    // Each event is defined by calling the .defineEvent( ) method with the following parameters:
    //
    //   defineEvent(eventDate, eventDescription, eventLink, image, width, height, eventLinkTitle)
    //        eventDate is a numeric value in the format YYYYMMDD
    //        evenDescription is a string that can include embedded HTML tags (e.g., <BR>, <strong>, etc.)
    //        eventLink is the URL of the target page if a hyperlink is desired from this event entry
    //        image is the URL of the image if you want to display an image with this event
    //        width is the width of the image in pixels
    //        height is the height of the image in pixels
    //        eventLinkTitle is the optional title for the hyperlink (displayed on mouse hover) 
    //
    // (This method is basically the same as the DefineEvent() function from the original JEC 1.0 implementation.)    
    var defineEvent = function(eventDate, eventDescription, eventLink, image, width, height, eventLinkTitle) {
      var eventObject = new Object();
      eventObject.eventDate = eventDate;
      eventObject.eventDescription = eventDescription;
      eventObject.eventLink = eventLink;
      eventObject.eventLinkTitle = eventLinkTitle;
      eventObject.image = image;
      eventObject.imageWidth = width;
      eventObject.imageHeight = height;
      return _defineEvent(eventObject);
    };
    
    // Multiple events may be defined using the .defineEvents( ) method. Pass an array of objects; each
    // object can specify the following properties:
    //   eventDate
    //   eventTime
    //   eventDescription
    //   eventLink
    //   eventLinkTitle
    //   image
    //   imageWidth
    //   imageHeight
    var defineEvents = function(eventObjectArray) {
      for (var i in eventObjectArray) {
        _defineEvent(eventObjectArray[i]);
      }
    };
    
    // A date can be linked to a URL by calling the .linkDate( ) method with the following parameters:
    //
    //   linkDate(linkedDate, dateLink, dateLinkTitle)
    //        linkedDate is a numeric value in the format YYYYMMDD
    //        dateLink is the URL of the target page for this date
    //        dateLinkTitle is the optional title for the hyperlink (displayed on mouse hover)
    var linkDate = function(linkedDate, dateLink, dateLinkTitle) {
      _dateLinks[linkedDate] = { link: dateLink, title: dateLinkTitle };
      // Adjust the minimum and maximum month & year to include this date
      var tmp = Math.floor(linkedDate / 100);
      if (tmp < _firstMonth) _firstMonth = tmp;
      if (tmp > _lastMonth) _lastMonth = tmp;
    };

    // Multiple date links may be defined using the .linkDates( ) method. Pass an array of objects; each
    // object must specify the following properties:
    //   linkedDate
    //   dateLink
    //   dateLinkTitle
    var linkDates = function(dateLinkObjectArray) {
      for (var i in dateLinkObjectArray) {
        var dateLinkObject = dateLinkObjectArray[i];
        var linkedDate = dateLinkObject.linkedDate;
        var dateLink = dateLinkObject.dateLink;
        var dateLinkTitle = dateLinkObject.dateLinkTitle;
        linkDate(linkedDate, dateLink, dateLinkTitle);
      }
    };
    
    // A date can be styled with a particular class, by calling the .styleDate( ) method with the following parameters:
    //
    //    styleDate(styledDate, dateClass)
    //        styledDate is a numeric value in the format YYYYMMDD
    //        dateClass is a string value containing the name of the class to apply (to apply multiple classes 
    //            to the date, specify all of the class names, separated by spaces)
    var styleDate = function(styledDate, dateClass) {
      _dateClasses[styledDate] = dateClass;
      // Adjust the minimum and maximum month & year to include this date
      var tmp = Math.floor(styledDate / 100);
      if (tmp < _firstMonth) _firstMonth = tmp;
      if (tmp > _lastMonth) _lastMonth = tmp;
    };
    
    // Multiple date classes may be applied using the .styleDates( ) method. Pass an array of objects; each
    // object must specify the following properties:
    //   styledDate
    //   dateClass
    var styleDates = function(dateClassObjectArray) {
      for (var i in dateClassObjectArray) {
    	var dateClassObject = dateClassObjectArray[i];
    	var styledDate = dateClassObject.styledDate;
    	var dateClass = dateClassObject.dateClass;
    	styleDate(styledDate, dateClass);
      }
    };
    
    // This function builds and displays the calendar. It can take a year/month
    // as its argument (YYYYMM) or shows the current month by default.
    var showCalendar = function(yearmonth) {
      if (!yearmonth) {
        var curmo = _today.getMonth() + 1;
  
        // Default to current month and year
        var mo = curmo;
        var yr = _getFullYear(_today);
        yearmonth = (yr * 100) + mo;
      }

      var elTable = _buildMonth(yearmonth);

      // Display the calendar
      if (_container) {
        // The container element exists, so display the calendar now
        _displayCalendar(elTable);
      } else {
        // Make sure the page has finished loading, before displaying the calendar
        _Event.add(window, 'load', function() {
          _displayCalendar(elTable);
        });
      }
    };

    return {      
      defineEvent: defineEvent,      
      defineEvents: defineEvents,
      linkDate: linkDate,
      linkDates: linkDates,
      styleDate: styleDate,
      styleDates: styleDates,
      showCalendar: showCalendar
    };
  
  };  // end of the JEC "class" definition

})();  // end of the outer closure