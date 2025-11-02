# 图片压缩逻辑说明

## 质量参数 (initialQuality) 的作用

### 对于 JPEG/WebP (有损格式)
- **直接控制图像质量**：质量参数直接影响图像的压缩比和视觉质量
- 质量范围：0.1 (最低质量，最小文件) 到 1.0 (最高质量，较大文件)
- **工作原理**：通过丢弃部分图像细节来减小文件大小
- 例如：0.8 质量会保留 80% 的图像细节

### 对于 PNG (无损格式)
虽然 PNG 本身是无损格式，但 `browser-image-compression` 库会巧妙地使用质量参数：

1. **间接控制尺寸调整**
   - quality 越低 → 库会更激进地缩小图片尺寸
   - quality 越高 → 库倾向于保持原始尺寸，只优化 PNG 编码

2. **与文件大小目标配合**
   - 当设置了 `maxSizeMB` 时，库会根据 `initialQuality` 决定缩小多少尺寸
   - 低质量参数 = 允许更多的尺寸缩减
   - 高质量参数 = 尽量保持尺寸，优先优化编码

3. **这就是为什么降低 initialQuality 可以压缩 PNG**
   - 设置 initialQuality = 0.6 时，库认为可以缩小更多尺寸
   - 设置 initialQuality = 0.9 时，库会尽量保持原尺寸

## 压缩模式详解

### 1. 文件大小模式 (size)
- **目标**：将文件压缩到指定的 maxSizeMB
- **策略**：
  - JPEG/WebP：降低质量 + 调整尺寸
  - PNG：主要通过调整尺寸（因为无损）
- **渐进式压缩**：如果一次压缩未达到目标，最多尝试 5 次，每次更激进

### 2. 像素尺寸模式 (pixel)
- **目标**：调整图片到指定的宽高
- **策略**：
  - 保持比例：按最大尺寸缩放，不扭曲
  - 自由比例：直接拉伸到指定尺寸（可能扭曲）
- **质量控制**：根据尺寸缩减程度智能选择质量

### 3. 质量模式 (quality)
- **目标**：使用指定的质量参数压缩
- **策略**：
  - JPEG/WebP：直接应用质量参数
  - PNG：根据质量参数决定尺寸调整程度

## PNG 压缩的完整流程

```
1. 检查原图是否已小于目标大小 → 是：直接返回
   ↓ 否
2. 调用 browser-image-compression
   参数：maxSizeMB, initialQuality, maxWidthOrHeight
   ↓
3. 库根据 quality 和 maxSizeMB 自动计算需要缩小的尺寸
   ↓
4. 执行尺寸调整 + PNG 优化编码
   ↓
5. 检查结果是否达标
   ↓ 否（且小于原图）
6. 渐进式压缩：最多 5 次
   - 每次根据当前大小与目标大小的比例
   - 计算新的缩放因子：sqrt(目标/当前 × 0.7)
   - 重新压缩
   ↓
7. 如果 5 次后仍失败且反而变大 → 返回原图
   否则 → 返回最接近目标的结果
```

## 为什么降低质量可以压缩 PNG

### 原理
`browser-image-compression` 内部逻辑：
```javascript
// 伪代码
if (fileType === "image/png" && currentSize > targetSize) {
  // 根据质量参数决定缩小程度
  let scaleFactor = calculateScale(quality, targetSize, currentSize);
  
  // quality 越低，scaleFactor 越小（缩小更多）
  if (quality < 0.5) scaleFactor *= 0.8;
  else if (quality < 0.7) scaleFactor *= 0.9;
  
  // 缩小图片尺寸
  newWidth = originalWidth * scaleFactor;
  newHeight = originalHeight * scaleFactor;
}
```

### 实际效果示例
假设原图：2000×1500px, 500KB，目标：50KB

- **initialQuality = 0.9** (高质量)
  - 库倾向保持尺寸，只优化编码
  - 可能结果：1800×1350px, 200KB ❌ 未达标
  
- **initialQuality = 0.6** (中质量)
  - 库允许更多尺寸缩减
  - 可能结果：800×600px, 60KB ⚠️ 接近目标
  
- **initialQuality = 0.3** (低质量)
  - 库激进缩减尺寸
  - 可能结果：500×375px, 40KB ✅ 达标

## 最佳实践

### PNG 压缩建议
1. **文件大小模式**：
   - 设置合理的 initialQuality (0.6-0.7)
   - 设置 maxWidthOrHeight 作为上限
   - 让渐进式压缩自动调整

2. **像素尺寸模式**：
   - 直接设置目标尺寸
   - 不依赖质量参数

3. **如果需要极致压缩**：
   - 考虑转换为 WebP 或 JPEG 格式
   - PNG 无损特性限制了压缩比

### JPEG/WebP 压缩建议
1. **照片类图片**：quality 0.7-0.9
2. **图标、插图**：quality 0.8-1.0
3. **缩略图**：quality 0.5-0.7

