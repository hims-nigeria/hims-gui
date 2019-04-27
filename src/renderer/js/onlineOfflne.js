;( () => {

    "use strict";

    const path = require("path");
    const { remote: { app } } = require("electron");

    const { checkForInternet } = require("../js/utils.js");
    const { toast } = require("../js/domutils.js");

    const MongoClient = require("mongodb").MongoClient;
    const hospitalDb  = require("../js/db.js");

    const dotenv  = require("dotenv").config({
        path: process.env.NODE_ENV === "development"
            ? path.join(app.getAppPath(), ".env.development")
            : path.join(app.getAppPath(), ".env.production")
    });

    const {
        dbHost,
        dbPort,
        dbName
    } = process.env;

    const CONNECTION_STRING = `mongodb://${dbHost}:${dbPort}`;

    const syncData = () => {

        setTimeout( () => {

            checkForInternet( async ( res ,error ) => {

                if ( error ) {
                    console.log(error);
                    toast({ text: "Unable to access remote server. Check your internet connection" , createAfter : 0 });
                    toast({ text: "All operations will be saved offline until you have internet connection" , createAfter : 5000 });
                    return ;
                } else {

                    toast({
                        text: "This device is connected to the internet",
                        createAfter : 6000
                    });

                    if ( ! (await hospitalDb.offlineAccounts.toArray()).length ) {
                        toast({
                            text: "Data is upto date",
                            createAfter: 15000
                        });
                        return;
                    }

                    toast({
                        text: "Offline data will be syned automatically",
                        createAfter : 10000
                    });
                }

                let client;

                try {

                    client = await MongoClient.connect( CONNECTION_STRING , { useNewUrlParser: true });

                    const db = client.db(dbName);

                    // db.collection("departments");
                    // db.collection("doctors");
                    // db.collection("laboratorists");
                    // db.collection("patients");
                    // db.collection("nurses");
                    // db.collection("pharmacists");
                    // db.collections("transactions");

                    const results = await hospitalDb.offlineAccounts.toArray();

                    results.forEach( async document => {
                        const newInformationType = document.newInformationType;
                        const id = document.id;
                        delete document.id;
                        delete document.newInformationType;
                        await db.collection( newInformationType ).insert( document );
                        await hospitalDb.offlineAccounts.where("newInformationType").equals(newInformationType).and( x => x.id === id ).delete();
                    });

                    toast({
                        text: "Hooray. Data have been synced sucessfully",
                        createAfter: 15000
                    });

                } catch(ex) {
                    console.log(ex);
                    toast({
                        text: "Encountered an error while syncing data. Check your internet or click the sync button",
                        createAfter: 0
                    });
                } finally {
                    if ( client )
                        client.close();
                }
            });
        },5000);
    };

    window.addEventListener("online", syncData );

    window.addEventListener("DOMContentLoaded", syncData);

    window.addEventListener("offline", () => {
        toast({ text: "Your internet is down. All operations will be saved offline" , createAfter : 0 });
    });

})();
