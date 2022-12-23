import {remote} from 'electron';
import React, {Component} from 'react';
import styled from 'styled-components';
import Calibration from '../containers/Calibration';
import {average, standardDeviation} from '../utils/maths';
import {
    Button,
    Col,
    Container,
    Form,
    FormGroup,
    Input,
    Modal,
    ModalBody,
    ModalFooter,
    ModalHeader,
    Nav,
    NavItem,
    NavLink,
    Row,
    TabContent,
    TabPane
} from 'reactstrap';
import TargetsInspector from '../containers/TargetsInspector'
import {
    ANNOTATION_ANGLE,
    ANNOTATION_CATEGORICAL,
    ANNOTATION_CHRONOTHEMATIQUE,
    ANNOTATION_CIRCLEMARKER,
    ANNOTATION_COLORPICKER, ANNOTATION_EVENT_ANNOTATION,
    ANNOTATION_MARKER,
    ANNOTATION_OCCURRENCE,
    ANNOTATION_POLYGON,
    ANNOTATION_POLYLINE,
    ANNOTATION_RATIO,
    ANNOTATION_RECTANGLE,
    ANNOTATION_RICHTEXT,
    ANNOTATION_SIMPLELINE,
    ANNOTATION_TRANSCRIPTION,
    CATEGORICAL,
    INTEREST,
    NUMERICAL, RESOURCE_TYPE_EVENT, RESOURCE_TYPE_PICTURE, RESOURCE_TYPE_VIDEO,
    SORT_ALPHABETIC_ASC,
    SORT_ALPHABETIC_DESC,
    SORT_DATE_ASC,
    SORT_DATE_DESC,
    SORT_TYPE_ASC,
    SORT_TYPE_DESC,
} from '../constants/constants';
import AnnotationEditor from '../containers/AnnotationEditor';
import classnames from "classnames";
import Metadata from "../containers/Metadata";
import {
    ee,
    EVENT_EDIT_CARTEL,
    EVENT_GOTO_ANNOTATION,
    EVENT_HIGHLIGHT_ANNOTATION,
    EVENT_DISHONOR_ANNOTATION,
    EVENT_HIGHLIGHT_ANNOTATION_ON_LEAFLET,
    EVENT_FOCUS_NEW_VIDEO_ANNOTATION_ON_ANNOTATION_FINISH,
    EVENT_UNFOCUS_ANNOTATION,
    EVENT_UPDATE_IS_EDIT_MODE_OPEN_IN_NAVIGATION_AND_TABS,
    EVENT_UPDATE_EVENT_RECORDING_STATUS,
    STOP_ANNOTATION_RECORDING
} from "../utils/library";
import RichTextEditor from "react-rte";
import Select from "react-select";
import {acceptedTypes} from "../utils/annotationRecording";
import {withTranslation} from "react-i18next";
import lodash from "lodash";

const ADD_TAG = require('./pictures/add-tag-annotation.svg');
const EDIT_ANNOTATION = require('./pictures/edit-annotation.svg');
const DELETE_ANNOTATION = require('./pictures/delete-anotation.svg');
const STOP = require('./pictures/stop.svg');

// STATE CONSTANTS

const TAB_METADATA = 0;
const TAB_ANNOTATIONS = 1;
const TAB_CALIBRATION = 2;

// STYLE CONSTANTS

export const WIDTH = 310;
export const MARGIN = 10;
const TOP_OFFSET = 120;

// STYLED COMPONENTS

const _Root = styled.div`
  height: 100%;
  overflow: hidden;
  width: ${WIDTH}px;
`;
const _MetadataSubpanel = styled.div`
  width: 100%;
  height: 100%;
`;


const customStyles = {
    control: (base) => ({
        ...base,
        minHeight: 26,
        border: '1px solid #ced4da',
        // This line disable the blue border
        boxShadow: 'none'
    }),
    dropdownIndicator: (base) => ({
        ...base,
        paddingTop: 0,
        paddingBottom: 0,
    }),
    clearIndicator: (base) => ({
        ...base,
        paddingTop: 0,
        paddingBottom: 0,
    }),
};
let targetUpdated = false;

let lastSelectedTab;
let annotationsListPosition = 0;

export default class extends Component {

    // LIFECYCLE
    annotationListRef = React.createRef();

    constructor(props, context) {
        super(props, context);
        this.toggle = this.toggle.bind(this);
        const annotations = this._sortAnnotations(this._mergeAnnotations(this.props),
            this.props.tab.sortDirectionAnnotation ? this.props.tab.sortDirectionAnnotation : SORT_DATE_DESC
        );

        this.state = {
            dropdownOpen: false,
            editedAnnotation: null,
            selectedTab: props.readOnly ? (lastSelectedTab === TAB_ANNOTATIONS ? TAB_ANNOTATIONS : TAB_METADATA) : TAB_ANNOTATIONS,
            selectedAnnotationType: ANNOTATION_POLYLINE,
            annotations: annotations,
            modal: false,
            categoricalIds: [],
            categoricalDropdownOpen: false,
            showSortDialog: false,
            richTextValue: RichTextEditor.createEmptyValue(),
            isFromLeaflet: false,
            isAnnotateEventRecording: false
        };

        this.toggleCategorical = this.toggleCategorical.bind(this);
        this.selectAnnotationType = this.selectAnnotationType.bind(this);
        this.selectTab = this.selectTab.bind(this);
        this.handleTargetChange = this.handleTargetChange.bind(this);

        annotationsListPosition = 0;
    }

    componentDidMount() {
        ee.on(EVENT_HIGHLIGHT_ANNOTATION, this._highlightAnnotation);
        ee.on(EVENT_EDIT_CARTEL, this.editCartel);
        ee.on(EVENT_DISHONOR_ANNOTATION, this.dishonorAnnotation)
        ee.on(EVENT_FOCUS_NEW_VIDEO_ANNOTATION_ON_ANNOTATION_FINISH, this._focusVideoAnnotation)
        ee.on(EVENT_UNFOCUS_ANNOTATION, this._unfocusVideoAnnotation)
        ee.on(EVENT_UPDATE_EVENT_RECORDING_STATUS, this.updateIsAnnotateEventRecording)
    }

    componentWillUnmount() {
        ee.removeListener(EVENT_HIGHLIGHT_ANNOTATION, this._highlightAnnotation);
        ee.removeListener(EVENT_EDIT_CARTEL, this.editCartel);
        ee.removeListener(EVENT_DISHONOR_ANNOTATION, this.dishonorAnnotation);
        ee.removeListener(EVENT_FOCUS_NEW_VIDEO_ANNOTATION_ON_ANNOTATION_FINISH, this._focusVideoAnnotation)
        ee.removeListener(EVENT_UNFOCUS_ANNOTATION, this._unfocusVideoAnnotation)
        ee.removeListener(EVENT_UPDATE_EVENT_RECORDING_STATUS, this.updateIsAnnotateEventRecording)

    }

    updateIsAnnotateEventRecording = (isRecording) => {
        this.setState({
            isAnnotateEventRecording: isRecording
        })
    }

    dishonorAnnotation = () => {
        this.setState({highlightAnn: null, isFromLeaflet: false});
    }

    _highlightAnnotation = (annId, isFromLeaflet) => {
        this.setState({highlightAnn: annId, isFromLeaflet: isFromLeaflet});
    }

    componentWillReceiveProps(nextProps) {
        if (targetUpdated || nextProps.picture !== this.props.picture ||
            (this._getArrayLength(nextProps.annotationsMeasuresLinear) !== this._getArrayLength(this.props.annotationsMeasuresLinear)
                || this._getArrayLength(nextProps.eventAnnotations) !== this._getArrayLength(this.props.eventAnnotations)
                || this._getArrayLength(nextProps.annotationsChronothematique) !== this._getArrayLength(this.props.annotationsChronothematique)
                || this._getArrayLength(nextProps.annotationsPointsOfInterest) !== this._getArrayLength(this.props.annotationsPointsOfInterest)
                || this._getArrayLength(nextProps.annotationsRectangular) !== this._getArrayLength(this.props.annotationsRectangular)
                || this._getArrayLength(nextProps.annotationsPolygon) !== this._getArrayLength(this.props.annotationsPolygon)
                || this._getArrayLength(nextProps.annotationsAngle) !== this._getArrayLength(this.props.annotationsAngle)
                || this._getArrayLength(nextProps.annotationsColorPicker) !== this._getArrayLength(this.props.annotationsColorPicker)
                || this._getArrayLength(nextProps.annotationsRatio) !== this._getArrayLength(this.props.annotationsRatio)
                || this._getArrayLength(nextProps.annotationsOccurrence) !== this._getArrayLength(this.props.annotationsOccurrence)
                || this._getArrayLength(nextProps.annotationsTranscription) !== this._getArrayLength(this.props.annotationsTranscription)
                || this._getArrayLength(nextProps.annotationsCategorical) !== this._getArrayLength(this.props.annotationsCategorical)
                || this._getArrayLength(nextProps.annotationsRichtext) !== this._getArrayLength(this.props.annotationsRichtext)
            )) {
            targetUpdated = false;
            const annotations = this._sortAnnotations(this._mergeAnnotations(nextProps),
                this.props.tab.sortDirectionAnnotation ? this.props.tab.sortDirectionAnnotation : SORT_ALPHABETIC_DESC);
            this.setState({annotations: annotations});
        }
    }

    _mergeAnnotations = (props) => {
        return [
            ...(props.annotationsChronothematique && props.annotationsChronothematique[props.picture.sha1] || []),
            ...(props.eventAnnotations && props.eventAnnotations[props.picture.sha1] || []),
            ...(props.annotationsPointsOfInterest && props.annotationsPointsOfInterest[props.picture.sha1] || []),
            ...(props.annotationsMeasuresLinear && props.annotationsMeasuresLinear[props.picture.sha1] || []),
            ...(props.annotationsRectangular && props.annotationsRectangular[props.picture.sha1] || []),
            ...(props.annotationsPolygon && props.annotationsPolygon[props.picture.sha1] || []),
            ...(props.annotationsAngle && props.annotationsAngle[props.picture.sha1] || []),
            ...(props.annotationsOccurrence && props.annotationsOccurrence[props.picture.sha1] || []),
            ...(props.annotationsColorPicker && props.annotationsColorPicker[props.picture.sha1] || []),
            ...(props.annotationsRatio && props.annotationsRatio[props.picture.sha1] || []),
            ...(props.annotationsTranscription && props.annotationsTranscription[props.picture.sha1] || []),
            ...(props.annotationsCategorical && props.annotationsCategorical[props.picture.sha1] || []),
            ...(props.annotationsRichtext && props.annotationsRichtext[props.picture.sha1] || [])
        ];
    };

    _getArrayLength(obj) {
        return obj && obj[this.props.picture.sha1] ? obj[this.props.picture.sha1].length : 0;
    }

    _setTargetValues = (target, arrayOfValues) => {
        target.value = average(arrayOfValues);
        target.standardDeviation = standardDeviation(arrayOfValues);
        target.totalCount = arrayOfValues.length;
    };

    componentWillUpdate(nextProps, nextState) {
        // perform any preparations for an upcoming update
        let canEdit = true;
        if (nextState.editedAnnotation && nextState.editedAnnotation !== this.state.editedAnnotation) {
            canEdit = this.props.selectAnnotation(nextState.editedAnnotation);
        }

        if (nextProps.editedAnnotation && nextProps.editedAnnotation !== this.state.editedAnnotation && canEdit) {
            this.setState({editedAnnotation: nextProps.editedAnnotation});
        } else if (!canEdit) {
            this.setState({editedAnnotation: null, openAddTag: false});
        }

        // Open edit of event annotation on annotation record start.
        if (acceptedTypes.includes(nextProps.picture.resourceType) && this.state.annotations.length < nextState.annotations.length
            && this.props.currentPicture && this.props.currentPicture.sha1 === nextProps.currentPicture.sha1) {
            const annotation = this._sortAnnotations(nextState.annotations, SORT_DATE_DESC)[0];
            this.setState({editedAnnotation: annotation});
        }
    }

    toggle() {
        this.setState({
            dropdownOpen: !this.state.dropdownOpen
        });
    }

    toggleCategorical() {
        this.setState({
            categoricalDropdownOpen: !this.state.categoricalDropdownOpen
        });
    }

    render() {
        let key = 0;
        const {t} = this.props;
        const cartel = this.props.cartels[this.props.picture.sha1];

        const toolbarConfig = {
            // Optionally specify the groups to display (displayed in the order listed).
            display: ['INLINE_STYLE_BUTTONS', 'BLOCK_TYPE_BUTTONS', 'BLOCK_TYPE_DROPDOWN', 'HISTORY_BUTTONS'],
            INLINE_STYLE_BUTTONS: [
                {label: 'Bold', style: 'BOLD', className: 'custom-css-class'},
                {label: 'Italic', style: 'ITALIC'},
                {label: 'Underline', style: 'UNDERLINE'}
            ],
            BLOCK_TYPE_DROPDOWN: [
                {label: 'Normal', style: 'unstyled'},
                {label: 'Heading Large', style: 'header-one'},
                {label: 'Heading Medium', style: 'header-two'},
                {label: 'Heading Small', style: 'header-three'}
            ],
            BLOCK_TYPE_BUTTONS: [
                {label: 'UL', style: 'unordered-list-item'},
                {label: 'OL', style: 'ordered-list-item'}
            ]
        };

        return this.state.editedAnnotation ? (

            <AnnotationEditor
                isAnnotateEventRecording={this.state.isAnnotateEventRecording}
                fireSaveEvent={this.props.fireSaveEvent}
                annotation={this.state.editedAnnotation}
                openAddTag={this.state.openAddTag}
                tabName={this.props.tabName}
                sha1={this.props.picture.sha1}
                isAnnotationRecording={this.props.isAnnotationRecording}
                cancel={() => {
                    ee.emit(EVENT_UPDATE_IS_EDIT_MODE_OPEN_IN_NAVIGATION_AND_TABS, false);
                    this.props.saveOrCancelEditAnnotation(false, null, null, this.state.editedAnnotation.annotationType === 'chronothematique');
                    this.setState({editedAnnotation: null, openAddTag: false});
                }}
                save={(title, targetId, text, targetColor, categoricalIds, customValue, targetType, person, date, location, tags, topic) => {
                    ee.emit(EVENT_UPDATE_IS_EDIT_MODE_OPEN_IN_NAVIGATION_AND_TABS, false);
                    if (this.state.editedAnnotation) {
                        const annotation = this.props.saveOrCancelEditAnnotation(true, title, customValue, this.state.editedAnnotation.annotationType === 'chronothematique', person, date, location);
                        if (this.state.editedAnnotation.annotationType === ANNOTATION_CHRONOTHEMATIQUE) {
                            this.props.editAnnotation(
                                this.props.picture.sha1,
                                this.state.editedAnnotation.annotationType,
                                this.state.editedAnnotation.id,
                                title,
                                text,
                                annotation
                            );
                        } else if (this.state.editedAnnotation.annotationType === ANNOTATION_EVENT_ANNOTATION) {
                            console.log('edited annotation in inspector', this.state.editedAnnotation);
                            const annotation = this.props.saveOrCancelEditAnnotation(true, title, customValue, true, person, date, location, [], topic);
                            this.props.editAnnotation(
                                this.props.picture.sha1,
                                this.state.editedAnnotation.annotationType,
                                this.state.editedAnnotation.id,
                                title,
                                text,
                                annotation
                            );
                        } else if (this.state.editedAnnotation.annotationType === ANNOTATION_MARKER ||
                            this.state.editedAnnotation.annotationType === ANNOTATION_RECTANGLE ||
                            this.state.editedAnnotation.annotationType === ANNOTATION_COLORPICKER ||
                            this.state.editedAnnotation.annotationType === ANNOTATION_TRANSCRIPTION ||
                            this.state.editedAnnotation.annotationType === ANNOTATION_CATEGORICAL ||
                            this.state.editedAnnotation.annotationType === ANNOTATION_RICHTEXT
                        ) {
                            let color = '#ff0000';
                            if (targetType === INTEREST) {
                                color = targetColor;
                                this.props.createTargetInstance(INTEREST, this.props.tabName, this.state.editedAnnotation.id, targetId, customValue ? [customValue] : null);
                            } else
                                this.props.createTargetInstance(CATEGORICAL, this.props.tabName, this.state.editedAnnotation.id, targetId, categoricalIds);

                            annotation.value = customValue;
                            this.props.editAnnotation(
                                this.props.picture.sha1,
                                this.state.editedAnnotation.annotationType,
                                this.state.editedAnnotation.id,
                                title,
                                text,
                                annotation
                            );
                            this.props.setAnnotationColor(this.state.editedAnnotation.id, color);
                        } else {
                            annotation.color = targetColor;

                            let value;
                            if ('value_in_mm' in annotation)
                                value = annotation.value_in_mm;
                            else if ('value_in_deg' in annotation)
                                value = annotation.value_in_deg;
                            else if ('area' in annotation)
                                value = annotation.area;
                            else
                                value = annotation.vertices.length;

                            // set old vertices if there is no new one for occurrence.
                            if (this.state.editedAnnotation.annotationType === ANNOTATION_OCCURRENCE &&
                                annotation.vertices.length === 0) {
                                annotation.vertices = this.state.editedAnnotation.vertices;
                                value = annotation.vertices.length;
                            }

                            this.props.editAnnotation(
                                this.props.picture.sha1,
                                this.state.editedAnnotation.annotationType,
                                this.state.editedAnnotation.id,
                                title,
                                text,
                                annotation
                            );
                            this.props.createTargetInstance(NUMERICAL, this.props.tabName, this.state.editedAnnotation.id, targetId, value);
                            this.props.setAnnotationColor(this.state.editedAnnotation.id, targetColor);
                        }

                        targetUpdated = true;
                        this.setState({editedAnnotation: null, openAddTag: false});
                    }
                }}
            />
        ) : (
            <_Root className="bst rcn_inspector">
                <Nav tabs>
                    <NavItem>
                        <NavLink
                            className={classnames({active: this.state.selectedTab === TAB_METADATA})}
                            onClick={() => {
                                this.selectTab(TAB_METADATA);
                            }}>
                            {t('inspector.tab_metadata')}
                        </NavLink>
                    </NavItem>
                    <NavItem>
                        <NavLink
                            className={classnames({active: this.state.selectedTab === TAB_ANNOTATIONS})}
                            onClick={() => {
                                this.selectTab(TAB_ANNOTATIONS);
                            }}>
                            {t('inspector.tab_annotations')}
                        </NavLink>
                    </NavItem>
                    <NavItem className={classnames({hidden: this.props.readOnly})}>
                        <NavLink
                            className={classnames({active: this.state.selectedTab === TAB_CALIBRATION})}
                            onClick={() => {
                                this.selectTab(TAB_CALIBRATION);
                            }}>
                            {t('inspector.tab_calibration')}
                            {((this.props.picture.dpix && this.props.picture.dpiy) || this.props.picturesByCalibration[this.props.picture.sha1]) ?
                                '' : <sup className="sup-calibration">*</sup>
                            }
                            {
                                (this.props.picturesByCalibration[this.props.picture.sha1]) ?
                                    <sup className="sup-calibration-picked">✔</sup> : ""
                            }
                        </NavLink>
                    </NavItem>
                </Nav>
                <TabContent activeTab={this.state.selectedTab}>
                    <TabPane tabId={TAB_METADATA}>
                        {this.state.selectedTab === TAB_METADATA && <Metadata
                            readOnly={this.props.readOnly}
                            picture={this.props.picture}
                            tags={this.props.tags}
                        />}
                    </TabPane>
                    <TabPane tabId={TAB_ANNOTATIONS}>
                        {this.state.selectedTab === TAB_ANNOTATIONS && (
                            <div className="annotations-tab"
                                 style={{gridTemplateRows: this.props.isFromLibraryView ? 'auto' : 'auto 220px'}}>
                                <div className="annotations-list"
                                     ref={el => {
                                         if (el && this.state.isFromLeaflet === true) {
                                             this.annotationListRef = el;
                                             el.scrollTo(0, annotationsListPosition || 0);
                                         }
                                     }}
                                >
                                    <Container>
                                        <Row className={"annotationHeaderSeparator"}>
                                            <Col md={2} lg={2} className={"orderIcon"}>
                                                <img alt="order icon" src={require('./pictures/order_icon.svg')}/>
                                            </Col>
                                            <Col md={10} lg={10} className={"orderSelect"}>
                                                <Input type="select" bsSize="md"
                                                       value={this.props.tab.sortDirectionAnnotation}
                                                       onChange={this._handleOnSortChange}>
                                                    <option
                                                        value={SORT_DATE_DESC}>{t('popup_sort.newest_to_oldest')}</option>
                                                    <option
                                                        value={SORT_DATE_ASC}>{t('popup_sort.oldest_to_newest')}</option>
                                                    <option
                                                        value={SORT_ALPHABETIC_DESC}>{t('popup_sort.alphabetical')}</option>
                                                    <option
                                                        value={SORT_ALPHABETIC_ASC}>{t('popup_sort.alphabetical_inverted')}</option>
                                                    <option value={SORT_TYPE_ASC}>{t('popup_sort.by_type')}</option>
                                                    <option
                                                        value={SORT_TYPE_DESC}>{t('popup_sort.by_type_inverted')}</option>
                                                </Input>
                                            </Col>
                                        </Row>

                                        {cartel ? <Row className="react-contextmenu-wrapper">
                                            <Col md={12} lg={12}>
                                                <Row>
                                                    <Col md={1} lg={1}>
                                                        <img height="12px"
                                                             alt="cartel"
                                                             className="btn_menu"
                                                             src={require('./pictures/cartel.svg')}
                                                        />
                                                    </Col>
                                                    <Col cmd={8} lg={8}>
                                                        <div className="annotation_title"
                                                             style={{color: "#333"}}><span
                                                            title="RCT-1">{cartel.title}</span>
                                                        </div>
                                                    </Col>
                                                    <Col md={3} lg={3} sm={3}
                                                        // className={(!this.props.readOnly && this.state.hover === cartel.id) ? 'action-row' : 'hidden'}>
                                                         className={'action-row'}>
                                                        <img className="btn_menu" src={EDIT_ANNOTATION}
                                                             alt="edit annotation"
                                                             title={t('inspector.tooltip_edit_annotation')}
                                                             onClick={event => {
                                                                 event.preventDefault();
                                                                 this.editCartel();
                                                             }}/>
                                                        <img className="btn_menu" src={DELETE_ANNOTATION}
                                                             alt="delete annotation"
                                                             title={t('inspector.tooltip_delete_annotation')}
                                                             onClick={event => {
                                                                 event.preventDefault();
                                                                 this.props.deleteCartel(this.props.picture.sha1, cartel.id);
                                                             }}/>
                                                    </Col>
                                                </Row>
                                                <Row>
                                                    <Col md={3} lg={3}><span
                                                        className="btn_menu">Value</span>
                                                    </Col>
                                                    <Col md={9} lg={9}>
                                                        <div className="annotation_value text-right">
                                                            {cartel.value}
                                                        </div>
                                                    </Col>
                                                </Row>
                                            </Col>
                                        </Row> : ''}
                                        {
                                            this.state.annotations.map(_ => this.makeAnnotation(_, key++, this._deleteAnnotation))}
                                        <Modal isOpen={this.state.modal} toggle={this._toggle} wrapClassName="bst"
                                               autoFocus={false}>
                                            <ModalHeader
                                                toggle={this._toggle}>{t('inspector.dialog_title_select_values_for_character')}</ModalHeader>
                                            <ModalBody>
                                                <Row className="action-bar">
                                                    <Col>
                                                        <div className="targetValues">
                                                            <div className="comboUnknownValues">
                                                                <Input type="checkbox" value="DataUnavailable"
                                                                       onClick={_ => {
                                                                           const checked = _.target.checked;
                                                                           let categoricalIds = [];
                                                                           if (checked) {
                                                                               categoricalIds = ['DataUnavailable']
                                                                           }
                                                                           this.setState({
                                                                               categoricalIds,
                                                                               disableCategoricalValues: checked
                                                                           })
                                                                       }}/><span
                                                                className="stateValue">{t('global.unknown_values')}</span>
                                                            </div>
                                                            {this.props.selectedTaxonomy && this.props.selectedTaxonomy.descriptors
                                                                && this.props.selectedTaxonomy.descriptors.map(target => {
                                                                    if (target.id === this.state.targetId && target.targetType === this.state.targetGroup) {
                                                                        return target.states.map((state, index) => {
                                                                            return <div key={`option_${index}`}>
                                                                                <Input type="checkbox" value={state.id}
                                                                                       onChange={_ => {
                                                                                       }}
                                                                                       checked={!this.state.disableCategoricalValues && this.state.categoricalIds.indexOf(state.id) !== -1}
                                                                                       disabled={this.state.disableCategoricalValues}
                                                                                       onClick={_ => {
                                                                                           const values = [...this.state.categoricalIds];
                                                                                           const index = values.indexOf(state.id);
                                                                                           if (index !== -1) {
                                                                                               values.splice(index, 1);
                                                                                           } else if (_.target.checked) {
                                                                                               values.push(state.id);
                                                                                           }
                                                                                           this.setState({
                                                                                               categoricalIds: values
                                                                                           })
                                                                                       }}
                                                                                /> <span
                                                                                className={classnames({'disabled-text': this.state.disableCategoricalValues})}>{state.name}</span>
                                                                            </div>
                                                                        })
                                                                    }
                                                                })}
                                                        </div>
                                                    </Col>
                                                </Row>

                                            </ModalBody>
                                            <ModalFooter>
                                                <Button color="primary"
                                                        onClick={this._saveCategoricalValue}>{t('global.save')}</Button>
                                                <Button color="secondary"
                                                        onClick={this._toggle}>{t('global.cancel')}</Button>
                                            </ModalFooter>
                                        </Modal>

                                        <div>
                                            <Modal isOpen={this.state.cartelModal}
                                                   size="lg"
                                                   scrollable={true}
                                                   toggle={this._toggleCartelModal} wrapClassName="bst"
                                                   autoFocus={false}>
                                                <ModalHeader
                                                    toggle={this._toggleCartelModal}>{t('inspector.dialog_title_enter_text')}</ModalHeader>
                                                <ModalBody>
                                                    <Form className="rte-container" onSubmit={(e) => {
                                                        e.preventDefault();
                                                        this._editCartel();
                                                    }}>
                                                        <FormGroup row>
                                                            <Col sm={12}>
                                                                <RichTextEditor editorClassName="rte-annotate"
                                                                                toolbarConfig={toolbarConfig}
                                                                                autoFocus={true}
                                                                                value={this.state.richTextValue}
                                                                                onChange={this.richTextOnChange}
                                                                />
                                                            </Col>
                                                        </FormGroup>
                                                    </Form>
                                                </ModalBody>
                                                <ModalFooter>
                                                    <Button color="primary"
                                                            onClick={this._editCartel}>{t('global.save')}</Button>
                                                    <Button color="secondary"
                                                            onClick={() => this._toggleCartelModal()}>{t('global.cancel')}</Button>
                                                </ModalFooter>
                                            </Modal>
                                        </div>
                                    </Container>
                                </div>
                                {
                                    !this.props.isFromLibraryView ?
                                        <TargetsInspector tabName={this.props.tabName}/> : null
                                }
                            </div>
                        )}
                    </TabPane>
                    <TabPane tabId={TAB_CALIBRATION}>
                        {this.state.selectedTab === TAB_CALIBRATION && (
                            <_MetadataSubpanel>
                                <Calibration activateCalibration={this.props.activateCalibration}
                                             pixels={this.props.pixels}
                                             selectAxis={this.props.selectAxis}
                                             changeMeasureType={this.props.changeMeasureType}
                                             deleteAxis={this.props.deleteAxis}
                                             sha1={this.props.picture.sha1}
                                             dpix={this.props.picture.dpix}
                                             dpiy={this.props.picture.dpiy}
                                             changeCalibration={this._changeCalibration}
                                             tabName={this.props.tabName}
                                             catalogName={this.props.picture.erecolnatMetadata ? this.props.picture.erecolnatMetadata.catalognumber : null}
                                />
                            </_MetadataSubpanel>
                        )}
                    </TabPane>
                </TabContent>
            </_Root>
        );
    }

    _deleteAnnotation = (sha1, annotation) => {
        switch (annotation.annotationType) {
            case ANNOTATION_SIMPLELINE:
            case ANNOTATION_POLYLINE:
                this.props.deleteAnnotationMeasureLinear(sha1, annotation.id, this.props.tabName);
                break;
            case ANNOTATION_CHRONOTHEMATIQUE:
                this.props.deleteAnnotationChronothematique(sha1, annotation.id)
                break;
            case ANNOTATION_EVENT_ANNOTATION:
                this.props.deleteEventAnnotation(sha1, annotation.id)
                break;
            case ANNOTATION_RECTANGLE:
                this.props.deleteAnnotationRectangular(sha1, annotation.id);
                break;
            case ANNOTATION_CIRCLEMARKER:
            case ANNOTATION_MARKER:
                this.props.deleteAnnotationPointOfInterest(sha1, annotation.id);
                break;
            case ANNOTATION_POLYGON:
                this.props.deleteAnnotationPolygon(sha1, annotation.id, this.props.tabName);
                break;
            case ANNOTATION_ANGLE:
                this.props.deleteAnnotationAngle(sha1, annotation.id, this.props.tabName);
                break;
            case ANNOTATION_OCCURRENCE:
                this.props.deleteAnnotationOccurrence(sha1, annotation.id, this.props.tabName);
                break;
            case ANNOTATION_COLORPICKER:
                this.props.deleteAnnotationColorPicker(sha1, annotation.id);
                break;
            case ANNOTATION_RATIO:
                this.props.deleteAnnotationRatio(sha1, annotation.id);
                break;
            case ANNOTATION_TRANSCRIPTION:
                this.props.deleteAnnotationTranscription(sha1, annotation.id);
                break;
            case ANNOTATION_CATEGORICAL:
                this.props.deleteAnnotationCategorical(sha1, annotation.id);
                break;
            case ANNOTATION_RICHTEXT:
                this.props.deleteAnnotationRichtext(sha1, annotation.id);
                break;
        }
    };

    _changeCalibration = (applyToAll, edit) => {
        this.props.changeCalibration(applyToAll, edit);
    };

    _unfocusVideoAnnotation = () => {
        this.props.unfocusAnnotation();
    }

    _focusVideoAnnotation = (annotationId) => {
        this.props.focusAnnotation(annotationId, 'chronothematique', this.props.picture.sha1,
            undefined, undefined);
        this._highlightAnnotation(annotationId, false);
    }

    _focusAnnotation = (e, annotation) => {
        this.props.focusAnnotation(annotation.id, annotation.annotationType, this.props.picture.sha1,
            annotation.line1, annotation.line2);
        e.preventDefault();
    };

    _gotoAnnotation = (e, annotation, position) => {
        ee.emit(EVENT_GOTO_ANNOTATION, annotation, position)
        e.preventDefault();
        e.stopPropagation();
    }

    _emitEvent = (event, id, type) => {
        ee.emit(EVENT_HIGHLIGHT_ANNOTATION_ON_LEAFLET, id, type);
    }

    // RENDERING HELPERS
    makeAnnotation(annotation, key, deleteCallback) {
        let tags = [];
        if (this.props.tagsByAnnotation)
            tags = this.props.tagsByAnnotation[annotation.id] || [];
        const {t} = this.props;
        const targetColors = {};
        const descriptor = this.props.taxonomyInstance && this.props.taxonomyInstance.taxonomyByAnnotation[annotation.id] ?
            this.props.taxonomyInstance.taxonomyByAnnotation[annotation.id] : {descriptorId: -1};

        const options = [{
            value: "-1",
            measure: "-1",
            color: "-1",
            targetType: descriptor.type,
            group: descriptor.targetType,
            label: t('inspector.select_character_label')
        }];

        this.props.selectedTaxonomy && this.props.selectedTaxonomy.descriptors
        && this.props.selectedTaxonomy.descriptors.map(target => {
            targetColors[target.id] = target.targetColor;
            const type = target.targetType ? `${target.targetType}\\` : '';

            if ((annotation.annotationType === 'simple-line' || annotation.annotationType === 'polyline') && target.annotationType === 'NUMERICAL' && target.unit === 'mm') {
                options.push({
                    value: target.id,
                    label: `${type}${target.targetName} ${target.unit}`,
                    color: target.targetColor,
                    measure: target.unit
                })
            } else {
                if ((annotation.annotationType === 'polygon') && target.annotationType === 'NUMERICAL' && (target.unit === 'mm²' || target.unit === 'mm2')) {
                    options.push({
                        value: target.id,
                        label: `${type}${target.targetName} ${target.unit}`,
                        color: target.targetColor,
                        measure: target.unit
                    })
                } else {
                    if ((annotation.annotationType === 'angle') && target.annotationType === 'NUMERICAL' && (target.unit === '°' || target.unit === 'DEG' || target.unit === 'deg')) {
                        options.push({
                            value: target.id,
                            label: `${type}${target.targetName} ${target.unit}`,
                            color: target.targetColor,
                            measure: target.unit
                        })
                    } else {
                        if ((annotation.annotationType === 'occurrence') && target.annotationType === 'NUMERICAL' && (target.unit === '#' || target.unit === 'N')) {
                            options.push({
                                value: target.id,
                                label: `${type}${target.targetName} ${target.unit}`,
                                color: target.targetColor,
                                measure: target.unit
                            })
                        } else {
                            if ((annotation.annotationType === ANNOTATION_MARKER ||
                                annotation.annotationType === ANNOTATION_RECTANGLE ||
                                annotation.annotationType === ANNOTATION_POLYGON ||
                                annotation.annotationType === ANNOTATION_COLORPICKER ||
                                annotation.annotationType === ANNOTATION_TRANSCRIPTION ||
                                annotation.annotationType === ANNOTATION_CATEGORICAL) && (target.annotationType === CATEGORICAL || target.annotationType === INTEREST)) {
                                options.push({
                                    value: target.id,
                                    targetType: target.annotationType,
                                    measure: target.unit,
                                    color: target.targetColor,
                                    targetGroup: target.targetType,
                                    label: `${type}${target.targetName} ${target.unit}`,
                                })
                            }
                        }
                    }
                }
            }
        });

        let defaultValue = options.filter(_ => _.value === descriptor.descriptorId)[0];
        if (!defaultValue) {
            defaultValue = options[0]
        }

        return (
            <div ref={el => {
                if (el && this.state.highlightAnn === annotation.id && this.state.isFromLeaflet === true) {
                    setTimeout(_ => {
                        this.annotationListRef.scrollTo({
                            top: el.offsetTop - TOP_OFFSET,
                            left: 0,
                            behavior: 'smooth'
                        });
                    }, 300);
                }
            }}
                 className={classnames({'highlight-ann': this.state.highlightAnn === annotation.id},
                     {'recording-ann': (!lodash.isNil(annotation.video) && annotation.video.end === -1) || annotation.end === -1},
                     'react-contextmenu-wrapper row')}
                 onClick={(this.props.currentPicture.resourceType === RESOURCE_TYPE_EVENT || this.props.currentPicture.resourceType === RESOURCE_TYPE_VIDEO) ? e => {
                     if (this.state.isAnnotateEventRecording) {
                         return false;
                     }
                     this._focusAnnotation(e, annotation);
                     this._gotoAnnotation(e, annotation, "start");
                     this.setState({
                         isFromLeaflet: false,
                         highlightAnn: annotation.id
                     });

                 } : undefined}
                 onMouseOver={this.props.currentPicture.resourceType === RESOURCE_TYPE_PICTURE ? e => {
                     if (this.state.isAnnotateEventRecording) {
                         return false;
                     }

                     if (!lodash.isNil(annotation.video)) {
                         this._focusAnnotation(e, annotation);
                         console.log(annotation.video.end)
                         if (annotation.video.end !== -1)
                             this._gotoAnnotation(e, annotation, "start");
                     } else
                         this._emitEvent(e, annotation.id, annotation.annotationType);

                     this.setState({
                         isFromLeaflet: false,
                         highlightAnn: annotation.id
                     });
                 } : undefined}
                 key={key}
            >
                <Col md={12} lg={12} sm={12}>
                    <Row>
                        <Col md={1} lg={1} sm={1}>
                            <img height="12px"
                                 className="btn_menu"
                                 alt={annotation.annotationType}
                                 src={require('./pictures/' + annotation.annotationType + '.svg')}/>
                        </Col>
                        <Col md={7} lg={7} sm={7}>
                            <div className="annotation_title"
                                 style={{color: (!('color' in annotation) || annotation.color === "-1") ? "#333333" : targetColors[descriptor.descriptorId]}}>
                                {
                                    annotation.annotationType === ANNOTATION_CHRONOTHEMATIQUE ?
                                        <span title={annotation.title}
                                              onClick={() => {
                                                  // TODO: move to timeline annotation
                                              }}
                                        >{annotation.title}</span> :
                                        <span title={annotation.title} onDoubleClick={() => {
                                            this.setState({
                                                editAnnotationInline: annotation.id,
                                                newAnnotationName: annotation.title
                                            })
                                        }}>
                                    {this.state.editAnnotationInline === annotation.id ?
                                        (
                                            <input className="inputEdit" type="text"
                                                   autoFocus={true} value={this.state.newAnnotationName}
                                                   onChange={event => {
                                                       this.setState({newAnnotationName: event.target.value})
                                                   }} onKeyUp={event => {
                                                if (event.keyCode === 13 && this.state.newAnnotationName.length >= 3) {
                                                    this.props.editAnnotation(
                                                        this.props.picture.sha1,
                                                        annotation.annotationType,
                                                        annotation.id,
                                                        this.state.newAnnotationName,
                                                        annotation.text,
                                                        annotation
                                                    );
                                                    this.props.updateAnnotation(annotation.id, this.state.newAnnotationName);
                                                }
                                                if (event.keyCode === 13 || event.keyCode === 27) {
                                                    this.setState({
                                                        newAnnotationName: null,
                                                        editAnnotationInline: null
                                                    });
                                                }
                                            }}/>
                                        ) : annotation.title}
                                </span>
                                }
                            </div>
                        </Col>
                        {
                            !this.props.isFromLibraryView ? <Col md={4} lg={4} sm={4}
                                // className={(!this.props.readOnly && this.state.hover === annotation.id) ? 'action-row' : 'hidden'}>
                                                                 className={'action-row'}>


                                {(!lodash.isNil(annotation.video) && annotation.video.end === -1) ||
                                    annotation.end === -1 ?
                                    <img alt="stop_ann_recording" className="btn_menu" src={STOP}
                                         title={t('inspector.tooltip_stop_ann_recording')} onClick={event => {
                                        event.preventDefault();
                                        event.stopPropagation();

                                        ee.emit(STOP_ANNOTATION_RECORDING, annotation);
                                    }}/> : ''}

                                <img alt="add keyword" className="btn_menu" src={ADD_TAG}
                                     title={t('inspector.tooltip_add_keyword')} onClick={event => {
                                    event.preventDefault();
                                    event.stopPropagation();
                                    if (this.state.isAnnotateEventRecording) {
                                        return false;
                                    }
                                    if (this.props.currentAnnotationTool) {
                                        let options = {
                                            type: "info",
                                            title: t('global.attention'),
                                            buttons: ["OK"],
                                            message: t('inspector.alert_fast_measurement_mode_can_not_change_the_annotation')
                                        }
                                        remote.dialog.showMessageBox(remote.getCurrentWindow(), options);
                                    } else {
                                        this.setState({editedAnnotation: annotation, openAddTag: true});
                                    }
                                }}/>
                                <img className="btn_menu" src={EDIT_ANNOTATION}
                                     alt="edit annotation"
                                     title={t('inspector.tooltip_edit_annotation')}
                                     onClick={event => {
                                         event.preventDefault();
                                         event.stopPropagation();
                                         if (this.state.isAnnotateEventRecording) {
                                             return false;
                                         }
                                         if (this.props.currentAnnotationTool) {
                                             let options = {
                                                 type: "info",
                                                 title: t('global.attention'),
                                                 buttons: ["OK"],
                                                 message: t('inspector.alert_fast_measurement_mode_can_not_change_the_annotation')
                                             }
                                             remote.dialog.showMessageBox(remote.getCurrentWindow(), options);
                                         } else {
                                             this._focusAnnotation(event, annotation);
                                             this._gotoAnnotation(event, annotation, "start");
                                             this.setState({
                                                 isFromLeaflet: false,
                                                 highlightAnn: annotation.id,
                                                 editedAnnotation: annotation
                                             });
                                         }
                                     }}/>
                                <img className="btn_menu" src={DELETE_ANNOTATION}
                                     alt="delete annotation"
                                     title={t('inspector.tooltip_delete_annotation')}
                                     onClick={event => {
                                         event.preventDefault();
                                         event.stopPropagation();
                                         if (this.state.isAnnotateEventRecording) {
                                             return false;
                                         }
                                         deleteCallback(this.props.picture.sha1, annotation)
                                     }}/>
                            </Col> : <Col md={3} lg={3} sm={3}/>
                        }
                    </Row>
                    {this.props.selectedTaxonomy ?
                        <div>
                            {annotation.annotationType !== ANNOTATION_CHRONOTHEMATIQUE ? <Row>
                                <Col md={3} lg={3} sm={3}><span
                                    className="btn_menu">{t('inspector.lbl_character')}</span></Col>
                                <Col md={9} lg={9} sm={9}
                                     onClick={(e) => {
                                         e.stopPropagation();
                                     }}
                                >
                                    <Select className="annotation_target"
                                            title={t('inspector.select_tooltip_affect_this_annotation_to_a_character')}
                                            value={defaultValue}
                                            menuShouldBlockScroll={true}
                                            menuPosition={"fixed"}
                                            styles={customStyles}
                                            onChange={selectedTargetOptions => {
                                                this.handleTargetChange(annotation, selectedTargetOptions, descriptor.descriptorId)
                                            }}
                                            isMulti={false}
                                            options={options}
                                            isDisabled={this.props.isFromLibraryView}
                                    />
                                </Col>
                            </Row> : null}
                        </div> : ''}

                    <Row>
                        <Col md={3} lg={3} sm={3}><span className="btn_menu">{t('inspector.lbl_value')}</span></Col>
                        <Col md={9} lg={9} sm={9}>
                            <div className="annotation_value text-right">
                                {annotation.annotationType === ANNOTATION_EVENT_ANNOTATION && annotation.value ? annotation.value : ''}
                                {annotation.annotationType === ANNOTATION_CHRONOTHEMATIQUE && annotation.value ? annotation.value : ''}
                                {annotation.annotationType === ANNOTATION_SIMPLELINE && ` ${annotation.value_in_mm ? annotation.value_in_mm.toFixed(2) : ''}mm`}
                                {annotation.annotationType === ANNOTATION_POLYLINE && ` ${annotation.value_in_mm ? annotation.value_in_mm.toFixed(2) : ''}mm`}
                                {annotation.annotationType === ANNOTATION_POLYGON && ` ${annotation.area ? annotation.area.toFixed(2) : ''}mm\u00B2`}
                                {annotation.annotationType === ANNOTATION_ANGLE && ` ${annotation.value_in_deg ? annotation.value_in_deg.toFixed(2) : ''}°`}
                                {annotation.annotationType === ANNOTATION_OCCURRENCE && ` #${annotation.value}`}
                                {annotation.annotationType === ANNOTATION_TRANSCRIPTION && annotation.value ? annotation.value : ''}
                                {annotation.annotationType === ANNOTATION_RECTANGLE && annotation.value ? annotation.value : ''}
                                {annotation.annotationType === ANNOTATION_MARKER && annotation.value ? annotation.value : ''}
                                {annotation.annotationType === ANNOTATION_CATEGORICAL && annotation.value ? annotation.value : ''}
                                {annotation.annotationType === ANNOTATION_RICHTEXT && annotation.value ? annotation.value : ''}
                                {annotation.annotationType === ANNOTATION_COLORPICKER ? (
                                    <span><span style={{
                                        backgroundColor: annotation.value,
                                        width: '10px',
                                        height: '10px',
                                        display: 'inline-block'
                                    }}/> <span>{annotation.value}</span></span>) : ''}
                                {annotation.annotationType === ANNOTATION_RATIO && ` ${annotation.value1 && annotation.value2 ? (annotation.value1 / annotation.value2).toFixed(2) : ''}`}
                            </div>
                        </Col>
                    </Row>
                </Col>
                {tags.length > 0 ? (
                    <div className="tags-panel">
                        {tags.map(name => {
                            return <span key={name} className="annotation-tag">{name}</span>
                        })}
                    </div>) : ''}
            </div>
        );
    }

    _toggle = (targetId, targetGroup, annotation, color, oldDescriptorId) => {
        this.setState({
            modal: !this.state.modal,
            targetGroup: targetGroup,
            targetId: targetId,
            categoricalIds: [],
            categoricalAnnotation: annotation,
            categoricalColor: color,
            oldDescriptorId,
            disableCategoricalValues: false
        });
    };

    _saveCategoricalValue = () => {
        this.props.createTargetInstance(CATEGORICAL, this.props.tabName, this.state.categoricalAnnotation.id,
            this.state.targetId, this.state.categoricalIds, this.state.oldDescriptorId);

        this.props.setAnnotationColor(this.state.categoricalAnnotation.id, this.state.categoricalColor);
        this._toggle();
    };

    handleTargetChange = (annotation, selectedTargetOptions, oldDescriptorId) => {
        console.log(selectedTargetOptions.measure === annotation.measure)
        console.log(selectedTargetOptions.measure === "-1")
        console.log(selectedTargetOptions.measure === '')

        const {t} = this.props;
        if (selectedTargetOptions.measure === annotation.measure
            || (selectedTargetOptions.measure === "N" && annotation.measure === "#")
            || (selectedTargetOptions.measure === "deg" && annotation.measure === "°")
            || selectedTargetOptions.measure === "-1"
            || selectedTargetOptions.measure === '') {

            if (selectedTargetOptions.targetType === "CATEGORICAL" && this.props.taxonomyInstance &&
                this.props.taxonomyInstance.taxonomyByPicture[this.props.picture.sha1] &&
                selectedTargetOptions.value in this.props.taxonomyInstance.taxonomyByPicture[this.props.picture.sha1]
            ) {
                remote.dialog.showMessageBox(remote.getCurrentWindow(), {
                    type: 'error',
                    message: t('inspector.alert_categorical_descriptor_already_exist'),
                    cancelId: 1
                });
                selectedTargetOptions.value = "-1";
                return false;
            }

            targetUpdated = true;
            annotation.color = selectedTargetOptions.color;

            let value = 0;
            //problem even if annotation type is ANNOTATION_OCCURRENCE there is still  value_in_mm property in passed
            //annotation as undefined so condition  else if ('value_in_mm' in annotation) is triggered and value is set to
            //undefined
            if (annotation.annotationType === ANNOTATION_OCCURRENCE)
                value = annotation.value;
            else if ('value_in_mm' in annotation && annotation.value_in_mm != undefined)
                value = annotation.value_in_mm;
            else if ('value_in_deg' in annotation)
                value = annotation.value_in_deg;
            else if ('area' in annotation)
                value = annotation.area;

            if (selectedTargetOptions.targetType === CATEGORICAL) {
                if (selectedTargetOptions.value === "-1") {
                    this.props.createTargetInstance(CATEGORICAL, this.props.tabName, annotation.id, "-1");
                } else {
                    this._toggle(selectedTargetOptions.value, selectedTargetOptions.targetGroup, annotation, selectedTargetOptions.color, oldDescriptorId)
                }
            } else if (selectedTargetOptions.targetType === INTEREST) {
                this.props.createTargetInstance(INTEREST, this.props.tabName, annotation.id, selectedTargetOptions.value, annotation.value ? [annotation.value] : null, oldDescriptorId);
                this.props.setAnnotationColor(annotation.id, selectedTargetOptions.color);
            } else {
                this.props.createTargetInstance(NUMERICAL, this.props.tabName, annotation.id, selectedTargetOptions.value, value);
                this.props.setAnnotationColor(annotation.id, selectedTargetOptions.color);
            }
        } else {
            remote.dialog.showMessageBox(remote.getCurrentWindow(), {
                type: 'error',
                message: t('inspector.alert_wrong_target_type'),
                cancelId: 1
            });
        }
    };

    // LOGIC

    selectAnnotationType(type) {
        if (type !== this.state.selectedAnnotationType) this.setState({selectedAnnotationType: type});
    }

    selectTab(tab) {
        if (this.props.isFromMozaicView) {
            console.log('annotation editor disabled from mozaic view');
            return false;
        }
        this.props.navigationHandler(null, () => {
            if (tab !== this.state.selectedTab) {
                if (this.props.readOnly)
                    lastSelectedTab = tab;
                this.setState({selectedTab: tab});
                if (this.props.activateCalibration)
                    this.props.activateCalibration(false);

                if (this.props.leafletImage && this.props.leafletImage.current) {
                    this.props.leafletImage.current.enableToolBox(tab === TAB_ANNOTATIONS);
                    if (tab === TAB_CALIBRATION || tab === TAB_METADATA)
                        this.props.leafletImage.current.showHideToolbar(false)
                    else if (tab === TAB_ANNOTATIONS)
                        this.props.leafletImage.current.showHideToolbar(true)
                }
            }
        })
    }

    _handleOnSortChange = (event) => {
        this.props.saveAnnotationSort(this.props.tabName, event.target.value);
        this.setState({
            annotations: this._sortAnnotations(this.state.annotations, event.target.value)
        });
    };

    _sortAnnotations = (annotations, direction) => {
        return annotations.sort((a, b) => {
            switch (direction) {
                case SORT_ALPHABETIC_DESC:
                    return (a.title < b.title ? -1 : (a.title > b.title ? 1 : 0));
                case SORT_ALPHABETIC_ASC:
                    return (a.title > b.title ? -1 : (a.title < b.title ? 1 : 0));
                case SORT_DATE_DESC:
                    return (a.creationTimestamp > b.creationTimestamp ? -1 : (a.creationTimestamp < b.creationTimestamp ? 1 : 0));
                case SORT_DATE_ASC:
                    return (a.creationTimestamp < b.creationTimestamp ? -1 : (a.creationTimestamp > b.creationTimestamp ? 1 : 0));
                case SORT_TYPE_DESC:
                    return (a.annotationType > b.annotationType ? -1 : (a.annotationType < b.annotationType ? 1 : 0));
                case SORT_TYPE_ASC:
                    return (a.annotationType < b.annotationType ? -1 : (a.annotationType > b.annotationType ? 1 : 0));
            }
        });
    };

    _editCartel = () => {
        this.props.editCartel(this.props.picture.sha1, this.state.cartel.id, this.state.richTextValue.toString('html'))
        this.setState({
            cartelModal: false,
            modal: false,
            richTextValue: RichTextEditor.createEmptyValue(),
            cartel: null
        });

    };

    _toggleCartelModal = () => {
        this.setState({
            cartelModal: !this.state.cartelModal,
            modal: false,
            richTextValue: RichTextEditor.createEmptyValue(),
            cartel: null
        });
    };

    richTextOnChange = (richTextValue) => {
        this.setState({richTextValue});
    };

    editCartel = () => {
        const cartel = this.props.cartels[this.props.picture.sha1];
        this.setState({
            cartelModal: true,
            richTextValue: RichTextEditor.createValueFromString(cartel.value, "html"),
            cartel
        });
    }
}
