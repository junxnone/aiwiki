---
Title | Media Audio Basics
-- | --
Created @ | `2026-11-25T16:20:26Z`
Updated @| `2026-11-25T16:20:26Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/775)

---
# Audio Basics

音频基础：声音如何变成数字信号 (PCM)，以及采样率、位深、声道和码率之间的关系。这是后面理解音频编码 ([Audio Codec](@@AC@@)) 和多媒体工具 ([FFmpeg](@@FF@@)、[GStreamer](/0109_Media_Tools_GStreamer)) 的前提。

## 数字化流程

下图展示一段模拟声音是怎样经过采样和量化变成 PCM 数据的：

```mermaid
flowchart LR
    A[声波] --> B[麦克风<br>模拟电信号]
    B --> C[抗混叠低通滤波]
    C --> D[采样<br>每隔 Ts 取一次值]
    D --> E[量化<br>取整到 2^b 个电平]
    E --> F[PCM 数据<br>一串整数]
```

图中：

- 从左到右是数据流：声波经麦克风变成连续的电压信号，再依次经过滤波、采样、量化，最后得到 PCM (Pulse Code Modulation，脉冲编码调制) 数据
- `抗混叠低通滤波`：先滤掉高于奈奎斯特频率的成分，否则采样后会产生混叠，见下文
- `采样`：在时间上离散化；`量化`：在幅度上离散化，两步合起来就是 ADC (模数转换)
- 最终的 PCM 就是没有任何压缩的原始音频，WAV 文件里存的就是它加一个文件头

## 采样

$$
x[n] = x_a(nT_s),\qquad f_s = \frac{1}{T_s}
$$

其中：

- $x_a(t)$：连续时间的模拟信号
- $x[n]$：第 $n$ 个采样点的值，$n=0,1,2,\dots$
- $T_s$：采样间隔 (秒)；$f_s$：采样率 (Hz)，即每秒采多少个点

采样定理 (奈奎斯特-香农)：要无失真地还原信号，采样率必须不低于信号最高频率的两倍：

$$
f_s \ge 2 f_{max}
$$

其中：

- $f_{max}$：信号中有用成分的最高频率
- $f_s/2$：奈奎斯特频率，是该采样率能表示的频率上限
- 若信号含有高于 $f_s/2$ 的成分，它会「折叠」成低频假信号，这叫混叠 (aliasing)，采样后无法再消除，所以要在采样前低通滤波

人耳可听范围约 $20\text{Hz}\sim20\text{kHz}$，所以 CD 选用 $44.1\text{kHz}$，视频常用 $48\text{kHz}$。

表中是常见采样率与场景：

采样率 | 覆盖的最高频率 | 典型场景
-- | -- | --
8 kHz | 4 kHz | 电话语音
16 kHz | 8 kHz | 宽带语音、语音识别 (ASR) 常用
44.1 kHz | 22.05 kHz | CD 音乐
48 kHz | 24 kHz | 视频、专业音频
96 / 192 kHz | 48 / 96 kHz | 高解析度 (Hi-Res) 音频

表中：第二列等于 $f_s/2$，即该采样率理论上能表示的最高频率；语音识别模型多使用 16 kHz 输入，因此把 44.1/48 kHz 的音频送入前通常需要重采样。

## 量化

$$
\Delta = \frac{2A}{2^b},\qquad \mathrm{SQNR} \approx 6.02\,b + 1.76\ \text{dB}
$$

其中：

- $b$：位深 (bit depth)，每个采样点用多少位表示，常见 16、24 bit
- $A$：信号幅度的最大值 (满量程为 $[-A, A]$)
- $\Delta$：量化步长，相邻两个电平的间隔；取整产生的误差最大为 $\Delta/2$，表现为底噪
- $\mathrm{SQNR}$：信号与量化噪声之比 (dB)，上式针对满幅正弦波；位深每增加 1 bit，信噪比约提高 6 dB

位深 | 表示方式 | 动态范围 (约) | 备注
-- | -- | -- | --
8 bit | 无符号整数 | 48 dB | 早期音频、对讲
16 bit | 有符号整数 | 96 dB | CD、常见 WAV
24 bit | 有符号整数 | 144 dB | 专业录音
32 bit float | 浮点 | 非常大 | 音频处理的内部格式，取值通常在 $[-1,1]$

表中：`动态范围` 按 $6.02b$ 估算，是最大不失真幅度与底噪之比；32 bit 浮点不会因为中间处理而削波，因此常用于混音和算法内部。

## 声道与排列

- 声道 (channel)：mono 单声道 1、stereo 立体声 2 (左 L / 右 R)、5.1 环绕声 6 (L R C LFE Ls Rs)
- 一个「采样帧」(frame) 包含同一时刻所有声道的一个采样点
- 内存排列有两种：

排列方式 | 顺序 (立体声) | 说明
-- | -- | --
Interleaved 交错 | `L0 R0 L1 R1 L2 R2 ...` | WAV、大多数播放设备使用
Planar 平面 | `L0 L1 L2 ... R0 R1 R2 ...` | 部分编解码器和 DSP 内部使用，对应 FFmpeg 的 `fltp`、`s16p` 等格式

表中：交错排列与图像里 packed 像素排列类似，平面排列与 planar 类似，可对照 [像素格式](/0119_Media_Image_Camera_PixelFormat)。

## 码率与数据量

$$
\text{bitrate} = f_s \times b \times N_{ch}
$$

其中：

- $f_s$：采样率 (Hz)
- $b$：位深 (bit)
- $N_{ch}$：声道数
- 结果单位为 bit/s；文件大小 = 码率 × 时长 ÷ 8

示例：CD 音质 $44100 \times 16 \times 2 = 1411200\ \text{bit/s} \approx 1411\ \text{kbps}$，10 分钟约 $1411200\times600/8 \approx 105.8\ \text{MB}$；这也是为什么需要 [音频编码](@@AC@@) 来压缩。

## 常见原始格式命名

FFmpeg/GStreamer 对 PCM 格式名的写法：

含义 | FFmpeg | GStreamer
-- | -- | --
16 bit 有符号小端 | `s16le` | `S16LE`
24 bit 有符号小端 | `s24le` | `S24LE`
32 bit 浮点小端 | `f32le` | `F32LE`
8 bit 无符号 | `u8` | `U8`

表中：`le` 表示小端 (little-endian) 字节序；`s/u/f` 分别表示有符号整数、无符号整数、浮点。

原始 PCM 文件没有文件头，播放或转换时必须手动告诉工具采样率、格式和声道数：

```
ffmpeg -f s16le -ar 48000 -ac 2 -i in.pcm out.wav
```

## Reference
- [Nyquist–Shannon sampling theorem - Wikipedia](https://en.wikipedia.org/wiki/Nyquist%E2%80%93Shannon_sampling_theorem)
- [Pulse-code modulation - Wikipedia](https://en.wikipedia.org/wiki/Pulse-code_modulation)
- [Audio bit depth - Wikipedia](https://en.wikipedia.org/wiki/Audio_bit_depth)

