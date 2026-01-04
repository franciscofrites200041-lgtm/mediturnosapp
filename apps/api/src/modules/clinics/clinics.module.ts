import { Module } from '@nestjs/common';
import { PrismaModule } from '@/common/prisma/prisma.module';
import { ClinicsService } from './clinics.service';
import { ClinicsController } from './clinics.controller';

@Module({
    imports: [PrismaModule],
    controllers: [ClinicsController],
    providers: [ClinicsService],
    exports: [ClinicsService],
})
export class ClinicsModule { }
