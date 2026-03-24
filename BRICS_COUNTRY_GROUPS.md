# 金砖国家群组定义

**更新时间**: 2026-03-24  
**版本**: v1.1.1

---

## 📋 三个金砖相关国家群组

### 1. 金砖五国 (BRICS-5)

**别名**: `brics`, `brics-5`, `金砖五国`, `original brics`

**成员国** (5 个):
- 🇧🇷 Brazil (巴西)
- 🇷🇺 Russian Federation (俄罗斯)
- 🇮🇳 India (印度)
- 🇨🇳 China (中国)
- 🇿🇦 South Africa (南非)

**成立时间**: 2009-2010  
**备注**: 原始金砖五国，2009 年成立

**使用示例**:
```bash
node src/index.js "金砖五国 2020-2030 年 GDP 增速"
node src/index.js "brics-5 inflation"
```

---

### 2. 金砖国家 (BRICS-11 / Expanded BRICS)

**别名**: `brics-11`, `金砖国家`, `expanded brics`, `BRICS`

**成员国** (11 个):
- 🇧🇷 Brazil (巴西)
- 🇷🇺 Russian Federation (俄罗斯)
- 🇮🇳 India (印度)
- 🇨🇳 China (中国)
- 🇿🇦 South Africa (南非)
- 🇸🇦 Saudi Arabia (沙特阿拉伯)
- 🇦🇪 United Arab Emirates (阿联酋)
- 🇪🇬 Egypt (埃及)
- 🇮🇷 Iran (伊朗)
- 🇪🇹 Ethiopia (埃塞俄比亚)
- 🇮🇩 Indonesia (印度尼西亚)

**扩展时间**: 2024  
**备注**: 2024 年扩展后的金砖国家，新增 6 个成员国

**使用示例**:
```bash
node src/index.js "金砖国家 2024 年 GDP"
node src/index.js "brics-11 population"
```

---

### 3. 新开发银行成员国 (NDB Members)

**别名**: `ndb`, `ndb members`, `新开行`, `新开行成员国`, `新开发银行`, `新开发银行成员国`, `new development bank`

**成员国** (9 个):
- 🇧🇷 Brazil (巴西)
- 🇷🇺 Russian Federation (俄罗斯)
- 🇮🇳 India (印度)
- 🇨🇳 China (中国)
- 🇿🇦 South Africa (南非)
- 🇧🇩 Bangladesh (孟加拉国)
- 🇦🇪 United Arab Emirates (阿联酋)
- 🇪🇬 Egypt (埃及)
- 🇩🇿 Algeria (阿尔及利亚)

**成立时间**: 2014  
**备注**: 新开发银行（NDB）成员国，包括创始成员和后续加入成员

**使用示例**:
```bash
node src/index.js "新开行成员国 政府债务"
node src/index.js "ndb members fiscal balance"
```

---

## 🔄 国家群组对比

| 群组 | 成员数 | 包含关系 | 特色成员 |
|------|--------|---------|---------|
| 金砖五国 | 5 | 基础 | - |
| 金砖 11 国 | 11 | 包含金砖五国 +6 | 沙特、阿联酋、伊朗、印尼等 |
| 新开发银行 | 9 | 包含金砖五国 +4 | 孟加拉、阿尔及利亚 |

### 成员重叠分析

| 国家 | 金砖五国 | 金砖 11 国 | 新开发银行 |
|------|---------|----------|-----------|
| 巴西 | ✅ | ✅ | ✅ |
| 俄罗斯 | ✅ | ✅ | ✅ |
| 印度 | ✅ | ✅ | ✅ |
| 中国 | ✅ | ✅ | ✅ |
| 南非 | ✅ | ✅ | ✅ |
| 沙特 | ❌ | ✅ | ❌ |
| 阿联酋 | ❌ | ✅ | ✅ |
| 埃及 | ❌ | ✅ | ✅ |
| 伊朗 | ❌ | ✅ | ❌ |
| 埃塞俄比亚 | ❌ | ✅ | ❌ |
| 印尼 | ❌ | ✅ | ❌ |
| 孟加拉 | ❌ | ❌ | ✅ |
| 阿尔及利亚 | ❌ | ❌ | ✅ |

---

## 📝 更新国家组定义

如果金砖国家定义发生变化，请按以下步骤更新：

### 1. 更新 `src/build-index.js`

找到 `COUNTRY_ALIASES` 和 `COUNTRY_GROUP_DEFINITIONS` 部分，修改成员列表：

```javascript
// 修改金砖 11 国定义
'brics-11': ['BRA', 'CHN', 'IND', 'RUS', 'ZAF', 'SAU', 'ARE', 'EGY', 'IRN', 'ETH', 'IDN'],

// 更新定义说明
'BRICS-11': {
  name: '金砖国家（扩展后）',
  members: ['BRA', 'CHN', 'IND', 'RUS', 'ZAF', 'SAU', 'ARE', 'EGY', 'IRN', 'ETH', 'IDN'],
  note: '2024 年扩展后的金砖国家'
}
```

### 2. 重新构建索引

```bash
cd skills/imf-weo-analyzer
node src/build-index.js /path/to/IMF_WEO_data.csv
```

### 3. 验证更新

```bash
node -e "
const { query } = require('./src/query');
const brics11 = query.resolveCountries('brics-11');
console.log('BRICS-11 成员:', brics11.map(c => c.name).join(', '));
"
```

---

## 🔍 测试命令

```bash
# 测试金砖五国
node src/index.js "金砖五国 2020-2030 年 GDP 增速"

# 测试金砖 11 国
node src/index.js "brics-11 2024 年人口"

# 测试新开发银行
node src/index.js "新开行成员国 政府债务占 GDP 比重"

# 查看国家组定义
node -e "const {query} = require('./src/query'); console.log(query.listCountryGroups());"
```

---

## 📊 使用统计

| 国家组 | 常用场景 | 推荐指标 |
|--------|---------|---------|
| 金砖五国 | 历史对比、核心分析 | GDP 增速、贸易、投资 |
| 金砖 11 国 | 扩展后分析、能源 | 能源产量、人口、GDP |
| 新开发银行 | 发展融资、基础设施 | 政府债务、财政余额 |

---

**注意**: 国家组定义可能会随国际形势变化。如需更新，请联系维护者。
