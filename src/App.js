import { useState, useEffect } from 'react';
import { XIcon, QuestionMarkCircleIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/solid'
import OutsideClickHandler from 'react-outside-click-handler'
import { useAccount, useConnect, useDisconnect, useNetwork, useSwitchNetwork, useBalance, erc20ABI, useSigner} from 'wagmi'
import { InjectedConnector } from 'wagmi/connectors/injected'
import { ethers } from 'ethers'

function ConnectWeb3() {
  const { connector: isConnected, address, isConnecting } = useAccount()
  const { connect } = useConnect({
    connector: new InjectedConnector(),
  })
  const { disconnect } = useDisconnect()
  const { chain } = useNetwork()
  const { switchNetwork } =
    useSwitchNetwork()

  if (isConnected) return (
    <>
      <button onClick={() => disconnect()}>{address.substring(0, 5)}...{address.substring(address.length - 4, address.length)}</button>
      {chain && chain.id === 1 && <p>{chain.name}</p>}
      {chain && chain.id !== 1 && <p className='p-1 hover:bg-gray-50 hover:bg-opacity-80 hover:cursor-pointer' onClick={() => switchNetwork(1)}>Please switch to Ethereum</p>}
    </>
  )
  if (isConnecting) return <div>Connecting...</div>
  return <button onClick={() => connect()}>Connect Wallet</button>
}

// function ButtonApprove() {
//   return (
//     <button className="bg-sky-300 p-2 rounded hover:bg-sky-400 active:bg-sky-500 text-white uppercase font-bold">Approve</button>
//   )
// }

function App() {


  const [tokenList, setTokenList] = useState([])
  const [tokenFrom, setTokenFrom] = useState({ address: '', symbol: '', image: '', decimals: '' })
  const [tokenTo, setTokenTo] = useState({ address: '', symbol: '', image: '', decimals: '' })
  const [tokenFromMenu, setTokenFromMenu] = useState(false)
  const [tokenToMenu, setTokenToMenu] = useState(false)
  const [error, setError] = useState()
  const [amountFrom, setAmountFrom] = useState(0)
  const [amountTo, setAmountTo] = useState({value: 0, estimatedGas: ''})
  const [queryFrom, setQueryFrom] = useState('')
  const [queryTo, setQueryTo] = useState('')
  const [slippage, setSlippage] = useState(2)
  const { address, isConnected } = useAccount()
  const { data: signer } = useSigner()

  useEffect(() => {
    async function getTokenList() {
      const response = await fetch('https://tokens.coingecko.com/uniswap/all.json')
      if (!response.ok) {
        setError("Error to retrieve token list, please refresh the page")
        return
      }
      const tokenListJSON = await response.json()

      const response0x = await fetch('https://api.0x.org/swap/v1/tokens')
      if (!response0x.ok) {
        setError("Error to retrieve token list, please refresh the page")
        return
      }
      const tokenList0xJSON = await response0x.json()

      const uniqueTokenList = tokenListJSON.tokens.filter(element => {
        let found = false
        for (let x in tokenList0xJSON.records) {
          if (tokenList0xJSON.records[x].address === element.address) {
            found = true
            break
          }
        }
        return found
      });
      uniqueTokenList.push({ "symbol": "ETH", "address": "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee", "name": "Ether", "decimals": "18", "logoURI": "/eth.png" })
      setTokenList(uniqueTokenList)
    }

    getTokenList()
  }, []);

  useEffect(() => {
    async function getPrice() {
      const amount = tokenFrom.decimals !== "18" ? Number(amountFrom * 10 ** tokenFrom.decimals) : ethers.utils.parseEther(amountFrom).toString()
      const response = await fetch("https://api.0x.org/swap/v1/price?sellToken=" + tokenFrom.address + "&buyToken=" + tokenTo.address + "&sellAmount=" + amount)
      const swapPriceJSON = await response.json();
      const amountResponse = tokenTo.decimals !== "18" ? swapPriceJSON.buyAmount / (10 ** tokenTo.decimals) : ethers.utils.formatEther(swapPriceJSON.buyAmount).toString()
      setAmountTo({value: amountResponse, estimatedGas: swapPriceJSON.estimatedGas})
    }
    if (tokenFrom.symbol === '' || tokenTo.symbol === "") return
    if (Number(amountFrom) !== 0 && tokenFrom.address !== tokenTo.address) getPrice()
    return
  }, [tokenFrom, amountFrom, tokenTo])

  function MessageError() {
    return (
      <div className='bg-red-400 text-white p-4 absolute z-10'>
        <div className='flex justify-end'>
          <XIcon className='h-5 w-5 hover:cursor-pointer hover:bg-opacity-50 hover:bg-white active:bg-opacity-50 active:bg-white' onClick={() => { setError(undefined) }}></XIcon>
        </div>
        <p>{error}</p>
      </div>
    )
  }

  function ButtonSwap() {
    const { chain } = useNetwork()
    if (!chain || chain.id !== 1) return <button className="bg-sky-300 hover:cursor-not-allowed p-2 rounded text-white uppercase font-bold">Swap</button>
    return (
      <button className="bg-sky-500 p-2 rounded hover:bg-sky-400 active:bg-sky-500 text-white uppercase font-bold" onClick={() => TrySwap()}>Swap</button>
    )
  }

  function TokenBalance() {
    const { data, isError, isLoading } = useBalance({
      addressOrName: address,
      token: tokenFrom.address === "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee" ? "" : tokenFrom.address,
      chainId: 1,
      watch: true,
    })
    if (isLoading) return '...'
    if (isError) return 'error'
    return <span onClick={() => setAmountFrom(data?.formatted)} className="hover:cursor-pointer">{data?.formatted.substring(0, 8)}</span>

  }

  async function getQuote() {

    if (tokenFrom.address === '' || tokenTo.address === '' || !amountFrom) return;
    const amount = tokenFrom.decimals !== "18" ? Number(amountFrom * 10 ** tokenFrom.decimals) : ethers.utils.parseEther(amountFrom).toString()
    const response = await fetch("https://api.0x.org/swap/v1/quote?sellToken=" + tokenFrom.address + "&buyToken=" + tokenTo.address + "&sellAmount=" + amount + "&takerAddress=" + address + "&slippagePercentage=" + (Number(slippage)/100));
    const swapQuoteJSON = await response.json();
    console.log("Quote: ", swapQuoteJSON);

    return swapQuoteJSON;
  }

    async function TrySwap(){

      const swapQuoteJSON = await getQuote(address);

      // Set Token Allowance
      // Set up approval amount
      const maxApproval = tokenFrom.decimals !== "18" ? Number(amountFrom * 10 ** tokenFrom.decimals) : ethers.utils.parseEther(amountFrom).toString()
      console.log("approval amount: ", maxApproval);

      const ERC20TokenContract = new ethers.Contract(tokenFrom.address, erc20ABI, signer);
      const tx = await ERC20TokenContract.approve(swapQuoteJSON.allowanceTarget,maxApproval)
      await tx.wait()
      console.log("approve")

      await signer.sendTransaction(swapQuoteJSON)
  }


  let filteredTokenListFrom = queryFrom === '' ? tokenList : tokenList.filter((token) => {
    let res = token.symbol.startsWith(queryFrom) ? true : false
    return res
  })

  let filteredTokenListTo = queryTo === '' ? tokenList : tokenList.filter((token) => {
    let res = token.symbol.startsWith(queryTo) ? true : false
    return res
  })

  return (
    <div className="md:container md:mx-auto px-4 h-screen flex justify-center items-center">
      {error && <MessageError />}
      <div className="bg-yellow-100 p-8 rounded md:w-1/2 lg:w-1/3 sm:w-2/3 w-3/4">
        <div className='text-right text-orange-500'>
          <ConnectWeb3 />
        </div>
        <p className='text-3xl font-bold text-center uppercase text-orange-400 pt-2'>
          RTW3 week 9
        </p>
        <div className='grid grid-cols-3 auto-cols-max place-items-center pt-4 gap-3'>
          <div className='col-span-1'>
            {tokenFrom.address === '' ? (
              <QuestionMarkCircleIcon className='rounded md:w-20 w-12 hover:bg-gray-50 hover:bg-opacity-80 hover:cursor-pointer' onClick={() => setTokenFromMenu(!tokenFromMenu)} />
            ) : (
              <p className='rounded hover:bg-gray-50 hover:bg-opacity-80 hover:cursor-pointer p-3 sm:flex uppercase font-bold text-xl text-gray-600' onClick={() => setTokenFromMenu(!tokenFromMenu)}>
                <img alt="" src={tokenFrom.image} className="pr-1 mx-auto"></img>{tokenFrom.symbol}
              </p>
            )}
          </div>
          <div className='w-full col-span-2'>
            <label htmlFor="From" className="block uppercase font-bold text-gray-400">From</label>
            <input value={amountFrom} type="number" className="input input-bordered w-full border-orange-300 focus:border-orange-400 focus:border-2" id="From"
              onChange={(e) => setAmountFrom(e.target.value)}></input>
          </div>
        </div>
        {tokenFromMenu &&
          <OutsideClickHandler onOutsideClick={() => setTokenFromMenu(false)}>
            <div className='absolute'>
              <input type="text" className='input rounded-none w-full border-b-4 border-t-0 border-x-0 border-b-gray-200'
                value={queryFrom} onChange={(e) => setQueryFrom(e.target.value.toUpperCase())}>
              </input>
              <ul className="menu bg-base-100 w-auto overflow-y-auto h-56 scrollbar-hide">
                {filteredTokenListFrom.map((token) =>
                  <li key={token.address} className="hover:bg-gray-50"><div onClick={() => setTokenFrom({ address: token.address, symbol: token.symbol, image: token.logoURI, decimals: token.decimals })}>
                    <img alt="" src={token.logoURI} className="object-scale-down"></img>{token.symbol}
                  </div></li>
                )
                }
              </ul>
            </div>
          </OutsideClickHandler>
        }
        <div className='text-right uppercase font-bold  text-gray-600 text-xs sm:text-base'>Token balance: <span>{tokenFrom.address === '' || !isConnected ? 0 : <TokenBalance />}</span></div>
        <div className='grid grid-cols-3 auto-cols-max place-items-center pt-4 gap-3'>
          <div className='col-span-1'>
            {tokenTo.address === '' ? (
              <QuestionMarkCircleIcon className='rounded md:w-20 w-12 hover:bg-gray-50 hover:bg-opacity-80 hover:cursor-pointer' onClick={() => setTokenToMenu(!tokenFromMenu)} />
            ) : (
              <p className='rounded hover:bg-gray-50 hover:bg-opacity-80 hover:cursor-pointer p-3 sm:flex uppercase font-bold text-xl text-gray-600' onClick={() => setTokenToMenu(!tokenFromMenu)}>
                <img alt="" src={tokenTo.image} className="pr-1 mx-auto"></img>{tokenTo.symbol}
              </p>
            )}
          </div>
          <div className='w-full col-span-2'>
            <label htmlFor="From" className="block uppercase font-bold text-gray-400">To</label>
            <input value={amountTo.value} type="number" className="input input-bordered w-full border-orange-300 focus:border-orange-400 focus:border-2" id="From"
              onChange={(e) => setAmountTo({value: e.target.value, estimatedGas: 0})}></input>
          </div>
        </div>
        {tokenToMenu &&
          <OutsideClickHandler onOutsideClick={() => setTokenToMenu(false)}>
            <div className='absolute'>
              <input type="text" className='input rounded-none w-full border-b-4 border-t-0 border-x-0 border-b-gray-200'
                value={queryTo} onChange={(e) => setQueryTo(e.target.value.toUpperCase())}></input>
              <ul className="menu bg-base-100 w-auto overflow-y-auto h-56 scrollbar-hide">
                {filteredTokenListTo.map((token) =>
                  <li key={token.address} className="hover:bg-gray-50"><div onClick={() => setTokenTo({ address: token.address, symbol: token.symbol, image: token.logoURI, decimals: token.decimals })}>
                    <img alt="" src={token.logoURI} className="object-scale-down"></img>{token.symbol}
                  </div></li>
                )
                }
              </ul>
            </div>
          </OutsideClickHandler>
        }
        <div className="sm:flex sm:flex-row items-center pt-2 sm:pt-0">
          <div className="sm:basis-1/2 text-left uppercase font-bold  text-gray-600 text-xs sm:text-base">Estimate gas: {amountTo.estimatedGas}</div>
          <div className="sm:basis-1/2 flex items-center sm:justify-end pt-2 sm:pt-0">
            <div className='uppercase font-bold  text-gray-600 text-xs sm:text-base'>Slippage: {slippage}%</div>
            <div className='flex flex-col'>
              <div><ChevronUpIcon className='h-5 w-5 hover:bg-yellow-50' onClick={() => slippage >= 5 ? setSlippage(5) : setSlippage(slippage + 0.5)} /></div>
              <div><ChevronDownIcon className='h-5 w-5  hover:bg-yellow-50' onClick={() => slippage <= 0.5 ? setSlippage(0.5) : setSlippage(slippage - 0.5)}/></div>
            </div>
          </div>
        </div>
        <div className="pt-3 text-center">
          <ButtonSwap />
        </div>
      </div>
    </div>
  );
}

export default App;
