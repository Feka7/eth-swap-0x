import { useState, useEffect, useRef } from "react";
import {
  XIcon,
  QuestionMarkCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "@heroicons/react/solid";
import OutsideClickHandler from "react-outside-click-handler";
import { useAccount, useNetwork, useBalance, erc20ABI, useSigner } from "wagmi";
import { ethers, BigNumber } from "ethers";
import { tokenList } from "./dataList/tokenlist";
import { ConnectWeb3 } from "./components/ConnectWeb3";
import { chainsData } from "./dataList/chainData0x";

// function ButtonApprove() {
//   return (
//     <button className="bg-sky-300 p-2 rounded hover:bg-sky-400 active:bg-sky-500 text-white uppercase font-bold">Approve</button>
//   )
// }

function App() {
  const [tokenFrom, setTokenFrom] = useState({
    address: "",
    symbol: "",
    image: "",
    decimals: "",
  });
  const [tokenTo, setTokenTo] = useState({
    address: "",
    symbol: "",
    image: "",
    decimals: "",
  });
  const [tokenFromMenu, setTokenFromMenu] = useState(false);
  const [tokenToMenu, setTokenToMenu] = useState(false);
  const [error, setError] = useState();
  const [swap, isSwapping] = useState(false)
  const [amountFrom, setAmountFrom] = useState(0);
  const [amountTo, setAmountTo] = useState({ value: 0, estimatedGas: "" });
  const [queryFrom, setQueryFrom] = useState("");
  const [queryTo, setQueryTo] = useState("");
  const [slippage, setSlippage] = useState(2);
  const { address, isConnected } = useAccount({
    onDisconnect() {
      window.location.reload();
    },
  });
  const { data: signer } = useSigner();
  const { chain } = useNetwork();
  const currentChain = useRef();

  useEffect(() => {
    async function getPrice() {
      const amount =
        tokenFrom.decimals !== "18"
          ? Number(amountFrom * 10 ** tokenFrom.decimals)
          : ethers.utils.parseEther(amountFrom).toString();
      console.log(
        "https://" +
          chainsData[chain.id].x +
          "api.0x.org/swap/v1/price?sellToken=" +
          tokenFrom.address +
          "&buyToken=" +
          tokenTo.address +
          "&sellAmount=" +
          amount
      );
      const response = await fetch(
        "https://" +
          chainsData[chain.id].x +
          "api.0x.org/swap/v1/price?sellToken=" +
          tokenFrom.address +
          "&buyToken=" +
          tokenTo.address +
          "&sellAmount=" +
          amount
      );
      const swapPriceJSON = await response.json();
      const amountResponse =
        tokenTo.decimals !== "18"
          ? swapPriceJSON.buyAmount / 10 ** tokenTo.decimals
          : ethers.utils.formatEther(swapPriceJSON.buyAmount).toString();
      setAmountTo({
        value: amountResponse,
        estimatedGas: swapPriceJSON.estimatedGas,
      });
    }
    let prevChain = currentChain.current;
    currentChain.current = chain?.id;
    if (chain?.id && prevChain && prevChain !== currentChain.current)
      window.location.reload();
    if (tokenFrom.symbol === "" || tokenTo.symbol === "") return;
    if (Number(amountFrom) !== 0) getPrice();
    return;
  }, [tokenFrom, amountFrom, tokenTo, chain?.id, isConnected]);

  function MessageError() {
    return (
      <div className="bg-red-400 text-white p-4 absolute z-10">
        <div className="flex justify-end">
          <XIcon
            className="h-5 w-5 hover:cursor-pointer hover:bg-opacity-50 hover:bg-white active:bg-opacity-50 active:bg-white"
            onClick={() => {
              setError(undefined);
            }}
          ></XIcon>
        </div>
        <p>{error}</p>
      </div>
    );
  }

  function ButtonSwap() {
    const { chain } = useNetwork();
    if(swap) return (
      <button
        className="bg-sky-500 p-2 rounded hover:bg-sky-400 active:bg-sky-500 text-white uppercase font-bold"
      >
      <progress class="progress progress-warning w-12 h-3"></progress>
      </button>
    )
    if (
      !chain ||
      tokenFrom.address === "" ||
      tokenTo.address === "" ||
      Number(amountFrom) === 0
    )
      return (
        <button className="bg-sky-300 hover:cursor-not-allowed p-2 rounded text-white uppercase font-bold">
          Swap
        </button>
      );
    return (
      <button
        className="bg-sky-500 p-2 rounded hover:bg-sky-400 active:bg-sky-500 text-white uppercase font-bold"
        onClick={() => TrySwap()}
      >
        Swap
      </button>
    );
  }

  function TokenBalance() {
    const { chain } = useNetwork();
    const { data, isError, isLoading } = useBalance({
      addressOrName: address,
      token:
        tokenFrom.address === "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee"
          ? ""
          : tokenFrom.address,
      watch: true,
      chainId: chain.id,
    });
    if (isLoading) return "...";
    if (isError) return "error";
    return (
      <span
        onClick={() => setAmountFrom(String(Number(data?.formatted) * (10 ** (18 - Number(data?.decimals)))))}
        className="hover:cursor-pointer"
      >
        {String(Number(data?.formatted) * (10 ** (18 - Number(data?.decimals)))).substring(0, 8)}
      </span>
    );
  }

  async function getAllowance() {
    const amount =
      tokenFrom.decimals !== "18"
        ? Number(amountFrom * 10 ** tokenFrom.decimals)
        : ethers.utils.parseEther(amountFrom).toString();
    console.log(
      "https://" +
        chainsData[chain.id].x +
        "api.0x.org/swap/v1/price?sellToken=" +
        tokenFrom.address +
        "&buyToken=" +
        tokenTo.address +
        "&sellAmount=" +
        amount
    );
    const response = await fetch(
      "https://" +
        chainsData[chain.id].x +
        "api.0x.org/swap/v1/price?sellToken=" +
        tokenFrom.address +
        "&buyToken=" +
        tokenTo.address +
        "&sellAmount=" +
        amount
    );
    const swapPriceJSON = await response.json();
    return swapPriceJSON;
  }

  async function getQuote() {
    if (tokenFrom.address === "" || tokenTo.address === "" || !amountFrom)
      return;
    const amount =
      tokenFrom.decimals !== "18"
        ? Number(amountFrom * 10 ** tokenFrom.decimals)
        : ethers.utils.parseEther(amountFrom).toString();
  
    const response = await fetch(
      "https://" +
        chainsData[chain.id].x +
        "api.0x.org/swap/v1/quote?sellToken=" +
        tokenFrom.address +
        "&buyToken=" +
        tokenTo.address +
        "&sellAmount=" +
        amount +
        "&takerAddress=" +
        address +
        "&slippagePercentage=" +
        Number(slippage) / 100
    );
    const swapQuoteJSON = await response.json();
    console.log("Quote: ", swapQuoteJSON);

    return swapQuoteJSON;
  }

  async function TrySwap() {
    isSwapping(true)
    try {
    const swapPriceJSON = await getAllowance();

    // Set Token Allowance
    // Set up approval amount
    const maxApproval =
      tokenFrom.decimals !== "18"
        ? Number(amountFrom * 10 ** tokenFrom.decimals)
        : ethers.utils.parseEther(amountFrom).toString();
    console.log("approval amount: ", maxApproval);

    const ERC20TokenContract = new ethers.Contract(
      tokenFrom.address,
      erc20ABI,
      signer
    );

    const currentAllowance = BigNumber.from(
      await ERC20TokenContract.allowance(address, swapPriceJSON.allowanceTarget)
    ).toNumber();
    console.log(currentAllowance)
    if (currentAllowance < Number(amountFrom)) {
      console.log(currentAllowance)
      const tx = await ERC20TokenContract.approve(
        swapPriceJSON.allowanceTarget,
        maxApproval
      );
      await tx.wait();
      console.log("approve");
    }

    const swapQuoteJSON = await getQuote(address);
    await signer.sendTransaction({
      to: swapQuoteJSON.to,
      from: swapQuoteJSON.from,
      data: swapQuoteJSON.data,
      value: swapQuoteJSON.value,
      chainId: swapQuoteJSON.chainId,
      gasPrice: swapQuoteJSON.gasPrice,
      gasLimit: swapQuoteJSON.gas
    });
  }
  finally {
    isSwapping(false)
  }
  }

  let chainTokenList =
    chain && tokenList?.[chain.id] ? tokenList[chain.id] : [];
  let chainTokenListFrom =
    chain &&
    chainTokenList.filter(
      (c) => c.address !== tokenTo.address && c.address !== tokenFrom.address
    );
  let chainTokenListTo =
    chain &&
    chainTokenList.filter(
      (c) => c.address !== tokenFrom.address && c.address !== tokenTo.address
    );

  return (
    <div className="md:container md:mx-auto px-4 h-screen flex justify-center items-center">
      {error && <MessageError />}
      <div className="bg-yellow-100 p-8 rounded md:w-2/3 lg:w-1/2 sm:w-2/3 w-3/4">
        <div className="text-orange-500 flex flex-col items-end gap-y-3">
          <ConnectWeb3 />
        </div>
        <p className="text-3xl font-bold text-center uppercase text-orange-400 pt-2">
          RTW3 week 9
        </p>
        <div className="grid grid-cols-3 auto-cols-max place-items-center pt-4 gap-3">
          <div className="col-span-1">
            {tokenFrom.address === "" ? (
              <QuestionMarkCircleIcon
                className="rounded md:w-20 w-12 hover:bg-gray-50 hover:bg-opacity-80 hover:cursor-pointer"
                onClick={() => setTokenFromMenu(!tokenFromMenu)}
              />
            ) : (
              <div
                className="rounded hover:bg-gray-50 hover:bg-opacity-80 hover:cursor-pointer p-3 sm:flex items-center uppercase font-bold text-xl text-gray-600"
                onClick={() => setTokenFromMenu(!tokenFromMenu)}
              >
                <img
                  alt=""
                  src={tokenFrom.image}
                  className="pr-1 mx-auto"
                ></img>
                <p>{tokenFrom.symbol}</p>
              </div>
            )}
          </div>
          <div className="w-full col-span-2">
            <label
              htmlFor="From"
              className="block uppercase font-bold text-gray-400"
            >
              From
            </label>
            <input
              value={amountFrom}
              type="number"
              className="input input-bordered w-full border-orange-300 focus:border-orange-400 focus:border-2"
              id="From"
              onChange={(e) => setAmountFrom(e.target.value)}
            ></input>
          </div>
        </div>
        {tokenFromMenu && (
          <OutsideClickHandler onOutsideClick={() => setTokenFromMenu(false)}>
            <div className="absolute">
              <input
                placeholder="Search..."
                type="text"
                className="input rounded-none w-full border-b-4 border-t-0 border-x-0 border-b-gray-200"
                value={queryFrom}
                onChange={(e) => setQueryFrom(e.target.value.toUpperCase())}
              ></input>
              <ul className="menu bg-base-100 w-auto overflow-y-auto h-56 scrollbar-hide">
                {chainTokenListFrom.map((token) => (
                  <li key={token.address}>
                    <div
                      onClick={() =>
                        setTokenFrom({
                          address: token.address,
                          symbol: token.symbol,
                          image: token.image,
                          decimals: token.decimals,
                        })
                      }
                    >
                      <img
                        alt=""
                        src={token.image}
                        className="object-scale-down"
                      ></img>
                      {token.symbol}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </OutsideClickHandler>
        )}
        <div className="text-right uppercase font-bold  text-gray-600 text-xs sm:text-base">
          Token balance:{" "}
          <span>
            {tokenFrom.address === "" || !isConnected ? 0 : <TokenBalance />}
          </span>
        </div>
        <div className="grid grid-cols-3 auto-cols-max place-items-center pt-4 gap-3">
          <div className="col-span-1">
            {tokenTo.address === "" ? (
              <QuestionMarkCircleIcon
                className="rounded md:w-20 w-12 hover:bg-gray-50 hover:bg-opacity-80 hover:cursor-pointer"
                onClick={() => setTokenToMenu(!tokenFromMenu)}
              />
            ) : (
              <div
                className="rounded hover:bg-gray-50 hover:bg-opacity-80 hover:cursor-pointer p-3 sm:flex items-center uppercase font-bold text-xl text-gray-600"
                onClick={() => setTokenToMenu(!tokenFromMenu)}
              >
                <img alt="" src={tokenTo.image} className="pr-1 mx-auto"></img>
                <p>{tokenTo.symbol}</p>
              </div>
            )}
          </div>
          <div className="w-full col-span-2">
            <label
              htmlFor="From"
              className="block uppercase font-bold text-gray-400"
            >
              To
            </label>
            <input
              value={amountTo.value}
              type="number"
              className="input input-bordered w-full border-orange-300 focus:border-orange-400 focus:border-2"
              id="From"
              onChange={(e) =>
                setAmountTo({ value: e.target.value, estimatedGas: 0 })
              }
            ></input>
          </div>
        </div>
        {tokenToMenu && (
          <OutsideClickHandler onOutsideClick={() => setTokenToMenu(false)}>
            <div className="absolute">
              <input
                placeholder="Search..."
                type="text"
                className="input rounded-none w-full border-b-4 border-t-0 border-x-0 border-b-gray-200"
                value={queryTo}
                onChange={(e) => setQueryTo(e.target.value.toUpperCase())}
              ></input>
              <ul className="menu bg-base-100 w-auto overflow-y-auto h-56 scrollbar-hide">
                {chainTokenListTo.map((token) => (
                  <li key={token.address} className="hover:bg-gray-50">
                    <div
                      onClick={() =>
                        setTokenTo({
                          address: token.address,
                          symbol: token.symbol,
                          image: token.image,
                          decimals: token.decimals,
                        })
                      }
                    >
                      <img
                        alt=""
                        src={token.image}
                        className="object-scale-down"
                      ></img>
                      {token.symbol}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </OutsideClickHandler>
        )}
        <div className="sm:flex sm:flex-row items-center pt-2 sm:pt-0">
          <div className="sm:basis-1/2 text-left uppercase font-bold  text-gray-600 text-xs sm:text-base">
            Estimate gas: {amountTo.estimatedGas}
          </div>
          <div className="sm:basis-1/2 flex items-center sm:justify-end pt-2 sm:pt-0">
            <div className="uppercase font-bold  text-gray-600 text-xs sm:text-base">
              Slippage: {slippage}%
            </div>
            <div className="flex flex-col">
              <div>
                <ChevronUpIcon
                  className="h-5 w-5 hover:bg-yellow-50"
                  onClick={() =>
                    slippage >= 5 ? setSlippage(5) : setSlippage(slippage + 0.5)
                  }
                />
              </div>
              <div>
                <ChevronDownIcon
                  className="h-5 w-5  hover:bg-yellow-50"
                  onClick={() =>
                    slippage <= 0.5
                      ? setSlippage(0.5)
                      : setSlippage(slippage - 0.5)
                  }
                />
              </div>
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
