# IMF WEO Analyzer Skill

IMF 世界经济展望数据库分析工具 - 支持数据查询、计算、可视化和元数据查询。

**当前版本**: v1.1.0 (2026-03-24)  
**最新更新**: 新增图表数据表格和 CSV 下载功能

## 功能概述

| 功能 | 说明 |
|------|------|
| 📊 数据查询 | 按国家、时间、指标查询宏观经济数据 |
| 🧮 计算分析 | 增速、指数化、平均、加权平均等 |
| 📈 可视化 | 生成交互式 ECharts 图表（预测区域自动标记） |
| 📖 指标定义 | 查询指标含义、计算公式、解读 |
| 📝 国家备注 | 查询财政年度等特殊说明 |

## 快速开始

### 1. 构建索引（首次使用）

```bash
cd skills/imf-weo-analyzer
node src/build-index.js /path/to/IMF_WEO_Oct_2025_updated.csv
```

### 2. 使用示例

```bash
# 数据查询
node src/index.js "中国 2020-2030 年 GDP 增速"

# 画图
node src/index.js "画出金砖五国 2020-2030 年 GDP 增速折线图"

# 计算
node src/index.js "计算中国 GDP 2020-2025 年平均增速"

# 查定义
node src/index.js "primary fiscal deficit 定义是什么"

# 查备注
node src/index.js "Bangladesh GDP 财政年度说明"
```

## 使用示例

### 数据查询

```
查询 金砖五国 2020-2030 年 GDP 增速
→ 返回各国数据表格 + 统计摘要
```

### 可视化

```
画出 金砖五国 2020-2030 年 GDP 增速 折线图
→ 生成 HTML 交互图表，包含：
   - 交互式折线图（预测区域灰色覆盖）
   - 完整数据表格（预测年份黄色标记）
   - CSV 数据下载按钮
   - PNG 图表下载按钮
```

### 计算功能

```
# 增速
计算 中国 GDP 2020-2025 年 增速
→ 返回逐年增长率

# 指数化
以 2020 年为 100 指数化 美国 GDP
→ 返回指数序列

# 平均增速
中国 GDP 2020-2025 年平均增速
→ 返回 CAGR（复合年增长率）

# 分段对比
比较 中国 GDP 2020-2025 和 2026-2030 两个时期的平均增速
→ 返回两段 CAGR 对比

# 加权平均
计算 金砖五国 GDP 加权平均增速（PPP 权重）
→ 返回加权平均时间序列
```

### 指标定义

```
primary fiscal deficit 定义是什么
→ 返回：
  指标：GGXONLB_NGDP
  名称：Primary net lending/borrowing, Percent of GDP
  定义：政府净借贷 (不含利息支出) 占 GDP 比重
  公式：Primary balance = Overall balance - Interest payments
  解读：正数表示财政盈余，负数表示赤字
```

### 国家备注

```
Bangladesh GDP 备注
→ 返回：
  国家：Bangladesh (BGD)
  财政年度：July-June
  说明：孟加拉国使用财政年度 FY20XX/YY 格式
```

## 支持的指标别名

### GDP 相关
| 别名 | 指标代码 | 说明 |
|------|---------|------|
| gdp growth / gdp 增速 | NGDP_RPCH | 实际 GDP 增长率 |
| gdp / 名义 gdp | NGDPD | 名义 GDP（美元） |
| 人均 gdp | NGDPDPC | 人均 GDP |
| ppp gdp | NGDPD_PPP | 购买力平价 GDP |

### 通胀相关
| 别名 | 指标代码 | 说明 |
|------|---------|------|
| inflation / 通胀 | PCPIPCH | CPI 通胀率 |
| core inflation | PCPICH | 核心通胀率 |

### 财政相关
| 别名 | 指标代码 | 说明 |
|------|---------|------|
| fiscal balance | GGXCNL_NGDP | 财政余额/GDP |
| primary balance | GGXONLB_NGDP | 基本财政余额/GDP |
| government debt | GGXWDG_NGDP | 政府债务/GDP |
| government revenue | GGR_NGDP | 政府收入/GDP |
| government expenditure | GGX_NGDP | 政府支出/GDP |

### 贸易相关
| 别名 | 指标代码 | 说明 |
|------|---------|------|
| current account | BCA_NGDPD | 经常账户/GDP |
| exports | BX | 出口 |
| imports | BM | 进口 |

### 其他
| 别名 | 指标代码 | 说明 |
|------|---------|------|
| unemployment | LUR | 失业率 |
| population | LP | 人口 |
| oil price | POILBRE | 布伦特原油价格 |

## 支持的国家组

### 金砖国家群组 🧱

| 名称 | 别名 | 成员国 | 说明 |
|------|------|--------|------|
| **金砖五国** | `brics`, `brics-5`, `金砖五国` | 巴西、俄罗斯、印度、中国、南非 | 原始金砖五国 (2009 年成立) |
| **金砖国家** | `brics-11`, `金砖国家`, `expanded brics` | 金砖五国 + 沙特、阿联酋、埃及、伊朗、埃塞俄比亚、印尼 | 2024 年扩展后 (11 国) |
| **新开发银行成员国** | `ndb`, `新开行`, `新开行成员国`, `新开发银行成员国` | 金砖五国 + 孟加拉、阿联酋、埃及、阿尔及利亚 | NDB 成员国 (9 国) |

### 传统国家组

| 别名 | 成员 |
|------|------|
| g7 / 七国集团 | 美、日、德、英、法、意、加 |
| g20 / 二十国集团 | G20 成员国 |
| advanced economies | 发达经济体 |
| emerging markets | 新兴市场和发展中经济体 |
| euro area / 欧元区 | 欧元区 |
| asia | 亚洲 |
| europe | 欧洲 |
| africa | 非洲 |
| americas | 美洲 |

### 国家组定义详情

**金砖五国 (BRICS-5)**:
- 成员国：Brazil, Russia, India, China, South Africa
- 成立时间：2009-2010
- 备注：原始金砖五国

**金砖国家 (BRICS-11)**:
- 成员国：Brazil, Russia, India, China, South Africa, Saudi Arabia, UAE, Egypt, Iran, Ethiopia, Indonesia
- 扩展时间：2024
- 备注：2024 年扩展后的金砖国家

**新开发银行成员国 (NDB Members)**:
- 成员国：Brazil, Russia, India, China, South Africa, Bangladesh, UAE, Egypt, Algeria
- 成立时间：2014
- 备注：新开发银行（NDB）成员国

---

**注意**: 金砖国家定义可能会随时间变化。如需更新国家组定义，请联系维护者更新索引。

## 计算功能详解

### 1. 增速 (Growth)
```javascript
// 同比增速
growth = (本年值 - 上年值) / 上年值 × 100%
```

### 2. 指数化 (Index)
```javascript
// 以基期=100
index = 当年值 / 基期值 × 100
```

### 3. 复合年增长率 (CAGR)
```javascript
// 几何平均增长率
CAGR = (终值/初值)^(1/年数) - 1 × 100%
```

### 4. 加权平均 (Weighted Average)
```javascript
// 以 PPP GDP 为权重
weighted = Σ(各国增速 × 各国 PPP GDP) / Σ(各国 PPP GDP)
```

## 输出格式

### 查询结果
```json
{
  "success": true,
  "type": "query_with_chart",
  "data": {
    "query": { /* 原始查询结果 */ },
    "compute": { /* 计算结果 */ },
    "weighted": { /* 加权平均数据 */ },
    "chartPath": "output/chart_xxx.html"
  },
  "summary": {
    "indicator": "GDP 增长率",
    "unit": "Percent",
    "countries": [
      { "name": "中国", "cagr": "5.2%", "mean": "5.5" }
    ],
    "weighted": { "cagr": "4.8%" }
  }
}
```

### 图表特性（v1.1.0 新增）

**核心功能**:
- ✅ 交互式悬停显示数值
- ✅ 预测区域自动灰色覆盖（2025 年起）
- ✅ 图例可切换显示/隐藏
- ✅ 支持下载 PNG 图表
- ✅ 支持下载 CSV 数据
- ✅ 响应式设计

**数据表格** (v1.1.0 新增):
- ✅ 图表下方自动显示完整数据表格
- ✅ 预测年份用黄色背景 + * 号标记
- ✅ 加权平均列用粉色背景突出显示
- ✅ 支持横向和纵向滚动
- ✅ 鼠标悬停行高亮
- ✅ CSV 下载（Excel 可直接打开）

**示例图表**: `output/brics_debt_with_table.html`

## 文件结构

```
imf-weo-analyzer/
├── SKILL.md              # 本文档
├── src/
│   ├── index.js          # 主入口
│   ├── query.js          # 数据查询模块
│   ├── compute.js        # 计算模块
│   ├── chart.js          # 可视化模块
│   └── build-index.js    # 索引构建脚本
├── data/
│   ├── index.json        # 轻量级索引（~5KB）
│   ├── series.json       # 时间序列数据
│   └── definitions.json  # 指标定义缓存
├── output/               # 图表输出目录
└── examples/             # 使用示例
```

## Token 优化

| 优化项 | 策略 | 节约 |
|--------|------|------|
| 索引查询 | 5KB 索引 vs 50KB CSV | 90% |
| 计算逻辑 | 本地 JS 函数 | 100% |
| 指标定义 | 本地缓存 | 100% |
| 国家备注 | 本地缓存 | 100% |
| 歧义处理 | 规则匹配 | 95% |
| 数据格式 | 紧凑格式 `[{y,v}]` | 50% |

**总体节约**: 单次查询从 ~15KB → ~2KB，节约 **85%+**

## 数据更新

IMF WEO 数据库每 6 个月更新（4 月和 10 月）。更新步骤：

1. 下载最新 CSV 文件
2. 运行 `node src/build-index.js new_file.csv`
3. 索引自动更新，无需修改代码

## API 参考

### query 模块
```javascript
const query = require('./query');

// 查询数据
query.queryData({
  countries: ['CHN', 'USA'],
  indicator: 'NGDP_RPCH',
  years: [2020, 2030]
});

// 解析国家
query.resolveCountries('金砖五国');
// → [{code: 'BRA', name: 'Brazil'}, ...]

// 解析指标
query.resolveIndicator('gdp 增速');
// → {code: 'NGDP_RPCH', name: '...', unit: 'Percent'}

// 获取定义
query.getDefinition('GGXONLB_NGDP');

// 获取国家备注
query.getCountryNote('BGD');
```

### compute 模块
```javascript
const compute = require('./compute');

// 增速
compute.calcGrowth([{year: 2020, value: 100}, {year: 2021, value: 105}]);
// → [{year: 2020, value: 100, growth: null}, {year: 2021, value: 105, growth: 5}]

// 指数化
compute.calcIndex(data, 2020);

// CAGR
compute.calcCAGR(data);

// 加权平均
compute.calcWeightedAverage(countryData, weightData);

// 链式调用
compute.createPipeline(queryResult)
  .growth()
  .index(2020)
  .weightedAverage(weights)
  .get('all');
```

### chart 模块
```javascript
const chart = require('./chart');

// 生成折线图
chart.generateLineChart({
  title: 'GDP 增速对比',
  data: [...],
  forecastYear: 2025,
  output: 'output/chart.html'
});
```

## 常见问题

**Q: 为什么有些国家数据不完整？**
A: 早期年份（1980s）数据完整率约 54%，2010s 后达 98%+。部分小国数据有限。

**Q: 预测数据可靠吗？**
A: 2025 年后为 IMF 预测，存在修正可能。图表中自动灰色标记。

**Q: 如何自定义图表样式？**
A: 修改 `chart.js` 中的颜色、尺寸等配置。

**Q: 支持其他图表类型吗？**
A: 目前支持折线图、柱状图、多轴图。可扩展 `chart.js` 添加更多类型。

## 更新日志

### v1.1.0 (2026-03-24) 🎉

**新增功能**:
- ✨ 图表下方自动显示完整数据表格
- ✨ 预测年份黄色背景 + * 号标记
- ✨ 加权平均列特殊突出显示（粉色背景）
- ✨ CSV 数据下载功能
- ✨ 表格支持横向和纵向滚动
- ✨ 鼠标悬停行高亮效果

**改进**:
- 📊 数据表格样式优化，更易阅读
- 📥 CSV 下载支持 UTF-8 BOM（Excel 兼容）
- 🎨 预测期视觉标识更清晰

**示例**:
```bash
node src/index.js "金砖五国 2010-2030 年 政府债务"
# 生成包含数据表格和 CSV 下载按钮的完整图表
```

### v1.0.0 (2026-03-24)

**首发版本**:
- ✨ 数据查询（支持国家、指标、时间范围）
- ✨ 计算功能（增速、指数化、平均、加权平均）
- ✨ 可视化（交互式 ECharts 图表）
- ✨ 指标定义查询
- ✨ 国家备注查询
- ✨ Token 优化（85%+ 节约）

## 许可证

本 Skill 供个人研究和教育使用。IMF 数据版权归 IMF 所有。
