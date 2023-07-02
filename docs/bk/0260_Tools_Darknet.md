-----

| Title         | Tools Darknet                                         |
| ------------- | ----------------------------------------------------- |
| Created @     | `2018-09-06T07:36:20Z`                                |
| Last Modify @ | `2022-12-25T04:04:08Z`                                |
| Labels        | \`\`                                                  |
| Edit @        | [here](https://github.com/junxnone/aiwiki/issues/260) |

-----

## Reference

  - [官网](https://pjreddie.com/darknet/)
  - [Github repo](https://github.com/pjreddie/darknet)
  - [ for object detection training
    repo](https://github.com/AlexeyAB/darknet)

## Brief

  - [Darknet AlexeyAB](/Darknet_AlexeyAB)
  - [Darknet config files](/Darknet_cfg_files)

## Build

### Build with CPU only

    git clone https://github.com/pjreddie/darknet
    cd darknet
    make

### Build with OpenCV

  - Change the Makefile

<!-- end list -->

    vi Makefile

    OPENCV=1

    make

  - Test

<!-- end list -->

    ./darknet imtest data/eagle.jpg

## Run

    wget https://pjreddie.com/media/files/yolov3.weights
    ./darknet detect cfg/yolov3.cfg yolov3.weights data/dog.jpg
    
    wget https://pjreddie.com/media/files/yolov3-tiny.weights
    ./darknet detect cfg/yolov3-tiny.cfg yolov3-tiny.weights data/dog.jpg
