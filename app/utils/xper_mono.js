import i18next from "i18next";
import {ee, EVENT_HIDE_WAITING, EVENT_SHOW_WAITING} from "./library";
import request from "request";
import {remote} from "electron";
import {getXperMonoParams} from "./config";

export const searchKb = (filter, callback) => {
    if(!checkXperMonoSettings()) return;
    const {t} = i18next;
    let url = getUrl(`/api/knowledge-bases/search?q=${filter.q}${filter.lang ? '&lang='+ filter.lang : ''}` +
        `${filter.taxonomy ? '&taxonomy='+ filter.taxonomy : ''}` +
        `${filter.stratigraphy ? '&stratigraphy='+ filter.stratigraphy : ''}` +
        `${filter.geography ? '&geography='+ filter.geography : ''}` +
        `${filter.keyword ? '&keyword='+ filter.keyword : ''}` +
        `${filter.habitat ? '&habitat='+ filter.habitat : ''}` +
        `${filter.item ? '&item='+ filter.item : ''}` +
        `${filter.item_group ? '&item_group='+ filter.item_group : ''}` +
        `${filter.descriptor ? '&descriptor='+ filter.descriptor : ''}` +
        `${filter.descriptor_group ? '&descriptor_group='+ filter.descriptor_group : ''}` +
        `${filter.state ? '&state='+ filter.state : ''}`);
    console.log("url ", url);
    ee.emit(EVENT_SHOW_WAITING);
    request({
            url : url,
            timeout: 10000
        },
        function (error, response, body){
            console.log("error ", error);
            console.log("response ", response);
            console.log("body ", body);
            ee.emit(EVENT_HIDE_WAITING);
            if(error || !response || response.statusCode !== 200) {
                callback(null);
                let options = {
                    type: "error",
                    title: t('global.error'),
                    buttons: ["OK"],
                    message: getErrorMessage(error, response, body)
            }
                remote.dialog.showMessageBox(remote.getCurrentWindow(), options);
                console.error(getErrorMessage(error, response, body), body);
            } else {
                try {
                    let found = []
                    let result = JSON.parse(body);
                    if(result) {
                        for (const resultElement of result) {
                            let kb = {}
                            kb.id = resultElement.id;
                            kb.name = resultElement.name;
                            kb.authors = resultElement.authors;
                            kb.detail = resultElement.detail;
                            kb.logoUrl = resultElement.logoUrl;
                            found.push(kb);
                        }
                    }
                    console.log("found ", found);
                    callback(found);
                } catch (e) {
                    callback(null);
                    console.error(e);
                    let options = {
                        type: "error",
                        title: t('global.error'),
                        buttons: ["OK"],
                        message: t('global.alert_bad_xper_3_response') + '\n' + t('global.alert_please_check_your_xper_mono_parameters')
                    }
                    remote.dialog.showMessageBox(remote.getCurrentWindow(), options);
                }
            }
        }
    );
}

export const searchItemsInKb = (filter, callback) => {
    console.log("searchItemsInKb ", filter);
    if(!checkXperMonoSettings()) return;
    const {t} = i18next;
    let url = getUrl(`/api/knowledge-bases/${filter.kb}/items/search?lang=${filter.lang}`);
    ee.emit(EVENT_SHOW_WAITING);
    request({
            url : url,
            timeout: 10000
        },
        function (error, response, body){
            console.log("error ", error);
            console.log("response ", response);
            console.log("body ", body);
            ee.emit(EVENT_HIDE_WAITING);
            if(error || !response || response.statusCode !== 200) {
                callback(null);
                let options = {
                    type: "error",
                    title: t('global.error'),
                    buttons: ["OK"],
                    message: getErrorMessage(error, response, body)
            }
                remote.dialog.showMessageBox(remote.getCurrentWindow(), options);
                console.error(getErrorMessage(error, response, body), body);
            } else {
                try {
                    let found = []
                    let result = JSON.parse(body);
                    if(result) {
                        for (const resultElement of result) {
                            let item = {}
                            item.id = resultElement.id;
                            item.name = resultElement.name;
                            item.alternativeName = resultElement.alternativeName;
                            found.push(item);
                        }
                    }
                    callback(found);
                } catch (e) {
                    callback(null);
                    console.error(e);
                    let options = {
                        type: "error",
                        title: t('global.error'),
                        buttons: ["OK"],
                        message: t('global.alert_bad_xper_3_response') + '\n' + t('global.alert_please_check_your_xper_mono_parameters')
                    }
                    remote.dialog.showMessageBox(remote.getCurrentWindow(), options);
                }
            }
        }
    );
}

export const getKnowledgeBasesDetails = (filter, callback) => {
    console.log("getKnowledgeBasesDetails ", filter);
    if(!checkXperMonoSettings()) return;
    const {t} = i18next;
    let url = getUrl(`/api/knowledge-bases/${filter.kb}?lang=${filter.lang}`);
    ee.emit(EVENT_SHOW_WAITING);
    request({
            url : url,
            timeout: 10000
        },
        function (error, response, body){
            console.log("error ", error);
            console.log("response ", response);
            console.log("body ", body);
            ee.emit(EVENT_HIDE_WAITING);
            if(error || !response || response.statusCode !== 200) {
                callback(null);
                let options = {
                    type: "error",
                    title: t('global.error'),
                    buttons: ["OK"],
                    message: getErrorMessage(error, response, body)
                }
                remote.dialog.showMessageBox(remote.getCurrentWindow(), options);
                console.error(getErrorMessage(error, response, body), body);
            } else {
                try {
                    let result = JSON.parse(body);
                    console.log("result ", result);
                    callback(result);
                } catch (e) {
                    callback(null);
                    console.error(e);
                    let options = {
                        type: "error",
                        title: t('global.error'),
                        buttons: ["OK"],
                        message: t('global.alert_bad_xper_3_response') + '\n' + t('global.alert_please_check_your_xper_mono_parameters')
                    }
                    remote.dialog.showMessageBox(remote.getCurrentWindow(), options);
                }
            }
        }
    );
}

export const getDescriptorsForItem = (filter, callback) => {
    console.log("getDescriptorsForItem ", filter);
    if(!checkXperMonoSettings()) return;
    const {t} = i18next;
    let url = getUrl(`/api/items/${filter.item}/descriptors?lang=${filter.lang}`);
    ee.emit(EVENT_SHOW_WAITING);
    request({
            url : url,
            timeout: 10000
        },
        function (error, response, body){
            console.log("error ", error);
            console.log("response ", response);
            console.log("body ", body);
            ee.emit(EVENT_HIDE_WAITING);
            if(error || !response || response.statusCode !== 200) {
                callback(null);
                let options = {
                    type: "error",
                    title: t('global.error'),
                    buttons: ["OK"],
                    message:  getErrorMessage(error, response, body)
                }
                remote.dialog.showMessageBox(remote.getCurrentWindow(), options);
                console.error(getErrorMessage(error, response, body), body);
            } else {
                try {
                    let result = JSON.parse(body);
                    console.log("result ", result);
                    callback(result);
                } catch (e) {
                    callback(null);
                    console.error(e);
                    let options = {
                        type: "error",
                        title: t('global.error'),
                        buttons: ["OK"],
                        message: t('global.alert_bad_xper_3_response') + '\n' + t('global.alert_please_check_your_xper_mono_parameters')
                    }
                    remote.dialog.showMessageBox(remote.getCurrentWindow(), options);
                }
            }
        }
    );
}

const checkXperMonoSettings = () => {
    const {t} = i18next;
    let xperMonoParams = getXperMonoParams();
    const hasParams = xperMonoParams && xperMonoParams.url;
    if(!hasParams) {
        let options = {
            type: "error",
            title: t('global.error'),
            buttons: ["OK"],
            message: t('global.options.alert_all_xper_monobase_parameters_required')
        }
        remote.dialog.showMessageBox(remote.getCurrentWindow(), options);
        return false;
    }
    return true;
}

const getUrl = (path) => {
    return `${getXperMonoParams().url}${path}`;
}

export const getErrorMessage = (error, response, body) => {
    const {t} = i18next;
    const xperParamsCheckMessage = !response || response.statusCode === 404 || response.statusCode === 401 ? t('global.alert_please_check_your_xper_mono_parameters') : "";
    if(error) return `${error}. ${xperParamsCheckMessage}`;
    if(response) return `${response.statusMessage}. ${xperParamsCheckMessage}`;
    return t('global.alert_an_error_occurred_in_communication_with_xper_server')
}