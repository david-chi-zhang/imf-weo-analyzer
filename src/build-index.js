#!/usr/bin/env node
/**
 * IMF WEO 索引构建脚本
 * 从 CSV 文件生成轻量级索引，用于快速查询
 */

const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

// 配置
const CONFIG = {
  csvPath: process.argv[2] || '/home/admin/Downloads/IMF WEO Oct 2025_updated.csv',
  outputPath: process.argv[3] || path.join(__dirname, '../data'),
  forecastStartYear: 2025  // 预测起始年份
};

// 指标类别映射
const INDICATOR_CATEGORIES = {
  'GDP': ['NGDP', 'GDP', 'Gross domestic product'],
  'inflation': ['CPI', 'inflation', 'Consumer price'],
  'fiscal': ['government', 'fiscal', 'GGX', 'GGR', 'GGXWDG'],
  'trade': ['current account', 'export', 'import', 'BCA', 'trade'],
  'employment': ['employ', 'unemploy', 'labor', 'LE', 'LF'],
  'population': ['population', 'LP'],
  'commodity': ['price', 'commodity', 'oil', 'gas', 'coal'],
  'debt': ['debt', 'GGXWDG'],
  'investment': ['investment', 'capital formation', 'NID']
};

// 常用指标别名
const INDICATOR_ALIASES = {
  // GDP 相关
  'gdp growth': 'NGDP_RPCH',
  'gdp 增速': 'NGDP_RPCH',
  'gdp 增长率': 'NGDP_RPCH',
  '实际 gdp 增速': 'NGDP_RPCH',
  'real gdp growth': 'NGDP_RPCH',
  'gdp': 'NGDPD',
  '名义 gdp': 'NGDPD',
  'gdp 现价': 'NGDPD',
  '人均 gdp': 'NGDPDPC',
  'gdp per capita': 'NGDPDPC',
  'ppp gdp': 'NGDPD_PPP',
  '购买力平价 gdp': 'NGDPD_PPP',
  
  // 通胀相关
  'inflation': 'PCPIPCH',
  '通胀': 'PCPIPCH',
  '通胀率': 'PCPIPCH',
  'cpi': 'PCPIPCH',
  '消费者价格指数': 'PCPIPCH',
  'core inflation': 'PCPICH',
  
  // 财政相关
  'fiscal balance': 'GGXCNL_NGDP',
  '财政余额': 'GGXCNL_NGDP',
  'primary balance': 'GGXONLB_NGDP',
  'primary fiscal balance': 'GGXONLB_NGDP',
  '基本财政余额': 'GGXONLB_NGDP',
  'primary deficit': 'GGXONLB_NGDP',
  '基本财政赤字': 'GGXONLB_NGDP',
  'government debt': 'GGXWDG_NGDP',
  '政府债务': 'GGXWDG_NGDP',
  '债务/gdp': 'GGXWDG_NGDP',
  'government revenue': 'GGR_NGDP',
  '政府收入': 'GGR_NGDP',
  'government expenditure': 'GGX_NGDP',
  '政府支出': 'GGX_NGDP',
  
  // 贸易相关
  'current account': 'BCA_NGDPD',
  '经常账户': 'BCA_NGDPD',
  '经常账户余额': 'BCA_NGDPD',
  'exports': 'BX',
  '出口': 'BX',
  'imports': 'BM',
  '进口': 'BM',
  
  // 就业相关
  'unemployment': 'LUR',
  '失业率': 'LUR',
  'employment': 'LE',
  '就业': 'LE',
  'labor force': 'LF',
  '劳动力': 'LF',
  
  // 人口相关
  'population': 'LP',
  '人口': 'LP',
  
  // 商品相关
  'oil price': 'POILBRE',
  '油价': 'POILBRE',
  '原油价格': 'POILBRE',
  'gas price': 'PNGASJP',
  '天然气价格': 'PNGASJP',
  'coal price': 'PCOALSA',
  '煤炭价格': 'PCOALSA',
  'copper price': 'PCOPP',
  '铜价': 'PCOPP'
};

// 国家组别名
const COUNTRY_ALIASES = {
  // ========== 金砖国家群组 ==========
  // 金砖五国 (BRICS-5) - 原始成员国
  'brics': ['BRA', 'CHN', 'IND', 'RUS', 'ZAF'],
  'brics-5': ['BRA', 'CHN', 'IND', 'RUS', 'ZAF'],
  '金砖五国': ['BRA', 'CHN', 'IND', 'RUS', 'ZAF'],
  'original brics': ['BRA', 'CHN', 'IND', 'RUS', 'ZAF'],
  
  // 金砖国家 (BRICS / BRICS-11) - 2024 年扩展后
  'brics-11': ['BRA', 'CHN', 'IND', 'RUS', 'ZAF', 'SAU', 'ARE', 'EGY', 'IRN', 'ETH', 'IDN'],
  '金砖国家': ['BRA', 'CHN', 'IND', 'RUS', 'ZAF', 'SAU', 'ARE', 'EGY', 'IRN', 'ETH', 'IDN'],
  'expanded brics': ['BRA', 'CHN', 'IND', 'RUS', 'ZAF', 'SAU', 'ARE', 'EGY', 'IRN', 'ETH', 'IDN'],
  
  // 新开发银行成员国 (NDB Members)
  'ndb': ['BRA', 'CHN', 'IND', 'RUS', 'ZAF', 'BGD', 'ARE', 'EGY', 'DZA'],
  'ndb members': ['BRA', 'CHN', 'IND', 'RUS', 'ZAF', 'BGD', 'ARE', 'EGY', 'DZA'],
  '新开行': ['BRA', 'CHN', 'IND', 'RUS', 'ZAF', 'BGD', 'ARE', 'EGY', 'DZA'],
  '新开行成员国': ['BRA', 'CHN', 'IND', 'RUS', 'ZAF', 'BGD', 'ARE', 'EGY', 'DZA'],
  '新开发银行': ['BRA', 'CHN', 'IND', 'RUS', 'ZAF', 'BGD', 'ARE', 'EGY', 'DZA'],
  '新开发银行成员国': ['BRA', 'CHN', 'IND', 'RUS', 'ZAF', 'BGD', 'ARE', 'EGY', 'DZA'],
  'new development bank': ['BRA', 'CHN', 'IND', 'RUS', 'ZAF', 'BGD', 'ARE', 'EGY', 'DZA'],
  
  // ========== 传统国家组 ==========
  'g7': ['USA', 'JPN', 'DEU', 'GBR', 'FRA', 'ITA', 'CAN'],
  '七国集团': ['USA', 'JPN', 'DEU', 'GBR', 'FRA', 'ITA', 'CAN'],
  'g20': ['ARG', 'AUS', 'BRA', 'CAN', 'CHN', 'FRA', 'DEU', 'IND', 'IDN', 'ITA', 'JPN', 'KOR', 'MEX', 'RUS', 'SAU', 'ZAF', 'TUR', 'GBR', 'USA', 'EU'],
  '二十国集团': ['ARG', 'AUS', 'BRA', 'CAN', 'CHN', 'FRA', 'DEU', 'IND', 'IDN', 'ITA', 'JPN', 'KOR', 'MEX', 'RUS', 'SAU', 'ZAF', 'TUR', 'GBR', 'USA', 'EU'],
  'euro area': ['EUR'],
  '欧元区': ['EUR'],
  'advanced economies': ['G110'],
  '发达经济体': ['G110'],
  'emerging markets': ['G200'],
  '新兴市场': ['G200'],
  'asia': ['G142'],
  '亚洲': ['G142'],
  'europe': ['G150'],
  '欧洲': ['G150'],
  'africa': ['G160'],
  '非洲': ['G160'],
  'americas': ['G170'],
  '美洲': ['G170'],
  
  // ========== 单个国家 ==========
  '中国': ['CHN'],
  'china': ['CHN'],
  '美国': ['USA'],
  'united states': ['USA'],
  'usa': ['USA'],
  '日本': ['JPN'],
  'japan': ['JPN'],
  '德国': ['DEU'],
  'germany': ['DEU'],
  '英国': ['GBR'],
  'united kingdom': ['GBR'],
  'uk': ['GBR'],
  '法国': ['FRA'],
  'france': ['FRA'],
  '印度': ['IND'],
  'india': ['IND'],
  '巴西': ['BRA'],
  'brazil': ['BRA'],
  '俄罗斯': ['RUS'],
  'russia': ['RUS'],
  '南非': ['ZAF'],
  'south africa': ['ZAF'],
  '韩国': ['KOR'],
  'korea': ['KOR'],
  '意大利': ['ITA'],
  'italy': ['ITA'],
  '加拿大': ['CAN'],
  'canada': ['CAN'],
  '澳大利亚': ['AUS'],
  'australia': ['AUS'],
  '孟加拉': ['BGD'],
  'bangladesh': ['BGD'],
  '沙特': ['SAU'],
  'saudi arabia': ['SAU'],
  '阿联酋': ['ARE'],
  'uae': ['ARE'],
  '埃及': ['EGY'],
  'egypt': ['EGY'],
  '伊朗': ['IRN'],
  'iran': ['IRN'],
  '埃塞俄比亚': ['ETH'],
  'ethiopia': ['ETH'],
  '印尼': ['IDN'],
  'indonesia': ['IDN'],
  '阿尔及利亚': ['DZA'],
  'algeria': ['DZA']
};

// 国家组定义说明（用于文档和备注）
const COUNTRY_GROUP_DEFINITIONS = {
  'BRICS-5': {
    name: '金砖五国',
    nameEn: 'BRICS Original 5',
    members: ['BRA', 'CHN', 'IND', 'RUS', 'ZAF'],
    established: '2009-2010',
    note: '原始金砖五国，2009 年成立'
  },
  'BRICS-11': {
    name: '金砖国家（扩展后）',
    nameEn: 'BRICS Expanded (BRICS-11)',
    members: ['BRA', 'CHN', 'IND', 'RUS', 'ZAF', 'SAU', 'ARE', 'EGY', 'IRN', 'ETH', 'IDN'],
    established: '2024',
    note: '2024 年扩展后的金砖国家，新增沙特、阿联酋、埃及、伊朗、埃塞俄比亚、印尼'
  },
  'NDB': {
    name: '新开发银行成员国',
    nameEn: 'New Development Bank Members',
    members: ['BRA', 'CHN', 'IND', 'RUS', 'ZAF', 'BGD', 'ARE', 'EGY', 'DZA'],
    established: '2014',
    note: '新开发银行（NDB）成员国，包括创始成员和后续加入成员'
  }
};

// 财政年度特殊国家
const FISCAL_YEAR_NOTES = {
  'BGD': { fiscalYear: 'July-June', note: '孟加拉国使用财政年度 FY20XX/YY 格式，如 FY2024/25 表示 2024 年 7 月至 2025 年 6 月' },
  'AUS': { fiscalYear: 'July-June', note: '澳大利亚使用财政年度 7 月至次年 6 月' },
  'CAN': { fiscalYear: 'April-March', note: '加拿大联邦政府使用财政年度 4 月至次年 3 月' },
  'GBR': { fiscalYear: 'April-March', note: '英国使用财政年度 4 月至次年 3 月' },
  'IND': { fiscalYear: 'April-March', note: '印度使用财政年度 4 月至次年 3 月' },
  'JPN': { fiscalYear: 'April-March', note: '日本使用财政年度 4 月至次年 3 月' },
  'NZL': { fiscalYear: 'July-June', note: '新西兰使用财政年度 7 月至次年 6 月' },
  'USA': { fiscalYear: 'October-September', note: '美国联邦政府使用财政年度 10 月至次年 9 月' },
  'default': { fiscalYear: 'Calendar year', note: '大多数国家使用日历年 1-12 月' }
};

/**
 * 主函数：构建索引
 */
async function buildIndex() {
  console.log('🔧 开始构建 IMF WEO 索引...');
  console.log(`📁 CSV 文件：${CONFIG.csvPath}`);
  console.log(`📂 输出目录：${CONFIG.outputPath}`);
  
  // 确保输出目录存在
  if (!fs.existsSync(CONFIG.outputPath)) {
    fs.mkdirSync(CONFIG.outputPath, { recursive: true });
  }
  
  const countries = new Map();
  const indicators = new Map();
  const seriesData = [];
  
  // 读取 CSV
  const rows = await readCSV(CONFIG.csvPath);
  console.log(`📊 读取到 ${rows.length} 行数据`);
  
  // 处理每一行
  for (const row of rows) {
    const countryCode = row['COUNTRY.ID'];
    const countryName = row['COUNTRY'];
    const indicatorCode = row['INDICATOR.ID'];
    const indicatorName = row['INDICATOR'];
    const seriesCode = row['SERIES_CODE'];
    const unit = row['UNIT'] || '';
    const updateDate = row['UPDATE_DATE'] || '';
    const latestActual = row['LATEST_ACTUAL_ANNUAL_DATA'] || '';
    const baseYear = row['BASE_YEAR'] || '';
    const fullDescription = row['FULL_DESCRIPTION'] || '';
    
    // 收集国家信息
    if (!countries.has(countryCode)) {
      countries.set(countryCode, {
        name: countryName,
        indicators: new Set(),
        seriesCodes: new Set()
      });
    }
    countries.get(countryCode).indicators.add(indicatorCode);
    countries.get(countryCode).seriesCodes.add(seriesCode);
    
    // 收集指标信息
    if (!indicators.has(indicatorCode)) {
      indicators.set(indicatorCode, {
        name: indicatorName,
        unit: unit,
        category: categorizeIndicator(indicatorName),
        countries: new Set(),
        description: fullDescription.substring(0, 200) || '',
        baseYear: baseYear || ''
      });
    }
    indicators.get(indicatorCode).countries.add(countryCode);
    
    // 提取时间序列数据（只保存有数据的年份）
    const timeSeries = {};
    for (let year = 1980; year <= 2030; year++) {
      const value = row[String(year)];
      if (value && value.trim() !== '') {
        timeSeries[year] = parseFloat(value);
      }
    }
    
    if (Object.keys(timeSeries).length > 0) {
      seriesData.push({
        seriesCode,
        countryCode,
        indicatorCode,
        data: timeSeries,
        latestActual
      });
    }
  }
  
  // 构建索引文件
  console.log('\n📝 生成索引文件...');
  
  // 1. 国家索引
  const countryIndex = {};
  for (const [code, info] of countries) {
    countryIndex[code] = {
      name: info.name,
      indicators: Array.from(info.indicators),
      seriesCount: info.seriesCodes.size
    };
  }
  
  // 2. 指标索引
  const indicatorIndex = {};
  for (const [code, info] of indicators) {
    indicatorIndex[code] = {
      name: info.name,
      unit: info.unit,
      category: info.category,
      countryCount: info.countries.size,
      description: info.description,
      baseYear: info.baseYear
    };
  }
  
  // 3. 完整索引
  const fullIndex = {
    metadata: {
      source: 'IMF World Economic Outlook Database',
      version: 'Oct 2025',
      buildDate: new Date().toISOString(),
      forecastStartYear: CONFIG.forecastStartYear,
      totalCountries: countries.size,
      totalIndicators: indicators.size,
      totalSeries: seriesData.length
    },
    countries: countryIndex,
    indicators: indicatorIndex,
    aliases: {
      indicators: INDICATOR_ALIASES,
      countries: COUNTRY_ALIASES
    },
    countryGroups: COUNTRY_GROUP_DEFINITIONS,
    fiscalYearNotes: FISCAL_YEAR_NOTES
  };
  
  // 4. 序列数据索引（用于快速查找）
  const seriesIndex = {};
  for (const series of seriesData) {
    const key = `${series.countryCode}.${series.indicatorCode}`;
    seriesIndex[key] = {
      seriesCode: series.seriesCode,
      data: series.data,
      latestActual: series.latestActual
    };
  }
  
  // 写入文件
  const indexFile = path.join(CONFIG.outputPath, 'index.json');
  const seriesFile = path.join(CONFIG.outputPath, 'series.json');
  const definitionsFile = path.join(CONFIG.outputPath, 'definitions.json');
  
  fs.writeFileSync(indexFile, JSON.stringify(fullIndex, null, 2));
  fs.writeFileSync(seriesFile, JSON.stringify(seriesIndex, null, 2));
  fs.writeFileSync(definitionsFile, JSON.stringify(generateDefinitions(indicators), null, 2));
  
  console.log(`\n✅ 索引构建完成!`);
  console.log(`   📄 ${indexFile}`);
  console.log(`   📄 ${seriesFile}`);
  console.log(`   📄 ${definitionsFile}`);
  console.log(`\n📊 统计信息:`);
  console.log(`   国家数量：${countries.size}`);
  console.log(`   指标数量：${indicators.size}`);
  console.log(`   时间序列：${seriesData.length}`);
  console.log(`   指标别名：${Object.keys(INDICATOR_ALIASES).length}`);
  console.log(`   国家组别名：${Object.keys(COUNTRY_ALIASES).length}`);
}

/**
 * 读取 CSV 文件
 */
function readCSV(filePath) {
  return new Promise((resolve, reject) => {
    const rows = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => rows.push(row))
      .on('end', () => resolve(rows))
      .on('error', reject);
  });
}

/**
 * 指标分类
 */
function categorizeIndicator(name) {
  const lowerName = name.toLowerCase();
  for (const [category, keywords] of Object.entries(INDICATOR_CATEGORIES)) {
    if (keywords.some(kw => lowerName.includes(kw.toLowerCase()))) {
      return category;
    }
  }
  return 'other';
}

/**
 * 生成指标定义
 */
function generateDefinitions(indicators) {
  const definitions = {};
  
  for (const [code, info] of indicators) {
    definitions[code] = {
      name: info.name,
      unit: info.unit,
      category: info.category,
      description: info.description,
      baseYear: info.baseYear,
      formula: getFormula(code),
      interpretation: getInterpretation(code)
    };
  }
  
  return definitions;
}

/**
 * 获取指标计算公式
 */
function getFormula(code) {
  const formulas = {
    'NGDP_RPCH': '实际 GDP 增长率 = (本年实际 GDP - 上年实际 GDP) / 上年实际 GDP × 100%',
    'PCPIPCH': '通胀率 = (本年 CPI - 上年 CPI) / 上年 CPI × 100%',
    'GGXWDG_NGDP': '政府债务/GDP = 政府总债务 / 名义 GDP × 100%',
    'BCA_NGDPD': '经常账户/GDP = 经常账户余额 / 名义 GDP × 100%',
    'GGXONLB_NGDP': '基本财政余额/GDP = (财政收入 - 财政支出（不含利息）) / 名义 GDP × 100%',
    'GGXCNL_NGDP': '净借贷/GDP = (财政收入 - 财政支出) / 名义 GDP × 100%',
    'LUR': '失业率 = 失业人口 / 劳动力人口 × 100%'
  };
  return formulas[code] || null;
}

/**
 * 获取指标解读
 */
function getInterpretation(code) {
  const interpretations = {
    'NGDP_RPCH': '正值表示经济增长，负值表示经济收缩。通常 2-3% 以上为健康增长。',
    'PCPIPCH': '正值表示通胀，负值表示通缩。央行目标通常为 2% 左右。',
    'GGXWDG_NGDP': '衡量政府债务可持续性。60% 常被视为警戒线（马斯特里赫特条约）。',
    'BCA_NGDPD': '正值表示顺差，负值表示逆差。持续逆差可能预示外部失衡。',
    'GGXONLB_NGDP': '剔除利息支出的财政余额，更好反映财政政策立场。正数为盈余，负数为赤字。',
    'LUR': '劳动力中失业者的比例。4-6% 通常被视为充分就业水平。'
  };
  return interpretations[code] || null;
}

// 运行
if (require.main === module) {
  buildIndex().catch(console.error);
}

module.exports = { buildIndex, readCSV, INDICATOR_ALIASES, COUNTRY_ALIASES };
