---
Title | OpenCV IP misc distanceTransform
-- | --
Created @ | `2020-09-24T06:12:08Z`
Last Modify @| `2022-12-27T09:11:44Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/346)

---

# distanceTransform 处理区域粘连


```
dst_img = cv2.distanceTransform(img, cv2.DIST_C, cv2.DIST_MASK_3)
```

origin image | cv2.DIST_C | cv2.DIST_L1 | cv2.DIST_L2 
-- | -- | -- | --
![image](https://user-images.githubusercontent.com/2216970/94107353-e0872680-fe6f-11ea-8696-c5925b01ec1d.png) | ![image](https://user-images.githubusercontent.com/2216970/94107361-e5e47100-fe6f-11ea-89a5-eb7cacbe2504.png) | ![image](https://user-images.githubusercontent.com/2216970/94107537-45428100-fe70-11ea-9912-99644b644bfa.png) | ![image](https://user-images.githubusercontent.com/2216970/94107627-7458f280-fe70-11ea-9a06-5b84ed995db2.png)


