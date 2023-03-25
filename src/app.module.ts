import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LocalAudioModule } from './local-audio/local-audio.module';
import { AwsSignatureModule } from './aws-signature/aws-signature.module';
import { TranslateModule } from './translate/translate.module';
import { PollyModule } from './polly/polly.module';

@Module({
  imports: [ConfigModule.forRoot(), LocalAudioModule, AwsSignatureModule, TranslateModule, PollyModule],
})
export class AppModule {}
