/**
 * @license Copyright 2017 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
/*
 * @fileoverview This audit determines if the images could be smaller when compressed with WebP.
 */
'use strict';

const ByteEfficiencyAudit = require('./byte-efficiency-audit');
const OptimizedImages = require('./uses-optimized-images');
const URL = require('../../lib/url-shim');

const IGNORE_THRESHOLD_IN_BYTES = 8192;

class UsesWebPImages extends ByteEfficiencyAudit {
  /**
   * @return {!AuditMeta}
   */
  static get meta() {
    return {
      name: 'uses-webp-images',
      description: '使用下一代图片格式(Serve images in next-gen formats)',
      informative: true,
      helpText: 'JPEG 2000, JPEG XR, WebP 这样的图片格式总是比 PNG 或者 JPG 提供了更好的压缩率' +
        '[查看更多](https://developers.google.com/web/tools/lighthouse/audits/webp).',
      requiredArtifacts: ['OptimizedImages', 'devtoolsLogs'],
    };
  }

  /**
   * @param {!Artifacts} artifacts
   * @return {!Audit.HeadingsResult}
   */
  static audit_(artifacts) {
    const images = artifacts.OptimizedImages;

    const failedImages = [];
    const results = [];
    images.forEach(image => {
      if (image.failed) {
        failedImages.push(image);
        return;
      } else if (image.originalSize < image.webpSize + IGNORE_THRESHOLD_IN_BYTES) {
        return;
      }

      const url = URL.elideDataURI(image.url);
      const webpSavings = OptimizedImages.computeSavings(image, 'webp');

      results.push({
        url,
        fromProtocol: image.fromProtocol,
        isCrossOrigin: !image.isSameOrigin,
        preview: {url: image.url, mimeType: image.mimeType, type: 'thumbnail'},
        totalBytes: image.originalSize,
        wastedBytes: webpSavings.bytes,
      });
    });

    let debugString;
    if (failedImages.length) {
      const urls = failedImages.map(image => URL.getURLDisplayName(image.url));
      debugString = `Lighthouse was unable to decode some of your images: ${urls.join(', ')}`;
    }

    const headings = [
      {key: 'preview', itemType: 'thumbnail', text: ''},
      {key: 'url', itemType: 'url', text: 'URL'},
      {key: 'totalKb', itemType: 'text', text: 'Original'},
      {key: 'potentialSavings', itemType: 'text', text: 'Potential Savings'},
    ];

    return {
      debugString,
      results,
      headings,
    };
  }
}

module.exports = UsesWebPImages;
