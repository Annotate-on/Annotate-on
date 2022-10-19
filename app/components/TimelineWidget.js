import React, {Component} from 'react';
import i18next from "i18next";
import styled from "styled-components";
import moment from "moment";
import {Chrono} from "react-chrono";

import MOZAIC from "./pictures/mozaic_icon.svg";
import LIST from "./pictures/list.svg";
import POLYLINE from "./pictures/polyline.svg";
import POLYGON from "./pictures/polygon.svg";
import CATEGORICAL from "./pictures/categorical.svg";
import RICHTEXT from "./pictures/richtext.svg";
import OCCURRENCE from "./pictures/occurrence.svg";
import TRANSCRIPTION from "./pictures/transcription.svg";
import ANGLE from "./pictures/angle.svg";
import POI from "./pictures/poi.svg";

// import LIST from "./pictures/list_icon.svg";
import classnames from "classnames";
import MAP_WHITE from "./pictures/map-location-dot-solid-white.svg";


export const mockItems = [
    {
        title: "May 1940",
        cardTitle: "Dunkirk",
        url: "http://google.com",
        cardSubtitle:
            "Men of the British Expeditionary Force (BEF) wade out to a destroyer during the evacuation from Dunkirk.",
        cardDetailedText: `On 10 May 1940, Hitler began his long-awaited offensive in the west by invading neutral Holland and Belgium and attacking northern France. Holland capitulated after only five days of fighting, and the Belgians surrendered on 28 May. With the success of the German ‘Blitzkrieg’, the British Expeditionary Force and French troops were in danger of being cut off and destroyed.`
    }
    ,
    {
        title: "25 July 1940",
        cardTitle: "The Battle of Britain",
        cardSubtitle: `RAF Spitfire pilots scramble for their planes`,
        cardDetailedText: `After France’s surrender in June 1940, Churchill told the British people, “Hitler knows that he will have to break us in this island or lose the war”. To mount a successful invasion, the Germans had to gain air superiority. The first phase of the battle began on 10 July with Luftwaffe attacks on shipping in the Channel.
      The following month, RAF Fighter Command airfields and aircraft factories came under attack. Under the dynamic direction of Lord Beaverbrook, production of Spitfire and Hurricane fighters increased, and despite its losses in pilots and planes, the RAF was never as seriously weakened as the Germans supposed.`
    },
    {
        title: "June 1941",
        cardTitle: "Operation Barbarossa",
        cardSubtitle: `A column of Red Army prisoners taken during the first days of the German invasion`,
        cardDetailedText: `Since the 1920s, Hitler had seen Russia, with its immense natural resources, as the principal target for conquest and expansion. It would provide, he believed, the necessary ‘Lebensraum’, or living space, for the German people. And by conquering Russia, Hitler would also destroy the “Jewish pestilential creed of Bolshevism”. His non-aggression pact with Stalin in August 1939 he regarded as a mere temporary expedient.
      Barely a month after the fall of France, and while the Battle of Britain was being fought, Hitler started planning for the Blitzkrieg campaign against Russia, which began on 22 June 1941. Despite repeated warnings, Stalin was taken by surprise, and for the first few months the Germans achieved spectacular victories, capturing huge swathes of land and hundreds of thousands of prisoners. But they failed to take Moscow or Leningrad before winter set in.
      On 5/6 December, the Red Army launched a counter-offensive which removed the immediate threat to the Soviet capital. It also brought the German high command to the brink of a catastrophic military crisis. Hitler stepped in and took personal command. His intervention was decisive and he later boasted, “That we overcame this winter and are today in a position again to proceed victoriously… is solely attributable to the bravery of the soldiers at the front and my firm will to hold out…”`
    },
    {
        title: "June 1942",
        cardTitle: "Operation Barbarossa",
        cardSubtitle: `A column of Red Army prisoners taken during the first days of the German invasion`,
        cardDetailedText: `Since the 1920s, Hitler had seen Russia, with its immense natural resources, as the principal target for conquest and expansion. It would provide, he believed, the necessary ‘Lebensraum’, or living space, for the German people. And by conquering Russia, Hitler would also destroy the “Jewish pestilential creed of Bolshevism”. His non-aggression pact with Stalin in August 1939 he regarded as a mere temporary expedient.
      Barely a month after the fall of France, and while the Battle of Britain was being fought, Hitler started planning for the Blitzkrieg campaign against Russia, which began on 22 June 1941. Despite repeated warnings, Stalin was taken by surprise, and for the first few months the Germans achieved spectacular victories, capturing huge swathes of land and hundreds of thousands of prisoners. But they failed to take Moscow or Leningrad before winter set in.
      On 5/6 December, the Red Army launched a counter-offensive which removed the immediate threat to the Soviet capital. It also brought the German high command to the brink of a catastrophic military crisis. Hitler stepped in and took personal command. His intervention was decisive and he later boasted, “That we overcame this winter and are today in a position again to proceed victoriously… is solely attributable to the bravery of the soldiers at the front and my firm will to hold out…”`
    }
    ,
    {
        title: "June 1943",
        cardTitle: "Operation Barbarossa",
        // cardSubtitle: `A column of Red Army prisoners taken during the first days of the German invasion`,
        cardDetailedText: `Since the 1920s, Hitler had seen Russia, with its immense natural resources, as the principal target for conquest and expansion. It would provide, he believed, the necessary ‘Lebensraum’, or living space, for the German people. And by conquering Russia, Hitler would also destroy the “Jewish pestilential creed of Bolshevism”. His non-aggression pact with Stalin in August 1939 he regarded as a mere temporary expedient.
      Barely a month after the fall of France, and while the Battle of Britain was being fought, Hitler started planning for the Blitzkrieg campaign against Russia, which began on 22 June 1941. Despite repeated warnings, Stalin was taken by surprise, and for the first few months the Germans achieved spectacular victories, capturing huge swathes of land and hundreds of thousands of prisoners. But they failed to take Moscow or Leningrad before winter set in.
      On 5/6 December, the Red Army launched a counter-offensive which removed the immediate threat to the Soviet capital. It also brought the German high command to the brink of a catastrophic military crisis. Hitler stepped in and took personal command. His intervention was decisive and he later boasted, “That we overcame this winter and are today in a position again to proceed victoriously… is solely attributable to the bravery of the soldiers at the front and my firm will to hold out…”`
    }
]

export default class TimelineWidget extends Component {

    constructor(props, context) {
        super(props, context);
        this.state = {
        }
    }

    componentDidMount() {
    }

    _getIconForAnnotationType(type) {
        if(type === 'simple-line') return LIST;
        if(type === 'polyline') return POLYLINE;
        if(type === 'polygon') return POLYGON;
        if(type === 'richtext') return RICHTEXT;
        if(type === 'categorical') return CATEGORICAL;
        if(type === 'occurrence') return OCCURRENCE;
        if(type === 'transcription') return TRANSCRIPTION;
        if(type === 'angle') return ANGLE;
        if(type === 'marker') return POI;
        return MOZAIC
    }

    componentDidUpdate(prevProps, prevState) {
    }

    render() {
        const {t} = i18next;
        return (
            <div className="timeline-widget">
                { this.props.items &&
                    <Chrono items={this.props.items} mode="VERTICAL_ALTERNATING" scrollable allowDynamicUpdate enableOutline cardWidth="350">
                        <div className="chrono-icons">
                        {this.props.items.map( (item, index) => {
                            return <img key={index} src={this._getIconForAnnotationType(item.type)} alt="image1"/>
                        })}
                        </div>
                        {/*<div className="chrono-icons">*/}
                        {/*    <img src={MOZAIC} alt="image1" />*/}
                        {/*    <img src={LIST} alt="image2" />*/}

                    </Chrono>
                }
            </div>
        );
    }

}
