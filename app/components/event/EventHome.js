import React, {Component} from 'react';
import styled from "styled-components";
import {getAllPicturesDirectories} from "../../utils/config";

const _Root = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
`;

const _Content = styled.div`
  display: flex;
  flex-direction: row;
  height: 100%;
  width: 100%;
`;

// PICTURES

const _EventPanel = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
`;

class EventHome extends Component {

    constructor(props) {
        super(props);
        const folders = getAllPicturesDirectories();

        if (this.props.tabData[this.props.tabName] !== undefined &&
            this.props.tabData[this.props.tabName].selected_folders !== undefined &&
            this.props.tabData[this.props.tabName].selected_folders.length > 0) {
            const selectedFolders = this.props.tabData[this.props.tabName].selected_folders;
            this.selectedFolder = folders.length ? selectedFolders[0] : null;
        } else {
            this.selectedFolder = folders.length ? folders[0].path : null;
        }

        this.state = {
            selectedFolder: this.selectedFolder
        }
    }

    render() {
        return (
            <_Root className="bst rcn_library">
                <h1>event home</h1>
                <_Content>
                    <_EventPanel/>
                </_Content>
            </_Root>
        );
    }
}


export default EventHome;