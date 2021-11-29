export const pixelsToMm = (d, dpi) => 25.4 * d / dpi;

export const getCartesianDistanceInMm = (x1, y1, x2, y2, dpix, dpiy) => {
    return Math.sqrt(Math.pow(25.4 * (x2 - x1) / dpix, 2) + Math.pow(25.4 * (y2 - y1) / dpiy, 2));
};

export const getCartesianDistanceInPx = (x1, y1, x2, y2) => {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
};

export const surfacePolygonInMm = (coordinatesPolygon, dpix, dpiy) => {
    const numPoints = coordinatesPolygon.length;
    let area = 0;         // Accumulates area in the loop
    let j = numPoints - 1; // The last vertex is the 'previous' one to the first

    for (let i = 0; i < numPoints; i++) {
        area = area + ((25.4 * coordinatesPolygon[j].x) / dpix + (25.4 * coordinatesPolygon[i].x) / dpix) * ((25.4 * coordinatesPolygon[j].y) / dpiy - (25.4 * coordinatesPolygon[i].y) / dpiy);
        j = i;  //j is previous vertex to i
    }
    return Math.abs(area / 2);
};

export const convertMMToDpi = (mmValue, pxValue) => {
    let result = 25.4 * pxValue / mmValue;
    return !isNaN(result) && result !== Infinity ? result : 0;
};

export const getAngleInDegrees = (v1, center, v2, dpix, dpiy) => {
    let v1c = Math.sqrt(Math.pow(25.4 * (center.x - v1.x) / dpix, 2) + Math.pow(25.4 * (center.y - v1.y) / dpiy, 2));
    let cv2 = Math.sqrt(Math.pow(25.4 * (center.x - v2.x) / dpix, 2) + Math.pow(25.4 * (center.y - v2.y) / dpiy, 2));
    let v1v2 = Math.sqrt(Math.pow(25.4 * (v2.x - v1.x) / dpix, 2) + Math.pow(25.4 * (v2.y - v1.y) / dpiy, 2));

    return Math.acos((cv2 * cv2 + v1c * v1c - v1v2 * v1v2) / (2 * cv2 * v1c)) * 180 / Math.PI;
};

export const standardDeviation = values => {
    if (!values) return 0;
    if (values.length === 0) return 0;

    let avg = average(values);

    let squareDiffs = values.map(value => {
        let diff = value - avg;
        return diff * diff;
    });

    let avgSquareDiff = average(squareDiffs);

    return Math.sqrt(avgSquareDiff);
};

export const average = data => {
    if (!data) return 0;
    if (data.length === 0) return 0;

    let sum = data.reduce((sum, value) => {
        return sum + value;
    }, 0);

    return sum / data.length;
};

// It is assumed that the user has first clicked on (x1, y1) and then on (x2, y2)
// This forms a rectangle. We want to know its top left & bottom right points.
export const getTopLeftAndBottomRightPointsFromTwoClicks = (x1, y1, x2, y2) => [
    Math.min(x1, x2),
    Math.min(y1, y2),
    Math.max(x1, x2),
    Math.max(y1, y2)
];

export const convertGpsToLatLng = gps => {
    try {
        if (gps && gps.hasOwnProperty('GPSLatitude') && gps.hasOwnProperty('GPSLongitude')) {
            const latDegreesInt = Math.trunc(gps.GPSLatitude[0]);
            const latDegreesDec = gps.GPSLatitude[0] - latDegreesInt;
            const latMinutes = gps.GPSLatitude[1] + latDegreesDec * 60;
            const latMinutesInt = Math.trunc(latMinutes);
            const latMinutesDec = latMinutes - latMinutesInt;
            const latSeconds = gps.GPSLatitude[2] + latMinutesDec * 60;

            const logDegreesInt = Math.trunc(gps.GPSLongitude[0]);
            const logDegreesDec = gps.GPSLongitude[0] - logDegreesInt;
            const logMinutes = gps.GPSLongitude[1] + logDegreesDec * 60;
            const logMinutesInt = Math.trunc(logMinutes);
            const logMinutesDec = logMinutes - logMinutesInt;
            const logSeconds = gps.GPSLongitude[2] + logMinutesDec * 60;

            return `${latDegreesInt}°${latMinutesInt}'${latSeconds.toFixed(1)}"${gps.GPSLatitudeRef} ${logDegreesInt}°${logMinutesInt}'${logSeconds.toFixed(1)}"${gps.GPSLongitudeRef}`;
        }
    } catch (e) {
        console.error(e);
    }
    return '';
};

export const convertToLatLng = gps => {
    try {
        if (gps && gps.hasOwnProperty('GPSLatitude') && gps.hasOwnProperty('GPSLongitude')) {

            const latitude = toDegreesMinutesAndSeconds(gps.GPSLatitude);
            const longitude = toDegreesMinutesAndSeconds( gps.GPSLongitude);
            return latitude + gps.GPSLatitudeRef + " " + longitude + gps.GPSLongitudeRef;
        }
    } catch (e) {
        console.error(e);
    }
    return '';
};

function toDegreesMinutesAndSeconds(coordinate) {

    const absolute = Math.abs(coordinate);
    const degrees = Math.floor(absolute);
    const minutesNotTruncated = (absolute - degrees) * 60;
    const minutes = Math.floor(minutesNotTruncated);
    const seconds = Math.floor((minutesNotTruncated - minutes) * 60);

    return `${degrees}°${minutes}'${seconds}"`;
}

export const _formatTimeDisplay = (time) => {


    // HH:mm:ss.SSS
    if(time === 0) {
        return "00:0"
    }

    const hours = Math.trunc(time / 3600)
    const minutes = Math.trunc((time - (hours * 3600)) / 60);
    const seconds = (time - (hours * 3600) - (minutes * 60)).toFixed(1);

    let output = '';
    if (hours > 0) {
        if (hours >= 10)
            output += hours;
        else
            output += '0' + hours;
        output += ':'
    }
    if (minutes > 0) {
        if (minutes >= 10)
            output += minutes;
        else
            output += '0' + minutes;
        output += ':'
    }
    if (seconds > 0) {
        if (seconds >= 10)
            output += seconds;
        else
            output += '0' + seconds;
    }
    return output;
}

export const _formatTimeDisplayForEvent = (time) => {


    // HH:mm:ss.SSS
    if(time === 0) {
        return "00h00m00s"
    }

    const hours = Math.trunc(time / 3600)
    const minutes = Math.trunc((time - (hours * 3600)) / 60);
    const seconds = (time - (hours * 3600) - (minutes * 60)).toFixed(1);

    let output = '';
    if (hours > 0) {
        if (hours >= 10){
            output += hours;
            output += 'h';
        }
        else {
            output += '0' + hours;
            output += 'h'
        }
    }else {
        output +='00h'
    }
    if (minutes > 0) {
        if (minutes >= 10){
            output += minutes;
            output += 'm'
        }
        else{
            output += '0' + minutes;
            output += 'm'
        }
    }else{
        output +='00m'
    }
    if (seconds > 0) {
        if (seconds >= 10){
            output += seconds;
            output +='s'
        }
        else{
            output += '0' + seconds;
            output +='s'
        }
    }else{
        output +='00.0s'
    }
    return output;
}
