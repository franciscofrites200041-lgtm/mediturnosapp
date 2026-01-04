import { Module } from '@nestjs/common';
import { PrismaModule } from '@/common/prisma/prisma.module';
import { PatientsService } from './patients.service';
import { PatientsController } from './patients.controller';

@Module({
    imports: [PrismaModule],
    controllers: [PatientsController],
    providers: [PatientsService],
    exports: [PatientsService],
})
export class PatientsModule { }
