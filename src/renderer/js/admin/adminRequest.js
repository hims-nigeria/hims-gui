"use strict";

const { remote: { getCurrentWindow, dialog } } = require("electron");

const axios      = require("axios");
const qs         = require("querystring");
const constants  = require("../../js/constants.js");
const hospitalDb = require("../../js/db.js");

const {
    toast,
    handleUploadedImage
} = require("../../js/domutils.js");

const {
    saveInterventionInfo,
    editInterventionInfo,
    deleteUserInfo,
    loadUsersInfo,
    saveUserInfo,
    editUserInfo
} = require("../../js/dbHelper.js");

const {
    setupEventOnDomLoad, 
    addUserFormHandler,
    getAppropriateUser,
    formDataToObject,
    hashPassword,
    createExternalId,
    comparePassword,
    checkForInternet,
    isEmailExists
} = require("../../js/utils.js");

class AdminRequest {

    constructor(baseUrl,role) {
        this.baseUrl   = baseUrl;
        this.role      = role;
    }

    static async ApiCallHandler(result,obj, cb = function() {}) {

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

        result.data = result.response
            ? Object.create(result.response)
            : ( () => result.data ? Object.create(result.data) : undefined )();

        delete result.response;
        // when internet is down
        if ( ! result.data ) {
            console.log(result);
            toast({
                text: "Oops. We can't communicate with server now",
                createAfter : 0
            });
            // save data from api
            return await __cb();
        }

        if ( result.data.status >= 400 ) {

            toast({
                text: result.data.message,
                createAfter: 0
            });
            // if user is not authorized to view a section
            // redirect that user to another url
            if ( result.data.status === 401 ) {
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
    }

    async register(data,obj) {

        const OBJECT_TO_CACHE = {};

        const hpwd = await formDataToObject(data,OBJECT_TO_CACHE);

        if ( ! hpwd ) return false;

        OBJECT_TO_CACHE.role = this.role;
        OBJECT_TO_CACHE.healthFacilityId = createExternalId(OBJECT_TO_CACHE.healthCareName);

        delete OBJECT_TO_CACHE.activationKey;

        let result;

        try {
            result = await axios.post(`${constants.REQUEST_URL}${this.baseUrl}register/health-care-center`, data);
        } catch(ex) {
            result = ex;
        } finally {

            return await AdminRequest.ApiCallHandler(result,obj, async () => {

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
                        clients: 0,
                        doctors: 0,
                        nurses: 0,
                        interns: 0
                    }
                });

                await hospitalDb.sessionObject.put({
                    healthFacilityId: OBJECT_TO_CACHE.healthFacilityId,
                    fullName: OBJECT_TO_CACHE.fullName,
                    email: OBJECT_TO_CACHE.email,
                    role: this.role,
                    id: 0
                });

                toast({
                    text: "Registration was succesfull. Data will be synced with remote database when your device is online",
                    createAfter : 0
                });

                if ( ! result.data ) {
                    await hospitalDb.offlineAccounts.add({ ...OBJECT_TO_CACHE , newInformationType: "healthfacilities" , flag: "new" });
                }

                return true;
            });
        }
    }

    static async GetDashboard (obj) {

        let result;

        try {
            result = await axios.get(`${constants.REQUEST_URL}/dashboard/`);
        } catch(ex) {
            result = ex;
        } finally {

            return await AdminRequest.ApiCallHandler(result,obj, async () => {

                let userInfo = {} ;

                if ( ! result.data ) {

                    const session = await hospitalDb.sessionObject.toArray();

                    if ( ! session.length ) {
                        getCurrentWindow().webContents.loadURL(obj.nextUrl);
                        return false;
                    }

                    Object.assign( userInfo , await getAppropriateUser( session ) );
                }

                return Object.keys(userInfo).length !== 0 ? userInfo : result.data.message ;

            });
        }
    }

    async logout(obj) {
        let result;
        try {
            result = await axios.post(`${constants.REQUEST_URL}${this.baseUrl}logout`);
        } catch(ex) {
            result = ex;
        } finally {
            return AdminRequest.ApiCallHandler( result , obj , async () => {
                await hospitalDb.sessionObject.clear();
                return true;
            });
        }
    }

    async adminEditProfile (data,obj) {

        let result;

        let {
            healthFacilityId,
            fullName,
            email
        } = await hospitalDb.sessionObject.get({ id: 0 });

        const OBJECT_TO_CACHE = {};

        const hpwd = await formDataToObject(
            data,
            OBJECT_TO_CACHE,
            (await hospitalDb.healthFacility.get({ healthFacilityId })).password
        );

        if ( ! hpwd ) {
            if ( obj.disabled )
                obj.disabled.forEach(
                    el => el.disabled = false
                );
            return false;
        }

        try {
            result = axios.post(`${constants.REQUEST_URL}${this.baseUrl}update-profile`, data);
        } catch(ex) {
            result = ex;
        } finally {

            return AdminRequest.ApiCallHandler( result , obj , async () => {

                await hospitalDb.healthFacility.where({ healthFacilityId }).modify(OBJECT_TO_CACHE);

                fullName = OBJECT_TO_CACHE.fullName
                    ? ( async () => {
                        await hospitalDb.sessionObject.where({ id: 0 }).modify({
                            fullName: OBJECT_TO_CACHE.fullName
                        });
                        return OBJECT_TO_CACHE.fullName;
                    })()
                : fullName;

                if ( ! result.data ) {
                    await hospitalDb.offlineAccounts.where(
                        {
                            newInformationType: "healthFacilities"
                        }
                    ).and(
                        x => x.healthFacilityId === healthFacilityId
                    ).modify({
                        ...OBJECT_TO_CACHE,
                        flag: "edit"
                    });
                }
                return result.data ? result.data.message : { fullName , email };
            });
        }
    }

    async adminEditIntervention (data,obj)  {
        let result;
        try {
            result = await axios.post(`${constants.REQUEST_URL}${this.baseUrl}edit/${obj.url}` , data);
        } catch(ex) {
            result = ex;
        } finally {
            return AdminRequest.ApiCallHandler( result , obj , async () => {
                return await editInterventionInfo({
                    collection: obj.collection,
                    idType    : obj.idType,
                    result,
                    data,
                    obj
                });
            });
        }
    }

    async adminCreateIntervention(data,obj) {
        let result;
        try {
            result = await axios.post(`${constants.REQUEST_URL}${this.baseUrl}register/${obj.url}` , data);
        } catch(ex) {
            result = ex;
        } finally {
            return AdminRequest.ApiCallHandler( result , obj , async () => {
                return await saveInterventionInfo({
                    result,
                    data,
                    obj
                });
            });
        };
    }

    async adminEditUser(data,obj) {
        let result;
        try {
            result = await axios.post(`${constants.REQUEST_URL}${this.baseUrl}edit/${obj.url}` , data);
        } catch(ex) {
            result = ex;
        } finally {
            return AdminRequest.ApiCallHandler( result , obj , async () => {
                return await editUserInfo({
                    collection: obj.collection,
                    idType    : obj.idType,
                    result,
                    data,
                    obj
                });
            });
        }
    }

    async adminDeleteUser(data,obj,cb) {
        let result;
        try {
            result = await axios.delete(`${constants.REQUEST_URL}${this.baseUrl}delete/${obj.url}/${data[obj.idType]}`);
        } catch(ex) {
            result = ex;
        } finally {
            return AdminRequest.ApiCallHandler(result,obj, async () => {
                return await deleteUserInfo({
                    collection: obj.collection,
                    idType: obj.idType,
                    result,
                    data
                }, cb );
            });
        }
    }

    async adminSaveUser( data , obj ) {
        let result;
        try {
            result = await axios.post(`${constants.REQUEST_URL}${this.baseUrl}register/${obj.url}` , data );
        } catch(ex) {
            result = ex;
        } finally {
            return AdminRequest.ApiCallHandler(result, obj, async () => {
                return await saveUserInfo({
                    collection: obj.collection,
                    data,
                    obj,
                    result
                });
            });
        }
    }

    async adminLoadUser(obj) {
        let result;
        try {
            result = await axios.get(`${constants.REQUEST_URL}${this.baseUrl}loaduser/${obj.url}?page=${obj.PAGE}`);
        } catch(ex) {
            result = ex;
        } finally {
            return AdminRequest.ApiCallHandler(result, obj, async () => {
                return await loadUsersInfo({
                    collection: obj.collection,
                    result,
                    obj
                });
            });
        }
    }

    static async LoginUniqueUser (data,obj) {

        const OBJECT_TO_CHECK_AGAINST = {};

        for ( let [ key , value ] of data.entries() )
            OBJECT_TO_CHECK_AGAINST[key] = value;

        let result;

        try {
            result = await axios.post(`${constants.REQUEST_URL}/login/`, data );
        } catch(ex) {
            result = ex;
        } finally {
            /**
               for logging in we are only intrested in setting
               sessionObject collection in indexDB
               we would check if result.data is undefined
               if it is undefined we would search our local cache to login user and set sessionObject
               but in a situation were the internet is not down we are only interested in setting the sessionObject
               in indexDB. We are not interested in reading from the cache to login user
            **/
            return AdminRequest.ApiCallHandler(result,obj, async () => {

                let res;

                if ( ! result.data ) {

                    res = await isEmailExists( OBJECT_TO_CHECK_AGAINST.email );

                    if ( ! res.length ) {
                        toast({
                            text: `No account is associated with ${OBJECT_TO_CHECK_AGAINST.email}`,
                            createAfter: 6000
                        });
                        return false;
                    }

                    ( [ res ] = res );
                    console.log(res);
                    const pwd = await comparePassword(OBJECT_TO_CHECK_AGAINST.password,res.password);
                    console.log(pwd);
                    if ( pwd instanceof Error ||  ! pwd ) {
                        toast({
                            text: `email and/or password is incorrect`,
                            createAfter: 6000
                        });
                        return false;
                    }
                }
                const { role , healthFacilityId , fullName , email  } = res ? res : result.data.message;
                await hospitalDb.sessionObject.put({
                    healthFacilityId,
                    fullName,
                    email,
                    role,
                    id: 0
                });
                return res ? res : result.data.message;
            });
        }
    }

    static NavToggler(toggler,asideNav,navOperations) {

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

        return AdminRequest;
    }

    static EmitTriggerEvents(navList,instance,secInstance) {

        navList.addEventListener("click", evt => {

            let { target } = evt;

            if ( target instanceof HTMLUListElement ) return;

            if ( ! (target instanceof HTMLLIElement) )
                target = target.parentNode;

            const eventName = target.getAttribute("data-fire");

            secInstance.removeAllListeners("new-page-append");
            secInstance.emit(eventName);

        });

        return AdminRequest;
    }


    static LogoutUser( logoutBtn , instance ) {
        logoutBtn.addEventListener("click", async () => {
            const result = await instance.logout({
                nextUrl: constants.LOGIN_URL
            });
            if ( result ) getCurrentWindow().webContents.loadURL(constants.LOGIN_URL);
        });
        return AdminRequest;
    }

    static ProfileUpdate(navOperations,instance,secInstance) {

        navOperations.addEventListener("submit", async evt => {

            evt.preventDefault();

            if ( ! evt.target.checkValidity() ) {
                dialog.showErrorBox(`Invalid values`,`Check the inputed values if they are correct`);
                return;
            }

            const btn = evt.target.querySelector("button");

            btn.disabled = true;

            const result = await instance.adminEditProfile(new FormData(evt.target), {
                disabled: [ btn ]
            });

            if ( ! result ) return;

            secInstance.__setCredentials(result);

        });

        return AdminRequest;
    }

    static SectionPrep(instance,secInstance) {

        const toggler = document.querySelector(".nav-header-toggler");
        const asideNav = document.querySelector(".section-nav");
        const navOperations = document.querySelector(".section-nav-operation");
        const logoutBtn  = document.querySelector(".logout");
        const navList = document.querySelector(".nav-list");

        AdminRequest
            .NavToggler(toggler,asideNav,navOperations)
            .EmitTriggerEvents(navList,instance,secInstance)
            .ProfileUpdate(navOperations,instance,secInstance)
            .LogoutUser(logoutBtn,instance,secInstance);
    }

    static FormHandler(form,previewImage,instance) {
        console.log(AdminRequest.FORM_STATE, "hi there");
        form.addEventListener("submit", evt => addUserFormHandler(AdminRequest.FORM_STATE,{
            evt,
            saveUser: async (fData,btns) => {
                return await instance.adminCreateIntervention(  fData , {
                    disabled  : btns,
                    dataUri   : previewImage ? previewImage.src : "",
                    ...AdminRequest.FORM_STATE.__newWindowSpec
                });
            },
            editUser: async (fData,btns) => {
                return await instance.adminEditIntervention( fData , {
                    disabled   : btns,
                    dataUri    : previewImage ? previewImage.src : "",
                    ...AdminRequest.FORM_STATE.__newWindowSpec
                });
            }
        }));

        return AdminRequest;

    }

    static SetupFormState() {
        AdminRequest.FORM_STATE = {
            state  : undefined,
            userId : undefined,
            __newWindowSpec: {
                idType: undefined,
                collection: undefined,
                url: undefined,
                ipcEventName: undefined,
                generateIdFrom: undefined
            }
        };
        setupEventOnDomLoad( AdminRequest.FORM_STATE );
        return AdminRequest;
    }

    static EditNonUsers(instance) {

        const form  = document.querySelector("form");
        const close = document.querySelector(".close");
        const previewImage = handleUploadedImage();
        console.log(instance);
        close.addEventListener("click", () => getCurrentWindow().close() );

        AdminRequest
            .SetupFormState()
            .FormHandler(form,previewImage,instance);
    }

}

module.exports = {
    instance: new AdminRequest("/admin/", "admin"),
    AdminRequest
};
