import { Module } from '@nestjs/common';
import { N8nController } from './n8n.controller';
import { N8nService } from './n8n.service';
import { AppointmentsModule } from '../appointments/appointments.module';
import { PatientsModule } from '../patients/patients.module';

@Module({
    imports: [AppointmentsModule, PatientsModule],
    controllers: [N8nController],
    providers: [N8nService],
    exports: [N8nService],
})
export class N8nModule { }
