---
Title | Feature Detection Structure Tensor
-- | --
Create Date | `2021-10-11T07:40:23Z`
Update Date | `2021-10-11T07:40:23Z`
Edit link | [here](https://github.com/junxnone/aiwiki/issues/70)

---
# Reference
- [Structure tensor - wikipedia](https://en.wikipedia.org/wiki/Structure_tensor)
- [结构张量structure tensor](https://blog.csdn.net/u011596455/article/details/71809311)

# Brief
- 区分图像的`平坦区域/边缘区域/角点区域`
- 矩阵


![image](https://user-images.githubusercontent.com/2216970/98459212-9d8cd280-21d3-11eb-9e26-1092e0458861.png) | Ix - x 方向的梯度<br>Iy - y 方向的梯度
-- | --
矩阵 E 的 迹<br>H = trace(E) |  `H =0` 为平坦区域
矩阵 E 的 行列式<br>K = det(E) | `K=0 & H > 0` 为边缘区域<br> `H>0 & K>0` 为角点区域


原图 | 平坦区域 | 边缘区域 | 角点 
-- | -- | -- | -- 
![image](https://user-images.githubusercontent.com/2216970/98459107-6ec22c80-21d2-11eb-8584-f436cc0cbede.png) | ![image](https://user-images.githubusercontent.com/2216970/98459108-71248680-21d2-11eb-96e0-27aa7bb0c0ab.png) | ![image](https://user-images.githubusercontent.com/2216970/98459111-7386e080-21d2-11eb-8d75-e353d6aa3e7c.png) | ![image](https://user-images.githubusercontent.com/2216970/98459112-75e93a80-21d2-11eb-9a65-81655bc035e3.png)



# Others
矩阵的行列式 | ![image](https://user-images.githubusercontent.com/2216970/98459322-cc577880-21d4-11eb-8cef-c995086dd02b.png)
-- | --
**矩阵的迹(trace)** | 对角线元素的总和 <br>![image](https://user-images.githubusercontent.com/2216970/98459348-0d4f8d00-21d5-11eb-8678-4b64e2970f74.png)


