import { Injectable, NotFoundException, ForbiddenException, BadRequestException, HttpException, HttpStatus, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AiService } from '../ai/ai.service';
import { Response } from 'express';
import { CareerCoachRole } from '@prisma/client';
import { RedisService } from '../../database/redis/redis.service';
import { Logger } from 'nestjs-pino';

interface SafetyRule {
  name: string;
  pattern: RegExp;
}

@Injectable()
export class CareerCoachService implements OnModuleInit, OnModuleDestroy {
  private localCache = new Map<string, { value: string; expiresAt: number }>();
  private pruneTimer?: NodeJS.Timeout;

  private readonly SAFETY_RULES: SafetyRule[] = [
    {
      name: 'ignore_instructions',
      pattern: /(?:you\s+must\s+|must\s+now\s+|from\s+now\s+on\s+)?ignore\s+(?:all\s+)?(?:previous\s+|your\s+)?instructions?/i,
    },
    {
      name: 'disregard_instructions',
      pattern: /(?:you\s+must\s+|must\s+now\s+|from\s+now\s+on\s+)?disregard\s+(?:all\s+)?(?:previous\s+|your\s+)?instructions?/i,
    },
    {
      name: 'reveal_prompt',
      pattern: /(?:reveal|show|print|output)\s+(?:your\s+)?(?:hidden|system|original)\s+prompt/i,
    },
    {
      name: 'act_as_chatgpt',
      pattern: /(?:you\s+must\s+|must\s+now\s+|from\s+now\s+on\s+)(?:act|behave|pretend)\s+as\s+(?:gpt|chatgpt|openai|claude|an?\s+ai)/i,
    },
    {
      name: 'jailbreak',
      pattern: /(?:jailbreak\s+(?:mode|prompt|instructions|this\s+system)|bypass\s+(?:your\s+)?safety)/i,
    },
    {
      name: 'developer_mode',
      pattern: /(?:enable|enter|activate|turn\s+on)\s+developer\s+mode/i,
    },
    {
      name: 'forget_rules',
      pattern: /(?:forget|ignore|disregard)\s+(?:all\s+)?(?:previous\s+)?(?:instructions|rules|constraints)/i,
    },
    {
      name: 'freed_constraints',
      pattern: /you\s+are\s+now\s+(?:freed?|unrestricted|unfiltered)/i,
    },
  ];

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
    private readonly redisService: RedisService,
    private readonly logger: Logger,
  ) {}

  onModuleInit() {
    this.pruneTimer = setInterval(() => this.pruneExpiredLocalCache(), 60000);
  }

  onModuleDestroy() {
    if (this.pruneTimer) {
      clearInterval(this.pruneTimer);
    }
  }

  private pruneExpiredLocalCache() {
    const now = Date.now();
    let prunedCount = 0;
    for (const [key, item] of this.localCache.entries()) {
      if (now > item.expiresAt) {
        this.localCache.delete(key);
        prunedCount++;
      }
    }
    if (prunedCount > 0) {
      this.logger.debug(`Pruned ${prunedCount} expired local cache entries.`);
    }
  }

  /**
   * Resolves the session, persists the user message transactionally, builds context,
   * retrieves past messages history, streams the AI response, and persists it transactionally on success.
   */
  async streamCoachChat(
    supabaseId: string,
    dto: { roadmapId: string; sessionId?: string; messages: Array<{ role: string; content: string }>; locale?: string },
    res: Response,
  ) {
    // 1. Resolve user ID
    const user = await this.prisma.user.findUnique({
      where: { supabaseId },
      select: { id: true },
    });
    if (!user) throw new NotFoundException('User not found');

    // 2. Fetch roadmap with relations
    const roadmap = await this.prisma.careerRoadmap.findFirst({
      where: { id: dto.roadmapId, userId: user.id },
      include: {
        atsScan: {
          include: {
            cv: {
              include: {
                sections: true,
              },
            },
          },
        },
        phases: {
          orderBy: { phaseIndex: 'asc' },
          include: {
            skills: {
              orderBy: { order: 'asc' },
              include: { skill: true },
            },
          },
        },
        skillGaps: {
          include: { skill: true },
        },
      },
    });
    if (!roadmap) throw new NotFoundException('Career Roadmap not found');

    // 3. Resolve session thread or auto-create one
    const session = await this.resolveSession(user.id, roadmap.id, dto.sessionId);

    // 4. Validate user message
    const userMessage = dto.messages[dto.messages.length - 1];
    if (!userMessage || userMessage.role !== 'user') {
      throw new BadRequestException('Invalid chat history: last message must be from user');
    }

    // 4b. Heuristic prompt injection guard (Phase 5B Rule Engine)
    const matchedRule = this.getMatchedSafetyRule(userMessage.content);
    if (matchedRule) {
      this.logger.warn({
        event: 'coach_safety_block',
        userId: user.id,
        roadmapId: dto.roadmapId,
        sessionId: session.id,
        rule: matchedRule.name,
      });

      res.status(200);
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.write(
        "I'm here to help with your career and learning journey. " +
        "I can't process that type of request, but feel free to ask about " +
        "your roadmap, learning resources, or CV improvement tips!"
      );
      res.end();
      return;
    }

    // 5. Auto-title only once if thread is new
    let nextTitle: string | undefined = undefined;
    if (session.messageCount === 0 && session.title === 'General Career Coaching') {
      const firstMsgText = userMessage.content.trim();
      const cleaned = firstMsgText.replace(/[\s\r\n\t]+/g, ' ').replace(/[#*`_~[\]()\-]/g, '');
      const sliced = cleaned.substring(0, 30).trim();
      nextTitle = sliced.length < cleaned.length ? `${sliced}...` : sliced;
      if (!nextTitle) nextTitle = 'General Career Coaching';
    }

    // 6. Transactional user message create + counter increment + lastMessageAt update
    await this.prisma.$transaction(async (tx) => {
      await tx.careerCoachMessage.create({
        data: {
          sessionId: session.id,
          role: CareerCoachRole.USER,
          content: userMessage.content,
        },
      });

      await tx.careerCoachSession.update({
        where: { id: session.id },
        data: {
          messageCount: { increment: 1 },
          lastMessageAt: new Date(),
          ...(nextTitle ? { title: nextTitle } : {}),
        },
      });
    });

    // Invalidate cache immediately on new message (Phase 5A)
    await this.clearCoachCache(user.id, dto.roadmapId);

    // 7. Load past N messages for AI context history (MAX_HISTORY = 10)
    const MAX_HISTORY = 10;
    const dbMessages = await this.prisma.careerCoachMessage.findMany({
      where: { sessionId: session.id },
      orderBy: { createdAt: 'desc' },
      take: MAX_HISTORY,
    });
    // Reverse because we queried desc
    const historyMessages = dbMessages
      .reverse()
      .map((m) => ({ role: m.role.toLowerCase(), content: m.content }));

    // 8. Format CV and Roadmap context
    const cv = roadmap.atsScan?.cv;
    const cvContext = this.formatCvToText(cv?.sections || []);
    const baseRoadmapContext = this.formatRoadmapToText(roadmap);
    const locale = dto.locale || cv?.locale || 'vi';
    console.log(`[CareerCoachService.streamCoachChat] dto.locale=${dto.locale}, cv.locale=${cv?.locale}, resolved=${locale}`);

    // 8a. Personalization injection (Phase 4D)
    const personalizationCtx = await this.buildPersonalizationContext(user.id, dto.roadmapId);
    const roadmapContext = personalizationCtx
      ? `${baseRoadmapContext}\n\n${personalizationCtx}`
      : baseRoadmapContext;

    res.setHeader('X-Session-Id', session.id);

    const startTime = Date.now();
    let isSuccess = false;

    try {
      // 9. Invoke AI Streaming (now returns the full text)
      const assistantText = await this.aiService.streamCoachChat({
        supabaseId,
        cvContext,
        roadmapContext,
        messages: historyMessages,
        locale,
        res,
      });

      // 10. Transactional assistant message create + counter increment + lastMessageAt update
      await this.prisma.$transaction(async (tx) => {
        await tx.careerCoachMessage.create({
          data: {
            sessionId: session.id,
            role: CareerCoachRole.ASSISTANT,
            content: assistantText,
          },
        });

        await tx.careerCoachSession.update({
          where: { id: session.id },
          data: {
            messageCount: { increment: 1 },
            lastMessageAt: new Date(),
          },
        });
      });
      isSuccess = true;
    } catch (err) {
      // Stream failed or disconnected, do not save assistant response
      throw err;
    } finally {
      const latencyMs = Date.now() - startTime;
      this.logger.log({
        event: 'coach_chat_completed',
        userId: user.id,
        roadmapId: dto.roadmapId,
        sessionId: session.id,
        latencyMs,
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        success: isSuccess,
      });
    }
  }

  /**
   * Creates a new session thread explicitly.
   */
  async createNewSession(supabaseId: string, dto: { roadmapId: string; title?: string }) {
    const user = await this.prisma.user.findUnique({
      where: { supabaseId },
      select: { id: true },
    });
    if (!user) throw new NotFoundException('User not found');

    const session = await this.prisma.careerCoachSession.create({
      data: {
        roadmapId: dto.roadmapId,
        userId: user.id,
        title: dto.title?.trim() || 'General Career Coaching',
        archived: false,
      },
    });

    return session;
  }

  /**
   * Renames a thread title.
   */
  async renameSession(supabaseId: string, sessionId: string, title: string) {
    const user = await this.prisma.user.findUnique({
      where: { supabaseId },
      select: { id: true },
    });
    if (!user) throw new NotFoundException('User not found');

    const session = await this.prisma.careerCoachSession.findFirst({
      where: { id: sessionId, userId: user.id },
    });
    if (!session) throw new NotFoundException('Session not found or access denied');

    const updated = await this.prisma.careerCoachSession.update({
      where: { id: sessionId },
      data: { title: title.trim() || 'General Career Coaching' },
    });

    return updated;
  }

  /**
   * Resolves an existing session or auto-creates a default session for the user.
   */
  async resolveSession(userId: string, roadmapId: string, sessionId?: string) {
    if (sessionId) {
      const session = await this.prisma.careerCoachSession.findFirst({
        where: { id: sessionId, userId, roadmapId, archived: false },
      });
      if (!session) throw new NotFoundException('Career Coach Session not found');
      return session;
    }

    // Try to find the latest active session sorted by lastMessageAt or updatedAt
    const latestSession = await this.prisma.careerCoachSession.findFirst({
      where: { roadmapId, userId, archived: false },
      orderBy: { lastMessageAt: 'desc' },
    });

    if (latestSession) {
      return latestSession;
    }

    // Auto-create a default session
    return this.prisma.careerCoachSession.create({
      data: {
        roadmapId,
        userId,
        title: 'General Career Coaching',
        archived: false,
      },
    });
  }

  /**
   * Lists all non-archived sessions for a roadmap, including their last 50 messages.
   */
  async listSessions(supabaseId: string, roadmapId: string) {
    const user = await this.prisma.user.findUnique({
      where: { supabaseId },
      select: { id: true },
    });
    if (!user) throw new NotFoundException('User not found');

    const sessions = await this.prisma.careerCoachSession.findMany({
      where: { roadmapId, userId: user.id, archived: false },
      orderBy: [
        { lastMessageAt: 'desc' },
        { updatedAt: 'desc' }
      ],
      include: {
        messages: {
          orderBy: [
            { createdAt: 'desc' },
            { id: 'desc' }
          ],
          take: 50,
        },
      },
    });

    return {
      sessions: sessions.map((session) => ({
        ...session,
        messages: session.messages.reverse(),
      })),
    };
  }

  /**
   * Paginate older messages of a session thread using keyset-based timestamp.
   */
  async getSessionMessages(supabaseId: string, sessionId: string, beforeTimestamp?: string) {
    const user = await this.prisma.user.findUnique({
      where: { supabaseId },
      select: { id: true },
    });
    if (!user) throw new NotFoundException('User not found');

    const session = await this.prisma.careerCoachSession.findFirst({
      where: { id: sessionId, userId: user.id },
    });
    if (!session) throw new NotFoundException('Session not found or access denied');

    const messages = await this.prisma.careerCoachMessage.findMany({
      where: {
        sessionId,
        ...(beforeTimestamp ? { createdAt: { lt: new Date(beforeTimestamp) } } : {}),
      },
      orderBy: [
        { createdAt: 'desc' },
        { id: 'desc' }
      ],
      take: 50,
    });

    return {
      messages: messages.reverse(),
    };
  }

  /**
   * Search message content across all conversation threads in a roadmap.
   * Returns snippets matching keyword query.
   */
  async searchMessages(supabaseId: string, roadmapId: string, query: string) {
    const user = await this.prisma.user.findUnique({
      where: { supabaseId },
      select: { id: true },
    });
    if (!user) throw new NotFoundException('User not found');

    const keyword = query.trim().replace(/[%_]/g, '');
    if (keyword.length < 2) {
      throw new BadRequestException('Search query keyword must be at least 2 characters long');
    }

    const matchedMessages = await this.prisma.careerCoachMessage.findMany({
      where: {
        content: { contains: keyword, mode: 'insensitive' },
        session: {
          roadmapId,
          userId: user.id,
          archived: false,
        },
      },
      include: {
        session: {
          select: { id: true, title: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    const results = matchedMessages.map((msg) => {
      const content = msg.content;
      const index = content.toLowerCase().indexOf(keyword.toLowerCase());
      
      const start = Math.max(0, index - 50);
      const end = Math.min(content.length, index + keyword.length + 50);
      
      let snippet = content.substring(start, end);
      if (start > 0) snippet = '...' + snippet;
      if (end < content.length) snippet = snippet + '...';

      return {
        sessionId: msg.session.id,
        sessionTitle: msg.session.title,
        messageId: msg.id,
        snippet,
        createdAt: msg.createdAt,
      };
    });

    return { results };
  }

  /**
   * Soft-archives a session via archived = true.
   */
  async archiveSession(supabaseId: string, sessionId: string) {
    const user = await this.prisma.user.findUnique({
      where: { supabaseId },
      select: { id: true },
    });
    if (!user) throw new NotFoundException('User not found');

    const session = await this.prisma.careerCoachSession.findFirst({
      where: { id: sessionId, userId: user.id },
    });
    if (!session) throw new NotFoundException('Session not found or access denied');

    await this.prisma.careerCoachSession.update({
      where: { id: sessionId },
      data: { archived: true },
    });

    return { success: true };
  }

  /**
   * Converts CV sections JSON data to structured text.
   */
  private formatCvToText(sections: any[]): string {
    const lines: string[] = [];

    const skillSec = sections.find((s: any) => s.type === 'SKILLS');
    if (skillSec?.content) {
      const items = Array.isArray(skillSec.content.items)
        ? skillSec.content.items
        : Array.isArray(skillSec.content)
          ? skillSec.content
          : [];
      const names = items
        .map((i: any) => `${i.name || ''} (${i.level || 'Intermediate'})`)
        .filter(Boolean);
      if (names.length > 0) {
        lines.push(`Skills listed in CV: ${names.join(', ')}`);
      }
    }

    const expSec = sections.find((s: any) => s.type === 'EXPERIENCE');
    if (expSec?.content) {
      const items = Array.isArray(expSec.content.items)
        ? expSec.content.items
        : Array.isArray(expSec.content)
          ? expSec.content
          : [];
      if (items.length > 0) {
        lines.push('\nWork Experience History:');
        items.slice(0, 5).forEach((item: any) => {
          lines.push(`- Role: ${item.role || 'Developer'} at ${item.company || 'Company'}`);
          if (item.description) {
            lines.push(`  Achievements/Duties: ${item.description}`);
          }
        });
      }
    }

    const eduSec = sections.find((s: any) => s.type === 'EDUCATION');
    if (eduSec?.content) {
      const items = Array.isArray(eduSec.content.items)
        ? eduSec.content.items
        : Array.isArray(eduSec.content)
          ? eduSec.content
          : [];
      if (items.length > 0) {
        lines.push('\nEducation:');
        items.slice(0, 3).forEach((item: any) => {
          lines.push(`- Degree: ${item.degree || 'Degree'} in ${item.field || 'Field'} from ${item.institution || 'University'}`);
        });
      }
    }

    const projSec = sections.find((s: any) => s.type === 'PROJECTS');
    if (projSec?.content) {
      const items = Array.isArray(projSec.content.items)
        ? projSec.content.items
        : Array.isArray(projSec.content)
          ? projSec.content
          : [];
      if (items.length > 0) {
        lines.push('\nProjects Worked On:');
        items.slice(0, 4).forEach((item: any) => {
          lines.push(`- Project: ${item.name || 'Project'} (Role: ${item.role || 'Contributor'})`);
          if (item.description) {
            lines.push(`  Description: ${item.description}`);
          }
        });
      }
    }

    return lines.join('\n');
  }

  /**
   * Converts Roadmap data to structured text with safety bounds.
   */
  private formatRoadmapToText(roadmap: any): string {
    const lines: string[] = [];
    lines.push(`Target Career Goal: ${roadmap.targetRole}`);
    lines.push(`Current Career Role: ${roadmap.currentRole}`);
    if (roadmap.explanation) {
      lines.push(`Roadmap Overview: ${roadmap.explanation}`);
    }

    const gaps = (roadmap.skillGaps || []).map(
      (g: any) => `- ${g.skill?.name || ''} (Priority: ${g.priority || 'MEDIUM'}, ATS Impact: +${g.estimatedImpact || 1} points)`
    );
    if (gaps.length > 0) {
      lines.push('\nIdentified Skill Gaps:');
      lines.push(gaps.join('\n'));
    }

    if (roadmap.phases && roadmap.phases.length > 0) {
      lines.push('\nLearning Path Phases:');
      roadmap.phases.slice(0, 10).forEach((phase: any) => {
        const skills = (phase.skills || [])
          .slice(0, 8)
          .map((s: any) => s.skill?.name || '')
          .filter(Boolean);
        lines.push(`- Phase ${phase.phaseIndex + 1}: ${phase.phaseName} (Skills to acquire: ${skills.join(', ')})`);
      });
    }

    return lines.join('\n');
  }

  /**
   * Generates coaching insights, keyword matching, and 7-day timeline stats.
   */
  async getCoachAnalytics(supabaseId: string, roadmapId: string) {
    const user = await this.prisma.user.findUnique({
      where: { supabaseId },
      select: { id: true },
    });
    if (!user) throw new NotFoundException('User not found');

    const cacheKey = `coach:${this.CACHE_VERSION}:analytics:${user.id}:${roadmapId}`;
    const cached = await this.getCache(cacheKey);
    if (cached !== null) {
      try {
        return JSON.parse(cached);
      } catch (err: any) {
        this.logger.warn(`Failed to parse cached analytics: ${err.message}`);
      }
    }

    const roadmap = await this.prisma.careerRoadmap.findFirst({
      where: { id: roadmapId, userId: user.id },
      include: {
        phases: {
          orderBy: { phaseIndex: 'asc' },
          include: {
            skills: {
              include: { skill: true },
            },
          },
        },
      },
    });
    if (!roadmap) throw new NotFoundException('Career Roadmap not found');

    // 1. KPI Aggregations (Separate Query 1)
    const sessions = await this.prisma.careerCoachSession.findMany({
      where: { roadmapId, userId: user.id, archived: false },
      select: { id: true, title: true, messageCount: true, lastMessageAt: true },
    });

    const totalSessions = sessions.length;
    const totalMessages = sessions.reduce((acc, s) => acc + s.messageCount, 0);
    const averageMessagesPerSession = totalSessions > 0
      ? Number((totalMessages / totalSessions).toFixed(1))
      : 0;

    let mostActiveSession = undefined;
    if (sessions.length > 0) {
      const sortedByCount = [...sessions].sort((a, b) => b.messageCount - a.messageCount);
      if (sortedByCount[0].messageCount > 0) {
        mostActiveSession = {
          id: sortedByCount[0].id,
          title: sortedByCount[0].title,
          messageCount: sortedByCount[0].messageCount,
        };
      }
    }

    const lastInteractionAt = sessions.length > 0
      ? sessions
          .map(s => s.lastMessageAt)
          .filter((d): d is Date => d !== null)
          .reduce((max, d) => (d > max ? d : max), new Date(0))
      : undefined;

    // 2. Text Analysis (Separate Query 2)
    const messages = await this.prisma.careerCoachMessage.findMany({
      where: { session: { roadmapId, userId: user.id, archived: false } },
      select: { content: true },
    });

    const allText = messages.map(m => m.content).join(' ');

    // 3. Topic & Skill Mentions
    const skillList: string[] = [];
    const skillMap = new Map<string, string>(); // Skill ID -> Skill Name
    const skillToPhaseIndex = new Map<string, number>(); // Skill Name -> Phase Index
    roadmap.phases.forEach(p => {
      p.skills.forEach(ps => {
        if (ps.skill.name) {
          skillList.push(ps.skill.name);
          skillMap.set(ps.skill.id, ps.skill.name);
          skillToPhaseIndex.set(ps.skill.name, p.phaseIndex);
        }
      });
    });

    const escapeRegExp = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const createSkillRegex = (skill: string) => {
      const escaped = escapeRegExp(skill);
      return new RegExp(`(^|[^a-zA-Z0-9])${escaped}([^a-zA-Z0-9]|$)`, 'gi');
    };

    const skillCounts: Array<{ skill: string; count: number }> = [];
    skillList.forEach(skillName => {
      const regex = createSkillRegex(skillName);
      const matches = allText.match(regex);
      const count = matches ? matches.length : 0;
      if (count > 0) {
        skillCounts.push({ skill: skillName, count });
      }
    });

    // Sort deterministic: by count desc, then alphabetically by skill name
    const topSkills = skillCounts
      .sort((a, b) => {
        if (b.count !== a.count) return b.count - a.count;
        return a.skill.localeCompare(b.skill);
      })
      .slice(0, 5);

    // 4. Roadmap-aware Phase Mentions
    const phaseCounts = new Map<number, number>();
    roadmap.phases.forEach(p => {
      phaseCounts.set(p.phaseIndex, 0);
    });

    const phaseRegex = /(?:phase|giai\s*đoạn)\s*(\d+)/gi;
    let match;
    while ((match = phaseRegex.exec(allText)) !== null) {
      const num = parseInt(match[1], 10);
      // Map Phase 1 to phaseIndex 0, Phase 2 to phaseIndex 1, etc.
      const phaseIndex = num - 1;
      if (phaseCounts.has(phaseIndex)) {
        phaseCounts.set(phaseIndex, (phaseCounts.get(phaseIndex) || 0) + 1);
      }
    }

    const topPhases = Array.from(phaseCounts.entries())
      .map(([phaseIndex, count]) => ({ phaseIndex, count }))
      .filter(p => p.count > 0)
      .sort((a, b) => b.count - a.count);

    // 5. Deterministic 7-day Timeline (Separate Query 3)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6); // past 6 days + today = 7 days
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const timelineMessages = await this.prisma.careerCoachMessage.findMany({
      where: {
        session: { roadmapId, userId: user.id, archived: false },
        createdAt: { gte: sevenDaysAgo },
      },
      select: { createdAt: true },
    });

    const getLocalDateString = (date: Date) => {
      return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' }).format(date);
    };

    const dateCounts = new Map<string, number>();
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - 6 + i);
      dateCounts.set(getLocalDateString(d), 0);
    }

    timelineMessages.forEach(msg => {
      const dateStr = getLocalDateString(msg.createdAt);
      if (dateCounts.has(dateStr)) {
        dateCounts.set(dateStr, (dateCounts.get(dateStr) || 0) + 1);
      }
    });

    const timeline = Array.from(dateCounts.entries()).map(([date, count]) => ({
      date,
      count,
    }));

    // 6. User CV check for suggestions
    const cv = await this.prisma.cv.findFirst({
      where: { userId: user.id },
      include: { sections: true },
      orderBy: { updatedAt: 'desc' },
    });

    const userCvSkills = new Set<string>();
    if (cv) {
      const skillSec = cv.sections.find((s) => s.type === 'SKILLS');
      if (skillSec?.content) {
        const contentAny = skillSec.content as any;
        const items = Array.isArray(contentAny.items)
          ? contentAny.items
          : Array.isArray(contentAny)
            ? contentAny
            : [];
        items.forEach((item: any) => {
          if (item.name) userCvSkills.add(item.name.toLowerCase().trim());
        });
      }
    }

    const suggestions = this.generateLearningSuggestions(
      skillCounts,
      skillToPhaseIndex,
      userCvSkills,
      roadmap.phases
    );

    const resultObj = {
      kpis: {
        totalSessions,
        totalMessages,
        averageMessagesPerSession,
        mostActiveSession,
        lastInteractionAt: lastInteractionAt && lastInteractionAt.getTime() > 0 ? lastInteractionAt.toISOString() : undefined,
      },
      topSkills,
      topPhases,
      timeline,
      suggestions,
    };

    await this.setCache(cacheKey, JSON.stringify(resultObj), 300); // 300s = 5 minutes
    return resultObj;
  }

  /**
   * Suggestion Engine v1. Generates rule-based suggestion items.
   */
  private generateLearningSuggestions(
    skillCounts: Array<{ skill: string; count: number }>,
    skillToPhaseIndex: Map<string, number>,
    userCvSkills: Set<string>,
    phases: any[]
  ): Array<{ type: 'learning_focus' | 'prerequisite'; skill?: string; message: string }> {
    const suggestions: Array<{ type: 'learning_focus' | 'prerequisite'; skill?: string; message: string }> = [];

    // Rule 1: Learning Focus
    // Find roadmap skills highly discussed (count >= 2) but not in user's CV
    const focusSkills = skillCounts
      .filter(sc => sc.count >= 2 && !userCvSkills.has(sc.skill.toLowerCase().trim()))
      .sort((a, b) => b.count - a.count);

    if (focusSkills.length > 0) {
      const targetSkill = focusSkills[0].skill;
      suggestions.push({
        type: 'learning_focus',
        skill: targetSkill,
        message: `You've been asking a lot about "${targetSkill}". Consider starting learning resources or tasks for it in your Roadmap!`,
      });
    }

    // Rule 2: Prerequisites
    // If the user discussed advanced Phase 2+ skills, check if Phase 1 skills are missing from the CV
    const discussedAdvancedSkills = skillCounts.filter(sc => {
      const phaseIdx = skillToPhaseIndex.get(sc.skill);
      return phaseIdx !== undefined && phaseIdx > 0;
    });

    if (discussedAdvancedSkills.length > 0) {
      // Find missing skills in Phase 1 (phaseIndex === 0)
      const phase1 = phases.find(p => p.phaseIndex === 0);
      if (phase1) {
        const missingPhase1Skills = phase1.skills
          .map((ps: any) => ps.skill.name)
          .filter((name: string) => name && !userCvSkills.has(name.toLowerCase().trim()));

        if (missingPhase1Skills.length > 0) {
          suggestions.push({
            type: 'prerequisite',
            message: `It seems you are preparing for advanced stages, but Phase 1 foundational skills like "${missingPhase1Skills.slice(0, 2).join(', ')}" are not yet in your CV. Focus on Phase 1 prerequisites first!`,
          });
        }
      }
    }

    return suggestions;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Phase 4D: Safety Guardrails & Personalization Helpers
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Heuristic prompt injection detection (deploys SAFETY_RULES engine).
   */
  private isPotentialInjection(message: string): boolean {
    return !!this.getMatchedSafetyRule(message);
  }

  private getMatchedSafetyRule(message: string): SafetyRule | null {
    const SAFE_EXCEPTIONS = [
      /linux\s+system\s+prompt/i,
      /system\s+design/i,
      /how\s+does\s+(?:the\s+)?system/i,
      /prompt\s+engineering/i,
    ];

    // Allow safe technical phrases first (false-positive reduction)
    if (SAFE_EXCEPTIONS.some((re) => re.test(message))) {
      return null;
    }

    const matched = this.SAFETY_RULES.find((rule) => rule.pattern.test(message));
    return matched || null;
  }

  /**
   * Lightweight personalization context builder for LLM prompts.
   *
   * Deliberately separate from getCoachAnalytics() to avoid executing
   * expensive full analytics (timeline, KPIs, phase analysis) on every message.
   * Fetches only Top 3 discussed skills and Top 2 learning suggestions.
   */
  private async buildPersonalizationContext(
    userId: string,
    roadmapId: string,
  ): Promise<string> {
    const cacheKey = `coach:${this.CACHE_VERSION}:personalization:${userId}:${roadmapId}`;
    const cached = await this.getCache(cacheKey);
    if (cached !== null) {
      return cached;
    }

    try {
      // Fetch roadmap skills
      const roadmap = await this.prisma.careerRoadmap.findFirst({
        where: { id: roadmapId, userId },
        include: {
          phases: {
            orderBy: { phaseIndex: 'asc' },
            include: { skills: { include: { skill: true } } },
          },
        },
      });
      if (!roadmap) return '';

      // Collect all message content for this roadmap
      const messages = await this.prisma.careerCoachMessage.findMany({
        where: { session: { roadmapId, userId, archived: false } },
        select: { content: true },
      });
      if (messages.length === 0) return '';

      const allText = messages.map((m) => m.content).join(' ');

      // Build skill list and score mentions
      const escapeRegExp = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const createSkillRegex = (skill: string) => {
        const escaped = escapeRegExp(skill);
        return new RegExp(`(^|[^a-zA-Z0-9])${escaped}([^a-zA-Z0-9]|$)`, 'gi');
      };

      const skillToPhaseIndex = new Map<string, number>();
      const skillList: string[] = [];
      roadmap.phases.forEach((p) => {
        p.skills.forEach((ps) => {
          if (ps.skill.name) {
            skillList.push(ps.skill.name);
            skillToPhaseIndex.set(ps.skill.name, p.phaseIndex);
          }
        });
      });

      const skillCounts: Array<{ skill: string; count: number }> = [];
      skillList.forEach((skillName) => {
        const regex = createSkillRegex(skillName);
        const matches = allText.match(regex);
        const count = matches ? matches.length : 0;
        if (count > 0) skillCounts.push({ skill: skillName, count });
      });

      const TOP_SKILLS = 3;
      const topSkills = skillCounts
        .sort((a, b) => (b.count !== a.count ? b.count - a.count : a.skill.localeCompare(b.skill)))
        .slice(0, TOP_SKILLS);

      if (topSkills.length === 0) return '';

      // Fetch user CV skills for suggestions
      const cv = await this.prisma.cv.findFirst({
        where: { userId },
        include: { sections: true },
        orderBy: { updatedAt: 'desc' },
      });
      const userCvSkills = new Set<string>();
      if (cv) {
        const skillSec = cv.sections.find((s) => s.type === 'SKILLS');
        if (skillSec?.content) {
          const contentAny = skillSec.content as any;
          const items = Array.isArray(contentAny.items)
            ? contentAny.items
            : Array.isArray(contentAny)
            ? contentAny
            : [];
          items.forEach((item: any) => {
            if (item.name) userCvSkills.add(item.name.toLowerCase().trim());
          });
        }
      }

      const TOP_SUGGESTIONS = 2;
      const allSuggestions = this.generateLearningSuggestions(
        skillCounts,
        skillToPhaseIndex,
        userCvSkills,
        roadmap.phases,
      );
      const topSuggestions = allSuggestions.slice(0, TOP_SUGGESTIONS);

      // Format into compact LLM prompt block
      const skillNames = topSkills.map((s) => s.skill).join(', ');
      const suggestionLines = topSuggestions
        .map((s) => `  * ${s.message}`)
        .join('\n');

      const lines = [
        'User learning profile (use only to personalize advice, do not override the current question):',
        `- Frequently discussed: ${skillNames}`,
      ];
      if (suggestionLines) {
        lines.push('- Current learning suggestions:');
        lines.push(suggestionLines);
      }

      const result = lines.join('\n');
      await this.setCache(cacheKey, result, 300); // 300s = 5 minutes
      return result;
    } catch {
      // Never block the chat stream due to a personalization failure
      return '';
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Cache Management & Distributed Fallbacks (Phase 5A)
  // ─────────────────────────────────────────────────────────────────────────

  private readonly CACHE_VERSION = 'v1';

  private async getCache(key: string): Promise<string | null> {
    const client = this.redisService.getClient();
    if (client) {
      try {
        return await this.redisService.get(key);
      } catch (err: any) {
        this.logger.warn(`Redis get cache failed: ${err.message}. Falling back to local cache.`);
      }
    }
    // Local memory cache
    const cached = this.localCache.get(key);
    if (cached) {
      if (Date.now() < cached.expiresAt) {
        return cached.value;
      }
      this.localCache.delete(key);
    }
    return null;
  }

  private async setCache(key: string, value: string, ttlSeconds: number): Promise<void> {
    const client = this.redisService.getClient();
    if (client) {
      try {
        await this.redisService.set(key, value, ttlSeconds);
        return;
      } catch (err: any) {
        this.logger.warn(`Redis set cache failed: ${err.message}. Falling back to local cache.`);
      }
    }
    // Local memory cache
    this.localCache.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  private async delCache(key: string): Promise<void> {
    const client = this.redisService.getClient();
    if (client) {
      try {
        await this.redisService.del(key);
      } catch (err: any) {
        this.logger.warn(`Redis del cache failed: ${err.message}.`);
      }
    }
    this.localCache.delete(key);
  }

  async clearCoachCache(userId: string, roadmapId: string): Promise<void> {
    const personalizationKey = `coach:${this.CACHE_VERSION}:personalization:${userId}:${roadmapId}`;
    const analyticsKey = `coach:${this.CACHE_VERSION}:analytics:${userId}:${roadmapId}`;
    await this.delCache(personalizationKey);
    await this.delCache(analyticsKey);
    this.logger.log(`Cleared coach cache for userId=${userId}, roadmapId=${roadmapId}`);
  }

  async clearUserCoachCache(userId: string): Promise<void> {
    try {
      const roadmaps = await this.prisma.careerRoadmap.findMany({
        where: { userId },
        select: { id: true },
      });
      for (const r of roadmaps) {
        await this.clearCoachCache(userId, r.id);
      }
    } catch (err: any) {
      this.logger.error(`Failed to clear user coach cache for ${userId}:`, err);
    }
  }
}

