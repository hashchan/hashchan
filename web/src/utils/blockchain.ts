export const tryRecurseBlockFilter = async (
  publicClient,
  filterArgs,
  i = 0,
  maxRetry = 3
) => {
    try {
        return {
          filter: await publicClient.createContractEventFilter(filterArgs),
          isReduced: i > 0 ? true : false
        }
    } catch (e) {
        console.log('filter creation failed: ', e)
        
        if (i >= maxRetry) {
            throw new Error(`Max retries (${maxRetry}) exceeded`)
        }

        const newFilterArgs = {
            address: filterArgs.address,
            abi: filterArgs.abi,
            eventName: filterArgs.eventName,
            args: filterArgs.args,
            fromBlock: filterArgs.toBlock - (99990n / BigInt(i + 1)),
            toBlock: filterArgs.toBlock
        }
        
        await new Promise(resolve => setTimeout(resolve, 400))
        return await tryRecurseBlockFilter(publicClient, newFilterArgs, i + 1, maxRetry)
    }
}
