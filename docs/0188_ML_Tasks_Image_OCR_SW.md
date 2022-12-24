---
Title | ML Tasks Image OCR SW
-- | --
Created @ | `2020-05-08T06:06:40Z`
Last Modify @| `2022-12-24T13:02:45Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/188)

---
## Reference
- [paper - 2017 - Scene Text Recognition with Sliding Convolutional Character Models](https://arxiv.org/pdf/1709.01727.pdf)
- [场景文字识别Sliding Convolution笔记](https://blog.csdn.net/qq_14845119/article/details/79312860)
- [Sequence Modeling With CTC](https://distill.pub/2017/ctc/)

## Brief
- Sliding windows + CNN + [CTC](/CTC)
- English & Chinese
  - Softmax Layer - 37/7357 English/Chinese

## Arch
Name | Description
-- | --
Sliding window | crop `bbox x N`
Classification Layer | feature --> label
CTC Transcription layer | label --> final predict result



**Preprocess & Sliding Windows**

Preprocess | Training  | Testing
-- | -- | --
Input scale to `Height = 32`, Width 按比例缩放 (Pad -> 256) | ✅ | ✅ 
Window size | - Single-scale `WxH = 32x32`<br> - Multi-scale `WxH = 32x24` - `WxH = 32x32` - `WxH = 32x40` - > resize to `32x32` | `32x32`
Step Size  `= 4` |  ✅ | ✅ 


Pipeline | CNN Layers |  CTC Algo 
-- | -- | --
 ![image](https://user-images.githubusercontent.com/2216970/81381547-7f201e80-913f-11ea-987a-b7b39b7cafdf.png) | ![image](https://user-images.githubusercontent.com/2216970/81382855-a2e46400-9141-11ea-8740-6423dbbe2620.png) | ![image](https://user-images.githubusercontent.com/2216970/81460717-b3e0b400-91d9-11ea-9499-53ac1f23aafb.png)

sliding windows examples | ![image](https://user-images.githubusercontent.com/2216970/85986363-b663cb00-ba1e-11ea-8a67-059969ba1720.png)
-- | --

## decoding
- naive - `None` - `lexicon -free`
- lexicon based
- language model based




