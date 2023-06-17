---
Title | 3D Algos Reconstruction KinectFusion
-- | --
Created @ | `2022-04-05T03:11:35Z`
Updated @| `2023-06-17T15:34:19Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/306)

---
## Reference
- 2011 **KinectFusion** KinectFusion: Real-time 3D Reconstruction and Interaction Using a Moving Depth Camera [[paper](http://citeseerx.ist.psu.edu/viewdoc/summary?doi=10.1.1.229.2346)] [[code](https://github.com/Nerei/kinfu_remake)]
- 2011 [KinectFusion: Real-Time Dense Surface Mapping and Tracking](https://www.microsoft.com/en-us/research/wp-content/uploads/2016/02/ismar2011.pdf)
- [啥是KinectFusion](https://zhuanlan.zhihu.com/p/39021659)


## Brief
- 通过低成本深度摄像机获取的深度图进行三维重建



## Pipeline

Pipeline | Description
-- | --
Depth Map Conversion (**Measurement**) | 深度图转点云
Camera Tracking (**Pose Estimation**) | ICP 配准求相对位姿
Volumetric Integration (**Update Reconstruction**) | 重建物体表面
Raycasting (**Surface Prediction**) | 渲染

x | 两篇 paper 中的 pipeline
-- | --
1 | ![image](https://user-images.githubusercontent.com/2216970/161672621-53054631-c1c5-4801-9a34-6b631cb30018.png)
2 | ![image](https://user-images.githubusercontent.com/2216970/161672727-157a9767-332f-4004-a47b-ce17f2e317ac.png)


