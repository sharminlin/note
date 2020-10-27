/**
 * Definition for a binary tree node.
 * function TreeNode(val, left, right) {
 *     this.val = (val===undefined ? 0 : val)
 *     this.left = (left===undefined ? null : left)
 *     this.right = (right===undefined ? null : right)
 * }
 */

/**
 * 二叉树的前序遍历
 * https://leetcode-cn.com/problems/binary-tree-preorder-traversal/
 * @param {TreeNode} root
 * @return {number[]}
 */
{
  // 递归版本
  let preorderTraversal = function (root) {
    const result = []
    function dfs(node) {
      if (!node) return
      result.push(node.val)
      dfs(node.left)
      dfs(node.right)
    }
    dfs(root)
    return result
  };
}

{
  // 迭代版本
  let preorderTraversal = function (root) {
    const result = []
    const nodes = [root]
    while (nodes.length) {
      let p = nodes.shift()
      if (p) {
        result.push(p.val)
        nodes.unshift(p.right)
        nodes.unshift(p.left)
      }
    }
    return result
  };
}
