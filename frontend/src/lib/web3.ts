import { BrowserProvider, Contract, ethers } from "ethers";
import { CONTRACT_ADDRESS, KYC_VAULT_ABI, SEPOLIA_CHAIN_ID } from "./contract";

// Define specific types for Ethereum requests
type EthereumRequestArgs = {
  method: string;
  params?: unknown[];
};

type EthereumProvider = {
  request: (args: EthereumRequestArgs) => Promise<unknown>;
  isMetaMask?: boolean;
};

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

// Define specific error type for Ethereum errors
interface EthereumError extends Error {
  code: number;
  message: string;
}

function isEthereumError(error: unknown): error is EthereumError {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    "message" in error
  );
}

export async function connectWallet(): Promise<string> {
  if (!window.ethereum) {
    throw new Error("MetaMask is not installed!");
  }

  const provider = new BrowserProvider(window.ethereum);
  const accounts = (await provider.send("eth_requestAccounts", [])) as string[];

  const network = await provider.getNetwork();
  if (Number(network.chainId) !== SEPOLIA_CHAIN_ID) {
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0xaa36a7" }],
      });
    } catch (error: unknown) {
      if (isEthereumError(error) && error.code === 4902) {
        throw new Error("Please add Sepolia network to MetaMask");
      }
      throw error;
    }
  }

  return accounts[0];
}

export async function getContract(): Promise<Contract> {
  if (!window.ethereum) {
    throw new Error("MetaMask is not installed!");
  }

  const provider = new BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  return new Contract(CONTRACT_ADDRESS, KYC_VAULT_ABI, signer);
}

export async function getReadOnlyContract(): Promise<Contract> {
  if (!window.ethereum) {
    throw new Error("MetaMask is not installed!");
  }

  const provider = new BrowserProvider(window.ethereum);
  return new Contract(CONTRACT_ADDRESS, KYC_VAULT_ABI, provider);
}

export function hashFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        const bytes = new Uint8Array(arrayBuffer);

        const hexString =
          "0x" +
          Array.from(bytes)
            .map((b) => b.toString(16).padStart(2, "0"))
            .join("");

        const hash = ethers.keccak256(hexString);

        console.log("File size:", bytes.length, "bytes");
        console.log("File hash:", hash);

        resolve(hash);
      } catch (error) {
        console.error("Hashing error:", error);
        reject(error);
      }
    };

    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
}

export function shortenAddress(address: string): string {
  if (!address || address.length < 10) {
    return address;
  }
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
