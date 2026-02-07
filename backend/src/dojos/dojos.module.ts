import { Module } from '@nestjs/common';
import { DojosService } from './dojos.service';
import { DojosController } from './dojos.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AuthorizationModule } from 'src/authorization/authorization.module';

@Module({
  imports: [
    PrismaModule,
    AuthorizationModule,
  ],
  providers: [DojosService],
  controllers: [DojosController]
})
export class DojosModule { }
