import { Injectable } from '@nestjs/common';
import { Polly } from '@aws-sdk/client-polly';
import { Readable } from 'node:stream';

@Injectable()
export class PollyService {
  private readonly pollyClient: Polly;

  constructor() {
    this.pollyClient = new Polly({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });
  }

  async generateSpeech(text: string): Promise<Readable> {
    const response = await this.pollyClient.synthesizeSpeech({
      Engine: 'standard',
      LanguageCode: 'es-ES',
      Text: text,
      OutputFormat: 'mp3',
      VoiceId: 'Miguel',
    });

    if (response.AudioStream instanceof Readable) {
      return response.AudioStream;
    }
    return null;
  }
}
