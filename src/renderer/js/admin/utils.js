"use strict";

const {
    ipcRenderer: ipc ,
    remote: {
        getCurrentWindow,
        dialog
    }
} = require("electron");

const hospitalDb = require("../../js/db.js");

module.exports.loadImageToDom = ({file,fileReader}) => {

    const previewParent = document.querySelector(".image-preview");
    const previewImage  = document.querySelector(".previewer");
    const imageText     = document.querySelector(".image-preview-text");

    fileReader.readAsDataURL(file);

    fileReader.addEventListener("load", evt => {
        imageText.style.display = "none";
        previewParent.style.padding = "unset";
        previewImage.src = evt.target.result;
        previewImage.style.display = "block";
    });
};


module.exports.addUserFormHandler = async ({ evt ,  _id , ipcEventName , FORM_STATE , saveUser, editUser }) => {

    evt.preventDefault();

    if ( ! evt.target.checkValidity() ) {
        dialog.showErrorBox("Something does not feel right","Please correct the wrong fields");
        return;
    }

    const previewImage  = document.querySelector(".previewer");
    const btns = Array.from(document.querySelectorAll("button"));
    const fData = new FormData(evt.target);

    let result;

    btns.forEach( x => x.disabled = true );

    if ( FORM_STATE === "EDIT" ) {
        fData.append(_id.name, _id.value);
        result = await editUser(fData,btns);
        ipc.sendTo( 1 , ipcEventName);
        return ;
    }

    result = await saveUser(fData,btns);

    if ( ! result ) return;
    console.log("came the hell here");
    ipc.sendTo( 1 , ipcEventName);
    //window.location.reload();
};

module.exports.setupEventOnDomLoad = (USER_ID , { title, FORM_STATE , collection, idType }) => {

    const previewParent = document.querySelector(".image-preview");
    const previewImage  = document.querySelector(".previewer");
    const imageText     = document.querySelector(".image-preview-text");

    ipc.on("window-state", async (evt,state,opt) => {

        if ( state !== "EDIT" ) return;

        const userToEdit = await hospitalDb[collection].get( { [idType]: opt.userId } );

        document.querySelector("p.op").textContent = document.title = title;
        USER_ID = opt.userId;
        FORM_STATE = "EDIT";

        Object.keys(userToEdit).forEach( async x => {

            const el = document.querySelector(`[name=${x}]`);

            if ( ! el ) return;

            if ( x === "image" ) {
                const dataURI = (new TextDecoder()).decode(userToEdit["image"]);
                el.required = false;
                imageText.style.display = "none";
                previewParent.style.padding = "unset";
                previewImage.src = dataURI;
                previewImage.style.display = "block";
                return;
            }
            el.value = userToEdit[x];
        });

    });

    ipc.sendTo(1,"get:window:state", getCurrentWindow().webContents.id);
};
