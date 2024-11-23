import reactStringReplace from 'react-string-replace';

export const boardsMap = {
  'pol': 0,
  'biz': 1,
  'g': 2,
  'sci': 3,
  'x': 4,
  'maid': 5
}

export const boardsReverseMap = {
  0: 'pol',
  1: 'biz',
  2: 'g',
  3: 'sci',
  4: 'x',
  5: 'maid'
}

// Captures 0x + 4 characters, then the last 4 characters.
const truncateRegex = /^(0x[a-zA-Z0-9]{7})[a-zA-Z0-9]+([a-zA-Z0-9]{7})$/;

/**
 * Truncates an ethereum address to the format 0x0000…0000
 * @param address Full address to truncate
 * @returns Truncated address
 */
export const truncateEthAddress = (address: string) => {
  const match = address.match(truncateRegex);
  if (!match) return address;
  return `${match[1]}…${match[2]}`;
};


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
