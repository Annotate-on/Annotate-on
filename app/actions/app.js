/*
pictureId refers to a picture SHA1
*/

import {ANNOTATION_POLYGON_OF_INTEREST, ANNOTATION_SIMPLELINE, NUMERICAL} from "../constants/constants";

export const CREATE_ANNOTATION_CHRONOTHEMATIQUE = 'CREATE_ANNOTATION_CHRONOTHEMATIQUE';
export const CREATE_EVENT_ANNOTATION = 'CREATE_EVENT_ANNOTATION';
export const CREATE_ANNOTATE_EVENT = 'CREATE_ANNOTATE_EVENT';
export const CREATE_ANNOTATION_MEASURE_SIMPLELINE = 'CREATE_ANNOTATION_MEASURE_SIMPLELINE';
export const CREATE_ANNOTATION_MEASURE_POLYLINE = 'CREATE_ANNOTATION_MEASURE_POLYLINE';
export const CREATE_ANNOTATION_POINT_OF_INTEREST = 'CREATE_ANNOTATION_POINT_OF_INTEREST';
export const CREATE_ANNOTATION_RECTANGULAR = 'CREATE_ANNOTATION_RECTANGULAR';
export const CREATE_ANNOTATION_POLYGON = 'CREATE_ANNOTATION_POLYGON';
export const CREATE_ANNOTATION_ANGLE = 'CREATE_ANNOTATION_ANGLE';
export const CREATE_ANNOTATION_OCCURRENCE = 'CREATE_ANNOTATION_OCCURRENCE';
export const CREATE_ANNOTATION_COLORPICKER = 'CREATE_ANNOTATION_COLORPICKER';
export const CREATE_ANNOTATION_TRANSCRIPTION = 'CREATE_ANNOTATION_TRANSCRIPTION';
export const CREATE_ANNOTATION_CATEGORICAL = 'CREATE_ANNOTATION_CATEGORICAL';
export const CREATE_ANNOTATION_RICHTEXT = 'CREATE_ANNOTATION_RICHTEXT';

export const MERGE_TM_TAGS = 'MERGE_TM_TAGS';
export const ADD_SUB_CATEGORY = 'ADD_SUB_CATEGORY';
export const CREATE_CATEGORY = 'CREATE_CATEGORY';
export const EDIT_CATEGORY = 'EDIT_CATEGORY';
export const DELETE_CATEGORY = 'DELETE_CATEGORY';

export const IMPORT_TAG_MODEL = 'IMPORT_TAG_MODEL';
export const CREATE_TAG = 'CREATE_TAG';
export const ADD_TAGS_ID = 'ADD_TAGS_ID';
export const FLAT_OLD_TAGS = 'FLAT_OLD_TAGS';
export const EDIT_TAG = 'EDIT_TAG';
export const EDIT_TAG_BY_ID = 'EDIT_TAG_BY_ID';
export const EDIT_CATEGORY_BY_ID = 'EDIT_CATEGORY_BY_ID';
export const UPDATE_ANNOTATION_VALUE_IN_TAXONOMY_INSTANCE = 'UPDATE_ANNOTATION_VALUE_IN_TAXONOMY_INSTANCE';
export const DELETE_ANNOTATE_EVENT = 'DELETE_ANNOTATE_EVENT';
export const DELETE_ANNOTATION_CHRONOTHEMATIQUE = 'DELETE_ANNOTATION_CHRONOTHEMATIQUE';
export const DELETE_EVENT_ANNOTATION = 'DELETE_EVENT_ANNOTATION';
export const DELETE_ANNOTATION_MEASURE_LINEAR = 'DELETE_ANNOTATION_MEASURE_LINEAR';
export const DELETE_ANNOTATION_POINT_OF_INTEREST = 'DELETE_ANNOTATION_POINT_OF_INTEREST';
export const DELETE_ANNOTATION_RECTANGULAR = 'DELETE_ANNOTATION_RECTANGULAR';
export const DELETE_ANNOTATION_POLYGON = 'DELETE_ANNOTATION_POLYGON';
export const DELETE_ANNOTATION_ANGLE = 'DELETE_ANNOTATION_ANGLE';
export const DELETE_ANNOTATION_OCCURRENCE = 'DELETE_ANNOTATION_OCCURRENCE';
export const DELETE_ANNOTATION_COLORPICKER = 'DELETE_ANNOTATION_COLORPICKER';
export const DELETE_ANNOTATION_TRANSCRIPTION = 'DELETE_ANNOTATION_TRANSCRIPTION';
export const DELETE_ANNOTATION_CATEGORICAL = 'DELETE_ANNOTATION_CATEGORICAL';
export const DELETE_ANNOTATION_RICHTEXT = 'DELETE_ANNOTATION_RICHTEXT';
export const DELETE_ANNOTATION_CIRCLE_OF_INTEREST = 'DELETE_ANNOTATION_CIRCLE_OF_INTEREST';
export const DELETE_ANNOTATION_POLYGON_OF_INTEREST = 'DELETE_ANNOTATION_POLYGON_OF_INTEREST';

export const DELETE_TARGET_TYPE = 'DELETE_TARGET_TYPE';
export const EDIT_TARGET_TYPE = 'EDIT_TARGET_TYPE';

export const DELETE_TAG = 'DELETE_TAG';
export const EDIT_ANNOTATION = 'EDIT_ANNOTATION';
export const SAVE_EVENT_AFTER_RECORD = 'SAVE_EVENT_AFTER_RECORD';
export const EXTEND_EVENT_DURATION = 'EXTEND_EVENT_DURATION';
export const EDIT_ANNOTATE_EVENT = 'EDIT_ANNOTATE_EVENT';
export const FINISH_CORRUPTED_EVENT = 'FINISH_CORRUPTED_EVENT';
export const EDIT_VIDEO_ANNOTATION_ENDTIME = 'EDIT_VIDEO_ANNOTATION_ENDTIME';
export const EDIT_EVENT_ANNOTATION_ENDTIME = 'EDIT_EVENT_ANNOTATION_ENDTIME';
export const FIRST_PICTURE_IN_SELECTION = 'FIRST_PICTURE_IN_SELECTION';
export const FOCUS_ANNOTATION = 'FOCUS_ANNOTATION';
export const UNFOCUS_ANNOTATION = 'UNFOCUS_ANNOTATION';
export const LAST_PICTURE_IN_SELECTION = 'LAST_PICTURE_IN_SELECTION';
export const MOVE_PICTURE_IN_PICTURES_SELECTION = 'MOVE_PICTURE_IN_PICTURES_SELECTION';
export const NEXT_PICTURE_IN_SELECTION = 'NEXT_PICTURE_IN_SELECTION';
export const NEXT_TEN_PICTURE_IN_SELECTION = 'NEXT_TEN_PICTURE_IN_SELECTION';
export const PREVIOUS_PICTURE_IN_SELECTION = 'PREVIOUS_PICTURE_IN_SELECTION';
export const PREVIOUS_TEN_PICTURE_IN_SELECTION = 'PREVIOUS_TEN_PICTURE_IN_SELECTION';
export const SELECT_TAG = 'SELECT_TAG';
export const ADD_TAG_IN_FILTER = 'ADD_TAG_IN_FILTER';
export const DELETE_TAG_FILTER = 'DELETE_TAG_FILTER';
export const DELETE_TAG_EXPRESSION = 'DELETE_TAG_EXPRESSION';
export const CREATE_TAG_EXPRESSION = 'CREATE_TAG_EXPRESSION';
export const UPDATE_TAG_EXPRESSION_OPERATOR = 'UPDATE_TAG_EXPRESSION_OPERATOR';
export const SELECT_MENU = 'SELECT_MENU';
export const SELECT_LIBRARY_TAB = 'SELECT_LIBRARY_TAB';
export const SET_PICTURE_IN_SELECTION = 'SET_PICTURE_IN_SELECTION';
export const TAG_ANNOTATION = 'TAG_ANNOTATION';
export const TAG_EVENT_ANNOTATION = 'TAG_EVENT_ANNOTATION';
export const UNTAG_EVENT_ANNOTATION = 'UNTAG_EVENT_ANNOTATION';
export const TAG_PICTURE = 'TAG_PICTURE';
export const UNSELECT_TAG = 'UNSELECT_TAG';
export const UNTAG_ANNOTATION = 'UNTAG_ANNOTATION';
export const UNTAG_PICTURE = 'UNTAG_PICTURE';
export const DELETE_ANNOTATION_RATIO = 'DELETE_ANNOTATION_RATIO';
export const CREATE_ANNOTATION_RATIO = 'CREATE_ANNOTATION_RATIO';
export const CREATE_TAB = 'CREATE_TAB';
export const CLOSE_TAB = 'CLOSE_TAB';
export const DELETE_TAB = 'DELETE_TAB';
export const SELECT_FOLDER_GLOBALLY = 'SELECT_FOLDER_GLOBALLY';
export const SELECT_FOLDER = 'SELECT_FOLDER';
export const UNSELECT_FOLDER = 'UNSELECT_FOLDER';
export const UNSELECT_ALL_FOLDERS = 'UNSELECT_ALL_FOLDERS';
export const SAVE_SORTED_ARRAY = 'SAVE_SORTED_ARRAY';
export const ADD_SUB_TAG = 'ADD_SUB_TAG';
export const OPEN_IN_NEW_TAB = 'OPEN_IN_NEW_TAB';
export const MERGE_TAGS = 'MERGE_TAGS';
export const SAVE_TAGS_SORT = 'SAVE_TAGS_SORT';
export const SAVE_ANNOTATION_SORT = 'SAVE_ANNOTATION_SORT';
export const REFRESH_STATE = 'REFRESH_STATE';
export const PREPARE_FOLDER_FOR_DELETION = 'PREPARE_FOLDER_FOR_DELETION';
export const RENAME_TAB = 'RENAME_TAB';
export const EMPTY_TAGS = 'EMPTY_TAGS';
export const LOCK_SELECTION = 'LOCK_SELECTION';
export const SAVE_TAXONOMY = 'SAVE_TAXONOMY';
export const SAVE_IMAGE_DETECT_MODEL = 'SAVE_IMAGE_DETECT_MODEL';
export const EDIT_IMAGE_DETECT_MODEL = 'EDIT_IMAGE_DETECT_MODEL';
export const CHANGE_IMAGE_DETECT_MODEL_STATUS = 'CHANGE_IMAGE_DETECT_MODEL_STATUS';
export const IMPORT_TAXONOMY = 'IMPORT_TAXONOMY';
export const REMOVE_TAXONOMY = 'REMOVE_TAXONOMY';
export const REMOVE_IMAGE_DETECT_MODEL = 'REMOVE_IMAGE_DETECT_MODEL';
export const CHANGE_TAXONOMY_STATUS = 'CHANGE_TAXONOMY_STATUS';
export const SET_SELECTED_TAXONOMY = 'SET_SELECTED_TAXONOMY';
export const CREATE_EDIT_TAXONOMY_DESCRIPTION = 'CREATE_EDIT_TAXONOMY_DESCRIPTION';
export const CREATE_TARGET_DESCRIPTOR = 'CREATE_TARGET_DESCRIPTOR';
export const EDIT_TARGET_DESCRIPTOR = 'EDIT_TARGET_DESCRIPTOR';
export const DELETE_TARGET_DESCRIPTOR = 'DELETE_TARGET_DESCRIPTOR';
export const SAVE_TARGET_TYPE = 'SAVE_TARGET_TYPE';
export const SAVE_ALIGNMENT_OBJECT = 'SAVE_ALIGNMENT_OBJECT';
export const REMOVE_ALIGNMENT_OBJECT = 'REMOVE_ALIGNMENT_OBJECT';
export const CREATE_TARGET_INSTANCE = 'CREATE_TARGET_INSTANCE';
export const UPDATE_TAXONOMY_VALUES = 'UPDATE_TAXONOMY_VALUES';
export const CREATE_CATEGORICAL_TARGET_INSTANCE = 'CREATE_CATEGORICAL_TARGET_INSTANCE';
export const UPDATE_PICTURE_DATE = 'UPDATE_PICTURE_DATE';
export const CREATE_CARTEL = 'CREATE_CARTEL';
export const DELETE_CARTEL = 'DELETE_CARTEL';
export const EDIT_CARTEL = 'EDIT_CARTEL';
export const UPDATE_MOZAIC_TOGGLE = 'UPDATE_MOZAIC_TOGGLE';
export const UPDATE_TABULAR_VIEW = 'UPDATE_TABULAR_VIEW';
export const MOVE_FOLDER = 'MOVE_FOLDER';
export const RENAME_FOLDER = 'RENAME_FOLDER';
export const DELETE_PICTURE = 'DELETE_PICTURE';
export const SAVE_LEAFLET_SETTINGS = 'SAVE_LEAFLET_SETTINGS';
export const SET_STATE = 'SET_STATE';
export const STOP_ANNOTATION_RECORDING = 'STOP_ANNOTATION_RECORDING';
export const EDIT_CHRONOTHEMATIQUE_ANNOTATION_ENDTIME = 'EDIT_CHRONOTHEMATIQUE_ANNOTATION_ENDTIME';
export const SAVE_SELECTED_CATEGORY = 'SAVE_SELECTED_CATEGORY';
export const SAVE_SEARCH = 'SAVE_SEARCH';
export const CREATE_ANNOTATION_CIRCLE_OF_INTEREST = 'CREATE_ANNOTATION_CIRCLE_OF_INTEREST';
export const CREATE_ANNOTATION_POLYGON_OF_INTEREST = 'CREATE_ANNOTATION_POLYGON_OF_INTEREST';

export const createAnnotationChronoThematique = (videoId, start, end, duration, text, id) => {
    return {
        type: CREATE_ANNOTATION_CHRONOTHEMATIQUE,
        videoId,
        start,
        end,
        duration,
        text,
        id
    };
};

export const createEventAnnotation = (eventId, start, end, duration, text, id) => {
    return {
        type: CREATE_EVENT_ANNOTATION,
        eventId,
        start,
        end,
        duration,
        text,
        id
    };
};

export const createAnnotateEvent = (event) => {
    return {
        type: CREATE_ANNOTATE_EVENT,
        event
    };
};

export const deleteAnnotateEvent = (eventId) => {
    return {
        type: DELETE_ANNOTATE_EVENT,
        eventId
    };
};

export const createAnnotationMeasurePolyline = (pictureId, value_in_mm, vertices, id, type) => {
    return {
        type: type !== ANNOTATION_SIMPLELINE ? CREATE_ANNOTATION_MEASURE_POLYLINE : CREATE_ANNOTATION_MEASURE_SIMPLELINE,
        pictureId,
        value_in_mm,
        vertices,
        id
    };
};

export const createAnnotationPointOfInterest = (pictureId, x, y, id, video) => {
    return {
        type: CREATE_ANNOTATION_POINT_OF_INTEREST,
        pictureId,
        x,
        y,
        id,
        video
    };
};

export const createAnnotationRectangular = (pictureId, vertices, id, video) => {
    return {
        type: CREATE_ANNOTATION_RECTANGULAR,
        pictureId,
        vertices,
        id,
        video
    };
};

export const createAnnotationPolygon = (pictureId, vertices, area, id) => {
    return {
        type: CREATE_ANNOTATION_POLYGON,
        pictureId,
        vertices,
        area,
        id
    };
};

export const createAnnotationAngle = (pictureId, value_in_deg, vertices, id) => {
    return {
        type: CREATE_ANNOTATION_ANGLE,
        pictureId,
        value_in_deg,
        vertices,
        id
    };
};

export const createAnnotationOccurrence = (pictureId, vertices, id) => {
    return {
        type: CREATE_ANNOTATION_OCCURRENCE,
        pictureId,
        vertices,
        id
    };
};

export const createAnnotationColorPicker = (pictureId, value, x, y, id) => {
    return {
        type: CREATE_ANNOTATION_COLORPICKER,
        pictureId,
        value,
        x,
        y,
        id
    };
};

export const createAnnotationRatio = (pictureId, value1, value2, line1, line2, id) => {
    return {
        type: CREATE_ANNOTATION_RATIO,
        pictureId,
        value1,
        value2,
        line1,
        line2,
        id
    };
};

export const createAnnotationCategorical = (pictureId, vertices, id) => {
    return {
        type: CREATE_ANNOTATION_CATEGORICAL,
        pictureId,
        id,
        vertices
    };
};

export const createAnnotationTranscription = (pictureId, vertices, id) => {
    return {
        type: CREATE_ANNOTATION_TRANSCRIPTION,
        pictureId,
        vertices,
        id
    };
};

export const createAnnotationRichtext = (pictureId, vertices, id, value) => {
    return {
        type: CREATE_ANNOTATION_RICHTEXT,
        pictureId,
        vertices,
        id,
        value
    };
};

export const createTab = (view, name) => ({
    type: CREATE_TAB,
    view,
    name
});

export const closeTab = (name) => ({
    type: CLOSE_TAB,
    name
});

export const deleteTab = name => ({
    type: DELETE_TAB,
    name
});

export const flatOldTags = () => ({
    type: FLAT_OLD_TAGS
})

export const editCategory = (category) => ({
    type: EDIT_CATEGORY,
    category,
});

export const deleteCategory = (category) => ({
    type: DELETE_CATEGORY,
    category,
});

export const mergeTMTags = (targetId, item, parentId) => ({
    type: MERGE_TM_TAGS,
    targetId,
    item,
    parentId
});

export const addSubCategory = (parentName, item, isCategory, parentId) => ({
    type: ADD_SUB_CATEGORY,
    parentName,
    item,
    isCategory,
    parentId
});

export const createCategory = (category) => ({
    type: CREATE_CATEGORY,
    category
});

export const importTagModel = (newTags) => ({
    type: IMPORT_TAG_MODEL,
    newTags
})

export const addTagsId = () => ({
    type: ADD_TAGS_ID
})

export const createTag = (name, system) => ({
    type: CREATE_TAG,
    name,
    system
});


export const editCategoryById = (category, newName) => ({
    type: EDIT_CATEGORY_BY_ID,
    category,
    newName
});

export const editTagById = (tag, newName) => ({
    type: EDIT_TAG_BY_ID,
    tag,
    newName
});

export const editTag = (oldName, newName) => ({
    type: EDIT_TAG,
    oldName,
    newName
});

export const updateAnnotationValueInTaxonomyInstance = (annotations, taxonomyId, inPictureValues, sha1, descriptorId) => ({
    type: UPDATE_ANNOTATION_VALUE_IN_TAXONOMY_INSTANCE,
    annotations,
    taxonomyId,
    inPictureValues,
    sha1,
    descriptorId
})

export const deleteEventAnnotation = (eventId, annotationId) => ({
    type: DELETE_EVENT_ANNOTATION,
    eventId,
    annotationId
});

export const deleteAnnotationChronothematique = (videoId, annotationId) => ({
    type: DELETE_ANNOTATION_CHRONOTHEMATIQUE,
    videoId,
    annotationId
});

export const deleteAnnotationMeasureLinear = (pictureId, annotationId) => ({
    type: DELETE_ANNOTATION_MEASURE_LINEAR,
    pictureId,
    annotationId
});

export const deleteAnnotationPointOfInterest = (pictureId, annotationId) => ({
    type: DELETE_ANNOTATION_POINT_OF_INTEREST,
    pictureId,
    annotationId
});

export const deleteAnnotationRectangular = (pictureId, annotationId) => ({
    type: DELETE_ANNOTATION_RECTANGULAR,
    pictureId,
    annotationId
});

export const deleteAnnotationPolygon = (pictureId, annotationId) => ({
    type: DELETE_ANNOTATION_POLYGON,
    pictureId,
    annotationId
});

export const deleteAnnotationAngle = (pictureId, annotationId) => ({
    type: DELETE_ANNOTATION_ANGLE,
    pictureId,
    annotationId
});
export const deleteAnnotationOccurrence = (pictureId, annotationId) => ({
    type: DELETE_ANNOTATION_OCCURRENCE,
    pictureId,
    annotationId
});

export const deleteAnnotationCategorical = (pictureId, annotationId) => ({
    type: DELETE_ANNOTATION_CATEGORICAL,
    pictureId,
    annotationId
});

export const deleteAnnotationColorPicker = (pictureId, annotationId) => ({
    type: DELETE_ANNOTATION_COLORPICKER,
    pictureId,
    annotationId
});

export const deleteAnnotationRatio = (pictureId, annotationId) => ({
    type: DELETE_ANNOTATION_RATIO,
    pictureId,
    annotationId
});

export const deleteAnnotationTranscription = (pictureId, annotationId) => ({
    type: DELETE_ANNOTATION_TRANSCRIPTION,
    pictureId,
    annotationId
});

export const deleteAnnotationRichtext = (pictureId, annotationId) => ({
    type: DELETE_ANNOTATION_RICHTEXT,
    pictureId,
    annotationId
});

export const deleteAnnotationCircleOfInterest = (pictureId, annotationId) => ({
    type: DELETE_ANNOTATION_CIRCLE_OF_INTEREST,
    pictureId,
    annotationId
});

export const deleteAnnotationPolygonOfInterest = (pictureId, annotationId) => ({
    type: DELETE_ANNOTATION_POLYGON_OF_INTEREST,
    pictureId,
    annotationId
});

export const deleteTag = name => ({
    type: DELETE_TAG,
    name
});

export const editAnnotation = (pictureId, annotationType, annotationId, title, text, coverage, annotationData) => ({
    type: EDIT_ANNOTATION,
    annotationId,
    annotationType,
    pictureId,
    text,
    title,
    coverage,
    annotationData
});

export const extendEventDuration = (eventId, duration) => ({
    type: EXTEND_EVENT_DURATION,
    eventId,
    duration
});

export const saveEventAfterRecord = (event) => ({
    type: SAVE_EVENT_AFTER_RECORD,
    event
});

export const finishCorruptedEvent = (eventId) => ({
    type: FINISH_CORRUPTED_EVENT,
    eventId
})

export const editEvent = (eventId, annotateEvent) => ({
    type: EDIT_ANNOTATE_EVENT,
    eventId,
    annotateEvent
});

export const editEventAnnotationEndtime = (eventId, annotationId, endTime) => ({
    type: EDIT_EVENT_ANNOTATION_ENDTIME,
    eventId,
    annotationId,
    endTime
})

export const editAnnotationChronothematiqueEndtime = (pictureId, annotationId, endTime) => ({
    type: EDIT_CHRONOTHEMATIQUE_ANNOTATION_ENDTIME,
    pictureId,
    annotationId,
    endTime
});

export const firstPictureInSelection = (tabName) => ({
    type: FIRST_PICTURE_IN_SELECTION,
    tabName
});

export const unfocusAnnotation = () => ({
    type: UNFOCUS_ANNOTATION,
});

export const focusAnnotation = (annotationId, annotationType, pictureId, ratioLine1, ratioLine2) => ({
    type: FOCUS_ANNOTATION,
    annotationId,
    annotationType,
    pictureId,
    ratioLine1,
    ratioLine2
});

export const lastPictureInSelection = (tabName) => ({
    type: LAST_PICTURE_IN_SELECTION,
    tabName
});

export const movePictureInPicturesSelection = (indexFrom, indexTo) => ({
    type: MOVE_PICTURE_IN_PICTURES_SELECTION,
    indexFrom,
    indexTo
});

export const nextPictureInSelection = (tabName) => ({
    type: NEXT_PICTURE_IN_SELECTION,
    tabName
});

export const nextTenPictureInSelection = (tabName) => ({
    type: NEXT_TEN_PICTURE_IN_SELECTION,
    tabName
});

export const previousPictureInSelection = (tabName) => ({
    type: PREVIOUS_PICTURE_IN_SELECTION,
    tabName
});

export const previousTenPictureInSelection = (tabName) => ({
    type: PREVIOUS_TEN_PICTURE_IN_SELECTION,
    tabName
});

export const selectTag = (name, skipCheck, tabName) => ({
    type: SELECT_TAG,
    name,
    skipCheck,
    tabName
});

export const addTagInFilter = (name, skipCheck, tabName) => ({
    type: ADD_TAG_IN_FILTER,
    name,
    skipCheck,
    tabName
});

export const deleteTagFilter = (tabName) => ({
    type: DELETE_TAG_FILTER,
    tabName
});

export const createTagExpression = (tabName) => ({
    type: CREATE_TAG_EXPRESSION,
    tabName
});

export const deleteTagExpression = (id, tabName) => ({
    type: DELETE_TAG_EXPRESSION,
    id,
    tabName
});

export const updateTagExpressionOperator = (id, value, tabName) => ({
    type: UPDATE_TAG_EXPRESSION_OPERATOR,
    id,
    value,
    tabName
});

export const refreshState = (picturesObject) => ({
    type: REFRESH_STATE,
    picturesObject
});

export const setPictureInSelection = (pictureId, tabName) => ({
    type: SET_PICTURE_IN_SELECTION,
    pictureId,
    tabName
});

export const untagEventAnnotation = (annotationId, tagName, inputGroup, eventId) => ({
    type: UNTAG_EVENT_ANNOTATION,
    annotationId,
    tagName,
    inputGroup,
    eventId,
});

export const tagEventAnnotation = (annotationId, tag, inputGroup, eventId) => ({
    type: TAG_EVENT_ANNOTATION,
    annotationId,
    tag,
    inputGroup,
    eventId,
});

export const tagAnnotation = (annotationId, tagName) => ({
    type: TAG_ANNOTATION,
    annotationId,
    tagName
});

export const tagPicture = (pictureId, tagName) => ({
    type: TAG_PICTURE,
    pictureId,
    tagName
});

export const unselectTag = (name, tabName) => ({
    type: UNSELECT_TAG,
    name,
    tabName
});

export const prepareFolderForDeletion = (path) => ({
    type: PREPARE_FOLDER_FOR_DELETION,
    path,
});

export const untagAnnotation = (annotationId, tagName) => ({
    type: UNTAG_ANNOTATION,
    annotationId,
    tagName
});

export const untagPicture = (pictureId, tagName) => ({
    type: UNTAG_PICTURE,
    pictureId,
    tagName
});

export const addSubTag = (addTo, tag) => ({
    type: ADD_SUB_TAG,
    addTo,
    tag
});

export const openInNewTab = (name) => ({
    type: OPEN_IN_NEW_TAB,
    name
});

export const saveTagSort = (tabName, direction) => ({
    type: SAVE_TAGS_SORT,
    tabName,
    direction
});

export const mergeTags = (target, source) => ({
    type: MERGE_TAGS,
    target,
    source
});

export const saveSortedArray = (tabName, sortedArray, sortBy, sortDirection) => ({
    type: SAVE_SORTED_ARRAY,
    tabName,
    sortedArray,
    sortBy,
    sortDirection
});

export const selectMenu = (menu) => ({
    type: SELECT_MENU,
    menu
});
export const selectLibraryTab = (tab, libraryTab) => ({
    type: SELECT_LIBRARY_TAB,
    tab,
    libraryTab,
});

export const selectFolder = (tab, path) => ({
    type: SELECT_FOLDER,
    tab,
    path
});

export const unselectFolder = (tab, path) => ({
    type: UNSELECT_FOLDER,
    tab,
    path
});

export const unselectAllFolders = (tab) => ({
    type: UNSELECT_ALL_FOLDERS,
    tab
});

export const saveAnnotationSort = (tabName, direction) => ({
    type: SAVE_ANNOTATION_SORT,
    tabName,
    direction
});

export const selectFolderGlobally = (path) => ({
    type: SELECT_FOLDER_GLOBALLY,
    path
});
export const renameTab = (oldName, newName) => ({
    type: RENAME_TAB,
    oldName,
    newName
});
export const emptyTagsList = () => ({
    type: EMPTY_TAGS
});
export const lockSelection = (enabled, tabName, order) => ({
    type: LOCK_SELECTION,
    enabled,
    tabName,
    order
});

export const saveTaxonomy = (id, name, path, model, version) => ({
    type: SAVE_TAXONOMY,
    id, name, path, model, version
});

export const saveImageDetectModel = (id, name, model, version, url_service, user, password, description, confidence, modelClasses) => ({
    type: SAVE_IMAGE_DETECT_MODEL,
    id, name, model, version, url_service, user, password, description, confidence, modelClasses
});

// export const editImageDetectModel = (id, name, model, version, url_service, user, password, description, confidence, modelClasses) => ({
//     type: EDIT_IMAGE_DETECT_MODEL,
//     id, name, model, version, url_service, user, password, description, confidence, modelClasses
// });

export const editImageDetectModel = (payload) => ({
    type: EDIT_IMAGE_DETECT_MODEL,
    payload
});
export const updateImageDetectModelStatus = (id, isActive, model) => ({
    type: CHANGE_IMAGE_DETECT_MODEL_STATUS,
    id,
    isActive,
    model
});

export const importTaxonomy = (id, name, path, version, taxonomyDefinition, targetTypes) => ({
    type: IMPORT_TAXONOMY,
    id, name, path, version, taxonomyDefinition, targetTypes
});

export const removeTaxonomy = (id) => ({
    type: REMOVE_TAXONOMY,
    id
});

export const removeImageDetectModel = (id) => ({
    type: REMOVE_IMAGE_DETECT_MODEL,
    id
});

export const updateTaxonomiesStatus = (id, isActive, model) => ({
    type: CHANGE_TAXONOMY_STATUS,
    id,
    isActive,
    model
});

export const setSelectedTaxonomy = (id) => ({
    type: SET_SELECTED_TAXONOMY,
    id
});

export const createTargetDescriptor = (taxonomyId, id, targetName, targetType, targetColor, unit, annotationType, includeInCalculation, states) => ({
    type: CREATE_TARGET_DESCRIPTOR,
    taxonomyId, id, targetName, targetType, targetColor, unit, annotationType, includeInCalculation, states
});

export const editTargetDescriptor = (taxonomyId, id, targetName, targetType, targetColor, unit, annotationType, includeInCalculation, states) => ({
    type: EDIT_TARGET_DESCRIPTOR,
    taxonomyId, id, targetName, targetType, targetColor, unit, annotationType, includeInCalculation, states
});

export const deleteTargetDescriptor = (taxonomyId, id) => ({
    type: DELETE_TARGET_DESCRIPTOR,
    taxonomyId, id
});

export const saveTargetType = (taxonomyId, name) => ({
    type: SAVE_TARGET_TYPE,
    taxonomyId,
    name
});

export const saveAlignmentObject = (taxonomyId, imageDetectModelId, alignmentObject) => ({
    type: SAVE_ALIGNMENT_OBJECT,
    taxonomyId,
    imageDetectModelId,
    alignmentObject
});

export const removeAlignmentObject = (taxonomyId, imageDetectModelId, alignmentObject) => ({
    type: REMOVE_ALIGNMENT_OBJECT,
    taxonomyId,
    imageDetectModelId,
    alignmentObject
});

export const deleteTargetType = (taxonomyId, name) => ({
    type: DELETE_TARGET_TYPE,
    taxonomyId,
    name
});

export const editTargetType = (taxonomyId, name, newName) => ({
    type: EDIT_TARGET_TYPE,
    taxonomyId,
    name,
    newName
});

export const createTargetInstance = (ofType, tabName, annotationId, descriptorId, value, oldDescriptorId) => ({
    type: ofType === NUMERICAL ? CREATE_TARGET_INSTANCE : CREATE_CATEGORICAL_TARGET_INSTANCE,
    tabName, annotationId, descriptorId, value, ofType, oldDescriptorId
});

export const updateTaxonomyValues = (tabName) => ({
    type: UPDATE_TAXONOMY_VALUES,
    tabName
});

export const createCartel = (pictureId, id, value) => ({
    type: CREATE_CARTEL,
    pictureId, id, value
});

export const editCartel = (pictureId, id, value) => ({
    type: EDIT_CARTEL,
    pictureId, id, value
});

export const deleteCartel = (pictureId, id) => ({
    type: DELETE_CARTEL,
    pictureId,
    id
});

export const updatePictureDate = (sha1, date, exifPlace, placeName, coverage) => ({
    type: UPDATE_PICTURE_DATE,
    sha1,
    date,
    exifPlace,
    placeName,
    coverage
});

export const updateMozaicToggle = (tabName, showMozaicCollection, showMozaicDetails) => ({
    type: UPDATE_MOZAIC_TOGGLE,
    tabName, showMozaicCollection, showMozaicDetails
});

export const updateTabularView = (tabName, activeTab) => ({
    type: UPDATE_TABULAR_VIEW,
    tabName, activeTab
});
export const moveFolder = (moveTo, folder) => ({
    type: MOVE_FOLDER,
    moveTo, folder
});

export const renameFolder = (newName, path) => ({
    type: RENAME_FOLDER,
    newName, path
});

export const deletePicture = sha1 => ({
    type: DELETE_PICTURE,
    sha1
});

export const saveLeafletSettings = repeatMode => ({
    type: SAVE_LEAFLET_SETTINGS,
    repeatMode
});

export const setNewState = newApp => ({
    type: SET_STATE,
    newApp
});

export const saveAnnotationEndTime = (annType, annId, endTime, pictureId) => ({
    type: STOP_ANNOTATION_RECORDING,
    annType, annId, endTime, pictureId
});

export const saveSelectedCategory = (selectedCategory, selectedCategories) => ({
    type: SAVE_SELECTED_CATEGORY,
    selectedCategory, selectedCategories
});

export const saveSearch = (search, searchResults) => ({
    type: SAVE_SEARCH,
    search, searchResults
});

export const createAnnotationCircleOfInterest = (pictureId, x, y, r, id) => ({
    type: CREATE_ANNOTATION_CIRCLE_OF_INTEREST,
    pictureId,
    x, y, r,
    id
});

export const createAnnotationPolygonOfInterest = (pictureId, vertices, id) => ({
    type: CREATE_ANNOTATION_POLYGON_OF_INTEREST,
    pictureId,
    vertices,
    id
});
