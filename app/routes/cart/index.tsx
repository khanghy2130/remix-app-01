import { Link, useOutletContext, useSearchParams } from "@remix-run/react";
import { useEffect, useRef, useState } from "react";
import { ContextProps } from "~/utils/types/ContextProps.type";
import { CartItemType } from "./CartItemType";
import CartItem from "./CartItem";
import { MetaFunction } from "@remix-run/node";

export const meta: MetaFunction = () => {
    return [{ title: "My cart" }];
};

export default function CartPage() {
    const { supabase, user, addNotification, setRawCartItems } =
        useOutletContext<ContextProps>();
    const [cartItems, setCartItems] = useState<CartItemType[]>([]);

    const [searchParams, setSearchParams] = useSearchParams();
    const insufficientStockItem = searchParams.get("insufficientStockItem");
    const notifSentRef = useRef(false);

    // receive insufficient in stock error
    useEffect(() => {
        if (insufficientStockItem && !notifSentRef.current) {
            addNotification(
                `Insufficient stock for "${insufficientStockItem}"`,
                "FAIL",
            );

            searchParams.delete("insufficientStockItem");
            setSearchParams(searchParams);
            notifSentRef.current = true;
        }
    }, [insufficientStockItem]);

    // fetch items in cart if logged in
    useEffect(() => {
        if (!user) return;
        (async function () {
            const { data, error } = await supabase
                .from("CARTS")
                .select(
                    `
                    id,
                    quantity,
                    product:PRODUCTS (
                        id,
                        title,
                        price_with_discount,
                        quantity
                    )
                `,
                )
                .eq("user_id", user.id);

            if (error) {
                console.error("Error fetching items in cart", error);
                addNotification("Error fetching items in cart", "FAIL");
                return;
            }
            setCartItems(data);
            setRawCartItems(
                data.map((item) => ({
                    quantity: item.quantity,
                    product_id: item.product!.id,
                })),
            );
        })();
    }, []);

    // unauthenticated render
    if (!user) {
        return (
            <div className="flex flex-col items-center">
                <h1 className="text-xl">Log in to see your cart.</h1>
                <Link to="/login">
                    <button className="mt-3 rounded-md bg-primaryColor px-3 py-1 text-xl font-medium text-primaryTextColor hover:bg-primaryColorMuted">
                        Login
                    </button>
                </Link>
            </div>
        );
    }

    // assert non null
    const totalCost = cartItems.reduce(
        (prev, cur) => prev + cur.product!.price_with_discount! * cur.quantity,
        0,
    );

    return (
        <div className="flex w-full max-w-[800px] flex-col">
            <h1 className="px-2 text-2xl font-medium">My cart</h1>
            <div className="mt-2 flex w-full flex-col px-2">
                {cartItems.map((cartItem) => (
                    <CartItem
                        key={cartItem.id}
                        setCartItems={setCartItems}
                        cartItems={cartItems}
                        cartItem={cartItem}
                    />
                ))}
            </div>
            {cartItems.length === 0 ? (
                <p className="mt-10 text-center text-lg text-textColor2">
                    No items in cart.
                </p>
            ) : (
                <div className="mt-4 flex w-full flex-col items-end px-4">
                    <p className="w-full text-right text-2xl font-medium">
                        Total: ${totalCost.toFixed(2)}
                    </p>
                    <Link to="/pay">
                        <button
                            disabled={cartItems.length === 0}
                            className="mt-4 rounded-lg bg-primaryColor px-6 py-2 text-xl font-medium text-primaryTextColor hover:bg-primaryColorMuted"
                            onClick={() => {
                                notifSentRef.current = false;
                            }}
                        >
                            Checkout
                        </button>
                    </Link>
                </div>
            )}
        </div>
    );
}
