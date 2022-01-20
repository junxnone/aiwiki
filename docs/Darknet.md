---
Title | Darknet
-- | --
Create Date | `2018-09-06T07:36:20Z`
Update Date | `2022-01-20T08:16:07Z`
Edit link | [here](https://github.com/junxnone/aiwiki/issues/260)

---
## Reference

- [官网](https://pjreddie.com/darknet/)
- [Github repo](https://github.com/pjreddie/darknet)
- [ for object detection training repo](https://github.com/AlexeyAB/darknet)

## Brief
- [Darknet AlexeyAB](/Darknet_AlexeyAB)
- [Darknet config files](/Darknet_cfg_files)

## Build

### Build with CPU only
```
git clone https://github.com/pjreddie/darknet
cd darknet
make
```

### Build with OpenCV

- Change the Makefile

```
vi Makefile
```
```
OPENCV=1
```
```
make
```

- Test

```
./darknet imtest data/eagle.jpg
```

## Run

```
wget https://pjreddie.com/media/files/yolov3.weights
./darknet detect cfg/yolov3.cfg yolov3.weights data/dog.jpg

wget https://pjreddie.com/media/files/yolov3-tiny.weights
./darknet detect cfg/yolov3-tiny.cfg yolov3-tiny.weights data/dog.jpg
```
