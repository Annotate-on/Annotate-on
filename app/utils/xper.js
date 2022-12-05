import i18next from "i18next";
import {getXperParams} from "./config";
import {remote} from "electron";
import request from "request";
import path from "path";
import {APP_NAME} from "../constants/constants";
import fs from "fs";
import {genId} from "../components/event/utils";
import {convertJsonToSDD, convertSDDtoJson} from "./sdd-processor";


export const getXperDatabases = (callback) => {
    if(!checkXperSettings()) return;
    const {t} = i18next;
    let auth = getAuthentication();
    let url = getUrl('/list_bases_for_user');
    request({
            url : url,
            headers : {
                "Authorization" : auth
            }},
        function (error, response, body) {
            console.log("error ", error);
            console.log("response ", response);
            console.log("body ", body);

            if(response.statusCode !== 200) {
                remote.dialog.showErrorBox(t('global.error'), response.statusMessage);
            } else {
                let result = JSON.parse(body);
                let found = []
                if(result) {
                    for (const resultElement of result) {
                        let database = {}
                        database.name = resultElement.datasetName;
                        database.kbName = resultElement.kbName;
                        if(resultElement["0"] && resultElement["0"].length > 0) {
                            let owners = [];
                            for (const ownerItem of resultElement["0"]) {
                                owners.push(ownerItem[0]);
                            }
                            database.owners = owners.join(', ');
                        }
                        if(resultElement["1"] && resultElement["1"].length > 0) {
                            let editors = [];
                            for (const editorItem of resultElement["1"]) {
                                editors.push(editorItem[0]);
                            }
                            database.editors = editors.join(', ');
                        }
                        if(resultElement["2"] && resultElement["2"].length > 0) {
                            let viewers = [];
                            for (const viewerItem of resultElement["2"]) {
                                viewers.push(viewerItem[0]);
                            }
                            database.viewers = viewers.join(', ');
                        }
                        found.push(database);
                    }
                    console.log("found ", found);
                }
                callback(found);
            }
        }
    );
}

export const getSddForDatabase = (database, callback) => {
    const {t} = i18next;
    if(!checkXperSettings()) return;
    let auth = getAuthentication();
    let url = getUrl(`/sdd_export?validateSdd=false&isxperience=true&exportCalculatedDescriptors=false&sddForXper2=false&kbName=${database}`);
    request({
            url: url,
            headers: {
                "Authorization" : auth
            }},
        function (error, response, body) {
            console.log("error ", error);
            console.log("response ", response);
            console.log("body ", body);
            if(response.statusCode !== 200) {
                remote.dialog.showErrorBox(t('global.error'), response.statusMessage);
            } else {
                const filepath = getTempFilePath(genId() + ".xml");
                request(body)
                    .on('end', () => {
                        setTimeout(() => {
                            const sddObject = convertSDDtoJson(filepath);
                            callback(filepath, sddObject);
                        }, 100);
                    }).pipe(fs.createWriteStream(filepath));
            }
        }
    );
}

export const exportSddToDatabase = (sourceSdd, taxonomyInstance, selectedTaxonomy, pictures, database, callback) => {
    console.log("exportSddToDatabase", database);
    const {t} = i18next;
    const filepath = getTempFilePath(genId() + ".sdd.xml");
    convertJsonToSDD(sourceSdd, filepath, taxonomyInstance, selectedTaxonomy, pictures);
    if (fs.existsSync(filepath)) {
        console.log("created file ", filepath)
        if(!checkXperSettings()) return;
        let auth = getAuthentication();
        let url = getUrl(`/sdd_upload`);
        const formData = {
            kbName: database,
            ssdFile: fs.createReadStream(filepath),
        };
        request({
                method: 'POST',
                url: url,
                headers: {
                    "Authorization": auth
                },
                formData: formData
            },
            function (error, response, body) {
                console.log("error ", error);
                console.log("response ", response);
                if (response.statusCode !== 200) {
                    remote.dialog.showErrorBox(t('global.error'), response.statusMessage);
                } else {
                    callback(body);
                    setTimeout(() => {
                        console.log("deleting temporary sdd file", filepath);
                        fs.unlinkSync(filepath);
                    }, 100);
                }
            }
        )
    } else {
        console.log("file is not created", filepath)
    }
}

const getTempFilePath = (filename) => {
    const app_home_path = path.join(remote.app.getPath('home'), APP_NAME);
    if (!fs.existsSync(app_home_path)){
        fs.mkdirSync(app_home_path);
    }
    const filepath = path.join(app_home_path, filename);
    return filepath;
}

const checkXperSettings = () => {
    const {t} = i18next;
    let xperParams = getXperParams();
    const hasParams = xperParams && xperParams.url && xperParams.email && xperParams.password;
    if(!hasParams) {
        remote.dialog.showErrorBox(t('global.error'), t('global.xper_params_are_required'));
        return false;
    }
    return true;
}

const getAuthentication = () => {
    const {t} = i18next;
    let xperParams = getXperParams();
    const hasParams = xperParams && xperParams.url && xperParams.email && xperParams.password;
    if(!hasParams) {
        remote.dialog.showErrorBox(t('global.error'), t('global.xper_params_are_required'));
        return null;
    }
    let username = xperParams.email;
    let password = xperParams.password;
    let auth = 'Basic ' + btoa(username + ":" + password);
    return auth;
}

const getUrl = (path) => {
    return `${getXperParams().url}${path}`;
}


