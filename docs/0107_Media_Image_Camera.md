---
Title | Media Image Camera
-- | --
Created @ | `2021-10-19T15:14:46Z`
Updated @| `2026-11-25T16:30:49Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/107)

---
# Camera

相机的分类、相关标准、工具和厂商。选型和使用时涉及的传感器、曝光、标定等细节见下面的导航表。

## 分类

- 根据`连接类型`分类
  - GigE Camera
  - USB Camera
  - IP Camera
- 根据`传感器`分类
  - 面阵相机/Area Scan Camera
  - 线阵相机/Line Scan Camera
  - 3D Camera
  - CCD & CMOS

分类的含义和区别见 [Sensor](/0788_Media_Image_Camera_Sensor)；连接类型的区别如下：

连接类型 | 特点 | 常用标准
-- | -- | --
GigE | 千兆以太网，线长可达约 100 m，需网卡配置 | GigE Vision
USB | 即插即用，线短，带宽较高 | USB3 Vision / UVC
IP Camera | 内置编码和网络，输出压缩视频流 | RTSP/ONVIF，见 [Video Streaming](/0771_Media_Video_Streaming)

表中：`特点` 为典型情况；工业相机多用 GigE Vision 和 USB3 Vision，它们都遵循 [GenICam](/0106_Media_Image_Camera_GenICam)，监控摄像头多是 IP Camera。

## 使用相机的主要主题

文章 | 内容
-- | --
[Sensor](/0788_Media_Image_Camera_Sensor) | CCD/CMOS、快门、像素尺寸、视场、面阵线阵
[Exposure](/0789_Media_Image_Camera_Exposure) | 曝光时间、增益、自动曝光、白平衡
[像素格式](/0119_Media_Image_Camera_PixelFormat) | 相机输出的数据排布
[ISP](/0785_Media_Image_ISP) | RAW 到 RGB/YUV 的处理流水线
[Calibration](/0787_Media_Image_Camera_Calibration) | 标定内参、畸变、外参
[相机内参](/0547_Media_Image_Camera_相机内参) / [相机坐标系](/0548_Media_Image_Camera_相机坐标系) | 成像模型
[低延迟](/0037_Media_Image_Camera_LowLatency) | 采集到显示的延迟
[定拍 vs 飞拍](/0038_Media_Image_Camera_定拍飞拍) | 运动检测的拍摄方式

表中：每一行是一个主题；先看 Sensor 和 Exposure 了解成像原理，再看 Calibration 做测量。

## Tools
- [Aravis](/0108_Media_Image_Camera_GenICam_Aravis)
- [Gstreamer](/0109_Media_Tools_GStreamer)

## 相关标准

- [GenICam](/0106_Media_Image_Camera_GenICam)
- [rtsp]，见 [Video Streaming](/0771_Media_Video_Streaming)
- [GigE]
- [v4l2]

## 相关 Camera 厂商

- Basler
- 大华
- 大恒
- 迈德威视
- 维视
- 海康
- 奥康

