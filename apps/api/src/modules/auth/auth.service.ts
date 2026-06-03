import { Injectable, Logger } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { PrismaService } from '../../database/prisma.service';

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
  async syncUser(supabaseId: string, email: string, fullName: string) {
    let user = await this.prisma.user.findUnique({
      where: { supabaseId },
    });

    if (!user) {
      // Check if user exists by email (legacy migration case)
      user = await this.users.findByEmail(email);
      if (user) {
        // Link existing user to Supabase
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: { supabaseId },
        });
        this.logger.log(
          `Linked existing user ${email} to Supabase ID ${supabaseId}`,
        );
      } else {
        // Create new user
        user = await this.prisma.user.create({
          data: {
            email,
            fullName,
            supabaseId,
            role: 'FREE',
          },
        });
        this.logger.log(`Created new user ${email}`);
      }
    }

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
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
        `User ${userPayload.email} not found in DB. Auto-syncing...`,
      );
      const fallbackName =
        userPayload.fullName || userPayload.email.split('@')[0];
      const synced = await this.syncUser(
        supabaseId,
        userPayload.email,
        fallbackName,
      );
      return {
        id: synced.id,
        email: synced.email,
        fullName: synced.fullName,
        role: synced.role,
        avatarUrl: null,
        createdAt: new Date(),
      };
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
