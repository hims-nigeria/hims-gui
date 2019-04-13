"use strict";

const { remote: { getCurrentWindow } } = require("electron");
const axios = require("axios");
const qs    = require("querystring");

const { toast } = require("../js/domutils.js");
const {
    hashPassword,
    createExternalId,
    comparePassword
} = require("../js/utils.js");

const hospitalDb = require("../js/db.js");

const REQUEST_URL = process.env.NODE_ENV === "development"
      ? "http://localhost:3001"
      : "protocol://host:port";


// this will read from local database

const apiCallHandler = async (result,obj, cb = function() {}) => {

    if ( obj.disabled ) obj.disabled.forEach( el => el.disabled = false );

    const __cb = async () => {
        try {
            return (await cb());
        } catch(ex) {
            console.log(ex);
            toast({
                text: "Cannot carry out operation. Please try again later or contact a system administrator",
                createAfter : 6000
            });
            return false;
        }
    };

    // when internet is down
    if ( ! result.response ) {
        toast({
            text: "Oops. We can't communicate with server now. All changes will be saved offline",
            createAfter : 0
        });
        // save data from api
        return await __cb();
    }

    if ( result.response.data.status >= 500 ) {

        toast({
            text: result.response.data.message,
            createAfter: 0
        });

        // if user is not authorized to view a section
        // redirect that user to another url

        if ( result.response.data.status === 401 ) {
            setTimeout(() => {
                getCurrentWindow().webContents.loadURL(obj.nextUrl);
            },6000);
        }

        return false;
    }

    return await __cb();
};

module.exports.getDashboard = async obj => {

    let result;

    try {
        result = await axios.get(`${REQUEST_URL}/dashboard/`);
    } catch(ex) {
        result = ex;
    } finally {
        return await apiCallHandler(result,obj, async () => {
            if ( ! result.response ) {
                const session = await hospitalDb.sessionObject.count();
                if ( ! session ) {
                    getCurrentWindow().webContents.loadURL(obj.nextUrl);
                    return false;
                }
            }
            // redirect user to the dashboard
            // retrieve relevant role , email , and session
            return true;
        });
    }
};

module.exports.login = async (data,obj) => {

    const OBJECT_TO_CHECK_AGAINST = {};

    for ( let [ key , value ] of data.entries() )
        OBJECT_TO_CHECK_AGAINST[key] = value;

    let result;

    try {
        result = await axios.post(`${REQUEST_URL}/login/`, data );
    } catch(ex) {
        result = ex;
    } finally {
        /**
           for logging in we are only intrested in setting
           sessionObject collection in indexDB
           we would check if result.response is undefined
           if it is undefined we would search our local cache to login user and set sessionObject
           but in a situation were the internet is not down we are only interested in setting the sessionObject
           in indexDB. We are not interested in reading from the cache to login user
         **/
        return apiCallHandler(result,obj, async () => {

            let usersProm;

            if ( ! result.response ) {

                usersProm = await Promise.all([
                    await hospitalDb.healthFacility.get({ email: OBJECT_TO_CHECK_AGAINST.email })
                ]);

                if ( ! usersProm.every( x => x !== undefined) ) {
                    toast({
                        text: `No account is associated with ${OBJECT_TO_CHECK_AGAINST.email}`,
                        createAfter: 6000
                    });
                    return false;
                }

                usersProm = usersProm.find( x => x !== undefined );

                const pwd = await comparePassword(OBJECT_TO_CHECK_AGAINST.password,usersProm.password);

                if ( pwd instanceof Error ||  ! pwd ) {
                    toast({
                        text: `email and/or password is incorrect`,
                        createAfter: 6000
                    });
                    return false;
                }
            }
            console.log(usersProm);
            await hospitalDb.sessionObject.put({
                id: 0,
                role: usersProm.role || result.response.data.message.role,
                email: OBJECT_TO_CHECK_AGAINST.email
            });

            return true;
        });
    }
};

module.exports.register = async (data,obj) => {

    const OBJECT_TO_CACHE = {};

    for ( let [ key , value ] of data.entries() ) OBJECT_TO_CACHE[key] = value;

    const hpwd = await hashPassword(OBJECT_TO_CACHE.password,OBJECT_TO_CACHE.confirmPassword);

    if ( hpwd instanceof Error ) {
        toast({
            text: "An unexpected error has occurred. Please contact the system administrator",
            createAfter: 0
        });
        return false;
    }

    if ( ! hpwd ) {
        toast({
            text: "password and current password does not match",
            createAfter: 0
        });
        return false;
    }


    OBJECT_TO_CACHE.password = hpwd;
    OBJECT_TO_CACHE.role = "admin";
    OBJECT_TO_CACHE.healthFacilityId = createExternalId(OBJECT_TO_CACHE.healthCareName,Date.now());

    delete OBJECT_TO_CACHE.activationKey;
    delete OBJECT_TO_CACHE.confirmPassword;

    let result;

    try {
        result = await axios.post(`${REQUEST_URL}/register/health-care-center`, data);
    } catch(ex) {
        result = ex;
    } finally {
        return await apiCallHandler(result,obj, async () => {
            console.log(OBJECT_TO_CACHE);
            await hospitalDb.healthFacility.add(OBJECT_TO_CACHE);
            await hospitalDb.sessionObject.put({
                id: 0,
                role: "admin",
                email: OBJECT_TO_CACHE.email
            });
            toast({
                text: "Registration was succesfull. Data will be synced with remote database when your device is online",
                createAfter : 0
            });
            return true;
        });
    }
};
