---
Title | Datasets Image Classification Cifar
-- | --
Create Date | `2021-09-23T06:05:52Z`
Update Date | `2021-09-23T06:05:52Z`
Edit link | [here](https://github.com/junxnone/aiwiki/issues/32)

---
# Reference
- [CIFAR Dataset](http://www.cs.toronto.edu/~kriz/cifar.html)
  - [cifar10 in github - YoongiKim](https://github.com/YoongiKim/CIFAR-10-images)
- keras classification sample code
  - [cifar10_cnn.py](https://github.com/keras-team/keras/blob/master/examples/cifar10_cnn.py)
  - [cifar10_cnn_tfaugment2d.py](https://github.com/keras-team/keras/blob/master/examples/cifar10_cnn_tfaugment2d.py)
- [pytorch tutorial cifar10 classification](https://pytorch.apachecn.org/docs/1.2/beginner/blitz/cifar10_tutorial.html)
  - [pytorch colab notebook](https://colab.research.google.com/github/pytorch/tutorials/blob/gh-pages/_downloads/cifar10_tutorial.ipynb)

# Brief
- [Cifar10](##Cifar10)
- [Cifar100](##Cifar100)

## Cifar10

- 60000 张 32x32 彩色图片
- 10 个种类，每种 6000 张图片
- 50000 用于 Training，10000 张用于 Test

![image](https://user-images.githubusercontent.com/2216970/71060657-07a61e80-21a1-11ea-993f-994add906177.png)

## Cifar100

- 总体有 20 类，20 类细分为 100 子类
- 100 个子类，每类 600 张图片
- 每类 500 张 Training，100 张 Test
- `fine` 指子类，`coarse` 指父类

Superclass | Classes
-- | --
aquatic mammals | beaver, dolphin, otter, seal, whale
fish | aquarium fish, flatfish, ray, shark, trout
flowers | orchids, poppies, roses, sunflowers, tulips
food containers | bottles, bowls, cans, cups, plates
fruit and vegetables | apples, mushrooms, oranges, pears, sweet peppers
household electrical devices | clock, computer keyboard, lamp, telephone, television
household furniture | bed, chair, couch, table, wardrobe
insects | bee, beetle, butterfly, caterpillar, cockroach
large carnivores | bear, leopard, lion, tiger, wolf
large man-made outdoor things | bridge, castle, house, road, skyscraper
large natural outdoor scenes | cloud, forest, mountain, plain, sea
large omnivores and herbivores | camel, cattle, chimpanzee, elephant, kangaroo
medium-sized mammals | fox, porcupine, possum, raccoon, skunk
non-insect invertebrates | crab, lobster, snail, spider, worm
people | baby, boy, girl, man, woman
reptiles | crocodile, dinosaur, lizard, snake, turtle
small mammals | hamster, mouse, rabbit, shrew, squirrel
trees | maple, oak, palm, pine, willow
vehicles 1 | bicycle, bus, motorcycle, pickup truck, train
vehicles 2 | lawn-mower, rocket, streetcar, tank, tractor

