export type UserTier = 'trial' | 'starter' | 'golem' | 'pro';

export const paywallPolicy = {
  canExportVideo(tier: UserTier) {
    return tier !== 'trial';
  },
  canDownloadHtml(tier: UserTier) {
    return tier === 'pro';
  },
  canUseFx(tier: UserTier) {
    return tier !== 'trial';
  }
};
