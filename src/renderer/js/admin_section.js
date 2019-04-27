; ( () => {

    "use strict";

    const { remote: { getCurrentWindow } } = require("electron");

    const toggler = document.querySelector(".nav-header-toggler");
    const asideNav = document.querySelector(".section-nav");
    const navOperations = document.querySelector(".section-nav-operation");
    const logoutBtn  = document.querySelector(".logout");
    const navList = document.querySelector(".nav-list");

    const admin = require("../js/admin.js");

    const { logout }    = require("../js/requests.js");
    const { LOGIN_URL } = require("../js/constants.js");

    toggler.addEventListener("click", evt => {
        if ( asideNav.hasAttribute("data-hide-nav") ) {
            asideNav.removeAttribute("data-hide-nav");
            asideNav.removeAttribute("style");
            navOperations.removeAttribute("style");
            return;
        }
        asideNav.setAttribute("data-hide-nav", true);
        asideNav.style.width = "10%";
        navOperations.style.width = "90%";
    });

    window.addEventListener("DOMContentLoaded", async () => {
        admin.emit("admin-dashboard");
        //admin.emit("admin-nurse");
    });

    navList.addEventListener("click", evt => {

        let { target } = evt;

        if ( target instanceof HTMLUListElement ) return;

        if ( ! (target instanceof HTMLLIElement) )
            target = target.parentNode;

        const eventName = target.getAttribute("data-fire");
        admin.emit(eventName);
    });


    logoutBtn.addEventListener("click", async () => {

        const result = await logout({
            nextUrl: LOGIN_URL
        });

        if ( result ) getCurrentWindow().webContents.loadURL(LOGIN_URL);
    });

})();
