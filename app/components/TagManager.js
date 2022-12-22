import React, {Component} from 'react';
import {
    Button,
    Col,
    Container,
    Form,
    Input,
    InputGroup,
    InputGroupAddon,
    Modal,
    ModalBody,
    ModalFooter,
    ModalHeader,
    Row
} from "reactstrap";
import Category from "./tags/Category";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {ContextMenu, ContextMenuTrigger, MenuItem} from "react-contextmenu";
import {faArrowRight} from "@fortawesome/free-solid-svg-icons";
import AddItem from "./tags/AddItem";
import {TYPE_CATEGORY, TYPE_TAG} from "./event/Constants";
import Chance from "chance";
import {
    containsOnlyWhiteSpace,
    createNewCategory,
    createNewTag,
    getRootCategories,
    getRootCategoriesNames,
    getTagsOnly, isChild,
    mergeCategories,
    sortTagList,
    validateTagList
} from "./tags/tagUtils";
import {remote, shell} from "electron";
import {formatDateForFileName} from "../utils/js";
import fs from "fs";
import CategoryTagInfo from "./tags/CategoryTagInfo";
import {ee, EVENT_ON_TAG_DROP, EVENT_SHOW_ALERT} from "../utils/library";
import {checkItemInParentCategory, genId} from "./event/utils";
import classnames from "classnames";
import {SORT_ALPHABETIC_ASC, SORT_ALPHABETIC_DESC, SORT_DATE_ASC, SORT_DATE_DESC} from "../constants/constants";
import SELECTED_ICON from "./pictures/selected_icon.svg";
import {sortTagsAlphabeticallyOrByDate} from "../utils/common";
import PageTitle from "./PageTitle";
import PROJECTS_IMAGE_CONTEXT from "./pictures/projects2.svg";
const readline = require('readline');
const TAGS_IMAGE_CONTEXT = require('./pictures/tags.svg');
const chance = new Chance();
const SORT_DIALOG = 'SORT_DIALOG';
const SORT_CATEGORY_DIALOG = 'SORT_CATEGORY_DIALOG';
const SORT_SEARCH_RESULTS_DIALOG = 'SORT_SEARCH_RESULTS_DIALOG';


class TagManager extends Component {

    constructor(props) {
        console.log("nextProps tags ", props.tags)
        super(props);
        this.state = {
            rootCategories: sortTagsAlphabeticallyOrByDate(getRootCategories(this.props.tags) , SORT_ALPHABETIC_DESC),
            selectedCategory: null,
            selectedCategories: [],
            sortUp: true,
            showModal: false,
            type: TYPE_CATEGORY,
            name: "",
            tags: [],
            editedItemName: null,
            editedItem: null,
            justDeleted: null,
            isNavigationView: this.props.isNavView ? this.props.isNavView : true,
            calMaxHeight: null,
            direction: -1,
            showDialog: '',
            sortDirection: SORT_ALPHABETIC_DESC,
            categoriesSortDirection: SORT_ALPHABETIC_DESC,
            tagsIdChecked: false,
            searchTerm:'',
            searchResultInitialized: false,
            showSearchResults: false,
            searchResultsSortDirection: SORT_ALPHABETIC_DESC,
            searchResult: null,
            showInCategorySearch: false,
            inCategorySearchTerm: ''
        }

        this.handleEditTagOrCategory = this.handleEditTagOrCategory.bind(this);
        this.saveCategoryOrTag = this.saveCategoryOrTag.bind(this);
        this.handleNameChange = this.handleNameChange.bind(this);

        this.inCategorySearchRef = React.createRef();
    }

    setInitState = () => {
        this.setState({
            rootCategories: this.props.tags,
            selectedCategory: null,
            selectedCategories: [],
            sortUp: true,
            showModal: false,
            type: TYPE_CATEGORY,
            name: "",
            tags: [],
            editedItemName: null,
            editedItem: null,
            justDeleted: null,
            isNavigationView: this.props.isNavView ? this.props.isNavView : true,
        })
    }

    _calculateTagsContentHeight = () => {
        if(!this.state.showSearchResults) {
            const h1 = document.getElementById('tm-wrapper-id').clientHeight;
            const h2 = document.getElementById('tm-category-section').clientHeight;
            this.setState({
                calMaxHeight: (h1-h2 - 106) * 0.95
            })
        } else {
            const h1 = document.getElementById('tm-wrapper-id').clientHeight;
            this.setState({
                calMaxHeight: h1 - 200
            })
        }
    }

    handleResize = () => {
        if (!this.props.isModalOrTab){
            this._calculateTagsContentHeight();
        }
    }

    _isRootCategory = (name) => {
        return this.props.tags.some( cat => cat.name === name)
    }

    componentDidMount() {
        window.addEventListener('resize', this.handleResize)
        if (!this.props.isModalOrTab){
            this._calculateTagsContentHeight()
        }
        if (this.state.tagsIdChecked === false){
            this.props.addTagsId();
            this.setState({
                tagsIdChecked: true
            })
        }
    }

    componentWillUnmount() {
        window.removeEventListener('resize', this.handleResize)
    }

    componentWillReceiveProps(nextProps: Readonly<P>, nextContext: any) {
        if (this.state.selectedCategory && this.state.selectedCategory.children){
            this.setState({
                tags: sortTagsAlphabeticallyOrByDate(getTagsOnly(this.state.selectedCategory.children) , this.state.sortDirection)
            })
        }

        if (nextProps.tags && nextProps.tags.length > 0){
            this._sortCategories(nextProps.tags , this.state.categoriesSortDirection);
            this.setState({
                rootCategories: sortTagsAlphabeticallyOrByDate(nextProps.tags , this.state.categoriesSortDirection)
            });
        }

        if(nextProps.tags && nextProps.tags.length === 0){
           this.setState({
               rootCategories: []
           })
        }

        if (this.state.selectedCategories.length > 0 && this.state.justDeleted !== null){
            const catName = this.state.justDeleted;
            const isRootCategory = this._isRootCategory(catName);
            if(!this.state.selectedCategories.some(cat => cat.name === catName)){
                this.setState({
                    justDeleted: null,
                })
            }
            else if(isRootCategory){
                this.setState({
                    selectedCategory: null,
                    selectedCategories: [],
                    tags: [],
                    justDeleted: null,
                })
            }else{
                const delCatIndex = this.findElementIndex(catName);
                if (delCatIndex > 0){
                    //TODO: fix bug after delete of category select parent cat
                    const selectedCategory = this.state.selectedCategories[delCatIndex-1];
                    const categories = this.state.selectedCategories.slice(0 , delCatIndex)
                    this.setState({
                        selectedCategory: selectedCategory,
                        selectedCategories: categories,
                        justDeleted: null,
                        tags: sortTagList(getTagsOnly(selectedCategory.children), this.state.sortDirection)
                    })
                }
            }
        }
    }

    handleNameChange = (value) => {
        this.setState({
            name: value
        })
    }

    isAlreadyInList = (name) => {
        return this.state.selectedCategories.some((el) => {
            return el.name === name;
        });
    }

    findElementIndex = (name) => {
        return this.state.selectedCategories.findIndex(x => x.name === name);
    }

    _findCategoryParentIndex = (catName) => {
        let res = -1;
        this.state.selectedCategories.forEach( (cat , index) => {
            if (cat.children.some( c => c.name === catName)){
                res =  index;
            }
        });
        return res;
    }

    _checkForSelectedSibiling = (category) => {
        let result = false;

        if (this.state.selectedCategories.length > 1 && this.state.selectedCategory) {
            const parent = this.state.selectedCategories[this.state.selectedCategories.length - 2];
            result = parent.children.indexOf(category) > -1;
        }

        return result;
    }

    _sortCategories = (categories , direction) => {
        categories.forEach( cat => {
            if (cat.children){
                sortTagsAlphabeticallyOrByDate(cat.children , direction)
                this._sortCategories(cat.children , direction);
            }
        });
    }

    _selectPath = (category) => {
        let categoriesPath = [];
        let parent;
        let idInSearch = category.id;
        do {
            parent = this._findParent(idInSearch);
            if(parent) {
                categoriesPath.unshift(parent);
                idInSearch = parent.id;
            }
        } while (parent)

        if(categoriesPath) {
            categoriesPath.push(category);
        }
        this.setState({
            selectedCategory: category,
            selectedCategories: categoriesPath,
            tags: sortTagsAlphabeticallyOrByDate(getTagsOnly(category.children), this.state.sortDirection)
        })
    }

    _selectCategory = (category) => {
        let categories = this.state.selectedCategories;
        let indexOfCategory = this.findElementIndex(category.name);

        if (this._isRootCategory(category.name)){
            this.setState({
                selectedCategory: category,
                selectedCategories: [category],
                tags: sortTagsAlphabeticallyOrByDate(getTagsOnly(category.children), this.state.sortDirection)
            })
        } else if (!this.isAlreadyInList(category.name)) {
            //check if it is direct sibling
            if (this._checkForSelectedSibiling(category)){
                categories.pop();
                categories.push(category);
                this.setState({
                    selectedCategory: category,
                    selectedCategories: categories,
                    tags: sortTagsAlphabeticallyOrByDate(getTagsOnly(category.children), this.state.sortDirection)
                })
            } else {
                //check if its child of currently selected component
                if (this.state.selectedCategory && this.state.selectedCategory.children){
                    const res = this.state.selectedCategory.children.some( ch => ch.name === category.name);
                    if (res){
                        categories.push(category);
                        this.setState({
                            selectedCategory: category,
                            selectedCategories: categories,
                            tags: sortTagsAlphabeticallyOrByDate(getTagsOnly(category.children), this.state.sortDirection)
                        })
                    } else {
                        const parentIndex = this._findCategoryParentIndex(category.name);
                        let res = categories.splice(0 , parentIndex + 1);
                        res.push(category);
                        this.setState({
                            selectedCategory: category,
                            selectedCategories: res,
                            tags: sortTagsAlphabeticallyOrByDate(getTagsOnly(category.children), this.state.sortDirection)
                        })
                    }
                }
            }
        } else {
            if (indexOfCategory === 0) {
                this.setState({
                    selectedCategory: category,
                    selectedCategories: categories.splice(0, 1),
                    tags: sortTagsAlphabeticallyOrByDate(getTagsOnly(category.children), this.state.sortDirection)
                })
            } else if (indexOfCategory === categories.length - 1){
            } else{
                categories = categories.splice(0 , indexOfCategory + 1);
                this.setState({
                    selectedCategory: category,
                    selectedCategories: categories,
                    tags: sortTagsAlphabeticallyOrByDate(getTagsOnly(category.children), this.state.sortDirection)
                })
            }
        }
    }

    _findParent = (childId) => {
        let parent = null;
        const findParent = (items) => {
            items.forEach(  item => {
                if (item.type === TYPE_CATEGORY){
                    if (item.children.some(cat => cat.id === childId)){
                        parent = item;
                    } else {
                        findParent(item.children)
                    }
                }
            })
        }
        findParent(this.props.tags);
        return parent;
    }

    _filterTags = (searchTerm) => {
        this.setState({
            inCategorySearchTerm: searchTerm,
        })
        if (this.state.selectedCategory && this.state.selectedCategory.children){
            if (searchTerm.length === 0){
                this.setState({
                    tags: getTagsOnly(this.state.selectedCategory.children)
                })
            }else{
                let  result = getTagsOnly(this.state.selectedCategory.children).filter(tag => {
                    return tag.name.toLowerCase().includes(searchTerm.toLowerCase());
                });
                this.setState({
                    tags: sortTagsAlphabeticallyOrByDate(result, this.state.sortDirection)
                })
            }
        }
    }

    _removeCategory = (category) => {
        let cats = this.state.selectedCategories.filter( cat => cat.name !== category.name);
        this.setState({
            selectedCategories: cats
        })
    }

    showSaveModal = (type) => {
        this.setState({
            showModal: true,
            type: type
        })
    }

    _toggle = () => {
        this.setState({
            name: '',
            showModal: false,
            editedItemName: null,
            editedItemNull: null
        })
    }

    saveCategoryOrTag = (e) => {
        e.preventDefault();

        const id = chance.guid();
        const { t } = this.props;

        if (containsOnlyWhiteSpace(this.state.name)){
            ee.emit(EVENT_SHOW_ALERT , t('keywords.dialog_modify_category.alert_category_name_is_whitespace'));
            return false;
        }

        if (this.state.type === TYPE_TAG && this.state.selectedCategory !== null){
            const newTag = createNewTag(id , this.state.name);
            if(getTagsOnly(this.state.selectedCategory.children).some( child => child.name.toUpperCase() === newTag.name.toUpperCase())){
                ee.emit(EVENT_SHOW_ALERT , t('keywords.dialog_modify_category.alert_tag_already_exit_in_selected_category', { name: newTag.name}));
            }else{
                this.props.addSubCategory(this.state.selectedCategory.name, newTag, false , this.state.selectedCategory.id)
                this.refreshState()
            }
        }
        if (this.state.type === TYPE_CATEGORY){
            const newCategory = createNewCategory(id , this.state.name);
            if (this.state.selectedCategory === null){
                if (!checkItemInParentCategory(this.props.tags , newCategory.name)){
                    this.props.createCategory(newCategory)
                }else{
                    ee.emit(EVENT_SHOW_ALERT , t('keywords.dialog_modify_category.alert_category_already_exit_selected_category', { name: newCategory.name}));
                }
            }else{
                if (this.state.selectedCategory.type !== TYPE_CATEGORY){
                    ee.emit(EVENT_SHOW_ALERT , t('keywords.dialog_modify_category.alert_cannot_add_category_to_non_category'));
                    return false;
                }else{
                    if(this.state.selectedCategory.children.filter(cat => cat.type === TYPE_CATEGORY).some( child => child.name.toUpperCase() === newCategory.name.toUpperCase())){
                        ee.emit(EVENT_SHOW_ALERT , t('keywords.dialog_modify_category.alert_category_already_exit_selected_category', { name: newCategory.name}));
                    }else{
                        this.props.addSubCategory(this.state.selectedCategory.name , newCategory , true , this.state.selectedCategory.id)
                    }
                }
            }
            this.refreshState()
        }
    }

    refreshState = () => {
        this.setState({
            name: '',
            showModal: false
        })
    }

    _backToInitState = () => {
        this.setState({
            selectedCategory: null,
            selectedCategories: [],
            tags: []
        })
    }

    handleEditTagOrCategory = (e , oldName , newName , item) => {
        e.preventDefault();
        const { t } = this.props;
        //no selected categories
        if (this._isRootCategory(newName)){
            if (this.props.tags.some(cat => cat.name === newName)){
                ee.emit(EVENT_SHOW_ALERT , t('keywords.dialog_modify_category.alert_category_name_already_exit'));
                return false;
            }else{
                this.props.editCategoryById(item, newName);
            }
        }
        const childId = item.id;
        let parent = null;

        const findParent = (items) => {
            items.forEach(  item => {
                if (item.type === TYPE_CATEGORY){
                    if (item.children.some(cat => cat.id === childId)){
                        parent = item;
                    }else{
                        findParent(item.children)
                    }
                }
            })
        }

        findParent(this.props.tags);

        const levelTags = getTagsOnly(this.state.selectedCategory.children);

        if (newName.length === 0){
            ee.emit(EVENT_SHOW_ALERT , t('keywords.dialog_modify_category.alert_category_name_is_empty'));
            return false;
        }

        if (containsOnlyWhiteSpace(newName)){
            ee.emit(EVENT_SHOW_ALERT , t('keywords.dialog_modify_category.alert_category_name_is_whitespace'));
            return false;
        }

        if (item.type === TYPE_TAG) {
            if (levelTags.some(tag => tag.name === newName)) {
                ee.emit(EVENT_SHOW_ALERT, t('keywords.dialog_modify_category.alert_tag_already_exit_in_selected_category', { name: newName}));
                return false;
            }else{
                this.props.editTagById(item , newName)
            }
        }else{
            if (parent !== null){
                if(parent.children.some( cat => cat.name === newName)){
                    ee.emit(EVENT_SHOW_ALERT, t('keywords.dialog_modify_category.alert_category_already_exit_selected_category', { name: newName}));
                    return false;
                }else{
                    this.props.editCategoryById(item, newName);
                }
            }else{
                if (this.props.tags.some(cat => cat.name === newName)){
                    ee.emit(EVENT_SHOW_ALERT, t('keywords.dialog_modify_category.alert_category_already_exit_selected_category', { name: newName}));
                }else{
                    this.props.editCategoryById(item, newName);
                }
            }
        }

        this.setState({
            name: '',
            editedItemName: null,
            editedItem: null,
            showModal: false,
            type: TYPE_TAG
        });
    }

    handleContextMenu =  (e, data) => {
        const { t } = this.props;
        switch (data.action) {
            case 'edit':
                this.setState({
                    editedItemName: data.tagName,
                    editedItem: data.item,
                    name: data.tagName,
                    showModal: true,
                    type: data.type === TYPE_CATEGORY ? TYPE_CATEGORY : TYPE_TAG
                });
                break;
            case 'delete':
                const result = remote.dialog.showMessageBox(remote.getCurrentWindow () ,{
                    type: 'question',
                    buttons: ['Yes', 'No'],
                    message: `${data.type}: "${data.tagName}"`,
                    cancelId: 1,
                    detail: t('global.delete_confirmation')
                });
                if (result === 0) {
                    this.deleteTagOrCategory(data)
                }
                break;
        }
    }

    deleteTagOrCategory = (data) => {
        console.log('delete' , data);
        if (data.type === TYPE_TAG){
            this.props.deleteTag(data.item.id);
        }else{
            this.setState({
                justDeleted: data.tagName
            })
            setTimeout( ()=> {
                this.props.deleteTag(data.item.id);
            } , 50);
        }
    }

    handleTagOnDragStart = (event , item) => {
        const itm = JSON.stringify(item);
        event.dataTransfer.setData("tagName", item.name);
        event.dataTransfer.setData("item" , itm);
    }

    handleTagOnDragEnd = () => {
        ee.emit(EVENT_ON_TAG_DROP);
    }

    renderCategories = () => {
        const selectedCategoryIndex = this.state.selectedCategory ? this.state.selectedCategories.indexOf(this.state.selectedCategory) : null;
        if (this.state.selectedCategories && this.state.selectedCategories.length > 0){
            return this.state.selectedCategories.map( (selectedCategory, index) =>
                <Row key={`scr-${selectedCategory.id}`}>
                    <div key={`cln-${index}`} className={`category-list ${index === selectedCategoryIndex - 1 ? "category-list_selected" : ""}`}>
                        {
                            selectedCategory && selectedCategory.children && selectedCategory.children.length > 0 ?
                                selectedCategory.children.map( cat => {
                                    if (cat.type && cat.type === TYPE_CATEGORY){
                                        return   <ContextMenuTrigger id="tag-list-context-menu"
                                                                     key={cat.id}
                                                                     collect={() => {
                                                                         return {
                                                                             type: cat.type,
                                                                             tagName: cat.name,
                                                                             item: cat
                                                                         };
                                                                     }}>
                                            <Category
                                                _onDrop={this._onDrop}
                                                isInPath={this.state.selectedCategories.indexOf(cat) >= 0}
                                                selectCategory={this._selectCategory}
                                                category={cat}/>
                                        </ContextMenuTrigger>
                                    }
                                }) : null
                        }
                        {
                            this.state.selectedCategories.length - 1 === index ?
                                <AddItem isCategorySelected={true} showSaveModal={this.showSaveModal} type={TYPE_CATEGORY}/> : null
                        }
                    </div>
                </Row>
            )
        }
    }

    _tagPictureOrVideo = (event , tagName) => {
        event.preventDefault();
        if (this.props.isModalView){
            this.props.onTagSelected(tagName);
        }else{
            return false;
        }
    }

    createTagModelFromCSV = (f) => {
        let newTagModel = [];
        let uniqueCategories = [];

        const readInterface = readline.createInterface({
            input: fs.createReadStream(f.pop()),
            output: process.stdout,
            console: false
        });

        readInterface.on('line', (line) => {
            const category = line.split(/;(.+)/)[0];
            const tag = line.split(/;(.+)/)[1];
            if (uniqueCategories.includes(category)) {
                const index = uniqueCategories.indexOf(category);
                if (!newTagModel[index].children.some( t => t.name === tag)){
                    const newTag = createNewTag(chance.guid(), tag);
                    newTagModel[index].children.push(newTag);
                }
            } else {
                uniqueCategories.push(category);
                const newCategory = createNewCategory(chance.guid(), category);
                const newTag = createNewTag(chance.guid(), tag);
                newCategory.children = [newTag]
                newTagModel.push(newCategory);
            }
        });

        return newTagModel;
    }

    _importCSV = async () => {
        const { t } = this.props;
        const f = remote.dialog.showOpenDialog(remote.getCurrentWindow(), {
            properties: ['openFile'],
            filters: [{name: 'xlsx explore file', extensions: ['csv']}]
        });
        if (!f || f.length < 1) return;

        const newModelFromCSV = this.createTagModelFromCSV(f);

        setTimeout( ()=> {
            validateTagList(newModelFromCSV).then((isValid) => {
                if (newModelFromCSV.length === 0) {
                    ee.emit(EVENT_SHOW_ALERT , t('keywords.alert_csv_empty_content'));
                    return false;
                }
                if (isValid) {
                    let currentTagModel = this.props.tags;
                    const rootCats = getRootCategoriesNames(currentTagModel);
                    newModelFromCSV.forEach(rootCat => {
                        const index = rootCats.indexOf(rootCat.name);
                        if (index > -1) {
                            const oldCategory = currentTagModel[index];
                            currentTagModel[index] = mergeCategories(oldCategory, rootCat);
                        } else {
                            currentTagModel.push(rootCat);
                        }
                    })
                    this.props.importTagModel(currentTagModel);
                    setTimeout(() => {
                        this.setInitState();
                    }, 50)
                } else {
                    ee.emit(EVENT_SHOW_ALERT , t('keywords.alert_json_file_is_not_valid_bad_format'));
                }
            });
        } , 100);
    }

    _importTags = async () => {
        const { t } = this.props;
        const _ = remote.dialog.showOpenDialog(remote.getCurrentWindow(), {
            properties: ['openFile'],
            filters: [{name: 'JSON explore file', extensions: ['json']}]
        });
        if (!_ || _.length < 1) return;

        try {
            const newModel = await JSON.parse(fs.readFileSync(_.pop(), 'utf8'));
            await validateTagList(newModel).then( (isValid)=> {
                if (isValid){
                    let currentTagModel = this.props.tags;
                    const rootCats = getRootCategoriesNames(currentTagModel);

                    newModel.forEach( rootCat => {
                        const index = rootCats.indexOf(rootCat.name);
                        if (index > -1){
                            const oldCategory = currentTagModel[index];
                            currentTagModel[index] = mergeCategories(oldCategory , rootCat);
                        }else{
                            currentTagModel.push(rootCat);
                        }
                    })
                    this.props.importTagModel(currentTagModel);
                    this.setInitState();
                }else{
                    ee.emit(EVENT_SHOW_ALERT , t('keywords.alert_json_file_is_not_valid_bad_format'));
                }
            });
        }catch (e){
            console.log(e)
            ee.emit(EVENT_SHOW_ALERT , t('keywords.alert_json_file_is_not_valid'));
        }
    }

    _exportTags = () => {
        const tagsToExport = this.props.tags;
        const { t } = this.props;

        const now = new Date();
        let file = remote.dialog.showSaveDialog(remote.getCurrentWindow(), {
            title: 'Keywords',
            defaultPath: `Keywords-${formatDateForFileName(now)}.json`
        });
        if (!file || file.length < 1) return;

        if (!file.endsWith('.json')){
            file = file + '.json'
        }

        try {
            fs.writeFileSync(file, JSON.stringify(tagsToExport))
        } catch (err) {
            console.error(err)
        }

        const result = remote.dialog.showMessageBox(remote.getCurrentWindow(), {
            type: 'info',
            detail: file,
            message: t('global.export_finished'),
            buttons: ['OK', t('global.open_folder')],
            cancelId: 1
        });

        if (result === 1) {
            shell.showItemInFolder(file);
        }
    }

    _handleOnSortChange = (sortBy) => {
        if (this.state.selectedCategory !== null){
            const result = sortTagsAlphabeticallyOrByDate(this.state.tags, sortBy)
            this.setState({
                tags: result
            });
        }
    };

    isOrderedAlphabetically = (sortDirection) => {
        return sortDirection === SORT_ALPHABETIC_DESC || sortDirection === SORT_ALPHABETIC_ASC;
    }

    validateDropAction = (draggedItem, category) => {
        const { t } = this.props;
        let isValid = true;
        const name =  draggedItem.name;
        const id =  draggedItem.id;
        const type =  draggedItem.type;

        if (!name || !id || !type){
            ee.emit(EVENT_SHOW_ALERT , t('keywords.alert_missing_properties'));
            return false;
        }
        if (category.type !== TYPE_CATEGORY){
            ee.emit(EVENT_SHOW_ALERT , t('keywords.alert_must_be_added_to_category'));
            return  false;
        }
        if (category.id === draggedItem.id){
            ee.emit(EVENT_SHOW_ALERT , t('keywords.alert_can_not_add_category_to_its_self'));
            return  false;
        }
        return isValid;
    }

    refreshAfterMerge = (draggedCategoryName) => {
        const index = this.findElementIndex(draggedCategoryName);
        if (index > -1) {
            const cats = this.state.selectedCategories.slice(0 , index);
            const selectedCategoryIndex = index < 1 ?  null : index - 1;
            const selectedCategory = cats[selectedCategoryIndex];

            setTimeout( ()=> {
                this.setState({
                    selectedCategories: cats,
                    selectedCategory: selectedCategory,
                    tags: sortTagList(getTagsOnly(selectedCategory.children) , this.state.sortDirection)
                })
            } , 50);
        }
    }

    _onDrop = (e, category) => {
        const { t } = this.props;
        const draggedItem = JSON.parse(e.dataTransfer.getData("item"));
        const targetId = category.id;
        let parent = null;

        const isValid = this.validateDropAction(draggedItem , category);
        if (!isValid) return false;

        if (draggedItem.type === TYPE_TAG){
            const findParent = (items) => {
                items.forEach(  item => {
                    if (item.type === TYPE_CATEGORY){
                        if (item.children.some(cat => cat.id === draggedItem.id)){
                            parent = item;
                        }else{
                            findParent(item.children)
                        }
                    }
                })
            }
            const items = category.children.filter(item => item.type === draggedItem.type);
            findParent(this.props.tags);
            if (!items.some(item => item.name === draggedItem.name)){
                this.props.mergeTMTags(targetId , draggedItem , parent.id);
            }else{
                ee.emit(EVENT_SHOW_ALERT , t('keywords.alert_item_already_exits', { type: draggedItem.type}));
                return false;
            }
        } else {
            //if dragged item is father of category drop zone
            if (isChild(draggedItem.children , category.id)){
                ee.emit(EVENT_SHOW_ALERT , t('keywords.alert_can_not_move_category_to_subcategory'));
                return false;
            }

            const items = category.children.filter(item => item.type === draggedItem.type);
            if(this._isRootCategory(draggedItem.name)){
                if (this.props.tags.length === 1){
                    ee.emit(EVENT_SHOW_ALERT , t('keywords.alert_must_be_one_root_category'));
                    return false;
                }
                parent = {id: 'root'};
            } else {
                const findParent = (items) => {
                    items.forEach(  item => {
                        if (item.type === TYPE_CATEGORY){
                            if (item.children.some(cat => cat.id === draggedItem.id)){
                                parent = item;
                            }else{
                                findParent(item.children)
                            }
                        }
                    })
                }
                findParent(this.props.tags);
            }

            if (!items.some(item => item.name === draggedItem.name)){
                this.props.mergeTMTags(targetId , draggedItem , parent.id);
                this.refreshAfterMerge(draggedItem.name);
            } else {
                ee.emit(EVENT_SHOW_ALERT , t('keywords.alert_item_already_exits', { type: draggedItem.type}));
                return false;
            }
        }
    };

    mapTagsToFirstLetter = (tags) => {
        if (!tags || tags.isEmpty){
            return [];
        }
        let data = tags.reduce((r, e) => {

            // get first letter of name of current element
            let alphabet = e.name[0].toUpperCase();

            // if there is no property in accumulator with this letter create it
            if (!r[alphabet]) r[alphabet] = { alphabet, records: [e] }

            // if there is push current element to children array for that letter
            else r[alphabet].records.push(e);

            // return accumulator
            return r;
        }, {});

        return Object.values(data);
    }

    _onInCategorySearchClick = (show) => {
        this.setState({
            showInCategorySearch: show
        })
        if(show) {
            setTimeout(() => {
                this.inCategorySearchRef.current.focus()
            }, 100);
        }
    }

    renderTagsAlpha = (tags) => {
        const result = this.mapTagsToFirstLetter(tags);
        return  result.map((item, index) => {
            return (
                <div key={genId()}>
                    <div className="alphb-tags-main-div">
                        <div className="letter-div">
                            <u>
                                <b>{item.alphabet}</b>
                            </u>
                        </div>
                        <div className="category-list tag-items alph-tags">
                            {
                                item.records.map( item => {
                                    return (
                                        <div key={genId()} className="at-row-wrapper">
                                            <ContextMenuTrigger id="tag-list-context-menu"
                                                                holdToDisplay={-1}
                                                                collect={() => {
                                                                    return {
                                                                        tagName: item.name,
                                                                        type: TYPE_TAG,
                                                                        item: item
                                                                    };
                                                                }}>
                                                <div key={`tg-${index}-${item.name}`}
                                                     className="tm-tagItem"
                                                     onClick={(event) => this._tagPictureOrVideo(event, item.name)}
                                                     draggable={true}
                                                     onDragStart={(event) => this.handleTagOnDragStart(event, item)}
                                                     onDragEnd={event => this.handleTagOnDragEnd(event)}
                                                >{item.name}</div>
                                            </ContextMenuTrigger>
                                        </div>
                                    )
                                })
                            }
                        </div>
                    </div>
                </div>
            )
        });
    }

    renderTagsSection = (tags) => {
        if (!tags || tags.length === 0){
            return null;
        }
        return tags.map((item, index) => {
            if (item.type === TYPE_TAG) {
                return this.renderTag(item, index);
            }
        });
    }

    renderTag(item, index) {
        return (
            <ContextMenuTrigger id="tag-list-context-menu"
                                key={chance.guid()}
                                holdToDisplay={-1}
                                collect={() => {
                                    return {
                                        tagName: item.name,
                                        type: TYPE_TAG,
                                        item: item
                                    };
                                }}>
                <div key={`tg-d-${index}-${item.name}`}
                     className="tm-tagItem"
                     onClick={(event) => this._tagPictureOrVideo(event, item.name)}
                     draggable={true}
                     onDragStart={(event) => this.handleTagOnDragStart(event, item)}
                     onDragEnd={event => this.handleTagOnDragEnd(event)}
                >{item.name}</div>
            </ContextMenuTrigger>
        )
    }

    renderTagManager = () => {
        const { t } = this.props;
        return(
            <div>
                <div id="tm-category-section">

                    <Row className="tm-selected-categories">
                        <div className="sort-tags-tm">
                            {
                                this.state.showDialog === SORT_CATEGORY_DIALOG &&
                                <div className="sort-dialog sd-ct">
                                    <div
                                        className={classnames('di-tm', {'di-tm-selected': this.state.categoriesSortDirection === SORT_ALPHABETIC_DESC})}
                                        onClick={_ => {
                                            this._sortCategories(this.state.rootCategories , SORT_ALPHABETIC_DESC);
                                            this.setState({
                                                showDialog: '',
                                                categoriesSortDirection: SORT_ALPHABETIC_DESC,
                                                rootCategories: sortTagsAlphabeticallyOrByDate(this.state.rootCategories , SORT_ALPHABETIC_DESC)
                                            });
                                        }}>{t('popup_sort.alphabetical')}
                                        <img src={SELECTED_ICON} alt="checked"/>
                                    </div>
                                    <div
                                        className={classnames('di-tm', {'di-tm-selected': this.state.categoriesSortDirection === SORT_ALPHABETIC_ASC})}
                                        onClick={_ => {
                                            this._sortCategories(this.state.rootCategories ,SORT_ALPHABETIC_ASC);
                                            this.setState({
                                                showDialog: '',
                                                categoriesSortDirection: SORT_ALPHABETIC_ASC,
                                                rootCategories: sortTagsAlphabeticallyOrByDate(this.state.rootCategories , SORT_ALPHABETIC_ASC)
                                            });
                                        }}>{t('popup_sort.alphabetical_inverted')}
                                        <img src={SELECTED_ICON} alt="checked"/>
                                    </div>
                                    <div
                                        className={classnames('di-tm', {'di-tm-selected': this.state.categoriesSortDirection === SORT_DATE_DESC})}
                                        onClick={_ => {
                                            this._sortCategories(this.state.rootCategories ,SORT_DATE_DESC);
                                            this.setState({
                                                showDialog: '',
                                                categoriesSortDirection: SORT_DATE_DESC,
                                                rootCategories: sortTagsAlphabeticallyOrByDate(this.state.rootCategories , SORT_DATE_DESC)
                                            });
                                        }}>{t('popup_sort.newest_to_oldest')}
                                        <img src={SELECTED_ICON} alt="checked"/>
                                    </div>
                                    <div
                                        className={classnames('di-tm', {'di-tm-selected': this.state.categoriesSortDirection === SORT_DATE_ASC})}
                                        onClick={_ => {
                                            this._sortCategories(this.state.rootCategories ,SORT_DATE_ASC);
                                            this.setState({
                                                showDialog: '',
                                                categoriesSortDirection: SORT_DATE_ASC,
                                                rootCategories: sortTagsAlphabeticallyOrByDate(this.state.rootCategories , SORT_DATE_ASC)
                                            });
                                        }}>{t('popup_sort.oldest_to_newest')}
                                        <img src={SELECTED_ICON} alt="checked"/>
                                    </div>
                                </div>
                            }
                        </div>
                        <span className="centerTextMiddle sc-label">{t('keywords.lbl_selected_categories')}:</span>
                        <div  className="tm-home">
                            <div className="path-items">
                                <span className="centerTextMiddle goHome" onClick={ ()=> this._backToInitState()}>{t('global.home')}</span>
                                <span className="arrow-span"><FontAwesomeIcon className="tm-fa-icon" icon={faArrowRight}/></span>
                            </div>
                        </div>

                        {
                            this.state.selectedCategories.length > 0 ?
                                <div  className="tm-breadcrumb">
                                    {
                                        this.state.selectedCategories.map( (cat , index) => {
                                            return (
                                                <div className="path-items" key={chance.guid()}>
                                                    <Category isInMenu={true} key={`cat-${index}`} selectCategory={this._selectCategory} category={cat}/>
                                                    {
                                                        this.state.selectedCategories.length -1 !== index ?
                                                            <span className="arrow-span"><FontAwesomeIcon className="tm-fa-icon" icon={faArrowRight}/></span> : null
                                                    }
                                                </div>)
                                        })

                                    }
                                </div> : <div  className="tm-breadcrumb"/>
                        }
                        <span title={t('keywords.sort_tooltip_categories')}
                              className={classnames("sort-icon" , "si-tm" , {'sort-selected-icon': this.state.showDialog === SORT_CATEGORY_DIALOG})}
                              onClick={_ => {
                                  if (this.state.showDialog === SORT_CATEGORY_DIALOG)
                                      this.setState({showDialog: ''});
                                  else
                                      this.setState({showDialog: SORT_CATEGORY_DIALOG});
                              }}/>
                    </Row>
                    <Row>
                        <div className={`category-list ${this._isRootCategory(this.state.selectedCategory?.name) ? "category-list_selected" : ""}`}>
                            {
                                this.state.rootCategories.map((cat, index) => {
                                    return (
                                        <ContextMenuTrigger
                                            key={`cm-${index}`}
                                            id="tag-list-context-menu"
                                            collect={() => {
                                                return {
                                                    type: cat.type,
                                                    tagName: cat.name,
                                                    item: cat
                                                };
                                            }}>
                                            <Category
                                                _onDrop={this._onDrop}
                                                isInPath={this.state.selectedCategories.indexOf(cat) >= 0}
                                                selectCategory={this._selectCategory} key={`category-${index}`}
                                                category={cat}
                                            />
                                        </ContextMenuTrigger>
                                    )
                                })
                            }
                            {
                                !this.state.selectedCategory ?
                                    <AddItem isCategorySelected={true} showSaveModal={this.showSaveModal}
                                             type={TYPE_CATEGORY}/> : null

                            }

                        </div>
                    </Row>
                    {
                        this.renderCategories()
                    }
                    <Row>
                        <div className="tag-filter">
                            <span className="tags-text-center"><b>{t('keywords.lbl_keywords')}</b></span>
                            <div className="search">
                                {
                                    this.state.showInCategorySearch ?
                                        <div className="in-category-search">
                                            <div className="searchButton">
                                                <i className="fa fa-search margin-auto"/>
                                            </div>
                                            <input type="text" className="searchTerm"
                                                   ref={this.inCategorySearchRef}
                                                   placeholder={t('keywords.textbox_placeholder_search_keywords')}
                                                   onChange={(e) => this._filterTags(e.target.value)}
                                                   value={this.state.inCategorySearchTerm} onKeyUp={(e) => {
                                                       if(e.key === "Escape") this._onInCategorySearchClick(false)
                                                   }
                                            }/>
                                        </div>
                                        : <i className="fa fa-search pointer in-category-search-btn"
                                             onClick={ () => {
                                                 this._onInCategorySearchClick(true)
                                             }
                                        }/>
                                }
                                <div className="sort-tags-tm">
                                    <span title={t('keywords.sort_tooltip_tags')}
                                          className={classnames("sort-icon" , "si-tm-tags" , {'sort-selected-icon': this.state.showDialog === SORT_DIALOG})}
                                          onClick={_ => {
                                              if (this.state.showDialog === SORT_DIALOG)
                                                  this.setState({showDialog: ''});
                                              else
                                                  this.setState({showDialog: SORT_DIALOG});
                                          }}/>
                                    {this.state.showDialog === SORT_DIALOG ?
                                        <div className="sort-dialog sd-tm">
                                            <div
                                                className={classnames('di-tm', {'di-tm-selected': this.state.sortDirection === SORT_ALPHABETIC_DESC})}
                                                onClick={_ => {
                                                    this._handleOnSortChange(SORT_ALPHABETIC_DESC);
                                                    this.setState({showDialog: '' , sortDirection: SORT_ALPHABETIC_DESC});
                                                }}>{t('popup_sort.alphabetical')}
                                                <img src={SELECTED_ICON} alt="checked"/>
                                            </div>
                                            <div
                                                className={classnames('di-tm', {'di-tm-selected': this.state.sortDirection === SORT_ALPHABETIC_ASC})}
                                                onClick={_ => {
                                                    this._handleOnSortChange(SORT_ALPHABETIC_ASC);
                                                    this.setState({showDialog: '' , sortDirection: SORT_ALPHABETIC_ASC});
                                                }}>{t('popup_sort.alphabetical_inverted')}
                                                <img src={SELECTED_ICON} alt="checked"/>
                                            </div>
                                            <div
                                                className={classnames('di-tm', {'di-tm-selected': this.state.sortDirection === SORT_DATE_DESC})}
                                                onClick={_ => {
                                                    this._handleOnSortChange(SORT_DATE_DESC);
                                                    this.setState({showDialog: '' , sortDirection: SORT_DATE_DESC});
                                                }}>{t('popup_sort.newest_to_oldest')}
                                                <img src={SELECTED_ICON} alt="checked"/>
                                            </div>
                                            <div
                                                className={classnames('di-tm', {'di-tm-selected': this.state.sortDirection === SORT_DATE_ASC})}
                                                onClick={_ => {
                                                    this._handleOnSortChange(SORT_DATE_ASC);
                                                    this.setState({showDialog: '' , sortDirection: SORT_DATE_ASC});
                                                }}>{t('popup_sort.oldest_to_newest')}
                                                <img src={SELECTED_ICON} alt="checked"/>
                                            </div>
                                        </div> : ''
                                    }
                                </div>
                            </div>
                        </div>
                    </Row>
                </div>
                {/*TAG-SECTION*/}
                {
                    !this.isOrderedAlphabetically(this.state.sortDirection) ?
                        <Row className="tag-section-row">
                            {
                                this.state.selectedCategory !== null && this.state.selectedCategory.name ?
                                    <div id="tm-tag-section" className="category-list tag-items overflowY-auto" style={{maxHeight : this.state.calMaxHeight !== null ? this.state.calMaxHeight : '100%'}}>
                                        {
                                            this.renderTagsSection(this.state.tags)
                                        }
                                        <AddItem isCategorySelected={this.state.selectedCategory.name} showSaveModal={this.showSaveModal} type={TYPE_TAG}/>
                                    </div> : null
                            }
                        </Row> :
                        <div className={`'x-hidden tags-alphabet ${this.props.screen ? '' : 'overflowY-auto '}`} style={{maxHeight : this.state.calMaxHeight !== null ? this.state.calMaxHeight : '100%'}}>
                            {
                                this.state.selectedCategory !== null && this.state.selectedCategory.name ?
                                    <div>
                                        <Row className="no-margin">
                                            <Col sm={12} md={12} lg={12} className="category-list">
                                                <div className="tm-add-tag btn-primary"
                                                     onClick={ ()=> {
                                                         if (this.state.selectedCategory) {
                                                             this.showSaveModal(TYPE_TAG)
                                                         } else {
                                                             ee.emit(EVENT_SHOW_ALERT , t('keywords.alert_to_add_a_new_keyword_you_need_to_select_category'))
                                                         }
                                                     }}>
                                                    <span title={t('keywords.btn_tooltip_add_new_keyword')} className= "new-category-tag-icon"/>
                                                    <span className="cursor-pointer">{t('keywords.btn_add_new_keyword')}</span>
                                                </div>
                                            </Col>
                                        </Row>
                                        {
                                            this.renderTagsAlpha(this.state.tags)
                                        }
                                    </div> : null
                            }
                        </div>
                }
                <div>
                    <Modal isOpen={this.state.showModal} autoFocus={false} toggle={this._toggle} wrapClassName="bst rcn_inspector pick-tag">
                        <ModalHeader toggle={this._toggle}>{
                            this.state.editedItemName !== null ?
                                this.state.type === TYPE_CATEGORY ? t('keywords.dialog_modify_category.title_edit_new_category') : t('keywords.dialog_modify_category.title_edit_new_keyword') :
                                this.state.type === TYPE_CATEGORY ? t('keywords.dialog_modify_category.title_create_new_category') : t('keywords.dialog_modify_category.title_create_new_keyword')
                        }
                        </ModalHeader>
                        <ModalBody>
                            <Form>
                                <InputGroup>
                                    <Input placeholder={t('keywords.dialog_modify_category.textbox_placeholder_enter_name')}
                                           autoFocus={true}
                                           value={this.state.name}
                                           onChange={(e) => this.handleNameChange(e.target.value)}/>
                                    <InputGroupAddon addonType="append">
                                        {
                                            this.state.editedItemName !== null ?
                                                <Button type="submit" color="primary" onClick={(e) => this.handleEditTagOrCategory(e , this.state.editedItemName , this.state.name , this.state.editedItem)}>{t('global.save')}</Button> :

                                                <Button type="submit" color="primary"
                                                        onClick={(e) => this.saveCategoryOrTag(e)}>{t('global.save')}</Button>
                                        }
                                    </InputGroupAddon>
                                </InputGroup>
                            </Form>
                        </ModalBody>
                        <ModalFooter>
                            <Button color="secondary" onClick={this._toggle}>Close</Button>
                        </ModalFooter>
                    </Modal>
                </div>
                <div>
                    <ContextMenu id="tag-list-context-menu">
                        <MenuItem data={{action: 'edit'}} onClick={this.handleContextMenu}>
                            {t('global.edit')}
                        </MenuItem>
                        <MenuItem divider />
                        <MenuItem data={{action: 'delete'}} onClick={this.handleContextMenu}>
                            {t('global.delete')}
                        </MenuItem>
                    </ContextMenu>
                </div>
            </div>
        );
    }

    _searchTags = (searchTerm) => {
        const initializedSearch = this.state.searchResultInitialized;
        this.setState({
            showSearchResults : true,
            searchTerm: searchTerm,
            searchResultInitialized: true
        })
        if(!initializedSearch) {
            setTimeout(() => {this.handleResize()}, 100);
        }
    }

    _findSearchResultsForCategory = (path, category, searchTerm, result) => {
        let tags = sortTagsAlphabeticallyOrByDate(this._filterTagsByCategory(category, searchTerm), this.state.searchResultsSortDirection);
        path.push(category);
        if(tags && tags.length > 0) {
            result.push({
                    path: [...path],
                    tags: tags
                }
            );
        }
        if(category.children) {
            let subcategories = getRootCategories(category.children);
            if(subcategories) {
                for (const subcategory of subcategories) {
                    this._findSearchResultsForCategory(path, subcategory, searchTerm, result)
                }
            }
        }
    }

    _filterTagsByCategory = (category, searchTerm) => {
        if (category && category.children){
            if (searchTerm.length === 0){
                return getTagsOnly(category.children);
            } else {
                return getTagsOnly(category.children).filter(tag => {
                    return tag.name.toLowerCase().includes(searchTerm.toLowerCase());
                });
            }
        }
    }

    _onBackFromSearch = () => {
        this.setState({
            showSearchResults : false,
            searchTerm: ''
        })
    }

    _handleOnSearchResultsSortChange = (sortBy) => {
        if(this.state.searchResultsSortDirection === sortBy) return;
        this.setState({
            showDialog: '',
            searchResultsSortDirection: sortBy
        });
    };

    renderSearchResults = () => {
        const { t } = this.props;
        let rootCategories = sortTagsAlphabeticallyOrByDate(getRootCategories(this.props.tags) , this.state.searchResultsSortDirection)
        let result = []
        if(this.state.searchTerm.trim()) {
            for (const category of rootCategories) {
                this._findSearchResultsForCategory([], category, this.state.searchTerm, result);
            }
        }

        return(
            <div className="tm-container-search-results">
                <div className="tm-container-search-results-header">
                    <Button color="primary" onClick={this._onBackFromSearch}>{t('keywords.btn_back_to_keywords')}</Button>
                    <div className="sort-tags-search-results">
                        <span title={t('keywords.sort_tooltip_tags')}
                              className={classnames("sort-icon", "si-tm-tags1", {'sort-selected-icon': this.state.showDialog === SORT_SEARCH_RESULTS_DIALOG})}
                              onClick={_ => {
                                  _.preventDefault();
                                  if (this.state.showDialog === SORT_SEARCH_RESULTS_DIALOG)
                                      this.setState({showDialog: ''});
                                  else
                                      this.setState({showDialog: SORT_SEARCH_RESULTS_DIALOG});
                              }}
                        />
                        {this.state.showDialog === SORT_SEARCH_RESULTS_DIALOG &&
                            <div className="sort-dialog sd-tm">
                                <div
                                    className={classnames('di-tm', {'di-tm-selected': this.state.searchResultsSortDirection === SORT_ALPHABETIC_DESC})}
                                    onClick={_ => {
                                        this._handleOnSearchResultsSortChange(SORT_ALPHABETIC_DESC);
                                    }}>{t('popup_sort.alphabetical')}
                                    <img src={SELECTED_ICON} alt="checked"/>
                                </div>
                                <div
                                    className={classnames('di-tm', {'di-tm-selected': this.state.searchResultsSortDirection === SORT_ALPHABETIC_ASC})}
                                    onClick={_ => {
                                        this._handleOnSearchResultsSortChange(SORT_ALPHABETIC_ASC);
                                    }}>{t('popup_sort.alphabetical_inverted')}
                                    <img src={SELECTED_ICON} alt="checked"/>
                                </div>
                                <div
                                    className={classnames('di-tm', {'di-tm-selected': this.state.searchResultsSortDirection === SORT_DATE_DESC})}
                                    onClick={_ => {
                                        this._handleOnSearchResultsSortChange(SORT_DATE_DESC);
                                    }}>{t('popup_sort.newest_to_oldest')}
                                    <img src={SELECTED_ICON} alt="checked"/>
                                </div>
                                <div
                                    className={classnames('di-tm', {'di-tm-selected': this.state.searchResultsSortDirection === SORT_DATE_ASC})}
                                    onClick={_ => {
                                        this._handleOnSearchResultsSortChange(SORT_DATE_ASC);
                                    }}>
                                    {t('popup_sort.oldest_to_newest')}
                                    <img src={SELECTED_ICON} alt="checked"/>
                                </div>
                            </div>
                        }
                    </div>
                </div>
                {result &&
                    <div className={`tm-container-search-results-content  ${this.props.screen ? '' : 'overflowY-auto' }`} style={{maxHeight : this.state.calMaxHeight !== null ? this.state.calMaxHeight : '100%'}}>
                        {result.map((resultItem, index) => {
                            return this.renderSearchResultItem(resultItem);
                        })}
                    </div>
                }
            </div>
        )
    }

    renderSearchResultItem = (searchResultItem) => {
        return (
            <div className="tm-container-search-results-item" key={chance.guid()}>
                <div className="tm-container-search-results-item-path">
                    {
                        searchResultItem.path.map((cat, index) => {
                                return <div className="path-item" key={chance.guid()}>
                                    <Category isInMenu={true} key={`cat-${index}`} selectCategory={() => {
                                        this._selectPath(cat);
                                        this._onBackFromSearch();
                                    }} category={cat}/>
                                    { searchResultItem.path.length -1 !== index &&
                                        <span className="arrow-span">
                                            <FontAwesomeIcon className="tm-fa-icon" icon={faArrowRight}/>
                                        </span>
                                    }
                                </div>
                            }
                        )
                    }
                </div>
                {

                    this.isOrderedAlphabetically(this.state.searchResultsSortDirection) ?
                        <div className={`x-hidden tags-alphabet`}>
                            <div>
                                {
                                    this.renderTagsAlpha(searchResultItem.tags)
                                }
                            </div>
                        </div>
                        :
                        <Row className="tag-section-row">
                            <div className="category-list tag-items overflowY-auto">
                                {
                                    this.renderTagsSection(searchResultItem.tags)
                                }
                            </div>
                        </Row>
                }
            </div>

        );
    }

    render() {
        const { t } = this.props;
        return (
            <Container className="bst tm-container" >
                {!this.props.isModalOrTab ? <div>
                    <PageTitle
                        logo={TAGS_IMAGE_CONTEXT}
                        showProjectInfo={false}
                        pageTitle={t('keywords.title')}
                        docLink={"keywords"}>
                    </PageTitle>

                    <Row className="vertical-spread">
                        <hr/>
                        <Col sm={6} md={6} lg={6}>
                            <div className="tagManager-buttonGroups">
                                <Button color="primary" className="tm-import-button" onClick={ ()=> this._importTags()}>
                                    <img src={require('./pictures/add-folder.svg')} width={16} alt="import keywords"/>
                                    {t('keywords.btn_import_keywords')}
                                </Button>
                                <Button color="primary" className="tm-import-button" onClick={ ()=> this._exportTags()}>
                                    <img src={require('./pictures/add-folder.svg')} width={16} alt="export keywords"/>
                                    {t('keywords.btn_export_keywords')}
                                </Button>
                                <Button color="primary"  className="tm-import-button" onClick={ ()=> this._importCSV("csv")}>
                                    <img src={require('./pictures/add-folder.svg')} width={16} alt="export keywords"/>
                                    {t('keywords.btn_import_csv')}
                                </Button>
                            </div>
                        </Col>
                        <Col sm={6} md={6} lg={6}>
                            <div className="category-tag-info-list">
                                <CategoryTagInfo text={t('keywords.lbl_category')} color="#2f78ce"/>
                                <CategoryTagInfo text={t('keywords.lbl_selected_category')} color="#333333"/>
                                <CategoryTagInfo text={t('keywords.lbl_keyword')} color="#ff9800"/>
                            </div>
                        </Col>
                    </Row>
                </div> : null
                }
                <div id="tm-wrapper-id" className="tagManager-wrapper">
                    <div className="search">
                        <div className="searchButton">
                            <i className="fa fa-search margin-auto"/>
                        </div>
                        <input type="text" className="searchTerm" placeholder= {t('keywords.textbox_placeholder_search_keywords')} onChange={ (e) => this._searchTags(e.target.value)} value={this.state.searchTerm}/>
                    </div>
                    { this.state.showSearchResults ? this.renderSearchResults() : this.renderTagManager()}
                </div>
            </Container>
        );
    }
}

export default TagManager;
