import React, {PureComponent} from 'react';
import {ContextMenu, ContextMenuTrigger, MenuItem} from "react-contextmenu";
import {
    Button,
    Col,
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
import lodash from 'lodash';
import Chance from 'chance';
import TableHeader from "./TableHeader";
import {getTaxonomyDir, loadTaxonomy} from "../utils/config";
import {CATEGORICAL, INTEREST, MODEL_ANNOTATE, MODEL_XPER, NUMERICAL, TEXTUAL} from "../constants/constants";
import {convertSDDtoJson} from "../utils/sdd-processor";
import path from 'path';
import {calculateTableHeight} from "../utils/common";

const RECOLNAT_LOGO = require('./pictures/logo.svg');
const chance = new Chance();

const colors = ['#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2096f3', '#04a9f4', '#01bcd4', '#009688',
    '#4caf50', '#8bc34a', '#cddc39', '#ffeb3b', '#ffc108', '#ff9801', '#ff5723', '#795548', '#9e9e9e'];

class TargetDescriptors extends PureComponent {
    constructor(props) {
        super(props);

        const sortBy = 'name';
        const sortDirection = 'ASC';
        const sorted = this._resortTable(true);
        const model = this.props.taxonomyModel ? this.props.taxonomyModel.model : null;

        this.state = {
            modal: false,
            targetTypeModal: false,
            modalEdit: false,
            targetTypeModalEdit: false,
            modalTitle: 'New character',
            modalTitleEdit: 'Edit character group',
            categoricalStateItemModal: false,
            categoricalStateItemModalInEdit: false,
            categoricalStateItemInput: '',
            form: {
                id: '',
                targetName: '',
                targetType: '',
                targetColor: '#f44336',
                unit: '',
                annotationType: '',
                includeInCalculation: true,
                categoricalStateItem: '',
                categoryStates: []
            },
            descriptors: sorted.descriptors,
            sortBy,
            sortDirection,
            sortedTargets: sorted.sortedTargets,
            model
        };

        this.toggle = this.toggle.bind(this);
        this.toggleTargetType = this.toggleTargetType.bind(this);
        this.saveTarget = this.saveTarget.bind(this);
        this._saveTargetType = this._saveTargetType.bind(this);
        this.handleContextMenu = this.handleContextMenu.bind(this);
        this.handleInputChange = this.handleInputChange.bind(this);
        this.handleTargetTypeInputChange = this.handleTargetTypeInputChange.bind(this);
        this.handleTargetTypeInputChangeForEdit = this.handleTargetTypeInputChangeForEdit.bind(this);
        this.handleCategoricalStateInputChangeForEdit = this.handleCategoricalStateInputChangeForEdit.bind(this);
    }

    componentDidMount() {
        if (this.props.editTargetId) {
            this.handleContextMenu(null, {action: 'edit', atarget: this.props.editTargetId})
        }
    }

    componentWillReceiveProps(nextProps) {
        this._resortTable();
    }

    componentDidUpdate(prevProps, prevState) {
        if (!prevProps.tabVisible) {
            this._setTableHeight();
        }
        //If there has been add or update action, we have to refresh list
        if (this.state.form.targetName !== prevState.form.targetName ||
            prevState.descriptors.length !== this.state.descriptors.length) {
            this._resortTable();
        }
    }

    _resortTable = (skipSave) => {
        let descriptors = [];
        if (this.props.taxonomyModel) {
            if (this.props.taxonomyModel.model === MODEL_XPER) {
                descriptors = convertSDDtoJson(path.join(getTaxonomyDir(), this.props.taxonomyModel.sddPath)).items
            }
            if (this.props.taxonomyModel.model === MODEL_ANNOTATE) {
                descriptors = loadTaxonomy(this.props.taxonomyModel.id);
            }
        }
        const unsortedTargets = descriptors ? descriptors.map(target => {
            return {
                id: target.id,
                name: target.targetName,
                targetType: target.targetType,
                color: target.targetColor,
                annotationType: target.annotationType
            }
        }) : [];

        if (!skipSave) {
            this.setState({sortedTargets: this._sortList(this.state.sortBy, this.state.sortDirection, unsortedTargets)});
        } else {
            return {
                sortedTargets: this._sortList('name', 'ASC', unsortedTargets),
                descriptors
            };
        }
    };

    _sort = (sortBy, sortDirection) => {
        const sortedTargets = this._sortList(sortBy, sortDirection);
        this.setState({sortBy, sortDirection, sortedTargets});
    };

    _sortList(sortBy, sortDirection, initList) {
        const list = initList || this.state.sortedTargets;
        const sorted = lodash.sortBy(list, _ => (typeof _[sortBy] === 'string' ? _[sortBy].toLowerCase() : _[sortBy]));
        return sortDirection === 'DESC' ? lodash.reverse(sorted) : sorted;
    }

    _setTableHeight = () => {
        let height = calculateTableHeight(this.pane , 0);
        this.setState({
            height: height
        });
    };

    toggle = () => {
        this.setState({
            modal: !this.state.modal
        });
    };

    toggleTargetType = () => {
        const targetTypeInput = !this.state.targetTypeModal ? '' : this.state.targetTypeInput;
        this.setState({
            targetTypeModal: !this.state.targetTypeModal,
            targetTypeInput
        });
    };

    toggleTargetTypeEdit = () => {
        const targetTypeInputEdit = !this.state.targetTypeModalEdit ? '' : this.state.targetTypeInputEdit;
        this.setState({
            targetTypeModalEdit: !this.state.targetTypeModalEdit,
            targetTypeInputEdit
        });
    };

    _saveTargetType = () => {
        this.props.saveTargetType(this.props.taxonomyModel.id, this.state.targetTypeInput);
        this.toggleTargetType();
    };

    _deleteTargetType = () => {
        const { t } = this.props;
        if (!this.state.form.targetType){
            alert(t('models.target_descriptors.dialog_edit.alert_select_target_group_to_delete'));
        } else{
            this.props.deleteTargetType(this.props.taxonomyModel.id, this.state.form.targetType);
            this.setState(prevState => ({
                form: {
                    ...prevState.form,
                    targetType: ''
                }
            }));
        }
    };

    toggleCategoricalStateItemModal = () => {
        this.setState({
            categoricalStateItemModal: !this.state.categoricalStateItemModal,
            categoricalStateItemModalInEdit: false,
        });
    };

    toggleCategoricalStateItemEdit = () => {
        const { t } = this.props;
        if (!this.state.form.categoricalStateItem){
            alert(t('models.target_descriptors.dialog_edit.alert_select_categorical_state_item_to_edit'));
            return;
        }
        const stateItem = this.state.form.categoryStates.find(value => value.id === this.state.form.categoricalStateItem);
        this.setState(prevState => ({
            categoricalStateItemModal: !this.state.categoricalStateItemModal,
            categoricalStateItemInput: stateItem.name,
            categoricalStateItemModalInEdit: true,
        }));
    };

    _saveCategoricalStateItem = () => {
        const { t } = this.props;
        if(!this.state.categoricalStateItemInput) {
            alert(t('models.target_descriptors.dialog_edit_categorical_state_item.alert_categorical_state_item_is_empty'));
            return;
        }
        if (this.state.form.categoryStates.some(value => value.name === this.state.categoricalStateItemInput)) {
            alert(t('models.target_descriptors.dialog_edit_categorical_state_item.alert_categorical_state_item_already_exist'));
            return;
        }
        if (this.state.categoricalStateItemModalInEdit) {
            const stateItem = this.state.form.categoryStates.find(value => value.id === this.state.form.categoricalStateItem);
            stateItem.name = this.state.categoricalStateItemInput;
            this.setState(prevState => ({
                form: {
                    ...prevState.form,
                    categoryStates: [...prevState.form.categoryStates]
                },
                categoricalStateItemInput: ''
            }));
        } else {
            this.setState(prevState => ({
                form: {
                    ...prevState.form,
                    categoryStates: [...prevState.form.categoryStates,
                        {
                            id: chance.guid(),
                            name: prevState.categoricalStateItemInput
                        }
                    ]
                },
                categoricalStateItemInput: ''
            }));
        }
        this.toggleCategoricalStateItemModal();
    };

    _deleteCategoricalStateItem = () => {
        const { t } = this.props;
        if (!this.state.form.categoricalStateItem){
            alert(t('models.target_descriptors.dialog_edit.alert_select_categorical_state_item_to_delete'));
        } else {
            this.setState(prevState => ({
                form: {
                    ...prevState.form,
                    categoryStates: prevState.form.categoryStates.filter(value => value.id !== this.state.form.categoricalStateItem),
                    categoricalStateItem: ''
                }
            }));
        }
    };

    saveTarget = () => {
        if (this.state.form.targetName) {
            if (this.state.form.id) {
                this.props.editTargetDescriptor(
                    this.props.taxonomyModel.id,
                    this.state.form.id,
                    this.state.form.targetName,
                    this.state.form.targetType,
                    this.state.form.targetColor,
                    this.state.form.unit,
                    this.state.form.annotationType,
                    this.state.form.includeInCalculation,
                    this.state.form.categoryStates);

                const descriptors = [...this.state.descriptors];
                const desc = descriptors.find(target => target.id === this.state.form.id);
                desc.targetName = this.state.form.targetName;
                desc.targetType = this.state.form.targetType;
                desc.targetColor = this.state.form.targetColor
                desc.unit = this.state.form.unit
                desc.annotationType = this.state.form.annotationType;
                desc.includeInCalculation = this.state.form.includeInCalculation;
                desc.states = this.state.form.categoryStates;
                this.setState({descriptors})
                this.toggle();
                this._cancel();
            } else {
                if (this.state.form.targetName !== '' &&
                    (this.state.form.unit !== '' || this.state.form.annotationType !== NUMERICAL) &&
                    this.state.form.annotationType !== '' &&
                    (this.state.form.categoryStates.length > 0 || this.state.form.annotationType !== CATEGORICAL)) {
                    const id = chance.guid();
                    this.props.createTargetDescriptor(
                        this.props.taxonomyModel.id,
                        id,
                        this.state.form.targetName,
                        this.state.form.targetType,
                        this.state.form.targetColor,
                        this.state.form.unit,
                        this.state.form.annotationType,
                        this.state.form.includeInCalculation,
                        this.state.form.categoryStates
                    );
                    this.state.descriptors.push({
                        id: id,
                        targetName: this.state.form.targetName,
                        targetType: this.state.form.targetType,
                        targetColor: this.state.form.targetColor,
                        unit: this.state.form.unit,
                        annotationType: this.state.form.annotationType,
                        includeInCalculation: this.state.form.includeInCalculation,
                        states: this.state.form.categoryStates
                    });
                    this.toggle();
                    this._cancel();
                }
            }
        }
    };

    _cancel = () => {
        const { t } = this.props;
        this.setState({
            modalTitle: t('models.target_descriptors.dialog_edit.title_new_character'),
            form: {
                id: '',
                targetName: '',
                targetType: '',
                targetColor: '#f44336',
                unit: '',
                annotationType: '',
                includeInCalculation: true,
                categoricalStateItem:'',
                categoryStates: []
            }
        });
    };

    handleTargetTypeInputChange(event) {
        this.setState({
            targetTypeInput: event.target.value
        });
    }

    handleTargetTypeInputChangeForEdit(event) {
        this.setState({
            targetTypeInputEdit: event.target.value
        });
    }

    handleCategoricalStateInputChangeForEdit(event) {
        this.setState({
            categoricalStateItemInput: event.target.value
        });
    }

    handleInputChange(event) {
        const target = event.target;
        const value = target.type === 'checkbox' ? target.checked : target.value;
        const name = target.name;
        let form = this.state.form;
        if (target.type === 'select-one' || target.type === 'select-multiple') {
            form[name] = target.selectedOptions[0].dataset[name];
        } else {
            form[name] = value;
        }
        if(form.annotationType !== CATEGORICAL) {
            form.categoryStates = []
        }
        if(form.annotationType !== NUMERICAL) {
            form.unit = ''
            form.includeInCalculation = false
        }
        this.setState({
            form
        });
        this.forceUpdate();
    }

    handleContextMenu = (e, data) => {
        const { t } = this.props;
        switch (data.action) {
            case 'edit':
                const target = this.state.descriptors.find(target => data.atarget === target.id);
                this.setState({
                    modalTitle: t('models.target_descriptors.dialog_edit.title_edit_character'),
                    form: {
                        id: target.id,
                        targetName: target.targetName,
                        targetType: target.targetType,
                        targetColor: target.targetColor,
                        unit: target.unit,
                        annotationType: target.annotationType,
                        includeInCalculation: target.includeInCalculation,
                        categoryStates: target.states
                    }
                });
                this.toggle();
                break;
            case 'delete':
                let descIndex = -1;
                const descriptors = [...this.state.descriptors];
                descriptors.find((target, index) => {
                    if (target.id === data.atarget) {
                        descIndex = index;
                        return true;
                    } else return false;
                });
                descriptors.splice(descIndex, 1);
                this.setState({descriptors})
                this.props.deleteTargetDescriptor(this.props.taxonomyModel.id, data.atarget);
                break;
        }
    };

    render() {
        let key = 0;
        const { t } = this.props;
        return (
            <div className="bst rcn_targets">
                <div className="bg">
                    <a onClick={() => {
                        this.props.goToLibrary();
                    }}> <img alt="logo" src={RECOLNAT_LOGO} className="logo" title={t('global.logo_tooltip_go_to_home_page')}/>
                    </a>
                    <span className="title">{t('models.target_descriptors.title')}</span>
                </div>
                <br/>
                <Row>
                    <Col  md={12}  className="text-md-center">
                        <h5>Model: {this.props.taxonomyModel.name}</h5>
                    </Col>
                </Row>
                <Row className="action-bar">
                    <Col md={12}>
                        {this.state.model !== MODEL_XPER?
                            <Button  className="btn btn-primary mr-md-3" title={t('models.target_descriptors.btn_tooltip_add_new_character')}  color="primary" style={{marginLeft: "10px"}}
                                     disabled={this.state.model === MODEL_XPER} onClick={this.toggle}>{t('models.target_descriptors.btn_add_new_character')}</Button>
                            :''}

                        <Button  className="btn btn-primary mr-md-3" color="secondary"
                                 onClick={() => {
                                     this.props.goBack();
                                 }}>{t('models.target_descriptors.btn_return_to_list_of_models')}
                        </Button>
                    </Col>
                </Row>
                <br/>
                <Row>
                    <Col>
                        <div className="scrollable-table-wrapper" id="wrapper" ref={_ => (this.pane = _)}
                             style={{height: this.state.height}}>

                            <Table hover size="sm" className="targets-table">
                                <thead title={t('models.thead_tooltip_sort_order')}>
                                <tr>
                                    <th>&nbsp;</th>
                                    <TableHeader title={t('models.target_descriptors.table_column_character_name')} sortKey="name"
                                                 sortedBy={this.state.sortBy} sort={this._sort}/>
                                    <TableHeader title={t('models.target_descriptors.table_column_character_group')} sortKey="targetType"
                                                 sortedBy={this.state.sortBy} sort={this._sort}/>
                                    <TableHeader title={t('models.target_descriptors.table_column_annotation_type')} sortKey="annotationType"
                                                 sortedBy={this.state.sortBy} sort={this._sort}/>
                                    <TableHeader title={t('models.target_descriptors.table_column_color')} sortKey="color"
                                                 sortedBy={this.state.sortBy} sort={this._sort}/>
                                </tr>
                                </thead>
                                <tbody>
                                {this.state.sortedTargets.map(target => {
                                    return (
                                        <tr key={key++} className={this.props.selectedId === target.id ? 'selected-item' : ''}>
                                            <th scope="row" >&nbsp;</th>
                                            <td>
                                                <ContextMenuTrigger id="target_context_menu"
                                                                    disable={this.state.model === MODEL_XPER}
                                                                    collect={() => {
                                                                        return {
                                                                            atarget: target.id
                                                                        };
                                                                    }}>
                                                    <span>{target.name}</span>
                                                </ContextMenuTrigger>
                                            </td>
                                            <td>
                                                <ContextMenuTrigger id="target_context_menu"
                                                                    disable={this.state.model === MODEL_XPER}
                                                                    collect={() => {
                                                                        return {
                                                                            atarget: target.id
                                                                        };
                                                                    }}>
                                                    <span>{target.targetType}</span>
                                                </ContextMenuTrigger>
                                            </td>
                                            <td>{target.annotationType}</td>
                                            <td><span style={{backgroundColor: target.color}}
                                                      className="color-circle"/>&nbsp;{target.color}</td>
                                        </tr>
                                    );
                                })}
                                </tbody>
                            </Table>
                        </div>
                    </Col>
                </Row>

                <div>
                    <ContextMenu id="target_context_menu">
                        <MenuItem data={{action: 'edit'}} onClick={this.handleContextMenu}>
                            <i className="fa fa-pencil" aria-hidden="true"/> {t('global.edit')}
                        </MenuItem>
                        <MenuItem divider/>
                        <MenuItem data={{action: 'delete'}} onClick={this.handleContextMenu}>
                            <i className="fa fa-trash" aria-hidden="true"/> {t('global.delete')}
                        </MenuItem>
                    </ContextMenu>
                </div>

                <div>
                    <Modal isOpen={this.state.modal} toggle={this.toggle} wrapClassName="bst rcn_targets"
                           onClosed={this._cancel}>
                        <ModalHeader toggle={this.toggle}>{this.state.modalTitle}</ModalHeader>
                        <ModalBody>
                            <Form onSubmit={(e) => {
                                e.preventDefault();
                            }} ref={_ => (this.form = _)}>
                                <FormGroup>
                                    <Label>{t('models.target_descriptors.dialog_edit.lbl_model_name')}: {this.props.taxonomyModel.name}</Label>
                                </FormGroup>
                                <FormGroup>
                                    <Label for="targetName">{t('models.target_descriptors.dialog_edit.lbl_character_name')}</Label>
                                    <Input type="text" name="targetName" id="targetName"
                                           defaultValue={this.state.form.targetName}
                                           onChange={this.handleInputChange}
                                    />
                                </FormGroup>
                                <FormGroup>
                                    <Label for="targetType">{t('models.target_descriptors.dialog_edit.lbl_character_group')}</Label>
                                    <Row>
                                        <Col md={8}>
                                            <Input type="select" name="targetType" id="targetType"
                                                   defaultValue={this.state.form.targetType}
                                                   onChange={this.handleInputChange}>
                                                <option data-target-type=""/>
                                                {this.props.taxonomyModel.targetTypes ?
                                                    this.props.taxonomyModel.targetTypes.map((type, index) => {
                                                        return <option key={`td_${index}`} data-target-type={type}>{type}</option>;
                                                    }) : ''}
                                            </Input>
                                        </Col>
                                        <Col md={4} className='crud-icons-wrapper'>
                                            <i className="fa fa-plus-square fa-lg crud-icons" aria-hidden="true" onClick={this.toggleTargetType} disabled={!this.state.form.targetType}/>
                                            <i className="fa fa-pencil fa-lg  crud-icons" aria-hidden="true"  onClick={this.toggleTargetTypeEdit} disabled={!this.state.form.targetType}/>
                                            <i className="fa fa-trash fa-lg crud-icons" aria-hidden="true" onClick={this._deleteTargetType} disabled={!this.state.form.targetType}/>
                                        </Col>
                                    </Row>
                                </FormGroup>
                                <FormGroup>
                                    <Label for="annotationType">{t('models.target_descriptors.dialog_edit.lbl_annotation_type')}</Label>
                                    <Input type="select" name="annotationType" id="annotationType"
                                           defaultValue={this.state.form.annotationType}
                                           onChange={this.handleInputChange} disabled={this.state.form.id}>
                                        <option data-annotation-type="" value=""/>
                                        <option data-annotation-type={NUMERICAL} value={NUMERICAL}>physic</option>
                                        <option data-annotation-type={CATEGORICAL} value={CATEGORICAL}>enumeration</option>
                                        <option data-annotation-type={INTEREST} value={INTEREST}>interest</option>
                                        <option disabled data-annotation-type={TEXTUAL} value={TEXTUAL}>text</option>
                                    </Input>
                                </FormGroup>
                                {this.state.form.annotationType === CATEGORICAL &&
                                    <FormGroup className="category-states-container">
                                        <Label for="categoricalStateItem">{t('models.target_descriptors.dialog_edit.lbl_enum_states')}</Label>
                                        <Row>
                                            <Col md={8}>
                                                <Input type="select" multiple='multiple' name="categoricalStateItem" id="categoricalStateItem"
                                                       onChange={this.handleInputChange}>
                                                    {
                                                        this.state.form.categoryStates.map((type, index) => {
                                                            return <option key={`td_${index}`} data-categorical-state-item={type.id}>{type.name}</option>;
                                                        })
                                                    }
                                                </Input>
                                            </Col>
                                            <Col md={4} className='crud-icons-wrapper'>
                                                <i className="fa fa-plus-square fa-lg crud-icons" aria-hidden="true" onClick={this.toggleCategoricalStateItemModal}/>
                                                <i className="fa fa-pencil fa-lg  crud-icons" aria-hidden="true"  onClick={this.toggleCategoricalStateItemEdit} disabled={!this.state.form.categoricalStateItem}/>
                                                <i className="fa fa-trash fa-lg crud-icons" aria-hidden="true" onClick={this._deleteCategoricalStateItem} disabled={!this.state.form.categoricalStateItem}/>
                                            </Col>
                                        </Row>
                                    </FormGroup>
                                }
                                <FormGroup>
                                    <Label for="unit">{t('models.target_descriptors.dialog_edit.lbl_unit')}</Label>
                                    <Input type="select" name="unit" id="unit"
                                           value={this.state.form.unit}
                                           disabled={this.state.form.id || this.state.form.annotationType !== NUMERICAL}
                                           onChange={this.handleInputChange}>
                                        <option data-unit=""/>
                                        <option data-unit="mm">mm</option>
                                        <option data-unit="mm²">mm²</option>
                                        <option data-unit="°">°</option>
                                        <option data-unit="#">#</option>
                                    </Input>
                                </FormGroup>
                                <FormGroup>
                                    <Label for="targetColor">{t('models.target_descriptors.dialog_edit.lbl_color')}</Label>
                                    <Row>
                                        {colors.map((color, index) => {
                                            return <Col key={index} md={2} lg={2} sm={2}><span className="radio-button"
                                                                                               key={index}>
                                            <input defaultChecked={this.state.form.targetColor === color} type="radio"
                                                   value={color} id={'targetColor' + index} name="targetColor"
                                                   onChange={this.handleInputChange}/>
                                            <label htmlFor={'targetColor' + index}><span
                                                style={{backgroundColor: color}}/></label>
                                        </span>
                                            </Col>
                                        })}
                                    </Row>
                                </FormGroup>
                                <FormGroup check>
                                    <Label check>
                                        <Input type="checkbox" name="includeInCalculation" id="includeInCalculation"
                                               checked={this.state.form.includeInCalculation}
                                               disabled={this.state.form.id || this.state.form.annotationType !== NUMERICAL}
                                               onChange={this.handleInputChange}>
                                        </Input>
                                        {t('models.target_descriptors.dialog_edit.lbl_checkbox_include_in_calculation')}
                                    </Label>
                                </FormGroup>
                            </Form>
                        </ModalBody>
                        <ModalFooter>
                            <Button color="primary" onClick={this.saveTarget}>{t('global.save')}</Button>
                            <Button color="secondary" onClick={this.toggle}>{t('global.cancel')}</Button>
                        </ModalFooter>
                    </Modal>

                    <Modal isOpen={this.state.targetTypeModal} toggle={this.toggleTargetType}
                           wrapClassName="bst rcn_targets">
                        <ModalHeader toggle={this.toggleTargetType}>{t('models.target_descriptors.dialog_create_new_character_group.title')}</ModalHeader>
                        <ModalBody>
                            <Form onSubmit={(e) => {
                                e.preventDefault();
                            }}>
                                <FormGroup>
                                    <Label for="targetType">{t('models.target_descriptors.dialog_create_new_character_group.lbl_character_group')}</Label>
                                    <Input type="text" name="targetType" id="targetType"
                                           onChange={this.handleTargetTypeInputChange}
                                    />
                                </FormGroup>
                            </Form>
                        </ModalBody>
                        <ModalFooter>
                            <Button color="primary" onClick={this._saveTargetType}>{t('global.save')}</Button>
                            <Button color="secondary" onClick={this.toggleTargetType}>{t('global.cancel')}</Button>
                        </ModalFooter>
                    </Modal>

                    {/*Edit Target Group*/}
                    <Modal isOpen={this.state.targetTypeModalEdit} toggle={this.toggleTargetTypeEdit}
                           wrapClassName="bst rcn_targets">
                        <ModalHeader toggle={this.toggleTargetTypeEdit}>{t('models.target_descriptors.dialog_edit_character_group.title')}</ModalHeader>
                        <ModalBody>
                            <Form onSubmit={(e) => {
                                e.preventDefault();
                            }}>
                                <FormGroup>
                                    <Label for="targetTypeEdit">{t('models.target_descriptors.dialog_edit_character_group.lbl_group_name')}</Label>
                                    <Input type="text" name="targetTypeEdit" id="targetTypeEdit"
                                           onChange={this.handleTargetTypeInputChangeForEdit}
                                    />
                                </FormGroup>
                            </Form>
                        </ModalBody>
                        <ModalFooter>
                            <Button color="primary" onClick={this._editTargetType}>{t('global.save')}</Button>
                            <Button color="secondary" onClick={this.toggleTargetTypeEdit}>{t('global.cancel')}</Button>
                        </ModalFooter>
                    </Modal>
                    {/*Edit Categorical state item*/}
                    <Modal isOpen={this.state.categoricalStateItemModal} toggle={this.toggleCategoricalStateItemModal}
                           wrapClassName="bst rcn_targets">
                        <ModalHeader toggle={this.toggleCategoricalStateItemModal}>{t('models.target_descriptors.dialog_edit_categorical_state_item.title')}</ModalHeader>
                        <ModalBody>
                            <Form onSubmit={(e) => {
                                e.preventDefault();
                            }}>
                                <FormGroup>
                                    <Label for="categoricalStateEdit">{t('models.target_descriptors.dialog_edit_categorical_state_item.lbl_state_name')}</Label>
                                    <Input type="text" name="categoricalStateEdit" id="categoricalStateEdit" value={this.state.categoricalStateItemInput}
                                           onChange={this.handleCategoricalStateInputChangeForEdit}
                                    />
                                </FormGroup>
                            </Form>
                        </ModalBody>
                        <ModalFooter>
                            <Button color="primary" onClick={this._saveCategoricalStateItem}>{t('global.save')}</Button>
                            <Button color="secondary" onClick={this.toggleCategoricalStateItemModal}>{t('global.cancel')}</Button>
                        </ModalFooter>
                    </Modal>
                </div>
            </div>
        );
    }
}

export default TargetDescriptors;
