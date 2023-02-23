/* eslint-disable prettier/prettier */
import { LoginUserModule } from '@api/login/login.module';
import { UsersModule } from '@api/users/users.module';
import { Module } from '@nestjs/common';
import { AppointmentModule } from './appointment/appointment.module';
import { BloodPressureModule } from './blood-pressure/blood-pressure.module';
import { BmiModule } from './bmi/bmi.module';
import { CarerModule } from './carer/carer.module';
import { CholesterolModule } from './cholesterol/cholesterol.module';
import { ConversationModule } from './conversation/conversation.module';
import { DoctorModule } from './doctor/doctor.module';
import { GlucoseModule } from './glucose/glucose.module';
import { HealthRecordModule } from './health-record/health-record.module';
import { HeartbeatModule } from './heartbeat/heartbeat.module';
import { PatientModule } from './patient/patient.module';
import { SocketGateWayModule } from '@api/socket-io/socket-io.module';
import { ChatModule } from './chat/chat.module';

@Module({
  imports: [
    DoctorModule,
    LoginUserModule,
    PatientModule,
    UsersModule,
    HealthRecordModule,
    ConversationModule,
    BmiModule,
    HeartbeatModule,
    BloodPressureModule,
    GlucoseModule,
    CholesterolModule,
    CarerModule,
    AppointmentModule,
    ChatModule,
    SocketGateWayModule,
  ],
  providers: [],
  exports: [],
})
export class ApiModule {}