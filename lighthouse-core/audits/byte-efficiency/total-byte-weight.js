/**
 * @license Copyright 2017 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const ByteEfficiencyAudit = require('./byte-efficiency-audit');

// Parameters for log-normal CDF scoring. See https://www.desmos.com/calculator/gpmjeykbwr
// ~75th and ~90th percentiles http://httparchive.org/interesting.php?a=All&l=Feb%201%202017&s=All#bytesTotal
const SCORING_POINT_OF_DIMINISHING_RETURNS = 2500 * 1024;
const SCORING_MEDIAN = 4000 * 1024;

class TotalByteWeight extends ByteEfficiencyAudit {
  /**
   * @return {!AuditMeta}
   */
  static get meta() {
    return {
      name: 'total-byte-weight',
      description: '避免巨大的网络负载(Avoids enormous network payloads)',
      failureDescription: '存在巨大的网络负载',
      helpText:
          '网络传输大小 [耗费用户的实际内存](https://whatdoesmysitecost.com/) ' +
          '而且会[导致](http://httparchive.org/interesting.php#onLoad)过长的加载时间. ' +
          '尝试找到减少文件大小的方法.',
      scoringMode: ByteEfficiencyAudit.SCORING_MODES.NUMERIC,
      requiredArtifacts: ['devtoolsLogs'],
    };
  }

  /**
   * @param {!Artifacts} artifacts
   * @return {!Promise<!AuditResult>}
   */
  static audit(artifacts) {
    const devtoolsLogs = artifacts.devtoolsLogs[ByteEfficiencyAudit.DEFAULT_PASS];
    return Promise.all([
      artifacts.requestNetworkRecords(devtoolsLogs),
      artifacts.requestNetworkThroughput(devtoolsLogs),
    ]).then(([networkRecords, networkThroughput]) => {
      let totalBytes = 0;
      let results = [];
      networkRecords.forEach(record => {
        // exclude data URIs since their size is reflected in other resources
        // exclude unfinished requests since they won't have transfer size information
        if (record.scheme === 'data' || !record.finished) return;

        const result = {
          url: record.url,
          totalBytes: record.transferSize,
          totalKb: this.bytesToKbString(record.transferSize),
          totalMs: this.bytesToMsString(record.transferSize, networkThroughput),
        };

        totalBytes += result.totalBytes;
        results.push(result);
      });
      const totalCompletedRequests = results.length;
      results = results.sort((itemA, itemB) => itemB.totalBytes - itemA.totalBytes).slice(0, 10);


      // Use the CDF of a log-normal distribution for scoring.
      //   <= 1600KB: score≈100
      //   4000KB: score=50
      //   >= 9000KB: score≈0
      const score = ByteEfficiencyAudit.computeLogNormalScore(
        totalBytes,
        SCORING_POINT_OF_DIMINISHING_RETURNS,
        SCORING_MEDIAN
      );

      const headings = [
        {key: 'url', itemType: 'url', text: 'URL'},
        {key: 'totalKb', itemType: 'text', text: 'Total Size'},
        {key: 'totalMs', itemType: 'text', text: 'Transfer Time'},
      ];

      const tableDetails = ByteEfficiencyAudit.makeTableDetails(headings, results);

      return {
        score,
        rawValue: totalBytes,
        displayValue: `总大小为 ${ByteEfficiencyAudit.bytesToKbString(totalBytes)}`,
        extendedInfo: {
          value: {
            results,
            totalCompletedRequests,
          },
        },
        details: tableDetails,
      };
    });
  }
}

module.exports = TotalByteWeight;
