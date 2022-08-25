import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import {
  WagmiConfig,
  createClient,
  configureChains,
  chain
} from 'wagmi'
import { publicProvider } from 'wagmi/providers/public'
import { avalancheChain, fantomChain, bscChain } from './dataList/chainListProvider';

const { provider, webSocketProvider } = configureChains(
  [chain.mainnet, chain.polygon, chain.optimism, avalancheChain, fantomChain, bscChain],
  [publicProvider()],
)

const client = createClient({
  autoConnect: true,
  provider,
  webSocketProvider,
})

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <WagmiConfig client={client}>
      <App />
    </WagmiConfig>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
