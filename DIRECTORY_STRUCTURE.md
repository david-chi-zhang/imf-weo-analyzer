# 📁 IMF WEO Analyzer - 目录结构说明

**更新日期**: 2026-03-24  
**版本**: v1.1.1

---

## 📂 完整目录结构

```
imf-weo-analyzer/
│
├── src/                          # 核心源代码 ✅
│   ├── index.js                  # 主入口
│   ├── query.js                  # 数据查询模块
│   ├── compute.js                # 计算模块
│   ├── chart.js                  # 可视化模块
│   └── build-index.js            # 索引构建脚本
│
├── data/                         # 数据文件
│   ├── raw/                      # 原始 CSV 数据（本地保留）📁
│   │   └── IMF_WEO_Oct_2025_updated.csv  (12MB, 不上传)
│   ├── index.json                # 轻量索引 (242KB) ✅
│   ├── definitions.json          # 指标定义 (63KB) ✅
│   └── series.json               # 时间序列 (8.4MB) ✅
│
├── examples/                     # 示例代码 ✅
│   └── test.js                   # 测试用例
│
├── output/                       # 输出文件（运行时生成）
│   ├── chart_*.html              # 图表文件
│   └── *.csv                     # 导出数据
│
├── lib/                          # 预留库目录
│
├── node_modules/                 # npm 依赖（不上传）
│
├── package.json                  # 项目配置 ✅
├── package-lock.json             # 依赖锁定 ✅
├── .gitignore                    # Git 忽略规则 ✅
├── LICENSE                       # MIT 许可证 ✅
│
└── *.md                          # 文档文件 ✅
    ├── README.md                 # 快速开始
    ├── SKILL.md                  # 完整使用文档
    ├── CHANGELOG.md              # 更新日志
    ├── BRICS_COUNTRY_GROUPS.md   # 金砖国家定义
    ├── GITHUB_SETUP.md           # GitHub 配置指南
    ├── PUSH_SUMMARY.md           # 推送总结
    ├── VERSION_1.1.0_SUMMARY.md  # v1.1.0 版本总结
    ├── UPDATE_SUMMARY_BRICS_GROUPS.md  # 国家组更新总结
    ├── UPLOAD_COMPLETE.md        # 上传完成总结
    └── DIRECTORY_STRUCTURE.md    # 本文档
```

---

## 📊 文件分类

### ✅ 已上传到 GitHub (约 350KB)

| 目录 | 文件数 | 大小 | 说明 |
|------|--------|------|------|
| `src/` | 5 | ~40KB | 核心源代码 |
| `data/` | 2 | ~305KB | 索引和定义（不含 series.json） |
| `examples/` | 1 | ~3KB | 测试用例 |
| `*.md` | 9 | ~30KB | 完整文档 |
| `其他` | 3 | ~2KB | 配置文件 |
| **总计** | **20** | **~380KB** | |

### ❌ 未上传（按设计）

| 文件/目录 | 大小 | 原因 |
|----------|------|------|
| `data/raw/*.csv` | 12MB | 用户从 IMF 下载，不上传 |
| `data/series.json` | 8.4MB | 可从 CSV 重新生成，太大 |
| `node_modules/` | ~1MB | npm install 生成 |
| `output/` | 可变 | 运行时生成 |

---

## 📁 关键目录说明

### 1. `src/` - 核心源代码

**包含 5 个核心模块**：

```javascript
index.js          // 主入口，意图识别，命令处理
query.js          // 数据查询，国家/指标解析
compute.js        // 计算模块（增速、指数、平均等）
chart.js          // 可视化（图表生成、数据表格）
build-index.js    // 索引构建（CSV → JSON）
```

**使用**:
```bash
node src/index.js "查询内容"
```

---

### 2. `data/` - 数据文件

#### `data/raw/` - 原始 CSV 数据（本地保留）

**存放从 IMF 下载的原始 CSV 文件**：
- `IMF_WEO_Oct_2025_updated.csv` (12MB)
- 不会上传到 GitHub（.gitignore 已配置）
- 用于重新生成索引

**使用**:
```bash
# 如果有新版本的 IMF 数据
node src/build-index.js /path/to/new_IMF_data.csv
```

---

#### `data/index.json` - 轻量索引（已上传）

**包含**：
- 210 个国家元数据
- 145 个指标定义
- 78 个国家组别名
- 56 个指标别名

**大小**: 242KB  
**用途**: 快速查询，无需扫描 CSV

---

#### `data/series.json` - 时间序列数据（已上传）

**包含**：
- 8200 个时间序列
- 1980-2030 年数据
- 每年数据点

**大小**: 8.4MB  
**用途**: 快速数据检索

---

#### `data/definitions.json` - 指标定义（已上传）

**包含**：
- 145 个指标详细说明
- 计算公式
- 解读说明

**大小**: 63KB  
**用途**: 指标定义查询

---

### 3. `output/` - 输出文件

**运行时自动生成**：
- `chart_*.html` - 交互式图表
- `*.csv` - 导出数据

**特点**：
- 不会上传到 GitHub
- 每次查询生成新文件
- 可手动删除清理

**清理**:
```bash
rm -rf output/*
```

---

### 4. `examples/` - 示例代码

**包含**：
- `test.js` - 测试用例

**使用**:
```bash
node examples/test.js
```

---

## 🔧 使用流程

### 首次使用

```bash
# 1. 克隆仓库
git clone https://github.com/david-chi-zhang/imf-weo-analyzer.git
cd imf-weo-analyzer

# 2. 安装依赖
npm install

# 3. 准备 CSV 数据
# 从 IMF 官网下载
# 放到 data/raw/ 目录（可选，但推荐）

# 4. 构建索引（如果 data/ 中没有索引文件）
node src/build-index.js data/raw/IMF_WEO_Oct_2025_updated.csv

# 5. 使用
node src/index.js "金砖五国 2020-2030 年 GDP 增速"
```

---

### 日常使用

```bash
# 直接查询
node src/index.js "中国通胀率"

# 画图
node src/index.js "画出金砖五国 GDP 对比图"

# 查定义
node src/index.js "primary fiscal deficit 定义"

# 测试
node examples/test.js
```

---

### 更新数据

```bash
# 1. 下载新版本 IMF 数据
# 从 https://www.imf.org/external/pubs/ft/weo/weodata/download.aspx

# 2. 保存到 data/raw/
mv ~/Downloads/IMF_WEO_Apr_2026.csv data/raw/

# 3. 重新构建索引
node src/build-index.js data/raw/IMF_WEO_Apr_2026.csv

# 4. 验证
node src/index.js "列出所有可用指标"
```

---

## 📏 磁盘空间占用

| 项目 | 大小 | 必需 |
|------|------|------|
| 源代码 (src/) | ~40KB | ✅ |
| 索引文件 (data/) | ~8.7MB | ✅ |
| CSV 原始数据 | 12MB | ⚠️ 可选 |
| node_modules/ | ~1MB | ✅ (运行时) |
| 文档 (*.md) | ~30KB | ✅ |
| **总计（含 CSV）** | **~22MB** | |
| **总计（不含 CSV）** | **~10MB** | |

---

## 🔒 .gitignore 配置

```gitignore
# 原始数据文件
data/raw/

# 输出文件
output/
*.html
*.csv

# 依赖
node_modules/

# 系统文件
.DS_Store
Thumbs.db
```

**确保**：
- ✅ CSV 文件不会误上传
- ✅ 输出文件不会上传
- ✅ 索引文件已上传

---

## 📊 GitHub 仓库内容

访问 https://github.com/david-chi-zhang/imf-weo-analyzer

**包含**：
- ✅ 完整源代码
- ✅ 索引文件（index.json, definitions.json）
- ✅ 测试用例
- ✅ 完整文档
- ✅ 配置文件

**不包含**：
- ❌ CSV 原始数据
- ❌ series.json（太大）
- ❌ node_modules/
- ❌ output/

---

## 💡 最佳实践

### 1. 数据管理

```bash
# 推荐：保留 CSV 在 data/raw/
data/raw/IMF_WEO_Oct_2025.csv

# 优点：
# - 可随时重新生成索引
# - 数据更新方便
# - 不会误上传
```

### 2. 定期清理

```bash
# 清理输出文件（保留最近的）
rm output/chart_*.html
rm output/*.csv
```

### 3. 备份索引

```bash
# 定期备份 data/ 目录
tar -czf imf-weo-data-backup.tar.gz data/
```

---

## 📞 常见问题

### Q: 可以删除 CSV 吗？
**A**: 可以，但建议保留。删除后如需更新索引，需要重新下载 CSV。

### Q: series.json 可以删除吗？
**A**: 可以，但会影响查询速度。可从 CSV 重新生成：
```bash
node src/build-index.js data/raw/IMF_WEO_data.csv
```

### Q: 如何更新到最新 IMF 数据？
**A**: 
1. 下载新 CSV
2. 放到 `data/raw/`
3. 重新运行 `build-index.js`

---

**目录结构清晰，数据管理规范！** 📁
