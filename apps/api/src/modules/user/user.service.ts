import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async findBySupabaseId(supabaseId: string) {
    return this.prisma.user.findUnique({ where: { supabaseId } });
  }

  async createUser(data: {
    email: string;
    fullName: string;
    supabaseId?: string;
    role?: string;
  }) {
    return this.prisma.user.create({ data: data as any });
  }

  async updateUser(id: string, data: { fullName?: string; avatarUrl?: string }) {
    return this.prisma.user.update({ where: { id }, data });
  }
}
