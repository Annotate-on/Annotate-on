import {connect} from 'react-redux';
import {push} from "connected-react-router";
import Component from "../components/XmpMetadata";

const mapStateToProps = (state, ownProps) => {
    return {
        pictures: state.app.pictures,
        allPictures: state.app.pictures,
        tabData: state.app.open_tabs,
        cartels: state.app.cartel_by_picture
    }
};
    const mapDispatchToProps = dispatch => {
        return {
            goToCollectionExport: (tabName) => {
                dispatch(push(`/collection-export/${tabName}`));
            },
        };
    };

export default connect(mapStateToProps, mapDispatchToProps)(Component);