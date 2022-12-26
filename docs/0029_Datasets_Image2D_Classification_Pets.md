---
Title | Datasets Image2D Classification Pets
-- | --
Created @ | `2019-01-24T20:39:23Z`
Last Modify @| `2022-12-26T14:54:56Z`
Labels | `index`
Edit @| [here](https://github.com/junxnone/aiwiki/issues/29)

---
# Oxford-IIIT Pets
## Reference
- [dataset](http://www.robots.ox.ac.uk/~vgg/data/pets/)
- [convert to tfrecord python script](https://github.com/tensorflow/models/blob/master/research/object_detection/dataset_tools/create_pet_tf_record.py)

## Brief

- Oxford-IIIT Pet Dataset 包含37种宠物分类，每种分类大概200张图片 

![image](https://user-images.githubusercontent.com/2216970/51708550-21a5b280-205f-11e9-8ed9-53a57697c308.png)


## Downloads

```
wget http://www.robots.ox.ac.uk/~vgg/data/pets/data/images.tar.gz
wget http://www.robots.ox.ac.uk/~vgg/data/pets/data/annotations.tar.gz
```

## Annotations

```
trimaps/ 	Trimap annotations for every image in the dataset
		Pixel Annotations: 1: Foreground 2:Background 3: Not classified
xmls/		Head bounding box annotations in PASCAL VOC Format

list.txt	Combined list of all images in the dataset
		Each entry in the file is of following nature:
		Image CLASS-ID SPECIES BREED ID
		ID: 1:37 Class ids
		SPECIES: 1:Cat 2:Dog
		BREED ID: 1-25:Cat 1:12:Dog
		All images with 1st letter as captial are cat images while
		images with small first letter are dog images.
trainval.txt	Files describing splits used in the paper.However,
test.txt	you are encouraged to try random splits.
```

![image](https://user-images.githubusercontent.com/2216970/51707690-cb377480-205c-11e9-9aa5-1e31d576a358.png)

```
             (a)                          (b)                        (c)
```

- (a) species and breed name; 
- (b) a tight bounding box (ROI) around the head of the animal; 
- (c) a pixel level foreground-background segmentation (Trimap).

## list.txt

```
german_shorthaired_9 15 2 9
 |                    | | |— BREED ID
 |                    | |— SPECIES: 1:Cat 2:Dog
 |                    |— Class ids
 |— SPECIES
```
> 德国短毛犬( German Shorthaired)
