import React, {Component} from 'react';
import i18next from "i18next";
import {Button, Dropdown, DropdownItem, DropdownMenu, DropdownToggle} from "reactstrap";
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
        if(item && item.value) return (
            <div className="tags-filter-expression-container" key={item.id}>
                <i className="fa fa-times" title={t('tags.btn_tooltip_cancel_tags_filter_group')} onClick={
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
        if(item && item.value) return (
            <div className="tags-filter-expression-keyword" key={item.id}>{item.value.tag}
        </div>)
    }

    renderOperator = (item) => {
        const itemId = item.id + "_open";
        return(
            <Dropdown key={item.id} title="" isOpen={this.state[itemId]} size="sm" color="primary"
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
        const {t} = i18next;
        return (
            (this.props.filter && this.props.filter.value && this.props.filter.value.length > 0) ?
                <div className="tags-filter">
                    <div className="tags-filter-header">
                        <i className="fa fa-filter filter-icon"></i>
                        {/* <span>{t('tags.lbl_filter')}</span> */}
                        {/* <span></span> */}
                       
                        <span className="spacer"/>
                        <i className="fa fa-times btn-remove-filter" title={t('tags.btn_tooltip_cancel_tags_filter')} onClick={
                            (e) => {
                                this.props.onCancelFilter()
                            }
                        }/>
                    </div>
                    <div className="tags-filter-content">
                        {this.props.filter.value.map(item => {
                            if (item.type === EXP_ITEM_TYPE_EXPRESSION) {
                                return this.renderExpression(item);
                            } else if (item.type === EXP_ITEM_TYPE_OPERATOR) {
                                return this.renderOperator(item);
                            }
                        })}
                         <Button size="sm" color="link"  className="" onClick={
                            (e) => {
                                this.props.onCreateExpression();
                            }
                        }>
                            {/* <i className="fa fa-plus-circle"/> */}
                            
                            <span  className="add-icon" title={t('tags.btn_tooltip_add_new_group')}/>
                            

                            
                        </Button>
                    </div>
                </div>
                :
                <div></div>
        );
    }

}
