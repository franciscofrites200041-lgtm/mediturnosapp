import { Module } from '@nestjs/common';
import { PrescriptionsService } from './prescriptions.service';
import { PrescriptionsController } from './prescriptions.controller';
import { WebhooksModule } from '../webhooks/webhooks.module';

@Module({
    imports: [WebhooksModule],
    controllers: [PrescriptionsController],
    providers: [PrescriptionsService],
    exports: [PrescriptionsService],
})
export class PrescriptionsModule { }
