import React, {Component} from 'react';
import {Button, Col, Container, Input, Label, Row} from 'reactstrap';
import {remote} from "electron";
import path from 'path';
import {convertSDDtoJson} from "../utils/sdd-processor";
import {CATEGORICAL, NUMERICAL} from "../constants/constants";
import Chance from 'chance';
import {getTaxonomyDir} from "../utils/config";

const RECOLNAT_LOGO = require('./pictures/logo.svg');
const chance = new Chance();

export default class extends Component {
    constructor(props) {
        super(props);

        const sddObject = props.model !== null ? convertSDDtoJson(path.join(getTaxonomyDir(), props.model.sddPath)) : null;
        this.state = {
            sddFile: props.model ? props.model.sddPath : '',
            sddObject
        };
    }

    render() {
        let key = 0;
        return (
            <Container className="bst rcn_xper">
                <div className="bg">
                    <a onClick={() => {
                        this.props.goToLibrary();
                    }}> <img alt="logo" src={RECOLNAT_LOGO} className="logo" title={"Go back to home page"}/></a>
                    <span className="title">Model (vocabulaire) import</span>
                </div>
                <br/>



                <Row className='content'>
                    <Col md={{size: 8, offset: 2}}>
                        {
                            this.state.sddFile.length > 0 ? ''
                                :
                                <Row>
                                    <Col sm={6}>
                                        <Input
                                            type="text"
                                            name="fileName"
                                            value={this.state.sddFile}
                                            disabled
                                        />
                                    </Col>
                                    <Col sm={6}>
                                        <Button className="btn btn-primary" color="primary"
                                                onClick={() => {
                                                    const _ = remote.dialog.showOpenDialog(remote.getCurrentWindow () ,{
                                                        properties: ['openFile'],
                                                        filters: [{name: 'XML explore file', extensions: ['xml']}]
                                                    });
                                                    if (!_ || _.length < 1) return;
                                                    const location = _.pop();
                                                    this.setState({
                                                        sddFile: location,
                                                        sddObject: convertSDDtoJson(location),
                                                    });
                                                }}
                                        >Select SDD file to import</Button>
                                        &nbsp;&nbsp;
                                        <Button size="m" color="primary" onClick={() => {
                                            this.props.goBack();
                                        }}>Cancel</Button>
                                    </Col>
                                </Row>
                        }
                        <Row>
                            <Col sm={12}>

                                <br/>
                                {this.state.sddFile.length > 0 &&
                                <div>

                                    <Button className="btn btn-primary" color="primary"
                                            onClick={() => {
                                                this.props.goBack();
                                                this.props.saveTaxonomy(chance.guid(), this.state.sddObject.name,
                                                    this.state.sddFile, 0);
                                            }}
                                    >Save model</Button>&nbsp;&nbsp;
                                    <Button className="btn btn-primary" color="primary"
                                            onClick={() => {
                                                this.props.goBack();
                                            }}
                                    >Cancel</Button>
                                    <br/>
                                    <Label className="file-name">Model descriptors found in file "{path.basename(this.state.sddFile)}":</Label>
                                    <br/>
                                </div>
                                }
                            </Col>
                        </Row>

                        <Row>
                            <Col>
                                {this.state.sddObject ? this.state.sddObject.items.map((item, index) => {
                                    if (this.state.sddObject.groups.length === 0 || item.targetType === undefined && item.annotationType === CATEGORICAL) {
                                        return <div className="group-item" key={'categorical_' + index}>
                                            <span className="item-label">Character name: </span><span
                                            className="item-text">{item.targetName}</span>
                                            <br/>
                                            <span className="item-label">Character values:</span>
                                            <span
                                                className="item-text-values">
                                                <ul style={{display: 'inline-grid'}}>
                                                    {item.states ? item.states.map((state, inner) => {
                                                        return <li
                                                            key={'list_' + index + '_' + inner}>{state.name}</li>;
                                                    }) : ''}
                                                    </ul>
                                                   </span>
                                            <br/>
                                        </div>
                                    }else {
                                        console.log("item is a member of a group")
                                    }

                                    if (this.state.sddObject.groups.length === 0 || item.targetType === undefined && item.annotationType === NUMERICAL) {
                                        return <div className="group-item" key={'numerical_' + index}>
                                            <span className="item-label">Character name: </span><span
                                            className="item-text">{item.targetName}</span>
                                            <br/>

                                            <span
                                                className="item-label">Character measurement type: </span><span
                                            className="item-text-values">{item.unit}</span>
                                            <br/>

                                        </div>
                                    }else {
                                        console.log("item is a member of a group")
                                    }
                                }) : ''}



                                {this.state.sddObject ? this.state.sddObject.groups.map((group, index) => {
                                    return <fieldset key={key++} className="outline">
                                        <legend>Group: {group.Representation.Label}</legend>
                                        <div className="" key={'group_' + index}>
                                            <span className="item-label">Group name: </span>
                                            <span className="">{group.Representation.Label}</span>

                                            {this.state.sddObject ? this.state.sddObject.items.map((item, index) => {
                                                if (item.annotationType === CATEGORICAL && item.targetType === group.Representation.Label)
                                                    return <div className="group-item" key={'categorical_' + index}>
                                                        <span className="item-label">Character name: </span><span
                                                        className="item-text">{item.targetName}</span>
                                                        <br/>
                                                        <span className="item-label">Character values:</span>
                                                        <span
                                                            className="item-text-values">
                                                <ul style={{display: 'inline-grid'}}>
                                                    {item.states ? item.states.map((state, inner) => {
                                                        return <li
                                                            key={'list_' + index + '_' + inner}>{state.name}</li>;
                                                    }) : ''}
                                                    </ul>
                                                   </span>
                                                        <br/>
                                                    </div>
                                                if (item.annotationType === NUMERICAL && item.targetType === group.Representation.Label)
                                                    return <div className="group-item" key={'numerical_' + index}>
                                                        <span className="item-label">Character name: </span><span
                                                        className="item-text">{item.targetName}</span>
                                                        <br/>

                                                        <span
                                                            className="item-label">Character measurement type: </span><span
                                                        className="item-text-values">{item.unit}</span>
                                                        <br/>

                                                    </div>
                                            }) : ''}
                                        </div>
                                    </fieldset>
                                }) : ''}
                            </Col>
                        </Row>
                    </Col>
                </Row>
            </Container>
        );
    }
}
