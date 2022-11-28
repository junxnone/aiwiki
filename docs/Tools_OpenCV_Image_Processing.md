---
Title | Tools OpenCV Image Processing
-- | --
Created @ | `2022-11-28T06:22:43Z`
Last Modify @| `2022-11-28T06:38:22Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/316)

---
## Brief

- Image Filtering
- Geometric Image Transformations
- Miscellaneous Image Transformations
- Drawing Functions
- Color Space Conversions
- ColorMaps in OpenCV
- Planar Subdivision
- Histograms
- Structural Analysis and Shape Descriptors
- Motion Analysis and Object Tracking
- Feature Detection
- Object Detection
- Image Segmentation
- C API
- Hardware Acceleration Layer


## Image Filtering

- 用于处理 2D Image 中各种线性/非线性 `filtering`
- **线性操作**: 相邻像素的加权和
- **形态学操作**: 相邻像素的最小/最大值
- ...
- `Output Image` 拥有和 `Input Image` 相同的宽高和通道数
- 需要通过扩展边界像素(BorderTypes) 来计算边界像素值
- **Func**
  - `bilateralFilter` - 双边滤波器 - 减少不需要的噪音, 并保持边缘, 处理速度较慢
  - 
  - 
