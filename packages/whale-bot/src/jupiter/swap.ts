export function buildJupiterSwapUrl(
  inputMint: string,
  outputMint: string,
  _amount?: number,
  referralAccount?: string
): string {
  const baseUrl = `https://jup.ag/swap/${inputMint}-${outputMint}`;
  const params = new URLSearchParams();

  if (referralAccount && referralAccount.trim()) {
    // Append your Jupiter referral account to earn referral fees on user swaps
    params.set('referrer', referralAccount.trim());
  }

  const queryString = params.toString();
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
}
