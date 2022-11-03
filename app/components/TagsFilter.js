import React, {Component} from 'react';
import i18next from "i18next";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {Button, Dropdown, DropdownItem, DropdownMenu, DropdownToggle} from "reactstrap";
import AnnotationDropdownMenu from "./common/DropdownMenu";

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

    render() {
        const {t} = i18next;
        return (
            <div className="tags-filter">
                <div className="tags-filter-header">
                    <i className="fa fa-filter"></i>
                    <span>Filter</span>
                    <Button size="sm" color="primary">
                        <i className="fa fa-plus-circle"/>(
                    </Button>
                </div>
                <div className="tags-filter-content">
                    <div className="tags-filter-expression-container">
                        <i className="fa fa-times"></i>
                        <div className="tags-filter-expression">
                            <div className="tags-filter-expression-brackets">
                                <div className="tags-filter-expression-keyword">
                                    Keyword 1
                                </div>
                                <Dropdown title="" isOpen={this.state.dropdownOpen} size="sm" color="primary" toggle={() => {
                                    this.setState(prevState => ({
                                        dropdownOpen: !prevState.dropdownOpen
                                    }));
                                }}>
                                    <DropdownToggle>||</DropdownToggle>
                                    <DropdownMenu>
                                        <DropdownItem>! NOT</DropdownItem>
                                        <DropdownItem text>& AND</DropdownItem>
                                        <DropdownItem>|| OR</DropdownItem>
                                    </DropdownMenu>
                                </Dropdown>
                                <div className="tags-filter-expression-keyword">
                                    Keyword 2
                                </div>
                                <Dropdown title="" isOpen={this.state.dropdownOpen1} size="sm" color="primary" toggle={() => {
                                    this.setState(prevState => ({
                                        dropdownOpen1: !prevState.dropdownOpen1
                                    }));
                                }}>
                                    <DropdownToggle>!</DropdownToggle>
                                    <DropdownMenu>
                                        <DropdownItem>! NOT</DropdownItem>
                                        <DropdownItem text>& AND</DropdownItem>
                                        <DropdownItem>|| OR</DropdownItem>
                                    </DropdownMenu>
                                </Dropdown>
                                <div className="tags-filter-expression-keyword">
                                    Keyword 3
                                </div>

                            </div>
                        </div>
                    </div>

                    <Dropdown title="" isOpen={this.state.dropdownOpen2} size="sm" color="primary" toggle={() => {
                        this.setState(prevState => ({
                            dropdownOpen2: !prevState.dropdownOpen2
                        }));
                    }}>
                        <DropdownToggle>&</DropdownToggle>
                        <DropdownMenu>
                            <DropdownItem>! NOT</DropdownItem>
                            <DropdownItem text>& AND</DropdownItem>
                            <DropdownItem>|| OR</DropdownItem>
                        </DropdownMenu>
                    </Dropdown>

                    <div className="tags-filter-expression-container">
                        <i className="fa fa-times"></i>
                        <div className="tags-filter-expression">
                            <div className="tags-filter-expression-brackets">
                                <div className="tags-filter-expression-keyword">
                                    Keyword 3
                                </div>
                                {/*<Dropdown title="" isOpen={this.state.dropdownOpen} size="sm" color="primary" toggle={() => {*/}
                                {/*    this.setState(prevState => ({*/}
                                {/*        dropdownOpen: !prevState.dropdownOpen*/}
                                {/*    }));*/}
                                {/*}}>*/}
                                {/*    <DropdownToggle>||</DropdownToggle>*/}
                                {/*    <DropdownMenu>*/}
                                {/*        <DropdownItem>! NOT</DropdownItem>*/}
                                {/*        <DropdownItem text>& AND</DropdownItem>*/}
                                {/*        <DropdownItem>|| OR</DropdownItem>*/}
                                {/*    </DropdownMenu>*/}
                                {/*</Dropdown>*/}
                                {/*<div className="tags-filter-expression-keyword">*/}
                                {/*    Keyword 2*/}
                                {/*</div>*/}
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        );
    }

}
