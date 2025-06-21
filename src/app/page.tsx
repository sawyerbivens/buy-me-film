"use client";

import { PayPalButtons } from "@paypal/react-paypal-js";
import { ArrowLeft, Instagram } from "react-feather";
import Link from "next/link";
import { useEffect, useState } from "react";
import { PayPalScriptProvider } from "@paypal/react-paypal-js";

function createCartItem(price: number) {
  return {
    id: 1,
    name: "Donation",
    price,
    quantity: 1
  }
}

export default function Home() {

  const [ screen, setScreen ] = useState<"amt"|"paypal"|"confirm"|"error">("amt");
  const [ amount, setAmount ] = useState<number>(1);
  const [ customInputValue, setCustomInputValue ] = useState<string|null>(null);
  const [ active, setActive ] = useState<"amt"|"custom">("amt");
  const [ message, setMessage ] = useState("")

  const [ total, setTotal ] = useState(10);

  useEffect(() => {
    if(active === "amt") setTotal(amount*10);
    else if(active === "custom") setTotal(Number(customInputValue)*10);
  }, [active, setTotal, amount, customInputValue]);

  const [isProcessing, setIsProcessing] = useState(false);
  const [paypalError, setPaypalError] = useState("");

  const createOrder = (data: any, actions: any) => {
    return actions.order.create({
      purchase_units: [
        {
          amount: {
            value: total.toFixed(2),
            currency_code: 'USD'
          },
          description: `Farm Market Order`,
          message
        },
      ],
    payment_source: {
      paypal: {
        experience_context: {
          shipping_preference: "NO_SHIPPING"
        }
      }
    }
    });
  };

  const onApprove = async (data: any, actions: any) => {
    setIsProcessing(true);
    try {
      const order = await actions.order.get();
      console.log('Payment successful', order);
      
      // Extract payer information from PayPal response
      const payerName = order.payer?.name?.given_name || '';
      const payerEmail = order.payer?.email_address || '';
      
      const paymentData = {
        name: payerName,
        email: payerEmail,
        amount: total.toFixed(2),
        orderID: data.orderID
      };
      
      console.log('Sending to API:', paymentData);
      
      // Send payment data to our API
      const response = await fetch('/api/payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API error response:', errorText);
        throw new Error('Payment processing failed');
      }
      const result = await response.json();
      console.log('API response:', result);
      // alert('Payment processed successfully!');

      setScreen("confirm");
    } catch (error) {
      console.error('Payment failed:', error);
      setPaypalError('Payment failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const onError = (err: any) => {
    console.error('PayPal error:', err);
    setPaypalError('An error occurred with PayPal. Please try again.');
    setScreen("error")
  };

  useEffect(() => {
    if(amount <= 0) setAmount(1);
  }, [ amount, setAmount ]);

  return (
    <PayPalScriptProvider options={{ clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID as string, currency: "USD", intent: "capture" }}>
      <main className="text-black min-h-screen bg-orange-50 flex flex-col gap-6 p-6 justify-center items-center">
        <div className="bg-white border border-gray-200 rounded-xl shadow-md shadow-black/5 p-6 w-full max-w-sm flex flex-col gap-6">
        {screen === "confirm" ? <>
            <h1 className="font-bold text-2xl text-center flex-1">Donation Confirmed ❤️</h1>
          </> : screen === "error" ? <div className="flex flex-row items-center">
          <button className="w-6 h-full flex items-center justify-between disabled:opacity-0 cursor-pointer text-gray-400 hover:text-orange-600 enabled:duration-200" onClick={() => setScreen("paypal")}>
            <ArrowLeft className="h-4 w-4" />
          </button>
          <h1 className="font-bold text-2xl text-center flex-1">PayPal experienced an error.</h1>
          <span className="w-6 h-full" />
        </div> : <>
            <div className="flex flex-row items-center">
          <button className="w-6 h-full flex items-center justify-between disabled:opacity-0 cursor-pointer text-gray-400 hover:text-orange-600 enabled:duration-200" disabled={screen !== "paypal"} onClick={() => screen === "paypal" && setScreen("amt")}>
            <ArrowLeft className="h-4 w-4" />
          </button>
          <h1 className="font-bold text-2xl text-center flex-1">Buy me film! :)</h1>
          <span className="w-6 h-full" />
        </div>
          {screen === "amt" ? <>
          <div className="border border-orange-200 bg-orange-50 rounded-lg p-4 grid grid-cols-6 gap-2">
            <div>
              <img src="/film.png" />
            </div>
            <div className="font-normal text-3xl text-gray-500">&times;</div>
            <button className="rounded-full aspect-square disabled:text-white disabled:bg-orange-600 enabled:text-orange-600 enabled:bg-white font-semibold border border-orange-600 enabled:hover:bg-orange-600 enabled:hover:text-white cursor-pointer duration-200" disabled={active === "custom" ? false : amount === 1} onClick={() => {setActive("amt"); setAmount(1)}}>1</button>
            <button className="rounded-full aspect-square disabled:text-white disabled:bg-orange-600 enabled:text-orange-600 enabled:bg-white font-semibold border border-orange-600 enabled:hover:bg-orange-600 enabled:hover:text-white cursor-pointer duration-200" disabled={active === "custom" ? false : amount === 2} onClick={() => {setActive("amt"); setAmount(2)}}>2</button>
            <button className="rounded-full aspect-square disabled:text-white disabled:bg-orange-600 enabled:text-orange-600 enabled:bg-white font-semibold border border-orange-600 enabled:hover:bg-orange-600 enabled:hover:text-white cursor-pointer duration-200" disabled={active === "custom" ? false : amount === 3} onClick={() => {setActive("amt"); setAmount(3)}}>3</button>
            <input className={`rounded-[2px] aspect-square border text-center outline-0 duration-200 ${active === "custom" ? "font-semibold border-orange-600 bg-orange-600 text-white" : "bg-white border-gray-200 text-black placeholder:text-black/50"}`}  placeholder="1" value={customInputValue ?? ""} onChange={e => {
              if(!isNaN(Number(e.target.value))) {
                if(Number(e.target.value) === 0) {
                  setCustomInputValue("");
                  setActive("amt");
                }
                else {
                  setCustomInputValue(e.target.value);
                  setActive("custom")
                }

              }
              else {
                if(e.target.value.length === 0) setCustomInputValue("");
              }
             }} />
          </div>
          <textarea className="rounded-lg bg-gray-100 border border-gray-100 placeholder:text-gray-400 p-4 min-h-28 focus:outline-0 focus:border focus:border-gray-200" placeholder="Leave me a message..." value={message} onChange={e => setMessage(e.target.value)}></textarea>
          <button className="bg-orange-600 rounded-full px-6 py-3 font-semibold text-white cursor-pointer hover:bg-orange-700 text-center duration-200" onClick={() => setScreen("paypal")}>Support ${total}</button>
          </> : <>
              <PayPalButtons createOrder={createOrder} onApprove={onApprove} onError={onError} style={{ layout: "vertical" }} disabled={isProcessing} />
          </>}
          </>}
        </div>
        <p className="max-w-sm text-center text-orange-600 text-sm">Thank you for considering to support me! Your support helps me continue my passion for analog photography!</p>
        <div className="">
          <Link href="https://www.instagram.com/sawyerbiv.photo/" target="_blank" className="flex items-center justify-center p-2 aspect-square rounded-full bg-transparent text-orange-600 hover:bg-orange-600 hover:text-white duration-200 cursor-pointer">
            <Instagram className="h-6 w-6" />
          </Link>
        </div>
      </main>
    </PayPalScriptProvider>
  )
}