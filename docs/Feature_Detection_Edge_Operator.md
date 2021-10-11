---
Title | Feature Detection Edge Operator
-- | --
Create Date | `2021-10-11T07:33:08Z`
Update Date | `2021-10-11T07:33:08Z`
Edit link | [here](https://github.com/junxnone/aiwiki/issues/65)

---
# Reference
- [Prewitt operator](https://en.wikipedia.org/wiki/Prewitt_operator)
- [梯度与Roberts、Prewitt、Sobel、Lapacian算子](https://blog.csdn.net/swj110119/article/details/51777422)
- 1970 [Object enhancement and extraction](http://web.eecs.utk.edu/~hqi/ece472-572/reference/edge-Prewitt70.pdf)
# Brief
- Roberts
- Prewitt
- Sobel
- Scharr

## Roberts 
- 用于图像锐化
- 计算量小
- 结果边缘不平滑

Original | Vertical -  Positive | Horizontal - Negative
-- | -- | --
Computations | ![image](https://user-images.githubusercontent.com/2216970/99020737-350a7080-259a-11eb-8b16-621a68edb282.png) | ![image](https://user-images.githubusercontent.com/2216970/99020827-4c495e00-259a-11eb-8803-2c894a1e07f1.png)
Pixel 权重 |![image](https://user-images.githubusercontent.com/2216970/99020827-4c495e00-259a-11eb-8803-2c894a1e07f1.png) | ![image](https://user-images.githubusercontent.com/2216970/99021027-b6620300-259a-11eb-90aa-19782f5f1fb6.png)



## Prewitt

Original | Vertical | Horizontal 
-- | -- | --
Computations | ![image](https://user-images.githubusercontent.com/2216970/98907002-12744b00-24f9-11eb-8ec7-d9695c0bc899.png) | ![image](https://user-images.githubusercontent.com/2216970/98907026-1a33ef80-24f9-11eb-92c8-daa6739db9c6.png)
Pixel 权重 | ![image](https://user-images.githubusercontent.com/2216970/99019091-90d2fa80-2596-11eb-9888-dc7d932c9425.png)| ![image](https://user-images.githubusercontent.com/2216970/99019066-857fcf00-2596-11eb-9414-139eb74219de.png) 
![image](https://user-images.githubusercontent.com/2216970/98907897-87945000-24fa-11eb-8731-9a63067bac93.png) | ![image](https://user-images.githubusercontent.com/2216970/98907929-9549d580-24fa-11eb-9c1b-64f543217403.png) | ![image](https://user-images.githubusercontent.com/2216970/98907947-9c70e380-24fa-11eb-99eb-409f04d086b9.png)

## Sobel
- 相比 `prewitt` 增加了权重

Direction | Vertical - Gx  |  Horizontal  - Gy 
-- | -- | --
Computations | ![image](https://user-images.githubusercontent.com/2216970/99015588-54040500-2590-11eb-93fe-0f71cddb4aea.png) |  ![image](https://user-images.githubusercontent.com/2216970/99015600-5e260380-2590-11eb-992f-b6f77e0b52dc.png) 
Pixel 权重 | ![image](https://user-images.githubusercontent.com/2216970/98911539-b19c4100-24ff-11eb-97d6-aa5e77de0b47.png) | ![image](https://user-images.githubusercontent.com/2216970/98911495-a34e2500-24ff-11eb-8088-a02267033909.png)


## Scharr
- 使用了更大的权重

Direction | Vertical - Gx| Horizontal  - Gy  
-- | -- | --
Computations  | ![image](https://user-images.githubusercontent.com/2216970/99019335-1191f680-2597-11eb-8ffc-d29b8a9345f4.png) | ![image](https://user-images.githubusercontent.com/2216970/99019344-15be1400-2597-11eb-8502-8c1870b64f98.png)
Pixel 权重 | ![image](https://user-images.githubusercontent.com/2216970/99015450-fc659980-258f-11eb-98ee-1c328f585c57.png) |  ![image](https://user-images.githubusercontent.com/2216970/99015438-f66fb880-258f-11eb-94eb-4beeb8c6931c.png)


## Prewitt vs Sobel vs Scharr

Original | Roberts | Prewitt | Sobel | Scharr
-- | -- | -- | -- | --
![image](https://user-images.githubusercontent.com/2216970/98910415-19518c80-24fe-11eb-8c49-ff5b6fb1cb75.png) | ![image](https://user-images.githubusercontent.com/2216970/99021667-202edc80-259c-11eb-9a1e-af43a868a853.png) |  ![image](https://user-images.githubusercontent.com/2216970/98910433-1e164080-24fe-11eb-858f-61ce3ac6334d.png) | ![image](https://user-images.githubusercontent.com/2216970/99021758-540a0200-259c-11eb-8fdb-a2141129be28.png)  | ![image](https://user-images.githubusercontent.com/2216970/99021769-5bc9a680-259c-11eb-81cf-14bfc6c90fd5.png)


