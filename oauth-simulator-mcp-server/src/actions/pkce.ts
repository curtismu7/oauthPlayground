import { z } from 'zod';
import { generateVerifier, computeChallenge } from '../services/pkceService.js';
import { logger } from '../services/logger.js';

export const PkceRequestSchema = z.object({
  verifierLength: z.number().int().min(43).max(128).optional(),
});

export type PkceRequest = z.infer<typeof PkceRequestSchema>;

export interface PkceResponse {
  codeVerifier: string;
  codeChallenge: string;
  codeChallengeMethod: 'S256';
  verifierLength: number;
  challengeLength: number;
  description: string;
}

export async function generatePkcePair(request: PkceRequest): Promise<PkceResponse> {
  const { verifierLength = 128 } = request;

  logger.info('Generating PKCE pair', { verifierLength });

  const codeVerifier = generateVerifier(verifierLength);
  const codeChallenge = computeChallenge(codeVerifier);

  const response: PkceResponse = {
    codeVerifier,
    codeChallenge,
    codeChallengeMethod: 'S256',
    verifierLength: codeVerifier.length,
    challengeLength: codeChallenge.length,
    description: 'PKCE pair generated using SHA-256. Use codeVerifier in token request, codeChallenge in authorization request.',
  };

  logger.debug('PKCE pair generated', { 
    verifierLength: response.verifierLength, 
    challengeLength: response.challengeLength 
  });

  return response;
}
