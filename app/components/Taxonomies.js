import React, {Component, Fragment} from 'react';
import {
    Button,
    Col,
    Container,
    Form,
    FormGroup,
    Input,
    Label,
    Modal,
    ModalBody,
    ModalFooter,
    ModalHeader,
    Row,
    Table
} from 'reactstrap';
import TableHeader from "./TableHeader";
import XperSettings from "../containers/XperSettings";
import lodash from "lodash";
import moment from "moment";
import {APP_NAME, MODEL_ANNOTATE, MODEL_XPER} from "../constants/constants";
import TargetDescriptors from "../containers/TargetDescriptors";
import {get} from '../utils/js';
import fs from "fs-extra";
import {getCacheDir, getTaxonomyDir, getUserWorkspace, loadTaxonomy} from "../utils/config";
import path from "path";
import {remote, shell} from "electron";
import {ContextMenu, ContextMenuTrigger, MenuItem} from "react-contextmenu";
import {ee, EVENT_HIDE_WAITING, EVENT_SHOW_WAITING} from "../utils/library";
import {convertSDDtoJson} from "../utils/sdd-processor";
import Chance from "chance";

const RECOLNAT_LOGO = require('./pictures/logo.svg');
const LIST = "LIST";
const IMPORT = "IMPORT";
const ADD_VIEW_DESCRIPTORS = "ADD_VIEW_DESCRIPTORS";
const DELETE_IMAGE_CONTEXT = require('./pictures/delete-tag.svg');
const EXPORT_IMAGE_CONTEXT = require('./pictures/export-gray.svg');
const SELECT_ALL = require('./pictures/select_all_gray.svg');

const chance = new Chance();

export default class extends Component {
    constructor(props) {
        super(props);
        const sortBy = 'name';
        const sortDirection = 'ASC';
        let selectedModel = null;
        const sortedTaxonomies = this._sortList(sortBy, sortDirection, props.taxonomies || []);
        if (this.props.selectedTaxonomy && this.props.taxonomies) {
            selectedModel = this.props.taxonomies.find(taxonomy => taxonomy.id === this.props.selectedTaxonomy.id);
        }
        this.state = {
            sortBy,
            sortDirection,
            taxonomies: sortedTaxonomies,
            showView: LIST,
            modal: false,
            selectedModel: selectedModel
        };
    }

    componentWillReceiveProps(nextProps) {
        const taxonomies = this._sortList(this.state.sortBy, this.state.sortDirection, this.props.taxonomies);
        this.setState({taxonomies: taxonomies});
    }

    componentDidUpdate(prevProps, prevState) {
        //If there has been add or update action, we have to refresh list
        if (this.state.showView !== prevState.showView || prevProps.taxonomies.length !== this.props.taxonomies.length) {
            const taxonomies = this._sortList(this.state.sortBy, this.state.sortDirection, this.props.taxonomies);
            this.setState({taxonomies: taxonomies});
        }
    }

    componentDidMount() {
        this._downloadDefaultVocabularies();
    }

    _downloadDefaultVocabularies = () => {
        get('http://annotate-sdd.infosyslab.fr/annotate-sdd.json').then(vocabularies => {
            if (vocabularies) {
                vocabularies.models.map(_ => {
                    if (_.sdd_url !== 'unavailable') {
                        // check if we already have this sdd in taxonomies array and compare version numbers
                        // it would be nice to add id in each object, until that use title as id
                        const taxonomy = this.state.taxonomies.find(tax => tax.name === _.title && tax.version === _.version_number);
                        if (taxonomy === undefined) {
                            console.log('Download %s', _.sdd_url);
                            get(_.sdd_url, true).then(sddFile => {
                                const tempSddFile = path.join(getCacheDir(), path.basename(_.sdd_url));
                                // Save temp file
                                fs.writeFileSync(tempSddFile, sddFile);
                                this.props.saveTaxonomy(chance.guid(), _.title, tempSddFile, MODEL_XPER, _.version_number);
                                // Delete temp file
                                fs.unlinkSync(tempSddFile);
                            })
                        }
                    }
                })
            }
        });
    };

    _sort = (sortBy, sortDirection) => {
        const taxonomies = this._sortList(sortBy, sortDirection);
        this.setState({sortBy, sortDirection, taxonomies});
    };

    _sortList(sortBy, sortDirection, initList) {
        const list = initList || this.state.taxonomies;
        const sorted = lodash.sortBy(list, _ => (typeof _[sortBy] === 'string' ? _[sortBy].toLowerCase() : _[sortBy]));
        return sortDirection === 'DESC' ? lodash.reverse(sorted) : sorted;
    }

    _toggle = () => {
        this.setState({
            modal: !this.state.modal
        });
    };

    _saveTaxonomy = () => {
        if (this.state.modelName) {
            this.setState({
                modal: false,
                modelName: null
            });
            const id = chance.guid();
            this.props.saveTaxonomy(id, this.state.modelName, null, MODEL_ANNOTATE, 0).then(_ => {
                const taxonomy = this.state.taxonomies.find(taxonomy => taxonomy.id === id);
                if (taxonomy !== undefined && taxonomy !== null) {
                    this._viewTaxonomy(taxonomy);
                }
            })
        }
    };

    _viewTaxonomy = (taxonomy) => {
        this.setState({
            selectedModel: taxonomy,
            showView: ADD_VIEW_DESCRIPTORS
        });
    };

    _exportTaxonomy = (taxonomy) => {
        console.log('exporting ... ' , taxonomy)
        const { t } = this.props;
        let saverPath = remote.dialog.showSaveDialog(remote.getCurrentWindow(), {
            title: t('models.dialog_export_model.title_save_taxonomy'),
            defaultPath: path.join(getUserWorkspace(), `${taxonomy.name}.json`)
        });
        if (!saverPath || saverPath.length < 1) return;
        try {
            ee.emit(EVENT_SHOW_WAITING, t('models.wait_message_exporting_to_a_file'));
            let descriptors;
            if (taxonomy.model === MODEL_XPER)
                descriptors = convertSDDtoJson(path.join(getTaxonomyDir(), taxonomy.sddPath)).items;
            else if (taxonomy.model === MODEL_ANNOTATE){
                console.log(taxonomy)
                descriptors = loadTaxonomy(taxonomy.id);
                if (descriptors && descriptors.length > 0 && taxonomy.targetTypes){
                    descriptors.forEach( descriptor => {
                        if (!taxonomy.targetTypes.includes(descriptor.targetType)){
                            taxonomy.targetTypes.push(descriptor.targetType);
                        }
                    })
                }
            }
            fs.writeFileSync(saverPath, JSON.stringify({taxonomy, descriptors}));
            ee.emit(EVENT_HIDE_WAITING);
            const result = remote.dialog.showMessageBox(remote.getCurrentWindow(), {
                type: 'info',
                detail: saverPath,
                message: t('global.export_finished'),
                buttons: ['OK', t('global.open_folder')],
                cancelId: 1
            });
            if (result === 1) {
                shell.showItemInFolder(saverPath);
            }
        } catch (err) {
            ee.emit(EVENT_HIDE_WAITING);
            console.error(err)
        }
    }

    _importTaxonomy = () => {
        const { t } = this.props;
        const _ = remote.dialog.showOpenDialog(remote.getCurrentWindow(), {
            properties: ['openFile'],
            filters: [{name: 'JSON explore file', extensions: ['json']}]
        });
        if (!_ || _.length < 1) return;

        const model = JSON.parse(fs.readFileSync(_.pop(), 'utf8'));

        const exist = this.state.taxonomies.find(taxonomy => taxonomy.id === model.taxonomy.id);
        if (exist !== undefined && exist.id === model.taxonomy.id) {
            alert(t('models.alert_taxonomy_already_exist'));
            return;
        }

        this.props.importTaxonomy(model.taxonomy.id, model.taxonomy.name, null, model.taxonomy.version, model.descriptors , model.taxonomy.targetTypes).then(_ => {
            const taxonomy = this.state.taxonomies.find(taxonomy => taxonomy.id === model.taxonomy.id);
            if (taxonomy !== undefined && taxonomy !== null) {
                this._viewTaxonomy(taxonomy);
            }
        })
    }

    _exportAnnotateTaxonomy = () => {
    }

    _handleContextMenu = (e, data) => {
        const { t } = this.props;
        switch (data.action) {
            case 'view':
                this._viewTaxonomy(data.taxonomy);
                break;
            case 'delete':
                const result = remote.dialog.showMessageBox({
                    type: 'question',
                    buttons: ['Yes', 'No'],
                    message: t('models.delete_taxonomy_message', { taxonomy: data.taxonomy.name}),
                    cancelId: 1,
                    detail: t('global.delete_confirmation')
                });
                if (result === 0) this.props.removeTaxonomy(data.taxonomy.id);
                break;
            case 'export':
                if (data.taxonomy.model === MODEL_XPER) {
                    remote.dialog.showMessageBox(remote.getCurrentWindow(), {
                        type: 'info',
                        detail: t('models.alert.cannot_export_taxonomy'),
                        message: t('global.error')
                    });
                    return;
                }
                this._exportTaxonomy(data.taxonomy);
                break;
        }
    };

    render() {
        const { t } = this.props;
        switch (this.state.showView) {
            case LIST:
                return (<Container className="bst rcn_xper">
                    <div className="bg">
                        <Row>
                            <Col sm={6} className="hide-overflow">
                                <a onClick={() => {
                                    this.props.goToLibrary();
                                }}> <img alt="logo" src={RECOLNAT_LOGO} className="logo" title={t('global.logo_tooltip_go_to_home_page')}/></a>
                                <span className="project-label">{t('global.lbl_project')}:</span><span
                                className="project-name">{this.props.projectName}</span>
                                <span className="project-label">{t('global.lbl_model')}:</span>
                                <span className="project-name">
                    {this.props.selectedTaxonomy ?
                        <Fragment>{this.props.selectedTaxonomy.name} (type: {this.props.selectedTaxonomy.model === MODEL_XPER ?
                            <img height='16px'
                                 alt="xper3-logo"
                                 src='http://www.xper3.fr/resources/img/xper3-logo.png'/> : APP_NAME} )</Fragment>
                        :
                        'Without model'
                    }
                            </span>
                            </Col>
                            <Col sm={6}>
                                <span className="title">{t('models.title')}</span>
                            </Col>
                        </Row>
                    </div>
                    <br/>
                    <Row className="action-bar">
                        <Col sm={8} md={8} lg={8}>
                            <Button className="btn btn-primary mr-md-3 mrg" color="primary"
                                    onClick={this._toggle}
                            >{t('models.btn_new_model')}</Button>
                            <Button className="btn btn-primary mr-md-3 mrg" color="primary"
                                    onClick={() => this.setState({
                                        showView: IMPORT,
                                        selectedModel: null
                                    })}
                            >{t('models.btn_import_from_xper')}</Button>

                            <Button className="btn btn-primary mr-md-3 mrg" color="primary"
                                    onClick={() => this._importTaxonomy()}
                            >{t('models.btn_import_a_model')}</Button>
                            <Button disabled={this.props.selectedTaxonomy === null || this.props.selectedTaxonomy.model === MODEL_XPER}
                                    className="btn btn-primary mr-md-3 mrg" color="primary"
                                    onClick={() => this._exportTaxonomy(this.props.selectedTaxonomy)}
                            >{t('models.btn_export_selected_model')}</Button>
                        </Col>

                        <Col sm={4} md={4} className="text-md-right">
                            {this.state.taxonomies.map((taxonomy) => {
                                if (taxonomy.isActive) {
                                    let i = 1;
                                    return (
                                        <div key={i++}>
                                            <span>{t('models.lbl_active_model')}:<span
                                                className="lead"> {taxonomy.name}</span>&nbsp;</span>

                                            <Button className="btn btn-secondary mrg" color="secondary"
                                                    onClick={() => {
                                                        this.props.updateTaxonomiesStatus(taxonomy.id, !taxonomy.isActive)
                                                    }}
                                            >{t('models.btn_deactivate')}</Button>
                                        </div>
                                    )
                                }
                            })
                            }
                        </Col>
                    </Row>
                    <br/>
                    <Row className="content-table">
                        <Col md={{size: 12, offset: 0}}>
                            <div className="table-wrapper" id="wrapper" ref={_ => (this.pane = _)}>
                                <Table hover size="sm" className="targets-table">
                                    <thead title={t('thead_tooltip_sort_order')}>
                                    <tr>
                                        <TableHeader title={t('models.table_column_select')} sortKey="isActive"
                                                     sortedBy={this.state.sortBy} sort={this._sort}/>
                                        <th/>
                                        <TableHeader title={t('models.table_column_model_name')} sortKey="name"
                                                     sortedBy={this.state.sortBy} sort={this._sort}/>
                                        <TableHeader title={t('models.table_column_type')} sortKey="model"
                                                     sortedBy={this.state.sortBy} sort={this._sort}/>
                                        <TableHeader title={t('models.table_column_version')} sortKey="version"
                                                     sortedBy={this.state.sortBy} sort={this._sort}/>
                                        <TableHeader title={t('models.table_column_date_imported_created')} sortKey="importDate"
                                                     sortedBy={this.state.sortBy} sort={this._sort}/>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {this.state.taxonomies.map((taxonomy, index) => {
                                        const date = moment(taxonomy.importDate);
                                        return (
                                            // renderTag='tr'
                                            <ContextMenuTrigger
                                                renderTag='tr'
                                                key={index}
                                                id="taxonomies_context_menu"
                                                collect={() => {
                                                    return {
                                                        taxonomy: taxonomy
                                                    };
                                                }}>
                                                <td width={40} style={{textAlign: 'center'}}>
                                                    <Input type="radio"
                                                           name="isActive"
                                                           checked={taxonomy.isActive}
                                                           onChange={() => {
                                                               console.log(taxonomy.id + ' ' + !taxonomy.isActive)
                                                               this.props.updateTaxonomiesStatus(taxonomy.id, !taxonomy.isActive, taxonomy.model)
                                                           }}
                                                    />
                                                    <div className="check"
                                                         onClick={() => {
                                                             console.log(taxonomy.id + ' ' + !taxonomy.isActive)
                                                             this.props.updateTaxonomiesStatus(taxonomy.id, !taxonomy.isActive, taxonomy.model)
                                                         }}/>
                                                </td>
                                                <td/>
                                                <td onClick={() => {
                                                    this.setState({
                                                        selectedModel: taxonomy,
                                                        showView: ADD_VIEW_DESCRIPTORS
                                                    })
                                                }}>
                                                    {taxonomy.name}
                                                </td>
                                                <td>
                                                    {taxonomy.model === MODEL_XPER ? 'Xper 3' : APP_NAME}
                                                </td>
                                                <td>
                                                    {taxonomy.version}
                                                </td>
                                                <td>
                                                    {date.format('DD/MM/YYYY')}
                                                </td>
                                            </ContextMenuTrigger>
                                        );
                                    })}
                                    </tbody>
                                </Table>
                            </div>
                        </Col>
                    </Row>
                    <div>
                        <ContextMenu id="taxonomies_context_menu">
                            <MenuItem data={{action: 'view'}} onClick={this._handleContextMenu}>
                                <img alt="select all" className='select-all' src={SELECT_ALL}/>{t('global.view')}
                            </MenuItem>
                            <MenuItem divider/>
                            <MenuItem data={{action: 'delete'}} onClick={this._handleContextMenu}>
                                <img alt="delete" src={DELETE_IMAGE_CONTEXT}/>{t('global.delete')}
                            </MenuItem>
                            <MenuItem divider/>
                            <MenuItem data={{action: 'export'}} onClick={this._handleContextMenu}>
                                <img alt="delete" src={EXPORT_IMAGE_CONTEXT}/>{t('global.export')}
                            </MenuItem>
                        </ContextMenu>
                    </div>
                    <Modal isOpen={this.state.modal} toggle={this._toggle} wrapClassName="bst" autoFocus={false}>
                        <ModalHeader toggle={this._toggle}>{t('models.dialog_create_model.title_create_model')}</ModalHeader>
                        <ModalBody>
                            <Form onSubmit={(e) => {
                                e.preventDefault();
                                this._saveTaxonomy();
                            }}>
                                <FormGroup row>
                                    <Label for="modelName" sm={5}>{t('models.dialog_create_model.lbl_model_name')}</Label>
                                    <Col sm={7}>
                                        <Input type="text" name="modelName" id="modelName" autoFocus={true}
                                               onChange={(e) => {
                                                   this.setState({
                                                       modelName: e.target.value
                                                   })
                                               }}
                                        />
                                    </Col>
                                </FormGroup>
                                <FormGroup row>
                                    <Label sm={5}>{t('models.dialog_create_model.lbl_model_type')}</Label>
                                    <Col sm={7}>
                                        <Input plaintext readOnly value="Annotate"/>
                                    </Col>
                                </FormGroup>
                            </Form>
                        </ModalBody>
                        <ModalFooter>
                            <Button color="primary" onClick={this._saveTaxonomy}>Save</Button>
                            <Button color="secondary" onClick={this._toggle}>Cancel</Button>
                        </ModalFooter>
                    </Modal>
                </Container>);
            case IMPORT:
                return <XperSettings goBack={() => this.setState({showView: LIST})} model={this.state.selectedModel}/>;
            case ADD_VIEW_DESCRIPTORS:
                return <TargetDescriptors
                    taxonomyModel={this.state.selectedModel}
                    goBack={() => this.setState({showView: LIST})}/>;
        }
    }
}
