import i18n, {changeLanguage} from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './i18n/en.json'
import fr from './i18n/fr.json'
import yaml from "write-yaml";
import {remote} from "electron";

// import Backend from 'i18next-http-backend';
// import LanguageDetector from 'i18next-browser-languagedetector';
// don't want to use this?
// have a look at the Quick start guide
// for passing in lng and translations on init

export const SUPPORTED_LANGUAGES = [
    'en', 'fr'
]

/**
 * Returns default language for applications.
 *
 * @returns {string} default language
 */
export function getDefaultLanguage() {
    const appLocale = remote.app.getLocale();
    console.log("app locale [" + appLocale + "]");
    let os_language;
    if(appLocale && appLocale.length >= 2) {
        os_language = appLocale.substring(0,2).toLocaleLowerCase();
    }
    console.log("os language [" + os_language + "]");
    if(os_language && SUPPORTED_LANGUAGES.includes(os_language)) {
        return os_language;
    }
    return SUPPORTED_LANGUAGES[0];
}

i18n
    // load translation using http -> see /public/locales (i.e. https://github.com/i18next/react-i18next/tree/master/example/react/public/locales)
    // learn more: https://github.com/i18next/i18next-http-backend
    // want your translations to be loaded from a professional CDN? => https://github.com/locize/react-tutorial#step-2---use-the-locize-cdn
    // .use(Backend)
    // detect user language
    // learn more: https://github.com/i18next/i18next-browser-languageDetector
    // .use(LanguageDetector)
    // pass the i18n instance to react-i18next.
    .use(initReactI18next)
    // init i18next
    // for all options read: https://www.i18next.com/overview/configuration-options
    .init({
        lng: 'en',
        fallbackLng: 'en',
        debug: true,
        resources: {
            en, fr
        },

        interpolation: {
            escapeValue: false, // not needed for react as it escapes by default
        }
    });


export default i18n;


