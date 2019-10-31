# 草稿

## BASE

- entry
- output
- loader
- plugin
  - html-webpack-plugin
  - HotModuleReplacementPlugin
- devServer
  - host
  - port
  - hot
  - contentBase
  - index
- optimization
  - minimize
  - minimizer [{}]
  - **splitChunks**

## Plugin

所有的事件钩子都基于 Webpack 的运行流程**生命周期**。

**Tapable**

1. 注入plugin配置项
2. 注册plugin，每一个plugin会订阅涉及到的事件回调
3. 运行中，依次执行回调


``` js
// 一个标准JavaScript类函数
class MyPluginDemo {
    // apply方法，第一个参数为注入的compiler实例
    apply (compiler) {
      // 注册compiler的compilation钩子，这是一个同步钩子，回调中会注入compilation实例
      compiler.hooks.compilation.tap('MyWebpackPluginDemo', compilation => {
          // 注册compilation的optimizeChunkAssets钩子，这是一个异步钩子
          compilation.hooks.optimizeChunkAssets.tapAsync(
              'MyWebpackPluginDemo',
              (chunks, callback) => {
                // 遍历所有chunk文件输出其内容，仅为举例，没有实际意义
                chunks.forEach(chunk => {
                    chunk.files.forEach(file => {
                        console.log(compilation.assets[file].source())
                    });
                });
                // 异步钩子操作完成后，调用callback方法
                callback();
              }
          );
      });
    }
}
```
