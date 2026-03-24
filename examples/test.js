#!/usr/bin/env node
/**
 * IMF WEO Analyzer 测试脚本
 * 测试核心功能
 */

const path = require('path');
const { handle, query, compute, chart } = require('../src/index');

// 测试用例
const testCases = [
  {
    name: '查询中国 GDP 增速',
    input: '中国 2020-2030 年 GDP 增速',
    expect: 'success'
  },
  {
    name: '金砖五国通胀率',
    input: '金砖五国 2020-2025 年通胀率',
    expect: 'success'
  },
  {
    name: '查询指标定义',
    input: 'primary fiscal deficit 定义是什么',
    expect: 'definition'
  },
  {
    name: '查询国家备注',
    input: '查看 Bangladesh 的财政年度备注',
    expect: 'note'
  },
  {
    name: '列出指标',
    input: '列出所有可用指标',
    expect: 'list'
  }
];

async function runTests() {
  console.log('🧪 开始运行测试...\n');
  
  let passed = 0;
  let failed = 0;
  
  for (const test of testCases) {
    console.log(`📋 测试：${test.name}`);
    console.log(`   输入：${test.input}`);
    
    try {
      const result = await handle(test.input, {
        outputDir: path.join(__dirname, '../output/test')
      });
      
      if (result.success && result.type === test.expect) {
        console.log(`   ✅ 通过 (${result.type})\n`);
        passed++;
      } else if (test.expect === 'success' && result.success) {
        console.log(`   ✅ 通过 (success, type=${result.type})\n`);
        passed++;
      } else {
        console.log(`   ❌ 失败 (期望：${test.expect}, 实际：${result.type || 'error'})`);
        if (result.message) console.log(`      消息：${result.message}\n`);
        failed++;
      }
    } catch (err) {
      console.log(`   ❌ 异常：${err.message}\n`);
      failed++;
    }
  }
  
  console.log('─'.repeat(50));
  console.log(`测试结果：${passed} 通过，${failed} 失败，共 ${testCases.length} 项`);
  
  // 测试计算功能
  console.log('\n🧮 测试计算功能...\n');
  
  // 模拟数据
  const testData = [
    { year: 2020, value: 100 },
    { year: 2021, value: 105 },
    { year: 2022, value: 110 },
    { year: 2023, value: 118 },
    { year: 2024, value: 125 }
  ];
  
  // 测试增速
  const growth = compute.calcGrowth(testData);
  console.log('增速计算:');
  growth.forEach(d => {
    console.log(`  ${d.year}: ${d.value} → ${d.growth !== null ? d.growth.toFixed(2) + '%' : 'N/A'}`);
  });
  
  // 测试指数化
  const indexed = compute.calcIndex(testData, 2020);
  console.log('\n指数化 (2020=100):');
  indexed.forEach(d => {
    console.log(`  ${d.year}: ${d.index.toFixed(2)}`);
  });
  
  // 测试 CAGR
  const cagr = compute.calcCAGR(testData);
  console.log(`\nCAGR (2020-2024): ${cagr.toFixed(2)}%`);
  
  // 测试算术平均
  const mean = compute.calcArithmeticMean(testData.map(d => d.value));
  console.log(`算术平均值：${mean.toFixed(2)}`);
  
  // 测试加权平均
  const countryData = [
    { country: 'A', countryName: '国家 A', data: [{year: 2020, value: 5}, {year: 2021, value: 6}] },
    { country: 'B', countryName: '国家 B', data: [{year: 2020, value: 3}, {year: 2021, value: 4}] }
  ];
  const weightData = [
    { country: 'A', data: [{year: 2020, weight: 100}, {year: 2021, weight: 110}] },
    { country: 'B', data: [{year: 2020, weight: 50}, {year: 2021, weight: 55}] }
  ];
  const weighted = compute.calcWeightedAverage(countryData, weightData);
  console.log('\n加权平均:');
  weighted.forEach(d => {
    console.log(`  ${d.year}: ${d.weightedAvg.toFixed(2)}`);
  });
  
  console.log('\n' + '─'.repeat(50));
  console.log('✅ 所有测试完成\n');
}

// 运行测试
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests, testCases };
