-----

| Title     | 3D Tools PCL IO PLY                                   |
| --------- | ----------------------------------------------------- |
| Created @ | `2023-03-30T07:48:14Z`                                |
| Updated @ | `2023-03-30T07:49:02Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/401) |

-----

# PLY Format

  - PLY - `Polygon File Format` - 1994
  - Format
      - Header
      - Vertex List
      - Face List
      - ...

## Example

  - `ply` - magic number 固定文件开头
  - **format**： 文件存储格式 (`ascii 1.0` / `binary_little_endian 1.0` /
    `binary_big_endian 1.0`)
  - **comment**：注释
  - **element vertex 24**: 24 个 `vertex` 元素 - 顶点
  - **element face 12**: 12个 `face` 元素

<!-- end list -->

    ply
    format ascii 1.0
    comment VCGLIB generated
    element vertex 24
    property float x
    property float y
    property float z
    element face 12
    property list uchar int vertex_indices
    end_header
    -1 -1 -1  // 第一个 vertex element
    -1 -1 1
    -1 1 1
    -1 1 -1
    -1 1 -1
    -1 1 1
    1 1 1
    1 1 -1
    1 1 -1
    1 1 1
    1 -1 1
    1 -1 -1
    -1 -1 1
    -1 -1 -1
    1 -1 -1
    1 -1 1
    1 -1 -1
    -1 -1 -1
    -1 1 -1
    1 1 -1
    1 1 1
    -1 1 1
    -1 -1 1
    1 -1 1  // 第 24 个 vertex element
    3 0 1 2  // 第一个 face element
    3 0 2 3
    3 4 5 6
    3 4 6 7
    3 8 9 10
    3 8 10 11
    3 12 13 14
    3 12 14 15
    3 16 17 18
    3 16 18 19
    3 20 21 22
    3 20 22 23   // 第 12 个 face element

## Reference

  - [The PLY Polygon File
    Format](http://gamma.cs.unc.edu/POWERPLANT/papers/ply.pdf)
  - [ply - wikipedia](https://en.wikipedia.org/wiki/PLY_\(file_format\))
