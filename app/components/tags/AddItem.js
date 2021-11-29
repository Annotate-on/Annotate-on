import React, {Component} from 'react';
import {TYPE_CATEGORY, TYPE_TAG} from "../event/Constants";
import {EVENT_SHOW_ALERT} from "../../utils/library";

class AddItem extends Component {

    constructor(props) {
        super(props);
    }

    showModal = () => {
        this.props.showSaveModal(this.props.type);
    }

    render() {
        const title = this.props.type === TYPE_CATEGORY ? 'Add new category' : 'Add new keyword';
        return (
            <div className="add-category"
                 onClick={ ()=> {
                     if (this.props.type === TYPE_TAG){
                         if (this.props.isCategorySelected){
                             this.showModal()
                         }else{
                             ee.emit(EVENT_SHOW_ALERT , 'To add a tag you need to select category first...')
                         }
                     }else{
                         this.showModal()
                     }
                 }}>
                 <span title={title} className= "new-category-tag-icon"/>
                <span className="cursor-pointer">{title}</span>
            </div>
        );
    }
}

export default AddItem;