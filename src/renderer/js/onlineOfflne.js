;( () => {
    
    "use strict";

    const { checkForInternet } = require("../js/utils.js");
    const { toast } = require("../js/domutils.js");


    window.addEventListener("online", () => {
        
        checkForInternet( async ( res ,error ) => {
            
            if ( error ) {
                toast({ text: "Unable to access remote server. Check your internet connection" , createAfter : 0 });
                //toast({ text: "Loading information from local database" , createAfter: 5000 });
            } else {
                toast({ text: "This device is connected to the internet" , createAfter : 0 });
                toast({ text: "Offline data will be automatically synced with remove server" , createAfter : 5000 });
            }

            
            
        });
    });


    window.addEventListener("offline", () => {
        toast({ text: "Your internet is down. All operations will be saved offline" , createAfter : 0 });
    });
    
})();
