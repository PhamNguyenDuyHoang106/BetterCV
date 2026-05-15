import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import * as bcrypt from "bcrypt";
import { createHash } from "crypto";
import { UserService } from "../user/user.service";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private config: ConfigService,
    private users: UserService,
    private prisma: PrismaService
  ) {}

  async register(data: { email: string; password: string; fullName: string }) {
    const existing = await this.users.findByEmail(data.email);
    if (existing) {
      throw new UnauthorizedException("Email already in use");
    }
    const passwordHash = await bcrypt.hash(data.password, 10);
    const user = await this.users.createUser({
      email: data.email,
      fullName: data.fullName,
      passwordHash
    });
    return this.issueTokens(user.id, user.email, user.role);
  }

  async login(email: string, password: string) {
    const user = await this.users.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
    }
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException("Invalid credentials");
    }
    return this.issueTokens(user.id, user.email, user.role);
  }

  async refresh(refreshToken: string) {
    const tokenHash = createHash("sha256").update(refreshToken).digest("hex");
    const stored = await this.prisma.refreshToken.findFirst({ where: { tokenHash } });
    if (!stored || stored.expiresAt < new Date()) {
      throw new UnauthorizedException("Invalid refresh token");
    }
    const user = await this.users.findById(stored.userId);
    if (!user) {
      throw new UnauthorizedException("User not found");
    }
    return this.issueTokens(user.id, user.email, user.role);
  }

  async logout(refreshToken: string) {
    const tokenHash = createHash("sha256").update(refreshToken).digest("hex");
    await this.prisma.refreshToken.deleteMany({ where: { tokenHash } });
    return { success: true };
  }

  async getProfile(userId: string) {
    const user = await this.users.findById(userId);
    if (!user) {
      throw new UnauthorizedException("User not found");
    }
    return { id: user.id, email: user.email, fullName: user.fullName, role: user.role };
  }

  private async issueTokens(userId: string, email: string, role: string) {
    const accessToken = await this.jwtService.signAsync({
      sub: userId,
      email,
      role
    });
    const refreshToken = await this.jwtService.signAsync(
      { sub: userId },
      {
        secret: this.config.get<string>("JWT_REFRESH_SECRET"),
        expiresIn: this.config.get<string>("JWT_REFRESH_TTL", "30d")
      }
    );
    const tokenHash = createHash("sha256").update(refreshToken).digest("hex");
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    await this.prisma.refreshToken.create({
      data: { tokenHash, userId, expiresAt }
    });
    return { accessToken, refreshToken };
  }
}
