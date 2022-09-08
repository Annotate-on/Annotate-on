import React, {PureComponent} from "react";
import {Col, Dropdown, DropdownToggle, Row, Table} from "reactstrap";
import TableHeader from "./TableHeader";
import {createPagination, formatDateForFileName} from "../utils/js";
import {remote} from "electron";
import XLSX from "xlsx";
import {
    _orderAnnotationsByTcInAndFormatTime,
    calculateTableHeight,
    exportZipForChronoOrEventAnnotations,
    getXlsx
} from "../utils/common";
import AnnotationDropdownMenu from "./common/DropdownMenu";

const EXPORT_COLUMNS = [
    'Reference',
    'File',
    'Sequence',
    'Title',
    'Tcin',
    'Tcout',
    'Duration',
    'Abstract',
    'Dates',
    'Person',
    'Locations',
    'Keywords'
];

class ChronoThematicAnnotations extends PureComponent {

    constructor(props) {
        super(props);
        const { t } = this.props;
        const tableColumns = [
            t('results.chrono_thematic_annotations.table_column_reference'),
            t('results.chrono_thematic_annotations.table_column_file'),
            t('results.chrono_thematic_annotations.table_column_sequence'),
            t('results.chrono_thematic_annotations.table_column_title'),
            t('results.chrono_thematic_annotations.table_column_tcin'),
            t('results.chrono_thematic_annotations.table_column_tcout'),
            t('results.chrono_thematic_annotations.table_column_duration'),
            t('results.chrono_thematic_annotations.table_column_abstract'),
            t('results.chrono_thematic_annotations.table_column_dates'),
            t('results.chrono_thematic_annotations.table_column_person'),
            t('results.chrono_thematic_annotations.table_column_locations'),
            t('results.chrono_thematic_annotations.table_column_keywords')
        ];

        this.exportXlsx = this.exportXlsx.bind(this);
        this.exportToZip = this.exportToZip.bind(this);

        const annotations = [];
        const picturesInSelction = this.props.tabData[this.props.tabName].pictures_selection;

        for (const sha1 in this.props.annotationsChronothematique) {
            const annotationsChronothematique = this.props.annotationsChronothematique[sha1];

            if (picturesInSelction.indexOf(sha1) === -1)
                continue;

            const video = this.props.pictures[sha1];

            annotationsChronothematique.map(annotation => {
                let tags = this.props.tagsByAnnotation[annotation.id];

                annotations.push({
                    ...annotation, fileName: video.file_basename,
                    tags: tags ? tags.join(', ') : ''
                });
            })
        }
        this.state = {
            tableColumns,
            annotations: _orderAnnotationsByTcInAndFormatTime(annotations),
            pageSize: 20,
            currentPage: 1
        }
    }

    componentDidMount() {
        this._setTableHeight();
    }

    componentDidUpdate(prevProps, prevState) {
        if (!prevProps.tabVisible) {
            this._setTableHeight();
        }
    }

    _setTableHeight = () => {
        let visible = calculateTableHeight(this.pane , 50);
        this.setState({
            height: visible
        });
    }

    render() {
        let key = 0;
        const { t } = this.props;
        const isDropdownDisabled = this.state.annotations.length === 0;
        return (
            <div>
                <Row className="action-bar">
                    <Col md={1}>
                        <Dropdown title={t('results.dropdown_tooltip_export_the_selected_characters_to_a_csv_file')}
                                  isOpen={this.state.dropdownOpen}
                                  size="sm" color="primary"
                                  toggle={() => {
                                        this.setState(prevState => ({
                                            dropdownOpen: !prevState.dropdownOpen
                                        }));
                                  }}>
                            <DropdownToggle caret color="primary" disabled={isDropdownDisabled}>
                                {t('results.chrono_thematic_annotations.dropdown_export_to_csv')}
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
                                    if (index >= this.state.pageSize * (this.state.currentPage - 1) && index < this.state.pageSize * this.state.currentPage) {
                                        return (
                                            <tr key={key++}>
                                                <td scope="row">{index + 1}</td>
                                                <td>{annotation.fileName}</td>
                                                <td>{annotation.title}</td>
                                                <td>{annotation.value}</td>
                                                <td>{annotation.start}</td>
                                                <td>{annotation.end.toString().length > 0 ? annotation.end : ''}</td>
                                                <td>{annotation.duration.toString().length > 0 ? annotation.duration : ''}</td>
                                                <td>{annotation.text}</td>
                                                <td>{annotation.date}</td>
                                                <td>{annotation.person}</td>
                                                <td>{annotation.location}</td>
                                                <td>{annotation.tags}</td>
                                            </tr>
                                        );
                                    }
                                })}
                                </tbody>
                            </Table>
                            {createPagination('chronoThematicAnnotations', this.state.annotations, this.state.currentPage, this.state.pageSize, (data) => {
                                this.setState(data);
                            })}
                        </div>
                    </Col>
                </Row>
            </div>
        )
    }

    exportXlsx(separator) {
        const { t } = this.props;
        const now = new Date();
        let file = remote.dialog.showSaveDialog(remote.getCurrentWindow(), {
            title: t('results.chrono_thematic_annotations.dialog_title_save'),
            defaultPath: `chronothematic-${formatDateForFileName(now)}.csv`
        });
        if (!file || file.length < 1) return;

        const data = this.state.annotations.map(annotation => {
            return [
                annotation.fileName,
                annotation.title,
                annotation.value,
                annotation.start,
                annotation.end.toString().length > 0 ? annotation.end : '',
                annotation.duration.toString().length > 0 ? annotation.duration : '',
                annotation.text,
                annotation.date,
                annotation.person,
                annotation.location,
                annotation.tags
            ];
        });
        const worksheet = XLSX.utils.aoa_to_sheet([EXPORT_COLUMNS.slice(1), ...data]);
        getXlsx(worksheet , separator , file);
    }

    exportToZip(separator) {
        const { t } = this.props;
        const now = new Date();
        let file = remote.dialog.showSaveDialog(remote.getCurrentWindow(), {
            title: t('results.chrono_thematic_annotations.dialog_title_save'),
            defaultPath: `chronothematic-${formatDateForFileName(now)}.zip`
        });
        if (!file || file.length < 1) return;

        let data = [];
        this.state.annotations.map(annotation => {
            if (data[annotation.fileName]) {
                data[annotation.fileName].push([
                    annotation.fileName,
                    annotation.title,
                    annotation.value,
                    annotation.start,
                    annotation.end.toString().length > 0 ? annotation.end : '',
                    annotation.duration.toString().length > 0 ? annotation.duration : '',
                    annotation.text,
                    annotation.date,
                    annotation.person,
                    annotation.location,
                    annotation.tags
                ])
            } else {
                data[annotation.fileName] = [[
                    annotation.fileName,
                    annotation.title,
                    annotation.value,
                    annotation.start,
                    annotation.end.toString().length > 0 ? annotation.end : '',
                    annotation.duration.toString().length > 0 ? annotation.duration : '',
                    annotation.text,
                    annotation.date,
                    annotation.person,
                    annotation.location,
                    annotation.tags
                ]]
            }
        });
        exportZipForChronoOrEventAnnotations(data, file, separator, EXPORT_COLUMNS);
    }
}

export default ChronoThematicAnnotations;
