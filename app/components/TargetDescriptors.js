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
import {getTaxonomyDir, loadTaxonomy, saveTaxonomy} from "../utils/config";
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
            relationsModal: false,
            relationItemModal: false,
            imageDetectAlignmentModal: false,
            selectedImageDetectClass: null,
            selectedImageDetectClassGroup: null,
            selectedTarget: {
                targetId: null,
                targetName: null,
                targetType: null
            },
            relationsModalInEdit: false,
            relationItemModalInEdit: false,
            relationItemEditInput: '',
            form: {
                id: '',
                targetName: '',
                targetType: '',
                targetColor: '#f44336',
                unit: '',
                annotationType: '',
                includeInCalculation: true,
                categoricalStateItem: '',
                categoryStates: [],
                selectedRelations: []
            },
            formRelations: {
                relations: [],
                relationItem: ''
            },
            descriptors: sorted.descriptors,
            sortBy,
            sortDirection,
            sortedTargets: sorted.sortedTargets,
            model,
            imageDetectModel: this.props.imageDetectModel || [],
            errorAlignment: false,
            selectedTaxonomy: this.props.taxonomyModel
        };
        this.toggle = this.toggle.bind(this);
        this.toggleTargetType = this.toggleTargetType.bind(this);
        this.saveTarget = this.saveTarget.bind(this);
        this._saveTargetType = this._saveTargetType.bind(this);
        this.handleContextMenu = this.handleContextMenu.bind(this);
        this.handleInputChange = this.handleInputChange.bind(this);
        this.handleRelationsInputChange = this.handleRelationsInputChange.bind(this);
        this.handleTargetTypeInputChange = this.handleTargetTypeInputChange.bind(this);
        this.handleTargetTypeInputChangeForEdit = this.handleTargetTypeInputChangeForEdit.bind(this);
        this.handleCategoricalStateInputChangeForEdit = this.handleCategoricalStateInputChangeForEdit.bind(this);
        this.handleRelationInputChangeForEdit = this.handleRelationInputChangeForEdit.bind(this);
        this.saveAlignment = this.saveAlignment.bind(this);
        this._removeAlignment = this._removeAlignment.bind(this);
        this.saveTaxonomyRelations = this.saveTaxonomyRelations.bind(this);
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
            const relationNames = target.selectedRelations?.map(r => r.name).join(', ') || '';
            return {
                id: target.id,
                name: target.targetName,
                targetType: target.targetType,
                color: target.targetColor,
                annotationType: target.annotationType,
                selectedRelations: relationNames
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

    toggleRelationItemModal = () => {
        this.setState({
            relationItemModal: !this.state.relationItemModal,
            relationItemModalInEdit: false
        });
    };

    toggleRelationsModal = () => {
        this.setState({
            relationsModal: !this.state.relationsModal,
            relationsModalInEdit: false,
        });
    };

    openRelationsModal = () => {
        const relations = this.state.selectedTaxonomy.relations || [];
        this.setState({
            formRelations: {
                relations: relations
            },
            relationsModal: true
        });
    };

    toggleImageDetectAlignmentModal = () => {
        this.setState({
            imageDetectAlignmentModal: false,
            selectedTarget: {
                targetId: null,
                targetName: null,
                targetType: null
            },
            selectedImageDetectClass: null,
            selectedImageDetectClassGroup: null,
            errorAlignment: false
        });
    };

    setAlignment = (targetId, targetName, targetType) => {
        this.setState({
            selectedTarget: {
                targetId: targetId,
                targetName: targetName,
                targetType: targetType
            },
            imageDetectAlignmentModal: !this.state.imageDetectAlignmentModal,
        });
    };

    handleImageDetectClassChange = (e) => {
        if (e.target.id == "imageDetectClasses"){
            this.setState({
                selectedImageDetectClass: e.target.value,
                selectedImageDetectClassGroup: null
            });
        }
        if (e.target.id == "imageDetectClassesGroup"){
            this.setState({
                selectedImageDetectClass: null,
                selectedImageDetectClassGroup: e.target.value
            });
        }
    }

    saveAlignment = () => {
       let alignmentObject = null;
       if(this.state.selectedImageDetectClass != null){
            alignmentObject = {
                groupId: null,
                characterId: this.state.selectedTarget.targetId,
                imageDetectClassId: this.state.selectedImageDetectClass
            }
       }
        if(this.state.selectedImageDetectClassGroup != null){
             alignmentObject = {
                groupId: this.state.selectedTarget.targetType,
                characterId: null,
                imageDetectClassId: this.state.selectedImageDetectClassGroup
            }
        }
        const imageDetectAlignments = this.props.imageDetectAlignments;
        let isClassIdAssigned = false;
        const existingIndex = imageDetectAlignments.findIndex(
            (entry) =>
                entry[this.props.taxonomyModel.id] &&
                entry[this.props.taxonomyModel.id][this.state.imageDetectModel.id]
        );

        if (existingIndex !== -1) {
            const existingEntry = imageDetectAlignments[existingIndex];
            const existingClassIdEntry =
                existingEntry[this.props.taxonomyModel.id][this.state.imageDetectModel.id] || [];

            isClassIdAssigned = existingClassIdEntry.some(
                (item) => item.imageDetectClassId === this.state.selectedImageDetectClass
            );
        }

        if(!isClassIdAssigned){
            this.props.saveAlignmentObject(this.props.taxonomyModel.id, this.state.imageDetectModel.id, alignmentObject);
            this.setState({
                imageDetectAlignmentModal: false,
                selectedTarget: {
                    targetId: null,
                    targetName: null,
                    targetType: null
                },
                selectedImageDetectClass: null,
                selectedImageDetectClassGroup: null,
                errorAlignment: false
            });
        }else{
            this.setState({
                errorAlignment: true
            });
        }
    };

       saveTaxonomyRelations = () => {
        const taxonomyId = this.props.taxonomyModel.id;
        const newRelations = this.state.formRelations.relations;
        const oldRelations = this.state.selectedTaxonomy.relations || [];

        const oldMap = new Map(oldRelations.map(r => [r.id, r]));
        const newMap = new Map(newRelations.map(r => [r.id, r]));

        const added = newRelations.filter(r => !oldMap.has(r.id));

        const deleted = oldRelations.filter(r => !newMap.has(r.id));

        const modified = newRelations.filter(r => {
            const old = oldMap.get(r.id);
            return old && r.name !== old.name;
        });

        if (added.length > 0) {
            this.props.createTaxonomyRelations(taxonomyId, added);
        }
        if (deleted.length > 0) {
            this.props.deleteTaxonomyRelations(taxonomyId, deleted);

            setTimeout(() => {
                saveTaxonomy(this.props.taxonomy.id, this.props.taxonomy.descriptors);
                this.setState(
                    {descriptors: this.props.taxonomy.descriptors}
                )
                this._resortTable();
            }, 0);

        }
        if (modified.length > 0) {
            this.props.modifyTaxonomyRelations(taxonomyId, modified);
            setTimeout(() => {
                saveTaxonomy(this.props.taxonomy.id, this.props.taxonomy.descriptors);
                this.setState(
                    {descriptors: this.props.taxonomy.descriptors}
                )
                this._resortTable();
            }, 0);
        }

         this.setState({
            selectedTaxonomy: {
                ...this.state.selectedTaxonomy,
                relations: newRelations
            },
            relationsModal: false
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

    toggleRelationItemEdit = () => {
        const { t } = this.props;
        const { formRelations, relationItemModal } = this.state;

        const selectedRelationId = formRelations.relationItem;
        if (!selectedRelationId) {
            alert(t('models.target_descriptors.dialog_edit_relation_item.alert_select_relation_item_to_edit'));
            return;
        }

        const relationItem = formRelations.relations.find(rel => rel.id === selectedRelationId);
        if (!relationItem) {
            alert(t('models.target_descriptors.dialog_edit_relation_item.alert_relation_item_not_found'));
            return;
        }

        this.setState({
            relationItemModal: !relationItemModal,
            relationItemInput: relationItem.name,
            relationItemOriginalName: relationItem.name, // <-- store original
            relationItemModalInEdit: true,
        });
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

    _saveRelationItem = () => {
        const { t } = this.props;
        if(!this.state.relationItemInput) {
            alert(t('models.target_descriptors.dialog_edit_relation_item.alert_relation_item_is_empty'));
            return;
        }
        if (this.state.formRelations.relations.some(value => value.name === this.state.relationItemInput)) {
            alert(t('models.target_descriptors.dialog_edit_relation_item.alert_relation_item_already_exist'));
            return;
        }
        if (this.state.relationItemModalInEdit) {
            const updatedRelations = this.state.formRelations.relations.map(rel => {
                if (rel.id === this.state.formRelations.relationItem) {
                    return {
                        ...rel,
                        name: this.state.relationItemInput
                    };
                }
                return rel;
            });

            this.setState(prevState => ({
                formRelations: {
                    ...prevState.formRelations,
                    relations: updatedRelations
                },
                relationItemInput: ''
            }));
        }else {
            this.setState(prevState => ({
                formRelations: {
                    ...prevState.formRelations,
                    relations: [...prevState.formRelations.relations,
                        {
                            id: chance.guid(),
                            name: prevState.relationItemInput
                        }
                    ]
                },
                relationItemInput: ''
            }));
        }
        this.toggleRelationItemModal();
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

    _deleteRelationItem = () => {
        const { t } = this.props;
        if (!this.state.formRelations.relationItem){
            alert(t('models.target_descriptors.dialog_edit_relation_item.alert_select_relation_item_to_delete'));
        } else {
            this.setState(prevState => ({
                formRelations: {
                    ...prevState.formRelations,
                    relations: prevState.formRelations.relations.filter(value => value.id !== this.state.formRelations.relationItem),
                    relationItem: ''
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
                    this.state.form.categoryStates,
                    this.state.form.selectedRelations
                    );

                const descriptors = [...this.state.descriptors];
                const desc = descriptors.find(target => target.id === this.state.form.id);
                desc.targetName = this.state.form.targetName;
                desc.targetType = this.state.form.targetType;
                desc.targetColor = this.state.form.targetColor
                desc.unit = this.state.form.unit
                desc.annotationType = this.state.form.annotationType;
                desc.includeInCalculation = this.state.form.includeInCalculation;
                desc.states = this.state.form.categoryStates;
                desc.selectedRelations = this.state.form.selectedRelations
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
                        this.state.form.categoryStates,
                        this.state.form.selectedRelations
                    );
                    this.state.descriptors.push({
                        id: id,
                        targetName: this.state.form.targetName,
                        targetType: this.state.form.targetType,
                        targetColor: this.state.form.targetColor,
                        unit: this.state.form.unit,
                        annotationType: this.state.form.annotationType,
                        includeInCalculation: this.state.form.includeInCalculation,
                        states: this.state.form.categoryStates,
                        selectedRelations: this.state.form.selectedRelations
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

    handleRelationInputChangeForEdit(event) {
        this.setState({
            relationItemInput: event.target.value
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
        } else {
            form.includeInCalculation = true
        }
        this.setState({
            form
        });
        this.forceUpdate();
    }

    handleRelationsInputChange(event) {
        const target = event.target;
        let formRelations = this.state.formRelations;
        formRelations.relationItem = target.selectedOptions[0].dataset["relationId"];
        this.setState({
            formRelations
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
                        categoryStates: target.states,
                        selectedRelations: target.selectedRelations
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
                this._removeAlignment(data.atarget, "", "Character")
                break;
        }
    };

    handleEditButton = (targetId) => {
        const { t } = this.props;
        const target = this.state.descriptors.find(target => targetId === target.id);
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
                categoryStates: target.states,
                selectedRelations: target.selectedRelations
            }
        });
        this.toggle();
    }

    getImageDetectAlignments = () => this.props.imageDetectAlignments || [];

    characterIdExists = (characterId, groupId) => {
        const imageDetectAlignments = this.getImageDetectAlignments();

        for (const entry of imageDetectAlignments) {
            const taxonomyEntry = entry[this.props.taxonomyModel.id];
            const modelEntry = taxonomyEntry && taxonomyEntry[this.state.imageDetectModel.id];

            for (const item of modelEntry || []) {
                if (item.characterId === characterId) {
                    return {
                        imageDetectClassId: item.imageDetectClassId,
                        type: "Character"
                    };
                }
            }
        }

        return null;
    };

    getClassNameById = (classId) => {
        const { imageDetectModel } = this.state;
        const modelClass = imageDetectModel.modelClasses.find((type) => type.id === classId);
        return modelClass ? modelClass.name : null;
    };

    _removeAlignment = (characterId, groupId, type) => {
        const objectToDelete = {
            characterId: characterId,
            groupId: groupId,
            type: type
        }
        this.props.removeAlignmentObject(this.props.taxonomyModel.id, this.state.imageDetectModel.id, objectToDelete);
    };

    handleSelectedRelationsChange = (event) => {
        const { checked, value } = event.target;
        const name = event.target.getAttribute('data-relation-name');

        const newRelation = { id: value, name };

        this.setState((prevState) => {
            const currentRelations = prevState.form.selectedRelations || [];

            let updatedRelations;
            if (checked) {
                if (!currentRelations.some(rel => rel.id === value)) {
                    updatedRelations = [...currentRelations, newRelation];
                } else {
                    updatedRelations = currentRelations;
                }
            } else {
                updatedRelations = currentRelations.filter(rel => rel.id !== value);
            }

            return {
                form: {
                    ...prevState.form,
                    selectedRelations: updatedRelations
                }
            };
        });
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
                    <Col  md={11}  className="text-md-left ml-5">
                        <p>Model Annotate: <strong>{this.props.taxonomyModel.name}</strong></p>
                        <p>{t("models.title_AI_detect")}: <strong>{(this.state.imageDetectModel?this.state.imageDetectModel.name:"none")}</strong></p>
                    </Col>
                </Row>
                <Row className="action-bar">
                    <Col md={12}>
                            <Button  className="btn btn-primary mr-md-3"
                                     title={t('models.target_descriptors.btn_tooltip_add_new_character')}
                                     color="primary"
                                     style={{marginLeft: "10px"}}
                                     disabled={(this.state.model == MODEL_XPER || (this.props.taxonomy && (this.props.taxonomyModel.id !== this.props.taxonomy.id)))}
                                     onClick={this.toggle}
                            >{t('models.target_descriptors.btn_add_new_character')}</Button>
                        <Button className="btn btn-primary mr-md-3" color="primary" onClick={this.openRelationsModal} disabled={(this.state.model == MODEL_XPER || (this.props.taxonomy && (this.props.taxonomyModel.id !== this.props.taxonomy.id)))}>{t('models.target_descriptors.dialog_edit.btn_relations')}</Button>
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
                                    <TableHeader title="Actions" />
                                    <TableHeader title={t('models.target_descriptors.table_column_character_name')} sortKey="name"
                                                 sortedBy={this.state.sortBy} sort={this._sort}/>
                                    <TableHeader title={t('models.target_descriptors.table_column_character_group')} sortKey="targetType"
                                                 sortedBy={this.state.sortBy} sort={this._sort}/>
                                    <TableHeader title={t('models.target_descriptors.table_column_annotation_type')} sortKey="annotationType"
                                                 sortedBy={this.state.sortBy} sort={this._sort}/>
                                    <TableHeader title={t('models.target_descriptors.table_column_relations')} sortKey="relations"
                                                 sortedBy={this.state.sortBy} sort={this._sort}/>
                                    <TableHeader title={t('models.target_descriptors.table_column_color')} sortKey="color"
                                                 sortedBy={this.state.sortBy} sort={this._sort}/>
                                    {this.state.imageDetectModel.length !== 0 &&(
                                    <TableHeader title={`${t('models.target_descriptors.table_column_pairing')}: ${(this.state.imageDetectModel)?this.state.imageDetectModel.name:"none"}`} sortKey="pairing"
                                                 sortedBy={this.state.sortBy} sort={this._sort}/>
                                    )}
                                </tr>
                                </thead>
                                <tbody>
                                {this.state.sortedTargets.map(target => {
                                    const alignObject= this.characterIdExists(target.id, target.targetType);
                                    return (
                                        <tr key={key++} className={this.props.selectedId === target.id ? 'selected-item' : ''}>
                                            <th scope="row" >&nbsp;</th>
                                            <td>
                                            <Button className="btn-sm" onClick={() => this.handleEditButton(target.id)} disabled={(this.state.model == MODEL_XPER || (this.props.taxonomy && (this.props.taxonomyModel.id !== this.props.taxonomy.id)))}>
                                                <i className="fa fa-pencil" aria-hidden="true"/> {t('global.edit')}
                                            </Button>
                                            </td>
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
                                            <td>{target.selectedRelations}</td>
                                            <td><span style={{backgroundColor: target.color}}
                                                      className="color-circle"/>&nbsp;{target.color}</td>
                                            {this.state.imageDetectModel.length !== 0 && (
                                            <td>
                                                {(!alignObject && (!this.state.imageDetectModel || this.state.imageDetectModel.length!=0)) &&(
                                                    <Button color="primary" onClick={() => this.setAlignment(target.id, target.name, target.targetType)}>
                                                        {t('models.target_descriptors.button_pairing')}
                                                    </Button>
                                                )}
                                                {alignObject !== null && (
                                                    <div>
                                                        <span>{`(${alignObject.type})`} {(alignObject.type === "Group") ? target.targetType : target.name} = </span>
                                                        <strong>{this.getClassNameById(alignObject.imageDetectClassId)}</strong>
                                                        &nbsp;
                                                        <Button
                                                        color="danger"
                                                        className="button_remove_alignement"
                                                        onClick={() => this._removeAlignment(target.id, target.targetType, this.characterIdExists(target.id, target.targetType).type)}
                                                        >
                                                            {t('models.target_descriptors.button_remove_alignement')}
                                                        </Button>
                                                    </div>
                                                )}
                                            </td>
                                            )}
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
                        <MenuItem data={{action: 'edit'}} onClick={this.handleContextMenu} disabled={(this.state.model == MODEL_XPER || (this.props.taxonomy && (this.props.taxonomyModel.id !== this.props.taxonomy.id)))}>
                            <i className="fa fa-pencil" aria-hidden="true"/> {t('global.edit')}
                        </MenuItem>
                        <MenuItem divider/>
                        <MenuItem data={{action: 'delete'}} onClick={this.handleContextMenu} disabled={(this.state.model == MODEL_XPER || (this.props.taxonomy && (this.props.taxonomyModel.id !== this.props.taxonomy.id)))}>
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
                                                <Input type="select" size={4} name="categoricalStateItem" id="categoricalStateItem"
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
                                {!(this.state.form.id || this.state.form.annotationType !== NUMERICAL) && (
                                    <FormGroup>
                                        <Label for="unit">
                                            {t('models.target_descriptors.dialog_edit.lbl_unit')}
                                        </Label>
                                        <Input
                                            type="select"
                                            name="unit"
                                            id="unit"
                                            value={this.state.form.unit}
                                            onChange={this.handleInputChange}
                                        >
                                            <option data-unit="" />
                                            <option data-unit="mm">mm</option>
                                            <option data-unit="mm²">mm²</option>
                                            <option data-unit="°">°</option>
                                            <option data-unit="#">#</option>
                                        </Input>
                                    </FormGroup>
                                )}
                                <FormGroup className="selected-relations-container">
                                    <Label for="selectedRelations">
                                        {t('models.target_descriptors.dialog_edit.lbl_relations')}
                                    </Label>
                                    <div className="relation-list-wrapper">
                                        {
                                            this.state.selectedTaxonomy.relations &&
                                            this.state.selectedTaxonomy.relations.length > 0 ?
                                            this.state.selectedTaxonomy.relations.map((relation, index) => (
                                                <Row key={`rel_row_${index}`} className="relation-list-item">
                                                    <Col md={1} className="d-flex justify-content-center align-items-center">
                                                        <input
                                                            type="checkbox"
                                                            name="selectedRelations"
                                                            value={relation.id}
                                                            data-relation-name={relation.name}
                                                            checked={
                                                                (this.state.form.selectedRelations || []).some(
                                                                    (r) => r.id === relation.id
                                                                )
                                                            }
                                                            onChange={this.handleSelectedRelationsChange}
                                                        />
                                                    </Col>
                                                    <Col md={11} className="d-flex align-items-center">
                                                        {relation.name}
                                                    </Col>
                                                </Row>
                                            )):<div>{t('models.target_descriptors.dialog_model_relations.lbl_add_relation')}</div>

                                        }
                                    </div>
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
                    <Modal isOpen={this.state.imageDetectAlignmentModal} toggle={this.toggleImageDetectAlignmentModal}
                           wrapClassName="bst rcn_targets">
                        <ModalHeader toggle={this.toggleImageDetectAlignmentModal}>{t('models.target_descriptors.dialog_image_detect_alignment.title')}</ModalHeader>
                        <ModalBody>
                            <Form onSubmit={(e) => {
                                e.preventDefault();
                            }}>
                                {(this.state.imageDetectModel.modelClasses)?
                                <div>
                                    {(this.state.selectedImageDetectClassGroup == null || this.state.selectedImageDetectClassGroup == "-1" )?
                                    <div>
                                        <span>{t('models.target_descriptors.dialog_edit.lbl_character_name')}:<br/><br/></span><strong>{this.state.selectedTarget.targetName} = &nbsp; </strong>
                                        <Input type="select" name="imageDetectClasses" id="imageDetectClasses" className="select-image-detect-class-combo"
                                        value={this.state.selectedImageDetectClass}
                                        onChange={this.handleImageDetectClassChange}
                                        >
                                            <option value="-1">{t('models.target_descriptors.dialog_image_detect_alignment.select_class_combo')}</option>
                                        {
                                            this.state.imageDetectModel.modelClasses.map((type, index) => {
                                                return <option key={`td_${index}`} value={type.id}>{type.name}</option>;
                                            })
                                        }
                                    </Input>

                                    </div>:""}
                                    {(this.state.selectedTarget.targetType && (this.state.selectedImageDetectClass == null || this.state.selectedImageDetectClass == "-1"))?
                                    <div><br />
                                        <span>{t('models.target_descriptors.dialog_edit.lbl_character_group')}:<br/><br/></span><strong>{this.state.selectedTarget.targetType} = &nbsp; </strong>
                                        <Input type="select" name="imageDetectClassesGroup" id="imageDetectClassesGroup" className="select-image-detect-class-combo"
                                               value={this.state.selectedImageDetectClassGroup}
                                               disabled={true}
                                               onChange={this.handleImageDetectClassChange}
                                        >
                                            <option value="-1">{t('models.target_descriptors.dialog_image_detect_alignment.select_class_combo')}</option>
                                            {
                                                this.state.imageDetectModel.modelClasses.map((type, index) => {
                                                    return <option key={`td_${index}`} value={type.id}>{type.name}</option>;
                                                })
                                            }
                                        </Input>
                                    </div>:""}
                                </div>:""
                                }
                            </Form>
                            {(this.state.errorAlignment==true)?
                                <div>
                                    <br />
                                    <span>{t('models.target_descriptors.dialog_image_detect_alignment.msg_duplicate_alignment')}</span>
                                </div>
                                :""
                            }
                        </ModalBody>
                        <ModalFooter>
                            <Button color="primary" onClick={this.saveAlignment}>{t('global.save')}</Button>
                            <Button color="secondary" onClick={this.toggleImageDetectAlignmentModal}>{t('global.cancel')}</Button>
                        </ModalFooter>
                    </Modal>
                    <Modal isOpen={this.state.relationsModal} toggle={this.toggleRelationsModal}
                           wrapClassName="bst rcn_targets">
                        <ModalHeader toggle={this.toggleRelationsModal}>{t('models.target_descriptors.dialog_model_relations.title')}</ModalHeader>
                        <ModalBody>
                            <FormGroup className="relations-container">
                                <Label for="relationItem">{t('models.target_descriptors.dialog_edit.lbl_relations')}</Label>
                                <Row>
                                    <Col md={8}>
                                        <Input type="select" size={10}  name="relationItem" id="relationItem"
                                               onChange={this.handleRelationsInputChange}>
                                            {
                                                this.state.formRelations.relations && this.state.formRelations.relations.length > 0
                                                    ? this.state.formRelations.relations.map((type, index) => (
                                                        <option key={`td_${index}`} data-relation-id={type.id}>{type.name}</option>
                                                    ))
                                                    : <option disabled>{t('models.target_descriptors.dialog_model_relations.lbl_add_relation')}</option>
                                            }
                                        </Input>
                                    </Col>
                                    <Col md={4} className='crud-icons-wrapper'>
                                        <i className="fa fa-plus-square fa-lg crud-icons" aria-hidden="true" onClick={this.toggleRelationItemModal}/>
                                        <i className="fa fa-pencil fa-lg  crud-icons" aria-hidden="true"  onClick={this.toggleRelationItemEdit} disabled={!this.state.formRelations.relationItem}/>
                                        <i className="fa fa-trash fa-lg crud-icons" aria-hidden="true" onClick={this._deleteRelationItem} disabled={!this.state.formRelations.relationItem}/>
                                    </Col>
                                </Row>
                            </FormGroup>
                        </ModalBody>
                        <ModalFooter>
                            <Button color="primary" onClick={this.saveTaxonomyRelations}>{t('global.save')}</Button>
                            <Button color="secondary" onClick={this.toggleRelationsModal}>{t('global.cancel')}</Button>
                        </ModalFooter>
                    </Modal>
                    <Modal isOpen={this.state.relationItemModal} toggle={this.toggleRelationItemModal}
                           wrapClassName="bst rcn_targets">
                        <ModalHeader toggle={this.toggleRelationItemModal}>{t('models.target_descriptors.dialog_edit_relation_item.title')}</ModalHeader>
                        <ModalBody>
                            <Form onSubmit={(e) => {
                                e.preventDefault();
                            }}>
                                <FormGroup>
                                    <Label for="relationItemEdit">{t('models.target_descriptors.dialog_edit_relation_item.lbl_relation_name')}</Label>
                                    <Input type="text" name="relationItemEdit" id="relationItemEdit" value={this.state.relationItemInput}
                                           onChange={this.handleRelationInputChangeForEdit}
                                    />
                                </FormGroup>
                            </Form>
                        </ModalBody>
                        <ModalFooter>
                            <Button color="primary" onClick={this._saveRelationItem}>{t('global.save')}</Button>
                            <Button color="secondary" onClick={this.toggleRelationItemModal}>{t('global.cancel')}</Button>
                        </ModalFooter>
                    </Modal>
                </div>
            </div>
        );
    }
}

export default TargetDescriptors;