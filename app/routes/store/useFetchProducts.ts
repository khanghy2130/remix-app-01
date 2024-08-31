import { useEffect, useState } from "react";
import { FetchTriggerType, FilterTag, SortType } from "./Types";
import { useOutletContext } from "@remix-run/react";
import { ContextProps } from "~/utils/types/ContextProps.type";
import { Tables } from "database.types";

type Params = {
    products: Tables<"PRODUCTS">[];
    setProducts: SetState<Tables<"PRODUCTS">[]>;

    fetchTrigger: FetchTriggerType;
    noMoreResult: boolean;
    setNoMoreResult: SetState<boolean>;
    fetchIsInProgress: boolean;
    setFetchIsInProgress: SetState<boolean>;

    searchQuery: string;
    showOnSalesOnly: boolean;
    chosenTags: FilterTag[];
    chosenSort: SortType;
    sortDescending: boolean;
};

export default function useFetchProducts({
    products,
    setProducts,

    fetchTrigger,
    noMoreResult,
    setNoMoreResult,
    fetchIsInProgress,
    setFetchIsInProgress,

    searchQuery,
    showOnSalesOnly,
    chosenTags,
    chosenSort,
    sortDescending,
}: Params) {
    const { supabase } = useOutletContext<ContextProps>();

    // fetch results
    useEffect(() => {
        // new fetch? clear old results
        if (fetchTrigger.fetchMode === "NEW") {
            products = []; // immediate update for the fetch
            setProducts([]);
            setNoMoreResult(false);
        }

        const controller = new AbortController();
        const signal = controller.signal;

        (async function () {
            const FETCH_LIMIT = 5;
            try {
                setFetchIsInProgress(true);

                // build the query
                const query = supabase
                    .from("PRODUCTS")
                    .select("*")
                    .range(products.length, products.length + FETCH_LIMIT - 1);

                // text search
                if (searchQuery.length !== 0) {
                    query.textSearch("title", searchQuery, {
                        type: "websearch",
                    });
                }

                // on sale filter
                if (showOnSalesOnly) {
                    query.gt("discount", 0);
                }

                // tags
                if (chosenTags.length !== 0) {
                    const tagIds = chosenTags.map((chosenTag) => chosenTag.id);
                    const { data: productIds, error } = await supabase.rpc(
                        "get_product_ids_by_tags",
                        { tag_ids: tagIds },
                    );

                    if (error) throw error;

                    query.in(
                        "id",
                        productIds.map((tpi) => tpi.product_id),
                    );
                }

                // sort
                if (chosenSort === "TITLE") {
                    query.order("title", { ascending: !sortDescending });
                } else if (chosenSort === "RATING") {
                    query.order("average_rating", {
                        ascending: !sortDescending,
                    });
                } else if (chosenSort === "PRICE") {
                    query.order("price_with_discount", {
                        ascending: !sortDescending,
                    });
                }

                const { data, error } = await query.abortSignal(signal);

                if (error) throw error;

                setProducts([...products, ...data]);

                // no more result?
                if (data.length < FETCH_LIMIT) {
                    setNoMoreResult(true);
                }
            } catch (error: unknown) {
                if (error instanceof Error) {
                    if (error.name === "AbortError") {
                        console.log("Fetch aborted");
                    } else {
                        console.error("Fetch error:", error);
                    }
                }
            } finally {
                setFetchIsInProgress(false);
            }
        })();

        return () => {
            controller.abort();
        };
    }, [fetchTrigger]);
}
