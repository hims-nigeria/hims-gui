; ( () => {

    "use strict";

    const { remote: { getCurrentWindow , app } } = require("electron");

    const { checkForInternet } = require("../js/utils.js");
    const { toast } = require("../js/domutils.js");
    const { getDashboard } = require("../js/requests.js");

    const { DASHBOARD_URL , LOGIN_URL } = require("../js/constants.js");

    window.addEventListener("DOMContentLoaded", async () => {

        const id = setInterval( () => {

            const spinDots = document.querySelector(".spin-dots");
            const temp = spinDots.innerHTML;
            spinDots.innerHTML = temp;
        } , 6000);

        checkForInternet( async (res,error) => {

            if ( error ) {
                toast({ text: "Yikes. You are not Connected to the Internet" , createAfter : 0 });
                //toast({ text: "Loading information from local database" , createAfter: 5000 });
            } else {
                toast({ text: "This device is connected to the internet" , createAfter : 0 });
            }

            setTimeout( async () => {

                clearInterval(id);

                const result = await getDashboard({
                    nextUrl  :  LOGIN_URL
                });

                if ( result ) getCurrentWindow().webContents.loadURL(DASHBOARD_URL);

            },10000);
        });
    });

})();
