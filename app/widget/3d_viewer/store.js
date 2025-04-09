import { Euler } from 'three';
// import { PresetsType } from '@react-three/drei/helpers/environment-assets';
import {create} from "zustand";

const useStore = create((set) => ({
  ambientLightIntensity: 0,
  annotations: [],
  axesEnabled: true,
  boundsEnabled: false,
  cameraMode: 'perspective',
  environmentMap: 'apartment',
  gridEnabled: true,
  loading: true,
  measurementMode: 'object',
  measurementUnits: 'm',
  // mode: 'scene',
  mode: 'annotation',
  objectMeasurements: [],
  orthographicEnabled: false,
  rotationEuler: new Euler(0, 0, 0),
  rotationXDegrees: 0.0,
  rotationYDegrees: 0.0,
  rotationZDegrees: 0.0,
  sceneControlsEnabled: false,
  screenMeasurements: [],
  selectedAnnotation: null,
  srcs: [],

  setAmbientLightIntensity: (ambientLightIntensity) =>
      set({
        ambientLightIntensity,
      }),

  setAnnotations: (annotations) => {
      set({
          annotations,
      })
  },

  setAxesEnabled: (axesEnabled) =>
      set({
        axesEnabled,
      }),

  setBoundsEnabled: (boundsEnabled) =>
      set({
        boundsEnabled,
      }),

  setCameraMode: (cameraMode) => {
    set({
      cameraMode,
      orthographicEnabled: cameraMode === 'orthographic'
    })
  },

  setEnvironmentMap: (environmentMap) =>
      set({
        environmentMap,
      }),

  setGridEnabled: (gridEnabled) =>
      set({
        gridEnabled,
      }),

  setLoading: (loading) =>
      set({
        loading,
      }),

  setMeasurementMode: (measurementMode) => {
    set({
      measurementMode,
    });

    if (measurementMode === 'screen') {
      set({
        cameraMode: 'orthographic',
        orthographicEnabled: true
      })
    }
  },

  setMeasurementUnits: (measurementUnits) =>
      set({
        measurementUnits,
      }),

  setMode: (mode) =>
      set({
        mode,
      }),

  setObjectMeasurements: (measurements) =>
      set({
        objectMeasurements: measurements,
      }),

  setOrthographicEnabled: (orthographicEnabled) =>
      set({
        orthographicEnabled,
      }),

  setRotationEuler: (rotationEuler) =>
      set({
        rotationEuler,
      }),

  setRotationXDegrees: (rotationXDegrees) =>
      set({
        rotationXDegrees,
      }),

  setRotationYDegrees: (rotationYDegrees) =>
      set({
        rotationYDegrees,
      }),

  setRotationZDegrees: (rotationZDegrees) =>
      set({
        rotationZDegrees,
      }),

  setSceneControlsEnabled: (sceneControlsEnabled) =>
      set({
        sceneControlsEnabled,
      }),

  setScreenMeasurements: (measurements) =>
      set({
        screenMeasurements: measurements,
      }),

  setSelectedAnnotation: (selectedAnnotation) =>
      set({
        selectedAnnotation,
      }),

  setSrcs: (srcs) =>
      set({
        srcs,
        loading: true,
      }),
}));

export default useStore;