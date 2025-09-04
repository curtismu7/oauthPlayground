import crypto from 'crypto';
import forge from 'node-forge';

class CryptoUtils {
  constructor() {
    this.algorithm = 'sha256';
    this.keySize = 2048;
  }

  // Generate key pair for MPC participant
  generateKeyPair() {
    const keypair = forge.pki.rsa.generateKeyPair(this.keySize);
    
    return {
      privateKey: forge.pki.privateKeyToPem(keypair.privateKey),
      publicKey: forge.pki.publicKeyToPem(keypair.publicKey)
    };
  }

  // Sign data with private key
  sign(data, privateKeyPem) {
    const privateKey = forge.pki.privateKeyFromPem(privateKeyPem);
    const md = forge.md.sha256.create();
    md.update(data, 'utf8');
    
    return privateKey.sign(md);
  }

  // Verify signature with public key
  async verifySignature(data, signature, publicKeyPem) {
    try {
      const publicKey = forge.pki.publicKeyFromPem(publicKeyPem);
      const md = forge.md.sha256.create();
      md.update(data, 'utf8');
      
      return publicKey.verify(md.digest().bytes(), signature);
    } catch (error) {
      console.error('Signature verification error:', error);
      return false;
    }
  }

  // Generate cryptographic proof for MPC result
  async generateProof(result, computation) {
    const proofData = {
      result,
      computationId: computation.computationId,
      operation: computation.operation,
      participants: computation.participants.length,
      timestamp: Date.now()
    };

    const proofString = JSON.stringify(proofData);
    const hash = crypto.createHash(this.algorithm).update(proofString).digest('hex');
    
    return {
      hash,
      data: proofData,
      signature: this.sign(proofString, this.getServerPrivateKey())
    };
  }

  // Verify proof for MPC result
  async verifyProof(result, proof, computation) {
    try {
      if (!proof || !proof.hash || !proof.data || !proof.signature) {
        return false;
      }

      // Verify the proof data matches the computation
      if (proof.data.computationId !== computation.computationId ||
          proof.data.operation !== computation.operation ||
          proof.data.result !== result) {
        return false;
      }

      // Verify the hash
      const proofString = JSON.stringify(proof.data);
      const expectedHash = crypto.createHash(this.algorithm).update(proofString).digest('hex');
      
      if (proof.hash !== expectedHash) {
        return false;
      }

      // Verify the signature
      const isValidSignature = await this.verifySignature(
        proofString,
        proof.signature,
        this.getServerPublicKey()
      );

      return isValidSignature;
    } catch (error) {
      console.error('Proof verification error:', error);
      return false;
    }
  }

  // Generate secure random number for MPC
  generateSecureRandom(min = 0, max = 1000000) {
    const range = max - min;
    const randomBytes = crypto.randomBytes(4);
    const randomValue = randomBytes.readUInt32BE(0);
    return min + (randomValue % range);
  }

  // Generate shares for secret sharing
  generateShares(secret, numShares, threshold) {
    if (threshold > numShares) {
      throw new Error('Threshold cannot be greater than number of shares');
    }

    const shares = [];
    const coefficients = [secret]; // First coefficient is the secret

    // Generate random coefficients for the polynomial
    for (let i = 1; i < threshold; i++) {
      coefficients.push(this.generateSecureRandom());
    }

    // Generate shares using Shamir's Secret Sharing
    for (let i = 1; i <= numShares; i++) {
      let share = 0;
      for (let j = 0; j < threshold; j++) {
        share += coefficients[j] * Math.pow(i, j);
      }
      shares.push({ x: i, y: share });
    }

    return shares;
  }

  // Reconstruct secret from shares
  reconstructSecret(shares, threshold) {
    if (shares.length < threshold) {
      throw new Error('Not enough shares to reconstruct secret');
    }

    // Use Lagrange interpolation
    let secret = 0;
    
    for (let i = 0; i < threshold; i++) {
      let numerator = 1;
      let denominator = 1;
      
      for (let j = 0; j < threshold; j++) {
        if (i !== j) {
          numerator *= -shares[j].x;
          denominator *= (shares[i].x - shares[j].x);
        }
      }
      
      secret += shares[i].y * (numerator / denominator);
    }

    return Math.round(secret);
  }

  // Hash function for MPC operations
  hash(data) {
    return crypto.createHash(this.algorithm).update(JSON.stringify(data)).digest('hex');
  }

  // Get server's private key (in production, this should be stored securely)
  getServerPrivateKey() {
    // In production, load from secure key store
    return process.env.SERVER_PRIVATE_KEY || this.generateKeyPair().privateKey;
  }

  // Get server's public key
  getServerPublicKey() {
    // In production, load from secure key store
    return process.env.SERVER_PUBLIC_KEY || this.generateKeyPair().publicKey;
  }

  // Encrypt data for secure transmission
  encrypt(data, publicKeyPem) {
    const publicKey = forge.pki.publicKeyFromPem(publicKeyPem);
    return publicKey.encrypt(JSON.stringify(data));
  }

  // Decrypt data
  decrypt(encryptedData, privateKeyPem) {
    const privateKey = forge.pki.privateKeyFromPem(privateKeyPem);
    const decrypted = privateKey.decrypt(encryptedData);
    return JSON.parse(decrypted);
  }
}

export const cryptoUtils = new CryptoUtils();
export default cryptoUtils;

