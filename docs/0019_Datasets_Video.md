---
Title | Datasets Video
-- | --
Created @ | `2021-09-08T06:25:12Z`
Updated @| `2026-11-26T10:13:18Z`
Labels | `index`
Edit @| [here](https://github.com/junxnone/aiwiki/issues/19)

---
# Video

视频相关的常用数据集。

- [YouTube-8M Dataset](https://research.google.com/youtube8m/)
- [Kinetics - YouTube video ](https://deepmind.com/research/open-source/open-source-datasets/kinetics/)
- [UCF101 - Action Recognition Data Set](http://crcv.ucf.edu/data/UCF101.php)
- [ucf 系列其他dataset](http://crcv.ucf.edu/data/ucf-cc-50/) - University of Central Florida.
- [HMDB: a large human motion database]()
- [HMDB51](http://serre-lab.clps.brown.edu/resource/hmdb-a-large-human-motion-database/#dataset)
- [Deep Video Deblurring for Hand-held Cameras](http://www.cs.ubc.ca/labs/imager/tr/2017/DeepVideoDeblurring/)

## 对比

| 数据集 | 任务 | 说明 |
| --- | --- | --- |
| YouTube-8M | 视频分类 | Google 的大规模 YouTube 视频数据集，提供预提取的特征 |
| Kinetics | 动作识别 | DeepMind，来自 YouTube 的大规模动作视频 |
| UCF101 | 动作识别 | 101 类动作的视频，规模较小，常作基准 |
| HMDB51 | 动作识别 | 51 类人体动作，来自电影和网络视频 |
| Deep Video Deblurring | 视频去模糊 | 手持相机拍摄的模糊 / 清晰视频对 |

表中：

- **任务**：数据集的主要用途；**说明**：数据来源与特点
- 对比结论：UCF101、HMDB51 规模小，适合快速验证；Kinetics、YouTube-8M 规模大，用于预训练

其他类型的数据集见 [Datasets](https://github.com/junxnone/aiwiki/issues/17)。

