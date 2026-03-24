# IMF WEO Analyzer

IMF 世界经济展望数据库分析工具

**版本**: v1.1.0  
**更新**: 2026-03-24 - 新增数据表格和 CSV 下载功能

## 安装

```bash
cd skills/imf-weo-analyzer
npm install
```

## 构建索引

首次使用前需要构建索引：

```bash
npm run build-index /path/to/IMF_WEO_Oct_2025_updated.csv
```

## 使用

```bash
# 查询
npm run query "中国 2020-2030 年 GDP 增速"

# 或直接用 node
node src/index.js "金砖五国通胀率"
```

## 示例

```bash
# 数据查询
node src/index.js "美国 2020-2030 年 GDP"

# 画图（自动生成带数据表格的完整图表）
node src/index.js "画出中国日本韩国 GDP 增速对比图"
# 输出包含：
#   - 交互式折线图
#   - 完整数据表格
#   - CSV 下载按钮
#   - PNG 下载按钮

# 计算
node src/index.js "计算中国 GDP 2020-2025 年平均增速"

# 查定义
node src/index.js "primary fiscal deficit 定义"

# 查备注
node src/index.js "印度 GDP 财政年度说明"
```

## v1.1.0 新功能 🎉

生成的 HTML 图表现在自动包含：

1. **数据表格** - 显示所有年份和国家的精确数值
2. **预测标记** - 2025 年及以后用黄色背景 + * 号标记
3. **加权平均突出** - 加权平均列用粉色背景显示
4. **CSV 下载** - 一键下载 Excel 可打开的 CSV 文件
5. **滚动支持** - 表格支持横向和纵向滚动

**示例输出**: `output/brics_debt_with_table.html`

详细文档见 [SKILL.md](SKILL.md)
