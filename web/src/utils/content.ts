import reactStringReplace from 'react-string-replace';

export const parseContent = (content: string)  => {
  const replyIds: string[] = []

  reactStringReplace(
    content,
    /[#@](0x.{64})/gm,
    (match, i) => {
      match = match.replace(/[#@]+/g,'')
      replyIds.push(match)
    })
    return replyIds
}

export const supportedExtensions = [
  'jpg',
  'jpeg',
  'png',
  'gif',
  'webm',
  'mp4',
]
