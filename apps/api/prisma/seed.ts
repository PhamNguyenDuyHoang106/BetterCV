import { PrismaClient } from "@prisma/client";
import { TEMPLATE_REGISTRY } from "@acv/shared";
import { getTemplateStyles, getLayoutConfig, getTemplateSectionStyles, getTemplateLayout } from "@acv/template-engine";

const prisma = new PrismaClient();

const templateSchema = (opts: {
  id: string;
  name: string;
  category: "TECH" | "BUSINESS" | "DESIGN";
}) => {
  const themeTokens = getTemplateStyles(opts.id);
  const layoutConfig = getLayoutConfig(opts.id);
  
  return {
    id: opts.id,
    name: opts.name,
    category: opts.category,
    layout: getTemplateLayout(opts.id),
    themeTokens,
    layoutConfig,
    sectionStyles: getTemplateSectionStyles(opts.id),
  };
};

async function main() {
  const planFree = await prisma.plan.upsert({
    where: { tier: "FREE" },
    update: {
      name: "Free",
      monthlyAiQuota: 2000
    },
    create: {
      tier: "FREE",
      name: "Free",
      monthlyAiQuota: 2000
    }
  });

  await prisma.plan.upsert({
    where: { tier: "PRO" },
    update: {
      name: "Pro",
      monthlyAiQuota: 20000,
      stripePriceId: process.env.STRIPE_PRICE_PRO ?? null
    },
    create: {
      tier: "PRO",
      name: "Pro",
      monthlyAiQuota: 20000,
      stripePriceId: process.env.STRIPE_PRICE_PRO ?? null
    }
  });

  await prisma.plan.upsert({
    where: { tier: "PREMIUM" },
    update: {
      name: "Premium",
      monthlyAiQuota: 50000,
      stripePriceId: process.env.STRIPE_PRICE_PREMIUM ?? null
    },
    create: {
      tier: "PREMIUM",
      name: "Premium",
      monthlyAiQuota: 50000,
      stripePriceId: process.env.STRIPE_PRICE_PREMIUM ?? null
    }
  });

  const techCategory = await prisma.templateCategory.upsert({
    where: { name: "Tech" },
    update: {},
    create: { name: "Tech" }
  });

  const businessCategory = await prisma.templateCategory.upsert({
    where: { name: "Business" },
    update: {},
    create: { name: "Business" }
  });

  const designCategory = await prisma.templateCategory.upsert({
    where: { name: "Design" },
    update: {},
    create: { name: "Design" }
  });

  const templateRows = TEMPLATE_REGISTRY.map((entry) => ({
    id: entry.id,
    name: entry.name,
    category: entry.categoryCode,
  }));

  const categoryByType = {
    TECH: techCategory,
    BUSINESS: businessCategory,
    DESIGN: designCategory,
  } as const;

  const templates = templateRows.map((row) => ({
    category: categoryByType[row.category],
    schema: templateSchema({
      id: row.id,
      name: row.name,
      category: row.category,
    }),
  }));

  for (const item of templates) {
    const templateRecord = await prisma.template.upsert({
      where: { id: item.schema.id },
      update: {
        name: item.schema.name,
        categoryId: item.category.id,
        schema: item.schema as any,
        isActive: true
      },
      create: {
        id: item.schema.id,
        name: item.schema.name,
        categoryId: item.category.id,
        schema: item.schema as any,
        isActive: true
      }
    });

    // Seed TemplateVersion snapshot records
    await prisma.templateVersion.upsert({
      where: {
        templateId_version: {
          templateId: templateRecord.id,
          version: 1
        }
      },
      update: {
        schema: item.schema as any
      },
      create: {
        templateId: templateRecord.id,
        version: 1,
        schema: item.schema as any
      }
    });
  }

  // Deactivate templates outside the curated registry to avoid saturated/legacy gallery.
  await prisma.template.updateMany({
    where: {
      id: {
        notIn: templateRows.map((row) => row.id),
      },
    },
    data: {
      isActive: false,
    },
  });

  await prisma.user.updateMany({
    data: { role: planFree.tier }
  });

  const safetyRules = [
    { name: "Block_SSN", pattern: "\\b\\d{3}-\\d{2}-\\d{4}\\b" },
    { name: "Block_CreditCard", pattern: "\\b\\d{13,19}\\b" }
  ];

  for (const rule of safetyRules) {
    await prisma.safetyRule.upsert({
      where: { name: rule.name },
      update: { pattern: rule.pattern, isActive: true },
      create: { name: rule.name, pattern: rule.pattern, isActive: true }
    });
  }

  // Seed modern learning resources & skill metadata
  try {
    const { seedLearningResources } = await import("./seeds/learning-resources.seed");
    await seedLearningResources(prisma);
  } catch (err) {
    console.error("Failed to seed learning resources:", err);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

