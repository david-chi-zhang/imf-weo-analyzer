/**
 * IMF WEO 数据查询模块
 * 提供快速数据查询功能，支持国家、指标、时间范围筛选
 */

const fs = require('fs');
const path = require('path');

// 加载索引
let INDEX = null;
let SERIES = null;
let DEFINITIONS = null;

/**
 * 初始化：加载索引文件
 */
function initIndex(dataDir = null) {
  if (INDEX && SERIES && DEFINITIONS) return;
  
  const defaultDataDir = path.join(__dirname, '../data');
  const dir = dataDir || defaultDataDir;
  
  try {
    INDEX = JSON.parse(fs.readFileSync(path.join(dir, 'index.json'), 'utf-8'));
    SERIES = JSON.parse(fs.readFileSync(path.join(dir, 'series.json'), 'utf-8'));
    DEFINITIONS = JSON.parse(fs.readFileSync(path.join(dir, 'definitions.json'), 'utf-8'));
  } catch (err) {
    throw new Error(`无法加载索引文件，请先运行 build-index.js: ${err.message}`);
  }
}

/**
 * 解析国家标识（支持名称、代码、组别名）
 */
function resolveCountries(input) {
  initIndex();
  
  if (!input) return [];
  
  const inputs = Array.isArray(input) ? input : [input];
  const result = [];
  
  for (const item of inputs) {
    // 1. 直接是国家代码（3 个大写字母）
    if (typeof item === 'string' && /^[A-Z]{3}$/.test(item)) {
      if (INDEX.countries[item]) {
        result.push({ code: item, name: INDEX.countries[item].name });
        continue;
      }
    }
    
    // 2. 检查国家组别名
    const lowerItem = item.toLowerCase();
    if (INDEX.aliases.countries[lowerItem]) {
      const codes = INDEX.aliases.countries[lowerItem];
      for (const code of codes) {
        if (INDEX.countries[code]) {
          result.push({ code, name: INDEX.countries[code].name });
        }
      }
      continue;
    }
    
    // 3. 在国家名称中查找
    const found = Object.entries(INDEX.countries).find(
      ([, info]) => info.name.toLowerCase().includes(lowerItem) || 
                    lowerItem.includes(info.name.toLowerCase())
    );
    
    if (found) {
      result.push({ code: found[0], name: found[1].name });
    }
  }
  
  return result;
}

/**
 * 解析指标标识（支持名称、代码、别名）
 */
function resolveIndicator(input) {
  initIndex();
  
  if (!input) return null;
  
  const lowerInput = input.toLowerCase().trim();
  
  // 1. 直接是指标代码（大写字母和下划线）
  if (/^[A-Z_]+$/.test(input) && INDEX.indicators[input]) {
    return {
      code: input,
      name: INDEX.indicators[input].name,
      unit: INDEX.indicators[input].unit,
      category: INDEX.indicators[input].category
    };
  }
  
  // 2. 检查指标别名
  if (INDEX.aliases.indicators[lowerInput]) {
    const code = INDEX.aliases.indicators[lowerInput];
    if (INDEX.indicators[code]) {
      return {
        code,
        name: INDEX.indicators[code].name,
        unit: INDEX.indicators[code].unit,
        category: INDEX.indicators[code].category
      };
    }
  }
  
  // 3. 模糊匹配指标名称
  const matches = [];
  for (const [code, info] of Object.entries(INDEX.indicators)) {
    const lowerName = info.name.toLowerCase();
    if (lowerName.includes(lowerInput) || lowerInput.includes(lowerName)) {
      matches.push({
        code,
        name: info.name,
        unit: info.unit,
        category: info.category,
        score: calculateMatchScore(lowerInput, lowerName)
      });
    }
  }
  
  // 按匹配度排序
  matches.sort((a, b) => b.score - a.score);
  
  if (matches.length === 0) return null;
  if (matches.length === 1) return matches[0];
  
  // 多个匹配，返回所有选项
  return { multiple: true, options: matches.slice(0, 5) };
}

/**
 * 计算匹配分数
 */
function calculateMatchScore(query, text) {
  let score = 0;
  
  // 完全包含
  if (text === query) score += 100;
  else if (text.startsWith(query)) score += 50;
  else if (text.includes(query)) score += 30;
  
  // 单词匹配
  const queryWords = query.split(/\s+/);
  const textWords = text.split(/\s+/);
  for (const qw of queryWords) {
    if (textWords.some(tw => tw.includes(qw))) score += 10;
  }
  
  return score;
}

/**
 * 查询数据
 * @param {Object} options - 查询选项
 * @param {string|string[]} options.countries - 国家（名称、代码或数组）
 * @param {string} options.indicator - 指标（名称或代码）
 * @param {number[]} options.years - 年份范围 [start, end] 或数组
 * @param {boolean} options.includeMetadata - 是否包含元数据
 * @returns {Object} 查询结果
 */
function queryData(options = {}) {
  initIndex();
  
  const {
    countries,
    indicator,
    years,
    includeMetadata = true
  } = options;
  
  // 解析国家
  const countryList = resolveCountries(countries);
  if (countryList.length === 0) {
    throw new Error(`未找到国家：${Array.isArray(countries) ? countries.join(', ') : countries}`);
  }
  
  // 解析指标
  const indicatorInfo = resolveIndicator(indicator);
  if (!indicatorInfo) {
    throw new Error(`未找到指标：${indicator}`);
  }
  if (indicatorInfo.multiple) {
    // 多个匹配，返回选项让用户选择
    return {
      error: 'AMBIGUOUS_INDICATOR',
      message: `找到多个匹配的指标，请选择：`,
      options: indicatorInfo.options.map(o => ({
        code: o.code,
        name: o.name,
        unit: o.unit
      }))
    };
  }
  
  // 解析年份
  const yearRange = parseYears(years);
  
  // 提取数据
  const results = [];
  for (const country of countryList) {
    const key = `${country.code}.${indicatorInfo.code}`;
    const series = SERIES[key];
    
    if (!series) {
      continue; // 该国家没有此指标数据
    }
    
    const data = [];
    for (const year of yearRange) {
      if (series.data[year] !== undefined) {
        const isForecast = year >= INDEX.metadata.forecastStartYear;
        data.push({
          year,
          value: series.data[year],
          isForecast
        });
      }
    }
    
    if (data.length > 0) {
      results.push({
        country: country.code,
        countryName: country.name,
        indicator: indicatorInfo.code,
        indicatorName: indicatorInfo.name,
        unit: indicatorInfo.unit,
        data
      });
    }
  }
  
  if (results.length === 0) {
    return {
      error: 'NO_DATA',
      message: '未找到符合条件的数据',
      query: { countries: countryList, indicator: indicatorInfo, years: yearRange }
    };
  }
  
  // 构建返回结果
  const response = {
    success: true,
    metadata: includeMetadata ? {
      source: INDEX.metadata.source,
      version: INDEX.metadata.version,
      forecastStartYear: INDEX.metadata.forecastStartYear,
      indicator: {
        code: indicatorInfo.code,
        name: indicatorInfo.name,
        unit: indicatorInfo.unit,
        category: indicatorInfo.category
      },
      countries: countryList,
      years: yearRange
    } : null,
    data: results
  };
  
  return response;
}

/**
 * 解析年份范围
 */
function parseYears(years) {
  if (!years) {
    // 默认返回所有年份
    return Array.from({ length: 51 }, (_, i) => 1980 + i);
  }
  
  if (Array.isArray(years)) {
    if (years.length === 2 && typeof years[0] === 'number') {
      // [start, end] 范围
      const [start, end] = years;
      return Array.from({ length: end - start + 1 }, (_, i) => start + i);
    }
    // 年份数组
    return years.filter(y => typeof y === 'number');
  }
  
  // 字符串解析
  if (typeof years === 'string') {
    const rangeMatch = years.match(/(\d{4})\s*[-–—]\s*(\d{4})/);
    if (rangeMatch) {
      const start = parseInt(rangeMatch[1]);
      const end = parseInt(rangeMatch[2]);
      return Array.from({ length: end - start + 1 }, (_, i) => start + i);
    }
    
    const singleMatch = years.match(/\d{4}/);
    if (singleMatch) {
      return [parseInt(singleMatch[0])];
    }
  }
  
  return [];
}

/**
 * 获取指标定义
 */
function getDefinition(indicatorCode) {
  initIndex();
  
  if (DEFINITIONS[indicatorCode]) {
    return DEFINITIONS[indicatorCode];
  }
  
  // 尝试通过名称查找
  const info = resolveIndicator(indicatorCode);
  if (info && !info.multiple && DEFINITIONS[info.code]) {
    return DEFINITIONS[info.code];
  }
  
  return null;
}

/**
 * 获取国家备注（财政年度等）
 */
function getCountryNote(countryCode) {
  initIndex();
  
  return INDEX.fiscalYearNotes[countryCode] || INDEX.fiscalYearNotes.default;
}

/**
 * 列出所有可用指标
 */
function listIndicators(category = null) {
  initIndex();
  
  let indicators = Object.entries(INDEX.indicators).map(([code, info]) => ({
    code,
    name: info.name,
    unit: info.unit,
    category: info.category,
    countryCount: info.countryCount
  }));
  
  if (category) {
    indicators = indicators.filter(i => i.category === category.toLowerCase());
  }
  
  return indicators.sort((a, b) => b.countryCount - a.countryCount);
}

/**
 * 列出所有可用国家
 */
function listCountries() {
  initIndex();
  
  return Object.entries(INDEX.countries).map(([code, info]) => ({
    code,
    name: info.name,
    indicatorCount: info.indicators.length,
    seriesCount: info.seriesCount
  })).sort((a, b) => b.seriesCount - a.seriesCount);
}

/**
 * 获取元数据
 */
function getMetadata() {
  initIndex();
  return INDEX.metadata;
}

/**
 * 获取国家组定义
 */
function getCountryGroupDefinition(groupName) {
  initIndex();
  
  if (!INDEX.countryGroups) return null;
  
  // 直接匹配
  if (INDEX.countryGroups[groupName]) {
    return INDEX.countryGroups[groupName];
  }
  
  // 通过别名查找
  const upperName = groupName.toUpperCase();
  if (upperName.includes('BRICS') && upperName.includes('5')) {
    return INDEX.countryGroups['BRICS-5'];
  }
  if (upperName.includes('BRICS') && (upperName.includes('11') || upperName.includes('EXPAND'))) {
    return INDEX.countryGroups['BRICS-11'];
  }
  if (upperName.includes('NDB') || upperName.includes('新开行') || upperName.includes('新开发银行')) {
    return INDEX.countryGroups['NDB'];
  }
  
  return null;
}

/**
 * 列出所有国家组
 */
function listCountryGroups() {
  initIndex();
  
  if (!INDEX.countryGroups) return [];
  
  return Object.entries(INDEX.countryGroups).map(([key, info]) => ({
    code: key,
    name: info.name,
    nameEn: info.nameEn,
    memberCount: info.members.length,
    members: info.members,
    established: info.established,
    note: info.note
  }));
}

// 导出
module.exports = {
  initIndex,
  resolveCountries,
  resolveIndicator,
  queryData,
  getDefinition,
  getCountryNote,
  getCountryGroupDefinition,
  listCountryGroups,
  listIndicators,
  listCountries,
  getMetadata,
  parseYears,
  INDICATOR_ALIASES: () => INDEX?.aliases?.indicators || {},
  COUNTRY_ALIASES: () => INDEX?.aliases?.countries || {}
};
