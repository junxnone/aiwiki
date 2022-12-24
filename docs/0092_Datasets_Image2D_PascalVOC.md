---
Title | Datasets Image2D PascalVOC
-- | --
Created @ | `2018-12-03T15:42:02Z`
Last Modify @| `2022-12-24T16:07:08Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/92)

---
# Reference

- [Pascal VOC Homepage](http://host.robots.ox.ac.uk/pascal/VOC/) 
- [Pascal VOC Dataset - 2012](http://host.robots.ox.ac.uk/pascal/VOC/index.html)
- [Pascal VOC Development Kit - 2012](http://host.robots.ox.ac.uk/pascal/VOC/voc2012/htmldoc/devkit_doc.html)
- [Pascal VOC Dataset Mirror - pjreddie.com](https://pjreddie.com/projects/pascal-voc-dataset-mirror/)
- [PascalVOC 数据集 介绍](https://blog.csdn.net/weixin_39679367/article/details/80932532)
- [paper - 2014 - The PASCAL Visual Object Classes Challenge: A Retrospective](http://host.robots.ox.ac.uk/pascal/VOC/pubs/everingham15.pdf)
- [Leadereboards](http://host.robots.ox.ac.uk:8080/leaderboard/main_bootstrap.php)
- [Distribution - Statistics](http://host.robots.ox.ac.uk/pascal/VOC/voc2012/dbstats.html)
- [Pascal SBD - Semantic Boundaries Dataset and Benchmark](http://home.bharathh.info/pubs/codes/SBD/download.html)  -  [\<Google Drive\>](https://drive.google.com/file/d/1EQSKo5n2obj7tW8RytYTJ-eEYbXqtUXE/view) [\<BaiduPan jgx7\>](https://pan.baidu.com/s/1-kYEZtOo99VJGHrKlOK5dQ)
- [SBD数据集 简介](https://blog.csdn.net/zz2230633069/article/details/89335205)

# Brief
- 2005 - 2012 Challenges - `Detection/Segmentation`
- VOC 2012
  - Train/Validation Data (1.9 GB)
  - Test Data (1.8 GB)
  - 20 classes
- VOC 2007
  - Train/Validation Data (439 MB)
  - Test Data With Annotations (431 MB)
  - 20 classes
- Pascal SBD


## Tasks
- Classification
- Detection
  - Person Layout
- Segmentation
- Action Classification
  - Boxless Action Classification
- Large Scale Recognition

# Datasets Downloads

```
wget http://host.robots.ox.ac.uk/pascal/VOC/voc2012/VOCtrainval_11-May-2012.tar
tar -xvf VOCtrainval_11-May-2012.tar
```

# Details

![image](https://user-images.githubusercontent.com/2216970/134837794-153db45d-de53-4fdc-8c03-ba68c4cf4d11.png)


Year | Statistics | New developments | Notes
-- | -- | -- | --
2005 | Only 4 classes: bicycles, cars, motorbikes, people. Train/validation/test: 1578 images containing 2209 annotated objects. | Two competitions: classification and detection | Images were largely taken from exising public datasets, and were not as challenging as the flickr images subsequently used. This dataset is obsolete.
2006 | 10 classes: bicycle, bus, car, cat, cow, dog, horse, motorbike, person, sheep. Train/validation/test: 2618 images containing 4754 annotated objects. | Images from flickr and from Microsoft Research Cambridge (MSRC) dataset | The MSRC images were easier than flickr as the photos often concentrated on the object of interest. This dataset is obsolete.
2007 | 20 classes:Person: personAnimal: bird, cat, cow, dog, horse, sheepVehicle: aeroplane, bicycle, boat, bus, car, motorbike, trainIndoor: bottle, chair, dining table, potted plant, sofa, tv/monitorTrain/validation/test: 9,963 images containing 24,640 annotated objects. | Number of classes increased from 10 to 20Segmentation taster introducedPerson layout taster introducedTruncation flag added to annotationsEvaluation measure for the classification challenge changed to Average Precision. Previously it had been ROC-AUC. | This year established the 20 classes, and these have been fixed since then. This was the final year that annotation was released for the testing data.
2008 | 20 classes. The data is split (as usual) around 50% train/val and 50% test. The train/val data has 4,340 images containing 10,363 annotated objects. | Occlusion flag added to annotationsTest data annotation no longer made public.The segmentation and person layout data sets include images from the corresponding VOC2007 sets. |  
2009 | 20 classes. The train/val data has 7,054 images containing 17,218 ROI annotated objects and 3,211 segmentations. | From now on the data for all tasks consists of the previous years' images augmented with new images. In earlier years an entirely new data set was released each year for the classification/detection tasks.Augmenting allows the number of images to grow each year, and means that test results can be compared on the previous years' images.Segmentation becomes a standard challenge (promoted from a taster) | No difficult flags were provided for the additional images (an omission).Test data annotation not made public.
2010 | 20 classes. The train/val data has 10,103 images containing 23,374 ROI annotated objects and 4,203 segmentations. | Action Classification taster introduced.Associated challenge on large scale classification introduced based on ImageNet.Amazon Mechanical Turk used for early stages of the annotation. | Method of computing AP changed. Now uses all data points rather than TREC style sampling.Test data annotation not made public.
2011 | 20 classes. The train/val data has 11,530 images containing 27,450 ROI annotated objects and 5,034 segmentations. | Action Classification taster extended to 10 classes + "other". | Layout annotation is now not "complete": only people are annotated and some people may be unannotated.
2012 | 20 classes. The train/val data has 11,530 images containing 27,450 ROI annotated objects and 6,929 segmentations. | Size of segmentation dataset substantially increased.People in action classification dataset are additionally annotated with a reference point on the body. | Datasets for classification, detection and person layout are the same as VOC2011.

