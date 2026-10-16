import { HeliusWebhookPayload, ParsedSwap } from '../types';
import { resolveTokenSymbol, resolveTokenDecimals, estimateUsdValue } from '../lib/token';

const SOL_MINT = 'So11111111111111111111111111111111111111112';

export async function parseSwap(payload: HeliusWebhookPayload): Promise<ParsedSwap | null> {
  const { signature, timestamp, feePayer, events, source, tokenTransfers, nativeTransfers } = payload;

  let inputMint = '';
  let inputAmount = 0;
  let inputDecimals = 9;

  let outputMint = '';
  let outputAmount = 0;
  let outputDecimals = 9;

  // Case 1: Helius structured swap event
  if (events && events.swap) {
    const swap = events.swap;

    // Check token or native input
    if (swap.tokenInputs && swap.tokenInputs.length > 0) {
      const firstIn = swap.tokenInputs[0];
      inputMint = firstIn.mint;
      inputDecimals = firstIn.rawTokenAmount.decimals;
      inputAmount = Number(firstIn.rawTokenAmount.tokenAmount) / 10 ** inputDecimals;
    } else if (swap.nativeInput) {
      inputMint = SOL_MINT;
      inputDecimals = 9;
      inputAmount = Number(swap.nativeInput.amount) / 1e9;
    }

    // Check token or native output
    if (swap.tokenOutputs && swap.tokenOutputs.length > 0) {
      const firstOut = swap.tokenOutputs[0];
      outputMint = firstOut.mint;
      outputDecimals = firstOut.rawTokenAmount.decimals;
      outputAmount = Number(firstOut.rawTokenAmount.tokenAmount) / 10 ** outputDecimals;
    } else if (swap.nativeOutput) {
      outputMint = SOL_MINT;
      outputDecimals = 9;
      outputAmount = Number(swap.nativeOutput.amount) / 1e9;
    }
  }

  // Case 2: Fall back to analyzing tokenTransfers / nativeTransfers
  if (!inputMint && tokenTransfers && tokenTransfers.length >= 2) {
    const outTransfer = tokenTransfers.find((t) => t.fromUserAccount === feePayer);
    const inTransfer = tokenTransfers.find((t) => t.toUserAccount === feePayer);

    if (outTransfer && inTransfer) {
      inputMint = outTransfer.mint;
      inputAmount = outTransfer.tokenAmount;
      inputDecimals = resolveTokenDecimals(inputMint);

      outputMint = inTransfer.mint;
      outputAmount = inTransfer.tokenAmount;
      outputDecimals = resolveTokenDecimals(outputMint);
    }
  } else if (!inputMint && tokenTransfers && tokenTransfers.length === 1 && nativeTransfers) {
    const nativeOut = nativeTransfers.find((t) => t.fromUserAccount === feePayer);
    const tokenIn = tokenTransfers.find((t) => t.toUserAccount === feePayer);

    if (nativeOut && tokenIn) {
      inputMint = SOL_MINT;
      inputAmount = nativeOut.amount / 1e9;
      inputDecimals = 9;

      outputMint = tokenIn.mint;
      outputAmount = tokenIn.tokenAmount;
      outputDecimals = resolveTokenDecimals(outputMint);
    }
  }

  // If we couldn't parse input/output mints, cannot proceed
  if (!inputMint || !outputMint) {
    return null;
  }

  const [inputSymbol, outputSymbol] = await Promise.all([
    resolveTokenSymbol(inputMint),
    resolveTokenSymbol(outputMint),
  ]);

  const valueUsd = estimateUsdValue(inputMint, inputAmount, outputMint, outputAmount);

  return {
    walletAddress: feePayer,
    signature,
    timestamp,
    inputMint,
    inputSymbol,
    inputAmount,
    inputDecimals,
    outputMint,
    outputSymbol,
    outputAmount,
    outputDecimals,
    valueUsd,
    source: source || 'Jupiter / DEX',
  };
}
