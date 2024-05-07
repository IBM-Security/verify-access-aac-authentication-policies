# Duo Authentication integration Authentication Policy

On occassion IBM Security Verify Access enterprise customers may already have other multi-factor solutions in use, such as Duo Security. This authentication policy provides a skeleton solution for this using InfoMap-based authentication.

Note that this solution is provided as-is and makes use of standard APIs as advertised publicly in the [Duo Auth API documentation](https://duo.com/docs/authapi).

## Pre-requisite tasks

1. The Authentication and Context Based Access Configuration wizard has been run on the reverse proxy.
2. The Duo administrator has created an `Auth API Application`, and has available the resulting `Integration key`, `Secret key`, and `API hostname` as this will be required in the installation wizard.
3. The Duo SSL signer certificate has been loaded into the runtime SSL certificate database.

## Mapping rules descriptions

| Filename | Mapping Rule Name | Notes |
| -------- | ----------------- | ----- |
| kjur.js | KJUR | This is open source - the [jsrsasign](https://github.com/kjur/jsrsasign) library, and comments to that effect are included in the file. It provides the HmacSha512 implementation used to sign parameters and include in the Authorization header used in Duo API calls. You may wish to refresh this library from time to time, but note there is some custom javascript at the top of the mapping rule that I have included to allow the rule to load into ISVA as it is a restricted Javascript environment and doesn't have all the same global environment attributes as a browser or Node.JS.  |
| duovars.js | duovars | This file includes the Duo application macros for the `Integration key`, `Secret key`, and `API hostname`. There is another configuration object in this file that you might wish to fine-tune called `duoConfig`. There are comprehensive comments in the file on what the parameters are, and how they influence the authentication experience. |
| duoutils.js | duoutils | Utility functions for InfoMaps in general, plus functions to build the signature required for Duo APIs. It even includes a capability to show you (via adding debug trace) what the equivalent `curl` command would look like for an API call to Duo. I found this useful during development for testing. |
| duoauthn.js | duoauthn | This is the main entry point for the InfoMap authentication mechanism, and also includes functions that make the actual HTTP calls to Duo APIs. |

## Running the flow

The policy can be triggered (assuming path-based poicyKickoffMethod) via: `https://<your_webseal>/mga/sps/authsvc/policy/duoauthn`

You would normally instrument this into a step-up login flow, or an authorization policy, but the configuration for doing that is outside the scope of this installation wizard.

This policy is a second-factor authentication policy, and requires that you are first authenticated. Authentication may be achieved using any authentication method to the web reverse proxy including forms-based login, or another AAC policy. You can even include the UsernamePassword mechanism in the duoauthn policy prior to the InfoMap mechanism if you wish. Bottom line - make sure you are logged in as someone before you access the InfoMap mechanism or you will see an unauthenticated error.

Next, if you are logged in but not already registered in Duo (and user enrollment is enabled in Duo), you might see an enrollment error.

So now lets look at what happens if the user is enrolled, and has configured the Duo mobile application and has mobile-push capability for transaction approval. The experience will vary depending on how the `duoConfig` configuration tuning parameters are set up in the `duovars` mapping rule. These are the defaults:

```
duoConfig = {
    supportRememberedDevices: false,
    autoMode: true,
    enabledCapabilities: [ "push", "sms", "phone", "mobile_otp" ]
}
```

Provided the user has a registration suitable for auto mode (e.g. mobile push), and if `autoMode` is set to `true` as shown above, the mechanism will immediately initiate that form of authentication. On the browser you will see messages indicating that polling is taking place waiting for the transaction to be approved (or denied) on the mobile phone.

The user can approve or deny the transaction at this point, and the mechanism will either succeed or show a denied error (same if the transaction times out).

Things get a little more interesting if `autoMode` is set to `false`. In that case the users 2FA capabilities will be discovered, and a filter applied based on the setting of the `enabledCapabilities` configuration property, and the remaining options sent back to the browser for the user to select which capability they wish to use (or an error if there are no matching capabilities).

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
