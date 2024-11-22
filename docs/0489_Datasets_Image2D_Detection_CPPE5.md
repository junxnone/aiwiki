---
Title | Datasets Image2D Detection CPPE5
-- | --
Created @ | `2024-11-22T03:19:28Z`
Updated @| `2024-11-22T03:23:26Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/489)

---
# CPPE-5
- Medical Personal Protective Equipment : 用于医学个人防护设备相关研究的数据集, 旨在研究医学个人防护设备的下级分类
- 数据集中的文本为英文，数据集大小在1K - 10K之间，包含1029个数据点（图像），其中训练集有1000张图像，测试集有29张图像。

![image](https://github.com/user-attachments/assets/da1de748-e6a5-49ec-ae09-58599738eac5)
 
 

##  数据集统计信息
- 4698 bounding boxes
- 1029 high-quality non-iconic images
- Average image size of 947 pixels
- 5 object categories
- ~4.57 annotations per image
- ~230MB




## 类别

Label | Description | cn
-- | -- | --
1 | Coverall | 连体服
2 | Face_Shield | 面罩
3 | Gloves | 手套
4 | Goggles | 眼镜
5 | Mask | 口罩


## 注释
 - **数据字段含义**
   - `image_id`：图像的唯一标识符。
   - `image`：`PIL.Image.Image`对象，表示图像数据（自动解码，注意查询方式以提高效率）。
   - `width`：图像宽度。
   - `height`：图像高度。
   - `objects`：一个字典，包含图像中对象的边界框元数据。
     - 其中`id`是注释的唯一标识符
     - `area`是边界框的面积
     - `bbox`是对象的边界框（采用COCO格式）
     - `category`是对象的类别，可能的值包括`Coverall`（0）/ `Face_Shield`（1）/ `Gloves`（2）/ `Goggles`（3）/ `Mask`（4）




```
{
  'image_id': 15,
  'image': <PIL.JpegImagePlugin.JpegImageFile image mode=RGB size=943x663 at 0x2373B065C18>,
  'width': 943,
  'height': 663,
  'objects': {
    'id': [114, 115, 116, 117], 
    'area': [3796, 1596, 152768, 81002],
    'bbox': [
      [302.0, 109.0, 73.0, 52.0],
      [810.0, 100.0, 57.0, 28.0],
      [160.0, 31.0, 248.0, 616.0],
      [741.0, 68.0, 202.0, 401.0]
    ], 
    'category': [4, 4, 0, 0]
  }
}
```

## 数据集创建过程
- **收集图像**
   - 从Flickr获取图像，保存为“Original”大小，同时提取图像的相关元数据，如原始图像链接、宽度、高度、标题、上传时间、作者用户名、作者姓名、作者资料、许可证、MD5哈希值等。
   - 从Google Images获取少量图像，并提取原始图像链接、宽度、高度、MD5哈希值等元数据。
   - 使用安全过滤器去除不合适内容的图像，使用GIST描述符去除近似重复的图像。
- **标注过程**
   - 数据集标注分两个阶段，第一阶段标注416张图像，第二阶段标注613张图像。为志愿者提供了类别描述表格（包括工作服、口罩、面罩、手套、护目镜的定义）以及正确标注、错误标注和不适用标注的示例图像。
   - 每个志愿者在标注任务前需进行练习以确保能正确识别类别和标注。标注过程中，先由两名志愿者独立标注图像，若边界框数量、标签或标注差异较大，则由第三名志愿者整合结果，最后由一名志愿者验证边界框标注。最终得到1029张高质量、主要为非标志性且标注准确的图像。标注人员为多个志愿者，使用开源工具LabelImg进行标注。



## Reference
- [CPPE - 5: Medical Personal Protective Equipment Dataset](https://sites.google.com/view/cppe5)
- [Github](https://github.com/Rishit-dagli/CPPE-Dataset)
- [paper - 2023.2 - CPPE-5: Medical Personal Protective Equipment Dataset](https://arxiv.org/abs/2112.09569)
- [Paperswithcode Leaderboard](https://paperswithcode.com/sota/object-detection-on-cppe-5)


