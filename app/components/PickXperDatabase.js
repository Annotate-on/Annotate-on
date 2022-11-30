import React, {Component} from 'react';
import {Button, Col, Input, Modal, ModalBody, ModalFooter, ModalHeader, Row, Table} from "reactstrap";
import styled from "styled-components";
import TableHeader from "./TableHeader";
import {ContextMenuTrigger} from "react-contextmenu";
import lodash from "lodash";
import {getXperParams} from "../utils/config";
import {remote} from "electron";
import request from "request";
import i18next from "i18next";

const _TablePlaceholder = styled.div`
    height: 650px;
    position: relative;
`;

export default class extends Component {

    constructor(props) {
        super(props);
        const sortBy = 'name';
        const sortDirection = 'ASC';
        this.state = {
            openModal: props.openModal,
            sortBy,
            sortDirection,
            bases: []
        };
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if (prevProps.openModal !== this.props.openModal)
            this.setState({
                openModal: this.props.openModal
            });
    }

    componentDidMount() {
        this._handleImportFromXperDatabase(this._onXperDatabaseResponse);
    }

    _handleImportFromXperDatabase = (callback) => {
        const {t} = i18next;
        let xperParams = getXperParams();
        // console.log("_exportDataToSdd", xperParams);
        const hasParams = xperParams && xperParams.url && xperParams.email && xperParams.password;
        if(!hasParams) {
            remote.dialog.showErrorBox(t('global.error'), t('global.xper_params_are_required'));
            return;
        }
        let url = xperParams.url + '/list_bases_for_user';
        let username = xperParams.email;
        let password = xperParams.password;

        let auth = 'Basic ' + btoa(username + ":" + password);
        request({
                url : url,
                headers : {
                    "Authorization" : auth
                }},
            function (error, response, body) {
                let result = JSON.parse(body)
                console.log("result ", result);
                let found = []
                if(result) {
                    for (const resultElement of result) {
                        let database = {}
                        database.name = resultElement.datasetName;
                        database.kbName = resultElement.kbName;
                        if(resultElement["0"] && resultElement["0"].length > 0) {
                            let owners = [];
                            for (const ownerItem of resultElement["0"]) {
                                owners.push(ownerItem[0]);
                            }
                            database.owners = owners.join(', ');
                        }
                        if(resultElement["1"] && resultElement["1"].length > 0) {
                            let editors = [];
                            for (const editorItem of resultElement["1"]) {
                                editors.push(editorItem[0]);
                            }
                            database.editors = editors.join(', ');
                        }
                        if(resultElement["2"] && resultElement["2"].length > 0) {
                            let viewers = [];
                            for (const viewerItem of resultElement["2"]) {
                                viewers.push(viewerItem[0]);
                            }
                            database.viewers = viewers.join(', ');
                        }
                        found.push(database);
                    }
                    console.log("found ", found);
                }
                callback(found);
            }
        );
    }

    _onXperDatabaseResponse = (result) => {
        const sortBy = 'name';
        const sortDirection = 'ASC';
        const sortedProjects = this._sortList(sortBy, sortDirection, result);
        console.log("_onXperDatabaseResponse sortedProjects", sortedProjects);
        this.setState({
            sortBy,
            sortDirection,
            bases:sortedProjects
        });
    }

    _sort = (sortBy, sortDirection) => {
        const bases = this._sortList(sortBy, sortDirection);
        this.setState({sortBy, sortDirection, bases});
    };

    _sortList = (sortBy, sortDirection, initList) => {
        const list = initList || this.state.bases;
        const sorted = lodash.sortBy(list, _ => (typeof _[sortBy] === 'string' ? _[sortBy].toLowerCase() : _[sortBy]));
        return sortDirection === 'DESC' ? lodash.reverse(sorted) : sorted;
    }

    render() {
        const {t} = i18next;
        return (
            <div>
                <Modal isOpen={this.state.openModal} className="myCustomModal" toggle={this._toggle} contentClassName="custom-modal-style" wrapClassName="bst rcn_xper pick-tag"
                       scrollable={false}
                       autoFocus={false}>
                    <ModalHeader toggle={this._toggle}>
                        {t('models.import_from_xper.dialog_pick_xper_database_title')}
                    </ModalHeader>
                    <ModalBody>
                        <_TablePlaceholder>
                            <Row className="content-table1">
                                <Col md={{size: 12, offset: 0}}>
                                    <div className="table-wrapper" id="wrapper" ref={_ => (this.pane = _)}>
                                        <Table hover size="sm" className="targets-table">
                                            <thead title={t('models.thead_tooltip_sort_order')}>
                                            <tr>
                                                <TableHeader title={t('models.import_from_xper.table_column_select')} sortKey="isActive"
                                                             sortedBy={this.state.sortBy} sort={this._sort}/>
                                                <th/>
                                                <TableHeader title={t('models.import_from_xper.table_column_name')} sortKey="name"
                                                             sortedBy={this.state.sortBy} sort={this._sort}/>
                                                <TableHeader title={t('models.import_from_xper.table_column_owners')} sortKey="owners"
                                                             sortedBy={this.state.sortBy} sort={this._sort}/>
                                                <TableHeader title={t('models.import_from_xper.table_column_editors')} sortKey="editors"
                                                             sortedBy={this.state.sortBy} sort={this._sort}/>
                                                <TableHeader title={t('models.import_from_xper.table_column_viewers')} sortKey="viewers"
                                                             sortedBy={this.state.sortBy} sort={this._sort}/>
                                            </tr>
                                            </thead>
                                            <tbody>
                                            {this.state.bases.map((taxonomy, index) => {
                                                return (
                                                    <ContextMenuTrigger
                                                        renderTag='tr'
                                                        key={index}
                                                        id="projects_context_menu">
                                                        <td width={40} style={{textAlign: 'center'}}>
                                                            <Input type="radio"
                                                                   name="isActive"
                                                                   checked={this.state.selected === taxonomy.kbName}
                                                                   onChange={() => {
                                                                       console.log("selected database", taxonomy.kbName)
                                                                       this._updateSelectedDatabase(taxonomy.kbName);
                                                                   }}
                                                            />
                                                            <div className="check"
                                                                 onClick={() => {
                                                                     console.log("selected database", taxonomy.kbName)
                                                                     this._updateSelectedDatabase(taxonomy.kbName);
                                                                 }}/>
                                                        </td>
                                                        <td/>
                                                        <td>
                                                            {taxonomy.name}
                                                        </td>
                                                        <td>
                                                            {taxonomy.owners ? taxonomy.owners : ''}
                                                        </td>
                                                        <td>
                                                            {taxonomy.editors ? taxonomy.editors : ''}
                                                        </td>
                                                        <td>
                                                            {taxonomy.viewers ? taxonomy.viewers : ''}
                                                        </td>
                                                    </ContextMenuTrigger>
                                                );
                                            })}
                                            </tbody>
                                        </Table>
                                    </div>
                                </Col>
                            </Row>
                        </_TablePlaceholder>
                    </ModalBody>
                    <ModalFooter>
                        <Button color="primary" onClick={() => this._onSelectDatabase()}>Select</Button>
                        <Button color="secondary" onClick={() => this._toggle()}>{t('global.close')}</Button>
                    </ModalFooter>
                </Modal>
            </div>
        );
    }

    _updateSelectedDatabase = (selected) => {
        this.setState({
            selected: selected
        });
    };

    _onSelectDatabase = () => {
        console.log("_onSelectDatabase")
        const {t} = i18next;
        if(!this.state.selected) {
            remote.dialog.showMessageBox({
                type: 'warning',
                message: t('models.import_from_xper.alert_select_xper_database'),
                cancelId: 1
            });
            return;
        }
        if(this.props.onPickDatabase) {
            this.props.onPickDatabase(this.state.selected)
        }
        this._toggle();
    };

    _toggle = () => {
        this.setState({
        });
        if(this.props.onClose) {
            this.props.onClose();
        }
    };

}
