import { AtsRule, AtsRuleResult } from './ats-rule.interface';

export class KeywordRule implements AtsRule {
  private readonly COMMON_TECH_KEYWORDS = [
    'react',
    'vue',
    'angular',
    'next.js',
    'nuxt',
    'svelte',
    'typescript',
    'javascript',
    'nodejs',
    'nestjs',
    'express',
    'koa',
    'fastify',
    'python',
    'django',
    'flask',
    'fastapi',
    'golang',
    'java',
    'spring',
    'springboot',
    'c#',
    'dotnet',
    'asp.net',
    'php',
    'laravel',
    'ruby',
    'rails',
    'rust',
    'c\\+\\+',
    'docker',
    'kubernetes',
    'k8s',
    'aws',
    'azure',
    'gcp',
    'devops',
    'ci/cd',
    'jenkins',
    'github actions',
    'gitlab ci',
    'terraform',
    'ansible',
    'postgresql',
    'mysql',
    'mongodb',
    'redis',
    'elasticsearch',
    'cassandra',
    'graphql',
    'rest api',
    'grpc',
    'microservices',
    'agile',
    'scrum',
    'kanban',
    'git',
    'linux',
    'nginx',
    'apache',
    'kafka',
    'rabbitmq',
    'security',
    'oauth',
    'jwt',
    'prisma',
    'sequelize',
  ];

  async evaluate(cvData: any, jobDescription: string): Promise<AtsRuleResult> {
    const findings: string[] = [];
    const recommendations: string[] = [];

    if (!jobDescription) {
      return {
        ruleName: 'Mức độ trùng khớp Từ khóa (Keywords Match)',
        score: 0,
        weight: 0.4,
        findings: ['Không có mô tả công việc (JD) để đối chiếu.'],
        recommendations: [
          'Vui lòng tải lên mô tả công việc (JD) để kiểm tra mức độ từ khóa.',
        ],
      };
    }

    // Standardize text
    const cvText = this.stringifyCvData(cvData).toLowerCase();
    const jdText = jobDescription.toLowerCase();

    // Extract relevant keywords from JD
    const jdKeywords = this.COMMON_TECH_KEYWORDS.filter((keyword) => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'i');
      return regex.test(jdText);
    });

    if (jdKeywords.length === 0) {
      return {
        ruleName: 'Mức độ trùng khớp Từ khóa (Keywords Match)',
        score: 100, // No specific tech keywords found in JD, assume perfect match
        weight: 0.4,
        findings: [
          'Không phát hiện từ khóa kỹ thuật phổ biến nào trong mô tả công việc.',
        ],
        recommendations: [
          'Bổ sung thêm các yêu cầu kỹ thuật chi tiết hơn trong mô tả công việc.',
        ],
      };
    }

    // Match keywords against CV
    const matchedKeywords = jdKeywords.filter((keyword) => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'i');
      return regex.test(cvText);
    });

    const missingKeywords = jdKeywords.filter(
      (k) => !matchedKeywords.includes(k),
    );
    const score = Math.round(
      (matchedKeywords.length / jdKeywords.length) * 100,
    );

    findings.push(
      `Phát hiện ${matchedKeywords.length}/${jdKeywords.length} từ khóa kỹ thuật cốt lõi từ JD xuất hiện trong CV.`,
    );

    if (matchedKeywords.length > 0) {
      findings.push(`Từ khóa đã trùng khớp: ${matchedKeywords.join(', ')}`);
    }

    if (missingKeywords.length > 0) {
      findings.push(
        `Từ khóa còn thiếu: ${missingKeywords.slice(0, 10).join(', ')}${missingKeywords.length > 10 ? '...' : ''}`,
      );
      recommendations.push(
        `Bổ sung các từ khóa kỹ thuật còn thiếu sau đây vào phần kỹ năng hoặc kinh nghiệm nếu bạn đã từng làm việc với chúng: ${missingKeywords.slice(0, 5).join(', ')}`,
      );
    } else {
      findings.push(
        'Tuyệt vời! CV của bạn chứa đầy đủ tất cả từ khóa kỹ thuật yêu cầu trong JD.',
      );
      recommendations.push(
        'Tiếp tục duy trì tính nhất quán của từ khóa xuyên suốt hồ sơ.',
      );
    }

    return {
      ruleName: 'Mức độ trùng khớp Từ khóa (Keywords Match)',
      score,
      weight: 0.4,
      findings,
      recommendations,
    };
  }

  private stringifyCvData(cvData: any): string {
    if (!cvData) return '';
    if (typeof cvData === 'string') return cvData;

    let result = '';
    if (cvData.title) result += ' ' + cvData.title;
    if (cvData.sections && Array.isArray(cvData.sections)) {
      for (const sec of cvData.sections) {
        if (sec.content) {
          result += ' ' + JSON.stringify(sec.content);
        }
      }
    }
    return result;
  }
}
