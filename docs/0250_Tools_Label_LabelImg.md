---
Title | Tools Label LabelImg
-- | --
Created @ | `2018-09-27T07:30:42Z`
Updated @| `2026-11-26T10:09:36Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/250)

---
# LabelImg

- [LabelImg is a graphical image annotation tool.](https://github.com/tzutalin/labelImg)
- 用矩形框标注目标检测数据的桌面工具，Python + Qt 编写
- 保存格式
  - Pascal VOC format 
  - YOLO fomat

## 两种格式

- Pascal VOC：每张图一个 XML，框用像素坐标 $(x_{min},y_{min},x_{max},y_{max})$，见下面的示例
- YOLO：每张图一个 txt，每行一个目标：`class x_center y_center width height`，坐标相对图像宽高归一化

VOC 转 YOLO 的换算：

$$
x_c=\frac{x_{min}+x_{max}}{2W},\quad y_c=\frac{y_{min}+y_{max}}{2H},\quad w=\frac{x_{max}-x_{min}}{W},\quad h=\frac{y_{max}-y_{min}}{H}
$$

其中：

- $W,H$：图像的宽、高（像素）；$x_{min},y_{min},x_{max},y_{max}$：VOC 框的左上、右下角
- $x_c,y_c$：框中心的归一化坐标；$w,h$：框的归一化宽高，所有值都在 $[0,1]$
- 例：下面示例的图像 $576\times324$，框 $(136,102,292,259)$，则 $x_c=\tfrac{136+292}{2\times576}\approx0.372$，$y_c=\tfrac{102+259}{2\times324}\approx0.557$，$w=\tfrac{156}{576}\approx0.271$，$h=\tfrac{157}{324}\approx0.485$

## Run on Ubuntu 16.04

```
git clone https://github.com/tzutalin/labelImg.git
cd labelimg
sudo apt-get install pyqt4-dev-tools
sudo pip install lxml
make qt4py2
python labelImg.py
python labelImg.py [IMAGE_PATH] [PRE-DEFINED CLASS FILE]
```

## Saved xml file

```
<annotation>
	<folder>demo</folder>
	<filename>demo.jpg</filename>
	<path>/home/xxx/labelImg/demo/demo.jpg</path>
	<source>
		<database>Unknown</database>
	</source>
	<size>
		<width>576</width>
		<height>324</height>
		<depth>3</depth>
	</size>
	<segmented>0</segmented>
	<object>
		<name>flowers</name>
		<pose>Unspecified</pose>
		<truncated>0</truncated>
		<difficult>0</difficult>
		<bndbox>
			<xmin>136</xmin>
			<ymin>102</ymin>
			<xmax>292</xmax>
			<ymax>259</ymax>
		</bndbox>
	</object>
</annotation>

```

## Tips
### errors ` no module named libs.resources`

```
Pyrcc5 -o resources.py resources.qrc
cp resources.py libs/
```


## 标注流程

| 步骤 | 操作 |
| --- | --- |
| 1 | 打开图片目录（Open Dir）并设置保存目录 |
| 2 | 选择保存格式（VOC / YOLO） |
| 3 | 创建矩形框（Create RectBox），输入类别名 |
| 4 | 保存并切换到下一张 |

表中：预定义类别文件（命令行的 `[PRE-DEFINED CLASS FILE]` 参数）可以让类别名下拉选择，保证名称一致。

## Reference

- [Label and annotate images](https://youtu.be/p0nR2YsCY_U)
- [LableImg Release](https://tzutalin.github.io/labelImg/) 

