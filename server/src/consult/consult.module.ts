import { Module } from "@nestjs/common";
import { ConsultationsController } from "./consultations.controller";
import { PrescriptionsController } from "./prescriptions.controller";
import { AgoraController } from "./agora.controller";

@Module({
  controllers: [
    ConsultationsController,
    PrescriptionsController,
    AgoraController,
  ],
})
export class ConsultModule {}
