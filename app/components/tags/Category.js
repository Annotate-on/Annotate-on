import React, {Component} from 'react';

class Category extends Component {

    constructor(props) {
        super(props);
    }

    handleCategoryOnDragStart = (event , item) => {
        const itm = JSON.stringify(item);
        event.dataTransfer.setData("tagName", item.name);
        event.dataTransfer.setData("item" , itm);
    }

    render() {
        return (
            <div
                draggable={!this.props.isInMenu}
                onDragStart={(event) => this.handleCategoryOnDragStart(event, this.props.category)}
                onDragOver={e => {
                    e.preventDefault();
                    e.stopPropagation();
                }}
                onDrop={e => {
                    e.preventDefault();
                    e.stopPropagation();
                    this.props._onDrop(e , this.props.category)
                }}
                className={this.props.isInMenu ? 'category_breadcrumb' : this.props.isInPath ? 'category_selected' : 'category'}  onClick={ ()=> this.props.selectCategory(this.props.category)}>
                <div className={this.props.isInMenu ? 'category_breadcrumb-title' : "category-left-element"}>
                    {this.props.category.name}
                </div>
            </div>
        );
    }
}

export default Category;