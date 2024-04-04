// your credential details here

var duoIntegrationKey = "@DUO_INTEGRATION_KEY@";
var duoSecretKey = "@DUO_SECRET_KEY@";
var duoAPIEndpoint = "@DUO_API_ENDPOINT@";

//
// Configuration options
//
// supportRememberedDevices - Also requires an effective policy on the Auth API application that enables Remembered Devices.
//    When enabled the trusted_device_token will be stored in the SPS session so that MFA can be bypassed
//    later in the same session when this same token is seen in pre_auth.
//
// autoMode - If enabled, and the user has at least one device with the "auto" capability, then no prompt will sent to the
//    user for device/method selection and instead authentication will be initiated immediately. If false, or the user has
//    no devices in auto mode, the user will be sent a page to prompt for device/method of 2FA.
//
// enabledCapabilities - Lists the capabilities that the user may use for 2FA. Does not need to include "auto" if authMode is 
//    enabled. Can be one or more of "push", "sms", "phone", "mobile_otp"
//

// These seem like reasonable defaults
duoConfig = {
    supportRememberedDevices: @SUPPORT_REMEMBERED_DEVICES@,
    autoMode: @AUTOMODE@,
    enabledCapabilities: [ @ENABLED_CAPABILITIES@ ]
}
