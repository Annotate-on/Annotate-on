import {_formatTimeDisplay} from "./maths";
import XLSX from "xlsx";
import fs from "fs";
import {remote, shell} from "electron";
import JSZip from "jszip";
import {SORT_ALPHABETIC_ASC, SORT_ALPHABETIC_DESC, SORT_DATE_ASC, SORT_DATE_DESC} from "../constants/constants";

export const _orderAnnotationsByTcInAndFormatTime = ( annotations ) => {
    return  annotations.sort((a, b) => (a.start > b.start) ? 1 : -1).map((ann) => {
        ann.start = _formatTimeDisplay(ann.start)
        ann.end = _formatTimeDisplay(ann.end)
        ann.duration = _formatTimeDisplay(ann.duration)
        return ann;
    });
}

export const calculateTableHeight = (pane , offset) => {
    let node = pane;
    while (node.offsetParent && node.offsetParent.id !== "wrapper") {
        offset += node.offsetTop;
        node = node.offsetParent;
    }
    return node.offsetHeight - offset;
}

export const getXlsx = (worksheet , separator , file) => {

    const stream = XLSX.stream.to_csv(worksheet, {FS: separator});
    stream.pipe(fs.createWriteStream(file));

    const result = remote.dialog.showMessageBox(remote.getCurrentWindow () ,{
        type: 'info',
        detail: file,
        message: `Export finished`,
        buttons: ['OK', 'Open folder'],
        cancelId: 1
    });

    if (result === 1) {
        shell.showItemInFolder(file);
    }
}

export const exportZipForChronoOrEventAnnotations = (data, file , separator , tableColumns) => {
    const zip = new JSZip();
    for (let key in data) {
        const worksheet = XLSX.utils.aoa_to_sheet([tableColumns.slice(1), ...data[key]]);
        const stream = XLSX.stream.to_csv(worksheet, {FS: separator});
        let csvName = key;
        const dotIndex = csvName.lastIndexOf('.');
        if (dotIndex !== -1) {
            csvName = csvName.substring(0, dotIndex);
        }
        zip.file(csvName + '.csv', stream);
    }
    zip.generateNodeStream({type: 'nodebuffer', streamFiles: true})
        .pipe(fs.createWriteStream(file));

    const result = remote.dialog.showMessageBox(remote.getCurrentWindow(), {
        type: 'info',
        detail: file,
        message: `Export finished`,
        buttons: ['OK', 'Open folder'],
        cancelId: 1
    });

    if (result === 1) {
        shell.showItemInFolder(file);
    }
}

export const sortTagsAlphabeticallyOrByDate = (tags , direction) => {
    return tags.sort((a, b) => {
        switch (direction) {
            case SORT_ALPHABETIC_DESC:
                return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
            case SORT_ALPHABETIC_ASC:
                return b.name.toLowerCase().localeCompare(a.name.toLowerCase());
            case SORT_DATE_DESC:
                return (a.creationTimestamp > b.creationTimestamp ? -1 : (a.creationTimestamp < b.creationTimestamp ? 1 : 0));
            case SORT_DATE_ASC:
                return (a.creationTimestamp < b.creationTimestamp ? -1 : (a.creationTimestamp > b.creationTimestamp ? 1 : 0));
        }
    });
}
