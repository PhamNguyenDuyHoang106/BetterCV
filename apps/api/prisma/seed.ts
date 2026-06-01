import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const templateSchema = (opts: {
  id: string;
  name: string;
  category: "TECH" | "BUSINESS" | "DESIGN";
}) => ({
  id: opts.id,
  name: opts.name,
  category: opts.category,
  layout: {
    sections: [
      {
        type: "PROFILE",
        blocks: [
          { key: "profile.fullName", label: "Họ và tên" },
          { key: "profile.title", label: "Chức danh" },
          { key: "profile.email", label: "Email" },
          { key: "profile.phone", label: "Số điện thoại" },
          { key: "profile.linkedin", label: "LinkedIn" },
          { key: "profile.github", label: "GitHub" },
          { key: "profile.website", label: "Website" }
        ]
      },
      {
        type: "SUMMARY",
        blocks: [{ key: "summary.text", label: "Giới thiệu" }]
      },
      {
        type: "EXPERIENCE",
        blocks: [{ key: "experience", label: "Kinh nghiệm làm việc" }]
      },
      {
        type: "EDUCATION",
        blocks: [{ key: "education", label: "Học vấn & Bằng cấp" }]
      },
      {
        type: "SKILLS",
        blocks: [{ key: "skills", label: "Kỹ năng chuyên môn" }]
      },
      {
        type: "PROJECTS",
        blocks: [{ key: "projects", label: "Dự án tiêu biểu" }]
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

  const templateRows: Array<{
    id: string;
    name: string;
    category: "TECH" | "BUSINESS" | "DESIGN";
  }> = [
    { id: "standard-ats", name: "Standard ATS", category: "BUSINESS" },
    { id: "tech-classic", name: "Tech Classic", category: "TECH" },
    { id: "techstack", name: "TechStack", category: "TECH" },
    { id: "business-classic", name: "Business Classic", category: "BUSINESS" },
    { id: "dublin", name: "Dublin", category: "BUSINESS" },
    { id: "design-classic", name: "Design Classic", category: "DESIGN" },
    { id: "nova", name: "Nova", category: "DESIGN" },
    { id: "monarch", name: "Monarch", category: "DESIGN" },
    { id: "minimalist", name: "Minimalist", category: "DESIGN" },
    { id: "london", name: "London", category: "BUSINESS" },
    { id: "zurich", name: "Zurich", category: "BUSINESS" },
    { id: "oslo", name: "Oslo", category: "TECH" },
    { id: "berlin", name: "Berlin", category: "TECH" },
    { id: "stockholm", name: "Stockholm", category: "BUSINESS" },
    { id: "paris", name: "Paris", category: "DESIGN" },
    { id: "milan", name: "Milan", category: "DESIGN" },
    { id: "tokyo", name: "Tokyo", category: "DESIGN" },
    { id: "singapore", name: "Singapore", category: "BUSINESS" },
    { id: "sydney", name: "Sydney", category: "TECH" },
    { id: "toronto", name: "Toronto", category: "BUSINESS" },
    { id: "seattle", name: "Seattle", category: "TECH" },
    { id: "austin", name: "Austin", category: "BUSINESS" },
    { id: "boston", name: "Boston", category: "DESIGN" },
    { id: "chicago", name: "Chicago", category: "BUSINESS" },
    { id: "amsterdam", name: "Amsterdam", category: "DESIGN" },
    { id: "copenhagen", name: "Copenhagen", category: "DESIGN" },
    { id: "vienna", name: "Vienna", category: "DESIGN" },
    { id: "geneva", name: "Geneva", category: "BUSINESS" },
    { id: "prague", name: "Prague", category: "TECH" },
    { id: "helsinki", name: "Helsinki", category: "BUSINESS" },
    { id: "barcelona-creative", name: "Barcelona", category: "DESIGN" },
    { id: "hong-kong-finance", name: "Hong Kong", category: "BUSINESS" },
  ];

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
