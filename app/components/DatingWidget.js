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
            showPicker:false,
            year: '',
            month: '',
            day: '',
            hasPeriod: true,
            nameOfPeriod: '',
            freeEntryDateEnd: '',
            formattedDateEnd: '',
            formattedTimeEnd: '',
            showPickerEnd:false,
            yearEnd: '',
            monthEnd: '',
            dayEnd: '',
        };
    }

    static getDerivedStateFromProps(props, state) {
        if(state.inEdit) return null;
        const {start, end, period} = props;

        let year = ''
        let month = ''
        let day = ''
        let formattedDate = '';
        let formattedTime = '';
        let hasFormattedStart = false;
        if (start) {
            let startMomentDate = moment(start, 'YYYY-MM-DD', false);
            let startMomentDateStrict = moment(end, 'YYYY-MM-DD', true);
            let startMomentDateTime = moment(start, 'YYYY-MM-DDTHH:mm', true);
            let startMomentDateTimeSec = moment(start, 'YYYY-MM-DDTHH:mm:ss', true);
             if (startMomentDateTime.isValid() || startMomentDateTimeSec.isValid()) {
                let startArr = start.split('T');
                formattedDate = startArr[0];
                formattedTime = startArr[1];
            } else if(startMomentDate.isValid() || startMomentDateStrict.isValid()) {
                 let startArr = start.split('-')
                 year = startArr.length > 0 ? startArr[0] : '';
                 month = startArr.length > 1 ? startArr[1] : '';
                 day = startArr.length > 2 ? startArr[2] : '';
             } else {
                console.log("wrong date coverage start format")
            }
            hasFormattedStart = formattedDate ? true: false;
        }
        let yearEnd = ''
        let monthEnd = ''
        let dayEnd = ''
        let formattedDateEnd = '';
        let formattedTimeEnd = '';
        let hasEnd = false;
        let hasFormattedEnd = false;
        if (end) {
            hasEnd = true;
            let endMomentDate = moment(end, 'YYYY-MM-DD', false);
            let endMomentDateStrict = moment(end, 'YYYY-MM-DD', true);
            let endMomentDateTime = moment(end, 'YYYY-MM-DDTHH:mm', true);
            let endMomentDateTimeSec = moment(end, 'YYYY-MM-DDTHH:mm:ss', true);
            if (endMomentDateTime.isValid() || endMomentDateTimeSec.isValid()) {
                let endArr = end.split('T');
                formattedDateEnd = endArr[0];
                formattedTimeEnd = endArr[1];
            } else if(endMomentDate.isValid() || endMomentDateStrict.isValid()) {
                let endArr = end.split('-')
                yearEnd = endArr.length > 0 ? endArr[0] : '';
                monthEnd = endArr.length > 1 ? endArr[1] : '';
                dayEnd = endArr.length > 2 ? endArr[2] : '';
            } else{
                console.log("wrong date coverage end format")
            }
            hasFormattedEnd = formattedDateEnd ? true: false;
        }

        let nameOfPeriod = period ? period : '';
        let value = `${nameOfPeriod ? 'name='+ nameOfPeriod + ';' : ''}${start ? 'start='+ start + ';' : ''}${end ? 'end='+ end + ';' : ''}`;

        return {
            nameOfPeriod,
            year,
            month,
            day,
            formattedDate,
            formattedTime,
            yearEnd,
            monthEnd,
            dayEnd,
            formattedDateEnd,
            formattedTimeEnd,
            value,
            showPicker: hasFormattedStart,
            showPickerEnd: hasFormattedEnd,
            hasPeriod: hasEnd,
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
            hasPeriod: false,
            errors: '',
            showPicker:false,
            showPickerEnd:false
        });
    }

    _formChangeHandler = (event) => {
        const {name, value, min, max} = event.target;
        let state = {}
        if(name === 'year' && !value) {
            state.month= '';
            state.day = '';
        } else if(name === 'month' && !value) {
            state.day = '';
        } else if(name === 'yearEnd' && !value) {
            state.monthEnd= '';
            state.dayEnd = '';
        } else if(name === 'monthEnd' && !value) {
            state.dayEnd= '';
        } else if (name === 'formattedDate' && !value) {
            state.formattedTime = '';
        } else if (name === 'formattedDateEnd' && !value) {
            state.formattedTimeEnd = ''
        }
        if(min || max) {
            let valueValue = +value;
            let minValue = +min;
            let maxValue = +max;
            if(valueValue < minValue || valueValue > maxValue) {
                console.log("Invalid value " + value)
                return;
            }
        }
        if(name === 'day' && value) {
            let date = moment(`${this.state.year.padStart(4, '0')}-${this.state.month.padStart(2, '0')}-${value.padStart(2, '0')}`, 'YYYY-MM-DD', true);
            if(!date.isValid()) return;
        } else if(name === 'dayEnd' && value) {
            let date = moment(`${this.state.yearEnd.padStart(4, '0')}-${this.state.monthEnd.padStart(2, '0')}-${value.padStart(2, '0')}`, 'YYYY-MM-DD', true);
            if(!date.isValid()) return;
        }
        state[name] = value;
        this.setState(state);
    };

    _onSaveEdit = (e) => {
        let errors = this.state.errors;
        if (this.props.onValueChange) {
            let period = this.state.nameOfPeriod ? this.state.nameOfPeriod : '';
            let start = this.state.showPicker
                ? `${this.state.formattedDate}${this.state.formattedTime ? 'T' + this.state.formattedTime : ''}`
                : `${this.state.year ? this.state.year.padStart(4, '0'): ''}${this.state.month ? '-'+this.state.month.padStart(2, '0') : ''}${this.state.day ? '-'+this.state.day.padStart(2, '0') : ''}`
            let end = '';
            if(this.state.hasPeriod) {
                end = this.state.showPickerEnd
                    ? `${this.state.formattedDateEnd}${this.state.formattedTimeEnd ? 'T' + this.state.formattedTimeEnd : ''}`
                    : `${this.state.yearEnd ? this.state.yearEnd.padStart(4, '0'): ''}${this.state.monthEnd ? '-'+this.state.monthEnd.padStart(2, '0') : ''}${this.state.dayEnd ? '-'+this.state.dayEnd.padStart(2, '0') : ''}`
            }

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
        this.setState(state => ({hasPeriod: !state.hasPeriod}));
    }

    _toggleDateInput = () => {
        this.setState(state => ({showPicker: !state.showPicker}));
    }

    _toggleDateInputEnd = () => {
        this.setState(state => ({showPickerEnd: !state.showPickerEnd}));
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
                        <FormGroup className="column">
                            <Input type="text" name="nameOfPeriod"
                                   value={this.state.nameOfPeriod}
                                   placeholder={t('inspector.metadata.temporal.popup_lbl_name_of_period')}
                                   onChange={this._formChangeHandler}
                            />
                        </FormGroup>
                        <div className="widget-editor-section">
                            <div className="date-time-input" >
                                {this.state.showPicker ?
                                    <FormGroup className="column">
                                    <div className="flex flex-row flex-nowrap align-items-end">
                                        <Input type="date" name="formattedDate"
                                               value={this.state.formattedDate}
                                               onChange={this._formChangeHandler}
                                        />
                                        <Input type="time" name="formattedTime" step="1"
                                               disabled={this.state.formattedDate ? false: true}
                                               value={this.state.formattedTime}
                                               onChange={this._formChangeHandler}
                                        />
                                    </div>
                                </FormGroup > :
                                    <FormGroup className="flex flex-row flex-nowrap align-items-end">
                                            <Input type="number" name="year"
                                                   min="0"
                                                   max="9999"
                                                   placeholder="YYYY"
                                                   value={this.state.year}
                                                   onChange={this._formChangeHandler}
                                            />
                                            <Input type="number" name="month"
                                                   min="0"
                                                   max="12"
                                                   placeholder="MM"
                                                   value={this.state.month}
                                                   disabled={!this.state.year ? true: false}
                                                   onChange={this._formChangeHandler}
                                            />
                                            <Input type="number" name="day"
                                                   min="0"
                                                   max="31"
                                                   placeholder="DD"
                                                   value={this.state.day}
                                                   disabled={!this.state.month ? true: false}
                                                   onChange={this._formChangeHandler}
                                            />
                                    </FormGroup>
                                }
                                <div className="icon-calendar-picker" onClick={this._toggleDateInput}>
                                    <i className="fa fa-calendar pointer"/>
                                </div>
                            </div>

                            <span className="more-options-collapse" >
                                <div className="form-check">
                                    <Input name="period" id="dating-widget-period" type="checkbox" checked={this.state.hasPeriod}
                                           onClick={this.toggle}/>
                                    <Label for="dating-widget-period" className="form-check-label pointer">
                                        {t('inspector.metadata.temporal.popup_lbl_period')}
                                    </Label>
                                </div>
                            </span>
                            <div className={this.state.hasPeriod? "column" : "column collapse"}>
                                <div className="date-time-input" >
                                    {this.state.showPickerEnd ?
                                        <FormGroup className="column">
                                            <div className="flex flex-row flex-nowrap align-items-end">
                                                <Input type="date" name="formattedDateEnd"
                                                       value={this.state.formattedDateEnd}
                                                       onChange={this._formChangeHandler}
                                                />
                                                <Input type="time" name="formattedTimeEnd" step="1"
                                                       disabled={this.state.formattedDateEnd ? false: true}
                                                       value={this.state.formattedTimeEnd}
                                                       onChange={this._formChangeHandler}
                                                />
                                            </div>
                                        </FormGroup > :
                                        <FormGroup className="flex flex-row flex-nowrap align-items-end">
                                            <Input type="number" name="yearEnd"
                                                   min="0"
                                                   max="9999"
                                                   placeholder="YYYY"
                                                   value={this.state.yearEnd}
                                                   onChange={this._formChangeHandler}
                                            />
                                            <Input type="number" name="monthEnd"
                                                   min="0"
                                                   max="12"
                                                   placeholder="MM"
                                                   value={this.state.monthEnd}
                                                   disabled={!this.state.yearEnd}
                                                   onChange={this._formChangeHandler}
                                            />
                                            <Input type="number" name="dayEnd"
                                                   min="0"
                                                   max="31"
                                                   placeholder="DD"
                                                   value={this.state.dayEnd}
                                                   disabled={!this.state.monthEnd}
                                                   onChange={this._formChangeHandler}
                                            />
                                        </FormGroup>
                                    }
                                    <div className="icon-calendar-picker" onClick={this._toggleDateInputEnd}>
                                        <i className="fa fa-calendar pointer"/>
                                    </div>
                                </div>
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
