/** Fallback RPC URLs for each chain to improve RPC resilience. */
export const RPC = {
  1: [
    'https://ethereum-rpc.publicnode.com',
    'https://eth.drpc.org',
    'https://eth-pokt.nodies.app',
    'https://eth.blockrazor.xyz',
  ],
  10: ['https://mainnet.optimism.io'],
  50: ['https://rpc1.xinfin.network', 'https://rpc.xdcrpc.com'],
  56: ['https://56.rpc.thirdweb.com'],
  100: ['https://rpc.gnosischain.com'],
  137: ['https://polygon.drpc.org'],
  146: ['https://rpc.soniclabs.com'],
  196: ['https://rpc.xlayer.tech'],
  239: ['https://turin.rpc.tac.build'],
  250: ['https://250.rpc.thirdweb.com'],
  252: ['https://rpc.frax.com'],
  324: ['https://zksync.drpc.org', 'https://mainnet.era.zksync.io'],
  999: ['https://rpc.hyperliquid.xyz/evm', 'https://rpc.hypurrscan.io'],
  1284: ['https://moonbeam.public.blastapi.io'],
  2222: ['https://evm.kava.io'],
  4663: ['https://rpc.mainnet.chain.robinhood.com'],
  5000: ['https://rpc.mantle.xyz'],
  6342: ['https://carrot.megaeth.com/rpc'],
  8091: ['https://stratareth3666f0713.devnet-annapurna.stratabtc.org'],
  8453: ['https://mainnet.base.org'],
  18880: ['https://rpc0-testnet.expchain.ai'],
  42161: ['https://arb1.arbitrum.io/rpc', 'https://1rpc.io/arb'],
  42220: ['https://forno.celo.org'],
  43114: ['https://api.avax.network/ext/bc/C/rpc'],
  57073: ['https://rpc-gel.inkonchain.com', 'https://ink.drpc.org'],
  98866: ['https://rpc.plume.org'],
  167000: ['https://rpc.ankr.com/taiko', 'https://taiko.drpc.org'],
  21000000: ['https://maizenet-rpc.usecorn.com', 'https://mainnet.corn-rpc.com'],
  1313161554: ['https://mainnet.aurora.dev'],
} as const

export type RpcChainId = keyof typeof RPC

export const isRpcChainId = (chainId: number): chainId is RpcChainId => chainId in RPC
