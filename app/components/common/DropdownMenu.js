import {DropdownItem, DropdownMenu} from "reactstrap";
import React, {Component} from 'react';
import i18next from "i18next";

class AnnotationDropdownMenu extends Component {
    render() {
        const { t } = i18next;
        return (
            <DropdownMenu>
                <DropdownItem onClick={() => {
                    this.props.exportXlsx(';')
                }}>{t('results.dropdown_item_export_to_single_file')} - {t('results.dropdown_item_use_semicolon_separator')}</DropdownItem>
                <DropdownItem onClick={() => {
                    this.props.exportXlsx(',')
                }}>{t('results.dropdown_item_export_to_single_file')} - {t('results.dropdown_item_use_comma_separator')}</DropdownItem>
                <DropdownItem onClick={() => {
                    this.props.exportXlsx('\t')
                }}>{t('results.dropdown_item_export_to_single_file')} - {t('results.dropdown_item_use_tab_separator')}</DropdownItem>
                <DropdownItem onClick={() => {
                    this.props.exportToZip(';')
                }}>{t('results.dropdown_item_export_to_separate_files')} - {t('results.dropdown_item_use_semicolon_separator')}</DropdownItem>
                <DropdownItem onClick={() => {
                    this.props.exportToZip(',')
                }}>{t('results.dropdown_item_export_to_separate_files')} - {t('results.dropdown_item_use_comma_separator')}</DropdownItem>
                <DropdownItem onClick={() => {
                    this.props.exportToZip('\t')
                }}>{t('results.dropdown_item_export_to_separate_files')} - {t('results.dropdown_item_use_tab_separator')}</DropdownItem>
            </DropdownMenu>
        );
    }
}

export  default AnnotationDropdownMenu;
