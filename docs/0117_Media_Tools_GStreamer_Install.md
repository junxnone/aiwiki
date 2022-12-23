---
Title | Media Tools GStreamer Install
-- | --
Created @ | `2021-10-21T03:13:36Z`
Last Modify @| `2022-12-23T13:15:16Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/117)

---
## Reference
- [Installing GStreamer](https://gstreamer.freedesktop.org/documentation/installing/index.html?gi-language=c)
- [Linux Install](https://gstreamer.freedesktop.org/documentation/installing/on-linux.html?gi-language=c)

## Install

### Install on Ubuntu

```
apt-get install libgstreamer1.0-dev libgstreamer-plugins-base1.0-dev libgstreamer-plugins-bad1.0-dev gstreamer1.0-plugins-base gstreamer1.0-plugins-good gstreamer1.0-plugins-bad gstreamer1.0-plugins-ugly gstreamer1.0-libav gstreamer1.0-doc gstreamer1.0-tools gstreamer1.0-x gstreamer1.0-alsa gstreamer1.0-gl gstreamer1.0-gtk3 gstreamer1.0-qt5 gstreamer1.0-pulseaudio
```

### build from source
- Cerbero  - 支持跨平台编译 - Android/IOS/UWP/...
- Meson -  Only Linux/Windows/macOS

```
sudo apt install autopoint gtk-doc-tools
```
