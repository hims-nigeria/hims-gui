; ( () => {

    "use strict";

    const toggler = document.querySelector(".nav-header-toggler");
    const asideNav = document.querySelector(".section-nav");
    const navOperations = document.querySelector(".section-nav-operation");

    const { getDashboard } = require("../js/requests.js");
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

        const result = await getDashboard({
            nextUrl: LOGIN_URL
        });

        if ( ! result ) return;

        const reportUl = document.createElement("ul");

        reportUl.setAttribute("class", "dashboard-list");

        let idx = 0;
        
        Object.keys(result.dashboardInfo).sort().forEach( x => {

            const li = document.createElement("li");
            const p  = document.createElement("p");
            const i  = document.createElement("i");

            const pText  = document.createElement("p");

            li.classList.add("dashboard-item");
            li.classList.add(`dashboard-item-${idx++}`);
            p.setAttribute("class", "dashboard-item-count");
            pText.setAttribute("class", "dashboard-item-name");

            p.textContent = result.dashboardInfo[x];
            pText.textContent = x.replace(/^./, x[0].toUpperCase());

            li.appendChild(pText);
            li.appendChild(p);
            li.appendChild(i);
            
            reportUl.appendChild(li);
        });

        const userRole = document.querySelector(".user-role");
        const userName = document.querySelector(".user-name");
        const sectionNavOps = document.querySelector(".section-nav-operation");
        
        userRole.textContent = result.role;
        userName.textContent = result.fullName;
        sectionNavOps.appendChild(reportUl);
    });

})();
