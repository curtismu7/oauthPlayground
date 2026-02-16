# OAuth 2.0 Token Exchange

Intended audience: Selected customers

# Preface {#preface}

We intend to support the OAuth 2.0 Token Exchange specification [https://datatracker.ietf.org/doc/html/rfc8693](https://datatracker.ietf.org/doc/html/rfc8693). This RFC can service multiple use cases. This document describes the most common use case. 

# Changelog {#changelog}

Nov 14, 2025 [Ivan Mok](mailto:imok@pingidentity.com) — revised with more information

May 8, 2025 [Ivan Mok](mailto:imok@pingidentity.com)

Table of contents

[**Preface	1**](#preface)

[**Changelog	1**](#changelog)

[**Context: OAuth 2.0 Token Exchange	2**](#context:-oauth-2.0-token-exchange)

[**Context: Common PingOne OAuth/OIDC use case	2**](#context:-common-pingone-oauth/oidc-use-case)

[**Common Token Exchange use case	3**](#common-token-exchange-use-case)

[**Release planning	4**](#release-planning)

[Phase 1 coverage	4](#phase-1-coverage)

[Future phases	5](#future-phases)

# Context: OAuth 2.0 Token Exchange {#context:-oauth-2.0-token-exchange}

An OAuth client sends a token exchange request to an authorization server’s token endpoint and expects to receive a token exchange response from the authorization server. 

A token exchange request contains a subject token, and optionally an actor token. 

A token exchange response contains an issued token and other parameters. 

# Context: Common PingOne OAuth/OIDC use case {#context:-common-pingone-oauth/oidc-use-case}

A PingOne administrator registers an OIDC application and a custom resource in PingOne because the administrator, the application developer, and the developer of a resource server (referred to as custom resource in PingOne) agree to the following terms. 

1. PingOne plays the Authorization Server and OpenID Provider roles and issues access tokens, optionally refresh tokens, and ID tokens (if applicable) to the application.   
2. The application agrees to include the access token in its request to the custom resource.   
3. The custom resource agrees to accept the access token as authorization and grants the application access to its data. The custom resource may send a request to PingOne’s introspection endpoint to determine the validity of the said access token. Because PingOne’s access token is a JWT, the custom resource can also validate the access token itself. 

 

# 

# Common Token Exchange use case {#common-token-exchange-use-case}

Referring to the aforementioned [Common PingOne OAuth/OIDC use case](#context:-common-pingone-oauth/oidc-use-case), the custom resource (API A) may not have all the data it needs to fulfill the request it receives from the application (App X). The custom resource can return what it has and let the application send other requests to get the rest of the data, which may not be desirable. If all parties support token exchange, the custom resource can act as an application and ask for an access token that it can use as authorization to access the required data from another custom resource (API B). 

Because API A has to act as an application, the PingOne administrator must create an application record in PingOne and pass the client ID and authentication information to the developer of API A. 

The application record for API A is something like:

1. Name: App A  
2. Client ID: \<the client ID of App A\>  
3. Enabled grant type: Token Exchange  
4. Allowed scopes: openid \<scopes from API B such as B.r\>

The developer of API A needs the information to construct the token exchange request to be sent to PingOne to get an access token to access data from API B. Essentially, when API A needs to send a token exchange request, it must do so as an application based on the information defined in the application record of App A. 

Sample flow of things

1. App X obtains an access token for the purpose of accessing API A and then sends a request to API A to get data M.   
2. API A realizes that it needs data N from API B to fulfill the request it receives from App X.   
3. API A now has to act as an application to obtain an access token for the purpose of accessing data N from API B using the token exchange grant type.   
4. App A sends a **Token Exchange token request** to PingOne.   
   1. Client ID: \<the client ID of App A\>  
   2. Subject token: the access token from step 1  
   3. Actor token: none  
   4. Scope parameter value: B.r  
5. App A gets a **Token Exchange token response** from PingOne.   
   1. Issue token: an access token to access API B   
      * This access token is issued to App A and is scoped with B.r   
6. App A sends a request to API B to get data N.    
7. When App A (i.e. API A) gets data N, it constructs and returns data M to App X. 

# Release planning {#release-planning}

We intend to deliver Token Exchange Phase 1 by the end of 2026 Q1. We will continue to improve it in multiple phases thereafter. 

## Phase 1 coverage {#phase-1-coverage}

Token Exchange is a new grant type. No application is allowed to use the Token Exchange grant type until an administrator enables it explicitly. 

For the `subject_token` or the `actor_token`, a PingOne environment accepts an access token or an ID token it previously issued. In other words, it must be a token from the same environment. A token from another PingOne environment (regardless of whether it is under the same organization, or not) or an external authorization server is not supported. The token must be valid; for example, the token has not expired, the digital signature is valid, etc.

For the `requested_token_type`, PingOne supports `urn:ietf:params:oauth:token-type:access_token` and `urn:ietf:params:oauth:token-type:id_token`. For the former, the `access_token` in the [token response](https://datatracker.ietf.org/doc/html/rfc8693#section-2.2.1) is an access token intended for one or more custom resources. For the latter, the `access_token` in the [token response](https://datatracker.ietf.org/doc/html/rfc8693#section-2.2.1) is an ID token. PingOne does not include a refresh token in its [token response](https://datatracker.ietf.org/doc/html/rfc8693#section-2.2.1) as a result of using the Token Exchange grant type. 

Similar to what an application can do in its authorization request, an application using the Token Exchange grant type can use the ***scope*** parameter to indicate the desired custom resource(s). Also similar to how the ***scope*** parameter is processed, the scope value(s) in the ***scope*** parameter must be added to the application using the Token Exchange grant type. 

When the `requested_token_type` is `urn:ietf:params:oauth:token-type:access_token`, its fulfillment is controlled by the attribute mapping configuration of the applicable custom resource(s). Administrators can use expressions to implement fulfillment logic. For example, to fulfill an attribute differently based on the grant type used, an administrator can check the `context.requestData.grantType` value and fulfill the attribute differently. Expression has access to various data from the token request, such as `context.requestData.subjectToken[.claim]` to access individual claims from the subject token or `context.requestData.scope` to access the ***scope*** parameter value. `context.appConfig.clientId`, `context.appConfig.tokenEndpointAuthMethod`, `context.appConfig.envId`, and `context.appConfig.orgId` are also made available. 

## 

## Future phases {#future-phases}

After phase 1, we intend to make further improvements in multiple phases thereafter. Here are some of the items (no commitment can be made at this point): 

* Advanced attribute mapping policy  
  * Write an expression once and apply it to multiple attributes in the same or different custom resources  
  * Add UI and management API for common sources to reduce the reliance on expressions  
* Inclusion of refresh token (if applicable)  
* Expand `requested_token_type` to support `urn:ietf:params:oauth:token-type:id-jag` from [https://datatracker.ietf.org/doc/draft-ietf-oauth-identity-assertion-authz-grant/](https://datatracker.ietf.org/doc/draft-ietf-oauth-identity-assertion-authz-grant/)   
* Support third-party authorization servers