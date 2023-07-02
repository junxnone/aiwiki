-----

| Title         | OpenCV IO Video                                       |
| ------------- | ----------------------------------------------------- |
| Created @     | `2019-08-09T08:54:58Z`                                |
| Last Modify @ | `2022-12-27T09:39:39Z`                                |
| Labels        | `index`                                               |
| Edit @        | [here](https://github.com/junxnone/aiwiki/issues/352) |

-----

## Reference

  - [VideoCaptureProperties - opencv doc 4.1.1
    ](https://docs.opencv.org/4.1.1/d4/d15/group__videoio__flags__base.html#gaeb8dd9c89c10a5c63c139bf7c4f5704d)

## Brief

## Get Frame

## Video Information

    cap = cv2.VideoCapture(video_path)
    totalFrameNumber = cap.get(cv2.CAP_PROP_FRAME_COUNT)

### Prop ID

| 参数                             | propld | 功能                            |
| ------------------------------ | ------ | ----------------------------- |
| cv2.CAP\_PROP\_POS\_MSEC       | 0      | 视频文件的当前位置（以毫秒为单位）或视频捕获时间戳     |
| cv2.CAP\_PROP\_POS\_FRAMES     | 1      | 基于0的索引将被解码/捕获下一帧              |
| cv2.CAP\_PROP\_POS\_AVI\_RATIO | 2      | 视频文件的相对位置：0 - 视频的开始，1 - 视频的结束 |
| cv2.CAP\_PROP\_FRAME\_WIDTH    | 3      | 帧的宽度                          |
| cv2.CAP\_PROP\_FRAME\_HEIGHT   | 4      | 帧的高度                          |
| cv2.CAP\_PROP\_FPS             | 5      | 帧速                            |
| cv2.CAP\_PROP\_FOURCC          | 6      | 4个字符表示的视频编码器格式                |
| cv2.CAP\_PROP\_FRAME\_COUNT    | 7      | 帧数                            |
| cv2.CAP\_PROP\_FORMAT          | 8      | byretrieve()返回的Mat对象的格式       |
| cv2.CAP\_PROP\_MODE            | 9      | 指示当前捕获模式的后端特定值                |
| cv2.CAP\_PROP\_BRIGHTNESS      | 10     | 图像的亮度（仅适用于相机）                 |
| cv2.CAP\_PROP\_CONTRAST        | 11     | 图像对比度（仅适用于相机）                 |
| cv2.CAP\_PROP\_SATURATION      | 12     | 图像的饱和度（仅适用于相机）                |
| cv2.CAP\_PROP\_HUE             | 13     | 图像的色相（仅适用于相机）                 |
| cv2.CAP\_PROP\_GAIN            | 14     | 图像的增益（仅适用于相机）                 |
| cv2.CAP\_PROP\_EXPOSURE        | 15     | 曝光（仅适用于相机）                    |
| cv2.CAP\_PROP\_CONVERT\_RGB    | 16     | 表示图像是否应转换为RGB的布尔标志            |
| cv2.CAP\_PROP\_WHITE\_BALANCE  | 17     |                               |
| cv2.CAP\_PROP\_RECTIFICATION   | 18     | 立体摄像机的整流标志                    |
