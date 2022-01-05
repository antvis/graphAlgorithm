
import { getAllProperties } from './utils/node-properties';
import { oneHot, getDistance } from './utils/data-preprocessing';
import Vector from './utils/vector';
import { GraphData, ClusterData, DistanceType } from './types';
/**
 *  k-means算法 根据节点属性之间的欧氏距离将节点聚类为K个簇
 * @param data 图数据 
 * @param k 质心（聚类中心）个数
 * @param seedNode 种子节点
 * @param involvedKeys 参与计算的key集合
 * @param uninvolvedKeys 不参与计算的key集合
 * @param propertyKey 属性的字段名
 * @param distanceType 距离类型
 */
const kMeans = (
  data: GraphData,
  k: number = 3,
  involvedKeys: string[] = [],
  uninvolvedKeys: string[] = [],
  propertyKey: string = 'properties',
  distanceType: DistanceType = DistanceType.EuclideanDistance,
) : ClusterData => {
  const { nodes, edges } = data;
  // 所有节点属性集合
  const properties = getAllProperties(nodes, propertyKey);
  // 所有节点属性one-hot特征向量集合s
  const allPropertiesWeight = oneHot(properties, involvedKeys, uninvolvedKeys);
  // 记录节点的原始index，与allPropertiesWeight对应
  for (let i = 0; i < nodes.length; i++) {
    nodes[i].originIndex = i;
  }
  // 初始化质心（聚类中心）
  const centroids = [];
  const centroidIndexList = [];
  const clusters = [];
  for (let i = 0; i < k; i ++) {
    if (i === 0) {
      // 随机选取质心（聚类中心）
      const randomIndex = Math.floor(Math.random() * nodes.length);
      centroids[i] = allPropertiesWeight[randomIndex];
      centroidIndexList.push(randomIndex);
      clusters[i] = [nodes[randomIndex]];
      nodes[randomIndex].clusterId = String(i);
    } else {
      let maxDistance = -Infinity;
      let maxDistanceIndex = 0;
      // 选取与已有质心平均距离最远的点做为新的质心
      for (let m = 0; m < nodes.length; m++) {
        if (!centroidIndexList.includes(m)) {
          let totalDistance = 0;
          for (let j = 0; j < centroids.length; j++) {
            // 求节点到质心距离（默认欧式距离）
            const distance = getDistance(allPropertiesWeight[nodes[m].originIndex], centroids[j], distanceType);
            totalDistance += distance;
          }
          // 节点到各质心的平均距离（默认欧式距离）
          const avgDistance = totalDistance / centroids.length;
          // 记录到已有质心最远的的距离和节点索引
          if (avgDistance > maxDistance) {
            maxDistance = avgDistance;
            maxDistanceIndex = m;
          }
        }
      }
      centroids[i] = allPropertiesWeight[maxDistanceIndex];
      centroidIndexList.push(maxDistanceIndex);
      clusters[i] = [nodes[maxDistanceIndex]];
      nodes[maxDistanceIndex].clusterId = String(i);
    }
  }

  let iterations = 0;
  while (true) {
    for (let i = 0; i < nodes.length; i++) {
      let minDistanceIndex = 0;
      let minDistance = Infinity;
      if (!(iterations === 0 && centroidIndexList.includes(i))) {
        for (let j = 0; j < centroids.length; j++) {
          // 求节点到质心的距离（默认欧式距离）
          const distance = getDistance(allPropertiesWeight[i], centroids[j], distanceType);
          // 记录节点最近的质心的索引
          if (distance < minDistance) {
            minDistance = distance;
            minDistanceIndex = j;
          }
        }
      
        // 从原来的类别删除节点
        if (nodes[i].clusterId !== String(minDistanceIndex)) {
          for (let n = 0; n < clusters[minDistanceIndex].length; n++) {
            if (clusters[minDistanceIndex][n].id === nodes[i].id) {
              clusters[minDistanceIndex].splice(n, 1);
            }
          }
          // 将节点划分到距离最小的质心（聚类中心）所对应的类中
          clusters[minDistanceIndex].push(nodes[i]);
          nodes[i].clusterId = String(minDistanceIndex);
        }
      }
    }

    // 是否存在质心（聚类中心）移动
    let centroidsEqualAvg = false;
    for (let i = 0; i < clusters.length; i ++) {
      const clusterNodes = clusters[i];
      let totalVector = new Vector([]);
      for (let j = 0; j < clusterNodes.length; j++) {
        totalVector = totalVector.add(new Vector(allPropertiesWeight[clusterNodes[j].originIndex]));
      }
      // 计算每个类别的均值向量
      const avgVector = totalVector.avg(clusterNodes.length);
      // 如果均值向量不等于质心向量
      if (!avgVector.equal(new Vector(centroids[i]))) {
        centroidsEqualAvg = true;
        // 移动/更新每个类别的质心（聚类中心）到该均值向量
        centroids[i] = avgVector.getArr();
      }
    }
    iterations++;
    // 如果不存在质心（聚类中心）移动或者迭代次数超过1000，则停止
    if (centroidsEqualAvg || iterations >= 1000) {
      break;
    }
  }

  // get the cluster edges
  const clusterEdges = [];
  const clusterEdgeMap = {};
  edges.forEach(edge => {
    const { source, target } = edge;
    const sourceClusterId = nodes.find(node => node.id === source)?.clusterId;
    const targetClusterId = nodes.find(node => node.id === target)?.clusterId;
    const newEdgeId = `${sourceClusterId}---${targetClusterId}`;
    if (clusterEdgeMap[newEdgeId]) {
      clusterEdgeMap[newEdgeId].count++;
    } else {
      const newEdge = {
        source: sourceClusterId,
        target: targetClusterId,
        count: 1
      };
      clusterEdgeMap[newEdgeId] = newEdge;
      clusterEdges.push(newEdge);
    }
  });

  return { clusters, clusterEdges };
}

export default kMeans;
