import React, {Component, Fragment} from 'react';
import {
    Button,
    Modal,
    ModalBody,
    ModalFooter,
    ModalHeader,
} from 'reactstrap';

import styled from "styled-components";
import LeafletMap from "./LeafletMap";

const _MapPlaceholder = styled.div`
    width: 100%;
    height: 650px;
    position: relative;
`;

export default class extends Component {
    constructor(props) {
        super(props);
        this.state = {
            locations: [],
            openModal: props.openModal,
        };
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if (prevProps.openModal !== this.props.openModal)
            this.setState({
                openModal: this.props.openModal
            });
    }

    render() {
        const { t } = this.props;
        return (
            <div>
                <Modal isOpen={this.state.openModal} className="myCustomModal" toggle={this._toggle} contentClassName="custom-modal-style" wrapClassName="bst rcn_inspector pick-tag"
                       scrollable={false}
                       autoFocus={false}>
                    <ModalHeader toggle={this._toggle}>
                        {/*{t('inspector.pick_tag.dialog_title_pick_a_keyword')}*/}
                    </ModalHeader>
                    <ModalBody>
                        <_MapPlaceholder>
                            <LeafletMap locations={this.props.locations}
                                        selectedResources = {[]}
                                        fitToBounds = "false">
                            </LeafletMap>
                        </_MapPlaceholder>
                    </ModalBody>
                    <ModalFooter>
                        <Button color="secondary" onClick={this._toggle}>{t('global.close')}</Button>
                    </ModalFooter>
                </Modal>
            </div>
        );
    }

    _toggle = () => {
        this.setState({
        });
        if(this.props.onClose) {
            this.props.onClose();
        }
    };

}
