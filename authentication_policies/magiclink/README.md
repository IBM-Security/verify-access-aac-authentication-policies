# Magic Link Authentication Policy
This authentication policy allows a user to perform a passwordless authentication using a magic link that is sent to a provided email address.

The authentication follows this pattern:

1. The user is shown a login form that contains a single email address field.
2. The user enters the email address and clicks the Login button.
	- The only validation on the field is that it has the correct format to be a valid email address. The login form will not submit until the field is valid.
3. Server side the UserLookupHelper class is used to ensure that the email address belongs to a single valid user.
	- If the email address does not belong to a user or belongs to more than one user, the login will fail silently. The trace file can be used to find the issue.
4. A preformatted email is sent to the email address with a magic link that contains a single use login token.
	- The token as a defined lifetime and can only be used within that timeframe.
5. The user clicks on the magic link.
6. Server side the token is validated and the users credential information is created.
7. The authentication process is complete.

## Pre-requisite tasks

1. The Authentication and Context Based Access Configuration wizard has been run on the reverse proxy.
2. An SMTP server connection must be created. This is used to send the magic link email.
3. The Username Password authentication mechanism must be configured. This is used by the UserLookupHelper to validate the provided email address.
4. Load the SMTP server SSL signer certificate into the runtime SSL certificate database.

## Policy inclusions

1. An authentication policy definition.
2. An authentication mechanism definition.
3. An InfoMap type mapping rule. The mapping rule includes a number of macro replacements that should be checked and set at installation time.
4. A number of template files.

## Mapping rule descriptions

| Filename | Mapping Rule Name | Notes |
| magiclink.js | magiclink | This is the mapping rule that handles the server side interactions for this authentication policy. |

## Template file descriptions

| Filename | Notes |
| /C/authsvc/authenticator/magiclink/login.html | This is the html page for the login form that is presented to the user. |
| /C/authsvc/authenticator/magiclink/sent.html | This is the html page that is presented to the user after the login form is submitted. |
| /C/authsvc/authenticator/magiclink/confirm.html | This is the html page that is presented to the user after the magic link in the email has been clicked. |
| /static/scripts/magiclink/login.js | This is a javascript file that compliments the login.html file providing any client side interactions. |
| /static/scripts/magiclink/sent.js | This is a javascript file that compliments the sent.html file providing any client side interactions. |
| /static/scripts/magiclink/confirm.js | This is a javascript file that compliments the confirm.html file providing any client side interactions. |
| /static/css/magiclink/sent.js | Provides the styling for the various html elements. |

## Running the flow

The policy can be triggered (assuming path-based poicyKickoffMethod) via: https://<your_webseal>/mga/sps/authsvc/policy/magiclink

If the policy is configured as a redirected login method for the reverse proxy and the original target URL is passed, after successful completion of the authentication, the user will be redirected to the original URL.

For example:

1. Enable local-response-redirect in the reverse proxy configuration

[acnt-mgt]
enable-local-response-redirect = yes

[local-response-redirect]
local-response-redirect-uri = [login] /mga/sps/authsvc/policy/magiclink

[local-response-macros]
macro = URL:Target

2. Access a page secured by the reverse proxy.

https://<your_webseal>/creds

3. The magic link login page is shown.

4. Enter a valid email address and click Login.

5. Find the email in your inbox and click the magic link.

6. The original page is opened in the browser.

https://<your_webseal>/creds

# IBM Security Verify Access import
The IBM Security Verify Access documentation for importing authentication policy bundles can be found at https://www.ibm.com/docs/en/sva/10.0.8?topic=authentication-importing-bundled-policy 

# License
```
Copyright 2024 International Business Machines

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
```

