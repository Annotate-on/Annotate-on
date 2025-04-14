// Camera modes
import {capitalizeFirstLetter} from "./utils";

export const CAMERA_MODE_PERSPECTIVE = "perspective";
export const CAMERA_MODE_ORTHOGRAPHIC = "orthographic";

// Events
export const ANNO_CLICK = 'alannoclick';
export const CAMERA_CONTROLS_ENABLED = 'alcameracontrolsenabled';
export const CAMERA_UPDATE = 'alcameraupdate';
export const DBL_CLICK = 'aldblclick';
export const DRAGGING_MEASUREMENT = 'aldraggingmeasurement';
export const DROPPED_MEASUREMENT = 'aldraggedmeasurement';
export const RECENTER = 'alrecenter';

//Environments
export const ENVIRONMENT_APARTMENT = 'apartment';
export const ENVIRONMENT_CITY = 'city';
export const ENVIRONMENT_DAWN = 'dawn';
export const ENVIRONMENT_FOREST = 'forest';
export const ENVIRONMENT_LOBBY = 'lobby';
export const ENVIRONMENT_NIGHT = 'night';
export const ENVIRONMENT_PARK = 'park';
export const ENVIRONMENT_STUDIO = 'studio';
export const ENVIRONMENT_SUNSET = 'sunset';
export const ENVIRONMENT_WAREHOUSE = 'warehouse';
export const ENVIRONMENT_MAPS = [
    {
        value: ENVIRONMENT_APARTMENT,
        label: capitalizeFirstLetter(ENVIRONMENT_APARTMENT)
    },
    {
        value: ENVIRONMENT_CITY,
        label: capitalizeFirstLetter(ENVIRONMENT_CITY)
    },
    {
        value: ENVIRONMENT_DAWN,
        label: capitalizeFirstLetter(ENVIRONMENT_DAWN)
    },
    {
        value: ENVIRONMENT_FOREST,
        label: capitalizeFirstLetter(ENVIRONMENT_FOREST)
    },
    {
        value: ENVIRONMENT_LOBBY,
        label: capitalizeFirstLetter(ENVIRONMENT_LOBBY)
    },
    {
        value: ENVIRONMENT_NIGHT,
        label: capitalizeFirstLetter(ENVIRONMENT_NIGHT)
    },
    {
        value: ENVIRONMENT_PARK,
        label: capitalizeFirstLetter(ENVIRONMENT_PARK)
    },
    {
        value: ENVIRONMENT_STUDIO,
        label: capitalizeFirstLetter(ENVIRONMENT_STUDIO)
    },
    {
        value: ENVIRONMENT_SUNSET,
        label: capitalizeFirstLetter(ENVIRONMENT_SUNSET)
    },
    {
        value: ENVIRONMENT_WAREHOUSE,
        label: capitalizeFirstLetter(ENVIRONMENT_WAREHOUSE)
    }
];


