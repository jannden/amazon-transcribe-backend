import { Controller, Get } from '@nestjs/common';
import { createHash } from 'crypto';
import { AwsSignatureService } from './aws-signature.service';

@Controller('aws-signature')
export class AwsSignatureController {
  constructor(private readonly awsSignatureService: AwsSignatureService) {}
  @Get()
  async transcribe(): Promise<string> {
    const awsEndpoint =
      'transcribestreaming.' + process.env.AWS_REGION + '.amazonaws.com:8443';

    return this.awsSignatureService.createPresignedURL(
      'GET',
      awsEndpoint,
      '/stream-transcription-websocket',
      'transcribe',
      createHash('sha256').update('', 'utf8').digest('hex'),
      {
        key: process.env.AWS_ACCESS_KEY_ID,
        secret: process.env.AWS_SECRET_ACCESS_KEY_ID,
        region: process.env.AWS_REGION,
        protocol: 'wss',
        expires: 300,
        query: 'language-code=en-US&media-encoding=pcm&sample-rate=44100',
      },
    );
  }
}
