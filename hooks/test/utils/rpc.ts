import { request } from 'node:http'

export type RpcCall = (method: string, params?: unknown[]) => Promise<unknown>

export function createRpcCall(rpcUrl: string): RpcCall {
  const url = new URL(rpcUrl)
  return (method: string, params: unknown[] = []) =>
    new Promise((resolve, reject) => {
      const body = JSON.stringify({ jsonrpc: '2.0', method, params, id: Date.now() })
      const req = request(
        {
          hostname: url.hostname,
          port: parseInt(url.port),
          path: url.pathname || '/',
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'content-length': Buffer.byteLength(body),
          },
        },
        (res) => {
          let data = ''
          res.on('data', (chunk: string) => { data += chunk })
          res.on('end', () => {
            try {
              const { result, error } = JSON.parse(data)
              if (error) reject(new Error(error.message))
              else resolve(result)
            } catch (e) { reject(e) }
          })
        }
      )
      req.on('error', reject)
      req.write(body)
      req.end()
    })
}

export async function mineBlocks(n: number, rpcCall: RpcCall): Promise<void> {
  try {
    // anvil: mines N blocks in a single call
    await rpcCall('anvil_mine', [`0x${n.toString(16)}`])
  } catch {
    // geth dev: no evm_mine equivalent — each transaction mines one block
    const accounts = (await rpcCall('eth_accounts', [])) as string[]
    for (let i = 0; i < n; i++) {
      await rpcCall('eth_sendTransaction', [{ from: accounts[0], to: accounts[0], value: '0x0' }])
    }
  }
}
