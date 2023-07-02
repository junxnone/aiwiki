-----

| Title         | 3D Tools PCL Downsampling                            |
| ------------- | ---------------------------------------------------- |
| Created @     | `2021-05-11T03:54:21Z`                               |
| Last Modify @ | `2022-12-25T03:53:01Z`                               |
| Labels        | \`\`                                                 |
| Edit @        | [here](https://github.com/junxnone/aiwiki/issues/82) |

-----

## Reference

  - [Downsampling a PointCloud using a VoxelGrid
    filter](https://pcl.readthedocs.io/projects/tutorials/en/latest/voxel_grid.html#voxelgrid)
    \[[code](https://github.com/PointCloudLibrary/pcl/blob/master/doc/tutorials/content/sources/voxel_grid/voxel_grid.cpp)\]

## Brief

  - Voxel Grid Downsampling
  - Farthest Point Sampling
  - Normal Space Sampling
  - Uniform Sampling
  - Random Sampling

## Voxel Grid Downsampling

  - 创建 3D 栅格
  - 每个栅格内的所有点的重心作为采样点
  - 栅格越大，下采样倍率越大

## UseCase

### Voxel Grid Downsampling

  - a pcl::VoxelGrid filter is created with a leaf size of 1cm

<!-- end list -->

``` 
#include <pcl/filters/voxel_grid.h>

  pcl::VoxelGrid<pcl::PCLPointCloud2> sor;
  sor.setInputCloud (cloud);
  sor.setLeafSize (0.01f, 0.01f, 0.01f);
  sor.filter (*cloud_filtered);

```
