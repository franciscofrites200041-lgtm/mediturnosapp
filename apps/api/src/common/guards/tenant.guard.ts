import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Guard that ensures users can only access data from their own clinic (multi-tenant isolation)
 */
@Injectable()
export class TenantGuard implements CanActivate {
    constructor(private prisma: PrismaService) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const user = request.user;

        // Super admin can access all clinics
        if (user?.role === 'SUPER_ADMIN') {
            return true;
        }

        // Check if user has a clinic assigned
        if (!user?.clinicId) {
            throw new ForbiddenException('Usuario no asociado a ninguna clínica');
        }

        // Verify clinic is active
        const clinic = await this.prisma.clinic.findUnique({
            where: { id: user.clinicId },
            select: { isActive: true, subscriptionStatus: true },
        });

        if (!clinic) {
            throw new ForbiddenException('Clínica no encontrada');
        }

        if (!clinic.isActive) {
            throw new ForbiddenException('La clínica está desactivada');
        }

        if (clinic.subscriptionStatus === 'CANCELLED' || clinic.subscriptionStatus === 'SUSPENDED') {
            throw new ForbiddenException('La suscripción de la clínica no está activa');
        }

        return true;
    }
}
