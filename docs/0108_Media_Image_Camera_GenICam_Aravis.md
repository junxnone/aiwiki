---
Title | Media Image Camera GenICam Aravis
-- | --
Created @ | `2021-10-19T16:32:03Z`
Updated @| `2026-11-26T09:16:48Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/108)

---
# GenICam Aravis

- Genicam cameras Tools
- GenICam 是工业相机的通用编程接口标准（GigE Vision、USB3 Vision 等相机都遵循）；Aravis 是开源的 GenICam 相机访问库，提供库、命令行工具和查看器

## 概念关系

```mermaid
flowchart LR
    A[应用程序] --> B[Aravis 库]
    B --> C[GigE Vision / USB3 Vision 协议]
    C --> D[工业相机 GenICam]
```

图中：应用通过 Aravis 库访问相机，库内部处理 GigE Vision / USB3 Vision 协议，无需厂商 SDK。

## Build
### Build with Ubuntu

```
sudo apt install libxml2-dev libgtk-3-dev libgirepository1.0-dev meson
git clone https://github.com/AravisProject/aravis
cd aravis
meson setup build -Dviewer=enabled
cd build
ninja
sudo ninja install
```

> 原文档中为 `meson configure -Dviewer=enabled`，在未创建 build 目录时无法执行，所以这里改为 `meson setup build -Dviewer=enabled`，请按实际环境核对。

## UseCase
- arv-viewer-xxx
  - 图形化查看相机画面，查看和修改相机参数

常用命令行工具（版本号随安装而定，如 `-0.8`）：

| 工具 | 作用 |
| --- | --- |
| `arv-tool-0.8` | 列出相机、读写特性（feature） |
| `arv-camera-test-0.8` | 采集测试，显示帧率 |
| `arv-viewer-0.8` | 图形化查看器 |

表中：对比结论：先用 `arv-tool` 确认相机可被发现，再用 viewer 查看画面。

## Reference
- [Using GigE cam as webcam for Zoom/Skype/Teams](https://gist.github.com/nitheeshkl/5cbf1a0777801a7e9b8e12f8252d465e)
- [Code - Github](https://github.com/AravisProject/aravis)

