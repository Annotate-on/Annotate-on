import React, {PureComponent, useRef} from "react";
import Viewer from "../widget/3d_viewer/viewer";

export default class _3DViewer extends PureComponent {

    constructor(props) {
        super(props);
    }

    render() {
        return (
            <div className="bst rcn_3dviewer">
                <div className="row justify-content-center -align-center no-margin">
                    <_3DViewerWrapper/>
                </div>
            </div>
        );
    }
}

function _3DViewerWrapper(props) {
    const viewerRef = useRef(null);
    const loadedUrlsRef = useRef([]);

    return (
            <Viewer
                ref={viewerRef}
                envPreset={'apartment'}
                src={'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/FlightHelmet/glTF/FlightHelmet.gltf'}
                // src={'https://cdn.glitch.global/2658666b-2aa1-4395-8dfe-44a4aaaa0b16/nmah-1981_0706_06-clemente_helmet-100k-2048_std_draco.glb?v=1729600102458'}
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
            />
    )
}

