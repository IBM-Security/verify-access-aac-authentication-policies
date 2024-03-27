# Introduction

This document contains the release process which should be followed when generating a new release of the IBM Security Verify Access AAC Authentication Policies

## Version Number

The version number should be of the format: `v<year>.<month>.0`, for example: `v24.3.0`.


# Generating a GitHub Release

In order to generate a new version of the authentication policies a new GitHub release should be created: [https://github.com/IBM-Security/verify-access-aac-authentication-policies/releases/new](https://github.com/IBM-Security/verify-access-aac-authentication-policies/releases/new). 

The fields for the release should be:

|Field|Description
|-----|----------- 
|Tag | The version number, e.g. `v23.3.0`
|Release title | The version number, e.g. `v23.3.0`
|Release description | The resources associated with the \<version\-number> IBM Security Verify Access AAC Authentication Policies release.

After the release has been created the GitHub actions workflow ([https://github.com/IBM-Security/verify-access-aac-authentication-policies/actions/workflows/build.yml](https://github.com/IBM-Security/verify-access-aac-authentication-policies/actions/workflows/build.yml)) will be executed to generate the build.  This build process will include:

* adding the and bundle zip files to the release artifacts in GitHub.
