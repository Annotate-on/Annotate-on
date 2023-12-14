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
    ModalHeader, Nav, NavItem, NavLink,
    Row, TabContent,
    Table, TabPane
} from 'reactstrap';
import TableHeader from "./TableHeader";
import XperSettings from "../containers/XperSettings";
import lodash from "lodash";
import moment from "moment";
import {APP_NAME, MODEL_ANNOTATE, MODEL_XPER, MODEL_IMAGE_DETECT, CATEGORICAL, NUMERICAL} from "../constants/constants";
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
import PageTitle from "./PageTitle";
import PROJECTS_IMAGE_CONTEXT from "./pictures/projects2.svg";

const LIST = "LIST";
const IMPORT = "IMPORT";
const ADD_VIEW_DESCRIPTORS = "ADD_VIEW_DESCRIPTORS";
const DELETE_IMAGE_CONTEXT = require('./pictures/delete-tag.svg');
const EXPORT_IMAGE_CONTEXT = require('./pictures/export-gray.svg');
const MODELS_IMAGE_CONTEXT = require('./pictures/models.svg');
const LIST_ICON = require('./pictures/eye.svg');

const chance = new Chance();

export default class extends Component {
    constructor(props) {
        super(props);
        const taxonomyId = this.props.match  ? this.props.match.params.taxonomyId : "";
        const characterId = this.props.match  ? this.props.match.params.characterId : "";
        console.log("taxonomyId", taxonomyId);
        console.log("characterId", characterId);
        const sortBy = 'name';
        const sortDirection = 'ASC';
        let selectedModel = null;
        const sortedTaxonomies = this._sortList(sortBy, sortDirection, props.taxonomies || []);
        if(taxonomyId) {
            selectedModel = this.props.taxonomies.find(taxonomy => taxonomy.id === taxonomyId);
        } else if (this.props.selectedTaxonomy && this.props.taxonomies) {
            selectedModel = this.props.taxonomies.find(taxonomy => taxonomy.id === this.props.selectedTaxonomy.id);
        }
        this.state = {
            sortBy,
            sortDirection,
            taxonomies: sortedTaxonomies,
            showView: taxonomyId ? ADD_VIEW_DESCRIPTORS : LIST,
            modal: false,
            selectedModel: selectedModel,
            selectedCharacterId: characterId,
            activeTab: 'annotate',
            imageDetectModels: this.props.imageDetectModels,
            modelClassItemModal: false,
            modelClassItemModalInEdit: false,
            modelClassNameItemInput: '',
            modelClassIdItemInput: '',
            form: {
                modelClassItem: '',
                modelClasses: []
            },
        };
        this.handleModelClassNameInputChangeForEdit = this.handleModelClassNameInputChangeForEdit.bind(this);
        this.handleModelClassIdInputChangeForEdit = this.handleModelClassIdInputChangeForEdit.bind(this);
        this.handleInputChange = this.handleInputChange.bind(this);
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

    _toggleImageDetect = () => {
        this.setState({
            modalImageDetect: !this.state.modalImageDetect
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

    _saveImageDetectModel = () => {
        if (this.state.modelImageDetectName) {
            this.setState({
                modalImageDetect: false,
                modelImageDetectName: null
            });
            const id = chance.guid();
            this.props.saveImageDetectModel(
                id,
                this.state.modelImageDetectName,
                MODEL_IMAGE_DETECT,
                0,
                this.state.modelImageDetectUrl,
                this.state.modelImageDetectUser,
                this.state.modelImageDetectPwd,
                this.state.modelImageDetectDesc,
                this.state.modelImageDetectConfidence,
                this.state.form.modelClasses
            ).then(_ => {
                    this.setState({
                        showView: LIST
                    });
                })
        }
    };

    _viewTaxonomy = (taxonomy) => {
        this.setState({
            selectedModel: taxonomy,
            showView: ADD_VIEW_DESCRIPTORS
        });
    };

    _viewImageDetectModel = (imageDetectModel) => {
        debugger
        this.setState({
            selectedImageDetectModel: imageDetectModel,
            showView: LIST
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
        debugger
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
            case 'view_imageDetect':
                this._viewImageDetectModel(data.imageDetectModel);
                break;
            case 'delete_imageDetect':
                // const result = remote.dialog.showMessageBox({
                //     type: 'question',
                //     buttons: ['Yes', 'No'],
                //     message: t('models.delete_taxonomy_message', { taxonomy: data.taxonomy.name}),
                //     cancelId: 1,
                //     detail: t('global.delete_confirmation')
                // });
                // if (result === 0) this.props.removeTaxonomy(data.taxonomy.id);
                break;
        }
    };

    toggleTab = (tab) => {
        if (this.state.activeTab !== tab) {
            this.setState({
                activeTab: tab,
            });
        }
    };

    toggleModelClassItemModal = () => {
        this.setState({
            modelClassItemModal: !this.state.modelClassItemModal,
            modelClassItemModalInEdit: false,
        });
    };
    toggleModelClassItemEdit = () => {
        const { t } = this.props;
        if (!this.state.form.modelClassItem){
            alert(t('models.target_descriptors.dialog_edit.alert_select_categorical_state_item_to_edit'));
            return;
        }
        const stateItem = this.state.form.modelClasses.find(value => value.id === this.state.form.modelClassItem);
        this.setState(prevState => ({
            modelClassItemModal: !this.state.modelClassItemModal,
            modelClassNameItemInput: stateItem.name,
            modelClassIdItemInput: stateItem.id,
            modelClassItemModalInEdit: true,
        }));
    };

    _deleteModelClassItem = () => {
        const { t } = this.props;
        if (!this.state.form.modelClassItem){
            alert(t('models.target_descriptors.dialog_edit.alert_select_categorical_state_item_to_delete'));
        } else {
            this.setState(prevState => ({
                form: {
                    ...prevState.form,
                    modelClasses: prevState.form.modelClasses.filter(value => value.id !== this.state.form.modelClassItem),
                    modelClassItem: '',
                    modelClassIdItemInput: '',
                    modelClassNameItemInput: ''
                }
            }));
        }
    };
    _saveModelClassItem = () => {
        const { t } = this.props;
        if(!this.state.modelClassNameItemInput || !this.state.modelClassIdItemInput) {
            alert(t('models.target_descriptors.dialog_edit_categorical_state_item.alert_categorical_state_item_is_empty'));
            return;
        }
        if (this.state.form.modelClasses.some(value => value.name === this.state.modelClassNameItemInput) || this.state.form.modelClasses.some(value => value.id === this.state.modelClassIdItemInput)) {
            alert(t('models.target_descriptors.dialog_edit_categorical_state_item.alert_categorical_state_item_already_exist'));
            return;
        }
        if (this.state.modelClassItemModalInEdit) {
            const modelClassItem = this.state.form.modelClasses.find(value => value.id === this.state.form.modelClassItem);
            modelClassItem.name = this.state.modelClassNameItemInput;
            modelClassItem.id = this.state.modelClassIdItemInput;
            this.setState(prevState => ({
                form: {
                    ...prevState.form,
                    modelClasses: [...prevState.form.modelClasses]
                },
                modelClassIdItemInput: '',
                modelClassNameItemInput: ''
            }));
        } else {
            this.setState(prevState => ({
                form: {
                    ...prevState.form,
                    modelClasses: [...prevState.form.modelClasses,
                        {
                            id: prevState.modelClassIdItemInput,
                            name: prevState.modelClassNameItemInput
                        }
                    ]
                },
                modelClassIdItemInput: '',
                modelClassNameItemInput: ''
            }));
        }
        this.toggleModelClassItemModal();
    };

    handleModelClassNameInputChangeForEdit(event) {
        this.setState({
            modelClassNameItemInput: event.target.value
        });
    }

    handleModelClassIdInputChangeForEdit(event) {
        this.setState({
            modelClassIdItemInput: event.target.value
        });
    }

    handleInputChange(event) {
        const target = event.target;
        const value = target.value;
        const name = target.name;
        let form = this.state.form;
        if (target.type === 'select-one' || target.type === 'select-multiple') {
            form[name] = target.selectedOptions[0].dataset[name];
        } else {
            form[name] = value;
        }

        this.setState({
            form
        });
        this.forceUpdate();
    }

    render() {
        const { t } = this.props;
        switch (this.state.showView) {
            case LIST:
                return (<Container className="bst rcn_xper">
                    <PageTitle
                        showProjectInfo={true}
                        logo={MODELS_IMAGE_CONTEXT}
                        pageTitle={t('models.title')}
                        projectName={this.props.projectName}
                        selectedTaxonomy={this.props.selectedTaxonomy}
                        docLink="models"
                    >
                    </PageTitle>
                    <br/>
                    <Nav tabs>
                        <NavItem>
                            <NavLink
                                onClick={() => this.toggleTab('annotate')}
                                className={this.state.activeTab === 'annotate' ? 'active' : ''}
                            >
                                Annotate Models
                            </NavLink>
                        </NavItem>
                        <NavItem>
                            <NavLink
                                onClick={() => this.toggleTab('imageDetect')}
                                className={this.state.activeTab === 'imageDetect' ? 'active' : ''}
                            >
                                Image Detect Models
                            </NavLink>
                        </NavItem>
                    </Nav>
                    <TabContent activeTab={this.state.activeTab}>
                        <TabPane tabId="annotate">
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
                                    <Button
                                        disabled={this.props.selectedTaxonomy === null || this.props.selectedTaxonomy.model === MODEL_XPER}
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
                            <Row className="content-table annotate-models">
                                <Col md={{size: 12, offset: 0}}>
                                    <div className="table-wrapper" id="wrapper" ref={_ => (this.pane = _)}>
                                        <Table hover size="sm" className="targets-table">
                                            <thead title={t('models.thead_tooltip_sort_order')}>
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
                                                <TableHeader title={t('models.table_column_date_imported_created')}
                                                             sortKey="importDate"
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
                                        <img alt="select all" className='select-all' src={LIST_ICON}/>&nbsp;{t('global.view')}
                                    </MenuItem>
                                    <MenuItem divider/>
                                    <MenuItem data={{action: 'delete'}} onClick={this._handleContextMenu}>
                                        <img alt="delete" src={DELETE_IMAGE_CONTEXT}/>&nbsp;{t('global.delete')}
                                    </MenuItem>
                                    <MenuItem divider/>
                                    <MenuItem data={{action: 'export'}} onClick={this._handleContextMenu}>
                                        <img alt="delete" src={EXPORT_IMAGE_CONTEXT}/>&nbsp;{t('global.export')}
                                    </MenuItem>
                                </ContextMenu>
                            </div>
                            <Modal isOpen={this.state.modal} toggle={this._toggle} wrapClassName="bst" autoFocus={false}>
                                <ModalHeader
                                    toggle={this._toggle}>{t('models.dialog_create_model.title_create_model')}</ModalHeader>
                                <ModalBody>
                                    <Form onSubmit={(e) => {
                                        e.preventDefault();
                                        this._saveTaxonomy();
                                    }}>
                                        <FormGroup row>
                                            <Label for="modelName"
                                                   sm={5}>{t('models.dialog_create_model.lbl_model_name')}</Label>
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
                    </TabPane>
                    <TabPane tabId="imageDetect">
                        <Row className="action-bar">
                            <Col sm={8} md={8} lg={8}>
                                <Button className="btn btn-primary mr-md-3 mrg" color="primary"
                                        onClick={this._toggleImageDetect}
                                >{t('models.btn_new_model')}</Button>
                            </Col>
                            <Col sm={4} md={4} className="text-md-right">
                                {this.state.imageDetectModels.map((imageDetectModel) => {
                                    if (imageDetectModel.isActive) {
                                        let i = 1;
                                        return (
                                            <div key={i++}>
                                                    <span>{t('models.lbl_active_model')}:<span
                                                        className="lead"> {imageDetectModel.name}</span>&nbsp;</span>

                                                <Button className="btn btn-secondary mrg" color="secondary"
                                                        onClick={() => {
                                                            this.props.updateImageDetectModelStatus(imageDetectModel.id, !imageDetectModel.isActive)

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
                        <Row className="content-table image-detect-models">
                            <Col md={{size: 12, offset: 0}}>
                                <div className="table-wrapper" id="wrapper" ref={_ => (this.pane = _)}>
                                    <Table hover size="sm" className="targets-table">
                                        <thead title={t('models.thead_tooltip_sort_order')}>
                                        <tr>
                                            <TableHeader title={t('models.table_column_select')} sortKey="isActive"
                                                         sortedBy={this.state.sortBy} sort={this._sort}/>
                                            <th/>
                                            <TableHeader title={t('models.table_column_model_name')} sortKey="name"
                                                         sortedBy={this.state.sortBy} sort={this._sort}/>
                                            <TableHeader title={t('models.dialog_create_model.lbl_model_image_detect_url')} sortKey="url_service"
                                                         sortedBy={this.state.sortBy} sort={this._sort}/>
                                            <TableHeader title={t('models.dialog_create_model.lbl_model_image_detect_confidence')} sortKey="confidence"
                                                         sortedBy={this.state.sortBy} sort={this._sort}/>
                                            <TableHeader title={t('models.table_column_date_imported_created')}
                                                         sortKey="creationDate"
                                                         sortedBy={this.state.sortBy} sort={this._sort}/>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {this.props.imageDetectModels.map((imageDetectModel, index) => {
                                            const date = moment(imageDetectModel.creationDate);
                                            return (
                                                <ContextMenuTrigger
                                                    renderTag='tr'
                                                    key={index}
                                                    id="image_detect_context_menu"
                                                    collect={() => {
                                                        return {
                                                            imageDetectModel: imageDetectModel
                                                        };
                                                    }}>
                                                    <td width={40} style={{textAlign: 'center'}}>
                                                        <Input type="radio"
                                                               name="isActive2"
                                                               checked={imageDetectModel.isActive}
                                                               onChange={() => {
                                                                   console.log(imageDetectModel.id + ' ' + !imageDetectModel.isActive)
                                                                   this.props.updateImageDetectModelStatus(imageDetectModel.id, !imageDetectModel.isActive, imageDetectModel.model)
                                                               }}
                                                        />
                                                        <div className="check"
                                                             onClick={() => {
                                                                 console.log(imageDetectModel.id + ' ' + !imageDetectModel.isActive)
                                                                 this.props.updateImageDetectModelStatus(imageDetectModel.id, !imageDetectModel.isActive, imageDetectModel.model)
                                                             }}/>
                                                    </td>
                                                    <td/>
                                                    <td onClick={() => {
                                                        // this.setState({
                                                        //     selectedModel: imageDetectModel,
                                                        //     showView: ADD_VIEW_DESCRIPTORS
                                                        // })
                                                    }}>
                                                        {imageDetectModel.name}
                                                    </td>
                                                    <td>
                                                        {imageDetectModel.url_service}
                                                    </td>
                                                    <td>
                                                        {imageDetectModel.confidence}
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
                            <ContextMenu id="image_detect_context_menu">
                                <MenuItem data={{action: 'view_imageDetect'}} onClick={this._handleContextMenu}>
                                    <img alt="select all" className='select-all' src={LIST_ICON}/>&nbsp;{t('global.view')}
                                </MenuItem>
                                <MenuItem divider/>
                                <MenuItem data={{action: 'delete_imageDetect'}} onClick={this._handleContextMenu}>
                                    <img alt="delete" src={DELETE_IMAGE_CONTEXT}/>&nbsp;{t('global.delete')}
                                </MenuItem>
                            </ContextMenu>
                        </div>
                        <Modal isOpen={this.state.modalImageDetect} toggle={this._toggleImageDetect} wrapClassName="bst" autoFocus={false}>
                            <ModalHeader
                                toggle={this._toggleImageDetect}>{t('models.dialog_create_model.title_create_model')}</ModalHeader>
                            <ModalBody>
                                <Form onSubmit={(e) => {
                                    e.preventDefault();
                                    this._saveImageDetectModel();
                                }}>
                                    <FormGroup row>
                                        <Label for="modelImageDetectName"
                                               sm={5}>{t('models.dialog_create_model.lbl_model_name')}</Label>
                                        <Col sm={7}>
                                            <Input type="text" name="modelImageDetectName" id="modelImageDetectName" autoFocus={true}
                                                   onChange={(e) => {
                                                       this.setState({
                                                           modelImageDetectName: e.target.value
                                                       })
                                                   }}
                                            />
                                        </Col>
                                    </FormGroup>
                                    <FormGroup row>
                                        <Label for="modelImageDetectUrl"
                                               sm={5}>{t('models.dialog_create_model.lbl_model_image_detect_url')}</Label>
                                        <Col sm={7}>
                                            <Input type="text" name="modelImageDetectUrl" id="modelImageDetectUrl"
                                                   onChange={(e) => {
                                                       this.setState({
                                                           modelImageDetectUrl: e.target.value
                                                       })
                                                   }}
                                            />
                                        </Col>
                                    </FormGroup>
                                    <FormGroup row>
                                        <Label for="modelImageDetectUser"
                                               sm={5}>{t('models.dialog_create_model.lbl_model_image_detect_user')}</Label>
                                        <Col sm={7}>
                                            <Input type="text" name="modelImageDetectUser" id="modelImageDetectUser"
                                                   onChange={(e) => {
                                                       this.setState({
                                                           modelImageDetectUser: e.target.value
                                                       })
                                                   }}
                                            />
                                        </Col>
                                    </FormGroup>
                                    <FormGroup row>
                                        <Label for="modelImageDetectPwd"
                                               sm={5}>{t('models.dialog_create_model.lbl_model_image_detect_pwd')}</Label>
                                        <Col sm={7}>
                                            <Input type="text" name="modelImageDetectPwd" id="modelImageDetectPwd"
                                                   onChange={(e) => {
                                                       this.setState({
                                                           modelImageDetectPwd: e.target.value
                                                       })
                                                   }}
                                            />
                                        </Col>
                                    </FormGroup>
                                    <FormGroup row>
                                        <Label for="modelImageDetectDesc"
                                               sm={5}>{t('models.dialog_create_model.lbl_model_image_detect_desc')}</Label>
                                        <Col sm={7}>
                                            <Input type="textarea" name="modelImageDetectDesc" id="modelImageDetectDesc" rows={3}
                                                   onChange={(e) => {
                                                       this.setState({
                                                           modelImageDetectDesc: e.target.value
                                                       })
                                                   }}
                                            />
                                        </Col>
                                    </FormGroup>
                                    <FormGroup row>
                                        <Label for="modelImageDetectConfidence"
                                               sm={5}>{t('models.dialog_create_model.lbl_model_image_detect_confidence')} (%)</Label>
                                        <Col sm={7}>
                                            <Input type="text" name="modelImageDetectConfidence" id="modelImageDetectConfidence"
                                                   onChange={(e) => {
                                                       this.setState({
                                                           modelImageDetectConfidence: e.target.value
                                                       })
                                                   }}
                                            />
                                        </Col>
                                    </FormGroup>
                                    <FormGroup>
                                        <Label for="modelClassItem">{t('models.dialog_create_model.lbl_model_image_detect_classes')}</Label>
                                        <Row className="model-classes-container">
                                            <Col md={5} className='crud-icons-wrapper'>
                                                <i className="fa fa-plus-square fa-lg crud-icons" aria-hidden="true"
                                                   onClick={this.toggleModelClassItemModal}/>
                                                <i className="fa fa-pencil fa-lg  crud-icons" aria-hidden="true"
                                                   onClick={this.toggleModelClassItemEdit}
                                                   disabled={!this.state.form.modelClassItem}/>
                                                <i className="fa fa-trash fa-lg crud-icons" aria-hidden="true"
                                                   onClick={this._deleteModelClassItem}
                                                   disabled={!this.state.form.modelClassItem}/>
                                            </Col>
                                            <Col md={7}>
                                                <Input type="select" multiple='multiple' name="modelClassItem" id="modelClassItem"
                                                       onChange={this.handleInputChange}>
                                                    {
                                                        this.state.form.modelClasses.map((type, index) => {
                                                            return <option key={`td_${index}`} data-model-class-item={type.id}>{type.name}</option>;
                                                        })
                                                    }
                                                </Input>
                                            </Col>
                                        </Row>
                                    </FormGroup>
                                    <FormGroup row>
                                        <Label sm={5}>{t('models.dialog_create_model.lbl_model_type')}</Label>
                                        <Col sm={7}>
                                            <Input plaintext readOnly value="Image Detect IRD service"/>
                                        </Col>
                                    </FormGroup>
                                </Form>
                            </ModalBody>
                            <ModalFooter>
                                <Button color="primary" onClick={this._saveImageDetectModel}>Save</Button>
                                <Button color="secondary" onClick={this._toggleImageDetect}>Cancel</Button>
                            </ModalFooter>
                        </Modal>
                        <Modal isOpen={this.state.modelClassItemModal} toggle={this.toggleModelClassItemModal}
                               wrapClassName="bst rcn_targets">
                            <ModalHeader toggle={this.toggleModelClassItemModal}>{t('models.dialog_create_model.lbl_model_image_detect_classes')}</ModalHeader>
                            <ModalBody>
                                <Form onSubmit={(e) => {
                                    e.preventDefault();
                                }}>
                                    <FormGroup>
                                        <Label for="modelClassNameEdit">{t('models.dialog_create_model.lbl_model_image_detect_class_name')}</Label>
                                        <Input type="text" name="modelClassNameEdit" id="modelClassNameEdit" value={this.state.modelClassNameItemInput}
                                               onChange={this.handleModelClassNameInputChangeForEdit}
                                        />
                                    </FormGroup>
                                    <FormGroup>
                                        <Label for="modelClassIdEdit">{t('models.dialog_create_model.lbl_model_image_detect_class_id')}</Label>
                                        <Input type="text" name="modelClassIdEdit" id="modelClassidEdit" value={this.state.modelClassIdItemInput}
                                               onChange={this.handleModelClassIdInputChangeForEdit}
                                        />
                                    </FormGroup>
                                </Form>
                            </ModalBody>
                            <ModalFooter>
                                <Button color="primary" onClick={this._saveModelClassItem}>{t('global.save')}</Button>
                                <Button color="secondary" onClick={this.toggleModelClassItemModal}>{t('global.cancel')}</Button>
                            </ModalFooter>
                        </Modal>
                    </TabPane>
                    </TabContent>
                </Container>);
            case IMPORT:
                return <XperSettings goBack={() => this.setState({showView: LIST})} model={this.state.selectedModel}/>;
            case ADD_VIEW_DESCRIPTORS:
                return <TargetDescriptors
                    taxonomyModel={this.state.selectedModel}
                    selectedId={this.state.selectedCharacterId}
                    goBack={() => this.setState({showView: LIST})}/>;
        }
    }
}
