-----

| Title     | 3D Tools PCL IO PLY                                   |
| --------- | ----------------------------------------------------- |
| Created @ | `2023-03-30T07:48:14Z`                                |
| Updated @ | `2026-11-26T09:16:34Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/401) |

-----

# PLY Format

  - PLY - `Polygon File Format` - 1994
  - 由斯坦福大学提出，既可以存点云，也可以存带面片的三角网格
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

> 示例中的 `//` 注释仅用于说明，实际 PLY 文件不允许这样的行内注释。

这个例子是一个立方体：6 个正方形面，每个面各有 4 个独立顶点，共 $6\\times4=24$ 个顶点；每个面拆成 2 个三角形，共
$6\\times2=12$ 个面片，每个面片用 3 个顶点索引表示。

## 头部说明

| 关键字                               | 含义                           |
| --------------------------------- | ---------------------------- |
| `element <名称> <数量>`               | 声明一类元素及其个数，如 `vertex`、`face` |
| `property <类型> <名称>`              | 声明该元素的一个属性，如 `float x`       |
| `property list <计数类型> <值类型> <名称>` | 声明可变长度的列表属性                  |
| `end_header`                      | 头部结束，之后是数据                   |

表中：

  - 属性类型有 `char`、`uchar`、`short`、`ushort`、`int`、`uint`、`float`、`double`
  - 面片行 `3 0 1 2` 中，第一个数 `3` 是**计数**（顶点个数，由 `uchar` 存储），后面 `0 1 2`
    是顶点索引（`int`，指向上面 vertex 列表的下标）
  - 对比结论：通过「元素 + 属性」的机制，PLY 可以扩展任意属性，如颜色 `red green blue`、法向量 `nx ny nz`

## 与 PCD 对比

| 对比项  | PLY          | PCD              |
| ---- | ------------ | ---------------- |
| 来源   | 斯坦福，通用 3D 格式 | PCL 的点云格式        |
| 内容   | 点云或网格（有面片）   | 主要是点云            |
| 扩展性  | 可自定义元素和属性    | 通过 FIELDS 自定义字段  |
| 有序点云 | 不直接支持        | 支持（WIDTH×HEIGHT） |

表中：对比结论：需要保存网格或交换给通用 3D 软件用 PLY；在 PCL 内部处理点云用
[PCD](https://github.com/junxnone/aiwiki/issues/400)。

## Reference

  - [The PLY Polygon File
    Format](http://gamma.cs.unc.edu/POWERPLANT/papers/ply.pdf)
  - [ply - wikipedia](https://en.wikipedia.org/wiki/PLY_\(file_format\))
