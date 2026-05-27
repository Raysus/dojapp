import { Module } from '@nestjs/common';
import { ContentsService } from './contents.service';
import { ContentsController } from './contents.controller';
import { DojoContentsController } from './dojo-contents.controller';
import { DojoContentsService } from './dojo-contents.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthorizationModule } from '../authorization/authorization.module';

@Module({
  imports: [
    PrismaModule,
    AuthorizationModule,
  ],
  controllers: [ContentsController, DojoContentsController],
  providers: [ContentsService, DojoContentsService],
})
export class ContentsModule { }
