import 'babel-polyfill';
import React from 'react';
import {render} from 'react-dom';
import fs from 'fs-extra';
import path from "path";
import {AppContainer} from 'react-hot-loader';
import Root from './containers/Root';
import {configureStore, history} from './store/configureStore';
import {createInitialState} from "./reducers/app";
import {
    fromConfigFile,
    getAllPicturesDirectoriesFlatten,
    getCacheDir,
    getProjectInfoFile,
    getThumbNailsDir,
    getUserWorkspace,
    setConfigFilePath
} from "./utils/config";

import './app.global.scss';
import './app.global.css';
import 'react-virtualized/styles.css';
import {remote} from "electron";
import Splash from "./components/Splash";
import {IMAGE_STORAGE_DIR} from "./constants/constants";
import {formatDateForFileName} from "./utils/js";
import lodash from 'lodash';
import './i18n';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

// retrieve the browser session
const session = remote.getCurrentWindow().webContents.session;

// resolve the proxy for a known URL. This could be the URL you expect to use or a known good url like google.com
session.resolveProxy('https://www.google.com', proxyUrl => {

    // DIRECT means no proxy is configured
    if (proxyUrl !== 'DIRECT') {
        // retrieve the parts of the proxy from the string returned
        // the url would look something like: 'PROXY http-proxy.mydomain.com:8080'
        const proxyUrlComponents = proxyUrl.split(':');
        console.log(`Set proxy ${proxyUrl}`)
        const proxyHost = proxyUrlComponents[0].split(' ')[1];
        const proxyPort = parseInt(proxyUrlComponents[1], 10);
        process.env.RECOLNAT_HTTP_PROXY = `http://${proxyHost}:${proxyPort}`
        // process.env.HTTPS_PROXY = `${proxyHost}:${proxyPort}`
    } else {
        console.log('No proxy settings. '+ proxyUrl)
    }
});

process.on('uncaughtException', function (err) {
    console.log('Caught exception: %o', err);
    fs.appendFile(path.join(remote.app.getPath('home'), 'error.log'), '\n' + err.message + '\n' + err.stack, function (nope) {
        if (nope) throw nope;
        console.log('Saved!');
    });
});

const start = new Date().getTime();
//

// // Read config file
setConfigFilePath();
//
// // Load config of workspace location.
fromConfigFile();

// Callback which boot the app
const go = () => {
        let initialState = createInitialState();

        // Load previously working state.
        const file = path.join(getCacheDir(), 'current-work.json');

        if (fs.existsSync(file)) {
            try {
                const tmpState = {app: JSON.parse(fs.readFileSync(file, 'utf8'))};

                const projectInfoFile = getProjectInfoFile();
                if(fs.existsSync(projectInfoFile)) {
                    const projectInfo = JSON.parse(fs.readFileSync(projectInfoFile, 'utf8'));
                    tmpState.app.selectedProjectName = projectInfo.label;
                }

                const taxonomyInstance = tmpState.app.taxonomyInstance || {};
                for(const tabName in tmpState.app.open_tabs) {
                    const tab = tmpState.app.open_tabs[tabName];
                    if('taxonomyInstance' in tab)
                        lodash.extendWith(taxonomyInstance, tab.taxonomyInstance)
                }
                tmpState.app.taxonomyInstance = taxonomyInstance;

                let correctStructure = true;
                if (!tmpState.app.hasOwnProperty("annotations_chronothematique")){
                    console.log('project from previous version , adding chronothematique annotation')
                    tmpState.app["annotations_chronothematique"] = {};
                }
                if (!tmpState.app.hasOwnProperty("annotations_eventAnnotations")){
                    console.log('project from previous version , adding annotations_eventAnnotations');
                    tmpState.app["annotations_eventAnnotations"] = {};
                }
                // Check if object structure match to expected one.
                for (const prop in initialState.app) {
                    if(!(prop in tmpState.app)) {
                        correctStructure = false;
                    }
                }

                if(correctStructure) {
                    initialState = tmpState;
                    for (const sha1 in initialState.app.pictures) {
                        const absolutePath = path.join(getUserWorkspace(), IMAGE_STORAGE_DIR, initialState.app.pictures[sha1].file);
                        initialState.app.pictures[sha1].file = absolutePath;
                        const absoluteThumbPath = path.join(getThumbNailsDir(), initialState.app.pictures[sha1].thumbnail);
                        initialState.app.pictures[sha1].thumbnail = absoluteThumbPath;
                    }
                } else {
                    fs.renameSync(file, `${file}.${formatDateForFileName(new Date())}.old`)
                    remote.dialog.showMessageBox(remote.getCurrentWindow () ,{
                        type: 'warning',
                        message: 'Selected workspace has configuration from older version. Opening project without previous work.',
                    });
                }
            } catch (e) {
                remote.dialog.showMessageBox(remote.getCurrentWindow () ,{
                    type: 'error',
                    message: 'Selected workspace state is corrupted. Opening project without previous work.',
                });
                // Save corrupted work and create empty state.
                fs.renameSync(file, `${file}.${formatDateForFileName(new Date())}.corrupted`)
                console.error('Corrupted current-work.json. Creating empty state.');
                initialState = createInitialState();
            }
        } else {
            console.log('Create empty json');
        }

        // Init Redux store
        const store = configureStore(initialState);

        console.log(`${new Date().getTime() - start}ms`);

        setTimeout(() => {
            render(
                <AppContainer>
                    <Root store={store} history={history}/>
                </AppContainer>,
                document.getElementById('root')
            );

            if (module.hot) {
                module.hot.accept('./containers/Root', () => {
                    // eslint-disable-next-line global-require
                    const NextRoot = require('./containers/Root').default;
                    render(
                        <AppContainer>
                            <NextRoot store={store} history={history}/>
                        </AppContainer>,
                        document.getElementById('root')
                    );
                });
            }
        }, 250);
    }
;

// // Wait for pictures library init
if (getAllPicturesDirectoriesFlatten().length > 0) {
    render(<Splash/>, document.getElementById('root'));
    go();
} else {
    go();
}





