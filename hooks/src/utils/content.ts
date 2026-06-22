export const parseContent = (content: string): string[] => {
  const replyIds: string[] = []
  const regex = /[#@](0x.{64})/gm
  let match
  while ((match = regex.exec(content)) !== null) {
    replyIds.push(match[1])
  }
  return replyIds
}

export const supportedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webm', 'mp4']
