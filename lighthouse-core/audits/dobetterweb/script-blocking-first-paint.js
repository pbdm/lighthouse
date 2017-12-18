/**
 * @license Copyright 2016 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

/**
 * @fileoverview Audit a page to see if it does not use sync <script> in <head>.
 */

'use strict';

const Audit = require('../audit');
const LinkBlockingFirstPaintAudit = require('./link-blocking-first-paint');

class ScriptBlockingFirstPaint extends Audit {
  /**
   * @return {!AuditMeta}
   */
  static get meta() {
    return {
      name: 'script-blocking-first-paint',
      description: '减少阻塞渲染的脚本(Reduce render-blocking scripts)',
      informative: true,
      helpText: '脚本文件正阻塞页面的首次渲染, 考虑将关键的脚本放在内联标签里, 不关键的使用异步加载 ' +
          '[查看更多](https://developers.google.com/web/tools/lighthouse/audits/blocking-resources).',
      requiredArtifacts: ['TagsBlockingFirstPaint', 'traces'],
    };
  }

  /**
   * @param {!Artifacts} artifacts
   * @return {!AuditResult}
   */
  static audit(artifacts) {
    const trace = artifacts.traces[Audit.DEFAULT_PASS];
    return artifacts.requestTraceOfTab(trace).then(traceOfTab => {
      const fcpTsInMs = traceOfTab.timestamps.firstContentfulPaint / 1000;
      return LinkBlockingFirstPaintAudit.computeAuditResultForTags(artifacts, 'SCRIPT', fcpTsInMs);
    });
  }
}

module.exports = ScriptBlockingFirstPaint;
