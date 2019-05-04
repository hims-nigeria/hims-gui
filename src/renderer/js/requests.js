"use strict";

const { remote: { getCurrentWindow, dialog } } = require("electron");
const axios = require("axios");
const qs    = require("querystring");

const { toast } = require("../js/domutils.js");
const { REQUEST_URL } = require("../js/constants.js");

const {
    deleteUserInfo,
    loadUsersInfo,
    saveUserInfo,
    editUserInfo
} = require("../js/dbHelper.js");

const {
    formDataToObject,
    hashPassword,
    createExternalId,
    comparePassword,
    isEmailExists
} = require("../js/utils.js");

const hospitalDb = require("../js/db.js");


// this will read from local database

const apiCallHandler = async (result,obj, cb = function() {}) => {

    if ( typeof(obj) === "function" ) {
        cb = obj;
        obj = {};
    }


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
            text: "Oops. We can't communicate with server now",
            createAfter : 0
        });
        // save data from api
        return await __cb();
    }

    if ( result.response.data.status >= 400 ) {

        toast({
            text: result.response.data.message,
            createAfter: 0
        });

        // if user is not authorized to view a section
        // redirect that user to another url

        if ( result.response.data.status === 401 ) {

            if ( ! obj.nextUrl ) {
                return dialog.showErrorBox("You are not authorized to carry out this operation", "Please logout and login again");
            }

            setTimeout(() => {
                getCurrentWindow().webContents.loadURL(obj.nextUrl);
            },6000);
        }

        return false;
    }

    return await __cb();
};

module.exports.apiCallHandler = apiCallHandler;

module.exports.getDashboard = async obj => {

    let result;

    try {
        result = await axios.get(`${REQUEST_URL}/dashboard/`);
    } catch(ex) {
        result = ex;
    } finally {

        return await apiCallHandler(result,obj, async () => {

            let userInfo = {} ;

            if ( ! result.response ) {

                const session = await hospitalDb.sessionObject.toArray();

                if ( ! session.length ) {
                    getCurrentWindow().webContents.loadURL(obj.nextUrl);
                    return false;
                }

                switch( session[0].role ) {
                case "admin":
                    const { fullName, role , dashboardInfo } = await hospitalDb.healthFacility.get({ healthFacilityId : session[0].healthFacilityId });
                    Object.assign( userInfo , { dashboardInfo, fullName, role } );
                    break;
                }
            }
            return Object.keys(userInfo).length !== 0 ? userInfo : result.response.data.message ;
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

            let res;

            if ( ! result.response ) {

                res = await isEmailExists( OBJECT_TO_CHECK_AGAINST.email );

                if ( ! res.length ) {
                    toast({
                        text: `No account is associated with ${OBJECT_TO_CHECK_AGAINST.email}`,
                        createAfter: 6000
                    });
                    return false;
                }

                ( [ res ] = res );

                const pwd = await comparePassword(OBJECT_TO_CHECK_AGAINST.password,res.password);

                if ( pwd instanceof Error ||  ! pwd ) {
                    toast({
                        text: `email and/or password is incorrect`,
                        createAfter: 6000
                    });
                    return false;
                }
            }

            const { role , healthFacilityId , fullName , email  } = res ? res : result.response.data.message;

            await hospitalDb.sessionObject.put({
                healthFacilityId,
                fullName,
                email,
                role,
                id: 0
            });

            return true;
        });
    }
};

module.exports.register = async (data,obj) => {

    const OBJECT_TO_CACHE = {};

    const hpwd = await formDataToObject(data,OBJECT_TO_CACHE);

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

            const resultEmail = await isEmailExists( OBJECT_TO_CACHE.email );

            if ( resultEmail.length ) {
                toast({
                    text: `${OBJECT_TO_CACHE.email} is not avaiable`,
                    createAfter: 6000
                });
                return false;
            }

            await hospitalDb.healthFacility.add({
                ...OBJECT_TO_CACHE,
                dashboardInfo: {
                    receptionists: 0,
                    laboratorists: 0,
                    transactions: 0,
                    pharmacists: 0,
                    accountants: 0,
                    patients: 0,
                    doctors: 0,
                    nurses: 0,
                    interns: 0
                }
            });

            await hospitalDb.sessionObject.put({
                healthFacilityId: OBJECT_TO_CACHE.healthFacilityId,
                fullName: OBJECT_TO_CACHE.fullName,
                email: OBJECT_TO_CACHE.email,
                role: "admin",
                id: 0
            });

            toast({
                text: "Registration was succesfull. Data will be synced with remote database when your device is online",
                createAfter : 0
            });

            if ( ! result.response ) {
                await hospitalDb.offlineAccounts.add({ ...OBJECT_TO_CACHE , newInformationType: "healthfacilities" , flag: "new" });
            }

            return true;
        });
    }
};

module.exports.adminLoadUser = async obj => {

    let result;

    try {
        result = await axios.get(`${REQUEST_URL}/admin/${obj.url}?page=${obj.PAGE}`);
    } catch(ex) {
        result = ex;
    } finally {
        return apiCallHandler(result, obj, async () => {
            return await loadUsersInfo({
                collection: obj.collection,
                result,
                obj
            });
        });
    }
};

module.exports.adminSaveUser = async ( data , obj ) => {
    let result;
    data.append("role", obj.url);
    try {
        result = await axios.post(`${REQUEST_URL}/register/${obj.url}` , data );
    } catch(ex) {
        result = ex;
    } finally {
        return apiCallHandler(result, obj, async () => {
            console.log(obj);
            return await saveUserInfo({
                collection: obj.collection,
                data,
                obj
            });
        });
    }
};

module.exports.adminDeleteUser = async (data,obj) => {
    let result;
    try {
        result = await axios.delete(`${REQUEST_URL}/delete/${obj.url}`, data );
    } catch(ex) {
        result = ex;
    } finally {
        return apiCallHandler(result,obj, async () => {
            return await deleteUserInfo({
                collection: obj.collection,
                idType: obj.idType,
                result,
                data
            });
        });
    }
};

module.exports.adminEditUser = async (data,obj) => {
    let result;
    try {
        result = await axios.post(`${REQUEST_URL}/edit/${obj.url}` , data);
    } catch(ex) {
        result = ex;
    } finally {
        return apiCallHandler( result , obj , async () => {
            return await editUserInfo({
                collection: obj.collection,
                idType    : obj.idType,
                result,
                data,
                obj
            });
        });
    }
};

module.exports.logout = async obj => {
    let result;
    try {
        result = await axios.post(`${REQUEST_URL}/logout`);
    } catch(ex) {
        result = ex;
    } finally {
        return apiCallHandler( result , obj , async () => {
            await hospitalDb.sessionObject.clear();
            return true;
        });
    }
};
