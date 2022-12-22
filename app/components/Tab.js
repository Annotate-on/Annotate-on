import React, {PureComponent} from 'react';
import Library from "../containers/Library";
import Data from "../containers/Data";
import Image from "../containers/Image";
import {Route, Switch} from 'react-router';
import {ee, EVENT_SELECT_TAB} from "../utils/library";
import lodash from 'lodash';
import ImportEventWizard from "../containers/ImportEventWizard";

export default class extends PureComponent {
  constructor(props) {
    super(props);
    ee.addListener(EVENT_SELECT_TAB, this._selectComponent);
  }

  componentWillUnmount() {
    ee.removeListener(EVENT_SELECT_TAB, this._selectComponent)
  }

  _selectComponent = (path) => {
    if (lodash.isPlainObject(path)) {
      if(path.param.picView) {
        this.props.goTo(`/selection/${this.props.tabName}/${path.tab}/${path.param.picView}/${path.param.fitToBounds}`);
        this.props.setSelectedLibraryTab(this.props.tabName, path.tab);
        // this.props.openTabs[this.props.tabName].view = path.tab;
      } else {
        this.props.goTo(`/selection/${this.props.tabName}/${path.tab}/${path.param.edit}/${path.param.targetId}`);
        this.props.setSelectedLibraryTab(this.props.tabName, path.tab);
        // this.props.openTabs[this.props.tabName].view = path.tab;
      }
    } else {
      this.props.goTo(`/selection/${this.props.tabName}/${path}`);
      this.props.setSelectedLibraryTab(this.props.tabName, path);
      // this.props.openTabs[this.props.tabName].view = path;
    }
  };

  render() {
    return (
      <div className="tab">
        <Switch>
          <Route exact path={`${this.props.match.path}/${this.props.tabName}/library`}
                 render={() => <Library tabName={this.props.tabName}/>}/>
          <Route exact path={`${this.props.match.path}/${this.props.tabName}/library/:picView?/:fitToBounds?`}
                 render={(props) => <Library tabName={this.props.tabName} match={props.match}/>}/>
          <Route exact path={`${this.props.match.path}/${this.props.tabName}/image`}
                 render={() => <Image tabName={this.props.tabName}/>}/>
          <Route exact path={`${this.props.match.path}/${this.props.tabName}/data/:editTargetTab?/:targetId?`}
                 render={(props) => <Data tabName={this.props.tabName} match={props.match}/>}/>
          <Route exact path={`${this.props.match.path}/${this.props.tabName}/eventHome`}
                 render={(props) => <ImportEventWizard tabName={this.props.tabName} match={props.match}/>}/>
        </Switch>
      </div>
    );
  }
}
