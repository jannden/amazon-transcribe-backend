import { Module } from '@nestjs/common';
import { AwsSignatureController } from './aws-signature.controller';
import { AwsSignatureService } from './aws-signature.service';

@Module({
  controllers: [AwsSignatureController],
  providers: [AwsSignatureService],
})
export class AwsSignatureModule {}
