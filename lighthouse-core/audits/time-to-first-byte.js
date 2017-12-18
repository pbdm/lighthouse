/**
 * @license Copyright 2017 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const Audit = require('./audit');
const Util = require('../report/v2/renderer/util');

const TTFB_THRESHOLD = 600;

class TTFBMetric extends Audit {
  /**
   * @return {!AuditMeta}
   */
  static get meta() {
    return {
      name: 'time-to-first-byte',
      description: '减短服务端的响应时间(Keep server response times low (TTFB))',
      informative: true,
      helpText: '传送首字节的时间(Time To First Byte)决定了服务端响应的时间' +
        ' [查看更多](https://developers.google.com/web/tools/chrome-devtools/network-performance/issues).',
      requiredArtifacts: ['devtoolsLogs', 'URL'],
    };
  }

  static caclulateTTFB(record) {
    const timing = record._timing;

    return timing.receiveHeadersEnd - timing.sendEnd;
  }

  /**
   * @param {!Artifacts} artifacts
   * @return {!AuditResult}
   */
  static audit(artifacts) {
    const devtoolsLogs = artifacts.devtoolsLogs[Audit.DEFAULT_PASS];

    return artifacts.requestNetworkRecords(devtoolsLogs)
      .then((networkRecords) => {
        let debugString = '';

        const finalUrl = artifacts.URL.finalUrl;
        const finalUrlRequest = networkRecords.find(record => record._url === finalUrl);
        const ttfb = TTFBMetric.caclulateTTFB(finalUrlRequest);
        const passed = ttfb < TTFB_THRESHOLD;

        if (!passed) {
          debugString = `Root document took ${Util.formatMilliseconds(ttfb, 1)} ` +
            'to get the first byte.';
        }

        return {
          rawValue: ttfb,
          score: passed,
          displayValue: Util.formatMilliseconds(ttfb),
          extendedInfo: {
            value: {
              wastedMs: ttfb - TTFB_THRESHOLD,
            },
          },
          debugString,
        };
      });
  }
}

module.exports = TTFBMetric;
