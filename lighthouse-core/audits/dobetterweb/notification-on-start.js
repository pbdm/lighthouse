/**
 * @license Copyright 2016 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

/**
 * @fileoverview Audits a page to see if it is requesting usage of the notification API on
 * page load. This is often a sign of poor user experience because it lacks context.
 */

'use strict';

const ViolationAudit = require('../violation-audit');

class NotificationOnStart extends ViolationAudit {
  /**
   * @return {!AuditMeta}
   */
  static get meta() {
    return {
      name: 'notification-on-start',
      description: '避免在页面加载时请求通知消息权限',
      failureDescription: '在页面加载时请求了通知消息权限',
      helpText: '用户会对随意的请求通知消息权限感到不信任和困惑, 考虑将该动作放在用户有交互手势时' +
          ' [Learn more](https://developers.google.com/web/tools/lighthouse/audits/notifications-on-load).',
      requiredArtifacts: ['ChromeConsoleMessages'],
    };
  }

  /**
   * @param {!Artifacts} artifacts
   * @return {!AuditResult}
   */
  static audit(artifacts) {
    const results = ViolationAudit.getViolationResults(artifacts, /notification permission/);

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

module.exports = NotificationOnStart;
