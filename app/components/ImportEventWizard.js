import React, {Component} from 'react';
import styled from 'styled-components';
import Tags from '../containers/Tags';
import {DOC_FG, DOC_ICON, DOC_ICON_HOVER} from '../constants/constants';
import {Col, Container,Row} from 'reactstrap';
import Folders from "../containers/Folders";
import EventForm from "../containers/EventForm";
import {getAllPicturesDirectories} from "../utils/config";

const RECOLNAT_LOGO = require('./pictures/logo.svg');

const _Root = styled.div`
  color: ${DOC_FG};
  height: 100%;
  overflow: hidden;
  width: 100%;
   display: flex;
   flex-direction: column;
  > * {
    // padding: 30px;
  }

  .link:hover {
    text-decoration: underline;
  }

  .icon {
    color: ${DOC_ICON};

    &:hover {
      color: ${DOC_ICON_HOVER};
    }
  }
`;

const _Content = styled.div`
  display: flex;
  height: 100%;
  width: 100%;
  overflow: hidden;
`;

const _RightColumn = styled.div`
  height: 100%;
  width: 100%;
`;

export default class extends Component  {

    constructor(props) {
        super(props);
        let pFolder = props.match.params.folderName === 'null' ? null : decodeURIComponent(props.match.params.folderName);
        if (pFolder === undefined || pFolder === 'undefined'){
            let parentFolder;
            const folders = getAllPicturesDirectories();
            if (this.props.tabData[this.props.tabName] !== undefined &&
                this.props.tabData[this.props.tabName].selected_folders !== undefined &&
                this.props.tabData[this.props.tabName].selected_folders.length > 0) {
                const selectedFolders = this.props.tabData[this.props.tabName].selected_folders;
                parentFolder = folders.length ? selectedFolders[0] : null
            } else {
                parentFolder = folders.length ? folders[0].path : null;
            }
            this.state = {
                parentFolder: parentFolder,
                tabName: this.props.tabName ? this.props.tabName : props.match.params.tabName
            };
        }else{
            this.state = {
                parentFolder: props.match.params.folderName === 'null' ? null : decodeURIComponent(props.match.params.folderName),
                tabName: this.props.tabName ? this.props.tabName : props.match.params.tabName
            };
        }
    }

    componentWillReceiveProps(nextProps: Readonly<P>, nextContext: any) {
        console.log('import event wizard recived props' , nextProps)
        if (nextProps.match.params.tabName !== null && this.state.tabName !== nextProps.match.params.tabName){
            this.setState({
                tabName: nextProps.tabName ? nextProps.tabName : nextProps.match.params.tabName
            })
        }
    }

    setSelectedFolder = (folder) => {
        this.setState({parentFolder: folder});
    };

    goToImage = (eventId) => {
        this.props.setPictureInSelection(eventId, this.state.tabName);
        this.props.goToImage();
    }

    componentWillUnmount() {
        this.props.emptyTagsList();
    }

    render() {
        return (
            <_Root className="bst">
                <div className="bg">
                    <a onClick={() => {
                        this.props.goToLibrary();
                    }}> <img alt="logo" src={RECOLNAT_LOGO} className="logo" title={"Go back to home page"}/></a>
                    <span className="title">Import</span>
                </div>
                <_Content>
                    <div className="vertical">
                        <Folders isImport={true} setSelectedFolder={this.setSelectedFolder}
                                 preselected={this.state.parentFolder}/>
                        <Tags autoSelectNew={true} visibleActions={false} isImport={true}/>
                    </div>
                    <_RightColumn>
                        <Container className="import-wizard">
                            <Row className="first-row">
                                <Col sm={12} md={12} lg={12}>
                                    <div className="header_import_recolnat"> <h5>Enter event name and duration to create an event:
                                    </h5>
                                    </div>
                                </Col>
                            </Row>
                            <br/>
                            <div className="edit-form-paren-div">
                                <EventForm
                                    tabData={this.props.tabData}
                                    goToImage={this.goToImage}
                                    tabName={this.state.tabName}
                                    event={null}
                                    parentFolder={this.state.parentFolder}
                                    isCreateMode={true}
                                />
                            </div>
                        </Container>
                    </_RightColumn>
                </_Content>
            </_Root>
        );
    }
}