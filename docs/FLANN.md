---
Title | FLANN
-- | --
Create Date | `2021-05-25T02:53:26Z`
Update Date | `2021-10-22T16:12:02Z`
Edit link | [here](https://github.com/junxnone/aiwiki/issues/122)

---
# Reference
- [Github code](https://github.com/flann-lib/flann)
- [Docs - manual.tex](https://github.com/flann-lib/flann/blob/master/doc/manual.tex) [[在线 tex 浏览器](http://texviewer.herokuapp.com/)]
- 2009 [Fast Approximate Nearest Neighbors with Automatic Algorithm Configuration](https://www.cs.ubc.ca/~lowe/papers/09muja.pdf)

# Brief
- FLANN - Fast Library for Approximate Nearest Neighbors
- 用于在高维空间中搜索最近邻
  - **最近邻搜索问题**: `在度量空间X给定一组点P=p1,p2,…,pn,  查询点q属于X, 在P中找到距离q最近的点的问题`

# UseCase

```
namespace flann
{
    template<typename Distance>
    class Index 
    {
	typedef typename Distance::ElementType ElementType;
	typedef typename Distance::ResultType DistanceType;
    public:
        Index(const IndexParams& params, Distance distance = Distance() );
        
        Index(const Matrix<ElementType>& points, const IndexParams& params,
                Distance distance = Distance() );
	~Index();
	void buildIndex();        
        
        void buildIndex(const Matrix<ElementType>& points);
        
        void addPoints(const Matrix<ElementType>& points, 
                       float rebuild_threshold = 2);
        
        void removePoint(size_t point_id);
        
        ElementType* getPoint(size_t point_id);
	int knnSearch(const Matrix<ElementType>& queries, 
		       Matrix<int>& indices, 
		       Matrix<DistanceType>& dists, 
		       size_t knn, 
		       const SearchParams& params);
        int knnSearch(const Matrix<ElementType>& queries,
                       std::vector< std::vector<int> >& indices,
                       std::vector<std::vector<DistanceType> >& dists,
                       size_t knn,
                       const SearchParams& params);
	int radiusSearch(const Matrix<ElementType>& queries, 
			 Matrix<int>& indices, 
			 Matrix<DistanceType>& dists, 
			 float radius, 
			 const SearchParams& params);
        int radiusSearch(const Matrix<ElementType>& queries,
                          std::vector< std::vector<int> >& indices,
                          std::vector<std::vector<DistanceType> >& dists,
                          float radius,
                          const SearchParams& params);
	void save(std::string filename);
	int veclen() const;
	int size() const;
	IndexParams getParameters() const;
        flann_algorithm_t getType() const;
    };
}
```

## Index()
```
        Index(const IndexParams& params, Distance distance = Distance() );
        
        Index(const Matrix<ElementType>& points, const IndexParams& params,
                Distance distance = Distance() );
```

- **points**: `num features × dimensionality` features points
- **params**: Index 参数
  - LinearIndexParams
  - KDTreeIndexParams
  - KMeansIndexParams
  - CompositeIndexParams
  - KDTreeSingleIndexParams
  - KDTreeCuda3dIndexParams
  - LshIndexParams
  - AutotunedIndexParams
  - SavedIndexParams
