importClass(Packages.com.tivoli.am.fim.trustserver.sts.utilities.IDMappingExtUtils);
importMappingRule("duovars");
importMappingRule("KJUR");

// the docs original say hmacsha1, but this also works and is a stronger hash algorithm
var duoSigningAlgorithm = "hmacsha512";


// ****************************************************
// These are general utilities for Infomap mechanisms
// ****************************************************

function debugLog(str) {
    if (typeof (console) != "undefined") {
            console.log(str);
    } else {
            IDMappingExtUtils.traceString(str);
    }
}

function generateRandom(len) {
    // generates a random string of digits - you can change the character set if you wish
    var chars = "0123456789";
    var result = "";
    for (var i = 0; i < len; i++) {
            result = result + chars.charAt(Math.floor(Math.random()*chars.length));
    }
    return result;
}

/**
 * Utility to get the user display name from the the Infomap context
 */
function getInfomapUsername() {
    // get username from already authenticated user
    var result = context.get(Scope.REQUEST,
                    "urn:ibm:security:asf:request:token:attribute", "username");
    debugLog("username from existing token: " + result);

    // if not there, try getting from session (e.g. UsernamePassword module)
    if (result == null) {
            result = context.get(Scope.SESSION,
                            "urn:ibm:security:asf:response:token:attributes", "username");
            debugLog("username from session: " + result);
    }
    if (result != null) {
            // make it a javascript string - this prevents stringify issues later
            result = '' + result;
    }
    return result;
}

function traceHTTPResponse(methodName, httpResponse) {
	if (httpResponse == null) {
		debugLog(methodName + ": httpResponse object is null");			
	} else {
		debugLog(methodName + ": httpResponse response code: " + httpResponse.getCode() + " body: " + httpResponse.getBody());
	}
}




// ****************************************************
// These are implementations of Duo APIs and supporting functions
// ****************************************************

//
// checks that a HTTP response returned 200, with "stat": "OK" and throws an exception if not
// if the stat passed ok, then return the response body as JSON
//
function checkDuoStatOK(hr) {
    let responseObj = null;
    if (hr != null && hr.getCode() == 200) {
        responseObj = JSON.parse(''+hr.getBody());
        if (responseObj.stat != "OK") {
            throw ("Invalid stat code from Duo. Stat: " + responseObj.stat);
        }
    } else {
        throw ("Invalid status code from Duo. Status code: " + (hr == null ? "UNKOWN" : hr.getCode()));
    }
    return responseObj;
}


//
// Performs the signature calculation for a DUO request per (https://duo.com/docs/authapi)
// Outputs a json object with parameters:
//  - URL: the full API endpoint
//  - Date: date header that needs to be included in requests
//  - params: copy of parameters used in the request to sign
//  - Authorization: basic-auth header to be included in requests
//  - CURL: Purely for debugging, a string which contains the curl command equivalent for the signed request
//
function duoSign(now, method, host, path, params, skey, ikey) {
    let result = {};
    result["URL"] = "https://" + host + path;

    if (now == null) {
        now = (new Date()).toUTCString();
    }
    result["Date"] = now;

    let paramsAsQueryString = false;
    if (method.toUpperCase() == "GET" || method.toUpperCase() == "DELETE") {
        paramsAsQueryString = true;
    } else {
        result["params"] = params;
    }

    let canon = [now, method.toUpperCase(), host.toLowerCase(), path];
    let args = [];
    Object.keys(params).sort().forEach((k) => {
        args.push(encodeURIComponent(k) + "=" + encodeURIComponent(params[k]));
    });
    let argsStr = args.join("&");
    canon.push(argsStr);
    let s = canon.join("\n");
    let mac = new KJUR.crypto.Mac({alg: duoSigningAlgorithm, pass: { utf8: skey}});
    mac.updateString(s);
    let pwd = mac.doFinal();
    result["Authorization"] = "Basic " + utf8tob64(ikey + ":" + pwd);

    // if query string is used, update URL
    if (paramsAsQueryString) {
        result["URL"] = result["URL"] + "?" + argsStr;
    }
    

    // useful for debugging - build the curl equivalent of a request
    result["CURL"] = "curl -k -v" + 
        " -H \"Accept: application/json\"" + 
        " -H \"Date: " + result.Date  +  "\"" + 
        " -H \"Authorization: " + result.Authorization + "\"" + 
        ((!paramsAsQueryString && argsStr.length > 0) ? " -d \"" + argsStr + "\"" : "") +
        " \"" + result.URL + "\"";

    return result;
}

function generateCheck() {
    let params = {};

    let now = (new Date()).toUTCString();
    return duoSign(
        now,
        "GET",
        duoAPIEndpoint,
        "/auth/v2/check",
        params,
        duoSecretKey,
        duoIntegrationKey);
}

function generatePreAuth(duouser, trustedDeviceToken) {
    let params = {
        username: duouser
    };
    // trustedDeviceToken is optional
    if (trustedDeviceToken != null) {
        params["trusted_device_token"] = trustedDeviceToken;
    }

    let now = (new Date()).toUTCString();
    return duoSign(
        now,
        "POST",
        duoAPIEndpoint,
        "/auth/v2/preauth",
        params,
        duoSecretKey,
        duoIntegrationKey);
}

function generateAuth(async, duouser,factor,device,pushinfo,passcode) {
    let params = {
        username: duouser,
        factor: factor
    };
    if (async) {
        params["async"] = "1";
    }

    // optionals
    if (device != null) {
        params["device"] = device;
    }
    if (pushinfo != null) {
        params["pushinfo"] = pushinfo;
    }
    if (passcode != null) {
        params["passcode"] = passcode;
    }

    let now = (new Date()).toUTCString();
    return duoSign(
        now,
        "POST",
        duoAPIEndpoint,
        "/auth/v2/auth",
        params,
        duoSecretKey,
        duoIntegrationKey);
}

function generateAuthStatus(txnId) {
    let params = {
        txid: txnId
    };

    let now = (new Date()).toUTCString();
    return duoSign(
        now,
        "GET",
        duoAPIEndpoint,
        "/auth/v2/auth_status",
        params,
        duoSecretKey,
        duoIntegrationKey);
}

function generateEnroll(username) {
    let params = {
        username: username
    };

    let now = (new Date()).toUTCString();
    return duoSign(
        now,
        "POST",
        duoAPIEndpoint,
        "/auth/v2/enroll",
        params,
        duoSecretKey,
        duoIntegrationKey);
}
