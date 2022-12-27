---
Title | 3D Camera
-- | --
Created @ | `2021-07-27T03:09:10Z`
Last Modify @| `2022-12-27T03:32:12Z`
Labels | `index`
Edit @| [here](https://github.com/junxnone/aiwiki/issues/40)

---
## Reference
- [三维扫描系列 点云绪论](https://blog.csdn.net/qq_32171789/article/details/114818081)
- [ROS 3D Camera Survey](https://rosindustrial.org/3d-camera-survey)
- [A Survey on 3D Cameras: Metrological Comparison of Time-of-Flight, Structured-Light and Active Stereoscopy Technologies](https://www.researchgate.net/publication/325866790_State-of-the-Art_Devices_Comparison)
- [内参、外参、畸变参数三种参数与相机的标定方法与相机坐标系的理解](https://blog.csdn.net/tap880507/article/details/79670210)



## Brief
- 线阵相机/面阵相机
- 光学: TOF/结构光/双目
- 非光学: Radar/Sonar/...
- 主动/被动
- 光学相机多视角重建
- [[双目3D相机原理]]
- [[结构光3D原理]]

### TOF
- **光源:** IR 红外/ 激光
- 光源
  - 脉冲调制 : 直接测量时间差, 需要高精度时钟
  - 连续波调制 : 正弦波...
- Cameras
  - Kinect 2 - Microsoft
  - Sick 线阵 3D Camera(每次一个截面, 多次采集拼接成一幅图像)

Name | 原理 
-- | -- 
TOF | <img width=400px src="https://user-images.githubusercontent.com/2216970/126762752-632f00f3-dae2-4779-a8fe-8c9ffe6dcefb.png"> 

#### 激光相机/雷达
- 原理也是 TOF
- 三角测量法(光源/被测点/相机)

Name | 原理 
-- | -- 
激光 | <img width=400px src="https://user-images.githubusercontent.com/2216970/126762825-28bca7cb-40c2-4055-ba75-cd54946f57bd.png">

分类 | 精度 | 距离 | 应用 | Image
-- | -- | -- | -- | --
星载激光雷达 | 
机载激光雷达 | 10cm | 大尺度 | 大尺度测绘 | <img width=300px src="https://user-images.githubusercontent.com/2216970/153130097-ddeb196e-6002-4d3e-b9bc-edc0e9bff32c.png">
地面激光雷达 | mm | 400+m | 地形测量/物体扫描 | <img width=300px src="https://user-images.githubusercontent.com/2216970/153130320-3ffd527e-189f-41e7-86eb-ddae8678f04f.png">
移动激光雷达 | cm | 200+m | 无人车/机器人 | <img width=300px src="https://user-images.githubusercontent.com/2216970/153130442-bd91f796-438d-485a-aa95-f793772fcb53.png">



### 结构光
- 条纹结构光/编码结构光/
- 激光条纹/格雷码/正弦条纹 
- 计算编码畸变得到深度信息
- **散斑结构光** : 激光照射到粗糙物体后随机形成的衍射斑点。 
  - 这些散斑具有高度的随机性, 而且距离不同, 图案不同
  - 标定时记录标定平面光斑分布
  - 应用: IphoneX

Name | 原理 
-- | -- 
结构光 | <img width=400px src="https://user-images.githubusercontent.com/2216970/126762766-dd7d82bb-1b4e-4604-9b11-b7414df36de4.png">

### 双目相机
- **主动双目** 红外激光光源
- **被动双目** 无光源, 可见光成像
- 使用视差原理, 计算对应点位置差计算深度信息


Name | 原理 
-- | -- 
双目视机(Stereo Camera) | <img width=400px src="https://user-images.githubusercontent.com/2216970/126762729-a2e2d481-0e32-4f74-9923-d873c03518ff.png">



## Summary

![image](https://user-images.githubusercontent.com/2216970/126923107-0ac52d58-6405-44b5-8148-d7ebaf923699.png)


![image](https://user-images.githubusercontent.com/2216970/157004689-d95131c0-99d8-48f0-a10e-9c053d6c63c8.png)

