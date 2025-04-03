import React, {
    RefObject,
    Suspense,
    forwardRef,
    useEffect,
    useImperativeHandle,
    useRef,
    useState,
    useCallback
} from 'react';
import {Canvas, useThree} from "@react-three/fiber";
import {useEventListener, useEventTrigger} from "./lib/hooks/use-event";
import {
    CAMERA_CONTROLS_ENABLED,
    CAMERA_MODE_PERSPECTIVE,
    CAMERA_UPDATE,
    DBL_CLICK,
    DRAGGING_MEASUREMENT,
    DROPPED_MEASUREMENT,
    RECENTER
} from "./lib/constants";

import {
    CameraControls,
    Environment,
    GizmoHelper,
    GizmoViewport,
    Html,
    OrthographicCamera,
    PerspectiveCamera,
    PivotControls,
    useHelper,
    useProgress,
} from '@react-three/drei';

import {BoxHelper, Matrix4, Vector3} from "three";
import {getBoundingSphere, normalizeSrc, parseAnnotations} from "./lib/utils";
import useTimeout from "./lib/hooks/use-timeout";
import GLTF from "./gltf";
import {ee, EVENT_HIDE_WAITING, EVENT_SHOW_WAITING} from "../../utils/library";
import useStore from "./store";
import {AnnotationTools} from "./annotation-tools";

function Scene({envPreset, onLoad, src, rotationPreset, annotations}, ref) {
    const boundsRef = useRef(null);
    const boundsLineRef = useRef(null);
    const boundsSphereRef = useRef(null);
    const rotationControlsRef = useRef(null);

    const cameraRefs = {
        controls: useRef(null),
        position: useRef(new Vector3()),
        target: useRef(new Vector3()),
    };

    const cameraPosition = new Vector3();
    const cameraTarget = new Vector3();
    const {camera, gl} = useThree();

    // const [ambientLightIntensity, setAmbientLightIntensity] = useState(0.5);
    // const [axesEnabled, setAxesEnabled] = useState(true);
    // const [boundsEnabled, setBoundsEnabled] = useState(true);
    // const [cameraMode, setCameraMode] = useState(CAMERA_MODE_PERSPECTIVE);
    // const [gridEnabled, setGridEnabled] = useState(true);
    // const [loading, setLoading] = useState(true);
    // const [mode, setMode] = useState('scene');
    // const [orthographicEnabled, setOrthographicEnabled] = useState(false);
    // const [rotationEuler, setRotationEuler] = useState(new Vector3());
    // const [rotationXDegrees, setRotationXDegrees] = useState(0);
    // const [rotationYDegrees, setRotationYDegrees] = useState(0);
    // const [rotationZDegrees, setRotationZDegrees] = useState(0);
    // const [sceneControlsEnabled, setSceneControlsEnabled] = useState(true);
    // const [srcs, setSrcs] = useState([]);
    // const [annotations, setAnnotations] = useState([]);
    // const [selectedAnnotation, setSelectedAnnotation] = useState(null);

    const {
        ambientLightIntensity,
        axesEnabled,
        boundsEnabled,
        cameraMode,
        gridEnabled,
        loading,
        mode,
        orthographicEnabled,
        rotationEuler,
        rotationXDegrees,
        rotationYDegrees,
        rotationZDegrees,
        sceneControlsEnabled,
        setAnnotations,
        setLoading,
        setRotationEuler,
        setRotationXDegrees,
        setRotationYDegrees,
        setRotationZDegrees,
        setSelectedAnnotation,
        setSrcs,
        srcs,
    } = useStore();

    const rotationMatrixRef = useRef(new Matrix4().makeRotationFromEuler(rotationEuler));

    const triggerCameraUpdateEvent = useEventTrigger(CAMERA_UPDATE);

    useEffect(() => {
        const srcs = normalizeSrc(src);
        setSrcs(srcs);
        setAnnotations([]);
        ee.emit(EVENT_SHOW_WAITING);
    }, [src]);

    useEffect(() => {
        setRotationFromArray([
            rotationXDegrees * (Math.PI / 180),
            rotationYDegrees * (Math.PI / 180),
            rotationZDegrees * (Math.PI / 180)
        ]);
    }, [rotationEuler, rotationXDegrees, rotationYDegrees, rotationZDegrees]);

    useEffect(() => {
        if (!loading && rotationPreset) setRotationFromArray(rotationPreset, true);
    }, [loading]);

    useEffect(() => {
        if (!loading && annotations) setAnnotations(parseAnnotations(annotations));
    }, [loading]);

    useTimeout(
        () => {
            if (!loading) {
                window.dispatchEvent(new Event('resize'));
                recenter(true);
                ee.emit(EVENT_HIDE_WAITING);
            }
        },
        1,
        [loading, cameraMode]
    );

    useTimeout(
        () => {
            if (loading) {
                setLoading(false)
                ee.emit(EVENT_HIDE_WAITING);
            }
        },
        1000,
        [loading, cameraMode]
    );

    const handleRecenterEvent = (e) => {
        recenter(e.detail);
    };

    useEventListener(RECENTER, handleRecenterEvent);

    const handleCameraEnabledEvent = (e) => {
        cameraRefs.controls.current.enabled = e.detail;
    };

    useEventListener(CAMERA_CONTROLS_ENABLED, handleCameraEnabledEvent);

    function zoomToObject(object, instant, padding = undefined) {
        if (!padding) {
            if (!boundsSphereRef.current) boundsSphereRef.current = getBoundingSphere(object);
            padding = boundsSphereRef.current.radius * 0.1;
        }

        cameraRefs.controls.current.fitToBox(object, !instant, {
            cover: false,
            paddingLeft: padding,
            paddingRight: padding,
            paddingBottom: padding,
            paddingTop: padding,
        });
    }

    function recenter(instant) {
        // console.log('recenter', instant);
        if (boundsRef.current) {
            setCameraConfig();
            zoomToObject(boundsRef.current, instant);
        }
    }

    function setCameraConfig() {
        if (boundsRef.current) {
            boundsSphereRef.current = getBoundingSphere(boundsRef.current);
            const radius = boundsSphereRef.current.radius;
            if (orthographicEnabled) {
                const cameraObjectDistance = cameraRefs.controls.current.distance;
                if (cameraObjectDistance) {
                    camera.near = cameraObjectDistance - (radius * 100);
                    camera.far = cameraObjectDistance + (radius * 100);
                    camera.updateProjectionMatrix();
                }
                if (cameraRefs.controls.current) {
                    if ('isOrthographicCamera' in camera && camera.isOrthographicCamera) {
                        const width = camera.right - camera.left;
                        const height = camera.top - camera.bottom;
                        const diameter = radius * 2;
                        const zoom = Math.min(width / diameter, height / diameter);

                        cameraRefs.controls.current.maxZoom = (srcs.length === 1) ? (zoom * 4) : Infinity;
                        cameraRefs.controls.current.minZoom = zoom / 4;
                    }
                }
            } else {
                camera.near = radius * 0.01;
                camera.far = radius * 200;
                camera.updateProjectionMatrix();

                if (cameraRefs.controls.current) {
                    cameraRefs.controls.current.minDistance = (srcs.length === 1) ? radius : Number.EPSILON;
                    cameraRefs.controls.current.maxDistance = radius * 5;
                }
            }
        }
    }

    function setRotationFromArray(rotation, setRotationDegrees) {
        setRotationEuler(rotationEuler.fromArray(rotation));
        rotationMatrixRef.current.makeRotationFromEuler(rotationEuler);
        if (setRotationDegrees) {
            setRotationXDegrees(rotationEuler.x * (180 / Math.PI));
            setRotationYDegrees(rotationEuler.y * (180 / Math.PI));
            setRotationZDegrees(rotationEuler.z * (180 / Math.PI));
        }
    }

    function setRotationFromMatrix4(matrix) {
        rotationMatrixRef.current.copy(matrix);
        setRotationEuler(rotationEuler.setFromRotationMatrix(matrix, 'XYZ'));
        setRotationXDegrees(rotationEuler.x * (180 / Math.PI));
        setRotationYDegrees(rotationEuler.y * (180 / Math.PI));
        setRotationZDegrees(rotationEuler.z * (180 / Math.PI));
    }

    function getGridProperties() {
        if (boundsRef.current) {
            if (!boundsSphereRef.current) boundsSphereRef.current = getBoundingSphere(boundsRef.current);

            const breakPoints = [0.001, 0.01, 0.1, 1.0, 10.0, 100.0];
            let cellWidth = 10.0;

            for (const breakPoint of breakPoints) {
                if (boundsSphereRef.current.radius < breakPoint) {
                    cellWidth = breakPoint / 10.0;
                    break;
                }
            }

            return [cellWidth * 100.0, 100];
        } else {
            return [100, 100];
        }
    }

    function Bounds({lineVisible, children}) {
        useHelper(boundsLineRef, BoxHelper, 'white');

        const handleDoubleClickEvent = (e) => {
            if (mode === 'scene') {
                e.stopPropagation();
                if (e.delta <= 2) {
                    zoomToObject(e.object);
                }
            }
        };

        return (
            <group
                ref={boundsRef}
                onDoubleClick={handleDoubleClickEvent}
                onPointerMissed={(e) => {
                    const tagName = e.target.tagName;
                    if (tagName === 'SPAN' || tagName === 'DIV') {
                        return;
                    } else {
                        setSelectedAnnotation(null);
                    }
                }}>
                {lineVisible ? <group ref={boundsLineRef}>{children}</group> : children}
            </group>
        );
    }

    function Loader() {
        const {progress} = useProgress();
        console.log('progress', progress);
        if (progress === 100) {
            setTimeout(() => {
                if (onLoad) {
                    onLoad(srcs);
                    setLoading(false);
                    ee.emit(EVENT_HIDE_WAITING);
                }
            }, 1);
        }

        return (
            <Html>
                <div>Loading...</div>
            </Html>
            // <div>Loading...</div>
            // <Html
            //     wrapperClass="loading"
            //     calculatePosition={() => {
            //         return [gl.domElement.clientWidth / 2, gl.domElement.clientHeight / 2];
            //     }}>
            //     <div className="flex justify-center">
            //         <div className="h-1 w-24 bg-black rounded-full overflow-hidden transform translate-x-[-50%]">
            //             <div
            //                 className="h-full bg-white"
            //                 style={{
            //                     width: `${Math.ceil(progress)}%`,
            //                 }}
            //             />
            //         </div>
            //     </div>
            // </Html>
        );
    }

    function onCameraChange(e) {
        if (e.type !== 'update') {
            return;
        }
        cameraRefs.controls.current.getPosition(cameraPosition);
        cameraRefs.position.current = cameraPosition;
        cameraRefs.controls.current.getTarget(cameraTarget);
        cameraRefs.target.current = cameraTarget;
        triggerCameraUpdateEvent({cameraPosition, cameraTarget, rotationMatrix: rotationMatrixRef.current});
    }

    const Tools = {
      annotation: <AnnotationTools cameraRefs={cameraRefs} rotationMatrixRef={rotationMatrixRef} />,
      // measurement: <MeasurementTools rotationMatrixRef={rotationMatrixRef} />,
      scene: <></>,
    };

    return (
        <>
            {orthographicEnabled ? <OrthographicCamera makeDefault position={[0, 0, 2]}/> :
                <PerspectiveCamera makeDefault fov={30} position={[0, 0, 2]}/>}
            <CameraControls ref={cameraRefs.controls} onChange={onCameraChange} makeDefault/>
            <ambientLight intensity={ambientLightIntensity}/>
            <Suspense fallback={<Loader/>}>
                <PivotControls
                    ref={rotationControlsRef}
                    autoTransform={false}
                    depthTest={false}
                    disableAxes={true}
                    disableScaling={true}
                    disableSliders={true}
                    visible={sceneControlsEnabled && mode === 'scene'}
                    // enabled={sceneControlsEnabled && mode === 'scene'}
                    fixed={true}
                    matrix={rotationMatrixRef.current}
                    onDrag={(local) => setRotationFromMatrix4(local)}
                    scale={300}
                >
                    <Bounds lineVisible={boundsEnabled && mode === 'scene'}>
                        {srcs.map((src, index) => {
                            return (
                                <GLTF key={index} {...src} />
                            );
                        })}
                    </Bounds>
                </PivotControls>
            </Suspense>
            <Environment preset={envPreset}/>
            {Tools[mode]}
            {(gridEnabled && mode === 'scene') && <gridHelper args={getGridProperties()}/>}
            {(axesEnabled && mode === 'scene') &&
                <GizmoHelper alignment="bottom-right" margin={[100, 100]}>
                    <GizmoViewport labelColor="white" axisHeadScale={1}/>
                </GizmoHelper>
            }
        </>
    );
}

const Viewer = (props, ref) => {
    const LoadingIndicator = () => (
        <div>Loading...</div>
    );

    const canvasRef = useRef(null);
    const canvasHolderRef = useRef(null);

    const triggerDoubleClickEvent = useEventTrigger(DBL_CLICK);
    const triggerRecenterEvent = useEventTrigger(RECENTER);

    const [size, setSize] = useState({ width: window.innerWidth, height: window.innerHeight });

    const handleResize = () => {
        // console.log('resize' + size.width + ' ' + size.height);
        setSize({ width: window.innerWidth, height: window.innerHeight });
        triggerRecenterEvent();
    };

    useEffect(() => {
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    useImperativeHandle(ref, () => ({
        recenter: (instant) => {
            triggerRecenterEvent(instant);
        },
    }));

    useEventListener(DRAGGING_MEASUREMENT, () => {
        document.body.classList.add('dragging');
    });

    useEventListener(DROPPED_MEASUREMENT, () => {
        document.body.classList.remove('dragging');
    });

    return (
        <>
            {/*<Suspense fallback={<LoadingIndicator/>}>*/}
            <Suspense>
                <Canvas
                    style={{width: size.width - 368, height: size.height - 108}}
                    ref={canvasRef}
                    camera={{fov: 30}}
                    onDoubleClick={(e) => {
                        triggerDoubleClickEvent(e);
                    }}>
                    <Scene {...props} />
                </Canvas>
            </Suspense>
        </>
    );
};

export default forwardRef(Viewer);