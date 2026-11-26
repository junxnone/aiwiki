---
Title | OpenCV js
-- | --
Created @ | `2021-07-30T06:24:04Z`
Updated @| `2026-11-26T10:07:00Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/339)

---
# OpenCV js

OpenCV.js 是 OpenCV 的 JavaScript 版本：把 OpenCV 编译成 WebAssembly，使图像处理、特征检测、部分视频与 DNN 功能可以直接在浏览器里运行，不需要服务器。

## 原理与流程

```mermaid
flowchart LR
    A[OpenCV C++ 源码] --> B[Emscripten 编译]
    B --> C[opencv.js + wasm]
    C --> D[网页加载并调用 cv.* API]
```

图中：OpenCV 的 C++ 代码经 Emscripten 编译成 WebAssembly，网页加载后用 JavaScript 调用，图像数据可来自 `<canvas>`、`<video>` 或文件。

## 最小示例

```html
<script async src="opencv.js" onload="onOpenCvReady();"></script>
<script>
function onOpenCvReady() {
  cv['onRuntimeInitialized'] = () => {
    let src = cv.imread('canvasInput');          // 从 canvas 读图
    let dst = new cv.Mat();
    cv.cvtColor(src, dst, cv.COLOR_RGBA2GRAY);   // 转灰度
    cv.imshow('canvasOutput', dst);              // 显示
    src.delete(); dst.delete();                  // 手动释放内存
  };
}
</script>
```

其中：

- `cv.imread` / `cv.imshow`：在 `<canvas>` 与 `cv.Mat` 之间读写图像
- `cv.cvtColor`：与 C++ / Python 同名的接口，参数的用法大体一致
- `src.delete()`：WebAssembly 里的 `Mat` 不会被 JavaScript 垃圾回收，必须手动释放，否则内存泄漏

## 特点

| 特点 | 说明 |
| --- | --- |
| 无需安装 | 浏览器里直接运行，便于做在线演示 |
| 隐私 | 图像在本地处理，不上传服务器 |
| 性能 | WebAssembly 接近原生，但慢于原生 C++ |
| 接口 | 与 C++ API 相近，部分模块未编译进去 |

表中：对比结论：适合做在线 demo、轻量实时处理（如摄像头滤镜）；复杂计算仍应在后端或本地完成。

## UseCase

- 摄像头与实时处理、心率检测、斑点检测等，示例见下面的项目与 demo

## Reference
- [WebCamera](https://github.com/riju/WebCamera) [[demo](https://riju.github.io/WebCamera/samples/)]
- [opencv_js](https://github.com/ganwenyao/opencv_js) [[demo](https://ganwenyao.github.io/opencv_js/)]
- [heartbeat-js](https://github.com/prouast/heartbeat-js) [[demo](https://prouast.github.io/heartbeat-js/)]
- [blob detector](https://github.com/sadmanca/opencv-app) [[demo](https://openinsulin.netlify.app/)]

