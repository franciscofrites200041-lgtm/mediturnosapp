import { Module } from '@nestjs/common';
import { PrismaModule } from '@/common/prisma/prisma.module';
import { AreasService } from './areas.service';
import { AreasController } from './areas.controller';

@Module({
    imports: [PrismaModule],
    controllers: [AreasController],
    providers: [AreasService],
    exports: [AreasService],
})
export class AreasModule { }
