-----

| Title     | Media Image Camera LowLatency                        |
| --------- | ---------------------------------------------------- |
| Created @ | `2021-04-26T07:54:06Z`                               |
| Updated @ | `2026-11-26T09:16:50Z`                               |
| Labels    | \`\`                                                 |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/37) |

-----

# 低延迟

端到端延迟是从事件发生（相机拍到）到画面显示在屏幕上的总时间，由多个环节叠加而成。要降低延迟，需要逐环节分析。

  - Camera latency
      - Video capture latency
      - ISP pipeline latency
      - Video encoding latency
  - Network latency
  - Decoding latency
  - Rendering latency
  - Screen latency

$$ \\text{Latency} = T\_{camera} + T\_{network} + T\_{decoding} +
T\_{rendering} + T\_{screen} $$

其中：

  - $T\_{camera}$：相机采集与编码耗时
  - $T\_{network}$：网络传输耗时
  - $T\_{decoding}$：客户端解码耗时
  - $T\_{rendering}$：渲染耗时
  - $T\_{screen}$：显示器刷新、显示耗时
  - $\\text{Latency}$：端到端总延迟，为各环节之和

<!-- end list -->

``` mermaid
flowchart LR
    A[相机采集] --> B[ISP]
    B --> C[编码]
    C --> D[网络]
    D --> E[解码]
    E --> F[渲染]
    F --> G[屏幕]
```

图中：每个方框是一个延迟环节，延迟是各环节耗时的总和；任何一个环节出现缓冲、排队，都会增加总延迟。

## 各环节的优化方向

| 环节  | 常见延迟来源      | 优化                    |
| --- | ----------- | --------------------- |
| 采集  | 曝光时间、传感器读出  | 缩短曝光，提高帧率             |
| ISP | 多帧处理        | 精简 ISP 流程             |
| 编码  | B 帧、缓冲、多帧前瞻 | 低延迟编码设置，不用 B 帧，使用硬件编码 |
| 网络  | 重传、抖动缓冲     | UDP/RTP 等低延迟传输，减小缓冲   |
| 解码  | 解码缓冲        | 硬件解码，低延迟模式            |
| 渲染  | 垂直同步、渲染队列   | 减少队列深度，直接送显           |
| 屏幕  | 刷新率         | 高刷新率显示器               |

表中：

  - 对比结论：每个环节的缓冲都会增加延迟，低延迟系统的基本原则是「尽量少缓冲、尽量早送出」
  - 帧率的影响：帧间隔 $\\Delta t = 1/\\text{fps}$，每多缓冲一帧，延迟就增加一个 $\\Delta t$

## UseCase

  - [飞拍](./定拍_vs_飞拍)

## Reference

  - [Low Latency Camera
    Concepts](https://zhuanlan.zhihu.com/p/281522274)
