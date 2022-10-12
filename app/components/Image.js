import React, {Fragment, PureComponent} from 'react';
import styled from 'styled-components';
import Chance from 'chance';
import lodash from 'lodash';
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
    ANNOTATION_TRANSCRIPTION, APP_NAME,
    CARTEL,
    DELETE_EVENT,
    EDIT_EVENT,
    MODEL_XPER,
    ONE_DIMENSIONAL, RESOURCE_TYPE_EVENT,
    RESOURCE_TYPE_VIDEO,
    SECTION_BG,
    SECTION_FG,
    TWO_DIMENSIONAL
} from '../constants/constants';
import {
    getAngleInDegrees,
    getCartesianDistanceInMm,
    getCartesianDistanceInPx,
    surfacePolygonInMm
} from '../utils/maths';
import Inspector from '../containers/Inspector';
import Nothing from './Nothing';
import LeafletImage from "./LeafletImage";
import L from "leaflet";
import {remote} from "electron";
import {Button, Col, Form, FormGroup, Modal, ModalBody, ModalFooter, ModalHeader, Row} from "reactstrap";
import RichTextEditor from 'react-rte';
import {loadMetadata} from "../utils/config";
import {
    ee,
    EVENT_EDIT_CARTEL,
    EVENT_UPDATE_RECORDING_STATUS,
    EVENT_UPDATE_RECORDING_STATUS_IN_NAVIGATION,
    EVENT_UPDATE_IS_EDIT_MODE_OPEN_IN_NAVIGATION_AND_TABS,
    SHOW_EDIT_MODE_VIOLATION_MODAL,
    EVENT_UPDATE_EVENT_RECORDING_STATUS
} from "../utils/library";
import VideoPlayer from "../containers/VideoPlayer";
import EventController from "../containers/EventController";
import {_checkImageType} from "../utils/js";

//
// STYLE
//

const _Root = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
`;

const _ViewerInfo = styled.div`
  background-color: ${SECTION_BG};
  color: ${SECTION_FG};
  display: flex;
  font-family: monospace;
  height: 30px;
  padding: 0 5px;
  width: 100%;

  i,
  span {
    line-height: 30px;
  }
`;

const _RightColumn = styled.div`
  width: 100%;
  height: 100%;
  border-left: 0.5px solid #ddd;
  background: black;
`;

//
// GENERAL STATE
//
const chance = new Chance();
let measureType = ONE_DIMENSIONAL;
//
// COMPONENT
//

class Image extends PureComponent {
    constructor(props, context) {
        super(props, context);
        this.Viewer = null;
        this.pendingAnnotationMeasureLinear = null;
        this.pendingAnnotationRectangle = null;

        const currentPicture = this.props.pictures[this.props.tabData.pictures_selection[this.props.currentPictureIndexInSelection]];

        let imageCalibration = null;
        if (currentPicture && currentPicture.sha1 in this.props.picturesByCalibration) {
            imageCalibration = this.props.picturesByCalibration[currentPicture.sha1]
        }

        this.state = {
            currentAnnotationTool: null,
            currentPicture: currentPicture,
            pendingAnnotationRectangleHeight: 0,
            pendingAnnotationRectangleWidth: 0,
            zoomLevel: null,
            calibrationActive: false,
            pixels: 0,
            selectAxis: 'X',
            imageCalibration: imageCalibration,
            fireSaveEvent: null,
            modal: false,
            richTextValue: RichTextEditor.createEmptyValue(),
            catalognumber: this._extractCatalogNumber(currentPicture),
            videoAnnAddedId: null,
            isAnnotationRecording: false,
            isEventRecordingLive: false
        };

        this.completeAnnotationMeasureLinear = this.completeAnnotationMeasureLinear.bind(this);
        this.makeAnnotationPointOfInterest = this.makeAnnotationPointOfInterest.bind(this);
        this.completeAnnotationRectangular = this.completeAnnotationRectangular.bind(this);
        this.completeAnnotationPolygon = this.completeAnnotationPolygon.bind(this);
        this.completeAnnotationAngle = this.completeAnnotationAngle.bind(this);
        this.tabChangeHandler = this.tabChangeHandler.bind(this);
        this.completeAnnotationOccurrence = this.completeAnnotationOccurrence.bind(this);
        this.completeAnnotationColorPicker = this.completeAnnotationColorPicker.bind(this);
        this.completeAnnotationRatio = this.completeAnnotationRatio.bind(this);
        this.completeAnnotationTranscription = this.completeAnnotationTranscription.bind(this);
        this.completeAnnotationRichtext = this.completeAnnotationRichtext.bind(this);

        this.leafletImage = React.createRef();
    }

    componentDidMount() {
        ee.on(EVENT_UPDATE_RECORDING_STATUS, this._updateIsRecordingStatus);
        ee.on(EVENT_UPDATE_EVENT_RECORDING_STATUS, this._updateEventRecordingStatus);
    }

    componentWillUnmount() {
        ee.removeListener(EVENT_UPDATE_RECORDING_STATUS, this._updateIsRecordingStatus);
        ee.removeListener(EVENT_UPDATE_EVENT_RECORDING_STATUS, this._updateEventRecordingStatus);
    }

    _updateEventRecordingStatus = (isEventRecording) => {
        this.setState({
            isEventRecordingLive: isEventRecording
        })
    }

    componentDidUpdate(prevProps: Readonly<P>, prevState: Readonly<S>, snapshot: SS) {
        if (prevState.videoAnnAddedId === null && this.state.videoAnnAddedId){
            this.setState({
                videoAnnAddedId : null
            })
        }
    }

    componentWillReceiveProps(nextProps) {
        const currentPicture = nextProps.pictures[nextProps.tabData.pictures_selection[nextProps.currentPictureIndexInSelection]];

        let imageCalibration = null;
        if (currentPicture && currentPicture.sha1 in nextProps.picturesByCalibration) {
            imageCalibration = nextProps.picturesByCalibration[currentPicture.sha1]
        }

        this.setState({
            imageCalibration: imageCalibration,
            currentPicture: nextProps.pictures[nextProps.tabData.pictures_selection[nextProps.currentPictureIndexInSelection]],
            catalognumber: this._extractCatalogNumber(currentPicture)
        });

        if (this.leafletImage == null)  {
        }

        if (nextProps.focusedAnnotation && this.leafletImage.current) {
            this.leafletImage.current.highlightAnnotation(nextProps.focusedAnnotation);
        }
    }

    openEditPanelonVideoAnnotationCreate = (videoId , annotationId) => {
        this.setState({
            videoAnnAddedId: annotationId,
            isAnnotationRecording: true
        })
    }

    _updateIsRecordingStatus = () => {
        ee.emit(EVENT_UPDATE_RECORDING_STATUS_IN_NAVIGATION);
        this.setState({
            isAnnotationRecording: false
        })
    }

    render() {
        const { t } = this.props;
        const toolbarConfig = {
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
        if (!this.state.currentPicture) return <Nothing message={t('annotate.lbl_no_picture')}/>;

        const targetColors = {};
        this.props.selectedTaxonomy && this.props.selectedTaxonomy.descriptors
        && this.props.selectedTaxonomy.descriptors.map(target => {
            targetColors[target.id] = target.targetColor;
        });

        return (
            <_Root className="rcn_image">
                <div className="bg">
                    <Row>
                        <Col sm={6} className="hide-overflow">
                            <span className="project-label">{t('global.lbl_project')}:</span><span
                            className="project-name">{this.props.projectName}</span>
                            <span className="project-label">{t('global.lbl_model')}:</span>
                            <span className="project-name">
                    {this.props.selectedTaxonomy ?
                        <Fragment>{this.props.selectedTaxonomy.name} (type: {this.props.selectedTaxonomy.model === MODEL_XPER ?
                            <img height='16px'
                                 alt="app logo"
                                 src='http://www.xper3.fr/resources/img/xper3-logo.png'>
                            </img> : APP_NAME} )</Fragment>
                        : t('annotate.lbl_without_model')
                    }
                            </span>
                        </Col>
                        <Col sm={6}>
                            <span className="title">{t('annotate.title')}</span>
                        </Col>
                    </Row>
                </div>

                <div className='picture-wrapper'>
                    <div className="picture-wrapper-sub">
                        {this.state.zoomLevel && (
                            <_ViewerInfo>
                                <i className="fa fa-search fa" aria-hidden="true"/>
                                &nbsp;&nbsp;
                                <span>{`${(100 * this.state.zoomLevel).toFixed(2)}%`}</span>
                            </_ViewerInfo>
                        )}
                        <Inspector
                            eventAnnotations={this.props.annotationsEventAnnotations}
                            annotationsChronothematique={this.props.annotationsChronothematique}
                            videoAnnAddedId = {this.state.videoAnnAddedId}
                            isAnnotationRecording = {this.state.isAnnotationRecording}
                            annotationsMeasuresLinear={this.props.annotationsMeasuresLinear}
                            annotationsPointsOfInterest={this.props.annotationsPointsOfInterest}
                            annotationsRectangular={this.props.annotationsRectangular}
                            annotationsPolygon={this.props.annotationsPolygon}
                            annotationsAngle={this.props.annotationsAngle}
                            annotationsOccurrence={this.props.annotationsOccurrence}
                            annotationsColorPicker={this.props.annotationsColorPicker}
                            annotationsRatio={this.props.annotationsRatio}
                            annotationsTranscription={this.props.annotationsTranscription}
                            annotationsCategorical={this.props.annotationsCategorical}
                            annotationsRichtext={this.props.annotationsRichtext}
                            selectAnnotation={this._callEditAnnotation}
                            saveOrCancelEditAnnotation={this._callSaveOrCancelEdit}
                            setAnnotationColor={this._setAnnotationColor}
                            deleteAnnotationChronothematique={this.props.deleteAnnotationChronothematique}
                            deleteEventAnnotation={this.props.deleteEventAnnotation}
                            deleteAnnotationMeasureLinear={this._deleteAnnotationMeasureLinear}
                            deleteAnnotationPointOfInterest={this._deleteAnnotationPointOfInterest}
                            deleteAnnotationRectangular={this._deleteAnnotationRectangular}
                            deleteAnnotationPolygon={this._deleteAnnotationPolygon}
                            deleteAnnotationAngle={this._deleteAnnotationAngle}
                            deleteAnnotationOccurrence={this._deleteAnnotationOccurrence}
                            deleteAnnotationColorPicker={this._deleteAnnotationColorPicker}
                            deleteAnnotationRatio={this._deleteAnnotationRatio}
                            deleteAnnotationTranscription={this._deleteAnnotationTranscription}
                            deleteAnnotationRichtext={this._deleteAnnotationRichtext}
                            deleteCartel={this._deleteCartel}
                            picture={this.state.currentPicture}
                            tags={this.props.tagsByPicture[this.state.currentPicture.sha1]}
                            activateCalibration={this.tabChangeHandler}
                            pixels={this.state.pixels}
                            selectAxis={this.state.selectAxis}
                            changeMeasureType={this._changeMeasureType}
                            deleteAxis={this._deleteAxis}
                            changeCalibration={this._changeCalibration}
                            fireSaveEvent={this.state.fireSaveEvent}
                            editedAnnotation={this.state.editedAnnotation}
                            readOnly={false}
                            tabName={this.props.tabName}
                            currentAnnotationTool={this.state.currentAnnotationTool}
                            updateAnnotation={this._updateAnnotation}
                            navigationHandler={this._navigationHandler}
                            leafletImage={this.leafletImage}
                            currentPicture={this.state.currentPicture}
                            isFromLibraryView={false}
                        />
                    </div>
                    <_RightColumn>
                        <div className="navigation">
                            <div className="navigation-buttons">
                                <img alt="navigation icon" src={require('./pictures/fast-backward.svg')}
                                     onClick={e => this._navigationHandler(e, this.props.firstPictureInSelection)}/>
                                <img alt="navigation icon" src={require('./pictures/backward.svg')}
                                     onClick={e => this._navigationHandler(e, this.props.previousTenPictureInSelection)}/>
                                <img alt="navigation icon"  src={require('./pictures/step-backward.svg')}
                                     onClick={e => this._navigationHandler(e, this.props.previousPictureInSelection)}/>
                                <span className="navigation-title">
                                    {t('annotate.lbl_picture_in_current_selection', {index_in_selection: this.props.currentPictureIndexInSelection + 1, pictures_length:this.props.picturesSelection.length, catalog_number: this.state.catalognumber})}
                                    <div title={this.state.currentPicture.file_basename}
                                         className="file-name">{t('annotate.lbl_filename')}: {this.state.currentPicture.file_basename}</div>
                                </span>
                                <img alt="navigation icon" src={require('./pictures/step-forward.svg')}
                                     onClick={e => this._navigationHandler(e, this.props.nextPictureInSelection)}/>
                                <img alt="navigation icon" src={require('./pictures/forward.svg')}
                                     onClick={e => this._navigationHandler(e, this.props.nextTenPictureInSelection)}/>
                                <img alt="navigation icon" src={require('./pictures/fast-forward.svg')}
                                     onClick={e => this._navigationHandler(e, this.props.lastPictureInSelection)}/>
                            </div>
                        </div>
                        {
                            this.state.currentPicture.resourceType === RESOURCE_TYPE_VIDEO ?
                                <VideoPlayer
                                    annotationsChronothematique={this.props.annotationsChronothematique[this.state.currentPicture.sha1]}
                                    currentPicture={this.state.currentPicture}
                                    isEditing={this.state.currentAnnotationTool}
                                    editedAnnotation={this.state.editedAnnotation}
                                    openEditPanelonVideoAnnotationCreate={this.openEditPanelonVideoAnnotationCreate}

                                    leafletPositionByPicture={this.props.leafletPositionByPicture}
                                    annotationsMeasuresLinear={this.props.annotationsMeasuresLinear[this.state.currentPicture.sha1]}
                                    annotationsPointsOfInterest={this.props.annotationsPointsOfInterest[this.state.currentPicture.sha1]}
                                    annotationsRectangular={this.props.annotationsRectangular[this.state.currentPicture.sha1]}
                                    annotationsPolygon={this.props.annotationsPolygon[this.state.currentPicture.sha1]}
                                    annotationsAngle={this.props.annotationsAngle[this.state.currentPicture.sha1]}
                                    annotationsColorPicker={this.props.annotationsColorPicker[this.state.currentPicture.sha1]}
                                    annotationsOccurrence={this.props.annotationsOccurrence[this.state.currentPicture.sha1]}
                                    annotationsTranscription={this.props.annotationsTranscription[this.state.currentPicture.sha1]}
                                    annotationsRichtext={this.props.annotationsRichtext[this.state.currentPicture.sha1]}
                                    targetColors={targetColors}

                                    onCreated={this._onCreated}
                                    onEditStop={this._onEditStop}
                                    onDrawStart={this._onDrawStart}
                                    onDrawStop={this._onDrawStop}
                                    calibrationMode={this.state.calibrationActive}
                                    fireSaveEvent={this._fireSaveEvent}
                                    onContextMenuEvent={this._handleLeafletContextMenu}
                                    taxonomyInstance={this.props.taxonomyInstance}
                                    repeatMode={this.props.repeatMode}
                                    saveLeafletSettings={this.props.saveLeafletSettings}
                                    leafletVideo={this.leafletImage}
                                /> : null
                        }
                        {
                            _checkImageType(this.state.currentPicture) ?
                                <LeafletImage currentPicture={this.state.currentPicture} ref={this.leafletImage}
                                          leafletPositionByPicture={this.props.leafletPositionByPicture}
                                          annotationsMeasuresLinear={this.props.annotationsMeasuresLinear[this.state.currentPicture.sha1]}
                                          annotationsPointsOfInterest={this.props.annotationsPointsOfInterest[this.state.currentPicture.sha1]}
                                          annotationsRectangular={this.props.annotationsRectangular[this.state.currentPicture.sha1]}
                                          annotationsPolygon={this.props.annotationsPolygon[this.state.currentPicture.sha1]}
                                          annotationsAngle={this.props.annotationsAngle[this.state.currentPicture.sha1]}
                                          annotationsColorPicker={this.props.annotationsColorPicker[this.state.currentPicture.sha1]}
                                          annotationsOccurrence={this.props.annotationsOccurrence[this.state.currentPicture.sha1]}
                                          annotationsTranscription={this.props.annotationsTranscription[this.state.currentPicture.sha1]}
                                          annotationsRichtext={this.props.annotationsRichtext[this.state.currentPicture.sha1]}
                                          onCreated={this._onCreated}
                                          onEditStop={this._onEditStop}
                                          onDrawStart={this._onDrawStart}
                                          onDrawStop={this._onDrawStop}
                                          calibrationMode={this.state.calibrationActive}
                                          fireSaveEvent={this._fireSaveEvent}
                                          onContextMenuEvent={this._handleLeafletContextMenu}
                                          targetColors={targetColors}
                                          taxonomyInstance={this.props.taxonomyInstance}
                                          repeatMode={this.props.repeatMode}
                                          saveLeafletSettings={this.props.saveLeafletSettings}
                            /> : null
                        }
                        {
                            this.state.currentPicture.resourceType === RESOURCE_TYPE_EVENT ?
                                <EventController
                                    eventAnnotations={this.props.annotationsEventAnnotations[this.state.currentPicture.sha1] || []}
                                    currentPicture={this.state.currentPicture}
                                    isEditing={this.state.currentAnnotationTool}
                                    editedAnnotation={this.state.editedAnnotation}
                                    openEditPanelonAnnotationCreate={this.openEditPanelonVideoAnnotationCreate}

                                /> : null
                        }
                    </_RightColumn>
                </div>
                <div>
                    <Modal isOpen={this.state.modal}
                           size="lg"
                           scrollable={true}
                           toggle={this._toggle} wrapClassName="bst" autoFocus={false}>
                        <ModalHeader toggle={this._toggle}>{t('annotate.editor.dialog_text_edit_title')}</ModalHeader>
                        <ModalBody>
                            <Form className="rte-container" onSubmit={(e) => {
                                e.preventDefault();
                                this._saveRichText();
                            }}>
                                <FormGroup row>
                                    <Col sm={12}>
                                        <RichTextEditor editorClassName="rte-annotate" autoFocus={true}
                                                        toolbarConfig={toolbarConfig}
                                                        value={this.state.richTextValue}
                                                        onChange={this.richTextOnChange}
                                        />
                                    </Col>
                                </FormGroup>
                            </Form>
                        </ModalBody>
                        <ModalFooter>
                            <Button color="primary" onClick={this._saveRichText}>{t('global.save')}</Button>
                            <Button color="secondary" onClick={() => this._toggle(true)}>{t('global.cancel')}</Button>
                        </ModalFooter>
                    </Modal>
                </div>
            </_Root>
        );
    }

    _getImageCalibration = () => {
        if (this.state.imageCalibration) {
            return {
                dpix: this.state.imageCalibration.dpix,
                dpiy: this.state.imageCalibration.dpiy
            }
        } else {
            return {
                dpix: this.state.currentPicture.dpix,
                dpiy: this.state.currentPicture.dpiy
            }
        }
    };

    _changeCalibration = (applyToAll, editList) => {
        let imageCalibration = null;
        if (this.state.currentPicture.sha1 in this.props.picturesByCalibration) {
            imageCalibration = this.props.picturesByCalibration[this.state.currentPicture.sha1]
        }
        this.setState({
            imageCalibration: imageCalibration
        });

        let dpi;
        if (imageCalibration) {
            dpi = {
                dpix: imageCalibration.dpix,
                dpiy: imageCalibration.dpiy
            }
        } else {
            dpi = {
                dpix: this.state.currentPicture.dpix,
                dpiy: this.state.currentPicture.dpiy
            }
        }

        if (applyToAll) {
            this.props.picturesSelection.map(sha1 => {
                this._recalculateValues(sha1, dpi);
            });
        }
        if (editList) {
            this.props.picturesSelection.map(sha1 => {
                if (editList.indexOf(sha1) >= 0) {
                    this._recalculateValues(sha1, dpi);
                }
            });
        } else {
            this._recalculateValues(this.state.currentPicture.sha1, dpi);
        }
    };

    _recalculateValues = (sha1, dpi) => {
        const props = this.props;
        if (props.annotationsMeasuresLinear) {
            const allAnnotationsMeasuresLinear = props.annotationsMeasuresLinear[sha1] || [];
            allAnnotationsMeasuresLinear.map(annotation => {
                const totalLength = annotation.vertices.reduce((accumulator, currentValue, currentIndex, array) => {
                    if (currentIndex === 0)
                        return 0;
                    const previousValue = array[currentIndex - 1];
                    return getCartesianDistanceInMm(
                        previousValue.x,
                        previousValue.y,
                        currentValue.x,
                        currentValue.y,
                        dpi.dpix,
                        dpi.dpiy
                    ) + accumulator;
                }, 0);

                this.props.editAnnotation(
                    sha1,
                    annotation.annotationType,
                    annotation.id,
                    annotation.title,
                    annotation.text,
                    {vertices: annotation.vertices, value_in_mm: totalLength, area: null, value_in_deg: null}
                );

                //Find and update all ratio annotations where current annotation is used.
                if (ANNOTATION_SIMPLELINE === annotation.annotationType &&
                    this.props.annotationsRatio[sha1]) {
                    this.props.annotationsRatio[sha1].map(annotationRatio => {
                        //Check if current ration annotation has this simple-line annotation
                        if (annotationRatio.line1 === annotation.id) {
                            this.props.editAnnotation(
                                sha1,
                                annotationRatio.annotationType,
                                annotationRatio.id,
                                annotationRatio.title,
                                annotationRatio.text,
                                {value1: totalLength, value2: annotationRatio.value2}
                            );
                        } else if (annotationRatio.line2 === annotation.id) {
                            this.props.editAnnotation(
                                sha1,
                                annotationRatio.annotationType,
                                annotationRatio.id,
                                annotationRatio.title,
                                annotationRatio.text,
                                {value1: annotationRatio.value1, value2: totalLength}
                            );
                        }
                    });
                }
            });
        }

        if (props.annotationsPolygon) {
            const allAnnotationsPolygon = props.annotationsPolygon[sha1] || [];
            allAnnotationsPolygon.map(annotation => {
                const area = surfacePolygonInMm(annotation.vertices, dpi.dpix, dpi.dpiy);
                this.props.editAnnotation(
                    sha1,
                    annotation.annotationType,
                    annotation.id,
                    annotation.title,
                    annotation.text,
                    {vertices: annotation.vertices, value_in_mm: null, area: area, value_in_deg: null}
                );
            });
        }

        if (props.annotationsAngle) {
            const allAnnotationsAngle = props.annotationsAngle[sha1] || [];
            allAnnotationsAngle.map(annotation => {
                const angleVal = getAngleInDegrees(annotation.vertices[0], annotation.vertices[1], annotation.vertices[2], dpi.dpix, dpi.dpiy);
                this.props.editAnnotation(
                    sha1,
                    annotation.annotationType,
                    annotation.id,
                    annotation.title,
                    annotation.text,
                    {vertices: annotation.vertices, value_in_mm: null, area: null, value_in_deg: angleVal}
                );
            });
        }
    };

    _deleteAxis = (axis) => {
        console.log('Delete axis %s', axis);
        this.leafletImage.current.deleteAnnotation(axis);
        if (this.state.calibrationActive) {
            const cAxis = this.leafletImage.current.getCalibrationAxis();

            const selectAxis = cAxis.length === 0 ? 'X' : (cAxis.includes('X') ? 'Y' : 'X');
            this.setState({
                selectAxis: selectAxis
            });

            if ((measureType === TWO_DIMENSIONAL && cAxis.length < 2) || (measureType === ONE_DIMENSIONAL && cAxis.length < 1)) {
                this.leafletImage.current.enableToolBox(false);
                this.leafletImage.current.showHideToolbar(true);
            }
        }
    };

    _changeMeasureType = (type) => {
        measureType = type;
    };

    _onEditStop = () => {
        this.setAnnotationTool(null);
    };

    _onCreated = (e) => {
        console.log('On Created %o %s', e, this.state.currentAnnotationTool);

        if (this.state.calibrationActive) {
            const lineVertices = e.layer.getLatLngs().map(latLng => {
                return this.leafletImage.current.getRealCoordinates(latLng);
            })
            const px = lineVertices.reduce((accumulator, currentValue, currentIndex, array) => {
                if (currentIndex === 0)
                    return 0;
                const previousValue = array[currentIndex - 1];
                return getCartesianDistanceInPx(previousValue.x,
                    previousValue.y,
                    currentValue.x,
                    currentValue.y).toFixed(0);
            }, 0);

            this.setState({pixels: px});

            e.layer.annotationId = this.state.selectAxis;
            this.setState({
                currentAnnotationTool: null
            });
        } else if (this.state.currentAnnotationTool !== null) {
            e.layer.annotationId = chance.guid();
            e.layer.annotationType = this.state.currentAnnotationTool;

            switch (this.state.currentAnnotationTool) {
                case ANNOTATION_POLYGON:
                    this.completeAnnotationPolygon(e.layer.getLatLngs()[0].map(latLng => {
                        return this.leafletImage.current.getRealCoordinates(latLng);
                    }), e.layer.annotationId);
                    break;
                case ANNOTATION_SIMPLELINE:
                case ANNOTATION_POLYLINE:
                    const lineVertices = e.layer.getLatLngs().map(latLng => {
                        return this.leafletImage.current.getRealCoordinates(latLng);
                    })
                    const totalLength = lineVertices.reduce((accumulator, currentValue, currentIndex, array) => {
                        if (currentIndex === 0)
                            return 0;
                        const previousValue = array[currentIndex - 1];
                        return getCartesianDistanceInMm(
                            previousValue.x,
                            previousValue.y,
                            currentValue.x,
                            currentValue.y,
                            this._getImageCalibration().dpix,
                            this._getImageCalibration().dpiy
                        ) + accumulator;
                    }, 0);
                    e.layer.totalLength = totalLength;
                    this.completeAnnotationMeasureLinear(lineVertices, e.layer.annotationId, this.state.currentAnnotationTool, totalLength);
                    break;
                case ANNOTATION_RECTANGLE:
                    this.completeAnnotationRectangular(e.layer.getLatLngs()[0].map(latLng => {
                        return this.leafletImage.current.getRealCoordinates(latLng);
                    }), e.layer.annotationId, e.layer.video);

                    const rects = this.props.annotationsRectangular[this.state.currentPicture.sha1].filter(annotation => annotation.id === e.layer.annotationId);
                    if (rects.length > 0) {
                        e.layer.bindTooltip(rects[0].title, {
                            permanent: true,
                            sticky: false,
                            opacity: 1,
                            direction: 'center',
                            className: 'zoi-tooltip'
                            //offset: L.point(-20, -30)
                        }).openTooltip();
                    }
                    break;
                case ANNOTATION_CIRCLEMARKER:
                case ANNOTATION_MARKER:
                    const point = this.leafletImage.current.getRealCoordinates(e.layer.getLatLng());
                    this.makeAnnotationPointOfInterest(point.x, point.y, e.layer.annotationId, e.layer.video);

                    const points = this.props.annotationsPointsOfInterest[this.state.currentPicture.sha1].filter(annotation => annotation.id === e.layer.annotationId);
                    if (points.length > 0) {
                        e.layer.bindTooltip(points[0].title, {
                            permanent: true,
                            opacity: 0.7,
                            direction: 'right',
                            className: 'poi-tooltip',
                            offset: L.point(-20, -30)
                        }).openTooltip();
                    }

                    break;
                case ANNOTATION_ANGLE:
                    const vertices = e.layer.getLatLngs().map(latLng => {
                        return this.leafletImage.current.getRealCoordinates(latLng);
                    });
                    this.completeAnnotationAngle(vertices, getAngleInDegrees(vertices[0], vertices[1], vertices[2], this._getImageCalibration().dpix, this._getImageCalibration().dpiy),
                        e.layer.annotationId);
                    break;
                case ANNOTATION_COLORPICKER:
                    this.completeAnnotationColorPicker(e.layer.color, e.layer.point.x, e.layer.point.y, e.layer.annotationId);
                    break;
                case ANNOTATION_RATIO:
                    const line1Cord1 = this.leafletImage.current.getRealCoordinates(e.layer.line1[0]);
                    const line1Cord2 = this.leafletImage.current.getRealCoordinates(e.layer.line1[1]);
                    const line2Cord1 = this.leafletImage.current.getRealCoordinates(e.layer.line2[0]);
                    const line2Cord2 = this.leafletImage.current.getRealCoordinates(e.layer.line2[1]);

                    const line1 = getCartesianDistanceInMm(
                        line1Cord1.x,
                        line1Cord1.y,
                        line1Cord2.x,
                        line1Cord2.y,
                        this._getImageCalibration().dpix,
                        this._getImageCalibration().dpiy
                    );

                    const line2 = getCartesianDistanceInMm(
                        line2Cord1.x,
                        line2Cord1.y,
                        line2Cord2.x,
                        line2Cord2.y,
                        this._getImageCalibration().dpix,
                        this._getImageCalibration().dpiy
                    );
                    this.completeAnnotationRatio(line1, line2, e.layer.line1Annotation, e.layer.line2Annotation, e.layer.annotationId);
                    break;
                case ANNOTATION_OCCURRENCE:
                    this.completeAnnotationOccurrence(e.layer.vertices.map(latLng => {
                        return this.leafletImage.current.getRealCoordinates(latLng);
                    }), e.layer.annotationId);

                    break;
                case ANNOTATION_TRANSCRIPTION: {
                    this.completeAnnotationTranscription(e.layer.getLatLngs()[0].map(latLng => {
                        return this.leafletImage.current.getRealCoordinates(latLng);
                    }), e.layer.annotationId);
                    // Open edit mode right after annotation creation.
                    setTimeout(_ => {
                        if (this.props.annotationsTranscription[this.state.currentPicture.sha1]) {
                            this.props.annotationsTranscription[this.state.currentPicture.sha1].map(_ => {
                                if (_.id === e.layer.annotationId) {
                                    this.setState({
                                        currentAnnotationTool: null,
                                        editedAnnotation: _
                                    });
                                }
                            })
                        }
                    }, 300)
                }
                    break;
                case ANNOTATION_RICHTEXT: {
                    const rteVertices = e.layer.getLatLngs()[0].map(latLng => {
                        return this.leafletImage.current.getRealCoordinates(latLng);
                    });
                    setTimeout(() => {
                        this.setState({
                            modal: true,
                            rteVertices: rteVertices,
                            rteAnnotationId: e.layer.annotationId,
                            richTextLayer: e.layer
                        });
                    }, 200);
                }
                    break;
            }
        } else if (e.layerType === ANNOTATION_CATEGORICAL) {
            e.layer.annotationId = chance.guid();
            e.layer.annotationType = ANNOTATION_CATEGORICAL;
            this.props.createAnnotationCategorical(this.state.currentPicture.sha1, [{
                x: 0,
                y: 0
            }], e.layer.annotationId);
        } else if (e.layerType === CARTEL) {
            if (this.state.currentPicture.sha1 in this.props.cartels) {
                ee.emit(EVENT_EDIT_CARTEL);
                return;
            }

            e.layer.annotationId = chance.guid();
            e.layer.annotationType = CARTEL;

            this.setState({
                modal: true,
                isCartel: true,
                rteAnnotationId: e.layer.annotationId,
                richTextLayer: e.layer
            });
        }
    };

    _handleLeafletContextMenu = (annotationId, annotationType, eventType) => {
        if (eventType === EDIT_EVENT) {
            //Merge all annotations and find selected one.
            const sha1 = this.state.currentPicture.sha1;

            const annotation = [
                ...this.props.annotationsPolygon[sha1] || ''
                , ...this.props.annotationsMeasuresLinear[sha1] || ''
                , ...this.props.annotationsRectangular[sha1] || []
                , ...this.props.annotationsPointsOfInterest[sha1] || ''
                , ...this.props.annotationsColorPicker[sha1] || ''
                , ...this.props.annotationsAngle[sha1] || ''
                , ...this.props.annotationsTranscription[sha1] || ''
                , ...this.props.annotationsRichtext[sha1] || ''
            ].filter(_ => _.id === annotationId);

            if (annotation && annotation.length > 0) {
                this.setState({
                    editedAnnotation: annotation[0]
                })
            }
        } else if (eventType === DELETE_EVENT) {
            switch (annotationType) {
                case ANNOTATION_POLYGON:
                    this._deleteAnnotationPolygon(this.state.currentPicture.sha1, annotationId);
                    break;
                case ANNOTATION_SIMPLELINE:
                case ANNOTATION_POLYLINE:
                    this._deleteAnnotationMeasureLinear(this.state.currentPicture.sha1, annotationId);
                    break;
                case ANNOTATION_RECTANGLE:
                    this._deleteAnnotationRectangular(this.state.currentPicture.sha1, annotationId);
                    break;
                case ANNOTATION_CIRCLEMARKER:
                case ANNOTATION_MARKER:
                    this._deleteAnnotationPointOfInterest(this.state.currentPicture.sha1, annotationId);
                    break;
                case ANNOTATION_ANGLE:
                    this._deleteAnnotationAngle(this.state.currentPicture.sha1, annotationId);
                    break;
                case ANNOTATION_COLORPICKER:
                    this._deleteAnnotationColorPicker(this.state.currentPicture.sha1, annotationId);
                    break;
                case ANNOTATION_TRANSCRIPTION:
                    this._deleteAnnotationTranscription(this.state.currentPicture.sha1, annotationId);
                    break;
                case ANNOTATION_RICHTEXT:
                    this._deleteAnnotationRichtext(this.state.currentPicture.sha1, annotationId);
                    break;
            }
        }
    };

    _fireSaveEvent = (event) => {
        this.setState({fireSaveEvent: event});
    };

    _onDrawStart = (e) => {
        this.setAnnotationTool(e.layerType);
    };

    _onDrawStop = () => {
        this.setAnnotationTool(null);
        if (this.state.calibrationActive) {
            const axis = this.leafletImage.current.getCalibrationAxis();

            const selectAxis = axis.length === 0 ? 'X' : (axis.includes('X') ? 'Y' : 'X');
            this.setState({
                selectAxis: selectAxis
            });

            if ((measureType === TWO_DIMENSIONAL && axis.length === 2) || (measureType === ONE_DIMENSIONAL && axis.length === 1))
                this.leafletImage.current.showHideToolbar(false);
        }
    };

    _callEditAnnotation = (annotation) => {
        if (this.state.currentAnnotationTool)
            return null;
        this.setAnnotationTool(annotation.annotationType);
        if (annotation.annotationType === ANNOTATION_CHRONOTHEMATIQUE || annotation.annotationType === ANNOTATION_EVENT_ANNOTATION){
            this.setState({
                editedAnnotation: annotation
            });
        }else {
            this.leafletImage.current.editAnnotation(annotation);
        }
        ee.emit(EVENT_UPDATE_IS_EDIT_MODE_OPEN_IN_NAVIGATION_AND_TABS , true);
        return true;
    };

    _callSaveOrCancelEdit = (save, title, value , isVideoAnnotation , person , date, location , tags , topic) => {
        if (isVideoAnnotation){
            let annotation = {
                value: value,
                person: person,
                date:  date,
                location: location,
                topic: topic ? topic : ''
            }
            this.setState({
                editedAnnotation: null
            });
            this.setAnnotationTool(null);
            return  annotation;
        } else {
            if (this.leafletImage === null || this.leafletImage.current === null){
                this.setAnnotationTool(null);
                this.setState({
                    editedAnnotation: null
                });
                return false;
            }
            const editedLayer = this.leafletImage.current.saveOrCancelEdit(save);

            let vertices = null;
            let area = null;
            let value_in_mm = null;
            let value_in_deg = null;

            this.setState({
                editedAnnotation: null
            });

            if (save) {
                if (editedLayer !== null) {
                    switch (editedLayer.annotationType) {
                        case ANNOTATION_POLYLINE:
                        case ANNOTATION_SIMPLELINE:
                            vertices = editedLayer.getLatLngs().map(latLng => {
                                return this.leafletImage.current.getRealCoordinates(latLng);
                            });
                            value_in_mm = vertices.reduce((accumulator, currentValue, currentIndex, array) => {
                                if (currentIndex === 0)
                                    return 0;
                                const previousValue = array[currentIndex - 1];
                                return getCartesianDistanceInMm(
                                    previousValue.x,
                                    previousValue.y,
                                    currentValue.x,
                                    currentValue.y,
                                    this._getImageCalibration().dpix,
                                    this._getImageCalibration().dpiy
                                ) + accumulator;
                            }, 0);
                            break;
                        case ANNOTATION_POLYGON:
                        case ANNOTATION_RECTANGLE:
                        case ANNOTATION_TRANSCRIPTION:
                            //TODO calculate total area
                            vertices = editedLayer.getLatLngs()[0].map(latLng => {
                                return this.leafletImage.current.getRealCoordinates(latLng);
                            });
                            area = surfacePolygonInMm(vertices, this._getImageCalibration().dpix, this._getImageCalibration().dpiy);
                            editedLayer.setTooltipContent(title);
                            break;
                        case ANNOTATION_CIRCLEMARKER:
                        case ANNOTATION_MARKER:
                            vertices = this.leafletImage.current.getRealCoordinates(editedLayer.getLatLng());
                            editedLayer.setTooltipContent(title);
                            break;
                        case ANNOTATION_ANGLE:
                            vertices = editedLayer.getLatLngs().map(latLng => {
                                return this.leafletImage.current.getRealCoordinates(latLng);
                            });
                            value_in_deg = getAngleInDegrees(vertices[0], vertices[1], vertices[2], this._getImageCalibration().dpix, this._getImageCalibration().dpiy);
                            break;
                        case ANNOTATION_COLORPICKER:
                            vertices = this.leafletImage.current.getRealCoordinates(editedLayer.getLatLng());
                            editedLayer.setTooltipContent(title);
                            break;
                        case ANNOTATION_OCCURRENCE:
                            vertices = editedLayer.coords.map(latLng => {
                                return this.leafletImage.current.getRealCoordinates(latLng);
                            });
                            break
                        case ANNOTATION_RICHTEXT:
                            vertices = editedLayer.getLatLngs()[0].map(latLng => {
                                return this.leafletImage.current.getRealCoordinates(latLng);
                            });
                            editedLayer.setText(null).setText(value);
                            break
                    }
                }
            }
            this.setAnnotationTool(null);
            console.log({vertices, value_in_mm, area, value_in_deg, color: ''})
            return lodash.omitBy({
                vertices,
                value_in_mm,
                area,
                value_in_deg,
                color: ''
            }, v => lodash.isUndefined(v) || lodash.isNull(v));
        }
    };

    _deleteAnnotationMeasureLinear = (sha1, id) => {
        this.props.deleteAnnotationMeasureLinear(sha1, id, this.props.tabName);
        //Delete all ratio annotations where deleted annotation is used.
        if (this.props.annotationsRatio[sha1]) {
            this.props.annotationsRatio[sha1].map(annotation => {
                this._deleteAnnotationRatio(sha1, annotation.id);
            });
        }
        this.leafletImage.current.deleteAnnotation(id);
    };

    _deleteAnnotationPointOfInterest = (sha1, id) => {
        this.props.deleteAnnotationPointOfInterest(sha1, id);
        this.leafletImage.current.deleteAnnotation(id);
    };

    _deleteAnnotationRectangular = (sha1, id) => {
        this.props.deleteAnnotationRectangular(sha1, id);
        this.leafletImage.current.deleteAnnotation(id);
    };

    _deleteAnnotationPolygon = (sha1, id) => {
        this.props.deleteAnnotationPolygon(sha1, id, this.props.tabName);
        this.leafletImage.current.deleteAnnotation(id);
    };

    _deleteAnnotationAngle = (sha1, id) => {
        this.props.deleteAnnotationAngle(sha1, id, this.props.tabName);
        this.leafletImage.current.deleteAnnotation(id);
    };

    _deleteAnnotationColorPicker = (sha1, id) => {
        this.props.deleteAnnotationColorPicker(sha1, id);
        this.leafletImage.current.deleteAnnotation(id);
    };

    _deleteAnnotationOccurrence = (sha1, id) => {
        this.props.deleteAnnotationOccurrence(sha1, id, this.props.tabName);
    };

    _deleteAnnotationRatio = (sha1, id) => {
        this.props.deleteAnnotationRatio(sha1, id);
    };

    _setAnnotationColor = (id, color) => {
        this.leafletImage.current.setAnnotationColor(id, color);
    };

    _deleteAnnotationTranscription = (sha1, id) => {
        this.props.deleteAnnotationTranscription(sha1, id);
        this.leafletImage.current.deleteAnnotation(id);
    };

    _deleteAnnotationRichtext = (sha1, id) => {
        this.props.deleteAnnotationRichtext(sha1, id);
        this.leafletImage.current.deleteAnnotation(id);
    };

    _deleteCartel = (sha1, id) => {
        this.props.deleteCartel(sha1, id);
        this.leafletImage.current.deleteAnnotation(id);
    };

    // BUSINESS LOGIC
    completeAnnotationMeasureLinear(vertices, id, type, totalLength) {
        this.props.createAnnotationMeasurePolyline(
            this.state.currentPicture.sha1,
            totalLength,
            vertices,
            id,
            type
        );
    }

    makeAnnotationPointOfInterest(x, y, id, video) {
        this.props.createAnnotationPointOfInterest(this.state.currentPicture.sha1, x, y, id, video);
    }

    completeAnnotationRectangular(vertices, id, video) {
        this.props.createAnnotationRectangular(this.state.currentPicture.sha1, vertices, id, video);
    }

    completeAnnotationPolygon(vertices, id) {
        this.props.createAnnotationPolygon(this.state.currentPicture.sha1, vertices, surfacePolygonInMm(vertices, this._getImageCalibration().dpix, this._getImageCalibration().dpiy), id);
    }

    completeAnnotationAngle(vertices, valueDeg, id) {
        this.props.createAnnotationAngle(
            this.state.currentPicture.sha1,
            valueDeg,
            vertices,
            id
        );
    }

    completeAnnotationColorPicker(color, x, y, id) {
        this.props.createAnnotationColorPicker(
            this.state.currentPicture.sha1,
            color,
            x,
            y,
            id
        );
    }

    completeAnnotationRatio(value1, value2, line1, line2, id) {
        this.props.createAnnotationRatio(this.state.currentPicture.sha1, value1, value2, line1, line2, id);
    }

    completeAnnotationOccurrence(vertices, id) {
        this.props.createAnnotationOccurrence(this.state.currentPicture.sha1, vertices, id);
    }

    completeAnnotationTranscription(vertices, id) {
        this.props.createAnnotationTranscription(this.state.currentPicture.sha1, vertices, id);
    }

    completeAnnotationRichtext(vertices, id, richText) {
        this.props.createAnnotationRichtext(this.state.currentPicture.sha1, vertices, id, richText);
    }


    setAnnotationTool(tool) {
        this.setState({
            currentAnnotationTool: tool,
            pendingAnnotationRectangleHeight: 0,
            pendingAnnotationRectangleWidth: 0
        });
    }

    tabChangeHandler(status) {
        this.setState({
            calibrationActive: status,
            selectAxis: 'X'
        });
        if (status)
            measureType = ONE_DIMENSIONAL;
    }

    _updateAnnotation = (id, text) => {
        this.leafletImage.current.updateAnnotation(id, text);
    };

    _navigationHandler = (e, callAction) => {
        const { t } = this.props;
        if (this.state.calibrationActive) {
            remote.dialog.showMessageBox(remote.getCurrentWindow(), {
                type: 'info',
                message: t('global.info'),
                detail: t('library.alert_please_close_calibration_mode'),
                cancelId: 1
            });
        }
        else if (this.state.isEventRecordingLive){
            ee.emit(SHOW_EDIT_MODE_VIOLATION_MODAL);
        }
        else if (this.state.currentAnnotationTool === null)
            callAction(this.props.tabName);
        else {
            ee.emit(SHOW_EDIT_MODE_VIOLATION_MODAL);
        }
    }

    _saveRichText = () => {
        if (!this.state.isCartel) {
            this.completeAnnotationRichtext(this.state.rteVertices, this.state.rteAnnotationId, this.state.richTextValue.toString('html'));
        }

        setTimeout(() => {
            if (this.state.isCartel) {
                this.props.createCartel(this.state.currentPicture.sha1, this.state.rteAnnotationId, this.state.richTextValue.toString('html'))
            } else {
                const rtexts = this.props.annotationsRichtext[this.state.currentPicture.sha1].filter(annotation => annotation.id === this.state.rteAnnotationId);
                if (rtexts.length > 0) {
                    this.state.richTextLayer.setText(rtexts[0].value);
                }
            }
            this.setState({
                modal: false,
                isCartel: null,
                richTextValue: RichTextEditor.createEmptyValue(),
                rteVertices: null,
                rteAnnotationId: null,
                richTextLayer: null
            });
        }, 500);
    };

    _toggle = (cancel) => {
        if (cancel && !this.state.isCartel) {
            this.leafletImage.current.deleteAnnotation(this.state.rteAnnotationId);
        }
        this.state.richTextLayer = null;
        this.setState({
            richTextValue: RichTextEditor.createEmptyValue(),
            modal: !this.state.modal,
            isCartel: null,
            rteVertices: null,
            rteAnnotationId: null
        });
    };

    richTextOnChange = (richTextValue) => {
        this.setState({richTextValue});
    };

    _extractCatalogNumber = (currentPicture) => {
        let catalognumber = 'N/A';
        if (currentPicture) {
            if (currentPicture.erecolnatMetadata !== undefined && currentPicture.erecolnatMetadata.catalognumber !== undefined) {
                catalognumber = currentPicture.erecolnatMetadata.catalognumber;
            } else {
                const metadata = loadMetadata(currentPicture.sha1);
                if (metadata && metadata.naturalScienceMetadata !== undefined && metadata.naturalScienceMetadata.catalogNumber !== undefined) {
                    catalognumber = metadata.naturalScienceMetadata.catalogNumber;
                }
            }
        }
        return catalognumber;
    }

}

export default Image;
