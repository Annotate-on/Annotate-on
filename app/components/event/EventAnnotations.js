import React, {Component} from 'react';
import {Col, Dropdown, DropdownToggle, Row, Table} from "reactstrap";
import TableHeader from "../TableHeader";
import {createPagination, formatDateForFileName} from "../../utils/js";
import {remote} from "electron";
import XLSX from "xlsx";
import {formatDateForEventAnnotationsExport, formatEventAnnotationTags} from "./utils";
import {_orderAnnotationsByTcInAndFormatTime, exportZipForChronoOrEventAnnotations, getXlsx} from "../../utils/common";
import AnnotationDropdownMenu from "../common/DropdownMenu";


class EventAnnotations extends Component {
    constructor(props) {
        super(props);
        const { t } = this.props;
        const exportTableColumns = [
            t('results.event_annotations.table_column_reference'),
            t('results.event_annotations.table_column_event'),
            t('results.event_annotations.table_column_annotation'),
            t('results.event_annotations.table_column_title'),
            t('results.event_annotations.table_column_topic'),
            t('results.event_annotations.table_column_tcin'),
            t('results.event_annotations.table_column_tcout'),
            t('results.event_annotations.table_column_duration'),
            t('results.event_annotations.table_column_note'),
            t('results.event_annotations.table_column_dates'),
            t('results.event_annotations.table_column_person'),
            t('results.event_annotations.table_column_locations'),
            t('results.event_annotations.table_column_general_keywords')
        ];

        const tableColumns = [
            t('results.event_annotations.table_column_ref'),
            t('results.event_annotations.table_column_event'),
            t('results.event_annotations.table_column_annotation'),
            t('results.event_annotations.table_column_title'),
            t('results.event_annotations.table_column_topic'),
            t('results.event_annotations.table_column_tcin'),
            t('results.event_annotations.table_column_tcout'),
            t('results.event_annotations.table_column_duration'),
            t('results.event_annotations.table_column_note'),
            t('results.event_annotations.table_column_dates'),
            t('results.event_annotations.table_column_person'),
            t('results.event_annotations.table_column_locations'),
            t('results.event_annotations.table_column_general_keywords')
        ];

        this.exportXlsx = this.exportXlsx.bind(this);
        this.exportToZip = this.exportToZip.bind(this);

        const annotations = [];
        const picturesInSelction = this.props.tabData[this.props.tabName].pictures_selection;

        for (const sha1 in this.props.annotations_eventAnnotations) {
            const eventAnnotations = this.props.annotations_eventAnnotations[sha1];

            if (picturesInSelction.indexOf(sha1) === -1)
                continue;

            const event = this.props.pictures[sha1];
            const syncTimeStart = event.syncTimeStart;

            eventAnnotations.forEach(annotation => {

                annotation.startDate = event.startDate;
                annotation.syncTimeStart = syncTimeStart + annotation.start;
                annotation.syncTimeEnd = syncTimeStart + annotation.end;

                if (!annotation.hasOwnProperty("topic") || annotation.topic === undefined){
                    annotation.topic = '';
                }
                if (!annotation.hasOwnProperty("topicTags") || annotation.topicTags === undefined){
                    annotation.topicTags = [];
                }
                annotations.push({
                    ...annotation, fileName: event.file_basename,
                    tags: formatEventAnnotationTags(annotation),
                    tagsByAnnotation: this._formatTagsByAnnotation(annotation.id)
                });
            })
        }
        this.state = {
            exportTableColumns,
            tableColumns,
            annotations: _orderAnnotationsByTcInAndFormatTime(annotations),
            pageSize: 20,
            currentPage: 1
        }
    }

    _formatTagsByAnnotation = (annotationId) => {
        if(this.props.tagsByAnnotation[annotationId] !== undefined){
            return this.props.tagsByAnnotation[annotationId].join(',');
        }else{
            return [];
        }
    }

    render() {
        let key = 0;
        const isDropdownDisabled = this.state.annotations.length === 0;
        const { t } = this.props;
        return (
            <div>
                <Row className="action-bar">
                    <Col md={1}>
                        <Dropdown title={t('results.dropdown_tooltip_export_the_selected_characters_to_a_csv_file')}
                                  isOpen={this.state.dropdownOpen}
                                  size="sm" color="primary" toggle={() => {
                            this.setState(prevState => ({
                                dropdownOpen: !prevState.dropdownOpen
                            }));
                        }}>
                            <DropdownToggle caret color="primary" disabled={isDropdownDisabled}>
                                {t('results.event_annotations.dropdown_export_to_csv')}
                            </DropdownToggle>
                            <AnnotationDropdownMenu exportXlsx={this.exportXlsx} exportToZip={this.exportToZip}/>
                        </Dropdown>
                    </Col>
                </Row>
                <Row className="no-margin">
                    <Col className="no-padding">
                        <div className="scrollable-table-wrapper" id="wrapper" ref={_ => (this.pane = _)}
                             style={{height: this.state.height}}>
                            <Table hover size="sm" className="targets-table">
                                <thead>
                                <tr>
                                    {this.state.tableColumns.map((columnName) => {
                                        return (
                                            <TableHeader key={key++} title={columnName}/>
                                        );
                                    })}
                                </tr>
                                </thead>
                                <tbody>
                                {this.state.annotations.map((annotation, index) => {
                                    console.log('annotation topic -> ' + annotation.topic);
                                    if (index >= this.state.pageSize * (this.state.currentPage - 1) && index < this.state.pageSize * this.state.currentPage) {
                                        return (
                                            <tr key={key++}>
                                                <td scope="row">{index + 1}</td>
                                                <td>{annotation.fileName}</td>
                                                <td>{annotation.title}</td>
                                                <td>{annotation.value + (annotation["titleTags"].length > 0 && annotation.value !== "" ? "," : "" )  + this.formatFieldTagsForTable(annotation["titleTags"])}</td>
                                                <td>{annotation.topic + (annotation["topicTags"].length > 0 && annotation.topic !== "" ? "," : "" ) + this.formatFieldTagsForTable(annotation["topicTags"])}</td>
                                                <td>{formatDateForEventAnnotationsExport(annotation.startDate , annotation.syncTimeStart)}</td>
                                                <td>{formatDateForEventAnnotationsExport(annotation.startDate , annotation.syncTimeEnd)}</td>
                                                <td>{annotation.duration.toString().length > 0 ? annotation.duration : ''}</td>
                                                <td>{annotation.text + (annotation["noteTags"].length > 0 && annotation.text !== "" ? "," : "" ) + this.formatFieldTagsForTable(annotation["noteTags"])}</td>
                                                <td>{annotation.date + (annotation["dateTags"].length > 0 && annotation.date !== "" ? "," : "" ) + this.formatFieldTagsForTable(annotation["dateTags"])}</td>
                                                <td>{annotation.person + (annotation["personTags"].length > 0 && annotation.person !== "" ? "," : "" ) + this.formatFieldTagsForTable(annotation["personTags"])}</td>
                                                <td>{annotation.location + (annotation["locationTags"].length > 0 && annotation.location !== "" ? "," : "" ) + this.formatFieldTagsForTable(annotation["locationTags"])}</td>
                                                <td>{annotation.tagsByAnnotation}</td>
                                            </tr>
                                        );
                                    }
                                })}
                                </tbody>
                            </Table>
                            {createPagination('eventAnnotations', this.state.annotations, this.state.currentPage, this.state.pageSize, (data) => {
                                this.setState(data);
                            })}
                        </div>
                    </Col>
                </Row>
            </div>
        )
    }

    formatFieldTagsForTable = (tags) => {
        if (tags && tags.length > 0){
            return  tags.map(tag => {
                return tag.name
            });
        }else{
            return ''
        }
    }

    formatFieldTagsForExport = (tags) => {
        let result = '';
        if (tags && tags.length > 0){
            const res =  tags.map(tag => { return tag.name});
            result =  '::' + res
        }
        return result;
    }

    formatAnnotationForExport(eventName , annotation){
        return [
            eventName,
            annotation.title  + this.formatFieldTagsForExport(annotation["nameTags"] , annotation.title),
            annotation.value + this.formatFieldTagsForExport(annotation['titleTags'] , annotation.value),
            annotation.topic + this.formatFieldTagsForExport(annotation['topicTags'] , annotation.topic),
            formatDateForEventAnnotationsExport(annotation.startDate , annotation.syncTimeStart),
            formatDateForEventAnnotationsExport(annotation.startDate , annotation.syncTimeEnd),
            annotation.duration.toString().length > 0 ? annotation.duration : '',
            annotation.text + this.formatFieldTagsForExport(annotation['noteTags'] , annotation.text),
            annotation.date + this.formatFieldTagsForExport(annotation['dateTags'] ,  annotation.date),
            annotation.person +  this.formatFieldTagsForExport(annotation['personTags'] , annotation.person),
            annotation.location + this.formatFieldTagsForExport(annotation['locationTags'] , annotation.location),
            annotation.tagsByAnnotation,
        ];
    }

    exportXlsx(separator) {
        const { t } = this.props;
        const now = new Date();
        let file = remote.dialog.showSaveDialog(remote.getCurrentWindow(), {
            title: t('results.event_annotations.dialog_title_save'),
            defaultPath: `eventAnnotations-${formatDateForFileName(now)}.csv`
        });
        if (!file || file.length < 1) return;

        if (!file.endsWith(".csv")){
            file = file + '.csv';
        }

        const data = this.state.annotations.map(annotation => {
            const eventName = this.props.pictures[annotation.eventId].name;
            return this.formatAnnotationForExport(eventName, annotation);
        });
        const worksheet = XLSX.utils.aoa_to_sheet([this.state.exportTableColumns.slice(1), ...data]);
        getXlsx(worksheet , separator , file);
    }

    exportToZip(separator) {
        const now = new Date();
        const { t } = this.props;
        let file = remote.dialog.showSaveDialog(remote.getCurrentWindow(), {
            title: t('results.event_annotations.dialog_title_save'),
            defaultPath: `eventAnnotations-${formatDateForFileName(now)}.zip`
        });
        if (!file || file.length < 1) return;

        let data = [];
        this.state.annotations.map(annotation => {
            const eventName = this.props.pictures[annotation.eventId].name;
            const result = this.formatAnnotationForExport(eventName , annotation);
            if (data[annotation.eventId]) {
                data[annotation.eventId].push(result);
            } else {
                data[annotation.eventId] = [result];
            }
        });

        console.log('export table columns' , this.state.exportTableColumns.slice(1));
        exportZipForChronoOrEventAnnotations(data, file, separator, tableColumns);
    }
}

export default EventAnnotations;
