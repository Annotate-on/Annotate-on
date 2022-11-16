import {connect} from 'react-redux';
import {push} from 'connected-react-router';
import {
    setPictureInSelection,
} from '../actions/app';
import Component from '../components/event/EventHome';
import {ee, EVENT_SELECT_TAB} from "../utils/library";

const mapStateToProps = (state, ownProps) => {
    return {
        allPictures: state.app.pictures,
        picturesByTag: state.app.pictures_by_tag,
        tags: state.app.tags,
        tagsByPicture: state.app.tags_by_picture,
        tabData: state.app.open_tabs,
        selectedTaxonomy: state.app.selectedTaxonomy,
        projectName: state.app.selectedProjectName
    };
};

const mapDispatchToProps = dispatch => {
    return {
        setPictureInSelection: (pictureId, tabName) => {
            dispatch(setPictureInSelection(pictureId, tabName));
        },
        goToLibrary: () => {
            dispatch(push('/selection'));
            setTimeout(() => {
                ee.emit(EVENT_SELECT_TAB, 'library')
            }, 100)
        },
        goToImage: () => {
            dispatch(push('/image'));
            setTimeout(() => {
                ee.emit(EVENT_SELECT_TAB, 'image')
            }, 100)
        },
    };
};

export default connect(mapStateToProps, mapDispatchToProps)(Component);
