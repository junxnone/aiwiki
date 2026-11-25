-----

| Title     | Media Image Camera GenICam                            |
| --------- | ----------------------------------------------------- |
| Created @ | `2021-10-09T06:38:46Z`                                |
| Updated @ | `2026-11-25T16:21:46Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/106) |

-----

## Reference

  - [GenICam -
    emva](https://www.emva.org/standards-technology/genicam/introduction-new/)
  - [GenICam
    History](https://www.emva.org/standards-technology/genicam/genicam-history/)
  - [Aravis](https://github.com/AravisProject/aravis)

## Brief

  - **GenICam** - `Generic Interface for Cameras`
      - 由 EMVA (European Machine Vision Association) 维护的工业相机通用编程接口标准
      - 目标: 不论相机用什么接口 (GigE/USB3/CoaXPress/Camera Link) 和哪家厂商,
        上层软件都可以用同一套 API 和同一套特征名来控制相机
  - **GenICam Runtime** (Linux/Mac/Windows)

## 标准组成

下图展示 GenICam 各个子标准在应用与相机之间的分层位置:

``` mermaid
flowchart TB
    APP[应用程序] --> GENAPI[GenApi<br>读取 XML 描述文件, 提供特征访问]
    GENAPI --> SFNC[SFNC<br>标准特征命名]
    GENAPI --> PFNC[PFNC<br>像素格式命名]
    GENAPI --> GENTL[GenTL<br>传输层统一 API]
    GENTL --> TL1[GigE Vision]
    GENTL --> TL2[USB3 Vision]
    GENTL --> TL3[CoaXPress / Camera Link]
    TL1 --> CAM[相机]
    TL2 --> CAM
    TL3 --> CAM
```

图中：

  - 自上而下是调用方向: 应用通过 GenApi 访问相机, GenApi 再通过 GenTL 与具体传输层通信, 最终到达相机
  - `GenApi`: 相机内部带有一份 XML 描述文件, 声明相机有哪些特征 (曝光、增益、分辨率等) 以及对应的寄存器地址;
    GenApi 解析这份文件生成节点树, 应用按特征名读写, 无需知道寄存器细节
  - `SFNC` (Standard Features Naming Convention): 规定特征的标准名称, 例如
    `ExposureTime`、`Gain`、`Width`、`PixelFormat`, 使不同厂商的相机可以用同一段代码设置
  - `PFNC` (Pixel Format Naming Convention): 规定像素格式的标准名称, 见
    [像素格式](/0119_Media_Image_Camera_PixelFormat)
  - `GenTL` (Transport Layer): 统一的传输层 C API, 屏蔽 GigE Vision / USB3
    Vision / CoaXPress 等接口的差异, 由各厂商以 `.cti` 动态库提供
  - 此外还有 `GenCP` (Generic Control Protocol, 控制协议) 等子标准, 此处不展开

## Tools

  - [Aravis](/0108_Media_Image_Camera_GenICam_Aravis) - 开源的 GenICam 相机库
    (GigE Vision/USB3 Vision), Linux 下常用

## UseCase

  - 用 `arv-tool-0.8` 列出并读写相机特征, 或用 `arv-viewer` 预览图像, 见
    [Aravis](/0108_Media_Image_Camera_GenICam_Aravis)
  - 用 Aravis 的 GStreamer 插件 `aravissrc` 把 GigE 相机接入
    [GStreamer](/0109_Media_Tools_GStreamer) pipeline (`[待核实]` 具体版本和属性以
    Aravis 文档为准)
