import { Module } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { AppointmentsController } from './appointments.controller';
import { WebhooksModule } from '../webhooks/webhooks.module';
import { BotAppointmentsController } from './bot-appointments.controller';

@Module({
    imports: [WebhooksModule],
    controllers: [AppointmentsController, BotAppointmentsController],
    providers: [AppointmentsService],
    exports: [AppointmentsService],
})
export class AppointmentsModule { }
