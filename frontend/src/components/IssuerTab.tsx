"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { getContract, hashFile } from "@/lib/web3";

export default function IssuerTab({ account }: { account: string }) {
  const [holderAddress, setHolderAddress] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState("");

  const handleIssueKyc = async () => {
    if (!holderAddress || !file) {
      alert("Please provide holder address and upload a document");
      return;
    }

    try {
      setLoading(true);
      setTxHash("");

      // Hash the file
      const computedHash = await hashFile(file);
      console.log("Document hash:", computedHash);

      // Get contract and issue KYC
      const contract = await getContract();
      const tx = await contract.issueKyc(holderAddress, computedHash);

      setTxHash(tx.hash);
      await tx.wait();

      alert("✅ KYC issued successfully!");
      setHolderAddress("");
      setFile(null);
    } catch (error: unknown) {
      console.error(error);
      const errorMessage =
        error instanceof Error ? error.message : "Transaction failed";
      alert("Error: " + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900 mb-2">
          Issue KYC Credential
        </h2>
        <p className="text-sm text-slate-600">
          Upload a KYC document and issue a credential to a holder. Only the
          document hash will be stored on-chain.
        </p>
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
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            KYC Document
          </label>
          <input
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          {file && (
            <p className="text-xs text-slate-500 mt-1">
              Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
            </p>
          )}
        </div>

        <Button
          onClick={handleIssueKyc}
          disabled={loading || !holderAddress || !file}
          className="w-full"
        >
          {loading ? "Issuing..." : "Issue KYC"}
        </Button>

        {txHash && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm font-medium text-green-900">
              Transaction Successful!
            </p>
            <a
              href={`https://sepolia.etherscan.io/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-green-700 hover:underline break-all"
            >
              View on Etherscan: {txHash}
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
