import {connect} from 'react-redux';
import {push} from "connected-react-router";
import Component from "../components/event/EventAnnotations";
import {withTranslation} from "react-i18next";

const mapStateToProps = (state, ownProps) => {
    return {
        annotations_eventAnnotations: state.app.annotations_eventAnnotations,
        tagsByAnnotation: state.app.tags_by_annotation,
        pictures: state.app.pictures,
        tabData: state.app.open_tabs
    }
};
const mapDispatchToProps = dispatch => {
    return {
    };
};

export default withTranslation()(connect(mapStateToProps, mapDispatchToProps)(Component));
