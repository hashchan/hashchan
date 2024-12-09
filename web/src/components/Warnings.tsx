import { BraveWarning } from '@/components/BraveWarning'
import { ChromeWarning } from '@/components/ChromeWarning'
import { useCheckBrave } from '@/hooks/useCheckBrave'
import { useCheckRpc } from '@/hooks/useCheckRpc'
export const Warnings = () => {
  const { isBrave } = useCheckBrave()
  const { hasNewFilter } = useCheckRpc()
  return (<>
      {(isBrave && !hasNewFilter) && <BraveWarning />}
      {(!isBrave && !hasNewFilter) && <ChromeWarning />}
    </>
  )
}

