import i18next from "i18next";
import {ee, EVENT_HIDE_WAITING, EVENT_SHOW_WAITING, EVENT_XPER_SUMMARIZATION_RESPONSE} from "./library";
import request from "request";
import {remote} from "electron";
import {getXperMonoParams} from "./config";
import fs from "fs";
import {split} from "lodash";

export const searchKb = (filter, callback) => {
    if (!checkXperMonoSettings()) return;
    const {t} = i18next;
    let url = getUrl(`/api/knowledge-bases/search?q=${filter.q}${filter.lang ? '&lang=' + filter.lang : ''}` +
        `${filter.taxonomy ? '&taxonomy=' + filter.taxonomy : ''}` +
        `${filter.stratigraphy ? '&stratigraphy=' + filter.stratigraphy : ''}` +
        `${filter.geography ? '&geography=' + filter.geography : ''}` +
        `${filter.keyword ? '&keyword=' + filter.keyword : ''}` +
        `${filter.habitat ? '&habitat=' + filter.habitat : ''}` +
        `${filter.item ? '&item=' + filter.item : ''}` +
        `${filter.item_group ? '&item_group=' + filter.item_group : ''}` +
        `${filter.descriptor ? '&descriptor=' + filter.descriptor : ''}` +
        `${filter.descriptor_group ? '&descriptor_group=' + filter.descriptor_group : ''}` +
        `${filter.state ? '&state=' + filter.state : ''}`);
    ee.emit(EVENT_SHOW_WAITING);
    request({
            url: url,
            timeout: 10000
        },
        function (error, response, body) {
            ee.emit(EVENT_HIDE_WAITING);
            if (error || !response || response.statusCode !== 200) {
                callback(null);
                remote.dialog.showErrorBox(t('global.error'), getErrorMessage(error, response, body));
                console.error(getErrorMessage(error, response, body), body);
            } else {
                try {
                    let found = []
                    let result = JSON.parse(body);
                    if (result) {
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
                    callback(found);
                } catch (e) {
                    callback(null);
                    console.error(e);
                    remote.dialog.showErrorBox(t('global.error'), `${t('global.alert_bad_xper_3_response')} ${t('global.alert_please_check_your_xper_mono_parameters')}`);
                }
            }
        }
    );
}

export const searchItemsInKb = (filter, callback) => {
    console.log("searchItemsInKb ", filter);
    if (!checkXperMonoSettings()) return;
    const {t} = i18next;
    let url = getUrl(`/api/knowledge-bases/${filter.kb}/items/search?lang=${filter.lang}`);
    ee.emit(EVENT_SHOW_WAITING);
    request({
            url: url,
            timeout: 10000
        },
        function (error, response, body) {
            ee.emit(EVENT_HIDE_WAITING);
            if (error || !response || response.statusCode !== 200) {
                callback(null);
                remote.dialog.showErrorBox(t('global.error'), getErrorMessage(error, response, body));
                console.error(getErrorMessage(error, response, body), body);
            } else {
                try {
                    let found = []
                    let result = JSON.parse(body);
                    if (result) {
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
                    remote.dialog.showErrorBox(t('global.error'), `${t('global.alert_bad_xper_3_response')} ${t('global.alert_please_check_your_xper_mono_parameters')}`);
                }
            }
        }
    );
}

export const getKnowledgeBasesDetails = (filter, callback) => {
    console.log("getKnowledgeBasesDetails ", filter);
    if (!checkXperMonoSettings()) return;
    const {t} = i18next;
    let url = getUrl(`/api/knowledge-bases/${filter.kb}?lang=${filter.lang}`);
    ee.emit(EVENT_SHOW_WAITING);
    request({
            url: url,
            timeout: 10000
        },
        function (error, response, body) {
            ee.emit(EVENT_HIDE_WAITING);
            if (error || !response || response.statusCode !== 200) {
                callback(null);
                remote.dialog.showErrorBox(t('global.error'), getErrorMessage(error, response, body));
                console.error(getErrorMessage(error, response, body), body);
            } else {
                try {
                    let result = JSON.parse(body);
                    console.log("result ", result);
                    callback(result);
                } catch (e) {
                    callback(null);
                    console.error(e);
                    remote.dialog.showErrorBox(t('global.error'), `${t('global.alert_bad_xper_3_response')} ${t('global.alert_please_check_your_xper_mono_parameters')}`);
                }
            }
        }
    );
}

export const getDescriptorsForItem = (filter, callback) => {
    console.log("getDescriptorsForItem ", filter);
    if (!checkXperMonoSettings()) return;
    const {t} = i18next;
    let url = getUrl(`/api/items/${filter.item}/descriptors?lang=${filter.lang}`);
    ee.emit(EVENT_SHOW_WAITING);
    request({
            url: url,
            timeout: 10000
        },
        function (error, response, body) {
            ee.emit(EVENT_HIDE_WAITING);
            if (error || !response || response.statusCode !== 200) {
                callback(null);
                remote.dialog.showErrorBox(t('global.error'), getErrorMessage(error, response, body));
                console.error(getErrorMessage(error, response, body), body);
            } else {
                try {
                    let result = JSON.parse(body);
                    console.log("result ", result);
                    callback(result);
                } catch (e) {
                    callback(null);
                    console.error(e);
                    remote.dialog.showErrorBox(t('global.error'), `${t('global.alert_bad_xper_3_response')} ${t('global.alert_please_check_your_xper_mono_parameters')}`);
                }
            }
        }
    );
}

export const getDescriptorsForItems = (filter, callback) => {
    console.log("getDescriptorsForItems ", filter);
    if (!checkXperMonoSettings()) return;
    const {t} = i18next;
    let url = getUrl(`/api/items/descriptors?lang=${filter.lang}&ids=${filter.items.join(',')}`);
    ee.emit(EVENT_SHOW_WAITING);
    request({
            url: url,
            timeout: 10000
        },
        function (error, response, body) {
            ee.emit(EVENT_HIDE_WAITING);
            if (error || !response || response.statusCode !== 200) {
                callback(null);
                remote.dialog.showErrorBox(t('global.error'), getErrorMessage(error, response, body));
                console.error(getErrorMessage(error, response, body), body);
            } else {
                try {
                    let result = JSON.parse(body);
                    console.log("result ", result);
                    callback(result);
                } catch (e) {
                    callback(null);
                    console.error(e);
                    remote.dialog.showErrorBox(t('global.error'), `${t('global.alert_bad_xper_3_response')} ${t('global.alert_please_check_your_xper_mono_parameters')}`);
                }
            }
        }
    );
}

export const summarizeItem = async (filter, callback) => {
    console.log("summarizeItem ", filter);
    if (!checkXperMonoSettings()) return;
    const {t} = i18next;
    let url = getUrl(`/api/summarization/item`);
    const requestData = {
        requestId: filter.requestId,
        lang: filter.lang,
        data: describeItem(filter.xperData)
    };
    console.log("requestData ", requestData);

    // Fetch streaming data from the server
    try {
        const response = await fetchStreamWithRetry(url, 3,  requestData);
        const reader = response.body.getReader();
        await processStream(reader);
    } catch (error) {
        console.error('Error fetching chatbot response:', error);
    }

    // request({
    //         url: url,
    //         headers: {
    //             'Content-Type': 'application/json'
    //         },
    //         body: JSON.stringify(requestData),
    //         timeout: 10000
    //     },
    //     async function (error, response, body) {
    //         console.log("summarizeItem ", body);
    //         console.log("summarizeItem response", response);
    //         const reader = body.getReader();
    //         await processStream(reader);
    //         ee.emit(EVENT_HIDE_WAITING);
    //         if(error || !response || response.statusCode !== 200) {
    //             callback(null);
    //             remote.dialog.showErrorBox(t('global.error'), getErrorMessage(error, response, body));
    //             console.error(getErrorMessage(error, response, body), body);
    //         } else {
    //             try {
    //                 ee.emit(EVENT_XPER_SUMMARIZATION_RESPONSE, split(body, ':')[1]);
    //                 callback(body);
    //             } catch (e) {
    //                 callback(null);
    //                 console.error(e);
    //                 remote.dialog.showErrorBox(t('global.error'), `${t('global.alert_bad_xper_3_response')} ${t('global.alert_please_check_your_xper_mono_parameters')}`);
    //             }
    //         }
    //     }
    // );
}

async function fetchStreamWithRetry(url, retries = 3, data  = {}) {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url,
                {
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    method: "POST",
                    body: JSON.stringify(data)
                });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return response;
        } catch (e) {
            console.error(`Attempt ${i + 1} failed: ${e.message}`);
            if (i === retries - 1) throw e;
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retrying
        }
    }
}

async function processStream(reader) {
    const decoder = new TextDecoder("utf-8");
    try {
        while (true) {
            const {done, value} = await reader.read();
            if (done) break;
            console.log('Stream value before:', value);
            const decodedValue = decoder.decode(value, { stream: true });
            console.log('Stream value:', decodedValue);
            if(decodedValue) {
                        ee.emit(EVENT_XPER_SUMMARIZATION_RESPONSE, decodedValue);
            }
            // if(decodedValue) {
            //     const data = split(decodedValue, 'data:');
            //     if(data && data.length > 1) {
            //         console.log('Stream value:', data);
            //         if(data[1] !== 'null' && data[1] !== 'undefined') {
            //             ee.emit(EVENT_XPER_SUMMARIZATION_RESPONSE, data[1]);
            //         }
            //     }
            // }
        }
    } catch (error) {
        console.error('Error processing stream:', error);
    }
}

export const describeItem = (xperData) => {
    let value = '';
    if (!xperData) return value;

    if (xperData.kb_name) {
        value += 'KB: ' + xperData.kb_name + '(' + xperData.kb_id + ', ' + xperData.kb_language + ')' + '\n';
    }
    if (xperData.items) {
        for (const item of xperData.items) {
            if (item.name) {
                value += 'Item: ' + item.name + '\n';
            }
            if (item.detail) {
                value += 'Item details: ' + item.detail + '\n';
            }
            if (item.descriptors) {
                value += 'Descriptors:';
                for (const descriptor of item.descriptors) {
                    value += '\n#' + descriptor.name + ':';
                    if (descriptor.type === 'QuantitativeDescriptor') {
                        if (descriptor.measurementUnit !== "undefined") {
                            value += "\n- unit: " + descriptor.measurementUnit;
                        }
                        if (descriptor.values.min !== "undefined") {
                            value += "\n- min: " + descriptor.values.min;
                        }
                        if (descriptor.values.max !== "undefined") {
                            value += "\n- max: " + descriptor.values.max;
                        }
                        if (descriptor.values.minInclude !== "undefined") {
                            value += "\n- min_include: " + descriptor.values.minInclude;
                        }
                        if (descriptor.values.maxInclude !== "undefined") {
                            value += "\n- max_include :" + descriptor.values.maxInclude;
                        }
                    } else {
                        for (const state of descriptor.states) {
                            value += '\n -' + state.name;
                        }
                    }
                }
            }
        }
    }

    return value;
}

const checkXperMonoSettings = () => {
    const {t} = i18next;
    let xperMonoParams = getXperMonoParams();
    const hasParams = xperMonoParams && xperMonoParams.url;
    if (!hasParams) {
        remote.dialog.showErrorBox(t('global.error'), t('global.options.alert_all_xper_monobase_parameters_required'));
        return false;
    }
    return true;
}

export const getUrl = (path) => {
    return `${getXperMonoParams().url}${path}`;
}

export const getErrorMessage = (error, response, body) => {
    const {t} = i18next;
    const xperParamsCheckMessage = !response || response.statusCode === 404 || response.statusCode === 401 ? t('global.alert_please_check_your_xper_mono_parameters') : "";
    if (error) return `${error}. ${xperParamsCheckMessage}`;
    if (response) return `${response.statusMessage}. ${xperParamsCheckMessage}`;
    return t('global.alert_an_error_occurred_in_communication_with_xper_server')
}