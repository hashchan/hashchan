import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

export const Intro = () => {
  return (
    <div
      className="flex-wrap-center"
      style={{
        margin: '0 auto',
        width: '61.8vw',
      }}
    >
      <h3>About Hashchan</h3>
      <p>While designed to provide a similar look and feel to the imageboard design, Hashchan is very different in its implementation.  In normal imageboards a group of individuals is responible for serving the content, and thus its moderation in order to be compliant with laws regarding the hosting of illegal content.  They have a website, a dns record, and a server running somewhere, with 3rd party services trying their best to archive it.</p><br/>
      <p>It has proven often prohibitivly expensive to prune illegal content from such boards. and those that have the means are often introduced to a new set of problems, mainly moderations that have ulterior agendas and abuse such powers to meet their own ends.</p><br/>
      <p>Hashchan aims to solve these problems, by utilizing ethereum event logs to store threads, and by hotlinking images.  By using ethereum event logs we get a cryptographically secured, persistent, and replicated database, while hotlinking offloads the illegal content hosting to a 3rd party, or if a user chooses, to host it themselves through IPFS pinning/pinning services.</p><br/>
      <p>Since there is no more natsec in regards to the database, it lends well to poisonous moderation teams, as now users are no longer stuck to the team the imageboard creators create.  If they desire to have content filtered, they will be able to choose between teams, or none at all.</p><br/>
      <p>Additionally, by forgoing the centralized server, we no longer have to deal with any frontend getting special proxy permissions to access the webserver. Now users can run the web interface from their own local machine.  This bypasses the requirement for any dns records, and can even skip out on DDOS protection from cloudflare.</p>
      <p>Choosing to utilize ethereum event logs introduces another layer of security, and that makes it more tolerant to spamming.  As aptly summed in the 'dead internet theory' a new range of tactics has been employed to steer discourse, nudge individuals and censor content online.  All performed through the creation of algorithmic botnetswarms aided by digital footprints of targeted communities and individuals.  Heaven banning, forum flooding and drowning, all take advantage of the reality that its the same price for a botnet to post 1000 times for every real anons single effort post.</p><br/>
      <p>Naturally, the pay per post model leaves a lot to be desired, especially as the public is used to free, open access forums.  However with these new vectors, the signal to noise ratio has become to low to be palatable, only aided by the difficultly in discern authentic verse ulteriorly driven content.  Though, one will find hashchans pay-per-post model to be the most economically efficient as the rest.  Hashchan has no token, and doesn't take any cutbacks from posts.  It is purely gas driven.  And, if we consider that spammers post more than regular users, we will find that crypto prices will increase in proportion to botnet activity.  We can see than that hashchan becomes a defacto invest to post model for anyone holding crypto in their wallet</p><br/>
    </div>
  )
}
