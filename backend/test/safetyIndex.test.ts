import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { createApp } from '../src/app';

describe('GET /v1/safety-index/:countryCode', () => {
  it('returns the Paris (MOFA MVP) worked example matching the proposal: 72점 / 유의 필요', async () => {
    const res = await request(createApp()).get('/v1/safety-index/FR');
    expect(res.status).toBe(200);
    expect(res.body.countryCode).toBe('FR');
    expect(res.body.regionName).toBe('파리');
    expect(res.body.score).toBe(72);
    expect(res.body.status).toBe('caution');
    expect(res.body.statusLabel).toBe('유의 필요');
    expect(typeof res.body.safeHowTip).toBe('string');
  });

  it('returns the placeholder global source for a non-MVP country', async () => {
    const res = await request(createApp()).get('/v1/safety-index/US');
    expect(res.status).toBe(200);
    expect(res.body.countryCode).toBe('US');
  });

  it('404s for an unknown country', async () => {
    const res = await request(createApp()).get('/v1/safety-index/ZZ');
    expect(res.status).toBe(404);
  });
});

describe('GET /v1/safety-index?q=', () => {
  it('requires a query parameter', async () => {
    const res = await request(createApp()).get('/v1/safety-index');
    expect(res.status).toBe(400);
  });

  it('finds a destination by city name', async () => {
    const res = await request(createApp()).get('/v1/safety-index').query({ q: 'Osaka' });
    expect(res.status).toBe(200);
    expect(res.body[0].countryCode).toBe('JP');
    expect(res.body[0].regionName).toBe('오사카');
  });
});
