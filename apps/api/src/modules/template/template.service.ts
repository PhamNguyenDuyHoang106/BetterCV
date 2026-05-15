import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class TemplateService {
  constructor(private prisma: PrismaService) {}

  async list() {
    return this.prisma.template.findMany({
      where: { isActive: true },
      include: { category: true }
    });
  }

  async get(id: string) {
    return this.prisma.template.findUnique({
      where: { id },
      include: { category: true }
    });
  }
}
