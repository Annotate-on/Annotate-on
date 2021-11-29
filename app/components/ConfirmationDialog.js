import {remote} from "electron";

export const extendEventConfirmationDialog = (text , detail) => {
    return remote.dialog.showMessageBox(remote.getCurrentWindow () ,{
    type: 'question',
    buttons: ['Yes', 'No'],
    message: text,
    cancelId: 1,
    detail: detail
})};

