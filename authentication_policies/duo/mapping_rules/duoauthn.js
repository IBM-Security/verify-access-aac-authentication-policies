importMappingRule("duoutils");
importPackage(Packages.com.ibm.security.access.httpclient);

// this gets used throughout
var username = getInfomapUsername();

// human-visible correlation id - only used when initiating a new authentication
var correlationID = generateRandom(4);

function getHttpClient() {
    return new HttpClientV2();
}


function doPreAuth() {
    let methodName = "doPreAuth";

    // if a rememberedDevices is enabled, and a trusted_device_token token exists in session, include it
    let trustedDeviceToken = null;
    if (duoConfig.supportRememberedDevices) {
        let sessVal = IDMappingExtUtils.getSPSSessionData("duo_trusted_device_token");
        if (sessVal != null) {
            trustedDeviceToken = ''+sessVal;
        }
    }

    let requestVars = generatePreAuth(username, trustedDeviceToken);
    let httpClient = getHttpClient();

    let headers = new Headers();
    headers.addHeader("Date", requestVars.Date);
    headers.addHeader("Authorization", requestVars.Authorization);
    let params = new Parameters();
    Object.keys(requestVars.params).forEach((p) => {
        params.addParameter(p, requestVars.params[p]);
    });

    let httpResponse = httpClient.httpPost(
        requestVars.URL,
        headers,
        params,
        null,
        null,
        null,
        null,
        null
    );

    traceHTTPResponse(methodName, httpResponse);
    return httpResponse;
}

function doAuthAuto() {
    let methodName = "doAuthAuto";

    let pushinfo = "correlation=" + correlationID;
    let requestVars = generateAuth(true, username, "auto", "auto", pushinfo, null);
    let httpClient = getHttpClient();

    let headers = new Headers();
    headers.addHeader("Date", requestVars.Date);
    headers.addHeader("Authorization", requestVars.Authorization);
    let params = new Parameters();
    Object.keys(requestVars.params).forEach((p) => {
        params.addParameter(p, requestVars.params[p]);
    });

    let httpResponse = httpClient.httpPost(
        requestVars.URL,
        headers,
        params,
        null,
        null,
        null,
        null,
        null
    );

    traceHTTPResponse(methodName, httpResponse);
    return httpResponse;
}

function doAuthPush(device) {
    let methodName = "doAuthPush";

    let pushinfo = "correlation=" + correlationID;
    let requestVars = generateAuth(true, username, "push", device, pushinfo, null);
    let httpClient = getHttpClient();

    let headers = new Headers();
    headers.addHeader("Date", requestVars.Date);
    headers.addHeader("Authorization", requestVars.Authorization);
    let params = new Parameters();
    Object.keys(requestVars.params).forEach((p) => {
        params.addParameter(p, requestVars.params[p]);
    });

    let httpResponse = httpClient.httpPost(
        requestVars.URL,
        headers,
        params,
        null,
        null,
        null,
        null,
        null
    );

    traceHTTPResponse(methodName, httpResponse);
    return httpResponse;
}

function doAuthSMS(device) {
    let methodName = "doAuthSMS";

    let requestVars = generateAuth(false, username, "sms", device, null, null);
    let httpClient = getHttpClient();

    let headers = new Headers();
    headers.addHeader("Date", requestVars.Date);
    headers.addHeader("Authorization", requestVars.Authorization);
    let params = new Parameters();
    Object.keys(requestVars.params).forEach((p) => {
        params.addParameter(p, requestVars.params[p]);
    });

    let httpResponse = httpClient.httpPost(
        requestVars.URL,
        headers,
        params,
        null,
        null,
        null,
        null,
        null
    );

    traceHTTPResponse(methodName, httpResponse);
    return httpResponse;
}

function doAuthPhone(device) {
    let methodName = "doAuthPhone";

    let requestVars = generateAuth(true, username, "phone", device, null, null);
    let httpClient = getHttpClient();

    let headers = new Headers();
    headers.addHeader("Date", requestVars.Date);
    headers.addHeader("Authorization", requestVars.Authorization);
    let params = new Parameters();
    Object.keys(requestVars.params).forEach((p) => {
        params.addParameter(p, requestVars.params[p]);
    });

    let httpResponse = httpClient.httpPost(
        requestVars.URL,
        headers,
        params,
        null,
        null,
        null,
        null,
        null
    );

    traceHTTPResponse(methodName, httpResponse);
    return httpResponse;
}

function doAuthPasscode(passcode) {
    let methodName = "doAuthPasscode";

    let requestVars = generateAuth(false, username, "passcode", null, null, passcode);
    let httpClient = getHttpClient();

    let headers = new Headers();
    headers.addHeader("Date", requestVars.Date);
    headers.addHeader("Authorization", requestVars.Authorization);
    let params = new Parameters();
    Object.keys(requestVars.params).forEach((p) => {
        params.addParameter(p, requestVars.params[p]);
    });

    let httpResponse = httpClient.httpPost(
        requestVars.URL,
        headers,
        params,
        null,
        null,
        null,
        null,
        null
    );

    traceHTTPResponse(methodName, httpResponse);
    return httpResponse;
}

function doAuthStatus(txnId) {
    let methodName = "doAuthStatus";
    let requestVars = generateAuthStatus(txnId);
    let httpClient = getHttpClient();

    let headers = new Headers();
    headers.addHeader("Date", requestVars.Date);
    headers.addHeader("Authorization", requestVars.Authorization);

    let httpResponse = httpClient.httpGet(
        requestVars.URL,
        headers,
        null,
        null,
        null,
        null,
        null
    );

    traceHTTPResponse(methodName, httpResponse);
    return httpResponse;
}

function hasDeviceWithAuto(preAuthResponseObj) {
    let result = false;
    if (preAuthResponseObj != null && preAuthResponseObj.response != null && preAuthResponseObj.response.devices != null && preAuthResponseObj.response.devices.length > 0) {
        for (let i = 0; i < preAuthResponseObj.response.devices.length && !result; i++) {
            let device = preAuthResponseObj.response.devices[i];
            result = (device != null && device.capabilities != null && device.capabilities.indexOf("auto") >= 0);
        }
    }
    return result;
}

function generatePromptOptions(preAuthResponseObj) {
    let promptOptions = [];

    preAuthResponseObj.response.devices.forEach((d) => {
        let enabledCapabilities = d.capabilities.filter((c) => duoConfig.enabledCapabilities.indexOf(c) >= 0);
        if (enabledCapabilities.length > 0) {
            enabledCapabilities.forEach((c) => {
                promptOptions.push({
                    device: d.device,
                    display_name: d.display_name,
                    type: d.type,
                    number: d.number,
                    capability: c
                });
            });
        }
    });

    return promptOptions;
}

function authenticationKickoff(option, lj) {
    debugLog("authenticationKickoff called for option: " + JSON.stringify(option));
    if (option.capability == "auto") {
        // kick off "auto" mode, which uses first device and best mech                        
        let hr = doAuthAuto();
        let authResponseObj = checkDuoStatOK(hr);

        // something to display to the user on the browser for correlation with the push
        lj.correlationID = correlationID;
        
        // this will be returned in page for polling the result
        lj.txnId = authResponseObj.response.txid;

        // for now set the status to unknown - the first poll should change this
        context.set(Scope.SESSION, "urn:myns", "txnStatus", "unknown");
    } else if (option.capability == "push") {
        // kick off "push" mode to a specific device
        let hr = doAuthPush(option.device);
        let authResponseObj = checkDuoStatOK(hr);

        // something to display to the user on the browser for correlation with the push
        lj.correlationID = correlationID;

        // this will be returned in page for polling the result
        lj.txnId = authResponseObj.response.txid;

        // for now set the status to unknown - the first poll should change this
        context.set(Scope.SESSION, "urn:myns", "txnStatus", "unknown");        
    } else if (option.capability == "sms") {
        let hr = doAuthSMS(option.device);

        let authResponseObj = checkDuoStatOK(hr);

        // now instruct the browser to prompt for a passcode
        lj.promptForPasscode = true;
    } else if (option.capability == "phone") {
        let hr = doAuthPhone(option.device);

        let authResponseObj = checkDuoStatOK(hr);

        // this will be returned in page for polling the result
        lj.txnId = authResponseObj.response.txid;

        // for now set the status to unknown - the first poll should change this
        context.set(Scope.SESSION, "urn:myns", "txnStatus", "unknown");
    } else if (option.capability == "mobile_otp") {
        // nothing to do server-side here - just instruct the browser to prompt for a passcode
        lj.promptForPasscode = true;
    } else {
        // should not happen
        throw ("Unknown capability: " + option.capability);
    }
}

// ****************************************************************************
// ******************** MAIN PROCESSING STARTS HERE  **************************
// ****************************************************************************

debugLog("duoauthn start");
let result = false;
let loginJSON = {};

try {
    if (username != null) {
        loginJSON.username = username;

        // get last known transaction status within this session
        let lastTxnStatus = context.get(Scope.SESSION, "urn:myns", "txnStatus");
        // turn into JS string with a value
        if (lastTxnStatus != null) {
            lastTxnStatus = ''+lastTxnStatus;
        } else {
            lastTxnStatus = "unknown";
        }
        loginJSON.lastTxnStatus = lastTxnStatus;

        // read other things which help us decide which step we're up to
        let completeAuthn = context.get(Scope.REQUEST, "urn:ibm:security:asf:request:parameter", "completeAuthn");
        let choiceIndex = context.get(Scope.REQUEST, "urn:ibm:security:asf:request:parameter", "choiceIndex");
        let passcode = context.get(Scope.REQUEST, "urn:ibm:security:asf:request:parameter", "passcode");
        let pollTxnId = context.get(Scope.REQUEST, "urn:ibm:security:asf:request:parameter", "txnId");

        // is this the browser request that occurs after approval to complete the login?
        if (completeAuthn != null && completeAuthn.equalsIgnoreCase("true") && lastTxnStatus == "allow") {
            // we have completed 2FA successfully - time to login
            result = true;
        } else if (choiceIndex != null && parseInt(''+choiceIndex) >= 0) {
            // the user has picked a 2FA method to initiate

            // turn into int
            choiceIndex = parseInt(''+choiceIndex);

            // read back the choices we gave them from session state as they've only sent an index
            let promptOptionsStr = context.get(Scope.SESSION, "urn:myns", "promptOptions");
            if (promptOptionsStr == null) {
                // this is an error
                throw ("Invalid request - no prompt options found in session state");
            }
            let promptOptions = JSON.parse(''+promptOptionsStr);

            // check that the index is valid
            if (!(choiceIndex < promptOptions.length)) {
                throw ("Invalid choice");
            }

            // action the choice they made
            debugLog("About to action: " + JSON.stringify(promptOptions[choiceIndex]));
            authenticationKickoff(promptOptions[choiceIndex], loginJSON);
        } else if (passcode != null) {
            // the user has submitted a passcode
            let hr = doAuthPasscode(''+passcode);
            let authResponseObj = checkDuoStatOK(hr);

            // was it good?
            if (authResponseObj.response.result == "allow") {
                // user is logged in - just set result as this was a browser request
                result = true;
            } else {
                // must be denied - should we try again?
                loginJSON.promptForPasscode = true;
                throw ("Invalid passcode");
            }    
        } else if (pollTxnId != null) {
            // this is a poll/refresh of current authentication status for auto, push or phone mode
            
            // presume we are going to send this back again
            loginJSON.txnId = ''+pollTxnId;

            // perform a poll to check for status
            let hr = doAuthStatus(loginJSON.txnId);

            // when you poll with the Duo API and the transaction was already
            // waiting, and then you poll again, the request becomes a "long-poll"
            // and times out, resulting in hr above being null. So if we see that
            // build a fake response so we can continue processing
            let authStatusResponseObj = null;
            if (hr == null && lastTxnStatus == "waiting") {
                debugLog("Building a fake response because still waiting");
                authStatusResponseObj = {
                    response: {
                        result: "waiting"
                    },
                    stat: "OK"
                };
            } else {
                authStatusResponseObj = checkDuoStatOK(hr);
            }

            if (authStatusResponseObj.response.result == "allow") {
                // authentication completed
                context.set(Scope.SESSION, "urn:myns", "txnStatus", "allow");
                loginJSON.lastTxnStatus = "allow";

                // also remember the trusted_device_token (in SPS session state) if enabled
                if (duoConfig.supportRememberedDevices) {
                    if (authStatusResponseObj.response.trusted_device_token != null) {
                        IDMappingExtUtils.setSPSSessionData("duo_trusted_device_token", authStatusResponseObj.response.trusted_device_token);
                    }
                }

                // do not set result here - the browser will come back with a normal form post to complete login
            } else if (authStatusResponseObj.response.result == "waiting") {
                // that is ok - do nothing and we'll send a JSON response
                // we also record the fact that the txn is waiting so that 
                // if the next poll happens before the user approves/denies and 
                // it times out at the Duo server, we'll just assume its still
                // waiting
                context.set(Scope.SESSION, "urn:myns", "txnStatus", "waiting");
                loginJSON.lastTxnStatus = "waiting";
            } else if (authStatusResponseObj.response.result == "deny") {
                context.set(Scope.SESSION, "urn:myns", "txnStatus", "deny");
                loginJSON.lastTxnStatus = "deny";
                throw ("Request denied");
            } else {
                throw ("Unrecognised Duo result during authStatus: " + authStatusResponseObj.response.result);
            }

            debugLog("authStatusResponseObj: " + JSON.stringify(authStatusResponseObj));
    
        } else {
            // otherwise lets kickoff duo login
    
            // first lets to a pre-auth to make sure the user is in Duo, and discover
            // whether or not they need to authenticate and what devices and capabilities they have
            let hr = doPreAuth();
            let preAuthResponseObj = checkDuoStatOK(hr);
            if (preAuthResponseObj.response.result == "allow") {
                debugLog("The user is not required to complete secondary authentication, either because the user has \"bypass\" status or the effective policy for the user's access of this application allows access without 2FA or Duo enrollment");
                context.set(Scope.SESSION, "urn:myns", "txnStatus", "allow");
                loginJSON.lastTxnStatus = "allow";
                // as we don't need to send a page back to the browser (preAuth is done via browser not ajax) just set result to true now
                result = true;
            } else if (preAuthResponseObj.response.result == "auth") {
                // if auto mode is enabled and the user has at least one device with auto mode, proceed with that
                if (duoConfig.autoMode && hasDeviceWithAuto(preAuthResponseObj)) {
                    authenticationKickoff(
                        {
                            device: "auto",
                            capability: "auto"
                        },
                        loginJSON
                    );
                } else {
                    // no auto mode or no device with auto capability, so prompt for login if any enabled methods
                    let promptOptions = generatePromptOptions(preAuthResponseObj);

                    if (promptOptions.length > 0) {
                        // store a copy in session state - this includes the device id
                        context.set(Scope.SESSION, "urn:myns", "promptOptions", JSON.stringify(promptOptions));
                        // send them back to the browser - without the device id (not human readable)
                        loginJSON.promptOptions = promptOptions.map((o) => { delete o.device; return o; });
                    } else {
                        // the user didn't have any permitted options - this is an error
                        throw("No permitted authentication methods available for this user");
                    }
                }
            } else if (preAuthResponseObj.response.result == "enroll") {
                throw ("Duo enrollment required: " + preAuthResponseObj.response.enroll_portal_url);
            } else {
                throw ("Unrecognised Duo result during preAuth: " + preAuthResponseObj.response.result);
            }    
        }
    } else {
        loginJSON.username = "unauthenticated";
        throw "Not authenticated";
    }
    
    debugLog("The username is: " + username);    
} catch (e) {
    loginJSON.errmsg = "Error: " + e;
}

// establish page to return with macros
macros.put("@ESCAPED_LOGIN_JSON@", JSON.stringify(loginJSON));
page.setValue("/authsvc/authenticator/duo/login.html");

// all done
success.setValue(result);
debugLog("duoauthn end");
