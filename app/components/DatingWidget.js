import React, {Component} from 'react';
import {Button, FormGroup, Input, InputGroup, InputGroupAddon, InputGroupText, Label} from "reactstrap";
import i18next from "i18next";
import moment from "moment";

export default class DatingWidget extends Component {

    constructor(props) {
        super(props);
        this.state = {
            inEdit: false,
            value: '',
            errors: '',
            freeEntryDate: '',
            formattedDate: '',
            formattedTime: '',
            collapse: true,
            nameOfPeriod: '',
            freeEntryDateEnd: '',
            formattedDateEnd: '',
            formattedTimeEnd: '',
        };
    }

    static getDerivedStateFromProps(props, state) {
        if(state.inEdit) return null;
        const {start, end, period} = props;

        let freeEntryDate = ''
        let formattedDate = '';
        let formattedTime = '';
        if (start) {
            let startMomentDate = moment(start, 'YYYY-MM-DD', true);
            let startMomentDateTime = moment(start, 'YYYY-MM-DDTHH:mm', true);
            let startMomentDateTimeSec = moment(start, 'YYYY-MM-DDTHH:mm:ss', true);
            if(startMomentDate.isValid()) {
                formattedDate = start;
            } else if (startMomentDateTime.isValid() || startMomentDateTimeSec.isValid()) {
                let startArr = start.split('T');
                formattedDate = startArr[0];
                formattedTime = startArr[1];
            } else {
                freeEntryDate = start;
            }
        }

        let freeEntryDateEnd = ''
        let formattedDateEnd = '';
        let formattedTimeEnd = '';
        if (end) {
            let endMomentDate = moment(end, 'YYYY-MM-DD', true);
            let endMomentDateTime = moment(end, 'YYYY-MM-DDTHH:mm', true);
            let endMomentDateTimeSec = moment(end, 'YYYY-MM-DDTHH:mm:ss', true);

            if(endMomentDate.isValid()) {
                formattedDateEnd = end;
            } else if (endMomentDateTime.isValid() || endMomentDateTimeSec.isValid()) {
                let endArr = end.split('T');
                formattedDateEnd = endArr[0];
                formattedTimeEnd = endArr[1];
            } else {
                freeEntryDateEnd = end;
            }
        }

        let nameOfPeriod = period ? period : '';

        let value = `${nameOfPeriod ? 'name='+ nameOfPeriod + ';' : ''}${start ? 'start='+ start + ';' : ''}${end ? 'end='+ end + ';' : ''}`;

        return {
            freeEntryDate,
            formattedDate,
            formattedTime,
            nameOfPeriod,
            freeEntryDateEnd,
            formattedDateEnd,
            formattedTimeEnd,
            value
        };
    }

    componentDidMount() {
        if (this.props.openEdit) {
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
            collapse: true,
            errors: ''
        });
    }

    _formChangeHandler = (event) => {
        const {name, value} = event.target;
        let state = {}
        if (name === 'formattedDate' && !value) {
            state.formattedTime = '';
        }
        if (name === 'formattedDateEnd' && !value) {
            state.formattedTimeEnd = ''
        }
        state[name] = value;
        this.setState(state);
    };

    _onSaveEdit = (e) => {
        let errors = this.state.errors;
        if (this.props.onValueChange) {
            let start = this.state.freeEntryDate
                ? this.state.freeEntryDate
                : `${this.state.formattedDate}${this.state.formattedTime ? 'T' + this.state.formattedTime : ''}`;
            let end = this.state.freeEntryDateEnd
                ? this.state.freeEntryDateEnd
                : `${this.state.formattedDateEnd}${this.state.formattedTimeEnd ? 'T' + this.state.formattedTimeEnd : ''}`
            let period = this.state.nameOfPeriod ? this.state.nameOfPeriod : '';
            let event = {
                target: {
                    name: this.props.name,
                    value: {
                        start: start,
                        end: end,
                        period: period,
                    }
                },
                errors: errors
            }
            this.setState({
                inEdit: false,
                errors: ''
            });
            this.props.onValueChange(event);
        } else {
            this.setState({
                inEdit: false,
                errors: ''
            });
        }
    };

    toggle = () => {
        this.setState(state => ({collapse: !state.collapse}));
    }

    render() {
        const {t} = i18next;
        const {errors} = this.state;
        return (
            <div className="dating-widget popup-widget">
                <InputGroup>
                    <Input type="text" name="value" id="dating-widget-value" readOnly={true}
                           placeholder={t('inspector.metadata.textbox_placeholder_coverage_temporal')}
                           title={this.state.value ? this.state.value : t('inspector.metadata.textbox_tooltip_coverage_temporal')}
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
                                {t('inspector.metadata.temporal.popup_lbl_new_edit_temporal_coverage')}
                            </div>
                        </div>
                        <div className="widget-editor-section">
                            <FormGroup className="column">
                                <Label for="place" className="label-for">
                                    {t('inspector.metadata.temporal.popup_lbl_free_entry_date')}
                                </Label>
                                <Input type="text" name="freeEntryDate"
                                       disabled={this.state.formattedDate ? true: false}
                                       value={this.state.freeEntryDate}
                                       onChange={this._formChangeHandler}
                                       autoFocus={true}
                                />
                            </FormGroup>
                            <FormGroup className="column">
                                <Label for="place" className="label-for">
                                    {t('inspector.metadata.temporal.popup_lbl_formatted_date')}
                                </Label>
                                <div className="flex flex-row flex-nowrap align-items-end">
                                    <Input type="date" name="formattedDate"
                                        value={this.state.formattedDate}
                                           disabled={this.state.freeEntryDate ? true: false}
                                           onChange={this._formChangeHandler}
                                    />
                                    <Input type="time" name="formattedTime" step="1"
                                           disabled={this.state.formattedDate ? false: true}
                                           value={this.state.formattedTime}
                                           onChange={this._formChangeHandler}
                                    />
                                </div>
                            </FormGroup>

                            <span className="row more-options-collapse" >
                                <Label className="pointer" onClick={this.toggle}>
                                    {t('inspector.metadata.temporal.popup_lbl_more_options')}
                                </Label>
                                <img className="toogleCollapse pointer" onClick={this.toggle}
                                     src={(this.state.collapse ? require('./pictures/arrow_down.svg') : require('./pictures/arrow_up.svg'))} alt="arrow-up-down"/>
                            </span>
                            <div className={this.state.collapse? "column collapse" : "column"}>
                                <FormGroup className="column">
                                    <Label for="place" className="label-for">
                                        {t('inspector.metadata.temporal.popup_lbl_name_of_period')}
                                    </Label>
                                    <Input type="text" name="nameOfPeriod"
                                           value={this.state.nameOfPeriod}
                                           onChange={this._formChangeHandler}
                                    />
                                </FormGroup>
                                <FormGroup className="column">
                                    <Label for="place" className="label-for">
                                        {t('inspector.metadata.temporal.popup_lbl_free_entry_date_end')}
                                    </Label>
                                    <Input type="text" name="freeEntryDateEnd"
                                           value={this.state.freeEntryDateEnd}
                                           disabled={this.state.formattedDateEnd ? true: false}
                                           onChange={this._formChangeHandler}/>
                                </FormGroup>
                                <FormGroup className="column">
                                    <Label for="place" className="label-for">
                                        {t('inspector.metadata.temporal.popup_lbl_formatted_date_end')}
                                    </Label>
                                    <div className="flex flex-row flex-nowrap align-items-end">
                                        <Input type="date" name="formattedDateEnd"
                                               disabled={this.state.freeEntryDateEnd ? true: false}
                                            value={this.state.formattedDateEnd}
                                               onChange={this._formChangeHandler}
                                        />
                                        <Input type="time" name="formattedTimeEnd" step="1"
                                               disabled={this.state.formattedDateEnd ? false: true}
                                               value={this.state.formattedTimeEnd}
                                               onChange={this._formChangeHandler}
                                        />
                                    </div>
                                </FormGroup>
                            </div>
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
