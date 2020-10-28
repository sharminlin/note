/**
 * 两数之和（简单）
 * https://leetcode-cn.com/problems/two-sum/
 * @param {number[]} nums
 * @param {number} target
 * @return {number[]}
 */
// 双重循环
{
  let twoSum = function (nums, target) {
    let len = nums.length
    for (let i = 0; i < len - 1; i++) {
      for (let j = i + 1; j < len; j++) {
        if (nums[i] + nums[j] === target) {
          return [i, j]
        }
      }
    }
  };
}
// hash表
{
  let twoSum = function (nums, target) {
    let len = nums.length
    let hash = {} // 注册表 key+value=target
    for (let i = 0; i < len; i++) {
      if (hash[nums[i]]) {
        return [nums[i], hash[nums[i]]]
      } else {
        hash[target - nums[i]] = nums[i]
      }
    }
  };
}

/**
 * 三数之和 （中等）
 * https://leetcode-cn.com/problems/3sum/
 * @param {number[]} nums
 * @return {number[][]}
 */
{
  let threeSum = function (nums) {
    // 特判，小于3
    if (nums.length < 3) return []
    // 排序升序
    nums.sort((a, b) => a - b)
    let result = []
    // i循环
    for (let i = 0; i < nums.length - 1; i++) {
      if (nums[i] > 0) {
        return result
      }
      // 去重复值
      if (i > 0 && nums[i] === nums[i - 1]) {
        continue
      }
      // i之后，形成一个双指针
      let L = i + 1, R = nums.length - 1

      while (L < R) {
        // i L R相加的三种情况
        if (nums[i] + nums[L] + nums[R] === 0) {
          result.push([nums[i], nums[L], nums[R]])
          // 去重复值
          while (L < R && nums[L] === nums[L + 1]) {
            L++
          }
          // 去重复值
          while (L < R && nums[R] === nums[R - 1]) {
            R--
          }
          // 左右指针往中间靠
          L++
          R--
        } else if (nums[i] + nums[L] + nums[R] > 0) {
          R--
        } else if (nums[i] + nums[L] + nums[R] < 0) {
          L++
        }
      }
    }
    return result
  };
}

/**
 * 最接近的三数之和 （中等）
 * https://leetcode-cn.com/problems/3sum-closest/
 * @param {number[]} nums
 * @param {number} target
 * @return {number}
 */
{
  let threeSumClosest = function (nums, target) {
    // 特判，小于3
    if (nums.length < 3) return undefined
    // 排序升序
    nums.sort((a, b) => a - b)

    let min = Infinity

    // i循环
    for (let i = 0; i < nums.length - 1; i++) {
      // 去重复值
      if (i > 0 && nums[i] === nums[i - 1]) {
        continue
      }
      // i之后，形成一个双指针
      let L = i + 1, R = nums.length - 1

      while (L < R) {
        let value = nums[i] + nums[L] + nums[R]
        let diff = Math.abs(target - value)
        // i L R相加的三种情况
        if (diff === 0) {
          return value
        } else if (value > target) {
          Math.abs(min - target) > diff && (min = value)
          R--
        } else if (value < target) {
          Math.abs(min - target) > diff && (min = value)
          L++
        }
      }
    }
    return min
  };
}

/**
 * 独一无二的出现次数 （简单）
 * https://leetcode-cn.com/problems/unique-number-of-occurrences/
 * @param {number[]} arr
 * @return {boolean}
 */
{
  let uniqueOccurrences = function (arr) {
    const hash = {}
    for (let i = 0; i < arr.length; i++) {
      !hash[arr[i]] ? (hash[arr[i]] = 1) : ++hash[arr[i]]
    }

    let values = Object.values(hash)
    let sets = new Set(values)
    return values.length === sets.size
  };
}
