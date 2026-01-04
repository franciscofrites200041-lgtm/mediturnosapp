import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';

@Injectable()
export class InvoicesService {
    constructor(private prisma: PrismaService) { }

    /** Super Admin: Get all invoices */
    async findAll(status?: string) {
        return this.prisma.invoice.findMany({
            where: status ? { status: status as any } : undefined,
            include: {
                clinic: { select: { id: true, name: true, email: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    /** Get invoices for a specific clinic */
    async findByClinic(clinicId: string) {
        return this.prisma.invoice.findMany({
            where: { clinicId },
            orderBy: { createdAt: 'desc' },
        });
    }

    /** Generate invoice for a clinic */
    async generateInvoice(clinicId: string, amount: number, periodStart: Date, periodEnd: Date) {
        const invoiceNumber = `INV-${Date.now()}-${clinicId.slice(-4)}`;

        return this.prisma.invoice.create({
            data: {
                clinicId,
                invoiceNumber,
                amount,
                periodStart,
                periodEnd,
                dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days
                status: 'PENDING',
            },
        });
    }

    /** Mark invoice as paid */
    async markAsPaid(id: string, paymentMethod: string, paymentRef: string) {
        return this.prisma.invoice.update({
            where: { id },
            data: {
                status: 'PAID',
                paidAt: new Date(),
                paymentMethod,
                paymentRef,
            },
        });
    }
}
