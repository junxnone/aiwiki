---
Title | ML Tasks Image Detection YOLO tiny
-- | --
Created @ | `2020-02-20T06:02:54Z`
Updated @| `2023-01-31T06:36:29Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/52)

---
# YOLO tiny

## Reference

- [tiny darknet](https://pjreddie.com/darknet/tiny-darknet/)
- [YOLOv3-tiny cfg](https://github.com/AlexeyAB/darknet/blob/master/cfg/yolov3-tiny.cfg)

## Model

```
   layer   filters  size/strd(dil)      input                output
   0 conv     16       3 x 3/ 1    608 x 608 x   3 ->  608 x 608 x  16 0.319 BF
   1 max                2x 2/ 2    608 x 608 x  16 ->  304 x 304 x  16 0.006 BF
   2 conv     32       3 x 3/ 1    304 x 304 x  16 ->  304 x 304 x  32 0.852 BF
   3 max                2x 2/ 2    304 x 304 x  32 ->  152 x 152 x  32 0.003 BF
   4 conv     64       3 x 3/ 1    152 x 152 x  32 ->  152 x 152 x  64 0.852 BF
   5 max                2x 2/ 2    152 x 152 x  64 ->   76 x  76 x  64 0.001 BF
   6 conv    128       3 x 3/ 1     76 x  76 x  64 ->   76 x  76 x 128 0.852 BF
   7 max                2x 2/ 2     76 x  76 x 128 ->   38 x  38 x 128 0.001 BF
   8 conv    256       3 x 3/ 1     38 x  38 x 128 ->   38 x  38 x 256 0.852 BF
   9 max                2x 2/ 2     38 x  38 x 256 ->   19 x  19 x 256 0.000 BF
  10 conv    512       3 x 3/ 1     19 x  19 x 256 ->   19 x  19 x 512 0.852 BF
  11 max                2x 2/ 1     19 x  19 x 512 ->   19 x  19 x 512 0.001 BF
  12 conv   1024       3 x 3/ 1     19 x  19 x 512 ->   19 x  19 x1024 3.407 BF
  13 conv    256       1 x 1/ 1     19 x  19 x1024 ->   19 x  19 x 256 0.189 BF
  14 conv    512       3 x 3/ 1     19 x  19 x 256 ->   19 x  19 x 512 0.852 BF
  15 conv     39       1 x 1/ 1     19 x  19 x 512 ->   19 x  19 x  39 0.014 BF
  16 yolo
[yolo] params: iou loss: mse (2), iou_norm: 0.75, cls_norm: 1.00, scale_x_y: 1.00
  17 route  13                                     ->   19 x  19 x 256
  18 conv    128       1 x 1/ 1     19 x  19 x 256 ->   19 x  19 x 128 0.024 BF
  19 upsample                 2x    19 x  19 x 128 ->   38 x  38 x 128
  20 route  19 8                                   ->   38 x  38 x 384
  21 conv    256       3 x 3/ 1     38 x  38 x 384 ->   38 x  38 x 256 2.555 BF
  22 conv     39       1 x 1/ 1     38 x  38 x 256 ->   38 x  38 x  39 0.029 BF
  23 yolo
```
