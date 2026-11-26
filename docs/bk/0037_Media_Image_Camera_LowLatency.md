-----

| Title     | Media Image Camera LowLatency                        |
| --------- | ---------------------------------------------------- |
| Created @ | `2021-04-26T07:54:06Z`                               |
| Updated @ | `2026-11-26T08:16:56Z`                               |
| Labels    | \`\`                                                 |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/37) |

-----

# 低延迟

## Reference

  - [Low Latency Camera
    Concepts](https://zhuanlan.zhihu.com/p/281522274)

## Brief

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

# UseCase

  - [飞拍](./定拍_vs_飞拍)
