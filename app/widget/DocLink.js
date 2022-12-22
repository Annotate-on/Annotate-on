import React, {PureComponent} from 'react';
import {shell} from "electron";
import {DOCUMENTATION_LANG_PREFIX, DOCUMENTATION_URL} from "../settings";
import i18next from "i18next";

const CIRCLE_QUESTION_REGULAR = require('../../app/components/pictures/circle-question-regular.svg');

export default class DocLink extends PureComponent {

    constructor(props) {
        super(props);
    }

    _openDokLink = () => {
        let link = `${DOCUMENTATION_URL}/${DOCUMENTATION_LANG_PREFIX}${i18next.language}/${this.props.permalink}`;
                console.log("Open link " + link);
        shell.openExternal(link);
    }

    render() {
        const {t} = i18next;
        return (
            <>
            <span className="doc-link-container"
                onClick={this._openDokLink}>
                <img className="doc-link"
                     alt="add annotation"
                     src={CIRCLE_QUESTION_REGULAR}
                     title={t('global.doc_link_title', {section : this.props.permalink})}
                />
            </span>
            </>
        );
    }
}
