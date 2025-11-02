// 生成 PWA 图标的脚本
// 需要安装: npm install sharp --save-dev
// 运行: node scripts/generate-icons.js

const fs = require('fs');
const path = require('path');

const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64" fill="none">
  <defs>
    <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#3B82F6;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#2563EB;stop-opacity:1" />
    </linearGradient>
  </defs>
  <circle cx="32" cy="32" r="30" fill="url(#logoGradient)" stroke="#3B82F6" stroke-width="2"/>
  <rect x="18" y="18" width="20" height="16" rx="2" fill="white" opacity="0.9"/>
  <circle cx="22" cy="22" r="1.5" fill="#3B82F6"/>
  <path d="M18 26 L24 20 L30 26 L38 18 L38 32 L18 32 Z" fill="#3B82F6" opacity="0.7"/>
  <path d="M42 28 L46 28 L46 32 L50 32" stroke="white" stroke-width="2" stroke-linecap="round" fill="none"/>
  <path d="M44 26 L42 28 L44 30" stroke="white" stroke-width="2" stroke-linecap="round" fill="none"/>
  <path d="M48 30 L50 32 L48 34" stroke="white" stroke-width="2" stroke-linecap="round" fill="none"/>
</svg>`;

const publicDir = path.join(__dirname, '../public');
const svgPath = path.join(publicDir, 'logo.svg');

// 确保 SVG 文件存在
if (!fs.existsSync(svgPath)) {
  fs.writeFileSync(svgPath, svgContent, 'utf8');
  console.log('✓ 已创建 logo.svg');
}

console.log(`
要生成 PNG 图标，请使用以下方法之一：

方法 1: 使用在线工具
1. 访问 https://realfavicongenerator.net/
2. 上传 public/logo.svg
3. 生成并下载所有尺寸的图标
4. 将生成的文件放入 public/ 目录

方法 2: 使用 ImageMagick (如果已安装)
运行以下命令：
  convert -background none -resize 192x192 public/logo.svg public/icon-192.png
  convert -background none -resize 512x512 public/logo.svg public/icon-512.png
  convert -background none -resize 180x180 public/logo.svg public/apple-touch-icon.png

方法 3: 使用 Node.js sharp (需要安装)
  npm install sharp --save-dev
然后修改此脚本使用 sharp 库生成 PNG
`);

