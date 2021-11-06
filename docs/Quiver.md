---
Title | Quiver
-- | --
Create Date | `2018-12-12T08:00:41Z`
Update Date | `2021-11-06T02:14:57Z`
Edit link | [here](https://github.com/junxnone/aiwiki/issues/136)

---
## Reference

- [Docs](https://keplr-io.github.io/quiver/) 
- [Github repo](https://github.com/keplr-io/quiver)
- [使用quiver进行网络可视化时的排雷过程](https://blog.csdn.net/macwinwin/article/details/78680287)
- [可视化探索卷积神经网络提取特征](https://blog.csdn.net/wangyangzhizhou/article/details/84846267)

## Brief

- 卷积可视化工具  Interactive convnet features visualization for Keras

![gzqll3](https://cloud.githubusercontent.com/assets/5866348/20253975/f3d56f14-a9e4-11e6-9693-9873a18df5d3.gif)

## Install 

```
pip install quiver_engine
```
If you want the latest version from the repo
```
pip install git+git://github.com/keplr-io/quiver.git
```

## Usecase

1. Build your model in keras
```
model = Model(...)
```
2. Launch the visualization dashboard with 1 line of code
```
quiver_engine.server.launch(model, classes=['cat','dog'], input_folder='./imgs')
```
3. Explore layer activations on all the different images in your input folder.

## Example

- keras_mobilenet_quiver.py

```
import keras.applications as apps
from quiver_engine.server import launch

#model = apps.vgg16.VGG16()
model = apps.mobilenet.MobileNet()
launch(model, input_folder="./data")
```
```
mkdir -p data
mkdir -p tmp
```
copy your image to the data folder
```
python keras_mobilenet_quiver.py
```
in your brower: 
`localhost:5000`
or
`your_ip:5000`

images | 
-- | 
![image](https://user-images.githubusercontent.com/2216970/63324585-f10aca80-c35a-11e9-9ec2-3efc2e86789e.png) | 
![image](https://user-images.githubusercontent.com/2216970/63324638-0b44a880-c35b-11e9-8b01-13f39862ff9b.png) | 
![image](https://user-images.githubusercontent.com/2216970/63324752-43e48200-c35b-11e9-8d0a-33aef9474f3a.png) |

----

> N.B.  quiver_engine.server 中有个 `gevent.wsgi` 需要替换为 `gevent.pywsgi`
