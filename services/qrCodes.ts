import QRCode from 'qrcode';

export type QRTarget = 'preview' | 'paywall' | 'proLanding';

interface LinkParams {
  projectId?: string;
  campaign?: string;
  userId?: string;
}

const DEFAULT_ORIGIN = 'https://jusdnce.app';

const getOrigin = () => {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }
  return DEFAULT_ORIGIN;
};

export const buildShareLink = (target: QRTarget, params: LinkParams = {}): string => {
  const origin = getOrigin();
  let path = '/share/preview';
  if (target === 'paywall') path = '/upgrade';
  if (target === 'proLanding') path = '/pro';

  const url = new URL(path, origin);
  if (params.projectId) url.searchParams.set('id', params.projectId);
  if (params.campaign) url.searchParams.set('utm_campaign', params.campaign);
  if (params.userId) url.searchParams.set('u', params.userId);
  url.searchParams.set('utm_source', 'qr');
  url.searchParams.set('utm_medium', target);
  return url.toString();
};

export const generateQrDataUrl = async (text: string): Promise<string> => {
  return QRCode.toDataURL(text, {
    errorCorrectionLevel: 'M',
    margin: 1,
    scale: 6,
    color: {
      dark: '#7C3AED',
      light: '#00000000'
    }
  });
};

export const createQrForTarget = async (
  target: QRTarget,
  params: LinkParams = {}
): Promise<{ link: string; dataUrl: string }> => {
  const link = buildShareLink(target, params);
  const dataUrl = await generateQrDataUrl(link);
  return { link, dataUrl };
};
