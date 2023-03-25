import { Injectable, Logger } from '@nestjs/common';
import {
  TranscribeStreamingClient,
  StartStreamTranscriptionCommand,
} from '@aws-sdk/client-transcribe-streaming';

@Injectable()
export class LocalAudioService {
  private readonly logger: Logger = new Logger('LocalAudioController');

  private readonly transcribeClient: TranscribeStreamingClient;

  constructor() {
    this.transcribeClient = new TranscribeStreamingClient({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });
  }

  async transcribeStream(audioSource: any): Promise<string> {
    const audioStream = async function* () {
      for await (const payloadChunk of audioSource) {
        yield { AudioEvent: { AudioChunk: payloadChunk } };
      }
    };

    const command = new StartStreamTranscriptionCommand({
      LanguageCode: 'en-US',
      MediaEncoding: 'pcm',
      MediaSampleRateHertz: 44100,
      AudioStream: audioStream(),
    });

    let transcript = '';
    let response;
    try {
      response = await this.transcribeClient.send(command);
    } catch (error) {
      this.logger.error(error);
    }
    if (response?.TranscriptResultStream) {
      for await (const event of response.TranscriptResultStream) {
        if (event.TranscriptEvent) {
          const results = event.TranscriptEvent.Transcript.Results;
          if (results.length && !results[0]?.IsPartial) {
            const newTranscript = results[0].Alternatives[0].Transcript;
            transcript += newTranscript + ' ';
          }
        }
      }
    }
    return transcript;
  }
}
