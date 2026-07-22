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
    // geth dev (--dev.period=1): no evm_mine equivalent, and the periodic
    // miner bundles whatever's pending into one block every ~1s — firing all
    // N dummy txs rapid-fire can land several of them in the same block
    // instead of producing N separate ones. Wait for the block number to
    // actually advance after each send so every tx gets its own block.
    const accounts = (await rpcCall('eth_accounts', [])) as string[]
    for (let i = 0; i < n; i++) {
      const before = parseInt(await rpcCall('eth_blockNumber', []) as string, 16)
      await rpcCall('eth_sendTransaction', [{ from: accounts[0], to: accounts[0], value: '0x0' }])
      const deadline = Date.now() + 5_000
      while (Date.now() < deadline) {
        const current = parseInt(await rpcCall('eth_blockNumber', []) as string, 16)
        if (current > before) break
        await new Promise((r) => setTimeout(r, 150))
      }
    }
  }
}
