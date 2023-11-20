import configYaml from 'config-yaml';
import crypto from "crypto";
import { remote } from "electron";
import fs from 'fs-extra';
import i18next, { changeLanguage } from "i18next";
import klaw from "klaw";
import lodash from 'lodash';
import os from 'os';
import path from 'path';
import yaml from 'write-yaml';
import packageJson from '../../package.json';
import { DEFAULT_IIIF_CONNECTION_URL, DEFAULT_XPER_CONNECTION_URL, IMAGE_STORAGE_DIR } from "../constants/constants";
import { getDefaultLanguage } from "../i18n";
import { createInitialState } from "../reducers/app";
import { escapePathString, formatDate, formatDateForFileName } from "./js";
import { AUTHORIZED_PICTURES_EXTENSIONS } from "./library";
import { convertSelectedTagsToFilter } from "./tags";

const {ipcRenderer} = require('electron')

let config;
// path to global app config
let config_file_path;
let app_home_path;
// Contains folders path and aliases for current ws.
let ws_descriptor = [];

let thumb_nails_dir;
let project_info_file;
let cache_dir;
let taxomony_dir;
let metadata_dir;

let installatio_root_dir;
if (process.env.NODE_ENV === 'production') {
    installatio_root_dir = path.dirname(remote.app.getAppPath())
} else {
    installatio_root_dir = process.env.INIT_CWD;
}

export const WORK_SPACE_DESCRIPTOR = 'workspace.json';
export const PROJECT_INFO_DESCRIPTOR = 'project-info.json';

export const getThumbNailsDir = () => thumb_nails_dir;
export const getCacheDir = () => cache_dir;
export const getTaxonomyDir = () => taxomony_dir;
export const getMetadataDir = () => metadata_dir;
export const getProjectInfoFile = () => project_info_file;
export const getConfigFilePath = () => config_file_path;
export const getAppHomePath = () => app_home_path;

export const get = () => config;
export const set = _ => (config = _);
const now = formatDate(new Date());

export const getYaml = () => {
    return configYaml(config_file_path);
}

ipcRenderer.on('app-close', _ => {
    // alert("on close app");
    unlockProject();
    ipcRenderer.send('closed');
});

/**
 * Rename project.
 * @param _path
 * @param label
 */
export const editProject = (_path, label) => {
    let project = {};
    const path_to_project = path.join(_path, PROJECT_INFO_DESCRIPTOR);

    if (fs.existsSync(path_to_project)) {
        let readProject = fs.readFileSync(path_to_project);
        project = JSON.parse(readProject);
        project.label = label;
        fs.writeFileSync(path_to_project, JSON.stringify(project));
    } else {
        console.log('there is no project info...');
    }
};

/**
 * Delete information about workspace from configuration.
 * @param projectPath
 */
export const deleteWorkspace = (projectPath) => {
    const readYml = configYaml(config_file_path);

    if (readYml.workspace === projectPath) {
        alert("you can't delete currently active workspace");
        return false;
    }

    if (readYml.hasOwnProperty('projects')) {
        config.projects = readYml.projects;
        config.projects.splice(config.projects.findIndex(project => project.path === projectPath), 1);
    }
    yaml.sync(config_file_path, config);
};

/**
 * Load project info into object.
 * @param project_path
 * @returns {{}}
 */
export const getProjectInfo = (project_path) => {
    let project = {
        label: '',
        date: '',
        folder: '',
        images: ''
    };

    const path_to_project = path.join(project_path, PROJECT_INFO_DESCRIPTOR);
    if (fs.existsSync(path_to_project)) {
        let readProject = fs.readFileSync(path_to_project);
        project = JSON.parse(readProject);
        return project;
    } else {
        console.log('there is no project info...');
        return project;
    }
};

/**
 * Croeate empty project inf.
 * @param label
 */
export const setProjectInfo = (label) => {
    if (label === undefined) {
        label = '';
    }

    const project = {
        version: packageJson.version,
        label: label,
        date: now,
        folders: 1,
        images: 0
    };

    const path_to_project_info = path.join(config.workspace, PROJECT_INFO_DESCRIPTOR);

    if (fs.existsSync(path_to_project_info)) {
        console.log(' project info file already exists no need to update');
    } else {
        fs.writeFileSync(path_to_project_info, JSON.stringify(project));
    }
};

export const lockUnlockProject = (pathOfProjectToActivate) => {
    unlockProject(getProjectInfoFile());
    lockProject(pathOfProjectToActivate);
};

export const unlockProject = () => {
    console.log(`Lock/unlock file with user `, os.userInfo())
    const project = JSON.parse(fs.readFileSync(getProjectInfoFile()));
    const id = crypto.createHash('sha1').update(os.userInfo().username).digest('hex');
    if (project.locked === id) {
        delete project.locked;
        delete project.lockedBy;
        delete project.lockedOn;
        fs.writeFileSync(getProjectInfoFile(), JSON.stringify({...project, path: undefined}));
    }
}

export const markProjectAsShared = (wsPath) => {
    if(!wsPath) return;
    console.log(`Mark project on '${wsPath}' as shared`);
    const projectPath = path.join(wsPath, PROJECT_INFO_DESCRIPTOR);
    if (fs.existsSync(projectPath)) {
        const project = JSON.parse(fs.readFileSync(projectPath));
        project.shared = true;
        fs.writeFileSync(projectPath, JSON.stringify({...project, path: undefined}));
    } else {
        console.log('Project info doesn\'t exist');
    }
}

export const forceUnlockProject = (wsPath) => {
    console.log(`Force unlock file with user  `, os.userInfo())
    console.log(`wsPath`, wsPath)
    let project;
    let projectPath;
    if(wsPath) {
        projectPath = path.join(wsPath, PROJECT_INFO_DESCRIPTOR);
    } else {
        projectPath = getProjectInfoFile();
    }
    console.log(`projectPath`, projectPath)
    project = JSON.parse(fs.readFileSync(projectPath));
    delete project.locked;
    delete project.lockedBy;
    delete project.lockedOn;
    fs.writeFileSync(projectPath, JSON.stringify({...project, path: undefined}));
}

export const lockProject = (wsPath) => {
    const projectPath = path.join(wsPath, PROJECT_INFO_DESCRIPTOR);
    const projectToActivate = JSON.parse(fs.readFileSync(projectPath));
    if (!('locked' in projectToActivate)) {
        projectToActivate.locked = crypto.createHash('sha1').update(os.userInfo().username).digest('hex');
        projectToActivate.lockedBy = os.userInfo().username;
        projectToActivate.lockedOn = os.hostname();
        fs.writeFileSync(projectPath, JSON.stringify({
            ...projectToActivate,
            path: undefined
        }));
    }
}

export const probeLockedProject = (project) => {
    const id = crypto.createHash('sha1').update(os.userInfo().username).digest('hex');
    if ("locked" in project) {
        return project.locked === id;
    } else return true;
}

export const addProjectToWorkSpace = (_, toggleActive) => {
    config.workspace = _;
    let project = {
        path: _,
        active: false,
    };

    config.projects = [];

    const readYml = configYaml(config_file_path);

    const even = (element) => element.path === project.path;

    if (readYml.hasOwnProperty('projects')) {

        config.projects = readYml.projects;

        if (readYml.projects.some(even)) {
            console.log('the project already exists , switching workspace to existing one');
            config.projects.forEach(p => {
                p.active = p.path === project.path;
            })
        } else {
            console.log('project does not exist in yml file , adding new project');
            config.projects.push(project);
            if (toggleActive) {
                project.active = true;
                config.projects.forEach(p => {
                    p.active = p.path === project.path;
                })
            }
        }

    } else {
        console.log('first project in fake projects  in the yml file');
        project.active = true;
        config.projects.push(project);
    }
    yaml.sync(config_file_path, config);
}

/**
 * Set selected workspace as active.
 * @param _
 * @param label
 */
export const setWorkspace = (_, label) => {
    console.log("setWorkspace")
    const { t } = i18next;
    addProjectToWorkSpace(_, true);
    setProjectInfo(label);

    initWorkSpace();

    const path_to_project = path.join(config.workspace, PROJECT_INFO_DESCRIPTOR);
    const projectConf = JSON.parse(fs.readFileSync(path_to_project));
    fs.writeFileSync(path_to_project, JSON.stringify(projectConf));

    const file = path.join(getCacheDir(), 'current-work.json');
    if (fs.existsSync(file)) {
        let initialState = createInitialState().app;
        try {
            const tmpState = JSON.parse(fs.readFileSync(file, 'utf8'));
            tmpState.selectedProjectName = projectConf.label;

            const taxonomyInstance = tmpState.taxonomyInstance || {};
            for (const tabName in tmpState.open_tabs) {
                const tab = tmpState.open_tabs[tabName];
                if ('taxonomyInstance' in tab) {
                    lodash.extendWith(taxonomyInstance, tab.taxonomyInstance)
                }
                if(!tab.selected_filter && tab.selected_tags) {
                    tab.selected_filter = convertSelectedTagsToFilter(tab.selected_tags, tab.tags_selection_mode);
                    tab.selected_tags = null;
                    tab.tags_selection_mode = null;
                }
            }
            tmpState.taxonomyInstance = taxonomyInstance;

            let correctStructure = true;
            if (!tmpState.hasOwnProperty("annotations_chronothematique")) {
                console.log('project from previous version , adding chronothematique annotation')
                tmpState["annotations_chronothematique"] = {};
            }
            if (!tmpState.hasOwnProperty("annotations_eventAnnotations")) {
                console.log('project from previous version , annotations_eventAnnotations')
                tmpState["annotations_eventAnnotations"] = {};
            }
            if (!tmpState.hasOwnProperty("selectedCategory")){
                console.log('project from previous version , adding selectedCategory');
                tmpState["selectedCategory"] = null;
            }
            if (!tmpState.hasOwnProperty("selectedCategories")){
                console.log('project from previous version , adding selectedCategories');
                tmpState["selectedCategories"] = [];
            }
            if (!tmpState.hasOwnProperty("search")){
                console.log('project from previous version , adding searchText');
                tmpState["searchText"] = null;
            }
            if (!tmpState.hasOwnProperty("searchResults")){
                console.log('project from previous version , adding searchResults');
                tmpState["searchResults"] = [];
            }
            if (!tmpState.hasOwnProperty("annotations_circle_of_interest")){
                console.log('project from previous version , adding annotations_circle_of_interest');
                tmpState["annotations_circle_of_interest"] = {};
            }
            if (!tmpState.hasOwnProperty("annotations_polygon_of_interest")){
                console.log('project from previous version , adding annotations_polygon_of_interest');
                tmpState["annotations_polygon_of_interest"] = {};
            }

            // Check if object structure match to expected one.
            for (const prop in initialState) {
                if (!(prop in tmpState)) {
                    console.log('MISSING --> ' + prop)
                    correctStructure = false;
                }
            }

            if (correctStructure) {
                return tmpState;
            } else {
                fs.renameSync(file, `${file}.${formatDateForFileName(new Date())}.old`);
                remote.dialog.showMessageBox(remote.getCurrentWindow(), {
                    type: 'warning',
                    message: t('projects.alert_selected_workspace_has_configuration_from_older_version')
                });
            }
        } catch (e) {
            console.log(e)
            remote.dialog.showMessageBox(remote.getCurrentWindow(), {
                type: 'error',
                message: t('projects.alert_selected_workspace_state_is_corrupted'),
            });
            // Save corrupted work and create empty state.
            fs.renameSync(file, `${file}.${formatDateForFileName(new Date())}.corrupted`)
            console.error('Corrupted current-work.json. Creating empty state.');

            return initialState;
        }
    } else {
        return null;
    }
};

const setBackupProject = () => {
    let demoProjectPathInst = path.join(installatio_root_dir, 'demo-workspace');
    let demoProjectPath = path.join(app_home_path, 'demo-workspace');
    if (!fs.existsSync(demoProjectPath)){
        copyFolderSync(demoProjectPathInst, demoProjectPath)
    }
    if(!config) {
        config = {}
    }
    if(!config.projects) {
        config.projects = []
    }
    const even = (element) => element.path === demoProjectPath;
    if (config.projects.some(even)) {
        config.projects.forEach(p => {
            p.active = p.path === demoProjectPath;
        })
    } else {
        config.projects.push({path: demoProjectPath, active: true});
    }
    config.workspace = demoProjectPath;
    yaml.sync(config_file_path, config);
    lockProject(config.workspace);
}

export const getUserWorkspace = () => config.workspace;

const checkExiftoolConfig = () => {
    const exifConf = path.join(remote.app.getPath('home'), '.ExifTool_config');
    if (process.env.NODE_ENV === 'production') {
        const newExif = fs.readFileSync(path.join(installatio_root_dir, '.ExifTool_config'));
        fs.writeFileSync(exifConf, newExif);
    }
    if (!fs.existsSync(exifConf)) {
        fs.copySync(path.join(installatio_root_dir, '.ExifTool_config'), exifConf);
    }
}

const checkOldConfig = () => {
    const { t } = i18next;
    const old_config_file_path = path.join(remote.app.getPath('home'), 'collaboratoire2-config.yml');
    if (fs.existsSync(old_config_file_path)) {
        let detail = '';
        const message = t('projects.alert_title_projects_created_with_old_version_of_can_not_be_loaded', {file_path: old_config_file_path});
        //     const message = 'File "'+old_config_file_path+'" contains paths to projects created with version of Annotate <1.7.0 that can not be loaded.'
        const readPreviousYml = configYaml(old_config_file_path);
        if (readPreviousYml.hasOwnProperty('projects')) {
            const projects = readPreviousYml.projects;
            detail = t('projects.alert_projects_created_with_old_version_of_can_not_be_loaded');
            projects.forEach(project => {
                detail += project.path + "\n"
            });
            const result = remote.dialog.showMessageBox(remote.getCurrentWindow(), {
                type: 'info',
                message: message,
                buttons: [t('global.continue'), t('global.delete_this_file_for_me')],
                detail: detail,
                cancelId: 1
            });

            if (result === 0) {
                console.log('');
            }

            if (result === 1) {
                fs.unlinkSync(old_config_file_path);
                console.log('file successfully deleted.. ', old_config_file_path)
            }
        }
    }
}

const validateWorkspace = () => {
    if(!config.workspace) return false;
    if(!fs.existsSync(config.workspace)) return false;
    for(let project of config.projects) {
        if(project.path === config.workspace && !project.corrupted) return true;
    }
    return false;
}

export const checkIfProjectsAreCorrupted = () => {
    if(!config.projects) return;
    config.projects.forEach(project => {
        const corrupted = !fs.existsSync(path.join(project.path, 'project-info.json'));
        if (corrupted) {
            project.corrupted = true;
        } else {
            delete project.corrupted;
        }
    })
    yaml.sync(config_file_path, config);
}

export const doInitConfig = () => {
    const { t } = i18next;
    const defaultLanguage = getDefaultLanguage();

    //init default
    config = {
        projects : [],
        language:defaultLanguage
    }

    // check exiftool config file
    checkExiftoolConfig();

    // check old config
    checkOldConfig();

    app_home_path = path.join(remote.app.getPath('home'), 'Annotate-on');
    if (!fs.existsSync(app_home_path)){
        fs.mkdirSync(app_home_path);
    }
    config_file_path = path.join(app_home_path, 'annotate-config.yml');

    // check if configuration exist
    if (!fs.existsSync(config_file_path)) {
        setBackupProject();
        return;
    }

    try {
        config = configYaml(config_file_path);

        //check language
        if(config.language) {
            changeLanguage(config.language);
        } else {
            updateSelectedLanguage(defaultLanguage);
        }

        // check if project empty
        if (config.projects === undefined || config.projects.length < 1) {
            setBackupProject();
            return;
        }

        //check if there are corrupted projects
        checkIfProjectsAreCorrupted();

        let switchedToProject;
        // check if workspace is valid

        if (!validateWorkspace()) {
            console.log(" current workspace [" + config.workspace + "] is not valid" )
            let workspacePath = null;
            config.projects.forEach(project => {
                project.active = false;
                if (workspacePath === null && !project.corrupted && fs.existsSync(path.join(project.path, 'project-info.json'))) {
                    project.active = true;
                    workspacePath = project.path;
                    switchedToProject = project;
                }
            })
            console.log('switch to workspace', workspacePath)
            if (workspacePath !== null) {
                config.workspace = workspacePath;
                yaml.sync(config_file_path, config);
                lockProject(config.workspace);
            } else {
                console.log("there is no valid projects, switch to demo workspace" )
                setBackupProject();
                return;
            }
        } else {
            console.log("current workspace [" + config.workspace + "] is valid" )
        }

        // check if project is locked
        const path_to_project = path.join(config.workspace, PROJECT_INFO_DESCRIPTOR);
        const loadedProject = JSON.parse(fs.readFileSync(path_to_project));

        // if project is not locked then lock it
        if(probeLockedProject(loadedProject)) {
            lockProject(config.workspace);
            return;
        }

        const result = remote.dialog.showMessageBox(remote.getCurrentWindow(), {
            type: 'question',
            buttons: ['Yes', 'No'],
            message: t('global.locked'),
            cancelId: 1,
            detail: t('projects.alert_confirmation_unlock_project', {user: loadedProject.lockedBy, machine: loadedProject.lockedOn})
        });

        // user wants to unlock project
        if(!result) {
            forceUnlockProject(config.workspace);
            lockProject(config.workspace);
            return;
        }

        // user doesn't want to unlock project, then switch to other unlocked and not corrupted project
        let workspacePath = null;
        config.projects.forEach(project => {
            project.active = false;
            if (workspacePath === null) {
                console.log('project.path ' + project.path);
                if(project.path !== path_to_project && !project.corrupted) {
                    const projectToCheck = JSON.parse(fs.readFileSync(path.join(project.path, PROJECT_INFO_DESCRIPTOR)));
                    console.log(projectToCheck);
                    if(!projectToCheck.locked) {
                        project.active = true;
                        workspacePath = project.path;
                        switchedToProject = project;
                    }
                }
            }
        })
        if (workspacePath !== null) {
            config.workspace = workspacePath;
            yaml.sync(config_file_path, config);
            lockProject(config.workspace);
        } else {
            console.log(' There is no project to switch, go with demo!');
            setBackupProject();
        }
        remote.dialog.showMessageBox({
            type: 'info',
            detail: t('projects.alert_workspace_will_be_switched_to', {workspace: config.workspace}),
            message: t('global.locked'),
            buttons: ['OK'],
            cancelId: 1
        });
    } catch (e) {
        console.error(e);
        setBackupProject();
        remote.dialog.showMessageBox({
            type: 'error',
            detail: t('projects.alert_fatal_error_while_init_config', {workspace: config.workspace}),
            message: t('global.locked'),
            buttons: ['OK'],
            cancelId: 1
        });
    }
};

/**
 *  Init basic config. Read existing workspace location or init location for the first time.
 */
export const doInitWorkspace = () => {
    // Default workspace location.
    const USER_DATA_DIR = path.join(installatio_root_dir, 'demo-workspace');
    console.log(USER_DATA_DIR);
    try {
        initWorkSpace();
    } catch (e) {
        console.error(e)
    }
};

/**
 * Check if necessary configuration directories exist and create all structure is workspace was empty.
 */
const initWorkSpace = () => {
    const wsDescriptorPath = path.join(config.workspace, WORK_SPACE_DESCRIPTOR);
    //project page disable default workspace
    ws_descriptor = [];

    const convertFolderPaths = (folders, output) => {
        folders.map(folder => {
            let path = folder.path;
            if (process.platform === 'win32') {
                path = path.replace(/\//g, '\\')
            }
            let children = undefined
            if (folder.children) {
                children = []
                convertFolderPaths(folder.children, children)
            }
            output.push({
                ...folder, children, path
            })
        })
    }

    if (fs.existsSync(wsDescriptorPath)) {
        try {
            const descriptor = JSON.parse(fs.readFileSync(wsDescriptorPath, 'utf8'));
            convertFolderPaths(descriptor, ws_descriptor)
        } catch (e) {
            console.warn('Workspace file is empty.')
        }
    }

    // Create application cache & user data directories
    cache_dir = path.join(config.workspace, 'collaboratoire-cache');
    thumb_nails_dir = path.join(cache_dir, 'thumbnails');
    taxomony_dir = path.join(cache_dir, 'taxonomies');
    metadata_dir = path.join(cache_dir, 'metadata');
    project_info_file = path.join(config.workspace, PROJECT_INFO_DESCRIPTOR);

    fs.ensureDirSync(cache_dir);
    fs.ensureDirSync(thumb_nails_dir);
    fs.ensureDirSync(taxomony_dir);
    fs.ensureDirSync(metadata_dir);
    fs.ensureDirSync(path.join(config.workspace, IMAGE_STORAGE_DIR));
};

export const updateTargetTypes = (rootDir) => {

    const cache_dir = path.join(rootDir, 'collaboratoire-cache');
    const taxomony_dir = path.join(cache_dir, 'taxonomies');

    //TODO: check if this cause bug that causes group lose on targets in custom annotate models

    if (fs.existsSync(cache_dir) && fs.existsSync(taxomony_dir)) {
        try {
            const project_cache = JSON.parse(fs.readFileSync(path.join(cache_dir, 'current-work.json')));
            const taxonomies = project_cache.taxonomies;

            if (taxonomies && taxonomies.length > 0) {
                taxonomies.map(at => {
                    if (at.model === 'MODEL_ANNOTATE') {
                        let fileName = at.id + '.json';
                        const filePath = path.join(taxomony_dir, fileName);
                        if (fs.existsSync(filePath)) {
                            const taxonomy = JSON.parse(fs.readFileSync(filePath));
                            at.targetTypes = getTargetTypes(taxonomy);
                        } else {
                            console.log(filePath + 'does not exist...')
                        }
                    }
                    return at;
                });
            }
            console.log('taxonomies updated --> ', taxonomies)
            project_cache.taxonomies = taxonomies;
            fs.writeFileSync(path.join(cache_dir, 'current-work.json'), JSON.stringify(project_cache));
        } catch (err) {
            console.error(err)
        }
    } else {
        console.log('folders: ' + cache_dir + ' and ' + taxomony_dir + 'do not exist');
    }
}

const getTargetTypes = (taxonomy) => {
    let targetTypes = [];
    if (taxonomy && taxonomy.length > 0) {
        taxonomy.forEach(descriptor => {
            if (!targetTypes.includes(descriptor.targetType) && descriptor.targetType !== '') {
                targetTypes.push(descriptor.targetType);
            }
        })
    }
    console.log('targetTypes -> ', targetTypes)
    return targetTypes;
}

/**
 * Add new directory under workspace.
 * @param path
 */
export const addPicturesDirectory = (path) => {
    if (ws_descriptor.filter(_ => _.path === path).length !== 0) return;
    if (ws_descriptor.filter(_ => _.alias === path).length !== 0) return;
    ws_descriptor.push({path: path, alias: path});
};

/**
 * Add new folder under parent.
 * @param folders
 * @param parent
 * @param path
 * @param alias
 */
export const addToFolder = (folders, parent, path, alias) => {
    folders.map(pItem => {
        if (pItem.path === parent) {
            if (!pItem.children)
                pItem.children = [];
            pItem.children.push({path: path, alias: alias});
        } else {
            if (pItem.children)
                addToFolder(pItem.children, parent, path, alias);
        }
    });
};

/**
 * Moves folder with all content to another parent.
 * @param folders
 * @param destinationFolderPath
 * @param sourceFolderPath
 * @returns {{previousFolder: string, nextFolder: *}}
 */
export const moveToFolder = (folders, destinationFolderPath, sourceFolderPath) => {
    const findAndRemove = (folders, folderPath, remove) => {
        let foundMatchingFolder = null;
        folders.some((pItem, index) => {
            if (pItem.path === folderPath) {
                if (remove)
                    folders.splice(index, 1);
                foundMatchingFolder = pItem;
                return true;
            } else {
                if (pItem.children) {
                    foundMatchingFolder = findAndRemove(pItem.children, folderPath, remove);
                    if (foundMatchingFolder !== null)
                        return true;
                }
            }
        });
        return foundMatchingFolder;
    };

    const previousFolder = path.join(config.workspace, IMAGE_STORAGE_DIR, sourceFolderPath);
    let nextFolder;
    if (destinationFolderPath !== 'ROOT') {
        // Get parent
        const destinationFolder = findAndRemove(folders, destinationFolderPath, false);
        const targetFolder = findAndRemove(folders, sourceFolderPath, false);

        // Check if targetFolder is not parent of parentFolder
        if (targetFolder.children && findAndRemove(targetFolder.children, destinationFolderPath, false) != null) {
            console.log('This is not legal move.');
            return null;
        }

        // check if parent doesn't contain children with the same name.
        if (destinationFolder.children) {
            for (const dir of destinationFolder.children) {
                if (dir.alias === targetFolder.alias) {
                    return null;
                }
            }
        }
        // check if the same folder already exists on filesystem.
        if (fs.existsSync(path.join(config.workspace, IMAGE_STORAGE_DIR, destinationFolder.path, targetFolder.alias)))
            return null;

        findAndRemove(folders, sourceFolderPath, true);
        targetFolder.path = path.join(destinationFolder.path, targetFolder.alias);

        if (targetFolder.children) {
            updateChildrenPath(targetFolder.children, sourceFolderPath, targetFolder.path)
        }

        nextFolder = path.join(config.workspace, IMAGE_STORAGE_DIR, targetFolder.path);
        fs.moveSync(previousFolder, nextFolder);
        if (destinationFolder.children) {
            // Get target folder
            destinationFolder.children.push(targetFolder);
        } else {
            // Get target folder
            destinationFolder.children = [targetFolder];
        }
    } else {
        let targetFolder = findAndRemove(folders, sourceFolderPath, false);
        // check if parent doesn't contain children with the same name.
        for (const dir of folders) {
            if (dir.alias === targetFolder.alias) {
                return null;
            }
        }
        // check if the same folder already exists on filesystem.
        if (fs.existsSync(path.join(config.workspace, IMAGE_STORAGE_DIR, targetFolder.alias)))
            return null;

        targetFolder = findAndRemove(folders, sourceFolderPath, true);
        targetFolder.path = targetFolder.alias;

        if (targetFolder.children) {
            updateChildrenPath(targetFolder.children, sourceFolderPath, targetFolder.path)
        }
        nextFolder = path.join(config.workspace, IMAGE_STORAGE_DIR, targetFolder.path);
        fs.moveSync(previousFolder, nextFolder);
        folders.push(targetFolder);
    }
    return {previousFolder, nextFolder};
};

/**
 * Add all folders from sub-directories to current workspace.
 * @param srcDir
 * @param parentPath
 */
const subDirectoryList = (srcDir, parentPath, subDirectories) => {
    fs.readdirSync(srcDir, {withFileTypes: true}).forEach(file => {
        if (file.isDirectory()) {
            const folderPath = path.join(parentPath, file.name);
            subDirectories.push(folderPath);
            addToFolder(ws_descriptor, parentPath, folderPath, file.name);
            subDirectoryList(path.join(srcDir, file.name), folderPath, subDirectories);
        }
    });
};

/**
 * Import folder form local disk to parent folder inside workspace.
 * @param src path from filesystem
 * @param alias name of new folder
 * @param parent in which to put copy new folder
 * @returns {Promise<unknown>}
 */
export const importFolder = (src, alias, parent) => {
    return new Promise((resolve, reject) => {
        // Create new folder in workspace and copy content of selected folder.
        // const newPath = path.join(parent, alias);
        const fullPath = path.join(config.workspace, IMAGE_STORAGE_DIR, parent);
        // fs.ensureDirSync(fullPath);
        console.log("Full path ", fullPath);
        console.log("Src path ", src);
        fs.copy(src, fullPath)
            .then(() => {
                const directories = [];
                // Collect all sub-folders and add to structure.
                subDirectoryList(src, parent, directories);
                // Save config file
                toConfigFileWithoutRefresh();

                // get images inside source folder.
                const files = [];
                klaw(src, {
                    filter: _ =>
                        !(fs.statSync(_).isDirectory() && ['.dropbox.cache', 'node_modules', '.git'].includes(path.basename(_)))
                })
                    .on('data', _ => {
                        const stats = fs.statSync(_.path);
                        if (!stats.isDirectory() && AUTHORIZED_PICTURES_EXTENSIONS.includes(path.extname(_.path).toLowerCase())) {
                            console.log(_.path)
                            files.push(_.path.replace(src, fullPath));
                        }
                    }).on('end', () => {
                    resolve({files, directories});
                });
            })
            .catch(err => {
                console.error(err);
                reject();
            })
    });
};

/**
 * Import list or single resource into parent folder inside workspace.
 * @param resources
 * @param parent
 * @returns {Promise<unknown>}
 */
export const importResources = (resources, parent) => {
    return new Promise((resolve, reject) => {
        // copy selected images into existing folder in workspace.
        // TODO 18.08.2020 15:14 mseslija: set proper storage dir
        let destinationFolder = path.join(config.workspace, IMAGE_STORAGE_DIR, parent);
        const copiedPaths = [];
        if (!lodash.isArray(resources)) {
            const fpath = path.join(destinationFolder, path.basename(resources));
            copiedPaths.push(fpath);
            fs.copySync(resources, fpath);
        } else {
            resources.forEach(resource => {
                const fpath = path.join(destinationFolder, path.basename(resource));
                copiedPaths.push(fpath);
                fs.copySync(resource, fpath);
            });
        }

        toConfigFileWithoutRefresh();
        resolve(copiedPaths);
    });
};

/**
 * Import clipboard resource into parent folder inside workspace.
 * @param resources
 * @param parent
 * @returns {Promise<unknown>}
 */
export const importClipboardResource = (resources, parent, fileName) => {
    return new Promise((resolve, reject) => {
        const destFile = path.join(path.join(config.workspace, IMAGE_STORAGE_DIR, parent), `${fileName}.png`);

        if (fs.existsSync(destFile)) {
            reject("Duplicate file");
        } else {
            const reader = new FileReader();
            reader.onload = (event) => {
                fs.writeFileSync(destFile, Buffer.from(event.target.result));
                toConfigFileWithoutRefresh();
                resolve([destFile]);
            }
            reader.readAsArrayBuffer(resources);
        }
    });
};

/**
 * Returns tree structure of workspace folders.
 * @returns {[]|*[]}
 */
export const getAllPicturesDirectories = () => {
    return ws_descriptor || [];
};

/**
 * Helper for getAllDirectoriesNameFlatten.
 * @param folders
 * @param res
 * @private
 */
const _flattenFoldersName = (folders, filter, res) => {
    folders.forEach(folder => {

        if (filter) {
            if (folder.path.startsWith(filter))
                res.push(folder.path);
        } else {
            res.push(folder.path);
        }
        if (folder.children) {
            _flattenFoldersName(folder.children, filter, res);
        }
    })
};

/**
 * Helper for _flattenFolders.
 * @param folders
 * @param res
 * @private
 */
const _flattenFolders = (folders, res) => {
    folders.forEach(folder => {
        res.push(folder);
        if (folder.children) {
            _flattenFolders(folder.children, res);
        }
    })
};

/**
 * Flat list of folder objects.
 * @param folders
 * @param res
 * @private
 */
export const getAllPicturesDirectoriesFlatten = () => {
    const folders = [];
    if (ws_descriptor) {
        _flattenFolders(ws_descriptor, folders);
    }
    return folders;
};

/**
 * Flat list of folder names.
 * @param filter
 * @param folders
 * @param res
 * @private
 */
export const getAllDirectoriesNameFlatten = (filter) => {
    const folders = [];
    if (ws_descriptor) {
        _flattenFoldersName(ws_descriptor, filter, folders);
    }
    return folders;
};

/**
 * Remove folder from workspace and destroy content.
 * @param _
 */
export const removePicturesDirectory = _ => {
    let indexToDelete = null;

    let _ws_descriptor;
    const findPath = (folders) => {
        let resp = null;
        folders.some((folder, index) => {
            if (folder.path === _) {
                indexToDelete = index;
                resp = folders;
                if (resp)
                    return true;
            } else if (folder.children) {
                resp = findPath(folder.children);
                if (resp)
                    return true;
            }
        });
        return resp;
    };

    _ws_descriptor = findPath(ws_descriptor);

    const folderAbsolutePath = path.join(config.workspace, IMAGE_STORAGE_DIR, _ws_descriptor[indexToDelete].path);

    fs.remove(folderAbsolutePath).then(() => {
        console.log('Folder <%s> deleted from disc!', folderAbsolutePath)
    });

    if (_ws_descriptor && _ws_descriptor.length !== 0) {
        _ws_descriptor.splice(indexToDelete, 1);
    }
    toConfigFileWithoutRefresh();
};

/**
 * Save current folder structure without re-initialization.
 */
export const toConfigFileWithoutRefresh = () => {
    // save to json ws descriptor
    const wsDescriptorPath = path.join(config.workspace, WORK_SPACE_DESCRIPTOR);
    const descriptor = [];
    const processFolders = (folders, output) => {
        folders.map(folder => {
            let children = undefined
            if (folder.children) {
                children = []
                processFolders(folder.children, children)
            }
            output.push({
                ...folder, children,
                path: escapePathString(folder.path)
            });
        })
    }
    processFolders(ws_descriptor, descriptor)
    // console.log('Save folders configuration %o', descriptor)
    fs.writeFileSync(wsDescriptorPath, JSON.stringify(descriptor));
};

/**
 * Save taxonomy configuration to file.
 * @param id
 * @param taxonomyDefinition
 */
export const saveTaxonomy = (id, taxonomyDefinition) => {
    fs.writeFileSync(path.join(taxomony_dir, `${id}.json`), JSON.stringify(taxonomyDefinition));
};

/**
 * Copy original sdd to workspace.
 * @param id
 * @param sddPath
 * @returns {string}
 */
export const copySdd = (id, sddPath) => {
    fs.copyFileSync(sddPath, path.join(taxomony_dir, `${id}-sdd.xml`));
    return `${id}-sdd.xml`;
};

/**
 * Load taxonomy object from file.
 * @param id
 * @returns {any}
 */
export const loadTaxonomy = (id) => {
    return JSON.parse(fs.readFileSync(path.join(taxomony_dir, `${id}.json`)));
};

/**
 * Delete taxonomy from storage.
 * @param id
 */
export const deleteTaxonomy = (id) => {
    fs.remove(path.join(taxomony_dir, `${id}.json`)).then(() => {
        console.log('TargetDescriptors file deleted from disc!')
    });
};

/**
 * Save metadata properties to system config.
 * @param sha1
 * @param metadata
 */
export const saveMetadata = (sha1, metadata) => {
    fs.writeFileSync(path.join(metadata_dir, `${sha1}.json`), JSON.stringify(metadata));
};

/**
 * Load metadata configuration for selected picture.
 * @param sha1
 * @returns {null|any}
 */
export const loadMetadata = (sha1) => {
    const file = path.join(metadata_dir, `${sha1}.json`);
    if (fs.existsSync(file)) {
        return JSON.parse(fs.readFileSync(file, 'utf8'));
    } else
        return null;
};

/**
 * Update recursively path property for each object.
 * @param children
 * @param replacePath
 * @param withPath
 */
export const updateChildrenPath = (children, replacePath, withPath) => {
    lodash.forEach(children, child => {
        child.path = child.path.replace(replacePath, withPath);
        if (child.children) {
            updateChildrenPath(child.children, replacePath, withPath);
        }
    });
};

/**
 * Rename folder on filesystem.
 * @param oldPath
 * @param newPath
 */
export const renameFolder = (oldPath, newPath) => {
    fs.renameSync(path.join(config.workspace, IMAGE_STORAGE_DIR, oldPath), path.join(config.workspace, IMAGE_STORAGE_DIR, newPath));
};

/**
 * Update information about chosen language
 * @param projectPath
 */
export const updateSelectedLanguage = (lang) => {
    console.log("updateSelectedLanguage lang " + lang)
    // const readYml = configYaml(config_file_path);
    changeLanguage(lang);
    config.language = lang;
    yaml.sync(config_file_path, config);
};

/**
 * Update tools parameters
 * @param projectPath
 */
export const updateToolsParams = (colorPickerRadius) => {
    console.log("updateToolsParams ", colorPickerRadius)
    config.tools = {
        colorPickerRadius
    };
    yaml.sync(config_file_path, config);
};

export const getToolsParams = () => {
    // console.log("getXperParams")
    if(!config.tools) {
        updateToolsParams('');
    }
    return {
        colorPickerRadius: config.tools.colorPickerRadius
    };
};

/**
 * Update Xper connection parameters
 * @param projectPath
 */
export const updateXperParams = (url, email, password) => {
    console.log("updateXperParams ", url, email, password)
    const encryptedPassword = password ? btoa(password) : password;
    config.xper = {
        url,
        email,
        password: encryptedPassword
    };
    yaml.sync(config_file_path, config);
};

export const getXperParams = () => {
    // console.log("getXperParams")
    if(!config.xper) {
        updateXperParams(DEFAULT_XPER_CONNECTION_URL, null, null)
    }
    return {
        url: config.xper.url,
        email: config.xper.email,
        password: config.xper.password ? atob(config.xper.password):config.xper.password
    };
};

export const updateIIIFParams = (url, username, password) => {
    console.log("updateIIIFParams ", url, username, password)
    const encryptedPassword = password ? btoa(password) : password;
    config.IIIF = {
        url,
        username,
        password: encryptedPassword
    };
    yaml.sync(config_file_path, config);
};

export const getIIIFParams = () => {
    // console.log("getXperParams")
    if(!config.IIIF) {
        updateIIIFParams(DEFAULT_IIIF_CONNECTION_URL, null, null)
    }
    return {
        url: config.IIIF.url,
        username: config.IIIF.username,
        password: config.IIIF.password ? atob(config.IIIF.password):config.IIIF.password
    };
};

export const copyFolderSync = (from, to) => {
    fs.mkdirSync(to);
    fs.readdirSync(from).forEach(element => {
        if (fs.lstatSync(path.join(from, element)).isFile()) {
            fs.copyFileSync(path.join(from, element), path.join(to, element));
        } else {
            copyFolderSync(path.join(from, element), path.join(to, element));
        }
    });
}

export const existConfigFrom1xVersion = () => {
    let old_config_file_path = path.join(remote.app.getPath('home'), 'annotate-config.yml');
    // console.log(old_config_file_path, fs.existsSync(old_config_file_path));
    return fs.existsSync(old_config_file_path);
}

export const importProjectsFrom1xVersionConfig = () => {
    if(!existConfigFrom1xVersion()) return;
    let old_config_file_path = path.join(remote.app.getPath('home'), 'annotate-config.yml');
    const oldYml = configYaml(old_config_file_path);
    let numberOfImportedProjects = 0;
    if(oldYml.projects) {
        for (const project of oldYml.projects) {
            if(!checkIfExistProjectWithPath(project.path)) {
                project.active = false;
                config.projects.push(project);
                ++numberOfImportedProjects;
            } else {
                console.log("already have project with path ", path);
            };
        }
    }
    if(numberOfImportedProjects > 0) {
        yaml.sync(config_file_path, config);
    }
    return numberOfImportedProjects;
}

export const checkIfExistProjectWithPath = (path) => {
    if(config.projects) {
        let found = config.projects.find(it => {return it.path === path})
        if (found)
            return true
        else
            return false;
    } else
        return false;
}


