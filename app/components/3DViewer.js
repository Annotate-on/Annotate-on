import React, {PureComponent, useEffect, useRef} from "react";
import Viewer from "../widget/3d_viewer/viewer";
import Chance from "chance";
import {ANNOTATION_3D_MARKER} from "../constants/constants";
import use3DStore from "../widget/3d_viewer/store";
import {ENVIRONMENT_APARTMENT} from "../widget/3d_viewer/lib/constants";

const chance = new Chance();

export default class _3DViewer extends PureComponent {

    constructor(props) {
        super(props);
        this.state = {
            currentPicture: props.currentPicture,
            annotations:
                [...(props.annotations && this.props.annotations[props.currentPicture.sha1] || [])],
            editedAnnotation: this.props.editedAnnotation,
        };
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.currentPicture !== this.props.currentPicture) {
            this.setState({
                currentPicture: nextProps.currentPicture,
            });
        }
        if (nextProps.currentPicture !== this.props.currentPicture || nextProps.annotations !== this.props.annotations) {
            this.setState({
                annotations:
                    [...(nextProps.annotations && nextProps.annotations[nextProps.currentPicture.sha1] || [])]
            });
        }
        if (nextProps.editedAnnotation !== this.props.editedAnnotation) {
            this.setState({
                editedAnnotation: nextProps.editedAnnotation
            });
        }
    }

    onCreateAnnotation = (annotation) => {
        console.log("onCreateAnnotationHandler", annotation);
        if (this.props.createAnnotation3dPointOfInterest) {
            this.props.createAnnotation3dPointOfInterest(
                this.state.currentPicture.sha1,
                chance.guid(),
                annotation.position,
                annotation.normal,
                annotation.cameraPosition,
                annotation.cameraTarget
            );
        }
    }

    onEditAnnotation = (annotation) => {
        console.log("onEditAnnotation", annotation);
        if (this.props.editAnnotation) {
            this.props.editAnnotation(
                this.state.currentPicture.sha1,
                ANNOTATION_3D_MARKER,
                annotation.id,
                annotation.title,
                annotation.value,
                annotation.coverage,
                {...annotation}
            );
        }
    }

    render() {
        console.log("3DViewer render", this.state.currentPicture);
        return (
            <div id="viewer-3d">">
                <div className="row justify-content-center -align-center no-margin">
                    <_3DViewerWrapper
                        url={this.state.currentPicture.file}
                        annotations={this.state.annotations}
                        editedAnnotation={this.state.editedAnnotation}
                        onCreateAnnotation={this.onCreateAnnotation}
                        onEditAnnotation={this.onEditAnnotation}
                        resetSceneSettings={this.state.resetSceneSettings}
                    />
                </div>
            </div>
        );
    }
}

function _3DViewerWrapper(props) {
    const viewerRef = useRef(null);
    const loadedUrlsRef = useRef([]);
    const model_url = props.url;

    const {
        environmentMap,
        setEnvironmentMap,
        setAmbientLightIntensity,
    } = use3DStore();

    useEffect(() => {
        // Reset the environment map and ambient light intensity when the component mounts
        // or when the model_url changes
        setEnvironmentMap(ENVIRONMENT_APARTMENT);
        setAmbientLightIntensity(0);
    }, [props.url]);


    return (
        model_url ?
            <Viewer
                ref={viewerRef}
                envPreset={environmentMap}
                src={model_url}
                annotations={props.annotations}
                editedAnnotation={props.editedAnnotation}
                onCreateAnnotation={props.onCreateAnnotation}
                onEditAnnotation={props.onEditAnnotation}
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

