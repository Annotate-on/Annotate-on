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
    getAllDirectoriesNameFlatten, getAppHomePath,
    getCacheDir,
    getProjectInfoFile,
    getThumbNailsDir,
    getUserWorkspace
} from './config';
import {
    COMMON_TAGS,
    IMAGE_STORAGE_DIR, RESOURCE_TYPE_OBJECT3D,
    RESOURCE_TYPE_PICTURE,
    RESOURCE_TYPE_VIDEO, SUPPORTED_OBJECTS3D_FORMAT_REGEXP,
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
import * as sharp from "sharp";

export const PATH_TO_EVENT_THUMBNAIL = './components/pictures/event/event-logo.png';
export const AUTHORIZED_PICTURES_EXTENSIONS = ['.jpg', '.jpeg', '.png'];
export const AUTHORIZED_VIDEOS_EXTENSIONS = ['.mp4', '.mov', '.3gp', '.mkv', '.ogv', '.webm'];

export const AUTHORIZED_OBJECT3D_EXTENSIONS = ['glb','gltf'];
export const ee = new EventEmitter();
export const EVENT_DIRECTORIES_ANALYSES_COMPLETE = 'EVENT_DIRECTORIES_ANALYSES_COMPLETE';
export const EVENT_PROCESS_IMAGE_COMPLETE = 'EVENT_PROCESS_IMAGE_COMPLETE';
export const EVENT_PROCESS_IMAGE_ROTATION_COMPLETE = 'EVENT_PROCESS_IMAGE_ROTATION_COMPLETE';
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
export const EVENT_SELECT_SELECTION_TAB = 'EVENT_SELECT_SELECTION_TAB';
export const EVENT_FORCE_UPDATE_EDIT_MODE = 'EVENT_FORCE_UPDATE_EDIT_MODE';
export const EVENT_UPDATE_EVENT_IN_EVENT_FORM = 'EVENT_UPDATE_EVENT_IN_EVENT_FORM';
export const EVENT_DISHONOR_ANNOTATION = 'EVENT_DISHONOR_ANNOTATION';
export const EVENT_UNFOCUS_ANNOTATION = 'EVENT_UNFOCUS_ANNOTATION';
export const SHOW_EDIT_MODE_VIOLATION_MODAL = 'SHOW_EDIT_MODE_VIOLATION_MODAL';
export const STOP_ANNOTATION_RECORDING = 'STOP_ANNOTATION_RECORDING';
export const EVENT_SELECTED_TAB_NAME = 'EVENT_SELECTED_TAB_NAME';
export const EVENT_CREATE_IMAGE_DETECT_ANNOTATION = 'EVENT_CREATE_IMAGE_DETECT_ANNOTATION';
export const EVENT_CREATE_PREDICT_CLASS_ANNOTATION = 'EVENT_CREATE_PREDICT_CLASS_ANNOTATION';
export const EVENT_XPER_MATCH_RESOURCE = 'EVENT_XPER_MATCH_RESOURCE';
export const EVENT_XPER_SUMMARIZATION_RESPONSE = 'EVENT_XPER_SUMMARIZATION_RESPONSE';

const AUTHORIZED_PICTURES_EXTENSIONS_FOR_XMP = ['.jpg', '.jpeg'];

process.env.FFMPEG_PATH = ffmpeg.path.replace('app.asar', 'app.asar.unpacked');
process.env.FFPROBE_PATH = ffprobe.path.replace('app.asar', 'app.asar.unpacked');

//
// LIBRARY
//
export const initPicturesLibrary = async (files, folders, picturesInStore, applyExifMetadataForRotation) => {
    let pictures = {};
    const duplicates = [];
    let addedPicturesCount = 0;

    ee.emit(EVENT_DIRECTORIES_ANALYSES_COMPLETE, {files: files.length, folders});
    for (const f of files) {
        try {
            const result = await makePictureObjectFromFile(f, pictures, picturesInStore, applyExifMetadataForRotation);
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

export const initObjects3DLibrary = async (files, folders, resourcesInStore) => {
    let pictures = {};
    const duplicates = [];
    let addedPicturesCount = 0;

    ee.emit(EVENT_DIRECTORIES_ANALYSES_COMPLETE, {files: files.length, folders});
    for (const f of files) {
        try {
            const result = await makeObjects3DObjectFromFile(f, pictures, resourcesInStore);
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

const makePictureObjectFromFile = async (file, pictures_cache, picturesInStore, applyExifMetadataForRotation) => {

    ee.emit(EVENT_PROCESSING_IMAGE, file);

    const pictureFormat = await getPictureFormat(file);
    console.log('file format: ' + pictureFormat);
    console.log('apply rotation: ' + applyExifMetadataForRotation);

    if (pictureFormat === undefined) {
        console.log('unsupported file type for file: ' + file);
        return false;
    }

    let exif;

    // try to rotate picture from exif metadata, only for jpg/jpeg format..
    if(applyExifMetadataForRotation && isJPG(pictureFormat)) {
        exif = await readExifMetadata(file);
        // console.log("exif before rotations", exif);
        let homeDir = getAppHomePath();
        let base = path.parse(file).base;
        if(exif && exif.hasOwnProperty('Orientation') && exif.Orientation.value > 1) {
            const tempFilename = path.join(homeDir, base);
            // console.log('rotated image file name', tempFilename);
            await sharp(file)
                .withMetadata()
                .rotate()
                .toFile(tempFilename);
            fs.copySync(tempFilename, file)
            fs.unlinkSync(tempFilename);
            exif = await readExifMetadata(file);
            ee.emit(EVENT_PROCESS_IMAGE_ROTATION_COMPLETE, file);
            // console.log('exif after rotations', exif);
        }
    }

    // We always need to compute the picture file SHA1, since it unique ID for pictures.
    const sha1 = await getSHA1(file);

    // check if same SHA1 already exist
    if (picturesInStore) {
        if (sha1 in picturesInStore)
            return picturesInStore[sha1];
    }
    ee.emit(EVENT_SEARCH_FOR_DUPLICATES);

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

    if (isJPG(pictureFormat)) {

        if(!exif) {
            exif = await readExifMetadata(file);
        }

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

    if (isPNG(pictureFormat)) {
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

const makeObjects3DObjectFromFile = async (file, pictures_cache, objects3DInStore) => {

    ee.emit(EVENT_PROCESSING_IMAGE, file);
    // We always need to compute the picture file SHA1, since it unique ID for pictures.
    const sha1 = await getSHA1(file);

    // check if same SHA1 already exist
    if (objects3DInStore) {
        if (sha1 in objects3DInStore)
            return objects3DInStore[sha1];
    }

    const supportedFormat = true;

    const thumbnail_default = path.join(getThumbNailsDir(), `3d-thumb.png`);
    const exists = await fs.pathExists(thumbnail_default);
    if (!exists) {
        try {
            const source = path.join(__dirname, 'components/pictures/3d-thumb.png');
            if (await fs.pathExists(source)) {
                await fs.copy(source, thumbnail_default);
            } else {
                const base64Data = `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`.replace(/\s+/g, ''); // clean spaces/newlines if any
                const buffer = Buffer.from(base64Data, 'base64');
                await fs.outputFile(thumbnail_default, buffer);
            }
        } catch (err) {
            console.error('❌ Failed to create thumbnail:', err);
        }
    }
    if (supportedFormat === true) {
        pictures_cache[sha1] = lodash.omitBy({
            file: file, // For now, we alse store the first encountered file for the current SHA1
            file_basename: path.basename(file),
            sha1,
            thumbnail: thumbnail_default,
            resourceType: RESOURCE_TYPE_OBJECT3D
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
                if (AUTHORIZED_PICTURES_EXTENSIONS_FOR_XMP.indexOf(`.${type.ext}`) !== -1) {
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

export const getPictureFormat = (file) => {
    return new Promise((resolve, reject) => {
        try {
            const buffer = readChunck.sync(file, 0, 4100);
            fileType.fromBuffer(buffer).then(type => {
                if (AUTHORIZED_PICTURES_EXTENSIONS.indexOf(`.${type.ext.toLowerCase()}`) !== -1) {
                    resolve(type.ext.toLowerCase());
                } else {
                    resolve(undefined);
                }
            });
        } catch (e) {
            console.error(e);
            resolve(undefined);
        }
    })
};

export const isJPG = (fileFormat) => {
    if(!fileFormat) return false;
    return fileFormat.toLowerCase() === 'jpg' || fileFormat.toLowerCase() === 'jpeg';
}

export const isPNG = (fileFormat) => {
    if(!fileFormat) return false;
    return fileFormat.toLowerCase() === 'png';
}

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


