---
Title | Tools Label Labelme
-- | --
Created @ | `2020-04-15T05:50:14Z`
Last Modify @| `2022-12-25T04:15:56Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/74)

---
# Reference

- [Github repo](https://github.com/wkentaro/labelme)
- [pylabelme - mpitid --> labelme_python](https://github.com/mpitid/pylabelme)

# Brief
- Label Classification/ObjectDetection/Segmentation/KeyPoint
- Label Image/Video
- Label Polygon/Rectange/Circle/Line/Point
- Export COCO/VOC format

Label | Image
-- | -- 
circle/polygon | ![47922172-57972880-deae-11e8-84f8-e4324a7c856a](https://user-images.githubusercontent.com/2216970/79302827-005d0a80-7f20-11ea-8e41-f02df997ea9f.gif)
rectangle  | ![47907116-85667800-de82-11e8-83d0-b9f4eb33268f](https://user-images.githubusercontent.com/2216970/79302980-503bd180-7f20-11ea-988b-5ef841cf26fe.gif)
point | ![47](https://user-images.githubusercontent.com/2216970/79302982-52059500-7f20-11ea-8dd7-3812ca706d07.png)


## Install
- host - pip/brew
- docker

# UseCase
## [Calssification](https://github.com/wkentaro/labelme/tree/master/examples/classification)
```
labelme data_annotated --flags flags.txt --nodata
```
![image](https://user-images.githubusercontent.com/2216970/79305440-fd651880-7f25-11ea-8712-9795699a0f16.png)

## Detection BBox
```
labelme data_annotated --labels labels.txt --nodata --autosave
```
![image](https://user-images.githubusercontent.com/2216970/79305526-24234f00-7f26-11ea-8700-87e9fee07d9a.png)

## Segmentation
- Semantic
```
labelme data_annotated --labels labels.txt --nodata --validatelabel exact --config '{shift_auto_shape_color: -2}'
```
- Instance
```
labelme data_annotated --labels labels.txt --nodata --validatelabel exact --config '{shift_auto_shape_color: -2}'
labelme data_annotated --labels labels.txt --nodata --labelflags '{.*: [occluded, truncated], person-\d+: [male]}'
```
![image](https://user-images.githubusercontent.com/2216970/79305790-9f850080-7f26-11ea-9cc9-39d57c8a0f35.png)

## [Video](https://github.com/wkentaro/labelme/tree/master/examples/video_annotation)
```
labelme data_annotated --labels labels.txt --nodata --keep-prev --config '{shift_auto_shape_color: -2}'
```
![data_annotated](https://user-images.githubusercontent.com/2216970/79305735-81b79b80-7f26-11ea-95a6-1eb5970ab840.gif)

# Visualization
```
labelme_draw_json apc2016_obj3.json
```
![image](https://user-images.githubusercontent.com/2216970/79305881-c3e0dd00-7f26-11ea-913a-e737306e6844.png)

# Convert VOC/COCO
- Instance Segmentation to VOC
```
./labelme2voc.py data_annotated data_dataset_voc --labels labels.txt
```

- Instance Segmentation to COCO
```
./labelme2coco.py data_annotated data_dataset_coco --labels labels.txt
```
