export interface SubtitleRequest {
  body: {
    base64AudioFileBuffer: string;
    audioFormat: 'mp3' | 'wav';
    lang: string;
  };
}

export interface SmartCutRequest {
  body: {
    base64AudioFileBuffer: string;
    audioFormat: 'mp3' | 'wav';
    cutMarginInSeconds: number;
  };
}
