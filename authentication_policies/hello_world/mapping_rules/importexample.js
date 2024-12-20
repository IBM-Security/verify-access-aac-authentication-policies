// Copyright contributors to the IBM Verify Identity Access AAC Authentication Policies project.

importClass(Packages.com.tivoli.am.fim.trustserver.sts.utilities.IDMappingExtUtils);

IDMappingExtUtils.traceString("Entry example mapping rule");

var approved = context.get(Scope.REQUEST, "urn:ibm:security:asf:request:parameter", "approved");
var verify = context.get(Scope.REQUEST, "urn:ibm:security:asf:request:parameter", "@verifying@");

IDMappingExtUtils.traceString("Approved : " + approved);
IDMappingExtUtils.traceString("Verify : " + verify);

if (verify != null && verify != "") {
    if (approved != null && approved == "on") {
        success.setValue(true);
    } else {
        page.setValue("/authsvc/authenticator/importexample/notapproved.html");
    }
} else {
    page.setValue("/authsvc/authenticator/importexample/prompt.html");
}
