import request from "request";
import i18next from "i18next";
import {ee, EVENT_HIDE_WAITING, EVENT_SHOW_WAITING} from "./library";
import {remote} from "electron";
import {getErrorMessage} from "./xper";

export const getImageDetectAnnotations = (param, callback) => {

    const {t} = i18next;
    let url = 'https://plantai.ummisco.fr/image?url=' + param;
    ee.emit(EVENT_SHOW_WAITING);
    request(
        {
            url: url,
            timeout: 10000,
        },
        function (error, response, body) {
            console.log("error ", error);
            console.log("response ", response);
            console.log("body ", body);
            ee.emit(EVENT_HIDE_WAITING);
            if (error || !response || response.statusCode !== 200) {
                callback(null);
                remote.dialog.showErrorBox(t('global.error'), getErrorMessage(error, response, body));
                console.error(getErrorMessage(error, response, body), body);
            } else {
                try {
                    let found = [];
                    let result = JSON.parse(body);
                    if (result) {
                        console.log("result ", result);
                        callback(result);
                    }
                } catch (e) {
                    callback(null);
                    console.error(e);
                    remote.dialog.showErrorBox(
                        t('global.error'),
                        `${t('annotate.editor.alert_bad_image_detect_response')}`
                    );
                }
            }
        }
    );
}


