import {DropdownItem, DropdownMenu} from "reactstrap";
import React, {Component} from 'react';

class AnnotationDropdownMenu extends Component {
    render() {
        return (
            <DropdownMenu>
                <DropdownItem onClick={() => {
                    this.props.exportXlsx(';')
                }}>Export to single file - Use semicolon separator</DropdownItem>
                <DropdownItem onClick={() => {
                    this.props.exportXlsx(',')
                }}>Export to single file - Use comma separator</DropdownItem>
                <DropdownItem onClick={() => {
                    this.props.exportXlsx('\t')
                }}>Export to single file - Use tab separator</DropdownItem>
                <DropdownItem onClick={() => {
                    this.props.exportToZip(';')
                }}>Export to separate files - Use semicolon separator</DropdownItem>
                <DropdownItem onClick={() => {
                    this.props.exportToZip(',')
                }}>Export to separate files - Use comma separator</DropdownItem>
                <DropdownItem onClick={() => {
                    this.props.exportToZip('\t')
                }}>Export to separate files - Use tab separator</DropdownItem>
            </DropdownMenu>
        );
    }
}

export  default AnnotationDropdownMenu;