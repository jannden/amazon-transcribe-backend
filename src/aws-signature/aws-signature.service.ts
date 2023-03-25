// Adjusted version of https://github.com/department-stockholm/aws-signature-v4

import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import * as querystring from 'node:querystring';

@Injectable()
export class AwsSignatureService {
  createCanonicalRequest(method, pathname, query, headers, payload) {
    return [
      method.toUpperCase(),
      pathname,
      this.createCanonicalQueryString(query),
      this.createCanonicalHeaders(headers),
      this.createSignedHeaders(headers),
      payload,
    ].join('\n');
  }

  createCanonicalQueryString(params) {
    return Object.keys(params)
      .sort()
      .map(function (key) {
        return encodeURIComponent(key) + '=' + encodeURIComponent(params[key]);
      })
      .join('&');
  }

  createCanonicalHeaders(headers) {
    return Object.keys(headers)
      .sort()
      .map(function (name) {
        return (
          name.toLowerCase().trim() +
          ':' +
          headers[name].toString().trim() +
          '\n'
        );
      })
      .join('');
  }

  createSignedHeaders(headers) {
    return Object.keys(headers)
      .sort()
      .map(function (name) {
        return name.toLowerCase().trim();
      })
      .join(';');
  }

  createCredentialScope(time, region, service) {
    return [this.toDate(time), region, service, 'aws4_request'].join('/');
  }

  createStringToSign(time, region, service, request) {
    return [
      'AWS4-HMAC-SHA256',
      this.toTime(time),
      this.createCredentialScope(time, region, service),
      this.hash(request, 'hex'),
    ].join('\n');
  }

  createSignature(secret, time, region, service, stringToSign) {
    const h1 = this.hmac('AWS4' + secret, this.toDate(time), undefined); // date-key
    const h2 = this.hmac(h1, region, undefined); // region-key
    const h3 = this.hmac(h2, service, undefined); // service-key
    const h4 = this.hmac(h3, 'aws4_request', undefined); // signing-key
    return this.hmac(h4, stringToSign, 'hex');
  }

  createPresignedURL(method, host, path, service, payload, options) {
    options = options || {};
    options.key = options.key || process.env.AWS_ACCESS_KEY_ID;
    options.secret = options.secret || process.env.AWS_SECRET_ACCESS_KEY;
    options.protocol = options.protocol || 'https';
    options.headers = options.headers || {};
    options.timestamp = options.timestamp || Date.now();
    options.region = options.region || process.env.AWS_REGION || 'us-east-1';
    options.expires = options.expires || 60; // 60 seconds
    options.headers = options.headers || {};

    // host is required
    options.headers.Host = host;

    const query = options.query ? querystring.parse(options.query) : {};
    query['X-Amz-Algorithm'] = 'AWS4-HMAC-SHA256';
    query['X-Amz-Credential'] =
      options.key +
      '/' +
      this.createCredentialScope(options.timestamp, options.region, service);
    query['X-Amz-Date'] = this.toTime(options.timestamp);
    query['X-Amz-Expires'] = options.expires;
    query['X-Amz-SignedHeaders'] = this.createSignedHeaders(options.headers);
    if (options.sessionToken) {
      query['X-Amz-Security-Token'] = options.sessionToken;
    }

    const canonicalRequest = this.createCanonicalRequest(
      method,
      path,
      query,
      options.headers,
      payload,
    );
    const stringToSign = this.createStringToSign(
      options.timestamp,
      options.region,
      service,
      canonicalRequest,
    );
    const signature = this.createSignature(
      options.secret,
      options.timestamp,
      options.region,
      service,
      stringToSign,
    );
    query['X-Amz-Signature'] = signature;

    const final =
      options.protocol +
      '://' +
      host +
      path +
      '?' +
      querystring.stringify(query);

    return final;
  }

  toTime(time) {
    return new Date(time).toISOString().replace(/[:-]|\.\d{3}/g, '');
  }

  toDate(time) {
    return this.toTime(time).substring(0, 8);
  }

  hmac(key, string, encoding) {
    return crypto
      .createHmac('sha256', key)
      .update(string, 'utf8')
      .digest(encoding);
  }

  hash(string, encoding) {
    return crypto.createHash('sha256').update(string, 'utf8').digest(encoding);
  }
}
