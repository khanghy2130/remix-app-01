import { Link, useOutletContext } from "@remix-run/react";

import { ContextProps } from "~/utils/types/ContextProps.type";
import MyWishlist from "./wishlist/MyWishlist";
import MyOrders from "./orders/MyOrders";
import MyReviews from "./reviews/MyReviews";
import ProfileInfo from "./profile_info/ProfileInfo";
import { MetaFunction } from "@remix-run/node";

export const meta: MetaFunction = () => {
    return [{ title: "My profile" }];
};

export default function Profile() {
    const { user } = useOutletContext<ContextProps>();

    // unauthenticated render
    if (!user) {
        return (
            <div className="flex flex-col items-center">
                <h1 className="text-xl">Log in to see your profile.</h1>
                <Link to="/login">
                    <button className="mt-3 rounded-md bg-primaryColor px-3 py-1 text-xl font-medium text-primaryTextColor hover:bg-primaryColorMuted">
                        Login
                    </button>
                </Link>
            </div>
        );
    }

    return (
        <div className="relative flex w-full max-w-[1200px] flex-col md:flex-row md:items-start">
            <ProfileInfo />

            <div className="mt-10 flex flex-grow flex-col px-4 md:mt-0">
                <MyWishlist />
                <MyOrders />
                <MyReviews />
            </div>
        </div>
    );
}
