import { Controller, Get, Param } from "@nestjs/common";
import { TemplateService } from "./template.service";

@Controller("templates")
export class TemplateController {
  constructor(private templateService: TemplateService) {}

  @Get()
  async list() {
    return this.templateService.list();
  }

  @Get(":id")
  async get(@Param("id") id: string) {
    return this.templateService.get(id);
  }
}
