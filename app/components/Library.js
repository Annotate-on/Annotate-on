import lodash from 'lodash';
import React, {Component, Fragment} from 'react';
import {AutoSizer, Column, SortDirection, Table} from 'react-virtualized';
import styled, {css} from 'styled-components';
import {
    APP_NAME,
    LIST_VIEW,
    MANUAL_ORDER, MAP_VIEW,
    MODEL_XPER,
    MOZAIC_VIEW,
    NAV_SIZE,
    RESOURCE_TYPE_EVENT,
    RESOURCE_TYPE_PICTURE,
    RESOURCE_TYPE_VIDEO,
    TABLE_DATA_BG_OVER,
    TABLE_DATA_FG_OVER, TIMELINE_VIEW,
} from '../constants/constants';
import {MARGIN as INSPECTOR_MARGIN, WIDTH as INSPECTOR_WIDTH} from './Inspector';
import Inspector from '../containers/Inspector';
import Tags from '../containers/Tags';
import Folders from '../containers/Folders';
import MozaicView from '../containers/MozaicView';
import classnames from "classnames";

import moment from 'moment';
import {ee, EVENT_SELECT_TAB} from "../utils/library";
import {remote} from "electron";
import {Button, Col, Row} from "reactstrap";
import Nothing from "./Nothing";
import {getAllPicturesDirectories} from "../utils/config";
import {ContextMenu, ContextMenuTrigger, MenuItem} from "react-contextmenu";
import MozaicPlayer from "./MozaicPlayer";
import MapView from "../containers/MapView";
import TimelineView from "../containers/TimelineView";
import LibraryTabs from "../containers/LibraryTabs";
import PageTitle from "./PageTitle";


const MOZAIC = require('./pictures/mozaic_icon.svg');
const LIST_WHITE = require('./pictures/list_white_icon.svg');
const MAP = require('./pictures/map-location-dot-solid.svg');
const TIMELINE = require('./pictures/clock-regular.svg');
const SELECT_ALL = require('./pictures/select_all.svg');
const SELECT_ALL_CONTEXT = require('./pictures/select_all_gray.svg');
const DELETE_IMAGE = require('./pictures/delete-image.svg');
const DELETE_IMAGE_GRAY = require('./pictures/delete-image-gray.svg');
const DELETE_IMAGE_CONTEXT = require('./pictures/delete-tag.svg');


let skipSort = false;

const _Root = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
`;

const _Content = styled.div`
  display: flex;
  flex-direction: row;
  height: 100%;
  width: 100%;
`;

// PICTURES

const _PicturesPanel = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
`;
const _Pictures = styled.div`
  display: flex;
  flex-direction: row;
  height: 100%;
  width: 100%;
`;

// TABLE

const _FileName = styled.span`
  padding: 0 5px;
  cursor: pointer;

  &:hover {
    background-color: ${TABLE_DATA_BG_OVER};
    border-radius: 5px;
    color: ${TABLE_DATA_FG_OVER};
  }

  ${props =>
    props.selected &&
    css`
      // font-weight: bold;
      background: #1d70f7;
      color: #fff;
      border-radius: 5px;
      // background-color: ${TABLE_DATA_BG_OVER};
      // border-radius: 5px;
      // color: ${TABLE_DATA_FG_OVER};
    `};
`;

// COLUMN

const _Panel = styled.div`
  // background-color: black;
  // width: ${NAV_SIZE}px;
  margin-top: 1px;
  height: 100%;
  overflow: scroll;
  box-shadow: inset 0 -0.5px 0 0 #dddddd, inset 0.5px 0 0 0 #dddddd;
  ::-webkit-scrollbar {
      width: 0;
      background: transparent;
    }
`;

const _ImagePlaceholder = styled.div`
    background-color: #eee;
    padding: ${INSPECTOR_MARGIN}px;
    box-shadow: inset 0 -0.5px 0 0 #dddddd, inset 0.5px 0 0 0 #dddddd;
`;

//
// COMPONENT
//
export default class extends Component {
    // LIFECYCLE

    constructor(props) {
        super(props);
        const initPicturesList = this.props.tabData[this.props.tabName].pictures_selection.map(_ => this.props.allPictures[_])
        const allPictureLength = Object.values(this.props.allPictures).length;
        const sortBy = props.sortBy.field;
        const sortDirection = props.sortBy.direction === '' ? SortDirection.ASC : props.sortBy.direction;
        const sortedPicturesList = this._sortList(sortBy, sortDirection, initPicturesList);
        const currentPictureSelection = this.props.allPictures[this.props.tabData[this.props.tabName].pictures_selection[this.props.currentPictureIndexInSelection]];

        const picView = this.props.match  ? this.props.match.params.picView : this.props.tabData[this.props.tabName].subview || LIST_VIEW;
        const fitToBounds = this.props.match  ? this.props.match.params.fitToBounds : "true";

        this.state = {
            // Current picture for preview
            currentPicture: currentPictureSelection ? currentPictureSelection : sortedPicturesList[0],
            hardSelection: currentPictureSelection ? currentPictureSelection : sortedPicturesList[0],
            initPicturesList,
            allPictureLength,
            numberOfPicturesInSelectedFolders: props.tabData[this.props.tabName].folder_pictures_selection.length,
            newTagName: '',
            sortBy,
            sortDirection,
            sortedPicturesList,
            windowScrollerEnabled: false,
            selectedPictures: [],
            picView: picView,
            fitToBounds: fitToBounds,
            numberOfFolders: this.props.tabData[this.props.tabName].selected_folders.length,
            selectAll: false,
            scrollTableTo: this.props.tabData[this.props.tabName].lastScrollPositionInList,
            // Current working picture
            currentPictureSelection
        };

        // Init list with sort values.
        this._initSortingValues(sortedPicturesList);
    }

    componentWillReceiveProps(nextProps) {
        // console.log("library componentWillReceiveProps props", this.props, nextProps);
        let stateUpdate = {
            allPictureLength: Object.values(nextProps.allPictures).length,
            numberOfFolders: nextProps.tabData[this.props.tabName].selected_folders.length,
            numberOfPicturesInSelectedFolders: nextProps.tabData[this.props.tabName].folder_pictures_selection.length,
            currentPictureSelection: nextProps.allPictures[nextProps.tabData[this.props.tabName].pictures_selection[nextProps.currentPictureIndexInSelection]]
        }
        if (skipSort) {
            skipSort = false;
        } else {
            // console.log("update picture selection in library")
            const unsortedPicturesList = nextProps.tabData[this.props.tabName].pictures_selection.map(_ => this.props.allPictures[_]);
            const sortedPicturesList = this._sortList(this.state.sortBy, this.state.sortDirection, unsortedPicturesList);
            this._initSortingValues(sortedPicturesList);

            stateUpdate.sortedPicturesList = sortedPicturesList;
            stateUpdate.currentPicture = sortedPicturesList[nextProps.currentPictureIndexInSelection];
        }
        this.setState(stateUpdate);
    }

    _initSortingValues = (sortedPicturesList) => {
        sortedPicturesList && sortedPicturesList.map(rowData => {
            if (!rowData)
                return;
            //Cell value
            rowData.sort_catalognumber = rowData.erecolnatMetadata && rowData.erecolnatMetadata.catalognumber ? rowData.erecolnatMetadata.catalognumber : rowData.file_basename;
            rowData.sort_family = '';
            if (rowData.erecolnatMetadata && rowData.erecolnatMetadata.family) {
                rowData.sort_family = rowData.erecolnatMetadata.family;
            }

            rowData.sort_modified = 0;
            if (rowData.erecolnatMetadata) {
                const date = moment(rowData.erecolnatMetadata.modified);
                rowData.sort_modified = date.valueOf();
            }

            rowData.sort_tags = 0;
            const annotations = this.props.annotations.filter(annotation => annotation.pictureId === rowData.sha1);
            annotations.map(annotation => {
                if (this.props.tagsByAnnotation[annotation.id]) {
                    rowData.sort_tags = this.props.tagsByAnnotation[annotation.id].length;
                }
            });

            if (this.props.tagsByPicture.hasOwnProperty(rowData.sha1)) {
                rowData.sort_tags += this.props.tagsByPicture[rowData.sha1].length
            }
        });
    };

    _onDrop = (e, rowData) => {
        if (e.dataTransfer.getData('draggableTags') === '' &&
            e.dataTransfer.getData('tagName') === '')
            return false;
        if (e.dataTransfer.getData('draggingList') === 'true') {
            const tags = JSON.parse(e.dataTransfer.getData('draggableTags'));
            tags.map(tag => this.props.tagPicture(rowData.sha1, tag));
        } else {
            this.props.tagPicture(rowData.sha1, e.dataTransfer.getData('tagName'));
        }
        this.setState({selectedPictures: [], selectAll: false})
    };

    _handleClickOnImage = (event, sha1) => {
        if (event.shiftKey) {
            const images = this.state.selectedPictures;
            if (images.filter(image => image === sha1).length === 0) {
                images.push(sha1);
            } else {
                images.splice(images.indexOf(sha1), 1);
            }
            this.setState({
                selectedPictures: images,
                selectAll: false
            });
        } else {
            skipSort = true;
            this.props.setPictureInSelection(sha1, this.props.tabName);
        }
    };

    _onDragStart = (event, sha1) => {
        if (this.state.selectedPictures.length > 0) {
            event.dataTransfer.setData('draggableImages', JSON.stringify(this.state.selectedPictures));
            event.dataTransfer.setData('draggingList', 'true');
        } else {
            event.dataTransfer.setData('sha1', sha1);
            event.dataTransfer.setData('draggingList', 'false');
        }
    };

    _onDragEnd = () => {
        this.setState({selectedPictures: [], selectAll: false})
    };

    playVideo = (event , id) => {
        this.refs[id]._play(event);
    }

    stopVideo = (event , id) => {
        this.refs[id]._stop(event);
    }

    _navigationHandler = (e, callAction) => {
        const { t } = this.props;
        if (this.state.calibrationActive) {
            remote.dialog.showMessageBox(remote.getCurrentWindow(), {
                type: 'info',
                message: t('global.info'),
                detail: t('library.alert_please_close_calibration_mode'),
                cancelId: 1
            });
        } else{
            callAction(this.props.tabName);
        }
    }

    _formatResourceType = (type) => {
        if (type === RESOURCE_TYPE_PICTURE){
            return "Image"
        }
        else if (type === RESOURCE_TYPE_VIDEO){
            return "Video"
        }
        else if (type === RESOURCE_TYPE_EVENT){
            return "Event"
        }
        else{
            return "Image"
        }
    }

    render() {
        const { t } = this.props;
        let key = 0;
        return (
            <_Root className="bst rcn_library">
                <PageTitle
                    showProjectInfo={true}
                    projectName={this.props.projectName}
                    selectedTaxonomy={this.props.selectedTaxonomy}
                    titleWidget = {<LibraryTabs tabName={this.props.tabName} />}
                    docLink={"resources"}
                >
                </PageTitle>
                <_Content>
                    <div className="vertical">
                        <Folders tabName={this.props.tabName}/>
                        <Tags tabName={this.props.tabName} visibleActions={true}/>
                    </div>
                    {console.log(this.state.picView)}
                    <_PicturesPanel>
                        {this.state.currentPicture ?
                            <_Pictures>
                                {this.state.picView === MOZAIC_VIEW &&
                                    <MozaicView pictures={this.state.sortedPicturesList}
                                                tabData={this.props.tabData[this.props.tabName]}
                                                annotations={this.props.annotations}
                                                tagsByAnnotation={this.props.tagsByAnnotation}
                                                tagsByPicture={this.props.tagsByPicture}
                                                tabName={this.props.tabName}
                                                sort={this._sort}
                                                sortBy={this.state.sortBy}
                                                sortDirection={this.state.sortDirection}
                                                currentPictureSelection={this.state.currentPictureSelection}
                                                openListView={() => {
                                                    this.props.tabData[this.props.tabName].subview = LIST_VIEW;
                                                    this.setState({picView: LIST_VIEW});
                                                }}
                                                openMapView={() => {
                                                    this.props.tabData[this.props.tabName].subview = MAP_VIEW;
                                                    this.setState({
                                                        picView: MAP_VIEW,
                                                        fitToBounds: "true"
                                                    });
                                                }}
                                                openTimelineView={() => {
                                                    this.props.tabData[this.props.tabName].subview = TIMELINE_VIEW;
                                                    this.setState({picView: TIMELINE_VIEW});
                                                }}
                                                skipReSort={(value) => skipSort = value}
                                    />
                                }
                                {this.state.picView === LIST_VIEW &&
                                    <React.Fragment>
                                        <div className="lib-wrap">
                                            <div className="lib-actions">
                                                <div className="switch-view">
                                                    <div title={t('library.switch_to_mozaic_view_tooltip')} className="mozaic-view"
                                                         onClick={() => {
                                                             this.props.tabData[this.props.tabName].subview = MOZAIC_VIEW;
                                                             this.setState({picView: MOZAIC_VIEW})
                                                         }}>
                                                        <img alt="mozaic view" src={MOZAIC}/>
                                                    </div>
                                                    <div
                                                        className={classnames("list-view", {"selected-view": this.state.picView === LIST_VIEW})}>
                                                        <img alt="list view" src={LIST_WHITE}/>
                                                    </div>
                                                    <div title={t('library.map-view.switch_to_map_view_tooltip')} className="map-view"
                                                         onClick={() => {
                                                             this.props.tabData[this.props.tabName].subview = MAP_VIEW;
                                                             this.setState({
                                                                 picView: MAP_VIEW,
                                                                 fitToBounds: "true"
                                                             });
                                                         }}>
                                                        <img alt="map view" src={MAP}/>
                                                    </div>
                                                    <div title={t('library.switch_to_timeline_view_tooltip')} className="timeline-view"
                                                         onClick={() => {
                                                             this.props.tabData[this.props.tabName].subview = TIMELINE_VIEW;
                                                             this.setState({
                                                                 picView: TIMELINE_VIEW,
                                                             });
                                                         }}>
                                                        <img alt="map view" src={TIMELINE}/>
                                                    </div>
                                                </div>
                                                <div className="action-buttons">
                                                    <img className='select-all' src={SELECT_ALL}
                                                         alt="select all"
                                                         onClick={this._selectAll}/>
                                                    <img className='select-all'
                                                         alt="select all"
                                                         src={this.state.selectedPictures.length === 0 ? DELETE_IMAGE_GRAY : DELETE_IMAGE}
                                                         onClick={() => this._deleteImages(null)}/>
                                                </div>
                                            </div>
                                            <div style={{height: "calc(100vh - 125px)"}}>
                                                <AutoSizer>
                                                    {({height, width}) => (
                                                        <Table ref={el => this.listTable = el}
                                                               onScroll={scrl => {
                                                                   if (this.listTable) {
                                                                       this.props.tabData[this.props.tabName].lastScrollPositionInList = scrl.scrollTop;
                                                                       this.setState({
                                                                           scrollTableTo: scrl.scrollTop
                                                                       })
                                                                   }
                                                               }}
                                                               scrollTop={this.state.scrollTableTo}
                                                               headerClassName="headerColumn"
                                                               headerHeight={35}
                                                               height={height}
                                                               overscanRowCount={10}
                                                               rowClassName={this._rowClassName}
                                                               rowCount={this.state.sortedPicturesList.length}
                                                               rowGetter={({index}) => this.state.sortedPicturesList[index % this.state.sortedPicturesList.length]}
                                                               rowHeight={30}
                                                               sort={this._sort}
                                                               sortBy={this.state.sortBy}
                                                               sortDirection={this.state.sortDirection}
                                                               width={width}
                                                        >
                                                            <Column
                                                                dataKey="sort_catalognumber"
                                                                label={t('library.table_column_catalog_n1')}
                                                                minWidth={100}
                                                                width={0.4 * width}
                                                                className="table-column"
                                                                cellRenderer={({rowData}) => {
                                                                    const dndSelected = this.state.selectedPictures.filter(image => image === rowData.sha1).length > 0;
                                                                    const cellValue = rowData.resourceType === RESOURCE_TYPE_EVENT ? rowData.name : rowData.erecolnatMetadata && rowData.erecolnatMetadata.catalognumber ?
                                                                        rowData.erecolnatMetadata.catalognumber : rowData.file_basename;
                                                                    rowData.sort_catalognumber = cellValue;

                                                                    return (
                                                                        <ContextMenuTrigger
                                                                            holdToDisplay={-1}
                                                                            renderTag="span"
                                                                            id="image_context_menu"
                                                                            collect={() => {
                                                                                return {
                                                                                    image: rowData
                                                                                };
                                                                            }}>
                                                                            <_FileName
                                                                                selected={this.state.currentPictureSelection && this.state.currentPictureSelection.sha1 === rowData.sha1}
                                                                                draggable="true"
                                                                                className={dndSelected ? 'selected-image-for-dnd' : ''}
                                                                                onDragStart={e => this._onDragStart(e, rowData.sha1)}
                                                                                onDragOver={e => {
                                                                                    e.preventDefault();
                                                                                    this.setState({currentPicture: rowData});
                                                                                }}
                                                                                onDrop={e => {
                                                                                    e.preventDefault();
                                                                                    this._onDrop(e, rowData)
                                                                                }}
                                                                                onDragEnd={this._onDragEnd}
                                                                                onMouseOut={() => {
                                                                                    if (this.state.hardSelection)
                                                                                        this.setState({currentPicture: this.state.hardSelection})
                                                                                }}
                                                                                onMouseOver={() => this.setState({currentPicture: rowData})}
                                                                                onDoubleClick={() => {
                                                                                    this.setState({hardSelection: rowData});
                                                                                    this.props.setPictureInSelection(rowData.sha1, this.props.tabName);
                                                                                    ee.emit(EVENT_SELECT_TAB, 'image')
                                                                                }}
                                                                                onClick={e => {
                                                                                    this._handleClickOnImage(e, rowData.sha1);
                                                                                    this.setState({hardSelection: rowData})
                                                                                }}>
                                                                                {cellValue}
                                                                            </_FileName>
                                                                        </ContextMenuTrigger>
                                                                    );
                                                                }}
                                                                key={key++}
                                                            />

                                                            <Column dataKey="sort_family"
                                                                    label={t('library.table_column_family')}
                                                                    width={0.15 * width}
                                                                    key={key++}
                                                                    cellRenderer={({rowData}) => {
                                                                        rowData.sort_family = '';
                                                                        if (rowData.erecolnatMetadata && rowData.erecolnatMetadata.family) {
                                                                            rowData.sort_family = rowData.erecolnatMetadata.family;
                                                                        }
                                                                        return rowData.sort_family
                                                                    }}
                                                            />

                                                            <Column
                                                                dataKey="sort_modified"
                                                                label={t('library.table_column_date')}
                                                                width={0.15 * width}
                                                                key={key++}
                                                                cellRenderer={({rowData}) => {
                                                                    rowData.sort_modified = 0;
                                                                    if (rowData.erecolnatMetadata) {
                                                                        const date = moment(rowData.erecolnatMetadata.modified);
                                                                        rowData.sort_modified = date.valueOf();
                                                                        return date.format('DD/MM/YYYY');
                                                                    } else {
                                                                        return '';
                                                                    }
                                                                }}
                                                            />

                                                            <Column dataKey="sort_type"
                                                                    label={t('library.table_column_type')}
                                                                    width={0.15 * width}
                                                                    key={key++}
                                                                    cellRenderer={({rowData}) => {
                                                                        rowData.sort_type = '';
                                                                        rowData.sort_type = this._formatResourceType(rowData.resourceType);
                                                                        return rowData.sort_type;
                                                                    }}
                                                            />

                                                            <Column
                                                                dataKey="sort_tags"
                                                                label={t('library.table_column_tags')}
                                                                width={0.1 * width}
                                                                key={key++}
                                                                cellRenderer={({rowData}) => {
                                                                    rowData.sort_tags = 0;
                                                                    const annotations = this.props.annotations.filter(annotation => annotation.pictureId === rowData.sha1);
                                                                    annotations.map(annotation => {
                                                                        if (this.props.tagsByAnnotation[annotation.id]) {
                                                                            rowData.sort_tags = this.props.tagsByAnnotation[annotation.id].length;
                                                                        }
                                                                    });

                                                                    if (this.props.tagsByPicture.hasOwnProperty(rowData.sha1)) {
                                                                        rowData.sort_tags += this.props.tagsByPicture[rowData.sha1].length
                                                                    }
                                                                    return rowData.sort_tags;
                                                                }}
                                                            />
                                                            <Column dataKey="exifDate"
                                                                    label={t('library.table_column_exif_date')}
                                                                    width={0.1 * width}
                                                                    key={key++}
                                                            />
                                                            <Column dataKey="exifPlace" label={t('library.table_column_exif_place')}
                                                                    width={0.1 * width}
                                                                    key={key++}
                                                                    cellRenderer={({rowData}) => {
                                                                        if(rowData.placeName) {
                                                                            return (<div title={rowData.exifPlace}>{rowData.placeName}</div>)
                                                                        } else if(rowData.exifPlace) {
                                                                            return (<div title={rowData.exifPlace}>{rowData.exifPlace}</div>)
                                                                        }
                                                                    }}
                                                            />

                                                        </Table>
                                                    )}
                                                </AutoSizer>
                                            </div>
                                        </div>

                                        <_Panel
                                            onDragOver={e => {
                                                e.preventDefault();
                                            }}
                                            onDrop={e => {
                                                e.preventDefault();
                                                this.props.tagPicture(this.state.currentPicture.sha1, e.dataTransfer.getData('tagName'));
                                            }}>
                                            <_ImagePlaceholder
                                                onMouseOut={(event) => this.stopVideo(event , this.state.currentPicture.sha1)}
                                                onMouseOver={(event) => this.playVideo(event , this.state.currentPicture.sha1)}>
                                                <MozaicPlayer pic={this.state.currentPicture}
                                                              ref={this.state.currentPicture.sha1}
                                                              setPictureInSelection={this.props.setPictureInSelection}
                                                              imageWidth={INSPECTOR_WIDTH - 2 * INSPECTOR_MARGIN}
                                                              tabName={this.props.tabName}
                                                />
                                            </_ImagePlaceholder>
                                            <Inspector
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
                                                picture={this.state.currentPicture}
                                                tags={this.props.tagsByPicture[this.state.currentPicture.sha1]}
                                                readOnly={true}
                                                tabName={this.props.tabName}
                                                navigationHandler={this._navigationHandler}
                                                isFromLibraryView={true}
                                            />
                                        </_Panel>
                                    </React.Fragment>
                                }
                                {this.state.picView === MAP_VIEW &&
                                    <MapView resources={this.state.sortedPicturesList}
                                             tabName={this.props.tabName}
                                             currentPictureSelection={this.state.currentPictureSelection}
                                             fitToBounds={this.state.fitToBounds}
                                             openListView={() => {
                                                 this.props.tabData[this.props.tabName].subview = LIST_VIEW;
                                                 this.setState({picView: LIST_VIEW});
                                             }}
                                             openMozaicView={() => {
                                                 this.props.tabData[this.props.tabName].subview = MOZAIC_VIEW;
                                                 this.setState({picView: MOZAIC_VIEW});
                                             }}
                                             openTimelineView={() => {
                                                 this.props.tabData[this.props.tabName].subview = TIMELINE_VIEW;
                                                 this.setState({picView: TIMELINE_VIEW});
                                             }}
                                    ></MapView>
                                }
                                {this.state.picView === TIMELINE_VIEW &&
                                    <TimelineView
                                        resources={this.state.sortedPicturesList}
                                        tabName={this.props.tabName}
                                        currentPictureSelection={this.state.currentPictureSelection}
                                        openListView={() => {
                                            this.props.tabData[this.props.tabName].subview = LIST_VIEW;
                                            this.setState({picView: LIST_VIEW});
                                        }}
                                        openMozaicView={() => {
                                            this.props.tabData[this.props.tabName].subview = MOZAIC_VIEW;
                                            this.setState({picView: MOZAIC_VIEW});
                                        }}
                                        openMapView={() => {
                                            this.props.tabData[this.props.tabName].subview = MAP_VIEW;
                                            this.setState({
                                                picView: MAP_VIEW,
                                                fitToBounds: "true"
                                            });
                                        }}
                                    ></TimelineView>
                                }
                            </_Pictures>
                            : ((this.props.selectedTags && this.props.selectedTags.length > 0) ?
                                    <Nothing message={t('library.lbl_no_pictures_for_selected_tags')}/>
                                    :
                                    <div>
                                        <div className="center-button">{t('library.lbl_select_resources_to_import')}</div>
                                        <div className="center-button">
                                            <Button className="btn btn-primary" color="primary"
                                                    onClick={() => {
                                                        const folders = getAllPicturesDirectories();
                                                        if (this.props.tabData[this.props.tabName] !== undefined &&
                                                            this.props.tabData[this.props.tabName].selected_folders !== undefined &&
                                                            this.props.tabData[this.props.tabName].selected_folders.length > 0) {
                                                            const selectedFolders = this.props.tabData[this.props.tabName].selected_folders;
                                                            this.props.goToImportWizard(folders.length ? selectedFolders[0] : null);
                                                        } else {
                                                            this.props.goToImportWizard(folders.length ? folders[0].path : null);
                                                        }
                                                    }}
                                            >{t('library.btn_import_images')}</Button><br />
                                        </div>
                                        <div className="center-button">
                                            <Button className="btn btn-primary" color="primary"
                                                    onClick={() => {
                                                        const folders = getAllPicturesDirectories();
                                                        if (this.props.tabData[this.props.tabName] !== undefined &&
                                                            this.props.tabData[this.props.tabName].selected_folders !== undefined &&
                                                            this.props.tabData[this.props.tabName].selected_folders.length > 0) {
                                                            const selectedFolders = this.props.tabData[this.props.tabName].selected_folders;
                                                            this.props.goToImportVideoWizard(folders.length ? selectedFolders[0] : null);
                                                        } else {
                                                            this.props.goToImportVideoWizard(folders.length ? folders[0].path : null);
                                                        }
                                                    }}
                                            >{t('library.btn_import_videos')}</Button>
                                        </div>
                                        <br/>
                                        <hr/>
                                        <br/>
                                        <div className="center-button-events">
                                            {t('library.lbl_events')}
                                        </div>
                                        <div className="center-button">
                                            <Button className="btn btn-primary" color="danger"
                                                    onClick={() => {
                                                        const folders = getAllPicturesDirectories();
                                                        if (this.props.tabData[this.props.tabName] !== undefined &&
                                                            this.props.tabData[this.props.tabName].selected_folders !== undefined &&
                                                            this.props.tabData[this.props.tabName].selected_folders.length > 0) {
                                                            const selectedFolders = this.props.tabData[this.props.tabName].selected_folders;
                                                            this.props.goToImportEventWizard(folders.length ? selectedFolders[0] : null , this.props.tabName);
                                                        } else {
                                                            this.props.goToImportEventWizard(folders.length ? folders[0].path : null , this.props.tabName);
                                                        }
                                                    }}
                                            >{t('library.btn_create_new_event')}</Button>
                                        </div>
                                    </div>
                            )
                        }
                    </_PicturesPanel>
                </_Content>
                <div>
                    <ContextMenu id="image_context_menu">
                        <MenuItem data={{action: 'select_all'}} onClick={this._handleContextMenu}>
                            <img alt="select all" className='select-all' src={SELECT_ALL_CONTEXT}/>{t('library.context_menu_select_all_resources')}
                        </MenuItem>
                        <MenuItem divider/>
                        <MenuItem data={{action: 'delete'}} onClick={this._handleContextMenu}>
                            <img alt="delete" src={DELETE_IMAGE_CONTEXT}/> {t('library.context_menu_delete_resource')}
                        </MenuItem>
                    </ContextMenu>
                </div>
            </_Root>
        );
    }

    // TABLE HELPERS

    _rowClassName = ({index}) => {
        if (index < 0) {
            return 'headerRow';
        } else {
            return index % 2 === 0 ? 'evenRow' : 'oddRow';
        }
    };

    _sort = ({sortBy, sortDirection}) => {
        this.props.sortBy.field = sortBy;
        this.props.sortBy.direction = sortDirection;

        const sortedPicturesList = this._sortList(sortBy, sortDirection);
        this.setState({sortBy, sortDirection, sortedPicturesList});

        // Add newly sorted array back to redux array
        this.props.saveSortedArray(this.props.tabName, sortedPicturesList.map(pic => pic.sha1), sortBy, sortDirection);
    };

    _sortList(sortBy, sortDirection, initList) {
        const list = initList || this.state.sortedPicturesList;

        const sorted = lodash.sortBy(list, _ => {
            try {
                if (typeof [sortBy] === 'string') {
                    return [sortBy].toLowerCase();
                } else {
                    if (sortBy === MANUAL_ORDER) {
                        if (_.sha1 in this.props.manuallySorted) {
                            return this.props.manuallySorted[_.sha1];
                        } else {
                            // This will add images without order index to the end of list.
                            return 999999;
                        }
                    }

                    return _[sortBy] ? _[sortBy] : '';
                }
            } catch (e) {
                return '';
            }
        });

        return sortDirection === SortDirection.DESC ? lodash.reverse(sorted) : sorted;
    }

    _sortTags = (event) => {
        this.props.tags.sort((a, b) => {
            const dir = event.target.value === 'DESC' ? -1 : 1;
            const nameA = a.name.toUpperCase(); // ignore upper and lowercase
            const nameB = b.name.toUpperCase(); // ignore upper and lowercase
            if (nameA < nameB) {
                return -1 * dir;
            }
            if (nameA > nameB) {
                return dir;
            }

            // names must be equal
            return 0;
        });
    };

    _selectAll = () => {
        let images = this.state.selectedPictures;
        if (!this.state.selectAll) {
            this.state.sortedPicturesList.map(img => {
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
    };


    _getDestFolder = () => {
        const folders = getAllPicturesDirectories();

        if (this.props.tabData[this.props.tabName] !== undefined &&
            this.props.tabData[this.props.tabName].selected_folders !== undefined &&
            this.props.tabData[this.props.tabName].selected_folders.length > 0) {
            const selectedFolders = this.props.tabData[this.props.tabName].selected_folders;
            return folders.length ? selectedFolders[0] : null;
        } else {
            return folders.length ? folders[0].path : null;
        }
    }

    _deleteEvents = eventId => {
        console.log('deleting event with id.... -> ' , eventId)
        console.log('dest folder .... -> ' , this._getDestFolder());
        const { t } = this.props;
        const result = remote.dialog.showMessageBox(remote.getCurrentWindow(), {
            type: 'question',
            buttons: ['Yes', 'No'],
            message: t('library.alert_delete_event_message'),
            cancelId: 1,
            detail: t('library.alert_delete_event_confirmation')
        });

        if (result === 0) {
            this.props.deleteAnnotateEvent(eventId);
            this.props.selectFolderGlobally(this._getDestFolder());
            this.props.refreshLibrary();
            this.setState({
                selectedPictures: [],
                selectAll: false
            });
        }
    }

    _deleteImages = sha1 => {
        //TODO: when multiple images selected filter delete actions for images/videos & events
        const { t } = this.props;
        let refresh = false;
        const selectedPictures = sha1 || this.state.selectedPictures;
        if (selectedPictures.length === 0) {
            return;
        }
        const result = remote.dialog.showMessageBox(remote.getCurrentWindow(), {
            type: 'question',
            buttons: ['Yes', 'No'],
            message: t('library.alert_delete_image_message'),
            cancelId: 1,
            detail: t('library.alert_delete_image_confirmation', {count: selectedPictures.length})
        });
        if (result === 0) {
            for (const sha1 of selectedPictures) {
                const resource = this.state.sortedPicturesList.find( resource => resource.sha1 === sha1);

                if(resource === undefined){
                    return;
                }

                const type = resource.resourceType;

                if(type === RESOURCE_TYPE_EVENT){
                    if (refresh === false){
                        refresh = true;
                    }
                    this.props.deleteAnnotateEvent(sha1);
                }else{
                    this.props.deletePicture(sha1);
                }
            }
            if (refresh){
                this.props.selectFolderGlobally(this._getDestFolder());
                this.props.refreshLibrary();
            }
        }
        this.setState({
            selectedPictures: [],
            selectAll: false
        });
    };

    _handleContextMenu = (e, data) => {
        switch (data.action) {
            case 'select_all':
                this._selectAll();
                break;
            case 'delete':
                if (data.image.resourceType === RESOURCE_TYPE_EVENT){
                    this._deleteEvents(data.image.sha1);
                }else{
                    this._deleteImages([data.image.sha1]);
                }
                break;
        }
    };
}
