import request from "request";
import i18next from "i18next";
import {ee, EVENT_HIDE_WAITING, EVENT_SHOW_WAITING} from "./library";
const getErrorMessage = (error, response, body) => {
    const {t} = i18next;
    const imageDetectParamsCheckMessage = !response || response.statusCode === 404 || response.statusCode === 401 ? t('annotate.editor.alert_bad_image_detect_response') : "";
    if(error) return `${error}. ${imageDetectParamsCheckMessage}`;
    if(response) return `${response.statusMessage}. ${imageDetectParamsCheckMessage}`;
    return t('annotate.editor.alert_bad_image_detect_response')
}

export const getPredictCLassAnnotations = (service_url, image_url, callback) => {
    const { t } = i18next;
    const url = service_url;
    const payload = { image_url };

    // ee.emit(EVENT_SHOW_WAITING);

    request(
        {
            method: 'POST',
            url: url,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            timeout: 20000,
        },
        function (error, response, body) {
            // ee.emit(EVENT_HIDE_WAITING);
            if (error) {
                console.error(error);
                callback({ error: getErrorMessage(error) || error.message || 'Unknown error' });
            } else if (!response || response.statusCode !== 200) {
                const fullError = `\n\nURL: ${service_url} \n\nError: ${getErrorMessage(null, response, body)}\n\n`;
                console.error(fullError);
                callback({ error: fullError });
            } else {
                try {
                    let result = JSON.parse(body);
                    callback({ result });
                } catch (e) {
                    console.error(e);
                    callback({ error: t('annotate.editor.alert_bad_image_detect_response') });
                }
            }
        }
    );
};

