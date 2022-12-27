import React, {Component} from 'react';
import i18next from "i18next";
import styled from "styled-components";
import {Button, Col, Row} from "reactstrap";
import {ee, EVENT_SELECT_LIBRARY_TAB} from "../utils/library";

export default class LibraryTabs extends Component {
    constructor(props, context) {
        super(props, context);
        this.state = {
        }
    }

    render() {
        const {t} = i18next;
        return (
            <div className="library-tabs-container">
                    <div className="library-tabs">
                        <Button title={t('main_navbar.tooltip_resources')}
                                color={(!this.props.selectedTab || this.props.selectedTab === 'library') ? "primary" : "default"}
                                className="library-tabs-button"
                                onClick={() => {
                                    ee.emit(EVENT_SELECT_LIBRARY_TAB, 'library')
                                }}>
                            <div className="library-tabs-button-icon">
                                <i className="fa fa-image" aria-hidden="true"/>
                            </div>
                            <div className="library-tabs-button-content">
                                <div className="library-tabs-button-title">{t('main_navbar.resources')}</div>
                            </div>
                            <div className="library-tabs-button-content">
                                <div className="library-tabs-button-nb-resources">{this.props.numberOfResources}</div>
                            </div>
                        </Button>
                        <Button title={t('main_navbar.tooltip_annotate')}
                                color={this.props.selectedTab === 'image' ? "primary" : "default"}
                                className="library-tabs-button"
                                onClick={() => {
                                    ee.emit(EVENT_SELECT_LIBRARY_TAB, 'image')
                                }}>
                            <div className="library-tabs-button-icon">
                                <i className="fa fa-edit " aria-hidden="true"/>
                            </div>
                            <div className="library-tabs-button-content">
                                <div className="library-tabs-button-title">{t('main_navbar.annotate')}</div>
                            </div>
                        </Button>
                        <Button title={t('main_navbar.tooltip_results')}
                            color={this.props.selectedTab === 'data' ? "primary": "default"}
                            className="library-tabs-button"
                            onClick={() => {
                            ee.emit(EVENT_SELECT_LIBRARY_TAB, 'data');
                        }}>
                            <div className="library-tabs-button-icon">
                                <i className="fa fa-table " aria-hidden="true"/>
                            </div>
                            <div className="library-tabs-button-content">
                                <div className="library-tabs-button-title">{t('main_navbar.results')}</div>
                            </div>
                        </Button>
                    </div>
            </div>
        );
    }
}
