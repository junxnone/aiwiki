---
Title | Tools Darknet AlexeyAB
-- | --
Created @ | `2019-03-05T12:38:57Z`
Last Modify @| `2022-12-25T04:04:32Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/261)

---
## Reference

- [Github repo](https://github.com/AlexeyAB/darknet)
- [How to train (to detect your custom objects)](https://github.com/AlexeyAB/darknet#how-to-train-to-detect-your-custom-objects)
- [Datasets2Darknet](https://github.com/angeligareta/Datasets2Darknet#detection-task)
- [paper - CutMix: Regularization Strategy to Train Strong Classifiers with Localizable Features](https://arxiv.org/abs/1905.04899v2)
- [paper - mixup - Bag of Freebies for Training Object Detection Neural Networks](https://arxiv.org/abs/1902.04103)
- [cfg files parameters](https://github.com/AlexeyAB/darknet/wiki/CFG-Parameters-in-the-%5Bnet%5D-section)
- [Converting Yolo v3 models to TensorFlow and OpenVINO(IR) models](https://github.com/AlexeyAB/darknet/wiki/Converting-Yolo-v3-models-to-TensorFlow-and-OpenVINO(IR)-models)

## Brief

```
git clone https://github.com/AlexeyAB/darknet
cd darknet
make
```

**Test**

```
wget https://pjreddie.com/media/files/yolov3.weights
./darknet detector test ./cfg/coco.data ./cfg/yolov3.cfg ./yolov3.weights
```
```
Total BFLOPS 65.864
Loading weights from ./yolov3.weights...
 seen 64
Done!
Enter Image Path: data/horses.jpg
data/horses.jpg: Predicted in 12600.076000 milli-seconds.
horse: 88%
horse: 99%
horse: 96%
horse: 99%
Not compiled with OpenCV, saving to predictions.png instead
```

prediction | ![image](https://user-images.githubusercontent.com/2216970/53807145-c9c96800-3f89-11e9-8bf7-831119a05c80.png)
-- | --

## Build Config
可以编译 darknet 前通过修改 Makefile 添加如下支持
- NVIDIA
  - CUDA
  - CUDNN
- OPENCV
- OPENMP

```
-GPU=0
-CUDNN=0
+GPU=1
+CUDNN=1
-OPENMP=0
+OPENMP=1
```


## Train with Pascal VOC 

### Prepare Config
- voc/train.txt - training images list
- voc/test.txt - test images list

```
wget http://pjreddie.com/media/files/darknet53.conv.74 
cd build/darknet/x64/data/voc/
wget http://pjreddie.com/media/files/VOCtrainval_11-May-2012.tar
wget http://pjreddie.com/media/files/VOCtrainval_06-Nov-2007.tar
wget http://pjreddie.com/media/files/VOCtest_06-Nov-2007.tar
tar vxf VOCtrainval_11-May-2012.tar
tar vxf VOCtrainval_06-Nov-2007.tar
tar vxf VOCtest_06-Nov-2007.tar
python3 voc_label.py
cat 2007_train.txt 2007_val.txt 2012_*.txt>train.txt
```

- cfg/yolov3-voc.cfg - YOLO Network arch and Training config

```
- batch=1
- subdivisions=1
+ batch=64
+ subdivisions=64
```
> 1 for Testing, 64 for Training

```
mixup=1
cutmix=1
mosaic=1
blur=1
```

- cfg/voc.data - your train/test images/labels and weight saved path
- cfg/voc.names -  your classes

```
-train  = /home/pjreddie/data/voc/train.txt
-valid  = /home/pjreddie/data/voc/2007_test.txt
+train  = ./build/darknet/x64/data/voc/train.txt
+valid  = ./build/darknet/x64/data/voc/2007_test.txt
 names = data/voc.names
-backup = /home/pjreddie/backup/
+backup = ./backup/
```

- anchor cluster

```
darknet detector calc_anchors data/your.data -num_of_clusters 9 -width 416 -height 416
```

## Training cmd
- Start Train  `./darknet detector train cfg/voc.data cfg/yolov3-voc.cfg darknet53.conv.74`
- Train with multi-GPU  `-gpus 0,1,2,3`
- with map `-map`
- with  Loss-chart `-dont_show -mjpeg_port 8090`
> loss-chart 需要编译 `Makefile` 中的 `OPENCV` 选项

```
./darknet detector train cfg/voc.data cfg/yolov3-voc.cfg darknet53.conv.74 -gpus 0,1,2,3 -map \
-dont_show -mjpeg_port 8090 
```
![image](https://user-images.githubusercontent.com/2216970/72407674-51cbf100-379b-11ea-8853-b631d9c5022f.png)


## Stop and restart the train with saved weights
```
./darknet detector train cfg/voc.data cfg/yolov3-voc.cfg  \
backup/yolov3-voc_1008.weights \
-gpus 0,1,2,3 -map \
-dont_show -mjpeg_port 8090 
```
![image](https://user-images.githubusercontent.com/2216970/54177538-88771200-44cd-11e9-995d-36d761b35133.png) |
-- |
YOLOv3 mAP@0.5IOU@416 |

## Test
- Test image
```
./darknet detector test ./data/your.data  ./your.cfg ./your.weights ./your_image
```
- Test with confidence threshold `-thresh <val>`

- Calculation mAP
```
./darknet detector map ./data/your.data  ./your.cfg ./your.weights 
```
- Calculation mAP with IoU threshold `-iou_thresh  <val>` - `[0.75 , 0.5 , 0.1]`

##  OpenVINO
- https://github.com/mystic123/tensorflow-yolo-v3.git
- `--tiny` 指定转换 `yolov3-tiny model`
- 
```
python3 convert_weights_pb.py --class_names ../data/kaiquan.names \
  --data_format NHWC \
  --weights_file ../mixup_weights/yolov3-kaiquan_best.weights \
python3 /opt/intel/openvino/deployment_tools/model_optimizer/mo_tf.py -b 1 \
    --input_model ./frozen_darknet_yolov3_model.pb \
    --tensorflow_use_custom_operations_config ./yolo_v3.json \
    --data_type FP32\
    --output_dir ./FP32
python3 /opt/intel/openvino/deployment_tools/model_optimizer/mo_tf.py -b 1 \
    --input_model ./frozen_darknet_yolov3_model.pb \
    --tensorflow_use_custom_operations_config ./yolo_v3.json \
    --data_type FP16\
    --output_dir ./FP16
```

- benchmark
```
source /opt/intel/openvino/bin/setupvars.sh
python3 /opt/intel/openvino/deployment_tools/tools/benchmark_tool/benchmark_app.py \
     -i ../your_data/\
    -m FP16/frozen_darknet_yolov3_model.xml \
    -d MULTI:CPU,GPU,HDDL\
    -l /opt/intel/openvino/inference_engine/lib/intel64/libcpu_extension_avx2.so

```

# Tips
- YOLOv3 和 YOLOv3-SPP 都是用一样的 [pre-trained weights - darknet53.conv.74](https://pjreddie.com/media/files/darknet53.conv.74)
- YOLO labels format `class x y width height` - 相对于 `width/height` 的值 (0.0, 1.0]
  - 转换方法 - [voc_label.py](https://github.com/AlexeyAB/darknet/blob/master/scripts/voc_label.py#L12)
