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
// export const getImageDetectAnnotations = (service_url, param, callback) => {
//     const {t} = i18next;
//     let url = service_url + '?url=' + param;
//     ee.emit(EVENT_SHOW_WAITING);
//     debugger
//     request(
//         {
//             url: url,
//             timeout: 10000,
//         },
//         function (error, response, body) {
//             console.log("error ", error);
//             console.log("response ", response);
//             console.log("body ", body);
//             ee.emit(EVENT_HIDE_WAITING);
//             if (error || !response || response.statusCode !== 200) {
//                 callback(null);
//                 remote.dialog.showErrorBox(t('global.error'), getErrorMessage(error, response, body));
//                 console.error(getErrorMessage(error, response, body), body);
//             } else {
//                 try {
//                     let found = [];
//                     let result = JSON.parse(body);
//                     if (result) {
//                         console.log("result ", result);
//                         callback(result);
//                     }
//                 } catch (e) {
//                     callback(null);
//                     console.error(e);
//                     remote.dialog.showErrorBox(
//                         t('global.error'),
//                         `${t('annotate.editor.alert_bad_image_detect_response')}`
//                     );
//                 }
//             }
//         }
//     );
// }


