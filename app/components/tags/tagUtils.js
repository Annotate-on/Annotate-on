import {TYPE_CATEGORY, TYPE_TAG} from "../event/Constants";
import Chance from 'chance';
import {COMMON_TAGS, TAG_AUTO} from "../../constants/constants";
const chance = new Chance();

export const lvlAutomaticTags = (tags) => {
    let result = [];
    tags.forEach( tag => {
            if (!tag.hasOwnProperty("id") || !tag.hasOwnProperty("type")) {
                result.push({
                    id: chance.guid(),
                    name: tag.name,
                    creationDate: tag.creationDate,
                    creationTimestamp: tag.creationTimestamp,
                    type: TYPE_TAG
                });
                if (tag.hasOwnProperty("children")) {
                    result = result.concat(lvlAutomaticTags(tag.children));
                }
            }
    })
    return result;
}

export const getValidTags = (tags) => {
    let validTags = [];
    tags.forEach( tag => {
        if (tag.name !== TAG_AUTO && tag.name !==  COMMON_TAGS) {
            if (tag.hasOwnProperty("id") && tag.hasOwnProperty("type")) {
                validTags.push(tag);
            }
        }
    })
    return validTags;
}

export const lvlTags = (tags) => {
    let oldTags = [];
    tags.forEach( tag => {
        if (tag.name !== TAG_AUTO) {
            if (!tag.hasOwnProperty("id") || !tag.hasOwnProperty("type")) {
                if(tag.name !== undefined){
                oldTags.push({
                    id: chance.guid(),
                    name: tag.name,
                    creationDate: tag.creationDate,
                    creationTimestamp: tag.creationTimestamp,
                    type: TYPE_TAG
                });
                }
                if (tag.hasOwnProperty("children")) {
                    oldTags = oldTags.concat(lvlTags(tag.children));
                }
            }
        }
    })
    return oldTags;
}

export const validateTagList = async ( tags ) => {
    let result = true;
    function recurse(tags){
        for(let i = 0 ; i < tags.length ; i++){
            if (tags[i].name === 'undefined' || tags[i].name === undefined ||  tags[i].name?.length === 0){
                if (result === false){
                    break;
                }
                result = false;
                break;
            }
            if (tags[i].hasOwnProperty("children")){
                recurse(tags[i].children);
            }
        }
    }
    await recurse(tags);
    return result;
}

const checkIfTagOrCategoryAlreadyExists = ( arr , name) => {
    return arr.some(element => element.name === name);
}

const findCategoryIndex = ( arr , name) => {
    let index = -1;
    for(let i=0 ; i < arr.length ; i ++){
        if(arr[i].name === name) {
            index = i;
            break;
        }
    }
    return index;
}

export const mergeCategories = ( oldCategory , newCategory ) => {
    newCategory.children.forEach( child => {
        if (child.type === TYPE_TAG){
            if (!checkIfTagOrCategoryAlreadyExists(oldCategory.children , child.name)){
                oldCategory.children.push(child);
            }
        }else if(child.type === TYPE_CATEGORY){
            if (checkIfTagOrCategoryAlreadyExists(oldCategory.children , child.name)){
                const sameCategoryIndex = findCategoryIndex(oldCategory.children , child.name);
                oldCategory.children[sameCategoryIndex] = mergeCategories( oldCategory.children[sameCategoryIndex] , child);
            }else{
                oldCategory.children.push(child);
            }
        }else{
            console.log('unsupported child type')
        }
    });

    return oldCategory;
}

export const getRootCategoriesNames = ( array ) => {
    let result = [];
    array.forEach( object => {
        if (object.type === TYPE_CATEGORY){
            result.push(object.name);
        }
    });
    return result;
}

export const getRootCategories = ( array ) => {
    let result = [];
    array.forEach( object => {
        if (object.type === TYPE_CATEGORY){
            result.push(object);
        }
    });
    return result;
}

export const createNewCategory = (id , name) => {
    const date = new Date();
    return {
        type: TYPE_CATEGORY,
        id: id,
        name: name,
        children: [],
        creationDate: date.toDateString(),
        creationTimestamp: date.getTime()
    };
}

export const createNewTag = (id , name) => {
    const date = new Date();
    return {
        type: TYPE_TAG,
        id: id,
        name: name,
        creationDate: date.toDateString(),
        creationTimestamp: date.getTime()
    };
}
export const isChild = (items , droppedIn) => {
    return items.some(child => {
        if (child.id === droppedIn){
            return true;
        }else{
            if (child.hasOwnProperty("children")){
                isChild(child.children);
            }
        }
    })
}

export const containsOnlyWhiteSpace = (str) => {
    return !str.replace(/\s/g, '').length
}

export const getTagsOnly = ( list ) => {
    if (list === undefined || list === null || list === 'undefined'){
        return [];
    }
    return list.filter( tag => tag.type !== TYPE_CATEGORY);
}

export const sortTagList = (tags , direction) => {
    return tags.filter( tag => tag.type !== TYPE_CATEGORY).
    sort((a, b) =>{
        if ( a.name < b.name ){
            return -1 * direction;
        }
        if ( a.name > b.name ){
            return 1 * direction;
        }
        return 0;
    })
}



