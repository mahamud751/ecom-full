import { Global, Module } from "@nestjs/common";
import { PushService } from "./push.service";
import { DevicesController } from "./devices.controller";

@Global()
@Module({
  controllers: [DevicesController],
  providers: [PushService],
  exports: [PushService],
})
export class PushModule {}
