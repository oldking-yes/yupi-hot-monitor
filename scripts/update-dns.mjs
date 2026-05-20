// DNS 更新脚本 — 读取凭据从环境变量
// 使用方式: ALIYUN_AK_ID=xxx ALIYUN_AK_SECRET=xxx node scripts/update-dns.mjs

import crypto from 'crypto';

const ACCESS_KEY_ID = process.env.ALIYUN_AK_ID;
const ACCESS_KEY_SECRET = process.env.ALIYUN_AK_SECRET;
const DOMAIN = 'refineyourself.asia';

if (!ACCESS_KEY_ID || !ACCESS_KEY_SECRET) {
  console.error('请设置环境变量: ALIYUN_AK_ID 和 ALIYUN_AK_SECRET');
  process.exit(1);
}

function encode(str) {
  return encodeURIComponent(str)
    .replace(/!/g, '%21').replace(/'/g, '%27')
    .replace(/\(/g, '%28').replace(/\)/g, '%29')
    .replace(/\*/g, '%2A').replace(/%7E/g, '~');
}

async function aliyunDns(params) {
  const sortedKeys = Object.keys(params).sort();
  const canonicalizedQueryString = sortedKeys
    .map(k => encode(k) + '=' + encode(params[k]))
    .join('&');
  const stringToSign = 'GET&' + encode('/') + '&' + encode(canonicalizedQueryString);
  const signature = crypto.createHmac('sha1', ACCESS_KEY_SECRET + '&')
    .update(stringToSign).digest('base64');
  const url = 'https://alidns.aliyuncs.com/?' + canonicalizedQueryString + '&Signature=' + encode(signature);
  const resp = await fetch(url);
  return await resp.json();
}

function makeParams(action, extra = {}) {
  return {
    Format: 'JSON',
    Version: '2015-01-09',
    AccessKeyId: ACCESS_KEY_ID,
    SignatureMethod: 'HMAC-SHA1',
    SignatureVersion: '1.0',
    Action: action,
    Timestamp: new Date().toISOString().replace(/\.\d{3}/, ''),
    SignatureNonce: crypto.randomUUID().replace(/-/g, ''),
    ...extra,
  };
}

async function addOrUpdateRecord(subdomain, type, value) {
  const desc = await aliyunDns(makeParams('DescribeDomainRecords', {
    DomainName: DOMAIN,
    RRKeyWord: subdomain,
  }));
  const records = desc?.DomainRecords?.Record;
  const existing = records?.find(r => r.RR === subdomain);
  if (existing) {
    if (existing.Value === value && existing.Type === type) {
      console.log(`  ✓ ${subdomain}.${DOMAIN} 已指向 ${value}`);
      return;
    }
    console.log(`  → 更新 ${subdomain}.${DOMAIN}: ${existing.Value} → ${value}`);
    await aliyunDns(makeParams('UpdateDomainRecord', {
      RecordId: existing.RecordId,
      RR: subdomain, Type: type, Value: value, TTL: '600',
    }));
  } else {
    console.log(`  → 新增 ${subdomain}.${DOMAIN} → ${value}`);
    await aliyunDns(makeParams('AddDomainRecord', {
      DomainName: DOMAIN, RR: subdomain, Type: type, Value: value, TTL: '600',
    }));
  }
}

async function main() {
  console.log('=== 配置 DNS 记录 ===\n');
  console.log('1. 前端');
  await addOrUpdateRecord('hotspot', 'A', '76.76.21.21');
  console.log('\n2. 后端');
  await addOrUpdateRecord('hotspot-api', 'CNAME', 'yupi-hot-monitor-2.zeabur.app');
  console.log('\n=== 完成 ===');
  console.log('  前端: https://hotspot.refineyourself.asia');
  console.log('  后端: https://hotspot-api.refineyourself.asia');
}

main().catch(console.error);
