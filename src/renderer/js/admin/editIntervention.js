// ; ( () => {

//     "use strict";

//     const {
//         ipcRenderer: ipc,
//         remote: { getCurrentWindow, dialog }
//     } = require("electron");

//     const {
//         setupEventOnDomLoad,
//         addUserFormHandler
//     } = require("../../js/utils.js");

//     const { instance } = require("../../js/admin/adminRequest.js");

//     const {
//         handleUploadedImage
//     } = require("../../js/domutils.js");

//     const form  = document.querySelector("form");
//     const close = document.querySelector(".close");

//     const previewImage = handleUploadedImage();

//     const FORM_STATE = {
//         state  : undefined,
//         userId : undefined,
//         __newWindowSpec: {
//             idType: undefined,
//             collection: undefined,
//             url: undefined,
//             ipcEventName: undefined,
//             generateIdFrom: undefined
//         }
//     };

//     form.addEventListener("submit", evt => addUserFormHandler(FORM_STATE,{
//         evt,
//         saveUser: async (fData,btns) => {
//             return await instance.adminCreateIntervention(  fData , {
//                 disabled  : btns,
//                 dataUri   : previewImage ? previewImage.src : "",
//                 ...FORM_STATE.__newWindowSpec
//             });
//         },
//         editUser: async (fData,btns) => {
//             return await instance.adminEditIntervention( fData , {
//                 disabled   : btns,
//                 dataUri    : previewImage ? previewImage.src : "",
//                 ...FORM_STATE.__newWindowSpec
//             });
//         }
//     }));

//     window.addEventListener("DOMContentLoaded", () => setupEventOnDomLoad( FORM_STATE ));

//     close.addEventListener("click", () => getCurrentWindow().close() );

// })();
