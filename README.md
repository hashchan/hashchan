# [Hashchan](https://hashchan.network) 

![animated-banner-2](https://github.com/user-attachments/assets/dd55130f-1710-475e-96a6-b6fc9d4c07c4)


(Beta)
An imageboard inside ethereum event logs

## Why Hashchan
- Cryptographic provenance of threads
- No central servers (run your own client locally)
- Uncensorable
- Expensive to Botswarm (Botswarms that try will pad your bags)
- No profits or hidden fees (just gas)
- Adfree

## Deployments
### Hashchan
|Chain| Address |
| --- | ---- |
| Optimism | [0xa160440daad769893b6938cdb1839ed5d34d8945](https://optimistic.etherscan.io/address/0xa160440daad769893b6938cdb1839ed5d34d8945)
| Base | [0xd696047b3e92d9188bff402253bb1a99eceb3de1](https://basescan.org/address/0xd696047b3e92d9188bff402253bb1a99eceb3de1)
| Testnet| --- |
| Sepolia | [0x458c27D5a6421AfAFF435e27E870584Fe03a938F](https://sepolia.etherscan.io/address/0x458c27d5a6421afaff435e27e870584fe03a938f)

## Moderation Service Factory
|Chain| Address |
| --- | ---- |
| Optimism | [0x13666b1520e31776e0087ef2223e319bb841cd1c](https://optimistic.etherscan.io/address/0x13666b1520e31776e0087ef2223e319bb841cd1c)
| Base | [0xC525AF851Fa283190d6e13d0f164c06Ab51C266A](https://basescan.org/address/0xc525af851fa283190d6e13d0f164c06ab51c266a)
| Testnet| --- |
| Sepolia | [0x147211461D47C8A4f5712cba079C521cacEDB16B](https://sepolia.etherscan.io/address/0x147211461d47c8a4f5712cba079c521cacedb16b)


## Moderation Services
|Chain| Address |
| --- | ---- |
| Optimism | [0x18866C1DfFbEFCDb63eaFad6842A34692e3165Ff](https://optimistic.etherscan.io/address/0x18866C1DfFbEFCDb63eaFad6842A34692e3165Ff)
| Base | [0x838D3e6752f156C658ABA2F55Cb084bB684f5067](https://basescan.org/address/0x838D3e6752f156C658ABA2F55Cb084bB684f5067)
| Testnet| --- |
| Sepolia | [0x8456B34cd626E2F1c6761fe408d82189b991E88e](https://sepolia.etherscan.io/address/0x8456B34cd626E2F1c6761fe408d82189b991E88e)


## Running Locally
while the website is served at hashchan.org , the site is designed to run locally on your machine.  This makes it dns record (minus ones rpc connection) and cloud serverfree.  Afterally they are security black holes.  to run locally.
1. install an http-server, I like, https://github.com/nvm-sh/nvm,  https://www.npmjs.com/package/http-server.
2. extract the zip file from the releases tag.
3. run `http-server` while in the dist directory.

Alternatively one can just clone this repo, npm install and npm run dev.

## Creating your own moderation service
The owner of a moderation service is responsible for signing off on janitorial decision and putting them into the database

to start the server
```
cd orbit-server
cp .env.example .env  # fillout with pk of who owns the moderation service
npm install
npm run dev # or  pm2 start 'server.js'
# you can expose the server to the internet with nginx
# A moderation service can be deployed through the web interface at /janitors create moderation service button
```
![Moderation-Service drawio (1)](https://github.com/user-attachments/assets/9fccb724-af12-46c1-8b7c-6978890d32c5)



## Deployments (hashchan v0.2)
|Chain| Address |
| --- | ---- |
| Classic | [0xca0296EFC305ba8f2A3035e2846d389A8617c4cf](https://etc.blockscout.com/address/0xca0296EFC305ba8f2A3035e2846d389A8617c4cf)
| Mainnet | [0xC525AF851Fa283190d6e13d0f164c06Ab51C266A](https://etherscan.io/address/0xC525AF851Fa283190d6e13d0f164c06Ab51C266A)
| Optimism | [0x77a510184D399C75a91FE9D522aB9e60C2bD08ef](https://optimistic.etherscan.io/address/0x77a510184D399C75a91FE9D522aB9e60C2bD08ef)
| Fantom | [0xca0296EFC305ba8f2A3035e2846d389A8617c4cf](https://ftmscan.com/address/0xca0296EFC305ba8f2A3035e2846d389A8617c4cf)
| Base | [0x51edDE7B206F30eD3e4AaD8914fA585011f628Ef](https://basescan.org/address/0x51edDE7B206F30eD3e4AaD8914fA585011f628Ef)
| Arbitrum One | [0xca0296EFC305ba8f2A3035e2846d389A8617c4cf](https://arbiscan.io/address/0xca0296EFC305ba8f2A3035e2846d389A8617c4cf)
| Arbitrum Nova | [0x77a510184D399C75a91FE9D522aB9e60C2bD08ef](https://nova.arbiscan.io/address/0x77a510184D399C75a91FE9D522aB9e60C2bD08ef)
|  Flow EVM | [0x49b98EAB13247E786BEd0bb5780728db8d24b5e0](https://evm.flowscan.io/address/0x49b98EAB13247E786BEd0bb5780728db8d24b5e0)
| Avalanche | [0x7cE23ee9023A138193C33F060A0060E918246E59](https://subnets.avax.network/c-chain/address/0x7cE23ee9023A138193C33F060A0060E918246E59)
| Polygon | [0x7cE23ee9023A138193C33F060A0060E918246E59](https://polygonscan.com/address/0x7cE23ee9023A138193C33F060A0060E918246E59)
| Testchains | Address |
| Sepolia | [0xEEe8276AEA42f61399Abe7235c015a6cAb1372AC](https://sepolia.etherscan.io/address/0xEEe8276AEA42f61399Abe7235c015a6cAb1372AC)

### Old Deployments (hashchan v0.1)
|Chain| Address |
| --- | ---- |
| Classic | [0x7cE23ee9023A138193C33F060A0060E918246E59](https://etc.blockscout.com/address/0x7cE23ee9023A138193C33F060A0060E918246E59)
| Mainnet | [0x7cE23ee9023A138193C33F060A0060E918246E59](https://etherscan.io/address/0x7cE23ee9023A138193C33F060A0060E918246E59)
| Optimism | [0x7cE23ee9023A138193C33F060A0060E918246E59](https://optimistic.etherscan.io/address/0x7cE23ee9023A138193C33F060A0060E918246E59)
| Fantom | [0x7cE23ee9023A138193C33F060A0060E918246E59](https://ftmscan.com/address/0x7cE23ee9023A138193C33F060A0060E918246E59)
| Base | [0x848F3ceF2F761Faa11b8B179c4b02a186c1D2B2c](https://basescan.org/address/0x848F3ceF2F761Faa11b8B179c4b02a186c1D2B2c)
| Arbitrum One | [0x7cE23ee9023A138193C33F060A0060E918246E59](https://arbiscan.io/address/0x7cE23ee9023A138193C33F060A0060E918246E59)
| Arbitrum Nova | [0x7cE23ee9023A138193C33F060A0060E918246E59](https://nova.arbiscan.io/address/0x7cE23ee9023A138193C33F060A0060E918246E59)
|  Flow EVM | [0x7cE23ee9023A138193C33F060A0060E918246E59](https://evm.flowscan.io/address/0x7cE23ee9023A138193C33F060A0060E918246E59)
| Testchains | Address |
| Sepolia | [0x7cE23ee9023A138193C33F060A0060E918246E59](https://sepolia.etherscan.io/address/0x7cE23ee9023A138193C33F060A0060E918246E59)
| Optimism-Sepolia | [0x7cE23ee9023A138193C33F060A0060E918246E59](https://optimism-sepolia.blockscout.com/address/0x7cE23ee9023A138193C33F060A0060E918246E59)
| Base-Sepolia | [0x0f379a480aC2AC95A5EF8a54094C3d3021332B73](https://sepolia.basescan.org/address/0x0f379a480aC2AC95A5EF8a54094C3d3021332B73)
| Arbitrum Sepolia | [0x75Accb3c871167F66226F97092A717b2253010c9](https://sepolia.arbiscan.io/address/0x75Accb3c871167F66226F97092A717b2253010c9)
| Flow EVM Testnet | [0x7cE23ee9023A138193C33F060A0060E918246E59](https://evm-testnet.flowscan.io/address/0x7cE23ee9023A138193C33F060A0060E918246E59)


![4chan-banner-emojis](https://github.com/user-attachments/assets/0a553cb5-0382-49e9-9f14-a2fc27e42a23)
