/**
 * IMF WEO 计算模块
 * 提供时间序列计算功能：增速、指数化、平均、加权平均等
 */

/**
 * 计算同比增速
 * @param {Array} data - [{year, value}]
 * @returns {Array} [{year, value, growth}]
 */
function calcGrowth(data) {
  if (!data || data.length < 2) return data;
  
  return data.map((d, i) => ({
    ...d,
    growth: i === 0 ? null : ((d.value - data[i-1].value) / data[i-1].value * 100)
  }));
}

/**
 * 计算绝对变动
 * @param {Array} data - [{year, value}]
 * @returns {Array} [{year, value, change}]
 */
function calcChange(data) {
  if (!data || data.length < 2) return data;
  
  return data.map((d, i) => ({
    ...d,
    change: i === 0 ? null : (d.value - data[i-1].value)
  }));
}

/**
 * 计算累计增速（相对于基期）
 * @param {Array} data - [{year, value}]
 * @param {number} baseYear - 基期年份
 * @returns {Array} [{year, value, cumulativeGrowth}]
 */
function calcCumulativeGrowth(data, baseYear) {
  if (!data || data.length === 0) return data;
  
  const baseValue = data.find(d => d.year === baseYear)?.value;
  if (baseValue === undefined) {
    throw new Error(`基期 ${baseYear} 无数据`);
  }
  
  return data.map(d => ({
    ...d,
    cumulativeGrowth: ((d.value - baseValue) / baseValue * 100)
  }));
}

/**
 * 时间序列指数化（基期=100）
 * @param {Array} data - [{year, value}]
 * @param {number} baseYear - 基期年份，默认第一个年份
 * @returns {Array} [{year, value, index}]
 */
function calcIndex(data, baseYear = null) {
  if (!data || data.length === 0) return data;
  
  const actualBaseYear = baseYear || data[0].year;
  const baseValue = data.find(d => d.year === actualBaseYear)?.value;
  
  if (baseValue === undefined || baseValue === 0) {
    throw new Error(`基期 ${actualBaseYear} 无有效数据`);
  }
  
  return data.map(d => ({
    ...d,
    index: (d.value / baseValue * 100)
  }));
}

/**
 * 计算算术平均值
 * @param {Array} values - 数值数组
 * @returns {number|null}
 */
function calcArithmeticMean(values) {
  if (!values || values.length === 0) return null;
  const validValues = values.filter(v => v !== null && v !== undefined && !isNaN(v));
  if (validValues.length === 0) return null;
  return validValues.reduce((a, b) => a + b, 0) / validValues.length;
}

/**
 * 计算几何平均增长率 (CAGR)
 * @param {Array} data - [{year, value}]
 * @returns {number|null} 年化增长率 (%)
 */
function calcCAGR(data) {
  if (!data || data.length < 2) return null;
  
  const validData = data.filter(d => d.value > 0);
  if (validData.length < 2) return null;
  
  const first = validData[0];
  const last = validData[validData.length - 1];
  const n = last.year - first.year;
  
  if (n <= 0) return null;
  
  return (Math.pow(last.value / first.value, 1/n) - 1) * 100;
}

/**
 * 计算几何平均（多期增长率）
 * @param {Array} growthRates - 增长率数组 [%]
 * @returns {number|null} 几何平均增长率
 */
function calcGeometricMean(growthRates) {
  if (!growthRates || growthRates.length === 0) return null;
  
  const validRates = growthRates.filter(r => r !== null && r !== undefined && !isNaN(r));
  if (validRates.length === 0) return null;
  
  const product = validRates.reduce((a, b) => a * (1 + b/100), 1);
  return (Math.pow(product, 1/validRates.length) - 1) * 100;
}

/**
 * 分段计算平均增速
 * @param {Array} data - [{year, value}]
 * @param {Array} segments - [['2020-2025'], ['2026-2030']] 或 [{start: 2020, end: 2025}]
 * @returns {Object} {'2020-2025': 5.2, '2026-2030': 4.8}
 */
function calcSegmentedGrowth(data, segments) {
  if (!data || !segments) return {};
  
  const result = {};
  
  for (const seg of segments) {
    let start, end, label;
    
    if (typeof seg === 'string') {
      label = seg;
      const match = seg.match(/(\d{4})\s*[-–—]\s*(\d{4})/);
      if (match) {
        start = parseInt(match[1]);
        end = parseInt(match[2]);
      }
    } else if (typeof seg === 'object') {
      start = seg.start;
      end = seg.end;
      label = seg.label || `${start}-${end}`;
    }
    
    if (!start || !end) continue;
    
    const segmentData = data.filter(d => d.year >= start && d.year <= end);
    result[label] = {
      cagr: calcCAGR(segmentData),
      arithmeticMean: calcArithmeticMean(segmentData.map(d => d.value)),
      startValue: segmentData[0]?.value,
      endValue: segmentData[segmentData.length - 1]?.value,
      years: segmentData.length
    };
  }
  
  return result;
}

/**
 * 跨国加权平均
 * @param {Array} countryData - [{country, countryName, data: [{year, value}]}]
 * @param {Array} weightData - [{country, data: [{year, weight}]}] 权重数据
 * @returns {Array} [{year, weightedAvg, label}]
 */
function calcWeightedAverage(countryData, weightData) {
  if (!countryData || countryData.length === 0) return [];
  
  // 收集所有年份
  const allYears = new Set();
  countryData.forEach(c => {
    c.data.forEach(d => allYears.add(d.year));
  });
  
  // 构建权重查找表
  const weightMap = {};
  if (weightData) {
    weightData.forEach(w => {
      weightMap[w.country] = {};
      w.data.forEach(d => {
        weightMap[w.country][d.year] = d.value;
      });
    });
  }
  
  const result = [];
  
  for (const year of Array.from(allYears).sort((a, b) => a - b)) {
    let weightedSum = 0;
    let totalWeight = 0;
    
    for (const country of countryData) {
      const valueEntry = country.data.find(d => d.year === year);
      if (!valueEntry || valueEntry.value === null) continue;
      
      const value = valueEntry.value;
      
      // 如果有权重数据，使用权重；否则等权重
      let weight = 1;
      if (weightMap[country.country] && weightMap[country.country][year] !== undefined) {
        weight = weightMap[country.country][year];
      }
      
      if (weight > 0) {
        weightedSum += value * weight;
        totalWeight += weight;
      }
    }
    
    result.push({
      year,
      weightedAvg: totalWeight > 0 ? weightedSum / totalWeight : null,
      isForecast: countryData[0]?.data.find(d => d.year === year)?.isForecast || false
    });
  }
  
  return result;
}

/**
 * 计算金砖五国 GDP 加权平均增速（以 PPP GDP 为权重）
 * @param {Array} gdpGrowthResults - queryData 返回的 GDP 增速数据
 * @param {Array} pppGdpResults - queryData 返回的 PPP GDP 数据
 * @returns {Array} [{year, weightedGrowth}]
 */
function calcBRICSWeightedGrowth(gdpGrowthResults, pppGdpResults) {
  // 转换格式
  const countryData = gdpGrowthResults.data.map(r => ({
    country: r.country,
    countryName: r.countryName,
    data: r.data.map(d => ({ year: d.year, value: d.value }))
  }));
  
  const weightData = pppGdpResults.data.map(r => ({
    country: r.country,
    data: r.data.map(d => ({ year: d.year, weight: d.value }))
  }));
  
  const weighted = calcWeightedAverage(countryData, weightData);
  
  return [{
    country: 'BRICS_WEIGHTED',
    countryName: '金砖五国加权平均',
    indicator: gdpGrowthResults.metadata.indicator.code,
    indicatorName: `${gdpGrowthResults.metadata.indicator.name} (PPP 加权)`,
    unit: gdpGrowthResults.metadata.indicator.unit,
    data: weighted
  }];
}

/**
 * 计算模块主类（支持链式调用）
 */
class ComputePipeline {
  constructor(queryResults) {
    this.queryResults = queryResults;
    this.results = { original: queryResults.data };
    this.metadata = queryResults.metadata;
  }
  
  /**
   * 计算增速
   */
  growth() {
    this.results.growth = this.results.original.map(country => ({
      ...country,
      data: calcGrowth(country.data)
    }));
    return this;
  }
  
  /**
   * 计算变动
   */
  change() {
    this.results.change = this.results.original.map(country => ({
      ...country,
      data: calcChange(country.data)
    }));
    return this;
  }
  
  /**
   * 指数化
   * @param {number} baseYear - 基期年份
   */
  index(baseYear = null) {
    this.results.index = this.results.original.map(country => ({
      ...country,
      data: calcIndex(country.data, baseYear)
    }));
    return this;
  }
  
  /**
   * 累计增速
   * @param {number} baseYear - 基期年份
   */
  cumulativeGrowth(baseYear = null) {
    const actualBaseYear = baseYear || this.results.original[0]?.data[0]?.year;
    this.results.cumulative = this.results.original.map(country => ({
      ...country,
      data: calcCumulativeGrowth(country.data, actualBaseYear)
    }));
    return this;
  }
  
  /**
   * 加权平均
   * @param {Array} weightData - 权重数据
   */
  weightedAverage(weightData) {
    this.results.weighted = calcWeightedAverage(this.results.original, weightData);
    return this;
  }
  
  /**
   * 分段计算
   * @param {Array} segments - 时间段
   */
  segmented(segments) {
    this.results.segmented = {};
    for (const country of this.results.original) {
      this.results.segmented[country.country] = calcSegmentedGrowth(country.data, segments);
    }
    return this;
  }
  
  /**
   * 获取结果
   * @param {string} type - 结果类型
   */
  get(type = 'all') {
    if (type === 'all') {
      return {
        metadata: this.metadata,
        ...this.results
      };
    }
    return this.results[type];
  }
  
  /**
   * 获取摘要统计
   */
  getSummary() {
    const summary = {};
    
    for (const [type, data] of Object.entries(this.results)) {
      if (Array.isArray(data)) {
        summary[type] = data.map(country => ({
          country: country.country,
          countryName: country.countryName,
          cagr: calcCAGR(country.data),
          mean: calcArithmeticMean(country.data.map(d => d.value)),
          startYear: country.data[0]?.year,
          endYear: country.data[country.data.length - 1]?.year,
          startValue: country.data[0]?.value,
          endValue: country.data[country.data.length - 1]?.value
        }));
      }
    }
    
    return summary;
  }
}

/**
 * 创建计算管道
 * @param {Object} queryResults - queryData 返回的结果
 * @returns {ComputePipeline}
 */
function createPipeline(queryResults) {
  return new ComputePipeline(queryResults);
}

// 导出
module.exports = {
  calcGrowth,
  calcChange,
  calcCumulativeGrowth,
  calcIndex,
  calcArithmeticMean,
  calcCAGR,
  calcGeometricMean,
  calcSegmentedGrowth,
  calcWeightedAverage,
  calcBRICSWeightedGrowth,
  ComputePipeline,
  createPipeline
};
