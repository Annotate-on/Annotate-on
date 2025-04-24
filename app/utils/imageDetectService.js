import request from "request";
import i18next from "i18next";
import {ee, EVENT_HIDE_WAITING, EVENT_SHOW_WAITING} from "./library";
import {remote} from "electron";
const getErrorMessage = (error, response, body) => {
    const {t} = i18next;
    const imageDetectParamsCheckMessage = !response || response.statusCode === 404 || response.statusCode === 401 ? t('annotate.editor.alert_bad_image_detect_response') : "";
    if(error) return `${error}. ${imageDetectParamsCheckMessage}`;
    if(response) return `${response.statusMessage}. ${imageDetectParamsCheckMessage}`;
    return t('annotate.editor.alert_bad_image_detect_response')
}

export const getImageDetectAnnotations = (service_url, param, callback) => {
    const { t } = i18next;
    let url = service_url + '?url=' + param;
    ee.emit(EVENT_SHOW_WAITING);

    request(
        {
            url: url,
            timeout: 10000,
        },
        function (error, response, body) {
            ee.emit(EVENT_HIDE_WAITING);
            if (error) {
                console.error(error);
                callback(null);
                remote.dialog.showErrorBox(t('global.error'), getErrorMessage(error));
            } else if (!response || response.statusCode !== 200) {
                console.error(getErrorMessage(null, response, body), body);
                remote.dialog.showErrorBox(t('global.error'), getErrorMessage(null, response, body));
                callback(null);
                // remote.dialog.showErrorBox(t('global.error'), getErrorMessage(null, response, body));
            } else {
                try {
                    let result = JSON.parse(body);
                    console.log("result ", result);
                    callback(result);
                } catch (e) {
                    console.error(e);
                    callback(null);
                    remote.dialog.showErrorBox(
                        t('global.error'),
                        `${t('annotate.editor.alert_bad_image_detect_response')}`
                    );
                }
            }
        }
    );
};
export const getPredictCLassAnnotations = (service_url, image_url, callback) => {
    const { t } = i18next;
    const url = service_url; // No need to append query params anymore
    const payload = {
        image_url: image_url, // param is now just the image URL
    };

    ee.emit(EVENT_SHOW_WAITING);

    request(
        {
            method: 'POST',
            url: url,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
            timeout: 10000,
        },
        function (error, response, body) {
            ee.emit(EVENT_HIDE_WAITING);
            if (error) {
                console.error(error);
                callback(null);
                remote.dialog.showErrorBox(t('global.error'), getErrorMessage(error));
            } else if (!response || response.statusCode !== 200) {
                console.error(getErrorMessage(null, response, body), body);
                remote.dialog.showErrorBox(t('global.error'), getErrorMessage(null, response, body));
                callback(null);
            } else {
                try {
                    let result = JSON.parse(body);
                    console.log("result ", result);
                    callback(result);
                } catch (e) {
                    console.error(e);
                    callback(null);
                    remote.dialog.showErrorBox(
                        t('global.error'),
                        `${t('annotate.editor.alert_bad_image_detect_response')}`
                    );
                }
            }
        }
    );
};
