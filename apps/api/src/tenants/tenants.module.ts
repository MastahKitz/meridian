import { Module } from '@nestjs/common';
import { TenantsController } from './tenants.controller';
import { AuthModule } from '../auth/auth.module';
import { GatewayModule } from '../gateway/gateway.module';

@Module({ imports: [AuthModule, GatewayModule], controllers: [TenantsController] })
export class TenantsModule {}
