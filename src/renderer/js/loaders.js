; ( () => {

    "use strict";

    const { remote: { getCurrentWindow , app } } = require("electron");

    const { checkForInternet } = require("../js/utils.js");
    const { toast } = require("../js/domutils.js");

    window.addEventListener("DOMContentLoaded", async () => {

        const id = setInterval( () => {
            const spinDots = document.querySelector(".spin-dots");
            const temp = spinDots.innerHTML;
            spinDots.innerHTML = temp;
        } , 6000);

        checkForInternet((res,error) => {
            if ( error ) {
                toast({ text: "Yikes. You are not Connected to the Internet" , createAfter : 0 });
                //toast({ text: "Loading information from local database" , createAfter: 5000 });
            } else {
                toast({ text: "This device is connected to the internet" , createAfter : 0 });
            }
            console.log("Connected");
        });
    });
    
})();
