-----

| Title     | Media Tools GStreamer gstdiscoverer                   |
| --------- | ----------------------------------------------------- |
| Created @ | `2021-02-05T03:30:10Z`                                |
| Updated @ | `2023-06-17T15:29:50Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/111) |

-----

# gst-discoverer

## Brief

  - 查看媒体文件信息

<!-- end list -->

    $ gst-discoverer-1.0 a.wav
    Analyzing file:///home/root/tmp/a.wav
    Done discovering file:///home/root/tmp/a.wav
    
    Topology:
      audio: WAV
    
    Properties:
      Duration: 0:00:27.220000000
      Seekable: yes
      Live: no
      Tags:
          container format: WAV
          bitrate: 2048000
          audio codec: Uncompressed 32-bit IEEE float audio

    $ gst-discoverer-1.0 b.h264
    Analyzing file:///home/root/tmp/b.h264
    Done discovering file:///home/root/tmp/b.h264
    
    Topology:
      video: H.264 (Constrained Baseline Profile)
    
    Properties:
      Duration: 0:00:00.166000000
      Seekable: yes
      Live: no
      Tags:
          video codec: H.264 (Constrained Baseline Profile)

    $ gst-discoverer-1.0 c.hevc
    
    Analyzing file:///home/root/tmp/c.hevc
    Done discovering file:///home/root/tmp/c.hevc
    
    Topology:
      video: H.265 (Main Profile)
    
    Properties:
      Duration: 0:00:00.000000000
      Seekable: yes
      Live: no
      Tags:
          video codec: H.265 (Main Profile)
