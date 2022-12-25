---
Title | 3D Tools PCL IO
-- | --
Created @ | `2021-05-11T02:02:53Z`
Last Modify @| `2022-12-25T03:54:13Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/80)

---
# Read/Write

## Reference
- [IO Docs](https://pcl.readthedocs.io/projects/tutorials/en/latest/index.html#i-o)
- [PCD File Format](https://pcl.readthedocs.io/projects/tutorials/en/latest/pcd_file_format.html#pcd-file-format)
- [PLY - Polygon File Format](http://paulbourke.net/dataformats/ply/)

## Brief
- PCD (Point Cloud Data) read/write
- Other formats

Name | Description
-- | --
PLY | developed at Stanford University by Turk et al
STL | CAD Software
OBJ | developed by Wavefront Technologies
X3D | ISO standard XML-based file format
[Others](https://en.wikipedia.org/wiki/Category:Graphics_file_formats) | Wikipedia

- Data Types
  - PointCloud
  - PointCloud2


## UseCase


### PCD
- PCL1.0 ==> PCD_V7
- pcl::io::loadPCDFile
- pcl::io::savePCDFileASCII

```
#include <pcl/io/pcd_io.h>
#include <pcl/point_types.h>

pcl::PCLPointCloud2::Ptr example_cloud (new pcl::PCLPointCloud2 ());

pcl::PCDReader reader;
reader.read ("example_cloud.pcd", *example_cloud ); 

pcl::PCDWriter writer;
writer.write ("save_example_cloud.pcd", *example_cloud);

```
```
# .PCD v0.7 - Point Cloud Data file format
VERSION 0.7
FIELDS x y z normal_x normal_y normal_z
SIZE 4 4 4 4 4 4
TYPE F F F F F F  # I/U/F
COUNT 1 1 1 1 1 1
WIDTH 5996100
HEIGHT 1
VIEWPOINT 0 0 0 1 0 0 0
POINTS 5996100
DATA ASCII  # binary/ASCII
0.93773 0.33763 0 4.2108e+06
0.90805 0.35641 0 4.2108e+06
0.81915 0.32 0 4.2108e+06
...
...
...
```

## PLY

```
#include <pcl/io/ply_io.h>
#include <pcl/point_types.h>

PointCloud<PointXYZ>::Ptr cloud_in(new PointCloud<PointXYZ>());

pcl::io::loadPLYFile (argv[1], *cloud_in) 
```

## Concatenate
- `cloud_c  = cloud_a; cloud_c += cloud_b;`

```
Cloud A:
    0.352222 -0.151883 -0.106395
    -0.397406 -0.473106 0.292602
    -0.731898 0.667105 0.441304
    -0.734766 0.854581 -0.0361733
    -0.4607 -0.277468 -0.916762
Cloud B:
    0.183749 0.968809 0.512055
    -0.998983 -0.463871 0.691785
    0.716053 0.525135 -0.523004
Cloud C:
    0.352222 -0.151883 -0.106395
    -0.397406 -0.473106 0.292602
    -0.731898 0.667105 0.441304
    -0.734766 0.854581 -0.0361733
    -0.4607 -0.277468 -0.916762
    0.183749 0.968809 0.512055
    -0.998983 -0.463871 0.691785
    0.716053 0.525135 -0.523004
```

- pcl::concatenateFields

```
Cloud A:
    0.352222 -0.151883 -0.106395
    -0.397406 -0.473106 0.292602
    -0.731898 0.667105 0.441304
    -0.734766 0.854581 -0.0361733
    -0.4607 -0.277468 -0.916762
Cloud B:
    0.183749 0.968809 0.512055
    -0.998983 -0.463871 0.691785
    0.716053 0.525135 -0.523004
    0.439387 0.56706 0.905417
    -0.579787 0.898706 -0.504929
Cloud C:
    0.352222 -0.151883 -0.106395 0.183749 0.968809 0.512055
    -0.397406 -0.473106 0.292602 -0.998983 -0.463871 0.691785
    -0.731898 0.667105 0.441304 0.716053 0.525135 -0.523004
    -0.734766 0.854581 -0.0361733 0.439387 0.56706 0.905417
    -0.4607 -0.277468 -0.916762 -0.579787 0.898706 -0.504929
```
