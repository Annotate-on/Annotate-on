import React, {Component} from 'react';
import i18next from "i18next";

export default class FoldersFilter extends Component {

    constructor(props) {
        super(props);
        this.state = {
        };
    }

    componentDidMount() {
    }

    componentDidUpdate() {
    }

    render() {
        const {t} = i18next;
        const numberOfFolders = this.props.selected + '/' + this.props.total;
        return (
            (this.props.selected > 0) ?
                <div className="folders-filter">
                    <div className="folders-filter-header">
                        <i className="fa fa-filter"></i>
                        <span className="folders-filter-label">{t('folders.lbl_filter')}</span>
                        <i className="fa fa-times btn-remove-filter" title={t('folders.btn_tooltip_cancel_folders_filter')} onClick={
                            (e) => {
                                this.props.onCancelFilter()
                            }
                        }/>
                    </div>
                    <div className="folders-filter-content">
                        <div>{t('folders.lbl_filters_selected', {numberOfFolders: numberOfFolders})}</div>
                    </div>
                </div>
                :
                <div></div>
        );
    }

}
