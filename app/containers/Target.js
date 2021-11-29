import {connect} from 'react-redux';

import Component from '../components/Target';

const mapStateToProps = (state, ownProps) => {
    let taxonomyInstance = {};
    if (state.app.selectedTaxonomy) {
        taxonomyInstance = state.app.taxonomyInstance[state.app.selectedTaxonomy.id];
    }
    return {
        pictures: state.app.pictures,
        selectedTaxonomy: state.app.selectedTaxonomy,
        tab: state.app.open_tabs[ownProps.tabName],
        taxonomyInstance,
        taxonomies: state.app.taxonomies
    };
};

const mapDispatchToProps = dispatch => {
    return {};
};

export default connect(mapStateToProps, mapDispatchToProps)(Component);
