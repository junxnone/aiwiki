## Kernel

$\texttt{K} = \alpha \begin{bmatrix} 1 & 1 & 1 & \cdots & 1 & 1 \\ 1 & 1 & 1 & \cdots & 1 & 1 \\ \vdots \\ 1 & 1 & 1 & \cdots & 1 & 1 \end{bmatrix}$

$\alpha = \begin{cases} \frac{1}{\texttt{ksize.width*ksize.height}} & \texttt{when } \texttt{normalize=true} \\1 & \texttt{otherwise}\end{cases}$
 
 
3x3 Kernel  | 5x5 Kernel | 7x7 Kernel
-- | -- | --
![image](https://user-images.githubusercontent.com/2216970/204438619-ca2cc5ad-838a-4c42-b1de-c2906a20d522.png) | ![image](https://user-images.githubusercontent.com/2216970/204438776-0460e846-f79e-4778-8b30-a0d2763e11bc.png) | ![image](https://user-images.githubusercontent.com/2216970/204438854-4168b0a0-4668-4a53-aabc-faf42a78170c.png)


