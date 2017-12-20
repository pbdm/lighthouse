/**
 * @license Copyright 2016 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const Audit = require('./audit');
const Util = require('../report/v2/renderer/util');

class CriticalRequestChains extends Audit {
  /**
   * @return {!AuditMeta}
   */
  static get meta() {
    return {
      name: 'critical-request-chains',
      description: '关键路径(Critical Request Chains)',
      informative: true,
      // helpText: '下面的关键请求路径展示了那些资源是高优先级的. 考虑减小路径的长度, 减少下载资源的大小或者异步加载一些不重要的资源来优化页面加载' +
      helpText: '考虑减小关键路径的长度, 减小下载资源的大小或者异步加载一些不重要的资源来优化页面加载 ' +
          '[查看更多](https://developers.google.com/web/tools/lighthouse/audits/critical-request-chains).',
      requiredArtifacts: ['devtoolsLogs'],
    };
  }

  static _traverse(tree, cb) {
    function walk(node, depth, startTime, transferSize = 0) {
      const children = Object.keys(node);
      if (children.length === 0) {
        return;
      }
      children.forEach(id => {
        const child = node[id];
        if (!startTime) {
          startTime = child.request.startTime;
        }

        // Call the callback with the info for this child.
        cb({
          depth,
          id,
          node: child,
          chainDuration: (child.request.endTime - startTime) * 1000,
          chainTransferSize: (transferSize + child.request.transferSize),
        });

        // Carry on walking.
        walk(child.children, depth + 1, startTime);
      }, '');
    }

    walk(tree, 0);
  }

  /**
   * Get stats about the longest initiator chain (as determined by time duration)
   * @return {{duration: number, length: number, transferSize: number}}
   */
  static _getLongestChain(tree) {
    const longest = {
      duration: 0,
      length: 0,
      transferSize: 0,
    };
    CriticalRequestChains._traverse(tree, opts => {
      const duration = opts.chainDuration;
      if (duration > longest.duration) {
        longest.duration = duration;
        longest.transferSize = opts.chainTransferSize;
        longest.length = opts.depth;
      }
    });
    // Always return the longest chain + 1 because the depth is zero indexed.
    longest.length++;
    return longest;
  }

  /**
   * Audits the page to give a score for First Meaningful Paint.
   * @param {!Artifacts} artifacts The artifacts from the gather phase.
   * @return {!AuditResult} The score from the audit, ranging from 0-100.
   */
  static audit(artifacts) {
    const devtoolsLogs = artifacts.devtoolsLogs[Audit.DEFAULT_PASS];
    return artifacts.requestCriticalRequestChains(devtoolsLogs).then(chains => {
      let chainCount = 0;
      function walk(node, depth) {
        const children = Object.keys(node);

        // Since a leaf node indicates the end of a chain, we can inspect the number
        // of child nodes, and, if the count is zero, increment the count.
        if (children.length === 0) {
          chainCount++;
        }

        children.forEach(id => {
          const child = node[id];
          walk(child.children, depth + 1);
        }, '');
      }

      // Account for initial navigation
      const initialNavKey = Object.keys(chains)[0];
      const initialNavChildren = initialNavKey && chains[initialNavKey].children;
      if (initialNavChildren && Object.keys(initialNavChildren).length > 0) {
        walk(initialNavChildren, 0);
      }

      const longestChain = CriticalRequestChains._getLongestChain(chains);

      return {
        rawValue: chainCount === 0,
        displayValue: Util.formatNumber(chainCount),
        extendedInfo: {
          value: {
            chains,
            longestChain,
          },
        },
        details: {
          type: 'criticalrequestchain',
          header: {type: 'text', text: '查看关键网络请求瀑布流:'},
          chains,
          longestChain,
        },
      };
    });
  }
}

module.exports = CriticalRequestChains;
