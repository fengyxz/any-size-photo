// 生成 PWA 和 Apple Touch Icon 的脚本
// 需要先安装: pnpm add -D sharp
// 运行: node scripts/generate-icons.mjs

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const svgPath = path.join(__dirname, '../public/logo.svg');
const publicDir = path.join(__dirname, '../public');

// 检查 sharp 是否可用
try {
  await import('sharp');
} catch (error) {
  console.log(`
❌ 未找到 sharp 模块，请先安装：
  pnpm add -D sharp

或者使用在线工具生成 PNG 图标：
1. 访问 https://realfavicongenerator.net/
2. 上传 public/logo.svg
3. 生成并下载图标文件
4. 将文件放入 public/ 目录
  `);
  process.exit(1);
}

const sizes = [
  { name: 'apple-touch-icon', size: 180 },
  { name: 'icon-192', size: 192 },
  { name: 'icon-512', size: 512 },
];

console.log('开始生成图标...\n');

for (const { name, size } of sizes) {
  try {
    const outputPath = path.join(publicDir, `${name}.png`);
    await sharp(svgPath)
      .resize(size, size, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
      .png()
      .toFile(outputPath);
    console.log(`✓ 已生成 ${name}.png (${size}x${size})`);
  } catch (error) {
    console.error(`✗ 生成 ${name}.png 失败:`, error.message);
  }
}

console.log('\n✓ 所有图标生成完成！');

