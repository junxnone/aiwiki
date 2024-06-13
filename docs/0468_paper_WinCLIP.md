---
Title | paper WinCLIP
-- | --
Created @ | `2024-06-13T01:21:32Z`
Updated @| `2024-06-13T01:22:51Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/468)

---
# WinCLIP

*   通过使用手动设计的状态词和提示词模板关联异常/正常样本
*   **Compositional Prompt Ensemble** -> `Anomaly Classification`
*   **window-based CLIP** -> `Anomaly Segmentation`
*   **WinCLIP+** -> Few shot

## Arch

*   **CLIP-AC**
    *   基于 OpenCLIP 实现的的二分类异常检测框架
    *   prompts: `normal [o]` / `anomalous [o]`
*   **CPE** - `Compositional prompt ensemble`
    *   **state words**;
        *   `perfect/flawless/unblemished/without faw/without defect/without damage`
        *   `damaged/with flaw/with defect/with damage/...`
    *   **Text Template**
        *   `a cropped photo of the {}`
        *   `a close-up photo of a {}`
        *   `a photo of the {}`
        *   ...
*   CPE 生成的一些列 prompt 的 `text embedding`  进行  `Group Average` 和 `image embedding` 计算相似度生成 AC Score
*   **Window-based**
    *   通过 `sliding window` 生成 mid-scale/small-scale patch
    *   各 patch 分别通过 image encode 生成 window embedding ，组合成 mid/small embedding map
    *   mid/small embedding map 分别和 text embedding&#x20;
*   **Harmonic aggregation**
    *   每个窗口获取一个异常分数，将这个分数分散到所有window 中的 像素
    *   聚合 `overlapping` 处的多个分数, 通过 `armonic averaging` /`加权` 提升分割性能
*   **Multi-scale Aggeration**
    *   为了提升检测的多尺度能力，聚合多尺度的检测结果

![image](https://github.com/junxnone/aiwiki/assets/2216970/9656a871-da52-4cdc-9980-7cb3593a6161)


## Reference
- [深度学习论文: WinCLIP: Zero-/Few-Shot Anomaly Classification and Segmentation](https://blog.csdn.net/shanglianlm/article/details/132432407)
