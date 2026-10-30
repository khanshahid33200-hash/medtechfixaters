import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import https from 'node:https'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  for (const [k, v] of Object.entries(env)) {
    if (!process.env[k]) process.env[k] = v
  }
  if (!process.env.SUPABASE_URL) {
    process.env.SUPABASE_URL = env.VITE_SUPABASE_URL || 'https://yweywvnivyftwtglxavr.supabase.co'
  }
  if (!process.env.SUPABASE_ANON_KEY) {
    process.env.SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY || env.VITE_SUPABASE_PUBLISHABLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl3ZXl3dm5pdnlmdHd0Z2x4YXZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk3MTEyOTgsImV4cCI6MjEwNTI4NzI5OH0.niHlKWf4zWGQ1sb59ZZ2n2SnZxbLeKfqkSkJnWGIxts'
  }
  const appId = env.CASHFREE_APP_ID || env.VITE_CASHFREE_APP_ID || ''
  const secretKey = env.CASHFREE_SECRET_KEY || env.VITE_CASHFREE_SECRET_KEY || ''
  const isProd = (env.CASHFREE_ENV || env.VITE_CASHFREE_MODE || 'sandbox').toLowerCase().includes('prod')
  const host = isProd ? 'api.cashfree.com' : 'sandbox.cashfree.com'

  // In-memory simulator store for development and testing
  const simulatedOrders = new Map<string, {
    status: 'completed' | 'failed' | 'pending' | 'cancelled';
    order_id: string;
    internal_order_id: string;
    amount: number;
    payment_id?: string;
    error?: string;
    timestamp: string;
  }>()

  const cashfreeDevPlugin = {
    name: 'cashfree-dev-middleware',
    configureServer(server: any) {
      server.middlewares.use(async (req: any, res: any, next: any) => {
        // Shared Express-like helper polyfills for Vite Connect middleware
        if (!res.status) {
          res.status = (code: number) => {
            res.statusCode = code
            return res
          }
        }
        if (!res.json) {
          res.json = (data: any) => {
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify(data))
            return res
          }
        }
        if (!res.send) {
          res.send = (data: any) => {
            res.end(data)
            return res
          }
        }
        if (!req.query && req.url) {
          try {
            const parsed = new URL(req.url, 'http://localhost:5173')
            req.query = Object.fromEntries(parsed.searchParams.entries())
          } catch {}
        }

        // Expose simulated store globally for verify handlers
        ;(globalThis as any).__simulatedOrders = simulatedOrders

        // 1. Create order: POST /api/cashfree/create-order
        if (req.url?.startsWith('/api/cashfree/create-order') && req.method === 'POST') {
          let body = ''
          req.on('data', (chunk: any) => (body += chunk))
          req.on('end', async () => {
            try {
              if (body) {
                try {
                  req.body = JSON.parse(body)
                } catch {
                  req.body = body
                }
              }
              const handler = (await import('./api/cashfree/create-order.js')).default
              return await handler(req, res)
            } catch (err: any) {
              res.status(500).json({ success: false, error: err.message || 'Internal create-order error' })
            }
          })
          return
        }

        // 2. Development Payment Status Simulator: POST /api/cashfree/simulate
        if (req.url?.startsWith('/api/cashfree/simulate') && req.method === 'POST') {
          // Reject simulation in production environments
          if (isProd && process.env.NODE_ENV === 'production') {
            res.setHeader('Content-Type', 'application/json')
            res.statusCode = 403
            res.end(JSON.stringify({ success: false, error: 'Payment simulation is strictly disabled in production.' }))
            return
          }

          let body = ''
          req.on('data', (chunk: any) => (body += chunk))
          req.on('end', () => {
            try {
              const data = JSON.parse(body || '{}')
              const orderId = String(data.order_id || `mtf_sim_${Date.now()}`)
              const internalOrderId = String(data.internal_order_id || orderId)
              const action = data.action || 'simulate_success'
              const amountPaise = data.amount || 50000

              if (action === 'simulate_success') {
                const simRecord = {
                  status: 'completed' as const,
                  order_id: orderId,
                  internal_order_id: internalOrderId,
                  amount: amountPaise,
                  payment_id: `cf_sim_pay_${Date.now()}`,
                  timestamp: new Date().toISOString(),
                }
                simulatedOrders.set(orderId, simRecord)
                simulatedOrders.set(internalOrderId, simRecord)

                res.setHeader('Content-Type', 'application/json')
                res.statusCode = 200
                res.end(
                  JSON.stringify({
                    success: true,
                    verified: true,
                    status: 'completed',
                    payment_id: simRecord.payment_id,
                    order_id: orderId,
                    internal_order_id: internalOrderId,
                    amount_paise: amountPaise,
                    amount_rupees: amountPaise / 100,
                    simulated: true,
                    message: 'Simulated payment SUCCESS confirmed.',
                  })
                )
                return
              }

              if (action === 'simulate_failure') {
                const errorReason = data.error_reason || 'Simulated payment decline: Card test declined by bank.'
                const simRecord = {
                  status: 'failed' as const,
                  order_id: orderId,
                  internal_order_id: internalOrderId,
                  amount: amountPaise,
                  error: errorReason,
                  timestamp: new Date().toISOString(),
                }
                simulatedOrders.set(orderId, simRecord)
                simulatedOrders.set(internalOrderId, simRecord)

                res.setHeader('Content-Type', 'application/json')
                res.statusCode = 200
                res.end(
                  JSON.stringify({
                    success: false,
                    verified: false,
                    status: 'failed',
                    error: errorReason,
                    order_id: orderId,
                    internal_order_id: internalOrderId,
                    simulated: true,
                  })
                )
                return
              }

              if (action === 'simulate_pending') {
                const simRecord = {
                  status: 'pending' as const,
                  order_id: orderId,
                  internal_order_id: internalOrderId,
                  amount: amountPaise,
                  error: 'Payment transaction is pending bank confirmation.',
                  timestamp: new Date().toISOString(),
                }
                simulatedOrders.set(orderId, simRecord)
                simulatedOrders.set(internalOrderId, simRecord)

                res.setHeader('Content-Type', 'application/json')
                res.statusCode = 200
                res.end(
                  JSON.stringify({
                    success: false,
                    verified: false,
                    status: 'pending',
                    error: simRecord.error,
                    order_id: orderId,
                    internal_order_id: internalOrderId,
                    simulated: true,
                  })
                )
                return
              }

              if (action === 'simulate_cancelled') {
                const simRecord = {
                  status: 'cancelled' as const,
                  order_id: orderId,
                  internal_order_id: internalOrderId,
                  amount: amountPaise,
                  error: 'Payment was cancelled by the user.',
                  timestamp: new Date().toISOString(),
                }
                simulatedOrders.set(orderId, simRecord)
                simulatedOrders.set(internalOrderId, simRecord)

                res.setHeader('Content-Type', 'application/json')
                res.statusCode = 200
                res.end(
                  JSON.stringify({
                    success: false,
                    verified: false,
                    status: 'cancelled',
                    error: simRecord.error,
                    order_id: orderId,
                    internal_order_id: internalOrderId,
                    simulated: true,
                  })
                )
                return
              }

              if (action === 'reset_order') {
                simulatedOrders.delete(orderId)
                simulatedOrders.delete(internalOrderId)

                res.setHeader('Content-Type', 'application/json')
                res.statusCode = 200
                res.end(
                  JSON.stringify({
                    success: true,
                    status: 'created',
                    order_id: orderId,
                    internal_order_id: internalOrderId,
                    message: 'Simulated order state reset.',
                  })
                )
                return
              }

              res.setHeader('Content-Type', 'application/json')
              res.statusCode = 400
              res.end(JSON.stringify({ success: false, error: `Unknown simulation action: ${action}` }))
            } catch (err: any) {
              res.setHeader('Content-Type', 'application/json')
              res.statusCode = 400
              res.end(JSON.stringify({ success: false, error: err.message }))
            }
          })
          return
        }

        // 3. Authoritative Order Status & Verification: POST or GET /api/cashfree/verify & /api/cashfree/order-status
        if (
          (req.url?.startsWith('/api/cashfree/verify') || req.url?.startsWith('/api/cashfree/order-status')) &&
          (req.method === 'POST' || req.method === 'GET')
        ) {
          let body = ''
          req.on('data', (chunk: any) => (body += chunk))
          req.on('end', async () => {
            try {
              if (body) {
                try {
                  req.body = JSON.parse(body)
                } catch {
                  req.body = body
                }
              }
              const handler = (await import('./api/cashfree/verify.js')).default
              return await handler(req, res)
            } catch (err: any) {
              res.status(500).json({ success: false, error: err.message || 'Internal verify route error' })
            }
          })
          return
        }

        // 3.4 Public Dynamic Pricing Endpoint: GET /api/pricing
        if (req.url?.startsWith('/api/pricing')) {
          try {
            const handler = (await import('./api/pricing.js')).default
            return handler(req, res)
          } catch (err: any) {
            res.setHeader('Content-Type', 'application/json')
            res.statusCode = 500
            res.end(JSON.stringify({ success: false, error: err.message }))
            return
          }
        }

        // 3.5 Local Dev AI Assistant Proxy: POST /api/ai-assist (bypasses browser CORS on localhost)
        if (req.url?.startsWith('/api/ai-assist') && req.method === 'POST') {
          let body = ''
          req.on('data', (c: any) => (body += c))
          req.on('end', () => {
            const authHeader = req.headers.authorization || req.headers.Authorization || ''
            const supabaseAnon = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl3ZXl3dm5pdnlmdHd0Z2x4YXZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk3MTEyOTgsImV4cCI6MjEwNTI4NzI5OH0.niHlKWf4zWGQ1sb59ZZ2n2SnZxbLeKfqkSkJnWGIxts'
            const postData = body || '{}'

            const edgeReq = https.request(
              {
                hostname: 'yweywvnivyftwtglxavr.supabase.co',
                path: '/functions/v1/ai-assist',
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Content-Length': Buffer.byteLength(postData),
                  'apikey': supabaseAnon,
                  ...(authHeader ? { Authorization: authHeader } : {}),
                },
              },
              (edgeRes) => {
                let respData = ''
                edgeRes.on('data', (chunk) => (respData += chunk))
                edgeRes.on('end', () => {
                  res.setHeader('Content-Type', 'application/json')
                  res.statusCode = edgeRes.statusCode || 200
                  res.end(respData)
                })
              }
            )

            edgeReq.on('error', (err) => {
              try {
                const parsedBody = JSON.parse(postData)
                if (parsedBody.action === 'status') {
                  res.setHeader('Content-Type', 'application/json')
                  res.statusCode = 200
                  res.end(JSON.stringify({
                    success: true,
                    gemini_configured: false,
                    provider: 'gemini',
                    model: 'gemini-1.5-flash',
                    flags: { clinical_ai_enabled: true }
                  }))
                  return
                }
              } catch {}

              res.setHeader('Content-Type', 'application/json')
              res.statusCode = 502
              res.end(JSON.stringify({ success: false, error: 'AI assist connection notice: ' + err.message }))
            })

            edgeReq.write(postData)
            edgeReq.end()
          })
          return
        }

        // 4. Super Admin Management Endpoints: /api/admin/*
        if (req.url?.startsWith('/api/admin/')) {
          // Express-style method polyfill
          if (!res.status) {
            res.status = (code: number) => {
              res.statusCode = code
              return res
            }
          }
          if (!res.json) {
            res.json = (data: any) => {
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify(data))
              return res
            }
          }
          if (!res.send) {
            res.send = (data: any) => {
              res.end(data)
              return res
            }
          }
          if (!req.query && req.url) {
            try {
              const parsed = new URL(req.url, 'http://localhost')
              req.query = Object.fromEntries(parsed.searchParams.entries())
            } catch {}
          }

          const runAdminHandler = async () => {
            try {
              if (req.url?.startsWith('/api/admin/auth-check')) {
                const handler = (await import('./api/admin/auth-check.js')).default
                return await handler(req, res)
              }
              if (req.url?.startsWith('/api/admin/transactions')) {
                const handler = (await import('./api/admin/transactions.js')).default
                return await handler(req, res)
              }
              if (req.url?.startsWith('/api/admin/doctors')) {
                const handler = (await import('./api/admin/doctors.js')).default
                return await handler(req, res)
              }
              if (req.url?.startsWith('/api/admin/audit-logs')) {
                const handler = (await import('./api/admin/audit-logs.js')).default
                return await handler(req, res)
              }
              if (req.url?.startsWith('/api/admin/revenue')) {
                const handler = (await import('./api/admin/revenue.js')).default
                return await handler(req, res)
              }

              res.status(404).json({ success: false, error: 'Admin route not found' })
            } catch (err: any) {
              res.status(500).json({ success: false, error: err.message || 'Internal admin route error' })
            }
          }

          if (req.method === 'GET' || req.method === 'HEAD') {
            runAdminHandler()
            return
          }

          let body = ''
          req.on('data', (c: any) => (body += c))
          req.on('end', async () => {
            if (body) {
              try {
                ;(req as any).body = JSON.parse(body)
              } catch {
                ;(req as any).body = body
              }
            }
            await runAdminHandler()
          })
          return
        }

        next()
      })
    },
  }

  return {
    plugins: [react(), cashfreeDevPlugin],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: Number(process.env.PORT) || 3000,
      host: true,
      proxy: {
        '/api/v1': {
          target: 'http://localhost:8000',
          changeOrigin: true,
        },
      },
    },
    preview: {
      port: 3000,
      host: true,
    },
  }
})

