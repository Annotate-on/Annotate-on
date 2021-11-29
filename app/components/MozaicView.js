import React, {PureComponent} from 'react';
import {Input} from 'reactstrap';
import {ee, EVENT_SHOW_ALERT} from "../utils/library";
import {SortDirection} from 'react-virtualized';
import classnames from "classnames";
import ReactTooltip from 'react-tooltip'
import moment from 'moment';
import ToggleButton from 'react-toggle-button'
import Inspector from "../containers/Inspector";
import {remote} from "electron";
import lodash from "lodash";
import {MANUAL_ORDER, RESOURCE_TYPE_EVENT} from "../constants/constants";
import MozaicPlayer from "./MozaicPlayer";

const MOZAIC_WHITE = require('./pictures/mozaic_white_icon.svg');
const LIST = require('./pictures/list_icon.svg');
const REMOVE_TAG = require('./pictures/delete_tag.svg');
const SELECT_ALL = require('./pictures/select_all.svg');
const DELETE_IMAGE = require('./pictures/delete-image.svg');
const DELETE_IMAGE_GRAY = require('./pictures/delete-image-gray.svg');


export default class extends PureComponent {
    constructor(props) {
        super(props);
        this.state = {
            sortBy: props.sortBy,
            parentFolder: this.props.tabData.selected_folders[0],
            sortDirection: props.sortDirection,
            selectedPictures: [],
            selectAll: false
        }

        this.mozaicParent = React.createRef();
    }

    componentDidMount() {
        this.mozaicParent.current.scrollTo(0, this.props.tabData.lastScrollPositionInMozaic || 0);
    }

    componentWillUnmount() {
        this.props.tabData.lastScrollPositionInMozaic = this.mozaicParent.current.scrollTop;
    }

    _startManualOrder = (lock) => {
        let order = undefined;
        if (lock) {
            const result = remote.dialog.showMessageBox(remote.getCurrentWindow(), {
                type: 'question',
                buttons: ['Yes', 'No'],
                message: `Start manual order`,
                cancelId: 1,
                detail: `Do you want to reuse the previously saved classification?`
            });
            if (result === 1) {
                order = {};
            }
        }
        this.props.lockSelection(lock, this.props.tabName, order).then(_ => {
            if (lock) {
                this.props.sort({sortBy: MANUAL_ORDER, sortDirection: 'ASC'})
            }
        });
    };

    _manualOrder = (value) => {
        // Workaround for component update when currentPictureIndexInSelection changes.
        this.props.skipReSort(true);
        // ask user to revert previous manual order
        this._startManualOrder(!value);
        if (value)
            ee.emit(EVENT_SHOW_ALERT, "Selection and order of images saved.");
    }

    _handleOnSortChange = (event, field) => {
        let sortBy;
        let direction;
        // Workaround for component update when currentPictureIndexInSelection changes.
        this.props.skipReSort(true);
        if (event.target.value === MANUAL_ORDER) {
            // ask user to revert previous manual order
            this._startManualOrder(true);
            return;
        }

        if (field === 'sortBy') {
            this.setState({sortBy: event.target.value});
            sortBy = event.target.value;
            direction = this.state.sortDirection;
        } else {
            this.setState({sortDirection: event.target.value});
            sortBy = this.state.sortBy;
            direction = event.target.value;
        }
        this.props.sort({sortBy: sortBy, sortDirection: direction})
    };

    _onDragStart = (event, sha1, index) => {
        if (this.state.selectedPictures.length > 0) {

            event.dataTransfer.setData('draggableImages', JSON.stringify(this.state.selectedPictures));
            event.dataTransfer.setData('draggingList', 'true');
        } else {
            event.dataTransfer.setData('sha1', sha1);
            event.dataTransfer.setData('draggingList', 'false');
        }
        event.dataTransfer.setData('index', index);
    };


    _onDragEnd = () => {
        document.getElementById('rootMozaic').classList.remove('root-hover');
        this.setState({selectedPictures: [], selectAll: false})
    };

    _onDrop = (e, pic, index) => {
        e.target.className = '';
        if (e.dataTransfer.getData('draggableTags') !== '' || e.dataTransfer.getData('tagName') !== '') { // Tag image
            if (e.dataTransfer.getData('draggingList') === 'true') {
                const tags = JSON.parse(e.dataTransfer.getData('draggableTags'));
                tags.map(tag => this.props.tagPicture(pic.sha1, tag));
            } else {
                this.props.tagPicture(pic.sha1, e.dataTransfer.getData('tagName'));
            }
            this.setState({selectedPictures: [], selectAll: false})
        } else if (e.dataTransfer.getData('sha1') !== '') { // Manual sort images
            const source = this.props.pictures[e.dataTransfer.getData('index')];

            // Remove image from old position
            this.props.pictures.splice(e.dataTransfer.getData('index'), 1);
            // Insert image on new position
            this.props.pictures.splice(index, 0, source);

            const manualOrder = {};
            this.props.pictures.map((_, index) => {
                manualOrder[_.sha1] = index;
            });

            this.props.lockSelection(true, this.props.tabName, manualOrder).then(_ => {
                this.props.sort({sortBy: MANUAL_ORDER, sortDirection: 'ASC'})
            });
        }
    };

    playVideo = (event , id) => {
        this.refs[id]._play(event);
    }

    stopVideo = (event , id) => {
        this.refs[id]._stop(event);
    }


    _navigationHandler = (e, callAction) => {
        if (this.state.calibrationActive) {
            remote.dialog.showMessageBox(remote.getCurrentWindow(), {
                type: 'info',
                message: 'Info',
                detail: 'Please close calibration mode.',
                cancelId: 1
            });
        } else{
            callAction(this.props.tabName);
        }
    }



    render() {
        let key = 0;
        return (
            <div className="bst rcn_mozaic lib-wrap">
                <div className='mozaic-action-bar'>
                    <div className="switch-view">
                        <div className={classnames("mozaic-view", "selected-view")}>
                            <img alt="mozaic white" src={MOZAIC_WHITE}/>
                        </div>
                        <div title="Switch to list view" className="list-view"
                             onClick={this.props.openListView}>
                            <img alt="list view" src={LIST}/>
                        </div>
                    </div>

                    <div className="toggle-button" title="To order manually the images, drag and drop them">
                        <div className="toggle-div">
                            <div className="mw-toggle-div-menu">Manual order</div>
                            <ToggleButton value={this.props.tabData.manualOrderLock || false}
                                          onToggle={this._manualOrder}/>
                        </div>
                        <div className="toggle-div">
                            <div className="mw-toggle-div-menu">Details sidebar</div>
                            <ToggleButton value={this.props.tabData.showMozaicDetails || false}
                                          onToggle={() => {
                                              this.props.updateToggle(this.props.tabName,
                                                  this.props.tabData.showMozaicCollection,
                                                  !this.props.tabData.showMozaicDetails);
                                          }}/>
                        </div>
                        <div className="toggle-div">
                            <div className="mw-toggle-div-menu">Display resource metadata</div>
                            <ToggleButton value={this.props.tabData.showMozaicCollection || false}
                                          onToggle={() => {
                                              this.props.updateToggle(this.props.tabName,
                                                  !this.props.tabData.showMozaicCollection,
                                                  this.props.tabData.showMozaicDetails);
                                          }}/>
                        </div>
                    </div>


                    <Input className='action-bar-item' type="select" bsSize="md" value={this.props.sortBy}
                           disabled={this.props.tabData.manualOrderLock || false}
                           onChange={(e) => this._handleOnSortChange(e, 'sortBy')}>
                        <option value={MANUAL_ORDER}>Manuel order</option>
                        <option value="sort_catalognumber">By name / catalog number</option>
                        <option value="sort_family">By family</option>
                        <option value="sort_modified">By date</option>
                        <option value="sort_tags">By number of keywords</option>
                        <option value="exifDate">By EXIF date</option>
                        <option value="exifPlace">By EXIF place</option>
                    </Input>

                    <Input className='action-bar-item' type="select" bsSize="md" value={this.props.sortDirection}
                           onChange={(e) => this._handleOnSortChange(e, 'direction')}
                           disabled={this.props.tabData.manualOrderLock || false}
                    >
                        <option value={SortDirection.ASC}>ASC</option>
                        <option value={SortDirection.DESC}>DESC</option>
                    </Input>

                    <img alt="select all" className='select-all' src={SELECT_ALL} onClick={() => {
                        let images = this.state.selectedPictures;
                        if (!this.state.selectAll) {
                            this.props.pictures.map(img => {
                                if (images.filter(image => image === img.sha1).length === 0) {
                                    images.push(img.sha1);
                                }
                            });
                        } else {
                            images = [];
                        }
                        this.setState({
                            selectedPictures: images,
                            selectAll: !this.state.selectAll
                        });
                    }}/>
                    <img className='select-all'
                         alt="select all"
                         src={this.state.selectedPictures.length === 0 ? DELETE_IMAGE_GRAY : DELETE_IMAGE}
                         onClick={ () => {
                             if (this.state.selectedPictures.length === 0) {
                                 return;
                             }

                             const result = remote.dialog.showMessageBox(remote.getCurrentWindow(), {
                                 type: 'question',
                                 buttons: ['Yes', 'No'],
                                 message: `Delete image`,
                                 cancelId: 1,
                                 detail: `Are you sure you want to delete ${this.state.selectedPictures.length} ${this.state.selectedPictures.length > 1 ? 'resources' : 'resource'}?`
                             });
                             if (result === 0) {
                                 lodash.forEach(this.state.selectedPictures, sha1 => {
                                     const type = this.props.pictures.find( resource => resource.sha1 === sha1).resourceType;
                                     if (type === RESOURCE_TYPE_EVENT){
                                         this.props.deleteAnnotateEvent(sha1);
                                         this.props.selectFolderGlobally(this.state.parentFolder);
                                     }else{
                                         this.props.deletePicture(sha1);
                                     }
                                 });
                             }
                             this.setState({
                                 selectedPictures: [],
                                 selectAll: false
                             });
                         }}/>
                </div>

                <div className="page-content">
                    <div className="wrapper" id="rootMozaic" ref={this.mozaicParent}>
                        {this.props.pictures.map((pic, index) => {
                            const tags = [];
                            if (this.props.tagsByPicture.hasOwnProperty(pic.sha1)) {
                                tags.push(...this.props.tagsByPicture[pic.sha1]);
                            }

                            const name = pic.resourceType === RESOURCE_TYPE_EVENT ? pic.name : pic.erecolnatMetadata && pic.erecolnatMetadata.catalognumber ?
                                pic.erecolnatMetadata.catalognumber : pic.file_basename;

                            //TODO choose between fa-lg and fa-2x
                            const resourceClass =  pic.type === 'image' ? 'fa fa-2x fas fa-image' : 'fa fa-lg fas fa-video-camera';

                            const dateP = moment(pic.sort_modified);
                            //rowData.sort_modified = date.valueOf();
                            const dateModif = dateP.format('DD/MM/YYYY');


                            let cartel, catalognumber, scientificname, author, title;
                            if ('erecolnatMetadata' in pic) {
                                if ('catalognumber' in pic.erecolnatMetadata)
                                    catalognumber = pic.erecolnatMetadata.catalognumber;
                                if ('scientificname' in pic.erecolnatMetadata)
                                    scientificname = pic.erecolnatMetadata.scientificname;
                                // if('identifiedby' in pic.erecolnatMetadata.)
                            }
                            if (pic.sha1 in this.props.cartels)
                                cartel = this.props.cartels[pic.sha1].value;

                            return <div key={key++}
                                        className={classnames('card', {'selected': this.props.currentPictureSelection?.sha1 === pic.sha1})}>
                                <div className="cardHeader">
                                    {/*TODO add vertical align top*/}

                                    <span className="mw-checkbox-span">
                                        <input type="checkbox"
                                               checked={this.state.selectedPictures.indexOf(pic.sha1) !== -1}
                                               onChange={(e) => {
                                                   const index = this.state.selectedPictures.indexOf(pic.sha1);
                                                   if (e.target.checked && index === -1) {
                                                       this.setState({
                                                           selectedPictures: [...this.state.selectedPictures, pic.sha1],
                                                           selectAll: false
                                                       });
                                                   } else {
                                                       this.setState({
                                                           selectAll: false,
                                                           selectedPictures: [
                                                               ...this.state.selectedPictures.slice(0, index),
                                                               ...this.state.selectedPictures.slice(index + 1)
                                                           ]
                                                       });
                                                   }
                                               }}/>
                                    </span>
                                    {pic.resourceType === RESOURCE_TYPE_EVENT ?
                                        <div data-tip data-for={'global_' + key} className='eventTitle'>{name} </div> :
                                        <div onMouseOut={(event) => this.stopVideo(event, pic.sha1)}
                                             onMouseOver={(event) => this.playVideo(event, pic.sha1)}
                                             data-tip data-for={'global_' + key} className='cardTitle'>{name}
                                        </div>
                                    }

                                    <span className="resourceIcon">
                                        {pic.resourceType === RESOURCE_TYPE_EVENT ? <div className="event"></div> : <i className={resourceClass}></i>}
                                    </span>

                                    { pic.resourceType === RESOURCE_TYPE_EVENT ? null :
                                        <ReactTooltip multiline={true} type="dark" effect="solid" id={'global_' + key}
                                                      aria-haspopup='true' role='example'>
                                            <span>Height: {pic.height}</span><br/>
                                            <span>Width: {pic.width}</span><br/>
                                            <span>ExifDate: {pic.exifDate}</span><br/>
                                            <span>ExifPlace: {pic.exifPlace}</span><br/>
                                            <span>Sort family: {pic.sort_family}</span><br/>
                                            <span>Sort modified: {dateModif}</span>
                                        </ReactTooltip>
                                    }
                                </div>
                                <MozaicPlayer pic={pic}
                                              ref={pic.sha1}
                                              setPictureInSelection={this.props.setPictureInSelection}
                                              tabName={this.props.tabName}
                                              onDragEnd={this._onDragEnd}
                                              onDrop={this._onDrop}
                                              onDragStart={this._onDragStart}
                                              index={index}
                                />
                                <div className="tags-panel">
                                    {tags.map((tag, index) => {
                                        return <div key={`tag_${index}`} className="annotation-tag" title={tag}>
                                            <span className="tagName">{tag}&nbsp;</span>
                                            <img src={REMOVE_TAG} className="delete-tag"
                                                 alt="delete tag"
                                                 onClick={() => {
                                                     this.props.untagPicture(pic.sha1, tag);
                                                 }}/>
                                        </div>

                                    })}
                                </div>
                                {this.props.tabData.showMozaicCollection ?

                                    pic.resourceType === RESOURCE_TYPE_EVENT ?
                                        <div className="collection-metadata">
                                            Event details:
                                            <div>Title: <span>{pic.name}</span></div>
                                            <div>Description: <span>{pic.description}</span></div>
                                            <div>Serie: <span>{pic.serie}</span></div>
                                            <div>Person: <span>{pic.person}</span></div>
                                            <div>Location: <span>{pic.location}</span></div>

                                        </div> :
                                        <div className="collection-metadata">
                                            Collection metadata:
                                            <div>Title: <span>{title}</span></div>
                                            <div>Catalog #: <span>{catalognumber}</span></div>
                                            <div>Scientific name: <span>{scientificname}</span></div>
                                            <div>Author: <span>{author}</span></div>
                                            <div>Cartel:
                                                <div className="align-left">
                                                    <span dangerouslySetInnerHTML={{__html: cartel}}/>
                                                </div>
                                            </div>
                                        </div> : ''}
                            </div>
                        })}
                    </div>

                    {this.props.tabData.showMozaicDetails ?
                        <div className="inspector-wrapper"
                             onDragOver={e => {
                                 e.preventDefault();
                             }}
                             onDrop={e => {
                                 e.preventDefault();
                                 this.props.tagPicture(this.props.currentPictureSelection.sha1, e.dataTransfer.getData('tagName'));
                             }}>
                            <Inspector
                                isFromMozaicView={true}
                                eventAnnotations={this.props.annotationsEventAnnotations}
                                annotationsChronothematique={this.props.annotationsChronothematique}
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
                                picture={this.props.currentPictureSelection}
                                tags={this.props.tagsByPicture[this.props.currentPictureSelection.sha1]}
                                readOnly={true}
                                tabName={this.props.tabName}
                                isFromLibraryView={false}
                                navigationHandler={this._navigationHandler}
                            />
                        </div>
                        : ''}
                </div>
            </div>
        );
    }
}