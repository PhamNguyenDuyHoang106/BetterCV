import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const templateSchema = (category: "TECH" | "BUSINESS" | "DESIGN") => ({
  id: `${category.toLowerCase()}-classic`,
  name: `${category} Classic`,
  category,
  layout: {
    sections: [
      {
        type: "PROFILE",
        blocks: [
          { key: "profile.name", label: "Name" },
          { key: "profile.title", label: "Title" },
          { key: "profile.contact", label: "Contact" }
        ]
      },
      {
        type: "SUMMARY",
        blocks: [{ key: "summary.text", label: "Summary" }]
      },
      {
        type: "EXPERIENCE",
        blocks: [{ key: "experience.items", label: "Experience" }]
      },
      {
        type: "EDUCATION",
        blocks: [{ key: "education.items", label: "Education" }]
      },
      {
        type: "SKILLS",
        blocks: [{ key: "skills.items", label: "Skills" }]
      },
      {
        type: "PROJECTS",
        blocks: [{ key: "projects.items", label: "Projects" }]
      }
    ]
  }
});

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

  const templates = [
    { category: techCategory, schema: templateSchema("TECH") },
    { category: businessCategory, schema: templateSchema("BUSINESS") },
    { category: designCategory, schema: templateSchema("DESIGN") }
  ];

  for (const item of templates) {
    await prisma.template.upsert({
      where: { id: item.schema.id },
      update: {
        name: item.schema.name,
        categoryId: item.category.id,
        schema: item.schema,
        isActive: true
      },
      create: {
        id: item.schema.id,
        name: item.schema.name,
        categoryId: item.category.id,
        schema: item.schema,
        isActive: true
      }
    });
  }

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
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
