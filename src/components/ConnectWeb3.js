import { useAccount, useConnect, useDisconnect, useNetwork } from "wagmi";
import { InjectedConnector } from "wagmi/connectors/injected";
import { chainsData } from "../dataList/chainData0x";
import {
  avalancheChain,
  fantomChain,
  bscChain,
} from "../dataList/chainListProvider";
import { allChains, useSwitchNetwork } from "wagmi";
import OutsideClickHandler from "react-outside-click-handler";
import { useState } from "react";
import { ethers } from "ethers";
import { ChevronDownIcon } from "@heroicons/react/solid";

export function ConnectWeb3() {
  const { connector: isConnected, address, isConnecting } = useAccount();
  const { connect } = useConnect({
    connector: new InjectedConnector(),
  });
  const { disconnect } = useDisconnect();
  const { chain } = useNetwork();
  const { switchNetwork } = useSwitchNetwork();
  const allowedChain = [1, 56, 43114, 137, 250, 10];
  var chains = [
    allChains[0],
    allChains[5],
    allChains[7],
    avalancheChain,
    fantomChain,
    bscChain,
  ];

  if(chain) {
    chains = chains.filter( c => c.id !== chain.id)
  }

  const [showSelectChain, setShowSelectChain] = useState(false);

  const addNetwork = async (c) => {
    if (c.id === 1) {
      switchNetwork(1);
      return;
    }

    const rpcUrls = [];
    const blockExplorers = [];
    for (let x in c.rpcUrls) {
      rpcUrls.push(c.rpcUrls[x]);
    }
    for (let x in c.blockExplorers) {
      blockExplorers.push(c.blockExplorers[x].url);
    }

    await window.ethereum.request({
      method: "wallet_addEthereumChain",
      params: [
        {
          chainName: c.name,
          rpcUrls: [
            "https://polygon-rpc.com/",
            "https://rpc-mainnet.matic.network",
            "https://matic-mainnet.chainstacklabs.com",
            "https://rpc-mainnet.maticvigil.com",
            "https://rpc-mainnet.matic.quiknode.pro",
            "https://matic-mainnet-full-rpc.bwarelabs.com",
          ],
          nativeCurrency: {
            name: c.nativeCurrency.name,
            symbol: c.nativeCurrency.symbol,
            decimals: c.nativeCurrency.decimals,
          },
          chainId: ethers.utils.hexValue(c.id),
          blockExplorerUrls: blockExplorers,
        },
      ],
    });
  };

  if (isConnected)
    return (
      <div>
        <div>
          <button onClick={() => disconnect()}>
            {address.substring(0, 5)}...
            {address.substring(address.length - 4, address.length)}
          </button>
        </div>
        <button
          className="flex items-center hover:bg-orange-50 hover:cursor-pointer"
          onClick={() => setShowSelectChain(true)}
        >
          {chain && allowedChain.includes(chain.id) && (
            <div className="flex items-center gap-x-2">
              <img
                alt=""
                src={chainsData[chain.id].logoURL}
                className="w-8"
              ></img>
              <p>{chainsData[chain.id].name}</p>
            </div>
          )}
          {chain && !allowedChain.includes(chain.id) && (
            <p className="p-1">Chain not supported, please switch</p>
          )}
          <ChevronDownIcon className="h-6 w-6" />
        </button>
        {showSelectChain && (
          <OutsideClickHandler onOutsideClick={() => setShowSelectChain(false)}>
            <div className="absolute pt-4">
              <ul className="menu bg-base-100 w-40 overflow-y-auto h-56 scrollbar-hide">
                {chains.map((c) => (
                  <li key={c.id} className="hover:bg-gray-50">
                    <div onClick={() => addNetwork(c)}>
                      <img
                        alt=""
                        src={chainsData[c.id].logoURL}
                        className="object-scale-down"
                      ></img>
                      {c.name}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </OutsideClickHandler>
        )}
      </div>
    );
  if (isConnecting) return <div>Connecting...</div>;
  return <button onClick={() => connect()}>Connect Wallet</button>;
}
