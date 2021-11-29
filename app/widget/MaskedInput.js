import React, {Component} from "react";

export default class extends Component {

    constructor(props) {
        super(props);
    }

    handleChange = (e) => {
        e.target.value = this.handleCurrentValue(e);
        if(this.props.placeholder.length === e.target.value.length) {
            const h = parseInt(e.target.value.substr(0, 2));
            const m = parseInt(e.target.value.substr(3, 2));
            const s = parseInt(e.target.value.substr(6, 2));
            this.props.onChange(h*3600+m*60+s)
        } else
            this.props.onChange(null)
    }

    handleCurrentValue = (e) => {
        let isCharsetPresent = e.target.getAttribute('data-charset'),
            maskedNumber = 'XMDY',
            maskedLetter = '_',
            placeholder = isCharsetPresent || e.target.getAttribute('data-placeholder'),
            value = e.target.value, l = placeholder.length, newValue = '',
            i, j, isInt, isLetter, strippedValue, matchesNumber, matchesLetter;

        // strip special characters
        strippedValue = isCharsetPresent ? value.replace(/\W/g, "") : value.replace(/\D/g, "");

        for (i = 0, j = 0; i < l; i++) {
            isInt = !isNaN(parseInt(strippedValue[j]));
            isLetter = strippedValue[j] ? strippedValue[j].match(/[A-Z]/i) : false;
            matchesNumber = (maskedNumber.indexOf(placeholder[i]) >= 0);
            matchesLetter = (maskedLetter.indexOf(placeholder[i]) >= 0);
            if ((matchesNumber && isInt) || (isCharsetPresent && matchesLetter && isLetter)) {
                newValue += strippedValue[j++];
            } else if ((!isCharsetPresent && !isInt && matchesNumber) || (isCharsetPresent && ((matchesLetter && !isLetter) || (matchesNumber && !isInt)))) {
                //this.options.onError( e ); // write your own error handling function
                return newValue;
            } else {
                newValue += placeholder[i];
            }
            // break if no characters left and the pattern is non-special character
            if (strippedValue[j] == undefined) {
                break;
            }
        }

        if (this.props['data-valid-example']) {
            return this.validateProgress(e, newValue);
        }

        return newValue;
    }

    setValueOfMask = (e) => {
        let value = e.target.value,
            placeholder = e.target.getAttribute('data-placeholder');

        return "<i>" + value + "</i>" + placeholder.substr(value.length);
    }

    validateProgress = (e, value) => {
        let validExample = this.props['data-valid-example'],
            pattern = new RegExp(this.props.pattern),
            placeholder = e.target.getAttribute('data-placeholder'),
            l = value.length, testValue = '', i;

        //convert to months
        if ((l === 1) && (placeholder.toUpperCase().substr(0, 2) === 'MM')) {
            if (value > 1 && value < 10) {
                value = '0' + value;
            }
            return value;
        }

        for (i = l; i >= 0; i--) {
            testValue = value + validExample.substr(value.length);
            if (pattern.test(testValue)) {
                return value;
            } else {
                value = value.substr(0, value.length - 1);
            }
        }

        return value;
    }

    handleBlur = (e) => {
        let currValue = e.target.value,
            pattern;

        // if value is empty, remove label parent class
        if (currValue.length === 0) {

            if (e.target.required) {
                this.updateLabelClass(e, "required", true);
                this.handleError(e, 'required');
            }

        } else {
            pattern = new RegExp('^' + this.props.pattern + '$');

            if (pattern.test(currValue)) {
                this.updateLabelClass(e, "good", true);
            } else {
                this.updateLabelClass(e, "error", true);
                this.handleError(e, 'invalidValue');
            }

        }
    }

    handleFocus = (e) => {
        this.updateLabelClass(e, 'focus', false);
    }

    updateLabelClass = (e, className, replaceExistingClass) => {
        let parentLI = e.target.parentNode.parentNode,
            pastClasses = ['error', 'required', 'focus', 'good'],
            i;

        if (replaceExistingClass) {
            for (i = 0; i < pastClasses.length; i++) {
                parentLI.classList.remove(pastClasses[i]);
            }
        }

        parentLI.classList.add(className);
    }

    handleError = (e, errorMsg) => {
        // the event and errorMsg name are passed. Label is already handled. What else do we do with error?
        //let possibleErrorMsgs = ['invalidValue', 'required'];
        return true;
    }

    render() {
        let value = this.props.value || '',
            props = {
                type: (this.props && this.props.type) || '',
                id: this.props.id,
                placeholder: this.props.placeholder,
                className: "masked " + (this.props.className || ''),
                pattern: this.props.pattern,
                maxLength: this.props.pattern.length,
                title: this.props.title,
                label: this.props.label,
                dataCharset: this.props['data-charset'],
                required: this.props.required
            };

        return (
            <div className="maskShell">
                <input
                    id={props.id}
                    onChange={this.handleChange}
                    onFocus={this.handleFocus}
                    onBlur={this.handleBlur}
                    name={props.id}
                    type={props.type}
                    className={props.className}
                    data-placeholder={props.placeholder}
                    data-pattern={props.pattern}
                    data-valid-example={props.example}
                    aria-required={props.required}
                    data-charset={props.dataCharset}
                    required={props.required}
                    title={props.title}/>
            </div>
        );
    }
}