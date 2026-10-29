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
        // 1. Create order: POST /api/cashfree/create-order
        if (req.url?.startsWith('/api/cashfree/create-order') && req.method === 'POST') {
          let body = ''
          req.on('data', (chunk: any) => (body += chunk))
          req.on('end', () => {
            try {
              const data = JSON.parse(body || '{}')
              const orderAmount = data.plan_id === 'doctor_monthly_5000' ? 5000 : 500
              const cfOrderId = `mtf_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`
              const internalOrderId = data.internal_order_id || `MTF-${Date.now().toString().slice(-8)}`
              const origin = req.headers.origin || (isProd ? 'https://www.medtechfixaters.in' : 'http://localhost:5173')

              const returnUrl = `${origin}/onboarding/payment/pending?order_id={order_id}&internal_order_id=${encodeURIComponent(internalOrderId)}`

              const payload = JSON.stringify({
                order_id: cfOrderId,
                order_amount: orderAmount,
                order_currency: 'INR',
                customer_details: {
                  customer_id: data.customer_id || `cust_${Date.now()}`,
                  customer_name: data.customer_name || 'Healthcare Practitioner',
                  customer_email: data.customer_email || 'doctor@medtechfixaters.in',
                  customer_phone: String(data.customer_phone || data.phone || '9999999999').replace(/[^0-9]/g, '').slice(-10) || '9999999999',
                },
                order_meta: {
                  return_url: returnUrl,
                },
                order_note: data.order_note || (orderAmount === 500 ? 'Solo Doctor & Clinic — Platform Activation' : 'Doctor & Clinic — Monthly Subscription'),
              })

              const cfReq = https.request(
                {
                  hostname: host,
                  path: '/pg/orders',
                  method: 'POST',
                  headers: {
                    'x-client-id': appId,
                    'x-client-secret': secretKey,
                    'x-api-version': '2023-08-01',
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(payload),
                  },
                },
                (cfRes: any) => {
                  let cfBody = ''
                  cfRes.on('data', (c: any) => (cfBody += c))
                  cfRes.on('end', () => {
                    res.setHeader('Content-Type', 'application/json')
                    res.statusCode = cfRes.statusCode || 200
                    try {
                      const parsed = JSON.parse(cfBody)
                      res.end(
                        JSON.stringify({
                          success: cfRes.statusCode === 200,
                          gateway: 'cashfree',
                          environment: isProd ? 'PROD' : 'TEST',
                          payment_session_id: parsed.payment_session_id,
                          order_id: parsed.order_id,
                          cf_order_id: parsed.cf_order_id,
                          internal_order_id: internalOrderId,
                          amount: orderAmount * 100,
                          amount_rupees: orderAmount,
                          currency: 'INR',
                          error: parsed.message || parsed.error,
                        })
                      )
                    } catch {
                      res.end(cfBody)
                    }
                  })
                }
              )

              cfReq.on('error', (err: any) => {
                res.setHeader('Content-Type', 'application/json')
                res.statusCode = 500
                res.end(JSON.stringify({ success: false, error: err.message }))
              })

              cfReq.write(payload)
              cfReq.end()
            } catch (err: any) {
              res.setHeader('Content-Type', 'application/json')
              res.statusCode = 400
              res.end(JSON.stringify({ success: false, error: err.message }))
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
          req.on('end', () => {
            try {
              const url = new URL(req.url, 'http://localhost:5173')
              const parsedBody = body ? JSON.parse(body) : {}
              const orderId = String(parsedBody.order_id || url.searchParams.get('order_id') || '')
              const internalOrderId = String(parsedBody.internal_order_id || url.searchParams.get('internal_order_id') || orderId)

              if (!orderId && !internalOrderId) {
                res.setHeader('Content-Type', 'application/json')
                res.statusCode = 400
                res.end(JSON.stringify({ success: false, error: 'Missing order_id' }))
                return
              }

              // Check if order has a simulated state
              const sim = simulatedOrders.get(orderId) || simulatedOrders.get(internalOrderId)
              if (sim) {
                res.setHeader('Content-Type', 'application/json')
                res.statusCode = 200
                if (sim.status === 'completed') {
                  res.end(
                    JSON.stringify({
                      success: true,
                      verified: true,
                      status: 'completed',
                      payment_id: sim.payment_id,
                      order_id: sim.order_id,
                      internal_order_id: sim.internal_order_id,
                      amount_paise: sim.amount,
                      simulated: true,
                    })
                  )
                } else if (sim.status === 'failed') {
                  res.end(
                    JSON.stringify({
                      success: false,
                      verified: false,
                      status: 'failed',
                      error: sim.error || 'Simulated payment failure.',
                      order_id: sim.order_id,
                      simulated: true,
                    })
                  )
                } else if (sim.status === 'cancelled') {
                  res.end(
                    JSON.stringify({
                      success: false,
                      verified: false,
                      status: 'cancelled',
                      error: sim.error || 'Payment was cancelled.',
                      order_id: sim.order_id,
                      simulated: true,
                    })
                  )
                } else {
                  res.end(
                    JSON.stringify({
                      success: false,
                      verified: false,
                      status: 'pending',
                      error: 'Payment transaction is pending.',
                      order_id: sim.order_id,
                      simulated: true,
                    })
                  )
                }
                return
              }

              // Query Cashfree API directly for authoritative order and payments
              const cfReq = https.request(
                {
                  hostname: host,
                  path: `/pg/orders/${orderId}/payments`,
                  method: 'GET',
                  headers: {
                    'x-client-id': appId,
                    'x-client-secret': secretKey,
                    'x-api-version': '2023-08-01',
                    'Content-Type': 'application/json',
                  },
                },
                (cfRes: any) => {
                  let cfBody = ''
                  cfRes.on('data', (c: any) => (cfBody += c))
                  cfRes.on('end', () => {
                    res.setHeader('Content-Type', 'application/json')
                    res.statusCode = cfRes.statusCode || 200
                    try {
                      const payments = JSON.parse(cfBody)
                      const successfulPayment = Array.isArray(payments)
                        ? payments.find((p: any) => p.payment_status === 'SUCCESS')
                        : null
                      const failedPayment = Array.isArray(payments)
                        ? payments.find((p: any) => p.payment_status === 'FAILED')
                        : null
                      const cancelledPayment = Array.isArray(payments)
                        ? payments.find((p: any) => p.payment_status === 'USER_DROPPED' || p.payment_status === 'CANCELLED')
                        : null

                      if (successfulPayment) {
                        res.end(
                          JSON.stringify({
                            success: true,
                            verified: true,
                            status: 'completed',
                            payment_id: successfulPayment.cf_payment_id || successfulPayment.payment_id,
                            order_id: orderId,
                            internal_order_id: internalOrderId,
                            payments: Array.isArray(payments) ? payments : [],
                          })
                        )
                      } else if (failedPayment) {
                        res.end(
                          JSON.stringify({
                            success: false,
                            verified: false,
                            status: 'failed',
                            error: failedPayment.payment_message || 'Payment was declined by bank or card issuer.',
                            order_id: orderId,
                            payments: Array.isArray(payments) ? payments : [],
                          })
                        )
                      } else if (cancelledPayment) {
                        res.end(
                          JSON.stringify({
                            success: false,
                            verified: false,
                            status: 'cancelled',
                            error: 'Payment was cancelled in checkout.',
                            order_id: orderId,
                            payments: Array.isArray(payments) ? payments : [],
                          })
                        )
                      } else {
                        res.end(
                          JSON.stringify({
                            success: false,
                            verified: false,
                            status: 'pending',
                            payment_id: null,
                            payments: Array.isArray(payments) ? payments : [],
                          })
                        )
                      }
                    } catch {
                      res.end(cfBody)
                    }
                  })
                }
              )

              cfReq.on('error', (err: any) => {
                res.setHeader('Content-Type', 'application/json')
                res.statusCode = 500
                res.end(JSON.stringify({ success: false, error: err.message }))
              })

              cfReq.end()
            } catch (err: any) {
              res.setHeader('Content-Type', 'application/json')
              res.statusCode = 400
              res.end(JSON.stringify({ success: false, error: err.message }))
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

