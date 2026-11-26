-----

| Title     | 3D Tools PCL IO PCD                                   |
| --------- | ----------------------------------------------------- |
| Created @ | `2023-03-30T07:15:33Z`                                |
| Updated @ | `2026-11-26T09:16:32Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/400) |

-----

# PCD Format

  - PCD - `Point Cloud Data`
  - PCL（Point Cloud Library）原生的点云文件格式，文件由「文本头 + 数据」组成

## Example

  - **VERSION** : PCD spec 0.7
  - **FIELDS**: 数据维度名字
  - **SIZE**: 每个维度占用的字节大小
  - **TYPE**: 数据类型 (`F`: 浮点数，`I`: int，`U`: uint)
  - **COUNT**: 每个维度的元素个数
  - **WIDTH**: 点云数据宽度（有序点云为每行点数，无序点云为总点数）
  - **HEIGHT**: 点云数据集高度（无序点云为 1）
  - **POINTS**: 总点数
  - **DATA**: 存储类型 (`ASCII/binary`)

<!-- end list -->

    # .PCD v0.7 - Point Cloud Data file format
    VERSION 0.7
    FIELDS x y z
    SIZE 4 4 4
    TYPE F F F
    COUNT 1 1 1
    WIDTH 110
    HEIGHT 1
    VIEWPOINT 0 0 0 1 0 0 0
    POINTS 110
    DATA ascii
    0.2618683 0 0
    0.23598622 0.018518519 0.018412856
    0.21542533 0.037037037 0.036196072
    0.19700167 0.055555556 0.052741542
    0.1793666 0.074074075 0.067483477
    0.16249448 0.09259259 0.079917766
    0.14649306 0.11111111 0.089619219
    ...

## 头部字段说明

| 字段             | 含义          | 例子                                                     |
| -------------- | ----------- | ------------------------------------------------------ |
| FIELDS         | 每个点包含的维度名   | `x y z`、`x y z rgb`、`x y z normal_x normal_y normal_z` |
| SIZE           | 每个维度的字节数    | `4`（32 位）、`8`（64 位）                                    |
| TYPE           | 每个维度的类型     | `F` 浮点、`I` 有符号整数、`U` 无符号整数                             |
| COUNT          | 每个维度包含的元素数  | 通常为 1；特征描述子可大于 1                                       |
| WIDTH / HEIGHT | 点云的组织方式     | `HEIGHT 1` 表示无序点云；`HEIGHT>1` 表示有序点云（像图像一样）             |
| VIEWPOINT      | 采集视点：平移加四元数 | `tx ty tz qw qx qy qz`                                 |
| POINTS         | 点的总数        | 应等于 $\\text{WIDTH}\\times\\text{HEIGHT}$               |
| DATA           | 数据存储方式      | `ascii`、`binary`、`binary_compressed`                   |

表中：

  - SIZE 与 TYPE 组合决定数值类型，如 `SIZE 4` + `TYPE F` 是 32 位浮点，`SIZE 1` + `TYPE
    U` 是 8 位无符号整数
  - 对比结论：无序点云适合激光扫描结果，有序点云保留了传感器的网格结构，便于邻域查询

总点数关系：

$$ \\text{POINTS}=\\text{WIDTH}\\times\\text{HEIGHT} $$

其中：`WIDTH`、`HEIGHT` 即头部同名字段；无序点云 `HEIGHT` 为 1，所以 `POINTS` 等于 `WIDTH`。

## 读写

``` cpp
#include <pcl/io/pcd_io.h>

pcl::PointCloud<pcl::PointXYZ>::Ptr cloud(new pcl::PointCloud<pcl::PointXYZ>);
pcl::io::loadPCDFile<pcl::PointXYZ>("a.pcd", *cloud);     // 读取
pcl::io::savePCDFileBinary("b.pcd", *cloud);              // 保存为二进制，体积小、读写快
```

  - ASCII 便于人读和调试，二进制读写更快、文件更小
  - 与 [PLY 格式](https://github.com/junxnone/aiwiki/issues/401) 相比，PCD
    专为点云设计，PLY 还可以描述网格
