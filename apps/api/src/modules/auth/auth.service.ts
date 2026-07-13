import { Injectable, Logger } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { PrismaService } from '../../database/prisma.service';
import { hashUser } from '../../core/utils/hash.util';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private users: UserService,
    private prisma: PrismaService,
  ) {}

  /**
   * Sync a Supabase-authenticated user to the local database.
   * Called after Supabase Auth sign-up/sign-in to ensure the user
   * record exists in our Prisma DB with role and profile data.
   */
  async syncUser(
    supabaseId: string,
    email: string,
    fullName: string,
    avatarUrl?: string,
  ) {
    let user = await this.prisma.user.findUnique({
      where: { supabaseId },
    });

    const finalAvatar = avatarUrl || generateDefaultAvatar(fullName, email);

    if (!user) {
      // Check if user exists by email (legacy migration case)
      user = await this.users.findByEmail(email);
      if (user) {
        // Link existing user to Supabase
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: {
            supabaseId,
            fullName,
            avatarUrl: user.avatarUrl || finalAvatar,
          },
        });
        this.logger.log(
          `Linked existing user [hash:${hashUser(supabaseId).substring(0, 8)}] to Supabase account`,
        );
      } else {
        // Create new user
        user = await this.prisma.user.create({
          data: {
            email,
            fullName,
            supabaseId,
            role: 'FREE',
            avatarUrl: finalAvatar,
          },
        });
        this.logger.log(
          `Created new user [hash:${hashUser(supabaseId).substring(0, 8)}]`,
        );
      }
    } else {
      // Update existing user's data if changed
      const updateData: { fullName?: string; avatarUrl?: string } = {};
      if (fullName && fullName !== user.fullName) {
        updateData.fullName = fullName;
      }

      if (!user.avatarUrl) {
        updateData.avatarUrl = finalAvatar;
      } else if (avatarUrl && avatarUrl !== user.avatarUrl) {
        updateData.avatarUrl = avatarUrl;
      } else if (
        fullName &&
        fullName !== user.fullName &&
        user.avatarUrl.includes('ui-avatars.com')
      ) {
        updateData.avatarUrl = generateDefaultAvatar(fullName, email);
      }

      if (Object.keys(updateData).length > 0) {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: updateData,
        });
        this.logger.log(
          `Updated profile info for user [hash:${hashUser(supabaseId).substring(0, 8)}]`,
        );
      }
    }

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      avatarUrl: user.avatarUrl,
    };
  }

  /**
   * Get user profile from local DB using Supabase ID.
   * Auto-syncs the user record if it doesn't exist yet.
   */
  async getProfile(userPayload: {
    sub: string;
    email: string;
    fullName?: string;
    avatarUrl?: string | null;
  }) {
    const supabaseId = userPayload.sub;
    const user = await this.prisma.user.findUnique({
      where: { supabaseId },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        avatarUrl: true,
        createdAt: true,
      },
    });

    if (!user) {
      this.logger.log(
        `User [hash:${hashUser(supabaseId).substring(0, 8)}] not found in DB. Auto-syncing...`,
      );
      const fallbackName =
        userPayload.fullName || userPayload.email.split('@')[0];
      const synced = await this.syncUser(
        supabaseId,
        userPayload.email,
        fallbackName,
        userPayload.avatarUrl || undefined,
      );
      return {
        id: synced.id,
        email: synced.email,
        fullName: synced.fullName,
        role: synced.role,
        avatarUrl: synced.avatarUrl,
        createdAt: new Date(),
      };
    }

    // Sync name if it changed in Supabase (e.g. user registered or updated their name)
    if (userPayload.fullName && userPayload.fullName !== user.fullName) {
      const updatedUser = await this.prisma.user.update({
        where: { id: user.id },
        data: { fullName: userPayload.fullName },
      });
      user.fullName = updatedUser.fullName;
    }

    // Auto-populate avatar if missing
    if (!user.avatarUrl) {
      const generatedAvatar =
        userPayload.avatarUrl ||
        generateDefaultAvatar(user.fullName, user.email);
      const updatedUser = await this.prisma.user.update({
        where: { id: user.id },
        data: { avatarUrl: generatedAvatar },
      });
      user.avatarUrl = updatedUser.avatarUrl;
    }

    // PREMIUM users are lifetime — never auto-downgrade them
    if (user.role === 'PREMIUM') {
      return user;
    }

    if (user.role === 'PRO') {
      const dbUserWithSubs = await this.prisma.user.findUnique({
        where: { id: user.id },
        include: {
          subscriptions: {
            include: { plan: true },
          },
        },
      });

      if (dbUserWithSubs) {
        const activeProSub = dbUserWithSubs.subscriptions.find(
          (sub) =>
            sub.plan.tier === 'PRO' &&
            ['active', 'trialing'].includes(sub.status) &&
            (!sub.currentPeriodEnd || sub.currentPeriodEnd > new Date()),
        );

        if (!activeProSub) {
          // Downgrade to FREE
          await this.prisma.user.update({
            where: { id: user.id },
            data: { role: 'FREE' },
          });
          user.role = 'FREE';
        }
      }
    }

    return user;
  }
}

// ─── Helper functions for generating deterministic default avatars ─────────────

function toAscii(str: string): string {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
}

function deterministicColor(email: string): string {
  const BG_PALETTE = [
    '1a73e8', // Google Blue
    '0f9d58', // Google Green
    'db4437', // Google Red
    'f4b400', // Google Yellow
    '9334e6', // Purple
    'e8710a', // Orange
    '00897b', // Teal
    'd81b60', // Pink
    '5e35b1', // Deep Purple
    '00acc1', // Cyan
    '43a047', // Medium Green
    'f06292', // Light Pink
    '8d6e63', // Brown
    '546e7a', // Blue Grey
    'e53935', // Red 600
    '039be5', // Light Blue
    '7cb342', // Light Green
    'fb8c00', // Orange 600
    '6d4c41', // Brown 600
    '3949ab', // Indigo
  ];
  let hash = 0;
  for (let i = 0; i < email.length; i++) {
    hash = (hash * 31 + email.charCodeAt(i)) | 0;
  }
  return BG_PALETTE[Math.abs(hash) % BG_PALETTE.length];
}

function generateDefaultAvatar(fullName: string, email: string): string {
  const asciiName = toAscii(fullName || 'User');
  const bg = deterministicColor(email || 'user@example.com');
  const firstWord = asciiName.trim().split(/\s+/)[0] || asciiName;

  const params = new URLSearchParams({
    name: firstWord,
    background: bg,
    color: 'fff',
    size: '256',
    bold: 'true',
    rounded: 'true',
    format: 'png',
    length: '1',
  });

  return `https://ui-avatars.com/api/?${params.toString()}`;
}
