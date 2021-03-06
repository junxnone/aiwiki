---
Title | PCL Tools
-- | --
Create Date | `2021-05-11T03:42:58Z`
Update Date | `2022-05-17T06:41:27Z`
Edit link | [here](https://github.com/junxnone/aiwiki/issues/81)

---
## Reference
- []()

## Brief
- 可视化工具 pcl_viewer
- 点云格式转换 ply2pcd/xyz2pcd/...
- `mesh` 转点云 mesh2pcd/mesh_sampling


## UseCase
### pcl_viewer


```
pcl_viewer test/car6.pcd
```
![Screenshot from 2021-05-01 13-47-29](https://user-images.githubusercontent.com/2216970/116772798-e25b3d00-aa83-11eb-93ae-add46cb6a782.png)
- **Viewer 快捷键**
```
`+` - 增加 点 大小
`-` - 减少 点 大小
`g` - 显示  坐标
`r` - 重置位置
`u` - 显示色栏
`q` - 退出
`j` - 截图
```

### mesh 转点云
- pcl_mesh2pcd 

```
$ pcl_mesh2pcd -h
Convert a CAD model to a point cloud using ray tracing operations. For more information, use: pcl_mesh2pcd -h
Syntax is: pcl_mesh2pcd input.{ply,obj} output.pcd <options>
  where options are:
                     -level X      = tessellated sphere level (default: 2)
                     -resolution X = the sphere resolution in angle increments (default: 100 deg)
                     -leaf_size X  = the XYZ leaf size for the VoxelGrid -- for data reduction (default: 0.010000 m)
                     -no_vis_result = flag to stop visualizing the generated pcd
```
- pcl_mesh_sampling 
  - 可以通过 leaf_size 生成不同大小的点云

```
pcl_mesh_sampling -h
Convert a CAD model to a point cloud using uniform sampling. For more information, use: pcl_mesh_sampling -h
Syntax is: pcl_mesh_sampling input.{ply,obj} output.pcd <options>
  where options are:
                     -n_samples X      = number of samples (default: 100000)
                     -leaf_size X  = the XYZ leaf size for the VoxelGrid -- for data reduction (default: 0.010000 m)
                     -write_normals = flag to write normals to the output pcd
                     -write_colors  = flag to write colors to the output pcd
                     -no_vis_result = flag to stop visualizing the generated pcd
```

