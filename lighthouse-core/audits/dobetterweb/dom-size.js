/**
 * @license Copyright 2017 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

/**
 * @fileoverview Audits a page to see how the size of DOM it creates. Stats like
 * tree depth, # children, and total nodes are returned. The score is calculated
 * based solely on the total number of nodes found on the page.
 */

'use strict';

const Audit = require('../audit');
const Util = require('../../report/v2/renderer/util.js');

const MAX_DOM_NODES = 1500;
const MAX_DOM_TREE_WIDTH = 60;
const MAX_DOM_TREE_DEPTH = 32;

// Parameters for log-normal CDF scoring. See https://www.desmos.com/calculator/9cyxpm5qgp.
const SCORING_POINT_OF_DIMINISHING_RETURNS = 2400;
const SCORING_MEDIAN = 3000;

class DOMSize extends Audit {
  static get MAX_DOM_NODES() {
    return MAX_DOM_NODES;
  }

  /**
   * @return {!AuditMeta}
   */
  static get meta() {
    return {
      name: 'dom-size',
      description: '避免过多的 DOM 大小 (Avoids an excessive DOM size)',
      failureDescription: '使用了过多的 DOM 大小',
      helpText: '浏览器引擎建议一个页面包含少于 ' +
        `~${Util.formatNumber(DOMSize.MAX_DOM_NODES)} DOM节点. 最好是树深度` +
        `小于${MAX_DOM_TREE_DEPTH}个节点, 元素的父子节点小于 ${MAX_DOM_TREE_WIDTH} ` +
        '. 一个大的 DOM 会增多内存的消耗, 从而导致更长的的' +
        '[样式计算时间](https://developers.google.com/web/fundamentals/performance/rendering/reduce-the-scope-and-complexity-of-style-calculations), ' +
        '和[排版, 绘制时间](https://developers.google.com/speed/articles/reflow). [查看更多](https://developers.google.com/web/fundamentals/performance/rendering/).',
      scoringMode: Audit.SCORING_MODES.NUMERIC,
      requiredArtifacts: ['DOMStats'],
    };
  }

  /**
   * @param {!Artifacts} artifacts
   * @return {!AuditResult}
   */
  static audit(artifacts) {
    const stats = artifacts.DOMStats;

    /**
     * html >
     *   body >
     *     div >
     *       span
     */
    const depthSnippet = stats.depth.pathToElement.reduce((str, curr, i) => {
      return `${str}\n` + '  '.repeat(i) + `${curr} >`;
    }, '').replace(/>$/g, '').trim();
    const widthSnippet = 'Element with most children:\n' +
        stats.width.pathToElement[stats.width.pathToElement.length - 1];

    // Use the CDF of a log-normal distribution for scoring.
    //   <= 1500: score≈100
    //   3000: score=50
    //   >= 5970: score≈0
    const score = Audit.computeLogNormalScore(
      stats.totalDOMNodes,
      SCORING_POINT_OF_DIMINISHING_RETURNS,
      SCORING_MEDIAN
    );

    const cards = [{
      title: 'Total DOM Nodes',
      value: Util.formatNumber(stats.totalDOMNodes),
      target: `< ${Util.formatNumber(MAX_DOM_NODES)} nodes`,
    }, {
      title: 'DOM Depth',
      value: Util.formatNumber(stats.depth.max),
      snippet: depthSnippet,
      target: `< ${Util.formatNumber(MAX_DOM_TREE_DEPTH)}`,
    }, {
      title: 'Maximum Children',
      value: Util.formatNumber(stats.width.max),
      snippet: widthSnippet,
      target: `< ${Util.formatNumber(MAX_DOM_TREE_WIDTH)} nodes`,
    }];

    return {
      score,
      rawValue: stats.totalDOMNodes,
      displayValue: `${Util.formatNumber(stats.totalDOMNodes)} nodes`,
      extendedInfo: {
        value: cards,
      },
      details: {
        type: 'cards',
        header: {type: 'text', text: 'View details'},
        items: cards,
      },
    };
  }
}

module.exports = DOMSize;
