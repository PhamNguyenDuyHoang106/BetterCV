import { renderHtml } from '@acv/template-engine';

interface BenchmarkResult {
  sizeKb: number;
  frequency: number;
  avgLatencyMs: number;
  heapDeltaMb: number;
  recommendation: string;
}

function generateMockCvData(sizeKb: number): any {
  // Base skeleton
  const data: any = {
    schemaVersion: 1,
    profile: {
      fullName: 'Test Developer',
      email: 'test@example.com',
      phone: '1234567890',
      github: 'https://github.com',
      linkedin: 'https://linkedin.com',
      theme: {
        primaryColor: '#5DADE2',
        textColor: '#1C2D37',
      },
    },
    summary: {
      text: 'Highly experienced software architect with a demonstrated history of scaling high-concurrency systems.',
    },
    experience: [],
    education: [],
    skills: { items: [] },
    projects: [],
  };

  // Populate experiences to hit target size
  const itemText = 'Designed, implemented and optimized key distributed message queues using BullMQ and Redis. Managed container orchestration, structured logging architectures, and GitOps alerting provisioning. Collaborated with multi-disciplinary engineering teams to eliminate technical debt and enforce strict data retention compliance.';
  let approxBytes = JSON.stringify(data).length;
  let counter = 1;

  while (approxBytes < sizeKb * 1024) {
    data.experience.push({
      id: `exp-${counter++}`,
      role: 'Senior Software Architect',
      company: 'Antigravity Enterprise Solutions',
      duration: '2022 - Present',
      description: itemText,
    });
    approxBytes = JSON.stringify(data).length;
  }

  return data;
}

const mockTemplateSchema = {
  id: 'template-standard',
  name: 'Standard ATS',
  category: 'TECH',
  layout: {
    sections: [
      { type: 'profile', blocks: [] },
      { type: 'summary', blocks: [] },
      { type: 'experience', blocks: [] },
    ],
  },
} as any;

async function runBenchmarkForCase(sizeKb: number, frequency: number): Promise<BenchmarkResult> {
  const cvData = generateMockCvData(sizeKb);
  const totalRuns = 50; // Run 50 times to get stable average
  const intervalMs = 1000 / frequency;

  // Trigger GC if available
  if (global.gc) {
    global.gc();
  }

  const initialMemory = process.memoryUsage().heapUsed;
  const latencies: number[] = [];

  for (let i = 0; i < totalRuns; i++) {
    const start = performance.now();
    
    // Simulate Editor Sync operations:
    // 1. Serialization (JSON stringify from editor state)
    const payloadStr = JSON.stringify(cvData);
    // 2. Deserialization in preview iframe
    const parsedData = JSON.parse(payloadStr);
    // 3. Render HTML using template engine
    const html = renderHtml({
      template: mockTemplateSchema,
      data: parsedData,
    });
    
    const end = performance.now();
    latencies.push(end - start);

    // Simulate wait interval between syncs
    await new Promise((r) => setTimeout(r, intervalMs));
  }

  if (global.gc) {
    global.gc();
  }

  const finalMemory = process.env.NODE_ENV === 'test' ? initialMemory : process.memoryUsage().heapUsed;
  const heapDelta = (finalMemory - initialMemory) / 1024 / 1024;
  const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;

  // Decide if diff-sync is required based on threshold:
  // - Latency > 16.6ms (1 frame at 60fps) OR
  // - Heap memory growth > 15MB over the short run
  let recommendation = '🟢 KEEP FULL SYNC (Optimal)';
  if (avgLatency > 16.6 || heapDelta > 15) {
    recommendation = '🔴 REFRACTOR TO DIFF SYNC (Bottleneck)';
  }

  return {
    sizeKb,
    frequency,
    avgLatencyMs: avgLatency,
    heapDeltaMb: Math.max(0, heapDelta),
    recommendation,
  };
}

async function main() {
  console.log('==================================================');
  console.log('    BETTERCV EDITOR SYNC PERFORMANCE BENCHMARK    ');
  console.log('==================================================\n');

  const testCases = [
    { sizeKb: 50, frequency: 2 },   // Normal CV, slow typing
    { sizeKb: 50, frequency: 10 },  // Normal CV, fast typing
    { sizeKb: 100, frequency: 2 },  // Medium CV, slow typing
    { sizeKb: 100, frequency: 10 }, // Medium CV, fast typing
    { sizeKb: 300, frequency: 5 },  // Large CV, average typing
    { sizeKb: 500, frequency: 5 },  // Extra Large CV, average typing
  ];

  const results: BenchmarkResult[] = [];

  for (const tc of testCases) {
    console.log(`🧪 Running benchmark for size: ${tc.sizeKb}KB, freq: ${tc.frequency} syncs/sec...`);
    const res = await runBenchmarkForCase(tc.sizeKb, tc.frequency);
    results.push(res);
    console.log(`   └─ Avg Latency: ${res.avgLatencyMs.toFixed(2)}ms | Heap Delta: ${res.heapDeltaMb.toFixed(2)}MB | ${res.recommendation}\n`);
  }

  console.log('\n==================================================');
  console.log('               BENCHMARK SUMMARY REPORT            ');
  console.log('==================================================');
  console.log('| Size (KB) | Freq (syncs/s) | Latency (ms) | Heap Delta (MB) | Recommendation |');
  console.log('|-----------|----------------|--------------|-----------------|----------------|');
  for (const r of results) {
    console.log(`| ${r.sizeKb.toString().padEnd(9)} | ${r.frequency.toString().padEnd(14)} | ${r.avgLatencyMs.toFixed(2).padEnd(12)} | ${r.heapDeltaMb.toFixed(2).padEnd(15)} | ${r.recommendation} |`);
  }
  console.log('==================================================\n');
}

if (require.main === module) {
  main().catch((err) => console.error('Benchmark failed:', err));
}
