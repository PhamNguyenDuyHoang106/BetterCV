import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class ShareService {
  constructor(private prisma: PrismaService) {}

  async getByToken(token: string) {
    const link = await this.prisma.shareLink.findFirst({
      where: { token, isActive: true }
    });
    if (!link || (link.expiresAt && link.expiresAt < new Date())) {
      return { status: "inactive" };
    }
    return this.prisma.cv.findUnique({
      where: { id: link.cvId },
      include: { sections: true }
    });
  }
}
