import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AreasService } from './areas.service';
import { CurrentClinic } from '@/common/decorators/user.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { RolesGuard } from '@/common/guards/roles.guard';
import { TenantGuard } from '@/common/guards/tenant.guard';
import { UserRole } from '@prisma/client';

@ApiTags('areas')
@Controller('areas')
@UseGuards(AuthGuard('jwt'), TenantGuard, RolesGuard)
@ApiBearerAuth()
export class AreasController {
    constructor(private readonly areasService: AreasService) { }

    @Get()
    @Roles(UserRole.CLINIC_ADMIN, UserRole.SECRETARY, UserRole.DOCTOR)
    @ApiOperation({ summary: 'Listar áreas/especialidades' })
    findAll(@CurrentClinic() clinicId: string) {
        return this.areasService.findAll(clinicId);
    }

    @Get(':id')
    @Roles(UserRole.CLINIC_ADMIN, UserRole.SECRETARY)
    @ApiOperation({ summary: 'Detalle de área' })
    findOne(@CurrentClinic() clinicId: string, @Param('id') id: string) {
        return this.areasService.findOne(clinicId, id);
    }

    @Post()
    @Roles(UserRole.CLINIC_ADMIN)
    @ApiOperation({ summary: 'Crear área' })
    create(@CurrentClinic() clinicId: string, @Body() data: any) {
        return this.areasService.create(clinicId, data);
    }

    @Patch(':id')
    @Roles(UserRole.CLINIC_ADMIN)
    @ApiOperation({ summary: 'Actualizar área' })
    update(@CurrentClinic() clinicId: string, @Param('id') id: string, @Body() data: any) {
        return this.areasService.update(clinicId, id, data);
    }

    @Delete(':id')
    @Roles(UserRole.CLINIC_ADMIN)
    @ApiOperation({ summary: 'Eliminar área' })
    delete(@CurrentClinic() clinicId: string, @Param('id') id: string) {
        return this.areasService.delete(clinicId, id);
    }
}
