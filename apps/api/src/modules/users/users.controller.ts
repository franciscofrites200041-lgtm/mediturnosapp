import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { CurrentClinic } from '@/common/decorators/user.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { RolesGuard } from '@/common/guards/roles.guard';
import { TenantGuard } from '@/common/guards/tenant.guard';
import { UserRole } from '@prisma/client';

@ApiTags('users')
@Controller('users')
@UseGuards(AuthGuard('jwt'), TenantGuard, RolesGuard)
@ApiBearerAuth()
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Get()
    @Roles(UserRole.CLINIC_ADMIN)
    @ApiOperation({ summary: 'Listar usuarios de la clínica' })
    findAll(@CurrentClinic() clinicId: string, @Query('role') role?: UserRole) {
        return this.usersService.findAll(clinicId, role);
    }

    @Get('doctors')
    @Roles(UserRole.CLINIC_ADMIN, UserRole.SECRETARY)
    @ApiOperation({ summary: 'Listar doctores de la clínica' })
    findDoctors(@CurrentClinic() clinicId: string, @Query('areaId') areaId?: string) {
        return this.usersService.findDoctors(clinicId, areaId);
    }

    @Get(':id')
    @Roles(UserRole.CLINIC_ADMIN)
    @ApiOperation({ summary: 'Obtener detalle de un usuario' })
    findOne(@CurrentClinic() clinicId: string, @Param('id') id: string) {
        return this.usersService.findOne(id, clinicId);
    }
    @Post()
    @Roles(UserRole.CLINIC_ADMIN)
    @ApiOperation({ summary: 'Crear usuario (Doctor/Secretaria)' })
    create(@CurrentClinic() clinicId: string, @Body() createUserDto: CreateUserDto) {
        return this.usersService.create(clinicId, createUserDto);
    }

    @Patch(':id')
    @Roles(UserRole.CLINIC_ADMIN)
    @ApiOperation({ summary: 'Actualizar usuario' })
    update(
        @CurrentClinic() clinicId: string,
        @Param('id') id: string,
        @Body() updateUserDto: UpdateUserDto,
    ) {
        return this.usersService.update(id, clinicId, updateUserDto);
    }

    @Delete(':id')
    @Roles(UserRole.CLINIC_ADMIN)
    @ApiOperation({ summary: 'Eliminar (desactivar) usuario' })
    remove(@CurrentClinic() clinicId: string, @Param('id') id: string) {
        return this.usersService.remove(id, clinicId);
    }
}
