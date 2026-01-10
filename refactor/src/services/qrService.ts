export interface QrPayload {
  url: string;
  label?: string;
}

export class QrService {
  buildPayload(payload: QrPayload) {
    return payload;
  }
}
