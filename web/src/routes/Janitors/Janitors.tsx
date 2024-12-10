
import { CreateModerationService } from '@/components/CreateModerationService'
export const Janitors = () => {
  return (
    <>
      <div
        className="flex-wrap-center"
        style={{
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <h2>Janitors Portal</h2>
        <CreateModerationService />
      </div>
    </>
  )
}
