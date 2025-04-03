import React, {PureComponent, useRef} from "react";
import Viewer from "../widget/3d_viewer/viewer";

export default class _3DViewer extends PureComponent {

    constructor(props) {
        console.log(" _3DViewer", props);
        super(props);
    }

    render() {
        return (
            <div id="viewer-3d">">
                <div className="row justify-content-center -align-center no-margin">
                    <_3DViewerWrapper url={this.props.currentPicture.file} ann ={this.props.annotations}/>
                </div>
            </div>
        );
    }
}

function _3DViewerWrapper(props) {
    console.log("_3DViewerWrapper", props);
    const viewerRef = useRef(null);
    const loadedUrlsRef = useRef([]);

    const model_url = props.url;

    const helmetAnnotations = [
        {
            "position": {
                x: -0.005894269285761675,
                y: -0.00443319938195001,
                z: 0.08007271472426297,
            },
            "normal": {
                "x": -0.2142719745525738,
                "y": -0.5508794798542246,
                "z": 0.8066097690933827
            },
            "cameraPosition": {
                "x": 0.000003997236490249634,
                "y": -0.000009499490261021634,
                "z": 0.4652937456327315
            },
            "cameraTarget": {
                "x": 0.000003997236490249634,
                "y": -0.000009499490261050125,
                "z": -0.00000549852848050203
            },
            "description" : "This is a test annotation",
            "label": "Annotation label"
        }
    ]

    const msannotations = [
        {
            "position": {
                x: -0.03110198459355345,
                y: -0.02001883463772181,
                z: -0.49259737753912897,
            },
            "normal": {
                "x": 0.4842946929507354,
                "y": 0.6231320855801897,
                "z": 0.6141376509384812
            },
            "cameraPosition": {
                "x": -0.0192789975553751,
                "y": -0.019556999206542948,
                "z": -0.17235374353345334
            },
            "cameraTarget": {
                "x": -0.0192789975553751,
                "y": -0.01955699920654297,
                "z": -0.17235374353345334
            },
            "description" : "This is a test annotation",
            "label": "Annotation label"
        }
    ]


    const scene = {
        "ambientLightIntensity": 0,
        "environmentMap": "apartment",
        "rotation": [
            0,
            0,
            0
        ]
    }

    return (
            model_url ?

            <Viewer
                ref={viewerRef}
                envPreset={'apartment'}
                src={model_url}
                // src={'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/FlightHelmet/glTF/FlightHelmet.gltf'}
                // src={'https://raw.githubusercontent.com/JulieWinchester/aleph-assets/main/bunny.glb'}
                // src={'https://cdn.glitch.global/2658666b-2aa1-4395-8dfe-44a4aaaa0b16/nmah-1981_0706_06-clemente_helmet-100k-2048_std_draco.glb?v=1729600102458'}
                annotations ={msannotations}
                // annotations ={helmetAnnotations}
                rotationPreset={[0, 0, 0]}
                onLoad={(srcs) => {
                    console.log(`model${srcs.length > 1 ? 's' : ''} loaded`, srcs);
                    // add loaded urls to array of already loaded urls
                    loadedUrlsRef.current = [...loadedUrlsRef.current, ...srcs.map((src) => src.url)];

                    // loop through each src and show the required statement if it exists
                    // srcs
                    //     .filter((srcObj) => srcObj.requiredStatement)
                    //     .forEach((srcObj) => {
                    //         const sanitizedHTML = DOMPurify.sanitize(srcObj.requiredStatement as string);
                    //         toast(<div dangerouslySetInnerHTML={{ __html: sanitizedHTML }} />);
                    //     });
                }}
            /> : <div>Model URL is empty</div>
    )
}

