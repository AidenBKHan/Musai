import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { createApp } from '../src/app';

describe('GET /v1/safety-index/:countryCode', () => {
  it('returns the Korea placeholder index', async () => {
    const res = await request(createApp()).get('/v1/safety-index/KR');
    expect(res.status).toBe(200);
    expect(res.body.countryCode).toBe('KR');
    expect(typeof res.body.score).toBe('number');
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

  it('finds a country by name', async () => {
    const res = await request(createApp()).get('/v1/safety-index').query({ q: 'France' });
    expect(res.status).toBe(200);
    expect(res.body[0].countryCode).toBe('FR');
  });
});
