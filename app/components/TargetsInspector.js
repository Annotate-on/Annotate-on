import React, {Component} from 'react';
import {Col, Container, Row} from 'reactstrap';
import {NUMERICAL} from "../constants/constants";
import {formatValue} from "../utils/js";
import {average, standardDeviation} from '../utils/maths';
import {ee, EVENT_SELECT_TAB} from "../utils/library";

class TargetsInspector extends Component {
    constructor(props) {
        super(props);

        this.state = {
            descriptors: this._initList(props)
        };
    }

    componentWillReceiveProps(nextProps) {
        this.setState({
            descriptors: this._initList(nextProps)
        })
    }

    _updateMissingOccurrenceDescriptors = (descriptorId , occAnn) => {
        let annotations = this.props.taxonomyInstance.taxonomyByAnnotation;
        let annotationsToUpdate = [];
        let inPictureDescriptorValues = [];

        let picturesInSelection = this.props.tab.pictures_selection;

        if (annotations && picturesInSelection) {
            for (const key in annotations) {
                let dId = annotations[key].descriptorId;
                if (dId === descriptorId && picturesInSelection.includes(annotations[key].sha1)){
                    const annotation = occAnn.find(ann => ann.id === key);
                    if(annotation !== undefined){
                    const annotationToUpdate = {
                        id: annotation.id,
                        value: annotation.value
                    }
                    if (annotation.pictureId === this.props.tab.selected_sha1){
                        inPictureDescriptorValues.push(annotation.value);
                    }
                    annotationsToUpdate.push(annotationToUpdate);
                }
                }
            }
        }

        let inPictureValues = {}
        if (inPictureDescriptorValues.length > 0){
            inPictureValues.count = inPictureDescriptorValues.length;
            inPictureValues.avg = average(inPictureDescriptorValues);
            inPictureValues.sd = standardDeviation(inPictureDescriptorValues);
            inPictureValues.min = Math.min(...inPictureDescriptorValues);
            inPictureValues.max = Math.max(...inPictureDescriptorValues);
        }

        if (this.props.selectedTaxonomy && this.props.selectedTaxonomy.id && annotationsToUpdate.length > 0 && inPictureValues.avg > 0){
            let param = inPictureDescriptorValues.length > 0 ? inPictureValues : null
            this.props.updateAnnotationValueInTaxonomyInstance(annotationsToUpdate , this.props.selectedTaxonomy.id , param , this.props.tab.selected_sha1 , descriptorId);
        }

    }
    _calculateDescriptorInSelectionValues = (descriptorId) => {

        let inSelectionValue = {
            count: 0,
            avg: 0,
            sd: 0
        }

        let values = [];
        let annotations = this.props.taxonomyInstance.taxonomyByAnnotation;
        let picturesInSelection = this.props.tab.pictures_selection;

        if (!annotations  && picturesInSelection){
            ee.emit(EVENT_SELECT_TAB, 'image');
        }

        if (annotations && picturesInSelection) {
            for (const key in annotations) {
                let dId = annotations[key].descriptorId;
                if (dId === descriptorId && picturesInSelection.includes(annotations[key].sha1)){
                    values.push(annotations[key].value)
                }
            }
        }

        if (values.length > 0){
            inSelectionValue.count = values.length;
            inSelectionValue.avg = average(values);
            inSelectionValue.sd = standardDeviation(values);
        }

        return inSelectionValue;
    }

    _updateTaxonomyByImageForAllPictures = () => {

    }

    _initList = (props) => {
        const descriptors = [];
        let annotationsOccurrenceBySelection = this.props.annotationsOccurrence.filter( ann => ann.annotationType === 'occurrence' && this.props.tab.pictures_selection.includes(ann.pictureId))

        if ('taxonomyByPicture' in props.taxonomyInstance) {
            for (const descId in props.taxonomyInstance.taxonomyByPicture[props.tab.selected_sha1]) {
                const values = props.taxonomyInstance.taxonomyByPicture[props.tab.selected_sha1][descId];
                if('value' in values) {
                    continue;
                }
                if (values.count > 0 && values.avg === 0){
                    console.log('calling update for descriptor: ' , descId)
                    this._updateMissingOccurrenceDescriptors(descId , annotationsOccurrenceBySelection);
                }
                const descriptor = this.props.selectedTaxonomy.descriptors.find(descriptor => descriptor.id === descId);

                // let globalValues = props.taxonomyInstance.taxonomyByDescriptor[descId] || values;

                //check if there is taxonomy instance if not refresh page

                if (!this.props.taxonomyInstance.taxonomyByAnnotation && this.props.tab.pictures_selection){
                    ee.emit(EVENT_SELECT_TAB, 'image');
                }

                let inSelectionValues = this._calculateDescriptorInSelectionValues(descId)

                descriptors.push({
                    targetName: descriptor.targetName,
                    targetType: descriptor.targetType,
                    avg: formatValue(values.avg,2),
                    sd: formatValue(values.sd,2),
                    unit: descriptor.unit,
                    includeInCalculation: descriptor.includeInCalculation,
                    annotationType: descriptor.annotationType,
                    gAvg: formatValue(inSelectionValues.avg, 2),
                    gSd: formatValue(inSelectionValues.sd, 2),
                    count: values.count,
                    gCount: inSelectionValues.count,
                    targetColor: descriptor.targetColor
                });
            }
        }
        return descriptors;
    };

    render() {
        let tKey = 0;
        return (
            <div className="targets-list">
                <Container>
                    <Row className="targets-title">
                        <Col md={4} lg={4} sm={4}>Characters</Col>
                        <Col md={1} lg={1} sm={1}>#</Col>
                        <Col md={3} lg={3} sm={3}>M</Col>
                        <Col md={3} lg={3} sm={3}>SD</Col>
                    </Row>
                    {this.state.descriptors.map(target => {
                        const showNumerical = target.annotationType === NUMERICAL &&
                            (target.includeInCalculation === true || target.includeInCalculation === undefined);
                        return showNumerical ? (target.unit !== '' ?
                            (
                                <Row key={tKey++} className="target-row">
                                    <Col md={4} lg={4} sm={4} className="targetName" title={target.targetType ? target.targetType +"/"+target.targetName:target.targetName}><span
                                        style={{color: target.targetColor}}>&#9679;</span> {target.targetName}
                                        <div
                                            className="sub">Selection value</div>
                                    </Col>
                                    <Col md={1} lg={1} sm={1} className="targetValueM" >
                                        {target.count}
                                        <div className="sub">{target.gCount}</div>
                                    </Col>
                                    <Col md={3} lg={3} sm={3}
                                         className="targetValueM">{target.avg}{target.unit}
                                        <div className="currentImageM">{target.gAvg}{target.unit}</div>
                                    </Col>
                                    <Col md={3} lg={3} sm={3} className="targetValueM">
                                        {target.sd}{target.unit}
                                        <div className="currentImageM">{target.gSd}{target.unit}</div>
                                    </Col>
                                </Row>
                            )
                            :
                            (
                                <Row key={tKey++}>
                                    <Col><span
                                        style={{color: target.targetColor}}>&#9679;</span> {target.targetName}
                                    </Col>
                                    <Col>{target.unit}{target.totalCount}
                                    </Col>
                                </Row>
                            )) : ''
                    })}
                </Container>
            </div>
        );
    }
}

export default TargetsInspector;
