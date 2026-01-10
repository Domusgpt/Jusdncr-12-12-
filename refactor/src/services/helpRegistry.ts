export interface HelpHotspot {
  id: string;
  label: string;
  detail: string;
  x: number;
  y: number;
}

export interface HelpStep {
  id: string;
  title: string;
  description: string;
  imageSrc?: string;
  hotspots?: HelpHotspot[];
}

export const helpRegistry: Record<string, HelpStep[]> = {
  step1: [
    {
      id: 'source-identity',
      title: 'Source Identity',
      description: 'Upload or replace the main subject image.'
    }
  ]
};
