// src/flows2/content/dpopSpecVsPingOne.ts
//
// "Spec vs PingOne" entries for the DPoP flow (RFC 9449). Each entry pairs what the
// spec mandates for proof-of-possession with what PingOne specifically does. DPoP
// support on PingOne is limited at the time of writing, so the PingOne column is kept
// deliberately conservative and factual; RFC sections are cited in specRef.

import type { SpecVsPingOneEntry } from '../framework/SpecVsPingOne';

export const dpopSpecVsPingOne: SpecVsPingOneEntry[] = [
	{
		id: 'proof-jwt-structure',
		topic: 'DPoP proof JWT structure',
		spec: 'A DPoP proof is a JWT with header typ=dpop+jwt, an asymmetric alg (e.g. ES256), and the public key embedded as a jwk header member. Its payload carries htm (HTTP method), htu (HTTP target URI, no query/fragment), a unique jti, and iat (issued-at). The proof is signed by the private key matching the embedded jwk.',
		specRef: 'RFC 9449 §4.2',
		pingone:
			'When PingOne processes a DPoP request it expects the standard dpop+jwt proof shape. This playground builds the proof client-side with Web Crypto (ES256 over P-256) and forwards it in the DPoP header via the BFF; the header and payload are decoded for inspection so you can see htm/htu/jti/iat exactly as the spec defines them.',
		note: 'htu must be the bare token-endpoint URL — omit any query string or fragment, or the server-side htu comparison fails.',
	},
	{
		id: 'token-binding-cnf-jkt',
		topic: 'Token binding via cnf.jkt',
		spec: 'The authorization server binds the issued access token to the proof key by placing the JWK SHA-256 thumbprint (RFC 7638) in the token’s cnf (confirmation) claim under jkt. A resource server later recomputes the thumbprint of the proof’s jwk and checks it equals cnf.jkt before honoring the token.',
		specRef: 'RFC 9449 §6 / RFC 7638',
		pingone:
			'The mock path issues a token whose cnf.jkt equals the base64url JWK thumbprint computed in the Generate Key step, so you can trace the binding end-to-end offline. In real mode PingOne’s DPoP handling is limited at the time of writing, so a cnf.jkt claim may or may not be present in the returned token.',
		note: 'The thumbprint is a hash of only crv, kty, x, y in alphabetical order — any other JWK members are excluded from the digest.',
	},
	{
		id: 'per-request-proof',
		topic: 'Fresh proof per request',
		spec: 'Each protected request carries its own DPoP proof whose htm/htu match that specific request, with a fresh jti and a recent iat. The server rejects proofs that are stale, replayed (a jti it has already seen within its window), or whose htm/htu do not match the request being made.',
		specRef: 'RFC 9449 §4.3 / §11.1',
		pingone:
			'A proof built for POST /as/token is valid only for that call. A subsequent resource request needs a new proof with htm=GET (or the actual method) and htu set to the resource URL. This demo generates one proof per token request; a production client regenerates a proof for every outbound call.',
		note: 'Because iat is checked for freshness, keep client and server clocks reasonably in sync or proofs may be rejected as expired.',
	},
	{
		id: 'dpop-nonce',
		topic: 'Server nonce challenge (DPoP-Nonce)',
		spec: 'A server may require a server-chosen nonce inside the proof. It signals this by returning HTTP 400/401 with error=use_dpop_nonce and a DPoP-Nonce response header; the client then re-sends the request with the supplied nonce added to the proof payload as the nonce claim.',
		specRef: 'RFC 9449 §8 / §9',
		pingone:
			'The nonce challenge is optional in the spec and is used to tighten replay protection. This playground does not drive a live nonce round-trip; if a server issues a DPoP-Nonce challenge, the correct response is to copy that nonce into the proof and retry.',
		note: 'Treat use_dpop_nonce as a normal, expected handshake step — not a hard failure — and retry once with the provided nonce.',
	},
	{
		id: 'pingone-dpop-support',
		topic: 'PingOne DPoP support',
		spec: 'RFC 9449 is an OAuth extension; support is negotiated out of band or advertised via the dpop_signing_alg_values_supported metadata parameter. A client should not assume every authorization server enforces DPoP.',
		specRef: 'RFC 9449 §5.1',
		pingone:
			'PingOne’s DPoP support is limited at the time of writing. Real mode forwards the DPoP header best-effort through the BFF — PingOne may accept it, ignore it, or return an error — so the mock path is the reliable teaching demo. Check your environment’s published metadata before relying on DPoP enforcement in production.',
		note: 'Do not treat the mock cnf.jkt binding as proof that a given PingOne environment enforces DPoP — verify against live metadata.',
	},
];
