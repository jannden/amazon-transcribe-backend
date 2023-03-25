import { Injectable } from '@nestjs/common';
import {
  TranslateClient,
  TranslateTextCommand,
} from '@aws-sdk/client-translate';

@Injectable()
export class TranslateService {
  private readonly translateClient: TranslateClient;

  constructor() {
    this.translateClient = new TranslateClient({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });
  }

  async translateText(text: string): Promise<string> {
    const command = new TranslateTextCommand({
      SourceLanguageCode: 'en',
      TargetLanguageCode: 'es',
      Text: text,
    });

    const response = await this.translateClient.send(command);
    return response.TranslatedText || '';
  }
}
