import lodash from 'lodash';
import path from 'path';
import fs from 'fs-extra';
import {createAutomaticTags, createCommonTags, ee, EVENT_SHOW_ALERT} from "../utils/library";

import {
    ADD_SUB_CATEGORY,
    MERGE_TM_TAGS,
    ADD_SUB_TAG,
    CHANGE_TAXONOMY_STATUS,
    CLOSE_TAB,
    CREATE_ANNOTATE_EVENT,
    CREATE_ANNOTATION_ANGLE,
    CREATE_ANNOTATION_CATEGORICAL,
    CREATE_ANNOTATION_CHRONOTHEMATIQUE,
    CREATE_ANNOTATION_COLORPICKER,
    CREATE_ANNOTATION_MEASURE_POLYLINE,
    CREATE_ANNOTATION_MEASURE_SIMPLELINE,
    CREATE_ANNOTATION_OCCURRENCE,
    CREATE_ANNOTATION_POINT_OF_INTEREST,
    CREATE_ANNOTATION_POLYGON,
    CREATE_ANNOTATION_RATIO,
    CREATE_ANNOTATION_RECTANGULAR,
    CREATE_ANNOTATION_RICHTEXT,
    CREATE_ANNOTATION_TRANSCRIPTION,
    CREATE_CARTEL,
    CREATE_CATEGORICAL_TARGET_INSTANCE,
    CREATE_CATEGORY,
    CREATE_EVENT_ANNOTATION,
    CREATE_TAB,
    CREATE_TAG,
    ADD_TAGS_ID,
    CREATE_TARGET_DESCRIPTOR,
    CREATE_TARGET_INSTANCE,
    DELETE_ANNOTATE_EVENT,
    DELETE_ANNOTATION_ANGLE,
    DELETE_ANNOTATION_CATEGORICAL,
    DELETE_ANNOTATION_CHRONOTHEMATIQUE,
    DELETE_ANNOTATION_COLORPICKER,
    DELETE_ANNOTATION_MEASURE_LINEAR,
    DELETE_ANNOTATION_OCCURRENCE,
    DELETE_ANNOTATION_POINT_OF_INTEREST,
    DELETE_ANNOTATION_POLYGON,
    DELETE_ANNOTATION_RATIO,
    DELETE_ANNOTATION_RECTANGULAR,
    DELETE_ANNOTATION_RICHTEXT,
    DELETE_ANNOTATION_TRANSCRIPTION,
    DELETE_CARTEL,
    DELETE_EVENT_ANNOTATION,
    DELETE_PICTURE,
    DELETE_TAB,
    DELETE_TAG,
    DELETE_TARGET_DESCRIPTOR,
    DELETE_TARGET_TYPE,
    EDIT_ANNOTATE_EVENT,
    FINISH_CORRUPTED_EVENT,
    EDIT_ANNOTATION,
    EDIT_CARTEL,
    EDIT_CHRONOTHEMATIQUE_ANNOTATION_ENDTIME,
    EDIT_EVENT_ANNOTATION_ENDTIME,
    EDIT_TAG,
    EDIT_TAG_BY_ID,
    EDIT_TARGET_DESCRIPTOR,
    EDIT_TARGET_TYPE,
    EMPTY_TAGS,
    EXTEND_EVENT_DURATION,
    FIRST_PICTURE_IN_SELECTION,
    FLAT_OLD_TAGS,
    FOCUS_ANNOTATION,
    IMPORT_TAG_MODEL,
    IMPORT_TAXONOMY,
    LAST_PICTURE_IN_SELECTION,
    LOCK_SELECTION,
    MERGE_TAGS,
    MOVE_FOLDER,
    MOVE_PICTURE_IN_PICTURES_SELECTION,
    NEXT_PICTURE_IN_SELECTION,
    NEXT_TEN_PICTURE_IN_SELECTION,
    OPEN_IN_NEW_TAB,
    PREPARE_FOLDER_FOR_DELETION,
    PREVIOUS_PICTURE_IN_SELECTION,
    PREVIOUS_TEN_PICTURE_IN_SELECTION,
    REFRESH_STATE,
    REMOVE_TAXONOMY,
    RENAME_FOLDER,
    RENAME_TAB,
    SAVE_ANNOTATION_SORT,
    SAVE_EVENT_AFTER_RECORD,
    SAVE_LEAFLET_SETTINGS,
    SAVE_SORTED_ARRAY,
    SAVE_TAGS_SORT,
    SAVE_TARGET_TYPE,
    SAVE_TAXONOMY,
    SELECT_FOLDER,
    SELECT_FOLDER_GLOBALLY,
    SELECT_MENU,
    SELECT_TAG,
    SET_PICTURE_IN_SELECTION,
    SET_SELECTED_TAXONOMY,
    SET_STATE,
    TAG_ANNOTATION,
    TAG_EVENT_ANNOTATION,
    TAG_PICTURE,
    UNFOCUS_ANNOTATION,
    UNSELECT_FOLDER,
    UNSELECT_TAG,
    UNTAG_ANNOTATION,
    UNTAG_EVENT_ANNOTATION,
    UNTAG_PICTURE,
    UPDATE_ANNOTATION_VALUE_IN_TAXONOMY_INSTANCE,
    UPDATE_MOZAIC_TOGGLE,
    UPDATE_PICTURE_DATE,
    UPDATE_TABULAR_VIEW,
    UPDATE_TAXONOMY_VALUES,
    EDIT_CATEGORY_BY_ID,
    ADD_TAG_IN_FILTER,
    DELETE_TAG_EXPRESSION,
    CREATE_TAG_EXPRESSION,
    UPDATE_TAG_EXPRESSION_OPERATOR
} from '../actions/app';
import {
    ANNOTATION_ANGLE,
    ANNOTATION_CATEGORICAL,
    ANNOTATION_CHRONOTHEMATIQUE,
    ANNOTATION_COLORPICKER,
    ANNOTATION_EVENT_ANNOTATION,
    ANNOTATION_MARKER,
    ANNOTATION_OCCURRENCE,
    ANNOTATION_POLYGON,
    ANNOTATION_POLYLINE,
    ANNOTATION_RATIO,
    ANNOTATION_RECTANGLE,
    ANNOTATION_RICHTEXT,
    ANNOTATION_SIMPLELINE,
    ANNOTATION_TRANSCRIPTION,
    CARTEL,
    CATEGORICAL, COMMON_TAGS,
    IMAGE_STORAGE_DIR,
    INTEREST,
    LIST_VIEW,
    MANUAL_ORDER, TAG_MAP_SELECTION,
    MODEL_ANNOTATE,
    MODEL_XPER,
    NUMERICAL,
    RESOURCE_TYPE_EVENT,
    SORT_ALPHABETIC_DESC,
    SORT_DATE_DESC, TAG_AUTO,
} from '../constants/constants';
import {
    AND,
    changeOperatorValueInFilter,
    convertSelectedTagsToFilter,
    EXP_ITEM_TYPE_CONDITION, EXP_ITEM_TYPE_EXPRESSION,
    EXP_ITEM_TYPE_OPERATOR,
    findPicturesByTagFilter,
    findTag,
    OR,
    tagExist
} from '../utils/tags';
import {
    copySdd,
    deleteTaxonomy,
    getAllDirectoriesNameFlatten,
    getAllPicturesDirectories,
    getAllPicturesDirectoriesFlatten,
    getMetadataDir,
    getTaxonomyDir,
    getUserWorkspace,
    loadTaxonomy,
    moveToFolder,
    renameFolder,
    saveTaxonomy,
    toConfigFileWithoutRefresh,
    updateChildrenPath
} from "../utils/config";
import {convertSDDtoJson} from "../utils/sdd-processor";
import {standardDeviation} from "../utils/maths";
import {
    getTagsOnly, getValidTags, lvlAutomaticTags, lvlTags,
} from "../components/tags/tagUtils";
import {EVENT_STATUS_FINISHED, TYPE_CATEGORY} from "../components/event/Constants";
import {
    _addTagIdIfMissing,
    categoryExists,
    checkItemInParentCategory,
    genId,
    getNewTabName
} from "../components/event/utils";
import i18next from "i18next";

// The 'shape' of the state is defined here
export const createInitialState = () => ({
    app: {
        selected_menu: 'HOME',
        annotations_eventAnnotations: {},
        annotations_chronothematique: {},
        annotations_measures_linear: {},
        annotations_points_of_interest: {},
        annotations_rectangular: {},
        annotations_polygon: {},
        annotations_angle: {},
        annotations_occurrence: {},
        annotations_color_picker: {},
        annotations_ratio: {},
        annotations_transcription: {},
        annotations_categorical: {},
        annotations_richtext: {},
        cartel_by_picture: {},
        counter: 0,
        focused_annotation: null,
        pictures: {},
        pictures_by_tag: {},
        selected_tags: [],
        standard_deviation: null,
        tags_by_annotation: {},
        tags_by_picture: {},
        tags: [],
        calibrations: [],
        pictures_by_calibration: {},
        leaflet_position_by_picture: {},
        selected_tab: null,
        annotations_by_tag: {},
        taxonomyInstance: {},
        open_tabs: {
            'Selection 1': {
                view: 'library',
                subview: LIST_VIEW,
                selected_folders: [],
                selected_filter: null,
                pictures_selection: [],
                folder_pictures_selection: [],
                sortDirection: SORT_ALPHABETIC_DESC,
                sortDirectionAnnotation: SORT_DATE_DESC,
                current_picture_index_in_selection: 0,
                selected_sha1: null,
                manualOrderLock: false,
                showMozaicDetails: false,
                showMozaicCollection: false,
                activeTab: "1",
                sort_table_by: {field: '', direction: ''}
            }
        },
        taxonomies: [],
        selectedTaxonomy: null,
        leafletSettings: {},
        selectedProjectName: null
    }
});

export const userDataBranches = () => ({
    annotations_eventAnnotations: null,
    annotations_chronothematique: null,
    annotations_measures_linear: null,
    annotations_points_of_interest: null,
    annotations_rectangular: null,
    annotations_polygon: null,
    annotations_angle: null,
    annotations_occurrence: null,
    annotations_color_picker: null,
    annotations_ratio: null,
    annotations_transcription: null,
    annotations_categorical: null,
    annotations_richtext: null,
    cartel_by_picture: null,
    pictures_by_tag: null,
    tags_by_annotation: null,
    tags_by_picture: null,
    tags: null,
    calibrations: null,
    pictures_by_calibration: null,
    annotations_by_tag: null,
    selected_tags: null,
    open_tabs: null,
    manualOrderLock: false,
    taxonomies: null,
    selectedTaxonomy: null,
    leafletSettings: null,
    selectedProjectName: null,
    taxonomyInstance: null
});

export default (state = {}, action) => {
    const NOW_DATE = new Date();
    const NOW_TIMESTAMP = NOW_DATE.getTime();
    const { t } = i18next;

    switch (action.type) {
        case SET_STATE: {
            const counter = state.counter + 1;
            if (action.newApp)
                return {...createInitialState().app, counter, ...action.newApp};
            else
                return {...createInitialState().app, counter};
        }
            break;
        case REFRESH_STATE: {
            const counter = state.counter + 1;
            return {...state, counter, pictures: {...state.pictures, ...action.picturesObject}}
        }
            break;
        //--------------------------------------------------------------------------------------------------------------
        case CREATE_ANNOTATION_MEASURE_SIMPLELINE:
        case CREATE_ANNOTATION_MEASURE_POLYLINE: {
            const counter = state.counter + 1;
            const {type, ...payload} = action;

            // Get greatest auto generated number from annotation name.
            const patt = /LIN-(\d+)/g;
            const max = getNextAnnotationName(patt, payload.pictureId, state.annotations_measures_linear);

            return {
                ...state,
                counter,
                annotations_measures_linear: {
                    ...state.annotations_measures_linear,
                    [payload.pictureId]: [
                        {
                            ...payload,
                            annotationType: type === CREATE_ANNOTATION_MEASURE_POLYLINE ? ANNOTATION_POLYLINE : ANNOTATION_SIMPLELINE,
                            creationDate: NOW_DATE,
                            creationTimestamp: NOW_TIMESTAMP,
                            title: `LIN-${max}`,
                            measure: 'mm'
                        },
                        ...(state.annotations_measures_linear[payload.pictureId] || [])
                    ].sort((left, right) => {
                        if (left.title > right.title) {
                            return -1;
                        }
                        if (left.title < right.title) {
                            return 1;
                        }
                        return 0;
                    })
                }
            };
        }
            break;
        case CREATE_ANNOTATION_RATIO: {
            const counter = state.counter + 1;
            const {type, ...payload} = action;

            // Get greatest auto generated number from annotation name.
            const patt = /RAT-(\d+)/g;
            const max = getNextAnnotationName(patt, payload.pictureId, state.annotations_ratio);

            return {
                ...state,
                counter,
                annotations_ratio: {
                    ...state.annotations_ratio,
                    [payload.pictureId]: [
                        {
                            ...payload,
                            annotationType: ANNOTATION_RATIO,
                            creationDate: NOW_DATE,
                            creationTimestamp: NOW_TIMESTAMP,
                            title: `RAT-${max}`,
                            measure: ''
                        },
                        ...(state.annotations_ratio[payload.pictureId] || [])
                    ].sort((left, right) => {
                        if (left && right && left.title > right.title) {
                            return -1;
                        }
                        if (left && right && left.title < right.title) {
                            return 1;
                        }
                        return 0;
                    })
                }
            };
        }
            break;
        case CREATE_ANNOTATE_EVENT: {
            const event = action.event;
            console.log(state)
            console.log('event in reducer ----> ' , event)
            if (state.pictures[event.id] !== undefined){
                return {
                    ...state,
                }
            }else{
                return Object.assign({}, state, {
                    pictures: {
                        ...state.pictures,
                        [event.id]: event
                    }
                });
            }
            break;
        }

        case DELETE_ANNOTATE_EVENT: {

            console.log('global state' , state);
            const counter = state.counter + 1;
            const tabs = {...state.open_tabs};
            const sha1 = action.eventId;
            const pictures = {...state.pictures};
            const allAnnotations = [];

            delete state.pictures_by_calibration[sha1];
            delete state.tags_by_picture[sha1];

            allAnnotations.push(...deleteAnnotations(state.annotations_eventAnnotations, sha1));

            console.log('deleting event metadata....')
            const metadataFile = path.join(getMetadataDir(), `${sha1}.json`);
            if (fs.existsSync(metadataFile))
                fs.unlinkSync(metadataFile);

            const fileName = path.parse(pictures[sha1].file).name;
            console.log('deleting event erecolnat metadata....')
            const erecolnatMetadataFile = path.join(path.dirname(pictures[sha1].file), `${fileName}.json`);
            if (fs.existsSync(erecolnatMetadataFile))
                fs.unlinkSync(erecolnatMetadataFile);

            const xmpFile = path.join(path.dirname(pictures[sha1].file), `${fileName}.xmp`);
            const xmlFile = path.join(path.dirname(pictures[sha1].file), `${fileName}.xml`);

            console.log('deleting event xmpFile....')
            if (fs.existsSync(xmpFile))
                fs.unlinkSync(xmpFile);

            console.log('deleting event xmlFile....')

            if (fs.existsSync(xmlFile))
                fs.unlinkSync(xmlFile);

            lodash.forEach(allAnnotations, (item) => {
                delete state.tags_by_annotation[item];
                // Delete taxonomy instances
                deleteAnnotationValues(state, item);
            });

            lodash.forEach(state.annotations_by_tag, (item, key) => {
                state.annotations_by_tag[key] = lodash.without(item, ...allAnnotations);
            });

            lodash.forEach(state.pictures_by_tag, (item, key) => {
                state.pictures_by_tag[key] = lodash.without(item, sha1);
            });

            for (const tabName in tabs) {
                const tab = tabs[tabName];
                delete pictures[sha1];
                // Filter pictures by selected folders
                tab.folder_pictures_selection = [...filterPicturesByFolder(tab, pictures)];
                tab.pictures_selection = findPicturesByTagFilter(tab.selected_filter, tab.folder_pictures_selection, state);
                const newIndex = tab.pictures_selection.indexOf(tab.selected_sha1);
                if (newIndex !== -1) {
                    tab.current_picture_index_in_selection = newIndex;
                } else {
                    tab.current_picture_index_in_selection = 0;
                    tab.selected_sha1 = tab.pictures_selection[0];
                }

                if (tab.hasOwnProperty('order')){
                    if(tab.order !== undefined || tab.order[sha1] !== undefined){
                        delete tab.order[sha1];
                    }
                }
            }

            delete pictures[sha1];

            return {
                ...state, pictures: pictures,
                open_tabs: tabs,
                counter
            };
            break;
        }

        case CREATE_EVENT_ANNOTATION: {
            const counter = state.counter + 1;
            const {type, ...payload} = action;
            const titlePrefix = 'EAN-'
            const max = getNextAnnotationNameForVideo(payload.eventId, state.annotations_eventAnnotations , 'EAN-');
            console.log('CREATE_EVENT_ANNOTATION_ACTION' , action);
            return {
                ...state,
                counter,
                annotations_eventAnnotations: {
                    ...state.annotations_eventAnnotations,
                    [payload.eventId] : [
                        {
                            ...payload,
                            annotationType: ANNOTATION_EVENT_ANNOTATION,
                            creationDate: NOW_DATE,
                            creationTimestamp: NOW_TIMESTAMP,
                            title: `${titlePrefix+max}`,
                            value: '',
                            nameTags: [],
                            titleTags: [],
                            personTags: [],
                            dateTags: [],
                            locationTags: [],
                            noteTags: [],
                        },
                        ...(state.annotations_eventAnnotations[payload.eventId] || [])
                    ].sort((a, b) => {
                        return (a.start < b.start ? -1 : (a.start > b.start ? 1 : 0));
                    })
                }
            }
        }
            break;

        case CREATE_ANNOTATION_CHRONOTHEMATIQUE: {
            const counter = state.counter + 1;
            const {type, ...payload} = action;
            const titlePrefix = 'SEQ-'
            const max = getNextAnnotationNameForVideo(payload.videoId, state.annotations_chronothematique , 'SEQ-');
            console.log('CREATE_ANNOTATION_CHRONOTHEMATIQUE_ACTION' , action);
            return {
                ...state,
                counter,
                annotations_chronothematique: {
                    ...state.annotations_chronothematique,
                    [payload.videoId] : [
                        {
                            ...payload,
                            annotationType: ANNOTATION_CHRONOTHEMATIQUE,
                            creationDate: NOW_DATE,
                            creationTimestamp: NOW_TIMESTAMP,
                            title: `${titlePrefix+max}`
                        },
                        ...(state.annotations_chronothematique[payload.videoId] || [])
                    ].sort((a, b) => {
                        return (a.start < b.start ? -1 : (a.start > b.start ? 1 : 0));
                    })
                }
            }
        }
            break;
        case CREATE_ANNOTATION_POINT_OF_INTEREST: {
            const counter = state.counter + 1;
            const {type, ...payload} = action;

            // Get greatest auto generated number from annotation name.
            const patt = /POI-(\d+)/g;
            const max = getNextAnnotationName(patt, payload.pictureId, state.annotations_points_of_interest);

            return {
                ...state,
                counter,
                annotations_points_of_interest: {
                    ...state.annotations_points_of_interest,
                    [payload.pictureId]: [
                        {
                            ...payload,
                            annotationType: ANNOTATION_MARKER,
                            creationDate: NOW_DATE,
                            creationTimestamp: NOW_TIMESTAMP,
                            title: `POI-${max}`
                        },
                        ...(state.annotations_points_of_interest[payload.pictureId] || [])
                    ].sort((left, right) => {
                        if (left.title > right.title) {
                            return -1;
                        }
                        if (left.title < right.title) {
                            return 1;
                        }
                        return 0;
                    })
                }
            };
        }
            break;
        case CREATE_ANNOTATION_RECTANGULAR: {
            const counter = state.counter + 1;
            const {type, ...payload} = action;

            // Get greatest auto generated number from annotation name.
            const patt = /REC-(\d+)/g;
            const max = getNextAnnotationName(patt, payload.pictureId, state.annotations_rectangular);

            if (payload.vertices && payload.vertices.length < 4) {
                console.log('Size or vertices array is missing last point. %o', payload);
                payload.vertices.push(payload.vertices[0]);
            }

            return {
                ...state,
                counter,
                annotations_rectangular: {
                    ...state.annotations_rectangular,
                    [payload.pictureId]: [
                        {
                            ...payload,
                            annotationType: ANNOTATION_RECTANGLE,
                            creationDate: NOW_DATE,
                            creationTimestamp: NOW_TIMESTAMP,
                            title: `REC-${max}`
                        },
                        ...(state.annotations_rectangular[payload.pictureId] || [])
                    ].sort((left, right) => {
                        if (left.title > right.title) {
                            return -1;
                        }
                        if (left.title < right.title) {
                            return 1;
                        }
                        return 0;
                    })
                }
            };
        }
            break;
        case CREATE_ANNOTATION_POLYGON: {
            const counter = state.counter + 1;
            const {type, ...payload} = action;

            // Get greatest auto generated number from annotation name.
            const patt = /POL-(\d+)/g;
            const max = getNextAnnotationName(patt, payload.pictureId, state.annotations_polygon);

            return {
                ...state,
                counter,
                annotations_polygon: {
                    ...state.annotations_polygon,
                    [payload.pictureId]: [
                        {
                            ...payload,
                            annotationType: ANNOTATION_POLYGON,
                            creationDate: NOW_DATE,
                            creationTimestamp: NOW_TIMESTAMP,
                            title: `POL-${max}`,
                            measure: 'mm\u00B2'
                        },
                        ...(state.annotations_polygon[payload.pictureId] || [])
                    ].sort((left, right) => {
                        if (left.title > right.title) {
                            return -1;
                        }
                        if (left.title < right.title) {
                            return 1;
                        }
                        return 0;
                    })
                }
            };
        }
            break;
        case CREATE_ANNOTATION_ANGLE: {
            const counter = state.counter + 1;
            const {type, ...payload} = action;

            // Get greatest auto generated number from annotation name.
            const patt = /ANG-(\d+)/g;
            const max = getNextAnnotationName(patt, payload.pictureId, state.annotations_angle);

            return {
                ...state,
                counter,
                annotations_angle: {
                    ...state.annotations_angle,
                    [payload.pictureId]: [
                        {
                            ...payload,
                            annotationType: ANNOTATION_ANGLE,
                            creationDate: NOW_DATE,
                            creationTimestamp: NOW_TIMESTAMP,
                            title: `ANG-${max}`,
                            measure: '°'
                        },
                        ...(state.annotations_angle[payload.pictureId] || [])
                    ].sort((left, right) => {
                        if (left.title > right.title) {
                            return -1;
                        }
                        if (left.title < right.title) {
                            return 1;
                        }
                        return 0;
                    })
                }
            };
        }
            break;
        case CREATE_ANNOTATION_OCCURRENCE: {
            const counter = state.counter + 1;
            const {type, ...payload} = action;

            // Get greatest auto generated number from annotation name.
            const patt = /OCC-(\d+)/g;
            const max = getNextAnnotationName(patt, payload.pictureId, state.annotations_occurrence);

            return {
                ...state,
                counter,
                annotations_occurrence: {
                    ...state.annotations_occurrence,
                    [payload.pictureId]: [
                        {
                            ...payload,
                            value: action.vertices.length,
                            annotationType: ANNOTATION_OCCURRENCE,
                            creationDate: NOW_DATE,
                            creationTimestamp: NOW_TIMESTAMP,
                            title: `OCC-${max}`,
                            measure: '#'
                        },
                        ...(state.annotations_occurrence[payload.pictureId] || [])
                    ].sort((left, right) => {
                        if (left.title > right.title) {
                            return -1;
                        }
                        if (left.title < right.title) {
                            return 1;
                        }
                        return 0;
                    })
                }
            };
        }
            break;
        case CREATE_ANNOTATION_COLORPICKER: {
            const counter = state.counter + 1;
            const {type, ...payload} = action;

            // Get greatest auto generated number from annotation name.
            const patt = /COL-(\d+)/g;
            const max = getNextAnnotationName(patt, payload.pictureId, state.annotations_color_picker);

            return {
                ...state,
                counter,
                annotations_color_picker: {
                    ...state.annotations_color_picker,
                    [payload.pictureId]: [
                        {
                            ...payload,
                            annotationType: ANNOTATION_COLORPICKER,
                            creationDate: NOW_DATE,
                            creationTimestamp: NOW_TIMESTAMP,
                            title: `COL-${max}`
                        },
                        ...(state.annotations_color_picker[payload.pictureId] || [])
                    ].sort((left, right) => {
                        if (left.title > right.title) {
                            return -1;
                        }
                        if (left.title < right.title) {
                            return 1;
                        }
                        return 0;
                    })
                }
            };
        }
            break;
        case CREATE_ANNOTATION_TRANSCRIPTION: {
            const counter = state.counter + 1;
            const {type, ...payload} = action;

            // Get greatest auto generated number from annotation name.
            const patt = /TRA-(\d+)/g;
            const max = getNextAnnotationName(patt, payload.pictureId, state.annotations_transcription);
            if (payload.vertices && payload.vertices.length < 4) {
                console.log('Size or vertices array is missing last point. %o', payload);
                payload.vertices.push(payload.vertices[0]);
            }
            return {
                ...state,
                counter,
                annotations_transcription: {
                    ...state.annotations_transcription,
                    [payload.pictureId]: [
                        {
                            ...payload,
                            annotationType: ANNOTATION_TRANSCRIPTION,
                            creationDate: NOW_DATE,
                            creationTimestamp: NOW_TIMESTAMP,
                            title: `TRA-${max}`
                        },
                        ...(state.annotations_transcription[payload.pictureId] || [])
                    ].sort((left, right) => {
                        if (left.title > right.title) {
                            return -1;
                        }
                        if (left.title < right.title) {
                            return 1;
                        }
                        return 0;
                    })
                }
            };
        }
            break;
        case CREATE_ANNOTATION_CATEGORICAL: {
            const counter = state.counter + 1;
            const {type, ...payload} = action;

            // Get greatest auto generated number from annotation name.
            const patt = /CAT-(\d+)/g;
            const max = getNextAnnotationName(patt, payload.pictureId, state.annotations_categorical);

            return {
                ...state,
                counter,
                annotations_categorical: {
                    ...state.annotations_categorical,
                    [payload.pictureId]: [
                        {
                            ...payload,
                            annotationType: ANNOTATION_CATEGORICAL,
                            creationDate: NOW_DATE,
                            creationTimestamp: NOW_TIMESTAMP,
                            title: `CAT-${max}`
                        },
                        ...(state.annotations_categorical[payload.pictureId] || [])
                    ].sort((left, right) => {
                        if (left.title > right.title) {
                            return -1;
                        }
                        if (left.title < right.title) {
                            return 1;
                        }
                        return 0;
                    })
                }
            };
        }
        case CREATE_ANNOTATION_RICHTEXT: {
            const counter = state.counter + 1;
            const {type, ...payload} = action;

            // Get greatest auto generated number from annotation name.
            const patt = /TXT-(\d+)/g;
            const max = getNextAnnotationName(patt, payload.pictureId, state.annotations_richtext);

            return {
                ...state,
                counter,
                annotations_richtext: {
                    ...state.annotations_richtext,
                    [payload.pictureId]: [
                        {
                            ...payload,
                            annotationType: ANNOTATION_RICHTEXT,
                            creationDate: NOW_DATE,
                            creationTimestamp: NOW_TIMESTAMP,
                            title: `TXT-${max}`
                        },
                        ...(state.annotations_richtext[payload.pictureId] || [])
                    ].sort((left, right) => {
                        if (left.title > right.title) {
                            return -1;
                        }
                        if (left.title < right.title) {
                            return 1;
                        }
                        return 0;
                    })
                }
            };
        }
            break;
        case CREATE_CARTEL: {
            const counter = state.counter + 1;
            const {type, ...payload} = action;

            return {
                ...state,
                counter,
                cartel_by_picture: {
                    ...state.cartel_by_picture,
                    [payload.pictureId]: {
                        ...payload,
                        annotationType: CARTEL,
                        creationDate: NOW_DATE,
                        creationTimestamp: NOW_TIMESTAMP,
                        title: `CART`
                    }
                }
            };
        }
            break;
// ---------------------------------------------------------------------------------------------------------------------
        case CREATE_TAB: {
            const name =  getNewTabName(state.open_tabs);
            const counter = state.counter + 1;
            const allFolders = getAllDirectoriesNameFlatten();
            const tab = {
                view: action.view,
                subview: LIST_VIEW,
                selected_folders: allFolders,
                selected_filter: null,
                pictures_selection: [],
                folder_pictures_selection: [],
                sortDirection: SORT_ALPHABETIC_DESC,
                sortDirectionAnnotation: SORT_DATE_DESC,
                manualOrderLock: false,
                showMozaicDetails: false,
                showMozaicCollection: false,
                activeTab: "1",
                sort_table_by: {field: '', direction: ''}
            };
            const new_tabs = {...state.open_tabs};
            new_tabs[name] = tab;
            tab.folder_pictures_selection = [...filterPicturesByFolder(tab, state.pictures)];
            tab.pictures_selection = tab.folder_pictures_selection;
            const newIndex = tab.pictures_selection.indexOf(tab.selected_sha1);
            if (newIndex !== -1) {
                tab.current_picture_index_in_selection = newIndex;
            } else {
                tab.current_picture_index_in_selection = 0;
                tab.selected_sha1 = tab.pictures_selection[0];
            }
            return {
                ...state,
                counter,
                open_tabs: new_tabs
            };
        }
            break;
        case CLOSE_TAB: {
            if (!action.name && action.name in state.open_tabs) return state;

            const counter = state.counter + 1;
            const new_tabs = {...state.open_tabs};
            delete new_tabs[action.name];
            return {
                ...state,
                counter,
                open_tabs: new_tabs
            };
        }
            break;
        case DELETE_TAB: {
            if (!action.name) return state;

            const counter = state.counter + 1;
            const tabs = lodash.omit(state.open_tabs, action.name);
            return {
                ...state,
                open_tabs: tabs,
                counter
            };
        }
            break;

        case OPEN_IN_NEW_TAB: {
            const name = getNewTabName(state.open_tabs);
            const allFolders = getAllDirectoriesNameFlatten();
            const counter = state.counter + 1;

            const tab = {
                view: 'library',
                subview: LIST_VIEW,
                selected_folders: allFolders,
                selected_filter: null,
                pictures_selection: [],
                folder_pictures_selection: [],
                sortDirection: SORT_ALPHABETIC_DESC,
                sortDirectionAnnotation: SORT_DATE_DESC,
                manualOrderLock: false,
                showMozaicDetails: false,
                showMozaicCollection: false,
                activeTab: "1",
                sort_table_by: {field: '', direction: ''}
            };

            const tabs = state.open_tabs;
            tabs[name] = tab;
            let selectedTags;
            selectedTags = [action.name ? action.name : name];

            const appendTag = (tagArray, tag) => {
                if (tag.children) {
                    tag.children.map(tag => {
                        selectedTags.push(tag.name);
                        appendTag(tagArray, tag);
                    });
                }
            };

            const tag = findTag(state.tags, action.name, false);
            appendTag(selectedTags, tag);

            tab.folder_pictures_selection = [...filterPicturesByFolder(tab, state.pictures)];
            tab.selected_filter = convertSelectedTagsToFilter(selectedTags);
            tab.pictures_selection = findPicturesByTagFilter(tab.selected_filter, tab.folder_pictures_selection, state);

            const newIndex = tab.pictures_selection.indexOf(tab.selected_sha1);
            if (newIndex !== -1) {
                tab.current_picture_index_in_selection = newIndex;
            } else {
                tab.current_picture_index_in_selection = 0;
                tab.selected_sha1 = tab.pictures_selection[0];
            }

            return {
                ...state,
                counter,
                open_tabs: {...tabs}
            };
        }
            break;

        case MERGE_TAGS: {
            // check if 'target' is not child of 'source'
            const testParent = findTag(state.tags, action.source, false);
            if (testParent.children && tagExist(testParent.children, action.target))
                return state;

            const counter = state.counter + 1;
            const parent = findTag(state.tags, action.target, false);
            const child = findTag(state.tags, action.source, true);

            // copy all children tags from source tag to target tag
            if (parent.children && child.children)
                parent.children.push(...child.children);
            else if (child.children)
                parent.children = [...child.children];

            // change images and annotations tagged with source tag with target tag
            if (state.annotations_by_tag.hasOwnProperty(action.source)) {
                if (state.annotations_by_tag.hasOwnProperty(action.target)) {
                    state.annotations_by_tag[action.source].map(annotation => {
                        if (state.annotations_by_tag[action.target].indexOf(annotation) === -1)
                            state.annotations_by_tag[action.target].push(annotation);
                    });
                } else {
                    state.annotations_by_tag[action.target] = [...state.annotations_by_tag[action.source]];
                }
                delete state.annotations_by_tag[action.source];
            }
            for (let annotationId in state.tags_by_annotation) {
                const index = state.tags_by_annotation[annotationId].indexOf(action.source);
                if (index !== -1) {
                    if (state.tags_by_annotation[annotationId].indexOf(action.target) === -1)
                        state.tags_by_annotation[annotationId][index] = action.target;
                    else
                        state.tags_by_annotation[annotationId].splice(index, 1);
                }
            }

            if (state.pictures_by_tag.hasOwnProperty(action.source)) {
                if (state.pictures_by_tag.hasOwnProperty(action.target)) {
                    state.pictures_by_tag[action.source].map(sha1 => {
                        if (state.pictures_by_tag[action.target].indexOf(sha1) === -1)
                            state.pictures_by_tag[action.target].push(sha1);
                    });
                } else {
                    state.pictures_by_tag[action.target] = [...state.pictures_by_tag[action.source]];
                }
                delete state.pictures_by_tag[action.source];
            }
            for (let sha1 in state.tags_by_picture) {
                const index = state.tags_by_picture[sha1].indexOf(action.source);
                if (index !== -1) {
                    if (state.tags_by_picture[sha1].indexOf(action.target) === -1)
                        state.tags_by_picture[sha1][index] = action.target;
                    else
                        state.tags_by_picture[sha1].splice(index, 1);
                }
            }

            // Remove source tag from all selections.
            const selectedTagIndex = state.selected_tags.indexOf(action.source);
            state.selected_tags.splice(selectedTagIndex, 1);

            return {
                ...state,
                counter,
                selected_tags: [...state.selected_tags],
                annotations_by_tag: {...state.annotations_by_tag},
                tags_by_annotation: {...state.tags_by_annotation},
                pictures_by_tag: {...state.pictures_by_tag},
                tags_by_picture: {...state.tags_by_picture},

            };
            // return state;

        }
            break;

        case SAVE_TAGS_SORT: {
            const counter = state.counter + 1;
            const new_tabs = {...state.open_tabs};
            new_tabs[action.tabName].sortDirection = action.direction;

            return {
                ...state,
                counter,
                open_tabs: new_tabs
            };
        }
            break;

        case SAVE_ANNOTATION_SORT: {
            const counter = state.counter + 1;
            state.open_tabs[action.tabName].sortDirectionAnnotation = action.direction;

            return {
                ...state,
                counter,
            };
        }
            break;

        case FLAT_OLD_TAGS : {
            const counter = state.counter + 1;

            const unSelected = state.open_tabs;
            Object.keys(state.open_tabs).forEach( key => {
                unSelected[key].selected_tags = [];
            });

            let result = [];
            const allTags = state.tags;
            //get valid categories and tags
            const validTagsAndCategories = getValidTags(state.tags);
            if(validTagsAndCategories.length > 0){
                validTagsAndCategories.forEach(category => {
                    result.push(category);
                })
            }
            //check if automatic tags exist
            const automaticTags = allTags.find(element => element.name === TAG_AUTO && element.hasOwnProperty("type"));
            if(automaticTags !== undefined){
                result.push(automaticTags);
            }else{
                const isOldAutomaticTagsPresent = allTags.find(element => element.name === TAG_AUTO);
                if(isOldAutomaticTagsPresent !== undefined){
                   const aTags = createAutomaticTags();
                   if(isOldAutomaticTagsPresent.hasOwnProperty("children")){
                       aTags.children = lvlAutomaticTags(isOldAutomaticTagsPresent.children)
                   }
                   result.push(aTags);
                }else{
                    result.push(createAutomaticTags());
                }
            }

            //check if common tags already exists if not create new object
            const commonTags = allTags.find(element => element.name === COMMON_TAGS && element.hasOwnProperty("type")) || createCommonTags();
            const oldTags = lvlTags(allTags);
            oldTags.forEach( tag => {
                commonTags.children.push(tag);
            })

            result.push(commonTags);
            console.log("final result" , result);
            //check if there is tags from previous version(tags without id) and add them to common tags

            return {
                ...state,
                counter,
                tags: result,
                selectedTags: [],
                open_tabs: unSelected
            };
        }

        case CREATE_CATEGORY: {
            if (!action.category.name) return state;
            if (categoryExists(state.tags, action.category.name)) {
                if(action.category.name !== TAG_AUTO && action.category.name !== TAG_MAP_SELECTION ){
                    ee.emit(EVENT_SHOW_ALERT , t('keywords.alert_category_with_name_already_exit', { name: action.category.name}));
                }
                return state;
            }
            const counter = state.counter + 1;
            return {
                ...state,
                counter,
                tags: [
                    action.category , ...state.tags]
            };
        }
            break;

        case MERGE_TM_TAGS : {
            const targetId = action.targetId;
            const draggedItem = action.item;
            const itemId = action.item.id;
            const parentId = action.parentId;

            if (!targetId || !itemId || !parentId) return state;

            const updateTags = (items) => {
                items.map( cat => {
                    if (cat.id === targetId){
                        cat.children.push(draggedItem);
                    }
                    if (cat.id === parentId){
                        cat.children = cat.children.filter( c => c.id !== itemId)
                    }
                    if (cat.children){
                        updateTags(cat.children)
                    }
                })
            }

            //if dragged category is root category
            if (parentId === 'root'){
                const newTags = state.tags.filter( rootCat => rootCat.id !== draggedItem.id);
                updateTags(newTags);
                return {
                    ...state,
                    counter: state.counter++,
                    tags: newTags
                };
            }else{
                updateTags(state.tags)
                return {
                    ...state,
                    counter: state.counter++,
                    tags: [...state.tags]
                };
            }

            break;
        }
        case ADD_SUB_CATEGORY: {

            const parentName = action.parentName;
            const parentId = action.parentId;
            const newItem = action.item;
            const isCategory = action.isCategory;
            const parent = findTagById(state.tags, parentId, false);

            if(!parent) return state;

            if (!action.parentName){
                alert(t('keywords.alert_can_not_add_tag_or_subcategory_without_parent'));
                return state;
            }
            //validation
            if (isCategory || action.item.type === TYPE_CATEGORY){
                if (categoryExists(state.tags, action.item.name)) {
                    ee.emit(EVENT_SHOW_ALERT , t('keywords.alert_category_with_name_already_exit', { name: action.item.name}));
                    return state;
                }
            }
            //add tag
            else{
                const tags = getTagsOnly(parent.children);
                if (checkItemInParentCategory(tags, action.item.name)) {
                    if(parentName !== TAG_AUTO){
                        ee.emit(EVENT_SHOW_ALERT, t('keywords.alert_tag_already_exit_in_category', { parent: parentName}));
                    }
                    return state;
                }
            }

            const counter = state.counter + 1;

            if (parent.children)
                parent.children = [...parent.children, newItem];
            else
                parent.children = [newItem];

            return {
                ...state,
                counter,
                tags: [...state.tags]
            };
        }
            break;

        case IMPORT_TAG_MODEL : {
            const counter = state.counter + 1;
            const tags = action.newTags;
            _addTagIdIfMissing(tags);
            console.log('imported tags' , tags);
                return {
                    ...state,
                    counter,
                    tags: tags
                };
        }
            break;
        case ADD_TAGS_ID: {
            _addTagIdIfMissing(state.tags);
            const counter = state.counter + 1;
            return {
                ...state,
                counter,
                tags: state.tags
            };
        }
        case CREATE_TAG: {
            if (!action.name) return state;
            if (tagExist(state.tags, action.name)) return state;

            const alreadyExists = state.tags.filter(_ => _.name === action.name).length !== 0;
            if (alreadyExists) return state;
            const counter = state.counter + 1;
            return {
                ...state,
                counter,
                tags: [
                    {
                        name: action.name,
                        creationDate: NOW_DATE,
                        creationTimestamp: NOW_TIMESTAMP,
                        system: action.system
                    }, ...state.tags]
            };
        }
            break;

        case EDIT_TAG_BY_ID : {

            const id = action.tag.id;

            if(!action.tag.id) return state;
            if (!action.newName) return state;

            const counter = state.counter + 1;

            const updateTagName = (tags) => {
                tags.map(tag => {
                    if (tag.id === id) {
                        tag.name = action.newName;
                    } else if (tag.children) {
                        updateTagName(tag.children);
                    }
                });

            };

            updateTagName(state.tags);
            return {
                ...state,
                counter,
            }
            break;
        }
        case EDIT_CATEGORY_BY_ID: {
            const id = action.category.id;
            if (!action.newName) return state;
            if(!id) return state;

            if (categoryExists(state.tags, action.newName)){
                ee.emit(EVENT_SHOW_ALERT , t('keywords.alert_category_with_name_already_exit', { name: action.newName}));
                return state;
            }

            const counter = state.counter + 1;

            const updateTagName = (tags) => {
                tags.map(cat => {
                    if (cat.id === id) {
                        cat.name = action.newName;
                    } else if (cat.children) {
                        updateTagName(cat.children);
                    }
                });
            };

            updateTagName(state.tags);

            const new_tags_by_picture = {};
            for (const p in state.tags_by_picture) {
                const index = state.tags_by_picture[p].indexOf(action.oldName);
                if (index === -1) {
                    new_tags_by_picture[p] = state.tags_by_picture[p];
                } else {
                    if (state.tags_by_picture[p.length === 1]) {
                    } else {
                        new_tags_by_picture[p] = [
                            ...state.tags_by_picture[p].slice(0, index),
                            ...state.tags_by_picture[p].slice(index + 1), action.newName
                        ];
                    }
                }
            }
            const index_in_selected_tags = state.selected_tags.indexOf(action.oldName);

            let annotations = [
                ...lodash.flattenDepth(Object.values(state.annotations_eventAnnotations), 2),
                ...lodash.flattenDepth(Object.values(state.annotations_chronothematique), 2),
                ...lodash.flattenDepth(Object.values(state.annotations_measures_linear), 2)
                , ...lodash.flattenDepth(Object.values(state.annotations_points_of_interest), 2)
                , ...lodash.flattenDepth(Object.values(state.annotations_rectangular), 2)
                , ...lodash.flattenDepth(Object.values(state.annotations_polygon), 2)
                , ...lodash.flattenDepth(Object.values(state.annotations_angle), 2)
                , ...lodash.flattenDepth(Object.values(state.annotations_color_picker), 2)
                , ...lodash.flattenDepth(Object.values(state.annotations_occurrence), 2)
                , ...lodash.flattenDepth(Object.values(state.annotations_ratio), 2)
                , ...lodash.flattenDepth(Object.values(state.annotations_transcription), 2)
                , ...lodash.flattenDepth(Object.values(state.annotations_richtext), 2)
            ];

            const new_tags_by_annotation = state.tags_by_annotation;
            annotations.map(annotation => {
                if (new_tags_by_annotation[annotation.id]) {
                    new_tags_by_annotation[annotation.id].push(action.newName);
                    lodash.remove(new_tags_by_annotation[annotation.id], (tag) => {
                        return tag === action.oldName;
                    });
                }
            });

            let new_pictures_by_tag = state.pictures_by_tag;
            if (state.pictures_by_tag.hasOwnProperty(action.oldName)) {
                const picturesByTag = state.pictures_by_tag[action.oldName];
                new_pictures_by_tag = lodash.omit(state.pictures_by_tag, action.oldName);
                new_pictures_by_tag[action.newName] = picturesByTag;
            }

            let new_annotations_by_tag = state.annotations_by_tag;
            if (state.annotations_by_tag.hasOwnProperty(action.oldName)) {
                const annotationsByTag = state.annotations_by_tag[action.oldName];
                new_annotations_by_tag = lodash.omit(state.annotations_by_tag, action.oldName);
                new_annotations_by_tag[action.newName] = annotationsByTag;
            }

            return {
                ...state,
                counter,
                pictures_by_tag: new_pictures_by_tag,
                annotations_by_tag: new_annotations_by_tag,
                selected_tags: [
                    ...state.selected_tags.slice(0, index_in_selected_tags),
                    ...state.selected_tags.slice(index_in_selected_tags + 1)
                ],
                tags_by_picture: new_tags_by_picture,
                tags_by_annotation: new_tags_by_annotation
            };
        }
        case EDIT_TAG: {
            if (!action.newName) return state;
            if (tagExist(state.tags, action.newName)) return state;

            const counter = state.counter + 1;

            const updateTagName = (tags) => {
                tags.map(tag => {
                    if (tag.name === action.oldName) {
                        tag.name = action.newName;
                    } else if (tag.children) {
                        updateTagName(tag.children);
                    }
                });

            };

            updateTagName(state.tags);

            const new_tags_by_picture = {};
            for (const p in state.tags_by_picture) {
                const index = state.tags_by_picture[p].indexOf(action.oldName);
                if (index === -1) {
                    new_tags_by_picture[p] = state.tags_by_picture[p];
                } else {
                    if (state.tags_by_picture[p.length === 1]) {
                    } else {
                        new_tags_by_picture[p] = [
                            ...state.tags_by_picture[p].slice(0, index),
                            ...state.tags_by_picture[p].slice(index + 1), action.newName
                        ];
                    }
                }
            }
            const index_in_selected_tags = state.selected_tags.indexOf(action.oldName);

            let annotations = [
                ...lodash.flattenDepth(Object.values(state.annotations_eventAnnotations), 2),
                ...lodash.flattenDepth(Object.values(state.annotations_chronothematique), 2),
                ...lodash.flattenDepth(Object.values(state.annotations_measures_linear), 2)
                , ...lodash.flattenDepth(Object.values(state.annotations_points_of_interest), 2)
                , ...lodash.flattenDepth(Object.values(state.annotations_rectangular), 2)
                , ...lodash.flattenDepth(Object.values(state.annotations_polygon), 2)
                , ...lodash.flattenDepth(Object.values(state.annotations_angle), 2)
                , ...lodash.flattenDepth(Object.values(state.annotations_color_picker), 2)
                , ...lodash.flattenDepth(Object.values(state.annotations_occurrence), 2)
                , ...lodash.flattenDepth(Object.values(state.annotations_ratio), 2)
                , ...lodash.flattenDepth(Object.values(state.annotations_transcription), 2)
                , ...lodash.flattenDepth(Object.values(state.annotations_richtext), 2)
            ];

            const new_tags_by_annotation = state.tags_by_annotation;
            annotations.map(annotation => {
                if (new_tags_by_annotation[annotation.id]) {
                    new_tags_by_annotation[annotation.id].push(action.newName);
                    lodash.remove(new_tags_by_annotation[annotation.id], (tag) => {
                        return tag === action.oldName;
                    });
                }
            });

            let new_pictures_by_tag = state.pictures_by_tag;
            if (state.pictures_by_tag.hasOwnProperty(action.oldName)) {
                const picturesByTag = state.pictures_by_tag[action.oldName];
                new_pictures_by_tag = lodash.omit(state.pictures_by_tag, action.oldName);
                new_pictures_by_tag[action.newName] = picturesByTag;
            }

            let new_annotations_by_tag = state.annotations_by_tag;
            if (state.annotations_by_tag.hasOwnProperty(action.oldName)) {
                const annotationsByTag = state.annotations_by_tag[action.oldName];
                new_annotations_by_tag = lodash.omit(state.annotations_by_tag, action.oldName);
                new_annotations_by_tag[action.newName] = annotationsByTag;
            }

            return {
                ...state,
                counter,
                pictures_by_tag: new_pictures_by_tag,
                annotations_by_tag: new_annotations_by_tag,
                selected_tags: [
                    ...state.selected_tags.slice(0, index_in_selected_tags),
                    ...state.selected_tags.slice(index_in_selected_tags + 1)
                ],
                tags_by_picture: new_tags_by_picture,
                tags_by_annotation: new_tags_by_annotation
            };
        }
            break;
        case ADD_SUB_TAG: {
            // check if 'addTo' is not child of 'tag'
            const testParent = findTag(state.tags, action.tag, false);
            if (testParent.children && tagExist(testParent.children, action.addTo))
                return state;

            const counter = state.counter + 1;
            const child = findTag(state.tags, action.tag, true);

            if (action.addTo !== 'ROOT') {
                const parent = findTag(state.tags, action.addTo, false);
                if (parent.children)
                    parent.children = [...parent.children, child];
                else
                    parent.children = [child];
            } else {
                state.tags = [...state.tags, child];
            }
            return {
                ...state,
                counter,
                tags: [...state.tags]
            };
        }
            break;

        case UPDATE_ANNOTATION_VALUE_IN_TAXONOMY_INSTANCE: {
            if (state.taxonomyInstance[action.taxonomyId] && state.taxonomyInstance[action.taxonomyId].taxonomyByPicture[action.sha1] !== undefined && state.taxonomyInstance) {
                const counter = state.counter + 1;
                let taxId = action.taxonomyId;
                const taxIns = state.taxonomyInstance;
                const tax = taxIns[taxId].taxonomyByAnnotation;
                action.annotations.forEach(ann => {
                    if (tax[ann.id] && tax[ann.id].value === 0) {
                        tax[ann.id].value = ann.value;
                    }
                })

                if (action.inPictureValues !== null) {
                    taxIns[taxId].taxonomyByPicture[action.sha1][action.descriptorId] = action.inPictureValues;
                }

                return {
                    ...state,
                    counter,
                    taxonomyInstance: taxIns
                };
            }else{
                return {
                    ...state
                }
            }
            break;
        }
// ---------------------------------------------------------------------------------------------------------------------
        case DELETE_ANNOTATION_MEASURE_LINEAR: {
            const counter = state.counter + 1;

            const annotations = state.annotations_measures_linear[action.pictureId].filter(
                _ => _.id !== action.annotationId
            );

            deleteAnnotationValues(state, action.annotationId);

            return {
                ...state,
                counter,
                annotations_measures_linear: {
                    ...state.annotations_measures_linear,
                    [action.pictureId]: annotations
                }
            };
        }
            break;
        case DELETE_EVENT_ANNOTATION: {
            console.log(action);
            const counter = state.counter + 1;
            return {
                ...state,
                counter,
                annotations_eventAnnotations: {
                    ...state.annotations_eventAnnotations,
                    [action.eventId]: state.annotations_eventAnnotations[action.eventId].filter(
                        _ => _.id !== action.annotationId
                    )
                }
            };
        }
        case DELETE_ANNOTATION_CHRONOTHEMATIQUE: {
            console.log(action);
            const counter = state.counter + 1;
            return {
                ...state,
                counter,
                annotations_chronothematique: {
                    ...state.annotations_chronothematique,
                    [action.videoId]: state.annotations_chronothematique[action.videoId].filter(
                        _ => _.id !== action.annotationId
                    )
                }
            };
        }
            break;
        case DELETE_ANNOTATION_POINT_OF_INTEREST: {
            const counter = state.counter + 1;
            deleteAnnotationValues(state, action.annotationId);
            return {
                ...state,
                counter,
                annotations_points_of_interest: {
                    ...state.annotations_points_of_interest,
                    [action.pictureId]: state.annotations_points_of_interest[action.pictureId].filter(
                        _ => _.id !== action.annotationId
                    )
                }
            };
        }
            break;
        case DELETE_ANNOTATION_RECTANGULAR: {
            const counter = state.counter + 1;
            const annotations = state.annotations_rectangular[action.pictureId].filter(_ => _.id !== action.annotationId);
            deleteAnnotationValues(state, action.annotationId);
            return {
                ...state,
                counter,
                annotations_rectangular: {
                    ...state.annotations_rectangular,
                    [action.pictureId]: annotations
                }
            };
        }
            break;
        case DELETE_ANNOTATION_POLYGON: {
            const counter = state.counter + 1;
            const annotations = state.annotations_polygon[action.pictureId].filter(_ => _.id !== action.annotationId);
            deleteAnnotationValues(state, action.annotationId);
            return {
                ...state,
                counter,
                annotations_polygon: {
                    ...state.annotations_polygon,
                    [action.pictureId]: annotations
                }
            };
        }
            break;
        case DELETE_ANNOTATION_ANGLE: {
            const counter = state.counter + 1;
            const annotations = state.annotations_angle[action.pictureId].filter(_ => _.id !== action.annotationId);
            deleteAnnotationValues(state, action.annotationId);
            return {
                ...state,
                counter,
                annotations_angle: {
                    ...state.annotations_angle,
                    [action.pictureId]: annotations
                }
            };
        }
            break;
        case DELETE_ANNOTATION_OCCURRENCE: {
            const counter = state.counter + 1;
            const annotations = state.annotations_occurrence[action.pictureId].filter(_ => _.id !== action.annotationId);
            deleteAnnotationValues(state, action.annotationId);
            return {
                ...state,
                counter,
                annotations_occurrence: {
                    ...state.annotations_occurrence,
                    [action.pictureId]: annotations
                }
            };
        }
            break;
        case DELETE_ANNOTATION_COLORPICKER: {
            const counter = state.counter + 1;
            deleteAnnotationValues(state, action.annotationId);
            return {
                ...state,
                counter,
                annotations_color_picker: {
                    ...state.annotations_color_picker,
                    [action.pictureId]: state.annotations_color_picker[action.pictureId].filter(_ => _.id !== action.annotationId)
                }
            };
        }
            break;
        case DELETE_ANNOTATION_RATIO: {
            const counter = state.counter + 1;
            deleteAnnotationValues(state, action.annotationId);
            return {
                ...state,
                counter,
                annotations_ratio: {
                    ...state.annotations_ratio,
                    [action.pictureId]: state.annotations_ratio[action.pictureId].filter(_ => _.id !== action.annotationId)
                }
            };
        }
            break;
        case DELETE_ANNOTATION_TRANSCRIPTION: {
            const counter = state.counter + 1;
            deleteAnnotationValues(state, action.annotationId);
            return {
                ...state,
                counter,
                annotations_transcription: {
                    ...state.annotations_transcription,
                    [action.pictureId]: state.annotations_transcription[action.pictureId].filter(_ => _.id !== action.annotationId)
                }
            };
        }
            break;
        case DELETE_ANNOTATION_CATEGORICAL: {
            const counter = state.counter + 1;
            deleteAnnotationValues(state, action.annotationId);
            return {
                ...state,
                counter,
                annotations_categorical: {
                    ...state.annotations_categorical,
                    [action.pictureId]: state.annotations_categorical[action.pictureId].filter(_ => _.id !== action.annotationId)
                }
            };
        }
            break;
        case DELETE_ANNOTATION_RICHTEXT: {
            const counter = state.counter + 1;
            deleteAnnotationValues(state, action.annotationId);
            return {
                ...state,
                counter,
                annotations_richtext: {
                    ...state.annotations_richtext,
                    [action.pictureId]: state.annotations_richtext[action.pictureId].filter(_ => _.id !== action.annotationId)
                }
            };
        }
            break;
        case DELETE_CARTEL: {
            const counter = state.counter + 1;
            const cartels = {...state.cartel_by_picture};
            delete cartels[action.pictureId];

            return {
                ...state,
                counter,
                cartel_by_picture: cartels
            };
        }
            break;
// ---------------------------------------------------------------------------------------------------------------------
        case DELETE_TAG: {
            const new_tags_by_picture = {...state.tags_by_picture};
            const counter = state.counter + 1;
            let annotations = [
                ...lodash.flattenDepth(Object.values(state.annotations_measures_linear), 2)
                , ...lodash.flattenDepth(Object.values(state.annotations_points_of_interest), 2)
                , ...lodash.flattenDepth(Object.values(state.annotations_rectangular), 2)
                , ...lodash.flattenDepth(Object.values(state.annotations_polygon), 2)
                , ...lodash.flattenDepth(Object.values(state.annotations_angle), 2)
                , ...lodash.flattenDepth(Object.values(state.annotations_color_picker), 2)
                , ...lodash.flattenDepth(Object.values(state.annotations_occurrence), 2)
                , ...lodash.flattenDepth(Object.values(state.annotations_ratio), 2)
                , ...lodash.flattenDepth(Object.values(state.annotations_transcription), 2)
                , ...lodash.flattenDepth(Object.values(state.annotations_richtext), 2)
            ];

            let annotations_by_tag = {...state.annotations_by_tag}
            let selected_tags = [...state.selected_tags];
            const new_tags_by_annotation = {...state.tags_by_annotation};
            let pictures_by_tag = {...state.pictures_by_tag};

            const deleteTag = (tagToBeRemoved) => {
                for (const p in new_tags_by_picture) {
                    const index = new_tags_by_picture[p].indexOf(tagToBeRemoved);
                    if (index !== -1) {
                        new_tags_by_picture[p] = [
                            ...new_tags_by_picture[p].slice(0, index),
                            ...new_tags_by_picture[p].slice(index + 1)
                        ];
                    }
                }

                const index_in_selected_tags = selected_tags.indexOf(tagToBeRemoved);
                selected_tags = [
                    ...selected_tags.slice(0, index_in_selected_tags),
                    ...selected_tags.slice(index_in_selected_tags + 1)
                ];


                annotations.map(annotation => {
                    if (new_tags_by_annotation[annotation.id]) {
                        lodash.remove(new_tags_by_annotation[annotation.id], (tag) => {
                            return tag === tagToBeRemoved;
                        });
                    }
                });

                annotations_by_tag = lodash.omit(annotations_by_tag, tagToBeRemoved);
                pictures_by_tag = lodash.omit(pictures_by_tag, tagToBeRemoved);

            };

            // Omit selected tag
            const omitTag = (tags, tagToBeRemoved, deleteChildren) => {
                let result = tags;
                tags.some(tag => {
                    if (tag.id === tagToBeRemoved) {
                        result = tags.filter(_ => _.id !== tagToBeRemoved);
                        if (tag.children) {
                            tag.children = omitTag(tag.children, '', true);
                        }
                        deleteTag(tag.name);
                        return true;
                    } else if (tag.children && !deleteChildren) { // If selected tag is children
                        tag.children = omitTag(tag.children, tagToBeRemoved);
                    } else if (deleteChildren) {
                        if (tag.children)
                            tag.children = omitTag(tag.children, '', true);
                        deleteTag(tag.name);
                    }
                });
                return result;
            };

            let new_tags = omitTag([...state.tags], action.name);

            return {
                ...state,
                counter,
                tags: new_tags,
                pictures_by_tag,
                annotations_by_tag,
                selected_tags,
                tags_by_picture: new_tags_by_picture,
                tags_by_annotation: new_tags_by_annotation
            };
        }
            break;

        case EDIT_EVENT_ANNOTATION_ENDTIME: {

            const branch = 'annotations_eventAnnotations';
            const counter = state.counter + 1;
            const annotation = state[branch][action.eventId].filter(_ => _.id === action.annotationId).pop();
            const event = state['pictures'][action.eventId];


            if (!annotation){
                return state;
            }
            if(!event || event.duration < action.endTime){
                return state;
            }

            annotation.end = action.endTime;
            annotation.duration = action.endTime - annotation.start

            const response = {
                ...state,
                counter,
                [branch]: {
                    ...state[branch],
                    [action.eventId]: [...state[branch][action.eventId].filter(_ => _.id !== action.annotationId), annotation].sort((left, right) => {
                        if (left.title > right.title) {
                            return -1;
                        }
                        if (left.title < right.title) {
                            return 1;
                        }
                        return 0;
                    })
                }
            };
            return response;
            break;

        }

        case  EDIT_CHRONOTHEMATIQUE_ANNOTATION_ENDTIME: {
            const branch = 'annotations_chronothematique';
            const counter = state.counter + 1;

            const annotation = state[branch][action.pictureId].filter(_ => _.id === action.annotationId).pop();
            annotation.end = action.endTime;
            annotation.duration = action.endTime - annotation.start

            const response = {
                ...state,
                counter,
                [branch]: {
                    ...state[branch],
                    [action.pictureId]: [...state[branch][action.pictureId].filter(_ => _.id !== action.annotationId), annotation].sort((left, right) => {
                        if (left.title > right.title) {
                            return -1;
                        }
                        if (left.title < right.title) {
                            return 1;
                        }
                        return 0;
                    })
                }
            };
            return response;
            break;
        }

        case EXTEND_EVENT_DURATION: {
            const time = action.duration;
            const eventId = action.eventId;
            const counter = state.counter + 1;

            if (state.pictures[eventId] === undefined || state.pictures[eventId] === null){
                console.log('error , trying to edit event that does not exist!')
                return {...state,}
            }else{
                const event = state.pictures[eventId];
                const newDuration = event.duration + time;
                event.duration = newDuration;
                event.syncTimeEnd = event.syncTimeStart + newDuration;
                return Object.assign({}, state, {
                    counter,
                    pictures: {
                        ...state.pictures,
                        [eventId]: event
                    }
                });
            }
        }

        case SAVE_EVENT_AFTER_RECORD: {
            const event = action.event;
            const eventId = action.event.id;
            const counter = state.counter + 1;

            if (state.pictures[eventId] === undefined || state.pictures[eventId] === null){
                console.log('error , trying to edit event that does not exist!')
                return {...state,}
            }else{
                return Object.assign({}, state, {
                    counter,
                    pictures: {
                        ...state.pictures,
                        [eventId]: event
                    }
                });
            }
        }
            break;

        case FINISH_CORRUPTED_EVENT: {
            const counter = state.counter + 1;
            const eventId = action.eventId;
            const event = state.pictures[eventId];
            let corruptedAnnotationEndTime = null;
            let checkedAnnotations = [];

            if (event === undefined || event === null){
                console.log('error , trying to edit event that does not exist!')
                return {...state,}
            }

            const eventAnnotations = state.annotations_eventAnnotations[eventId];
            console.log('event annotations' , eventAnnotations);
            if (eventAnnotations !== undefined && eventAnnotations !== 'undefined'){
                checkedAnnotations = eventAnnotations.map( ann => {
                    if (ann.end === ""){
                        ann.end = ann.start + 60;
                        ann.duration = ann.end - ann.start;
                        if(!ann.person){
                            ann.person = '';
                        }
                        if(!ann.location){
                            ann.location = '';
                        }
                        if(!ann.date){
                            ann.date = '';
                        }
                    }
                    return ann;
                })
            }

            corruptedAnnotationEndTime = Math.max.apply(Math, checkedAnnotations.map(function(o) { return o.end; }))

            if(corruptedAnnotationEndTime === null || corruptedAnnotationEndTime === '' || corruptedAnnotationEndTime === undefined || isNaN(corruptedAnnotationEndTime)){
                corruptedAnnotationEndTime = 0;
            }

            console.log('checkedAnnotations' , checkedAnnotations);

            event.status =  EVENT_STATUS_FINISHED;
            event.syncTimeEnd = event.syncTimeStart + corruptedAnnotationEndTime + 1800;
            let newEndDate = new Date(event.startDate);
            newEndDate.setSeconds(newEndDate.getSeconds() + event.syncTimeEnd);
            event.endDate = newEndDate.toString();
            event.duration = event.syncTimeEnd - event.syncTimeStart;

            console.log('corrupted event edited' , event)

            const branch = 'annotations_eventAnnotations';

            return Object.assign({}, state, {
                counter,
                pictures: {
                    ...state.pictures,
                    [eventId]: event
                },
                [branch]: {
                    ...state[branch],
                    [eventId]: checkedAnnotations.sort((left, right) => {
                        if (left.title > right.title) {
                            return -1;
                        }
                        if (left.title < right.title) {
                            return 1;
                        }
                        return 0;
                    })
                }
            });
        }
            break;

        case EDIT_ANNOTATE_EVENT: {
            console.log('editing annotate event')
            const counter = state.counter + 1;
            console.log(action)
            const eventId = action.eventId;
            const newEvent = action.annotateEvent;


            if (state.pictures[eventId] === undefined || state.pictures[eventId] === null){
                console.log('error , trying to edit event that does not exist!')
                return {...state,}
            }else{
                return Object.assign({}, state, {
                    counter,
                    pictures: {
                        ...state.pictures,
                        [eventId]: newEvent
                    }
                });
            }
        }
            break;

        case UNTAG_EVENT_ANNOTATION : {
            const counter = state.counter + 1;

            const annotation = state["annotations_eventAnnotations"][action.eventId].filter(_ => _.id === action.annotationId).pop();


            if (annotation === undefined || annotation.annotationType !== ANNOTATION_EVENT_ANNOTATION || !isValidInputGroup(action.inputGroup)){
                return  state;
            }

            if (annotation.hasOwnProperty(action.inputGroup)){
                annotation[action.inputGroup] = annotation[action.inputGroup].filter(tag => tag.name !== action.tagName);
            }

            return {
                ...state,
                counter,
                ["annotations_eventAnnotations"]: {
                    ...state["annotations_eventAnnotations"],
                    [action.eventId]: [...state["annotations_eventAnnotations"][action.eventId].filter(_ => _.id !== action.annotationId), annotation].sort((left, right) => {
                        if (left.title > right.title) {
                            return -1;
                        }
                        if (left.title < right.title) {
                            return 1;
                        }
                        return 0;
                    })
                }
            };
        }
            break;

        case TAG_EVENT_ANNOTATION: {

            const counter = state.counter + 1;

            const annotation = state["annotations_eventAnnotations"][action.eventId].filter(_ => _.id === action.annotationId).pop();


            if (annotation === undefined || annotation.annotationType !== ANNOTATION_EVENT_ANNOTATION || !isValidInputGroup(action.inputGroup)){
                return  state;
            }
            if (!annotation.hasOwnProperty(action.inputGroup)){
                annotation[action.inputGroup] = [action.tag]
            }else{
                const alreadyExist = annotation[action.inputGroup].some( tag => {
                    return tag.name === action.tag.name;
                })
                if (alreadyExist){
                    console.log(action.inputGroup + '  already contains tag ' + action.tag.name)
                    return state;
                }else{
                    annotation[action.inputGroup].push(action.tag);
                }
            }

            console.log('tagged event annotation' , annotation);
            // TODO: check this
            // // Is the tag already present?
            // if (state.tags_by_annotation.hasOwnProperty(action.annotationId) &&
            //     state.tags_by_annotation[action.annotationId].indexOf(action.tagName) !== -1) {
            //     return state;
            // }
            //
            // const new_state = {...state, counter};
            //
            // if (!new_state.annotations_by_tag.hasOwnProperty(action.tagName)) {
            //     new_state.annotations_by_tag[action.tagName] = [];
            // }
            // new_state.annotations_by_tag[action.tagName].push(action.annotationId);
            //
            // // tags_by_annotation
            // if (!new_state.tags_by_annotation.hasOwnProperty(action.annotationId)) {
            //     new_state.tags_by_annotation[action.annotationId] = [];
            // }
            // new_state.tags_by_annotation[action.annotationId] = [
            //     action.tagName,
            //     ...new_state.tags_by_annotation[action.annotationId]
            // ];
            //
            // return new_state;


            return {
                ...state,
                counter,
                ["annotations_eventAnnotations"]: {
                    ...state["annotations_eventAnnotations"],
                    [action.eventId]: [...state["annotations_eventAnnotations"][action.eventId].filter(_ => _.id !== action.annotationId), annotation].sort((left, right) => {
                        if (left.title > right.title) {
                            return -1;
                        }
                        if (left.title < right.title) {
                            return 1;
                        }
                        return 0;
                    })
                }
            };
        }
            break;

        case EDIT_ANNOTATION: {
            console.log('EDIT ANNOTAITON')
            console.log(action)
            const counter = state.counter + 1;
            let branch;
            switch (action.annotationType) {
                case ANNOTATION_EVENT_ANNOTATION:
                    branch = "annotations_eventAnnotations"
                    break;
                case ANNOTATION_CHRONOTHEMATIQUE:
                    branch = 'annotations_chronothematique'
                    break;
                case ANNOTATION_SIMPLELINE:
                case ANNOTATION_POLYLINE:
                    branch = 'annotations_measures_linear';
                    break;
                case ANNOTATION_MARKER:
                    branch = 'annotations_points_of_interest';
                    break;
                case ANNOTATION_RECTANGLE:
                    branch = 'annotations_rectangular';
                    break;
                case ANNOTATION_POLYGON:
                    branch = 'annotations_polygon';
                    break;
                case ANNOTATION_ANGLE:
                    branch = 'annotations_angle';
                    break;
                case ANNOTATION_OCCURRENCE:
                    branch = 'annotations_occurrence';
                    break;
                case ANNOTATION_COLORPICKER:
                    branch = 'annotations_color_picker';
                    break;
                case ANNOTATION_RATIO:
                    branch = 'annotations_ratio';
                    break;
                case ANNOTATION_TRANSCRIPTION:
                    branch = 'annotations_transcription';
                    break;
                case ANNOTATION_CATEGORICAL:
                    branch = 'annotations_categorical';
                    break;
                case ANNOTATION_RICHTEXT:
                    branch = 'annotations_richtext';
                    break;
                default:
                    return state;
            }

            console.log(branch)
            console.log(state[branch])
            const annotation = state[branch][action.pictureId].filter(_ => _.id === action.annotationId).pop();

            if (annotation === undefined) {
                return state;
            }

            annotation.text = action.text;
            annotation.title = action.title;
            annotation.coverage = action.coverage;
            if (action.annotationType === ANNOTATION_MARKER ||
                action.annotationType === ANNOTATION_RECTANGLE ||
                action.annotationType === ANNOTATION_COLORPICKER ||
                action.annotationType === ANNOTATION_TRANSCRIPTION ||
                action.annotationType === ANNOTATION_CATEGORICAL ||
                action.annotationType === ANNOTATION_RICHTEXT
            ) {
                annotation.value = action.annotationData.value;

            }
            if (action.annotationType === ANNOTATION_CHRONOTHEMATIQUE){
                annotation.value = action.annotationData.value
                annotation.date = action.annotationData.date;
                annotation.person = action.annotationData.person;
                annotation.location = action.annotationData.location;
            }

            if (action.annotationType === ANNOTATION_EVENT_ANNOTATION){
                annotation.value = action.annotationData.value
                annotation.date = action.annotationData.date;
                annotation.person = action.annotationData.person;
                annotation.location = action.annotationData.location;
                annotation.topic = action.annotationData.topic;
            }

            if (action.annotationData.value_in_mm !== null) {
                annotation.value_in_mm = action.annotationData.value_in_mm
            }
            if (action.annotationData.hasOwnProperty('vertices') && action.annotationData.vertices !== null) {
                if (Array.isArray(action.annotationData.vertices)) {
                    annotation.vertices = action.annotationData.vertices;
                    if (action.annotationType === ANNOTATION_OCCURRENCE) {
                        annotation.value = action.annotationData.vertices.length;
                    }
                } else {
                    annotation.x = action.annotationData.vertices.x;
                    annotation.y = action.annotationData.vertices.y;
                }
            }
            if (action.annotationData.area) {
                annotation.area = action.annotationData.area
            }
            if (action.annotationData.x) {
                annotation.area = action.annotationData.area
            }
            if (action.annotationData.value_in_deg) {
                annotation.value_in_deg = action.annotationData.value_in_deg
            }
            if (action.annotationData.value1) {
                annotation.value1 = action.annotationData.value1
            }
            if (action.annotationData.value2) {
                annotation.value2 = action.annotationData.value2
            }

            const response = {
                ...state,
                counter,
                [branch]: {
                    ...state[branch],
                    [action.pictureId]: [...state[branch][action.pictureId].filter(_ => _.id !== action.annotationId), annotation].sort((left, right) => {
                        if (left.title > right.title) {
                            return -1;
                        }
                        if (left.title < right.title) {
                            return 1;
                        }
                        return 0;
                    })
                }
            };
            return response;
        }
            break;
        case EDIT_CARTEL: {
            const counter = state.counter + 1;
            const cartels = {...state.cartel_by_picture};
            cartels[action.pictureId].value = action.value;

            return {
                ...state,
                counter,
                cartel_by_picture: cartels
            };
        }
            break;
        case UNFOCUS_ANNOTATION:
            return {
                ...state,
                focused_annotation: null
            }
            break;
        case FOCUS_ANNOTATION:
            return {
                ...state,
                focused_annotation: {
                    annotationId: action.annotationId,
                    annotationType: action.annotationType,
                    pictureId: action.pictureId,
                    ratioLine1: action.ratioLine1,
                    ratioLine2: action.ratioLine2
                }
            };
            break;
        case MOVE_PICTURE_IN_PICTURES_SELECTION: {
            if (action.indexFrom === action.indexTo) return state;
            if (action.indexFrom < 0) return state;
            if (action.indexTo < 0) return state;
            const tab = state.open_tabs[action.tabName];
            if (action.indexFrom >= tab.pictures_selection.length) return state;
            if (action.indexTo >= tab.pictures_selection.length) return state;

            const pictures_selection = tab.pictures_selection;
            const element = pictures_selection[action.indexFrom];
            pictures_selection.splice(action.indexFrom, 1);
            pictures_selection.splice(action.indexTo, 0, element);

            tab.pictures_selection = [...pictures_selection];

            const newIndex = tab.pictures_selection.indexOf(tab.selected_sha1);
            if (newIndex !== -1) {
                tab.current_picture_index_in_selection = newIndex;
            } else {
                tab.current_picture_index_in_selection = 0;
                tab.selected_sha1 = tab.pictures_selection[0];
            }

            return {...state};
        }
            break;
        case FIRST_PICTURE_IN_SELECTION: {
            const counter = state.counter + 1;
            const tab = state.open_tabs[action.tabName];

            return {
                ...state, counter, open_tabs: {
                    ...state.open_tabs, [action.tabName]: {
                        ...tab, current_picture_index_in_selection: 0,
                        selected_sha1: tab.pictures_selection[0]
                    }
                }
            };
        }
            break;
        case LAST_PICTURE_IN_SELECTION: {
            const counter = state.counter + 1;
            const tab = state.open_tabs[action.tabName];

            return {
                ...state, counter, open_tabs: {
                    ...state.open_tabs, [action.tabName]: {
                        ...tab, current_picture_index_in_selection: tab.pictures_selection.length - 1,
                        selected_sha1: tab.pictures_selection[tab.pictures_selection.length - 1]
                    }
                }
            };
        }

            break;
        case NEXT_PICTURE_IN_SELECTION: {
            const tab = state.open_tabs[action.tabName];
            const counter = state.counter + 1;

            let current_picture_index_in_selection = tab.current_picture_index_in_selection;
            if (tab.current_picture_index_in_selection === tab.pictures_selection.length - 1)
                current_picture_index_in_selection = 0;
            else current_picture_index_in_selection++;

            return {
                ...state, counter, open_tabs: {
                    ...state.open_tabs, [action.tabName]: {
                        ...tab, current_picture_index_in_selection,
                        selected_sha1: tab.pictures_selection[current_picture_index_in_selection]
                    }
                }
            };
        }
            break;
        case NEXT_TEN_PICTURE_IN_SELECTION: {
            const tab = state.open_tabs[action.tabName];
            const counter = state.counter + 1;

            let nextPic = tab.current_picture_index_in_selection + 10;
            if (nextPic > tab.pictures_selection.length - 1)
                nextPic = tab.pictures_selection.length - 1;

            return {
                ...state,
                counter,
                open_tabs: {
                    ...state.open_tabs, [action.tabName]: {
                        ...tab, current_picture_index_in_selection: nextPic,
                        selected_sha1: tab.pictures_selection[nextPic]
                    }
                }
            };
        }
            break;
        case PREVIOUS_PICTURE_IN_SELECTION: {
            const tab = state.open_tabs[action.tabName];
            const counter = state.counter + 1;

            let current_picture_index_in_selection = tab.current_picture_index_in_selection;
            if (tab.current_picture_index_in_selection === 0)
                current_picture_index_in_selection = tab.pictures_selection.length - 1;
            else current_picture_index_in_selection--;

            return {
                ...state, counter, open_tabs: {
                    ...state.open_tabs, [action.tabName]: {
                        ...tab, current_picture_index_in_selection,
                        selected_sha1: tab.pictures_selection[current_picture_index_in_selection]

                    }
                }
            };
        }
            break;
        case PREVIOUS_TEN_PICTURE_IN_SELECTION: {
            const tab = state.open_tabs[action.tabName];
            const counter = state.counter + 1;

            let _ = tab.current_picture_index_in_selection - 10;
            if (_ < 0) _ = 0;

            return {
                ...state, counter,
                open_tabs: {
                    ...state.open_tabs, [action.tabName]: {
                        ...tab, current_picture_index_in_selection: _,
                        selected_sha1: tab.pictures_selection[_]
                    }
                }
            };
        }
            break;
        case SET_PICTURE_IN_SELECTION: {
            const counter = state.counter + 1;
            const tab = state.open_tabs[action.tabName];

            const index = tab.pictures_selection.indexOf(action.pictureId);
            return {
                ...state, counter,
                open_tabs: {
                    ...state.open_tabs, [action.tabName]: {
                        ...tab, current_picture_index_in_selection: index,
                        selected_sha1: tab.pictures_selection[index]

                    }
                }
            };
        }
            break;

        case CREATE_TAG_EXPRESSION: {
            const counter = state.counter + 1;
            const tabs = state.open_tabs;
            const tab = tabs[action.tabName];

            if(!tab.selected_filter) {
                tab.selected_filter = {
                    id: genId(),
                    type: EXP_ITEM_TYPE_EXPRESSION,
                    value: []
                }
            }
            if(tab.selected_filter.value.length > 0) {
                tab.selected_filter.value.push({
                    id: genId(),
                    type: EXP_ITEM_TYPE_OPERATOR,
                    value:OR
                });
            }
            const newExpression = {
                id: genId(),
                type: EXP_ITEM_TYPE_EXPRESSION,
                value: []
            }
            tab.selected_filter.value.push(newExpression);
            tab.pictures_selection = findPicturesByTagFilter(tab.selected_filter, tab.folder_pictures_selection, state);
            const newIndex = tab.pictures_selection.indexOf(tab.selected_sha1);
            if (newIndex !== -1) {
                tab.current_picture_index_in_selection = newIndex;
            } else {
                tab.current_picture_index_in_selection = 0;
                tab.selected_sha1 = tab.pictures_selection[0];
            }
            return {
                ...state,
                counter,
                open_tabs: {...tabs}
            };
        }
            break;

        case DELETE_TAG_EXPRESSION: {
            const counter = state.counter + 1;
            const tabs = state.open_tabs;
            const tab = tabs[action.tabName];

            if(tab.selected_filter && tab.selected_filter.value.length > 0) {
                let updated = []
                let indexOfDeleted;
                for (let i = 0; i < tab.selected_filter.value.length; i++) {
                    const item = tab.selected_filter.value[i];
                    if(item.id === action.id) {
                        indexOfDeleted = i;
                        continue;
                    }
                }
                for (let i = 0; i < tab.selected_filter.value.length; i++) {
                    const item = tab.selected_filter.value[i];
                    const indexToSkip = indexOfDeleted == 0 ? indexOfDeleted +1 : indexOfDeleted - 1
                    if( i !== indexOfDeleted && (i !== indexToSkip)) {
                        updated.push(item);
                    }
                }

                tab.selected_filter.value = [...updated];
                tab.pictures_selection = findPicturesByTagFilter(tab.selected_filter, tab.folder_pictures_selection, state);
                const newIndex = tab.pictures_selection.indexOf(tab.selected_sha1);
                if (newIndex !== -1) {
                    tab.current_picture_index_in_selection = newIndex;
                } else {
                    tab.current_picture_index_in_selection = 0;
                    tab.selected_sha1 = tab.pictures_selection[0];
                }
            }

            return {
                ...state,
                counter,
                open_tabs: {...tabs}
            };
        }
            break;

        case UPDATE_TAG_EXPRESSION_OPERATOR: {
            const counter = state.counter + 1;
            const tabs = state.open_tabs;
            const tab = tabs[action.tabName];
            if(tab.selected_filter) {
                changeOperatorValueInFilter(tab.selected_filter, action.id, action.value);
                tab.pictures_selection = findPicturesByTagFilter(tab.selected_filter, tab.folder_pictures_selection, state);
                const newIndex = tab.pictures_selection.indexOf(tab.selected_sha1);
                if (newIndex !== -1) {
                    tab.current_picture_index_in_selection = newIndex;
                } else {
                    tab.current_picture_index_in_selection = 0;
                    tab.selected_sha1 = tab.pictures_selection[0];
                }
            }

            return {
                ...state,
                counter,
                open_tabs: {...tabs}
            };
        }
            break;

        case SELECT_TAG: {
            console.log("select tag action", action)
            const counter = state.counter + 1;
            const tabs = state.open_tabs;
            let selectedTags;
            // Skip check if tag is already selected.
            if (!action.skipCheck) {
                if (state.selected_tags.indexOf(action.name) !== -1) return state;
                selectedTags = [action.name, ...state.selected_tags];
                state.selected_tags = selectedTags;
            } else {
                selectedTags = state.selected_tags;
            }
            return {
                ...state,
                counter,
                open_tabs: {...tabs}
            };
        }
            break;

        case ADD_TAG_IN_FILTER: {
            console.log("add tag in filter action", action)
            const counter = state.counter + 1;
            const tabs = state.open_tabs;
            let selectedTags;
            // Skip check if tag is already selected.
            if (!action.skipCheck) {
                // If adding tag from tabbed component take list from tabs object.
                if (action.tabName) {
                    const tab = tabs[action.tabName];

                    let currentExpression;
                    if(!tab.selected_filter) {
                        tab.selected_filter = {
                            id: genId(),
                            type: EXP_ITEM_TYPE_EXPRESSION,
                            value: []
                        }
                    }
                    if(tab.selected_filter.value.length === 0) {
                        currentExpression = {
                            id: genId(),
                            type: EXP_ITEM_TYPE_EXPRESSION,
                            value: []
                        }
                        tab.selected_filter.value.push(currentExpression);
                    } else {
                        for (let i = tab.selected_filter.value.length-1; i >= 0; i--) {
                            const item = tab.selected_filter.value[i];
                            // console.log("currentExpression item", item)
                            if(item.type === EXP_ITEM_TYPE_EXPRESSION) {
                                currentExpression = item;
                                break;
                            }
                        }
                    }
                    // console.log("currentExpression", currentExpression)
                    let condition = {
                        id: genId(),
                        type: EXP_ITEM_TYPE_CONDITION,
                        value: {
                            has: true,
                            tag: action.name
                        }
                    }

                    if(currentExpression.value.length > 0) {
                        currentExpression.value.push({
                            id: genId(),
                            type:EXP_ITEM_TYPE_OPERATOR,
                            value: OR
                        })
                    }
                    currentExpression.value.push(condition);
                    tab.pictures_selection = findPicturesByTagFilter(tab.selected_filter, tab.folder_pictures_selection, state);

                    const newIndex = tab.pictures_selection.indexOf(tab.selected_sha1);
                    if (newIndex !== -1) {
                        tab.current_picture_index_in_selection = newIndex;
                    } else {
                        tab.current_picture_index_in_selection = 0;
                        tab.selected_sha1 = tab.pictures_selection[0];
                    }
                }
            } else {
                selectedTags = state.selected_tags;
            }

            return {
                ...state,
                counter,
                open_tabs: {...tabs}
            };
        }
            break;
        case SAVE_SORTED_ARRAY: {
            const counter = state.counter + 1;
            const tab = {...state.open_tabs[action.tabName]};

            tab.sort_table_by = {
                field: action.sortBy,
                direction: action.direction
            };
            tab.manualOrderLock = action.sortBy === MANUAL_ORDER;
            tab.pictures_selection = [...action.sortedArray];
            const newIndex = tab.pictures_selection.indexOf(tab.selected_sha1);
            if (newIndex !== -1) {
                tab.current_picture_index_in_selection = newIndex;
            } else {
                tab.current_picture_index_in_selection = 0;
                tab.selected_sha1 = tab.pictures_selection[0];
            }
            return {
                ...state, counter, open_tabs: {
                    ...state.open_tabs, [action.tabName]: {
                        ...tab
                    }
                }
            };
        }
            break;
        case TAG_ANNOTATION: {
            // Is the tag already present?
            if (state.tags_by_annotation.hasOwnProperty(action.annotationId) &&
                state.tags_by_annotation[action.annotationId].indexOf(action.tagName) !== -1) {
                return state;
            }

            const counter = state.counter + 1;
            const new_state = {...state, counter};

            if (!new_state.annotations_by_tag.hasOwnProperty(action.tagName)) {
                new_state.annotations_by_tag[action.tagName] = [];
            }
            new_state.annotations_by_tag[action.tagName].push(action.annotationId);

            // tags_by_annotation
            if (!new_state.tags_by_annotation.hasOwnProperty(action.annotationId)) {
                new_state.tags_by_annotation[action.annotationId] = [];
            }
            new_state.tags_by_annotation[action.annotationId] = [
                action.tagName,
                ...new_state.tags_by_annotation[action.annotationId]
            ];

            return new_state;
        }
            break;
        case TAG_PICTURE: {
            // Is the tag already present?
            if (state.tags_by_picture.hasOwnProperty(action.pictureId) &&
                state.tags_by_picture[action.pictureId].indexOf(action.tagName) !== -1) {
                return state;
            }

            const counter = state.counter + 1;
            return {
                ...state,
                counter,
                tags_by_picture: {
                    ...state.tags_by_picture,
                    [action.pictureId]: [...state.tags_by_picture[action.pictureId] || [], action.tagName]
                },
                pictures_by_tag: {
                    ...state.pictures_by_tag,
                    [action.tagName]: [...state.pictures_by_tag[action.tagName] || [], action.pictureId]
                }
            }
        }
            break;
        case UNSELECT_TAG: {
            console.log("unselect tag action", action)
            const counter = state.counter + 1;
            let selectedTags;
            const tabs = state.open_tabs;
            const tag_to_remove_index = state.selected_tags.indexOf(action.name);
            if (tag_to_remove_index === -1) return state;
            selectedTags = [
                ...state.selected_tags.slice(0, tag_to_remove_index),
                ...state.selected_tags.slice(tag_to_remove_index + 1)
            ];
            state.selected_tags = selectedTags;
            return {
                ...state,
                counter,
                open_tabs: {...tabs}
            };
        }
            break;
        case UNTAG_ANNOTATION: {
            const i = state.tags_by_annotation[action.annotationId].indexOf(action.tagName);
            const annIndex = state.annotations_by_tag[action.tagName].indexOf(action.annotationId);
            const counter = state.counter + 1;

            return {
                ...state,
                counter,
                tags_by_annotation: {
                    ...state.tags_by_annotation,
                    [action.annotationId]: [
                        ...state.tags_by_annotation[action.annotationId].slice(0, i),
                        ...state.tags_by_annotation[action.annotationId].slice(i + 1)
                    ]
                },
                annotations_by_tag: {
                    ...state.annotations_by_tag,
                    [action.tagName]: [
                        ...state.annotations_by_tag[action.tagName].slice(0, annIndex),
                        ...state.annotations_by_tag[action.tagName].slice(annIndex + 1)
                    ]
                }
            };
        }
            break;
        case UNTAG_PICTURE: {
            const i = state.tags_by_picture[action.pictureId].indexOf(action.tagName);
            const j = state.pictures_by_tag[action.tagName].indexOf(action.pictureId);
            const counter = state.counter + 1;
            return {
                ...state,
                counter,
                tags_by_picture: {
                    ...state.tags_by_picture,
                    [action.pictureId]: [
                        ...state.tags_by_picture[action.pictureId].slice(0, i),
                        ...state.tags_by_picture[action.pictureId].slice(i + 1)
                    ]
                },
                pictures_by_tag: {
                    ...state.pictures_by_tag,
                    [action.tagName]: [
                        ...state.pictures_by_tag[action.tagName].slice(0, j),
                        ...state.pictures_by_tag[action.tagName].slice(j + 1)
                    ]
                }
            };
        }
            break;

        case SELECT_MENU:
            return {
                ...state,
                selected_menu: action.menu
            };
            break;
        case SELECT_FOLDER_GLOBALLY: {
            const counter = state.counter + 1;
            const tabs = {...state.open_tabs};

            for (const tabName in tabs) {
                const tab = tabs[tabName];
                if (tab.selected_folders.indexOf(action.path) === -1)
                    tab.selected_folders.push(action.path);
                // Filter pictures by selected folders
                tab.folder_pictures_selection = [...filterPicturesByFolder(tab, state.pictures)];
                tab.pictures_selection = findPicturesByTagFilter(tab.selected_filter, tab.folder_pictures_selection, state);
                const newIndex = tab.pictures_selection.indexOf(tab.selected_sha1);
                if (newIndex !== -1) {
                    tab.current_picture_index_in_selection = newIndex;
                } else {
                    tab.current_picture_index_in_selection = 0;
                    tab.selected_sha1 = tab.pictures_selection[0];
                }
            }
            return {
                ...state,
                open_tabs: {...tabs},
                counter
            };
        }
            break;
        case SELECT_FOLDER: {
            if (state.open_tabs[action.tab].selected_folders.indexOf(action.path) !== -1)
                return state;
            const counter = state.counter + 1;

            const tabs = state.open_tabs;
            const tab = tabs[action.tab];
            tab.selected_folders.push(action.path);

            // Filter pictures by selected folders
            tab.folder_pictures_selection = [...filterPicturesByFolder(tab, state.pictures)];
            tab.pictures_selection = findPicturesByTagFilter(tab.selected_filter, tab.folder_pictures_selection, state);
            const newIndex = tab.pictures_selection.indexOf(tab.selected_sha1);
            if (newIndex !== -1) {
                tab.current_picture_index_in_selection = newIndex;
            } else {
                tab.current_picture_index_in_selection = 0;
                tab.selected_sha1 = tab.pictures_selection[0];
            }
            return {
                ...state,
                open_tabs: {...tabs},
                counter
            };
        }
            break;
        case UNSELECT_FOLDER: {
            const found = state.open_tabs[action.tab].selected_folders.indexOf(action.path);
            const counter = state.counter + 1;

            const tabs = state.open_tabs;
            const tab = tabs[action.tab];
            tab.selected_folders.splice(found, 1);

            // Filter pictures by selected folders
            tab.folder_pictures_selection = [...filterPicturesByFolder(tab, state.pictures)];
            tab.pictures_selection = findPicturesByTagFilter(tab.selected_filter, tab.folder_pictures_selection, state);
            const newIndex = tab.pictures_selection.indexOf(tab.selected_sha1);
            if (newIndex !== -1) {
                tab.current_picture_index_in_selection = newIndex;
            } else {
                tab.current_picture_index_in_selection = 0;
                tab.selected_sha1 = tab.pictures_selection[0];
            }

            return {
                ...state,
                open_tabs: {...tabs},
                counter
            };
        }
            break;
        case PREPARE_FOLDER_FOR_DELETION: {
            const counter = state.counter + 1;
            const tabs = state.open_tabs;
            const pictures = {...state.pictures};

            const allFolders = getAllDirectoriesNameFlatten(action.path);

            // Delete all traces of tagged image
            const picsInFolder = filterPicturesByFolder({selected_folders: allFolders}, pictures);

            const allAnnotations = [];
            lodash.forEach(picsInFolder, (sha1) => {
                delete state.pictures_by_calibration[sha1];
                delete state.tags_by_picture[sha1];

                allAnnotations.push(...deleteAnnotations(state.annotations_eventAnnotations , sha1));
                allAnnotations.push(...deleteAnnotations(state.annotations_chronothematique , sha1));
                allAnnotations.push(...deleteAnnotations(state.annotations_measures_linear, sha1));
                allAnnotations.push(...deleteAnnotations(state.annotations_points_of_interest, sha1));
                allAnnotations.push(...deleteAnnotations(state.annotations_rectangular, sha1));
                allAnnotations.push(...deleteAnnotations(state.annotations_polygon, sha1));
                allAnnotations.push(...deleteAnnotations(state.annotations_angle, sha1));
                allAnnotations.push(...deleteAnnotations(state.annotations_occurrence, sha1));
                allAnnotations.push(...deleteAnnotations(state.annotations_color_picker, sha1));
                allAnnotations.push(...deleteAnnotations(state.annotations_ratio, sha1));
                allAnnotations.push(...deleteAnnotations(state.annotations_transcription, sha1));
                allAnnotations.push(...deleteAnnotations(state.annotations_richtext, sha1));


                if (fs.existsSync(pictures[sha1].resourceType !== RESOURCE_TYPE_EVENT))
                    fs.unlinkSync(pictures[sha1].thumbnail);

                const metadataFile = path.join(getMetadataDir(), `${sha1}.json`);
                if (fs.existsSync(metadataFile))
                    fs.unlinkSync(metadataFile);

                const erecolnatMetadataFile = path.join(path.dirname(pictures[sha1].file), `${path.parse(pictures[sha1].file).name}.json`);
                if (fs.existsSync(erecolnatMetadataFile))
                    fs.unlinkSync(erecolnatMetadataFile);

                const fileName = path.parse(pictures[sha1].file).name;
                const xmpFile = path.join(path.dirname(pictures[sha1].file), `${fileName}.xmp`);
                const xmlFile = path.join(path.dirname(pictures[sha1].file), `${fileName}.xml`);

                if (fs.existsSync(xmpFile))
                    fs.unlinkSync(xmpFile);

                if (fs.existsSync(xmlFile))
                    fs.unlinkSync(xmlFile);

                delete pictures[sha1];
            });

            lodash.forEach(allAnnotations, (item) => {
                delete state.tags_by_annotation[item];

                // Delete taxonomy instances
                deleteAnnotationValues(state, item);
            });

            lodash.forEach(state.annotations_by_tag, (item, key) => {
                state.annotations_by_tag[key] = lodash.without(item, ...allAnnotations);
            });

            lodash.forEach(state.pictures_by_tag, (item, key) => {
                state.pictures_by_tag[key] = lodash.without(item, ...picsInFolder);
            });

            for (const tabName in state.open_tabs) {
                for (const path of allFolders) {
                    const found = state.open_tabs[tabName].selected_folders.indexOf(path);

                    if (found !== -1) {
                        const tab = tabs[tabName];
                        tab.selected_folders.splice(found, 1);

                        // Filter pictures by selected folders
                        tab.folder_pictures_selection = [...filterPicturesByFolder(tab, pictures)];
                        tab.pictures_selection = findPicturesByTagFilter(tab.selected_filter, tab.folder_pictures_selection, state);
                        const newIndex = tab.pictures_selection.indexOf(tab.selected_sha1);
                        if (newIndex !== -1) {
                            tab.current_picture_index_in_selection = newIndex;
                        } else {
                            tab.current_picture_index_in_selection = 0;
                            tab.selected_sha1 = tab.pictures_selection[0];
                        }
                    }
                }

                lodash.forEach(picsInFolder, (sha1) => {
                    const tab = tabs[tabName];
                    if ('order' in tab)
                        if(tab.order !== undefined || tab.order[sha1] !== undefined) {
                            delete tab.order[sha1];
                        }
                });
            }

            return {
                ...state,
                pictures: {...pictures},
                open_tabs: {...tabs},
                counter
            };
        }
            break;
        case DELETE_PICTURE: {

            const counter = state.counter + 1;
            const tabs = {...state.open_tabs};
            const sha1 = action.sha1;
            const pictures = {...state.pictures};
            const allAnnotations = [];

            delete state.pictures_by_calibration[sha1];
            delete state.tags_by_picture[sha1];

            allAnnotations.push(...deleteAnnotations(state.annotations_chronothematique, sha1));
            allAnnotations.push(...deleteAnnotations(state.annotations_measures_linear, sha1));
            allAnnotations.push(...deleteAnnotations(state.annotations_points_of_interest, sha1));
            allAnnotations.push(...deleteAnnotations(state.annotations_rectangular, sha1));
            allAnnotations.push(...deleteAnnotations(state.annotations_polygon, sha1));
            allAnnotations.push(...deleteAnnotations(state.annotations_angle, sha1));
            allAnnotations.push(...deleteAnnotations(state.annotations_occurrence, sha1));
            allAnnotations.push(...deleteAnnotations(state.annotations_color_picker, sha1));
            allAnnotations.push(...deleteAnnotations(state.annotations_ratio, sha1));
            allAnnotations.push(...deleteAnnotations(state.annotations_transcription, sha1));
            allAnnotations.push(...deleteAnnotations(state.annotations_richtext, sha1));

            // Delete image file, thumbnail and metadata files
            if (fs.existsSync(pictures[sha1].file)){
                fs.unlinkSync(pictures[sha1].file);
            }
            if (fs.existsSync(pictures[sha1].thumbnail)){
                fs.unlinkSync(pictures[sha1].thumbnail);
            }

            const metadataFile = path.join(getMetadataDir(), `${sha1}.json`);
            if (fs.existsSync(metadataFile))
                fs.unlinkSync(metadataFile);

            const fileName = path.parse(pictures[sha1].file).name;
            const erecolnatMetadataFile = path.join(path.dirname(pictures[sha1].file), `${fileName}.json`);
            if (fs.existsSync(erecolnatMetadataFile))
                fs.unlinkSync(erecolnatMetadataFile);

            const xmpFile = path.join(path.dirname(pictures[sha1].file), `${fileName}.xmp`);
            const xmlFile = path.join(path.dirname(pictures[sha1].file), `${fileName}.xml`);

            if (fs.existsSync(xmpFile))
                fs.unlinkSync(xmpFile);

            if (fs.existsSync(xmlFile))
                fs.unlinkSync(xmlFile);

            lodash.forEach(allAnnotations, (item) => {
                delete state.tags_by_annotation[item];
                // Delete taxonomy instances
                deleteAnnotationValues(state, item);
            });

            lodash.forEach(state.annotations_by_tag, (item, key) => {
                state.annotations_by_tag[key] = lodash.without(item, ...allAnnotations);
            });

            lodash.forEach(state.pictures_by_tag, (item, key) => {
                state.pictures_by_tag[key] = lodash.without(item, sha1);
            });

            for (const tabName in tabs) {
                const tab = tabs[tabName];
                delete pictures[sha1];
                // Filter pictures by selected folders
                tab.folder_pictures_selection = [...filterPicturesByFolder(tab, pictures)];
                tab.pictures_selection = findPicturesByTagFilter(tab.selected_filter, tab.folder_pictures_selection, state);
                const newIndex = tab.pictures_selection.indexOf(tab.selected_sha1);
                if (newIndex !== -1) {
                    tab.current_picture_index_in_selection = newIndex;
                } else {
                    tab.current_picture_index_in_selection = 0;
                    tab.selected_sha1 = tab.pictures_selection[0];
                }

                if (tab.hasOwnProperty('order')){
                    if(tab.order !== undefined || tab.order[sha1] !== undefined){
                        delete tab.order[sha1];
                    }
                }
            }

            delete pictures[sha1];

            return {
                ...state, pictures: pictures,
                open_tabs: tabs,
                counter
            };
        }
            break;
        case RENAME_TAB: {
            if (action.oldName === action.newName || action.newName === '' || action.newName === undefined || action.newName == null)
                return state;
            const counter = state.counter + 1;

            const tabs = {};
            for (const key in state.open_tabs) {
                if (key === action.oldName) {
                    tabs[action.newName] = state.open_tabs[key];
                } else {
                    tabs[key] = state.open_tabs[key];
                }
            }

            return {
                ...state,
                open_tabs: tabs,
                selected_tab: action.newName,
                counter
            };
        }
        case EMPTY_TAGS: {
            return {
                ...state,
                selected_tags: [],
                counter: state.counter + 1
            };
        }
            break;
        case LOCK_SELECTION: {
            const counter = state.counter + 1;
            const tab = state.open_tabs[action.tabName];

            return {
                ...state, counter, open_tabs: {
                    ...state.open_tabs, [action.tabName]: {
                        ...tab, manualOrderLock: action.enabled, order: action.order || tab.order
                    }
                }
            };
        }
            break;
        case UPDATE_MOZAIC_TOGGLE: {
            const counter = state.counter + 1;
            const tab = {...state.open_tabs[action.tabName]};
            tab.showMozaicCollection = action.showMozaicCollection;
            tab.showMozaicDetails = action.showMozaicDetails;
            return {
                ...state, counter, open_tabs: {
                    ...state.open_tabs, [action.tabName]: tab
                }
            };
        }
            break;
        case UPDATE_TABULAR_VIEW: {
            const counter = state.counter + 1;
            const tab = {...state.open_tabs[action.tabName]};
            tab.activeTab = action.activeTab;
            return {
                ...state, counter, open_tabs: {
                    ...state.open_tabs, [action.tabName]: tab
                }
            };
        }
            break;
// ---------------------------------------------------------------------------------------------------------------------
        case SAVE_TAXONOMY: {
            const counter = state.counter + 1;
            // create new file for annotate type of taxonomy
            let dest = action.path;
            if (action.model === MODEL_XPER) {
                dest = copySdd(action.id, action.path);
            } else {
                saveTaxonomy(action.id, []);
            }

            const taxonomies = state.taxonomies || [];
            return {
                ...state, counter, taxonomies: [...taxonomies, {
                    id: action.id,
                    name: action.name,
                    importDate: new Date(),
                    isActive: false,
                    sddPath: dest,
                    model: action.model,
                    version: action.version
                }]
            };
        }
        case IMPORT_TAXONOMY: {
            const counter = state.counter + 1;
            // create new file for annotate type of taxonomy
            saveTaxonomy(action.id, action.taxonomyDefinition);
            let targetTypes = [];
            if (action.targetTypes && action.targetTypes.length > 0){
                action.targetTypes.forEach( type => {
                    if (type !== ''){
                        if (!targetTypes.includes(type)){
                            targetTypes.push(type);
                        }
                    }
                })
            }

            if (action.taxonomyDefinition && action.taxonomyDefinition.length){
                action.taxonomyDefinition.forEach( descriptor => {
                    if (!targetTypes.includes(descriptor.targetType)){
                        targetTypes.push(descriptor.targetType);
                    }
                })
            }

            const taxonomies = state.taxonomies || [];
            return {
                ...state, counter, taxonomies: [...taxonomies, {
                    id: action.id,
                    name: action.name,
                    importDate: new Date(),
                    isActive: false,
                    sddPath: null,
                    model: MODEL_ANNOTATE,
                    version: action.version,
                    targetTypes: targetTypes
                }]
            };
        }
            break;
        case REMOVE_TAXONOMY: {
            const counter = state.counter + 1;
            const taxonomies = [...state.taxonomies];
            const taxonomyId = action.id;
            const index = taxonomies.findIndex(item => item.id === taxonomyId);
            let selectedTaxonomy = state.selectedTaxonomy;
            const taxonomyInstance = {...state.taxonomyInstance}

            if (taxonomyInstance[taxonomyId])
                delete taxonomyInstance[taxonomyId];

            if (selectedTaxonomy && selectedTaxonomy.id === taxonomyId) {
                selectedTaxonomy = null;
            }

            taxonomies.splice(index, 1);
            deleteTaxonomy(action.id);

            return {...state, counter, taxonomies, selectedTaxonomy, taxonomyInstance};
        }
        case SET_SELECTED_TAXONOMY: {
            const counter = state.counter + 1;
            const taxonomies = [...state.taxonomies];
            let selectedTaxonomy = {};
            taxonomies.forEach(element => {
                if (element.id === action.id) {
                    selectedTaxonomy.descriptors = loadTaxonomy(element.id);
                    selectedTaxonomy.id = element.id;
                    selectedTaxonomy.name = element.name;
                    selectedTaxonomy.model = element.model;
                    selectedTaxonomy.isActive = element.isActive;
                }
            });
            return {...state, counter, taxonomies, selectedTaxonomy};
        }
        case CHANGE_TAXONOMY_STATUS: {
            const counter = state.counter + 1;
            const taxonomies = [...state.taxonomies];
            let selectedTaxonomy = {};
            taxonomies.forEach(element => {
                if (element.id === action.id) {
                    element.isActive = action.isActive;
                    if (action.isActive) {
                        if (action.model === MODEL_XPER)
                            selectedTaxonomy.descriptors = convertSDDtoJson(path.join(getTaxonomyDir(), element.sddPath)).items;
                        else if (action.model === MODEL_ANNOTATE)
                            selectedTaxonomy.descriptors = loadTaxonomy(element.id);
                        selectedTaxonomy.id = element.id;
                        selectedTaxonomy.name = element.name;
                        selectedTaxonomy.model = element.model;
                    } else
                        selectedTaxonomy = null;
                } else {
                    element.isActive = false;
                }
            });
            return {...state, counter, taxonomies, selectedTaxonomy};
        }
            break;

        case CREATE_TARGET_INSTANCE: {
            const counter = state.counter + 1;
            if (!state.selectedTaxonomy)
                return state;
            let {
                tabName, annotationId, descriptorId, value
            } = action;
            const tab = {...state.open_tabs[tabName]};

            const taxonomyInstance = {...state.taxonomyInstance}
            // let taxonomyInstance;
            if (!(state.selectedTaxonomy.id in taxonomyInstance)) {
                taxonomyInstance[state.selectedTaxonomy.id] = {
                    taxonomyByAnnotation: {},
                    taxonomyByDescriptor: {},
                    taxonomyByPicture: {}
                };
            }
            const taxInst = taxonomyInstance[state.selectedTaxonomy.id];
            let oldDescriptorId = null;

            // If descriptorId is -1, it means empty value is selected in dropdown.
            if (descriptorId === "-1") {
                if (taxInst.taxonomyByAnnotation[annotationId]) {
                    descriptorId = taxInst.taxonomyByAnnotation[annotationId].descriptorId;
                    delete taxInst.taxonomyByAnnotation[annotationId];
                }
            } else {
                if (annotationId in taxInst.taxonomyByAnnotation)
                    oldDescriptorId = taxInst.taxonomyByAnnotation[annotationId].descriptorId;
                taxInst.taxonomyByAnnotation[annotationId] = {
                    descriptorId,
                    value,
                    sha1: tab.selected_sha1,
                    type: NUMERICAL
                };
            }

            const updateTaxonomyByDescriptor = (descriptorValues, taxonomyInstance, descriptorId) => {
                if (descriptorValues.length > 0) {
                    const sum = descriptorValues.reduce(function (a, b) {
                        return a + (b || 0);
                    });
                    const avg = sum / descriptorValues.length;
                    const min = Math.min(...descriptorValues);
                    const max = Math.max(...descriptorValues);
                    const sd = standardDeviation(descriptorValues);
                    taxonomyInstance.taxonomyByDescriptor[descriptorId] = {
                        min, max, sd, avg, count: descriptorValues.length
                    };
                } else {
                    delete taxonomyInstance.taxonomyByDescriptor[descriptorId];
                }
            };

            const updateTaxonomyByPicture = (descriptorValuesByPicture, taxonomyInstance, sha1, descriptorId) => {
                if (descriptorValuesByPicture.length > 0) {
                    const sum = descriptorValuesByPicture.reduce(function (a, b) {
                        return a + (b || 0);
                    });
                    const avg = sum / descriptorValuesByPicture.length;
                    const min = Math.min(...descriptorValuesByPicture);
                    const max = Math.max(...descriptorValuesByPicture);
                    const sd = standardDeviation(descriptorValuesByPicture);
                    if (!taxonomyInstance.taxonomyByPicture[sha1])
                        taxonomyInstance.taxonomyByPicture[sha1] = {};
                    taxonomyInstance.taxonomyByPicture[sha1][descriptorId] = {
                        min, max, sd, avg, count: descriptorValuesByPicture.length
                    };
                } else if (taxonomyInstance.taxonomyByPicture[sha1]) {
                    delete taxonomyInstance.taxonomyByPicture[sha1][descriptorId];
                }
            };

            const descriptorValues = [];
            const descriptorValuesByPicture = [];

            const oldDescriptorValues = [];
            const oldDescriptorValuesByPicture = [];

            for (const annId in taxInst.taxonomyByAnnotation) {
                const annotation = taxInst.taxonomyByAnnotation[annId];
                if (annotation.type === CATEGORICAL)
                    continue;
                if (annotation.descriptorId === descriptorId) {
                    descriptorValues.push(annotation.value || 0);
                    if (annotation.sha1 === tab.selected_sha1) {
                        descriptorValuesByPicture.push(annotation.value || 0);
                    }
                }
                if (oldDescriptorId !== null && annotation.descriptorId === oldDescriptorId) {
                    oldDescriptorValues.push(annotation.value || 0);
                    if (annotation.sha1 === tab.selected_sha1) {
                        oldDescriptorValuesByPicture.push(annotation.value || 0);
                    }
                }
            }

            updateTaxonomyByDescriptor(descriptorValues, taxInst, descriptorId);
            updateTaxonomyByPicture(descriptorValuesByPicture, taxInst, tab.selected_sha1, descriptorId);

            if (oldDescriptorId !== null) {
                updateTaxonomyByDescriptor(oldDescriptorValues, taxInst, oldDescriptorId);
                updateTaxonomyByPicture(oldDescriptorValuesByPicture, taxInst, tab.selected_sha1, oldDescriptorId);
            }

            return {
                ...state, counter, open_tabs: {
                    ...state.open_tabs, [tabName]: tab
                }, taxonomyInstance
            };
        }
            /*
               {
                   type: CREATE_EDIT_TAXONOMY_DESCRIPTION,
                   tabName,
                   descriptorId,
                   descriptorName,
                   annotationValue,
                   annotationName,
                   catalogNumber,
                   rating
               }
               tab.taxonomyInstance: {
                   taxonomyId: {
                       taxonomyByAnnotation: {
                           annId: {
                               catalogNumber: '',
                               name: '',
                               descriptorId: '',
                               value: '',
                               rating: ''
                           }
                       },
                       taxonomyByDescriptor: {
                           'c1': {
                               sd: 1,
                               min: 1,
                               max: 1,
                               descriptorName: '',
                               type: CREATE_EDIT_TAXONOMY_DESCRIPTION
                           }
                       }
                   }
               }
            */
            break;

        case CREATE_CATEGORICAL_TARGET_INSTANCE: {
            const counter = state.counter + 1;
            if (!state.selectedTaxonomy)
                return state;
            let {
                tabName, annotationId, descriptorId, value
            } = action;
            const tab = {...state.open_tabs[tabName]};

            const taxonomyInstance = {...state.taxonomyInstance};
            if (!(state.selectedTaxonomy.id in taxonomyInstance)) {
                taxonomyInstance[state.selectedTaxonomy.id] = {
                    taxonomyByAnnotation: {},
                    taxonomyByDescriptor: {},
                    taxonomyByPicture: {}
                };
            }
            const taxInst = taxonomyInstance[state.selectedTaxonomy.id];
            let oldDescriptorId = null;

            const removeDescriptorValue = (descriptorId, annotationId) => {
                if (descriptorId === -1)
                    return;
                let shouldDeleteTaxonomyByPic = true;
                let remainingValues = [];
                if (action.ofType === INTEREST) {
                    for (const annId in taxInst.taxonomyByAnnotation) {
                        const desc = taxInst.taxonomyByAnnotation[annId];
                        if (desc.descriptorId === descriptorId && desc.value && annotationId !== annId) {
                            shouldDeleteTaxonomyByPic = false;
                            remainingValues.push(...desc.value)
                        }
                    }
                }
                if (shouldDeleteTaxonomyByPic || action.ofType === CATEGORICAL) {
                    if (taxInst.taxonomyByPicture[tab.selected_sha1] !== undefined && taxInst.taxonomyByPicture[tab.selected_sha1][descriptorId])
                        delete taxInst.taxonomyByPicture[tab.selected_sha1][descriptorId];
                } else
                    taxInst.taxonomyByPicture[tab.selected_sha1][descriptorId].value = remainingValues;
            };

            if (action.oldDescriptorId) {
                removeDescriptorValue(action.oldDescriptorId, annotationId);
            }

            // If descriptorId is -1, it means empty value is selected in dropdown.
            if (descriptorId === "-1") {
                if (taxInst.taxonomyByAnnotation[annotationId]) {
                    descriptorId = taxInst.taxonomyByAnnotation[annotationId].descriptorId;
                    delete taxInst.taxonomyByAnnotation[annotationId];
                    let shouldDeleteTaxonomyByPic = true;
                    let remainingValues = [];
                    if (action.ofType === INTEREST) {
                        for (const annId in taxInst.taxonomyByAnnotation) {
                            const desc = taxInst.taxonomyByAnnotation[annId];
                            if (desc.descriptorId === descriptorId && desc.value) {
                                shouldDeleteTaxonomyByPic = false;
                                remainingValues.push(...desc.value)
                            }
                        }
                    }
                    if (shouldDeleteTaxonomyByPic) {
                        if (taxInst.taxonomyByPicture[tab.selected_sha1] !== undefined && taxInst.taxonomyByPicture[tab.selected_sha1][descriptorId])
                            delete taxInst.taxonomyByPicture[tab.selected_sha1][descriptorId];
                    } else
                        taxInst.taxonomyByPicture[tab.selected_sha1][descriptorId].value = remainingValues;
                }
            } else {
                if (annotationId in taxInst.taxonomyByAnnotation)
                    oldDescriptorId = taxInst.taxonomyByAnnotation[annotationId].descriptorId;
                taxInst.taxonomyByAnnotation[annotationId] = {
                    descriptorId,
                    value: value||[0],
                    sha1: tab.selected_sha1,
                    type: action.ofType
                };

                if (taxInst.taxonomyByPicture[tab.selected_sha1]) {
                    if (descriptorId in taxInst.taxonomyByPicture[tab.selected_sha1]) {
                        taxInst.taxonomyByPicture[tab.selected_sha1][descriptorId].value = [];
                        for (const annId in taxInst.taxonomyByAnnotation) {
                            const annotation = taxInst.taxonomyByAnnotation[annId];
                            if (annotation.descriptorId === descriptorId) {
                                if (annotation.value)
                                    taxInst.taxonomyByPicture[tab.selected_sha1][descriptorId].value.push(...annotation.value)
                                else
                                    taxInst.taxonomyByPicture[tab.selected_sha1][descriptorId].value.push(0)
                            }
                        }
                    } else if (value) {
                        taxInst.taxonomyByPicture[tab.selected_sha1][descriptorId] = {value}
                    } else {
                        taxInst.taxonomyByPicture[tab.selected_sha1][descriptorId] = {value:[0]}
                    }
                } else if (value) {
                    taxInst.taxonomyByPicture[tab.selected_sha1] = {
                        [descriptorId]: {value}
                    };
                } else {
                    taxInst.taxonomyByPicture[tab.selected_sha1] = {
                        [descriptorId]: {value:[0]}
                    };
                }
            }

            return {
                ...state, counter, open_tabs: {
                    ...state.open_tabs, [tabName]: tab
                }, taxonomyInstance
            };
        }

        case CREATE_TARGET_DESCRIPTOR: {
            const counter = state.counter + 1;
            const {taxonomyId, id, targetName, targetType, targetColor, unit, annotationType, includeInCalculation} = action;
            if (state.selectedTaxonomy && taxonomyId === state.selectedTaxonomy.id) {
                const selectedTaxonomy = {...state.selectedTaxonomy};
                selectedTaxonomy.descriptors.push({
                    id, targetName, targetType, targetColor, unit, annotationType, includeInCalculation
                });
                saveTaxonomy(selectedTaxonomy.id, selectedTaxonomy.descriptors);
                return {...state, counter, selectedTaxonomy}

            } else {
                const descriptors = loadTaxonomy(taxonomyId);
                descriptors.push({
                    id, targetName, targetType, targetColor, unit, annotationType, includeInCalculation
                });
                saveTaxonomy(taxonomyId, descriptors);
                return {...state, counter}
            }
        }

        case EDIT_TARGET_DESCRIPTOR: {
            const counter = state.counter + 1;
            if (!state.selectedTaxonomy)
                return state;
            const {taxonomyId, id, targetName, targetType, targetColor, unit, annotationType, includeInCalculation} = action;
            if (state.selectedTaxonomy && taxonomyId === state.selectedTaxonomy.id) {
                const selectedTaxonomy = {...state.selectedTaxonomy};
                const target = selectedTaxonomy.descriptors.find((target, index) => target.id === id);
                if (target) {
                    target.targetName = targetName;
                    target.targetType = targetType;
                    target.targetColor = targetColor;
                    target.unit = unit;
                    target.annotationType = annotationType;
                    target.includeInCalculation = includeInCalculation;
                }
                saveTaxonomy(selectedTaxonomy.id, selectedTaxonomy.descriptors);
                return {...state, counter, selectedTaxonomy}
            } else {
                const descriptors = loadTaxonomy(taxonomyId);
                const target = descriptors.find((target, index) => target.id === id);
                if (target) {
                    target.targetName = targetName;
                    target.targetType = targetType;
                    target.targetColor = targetColor;
                    target.unit = unit;
                    target.annotationType = annotationType;
                    target.includeInCalculation = includeInCalculation;
                }
                saveTaxonomy(taxonomyId, descriptors);
                return {...state, counter}
            }
        }

        case DELETE_TARGET_DESCRIPTOR: {
            const counter = state.counter + 1;
            if (!state.selectedTaxonomy)
                return state;
            const {taxonomyId, id} = action;
            let descIndex = -1;

            const tabs = {...state.open_tabs};
            for (const tabName in tabs) {
                const tab = tabs[tabName];
                const taxonomyInstance = state.taxonomyInstance[taxonomyId];
                if (taxonomyInstance) {
                    for (const annId in taxonomyInstance.taxonomyByAnnotation) {
                        if (taxonomyInstance.taxonomyByAnnotation[annId].descriptorId === id)
                            delete taxonomyInstance.taxonomyByAnnotation[annId];
                    }
                    delete taxonomyInstance.taxonomyByDescriptor[id];

                    for (const sha1 in taxonomyInstance.taxonomyByPicture) {
                        for (const descId in taxonomyInstance.taxonomyByPicture[sha1])
                            delete taxonomyInstance.taxonomyByPicture[sha1][id];
                    }
                }
                calculateDescriptorValues(state);
            }

            if (taxonomyId === state.selectedTaxonomy.id) {
                const selectedTaxonomy = {...state.selectedTaxonomy};
                selectedTaxonomy.descriptors.find((target, index) => {
                    if (target.id === id) {
                        descIndex = index;
                        return true;
                    } else return false;
                });
                selectedTaxonomy.descriptors.splice(descIndex, 1);

                saveTaxonomy(selectedTaxonomy.id, selectedTaxonomy.descriptors);
                return {...state, counter, selectedTaxonomy, open_tabs: tabs}
            } else {
                const descriptors = loadTaxonomy(taxonomyId);
                descriptors.find((target, index) => {
                    if (target.id === id) {
                        descIndex = index;
                        return true;
                    } else return false;
                });
                descriptors.splice(descIndex, 1);
                saveTaxonomy(taxonomyId, descriptors);
                return {...state, counter, open_tabs: tabs}
            }
        }

        case SAVE_TARGET_TYPE: {
            const counter = state.counter + 1;
            const taxonomies = [...state.taxonomies];
            const selectedTaxonomy = {...state.selectedTaxonomy};
            const model = taxonomies.find(item => item.id === action.taxonomyId);
            if (model.targetTypes) {
                if (model.targetTypes.indexOf(action.name) === -1) {
                    model.targetTypes.push(action.name);
                }
            } else {
                model.targetTypes = [action.name];
            }

            if (selectedTaxonomy.id === action.taxonomyId) {
                selectedTaxonomy.targetTypes = model.targetTypes;
            }
            return {...state, counter, taxonomies, selectedTaxonomy};
        }

        case DELETE_TARGET_TYPE: {

            const counter = state.counter + 1;
            const taxonomies = [...state.taxonomies];
            const selectedTaxonomy = {...state.selectedTaxonomy};
            const model = taxonomies.find(item => item.id === action.taxonomyId);

            model.targetTypes = model.targetTypes.filter(group => group !== action.name);

            if (state.selectedTaxonomy && action.taxonomyId === state.selectedTaxonomy.id) {

                if (selectedTaxonomy.descriptors !== undefined && selectedTaxonomy.descriptors.length > 0) {
                    selectedTaxonomy.descriptors.forEach(descriptor => {
                        if (descriptor.targetType === action.name) {
                            descriptor.targetType = '';
                        }
                    })
                }
                saveTaxonomy(selectedTaxonomy.id, selectedTaxonomy.descriptors);

                if (selectedTaxonomy.id === action.taxonomyId) {
                    selectedTaxonomy.targetTypes = model.targetTypes;
                }
                return {...state, counter, taxonomies, selectedTaxonomy};
            } else {
                const descriptors = loadTaxonomy(action.taxonomyId);
                descriptors.forEach(descriptor => {
                    if (descriptor.targetType === action.name) {
                        descriptor.targetType = '';
                    }
                });
                saveTaxonomy(action.taxonomyId, descriptors);
                return {...state, counter, taxonomies}
            }

        }

        case EDIT_TARGET_TYPE: {
            const counter = state.counter + 1;
            const taxonomies = [...state.taxonomies];
            const selectedTaxonomy = {...state.selectedTaxonomy};

            const model = taxonomies.find(item => item.id === action.taxonomyId);
            if (model.targetTypes) {
                if (model.targetTypes.indexOf(action.newName) === -1) {
                    const index = model.targetTypes.indexOf(action.name);
                    if (index !== -1) {
                        model.targetTypes[index] = action.newName;

                    }
                }
            } else {
                model.targetTypes = [action.name];
            }

            if (state.selectedTaxonomy && action.taxonomyId === state.selectedTaxonomy.id) {
                if (selectedTaxonomy.descriptors !== undefined && selectedTaxonomy.descriptors.length > 0) {
                    selectedTaxonomy.descriptors.forEach(descriptor => {
                        if (descriptor.targetType === action.name) {
                            descriptor.targetType = action.newName;
                        }
                    })
                }
                saveTaxonomy(selectedTaxonomy.id, selectedTaxonomy.descriptors);

                if (selectedTaxonomy.id === action.taxonomyId) {
                    selectedTaxonomy.targetTypes = model.targetTypes;
                }
                return {...state, counter, taxonomies, selectedTaxonomy}
            } else {
                const descriptors = loadTaxonomy(action.taxonomyId);
                descriptors.forEach(descriptor => {
                    if (descriptor.targetType === action.name) {
                        descriptor.targetType = action.newName;
                    }
                });
                saveTaxonomy(action.taxonomyId, descriptors);
                return {...state, counter, taxonomies}
            }
        }

        case UPDATE_TAXONOMY_VALUES: {
            const counter = state.counter + 1;
            if (!state.selectedTaxonomy)
                return state;
            const tab = {...state.open_tabs[action.tabName]};
            calculateDescriptorValues(state);
            return {
                ...state, counter, open_tabs: {
                    ...state.open_tabs, [action.tabName]: tab
                }
            };
        }

        case UPDATE_PICTURE_DATE: {
            const counter = state.counter + 1;
            const pictures = {...state.pictures};
            pictures[action.sha1].exifDate = action.date;
            pictures[action.sha1].exifPlace = action.exifPlace;
            pictures[action.sha1].placeName = action.placeName;
            return {
                ...state, counter, pictures
            }
        }
            break;
// ---------------------------------------------------------------------------------------------------------------------
        case MOVE_FOLDER: {
            const counter = state.counter + 1;
            // Move folders on disk
            const response = moveToFolder(getAllPicturesDirectories(), action.moveTo, action.folder);

            if (response === null) {
                return state;
            }

            // Update folder paths for each picture
            const pictures = {...state.pictures};
            for (const sha1 in pictures) {
                pictures[sha1].file = pictures[sha1].file.replace(response.previousFolder, response.nextFolder);
            }

            const tabs = {...state.open_tabs};
            for (const tabName in tabs) {
                if (!lodash.isArray(tabs[tabName].selected_folders))
                    continue;

                for (let i = 0; i < tabs[tabName].selected_folders.length; i++) {
                    if ('ROOT' === action.moveTo) {
                        tabs[tabName].selected_folders[i] = tabs[tabName].selected_folders[i].replace(action.folder, path.basename(action.folder));
                    } else {
                        tabs[tabName].selected_folders[i] = tabs[tabName].selected_folders[i].replace(action.folder, path.join(action.moveTo, path.basename(action.folder)));
                    }
                }
            }

            toConfigFileWithoutRefresh();
            return {
                ...state, pictures, counter, open_tabs: tabs
            };
        }
            break;
        case RENAME_FOLDER: {
            const counter = state.counter + 1;
            const pictures = {...state.pictures};
            const tabs = {...state.open_tabs};

            if (getAllPicturesDirectoriesFlatten().some(folder => {
                const newPath = path.join(path.dirname(action.path), folder.alias);
                return folder.alias === action.newName && folder.path === newPath
            })) {
                return state;
            }

            const _findFolder = (folders, pictures, tabs) => {
                folders.some(folder => {
                    if (folder.path === action.path) {
                        folder.alias = action.newName;

                        // update folder.path value
                        const newPath = path.join(path.dirname(folder.path), folder.alias);
                        folder.path = folder.path.replace(folder.path, newPath);

                        // update folder.path value of all children
                        updateChildrenPath(folder.children, action.path, newPath);

                        // rename folders on disk
                        renameFolder(action.path, newPath);

                        // Update folder paths for each picture
                        console.log(`Old path ${action.path}, new path ${newPath}`);
                        for (const sha1 in pictures) {
                            pictures[sha1].file = pictures[sha1].file.replace(action.path, newPath);
                        }

                        // update selected folders path
                        for (const tabName in tabs) {
                            if (!lodash.isArray(tabs[tabName].selected_folders))
                                continue;

                            for (let i = 0; i < tabs[tabName].selected_folders.length; i++) {
                                tabs[tabName].selected_folders[i] = tabs[tabName].selected_folders[i].replace(action.path, newPath);
                            }
                        }

                        return true;
                    }

                    if (folder.children) {
                        _findFolder(folder.children, pictures, tabs);
                    }
                })
            };
            _findFolder(getAllPicturesDirectories(), pictures, tabs);

            toConfigFileWithoutRefresh();
            return {
                ...state, pictures, open_tabs: tabs,
                counter
            };
        }
            break;
        case SAVE_LEAFLET_SETTINGS: {
            const counter = state.counter + 1;

            return {
                ...state, leafletSettings: {repeatMode: action.repeatMode},
                counter
            };
        }
            break;
        default:
            return state;
    }
};

const filterPicturesByFolder = (tab, allPictures) => {
    const pictures = [];
    tab.selected_folders.map(folderName => {
        const folder = path.join(getUserWorkspace(), IMAGE_STORAGE_DIR, folderName);
        console.log('Folder: ' + folder)
        for (const sha1 in allPictures) {
            if (path.dirname(allPictures[sha1].file) === folder) {
                pictures.push(sha1);
            }
        }
    });
    return pictures;
};

const findTagById = (tags, target, remove) => {
    let response = null;
    tags.some(tag => {
        if (tag.id === target) {
            response = tag;
            if (remove) {
                const rootTags = tags.filter(_ => _.id !== target)
                tags.splice(0, tags.length);
                tags.push(...rootTags);
            }
            return true;
        } else if (tag.children) {
            response = findTagById(tag.children, target, remove);
            const output = null != response;
            if (output) {
                if (remove) {
                    tag.children = tag.children.filter(_ => _.id !== target);
                }
            }
            return output;
        }
    });
    return response;
};

const getAnnotationNum = (patt, text) => {
    const result = patt.exec(text);
    if (result != null) {
        return +result[1];
    }
    return null;
};

const getAnnotationNumForVideoOrEvent = (title , type) => {
    if (title.startsWith(type) && /^\d+$/.test(title.substring(4))){
        return +title.substring(4);
    }else{
        return null;
    }
};

const getNextAnnotationNameForVideo = (sha1, annotationGroup  , type) => {
    // Get greatest auto generated number from annotation name.
    let max = 0;
    if (sha1 in annotationGroup) {
        const annotations = annotationGroup[sha1];
        annotations.map(annotation => {
            const current = getAnnotationNumForVideoOrEvent(annotation.title , type);
            if (current > max)
                max = current;
        });
    }
    return max + 1;
};

const getNextAnnotationName = (patt, sha1, annotationGroup) => {
    // Get greatest auto generated number from annotation name.
    let max = 0;
    if (sha1 in annotationGroup) {
        const annotations = annotationGroup[sha1];
        annotations.map(annotation => {
            const current = getAnnotationNum(patt, annotation.title);
            if (current > max)
                max = current;
        });
    }
    return max + 1;
};

const calculateDescriptorValues = (state) => {
    const taxonomyInstance = state.taxonomyInstance[state.selectedTaxonomy.id];
    if (!taxonomyInstance)
        return;
    const annotations = [
        ...lodash.flattenDepth(Object.values(state.annotations_measures_linear), 1)
        , ...lodash.flattenDepth(Object.values(state.annotations_polygon), 1)
        , ...lodash.flattenDepth(Object.values(state.annotations_angle), 1)
        , ...lodash.flattenDepth(Object.values(state.annotations_occurrence), 1)
    ];

    // Update descriptor value from annotations.
    annotations.map(annotation => {
        const descriptor = taxonomyInstance.taxonomyByAnnotation[annotation.id];
        if (descriptor) {
            let value = 0;
            if ('value' in annotation)
                value = annotation.value;
            else if ('value_in_mm' in annotation)
                value = annotation.value_in_mm;
            else if ('value_in_deg' in annotation)
                value = annotation.value_in_deg;
            else if ('area' in annotation)
                value = annotation.area;
            descriptor.value = value;
        }
    });

    // iterate over taxonomyByAnnotation get new annotation values and
    // update taxonomyByAnnotation, taxonomyByDescriptor, taxonomyByPicture
    const descriptorValues = {};
    const descriptorValuesByPicture = {};
    for (const annId in taxonomyInstance.taxonomyByAnnotation) {
        const annotation = taxonomyInstance.taxonomyByAnnotation[annId];
        if (annotation.type === CATEGORICAL)
            continue;
        if (descriptorValues[annotation.descriptorId]) {
            descriptorValues[annotation.descriptorId].push(annotation.value)
        } else {
            descriptorValues[annotation.descriptorId] = [annotation.value];
        }

        if (descriptorValuesByPicture[annotation.sha1]) {
            if (descriptorValuesByPicture[annotation.sha1][annotation.descriptorId])
                descriptorValuesByPicture[annotation.sha1][annotation.descriptorId].push(annotation.value)
            else
                descriptorValuesByPicture[annotation.sha1][annotation.descriptorId] = [annotation.value];
        } else {
            descriptorValuesByPicture[annotation.sha1] = {};
            descriptorValuesByPicture[annotation.sha1][annotation.descriptorId] = [annotation.value];
        }
    }

    for (const descId in descriptorValues) {
        const values = descriptorValues[descId];
        if (values.length > 0) {
            const sum = values.reduce(function (a, b) {
                return a + (b || 0);
            });
            const avg = sum / values.length;
            const min = Math.min(...values);
            const max = Math.max(...values);
            const sd = standardDeviation(values);
            taxonomyInstance.taxonomyByDescriptor[descId] = {
                min, max, sd, avg, count: values.length
            };
        }
    }

    for (const sha1 in descriptorValuesByPicture) {
        const descValues = descriptorValuesByPicture[sha1];
        for (const descId in descValues) {
            const values = descValues[descId];
            if (values.length > 0) {
                const sum = values.reduce(function (a, b) {
                    return a + (b || 0);
                });
                const avg = sum / values.length;
                const min = Math.min(...values);
                const max = Math.max(...values);
                const sd = standardDeviation(values);
                if (!taxonomyInstance.taxonomyByPicture[sha1])
                    taxonomyInstance.taxonomyByPicture[sha1] = {};
                taxonomyInstance.taxonomyByPicture[sha1][descId] = {
                    min, max, sd, avg, count: values.length
                };
            }
        }
    }
};

const deleteAnnotations = (obj, sha1) => {
    let annotations = [];
    if (obj.hasOwnProperty(sha1)) {
        annotations = obj[sha1].map(annotation => annotation.id);
        delete obj[sha1];
    }
    return annotations;
};

const deleteAnnotationValues = (state, annId) => {
    const taxonomyInstance = state.taxonomyInstance;
    for (const instId in taxonomyInstance) {
        const annDesc = taxonomyInstance[instId].taxonomyByAnnotation[annId];
        if (annDesc) {
            delete taxonomyInstance[instId].taxonomyByDescriptor[annDesc.descriptorId];
            if (taxonomyInstance[instId].taxonomyByPicture[annDesc.sha1] && taxonomyInstance[instId].taxonomyByPicture[annDesc.sha1][annDesc.descriptorId])
                delete taxonomyInstance[instId].taxonomyByPicture[annDesc.sha1][annDesc.descriptorId];
            delete taxonomyInstance[instId].taxonomyByAnnotation[annId];

            if (lodash.isEmpty(taxonomyInstance[instId].taxonomyByPicture[annDesc.sha1])) {
                delete taxonomyInstance[instId].taxonomyByPicture[annDesc.sha1]
            }
            if (lodash.isEmpty(taxonomyInstance[instId].taxonomyByAnnotation)) {
                delete taxonomyInstance[instId];
            }
        }
    }
};

const isValidInputGroup = (name) => {
    const validInputGroups = ["nameTags" , "titleTags" , "personTags" , "dateTags" , "locationTags" , "noteTags" , "topicTags"];
    return validInputGroups.some(grp => grp === name);
}
