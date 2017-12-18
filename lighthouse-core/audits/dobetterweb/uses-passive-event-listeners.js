/**
 * @license Copyright 2016 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

/**
 * @fileoverview Audit a page to see if it is using passive event listeners on
 * scroll-blocking touch and wheel event listeners.
 */

'use strict';

const ViolationAudit = require('../violation-audit');

class PassiveEventsAudit extends ViolationAudit {
  /**
   * @return {!AuditMeta}
   */
  static get meta() {
    return {
      name: 'uses-passive-event-listeners',
      description: '使用 passive listeners 提高滚动性能' +
        '(Uses passive listeners to improve scrolling performance)',
      failureDescription: '未使用 passive listeners 来提高滚动性能',
      helpText: '考虑将 touch 和 wheel 监听事件设置成 `passive` 从而提高页面的滚动性能. ' +
          '[查看更多](https://developers.google.com/web/tools/lighthouse/audits/passive-event-listeners).',
      requiredArtifacts: ['ChromeConsoleMessages'],
    };
  }

  /**
   * @param {!Artifacts} artifacts
   * @return {!AuditResult}
   */
  static audit(artifacts) {
    const results = ViolationAudit.getViolationResults(artifacts, /passive event listener/);

    const headings = [
      {key: 'url', itemType: 'url', text: 'URL'},
      {key: 'label', itemType: 'text', text: 'Location'},
    ];
    const details = ViolationAudit.makeTableDetails(headings, results);

    return {
      rawValue: results.length === 0,
      extendedInfo: {
        value: results,
      },
      details,
    };
  }
}

module.exports = PassiveEventsAudit;
