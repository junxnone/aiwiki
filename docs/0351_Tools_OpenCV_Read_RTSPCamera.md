---
Title | Tools OpenCV Read RTSPCamera
-- | --
Created @ | `2018-11-30T09:42:47Z`
Last Modify @| `2022-12-27T03:16:37Z`
Labels | `ML`
Edit @| [here](https://github.com/junxnone/aiwiki/issues/351)

---

# 读取 RTSP Camera

## Code:
> IP Camera:  IPC-SR3321P-IP 

```
#!/usr/bin/env python
# coding=utf-8
import cv2
cap = cv2.VideoCapture("rtsp://192.168.1.10:554/user=admin&password=&channel=1&stream=0.sdp?")
print (cap.isOpened())
while cap.isOpened():
        success,frame = cap.read()
        cv2.imshow("frame",frame)
        cv2.waitKey(1) 

```
