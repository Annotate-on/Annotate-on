import React, {Component} from 'react';
import i18next from "i18next";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {Button, Dropdown, DropdownItem, DropdownMenu, DropdownToggle} from "reactstrap";
import AnnotationDropdownMenu from "./common/DropdownMenu";
import {AND, EXP_ITEM_TYPE_CONDITION, EXP_ITEM_TYPE_EXPRESSION, EXP_ITEM_TYPE_OPERATOR, NOT, OR} from "../utils/tags";

export default class TagsFilter extends Component {

    constructor(props) {
        super(props);

        this.state = {
            dropdownOpen: false
        };
    }

    componentDidMount() {
    }

    componentDidUpdate() {
    }

    renderExpression = (item) => {
        // console.log("renderExpression", item)
        if(item && item.value) return (
            <div className="tags-filter-expression-container">
                <i className="fa fa-times" onClick={
                    (e) => {
                        this.props.onDeleteExpression(item.id)
                    }
                }></i>
                <div className="tags-filter-expression">
                    <div className="tags-filter-expression-brackets">
                        {item.value.map(item => {
                            if(item.type === EXP_ITEM_TYPE_EXPRESSION) {
                                return this.renderExpression(item);
                            } else if(item.type === EXP_ITEM_TYPE_OPERATOR) {
                                return this.renderOperator(item);
                            } else if(item.type === EXP_ITEM_TYPE_CONDITION) {
                                // console.log("render", this.renderCondition(item))
                                return this.renderCondition(item);
                            }
                        })}
                    </div>
                </div>
            </div>
        )
    }

    renderCondition = (item) => {
        // console.log("renderCondition", item)
        if(item && item.value) return (
            <div className="tags-filter-expression-keyword">{item.value.tag}
        </div>)
    }

    renderOperator = (item) => {
        const itemId = item.id + "open";
        return(
            <Dropdown title="" isOpen={this.state[itemId]} size="sm" color="primary"
                      toggle={() => {
                          this.setState(prevState => (
                              this.createOperatorState(itemId, prevState)
                          ));
                      }}>
                <DropdownToggle>{
                    item.value === AND ? '&' : item.value === OR ? '||' : '!'
                }</DropdownToggle>
                <DropdownMenu>
                    <DropdownItem onClick={(e) => {
                        this.props.onUpdateTagExpressionOperator(item.id, NOT)
                    }}>! NOT</DropdownItem>
                    <DropdownItem onClick={(e) => {
                        this.props.onUpdateTagExpressionOperator(item.id, AND)
                    }}>& AND</DropdownItem>
                    <DropdownItem onClick={(e) => {
                        this.props.onUpdateTagExpressionOperator(item.id, OR)
                    }}>|| OR</DropdownItem>
                </DropdownMenu>
            </Dropdown>

        );
    }

    createOperatorState = (itemId, prevState) => {
        const newState = {}
        newState[itemId] = prevState ? !prevState[itemId] : true;
        return newState;
    }

    render() {
        // console.log(" tags filter selected filter", this.props.filter)
        const {t} = i18next;
        return (
            <div className="tags-filter">
                <div className="tags-filter-header">
                    <i className="fa fa-filter"></i>
                    <span>Filter</span>
                    <Button size="sm" color="primary" onClick={
                        (e) => {
                            this.props.onCreateExpression();
                        }
                    }>
                        <i className="fa fa-plus-circle"/>(
                    </Button>
                </div>
                {
                    this.props.filter && this.props.filter.value &&
                    <div className="tags-filter-content">
                        {this.props.filter.value.map(item => {
                            if(item.type === EXP_ITEM_TYPE_EXPRESSION) {
                                return this.renderExpression(item);
                            } else if(item.type === EXP_ITEM_TYPE_OPERATOR) {
                                return this.renderOperator(item);
                            }
                        })}
                    </div>
                }
            </div>
        );
    }

}
