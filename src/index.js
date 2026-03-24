#!/usr/bin/env node
/**
 * IMF WEO Analyzer - 主入口
 * IMF 世界经济展望数据库分析工具
 */

const path = require('path');
const query = require('./query');
const compute = require('./compute');
const chart = require('./chart');

// 自动初始化索引
query.initIndex();

/**
 * 解析用户自然语言查询
 * @param {string} input - 用户输入
 * @returns {Object} 解析结果
 */
function parseQuery(input) {
  const lower = input.toLowerCase();
  
  // 检测意图
  const intent = detectIntent(lower);
  
  // 提取实体
  const entities = extractEntities(input);
  
  return { intent, entities, raw: input };
}

/**
 * 检测用户意图
 */
function detectIntent(input) {
  // 先检查定义查询（优先级高）
  if (/(定义 | 是什么 | 含义|definition|mean)/.test(input)) {
    return 'define';
  }
  // 检查国家备注
  if (/(备注 | 说明 | 财政年度 |fiscal year|note)/.test(input) && !/(画图 | 图表)/.test(input)) {
    return 'note';
  }
  // 检查列表
  if (/(列表 | 所有 | 可用|list|available)/.test(input)) {
    return 'list';
  }
  // 检查画图
  if (/(画图 | 图表 | 可视化 | plot|chart|graph)/.test(input)) {
    return 'chart';
  }
  // 检查计算
  if (/(计算 | 增速 | 平均 | 指数 | 加权|calc|growth|average|index|weighted)/.test(input)) {
    return 'compute';
  }
  return 'query';
}

/**
 * 提取查询实体
 */
function extractEntities(input) {
  const entities = {
    countries: [],
    indicator: null,
    years: null,
    computeType: null
  };
  
  // 提取年份范围
  const yearMatch = input.match(/(\d{4})\s*[-–—到至]\s*(\d{4})/);
  if (yearMatch) {
    entities.years = [parseInt(yearMatch[1]), parseInt(yearMatch[2])];
  } else {
    const singleYear = input.match(/\b(19\d{2}|20\d{2})\b/);
    if (singleYear) {
      entities.years = [parseInt(singleYear[1])];
    }
  }
  
  // 提取国家（通过别名匹配）
  const countryAliases = query.COUNTRY_ALIASES();
  for (const [alias, codes] of Object.entries(countryAliases)) {
    if (input.toLowerCase().includes(alias)) {
      entities.countries = codes;
      break;
    }
  }
  
  // 如果没有匹配到国家组，尝试提取单个国家
  if (entities.countries.length === 0) {
    const countries = query.listCountries();
    for (const country of countries) {
      // 支持中文和英文名称匹配
      if (input.includes(country.name) || 
          input.includes(country.code) ||
          input.toLowerCase().includes(country.name.toLowerCase())) {
        entities.countries.push(country.code);
      }
    }
  }
  
  // 提取指标
  const indicatorAliases = query.INDICATOR_ALIASES();
  for (const [alias, code] of Object.entries(indicatorAliases)) {
    if (input.toLowerCase().includes(alias)) {
      const info = query.resolveIndicator(code);
      if (info && !info.multiple) {
        entities.indicator = code;
        break;
      }
    }
  }
  
  // 提取计算类型
  if (/(增速 | 增长率|growth)/.test(input)) {
    entities.computeType = 'growth';
  } else if (/(指数 |index)/.test(input)) {
    entities.computeType = 'index';
  } else if (/(平均|average|mean)/.test(input)) {
    entities.computeType = 'average';
  } else if (/(加权|weighted)/.test(input)) {
    entities.computeType = 'weighted';
  }
  
  return entities;
}

/**
 * 处理查询请求
 * @param {string} input - 用户输入
 * @param {Object} options - 选项
 * @returns {Promise<Object>} 结果
 */
async function handle(input, options = {}) {
  const { outputDir = path.join(__dirname, '../output') } = options;
  
  const parsed = parseQuery(input);
  let { intent, entities } = parsed;
  
  // 强制检测意图（优先级：define > note > list > chart > compute > query）
  // 使用 includes 替代正则，避免中文字符匹配问题
  
  if (input.includes('定义') || input.includes('是什么') || input.includes('含义') || input.toLowerCase().includes('definition')) {
    intent = 'define';
  } else if ((input.includes('备注') || input.includes('财政年度') || input.toLowerCase().includes('fiscal year')) && 
             !input.includes('画图') && !input.includes('图表')) {
    intent = 'note';
  } else if (input.includes('列表') || input.includes('所有可用') || input.toLowerCase().includes('list all')) {
    intent = 'list';
  } else if (input.includes('画图') || input.includes('图表') || input.includes('可视化') || 
             input.toLowerCase().includes('plot') || input.toLowerCase().includes('chart')) {
    intent = 'chart';
  } else if ((input.includes('计算') || input.includes('增速') || input.includes('平均') || 
              input.includes('指数') || input.includes('加权')) && 
             !input.includes('查询') && !input.includes('画出')) {
    intent = 'compute';
  }
  
  console.log(`🔍 意图：${intent}`);
  console.log(`📍 实体：`, entities);
  
  switch (intent) {
    case 'define':
      return handleDefine(entities, input);
    
    case 'note':
      return handleNote(entities, input);
    
    case 'list':
      return handleList(entities, input);
    
    case 'chart':
    case 'compute':
    case 'query':
    default:
      return handleQueryWithChart(entities, outputDir);
  }
}

/**
 * 处理定义查询
 */
function handleDefine(entities, rawInput) {
  let indicator = entities.indicator;
  
  // 如果没有解析到指标，尝试从原始输入中猜测
  if (!indicator && rawInput) {
    indicator = guessIndicatorFromInput(rawInput);
  }
  
  // 仍然没有，尝试提取关键词
  if (!indicator && rawInput) {
    const keywords = rawInput.replace(/定义 | 是什么 | 含义/g, '').trim();
    if (keywords) {
      const info = query.resolveIndicator(keywords);
      if (info && !info.multiple) {
        indicator = info.code;
      }
    }
  }
  
  if (!indicator) {
    return {
      success: false,
      message: '请指定要查询定义的指标',
      hint: '例如：primary fiscal deficit、政府债务、通胀率'
    };
  }
  
  const definition = query.getDefinition(indicator);
  
  if (!definition) {
    return {
      success: false,
      message: `未找到指标 "${indicator}" 的定义`
    };
  }
  
  return {
    success: true,
    type: 'definition',
    data: {
      code: indicator,
      name: definition.name,
      unit: definition.unit,
      category: definition.category,
      description: definition.description,
      formula: definition.formula,
      interpretation: definition.interpretation
    }
  };
}

/**
 * 处理国家备注查询
 */
function handleNote(entities, rawInput) {
  let country = entities.countries[0];
  
  // 如果没有解析到国家，尝试从输入中提取
  if (!country && rawInput) {
    const countries = query.listCountries();
    for (const c of countries) {
      if (rawInput.includes(c.name) ||
          rawInput.includes(c.code) ||
          rawInput.toLowerCase().includes(c.name.toLowerCase())) {
        country = c.code;
        break;
      }
    }
  }
  
  if (!country) {
    return {
      success: false,
      message: '请指定要查询备注的国家',
      hint: '例如：Bangladesh、中国、USA'
    };
  }
  
  const note = query.getCountryNote(country);
  const countryInfo = query.listCountries().find(c => c.code === country);
  
  return {
    success: true,
    type: 'note',
    data: {
      country: country,
      countryName: countryInfo?.name || country,
      fiscalYear: note.fiscalYear,
      note: note.note
    }
  };
}

/**
 * 处理列表查询
 */
function handleList(entities, rawInput) {
  const rawLower = rawInput ? rawInput.toLowerCase() : '';
  
  if (rawInput && (rawInput.includes('指标') || rawLower.includes('indicator'))) {
    const indicators = query.listIndicators(entities.category);
    return {
      success: true,
      type: 'list',
      category: 'indicators',
      data: indicators.slice(0, 50)
    };
  }
  
  if (rawInput && (rawInput.includes('国家') || rawLower.includes('country') || rawInput.includes('所有'))) {
    const countries = query.listCountries();
    return {
      success: true,
      type: 'list',
      category: 'countries',
      data: countries.slice(0, 50)
    };
  }
  
  // 默认返回指标列表
  const indicators = query.listIndicators();
  return {
    success: true,
    type: 'list',
    category: 'indicators',
    data: indicators.slice(0, 50)
  };
}

/**
 * 处理查询并生成图表
 */
function handleQueryWithChart(entities, outputDir) {
  const { countries, indicator, years, computeType } = entities;
  
  // 验证必要参数
  if (!countries || countries.length === 0) {
    return {
      success: false,
      message: '请指定国家或地区',
      hint: '例如：中国、美国、金砖五国、G7'
    };
  }
  
  if (!indicator) {
    return {
      success: false,
      message: '请指定指标',
      hint: '例如：GDP 增速、通胀率、政府债务',
      suggestions: Object.keys(query.INDICATOR_ALIASES()).slice(0, 10)
    };
  }
  
  // 查询数据
  let queryResult;
  try {
    queryResult = query.queryData({
      countries,
      indicator,
      years: years || [2020, 2030]
    });
  } catch (err) {
    return {
      success: false,
      message: err.message
    };
  }
  
  // 处理歧义
  if (queryResult.error === 'AMBIGUOUS_INDICATOR') {
    return {
      success: false,
      type: 'ambiguous',
      message: queryResult.message,
      options: queryResult.options
    };
  }
  
  // 处理无数据
  if (queryResult.error === 'NO_DATA') {
    return {
      success: false,
      message: queryResult.message
    };
  }
  
  // 计算处理
  let computeResult = null;
  let weightedData = null;
  
  if (computeType) {
    const pipeline = compute.createPipeline(queryResult);
    
    switch (computeType) {
      case 'growth':
        pipeline.growth();
        break;
      case 'index':
        pipeline.index(years ? years[0] : null);
        break;
      case 'weighted':
        // 需要权重数据
        const pppResult = query.queryData({
          countries,
          indicator: 'NGDPD_PPP',
          years: years || [2020, 2030]
        });
        if (pppResult.success) {
          weightedData = compute.calcWeightedAverage(
            queryResult.data.map(d => ({
              country: d.country,
              countryName: d.countryName,
              data: d.data.map(p => ({ year: p.year, value: p.value }))
            })),
            pppResult.data.map(d => ({
              country: d.country,
              data: d.data.map(p => ({ year: p.year, weight: p.value }))
            }))
          );
        }
        break;
    }
    
    computeResult = pipeline.get('all');
  }
  
  // 生成图表
  const chartPath = path.join(outputDir, `chart_${Date.now()}.html`);
  
  try {
    chart.generateChart({
      metadata: queryResult.metadata,
      data: queryResult.data.map(d => ({
        country: d.country,
        countryName: d.countryName,
        data: d.data.map(p => ({
          year: p.year,
          value: p.value,
          isForecast: p.isForecast
        }))
      }))
    }, {
      title: `${queryResult.metadata.indicator.name} - ${queryResult.metadata.countries.map(c => c.name).join(', ')}`,
      subtitle: `${queryResult.metadata.years[0]}-${queryResult.metadata.years[queryResult.metadata.years.length - 1]}`,
      forecastYear: queryResult.metadata.forecastStartYear,
      weightedData: weightedData ? weightedData.map(d => ({
        year: d.year,
        weightedAvg: d.weightedAvg,
        isForecast: d.isForecast
      })) : null,
      output: chartPath
    });
  } catch (err) {
    console.error('图表生成失败:', err);
  }
  
  // 构建返回结果
  return {
    success: true,
    type: 'query_with_chart',
    data: {
      query: queryResult,
      compute: computeResult,
      weighted: weightedData,
      chartPath: chartPath
    },
    summary: generateSummary(queryResult, computeResult, weightedData)
  };
}

/**
 * 生成结果摘要
 */
function generateSummary(queryResult, computeResult, weightedData) {
  const summary = {
    indicator: queryResult.metadata.indicator.name,
    unit: queryResult.metadata.indicator.unit,
    countries: [],
    weighted: null
  };
  
  // 各国摘要
  for (const country of queryResult.data) {
    const cagr = compute.calcCAGR(country.data);
    const mean = compute.calcArithmeticMean(country.data.map(d => d.value));
    
    summary.countries.push({
      name: country.countryName,
      code: country.country,
      cagr: cagr !== null ? cagr.toFixed(2) + '%' : 'N/A',
      mean: mean !== null ? mean.toFixed(2) : 'N/A',
      latestValue: country.data[country.data.length - 1]?.value,
      latestYear: country.data[country.data.length - 1]?.year
    });
  }
  
  // 加权平均摘要
  if (weightedData) {
    const cagr = compute.calcCAGR(weightedData);
    summary.weighted = {
      cagr: cagr !== null ? cagr.toFixed(2) + '%' : 'N/A'
    };
  }
  
  return summary;
}

/**
 * 从输入中猜测指标
 */
function guessIndicatorFromInput(input) {
  if (!input) return null;
  
  const aliases = query.INDICATOR_ALIASES();
  const lowerInput = input.toLowerCase();
  
  // 清理输入，移除查询关键词
  const cleaned = lowerInput
    .replace(/定义 | 是什么 | 含义 | 意思|definition/g, '')
    .replace(/查询 | 显示 | 获取/g, '')
    .trim();
  
  // 分词匹配（处理 "primary fiscal deficit" → ["primary", "fiscal", "deficit"]）
  const words = cleaned.split(/\s+/).filter(w => w.length > 2);
  
  // 查找包含所有关键词的别名
  for (const [alias, code] of Object.entries(aliases)) {
    const matchCount = words.filter(w => alias.includes(w)).length;
    if (matchCount >= Math.min(2, words.length) && matchCount > 0) {
      return code;
    }
  }
  
  // 尝试简单包含匹配
  for (const [alias, code] of Object.entries(aliases)) {
    if (cleaned.includes(alias) || lowerInput.includes(alias)) {
      return code;
    }
  }
  
  return null;
}

/**
 * 获取帮助信息
 */
function getHelp() {
  return `
IMF WEO Analyzer - IMF 世界经济展望数据库分析工具

用法:
  node index.js "查询内容"

示例:
  # 数据查询
  node index.js "中国 2020-2030 年 GDP 增速"
  node index.js "金砖五国通胀率"
  
  # 画图
  node index.js "画出金砖五国 2020-2030 年 GDP 增速折线图"
  
  # 计算
  node index.js "计算中国 GDP 2020-2025 年平均增速"
  node index.js "以 2020 年为 100 指数化美国 GDP"
  
  # 定义查询
  node index.js "primary fiscal deficit 定义是什么"
  
  # 国家备注
  node index.js "Bangladesh GDP 财政年度说明"
  
  # 列表
  node index.js "列出所有可用指标"
  node index.js "列出所有国家"

常用指标别名:
  - gdp growth / gdp 增速：实际 GDP 增长率
  - inflation / 通胀：CPI 通胀率
  - government debt / 政府债务：政府总债务/GDP
  - current account / 经常账户：经常账户余额/GDP

常用国家组:
  - brics / 金砖五国：巴西、中国、印度、俄罗斯、南非
  - g7 / 七国集团：美日德英法意加
  - g20 / 二十国集团
  - advanced economies / 发达经济体
  - emerging markets / 新兴市场
`;
}

// CLI 入口
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(getHelp());
    process.exit(0);
  }
  
  const input = args.join(' ');
  
  handle(input).then(result => {
    if (result.success) {
      console.log('\n✅ 查询成功\n');
      
      if (result.type === 'definition') {
        console.log(`指标：${result.data.code}`);
        console.log(`名称：${result.data.name}`);
        console.log(`单位：${result.data.unit}`);
        console.log(`类别：${result.data.category}`);
        console.log(`定义：${result.data.description}`);
        if (result.data.formula) console.log(`公式：${result.data.formula}`);
        if (result.data.interpretation) console.log(`解读：${result.data.interpretation}`);
      } else if (result.type === 'note') {
        console.log(`国家：${result.data.countryName} (${result.data.country})`);
        console.log(`财政年度：${result.data.fiscalYear}`);
        console.log(`备注：${result.data.note}`);
      } else if (result.type === 'list') {
        console.log(`${result.category === 'indicators' ? '指标' : '国家'}列表:\n`);
        result.data.forEach((item, i) => {
          if (result.category === 'indicators') {
            console.log(`  ${i+1}. ${item.code} - ${item.name} (${item.unit})`);
          } else {
            console.log(`  ${i+1}. ${item.code} - ${item.name}`);
          }
        });
      } else if (result.type === 'query_with_chart') {
        console.log(`指标：${result.summary.indicator}`);
        console.log(`单位：${result.summary.unit}`);
        console.log(`\n各国数据摘要:`);
        result.summary.countries.forEach(c => {
          console.log(`  ${c.name}: CAGR=${c.cagr}, 均值=${c.mean}, 最新值=${c.latestValue} (${c.latestYear}年)`);
        });
        if (result.summary.weighted) {
          console.log(`\n加权平均：CAGR=${result.summary.weighted.cagr}`);
        }
        console.log(`\n📊 图表已生成：${result.data.chartPath}`);
      }
    } else {
      console.log('\n❌ 查询失败\n');
      console.log(result.message);
      if (result.hint) console.log(`提示：${result.hint}`);
      if (result.suggestions) console.log(`建议：${result.suggestions.join(', ')}`);
      if (result.options) {
        console.log('\n请选择：');
        result.options.forEach((o, i) => {
          console.log(`  ${i+1}. ${o.code} - ${o.name} (${o.unit})`);
        });
      }
    }
  }).catch(err => {
    console.error('错误:', err.message);
    process.exit(1);
  });
}

module.exports = {
  handle,
  parseQuery,
  query,
  compute,
  chart,
  getHelp
};
