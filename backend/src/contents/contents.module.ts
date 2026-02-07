import { Module } from '@nestjs/common';
import { ContentsService } from './contents.service';
import { ContentsController } from './contents.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthorizationModule } from '../authorization/authorization.module';

@Module({
  imports: [
    PrismaModule,
    AuthorizationModule, // 👈 obligatorio por el guard + service
  ],
  controllers: [ContentsController],
  providers: [ContentsService],
})
export class ContentsModule { }
