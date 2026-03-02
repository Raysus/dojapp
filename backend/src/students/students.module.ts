import { Module } from '@nestjs/common';
import { StudentsController } from './students.controller';
import { DojoStudentsController } from './dojo-students.controller';
import { StudentsService } from './students.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from 'src/auth/auth.module';
import { AuthorizationModule } from 'src/authorization/authorization.module';

@Module({
    imports: [PrismaModule, AuthModule, AuthorizationModule],
    controllers: [StudentsController, DojoStudentsController],
    providers: [StudentsService],
    exports: [StudentsService],
})
export class StudentsModule { }
