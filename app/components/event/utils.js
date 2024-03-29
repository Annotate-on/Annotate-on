import Chance from "chance";
import {TYPE_CATEGORY} from "./Constants";

const chance = new Chance();
const regexDecimal = new RegExp('^-?(\\d*\\.)?\\d+$');
const regexDMSLat = new RegExp('([0-9]{1,2})[:|°]([0-9]{1,2})[:|\'|′]?([0-9]{1,2}(?:\\.[0-9]+)?)?["|″|\'\']([N|S])');
const regexDMSLng = new RegExp('([0-9]{1,3})[:|°]([0-9]{1,2})[:|\'|′]?([0-9]{1,2}(?:\\.[0-9]+)?)?["|″|\'\']([E|W])');

export const genId = () => {
    return chance.guid();
}

export const _formatEventTimeDisplay = (duration) => {

    try{
        if (isNaN(duration) || duration === 0) {
            return "00h00m00s"
        }
        const resp = new Date(duration * 1000).toISOString().substr(11, 8).split(':');
        return resp[0] + 'h' + resp[1] + 'm' + resp[2] + 's';
    }catch (e){
        console.log(e.message);
        return "00h00m00s";
    }
}

export const formatDate = (date) => {

    let d = new Date(date),
        month = '' + (d.getMonth() + 1),
        day = '' + d.getDate(),
        year = d.getFullYear();

    if (month.length < 2)
        month = '0' + month;
    if (day.length < 2)
        day = '0' + day;

    return [year, month , day].join('-');
}

export const getSeconds = (date) => {
    const d = new Date(date);
    return d.getSeconds();
}

export const getMinutes = (date) => {
    const d = new Date(date);
    return d.getMinutes();
}

export const getHours = (date) => {
    const d = new Date(date);
    return d.getHours();
}

export const calculateTimeInSeconds = (date) => {

    const d = new Date(date);
    const hours = d.getHours();
    const minutes = d.getMinutes();
    const seconds = d.getSeconds();

    return ( hours * 3600 ) + (minutes * 60) + seconds;
}

export const formatDateForEventAnnotationsExport = (date , sec) => {
    const d = new Date(date);
    const m = d.getUTCMonth() + 1
    const month =  m <= 9 ? '0' + m : m; //months from 1-12
    const day = d.getUTCDate();
    const year = d.getUTCFullYear();

    let totalSeconds = sec;
    let hours = Math.floor(totalSeconds / 3600);
    totalSeconds %= 3600;
    let minutes = Math.floor(totalSeconds / 60);
    let seconds = totalSeconds % 60;
    seconds = seconds.toFixed(2);
    return  day + "-" + month + "-" + year  + ":" + hours + 'h' + minutes + 'm' + seconds + 's';

}

export const formatDateForMozaicView = (date) => {
    const d = new Date(date);

    const m = d.getUTCMonth() + 1
    const month =  m <= 9 ? '0' + m : m; //months from 1-12
    const day = d.getUTCDate();
    const year = d.getUTCFullYear();

    const hours = d.getHours();
    const minutes = d.getMinutes();
    const secounds = d.getSeconds();

    return  day + "-" + month + "-" + year  + ":" + hours + "h" +   + minutes + "m" +  + secounds + "s";

}

export const mergeAllEventAnnotationTags = (ann) => {

    let result = [];
    const start = ann.start;
    const end = ann.end;

    if (ann.hasOwnProperty("topicTags")){
        ann.topicTags.forEach( tag => {
            if (tag.start >= start && tag.start <= end){
                result.push(tag)
            }
        })
    }

    if (ann.hasOwnProperty("nameTags")){
        ann.nameTags.forEach( tag => {
            if (tag.start >= start && tag.start <= end){
                result.push(tag)
            }
        })
    }

    if (ann.hasOwnProperty("titleTags")) {
        ann.titleTags.forEach(tag => {
            if (tag.start >= start && tag.start <= end) {
                result.push(tag)
            }
        })
    }

    if (ann.hasOwnProperty("personTags")) {
        ann.personTags.forEach(tag => {
            if (tag.start >= start && tag.start <= end) {
                result.push(tag)
            }
        })
    }

    if (ann.hasOwnProperty("dateTags")) {
        ann.dateTags.forEach(tag => {
            if (tag.start >= start && tag.start <= end) {
                result.push(tag)
            }
        })
    }

    if (ann.hasOwnProperty("locationTags")) {
        ann.locationTags.forEach(tag => {
            if (tag.start >= start && tag.start <= end) {
                result.push(tag)
            }
        })
    }

    if (ann.hasOwnProperty("noteTags")) {
        ann.noteTags.forEach(tag => {
            if (tag.start >= start && tag.start <= end) {
                result.push(tag)
            }
        })
    }

    return result;
}

export const categoryExists = (tags, name) => {
    if (tags === undefined || tags.length === 0) {
        return false;
    }
    return tags.some(tag => {
        if(tag === undefined || tag.name === undefined){
            return false;
        }
        if (tag.name.toUpperCase() === name.toUpperCase() && tag.type === TYPE_CATEGORY) {
            return true;
        } else if (tag.children && tag.children.length > 0) {
            return categoryExists(tag.children, name);
        } else {
            return false;
        }
    });
};

export  const checkItemInParentCategory = (tags , name) => {
    if (tags === undefined) {
        return false;
    }
    return tags.some(tag => tag.name.toUpperCase() === name.toUpperCase());
}

export const formatEventAnnotationTags = (ann) => {

    let result = [];

    if (ann.hasOwnProperty("topicTags")){
        ann.topicTags.forEach( tag => {
            result.push({
                type: "topic",
                value: tag
            })
        })
    }

    if (ann.hasOwnProperty("nameTags")){
        ann.nameTags.forEach( tag => {
            result.push({
                type: "name",
                value: tag
            })
        })
    }

    if (ann.hasOwnProperty("titleTags")) {
        ann.titleTags.forEach(tag => {
            result.push({
                type: "title",
                value: tag
            })
        })
    }

    if (ann.hasOwnProperty("personTags")) {
        ann.personTags.forEach(tag => {
            result.push({
                type: "person",
                value: tag
            })
        })
    }

    if (ann.hasOwnProperty("dateTags")) {
        ann.dateTags.forEach(tag => {
            result.push({
                type: "date",
                value: tag
            })
        })
    }

    if (ann.hasOwnProperty("locationTags")) {
        ann.locationTags.forEach(tag => {
            result.push({
                type: "location",
                value: tag
            })
        })
    }

    if (ann.hasOwnProperty("noteTags")) {
        ann.noteTags.forEach(tag => {
            result.push({
                type: "note",
                value: tag
            })
        })
    }

    return result;
}

export const _addTagIdIfMissing = (tags) => {
    return tags.forEach( tag => {
        if (!tag.hasOwnProperty("id")){
            tag.id = chance.guid();
        }
        if (tag.hasOwnProperty("children")){
            _addTagIdIfMissing(tag.children);
        }
    })
}

export const getNewTabName = (openTabs) => {
    const keys = Object.keys(openTabs)
    // Sort tabs by name and get tab with greatest number in name. Default tab name is: 'Selection xx'
    keys.sort((a, b) => {
        if (+a.substring(10) > +b.substring(10))
            return 1;
        else if (+a.substring(10) < +b.substring(10))
            return -1;
        else return 0;
    });
    // Remove string part from name
    const lastName = +keys[keys.length - 1].substring(10);
    let tabIndex = isNaN(lastName) ? 1 : +keys[keys.length - 1].substring(10) + 1;
    return 'Selection ' + tabIndex;
};

export const isLocationInDecimalFormat = (input) => {
    if (!input) return false;
    if (input === '' || input === 'N/A') return false;


    const coordinates = input.split(/[ ,]+/);
    if(!coordinates || coordinates.length < 2) return false;

    const lat = coordinates[0].trim();
    const lng = coordinates[1].trim();
    if (regexDecimal.test(lat) && regexDecimal.test(lng) && validateDecimalCoords(lat, lng)) return true;
    return false;
}

export const isLocationInDMSFormat = (input) => {
    if (!input) return false;
    if (input === '' || input === 'N/A') return false;

    const coordinates = input.split(/[ ,]+/);
    if(!coordinates || coordinates.length < 2) return false;
    const lat = coordinates[0].trim();
    const lng = coordinates[1].trim();
    if (regexDMSLat.test(lat) && regexDMSLng.test(lng)) {
        const latD = convertDMStoDecimal(lat);
        const lngD = convertDMStoDecimal(lng);
        if (validateDecimalCoords(latD, lngD)) {
            return true;
        }
    }
    return false;
}

export const validateLocationInput = (input) => {
    if (input === '' || input === 'N/A') return true;
    if (isLocationInDecimalFormat(input)) {
        return true
    };
    if (isLocationInDMSFormat(input)) {
        return true;
    }
    return false;
}

export const getDecimalLocation = (input) => {
    if(isLocationInDecimalFormat(input)) {
        const coordinates = input.split(/[ ,]+/);
        return [+coordinates[0].trim(), +coordinates[1].trim()];
    }
    if(isLocationInDMSFormat(input)) {
        const coordinates = input.split(/[ ,]+/);
        const latD = convertDMStoDecimal(coordinates[0].trim());
        const lngD = convertDMStoDecimal(coordinates[1].trim());
        return [latD, lngD];
    }
    return null;
}

export const validateDecimalCoords = (lat , lng) => {
    return lat > -90 && lat < 90 && lng > -180 && lng < 180;
}

export const convertDMStoDecimal = (coordinates) => {
    let parts = coordinates.split(/[^\d+(\,\d+)\d+(\.\d+)?\w]+/);
    let degrees = parseFloat(parts[0]);
    let minutes = parseFloat(parts[1]);
    let seconds = parseFloat(parts[2].replace(',','.'));
    let direction = parts[3];

    let dd = degrees + minutes / 60 + seconds / (60 * 60);

    if (direction === 'S' || direction === 'W') {
        dd = dd * -1;
    }
    return dd;
}

