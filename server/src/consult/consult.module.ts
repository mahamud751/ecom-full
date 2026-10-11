import { Module } from "@nestjs/common";
import { ConsultationsController } from "./consultations.controller";
import { PrescriptionsController } from "./prescriptions.controller";
import { AgoraController } from "./agora.controller";
import { CallRingController } from "./call-ring.controller";
import { DoctorRingService } from "./doctor-ring.service";

@Module({
  controllers: [
    ConsultationsController,
    PrescriptionsController,
    AgoraController,
    CallRingController,
  ],
  providers: [DoctorRingService],
})
export class ConsultModule {}
