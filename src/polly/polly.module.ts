import { Module } from '@nestjs/common';
import { PollyService } from './polly.service';

@Module({
  providers: [PollyService],
  exports: [PollyService],
})
export class PollyModule {}
