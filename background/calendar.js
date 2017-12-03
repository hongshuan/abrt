function getTime() {
    // initialize time-related variables with current time settings
    var now = new Date();
    var hour = now.getHours();
    var minute = now.getMinutes();
    var ampm = "" ;

    // validate hour values and set value of ampm
    if (hour >= 12) {
        hour -= 12;
        ampm = "PM";
    } else {
        ampm = "AM";
    }
    hour = (hour == 0) ? 12 : hour;

    // add zero digit to a one digit minute
    if (minute < 10) {
        minute = "0" + minute; // do not parse this number!
    }

    // return time string
    return hour + ":" + minute + " " + ampm;
}

function leapYear(year) {
    if (year % 4 == 0)
        return true;

    return false;
}

// return number of days in the specified month (parameter)
function getDays(month, year) {
    var ar = new Array(12)
    ar[0] = 31; // January
    ar[1] = (leapYear(year)) ? 29 : 28; // February
    ar[2] = 31; // March
    ar[3] = 30; // April
    ar[4] = 31; // May
    ar[5] = 30; // June
    ar[6] = 31; // July
    ar[7] = 31; // August
    ar[8] = 30; // September
    ar[9] = 31; // October
    ar[10] = 30; // November
    ar[11] = 31; // December

    return ar[month];
}

// return name of specified month (parameter)
function getMonthName(month) {
    var ar = new Array(12);
    ar[0] = "January";
    ar[1] = "February";
    ar[2] = "March";
    ar[3] = "April";
    ar[4] = "May";
    ar[5] = "June";
    ar[6] = "July";
    ar[7] = "August";
    ar[8] = "September";
    ar[9] = "October";
    ar[10] = "November";
    ar[11] = "December";

    return ar[month];
}

function getCalendar(date) {
    var year, month, day, monthName;

    [ year, month, day ] = date.split('-');

    var now = new Date(year, month-1, day);

    year = now.getFullYear();
    month = now.getMonth();
    monthName = getMonthName(month);
    day = now.getDate();

    // create instance of first day of month, and extract the day on which it occurs
    var firstDayInstance = new Date(year, month, 1);
    var firstDay = firstDayInstance.getDay();

    // number of days in current month
    var days = getDays(month, year);

    // call function to draw calendar
    return drawCalendar(firstDay + 1, days, day, monthName, year);
}

function drawCalendar(firstDay, lastDate, date, monthName, year) {
    var text = "";

    text += '<center>';
    text += '<table border="0" cellspacing="4">';
    text += '<th colspan=7 height=50>';
    text += monthName + ' ' + year;
    text += '</th>';

    var weekDay = new Array(7);
    weekDay[0] = "Sun";
    weekDay[1] = "Mon";
    weekDay[2] = "Tues";
    weekDay[3] = "Wed";
    weekDay[4] = "Thu";
    weekDay[5] = "Fri";
    weekDay[6] = "Sat";

    // create first row of table to set column width and specify week day
    text += '<tr class="weekdays" align="center" valign="center">'
    for (var dayNum = 0; dayNum < 7; ++dayNum) {
        text += '<td>' + weekDay[dayNum] + '</td>'; 
    }
    text += '</tr>'

    // declaration and initialization of two variables to help with tables
    var digit = 1;
    var curCell = 1;

    for (var row = 1; row <= Math.ceil((lastDate + firstDay - 1) / 7); ++row) {
        text += '<tr class="days" align="center" valign="center">';
        for (var col = 1; col <= 7; ++col) {
            if (digit > lastDate) {
                break;
            }
            if (curCell < firstDay) {
                text += '<td>&nbsp;</td>';
                curCell++;
            } else {
                if (digit == date) { // current cell represent today's date
                    text += '<td class="day today"' + ' id="day' + digit + '">';
                    text += digit;
                    text += '</td>';
                } else {
                    text += '<td class="day"' + ' id="day' + digit + '">' + digit + '</td>';
                }
                digit++;
            }
        }
        text += '</tr>';
    }

    text += '</table>';
    text += '</center>';

    return text;
}
