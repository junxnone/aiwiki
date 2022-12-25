---
Title | Tools Label LabelImg
-- | --
Created @ | `2018-09-27T07:30:42Z`
Last Modify @| `2022-12-25T04:15:37Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/250)

---
## Reference

- [Label and annotate images](https://youtu.be/p0nR2YsCY_U)
- [LableImg Release](https://tzutalin.github.io/labelImg/) 

## Brief
- [LabelImg is a graphical image annotation tool.](https://github.com/tzutalin/labelImg)
- 保存格式
  - Pascal VOC format 
  - YOLO fomat

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

