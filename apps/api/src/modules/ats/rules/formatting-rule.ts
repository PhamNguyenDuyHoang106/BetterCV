import { AtsRule, AtsRuleResult } from './ats-rule.interface';

export class FormattingRule implements AtsRule {
  async evaluate(cvData: any, _jobDescription: string): Promise<AtsRuleResult> {
    const findings: string[] = [];
    const recommendations: string[] = [];
    let score = 100;

    const sections = cvData?.sections || [];

    // 1. Check for standard template placeholders
    const PLACEHOLDER_PATTERNS = [
      /lorem\s+ipsum/i,
      /\[tên\s+công\s+ty\]/i,
      /\[company\s+name\]/i,
      /abcxyz/i,
      /insert\s+here/i,
      /điền\s+vào\s+đây/i,
      /\[nhập\s+thông\s+tin\]/i,
    ];

    let placeholderFound = false;
    for (const sec of sections) {
      const text = JSON.stringify(sec.content || '').toLowerCase();
      for (const pattern of PLACEHOLDER_PATTERNS) {
        if (pattern.test(text)) {
          placeholderFound = true;
          break;
        }
      }
    }

    if (placeholderFound) {
      score -= 30;
      findings.push(
        'Phát hiện văn bản tạm thời / placeholder chưa hoàn thiện (ví dụ: Lorem Ipsum, [tên công ty]).',
      );
      recommendations.push(
        'Thay thế tất cả các placeholder và văn bản tạm thời bằng thông tin thực tế của bạn trước khi nộp.',
      );
    }

    // 2. Length check (Word count density)
    let totalWordCount = 0;
    for (const sec of sections) {
      const text = JSON.stringify(sec.content || '');
      totalWordCount += text.split(/\s+/).filter(Boolean).length;
    }

    if (totalWordCount < 100) {
      score -= 20;
      findings.push(
        `CV quá ngắn (${totalWordCount} từ), thiếu thông tin trầm trọng.`,
      );
      recommendations.push(
        'Bổ sung thêm mô tả dự án và chi tiết kinh nghiệm làm việc để đạt ít nhất 300 từ.',
      );
    } else if (totalWordCount > 1200) {
      score -= 10;
      findings.push(
        `CV có dung lượng rất lớn (${totalWordCount} từ), có thể gây khó khăn cho ATS hoặc người sàng lọc đọc nhanh.`,
      );
      recommendations.push(
        'Tối ưu hóa từ ngữ, làm nổi bật thành tựu chính và hạn chế mô tả rườm rà để tránh vượt quá 2 trang A4.',
      );
    } else {
      findings.push(
        `Độ dài CV phù hợp (${totalWordCount} từ), lý tưởng cho 1-2 trang A4.`,
      );
    }

    // 3. AI Ethical Validation: suspicious fabricated metrics rules
    // Rule: Prompt must not fabricate metrics. If CV lists exact percentages/metrics, we check that they look natural
    // Suspicious pattern: using the exact same metrics multiple times (e.g. "tăng 30% doanh thu" and "tăng 30% hiệu năng")
    const metricsPattern = /\b\d+%\b/g;
    const allMetrics: string[] = [];
    for (const sec of sections) {
      const contentStr = JSON.stringify(sec.content || '');
      const matches = contentStr.match(metricsPattern);
      if (matches) {
        allMetrics.push(...matches);
      }
    }

    const uniqueMetrics = new Set(allMetrics);
    if (allMetrics.length > 5 && uniqueMetrics.size === 1) {
      score -= 15;
      findings.push(
        'Phát hiện tỷ lệ phần trăm số liệu giống hệt nhau lặp đi lặp lại. Đây là dấu hiệu của AI tự bịa số liệu (fabrication risk).',
      );
      recommendations.push(
        'Thay thế hoặc đa dạng hóa các số liệu thống kê để phản ánh chính xác kết quả thực tế của bạn.',
      );
    }

    score = Math.max(0, score);

    if (score === 100) {
      findings.push('Định dạng và phân phối văn bản đạt chuẩn ATS.');
      recommendations.push('Duy trì cách trình bày cân đối, chuyên nghiệp.');
    }

    return {
      ruleName: 'Định dạng & Tiêu chuẩn Trình bày (Formatting & Standards)',
      score,
      weight: 0.3,
      findings,
      recommendations,
    };
  }
}
