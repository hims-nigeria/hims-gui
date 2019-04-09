; ( () => {
    
    "use strict";

    const { remote: { getCurrentWindow , app } } = require("electron");
    
    const userSectionList = document.querySelector(".user-section-list");
    const { getDashboard } = require("../js/requests.js");

    userSectionList.addEventListener("click", async evt => {
        
        let { target } = evt;

        if ( HTMLUListElement[Symbol.hasInstance](target) ) return;
        
        if ( HTMLLIElement[Symbol.hasInstance](target) )
            target = target.firstElementChild;

        const section = target.getAttribute("data-fire");

        target.disabled = true;

        const result = await getDashboard(section);

        if ( Error[Symbol.hasInstance](result) ) {
            switch(result.response.data) {
            case 401:
                getCurrentWindow().loadURL(`file://${app.getAppPath()}/src/renderer/login.html`);
                break;
            case "":
                break;
            case "":
                break;
            default:
                break;
            };
            return;
        }

        getCurrentWindow().loadURL(`file://${app.getAppPath()}/src/renderer/admin/dashboard.html`);
        
    });
    
})();
