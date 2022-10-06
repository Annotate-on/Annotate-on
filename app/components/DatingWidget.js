import React, {Component} from 'react';
import {Button, FormGroup, Input, InputGroup, InputGroupAddon, InputGroupText, Label} from "reactstrap";
import i18next from "i18next";

export default class DatingWidget extends Component {

    constructor(props) {
        super(props);
        this.state = {
            inEdit: false,
            value: '',
            errors: ''
        };
    }
    componentDidMount() {
        if(this.props.openEdit) {
            this._onEdit();
        }
    }

    _onEdit = () => {
        this.setState({
            inEdit: true
        });
    }

    _onCancelEdit = () => {
        this.setState({
            inEdit: false,
            errors: ''
        });
    }

    _formChangeHandler = (event) => {
        const {t} = i18next;
        const {name, value} = event.target;
        this.setState({
            [name]: value
        });
    };

    _onSaveEdit = (e) => {
        console.log("_onSaveEdit")
    }

    render() {
        const {t} = i18next;
        const {errors} = this.state;
        return (
            <div className="dating-widget popup-widget">
                <InputGroup>
                    <Input type="text" name="value" id="dating-widget-value" readOnly={true}
                           placeholder={t('inspector.metadata.textbox_placeholder_coverage_temporal')}
                           title={t('inspector.metadata.textbox_tooltip_coverage_temporal')}
                           onClick={() => {
                               if(!this.state.inEdit) this._onEdit()
                           }}
                           value={this.state.value}/>
                    <InputGroupAddon addonType="append">
                        <InputGroupText>
                            <i className="fa fa-pencil pointer" aria-hidden="true"
                               onClick={() => {
                                   if(!this.state.inEdit) this._onEdit()
                               }}
                            />
                        </InputGroupText>
                    </InputGroupAddon>
                </InputGroup>
                {this.state.inEdit &&
                    <div className="widget-editor">
                        <div className="widget-editor-section">
                            <div className="widget-editor-section-title">
                                New/edit temporal coverage
                                {/*{t('inspector.metadata.geolocation.popup_lbl_new_edit_geolocation')}*/}
                            </div>
                        </div>
                        <div className="widget-editor-section">
                            <FormGroup className="column">
                                <Label for="place" className="label-for">
                                    Name of time interval
                                    {/*{t('inspector.metadata.geolocation.popup_lbl_place_name')}*/}
                                </Label>
                                <Input type="text" name="interval" id="dating-widget-interval"
                                       value={this.state.interval}
                                       onChange={this._formChangeHandler}
                                       autoFocus={true}
                                       onKeyDown={(e) => {
                                           if (e.key === 'Enter' && e.type === 'keydown') {
                                           };
                                       }}
                                />
                            </FormGroup>
                            {errors.length > 0 &&
                                <div className="alert alert-danger" role="alert">
                                    {errors}
                                </div>
                            }
                            <div className="actions-row">
                                <Button color="success"  size="sm"
                                        onClick={(e) => {
                                            this._onSaveEdit()
                                            e.preventDefault();
                                        }}
                                >{t('global.save')}
                                </Button>
                                <Button color="danger"  size="sm"
                                        onClick={(e) => {
                                            this._onCancelEdit();
                                            e.preventDefault();
                                        }}
                                >{t('global.cancel')}
                                </Button>
                            </div>
                        </div>
                    </div>
                }
            </div>
        )
    }

}
