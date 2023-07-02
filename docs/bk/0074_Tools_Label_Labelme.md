-----

| Title         | Tools Label Labelme                                  |
| ------------- | ---------------------------------------------------- |
| Created @     | `2020-04-15T05:50:14Z`                               |
| Last Modify @ | `2022-12-25T04:16:35Z`                               |
| Labels        | \`\`                                                 |
| Edit @        | [here](https://github.com/junxnone/aiwiki/issues/74) |

-----

## Reference

  - [Github repo](https://github.com/wkentaro/labelme)
  - [pylabelme - mpitid --\>
    labelme\_python](https://github.com/mpitid/pylabelme)

## Brief

  - Label Classification/ObjectDetection/Segmentation/KeyPoint
  - Label Image/Video
  - Label Polygon/Rectange/Circle/Line/Point
  - Export COCO/VOC format

| Label          | Image                                                                                                |
| -------------- | ---------------------------------------------------------------------------------------------------- |
| circle/polygon | ![47922172-57972880-deae-11e8-84f8-e4324a7c856a](media/dfa453dbaca290b0148318727b31244f22ae5a0b.gif) |
| rectangle      | ![47907116-85667800-de82-11e8-83d0-b9f4eb33268f](media/96c0adf0a245880197af7a588bf1559cece747bd.gif) |
| point          | ![47](media/d95f47d77197e85e4dfac5b39765a846332d6fcf.png)                                            |

## Install

  - host - pip/brew
  - docker

## UseCase

### [Calssification](https://github.com/wkentaro/labelme/tree/master/examples/classification)

    labelme data_annotated --flags flags.txt --nodata

![image](media/73d4f5ebf2f5776210adb632140f94351d66f4aa.png)

### Detection BBox

    labelme data_annotated --labels labels.txt --nodata --autosave

![image](media/e78ea69c445deba65ccdcb52aaaf55b5644c67b3.png)

### Segmentation

  - Semantic

<!-- end list -->

    labelme data_annotated --labels labels.txt --nodata --validatelabel exact --config '{shift_auto_shape_color: -2}'

  - Instance

<!-- end list -->

    labelme data_annotated --labels labels.txt --nodata --validatelabel exact --config '{shift_auto_shape_color: -2}'
    labelme data_annotated --labels labels.txt --nodata --labelflags '{.*: [occluded, truncated], person-\d+: [male]}'

![image](media/a70647e353f78c57b34fc1b5c672136e5a138d7a.png)

### [Video](https://github.com/wkentaro/labelme/tree/master/examples/video_annotation)

    labelme data_annotated --labels labels.txt --nodata --keep-prev --config '{shift_auto_shape_color: -2}'

![data\_annotated](media/8cb8558ce750c8e368a9b2e3aefe964dfdb5f7c4.gif)

## Visualization

    labelme_draw_json apc2016_obj3.json

![image](media/e50f06b9271c1b3dfc06d19a1d530b7b328d9e4e.png)

## Convert VOC/COCO

  - Instance Segmentation to VOC

<!-- end list -->

    ./labelme2voc.py data_annotated data_dataset_voc --labels labels.txt

  - Instance Segmentation to COCO

<!-- end list -->

    ./labelme2coco.py data_annotated data_dataset_coco --labels labels.txt
