import { 
  useState,
  useContext,
  useEffect,
  createContext,
  useCallback,
} from 'react'; 
import { useNavigate } from 'react-router-dom';
import { IDBContext } from '@/provider/IDBProvider';

// Create a context for TOS acceptance state
const TOSContext = createContext<{
  tosAccepted: boolean;
  setTosAccepted: (accepted: boolean) => void;
}>({
  tosAccepted: false,
  setTosAccepted: () => {},
});

export const TOSProvider = ({ children }: { children: React.ReactNode }) => {
  const [tosAccepted, setTosAccepted] = useState(false);
  const { db } = useContext(IDBContext);

  useEffect(() => {
    const checkTOS = async () => {
      if (db) {
        const settings = await db.settings.toArray();
        if (settings.length > 0) {
          setTosAccepted(settings[0].tosAccepted);
        }
      }
    };
    checkTOS();
  }, [db]);

  return (
    <TOSContext.Provider value={{ tosAccepted, setTosAccepted }}>
      {children}
    </TOSContext.Provider>
  );
};

export const TOSPPBanner = () => {
  const { tosAccepted } = useContext(TOSContext);
  const navigate = useNavigate();

  if (tosAccepted) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: `rgba(0, 0, 0, ${1/(Math.PHI)})`,
      padding: `${1/(Math.PHI**2)}rem`,
      textAlign: 'center',
      borderTop: '1px solid #20C20E',
      zIndex: 1000,
    }}>
      <span>Please Accept the TOS and Privacy Policy or visit the <a target="_blank" href="https://github.com/hashchan/hashchan">github repo</a> to Run Locally</span>
      <button 
        onClick={() => navigate('/tospp')}
        style={{ 
          marginLeft: `${1/Math.PHI}rem`,
          padding: `${1/(Math.PHI**3)}rem ${1/(Math.PHI**2)}rem`,
          backgroundColor: '#20C20E',
          color: '#000',
          border: 'none',
          borderRadius: '4px',
        }}
      >
        Review
      </button>
    </div>
  );
};

export const TOSPP = () => {
  const [activeTab, setActiveTab] = useState<'tos' | 'privacy'>('tos');
  const { db } = useContext(IDBContext);
  const { tosAccepted, setTosAccepted } = useContext(TOSContext);
  const navigate = useNavigate();

  const handleAccept = async () => {
    if (db) {
      const settings = await db.settings.toArray();
      if (settings.length > 0) {
        await db.settings.update(settings[0].id!, {
          tosAccepted: true,
          tosTimestamp: Date.now()
        });
        setTosAccepted(true);
        navigate('/');
      }
    }
  };

  return (
    <div className="flex-wrap-center" style={{ 
      padding: `${1/Math.PHI}vh ${1/Math.PHI}vw`,
      width: `${100/Math.PHI}vw`,
      margin: '0 auto',
      paddingBottom: '4rem'
    }}>
      <div style={{ 
        display: 'flex', 
        gap: `${1/Math.PHI}rem`,
        marginBottom: `${1/Math.PHI}rem`
      }}>
        <button 
          onClick={() => setActiveTab('tos')}
          style={{ 
            backgroundColor: activeTab === 'tos' ? '#20C20E' : 'transparent',
            color: activeTab === 'tos' ? '#000' : '#20C20E',
            padding: `${1/(Math.PHI**2)}rem ${1/Math.PHI}rem`,
          }}
        >
          Terms of Service
        </button>
        <button 
          onClick={() => setActiveTab('privacy')}
          style={{ 
            backgroundColor: activeTab === 'privacy' ? '#20C20E' : 'transparent',
            color: activeTab === 'privacy' ? '#000' : '#20C20E',
            padding: `${1/(Math.PHI**2)}rem ${1/Math.PHI}rem`,
          }}
        >
          Privacy Policy
        </button>
      </div>

      <div style={{ 
        maxWidth: `${100/Math.PHI}vw`, 
        margin: '0 auto',
        padding: `${1/Math.PHI}vh ${1/Math.PHI}vw`,
      }}>
        {activeTab === 'tos' ? (
          <div>
            <h2 style={{ marginBottom: `${1/Math.PHI}rem` }}>Terms of Service</h2>
            <section style={{ marginBottom: `${1/Math.PHI}rem` }}>
              <h3 style={{ marginBottom: `${1/(Math.PHI**2)}rem` }}>1. Acceptance of Terms</h3>
              <p>Hashchan is designed to be locally hosted- this server behind hashchan.org is designed for demonstration purposes only. If you do not accept these terms and conditions as required by 3rd party advertizers to share this website- feel free to visit <a target="_blank" href="https://github.com/hashchan/hashchan">the github repository</a> and download the release oneself</p>
            </section>

            <section style={{ marginBottom: `${1/Math.PHI}rem` }}>
              <h3 style={{ marginBottom: `${1/(Math.PHI**2)}rem` }}>2. Use of Service</h3>
              <p>Hashchan is a decentralized platform that utilizes Ethereum event logs for thread storage. Users are responsible for all content they post.</p>
            </section>

            <section style={{ marginBottom: `${1/Math.PHI}rem` }}>
              <h3 style={{ marginBottom: `${1/(Math.PHI**2)}rem` }}>3. Blockchain Transactions</h3>
              <p>All posts require blockchain transactions. Users are responsible for any associated gas fees and understanding the implications of posting content to an immutable blockchain.</p>
            </section>

            <section style={{ marginBottom: `${1/Math.PHI}rem` }}>
              <h3 style={{ marginBottom: `${1/(Math.PHI**2)}rem` }}>4. Modifications</h3>
              <p> Hashchan may reserve the right to modify these terms at any time within the expectation that it may never scrape, purloin or forward user data for the purposes of anything</p>
            </section>
          </div>
        ) : (
          <div>
            <h2 style={{ marginBottom: `${1/Math.PHI}rem` }}>Privacy Policy</h2>
            <section style={{ marginBottom: `${1/Math.PHI}rem` }}>
              <h3 style={{ marginBottom: `${1/(Math.PHI**2)}rem` }}>1. Information Collection</h3>
              <p>Hashchan is a decentralized application. We do not collect or store personal information on centralized servers. However, all content posted is publicly visible on the blockchain.</p>
            </section>

            <section style={{ marginBottom: `${1/Math.PHI}rem` }}>
              <h3 style={{ marginBottom: `${1/(Math.PHI**2)}rem` }}>2. Blockchain Data</h3>
              <p>All posts and transactions are recorded on the Ethereum blockchain and are publicly accessible. Users should be aware that blockchain data is immutable and cannot be deleted.</p>
            </section>

            <section style={{ marginBottom: `${1/Math.PHI}rem` }}>
              <h3 style={{ marginBottom: `${1/(Math.PHI**2)}rem` }}>3. Wallet Connection</h3>
              <p>To use Hashchan, users must connect their Ethereum wallet. The wallet address is visible with posted content but no personal information is collected from the wallet.</p>
            </section>

            <section style={{ marginBottom: `${1/Math.PHI}rem` }}>
              <h3 style={{ marginBottom: `${1/(Math.PHI**2)}rem` }}>4. Image Storage</h3>
              <p>Images are stored via hotlinking or IPFS. Users choosing to use the optional web3.storage feature for IPFS pinning may need to provide an email address to that service.</p>
            </section>

            <section style={{ marginBottom: `${1/Math.PHI}rem` }}>
              <h3 style={{ marginBottom: `${1/(Math.PHI**2)}rem` }}>5. Third-Party Services</h3>
              <p>Hashchan integrates with various blockchain networks and IPFS services. Users should review the privacy policies of these third-party services.</p>
            </section>
          </div>
        )}
      </div>

      {!tosAccepted && (
        <div style={{
          marginTop: `${1/Math.PHI}rem`,
          textAlign: 'center'
        }}>
          <button
            onClick={handleAccept}
            style={{
              backgroundColor: '#20C20E',
              color: '#000',
              padding: `${1/(Math.PHI**2)}rem ${1/Math.PHI}rem`,
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Accept Terms and Privacy Policy
          </button>
        </div>
      )}
    </div>
  );
};
