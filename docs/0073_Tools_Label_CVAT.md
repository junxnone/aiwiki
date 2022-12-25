---
Title | Tools Label CVAT
-- | --
Created @ | `2018-12-13T13:39:06Z`
Last Modify @| `2022-12-25T04:17:33Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/73)

---
## Reference

- [Github repo](https://github.com/opencv/cvat)
- [User's guide](https://github.com/opencv/cvat/blob/develop/cvat/apps/documentation/user_guide.md)

# Brief

- CVAT - Computer Vision Annotation Tool
  - `CVAT is completely re-designed and re-implemented version of Video Annotation Tool`
- **标注模式**
  - 标注图片
  - 标注视频中的物体轨迹
  - 标注物体属性
  - 标注分界
- **Types of Shapes**
  - box
  - polygon
  - polyline
  - points


## Build

```
git clone https://github.com/opencv/cvat.git
cd cvat
docker-compose build
docker-compose up -d
```
http://localhost:8080

### 如果想从其他机器访问,并共享目录：

```
touch docker-compose.override.yml
vi docker-compose.override.yml
```
添加如下内容后，重启compose
```
version: "2.3"

services:
 cvat:
  environment:
   ALLOWED_HOSTS: '*'
   CVAT_SHARE_URL: "Mounted from ~/works/cvat_task_file host directory"
  ports:
   - "80:8080"
  volumes:
          - /home/serverx/works/cvat_task_file/:/home/django/share/:ro
```
```
docker-compose -f docker-compose.yml -f docker-compose.override.yml build
```

### 创建管理员用户

```
docker exec -it cvat bash -ic '/usr/bin/python3 ~/manage.py createsuperuser'
```
```
docker exec -it cvat bash -ic '/usr/bin/python3 ~/manage.py changepassword xxx'
```

## [Components](https://github.com/opencv/cvat#additional-optional-components)

- [OpenVINO](https://github.com/opencv/cvat/tree/develop/components/openvino#intel-openvino-toolkit)
- Tensorflow
- CUDA
- Analytics

### Build all components

```
docker-compose -f docker-compose.yml \
  -f components/tf_annotation/docker-compose.tf_annotation.yml \
  -f components/analytics/docker-compose.analytics.yml \
  -f components/cuda/docker-compose.cuda.yml \
  -f components/openvino/docker-compose.openvino.yml  \
  -f docker-compose.override.yml build
```

### Run the docker container

```
docker-compose -f docker-compose.yml \
  -f components/tf_annotation/docker-compose.tf_annotation.yml \
  -f components/analytics/docker-compose.analytics.yml \
  -f components/cuda/docker-compose.cuda.yml \
  -f components/openvino/docker-compose.openvino.yml \
  -f docker-compose.override.yml  up -d
```

## [Auto annotation](https://github.com/opencv/cvat/blob/a967fe1eaba9ef4b6d3cc626c0bda1afa48038cd/cvat/apps/auto_annotation/README.md)

- [Person-vehicle-bike-detection](https://github.com/opencv/cvat/blob/a967fe1eaba9ef4b6d3cc626c0bda1afa48038cd/cvat/apps/auto_annotation/README.md#person-vehicle-bike-detection-crossroad-0078-openvino-toolkit)
- [Landmarks-regression](https://github.com/opencv/cvat/blob/a967fe1eaba9ef4b6d3cc626c0bda1afa48038cd/cvat/apps/auto_annotation/README.md#landmarks-regression-retail-0009-openvino-toolkit)
- human-pose
  - [model description](https://github.com/opencv/open_model_zoo/blob/2018/intel_models/human-pose-estimation-0001/description/human-pose-estimation-0001.md)
  - [bin](https://download.01.org/openvinotoolkit/2018_R5/open_model_zoo/human-pose-estimation-0001/FP32/human-pose-estimation-0001.bin)
  - [xml](https://download.01.org/openvinotoolkit/2018_R5/open_model_zoo/human-pose-estimation-0001/FP32/human-pose-estimation-0001.xml)

![image](https://user-images.githubusercontent.com/2216970/51457981-719a2600-1d8e-11e9-80de-a6241704c28c.png)

![image](https://user-images.githubusercontent.com/2216970/51508027-8d550900-1e2e-11e9-9b6b-bdd461f8788e.png)


## Tips
### 1 CVAT 创建任务时可选 Image quality
- 默认 quality 50 ，最大值 95
- 最大值95 是由 `pillow` [决定的](https://pillow.readthedocs.io/en/5.1.x/handbook/image-file-formats.html#jpeg), pillow open jpeg 时只能设置 `1 - 95` 的quality, 默认是75

![image](https://user-images.githubusercontent.com/2216970/71862800-f6b05380-3135-11ea-94b7-572ad635dc19.png)

