import React, {Component} from 'react';

class CategoryTagInfo extends Component {
    render() {
        return (
            <div className="category-tag-info">
                <i className="fa fa-circle"
                   style={{color: this.props.color}}
                   aria-hidden="true"/>
                <span>
                    {this.props.text}
                </span>
            </div>
        );
    }
}

export default CategoryTagInfo;