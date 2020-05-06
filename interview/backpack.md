# 01
物品单位体积**c** 物品价值**w**  最大体积**v**

``` js
function dp (nums, V) {
  if (nums.length === 0) return 0
  const dp = [new Array(nums.length)]
  // 初始化第一排
  for (let v === 1; v < V; v++) {
    dp[0][v] = v - c[0] >= 0 ? w[0] : 0
  }

  for (let i = 1; i < nums.length; i++) {
    for (let v = 1; v<=V ;v++) {
      dp[i][v] = dp[i-1][v]
      if (v - c[i] >= 0) {
        dp[i][v] = Math.max(dp[i-1][v], dp[i-1][v - c[i]] + w[i])
      }
    }
  }

  return dp[nums.length - 1].reduce((sum, cur) => sum < cur ? cur : sum, 0)
}

function DP (n, V) {
  const dp = new Array(V + 1).fill(0)
  dp[0] = 0

  for (let i = 0; i<n; i++) {
      for (let v = c[i]; v <= V; v++) {
        dp[v] = Math.max(dp[v], dp[v - c[i]] + w[i])
      }
  }

  return dp[V]
}
```
