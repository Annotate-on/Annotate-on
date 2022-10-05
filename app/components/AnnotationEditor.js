import React, {Component, Fragment} from 'react';
import {
    ANNOTATION_ANGLE,
    ANNOTATION_CATEGORICAL,
    ANNOTATION_CHRONOTHEMATIQUE,
    ANNOTATION_COLORPICKER,
    ANNOTATION_EVENT_ANNOTATION,
    ANNOTATION_MARKER,
    ANNOTATION_OCCURRENCE,
    ANNOTATION_POLYGON,
    ANNOTATION_POLYLINE,
    ANNOTATION_RECTANGLE,
    ANNOTATION_RICHTEXT,
    ANNOTATION_SIMPLELINE,
    ANNOTATION_TRANSCRIPTION,
    CATEGORICAL,
    INTEREST,
    NUMERICAL
} from '../constants/constants';
import PickTag from '../containers/PickTag';
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
    Row
} from 'reactstrap';
import {remote} from "electron";
import ReactTooltip from "react-tooltip";
import {formatValue} from "../utils/js";
import classnames from "classnames";
import RichTextEditor from "react-rte";
import Select from "react-select";
import {
    ee, EVENT_GET_EVENT_TIMELINE_CURRENT_TIME,
    EVENT_GOTO_ANNOTATION, EVENT_ON_TAG_DROP,
    EVENT_SAVE_ANNOTATION_CHRONOTHEMATIQUE_FROM_EDIT_PANEL,
    EVENT_SAVE_EVENT_ANNOTATION_FROM_EDIT_PANEL,
    EVENT_SET_ANNOTATION_POSITION,
    EVENT_UPDATE_RECORDING_STATUS, NOTIFY_CURRENT_TIME,
} from "../utils/library";
import {_formatTimeDisplay, _formatTimeDisplayForEvent} from "../utils/maths";
import GeolocationWidget from "./GeolocationWidget";
const VIEW_ANNOTATION_EDITOR = 'VIEW_ANNOTATION_EDITOR';
const VIEW_PICK_A_TAG = 'VIEW_PICK_A_TAG';
const VIEW_PICK_A_LOCATION = 'VIEW_PICK_A_LOCATION';
const REMOVE_TAG = require('./pictures/delete_tag.svg');
const EDIT_ANNOTATION = require('./pictures/edit-annotation.svg');
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
// THE COMPONENT
export default class extends Component {
    constructor(props) {
        super(props);

        let topic = '';
        let vertices = '';
        let person = '';
        let videoDate = '';
        let videoPosition = '';
        let location = '';
        let start, end;

        //declare tag groups for each input field
        let [nameTags,titleTags,topicTags,personTags,dateTags,locationTags,noteTags] = [[],[],[],[],[],[],[]]

        if ('vertices' in props.annotation) {
            props.annotation.vertices.map((vertex, index) => {
                vertices += `(x${index + 1}:${vertex.x.toFixed(2)}, y${index + 1}:${vertex.y.toFixed(2)})`;
                if (index < props.annotation.vertices.length - 1) {
                    vertices += `, `;
                }
            });
        }

        let value;
        let coverage = props.annotation.coverage;
        switch (props.annotation.annotationType) {
            case ANNOTATION_EVENT_ANNOTATION:
                value = props.annotation.value;
                person = props.annotation.person;
                videoDate = props.annotation.date;
                location = props.annotation.location;
                topic = props.annotation.topic ? props.annotation.topic : '';
                videoPosition = props.annotation.start + ' / ' + props.annotation.end + ' / ' + props.annotation.duration
                start = props.annotation.start;
                end = props.annotation.end;
                nameTags = props.annotation.nameTags ? props.annotation.nameTags : [];
                titleTags = props.annotation.titleTags ? props.annotation.titleTags : [];
                topicTags = props.annotation.topicTags ? props.annotation.topicTags : [];
                personTags = props.annotation.personTags ? props.annotation.personTags : [];
                dateTags = props.annotation.dateTags ? props.annotation.dateTags : [];
                locationTags = props.annotation.locationTags ? props.annotation.locationTags : [];
                noteTags = props.annotation.noteTags ? props.annotation.noteTags : [];
                break;
            case ANNOTATION_CHRONOTHEMATIQUE:
                value = props.annotation.value;
                person = props.annotation.person;
                videoDate = props.annotation.date;
                location = props.annotation.location;
                videoPosition = props.annotation.start + ' / ' + props.annotation.end + ' / ' + props.annotation.duration
                start = props.annotation.start;
                end = props.annotation.end;
                break;
            case ANNOTATION_SIMPLELINE:
            case ANNOTATION_POLYLINE:
                value = formatValue(props.annotation.value_in_mm, 2) + props.annotation.measure;
                break;
            case ANNOTATION_ANGLE:
                value = formatValue(props.annotation.value_in_deg, 2) + props.annotation.measure;
                break;
            case ANNOTATION_POLYGON:
                value = formatValue(props.annotation.area, 2) + props.annotation.measure;
                break;
            case ANNOTATION_MARKER:
                vertices = `(x1:${formatValue(props.annotation.x, 2)}, y1:${formatValue(props.annotation.y, 2)})`;
            case ANNOTATION_RECTANGLE:
            case ANNOTATION_TRANSCRIPTION:
            case ANNOTATION_CATEGORICAL:
            case ANNOTATION_RICHTEXT:
                value = props.annotation.value;
                break;
            case ANNOTATION_COLORPICKER:
                vertices = `(x1:${formatValue(props.annotation.x, 2)}, y1:${formatValue(props.annotation.y, 2)})`;
                value = props.annotation.value;
                break;
            case ANNOTATION_OCCURRENCE:
                value = props.annotation.value;
                break;
        }

        const descriptor = this.props.taxonomyInstance && this.props.taxonomyInstance.taxonomyByAnnotation[this.props.annotation.id] ?
            this.props.taxonomyInstance.taxonomyByAnnotation[this.props.annotation.id] : {descriptorId: "-1"};

        if (this.props.selectedTaxonomy) {
            const taxDesc = this.props.selectedTaxonomy.descriptors.find(target => target.id === descriptor.descriptorId);
            if (taxDesc) {
                descriptor.color = taxDesc ? taxDesc.targetColor : '#333';
                descriptor.descriptorGroup = taxDesc.targetType;
            } else {
                descriptor.color = '#ff0000';
            }
        } else {
            descriptor.color = '#ff0000';
        }


        console.log('annotation to edit...' , props.annotation)

        this.state = {
            person: person ? person : '',
            location: location ? location : '',
            videoDate: videoDate ? videoDate : '',
            videoPosition: videoPosition ? videoPosition : '',
            selectedTag: null,
            title: this.props.annotation.title,
            descriptorGroup: descriptor.descriptorGroup,
            descriptor: descriptor,
            targetColor: descriptor.color,
            annotationType: this.props.annotation.annotationType || '',
            text: this.props.annotation.text,
            view: props.openAddTag ? VIEW_PICK_A_TAG : VIEW_ANNOTATION_EDITOR,
            pickTagForAnnotation: props.openAddTag,
            value, vertices,
            disableCategoricalValues: descriptor.value && descriptor.type !== NUMERICAL && descriptor.value.indexOf('DataUnavailable') !== -1,
            richTextValue: RichTextEditor.createValueFromString(value, "html"),
            positionField: null, start, end,
            originalStart: start,
            originalEnd: end,
            hideCancelButton: false,
            topic: topic,
            nameTags : nameTags,
            titleTags : titleTags,
            topicTags: topicTags,
            personTags : personTags,
            dateTags : dateTags,
            locationTags : locationTags,
            noteTags : noteTags,
            activeDropZone: null,
            tagStartTime: 0,
            coverage: coverage
        };
    }

    componentWillReceiveProps(nextProps) {

        if (this.props.fireSaveEvent !== nextProps.fireSaveEvent) {
            nextProps.save(this.state.title, this.state.descriptor.descriptorId || "-1", this.state.text,
                this.state.targetColor, this.state.descriptor.value, this.state.value);
        }

        if ( nextProps.annotation.annotationType === ANNOTATION_EVENT_ANNOTATION) {
            this.setState({
                nameTags : nextProps.annotation.nameTags ? nextProps.annotation.nameTags : [],
                titleTags : nextProps.annotation.titleTags ? nextProps.annotation.titleTags : [],
                topicTags : nextProps.annotation.topicTags ? nextProps.annotation.topicTags : [],
                personTags : nextProps.annotation.personTags ? nextProps.annotation.personTags : [],
                dateTags : nextProps.annotation.dateTags ? nextProps.annotation.dateTags : [],
                locationTags : nextProps.annotation.locationTags ? nextProps.annotation.locationTags : [],
                noteTags : nextProps.annotation.noteTags ? nextProps.annotation.noteTags : [],
            })
        }
    };

    componentDidUpdate(prevProps: Readonly<P>, prevState: Readonly<S>, snapshot: SS) {
        if (prevProps.isAnnotationRecording === true && this.props.isAnnotationRecording === false){
            this.setState({
                hideCancelButton: true
            })
        }
    }

    componentDidMount() {
        ee.on(EVENT_SET_ANNOTATION_POSITION, this._setPosition);
        ee.on(EVENT_SAVE_ANNOTATION_CHRONOTHEMATIQUE_FROM_EDIT_PANEL, this._saveChronothematiqueAnnotaion);
        ee.on(EVENT_SAVE_EVENT_ANNOTATION_FROM_EDIT_PANEL, this._saveAnnotateEventAnnotation);
        ee.on(EVENT_ON_TAG_DROP , this.onTagDropEvent)
        ee.on(NOTIFY_CURRENT_TIME , this.setTagStartTime)
    }

    componentWillUnmount() {
        ee.removeListener(EVENT_SET_ANNOTATION_POSITION, this._setPosition);
        ee.removeListener(EVENT_SAVE_ANNOTATION_CHRONOTHEMATIQUE_FROM_EDIT_PANEL, this._saveChronothematiqueAnnotaion);
        ee.removeListener(EVENT_SAVE_EVENT_ANNOTATION_FROM_EDIT_PANEL, this._saveAnnotateEventAnnotation);
        ee.removeListener(EVENT_ON_TAG_DROP , this.onTagDropEvent)
        ee.removeListener(NOTIFY_CURRENT_TIME , this.setTagStartTime)
    }

    onTagDropEvent = () => {
        this.setState({
            activeDropZone: null
        })
    }

    setTagStartTime = (time) => {
        this.setState({
            tagStartTime: time
        })
    }

    mergeAllTags = () => {
        return {
            nameTags: this.state.nameTags,
            titleTags: this.state.titleTags,
            topicTags: this.state.topicTags,
            personTags: this.state.personTags,
            dateTags: this.state.dateTags,
            locationTags: this.state.locationTags,
            noteTags: this.state.noteTags
        };
    }

    _saveAnnotateEventAnnotation = () => {
        if (this.state.annotationType === ANNOTATION_EVENT_ANNOTATION){
            this.props.save(
                this.state.title,
                this.state.descriptor.descriptorId || "-1", this.state.text,
                this.state.targetColor, this.state.descriptor.value, this.state.value,
                this.state.descriptor.type , this.state.person , this.state.videoDate, this.state.location , this.mergeAllTags() , this.state.topic);
        }
        ee.emit(EVENT_UPDATE_RECORDING_STATUS, false);
    }

    _saveChronothematiqueAnnotaion = () => {
        if (this.state.annotationType === 'chronothematique'){
            this.props.save(this.state.title, this.state.descriptor.descriptorId || "-1", this.state.text,
                this.state.targetColor, this.state.descriptor.value, this.state.value,
                this.state.descriptor.type , this.state.person , this.state.videoDate, this.state.location);
        }
        ee.emit(EVENT_UPDATE_RECORDING_STATUS, false);

    }

    backToAnnotationEditor = () => {
        this.setState({view: VIEW_ANNOTATION_EDITOR});
    };

    handleClickOnTag = e => {
        this.props.tagAnnotation(e.target.getAttribute('tagname'));
        this.setState({view: VIEW_ANNOTATION_EDITOR});
    };

    cancel = () => {
        this.props.annotation.start = this.state.originalStart;
        this.props.annotation.end = this.state.originalEnd;
        this.props.annotation.duration = this.state.originalEnd - this.state.originalStart;
        this.props.cancel();
    };


    handleUntagEventAnnotation = (event , tagName , groupType) => {
        event.preventDefault();
        this.props.untagEventAnnotation(tagName , groupType);
    }

    handleUnTagAnnotation = e => {
        this.props.untagAnnotation(e.target.getAttribute('tagname'));
    };


    _gotoAnnotation = (e, annotation, position) => {
        ee.emit(EVENT_GOTO_ANNOTATION, annotation, position)
        e.preventDefault();
        e.stopPropagation();
    }


    handleOnDragLeaveEvent = (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        if (this.state.activeTagsPanel !== null){
            this.setState({
                activeTagsPanel: null
            })
        }
    }

    handOnDragOverEvent = (ev , type) => {
        ev.preventDefault();
        ev.stopPropagation();
        if (this.state.activeDropZone !== type){
            this.setState({
                activeDropZone: type
            })
        }
    }

    handOnDropEvent = (ev , inputGroup) => {
        ee.emit(EVENT_GET_EVENT_TIMELINE_CURRENT_TIME);
        ev.preventDefault();
        const tagName = ev.dataTransfer.getData("tagName");
        if (inputGroup === "generalTags"){
            this.props.tagAnnotation(tagName);
        }else{
            setTimeout( ()=> {
                ev.preventDefault();
                const tag = {
                    name: tagName,
                    start: this.state.tagStartTime
                }
                this.props.tagEventAnnotation(tag , inputGroup);
                this.setState({
                    activeDropZone: null
                })
            } , 100)
        }
    }

    handleSpatialLocationChange = (event) => {
        // console.log("handleSpatialLocationChange", event);
        const { value } = event.target;
        const coverage = this.state.coverage ?  {...this.state.coverage} : { spatial: {}};
        coverage.spatial.placeName = value.place ? value.place : '';
        coverage.spatial.location = {
            latitude: value.latitude,
            longitude: value.longitude
        };
        this.setState({
            coverage: coverage,
        });
    }

    render() {
        let key = 0;
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

        return (
            <Container className="bst rcn_edit_annotation">

                <Form onSubmit={(e) => {
                    e.preventDefault();
                }} className="tag-form">
                    <FormGroup row>
                        {
                            this.props.isAnnotationRecording ? <Label sm={12} className="rec_ann_text">Click "Annotate" button to save <b>{this.state.title}</b>.</Label> :
                                <Row>
                                    <Col sm={{ size: 3, offset: 5 }}>
                                        <Button disabled={this.state.title.length < 3 || this.state.end < this.state.start} color="primary" onClick={ () => {
                                            this.props.save(this.state.title, this.state.descriptor.descriptorId || "-1", this.state.text,
                                                this.state.targetColor, this.state.descriptor.value, this.state.value,
                                                this.state.descriptor.type , this.state.person , this.state.videoDate, this.state.location , null , this.state.topic, this.state.coverage);
                                        }}>{t('global.save')}</Button>
                                    </Col>
                                    <Col sm={{ size: 3, offset: 1 }}>
                                        <Button disabled={this.state.title.length < 3} color="primary"
                                                onClick={this.cancel}>{t('global.cancel')}</Button>
                                    </Col>
                                </Row>
                        }
                    </FormGroup>

                    {this.state.annotationType !== ANNOTATION_EVENT_ANNOTATION ?
                        <Row>
                            <Label sm={3} for="note" className="label-for">{t('inspector.annotation_editor.lbl_keywords')}</Label>
                            {/*<Col sm={3} md={3} lg={3} className="tag-title">Tags</Col>*/}
                            <Col sm={9} md={9} lg={9} className="title-button">
                                <Button className="btn btn-secondary" color="gray" onClick={ () => {
                                    this.setState({pickTagForAnnotation: true});
                                }}>{t('inspector.annotation_editor.btn_edit_keywords')}</Button>
                            </Col>
                        </Row> : null
                    }
                    {this.state.annotationType !== ANNOTATION_EVENT_ANNOTATION ?
                        <Row>
                            <Label sm={1} md={1} lg={1} className="label-for"/>
                            <Col sm={11} md={11} lg={11}>
                                <div className="tags-panel">
                                    {this.props.tags && this.props.tags.map(name => {
                                        return <span key={name} className="annotation-tag">{name}&nbsp;
                                            <img src={REMOVE_TAG} className='delete-tag'
                                                 alt="delete-tag"
                                                 tagname={name}
                                                 onClick={this.handleUnTagAnnotation}/>
                                        </span>
                                    })}
                                </div>
                            </Col>
                        </Row> : null
                    }
                    <FormGroup row>
                        <Label sm={3} for="type" className="label-for">{t('inspector.annotation_editor.lbl_type')}</Label>
                        <Col sm={9} className="align-bottom">
                            <img className="icon_edit"
                                 src={require('./pictures/' + this.state.annotationType + '.svg')} alt="edit icon"/>
                        </Col>
                    </FormGroup>

                    <FormGroup row
                               className={`tagDropZone ${this.state.activeDropZone === 'name' ? 'tdzHover' : ''}`}
                               onDragOver={ (event) => this.handOnDragOverEvent(event , "name")}
                               onDragLeave={ event => this.handleOnDragLeaveEvent(event)}
                               onDrop={ (event) => this.handOnDropEvent(event , "nameTags")}
                    >
                        <Label sm={3} for="name" className="label-for">{t('inspector.annotation_editor.lbl_name')}</Label>
                        <Col sm={9}>
                            <Input bsSize="sm" name="name" id="name" autoFocus
                                   value={this.state.title}
                                   onChange={e =>
                                       this.setState({
                                           title: e.target.value
                                       })
                                   }
                            />
                        </Col>
                        {this.state.annotationType === ANNOTATION_EVENT_ANNOTATION ?
                            <Col sm={12} md={12} lg={12}>
                                <div className="tags-panel">
                                    {this.state.nameTags.map( tag => {
                                        return <span key={tag.name} className="annotation-tag">{tag.name}&nbsp;
                                            <img src={REMOVE_TAG}
                                                 alt="delete-tag"
                                                 className='delete-tag'
                                                 tagname={tag.name}
                                                 onClick={(event) =>
                                                     this.handleUntagEventAnnotation(event , tag.name , "nameTags")}/>
                                        </span>
                                    })
                                    }
                                </div>
                            </Col> : null}
                    </FormGroup>

                    <FormGroup row
                               className={`tagDropZone ${this.state.activeDropZone === 'title' ? 'tdzHover' : ''}`}
                               onDragOver={ (event) => this.handOnDragOverEvent(event , "title")}
                               onDragLeave={ event => this.handleOnDragLeaveEvent(event)}
                               onDrop={ (event) => this.handOnDropEvent(event , "titleTags")}
                    >
                        <Label sm={3} for="values" className="label-for">{t('inspector.annotation_editor.lbl_title')}</Label>
                        <Col sm={9} className="align-bottom">
                            {(this.props.annotation.annotationType === ANNOTATION_MARKER ||
                                this.props.annotation.annotationType === ANNOTATION_CHRONOTHEMATIQUE ||
                                this.props.annotation.annotationType === ANNOTATION_EVENT_ANNOTATION ||
                                this.props.annotation.annotationType === ANNOTATION_RECTANGLE ||
                                this.props.annotation.annotationType === ANNOTATION_TRANSCRIPTION ||
                                this.props.annotation.annotationType === ANNOTATION_COLORPICKER ||
                                this.props.annotation.annotationType === ANNOTATION_CATEGORICAL) ?
                                <Input bsSize="sm" type="textarea" name="value" id="value" rows={2}
                                       onChange={e => this.setState({value: e.target.value})}
                                       value={this.state.value}
                                />
                                : this.props.annotation.annotationType === ANNOTATION_RICHTEXT ?
                                    <Button onClick={_ => {
                                        this.setState({
                                            rteModal: !this.state.modal
                                        });
                                    }
                                    }>Open text editor</Button>
                                    : <Input plaintext readOnly bsSize="sm" name="values" id="values"
                                             value={this.state.value}/>
                            }
                        </Col>
                        {this.state.annotationType === ANNOTATION_EVENT_ANNOTATION ?
                            <Col sm={12} md={12} lg={12}>
                                <div className="tags-panel">
                                    {this.state.titleTags.map( tag => {
                                        return <span key={tag.name} className="annotation-tag">{tag.name}&nbsp;
                                            <img src={REMOVE_TAG} className='delete-tag'
                                                 alt="delete-tag"
                                                 tagname={tag.name}
                                                 onClick={(e) =>
                                                     this.handleUntagEventAnnotation(e , tag.name, "titleTags")}/>
                                        </span>
                                    })
                                    }
                                </div>
                            </Col> : null}
                    </FormGroup>

                    {this.state.annotationType === ANNOTATION_CHRONOTHEMATIQUE || this.state.annotationType === ANNOTATION_EVENT_ANNOTATION ?
                        <Fragment>
                            {this.state.annotationType === ANNOTATION_EVENT_ANNOTATION ?
                                <FormGroup row
                                           className={`tagDropZone ${this.state.activeDropZone === 'topic' ? 'tdzHover' : ''}`}
                                           onDragOver={ (event) => this.handOnDragOverEvent(event , "topic")}
                                           onDragLeave={ event => this.handleOnDragLeaveEvent(event)}
                                           onDrop={ (event) => this.handOnDropEvent(event , "topicTags")}
                                >
                                    <Label sm={3} for="topic" className="label-for">{t('inspector.annotation_editor.lbl_topic')}</Label>
                                    <Col sm={9} className="align-bottom">
                                        <Input bsSize="sm"
                                               type="textarea" name="topic" id="topic" rows={2}
                                               onChange={e => this.setState({topic: e.target.value})}
                                               value={this.state.topic}
                                        />
                                    </Col>
                                    {this.state.annotationType === ANNOTATION_EVENT_ANNOTATION ?
                                        <Col sm={12} md={12} lg={12}>
                                            <div className="tags-panel">
                                                {this.state.topicTags.map( tag => {
                                                    return <span key={tag.name} className="annotation-tag">{tag.name}&nbsp;
                                                        <img src={REMOVE_TAG} className='delete-tag'
                                                             alt="delete-tag"
                                                             tagname={tag.name}
                                                             onClick={(e) => this.handleUntagEventAnnotation(e , tag.name , "topicTags")}/>

                                                    </span>
                                                })
                                                }
                                            </div>
                                        </Col> : null}
                                </FormGroup> : null}

                            <FormGroup row
                                       className={`tagDropZone ${this.state.activeDropZone === 'person' ? 'tdzHover' : ''}`}
                                       onDragOver={ (event) => this.handOnDragOverEvent(event , "person")}
                                       onDragLeave={ event => this.handleOnDragLeaveEvent(event)}
                                       onDrop={ (event) => this.handOnDropEvent(event , "personTags")}
                            >
                                <Label sm={3} for="person" className="label-for">{t('inspector.annotation_editor.lbl_person')}</Label>
                                <Col sm={9} className="align-bottom">
                                    <Input bsSize="sm"
                                           type="textarea" name="person" id="person" rows={2}
                                           onChange={e => this.setState({person: e.target.value})}
                                           value={this.state.person}
                                    />
                                </Col>
                                {this.state.annotationType === ANNOTATION_EVENT_ANNOTATION ?
                                    <Col sm={12} md={12} lg={12}>
                                        <div className="tags-panel">
                                            {this.state.personTags.map( tag => {
                                                return <span key={tag.name} className="annotation-tag">{tag.name}&nbsp;
                                                    <img src={REMOVE_TAG} className='delete-tag'
                                                         tagname={tag.name}
                                                         alt="delete-tag"
                                                         onClick={(e) =>
                                                             this.handleUntagEventAnnotation(e , tag.name , "personTags")}/>
                                                </span>
                                            })
                                            }
                                        </div>
                                    </Col> : null}
                            </FormGroup>
                            <FormGroup row
                                       className={`tagDropZone ${this.state.activeDropZone === 'date' ? 'tdzHover' : ''}`}
                                       onDragOver={ (event) => this.handOnDragOverEvent(event , "date")}
                                       onDragLeave={ event => this.handleOnDragLeaveEvent(event)}
                                       onDrop={ (event) => this.handOnDropEvent(event , "dateTags")}
                            >
                                <Label sm={3} for="videoDate" className="label-for">{t('inspector.annotation_editor.lbl_date')}</Label>
                                <Col sm={9} className="align-bottom">
                                    <Input bsSize="sm" type="textarea" name="videoDate" id="videoDate" rows={2}
                                           onChange={e => this.setState({videoDate: e.target.value})}
                                           value={this.state.videoDate}
                                    />
                                </Col>
                                {this.state.annotationType === ANNOTATION_EVENT_ANNOTATION ?
                                    <Col sm={12} md={12} lg={12}>
                                        <div className="tags-panel">
                                            {this.state.dateTags.map( tag => {
                                                return <span key={tag.name} className="annotation-tag">{tag.name}&nbsp;
                                                    <img src={REMOVE_TAG}
                                                         alt="delete-tag"
                                                         className='delete-tag'
                                                         tagname={tag.name}
                                                         onClick={(e) =>
                                                             this.handleUntagEventAnnotation(e , tag.name , "dateTags")}/>
                                                </span>
                                            })
                                            }
                                        </div>
                                    </Col> : null}
                            </FormGroup>

                            <FormGroup row
                                       className={`tagDropZone ${this.state.activeDropZone === 'location' ? 'tdzHover' : ''}`}
                                       onDragOver={ (event) => this.handOnDragOverEvent(event , "location")}
                                       onDragLeave={ event => this.handleOnDragLeaveEvent(event)}
                                       onDrop={ (event) => this.handOnDropEvent(event , "locationTags")}
                            >
                                <Label sm={3} for="videoLocation" className="label-for">{t('inspector.annotation_editor.lbl_location')}</Label>
                                <Col sm={9} className="align-bottom">
                                    <Input bsSize="sm" type="textarea" name="videoLocation" id="videoLocation" rows={2}
                                           onChange={e => this.setState({location: e.target.value})}
                                           value={this.state.location}
                                    />
                                </Col>
                                {this.state.annotationType === ANNOTATION_EVENT_ANNOTATION ?
                                    <Col sm={12} md={12} lg={12}>
                                        <div className="tags-panel">
                                            {this.state.locationTags.map( tag => {
                                                return <span key={tag.name} className="annotation-tag">{tag.name}&nbsp;
                                                    <img src={REMOVE_TAG} className='delete-tag'
                                                         alt="delete-tag"
                                                         tagname={tag.name}
                                                         onClick={(e) =>
                                                             this.handleUntagEventAnnotation(e , tag.name , "locationTags")}/>
                                                </span>
                                            })
                                            }
                                        </div>
                                    </Col> : null}
                            </FormGroup>

                            <FormGroup row
                                       className={`tagDropZone ${this.state.activeDropZone === 'note' ? 'tdzHover' : ''}`}
                                       onDragOver={ (event) => this.handOnDragOverEvent(event , "note")}
                                       onDragLeave={ event => this.handleOnDragLeaveEvent(event)}
                                       onDrop={ (event) => this.handOnDropEvent(event , "noteTags")}
                            >
                                <Label sm={3} for="note" className="label-for">{t('inspector.annotation_editor.lbl_note')}</Label>
                                <Col sm={9}>
                                    <Input bsSize="sm" type="textarea" name="note" id="note" rows={2}
                                           onChange={e => this.setState({text: e.target.value})}
                                           value={this.state.text}
                                    />
                                </Col>
                                {this.state.annotationType === ANNOTATION_EVENT_ANNOTATION ?
                                    <Col sm={12} md={12} lg={12}>
                                        <div className="tags-panel">
                                            {this.state.noteTags.map( tag => {
                                                return <span key={tag.name} className="annotation-tag">{tag.name}&nbsp;
                                                    <img src={REMOVE_TAG} className='delete-tag'
                                                         alt="delete-tag"
                                                         tagname={tag.name}
                                                         onClick={(e) =>
                                                             this.handleUntagEventAnnotation(e , tag.name , "noteTags")}/>
                                                </span>
                                            })
                                            }
                                        </div>
                                    </Col> : null}
                            </FormGroup>

                            <FormGroup row className="tc-position">
                                <Label sm={3} for="position" className="label-for">{t('inspector.annotation_editor.lbl_position')}</Label>
                                <Col sm={9} data-tip data-for={this.props.annotation.id}>
                                    <div className="position_input">
                                        <label htmlFor="start">{t('inspector.annotation_editor.lbl_tc_in')}</label>
                                        <Input disabled={this.props.isAnnotateEventRecording}
                                               readOnly bsSize="sm" name="start" id="start"
                                               className={classnames({'selected': this.state.positionField === 'start'})}
                                               value={_formatTimeDisplay(this.state.start) + " - " + _formatTimeDisplayForEvent((this.props.currentResource.syncTimeStart + this.state.start))}
                                               onClick={event => {
                                                   this.setState({
                                                       positionField: 'start'
                                                   })
                                                   this._gotoAnnotation(event, this.props.annotation, "start");
                                               }}

                                        />
                                    </div>
                                    <div className="position_input">
                                        <label htmlFor="end">{t('inspector.annotation_editor.lbl_tc_out')}</label>
                                        <Input readOnly bsSize="sm" name="end" id="end"
                                               disabled={this.props.isAnnotateEventRecording}
                                               className={classnames({'selected': this.state.positionField === 'end'})}
                                               value={this.state.end ? _formatTimeDisplay(this.state.end)  + " - " + _formatTimeDisplayForEvent((this.props.currentResource.syncTimeStart + this.state.end)) : ''}
                                               onClick={event => {
                                                   this.setState({
                                                       positionField: 'end'
                                                   })
                                                   this._gotoAnnotation(event, this.props.annotation, "end");
                                               }}
                                        />
                                    </div>
                                    <ReactTooltip multiline={true} place="right" effect="solid" id={this.props.annotation.id}
                                                  aria-haspopup='true'
                                                  role='example'>
                                <pre>
                                    {
                                        'start: ' + _formatTimeDisplay(this.props.annotation.start) + '\n' +
                                        'end: ' + _formatTimeDisplay(this.props.annotation.end) + '\n' +
                                        'duration: ' + _formatTimeDisplay(this.props.annotation.duration)

                                    }
                                    <br/>Click on the box to select time for edit

                                </pre>
                                    </ReactTooltip>
                                </Col>
                            </FormGroup>
                        </Fragment> :
                        <FormGroup row style={{hidden: true}}>
                            <Label sm={3} for="position" className="label-for">{t('inspector.annotation_editor.lbl_position')}</Label>
                            <Col sm={9}>
                                <Input readOnly data-tip data-for={this.props.annotation.id} plaintext bsSize="sm"
                                       name="position" id="position" value={this.state.vertices}/>
                                <ReactTooltip multiline={true} place="right" effect="solid" id={this.props.annotation.id}
                                              aria-haspopup='true'
                                              role='example'>
                                <pre>
                                    {this.state.vertices.replace(/\)\, /g, ')\n')}
                                </pre>
                                </ReactTooltip>
                            </Col>
                        </FormGroup>
                    }
                    {this.props.selectedTaxonomy && this.state.annotationType !== ANNOTATION_CHRONOTHEMATIQUE && this.state.annotationType !== ANNOTATION_EVENT_ANNOTATION ? <Fragment>
                        <FormGroup row>
                            <Col md={{size: 9, offset: 0}} className="local-title">
                                {t('inspector.annotation_editor.lbl_character')}
                            </Col>
                        </FormGroup>
                        <hr/>
                        <FormGroup row>
                            <Label sm={3} for="target" className="label-for">{t('inspector.annotation_editor.lbl_character')}</Label>
                            <Col sm={9}>
                                {this._renderTargets()}
                            </Col>
                        </FormGroup>
                    </Fragment> : ''}
                    {this.props.selectedTaxonomy && this.state.annotationType !== ANNOTATION_CHRONOTHEMATIQUE && this.state.annotationType !== ANNOTATION_EVENT_ANNOTATION ?
                        <Row>
                            <Label sm={3} className="label-for">{t('inspector.annotation_editor.lbl_values')}</Label>
                            <Col sm={8} className="align-bottom">
                                {this.props.selectedTaxonomy.descriptors.map(_ => {
                                    if (_.id === this.state.descriptor.descriptorId && _.targetType === this.state.descriptorGroup) {
                                        const taxonomyByDescriptor = this.props.taxonomyInstance.taxonomyByDescriptor[this.state.descriptor.descriptorId];
                                        return <Fragment key={key++}>
                                            {this.state.descriptor.type === CATEGORICAL && _.states.map(state => {
                                                if (this.state.descriptor.value.indexOf(state.id) !== -1) {
                                                    return <li key={key++}><span>{state.name}</span></li>
                                                } else return '';
                                            })}

                                            {(this.state.descriptor.type === INTEREST
                                                && this.props.sha1 in this.props.taxonomyInstance.taxonomyByPicture
                                                && this.state.descriptor.descriptorId in this.props.taxonomyInstance.taxonomyByPicture[this.props.sha1])
                                                ?
                                                <Input readOnly plaintext
                                                       value={this.props.taxonomyInstance.taxonomyByPicture[this.props.sha1][this.state.descriptor.descriptorId].value}/>
                                                : ''}

                                            {this.state.descriptor.type === NUMERICAL ? <div className="measures-value">
                                                <span>Min: {formatValue(taxonomyByDescriptor.min, 2)}</span>
                                                <span>M: {formatValue(taxonomyByDescriptor.avg, 2)}</span>
                                                <span>Max: {formatValue(taxonomyByDescriptor.max, 2)}</span>
                                                <span>SD: {formatValue(taxonomyByDescriptor.sd, 2)}</span>
                                            </div> : ''}
                                        </Fragment>
                                    }
                                })}
                            </Col>
                            {(this.state.annotationType === ANNOTATION_MARKER
                                || this.state.annotationType === ANNOTATION_RECTANGLE
                                || this.state.annotationType === ANNOTATION_CATEGORICAL) ?
                                <Col sm={1} className="no-padding">
                                    <img className="btn_menu"
                                         src={EDIT_ANNOTATION}
                                         title={t('inspector.annotation_editor.tooltip_pick_a_value')} alt="pick a value"
                                         onClick={ () => this._catToggle()}
                                    />
                                </Col> : ''}
                        </Row> : ''}

                    {this.state.annotationType === ANNOTATION_EVENT_ANNOTATION ?
                        <FormGroup row
                                   className={`tagDropZone ${this.state.activeDropZone === 'generalTags' ? 'tdzHover' : ''}`}
                                   onDragOver={ (event) => this.handOnDragOverEvent(event , "generalTags")}
                                   onDragLeave={ event => this.handleOnDragLeaveEvent(event)}
                                   onDrop={ (event) => this.handOnDropEvent(event , "generalTags")}
                        >
                            <Label sm={3} for="generalTags" className="label-for">{t('inspector.annotation_editor.lbl_keywords')}</Label>
                            <Col sm={9}>
                                <div className="tags-panel">
                                    {this.props.tags && this.props.tags.map(tag => {
                                        return <span key={tag} className="annotation-tag">{tag}&nbsp;
                                                    <img
                                                        alt="delete a tag"
                                                        src={REMOVE_TAG}
                                                        className='delete-tag'
                                                        tagname={tag}
                                                        onClick={this.handleUnTagAnnotation}/>
                                        </span>
                                    })}
                                </div>
                            </Col>
                        </FormGroup> : null
                    }
                    <FormGroup row>
                        <Col md={{size: 9, offset: 0}} className="local-title">
                            {t('inspector.annotation_editor.lbl_coverage')}
                        </Col>
                    </FormGroup>
                    <hr/>
                    <FormGroup row>
                        <Label sm={3} for="target" className="label-for">{t('inspector.annotation_editor.lbl_temporal')}</Label>
                        <Col sm={9}>
                        </Col>
                        <Label sm={3} for="target" className="label-for">{t('inspector.annotation_editor.lbl_spatial')}</Label>
                        <Col sm={9}>
                            <GeolocationWidget name="geolocation"
                                               place={(this.state.coverage && this.state.coverage.spatial) ?  this.state.coverage.spatial.placeName : ''}
                                               latitude ={(this.state.coverage && this.state.coverage.spatial && this.state.coverage.spatial.location) ?
                                                   this.state.coverage.spatial.location.latitude : null}
                                               longitude ={(this.state.coverage && this.state.coverage.spatial && this.state.coverage.spatial.location) ?
                                                   this.state.coverage.spatial.location.longitude : null}
                                               openEdit={this.props.openEditLocation}
                                               onValueChange={this.handleSpatialLocationChange}/>
                        </Col>
                    </FormGroup>
                </Form>

                <div>
                    <PickTag openModal={this.state.pickTagForAnnotation}
                             onClose={() => {
                                 this.setState({pickTagForAnnotation: false});
                                 if (this.props.openAddTag)
                                     this.cancel();
                             }}
                             onTagSelected={(tag) => {
                                 this.props.tagAnnotation(tag);
                             }}
                    />
                </div>
                <div>
                    {/* Select value for categorical descriptor */}
                    <Modal isOpen={this.state.catModal} toggle={this._catToggle} wrapClassName="bst"
                           autoFocus={false}>
                        <ModalHeader toggle={this._catToggle}>{t('inspector.annotation_editor.dialog_title_select_value_for_character')}</ModalHeader>
                        <ModalBody>
                            <Row className="action-bar">
                                <Col>
                                    <div className="targetValues">
                                        <div className="comboUnknownValues">
                                            <Input type="checkbox" value="DataUnavailable"
                                                   defaultChecked={this.state.descriptor && this.state.descriptor.value && this.state.descriptor.type !== NUMERICAL && this.state.descriptor.value.indexOf('DataUnavailable') !== -1}
                                                   onClick={_ => {
                                                       const checked = _.target.checked;
                                                       let value = [];
                                                       if (checked) {
                                                           value = ['DataUnavailable']
                                                       }
                                                       this.setState((prevState) => ({
                                                           descriptor: {
                                                               ...prevState.descriptor,
                                                               value
                                                           },
                                                           disableCategoricalValues: checked
                                                       }));
                                                   }}/> Unknown values
                                        </div>
                                        {this.props.selectedTaxonomy && this.props.selectedTaxonomy.descriptors
                                        && this.props.selectedTaxonomy.descriptors.map(target => {
                                            if (target.id === this.state.descriptor.descriptorId && this.state.descriptor.type === CATEGORICAL && target.targetType === this.state.descriptorGroup) {
                                                return target.states.map((state, index) => {
                                                    return <div key={`option_${index}`}>
                                                        <Input type="checkbox" value={state.id}
                                                               onChange={_ => {
                                                               }}
                                                               disabled={this.state.disableCategoricalValues}
                                                               checked={!this.state.disableCategoricalValues && this.state.descriptor.value.indexOf(state.id) !== -1}
                                                               defaultChecked={this.state.descriptor.value.indexOf(state.id) !== -1}
                                                               onClick={_ => {
                                                                   const values = [...this.state.descriptor.value];
                                                                   const index = values.indexOf(state.id);
                                                                   if (index !== -1) {
                                                                       values.splice(index, 1);
                                                                   } else if (_.target.checked) {
                                                                       values.push(state.id);
                                                                   }
                                                                   this.setState(prevState => ({
                                                                       descriptor: {
                                                                           ...prevState.descriptor,
                                                                           value: values
                                                                       }
                                                                   }));
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
                            <Button color="primary" onClick={this._saveCategoricalValue}>{t('global.save')}</Button>
                            <Button color="secondary" onClick={this._catToggle}>{t('global.cancel')}</Button>
                        </ModalFooter>
                    </Modal>
                </div>
                <div>
                    <Modal isOpen={this.state.rteModal}
                           size="lg"
                           scrollable={true}
                           toggle={this._toggleRteModal} wrapClassName="bst" autoFocus={false}>
                        <ModalHeader toggle={this._toggleRteModal}>{t('inspector.annotation_editor.dialog_title_edit_text')}</ModalHeader>
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
                            <Button color="primary" onClick={this._saveRichText}>Save</Button>
                            <Button color="secondary" onClick={this._toggleRteModal}>Cancel</Button>
                        </ModalFooter>
                    </Modal>
                </div>
            </Container>
        );
    };

    handleTargetChange = (annotation, selectedTargetOptions) => {
        const { t } = this.props;
        if (selectedTargetOptions.measure === annotation.measure
            || selectedTargetOptions.measure === "N" && annotation.measure === "#"
            || selectedTargetOptions.measure === "-1"
            || selectedTargetOptions.measure === '') {

            const oldDescriptorId = this.state.descriptor.descriptorId;
            const tmpDesc = this.props.selectedTaxonomy.descriptors.find(_ => _.id === selectedTargetOptions.value) || {};
            const descriptor = {
                type: tmpDesc.annotationType,
                descriptorId: tmpDesc.id || "-1",
                value: []
            };
            this.setState({
                oldDescriptorId,
                descriptor: descriptor,
                targetColor: selectedTargetOptions.color
            });

            if (selectedTargetOptions.targetType === CATEGORICAL) {
                if (this.props.taxonomyInstance && this.props.taxonomyInstance.taxonomyByPicture[this.props.sha1] &&
                    selectedTargetOptions.value in this.props.taxonomyInstance.taxonomyByPicture[this.props.sha1]) {

                    this.setState({
                        descriptor: {descriptorId: '-1'},
                        targetColor: '#333'
                    });

                    remote.dialog.showMessageBox(remote.getCurrentWindow(), {
                        type: 'error',
                        message: t('inspector.alert_categorical_descriptor_already_exist'),
                        cancelId: 1
                    });

                    return false;
                } else if (selectedTargetOptions.value !== "-1") {
                    this._catToggle(descriptor)
                }
            } else if (selectedTargetOptions.targetType === INTEREST) {
                this.props.createTargetInstance(INTEREST, this.props.tabName, annotation.id, selectedTargetOptions.value, this.state.value ? [this.state.value] : null, oldDescriptorId);
            } else {
                const annotation = this.props.annotation;
                let value = 0;
                if ('value_in_mm' in annotation)
                    value = annotation.value_in_mm;
                else if ('value_in_deg' in annotation)
                    value = annotation.value_in_deg;
                else if ('area' in annotation)
                    value = annotation.area;
                this.props.createTargetInstance(NUMERICAL, this.props.tabName, annotation.id, tmpDesc.id || "-1", value);
            }
        } else {
            remote.dialog.showMessageBox(remote.getCurrentWindow(), {
                type: 'error',
                message: t('inspector.alert_wrong_target_type'),
                cancelId: 1
            });
        }
    };

    _saveCategoricalValue = () => {
        this.setState({
            catModal: false
        });

        this.props.createTargetInstance(CATEGORICAL, this.props.tabName, this.props.annotation.id,
            this.state.descriptor.descriptorId, this.state.descriptor.value, this.state.oldDescriptorId);
    };

    _catToggle = (descriptor) => {
        if ((this.state.descriptor.descriptorId === "-1" && descriptor === undefined) || this.state.descriptor.type === INTEREST)
            return;
        this.setState(prevState => ({
            catModal: !this.state.catModal,
            descriptor: {...prevState.descriptor}
        }));
    };

    _saveRichText = () => {
        const value = this.state.richTextValue.toString('html');
        this.setState({
            rteModal: false,
            value,
            richTextValue: RichTextEditor.createEmptyValue(),
        });
    };

    _toggleRteModal = () => {
        this.setState({
            rteModal: !this.state.rteModal
        });
    };

    richTextOnChange = (richTextValue) => {
        this.setState({richTextValue});
    };

    _renderTargets = () => {
        const { t } = this.props;
        const annotation = this.props.annotation;
        const options = [{
            value: "-1",
            measure: "-1",
            color: "-1",
            targetType: this.state.descriptor.type,
            group: this.state.descriptor.targetType,
            label: t('inspector.select_character_label')
        }];

        if (this.props.selectedTaxonomy && this.props.selectedTaxonomy.descriptors) {
            this.props.selectedTaxonomy.descriptors.map(target => {
                const type = target.targetType ? `${target.targetType}\\` : '';

                if ((annotation.annotationType === 'simple-line' || annotation.annotationType === 'polyline') && target.annotationType === 'NUMERICAL' && target.unit === 'mm') {
                    options.push({
                        value: target.id,
                        targetType: target.annotationType,
                        measure: target.unit,
                        color: target.targetColor,
                        label: `${type}${target.targetName} ${target.unit}`
                    })
                } else {
                    if ((annotation.annotationType === 'polygon') && target.annotationType === 'NUMERICAL' && (target.unit === 'mm²' || target.unit === 'mm2')) {
                        options.push({
                            value: target.id,
                            targetType: target.annotationType,
                            measure: target.unit,
                            color: target.targetColor,
                            label: `${type}${target.targetName} ${target.unit}`
                        })
                    } else {
                        if ((annotation.annotationType === 'angle') && target.annotationType === 'NUMERICAL' && (target.unit === '°' || target.unit === 'DEG' || target.unit === 'deg')) {
                            options.push({
                                value: target.id,
                                targetType: target.annotationType,
                                measure: target.unit,
                                color: target.targetColor,
                                label: `${type}${target.targetName} ${target.unit}`
                            })
                        } else {
                            if ((annotation.annotationType === 'occurrence') && target.annotationType === 'NUMERICAL' && (target.unit === '#' || target.unit === 'N')) {
                                options.push({
                                    value: target.id,
                                    targetType: target.annotationType,
                                    measure: target.unit,
                                    color: target.targetColor,
                                    label: `${type}${target.targetName} ${target.unit}`
                                })
                            } else {
                                if ((annotation.annotationType === ANNOTATION_MARKER ||
                                    annotation.annotationType === ANNOTATION_RECTANGLE ||
                                    annotation.annotationType === ANNOTATION_POLYGON ||
                                    annotation.annotationType === ANNOTATION_COLORPICKER ||
                                    annotation.annotationType === ANNOTATION_RICHTEXT ||
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
            })
        }

        let defaultValue = options.filter(_ => _.value === this.state.descriptor.descriptorId)[0];
        if (!defaultValue) {
            defaultValue = options[0]
        }

        return <Select className="annotation_target" title={t('inspector.select_tooltip_affect_this_annotation_to_a_character')}
                       value={defaultValue}
                       menuPosition={"fixed"}
                       styles={customStyles}
                       onChange={selectedTargetOptions => {
                           this.handleTargetChange(annotation, selectedTargetOptions)
                       }}
                       isMulti={false}
                       options={options}/>
    }

    _setPosition = (time) => {
        if (this.state.positionField === 'start' && this.state.end > time) {
            this.setState({start: time}, this._updateAnnotationTime)
        } else if (this.state.positionField === 'end' && this.state.start < time) {
            this.setState({end: time}, this._updateAnnotationTime)
        }
    }

    _updateAnnotationTime = () => {
        this.props.annotation.start = this.state.start;
        this.props.annotation.end = this.state.end;
        this.props.annotation.duration = this.state.end - this.state.start;
    }
}
