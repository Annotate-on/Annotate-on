import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import useStore from './store';
import { Intersection, Matrix4, Object3D, Object3DEventMap, Vector3 } from 'three';
import { useEventListener, useEventTrigger } from './lib/hooks/use-event';
import React from 'react';
import { Html } from '@react-three/drei';
import { useDrag } from '@use-gesture/react';
import {ANNO_CLICK, CAMERA_CONTROLS_ENABLED} from "./lib/constants";
import {applyMatrix4Inverse, cn} from "./lib/utils";

export function AnnotationTools({ cameraRefs, rotationMatrixRef }) {

  const {
    annotations,
    setAnnotations,
    selectedAnnotation,
    setSelectedAnnotation
  } = useStore();

  const { scene, camera, pointer, raycaster, size } = useThree();
  const DOT_PRODUCT_THRESHOLD = Math.PI * -0.1;
  const dragRef = useRef(null);
  const v1 = new Vector3();
  const v2 = new Vector3();

  function zoomToAnnotation(annotation) {
    v1.copy(annotation.cameraPosition).applyMatrix4(rotationMatrixRef.current);
    v2.copy(annotation.cameraTarget).applyMatrix4(rotationMatrixRef.current);
    cameraRefs.controls.current.setLookAt(
        v1.x,
        v1.y,
        v1.z,
        v2.x,
        v2.y,
        v2.z,
        true
    );
  }

  const handleAnnotationClick = (e) => {
    zoomToAnnotation(e.detail);
  };

  useEventListener(ANNO_CLICK, handleAnnotationClick);

  const triggerAnnoClick = useEventTrigger(ANNO_CLICK);

  function isFacingCamera(anno) {
    const cameraDirection = camera.position.clone().normalize().sub(
        anno.position.clone().normalize().applyMatrix4(rotationMatrixRef.current)
    );
    const dotProduct = cameraDirection.dot(anno.normal.clone().applyMatrix4(rotationMatrixRef.current));
    return dotProduct >= DOT_PRODUCT_THRESHOLD;
  }

  function updateAnnotationPosition(idx, x, y) {
    const annoEl = document.getElementById(`point-${idx}`);
    if (annoEl) {
      annoEl.setAttribute('transform', `translate(${x}, ${y})`);
    } else {
      console.error('could not find annotation element');
    }
  }

  function updateAnnotationPositions() {
    annotations.forEach((anno, idx) => {
      if (dragRef.current !== idx) {
        const [x, y] = calculatePosition(anno);
        updateAnnotationPosition(idx, x, y);
      }
    });
  }

  function checkAnnotationsFacingCamera() {
    annotations.forEach((anno, idx) => {
      const annoEl = document.getElementById(`point-${idx}`);
      if (annoEl) {
        if (isFacingCamera(anno)) {
          annoEl.classList.remove('facing-away');
        } else {
          annoEl.classList.add('facing-away');
        }
      }
    });
  }

  useFrame(() => {
    updateAnnotationPositions();
    checkAnnotationsFacingCamera();
  });

  const triggerCameraControlsEnabledEvent = useEventTrigger(CAMERA_CONTROLS_ENABLED);

  const bind = useDrag((state) => {
    const el = state.currentTarget;
    const idx = parseInt(el.getAttribute('data-idx'));
    if (!isFacingCamera(annotations[idx])) {
      return;
    }

    let x;
    let y;
    if (!state.memo) {
      const transformValue = el.getAttribute('transform');
      let translateValues = null;
      if (transformValue) {
        const match = transformValue.match(/translate\(([^)]+)\)/);
        if (match) {
          translateValues = match[1].split(', ');
        }
      }
      if (translateValues) {
        x = Number(translateValues[0]);
        y = Number(translateValues[1]);
      }
    } else {
      x = state.memo[0] + state.movement[0];
      y = state.memo[1] + state.movement[1];
      if (x !== state.memo[0] || y !== state.memo[1]) {
        dragRef.current = idx;
      }
    }
    updateAnnotationPosition(idx, x, y);
    if (!state.memo) {
      return [x, y];
    } else {
      return state.memo;
    }
  });

  function calculatePosition(anno) {
    const objectPos = v1.copy(anno.position).applyMatrix4(rotationMatrixRef.current);
    objectPos.project(camera);
    const widthHalf = size.width / 2;
    const heightHalf = size.height / 2;
    return [objectPos.x * widthHalf + widthHalf, -(objectPos.y * heightHalf) + heightHalf];
  }

  function getIntersects() {
    raycaster.setFromCamera(pointer, camera);
    return raycaster.intersectObjects(scene.children, true);
  }

  function drawAnnotations() {
    let primaryAnnotation = null;
    let primaryIndex = null;
    const fragments = [];

    annotations.map((anno, index) => {
      if (selectedAnnotation === index) {
        primaryAnnotation = anno;
        primaryIndex = index;
      } else {
        fragments.push(drawAnnotation(anno, index));
      }
    });

    if (primaryAnnotation && primaryIndex != null) {
      fragments.push(drawAnnotation(primaryAnnotation, primaryIndex));
    }

    return fragments;
  }

  function drawAnnotation(anno, index) {
    return (
        <React.Fragment key={index}>
          <g
              {...bind()}
              id={`point-${index}`}
              data-idx={index}
              className={cn('point', {
                selected: selectedAnnotation === index,
              })}
              onMouseDown={() => {
                if (isFacingCamera(anno)) {
                  triggerCameraControlsEnabledEvent(false);
                }
              }}
              onMouseUp={() => {
                if (isFacingCamera(anno)) {
                  if (dragRef.current === index) {
                    const intersects = getIntersects();
                    if (intersects.length > 0) {
                      setAnnotations(
                          annotations.map((anno, idx) => {
                            if (idx === index) {
                              return {
                                ...anno,
                                position: applyMatrix4Inverse(intersects[0].point, rotationMatrixRef.current),
                                normal: intersects[0].face?.normal,
                                cameraPosition: applyMatrix4Inverse(cameraRefs.position.current, rotationMatrixRef.current),
                                cameraTarget: applyMatrix4Inverse(cameraRefs.target.current, rotationMatrixRef.current),
                              };
                            }
                            return anno;
                          })
                      );
                    }
                    dragRef.current = null;
                  } else {
                    setSelectedAnnotation(index);
                    triggerAnnoClick(anno);
                  }
                  triggerCameraControlsEnabledEvent(true);
                }
              }}>
            <circle r="11" />
            <text x="0" y="0" textAnchor="middle" dominantBaseline="central" fontSize="10" fill="black">
              {index + 1}
            </text>
            {selectedAnnotation === index && anno && anno.label && (
                <foreignObject width="200" height={anno.description ? 80 : 38} x="18">
                  <div className="text">
                    <div className="label">{anno.label}</div>
                    {anno.description && <div className="description">{anno.description}</div>}
                  </div>
                </foreignObject>
            )}
          </g>
        </React.Fragment>
    );
  }

  return (
      <Html
          zIndexRange={[50, 0]}
          calculatePosition={() => {
            return [0, 0];
          }}
          style={{
            width: '100vw',
            height: '100vh',
            zIndex: 0,
          }}>
        <svg
            width="100vw"
            height="100vh"
            onDoubleClick={() => {
              const intersects = getIntersects();
              const position = applyMatrix4Inverse(intersects[0].point, rotationMatrixRef.current)
              if (intersects.length > 0) {
                setAnnotations([
                  ...annotations,
                  {
                    position: applyMatrix4Inverse(intersects[0].point, rotationMatrixRef.current),
                    normal: intersects[0].face?.normal,
                    cameraPosition: applyMatrix4Inverse(cameraRefs.position.current, rotationMatrixRef.current),
                    cameraTarget: applyMatrix4Inverse(cameraRefs.target.current, rotationMatrixRef.current)
                    ,label: 'Annotation label ' + (annotations.length + 1),
                    description: `Annotation description position: ${position.x}, ${position.y}, ${position.z}`,
                  },
                ]);
                setSelectedAnnotation(annotations.length);
              }
            }}>
          { drawAnnotations() }
        </svg>
      </Html>
  );
}