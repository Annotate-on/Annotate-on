import React, {PureComponent} from "react";
import {Col, Dropdown, DropdownItem, DropdownMenu, DropdownToggle, Row, Table} from "reactstrap";
import TableHeader from "./TableHeader";
import {remote, shell} from "electron";
import {createPagination, formatDateForFileName} from "../utils/js";
import XLSX from "xlsx";
import fs from "fs";
import JSZip from "jszip";
import {loadMetadata} from "../utils/config";
import {ExifTool} from "exiftool-vendored";
import {validatePictureFormat} from "../utils/library";
import {calculateTableHeight} from "../utils/common";

class XmpMetadata extends PureComponent {

    constructor(props) {
        super(props);
        const initPicturesList = this.props.tabData[this.props.tabName].pictures_selection.map(_ => this.props.allPictures[_]);
        const { t } = this.props;
        const tableColumns = [
            t('results.metadata.table_column_catalog'),
            t('results.metadata.table_column_reference'),
            t('results.metadata.table_column_family'),
            t('results.metadata.table_column_genre'),
            t('results.metadata.table_column_scientific_name'),
            t('results.metadata.table_column_field'),

            t('results.metadata.table_column_title'),
            t('results.metadata.table_column_creator'),
            t('results.metadata.table_column_subject_keywords'),
            t('results.metadata.table_column_description'),
            t('results.metadata.table_column_publisher'),
            t('results.metadata.table_column_contributor'),
            t('results.metadata.table_column_date'),
            t('results.metadata.table_column_type'),
            t('results.metadata.table_column_format'),
            t('results.metadata.table_column_identifier'),
            t('results.metadata.table_column_source'),
            t('results.metadata.table_column_language'),
            t('results.metadata.table_column_relation'),
            t('results.metadata.table_column_coverage'),
            t('results.metadata.table_column_rights'),
            t('results.metadata.table_column_contact'),

            t('results.metadata.table_column_dimension_x'),
            t('results.metadata.table_column_dimension_y'),
            t('results.metadata.table_column_resolution_x'),
            t('results.metadata.table_column_resolution_y'),
            t('results.metadata.table_column_orientation')
        ];

        this.state = {
            tableColumns,
            initPicturesList,
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

    exportXmpMetadataToCsv(separator) {
        const { t } = this.props;
        const pictures = this.state.initPicturesList;

        if (pictures) {
            const now = new Date();
            let file = remote.dialog.showSaveDialog(remote.getCurrentWindow () ,{
                title:  t('results.metadata.dialog_title_save_xmp_metadata'),
                defaultPath: `${formatDateForFileName(now)}`
            });
            if (!file || file.length < 1) return;

            const data = pictures.map(image => {

                const xmp_metadata = loadMetadata(image.sha1);

                if (xmp_metadata !== null) {
                    return [
                        xmp_metadata.naturalScienceMetadata.catalogNumber,
                        xmp_metadata.naturalScienceMetadata.reference,
                        xmp_metadata.naturalScienceMetadata.family,
                        xmp_metadata.naturalScienceMetadata.genre,
                        xmp_metadata.naturalScienceMetadata.sfName,
                        xmp_metadata.naturalScienceMetadata.fieldNumber,

                        xmp_metadata.iptc.title,
                        xmp_metadata.iptc.creator,
                        xmp_metadata.iptc.subject,
                        xmp_metadata.iptc.description,
                        xmp_metadata.iptc.publisher,
                        xmp_metadata.iptc.contributor,
                        xmp_metadata.iptc.created,
                        xmp_metadata.iptc.type,
                        xmp_metadata.iptc.format,
                        xmp_metadata.iptc.identifier,
                        xmp_metadata.iptc.source,
                        xmp_metadata.iptc.language,
                        xmp_metadata.iptc.relation,
                        xmp_metadata.iptc.location,
                        xmp_metadata.iptc.rights,
                        xmp_metadata.iptc.contact,

                        xmp_metadata.exif.dimensionsX,
                        xmp_metadata.exif.dimensionsY,
                        xmp_metadata.exif.resolutionX,
                        xmp_metadata.exif.resolutionY,
                        xmp_metadata.exif.orientation
                    ]
                }
            });

            const worksheet = XLSX.utils.aoa_to_sheet([this.state.tableColumns, ...data]);
            const stream = XLSX.stream.to_csv(worksheet, {FS: separator});
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

    exportXmpWithImages() {
        const { t } = this.props;
        const exiftool = new ExifTool();
        exiftool
            .version()
            .then(version => console.log(`We're running ExifTool v${version}`));

        const removeDuplicates = (duplicates) => {
            if (duplicates.length > 0) {
                duplicates.forEach(duplicate => {
                    console.log('removing .....' + duplicate);
                    fs.unlinkSync(duplicate);
                })
            } else {
                console.log('there are no duplicates')
            }
        };

        const pictures = this.state.initPicturesList;
        const now = new Date();
        if (pictures) {
            let duplicateImages = [];
            let zip = new JSZip();
            let imgFolder = zip.folder("images");
            let promises = [];

            Promise.all(promises)
                .then((results) => {
                    const exifWriteJobs = pictures.map(image => {
                        return new Promise((resolve, reject) => {
                            const xmp_metadata = loadMetadata(image.sha1);


                            let copy_of_image = image.file.substring(0, image.file.lastIndexOf(".")) + "_xmp" + image.file.substring(image.file.lastIndexOf("."));
                            const pathToTempImage = copy_of_image + '_original';

                            validatePictureFormat(image.file).then(result => {
                                if (fs.existsSync(copy_of_image) && (result === true || result === 'png')) {
                                    exiftool.write(copy_of_image, {
                                        recolnat_catalogNumber: xmp_metadata.naturalScienceMetadata.catalogNumber,
                                        recolnat_reference: xmp_metadata.naturalScienceMetadata.reference,
                                        recolnat_family: xmp_metadata.naturalScienceMetadata.family,
                                        recolnat_genre: xmp_metadata.naturalScienceMetadata.genre,
                                        recolnat_sfName: xmp_metadata.naturalScienceMetadata.sfName,
                                        recolnat_fieldNumber: xmp_metadata.naturalScienceMetadata.fieldNumber,

                                        dc_title: xmp_metadata.iptc.title,
                                        dc_creator: xmp_metadata.iptc.creator,
                                        dc_subject: xmp_metadata.iptc.subject,
                                        dc_description: xmp_metadata.iptc.description,
                                        dc_publisher: xmp_metadata.iptc.publisher,
                                        dc_contributor: xmp_metadata.iptc.contributor,
                                        dc_created: xmp_metadata.iptc.created,
                                        dc_type: xmp_metadata.iptc.type,
                                        dc_format: xmp_metadata.iptc.format,
                                        dc_identifier: xmp_metadata.iptc.identifier,
                                        dc_source: xmp_metadata.iptc.source,
                                        dc_language: xmp_metadata.iptc.language,
                                        dc_relation: xmp_metadata.iptc.relation,
                                        dc_coverage: xmp_metadata.iptc.location,
                                        dc_rights: xmp_metadata.iptc.rights,
                                        dc_contact: xmp_metadata.iptc.contact,

                                        exif2_dimensionsX: xmp_metadata.exif.dimensionsX,
                                        exif2_dimensionsY: xmp_metadata.exif.dimensionsY,
                                        exif2_resolutionX: xmp_metadata.exif.resolutionX,
                                        exif2_resolutionY: xmp_metadata.exif.resolutionY,
                                        exif2_orientation: xmp_metadata.exif.orientation
                                    }).then(result => {
                                        imgFolder.file(image.file_basename, fs.readFileSync(copy_of_image));
                                        duplicateImages.push(copy_of_image, pathToTempImage);
                                        resolve();
                                    });
                                } else {
                                    console.log('can not write xmp metadata to' + image.file);
                                    resolve();
                                }
                            });
                        });
                    });

                    Promise.all(exifWriteJobs).then(result => {
                        const saverPath = remote.dialog.showSaveDialog(remote.getCurrentWindow () ,{
                            title: t('results.metadata'),
                            defaultPath: `xmp_${formatDateForFileName(now)}`
                        });
                        if (!saverPath || saverPath.length < 1) return;

                        zip.generateNodeStream({type: 'nodebuffer', streamFiles: true})
                            .pipe(fs.createWriteStream(saverPath + '.zip'))
                            .on('finish', () => {
                            });

                        const resultDialog = remote.dialog.showMessageBox(remote.getCurrentWindow () ,{
                            type: 'info',
                            detail: saverPath,
                            message: t('global.export_finished'),
                            buttons: ['OK', t('global.open_folder')],
                            cancelId: 1
                        });
                        if (resultDialog === 1) {
                            shell.showItemInFolder(saverPath);
                        }
                    }).then(
                        setTimeout(() => {
                            removeDuplicates(duplicateImages);
                        }, 2000)
                    );
                })
                .catch((e) => {
                    console.log(e)
                });
        }
    }

    render() {
        let key = 0;
        const isDropdownDisabled = this.state.initPicturesList.length === 0;
        const { t } = this.props;

        const metadatas = [];
        this.state.initPicturesList.map((image, index) => {
            const metadata = loadMetadata(image.sha1);
            if (metadata !== null) {
                metadatas.push(metadata);
            }
        });

        return (
            <div>
                <Row className="action-bar">
                    <Col md={1}>
                        <div>
                            <Dropdown title={t('results.dropdown_tooltip_export_the_selected_characters_to_a_csv_file')}
                                      style={{marginTop: '6px'}}
                                      isOpen={this.state.dropdownOpen}
                                      size="sm" color="primary" toggle={(event) => {
                                this.setState(prevState => ({
                                    dropdownOpen: !prevState.dropdownOpen
                                }));
                            }}>
                                <DropdownToggle caret color="primary" disabled={isDropdownDisabled}>
                                    {t('results.metadata.dropdown_export_xmp_metadata')}
                                </DropdownToggle>
                                <DropdownMenu>
                                    <DropdownItem onClick={() => {
                                        this.exportXmpWithImages();
                                    }}>{t('results.metadata.dropdown_item_export_xmp_with_images')}</DropdownItem>
                                    <DropdownItem onClick={() => {
                                        this.exportXmpMetadataToCsv(',');
                                    }}>{t('results.metadata.dropdown_item_export_xmp_to_csv')}</DropdownItem>
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
                                <thead>
                                <tr>
                                    <th>#</th>
                                    {this.state.tableColumns.map((columnName) => {
                                        return (
                                            <TableHeader key={key++} title={columnName}/>
                                        );
                                    })}
                                </tr>
                                </thead>
                                <tbody>
                                {metadatas.map((xmp, index) => {
                                    if (index >= this.state.pageSize * (this.state.currentPage - 1) && index < this.state.pageSize * this.state.currentPage) {
                                        return (
                                            <tr key={key++}>
                                                <td scope="row">{index + 1}</td>
                                                <td>{xmp.naturalScienceMetadata.catalogNumber}</td>
                                                <td>{xmp.naturalScienceMetadata.reference}</td>
                                                <td>{xmp.naturalScienceMetadata.family}</td>
                                                <td>{xmp.naturalScienceMetadata.genre}</td>
                                                <td>{xmp.naturalScienceMetadata.sfName}</td>
                                                <td>{xmp.naturalScienceMetadata.fieldNumber}</td>

                                                <td>{xmp.iptc.title}</td>
                                                <td>{xmp.iptc.creator}</td>
                                                <td>{xmp.iptc.subject}</td>
                                                <td>{xmp.iptc.description}</td>
                                                <td>{xmp.iptc.publisher}</td>
                                                <td>{xmp.iptc.contributor}</td>
                                                <td>{xmp.iptc.created}</td>
                                                <td>{xmp.iptc.type}</td>
                                                <td>{xmp.iptc.format}</td>
                                                <td>{xmp.iptc.identifier}</td>
                                                <td>{xmp.iptc.source}</td>
                                                <td>{xmp.iptc.language}</td>
                                                <td>{xmp.iptc.relation}</td>
                                                <td>{xmp.iptc.location}</td>
                                                <td>{xmp.iptc.rights}</td>
                                                <td>{xmp.iptc.contact}</td>

                                                <td>{xmp.exif.dimensionsX}</td>
                                                <td>{xmp.exif.dimensionsY}</td>
                                                <td>{xmp.exif.resolutionX}</td>
                                                <td>{xmp.exif.resolutionY}</td>
                                                <td>{xmp.exif.orientation}</td>
                                            </tr>
                                        );
                                    }
                                })}
                                </tbody>
                            </Table>
                            {createPagination('xmpmetadata', metadatas, this.state.currentPage, this.state.pageSize, (data) => {
                                this.setState(data);
                            })}
                        </div>
                    </Col>
                </Row>
            </div>
        )
    }
}

export default XmpMetadata;
