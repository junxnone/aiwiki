---
Title | 3D Camera 成像原理
-- | --
Create Date | `2021-07-27T03:09:10Z`
Update Date | `2022-03-07T07:19:23Z`
Edit link | [here](https://github.com/junxnone/aiwiki/issues/40)

---
## Reference
- [三维扫描系列 点云绪论](https://blog.csdn.net/qq_32171789/article/details/114818081)

## Brief
- 线阵相机/面阵相机
- 结构光/TOF/双目
- 激光扫描
- 深度相机(Depth Camera)
- 双目相机(Stereo Camera)
- 光学相机多视角重建



## 3D 采集技术

![image](https://user-images.githubusercontent.com/2216970/126923107-0ac52d58-6405-44b5-8148-d7ebaf923699.png)


### 双目相机

Name | 原理 
-- | -- 
双目视机(Stereo Camera) | <img width=400px src="https://user-images.githubusercontent.com/2216970/126762729-a2e2d481-0e32-4f74-9923-d873c03518ff.png">

### 深度相机

Name | 原理 
-- | -- 
深度相机(Depth Camera) | 


### 激光
- 激光扫描的原理也是 TOF

Name | 原理 
-- | -- 
激光 | <img width=400px src="https://user-images.githubusercontent.com/2216970/126762825-28bca7cb-40c2-4055-ba75-cd54946f57bd.png">

分类 | 精度 | 距离 | 应用 | Image
-- | -- | -- | -- | --
星载激光雷达 | 
机载激光雷达 | 10cm | 大尺度 | 大尺度测绘 | <img width=300px src="https://user-images.githubusercontent.com/2216970/153130097-ddeb196e-6002-4d3e-b9bc-edc0e9bff32c.png">
地面激光雷达 | mm | 400+m | 地形测量/物体扫描 | <img width=300px src="https://user-images.githubusercontent.com/2216970/153130320-3ffd527e-189f-41e7-86eb-ddae8678f04f.png">
移动激光雷达 | cm | 200+m | 无人车/机器人 | <img width=300px src="https://user-images.githubusercontent.com/2216970/153130442-bd91f796-438d-485a-aa95-f793772fcb53.png">




### TOF
- IR 红外 TOF 相机
- Cameras
  - Kinect - Microsoft

Name | 原理 
-- | -- 
TOF | <img width=400px src="https://user-images.githubusercontent.com/2216970/126762752-632f00f3-dae2-4779-a8fe-8c9ffe6dcefb.png"> 


### 结构光
 
Name | 原理 
-- | -- 
结构光 | <img width=400px src="https://user-images.githubusercontent.com/2216970/126762766-dd7d82bb-1b4e-4604-9b11-b7414df36de4.png">



