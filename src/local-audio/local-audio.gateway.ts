import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { PollyClient, SynthesizeSpeechCommand } from '@aws-sdk/client-polly';

import { Writer as WavWriter } from 'wav';

import { LocalAudioService } from './local-audio.service';
import { PassThrough } from 'node:stream';
import { Server } from 'node:http';
import { TranslateService } from 'src/translate/translate.service';
import { PollyService } from 'src/polly/polly.service';

@WebSocketGateway({ cors: '*' })
export class LocalAudioGateway {
  @WebSocketServer() server: Server;
  private wavWriter: WavWriter;

  constructor(
    private readonly localAudioService: LocalAudioService,
    private readonly translateService: TranslateService,
    private readonly pollyService: PollyService,
  ) {}

  @SubscribeMessage('start-audio')
  async startAudio() {
    console.log(`start-audio`);

    this.wavWriter = new WavWriter({
      sampleRate: 44100,
      bitDepth: 16,
      channels: 1,
    });
  }

  @SubscribeMessage('binary-data')
  async binaryData(client: any, payload: Buffer) {
    console.log(`got ${payload ? payload.length : 0} bytes`);

    if (this.wavWriter) {
      this.wavWriter.write(payload);
    }
  }

  @SubscribeMessage('end-audio')
  async endAudio() {
    console.log(`end-audio`);

    if (this.wavWriter) {
      this.wavWriter.end();
      // Create a new PassThrough stream
      const passThroughStream = new PassThrough();

      // Pipe the Writer to the PassThrough stream
      this.wavWriter.pipe(passThroughStream);

      const transcription = await this.localAudioService.transcribeStream(
        passThroughStream,
      );
      console.log(transcription);

      if (transcription) {
        const translation = await this.translateService.translateText(
          transcription,
        );
        console.log(translation);

        // Use generateSpeech of PollyService to synthesize the translated text to speech
        const audioStream = await this.pollyService.generateSpeech(translation);

        // Send the audio stream to the client in such a way that doesn't trigger the 'Callstack exceeded' error
        audioStream.on('data', (chunk) => {
          this.server.emit('binary-data', chunk);
        });

        audioStream.on('end', () => {
          this.server.emit('end-transcript', true);
        });
      }
    }
  }
}
