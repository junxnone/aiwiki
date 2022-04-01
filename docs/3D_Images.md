---
Title | 3D Images
-- | --
Create Date | `2021-07-30T06:51:51Z`
Update Date | `2022-04-01T06:21:47Z`
Edit link | [here](https://github.com/junxnone/aiwiki/issues/39)

---
## Reference
- [Voxel - Wikipedia](https://en.wikipedia.org/wiki/Voxel)

## Brief
- [成像原理](./3D_Camera_成像原理)
- 3D 模型表示方式
  - [Depth map/Image]
  - [Voxel]
  - [Point Cloud]
  - [Mesh]



## 3D Images Format

Name | Description
-- | --
PLY | developed at Stanford University by Turk et al
STL | CAD Software
OBJ | developed by Wavefront Technologies
X3D | ISO standard XML-based file format
[Others](https://en.wikipedia.org/wiki/Category:Graphics_file_formats) | Wikipedia


- **点云格式分为有序点云/无序点云**
  - **有序点云** - 按照图方阵排列, 无效点使用 (0,0,0) 表示
  - **无序点云** - 点集合，点排列之间无关联

## Depth Map/Image
- 用一个通道来表示距离

## Voxel
- 立方体表示 ( 类比为2D Image 中的 Pixel)
 
<img width= 200 src='https://user-images.githubusercontent.com/2216970/161205920-d619e497-d32c-4b51-b4ab-741fa546415a.png'>

## Mesh
