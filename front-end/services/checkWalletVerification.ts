import { createPublicClient, http } from 'viem';
import { celo } from 'viem/chains';
import { useCallback } from 'react';
import { useIdentitySDK } from '@goodsdks/identity-sdk';
import { useChainId } from 'wagmi';

export interface VerificationStatus {
  isVerified: boolean;
  isWhitelisted: boolean;
  root?: string; // The whitelisted root address (could be the account itself or the connected identity)
  loading: boolean;
  isRedirecting?: boolean;
  error?: string;
}

// Contract address for verification
const WHITELIST_CONTRACT_ADDRESS = '0xC361A6E67822a0EDc17D899227dd9FC50BD62F42' as const;

// Create public client for Celo
const publicClient = createPublicClient({
  chain: celo,
  transport: http()
});

export const useWalletVerification = () => {
  const identitySDK = useIdentitySDK('production');
  const chainId = useChainId();

  const checkVerificationStatus = useCallback(async (account: string): Promise<VerificationStatus> => {
    if (!account) {
      return {
        isVerified: false,
        isWhitelisted: false,
        loading: false,
        error: 'No account provided'
      };
    }

    try {
      // Call getWhitelistedRoot function on the contract
      const whitelistedRoot = await publicClient.readContract({
        address: WHITELIST_CONTRACT_ADDRESS,
        abi: [
          {
            name: 'getWhitelistedRoot',
            type: 'function',
            stateMutability: 'view',
            inputs: [{ name: 'account', type: 'address' }],
            outputs: [{ name: 'whitelisted', type: 'address' }]
          }
        ],
        functionName: 'getWhitelistedRoot',
        args: [account as `0x${string}`]
      }) as `0x${string}`;

      // If getWhitelistedRoot returns a non-zero address, the account is verified
      // It returns the whitelisted identity (could be the account itself or the root account it's connected to)
      const isVerified = whitelistedRoot !== '0x0000000000000000000000000000000000000000';
      
      return {
        isVerified,
        isWhitelisted: isVerified,
        root: whitelistedRoot,
        loading: false
      };
    } catch (error) {
      console.error('Error checking wallet verification:', error);
      return {
        isVerified: false,
        isWhitelisted: false,
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }, []); // Empty dependency array since this function doesn't depend on any props/state

  const generateFVLink = useCallback(async (): Promise<void> => {
    if (!identitySDK) {
      console.error('Identity SDK not initialized');
      throw new Error('Identity SDK not initialized');
    }

    try {
      const link = await identitySDK.generateFVLink(
        false,
        window.location.href,
        chainId
      );
      if (link) {
        window.location.href = link;
      } else {
        throw new Error('No verification link generated');
      }
    } catch (error) {
      console.error('Error generating verification link:', error);
      throw error; // Re-throw so the UI can handle it properly
    }
  }, [identitySDK, chainId]);

  return {
    checkVerificationStatus,
    generateFVLink,
    sdkReady: !!identitySDK
  };
};
