importClass(Packages.com.tivoli.am.fim.trustserver.sts.utilities.IDMappingExtUtils);
importClass(Packages.com.tivoli.am.fim.trustserver.sts.utilities.IDMappingExtCacheDMAPImpl);
importClass(Packages.com.tivoli.am.fim.trustserver.sts.utilities.OAuthMappingExtUtils);
importPackage(Packages.com.tivoli.am.fim.email);
importPackage(Packages.com.ibm.security.access.server_connections);
importClass(Packages.com.tivoli.am.fim.email.EmailSender);
importPackage(Packages.com.ibm.security.access.user);

IDMappingExtUtils.traceString("Start magic link authentication.");

// Constants
var POINT_OF_CONTACT_URL = "@POINT_OF_CONTACT_URL@";
var EMAIL_LDAP_ATTR = "mail";
var SMTP_SVR_CONNECTION = "@SMTP_SVR_CONNECTION@";
var TOKEN_LENGTH = 100;
var TOKEN_TIMEOUT = 300;
var EMAIL_FROM = "@EMAIL_FROM@";
var EMAIL_SUBJECT = "IBM Verify Identity Access Login Link";
var EMAIL_TITLE = "Login to IBM Verify Identity Access";
var LINK_DESCRIPTION = "Click on the link to securely login to IBM Verify Identity Access";

/**
 * The message body includes the generated magic link. This assumes the policy kickoff 
 * method is set as either path or both. If it has been set as query, modify the 
 * code below to include the policy as a query string.
 * ie: POINT_OF_CONTACT_URL + "/sps/authsvc?PolicyId=urn:ibm:security:authentication:asf:magiclink&token=@TOKEN@"
 */
var msgBody = "<b>" + EMAIL_TITLE + "</b><hr/><br/><br/>" +
              "<p>" + LINK_DESCRIPTION + "</p><br/><br/>" + 
              POINT_OF_CONTACT_URL + "/sps/authsvc/policy/magiclink?token=@TOKEN@" +
              "<br/><br/>The link will expire in " + TOKEN_TIMEOUT + " seconds!<br/>";

var dmapCache = IDMappingExtUtils.getIDMappingExtCache();

// Check the request to see if it contains the token
var token = context.get(Scope.REQUEST, "urn:ibm:security:asf:request:parameter", "token");
var email = context.get(Scope.REQUEST, "urn:ibm:security:asf:request:parameter", "email");

var target = context.get(Scope.SESSION, "urn:ibm:security:asf:request", "targetURL");
var confirmation = context.get(Scope.REQUEST, "urn:ibm:security:asf:request:parameter", "confirmation");

if (target == null) {
    /**
     * The targetURL lookup above uses a session variable that does not exist in versions 10.0.8.0 and previous.
     * This additional check retrieves the targetURL using an unsupported internal method that is available in those
     * versions.
     */
    target = context.get(Scope.SESSION, "internal:delegate", "targetURL");
}

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

    /**
     * This initializes the UserLookupHelper to use the existing user registry configuration
     * in the runtime component. This can be changed to use either the Username Password
     * authentication mechanism or an LDAP server connection by updating this code to either:
     * // Username Password authentication mechanism. Ensure that it has been configured.
     * userLookupHelper.init(true);
     * or
     * // LDAP Server connection. 
     * // Ensure that the LDAP server connection has been created.
     * var connFactory = new ServerConnectionFactory();
     * var ldapConn = connFactory.getLdapConnectionByName("ldapSvrConn");
     * userLookupHelper.init(ldapConn, "Default"); // Where Default is the management domain
     */
    userLookupHelper.init(false);
    
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

