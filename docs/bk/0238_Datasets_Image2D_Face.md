-----

| Title     | Datasets Image2D Face                                 |
| --------- | ----------------------------------------------------- |
| Created @ | `2019-03-10T14:16:37Z`                                |
| Updated @ | `2026-11-11T09:37:02Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/238) |

-----

# Face 人脸数据集

人脸相关任务包括人脸检测（Detection）、识别/验证（Recognition/Verification）、属性与年龄估计、关键点对齐以及伪造检测（Forensics）。本文按用途整理常用人脸数据集，并保留原有全部链接。人脸检测的通用背景见
[Object Detection](0237_Datasets_Image2D_Detection)，人脸关键点/姿态见
[KeyPoint](0248_Datasets_Image2D_KeyPoint)，总入口见 [Datasets
Image2D](0018_Datasets_Image2D)。

> 规模数字多数来自官网或论文，标"（待核实）"的为凭记忆给出、未逐项联网核对，使用前请以官方页面为准。

## 一、人脸检测

| 数据集                                                           | 描述                                                        | 简单统计                                               |
| ------------------------------------------------------------- | --------------------------------------------------------- | -------------------------------------------------- |
| [WIDER FACE](http://mmlab.ie.cuhk.edu.hk/projects/WIDERFace/) | 来自 WIDER 数据集的 61 类事件场景，尺度/姿态/遮挡变化极大，按 Easy/Medium/Hard 评测 | 32,203 张图，393,703 个人脸；train/val/test 约 40%/10%/50% |
| [FDDB](http://vis-www.cs.umass.edu/fddb/index.html)           | 无约束环境人脸检测基准，椭圆标注，10 折交叉评测                                 | 2,845 张图，5,171 个人脸                                 |
| [LFW](http://vis-www.cs.umass.edu/lfw/#download)              | Labeled Faces in the Wild，网络新闻图片，经典人脸验证基准（6000 对）         | 13,233 张图，5,749 人                                  |
| [BioID](https://www.bioid.com/facedb/)                        | 室内灰度正脸，含 20 个面部特征点标注                                      | 1,521 张灰度图（384x286），23 人（待核实）                      |

## 二、人脸识别 / 验证

| 数据集                                                                                                            | 描述                                     | 简单统计                              |
| -------------------------------------------------------------------------------------------------------------- | -------------------------------------- | --------------------------------- |
| [VGGFace2](https://www.robots.ox.ac.uk/~vgg/data/vgg_face2/)                                                   | 姿态、年龄、光照、种族跨度大的大规模识别集                  | 约 331 万张图，9,131 人，平均每人约 363 张     |
| [VGGFace](http://www.robots.ox.ac.uk/~vgg/data/vgg_face/)                                                      | VGGFace2 的前身，VGG-Face 模型训练集（提供 URL 列表） | 约 260 万张图，2,622 人                 |
| [CelebA](http://mmlab.ie.cuhk.edu.hk/projects/CelebA.html)                                                     | 名人人脸，带 40 个属性与 5 个关键点                  | 202,599 张图，10,177 人               |
| [MSRA-CFW](https://www.microsoft.com/en-us/research/project/msra-cfw-data-set-of-celebrity-faces-on-the-web/)  | 网络名人人脸                                 | 约 20 万张人脸，1,583 人（待核实）            |
| [UMDFaces](https://www.umdfaces.io/)                                                                           | 带关键点、姿态、性别标注的无约束人脸                     | 第一批约 36.8 万人脸标注，8,277 人（待核实）      |
| [FERET](https://www.nist.gov/itl/iad/image-group/color-feret-database)                                         | NIST 早期（1993-1996）受控环境人脸库，现有彩色版        | 14,126 张图，1,199 人（待核实）            |
| [CMU Multi-PIE](http://www.flintbox.com/public/project/4742/)                                                  | 姿态/光照/表情受控采集                           | 337 人，超过 75 万张图，15 视角、19 种光照（待核实） |
| [diversity-in-faces（IBM）](https://www.research.ibm.com/artificial-intelligence/trusted-ai/diversity-in-faces/) | 强调多样性的标注集，含颅面测量、年龄性别等标注                | 100 万张图（待核实）                      |

## 三、年龄 / 属性 / 伪造

| 数据集                                                                             | 描述                             | 简单统计                                      |
| ------------------------------------------------------------------------------- | ------------------------------ | ----------------------------------------- |
| [IMDB-WIKI](https://data.vision.ee.ethz.ch/cvl/rrothe/imdb-wiki/)               | 名人年龄与性别估计的最大公开集之一              | 约 52 万张图（IMDb 约 46 万 + Wikipedia 约 6.2 万） |
| [FaceForensics](http://niessnerlab.org/projects/roessler2018faceforensics.html) | 人脸伪造检测数据集（后继为 FaceForensics++） | 约 1,000 段视频、50 万+ 帧（待核实）                  |

## 四、小型经典库

| 数据集                                                                                | 描述                  | 简单统计                                        |
| ---------------------------------------------------------------------------------- | ------------------- | ------------------------------------------- |
| [ORL](https://www.cl.cam.ac.uk/research/dtg/attarchive/facedatabase.html)          | AT\&T/ORL 人脸库，常用于教学 | 400 张灰度图（92x112），40 人，每人 10 张               |
| [Yale Face Database](http://cvc.cs.yale.edu/cvc/projects/yalefaces/yalefaces.html) | 表情与光照变化             | 165 张灰度图，15 人                               |
| [Yale Face Database B](https://computervisiononline.com/dataset/1105138686)        | 9 姿态 x 64 光照        | 10 人，约 5,850 张图（扩展版 Extended Yale B 为 28 人） |
| [UMIST](https://www.sheffield.ac.uk/eee/research/iel/research/face)                | 从侧脸到正脸的多姿态          | 564 张图，20 人（待核实）                            |
| [MIT database](http://web.mit.edu/emeyers/www/face_databases.html)                 | MIT 人脸库收集页          | （待核实）                                       |

## 选择建议

  - 做人脸检测：训练/评测用 WIDER FACE，补充 FDDB；口罩场景见下方 Reference 的口罩数据集链接。
  - 做人脸识别：训练用 VGGFace2（或 MS1M 等更大集合），验证用
    LFW；注意各集合的身份重叠与许可限制，部分数据集已因隐私问题下架或受限。
  - 做属性/年龄：CelebA、IMDB-WIKI。
  - 做伪造检测：FaceForensics/FaceForensics++。
  - 教学、快速验证算法：ORL、Yale。

## Reference

  - [公开人脸数据集](https://www.cnblogs.com/gmhappy/p/9472391.html)
  - [口罩检测数据集分享](https://zhuanlan.zhihu.com/p/103922982?utm_source=wechat_session)
    - [Google
    Drive](https://drive.google.com/drive/folders/1ByRDDh7ynQucA_06cbGF2jbuc-NHvUYQ)
