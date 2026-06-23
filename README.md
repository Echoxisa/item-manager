# 物品管理系统 - 3D 等距像素风

星露谷物语风格的 3D 等距视角物品管理网页应用。

## 技术栈

- **Vue 3** + **Vite** — SPA 框架
- **Three.js** — 等距3D场景渲染（正交相机 + 像素化后处理）
- **GSAP** — 相机过渡动画
- **Vue Router** — 场景/区域页面切换

## 功能

- 🏠 3D等距像素风桌面场景（星露谷风格）
- 🔍 全局搜索物品
- 🖱 悬停高亮 + 点击跳转
- 📦 按位置分区的卡片式物品列表
- 🔗 物品关联跳转（如笔尖↔Apple Pencil）
- ⏰ 过期提醒标签
- ✨ 粒子光效动画

## 开发

```bash
# 安装依赖
npm install

# 同步Obsidian物品数据
npm run build-data

# 启动开发服务器
npm run dev
```

## 数据同步

物品数据存储在 Obsidian vault 中 (`../物品/` 目录下的 `.md` 文件)。

```bash
# 重新生成 data.json
npm run build-data
```

## 部署

推送代码到 GitHub 后，通过 GitHub Actions 自动部署到 GitHub Pages。

## 数据结构

每个物品 md 文件的 frontmatter 格式：

```yaml
---
位置: "白色收纳柜/第一层（工具）"
数量: 13
物品类型: 文具配件
简要描述: "原装×1，纤维×4，橡胶×8"
关联物品:
  - "[[apple pencil]]"
过期时间: 2028-08-15
---
```