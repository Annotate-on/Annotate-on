import crypto from 'crypto';
import {nativeImage} from 'electron';
import {EventEmitter} from 'events';
import exif from 'fast-exif';
import fs from 'fs-extra';
import ImageFile from 'image-file';
import imagesize from 'image-size';
import klaw from 'klaw';
import path from 'path';
import {
    getAllDirectoriesNameFlatten,
    getCacheDir,
    getProjectInfoFile,
    getThumbNailsDir,
    getUserWorkspace
} from './config';
import {
    COMMON_TAGS,
    IMAGE_STORAGE_DIR,
    RESOURCE_TYPE_PICTURE,
    RESOURCE_TYPE_VIDEO,
    SUPPORTED_VIDEO_FORMAT_REGEXP, TAG_AUTO,
    THUMBNAIL_COUNT
} from "../constants/constants";
import {getMetadata, getXmpMetadata} from "./erecolnat-metadata";
import lodash from "lodash";
import ExifReader from 'exifreader';
import readChunck from "read-chunk";
import fileType from "file-type";

import ThumbnailGenerator from 'video-thumbnail-generator';
import ffmpeg from 'ffmpeg-static-electron';
import ffprobe from 'ffprobe-static-electron';
import ffprobeClient from 'ffprobe-client';
import {TYPE_CATEGORY} from "../components/event/Constants";

export const PATH_TO_EVENT_THUMBNAIL = './components/pictures/event/event-logo.png';
export const authorized_pictures_extensions = ['.jpg', '.jpeg', '.png'];
export const AUTHORIZED_VIDEOS_EXTENSIONS = ['.mp4', '.mov', '.3gp', '.mkv', '.ogv', '.webm'];
export const ee = new EventEmitter();
export const EVENT_DIRECTORIES_ANALYSES_COMPLETE = 'EVENT_DIRECTORIES_ANALYSES_COMPLETE';
export const EVENT_PROCESS_IMAGE_COMPLETE = 'EVENT_PROCESS_IMAGE_COMPLETE';
export const EVENT_THUMBNAIL_CREATION_COMPLETE = 'EVENT_THUMBNAIL_CREATION_COMPLETE';
export const EVENT_SELECT_TAB = 'EVENT_SELECT_TAB';
export const EVENT_SELECT_LIBRARY_TAB = 'EVENT_SELECT_LIBRARY_TAB';
export const EVENT_OPEN_TAB = 'EVENT_OPEN_TAB';
export const EVENT_FOCUS_NEW_VIDEO_ANNOTATION_ON_ANNOTATION_FINISH = 'EVENT_FOCUS_NEW_VIDEO_ANNOTATION_ON_ANNOTATION_FINISH';
export const EVENT_HIGHLIGHT_ANNOTATION = 'EVENT_HIGHLIGHT_ANNOTATION';
export const EVENT_HIGHLIGHT_ANNOTATION_ON_LEAFLET = 'EVENT_HIGHLIGHT_ANNOTATION_ON_LEAFLET';
export const EVENT_SHOW_ALERT = 'EVENT_SHOW_ALERT';
export const EVENT_ON_TAG_DROP = 'EVENT_ON_TAG_DROP';
export const EVENT_SHOW_LOADING = 'EVENT_SHOW_LOADING';
export const EVENT_SHOW_LOADING_ON_RESOURCE_IMPORT = 'EVENT_SHOW_LOADING_ON_RESOURCE_IMPORT';
export const EVENT_HIDE_LOADING = 'EVENT_HIDE_LOADING';
export const EVENT_PROCESSING_IMAGE = 'EVENT_PROCESSING_IMAGE';
export const EVENT_SEARCH_FOR_DUPLICATES = 'EVENT_SEARCH_FOR_DUPLICATES';
export const EVENT_CREATE_SYSTEM_TAGS = 'EVENT_CREATE_SYSTEM_TAGS';
export const EVENT_SHOW_WAITING = 'EVENT_SHOW_WAITING';
export const EVENT_HIDE_WAITING = 'EVENT_HIDE_WAITING';
export const EVENT_EDIT_CARTEL = 'EVENT_EDIT_CARTEL';
export const EVENT_GOTO_ANNOTATION = 'EVENT_GOTO_ANNOTATION';
export const REFRESH_EVENT_TIMELINE_STATE = 'REFRESH_EVENT_TIMELINE_STATE';
export const EVENT_GET_EVENT_TIMELINE_CURRENT_TIME = 'EVENT_GET_EVENT_TIMELINE_CURRENT_TIME';
export const NOTIFY_CURRENT_TIME = 'NOTIFY_CURRENT_TIME';
export const EVENT_SET_ANNOTATION_POSITION = 'EVENT_SET_ANNOTATION_POSITION';
export const EVENT_UPDATE_RECORDING_STATUS = 'EVENT_UPDATE_RECORDING_STATUS';
export const EVENT_SAVE_EVENT_ANNOTATION_FROM_EDIT_PANEL = 'EVENT_SAVE_EVENT_ANNOTATION_FROM_EDIT_PANEL';
export const EVENT_UPDATE_IS_EDIT_MODE_OPEN_IN_NAVIGATION_AND_TABS = 'EVENT_UPDATE_IS_EDIT_MODE_OPEN_IN_NAVIGATION_AND_TABS';
export const EVENT_UPDATE_RECORDING_STATUS_IN_NAVIGATION = 'EVENT_UPDATE_RECORDING_STATUS_IN_NAVIGATION';
export const EVENT_UPDATE_EVENT_RECORDING_STATUS = 'EVENT_UPDATE_EVENT_RECORDING_STATUS';
export const EVENT_FORCE_UPDATE_EDIT_MODE = 'EVENT_FORCE_UPDATE_EDIT_MODE';
export const EVENT_UPDATE_EVENT_IN_EVENT_FORM = 'EVENT_UPDATE_EVENT_IN_EVENT_FORM';
export const EVENT_DISHONOR_ANNOTATION = 'EVENT_DISHONOR_ANNOTATION';
export const EVENT_UNFOCUS_ANNOTATION = 'EVENT_UNFOCUS_ANNOTATION';
export const SHOW_EDIT_MODE_VIOLATION_MODAL = 'SHOW_EDIT_MODE_VIOLATION_MODAL';
export const STOP_ANNOTATION_RECORDING = 'STOP_ANNOTATION_RECORDING';


const authorized_pictures_extensions_for_xmp = ['.jpg', '.jpeg'];

process.env.FFMPEG_PATH = ffmpeg.path.replace('app.asar', 'app.asar.unpacked');
process.env.FFPROBE_PATH = ffprobe.path.replace('app.asar', 'app.asar.unpacked');

//
// LIBRARY
//
export const initPicturesLibrary = async (files, folders, picturesInStore) => {
    let pictures = {};
    const duplicates = [];
    let addedPicturesCount = 0;

    ee.emit(EVENT_DIRECTORIES_ANALYSES_COMPLETE, {files: files.length, folders});
    for (const f of files) {
        try {
            const result = await makePictureObjectFromFile(f, pictures, picturesInStore);
            if (result === true) {
                addedPicturesCount++;
            } else {
                // TODO 12.03.2020 11:42 mseslija: display message where duplicate image can be found.
                duplicates.push(f);
                if (result.file !== f) {
                    fs.unlinkSync(f);

                    // delete metadata json file
                    const basename = path.basename(f);
                    const fileName = `${basename.substring(0, basename.lastIndexOf('.'))}.json`;
                    const dir = path.dirname(f);
                    const filePath = path.join(dir, fileName)
                    console.log(filePath)
                    if (fs.existsSync(filePath)) {
                        fs.unlink(filePath);
                    }
                }
            }
            console.log('duplicates' , duplicates);
        } catch (e) {
            console.log(e)
        }
    }

    return pictures;
};

export const initVideosLibrary = async (files, folders, resourcesInStore) => {
    let pictures = {};
    const duplicates = [];
    let addedPicturesCount = 0;

    ee.emit(EVENT_DIRECTORIES_ANALYSES_COMPLETE, {files: files.length, folders});
    for (const f of files) {
        try {
            const result = await makeVideoObjectFromFile(f, pictures, resourcesInStore);
            if (result === true) {
                addedPicturesCount++;
            } else {
                // TODO 12.03.2020 11:42 mseslija: display message where duplicate image can be found.
                duplicates.push(f);

                if (result.file !== f) {
                    fs.unlinkSync(f);

                    // delete metadata json file
                    const basename = path.basename(f);
                    const fileName = `${basename.substring(0, basename.lastIndexOf('.'))}.json`;
                    const dir = path.dirname(f);
                    const filePath = path.join(dir, fileName)
                    console.log(filePath)
                    if (fs.existsSync(filePath)) {
                        fs.unlink(filePath);
                    }
                }
            }
        } catch (e) {
            console.log(e)
        }
    }
    if (duplicates.length > 0){
        console.log('duplicates' , duplicates);
    }
    return pictures;
};

const makePictureObjectFromFile = async (file, pictures_cache, picturesInStore) => {

    ee.emit(EVENT_PROCESSING_IMAGE, file);
    // We always need to compute the picture file SHA1, since it unique ID for pictures.
    const sha1 = await getSHA1(file);

    // check if same SHA1 already exist
    if (picturesInStore) {
        if (sha1 in picturesInStore)
            return picturesInStore[sha1];
    }

    const isJpeg = await validatePictureFormat(file);

    ee.emit(EVENT_SEARCH_FOR_DUPLICATES);

    if (isJpeg === false) {
        console.log('unsupported file type for file: ' + file);
        return false;
    }

    ///////////////////////////////////////////READ ERECOLNAT METADATA//////////////////////////////////////////////
    const erecolnatMetadata = getMetadata(file);

    /////////////////////////////////////////////// CREATE THUMBNAIL ///////////////////////////////////////////////
    const thumbnail_path = path.join(getThumbNailsDir(), `${sha1}.jpg`);

    const exists = await fs.pathExists(thumbnail_path);
    if (!exists) {
        const image = nativeImage.createFromPath(file);
        const resizedImage = image.resize({
            height: 256
        });
        fs.writeFileSync(thumbnail_path, resizedImage.toJPEG(100));
    }

    // ee.emit(EVENT_THUMBNAIL_CREATION_COMPLETE);

    if (isJpeg === true) {

        /////////////////////////////////////////////// READ EXIF //////////////////////////////////////////////////////
        // We compute all the "technical" metadata if the image is jpeg or jpg.
        let exif = await readExifMetadata(file);

        ///////////////////////////////////////////READ XMP METADATA//////////////////////////////////////////////
        const exifMetadata = getXmpMetadata(exif);

        let dpix =
            exif && exif.hasOwnProperty('XResolution')
                ? exif.XResolution.value
                : null;
        let dpiy =
            exif && exif.hasOwnProperty('YResolution')
                ? exif.YResolution.value
                : null;

        if (!dpix && !dpiy) dpix = dpiy = getJPEGPPI(file);

        const dimensions = await sizeOf(file);
        const width = dimensions.width;
        const height = dimensions.height;

        let title = exifMetadata.title;
        let creator = exifMetadata.creator;
        let rights = exifMetadata.rights;
        let description = exifMetadata.description;
        let subject = exifMetadata.subject;
        let type = exifMetadata.type;
        let format = exifMetadata.format;
        let exifDate = exifMetadata.exifDate;
        let exifPlace = exifMetadata.exifPlace;
        let catalogNumber = exifMetadata.catalogNumber;
        let reference = exifMetadata.reference;
        let family = exifMetadata.family;
        let genre = exifMetadata.genre;
        let sfName = exifMetadata.sfName;
        let fieldNumber = exifMetadata.fieldNumber;
        let contact = exifMetadata.contact;
        let contributor = exifMetadata.contributor;
        let publisher = exifMetadata.publisher;
        let identifier = exifMetadata.identifier;
        let source = exifMetadata.source;
        let language = exifMetadata.language;
        let relation = exifMetadata.relation;
        let orientation = exifMetadata.orientation;
        let model = exifMetadata.model;
        let make = exifMetadata.make;
        let yearCreated = exifMetadata.yearCreated;


        pictures_cache[sha1] = lodash.omitBy({
            file: file, // For now, we alse store the first encountered file for the current SHA1
            file_basename: path.basename(file),
            exifDate: exifDate,
            exifPlace: exifPlace,
            catalogNumber,
            reference,
            family,
            genre,
            sfName,
            fieldNumber,
            title,
            creator,
            contact,
            rights,
            identifier,
            subject,
            source,
            language,
            relation,
            contributor,
            publisher,
            description,
            type,
            format,
            orientation,
            yearCreated,
            model,
            make,
            height,
            width,
            sha1,
            dpix,
            dpiy,
            thumbnail: thumbnail_path,
            resourceType: RESOURCE_TYPE_PICTURE,
            erecolnatMetadata
        }, v => lodash.isUndefined(v) || lodash.isNull(v));
    }

    if (isJpeg === 'png') {

        const type = 'image';
        const format = 'png';
        const dimensions = await sizeOf(file);
        const width = dimensions.width;
        const height = dimensions.height;


        let dpix, dpiy;
        dpix = dpiy = null;

        pictures_cache[sha1] = lodash.omitBy({
            file: file, // For now, we alse store the first encountered file for the current SHA1
            file_basename: path.basename(file),
            thumbnail: thumbnail_path,
            height,
            width,
            sha1,
            dpix,
            dpiy,
            type,
            format,
            resourceType: RESOURCE_TYPE_PICTURE,
            erecolnatMetadata
        }, v => lodash.isUndefined(v) || lodash.isNull(v));
    }
    ee.emit(EVENT_PROCESS_IMAGE_COMPLETE, file);
    return true;
};

const makeVideoObjectFromFile = async (file, pictures_cache, videosInStore) => {

    ee.emit(EVENT_PROCESSING_IMAGE, file);
    // We always need to compute the picture file SHA1, since it unique ID for pictures.
    const sha1 = await getSHA1(file);

    // check if same SHA1 already exist
    if (videosInStore) {
        if (sha1 in videosInStore)
            return videosInStore[sha1];
    }

    const videoMetadata = await ffprobeClient(file);
    const supportedFormat = videoMetadata.format.format_name.match(SUPPORTED_VIDEO_FORMAT_REGEXP) !== null

    console.log(videoMetadata)

    ee.emit(EVENT_SEARCH_FOR_DUPLICATES);

    if (supportedFormat === false) {
        console.log('unsupported file type for file: ' + file);
        return false;
    }

    let width, height, aspectRatio = 1, dpix = 0, dpiy = 0, duration, fps;
    videoMetadata.streams.map(stream => {
        if (stream.codec_type === 'video') {
            width = stream.width;
            height = stream.height;
            aspectRatio = width / height;
            fps = eval(stream.r_frame_rate);
            duration = (+stream.duration).toFixed(1);
        }
    });

    /////////////////////////////////////////////// CREATE THUMBNAIL ///////////////////////////////////////////////
    // TODO 18.08.2020 18:41 mseslija: create 5 thumbnails
    const thumbnail_path = path.join(getThumbNailsDir(), `${sha1}_1.jpg`);

    const exists = await fs.pathExists(thumbnail_path);
    if (!exists) {
        const tg = new ThumbnailGenerator({
            logger: console.log,
            sourcePath: file,
            thumbnailPath: getThumbNailsDir(),
            tmpDir: getCacheDir() //only required if you can't write to /tmp/ and you need to generate gifs
        });

        const thImgs = await tg.generate({
            count: THUMBNAIL_COUNT,
            filename: `${sha1}.jpg`,
            size: `${Math.round(aspectRatio * 256)}x256`
        });
        console.log('Generated ', thImgs)
    }

    if (supportedFormat === true) {
        pictures_cache[sha1] = lodash.omitBy({
            file: file, // For now, we alse store the first encountered file for the current SHA1
            file_basename: path.basename(file),
            height,
            width,
            sha1,
            dpix,
            dpiy,
            duration,
            fps,
            thumbnail: thumbnail_path,
            resourceType: RESOURCE_TYPE_VIDEO
            // erecolnatMetadata
        }, v => lodash.isUndefined(v) || lodash.isNull(v));
    }

    ee.emit(EVENT_PROCESS_IMAGE_COMPLETE, file);
    return true;
};

//
// HELPERS
//

const sizeOf = filePath => {
    return new Promise((fulfill, reject) => {
        fs.readFile(filePath, (error, buffer) => {
            if (error) reject(error);
            else {
                const result = imagesize(buffer);
                fulfill(result);
            }
        });
    });
};

const getSHA1 = file =>
    new Promise( (resolve , reject ) => {
        try {
            const hash = crypto.createHash('sha1');
            let stream = fs.createReadStream(file);
            stream.on('data', chunk => hash.update(chunk));
            stream.on('error', err => reject(err));
            stream.on('end', () => resolve(hash.digest('hex')));
        }catch (e){
            reject(e)
        }
    });

const getJPEGPPI = file => {
    const ext = path.extname(file).toLowerCase();
    if (ext !== '.jpg' && ext !== '.jpeg') return null;

    const image = new ImageFile(new Uint8Array(fs.readFileSync(file)).buffer);

    return image.ppi;
};

export const validatePictureFormat = (file) => {
    return new Promise((resolve, reject) => {
        try {
            const buffer = readChunck.sync(file, 0, 4100);
            fileType.fromBuffer(buffer).then(type => {
                if (type.ext === 'png') {
                    resolve('png');
                }
                if (authorized_pictures_extensions_for_xmp.indexOf(`.${type.ext}`) !== -1) {
                    resolve(true);
                } else {
                    resolve(false);
                }
            });
        } catch (e) {
            console.error(e);
            resolve(false);
        }
    })
};

export const getProjectVersion = () => {
    try {
        const project = JSON.parse(fs.readFileSync(getProjectInfoFile()));
        return project.version;
    }catch (e){
        console.log('can not read project version from project info file...');
        console.log(e);
        return undefined;
    }
}

export const createAutomaticTags = () => {
    return  {
        id: chance.guid(),
        name: TAG_AUTO,
        type: TYPE_CATEGORY,
        showChildren: false,
        children: []
    }
}

export const createCommonTags = () => {
    return {
        id: chance.guid(),
        name: COMMON_TAGS,
        type: TYPE_CATEGORY,
        showChildren: false,
        children: []
    }
}

export const updateProjectInfoVersion = (version) => {
    const projectInfoFile = getProjectInfoFile();
    if (fs.existsSync(projectInfoFile)) {
        let readProject = fs.readFileSync(projectInfoFile);
        let project = JSON.parse(readProject);
        project.version = version;
        fs.writeFileSync(projectInfoFile, JSON.stringify(project));
    } else {
        console.log('Project info doesn\'t exist');
    }
};

export const updateProjectInfo = (images) => {
    const projectInfoFile = getProjectInfoFile();
    if (fs.existsSync(projectInfoFile)) {

        let readProject = fs.readFileSync(projectInfoFile);
        let project = JSON.parse(readProject);
        console.log(project);

        project.folders = getAllDirectoriesNameFlatten().length;
        project.images = images;

        fs.writeFileSync(projectInfoFile, JSON.stringify(project));
    } else {
        console.log('Project info doesn\'t exist');
    }
};

export const readExif = async file => exif.read(file);

export const readExifMetadata = async file => {
    return new Promise(resolve => {
        const exifErrors = ExifReader.errors;

        fs.readFile((file), function (error, data) {
            if (error) {
                console.error('Error reading file.');
                process.exit(1);
            }
            try {
                const tags = ExifReader.load(data.buffer);
                delete tags['MakerNote'];
                // listTags(tags);
                resolve(tags);
            } catch (error) {
                if (error instanceof exifErrors.MetadataMissingError) {
                    console.log('No Exif data found');
                }
                console.error(error);
                process.exit(1);
            }
        });
    });
};

export const formatXmpDate = (date) => {
    const _ = date.substring(0, date.indexOf(' ')).split(':');
    return _[2] + '/' + _[1] + '/' + _[0];
};


