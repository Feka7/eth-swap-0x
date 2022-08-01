import {
    useAccount,
    useConnect,
    useDisconnect,
    useNetwork
  } from "wagmi";
  import { InjectedConnector } from 'wagmi/connectors/injected'
import { chainsData } from "../tokenlist/chainData0x";
  
export function ConnectWeb3() {
    const { connector: isConnected, address, isConnecting } = useAccount();
    const { connect } = useConnect({
      connector: new InjectedConnector(),
    });
    const { disconnect } = useDisconnect();
    const { chain } = useNetwork();
    const allowedChain = [1, 56, 43114, 137, 250, 10];
    if (isConnected)
      return (
        <>
          <div>
            <button onClick={() => disconnect()}>
              {address.substring(0, 5)}...
              {address.substring(address.length - 4, address.length)}
            </button>
          </div>
          {chain && allowedChain.includes(chain.id) && (
          
            <div className="flex items-center gap-x-2">
              <img alt="" src={chainsData[chain.id].logoURL} className="w-8"></img>
            <p>
            {chainsData[chain.id].name}
            </p>
            </div>
        
          )}
          {chain && !allowedChain.includes(chain.id) && (
            <p
              className="p-1"
            >
              Chain not supported
            </p>
          )}
        </>
      );
    if (isConnecting) return <div>Connecting...</div>;
    return <button onClick={() => connect()}>Connect Wallet</button>;
  }
  