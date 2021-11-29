import React, {PureComponent} from 'react';
import {BarLoader} from 'react-spinners';

const LOGO = require('./pictures/annotate-on_logo.jpg');

export default class extends PureComponent {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <div className="splash">
                <div className="content">
                    <img alt="logo" className="logo" src={LOGO}/>
                    <BarLoader
                        widthUnit={"%"}
                        width={100}
                        color={'#ff9800'}
                        loading={true}
                    />
                </div>
            </div>
        );
    }
}
