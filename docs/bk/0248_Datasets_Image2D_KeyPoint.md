-----

| Title     | Datasets Image2D KeyPoint                             |
| --------- | ----------------------------------------------------- |
| Created @ | `2019-03-10T14:21:06Z`                                |
| Updated @ | `2026-11-11T09:37:22Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/248) |

-----

# KeyPoint 关键点 / 姿态数据集

关键点任务包括人体姿态估计（2D/3D）、手部姿态、足部关键点和服饰关键点。本文按类整理常用数据集并保留原有全部链接。COCO 的 17
点人体关键点标注见 [COCO](0247_Datasets_Image2D_COCO)，总入口见 [Datasets
Image2D](0018_Datasets_Image2D)。

> 规模数字多数来自官网/论文，标"（待核实）"的为凭记忆给出、未逐项核对。

## 一、Pose / Action 人体姿态与动作

| 数据集                                                                                                                          | 描述                                                                          | 简单统计                                           |
| ---------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- | ---------------------------------------------- |
| [MPII Human Pose](http://human-pose.mpi-inf.mpg.de/#download)                                                                | 2D 多人姿态基准，覆盖日常活动，指标 PCKh                                                    | 约 2.5 万张图，约 4 万人，410 类活动                       |
| [Leeds Sports Pose (LSP)](http://sam.johnson.io/research/lsp.html)                                                           | 体育运动单人姿态，14 个关节                                                             | 2,000 张图（1,000 训练 / 1,000 测试）；扩展版 LSPET 约 1 万张 |
| [FLIC](https://bensapp.github.io/flic-dataset.html)                                                                          | 好莱坞电影帧上半身姿态                                                                 | 约 5,003 张图（待核实）                                |
| [DensePose-COCO](https://github.com/facebookresearch/DensePose/blob/master/INSTALL.md#fetch-densepose-data)                  | 在 COCO 人体上标注图像到 3D 表面（UV）的稠密对应                                              | 约 5 万个人体、约 500 万点对应（待核实）                       |
| [DensePose-PoseTrack](https://github.com/facebookresearch/DensePose/tree/master/PoseTrack#fetch-densepose-posetrack-dataset) | PoseTrack 视频上的 DensePose 标注                                                 | （待核实）                                          |
| [Human3.6M](https://github.com/facebookresearch/VideoPose3D/blob/master/DATASETS.md)                                         | 室内多视角 3D 姿态，Mocap 真值（链接为 VideoPose3D 的数据准备说明）                               | 360 万帧，11 名受试者，4 台相机（待核实）                      |
| [HumanEva](http://humaneva.is.tue.mpg.de/datasets_human_1)                                                                   | 早期同步视频 + 动捕 3D 姿态                                                           | HumanEva-I 4 名受试者、6 个动作（待核实）                   |
| [Panoptic Studio](http://domedb.perception.cs.cmu.edu/index.html)                                                            | CMU 穹顶多相机采集的社交场景 3D 姿态                                                      | 480 路 VGA + 31 路 HD 相机（待核实）                    |
| [Human Pose Evaluator（VGG）](http://www.robots.ox.ac.uk/~vgg/data/pose_evaluation/)                                           | 用于评估姿态估计结果的数据                                                               | （待核实）                                          |
| [Breakfast Actions](http://serre-lab.clps.brown.edu/resource/breakfast-actions-dataset/)                                     | 做早餐的动作识别视频数据                                                                | 约 77 小时、1,712 段视频、52 人、48 类动作（待核实）             |
| [Multi-cue boundary detection](http://serre-lab.clps.brown.edu/resource/multicue/)                                           | 原文列于此，实为边界/边缘检测数据集（见 [Edge Detection](0098_Datasets_Image2D_EdgeDetection)） | 100 个场景（待核实）                                   |

## 二、Hand Pose 手部姿态

| 数据集                                                                                     | 描述                      | 简单统计                              |
| --------------------------------------------------------------------------------------- | ----------------------- | --------------------------------- |
| [ICVL](http://icvl.ee.ic.ac.uk/hands17/challenge/)                                      | 深度图手部姿态，Hands 2017 挑战赛页 | （待核实）                             |
| [NYU Hand Pose](https://cims.nyu.edu/~tompson/NYU_Hand_Pose_Dataset.htm)                | 深度图 + 36 点手部标注          | 训练约 7.3 万帧、测试约 8.3 千帧（待核实）        |
| [MSRA15](https://jimmysuen.github.io/)                                                  | 微软研究院深度图手部姿态            | 约 7.6 万帧（待核实）                     |
| [BigHand2.2M](http://icvl.ee.ic.ac.uk/hands17/challenge/)                               | 大规模手部深度图                | 约 220 万帧                          |
| [Dexter 1](http://handtracker.mpi-inf.mpg.de/projects/handtracker_iccv2013/dexter1.htm) | 手部跟踪评测序列                | （待核实）                             |
| [FHAD](https://guiggh.github.io/publications/first-person-hands/)                       | 第一视角手-物交互，3D 手部姿态与动作类别  | 10 万+ 帧，45 类动作（待核实）               |
| [EgoHands](http://vision.soic.indiana.edu/projects/egohands/)                           | 第一视角双人交互手部分割/检测         | 48 段视频，约 4,800 帧，约 1.5 万个手实例（待核实） |

## 三、FootPose 足部

| 数据集                                                                                                       | 描述                           | 简单统计              |
| --------------------------------------------------------------------------------------------------------- | ---------------------------- | ----------------- |
| [Human Foot Keypoint Dataset（CMU）](https://cmu-perceptual-computing-lab.github.io/foot_keypoint_dataset/) | 在 COCO 上扩充脚部关键点（OpenPose 所用） | 约 1.5 万个脚部实例（待核实） |

## 四、Garment 服饰

| 数据集                                                                               | 描述             | 简单统计  |
| --------------------------------------------------------------------------------- | -------------- | ----- |
| [服饰关键点定位（天池）](https://tianchi.aliyun.com/competition/entrance/231670/information) | 阿里天池比赛，服装关键点定位 | （待核实） |

## 选择建议

  - 2D 多人姿态：COCO Keypoints（主流）+ MPII。
  - 3D 人体姿态：Human3.6M、Panoptic Studio；用 VideoPose3D 流程较方便。
  - 手部：深度图方向用 NYU/ICVL/MSRA15/BigHand2.2M；第一视角用 FHAD/EgoHands。
  - 服饰关键点和检索可参考 [Retrieval](0241_Datasets_Image2D_Retrieval) 与
    [DeepFashion](0242_Datasets_Image2D_Retrieval_DeepFashion)。
  - 指标：人体 2D 常用 PCKh（MPII）、OKS-AP（COCO）；3D 常用 MPJPE。
