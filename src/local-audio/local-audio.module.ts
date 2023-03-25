import { Module } from '@nestjs/common';
import { LocalAudioService } from './local-audio.service';
import { LocalAudioGateway } from './local-audio.gateway';
import { TranslateModule } from 'src/translate/translate.module';
import { PollyModule } from 'src/polly/polly.module';

@Module({
  providers: [LocalAudioService, LocalAudioGateway],
  imports: [TranslateModule, PollyModule],
})
export class LocalAudioModule {}
