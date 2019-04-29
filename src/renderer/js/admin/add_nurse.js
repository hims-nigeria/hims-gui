; ( () => {

    "use strict";

    const {
        ipcRenderer: ipc,
        remote: {
            BrowserWindow,
            getCurrentWindow,
            dialog
        }
    } = require("electron");

    const { saveNurse , editNurse } = require("../../js/requests.js");
    const { NOT_MAIN_WINDOW_URL } = require("../../js/constants.js");

    const hospitalDb = require("../../js/db.js");

    const selectImage   = document.querySelector(".select-image");
    const previewParent = document.querySelector(".image-preview");
    const previewImage  = document.querySelector(".previewer");
    const imageText     = document.querySelector(".image-preview-text");
    const fileLoader    = document.querySelector("[type=file]");

    const form = document.querySelector(".admin-add-user-form");

    const fReader = new FileReader();


    let FORM_STATE , DATA_URL, NURSE_ID ;

    selectImage.addEventListener("click", () => {
        fileLoader.click();
    });


    fileLoader.addEventListener("input", evt => {
        fReader.readAsDataURL(evt.target.files[0]);
        fReader.addEventListener("load", evt => {
            imageText.style.display = "none";
            previewParent.style.padding = "unset";
            previewImage.src = evt.target.result;
            previewImage.style.display = "block";
        });
    });

    form.addEventListener("submit", async evt => {

        evt.preventDefault();

        if ( ! form.checkValidity() ) {
            dialog.showErrorBox("Something does not feel right","Please correct the wrong fields");
            return;
        }

        const btns = Array.from(document.querySelectorAll("button"));
        const fData = new FormData(form);

        let result;

        btns.forEach( x => x.disabled = true );


        if ( FORM_STATE === "EDIT" ) {
            fData.append("nurseId", NURSE_ID);
            result = await editNurse( fData , {
                disabled : btns,
                dataUri  : previewImage.src
            });
            ipc.sendTo( 1 , "admin-nurse");
            return ;
        }

        result = await saveNurse(  fData , {
            disabled: btns,
            dataUri: previewImage.src
        });

        if ( ! result ) return;

        ipc.sendTo( 1 , "admin-nurse");
        window.location.reload();

    });

    window.addEventListener("DOMContentLoaded", () => {

        ipc.on("window-state", async (evt,state,opt) => {

            if ( state !== "EDIT" ) return;

            const nurseToEdit = await hospitalDb.nurses.get( { nurseId: opt.userId } );

            document.querySelector("p.op").textContent = document.title = "Edit Nurse";
            NURSE_ID = opt.userId;
            FORM_STATE = "EDIT";

            Object.keys(nurseToEdit).forEach( async x => {

                const el = document.querySelector(`[name=${x}]`);

                if ( ! el ) return;

                if ( x === "image" ) {
                    const dataURI = (new TextDecoder()).decode(nurseToEdit["image"]);
                    el.required = false;
                    imageText.style.display = "none";
                    previewParent.style.padding = "unset";
                    previewImage.src = dataURI;
                    previewImage.style.display = "block";
                    return;
                }
                el.value = nurseToEdit[x];
            });

        });

        ipc.sendTo(1,"get:window:state", getCurrentWindow().webContents.id);

    });

})();
