import { Module } from '@nestjs/common';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { MercadoPagoService } from './mercado-pago.service';

@Module({
    controllers: [BillingController],
    providers: [BillingService, MercadoPagoService],
    exports: [BillingService],
})
export class BillingModule { }
