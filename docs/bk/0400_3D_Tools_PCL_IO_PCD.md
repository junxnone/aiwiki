-----

| Title     | 3D Tools PCL IO PCD                                   |
| --------- | ----------------------------------------------------- |
| Created @ | `2023-03-30T07:15:33Z`                                |
| Updated @ | `2023-03-30T07:22:29Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/400) |

-----

# PCD Format

  - PCD - `Point Cloud Data`

## Example

  - **VERSION** : PCD spec 0.7
  - **FIELDS**: 数据维度名字
  - **SIZE**: 每个维度占用的字节大小
  - **TYPE**: 数据类型 (`F`: 浮点数，`I`: int，`U`: uint)
  - **COUNT**: 每个维度的元素个数
  - **WIDTH**: 点云数据及宽度
  - **HEIGHT**: 点云数据集高度
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
