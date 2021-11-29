import React from 'react';
import {Redirect, Route, Switch} from 'react-router';
import routes from './constants/routes';
import App from './containers/App';
import ImportFromErecolnat from "./containers/ImportFromErecolnat";
import ImportWizard from "./containers/ImportWizard";
import Settings from "./containers/Settings";
import TabsHolder from "./containers/TabsHolder";
import Taxonomies from "./containers/Taxonomies";
import Credits from "./containers/Credits";
import CollectionExport from "./containers/CollectionExport";
import Collections from "./containers/Collections";
import XmpMetadata from "./containers/XmpMetadata";
import CreateNewProject from "./containers/CreateNewProject";
import ImportExistingProject from "./containers/ImportExistingProject";
import ImportProjectAsZip from "./containers/ImportProjectAsZip";
import ImportVideoWizard from "./containers/ImportVideoWizard";
import ImportEventWizard from "./containers/ImportEventWizard";
import TagManager from "./containers/TagManager";
import IIIF from "./containers/IIIF";

export default () => (
    <App>
        <Switch>
            <Route exact path={routes.IMPORT} component={ImportFromErecolnat}/>
            <Route path={routes.SETTINGS} component={Settings}/>
            <Route path={routes.CREDITS} component={Credits}/>
            <Route path={routes.SELECTION} component={TabsHolder}/>
            <Route path={routes.IMPORTWIZARD} component={ImportWizard}/>
            <Route path={routes.IMPORTVIDEOWIZARD} component={ImportVideoWizard}/>
            <Route path={routes.IMPORTEVENTWIZARD} component={ImportEventWizard}/>
            <Route path={routes.TAXONOMIES} component={Taxonomies}/>
            <Route path={routes.COLLECTIONEXPORT} component={CollectionExport}/>
            <Route path={routes.COLLECTIONS} component={Collections}/>
            <Route path={routes.XMPMETADATA} component={XmpMetadata}/>
            <Route path={routes.ADD_NEW_PROJECT} component={CreateNewProject}/>
            <Route path={routes.IMPORT_EXISTING_PROJECT} component={ImportExistingProject}/>
            <Route path={routes.IMPORT_PROJECT_AS_ZIP} component={ImportProjectAsZip}/>
            <Route path={routes.TAG_MANAGER} component={TagManager}/>
            <Route path={routes.IIIF} component={IIIF}/>
            <Redirect
            to={{
                pathname: "/selection",
                state: { firstInit: true }
            }}
        />
        </Switch>
    </App>
);
