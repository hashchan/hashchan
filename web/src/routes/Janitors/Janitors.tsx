
import { CreateModerationService } from '@/components/CreateModerationService'
import { useModerationServices } from '@/hooks/ModerationService/useModerationServices'
export const Janitors = () => {
  const { moderationServices } = useModerationServices()
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
        {moderationServices.map((moderationService) => (
          <div
            key={moderationService.name}
            style={{
              padding: '1rem 0',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
            }}
          > 
            <h3>{moderationService.name}</h3>
            <p>{moderationService.description}</p>
          </div>
        ))}
      </div>
    </>
  )
}
