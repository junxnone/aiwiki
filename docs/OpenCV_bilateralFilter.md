---
Title | OpenCV bilateralFilter
-- | --
Created @ | `2022-11-28T06:40:30Z`
Last Modify @| `2022-11-28T06:53:32Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/317)

---
- [Bilateral Filtering for Gray and Color Images](https://homepages.inf.ed.ac.uk/rbf/CVonline/LOCAL_COPIES/MANDUCHI1/Bilateral_Filtering.html)

### Black-and-White Images

Org | Filter Images
-- | --
![image](https://user-images.githubusercontent.com/2216970/204211272-92177f10-ec6d-4c35-bd58-56153f7ea86f.png) | ![image](https://user-images.githubusercontent.com/2216970/204211283-2aa34082-e4f6-4cc0-bf9a-916e9e089722.png)
![image](https://user-images.githubusercontent.com/2216970/204211295-8b69c2ba-3eaf-4051-8aea-d261a0f16707.png) | ![image](https://user-images.githubusercontent.com/2216970/204211301-8aba00b7-a458-43e9-8e51-40012e05eaa1.png)
![image](https://user-images.githubusercontent.com/2216970/204211311-c166693c-0cac-4542-950f-cf06a4b16707.png) | ![image](https://user-images.githubusercontent.com/2216970/204211318-15e507ed-c157-4164-9c3b-7ce29d496c87.png)


### Color Images

- 不同于黑白图片, 两种灰度之间是相近的灰度, 色彩图片中两种颜色之间有其他颜色
  - 例如蓝红之间有粉红和紫色
- 对颜色边缘进行处理时，图像不止模糊，还可能产生干扰色带

Org | Filter Images
-- | --
![image](https://user-images.githubusercontent.com/2216970/204211951-7340293f-8136-49c9-bced-aa9ed8eaf654.png) | ![image](https://user-images.githubusercontent.com/2216970/204211991-d0f3a002-064a-4e7c-b954-bf8537bff420.png)
![image](https://user-images.githubusercontent.com/2216970/204212000-754c3adb-b51d-462b-9b02-9c89f6258633.png) | ![image](https://user-images.githubusercontent.com/2216970/204212020-698064d1-7802-432b-bbbe-34c6da79241e.png)

Org | Filter ① Images | Filter ⑤ Images
-- | -- | --
![image](https://user-images.githubusercontent.com/2216970/204212776-8a80a331-e97e-4ac0-b15a-e3047147895b.png) | ![image](https://user-images.githubusercontent.com/2216970/204212809-d2e942e9-0225-4fef-a4d1-83220d74c243.png) | ![image](https://user-images.githubusercontent.com/2216970/204212822-d6d03b58-3b56-4445-a87b-faed5365c67c.png)


