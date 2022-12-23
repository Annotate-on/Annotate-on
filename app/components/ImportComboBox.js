import React, {Fragment, Component} from 'react';
import i18next from "i18next";
import {Dropdown, DropdownItem, DropdownMenu, DropdownToggle, Row} from "reactstrap";
import {getAllPicturesDirectories} from "../utils/config";

const IMAGE = require('./pictures/image.svg');
const VIDEO = require('./pictures/box.svg');
const EVENT = require('./pictures/event.svg');

export default class extends Component {

    constructor(props) {
        super(props);
        this.state = {
            importMenuOpen: false
        };
    }

    _toggleImportMenu = () => {
        this.setState({
            importMenuOpen: !this.state.importMenuOpen
        });
    }

    _onImportImagesClick = (e) => {
        console.log("_onImportImagesClick")
        const folders = getAllPicturesDirectories();
        this.props.goToImportWizard(folders.length ? folders[0].path : null);
    }
    _onImportVideosClick = (e) => {
        console.log("_onImportVideosClick")
        const folders = getAllPicturesDirectories();
        this.props.goToImportVideoWizard(folders.length ? folders[0].path : null);
    }

    _onCreateNewEventClick = (e) => {
        console.log("_onCreateNewEventClick")
        const folders = getAllPicturesDirectories();
        this.props.goToImportEventWizard(folders.length ? folders[0].path : null , null);
    }

    render() {
        const { t } = i18next;
        return (
            <div className="bst">
                <Dropdown isOpen={this.state.importMenuOpen} toggle={this._toggleImportMenu} className="import-menu">
                    <DropdownToggle tag="div" >
                        <span>Import</span>
                        <i className={this.state.importMenuOpen ? 'fa fa-chevron-up' : 'fa fa-chevron-down'}></i>
                    </DropdownToggle>
                    <DropdownMenu >
                        <DropdownItem onClick={this._onImportImagesClick}>
                            <img className="import-menu-item" src={IMAGE}/> Image(s)
                        </DropdownItem>
                        <DropdownItem onClick={this._onImportVideosClick}>
                            <img className="import-menu-item" src={VIDEO}/>Video(s)
                        </DropdownItem>
                        <DropdownItem onClick={this._onCreateNewEventClick}>
                            <img className="import-menu-item" src={EVENT}/>Create event
                        </DropdownItem>
                    </DropdownMenu>
                </Dropdown>
            </div>
        )
    }
}
