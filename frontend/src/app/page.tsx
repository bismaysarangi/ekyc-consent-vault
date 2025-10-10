"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { connectWallet, shortenAddress } from "@/lib/web3";
import IssuerTab from "@/components/IssuerTab";
import HolderTab from "@/components/HolderTab";
import VerifierTab from "@/components/VerifierTab";
import HelpModal from "@/components/HelpModal";

export default function Home() {
  const [account, setAccount] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"issuer" | "holder" | "verifier">(
    "issuer"
  );
  const [loading, setLoading] = useState(false);

  const handleConnect = async () => {
    try {
      setLoading(true);
      const address = await connectWallet();
      setAccount(address);
    } catch (error) {
      if (error instanceof Error) {
        alert(error.message);
      } else {
        alert("An unknown error occurred while connecting wallet");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              e-KYC Consent Vault
            </h1>
            <p className="text-sm text-slate-600">
              Decentralized Identity Verification
            </p>
          </div>
          {!account ? (
            <Button onClick={handleConnect} disabled={loading}>
              {loading ? "Connecting..." : "Connect Wallet"}
            </Button>
          ) : (
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-xs text-slate-500">Connected</p>
                <p className="text-sm font-mono font-medium text-slate-900">
                  {shortenAddress(account)}
                </p>
              </div>
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {!account ? (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-200 rounded-full mb-4">
              <svg
                className="w-8 h-8 text-slate-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-slate-900 mb-2">
              Connect Your Wallet
            </h2>
            <p className="text-slate-600 mb-6">
              Please connect your MetaMask wallet to continue
            </p>
            <Button onClick={handleConnect} size="lg" disabled={loading}>
              {loading ? "Connecting..." : "Connect MetaMask"}
            </Button>
          </div>
        ) : (
          <div>
            {/* Tabs */}
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setActiveTab("issuer")}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  activeTab === "issuer"
                    ? "bg-blue-600 text-white shadow-lg"
                    : "bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                🏦 Issuer
              </button>
              <button
                onClick={() => setActiveTab("holder")}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  activeTab === "holder"
                    ? "bg-green-600 text-white shadow-lg"
                    : "bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                👤 Holder
              </button>
              <button
                onClick={() => setActiveTab("verifier")}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  activeTab === "verifier"
                    ? "bg-purple-600 text-white shadow-lg"
                    : "bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                ✓ Verifier
              </button>
            </div>

            {/* Tab Content */}
            {activeTab === "issuer" && <IssuerTab account={account} />}
            {activeTab === "holder" && <HolderTab account={account} />}
            {activeTab === "verifier" && <VerifierTab account={account} />}
            <HelpModal />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-6 text-center text-sm text-slate-500">
        <p>Contract: {process.env.NEXT_PUBLIC_CONTRACT_ADDRESS}</p>
        <p className="mt-1">Sepolia Testnet</p>
      </footer>
    </div>
  );
}
