const Intro = () => {
  return (
    <div className="mt-8 max-w-4xl mx-auto">
      <div className="bg-gray-50 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">使用说明</h3>
        <div className="grid grid-cols-2 md:grid-cols-1 gap-4 md:gap-8 text-sm text-gray-600">
          <div className="flex items-center space-x-2">
            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
            <p>支持拖拽上传或点击选择文件</p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
            <p>可批量处理多张图片</p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
            <p>后台处理避免页面卡顿</p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
            <p>支持自定义压缩参数</p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
            <p>提供快速预设配置</p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
            <p>实时显示压缩进度和结果</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Intro;
