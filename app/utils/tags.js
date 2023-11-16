import lodash from 'lodash';

import {
    HIGH_RESOLUTION,
    LOW_RESOLUTION,
    NORMAL_RESOLUTION,
    ORIENTATION_BOTTOM_RIGHT_SIDE,
    ORIENTATION_LEFT_SIDE_BOTTOM,
    ORIENTATION_RIGHT_SIDE_TOP,
    ORIENTATION_TOP_LEFT_SIDE,
    TAG_AUTO,
    TAG_DPI_1200,
    TAG_DPI_150,
    TAG_DPI_300,
    TAG_DPI_600,
    TAG_DPI_75,
    TAG_DPI_NO,
    TAG_GPS_NO,
    TAG_GPS_WIDTH,
    TAG_MODE_LANDSCAPE,
    TAG_MODE_PORTRAIT, TAGS_SELECTION_MODE_AND, TAGS_SELECTION_MODE_OR,
    VERY_LOW_RESOLUTION
} from '../constants/constants';
import {_formatTimeDisplay} from "./maths";
import {genId} from "../components/event/utils";

export const AND = "AND"
export const OR = "OR"
export const NOT = "NOT"

export const EXP_ITEM_TYPE_OPERATOR = "EXP_ITEM_TYPE_OPERATOR"
export const EXP_ITEM_TYPE_CONDITION = "EXP_ITEM_TYPE_CONDITION"
export const EXP_ITEM_TYPE_EXPRESSION = "EXP_ITEM_TYPE_EXPRESSION"

export const convertSelectedTagsToFilter = (selectedTags, tagsSelectionMode) => {
    if(!selectedTags || selectedTags.length === 0) return null;
    const expression = {
        id: genId(),
        type: EXP_ITEM_TYPE_EXPRESSION,
        value: []
    }
    for (let i = 0; i < selectedTags.length; i++) {
        expression.value.push({
            id: genId(),
            type: EXP_ITEM_TYPE_CONDITION,
            value : {
                has: true,
                tag: selectedTags[i]
            }
        })
        if(selectedTags.length > 1 && i < selectedTags.length-1) {
            expression.value.push({
                id: genId(),
                type: EXP_ITEM_TYPE_OPERATOR,
                value: tagsSelectionMode === TAGS_SELECTION_MODE_AND ? AND : OR
            });
        }
    }
    const filter = {
        id: genId(),
        type: EXP_ITEM_TYPE_EXPRESSION,
        value: [expression]
    }
    return filter;
}

export const changeOperatorValueInFilter = (filter, id, value) => {
    const foundOperator = findExpressionOperatorById(filter, id);
    if(foundOperator) {
        foundOperator.value = value;
    }
}

export const findPicturesByTagFilter = (expression, allPictures, state) => {

    if(!expression || expression.value.length === 0) return [...allPictures];

    let annotations = [
        ...lodash.flattenDepth(Object.values(state.annotations_measures_linear), 2)
        , ...lodash.flattenDepth(Object.values(state.annotations_points_of_interest), 2)
        , ...lodash.flattenDepth(Object.values(state.annotations_rectangular), 2)
        , ...lodash.flattenDepth(Object.values(state.annotations_polygon), 2)
        , ...lodash.flattenDepth(Object.values(state.annotations_angle), 2)
        , ...lodash.flattenDepth(Object.values(state.annotations_occurrence), 2)
        , ...lodash.flattenDepth(Object.values(state.annotations_color_picker), 2)
        , ...lodash.flattenDepth(Object.values(state.annotations_ratio), 2)
        , ...lodash.flattenDepth(Object.values(state.annotations_transcription), 2)
        , ...lodash.flattenDepth(Object.values(state.annotations_categorical), 2)
        , ...lodash.flattenDepth(Object.values(state.annotations_richtext), 2)
        , ...lodash.flattenDepth(Object.values(state.annotations_circle_of_interest), 2)
    ];
    // console.log("findPictures annotations", annotations)
    let picturesByTag = {}

    // console.log("picturesByTag initial", state.pictures_by_tag)
    if(state.pictures_by_tag) {
        lodash.forIn(state.pictures_by_tag, (value, key) => {
            picturesByTag[key] = [...value]
        })
    }

    if(state.tags_by_annotation) {
        lodash.forIn(state.tags_by_annotation, (value, key) => {
            if(value) {
                let annotation = annotations.find((annotation) => {
                    return key === annotation.id;
                })
                if(annotation && allPictures.includes(annotation.pictureId)) {
                    for (const valueElement of value) {
                        if(!picturesByTag[valueElement]) {
                            picturesByTag[valueElement] = []
                        }
                        picturesByTag[valueElement].push(annotation.pictureId)
                    }
                } else {
                    console.log("can't find annotation with id ", key)
                }
            }
        })
    }
    let result = evaluateTagsExpression(expression, allPictures, picturesByTag);
    let finalResult = lodash.intersection(allPictures, result);
    return finalResult;
}

const findExpressionOperatorById = (expression, id) => {
    // console.log("findExpressionOperatorById", expression)
    if(!expression || !expression.value || !id) return null;
    for (const item of expression.value) {
        if (item.type === EXP_ITEM_TYPE_OPERATOR) {
            if(item.id === id) return item;
        } else if(item.type === EXP_ITEM_TYPE_EXPRESSION) {
            let result = findExpressionOperatorById(item, id);
            if(result) return result;
        }
    }
    return null;
}

const evaluateTagsExpression = (expression, allPictures, picturesByTag) => {
    let currentResult = []
    let currentOperator;
    // console.log("evaluateTagsExpression", expression)
    for (const item of expression.value) {
        if (item.type === EXP_ITEM_TYPE_OPERATOR) {
            // console.log("operator", item)
            currentOperator = item.value;
            continue;
        }
        let set = null;
        if (item.type === EXP_ITEM_TYPE_EXPRESSION) {
            // console.log("inner expression")
            if(item.value && item.value.length > 0) {
                let innerSet = evaluateTagsExpression(item, allPictures, picturesByTag);
                if(innerSet) {
                    set = [...innerSet];
                }
            }
        } else if (item.type === EXP_ITEM_TYPE_CONDITION) {
            // console.log("condition", item)
            if(currentOperator === NOT) {
                if(picturesByTag[item.value.tag]) {
                    set = [...lodash.difference(allPictures, picturesByTag[item.value.tag])];
                } else {
                    set = [...allPictures];
                }
            } else {
                if(picturesByTag[item.value.tag]) {
                    set = [...picturesByTag[item.value.tag]]
                }
            }
        }
        // console.log("currentResult", currentResult)
        // console.log("currentOperator", currentOperator)
        // console.log("set", set)
        if(set !== null) {
            if(currentOperator === AND || currentOperator === NOT) {
                // console.log("intersection", currentResult, set)
                currentResult = lodash.intersection(currentResult, set);
            } else {
                // console.log("union")
                currentResult = lodash.union(currentResult, set);
            }
        }
        // console.log("currentResult after operation", currentResult)

    }
    return currentResult;
}

export const attachDefaultTags = (picture, tagPicture, createTag, addSubTag) => {

    // Tag with system tags if applicable.
    if ('creator' in picture && !lodash.isNil(picture.creator) && picture.creator !== "") {
        createTag('author: ' + picture.creator, false);
        addSubTag(TAG_AUTO, 'author: ' + picture.creator);
        tagPicture(picture.sha1, 'author: ' + picture.creator);
    }

    if ('model' in picture && !lodash.isNil(picture.model) && picture.model !== "") {
        if ('make' in picture && !lodash.isNil(picture.make) && picture.make !== "") {
            createTag(picture.make + ' / ' + picture.model, false);
            addSubTag(TAG_AUTO, picture.make + ' / ' + picture.model);
            tagPicture(picture.sha1, picture.make + ' / ' + picture.model);
        }else{
            createTag(picture.model, false);
            addSubTag(TAG_AUTO, picture.model);
            tagPicture(picture.sha1, picture.model);
        }
    }

    if ('yearCreated' in picture && !lodash.isNil(picture.yearCreated) && picture.yearCreated !== "") {
        createTag('created: ' + picture.yearCreated, false);
        addSubTag(TAG_AUTO, 'created: ' + picture.yearCreated);
        tagPicture(picture.sha1, 'created: ' + picture.yearCreated);
    }

    if ('dpix' in picture && !lodash.isNil(picture.dpix) && picture.dpix !== "") {
        if (picture.dpix <= VERY_LOW_RESOLUTION) {
            tagPicture(picture.sha1, TAG_DPI_75);
        } else if (picture.dpix <= LOW_RESOLUTION) {
            tagPicture(picture.sha1, TAG_DPI_150);
        } else if (picture.dpix <= NORMAL_RESOLUTION) {
            tagPicture(picture.sha1, TAG_DPI_300);
        } else if (picture.dpix <= HIGH_RESOLUTION) {
            tagPicture(picture.sha1, TAG_DPI_600);
        } else if (picture.dpix >= HIGH_RESOLUTION) {
            tagPicture(picture.sha1, TAG_DPI_1200);
        }
    } else {
        tagPicture(picture.sha1, TAG_DPI_NO);
    }

    if ('exifPlace' in picture && !lodash.isNil(picture.exifPlace) && picture.exifPlace !== "") {
        tagPicture(picture.sha1, TAG_GPS_WIDTH);
    } else {
        tagPicture(picture.sha1, TAG_GPS_NO);
    }

    if ('orientation' in picture && !lodash.isNil(picture.orientation) && picture.orientation !== "") {
        if (picture.orientation === ORIENTATION_TOP_LEFT_SIDE || picture.orientation === ORIENTATION_BOTTOM_RIGHT_SIDE) {
            tagPicture(picture.sha1, TAG_MODE_LANDSCAPE);
        } else if (picture.orientation === ORIENTATION_RIGHT_SIDE_TOP || picture.orientation === ORIENTATION_LEFT_SIDE_BOTTOM) {
            tagPicture(picture.sha1, TAG_MODE_PORTRAIT);
        }
    }
};

export const attachDefaultVideoTags = (video, tagVideo, createTag, addSubTag) => {
    if ('duration' in video && !lodash.isNil(video.duration) && video.duration !== "") {
        createTag('duration: ' + _formatTimeDisplay(video.duration), false);
        addSubTag(TAG_AUTO, 'duration: ' + _formatTimeDisplay(video.duration));
        tagVideo(video.sha1, 'duration: ' + _formatTimeDisplay(video.duration));
    }
    if ('fps' in video && !lodash.isNil(video.fps) && video.fps !== "") {
        createTag('fps: ' + video.fps, false);
        addSubTag(TAG_AUTO, 'fps: ' + video.fps);
        tagVideo(video.sha1, 'fps: ' + video.fps);
    }
    if ('width' in video && !lodash.isNil(video.width) && video.width !== "") {
        createTag('width: ' + video.width, false);
        addSubTag(TAG_AUTO, 'width: ' + video.width);
        tagVideo(video.sha1, 'width: ' + video.width);
    }
    if ('height' in video && !lodash.isNil(video.height) && video.height !== "") {
        createTag('height: ' + video.height, false);
        addSubTag(TAG_AUTO, 'height: ' + video.height);
        tagVideo(video.sha1, 'height: ' + video.height);
    }
};

export const findTag = (tags, target, remove) => {
    let response = null;
    tags.some(tag => {
        if (tag.name === target) {
            response = tag;
            if (remove) {
                const rootTags = tags.filter(_ => _.name !== target)
                tags.splice(0, tags.length);
                tags.push(...rootTags);
            }
            return true;
        } else if (tag.children) {
            response = findTag(tag.children, target, remove);
            const output = null != response;
            if (output) {
                if (remove) {
                    tag.children = tag.children.filter(_ => _.name !== target);
                }
            }
            return output;
        }
    });
    return response;
};

export const findParentTag = (tags, name) => {
    if (tags === undefined) {
        return false;
    }
    return tags.some(tag => {
        if (tag.name === name) {
            return tag;
        } else if (tag.children && tag.children.length > 0) {
            return tagExist(tag.children, name);
        } else {
            return null;
        }
    });
};

export const tagExistById = (tags, id) => {

    if (tags === undefined) {
        return false;
    }
    return tags.some(tag => {
        if (tag.id === id) {
            return true;
        } else if (tag.children && tag.children.length > 0) {
            return tagExist(tag.children, id);
        } else {
            return false;
        }
    });
};

export const tagExist = (tags, name) => {

    if (tags === undefined) {
        return false;
    }
    return tags.some(tag => {
        if (tag.name === name) {
            return true;
        } else if (tag.children && tag.children.length > 0) {
            return tagExist(tag.children, name);
        } else {
            return false;
        }
    });
};

export const loadTags = (tags, selectedTags) => {
    const tagsFiltered = [];
    try {
        tags.map(_ => {
            if (selectedTags.indexOf(_.name) > -1) {
                tagsFiltered.push({..._, children: null});
            }
            if (_.children && _.children) {
                tagsFiltered.push(...loadTags(_.children, selectedTags));
            }
        });
        return tagsFiltered;
    } catch (e){
        console.log(e);
        return  [];
    }
};



