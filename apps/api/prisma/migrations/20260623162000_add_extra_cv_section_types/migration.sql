-- Add new section enum values for template-engine parity
ALTER TYPE "CvSectionType" ADD VALUE IF NOT EXISTS 'LANGUAGES';
ALTER TYPE "CvSectionType" ADD VALUE IF NOT EXISTS 'CERTIFICATIONS';
ALTER TYPE "CvSectionType" ADD VALUE IF NOT EXISTS 'AWARDS';
