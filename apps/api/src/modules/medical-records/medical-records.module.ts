import { Module } from '@nestjs/common';
import { MedicalRecordsService } from './medical-records.service';
import { MedicalRecordsController } from './medical-records.controller';
import { WebhooksModule } from '../webhooks/webhooks.module';
import { EncryptionService } from '@/common/services/encryption.service';

@Module({
    imports: [WebhooksModule],
    controllers: [MedicalRecordsController],
    providers: [MedicalRecordsService, EncryptionService],
    exports: [MedicalRecordsService],
})
export class MedicalRecordsModule { }
