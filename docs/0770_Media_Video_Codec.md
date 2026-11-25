---
Title | Media Video Codec
-- | --
Created @ | `2026-11-25T16:15:13Z`
Updated @| `2026-11-25T16:15:13Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/770)

---
# Video Codec

视频编码：为什么需要压缩，混合编码器 (预测 + 变换 + 量化 + 熵编码) 的原理，以及 H.264/H.265/AV1 等常见编码的区别。

## 为什么要压缩

$$
\text{bitrate}_{raw} = W \times H \times \text{bpp} \times \text{fps}
$$

其中：

- $W,H$：画面宽高 (像素)
- $\text{bpp}$：每像素位数，8 bit 的 `4:2:0` YUV 为 12，见 [YUV](/0121_Media_Image_Color_Model_YUV)
- $\text{fps}$：帧率 (frame/s)

例：1080p30 的 YUV420 原始码率 $1920\times1080\times12\times30\approx746\text{ Mbps}$；常见 H.264 直播码流只有约 $5\text{ Mbps}$，压缩比约 150 倍。

## 压缩的冗余来源

冗余类型 | 含义 | 对应技术
-- | -- | --
空间冗余 | 同一帧内相邻像素相似 | 帧内预测 (intra) + 变换
时间冗余 | 相邻帧内容相似 | 帧间预测 (inter) + 运动补偿
统计冗余 | 符号出现概率不均匀 | 熵编码 (CAVLC/CABAC)
视觉冗余 | 人眼对高频、色度不敏感 | 量化、色度下采样

表中：每一行是一种冗余及其对应的压缩手段；前三种基本无损，视觉冗余通过量化丢弃信息，是视频压缩有损的主要来源。

## 混合编码器结构

下图是 H.264/H.265/AV1 共同采用的混合编码框架，核心是「预测 → 残差 → 变换量化 → 熵编码」，并且编码器内部带一个解码环路：

```mermaid
flowchart LR
    X[当前帧块] --> S((-))
    P[预测块] --> S
    S -->|残差 r| T[变换 DCT]
    T --> Q[量化]
    Q --> E[熵编码] --> BS[码流]
    Q --> IQ[反量化 + 反变换]
    IQ --> R((+))
    P --> R
    R --> LF[环路滤波]
    LF --> RB[参考帧缓存]
    RB --> ME[运动估计/补偿<br>帧间预测]
    R --> IP[帧内预测]
    ME --> P
    IP --> P
```

图中：

- 上半部分是前向路径：当前块减去预测块得到残差，经变换、量化后做熵编码输出码流
- 下半部分是重建环路：量化后的系数反量化、反变换，加回预测得到重建块，再经环路滤波存入参考帧缓存；编码器必须用「解码后的」图像做参考，这样才能和解码器保持一致，不会累积漂移
- 预测有两条来源：帧内预测 (用同一帧已重建的邻近像素) 和帧间预测 (用参考帧里运动搜索到的相似块)
- 有损的环节只有量化；解码器做的是右下部分的重建过程

## 量化与码率

$$
q = \mathrm{round}\!\left(\frac{c}{Q_{step}}\right),\qquad Q_{step} \propto 2^{QP/6}
$$

其中：

- $c$：变换后的系数；$q$：量化后的整数，是熵编码的对象
- $Q_{step}$：量化步长，越大压缩越狠、画质越差
- $QP$：量化参数，H.264 中取 $0\sim51$，每增加 6，$Q_{step}$ 翻倍，码率大约减少一半 `[经验]`

衡量画质常用 PSNR：

$$
\mathrm{PSNR} = 10\log_{10}\frac{MAX^2}{MSE}
$$

其中：

- $MAX$：像素最大值，8 bit 时为 255
- $MSE$：原图与重建图的均方误差
- 数值越大越接近原图，常见可接受范围约 $30\sim40\text{dB}$ `[经验]`；PSNR 与主观感受不完全一致，也常配合 SSIM、VMAF 评估

## 帧类型与 GOP

帧类型 | 参考关系 | 码率 | 说明
-- | -- | -- | --
I 帧 | 不参考其他帧 | 大 | 可独立解码，随机访问和丢包恢复的起点；IDR 是一种特殊 I 帧，之后的帧不再参考它之前的帧
P 帧 | 参考之前的帧 | 中 | 只编码相对于前帧的变化
B 帧 | 参考前后帧 | 小 | 压缩率最高，但需要后面的帧先解码，造成延迟

表中：`参考关系` 决定了能否独立解码以及延迟；I 帧后面跟若干 P/B 帧，两个 I 帧之间的序列叫 GOP (Group of Pictures)。

- GOP 越长压缩率越高，但拖动进度条、丢包后恢复得越慢
- 使用 B 帧时，解码顺序与显示顺序不同，所以每帧有两个时间戳：DTS (Decoding Time Stamp，解码时间) 和 PTS (Presentation Time Stamp，显示时间)
- 低延迟场景 (视频会议、[低延迟相机](/0037_Media_Image_Camera_LowLatency)) 通常关闭 B 帧并缩短 GOP，见 [Video Streaming](@@VS@@)

## 码率控制

模式 | 含义 | 适用
-- | -- | --
CBR | 恒定码率 | 带宽固定的直播、通话
VBR / ABR | 可变码率，平均值接近目标 | 点播
CRF / CQP | 恒定质量 (x264/x265 的 CRF)，码率随画面复杂度变化 | 离线转码，追求固定画质

表中：CRF 在 x264 中取值 $0\sim51$，默认 23，数值越小画质越高 (x265 默认 28，二者不等价)。

## 常见编码

编码 | 标准/来源 | 年份 | 特点
-- | -- | -- | --
M-JPEG | 逐帧 JPEG | - | 只有帧内压缩，无帧间预测，码率高、延迟低、可随机访问每一帧，见 [Video](/0036_Media_Video)
MPEG-2 | ISO/ITU | 1995 | DVD、数字电视
H.264/AVC | ITU-T/ISO | 2003 | 兼容性最好，几乎所有设备都支持硬解
H.265/HEVC | ITU-T/ISO | 2013 | 同画质下码率约为 H.264 的一半 (标准制定时的目标) `[待核实]`，专利授权复杂
VP9 | Google | 2013 | 开源免版税，用于 YouTube
AV1 | AOMedia | 2018 | 开源免版税，压缩率高于 HEVC，编码很慢，硬件支持逐步普及 `[待核实]`
H.266/VVC | ITU-T/ISO | 2020 | 在 HEVC 基础上进一步提高压缩率，编码复杂度很高

表中：`年份` 是标准首次发布的年份；压缩率对比取决于测试集、编码器和参数，表中说法是量级而非精确值。

## 码流结构 (H.264/H.265)

- 码流由 NAL (Network Abstraction Layer) 单元组成，类型包括 SPS (序列参数集)、PPS (图像参数集)、IDR 切片、非 IDR 切片、SEI 等
- 裸流 (`.h264`/`.hevc`) 用起始码 `00 00 01` 或 `00 00 00 01` 分隔 NAL，称 Annex B 格式
- 装进 mp4 时则使用长度前缀格式 (AVCC/HVCC)，SPS/PPS 存在文件头里；两种格式之间转换需要 `h264_mp4toannexb` 之类的处理，见 [Video Container](@@VCT@@)
- 码流的 Profile/Level 描述了使用的编码工具和分辨率/码率上限，例如 H.264 的 Baseline/Main/High；[gst-discoverer](/0111_Media_Tools_GStreamer_gstdiscoverer) 输出里的 `H.264 (Constrained Baseline Profile)` 就是这个信息

## 工具

- 软件编解码：x264、x265、libaom/SVT-AV1，通过 [FFmpeg](@@FF@@) 或 GStreamer 的 `x264enc`/`x265enc` 调用
- 硬件编解码：见 [Video HWCodec](@@VH@@)

## Reference
- [Advanced Video Coding - Wikipedia](https://en.wikipedia.org/wiki/Advanced_Video_Coding)
- [High Efficiency Video Coding - Wikipedia](https://en.wikipedia.org/wiki/High_Efficiency_Video_Coding)
- [AV1 - Wikipedia](https://en.wikipedia.org/wiki/AV1)
- [Overview of the H.264/AVC Video Coding Standard](https://ieeexplore.ieee.org/document/1218189)
- [FFmpeg H.264 Encoding Guide](https://trac.ffmpeg.org/wiki/Encode/H.264)

