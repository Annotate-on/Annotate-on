import {connect} from 'react-redux';
import {push} from "connected-react-router";
import Component from "../components/ChronoThematicAnnotations";

const mapStateToProps = (state) => {
    return {
        annotationsChronothematique: state.app.annotations_chronothematique,
        tagsByAnnotation: state.app.tags_by_annotation,
        pictures: state.app.pictures,
        tabData: state.app.open_tabs
    }
};

export default connect(mapStateToProps, null)(Component);