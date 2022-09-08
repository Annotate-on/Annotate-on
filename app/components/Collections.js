import React, {PureComponent} from 'react';
import {Col, Dropdown, DropdownItem, DropdownMenu, DropdownToggle, Row, Table} from "reactstrap";
import TableHeader from "./TableHeader";
import {remote, shell} from "electron";
import {createPagination, formatDateForFileName} from "../utils/js";
import XLSX from "xlsx";
import fs from "fs";
import JSZip from "jszip";
import {loadMetadata} from "../utils/config";
import path from "path";
import TurndownService from "turndown";
import {ANNOTATION_RICHTEXT} from "../constants/constants";
import {calculateTableHeight} from "../utils/common";

class Collections extends PureComponent {
    constructor(props) {
        super(props);

        const initPicturesList = this.props.tabData[this.props.tabName].pictures_selection.map(_ => this.props.allPictures[_]);
        const annotation_list = this.props.annotations;
        const cartels = this.props.cartels;

        this.state = {
            cartels,
            initPicturesList,
            annotation_list,
            sortBy: props.sortBy,
            sortDirection: props.sortDirection,
            selectedPictures: [],
            selectAll: false,
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
        let height = calculateTableHeight(this.pane , 50);
        this.setState({
            height: height
        });
    }

    generateExportColumns(image) {
        const EXPORT_COLUMNS = [
            'Title',
            'Catalog number',
            'Scientific name',
            'Collection number',
            'Author',
            'Date',
            'Cartel',
            'Path',
            'LongitudeDD',
            'LatitudeDD',
        ];
        if (image.anno_counter > 0) {
            for (let i = 0; i < image.anno_counter; i++) {
                EXPORT_COLUMNS.push('annotation_type_' + (i + 1));
                EXPORT_COLUMNS.push('annotation_name_' + (i + 1));
                EXPORT_COLUMNS.push('annotation_value_' + (i + 1));
                EXPORT_COLUMNS.push('annotation_position_' + (i + 1));
            }
        }
        return EXPORT_COLUMNS;
    }

    _exportCSV(separator, action) {
        if (this.state.initPicturesList) {
            const { t } = this.props;
            const turndownService = new TurndownService()

            const annotations = this.state.annotation_list;
            const picture_list = this.state.initPicturesList;
            const cartels = this.state.cartels;
            let xmpImageArrayLength = 0;

            this.state.initPicturesList.forEach(img => {
                // console.log(img.erecolnatMetadata)
                if (!img.erecolnatMetadata) {
                    xmpImageArrayLength++;
                }
            });

            let maxCount = picture_list[0];
            maxCount.anno_counter = 0;
            let data = [];

            let title = '';
            let catalogNo = '';
            let scientificName = '';
            let collectionNumber = '';
            let author = '';
            let date = '';
            let cartel = '';
            let imagePath = '';
            let longitudeDD = '';
            let latitudeDD = '';

            const now = new Date();
            let zip = new JSZip();
            let imgFolder = zip.folder("images");

            const addPrefix = function pad(index, size) {
                let digits = size.toString().length;
                let str = index + 1 + '';
                while (str.length < digits) {
                    str = '0' + str;
                }
                return str + `_`;
            };

            if (picture_list) {
                picture_list.forEach(function (_img, index) {
                    _img.anno_counter = 0;

                    const image = {..._img};
                    const dataRow = [];
                    let annotationValue;
                    const xmp_metadata = loadMetadata(_img.sha1);

                    if (_img.sha1 in cartels) {
                        cartel = turndownService.turndown(cartels[_img.sha1].value);
                    } else {
                        cartel = '';
                    }

                    if (!image.erecolnatMetadata) {
                        imagePath = _img.file;
                    }

                    if (xmp_metadata !== null) {
                        catalogNo = xmp_metadata.naturalScienceMetadata.catalogNumber;
                        scientificName = xmp_metadata.naturalScienceMetadata.sfName;
                        collectionNumber = xmp_metadata.naturalScienceMetadata.fieldNumber;
                        title = xmp_metadata.iptc.title;
                        author = xmp_metadata.iptc.creator;
                        date = xmp_metadata.iptc.created;
                        imagePath = _img.file;

                    } else {
                        catalogNo = '';
                        collectionNumber = '';
                        scientificName = '';
                        title = '';
                        author = '';
                        date = '';
                        imagePath = '';
                    }

                    if (_img.erecolnatMetadata) {
                        catalogNo = _img.erecolnatMetadata.catalognumber;
                        title = _img.erecolnatMetadata.family + ',' +
                            _img.erecolnatMetadata.genus + ',' +
                            _img.erecolnatMetadata.specificepithet;
                        scientificName = _img.erecolnatMetadata.scientificname;
                        collectionNumber = _img.erecolnatMetadata.fieldNumber;
                        author = _img.erecolnatMetadata.recordedby;
                        date = _img.erecolnatMetadata.modified;
                        imagePath = _img.file;
                        latitudeDD = _img.erecolnatMetadata.decimallatitude;
                        longitudeDD = _img.erecolnatMetadata.decimallongitude;
                    }

                    if (action === 'csv_with_images') {
                        imgFolder.file(addPrefix(index, xmpImageArrayLength) + image.file_basename, fs.readFileSync(image.file));

                        if (xmp_metadata !== null) {
                            const parentFolder = path.dirname(_img.file);
                            const fileName = _img.file_basename.substring(0, _img.file_basename.lastIndexOf('.'));
                            const xmp = path.join(parentFolder, `${fileName}.xmp`);
                            const xml = path.join(parentFolder, `${fileName}.xml`);
                            imgFolder.file(addPrefix(index, xmpImageArrayLength) + `${fileName}.xmp`, fs.readFileSync(xmp));
                            if (fs.existsSync(xml)) {
                                imgFolder.file(addPrefix(index, xmpImageArrayLength) + `${fileName}.xml`, fs.readFileSync(xml));
                            }
                        }

                        imagePath = addPrefix(index, xmpImageArrayLength) + _img.file_basename;
                    }

                    dataRow.push(
                        title,
                        catalogNo,
                        scientificName,
                        collectionNumber,
                        author,
                        date,
                        cartel,
                        imagePath,
                        longitudeDD,
                        latitudeDD
                    );

                    annotations.forEach(annotation => {
                        if (annotation.pictureId === image.sha1) {
                            _img.anno_counter++;

                            if (annotation.annotationType === ANNOTATION_RICHTEXT) {
                                annotationValue = turndownService.turndown(annotation.value);
                            } else if (annotation.annotationType === 'angle')
                                annotationValue = annotation.value_in_deg;
                            else if (annotation.annotationType === 'polygon')
                                annotationValue = annotation.area;
                            else if (annotation.annotationType === 'simple-line' || annotation.annotationType === 'polyline')
                                annotationValue = annotation.value_in_mm;
                            else
                                annotationValue = annotation.value;

                            dataRow.push(annotation.annotationType);
                            dataRow.push(annotation.title);
                            dataRow.push(annotationValue);
                            dataRow.push(JSON.stringify(annotation.vertices));
                        }
                    });

                    data.push(
                        dataRow
                    );

                    if (picture_list[index].anno_counter > maxCount.anno_counter) {
                        maxCount.anno_counter = picture_list[index].anno_counter;
                    }
                });
            }

            const worksheet = XLSX.utils.aoa_to_sheet([this.generateExportColumns(maxCount), ...data]);
            const stream = XLSX.stream.to_csv(worksheet, {FS: separator});

            if (action === 'csv_with_images') {
                const saverPath = remote.dialog.showSaveDialog(remote.getCurrentWindow () ,{
                    title: t('results.collections.dialog_title_save'),
                    defaultPath: `${formatDateForFileName(now)}`,
                });
                if (!saverPath || saverPath.length < 1) return;

                zip.file(`${formatDateForFileName(now)}.csv`, stream);
                zip.generateNodeStream({type: 'nodebuffer', streamFiles: true})
                    .pipe(fs.createWriteStream(saverPath + '.zip'));

                const result = remote.dialog.showMessageBox(remote.getCurrentWindow () ,{
                    type: 'info',
                    detail: saverPath,
                    message: t('global.export_finished'),
                    buttons: ['OK', t('global.open_folder')],
                    cancelId: 1
                });
                if (result === 1) {
                    shell.showItemInFolder(saverPath);
                }


            } else {
                let file = remote.dialog.showSaveDialog(remote.getCurrentWindow () ,{
                    title: t('results.collections.dialog_title_save'),
                    defaultPath: `${formatDateForFileName(now)}`
                });
                if (!file || file.length < 1) return;

                stream.pipe(fs.createWriteStream(file + '.csv'));
                const result = remote.dialog.showMessageBox(remote.getCurrentWindow () ,{
                    type: 'info',
                    detail: file,
                    message: t('global.export_finished'),
                    buttons: ['OK', t('global.open_folder')],
                    cancelId: 1
                });
                if (result === 1) {
                    shell.showItemInFolder(file);
                }
            }
        }
    }

    render() {
        let key = 0;
        let imageArrayLength = this.state.initPicturesList.length;
        const { t } = this.props;

        const addPrefix = function pad(index, size) {
            let digits = size.toString().length;
            let str = index + 1 + '';
            while (str.length < digits) {
                str = '0' + str;
            }
            return str + `_`;
        };

        const  isDropdownDisabled = this.state.initPicturesList.length === 0;
        return (
            <div>
                <Row className="action-bar">
                    <Col md={1}>
                        <div>
                            <Dropdown title={t('results.dropdown_tooltip_export_the_selected_characters_to_a_csv_file')}
                                      className="collection-export-button"
                                      isOpen={this.state.dropdownOpen}
                                      size="sm"
                                      color="primary"
                                      toggle={() => {
                                          this.setState(prevState => ({
                                              dropdownOpen: !prevState.dropdownOpen}));
                                      }}>
                                <DropdownToggle caret color="primary" disabled={isDropdownDisabled}>
                                    {t('results.collections.dropdown_export_collection')}
                                </DropdownToggle>
                                <DropdownMenu>
                                    <DropdownItem onClick={() => {
                                        this._exportCSV(',', '');
                                    }}>{t('results.collections.dropdown_item_export_csv')}</DropdownItem>
                                    <DropdownItem onClick={() => {
                                        this._exportCSV(',', 'csv_with_images');
                                    }}>{t('results.collections.dropdown_item_export_csv_with_images')}</DropdownItem>
                                    <DropdownItem onClick={() => {
                                        this.props.goToCollectionExport(this.props.tabName);
                                    }}>{t('results.collections.dropdown_item_export_iiif')}</DropdownItem>
                                </DropdownMenu>
                            </Dropdown>
                        </div>
                    </Col>
                </Row>

                <Row className="no-margin">
                    <Col className="no-padding">
                        <div className="scrollable-table-wrapper" id="wrapper" ref={_ => (this.pane = _)}
                             style={{height: this.state.height}}>
                            <Table hover size="sm" className="targets-table">
                                <thead title={t('results.table_header_tooltip_ascendant_or_descendant_order')}>
                                <tr>
                                    <th>#</th>
                                    <TableHeader title={t('results.collections.table_column_title')}/>
                                    <TableHeader title={t('results.collections.table_column_catalog')}/>
                                    <TableHeader title={t('results.collections.table_column_scientific_name')}/>
                                    <TableHeader title={t('results.collections.table_column_collection')}/>
                                    <TableHeader title={t('results.collections.table_column_author')}/>
                                    <TableHeader title={t('results.collections.table_column_date')}/>
                                    <TableHeader title={t('results.collections.table_column_cartel')}/>
                                    <TableHeader title={t('results.collections.table_column_file')}/>
                                </tr>
                                </thead>
                                <tbody>
                                {this.state.initPicturesList.map((image, index) => {
                                    if (index >= this.state.pageSize * (this.state.currentPage - 1) && index < this.state.pageSize * this.state.currentPage) {
                                        let cartel,catalogNo,title,scientificName,collectionNumber,author,date,path;
                                        let counter = 0;
                                        const xmp_metadata = loadMetadata(image.sha1);

                                        if (image.sha1 in this.props.cartels) {
                                            cartel = this.props.cartels[image.sha1].value;
                                        } else {
                                            cartel = '';
                                        }

                                        if (!image.erecolnatMetadata) {
                                            path = addPrefix(counter, imageArrayLength) + image.file_basename;
                                            counter++;
                                        }

                                        if (xmp_metadata !== null) {
                                            collectionNumber = xmp_metadata.naturalScienceMetadata.fieldNumber;
                                            catalogNo = xmp_metadata.naturalScienceMetadata.catalogNumber;
                                            scientificName = xmp_metadata.naturalScienceMetadata.sfName;
                                            title = xmp_metadata.iptc.title;
                                            author = xmp_metadata.iptc.creator;
                                            date = xmp_metadata.iptc.created;
                                        } else {
                                            catalogNo = '';
                                            scientificName = '';
                                            title = '';
                                            author = '';
                                            date = '';
                                            collectionNumber = '';
                                        }

                                        if (image.erecolnatMetadata) {
                                            catalogNo = image.erecolnatMetadata.catalognumber;
                                            title = image.erecolnatMetadata.family + ',' +
                                                image.erecolnatMetadata.genus + ',' +
                                                image.erecolnatMetadata.specificepithet;
                                            scientificName = image.erecolnatMetadata.scientificname;
                                            author = image.erecolnatMetadata.recordedby;
                                            date = image.erecolnatMetadata.modified;
                                            collectionNumber = image.erecolnatMetadata.dwcaid;
                                            path = addPrefix(counter, imageArrayLength) + image.file_basename;
                                            counter++;
                                        }

                                        return (
                                            <tr key={key++}>
                                                <td scope="row">{index + 1}</td>
                                                <td>{title}</td>
                                                <td>{catalogNo}</td>
                                                <td>{scientificName}</td>
                                                <td>{collectionNumber}</td>
                                                <td>{author}</td>
                                                <td>{date}</td>
                                                <td>{cartel}</td>
                                                <td>{path}</td>
                                            </tr>
                                        );
                                    }
                                })}
                                </tbody>
                            </Table>
                            {createPagination('collections', this.state.initPicturesList, this.state.currentPage, this.state.pageSize, (data) => {
                                this.setState(data);
                            })}
                        </div>
                    </Col>
                </Row>
            </div>
        );
    }
}

export default Collections;
