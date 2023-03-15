import {push} from "connected-react-router";
import {EVENT_SELECT_SELECTION_TAB, ee, EVENT_SELECT_TAB} from "../utils/library";
import {withTranslation} from "react-i18next";
import {connect} from "react-redux";
import Search from "../components/Search";
import lodash from "lodash";
import {createTab, saveSearch, selectLibraryTab, setPictureInSelection} from "../actions/app";

const mapStateToProps = state => {
    return {
        projectName: state.app.selectedProjectName,
        annotations: lodash.flatten([
            ...Object.values(state.app.annotations_measures_linear),
            ...Object.values(state.app.annotations_rectangular),
            ...Object.values(state.app.annotations_points_of_interest),
            ...Object.values(state.app.annotations_color_picker),
            ...Object.values(state.app.annotations_polygon),
            ...Object.values(state.app.annotations_angle),
            ...Object.values(state.app.annotations_occurrence),
            ...Object.values(state.app.annotations_categorical),
            ...Object.values(state.app.annotations_transcription),
            ...Object.values(state.app.annotations_richtext),
            ...Object.values(state.app.annotations_eventAnnotations),
            ...Object.values(state.app.annotations_chronothematique),
            ...Object.values(state.app.annotations_ratio),
        ]),
        selectedTaxonomy: state.app.selectedTaxonomy,
        taxonomyInstance: state.app.taxonomyInstance,
        pictures: state.app.pictures,
        openTabs: state.app.open_tabs,
        searchText: state.app.searchText,
        searchResults: state.app.searchResults
    };
};

const mapDispatchToProps = dispatch => {
    return {
        goToLibrary: () => {
            dispatch(push('/selection'));
            setTimeout(() => {
                ee.emit(EVENT_SELECT_TAB, 'library')
            }, 100)
        },
        setPictureInSelection: (pictureId, tabName) => {
            dispatch(setPictureInSelection(pictureId, tabName));
        },
        createTab: (name) => {
            dispatch(createTab('library', name));
        },
        setSelectedLibraryTab: (tab, libraryTab) => {
            dispatch(selectLibraryTab(tab, libraryTab))
        },
        saveSearch: (searchText, searchResults) => {
            dispatch(saveSearch(searchText, searchResults))
        },
    };
};

export default withTranslation()(connect(mapStateToProps, mapDispatchToProps)(Search));
