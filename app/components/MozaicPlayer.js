import React, {PureComponent} from "react";
import {RESOURCE_TYPE_EVENT, THUMBNAIL_COUNT} from "../constants/constants";
import {ee, EVENT_SELECT_TAB, PATH_TO_EVENT_THUMBNAIL} from "../utils/library";
import {Col, Row} from "reactstrap";
import {_formatEventTimeDisplay, formatDateForMozaicView} from "./event/utils";
import {EVENT_STATUS_FINISHED} from "./event/Constants";
let thumbnailSequence = 2;
let rotateImageInterval;
import i18next from "i18next";

export default class extends PureComponent {
    constructor(props) {
        super(props);
        let picSrc = props.pic.thumbnail;
        this.state = {
            picSrc : this.props.pic.resourceType === RESOURCE_TYPE_EVENT ? PATH_TO_EVENT_THUMBNAIL : picSrc,
            playing: false,
        }
    }

    componentWillReceiveProps(nextProps: Readonly<P>, nextContext: any) {
        if (this.props.pic.thumbnail !== nextProps.pic.thumbnail) {
            this.setState({picSrc: nextProps.pic.thumbnail})
        }
    }

    componentWillUnmount() {
        clearInterval(rotateImageInterval)
    }


    _onEventDragEnter = (event) => {
        event.target.className = 'eventEnter';
    };

    _onDragEnter = (event) => {
        event.target.className = 'cardEnter';
    };

    _onDragLeave = (event) => {
        if (event.target.className === "cardEnter" || event.target.className === "eventEnter") {
            event.target.className = '';
        }
    };

    _stop = () => {
        clearInterval(rotateImageInterval);
        this.setState({
            playing: false
        })
    }

    _play = () => {
        rotateImageInterval = setInterval(() => {
            if (thumbnailSequence > THUMBNAIL_COUNT) {
                thumbnailSequence = 1;
            }
            this.setState({
                picSrc: this.props.pic.resourceType === RESOURCE_TYPE_EVENT ? PATH_TO_EVENT_THUMBNAIL : this.props.pic.thumbnail.replace(/_1\.jpg/, `_${thumbnailSequence++}.jpg`),
                playing: true
            })
        }, 500);
    }

    render() {
        const { t } = i18next;
        return (
            <div className="img-grid">
                {this.props.pic.resourceType === RESOURCE_TYPE_EVENT ?
                    <div className="event_mosaic_container"
                         draggable={true}
                         onDragStart={e => this.props.onDragStart(e, this.props.pic.sha1, this.props.index)}

                         onDragOver={e => {
                             e.preventDefault();
                         }}

                         onDrop={e => {
                             e.preventDefault();
                             document.getElementById('rootMozaic').classList.remove('root-hover');
                             this.props.onDrop(e, this.props.pic, this.props.index)
                         }}

                         onDragEnd={this.props.onDragEnd}

                         onDragEnter={() => {
                             document.getElementById('rootMozaic').classList.add('root-hover');
                         }}

                         onDragLeave={e => this._onDragLeave(e)}

                         onClick={() => {
                             this.props.setPictureInSelection(this.props.pic.sha1, this.props.tabName);
                         }}

                         onDoubleClick={() => {
                             this.props.setPictureInSelection(this.props.pic.sha1, this.props.tabName);
                             ee.emit(EVENT_SELECT_TAB, 'image')
                         }}>
                        <Row>
                            <Col sm={12} md={12} lg={12}>
                                <div className="event-mozaic-item">
                                    {t('library.mozaic_player.lbl_status')}: <b><span style={{color: this.props.pic.status === EVENT_STATUS_FINISHED ? 'red' : 'blue'}}>{this.props.pic.status.toUpperCase()}</span></b>
                                </div>
                            </Col>
                        </Row>
                        <Row>
                            <Col sm={12} md={12} lg={12}>
                                <div className="event-mozaic-item">
                                    {t('library.mozaic_player.lbl_duration')}: <b>{this.props.pic.status === EVENT_STATUS_FINISHED ? _formatEventTimeDisplay(this.props.pic.duration) : ""}</b>
                                </div>
                            </Col>
                        </Row>
                        <Row>
                            <Col sm={12} md={12} lg={12}>
                                <div className="event-mozaic-item">
                                    {t('library.mozaic_player.lbl_start date')}:<b>{this.props.pic.status === EVENT_STATUS_FINISHED ?  formatDateForMozaicView(this.props.pic.startDate) : ""}</b>
                                </div>
                            </Col>
                        </Row>
                    </div> :
                    <img className="img-panel"
                         alt="img panel"
                         src={this.state.picSrc}
                         onDragStart={e => this.props.onDragStart(e, this.props.pic.sha1, this.props.index)}
                         style={{width: this.props.imageWidth}}

                         onDragOver={e => {
                             e.preventDefault();
                         }}

                         onDrop={e => {
                             e.preventDefault();
                             document.getElementById('rootMozaic').classList.remove('root-hover');
                             this.props.onDrop(e, this.props.pic, this.props.index)
                         }}

                         onDragEnd={this.props.onDragEnd}

                         onDragEnter={e => {
                             document.getElementById('rootMozaic').classList.add('root-hover');
                             this._onDragEnter(e)
                         }}

                         onDragLeave={e => this._onDragLeave(e)}

                         onClick={() => {
                             console.log('clicked.....')
                             this.props.setPictureInSelection(this.props.pic.sha1, this.props.tabName);
                         }}

                         onDoubleClick={() => {
                             this.props.setPictureInSelection(this.props.pic.sha1, this.props.tabName);
                             ee.emit(EVENT_SELECT_TAB, 'image')
                         }}
                    />
                }
            </div>
        );
    }
}
