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
            form: {
                id: '',
                targetName: '',
                targetType: '',
                targetColor: '#f44336',
                unit: '',
                annotationType: '',
                includeInCalculation: true
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

    }

    componentDidMount() {
        if (this.props.editTargetId) {
            this.handleContextMenu(null, {action: 'edit', atarget: this.props.editTargetId})
        }
    }

    componentWillReceiveProps(nextProps) {
        console.log('next props from target descriptor...' , nextProps)
        if (nextProps.taxonomy == null && nextProps.taxonomyModel && nextProps.taxonomyModel.id !== ''){
            console.log('setting new taxonomy -> ' ,nextProps.taxonomyModel.id )
            this.props.setSelectedTaxonomy(nextProps.taxonomyModel.id);
        }
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
        if (!this.state.form.targetType){
            alert('please select target group you want to delete.')
        }else{
            this.props.deleteTargetType(this.props.taxonomyModel.id, this.state.form.targetType);
            this.setState(prevState => ({
                form: {
                    ...prevState.form,
                    targetType: ''
                }
            }));
        }
    };

    _editTargetType = () => {
        if (!this.state.form.targetType){
            alert('please select target group you want to edit.')
        }else{
            this.props.editTargetType(this.props.taxonomyModel.id, this.state.form.targetType , this.state.targetTypeInputEdit);
            this.setState(prevState => ({
                form: {
                    ...prevState.form,
                    targetType: this.state.targetTypeInputEdit
                }
            }));
            this.toggleTargetTypeEdit();
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
                    this.state.form.includeInCalculation);

                const descriptors = [...this.state.descriptors];
                const desc = descriptors.find(target => target.id === this.state.form.id);
                desc.targetName = this.state.form.targetName;
                desc.targetType = this.state.form.targetType;
                desc.targetColor = this.state.form.targetColor
                desc.unit = this.state.form.unit
                desc.annotationType = this.state.form.annotationType;
                desc.includeInCalculation = this.state.form.includeInCalculation;
                this.setState({descriptors})

                this.toggle();
                this._cancel();
            } else {
                if (this.state.form.targetName !== '' &&
                    (this.state.form.unit !== '' || this.state.form.annotationType !== NUMERICAL) &&
                    this.state.form.annotationType !== '') {
                    const id = chance.guid();
                    this.props.createTargetDescriptor(
                        this.props.taxonomyModel.id,
                        id,
                        this.state.form.targetName,
                        this.state.form.targetType,
                        this.state.form.targetColor,
                        this.state.form.unit,
                        this.state.form.annotationType,
                        this.state.form.includeInCalculation);
                    this.state.descriptors.push({
                        id: id,
                        targetName: this.state.form.targetName,
                        targetType: this.state.form.targetType,
                        targetColor: this.state.form.targetColor,
                        unit: this.state.form.unit,
                        annotationType: this.state.form.annotationType,
                        includeInCalculation: this.state.form.includeInCalculation
                    });
                    this.toggle();
                    this._cancel();
                }
            }
        }
    };

    _cancel = () => {
        this.setState({
            modalTitle: 'New character',
            form: {
                id: '',
                targetName: '',
                targetType: '',
                targetColor: '#f44336',
                unit: '',
                annotationType: '',
                includeInCalculation: true
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

    handleInputChange(event) {
        const target = event.target;
        const value = target.type === 'checkbox' ? target.checked : target.value;
        const name = target.name;
        let form = this.state.form;

        if (target.type === 'select-one') {
            form[name] = target.selectedOptions[0].dataset[name];
        } else {
            form[name] = value;

        }
        this.setState({
            form
        });
        this.forceUpdate();
    }

    handleContextMenu = (e, data) => {
        switch (data.action) {
            case 'edit':
                const t = this.state.descriptors.find(target => data.atarget === target.id);

                this.setState({
                    modalTitle: 'Edit character',
                    form: {
                        id: t.id,
                        targetName: t.targetName,
                        targetType: t.targetType,
                        targetColor: t.targetColor,
                        unit: t.unit,
                        annotationType: t.annotationType,
                        includeInCalculation: t.includeInCalculation
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
        return (
            <div className="bst rcn_targets">
                <div className="bg">
                    <a onClick={() => {
                        this.props.goToLibrary();
                    }}> <img alt="logo" src={RECOLNAT_LOGO} className="logo" title={"Go back to home page"}/>
                    </a>
                    <span className="title">Target descriptors</span>
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
                            <Button  className="btn btn-primary mr-md-3" title="Create a new character"  color="primary" style={{marginLeft: "10px"}}
                                     disabled={this.state.model === MODEL_XPER} onClick={this.toggle}>Add new character</Button>
                            :''}

                        <Button  className="btn btn-primary mr-md-3" color="secondary"
                                 onClick={() => {
                                     this.props.goBack();
                                 }}>Return to list of models
                        </Button>
                    </Col>
                </Row>
                <br/>
                <Row>
                    <Col>
                        <div className="scrollable-table-wrapper" id="wrapper" ref={_ => (this.pane = _)}
                             style={{height: this.state.height}}>

                            <Table hover size="sm" className="targets-table">
                                <thead title="Ascendant or descendant order">
                                <tr>
                                    <th>&nbsp;</th>
                                    <TableHeader title="Character name" sortKey="name"
                                                 sortedBy={this.state.sortBy} sort={this._sort}/>
                                    <TableHeader title="Character group" sortKey="targetType"
                                                 sortedBy={this.state.sortBy} sort={this._sort}/>
                                    <TableHeader title="Annotation type" sortKey="annotationType"
                                                 sortedBy={this.state.sortBy} sort={this._sort}/>
                                    <TableHeader title="Color" sortKey="color"
                                                 sortedBy={this.state.sortBy} sort={this._sort}/>
                                </tr>
                                </thead>
                                <tbody>
                                {this.state.sortedTargets.map(target => {
                                    return (
                                        <tr key={key++}>
                                            <th scope="row">&nbsp;</th>
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
                            <i className="fa fa-pencil" aria-hidden="true"/> Edit
                        </MenuItem>
                        <MenuItem divider/>
                        <MenuItem data={{action: 'delete'}} onClick={this.handleContextMenu}>
                            <i className="fa fa-trash" aria-hidden="true"/> Delete
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
                                    <Label>Model name: {this.props.taxonomyModel.name}</Label>
                                </FormGroup>
                                <FormGroup>
                                    <Label for="targetName">Character name</Label>
                                    <Input type="text" name="targetName" id="targetName"
                                           defaultValue={this.state.form.targetName}
                                           onChange={this.handleInputChange}
                                    />
                                </FormGroup>
                                <FormGroup>
                                    <Label for="targetType">Character group</Label>
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
                                    <Label for="annotationType">Annotation type</Label>
                                    <Input type="select" name="annotationType" id="annotationType"
                                           defaultValue={this.state.form.annotationType}
                                           onChange={this.handleInputChange} disabled={this.state.form.id}>
                                        <option data-annotation-type="" value=""/>
                                        <option data-annotation-type={NUMERICAL} value={NUMERICAL}>physic</option>
                                        <option disabled data-annotation-type={CATEGORICAL} value={CATEGORICAL}>enumeration</option>
                                        <option data-annotation-type={INTEREST} value={INTEREST}>interest</option>
                                        <option disabled data-annotation-type={TEXTUAL} value={TEXTUAL}>text</option>
                                    </Input>
                                </FormGroup>
                                <FormGroup>
                                    <Label for="unit">Unit</Label>
                                    <Input type="select" name="unit" id="unit"
                                           defaultValue={this.state.form.unit}
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
                                    <Label for="targetColor">Color</Label>
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
                                               defaultChecked={this.state.form.includeInCalculation}
                                               disabled={this.state.form.id || this.state.form.annotationType !== NUMERICAL}
                                               onChange={this.handleInputChange}>
                                        </Input>
                                        Calculate standard deviation and average value
                                    </Label>
                                </FormGroup>
                            </Form>
                        </ModalBody>
                        <ModalFooter>
                            <Button color="primary" onClick={this.saveTarget}>Save</Button>
                            <Button color="secondary" onClick={this.toggle}>Cancel</Button>
                        </ModalFooter>
                    </Modal>


                    <Modal isOpen={this.state.targetTypeModal} toggle={this.toggleTargetType}
                           wrapClassName="bst rcn_targets">
                        <ModalHeader toggle={this.toggleTargetType}>Create new character group</ModalHeader>
                        <ModalBody>
                            <Form onSubmit={(e) => {
                                e.preventDefault();
                            }}>
                                <FormGroup>
                                    <Label for="targetType">Character group</Label>
                                    <Input type="text" name="targetType" id="targetType"
                                           onChange={this.handleTargetTypeInputChange}
                                    />
                                </FormGroup>
                            </Form>
                        </ModalBody>
                        <ModalFooter>
                            <Button color="primary" onClick={this._saveTargetType}>Save</Button>
                            <Button color="secondary" onClick={this.toggleTargetType}>Cancel</Button>
                        </ModalFooter>
                    </Modal>

                    {/*Edit Target Group*/}
                    <Modal isOpen={this.state.targetTypeModalEdit} toggle={this.toggleTargetTypeEdit}
                           wrapClassName="bst rcn_targets">
                        <ModalHeader toggle={this.toggleTargetTypeEdit}>Edit character group name</ModalHeader>
                        <ModalBody>
                            <Form onSubmit={(e) => {
                                e.preventDefault();
                            }}>
                                <FormGroup>
                                    <Label for="targetTypeEdit">New group name</Label>
                                    <Input type="text" name="targetTypeEdit" id="targetTypeEdit"
                                           onChange={this.handleTargetTypeInputChangeForEdit}
                                    />
                                </FormGroup>
                            </Form>
                        </ModalBody>
                        <ModalFooter>
                            <Button color="primary" onClick={this._editTargetType}>Save</Button>
                            <Button color="secondary" onClick={this.toggleTargetTypeEdit}>Cancel</Button>
                        </ModalFooter>
                    </Modal>

                </div>
            </div>
        );
    }


}

export default TargetDescriptors;
