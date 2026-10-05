import { Module } from "@nestjs/common";
import { ConsultationsController } from "./consultations.controller";
import { PrescriptionsController } from "./prescriptions.controller";
import { AgoraController } from "./agora.controller";
import { CallRingController } from "./call-ring.controller";

@Module({
  controllers: [
    ConsultationsController,
    PrescriptionsController,
    AgoraController,
    CallRingController,
  ],
})
export class ConsultModule {}
