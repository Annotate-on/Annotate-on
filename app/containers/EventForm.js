import {
    createAnnotateEvent,
    editEvent,
    refreshState,
    selectFolderGlobally, setPictureInSelection,
} from "../actions/app";
import {connect} from "react-redux";
import Component from "../components/event/EventForm";
import {push} from "connected-react-router";
import {ee, EVENT_SELECT_TAB} from "../utils/library";

const mapStateToProps = (state) => {
    return {
        allPictures: state.app.pictures
    };
};

const mapDispatchToProps = dispatch => {
    return {
        editEvent: (eventId , name) => {
            dispatch(editEvent(eventId , name));
        },
        goToLoading: () => {
            dispatch(push('/loading'));
        },
        goToImport: (selectedFolder) => {
            dispatch(push('/import/' + selectedFolder));
        },
        refreshState: (picturesObject) => {
            dispatch(refreshState(picturesObject));
        },
        selectFolderGlobally: (path) => {
            dispatch(selectFolderGlobally(path));
        },
        goToLibrary: () => {
            dispatch(push('/selection'));
            setTimeout(() => {
                ee.emit(EVENT_SELECT_TAB, 'library')
            }, 100)
        },
        createAnnotateEvent: (event) => {
            dispatch(createAnnotateEvent(event))
        },
        setPictureInSelection: (pictureId, tabName) => {
            dispatch(setPictureInSelection(pictureId, tabName));
        },
    };
};

export default connect(mapStateToProps, mapDispatchToProps)(Component);