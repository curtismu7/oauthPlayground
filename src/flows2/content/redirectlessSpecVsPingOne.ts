// src/flows2/content/redirectlessSpecVsPingOne.ts
//
// "Spec vs PingOne" entries for the Redirectless / pi.flow grant. This flow is
// the clearest case in the app where PingOne diverges from the specs: standard
// OAuth/OIDC is redirect-based, whereas response_mode=pi.flow is a PingOne
// extension that drives authentication entirely through JSON API responses with
// no browser redirect. Claims are kept conservative; specs are cited in specRef.

import type { SpecVsPingOneEntry } from '../framework/SpecVsPingOne';

export const redirectlessSpecVsPingOne: SpecVsPingOneEntry[] = [
	{
		id: 'response-mode',
		topic: 'response_mode',
		spec: 'OAuth 2.0 delivers the authorization response by redirecting the user-agent back to redirect_uri with the parameters in the query or fragment. OAuth 2.0 Multiple Response Type / Form Post Response Mode add query, fragment, and form_post — all of which still round-trip through the browser.',
		specRef: 'RFC 6749 §3.1.2 / OAuth 2.0 Form Post Response Mode',
		pingone:
			'PingOne adds a non-standard response_mode=pi.flow. Instead of any browser redirect, the authorize request returns a JSON "flow" object that the application advances programmatically. This mode is a PingOne platform extension — it is not defined by any OAuth/OIDC RFC.',
		note: 'Because pi.flow is an extension, code written against it is PingOne-specific and will not port to another authorization server unchanged.',
	},
	{
		id: 'no-browser-redirect',
		topic: 'Browser redirect',
		spec: 'The authorization-code and implicit flows are defined around a front-channel redirect: the user-agent is sent to the authorization endpoint and later redirected back to the client. The redirect is the mechanism that carries the result.',
		specRef: 'RFC 6749 §4.1.1 / §4.1.2',
		pingone:
			'With pi.flow there is no redirect and no hosted login page hop. The application calls the Flow API directly and renders its own UI. This keeps the user inside a native or single-page app for the whole login ceremony.',
		note: 'The tradeoff: because the app collects credentials itself, this grant is only appropriate for highly trusted first-party clients — a third-party app should use Authorization Code + redirect instead.',
	},
	{
		id: 'flow-state-api',
		topic: 'Flow state machine',
		spec: 'The specs describe a single authorization request/response pair; there is no standard notion of a multi-step, resumable authentication "flow object" that a client polls or advances.',
		specRef: 'RFC 6749 §4.1',
		pingone:
			'pi.flow exposes a stateful Flow API: each response carries a flowId, a status (e.g. USERNAME_PASSWORD_REQUIRED, PENDING, COMPLETED), and _links describing the allowed next actions. The client advances the flow by following those links until it reaches COMPLETED.',
		note: 'Drive the flow off status and _links rather than assuming a fixed step order — MFA, device selection, or policy steps can insert additional states between start and completion.',
	},
	{
		id: 'custom-ui-use-case',
		topic: 'Custom login UI',
		spec: 'The spec model expects the authorization server to authenticate the user (typically on its own hosted pages); the client never sees the user’s credentials.',
		specRef: 'RFC 6749 §1.1 (roles) / §10.2',
		pingone:
			'pi.flow is intended for building a fully custom, in-app login experience: the app renders its own username/password (and MFA) screens and submits them into the flow. PingOne still enforces the environment’s authentication policy behind the API.',
		note: 'Handling credentials in-app is exactly why this is first-party only; treat the credential-collection surface with the same care as the authorization server’s own login page.',
	},
	{
		id: 'standard-tokens',
		topic: 'Resulting tokens',
		spec: 'A successful authorization ultimately yields standard OAuth 2.0 / OIDC tokens — an access_token, and (for the openid scope) an id_token, with the usual claims and validation rules.',
		specRef: 'RFC 6749 §5.1 / OIDC Core §2',
		pingone:
			'Despite the non-standard transport, a completed pi.flow ends in the same standard tokens as any other PingOne flow. Once COMPLETED, the flow object surfaces an access_token and id_token that are validated exactly like tokens from a redirect-based flow.',
		note: 'Only the delivery mechanism is PingOne-specific; token validation (iss, aud, exp, signature) is unchanged, so downstream resource-server code stays spec-standard.',
	},
];
