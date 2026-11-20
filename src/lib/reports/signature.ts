export type SignatureResult = { valid: boolean; algorithm: string; signer: string; reason?: string };

export function verifyReportSignature(
  expectedDigest: string,
  actualDigest: string,
  signer: string
): SignatureResult {
  const valid = expectedDigest.length > 0 && expectedDigest === actualDigest;
  return {
    valid,
    algorithm: "SHA-256",
    signer,
    ...(valid ? {} : { reason: "Digest does not match the signed report." })
  };
}

export function isValidDigest(digest: string): boolean {
  return digest.length > 0 && /^[a-f0-9]+$/i.test(digest);
}
