import { Module } from "@nestjs/common";
import { SearchController } from "./search.controller";
import { SmartSearchService } from "./smart-search.service";
import { VisualMatchService } from "./visual-match.service";

@Module({
  controllers: [SearchController],
  providers: [SmartSearchService, VisualMatchService],
  exports: [SmartSearchService],
})
export class SearchModule {}
