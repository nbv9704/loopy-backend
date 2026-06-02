import express from 'express'
import request from 'supertest'
import { csrfProtection } from '../../middleware/csrf'
import { concurrencyLimiter, resetActiveExecutions } from '../../middleware/concurrencyLimiter'

describe('Security Integration Tests (CORS, CSRF, Concurrency Limit)', () => {
  let app: express.Express
  let activeInHandler = 0

  beforeEach(() => {
    resetActiveExecutions()
    activeInHandler = 0
    app = express()
    app.use(express.json())

    // Mount CSRF protection middleware on mutating routes
    app.post('/test-csrf', csrfProtection, (_req, res) => {
      res.status(200).json({ success: true, message: 'CSRF Passed' })
    })

    // Mount Concurrency Limiter
    app.post('/test-concurrency', concurrencyLimiter, (req, res) => {
      activeInHandler++
      // Delay response to allow concurrent requests to build up
      const delay = parseInt(req.query.delay as string || '0', 10)
      if (delay > 0) {
        setTimeout(() => {
          activeInHandler = Math.max(0, activeInHandler - 1)
          res.status(200).json({ success: true })
        }, delay)
      } else {
        activeInHandler = Math.max(0, activeInHandler - 1)
        res.status(200).json({ success: true })
      }
    })
  })

  afterEach(() => {
    resetActiveExecutions()
  })

  describe('CSRF Protection', () => {
    it('should block mutating requests (POST) without Origin/Referer headers', async () => {
      const response = await request(app)
        .post('/test-csrf')
        .send({ data: 'test' })

      expect(response.status).toBe(403)
      expect(response.body).toEqual({
        success: false,
        message: 'Forbidden: CSRF validation failed'
      })
    })

    it('should allow mutating requests (POST) with whitelisted Origin header', async () => {
      const response = await request(app)
        .post('/test-csrf')
        .set('Origin', 'https://loopy.vercel.app')
        .send({ data: 'test' })

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
    })

    it('should block mutating requests (POST) with unauthorized Origin header', async () => {
      const response = await request(app)
        .post('/test-csrf')
        .set('Origin', 'https://unauthorized-domain.com')
        .send({ data: 'test' })

      expect(response.status).toBe(403)
    })
  })

  describe('Concurrency Limiter', () => {
    it('should allow concurrent requests up to the max threshold (5)', async () => {
      // Send 5 concurrent requests with a delay
      const requests = Array.from({ length: 5 }, () =>
        request(app).post('/test-concurrency?delay=50')
      )

      const results = await Promise.all(requests)
      for (const res of results) {
        expect(res.status).toBe(200)
      }
    })

    it('should reject requests exceeding concurrency cap of 5 with 429', async () => {
      // Send 5 concurrent requests that stay active. Force evaluation via .then()
      const activeRequests = Array.from({ length: 5 }, () => {
        const req = request(app).post('/test-concurrency?delay=200')
        req.then(() => {}).catch(() => {})
        return req
      })

      // Poll until all 5 requests have entered the handler
      for (let i = 0; i < 50; i++) {
        if (activeInHandler === 5) break
        await new Promise((resolve) => setTimeout(resolve, 10))
      }

      expect(activeInHandler).toBe(5)

      // The 6th request should immediately be rejected with 429
      const overflowRequest = await request(app).post('/test-concurrency')
      expect(overflowRequest.status).toBe(429)
      expect(overflowRequest.body.error.code).toBe('TOO_MANY_CONCURRENT_REQUESTS')

      // Clean up outstanding delayed requests
      await Promise.all(activeRequests)
    })
  })
})
