import {connect} from 'react-redux';
import {push} from 'connected-react-router';
import lodash from 'lodash';
import { withTranslation } from 'react-i18next';


import {
    deleteAnnotateEvent,
    deletePicture,
    saveSortedArray,
    selectFolderGlobally,
    setPictureInSelection,
    tagPicture
} from '../actions/app';
import Component from '../components/Library';
import {SortDirection} from "react-virtualized";
import {ee, EVENT_SELECT_TAB} from "../utils/library";

const mapStateToProps = (state, ownProps) => {

    let sortBy = state.app.open_tabs[ownProps.tabName].sort_table_by;
    if (sortBy === undefined) {
        sortBy = {
            field: "",
            direction: SortDirection.ASC
        };
    }

    return {
        allPictures: state.app.pictures,
        annotationsEventAnnotations: state.app.annotations_eventAnnotations,
        annotationsChronothematique: state.app.annotations_chronothematique,
        annotationsMeasuresLinear: state.app.annotations_measures_linear,
        annotationsRectangular: state.app.annotations_rectangular,
        annotationsPointsOfInterest: state.app.annotations_points_of_interest,
        annotationsPolygon: state.app.annotations_polygon,
        annotationsAngle: state.app.annotations_angle,
        annotationsOccurrence: state.app.annotations_occurrence,
        annotationsColorPicker: state.app.annotations_color_picker,
        annotationsRatio: state.app.annotations_ratio,
        annotationsTranscription: state.app.annotations_transcription,
        annotationsCategorical: state.app.annotations_categorical,
        annotationsRichtext: state.app.annotations_richtext,
        picturesByTag: state.app.pictures_by_tag,
        selectedTags: state.app.open_tabs[ownProps.tabName].selected_tags,
        tags: state.app.tags,
        tagsByPicture: state.app.tags_by_picture,
        tagsSelectionMode: state.app.tags_selection_mode,
        sortBy,
        annotationsByTag: state.app.annotations_by_tag,
        annotations: lodash.flatten([...Object.values(state.app.annotations_measures_linear),
            ...Object.values(state.app.annotations_rectangular),
            ...Object.values(state.app.annotations_points_of_interest),
            ...Object.values(state.app.annotations_polygon),
            ...Object.values(state.app.annotations_angle),
            ...Object.values(state.app.annotations_color_picker),
            ...Object.values(state.app.annotations_occurrence),
            ...Object.values(state.app.annotations_transcription),
            ...Object.values(state.app.annotations_categorical),
            ...Object.values(state.app.annotations_richtext)
        ]),
        tagsByAnnotation: state.app.tags_by_annotation,
        tabData: state.app.open_tabs,
        // currentPictureIndexInSelection: state.app.current_picture_index_in_selection
        currentPictureIndexInSelection: state.app.open_tabs[ownProps.tabName].current_picture_index_in_selection,
        selectedTaxonomy: state.app.selectedTaxonomy,
        manuallySorted: state.app.open_tabs[ownProps.tabName].order,
        projectName: state.app.selectedProjectName
    };
};

const mapDispatchToProps = dispatch => {
    return {
        setPictureInSelection: (pictureId, tabName) => {
            dispatch(setPictureInSelection(pictureId, tabName));
        },
        tagPicture: (pictureId, tagName) => {
            dispatch(tagPicture(pictureId, tagName));
        },
        goToImage: () => {
            dispatch(push('/image'));
        },
        saveSortedArray: (tabName, sortedArray, sortBy, sortDirection) => {
            dispatch(saveSortedArray(tabName, sortedArray, sortBy, sortDirection));
        },
        deletePicture: (sha1) => {
            dispatch(deletePicture(sha1));
        },
        selectFolderGlobally: (path) => {
            dispatch(selectFolderGlobally(path));
        },
        goToImportWizard: (selectedFolder) => {
            dispatch(push('/importwizard/' + selectedFolder));
        },
        refreshLibrary: () => {
            dispatch(push('/selection'));
            setTimeout(() => {
                ee.emit(EVENT_SELECT_TAB, 'library')
            }, 100)
        },
        goToImportVideoWizard: (selectedFolder) => {
            dispatch(push('/importVideoWizard/' + selectedFolder));
        },
        goToImportEventWizard: (selectedFolder , tabName) => {
            dispatch(push('/importEventWizard/' + selectedFolder + '/' + tabName));
        },
        deleteAnnotateEvent: (eventId) => {
            dispatch(deleteAnnotateEvent(eventId));
        }
    };
};

export default withTranslation()(connect(mapStateToProps, mapDispatchToProps)(Component));
