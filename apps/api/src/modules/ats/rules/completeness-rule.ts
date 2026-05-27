import { AtsRule, AtsRuleResult } from './ats-rule.interface';

export class CompletenessRule implements AtsRule {
  async evaluate(cvData: any, _jobDescription: string): Promise<AtsRuleResult> {
    const findings: string[] = [];
    const recommendations: string[] = [];

    const sections = cvData?.sections || [];
    const sectionTypes = sections.map((s: any) => s.type);

    let score = 100;
    const requiredSections = [
      { type: 'PROFILE', name: 'Thông tin cá nhân', deduction: 25 },
      { type: 'SUMMARY', name: 'Tóm tắt bản thân/Giới thiệu', deduction: 15 },
      { type: 'EXPERIENCE', name: 'Kinh nghiệm làm việc', deduction: 30 },
      { type: 'EDUCATION', name: 'Học vấn & Trình độ', deduction: 20 },
      { type: 'SKILLS', name: 'Kỹ năng chuyên môn', deduction: 10 },
    ];

    for (const req of requiredSections) {
      if (!sectionTypes.includes(req.type)) {
        score -= req.deduction;
        findings.push(`Thiếu phần quan trọng: [${req.name}]`);
        recommendations.push(
          `Vui lòng thêm phần [${req.name}] vào CV để nhà tuyển dụng có đủ thông tin đánh giá.`,
        );
      } else {
        // Evaluate details within sections
        const sec = sections.find((s: any) => s.type === req.type);
        const content = sec?.content || {};

        if (req.type === 'PROFILE') {
          if (!content.fullName) {
            score -= 10;
            findings.push('Phần thông tin cá nhân thiếu Họ và tên.');
            recommendations.push('Bổ sung Họ và tên đầy đủ ở đầu CV.');
          }
          if (!content.email && !content.phone) {
            score -= 10;
            findings.push(
              'CV thiếu thông tin liên lạc tối thiểu (Email hoặc Số điện thoại).',
            );
            recommendations.push(
              'Bổ sung Số điện thoại và Email liên hệ để nhà tuyển dụng dễ dàng tiếp cận.',
            );
          }
        }

        if (req.type === 'EXPERIENCE') {
          const items = content.items || content;
          if (!Array.isArray(items) || items.length === 0) {
            score -= 15;
            findings.push('Phần Kinh nghiệm làm việc trống.');
            recommendations.push(
              'Thêm lịch sử kinh nghiệm làm việc chi tiết (tên công ty, vai trò, thời gian).',
            );
          } else {
            const emptyDesc = items.some(
              (item: any) =>
                !item.description || item.description.trim().length < 15,
            );
            if (emptyDesc) {
              score -= 10;
              findings.push(
                'Có vị trí kinh nghiệm thiếu phần mô tả chi tiết công việc hoặc mô tả quá ngắn.',
              );
              recommendations.push(
                'Bổ sung mô tả chi tiết nhiệm vụ và thành tựu (dùng Markdown gạch đầu dòng) cho tất cả vị trí làm việc.',
              );
            }
          }
        }

        if (req.type === 'SKILLS') {
          const items = content.items || content;
          if (!Array.isArray(items) || items.length === 0) {
            score -= 5;
            findings.push('Danh sách kỹ năng chuyên môn trống.');
            recommendations.push(
              'Liệt kê các công nghệ, công cụ, hoặc kỹ năng cốt lõi bạn thành thạo.',
            );
          }
        }
      }
    }

    score = Math.max(0, score);

    if (score === 100) {
      findings.push(
        'Tuyệt vời! Tất cả các phần thiết yếu đều có đầy đủ thông tin chi tiết.',
      );
      recommendations.push('Dữ liệu cấu trúc CV rất đầy đủ và sạch sẽ.');
    } else {
      findings.push(`Độ hoàn thiện tổng thể đạt ${score}%.`);
    }

    return {
      ruleName: 'Độ hoàn thiện CV (Profile Completeness)',
      score,
      weight: 0.3,
      findings,
      recommendations,
    };
  }
}
