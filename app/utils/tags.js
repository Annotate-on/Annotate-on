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
    TAG_MODE_PORTRAIT,
    TAGS_SELECTION_MODE_AND,
    TAGS_SELECTION_MODE_OR,
    VERY_LOW_RESOLUTION
} from '../constants/constants';
import {_formatTimeDisplay} from "./maths";

export const AND = "AND"
export const OR = "OR"

export const findPicturesByTagExpression = (expression, allPictures, state) => {

    console.log("findPictures expression", expression);
    console.log("findPictures allPictures", allPictures);
    console.log("findPictures tagsByAnnotation", state.tags_by_annotation);

    if(!expression || expression.length === 0 || Object.values(state.tags_by_annotation).length === 0) return [...allPictures];

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
    ];
    console.log("findPictures annotations", annotations)
    let picturesByTag = {}

    console.log("picturesByTag initial", state.pictures_by_tag)
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

    console.log("picturesByTag", picturesByTag)
    let result = evaluateTagsExpression(expression, allPictures, picturesByTag);
    return result;
}

const evaluateTagsExpression = (expression, allPictures, picturesByTag) => {
    let currentResult = []
    let currentOperator;
    for (const item of expression) {
        console.log("item type of", item, typeof item);
        if (typeof item === 'string') {
            console.log("operator", item)
            currentOperator = item;
            continue;
        }
        let set = [];
        if (Array.isArray(item)) {
            console.log("inner expression")
            let innerSet = evaluateTagsExpression(item, allPictures, picturesByTag);
            if(innerSet) {
                set = [...innerSet];
            }
        } else if (typeof item === 'object') {
            console.log("condition", item)
            if(item.has) {
                if(picturesByTag[item.tag]) {
                    set = [...picturesByTag[item.tag]]
                }
            } else {
                if(picturesByTag[item.tag]) {
                    set = [...lodash.difference(allPictures, picturesByTag[item.tag])];
                } else {
                    set = [...allPictures];
                }
            }
        }
        console.log("currentResult", currentResult)
        console.log("currentOperator", currentOperator)
        console.log("set", set)
        if(currentOperator === AND) {
            currentResult = lodash.intersection(currentResult, set);
        } else {
            currentResult = lodash.union(currentResult, set);
        }
        console.log("currentResult after operation", currentResult)

    }
    return currentResult;
}

export const findPictures = (tagsByPicture, picturesByTags, selectedTags, tagsSelectionMode, state) => {
    if (selectedTags.length === 0) return [];

    let foundPicturesId = [];

    if (Object.values(state.tags_by_annotation).length > 0) {

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
        ];

        // Find all pics where annotation is tagged.
        lodash.forIn(state.tags_by_annotation, (value, key) => {

            switch (tagsSelectionMode) {
                case TAGS_SELECTION_MODE_AND: {

                    if (lodash.difference(selectedTags, value).length === 0) {
                        const annotation = lodash.find(annotations, (o) => {
                            return o.id === key;
                        });
                        if (annotation) {
                            foundPicturesId.push(annotation.pictureId);
                        }
                    }
                }
                    break;
                case TAGS_SELECTION_MODE_OR: {
                    for (const t of selectedTags) {
                        if (value.indexOf(t) !== -1) {
                            const annotation = lodash.find(annotations, (o) => {
                                return o.id === key;
                            });
                            if (annotation) {
                                foundPicturesId.push(annotation.pictureId);
                            }
                        }
                    }
                }
                    break;
            }
        });
    }

    // Find all tagged pics.
    switch (tagsSelectionMode) {
        case TAGS_SELECTION_MODE_AND:
            for (const p in tagsByPicture) {
                // Picture will be added only if contains all selected tags.
                if (lodash.difference(selectedTags, tagsByPicture[p]).length === 0) foundPicturesId.push(p);
            }
            break;
        case TAGS_SELECTION_MODE_OR:
            for (const t of selectedTags) {
                // Append list of pics that are tagged with current tag.
                foundPicturesId = foundPicturesId.concat(picturesByTags[t]);
            }
            break;
    }

    return lodash.uniq(foundPicturesId).filter(_ => undefined !== _);
};

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
