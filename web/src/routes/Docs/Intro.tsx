import type { ReactNode } from 'react'

import Robot from '@/assets/emoji/robot.png'
import Archive from '@/assets/emoji/archive.png'
import Blockchain from '@/assets/emoji/blockchain.png'
import Scale from '@/assets/emoji/scale.png'
import Serverless from '@/assets/emoji/serverless-generic.png'
import FlyingMoney from '@/assets/emoji/flying-money.png'

const Note = ({ children }: { children: ReactNode }) => (
  <div style={{
    borderLeft: '2px solid #20C20E',
    padding: `${Math.PHI}vh ${Math.PHI}vw`,
    marginTop: `${1/Math.PHI}vh`,
  }}>
    <span style={{ color: '#20C20E', fontWeight: 'bold', fontSize: `${1/Math.PHI + 1/Math.PHI**3}em` }}>// note</span>
    <div style={{ marginTop: `${1 / Math.PHI}vh` }}>{children}</div>
  </div>
)

const Section = ({ icon, title, children }: { icon: string; title: string; children: ReactNode }) => (
  <div style={{
    marginTop: `${100 / Math.PHI ** 8}vh`,
    width: '100%',
  }}>
    <h4 style={{ display: 'flex', alignItems: 'center', gap: `${Math.PHI}vw`, marginTop: 0, marginBottom: `${Math.PHI}vh` }}>
      <img src={icon} className="emoji" style={{ height: '2.618em' }} />
      {title}
    </h4>
    {children}
  </div>
)

export const Intro = () => {
  return (
    <div
      className="flex-wrap-center"
      style={{
        margin: '0 auto',
        width: `${(100 / Math.PHI) + (100 / Math.PHI ** 3)}vw`,
        flexDirection: 'column',
        alignItems: 'flex-start',
      }}
    >
      <h3>About Hashchan</h3>
      <p style={{ opacity: 0.618 }}>
        A decentralized imageboard built for the age of the AI botnet swarm.
      </p>

      <Section icon={Robot} title="The Problem">
        <p>
          Open forums are being overwhelmed by AI botnet swarms. With no accounts or KYC required,
          bots flood at scale, drowning the signal to noise ratio behind shilling, spamming, and sliding.
          Captchas and rate limits only raise the cost for real users while barely
          slowing determined adversaries.
        </p>
        <Note>
          Peer-to-peer alternatives have been thwarted by weaponizing IP reputation, illegal content,
          and spam to impose legal and economic liability on anyone hosting part of the network.
        </Note>
      </Section>

      <Section icon={Archive} title="Why Traditional Imageboards Fall Short">
        <p>
          Standard imageboards rely on a centralized server with a DNS record, a rickety one at that do its inability to collect advertizer revenues given its proximity to unsavoury content.
          As there is no user object, attempts to bandaid the flood result frequently in being wrongly ban hammered by a public ip, users lose their practical anonymity by cloudflare ssl termination and residential ip detection solutions and annoying flavour of the month 15 min wait clocks, long form iq test captchas, and give an email to skip the check. 
          Additionally blackbox central servers are security blackholes and one can surmize the large moral hazard of operating a freespeech platform in the current year, the thought of imageboards in reality being akin to 1984's red book is daunting and avoidable in the new paradigm.
        </p>
      </Section>

      <Section icon={Blockchain} title="Hashchan's Approach">
        <p>
          Hashchan uses Ethereum event logs as its database: cryptographically secured, persistent,
          and replicated across the network. Images are hotlinked rather than hosted, offloading
          content liability to the original provider, or to those who choose to manually opt in to repinning another users ipfs node.
        </p>
        <Note>
          Because there is no central database to prune, the moral hazard for moderation teams is
          tempered. Users are no longer bound to the team the imageboard creator chooses — they can
          pick one that suits them, or opt out entirely.
        </Note>
      </Section>

      <Section icon={Serverless} title="No Server, No Single Point of Failure">
        <p>
          Users can run the web interface from their own local machine, bypassing DNS records and
          DDOS protection requirements entirely. No special proxy permissions, no Cloudflare
          dependency — the frontend is just a static app pointed at the chain.
        </p>
      </Section>

      <Section icon={Scale} title="Decentralized Moderation">
        <p>
          With no central server, no single team controls what gets filtered. Users can freely choose
          between moderation services — or browse unfiltered. Moderation becomes a market rather than
          a dictate.
        </p>
      </Section>

      <Section icon={FlyingMoney} title="Economic Spam Resistance">
        <p>
          Pay-per-post means bots cost real money to operate. Hashchan has no token and takes no cut —
          all fees go directly to the network as gas. As botnet activity increases, gas prices rise
          proportionally, making spam progressively more expensive while rewarding anyone holding crypto in their wallet. A nice added side affect, is that if one chooses to stake to secure the network, profiting off tx fees, they will see themselves recoup some of their post costs as rewards.  One could say this makes it the most globally efficient invest-to-post model.
        </p>
        <Note>
          Spammers post far more than regular users. In a gas-driven model, the cost of running a
          botnet scales with the network — a natural, protocol-level deterrent with no captcha required.
        </Note>
      </Section>
    </div>
  )
}
