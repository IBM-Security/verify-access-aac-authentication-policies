importClass(Packages.com.tivoli.am.fim.trustserver.sts.utilities.IDMappingExtUtils);
importClass(Packages.com.tivoli.am.fim.trustserver.sts.utilities.IDMappingExtCacheDMAPImpl);
importClass(Packages.com.tivoli.am.fim.trustserver.sts.utilities.OAuthMappingExtUtils);
importPackage(Packages.com.tivoli.am.fim.email);
importPackage(Packages.com.ibm.security.access.server_connections);
importClass(Packages.com.tivoli.am.fim.email.EmailSender);
importPackage(Packages.com.ibm.security.access.user);

IDMappingExtUtils.traceString("Start magic link authentication.");

var POINT_OF_CONTACT_URL = "https://www.mmfa.ibm.com/mga/sps/authsvc/policy/magiclink";
var EMAIL_LDAP_ATTR = "mail";
var SMTP_SVR_CONNECTION = "MagicLinkSMTP";
var TOKEN_LENGTH = 100;
var TOKEN_TIMEOUT = 300;
var EMAIL_FROM = "noreply@mymail.server";
var EMAIL_SUBJECT = "IBM Verify Identity Access Login Link";
var EMAIL_TITLE = "Login to IBM Verify Identity Access";
var LINK_DESCRIPTION = "Click on the link to securely login to IBM Verify Identity Access";

var msgBody = "<b>" + EMAIL_TITLE + "</b><hr/><br/><br/>" +
              "<p>" + LINK_DESCRIPTION + "</p><br/><br/>" + 
              POINT_OF_CONTACT_URL + "?token=@TOKEN@" +
              "<br/><br/>The link will expire in " + TOKEN_TIMEOUT + " seconds!<br/>";

var dmapCache = IDMappingExtUtils.getIDMappingExtCache();

// Check the request to see if it contains the token
var token = context.get(Scope.REQUEST, "urn:ibm:security:asf:request:parameter", "token");
var email = context.get(Scope.REQUEST, "urn:ibm:security:asf:request:parameter", "email");
var target = context.get(Scope.SESSION, "internal:delegate", "targetURL");
var confirmation = context.get(Scope.REQUEST, "urn:ibm:security:asf:request:parameter", "confirmation");

// If no email then check for token submission
if(email == null) {
    IDMappingExtUtils.traceString("No email - checking token.");

    // If the token exists then this is a verify
    if (token != null) {
        if (confirmation == "true") {
            IDMappingExtUtils.traceString("Confirming token.");

            var dmapValue = dmapCache.getAndRemove(token);

            IDMappingExtUtils.traceString("Token username : " + dmapValue);

            var target = dmapCache.getAndRemove(token + dmapValue);

            context.set(Scope.SESSION, "urn:ibm:security:asf:response:token:attributes", "username", dmapValue);

            // Set the target it it exists
            if(target != null) {
                IDMappingExtUtils.traceString("TARGET : " + target);
                context.set(Scope.SESSION, "urn:ibm:security:asf:response:token:attributes", "itfim_override_targeturl_attr", target);
            }

            success.setValue(true);
        } else {
            IDMappingExtUtils.traceString("Presenting confirmation page.");
            macros.put("@TOKEN@", token);
            page.setValue("/authsvc/authenticator/magiclink/confirm.html");
        }
    } else {
        IDMappingExtUtils.traceString("Presenting sent page");
        macros.put("@TARGET@", target);
    }
} else {
    // If email sent then try to create and send the magic link
    IDMappingExtUtils.traceString("Email found : " + email);

    var errorString = "";

    // First find username based upon email address provided
    var userLookupHelper = new UserLookupHelper();
    userLookupHelper.init(true);
    
    if(userLookupHelper.isReady()) {
        var foundUsers = userLookupHelper.search(EMAIL_LDAP_ATTR, email, 2);
  
        if(foundUsers != null && foundUsers.length < 1) { 
            errorString = "The supplied email address does not match a valid user!";
            IDMappingExtUtils.traceString("Couldn't find user");
        } else if (foundUsers == null || foundUsers.length > 1) {
            errorString = "The supplied email address is configured for multiple users!";
            IDMappingExtUtils.traceString("Duplicate users found");
        } else {
            // Found unique user so create the token and send the email
            var user = userLookupHelper.getUserByNativeId(foundUsers[0]);
            var username = user.getId();
            IDMappingExtUtils.traceString("Found user " + foundUsers[0] + " from email "+ email +".");

            // Make sure the token is unique
            do {
                token = OAuthMappingExtUtils.generateRandomString(TOKEN_LENGTH);
            } while (dmapCache.exists(token));

            dmapCache.put(token, username, TOKEN_TIMEOUT);

            if(target != null && target != "") {
                dmapCache.put(token + username, target, TOKEN_TIMEOUT);
            }

            IDMappingExtUtils.traceString("TOKEN : " + token);

            // Send the email using the SMTP server connection
            var connFactory = new ServerConnectionFactory();
            var conn = connFactory.getSmtpConnectionByName(SMTP_SVR_CONNECTION);
            var emailSenderConn = new EmailSender(conn);

            var emailBody = msgBody.replaceAll("@TOKEN@", token);

            var message = new Email(EMAIL_SUBJECT, emailBody, EMAIL_FROM, email, "text/html; charset=utf-8");

            emailSenderConn.send(message);
            IDMappingExtUtils.traceString("Email Sent!");
        }
    } else {
        errorString = "The server is not able to handle the request at the moment!";
        IDMappingExtUtils.traceString("User lookup helper not ready");
    }

    if (errorString != "") {
        IDMappingExtUtils.traceString("Error encountered : " + errorString);
    }

    page.setValue("/authsvc/authenticator/magiclink/sent.html");
}

