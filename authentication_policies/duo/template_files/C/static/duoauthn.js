// utility variables
var locationHostPort = location.hostname+(location.port ? ':'+location.port: '');
var baseURL = location.protocol+'//'+locationHostPort;
var pollTime = 2000; // msec

// utility functions
function htmlEncode(value){
    if (value != null) {
        return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    } else {
        return '';
    }
}

function htmlDecode(s) {
    if (s != null) {        
            return s.replace(/&quot;/g, '"').replace(/&gt;/g, '>').replace(/&lt;/g, '<').replace(/&amp;/g, '&');

    } else {
            return '';
    }               
}

function hideDiv(id) {
	document.getElementById(id).style.display = "none";
}

function showDiv(id) {
	document.getElementById(id).style.display = "block";
}

function updatePollTimestamp(status) {
	if (document.getElementById("pollTimestamp") != null && document.getElementById("pollStatus") != null) {
		let nowStr = (new Date()).toUTCString();
		document.getElementById("pollTimestamp").innerText = nowStr;
		document.getElementById("pollStatus").innerText = status;	
	}
}

function buildPollURL() {
	let result = document.getElementById("loginform").action;
	if (result.indexOf("apiauthsvc") < 0) {
		result = result.replace("/authsvc/", "/apiauthsvc/");
	}                
	return result;
}

function poll() {
	ajaxActive = true; 	
	let url = buildPollURL();
	console.log("polling: " + url);

	fetch(
		url,
		{
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Accept': 'application/json'
			},
			body: JSON.stringify({
				operation: "verify",
				txnId: document.getElementById("txnId").value,
				completeAuthn: "false"
			})
		}
	).then((response) => {
		if (!response.ok) {
			throw new Error("Unexpected HTTP response code: " + response.status);
		}
		return response.json();
	}).then((data) => {
		data.loginJSON = JSON.parse(htmlDecode(data.loginJSON));
		console.log("Received poll data: " + JSON.stringify(data));

		// first update the form action
		document.getElementById('loginform').action = data.action.replace("/apiauthsvc/", "/authsvc/");

		// if the lastTxnStatus is "allow", then its time to post the form directing the browser to complete login
		if (data.loginJSON.lastTxnStatus == "allow") {
			document.getElementById('loginform').submit();
		} else {
			// if we were denied, show that as an error, otherwise update
			// the displayed status and start a new timer to re-poll
			if (data.loginJSON.lastTxnStatus == "deny") {
				hideDiv("pollDiv");
				hideDiv("choiceDiv");
				hideDiv("passcodeDiv");
				document.getElementById("errorDiv").innerHTML = "Request denied";
				showDiv("errorDiv");
			} else {
				// update the last poll information on the browser
				updatePollTimestamp(data.loginJSON.lastTxnStatus);
				window.setTimeout(poll, pollTime);
			}
		}
	}).catch((error) => {
		console.log(error);
		let errStr = "";
		if (typeof error == "object" && error["message"] != null) {
			errStr = error.message;
		} else {
			errStr = error;
		}
		document.getElementById("errorDiv").innerHTML = htmlEncode(errStr);
		showDiv("errorDiv");
	});
}

function populateOptions(promptOptions) {
	let optionsHTML = "<table border=\"1\">";
	optionsHTML += "<tr><th>Select</th><th>Device</th><th>Method</th></tr>";
	for (let i = 0; i < promptOptions.length; i++) {
		let choiceIndex = i;
		let c = promptOptions[i].capability;
		let methodStr = "";
		if (c == "push") {
			methodStr = "Push notification";
		} else if (c == "sms") {
			methodStr = "SMS to " + promptOptions[i].number;
		} else if (c == "phone") {
			methodStr = "Phone call to " + promptOptions[i].number;
		} else if (c == "mobile_otp") {
			methodStr = "Mobile OTP";
		} else {
			methodStr = "Unknown capability: " + c;
			choiceIndex = -1;
		}
		
		optionsHTML += "<tr>";
		optionsHTML += "<td><input type=\"radio\" name=\"promptOption\" value=\""+choiceIndex+"\"" + (i == 0 ? " checked" : "") + " /></td>";
		optionsHTML += "<td>"+htmlEncode(promptOptions[i].display_name)+"</td>";
		optionsHTML += "<td>"+htmlEncode(methodStr)+"</td>";
		optionsHTML += "</tr>";
	}
	optionsHTML += "</table>";
	document.getElementById("choiceContent").innerHTML = optionsHTML;
}

function submitChoice() {
	document.getElementById("choiceIndex").value = document.querySelector('input[name="promptOption"]:checked').value;
	document.getElementById("choiceform").submit();
}

// onLoad function
function loginStartup() {
	// decode the provided macro holder JSON
	let loginPageJSON = JSON.parse(htmlDecode(document.getElementById('duo_login_tags').textContent));
	
	// populate the username
	document.getElementById("usernameDiv").innerHTML = htmlEncode(loginPageJSON.username);

	// if there are promptOptions, then this is 2FA selection step, so populate that
	if (loginPageJSON.promptOptions != null) {
		populateOptions(loginPageJSON.promptOptions);
	}

	// populate correlationID and transactionId if present - these will be present if authentication has
	// been kicked off
	if (document.getElementById("correlationID") != null) {
		if (loginPageJSON["correlationID"] != null) {
			document.getElementById("correlationID").innerHTML = "with correlation ... " + htmlEncode(loginPageJSON.correlationID);
		} else {
			document.getElementById("correlationID").innerHTML = "...";
		}
		if (loginPageJSON["txnId"] != null) {
			document.getElementById("txnId").value = htmlEncode(loginPageJSON.txnId);
		}	
	}

	// populate the poll timestamp
	updatePollTimestamp(loginPageJSON["lastTxnStatus"]);
	
	// if there is an error message, display it, otherwise show either the choiceDiv or the pollDiv
	// and kick off polling
	if (document.getElementById("errorDiv") != null && loginPageJSON.errmsg != null) {
		document.getElementById("errorDiv").innerHTML = htmlEncode(loginPageJSON.errmsg);
		showDiv("errorDiv");
	}

	// one of these can happen even if there is an error to display
	if (loginPageJSON.promptOptions != null) {
		// show 2FA options for selection
		showDiv("choiceDiv");
		document.getElementById("choiceButton").addEventListener("click", submitChoice);
	} else if (loginPageJSON["txnId"] != null) {
		// authentication must be underway - show that and start polling
		showDiv("pollDiv");
		window.setTimeout(poll, pollTime);	
	} else if (loginPageJSON["promptForPasscode"]) {
		showDiv("passcodeDiv");
	} else {
		// unknown state if there wasn't an error message
		if (loginPageJSON.errmsg == null) {
			document.getElementById("errorDiv").innerHTML = htmlEncode("Server returned unexpected response");
			showDiv("errorDiv");	
		}
	}
}

//
// main action starts here
//

// add event listener for onLoad to call loginStartup
window.addEventListener("load", loginStartup);

