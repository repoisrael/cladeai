/**
 * Automated Performance Testing System
 * 
 * Runs regular performance tests to identify slow features and bottlenecks.
 * Generates detailed reports for the admin dashboard.
 */

import { chromium, Browser, Page } from 'playwright';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface PerformanceMetric {
  name: string;
  duration: number;
  status: 'pass' | 'fail' | 'warning';
  threshold: number;
  timestamp: Date;
  metadata?: Record<string, any>;
}

interface TestResult {
  testSuite: string;
  metrics: PerformanceMetric[];
  totalDuration: number;
  passedTests: number;
  failedTests: number;
  warnings: number;
}

// Performance thresholds (in milliseconds)
const THRESHOLDS = {
  PAGE_LOAD: 3000,
  API_CALL: 1000,
  SEARCH_QUERY: 2000,
  TRACK_ANALYSIS: 5000,
  FEED_RENDER: 2000,
  PLAYER_LOAD: 1500,
  NAVIGATION: 500,
  DATABASE_QUERY: 500,
} as const;

/**
 * Main performance test runner
 */
export async function runPerformanceTests(): Promise<TestResult[]> {
  console.log('🚀 Starting Performance Tests\n');
  const startTime = Date.now();

  const browser = await chromium.launch({ headless: true });
  const results: TestResult[] = [];

  try {
    // Test suites
    results.push(await testPageLoads(browser));
    results.push(await testAPIPerformance(browser));
    results.push(await testSearchPerformance(browser));
    results.push(await testPlayerPerformance(browser));
    results.push(await testFeedPerformance(browser));
    results.push(await testNavigationPerformance(browser));
    results.push(await testDatabasePerformance());

    // Save results to database
    await saveTestResults(results);

    // Generate summary
    const summary = generateSummary(results);
    console.log('\n' + summary);

    const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\n✅ All tests completed in ${totalTime}s`);

    return results;
  } catch (error) {
    console.error('❌ Test runner error:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

/**
 * Test page load performance
 */
async function testPageLoads(browser: Browser): Promise<TestResult> {
  console.log('📄 Testing Page Loads...');
  const context = await browser.newContext();
  const page = await context.newPage();
  const metrics: PerformanceMetric[] = [];

  const pages = [
    { name: 'Homepage', url: '/' },
    { name: 'Feed', url: '/feed' },
    { name: 'Search', url: '/search' },
    { name: 'Forum', url: '/forum' },
    { name: 'Profile', url: '/profile' },
  ];

  for (const { name, url } of pages) {
    const start = Date.now();
    await page.goto(`${process.env.APP_URL}${url}`, {
      waitUntil: 'domcontentloaded',
    });
    const duration = Date.now() - start;

    metrics.push({
      name: `${name} Load`,
      duration,
      status: duration < THRESHOLDS.PAGE_LOAD ? 'pass' : 'fail',
      threshold: THRESHOLDS.PAGE_LOAD,
      timestamp: new Date(),
    });

    console.log(`  ${name}: ${duration}ms ${duration < THRESHOLDS.PAGE_LOAD ? '✅' : '❌'}`);
  }

  await context.close();

  return {
    testSuite: 'Page Loads',
    metrics,
    totalDuration: metrics.reduce((sum, m) => sum + m.duration, 0),
    passedTests: metrics.filter((m) => m.status === 'pass').length,
    failedTests: metrics.filter((m) => m.status === 'fail').length,
    warnings: metrics.filter((m) => m.status === 'warning').length,
  };
}

/**
 * Test API endpoint performance
 */
async function testAPIPerformance(browser: Browser): Promise<TestResult> {
  console.log('\n🌐 Testing API Performance...');
  const context = await browser.newContext();
  const page = await context.newPage();
  const metrics: PerformanceMetric[] = [];

  // Navigate to app to get auth token
  await page.goto(`${process.env.APP_URL}/feed`);

  const endpoints = [
    { name: 'Get Tracks', path: '/api/tracks?limit=20' },
    { name: 'Get User Profile', path: '/api/profiles/me' },
    { name: 'Get Comments', path: '/api/forum/comments?limit=50' },
    { name: 'Get Reactions', path: '/api/reactions?post_id=test' },
  ];

  for (const { name, path } of endpoints) {
    const start = Date.now();
    
    try {
      const response = await page.evaluate(async (url) => {
        const res = await fetch(url);
        return { status: res.status, time: Date.now() };
      }, `${process.env.APP_URL}${path}`);

      const duration = Date.now() - start;

      metrics.push({
        name,
        duration,
        status: duration < THRESHOLDS.API_CALL ? 'pass' : 'fail',
        threshold: THRESHOLDS.API_CALL,
        timestamp: new Date(),
        metadata: { statusCode: response.status },
      });

      console.log(`  ${name}: ${duration}ms ${duration < THRESHOLDS.API_CALL ? '✅' : '❌'}`);
    } catch (error) {
      console.log(`  ${name}: ERROR ❌`);
      metrics.push({
        name,
        duration: 0,
        status: 'fail',
        threshold: THRESHOLDS.API_CALL,
        timestamp: new Date(),
        metadata: { error: String(error) },
      });
    }
  }

  await context.close();

  return {
    testSuite: 'API Performance',
    metrics,
    totalDuration: metrics.reduce((sum, m) => sum + m.duration, 0),
    passedTests: metrics.filter((m) => m.status === 'pass').length,
    failedTests: metrics.filter((m) => m.status === 'fail').length,
    warnings: 0,
  };
}

/**
 * Test search performance
 */
async function testSearchPerformance(browser: Browser): Promise<TestResult> {
  console.log('\n🔍 Testing Search Performance...');
  const context = await browser.newContext();
  const page = await context.newPage();
  const metrics: PerformanceMetric[] = [];

  await page.goto(`${process.env.APP_URL}/search`);

  const queries = ['Beatles', 'Hip Hop', 'C Major', 'Jazz', 'Rock'];

  for (const query of queries) {
    const start = Date.now();
    
    await page.fill('input[type="search"]', query);
    await page.waitForTimeout(300); // Debounce delay
    await page.waitForSelector('[data-testid="search-results"]', { timeout: 5000 });
    
    const duration = Date.now() - start;

    metrics.push({
      name: `Search: "${query}"`,
      duration,
      status: duration < THRESHOLDS.SEARCH_QUERY ? 'pass' : 'fail',
      threshold: THRESHOLDS.SEARCH_QUERY,
      timestamp: new Date(),
      metadata: { query },
    });

    console.log(`  "${query}": ${duration}ms ${duration < THRESHOLDS.SEARCH_QUERY ? '✅' : '❌'}`);
  }

  await context.close();

  return {
    testSuite: 'Search Performance',
    metrics,
    totalDuration: metrics.reduce((sum, m) => sum + m.duration, 0),
    passedTests: metrics.filter((m) => m.status === 'pass').length,
    failedTests: metrics.filter((m) => m.status === 'fail').length,
    warnings: 0,
  };
}

/**
 * Test player performance
 */
async function testPlayerPerformance(browser: Browser): Promise<TestResult> {
  console.log('\n🎵 Testing Player Performance...');
  const context = await browser.newContext();
  const page = await context.newPage();
  const metrics: PerformanceMetric[] = [];

  await page.goto(`${process.env.APP_URL}/feed`);

  // Test player open time
  const openStart = Date.now();
  await page.click('[data-testid="play-button"]');
  await page.waitForSelector('[data-testid="player-drawer"]', { timeout: 5000 });
  const openDuration = Date.now() - openStart;

  metrics.push({
    name: 'Player Open',
    duration: openDuration,
    status: openDuration < THRESHOLDS.PLAYER_LOAD ? 'pass' : 'fail',
    threshold: THRESHOLDS.PLAYER_LOAD,
    timestamp: new Date(),
  });

  console.log(`  Player Open: ${openDuration}ms ${openDuration < THRESHOLDS.PLAYER_LOAD ? '✅' : '❌'}`);

  // Test player controls responsiveness
  const controlsStart = Date.now();
  await page.click('[data-testid="play-pause-button"]');
  await page.waitForTimeout(100);
  const controlsDuration = Date.now() - controlsStart;

  metrics.push({
    name: 'Player Controls',
    duration: controlsDuration,
    status: controlsDuration < THRESHOLDS.NAVIGATION ? 'pass' : 'fail',
    threshold: THRESHOLDS.NAVIGATION,
    timestamp: new Date(),
  });

  console.log(`  Player Controls: ${controlsDuration}ms ${controlsDuration < THRESHOLDS.NAVIGATION ? '✅' : '❌'}`);

  await context.close();

  return {
    testSuite: 'Player Performance',
    metrics,
    totalDuration: metrics.reduce((sum, m) => sum + m.duration, 0),
    passedTests: metrics.filter((m) => m.status === 'pass').length,
    failedTests: metrics.filter((m) => m.status === 'fail').length,
    warnings: 0,
  };
}

/**
 * Test feed rendering performance
 */
async function testFeedPerformance(browser: Browser): Promise<TestResult> {
  console.log('\n📰 Testing Feed Performance...');
  const context = await browser.newContext();
  const page = await context.newPage();
  const metrics: PerformanceMetric[] = [];

  const start = Date.now();
  await page.goto(`${process.env.APP_URL}/feed`, { waitUntil: 'networkidle' });
  await page.waitForSelector('[data-testid="feed-item"]', { timeout: 5000 });
  const duration = Date.now() - start;

  metrics.push({
    name: 'Feed Initial Render',
    duration,
    status: duration < THRESHOLDS.FEED_RENDER ? 'pass' : 'fail',
    threshold: THRESHOLDS.FEED_RENDER,
    timestamp: new Date(),
  });

  console.log(`  Feed Initial Render: ${duration}ms ${duration < THRESHOLDS.FEED_RENDER ? '✅' : '❌'}`);

  // Test infinite scroll
  const scrollStart = Date.now();
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForSelector('[data-testid="feed-item"]:nth-child(25)', { timeout: 5000 });
  const scrollDuration = Date.now() - scrollStart;

  metrics.push({
    name: 'Feed Infinite Scroll',
    duration: scrollDuration,
    status: scrollDuration < THRESHOLDS.FEED_RENDER ? 'pass' : 'fail',
    threshold: THRESHOLDS.FEED_RENDER,
    timestamp: new Date(),
  });

  console.log(`  Infinite Scroll: ${scrollDuration}ms ${scrollDuration < THRESHOLDS.FEED_RENDER ? '✅' : '❌'}`);

  await context.close();

  return {
    testSuite: 'Feed Performance',
    metrics,
    totalDuration: metrics.reduce((sum, m) => sum + m.duration, 0),
    passedTests: metrics.filter((m) => m.status === 'pass').length,
    failedTests: metrics.filter((m) => m.status === 'fail').length,
    warnings: 0,
  };
}

/**
 * Test navigation performance
 */
async function testNavigationPerformance(browser: Browser): Promise<TestResult> {
  console.log('\n🧭 Testing Navigation Performance...');
  const context = await browser.newContext();
  const page = await context.newPage();
  const metrics: PerformanceMetric[] = [];

  await page.goto(`${process.env.APP_URL}/feed`);

  const routes = [
    { name: 'Feed → Search', selector: '[href="/search"]' },
    { name: 'Search → Forum', selector: '[href="/forum"]' },
    { name: 'Forum → Profile', selector: '[href="/profile"]' },
  ];

  for (const { name, selector } of routes) {
    const start = Date.now();
    await page.click(selector);
    await page.waitForLoadState('domcontentloaded');
    const duration = Date.now() - start;

    metrics.push({
      name,
      duration,
      status: duration < THRESHOLDS.NAVIGATION ? 'pass' : 'fail',
      threshold: THRESHOLDS.NAVIGATION,
      timestamp: new Date(),
    });

    console.log(`  ${name}: ${duration}ms ${duration < THRESHOLDS.NAVIGATION ? '✅' : '❌'}`);
  }

  await context.close();

  return {
    testSuite: 'Navigation Performance',
    metrics,
    totalDuration: metrics.reduce((sum, m) => sum + m.duration, 0),
    passedTests: metrics.filter((m) => m.status === 'pass').length,
    failedTests: metrics.filter((m) => m.status === 'fail').length,
    warnings: 0,
  };
}

/**
 * Test database query performance
 */
async function testDatabasePerformance(): Promise<TestResult> {
  console.log('\n🗄️ Testing Database Performance...');
  const metrics: PerformanceMetric[] = [];

  const queries = [
    {
      name: 'Get Recent Tracks',
      fn: () => supabase.from('tracks').select('*').order('created_at', { ascending: false }).limit(20),
    },
    {
      name: 'Get User Profile',
      fn: () => supabase.from('profiles').select('*').limit(1).single(),
    },
    {
      name: 'Get Forum Posts',
      fn: () => supabase.from('forum_posts').select('*, profiles(*)').order('created_at', { ascending: false }).limit(20),
    },
    {
      name: 'Get Track Sections',
      fn: () => supabase.from('track_sections').select('*').limit(50),
    },
    {
      name: 'Complex Join Query',
      fn: () => supabase.from('tracks').select('*, track_sections(*), profiles(*)').limit(10),
    },
  ];

  for (const { name, fn } of queries) {
    const start = Date.now();
    await fn();
    const duration = Date.now() - start;

    metrics.push({
      name,
      duration,
      status: duration < THRESHOLDS.DATABASE_QUERY ? 'pass' : duration < THRESHOLDS.DATABASE_QUERY * 2 ? 'warning' : 'fail',
      threshold: THRESHOLDS.DATABASE_QUERY,
      timestamp: new Date(),
    });

    const statusIcon = duration < THRESHOLDS.DATABASE_QUERY ? '✅' : duration < THRESHOLDS.DATABASE_QUERY * 2 ? '⚠️' : '❌';
    console.log(`  ${name}: ${duration}ms ${statusIcon}`);
  }

  return {
    testSuite: 'Database Performance',
    metrics,
    totalDuration: metrics.reduce((sum, m) => sum + m.duration, 0),
    passedTests: metrics.filter((m) => m.status === 'pass').length,
    failedTests: metrics.filter((m) => m.status === 'fail').length,
    warnings: metrics.filter((m) => m.status === 'warning').length,
  };
}

/**
 * Save test results to database
 */
async function saveTestResults(results: TestResult[]): Promise<void> {
  const allMetrics = results.flatMap((r) =>
    r.metrics.map((m) => ({
      test_suite: r.testSuite,
      test_name: m.name,
      duration_ms: m.duration,
      status: m.status,
      threshold_ms: m.threshold,
      metadata: m.metadata || {},
      tested_at: m.timestamp.toISOString(),
    }))
  );

  const { error } = await supabase.from('performance_test_results').insert(allMetrics);

  if (error) {
    console.error('❌ Error saving test results:', error);
  } else {
    console.log(`\n💾 Saved ${allMetrics.length} test results to database`);
  }
}

/**
 * Generate summary report
 */
function generateSummary(results: TestResult[]): string {
  const totalTests = results.reduce((sum, r) => sum + r.metrics.length, 0);
  const totalPassed = results.reduce((sum, r) => sum + r.passedTests, 0);
  const totalFailed = results.reduce((sum, r) => sum + r.failedTests, 0);
  const totalWarnings = results.reduce((sum, r) => sum + r.warnings, 0);
  const passRate = ((totalPassed / totalTests) * 100).toFixed(1);

  let summary = '\n╔════════════════════════════════════════════════════════╗\n';
  summary += '║         PERFORMANCE TEST SUMMARY                       ║\n';
  summary += '╚════════════════════════════════════════════════════════╝\n\n';
  summary += `Total Tests:     ${totalTests}\n`;
  summary += `✅ Passed:        ${totalPassed} (${passRate}%)\n`;
  summary += `❌ Failed:        ${totalFailed}\n`;
  summary += `⚠️  Warnings:      ${totalWarnings}\n\n`;

  results.forEach((result) => {
    const avgDuration = (result.totalDuration / result.metrics.length).toFixed(0);
    summary += `${result.testSuite}:\n`;
    summary += `  Total: ${result.totalDuration}ms | Avg: ${avgDuration}ms\n`;
    summary += `  ✅ ${result.passedTests} | ❌ ${result.failedTests} | ⚠️ ${result.warnings}\n\n`;
  });

  // Slowest tests
  const allMetrics = results.flatMap((r) => r.metrics);
  const slowest = allMetrics.sort((a, b) => b.duration - a.duration).slice(0, 5);

  summary += '🐌 Slowest Tests:\n';
  slowest.forEach((m, i) => {
    summary += `  ${i + 1}. ${m.name}: ${m.duration}ms\n`;
  });

  return summary;
}

/**
 * Schedule automated tests (run daily)
 */
export async function schedulePerformanceTests() {
  const interval = 24 * 60 * 60 * 1000; // 24 hours

  console.log('⏰ Performance tests scheduled to run every 24 hours\n');

  // Run immediately
  await runPerformanceTests();

  // Schedule recurring
  setInterval(async () => {
    console.log('\n⏰ Running scheduled performance tests...');
    await runPerformanceTests();
  }, interval);
}

// Run if executed directly
if (require.main === module) {
  runPerformanceTests()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}
