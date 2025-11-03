# HEIC 转换问题排查指南

## ❌ "file not defined" 错误

### 可能的原因

1. **heic2any 库内部错误**
   - heic2any 依赖 WebAssembly 和特定的浏览器 API
   - 某些浏览器可能不完全支持

2. **浏览器兼容性问题**
   - Safari（iOS/macOS）：✅ 通常支持良好
   - Chrome：✅ 支持良好
   - Firefox：⚠️ 部分版本支持有限
   - Edge：✅ 支持良好

3. **File 对象问题**
   - 某些环境下 File 构造函数可能不可用

### 🔧 排查步骤

#### 1. 检查浏览器控制台

打开浏览器开发者工具（F12），查看完整错误信息：
```
Console → 查看详细错误堆栈
```

#### 2. 检查文件信息

已添加的调试日志会显示：
```
开始转换 IMG_1234.heic, 类型: image/heic, 大小: 2097152
```

如果看到这行日志，说明文件读取正常。

#### 3. 常见错误及解决方案

**错误 1: HEIC 文件 type 为空**
```javascript
type: "", name: "IMG_1234.heic"
```
**解决：** 已通过文件扩展名检测解决

**错误 2: heic2any 库加载失败**
```
ReferenceError: heic2any is not defined
```
**解决：** 
```bash
cd /Users/antik/Desktop/any-size-photo/any-size-photo
pnpm install
# 确保 heic2any 已正确安装
```

**错误 3: WebAssembly 不支持**
```
WebAssembly is not defined
```
**解决：** 更新浏览器到最新版本

**错误 4: CORS 问题**
```
Failed to fetch wasm module
```
**解决：** 确保应用运行在本地服务器（如 `pnpm dev`）

### ✅ 临时解决方案

如果转换仍然失败，可以使用以下备选方案：

#### 方案 A：使用在线工具预转换
1. [Convertio](https://convertio.co/zh/heic-jpg/)
2. [CloudConvert](https://cloudconvert.com/heic-to-jpg)
3. 转换后上传 JPEG 文件

#### 方案 B：在 iPhone 上修改设置
1. 设置 → 相机 → 格式
2. 选择 "最兼容"
3. 之后拍摄的照片自动为 JPEG

#### 方案 C：使用 Mac 预览应用
1. 在 Mac 上打开 HEIC 文件
2. 文件 → 导出
3. 格式选择 JPEG
4. 批量处理可使用自动操作/快捷指令

### 🐛 如果问题持续

请提供以下信息以便调试：

1. **浏览器信息**
   - 浏览器名称和版本
   - 操作系统

2. **错误信息**
   - 完整的控制台错误日志
   - 错误发生的步骤

3. **文件信息**
   - HEIC 文件大小
   - 文件来源（iPhone、相机等）

### 📝 测试代码

可以在浏览器控制台运行以下代码测试环境：

```javascript
// 测试 1: 检查 File API
console.log('File API:', typeof File !== 'undefined' ? '✅' : '❌');

// 测试 2: 检查 WebAssembly
console.log('WebAssembly:', typeof WebAssembly !== 'undefined' ? '✅' : '❌');

// 测试 3: 检查 heic2any
console.log('heic2any:', typeof heic2any !== 'undefined' ? '✅' : '❌');

// 测试 4: 创建测试 File
try {
  const testFile = new File(['test'], 'test.txt', { type: 'text/plain' });
  console.log('File constructor:', testFile ? '✅' : '❌');
} catch (e) {
  console.error('File constructor:', '❌', e);
}
```

### 🔄 重新安装依赖

如果怀疑是安装问题：

```bash
# 删除 node_modules 和锁文件
rm -rf node_modules pnpm-lock.yaml

# 清除 pnpm 缓存
pnpm store prune

# 重新安装
pnpm install

# 重新启动开发服务器
pnpm dev
```

### 📊 已知兼容性

| 浏览器 | 版本 | HEIC 转换 |
|--------|------|-----------|
| Chrome | 90+ | ✅ 支持 |
| Safari | 14+ | ✅ 支持 |
| Firefox | 89+ | ⚠️ 部分支持 |
| Edge | 90+ | ✅ 支持 |

### 💡 开发建议

如果在开发环境遇到问题：

1. 使用 HTTPS 或 localhost（某些 API 需要安全上下文）
2. 检查 Content-Security-Policy 设置
3. 确保 WebAssembly MIME 类型正确配置

## 📞 获取帮助

如果以上方案都无法解决问题，请：

1. 查看 [heic2any GitHub Issues](https://github.com/alexcorvi/heic2any/issues)
2. 提供详细的错误日志和浏览器信息
3. 尝试使用不同的浏览器测试

## ✨ 成功案例

大多数用户在以下环境下转换成功：
- ✅ Chrome 120+ (macOS/Windows)
- ✅ Safari 17+ (macOS/iOS)
- ✅ Edge 120+ (Windows)

如果你的环境符合以上条件但仍有问题，很可能是依赖安装问题，建议重新安装。

