-----

| Title     | Media Tools GStreamer Install                         |
| --------- | ----------------------------------------------------- |
| Created @ | `2021-10-21T03:13:36Z`                                |
| Updated @ | `2026-11-26T10:18:30Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/117) |

-----

# Install

GStreamer 的安装方法：Linux 下用包管理器安装，需要定制时从源码编译。

## Install

### Install on Ubuntu

    apt-get install libgstreamer1.0-dev libgstreamer-plugins-base1.0-dev libgstreamer-plugins-bad1.0-dev gstreamer1.0-plugins-base gstreamer1.0-plugins-good gstreamer1.0-plugins-bad gstreamer1.0-plugins-ugly gstreamer1.0-libav gstreamer1.0-doc gstreamer1.0-tools gstreamer1.0-x gstreamer1.0-alsa gstreamer1.0-gl gstreamer1.0-gtk3 gstreamer1.0-qt5 gstreamer1.0-pulseaudio

各个包的作用：

| 包                                                    | 作用                                                              |
| ---------------------------------------------------- | --------------------------------------------------------------- |
| libgstreamer1.0-dev、libgstreamer-plugins-base1.0-dev | 开发库与头文件（写代码需要）                                                  |
| gstreamer1.0-plugins-base / good / bad / ugly        | 各插件集，见 [Plugins](https://github.com/junxnone/aiwiki/issues/143) |
| gstreamer1.0-libav                                   | 基于 libav 的编解码插件                                                 |
| gstreamer1.0-doc                                     | 文档                                                              |

表中：对比结论：只运行 pipeline 需要插件集和 tools；开发还需要 `-dev` 包。

验证：

    gst-launch-1.0 --version
    gst-inspect-1.0 | head

可用 [gst-launch](https://github.com/junxnone/aiwiki/issues/110)
搭建测试管道确认安装成功。

### build from source

  - Cerbero - 支持跨平台编译 - Android/IOS/UWP/...
  - Meson - Only Linux/Windows/macOS

<!-- end list -->

    sudo apt install autopoint gtk-doc-tools

| 方式      | 适用                             |
| ------- | ------------------------------ |
| Cerbero | 需要为 Android、iOS 等多平台打包         |
| Meson   | 仅在 Linux / Windows / macOS 上编译 |

表中：对比结论：只在桌面系统编译用 Meson，需要移动端或跨平台打包用 Cerbero。

## Reference

  - [Installing
    GStreamer](https://gstreamer.freedesktop.org/documentation/installing/index.html?gi-language=c)
  - [Linux
    Install](https://gstreamer.freedesktop.org/documentation/installing/on-linux.html?gi-language=c)
