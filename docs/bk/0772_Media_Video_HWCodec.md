-----

| Title     | Media Video HWCodec                                   |
| --------- | ----------------------------------------------------- |
| Created @ | `2026-11-25T16:17:05Z`                                |
| Updated @ | `2026-11-25T16:21:21Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/772) |

-----

# Video HWCodec

视频硬件编解码：为什么用硬件、各平台的 API (VA-API、QSV、NVENC/NVDEC 等) 以及在 FFmpeg 和
GStreamer 里怎么调用。

## 为什么用硬件编解码

  - 软件编解码 (x264、libavcodec) 跑在 CPU 上，高分辨率、多路视频时 CPU 占用很高
  - 现代 GPU/SoC 里有专用的固定功能编解码单元，功耗低、速度快，不占用 CPU 和 GPU 的通用计算核心
  - 代价：码率相同时画质通常略低于软件编码的慢速预设 (如 x264 `slow`)；支持的编码、分辨率和 Profile 受硬件代际限制
    `[经验]`

## 数据通路

下图对比软件解码与硬件解码后接后处理/推理的数据流，重点是数据是否要在 CPU 内存与 GPU 显存之间来回拷贝：

``` mermaid
flowchart LR
    subgraph SW[软件解码路径]
        A1[码流] --> B1[CPU 解码] --> C1[系统内存 yuv] --> D1[上传到 GPU] --> E1[处理/推理]
    end
    subgraph HW[硬件解码 + 零拷贝路径]
        A2[码流] --> B2[GPU 解码单元] --> C2[GPU 显存表面<br>VASurface/DMABuf] --> E2[处理/推理/显示]
    end
```

图中：

  - 上面是软件路径：CPU 解码出的 yuv 在系统内存里，要再拷贝到 GPU 才能做后处理或推理，每帧一次大拷贝 (1080p 一帧约 3
    MB)
  - 下面是硬件路径：解码结果直接留在 GPU 显存里，用 VASurface、DMABuf (Linux) 或 D3D11 纹理
    (Windows) 这类句柄传给后续阶段，省掉拷贝，这叫零拷贝 (zero-copy)
  - 零拷贝要求后续阶段 (缩放、色彩转换、推理) 也能直接读取该显存表面，否则中间一旦转回系统内存，收益就消失

## 常见 API

| API                          | 平台/厂商                  | 说明                                                         |
| ---------------------------- | ---------------------- | ---------------------------------------------------------- |
| VA-API                       | Linux，Intel 为主，AMD 也支持 | 开源接口，`libva`；Intel iGPU/dGPU 的 Linux 硬件编解码入口               |
| Intel QSV (Quick Sync Video) | Intel                  | 通过 oneVPL (取代已停止维护的 Intel Media SDK) 访问；Linux 下底层可走 VA-API |
| NVENC/NVDEC                  | NVIDIA                 | 专用编码/解码单元，通过 NVIDIA Video Codec SDK 访问                     |
| AMD AMF / VCN                | AMD                    | AMD 的媒体框架                                                  |
| DXVA2 / D3D11VA              | Windows                | 微软的硬件加速解码接口，各家 GPU 通用                                      |
| VideoToolbox                 | macOS/iOS              | 苹果的硬件编解码接口                                                 |
| V4L2 M2M                     | Linux 嵌入式              | 内存到内存的 V4L2 设备，常见于 ARM SoC                                 |

表中：`API` 是软件调用入口，`平台/厂商` 是适用范围。Intel 平台在 Linux 上用 VA-API 或
oneVPL，Windows 上用 D3D11VA 或 oneVPL；这些 API 最终驱动的是同一块硬件单元。

## 在 FFmpeg 中使用

  - 硬件解码：`-hwaccel vaapi` (Linux/Intel)、`-hwaccel qsv`、`-hwaccel
    cuda`、`-hwaccel d3d11va`
  - 硬件编码器：`h264_vaapi`、`h264_qsv`、`hevc_qsv`、`h264_nvenc`、`hevc_nvenc` 等

<!-- end list -->

    ffmpeg -hwaccel vaapi -hwaccel_device /dev/dri/renderD128 -hwaccel_output_format vaapi -i in.mp4 -c:v h264_vaapi -b:v 5M out.mp4

  - `-hwaccel_output_format vaapi` 让解码结果保留在 GPU 表面，不下载回系统内存，对应上图的零拷贝路径
  - 在 GPU 上缩放可使用 `scale_vaapi`、`scale_qsv`、`scale_cuda` 滤镜

## 在 GStreamer 中使用

  - 新的 `va` 插件 (gst-plugins-bad，GStreamer 1.20
    起)：`vah264dec`、`vah264enc`、`vapostproc`
  - 旧的 `gstreamer-vaapi`：`vaapih264dec`、`vaapipostproc` (已被 `va` 插件取代)
  - `qsv` 插件 (GStreamer 1.22 起)：`qsvh264dec`、`qsvh264enc`
  - NVIDIA：`nvh264dec`、`nvh264enc`

<!-- end list -->

    gst-launch-1.0 filesrc location=in.mp4 ! qtdemux ! h264parse ! vah264dec ! vapostproc ! autovideosink

  - 用 [gst-inspect](/0112_Media_Tools_GStreamer_gstinspect) 确认系统里有哪些硬件
    element，例如 `gst-inspect-1.0 | grep -i va`
  - 解码器的输出 caps 里带 `memory:VAMemory` 或 `memory:DMABuf` 时，表示数据仍在
    GPU，可以零拷贝传给后续 element

## 排查

  - Linux 下用 `vainfo` 查看驱动支持哪些 Profile 和 Entrypoint (`VAEntrypointVLD`
    为解码，`VAEntrypointEncSlice` 为编码)
  - 提示不支持某编码/Profile 时，先检查硬件代际是否支持，例如较早的 Intel 核显不支持 AV1 解码 `[待核实]`
    具体型号请查阅官方规格
  - 确认硬解真的在工作：看 CPU 占用是否明显下降，或用 `intel_gpu_top` (Intel) 观察 Video 引擎利用率
  - 码率、GOP 等参数含义见 [Video Codec](/0770_Media_Video_Codec)

## Reference

  - [Hardware Acceleration - FFmpeg
    Wiki](https://trac.ffmpeg.org/wiki/HWAccelIntro)
  - [VAAPI - FFmpeg Wiki](https://trac.ffmpeg.org/wiki/Hardware/VAAPI)
  - [Intel oneVPL](https://github.com/intel/libvpl)
  - [libva - VA-API](https://github.com/intel/libva)
  - [GStreamer va
    plugin](https://gstreamer.freedesktop.org/documentation/va/index.html)
