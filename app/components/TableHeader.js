import React, {PureComponent} from 'react';
import classnames from "classnames";

export const ASC = 'ASC';
export const DESC = 'DESC';

class TableHeader extends PureComponent {
    constructor(props) {
        super(props);
        this.state = {
            direction: ''
        }
    }

    componentWillReceiveProps(nextProps) {
        if (this.props.sortKey !== nextProps.sortedBy) {
            this.setState({
                direction: ''
            });
        }
    }

    render() {
        return (this.props.sort !== undefined ?
            <th style={{cursor: 'pointer', whiteSpace: 'nowrap'}} onClick={this._sort}>
                <span>{this.props.title}</span>
                <i className={classnames({
                "fa fa-fw fa-sort-asc": this.state.direction === ASC,
                "fa fa-fw fa-sort-desc": this.state.direction === DESC,
                "fa fa-fw fa-sort": this.state.direction === '',
            })}/>
            </th> :
            <th style={{whiteSpace: 'nowrap'}}>
                <span>{this.props.title}</span>
            </th>);
    }

    _sort = () => {
        const direction = this.state.direction === ASC ? DESC : ASC
        this.setState({
            direction: direction
        });
        this.props.sort(this.props.sortKey, direction);
    }
}

export default TableHeader;
