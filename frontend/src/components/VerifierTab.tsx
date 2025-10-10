"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { getContract, hashFile } from "@/lib/web3";

interface DebugInfo {
  hasKyc: boolean;
  kycValid: boolean;
  consentGranted: boolean;
  hashMatches: boolean;
  issuer: string;
  issuedAt: string;
}

export default function VerifierTab({ account }: { account: string }) {
  const [holderAddress, setHolderAddress] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [verificationResult, setVerificationResult] = useState<boolean | null>(
    null
  );
  const [documentHash, setDocumentHash] = useState("");
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);

  const handleVerify = async () => {
    if (!holderAddress || !file) {
      alert("Please provide holder address and upload the document");
      return;
    }

    try {
      setLoading(true);
      setVerificationResult(null);
      setDebugInfo(null);

      // Hash the file
      const computedHash = await hashFile(file);
      console.log("Document hash:", computedHash);
      setDocumentHash(computedHash);

      // Get contract with signer
      const contract = await getContract();

      // Get debug information
      console.log("=== DEBUG INFO ===");
      console.log("Holder:", holderAddress);
      console.log("Verifier (you):", account);
      console.log("Computed Hash:", computedHash);

      // Check KYC record
      const record = await contract.getKycRecord(holderAddress);
      console.log("KYC Record:", {
        issuer: record[0],
        issuedAt: record[1].toString(),
        valid: record[2],
      });

      const hasKyc = record[0] !== "0x0000000000000000000000000000000000000000";
      const kycValid = record[2];

      // Check consent
      const consentGranted = await contract.hasConsent(holderAddress, account);
      console.log("Consent granted:", consentGranted);

      // Try to get document hash (this might fail if you're not authorized)
      let storedHash = null;
      try {
        storedHash = await contract.getDocumentHash(holderAddress);
        console.log("Stored Hash:", storedHash);
      } catch (e) {
        console.log("Cannot read stored hash (not authorized)");
      }

      const hashMatches = storedHash === computedHash;

      // Set debug info
      setDebugInfo({
        hasKyc,
        kycValid,
        consentGranted,
        hashMatches,
        issuer: record[0],
        issuedAt: new Date(Number(record[1]) * 1000).toLocaleString(),
      });

      // Perform actual verification
      const isValid = await contract.verifyKyc(holderAddress, computedHash);
      console.log("Verification result:", isValid);

      setVerificationResult(isValid);
    } catch (error: unknown) {
      console.error(error);
      const errorMessage =
        error instanceof Error ? error.message : "Verification failed";
      alert("Error: " + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900 mb-2">
          Verify KYC Credential
        </h2>
        <p className="text-sm text-slate-600">
          Verify a holder&apos;s KYC by uploading their document. The document
          hash will be compared with the on-chain record.
        </p>
      </div>

      {/* Current Verifier Info */}
      <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
        <p className="text-xs font-medium text-purple-900">
          Your Verifier Address:
        </p>
        <p className="text-xs font-mono text-purple-700 break-all">{account}</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Holder Address
          </label>
          <input
            type="text"
            value={holderAddress}
            onChange={(e) => setHolderAddress(e.target.value)}
            placeholder="0x..."
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            KYC Document (for verification)
          </label>
          <input
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
          />
          {file && (
            <p className="text-xs text-slate-500 mt-1">
              Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
            </p>
          )}
        </div>

        <Button
          onClick={handleVerify}
          disabled={loading || !holderAddress || !file}
          className="w-full bg-purple-600 hover:bg-purple-700"
        >
          {loading ? "Verifying..." : "Verify KYC"}
        </Button>

        {/* Debug Information */}
        {debugInfo && (
          <div className="p-4 bg-slate-50 border border-slate-300 rounded-lg">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">
              🔍 Debug Information
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                {debugInfo.hasKyc ? (
                  <span className="text-green-600">✓</span>
                ) : (
                  <span className="text-red-600">✗</span>
                )}
                <span className="font-medium">KYC Exists:</span>
                <span>{debugInfo.hasKyc ? "Yes" : "No"}</span>
              </div>

              {debugInfo.hasKyc && (
                <>
                  <div className="flex items-center gap-2">
                    {debugInfo.kycValid ? (
                      <span className="text-green-600">✓</span>
                    ) : (
                      <span className="text-red-600">✗</span>
                    )}
                    <span className="font-medium">KYC Valid:</span>
                    <span>{debugInfo.kycValid ? "Yes" : "No (Revoked)"}</span>
                  </div>

                  <div className="flex items-start gap-2">
                    <span className="text-slate-400">•</span>
                    <div>
                      <span className="font-medium">Issuer:</span>
                      <p className="font-mono text-[10px] break-all text-slate-600">
                        {debugInfo.issuer}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">•</span>
                    <span className="font-medium">Issued At:</span>
                    <span>{debugInfo.issuedAt}</span>
                  </div>
                </>
              )}

              <div className="flex items-center gap-2">
                {debugInfo.consentGranted ? (
                  <span className="text-green-600">✓</span>
                ) : (
                  <span className="text-red-600">✗</span>
                )}
                <span className="font-medium">Consent Granted:</span>
                <span>{debugInfo.consentGranted ? "Yes" : "No"}</span>
              </div>

              <div className="flex items-center gap-2">
                {debugInfo.hashMatches ? (
                  <span className="text-green-600">✓</span>
                ) : (
                  <span className="text-slate-400">?</span>
                )}
                <span className="font-medium">Hash Matches:</span>
                <span>
                  {debugInfo.hashMatches
                    ? "Yes"
                    : "Cannot verify (need consent)"}
                </span>
              </div>
            </div>

            {/* Specific Issue Highlight */}
            <div className="mt-3 pt-3 border-t border-slate-300">
              <p className="text-sm font-semibold text-slate-900 mb-2">
                Issue Found:
              </p>
              {!debugInfo.hasKyc && (
                <p className="text-sm text-red-700">
                  ❌ No KYC exists for this holder. The issuer needs to issue
                  KYC first.
                </p>
              )}
              {debugInfo.hasKyc && !debugInfo.kycValid && (
                <p className="text-sm text-red-700">
                  ❌ KYC has been revoked by the issuer.
                </p>
              )}
              {debugInfo.hasKyc &&
                debugInfo.kycValid &&
                !debugInfo.consentGranted && (
                  <p className="text-sm text-red-700">
                    ❌ The holder has NOT granted consent to your address. Ask
                    the holder to grant consent to: <br />
                    <code className="text-xs bg-red-100 px-2 py-1 rounded mt-1 inline-block break-all">
                      {account}
                    </code>
                  </p>
                )}
              {debugInfo.hasKyc &&
                debugInfo.kycValid &&
                debugInfo.consentGranted &&
                !debugInfo.hashMatches && (
                  <p className="text-sm text-red-700">
                    ❌ Document hash does NOT match. Make sure you&apos;re
                    uploading the exact same file that was used during issuance.
                  </p>
                )}
            </div>
          </div>
        )}

        {/* Verification Result */}
        {verificationResult !== null && (
          <div
            className={`p-4 border rounded-lg ${
              verificationResult
                ? "bg-green-50 border-green-200"
                : "bg-red-50 border-red-200"
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              {verificationResult ? (
                <>
                  <svg
                    className="w-5 h-5 text-green-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <p className="font-medium text-green-900">
                    ✓ Verification Successful
                  </p>
                </>
              ) : (
                <>
                  <svg
                    className="w-5 h-5 text-red-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <p className="font-medium text-red-900">
                    ✗ Verification Failed
                  </p>
                </>
              )}
            </div>
            <p
              className={`text-sm ${
                verificationResult ? "text-green-800" : "text-red-800"
              }`}
            >
              {verificationResult
                ? "The document hash matches and the holder has granted you consent."
                : "Either the document hash doesn't match, consent is not granted, or the KYC is invalid."}
            </p>
            {documentHash && (
              <div className="mt-2 pt-2 border-t">
                <p
                  className={`text-xs font-medium ${
                    verificationResult ? "text-green-800" : "text-red-800"
                  }`}
                >
                  Document Hash (computed):
                </p>
                <p
                  className={`text-xs font-mono break-all mt-1 ${
                    verificationResult ? "text-green-700" : "text-red-700"
                  }`}
                >
                  {documentHash}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="text-sm font-medium text-blue-900 mb-2">
          ℹ️ How Verification Works
        </h3>
        <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside">
          <li>
            Upload the exact same document file that was used during KYC
            issuance
          </li>
          <li>The file is hashed in your browser (never uploaded)</li>
          <li>The hash is compared with the on-chain record</li>
          <li>
            Verification succeeds only if the hash matches AND the holder has
            granted you consent
          </li>
        </ul>
      </div>
    </div>
  );
}
