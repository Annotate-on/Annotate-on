import { Box3, Matrix4, Object3D, Sphere, Vector3 } from 'three';
// import { clsx } from 'clsx';
// import { twMerge } from 'tailwind-merge';

// export function cn(...inputs) {
//     return twMerge(clsx(inputs));
// }

// Apply inverse of a matrix to a vector, e.g. for reversing rotation
export function applyMatrix4Inverse(v, m) {
    return v.clone().applyMatrix4(m.clone().invert());
}

export function areObjectsIdentical(a, b) {
    return JSON.stringify(a) === JSON.stringify(b);
}

const box = new Box3();
const sphere = new Sphere();

export function getBoundingSphere(object) {
    return box.setFromObject(object).getBoundingSphere(sphere);
}

export function normalizeSrc(src) {
    const srcs = [];

    if (typeof src === 'string') {
        srcs.push({
            url: src,
        });
    } else if (Array.isArray(src)) {
        // if it's an array, then it's already a ModelSrc object
        srcs.push(...src);
    } else {
        // if it's not a string or an array, then it's a single ModelSrc object
        srcs.push(src);
    }

    return srcs;
}

export const copyText = (text) => {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
};

export const downloadJsonFile = (json) => {
    const fileName = "aleph_annotations.json";
    const data = new Blob([json], { type: "text/json" });
    const jsonURL = window.URL.createObjectURL(data);
    const link = document.createElement("a");
    document.body.appendChild(link);
    link.href = jsonURL;
    link.setAttribute("download", fileName);
    link.click();
    document.body.removeChild(link);
}

export const parseAnnotations = (value) => {
    value.forEach((anno) => {
        anno.cameraPosition = new Vector3().fromArray(Object.values(anno.cameraPosition));
        anno.cameraTarget = new Vector3().fromArray(Object.values(anno.cameraTarget));
        anno.normal = new Vector3().fromArray(Object.values(anno.normal));
        anno.position = new Vector3().fromArray(Object.values(anno.position));
    });

    return value;
};

export function getElementTranslate(el) {
    let x;
    let y;

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

        return [x, y];
    }

    return null;
}

export function setElementTranslate(el, x, y) {
    el?.setAttribute('transform', `translate(${x}, ${y})`);
}