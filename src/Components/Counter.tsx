import React, { useState, useEffect } from "react";
import { BiconomySmartAccount } from "@biconomy/account";
import {
  IHybridPaymaster,
  SponsorUserOperationDto,
  PaymasterMode,
} from "@biconomy/paymaster";
import abi from "../utils/counterAbi.json";
import { ethers } from "ethers";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

interface Props {
  smartAccount: BiconomySmartAccount;
  provider: any;
}

const TotalCountDisplay: React.FC<{ count: number }> = ({ count }) => {
  return <div>Total count is {count}</div>;
};

const Counter: React.FC<Props> = ({ smartAccount, provider }) => {
  const [count, setCount] = useState<number>(0);
  const [counterContract, setCounterContract] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  //   const counterAddress = import.meta.env.VITE_COUNTER_CONTRACT_ADDRESS;
  const counterAddress = "0x4f97812fD4677b582a6c1ba8664CB1222CC66C3A";

  useEffect(() => {
    setIsLoading(true);
    getCount(false);
  }, []);

  useEffect(() => {
    console.log("Fetched new count");
    getCount(false);
  }, [count]);

  const getCount = async (isUpdating: boolean) => {
    const contract = new ethers.Contract(counterAddress, abi, provider);
    setCounterContract(contract);
    const currentCount = await contract.count();
    setCount(() => currentCount.toNumber());
    contract.on("updateCount", (newCount) => {
      setCount(() => Number(newCount));
    });
    if (isUpdating) {
      toast.success("Count has been updated!", {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark",
      });
    }
  };

  const counterCount = async (fnName: string) => {
    try {
      toast.info("Processing count on the blockchain!", {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark",
      });

      const incrementTx = new ethers.utils.Interface([`function ${fnName}()`]);
      const data = incrementTx.encodeFunctionData(fnName);

      const tx1 = {
        to: counterAddress,
        data: data,
      };

      const partialUserOp = await smartAccount.buildUserOp([tx1]);

      const biconomyPaymaster =
        smartAccount.paymaster as IHybridPaymaster<SponsorUserOperationDto>;

      const paymasterServiceData: SponsorUserOperationDto = {
        mode: PaymasterMode.SPONSORED,
        // optional params...
      };

      try {
        const paymasterAndDataResponse =
          await biconomyPaymaster.getPaymasterAndData(
            partialUserOp,
            paymasterServiceData
          );
        partialUserOp.paymasterAndData =
          paymasterAndDataResponse.paymasterAndData;

        const userOpResponse = await smartAccount.sendUserOp(partialUserOp);
        const transactionDetails = await userOpResponse.wait();

        console.log("Transaction Details:", transactionDetails);
        console.log("Transaction Hash:", userOpResponse.userOpHash);

        toast.success(`Transaction Hash: ${userOpResponse.userOpHash}`, {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "dark",
        });
      } catch (e) {
        console.error("Error executing transaction:", e);
        // ... handle the error if needed ...
      }

      //   if (onlyAddress) {}
      await getCount(true);
    } catch (error) {
      console.error("Error executing transaction:", error);
      toast.error("Error occurred, check the console", {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark",
      });
    }
  };

  return (
    <>
      {isLoading && "Loading..."}
      Contract Address: {counterContract}
      <TotalCountDisplay count={count} />
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={true}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
      <br></br>
      <button type="button" onClick={() => counterCount("incrementCount")}>
        Increment Count
      </button>
      <button type="button" onClick={() => counterCount("decrementCount")}>
        Decrement Count
      </button>
      <button type="button" onClick={() => counterCount("lastAddress")}>
        Last Caller
      </button>
    </>
  );
};

export default Counter;
