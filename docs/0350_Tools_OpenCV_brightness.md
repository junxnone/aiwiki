---
Title | Tools OpenCV brightness
-- | --
Created @ | `2019-05-29T09:35:01Z`
Last Modify @| `2022-12-27T03:13:38Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/350)

---
# 计算图片 average brightness

```
def brightness_calc(img):
    frame = cv2.imread(img)
    img_hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
    v = img_hsv[:, :, 2].mean()  #average of V channel
    return v
```
