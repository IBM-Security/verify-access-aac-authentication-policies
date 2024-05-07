# Hello World Authentication Policy
This authentication policy is a simple example. It does not do a lot but is here as an example of how to create a more useful authentication policy bundle.

The policy will allow a user to login and then do an approval of the authentication using a form.

The policy includes:

1. An authentication policy definition.
2. An authentication mechanism definition.
3. An InfoMap type mapping rule. The mapping rule includes a macro replacement that must match the macro replacement in the template file.
4. 2 template files. One of the template files contains a macro replacement that must match the macro replacement in the mapping rule.

The authentication policy bundle has been developed and tested on a clean IBM Security Verify Access installation. 

To try this authentication policy ensure that:

1. The Authentication and Context Based Access Configuration wizard has been run on the reverse proxy.
2. The Username Password authentication mechanism has been configured correctly.

After the bundle has been imported and deployed, access the policy at:

https://<reverse_proxy>/mga/sps/authsvc/policy/importexample 

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

