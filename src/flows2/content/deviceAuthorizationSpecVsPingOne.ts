// src/flows2/content/deviceAuthorizationSpecVsPingOne.ts
//
// "Spec vs PingOne" entries for the Device Authorization grant (RFC 8628). Each
// entry pairs what the RFC says with what PingOne specifically does — its
// environment-scoped endpoints, response fields, and polling behavior. Claims
// are kept conservative and factual; RFC sections are cited in specRef.

import type { SpecVsPingOneEntry } from '../framework/SpecVsPingOne';

export const deviceAuthorizationSpecVsPingOne: SpecVsPingOneEntry[] = [
	{
		id: 'device-authorization-endpoint',
		topic: 'Device authorization endpoint',
		spec: 'RFC 8628 adds a new device authorization endpoint. The client POSTs its client_id (and optional scope) and receives a device_code, a user_code, and a verification_uri. The spec does not prescribe the URL — it is published as device_authorization_endpoint in server metadata.',
		specRef: 'RFC 8628 §3.1 / §3.2',
		pingone:
			'PingOne scopes the endpoint per environment: https://auth.pingone.{region}/{environmentId}/as/device_authorization (region host is one of .com, .eu, .ca, .asia). The application must have the Device Authorization grant type enabled, otherwise the request is rejected.',
		note: "Discover the exact URL from the environment's OpenID configuration rather than hardcoding it; the device_authorization_endpoint is advertised there.",
	},
	{
		id: 'user-code-verification-uri',
		topic: 'user_code + verification_uri',
		spec: 'The device shows the human-readable user_code and directs the user to the verification_uri on a second device. RFC 8628 §3.3.1 also defines verification_uri_complete, which embeds the user_code so the user can skip typing it (e.g. via a QR code).',
		specRef: 'RFC 8628 §3.2 / §3.3.1',
		pingone:
			'PingOne returns user_code, verification_uri, and verification_uri_complete in the device authorization response. The user_code is a short, formatted string intended to be typed by hand; verification_uri_complete is convenient to render as a QR code for camera-equipped phones.',
		note: 'Prefer verification_uri_complete when you can display a QR code — it removes the manual user_code entry step and the transcription errors that come with it.',
	},
	{
		id: 'polling-interval-slow-down',
		topic: 'Polling: authorization_pending + slow_down',
		spec: 'While the user has not yet approved, the token endpoint returns error=authorization_pending — the client MUST keep polling. If it polls too fast it receives error=slow_down and MUST increase its interval by 5 seconds. Neither is a terminal failure.',
		specRef: 'RFC 8628 §3.4 / §3.5',
		pingone:
			'PingOne honors the standard interval from the device authorization response and returns authorization_pending until the user finishes, and slow_down if the client polls faster than the interval. This flow starts at the returned interval and adds 5s on each slow_down, per spec.',
		note: 'authorization_pending and slow_down are expected, normal states — not errors to surface to the user. Only access_denied and expired_token are terminal.',
	},
	{
		id: 'device-code-expiry',
		topic: 'device_code expiry (expires_in)',
		spec: 'The device authorization response includes expires_in — the lifetime of the device_code / user_code pair. If the user does not approve before it elapses, the token endpoint returns error=expired_token and the client must restart the flow to get a fresh code.',
		specRef: 'RFC 8628 §3.2 / §3.5',
		pingone:
			'PingOne enforces the device_code lifetime it advertises in expires_in; once it lapses, polling returns expired_token. The client cannot renew an expired device_code — it must request a brand-new one from the device authorization endpoint.',
		note: 'Show the user a countdown based on expires_in; if it hits zero, guide them to restart rather than leaving a poll loop grinding on a dead code.',
	},
	{
		id: 'pingone-device-grant-support',
		topic: 'PingOne device flow support',
		spec: 'RFC 8628 is an optional grant an authorization server may or may not implement; support is advertised via the device_authorization_endpoint metadata and the urn:ietf:params:oauth:grant-type:device_code grant.',
		specRef: 'RFC 8628 §1 / §3.4',
		pingone:
			'PingOne supports the Device Authorization grant as a per-application setting. The token request uses grant_type=urn:ietf:params:oauth:grant-type:device_code, and PingOne applies the client authentication method configured on the application (e.g. none for a public device client, or client_secret_post).',
		note: 'A pure device (TV, CLI, IoT) is typically a public client with no secret — enable the grant and pick an appropriate token endpoint authentication method for the hardware.',
	},
];
