"use script";

const hospitalDb = require("../js/db.js");

module.exports.toast = ( { text , createAfter, deleteAfter } ) => {

    const animateProperties = [
        { right: "5px"  },
        { right: "10px" },
        { right: "15px" },
        { right: "20px" },
        { right: "25px" },
        { right: "30px" },
        { right: "35px" },
        { right: "40px" }
    ];

    setTimeout( () => {

        const toastParent = document.createElement("div");
        const toastClose  = document.createElement("p");
        const toastText   = document.createElement("p");


        toastParent.classList.add("toast-parent");
        toastClose.classList.add("toast-close");
        toastClose.classList.add("fa");
        toastClose.classList.add("fa-times");
        toastText.classList.add("class", "toast-text");

        toastClose.addEventListener("click", () => toastParent.remove());

        toastParent.appendChild(toastText);
        toastParent.appendChild(toastClose);

        toastText.textContent = text;

        document.body.appendChild(toastParent);

        setTimeout( () => {
            toastParent.animate( Array.from(animateProperties).reverse(), {
                duration: 100,
                fill: "forwards"
            });

        } , 5000 );

        setTimeout( () => {
            toastParent.remove();
        },5100);

        toastParent.animate( animateProperties , {
            duration: 100,
            fill: "forwards"
        });

    }, createAfter );
};

module.exports.spinner = () => {

    const spinnerParent = document.createElement("div");
    const spinner = document.createElement("i");

    spinner.classList.add("fa");
    spinner.classList.add("fa-spinner");
    spinner.classList.add("fa-pulse");
    spinner.classList.add("fa-5x");

    spinner.style.color = "black";

    Object.assign( spinnerParent.style, {
        display: "flex",
        justifyContent: "center",
        position: "relative",
        top: "250px"
    });

    spinnerParent.classList.add("spin-pending");

    spinnerParent.appendChild(spinner);

    return spinnerParent;
};

module.exports.createTable = obj => {

    const { headers , tableRows , id  } = obj;

    const table = document.createElement("table");


    // thead section
    const thead = document.createElement("thead");
    const trForHead = document.createElement("tr");


    headers.push("operations");

    thead.classList.add("data-color");
    thead.appendChild(trForHead);

    // tbody section
    const tbody = document.createElement("tbody");

    headers.forEach( theaderContent => {
        const th = document.createElement("th");
        th.textContent = theaderContent.replace(/^./, theaderContent[0].toUpperCase());
        trForHead.appendChild(th);
    });

    let idx = 0;

    headers.push(id);

    tableRows.forEach( trow => {

        const tr = document.createElement("tr");

        if ( idx === 0 ) {
            tr.classList.add("data-color");
            idx = 1;
        } else idx = 0;

        headers.forEach( tdata => {

            const td  = document.createElement("td");

            switch(tdata) {
            case "image":
                const img = new Image();
                img.src = (new TextDecoder()).decode(trow[tdata]);
                td.appendChild(img);
                tr.appendChild(td);
                return;
            case "name":
                td.textContent = trow["fullName"];
                tr.appendChild(td);
                return;
            case "phone":
                td.textContent = trow["phoneNumber"];
                tr.appendChild(td);
                return;
            case "birth date":
                td.textContent = trow["dob"];
                tr.appendChild(td);
                return;
            case "blood group":
                td.textContent = trow["bloodGroup"];
                tr.appendChild(td);
                return;
            case "card no":
                td.textContent = trow["cardNumber"];
                tr.appendChild(td);
                return;
            case "operations":

                const editAnchor   = document.createElement("a");
                const deleteAnchor = document.createElement("a");

                editAnchor.setAttribute("data-ops", "edit");
                deleteAnchor.setAttribute("data-ops", "delete");


                editAnchor.textContent   = "Edit";
                deleteAnchor.textContent = "Delete";

                td.appendChild(editAnchor);
                td.appendChild(deleteAnchor);
                tr.appendChild(td);

                return;
            case "intervention":
                td.textContent = trow["interventionName"];
                tr.appendChild(td);
                return;
            case "sub intervention":
                td.textContent = trow["subInterventionName"];
                tr.appendChild(td);
                return;
            case "category":
                td.textContent = trow["interventionName"];
                tr.appendChild(td);
                return;
            default:

                if ( headers[headers.length - 1] === tdata ) {
                    tr.setAttribute("user-id", trow[tdata]);
                    return;
                }

                td.textContent = trow[tdata];
                tr.appendChild(td);
            }


        });

        tbody.appendChild(tr);
    });

    table.appendChild(thead);
    table.appendChild(tbody);

    return table;
};


module.exports.buildAdminAccountPage = async sectionNav => {

    const result = await hospitalDb.sessionObject.get({ id: 0 });

    const editProfMarkup = `

        <div class="edit-profile currently-shown">

            <form class="admin-edit-profile">
               <label>
                  <span> Name </span>
                  <input type="text" required value=${result.fullName} >
               </label>
               <label>
                  <span> Email </span>
                  <input type="email" value=${result.email} disabled >
               </label>
               <button type="button" class="update-profile"> Update Profile </button>
            </form>

            <form class="admin-edit-password">
               <label>
                  <span> Current Password </span>
                  <input type="password" name="currentPassword" required />
               </label>
               <label>
                  <span> New Password </span>
                  <input type="password" name="password" required/>
               </label>
               <label>
                  <span> Confirm Password </span>
                  <input type="password" name="confirmPassword" required/>
               </label>
               <button type="button" class="update-profile"> Update Password </button>
            </form>
        </div>
   `;

    sectionNav.appendChild(
        new DOMParser().parseFromString(
            editProfMarkup,
            "text/html"
        ).querySelector(".currently-shown")
    );

    return result;
};
