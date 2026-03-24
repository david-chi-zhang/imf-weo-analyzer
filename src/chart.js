/**
 * IMF WEO 可视化模块
 * 生成交互式 ECharts 图表
 */

const fs = require('fs');
const path = require('path');

/**
 * 生成折线图 HTML
 * @param {Object} options - 图表配置
 * @returns {string} HTML 内容
 */
function generateLineChart(options = {}) {
  const {
    title = 'IMF WEO 数据图表',
    subtitle = '',
    data = [],           // [{country, countryName, data: [{year, value, isForecast}]}]
    weightedData = null, // 加权平均数据 [{year, weightedAvg, isForecast}]
    forecastYear = null, // 预测起始年份
    width = 1000,
    height = 600,
    showLegend = true,
    showGrid = true,
    yAxisName = null,
    colors = null,
    smooth = false,
    markArea = true     // 是否标记预测区域
  } = options;
  
  // 默认颜色方案
  const defaultColors = [
    '#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de',
    '#3ba272', '#fc8452', '#9a60b4', '#ea7ccc', '#2ab7ca'
  ];
  const chartColors = colors || defaultColors;
  
  // 收集所有年份
  const allYears = new Set();
  data.forEach(d => d.data.forEach(p => allYears.add(p.year)));
  if (weightedData) weightedData.forEach(p => allYears.add(p.year));
  const years = Array.from(allYears).sort((a, b) => a - b);
  
  // 构建系列
  const series = [];
  let colorIndex = 0;
  
  // 添加各国数据
  for (const country of data) {
    const seriesData = years.map(year => {
      const point = country.data.find(d => d.year === year);
      return point !== undefined ? point.value : null;
    });
    
    series.push({
      name: country.countryName,
      type: 'line',
      data: seriesData,
      color: chartColors[colorIndex % chartColors.length],
      smooth: smooth,
      symbol: 'circle',
      symbolSize: 6,
      lineStyle: { width: 2 },
      emphasis: {
        lineStyle: { width: 4 },
        symbol: { size: 10 }
      }
    });
    colorIndex++;
  }
  
  // 添加加权平均数据（如果存在）
  if (weightedData) {
    const weightedSeriesData = years.map(year => {
      const point = weightedData.find(d => d.year === year);
      return point !== undefined ? point.weightedAvg : null;
    });
    
    series.push({
      name: '加权平均',
      type: 'line',
      data: weightedSeriesData,
      color: '#000000',
      smooth: smooth,
      symbol: 'rect',
      symbolSize: 8,
      lineStyle: { width: 4, type: 'solid' },
      emphasis: {
        lineStyle: { width: 6 },
        symbol: { size: 12 }
      }
    });
  }
  
  // 确定预测起始年份
  const actualForecastYear = forecastYear || 
    (data[0]?.data.find(d => d.isForecast)?.year) ||
    null;
  
  // 标记区域配置
  const markAreaConfig = actualForecastYear && markArea ? {
    markArea: {
      silent: true,
      itemStyle: {
        color: 'rgba(200, 200, 200, 0.15)'
      },
      data: [[
        {
          xAxis: actualForecastYear,
          label: {
            show: true,
            formatter: '预测期',
            position: 'insideTop',
            color: '#999',
            fontSize: 11
          }
        },
        {
          xAxis: years[years.length - 1]
        }
      ]]
    }
  } : {};
  
  // 生成数据表格 HTML
  function generateDataTable(data, weightedData, years) {
    let tableHtml = '<div class="table-container"><h3>📋 图表数据</h3><div class="table-wrapper"><table class="data-table"><thead><tr><th class="year-col">年份</th>';
    
    // 表头 - 国家名称
    data.forEach(d => {
      tableHtml += `<th>${d.countryName}</th>`;
    });
    
    // 加权平均列
    if (weightedData) {
      tableHtml += '<th class="weighted-col">加权平均</th>';
    }
    
    tableHtml += '</tr></thead><tbody>';
    
    // 数据行
    for (const year of years) {
      const isForecast = year >= 2025;
      tableHtml += `<tr class="${isForecast ? 'forecast-row' : ''}">`;
      tableHtml += `<td class="year-col${isForecast ? ' forecast' : ''}">${year}${isForecast ? ' *' : ''}</td>`;
      
      // 各国数据
      for (const country of data) {
        const point = country.data.find(d => d.year === year);
        const value = point !== undefined && point.value !== null ? point.value.toFixed(2) : 'N/A';
        tableHtml += `<td>${value}</td>`;
      }
      
      // 加权平均
      if (weightedData) {
        const wPoint = weightedData.find(d => d.year === year);
        const wValue = wPoint !== undefined && wPoint.weightedAvg !== null ? wPoint.weightedAvg.toFixed(2) : 'N/A';
        tableHtml += `<td class="weighted-col">${wValue}</td>`;
      }
      
      tableHtml += '</tr>';
    }
    
    tableHtml += '</tbody></table></div>';
    tableHtml += '<div class="table-note">* 标注年份为 IMF 预测数据</div></div>';
    
    return tableHtml;
  }
  
  const dataTableHtml = generateDataTable(data, weightedData, years);
  
  // 生成 HTML
  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <script src="https://cdn.jsdelivr.net/npm/echarts@5.4.3/dist/echarts.min.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      background: #f5f5f5;
      padding: 20px;
    }
    .container {
      max-width: ${width + 40}px;
      margin: 0 auto;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 12px rgba(0,0,0,0.1);
      padding: 20px;
    }
    .header {
      margin-bottom: 20px;
      border-bottom: 1px solid #eee;
      padding-bottom: 15px;
    }
    .title { font-size: 20px; font-weight: 600; color: #333; }
    .subtitle { font-size: 14px; color: #666; margin-top: 5px; }
    .meta { font-size: 12px; color: #999; margin-top: 8px; }
    #chart { width: 100%; height: ${height}px; }
    .table-container {
      margin-top: 30px;
      border-top: 1px solid #eee;
      padding-top: 20px;
    }
    .table-container h3 {
      font-size: 16px;
      font-weight: 600;
      color: #333;
      margin-bottom: 15px;
    }
    .table-wrapper {
      overflow-x: auto;
      max-height: 400px;
      overflow-y: auto;
    }
    .data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }
    .data-table th, .data-table td {
      padding: 8px 12px;
      text-align: right;
      border-bottom: 1px solid #e0e0e0;
    }
    .data-table th {
      background: #f5f5f5;
      font-weight: 600;
      color: #333;
      position: sticky;
      top: 0;
      z-index: 10;
    }
    .data-table th.year-col, .data-table td.year-col {
      text-align: center;
      font-weight: 600;
      background: #fafafa;
    }
    .data-table th.weighted-col, .data-table td.weighted-col {
      font-weight: 600;
      color: #000;
      background: #fff8f8;
    }
    .data-table tr:hover {
      background: #f9f9f9;
    }
    .data-table tr.forecast-row {
      background: #fffef0;
    }
    .data-table tr.forecast-row td.year-col {
      background: #fff9c4;
    }
    .table-note {
      font-size: 12px;
      color: #999;
      margin-top: 10px;
      font-style: italic;
    }
    .footer {
      margin-top: 15px;
      padding-top: 15px;
      border-top: 1px solid #eee;
      font-size: 12px;
      color: #999;
      display: flex;
      justify-content: space-between;
    }
    .btn {
      padding: 6px 12px;
      background: #5470c6;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
    }
    .btn:hover { background: #4a60b0; }
    .btn-secondary {
      background: #6c757d;
      margin-left: 8px;
    }
    .btn-secondary:hover { background: #5a6268; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="title">${title}</div>
      ${subtitle ? `<div class="subtitle">${subtitle}</div>` : ''}
      <div class="meta">数据来源：IMF World Economic Outlook Database | 生成时间：${new Date().toLocaleString('zh-CN')}</div>
    </div>
    <div id="chart"></div>
    ${dataTableHtml}
    <div class="footer">
      <span>双击图例可隐藏/显示对应系列 | * 标注年份为预测数据</span>
      <div>
        <button class="btn" onclick="downloadChart()">下载 PNG</button>
        <button class="btn btn-secondary" onclick="downloadCSV()">下载 CSV</button>
      </div>
    </div>
  </div>
  
  <script>
    const rawData = ${JSON.stringify({ data, weightedData, years })};
    const chart = echarts.init(document.getElementById('chart'));
    
    const option = {
      tooltip: {
        trigger: 'axis',
        formatter: function(params) {
          const year = params[0].name;
          let html = '<div style="font-weight:600">' + year + '年</div>';
          params.forEach(p => {
            if (p.value !== null && p.value !== undefined) {
              const forecastYear = ${actualForecastYear || '9999'};
              const isForecast = (parseInt(year) >= forecastYear);
              const forecastMark = isForecast ? ' <span style="color:#999;font-size:10px">(预测)</span>' : '';
              html += '<div style="display:flex;align-items:center;margin-top:4px">' +
                '<span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:' + p.color + ';margin-right:8px"></span>' +
                p.seriesName + ': <span style="font-weight:600;margin-left:4px">' + p.value.toFixed(2) + '</span>' + forecastMark +
                '</div>';
            }
          });
          return html;
        }
      },
      legend: {
        show: ${showLegend},
        type: 'scroll',
        bottom: 0,
        data: ${JSON.stringify(series.map(s => s.name))}
      },
      grid: {
        show: ${showGrid},
        left: '60px',
        right: '40px',
        top: '60px',
        bottom: '60px'
      },
      xAxis: {
        type: 'category',
        data: ${JSON.stringify(years)},
        axisLine: { lineStyle: { color: '#ccc' } },
        axisTick: { alignWithLabel: true }
      },
      yAxis: {
        type: 'value',
        name: ${yAxisName ? `'${yAxisName}'` : 'null'},
        axisLine: { lineStyle: { color: '#ccc' } },
        splitLine: { lineStyle: { color: '#eee' } }
      },
      series: ${JSON.stringify(series)},
      ${actualForecastYear && markArea ? `markArea: ${JSON.stringify(markAreaConfig.markArea)}` : ''}
    };
    
    chart.setOption(option);
    
    // 响应式
    window.addEventListener('resize', () => chart.resize());
    
    // 下载图表
    function downloadChart() {
      const url = chart.getDataURL({
        type: 'png',
        pixelRatio: 2,
        backgroundColor: '#fff'
      });
      const a = document.createElement('a');
      a.href = url;
      a.download = '${title.replace(/[^a-zA-Z0-9]/g, '_')}.png';
      a.click();
    }
    
    // 下载 CSV
    function downloadCSV() {
      let csv = 'Year';
      rawData.data.forEach(d => {
        csv += ',"' + d.countryName + '"';
      });
      if (rawData.weightedData) {
        csv += ',"Weighted Average"';
      }
      csv += '\\n';
      
      for (const year of rawData.years) {
        csv += year;
        for (const country of rawData.data) {
          const point = country.data.find(d => d.year === year);
          const value = point !== undefined && point.value !== null ? point.value.toFixed(2) : 'N/A';
          csv += ',' + value;
        }
        if (rawData.weightedData) {
          const wPoint = rawData.weightedData.find(d => d.year === year);
          const wValue = wPoint !== undefined && wPoint.weightedAvg !== null ? wPoint.weightedAvg.toFixed(2) : 'N/A';
          csv += ',' + wValue;
        }
        csv += '\\n';
      }
      
      const blob = new Blob(['\\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = '${title.replace(/[^a-zA-Z0-9]/g, '_')}_data.csv';
      a.click();
      URL.revokeObjectURL(url);
    }
  </script>
</body>
</html>`;

  return html;
}

/**
 * 生成柱状图 HTML
 */
function generateBarChart(options = {}) {
  const {
    title = 'IMF WEO 数据图表',
    data = [],
    year = null,
    width = 1000,
    height = 600
  } = options;
  
  // 提取指定年份数据
  const chartData = data.map(d => {
    const point = d.data.find(p => p.year === year);
    return {
      name: d.countryName,
      value: point ? point.value : null
    };
  }).filter(d => d.value !== null).sort((a, b) => b.value - a.value);
  
  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <script src="https://cdn.jsdelivr.net/npm/echarts@5.4.3/dist/echarts.min.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #f5f5f5;
      padding: 20px;
    }
    .container {
      max-width: ${width + 40}px;
      margin: 0 auto;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 12px rgba(0,0,0,0.1);
      padding: 20px;
    }
    .header {
      margin-bottom: 20px;
      border-bottom: 1px solid #eee;
      padding-bottom: 15px;
    }
    .title { font-size: 20px; font-weight: 600; color: #333; }
    .meta { font-size: 12px; color: #999; margin-top: 8px; }
    #chart { width: 100%; height: ${height}px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="title">${title} (${year}年)</div>
      <div class="meta">数据来源：IMF World Economic Outlook Database</div>
    </div>
    <div id="chart"></div>
  </div>
  
  <script>
    const chart = echarts.init(document.getElementById('chart'));
    
    const option = {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: '{b}: {c}'
      },
      grid: { left: '100px', right: '40px', top: '40px', bottom: '40px' },
      xAxis: {
        type: 'value',
        axisLine: { lineStyle: { color: '#ccc' } },
        splitLine: { lineStyle: { color: '#eee' } }
      },
      yAxis: {
        type: 'category',
        data: ${JSON.stringify(chartData.map(d => d.name))},
        axisLine: { lineStyle: { color: '#ccc' } }
      },
      series: [{
        type: 'bar',
        data: ${JSON.stringify(chartData.map(d => d.value))},
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
            { offset: 0, color: '#5470c6' },
            { offset: 1, color: '#91cc75' }
          ])
        },
        label: { show: true, position: 'right', formatter: '{c}' }
      }]
    };
    
    chart.setOption(option);
    window.addEventListener('resize', () => chart.resize());
  </script>
</body>
</html>`;

  return html;
}

/**
 * 生成多轴图表（用于同时显示原始值和增速）
 */
function generateMultiAxisChart(options = {}) {
  const {
    title = 'IMF WEO 数据图表',
    originalData = [],
    growthData = [],
    forecastYear = null,
    width = 1000,
    height = 600
  } = options;
  
  // 收集年份
  const allYears = new Set();
  originalData.forEach(d => d.data.forEach(p => allYears.add(p.year)));
  const years = Array.from(allYears).sort((a, b) => a - b);
  
  // 构建系列
  const series = [];
  const colors = ['#5470c6', '#91cc75', '#fac858', '#ee6666'];
  
  // 原始值系列
  originalData.forEach((country, i) => {
    series.push({
      name: country.countryName,
      type: 'line',
      yAxisIndex: 0,
      data: years.map(y => country.data.find(d => d.year === y)?.value || null),
      color: colors[i % colors.length],
      smooth: false
    });
  });
  
  // 增速系列
  growthData.forEach((country, i) => {
    series.push({
      name: country.countryName + ' 增速',
      type: 'line',
      yAxisIndex: 1,
      data: years.map(y => {
        const point = country.data.find(d => d.year === y);
        return point?.growth !== null ? point?.growth : null;
      }),
      color: colors[i % colors.length],
      lineStyle: { type: 'dashed' },
      smooth: false
    });
  });
  
  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <script src="https://cdn.jsdelivr.net/npm/echarts@5.4.3/dist/echarts.min.js"></script>
  <style>
    body { font-family: sans-serif; background: #f5f5f5; padding: 20px; }
    .container { max-width: ${width + 40}px; margin: 0 auto; background: white; border-radius: 8px; padding: 20px; }
    #chart { width: 100%; height: ${height}px; }
  </style>
</head>
<body>
  <div class="container">
    <h2>${title}</h2>
    <div id="chart"></div>
  </div>
  <script>
    const chart = echarts.init(document.getElementById('chart'));
    chart.setOption({
      tooltip: { trigger: 'axis' },
      legend: { type: 'scroll', bottom: 0 },
      xAxis: { type: 'category', data: ${JSON.stringify(years)} },
      yAxis: [
        { type: 'value', name: '原始值', position: 'left' },
        { type: 'value', name: '增速 (%)', position: 'right' }
      ],
      series: ${JSON.stringify(series)}
    });
  </script>
</body>
</html>`;

  return html;
}

/**
 * 保存图表到文件
 */
function saveChart(html, outputPath) {
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(outputPath, html, 'utf-8');
  return outputPath;
}

/**
 * 主函数：根据数据类型自动选择图表
 */
function generateChart(results, options = {}) {
  const {
    type = 'auto',  // 'auto', 'line', 'bar', 'multi'
    output = null   // 输出文件路径
  } = options;
  
  let html;
  
  if (type === 'bar' || (type === 'auto' && options.year)) {
    html = generateBarChart({ ...options, data: results.data });
  } else if (type === 'multi' || options.growthData) {
    html = generateMultiAxisChart({ 
      ...options, 
      originalData: results.data,
      growthData: options.growthData 
    });
  } else {
    // 默认折线图
    html = generateLineChart({
      ...options,
      data: results.data,
      weightedData: options.weightedData
    });
  }
  
  if (output) {
    return saveChart(html, output);
  }
  
  return html;
}

module.exports = {
  generateLineChart,
  generateBarChart,
  generateMultiAxisChart,
  generateChart,
  saveChart
};
